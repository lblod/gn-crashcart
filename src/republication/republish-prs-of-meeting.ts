import { querySudo as query, updateSudo as update } from '@lblod/mu-auth-sudo';
import { writeFileSync } from 'fs';
import { sparqlEscapeString, sparqlEscapeUri } from 'mu';
import { fetchTaskifiedEndpoint, waitForMuTask } from '../fetch-task';
import { getUriForUuid } from '../get-uri-for-uuid';
import { setTimeout } from 'timers/promises';
import {
  gnAllConfigs,
  gnPublishedResource,
} from '../gn-published-resource-cascade';
import { makeMigrationTimestamp } from '../make-migration-timestamp';
import { writeCascadingMigrations } from '../write-cascading-delete-migrations';
import { findPublishedResources } from './published-resource-utils';
import { findDirForMeeting } from './dir-utils';

export type HeaderList = [string, string][];
export async function republishAllPrsOfMeeting(
  meetingUuid: string,
  headers: HeaderList,
  includeTreatmentsInNotulen: boolean
) {
  const meetingUri = await getUriForUuid(meetingUuid);
  const meeting = sparqlEscapeUri(meetingUri);

  const log: string[] = [];
  const queryString = `
  PREFIX ext: <http://mu.semte.ch/vocabularies/ext/>
  SELECT ?repubUri WHERE {
    ${meeting} ext:shouldRepublish ?repubUri.
  }`;
  const results = await query<{ repubUri: string }>(queryString);
  const uris = results.results.bindings.map((b) => b.repubUri.value);
  await scheduleRepublications(uris, headers, includeTreatmentsInNotulen);

  await buildReinsertMigrations(log, meetingUri, meetingUuid);

  writeFileSync(
    `${findDirForMeeting(meetingUuid, 'gn')}/republication-log`,
    log.join('\n')
  );
}
async function scheduleRepublications(
  uris: string[],
  headers: HeaderList,
  includeTreatmentsInNotulen: boolean
) {
  const treatments = [];
  const decisionLists = [];
  const notulen = [];
  const agendas = [];
  for (const uri of uris) {
    if (uri.includes('behandeling')) {
      treatments.push(uri);
    } else if (uri.includes('notulen')) {
      notulen.push(uri);
    } else if (uri.includes('besluitenlijst')) {
      decisionLists.push(uri);
    } else if (uri.includes('agenda')) {
      agendas.push(uri);
    } else {
      throw new Error(`Got publication uri of unknown class: ${uri}`);
    }
  }

  if (agendas.length) {
    await republishMany(agendas, headers, false);
  }
  if (decisionLists.length) {
    await republishMany(decisionLists, headers, true);
  }
  let treatmensToPublish: string[] = [];

  if (notulen.length) {
    // we don't individually publish the treatments, but rather include them in
    // the body to the notulen publication

    const treatmentUris = [];
    // /signing/notulen/publish/:zittingIdentifier/:publicationDate/:sessionId
    const notulenSession = notulen[0].split('/')[6];
    if (!notulenSession) {
      throw new Error('couldnt get session from notulen');
    }
    if (treatments.length) {
      for (const treatment of treatments) {
        // should look like
        // /signing/behandeling/publish/:zittingIdentifier/:behandelingUuid/:publicationDate/:sessionId
        // leading slash also generates an empty split
        const split = treatment.split('/');
        const uuid = split[5];
        const sessionId = split[7];
        console.log('includeTreatments is', includeTreatmentsInNotulen);
        console.log('notulensession is', notulenSession);
        console.log('sessionId is', sessionId);
        if (sessionId === notulenSession && includeTreatmentsInNotulen) {
          const uri = await getUriForUuid(uuid);
          treatmentUris.push(uri);
          console.log('found treatment to publish along with notulen:', uri);
        } else {
          treatmensToPublish.push(treatment);
        }
      }
    }

    await republish(
      notulen[0],
      [
        ...headers.filter((h) => h[0] !== 'content-length'),
        ['Content-Type', 'application/vnd.api+json'],
      ],
      true,
      JSON.stringify({ 'public-behandeling-uris': treatmentUris })
    );
  } else if (treatments.length) {
    // there were no notulen, so we just publish the individual treatments
    // await republishMany(treatments, headers, false);
    treatmensToPublish = treatments;
  }
  if (treatmensToPublish.length) {
    await republishMany(treatmensToPublish, headers, false);
  }
}
async function republishMany(
  uris: string[],
  headers: HeadersInit,
  taskified: boolean,
  body?: BodyInit
) {
  for (const uri of uris) {
    await republish(uri, headers, taskified, body);
  }
}
async function republish(
  uri: string,
  headers: HeadersInit,
  taskified: boolean,
  body?: BodyInit
) {
  let fetchOptions: RequestInit = { method: 'POST', headers };

  await setTimeout(500, undefined);
  if (body) {
    fetchOptions = { ...fetchOptions, body };
  }
  if (taskified) {
    const taskId = await fetchTaskifiedEndpoint(
      `http://prepublish${uri}`,
      fetchOptions
    );

    await waitForMuTask(taskId, { headers });
  } else {
    await fetch(`http://prepublish${uri}`, fetchOptions);
  }
  await update(`
    PREFIX ext: <http://mu.semte.ch/vocabularies/ext/>
    DELETE {
      GRAPH ?g {
	?z ext:shouldRepublish ${sparqlEscapeString(uri)}.
      }
    } WHERE {
      GRAPH ?g {
	?z ext:shouldRepublish ${sparqlEscapeString(uri)}.
      }
    }`);
}

async function buildReinsertMigrations(
  log: string[],
  meetingUri: string,
  meetingUuid: string
) {
  const newPrs = await findPublishedResources(log, meetingUri);

  const meetingDir = findDirForMeeting(meetingUuid, 'gn');

  for (const pr of newPrs) {
    const timestamp = makeMigrationTimestamp(new Date());
    const outputDir = `${meetingDir}/${timestamp}-insert-pr-${pr.uuid}`;
    await writeCascadingMigrations({
      rootConfig: gnPublishedResource,
      allConfigs: gnAllConfigs,
      rootUri: pr.uri,
      outputDir,
      deleteOrInsert: 'INSERT',
      filenameGenerator: (result, index) =>
        `${makeMigrationTimestamp(new Date())}-insert-${result.config.name}-${result.uuid ?? index}.sparql`,

      opts: {
        checkForRelationshipsWithoutType: true,
        logEmptyRelationships: false,
      },
    });
  }
}

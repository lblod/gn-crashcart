import { updateSudo as update } from '@lblod/mu-auth-sudo';
import { readdirSync, readFileSync, writeFileSync } from 'fs';
import { getUriForUuid } from '../get-uri-for-uuid';
import {
  findPublishedResources,
  getTimestampOfPublishedResource,
  PublishedResourceHandle,
} from './published-resource-utils';
import { v4 as uuidv4 } from 'uuid';
import { sparqlEscapeString, sparqlEscapeUri } from 'mu';
import { makeMigrationTimestamp } from '../make-migration-timestamp';
import { writeCascadingMigrations } from '../write-cascading-delete-migrations';
import {
  gnAllConfigs,
  gnPublishedResource,
} from '../gn-published-resource-cascade';
import { getPublicationUri } from './get-publication-uri';

export async function removePublishedResourcesOfMeeting(meetingUuid: string) {
  const log: string[] = [];

  const meetingUri = await getUriForUuid(meetingUuid);
  const prs = await findPublishedResources(log, meetingUri);
  await deletePublishedResources(log, meetingUri, meetingUuid, prs);
  writeFileSync(`/app/clear-prs-of-meeting-${meetingUuid}`, log.join('\n'));
}
export async function deletePublishedResources(
  log: string[],
  meetingUri: string,
  meetingUuid: string,
  prs: PublishedResourceHandle[]
) {
  const timestamp = makeMigrationTimestamp(new Date());
  const meetingDir = `/app/${timestamp}-fix-meeting-${meetingUuid}`;

  const meetingRepublishList = `${meetingDir}/republish.json`;
  const republishUris: string[] = [];
  for (const pr of prs) {
    const outputDir = `${meetingDir}/${timestamp}-delete-pr-${pr.uuid}`;
    await writeCascadingMigrations({
      rootConfig: gnPublishedResource,
      allConfigs: gnAllConfigs,
      rootUri: pr.uri,
      outputDir,
      filenameGenerator: (result, index) =>
        `${timestamp}-delete-${result.config.name}-${result.uuid ?? index}.sparql`,

      opts: {
        checkForRelationshipsWithoutType: true,
        logEmptyRelationships: false,
      },
    });

    const sessionUuid = await makeFakeSession(pr);
    log.push(`Made fake session with id: ${sessionUuid} for pr: ${pr.uri}`);
    const prTimestamp = await getTimestampOfPublishedResource(pr);
    log.push(`Timestamp is ${prTimestamp}`);
    const publicationUri = await getPublicationUri(
      pr,
      meetingUuid,
      prTimestamp,
      sessionUuid
    );
    log.push(`uri should be: ${publicationUri}`);
    await executeDeletes(outputDir);

    republishUris.push(publicationUri);
  }
  await saveMeetingRepublishUris(meetingUri, republishUris);
  writeFileSync(
    meetingRepublishList,
    JSON.stringify({ uuid: meetingUuid, republishUris }),
    'utf8'
  );
}

export async function makeFakeSession(
  pr: PublishedResourceHandle
): Promise<string> {
  const publishedResource = sparqlEscapeUri(pr.uri);
  const sessionUuid = uuidv4();
  const queryString = `
  PREFIX sign: <http://mu.semte.ch/vocabularies/ext/signing/>
  PREFIX muSession: <http://mu.semte.ch/vocabularies/session/>
  PREFIX ext: <http://mu.semte.ch/vocabularies/ext/>
  PREFIX foaf: <http://xmlns.com/foaf/0.1/>
  PREFIX mu: <http://mu.semte.ch/vocabularies/core/>
  INSERT {
    GRAPH <http://mu.semte.ch/graphs/sessions> {
      <http://mu.semte.ch/sessions/${sessionUuid}> mu:uuid ${sparqlEscapeString(sessionUuid)}.
      <http://mu.semte.ch/sessions/${sessionUuid}> muSession:account ?account.
      <http://mu.semte.ch/sessions/${sessionUuid}> ext:sessionRole ?role.
      <http://mu.semte.ch/sessions/${sessionUuid}> ext:fakeSession "yes".
    }

  } WHERE {
    ${publishedResource} sign:signatory ?signPerson;
    sign:signatoryRoles ?role.

    ?signPerson foaf:account ?account.
    
  }`;
  await update(queryString);
  return sessionUuid;
}
export async function saveMeetingRepublishUris(
  meetingUri: string,
  uris: string[]
) {
  const meeting = sparqlEscapeUri(meetingUri);
  const queryString = `
  PREFIX ext: <http://mu.semte.ch/vocabularies/ext/>
  INSERT DATA {
    GRAPH <http://mu.semte.ch/graphs/public> {
      ${uris
        .map(
          (uri) => `${meeting} ext:shouldRepublish ${sparqlEscapeString(uri)} .`
        )
        .join('\n')}
    }
  }`;
  await update(queryString);
}

export async function executeDeletes(path: string) {
  const files = readdirSync(path);
  for (const file of files) {
    if (file.split('.')[1] === 'sparql') {
      console.log('executing migration: ', file);
      const queryString = readFileSync(`${path}/${file}`, 'utf8');
      await update(queryString);
    }
  }
}

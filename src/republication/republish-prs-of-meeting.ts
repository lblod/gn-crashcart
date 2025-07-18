import { querySudo as query } from '@lblod/mu-auth-sudo';
import { writeFileSync } from 'fs';
import { sparqlEscapeUri } from 'mu';
import { fetchTaskifiedEndpoint, waitForMuTask } from '../fetch-task';
import { getUriForUuid } from '../get-uri-for-uuid';
import {
  gnAllConfigs,
  gnPublishedResource,
} from '../gn-published-resource-cascade';
import { makeMigrationTimestamp } from '../make-migration-timestamp';
import { writeCascadingMigrations } from '../write-cascading-delete-migrations';
import { findPublishedResources } from './published-resource-utils';

export async function republishAllPrsOfMeeting(
  meetingUuid: string,
  headers: HeadersInit
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
  for (const republishUri of uris) {
    await republish(republishUri, headers);
  }

  await buildReinsertMigrations(log, meetingUri, meetingUuid);

  writeFileSync(`/app/clear-prs-of-meeting-${meetingUuid}`, log.join('\n'));
}

async function republish(uri: string, headers: HeadersInit) {
  if (uri.includes('notulen') || uri.includes('besluitenlijst')) {
    const taskId = await fetchTaskifiedEndpoint(`http://prepublish${uri}`, {
      method: 'POST',
      headers,
    });

    await waitForMuTask(taskId, { headers });
  } else {
    await fetch(`http://prepublish${uri}`, { method: 'POST', headers });
  }
}

async function buildReinsertMigrations(
  log: string[],
  meetingUri: string,
  meetingUuid: string
) {
  const newPrs = await findPublishedResources(log, meetingUri);

  const timestamp = makeMigrationTimestamp(new Date());
  const meetingDir = `/app/fix-meeting-${meetingUuid}`;

  for (const pr of newPrs) {
    const outputDir = `${meetingDir}/${timestamp}-delete-pr-${pr.uuid}`;
    await writeCascadingMigrations({
      rootConfig: gnPublishedResource,
      allConfigs: gnAllConfigs,
      rootUri: pr.uri,
      outputDir,
      deleteOrInsert: 'INSERT',
      filenameGenerator: (result, index) =>
        `${timestamp}-insert-${result.config.name}-${result.uuid ?? index}.sparql`,

      opts: {
        checkForRelationshipsWithoutType: true,
        logEmptyRelationships: false,
      },
    });
  }
}

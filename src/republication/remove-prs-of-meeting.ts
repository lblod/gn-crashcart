import { updateSudo as update, querySudo as query } from '@lblod/mu-auth-sudo';
import { appendFileSync, readdirSync, readFileSync, writeFileSync } from 'fs';
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
import { findDirForMeeting } from './dir-utils';

export async function removePublishedResourcesOfMeeting(meetingUuid: string) {
  const log: string[] = [];

  const meetingUri = await getUriForUuid(meetingUuid);
  const prs = await findPublishedResources(log, meetingUri);
  await deletePublishedResources(log, meetingUri, meetingUuid, prs);
  writeFileSync(
    `${findDirForMeeting(meetingUuid, 'gn')}/deletion-log`,
    log.join('\n')
  );
}
export async function deletePublishedResources(
  log: string[],
  meetingUri: string,
  meetingUuid: string,
  prs: PublishedResourceHandle[]
) {
  const meetingDir = findDirForMeeting(meetingUuid, 'gn', { forceNew: true });

  const meetingRepublishList = `${meetingDir}/republish.json`;
  const republishUris: string[] = [];
  for (const pr of prs) {
    const timestamp = makeMigrationTimestamp(new Date());
    const outputDir = `${meetingDir}/${timestamp}-delete-pr-${pr.uuid}`;
    await writeCascadingMigrations({
      rootConfig: gnPublishedResource,
      allConfigs: gnAllConfigs,
      rootUri: pr.uri,
      outputDir,
      filenameGenerator: (result, index) =>
        `${makeMigrationTimestamp(new Date())}-delete-${result.config.name}-${result.uuid ?? index}.sparql`,

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
    await executeMigrationsNoThrow(outputDir);

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
  const queryForExistingSession = `
  PREFIX sign: <http://mu.semte.ch/vocabularies/ext/signing/>
  PREFIX muSession: <http://mu.semte.ch/vocabularies/session/>
  PREFIX ext: <http://mu.semte.ch/vocabularies/ext/>
  PREFIX foaf: <http://xmlns.com/foaf/0.1/>
  PREFIX mu: <http://mu.semte.ch/vocabularies/core/>
  SELECT ?sessionId WHERE {
    ${publishedResource} sign:signatory ?signPerson.

    ?signPerson mu:uuid ?personId.
    ?signPerson foaf:account ?account.
    BIND(URI(CONCAT("http://mu.semte.ch/sessions/", ?personId)) as ?sessionUri)
    ?sessionUri mu:uuid ?sessionId.
  }`;
  const existingSessionResult = await query<{ sessionId: string }>(
    queryForExistingSession
  );
  if (existingSessionResult.results.bindings.length) {
    return existingSessionResult.results.bindings[0].sessionId.value;
  }

  const sessionUuid = uuidv4();
  const queryString = `
  PREFIX sign: <http://mu.semte.ch/vocabularies/ext/signing/>
  PREFIX muSession: <http://mu.semte.ch/vocabularies/session/>
  PREFIX ext: <http://mu.semte.ch/vocabularies/ext/>
  PREFIX foaf: <http://xmlns.com/foaf/0.1/>
  PREFIX mu: <http://mu.semte.ch/vocabularies/core/>
  INSERT {
    GRAPH <http://mu.semte.ch/graphs/sessions> {
      ?sessionUri mu:uuid ${sparqlEscapeString(sessionUuid)}.
      ?sessionUri muSession:account ?account.
      ?sessionUri ext:sessionRole ?role.
      ?sessionUri ext:fakeSession "yes".
    }

  } WHERE {
    ${publishedResource} sign:signatory ?signPerson;
    sign:signatoryRoles ?role.

    ?signPerson mu:uuid ?personId.
    BIND(URI(CONCAT("http://mu.semte.ch/sessions/", ?personId)) as ?sessionUri)
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

const MIGRATION_ERRORS = '/app/migration-error-log';
export async function executeMigrations(path: string) {
  const files = readdirSync(path);
  for (const file of files) {
    if (file.split('.')[1] === 'sparql') {
      console.log('executing migration: ', file);
      const queryString = readFileSync(`${path}/${file}`, 'utf8');
      await update(queryString);
    }
  }
}
/**
 * Careful - does not guarantee execution, which means you cannot depend on the
 * state
 * Useful for cases where the main output is writing migrations, and you can execute them
 * separately if one fails
 */
export async function executeMigrationsNoThrow(path: string) {
  try {
    return await executeMigrations(path);
  } catch (e) {
    const timeStamp = new Date().toISOString();
    console.error('ERROR - FAILED MIGRATION - CHECK LOGS');
    appendFileSync(
      MIGRATION_ERRORS,
      `${timeStamp} - ${JSON.stringify(e)}`,
      'utf8'
    );
  }
}

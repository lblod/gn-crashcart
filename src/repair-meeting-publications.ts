import { sparqlEscapeString, sparqlEscapeUri } from 'mu';
import { querySudo as query, updateSudo as update } from '@lblod/mu-auth-sudo';
import { readdirSync, readFileSync, writeFileSync } from 'fs';
import { writeCascadingDeleteMigrations } from './write-cascading-delete-migrations';
import {
  gnAllConfigs,
  gnPublishedResource,
} from './gn-published-resource-cascade';
import { makeMigrationTimestamp } from './make-migration-timestamp';

import { v4 as uuidv4 } from 'uuid';
import { fetchTaskifiedEndpoint, waitForMuTask } from './fetch-task';
import { getUriForUuid } from './get-uri-for-uuid';

const KIND_GEPLAND_UUID = 'bdf68a65-ce15-42c8-ae1b-19eeb39e20d0';
const KIND_AANVULLENDE_UUID = 'b122db75-fd93-4f03-b57a-2a9269289782';
const KIND_SPOEDEISENDE_UUID = '8c143571-175c-4d13-acaa-9f471180a8c9';

const KIND_LABEL_TO_UUID_MAP = new Map(
  Object.entries({
    gepland: KIND_GEPLAND_UUID,
    aanvullend: KIND_AANVULLENDE_UUID,
    spoedeisend: KIND_SPOEDEISENDE_UUID,
  })
);
export async function repairMeetingPublications(meetingUuid: string) {
  const log: string[] = [];

  const meetingUri = await getUriForUuid(meetingUuid);
  const prs = await findPublishedResources(log, meetingUri);
  await deletePublishedResources(log, meetingUri, meetingUuid, prs);
  writeFileSync(`/app/clear-prs-of-meeting-${meetingUuid}`, log.join('\n'));
}
export async function getUuidOfMeeting(meetingUri: string) {
  const queryString = `
  PREFIX mu: <http://mu.semte.ch/vocabularies/core/>
  SELECT ?uuid WHERE {${sparqlEscapeUri(meetingUri)} mu:uuid ?uuid}
  `;
  const result = await query<{ uuid: string }>(queryString);
  return result.results.bindings[0].uuid.value;
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
export async function getTimestampOfPublishedResource(
  pr: PublishedResourceHandle
) {
  const publishedResource = sparqlEscapeUri(pr.uri);
  const queryString = `
  PREFIX dct: <http://purl.org/dc/terms/>
  SELECT ?timeStamp WHERE {
    ${publishedResource} dct:created ?timeStamp.
  }`;

  const results = await query<{ timeStamp: string }>(queryString);

  return results.results.bindings[0].timeStamp.value;
}
const typeMap: Record<string, string> = {
  'http://data.vlaanderen.be/ns/besluitvorming#Agenda': 'agenda',
  'http://mu.semte.ch/vocabularies/ext/VersionedBesluitenLijst':
    'besluitenlijst',
  'http://mu.semte.ch/vocabularies/ext/VersionedBehandeling': 'behandeling',
  'http://mu.semte.ch/vocabularies/ext/VersionedNotulen': 'notulen',
};
export async function getPublicationUri(
  pr: PublishedResourceHandle,
  meetingUuid: string,
  timeStamp: string,
  sessionId: string
) {
  const publishedResource = sparqlEscapeUri(pr.uri);
  const queryString = `
  PREFIX dct: <http://purl.org/dc/terms/>
  PREFIX bv: <http://data.vlaanderen.be/ns/besluitvorming#>
  PREFIX ext: <http://mu.semte.ch/vocabularies/ext/>
  PREFIX mu: <http://mu.semte.ch/vocabularies/core/>
  SELECT ?type ?agendaType ?behandelingUuid WHERE {
    ${publishedResource} dct:subject ?versionedThing.
      ?versionedThing a ?type.
      OPTIONAL {
      ?versionedThing bv:agendaType ?agendaType. }
      OPTIONAL {
	?versionedThing ext:behandeling ?behandeling.
	  ?behandeling mu:uuid ?behandelingUuid.
      }
  }`;
  const result = await query<{
    type: string;
    agendaType: string;
    behandelingUuid: string;
  }>(queryString);
  const publicationType = result.results.bindings[0].type.value;
  const typeLabel = typeMap[publicationType];
  switch (typeLabel) {
    case 'besluitenlijst':
      return `/signing/besluitenlijst/publish/${meetingUuid}/${timeStamp}/${sessionId}`;

    case 'notulen':
      return `/signing/notulen/publish/${meetingUuid}/${timeStamp}/${sessionId}`;

    case 'agenda':
      const kindLabel = result.results.bindings[0].agendaType.value;
      if (!kindLabel) throw new Error('agenda without kindlabel');
      const agendaKindUuid = KIND_LABEL_TO_UUID_MAP.get(kindLabel);
      return `/signing/notulen/publish/${agendaKindUuid}/${meetingUuid}/${timeStamp}/${sessionId}`;
    case 'behandeling':
      const behandelingUuid = result.results.bindings[0].behandelingUuid.value;
      if (!behandelingUuid) throw new Error('behandeling type without uuid');

      return `/signing/notulen/publish/${meetingUuid}/${behandelingUuid}/${timeStamp}/${sessionId}`;

    default:
      throw new Error(`publishedresource had unknown type: "${typeLabel}"`);
  }
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
    await writeCascadingDeleteMigrations({
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
  const taskId = await fetchTaskifiedEndpoint(`http://prepublish${uri}`, {
    method: 'POST',
    headers,
  });

  await waitForMuTask(taskId, { headers });
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
    await writeCascadingDeleteMigrations({
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

interface PublishedResourceHandle {
  uri: string;
  uuid: string;
}
export async function findPublishedResources(
  log: string[],
  meetingUri: string
): Promise<PublishedResourceHandle[]> {
  const meeting = sparqlEscapeUri(meetingUri);

  const queryString = `
  PREFIX besluit: <http://data.vlaanderen.be/ns/besluit#>
  PREFIX bv: <http://data.vlaanderen.be/ns/besluitvorming#>
  PREFIX ext: <http://mu.semte.ch/vocabularies/ext/>
  PREFIX dct: <http://purl.org/dc/terms/>
  PREFIX sign: <http://mu.semte.ch/vocabularies/ext/signing/>
  PREFIX mu: <http://mu.semte.ch/vocabularies/core/>

  SELECT DISTINCT ?pr ?uuid WHERE {
    VALUES ?meeting { ${meeting} }
    ?meeting a besluit:Zitting.
    ?pr a sign:PublishedResource.
    ?pr mu:uuid ?uuid.
    { 
      ?meeting besluit:heeftBesluitenlijst ?bl. 
      { 
	?pr ext:publishesBesluitenlijst ?bl. 
      } UNION { ?pr dct:subject ?bl. }
    } UNION { 
      ?meeting ext:hasVersionedBehandeling ?behandeling. 
      {
	?pr ext:publishesBehandeling ?behandeling.
      } UNION { ?pr dct:subject ?behandeling. }
    } UNION {
      ?meeting ext:hasVersionedNotulen ?notulen. 
      {
	?pr ext:publishesNotulen ?notulen.
      } UNION { ?pr dct:subject ?notulen. }
    } UNION {
      ?agenda bv:isAgendaVoor ?meeting.
      {
	?pr ext:publishesAgenda ?agenda.
      } UNION { ?pr dct:subject ?agenda. }
    }
  }
  `;

  const result = await query<{ pr: string; uuid: string }>(queryString);
  const prs: PublishedResourceHandle[] = result.results.bindings.map((b) => ({
    uri: b.pr.value,
    uuid: b.uuid.value,
  }));

  log.push(
    `
	   Found ${prs.length} publishedResources for ${meetingUri}.
	     ${prs.join('\n')}
	   `.trim()
  );
  return prs;
}

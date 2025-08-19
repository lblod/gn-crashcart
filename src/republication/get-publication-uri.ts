import { querySudo as query } from '@lblod/mu-auth-sudo';
import { sparqlEscapeUri } from 'mu';
import { PublishedResourceHandle } from './published-resource-utils';

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
  const publicationType = result.results.bindings[0]?.type?.value;
  if (!publicationType) {
    throw new Error(`did not find a publicationType for ${publishedResource}`);
  }
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
      return `/signing/agenda/publish/${agendaKindUuid}/${meetingUuid}/${timeStamp}/${sessionId}`;
    case 'behandeling':
      const behandelingUuid = result.results.bindings[0].behandelingUuid.value;
      if (!behandelingUuid) throw new Error('behandeling type without uuid');

      return `/signing/behandeling/publish/${meetingUuid}/${behandelingUuid}/${timeStamp}/${sessionId}`;

    default:
      throw new Error(`publishedresource had unknown type: "${typeLabel}"`);
  }
}

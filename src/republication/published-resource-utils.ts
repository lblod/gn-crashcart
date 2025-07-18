import { querySudo as query } from '@lblod/mu-auth-sudo';
import { sparqlEscapeUri } from 'mu';

export interface PublishedResourceHandle {
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

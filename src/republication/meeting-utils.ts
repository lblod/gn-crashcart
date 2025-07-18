import { querySudo as query } from '@lblod/mu-auth-sudo';
import { sparqlEscapeUri } from 'mu';

export async function getUuidOfMeeting(meetingUri: string) {
  const queryString = `
  PREFIX mu: <http://mu.semte.ch/vocabularies/core/>
  SELECT ?uuid WHERE {${sparqlEscapeUri(meetingUri)} mu:uuid ?uuid}
  `;
  const result = await query<{ uuid: string }>(queryString);
  return result.results.bindings[0].uuid.value;
}

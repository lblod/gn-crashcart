import { querySudo } from '@lblod/mu-auth-sudo';
import { sparqlEscapeString } from 'mu';
export async function getUriForUuid(uuid: string): Promise<string> {
  const query = `
  PREFIX mu: <http://mu.semte.ch/vocabularies/core/>
  SELECT DISTINCT ?uri WHERE {
    ?uri mu:uuid ${sparqlEscapeString(uuid)}
  }`;
  const result = await querySudo<{ uri: string }>(query);
  if (result.results.bindings.length === 0) {
    throw new Error(`Resource with uuid ${uuid} not found`);
  }
  return result.results.bindings[0].uri.value;
}

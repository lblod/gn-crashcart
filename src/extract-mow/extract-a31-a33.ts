import { query } from 'mu';
import { writeCascadingMigrationsForResource } from '../write-cascading-delete-migrations';
import { allNewSignConfigs, roadsign } from './sign-cascade';

export async function extractSigns() {
  const signs = await getSigns();
  for (const sign of signs) {
    writeCascadingMigrationsForResource({
      uuid: sign.uuid,
      allConfigs: allNewSignConfigs,
      rootUri: sign.uri,
      filenameInfix: 'correct-signs',
      rootConfig: roadsign()(undefined),
      deleteOrInsert: 'INSERT',
      graphFilter: ['http://mu.semte.ch/graphs/mow/registry'],
    });
  }
}
/**
 * Extract info about A31 and A33
 */
async function getSigns() {
  const queryStr = `
  PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
  PREFIX mu: <http://mu.semte.ch/vocabularies/core/>
  PREFIX mobiliteit: <https://data.vlaanderen.be/ns/mobiliteit#>
  SELECT ?uri ?uuid WHERE {
    VALUES ?code { "A31" "A33" }
    ?uri a mobiliteit:Verkeersbordconcept;
	skos:prefLabel ?code;
          mu:uuid ?uuid.
  }`;
  const result = await query<{ uri: string; uuid: string }>(queryStr);
  return result.results.bindings.map((b) => ({
    uri: b.uri.value,
    uuid: b.uuid.value,
  }));
}

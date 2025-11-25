import { query } from 'mu';
import { writeCascadingMigrationsForResource } from '../write-cascading-delete-migrations';
import { codelistValue, variable } from './sign-cascade';

export async function extractVariables() {
  const vars = await getAllVariables();
  for (const variableId of vars) {
    writeCascadingMigrationsForResource({
      uuid: variableId.uuid,
      rootUri: variableId.uri,
      allConfigs: [variable, codelistValue].map((f) => f()(undefined)),
      rootConfig: variable()(undefined),
      filenameInfix: 'variable',
      deleteOrInsert: 'INSERT',
      graphFilter: ['http://mu.semte.ch/graphs/mow/registry'],
    });
  }
}

async function getAllVariables() {
  const queryStr = `
  PREFIX tribont: <https://w3id.org/tribont/core#>
  PREFIX mu: <http://mu.semte.ch/vocabularies/core/>
  PREFIX variable: <http://lblod.data.gift/vocabularies/variables/>
  PREFIX mobiliteit: <https://data.vlaanderen.be/ns/mobiliteit#>
  PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
  SELECT ?uri ?uuid WHERE {
    ?sign a mobiliteit:Verkeersbordconcept.
    ?sign skos:prefLabel ?code.
    ?sign mobiliteit:definieert ?uri.

    ?uri a variable:Variable;
	mu:uuid ?uuid.
    FILTER (?code NOT IN ("A33", "E9a-GVIIb", "E9a-GVIId", "E9j", "F113", "GIII", "GIX", "GXII", "M21", "M22", "M23", "M24"))
  }`;
  const result = await query<{ uri: string; uuid: string }>(queryStr);
  return result.results.bindings.map((b) => ({
    uri: b.uri.value,
    uuid: b.uuid.value,
  }));
}

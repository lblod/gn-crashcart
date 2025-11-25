import { query } from 'mu';
import { writeCascadingMigrationsForResource } from '../write-cascading-delete-migrations';
import { codelistValue, variable } from './sign-cascade';
import { uriMap } from './uri-mapping';

export async function extractVariables2() {
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
      uriMap: uriMap,
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

    VALUES ?code {"GIX"}
    ?sign a mobiliteit:Verkeersbordconcept.
    ?sign skos:prefLabel ?code.
    ?sign mobiliteit:definieert ?uri.

    ?uri a variable:Variable;
	mu:uuid ?uuid.
  }`;
  const result = await query<{ uri: string; uuid: string }>(queryStr);
  return result.results.bindings.map((b) => ({
    uri: b.uri.value,
    uuid: b.uuid.value,
  }));
}

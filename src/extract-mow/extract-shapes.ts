import { query } from 'mu';
import { writeCascadingMigrationsForResource } from '../write-cascading-delete-migrations';
import { dimension, tribontShape } from './sign-cascade';

export async function extractShapes() {
  const shapes = await getAllShapes();
  for (const shape of shapes) {
    writeCascadingMigrationsForResource({
      uuid: shape.uuid,
      rootUri: shape.uri,
      allConfigs: [tribontShape, dimension].map((f) => f()(undefined)),
      rootConfig: tribontShape()(undefined),
      filenameInfix: 'shape',
      deleteOrInsert: 'INSERT',
      graphFilter: ['http://mu.semte.ch/graphs/mow/registry'],
    });
  }
}

async function getAllShapes() {
  const queryStr = `
  PREFIX tribont: <https://w3id.org/tribont/core#>
  PREFIX mu: <http://mu.semte.ch/vocabularies/core/>
  PREFIX w3ic: <https://w3id.org/isCharacterisedBy#>
  PREFIX mobiliteit: <https://data.vlaanderen.be/ns/mobiliteit#>
  PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
  SELECT ?uri ?uuid WHERE {
    ?sign a mobiliteit:Verkeersbordconcept;
         skos:prefLabel ?code;
         w3ic:isCharacterisedBy ?uri.
    ?uri a tribont:Shape;
	mu:uuid ?uuid.

    FILTER (?code NOT IN ("A33", "E9a-GVIIb", "E9a-GVIId", "E9j", "F113", "GIII", "GIX", "GXII", "M21", "M22", "M23", "M24"))
  }`;
  const result = await query<{ uri: string; uuid: string }>(queryStr);
  return result.results.bindings.map((b) => ({
    uri: b.uri.value,
    uuid: b.uuid.value,
  }));
}

import { query } from 'mu';
import { writeCascadingMigrationsForResource } from '../write-cascading-delete-migrations';
import { dimension, tribontShape } from './sign-cascade';
import { uriMap } from './uri-mapping';

export async function extractShapes2() {
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
      uriMap: uriMap,
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

    VALUES ?code { "E9j" "F113" "GIII" "GXII" "M21" "M22" "M23" "M24"}
    ?sign a mobiliteit:Verkeersbordconcept;
         skos:prefLabel ?code;
         w3ic:isCharacterisedBy ?uri.
    ?uri a tribont:Shape;
	mu:uuid ?uuid.

  }`;
  const result = await query<{ uri: string; uuid: string }>(queryStr);
  return result.results.bindings.map((b) => ({
    uri: b.uri.value,
    uuid: b.uuid.value,
  }));
}

import { query } from 'mu';
import { writeCascadingDeleteMigrationsForResource } from '../write-cascading-delete-migrations';
import { fileDataObject, image } from './icon-cascade';

export async function collectImagesToRemove2() {
  const imgIds = await findImagesToRemove();
  for (const imgId of imgIds) {
    await writeCascadingDeleteMigrationsForResource({
      uuid: imgId.uuid,
      rootUri: imgId.uri,
      rootConfig: image()(undefined),
      allConfigs: [image, fileDataObject].map((f) => f()(undefined)),
      filenameInfix: 'prod-image',
      deleteOrInsert: 'DELETE',
      graphFilter: ['http://mu.semte.ch/graphs/mow/registry'],
    });
  }
}

/**
 * Finds images for signs we skipped in the first round
 */
export async function findImagesToRemove() {
  const queryStr = `

PREFIX mobiliteit: <https://data.vlaanderen.be/ns/mobiliteit#>
PREFIX foaf: <http://xmlns.com/foaf/0.1/>
PREFIX mu: <http://mu.semte.ch/vocabularies/core/>
PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
SELECT ?uri ?uuid WHERE {


  VALUES ?code {
"E9j"
"F113"
"GIII"
"M21"
"M22"
"M23"
"M24"
  }
  ?sign a mobiliteit:Verkeersbordconcept.
  ?sign mobiliteit:grafischeWeergave ?uri.
  ?sign skos:prefLabel ?code.
  ?uri a foaf:Image;
       mu:uuid ?uuid.

}`;

  const result = await query<{ uri: string; uuid: string }>(queryStr);
  return result.results.bindings.map((b) => ({
    uri: b.uri.value,
    uuid: b.uuid.value,
  }));
}

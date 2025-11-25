import { query } from 'mu';
import { writeCascadingMigrationsForResource } from '../write-cascading-delete-migrations';
import { fileDataObject, image } from './icon-cascade';
import { uriMap } from './uri-mapping';

export async function extractImages2() {
  const imageIds = await getImages();
  for (const imageId of imageIds) {
    await writeCascadingMigrationsForResource({
      uuid: imageId.uuid,
      rootUri: imageId.uri,
      allConfigs: [image, fileDataObject].map((f) => f()(undefined)),
      filenameInfix: 'qa-image',
      rootConfig: image()(undefined),
      deleteOrInsert: 'INSERT',
      graphFilter: ['http://mu.semte.ch/graphs/mow/registry'],

      uriMap: uriMap,
    });
  }
}

async function getImages() {
  const queryStr = `
  PREFIX foaf: <http://xmlns.com/foaf/0.1/>
  PREFIX mobiliteit: <https://data.vlaanderen.be/ns/mobiliteit#>
  PREFIX mu: <http://mu.semte.ch/vocabularies/core/>
  PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
  SELECT ?uri ?uuid WHERE {

    VALUES ?code { "E9j" "F113" "GIII"  "GXII" "M21" "M22" "M23" "M24" }
    ?sign a mobiliteit:Verkeersbordconcept;
          skos:prefLabel ?code;
	  mobiliteit:grafischeWeergave ?uri.
    ?uri a foaf:Image;
         mu:uuid ?uuid.

  }`;
  const result = await query<{ uri: string; uuid: string }>(queryStr);
  return result.results.bindings.map((b) => ({
    uri: b.uri.value,
    uuid: b.uuid.value,
  }));
}

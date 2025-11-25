import { query } from 'mu';
import { writeCascadingMigrationsForResource } from '../write-cascading-delete-migrations';
import { allIconConfigs, icon } from './icon-cascade';

export async function extractIcons() {
  const icons = await getAllIcons();
  for (const iconInstance of icons) {
    await writeCascadingMigrationsForResource({
      allConfigs: allIconConfigs,
      filenameInfix: 'Pictogram',
      rootConfig: icon()(undefined),
      uuid: iconInstance.uuid,
      rootUri: iconInstance.uri,
      deleteOrInsert: 'INSERT',
      graphFilter: ['http://mu.semte.ch/graphs/mow/registry'],
    });
  }
}
async function getAllIcons(): Promise<{ uri: string; uuid: string }[]> {
  const queryStr = `
  PREFIX mobiliteit: <https://data.vlaanderen.be/ns/mobiliteit#>
  PREFIX mu: <http://mu.semte.ch/vocabularies/core/>
  SELECT ?uri ?uuid WHERE {
    ?uri a mobiliteit:Pictogram;
         mu:uuid ?uuid.
  }`;

  const results = await query<{ uri: string; uuid: string }>(queryStr);
  return results.results.bindings.map((b) => ({
    uri: b.uri.value,
    uuid: b.uuid.value,
  }));
}

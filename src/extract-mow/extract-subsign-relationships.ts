import { query, sparqlEscapeUri } from 'mu';
import { makeMigrationTimestamp } from '../make-migration-timestamp';
import { writeFileSync } from 'fs';

interface Combo extends Record<string, string> {
  sign: string;
  subSign: string;
}

export async function extractSubsignRelationships() {
  const combos = await getRelationships();
  const ntrips = combos.map(toNTriple).join('\n');

  const migrationStr = `
  INSERT DATA {
    GRAPH <http://mu.semte.ch/graphs/mow/registry> {
      ${ntrips}
    }
  }`;
  const fileName = `${makeMigrationTimestamp(new Date())}-insert-new-subsign-rels.sparql`;
  const outDir = `/app/migrations`;
  const path = `${outDir}/${fileName}`;
  writeFileSync(path, migrationStr);
}

async function getRelationships() {
  const queryStr = `
  PREFIX mobiliteit: <https://data.vlaanderen.be/ns/mobiliteit#>
  PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
  SELECT ?sign ?subSign WHERE {
    ?sign a mobiliteit:Verkeersbordconcept;
	  skos:prefLabel ?code;
	  mobiliteit:heeftMogelijkOnderbord ?subSign.

    FILTER (?code NOT IN ("A33", "E9a-GVIIb", "E9a-GVIId", "E9j", "F113", "GIII", "GIX", "GXII", "M21", "M22", "M23", "M24"))

  }`;
  const result = await query<Combo>(queryStr);
  return result.results.bindings.map((b) => ({
    sign: b.sign.value,
    subSign: b.subSign.value,
  }));
}

function toNTriple({ sign, subSign }: Combo) {
  return `${sparqlEscapeUri(sign)} <https://data.vlaanderen.be/ns/mobiliteit#heeftMogelijkOnderbord> ${sparqlEscapeUri(subSign)}.`;
}

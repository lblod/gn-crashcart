import { query, sparqlEscapeUri } from 'mu';
import { makeMigrationTimestamp } from '../make-migration-timestamp';
import { writeFileSync } from 'fs';

interface ContainedCombo extends Record<string, string> {
  sign: string;
  containedSign: string;
}

export async function extractContainedSigns() {
  const combos = await getRelationships();
  const ntrips = combos.map(toNTriple).join('\n');

  const migrationStr = `
  INSERT DATA {
    GRAPH <http://mu.semte.ch/graphs/mow/registry> {
      ${ntrips}
    }
  }`;
  const fileName = `${makeMigrationTimestamp(new Date())}-insert-new-contained-rels.sparql`;
  const outDir = `/app/migrations`;
  const path = `${outDir}/${fileName}`;
  writeFileSync(path, migrationStr);
}

/**
 * Extract containedWith relationships
 */
async function getRelationships() {
  //note the filter did not work as intended, since it is not also filtering
  //the containedSign variable
  const queryStr = `
  PREFIX mobiliteit: <https://data.vlaanderen.be/ns/mobiliteit#>
  PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
  SELECT ?sign ?containedSign WHERE {
    ?sign a mobiliteit:Verkeersbordconcept;
	  skos:prefLabel ?code;
	  mobiliteit:magVerkeerstekenconceptBevatten ?containedSign.

    FILTER (?code NOT IN ("A33", "E9a-GVIIb", "E9a-GVIId", "E9j", "F113", "GIII", "GIX", "GXII", "M21", "M22", "M23", "M24"))

  }`;
  const result = await query<ContainedCombo>(queryStr);
  return result.results.bindings.map((b) => ({
    sign: b.sign.value,
    containedSign: b.containedSign.value,
  }));
}

function toNTriple({ sign, containedSign }: ContainedCombo) {
  return `${sparqlEscapeUri(sign)} <https://data.vlaanderen.be/ns/mobiliteit#magVerkeerstekenconceptBevatten> ${sparqlEscapeUri(containedSign)}.`;
}

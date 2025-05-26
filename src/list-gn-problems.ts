import { sparqlEscapeString, sparqlEscapeUri } from 'mu';
import { querySudo as query, updateSudo as update } from '@lblod/mu-auth-sudo';
import { problemFiles } from './problematic-files';

import { DataFactory } from 'rdf-data-factory';
import { NamedNode, Quad_Object } from '@rdfjs/types';

interface Triple {
  subject: NamedNode;
  predicate: NamedNode;
  object: Quad_Object;
}
interface Binding {
  type: string;
  value: string;
}

const df = new DataFactory();
async function listGnMeetinsWithTempUris() {
  const query = `

  `;
}
export async function markProblemFiles() {
  const existingFiles = [];
  const nonExistingFiles = [];
  for (const path of problemFiles) {
    const exists = await fileExists(path);
    if (exists) {
      existingFiles.push(path);
      await markFilePoisoned(path);
    } else {
      nonExistingFiles.push(path);
    }
  }
  console.log('existing files', JSON.stringify(existingFiles, null, 2));
  console.log('non-existing files', JSON.stringify(nonExistingFiles, null, 2));
}
async function findThingsWithTempUris() {
  const queryString = `
  SELECT ?thing WHERE {
    ?thing ?pred ?obj.
      FILTER(CONTAINS
  }
  `;
}
async function fileExists(path: string): Promise<boolean> {
  const sharePath = `share://${path}`;
  const queryString = `
  SELECT ?pred ?type
  WHERE {
    ${sparqlEscapeUri(sharePath)} ?pred ?obj.
  } LIMIT 1`;

  const result = await query<{ pred: string; type: string }>(queryString);

  return result.results?.bindings?.length > 0;
}
async function markFilePoisoned(path: string): Promise<void> {
  const sharePath = `share://${path}`;
  const queryString = `
  PREFIX ext: <http://mu.semte.ch/vocabularies/ext/>
  INSERT DATA {
    ${sparqlEscapeUri(sharePath)} ext:poisoned "yes".
  }`;
  await update(queryString);
}
export async function cleanPoison(): Promise<void> {
  const queryString = `
  PREFIX ext: <http://mu.semte.ch/vocabularies/ext/>
  DELETE {
    ?s ext:poisoned ?o.
  } WHERE {
    ?s ext:poisoned ?o.
  }
  `;
  await update(queryString);
}

function bToNamed(b: Binding): NamedNode<string> {
  if (b.type !== 'uri') {
    throw new Error(
      `Tried to convert binding to namednode but type was ${b.type}`
    );
  }
  return df.namedNode(b.value);
}

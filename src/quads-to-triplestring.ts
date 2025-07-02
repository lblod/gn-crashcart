import { Quad } from '@rdfjs/types';
import { DataFactory } from 'rdf-data-factory';
import { Writer } from 'n3';

const df = new DataFactory();

export function quadsToTripleString(quads: Quad[]) {
  const writer = new Writer({ format: 'N-Triples' });
  let resultString: string;
  writer.addQuads(quads.map((q) => df.quad(q.subject, q.predicate, q.object)));
  writer.end((_, result) => (resultString = result));
  return resultString!;
}

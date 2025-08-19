import { CascadeConstraint } from './cascade-constraint';

import { querySudo } from '@lblod/mu-auth-sudo';
import { Quad_Object, Quad } from '@rdfjs/types';
import { BindingObject, sparqlEscapeUri } from 'mu';
import { DataFactory } from 'rdf-data-factory';

const df = new DataFactory();
export async function collectQuads(
  resource: string,
  config: CascadeConstraint
): Promise<{ config: CascadeConstraint; quads: Quad[]; uuid?: string }> {
  const uri = sparqlEscapeUri(resource);
  const outgoingQuery = `
  SELECT ?g ?s ?p ?v WHERE {
    VALUES ?s { ${uri} }
      GRAPH ?g {
      ?s ?p ?v.
      }
  } `;
  const outgoingResults = await querySudo<{
    g: string;
    s: string;
    p: string;
    v: string;
  }>(outgoingQuery);
  const outQuads = outgoingResults.results.bindings.map(bindingToQuad);

  const incomingQuery = `
  SELECT ?g ?s ?p ?v WHERE {
    VALUES ?v { ${uri} }
      GRAPH ?g {
      ?s ?p ?v.
      }
  } `;
  const incomingResults = await querySudo<{
    g: string;
    s: string;
    p: string;
    v: string;
  }>(incomingQuery);
  const inQuads = incomingResults.results.bindings.map(bindingToQuad);
  const uuidQuad = outQuads.find((quad) => {
    return quad.predicate.equals(
      df.namedNode('http://mu.semte.ch/vocabularies/core/uuid')
    );
  });
  return {
    config,
    quads: outQuads.concat(inQuads),
    uuid: uuidQuad?.object.value,
  };
}

export async function collectPublicationZittingQuads(
  resource: string,
  config: CascadeConstraint
): Promise<{ config: CascadeConstraint; quads: Quad[]; uuid?: string }> {
  const uri = sparqlEscapeUri(resource);
  let outgoingQuery;
  if (['Zitting', 'Uittreksel', 'BVAgenda', 'Agenda'].includes(config.name)) {
    outgoingQuery = `
  PREFIX mu: <http://mu.semte.ch/vocabularies/core/>
  SELECT ?g ?s ?p ?v WHERE {
    VALUES ?s { ${uri} }
      GRAPH ?g {
      ?s ?p ?v.
      FILTER( ?p != mu:uuid)
      }
  } `;
  } else {
    outgoingQuery = `
  SELECT ?g ?s ?p ?v WHERE {
    VALUES ?s { ${uri} }
      GRAPH ?g {
      ?s ?p ?v.
      }
  } `;
  }
  const outgoingResults = await querySudo<{
    g: string;
    s: string;
    p: string;
    v: string;
  }>(outgoingQuery);
  const outQuads = outgoingResults.results.bindings.map(bindingToQuad);

  const incomingQuery = `
  SELECT ?g ?s ?p ?v WHERE {
    VALUES ?v { ${uri} }
      GRAPH ?g {
      ?s ?p ?v.
      }
  } `;
  const incomingResults = await querySudo<{
    g: string;
    s: string;
    p: string;
    v: string;
  }>(incomingQuery);
  const inQuads = incomingResults.results.bindings.map(bindingToQuad);
  const uuidQuad = outQuads.find((quad) => {
    return quad.predicate.equals(
      df.namedNode('http://mu.semte.ch/vocabularies/core/uuid')
    );
  });
  return {
    config,
    quads: outQuads.concat(inQuads),
    uuid: uuidQuad?.object.value,
  };
}

function bindingToQuad(
  binding: BindingObject<{ g: string; s: string; p: string; v: string }>
) {
  const { g, s, p, v } = binding;
  let object: Quad_Object;
  switch (v.type) {
    case 'uri':
      object = df.namedNode(v.value);
      break;

    case 'literal':
      console.log(JSON.stringify(v), undefined, 2);

      object = df.literal(v.value);
      break;
    case 'typed-literal':
      if ((v as any)['language']) {
        throw new Error(`saw language in ${(JSON.stringify(v), null, 2)}`);
      }
      object = df.literal(
        v.value,
        df.namedNode((v as any)['datatype'] as string)
      );
      break;

    default:
      throw new Error(
        `unknown type ${v.type} -- ${v.value} -- ${JSON.stringify(v)}`
      );
  }
  const quad = df.quad(
    df.namedNode(s.value),
    df.namedNode(p.value),
    object,
    df.namedNode(g.value)
  );
  return quad;
}

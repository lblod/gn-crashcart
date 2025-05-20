import {
  sparqlEscapeInt,
  sparqlEscapeString,
  sparqlEscapeUri,
  update,
} from 'mu';
import { Sign } from './sign';
import { v4 as uuid4 } from 'uuid';
import { Dimension, Shape } from './shape-parser';
import Result, { err, isOk, ok } from 'true-myth/result';
import { ParseErr } from './parse-err';
import { safe } from 'true-myth/task';
export async function updateSign(sign: Sign): Promise<Result<void, ParseErr>> {
  const query = buildSignQuery(sign);
  if (query.isErr) return err(query.error);
  const result = await safe(update)(query.value);
  return result.mapErr((e) => ({
    reason: `An error was thrown while trying to execute update query: ${e}`,
  }));
}
function buildSignQuery(sign: Sign): Result<string, ParseErr> {
  const validShapes = sign.shapes.filter(isOk).map((shape) => shape.value);
  if (!validShapes.length) {
    return err({ reason: `No valid shapes were found for sign ${sign.code}` });
  }

  const query = `

PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
PREFIX mobi: <https://data.vlaanderen.be/ns/mobiliteit#>
PREFIX char: <https://w3id.org/isCharacterisedBy#>
PREFIX tribont: <https://w3id.org/tribont/core#>
PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
PREFIX dct: <http://purl.org/dc/terms/>
PREFIX mu: <http://mu.semte.ch/vocabularies/core/>
PREFIX cidoc: <http://www.cidoc-crm.org/cidoc-crm/>
PREFIX prov: <http://www.w3.org/ns/prov#>
PREFIX qudt: <http://qudt.org/schema/qudt/>
DELETE {

  GRAPH <http://mu.semte.ch/graphs/mow/registry> {

   ${sparqlEscapeUri(sign.uri)} char:isCharacterisedBy ?oldShape.

     ?oldShape cidoc:P43_has_dimension ?oldDim.
     ?oldShape ?osp ?osv.
     ?oso ?osp2 ?oldShape.
     ?oldDim ?odp ?odv.
     ?odo ?odp2 ?oldDim.
  }
}
INSERT {
  GRAPH <http://mu.semte.ch/graphs/mow/registry> {
    ${validShapes.map((shape) => buildShapeQuery(shape, sign.uri)).join('\n')}
  }
}
WHERE {
  GRAPH <http://mu.semte.ch/graphs/mow/registry> {
    OPTIONAL {
     ${sparqlEscapeUri(sign.uri)} char:isCharacterisedBy ?oldShape.
       ?oldShape cidoc:P43_has_dimension ?oldDim.
       ?oldShape ?osp ?osv.
       ?oso ?osp2 ?oldShape.
       ?oldDim ?odp ?odv.
       ?odo ?odp2 ?oldDim.
    }
    BIND (now() AS ?currentTime)
 
  }
}
`;
  return ok(query);
}

function buildShapeQuery(shape: Shape, signUri: string) {
  const shapeUuid = uuid4();
  const shapeUri = `http://data.lblod.info/tribont-shapes/${shapeUuid}`;
  const escShapeUri = sparqlEscapeUri(shapeUri);
  const escShapeUuid = sparqlEscapeString(shapeUuid);
  const query = `

  ${sparqlEscapeUri(signUri)} char:isCharacterisedBy ${escShapeUri} .
  ${escShapeUri} a tribont:Shape ;
         dct:modified ?currentTime ;
         prov:generatedAtTime ?currentTime ;
         mu:uuid ${escShapeUuid} ;
         cidoc:P2_has_type ${sparqlEscapeUri(shape.shapeTypeUri)} .
   ${shape.dimensions.map((dim) => buildDimensionQuery(dim, shapeUri)).join('\n')}`;
  return query;
}
function buildDimensionQuery(dim: Dimension, shapeUri: string) {
  const dimUuid = uuid4();
  const dimUri = `http://data.lblod.info/dimensions/${dimUuid}`;
  const escDimUri = sparqlEscapeUri(dimUri);
  const escDimUuid = sparqlEscapeString(dimUuid);

  const query = `
  ${sparqlEscapeUri(shapeUri)} 
         cidoc:P43_has_dimension ${escDimUri} .
  ${escDimUri} a cidoc:E54_Dimension ;
             dct:modified ?currentTime ;
             mu:uuid ${escDimUuid} ;
             qudt:hasQuantityKind ${sparqlEscapeUri(dim.quantityKindUri)} ;
             qudt:hasUnit <http://qudt.org/vocab/unit/MilliM> ;
             rdf:value ${sparqlEscapeInt(dim.value)} ;
             prov:generatedAtTime ?currentTime .`;
  return query;
}

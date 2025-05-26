import {
  sparqlEscapeDateTime,
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
import { writeFileSync } from 'fs';
export async function updateSign(sign: Sign): Promise<Result<void, ParseErr>> {
  const query = buildSignQuery(sign);
  if (query.isErr) return err(query.error);
  const result = await safe(update)(query.value);
  return result.mapErr((e) => ({
    reason: `An error was thrown while trying to execute update query: ${e}`,
  }));
}
export function makeSignMigration(
  sign: Sign,
  basePathNoTrailingSlash: string
): Result<void, ParseErr> {
  const query = buildSignQuery(sign);
  const timestamp = new Date().toISOString().replaceAll(/[\WTZ]/g, '');
  const filename = `${timestamp}-add-shapes-to-sign-${sign.code}.sparql`;
  const path = `${basePathNoTrailingSlash}/${filename}`;
  return query.map((q) => writeFileSync(path, q, 'utf8'));
}

function buildSignQuery(sign: Sign): Result<string, ParseErr> {
  const validShapes = sign.shapes.filter(isOk).map((shape) => shape.value);
  if (!validShapes.length) {
    return err({ reason: `No valid shapes were found for sign ${sign.code}` });
  }

  const time = new Date();
  const query = `
PREFIX char: <https://w3id.org/isCharacterisedBy#>
PREFIX cidoc: <http://www.cidoc-crm.org/cidoc-crm/>
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
WHERE {
  GRAPH <http://mu.semte.ch/graphs/mow/registry> {
   ${sparqlEscapeUri(sign.uri)} char:isCharacterisedBy ?oldShape.
     ?oldShape cidoc:P43_has_dimension ?oldDim.
     ?oldShape ?osp ?osv.
     ?oso ?osp2 ?oldShape.
     ?oldDim ?odp ?odv.
     ?odo ?odp2 ?oldDim.
  }
};
    ${validShapes.map((shape) => buildShapeQuery(shape, sign.uri, time)).join(';\n')}
`;
  return ok(query.trim());
}

function buildShapeQuery(shape: Shape, signUri: string, time: Date) {
  const shapeUuid = uuid4();
  const shapeUri = `http://data.lblod.info/tribont-shapes/${shapeUuid}`;
  const escShapeUri = sparqlEscapeUri(shapeUri);
  const escShapeUuid = sparqlEscapeString(shapeUuid);
  const escTime = sparqlEscapeDateTime(time);
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
INSERT DATA {
  GRAPH <http://mu.semte.ch/graphs/mow/registry> {
  ${sparqlEscapeUri(signUri)} char:isCharacterisedBy ${escShapeUri} .
  ${escShapeUri} a tribont:Shape ;
         dct:modified ${escTime} ;
         prov:generatedAtTime ${escTime} ;
         mu:uuid ${escShapeUuid} ;
         cidoc:P2_has_type ${sparqlEscapeUri(shape.shapeTypeUri)} .
   ${shape.dimensions.map((dim) => buildDimensionQuery(dim, shapeUri, time)).join('\n')}
  }
}`;
  return query;
}
function buildDimensionQuery(dim: Dimension, shapeUri: string, time: Date) {
  const dimUuid = uuid4();
  const dimUri = `http://data.lblod.info/dimensions/${dimUuid}`;
  const escDimUri = sparqlEscapeUri(dimUri);
  const escDimUuid = sparqlEscapeString(dimUuid);
  const escTime = sparqlEscapeDateTime(time);

  const query = `
  ${sparqlEscapeUri(shapeUri)} 
         cidoc:P43_has_dimension ${escDimUri} .
  ${escDimUri} a cidoc:E54_Dimension ;
             dct:modified ${escTime} ;
             mu:uuid ${escDimUuid} ;
             qudt:hasQuantityKind ${sparqlEscapeUri(dim.quantityKindUri)} ;
             qudt:hasUnit <http://qudt.org/vocab/unit/MilliM> ;
             rdf:value ${sparqlEscapeInt(dim.value)} ;
             prov:generatedAtTime ${escTime} .`;
  return query;
}

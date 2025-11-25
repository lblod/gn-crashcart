import { constraint, rel } from '../cascade-constraint';
import { image } from './icon-cascade';

export function roadsign() {
  return constraint({
    name: 'Verkeersbordconcept',
    resType: 'mobiliteit:Verkeersbordconcept',
    rels: [
      // rel(roadsign, 'mobiliteit:heeftMogelijkOnderbord'),
      // rel(roadsign, 'fakemobi:verkeersbordHeeftGerelateerdVerkeersbord'),
      rel(image, 'mobiliteit:grafischeWeergave'),
      rel(tribontShape, 'w3ic:isCharacterisedBy'),
      rel(tribontShape, 'mobiliteit:heeftStandaardVorm'),
      rel(variable, 'mobiliteit:definieert'),
      rel(template, 'mobiliteit:heeftInstructie'),
      // rel(signalConcept, 'mobiliteit:magVerkeerstekenconceptBevatten'),
    ],
  });
}
export function tribontShape() {
  return constraint({
    name: 'Shape',
    resType: 'tribont:Shape',
    rels: [rel(dimension, 'cidoc:P43_has_dimension')],
  });
}
export function dimension() {
  return constraint({ name: 'Dimension', resType: 'cidoc:E54_Dimension' });
}
export function variable() {
  return constraint({
    name: 'Variabele',
    resType: 'variables:Variable',
    rels: [
      rel(template, 'mobiliteit:template'),
      rel(codelistValue, 'variables:defaultValue'),
    ],
  });
}
export function codelistValue() {
  return constraint({
    name: 'CodelistValue',
    resType: 'ext:CodeListValue',
  });
}

function template() {
  return constraint({
    name: 'Template',
    resType: 'mobiliteit:Template',
    rels: [rel(variable, 'mobiliteit:variabele')],
  });
}
function signalConcept() {
  return constraint({
    name: 'Verkeerstekenconcept',
    resType: 'mobiliteit:Verkeerstekenconcept',
  });
}
export const allNewSignConfigs = [
  roadsign,
  tribontShape,
  dimension,
  variable,
  template,
  signalConcept,
].map((f) => f()(undefined));

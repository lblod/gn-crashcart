import { constraint, rel } from '../cascade-constraint';

export function icon() {
  return constraint({
    name: 'Pictogram',
    resType: 'mobiliteit:Pictogram',
    rels: [rel(image, 'skos:prefSymbol')],
  });
}
export function image() {
  return constraint({
    name: 'Image',
    resType: 'foaf:Image',
    rels: [rel(fileDataObject, 'ext:hasFile')],
  });
}

export function fileDataObject() {
  return constraint({
    name: 'FileDataObject',
    resType: 'nfo:FileDataObject',
    rels: [rel(fileDataObject, 'nie:dataSource', { inverse: true })],
  });
}
export const allIconConfigs = [icon, image, fileDataObject].map((f) =>
  f()(undefined)
);

import { constraint, rel } from './cascade-constraint';

function fileDataObject() {
  return constraint({
    name: 'FileDataObject',
    resType: 'nfo:FileDataObject',
    rels: [rel(fileDataObject, 'nie:dataSource')],
  });
}
function versionedBesluitenLijst() {
  return constraint({
    name: 'VersionedBesluitenLijst',
    resType: 'ext:VersionedBesluitenLijst',
    rels: [],
  });
}
function publishedResource() {
  return constraint({
    name: 'PublishedResource',
    resType: 'sign:PublishedResource',
    rels: [
      rel(versionedBesluitenLijst, 'dct:subject'),
      rel(versionedBesluitenLijst, 'ext:publishedBesluitenLijst'),
      rel(fileDataObject, 'prov:generated'),
    ],
  });
}
export const gnAllConfigs = [
  publishedResource,
  versionedBesluitenLijst,
  fileDataObject,
].map((f) => f()(undefined));

export const gnPublishedResource = publishedResource()(undefined);

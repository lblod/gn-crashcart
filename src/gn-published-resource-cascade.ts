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
function versionedBehandeling() {
  return constraint({
    name: 'VersionedBehandeling',
    resType: 'ext:VersionedBehandeling',
    rels: [],
  });
}
function versionedAgenda() {
  return constraint({
    name: 'VersionedAgenda',
    resType: 'bv:Agenda',
    rels: [],
  });
}
function versionedNotulen() {
  return constraint({
    name: 'VersionedNotulen',
    resType: 'ext:VersionedNotulen',
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
      rel(versionedBehandeling, 'dct:subject'),
      rel(versionedBehandeling, 'ext:publishesBehandeling'),
      rel(versionedAgenda, 'dct:subject'),
      rel(versionedAgenda, 'ext:publishesAgenda'),
      rel(versionedNotulen, 'dct:subject'),
      rel(versionedNotulen, 'ext:publishesNotulen'),
      rel(fileDataObject, 'prov:generated'),
    ],
  });
}
export const gnAllConfigs = [
  publishedResource,
  versionedBesluitenLijst,
  versionedAgenda,
  versionedBehandeling,
  versionedNotulen,
  fileDataObject,
].map((f) => f()(undefined));

export const gnPublishedResource = publishedResource()(undefined);

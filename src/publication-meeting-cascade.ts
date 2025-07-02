import { constraint, rel } from './cascade-constraint';

function fileDataObject() {
  return constraint({
    name: 'FileDataObject',
    resType: 'nfo:FileDataObject',
    rels: [rel(fileDataObject, 'nie:dataSource')],
  });
}

function artikel() {
  return constraint({
    name: 'Artikel',
    resType: 'besluit:Artikel',
    rels: [rel(besluit, 'eli:has_part', { inverse: true })],
  });
}
// done
function besluit() {
  return constraint({
    name: 'Besluit',
    resType: 'besluit:Besluit',
    rels: [rel(artikel, 'eli:has_part', { constrainType: false })],
  });
}

function stemming() {
  return constraint({
    name: 'Stemming',
    resType: 'besluit:Stemming',
  });
}

// done
function behandeling() {
  return constraint({
    name: 'BehandelingVanAgendapunt',
    resType: 'besluit:BehandelingVanAgendapunt',
    rels: [
      rel(besluit, 'prov:generated'),
      rel(stemming, 'besluit:heeftStemming'),
    ],
  });
}
// done
function versionedNotulen() {
  return constraint({
    name: 'VersionedNotulen',
    resType: 'ext:VersionedNotulen',
    rels: [
      rel(behandeling, 'ext:publicBehandeling'),
      rel(fileDataObject, 'prov:generated'),
    ],
  });
}

// done
const versionedBehandeling = () =>
  constraint({
    name: 'VersionedBehandeling',
    resType: 'ext:VersionedBehandeling',
    rels: [rel(behandeling, 'ext:behandeling')],
  });

//done
const versionedBesluitenLijst = () =>
  constraint({
    name: 'VersionedBesluitenLijst',
    resType: 'ext:VersionedBesluitenLijst',
  });

// done - reached by inversion from publishedResource
function task() {
  return constraint({
    name: 'Task',
    resType: 'task:Task',
  });
}

function bvAgenda() {
  return constraint({
    name: 'BVAgenda',
    resType: 'bv:Agenda',
  });
}

function attachment() {
  return constraint({
    name: 'Attachment',
    rels: [rel(fileDataObject, 'ext:hasFile')],
  });
}
//done
function publishedResource() {
  return constraint({
    name: 'PublishedResource',
    resType: 'sign:PublishedResource',
    rels: [
      rel(fileDataObject, 'prov:generated'),

      rel(versionedBehandeling, 'dct:subject'),
      rel(versionedBehandeling, 'ext:publishedBehandeling'),

      rel(versionedBesluitenLijst, 'dct:subject'),
      rel(versionedBesluitenLijst, 'ext:publishedBesluitenLijst'),

      rel(bvAgenda, 'dct:subject'),
      rel(bvAgenda, 'ext:publishedAgenda'),

      rel(versionedNotulen, 'dct:subject'),
      rel(versionedNotulen, 'ext:publishesNotulen'),
      rel(attachment, 'ext:hasAttachment'),

      rel(task, 'nuao:involves', { inverse: true }),
    ],
  });
}
//done
function agendapunt() {
  return constraint({
    name: 'Agendapunt',
    resType: 'besluit:Agendapunt',
    rels: [rel(behandeling, 'dct:subject', { inverse: true })],
  });
}
//done
function agenda() {
  return constraint({
    name: 'Agenda',
    resType: 'ext:Agenda',
    rels: [
      rel(agendapunt, 'ext:agendaAgendapunt'),
      rel(publishedResource, 'ext:wasDerivedFrom'),
    ],
  });
}

//done
function notulen() {
  return constraint({
    name: 'Notulen',
    resType: 'ext:Notulen',
    rels: [
      rel(fileDataObject, 'prov:generated'),
      rel(publishedResource, 'prov:wasDerivedFrom'),
    ],
  });
}
//done
function besluitenLijst() {
  return constraint({
    name: 'Besluitenlijst',
    resType: 'ext:Besluitenlijst',
    rels: [
      rel(besluit, 'ext:besluitenlijstBesluit'),
      rel(publishedResource, 'prov:wasDerivedFrom'),
    ],
  });
}
// done
function uittreksel() {
  return constraint({
    name: 'Uittreksel',
    resType: 'ext:Uittreksel',
    rels: [
      rel(publishedResource, 'prov:wasDerivedFrom'),
      rel(behandeling, 'ext:uittrekselBvap'),
    ],
  });
}
//done
function zitting() {
  return constraint({
    name: 'Zitting',
    resType: 'besluit:Zitting',
    rels: [
      rel(agendapunt, 'besluit:behandelt', { constrainType: false }),
      rel(besluitenLijst, 'ext:besluitenlijst'),
      rel(publishedResource, 'prov:wasDerivedFrom'),
      rel(uittreksel, 'ext:uittreksel'),
      rel(agenda, 'ext:agenda'),
      rel(notulen, 'besluit:heeftNotulen'),
      rel(ivNotulen, 'ext:wasDerivedFromInstallatievergaderingNotulen'),
      rel(bvAgenda, 'bv:isAgendaVoor', { inverse: true }),
    ],
  });
}
function ivNotulen() {
  return constraint({
    name: 'IVNotulen',
  });
}
export const publicationMeetingAllConfigs = [
  fileDataObject,
  artikel,
  besluit,
  stemming,
  behandeling,
  versionedNotulen,
  versionedBehandeling,
  versionedBesluitenLijst,
  task,
  bvAgenda,
  publishedResource,
  agendapunt,
  agenda,
  notulen,
  besluitenLijst,
  uittreksel,
  zitting,
  ivNotulen,
].map((f) => f()(undefined));

export const publicationMeetingCascadeConfig = zitting()(undefined);

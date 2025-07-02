import { querySudo } from '@lblod/mu-auth-sudo';
import { Quad_Object, Quad } from '@rdfjs/types';
import { BindingObject, sparqlEscapeString, sparqlEscapeUri } from 'mu';
import { DataFactory } from 'rdf-data-factory';
import { Writer } from 'n3';

const df = new DataFactory();

const DO_CHECK = true;
type PredString = `${Lowercase<string>}:${Lowercase<string>}${string}`;
type ResString = `${Lowercase<string>}:${Capitalize<string>}`;
interface BaseConstraint {
  pred?: PredString;
  inverse?: boolean;
}
interface DeferredConstraint extends BaseConstraint {
  ctor: () => CascadeConstructor;
  constrainType?: boolean;
}
interface CascadeConstraint extends BaseConstraint {
  name: string;
  rels?: DeferredConstraint[];
  resType?: ResString;
}

const prefixes = `
PREFIX besluit: <http://data.vlaanderen.be/ns/besluit#>
PREFIX dct: <http://purl.org/dc/terms/>
PREFIX ext: <http://mu.semte.ch/vocabularies/ext/>
PREFIX prov: <http://www.w3.org/ns/prov#>
PREFIX sign: <http://mu.semte.ch/vocabularies/ext/signing/>
PREFIX bv: <http://data.vlaanderen.be/ns/besluitvorming#>
PREFIX nfo: <http://www.semanticdesktop.org/ontologies/2007/03/22/nfo#>
PREFIX nie: <http://www.semanticdesktop.org/ontologies/2007/01/19/nie#>
PREFIX eli: <http://data.europa.eu/eli/ontology#>
PREFIX task: <http://redpencil.data.gift/vocabularies/tasks/>
PREFIX nuao: <http://www.semanticdesktop.org/ontologies/2010/01/25/nuao#>
`;
interface CascadeConstructorOpts {
  inverse?: boolean;
  constrainType?: boolean;
}
const defaultConstructorOpts = {
  inverse: false,
  constrainType: true,
} satisfies CascadeConstructorOpts;

type CascadeConstructor = (
  pred?: PredString,
  opts?: CascadeConstructorOpts
) => CascadeConstraint;

function constraint(
  constraint: Omit<CascadeConstraint, 'pred' | 'inverse'>
): CascadeConstructor {
  return function (
    pred?: PredString,
    {
      inverse = false,
      constrainType = true,
    }: CascadeConstructorOpts = defaultConstructorOpts
  ) {
    return {
      name: constraint.name,
      rels: constraint.rels,
      resType: constrainType ? constraint.resType : undefined,
      pred: pred ?? undefined,
      inverse,
    } as CascadeConstraint;
  };
}
function rel(
  ctor: () => CascadeConstructor,
  pred?: PredString,
  {
    inverse = false,
    constrainType = true,
  }: CascadeConstructorOpts = defaultConstructorOpts
): DeferredConstraint {
  return {
    ctor,
    pred: pred ?? undefined,
    constrainType,
    inverse,
  };
}

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
const allConfigs = [
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
const cascadeConfig = zitting()(undefined);

function renderConstraint(config: CascadeConstraint): string {
  const pred = config.pred ? `(via ${config.pred})` : `(via *)`;
  const inv = config.inverse ? `[<-]` : `[->]`;
  return `${config.name} of type ${config.resType ?? '*'} ${inv} ${pred}`;
}

const LOG_EMPTY_CHILDREN = false;
async function cascade<R>(
  root: string,
  config: CascadeConstraint,
  log: string[],
  memory: Set<string>,
  indent: number,
  visitedConfigs: Set<string>,
  visitor: CascadeVisitor<R>,
  resultCollector: R[]
): Promise<void> {
  if (!config.resType && !config.pred) {
    throw new Error('Should either have type or pred constraint');
  }
  const message1 = ' '
    .repeat(indent)
    .concat(`Visiting ${config.name} (${root})`);

  visitedConfigs.add(config.name);
  log.push(message1);
  if (config.rels) {
    for (const deferredConfig of config.rels) {
      const childConfig = deferredConfig.ctor()(deferredConfig.pred, {
        constrainType: deferredConfig.constrainType,
        inverse: deferredConfig.inverse,
      });
      let addNewline = false;
      visitedConfigs.add(childConfig.name);
      const childInstances = await findChildren(root, childConfig);
      let message2 = ' '
        .repeat(indent)
        .concat(
          `⮱ Found ${childInstances.length} children for ${renderConstraint(childConfig)}`
        );

      // warn if there are instances which have no type belonging to the
      // predicate, this is common in production dbs which have a lot of cruft
      let unconstrained: number | null = null;
      if (childConfig.resType && childConfig.pred && DO_CHECK) {
        unconstrained = await countUnconstrained(root, childConfig);
        if (unconstrained > 0) {
          message2 = message2.concat(
            ` WARN: also found ${unconstrained} instances without types`
          );
        }
      }
      if (
        childInstances.length > 0 ||
        (unconstrained !== null && unconstrained > 0) ||
        LOG_EMPTY_CHILDREN
      ) {
        log.push(message2);
        addNewline = true;
      }
      for (const child of childInstances) {
        if (!memory.has(child)) {
          await cascade(
            child,
            childConfig,
            log,
            memory,
            indent + 4,
            visitedConfigs,
            visitor,
            resultCollector
          );
        } else {
          // avoid visiting the same resource twice, to stop infinite loops
          // and improve performance
          log.push(
            ' '.repeat(indent).concat(`Already saw ${child}, skipping.`)
          );
        }
      }
      if (addNewline) {
        log.push('');
      }
    }
  }
  memory.add(root);
  resultCollector.push(await visitor(root, config));
}

async function findChildren(
  fromUri: string,
  config: CascadeConstraint
): Promise<string[]> {
  const uri = sparqlEscapeUri(fromUri);
  let query;
  if (config.inverse) {
    query = `
	${prefixes}
	SELECT ?target WHERE {
	  ?target ${config.pred ?? '?s'} ${uri}.
	    ${config.resType ? `?target a ${config.resType}.` : ''}
	}`;
  } else {
    query = `
	${prefixes}
	SELECT ?target WHERE {
	  ${uri} ${config.pred ?? '?s'} ?target.
	    ${config.resType ? `?target a ${config.resType}.` : ''}
	}`;
  }
  const result = await querySudo<{ target: string }>(query);
  return result.results.bindings.map((b) => b.target.value);
}
async function countUnconstrained(
  fromUri: string,
  config: CascadeConstraint
): Promise<number> {
  const uri = sparqlEscapeUri(fromUri);
  let q;
  if (config.inverse) {
    q = `
	${prefixes}
	SELECT (COUNT(distinct ?target) AS ?targetCount) WHERE {

	  ?target ${config.pred ?? '?s'} ${uri}.
	    FILTER NOT EXISTS {
	      ?target a ?type.
	  }
	}`;
  } else {
    q = `
	${prefixes}
	SELECT (COUNT(distinct ?target) AS ?targetCount) WHERE {
	  ${uri} ${config.pred ?? '?s'} ?target.
	    FILTER NOT EXISTS {
	      ?target a ?type.
	  }
	}`;
  }
  const result = await querySudo<{ targetCount: string }>(q);
  return Number.parseInt(result.results.bindings[0].targetCount.value, 10);
}
async function getUriForUuid(uuid: string): Promise<string> {
  const query = `
  PREFIX mu: <http://mu.semte.ch/vocabularies/core/>
  SELECT DISTINCT ?uri WHERE {
    ?uri mu:uuid ${sparqlEscapeString(uuid)}
  }`;
  const result = await querySudo<{ uri: string }>(query);
  if (result.results.bindings.length === 0) {
    throw new Error(`Resource with uuid ${uuid} not found`);
  }
  return result.results.bindings[0].uri.value;
}
interface CascadeResult<R> {
  results: R[];
  log: string[];
}
type CascadeVisitor<R> = (uri: string, config: CascadeConstraint) => Promise<R>;
export async function doCascade<R>(
  rootUuid: string,
  visitFunc: CascadeVisitor<R>
): Promise<CascadeResult<R>> {
  const log: string[] = [];

  const uri = await getUriForUuid(rootUuid);
  const visitedConfigs = new Set<string>();
  const results: R[] = [];
  await cascade(
    uri,
    cascadeConfig,
    log,
    new Set(),
    0,
    visitedConfigs,
    visitFunc,
    results
  );

  log.push(`visited configs:  ${[...visitedConfigs].join(',')}`);
  const missedConfigs = allConfigs
    .map((c) => c.name)
    .filter((name) => !visitedConfigs.has(name));
  if (missedConfigs.length) {
    log.push(`WARNING: the following configs were not reached:`);
    log.push(...missedConfigs);
  } else {
    log.push(`All known configs reached.`);
  }

  return { log, results };
}
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
export function bindingToQuad(
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

export function quadsToTripleString(quads: Quad[]) {
  const writer = new Writer({ format: 'N-Triples' });
  let resultString: string;
  writer.addQuads(quads.map((q) => df.quad(q.subject, q.predicate, q.object)));
  writer.end((_, result) => (resultString = result));
  return resultString!;
}

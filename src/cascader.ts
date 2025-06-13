import { querySudo } from '@lblod/mu-auth-sudo';
import { query, sparqlEscapeString, sparqlEscapeUri } from 'mu';
import { config } from 'process';

const DO_CHECK = true;
type PredString = `${Lowercase<string>}:${Lowercase<string>}${string}`;
type ResString = `${Lowercase<string>}:${Capitalize<string>}`;
interface CascadeConstraint {
  name: string;
  resType?: ResString;
  pred?: PredString;
  children?: CascadeConstraint[];
  inverse?: boolean;
}

const prefixes = `
PREFIX besluit: <http://data.vlaanderen.be/ns/besluit#>
PREFIX dct: <http://purl.org/dc/terms/>
PREFIX ext: <http://mu.semte.ch/vocabularies/ext/>
PREFIX prov: <http://www.w3.org/ns/prov#>
PREFIX sign: <http://mu.semte.ch/vocabularies/ext/signing/>
PREFIX bv: <http://data.vlaanderen.be/ns/besluitvorming#>
PREFIX nfo: <http://www.semanticdesktop.org/ontologies/2007/03/22/nfo#>
`;
interface CascadeConstructorOpts {
  inverse?: boolean;
  constrainType?: boolean;
}
const defaultConstructorOpts = {
  inverse: false,
  constrainType: true,
} satisfies CascadeConstructorOpts;

function constraint(
  constraint: Omit<CascadeConstraint, 'pred' | 'inverse'> & { resType: string }
) {
  return function (
    pred: string | null,
    { inverse, constrainType }: CascadeConstructorOpts = defaultConstructorOpts
  ) {
    return {
      name: constraint.name,
      children: constraint.children,
      resType: constrainType ? constraint.resType : undefined,
      pred: pred ?? undefined,
    } as CascadeConstraint;
  };
}

const fileDataObject = constraint({
  name: 'FileDataObject',
  resType: 'nfo:FileDataObject',
});

const versionedBehandeling = constraint({
  name: 'VersionedBehandeling',
  resType: 'ext:VersionedBehandeling',
});
const versionedBesluitenLijst = constraint({
  name: 'VersionedBesluitenLijst',
  resType: 'ext:VersionedBesluitenLijst',
});

const bvAgenda = constraint({
  name: 'BVAgenda',
  resType: 'bv:Agenda',
});

const versionedNotulen = constraint({
  name: 'VersionedNotulen',
  resType: 'ext:VersionedNotulen',
});
const publishedResource = constraint({
  name: 'PublishedResource',
  resType: 'sign:PublishedResource',
  children: [
    fileDataObject('prov:generated'),

    versionedBehandeling('dct:subject'),
    versionedBehandeling('ext:publishedBehandeling'),

    versionedBesluitenLijst('dct:subject'),
    versionedBesluitenLijst('ext:publishedBesluitenLijst'),

    bvAgenda('dct:subject'),
    bvAgenda('ext:publishedAgenda'),

    versionedNotulen('dct:subject'),
    versionedNotulen('ext:publishesNotulen'),
  ],
});
const agenda = constraint({
  name: 'Agenda',
  resType: 'ext:Agenda',
});
const besluit = constraint({
  name: 'Besluit',
  resType: 'besluit:Besluit',
});

const versionedUittreksel = constraint({
  name: 'VersionedUittreksel',
  resType: 'ext:Uittreksel',
});

const behandeling = constraint({
  name: 'BehandelingVanAgendapunt',
  resType: 'besluit:BehandelingVanAgendapunt',
  children: [
    besluit('prov:generated', { constrainType: false }),
    {
      name: 'Stemming',
      pred: 'besluit:heeftStemming',
      // resType: 'besluit:Stemming',
    },
    versionedBehandeling('ext:behandeling', { inverse: true }),
    versionedUittreksel('ext:uittrekselBvap', { inverse: true }),
    versionedNotulen('ext:publicBehandeling', { inverse: true }),
  ],
});

const agendapunt = constraint({
  name: 'Agendapunt',
  resType: 'besluit:AgendaPunt',
  children: [
    behandeling('dct:subject', { inverse: true }),
    agenda('ext:agendaAgendapunt', { inverse: true }),
  ],
});
const notulen = constraint({
  name: 'Notulen',
  resType: 'ext:Notulen',
});
const besluitenLijst = constraint({
  name: 'Besluitenlijst',
  resType: 'ext:Besluitenlijst',
});
const uittreksel = constraint({
  name: 'Uittreksel',
  resType: 'ext:Uittreksel',
});
const cascadeConfig: CascadeConstraint = {
  name: 'Zitting',
  resType: 'besluit:Zitting',
  children: [
    agendapunt('besluit:behandelt', { constrainType: false }),
    besluitenLijst('ext:besluitenLijst'),
    publishedResource('prov:wasDerivedFrom'),
    uittreksel('ext:uittreksel'),
    agenda('ext:agenda'),
    notulen('besluit:heeftNotulen'),
    bvAgenda('bv:isAgendaVoor', { inverse: true }),
  ],
};
function renderConstraint(config: CascadeConstraint): string {
  const pred = config.pred ? `(via ${config.pred})` : `(via *)`;
  const inv = config.inverse ? `[<-]` : `[->]`;
  return `${config.name} of type ${config.resType ?? '*'} ${inv} ${pred}`;
}

async function cascade(
  root: string,
  config: CascadeConstraint,
  log: string[],
  memory: Set<string>,
  indent: number
): Promise<void> {
  if (!config.resType && !config.pred) {
    throw new Error('Should either have type or pred constraint');
  }
  const message1 = ' '
    .repeat(indent)
    .concat(`Visiting ${config.name} (${root})`);
  log.push(message1);
  if (config.children) {
    for (const childConfig of config.children) {
      const childInstances = await findChildren(root, childConfig);
      let message2 = ' '
        .repeat(indent)
        .concat(
          `⮱ Found ${childInstances.length} children for ${renderConstraint(childConfig)}`
        );

      // warn if there are instances which have no type belonging to the
      // predicate, this is common in production dbs which have a lot of cruft
      if (childConfig.resType && childConfig.pred && DO_CHECK) {
        const unconstrained = await countUnconstrained(root, childConfig);
        if (unconstrained > 0) {
          message2 = message2.concat(
            ` WARN: also found ${unconstrained} instances without types`
          );
        }
      }
      log.push(message2);
      for (const child of childInstances) {
        if (!memory.has(child)) {
          await cascade(child, childConfig, log, memory, indent + 4);
        } else {
          // avoid visiting the same resource twice, to stop infinite loops
          // and improve performance
          log.push(
            ' '.repeat(indent).concat(`Already saw ${child}, skipping.`)
          );
        }
      }
      log.push('');
    }
  }
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
export async function doCascade(rootUuid: string): Promise<string[]> {
  const log: string[] = [];

  const uri = await getUriForUuid(rootUuid);
  await cascade(uri, cascadeConfig, log, new Set(), 0);
  return log;
}

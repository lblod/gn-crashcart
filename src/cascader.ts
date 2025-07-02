import { querySudo } from '@lblod/mu-auth-sudo';
import { sparqlEscapeUri } from 'mu';
import { CascadeConstraint, renderConstraint } from './cascade-constraint';

export interface CascadeResult<R> {
  results: R[];
  log: string[];
}
export type CascadeVisitor<R> = (
  uri: string,
  config: CascadeConstraint
) => Promise<R>;

export interface CascadeOpts {
  logEmptyChildren: boolean;
  checkForRelationshipsWithoutType: boolean;
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

async function cascade<R>(
  root: string,
  config: CascadeConstraint,
  log: string[],
  memory: Set<string>,
  indent: number,
  visitedConfigs: Set<string>,
  visitor: CascadeVisitor<R>,
  resultCollector: R[],
  opts: CascadeOpts
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
      if (
        childConfig.resType &&
        childConfig.pred &&
        opts.checkForRelationshipsWithoutType
      ) {
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
        opts.logEmptyChildren
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
            resultCollector,
            opts
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
export async function doCascade<R>(
  rootUri: string,
  visitFunc: CascadeVisitor<R>,
  rootConfig: CascadeConstraint,
  allConfigs: CascadeConstraint[],
  opts: CascadeOpts
): Promise<CascadeResult<R>> {
  const log: string[] = [];

  const uri = rootUri;
  const visitedConfigs = new Set<string>();
  const results: R[] = [];
  await cascade(
    uri,
    rootConfig,
    log,
    new Set(),
    0,
    visitedConfigs,
    visitFunc,
    results,
    opts
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

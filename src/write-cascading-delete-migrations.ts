import { mkdirSync, writeFileSync } from 'fs';
import { CascadeConstraint } from './cascade-constraint';
import {
  collectPublicationZittingQuads,
  collectQuads,
} from './cascade-visitors';
import { CascadeOpts, doCascade } from './cascader';
import { quadsToTripleString } from './quads-to-triplestring';
import { makeMigrationTimestamp } from './make-migration-timestamp';
import { Quad } from '@rdfjs/types';
import { sparqlEscapeUri } from 'mu';
import { setOrPush } from './map-utils';
import { splitArray } from './array-utils';

export interface CascadingDeleteOpts {
  rootUri: string;
  rootConfig: CascadeConstraint;
  allConfigs: CascadeConstraint[];
  opts: CascadeOpts;
  outputDir: string;
  deleteOrInsert?: 'DELETE' | 'INSERT';
  graphFilter?: string[];
  uriMap?: Map<string, string>;
  filenameGenerator: (
    result: Awaited<ReturnType<typeof collectQuads>>,
    index: number
  ) => string;
}
export async function writeCascadingMigrations({
  rootConfig,
  rootUri,
  opts,
  allConfigs,
  outputDir,
  deleteOrInsert = 'DELETE',
  graphFilter = [],
  uriMap,
  filenameGenerator,
}: CascadingDeleteOpts) {
  const { log, results } = await doCascade(
    rootUri,
    collectPublicationZittingQuads,
    rootConfig,
    allConfigs,
    opts
  );

  mkdirSync(outputDir, { recursive: true });

  writeFileSync(`${outputDir}/cascadelog`, log.join('\n'), 'utf8');

  for (const [index, result] of results.entries()) {
    if (result.quads.length) {
      const partitionedQuads = splitArray(result.quads, 50);
      const queries: string[] = [];
      for (const quadBatch of partitionedQuads) {
        const graphs = new Map<string, Quad[]>();
        for (const quad of quadBatch) {
          setOrPush(graphs, quad.graph.value, quad);
        }
        for (const [graph, quads] of graphs.entries()) {
          if (graphFilter.length === 0 || graphFilter.includes(graph)) {
            if (uriMap) {
              let queryStr = `
	${deleteOrInsert} DATA {
	  GRAPH ${sparqlEscapeUri(graph)} {
	    ${quadsToTripleString(quads)}
	  }
	}`;
              for (const [key, value] of uriMap.entries()) {
                queryStr = queryStr.replaceAll(key, value);
              }
              queries.push(queryStr);
            } else {
              queries.push(`
	${deleteOrInsert} DATA {
	  GRAPH ${sparqlEscapeUri(graph)} {
	    ${quadsToTripleString(quads)}
	  }
	}`);
            }
          }
        }
      }

      writeFileSync(
        `${outputDir}/${filenameGenerator(result, index)}`,
        queries.join(';\n')
      );
    }
  }
}
export async function writeCascadingDeleteMigrationsForResource({
  uuid,
  rootUri,
  rootConfig,
  allConfigs,
  filenameInfix,
  deleteOrInsert,
  graphFilter,
  uriMap,
}: Omit<CascadingDeleteOpts, 'filenameGenerator' | 'opts' | 'outputDir'> & {
  filenameInfix: string;
  uuid: string;
}) {
  const timestamp = makeMigrationTimestamp(new Date());
  const migrationPath = `/app/migrations/${timestamp}-${deleteOrInsert?.toLowerCase()}-${filenameInfix}-${uuid}`;

  writeCascadingMigrations({
    graphFilter,
    deleteOrInsert,
    allConfigs,
    filenameGenerator: (result, index) =>
      `${timestamp}-${deleteOrInsert?.toLowerCase()}-${filenameInfix}-${uuid}-${result.config.name}-${result.uuid ?? `no-uuid-${index}`}.sparql`,
    opts: {
      checkForRelationshipsWithoutType: true,
      logEmptyRelationships: false,
    },
    outputDir: migrationPath,
    rootUri,
    rootConfig,
    uriMap,
  });
}

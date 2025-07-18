import { mkdirSync, writeFileSync } from 'fs';
import { CascadeConstraint } from './cascade-constraint';
import { collectQuads } from './cascade-visitors';
import { CascadeOpts, doCascade } from './cascader';
import { quadsToTripleString } from './quads-to-triplestring';
import { makeMigrationTimestamp } from './make-migration-timestamp';
import { Quad } from '@rdfjs/types';
import { sparqlEscapeUri } from 'mu';
import { setOrPush } from './map-utils';

export interface CascadingDeleteOpts {
  rootUri: string;
  rootConfig: CascadeConstraint;
  allConfigs: CascadeConstraint[];
  opts: CascadeOpts;
  outputDir: string;
  deleteOrInsert?: 'DELETE' | 'INSERT';
  filenameGenerator: (
    result: Awaited<ReturnType<typeof collectQuads>>,
    index: number
  ) => string;
}
export async function writeCascadingDeleteMigrations({
  rootConfig,
  rootUri,
  opts,
  allConfigs,
  outputDir,
  deleteOrInsert = 'DELETE',
  filenameGenerator,
}: CascadingDeleteOpts) {
  const { log, results } = await doCascade(
    rootUri,
    collectQuads,
    rootConfig,
    allConfigs,
    opts
  );

  mkdirSync(outputDir, { recursive: true });

  writeFileSync(`${outputDir}/cascadelog`, log.join('\n'), 'utf8');

  for (const [index, result] of results.entries()) {
    if (result.quads.length) {
      const graphs = new Map<string, Quad[]>();
      const queries: string[] = [];
      for (const quad of result.quads) {
        setOrPush(graphs, quad.graph.value, quad);
      }
      for (const [graph, quads] of graphs.entries()) {
        queries.push(`
	${deleteOrInsert} DATA {
	  GRAPH ${sparqlEscapeUri(graph)} {
	    ${quadsToTripleString(quads)}
	  }
	}`);
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
}: Omit<CascadingDeleteOpts, 'filenameGenerator' | 'opts' | 'outputDir'> & {
  filenameInfix: string;
  uuid: string;
}) {
  const timestamp = makeMigrationTimestamp(new Date());
  const migrationPath = `/app/migrations/${timestamp}-delete-${filenameInfix}-${uuid}`;

  writeCascadingDeleteMigrations({
    allConfigs,
    filenameGenerator: (result, index) =>
      `${timestamp}-delete-${filenameInfix}-${uuid}-${result.config.name}-${result.uuid ?? `no-uuid-${index}`}.sparql`,
    opts: { checkForRelationshipsWithoutType: true, logEmptyRelationships: false },
    outputDir: migrationPath,
    rootUri,
    rootConfig,
  });
}

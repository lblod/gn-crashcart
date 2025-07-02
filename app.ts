import { app, query, sparqlEscapeString } from 'mu';
import { readFile } from 'fs/promises';
import { parse } from 'csv-parse/sync';
import { stringify } from 'csv-stringify/sync';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { Result } from 'true-myth';
import { err, isOk, ok } from 'true-myth/result';
import { parseShape, type Shape } from './src/shape-parser';
import { CSVSign } from './src/csv-parser';
import { ParseErr } from './src/parse-err';
import { Sign } from './src/sign';
import { makeSignMigration, updateSign } from './src/save-shapes';
import { cleanPoison, markProblemFiles } from './src/list-gn-problems';
import { collectQuads, doCascade, quadsToTripleString } from './src/cascader';

async function findSign(code: string): Promise<Result<string, ParseErr>> {
  const q = `

  PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
  SELECT ?shape WHERE {
    ?shape skos:prefLabel ${sparqlEscapeString(code)}.
  }
  `;
  const result = await query(q);
  const { bindings } = result.results;
  if (bindings[0]?.shape?.value) {
    return ok(bindings[0].shape.value);
  }
  return err({ reason: `Sign with code ${code} not found` });
}
async function parseSign(record: CSVSign): Promise<Result<Sign, ParseErr>> {
  if (!record.shape) return err({ reason: 'Sign without shape' });
  const uri = await findSign(record.code);

  return uri.map((uri) => ({
    code: record.code,
    uri,
    shapes: parseShape(record.shape, record.measurements),
  }));
}

app.get('/hello', async function (req, res) {
  const content = await readFile('./measurements.csv');

  const records: CSVSign[] = parse(content, { bom: true, columns: true });

  const first = await findSign(records[0].code);
  const valid: CSVSign[] = [];
  const invalid: CSVSign[] = [];
  const errorLog: string[] = [];
  const successLog: string[] = [];
  for (const record of records) {
    const sign = await parseSign(record);
    console.log(JSON.stringify(sign));
    if (isOk(sign)) {
      valid.push(record);

      const updateResult = makeSignMigration(sign.value, '/app/migrations');

      if (isOk(updateResult)) {
        successLog.push(`Succesfully updated ${sign.value.code}`);
      } else {
        errorLog.push(
          `Couldn't update ${sign.value.code}: ${JSON.stringify(updateResult.error)}`
        );
      }
    } else {
      invalid.push(record);
    }
  }
  // console.log(
  //   'invalid',
  //
  //   stringify(invalid, {
  //     columns: [{ key: 'code' }, { key: 'shape' }, { key: 'measurements' }],
  //     bom: true,
  //   })
  // );
  writeFileSync(
    '/app/invalid.csv',
    stringify(invalid, {
      columns: [{ key: 'code' }, { key: 'shape' }, { key: 'measurements' }],
      bom: true,
    }),
    'utf8'
  );
  writeFileSync(
    '/app/valid.csv',
    stringify(valid, {
      columns: [{ key: 'code' }, { key: 'shape' }, { key: 'measurements' }],
    }),
    'utf8'
  );
  writeFileSync('/app/successlog', successLog.join('\n'), 'utf8');
  writeFileSync('/app/errorlog', errorLog.join('\n'), 'utf8');

  res.send(first);
});

app.post('/mark-poisoned', async function (req, res) {
  await markProblemFiles();
  res.status(200).send('hello from /list');
});
app.post('/clean-poison', async function (req, res) {
  await cleanPoison();
  res.status(200).send('poisoned status deleted');
});
app.post('/cascade-zitting/:uuid', async function (req, res) {
  const { log, results } = await doCascade(req.params.uuid, collectQuads);

  const migrationPath = `/app/migrations/delete-meeting-${req.params.uuid}`;

  mkdirSync(migrationPath, { recursive: true });

  writeFileSync(`${migrationPath}/cascadelog`, log.join('\n'), 'utf8');

  let i = 0;
  for (const result of results) {
    if (result.quads.length) {
      writeFileSync(
        // use uuid, otherwise use and update current no-uuid counter
        `${migrationPath}/${result.config.name}-${result.uuid ?? `no-uuid-${i++}`}`,
        `
      DELETE DATA {
	GRAPH <http://mu.semte.ch/graphs/public> {
	  ${quadsToTripleString(result.quads)}
	}
      }
      `
      );
    }
  }
  res.status(200).send('cascading complete');
});

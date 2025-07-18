import bodyParser from 'body-parser';
import { parse } from 'csv-parse/sync';
import { stringify } from 'csv-stringify/sync';
import { writeFileSync } from 'fs';
import { readFile } from 'fs/promises';
import { app, query, sparqlEscapeString } from 'mu';
import { Result } from 'true-myth';
import { err, isOk, ok } from 'true-myth/result';
import { CSVSign } from './src/csv-parser';
import { getUriForUuid } from './src/get-uri-for-uuid';
import {
  gnAllConfigs,
  gnPublishedResource,
} from './src/gn-published-resource-cascade';
import { cleanPoison, markProblemFiles } from './src/list-gn-problems';
import { ParseErr } from './src/parse-err';
import {
  publicationMeetingAllConfigs,
  publicationMeetingCascadeConfig,
} from './src/publication-meeting-cascade';
import { removePublishedResourcesOfMeeting } from './src/republication/remove-prs-of-meeting';
import { republishAllPrsOfMeeting } from './src/republication/republish-prs-of-meeting';
import { makeSignMigration } from './src/save-shapes';
import { parseShape } from './src/shape-parser';
import { Sign } from './src/sign';
import { writeCascadingDeleteMigrationsForResource } from './src/write-cascading-delete-migrations';
app.use(bodyParser.json());

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
  const uuid = req.params.uuid;
  const rootUri = await getUriForUuid(uuid);
  await writeCascadingDeleteMigrationsForResource({
    uuid,
    rootUri,
    rootConfig: publicationMeetingCascadeConfig,
    allConfigs: publicationMeetingAllConfigs,
    filenameInfix: 'meeting',
  });
  res.status(200).send('cascading complete');
});
app.post('/cascade-published-resource-gn/:uuid', async function (req, res) {
  const uuid = req.params.uuid;
  const rootUri = await getUriForUuid(uuid);
  await writeCascadingDeleteMigrationsForResource({
    uuid,
    rootUri,
    rootConfig: gnPublishedResource,
    allConfigs: gnAllConfigs,
    filenameInfix: 'published-resource',
  });
  res.status(200).send('cascading complete');
});
app.post('/gn-clear-publications/:meetingUuid', async function (req, res) {
  await removePublishedResourcesOfMeeting(req.params.meetingUuid);
  res.status(200).send('meeting repaired');
});

app.post('/republish/:meetingUuid', async function (req, res) {
  await republishAllPrsOfMeeting(
    req.params.meetingUuid,
    splitarray(req.rawHeaders)
  );

  res.status(200).send('session tested');
});

function splitarray<A>(input: Array<A>): Array<[A, A]> {
  const output: Array<[A, A]> = [];

  for (var i = 0; i < input.length; i += 2) {
    output[output.length] = input.slice(i, i + 2) as [A, A];
  }

  return output;
}

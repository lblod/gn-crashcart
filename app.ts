import { updateSudo } from '@lblod/mu-auth-sudo';
import bodyParser from 'body-parser';
import { parse } from 'csv-parse/sync';
import { stringify } from 'csv-stringify/sync';
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'fs';
import { readFile } from 'fs/promises';
import { app, query, sparqlEscapeString, sparqlEscapeUri } from 'mu';
import { Result } from 'true-myth';
import { err, isOk, ok } from 'true-myth/result';
import { splitarrayToTuples } from './src/array-utils';
import { CSVSign } from './src/csv-parser';
import { getUriForUuid } from './src/get-uri-for-uuid';
import {
  gnAllConfigs,
  gnPublishedResource,
} from './src/gn-published-resource-cascade';
import { cleanPoison, markProblemFiles } from './src/list-gn-problems';
import { makeMigrationTimestamp } from './src/make-migration-timestamp';
import { ParseErr } from './src/parse-err';
import {
  publicationMeetingAllConfigs,
  publicationMeetingCascadeConfig,
} from './src/publication-meeting-cascade';
import { findDirForMeeting } from './src/republication/dir-utils';
import { getUuidOfMeeting } from './src/republication/meeting-utils';
import {
  executeMigrations,
  executeMigrationsNoThrow,
  removePublishedResourcesOfMeeting,
} from './src/republication/remove-prs-of-meeting';
import { republishAllPrsOfMeeting } from './src/republication/republish-prs-of-meeting';
import { makeSignMigration } from './src/save-shapes';
import { parseShape } from './src/shape-parser';
import { Sign } from './src/sign';
import {
  writeCascadingDeleteMigrationsForResource,
  writeCascadingMigrations,
} from './src/write-cascading-delete-migrations';
import {
  calculateHash,
  fixSignatures,
  reconnectSignatures,
} from './src/fix-signatures/fix-signatures';
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

app.get('/hello', async function (_req, res) {
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

app.post('/mark-poisoned', async function (_req, res) {
  await markProblemFiles();
  res.status(200).send('hello from /list');
});
app.post('/clean-poison', async function (_req, res) {
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

app.post('/publi-clear-publications', async function (req, res) {
  const rootUri: string = req.body.uri;
  const gnUuid: string = req.body.uuid;
  const uuid = await getUuidOfMeeting(rootUri);

  const timestamp = makeMigrationTimestamp(new Date());
  const meetingDir = findDirForMeeting(gnUuid, 'publi');
  const outputDir = `${meetingDir}/${timestamp}-delete-publication-meeting-${uuid}`;
  await writeCascadingMigrations({
    rootUri,
    rootConfig: publicationMeetingCascadeConfig,
    allConfigs: publicationMeetingAllConfigs,
    filenameGenerator: (result, index) =>
      `${makeMigrationTimestamp(new Date())}-delete-${result.config.name}-${result.uuid ?? index}.sparql`,
    outputDir,
    opts: {
      checkForRelationshipsWithoutType: true,
      logEmptyRelationships: false,
    },
    deleteOrInsert: 'DELETE',
  });
  await executeMigrationsNoThrow(outputDir);
  res.status(200).send('cascading complete');
});
app.post('/publi-insert-new-publications', async function (req, res) {
  // const rootUri: string = req.body.uri;

  const gnUuid: string = req.body.uuid;

  const meetingDirGN = findDirForMeeting(gnUuid, 'gn');
  const meetingDirPubli = findDirForMeeting(gnUuid, 'publi');

  const insertionDirs = readdirSync(meetingDirGN).filter((subdir) =>
    subdir.includes('insert-pr')
  );

  for (const dir of insertionDirs) {
    const dirTimeStamp = makeMigrationTimestamp(new Date());
    const newDir = `${dirTimeStamp}-${dir.split('-').slice(1).join('-')}`;
    const files = readdirSync(`${meetingDirGN}/${dir}`);
    for (const file of files) {
      if (
        file.includes('PublishedResource') ||
        file.includes('FileDataObject')
      ) {
        const migration = readFileSync(
          `${meetingDirGN}/${dir}/${file}`,
          'utf8'
        );
        const migWithPublicGraph = migration.replace(
          /GRAPH <[^<>]*>/,
          'GRAPH <http://mu.semte.ch/graphs/public>'
        );
        const timeStamp = makeMigrationTimestamp(new Date());
        const newFile = `${timeStamp}-${file.split('-').slice(1).join('-')}`;
        mkdirSync(`${meetingDirPubli}/${newDir}`, { recursive: true });
        writeFileSync(
          `${meetingDirPubli}/${newDir}/${newFile}`,
          migWithPublicGraph,
          'utf8'
        );
      }
    }

    await executeMigrations(`${meetingDirPubli}/${newDir}`);
  }

  res.status(200).send('cascading complete');
});

app.post('/fix-publication-date', async function (req, res) {
  const zittingUri: string = req.body.uri;
  const gnUuid: string = req.body.uuid;

  const meetingDirPubli = findDirForMeeting(gnUuid, 'publi');

  const timeStamp = makeMigrationTimestamp(new Date());
  const queryString = `
PREFIX ext: <http://mu.semte.ch/vocabularies/ext/>
PREFIX besluit: <http://data.vlaanderen.be/ns/besluit#>
PREFIX prov: <http://www.w3.org/ns/prov#>
PREFIX dct: <http://purl.org/dc/terms/>
PREFIX eli: <http://data.europa.eu/eli/ontology#>

DELETE {
  GRAPH <http://mu.semte.ch/graphs/public> {
    ?doc eli:date_publication ?oldDate .
  }
}
INSERT {
  GRAPH <http://mu.semte.ch/graphs/public> {
    ?doc eli:date_publication ?newDate .
  }
}
WHERE {
  VALUES ?zitting { ${sparqlEscapeUri(zittingUri)} }
  ?zitting a besluit:Zitting .
  ?zitting ext:besluitenlijst ?doc .
  ?doc a ext:Besluitenlijst .
  ?doc prov:wasDerivedFrom ?pr .
  ?pr dct:created ?newDate .
  ?doc eli:date_publication ?oldDate .
}
  `;
  writeFileSync(
    `${meetingDirPubli}/${timeStamp}-fix-besluitenlijst-date-of-meeting.sparql`,
    queryString,
    'utf8'
  );
  await updateSudo(queryString);
  res.status(200).send('fixed besluitenlijst timestamp');
});

app.post('/republish/:meetingUuid', async function (req, res) {
  console.log(JSON.stringify(req.body));
  const includeTreatmentsInNotulen =
    req.body.includeTreatmentsInNotulen === 'yes';
  if (includeTreatmentsInNotulen) {
    console.log('will include treatments in notulen');
  } else {
    console.log('what the hell is going on');
  }
  await republishAllPrsOfMeeting(
    req.params.meetingUuid,
    splitarrayToTuples(req.rawHeaders),
    includeTreatmentsInNotulen
  );
  res.status(200).send('finished republishing in gn');
});

app.post('/reinsert-signatures', async function (req, res) {
  await fixSignatures();
  res.status(200).send('finished reinserting signatures');
});
app.post('/fix-signatures', async function (req, res) {
  await reconnectSignatures();
  res
    .status(200)
    .send('finished reconnecting and rehashing signatures of treatments');
});
app.post('/check-hash', async function (req, res) {
  const uri = req.body.uri;
  const result = await calculateHash(uri);
  res.status(200).send(result ? 'hashes match' : 'hashes dont match');
});

import { querySudo, updateSudo } from '@lblod/mu-auth-sudo';
import { createHash } from 'crypto';
import { readdirSync, readFileSync } from 'fs';
import { readFile } from 'fs/promises';
import { sparqlEscapeString, sparqlEscapeUri } from 'mu';
import { basename } from 'path';
import { getBehandelingenSignatures } from './treatments';
import { getBesluitenLijstenSignatures } from './decision-lists';
import { getAgendaSignatures } from './agendas';
import { saveAndExecute } from './save-and-execute';
import { rehashSignatures } from './rehash-signatures';

const MIG_OUTPUT_PATH = '/app/migrations/fix-signatures';
const MIGS_INPUT_DIR = '/app/tmp/fix-signatures';
export async function fixSignatures() {
  const uuids: string[] = [];
  for (const filePath of readdirSync(MIGS_INPUT_DIR)) {
    const uuid = basename(filePath, '.sparql').split('-').slice(3).join('-');
    if (!uuid) {
      throw new Error(`Could not parse uuid out of fileName: ${filePath}`);
    }
    console.log(`found uuid ${uuid}`);
    uuids.push(uuid);
    const migrationString = readFileSync(
      `${MIGS_INPUT_DIR}/${filePath}`,
      'utf8'
    );
    await updateSudo(migrationString);
  }
  // give all the signatures we added a tag so we can easily query them again
  // later
  await saveAndExecute(
    `${MIG_OUTPUT_PATH}/debug-tag-missing-signatures.sparql`,
    tagUuids(uuids),
    { sudo: true }
  );
}

function tagUuids(uuids: string[]) {
  const sparqlUuids = uuids.map((uuid) => sparqlEscapeString(uuid));
  const queryStr = `
  PREFIX mu: <http://mu.semte.ch/vocabularies/core/>
  PREFIX ext: <http://mu.semte.ch/vocabularies/ext/>
  INSERT {
    GRAPH ?g {
      ?subject ext:debugTag "fix-signature".
    }
  }
  WHERE {
    VALUES ?uuid { ${sparqlUuids.join(' ')} }
    GRAPH ?g {
      ?subject mu:uuid ?uuid.
    }
  }
  `;
  return queryStr;
}

const kindToGetterMap = {
  treatment: getBehandelingenSignatures,
  decisionlist: getBesluitenLijstenSignatures,
  agenda: getAgendaSignatures,
};
export async function reconnectSignatures() {
  for (const kind of ['treatment', 'decisionlist', 'agenda'] as const) {
    // get all signature-info blobs for the given kind of versionedresource
    const results = await kindToGetterMap[kind]();

    for (const binding of results.results.bindings) {
      const signature = binding.signature.value;
      const newvr = binding.newvr.value;
      const pubFile = binding.pubFile.value;
      const uuid = binding.uuid.value;

      const content = await getFileContentForUri(binding.physicalFile.value);
      const newHash = generateHash(
        'sha256',
        generateStringToHash(
          binding.signatory.value,
          content,
          binding.timestamp.value
        )
      );
      await rehashSignatures({
        kind,
        signature,
        newHash,
        pubFile,
        uuid,
        newvr,
      });
    }
  }
}
export async function calculateHash(hashedThingUri: string) {
  const hashedThing = sparqlEscapeUri(hashedThingUri);
  const queryStr = `
  PREFIX sign: <http://mu.semte.ch/vocabularies/ext/signing/>
  PREFIX prov: <http://www.w3.org/ns/prov#>
  PREFIX dct: <http://purl.org/dc/terms/>
  PREFIX nie: <http://www.semanticdesktop.org/ontologies/2007/01/19/nie#>

  SELECT DISTINCT ?hash ?physicalFile ?timestamp ?signatory {
    ${hashedThing} sign:signatory ?signatory;
       prov:generated ?logicalFile;
       dct:created ?timestamp;
       sign:hashValue ?hash .

    ?physicalFile nie:dataSource ?logicalFile .

  }
  `;
  const result = await querySudo<{
    hash: string;
    physicalFile: string;
    timestamp: string;
    signatory: string;
  }>(queryStr);

  const hashBlob = result.results.bindings[0];

  const content = await getFileContentForUri(hashBlob.physicalFile.value);
  const stringToHash = generateStringToHash(
    hashBlob.signatory.value,
    content,
    hashBlob.timestamp.value
  );
  const originalHash = hashBlob.hash.value;
  const hash = generateHash('sha256', stringToHash);
  console.log('original hash', originalHash);
  console.log('generated hash', hash);
  if (hash === originalHash) {
    console.log('hashes match');
    return true;
  } else {
    console.log('hashes match');
    return false;
  }
}

function generateStringToHash(
  userUri: string,
  content: string,
  timestamp: string
) {
  try {
    const stringToHash =
      // the full text content
      content +
      // the uri of the person publishing/signing
      userUri +
      // the created date of the resource
      timestamp;

    return stringToHash;
    // eslint-disable-next-line no-unused-vars
  } catch (error) {
    throw new Error(
      "unable to sign resource because couldn't find relavant data in the database"
    );
  }
}
function generateHash(algorithm: string, stringToHash: string) {
  const hashClass = createHash(algorithm);
  hashClass.update(stringToHash);
  const hashString = hashClass.digest('hex');

  return hashString;
}

/**
 * reads a file from the shared drive and returns its content
 * @param {string} shareUri the uri of the file to read
 * @return string
 */
export async function getFileContentForUri(shareUri: string) {
  const path = shareUri.replace('share://', '/share/');
  const content = await readFile(path, 'utf8');
  return content;
}

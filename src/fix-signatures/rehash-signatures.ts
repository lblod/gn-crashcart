import { sparqlEscapeUri, sparqlEscapeString } from 'mu';
import { makeMigrationTimestamp } from '../make-migration-timestamp';
import { saveAndExecute } from './save-and-execute';

export interface UpdateSignatureInfo {
  signature: string;
  newvr: string;
  pubFile: string;
  newHash: string;
  uuid: string;
  kind: 'treatment' | 'decisionlist' | 'agenda';
}

const predicateMap = {
  treatment: 'ext:signsBehandeling',
  decisionlist: 'ext:signsBesluitenlijst',
  agenda: 'ext:signsAgenda ',
};
export async function rehashSignatures({
  signature,
  newvr,
  pubFile,
  newHash,
  uuid,
  kind,
}: UpdateSignatureInfo) {
  const escSignature = sparqlEscapeUri(signature);
  const escNewvr = sparqlEscapeUri(newvr);
  const escPubFile = sparqlEscapeUri(pubFile);
  const escNewHash = sparqlEscapeString(newHash);
  const signaturePredicate = predicateMap[kind];
  const updateQueryStr = `

  PREFIX dct: <http://purl.org/dc/terms/>
  PREFIX prov: <http://www.w3.org/ns/prov#>
  PREFIX ext: <http://mu.semte.ch/vocabularies/ext/>
  PREFIX sign: <http://mu.semte.ch/vocabularies/ext/signing/>

    DELETE {
      GRAPH ?g {
	${escSignature} dct:subject ?oldVr;
		     ${signaturePredicate} ?oldVr;
		     prov:generated ?sigFile;
		     sign:hashValue ?hash.
      }

    } 
    INSERT {
      GRAPH ?g {
	${escSignature} dct:subject ${escNewvr};
		     ${signaturePredicate} ${escNewvr};
		     prov:generated ${escPubFile};
		     sign:hashValue ${escNewHash}.
      }
    } 
    WHERE {
      GRAPH ?g {
	${escSignature} a sign:SignedResource;
		     prov:generated ?sigFile;
		     sign:hashValue ?hash.
	  OPTIONAL {		   
	     ${escSignature} dct:subject ?oldVr. 
	    }
	  OPTIONAL {		   
	     ${escSignature} ${signaturePredicate} ?oldVr.
	    }
	}
      }`;
  await saveAndExecute(
    `/app/migrations/fix-signatures/reconnect-${kind}-signatures/${makeMigrationTimestamp(new Date())}-rehash-${uuid}.sparql`,
    updateQueryStr,
    { sudo: true }
  );
}

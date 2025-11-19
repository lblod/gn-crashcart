import { querySudo } from '@lblod/mu-auth-sudo';
import { SignatureInfo } from './signature-info';

export async function getBesluitenLijstenSignatures() {
  const queryStr = `
  PREFIX ext: <http://mu.semte.ch/vocabularies/ext/>
  PREFIX prov: <http://www.w3.org/ns/prov#>
  PREFIX nie: <http://www.semanticdesktop.org/ontologies/2007/01/19/nie#>
  PREFIX sign: <http://mu.semte.ch/vocabularies/ext/signing/>
  PREFIX dct: <http://purl.org/dc/terms/>
  PREFIX mu: <http://mu.semte.ch/vocabularies/core/>
  PREFIX besluit: <http://data.vlaanderen.be/ns/besluit#>

  SELECT DISTINCT ?g ?signature ?sigFile ?pr ?pubFile ?newvr ?signatory ?timestamp ?physicalFile ?uuid WHERE {
    GRAPH ?g {
      ?s a ext:VersionedBesluitenLijst .
      ?s ext:debugTag "fix-signature".


      ?zitting besluit:heeftBesluitenlijst ?s.

      ?signature ext:signsBesluitenlijst ?s ;
        prov:generated ?sigFile;
        sign:signatory ?signatory;
        mu:uuid ?uuid;
        dct:created ?timestamp.

      ?physicalFile nie:dataSource ?sigFile.

      ?zitting besluit:heeftBesluitenlijst ?newvr .
      FILTER (?newvr != ?s)
      ?pr ext:publishesBesluitenlijst ?newvr.
      ?pr prov:generated ?pubFile.
    }
  }
`;
  const results = await querySudo<SignatureInfo>(queryStr);
  return results;
}

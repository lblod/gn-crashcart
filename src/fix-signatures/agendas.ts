import { querySudo } from '@lblod/mu-auth-sudo';
import { SignatureInfo } from './signature-info';

export async function getAgendaSignatures() {
  const queryStr = `
    PREFIX ext: <http://mu.semte.ch/vocabularies/ext/>
    PREFIX prov: <http://www.w3.org/ns/prov#>
    PREFIX nie: <http://www.semanticdesktop.org/ontologies/2007/01/19/nie#>
    PREFIX sign: <http://mu.semte.ch/vocabularies/ext/signing/>
    PREFIX dct: <http://purl.org/dc/terms/>
    PREFIX mu: <http://mu.semte.ch/vocabularies/core/>
    PREFIX besluit: <http://data.vlaanderen.be/ns/besluit#>
    PREFIX bv: <http://data.vlaanderen.be/ns/besluitvorming#>

    SELECT DISTINCT ?g ?signature ?sigFile ?pr ?pubFile ?newvr ?signatory ?timestamp ?physicalFile ?uuid WHERE {
      GRAPH ?g {
	?s a bv:Agenda.
	?s ext:debugTag "fix-signature".
	?s bv:agendaType ?agendaType.
	
	?s bv:isAgendaVoor ?zitting.

	?signature ext:signsAgenda ?s ;
	  prov:generated ?sigFile;
	  sign:signatory ?signatory;
	  mu:uuid ?uuid;
	  dct:created ?timestamp.
	
	?newvr bv:isAgendaVoor ?zitting.
	?newvr bv:agendaType ?agendaType.

	?physicalFile nie:dataSource ?sigFile.
	FILTER (?newvr != ?s)
	?pr ext:publishesAgenda ?newvr.
	?pr prov:generated ?pubFile.
      }
    }`;

  const results = await querySudo<SignatureInfo>(queryStr);
  return results;
}

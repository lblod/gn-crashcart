import { query } from 'mu';
import { writeCascadingDeleteMigrationsForResource } from '../write-cascading-delete-migrations';
import { allNewSignConfigs, roadsign } from './sign-cascade';

export async function extractNewSigns() {
  const newSigns = await getAllNewSigns();
  for (const sign of newSigns) {
    await writeCascadingDeleteMigrationsForResource({
      uuid: sign.uuid,
      rootUri: sign.uri,
      allConfigs: allNewSignConfigs,
      filenameInfix: 'Verkeersbordconcept',
      rootConfig: roadsign()(undefined),
      deleteOrInsert: 'INSERT',
      graphFilter: ['http://mu.semte.ch/graphs/mow/registry'],
    });
  }
}
export async function getAllNewSigns() {
  const queryStr = `
  PREFIX mobiliteit: <https://data.vlaanderen.be/ns/mobiliteit#>
  PREFIX mu: <http://mu.semte.ch/vocabularies/core/>
  PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
  SELECT ?uri ?uuid WHERE {
    VALUES ?uri {
      <http://data.lblod.info/road-sign-concepts/67ED23EDC63D71734B3C8C75>
      <http://data.lblod.info/road-sign-concepts/67F65F52C63D71734B3C8CD1>
      <http://data.lblod.info/road-sign-concepts/67F665FDC63D71734B3C8D14>
      <http://data.lblod.info/road-sign-concepts/67F67C77C63D71734B3C8D49>
      <http://data.lblod.info/road-sign-concepts/68CC149611E4E1224CFC0B6D>
      <http://data.lblod.info/road-sign-concepts/68CD6BE411E4E1224CFC0C27>
      <http://data.lblod.info/road-sign-concepts/68D138B111E4E1224CFC0D48>
      <http://data.lblod.info/road-sign-concepts/68D3F0FE11E4E1224CFC0D8B>
      <http://data.lblod.info/road-sign-concepts/68D3F15F11E4E1224CFC0D91>
      <http://data.lblod.info/road-sign-concepts/67EAAD24C63D71734B3C8C5E>
      <http://data.lblod.info/road-sign-concepts/67ED2D0CC63D71734B3C8C9D>
      <http://data.lblod.info/road-sign-concepts/67F6625EC63D71734B3C8CEC>
      <http://data.lblod.info/road-sign-concepts/68CD08E811E4E1224CFC0B95>
      <http://data.lblod.info/road-sign-concepts/68D12A3511E4E1224CFC0CD8>
      <http://data.lblod.info/road-sign-concepts/68D12AAA11E4E1224CFC0CE0>
      <http://data.lblod.info/road-sign-concepts/68D12B6811E4E1224CFC0CF0>
      <http://data.lblod.info/road-sign-concepts/68D3F01211E4E1224CFC0D77>
      <http://data.lblod.info/road-sign-concepts/68D3F06611E4E1224CFC0D7F>
      <http://data.lblod.info/road-sign-concepts/690E13683FABFE0EE040CB2B>
      <http://data.lblod.info/road-sign-concepts/692034D72D4563838C41B35A>
      <http://data.lblod.info/road-sign-concepts/67EB970CC63D71734B3C8C66>
      <http://data.lblod.info/road-sign-concepts/67ED26C0C63D71734B3C8C84>
      <http://data.lblod.info/road-sign-concepts/67EE9305C63D71734B3C8CA7>
      <http://data.lblod.info/road-sign-concepts/67F66076C63D71734B3C8CE1>
      <http://data.lblod.info/road-sign-concepts/67F66301C63D71734B3C8CF4>
      <http://data.lblod.info/road-sign-concepts/67F6651FC63D71734B3C8D0C>
      <http://data.lblod.info/road-sign-concepts/68CC136C11E4E1224CFC0B65>
      <http://data.lblod.info/road-sign-concepts/68CC153811E4E1224CFC0B75>
      <http://data.lblod.info/road-sign-concepts/68D1025D11E4E1224CFC0C48>
      <http://data.lblod.info/road-sign-concepts/68D10F2811E4E1224CFC0C96>
      <http://data.lblod.info/road-sign-concepts/68D12BC011E4E1224CFC0CF8>
      <http://data.lblod.info/road-sign-concepts/68D3EFE711E4E1224CFC0D73>
      <http://data.lblod.info/road-sign-concepts/68D3F09E11E4E1224CFC0D83>
      <http://data.lblod.info/road-sign-concepts/68D3F27811E4E1224CFC0D97>
      <http://data.lblod.info/road-sign-concepts/68E768F053FC4746C00D7A38>
      <http://data.lblod.info/road-sign-concepts/691714FC3FABFE0EE040CBC8>
      <http://data.lblod.info/road-sign-concepts/67ED2C0AC63D71734B3C8C94>
      <http://data.lblod.info/road-sign-concepts/67F663D9C63D71734B3C8CFD>
      <http://data.lblod.info/road-sign-concepts/67F666E8C63D71734B3C8D21>
      <http://data.lblod.info/road-sign-concepts/67F667F3C63D71734B3C8D26>
      <http://data.lblod.info/road-sign-concepts/67F668AFC63D71734B3C8D2B>
      <http://data.lblod.info/road-sign-concepts/68D101C411E4E1224CFC0C3E>
      <http://data.lblod.info/road-sign-concepts/68D12C2311E4E1224CFC0D00>
      <http://data.lblod.info/road-sign-concepts/67F666ACC63D71734B3C8D1C>
      <http://data.lblod.info/road-sign-concepts/68CD5E1911E4E1224CFC0BDF>
      <http://data.lblod.info/road-sign-concepts/68D1296A11E4E1224CFC0CC8>
      <http://data.lblod.info/road-sign-concepts/692025D62D4563838C41B330>
      <http://data.lblod.info/road-sign-concepts/690DED223FABFE0EE040CB20>
      <http://data.lblod.info/road-sign-concepts/690E15393FABFE0EE040CB4C>
      <http://data.lblod.info/road-sign-concepts/690E15BB3FABFE0EE040CB57>
      <http://data.lblod.info/road-sign-concepts/67EAABBEC63D71734B3C8C54>
      <http://data.lblod.info/road-sign-concepts/67ED2204C63D71734B3C8C6D>
      <http://data.lblod.info/road-sign-concepts/67ED25E5C63D71734B3C8C7F>
      <http://data.lblod.info/road-sign-concepts/67EE928AC63D71734B3C8CA2>
      <http://data.lblod.info/road-sign-concepts/67F67AB5C63D71734B3C8D3B>
      <http://data.lblod.info/road-sign-concepts/67F67B31C63D71734B3C8D41>
      <http://data.lblod.info/road-sign-concepts/68498CC7006BDAAF21C03567>
      <http://data.lblod.info/road-sign-concepts/684AD528006BDAAF21C03575>
      <http://data.lblod.info/road-sign-concepts/68D10CE711E4E1224CFC0C79>
      <http://data.lblod.info/road-sign-concepts/690DEC553FABFE0EE040CB12>
      <http://data.lblod.info/road-sign-concepts/690E13FC3FABFE0EE040CB36>
      <http://data.lblod.info/road-sign-concepts/690E14853FABFE0EE040CB41>
      <http://data.lblod.info/road-sign-concepts/690E1BC23FABFE0EE040CB85>
      <http://data.lblod.info/road-sign-concepts/67F65D57C63D71734B3C8CC7>
      <http://data.lblod.info/road-sign-concepts/67F65F09C63D71734B3C8CCC>
      <http://data.lblod.info/road-sign-concepts/67F668EBC63D71734B3C8D30>
      <http://data.lblod.info/road-sign-concepts/67F67A33C63D71734B3C8D36>
      <http://data.lblod.info/road-sign-concepts/67F67E38C63D71734B3C8D63>
      <http://data.lblod.info/road-sign-concepts/67F67E80C63D71734B3C8D6B>
      <http://data.lblod.info/road-sign-concepts/6819F69FE6D7D7BAE67A5036>
      <http://data.lblod.info/road-sign-concepts/68498B71006BDAAF21C03552>
      <http://data.lblod.info/road-sign-concepts/68CD06D711E4E1224CFC0B85>
      <http://data.lblod.info/road-sign-concepts/68CD6B2511E4E1224CFC0C1A>
      <http://data.lblod.info/road-sign-concepts/68D103FF11E4E1224CFC0C4E>
      <http://data.lblod.info/road-sign-concepts/68D10B3411E4E1224CFC0C6D>
      <http://data.lblod.info/road-sign-concepts/68D10DEE11E4E1224CFC0C82>
      <http://data.lblod.info/road-sign-concepts/68D10E8F11E4E1224CFC0C8D>
      <http://data.lblod.info/road-sign-concepts/68D129CF11E4E1224CFC0CD0>
      <http://data.lblod.info/road-sign-concepts/68D12B0F11E4E1224CFC0CE8>
      <http://data.lblod.info/road-sign-concepts/68D1366111E4E1224CFC0D32>
      <http://data.lblod.info/road-sign-concepts/690E163B3FABFE0EE040CB62>
      <http://data.lblod.info/road-sign-concepts/690E1A983FABFE0EE040CB79>
      <http://data.lblod.info/road-sign-concepts/67F65C67C63D71734B3C8CBA>
      <http://data.lblod.info/road-sign-concepts/67F65FF1C63D71734B3C8CDB>
      <http://data.lblod.info/road-sign-concepts/68CD083711E4E1224CFC0B8D>
      <http://data.lblod.info/road-sign-concepts/68D125E711E4E1224CFC0CA8>
      <http://data.lblod.info/road-sign-concepts/68D1268311E4E1224CFC0CB0>
      <http://data.lblod.info/road-sign-concepts/68D126FF11E4E1224CFC0CB8>
      <http://data.lblod.info/road-sign-concepts/68D3F03811E4E1224CFC0D7B>
      <http://data.lblod.info/road-sign-concepts/67EAA7B1C63D71734B3C8C4A>
      <http://data.lblod.info/road-sign-concepts/67ED252CC63D71734B3C8C7A>
      <http://data.lblod.info/road-sign-concepts/67ED271FC63D71734B3C8C8F>
      <http://data.lblod.info/road-sign-concepts/67F65BFBC63D71734B3C8CB4>
      <http://data.lblod.info/road-sign-concepts/67F65CFEC63D71734B3C8CC0>
      <http://data.lblod.info/road-sign-concepts/67F65FA3C63D71734B3C8CD6>
      <http://data.lblod.info/road-sign-concepts/67F67CD6C63D71734B3C8D50>
      <http://data.lblod.info/road-sign-concepts/67F67DC1C63D71734B3C8D5A>
      <http://data.lblod.info/road-sign-concepts/68498BF6006BDAAF21C0355A>
      <http://data.lblod.info/road-sign-concepts/68498C62006BDAAF21C0355F>
      <http://data.lblod.info/road-sign-concepts/68D1312111E4E1224CFC0D20>
      <http://data.lblod.info/road-sign-concepts/68D131AB11E4E1224CFC0D28>
      <http://data.lblod.info/road-sign-concepts/68D137D311E4E1224CFC0D3F>
      <http://data.lblod.info/road-sign-concepts/68D3EFB811E4E1224CFC0D6F>
      <http://data.lblod.info/road-sign-concepts/690E185B3FABFE0EE040CB6D>
      <http://data.lblod.info/road-sign-concepts/691714103FABFE0EE040CBC0>
      <http://data.lblod.info/road-sign-concepts/684AD802006BDAAF21C03582>
      <http://data.lblod.info/road-sign-concepts/690E1ED93FABFE0EE040CB90>
      <http://data.lblod.info/road-sign-concepts/68CD6A2311E4E1224CFC0C0F>
      <http://data.lblod.info/road-sign-concepts/68D1099D11E4E1224CFC0C5D>
      <http://data.lblod.info/road-sign-concepts/68D10A0111E4E1224CFC0C65>
      <http://data.lblod.info/road-sign-concepts/68DE2D048629B4EF62A73660>
    }
    GRAPH <http://mu.semte.ch/graphs/mow/registry> {
    ?uri a mobiliteit:Verkeersbordconcept;
         skos:prefLabel ?code;
         mu:uuid ?uuid.
    }
  }`;

  const results = await query<{ uri: string; uuid: string }>(queryStr);
  return results.results.bindings.map((b) => ({
    uri: b.uri.value,
    uuid: b.uuid.value,
  }));
}

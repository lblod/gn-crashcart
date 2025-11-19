export interface SignatureInfo extends Record<string, string> {
  g: string;
  signature: string;
  sigFile: string;
  pr: string;
  pubFile: string;
  uuid: string;
  newvr: string;
  signatory: string;
  timestamp: string;
  physicalFile: string;
}

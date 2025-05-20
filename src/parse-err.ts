export interface ParseErr {
  reason: string;
  parent?: ParseErr;
}

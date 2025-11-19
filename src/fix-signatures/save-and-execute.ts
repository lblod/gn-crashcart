import { updateSudo } from '@lblod/mu-auth-sudo';
import { mkdirSync, writeFileSync } from 'fs';
import { update } from 'mu';
import { dirname } from 'path';

interface SaveAndExecuteOpts {
  execute?: boolean;
  sudo?: boolean;
}
export async function saveAndExecute(
  filePath: string,
  queryString: string,
  { execute = true, sudo = false }: SaveAndExecuteOpts = {
    execute: true,
    sudo: false,
  }
) {
  mkdirSync(dirname(filePath), { recursive: true });
  writeFileSync(filePath, queryString, 'utf8');
  if (execute) {
    if (sudo) {
      await updateSudo(queryString);
    } else {
      await update(queryString);
    }
  }
}

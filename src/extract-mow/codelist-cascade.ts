import { constraint } from '../cascade-constraint';

export function codelist() {
  return constraint({
    name: 'Codelist',
    resType: 'fakemobi:Codelist',
  });
}
export const allCodelistConfigs = [codelist].map((f) => f()(undefined));

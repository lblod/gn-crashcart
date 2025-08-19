export function splitarrayToTuples<A>(input: Array<A>): Array<[A, A]> {
  return splitArray<A>(input, 2) as Array<[A, A]>;
}
export function splitArray<A>(input: Array<A>, spacing: number): Array<A[]> {
  const output: Array<A[]> = [];

  for (var i = 0; i < input.length; i += spacing) {
    output[output.length] = input.slice(i, i + spacing);
  }

  return output;
}

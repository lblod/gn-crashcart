export type PredString = `${Lowercase<string>}:${Lowercase<string>}${string}`;
export type ResString = `${Lowercase<string>}:${Capitalize<string>}`;
export interface BaseConstraint {
  pred?: PredString;
  inverse?: boolean;
}
export interface DeferredConstraint extends BaseConstraint {
  ctor: () => CascadeConstructor;
  constrainType?: boolean;
}
export interface CascadeConstraint extends BaseConstraint {
  name: string;
  rels?: DeferredConstraint[];
  resType?: ResString;
}
export interface CascadeConstructorOpts {
  inverse?: boolean;
  constrainType?: boolean;
}
const defaultConstructorOpts = {
  inverse: false,
  constrainType: true,
} satisfies CascadeConstructorOpts;

export type CascadeConstructor = (
  pred?: PredString,
  opts?: CascadeConstructorOpts
) => CascadeConstraint;

export function constraint(
  constraint: Omit<CascadeConstraint, 'pred' | 'inverse'>
): CascadeConstructor {
  return function (
    pred?: PredString,
    {
      inverse = false,
      constrainType = true,
    }: CascadeConstructorOpts = defaultConstructorOpts
  ) {
    return {
      name: constraint.name,
      rels: constraint.rels,
      resType: constrainType ? constraint.resType : undefined,
      pred: pred ?? undefined,
      inverse,
    } as CascadeConstraint;
  };
}
export function rel(
  ctor: () => CascadeConstructor,
  pred?: PredString,
  {
    inverse = false,
    constrainType = true,
  }: CascadeConstructorOpts = defaultConstructorOpts
): DeferredConstraint {
  return {
    ctor,
    pred: pred ?? undefined,
    constrainType,
    inverse,
  };
}

export function renderConstraint(config: CascadeConstraint): string {
  const pred = config.pred ? `(via ${config.pred})` : `(via *)`;
  const inv = config.inverse ? `[<-]` : `[->]`;
  return `${config.name} of type ${config.resType ?? '*'} ${inv} ${pred}`;
}

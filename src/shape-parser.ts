import { Result } from 'true-myth';
import { ParseErr } from './parse-err';
import { err, ok } from 'true-myth/result';

export type ShapeKind =
  | 'triangle'
  | 'rectangle'
  | 'invTriangle'
  | 'diamond'
  | 'circle'
  | 'octagon'
  | 'arrow';

type DualDimension = [number, number];

const dimension = (value: number, uri: string) => ({
  quantityKindUri: uri,
  value,
});
const width = (value: number) =>
  dimension(value, 'http://qudt.org/vocab/quantitykind/Width');
const radius = (value: number) =>
  dimension(value, 'http://qudt.org/vocab/quantitykind/Radius');
const height = (value: number) =>
  dimension(value, 'http://qudt.org/vocab/quantitykind/Height');
export type Dimension = ReturnType<typeof dimension>;

type BaseShape = {
  shapeTypeUri: string;
  dimensions: Dimension[];
};
interface Triangle extends BaseShape {
  kind: 'triangle';
}
const triangle = (w: number): Triangle => ({
  kind: 'triangle',
  shapeTypeUri:
    'http://lblod.data.gift/concept-schemes/1cddd186-6018-4d12-84d6-f1a5d01affde',
  dimensions: [width(w)],
});

interface InvTriangle extends BaseShape {
  kind: 'invTriangle';
}
const invTriangle = (w: number): InvTriangle => ({
  kind: 'invTriangle',
  shapeTypeUri:
    'http://data.lblod.info/concept-schemes/10b19729-8b4a-4ea5-8470-bc34fc204791',
  dimensions: [width(w)],
});

interface Diamond extends BaseShape {
  kind: 'diamond';
}
const diamond = (w: number): Diamond => ({
  kind: 'diamond',
  shapeTypeUri:
    'http://data.lblod.info/concept-schemes/322852b4-ec7b-4ca2-b267-4fcc263fa0d7',
  dimensions: [width(w)],
});

interface Octagon extends BaseShape {
  kind: 'octagon';
}
const octagon = (w: number): Octagon => ({
  kind: 'octagon',
  shapeTypeUri:
    'http://data.lblod.info/concept-schemes/0e0897d1-5c74-47ae-9868-adecbde6f2f3',
  dimensions: [width(w)],
});

interface Circle extends BaseShape {
  kind: 'circle';
}
const circle = (r: number): Circle => ({
  kind: 'circle',
  shapeTypeUri:
    'http://data.lblod.info/concept-schemes/2481e377-1a89-4e25-9c58-1b509e0f7d74',
  dimensions: [radius(r)],
});

interface Rectangle extends BaseShape {
  kind: 'rectangle';
}
const rectangle = ([w, h]: DualDimension): Rectangle => ({
  kind: 'rectangle',
  shapeTypeUri:
    'http://data.lblod.info/concept-schemes/a5a1b947-1c34-40df-8842-707de418adb8',
  dimensions: [width(w), height(h)],
});
interface Arrow extends BaseShape {
  kind: 'arrow';
}
const arrow = ([w, h]: DualDimension): Arrow => ({
  kind: 'arrow',
  shapeTypeUri:
    'http://data.lblod.info/concept-schemes/4f445b8f-98ce-4621-b671-009a1acb13a6',
  dimensions: [width(w), height(h)],
});

export type Shape =
  | Triangle
  | Rectangle
  | InvTriangle
  | Diamond
  | Octagon
  | Circle
  | Arrow;

function parseSingleDimension(dimstr: string): Result<number, ParseErr> {
  const dim = Number.parseInt(dimstr.trim(), 10);
  if (Number.isInteger(dim)) {
    return ok(dim);
  } else {
    return err({ reason: `Could not convert ${dimstr} into integer` });
  }
}
function parseDualDimension(dimstr: string): Result<DualDimension, ParseErr> {
  const split = dimstr
    .toLowerCase()
    .split('x')
    .map((s) => s.trim());
  if (split.length !== 2) {
    return err({
      reason: `Could not convert ${dimstr} to 2 dimensions. After splitting on 'x', found ${split.length} parts`,
    });
  }
  const [first, second] = split.map(parseSingleDimension);
  return first
    .andThen((first) => second.map((second): DualDimension => [first, second]))
    .mapErr((e) => ({
      reason: `Could not convert ${dimstr} to 2 dimensions`,
      parent: e,
    }));
}
function parseDimensions<R>(
  dimensions: string,
  func: (dimStr: string) => R
): R[] {
  const splits = dimensions
    .trim()
    .split(',')
    .map((s) => s.trim());
  return splits.map(func);
}

const singleDimShapes = {
  driehoek: { ctor: triangle },
  'omgekeerde driehoek': { ctor: invTriangle },
  ruit: { ctor: diamond },
  rond: { ctor: circle },
  achthoek: { ctor: octagon },
} as const;
const dualDimShapes = {
  rechthoek: { ctor: rectangle },
  'wegwijzer met punt': { ctor: arrow },
} as const;
const shapeMap = { ...singleDimShapes, ...dualDimShapes } as const;
type ShapeKey = keyof typeof shapeMap;

function isValidShape(shapeKey: string): shapeKey is ShapeKey {
  return shapeKey in shapeMap;
}
function hasSingleDimension(
  shapeKey: keyof typeof shapeMap
): shapeKey is keyof typeof singleDimShapes {
  return shapeKey in singleDimShapes;
}
function hasDualDimension(
  shapeKey: keyof typeof shapeMap
): shapeKey is keyof typeof dualDimShapes {
  return shapeKey in dualDimShapes;
}
export function parseShape(
  shapeName: string,
  dimStr: string
): Result<Shape, ParseErr>[] {
  const shapeKey = shapeName.toLowerCase();
  if (!isValidShape(shapeKey)) {
    return [
      err({
        reason: `Did not recognize shape with name ${shapeName.toLowerCase()}, must be one of ${JSON.stringify(Object.keys(shapeMap))}`,
      }),
    ];
  }

  if (hasSingleDimension(shapeKey)) {
    const { ctor } = shapeMap[shapeKey];
    const dims = parseDimensions(dimStr, parseSingleDimension);
    return dims.map((dimension) => dimension.map((dim) => ctor(dim)));
  } else {
    const { ctor } = shapeMap[shapeKey];
    const dims = parseDimensions(dimStr, parseDualDimension);
    return dims.map((dimResult) => dimResult.map((dim) => ctor(dim)));
  }
}

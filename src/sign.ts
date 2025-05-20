import { Result } from "true-myth";
import { Shape } from "./shape-parser";
import { ParseErr } from "./parse-err";

export interface Sign {
  code: string;
  uri: string;
  shapes: Result<Shape, ParseErr>[];
}

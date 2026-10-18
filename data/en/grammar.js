// English grammar points for Korean speakers. Rows (in part1–4.js): [form, unit, ko, note (Korean), [[en, ko], …]]
// Ids are `eg:<unit>:<form>`.
import { PARTS, tierOfUnit } from "./vocab.js";

export const grammar = PARTS.flatMap((p) => p.GRAMMAR).map(([form, unit, ko, note, ex]) => ({
  id: `eg:${unit}:${form}`, form, unit, tier: tierOfUnit(unit), ko, note,
  ex: ex.map(([en, ko2]) => ({ en, ko: ko2 })),
}));

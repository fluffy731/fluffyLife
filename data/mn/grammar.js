// Mongolian grammar points. Rows: [form, unit, zh, en, note (Simplified Chinese), [[mn, zh, en], …]]
// Ids are `mg:<unit>:<form>`; tier follows the unit (see vocab.js).
import { tierOfUnit } from "./vocab.js";

const ROWS = [];

export const grammar = ROWS.map(([form, unit, zh, en, note, ex]) => ({
  id: `mg:${unit}:${form}`, form, unit, tier: tierOfUnit(unit), zh, en, note,
  ex: ex.map(([mn, zh2, en2]) => ({ mn, zh: zh2, en: en2 })),
}));

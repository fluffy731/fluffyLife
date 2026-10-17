// Mongolian vocabulary. Rows live in vocab-a0/a1/a2.js grouped by unit: [mn, zh, en, pos, exMn, exZh, exEn, check?]
// Ids are `m:<mn>` (unique, enforced by a test), so rows can move freely. Tier follows the unit:
// 1–4 → a0, 5–8 → a1, 9–12 → a2. The Latin reading aid is computed from the Cyrillic (lib/mongol.js).
import { A0 } from "./vocab-a0.js";
import { A1 } from "./vocab-a1.js";
import { A2 } from "./vocab-a2.js";

export const tierOfUnit = (u) => (u <= 4 ? "a0" : u <= 8 ? "a1" : "a2");

export const vocab = Object.entries({ ...A0, ...A1, ...A2 })
  .map(([u, rows]) => [Number(u), rows])
  .sort((a, b) => a[0] - b[0])
  .flatMap(([unit, rows]) => rows.map((r) => ({
    id: `m:${r[0]}`,
    mn: r[0], zh: r[1], en: r[2], pos: r[3], exMn: r[4], exZh: r[5], exEn: r[6],
    tier: tierOfUnit(unit), unit, check: r[7] === 1,
  })));

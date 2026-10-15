// Cantonese vocabulary. Rows live in vocab-a0/a1/a2.js, grouped by unit number:
//   [zh, jp, ko, en, pos, exZh, exJp, exKo, check?]
// Ids are `y<unit>-<n>` (n = position within the unit), so a unit can hold any number of rows.
// Tier follows the unit: 1–4 → a0, 5–9 → a1, 10–12 → a2. The 한글 spelling is computed from `jp`.
import { A0 } from "./vocab-a0.js";
import { A1 } from "./vocab-a1.js";
import { A2 } from "./vocab-a2.js";

export const tierOfUnit = (u) => (u <= 4 ? "a0" : u <= 9 ? "a1" : "a2");

export const vocab = Object.entries({ ...A0, ...A1, ...A2 })
  .map(([u, rows]) => [Number(u), rows])
  .sort((a, b) => a[0] - b[0])
  .flatMap(([unit, rows]) => rows.map((r, i) => ({
    id: `y${String(unit).padStart(2, "0")}-${String(i + 1).padStart(2, "0")}`,
    zh: r[0], jp: r[1], ko: r[2], en: r[3], pos: r[4], exZh: r[5], exJp: r[6], exKo: r[7],
    tier: tierOfUnit(unit), unit, check: r[8] === 1,
  })));

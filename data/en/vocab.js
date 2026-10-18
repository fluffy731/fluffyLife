// English vocabulary for Korean speakers. Rows live in part1–4.js grouped by unit:
//   [en, ipa, ko, pos, ex, exKo, note|null, check?]
// Ids are `e:<en>` (unique, enforced by a test). Units 1–10 → int (B1–B2), 11–20 → adv (C1).
import * as P1 from "./part1.js";
import * as P2 from "./part2.js";
import * as P3 from "./part3.js";
import * as P4 from "./part4.js";

export const PARTS = [P1, P2, P3, P4];
export const tierOfUnit = (u) => (u <= 10 ? "int" : "adv");

export const vocab = Object.entries(Object.assign({}, ...PARTS.map((p) => p.UNITS)))
  .map(([u, rows]) => [Number(u), rows])
  .sort((a, b) => a[0] - b[0])
  .flatMap(([unit, rows]) => rows.map((r) => ({
    id: `e:${r[0]}`,
    en: r[0], ipa: r[1], ko: r[2], pos: r[3], ex: r[4], exKo: r[5], ...(r[6] ? { note: r[6] } : {}),
    tier: tierOfUnit(unit), unit, check: r[7] === 1,
  })));

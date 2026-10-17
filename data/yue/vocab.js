// Cantonese vocabulary. Rows live in vocab-a0/a1/a2.js, grouped by unit number:
//   [zh, jp, ko, en, pos, exZh, exJp, exKo, check?]
// Ids are `y:<zh>` (zh is unique, enforced by a test), so rows can be inserted, removed or
// reordered without moving anyone's progress. Release-1 positional ids are migrated via legacy-ids.js.
// flags (index 8): 1 = check with a native speaker; "loan" = characters only spell a loanword (巴士).
// Tier follows the unit: 1–4 → a0, 5–9 → a1, 10–12 → a2. The 한글 spelling is computed from `jp`.
import { A0 } from "./vocab-a0.js";
import { A1 } from "./vocab-a1.js";
import { A2 } from "./vocab-a2.js";
import { PHRASES } from "./phrases.js";
import { interleave } from "../../lib/interleave.js";

export const tierOfUnit = (u) => (u <= 4 ? "a0" : u <= 9 ? "a1" : "a2");

const WORDS = { ...A0, ...A1, ...A2 };
const units = [...new Set([...Object.keys(WORDS), ...Object.keys(PHRASES)].map(Number))].sort((a, b) => a - b);

export const vocab = units
  .map((unit) => [unit, interleave(WORDS[unit] || [], PHRASES[unit] || [])])
  .flatMap(([unit, rows]) => rows.map((r) => ({
    id: `y:${r[0]}`,
    zh: r[0], jp: r[1], ko: r[2], en: r[3], pos: r[4], exZh: r[5], exJp: r[6], exKo: r[7],
    tier: tierOfUnit(unit), unit, check: r[8] === 1, loan: r[8] === "loan",
  })));

// Vocabulary rows are compact arrays expanded here.
// [ko, hanja|null, zh, en, pos, ex, exZh, exEn, check?]
// Units are assigned by position: 20 words per unit within each tier.
import { INT } from "./vocab-int.js";
import { ADV } from "./vocab-adv.js";
import { BEG } from "./vocab-beg.js";

const PER_UNIT = 20;

function expand(rows, tier) {
  return rows.map((r, i) => ({
    id: `v-${tier}-${String(i + 1).padStart(3, "0")}`,
    ko: r[0], hanja: r[1], zh: r[2], en: r[3], pos: r[4],
    tier, unit: Math.floor(i / PER_UNIT) + 1,
    ex: r[5], exZh: r[6], exEn: r[7],
    check: r[8] === 1,
  }));
}

export const vocab = [...expand(INT, "int"), ...expand(ADV, "adv"), ...expand(BEG, "beg")];

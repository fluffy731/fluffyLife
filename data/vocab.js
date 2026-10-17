// Vocabulary rows are compact arrays expanded here.
// [ko, hanja|null, zh, en, pos, ex, exZh, exEn, check?]
// Ids come from each row's position in its tier file, so add new rows at the END of a tier file
// only: inserting in the middle would shift the ids and move people's progress onto other words.
// Units are not file order: each tier is interleaved by word type (lib/mix.js) and then cut into
// units of 20, so every unit mixes hanja and native words, nouns, verbs, adjectives and adverbs.
import { INT } from "./vocab-int.js";
import { ADV } from "./vocab-adv.js";
import { BEG } from "./vocab-beg.js";
import { mixOrder, bucketOf } from "../lib/mix.js";

const PER_UNIT = 20;

function expand(rows, tier) {
  const items = rows.map((r, i) => ({
    id: `v-${tier}-${String(i + 1).padStart(3, "0")}`,
    ko: r[0], hanja: r[1], zh: r[2], en: r[3], pos: r[4],
    tier, unit: 0,
    ex: r[5], exZh: r[6], exEn: r[7],
    check: r[8] === 1,
  }));
  return mixOrder(items, bucketOf).map((it, i) => ({ ...it, unit: Math.floor(i / PER_UNIT) + 1 }));
}

export const vocab = [...expand(INT, "int"), ...expand(ADV, "adv"), ...expand(BEG, "beg")];

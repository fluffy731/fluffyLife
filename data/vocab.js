// Vocabulary rows are compact arrays expanded here.
// [ko, hanja|null, zh, en, pos, ex, exZh, exEn, check?]
// Ids come from each row's position in its tier file, so add new rows at the END of a tier file
// only: inserting in the middle would shift the ids and move people's progress onto other words.
// Units are not file order: each tier is interleaved by word type (lib/mix.js) and then cut into
// units of 20, so every unit mixes hanja and native words, nouns, verbs, adjectives and adverbs.
import { INT } from "./vocab-int.js";
import { ADV } from "./vocab-adv.js";
import { BEG } from "./vocab-beg.js";
import { PH_INT } from "./phrases-int.js";
import { PH_ADV } from "./phrases-adv.js";
import { PH_BEG } from "./phrases-beg.js";
import { mixOrder, bucketOf } from "../lib/mix.js";
import { interleave } from "../lib/interleave.js";

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

// Phrases (ids p-<tier>-NNN, pos "phrase") are spread evenly over the tier's units and through each
// unit's words, so the word units above never change when phrases are added.
function withPhrases(words, rows, tier) {
  const units = Math.max(...words.map((w) => w.unit));
  const phrases = rows.map((r, i) => ({
    id: `p-${tier}-${String(i + 1).padStart(3, "0")}`,
    ko: r[0], hanja: r[1], zh: r[2], en: r[3], pos: "phrase",
    tier, unit: Math.floor((i * units) / rows.length) + 1,
    ex: r[4], exZh: r[5], exEn: r[6], ...(r[7] ? { note: r[7] } : {}),
    check: r[8] === 1,
  }));
  const out = [];
  for (let u = 1; u <= units; u++) out.push(...interleave(words.filter((w) => w.unit === u), phrases.filter((p) => p.unit === u)));
  return out;
}

export const vocab = [
  ...withPhrases(expand(INT, "int"), PH_INT, "int"),
  ...withPhrases(expand(ADV, "adv"), PH_ADV, "adv"),
  ...withPhrases(expand(BEG, "beg"), PH_BEG, "beg"),
];

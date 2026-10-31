// Vocabulary rows are compact arrays expanded here.
// [ko, hanja|null, zh, en, pos, ex, exZh, exEn, check?]
// Ids come from each row's position in its tier file, so add new rows at the END of a tier file
// only: inserting in the middle would shift the ids and move people's progress onto other words.
// Units are not file order: each tier is interleaved by word type (lib/mix.js) and then cut into
// units of 20, so every unit mixes hanja and native words, nouns, verbs, adjectives and adverbs.
// A tier file grows in batches. Each batch is mixed and cut into units on its own, after the units
// of the batches before it, so adding words never moves an existing word or phrase to another unit.
// To add a batch: append the rows, then add the old row counts to CUTS (words and phrases alike).
import { INT } from "./vocab-int.js";
import { ADV } from "./vocab-adv.js";
import { BEG } from "./vocab-beg.js";
import { PH_INT } from "./phrases-int.js";
import { PH_ADV } from "./phrases-adv.js";
import { PH_BEG } from "./phrases-beg.js";
import { mixOrder, bucketOf } from "../lib/mix.js";
import { interleave } from "../lib/interleave.js";

const PER_UNIT = 20;
// Row counts at which a tier's next batch starts. Batch k of the phrases is spread over the units
// of batch k of the words.
const CUTS = {
  int: { words: [400], phrases: [100] },
  adv: { words: [], phrases: [] },
  beg: { words: [160], phrases: [40] },
};

const batches = (n, cuts) => [0, ...cuts, n].flatMap((s, i, a) => (i < a.length - 1 && a[i + 1] > s ? [[s, a[i + 1]]] : []));

function expand(rows, tier) {
  const items = rows.map((r, i) => ({
    id: `v-${tier}-${String(i + 1).padStart(3, "0")}`,
    ko: r[0], hanja: r[1], zh: r[2], en: r[3], pos: r[4],
    tier, unit: 0,
    ex: r[5], exZh: r[6], exEn: r[7],
    check: r[8] === 1,
  }));
  const out = [], ranges = [];
  for (const [s, e] of batches(items.length, CUTS[tier].words)) {
    const first = (ranges.at(-1)?.[1] ?? 0) + 1;
    const mixed = mixOrder(items.slice(s, e), bucketOf).map((it, i) => ({ ...it, unit: first + Math.floor(i / PER_UNIT) }));
    out.push(...mixed);
    ranges.push([first, mixed.at(-1).unit]);
  }
  return { words: out, ranges };
}

// Phrases (ids p-<tier>-NNN, pos "phrase") are spread evenly over their batch's units and through
// each unit's words, so the word units above never change when phrases are added.
function withPhrases({ words, ranges }, rows, tier) {
  const phrases = [];
  batches(rows.length, CUTS[tier].phrases).forEach(([s, e], b) => {
    const [first, last] = ranges[b], units = last - first + 1;
    for (let i = s; i < e; i++) {
      const r = rows[i];
      phrases.push({
        id: `p-${tier}-${String(i + 1).padStart(3, "0")}`,
        ko: r[0], hanja: r[1], zh: r[2], en: r[3], pos: "phrase",
        tier, unit: first + Math.floor(((i - s) * units) / (e - s)),
        ex: r[4], exZh: r[5], exEn: r[6], ...(r[7] ? { note: r[7] } : {}),
        check: r[8] === 1,
      });
    }
  });
  const out = [];
  for (let u = 1; u <= ranges.at(-1)[1]; u++) out.push(...interleave(words.filter((w) => w.unit === u), phrases.filter((p) => p.unit === u)));
  return out;
}

export const vocab = [
  ...withPhrases(expand(INT, "int"), PH_INT, "int"),
  ...withPhrases(expand(ADV, "adv"), PH_ADV, "adv"),
  ...withPhrases(expand(BEG, "beg"), PH_BEG, "beg"),
];

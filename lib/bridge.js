// Pairs each Han character of a Cantonese word with its Jyutping syllable, its 한글
// spelling and (when one exists) the Sino-Korean reading a Korean speaker already knows.
import { syllables } from "./jyutping.js";

const HAN = /\p{Script=Han}/u;

export function bridge(zh, jp, table) {
  const chars = [...zh].filter((c) => HAN.test(c));
  const syl = syllables(jp).filter((s) => !s.punct);
  if (chars.length !== syl.length) return null;
  return chars.map((ch, i) => ({ ch, jp: syl[i].jp, hg: syl[i].hg, ko: table[ch] ?? null }));
}

export const hasBridge = (rows) => Array.isArray(rows) && rows.some((r) => r.ko !== null);

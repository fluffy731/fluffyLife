// Pairs each Han character of a Cantonese word with its Jyutping syllable, its 한글
// spelling and (when one exists) the Sino-Korean reading a Korean speaker already knows.
import { syllables } from "./jyutping.js";
import { split, join } from "./hangul.js";

// Korean initial-sound rule (두음법칙): word-initial ㄹ → ㄴ (or ㅇ before i/y), ㄴ → ㅇ before i/y.
// Readings are stored in dictionary form (老 로, 六 륙); the first character of a word is shown as she says it (노, 육).
const IY = new Set([..."ㅑㅕㅖㅛㅠㅣ"]);
export function dueum(ko) {
  const s = split(ko);
  if (s.c === "ㄹ") return join({ ...s, c: IY.has(s.v) ? "ㅇ" : "ㄴ" });
  if (s.c === "ㄴ" && IY.has(s.v)) return join({ ...s, c: "ㅇ" });
  return ko;
}

const HAN = /\p{Script=Han}/u;

export function bridge(zh, jp, table) {
  const chars = [...zh].filter((c) => HAN.test(c));
  const syl = syllables(jp).filter((s) => !s.punct);
  if (chars.length !== syl.length) return null;
  return chars.map((ch, i) => {
    const ko = table[ch] ?? null;
    return { ch, jp: syl[i].jp, hg: syl[i].hg, ko: ko && i === 0 ? dueum(ko) : ko };
  });
}

export const hasBridge = (rows) => Array.isArray(rows) && rows.some((r) => r.ko !== null);

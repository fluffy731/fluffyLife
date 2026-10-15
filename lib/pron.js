// Korean pronunciation: standard sound-change rules applied to hangul, and
// Revised Romanization of the result. Covers the regular rules (liaison,
// neutralisation, nasalisation, ㄹ assimilation, aspiration, palatalisation,
// tensification after obstruents). Lexical exceptions (사이시옷 compounds,
// verb-stem tensification after ㄴ/ㅁ) are not modelled.

import { CHO, JUNG, JONG, isHangul, split, join } from "./hangul.js";

const DOUBLE = { ㄳ: ["ㄱ", "ㅅ"], ㄵ: ["ㄴ", "ㅈ"], ㄶ: ["ㄴ", "ㅎ"], ㄺ: ["ㄹ", "ㄱ"], ㄻ: ["ㄹ", "ㅁ"], ㄼ: ["ㄹ", "ㅂ"], ㄽ: ["ㄹ", "ㅅ"], ㄾ: ["ㄹ", "ㅌ"], ㄿ: ["ㄹ", "ㅍ"], ㅀ: ["ㄹ", "ㅎ"], ㅄ: ["ㅂ", "ㅅ"] };
const SIMPLIFY = { ㄳ: "ㄱ", ㄵ: "ㄴ", ㄶ: "ㄴ", ㄺ: "ㄱ", ㄻ: "ㅁ", ㄼ: "ㄹ", ㄽ: "ㄹ", ㄾ: "ㄹ", ㄿ: "ㅂ", ㅀ: "ㄹ", ㅄ: "ㅂ" };
const NEUTRAL = { ㄲ: "ㄱ", ㅋ: "ㄱ", ㅅ: "ㄷ", ㅆ: "ㄷ", ㅈ: "ㄷ", ㅊ: "ㄷ", ㅌ: "ㄷ", ㅎ: "ㄷ", ㅍ: "ㅂ" };
const ASPIRATE = { ㄱ: "ㅋ", ㄷ: "ㅌ", ㅂ: "ㅍ", ㅈ: "ㅊ" };
const TENSE = { ㄱ: "ㄲ", ㄷ: "ㄸ", ㅂ: "ㅃ", ㅅ: "ㅆ", ㅈ: "ㅉ" };
const NASAL = { ㄱ: "ㅇ", ㄷ: "ㄴ", ㅂ: "ㅁ" };
const OBSTRUENT = new Set(["ㄱ", "ㄷ", "ㅂ"]);

function boundary(cur, nxt, { tense, sino }) {
  let h = false; // pending aspiration from ㄶ/ㅀ
  const vowelNext = nxt && nxt.c === "ㅇ";

  let tenseNext = false; // ㄵ/ㄻ/ㄼ/ㄽ/ㄾ before a consonant tensify it: 앉다 → 안따, 넓다 → 널따
  if (DOUBLE[cur.j]) {
    const [a, b] = DOUBLE[cur.j];
    if (vowelNext) {
      if (b === "ㅎ") { nxt.c = a; cur.j = ""; return; }           // 싫어 → 시러
      cur.j = a; nxt.c = tense && OBSTRUENT.has(a) && TENSE[b] ? TENSE[b] : b; // 없어 → 업써
      return;
    }
    if (cur.j === "ㄺ" && nxt && nxt.c === "ㄱ") { cur.j = "ㄹ"; nxt.c = "ㄲ"; return; } // 읽고 → 일꼬
    if (b === "ㅎ") h = true;
    if ("ㄵㄻㄼㄽㄾ".includes(cur.j)) tenseNext = true;
    cur.j = SIMPLIFY[cur.j];
  }

  if (cur.j === "ㅎ") {
    if (!nxt) { cur.j = "ㄷ"; return; }
    if (vowelNext) { cur.j = ""; return; }
    if (ASPIRATE[nxt.c]) { nxt.c = ASPIRATE[nxt.c]; cur.j = ""; return; }
    if (nxt.c === "ㅅ") { nxt.c = "ㅆ"; cur.j = ""; return; }
    if (nxt.c === "ㄴ") { cur.j = "ㄴ"; return; }
    cur.j = "ㄷ";
  }
  if (h && nxt) {
    if (ASPIRATE[nxt.c]) { nxt.c = ASPIRATE[nxt.c]; return; }
    if (nxt.c === "ㅅ") { nxt.c = "ㅆ"; return; }
  }

  if (vowelNext && cur.j && cur.j !== "ㅇ") {
    if (nxt.v === "ㅣ" && (cur.j === "ㄷ" || cur.j === "ㅌ")) { nxt.c = cur.j === "ㄷ" ? "ㅈ" : "ㅊ"; cur.j = ""; return; }
    nxt.c = cur.j; cur.j = ""; return;
  }

  if (NEUTRAL[cur.j]) cur.j = NEUTRAL[cur.j];
  if (!nxt) return;

  if (nxt.c === "ㅎ" && OBSTRUENT.has(cur.j)) {
    nxt.c = ASPIRATE[cur.j === "ㄷ" ? "ㄷ" : cur.j];
    if (nxt.c === "ㅌ" && nxt.v === "ㅣ") nxt.c = "ㅊ";
    cur.j = ""; return;
  }
  if (nxt.c === "ㄹ" && (OBSTRUENT.has(cur.j) || cur.j === "ㅁ" || cur.j === "ㅇ")) nxt.c = "ㄴ";
  if ((nxt.c === "ㄴ" || nxt.c === "ㅁ") && NASAL[cur.j]) { cur.j = NASAL[cur.j]; return; }
  if (cur.j === "ㄴ" && nxt.c === "ㄹ") { cur.j = "ㄹ"; return; }
  if (cur.j === "ㄹ" && nxt.c === "ㄴ") { nxt.c = "ㄹ"; return; }
  if (tense) {
    if ((OBSTRUENT.has(cur.j) || tenseNext) && TENSE[nxt.c]) nxt.c = TENSE[nxt.c];
    else if (sino && cur.j === "ㄹ" && "ㄷㅅㅈ".includes(nxt.c)) nxt.c = TENSE[nxt.c];
  }
}

// Returns the pronounced form in hangul, e.g. 학문 → 항문.
export function pronounce(text, opts = {}) {
  const o = { tense: true, sino: false, ...opts };
  const toks = [...text].map((ch) => (isHangul(ch) ? split(ch) : ch));
  for (let i = 0; i < toks.length; i++) {
    const cur = toks[i]; if (typeof cur === "string") continue;
    const nxt = typeof toks[i + 1] === "object" ? toks[i + 1] : null;
    boundary(cur, nxt, o);
  }
  return toks.map((t) => (typeof t === "string" ? t : join(t))).join("");
}

const R_CHO = { ㄱ: "g", ㄲ: "kk", ㄴ: "n", ㄷ: "d", ㄸ: "tt", ㄹ: "r", ㅁ: "m", ㅂ: "b", ㅃ: "pp", ㅅ: "s", ㅆ: "ss", ㅇ: "", ㅈ: "j", ㅉ: "jj", ㅊ: "ch", ㅋ: "k", ㅌ: "t", ㅍ: "p", ㅎ: "h" };
const R_JUNG = ["a", "ae", "ya", "yae", "eo", "e", "yeo", "ye", "o", "wa", "wae", "oe", "yo", "u", "wo", "we", "wi", "yu", "eu", "ui", "i"];
const R_JONG = { "": "", ㄱ: "k", ㄴ: "n", ㄷ: "t", ㄹ: "l", ㅁ: "m", ㅂ: "p", ㅇ: "ng" };

// Revised Romanization. Tensification is not written in RR, so it is turned off here.
export function romanize(text, opts = {}) {
  const said = pronounce(text, { ...opts, tense: false });
  let out = "", prevJ = "";
  for (const ch of said) {
    if (!isHangul(ch)) { out += ch; prevJ = ""; continue; }
    const { c, v, j } = split(ch);
    out += (c === "ㄹ" && prevJ === "ㄹ" ? "l" : R_CHO[c]) + R_JUNG[JUNG.indexOf(v)] + (R_JONG[j] ?? R_JONG[NEUTRAL[j] ?? SIMPLIFY[j] ?? ""]);
    prevJ = j;
  }
  return out;
}

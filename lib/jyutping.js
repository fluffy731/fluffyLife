// Jyutping → 한글 pronunciation spelling (the role pinyin plays for Mandarin).
// Rule-based and table-driven. Spec: docs/superpowers/specs/2026-10-15-cantonese-for-korean-speakers-design.md
import { join } from "./hangul.js";

export const TONE_SUP = ["", "¹", "²", "³", "⁴", "⁵", "⁶"];

// Initial → 한글 consonant. b d g z are unaspirated (≈ Korean 경음 by timing); p t k c aspirated.
// Edit this table to switch to ㅂ ㄷ ㄱ ㅈ if preferred.
const INITIALS = { b: "ㅃ", p: "ㅍ", m: "ㅁ", f: "ㅍ", d: "ㄸ", t: "ㅌ", n: "ㄴ", l: "ㄹ", g: "ㄲ", k: "ㅋ", h: "ㅎ", z: "ㅉ", c: "ㅊ", s: "ㅅ", ng: "ㅇ", gw: "ㄲ", kw: "ㅋ", w: "ㅇ", j: "ㅇ", "": "ㅇ" };
const INITIAL_KEYS = ["ng", "gw", "kw", "b", "p", "m", "f", "d", "t", "n", "l", "g", "k", "h", "w", "z", "c", "s", "j"];

// Final → { v: vowel jamo, c: coda jamo, t: trailing syllable (이/우) for the second vowel of a diphthong }.
const F = (v, c = "", t = "") => ({ v, c, t });
const FINALS = {
  aa: F("ㅏ"), aai: F("ㅏ", "", "이"), aau: F("ㅏ", "", "우"), aam: F("ㅏ", "ㅁ"), aan: F("ㅏ", "ㄴ"), aang: F("ㅏ", "ㅇ"), aap: F("ㅏ", "ㅂ"), aat: F("ㅏ", "ㄷ"), aak: F("ㅏ", "ㄱ"),
  a: F("ㅓ"), ai: F("ㅓ", "", "이"), au: F("ㅓ", "", "우"), am: F("ㅓ", "ㅁ"), an: F("ㅓ", "ㄴ"), ang: F("ㅓ", "ㅇ"), ap: F("ㅓ", "ㅂ"), at: F("ㅓ", "ㄷ"), ak: F("ㅓ", "ㄱ"),
  e: F("ㅔ"), ei: F("ㅔ", "", "이"), eu: F("ㅔ", "", "우"), eng: F("ㅔ", "ㅇ"), ek: F("ㅔ", "ㄱ"),
  i: F("ㅣ"), iu: F("ㅣ", "", "우"), im: F("ㅣ", "ㅁ"), in: F("ㅣ", "ㄴ"), ing: F("ㅣ", "ㅇ"), ip: F("ㅣ", "ㅂ"), it: F("ㅣ", "ㄷ"), ik: F("ㅣ", "ㄱ"),
  o: F("ㅗ"), oi: F("ㅗ", "", "이"), ou: F("ㅗ", "", "우"), on: F("ㅗ", "ㄴ"), ong: F("ㅗ", "ㅇ"), ot: F("ㅗ", "ㄷ"), ok: F("ㅗ", "ㄱ"),
  u: F("ㅜ"), ui: F("ㅜ", "", "이"), un: F("ㅜ", "ㄴ"), ung: F("ㅜ", "ㅇ"), ut: F("ㅜ", "ㄷ"), uk: F("ㅜ", "ㄱ"),
  oe: F("ㅓ"), oeng: F("ㅓ", "ㅇ"), oek: F("ㅓ", "ㄱ"), eoi: F("ㅓ", "", "이"), eon: F("ㅓ", "ㄴ"), eot: F("ㅓ", "ㄷ"),
  yu: F("ㅟ"), yun: F("ㅟ", "ㄴ"), yut: F("ㅟ", "ㄷ"),
};
// After w / gw / kw the vowel merges with the labial glide; after j with the palatal glide.
const GLIDE_W = { aa: "ㅘ", a: "ㅝ", o: "ㅝ", i: "ㅟ", u: "ㅜ", e: "ㅞ" };
const GLIDE_J = { aa: "ㅑ", a: "ㅕ", e: "ㅖ", o: "ㅛ", u: "ㅠ", oe: "ㅕ" };
// Final-vowel keys whose glide key is the leading vowel letters (aai → aa, ou → o …).
const NUCLEUS = (fin) => (fin.startsWith("aa") ? "aa" : fin.startsWith("oe") ? "oe" : fin.startsWith("eo") ? "eo" : fin.startsWith("yu") ? "yu" : fin[0]);

function convert(raw) {
  const jp = raw.toLowerCase();
  if (jp === "m") return "음";
  if (jp === "ng") return "응";
  const initial = INITIAL_KEYS.find((k) => jp.startsWith(k) && FINALS[jp.slice(k.length)]) ?? "";
  const fin = jp.slice(initial.length);
  const f = FINALS[fin];
  if (!f) return null;
  let v = f.v;
  const nuc = NUCLEUS(fin);
  if ((initial === "w" || initial === "gw" || initial === "kw") && GLIDE_W[nuc]) {
    // Only the bare vowel merges (aa, a, o, i, u, e); the glide applies to the leading vowel.
    v = GLIDE_W[nuc];
  } else if (initial === "j" && GLIDE_J[nuc] && !fin.startsWith("yu")) {
    v = GLIDE_J[nuc];
  }
  const head = join({ c: INITIALS[initial], v, j: f.c });
  return head + f.t;
}

// Splits text into Jyutping syllables and other tokens (punctuation, digits, names).
export function syllables(text) {
  const out = [];
  for (const tok of text.split(/\s+/).filter(Boolean)) {
    const m = tok.match(/^([A-Za-z]+)([1-6])?([^A-Za-z0-9]*)$/);
    if (m && !/^[A-Z]{2,}$/.test(m[1])) {
      const [, body, tone, trail] = m;
      const hg = convert(body);
      const t = tone ? Number(tone) : null;
      out.push({ jp: body + (tone ?? ""), hg: hg ?? body + (tone ?? ""), tone: t, ok: hg !== null });
      if (trail) out.push({ jp: trail, hg: trail, tone: null, ok: true, punct: true });
    } else {
      out.push({ jp: tok, hg: tok, tone: null, ok: true, punct: true });
    }
  }
  return out;
}

// Punctuation that attaches to the previous token with no space before it.
export const ATTACH = /^[,.;:!?，。！？、…)”’]+$/;

export function hangul(text, { tones = false } = {}) {
  let out = "";
  for (const s of syllables(text)) {
    const piece = s.hg + (tones && s.tone && s.ok ? TONE_SUP[s.tone] : "");
    const attach = s.punct && ATTACH.test(s.jp);
    out += (out && !attach ? " " : "") + piece;
  }
  return out;
}

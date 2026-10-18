// Builds dict/ko.json, the offline Korean dictionary, from Wiktionary's Korean entries as extracted
// by kaikki.org (CC BY-SA 4.0). Run at deploy time (the build machine has internet):
//   node scripts/build-dict.mjs [source.jsonl|URL]
// Row: [word, hanja, pos, pronunciation, glosses, exampleKo, exampleEn]
import { createReadStream, createWriteStream, mkdirSync } from "node:fs";
import { createInterface } from "node:readline";
import { Readable } from "node:stream";

export const SOURCE = "https://kaikki.org/dictionary/Korean/kaikki.org-dictionary-Korean.jsonl";
const POS = { noun: "n", verb: "v", adj: "adj", adv: "adv", character: "字", intj: "감", num: "num", pron: "pron", det: "det", particle: "조사", phrase: "구", counter: "cl", prefix: "접두", suffix: "접미" };
const SKIP = new Set(["name", "syllable", "root", "romanization", "soft-redirect", "symbol", "punct"]);
const clip = (s, n) => (s.length > n ? s.slice(0, n - 1) + "…" : s);

export function convertEntry(e) {
  if (!e || e.lang_code !== "ko" || SKIP.has(e.pos) || !e.word) return null;
  const glosses = [];
  let exKo = "", exEn = "";
  for (const s of e.senses || []) {
    if (s.tags?.includes("form-of") || s.form_of) continue;
    const g = (s.glosses || [])[0];
    if (g && !glosses.includes(g)) glosses.push(clip(g.trim(), 90));
    if (!exKo) for (const x of s.examples || []) {
      if (x.text && (x.english || x.translation) && x.text.length <= 80) { exKo = x.text.trim(); exEn = clip((x.english || x.translation).trim(), 120); break; }
    }
  }
  if (!glosses.length) return null;
  const hanjaForm = (e.forms || []).find((f) => f.tags?.includes("hanja"))?.form;
  const hanja = e.pos === "character" ? e.word : hanjaForm && /\p{Script=Han}/u.test(hanjaForm) ? hanjaForm : "";
  let pron = "";
  if (e.pos === "character") {
    // e.g. "經 (eumhun 지날 경)": the Korean meaning-and-sound reading.
    const m = (e.head_templates || []).map((h) => h.expansion || "").join(" ").match(/[가-힣]+(?:\s[가-힣]+)?(?=[^가-힣]*\)?\s*$)|[가-힣]+\s[가-힣]/u);
    pron = m ? m[0] : "";
  } else {
    const h = (e.sounds || []).find((s) => s.hangeul)?.hangeul;
    if (h && h !== e.word) pron = h;
  }
  return [e.word, hanja, POS[e.pos] || e.pos, pron, glosses.slice(0, 3).join("; "), exKo, exEn];
}

export async function build(src = SOURCE, out = "dict/ko.json") {
  const input = /^https?:/.test(src) ? Readable.fromWeb((await fetch(src)).body) : createReadStream(src);
  const rows = [];
  for await (const line of createInterface({ input, crlfDelay: Infinity })) {
    if (!line.trim()) continue;
    try { const r = convertEntry(JSON.parse(line)); if (r) rows.push(r); } catch { /* skip a malformed line */ }
  }
  rows.sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0));
  mkdirSync(out.replace(/\/[^/]+$/, ""), { recursive: true });
  const w = createWriteStream(out);
  w.write(`{"source":"Wiktionary (kaikki.org), CC BY-SA 4.0","built":"${new Date().toISOString().slice(0, 10)}","rows":[\n`);
  rows.forEach((r, i) => w.write(JSON.stringify(r) + (i < rows.length - 1 ? ",\n" : "\n")));
  w.end("]}\n");
  await new Promise((res) => w.on("finish", res));
  return rows.length;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const n = await build(process.argv[2] || SOURCE, process.argv[3] || "dict/ko.json");
  console.log(`dict/ko.json: ${n} entries`);
}

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

// ---------- Cantonese: CC-CEDICT + CC-Canto readings + CC-Canto words (cantonese.org, CC BY-SA 3.0) ----------
// Row: [characters, jyutping, english, korean] — Korean comes from the Korean dictionary's hanja.
import { readdirSync, readFileSync } from "node:fs";
const LINE = /^(\S+) (\S+) \[([^\]]+)\](?: \{([^}]+)\})?(?: \/(.*)\/)?\s*$/;
const DROP = /^(CL:|variant of|old variant|see also|see |also written|abbr\. for|surname )/i;
const cleanGloss = (g) => (g || "").split("/").map((x) => x.trim()).filter((x) => x && !DROP.test(x)).slice(0, 3).map((x) => clip(x, 70)).join("; ");

export function koBridge(koRows) {
  const map = new Map();
  for (const r of koRows) {
    if (!r[1]) continue;
    const ko = r[2] === "字" ? r[3] || r[0] : r[0];
    for (const h of r[1].split("/")) {
      const list = map.get(h) || []; if (!list.includes(ko) && list.length < 2) list.push(ko); map.set(h, list);
    }
  }
  return map;
}

export async function buildYue(dir, koRows, out = "dict/yue.json") {
  const files = readdirSync(dir);
  const pick = (re, not) => files.find((f) => re.test(f) && !(not && not.test(f)));
  const read = (f) => (f ? readFileSync(join2(dir, f), "utf8").split("\n") : []);
  const readings = new Map();
  for (const l of read(pick(/readings/i))) { const m = l.match(LINE); if (m && m[4]) { readings.set(`${m[1]}|${m[3].toLowerCase()}`, m[4]); if (!readings.has(m[1])) readings.set(m[1], m[4]); } }
  const bridge = koBridge(koRows);
  const rows = new Map();
  const add = (zh, jp, en) => { if (!en || !jp) return; const key = `${zh}|${jp}`; if (!rows.has(key)) rows.set(key, [zh, jp, en, (bridge.get(zh) || []).join(" · ")]); };
  for (const l of read(pick(/cccanto/i, /readings/i))) { const m = l.match(LINE); if (m) add(m[1], m[4], cleanGloss(m[5])); }
  for (const l of read(pick(/cedict/i, /readings|canto/i))) {
    const m = l.match(LINE); if (!m || /[A-Z]/.test(m[3])) continue; // capitalised pinyin = proper noun
    add(m[1], readings.get(`${m[1]}|${m[3].toLowerCase()}`) || readings.get(m[1]), cleanGloss(m[5]));
  }
  return writeRows([...rows.values()], out, "CC-CEDICT and CC-Canto (cantonese.org), CC BY-SA");
}
const join2 = (d, f) => (d.endsWith("/") ? d + f : `${d}/${f}`);

// ---------- English: Wiktionary English entries with Korean translations (kaikki.org, CC BY-SA 4.0) ----------
// Row: [word, ipa, pos, korean, english definition]
export const EN_SOURCE = "https://kaikki.org/dictionary/English/kaikki.org-dictionary-English.jsonl";
const EN_POS = { noun: "n", verb: "v", adj: "adj", adv: "adv" };
const EN_SKIP = new Set(["name", "character", "symbol", "prefix", "suffix", "infix", "interfix", "punct", "romanization", "letter", "abbrev"]);
export function convertEn(e) {
  if (!e || e.lang_code !== "en" || EN_SKIP.has(e.pos) || !e.word) return null;
  const tr = [...(e.translations || []), ...(e.senses || []).flatMap((s) => s.translations || [])].filter((t) => t.lang_code === "ko" && t.word);
  const ko = [];
  for (const t of tr) { const w = t.alt && !t.word.includes(t.alt) ? `${t.word} ${t.alt}` : t.word; if (!ko.includes(w) && ko.length < 4) ko.push(w); }
  if (!ko.length) return null;
  const ipa = ((e.sounds || []).find((s) => s.ipa && s.ipa.startsWith("/"))?.ipa || "").replace(/^\/|\/$/g, "");
  const gloss = clip(((e.senses || []).find((s) => s.glosses?.length)?.glosses[0] || "").trim(), 110);
  return [e.word, ipa, EN_POS[e.pos] || e.pos, ko.join(" · "), gloss];
}
export async function buildEn(src = EN_SOURCE, out = "dict/en.json") {
  const input = /^https?:/.test(src) ? Readable.fromWeb((await fetch(src)).body) : createReadStream(src);
  const rows = [];
  for await (const line of createInterface({ input, crlfDelay: Infinity })) {
    if (!line.includes('"ko"')) continue; // cheap filter: most entries have no Korean translation
    try { const r = convertEn(JSON.parse(line)); if (r) rows.push(r); } catch { /* skip */ }
  }
  return writeRows(rows, out, "Wiktionary (kaikki.org), CC BY-SA 4.0", (a, b) => a[0].toLowerCase().localeCompare(b[0].toLowerCase()));
}

async function writeRows(rows, out, source, cmp = (a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0)) {
  rows.sort(cmp);
  mkdirSync(out.replace(/\/[^/]+$/, ""), { recursive: true });
  const w = createWriteStream(out);
  w.write(`{"source":${JSON.stringify(source)},"built":"${new Date().toISOString().slice(0, 10)}","rows":[\n`);
  rows.forEach((r, i) => w.write(JSON.stringify(r) + (i < rows.length - 1 ? ",\n" : "\n")));
  w.end("]}\n");
  await new Promise((res) => w.on("finish", res));
  return rows.length;
}

// CLI: node scripts/build-dict.mjs ko [src] | yue <dir-with-cedict-and-canto-files> | en [src]
if (import.meta.url === `file://${process.argv[1]}`) {
  const [mode = "ko", arg] = process.argv.slice(2);
  if (mode === "ko") console.log(`dict/ko.json: ${await build(arg || SOURCE, "dict/ko.json")} entries`);
  if (mode === "yue") console.log(`dict/yue.json: ${await buildYue(arg, JSON.parse(readFileSync("dict/ko.json", "utf8")).rows)} entries`);
  if (mode === "en") console.log(`dict/en.json: ${await buildEn(arg || EN_SOURCE)} entries`);
}

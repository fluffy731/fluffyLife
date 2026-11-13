// Builds dict/ko.json, the offline Korean dictionary, at deploy time (the build machine has internet).
// Four sources, merged in this order of trust (a later source only adds words the earlier ones lack):
//   1. Wiktionary's Korean entries as extracted by kaikki.org (CC BY-SA 4.0): English glosses, examples.
//   2. 한국어기초사전 (krdict), the National Institute of Korean Language learner's dictionary
//      (CC BY-SA 2.0 KR): English equivalents, hanja, pronunciation, Korean example sentences.
//   3. Kengdic (Joe Speigle, MPL 2.0 / LGPL): a large Korean–English word list.
//   4. 표준국어대사전 (stdict), the Institute's standard dictionary (CC BY-SA 2.0 KR): everyday Sino-Korean
//      words (no specialist field, no names) with their hanja and a Korean definition. Its examples are
//      left out: some are quoted from publications and are not openly licensed.
// The Institute's XML comes from github.com/spellcheck-ko/korean-dict-nikl (the "download all" files):
//   node scripts/build-dict.mjs ko [wiktionary.jsonl|URL] [--nikl=DIR] [--kengdic=TSV|URL|none]
// Row: [word, hanja, pos, pronunciation, glosses, exampleKo, exampleEn]
import { createReadStream, createWriteStream, mkdirSync, existsSync } from "node:fs";
import { createInterface } from "node:readline";
import { Readable } from "node:stream";
import { romanize } from "../lib/pron.js";

export const SOURCE = "https://kaikki.org/dictionary/Korean/kaikki.org-dictionary-Korean.jsonl";
export const KENGDIC = "https://raw.githubusercontent.com/garfieldnate/kengdic/master/kengdic.tsv";
export const NIKL_REPO = "https://github.com/spellcheck-ko/korean-dict-nikl.git";
const POS = { noun: "n", verb: "v", adj: "adj", adv: "adv", character: "字", intj: "감", num: "num", pron: "pron", det: "det", particle: "조사", phrase: "구", counter: "cl", prefix: "접두", suffix: "접미" };
const SKIP = new Set(["name", "syllable", "root", "romanization", "soft-redirect", "symbol", "punct"]);
const clip = (s, n) => (s.length > n ? s.slice(0, n - 1) + "…" : s);
const HAN = /\p{Script=Han}/u;
const byWord = (a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0);

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
  const hanja = e.pos === "character" ? e.word : hanjaForm && HAN.test(hanjaForm) ? hanjaForm : "";
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

// ---------- National Institute of Korean Language XML (krdict: LMF, stdict: RSS-style items) ----------
const ENT = { lt: "<", gt: ">", amp: "&", quot: '"', apos: "'" };
const unxml = (s) => s.replace(/&(#x[0-9a-f]+|#\d+|\w+);/gi, (m, e) => (e[0] === "#" ? String.fromCodePoint(e[1] === "x" || e[1] === "X" ? parseInt(e.slice(2), 16) : Number(e.slice(1))) : ENT[e] ?? m));
const tidy = (s) => unxml(s).replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
const feat = (xml, att) => { const m = xml.match(new RegExp(`<feat att="${att}" val="([^"]*)"`)); return m ? tidy(m[1]) : ""; };
const NIKL_POS = { 명사: "n", "의존 명사": "n", 동사: "v", "보조 동사": "v", 형용사: "adj", "보조 형용사": "adj", 부사: "adv", 대명사: "pron", 수사: "num", 관형사: "det", 감탄사: "감", 조사: "조사", 어미: "어미" };
const UNIT_POS = { 관용구: "관용구", 속담: "속담", 구: "구", "문법‧표현": "표현" };
const niklPos = (pos, unit, word) => UNIT_POS[unit] || (pos === "접사" ? (word.startsWith("-") ? "접미" : "접두") : NIKL_POS[pos] || "");
const joinGlosses = (list) => {
  const out = [];
  for (const g of list.flatMap((x) => x.split(/\s*;\s*/))) if (g && !out.includes(g)) out.push(g);
  return clip(out.slice(0, 4).join("; "), 90);
};

// One krdict <LexicalEntry>. Glosses are the English equivalents of up to three senses. Where the
// equivalent is only the romanisation (affixes "-ga", auxiliary 하다 "hada"), the English definition
// stands in. An entry with no English at all keeps its Korean definition.
const letters = (s) => s.toLowerCase().replace(/[^a-z]/g, "");
export function convertKrdict(xml) {
  const head = xml.split("<Sense ")[0];
  const word = feat(head.match(/<Lemma>[\s\S]*?<\/Lemma>/)?.[0] || "", "writtenForm");
  if (!word) return null;
  const origin = feat(head, "origin");
  const pron = feat(head.match(/<WordForm>[\s\S]*?<\/WordForm>/)?.[0] || "", "pronunciation").replace(/ː/g, "");
  const rom = letters(romanize(word.replace(/\(.*?\)/g, "")));
  const en = [], ko = [];
  let ex = "";
  for (const s of xml.split("<Sense ").slice(1, 4)) {
    const eq = [...s.matchAll(/<Equivalent>([\s\S]*?)<\/Equivalent>/g)].map((m) => m[1]).find((q) => feat(q, "language") === "영어");
    if (eq) {
      const lemma = feat(eq, "lemma").replace(/[.\s]+$/, "");
      const g = !lemma || letters(lemma) === rom || /no equivalent/i.test(lemma) ? clip(feat(eq, "definition").replace(/\.$/, ""), 90) : lemma;
      if (g) en.push(g);
    }
    const d = feat(s.replace(/<(Equivalent|SenseExample|SenseRelation|Multimedia)>[\s\S]*?<\/\1>/g, ""), "definition");
    if (d) ko.push(d.replace(/\.$/, ""));
    if (!ex) for (const m of s.matchAll(/<SenseExample>([\s\S]*?)<\/SenseExample>/g)) {
      const t = feat(m[1], "example");
      if (feat(m[1], "type") === "문장" && t.length <= 60) { ex = t; break; }
    }
  }
  const glosses = en.length ? joinGlosses(en) : clip(ko.slice(0, 2).join("; "), 90);
  if (!glosses) return null;
  const unit = feat(head, "lexicalUnit");
  return [word, HAN.test(origin) ? origin : "", niklPos(feat(head, "partOfSpeech"), unit, word), pron !== word ? pron : "", glosses, ex, ""];
}

// One stdict <item>, parsed. Headwords mark syllable boundaries with "-", spaces with "^" and
// homographs with a number: 엽록-체 → 엽록체, 사과05 → 사과. Hanja alternatives are joined with "/".
const cdata = (xml, tag) => [...xml.matchAll(new RegExp(`<${tag}>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?</${tag}>`, "g"))].map((m) => tidy(m[1]));
export function parseStdict(xml) {
  const raw = cdata(xml, "word")[0] || "";
  const word = raw.replace(/\d+$/, "").replace(/\^/g, " ").replace(/(?<=\S)-(?=\S)/g, "");
  if (!word) return null;
  const hanja = cdata(xml, "original_language").join("").replace(/\s+/g, "");
  return {
    word, hanja: HAN.test(hanja) ? hanja : "",
    unit: cdata(xml, "word_unit")[0] || "", type: cdata(xml, "word_type")[0] || "",
    pos: cdata(xml, "pos")[0] || "", pron: (cdata(xml, "pronunciation")[0] || "").replace(/ː/g, ""),
    defs: cdata(xml, "definition").map((d) => d.replace(/\.$/, "")), cats: cdata(xml, "cat"),
  };
}

// The stdict words worth adding: single Sino-Korean words in everyday use. Skips specialist-field and
// proper-noun senses (any <cat> but 없음), and entries that only point elsewhere (a root, dialect,
// North Korean or archaic form, a misspelling).
export const keepStdict = (p) => !!p && p.unit === "단어" && p.type === "한자어" && /^-?[가-힣]+-?$/.test(p.word) && p.cats.every((c) => c === "없음")
  && !!p.defs[0] && !/의 (어근|방언|북한어|옛말|잘못)$/.test(p.defs[0]);
// One definition, kept short: these rows are a third of the file.
export const stdictRow = (p) => [p.word, p.hanja, niklPos(p.pos, p.unit, p.word), p.pron && p.pron !== p.word ? p.pron : "", clip(p.defs[0], 60), "", ""];

// Hanja for words the other sources give without it: only when stdict knows the spelling as exactly one
// Sino-Korean word and as nothing else (사과 is apple, apology and a native word, so it is left alone).
// Returns fill(word) → hanja or ""; fill.add(parsed) takes more entries.
export function hanjaFiller(parsed = []) {
  const map = new Map();
  const add = (p) => {
    if (!p || p.unit !== "단어") return;
    const m = map.get(p.word) || { han: new Set(), other: false };
    if (p.type === "한자어" && p.hanja) m.han.add(p.hanja); else m.other = true;
    map.set(p.word, m);
  };
  parsed.forEach(add);
  const fill = (word) => { const m = map.get(word); return m && !m.other && m.han.size === 1 ? [...m.han][0] : ""; };
  fill.add = add;
  return fill;
}

// ---------- Kengdic TSV: id, surface, hanja, gloss, level, created, source ----------
// Kengdic's reverse entries include phrases that explain an English word rather than name a Korean one
// ("대학 구내 밖에 사는" outcollege): a phrase cut from a sentence, three or more words, or a modifier
// ending (-는, -적인, a phrase ending in -의) is left out.
const FRAGMENT = /^(의|에|을|를|은|는|와|과|로|으로|에서|에게|께|도|만|처럼|보다) |\S+ \S+ \S+|(는|적인)$| \S*의$/;
export function kengdicPos(word, gloss) {
  const g = gloss.toLowerCase();
  if (/다$/.test(word)) return /^to be /.test(g) ? "adj" : /^to /.test(g) ? "v" : /^\S+(y|ous|ful|ive|al|ic|ish|less|able|ible|ant|ent|ar|ary)\b/.test(g) ? "adj" : "v";
  if (word.includes(" ")) return "구";
  if (/[이히게리]$/.test(word) && /^\S+ly\b/.test(g)) return "adv";
  return /의$/.test(word) ? "" : "n"; // 휴정의 "recessional": a modifier, not a noun
}
export function convertKengdic(line) {
  const c = line.split("\t");
  if (c.length < 4 || c[0] === "id") return null;
  const word = c[1].replace(/\s+/g, " ").trim();
  let gloss = c[3].replace(/\s+/g, " ").trim().replace(/\.+$/, "");
  if (!gloss || !/^[가-힣]+(?: [가-힣]+)*$/.test(word) || word.length > 16 || FRAGMENT.test(word)) return null;
  gloss = gloss.replace(/^(an?) (?=\S)/i, "").replace(/^[A-Z](?=[a-z])/, (m) => m.toLowerCase());
  const hanja = c[2].replace(/[\s~]/g, "").split(/[,/]/).filter((h) => HAN.test(h)).join("/");
  return [word, hanja, kengdicPos(word, gloss), "", clip(gloss, 90), "", ""];
}
// Kengdic lists some words twice (하다 "to do" twice, 사랑 "love" and "Love"): one row per word and hanja.
export function mergeKengdic(rows) {
  const by = new Map();
  for (const r of rows) {
    const k = `${r[0]}|${r[1]}`, prev = by.get(k);
    if (!prev) { by.set(k, r); continue; }
    const have = prev[4].toLowerCase().split(/[;,] */);
    if (!have.includes(r[4].toLowerCase())) prev[4] = clip(`${prev[4]}; ${r[4]}`, 90);
  }
  return [...by.values()];
}

// ---------- merge ----------
// Sources in order of trust. A row from a later source is dropped when its word is already in, unless
// it carries hanja the earlier rows do not have (a different word spelt the same: 사과 沙果 / 謝過).
export function mergeSources(sources, fillHanja = () => "") {
  const seen = new Map(), out = [];
  for (const rows of sources) {
    const accepted = [];
    for (const r of rows) {
      if (!r[1]) r[1] = fillHanja(r[0]);
      const hs = r[1] ? r[1].split("/") : [], prev = seen.get(r[0]);
      if (prev && (!hs.length || prev.some((p) => hs.some((h) => p.includes(h))))) continue;
      accepted.push([r, hs]);
    }
    for (const [r, hs] of accepted) { seen.set(r[0], [...(seen.get(r[0]) || []), hs]); out.push(r); }
  }
  return out.sort(byWord); // stable: for one word, the most trusted source's row comes first
}

async function lines(src) {
  const input = /^https?:/.test(src) ? Readable.fromWeb((await fetch(src)).body) : createReadStream(src);
  return createInterface({ input, crlfDelay: Infinity });
}
const xmlFiles = (dir) => (existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith(".xml")).sort().map((f) => join2(dir, f)) : []);

export async function build(src = SOURCE, out = "dict/ko.json", { nikl = "", kengdic = "" } = {}) {
  const wikt = [], kr = [], st = [], kg = [], used = ["Wiktionary (kaikki.org), CC BY-SA 4.0"];
  for await (const line of await lines(src)) {
    if (!line.trim()) continue;
    try { const r = convertEntry(JSON.parse(line)); if (r) wikt.push(r); } catch { /* skip a malformed line */ }
  }
  // A missing or broken extra source is left out with a warning: the dictionary still builds from the rest.
  let fill;
  if (nikl) {
    try {
      const krFiles = xmlFiles(join2(nikl, "krdict")), stFiles = xmlFiles(join2(nikl, "stdict"));
      for (const f of krFiles) for (const m of readFileSync(f, "utf8").matchAll(/<LexicalEntry[\s\S]*?<\/LexicalEntry>/g)) { const r = convertKrdict(m[0]); if (r) kr.push(r); }
      if (stFiles.length) fill = hanjaFiller();
      for (const f of stFiles) for (const m of readFileSync(f, "utf8").matchAll(/<item>[\s\S]*?<\/item>/g)) {
        const p = parseStdict(m[0]); fill.add(p); if (keepStdict(p)) st.push(stdictRow(p));
      }
    } catch (e) { kr.length = st.length = 0; fill = undefined; console.warn(`::warning::국립국어원 dictionaries not read: ${e.message}`); }
    if (kr.length || st.length) used.push("국립국어원 한국어기초사전·표준국어대사전 (National Institute of Korean Language), CC BY-SA 2.0 KR");
    else console.warn(`::warning::no 국립국어원 dictionary entries under ${nikl}`);
  }
  if (kengdic && kengdic !== "none") {
    try {
      for await (const line of await lines(kengdic)) { const r = convertKengdic(line); if (r) kg.push(r); }
      if (kg.length) used.push("Kengdic (Joe Speigle), MPL 2.0 / LGPL");
    } catch (e) { console.warn(`::warning::Kengdic not read: ${e.message}`); }
  }
  const rows = mergeSources([wikt, kr, mergeKengdic(kg), st], fill);
  if (!rows.length) throw new Error("no dictionary entries from any source"); // keep last week's file
  console.log(`ko sources: Wiktionary ${wikt.length}, krdict ${kr.length}, Kengdic ${kg.length}, stdict ${st.length} → ${rows.length} rows`);
  return writeRows(rows, out, used.join("; "));
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

// CLI: node scripts/build-dict.mjs ko [src] [--nikl=DIR] [--kengdic=TSV|URL|none] | yue <dir-with-cedict-and-canto-files> | en [src]
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2), flag = (k) => args.find((a) => a.startsWith(`--${k}=`))?.slice(k.length + 3);
  const [mode = "ko", arg] = args.filter((a) => !a.startsWith("--"));
  if (mode === "ko") console.log(`dict/ko.json: ${await build(arg || SOURCE, "dict/ko.json", { nikl: flag("nikl") || "", kengdic: flag("kengdic") ?? KENGDIC })} entries`);
  if (mode === "yue") console.log(`dict/yue.json: ${await buildYue(arg, JSON.parse(readFileSync("dict/ko.json", "utf8")).rows)} entries`);
  if (mode === "en") console.log(`dict/en.json: ${await buildEn(arg || EN_SOURCE)} entries`);
}

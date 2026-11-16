import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { convertEntry, build } from "../scripts/build-dict.mjs";
import { searchDict } from "../lib/dict.js";

const FIX = new URL("./fixtures/kaikki-sample.jsonl", import.meta.url).pathname;
const entries = readFileSync(FIX, "utf8").trim().split("\n").map((l) => JSON.parse(l));
const byWord = (w) => convertEntry(entries.find((e) => e.word === w));

test("converter: word, hanja, pos, pronounced form, glosses, example", () => {
  assert.deepEqual(byWord("학교"), ["학교", "學校", "n", "학꾜", "school", "학교에 가요.", "I go to school."]);
  assert.deepEqual(byWord("먹다"), ["먹다", "", "v", "먹따", "to eat; to drink", "", ""]);
  assert.equal(byWord("경제")[3], "", "no pronunciation shown when it equals the spelling");
});

test("converter: single hanja keeps its 훈음", () => {
  assert.deepEqual(byWord("經").slice(0, 4), ["經", "經", "字", "지날 경"]);
});

test("converter skips names and form-of entries", () => {
  assert.equal(byWord("김"), null);
  assert.equal(byWord("갔다"), null);
});

test("build writes sorted rows with attribution", async () => {
  const out = join(mkdtempSync(join(tmpdir(), "dict-")), "ko.json");
  const n = await build(FIX, out);
  const j = JSON.parse(readFileSync(out, "utf8"));
  assert.equal(n, 5);
  assert.match(j.source, /CC BY-SA/);
  assert.deepEqual(j.rows.map((r) => r[0]), ["經", "경제", "눈치", "먹다", "학교"]);
});

test("search: hangul exact/prefix, hanja contains, English whole word", async () => {
  const out = join(mkdtempSync(join(tmpdir(), "dict-")), "ko.json");
  await build(FIX, out);
  const rows = JSON.parse(readFileSync(out, "utf8")).rows;
  assert.equal(searchDict(rows, "학교")[0][0], "학교");
  assert.equal(searchDict(rows, "먹")[0][0], "먹다");
  assert.deepEqual(searchDict(rows, "經").map((r) => r[0]), ["經", "경제"]);
  assert.deepEqual(searchDict(rows, "eat").map((r) => r[0]), ["먹다"]);
  assert.deepEqual(searchDict(rows, "ea"), []);
  assert.deepEqual(searchDict(rows, ""), []);
});

import { buildYue, convertEn, buildEn } from "../scripts/build-dict.mjs";
import { dictYue } from "../packs/dict-yue.js";
import { dictEn } from "../packs/dict-en.js";
import { validateYue } from "../lib/validate-yue.js";
import { validateEn } from "../lib/validate-en.js";

const YUE_DIR = new URL("./fixtures/yue/", import.meta.url).pathname;
const koRows = [["경제", "經濟", "n", "", "economy", "", ""], ["학교", "學校", "n", "학꾜", "school", "", ""]];

test("yue: CEDICT + Cantonese readings + CC-Canto, Korean meaning via hanja", async () => {
  const out = join(mkdtempSync(join(tmpdir(), "dict-")), "yue.json");
  const n = await buildYue(YUE_DIR, koRows, out);
  const rows = JSON.parse(readFileSync(out, "utf8")).rows;
  assert.equal(n, 4, "proper nouns and entries without a Cantonese reading are dropped");
  const by = Object.fromEntries(rows.map((r) => [r[0], r]));
  assert.deepEqual(by["經濟"], ["經濟", "ging1 zai3", "economy; economic", "경제"]);
  assert.deepEqual(by["唔該"], ["唔該", "m4 goi1", "thank you (for a service); please; excuse me", ""]);
  assert.equal(by["學校"][2], "school", "classifier notes (CL:…) are dropped");
  assert.equal(by["北京"], undefined);
});

test("yue search: characters, Korean meaning, Jyutping, English", async () => {
  const out = join(mkdtempSync(join(tmpdir(), "dict-")), "yue.json");
  await buildYue(YUE_DIR, koRows, out);
  const rows = JSON.parse(readFileSync(out, "utf8")).rows;
  assert.equal(dictYue.search(rows, "唔該")[0][0], "唔該");
  assert.equal(dictYue.search(rows, "경제")[0][0], "經濟");
  assert.equal(dictYue.search(rows, "mou5 man")[0][0], "冇問題");
  assert.equal(dictYue.search(rows, "mgoi")[0][0], "唔該");
  assert.equal(dictYue.search(rows, "problem")[0][0], "冇問題");
});

test("yue: a dictionary word becomes a valid study card", () => {
  const item = { ...dictYue.toItem(["冇問題", "mou5 man6 tai4", "no problem", ""]), id: "u1", kind: "vocab", tier: "a0", unit: 1 };
  assert.deepEqual(validateYue(item, "vocab"), []);
  assert.equal(item.ko, "no problem", "English stands in when there is no Korean meaning");
});

test("en: keeps entries with Korean translations; IPA without slashes; hanja kept", () => {
  const lines = readFileSync(new URL("./fixtures/kaikki-en-sample.jsonl", import.meta.url), "utf8").trim().split("\n").map((l) => JSON.parse(l));
  assert.deepEqual(convertEn(lines[0]), ["free", "fɹiː", "adj", "자유적(自由的)이다 · 자유 自由", "Unconstrained."]);
  assert.deepEqual(convertEn(lines[1]), ["reluctant", "ɹɪˈlʌk.tənt", "adj", "꺼리는", "Not wanting to take some action; unwilling."]);
  assert.equal(convertEn(lines[3]), null, "names dropped");
  assert.equal(convertEn(lines[4]), null, "no Korean translation → dropped");
});

test("en search: English prefix and Korean meaning; added word is a valid card", async () => {
  const out = join(mkdtempSync(join(tmpdir(), "dict-")), "en.json");
  await buildEn(new URL("./fixtures/kaikki-en-sample.jsonl", import.meta.url).pathname, out);
  const rows = JSON.parse(readFileSync(out, "utf8")).rows;
  assert.deepEqual(dictEn.search(rows, "reluc").map((r) => r[0]), ["reluctant"]);
  assert.deepEqual(dictEn.search(rows, "자유").map((r) => r[0]), ["free"]);
  const item = { ...dictEn.toItem(rows.find((r) => r[0] === "free")), id: "u2", kind: "vocab", tier: "int", unit: 1 };
  assert.deepEqual(validateEn(item, "vocab"), []);
});

// ---------- Korean: 국립국어원 dictionaries, Kengdic and the merge ----------
import { convertKrdict, parseStdict, keepStdict, stdictRow, hanjaFiller, convertKengdic, mergeKengdic, mergeSources } from "../scripts/build-dict.mjs";
import { glossLang } from "../lib/dict.js";
import { dictKo } from "../packs/dict-ko.js";

const NIKL = new URL("./fixtures/nikl/", import.meta.url).pathname;
const KENG = new URL("./fixtures/kengdic-sample.tsv", import.meta.url).pathname;
const xmlParts = (f, re) => [...readFileSync(join(NIKL, f), "utf8").matchAll(re)].map((m) => m[0]);
const krRows = xmlParts("krdict/001.xml", /<LexicalEntry[\s\S]*?<\/LexicalEntry>/g).map(convertKrdict);
const stParsed = xmlParts("stdict/000001.xml", /<item>[\s\S]*?<\/item>/g).map(parseStdict);
const kgRows = readFileSync(KENG, "utf8").split("\n").map(convertKengdic);
const kr = (w) => krRows.filter((r) => r[0] === w);

test("krdict: English equivalents, hanja from the origin, pronunciation, a Korean example sentence", () => {
  assert.deepEqual(kr("학교")[0], ["학교", "學校", "n", "학꾜", "school", "", ""]);
  assert.deepEqual(kr("버스")[0], ["버스", "", "n", "", "bus", "", ""], "a loanword's origin (bus) is not hanja");
  assert.deepEqual(kr("사과").map((r) => [r[1], r[4]]), [["沙果/砂果", "apple"], ["謝過", "apology"]]);
  assert.equal(kr("눈치")[0][4], "tact; sense; wits; sign", "two senses, at most four glosses");
  assert.match(kr("눈치")[0][5], /^나는 눈치가 없는 편이라서/);
  assert.equal(kr("눈치(가) 빠르다")[0][2], "관용구");
});

test("krdict: a romanised 'equivalent' gives way to the English definition", () => {
  assert.deepEqual(kr("-가")[0].slice(0, 5), ["-가", "哥", "접미", "", "A suffix used to mean a person who has that family name"]);
  assert.match(kr("하다")[0][4], /^An auxiliary verb/, "not \"hada\"");
});

test("stdict: everyday Sino-Korean words only, headword marks removed, one short Korean definition", () => {
  const by = (w) => stParsed.filter((p) => p.word === w);
  assert.deepEqual(by("엽록체")[0].pron, "염녹체", "엽록-체 → 엽록체");
  assert.equal(by("과겁하다")[0].hanja, "過怯하다");
  assert.deepEqual(stParsed.filter(keepStdict).map(stdictRow), [
    ["강공", "強攻", "n", "", "적극적으로 강하게 공격함", "", ""],
    ["사과", "沙果/砂果", "n", "", "사과나무의 열매", "", ""],
    ["사과", "謝過", "n", "", "자기의 잘못을 인정하고 용서를 빎", "", ""],
  ], "out: 과겁하다 (part native), 균평 (only a root), 눈치 (native), 세종 (history), 엽록체 (botany), 학교 (education)");
  assert.ok(stdictRow(by("엽록체")[0])[4].length <= 60);
});

test("hanja filler: only for a spelling stdict knows as exactly one Sino-Korean word", () => {
  const fill = hanjaFiller(stParsed);
  assert.equal(fill("엽록체"), "葉綠體");
  assert.equal(fill("강공"), "強攻");
  assert.equal(fill("사과"), "", "apple, apology and a native word");
  assert.equal(fill("눈치"), "", "native");
  assert.equal(fill("과겁하다"), "", "part native");
  assert.equal(fill("없는말"), "");
});

test("kengdic: tidy glosses, a guessed part of speech, fragments and numbers left out", () => {
  const kg = (w) => kgRows.filter((r) => r?.[0] === w);
  assert.deepEqual(kg("학교")[0], ["학교", "學校", "n", "", "school", "", ""], "\"School\" → school");
  assert.deepEqual(kg("사과").map((r) => r[4]), ["apology", "apple"], "the article goes");
  assert.equal(kg("천공")[0][1], "天工/穿孔");
  assert.equal(kg("데데하다")[0][2], "adj");
  assert.equal(kg("빨리")[0][2], "adv");
  assert.equal(kg("먹다")[0][2], "v");
  for (const w of ["70세", "떠오르는", "대학 구내 밖에 사는", "사대적인", "의 명칭", "자동 폐쇄의"]) assert.deepEqual(kg(w), [], w);
  const merged = mergeKengdic(kgRows.filter(Boolean));
  assert.deepEqual(merged.filter((r) => r[0] === "하다").map((r) => r[4]), ["to do"], "listed twice");
  assert.deepEqual(merged.filter((r) => r[0] === "사랑").map((r) => r[4]), ["love"], "love and Love");
});

test("merge: the most trusted source wins; later rows add only new words or new hanja; hanja filled in", () => {
  const row = (w, h, g) => [w, h, "n", "", g, "", ""];
  const rows = mergeSources([
    [row("학교", "學校", "school (Wiktionary)"), row("눈치", "", "nunchi (Wiktionary)")],
    [row("눈치", "", "tact"), row("사과", "沙果/砂果", "apple"), row("사과", "謝過", "apology")],
    [row("사과", "沙果", "an apple"), row("천공", "天工/穿孔", "perforation"), row("엽록체", "", "chloroplast")],
    [row("엽록체", "葉綠體", "식물 잎의…"), row("사과", "赦過", "잘못을 용서함"), row("강공", "強攻", "적극적으로 강하게 공격함")],
  ], (w) => (w === "엽록체" ? "葉綠體" : ""));
  assert.deepEqual(rows.map((r) => `${r[0]} ${r[1]} ${r[4]}`), [
    "강공 強攻 적극적으로 강하게 공격함", "눈치  nunchi (Wiktionary)", "사과 沙果/砂果 apple", "사과 謝過 apology",
    "사과 赦過 잘못을 용서함", "엽록체 葉綠體 chloroplast", "천공 天工/穿孔 perforation", "학교 學校 school (Wiktionary)",
  ]);
});

test("build: four sources into one sorted file, each credited", async () => {
  const out = join(mkdtempSync(join(tmpdir(), "dict-")), "ko.json");
  const n = await build(FIX, out, { nikl: NIKL, kengdic: KENG });
  const j = JSON.parse(readFileSync(out, "utf8"));
  assert.equal(n, 17);
  assert.match(j.source, /Wiktionary.*국립국어원.*CC BY-SA 2\.0 KR.*Kengdic/);
  const words = j.rows.map((r) => r[0]);
  assert.deepEqual(words, [...words].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0)), "code-point order, for the news binary search");
  assert.deepEqual(j.rows.filter((r) => r[0] === "학교"), [["학교", "學校", "n", "학꾜", "school", "학교에 가요.", "I go to school."]], "Wiktionary's row, once");
  assert.deepEqual(j.rows.find((r) => r[0] === "엽록체"), ["엽록체", "葉綠體", "n", "", "chloroplast", "", ""], "Kengdic's gloss with stdict's hanja");
  assert.equal(j.rows.find((r) => r[0] === "강공")[4], "적극적으로 강하게 공격함");
});

test("build: a missing 국립국어원 folder or Kengdic file leaves that source out, not the dictionary", async () => {
  const out = join(mkdtempSync(join(tmpdir(), "dict-")), "ko.json");
  assert.equal(await build(FIX, out, { nikl: "/nonexistent", kengdic: "/nonexistent.tsv" }), 5);
  assert.equal(JSON.parse(readFileSync(out, "utf8")).source, "Wiktionary (kaikki.org), CC BY-SA 4.0");
});

test("Korean dictionary rows: Korean definitions marked lang=ko; no empty part-of-speech pill", () => {
  const ko = ["강공", "強攻", "n", "", "적극적으로 강하게 공격함", "", ""], en = ["학교", "學校", "n", "학꾜", "school", "", ""];
  assert.equal(glossLang(ko), "ko");
  assert.equal(glossLang(en), "en");
  assert.equal(glossLang(["먹다", "", "v", "", "VST + 먹다 , adds no meaning", "", ""]), "en");
  assert.match(dictKo.rowHTML(ko), /lang="ko">적극적으로/);
  assert.doesNotMatch(dictKo.rowHTML(["휴정의", "", "", "", "recessional", "", ""]), /pill/);
  assert.match(dictKo.rowHTML(en), /<span class="pill">n<\/span>/);
});

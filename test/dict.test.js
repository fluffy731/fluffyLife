import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, mkdtempSync, writeFileSync } from "node:fs";
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

// ---------- Korean slang and new words ----------
import { senseLabel, parseOpendict, opendictLabel, opendictSlang, slangRows, addSlang, LABELLED, SLANG_FILES } from "../scripts/build-dict.mjs";

const odParsed = xmlParts("opendict/0000001.xml", /<item>[\s\S]*?<\/item>/g).map(parseOpendict);
const STANDARD = new Set(["고구마", "꼰대", "골칫덩이", "엄살쟁이", "ㄱ"]);
const od = (code) => odParsed.find((p) => p.code === code);

test("Wiktionary: a sense tagged slang, vulgar, derogatory or neologism gets a label", () => {
  assert.equal(senseLabel(["Internet", "slang"]), "slang");
  assert.equal(senseLabel(["vulgar", "slang"]), "vulgar slang");
  assert.equal(senseLabel(["derogatory"]), "derogatory slang");
  assert.equal(senseLabel(["neologism"]), "new word");
  assert.equal(senseLabel(["colloquial"]), "");
  const r = convertEntry({ word: "고구마", lang_code: "ko", pos: "noun", senses: [{ glosses: ["sweet potato"] }, { glosses: ["something frustrating"], tags: ["slang"] }] });
  assert.equal(r[4], "sweet potato; (slang) something frustrating");
});

test("우리말샘: labels slang, derogatory and coined words; leaves out jargon, names, fields and old senses", () => {
  const label = (code) => opendictLabel(od(code), STANDARD);
  assert.equal(label(90703), "slang", "골칫덩이: 속되게 이르는 말");
  assert.equal(label(225044), "derogatory slang", "엄살쟁이: 낮잡아 이르는 말");
  assert.equal(label(518498), "slang", "꼰대: 학생들의 은어");
  assert.equal(label(424164), "", "뺑코: thieves' jargon");
  assert.equal(label(1382514), "new word", "갑분싸");
  assert.equal(label(1462753), "new word", "국룰");
  assert.equal(label(1368128), "new word", "혼밥");
  assert.equal(label(1368969), "slang", "고구마: a new figurative sense of a standard word");
  assert.equal(label(444566), "", "고구마: the root vegetable");
  assert.equal(label(449066), "", "ㄱ: a field (언어)");
  assert.equal(label(1526869), "", "팽씨: a surname");
  assert.equal(label(1313131), "", "세척법: newly listed, not coined");
  const fake = { word: "은어젓", code: 100, unit: "어휘", type: "일반어", cats: [], def: "은어로 담근 젓", years: [] };
  assert.equal(opendictLabel(fake), "", "은어 the fish, not 은어 slang");
  assert.equal(opendictLabel({ ...fake, word: "고무신", def: "‘정부’를 속되게 이르는 말", type: "방언" }), "", "dialect");
});

test("우리말샘: one row per word, strongest label, senses joined, headword marks removed", () => {
  const rows = opendictSlang(odParsed, STANDARD);
  assert.deepEqual(rows.find((r) => r[0] === "꼰대"), ["꼰대", "n", "slang", "은어로, ‘늙은이’를 이르는 말; 학생들의 은어로, ‘선생님’을 이르는 말", ""]);
  assert.deepEqual(rows.find((r) => r[0] === "국룰"), ["국룰", "n", "new word", "국민 대다수가 널리 받아들이는 규칙", ""], "국-룰 → 국룰");
  assert.deepEqual(rows.map((r) => r[0]), ["갑분싸", "고구마", "골칫덩이", "국룰", "꼰대", "노잼", "엄살쟁이", "혼밥"]);
});

test("slang files → rows: English list and 우리말샘 list, comments skipped", () => {
  assert.deepEqual(slangRows("# comment\n대박\t감\tslang\tawesome!\t대박이다.\tAwesome.\n", "curated"), [["대박", "", "감", "", "(slang) awesome!", "대박이다.", "Awesome."]]);
  assert.deepEqual(slangRows("# c\n이대남\tn\tnew word\t이십 대 남성을 이르는 말\t二代男\n", "urimalsaem"), [["이대남", "二代男", "n", "", "(new word) 이십 대 남성을 이르는 말", "", ""]]);
});

test("addSlang: extra rows on top; 우리말샘 skipped where a label or (for a new word) an entry exists", () => {
  const base = [["고구마", "", "n", "", "sweet potato", "", ""], ["혼밥", "", "n", "", "eating alone", "", ""], ["대박", "", "n", "", "(slang) awesome", "", ""]];
  const rows = addSlang(base,
    [["썸", "", "n", "", "(slang) a \"something\"", "", ""], ["썸", "", "n", "", "(slang) duplicate", "", ""]],
    [["고구마", "", "n", "", "(slang) 답답한 상황", "", ""], ["혼밥", "", "n", "", "(new word) 혼자 먹는 밥", "", ""], ["대박", "", "n", "", "(slang) 크게 이루어짐", "", ""], ["썸", "", "n", "", "(new word) …", "", ""], ["국룰", "", "n", "", "(new word) 국민 규칙", "", ""]]);
  assert.deepEqual(rows.map((r) => `${r[0]} ${r[4]}`), ["고구마 sweet potato", "고구마 (slang) 답답한 상황", "국룰 (new word) 국민 규칙", "대박 (slang) awesome", "썸 (slang) a \"something\"", "혼밥 eating alone"]);
});

test("build: slang and new words merged, labelled and credited", async () => {
  const dir = mkdtempSync(join(tmpdir(), "dict-")), cur = join(dir, "slang.tsv"), um = join(dir, "um.tsv");
  writeFileSync(cur, "# test\n썸\tn\tslang\ta \"something\": flirting before dating\t우리 썸 타?\tAre we a thing?\n");
  writeFileSync(um, opendictSlang(odParsed, STANDARD).map((r) => r.join("\t")).join("\n"));
  const n = await build(FIX, join(dir, "ko.json"), { nikl: NIKL, kengdic: KENG, slang: { curated: cur, urimalsaem: um } });
  const j = JSON.parse(readFileSync(join(dir, "ko.json"), "utf8"));
  assert.equal(n, 17 + 1 + 8);
  assert.match(j.source, /우리말샘/);
  assert.deepEqual(j.rows.find((r) => r[0] === "썸"), ["썸", "", "n", "", "(slang) a \"something\": flirting before dating", "우리 썸 타?", "Are we a thing?"]);
  assert.equal(j.rows.filter((r) => LABELLED.test(r[4])).length, 9);
  const words = j.rows.map((r) => r[0]);
  assert.deepEqual(words, [...words].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0)));
});

test("krdict text escaped twice still reads as plain quotes", () => {
  const xml = `<LexicalEntry att="id" val="1"><feat att="lexicalUnit" val="단어" /><feat att="partOfSpeech" val="접사" /><Lemma><feat att="writtenForm" val="개-" /></Lemma>
    <Sense att="id" val="1"><feat att="definition" val="x" /><Equivalent><feat att="language" val="영어" /><feat att="lemma" val="gae-" /><feat att="definition" val="A prefix used to mean &amp;quot;wild&amp;quot;." /></Equivalent></Sense></LexicalEntry>`;
  assert.equal(convertKrdict(xml)[4], 'A prefix used to mean "wild"');
});

test("slang data files: well formed, labelled, one row per word", () => {
  const LABELS = new Set(["slang", "vulgar slang", "derogatory slang", "new word"]);
  const lines = (f) => readFileSync(f, "utf8").split("\n").filter((l) => l.trim() && !l.startsWith("#")).map((l) => l.split("\t"));
  const cur = lines(SLANG_FILES.curated), um = lines(SLANG_FILES.urimalsaem);
  assert.ok(cur.length >= 150 && um.length >= 5000, `${cur.length} curated, ${um.length} 우리말샘`);
  for (const c of cur) {
    assert.equal(c.length, 6, c.join("|"));
    assert.ok(LABELS.has(c[2]) && c[2] !== "new word", c[0]);
    assert.ok(c[3] && c[5], `${c[0]}: English meaning and example translation`);
    assert.ok(c[4].includes(c[0].replace(/-/g, "")[0]), `${c[0]}: the example uses the word`);
  }
  for (const c of um) { assert.equal(c.length, 5, c.join("|")); assert.ok(LABELS.has(c[2]) && c[3], c[0]); }
  for (const list of [cur, um]) assert.equal(new Set(list.map((c) => c[0])).size, list.length, "duplicate word");
  assert.match(readFileSync(SLANG_FILES.urimalsaem, "utf8"), /^# Slang and new words from 우리말샘.*CC BY-SA 2\.0 KR/);
});

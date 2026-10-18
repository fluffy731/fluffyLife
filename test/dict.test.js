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

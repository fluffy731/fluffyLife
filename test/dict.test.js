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

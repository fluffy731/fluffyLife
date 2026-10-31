import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { PIC, EMOJI, picHTML } from "../data/pics-ko.js";
import { vocab } from "../data/vocab.js";

const words = new Set(vocab.map((v) => v.ko));
const files = readdirSync(new URL("../pics/ko/", import.meta.url)).filter((f) => f.endsWith(".svg"));
const esc = (s) => String(s);

test("every picture belongs to a word in the deck (catches typos in the map)", () => {
  assert.deepEqual(Object.keys(PIC).filter((k) => !words.has(k)), []);
  assert.deepEqual(Object.keys(EMOJI).filter((k) => !words.has(k)), []);
  assert.deepEqual(Object.keys(PIC).filter((k) => k in EMOJI), []);
});

test("every mapped SVG exists, and every SVG in pics/ko is used", () => {
  const used = new Set(Object.values(PIC).map((s) => `${s}.svg`));
  assert.deepEqual([...used].filter((f) => !files.includes(f)), []);
  assert.deepEqual(files.filter((f) => !used.has(f)), []);
  for (const f of files) assert.match(readFileSync(new URL(`../pics/ko/${f}`, import.meta.url), "utf8"), /^<svg[\s>]/, f);
});

test("picHTML: image for a symbol word, emoji for a gap word, nothing for a hanja word", () => {
  assert.match(picHTML("냄비", esc), /<img class="picimg" src="[^"]*\/pics\/ko\/saucepan\.svg"/);
  assert.match(picHTML("냄비", esc, true), /class="bpic"/);
  assert.match(picHTML("원숭이", esc), /picemoji[^>]*>🐒</);
  assert.equal(picHTML("경제", esc), "");
});

test("the picture map is cached for offline use", () => {
  assert.ok(readFileSync(new URL("../sw.js", import.meta.url), "utf8").includes('"./data/pics-ko.js"'));
});

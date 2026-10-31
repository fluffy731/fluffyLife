import { test } from "node:test";
import assert from "node:assert/strict";
import { vocab } from "../data/vocab.js";
import { PH_INT } from "../data/phrases-int.js";
import { PH_ADV } from "../data/phrases-adv.js";
import { PH_BEG } from "../data/phrases-beg.js";
import { interleave } from "../lib/interleave.js";
import { kindOf } from "../lib/track.js";
import { pack as yue } from "../data/yue/pack.js";

const UNITS = { int: 28, adv: 14, beg: 12 };
const phrases = vocab.filter((v) => v.id.startsWith("p-"));

test("interleave spreads extras evenly and keeps both orders", () => {
  assert.deepEqual(interleave(["a", "b", "c", "d"], ["X", "Y"]), ["a", "X", "b", "c", "Y", "d"]);
  assert.deepEqual(interleave(["a"], []), ["a"]);
  assert.deepEqual(interleave([], ["X"]), ["X"]);
});

test("Korean phrase counts per tier", () => {
  assert.equal(PH_INT.length, 140);
  assert.equal(PH_ADV.length, 70);
  assert.equal(PH_BEG.length, 60);
  assert.equal(phrases.length, 270);
});

test("every Korean unit gets phrases, and they are kind 'phrase'", () => {
  for (const [tier, n] of Object.entries(UNITS)) for (let u = 1; u <= n; u++) {
    const p = phrases.filter((x) => x.tier === tier && x.unit === u);
    assert.ok(p.length >= 4 && p.length <= 6, `${tier}-${u}: ${p.length}`);
  }
  assert.ok(phrases.every((p) => kindOf(p) === "phrase" && p.pos === "phrase"));
});

test("no Korean phrase repeats a word or another phrase", () => {
  const kos = vocab.map((v) => v.ko);
  assert.deepEqual([...new Set(kos.filter((x, i) => kos.indexOf(x) !== i))], []);
});

test("phrases are spread through each unit, not stacked at the end", () => {
  const unit = vocab.filter((v) => v.tier === "int" && v.unit === 1);
  const pos = unit.map((v, i) => (v.id.startsWith("p-") ? i : -1)).filter((i) => i >= 0);
  assert.ok(pos[0] < unit.length / 2 && pos.at(-1) < unit.length - 1, JSON.stringify(pos));
});

test("Cantonese phrases: about 80 in all, at least 4 in every unit", () => {
  const ph = yue.vocab.filter((v) => v.pos === "phrase");
  assert.ok(ph.length >= 75, `${ph.length}`);
  for (let u = 1; u <= 12; u++) assert.ok(ph.filter((v) => v.unit === u).length >= 4, `unit ${u}`);
});

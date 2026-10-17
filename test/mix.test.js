import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { mixOrder, bucketOf, BUCKETS } from "../lib/mix.js";
import { vocab } from "../data/vocab.js";

const GOLD = JSON.parse(readFileSync(new URL("./golden/ko-ids.json", import.meta.url), "utf8"));
const TIERS = { int: 20, adv: 14, beg: 8 };
const unitsOf = (tier) => {
  const m = new Map();
  for (const v of vocab.filter((x) => x.tier === tier)) { if (!m.has(v.unit)) m.set(v.unit, []); m.get(v.unit).push(v); }
  return [...m.entries()].sort((a, b) => a[0] - b[0]).map(([, items]) => items);
};

test("mixOrder keeps every item once and each bucket's order", () => {
  const items = [..."aaaaab bcd"].filter((c) => c !== " ").map((b, i) => ({ b, i }));
  const out = mixOrder(items, (x) => x.b, ["a", "b", "c", "d"]);
  assert.equal(out.length, items.length);
  assert.deepEqual([...out].sort((x, y) => x.i - y.i), items);
  for (const b of "abcd") assert.deepEqual(out.filter((x) => x.b === b).map((x) => x.i), items.filter((x) => x.b === b).map((x) => x.i));
  assert.notDeepEqual(out.map((x) => x.b).join(""), "aaaaabbcd");
});

test("bucketOf classifies by pos and hanja", () => {
  assert.deepEqual(BUCKETS, ["nH", "nN", "v", "adj", "etc"]);
  assert.equal(bucketOf({ pos: "n", hanja: "經濟" }), "nH");
  assert.equal(bucketOf({ pos: "n", hanja: null }), "nN");
  assert.equal(bucketOf({ pos: "v", hanja: "參與" }), "v");
  assert.equal(bucketOf({ pos: "adj", hanja: null }), "adj");
  assert.equal(bucketOf({ pos: "adv", hanja: null }), "etc");
});

test("ids unchanged", () => {
  assert.deepEqual(Object.fromEntries(vocab.map((v) => [v.id, v.ko])), GOLD);
});

test("unit counts per tier", () => {
  for (const [tier, n] of Object.entries(TIERS)) {
    const us = unitsOf(tier);
    assert.equal(us.length, n, tier);
    us.slice(0, -1).forEach((u) => assert.equal(u.length, 20, tier));
  }
});

test("every unit has at least 3 buckets", () => {
  for (const tier of Object.keys(TIERS)) for (const u of unitsOf(tier)) assert.ok(new Set(u.map(bucketOf)).size >= 3, `${tier}-${u[0].unit}`);
});

test("every int and adv unit has a verb or adjective and a native word", () => {
  for (const tier of ["int", "adv"]) for (const u of unitsOf(tier)) {
    assert.ok(u.some((v) => ["v", "adj"].includes(bucketOf(v))), `${tier}-${u[0].unit} verb/adj`);
    assert.ok(u.some((v) => v.hanja === null), `${tier}-${u[0].unit} native`);
  }
});

test("no bucket run longer than 3", () => {
  for (const tier of Object.keys(TIERS)) {
    const seq = unitsOf(tier).flat().map(bucketOf);
    let run = 1;
    for (let i = 1; i < seq.length; i++) { run = seq[i] === seq[i - 1] ? run + 1 : 1; assert.ok(run <= 3, `${tier} run at ${i}`); }
  }
});

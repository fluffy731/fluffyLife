import { test } from "node:test";
import assert from "node:assert/strict";
import { TIER_ORDER, buildUnits, isLearned, currentUnit, isUnlocked, dueItems, unseenItems, pickHourItems } from "../lib/track.js";

const vocab = [
  { id: "v1", tier: "int", unit: 1 }, { id: "v2", tier: "int", unit: 1 },
  { id: "v3", tier: "int", unit: 2 },
  { id: "v4", tier: "adv", unit: 1 }, { id: "v5", tier: "beg", unit: 1 },
];
const grammar = [{ id: "g1", tier: "int", unit: 1 }, { id: "g2", tier: "adv", unit: 1 }];
const units = buildUnits(vocab, grammar);

test("tier order", () => assert.deepEqual(TIER_ORDER, ["int", "adv", "beg"]));

test("buildUnits orders int→adv→beg then unit", () => {
  assert.deepEqual(units.map(u => u.key), ["int-1", "int-2", "adv-1", "beg-1"]);
  assert.deepEqual(units[0].items.map(i => i.id), ["v1", "v2", "g1"]);
  assert.equal(units[0].tier, "int"); assert.equal(units[0].unit, 1);
});

test("isLearned requires reps>0 on every item", () => {
  assert.equal(isLearned(units[0], {}), false);
  assert.equal(isLearned(units[0], { v1: { reps: 1 }, v2: { reps: 1 } }), false);
  assert.equal(isLearned(units[0], { v1: { reps: 1 }, v2: { reps: 2 }, g1: { reps: 1 } }), true);
});

test("currentUnit is first unlearned, else last", () => {
  assert.equal(currentUnit(units, {}).key, "int-1");
  const p = { v1: { reps: 1 }, v2: { reps: 1 }, g1: { reps: 1 } };
  assert.equal(currentUnit(units, p).key, "int-2");
  const all = Object.fromEntries([...vocab, ...grammar].map(i => [i.id, { reps: 1 }]));
  assert.equal(currentUnit(units, all).key, "beg-1");
});

test("isUnlocked", () => {
  assert.equal(isUnlocked(units, 0, {}), true);
  assert.equal(isUnlocked(units, 1, {}), false);
  assert.equal(isUnlocked(units, 1, { v1: { reps: 1 }, v2: { reps: 1 }, g1: { reps: 1 } }), true);
});

test("dueItems: seen and due, sorted by due", () => {
  const items = [...vocab, ...grammar];
  const p = { v1: { reps: 1, due: 200 }, v2: { reps: 1, due: 100 }, v3: { reps: 1, due: 999 }, v4: { reps: 0, due: 0 } };
  // v4 has a state (an Again) so it is seen and due
  assert.deepEqual(dueItems(items, p, 500).map(i => i.id), ["v4", "v2", "v1"]);
});

test("unseenItems", () => {
  assert.deepEqual(unseenItems(units[0], { v1: { reps: 1 } }).map(i => i.id), ["v2", "g1"]);
});

test("pickHourItems falls back to tier when unit fully learned", () => {
  const p = { v1: { reps: 1 }, v2: { reps: 1 }, g1: { reps: 1 } };
  assert.deepEqual(pickHourItems(units, units[0], p).map(i => i.id), ["v1", "v2", "g1", "v3"]);
  assert.deepEqual(pickHourItems(units, units[0], {}).map(i => i.id), ["v1", "v2", "g1"]);
});

test("Again keeps an item seen: still due, unit still learned", async () => {
  const { grade } = await import("../lib/fsrs.js");
  const now = 1_700_000_000_000;
  let s = grade(undefined, "good", now); s = grade(s, "again", now);
  const p = { v1: s, v2: { reps: 1, due: now + 1 }, g1: { reps: 1, due: now + 1 } };
  assert.equal(isLearned(units[0], p), true);
  assert.deepEqual(dueItems(units[0].items, p, now).map(i => i.id), ["v1"]);
  assert.deepEqual(unseenItems(units[0], p), []);
});

import { kindOf } from "../lib/track.js";
test("kindOf: word, phrase (incl. idiom) or grammar", () => {
  assert.equal(kindOf({ ko: "경제", pos: "n" }), "word");
  assert.equal(kindOf({ ko: "그러게요", pos: "phrase" }), "phrase");
  assert.equal(kindOf({ ko: "발이 넓다", pos: "idiom" }), "phrase");
  assert.equal(kindOf({ form: "-기 위해" }), "grammar");
});

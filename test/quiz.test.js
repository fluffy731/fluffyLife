import { test } from "node:test";
import assert from "node:assert/strict";
import { rng, shuffle, passMark, pickUnitTestItems, pickPracticeItems, buildQuestions, recordAttempt, applyMisses } from "../lib/quiz.js";

const isGrammar = (it) => "form" in it;
const env = { hasClip: () => true };
const V = (id, tier, pos, mean) => ({ id, tier, pos, mean, unit: 1 });
const pool = [
  V("a", "t1", "n", "A"), V("b", "t1", "n", "B"), V("c", "t1", "n", "C"), V("d", "t1", "n", "D"),
  V("e", "t1", "v", "E"), V("f", "t2", "n", "F"), V("g", "t2", "n", "G"), V("h", "t1", "n", "H"),
];
const meaning = { key: "meaning", kind: "vocab", applies: () => true, answerText: (it) => it.mean };
const build = (targets, types = [meaning], opts = {}) => buildQuestions(targets, opts.pool ?? pool, types, { rand: rng(opts.seed ?? 1), env, n: opts.n ?? targets.length, isGrammar });
const texts = (q) => q.options.map((o) => meaning.answerText(o));

test("same seed same questions", () => {
  const a = build(pool.slice(0, 4)), b = build(pool.slice(0, 4));
  assert.deepEqual(a.map((q) => [q.item.id, q.options.map((o) => o.id), q.answer]), b.map((q) => [q.item.id, q.options.map((o) => o.id), q.answer]));
});

test("options unique by answerText and answer appears once", () => {
  const twins = [...pool, { ...V("x", "t1", "n", "A") }, { ...V("y", "t1", "n", "A") }];
  for (let seed = 1; seed <= 20; seed++) {
    const [q] = build([twins[0]], [meaning], { pool: twins, seed });
    assert.equal(q.options.length, 4);
    assert.equal(new Set(texts(q)).size, 4);
    assert.equal(q.options[q.answer], twins[0]);
    assert.ok(!q.options.some((o) => o.id === "x" || o.id === "y"));
  }
});

test("distractor preference: same tier and pos first", () => {
  for (let seed = 1; seed <= 20; seed++) {
    const [q] = build([pool[0]], [meaning], { seed });
    for (const o of q.options) { assert.equal(o.tier, "t1"); assert.equal(o.pos, "n"); }
  }
});

test("type falls through when reject leaves too few", () => {
  const picky = { ...meaning, key: "picky", reject: () => true };
  const [q] = build([pool[0]], [picky, meaning]);
  assert.equal(q.type, "meaning");
});

test("item skipped when no type works, next target fills in", () => {
  const onlyB = { ...meaning, applies: (it) => it.id !== "a" };
  const qs = build(pool.slice(0, 3), [onlyB], { n: 2 });
  assert.deepEqual(qs.map((q) => q.item.id), ["b", "c"]);
});

test("fixedOptions: six keys and answer indexes answerKey", () => {
  const tone = { key: "tone", kind: "vocab", applies: () => true, fixedOptions: () => ["1", "2", "3", "4", "5", "6"], answerKey: () => "4" };
  const [q] = build([pool[0]], [tone]);
  assert.deepEqual([...q.options].sort(), ["1", "2", "3", "4", "5", "6"]);
  assert.equal(q.options[q.answer], "4");
});

test("grammar targets only draw grammar distractors", () => {
  const g = (id) => ({ id, form: id, tier: "t1", unit: 1 });
  const gp = [...pool, g("g1"), g("g2"), g("g3"), g("g4")];
  const gt = { key: "g", kind: "grammar", applies: () => true, answerText: (it) => it.form };
  const [q] = buildQuestions([gp.at(-1)], gp, [gt], { rand: rng(3), env, n: 1, isGrammar });
  assert.ok(q.options.every(isGrammar));
});

test("passMark", () => {
  assert.equal(passMark(15), 12);
  assert.equal(passMark(5), 4);
  assert.equal(passMark(1), 1);
});

test("pickUnitTestItems: 1–3 grammar in the first 15, no repeats", () => {
  const items = [...Array.from({ length: 20 }, (_, i) => V(`v${i}`, "t1", "n", `m${i}`)), ...["g1", "g2", "g3", "g4"].map((id) => ({ id, form: id, tier: "t1", unit: 1 }))];
  for (let seed = 1; seed <= 30; seed++) {
    const out = pickUnitTestItems(items, isGrammar, rng(seed));
    const first = out.slice(0, 15), g = first.filter(isGrammar).length;
    assert.ok(g >= 1 && g <= 3, `seed ${seed}: ${g}`);
    assert.equal(new Set(out.map((i) => i.id)).size, out.length);
    assert.ok(out.slice(15).every((i) => !isGrammar(i)));
  }
});

test("pickPracticeItems: seen only; [] under 4 seen; weakest first", () => {
  const p = { a: { ease: 2.5, due: 1 }, b: { ease: 1.3, due: 5 }, c: { ease: 2.0, due: 1 }, d: { ease: 1.3, due: 2 } };
  const out = pickPracticeItems(pool, p, rng(1), 2);
  assert.ok(out.every((i) => i.id in p));
  assert.equal(out.length, 4);
  assert.equal(out[0].id, "d");
  assert.deepEqual(pickPracticeItems(pool, { a: p.a, b: p.b, c: p.c }, rng(1)), []);
});

test("recordAttempt keeps last 10 and best; never clears passedAt", () => {
  let q = { units: {}, practice: [] };
  q = recordAttempt(q, "u", 10, 15, 1);
  assert.equal(q.units.u.passedAt, null);
  q = recordAttempt(q, "u", 13, 15, 2);
  assert.equal(q.units.u.passedAt, 2);
  q = recordAttempt(q, "u", 5, 15, 3);
  assert.equal(q.units.u.passedAt, 2);
  assert.equal(q.units.u.best, 13); assert.equal(q.units.u.total, 15);
  for (let i = 0; i < 12; i++) q = recordAttempt(q, "u", 1, 15, 10 + i);
  assert.equal(q.units.u.attempts.length, 10);
  assert.equal(q.units.u.attempts.at(-1).at, 21);
  q = recordAttempt(q, null, 7, 10, 99);
  assert.deepEqual(q.practice, [{ at: 99, score: 7, total: 10 }]);
});

test("recordAttempt does not mutate its input", () => {
  const q0 = { units: {}, practice: [] };
  recordAttempt(q0, "u", 1, 2, 3);
  assert.deepEqual(q0, { units: {}, practice: [] });
});

test("applyMisses changes only due and ignores unknown ids", () => {
  const p = { a: { ease: 2.1, interval: 6, reps: 3, due: 999 } };
  const out = applyMisses(p, ["a", "zz"], 50);
  assert.deepEqual(out, { a: { ease: 2.1, interval: 6, reps: 3, due: 50 } });
  assert.equal(p.a.due, 999);
});

test("shuffle returns a new permutation", () => {
  const a = [1, 2, 3, 4, 5];
  const b = shuffle(a, rng(7));
  assert.deepEqual([...b].sort(), a);
  assert.deepEqual(a, [1, 2, 3, 4, 5]);
});

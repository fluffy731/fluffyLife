import { test } from "node:test";
import assert from "node:assert/strict";
import { KEY, load, save, exportJSON, importJSON } from "../lib/store.js";

const QD0 = { units: {}, practice: [] };
const fakeLS = (init = {}) => { const m = { ...init }; return { getItem: k => (k in m ? m[k] : null), setItem: (k, v) => { m[k] = String(v); }, _m: m }; };

test("load defaults on missing or corrupt", () => {
  assert.deepEqual(load(fakeLS()), { progress: {}, custom: [], settings: {}, quiz: QD0 });
  assert.deepEqual(load(fakeLS({ [KEY]: "{not json" })), { progress: {}, custom: [], settings: {}, quiz: QD0 });
  assert.deepEqual(load(fakeLS({ [KEY]: JSON.stringify({ progress: { a: 1 } }) })), { progress: { a: 1 }, custom: [], settings: {}, quiz: QD0 });
});

test("save round trips", () => {
  const ls = fakeLS();
  const c = { id: "u1", kind: "vocab", ko: "a", hanja: null, zh: "b", en: "c", pos: "n", tier: "int", unit: 1, ex: "x", exZh: "y", exEn: "z" };
  save(ls, { progress: { a: { reps: 1 } }, custom: [c], settings: { x: 1 } });
  assert.deepEqual(load(ls), { progress: { a: { reps: 1 } }, custom: [c], settings: { x: 1 }, quiz: QD0 });
  assert.equal(KEY, "korean.v1");
});

test("importJSON validates", () => {
  assert.throws(() => importJSON("nope"), /Invalid backup/);
  assert.throws(() => importJSON('{"a":1}'), /Invalid backup/);
  const s = importJSON(exportJSON({ progress: { a: 1 }, custom: [], settings: {} }));
  assert.deepEqual(s, { progress: { a: 1 }, custom: [], settings: {}, quiz: QD0 });
});

test("load drops custom items that fail validation", () => {
  const good = { id: "u1", kind: "vocab", ko: "a", hanja: null, zh: "b", en: "c", pos: "n", tier: "int", unit: 1, ex: "x", exZh: "y", exEn: "z" };
  const bad = { id: "u2", kind: "grammar", form: "-x", tier: "int", unit: 1, en: "e", zh: "z" }; // no ex
  const ls = fakeLS({ [KEY]: JSON.stringify({ progress: {}, custom: [good, bad, "junk"] }) });
  assert.deepEqual(load(ls).custom.map(c => c.id), ["u1"]);
});

test("importJSON rejects a progress array and drops bad custom items", () => {
  assert.throws(() => importJSON('{"progress":[]}'), /Invalid backup/);
  const s = importJSON(JSON.stringify({ progress: { a: 1 }, custom: [{ id: "u9", kind: "vocab" }] }));
  assert.deepEqual(s.custom, []);
});

const QD = { units: {}, practice: [] };
const withQuiz = (quiz) => fakeLS({ [KEY]: JSON.stringify({ progress: {}, custom: [], settings: {}, quiz }) });

test("load keeps quiz", () => {
  const quiz = { units: { "int-1": { best: 13, total: 15, passedAt: 5, attempts: [{ at: 5, score: 13, total: 15 }] } }, practice: [{ at: 1, score: 7, total: 10 }] };
  assert.deepEqual(load(withQuiz(quiz)).quiz, quiz);
});

test("bad quiz falls back", () => {
  assert.deepEqual(load(withQuiz("x")).quiz, QD);
  assert.deepEqual(load(withQuiz([])).quiz, QD);
  assert.deepEqual(load(fakeLS({ [KEY]: JSON.stringify({ progress: {} }) })).quiz, QD);
  assert.deepEqual(load(fakeLS()).quiz, QD);
});

test("quiz with non-object units falls back per field", () => {
  assert.deepEqual(load(withQuiz({ units: [], practice: {} })).quiz, QD);
  assert.deepEqual(load(withQuiz({ units: { a: {} }, practice: "x" })).quiz, { units: { a: { best: 0, total: 0, passedAt: null, attempts: [] } }, practice: [] });
});

test("importJSON keeps quiz", () => {
  const quiz = { units: { "a0-1": { best: 12, total: 15, passedAt: 9, attempts: [] } }, practice: [] };
  assert.deepEqual(importJSON(exportJSON({ progress: {}, custom: [], settings: {}, quiz })).quiz, quiz);
});

test("imported quiz history is coerced to plain numbers (no markup reaches the page)", () => {
  const bad = { units: { "int-1": { passedAt: "x", best: "<img src=x onerror=alert(1)>", total: "15", attempts: [{ at: 1, score: "<b>", total: 15 }, "junk"] }, "int-2": "nope" }, practice: [{ at: 2, score: 3, total: 10 }, 7] };
  const q = importJSON(exportJSON({ progress: {}, custom: [], settings: {}, quiz: bad })).quiz;
  assert.deepEqual(q, { units: { "int-1": { passedAt: null, best: 0, total: 15, attempts: [{ at: 1, score: 0, total: 15 }] } }, practice: [{ at: 2, score: 3, total: 10 }] });
});

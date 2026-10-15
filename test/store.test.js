import { test } from "node:test";
import assert from "node:assert/strict";
import { KEY, load, save, exportJSON, importJSON } from "../lib/store.js";

const fakeLS = (init = {}) => { const m = { ...init }; return { getItem: k => (k in m ? m[k] : null), setItem: (k, v) => { m[k] = String(v); }, _m: m }; };

test("load defaults on missing or corrupt", () => {
  assert.deepEqual(load(fakeLS()), { progress: {}, custom: [], settings: {} });
  assert.deepEqual(load(fakeLS({ [KEY]: "{not json" })), { progress: {}, custom: [], settings: {} });
  assert.deepEqual(load(fakeLS({ [KEY]: JSON.stringify({ progress: { a: 1 } }) })), { progress: { a: 1 }, custom: [], settings: {} });
});

test("save round trips", () => {
  const ls = fakeLS();
  const c = { id: "u1", kind: "vocab", ko: "a", hanja: null, zh: "b", en: "c", pos: "n", tier: "int", unit: 1, ex: "x", exZh: "y", exEn: "z" };
  save(ls, { progress: { a: { reps: 1 } }, custom: [c], settings: { x: 1 } });
  assert.deepEqual(load(ls), { progress: { a: { reps: 1 } }, custom: [c], settings: { x: 1 } });
  assert.equal(KEY, "korean.v1");
});

test("importJSON validates", () => {
  assert.throws(() => importJSON("nope"), /Invalid backup/);
  assert.throws(() => importJSON('{"a":1}'), /Invalid backup/);
  const s = importJSON(exportJSON({ progress: { a: 1 }, custom: [], settings: {} }));
  assert.deepEqual(s, { progress: { a: 1 }, custom: [], settings: {} });
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

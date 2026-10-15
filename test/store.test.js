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
  save(ls, { progress: { a: { reps: 1 } }, custom: [{ id: "u1" }], settings: { x: 1 } });
  assert.deepEqual(load(ls), { progress: { a: { reps: 1 } }, custom: [{ id: "u1" }], settings: { x: 1 } });
  assert.equal(KEY, "korean.v1");
});

test("importJSON validates", () => {
  assert.throws(() => importJSON("nope"), /Invalid backup/);
  assert.throws(() => importJSON('{"a":1}'), /Invalid backup/);
  const s = importJSON(exportJSON({ progress: { a: 1 }, custom: [], settings: {} }));
  assert.deepEqual(s, { progress: { a: 1 }, custom: [], settings: {} });
});

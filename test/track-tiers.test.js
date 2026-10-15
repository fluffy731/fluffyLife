import { test } from "node:test";
import assert from "node:assert/strict";
import { buildUnits } from "../lib/track.js";
import { KEY, load, save, importJSON, exportJSON } from "../lib/store.js";

const fakeLS = (init = {}) => { const m = { ...init }; return { getItem: (k) => (k in m ? m[k] : null), setItem: (k, v) => { m[k] = String(v); }, _m: m }; };

test("buildUnits honours a pack's tier order and drops unlisted tiers", () => {
  const v = [{ id: "b", tier: "a1", unit: 1 }, { id: "a", tier: "a0", unit: 1 }, { id: "z", tier: "int", unit: 1 }];
  const units = buildUnits(v, [], ["a0", "a1"]);
  assert.deepEqual(units.map((u) => u.key), ["a0-1", "a1-1"]);
});

test("buildUnits default order is unchanged (int → adv → beg)", () => {
  const units = buildUnits([{ id: "1", tier: "beg", unit: 1 }, { id: "2", tier: "int", unit: 2 }, { id: "3", tier: "adv", unit: 1 }], []);
  assert.deepEqual(units.map((u) => u.key), ["int-2", "adv-1", "beg-1"]);
});

test("store key is per pack and korean.v1 stays untouched (review focus 3)", () => {
  const ls = fakeLS({ [KEY]: JSON.stringify({ progress: { k: { reps: 1 } } }) });
  save(ls, { progress: { y: { reps: 2 } }, custom: [], settings: {} }, "yue.v1");
  assert.deepEqual(load(ls, { key: "yue.v1" }).progress, { y: { reps: 2 } });
  assert.deepEqual(load(ls).progress, { k: { reps: 1 } });
  assert.equal(KEY, "korean.v1");
});

test("load and importJSON accept a pack validator for custom items", () => {
  const ok = { id: "u1", kind: "vocab", marker: true };
  const bad = { id: "u2", kind: "vocab" };
  const validate = (item) => (item.marker ? [] : ["no marker"]);
  const ls = fakeLS({ "yue.v1": JSON.stringify({ progress: {}, custom: [ok, bad] }) });
  assert.deepEqual(load(ls, { key: "yue.v1", validate }).custom.map((c) => c.id), ["u1"]);
  assert.deepEqual(importJSON(exportJSON({ progress: {}, custom: [ok, bad], settings: {} }), validate).custom.map((c) => c.id), ["u1"]);
});

import { migrateProgress } from "../lib/store.js";

test("migrateProgress renames legacy ids and never overwrites a newer entry (review I3)", () => {
  const out = migrateProgress({ "y01-01": { reps: 1 }, "y01-02": { reps: 2 }, "y:史": { reps: 9 }, other: { reps: 3 } }, { "y01-01": "y:詩", "y01-02": "y:史" });
  assert.deepEqual(out, { "y:詩": { reps: 1 }, "y:史": { reps: 9 }, other: { reps: 3 } });
});

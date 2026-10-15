import { test } from "node:test";
import assert from "node:assert/strict";
import { validateItem, mergeItems } from "../lib/validate.js";

const okV = { id: "v1", ko: "경제", hanja: "經濟", zh: "經濟", en: "economy", pos: "n", tier: "int", unit: 1, ex: "a", exZh: "b", exEn: "c" };
const okG = { id: "g1", form: "-더니", tier: "int", unit: 1, en: "x", zh: "y", ex: [{ ko: "a", zh: "b", en: "c" }] };

test("valid items give no errors", () => {
  assert.deepEqual(validateItem(okV, "vocab"), []);
  assert.deepEqual(validateItem({ ...okV, hanja: null }, "vocab"), []);
  assert.deepEqual(validateItem(okG, "grammar"), []);
});

test("missing fields and bad tier reported", () => {
  const { en, ...noEn } = okV;
  assert.ok(validateItem(noEn, "vocab").some(e => /en/.test(e)));
  assert.ok(validateItem({ ...okV, tier: "x" }, "vocab").some(e => /tier/.test(e)));
  const { hanja, ...noHanja } = okV;
  assert.ok(validateItem(noHanja, "vocab").some(e => /hanja/.test(e)));
  assert.ok(validateItem({ ...okG, ex: [] }, "grammar").some(e => /ex/.test(e)));
  assert.ok(validateItem({ ...okG, ex: [{ ko: "a" }] }, "grammar").some(e => /ex/.test(e)));
});

test("mergeItems: custom overrides seed by id, appends new", () => {
  const out = mergeItems([{ id: "a", en: "seed" }, { id: "b", en: "seed" }], [{ id: "a", en: "custom" }, { id: "u1", en: "new" }]);
  assert.deepEqual(out.map(i => i.id), ["a", "b", "u1"]);
  assert.equal(out[0].en, "custom");
});

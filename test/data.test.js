import { test } from "node:test";
import assert from "node:assert/strict";
import { pack } from "../data/pack.js";
import { validateItem } from "../lib/validate.js";

const { vocab, grammar } = pack;
const byTier = (arr, t) => arr.filter(i => i.tier === t);

test("pack shape", () => {
  assert.equal(pack.id, "ko-zh");
  assert.equal(pack.target, "ko");
  assert.deepEqual(pack.support, ["zh", "en"]);
  assert.equal(pack.fields.front, "ko");
});

test("every seed item validates", () => {
  const errs = [];
  for (const v of vocab) for (const e of validateItem(v, "vocab")) errs.push(`${v.id}: ${e}`);
  for (const g of grammar) for (const e of validateItem(g, "grammar")) errs.push(`${g.id}: ${e}`);
  assert.deepEqual(errs.slice(0, 10), []);
});

test("ids unique across vocab and grammar", () => {
  const ids = [...vocab, ...grammar].map(i => i.id);
  const dup = ids.filter((x, i) => ids.indexOf(x) !== i);
  assert.deepEqual(dup, []);
});

test("duplicate hangul within vocab reported", () => {
  const kos = vocab.map(v => v.ko);
  const dup = [...new Set(kos.filter((x, i) => kos.indexOf(x) !== i))];
  assert.deepEqual(dup, []);
});

test("counts meet minimums", () => {
  assert.ok(byTier(vocab, "int").length >= 300, `int ${byTier(vocab, "int").length}`);
  assert.ok(byTier(vocab, "adv").length >= 200, `adv ${byTier(vocab, "adv").length}`);
  assert.ok(byTier(vocab, "beg").length >= 100, `beg ${byTier(vocab, "beg").length}`);
  assert.ok(grammar.length >= 80, `grammar ${grammar.length}`);
});

test("every vocab unit has at least one grammar point", () => {
  const units = new Set(vocab.map(v => `${v.tier}-${v.unit}`));
  const gUnits = new Set(grammar.map(g => `${g.tier}-${g.unit}`));
  const missing = [...units].filter(u => !gUnits.has(u));
  assert.deepEqual(missing, []);
});

import { test } from "node:test";
import assert from "node:assert/strict";
import { latin } from "../lib/mongol.js";
import { validateMn } from "../lib/validate-mn.js";
import { mnPack } from "../packs/mn.js";
import { ui as enUi } from "../ui/en.js";
import { buildUnits } from "../lib/track.js";
import { rng, buildQuestions, pickUnitTestItems } from "../lib/quiz.js";
import { buildJobs } from "../lib/audio-jobs.js";

const isGrammar = (it) => "form" in it;

test("latin reading aid", () => {
  assert.equal(latin("Сайн байна уу?"), "Sain baina uu?");
  assert.equal(latin("өглөө"), "öglöö");
  assert.equal(latin("үхэр"), "ükher");
  assert.equal(latin("цай, чи, шөл, жил, ямар, юу"), "tsai, chi, shöl, jil, yamar, yuu");
});

test("validator rejects Latin in Mongolian and Traditional Chinese", () => {
  const ok = { id: "m:цай", mn: "цай", zh: "茶", en: "tea", pos: "n", tier: "a0", unit: 4, exMn: "Цай уух уу?", exZh: "喝茶吗？", exEn: "Will you have tea?" };
  assert.deepEqual(validateMn(ok, "vocab"), []);
  assert.ok(validateMn({ ...ok, mn: "tsai" }, "vocab").some((e) => /Cyrillic/.test(e)));
  assert.ok(validateMn({ ...ok, exZh: "喝茶嗎？" }, "vocab").some((e) => /Traditional/.test(e)));
});

test("every Mongolian item validates; ids unique", () => {
  const errs = [];
  for (const v of mnPack.vocab) for (const e of validateMn(v, "vocab")) errs.push(`${v.id}: ${e}`);
  for (const g of mnPack.grammar) for (const e of validateMn(g, "grammar")) errs.push(`${g.id}: ${e}`);
  assert.deepEqual(errs.slice(0, 10), []);
  const ids = [...mnPack.vocab, ...mnPack.grammar].map((i) => i.id);
  assert.equal(new Set(ids).size, ids.length);
});

test("Mongolian content: 12 units of words with phrases, grammar spread over units", () => {
  const units = new Set(mnPack.vocab.map((v) => v.unit));
  assert.deepEqual([...units].sort((a, b) => a - b), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
  for (const u of units) {
    const rows = mnPack.vocab.filter((v) => v.unit === u);
    assert.ok(rows.length >= 18, `unit ${u}: ${rows.length}`);
    assert.ok(rows.some((v) => v.pos === "phrase"), `unit ${u} has phrases`);
  }
  assert.ok(mnPack.grammar.length >= 20, `grammar ${mnPack.grammar.length}`);
});

test("Chinese UI has every key the English UI has", () => {
  assert.deepEqual(Object.keys(enUi).filter((k) => !(k in mnPack.ui)), []);
  assert.deepEqual(Object.keys(enUi.tabs).sort(), Object.keys(mnPack.ui.tabs).sort());
  for (const tp of mnPack.quiz.types) assert.ok(mnPack.ui[tp.caption], tp.caption);
  assert.equal(mnPack.ui.letterHints.length, 11);
});

test("every Mongolian unit test builds 15 questions with unique options", () => {
  const units = buildUnits(mnPack.vocab, mnPack.grammar, mnPack.tiers.map((x) => x.key));
  for (const u of units) for (let seed = 1; seed <= 5; seed++) {
    const rand = rng(seed);
    const qs = buildQuestions(pickUnitTestItems(u.items, isGrammar, rand), [...mnPack.vocab, ...mnPack.grammar], mnPack.quiz.types, { rand, env: { hasClip: () => true }, n: 15, isGrammar });
    assert.equal(qs.length, Math.min(15, u.items.length), u.key);
    for (const q of qs) {
      const type = mnPack.quiz.types.find((x) => x.key === q.type);
      assert.equal(new Set(q.options.map((o) => type.answerText(o))).size, 4, `${u.key} ${q.type} ${q.item.id}`);
    }
  }
});

test("audio jobs cover words, examples and the letter key", () => {
  const texts = new Set(buildJobs(mnPack).map((j) => j.text));
  assert.ok(texts.has("Сайн байна уу"));
  assert.ok(texts.has("өдөр"));
  for (const v of mnPack.vocab.slice(0, 20)) assert.ok(texts.has(mnPack.speechClean(v.mn)), v.mn);
});

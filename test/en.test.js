import { test } from "node:test";
import assert from "node:assert/strict";
import { validateEn } from "../lib/validate-en.js";
import { enPack } from "../packs/en.js";
import { ui as enUi } from "../ui/en.js";
import { buildUnits, kindOf } from "../lib/track.js";
import { rng, buildQuestions, pickUnitTestItems } from "../lib/quiz.js";
import { inExample, blanked } from "../quiz/en.js";

const isGrammar = (it) => "form" in it;
const sample = { id: "e:put off", en: "put off", ipa: "pʊt ˈɔf", ko: "미루다", pos: "phrase", tier: "int", unit: 2, ex: "Don't put off your homework.", exKo: "숙제를 미루지 마.", note: null };

test("validator: IPA without slashes, Korean glosses, English text", () => {
  assert.deepEqual(validateEn(sample, "vocab"), []);
  assert.ok(validateEn({ ...sample, ipa: "/pʊt ˈɔf/" }, "vocab").some((e) => /IPA/.test(e)));
  assert.ok(validateEn({ ...sample, ko: "postpone" }, "vocab").some((e) => /Korean/.test(e)));
});

test("fill-in-the-blank finds the headword in its example", () => {
  assert.equal(inExample(sample), true);
  assert.equal(blanked(sample), "Don't _____ your homework.");
  assert.equal(inExample({ ...sample, ex: "She postponed it." }), false);
});

test("every English item validates; ids unique", () => {
  const errs = [];
  for (const v of enPack.vocab) for (const e of validateEn(v, "vocab")) errs.push(`${v.id}: ${e}`);
  for (const g of enPack.grammar) for (const e of validateEn(g, "grammar")) errs.push(`${g.id}: ${e}`);
  assert.deepEqual(errs.slice(0, 10), []);
  const ids = [...enPack.vocab, ...enPack.grammar].map((i) => i.id);
  assert.equal(new Set(ids).size, ids.length);
});

test("English content: 20 units, each with words, phrases and grammar; int then adv", () => {
  for (let u = 1; u <= 20; u++) {
    const rows = enPack.vocab.filter((v) => v.unit === u);
    assert.ok(rows.length >= 18, `unit ${u}: ${rows.length}`);
    assert.ok(rows.some((v) => kindOf(v) === "phrase"), `unit ${u} phrases`);
    assert.ok(rows.some((v) => kindOf(v) === "word"), `unit ${u} words`);
    assert.ok(enPack.grammar.some((g) => g.unit === u), `unit ${u} grammar`);
    assert.equal(rows[0].tier, u <= 10 ? "int" : "adv");
  }
});

test("Korean UI for English has every key the English UI has", () => {
  assert.deepEqual(Object.keys(enUi).filter((k) => !(k in enPack.ui)), []);
  for (const tp of enPack.quiz.types) assert.ok(enPack.ui[tp.caption], tp.caption);
});

test("every English unit test builds with unique options", () => {
  const units = buildUnits(enPack.vocab, enPack.grammar, enPack.tiers.map((x) => x.key));
  assert.equal(units.length, 20);
  for (const u of units) for (let seed = 1; seed <= 4; seed++) {
    const rand = rng(seed);
    const qs = buildQuestions(pickUnitTestItems(u.items, isGrammar, rand), [...enPack.vocab, ...enPack.grammar], enPack.quiz.types, { rand, env: { hasClip: () => true }, n: 15, isGrammar });
    assert.equal(qs.length, 15, u.key);
    for (const q of qs) {
      const type = enPack.quiz.types.find((x) => x.key === q.type);
      assert.equal(new Set(q.options.map((o) => type.answerText(o))).size, 4, `${u.key} ${q.type} ${q.item.id}`);
    }
  }
});

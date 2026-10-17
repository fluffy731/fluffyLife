import { test } from "node:test";
import assert from "node:assert/strict";
import { rng, buildQuestions, pickUnitTestItems } from "../lib/quiz.js";
import { buildUnits } from "../lib/track.js";
import { koPack } from "../packs/ko.js";
import { types as koTypes, grammarCore } from "../quiz/ko.js";

const isGrammar = (it) => "form" in it;
const unitTest = (pack, types, key, env, seed = 1) => {
  const units = buildUnits(pack.vocab, pack.grammar, pack.tiers.map((x) => x.key));
  const u = units.find((x) => x.key === key);
  const rand = rng(seed);
  return buildQuestions(pickUnitTestItems(u.items, isGrammar, rand), [...pack.vocab, ...pack.grammar], types, { rand, env, n: 15, isGrammar });
};
const unique = (q, type) => new Set(q.options.map((o) => (typeof o === "string" ? o : type.answerText(o)))).size === q.options.length;

test("ko: grammarCore", () => {
  assert.equal(grammarCore("-(으)ㄴ/는 반면(에)"), "는 반면");
  assert.equal(grammarCore("-기 위해(서)"), "기 위해");
});

test("ko: pack wires the types", () => {
  assert.equal(koPack.quiz.types, koTypes);
  assert.deepEqual(koTypes.map((t) => t.key).sort(), ["grammar", "hanja", "listen", "meaning", "reverse"]);
});

test("ko: int-1 unit test has 15 questions with 4 unique options", () => {
  for (let seed = 1; seed <= 10; seed++) {
    const qs = unitTest(koPack, koTypes, "int-1", { hasClip: () => true }, seed);
    assert.equal(qs.length, 15);
    for (const q of qs) { assert.equal(q.options.length, 4); assert.ok(unique(q, koTypes.find((t) => t.key === q.type)), `${q.type} ${q.item.id}`); }
  }
});

test("ko: grammar distractors never appear in the prompt sentence", () => {
  for (let seed = 1; seed <= 30; seed++) {
    for (const q of unitTest(koPack, koTypes, "int-2", { hasClip: () => true }, seed).filter((x) => x.type === "grammar")) {
      q.options.forEach((o, i) => { if (i !== q.answer) { const c = grammarCore(o.form); assert.ok(!c || !q.item.ex[0].ko.includes(c), `${o.form} in ${q.item.ex[0].ko}`); } });
    }
  }
});

test("ko: hanja never applies to a native word", () => {
  const hanja = koTypes.find((t) => t.key === "hanja");
  for (const v of koPack.vocab.filter((x) => x.hanja === null)) assert.equal(hanja.applies(v, { hasClip: () => true }), false);
});

test("ko: listen needs a clip", () => {
  const listen = koTypes.find((t) => t.key === "listen");
  assert.equal(listen.applies(koPack.vocab[0], { hasClip: () => false }), false);
  assert.equal(listen.applies(koPack.vocab[0], { hasClip: () => true }), true);
});

import { yuePack } from "../packs/yue.js";
import { types as yueTypes, isMono } from "../quiz/yue.js";
import { syllables } from "../lib/jyutping.js";

test("yue: isMono", () => {
  assert.equal(isMono({ jp: "si1" }), true);
  assert.equal(isMono({ jp: "nei5 hou2" }), false);
  assert.equal(isMono({ jp: "hai6!" }), true);
});

test("yue: pack wires the types", () => {
  assert.equal(yuePack.quiz.types, yueTypes);
  assert.deepEqual(yueTypes.map((t) => t.key).sort(), ["gsound", "listen", "say", "sound", "tone"]);
});

test("yue: tone answer is the syllable's tone digit, six options", () => {
  const tone = yueTypes.find((t) => t.key === "tone");
  const monos = yuePack.vocab.filter(isMono);
  assert.ok(monos.length > 100);
  const qs = buildQuestions(monos, yuePack.vocab, [tone], { rand: rng(1), env: { hasClip: () => true }, n: monos.length, isGrammar });
  assert.equal(qs.length, monos.length);
  for (const q of qs) {
    assert.equal(q.options.length, 6);
    assert.equal(q.options[q.answer], String(syllables(q.item.jp).find((s) => !s.punct).tone));
  }
});

test("yue: audio types do not apply without a clip", () => {
  for (let seed = 1; seed <= 10; seed++) {
    const qs = unitTest(yuePack, yueTypes, "a0-1", { hasClip: () => false }, seed);
    assert.ok(qs.every((q) => q.type !== "listen" && q.type !== "tone"));
  }
});

test("yue: a0-1 unit test with clips has unique options", () => {
  for (let seed = 1; seed <= 10; seed++) {
    const qs = unitTest(yuePack, yueTypes, "a0-1", { hasClip: () => true }, seed);
    assert.equal(qs.length, 15);
    for (const q of qs) assert.ok(unique(q, yueTypes.find((t) => t.key === q.type)), `${q.type} ${q.item.id}`);
  }
});

// Final-review fixes
test("ko: two spellings of the same grammar point never appear together", () => {
  const dupes = [["-(으)ㄴ/는 반면(에)", "-(으)ㄴ/는 반면"], ["-(으)ㄴ/는 데다(가)", "-(으)ㄴ/는 데다가"], ["-는 바람에", "-(으)ㄴ/는 바람에"]];
  const g = koTypes.find((t) => t.key === "grammar");
  for (const [a, b] of dupes) {
    const target = koPack.grammar.find((x) => x.form === a), twin = koPack.grammar.find((x) => x.form === b);
    assert.ok(target && twin, `${a} / ${b} in data`);
    for (let seed = 1; seed <= 200; seed++) {
      const [q] = buildQuestions([target], koPack.grammar, [g], { rand: rng(seed), env: { hasClip: () => true }, n: 1, isGrammar });
      assert.ok(!q.options.includes(twin), `${a} with ${b}, seed ${seed}`);
    }
  }
});

test("ko: a homograph never sits beside the word in a meaning question", () => {
  const meaning = koTypes.find((t) => t.key === "meaning");
  const it = koPack.vocab[0], twin = { ...it, id: "u1", zh: "別的", en: "something else" };
  for (let seed = 1; seed <= 50; seed++) {
    const [q] = buildQuestions([it], [twin, ...koPack.vocab], [meaning], { rand: rng(seed), env: { hasClip: () => true }, n: 1, isGrammar });
    assert.ok(!q.options.includes(twin), `seed ${seed}`);
  }
});

test("yue: a same-sound word never sits beside the word in sound/listen questions", () => {
  const it = yuePack.vocab.find((v) => v.zh === "三"), twin = { ...it, id: "y:衫x", zh: "衫", ko: "옷", en: "clothes" };
  for (const key of ["sound", "listen"]) {
    const type = yueTypes.find((t) => t.key === key);
    for (let seed = 1; seed <= 50; seed++) {
      const [q] = buildQuestions([it], [twin, ...yuePack.vocab], [type], { rand: rng(seed), env: { hasClip: () => true }, n: 1, isGrammar });
      assert.ok(!q.options.includes(twin), `${key} seed ${seed}`);
    }
  }
});

import { test } from "node:test";
import assert from "node:assert/strict";
import { pack } from "../data/yue/pack.js";
import { yuePack } from "../packs/yue.js";
import { ui as enUi } from "../ui/en.js";
import { validateYue, YUE_TIERS } from "../lib/validate-yue.js";
import { hangul } from "../lib/jyutping.js";

const { vocab, grammar } = pack;
const ctx = { esc: (s) => String(s ?? ""), say: (t) => `[say:${t}]`, t: yuePack.ui, isGrammar: (it) => "form" in it };
const word = (zh) => vocab.find((v) => v.zh === zh);

test("data pack shape", () => {
  assert.equal(pack.id, "yue-ko");
  assert.equal(pack.target, "yue");
  assert.deepEqual(pack.support, ["ko", "en"]);
});

test("every row validates", () => {
  const errs = [];
  for (const v of vocab) for (const e of validateYue(v, "vocab")) errs.push(`${v.id}: ${e}`);
  for (const g of grammar) for (const e of validateYue(g, "grammar")) errs.push(`${g.id}: ${e}`);
  assert.deepEqual(errs.slice(0, 10), []);
});

test("ids unique; no duplicate characters within vocab", () => {
  const ids = [...vocab, ...grammar].map((i) => i.id);
  assert.deepEqual(ids.filter((x, i) => ids.indexOf(x) !== i), []);
  const zh = vocab.map((v) => v.zh);
  assert.deepEqual([...new Set(zh.filter((x, i) => zh.indexOf(x) !== i))], []);
});

test("tiers follow units: a0 = 1–4, a1 = 5–9, a2 = 10–12", () => {
  for (const v of [...vocab, ...grammar]) {
    const want = v.unit <= 4 ? "a0" : v.unit <= 9 ? "a1" : "a2";
    assert.equal(v.tier, want, v.id);
  }
});

test("every unit with vocab has at least one grammar point", () => {
  const units = new Set(vocab.map((v) => v.unit));
  const g = new Set(grammar.map((x) => x.unit));
  assert.deepEqual([...units].filter((u) => !g.has(u)), []);
});

test("unit 1 teaches the six tones (詩 史 試 時 市 事) in order", () => {
  const tones = ["詩", "史", "試", "時", "市", "事"].map((c) => word(c)?.jp);
  assert.deepEqual(tones, ["si1", "si2", "si3", "si4", "si5", "si6"]);
});

test("runtime pack", () => {
  assert.equal(yuePack.storageKey, "yue.v1");
  assert.equal(yuePack.backupPrefix, "yue");
  assert.equal(yuePack.swPath, "../sw.js");
  // Mandarin (zh-TW) is never used: it would read 唔該 as "wú gāi" under a card that says 음 꼬이 (review I6).
  assert.deepEqual(yuePack.speechLang, ["zh-HK", "yue-HK"]);
  assert.equal(yuePack.editable, false);
  assert.equal(yuePack.validate, validateYue);
  assert.deepEqual(yuePack.tiers.map((t) => t.key), YUE_TIERS);
  for (const t of yuePack.tiers) assert.ok(t.label && t.short);
});

test("Korean UI has every key the English UI has (no undefined strings)", () => {
  assert.deepEqual(Object.keys(enUi).filter((k) => !(k in yuePack.ui)), []);
  assert.deepEqual(Object.keys(enUi.tabs).sort(), Object.keys(yuePack.ui.tabs).sort());
});

test("vocab card: front is tone-coloured 한글, back adds Jyutping, characters and the bridge", () => {
  const w = word("十");
  const front = yuePack.cards.card(w, false, ctx);
  assert.ok(front.includes('class="syl t6"') && front.includes(hangul(w.jp)));
  assert.ok(!front.includes(w.ko));
  const back = yuePack.cards.card(w, true, ctx);
  for (const s of [w.ko, w.jp, "十", "십", w.exZh]) assert.ok(back.includes(s), s);
});

test("Cantonese-only characters get the badge instead of a bridge", () => {
  const back = yuePack.cards.card(word("唔"), true, ctx);
  assert.ok(back.includes(yuePack.ui.cantoneseOnly));
});

test("browse row and search text", () => {
  const w = word("十");
  const row = yuePack.cards.browseRow(w, "new", ctx);
  assert.ok(row.includes(`data-id="${w.id}"`) && row.includes(hangul(w.jp)) && !row.includes("data-edit"));
  const hay = yuePack.cards.searchText(w).join(" ");
  for (const needle of ["十", "sap6", hangul(w.jp), w.ko, w.en]) assert.ok(hay.includes(needle), needle);
});

test("release content, stage 1: units 1–6 each have ≥ 24 words and ≥ 2 grammar points", () => {
  for (let u = 1; u <= 6; u++) {
    assert.ok(vocab.filter((v) => v.unit === u).length >= 24, `unit ${u} words`);
    assert.ok(grammar.filter((g) => g.unit === u).length >= 2, `unit ${u} grammar`);
  }
});

test("release content: ≥ 300 words, 12 units each ≥ 24 words, ≥ 40 grammar points, each unit ≥ 2", () => {
  assert.ok(vocab.length >= 300, `words ${vocab.length}`);
  assert.ok(grammar.length >= 40, `grammar ${grammar.length}`);
  for (let u = 1; u <= 12; u++) {
    assert.ok(vocab.filter((v) => v.unit === u).length >= 24, `unit ${u} words`);
    assert.ok(grammar.filter((g) => g.unit === u).length >= 2, `unit ${u} grammar`);
  }
});

import { HANJA_KO } from "../data/yue/hanja-ko.js";
import { bridge, hasBridge } from "../lib/bridge.js";

const CANTONESE_ONLY = [..."唔冇咗嘅啲嗰呢佢哋睇瞓攰嬲啦喎嘛呀㗎囉咋乜嘢畀搵咁餸靚嗎闆找"];
const LOANWORD_ONLY = [..."巴士的咖啡卡"];

test("bridge table: every reading is one 한글 syllable keyed by a Han character", () => {
  for (const [ch, ko] of Object.entries(HANJA_KO)) {
    assert.ok(/^\p{Script=Han}$/u.test(ch), `key ${ch}`);
    assert.ok(/^[가-힣]$/u.test(ko), `${ch} → ${ko}`);
  }
});

test("bridge table omits Cantonese-only characters and loanword transliterations", () => {
  for (const ch of [...CANTONESE_ONLY, ...LOANWORD_ONLY]) assert.ok(!(ch in HANJA_KO), `${ch} must not have a reading`);
});

test("every word's characters pair one-to-one with its syllables", () => {
  const bad = vocab.filter((v) => bridge(v.zh, v.jp, HANJA_KO) === null).map((v) => `${v.id} ${v.zh} ${v.jp}`);
  assert.deepEqual(bad, []);
});

test("at least 55% of words give the learner a Sino-Korean reading she may already know", () => {
  const n = vocab.filter((v) => hasBridge(bridge(v.zh, v.jp, HANJA_KO))).length;
  assert.ok(n / vocab.length >= 0.55, `${n}/${vocab.length}`);
});

test("every non-Cantonese-only character in the vocabulary has a reading", () => {
  const skip = new Set([...CANTONESE_ONLY, ...LOANWORD_ONLY]);
  const missing = new Set();
  for (const v of vocab) for (const c of v.zh) if (/\p{Script=Han}/u.test(c) && !skip.has(c) && !(c in HANJA_KO)) missing.add(c);
  assert.deepEqual([...missing], []);
});

import { LEGACY_IDS } from "../data/yue/legacy-ids.js";

test("ids are stable: words keyed by characters, grammar by unit + form (review I3)", () => {
  for (const v of vocab) assert.equal(v.id, `y:${v.zh}`);
  for (const g of grammar) assert.equal(g.id, `yg:${g.unit}:${g.form}`);
  const migrated = yuePack.migrate({ progress: { "y01-01": { reps: 1 } }, custom: [], settings: {} });
  assert.deepEqual(migrated.progress, { [LEGACY_IDS["y01-01"]]: { reps: 1 } });
});

test("speech strips Korean and Latin from grammar forms (review M3)", () => {
  assert.equal(yuePack.speechClean("형용사 + 咗"), "咗");
  assert.equal(yuePack.speechClean("你好，我叫美英。"), "你好，我叫美英。");
});

test("units have Korean titles (review M8) and Home shows the tone key (review I4)", () => {
  for (let u = 1; u <= 12; u++) assert.ok(yuePack.unitTitles[u], `unit ${u}`);
  const home = yuePack.homeExtra(ctx);
  for (const label of yuePack.ui.toneKey) assert.ok(home.includes(label), label);
  for (const n of [1, 2, 3, 4, 5, 6]) assert.ok(home.includes(`t${n}`));
});

test("unit 1 explains how to read the 한글 spelling (review I4)", () => {
  assert.ok(grammar.some((g) => g.unit === 1 && /한글/.test(g.ko) && /ㅍ/.test(g.note)));
});

test("grammar card fronts are distinguishable: the form is shown (review M2)", () => {
  const g = grammar.find((x) => x.form === "형용사 + 咗");
  assert.ok(yuePack.cards.card(g, false, ctx).includes('<div class="chars" lang="zh-Hant">형용사 + 咗</div>'));
});

test("meaning → sound review direction (review I5)", () => {
  const w = word("十");
  const rctx = { ...ctx, settings: { direction: "meaning" }, tab: "review" };
  const front = yuePack.cards.card(w, false, rctx);
  assert.ok(front.includes(w.ko) && !front.includes('class="syl'));
  assert.ok(yuePack.cards.card(w, true, rctx).includes('class="syl'));
  const learnFront = yuePack.cards.card(w, false, { ...rctx, tab: "learn" });
  assert.ok(learnFront.includes('class="syl')); // Learn always introduces sound first
  assert.ok(yuePack.settingsExtra(rctx).includes('data-setting="direction"'));
});

test("loanwords get their own badge, not the Cantonese-only one (review M1)", () => {
  const back = yuePack.cards.card(word("咖啡"), true, ctx);
  assert.ok(back.includes(yuePack.ui.loanword) && !back.includes(yuePack.ui.cantoneseOnly));
});

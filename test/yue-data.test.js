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
  assert.deepEqual(yuePack.speechLang, ["zh-HK", "zh-TW"]);
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

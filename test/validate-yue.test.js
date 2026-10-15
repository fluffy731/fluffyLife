import { test } from "node:test";
import assert from "node:assert/strict";
import { validateYue, YUE_TIERS } from "../lib/validate-yue.js";

const okV = { id: "y-a0-001", zh: "你好", jp: "nei5 hou2", ko: "안녕하세요", en: "hello", pos: "phrase", tier: "a0", unit: 1, exZh: "你好，我叫美英。", exJp: "nei5 hou2, ngo5 giu3 mei5 jing1.", exKo: "안녕하세요, 저는 미영이에요." };
const okG = { id: "yg-a0-001", form: "係", formJp: "hai6", tier: "a0", unit: 1, ko: "~이다", en: "to be", note: "주어 + 係 + 명사", ex: [{ zh: "我係學生。", jp: "ngo5 hai6 hok6 saang1.", ko: "저는 학생이에요." }] };

test("tiers", () => assert.deepEqual(YUE_TIERS, ["a0", "a1", "a2"]));

test("valid rows pass", () => {
  assert.deepEqual(validateYue(okV, "vocab"), []);
  assert.deepEqual(validateYue(okG, "grammar"), []);
});

test("reports missing ko, bad tier, bad unit", () => {
  const { ko, ...noKo } = okV;
  assert.ok(validateYue(noKo, "vocab").some((e) => /ko/.test(e)));
  assert.ok(validateYue({ ...okV, tier: "x" }, "vocab").some((e) => /tier/.test(e)));
  assert.ok(validateYue({ ...okV, unit: 0 }, "vocab").some((e) => /unit/.test(e)));
});

test("reports a syllable with no tone digit and an unmapped syllable", () => {
  assert.ok(validateYue({ ...okV, jp: "nei hou2" }, "vocab").some((e) => /tone/.test(e)));
  assert.ok(validateYue({ ...okV, jp: "hm1" }, "vocab").some((e) => /unmapped/.test(e)));
  assert.ok(validateYue({ ...okV, exJp: "ngo5 hm1" }, "vocab").some((e) => /unmapped/.test(e)));
});

test("grammar needs formJp and at least one complete example", () => {
  const { formJp, ...noJp } = okG;
  assert.ok(validateYue(noJp, "grammar").some((e) => /formJp/.test(e)));
  assert.ok(validateYue({ ...okG, ex: [] }, "grammar").some((e) => /ex/.test(e)));
  assert.ok(validateYue({ ...okG, ex: [{ zh: "我", ko: "나" }] }, "grammar").some((e) => /ex/.test(e)));
});

test("zh and grammar form must contain Han characters (they are spoken by the zh-HK voice)", () => {
  assert.ok(validateYue({ ...okG, form: "시간 표현" }, "grammar").some((e) => /form.*Han|Han.*form/i.test(e)));
  assert.ok(validateYue({ ...okV, zh: "hello" }, "vocab").some((e) => /zh.*Han|Han.*zh/i.test(e)));
  assert.deepEqual(validateYue({ ...okG, form: "太…喇", formJp: "taai3 … laa3" }, "grammar"), []);
});

test("malformed Jyutping is reported, not passed off as punctuation (review I7)", () => {
  for (const bad of ["nei5,hou2", "nei5hou2", "sik7", "(nei5)", "HOU2"]) {
    assert.ok(validateYue({ ...okV, jp: bad }, "vocab").length > 0, bad);
  }
  assert.deepEqual(validateYue({ ...okV, exJp: "ngo5 daap3 MTR." }, "vocab"), []);
  assert.deepEqual(validateYue({ ...okV, exJp: "HK$ 5 man1." }, "vocab"), []);
});

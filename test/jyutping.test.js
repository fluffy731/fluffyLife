import { test } from "node:test";
import assert from "node:assert/strict";
import { syllables, hangul } from "../lib/jyutping.js";

const T = (jp) => hangul(jp, { tones: true });

test("reference words (spec examples)", () => {
  const cases = [
    ["nei5 hou2", "네이⁵ 호우²"], ["hok6 haau6", "혹⁶ 하우⁶"], ["m4 goi1", "음⁴ 꼬이¹"], ["do1 ze6", "또¹ 쩨⁶"],
    ["heoi3", "후이³"], ["gwok3", "꿕³"], ["gwaai1", "꽈이¹"], ["ngo5", "오⁵"], ["ng5", "응⁵"], ["jau5", "여우⁵"],
    ["waa6", "와⁶"], ["seoi2", "수이²"], ["syu1", "쉬¹"], ["sap6", "섭⁶"], ["saam1", "삼¹"], ["sam1", "섬¹"],
    ["saang1", "상¹"], ["faan6", "판⁶"], ["daai6", "따이⁶"], ["hai2", "허이²"], ["coi3", "초이³"], ["gong2", "꽁²"],
  ];
  for (const [jp, hg] of cases) assert.equal(T(jp), hg, jp);
});

test("every initial", () => {
  // short a → ㅓ, so the clean vowel check uses aa
  const aa = { baa1: "빠¹", paa1: "파¹", maa1: "마¹", faa1: "파¹", daa1: "따¹", taa1: "타¹", naa1: "나¹", laa1: "라¹", gaa1: "까¹", kaa1: "카¹", haa1: "하¹", zaa1: "짜¹", caa1: "차¹", saa1: "사¹", waa1: "와¹", jaa1: "야¹", ngaa1: "아¹" };
  for (const [jp, hg] of Object.entries(aa)) assert.equal(T(jp), hg, jp);
  assert.equal(T("gwaa1"), "꽈¹"); assert.equal(T("kwaa1"), "콰¹");
});

test("every final (with a plain initial)", () => {
  assert.equal(T("maai4"), "마이⁴"); assert.equal(T("maau4"), "마우⁴"); assert.equal(T("maam4"), "맘⁴");
  assert.equal(T("maan4"), "만⁴"); assert.equal(T("maang4"), "망⁴"); assert.equal(T("maap6"), "맙⁶");
  assert.equal(T("maat6"), "맏⁶"); assert.equal(T("maak6"), "막⁶");
  assert.equal(T("mai4"), "머이⁴"); assert.equal(T("mau4"), "머우⁴"); assert.equal(T("mam4"), "멈⁴");
  assert.equal(T("man4"), "먼⁴"); assert.equal(T("mang4"), "멍⁴"); assert.equal(T("map6"), "멉⁶");
  assert.equal(T("mat6"), "먿⁶"); assert.equal(T("mak6"), "먹⁶");
  assert.equal(T("me1"), "메¹"); assert.equal(T("mei4"), "메이⁴"); assert.equal(T("meng4"), "멩⁴"); assert.equal(T("mek6"), "멕⁶");
  assert.equal(T("mi4"), "미⁴"); assert.equal(T("miu4"), "미우⁴"); assert.equal(T("mim4"), "밈⁴"); assert.equal(T("min4"), "민⁴");
  assert.equal(T("ming4"), "밍⁴"); assert.equal(T("mip6"), "밉⁶"); assert.equal(T("mit6"), "믿⁶"); assert.equal(T("mik6"), "믹⁶");
  assert.equal(T("mo4"), "모⁴"); assert.equal(T("moi4"), "모이⁴"); assert.equal(T("mou4"), "모우⁴"); assert.equal(T("mon4"), "몬⁴");
  assert.equal(T("mong4"), "몽⁴"); assert.equal(T("mot6"), "몯⁶"); assert.equal(T("mok6"), "목⁶");
  assert.equal(T("mu4"), "무⁴"); assert.equal(T("mui4"), "무이⁴"); assert.equal(T("mun4"), "문⁴"); assert.equal(T("mung4"), "뭉⁴");
  assert.equal(T("mut6"), "묻⁶"); assert.equal(T("muk6"), "묵⁶");
  assert.equal(T("soe1"), "서¹"); assert.equal(T("soeng1"), "성¹"); assert.equal(T("soek3"), "석³");
  assert.equal(T("seoi2"), "수이²"); assert.equal(T("seon3"), "순³"); assert.equal(T("seot1"), "숟¹");
  assert.equal(T("jyu4"), "위⁴"); assert.equal(T("jyun4"), "윈⁴"); assert.equal(T("jyut6"), "윋⁶");
});

test("w / y / gw / kw glides", () => {
  assert.equal(T("wo1"), "워¹"); assert.equal(T("wai4"), "워이⁴"); assert.equal(T("wan4"), "원⁴");
  assert.equal(T("jan4"), "연⁴"); assert.equal(T("je5"), "예⁵"); assert.equal(T("jing1"), "잉¹");
  assert.equal(T("jung4"), "융⁴"); assert.equal(T("jik6"), "익⁶");
  assert.equal(T("gwong2"), "꿩²"); assert.equal(T("kwong4"), "퀑⁴"); assert.equal(T("gwai3"), "꿔이³");
});

test("syllabic m and ng", () => {
  assert.equal(T("m4"), "음⁴"); assert.equal(T("ng5"), "응⁵");
});

test("review focus 1: unmapped syllable is flagged, never blank", () => {
  assert.deepEqual(syllables("hm1"), [{ jp: "hm1", hg: "hm1", tone: 1, ok: false }]);
  assert.equal(hangul("hm1"), "hm1");
  assert.equal(hangul("hm1", { tones: true }), "hm1"); // no double tone digit
});

test("review focus 2: punctuation, capitals, digits", () => {
  assert.equal(hangul("nei5 hou2, ngo5 giu3 Mei5 Jing1."), "네이 호우, 오 끼우 메이 잉.");
  assert.equal(hangul("hou2 gwai3?"), "호우 꿔이?");
  assert.ok(!/\s\?/.test(hangul("hou2 gwai3?")));
  assert.doesNotThrow(() => hangul("HK$ 5"));
  assert.ok(hangul("HK$ 5").includes("HK$") && hangul("HK$ 5").includes("5"));
});

test("missing tone digit shows no superscript", () => {
  assert.equal(T("nei hou"), "네이 호우");
  assert.equal(syllables("nei5")[0].tone, 5);
  assert.equal(syllables("nei")[0].tone, null);
});

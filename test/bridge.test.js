import { test } from "node:test";
import assert from "node:assert/strict";
import { bridge, hasBridge } from "../lib/bridge.js";

test("pairs each Han character with its syllable and Sino-Korean reading", () => {
  assert.deepEqual(bridge("學校", "hok6 haau6", { 學: "학", 校: "교" }), [
    { ch: "學", jp: "hok6", hg: "혹", ko: "학" },
    { ch: "校", jp: "haau6", hg: "하우", ko: "교" },
  ]);
});

test("Cantonese-only characters have ko null and no bridge", () => {
  const rows = bridge("唔該", "m4 goi1", {});
  assert.deepEqual(rows.map((r) => r.ko), [null, null]);
  assert.equal(hasBridge(rows), false);
});

test("character/syllable count mismatch gives null", () => {
  assert.equal(bridge("你好嗎", "nei5 hou2", {}), null);
});

test("punctuation and Latin are ignored on both sides", () => {
  const rows = bridge("你好！", "nei5 hou2!", { 你: "니", 好: "호" });
  assert.equal(rows.length, 2);
  assert.equal(hasBridge(rows), true);
});

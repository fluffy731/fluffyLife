import { test } from "node:test";
import assert from "node:assert/strict";
import { storiesFor, leanCounts, skew, headline, ago, koCandidates, koLookup } from "../news/model.js";

const byId = { abc: { lean: "LL", region: "au" }, bbc: { lean: "C", region: "world" }, fox: { lean: "R", region: "world" }, gcr: { lean: "T", region: "topic", topic: "construction" }, yna: { lean: "C", region: "ko" } };
const S = (lang, srcs, topics = []) => ({ lang, topics, items: srcs.map((s, k) => ({ s, t: `${s} headline ${k}` })) });
const stories = [S("en", ["abc", "bbc"]), S("en", ["fox"]), S("en", ["gcr"], ["construction"]), S("ko", ["yna"]), S("en", ["abc"], ["property", "regulation"])];

test("tabs: top excludes trade-only stories; regions; topics; Korean", () => {
  assert.equal(storiesFor("top", stories, byId).length, 3);
  assert.equal(storiesFor("au", stories, byId).length, 2);
  assert.equal(storiesFor("world", stories, byId).length, 2);
  assert.equal(storiesFor("construction", stories, byId).length, 1);
  assert.equal(storiesFor("regulation", stories, byId).length, 1);
  assert.equal(storiesFor("ko", stories, byId).length, 1);
});

test("lean counts per distinct outlet; skew needs 3+ outlets and 75% one side", () => {
  assert.deepEqual(leanCounts(S("en", ["abc", "bbc", "fox", "fox"]), byId), { L: 0, LL: 1, C: 1, LR: 0, R: 1, T: 0 });
  assert.equal(skew({ L: 2, LL: 1, C: 0, LR: 0, R: 0, T: 0 }), "left");
  assert.equal(skew({ L: 0, LL: 1, C: 1, LR: 0, R: 1, T: 0 }), null);
  assert.equal(skew({ L: 0, LL: 0, C: 0, LR: 1, R: 1, T: 0 }), null, "two outlets is too few to call");
});

test("headline prefers a centre outlet", () => {
  assert.equal(headline(S("en", ["abc", "bbc"]), byId), "bbc headline 1");
});

test("relative time", () => {
  assert.equal(ago(0, 30 * 60000), "30m");
  assert.equal(ago(0, 5 * 3600e3), "5h");
  assert.equal(ago(0, 50 * 3600e3), "2d");
});

test("Korean word lookup strips particles and verb endings", () => {
  assert.deepEqual(koCandidates("정부가"), ["정부가", "정부"]);
  assert.ok(koCandidates("동결했다").includes("동결하다") && koCandidates("동결했다").includes("동결"));
  const rows = [["금리", "金利", "n", "", "interest rate", "", ""], ["동결", "凍結", "n", "", "freeze", "", ""], ["정부", "政府", "n", "", "government", "", ""]];
  assert.equal(koLookup("정부가", rows)[0], "정부");
  assert.equal(koLookup("동결했다", rows)[0], "동결");
  assert.equal(koLookup("「금리를」", rows)[0], "금리");
  assert.equal(koLookup("없는말", rows), null);
});

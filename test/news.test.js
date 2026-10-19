import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { parseFeed, isOpinion, clusterStories, decode } from "../scripts/build-news.mjs";
import { SOURCES } from "../scripts/news-sources.mjs";

const rss = readFileSync(new URL("./fixtures/news/rss.xml", import.meta.url), "utf8");
const atom = readFileSync(new URL("./fixtures/news/atom.xml", import.meta.url), "utf8");

test("decode handles CDATA, entities and tags", () => {
  assert.equal(decode("<![CDATA[<p>A &amp; B &#39;c&#39; &#x2014; d</p>]]>"), "A & B 'c' — d");
});

test("RSS: title, link, time, summary, image from media:thumbnail or content img", () => {
  const items = parseFeed(rss);
  assert.equal(items.length, 4);
  assert.deepEqual(items[0], { title: "Reserve Bank holds interest rates steady at 4.1%", link: "https://example.com/news/rba-holds-rates", time: Date.parse("2026-10-18T22:00:00Z"), summary: "The Reserve Bank of Australia has kept the cash rate on hold & signalled caution.", image: "https://img.example.com/rba.jpg", categories: [] });
  assert.equal(items[3].image, "https://img.example.com/quake.jpg");
  assert.equal(items[3].time, Date.parse("2026-10-18T19:00:00Z"));
  assert.deepEqual(items[3].categories, ["World"]);
});

test("Atom: alternate link, updated time, media:content image", () => {
  const [a] = parseFeed(atom);
  assert.equal(a.link, "https://other.example.org/business/rba");
  assert.equal(a.image, "https://img.other.example.org/rba.png");
  assert.equal(a.summary, "Rates unchanged at 4.1 per cent.");
});

test("opinion and commentary are recognised (URL, title prefix, Korean tags)", () => {
  const items = [...parseFeed(rss), ...parseFeed(atom)];
  assert.deepEqual(items.map(isOpinion), [false, true, true, false, false, true]);
  assert.equal(isOpinion({ title: "Analysis: what the budget means", link: "https://x/news/1", categories: [] }), true);
  assert.equal(isOpinion({ title: "[칼럼] 봄날", link: "https://x/1", categories: [] }), true);
  assert.equal(isOpinion({ title: "Budget passes Senate", link: "https://x/news/2", categories: ["Opinion"] }), true);
});

test("the same story from different outlets is grouped; different stories are not", () => {
  const a = parseFeed(rss).filter((i) => !isOpinion(i)).map((i) => ({ ...i, s: "abc" }));
  const b = parseFeed(atom).filter((i) => !isOpinion(i)).map((i) => ({ ...i, s: "bbc" }));
  const stories = clusterStories([...a, ...b], "en");
  const rba = stories.find((s) => s.items.some((i) => i.l.includes("rba")));
  assert.equal(rba.items.length, 2);
  assert.deepEqual(rba.items.map((i) => i.s).sort(), ["abc", "bbc"]);
  assert.equal(stories.length, 2);
  assert.equal(stories[0], rba, "the story covered by more outlets ranks first");
});

test("sources: unique ids, valid lean and region, https feeds", () => {
  const ids = SOURCES.map((s) => s.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const s of SOURCES) {
    assert.ok(["L", "LL", "C", "LR", "R", "T"].includes(s.lean), s.id);
    assert.ok(["au", "world", "asia", "ko", "topic"].includes(s.region), s.id);
    assert.equal(s.region === "topic", !!s.topic, `${s.id}: topic sources and only they name a topic`);
    if (s.region === "topic") assert.equal(s.lean, "T", s.id);
    assert.ok(s.url.startsWith("https://"), s.id);
  }
  for (const r of ["au", "world", "asia", "ko"]) assert.ok(new Set(SOURCES.filter((s) => s.region === r).map((s) => s.lean)).size >= 3, `${r} spans the spectrum`);
});

import { topicsOf } from "../scripts/build-news.mjs";
test("regulation and topic tagging by keywords (any outlet)", () => {
  assert.deepEqual(topicsOf({ title: "NSW Building Commissioner targets cladding defects", summary: "" }), ["construction", "regulation"]);
  assert.deepEqual(topicsOf({ title: "Changes to the National Construction Code (NCC) 2025", summary: "" }), ["construction", "regulation"]);
  assert.deepEqual(topicsOf({ title: "Sydney house prices hit record as auction clearance rates rise", summary: "" }), ["property"]);
  assert.deepEqual(topicsOf({ title: "Tunnel boring machine breaks through on WestConnex", summary: "" }), ["engineering"]);
  assert.deepEqual(topicsOf({ title: "Cricket: Australia win the Ashes", summary: "" }), []);
});

import { tokens } from "../scripts/build-news.mjs";
test("tokens: plural stemming keeps rate/rates together; Korean particles stripped", () => {
  assert.ok(tokens("Interest rates rise", "en").has("rate") && tokens("Interest rate rises", "en").has("rate"));
  assert.ok(tokens("Policies change", "en").has("policy"));
  assert.ok(tokens("정부가 금리를 동결했다", "ko").has("정부") && tokens("정부가 금리를 동결했다", "ko").has("금리"));
});

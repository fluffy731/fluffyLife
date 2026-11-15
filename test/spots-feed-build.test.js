// The whole Spots feed build, with the sources answered from the recorded samples (no network).
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { build } from "../scripts/build-spots.mjs";

const fx = (n) => readFileSync(new URL(`./fixtures/spots/${n}`, import.meta.url), "utf8");
const SUN_1130 = new Date("2026-11-15T00:30:00Z"); // 11:30 am Sunday in Melbourne

// down: sources that fail ("wom", "ef"); efXml: Eventfinda's answer; womFail: page numbers of What's On that fail.
function fakeFetch({ down = [], efXml = fx("eventfinda.xml"), womFail = [] } = {}) {
  const calls = [];
  const res = (status, body) => ({ ok: status === 200, status, text: async () => body });
  const fn = async (url, init = {}) => {
    calls.push(url);
    if (url.includes("whatson.melbourne.vic.gov.au/mcp")) {
      const page = JSON.parse(init.body).params.arguments.page_number || 1;
      if (down.includes("wom") || womFail.includes(page)) return res(503, "");
      return res(200, JSON.stringify({ jsonrpc: "2.0", id: 1, result: { content: [{ type: "text", text: fx("whatson-today.txt").replace("Page: 1 of 16", "Page: 1 of 3") }] } }));
    }
    if (url.includes("eventfinda")) return down.includes("ef") ? res(503, "") : res(200, efXml);
    if (url.includes("timeout.com")) return res(200, fx("timeout.xml"));
    if (url.includes("concreteplayground")) return res(200, fx("concrete.xml"));
    if (url.includes("news.google.com")) return res(200, fx("gnews.xml"));
    if (url.includes("open-meteo")) return res(200, fx("open-meteo.json"));
    if (url.includes("nager.at")) return res(200, fx("nager.json"));
    return res(404, "");
  };
  fn.calls = calls;
  return fn;
}

async function run(t, opts, { now = SUN_1130, dir } = {}) {
  const real = globalThis.fetch;
  globalThis.fetch = fakeFetch(opts);
  try { return await build({ now, out: join(dir, "feed.json"), raw: join(dir, "raw.json") }); }
  finally { globalThis.fetch = real; }
}
const polishOf = (feed) => feed.events.find((e) => /polish festival/i.test(e.title));

test("a full build merges both sources: What's On's address with Eventfinda's time and picture", async (t) => {
  const dir = mkdtempSync(join(tmpdir(), "spots-")); t.after(() => rmSync(dir, { recursive: true, force: true }));
  const feed = await run(t, {}, { dir });
  const p = polishOf(feed);
  assert.deepEqual([p.src, p.venue, p.next], ["wom", "Fed Square", "2026-11-15T11:00"]);
  assert.match(p.image, /polish\.jpg/);
  assert.ok(feed.sources.every((s) => s.ok), JSON.stringify(feed.sources));
  assert.equal(feed.weather[0].rain, 92);
  assert.ok(feed.fresh.length >= 4);
});

test("Eventfinda down: its session times and pictures are kept from the last build", async (t) => {
  const dir = mkdtempSync(join(tmpdir(), "spots-")); t.after(() => rmSync(dir, { recursive: true, force: true }));
  await run(t, {}, { dir });
  const feed = await run(t, { down: ["ef"] }, { dir, now: new Date(SUN_1130.getTime() + 3600e3) });
  const p = polishOf(feed);
  assert.equal(p.next, "2026-11-15T11:00");
  assert.match(p.image, /polish\.jpg/);
  assert.equal(feed.sources.find((s) => s.id === "eventfinda").ok, false);
  assert.ok(feed.events.some((e) => e.title === "Sunday Night Stand-Up at Club Voltaire Comedy"), "Eventfinda-only events kept");
});

test("What's On reused within 3 hours: Eventfinda's newer session time wins", async (t) => {
  const dir = mkdtempSync(join(tmpdir(), "spots-")); t.after(() => rmSync(dir, { recursive: true, force: true }));
  await run(t, {}, { dir });
  const later = fakeFetch({ efXml: fx("eventfinda.xml").replace("2026-11-15T11:00:00", "2026-11-15T19:30:00") });
  const real = globalThis.fetch; globalThis.fetch = later;
  let feed;
  try { feed = await build({ now: new Date(SUN_1130.getTime() + 3600e3), out: join(dir, "feed.json"), raw: join(dir, "raw.json") }); }
  finally { globalThis.fetch = real; }
  assert.ok(!later.calls.some((u) => u.includes("whatson.melbourne")), "What's On not asked again");
  assert.equal(polishOf(feed).next, "2026-11-15T19:30");
  assert.equal(polishOf(feed).venue, "Fed Square");
});

test("What's On down: its events stay, merged with this hour's Eventfinda", async (t) => {
  const dir = mkdtempSync(join(tmpdir(), "spots-")); t.after(() => rmSync(dir, { recursive: true, force: true }));
  await run(t, {}, { dir });
  const feed = await run(t, { down: ["wom"], efXml: fx("eventfinda.xml").replace("2026-11-15T11:00:00", "2026-11-15T19:30:00") }, { dir, now: new Date(SUN_1130.getTime() + 4 * 3600e3) });
  assert.equal(feed.sources.find((s) => s.id === "whatson").ok, false);
  assert.equal(polishOf(feed).venue, "Fed Square");
  assert.equal(polishOf(feed).next, "2026-11-15T19:30");
});

test("What's On with pages missing keeps the last lists too, and asks again next hour", async (t) => {
  const dir = mkdtempSync(join(tmpdir(), "spots-")); t.after(() => rmSync(dir, { recursive: true, force: true }));
  const first = await run(t, {}, { dir });
  const partial = await run(t, { womFail: [2] }, { dir, now: new Date(SUN_1130.getTime() + 4 * 3600e3) });
  assert.match(partial.sources.find((s) => s.id === "whatson").error, /pages missing/);
  assert.equal(partial.fetched.wom, first.fetched.wom, "not marked as fetched, so the next run tries again");
  const again = fakeFetch();
  const real = globalThis.fetch; globalThis.fetch = again;
  try { await build({ now: new Date(SUN_1130.getTime() + 5 * 3600e3), out: join(dir, "feed.json"), raw: join(dir, "raw.json") }); }
  finally { globalThis.fetch = real; }
  assert.ok(again.calls.some((u) => u.includes("whatson.melbourne")));
});

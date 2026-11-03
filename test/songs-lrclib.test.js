import { test } from "node:test";
import assert from "node:assert/strict";
import { searchLrclib } from "../songs/lrclib.js";

const res = (body, status = 200) => ({ ok: status < 400, status, json: async () => body });
const HIT = { trackName: "밤", artistName: "X", albumName: "A", duration: 200, instrumental: false, plainLyrics: "가\n나", syncedLyrics: null };

test("searches by title and artist and maps the fields", async () => {
  const urls = [];
  const hits = await searchLrclib({ title: "밤", artist: "X" }, async (u) => { urls.push(String(u)); return res([HIT]); });
  assert.ok(urls[0].startsWith("https://lrclib.net/api/search?"));
  assert.ok(urls[0].includes("track_name=%EB%B0%A4&artist_name=X"), urls[0]);
  assert.deepEqual(hits, [{ title: "밤", artist: "X", album: "A", duration: 200, lyrics: "가\n나", instrumental: false }]);
});

test("falls back to synced lyrics without timestamps", async () => {
  const hits = await searchLrclib({ title: "밤", artist: "" }, async () => res([{ ...HIT, plainLyrics: "", syncedLyrics: "[00:01.00]가\n[00:02.00]나" }]));
  assert.equal(hits[0].lyrics, "가\n나");
});

test("retries by title alone when title plus artist finds nothing", async () => {
  const urls = [];
  const hits = await searchLrclib({ title: "네 생각", artist: "존박" }, async (u) => { urls.push(String(u)); return res(urls.length === 1 ? [] : [HIT]); });
  assert.equal(urls.length, 2);
  assert.ok(urls[1].includes("q=%EB%84%A4+%EC%83%9D%EA%B0%81") || urls[1].includes("q=%EB%84%A4%20%EC%83%9D%EA%B0%81"), urls[1]);
  assert.equal(hits.length, 1);
});

test("network failure reads as offline, a bad status as lrclib", async () => {
  await assert.rejects(searchLrclib({ title: "밤" }, async () => { throw new TypeError("Failed to fetch"); }), /offline/);
  await assert.rejects(searchLrclib({ title: "밤" }, async () => res({}, 500)), /lrclib/);
});

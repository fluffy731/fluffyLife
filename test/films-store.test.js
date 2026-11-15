import { test } from "node:test";
import assert from "node:assert/strict";
import { KEY, load, save, snapshot, toggleWant, toggleSeen, backupText, restore } from "../films/store.js";

const mem = (init = {}) => {
  const m = new Map(Object.entries(init));
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), m };
};
const F = (id, o = {}) => ({ id, title: `Film ${id}`, original: `電影${id}`, year: 2000, era: "2000s", places: ["HK"], country: "HK", lang: "cn",
  genres: ["Drama"], runtime: 100, rating: 7, votes: 100, pop: 1, director: { id: 1, name: "D" }, cast: [{ id: 2, name: "A" }], plot: "p", poster: "/p.jpg", trailer: null, ...o });
const AT = "2026-11-15T10:00:00.000Z";
const DEFAULTS = { settings: { place: "all", era: "all", genre: "all", theme: "auto", hideSeen: false }, want: {}, seen: {} };

test("load falls back to defaults on bad storage", () => {
  assert.equal(KEY, "films.v1");
  assert.deepEqual(load(mem()), DEFAULTS);
  assert.deepEqual(load(mem({ "films.v1": "{not json" })), DEFAULTS);
  assert.deepEqual(load({ getItem: () => { throw new Error("blocked"); } }), DEFAULTS, "private mode or blocked storage");
  assert.deepEqual(load(mem({ "films.v1": JSON.stringify({ settings: { place: "KR" } }) })).settings, { ...DEFAULTS.settings, place: "KR" });
  assert.deepEqual(load(undefined), DEFAULTS, "no storage at all");
});

test("save writes, and never throws when storage refuses", () => {
  const s = mem();
  const st = load(s);
  st.settings.era = "1990s";
  save(st, s);
  assert.equal(load(s).settings.era, "1990s");
  assert.doesNotThrow(() => save(st, { setItem: () => { throw new Error("full"); } }));
});

test("snapshot keeps what the watchlist needs when a film leaves the catalogue", () => {
  assert.deepEqual(Object.keys(snapshot(F(1), AT)).sort(), ["at", "cast", "director", "era", "genres", "id", "original", "places", "poster", "title", "year"]);
});

test("toggleSeen moves a film off the watchlist", () => {
  const st = structuredClone(DEFAULTS);
  assert.equal(toggleWant(st, F(1), AT), true);
  assert.ok(st.want[1]);
  assert.equal(toggleSeen(st, F(1), AT), true);
  assert.ok(st.seen[1] && !st.want[1]);
  assert.equal(toggleSeen(st, F(1), AT), false);
  assert.ok(!st.seen[1]);
  assert.equal(toggleWant(st, F(2), AT), true);
  assert.equal(toggleWant(st, F(2), AT), false);
});

test("backup round-trips and restore merges without duplicates", () => {
  const a = structuredClone(DEFAULTS);
  toggleWant(a, F(1), AT); toggleWant(a, F(2), AT); toggleSeen(a, F(3), AT);
  const text = backupText(a);
  const parsed = JSON.parse(text);
  assert.equal(parsed.app, "films");
  assert.equal(parsed.version, 1);
  const b = structuredClone(DEFAULTS);
  toggleWant(b, F(1), AT);
  assert.deepEqual(restore(b, text), { added: 2 });
  assert.deepEqual(Object.keys(b.want).sort(), ["1", "2"]);
  assert.deepEqual(Object.keys(b.seen), ["3"]);
  assert.deepEqual(restore(b, text), { added: 0 }, "restoring twice adds nothing");
});

test("restore refuses foreign files", () => {
  const st = structuredClone(DEFAULTS);
  toggleWant(st, F(1), AT);
  const before = structuredClone(st);
  const bad = ["not json", JSON.stringify({ app: "stocks-watchlist", watch: [] }),
    JSON.stringify({ app: "films", version: 1, want: { 5: { title: "no id" } }, seen: {} }), JSON.stringify(null)];
  for (const text of bad) {
    assert.throws(() => restore(st, text), { message: "This file is not a Films backup." });
    assert.deepEqual(st, before);
  }
});

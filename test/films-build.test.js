import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, writeFileSync, mkdtempSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  GENRE_IDS, MIN_VOTES, VOTED_FLOOR, auth, cellQueries, nowQuery, filmFrom, trimPlot, assemble, isThin, needsBuild, summary, run,
} from "../scripts/build-films.mjs";

const fx = (n) => JSON.parse(readFileSync(new URL(`./fixtures/films/${n}`, import.meta.url), "utf8"));
const details = fx("details.json");
const TODAY = "2026-11-15";

test("auth sends a read token as Bearer and a short key as api_key", () => {
  assert.deepEqual(auth("eyJhbGciOi.token"), { headers: { Authorization: "Bearer eyJhbGciOi.token" }, params: {} });
  assert.deepEqual(auth("abc123"), { headers: {}, params: { api_key: "abc123" } });
});

test("constants: TMDB genre ids without TV Movie, vote floors", () => {
  assert.equal(GENRE_IDS[28], "Action");
  assert.equal(GENRE_IDS[10770], undefined);
  assert.deepEqual(MIN_VOTES, { HK: 20, CN: 20, KR: 20, EN: 300 });
  assert.equal(VOTED_FLOOR, 10);
});

test("cellQueries covers both sorts, five pages, and the place filter", () => {
  const qs = cellQueries("CN", "1980s", TODAY);
  assert.equal(qs.length, 10);
  for (const q of qs) {
    assert.equal(q.path, "/discover/movie");
    assert.equal(q.params.with_origin_country, "CN|TW");
    assert.equal(q.params.with_original_language, "zh|cn");
    assert.equal(q.params["primary_release_date.gte"], "1980-01-01");
    assert.equal(q.params["primary_release_date.lte"], "1989-12-31");
    assert.equal(q.params.include_adult, false);
    assert.equal(q.params.without_genres, 10770);
  }
  const rated = qs.filter((q) => q.params.sort_by === "vote_average.desc");
  assert.equal(rated.length, 5);
  assert.ok(rated.every((q) => q.params["vote_count.gte"] === 20));
  const voted = qs.filter((q) => q.params.sort_by === "vote_count.desc");
  assert.ok(voted.every((q) => q.params["vote_count.gte"] === 10), "the most-rated list has a floor too");
  assert.deepEqual(rated.map((q) => q.params.page), [1, 2, 3, 4, 5]);
  const classics = cellQueries("HK", "classics", TODAY);
  assert.ok(classics.every((q) => !("primary_release_date.gte" in q.params) && q.params["primary_release_date.lte"] === "1969-12-31"));
  assert.ok(cellQueries("KR", "2020s", TODAY).every((q) => q.params["primary_release_date.lte"] === TODAY), "nothing unreleased");
  const en = cellQueries("EN", "1990s", TODAY)[0].params;
  assert.equal(en.with_original_language, "en");
  assert.equal(en.with_origin_country, "US|GB|CA|AU|NZ|IE");
});

test("nowQuery asks for this week's popular released films", () => {
  const q = nowQuery("HK", TODAY);
  assert.deepEqual([q.path, q.params.sort_by, q.params["primary_release_date.lte"], q.params["vote_count.gte"], q.params.page],
    ["/discover/movie", "popularity.desc", TODAY, 10, 1]);
  assert.equal(q.params.with_origin_country, "HK");
});

test("filmFrom maps a full record", () => {
  const f = filmFrom(details[10775], ["HK"]);
  assert.equal(f.id, 10775);
  assert.equal(f.title, "Infernal Affairs");
  assert.equal(f.original, "無間道");
  assert.deepEqual(f.places, ["HK"]);
  assert.equal(f.country, "HK");
  assert.equal(f.year, 2002);
  assert.equal(f.era, "2000s");
  assert.equal(f.lang, "cn");
  assert.deepEqual(f.genres, ["Action", "Crime", "Drama", "Thriller"]);
  assert.equal(f.runtime, 101);
  assert.equal(f.rating, 7.9);
  assert.equal(f.votes, 3201);
  assert.equal(f.pop, 21.4);
  assert.equal(f.director.name, "Andrew Lau");
  assert.deepEqual(f.cast.map((c) => c.name), ["Andy Lau", "Tony Leung Chiu-wai", "Anthony Wong Chau-sang"], "first three by billing order");
  assert.equal(f.poster, "/sample10775.jpg");
  assert.equal(f.trailer, "iaTrailer", "the official trailer, not the fan one");
});

test("filmFrom: co-productions, Martial arts and English co-productions", () => {
  const kfh = filmFrom(details[9470], ["HK"]);
  assert.deepEqual(kfh.places, ["HK", "CN"]);
  assert.ok(kfh.genres.includes("Martial arts"));
  assert.ok(filmFrom(details[79], ["CN"]).genres.includes("Martial arts"), "wuxia counts");
  assert.deepEqual(filmFrom(details[311324], ["EN"]).places, ["EN"]);
  assert.equal(filmFrom(details[43049], ["CN"]).country, "TW", "Taiwan shows as Taiwan");
});

test("filmFrom tolerates missing fields", () => {
  const f = filmFrom(details[900001], ["HK"]);
  assert.equal(f.poster, null);
  assert.equal(f.runtime, null);
  assert.equal(f.director, null);
  assert.deepEqual(f.cast, []);
  assert.deepEqual(f.places, ["HK"], "from production_countries");
  assert.equal(f.trailer, null);
  assert.equal(filmFrom(details[900002], ["HK"]), null, "no release date, no era");
  assert.equal(filmFrom(details[900003], ["HK"]), null, "softcore titles are left out");
  assert.equal(filmFrom({ ...details[289], adult: true }, ["EN"]), null);
  assert.deepEqual(filmFrom({ ...details[289], origin_country: ["FR"], production_countries: [] }, ["EN"]).places, ["EN"], "falls back to where it was found");
});

test("trimPlot cuts on a word and adds an ellipsis", () => {
  assert.equal(trimPlot("Short."), "Short.");
  const long = "word ".repeat(100).trim();
  const t = trimPlot(long);
  assert.ok(t.length <= 301 && t.endsWith("…") && !t.includes("wor…"));
  assert.equal(trimPlot(""), "");
  assert.equal(trimPlot(undefined), "");
});

test("assemble merges duplicate ids and adds stats", () => {
  const a = filmFrom(details[10775], ["HK"]), b = filmFrom(details[843], ["HK"]);
  const feed = assemble([b, a, { ...a, places: ["CN"] }], "2026-11-15T00:00:00Z", "abc123def456", { calls: 3, failed: 0 });
  assert.deepEqual(feed.films.map((f) => f.id), [843, 10775]);
  assert.deepEqual(feed.films[1].places, ["HK", "CN"]);
  assert.equal(feed.version, 1);
  assert.equal(feed.rules, "abc123def456");
  assert.ok(feed.stats.HK.m > 0 && feed.stats.CN);
  assert.deepEqual(feed.sources, { calls: 3, failed: 0 });
});

test("isThin and needsBuild", () => {
  const many = (n) => ({ films: Array.from({ length: n }, (_, i) => ({ id: i })) });
  assert.equal(isThin(many(400), many(1000)), true);
  assert.equal(isThin(many(600), null), false);
  assert.equal(isThin(many(400), null), true);
  assert.equal(isThin(many(3), null, 1), false, "the floor can be lowered");
  const now = new Date("2026-11-15T00:00:00Z");
  const old = (days, rules = "r1") => ({ rules, built: new Date(now - days * 864e5).toISOString() });
  assert.equal(needsBuild(null, "r1", now), true);
  assert.equal(needsBuild(old(2, "r0"), "r1", now), true);
  assert.equal(needsBuild(old(8), "r1", now), true);
  assert.equal(needsBuild(old(2), "r1", now), false);
});

test("summary never prints a plot", () => {
  const films = Object.values(details).map((d) => filmFrom(d, ["HK"])).filter(Boolean);
  const out = summary(assemble(films, "2026-11-15T00:00:00Z", "r", { calls: 12, failed: 1 }));
  for (const d of Object.values(details)) if (d.overview) assert.ok(!out.includes(d.overview.slice(0, 30)), "no plot text");
  assert.match(out, /calls 12, failed 1/);
  assert.match(out, /HK/);
  assert.match(out, /poster \d+%/);
  assert.match(out, /size \d+ KB/);
  assert.match(out, /sample \d+ .+ \(\d{4}\)/);
});

// ---------- the runner, against a fake TMDB ----------

const discover = fx("discover.json");
const KEY = "secret-test-key-123";
// A fake fetch: discover pages from the fixture, details by id; records every call; `plan` can override answers.
function fakeTMDB(plan = {}) {
  const calls = [];
  const fetch = async (url, init = {}) => {
    const u = new URL(url);
    calls.push(u.pathname);
    if (u.hostname !== "api.themoviedb.org") return new Response("no", { status: 404 });
    if (u.searchParams.get("api_key") !== KEY) return new Response("{}", { status: 401 });
    const over = plan[u.pathname]?.shift?.();
    if (over) return new Response(over.body ?? "{}", { status: over.status, headers: over.headers || {} });
    if (u.pathname === "/3/discover/movie") return new Response(JSON.stringify(plan.emptyDiscover ? { ...discover, results: [] } : discover));
    const id = u.pathname.match(/^\/3\/movie\/(\d+)$/)?.[1];
    if (id && details[id]) return new Response(JSON.stringify(details[id]));
    return new Response("{}", { status: 404 });
  };
  return { fetch, calls, detailCalls: () => calls.filter((c) => c.startsWith("/3/movie/")) };
}
const tmp = () => {
  const dir = mkdtempSync(join(tmpdir(), "films-"));
  return { out: join(dir, "feed.json"), cacheDir: join(dir, "cache") };
};
const NOW = new Date("2026-11-15T03:00:00Z");
const quiet = () => {};

test("run skips without a key", async () => {
  const lines = [];
  const r = await run({ key: "", fetch: fakeTMDB().fetch, ...tmp(), log: (l) => lines.push(l) });
  assert.deepEqual(r, { wrote: false, feed: null });
  assert.match(lines.join("\n"), /TMDB_API_KEY not set: skipping films/);
});

test("run builds a feed from fixtures and caches details", async () => {
  const t = tmp(), tm = fakeTMDB();
  const r = await run({ key: KEY, fetch: tm.fetch, now: NOW, ...t, thinFloor: 1, rules: "r1", log: quiet });
  assert.equal(r.wrote, true);
  const feed = JSON.parse(readFileSync(t.out, "utf8"));
  assert.deepEqual(feed.films.map((f) => f.id).sort((a, b) => a - b), [79, 289, 843, 9470, 10775, 11423, 43049, 311324, 900001]);
  assert.equal(feed.rules, "r1");
  assert.equal(feed.built, NOW.toISOString());
  assert.deepEqual(feed.films.find((f) => f.id === 9470).places, ["HK", "CN"]);
  assert.equal(tm.detailCalls().length, 11, "each film's details fetched once");
  const again = fakeTMDB();
  await run({ key: KEY, fetch: again.fetch, now: NOW, ...t, thinFloor: 1, rules: "r1", force: true, log: quiet });
  assert.equal(again.detailCalls().length, 0, "details come from the cache");
});

test("run re-fetches details older than 30 days", async () => {
  const t = tmp();
  await run({ key: KEY, fetch: fakeTMDB().fetch, now: NOW, ...t, thinFloor: 1, log: quiet });
  const cacheFile = join(t.cacheDir, "details.json");
  const cache = JSON.parse(readFileSync(cacheFile, "utf8"));
  cache["843"].at = new Date(NOW - 31 * 864e5).toISOString();
  writeFileSync(cacheFile, JSON.stringify(cache));
  const tm = fakeTMDB();
  await run({ key: KEY, fetch: tm.fetch, now: NOW, ...t, thinFloor: 1, force: true, log: quiet });
  assert.deepEqual(tm.detailCalls(), ["/3/movie/843"]);
});

test("run retries a 429 then succeeds", async () => {
  const t = tmp(), tm = fakeTMDB({ "/3/movie/10775": [{ status: 429, headers: { "Retry-After": "0" } }] });
  const r = await run({ key: KEY, fetch: tm.fetch, now: NOW, ...t, thinFloor: 1, log: quiet });
  assert.ok(r.feed.films.some((f) => f.id === 10775));
  assert.equal(tm.detailCalls().filter((c) => c === "/3/movie/10775").length, 2);
  assert.equal(r.feed.sources.failed, 0);
});

test("run keeps the old feed when the new one is thin", async () => {
  const t = tmp();
  await run({ key: KEY, fetch: fakeTMDB().fetch, now: NOW, ...t, thinFloor: 1, log: quiet });
  const before = readFileSync(t.out, "utf8");
  const lines = [];
  const r = await run({ key: KEY, fetch: fakeTMDB({ emptyDiscover: true }).fetch, now: NOW, ...t, force: true, log: (l) => lines.push(l) });
  assert.equal(r.wrote, false);
  assert.equal(readFileSync(t.out, "utf8"), before);
  assert.match(lines.join("\n"), /thin/i);
});

test("run logs no plots and never the key", async () => {
  const lines = [];
  await run({ key: KEY, fetch: fakeTMDB({ "/3/movie/843": [{ status: 500 }, { status: 500 }, { status: 500 }, { status: 500 }] }).fetch,
    now: NOW, ...tmp(), thinFloor: 1, backoff: 0, log: (l) => lines.push(String(l)) });
  const out = lines.join("\n");
  assert.ok(!out.includes(KEY), "the key never reaches the log");
  for (const d of Object.values(details)) if (d.overview) assert.ok(!out.includes(d.overview.slice(0, 30)));
  assert.match(out, /failed 1/, "a detail that fails four times counts once");
});

test("run returns early when the feed is fresh", async () => {
  const t = tmp();
  await run({ key: KEY, fetch: fakeTMDB().fetch, now: NOW, ...t, thinFloor: 1, rules: "r1", log: quiet });
  const tm = fakeTMDB();
  const r = await run({ key: KEY, fetch: tm.fetch, now: new Date(NOW.getTime() + 2 * 864e5), ...t, rules: "r1", log: quiet });
  assert.equal(r.wrote, false);
  assert.equal(tm.calls.length, 0);
  const rebuilt = await run({ key: KEY, fetch: fakeTMDB().fetch, now: new Date(NOW.getTime() + 2 * 864e5), ...t, rules: "r2", thinFloor: 1, log: quiet });
  assert.equal(rebuilt.wrote, true, "a rules change rebuilds at once");
});

test("run --probe writes into the cache folder, not the site", async () => {
  const t = tmp();
  const r = await run({ key: KEY, fetch: fakeTMDB().fetch, now: NOW, ...t, thinFloor: 1, probe: true, log: quiet });
  assert.equal(r.wrote, true);
  assert.ok(!existsSync(t.out));
  assert.ok(existsSync(join(t.cacheDir, "probe-feed.json")));
});

// ---------- fixes from the final review ----------

test("a malformed 200 is retried, and one that never parses doesn't sink the build", async () => {
  const once = await run({ key: KEY, fetch: fakeTMDB({ "/3/movie/843": [{ status: 200, body: "<html>busy</html>" }] }).fetch, now: NOW, ...tmp(), thinFloor: 1, backoff: 0, log: quiet });
  assert.ok(once.wrote && once.feed.films.some((f) => f.id === 843) && once.feed.sources.failed === 0);
  const bad = Array.from({ length: 4 }, () => ({ status: 200, body: "<html>" }));
  const t = tmp();
  const never = await run({ key: KEY, fetch: fakeTMDB({ "/3/movie/843": bad }).fetch, now: NOW, ...t, thinFloor: 1, backoff: 0, log: quiet });
  assert.ok(never.wrote && !never.feed.films.some((f) => f.id === 843) && never.feed.sources.failed === 1);
  assert.ok(existsSync(join(t.cacheDir, "details.json")), "the details already fetched are kept");
});

test("run never touches TMDB's website, only its API", async () => {
  const tm = fakeTMDB();
  await run({ key: KEY, fetch: tm.fetch, now: NOW, ...tmp(), thinFloor: 1, log: quiet });
  assert.ok(tm.calls.length > 0 && tm.calls.every((c) => c.startsWith("/3/")), tm.calls.filter((c) => !c.startsWith("/3/")).join(" "));
});

test("a feed older than 150 days is removed even without a key", async () => {
  const t = tmp();
  writeFileSync(t.out, JSON.stringify({ version: 1, built: new Date(NOW - 151 * 864e5).toISOString(), rules: "r1", films: [] }));
  await run({ key: "", fetch: fakeTMDB().fetch, now: NOW, ...t, log: quiet });
  assert.ok(!existsSync(t.out));
  writeFileSync(t.out, JSON.stringify({ version: 1, built: new Date(NOW - 100 * 864e5).toISOString(), rules: "r1", films: [] }));
  await run({ key: "", fetch: fakeTMDB().fetch, now: NOW, ...t, log: quiet });
  assert.ok(existsSync(t.out), "a younger feed stays");
});

test("the detail cache is pruned on every run, even when nothing is rebuilt", async () => {
  const t = tmp();
  await run({ key: KEY, fetch: fakeTMDB().fetch, now: NOW, ...t, thinFloor: 1, rules: "r1", log: quiet });
  const file = join(t.cacheDir, "details.json");
  const cache = JSON.parse(readFileSync(file, "utf8"));
  cache["843"].at = new Date(NOW - 31 * 864e5).toISOString();
  writeFileSync(file, JSON.stringify(cache));
  await run({ key: KEY, fetch: fakeTMDB().fetch, now: NOW, ...t, rules: "r1", log: quiet });
  assert.ok(!JSON.parse(readFileSync(file, "utf8"))["843"]);
});

test("Popular right now and ratings come from this week's discover results", async () => {
  const t = tmp();
  await run({ key: KEY, fetch: fakeTMDB().fetch, now: NOW, ...t, thinFloor: 1, log: quiet });
  const fresh = { ...discover, results: discover.results.map((r) => (r.id === 10775 ? { ...r, popularity: 99.04, vote_count: 3300, vote_average: 8.04 } : r)) };
  const fetch = async (url, init) => (new URL(url).pathname === "/3/discover/movie" ? new Response(JSON.stringify(fresh)) : fakeTMDB().fetch(url, init));
  const r = await run({ key: KEY, fetch, now: NOW, ...t, thinFloor: 1, force: true, log: quiet });
  const ia = r.feed.films.find((f) => f.id === 10775);
  assert.deepEqual([ia.pop, ia.votes, ia.rating], [99, 3300, 8]);
});

test("the detail cache keeps only what the catalogue needs", async () => {
  const t = tmp();
  await run({ key: KEY, fetch: fakeTMDB().fetch, now: NOW, ...t, thinFloor: 1, log: quiet });
  const d = JSON.parse(readFileSync(join(t.cacheDir, "details.json"), "utf8"))["10775"].d;
  assert.ok(!("production_companies" in d) && !("budget" in d));
  assert.ok(d.credits.crew.every((c) => c.job === "Director"));
  assert.ok(d.credits.cast.length <= 10 && d.videos.results.every((v) => v.site === "YouTube" && v.type === "Trailer"));
  assert.deepEqual(filmFrom(d, ["HK"]), filmFrom(details[10775], ["HK"]), "the slim copy makes the same film");
});

test("filmFrom refuses a poster path that isn't a plain file name", () => {
  assert.equal(filmFrom({ ...details[289], poster_path: '/x" onerror="alert(1).jpg' }, ["EN"]).poster, null);
  assert.equal(filmFrom(details[289], ["EN"]).poster, "/sample289.jpg");
});

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  GENRE_IDS, MIN_VOTES, VOTED_FLOOR, auth, cellQueries, nowQuery, filmFrom, trimPlot, assemble, isThin, needsBuild, summary,
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

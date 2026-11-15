import { test } from "node:test";
import assert from "node:assert/strict";
import { PLACES, ERAS, NAMED_ERAS, GENRES, placesOf, eraOf, placeStats, weightedRating } from "../films/model.js";

// A valid Film; tests override what they need.
let nextId = 1;
const film = (o = {}) => {
  const year = o.year ?? 2002;
  return {
    id: nextId++, title: "A Film", original: "A Film", year, era: eraOf(year), places: ["HK"], country: "HK", lang: "cn",
    genres: ["Drama"], runtime: 100, rating: 7, votes: 100, pop: 10, director: { id: 900, name: "Someone" },
    cast: [{ id: 901, name: "Lead One" }, { id: 902, name: "Lead Two" }], plot: "A story.", poster: null, trailer: null, ...o,
  };
};

// ---------- places, eras, genres ----------

test("the constants: four places in order, seven eras, nineteen genres", () => {
  assert.deepEqual(PLACES.map((p) => p.id), ["HK", "CN", "KR", "EN"]);
  assert.deepEqual(PLACES.map((p) => p.local), ["香港", "華語", "한국", ""]);
  assert.deepEqual(ERAS.map((e) => e.id), ["classics", "1970s", "1980s", "1990s", "2000s", "2010s", "2020s"]);
  assert.equal(GENRES.length, 19);
  assert.ok(GENRES.includes("Martial arts") && !GENRES.includes("TV Movie"));
  assert.equal(NAMED_ERAS.HK["1990s"], "Golden age");
  assert.equal(NAMED_ERAS.KR["2000s"], "New Wave");
  assert.equal(NAMED_ERAS.CN["1980s"], "Fifth Generation · Taiwan New Cinema");
});

test("placesOf follows the place rules", () => {
  assert.deepEqual(placesOf(["HK"], "cn"), ["HK"]);
  assert.deepEqual(placesOf(["HK", "CN"], "cn"), ["HK", "CN"]);
  assert.deepEqual(placesOf(["TW"], "zh"), ["CN"]);
  assert.deepEqual(placesOf(["US", "CN"], "en"), ["EN"], "an English-language US/China co-production is not Chinese");
  assert.deepEqual(placesOf(["KR"], "ko"), ["KR"]);
  assert.deepEqual(placesOf(["FR"], "fr"), []);
  assert.deepEqual(placesOf(["GB"], "en"), ["EN"]);
  assert.deepEqual(placesOf(["IN"], "en"), []);
});

test("eraOf puts years in decades", () => {
  assert.equal(eraOf(1969), "classics");
  assert.equal(eraOf(1970), "1970s");
  assert.equal(eraOf(1999), "1990s");
  assert.equal(eraOf(2026), "2020s");
  assert.equal(eraOf(NaN), null);
});

// ---------- rating ----------

test("weightedRating pulls small samples to the mean", () => {
  const stat = { mean: 6.5, m: 100 };
  assert.ok(weightedRating(film({ rating: 9.0, votes: 10 }), stat) < weightedRating(film({ rating: 8.4, votes: 20000 }), stat));
  assert.equal(weightedRating(film({ rating: 8, votes: 50 }), { mean: 6, m: 50 }), 7, "v = m gives the average of R and C");
});

test("placeStats uses each place's own mean and median votes", () => {
  const hk = [film({ votes: 10, rating: 6 }), film({ votes: 20, rating: 7 }), film({ votes: 30, rating: 8 })];
  assert.deepEqual(placeStats(hk).HK, { mean: 7, m: 20 });
  const both = placeStats([...hk, film({ places: ["HK", "CN"], votes: 40, rating: 9 })]);
  assert.deepEqual(both.HK, { mean: 7.5, m: 25 }, "a co-production counts in Hong Kong");
  assert.deepEqual(both.CN, { mean: 9, m: 40 }, "and in Chinese");
});

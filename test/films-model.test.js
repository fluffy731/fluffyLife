import { test } from "node:test";
import assert from "node:assert/strict";
import {
  PLACES, ERAS, NAMED_ERAS, GENRES, placesOf, eraOf, placeStats, weightedRating,
  inShelf, shelfLists, interleave, rankMap, genreChips, erasWithFilms, surprise, moreLike, fold, search,
} from "../films/model.js";

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

// ---------- shelves ----------

const ALL = { place: "all", era: "all", genre: "all" };
const HK = { ...ALL, place: "HK" };
const flat = { HK: { mean: 7, m: 1 }, CN: { mean: 7, m: 1 }, KR: { mean: 7, m: 1 }, EN: { mean: 7, m: 1 } }; // WR ≈ rating

test("interleave alternates places without duplicates", () => {
  const [a, b, c, d] = [film(), film(), film(), film()];
  assert.deepEqual(interleave([[a, b], [c, a], [d]]).map((x) => x.id), [a, c, d, b].map((x) => x.id));
});

test("inShelf filters by place, era and genre", () => {
  const f = film({ places: ["HK", "CN"], year: 1994, genres: ["Crime"] });
  assert.ok(inShelf(f, { place: "CN", era: "1990s", genre: "Crime" }));
  assert.ok(!inShelf(f, { place: "KR", era: "all", genre: "all" }));
  assert.ok(!inShelf(f, { place: "all", era: "2000s", genre: "all" }));
  assert.ok(!inShelf(f, { place: "all", era: "all", genre: "Comedy" }));
});

test("crowd-pleasers are popular films rated below the shelf median", () => {
  const steady = Array.from({ length: 10 }, (_, i) => film({ rating: 7, votes: 100 * (i + 1) }));
  const [hit, c1, c2, c3, c4] = [[8, 5000], [5, 4000], [4.5, 3000], [4, 2000], [3.5, 1500]].map(([rating, votes]) => film({ rating, votes }));
  const { crowd } = shelfLists([...steady, hit, c1, c2, c3, c4], flat, HK);
  assert.deepEqual(crowd.map((x) => x.id), [c1, c2, c3, c4].map((x) => x.id));
  const small = [film({ rating: 8, votes: 5000 }), film({ rating: 5, votes: 4000 }), film({ rating: 4, votes: 3000 }),
    ...Array.from({ length: 6 }, (_, i) => film({ rating: 7, votes: 100 * (i + 1) }))];
  assert.deepEqual(shelfLists(small, flat, HK).crowd, [], "fewer than four qualify, so the row hides");
});

test("crowd-pleasers are per shelf", () => {
  const low = [[5.0, 600], [5.2, 550], [5.4, 500], [5.6, 450]].map(([rating, votes]) => film({ year: 1975, rating, votes }));
  const rest = Array.from({ length: 8 }, (_, i) => film({ year: 1975, rating: 7 + i / 10, votes: 50 * (i + 1) }));
  const modern = Array.from({ length: 6 }, () => film({ year: 2005, rating: 7.5, votes: 10000 }));
  const films = [...low, ...rest, ...modern];
  const { crowd } = shelfLists(films, placeStats(films), { ...HK, era: "1970s" });
  assert.deepEqual(crowd.map((x) => x.id), low.map((x) => x.id));
});

test("All places interleaves each place's ranking", () => {
  const a = film({ rating: 8, votes: 1000 }), b = film({ rating: 6, votes: 1000 });
  const c = film({ places: ["CN"], rating: 9, votes: 1000 }), d = film({ places: ["CN"], rating: 5, votes: 1000 });
  const { rated } = shelfLists([a, b, c, d], flat, ALL);
  assert.deepEqual(rated.map((x) => x.id), [a, c, b, d].map((x) => x.id));
});

test("Popular right now only without an era", () => {
  const films = Array.from({ length: 25 }, (_, i) => film({ pop: i }));
  const { now } = shelfLists(films, flat, HK);
  assert.equal(now.length, 20);
  assert.equal(now[0].pop, 24);
  assert.deepEqual(shelfLists(films, flat, { ...HK, era: "1990s" }).now, []);
});

test("lists on an empty shelf", () => {
  const films = [film({ genres: ["Western"], year: 1960 }), film()];
  const f = { place: "KR", era: "classics", genre: "Western" };
  assert.deepEqual(shelfLists(films, placeStats(films), f), { rated: [], popular: [], crowd: [], now: [] });
  assert.deepEqual(genreChips(films, f), []);
  assert.ok(!erasWithFilms(films, f).has("classics"));
  assert.ok(erasWithFilms(films, { ...f, place: "HK" }).has("classics"));
});

test("genreChips hides genres with fewer than 4 films", () => {
  const films = [...Array.from({ length: 5 }, () => film({ genres: ["Crime", "Thriller"] })), ...Array.from({ length: 3 }, () => film({ genres: ["Comedy"] })),
    film({ genres: ["Thriller"] })];
  assert.deepEqual(genreChips(films, { ...HK, genre: "Comedy" }), [{ genre: "Thriller", count: 6 }, { genre: "Crime", count: 5 }]);
});

test("rankMap ranks a co-production in each place", () => {
  const x = film({ rating: 6, votes: 100 }), y = film({ places: ["HK", "CN"], rating: 8, votes: 300 }), z = film({ places: ["CN"], rating: 9, votes: 500 });
  const ranks = rankMap([x, y, z], flat);
  assert.deepEqual(ranks.get(y.id), { HK: { rated: 1, popular: 1 }, CN: { rated: 2, popular: 2 } });
  assert.deepEqual(ranks.get(x.id), { HK: { rated: 2, popular: 2 } });
});

// ---------- Surprise me, More like this, search ----------

// A repeatable stand-in for Math.random.
const seeded = (seed) => () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;

test("surprise never picks a seen film", () => {
  const films = Array.from({ length: 12 }, (_, i) => film({ rating: 5 + i / 4, votes: 100 * (i + 1) }));
  const seen = new Set(films.slice(6).map((x) => x.id));
  const rand = seeded(42);
  for (let i = 0; i < 200; i++) assert.ok(!seen.has(surprise(films, flat, HK, seen, rand).id));
  assert.equal(surprise(films, flat, HK, new Set(films.map((x) => x.id))), null);
});

test("surprise favours high-ranked films", () => {
  const top = film({ rating: 9, votes: 9000 });
  const films = [film({ rating: 5, votes: 10 }), top, film({ rating: 6, votes: 50 })];
  assert.equal(surprise(films, flat, HK, new Set(), () => 0).id, top.id);
});

test("moreLike prefers the same director, then cast", () => {
  const base = film({ director: { id: 1, name: "Andrew Lau" }, cast: [{ id: 10, name: "Tony Leung" }], genres: ["Crime"] });
  const sameDirector = film({ director: { id: 1, name: "Andrew Lau" }, cast: [], genres: ["Comedy"], year: 1985, votes: 5 });
  const sameActor = film({ director: { id: 2, name: "Other" }, cast: [{ id: 10, name: "Tony Leung" }], genres: ["Comedy"], year: 1985, votes: 9000 });
  const sameShelf = film({ director: { id: 3, name: "Other" }, cast: [], genres: ["Crime"] });
  const unrelated = film({ places: ["KR"], director: { id: 4, name: "Other" }, cast: [], genres: ["Horror"], year: 1975 });
  const out = moreLike(base, [base, unrelated, sameShelf, sameActor, sameDirector]);
  assert.deepEqual(out.map((x) => x.id), [sameDirector.id, sameActor.id, sameShelf.id]);
});

test("search folds case and accents, keeps CJK", () => {
  const amelie = film({ title: "Amélie", original: "Le Fabuleux Destin d'Amélie Poulain", places: ["EN"] });
  const ia = film({ title: "Infernal Affairs", original: "無間道", cast: [{ id: 5, name: "Tony Leung Chiu-wai" }] });
  const mom = film({ title: "Memories of Murder", original: "살인의 추억", places: ["KR"] });
  const films = [amelie, ia, mom];
  assert.equal(fold("  Amélie "), "amelie");
  assert.deepEqual(search(films, "amelie").map((x) => x.id), [amelie.id]);
  assert.deepEqual(search(films, "  INFERNAL ").map((x) => x.id), [ia.id]);
  assert.deepEqual(search(films, "無間").map((x) => x.id), [ia.id]);
  assert.deepEqual(search(films, "살인").map((x) => x.id), [mom.id]);
  assert.deepEqual(search(films, "tony leung").map((x) => x.id), [ia.id]);
  assert.deepEqual(search(films, ""), []);
  assert.deepEqual(search(films, "   "), []);
});

test("search puts title matches before people matches, then more votes", () => {
  const byCast = film({ title: "Hard Boiled", cast: [{ id: 1, name: "Chow Yun-fat" }], votes: 9000 });
  const byTitle = film({ title: "Chow's Kitchen", votes: 10 });
  assert.deepEqual(search([byCast, byTitle], "chow").map((x) => x.id), [byTitle.id, byCast.id]);
});

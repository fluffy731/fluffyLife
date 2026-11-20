import { test } from "node:test";
import assert from "node:assert/strict";
import { peopleIndex, searchPeople, filmography, matchedBy, moreLike, feedChange } from "../films/model.js";

const film = (id, o = {}) => ({ id, title: `Film ${id}`, original: `Film ${id}`, year: 2000, era: "2000s", places: ["HK"], country: "HK", lang: "cn",
  genres: ["Drama"], runtime: 100, rating: 7, votes: 1000, pop: 1, director: null, cast: [], plot: "", poster: null, trailer: null, ...o });
const TONY = { id: 11, name: "Tony Leung Chiu-wai" }, TONYK = { id: 12, name: "Tony Leung Ka-fai" }, MAGGIE = { id: 13, name: "Maggie Cheung" };
const WONG = { id: 21, name: "Wong Kar-wai" }, CLINT = { id: 22, name: "Clint Eastwood" };
const films = [
  film(1, { title: "In the Mood for Love", director: WONG, cast: [TONY, MAGGIE], votes: 5000 }),
  film(2, { title: "Hero", year: 2002, director: { id: 23, name: "Zhang Yimou" }, cast: [TONY, MAGGIE], votes: 4000 }),
  film(3, { title: "Lust, Caution", year: 2007, director: { id: 24, name: "Ang Lee" }, cast: [TONY], votes: 3000 }),
  film(4, { title: "The Lover", year: 1992, cast: [TONYK], votes: 900 }),
  film(5, { title: "Unforgiven", year: 1992, places: ["EN"], country: "US", lang: "en", director: CLINT, cast: [CLINT], votes: 8000 }),
  film(6, { title: "Chungking Express", year: 1994, director: WONG, cast: [{ id: 14, name: "Faye Wong" }], votes: 2500 }),
];

test("the people index holds every director and actor once, with their films", () => {
  const idx = peopleIndex(films);
  assert.equal(idx.size, 8);
  assert.deepEqual(idx.get(11).cast.map((f) => f.id), [1, 2, 3], "Tony Leung Chiu-wai acted in three");
  assert.deepEqual(idx.get(21).director.map((f) => f.id), [1, 6]);
  assert.deepEqual([idx.get(22).director.length, idx.get(22).cast.length], [1, 1], "Clint Eastwood both directed and acted");
});

test("searchPeople: every typed word must be in the name, in any order, whatever the case or accents", () => {
  const idx = peopleIndex(films);
  assert.deepEqual(searchPeople(idx, "tony leung").map((p) => p.id), [11, 12], "most films first");
  assert.deepEqual(searchPeople(idx, "LEUNG TONY").map((p) => p.id), [11, 12], "any order");
  assert.deepEqual(searchPeople(idx, "chiu").map((p) => p.id), [11], "part of a hyphenated name");
  assert.deepEqual(searchPeople(idx, "wong").map((p) => p.id), [21, 14], "Wong Kar-wai (2 films) before Faye Wong (1)");
  assert.deepEqual(searchPeople(idx, "zzz"), []);
  assert.deepEqual(searchPeople(idx, "  "), []);
  assert.equal(searchPeople(idx, "o", 3).length, 3, "limited");
});

test("searchPeople says what each person is: director, actor, or both", () => {
  const idx = peopleIndex(films);
  const by = Object.fromEntries(searchPeople(idx, "a", 20).map((p) => [p.id, p]));
  assert.equal(by[21].role, "Director");
  assert.equal(by[11].role, "Actor");
  assert.equal(by[22].role, "Director · Actor");
  assert.equal(by[11].count, 3);
  assert.equal(by[22].count, 1, "one film, both roles: counted once");
});

test("a name that starts with what you typed comes before one that only contains it", () => {
  const idx = peopleIndex([film(1, { cast: [{ id: 1, name: "Anthony Wong" }, { id: 2, name: "Wong Jing" }] }), film(2, { cast: [{ id: 1, name: "Anthony Wong" }] })]);
  assert.deepEqual(searchPeople(idx, "wong").map((p) => p.id), [2, 1], "Wong Jing starts with Wong, despite fewer films");
});

test("filmography: the person's films, best known first, with the roles they played", () => {
  const idx = peopleIndex(films);
  const f = filmography(idx, 11);
  assert.equal(f.name, "Tony Leung Chiu-wai");
  assert.equal(f.role, "Actor");
  assert.deepEqual(f.films.map((x) => x.id), [1, 2, 3]);
  assert.deepEqual(filmography(idx, 22).films.map((x) => x.id), [5], "no repeats for both roles");
  assert.equal(filmography(idx, 9999), null);
});

test("matchedBy says why a film came up: its director, or an actor, but not for a title match", () => {
  const f = films[0];
  assert.deepEqual(matchedBy(f, "wong"), { role: "Directed by", name: "Wong Kar-wai" });
  assert.deepEqual(matchedBy(f, "maggie"), { role: "With", name: "Maggie Cheung" });
  assert.equal(matchedBy(f, "mood"), null, "the title says it");
  assert.equal(matchedBy(f, "zzz"), null);
  assert.deepEqual(matchedBy(f, "tony leung"), { role: "With", name: "Tony Leung Chiu-wai" });
});

test("moreLike still goes by the three lead actors, so the longer cast list doesn't make it noisy", () => {
  const lead = [1, 2, 3].map((i) => ({ id: i, name: `Lead ${i}` }));
  const extra = { id: 99, name: "Fifth Billed" };
  const a = film(1, { cast: [...lead, { id: 98, name: "Fourth" }, extra] });
  const sharesFifth = film(2, { cast: [{ id: 50, name: "X" }, { id: 51, name: "Y" }, { id: 52, name: "Z" }, { id: 53, name: "W" }, extra], genres: ["Horror"], era: "1970s", places: ["KR"] });
  const sharesLead = film(3, { cast: [lead[0]], genres: ["Horror"], era: "1970s", places: ["KR"] });
  assert.deepEqual(moreLike(a, [a, sharesFifth, sharesLead]).map((f) => f.id), [3]);
});

test("feedChange tells a refresh whether anything new came", () => {
  const old = { built: "2026-11-15T03:00:00.000Z", films: [{}, {}] };
  assert.equal(feedChange(old, { built: "2026-11-22T03:00:00.000Z", films: [{}, {}, {}] }), "updated");
  assert.equal(feedChange(old, { built: "2026-11-15T03:00:00.000Z", films: [{}, {}] }), "same");
  assert.equal(feedChange(old, null), "failed", "no new feed: keep the old one");
  assert.equal(feedChange(null, old), "updated", "first load");
  assert.equal(feedChange(null, null), "failed");
});

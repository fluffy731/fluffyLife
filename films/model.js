// Films: the pure logic shared by the weekly build (scripts/build-films.mjs) and the phone (films/films.js).
// Places, eras and genres; the place rule; each place's statistics and the weighted rating. No DOM, no imports.

export const PLACES = [
  { id: "HK", name: "Hong Kong", local: "香港", lang: "zh-Hant" },
  { id: "CN", name: "Chinese", local: "華語", lang: "zh-Hant" },
  { id: "KR", name: "Korean", local: "한국", lang: "ko" },
  { id: "EN", name: "English", local: "", lang: "en" },
];

export const ERAS = [
  { id: "classics", name: "Classics", from: 0, to: 1969 },
  { id: "1970s", name: "1970s", from: 1970, to: 1979 },
  { id: "1980s", name: "1980s", from: 1980, to: 1989 },
  { id: "1990s", name: "1990s", from: 1990, to: 1999 },
  { id: "2000s", name: "2000s", from: 2000, to: 2009 },
  { id: "2010s", name: "2010s", from: 2010, to: 2019 },
  { id: "2020s", name: "2020s", from: 2020, to: 2029 },
];

// A place's well-known period, shown as an interchange on the era line.
export const NAMED_ERAS = {
  HK: { "1980s": "Golden age", "1990s": "Golden age" },
  CN: { "1980s": "Fifth Generation · Taiwan New Cinema", "1990s": "Fifth Generation" },
  KR: { "2000s": "New Wave" },
};

// TMDB's genres without TV Movie, plus Martial arts (from TMDB's keywords; TMDB has no such genre).
export const GENRES = ["Action", "Adventure", "Animation", "Comedy", "Crime", "Documentary", "Drama", "Family", "Fantasy",
  "History", "Horror", "Music", "Mystery", "Romance", "Science Fiction", "Thriller", "War", "Western", "Martial arts"];

const ENGLISH_ORIGINS = new Set(["US", "GB", "CA", "AU", "NZ", "IE"]);

// The places a film belongs to, from TMDB's origin countries and original language (Cantonese is "cn" there).
export function placesOf(origins = [], lang = "") {
  const has = (c) => origins.includes(c);
  const out = [];
  if (has("HK")) out.push("HK");
  if ((has("CN") || has("TW")) && (lang === "zh" || lang === "cn")) out.push("CN");
  if (has("KR")) out.push("KR");
  if (lang === "en" && origins.some((c) => ENGLISH_ORIGINS.has(c))) out.push("EN");
  return out;
}

export function eraOf(year) {
  if (!Number.isFinite(year)) return null;
  return ERAS.find((e) => year >= e.from && year <= e.to)?.id ?? null;
}

const median = (xs) => {
  const s = [...xs].sort((a, b) => a - b), n = s.length;
  if (!n) return 0;
  return n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2;
};
export { median };

// Each place's mean rating (C) and median vote count (m), for the weighted rating.
export function placeStats(films) {
  const by = {};
  for (const f of films) for (const p of f.places) (by[p] ||= []).push(f);
  const out = {};
  for (const [p, fs] of Object.entries(by)) {
    out[p] = { mean: fs.reduce((t, f) => t + f.rating, 0) / fs.length, m: median(fs.map((f) => f.votes)) };
  }
  return out;
}

// WR = v/(v+m)·R + m/(v+m)·C: a few votes can't lift a film past one many people rated.
export function weightedRating(film, { mean, m }) {
  const v = film.votes || 0;
  if (v + m === 0) return mean;
  return (v / (v + m)) * film.rating + (m / (v + m)) * mean;
}

// ---------- shelves ----------
// A shelf is place × era × genre ("all" for any). Every list is ranked within a place; under All places the
// places' own lists are interleaved, so English films never bury the rest.

const by = (key) => (a, b) => key(b) - key(a) || b.votes - a.votes || a.id - b.id;

export function inShelf(film, { place, era, genre }) {
  return (place === "all" || film.places.includes(place))
    && (era === "all" || film.era === era)
    && (genre === "all" || film.genres.includes(genre));
}

export function interleave(lists) {
  const out = [], seen = new Set(), longest = Math.max(0, ...lists.map((l) => l.length));
  for (let i = 0; i < longest; i++) {
    for (const l of lists) if (i < l.length && !seen.has(l[i].id)) { seen.add(l[i].id); out.push(l[i]); }
  }
  return out;
}

// One place's lists for a shelf. Crowd-pleasers: the shelf's top third by votes, rated below the shelf's median.
function placeLists(films, stat, f, place) {
  const shelf = films.filter((x) => inShelf(x, { ...f, place }));
  const wr = new Map(shelf.map((x) => [x.id, weightedRating(x, stat)]));
  const rated = [...shelf].sort(by((x) => wr.get(x.id)));
  const popular = [...shelf].sort(by((x) => x.votes));
  const med = median([...wr.values()]);
  const crowd = popular.slice(0, Math.ceil(popular.length / 3)).filter((x) => wr.get(x.id) < med);
  const now = f.era === "all" ? [...shelf].sort(by((x) => x.pop || 0)).slice(0, 20) : [];
  return { rated, popular, crowd: crowd.length >= 4 ? crowd : [], now };
}

export function shelfLists(films, stats, f) {
  const places = (f.place === "all" ? PLACES.map((p) => p.id) : [f.place]).filter((p) => stats[p]);
  const per = places.map((p) => placeLists(films, stats[p], f, p));
  const join = (k) => interleave(per.map((l) => l[k]));
  return { rated: join("rated"), popular: join("popular"), crowd: join("crowd"), now: join("now") };
}

// 1-based ranks within each of a film's places, over the whole place: "#1 most popular in Hong Kong".
export function rankMap(films, stats) {
  const ranks = new Map();
  for (const p of Object.keys(stats)) {
    const { rated, popular } = placeLists(films, stats[p], { place: p, era: "all", genre: "all" }, p);
    rated.forEach((x, i) => { const r = ranks.get(x.id) || {}; r[p] = { rated: i + 1, popular: 0 }; ranks.set(x.id, r); });
    popular.forEach((x, i) => { ranks.get(x.id)[p].popular = i + 1; });
  }
  return ranks;
}

// Genre chips for the shelf (whatever genre is chosen): only genres with at least 4 films, biggest first.
export function genreChips(films, f) {
  const n = {};
  for (const x of films) if (inShelf(x, { ...f, genre: "all" })) for (const g of x.genres) n[g] = (n[g] || 0) + 1;
  return Object.entries(n).filter(([, c]) => c >= 4).map(([genre, count]) => ({ genre, count }))
    .sort((a, b) => b.count - a.count || GENRES.indexOf(a.genre) - GENRES.indexOf(b.genre));
}

// The eras that have films for this place and genre: the era line's live stations.
export function erasWithFilms(films, f) {
  return new Set(films.filter((x) => inShelf(x, { ...f, era: "all" })).map((x) => x.era));
}

// ---------- Surprise me, More like this, search ----------

// One unseen film from the shelf, weighted towards films high on either list (rand is injectable for tests).
export function surprise(films, stats, f, seen, rand = Math.random) {
  const { rated, popular } = shelfLists(films, stats, f);
  const pos = (list) => new Map(list.map((x, i) => [x.id, i]));
  const r = pos(rated), p = pos(popular), worst = Math.max(rated.length, popular.length);
  const pool = films.filter((x) => inShelf(x, f) && !seen.has(x.id))
    .map((x) => ({ x, w: 1 / Math.sqrt(1 + Math.min(r.get(x.id) ?? worst, p.get(x.id) ?? worst)) }))
    .sort((a, b) => b.w - a.w || a.x.id - b.x.id);
  if (!pool.length) return null;
  let pick = rand() * pool.reduce((t, c) => t + c.w, 0);
  for (const c of pool) if ((pick -= c.w) < 0) return c.x;
  return pool[pool.length - 1].x;
}

// Films that share the director (+3), each lead actor (+2), or place, genre and era together (+1).
export function moreLike(film, films, n = 10) {
  const cast = new Set(film.cast.map((c) => c.id));
  const score = (x) => (film.director && x.director?.id === film.director.id ? 3 : 0)
    + 2 * x.cast.filter((c) => cast.has(c.id)).length
    + (x.era === film.era && x.places.some((p) => film.places.includes(p)) && x.genres.some((g) => film.genres.includes(g)) ? 1 : 0);
  return films.filter((x) => x.id !== film.id).map((x) => ({ x, s: score(x) })).filter((c) => c.s > 0)
    .sort((a, b) => b.s - a.s || b.x.votes - a.x.votes || a.x.id - b.x.id).slice(0, n).map((c) => c.x);
}

// Case and accents folded away for matching (Amélie → amelie). Chinese and Hangul still match as typed.
export const fold = (s) => (s || "").normalize("NFKD").replace(/\p{M}/gu, "").toLowerCase().trim();

export function search(films, q, limit = 50) {
  const k = fold(q);
  if (!k) return [];
  const hits = [];
  for (const x of films) {
    const titles = [fold(x.title), fold(x.original)];
    const people = [x.director?.name, ...x.cast.map((c) => c.name)].map(fold);
    if (titles.some((t) => t.startsWith(k))) hits.push({ x, rank: 0 });
    else if (titles.some((t) => t.includes(k))) hits.push({ x, rank: 1 });
    else if (people.some((t) => t.includes(k))) hits.push({ x, rank: 2 });
  }
  return hits.sort((a, b) => a.rank - b.rank || b.x.votes - a.x.votes || a.x.id - b.x.id).slice(0, limit).map((h) => h.x);
}

// ---------- Browse: each film once ----------
// The rows Browse shows, in display order: Best rated, Most popular, Crowd-pleasers, Popular right now, then the
// biggest genres (when no genre is chosen). A film shows in one row only. Rows claim films in this order: Best rated,
// Crowd-pleasers (which, by definition, are also among the most rated), Most popular, Popular right now, genres. Only
// the films a row shows (its first `perRow`) count as shown; the full lists behind All stay complete.
export function browseRows(films, stats, f, { perRow = 20, genreRows = 6 } = {}) {
  const lists = shelfLists(films, stats, f);
  const rows = [{ key: "rated", list: lists.rated }, { key: "popular", list: lists.popular }, { key: "crowd", list: lists.crowd }, { key: "now", list: lists.now }];
  if (f.genre === "all") {
    for (const c of genreChips(films, f).slice(0, genreRows)) rows.push({ key: `genre:${c.genre}`, list: shelfLists(films, stats, { ...f, genre: c.genre }).rated });
  }
  const claim = ["rated", "crowd", "popular", "now"];
  const order = [...claim.map((k) => rows.find((r) => r.key === k)), ...rows.filter((r) => r.key.startsWith("genre:"))];
  const shown = new Set();
  for (const r of order) {
    r.list = r.list.filter((x) => !shown.has(x.id)).slice(0, perRow);
    for (const x of r.list) shown.add(x.id);
  }
  return rows.filter((r) => r.list.length);
}

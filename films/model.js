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

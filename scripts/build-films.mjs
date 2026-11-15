// Builds films/feed.json for the Films app: for each place (Hong Kong, Chinese, Korean, English) and decade, the
// best-rated and most-rated films on TMDB, plus each place's popular-right-now, with each film's details.
// Runs on GitHub Actions with the hourly deploy, but rebuilds only weekly or when the rules change; the phone only
// downloads the finished JSON. TMDB terms: rebuilt weekly, details cached at most 30 days, no plots in the log.
//   node scripts/build-films.mjs           rebuild unless the feed is under 7 days old and the rules are unchanged
//   node scripts/build-films.mjs --force   rebuild now
//   node scripts/build-films.mjs --probe   rebuild now into the cache folder and print the summary (publishes nothing)
import { PLACES, ERAS, placesOf, eraOf, placeStats } from "../films/model.js";

export const FEED_VERSION = 1;
// TMDB's movie genre ids (TV Movie, 10770, is left out of the catalogue).
export const GENRE_IDS = { 28: "Action", 12: "Adventure", 16: "Animation", 35: "Comedy", 80: "Crime", 99: "Documentary", 18: "Drama",
  10751: "Family", 14: "Fantasy", 36: "History", 27: "Horror", 10402: "Music", 9648: "Mystery", 10749: "Romance",
  878: "Science Fiction", 53: "Thriller", 10752: "War", 37: "Western" };
// Fewest votes a film needs to enter a place's best-rated list, and any list at all.
export const MIN_VOTES = { HK: 20, CN: 20, KR: 20, EN: 300 };
export const VOTED_FLOOR = 10;
const PAGES = 5;            // 5 pages of 20: up to 100 films per sort per cell
const FRESH_DAYS = 7;
const MARTIAL = /^(martial arts|wuxia|kung fu)$/i;

const PLACE_FILTER = {
  HK: { with_origin_country: "HK" },
  CN: { with_origin_country: "CN|TW", with_original_language: "zh|cn" },
  KR: { with_origin_country: "KR" },
  EN: { with_original_language: "en", with_origin_country: "US|GB|CA|AU|NZ|IE" },
};

// A read access token (a JWT, "eyJ…") goes in the header; a short API key goes in the query.
export const auth = (key) => (key.startsWith("eyJ") ? { headers: { Authorization: `Bearer ${key}` }, params: {} } : { headers: {}, params: { api_key: key } });

const common = (place) => ({ include_adult: false, without_genres: 10770, ...PLACE_FILTER[place] });

export function cellQueries(place, eraId, today) {
  const era = ERAS.find((e) => e.id === eraId);
  const lte = era.to >= Number(today.slice(0, 4)) ? today : `${era.to}-12-31`;
  const dates = { ...(era.from > 0 ? { "primary_release_date.gte": `${era.from}-01-01` } : {}), "primary_release_date.lte": lte };
  const sorts = [
    { sort_by: "vote_average.desc", "vote_count.gte": MIN_VOTES[place] },
    { sort_by: "vote_count.desc", "vote_count.gte": VOTED_FLOOR },
  ];
  return sorts.flatMap((s) => Array.from({ length: PAGES }, (_, i) => ({ path: "/discover/movie", params: { ...common(place), ...dates, ...s, page: i + 1 } })));
}

export const nowQuery = (place, today) => ({
  path: "/discover/movie",
  params: { ...common(place), sort_by: "popularity.desc", "primary_release_date.lte": today, "vote_count.gte": VOTED_FLOOR, page: 1 },
});

export function trimPlot(s, max = 300) {
  const t = (s || "").replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  const cut = t.slice(0, max), sp = cut.lastIndexOf(" ");
  return (sp > max * 0.6 ? cut.slice(0, sp) : cut).replace(/[\s,;:.–-]+$/, "") + "…";
}

const r1 = (x) => (Number.isFinite(x) ? Math.round(x * 10) / 10 : 0);

// One TMDB movie-details record (with credits, keywords and videos appended) as a catalogue Film, or null.
export function filmFrom(d, foundIn) {
  if (!d || d.adult || d.softcore) return null;
  const year = Number((d.release_date || "").slice(0, 4));
  const era = eraOf(year || NaN);
  if (!era) return null;
  const origins = d.origin_country?.length ? d.origin_country : (d.production_countries || []).map((c) => c.iso_3166_1);
  const found = placesOf(origins, d.original_language);
  const genres = (d.genres || []).map((x) => x.name).filter((n) => n && n !== "TV Movie");
  if ((d.keywords?.keywords || []).some((k) => MARTIAL.test(k.name)) && !genres.includes("Martial arts")) genres.push("Martial arts");
  const dir = (d.credits?.crew || []).find((c) => c.job === "Director");
  const cast = [...(d.credits?.cast || [])].sort((a, b) => a.order - b.order).slice(0, 3).map((c) => ({ id: c.id, name: c.name }));
  const trailers = (d.videos?.results || []).filter((v) => v.site === "YouTube" && v.type === "Trailer");
  const trailer = (trailers.find((v) => v.official) || trailers[0])?.key || null;
  return {
    id: d.id, title: d.title || d.original_title, original: d.original_title || d.title, year, era,
    places: found.length ? found : [...foundIn], country: origins[0] || null, lang: d.original_language || "",
    genres, runtime: d.runtime || null, rating: r1(d.vote_average), votes: d.vote_count || 0, pop: r1(d.popularity),
    director: dir ? { id: dir.id, name: dir.name } : null, cast, plot: trimPlot(d.overview),
    poster: d.poster_path || null, trailer,
  };
}

// The feed: films deduplicated by id (places merged), each place's statistics, sorted by id.
export function assemble(films, built, rules, sources) {
  const byId = new Map();
  for (const f of films) {
    const had = byId.get(f.id);
    if (!had) { byId.set(f.id, { ...f, places: [...f.places] }); continue; }
    for (const p of f.places) if (!had.places.includes(p)) had.places.push(p);
    had.places.sort((a, b) => PLACES.findIndex((x) => x.id === a) - PLACES.findIndex((x) => x.id === b));
  }
  const list = [...byId.values()].sort((a, b) => a.id - b.id);
  return { version: FEED_VERSION, built, rules, stats: placeStats(list), films: list, sources };
}

export const isThin = (feed, old, floor = 500) => feed.films.length < (old?.films?.length ? old.films.length / 2 : floor);

export const needsBuild = (old, rules, now) => !old || old.rules !== rules || now - new Date(old.built) > FRESH_DAYS * 864e5;

// What the log shows: counts, coverage, one sample film's id, title and year, size and calls. Never plots.
export function summary(feed) {
  const fs = feed.films, n = fs.length || 1;
  const pct = (k) => Math.round((100 * fs.filter((f) => (Array.isArray(f[k]) ? f[k].length : f[k])).length) / n);
  const lines = [`Films feed: ${fs.length} films, size ${Math.round(JSON.stringify(feed).length / 1024)} KB`];
  for (const p of PLACES) {
    const mine = fs.filter((f) => f.places.includes(p.id));
    lines.push(`${p.id} ${mine.length}: ` + ERAS.map((e) => `${e.id} ${mine.filter((f) => f.era === e.id).length}`).join(" · "));
  }
  lines.push(`coverage: ${["poster", "plot", "director", "cast", "runtime", "trailer"].map((k) => `${k} ${pct(k)}%`).join(" · ")}`);
  const s = [...fs].sort((a, b) => b.votes - a.votes)[0];
  if (s) lines.push(`sample ${s.id} ${s.title} (${s.year})`);
  lines.push(`calls ${feed.sources?.calls ?? 0}, failed ${feed.sources?.failed ?? 0}`);
  return lines.join("\n");
}

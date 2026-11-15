// Builds films/feed.json for the Films app: for each place (Hong Kong, Chinese, Korean, English) and decade, the
// best-rated and most-rated films on TMDB, plus each place's popular-right-now, with each film's details.
// Runs on GitHub Actions with the hourly deploy, but rebuilds only weekly or when the rules change; the phone only
// downloads the finished JSON. TMDB terms: rebuilt weekly, details cached at most 30 days, no plots in the log.
//   node scripts/build-films.mjs           rebuild unless the feed is under 7 days old and the rules are unchanged
//   node scripts/build-films.mjs --force   rebuild now
//   node scripts/build-films.mjs --probe   rebuild now into the cache folder and print the summary (publishes nothing)
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { createHash } from "node:crypto";
import { homedir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
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

// ---------- the runner ----------

const API = "https://api.themoviedb.org/3";
const CACHE_DAYS = 30;       // TMDB's terms allow up to six months; a month keeps titles and ratings current
const CONCURRENCY = 8;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const readJSON = (f) => { try { return JSON.parse(readFileSync(f, "utf8")); } catch { return null; } };

// GET one TMDB path; retries 429 and 5xx up to 3 times (Retry-After, else 1, 2, 4 s). Returns JSON or null.
async function tmdb(fetch, key, path, params, tally, backoff = 1000) {
  const { headers, params: keyParams } = auth(key);
  const u = new URL(API + path);
  for (const [k, v] of Object.entries({ ...params, ...keyParams })) u.searchParams.set(k, String(v));
  for (let attempt = 0; attempt < 4; attempt++) {
    tally.calls++;
    let res;
    try { res = await fetch(u, { headers: { accept: "application/json", ...headers } }); } catch { res = null; }
    if (res?.ok) return res.json();
    if (res && res.status !== 429 && res.status < 500) break;
    if (attempt < 3) {
      const after = res?.headers?.get?.("retry-after");
      await sleep(after != null && Number.isFinite(+after) ? +after * 1000 : backoff * 2 ** attempt);
    }
  }
  tally.failed++;
  return null;
}

async function pool(items, n, fn) {
  let i = 0;
  await Promise.all(Array.from({ length: Math.min(n, items.length) }, async () => { while (i < items.length) await fn(items[i++]); }));
}

// TMDB's logo for the attribution, when its logos page gives one to a script (it refused the probe). Never throws.
export async function fetchLogo(fetch, dest = "films/tmdb.svg") {
  try {
    const page = await fetch("https://www.themoviedb.org/about/logos-attribution", { headers: { "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15", accept: "text/html" } });
    if (!page.ok) return false;
    const url = (await page.text()).match(/https:\/\/www\.themoviedb\.org\/assets\/[^"' )]*logos[^"' )]*\.svg/)?.[0];
    if (!url) return false;
    const svg = await fetch(url);
    if (!svg.ok) return false;
    const body = await svg.text();
    if (!body.includes("<svg")) return false;
    writeFileSync(dest, body);
    return true;
  } catch { return false; }
}

export async function run({ key, fetch, now = new Date(), out = "films/feed.json", cacheDir = join(homedir(), ".films-cache"),
  force = false, probe = false, thinFloor = 500, rules = "dev", backoff = 1000, log = console.log } = {}) {
  if (!key) { log("TMDB_API_KEY not set: skipping films"); return { wrote: false, feed: null }; }
  const old = readJSON(out);
  if (!force && !probe && !needsBuild(old, rules, now)) { log(`Films feed is fresh (built ${old.built}): not rebuilt`); return { wrote: false, feed: old }; }
  const today = now.toISOString().slice(0, 10);
  const tally = { calls: 0, failed: 0 };

  // 1. Which films: every place × decade, both sorts, and each place's popular-right-now.
  const foundIn = new Map();
  const queries = PLACES.flatMap((p) => [...ERAS.flatMap((e) => cellQueries(p.id, e.id, today)), nowQuery(p.id, today)].map((q) => ({ ...q, place: p.id })));
  await pool(queries, CONCURRENCY, async (q) => {
    const page = await tmdb(fetch, key, q.path, q.params, tally, backoff);
    for (const r of page?.results || []) {
      const s = foundIn.get(r.id) || new Set();
      s.add(q.place);
      foundIn.set(r.id, s);
    }
  });

  // 2. Each film's details, from the cache when under 30 days old.
  mkdirSync(cacheDir, { recursive: true });
  const cacheFile = join(cacheDir, "details.json");
  const cache = readJSON(cacheFile) || {};
  const fresh = (e) => e && now - new Date(e.at) < CACHE_DAYS * 864e5;
  const stale = [...foundIn.keys()].filter((id) => !fresh(cache[id]));
  await pool(stale, CONCURRENCY, async (id) => {
    const d = await tmdb(fetch, key, `/movie/${id}`, { append_to_response: "credits,keywords,videos" }, tally, backoff);
    if (d) cache[id] = { at: now.toISOString(), d };
  });
  for (const id of Object.keys(cache)) if (!fresh(cache[id])) delete cache[id];
  writeFileSync(cacheFile, JSON.stringify(cache));

  // 3. The feed.
  const films = [...foundIn].map(([id, places]) => filmFrom(cache[id]?.d, [...places])).filter(Boolean);
  const feed = assemble(films, now.toISOString(), rules, tally);
  log(summary(feed));
  if (isThin(feed, old, thinFloor)) {
    log(`::warning::Films feed is thin (${feed.films.length} films${old ? ` against ${old.films.length}` : ""}): the last feed is kept`);
    return { wrote: false, feed };
  }
  const dest = probe ? join(cacheDir, "probe-feed.json") : out;
  mkdirSync(dirname(dest), { recursive: true });
  writeFileSync(dest, JSON.stringify(feed));
  if (!probe) log(`TMDB logo: ${(await fetchLogo(fetch, join(dirname(out), "tmdb.svg"))) ? "saved" : "not available (the notice shows as text)"}`);
  return { wrote: true, feed };
}

// A fingerprint of the rules: a feed built by older rules is rebuilt, however fresh.
const fingerprint = () => createHash("sha256")
  .update(["../films/model.js", "./build-films.mjs"].map((f) => readFileSync(new URL(f, import.meta.url))).join("\n"))
  .digest("hex").slice(0, 12);

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const args = process.argv.slice(2);
  await run({ key: process.env.TMDB_API_KEY || "", fetch: globalThis.fetch, force: args.includes("--force"), probe: args.includes("--probe"), rules: fingerprint() });
}

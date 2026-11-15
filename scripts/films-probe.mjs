// Temporary: recon of TMDB's real responses for Films, run from GitHub Actions (this session can't reach TMDB).
// Prints shapes, counts and a few titles only: never plots, never the key. Removed before merge.
const KEY = process.env.TMDB_API_KEY || "";
if (!KEY) { console.log("TMDB_API_KEY not set"); process.exit(0); }
const bearer = KEY.startsWith("eyJ");
console.log("auth:", bearer ? "bearer token" : "api_key parameter");
const API = "https://api.themoviedb.org/3";
let calls = 0;
async function get(path, params = {}) {
  const u = new URL(API + path);
  for (const [k, v] of Object.entries(params)) u.searchParams.set(k, String(v));
  if (!bearer) u.searchParams.set("api_key", KEY);
  calls++;
  const r = await fetch(u, { headers: bearer ? { Authorization: `Bearer ${KEY}`, accept: "application/json" } : { accept: "application/json" } });
  if (calls === 1) console.log("rate headers:", [...r.headers].filter(([k]) => /rate|retry/i.test(k)).map(([k, v]) => `${k}=${v}`).join(" ") || "none");
  if (!r.ok) return { _status: r.status };
  return r.json();
}
const PLACES = {
  HK: { with_origin_country: "HK" },
  CN: { with_origin_country: "CN|TW", with_original_language: "zh|cn" },
  KR: { with_origin_country: "KR" },
  EN: { with_original_language: "en", with_origin_country: "US|GB|CA|AU|NZ|IE" },
};
const MIN = { HK: 20, CN: 20, KR: 30, EN: 300 };
const ERAS = [["classics", null, 1969], ["1970s", 1970, 1979], ["1980s", 1980, 1989], ["1990s", 1990, 1999], ["2000s", 2000, 2009], ["2010s", 2010, 2019], ["2020s", 2020, 2029]];
const base = { include_adult: false, without_genres: 10770 };
const dates = (from, to) => ({ ...(from ? { "primary_release_date.gte": `${from}-01-01` } : {}), "primary_release_date.lte": `${to}-12-31` });

const genres = await get("/genre/movie/list", { language: "en" });
console.log("genres:", (genres.genres || []).map((g) => `${g.id}:${g.name}`).join(", "));

const firsts = {};
for (const [p, f] of Object.entries(PLACES)) {
  const d = await get("/discover/movie", { ...base, ...f, sort_by: "vote_count.desc", page: 1 });
  if (d._status) { console.log(p, "discover failed", d._status); continue; }
  firsts[p] = d.results?.[0]?.id;
  console.log(`\n${p}: total_results ${d.total_results}, total_pages ${d.total_pages}`);
  console.log(`${p} result keys:`, Object.keys(d.results?.[0] || {}).join(","));
  for (const x of (d.results || []).slice(0, 4)) console.log(`  ${x.id} ${x.original_title} / ${x.title} (${(x.release_date || "").slice(0, 4)}) lang=${x.original_language} votes=${x.vote_count} avg=${x.vote_average} pop=${x.popularity} origin=${JSON.stringify(x.origin_country ?? null)}`);
}

console.log("\nCells: rated total (min votes) | voted total | votes at #1 and #100 | avg at rated #1 and #100");
for (const [p, f] of Object.entries(PLACES)) {
  for (const [era, from, to] of ERAS) {
    const q = { ...base, ...f, ...dates(from, to) };
    const rated = await get("/discover/movie", { ...q, sort_by: "vote_average.desc", "vote_count.gte": MIN[p], page: 1 });
    const rated5 = await get("/discover/movie", { ...q, sort_by: "vote_average.desc", "vote_count.gte": MIN[p], page: 5 });
    const voted = await get("/discover/movie", { ...q, sort_by: "vote_count.desc", page: 1 });
    const voted5 = await get("/discover/movie", { ...q, sort_by: "vote_count.desc", page: 5 });
    const last = (d) => d.results?.[d.results.length - 1];
    console.log(`${p} ${era.padEnd(8)} rated ${String(rated.total_results ?? rated._status).padStart(5)} | voted ${String(voted.total_results ?? voted._status).padStart(6)} | votes ${voted.results?.[0]?.vote_count ?? "-"} … ${last(voted5)?.vote_count ?? "-"} | avg ${rated.results?.[0]?.vote_average ?? "-"} (${rated.results?.[0]?.vote_count ?? "-"} v) … ${last(rated5)?.vote_average ?? "-"}`);
  }
}

for (const p of ["HK", "CN", "KR"]) {
  const id = firsts[p];
  if (!id) continue;
  const d = await get(`/movie/${id}`, { append_to_response: "credits,keywords,videos" });
  if (d._status) { console.log(p, "details failed", d._status); continue; }
  console.log(`\nDetails ${p} ${id} ${d.original_title} / ${d.title} (${(d.release_date || "").slice(0, 4)})`);
  console.log("  keys:", Object.keys(d).join(","));
  console.log("  origin_country:", JSON.stringify(d.origin_country), "production_countries:", JSON.stringify((d.production_countries || []).map((c) => c.iso_3166_1)), "lang:", d.original_language);
  console.log("  genres:", JSON.stringify(d.genres), "runtime:", d.runtime, "overview length:", (d.overview || "").length, "poster:", d.poster_path ? "yes" : "no");
  console.log("  credits keys:", Object.keys(d.credits || {}).join(","), "cast[0] keys:", Object.keys(d.credits?.cast?.[0] || {}).join(","));
  console.log("  cast top 3:", (d.credits?.cast || []).slice(0, 3).map((c) => `${c.id}:${c.name}#${c.order}`).join(" | "));
  console.log("  directors:", (d.credits?.crew || []).filter((c) => c.job === "Director").map((c) => `${c.id}:${c.name}`).join(" | "));
  console.log("  keywords shape:", Object.keys(d.keywords || {}).join(","), "sample:", (d.keywords?.keywords || []).slice(0, 6).map((k) => k.name).join(", "));
  console.log("  videos:", (d.videos?.results || []).length, "first keys:", Object.keys(d.videos?.results?.[0] || {}).join(","), "trailers:", (d.videos?.results || []).filter((v) => v.site === "YouTube" && v.type === "Trailer").map((v) => `${v.official ? "official" : "unofficial"}`).join(","));
}

const kw = await get("/search/keyword", { query: "wuxia" });
console.log("\nkeyword search wuxia:", JSON.stringify((kw.results || []).slice(0, 3)));
const now = await get("/discover/movie", { ...base, ...PLACES.KR, sort_by: "popularity.desc", "primary_release_date.lte": new Date().toISOString().slice(0, 10), "vote_count.gte": 10, page: 1 });
console.log("KR popular now:", (now.results || []).slice(0, 5).map((x) => `${x.original_title} (${(x.release_date || "").slice(0, 4)}) pop=${x.popularity}`).join(" | "));

try {
  const r = await fetch("https://www.themoviedb.org/about/logos-attribution", { headers: { "user-agent": "Mozilla/5.0 (compatible; fluffyLife-films/1.0)" } });
  const html = await r.text();
  const svgs = [...new Set(html.match(/https:\/\/www\.themoviedb\.org\/assets\/[^"' )]+\.svg/g) || [])];
  const rel = [...new Set(html.match(/\/assets\/[^"' )]+logos?[^"' )]*\.svg/g) || [])];
  console.log("\nlogos page:", r.status, "absolute svgs:", svgs.slice(0, 6).join(" "), "| relative:", rel.slice(0, 6).join(" "));
} catch (e) { console.log("logos page failed:", e.message); }
console.log("\ncalls:", calls);

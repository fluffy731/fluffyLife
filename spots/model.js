// Spots: pure logic (tested in test/spots-model.test.js). No DOM, no network.

// ---------- Places, kinds and distance ----------

export const CBD = { lat: -37.8136, lng: 144.9631 };

// visit: typical minutes spent there; query: what to ask Google; priced: Google gives these a price level.
export const KINDS = [
  { id: "eat", label: "Eat", visit: 60, query: "restaurant", priced: true },
  { id: "drink", label: "Drink", visit: 60, query: "bar", priced: true },
  { id: "coffee", label: "Coffee", visit: 30, query: "cafe", priced: true },
  { id: "sights", label: "Sights", visit: 60, query: "tourist attraction", priced: false },
  { id: "activities", label: "Activities", visit: 90, query: "things to do", priced: false },
  { id: "dessert", label: "Dessert", visit: 30, query: "dessert", priced: true },
  // Outdoors, for good weather. Several searches each; parks and beaches often list no hours, and count as open.
  // day: not offered at night (Late night leaves them out).
  { id: "nature", label: "Nature", visit: 90, query: "park", queries: ["park", "walking trail"], priced: false, alwaysOpen: true, day: true },
  { id: "beach", label: "Beach", visit: 120, query: "beach", queries: ["beach"], priced: false, alwaysOpen: true, day: true },
];
export const kindOf = (id) => KINDS.find((k) => k.id === id) || KINDS[0];

// ---------- Cuisine ----------
// Google names most restaurants' cuisine in their primary type (korean_restaurant). It has no Cantonese type, so a
// Cantonese place is a Chinese one whose name says so, and a Cantonese search asks Google for it by name.
// query: what to ask Google; types: Google's primary types for it.
export const CUISINES = [
  { id: "cantonese", label: "Cantonese", query: "Cantonese restaurant", types: [] },
  { id: "chinese", label: "Chinese", query: "Chinese restaurant", types: ["chinese_restaurant"] },
  { id: "korean", label: "Korean", query: "Korean restaurant", types: ["korean_restaurant", "korean_barbecue_restaurant"] },
  { id: "japanese", label: "Japanese", query: "Japanese restaurant", types: ["japanese_restaurant", "ramen_restaurant", "sushi_restaurant", "izakaya"] },
  { id: "thai", label: "Thai", query: "Thai restaurant", types: ["thai_restaurant"] },
  { id: "vietnamese", label: "Vietnamese", query: "Vietnamese restaurant", types: ["vietnamese_restaurant"] },
  { id: "malaysian", label: "Malaysian", query: "Malaysian restaurant", types: ["malaysian_restaurant", "indonesian_restaurant"] },
  { id: "indian", label: "Indian", query: "Indian restaurant", types: ["indian_restaurant"] },
  { id: "italian", label: "Italian", query: "Italian restaurant", types: ["italian_restaurant", "pizza_restaurant"] },
  { id: "greek", label: "Greek", query: "Greek restaurant", types: ["greek_restaurant"] },
  { id: "mexican", label: "Mexican", query: "Mexican restaurant", types: ["mexican_restaurant"] },
  { id: "middleeast", label: "Middle Eastern", query: "Middle Eastern restaurant", types: ["middle_eastern_restaurant", "lebanese_restaurant", "turkish_restaurant"] },
];
const CANTONESE_NAME = /cantonese|yum cha|dim sum|hong kong|\bhk\b|congee|roast duck|bbq pork|char siu|wonton/i;

export function cuisineOf(p) {
  const type = (p && p.type) || "";
  const c = CUISINES.find((x) => x.types.includes(type));
  if (!c) return null;
  return c.id === "chinese" && CANTONESE_NAME.test(p.name || "") ? "cantonese" : c.id;
}

// What to print on a card: the cuisine when Google's type tells it, else Google's own name for the type.
export function cuisineLabel(p) {
  const id = cuisineOf(p);
  return id ? CUISINES.find((c) => c.id === id).label : (p && p.typeLabel) || "";
}

// cuisines: a Set of ids, empty for any. A place Google couldn't type has no cuisine to contradict, and Google's own
// search for "Korean restaurant" put it there, so it stays. Google has one Chinese type, so Cantonese and Chinese
// searches each keep the other's places.
export function fitsCuisine(p, cuisines) {
  if (!cuisines || !cuisines.size) return true;
  const c = cuisineOf(p);
  if (!c || cuisines.has(c)) return true;
  return (c === "chinese" && cuisines.has("cantonese")) || (c === "cantonese" && cuisines.has("chinese"));
}
// Only Eat has cuisines: a café that Google types as Italian is still a café.
const cuisineOk = (p, cuisines) => !cuisines || !cuisines.size || p.kind !== "eat" || fitsCuisine(p, cuisines);

// Eat asks for each chosen cuisine (in the list's order); every other kind asks as before.
export const queriesOf = (k, cuisines) => {
  const kind = kindOf(k);
  if (kind.id === "eat" && cuisines && cuisines.size) return CUISINES.filter((c) => cuisines.has(c.id)).map((c) => c.query);
  return kind.queries || [kind.query];
};

const rad = (d) => (d * Math.PI) / 180;
export function haversineKm(a, b) {
  const dLat = rad(b.lat - a.lat), dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.min(1, Math.sqrt(h)));
}

// ---------- Travel model (see the spec's speed table) ----------

const ROAD = 1.3, PARK = 5, CITY_KM = 15;
const SPEEDS = { peak: [22, 70], day: [30, 85], night: [50, 95] }; // km/h: first 15 road km, beyond
const WALK = { speed: 4.5, road: 1.25 };
export const MAX_RADIUS_KM = 50; // Google's limit on a search radius

export function speedBand(at) {
  const h = at.getHours() + at.getMinutes() / 60, wd = at.getDay();
  if (h >= 21 || h < 6) return "night";
  if (wd >= 1 && wd <= 5 && ((h >= 7 && h < 9.5) || (h >= 16 && h < 18.5))) return "peak";
  return "day";
}

// km is straight-line distance.
export function travelMinutes(km, { mode = "drive", at = new Date() } = {}) {
  if (mode === "walk") return Math.round(((km * WALK.road) / WALK.speed) * 60);
  const road = km * ROAD, [city, hwy] = SPEEDS[speedBand(at)];
  const cityKm = Math.min(road, CITY_KM), rest = road - cityKm;
  return Math.round((cityKm / city + rest / hwy) * 60 + PARK);
}

// Straight-line km reachable in `minutes`: travelMinutes run backwards, capped at Google's radius limit.
export function reachKm(minutes, { mode = "drive", at = new Date() } = {}) {
  let km;
  if (mode === "walk") km = ((minutes / 60) * WALK.speed) / WALK.road;
  else {
    const m = minutes - PARK, [city, hwy] = SPEEDS[speedBand(at)];
    if (m <= 0) return 0;
    const cityMin = (CITY_KM / city) * 60;
    const road = m <= cityMin ? (m / 60) * city : CITY_KM + ((m - cityMin) / 60) * hwy;
    km = road / ROAD;
  }
  return Math.min(MAX_RADIUS_KM, Math.round(km * 10) / 10);
}

export function fmtMinutes(m) {
  m = Math.max(1, Math.round(m));
  if (m < 60) return `about ${m} min`;
  const h = Math.floor(m / 60), r = m % 60;
  return r ? `about ${h} h ${r} min` : `about ${h} h`;
}

// ---------- Distance ----------
// The steps of the distance slider: fine near, coarse far, up to Google's search limit.
export const DISTANCES = [0.5, 1, 1.5, 2, 3, 4, 5, 7, 10, 15, 20, 30, MAX_RADIUS_KM];

// The slider counts steps. With `any`, one more step past the last distance means no limit (null).
export const kmFromStep = (i, any = false) => (any && i >= DISTANCES.length ? null : DISTANCES[Math.min(DISTANCES.length - 1, Math.max(0, i))]);
export function stepFromKm(km, any = false) {
  if (km == null) return any ? DISTANCES.length : DISTANCES.length - 1;
  let best = 0;
  DISTANCES.forEach((d, i) => { if (Math.abs(d - km) < Math.abs(DISTANCES[best] - km)) best = i; });   // a tie keeps the nearer one
  return best;
}

export const fmtKm = (km) => (km < 1 ? `${Math.round(km * 1000)} m` : `${Number.isInteger(km) ? km : Math.round(km * 10) / 10} km`);

// How long that distance is by car (and on foot when it's short), by the travel model.
export function distanceHint(km, { at = new Date() } = {}) {
  const drive = `${fmtMinutes(travelMinutes(km, { at }))} drive`;
  return km <= 3 ? `${drive} · ${fmtMinutes(travelMinutes(km, { mode: "walk", at }))} walk` : drive;
}

// ---------- Prices ----------

export const PRICE = { FREE: 0, INEXPENSIVE: 1, MODERATE: 2, EXPENSIVE: 3, VERY_EXPENSIVE: 4 };

export function priceLevelOf(v) {
  if (typeof v === "number" && Number.isInteger(v) && v >= 0 && v <= 4) return v;
  if (typeof v !== "string") return null;
  const k = v.trim().toUpperCase().replace(/^PRICE_LEVEL_/, "");
  return k in PRICE ? PRICE[k] : null;
}

export const priceSymbols = (level) => (level == null ? "" : level === 0 ? "Free" : "$".repeat(level));

export function priceRangeLabel(r) {
  if (!r || !Number.isFinite(r.from)) return "";
  const cur = !r.currency || r.currency === "AUD" ? "A$" : `${r.currency} `;
  return Number.isFinite(r.to) ? `${cur}${r.from}–${r.to}` : `${cur}${r.from}+`;
}

// max: highest price level allowed, or null for any. A place with no known price always fits.
export const fitsBudget = (place, max) => max == null || place.price == null || place.price <= max;

// A plain Google Maps link: free, no key. Sample places have no real place id.
export function mapsUrl(p) {
  if (p.mapsUrl) return p.mapsUrl;
  const q = encodeURIComponent([p.name, p.area].filter(Boolean).join(", "));
  return `https://www.google.com/maps/search/?api=1&query=${q}${p.id && !p.sample ? `&query_place_id=${encodeURIComponent(p.id)}` : ""}`;
}

// ---------- Opening hours ----------
// hours = { periods: [{ open: { day, hour, minute }, close: { day, hour, minute } | null }] } as Google gives them,
// day 0 = Sunday, in the place's local time. off = the place's UTC offset in minutes, or null for the phone's own.

const WEEK = 7 * 1440;
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const pt = (p) => (p && Number.isFinite(p.day) ? p.day * 1440 + (p.hour || 0) * 60 + (p.minute || 0) : null);

function minuteOfWeek(at, off) {
  if (off == null) return at.getDay() * 1440 + at.getHours() * 60 + at.getMinutes();
  const d = new Date(at.getTime() + off * 60000);
  return d.getUTCDay() * 1440 + d.getUTCHours() * 60 + d.getUTCMinutes();
}

// [start, end) in minutes of the week; end may pass the week's end (a Saturday-night period). null end = always open.
function spans(hours) {
  const ps = hours && Array.isArray(hours.periods) ? hours.periods : [];
  return ps.map((p) => {
    const s = pt(p.open);
    if (s == null) return null;
    const c = pt(p.close);
    if (c == null) return { s, e: null };
    return { s, e: c <= s ? c + WEEK : c };
  }).filter(Boolean);
}

const contains = (sp, t) => (sp.s <= t && t < sp.e) || (sp.s <= t + WEEK && t + WEEK < sp.e);

// Minutes until it closes: 0 when closed, Infinity when it never closes, null when hours are unknown.
export function minutesLeft(hours, at, off) {
  const sp = spans(hours);
  if (!sp.length) return null;
  if (sp.some((x) => x.e === null)) return Infinity;
  const t = minuteOfWeek(at, off);
  let cur = sp.find((x) => contains(x, t));
  if (!cur) return 0;
  let left = (cur.s <= t && t < cur.e ? cur.e : cur.e - WEEK) - t;
  // Back-to-back periods (closing at midnight, reopening at midnight) count as one stretch.
  for (let i = 0; i < 7; i++) {
    const end = (t + left) % WEEK;
    const next = sp.find((x) => x.s === end);
    if (!next) break;
    left += next.e - next.s;
    if (left >= WEEK) return Infinity;
  }
  return left;
}

export function isOpenAt(hours, at, off) {
  const m = minutesLeft(hours, at, off);
  return m == null ? null : m > 0;
}

export function nextOpen(hours, at, off) {
  const sp = spans(hours);
  if (!sp.length) return null;
  const t = minuteOfWeek(at, off);
  const d = Math.min(...sp.map((x) => ((x.s - t) % WEEK + WEEK) % WEEK || WEEK));
  const base = new Date(at.getTime()); base.setSeconds(0, 0);
  return new Date(base.getTime() + d * 60000);
}

function clock(minOfDay) {
  const m = ((minOfDay % 1440) + 1440) % 1440;
  if (m === 0) return "midnight";
  const h = Math.floor(m / 60), mm = m % 60, h12 = h % 12 || 12, ap = h < 12 ? "am" : "pm";
  return mm ? `${h12}:${String(mm).padStart(2, "0")} ${ap}` : `${h12} ${ap}`;
}

export function hoursLabel(hours, at, off) {
  const left = minutesLeft(hours, at, off);
  if (left == null) return "Hours unknown";
  if (left === Infinity) return "Open 24 hours";
  const t = minuteOfWeek(at, off);
  if (left > 0) return `Open till ${clock(t + left)}`;
  const sp = spans(hours);
  const d = Math.min(...sp.map((x) => ((x.s - t) % WEEK + WEEK) % WEEK || WEEK));
  const when = (t + d) % WEEK, sameDay = Math.floor(when / 1440) === Math.floor(t / 1440) && d < 1440;
  return `Closed · opens ${sameDay ? "" : DAYS[Math.floor(when / 1440)] + " "}${clock(when)}`;
}

// One day's hours, for the place sheet: "11:30 am – 2:30 pm, 5:30 pm – 10 pm".
export function dayHours(hours, day) {
  const ps = hours && Array.isArray(hours.periods) ? hours.periods : null;
  if (!ps || !ps.length) return "";
  if (ps.some((p) => p.open && !p.close)) return "Open 24 hours";
  const today = ps.filter((p) => p.open && p.open.day === day)
    .sort((a, b) => pt(a.open) - pt(b.open));
  if (!today.length) return "Closed";
  if (today.length === 1 && pt(today[0].open) % 1440 === 0 && (pt(today[0].close) - pt(today[0].open) + WEEK) % WEEK === 1440) return "Open 24 hours";
  return today.map((p) => `${clock(pt(p.open))} – ${clock(pt(p.close))}`).join(", ");
}

// ---------- Choosing places ----------
// Place: { id, name, kind, type, address, area, lat, lng, rating, ratingCount, price, priceRange, hours, off,
//          photo: { url, author, authorUrl } | null, mapsUrl, summary: { text, disclosure } | null, reviews: [], sample? }

// Minutes it stays open from `at`; a park or beach with no listed hours counts as open all day.
export const openLeft = (p, at) => minutesLeft(p.hours, at, p.off) ?? (!p.hours && kindOf(p.kind).alwaysOpen ? 24 * 60 : null);

// Bayesian rating: a few perfect reviews don't beat hundreds of good ones. Unknown rating counts as 3.5.
export function score(p) {
  if (!Number.isFinite(p.rating)) return 3.5;
  const n = Number.isFinite(p.ratingCount) ? p.ratingCount : 0;
  return (p.rating * n + 4.0 * 50) / (n + 50);
}

// Longest one-way trip when you have `total` minutes and stay `visit` minutes.
export const driveBudget = (total, visit) => Math.max(5, Math.floor((total - visit) / 2));

const annotate = (p, from, opts) => {
  const km = haversineKm(from, p);
  return { ...p, km: Math.round(km * 10) / 10, travel: travelMinutes(km, opts) };
};
const uniq = (list) => { const seen = new Set(); return list.filter((p) => !seen.has(p.id) && seen.add(p.id)); };

// A visit never takes more than half the time you have: an hour for dinner becomes a quick bite.
export const visitFor = (kind, total) => Math.min(kindOf(kind).visit, Math.floor(total / 2));

const nowChecks = (p, { at, minutes, priceMax, kind }) => {
  const visit = visitFor(p.kind || kind, minutes), left = openLeft(p, at);
  return { open: left != null && left > 0, budget: fitsBudget(p, priceMax), near: p.travel <= driveBudget(minutes, visit), long: left != null && left >= visit + p.travel };
};

// maxKm: the straight-line distance you chose, on top of the time (null: only the time limits it).
const withinKm = (p, maxKm) => maxKm == null || p.km <= maxKm;

export function pickNow(places, { from, at, minutes, mode = "drive", priceMax = null, kind = "eat", maxKm = null, cuisines = null }) {
  return uniq(places).filter((p) => cuisineOk(p, cuisines)).map((p) => annotate(p, from, { mode, at })).filter((p) => {
    const c = nowChecks(p, { at, minutes, priceMax, kind });
    return c.open && c.budget && c.near && c.long && withinKm(p, maxKm);
  }).sort((a, b) => (score(b) - 0.02 * b.travel) - (score(a) - 0.02 * a.travel)).slice(0, 12);
}

// Why pickNow came back empty, so the app can say which limit to loosen.
export function whyEmpty(places, { from, at, minutes, mode = "drive", priceMax = null, kind = "eat", maxKm = null, cuisines = null }) {
  if (!places.length) return "none";
  if (!places.some((p) => cuisineOk(p, cuisines))) return "cuisine";
  const cs = uniq(places).filter((p) => cuisineOk(p, cuisines)).map((p) => { const a = annotate(p, from, { mode, at }); return { a, c: nowChecks(a, { at, minutes, priceMax, kind }) }; });
  if (!cs.some((x) => x.c.open)) return "closed";
  if (!cs.some((x) => x.c.open && x.c.budget)) return "budget";
  const fit = cs.filter((x) => x.c.open && x.c.budget && x.c.near && x.c.long);
  if (fit.length && fit.every((x) => !withinKm(x.a, maxKm))) return "distance";
  return "far";
}

// Late night runs from 9 pm to 4 am; earlier in the day it looks ahead to tonight at 10 pm.
export function lateStart(now) {
  const h = now.getHours();
  if (h >= 21 || h < 4) return { at: now, tonight: false };
  const at = new Date(now); at.setHours(22, 0, 0, 0);
  return { at, tonight: true };
}

// Open at `at` with at least an hour left, within the night drive. Latest closers first; anything open
// past 4 am counts the same, so 24-hour places don't crowd out better ones.
export function pickLate(places, { from, at, maxMinutes, priceMax = null, maxKm = null, cuisines = null }) {
  const lateness = (p) => Math.min(minutesLeft(p.hours, at, p.off), 360);
  return uniq(places).filter((p) => cuisineOk(p, cuisines)).map((p) => annotate(p, from, { mode: "drive", at })).filter((p) => {
    const left = minutesLeft(p.hours, at, p.off);
    return left != null && left >= 60 && fitsBudget(p, priceMax) && p.travel <= maxMinutes && withinKm(p, maxKm);
  }).sort((a, b) => lateness(b) - lateness(a) || score(b) - score(a)).slice(0, 12);
}

// ---------- Near a place: well-reviewed places around somewhere you're going ----------
// Google gives each place its average rating and how many reviews it has (not how many are five-star), so
// "great reviews" means an average of at least minRating from at least minReviews people.
// How far: a short walk, or a short drive (drive minutes as the travel model counts them, parking included, so
// a 15-minute drive reaches about 4 km by day, less at peak, more at night).
export const NEAR = {
  ranges: [
    { id: "w500", mode: "walk", km: 0.5, label: "500 m walk", short: "🚶 500 m" },
    { id: "w1", mode: "walk", km: 1, label: "1 km walk", short: "🚶 1 km" },
    { id: "d10", mode: "drive", minutes: 10, label: "10 min drive", short: "🚗 10 min" },
    { id: "d15", mode: "drive", minutes: 15, label: "15 min drive", short: "🚗 15 min" },
    { id: "d20", mode: "drive", minutes: 20, label: "20 min drive", short: "🚗 20 min" },
  ],
  reviews: [300, 1000, 2000], ratings: [4.3, 4.5, 4.7], kinds: ["eat", "drink", "coffee"],
};
// "km:3.5" is a distance typed with the slider: a radius in kilometres (walked when it's short), not a timed trip.
export function nearRange(id) {
  const m = /^km:(\d+(?:\.\d+)?)$/.exec(id || "");
  if (m) {
    const km = Math.min(MAX_RADIUS_KM, Math.max(0.5, Number(m[1])));
    return { id: `km:${km}`, mode: km <= 1.5 ? "walk" : "drive", km, label: `${fmtKm(km)} radius`, short: fmtKm(km), custom: true };
  }
  return NEAR.ranges.find((r) => r.id === id) || NEAR.ranges.find((r) => r.id === "d15");
}
// The search radius for a range at a given time.
export const rangeKm = (range, at = new Date()) => (Number.isFinite(range.km) ? range.km : Math.max(0.5, reachKm(range.minutes, { mode: "drive", at })));

export function pickNear(places, { center, range = "d15", at = new Date(), minRating = 4.5, minReviews = 1000, priceMax = null, max = 6, cuisines = null }) {
  const r = typeof range === "string" ? nearRange(range) : range;
  const near = uniq(places).filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng)).map((p) => {
    const km = haversineKm(center, p);
    return { ...p, km: Math.round(km * 10) / 10, travel: travelMinutes(km, { mode: r.mode, at }) };
  }).filter((p) => (Number.isFinite(r.km) ? p.km <= r.km : p.travel <= r.minutes) && fitsBudget(p, priceMax) && cuisineOk(p, cuisines));
  const rated = (p, r, n) => (p.rating ?? 0) >= r && (p.ratingCount ?? 0) >= n;
  const good = near.filter((p) => rated(p, minRating, minReviews))
    .sort((a, b) => b.rating - a.rating || b.ratingCount - a.ratingCount || a.km - b.km);
  // How many more would show with a third of the reviews, so the app can suggest lowering the bar.
  const almost = near.filter((p) => !rated(p, minRating, minReviews) && rated(p, minRating, Math.floor(minReviews / 3))).length;
  return { places: good.slice(0, max), more: Math.max(0, good.length - max), almost };
}

// ---------- Tomorrow: a day plan ----------

const slot = (id, label, time, kinds, query, visit) => ({ id, label, time, kinds, query, visit });
const BASE = [
  slot("breakfast", "Breakfast", "09:00", ["coffee", "eat"], "breakfast cafe", 45),
  slot("morning", "Morning", "10:30", ["sights", "activities"], "things to do", 90),
  slot("lunch", "Lunch", "12:30", ["eat"], "lunch", 60),
  slot("afternoon", "Afternoon", "14:30", ["sights", "activities"], "attractions", 90),
];
export const DAY_SLOTS = { relaxed: BASE, full: [...BASE, slot("dinner", "Dinner", "18:30", ["eat"], "dinner restaurant", 75)] };

// Tomorrow's slots for its weather (see today.js weatherState): a good day puts the afternoon outdoors (the beach on
// a warm, calm day), a wet day keeps the morning and afternoon indoors.
export function daySlots(pace, state = null, { beachy = false } = {}) {
  const base = DAY_SLOTS[pace] || DAY_SLOTS.relaxed;
  if (state === "good") return base.map((s) => (s.id === "afternoon"
    ? (beachy ? slot("afternoon", "Afternoon at the beach", "14:30", ["beach"], "beach", 120) : slot("afternoon", "Afternoon outdoors", "14:30", ["nature"], "park walking trail", 90))
    : s));
  if (state === "wet") return base.map((s) => (s.id === "morning" ? slot("morning", "Morning indoors", "10:30", ["sights"], "museum gallery", 90)
    : s.id === "afternoon" ? slot("afternoon", "Afternoon indoors", "14:30", ["activities"], "indoor activities", 90) : s));
  return base;
}

export const tomorrow = (now) => new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

const hhmm = (s) => { const [h, m] = String(s).split(":").map(Number); return (h || 0) * 60 + (m || 0); };
export function slotTimes(slots, startHHMM, day) {
  const shift = hhmm(startHHMM || "09:00") - hhmm("09:00");
  return slots.map((s) => new Date(day.getFullYear(), day.getMonth(), day.getDate(), 0, hhmm(s.time) + shift));
}

// One place per slot: open long enough at that time, within budget, not used already, best by score
// minus the extra driving it adds from the previous stop.
export function buildDayPlan(slots, candidatesBySlotId, { start, day, startTime = "09:00", priceMax = null, cuisines = null }) {
  const times = slotTimes(slots, startTime, day), used = new Set();
  let here = start;
  return slots.map((s, i) => {
    const at = times[i];
    const ok = uniq(candidatesBySlotId[s.id] || []).filter((p) => !used.has(p.id) && fitsBudget(p, priceMax) && cuisineOk(p, cuisines)
      && (openLeft(p, at) ?? 0) >= s.visit)
      .map((p) => annotate(p, here, { mode: "drive", at }))
      .sort((a, b) => (score(b) - 0.03 * b.travel) - (score(a) - 0.03 * a.travel));
    const place = ok[0] || null;
    if (place) { used.add(place.id); here = place; }
    return { slot: s, at, place, travel: place ? place.travel : null, alternatives: ok.slice(1, 3) };
  });
}

// ---------- Storage, stamps and backup ----------

export const KEY = "spots.v1";
const THEMES = ["auto", "light", "dark"];
const str = (v) => (typeof v === "string" ? v.trim() : "");
const num = (v) => (Number.isFinite(v) ? v : null);
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const isoDay = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export const blank = () => ({ saved: [], stamps: [], events: [], settings: { key: "", sample: false, theme: "auto", lastBackup: null }, recentRegions: [] });

function cleanSaved(x) {
  if (!x || typeof x !== "object" || !str(x.id) || !str(x.name)) return null;
  return { id: str(x.id), name: str(x.name), kind: kindOf(x.kind).id, area: str(x.area), lat: num(x.lat), lng: num(x.lng),
    savedAt: str(x.savedAt), fetchedAt: str(x.fetchedAt), ...(x.sample === true ? { sample: true } : {}) };
}
function cleanStamp(x) {
  if (!x || typeof x !== "object" || !str(x.id) || !str(x.name) || !/^\d{4}-\d{2}-\d{2}$/.test(x.date || "")) return null;
  const r = Number.isFinite(x.rating) ? Math.min(5, Math.max(1, Math.round(x.rating))) : null;
  return { id: str(x.id), placeId: str(x.placeId), name: str(x.name), area: str(x.area), kind: kindOf(x.kind).id, date: x.date,
    rating: r, note: str(x.note), photoId: str(x.photoId) || null };
}
// A saved event: our own copy of public listing data (What's On, Eventfinda), not Google's, so it can be kept.
const DAY = /^\d{4}-\d{2}-\d{2}$/;
function cleanEvent(x) {
  if (!x || typeof x !== "object" || !str(x.id) || !str(x.title) || !DAY.test(x.day || "")) return null;
  return { id: str(x.id), title: str(x.title), url: /^https:\/\//.test(x.url || "") ? x.url : "", venue: str(x.venue), address: str(x.address),
    area: str(x.area), cat: str(x.cat) || "other", day: x.day, to: DAY.test(x.to || "") && x.to >= x.day ? x.to : x.day,
    time: /^\d{2}:\d{2}$/.test(x.time || "") ? x.time : "" };
}
const list = (v, f) => (Array.isArray(v) ? v.map(f).filter(Boolean) : []);
const byNewest = (a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0);

function clean(raw) {
  const s = blank(), set = raw && typeof raw.settings === "object" && raw.settings ? raw.settings : {};
  if (!raw || typeof raw !== "object") return s;
  return {
    saved: list(raw.saved, cleanSaved),
    stamps: list(raw.stamps, cleanStamp),
    events: list(raw.events, cleanEvent),
    settings: { key: str(set.key), sample: set.sample === true, theme: THEMES.includes(set.theme) ? set.theme : "auto", lastBackup: str(set.lastBackup) || null },
    recentRegions: Array.isArray(raw.recentRegions) ? raw.recentRegions.filter((x) => typeof x === "string").slice(0, 3) : [],
  };
}

export function load(ls) {
  try { return clean(JSON.parse(ls.getItem(KEY) || "null")); } catch { return blank(); }
}
export function save(ls, state) {
  try { ls.setItem(KEY, JSON.stringify(state)); } catch { /* storage full or blocked: the app keeps working from memory */ }
}

// "123 Smith St, Fitzroy VIC 3065, Australia" -> "Fitzroy"; elsewhere, the second-last part of the address.
export function areaFromAddress(address) {
  const a = str(address);
  if (!a) return "";
  const au = a.match(/,\s*([^,]+?)\s+(VIC|NSW|QLD|SA|WA|TAS|NT|ACT)\s+\d{4}/);
  if (au) return au[1].trim();
  const parts = a.split(",").map((x) => x.trim()).filter(Boolean);
  return parts.length >= 2 ? parts[parts.length - 2] : "";
}

// Only the place id, name, kind, area and position are kept (Google allows ids indefinitely and the rest
// for 30 days; staleSaved lists what to refresh). Photos, ratings and hours are fetched live.
export function savePlace(state, p, now = new Date()) {
  const t = now.toISOString();
  const entry = cleanSaved({ id: p.id, name: p.name, kind: p.kind, area: p.area, lat: p.lat, lng: p.lng, savedAt: t, fetchedAt: t, sample: p.sample });
  if (!entry) return state;
  const old = state.saved.find((x) => x.id === entry.id);
  return { ...state, saved: [old ? { ...entry, savedAt: old.savedAt } : entry, ...state.saved.filter((x) => x.id !== entry.id)] };
}
export const unsave = (state, id) => ({ ...state, saved: state.saved.filter((x) => x.id !== id) });
export const isSaved = (state, id) => state.saved.some((x) => x.id === id);
export const staleSaved = (state, now = new Date()) =>
  state.saved.filter((x) => !x.sample && (!x.fetchedAt || now - new Date(x.fetchedAt) > 30 * 864e5)).map((x) => x.id);

export function addStamp(state, { place, rating, note, photoId, date = new Date() }) {
  const stamp = cleanStamp({ id: uid(), placeId: place.id || "", name: place.name, area: place.area, kind: place.kind,
    date: isoDay(date), rating, note, photoId });
  if (!stamp) return { state, stamp: null };
  return { state: { ...state, stamps: [stamp, ...state.stamps] }, stamp };
}

export function passportStats(state) {
  const st = state.stamps;
  return { stamps: st.length, places: new Set(st.map((s) => s.placeId || s.name)).size, suburbs: new Set(st.map((s) => s.area).filter(Boolean)).size };
}

// ---------- Saved events ----------
// day: the first day it's on from the day of the list it was saved from (Today's list: today; This weekend:
// Saturday; Tomorrow: tomorrow), going by the days a source listed it for, else that day or its start if later.
// time: that day's session.
export function saveEvent(state, e, today, listDay = today) {
  const from = listDay > today ? listDay : today;
  const day = (Array.isArray(e.days) ? e.days : []).find((d) => d >= from) || (e.from && e.from > from ? e.from : from);
  const time = e.next && e.next.startsWith(day) ? e.next.slice(11, 16) : "";
  const entry = cleanEvent({ ...e, day, to: e.to || day, time });
  if (!entry) return state;
  return { ...state, events: [entry, ...state.events.filter((x) => x.id !== entry.id && x.to >= today)] };
}
export const unsaveEvent = (state, id) => ({ ...state, events: state.events.filter((x) => x.id !== id) });
export const isEventSaved = (state, id) => state.events.some((x) => x.id === id);
// Not over yet, soonest first. Events drop off the day after they end.
export const upcomingEvents = (state, today) => state.events.filter((x) => x.to >= today)
  .sort((a, b) => (a.day < b.day ? -1 : a.day > b.day ? 1 : (a.time || "99") < (b.time || "99") ? -1 : 1));

export const noteRegion = (state, id) => ({ ...state, recentRegions: [id, ...state.recentRegions.filter((x) => x !== id)].slice(0, 3) });

// The backup carries places, saved events, stamps and stamp photos, never settings (so never the Google key).
export function backupJSON(state, photos, now = new Date()) {
  return JSON.stringify({ app: "spots", v: 1, savedAt: now.toISOString(), saved: state.saved, stamps: state.stamps, events: state.events || [], recentRegions: state.recentRegions, photos: photos || {} });
}

export function mergeBackup(state, text) {
  let o;
  try { o = JSON.parse(text); } catch { throw new Error("Not a Spots backup"); }
  if (!o || o.app !== "spots" || !Array.isArray(o.saved) || !Array.isArray(o.stamps)) throw new Error("Not a Spots backup");
  const haveSaved = new Set(state.saved.map((x) => x.id)), haveStamps = new Set(state.stamps.map((x) => x.id));
  const newSaved = list(o.saved, cleanSaved).filter((x) => !haveSaved.has(x.id));
  const newStamps = list(o.stamps, cleanStamp).filter((x) => !haveStamps.has(x.id));
  const haveEvents = new Set((state.events || []).map((x) => x.id));
  const newEvents = list(o.events, cleanEvent).filter((x) => !haveEvents.has(x.id));
  const photos = {};
  for (const s of newStamps) if (s.photoId && o.photos && typeof o.photos[s.photoId] === "string") photos[s.photoId] = o.photos[s.photoId];
  return {
    state: { ...state, saved: [...state.saved, ...newSaved], stamps: [...state.stamps, ...newStamps].sort(byNewest), events: [...(state.events || []), ...newEvents] },
    photos, added: newSaved.length + newStamps.length + newEvents.length,
  };
}

// Swap one stop for its next alternative that no other stop uses, then fix the drive to it and from it.
export function swapStop(plan, i, start) {
  const out = plan.map((s) => ({ ...s, alternatives: [...s.alternatives] })), s = out[i];
  if (!s.place) return out;
  const used = new Set(out.filter((x, j) => j !== i && x.place).map((x) => x.place.id));
  const k = s.alternatives.findIndex((p) => !used.has(p.id));
  if (k < 0) return out;
  const [next] = s.alternatives.splice(k, 1);
  s.alternatives.push(s.place);
  const prev = out.slice(0, i).reverse().find((x) => x.place);
  s.place = annotate(next, prev ? prev.place : start, { mode: "drive", at: s.at });
  s.travel = s.place.travel;
  const after = out.slice(i + 1).find((x) => x.place);
  if (after) { after.place = annotate(after.place, s.place, { mode: "drive", at: after.at }); after.travel = after.place.travel; }
  return out;
}

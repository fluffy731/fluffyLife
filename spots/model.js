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
];
export const kindOf = (id) => KINDS.find((k) => k.id === id) || KINDS[0];

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

export function pickNow(places, { from, at, minutes, mode = "drive", priceMax = null, kind = "eat" }) {
  return uniq(places).map((p) => annotate(p, from, { mode, at })).filter((p) => {
    const visit = kindOf(p.kind || kind).visit, left = minutesLeft(p.hours, at, p.off);
    return left != null && fitsBudget(p, priceMax) && p.travel <= driveBudget(minutes, visit) && left >= visit + p.travel;
  }).sort((a, b) => (score(b) - 0.02 * b.travel) - (score(a) - 0.02 * a.travel)).slice(0, 12);
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
export function pickLate(places, { from, at, maxMinutes, priceMax = null }) {
  const lateness = (p) => Math.min(minutesLeft(p.hours, at, p.off), 360);
  return uniq(places).map((p) => annotate(p, from, { mode: "drive", at })).filter((p) => {
    const left = minutesLeft(p.hours, at, p.off);
    return left != null && left >= 60 && fitsBudget(p, priceMax) && p.travel <= maxMinutes;
  }).sort((a, b) => lateness(b) - lateness(a) || score(b) - score(a)).slice(0, 12);
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

export const tomorrow = (now) => new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

const hhmm = (s) => { const [h, m] = String(s).split(":").map(Number); return (h || 0) * 60 + (m || 0); };
export function slotTimes(slots, startHHMM, day) {
  const shift = hhmm(startHHMM || "09:00") - hhmm("09:00");
  return slots.map((s) => new Date(day.getFullYear(), day.getMonth(), day.getDate(), 0, hhmm(s.time) + shift));
}

// One place per slot: open long enough at that time, within budget, not used already, best by score
// minus the extra driving it adds from the previous stop.
export function buildDayPlan(slots, candidatesBySlotId, { start, day, startTime = "09:00", priceMax = null }) {
  const times = slotTimes(slots, startTime, day), used = new Set();
  let here = start;
  return slots.map((s, i) => {
    const at = times[i];
    const ok = uniq(candidatesBySlotId[s.id] || []).filter((p) => !used.has(p.id) && fitsBudget(p, priceMax)
      && (minutesLeft(p.hours, at, p.off) ?? 0) >= s.visit)
      .map((p) => annotate(p, here, { mode: "drive", at }))
      .sort((a, b) => (score(b) - 0.03 * b.travel) - (score(a) - 0.03 * a.travel));
    const place = ok[0] || null;
    if (place) { used.add(place.id); here = place; }
    return { slot: s, at, place, travel: place ? place.travel : null, alternatives: ok.slice(1, 3) };
  });
}

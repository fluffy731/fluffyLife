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

// A visit never takes more than half the time you have: an hour for dinner becomes a quick bite.
export const visitFor = (kind, total) => Math.min(kindOf(kind).visit, Math.floor(total / 2));

const nowChecks = (p, { at, minutes, priceMax, kind }) => {
  const visit = visitFor(p.kind || kind, minutes), left = minutesLeft(p.hours, at, p.off);
  return { open: left != null && left > 0, budget: fitsBudget(p, priceMax), near: p.travel <= driveBudget(minutes, visit), long: left != null && left >= visit + p.travel };
};

export function pickNow(places, { from, at, minutes, mode = "drive", priceMax = null, kind = "eat" }) {
  return uniq(places).map((p) => annotate(p, from, { mode, at })).filter((p) => {
    const c = nowChecks(p, { at, minutes, priceMax, kind });
    return c.open && c.budget && c.near && c.long;
  }).sort((a, b) => (score(b) - 0.02 * b.travel) - (score(a) - 0.02 * a.travel)).slice(0, 12);
}

// Why pickNow came back empty, so the app can say which limit to loosen.
export function whyEmpty(places, { from, at, minutes, mode = "drive", priceMax = null, kind = "eat" }) {
  if (!places.length) return "none";
  const cs = uniq(places).map((p) => nowChecks(annotate(p, from, { mode, at }), { at, minutes, priceMax, kind }));
  if (!cs.some((c) => c.open)) return "closed";
  if (!cs.some((c) => c.open && c.budget)) return "budget";
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

// Before 4 am (where Late night ends), "tomorrow" means later today.
export function planDay(now) {
  if (now.getHours() < 4) return { day: new Date(now.getFullYear(), now.getMonth(), now.getDate()), label: "Later today" };
  return { day: tomorrow(now), label: "Tomorrow" };
}

// When to leave home for the first stop, and when you'd be back after the last.
export function dayBookends(plan, from) {
  const stops = plan.filter((s) => s.place);
  if (!stops.length) return null;
  const first = stops[0], last = stops[stops.length - 1];
  const leaveAt = new Date(first.at.getTime() - first.travel * 60000);
  const homeStart = new Date(last.at.getTime() + last.slot.visit * 60000);
  const homeTravel = travelMinutes(haversineKm(last.place, from), { mode: "drive", at: homeStart });
  return { leaveAt, homeTravel, homeAt: new Date(homeStart.getTime() + homeTravel * 60000) };
}

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
    return { slot: s, at, place, travel: place ? place.travel : null, alternatives: ok.slice(1, 7) };
  });
}

// ---------- Storage, stamps and backup ----------

export const KEY = "spots.v1";
const THEMES = ["auto", "light", "dark"];
const str = (v) => (typeof v === "string" ? v.trim() : "");
const num = (v) => (Number.isFinite(v) ? v : null);
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const isoDay = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export const blank = () => ({ saved: [], stamps: [], settings: { key: "", sample: false, theme: "auto", lastBackup: null }, recentRegions: [], day: null });

// A saved day plan: its date, and each stop's time with the same few fields a saved place keeps.
function cleanDay(d) {
  if (!d || typeof d !== "object" || !/^\d{4}-\d{2}-\d{2}$/.test(d.date || "") || !Array.isArray(d.stops)) return null;
  const stops = d.stops.map((x) => {
    const base = cleanSaved({ ...x, savedAt: "", fetchedAt: "" });
    if (!base || !/^([01]\d|2[0-3]):[0-5]\d$/.test(x.time || "")) return null;
    const { savedAt, fetchedAt, ...keep } = base;
    return { ...keep, time: x.time, slot: str(x.slot) };
  }).filter(Boolean);
  return stops.length ? { date: d.date, label: str(d.label) || "Tomorrow", region: str(d.region) || null, stops } : null;
}

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
const list = (v, f) => (Array.isArray(v) ? v.map(f).filter(Boolean) : []);
const byNewest = (a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0);

function clean(raw) {
  const s = blank(), set = raw && typeof raw.settings === "object" && raw.settings ? raw.settings : {};
  if (!raw || typeof raw !== "object") return s;
  return {
    saved: list(raw.saved, cleanSaved),
    stamps: list(raw.stamps, cleanStamp),
    settings: { key: str(set.key), sample: set.sample === true, theme: THEMES.includes(set.theme) ? set.theme : "auto", lastBackup: str(set.lastBackup) || null },
    recentRegions: Array.isArray(raw.recentRegions) ? raw.recentRegions.filter((x) => typeof x === "string").slice(0, 3) : [],
    day: cleanDay(raw.day),
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

export const noteRegion = (state, id) => ({ ...state, recentRegions: [id, ...state.recentRegions.filter((x) => x !== id)].slice(0, 3) });

// The backup carries places, stamps and stamp photos, never settings (so never the Google key).
export function backupJSON(state, photos, now = new Date()) {
  return JSON.stringify({ app: "spots", v: 1, savedAt: now.toISOString(), saved: state.saved, stamps: state.stamps, recentRegions: state.recentRegions, photos: photos || {} });
}

export function mergeBackup(state, text) {
  let o;
  try { o = JSON.parse(text); } catch { throw new Error("Not a Spots backup"); }
  if (!o || o.app !== "spots" || !Array.isArray(o.saved) || !Array.isArray(o.stamps)) throw new Error("Not a Spots backup");
  const haveSaved = new Set(state.saved.map((x) => x.id)), haveStamps = new Set(state.stamps.map((x) => x.id));
  const newSaved = list(o.saved, cleanSaved).filter((x) => !haveSaved.has(x.id));
  const newStamps = list(o.stamps, cleanStamp).filter((x) => !haveStamps.has(x.id));
  const photos = {};
  for (const s of newStamps) if (s.photoId && o.photos && typeof o.photos[s.photoId] === "string") photos[s.photoId] = o.photos[s.photoId];
  return {
    state: { ...state, saved: [...state.saved, ...newSaved], stamps: [...state.stamps, ...newStamps].sort(byNewest) },
    photos, added: newSaved.length + newStamps.length,
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

// ---------- Saved day, check-in candidates ----------

const hm = (d) => `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;

export function saveDayPlan(state, plan, { day, label = "Tomorrow", region = null }, now = new Date()) {
  let st = state;
  const stops = plan.filter((s) => s.place).map((s) => {
    st = savePlace(st, s.place, now);
    return { id: s.place.id, name: s.place.name, kind: s.place.kind, area: s.place.area, lat: s.place.lat, lng: s.place.lng,
      time: hm(s.at), slot: s.slot.label, ...(s.place.sample ? { sample: true } : {}) };
  });
  return { ...st, day: cleanDay({ date: isoDay(day), label, region, stops }) };
}
export const activeDay = (state, now = new Date()) => (state.day && state.day.date >= isoDay(now) ? state.day : null);
export const clearDay = (state) => ({ ...state, day: null });

// Where you might be checking in: the place you tapped, then saved and just-found places, nearest first.
// Only something within 300 m is picked for you; otherwise you choose.
export function checkinCandidates({ pre, saved, found, pos }) {
  const seen = new Set(), out = [];
  for (const p of [...saved, ...found]) if (p && p.id && !seen.has(p.id) && (!pre || p.id !== pre.id)) { seen.add(p.id); out.push(p); }
  const withDist = (p) => ({ ...p, dist: pos && Number.isFinite(p.lat) && Number.isFinite(p.lng) ? haversineKm(pos, p) : null });
  const rest = out.map(withDist).sort((a, b) => (a.dist ?? Infinity) - (b.dist ?? Infinity));
  const list = [...(pre ? [withDist(pre)] : []), ...rest].slice(0, 8);
  const preselect = pre ? pre.id : list[0] && list[0].dist != null && list[0].dist < 0.3 ? list[0].id : null;
  return { list, preselect };
}

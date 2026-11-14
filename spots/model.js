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

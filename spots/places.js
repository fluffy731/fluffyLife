// Google Places, through the Maps JavaScript API, turned into the app's plain Place shape.
// Tested with Google-shaped objects in test/spots-places.test.js. Safe to import in Node (no window at load).
import { kindOf, priceLevelOf, areaFromAddress, CBD } from "./model.js";

export const SEARCH_FIELDS = ["id", "displayName", "location", "formattedAddress", "primaryType", "rating", "userRatingCount",
  "priceLevel", "priceRange", "regularOpeningHours", "utcOffsetMinutes", "photos", "googleMapsURI"];
export const DETAIL_FIELDS = [...SEARCH_FIELDS, "reviewSummary", "reviews"];
const PRICE_NAMES = ["FREE", "INEXPENSIVE", "MODERATE", "EXPENSIVE", "VERY_EXPENSIVE"];

const val = (x) => (typeof x === "function" ? x() : x);
const text = (x) => (typeof x === "string" ? x : x && typeof x.text === "string" ? x.text : "");
const numOr = (x) => { const n = Number(x); return x == null || x === "" || !Number.isFinite(n) ? null : n; };

const TYPE_KIND = [
  [/bar|pub|night_club|winery|brewery|wine/, "drink"],
  [/cafe|coffee/, "coffee"],
  [/ice_cream|dessert|bakery|confectionery|chocolate|donut/, "dessert"],
  [/restaurant|food|meal|diner|steak|sushi|ramen|pizza|bistro/, "eat"],
  [/museum|gallery|park|garden|attraction|landmark|monument|zoo|aquarium|beach|lookout|historical/, "sights"],
];
const kindFromType = (type) => (TYPE_KIND.find(([re]) => re.test(type || "")) || [null, "activities"])[1];

function photoOf(gp) {
  const ph = Array.isArray(gp.photos) ? gp.photos[0] : null;
  if (!ph || typeof ph.getURI !== "function") return null;
  try {
    const a = (ph.authorAttributions || [])[0] || {};
    return { url: ph.getURI({ maxWidth: 800 }), author: a.displayName || "", authorUrl: a.uri || "" };
  } catch { return null; }
}

function rangeOf(r) {
  const from = numOr(r && r.startPrice && r.startPrice.units);
  if (from == null) return null;
  return { from, to: numOr(r.endPrice && r.endPrice.units), currency: (r.startPrice.currencyCode || "AUD").toUpperCase() };
}

function hoursOf(h) {
  const ps = h && Array.isArray(h.periods) ? h.periods : null;
  if (!ps || !ps.length) return null;
  const pt = (x) => (x && Number.isFinite(x.day) ? { day: x.day, hour: x.hour || 0, minute: x.minute || 0 } : null);
  return { periods: ps.map((p) => ({ open: pt(p.open), close: pt(p.close) })).filter((p) => p.open) };
}

// kind: the kind searched for; allowed: kinds the search covers (a day-plan slot), so a bowling alley found
// under "things to do" stays Activities rather than becoming Sights.
export function toPlace(gp, kind, allowed) {
  const loc = gp.location || {};
  const s = gp.reviewSummary;
  const address = gp.formattedAddress || "";
  return {
    id: gp.id, name: text(gp.displayName) || "Unnamed place",
    kind: !kind ? kindFromType(gp.primaryType) : allowed && allowed.includes(kindFromType(gp.primaryType)) ? kindFromType(gp.primaryType) : kindOf(kind).id,
    type: gp.primaryType || "", address, area: areaFromAddress(address),
    lat: numOr(val(loc.lat)), lng: numOr(val(loc.lng)),
    rating: numOr(gp.rating), ratingCount: numOr(gp.userRatingCount),
    price: priceLevelOf(gp.priceLevel), priceRange: rangeOf(gp.priceRange),
    hours: hoursOf(gp.regularOpeningHours), off: numOr(gp.utcOffsetMinutes),
    photo: photoOf(gp), mapsUrl: gp.googleMapsURI || null,
    summary: s && text(s.text) ? { text: text(s.text), disclosure: text(s.disclosureText) } : null,
    reviews: (Array.isArray(gp.reviews) ? gp.reviews : []).map((r) => ({
      text: text(r.text), rating: numOr(r.rating), author: (r.authorAttribution && r.authorAttribution.displayName) || "",
      when: r.relativePublishTimeDescription || "" })).filter((r) => r.text),
  };
}

// Newer fields Google may not accept yet. If a request with them fails, it's retried without them, and
// they're left out from then on, so one unknown name can't break every search.
const OPTIONAL = ["priceRange", "reviewSummary"];

export function googleProvider(lib) {
  const dropped = new Set();
  const keep = (fields) => fields.filter((f) => !dropped.has(f));
  async function withRetry(fields, run) {
    try { return await run(keep(fields)); }
    catch (e) {
      const extra = keep(fields).filter((f) => OPTIONAL.includes(f));
      if (!extra.length) throw e;
      const out = await run(keep(fields).filter((f) => !OPTIONAL.includes(f)));
      // The plain request worked, so one of the newer fields was the problem: try each alone to find which.
      for (const f of extra) { try { await run([...keep(fields).filter((x) => !OPTIONAL.includes(x)), f]); } catch { dropped.add(f); } }
      return out;
    }
  }
  return {
    label: "Google Maps",
    dropped: () => [...dropped],
    async search({ query, kind, kinds, center, radiusKm, openNow, priceMax, max = 12 }) {
      const base = { textQuery: query, locationBias: { center: { lat: center.lat, lng: center.lng }, radius: Math.round(Math.min(50, Math.max(0.5, radiusKm)) * 1000) },
        maxResultCount: Math.min(20, max), language: "en-AU", region: "au" };
      if (openNow) base.isOpenNow = true;
      if (priceMax != null && priceMax >= 1 && kindOf(kind).priced) {
        base.priceLevels = PRICE_NAMES.slice(1, priceMax + 1).map((n) => (lib.PriceLevel && lib.PriceLevel[n]) || n);
      }
      const { places } = await withRetry(SEARCH_FIELDS, (fields) => lib.Place.searchByText({ ...base, fields }));
      return (places || []).map((g) => toPlace(g, kind, kinds));
    },
    async details(p) {
      if (p.sample) return p;
      const g = new lib.Place({ id: p.id });
      await withRetry(DETAIL_FIELDS, (fields) => g.fetchFields({ fields }));
      const fresh = toPlace(g, p.kind);
      return { ...p, ...fresh };
    },
  };
}

const browserLoadImage = (url) => new Promise((resolve, reject) => {
  const img = new Image(); img.onload = () => resolve(true); img.onerror = () => reject(new Error("photo didn't load")); img.src = url;
});

// One small search, one details call and one photo load; reports which fields came back, so a first live run
// shows straight away what works.
export async function testConnection(provider, { loadImage = browserLoadImage } = {}) {
  const notes = [];
  try {
    const [p] = await provider.search({ query: "coffee", kind: "coffee", center: CBD, radiusKm: 2, openNow: false, priceMax: null, max: 1 });
    if (!p) return { ok: true, fields: [], notes, error: "No places came back" };
    const d = await provider.details(p);
    const fields = ["price", "priceRange", "rating", "hours", "mapsUrl", "summary"].filter((f) => d[f] != null);
    if (d.reviews && d.reviews.length) fields.push("reviews");
    if (d.photo && d.photo.url) {
      try { await loadImage(d.photo.url); fields.push("photo"); }
      catch { notes.push("Google sent a photo but it didn't load: check the key allows this website."); }
    }
    const dropped = provider.dropped ? provider.dropped() : [];
    if (dropped.length) notes.push(`Google didn't accept: ${dropped.join(", ")}. Spots carries on without them.`);
    return { ok: true, fields, notes };
  } catch (e) {
    return { ok: false, fields: [], notes, error: (e && e.message) || String(e) };
  }
}

// Loads the Maps JavaScript API once with the owner's key and returns the Places library.
let loading = null, loadedWith = "";
// The Maps script stays tied to the key it loaded with; a different key needs the page reloaded.
export const loadedKey = () => loadedWith;
export function loadGoogle(key) {
  if (loading) return loading;
  loadedWith = key;
  loading = new Promise((resolve, reject) => {
    const g = globalThis;
    const fail = (msg) => { loading = null; reject(new Error(msg)); };
    const timer = setTimeout(() => fail("Google Maps didn't load. Check your connection."), 15000);
    g.gm_authFailure = () => { clearTimeout(timer); fail("Google rejected the key. Check it's allowed for this website and the Places API (New)."); };
    g.__spotsMapsReady = async () => {
      try { const lib = await g.google.maps.importLibrary("places"); clearTimeout(timer); resolve(lib); }
      catch (e) { clearTimeout(timer); fail(e.message || "Google Maps didn't load."); }
    };
    if (g.google && g.google.maps && g.google.maps.importLibrary) { g.__spotsMapsReady(); return; }
    const s = document.createElement("script");
    s.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&v=weekly&loading=async&libraries=places&language=en-AU&region=AU&callback=__spotsMapsReady`;
    s.async = true;
    s.onerror = () => { clearTimeout(timer); fail("Google Maps didn't load. Check your connection."); };
    document.head.appendChild(s);
  });
  return loading;
}

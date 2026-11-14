import { test } from "node:test";
import assert from "node:assert/strict";
import { toPlace, googleProvider, SEARCH_FIELDS, DETAIL_FIELDS, testConnection } from "../spots/places.js";
import { sampleProvider } from "../spots/samples.js";
import { CBD, haversineKm, minutesLeft } from "../spots/model.js";

// Shaped like a Maps JavaScript API Place object (new Places library).
const gp = () => ({
  id: "ChIJ123", displayName: "Hand Pulled Noodles", location: { lat: () => -37.8, lng: () => 144.98 },
  formattedAddress: "1 Smith St, Fitzroy VIC 3065, Australia", primaryType: "chinese_restaurant",
  rating: 4.6, userRatingCount: 1234, priceLevel: "MODERATE",
  priceRange: { startPrice: { currencyCode: "AUD", units: "20" }, endPrice: { currencyCode: "AUD", units: 40 } },
  regularOpeningHours: { periods: [{ open: { day: 1, hour: 11, minute: 0 }, close: { day: 1, hour: 22, minute: 0 } }] },
  utcOffsetMinutes: 660,
  photos: [{ getURI: (o) => `https://photo.example/${o.maxWidth}`, authorAttributions: [{ displayName: "Ann", uri: "https://maps.example/ann" }] }],
  googleMapsURI: "https://maps.google.com/?cid=1",
  reviewSummary: { text: "Generous bowls, fast service.", disclosureText: "Summarized with Gemini" },
  reviews: [{ text: "Great noodles", rating: 5, authorAttribution: { displayName: "Bo" }, relativePublishTimeDescription: "a week ago" }],
});

test("toPlace maps a Google-shaped object with method-style location", () => {
  const p = toPlace(gp(), "eat");
  assert.equal(p.id, "ChIJ123");
  assert.equal(p.name, "Hand Pulled Noodles");
  assert.equal(p.kind, "eat");
  assert.equal(p.type, "chinese_restaurant");
  assert.equal(p.lat, -37.8);
  assert.equal(p.lng, 144.98);
  assert.equal(p.rating, 4.6);
  assert.equal(p.ratingCount, 1234);
  assert.equal(p.price, 2);
  assert.deepEqual(p.priceRange, { from: 20, to: 40, currency: "AUD" });
  assert.deepEqual(p.hours.periods[0].open, { day: 1, hour: 11, minute: 0 });
  assert.equal(p.off, 660);
  assert.deepEqual(p.photo, { url: "https://photo.example/800", author: "Ann", authorUrl: "https://maps.example/ann" });
  assert.equal(p.mapsUrl, "https://maps.google.com/?cid=1");
  assert.deepEqual(p.summary, { text: "Generous bowls, fast service.", disclosure: "Summarized with Gemini" });
  assert.deepEqual(p.reviews, [{ text: "Great noodles", rating: 5, author: "Bo", when: "a week ago" }]);
});

test("toPlace reads plain-number locations and PRICE_LEVEL_ names", () => {
  const g = { ...gp(), location: { lat: -37.81, lng: 144.97 }, priceLevel: "PRICE_LEVEL_EXPENSIVE", displayName: { text: "Wine Room" } };
  const p = toPlace(g, "drink");
  assert.equal(p.lat, -37.81);
  assert.equal(p.price, 3);
  assert.equal(p.name, "Wine Room");
});

test("toPlace keeps a review summary given as a string or as {text}", () => {
  const g = { ...gp(), reviewSummary: { text: { text: "Cosy and friendly." }, disclosureText: { text: "AI summary" } }, reviews: [{ text: { text: "Lovely" }, rating: 4 }] };
  const p = toPlace(g, "eat");
  assert.deepEqual(p.summary, { text: "Cosy and friendly.", disclosure: "AI summary" });
  assert.equal(p.reviews[0].text, "Lovely");
  assert.equal(p.reviews[0].author, "");
});

test("toPlace: missing photos, hours and price become null", () => {
  const g = { id: "x", displayName: "Bare", location: { lat: -37.8, lng: 145 } };
  const p = toPlace(g, "sights");
  assert.equal(p.photo, null);
  assert.equal(p.hours, null);
  assert.equal(p.price, null);
  assert.equal(p.priceRange, null);
  assert.equal(p.summary, null);
  assert.deepEqual(p.reviews, []);
  assert.equal(p.rating, null);
  assert.equal(p.mapsUrl, null);
  assert.equal(toPlace({ ...g, photos: [{ getURI() { throw new Error("no"); } }] }, "eat").photo, null, "a photo that fails is dropped");
});

test("toPlace builds area from the formatted address and kind from the type", () => {
  assert.equal(toPlace(gp(), "eat").area, "Fitzroy");
  assert.equal(toPlace({ ...gp(), primaryType: "bar" }).kind, "drink");
  assert.equal(toPlace({ ...gp(), primaryType: "museum" }).kind, "sights");
  assert.equal(toPlace({ ...gp(), primaryType: "ice_cream_shop" }).kind, "dessert");
  assert.equal(toPlace({ ...gp(), primaryType: "cafe" }).kind, "coffee");
});

function fakeLib() {
  const calls = [];
  class Place {
    constructor({ id }) { this.id = id; }
    async fetchFields({ fields }) { calls.push({ fetch: fields }); Object.assign(this, gp(), { id: this.id }); return { place: this }; }
    static async searchByText(req) { calls.push({ search: req }); return { places: [gp()] }; }
  }
  return { lib: { Place, PriceLevel: { INEXPENSIVE: "INEXPENSIVE", MODERATE: "MODERATE", EXPENSIVE: "EXPENSIVE", VERY_EXPENSIVE: "VERY_EXPENSIVE" } }, calls };
}

test("googleProvider.search asks Google for the right area, budget and fields", async () => {
  const { lib, calls } = fakeLib();
  const g = googleProvider(lib);
  assert.equal(g.label, "Google Maps");
  const out = await g.search({ query: "restaurant", kind: "eat", center: CBD, radiusKm: 3, openNow: true, priceMax: 2, max: 12 });
  const req = calls[0].search;
  assert.equal(req.textQuery, "restaurant");
  assert.deepEqual(req.locationBias, { center: CBD, radius: 3000 });
  assert.equal(req.isOpenNow, true);
  assert.deepEqual(req.priceLevels, ["INEXPENSIVE", "MODERATE"]);
  assert.equal(req.maxResultCount, 12);
  assert.equal(req.region, "au");
  assert.ok(req.fields.includes("regularOpeningHours") && req.fields.includes("photos") && !req.fields.includes("reviews"));
  assert.equal(out[0].name, "Hand Pulled Noodles");
  await g.search({ query: "museum", kind: "sights", center: CBD, radiusKm: 80, openNow: false, priceMax: 1 });
  assert.equal(calls[1].search.priceLevels, undefined, "sights aren't priced, so no price filter");
  assert.equal(calls[1].search.isOpenNow, undefined);
  assert.equal(calls[1].search.locationBias.radius, 50000, "Google's radius limit");
});

test("googleProvider.details fetches the review fields and keeps travel annotations", async () => {
  const { lib, calls } = fakeLib();
  const p = await googleProvider(lib).details({ id: "ChIJ123", name: "x", kind: "eat", travel: 12, km: 4 });
  assert.ok(calls[0].fetch.includes("reviewSummary") && calls[0].fetch.includes("reviews"));
  assert.deepEqual(DETAIL_FIELDS.filter((f) => !SEARCH_FIELDS.includes(f)).sort(), ["reviewSummary", "reviews"]);
  assert.equal(p.summary.text, "Generous bowls, fast service.");
  assert.equal(p.travel, 12);
  assert.equal(p.km, 4);
});

test("testConnection reports which fields came back, or the error", async () => {
  const { lib } = fakeLib();
  const r = await testConnection(googleProvider(lib), { loadImage: async () => true });
  assert.equal(r.ok, true);
  for (const f of ["photo", "price", "priceRange", "rating", "hours", "mapsUrl", "summary", "reviews"]) assert.ok(r.fields.includes(f), f);
  const bad = await testConnection({ search: async () => { throw new Error("REQUEST_DENIED"); }, details: async (p) => p });
  assert.deepEqual(bad, { ok: false, fields: [], notes: [], error: "REQUEST_DENIED" });
});

test("sampleProvider is deterministic and labelled Sample", async () => {
  const s = sampleProvider();
  assert.equal(s.label, "Sample data");
  const q = { query: "restaurant", kind: "eat", center: CBD, radiusKm: 5, openNow: false, priceMax: null, max: 10 };
  const a = await s.search(q), b = await s.search(q);
  assert.deepEqual(a, b);
  assert.equal(a.length, 10);
  for (const p of a) {
    assert.ok(p.name.startsWith("Sample"), p.name);
    assert.equal(p.sample, true);
    assert.equal(p.photo, null);
  }
  const d = await s.details(a[0]);
  assert.ok(d.summary.text.length > 0);
  assert.ok(d.reviews.length >= 2);
});

test("sampleProvider places sit within radiusKm of the centre", async () => {
  const far = { lat: -37.66, lng: 145.45 };
  for (const p of await sampleProvider().search({ query: "lunch", kind: "eat", center: far, radiusKm: 15, max: 10 })) {
    assert.ok(haversineKm(far, p) <= 15, `${p.name} ${haversineKm(far, p)}`);
  }
});

test("sample hours include a place open past midnight and a 24-hour place", async () => {
  const eats = await sampleProvider().search({ query: "restaurant", kind: "eat", center: CBD, radiusKm: 8, max: 12 });
  const sat130 = new Date(2026, 10, 21, 1, 30);
  assert.ok(eats.some((p) => { const m = minutesLeft(p.hours, sat130, p.off); return m > 0 && m !== Infinity; }), "open past midnight");
  assert.ok(eats.some((p) => minutesLeft(p.hours, sat130, p.off) === Infinity), "24 hours");
  assert.ok(eats.some((p) => p.price == null), "some without a price");
});

// ---------- Final review fixes ----------
import { photoBlock } from "../spots/explore.js";

test("photos send the site's origin as referrer (keys are restricted to the website) and fall back to the tile", () => {
  const html = photoBlock({ id: "x", name: "N", kind: "eat", photo: { url: "https://places.googleapis.com/v1/x/media?key=K", author: "Ann", authorUrl: "https://a" } }, 0, false);
  assert.ok(html.includes("<img"));
  assert.ok(!html.includes("no-referrer"));
  assert.ok(html.includes("onerror"));
  assert.ok(html.includes('class="emo"'), "the tile sits underneath, ready if the photo fails");
});

test("search sends Google only lat and lng as the centre", async () => {
  const { lib, calls } = fakeLib();
  await googleProvider(lib).search({ query: "bar", kind: "drink", center: { lat: -37.8, lng: 144.9, fallback: true, t: 1 }, radiusKm: 3 });
  assert.deepEqual(Object.keys(calls[0].search.locationBias.center).sort(), ["lat", "lng"]);
});

test("a field Google rejects is dropped and remembered, not fatal", async () => {
  const { lib, calls } = fakeLib();
  const orig = lib.Place.searchByText;
  lib.Place.searchByText = async (req) => { if (req.fields.includes("priceRange")) throw new Error("Unknown field: priceRange"); return orig(req); };
  const proto = lib.Place.prototype.fetchFields;
  lib.Place.prototype.fetchFields = async function ({ fields }) { if (fields.includes("reviewSummary")) throw new Error("Unknown field: reviewSummary"); return proto.call(this, { fields }); };
  const g = googleProvider(lib);
  const out = await g.search({ query: "x", kind: "eat", center: CBD, radiusKm: 2 });
  assert.equal(out.length, 1);
  await g.search({ query: "y", kind: "eat", center: CBD, radiusKm: 2 });
  assert.ok(!calls.at(-1).search.fields.includes("priceRange"), "remembered: not asked again");
  const d = await g.details({ id: "ChIJ123", kind: "eat" });
  assert.equal(d.reviews.length, 1, "reviews still come back");
  assert.deepEqual(g.dropped().sort(), ["priceRange", "reviewSummary"]);
  const bad = googleProvider({ Place: { searchByText: async () => { throw new Error("REQUEST_DENIED"); } } });
  await assert.rejects(bad.search({ query: "x", kind: "eat", center: CBD, radiusKm: 2 }), /REQUEST_DENIED/);
});

test("testConnection loads a photo and reports fields Google refused", async () => {
  const { lib } = fakeLib();
  const g = googleProvider(lib);
  const okR = await testConnection(g, { loadImage: async () => true });
  assert.ok(okR.fields.includes("photo"));
  const failR = await testConnection(g, { loadImage: async () => { throw new Error("403"); } });
  assert.ok(!failR.fields.includes("photo"));
  assert.match(failR.notes.join(" "), /photo/i);
});

test("toPlace keeps a place's own kind when it's one the search allows", () => {
  assert.equal(toPlace({ ...gp(), primaryType: "bowling_alley" }, "sights", ["sights", "activities"]).kind, "activities");
  assert.equal(toPlace({ ...gp(), primaryType: "museum" }, "sights", ["sights", "activities"]).kind, "sights");
  assert.equal(toPlace({ ...gp(), primaryType: "restaurant" }, "coffee", ["coffee", "eat"]).kind, "eat");
  assert.equal(toPlace({ ...gp(), primaryType: "bar" }, "eat", ["eat"]).kind, "eat", "outside the allowed kinds: the search's kind");
});

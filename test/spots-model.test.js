import { test } from "node:test";
import assert from "node:assert/strict";
import {
  CBD, KINDS, kindOf, haversineKm, speedBand, travelMinutes, reachKm, fmtMinutes,
  priceLevelOf, priceSymbols, priceRangeLabel, fitsBudget, mapsUrl,
} from "../spots/model.js";

// 18 November 2026 is a Wednesday.
const wed = (h, m = 0) => new Date(2026, 10, 18, h, m);

// ---------- Task 1: travel model, prices and kinds ----------

test("travel model: 10 km at 1 pm on a Wednesday is about 31 min", () => {
  assert.equal(travelMinutes(10, { at: wed(13) }), 31);
});

test("travel model: the same 10 km at 11 pm is about 21 min", () => {
  assert.equal(travelMinutes(10, { at: wed(23) }), 21);
});

test("travel model: peak is slower than day", () => {
  assert.equal(speedBand(wed(8)), "peak");
  assert.equal(speedBand(wed(13)), "day");
  assert.equal(speedBand(wed(23)), "night");
  assert.equal(speedBand(new Date(2026, 10, 21, 8)), "day", "Saturday morning is not peak");
  assert.ok(travelMinutes(10, { at: wed(8) }) > travelMinutes(10, { at: wed(13) }));
});

test("travel model: 40 km uses the highway speed beyond 15 km", () => {
  // 52 road km: 15 km at 30 km/h (30 min) + 37 km at 85 km/h (26.1 min) + 5 min parking
  assert.equal(travelMinutes(40, { at: wed(13) }), 61);
});

test("travel model: walking 1 km is about 17 min", () => {
  assert.equal(travelMinutes(1, { mode: "walk", at: wed(13) }), 17);
});

test("reachKm inverts travelMinutes within 0.5 km and caps at 50", () => {
  for (const at of [wed(8), wed(13), wed(23)]) {
    for (const min of [15, 30, 45, 90]) {
      const km = reachKm(min, { at });
      if (km < 50) assert.ok(Math.abs(travelMinutes(km, { at }) - min) <= 1, `${min} min at ${at.getHours()}h`);
    }
  }
  assert.equal(reachKm(600, { at: wed(13) }), 50);
  assert.equal(reachKm(3, { at: wed(13) }), 0, "less than the parking time reaches nowhere");
  assert.ok(Math.abs(reachKm(17, { mode: "walk", at: wed(13) }) - 1) < 0.05);
  assert.ok(reachKm(30, { at: wed(23) }) > 1.5 * reachKm(30, { at: wed(17) }), "night reaches much further");
});

test("fmtMinutes formats minutes and hours", () => {
  assert.equal(fmtMinutes(25), "about 25 min");
  assert.equal(fmtMinutes(70), "about 1 h 10 min");
  assert.equal(fmtMinutes(120), "about 2 h");
});

test("haversineKm: CBD to St Kilda is about 5.6 km", () => {
  const km = haversineKm(CBD, { lat: -37.8676, lng: 144.9809 });
  assert.ok(km > 5.3 && km < 6.3, String(km));
});

test("kinds carry a visit length, a search query and whether Google prices them", () => {
  assert.deepEqual(KINDS.map((k) => k.id), ["eat", "drink", "coffee", "sights", "activities", "dessert"]);
  assert.equal(kindOf("eat").visit, 60);
  assert.equal(kindOf("activities").visit, 90);
  assert.equal(kindOf("sights").priced, false);
  assert.equal(kindOf("nonsense").id, "eat");
});

test("priceLevelOf reads MODERATE, PRICE_LEVEL_EXPENSIVE and 3", () => {
  assert.equal(priceLevelOf("MODERATE"), 2);
  assert.equal(priceLevelOf("PRICE_LEVEL_EXPENSIVE"), 3);
  assert.equal(priceLevelOf("very_expensive"), 4);
  assert.equal(priceLevelOf(3), 3);
  assert.equal(priceLevelOf("FREE"), 0);
  assert.equal(priceLevelOf(undefined), null);
  assert.equal(priceLevelOf("PRICE_LEVEL_UNSPECIFIED"), null);
});

test("priceSymbols and priceRangeLabel", () => {
  assert.equal(priceSymbols(null), "");
  assert.equal(priceSymbols(0), "Free");
  assert.equal(priceSymbols(2), "$$");
  assert.equal(priceRangeLabel({ from: 20, to: 40, currency: "AUD" }), "A$20–40");
  assert.equal(priceRangeLabel({ from: 100, to: null, currency: "AUD" }), "A$100+");
  assert.equal(priceRangeLabel({ from: 1000, to: 2000, currency: "JPY" }), "JPY 1000–2000");
  assert.equal(priceRangeLabel(null), "");
});

test("fitsBudget treats unknown price as fitting", () => {
  assert.equal(fitsBudget({ price: 3 }, 2), false);
  assert.equal(fitsBudget({ price: 2 }, 2), true);
  assert.equal(fitsBudget({ price: null }, 1), true);
  assert.equal(fitsBudget({ price: 4 }, null), true);
});

test("mapsUrl builds a search link with the place id", () => {
  const u = mapsUrl({ id: "ChIJabc", name: "Noodle Bar", area: "Fitzroy" });
  assert.equal(u, "https://www.google.com/maps/search/?api=1&query=Noodle%20Bar%2C%20Fitzroy&query_place_id=ChIJabc");
  assert.equal(mapsUrl({ id: "x", name: "A", mapsUrl: "https://maps.google.com/?cid=1" }), "https://maps.google.com/?cid=1");
  assert.ok(!mapsUrl({ id: "s1", name: "Sample cafe", area: "CBD", sample: true }).includes("query_place_id"));
});

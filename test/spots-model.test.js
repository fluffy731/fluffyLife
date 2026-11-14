import { test } from "node:test";
import assert from "node:assert/strict";
import {
  CBD, KINDS, kindOf, haversineKm, speedBand, travelMinutes, reachKm, fmtMinutes,
  priceLevelOf, priceSymbols, priceRangeLabel, fitsBudget, mapsUrl,
  minutesLeft, isOpenAt, nextOpen, hoursLabel, dayHours,
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

// ---------- Task 2: opening hours ----------

const everyDay = (oh, om, ch, cm, nextDay) =>
  ({ periods: [0, 1, 2, 3, 4, 5, 6].map((d) => ({ open: { day: d, hour: oh, minute: om }, close: { day: nextDay ? (d + 1) % 7 : d, hour: ch, minute: cm } })) });
const bar = everyDay(16, 0, 2, 0, true); // 4 pm to 2 am, every night
const sat = (h, m = 0) => new Date(2026, 10, 21, h, m); // Saturday
const sun = (h, m = 0) => new Date(2026, 10, 22, h, m); // Sunday

test("bar open 16:00–02:00: open at 01:30 Saturday with 30 min left", () => {
  assert.equal(minutesLeft(bar, sat(1, 30), null), 30);
  assert.equal(isOpenAt(bar, sat(1, 30), null), true);
});

test("bar open 16:00–02:00: closed at 03:00", () => {
  assert.equal(minutesLeft(bar, sat(3), null), 0);
  assert.equal(isOpenAt(bar, sat(3), null), false);
});

test("bar open 16:00–02:00: label at 23:00 is Open till 2 am", () => {
  assert.equal(hoursLabel(bar, wed(23), null), "Open till 2 am");
});

test("Saturday-night period wraps into Sunday", () => {
  assert.equal(minutesLeft(bar, sun(1), null), 60);
});

test("24-hour place (single period, no close) is open with Infinity left", () => {
  const h = { periods: [{ open: { day: 0, hour: 0, minute: 0 }, close: null }] };
  assert.equal(minutesLeft(h, wed(4), null), Infinity);
  assert.equal(hoursLabel(h, wed(4), null), "Open 24 hours");
});

test("back-to-back periods chain into one stretch", () => {
  const h = { periods: [
    { open: { day: 1, hour: 0, minute: 0 }, close: { day: 2, hour: 0, minute: 0 } },
    { open: { day: 2, hour: 0, minute: 0 }, close: { day: 3, hour: 0, minute: 0 } },
  ] };
  assert.equal(minutesLeft(h, new Date(2026, 10, 16, 23, 0), null), 1500); // Monday 11 pm
});

test("closed place labels its next opening, naming the day when it isn't today", () => {
  const cafe = { periods: [1, 2, 3, 4, 5].map((d) => ({ open: { day: d, hour: 7, minute: 0 }, close: { day: d, hour: 15, minute: 0 } })) };
  assert.equal(hoursLabel(cafe, wed(6), null), "Closed · opens 7 am");
  assert.equal(hoursLabel(cafe, wed(16), null), "Closed · opens Thu 7 am");
  assert.equal(nextOpen(cafe, wed(16), null).getTime(), new Date(2026, 10, 19, 7, 0).getTime());
  assert.equal(hoursLabel(cafe, sat(10), null), "Closed · opens Mon 7 am");
});

test("unknown hours give null and Hours unknown", () => {
  for (const h of [null, undefined, { periods: [] }]) {
    assert.equal(minutesLeft(h, wed(12), null), null);
    assert.equal(isOpenAt(h, wed(12), null), null);
    assert.equal(hoursLabel(h, wed(12), null), "Hours unknown");
  }
});

test("utc offset: a place at +660 is evaluated in its own time", () => {
  const h = everyDay(9, 0, 17, 0, false);
  assert.equal(isOpenAt(h, new Date(Date.UTC(2026, 10, 18, 21, 30)), 660), false); // 8:30 am Thursday there
  assert.equal(minutesLeft(h, new Date(Date.UTC(2026, 10, 18, 22, 30)), 660), 450); // 9:30 am there
  assert.equal(hoursLabel(h, new Date(Date.UTC(2026, 10, 18, 22, 30)), 660), "Open till 5 pm");
});

test("dayHours joins split lunch and dinner periods", () => {
  const h = { periods: [
    { open: { day: 3, hour: 11, minute: 30 }, close: { day: 3, hour: 14, minute: 30 } },
    { open: { day: 3, hour: 17, minute: 30 }, close: { day: 3, hour: 22, minute: 0 } },
    { open: { day: 4, hour: 18, minute: 0 }, close: { day: 5, hour: 0, minute: 0 } },
  ] };
  assert.equal(dayHours(h, 3), "11:30 am – 2:30 pm, 5:30 pm – 10 pm");
  assert.equal(dayHours(h, 4), "6 pm – midnight");
  assert.equal(dayHours(h, 1), "Closed");
  assert.equal(dayHours({ periods: [{ open: { day: 0, hour: 0, minute: 0 }, close: null }] }, 2), "Open 24 hours");
  assert.equal(dayHours(null, 2), "");
});

test("dayHours: a day open midnight to midnight reads Open 24 hours", () => {
  const h = { periods: [{ open: { day: 5, hour: 0, minute: 0 }, close: { day: 6, hour: 0, minute: 0 } }] };
  assert.equal(dayHours(h, 5), "Open 24 hours");
});

import { test } from "node:test";
import assert from "node:assert/strict";
import {
  CBD, KINDS, kindOf, haversineKm, speedBand, travelMinutes, reachKm, fmtMinutes,
  priceLevelOf, priceSymbols, priceRangeLabel, fitsBudget, mapsUrl,
  minutesLeft, isOpenAt, nextOpen, hoursLabel, dayHours,
  score, driveBudget, pickNow, lateStart, pickLate, DAY_SLOTS, slotTimes, buildDayPlan, tomorrow,
  KEY, blank, load, save, areaFromAddress, savePlace, unsave, isSaved, staleSaved, addStamp, passportStats,
  backupJSON, mergeBackup, noteRegion,
} from "../spots/model.js";
import { REGIONS, surpriseRegion } from "../spots/regions.js";

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

// ---------- Task 3: choosing places ----------

const north = (km) => ({ lat: CBD.lat + km / 111.2, lng: CBD.lng });
const place = (id, o = {}) => ({ id, name: id, kind: "eat", ...north(o.km ?? 1), rating: 4.5, ratingCount: 200, price: 2,
  hours: everyDay(11, 0, 23, 0, false), off: null, ...o });

test("pickNow: 2 hours for Eat allows 30 min each way and drops a place 40 min away", () => {
  assert.equal(driveBudget(120, 60), 30);
  assert.equal(driveBudget(60, 60), 5, "never below 5 minutes");
  const out = pickNow([place("near", { km: 3 }), place("far", { km: 20 })], { from: CBD, at: wed(13), minutes: 120, mode: "drive", priceMax: null, kind: "eat" });
  assert.deepEqual(out.map((p) => p.id), ["near"]);
  assert.equal(out[0].travel, 13);
  assert.ok(Math.abs(out[0].km - 3) < 0.1);
});

test("pickNow: drops a place closing in 45 min", () => {
  const closing = place("closing", { hours: everyDay(11, 0, 13, 45, false) });
  const open = place("open", { hours: everyDay(11, 0, 15, 0, false) });
  const out = pickNow([closing, open], { from: CBD, at: wed(13), minutes: 120, mode: "drive", priceMax: null, kind: "eat" });
  assert.deepEqual(out.map((p) => p.id), ["open"]);
});

test("pickNow: drops places with unknown hours", () => {
  const out = pickNow([place("unknown", { hours: null })], { from: CBD, at: wed(13), minutes: 120, mode: "drive", priceMax: null, kind: "eat" });
  assert.equal(out.length, 0);
});

test("pickNow: respects budget but keeps unknown price", () => {
  const out = pickNow([place("dear", { price: 3 }), place("cheap", { price: 1 }), place("unpriced", { price: null })],
    { from: CBD, at: wed(13), minutes: 120, mode: "drive", priceMax: 2, kind: "eat" });
  assert.deepEqual(out.map((p) => p.id).sort(), ["cheap", "unpriced"]);
});

test("pickNow: better-rated places come first, duplicates removed", () => {
  const a = place("a", { rating: 4.0 }), b = place("b", { rating: 4.8 });
  const out = pickNow([a, b, a], { from: CBD, at: wed(13), minutes: 120, mode: "drive", priceMax: null, kind: "eat" });
  assert.deepEqual(out.map((p) => p.id), ["b", "a"]);
});

test("score: Bayesian rating, unknown rating counts as 3.5", () => {
  assert.equal(score({ rating: 4.0, ratingCount: 50 }), 4.0);
  assert.ok(score({ rating: 5, ratingCount: 2 }) < score({ rating: 4.6, ratingCount: 900 }), "two 5-star reviews don't beat 900 at 4.6");
  assert.equal(score({ rating: null, ratingCount: 0 }), 3.5);
});

test("pickLate: in the afternoon starts tonight at 22:00 and labels tonight", () => {
  const s = lateStart(wed(15));
  assert.equal(s.tonight, true);
  assert.equal(s.at.getTime(), wed(22).getTime());
  assert.deepEqual(lateStart(wed(23, 30)), { at: wed(23, 30), tonight: false });
  const twoAm = new Date(2026, 10, 19, 2, 0);
  assert.deepEqual(lateStart(twoAm), { at: twoAm, tonight: false });
});

test("pickLate: sorts the 3 am closer before the midnight closer and needs an hour left", () => {
  const midnight = place("midnight", { hours: everyDay(17, 0, 0, 0, true) });
  const three = place("three", { hours: everyDay(17, 0, 3, 0, true), rating: 4.0 });
  const soon = place("soon", { hours: everyDay(17, 0, 22, 30, false) });
  const out = pickLate([midnight, three, soon], { from: CBD, at: wed(22), maxMinutes: 30, priceMax: null });
  assert.deepEqual(out.map((p) => p.id), ["three", "midnight"]);
});

test("pickLate: reaches further than the same minutes by day", () => {
  const far = place("far", { km: 20, hours: everyDay(17, 0, 3, 0, true) });
  assert.equal(pickLate([far], { from: CBD, at: wed(23), maxMinutes: 30, priceMax: null }).length, 1);
  assert.equal(pickNow([far], { from: CBD, at: wed(17), minutes: 120, mode: "drive", priceMax: null, kind: "eat" }).length, 0);
});

test("slotTimes shifts the day by the start time", () => {
  const day = tomorrow(wed(20));
  assert.equal(day.getTime(), new Date(2026, 10, 19).getTime());
  const t = slotTimes(DAY_SLOTS.relaxed, "10:00", day);
  assert.deepEqual(t.map((d) => d.getHours() * 60 + d.getMinutes()), [600, 690, 810, 930]);
  assert.equal(DAY_SLOTS.relaxed.length, 4);
  assert.equal(DAY_SLOTS.full.length, 5);
  assert.equal(DAY_SLOTS.full.at(-1).id, "dinner");
});

test("buildDayPlan: four relaxed stops, no repeats, each open at its time", () => {
  const day = tomorrow(wed(20));
  const shared = place("shared", { km: 2, rating: 4.9, ratingCount: 999, hours: everyDay(7, 0, 22, 0, false) });
  const cands = {
    breakfast: [shared, place("cafe", { km: 2, hours: everyDay(7, 0, 15, 0, false) })],
    morning: [shared, place("gallery", { km: 3, hours: everyDay(10, 0, 17, 0, false) })],
    lunch: [place("bistro", { km: 3 })],
    afternoon: [place("park", { km: 4, hours: everyDay(0, 0, 0, 0, true) })],
  };
  const plan = buildDayPlan(DAY_SLOTS.relaxed, cands, { start: CBD, day, startTime: "09:00", priceMax: null });
  assert.deepEqual(plan.map((s) => s.place && s.place.id), ["shared", "gallery", "bistro", "park"]);
  for (const s of plan) assert.ok(minutesLeft(s.place.hours, s.at, null) >= s.slot.visit, s.slot.id);
  assert.ok(plan[0].travel > 0);
});

test("buildDayPlan: a slot with no open candidate gives place null, not a closed place", () => {
  const day = tomorrow(wed(20));
  const cands = { breakfast: [place("dinnerOnly", { hours: everyDay(17, 0, 22, 0, false) })], morning: [], lunch: [], afternoon: [] };
  const plan = buildDayPlan(DAY_SLOTS.relaxed, cands, { start: CBD, day, priceMax: null });
  assert.equal(plan[0].place, null);
  assert.equal(plan[0].travel, null);
});

test("buildDayPlan: prefers the nearer of two equal-score places and offers alternatives", () => {
  const day = tomorrow(wed(20));
  const cands = { breakfast: [place("near", { km: 1, hours: everyDay(7, 0, 15, 0, false) }), place("far", { km: 25, hours: everyDay(7, 0, 15, 0, false) })], morning: [], lunch: [], afternoon: [] };
  const plan = buildDayPlan(DAY_SLOTS.relaxed, cands, { start: CBD, day, priceMax: null });
  assert.equal(plan[0].place.id, "near");
  assert.deepEqual(plan[0].alternatives.map((p) => p.id), ["far"]);
});

test("buildDayPlan respects the budget", () => {
  const day = tomorrow(wed(20));
  const cands = { breakfast: [place("dear", { price: 4, hours: everyDay(7, 0, 15, 0, false) })], morning: [], lunch: [], afternoon: [] };
  assert.equal(buildDayPlan(DAY_SLOTS.relaxed, cands, { start: CBD, day, priceMax: 2 })[0].place, null);
});

test("REGIONS have ten entries with lat/lng inside Victoria", () => {
  assert.equal(REGIONS.length, 10);
  assert.equal(new Set(REGIONS.map((r) => r.id)).size, 10);
  for (const r of REGIONS) {
    assert.ok(r.lat < -34 && r.lat > -39.2 && r.lng > 140.9 && r.lng < 150, r.id);
    assert.ok(r.name && r.blurb, r.id);
  }
});

test("surpriseRegion skips recent regions", () => {
  const recent = REGIONS.slice(1).map((r) => r.id);
  assert.equal(surpriseRegion(recent, () => 0.99).id, REGIONS[0].id);
  assert.ok(REGIONS.includes(surpriseRegion(REGIONS.map((r) => r.id), () => 0)), "all recent: still picks one");
});

// ---------- Task 4: storage, stamps and backup ----------

const fakeLS = (init = {}) => { const m = { ...init }; return { getItem: (k) => (k in m ? m[k] : null), setItem: (k, v) => { m[k] = String(v); }, m }; };
const gPlace = place("ChIJ1", { name: "Noodle Bar", area: "Fitzroy", kind: "eat", photo: { url: "https://x" }, summary: { text: "Great" }, rating: 4.6 });

test("load survives junk and missing storage", () => {
  assert.deepEqual(load(fakeLS()), blank());
  assert.deepEqual(load(fakeLS({ [KEY]: "{not json" })), blank());
  assert.deepEqual(load({ getItem() { throw new Error("blocked"); } }), blank());
  const s = load(fakeLS({ [KEY]: JSON.stringify({ saved: [{ id: 1 }, { id: "a", name: "A", lat: 1, lng: 2 }], stamps: "x", settings: { theme: "neon", key: 5, sample: true } }) }));
  assert.deepEqual(s.saved.map((x) => x.id), ["a"]);
  assert.deepEqual(s.stamps, []);
  assert.equal(s.settings.theme, "auto");
  assert.equal(s.settings.key, "");
  assert.equal(s.settings.sample, true);
});

test("save then load round-trips", () => {
  const ls = fakeLS();
  const s = savePlace(blank(), gPlace, new Date(2026, 10, 14));
  save(ls, s);
  assert.deepEqual(load(ls).saved, s.saved);
  assert.doesNotThrow(() => save({ setItem() { throw new Error("full"); } }, s));
});

test("savePlace keeps only the allowed fields", () => {
  const s = savePlace(blank(), gPlace, new Date(2026, 10, 14, 10));
  assert.deepEqual(Object.keys(s.saved[0]).sort(), ["area", "fetchedAt", "id", "kind", "lat", "lng", "name", "savedAt"]);
  assert.equal(isSaved(s, "ChIJ1"), true);
  assert.equal(savePlace(s, gPlace, new Date()).saved.length, 1, "saving twice keeps one");
  assert.equal(isSaved(unsave(s, "ChIJ1"), "ChIJ1"), false);
  assert.equal(savePlace(blank(), { ...gPlace, sample: true }, new Date()).saved[0].sample, true);
});

test("areaFromAddress reads Fitzroy and falls back", () => {
  assert.equal(areaFromAddress("123 Smith St, Fitzroy VIC 3065, Australia"), "Fitzroy");
  assert.equal(areaFromAddress("Shop 2/10 Elgin St, Carlton North VIC 3054, Australia"), "Carlton North");
  assert.equal(areaFromAddress("1 Chome-1-2 Oshiage, Sumida City, Tokyo 131-0045, Japan"), "Tokyo 131-0045");
  assert.equal(areaFromAddress(""), "");
  assert.equal(areaFromAddress(null), "");
});

test("staleSaved finds entries older than 30 days", () => {
  let s = savePlace(blank(), gPlace, new Date(2026, 9, 1));
  s = savePlace(s, { ...gPlace, id: "fresh" }, new Date(2026, 10, 10));
  s = savePlace(s, { ...gPlace, id: "sample1", sample: true }, new Date(2026, 8, 1));
  assert.deepEqual(staleSaved(s, new Date(2026, 10, 14)), ["ChIJ1"]);
});

test("addStamp records today's date and the area", () => {
  const { state, stamp } = addStamp(blank(), { place: gPlace, rating: 5, note: "Spicy", photoId: "p1", date: new Date(2026, 10, 14, 21) });
  assert.equal(stamp.date, "2026-11-14");
  assert.equal(stamp.area, "Fitzroy");
  assert.equal(stamp.placeId, "ChIJ1");
  assert.equal(stamp.rating, 5);
  assert.equal(state.stamps[0], stamp);
  const second = addStamp(state, { place: { name: "Somewhere", area: "" }, rating: 9, date: new Date(2026, 10, 15) });
  assert.equal(second.state.stamps[0].name, "Somewhere");
  assert.equal(second.state.stamps[0].rating, 5, "rating is clamped to 1–5");
  assert.equal(second.state.stamps.length, 2);
});

test("passportStats counts distinct places and suburbs", () => {
  let s = blank();
  for (const [id, area] of [["a", "Fitzroy"], ["a", "Fitzroy"], ["b", "Carlton"], ["c", ""]]) s = addStamp(s, { place: { id, name: id, area }, rating: 4, date: new Date() }).state;
  assert.deepEqual(passportStats(s), { stamps: 4, places: 3, suburbs: 2 });
});

test("noteRegion keeps the last three regions, newest first", () => {
  let s = blank();
  for (const id of ["a", "b", "c", "a", "d"]) s = noteRegion(s, id);
  assert.deepEqual(s.recentRegions, ["d", "a", "c"]);
});

test("backup leaves out settings and the key", () => {
  const s = { ...addStamp(savePlace(blank(), gPlace, new Date()), { place: gPlace, rating: 4, photoId: "p1", date: new Date() }).state, settings: { ...blank().settings, key: "AIzaSECRET" } };
  const txt = backupJSON(s, { p1: "data:image/jpeg;base64,AAA" }, new Date(2026, 10, 14));
  assert.ok(!txt.includes("AIzaSECRET"));
  const o = JSON.parse(txt);
  assert.equal(o.app, "spots");
  assert.equal(o.v, 1);
  assert.equal(o.photos.p1, "data:image/jpeg;base64,AAA");
  assert.equal(o.settings, undefined);
});

test("mergeBackup on a phone with stamps adds new ones, keeps existing, no duplicates", () => {
  const a = addStamp(blank(), { place: { id: "x", name: "Mine", area: "CBD" }, rating: 4, date: new Date(2026, 10, 1) });
  const b = addStamp(a.state, { place: { id: "y", name: "Backed up", area: "Carlton" }, rating: 5, photoId: "ph", date: new Date(2026, 10, 2) });
  const txt = backupJSON(savePlace(b.state, gPlace, new Date()), { ph: "data:image/jpeg;base64,BBB" }, new Date());
  const phone = addStamp(a.state, { place: { id: "z", name: "Only on phone", area: "" }, rating: 3, date: new Date(2026, 10, 3) }).state;
  const { state, photos, added } = mergeBackup(phone, txt);
  assert.deepEqual(state.stamps.map((s) => s.name).sort(), ["Backed up", "Mine", "Only on phone"]);
  assert.equal(state.saved.length, 1);
  assert.equal(added, 2);
  assert.deepEqual(photos, { ph: "data:image/jpeg;base64,BBB" });
  assert.equal(mergeBackup(state, txt).added, 0, "restoring twice adds nothing");
  assert.deepEqual(state.stamps.map((s) => s.date), [...state.stamps.map((s) => s.date)].sort().reverse(), "newest first");
});

test("mergeBackup rejects other files", () => {
  assert.throws(() => mergeBackup(blank(), "{}"), /Not a Spots backup/);
  assert.throws(() => mergeBackup(blank(), "not json"), /Not a Spots backup/);
  assert.throws(() => mergeBackup(blank(), JSON.stringify({ trips: [] })), /Not a Spots backup/);
});

import { test } from "node:test";
import assert from "node:assert/strict";
import {
  CBD, CUISINES, cuisineOf, cuisineLabel, fitsCuisine, queriesOf, pickNow, pickLate, pickNear, buildDayPlan, daySlots, whyEmpty,
  DISTANCES, kmFromStep, stepFromKm, fmtKm, distanceHint, nearRange, rangeKm, travelMinutes, haversineKm, tomorrow,
} from "../spots/model.js";
import { toPlace, SEARCH_FIELDS } from "../spots/places.js";
import { sampleProvider } from "../spots/samples.js";

// 18 November 2026 is a Wednesday.
const wed = (h, m = 0) => new Date(2026, 10, 18, h, m);
const everyDay = (oh, om, ch, cm, nextDay) =>
  ({ periods: [0, 1, 2, 3, 4, 5, 6].map((d) => ({ open: { day: d, hour: oh, minute: om }, close: { day: nextDay ? (d + 1) % 7 : d, hour: ch, minute: cm } })) });
const north = (km) => ({ lat: CBD.lat + km / 111.2, lng: CBD.lng });
const place = (id, o = {}) => ({ id, name: id, kind: "eat", ...north(o.km ?? 1), rating: 4.5, ratingCount: 200, price: 2,
  hours: everyDay(11, 0, 23, 0, false), off: null, ...o });

// ---------- Cuisine ----------

test("cuisines lead with Cantonese, Chinese and Korean, each with a search to ask Google", () => {
  assert.deepEqual(CUISINES.slice(0, 3).map((c) => c.id), ["cantonese", "chinese", "korean"]);
  for (const c of CUISINES) assert.ok(c.id && c.label && c.query, `${c.id} has an id, a label and a query`);
  assert.equal(new Set(CUISINES.map((c) => c.id)).size, CUISINES.length, "ids are unique");
});

test("queriesOf Eat asks for each chosen cuisine, other kinds are unchanged", () => {
  assert.deepEqual(queriesOf("eat"), ["restaurant"]);
  assert.deepEqual(queriesOf("eat", new Set()), ["restaurant"], "no cuisine chosen: any");
  assert.deepEqual(queriesOf("eat", new Set(["korean", "cantonese"])), ["Cantonese restaurant", "Korean restaurant"], "in the cuisine list's order");
  assert.deepEqual(queriesOf("coffee", new Set(["korean"])), ["cafe"], "a cuisine only changes Eat");
  assert.deepEqual(queriesOf("nature", new Set(["korean"])), ["park", "walking trail"]);
});

test("cuisineOf reads Google's primary type, and tells Cantonese from other Chinese by name", () => {
  assert.equal(cuisineOf({ type: "korean_restaurant", name: "Seoul Soul" }), "korean");
  assert.equal(cuisineOf({ type: "chinese_restaurant", name: "Golden Dragon" }), "chinese");
  assert.equal(cuisineOf({ type: "chinese_restaurant", name: "Rooftop Yum Cha House" }), "cantonese");
  assert.equal(cuisineOf({ type: "chinese_restaurant", name: "Hong Kong Cafe" }), "cantonese");
  assert.equal(cuisineOf({ type: "ramen_restaurant", name: "Ippudo" }), "japanese");
  assert.equal(cuisineOf({ type: "sushi_restaurant", name: "Sushi Hub" }), "japanese");
  assert.equal(cuisineOf({ type: "restaurant", name: "The Local" }), null, "a general restaurant has no cuisine");
  assert.equal(cuisineOf({ type: "", name: "Mystery" }), null);
  assert.equal(cuisineOf({}), null);
});

test("cuisineLabel is the name to show on a card, from the cuisine or Google's own words", () => {
  assert.equal(cuisineLabel({ type: "korean_restaurant", name: "Seoul Soul" }), "Korean");
  assert.equal(cuisineLabel({ type: "restaurant", typeLabel: "Fast Food Restaurant", name: "x" }), "Fast Food Restaurant");
  assert.equal(cuisineLabel({ type: "restaurant", name: "x" }), "");
});

test("fitsCuisine drops places of another known cuisine and keeps the ones Google couldn't type", () => {
  const korean = new Set(["korean"]);
  assert.equal(fitsCuisine({ type: "korean_restaurant", name: "A" }, korean), true);
  assert.equal(fitsCuisine({ type: "italian_restaurant", name: "B" }, korean), false);
  assert.equal(fitsCuisine({ type: "restaurant", name: "Korean fried chicken" }, korean), true, "untyped: Google's search already picked it");
  assert.equal(fitsCuisine({ type: "korean_restaurant", name: "A" }, new Set()), true, "no cuisine chosen: everything fits");
  // Google has one Chinese type, so a Cantonese search keeps Chinese places and a Chinese search keeps Cantonese ones.
  assert.equal(fitsCuisine({ type: "chinese_restaurant", name: "Golden Dragon" }, new Set(["cantonese"])), true);
  assert.equal(fitsCuisine({ type: "chinese_restaurant", name: "Yum Cha Palace" }, new Set(["chinese"])), true);
  assert.equal(fitsCuisine({ type: "korean_restaurant", name: "A" }, new Set(["cantonese", "chinese"])), false);
  assert.equal(fitsCuisine({ type: "korean_restaurant", name: "A" }, new Set(["cantonese", "korean"])), true, "any of several");
});

test("pickNow with a cuisine keeps only that cuisine's Eat places, and never filters other kinds", () => {
  const list = [place("k", { type: "korean_restaurant" }), place("i", { type: "italian_restaurant" }),
    place("cafe", { kind: "coffee", type: "italian_restaurant" })];
  const opts = { from: CBD, at: wed(13), minutes: 120, mode: "drive", priceMax: null, kind: "eat" };
  assert.deepEqual(pickNow(list, { ...opts, cuisines: new Set(["korean"]) }).map((p) => p.id).sort(), ["cafe", "k"]);
  assert.equal(pickNow(list, opts).length, 3, "no cuisine: all");
});

test("pickLate and pickNear honour a cuisine too", () => {
  const night = everyDay(17, 0, 3, 0, true);
  const late = [place("k", { type: "korean_restaurant", hours: night }), place("i", { type: "italian_restaurant", hours: night })];
  assert.deepEqual(pickLate(late, { from: CBD, at: wed(23), maxMinutes: 30, priceMax: null, cuisines: new Set(["korean"]) }).map((p) => p.id), ["k"]);
  const near = [place("k", { type: "korean_restaurant", km: 0.3, rating: 4.8, ratingCount: 2000 }), place("i", { type: "italian_restaurant", km: 0.3, rating: 4.8, ratingCount: 2000 })];
  assert.deepEqual(pickNear(near, { center: CBD, range: "w1", cuisines: new Set(["korean"]) }).places.map((p) => p.id), ["k"]);
});

test("a day plan's lunch and dinner follow the chosen cuisine, breakfast does not", () => {
  const slots = daySlots("full", null);
  const day = tomorrow(wed(10));
  const cands = {};
  for (const s of slots) cands[s.id] = [place(`${s.id}-it`, { kind: s.kinds[0], type: "italian_restaurant", hours: everyDay(0, 0, 23, 59, false) }),
    place(`${s.id}-kr`, { kind: s.kinds[0], type: "korean_restaurant", hours: everyDay(0, 0, 23, 59, false), rating: 4.0 })];
  const plan = buildDayPlan(slots, cands, { start: CBD, day, startTime: "09:00", priceMax: null, cuisines: new Set(["korean"]) });
  const by = Object.fromEntries(plan.map((s) => [s.slot.id, s.place && s.place.id]));
  assert.equal(by.lunch, "lunch-kr");
  assert.equal(by.dinner, "dinner-kr");
  assert.equal(by.breakfast, "breakfast-it", "breakfast is a coffee stop: left alone (the better-rated or nearer one wins as before)");
});

test("Google's search asks for the place's type name, and the place keeps it", () => {
  assert.ok(SEARCH_FIELDS.includes("primaryTypeDisplayName"));
  const p = toPlace({ id: "x", displayName: "Seoul Soul", location: { lat: -37.8, lng: 144.9 }, primaryType: "korean_restaurant",
    primaryTypeDisplayName: { text: "Korean Restaurant", languageCode: "en" } }, "eat");
  assert.equal(p.typeLabel, "Korean Restaurant");
  assert.equal(toPlace({ id: "y", displayName: "n", location: { lat: 1, lng: 2 } }, "eat").typeLabel, "");
});

test("whyEmpty names the cuisine when nothing of it was found at all", () => {
  const list = [place("i", { type: "italian_restaurant" })];
  const opts = { from: CBD, at: wed(13), minutes: 180, mode: "drive", priceMax: null, kind: "eat" };
  assert.equal(whyEmpty(list, { ...opts, cuisines: new Set(["korean"]) }), "cuisine");
  assert.notEqual(whyEmpty(list, { ...opts, cuisines: new Set(["italian"]) }), "cuisine");
});

test("sample places show cuisines when a cuisine is asked for", async () => {
  const sp = sampleProvider();
  const korean = await sp.search({ query: "Korean restaurant", kind: "eat", center: CBD, radiusKm: 5 });
  assert.ok(korean.length > 0);
  assert.ok(korean.every((p) => cuisineOf(p) === "korean"), "every sample is Korean");
  const any = await sp.search({ query: "restaurant", kind: "eat", center: CBD, radiusKm: 5 });
  assert.ok(new Set(any.map((p) => cuisineOf(p))).size > 1, "no cuisine: a mix");
});

// ---------- Distance ----------

test("distance steps run from 500 m to Google's 50 km limit, in order", () => {
  assert.equal(DISTANCES[0], 0.5);
  assert.equal(DISTANCES.at(-1), 50);
  assert.deepEqual([...DISTANCES], [...DISTANCES].sort((a, b) => a - b));
  assert.ok(DISTANCES.includes(1) && DISTANCES.includes(5) && DISTANCES.includes(10));
});

test("fmtKm: metres under a kilometre, no needless decimals", () => {
  assert.equal(fmtKm(0.5), "500 m");
  assert.equal(fmtKm(1), "1 km");
  assert.equal(fmtKm(1.5), "1.5 km");
  assert.equal(fmtKm(12), "12 km");
  assert.equal(fmtKm(50), "50 km");
});

test("distanceHint says how long that is by car, and on foot when it's short", () => {
  const at = wed(13);
  assert.equal(distanceHint(1, { at }), `${"about " + travelMinutes(1, { at }) + " min"} drive · ${"about " + travelMinutes(1, { mode: "walk", at }) + " min"} walk`);
  assert.ok(!distanceHint(10, { at }).includes("walk"), "no walking time for 10 km");
  assert.ok(distanceHint(10, { at }).endsWith("drive"));
});

test("a typed distance is a range: its km, walking when it's short, driving when it's not", () => {
  const r = nearRange("km:3.5");
  assert.equal(r.km, 3.5);
  assert.equal(r.mode, "drive");
  assert.equal(r.label, "3.5 km radius", "reads as \"within a 3.5 km radius\"");
  assert.equal(r.short, "3.5 km");
  assert.equal(nearRange("km:1").mode, "walk");
  assert.equal(nearRange("km:0.2").km, 0.5, "never under 500 m");
  assert.equal(nearRange("km:900").km, 50, "never over Google's limit");
  assert.equal(nearRange("km:abc").id, "d15", "junk falls back to the default");
  assert.equal(rangeKm(nearRange("km:3.5")), 3.5);
  assert.equal(nearRange("d15").km, undefined, "a timed drive still goes by minutes");
});

test("pickNear within a typed distance goes by kilometres, however you'd get there", () => {
  const at = (km, id) => place(id, { km, rating: 4.8, ratingCount: 3000 });
  const list = [at(0.4, "a"), at(3.2, "b"), at(5, "c"), at(11, "d")];
  assert.deepEqual(pickNear(list, { center: CBD, range: "km:3.5", at: wed(13) }).places.map((p) => p.id), ["a", "b"]);
  assert.deepEqual(pickNear(list, { center: CBD, range: "km:12", at: wed(13) }).places.map((p) => p.id), ["a", "b", "c", "d"], "further than the timed drives reach");
  assert.deepEqual(pickNear(list, { center: CBD, range: "km:0.5", at: wed(13) }).places.map((p) => p.id), ["a"]);
});

test("pickNow and pickLate stop at the chosen distance as well as the time", () => {
  const list = [place("near", { km: 2 }), place("mid", { km: 6 })];
  const opts = { from: CBD, at: wed(13), minutes: 180, mode: "drive", priceMax: null, kind: "eat" };
  assert.deepEqual(pickNow(list, opts).map((p) => p.id).sort(), ["mid", "near"], "no distance chosen: the time decides");
  assert.deepEqual(pickNow(list, { ...opts, maxKm: 3 }).map((p) => p.id), ["near"]);
  assert.deepEqual(pickNow(list, { ...opts, maxKm: null }).length, 2);
  const night = everyDay(17, 0, 3, 0, true);
  const late = [place("near", { km: 2, hours: night }), place("mid", { km: 6, hours: night })];
  assert.deepEqual(pickLate(late, { from: CBD, at: wed(23), maxMinutes: 30, priceMax: null, maxKm: 3 }).map((p) => p.id), ["near"]);
  assert.equal(pickLate(late, { from: CBD, at: wed(23), maxMinutes: 30, priceMax: null }).length, 2);
});

test("whyEmpty names the distance when that, not the time or budget, is what left nothing", () => {
  const list = [place("mid", { km: 6 })];
  const opts = { from: CBD, at: wed(13), minutes: 180, mode: "drive", priceMax: null, kind: "eat" };
  assert.equal(whyEmpty(list, { ...opts, maxKm: 3 }), "distance");
  assert.equal(whyEmpty(list, { ...opts, maxKm: 20 }), "far", "with room to spare it falls back to the old reasons");
  assert.equal(haversineKm(CBD, list[0]) > 3, true);
});

test("the slider's steps map to kilometres and back, with an Any step at the end when allowed", () => {
  const last = DISTANCES.length - 1;
  assert.equal(kmFromStep(0), 0.5);
  assert.equal(kmFromStep(last), 50);
  assert.equal(kmFromStep(last + 1), 50, "without Any the slider stops at the last distance");
  assert.equal(kmFromStep(-3), 0.5);
  assert.equal(kmFromStep(last + 1, true), null, "the step after the last is Any");
  assert.equal(kmFromStep(last, true), 50);
  assert.equal(stepFromKm(5), DISTANCES.indexOf(5));
  assert.equal(stepFromKm(null, true), DISTANCES.length, "Any is the end of the slider");
  assert.equal(stepFromKm(null), last, "no Any to land on: the furthest");
  assert.equal(stepFromKm(6), DISTANCES.indexOf(5), "between steps: the nearest (5 and 7 are equally close: the nearer one wins)");
  assert.equal(stepFromKm(8.4), DISTANCES.indexOf(7), "8.4 is nearer 7 than 10");
  assert.equal(stepFromKm(0.1), 0);
  for (const km of DISTANCES) assert.equal(kmFromStep(stepFromKm(km, true), true), km, `${km} km round-trips`);
});

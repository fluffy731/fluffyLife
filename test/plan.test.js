import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { KEY, MAX_DAYS, load, save, fixRange, reschedule, itinerary, tripDays, nights, dayLabel, rangeLabel, status, sortTrips, current,
  packingFor, toText, exportJSON, importJSON, isDate, todayISO, linkedTrip } from "../travel/plan-model.js";

const fakeLS = (init = {}) => { const m = { ...init }; return { getItem: k => (k in m ? m[k] : null), setItem: (k, v) => { m[k] = String(v); } }; };
const item = (id, day, time = "", title = id) => ({ id, day, time, kind: "do", title, place: "", note: "" });
const trip = (start, end, items = [], extra = {}) => ({ id: "t1", name: "HK", start, end, type: "overseas", items, ...extra });

test("dates are checked as real calendar days", () => {
  assert.ok(isDate("2028-02-29"));
  for (const bad of ["2026-02-30", "2026-13-01", "5/11/2026", "", null]) assert.ok(!isDate(bad), String(bad));
  assert.equal(todayISO(new Date(2026, 0, 5, 23, 30)), "2026-01-05");
});

test("trip days run start to end inclusive, across month and year ends", () => {
  assert.deepEqual(tripDays(trip("2026-12-30", "2027-01-02")), ["2026-12-30", "2026-12-31", "2027-01-01", "2027-01-02"]);
  assert.equal(nights(trip("2026-11-05", "2026-11-12")), 7);
  assert.deepEqual(fixRange("2026-11-05", "2026-11-01"), { start: "2026-11-05", end: "2026-11-05" });
  assert.equal(tripDays(trip(...Object.values(fixRange("2026-11-05", "2036-11-05")))).length, MAX_DAYS);
});

test("labels read the Australian way", () => {
  assert.equal(dayLabel("2026-11-05"), "Thu 5 Nov");
  assert.equal(rangeLabel(trip("2026-11-05", "2026-11-12")), "5–12 Nov 2026");
  assert.equal(rangeLabel(trip("2026-11-28", "2026-12-03")), "28 Nov – 3 Dec 2026");
  assert.equal(rangeLabel(trip("2026-12-28", "2027-01-04")), "28 Dec 2026 – 4 Jan 2027");
  assert.equal(rangeLabel(trip("2026-11-05", "2026-11-05")), "5 Nov 2026");
});

test("itinerary sorts each day by time, untimed first, and keeps entries that fall off the trip", () => {
  const t = trip("2026-11-05", "2026-11-06", [item("b", "2026-11-05", "18:30"), item("a", "2026-11-05", "09:00"), item("hotel", "2026-11-05"),
    item("old", "2026-11-09", "10:00"), item("x", "2026-11-06")]);
  const it = itinerary(t);
  assert.deepEqual(it.map(d => [d.date, d.n]), [["2026-11-05", 1], ["2026-11-06", 2], ["", 0]]);
  assert.deepEqual(it[0].items.map(i => i.id), ["hotel", "a", "b"]);
  assert.deepEqual(it[2].items.map(i => i.id), ["old"]);
  assert.equal(itinerary(trip("2026-11-05", "2026-11-06")).length, 2, "no loose bucket when nothing is loose");
});

test("moving the whole trip moves its entries; stretching it leaves them on their dates", () => {
  const t = trip("2026-11-05", "2026-11-07", [item("a", "2026-11-06", "09:00"), item("b", "")]);
  const moved = reschedule(t, "2026-11-08", "2026-11-10");
  assert.deepEqual(moved.items.map(i => i.day), ["2026-11-09", ""]);
  const longer = reschedule(t, "2026-11-04", "2026-11-07");
  assert.deepEqual([longer.start, longer.items[0].day], ["2026-11-04", "2026-11-06"]);
  const shorter = reschedule(t, "2026-11-07", "2026-11-07");
  assert.equal(itinerary(shorter).at(-1).date, "", "the dropped day's entry is kept, not lost");
});

test("status, ordering and the trip under way", () => {
  const soon = trip("2026-11-05", "2026-11-12", [], { id: "soon" });
  const later = trip("2027-01-10", "2027-01-12", [], { id: "later" });
  const now = trip("2026-10-28", "2026-10-30", [], { id: "now" });
  const old = trip("2026-03-01", "2026-03-04", [], { id: "old" });
  const older = trip("2025-12-01", "2025-12-04", [], { id: "older" });
  const today = "2026-10-29";
  assert.deepEqual(status(soon, "2026-11-04"), { when: "soon", text: "Tomorrow" });
  assert.deepEqual(status(soon, today), { when: "soon", text: "In 7 days" });
  assert.deepEqual(status(now, today), { when: "now", text: "Day 2 of 3" });
  assert.equal(status(old, today).when, "past");
  assert.deepEqual(sortTrips([older, later, old, soon, now], today).map(t => t.id), ["now", "soon", "later", "old", "older"]);
  assert.equal(current([soon, now], today).id, "now");
  assert.equal(current([soon], today), null);
});

test("a week or more packs as a Long trip of the same type", () => {
  assert.deepEqual(packingFor(trip("2026-11-05", "2026-11-12")), { trip: "overseas", mode: "long" });
  assert.deepEqual(packingFor(trip("2026-11-05", "2026-11-08", [], { type: "road" })), { trip: "road", mode: "short" });
});

test("shared text lists every day, times, places and notes", () => {
  const t = trip("2026-11-05", "2026-11-06", [{ id: "f", day: "2026-11-05", time: "09:15", kind: "fly", title: "CX 100 SYD → HKG", place: "", note: "Ref ABC123\nSeat 42A" },
    { id: "h", day: "2026-11-05", time: "", kind: "stay", title: "Hotel Icon", place: "17 Science Museum Rd", note: "" }]);
  assert.equal(toText(t), [
    "HK", "5–6 Nov 2026 · 1 night", "",
    "Day 1 · Thu 5 Nov", "🏨 Hotel Icon · 17 Science Museum Rd", "✈️ 09:15 CX 100 SYD → HKG", "   Ref ABC123", "   Seat 42A", "",
    "Day 2 · Fri 6 Nov · free",
  ].join("\n"));
  const off = toText({ ...t, items: [{ id: "x", day: "2026-11-09", time: "10:00", kind: "do", title: "Peak", place: "", note: "" }] });
  assert.match(off, /Not on a trip day\n📍 Mon 9 Nov 10:00 Peak$/);
});

test("load survives missing or corrupt storage and cleans bad entries; save round trips", () => {
  assert.deepEqual(load(fakeLS()), { trips: [] });
  assert.deepEqual(load(fakeLS({ [KEY]: "{oops" })), { trips: [] });
  assert.deepEqual(load(fakeLS({ [KEY]: "null" })), { trips: [] });
  const messy = { trips: [{ id: "t", name: " ", start: "2026-11-05", end: "2026-11-01", type: "space", items: [
    { id: "i", day: "nope", time: "25:00", kind: "?", title: " Peak ", place: 3 }, { id: "j", title: "" }, null] }, { id: "no-start" }] };
  assert.deepEqual(load(fakeLS({ [KEY]: JSON.stringify(messy) })), { trips: [{ id: "t", name: "Trip", start: "2026-11-05", end: "2026-11-05", type: "overseas",
    items: [{ id: "i", day: "", time: "", kind: "do", title: "Peak", place: "", note: "" }] }] });
  const ls = fakeLS(), s = { trips: [trip("2026-11-05", "2026-11-06", [item("a", "2026-11-05", "09:00")])] };
  save(ls, s);
  assert.deepEqual(load(ls), s);
});

test("restoring a backup adds new trips and replaces ones with the same id", () => {
  const mine = { trips: [trip("2026-11-05", "2026-11-06", [], { id: "a", name: "Old" }), trip("2026-12-01", "2026-12-02", [], { id: "b" })] };
  const backup = exportJSON({ trips: [trip("2026-11-05", "2026-11-06", [], { id: "a", name: "New" }), trip("2027-01-01", "2027-01-02", [], { id: "c" })] });
  const r = importJSON(backup, mine);
  assert.deepEqual([r.added, r.replaced], [1, 1]);
  assert.deepEqual(r.trips.map(t => [t.id, t.name]), [["b", "HK"], ["a", "New"], ["c", "HK"]]);
  assert.throws(() => importJSON("{}", mine), /isn't a trip plan backup/);
  assert.throws(() => importJSON("not json", mine), /isn't a trip plan backup/);
});

test("import links name a trip file and nothing else", () => {
  assert.equal(linkedTrip("#import=example-trip"), "example-trip");
  assert.equal(linkedTrip("import=hk_2027"), "hk_2027");
  for (const bad of ["#import=../sw", "#import=a/b", "#import=", "#t=abc", "", "#import=x.json"]) assert.equal(linkedTrip(bad), null, bad);
});

test("every trip published in travel/trips restores cleanly", () => {
  const dir = new URL("../travel/trips/", import.meta.url);
  const files = readdirSync(dir).filter(f => f.endsWith(".json"));
  assert.ok(files.length, "no trip files");
  for (const f of files) {
    assert.ok(linkedTrip(`#import=${f.slice(0, -5)}`), `${f}: name must be letters, digits, - or _`);
    const raw = JSON.parse(readFileSync(new URL(f, dir), "utf8"));
    const r = importJSON(readFileSync(new URL(f, dir), "utf8"), { trips: [] });
    assert.equal(r.trips.length, raw.trips.length, `${f}: a trip was dropped as invalid`);
    r.trips.forEach((t, i) => assert.equal(t.items.length, raw.trips[i].items.length, `${f}: an entry in "${t.name}" was dropped as invalid`));
  }
});

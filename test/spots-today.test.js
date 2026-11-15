import { test } from "node:test";
import assert from "node:assert/strict";
import {
  iso, addDays, clock, dayType, partOf, isOnDay, startOn, rank, stillOn, onToday, nextList, whenLabel, dateRange,
  ideasFor, momentLine, kindForCat, catOf,
} from "../spots/today.js";

// 15 November 2026 is a Sunday; 18th Wednesday; 20th Friday; 21st Saturday.
const at = (d, h, m = 0) => new Date(2026, 10, d, h, m);
const ev = (o) => ({ id: o.title, src: "wom", blurb: "", days: [], weekend: null, next: null, free: null, cat: "other", outdoor: null, ...o });

const EVENTS = [
  ev({ title: "Polish Festival", from: "2026-11-15", to: "2026-11-15", days: ["2026-11-15"], cat: "festival", outdoor: true }),
  ev({ title: "Stock Up Vintage Market", from: "2026-11-15", to: "2026-11-15", days: ["2026-11-15"], cat: "market", free: true }),
  ev({ title: "Library Exhibition", from: "2026-08-07", to: "2027-06-27", days: ["2026-11-15"], cat: "arts", free: true }),
  ev({ title: "This is Our Youth", from: "2026-11-05", to: "2026-11-15", days: ["2026-11-15"], cat: "theatre" }),
  ev({ title: "My Fair Lady", from: "2026-11-14", to: "2027-01-17", days: ["2026-11-15"], cat: "theatre" }),
  ev({ title: "Sunday Stand-Up", src: "ef", from: "2026-10-25", to: "2027-01-31", days: ["2026-11-15"], next: "2026-11-15T19:30", cat: "comedy" }),
  ev({ title: "Morning Yoga", src: "ef", from: "2026-01-01", to: "2026-12-31", days: ["2026-11-15"], next: "2026-11-15T08:00", cat: "outdoors", outdoor: true }),
  ev({ title: "Japanese Film Festival", src: "ef", from: "2026-11-09", to: "2026-11-17", cat: "film" }), // not listed for any day
  ev({ title: "Three-day Design Market", from: "2026-11-14", to: "2026-11-16", cat: "market" }), // short: on every day it covers
  ev({ title: "Weekend Night Market", from: "2026-11-20", to: "2026-11-22", weekend: "2026-11-21", cat: "market" }),
  ev({ title: "Saturday Gig", src: "ef", from: "2026-11-21", to: "2026-11-21", days: ["2026-11-21"], next: "2026-11-21T20:00", cat: "music" }),
  ev({ title: "Monday Talk", from: "2026-11-16", to: "2026-11-16", days: ["2026-11-16"], cat: "talk", free: true }),
];
const FEED = {
  today: "2026-11-15", events: EVENTS,
  weather: [{ date: "2026-11-15", rain: 10, max: 22 }, { date: "2026-11-16", rain: 20, max: 20 }, { date: "2026-11-21", rain: 70, max: 23 }, { date: "2026-11-22", rain: 10, max: 25 }],
  holidays: [{ date: "2026-12-25", name: "Christmas Day" }, { date: "2026-12-28", name: "Boxing Day" }],
};
const wet = (feed, day, rain, max = 17) => ({ ...feed, weather: [{ date: day, rain, max }, ...feed.weather.filter((w) => w.date !== day)] });

// ---------- the moment ----------

test("dates and clock", () => {
  assert.equal(iso(at(15, 23, 59)), "2026-11-15");
  assert.equal(addDays("2026-11-30", 1), "2026-12-01");
  assert.equal(clock("19:30"), "7:30 pm");
  assert.equal(clock("11:00"), "11 am");
  assert.equal(clock("00:15"), "12:15 am");
  assert.equal(clock("12:00"), "12 pm");
});

test("dayType: weekdays, Friday, the weekend, and a holiday counts as Sunday", () => {
  assert.equal(dayType(at(18, 12), FEED), "weekday");
  assert.equal(dayType(at(20, 12), FEED), "friday");
  assert.equal(dayType(at(21, 12), FEED), "saturday");
  assert.equal(dayType(at(15, 12), FEED), "sunday");
  assert.equal(dayType(new Date(2026, 11, 25, 12), FEED), "sunday", "Christmas Day is a Friday in 2026");
});

test("partOf: early, morning, lunch, afternoon, evening, late", () => {
  assert.deepEqual([4, 5, 8, 11, 14, 17, 21, 23].map((h) => partOf(at(18, h))), ["late", "early", "morning", "lunch", "afternoon", "evening", "late", "late"]);
});

// ---------- events ----------

test("isOnDay: listed for the day, or a short event covering it; long runs need a listing", () => {
  const by = (t) => EVENTS.find((e) => e.title === t);
  assert.ok(isOnDay(by("Library Exhibition"), "2026-11-15"));
  assert.ok(!isOnDay(by("Library Exhibition"), "2026-11-16"), "a long run isn't assumed on every day");
  assert.ok(isOnDay(by("Three-day Design Market"), "2026-11-16"));
  assert.ok(!isOnDay(by("Japanese Film Festival"), "2026-11-15"), "nine days is not short");
  assert.equal(startOn(by("Sunday Stand-Up"), "2026-11-15"), "19:30");
  assert.equal(startOn(by("Sunday Stand-Up"), "2026-11-16"), null);
});

test("rank: one-offs, last chances, just opened, timed sessions, then long runs; free first among equals", () => {
  const order = rank(EVENTS.filter((e) => isOnDay(e, "2026-11-15")), "2026-11-15").map((e) => e.title);
  assert.deepEqual(order, ["Stock Up Vintage Market", "Polish Festival", "Three-day Design Market", "This is Our Youth", "My Fair Lady", "Morning Yoga", "Sunday Stand-Up", "Library Exhibition"]);
});

test("rank: outdoor events go after indoor ones when rain is likely", () => {
  const order = rank(EVENTS.filter((e) => isOnDay(e, "2026-11-15")), "2026-11-15", { rain: 80 }).map((e) => e.title);
  assert.deepEqual(order.slice(0, 3), ["Stock Up Vintage Market", "Three-day Design Market", "Polish Festival"]);
});

test("onToday: in the morning everything on today, except sessions over an hour old", () => {
  const titles = onToday(FEED, at(15, 11)).map((e) => e.title);
  assert.ok(titles.includes("Library Exhibition") && titles.includes("Sunday Stand-Up"));
  assert.ok(!titles.includes("Morning Yoga"), "8 am session is three hours old");
  assert.ok(!titles.includes("Japanese Film Festival") && !titles.includes("Monday Talk"));
});

test("onToday: tonight keeps sessions still to come and evening kinds", () => {
  const titles = onToday(FEED, at(15, 18)).map((e) => e.title);
  assert.deepEqual(titles, ["Polish Festival", "This is Our Youth", "My Fair Lady", "Sunday Stand-Up"]);
  assert.ok(!stillOn(EVENTS.find((e) => e.title === "Sunday Stand-Up"), "2026-11-15", at(15, 20)), "started 30 min ago");
});

test("onToday: a filter for one kind, or free", () => {
  assert.deepEqual(onToday(FEED, at(15, 10), { filter: "market" }).map((e) => e.title), ["Stock Up Vintage Market", "Three-day Design Market"]);
  assert.deepEqual(onToday(FEED, at(15, 10), { filter: "free" }).map((e) => e.title), ["Stock Up Vintage Market", "Library Exhibition"]);
  assert.deepEqual(onToday(null, at(15, 10)), []);
});

test("nextList: this weekend from Monday to Friday, tomorrow on the weekend", () => {
  const wk = nextList(FEED, at(18, 12));
  assert.equal(wk.title, "This weekend");
  assert.equal(wk.day, "2026-11-21");
  assert.deepEqual(wk.events.map((e) => e.title), ["Saturday Gig", "Weekend Night Market"], "rain on Saturday is 70%, but neither is outdoor");
  const sun = nextList(FEED, at(15, 12));
  assert.equal(sun.title, "Tomorrow");
  assert.deepEqual(sun.events.map((e) => e.title), ["Monday Talk", "Three-day Design Market"]);
});

test("whenLabel: time, today only, last day, opens today, until …", () => {
  const by = (t) => EVENTS.find((e) => e.title === t), d = "2026-11-15";
  assert.equal(whenLabel(by("Sunday Stand-Up"), d), "7:30 pm");
  assert.equal(whenLabel(by("Polish Festival"), d), "Today only");
  assert.equal(whenLabel(by("This is Our Youth"), d), "Last day");
  assert.equal(whenLabel(by("Three-day Design Market"), d), "Until Mon");
  assert.equal(whenLabel(by("Library Exhibition"), d), "Until 27 Jun 2027");
  assert.equal(whenLabel(by("My Fair Lady"), "2026-11-14"), "Opens today");
  assert.equal(whenLabel(by("Saturday Gig"), "2026-11-21", { withDay: true }), "Sat 8 pm");
  assert.equal(whenLabel(by("Weekend Night Market"), "2026-11-21", { withDay: true }), "Until Sun");
});

test("dateRange names the year only when it isn't this year", () => {
  assert.equal(dateRange(EVENTS[0], "2026-11-15"), "Sun 15 Nov");
  assert.equal(dateRange(EVENTS[2], "2026-11-15"), "Fri 7 Aug – Sun 27 Jun 2027");
  assert.equal(dateRange(EVENTS[7], "2026-11-15"), "Mon 9 Nov – Tue 17 Nov");
});

test("kindForCat and catOf", () => {
  assert.deepEqual(["food", "market", "arts", "music", "nonsense"].map(kindForCat), ["eat", "eat", "sights", "activities", "activities"]);
  assert.deepEqual(catOf({ cat: "comedy" }), ["🎤", "Comedy"]);
  assert.deepEqual(catOf({ cat: "nope" }), ["📅", "Event"]);
});

// ---------- ideas ----------

const ids = (list) => list.map((i) => i.id);

test("ideas: Sunday morning is brunch, the markets on today, and out and about", () => {
  const list = ideasFor(at(15, 10), FEED);
  assert.deepEqual(ids(list), ["brunch", "ev:market", "outAbout"]);
  assert.equal(list[1].label, "Markets on today");
  assert.equal(list[1].count, 2);
  assert.deepEqual(list[0].preset, { mode: "now", kinds: ["coffee", "eat"], minutes: 120 });
});

test("ideas: rain swaps out and about for a gallery and something fun indoors", () => {
  assert.deepEqual(ids(ideasFor(at(15, 15), wet(FEED, "2026-11-15", 92))), ["museum", "fun", "dessert"]);
});

test("ideas: a hot afternoon puts gelato first", () => {
  const list = ideasFor(at(18, 15), wet(FEED, "2026-11-18", 5, 34));
  assert.equal(list[0].id, "dessert");
  assert.equal(list[0].label, "Gelato weather");
  assert.match(list[0].sub, /34°/);
});

test("ideas: a weekday lunch, with the free-things idea only when there are some", () => {
  assert.deepEqual(ids(ideasFor(at(18, 12, 30), FEED)), ["lunch", "coffee"]);
  const withFree = { ...FEED, events: [...EVENTS, ev({ title: "Free lunchtime concert", from: "2026-11-18", to: "2026-11-18", days: ["2026-11-18"], cat: "music", free: true })] };
  const list = ideasFor(at(18, 12, 30), withFree);
  assert.deepEqual(ids(list), ["lunch", "coffee", "ev:free"]);
  assert.equal(list[2].label, "Free things on today");
});

test("ideas: Friday evening offers dinner and drinks and planning tomorrow, around town if rain is likely", () => {
  const fri = ideasFor(at(20, 19), FEED);
  assert.deepEqual(ids(fri), ["dinnerDrinks", "tomorrow"]);
  const t = fri.find((i) => i.id === "tomorrow");
  assert.equal(t.preset.where, "town", "70% rain on Saturday");
  assert.match(t.sub, /70% rain/);
  assert.equal(ideasFor(at(20, 19), { ...FEED, weather: [] }).find((i) => i.id === "tomorrow").preset.where, "surprise");
});

test("ideas: Friday afternoon drinks get their name", () => {
  assert.equal(ideasFor(at(20, 16), FEED)[0].label, "Friday drinks");
});

test("ideas: events ideas at night say tonight", () => {
  const list = ideasFor(at(21, 18), { ...FEED, today: "2026-11-21" });
  assert.deepEqual(ids(list), ["dinnerDrinks", "ev:music", "tomorrow"]);
  assert.equal(list[1].label, "Live music tonight");
});

test("ideas: late at night, bars first on Saturday, food first on a weeknight", () => {
  assert.deepEqual(ids(ideasFor(at(21, 23), FEED)), ["lateBar", "lateEats"]);
  assert.deepEqual(ids(ideasFor(at(18, 23), FEED)), ["lateEats", "lateBar"]);
  assert.deepEqual(ideasFor(at(18, 23), FEED)[0].preset, { mode: "late", lateKinds: ["eat", "dessert"], late: 30 });
});

test("ideas: Plan tomorrow only before a weekend or a holiday", () => {
  assert.ok(!ids(ideasFor(at(15, 19), FEED)).includes("tomorrow"), "Sunday evening, Monday is a workday");
  const xmasEve = ideasFor(new Date(2026, 11, 24, 19), FEED);
  assert.ok(ids(xmasEve).includes("tomorrow"), "Thursday evening before Christmas Day");
  assert.match(xmasEve.find((i) => i.id === "tomorrow").sub, /Christmas Day/);
  assert.deepEqual(ids(ideasFor(new Date(2026, 11, 25, 10), FEED)).slice(0, 1), ["brunch"], "Christmas morning is a Sunday morning");
});

test("ideas work with no feed at all", () => {
  assert.deepEqual(ids(ideasFor(at(15, 10), null)), ["brunch", "outAbout"]);
});

test("momentLine: day, part of the day and weather; a holiday's name", () => {
  assert.equal(momentLine(at(15, 10), wet(FEED, "2026-11-15", 92, 17)), "Sunday morning · 🌧 92% rain · 17°");
  assert.equal(momentLine(new Date(2026, 11, 25, 19), FEED), "Christmas Day · evening");
  assert.equal(momentLine(at(18, 23), null), "Wednesday night");
});

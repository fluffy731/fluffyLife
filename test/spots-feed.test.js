import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  melb, addDays, weekendOf, parseWhatsOn, pagesOf, splitLocation, womEvent, parseEventfinda, longDate, mergeEvents,
  articlesFrom, roundupsFrom, mergeFresh, mergeRoundups, isOpening, isRoundup, freshKind, catOf, weatherFrom, holidaysFrom, sameKey,
} from "../scripts/build-spots.mjs";

const fx = (n) => readFileSync(new URL(`./fixtures/spots/${n}`, import.meta.url), "utf8");
const TODAY = "2026-11-15"; // a Sunday

// ---------- dates ----------

test("melb: a UTC time becomes Melbourne's date, weekday and hour", () => {
  assert.deepEqual(melb(new Date("2026-11-14T14:30:00Z")), { date: "2026-11-15", dow: 0, hour: 1 });
  assert.deepEqual(melb(new Date("2026-07-01T13:59:00Z")), { date: "2026-07-01", dow: 3, hour: 23 }, "AEST (UTC+10) in winter");
  assert.deepEqual(melb(new Date("2026-07-01T14:00:00Z")), { date: "2026-07-02", dow: 4, hour: 0 });
});

test("weekendOf: the Saturday of this weekend", () => {
  assert.equal(weekendOf("2026-11-18"), "2026-11-21", "Wednesday looks ahead");
  assert.equal(weekendOf("2026-11-21"), "2026-11-21", "Saturday is itself");
  assert.equal(weekendOf("2026-11-22"), "2026-11-21", "Sunday looks back");
  assert.equal(addDays("2026-12-31", 1), "2027-01-01");
});

// ---------- What's On Melbourne ----------

test("parseWhatsOn reads every numbered block, with or without dates", () => {
  const items = parseWhatsOn(fx("whatson-today.txt"));
  assert.equal(items.length, 9);
  const polish = items.find((i) => i.title === "Polish Festival");
  assert.equal(polish.url, "https://whatson.melbourne.vic.gov.au/things-to-do/polish-festival-2026");
  assert.equal(polish.location, "Fed Square, Swanston St & Flinders St, Melbourne 3000");
  assert.deepEqual([polish.from, polish.to], ["2026-11-15", "2026-11-15"]);
  assert.equal(items.find((i) => i.path.includes("fijian")).title, "Fijian Flying Circus", "trailing space trimmed");
  assert.ok(!items.find((i) => i.path.startsWith("/article/")).blurb.includes("&nbsp;"), "entities decoded");
  assert.equal(pagesOf(fx("whatson-today.txt")), 16);
});

test("womEvent keeps dated things-to-do listings only", () => {
  const evs = parseWhatsOn(fx("whatson-today.txt")).map(womEvent).filter(Boolean);
  assert.deepEqual(evs.map((e) => e.title), ["State Library Victoria Unlocked", "Polish Festival", "Fijian Flying Circus", "Free Guided Walk", "This is Our Youth", "Ports and Docklands Cruise"]);
  const polish = evs.find((e) => e.title === "Polish Festival");
  assert.deepEqual([polish.id, polish.venue, polish.area, polish.cat, polish.outdoor], ["wom:/things-to-do/polish-festival-2026", "Fed Square", "Melbourne", "festival", true]);
});

test("splitLocation: venue, address and suburb without the postcode", () => {
  assert.deepEqual(splitLocation("Flemington Racecourse, 448 Epsom Rd, Flemington 3031"), { venue: "Flemington Racecourse", address: "448 Epsom Rd, Flemington 3031", area: "Flemington" });
  assert.equal(splitLocation("Royal Botanic Gardens Victoria - Melbourne Gardens, Melbourne, Victoria 3004").area, "Melbourne", "skips 'Victoria 3004'");
  assert.deepEqual(splitLocation(""), { venue: "", address: "", area: "" });
});

// ---------- Eventfinda ----------

test("parseEventfinda: dates, next session, venue, suburb and picture", () => {
  const evs = parseEventfinda(fx("eventfinda.xml"));
  assert.equal(evs.length, 4);
  const [comedy, film, med] = evs;
  assert.deepEqual([comedy.from, comedy.to, comedy.next, comedy.venue, comedy.area, comedy.cat], ["2026-10-25", "2027-01-31", "2026-11-15T19:30", "Club Voltaire", "Melbourne", "comedy"]);
  assert.equal(comedy.url, "https://www.eventfinda.com.au/2026/sunday-night-stand-up-at-club-voltaire-comedy/melbourne", "tracking tag removed");
  assert.match(comedy.image, /^https:\/\/cdn\.eventfinda/);
  assert.ok(comedy.blurb.endsWith("…") && !comedy.blurb.includes("..."));
  assert.equal(film.cat, "film", "Film Festival is a film, not a festival");
  assert.deepEqual([med.from, med.to, med.area, med.free, med.image], ["2026-11-16", "2026-11-16", "Richmond", true, null]);
  assert.deepEqual(comedy.days, ["2026-11-15"]);
});

test("longDate reads Eventfinda's long dates", () => {
  assert.equal(longDate("Friday, 6 March 2026"), "2026-03-06");
  assert.equal(longDate("nonsense"), null);
});

// ---------- merging ----------

test("mergeEvents: one copy per event, What's On's address kept, the other's session and picture added", () => {
  const wom = parseWhatsOn(fx("whatson-today.txt")).map(womEvent).filter(Boolean);
  const ef = parseEventfinda(fx("eventfinda.xml"));
  const all = mergeEvents([{ events: wom, days: [TODAY] }, { events: ef }, { events: wom.slice(0, 2), weekend: "2026-11-14", free: true }], TODAY);
  const polish = all.filter((e) => sameKey(e.title) === sameKey("Polish Festival"));
  assert.equal(polish.length, 1);
  assert.equal(polish[0].src, "wom");
  assert.equal(polish[0].venue, "Fed Square");
  assert.equal(polish[0].next, "2026-11-15T11:00");
  assert.match(polish[0].image, /polish\.jpg/);
  assert.equal(polish[0].free, true, "listed under free");
  assert.equal(all.find((e) => e.title === "Free Guided Walk").free, true, "'Free' in the title");
  assert.equal(all.find((e) => e.title === "Fijian Flying Circus").free, null);
  assert.deepEqual(all.find((e) => e.title === "Fijian Flying Circus").days, [TODAY]);
});

test("mergeEvents: a title with an add-on is the same event when the dates overlap", () => {
  const a = { id: "ef:1", src: "ef", title: "Opera Up Late", blurb: "", from: "2026-11-15", to: "2026-11-15", next: "2026-11-15T21:00", days: [] };
  const b = { id: "wom:/x", src: "wom", title: "Opera Up Late with Reuben Kaye", blurb: "", from: "2026-11-15", to: "2026-11-15", days: [], venue: "Arts Centre" };
  const c = { id: "ef:2", src: "ef", title: "Opera Up Late", blurb: "", from: "2027-03-01", to: "2027-03-01", days: [] };
  const out = mergeEvents([{ events: [a, b, c] }], TODAY);
  assert.equal(out.length, 2, "the March show is another event");
  const m = out.find((e) => e.from === TODAY);
  assert.deepEqual([m.src, m.venue, m.next], ["wom", "Arts Centre", "2026-11-15T21:00"]);
});

test("mergeEvents keeps events apart in different suburbs, or at different venues when only part of the title matches", () => {
  const e = (o) => ({ src: "ef", blurb: "", from: TODAY, to: TODAY, days: [TODAY], ...o });
  const trivia = mergeEvents([{ events: [
    e({ id: "ef:1", title: "Trivia Night", venue: "The Union Hotel", area: "Brunswick", next: `${TODAY}T19:00` }),
    e({ id: "ef:2", title: "Trivia Night", venue: "The Railway Hotel", area: "Windsor", next: `${TODAY}T20:00` }),
  ] }], TODAY);
  assert.deepEqual(trivia.map((x) => x.area).sort(), ["Brunswick", "Windsor"]);
  const markets = mergeEvents([{ events: [
    e({ id: "wom:/n", src: "wom", title: "Night Market", venue: "Queen Victoria Market", area: "Melbourne", from: "2026-11-01", to: "2027-03-01" }),
    e({ id: "ef:3", title: "Night Markets Box Hill", venue: "Box Hill Central", area: "Melbourne", next: `${TODAY}T17:00` }),
  ] }], TODAY);
  assert.equal(markets.length, 2);
  assert.equal(markets.find((x) => x.src === "wom").next, undefined, "Box Hill's time stays with Box Hill");
  const polish = mergeEvents([{ events: [
    e({ id: "wom:/p", src: "wom", title: "Polish Festival", venue: "Fed Square", area: "Melbourne" }),
    e({ id: "ef:4", title: "Polish Festival 2026", venue: "Federation Square", area: "Melbourne CBD", next: `${TODAY}T11:00` }),
  ] }], TODAY);
  assert.equal(polish.length, 1, "Fed Square and Federation Square, same suburb, same title: one event");
});

test("mergeEvents drops what has ended and dates already past", () => {
  const e = { id: "x", src: "ef", title: "Old", blurb: "", from: "2026-11-01", to: "2026-11-14", days: ["2026-11-14"] };
  const f = { id: "y", src: "ef", title: "New", blurb: "", from: "2026-11-10", to: "2026-11-20", days: ["2026-11-14", "2026-11-16"] };
  const out = mergeEvents([{ events: [e, f] }], TODAY);
  assert.deepEqual(out.map((x) => x.title), ["New"]);
  assert.deepEqual(out[0].days, ["2026-11-16"]);
});

test("catOf: the title decides before the blurb", () => {
  assert.equal(catOf("The Christmas Night Market"), "market");
  assert.equal(catOf("African Music and Cultural Festival"), "music");
  assert.equal(catOf("Polish Festival"), "festival");
  assert.equal(catOf("Spartans & Anzacs", "This exhibition invites reflection"), "arts");
  assert.equal(catOf("Melbourne Magic Show"), "theatre");
  assert.equal(catOf("Wellness Expo"), "other");
  assert.equal(catOf("Victoria vs Western Australia - Dean Jones Trophy"), "sport");
});

// ---------- what's new ----------

test("articlesFrom: event write-ups and openings, never closures, hotels, politics or round-ups", () => {
  const to = articlesFrom("timeout", fx("timeout.xml"), TODAY);
  assert.deepEqual(to.map((a) => [a.title, a.kind]), [["The Little Food Market", "event"], ["This cult-fave sports bar is opening its first Melbourne store this week", "drink"]]);
  assert.match(to[0].image, /media\.timeout\.com/);
  assert.equal(to[0].source, "Time Out");
  assert.equal(to[0].date, "2026-11-13");
  const cp = articlesFrom("concrete", fx("concrete.xml"), TODAY);
  assert.deepEqual(cp.map((a) => [a.title, a.kind]), [["Vans Presents: House of Vandal", "event"], ["Marea Beach House & Bar", "eat"]], "travel and sponsored left out");
  const gn = articlesFrom("gnews", fx("gnews.xml"), TODAY);
  assert.deepEqual(gn.map((a) => [a.title, a.source, a.kind]), [
    ["Melbourne is scoring two new restaurants from Chris Lucas – and bookings are officially open", "Time Out Worldwide", "eat"],
    ["A new rooftop bar opens in Collingwood", "Broadsheet", "drink"]], "Perth, the closure and the round-up left out");
});

test("isOpening needs an opening word, or 'new' next to a venue", () => {
  assert.ok(isOpening("A new rooftop bar opens in Collingwood"));
  assert.ok(isOpening("A brand new Korean BBQ restaurant"));
  assert.ok(!isOpening("Victoria's premier announces new budget measures"));
  assert.ok(!isOpening("Beloved Fitzroy cafe to close, then reopen"), "closures win");
  assert.ok(isRoundup("The best things to do in Melbourne this weekend (November 14–15)"));
  assert.ok(!isOpening("PHOTOS: Melbourne Queer Film Festival Opening Night 2026"));
  assert.ok(!isOpening("Inside the opening weekend of the festival"));
  assert.equal(freshKind("https://x/melbourne/cafes/a", "Anything"), "coffee");
  assert.equal(freshKind("https://x/news/a", "A gelato bar arrives"), "dessert");
  assert.equal(freshKind("https://x/news/a", "A pizza bar opens"), "eat");
  assert.equal(freshKind("https://x/news/a", "A wine bar opens"), "drink");
});

test("round-ups must be about Melbourne", () => {
  const xml = `<rss><channel>
    <item><title>The best things to do in Sydney this weekend - Secret Sydney</title><link>https://n/1</link><pubDate>Fri, 13 Nov 2026 02:00:00 GMT</pubDate></item>
    <item><title>Things to do this weekend - About Regional</title><link>https://n/2</link><pubDate>Fri, 13 Nov 2026 02:00:00 GMT</pubDate></item>
    <item><title>Things to do in Melbourne this weekend - Urban List</title><link>https://n/3</link><pubDate>Fri, 13 Nov 2026 02:00:00 GMT</pubDate></item>
  </channel></rss>`;
  assert.deepEqual(roundupsFrom("gnews", xml).map((r) => r.source), ["Urban List"]);
});

test("round-ups: one per source, the last 7 days", () => {
  const now = [...roundupsFrom("gnews", fx("gnews.xml")), ...roundupsFrom("timeout", fx("timeout.xml"))];
  assert.deepEqual(now.map((r) => r.source), ["Secret Melbourne", "Time Out"]);
  const prev = [{ title: "Old things to do this weekend", source: "Urban", url: "u", date: "2026-11-01" }, { title: "x", source: "Time Out", url: "t", date: "2026-11-09" }];
  assert.deepEqual(mergeRoundups(now, prev, TODAY).map((r) => r.source), ["Time Out", "Secret Melbourne"]);
});

test("mergeFresh keeps 21 days, newest first, each item once", () => {
  const a = { id: "timeout:a", title: "A new bar opens", date: "2026-11-14" };
  const b = { id: "gnews:x", title: "A NEW BAR OPENS!", date: "2026-11-13" };
  const old = { id: "concrete:o", title: "Old", date: "2026-10-20" };
  const mid = { id: "concrete:m", title: "Mid", date: "2026-11-01" };
  assert.deepEqual(mergeFresh([b, a], [a, old, mid], TODAY).map((f) => f.id), ["gnews:x", "concrete:m"], "same headline kept once; older than 21 days dropped");
});

// ---------- weather and holidays ----------

test("weatherFrom and holidaysFrom", () => {
  const w = weatherFrom(JSON.parse(fx("open-meteo.json")));
  assert.deepEqual(w[0], { date: "2026-11-15", rain: 92, max: 17 });
  assert.equal(w.length, 7);
  assert.deepEqual(weatherFrom(null), []);
  const h = holidaysFrom([JSON.parse(fx("nager.json"))]);
  assert.deepEqual(h.map((x) => x.name), ["New Year's Day", "Labour Day", "Melbourne Cup", "Christmas Day"], "WA's Labour Day left out");
  assert.equal(h[1].date, "2026-03-09");
});

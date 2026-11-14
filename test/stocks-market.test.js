import { test } from "node:test";
import assert from "node:assert/strict";
import { PERIODS, periodReturn, heat, pool, breadth, movers, sectors, ratingMix, groups, marketClock, shortSymbol, overlay, HOURS, worldRank } from "../stocks/market.js";
import { INDICES } from "../stocks/universe.js";

const s = (t, m, over = {}) => ({ t, n: t, m, kind: "stock", rating: "Hold", r1d: 0, r1m: 0, r3m: 0, r6m: 0, r12m: 0, close: 100, facts: { sma200: 90 }, ...over });
const COMPANIES = { A: ["Technology"], B: ["Technology"], C: ["Energy"], D: ["Financials"], F: ["Index fund"] };

test("each period reads its own return, and a missing figure is null rather than zero", () => {
  assert.deepEqual(PERIODS.map((p) => p[0]), ["1D", "1M", "3M", "6M", "1Y"]);
  const x = s("A", "US", { r1d: 0.01, r1m: 0.02, r3m: 0.03, r6m: 0.06, r12m: 0.12 });
  assert.deepEqual(PERIODS.map(([p]) => periodReturn(x, p)), [0.01, 0.02, 0.03, 0.06, 0.12]);
  assert.equal(periodReturn(s("A", "US", { r12m: undefined }), "1Y"), null);
  assert.equal(periodReturn(null, "1D"), null);
});

test("heat runs −4 to +4, scaled to the period so a 3% day is as hot as a 40% year", () => {
  assert.equal(heat(0.03, "1D"), 4);
  assert.equal(heat(0.4, "1Y"), 4);
  assert.equal(heat(0.03, "1Y"), 0, "3% is nothing much over a year");
  assert.equal(heat(-0.5, "1D"), -4, "capped");
  assert.equal(heat(0.0075, "1D"), 1);
  assert.equal(heat(-0.015, "1D"), -2);
  assert.equal(heat(0.002, "1D"), 0);
  assert.equal(heat(null, "1D"), null, "no figure: no colour, not a neutral one");
});

test("the pool is the stocks in the chosen market; index funds stay out of the market figures", () => {
  const xs = [s("A", "US"), s("C", "HK"), s("F", "US", { kind: "fund" })];
  assert.deepEqual(pool(xs, "all").map((x) => x.t), ["A", "C"]);
  assert.deepEqual(pool(xs, "HK").map((x) => x.t), ["C"]);
});

test("breadth counts rises and falls over the period and how many sit above their 200-day average", () => {
  const xs = [s("A", "US", { r1d: 0.01 }), s("B", "US", { r1d: -0.02, close: 80 }), s("C", "US", { r1d: 0 }), s("D", "US", { r1d: null, facts: null })];
  assert.deepEqual(breadth(xs, "1D"), { up: 1, down: 1, flat: 1, total: 3, above200: 2, with200: 3 });
});

test("movers: the biggest rises and falls, rises only among rises, at most n each", () => {
  const xs = [s("A", "US", { r1m: 0.2 }), s("B", "US", { r1m: 0.05 }), s("C", "US", { r1m: -0.1 }), s("D", "US", { r1m: -0.3 }), s("E", "US", { r1m: null })];
  const m = movers(xs, "1M", 1);
  assert.deepEqual(m.up.map((x) => x.t), ["A"]);
  assert.deepEqual(m.down.map((x) => x.t), ["D"]);
  assert.deepEqual(movers(xs, "1M", 5).up.map((x) => x.t), ["A", "B"], "a fall never fills the rises list");
  assert.deepEqual(movers([s("A", "US", { r1m: -0.1 })], "1M").up, []);
});

test("sectors: an equal-weight average per sector, best first, with its best and worst stock", () => {
  const xs = [s("A", "US", { r6m: 0.3 }), s("B", "US", { r6m: 0.1 }), s("C", "US", { r6m: -0.2 }), s("D", "US", { r6m: null }), s("Z", "US", { r6m: 0.5 })];
  const out = sectors(xs, "6M", COMPANIES);
  assert.deepEqual(out.map((x) => x.sector), ["Technology", "Energy"], "no figure, no sector; an unknown company is left out");
  assert.ok(Math.abs(out[0].avg - 0.2) < 1e-12);
  assert.equal(out[0].n, 2);
  assert.equal(out[0].best, "A");
  assert.equal(out[0].worst, "B");
});

test("rating mix counts every rating, Review included, in the order the ratings run", () => {
  const xs = [s("A", "US", { rating: "Buy" }), s("B", "US", { rating: "Buy" }), s("C", "US", { rating: "Sell" }), s("D", "US", { rating: "REVIEW" })];
  const mix = ratingMix(xs);
  assert.deepEqual(mix.counts, [["Buy", 2], ["Overweight", 0], ["Hold", 0], ["Underweight", 0], ["Sell", 1], ["REVIEW", 1]]);
  assert.equal(mix.total, 4);
});

test("map groups: by market in the list's order, or by sector largest first; tiles hottest first", () => {
  const xs = [s("C", "HK", { r1d: 0.01 }), s("A", "US", { r1d: -0.01 }), s("B", "US", { r1d: 0.02 }), s("D", "UK", { r1d: null })];
  const markets = { US: { label: "US" }, HK: { label: "Hong Kong" }, UK: { label: "UK" } };
  const byMarket = groups(xs, "market", "1D", COMPANIES, markets);
  assert.deepEqual(byMarket.map((g) => g.label), ["US", "Hong Kong", "UK"]);
  assert.deepEqual(byMarket[0].items.map((x) => x.t), ["B", "A"], "hottest first");
  assert.ok(Math.abs(byMarket[0].avg - 0.005) < 1e-12);
  assert.equal(byMarket[2].avg, null, "a group with no figures has no average");
  const bySector = groups(xs, "sector", "1D", COMPANIES, markets);
  assert.deepEqual(bySector.map((g) => g.label), ["Technology", "Energy", "Financials"]);
});

test("short symbols drop the exchange suffix and Hong Kong's leading zeros", () => {
  assert.equal(shortSymbol("AAPL"), "AAPL");
  assert.equal(shortSymbol("0700.HK"), "700");
  assert.equal(shortSymbol("AZN.L"), "AZN");
  assert.equal(shortSymbol("BRK-B"), "BRK-B");
});

// Wednesday 12 November 2026. New York is UTC−5, Hong Kong UTC+8, London UTC+0 (no daylight saving then).
const at = (iso) => new Date(iso);

test("market clock: New York open mid-session, with the minutes to the close", () => {
  const c = marketClock("US", at("2026-11-12T15:00:00Z"));   // 10:00 in New York
  assert.equal(c.open, true);
  assert.equal(c.minutes, 360);
  assert.equal(c.at.toISOString(), "2026-11-12T21:00:00.000Z");
});

test("market clock: Hong Kong shuts for lunch and reopens at 13:00", () => {
  const c = marketClock("HK", at("2026-11-12T04:30:00Z"));   // 12:30 in Hong Kong
  assert.equal(c.open, false);
  assert.equal(c.minutes, 30);
  assert.equal(c.at.toISOString(), "2026-11-12T05:00:00.000Z");
});

test("market clock: after Friday's close London next opens on Monday at 08:00", () => {
  const c = marketClock("UK", at("2026-11-13T17:00:00Z"));   // Friday 17:00 in London
  assert.equal(c.open, false);
  assert.equal(c.at.toISOString(), "2026-11-16T08:00:00.000Z");
  assert.equal(c.minutes, (2 * 24 + 15) * 60);
});

test("market clock: a weekend that crosses a clock change still lands on 09:30 New York time", () => {
  // Daylight saving ends in New York on Sunday 1 November 2026: Friday is UTC−4, Monday UTC−5.
  const c = marketClock("US", at("2026-10-30T21:00:00Z"));   // Friday 17:00 in New York
  assert.equal(c.open, false);
  assert.equal(c.at.toISOString(), "2026-11-02T14:30:00.000Z");
});

test("market clock: seconds past the minute don't push the countdown out by one", () => {
  const c = marketClock("US", at("2026-11-12T15:00:40Z"));
  assert.equal(c.at.toISOString(), "2026-11-12T21:00:00.000Z");
  assert.equal(c.minutes, 360);
});

test("index overlay: each index as % change from the range's first shared day, its level kept for the readout", () => {
  const us = { key: "US", d: ["D1", "D2", "D3", "D4"], p: [null, 100, 110, 121] };   // the first day had no index close
  const hk = { key: "HK", d: ["D1", "D3", "D4"], p: [50, 40, 60] };                   // no session on D2
  const o = overlay([us, hk], Infinity);
  assert.deepEqual(o.d, ["D2", "D3", "D4"]);
  assert.deepEqual(o.lines[0].level, [100, 110, 121]);
  assert.deepEqual(o.lines[0].pct.map((x) => +x.toFixed(4)), [0, 0.1, 0.21]);
  assert.deepEqual(o.lines[1].level, [50, 40, 60], "a market shut for the day carries its last close over");
  assert.deepEqual(o.lines[1].pct.map((x) => +x.toFixed(4)), [0, -0.2, 0.2]);
  assert.equal(+o.lo.toFixed(4), -0.2);
  assert.equal(+o.hi.toFixed(4), 0.21);
  assert.equal(overlay([{ key: "US", d: ["D1"], p: [null] }], Infinity), null, "nothing to draw");
});

test("index overlay: a range of n sessions is n moves, so it ends on the same figure as the cards", () => {
  const us = { key: "US", d: ["D1", "D2", "D3", "D4", "D5"], p: [100, 101, 102, 103, 110] };
  const o = overlay([us], 2);
  assert.deepEqual(o.d, ["D3", "D4", "D5"], "two moves need three closes");
  assert.equal(o.lines[0].pct.at(-1), 110 / 102 - 1);
});

test("index overlay: a market that has closed a session the first has not reached yet still shows it", () => {
  // Hong Kong closes hours before New York: for most of the day its newest session is a date New York lacks.
  const us = { key: "US", d: ["D1", "D2", "D3"], p: [100, 110, 121] };
  const hk = { key: "HK", d: ["D1", "D2", "D3", "D4"], p: [50, 55, 60, 66] };
  const o = overlay([us, hk], 2);
  assert.deepEqual(o.d, ["D1", "D2", "D3", "D4"]);
  assert.deepEqual(o.lines[1].level, [50, 55, 60, 66], "Hong Kong's own newest close is on the chart");
  assert.deepEqual(o.lines[0].level, [100, 110, 121, 121], "New York holds its last close until it trades");
});

test("every world index has its exchange's hours", () => {
  for (const i of INDICES) assert.ok(HOURS[i.key], `no hours for ${i.key}`);
});

test("market clock: Tokyo breaks for lunch from 11:30 to 12:30", () => {
  const c = marketClock("JP", at("2026-11-12T02:45:00Z"));   // 11:45 in Tokyo (UTC+9)
  assert.equal(c.open, false);
  assert.equal(c.at.toISOString(), "2026-11-12T03:30:00.000Z");
});

test("market clock: Sydney in daylight saving opens at 10:00 local, 23:00 UTC the day before", () => {
  const c = marketClock("AU", at("2026-11-12T22:00:00Z"));   // 09:00 Friday in Sydney (UTC+11)
  assert.equal(c.open, false);
  assert.equal(c.minutes, 60);
  assert.equal(c.at.toISOString(), "2026-11-12T23:00:00.000Z");
});

test("market clock: Mumbai opens at 09:15", () => {
  const c = marketClock("IN", at("2026-11-12T03:40:00Z"));   // 09:10 in India (UTC+5:30)
  assert.equal(c.open, false);
  assert.equal(c.minutes, 5);
});

test("world ranking: best move over the period first, indices with no figure last", () => {
  const w = [{ key: "US", r1m: 0.01 }, { key: "JP", r1m: 0.05 }, { key: "AU", r1m: null }, { key: "CN", r1m: -0.02 }];
  assert.deepEqual(worldRank(w, "1M").map((x) => x.key), ["JP", "US", "CN", "AU"]);
});

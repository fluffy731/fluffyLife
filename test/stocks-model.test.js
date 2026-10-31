import { test } from "node:test";
import assert from "node:assert/strict";
import { sma, rsi, atr, analyse, replay, scorecard, sparkline, closeAsOf, REVIEW, MIN_BARS, HOLD_DAYS } from "../stocks/model.js";

// Weekday dates from 2024-01-01, so bars look like trading sessions.
function weekdays(n) {
  const out = [], d = new Date(Date.UTC(2024, 0, 1));
  while (out.length < n) {
    if (d.getUTCDay() % 6 !== 0) out.push(d.toISOString().slice(0, 10));
    d.setUTCDate(d.getUTCDate() + 1);
  }
  return out;
}
const series = (n, f) => weekdays(n).map((d, i) => { const c = f(i); return { d, h: c * 1.01, l: c * 0.99, c }; });
const N = 400;
const flat = series(N, () => 100);
const up = series(N, (i) => 100 * 1.002 ** i);
const down = series(N, (i) => 100 * 0.998 ** i);
const OPTS = { benchName: "S&P 500" };

test("moving average, RSI and ATR on simple series", () => {
  assert.equal(sma([1, 2, 3, 4, 5], 2, 4), 4.5);
  assert.equal(sma([1, 2, 3], 5, 2), null, "not enough values");
  const rising = Array.from({ length: 30 }, (_, i) => 10 + i);
  assert.equal(rsi(rising, 29), 100);
  assert.equal(rsi(rising.slice().reverse(), 29), 0);
  assert.ok(Math.abs(atr(flat, 50) - 2) < 1e-9, "high-low range of 2 on a 100 close");
});

test("a steady climber beating a flat index is a Buy, a steady faller a Sell, a flat line a Hold", () => {
  const last = N - 1;
  const a = analyse(up, flat, last, OPTS);
  assert.equal(a.rating, "Buy");
  assert.ok(a.bull.length >= 3 && a.score >= 4);
  assert.ok(a.bull.some((p) => /S&P 500/.test(p)), "relative strength names the index");
  assert.equal(analyse(down, flat, last, OPTS).rating, "Sell");
  assert.equal(analyse(flat, flat, last, OPTS).rating, "Hold");
});

test("every analyst reports a score and the judge's score is their sum", () => {
  const a = analyse(up, flat, N - 1, OPTS);
  assert.deepEqual(a.analysts.map((x) => x.key), ["trend", "momentum", "relative", "risk"]);
  assert.equal(a.score, a.analysts.reduce((s, x) => s + x.score, 0));
});

test("not enough history, or no index prices for the window, is REVIEW, never a Hold", () => {
  const short = analyse(up.slice(0, 100), flat, 99, OPTS);
  assert.equal(short.rating, REVIEW);
  assert.match(short.reason, /history/);
  const noBench = analyse(up, flat.slice(0, 50), N - 1, OPTS);
  assert.equal(noBench.rating, REVIEW);
  assert.match(noBench.reason, /index/);
});

test("a call uses only prices up to its own date", () => {
  const end = 300;
  const later = up.map((b, i) => (i > end ? { ...b, c: b.c * 5, h: b.h * 5, l: b.l * 5 } : b));
  const laterBench = flat.map((b, i) => (i > end ? { ...b, c: 1 } : b));
  assert.deepEqual(analyse(later, laterBench, end, OPTS), analyse(up, flat, end, OPTS));
});

test("a stock that spikes at the end draws the risk analyst's objection", () => {
  const spike = series(N, (i) => (i < N - 10 ? 100 : 100 * 1.04 ** (i - (N - 11))));
  const a = analyse(spike, flat, N - 1, OPTS);
  const risk = a.analysts.find((x) => x.key === "risk");
  assert.ok(risk.score < 0);
  assert.ok(a.bear.some((p) => /RSI/.test(p)));
});

test("the trader view sets levels two average ranges either side of the close", () => {
  const a = analyse(flat, flat, N - 1, OPTS);
  assert.ok(Math.abs(a.plan.down - 96) < 1e-9 && Math.abs(a.plan.up - 104) < 1e-9);
});

test("replay ends on today's call and leaves the last calls unscored until their window trades", () => {
  const calls = replay(up, flat, OPTS);
  const last = calls.at(-1);
  assert.equal(last.d, up.at(-1).d);
  assert.equal(last.alpha, null);
  const scored = calls.filter((c) => c.alpha !== null);
  assert.ok(scored.length > 0);
  assert.ok(calls.filter((c) => c.alpha === null).every((c) => up.findIndex((b) => b.d === c.d) + 1 + HOLD_DAYS > N - 1));
  assert.ok(calls[0].d >= up[MIN_BARS - 1].d, "first call has a full history behind it");
});

test("outcomes start at the next session's close and are measured against the index", () => {
  const calls = replay(up, flat, OPTS);
  const c = calls.find((x) => x.alpha !== null);
  const i = up.findIndex((b) => b.d === c.d);
  const expected = up[i + 1 + HOLD_DAYS].c / up[i + 1].c - 1;
  assert.ok(Math.abs(c.ret - expected) < 1e-12);
  assert.ok(Math.abs(c.alpha - expected) < 1e-12, "flat index, so alpha equals the return");
});

test("scorecard: hit rate in the rating's direction, mean alpha, and the Buy-minus-Sell spread", () => {
  const calls = [
    { rating: "Buy", alpha: 0.04 }, { rating: "Buy", alpha: -0.02 }, { rating: "Overweight", alpha: 0.01 },
    { rating: "Hold", alpha: 0.03 }, { rating: "Sell", alpha: -0.05 }, { rating: "Underweight", alpha: 0.01 },
    { rating: "Buy", alpha: null, waiting: true }, { rating: "Sell", alpha: null, waiting: false }, { rating: REVIEW, alpha: null },
  ];
  const s = scorecard(calls);
  assert.equal(s.scored, 6);
  assert.equal(s.pending, 1);
  assert.equal(s.review, 1);
  assert.equal(s.byRating.Buy.n, 2);
  assert.equal(s.byRating.Buy.hit, 0.5);
  assert.ok(Math.abs(s.byRating.Buy.alpha - 0.01) < 1e-12);
  assert.equal(s.byRating.Hold.hit, null, "Hold claims no direction");
  assert.equal(s.byRating.Sell.hit, 1);
  assert.ok(Math.abs(s.spread - (0.01 - -0.02)) < 1e-12, "bullish mean 0.01 minus bearish mean -0.02");
  assert.equal(scorecard([]).spread, null);
});

test("against the index, dividends are left out: a flat price with a yield neither beats nor trails a flat price index", () => {
  const paying = series(N, (i) => 100 * 1.0002 ** i).map((b) => ({ ...b, p: 100 }));
  const a = analyse(paying, flat, N - 1, OPTS);
  assert.ok(Math.abs(a.facts.rel6) < 1e-12);
  assert.ok(a.facts.r6m > 0.02, "the total return still counts for momentum");
  const scored = replay(paying, flat, OPTS).filter((c) => c.alpha != null);
  assert.ok(scored.length > 0 && scored.every((c) => Math.abs(c.alpha) < 1e-12));
});

test("trend reads the price as quoted, like the chart: a flat price with a yield is no uptrend, though its return counts", () => {
  const paying = series(N, (i) => 100 * 1.0004 ** i).map((b) => ({ ...b, p: 100 }));
  const a = analyse(paying, flat, N - 1, OPTS);
  assert.equal(a.facts.sma200, 100);
  assert.equal(a.analysts.find((x) => x.key === "trend").score, 0);
  assert.equal(a.facts.r6p, 0);
  assert.ok(a.facts.r12m > 0.1, "the dividend-adjusted return still shows what an owner received");
});

test("an index close more than 4 days before the date is no comparison", () => {
  const b = [{ d: "2026-10-01", c: 1 }];
  assert.equal(closeAsOf(b, "2026-10-05"), 1);
  assert.equal(closeAsOf(b, "2026-10-06"), null);
  assert.equal(closeAsOf(b, "2026-09-30"), null);
});

test("sparkline keeps the first and last close and at most the asked number of points", () => {
  const s = sparkline(up, 126, 40);
  assert.ok(s.length <= 40);
  assert.equal(s[0], +up[N - 126].c.toPrecision(6));
  assert.equal(s.at(-1), +up[N - 1].c.toPrecision(6));
});

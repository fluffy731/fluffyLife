import { test } from "node:test";
import assert from "node:assert/strict";
import { parseChart, completedBars, buildFeed, noteFor, NOTE_MODEL, FEED_VERSION } from "../scripts/build-stocks.mjs";
import { MARKETS, UNIVERSE } from "../stocks/universe.js";

// A Yahoo chart response in the v8 shape: sessions open 09:30 New York (13:30 UTC in summer).
const open = (iso) => Date.parse(`${iso}T13:30:00Z`) / 1000;
const chart = (overrides = {}) => ({
  chart: { error: null, result: [{
    meta: { currency: "USD", gmtoffset: -14400, currentTradingPeriod: { regular: { start: open("2026-10-30"), end: open("2026-10-30") + 23400 } } },
    timestamp: [open("2026-10-27"), open("2026-10-28"), open("2026-10-29"), open("2026-10-30")],
    indicators: {
      quote: [{ high: [11, 12, null, 14], low: [9, 10, null, 12], close: [10, 11, null, 13] }],
      adjclose: [{ adjclose: [5, 11, null, 13] }],
    },
    ...overrides,
  }] },
});

test("a Yahoo chart becomes dated bars in exchange time, adjusted for dividends and splits, gaps dropped", () => {
  const { bars, currency } = parseChart(chart());
  assert.equal(currency, "USD");
  assert.deepEqual(bars.map((b) => b.d), ["2026-10-27", "2026-10-28", "2026-10-30"]);
  assert.deepEqual(bars[0], { d: "2026-10-27", h: 5.5, l: 4.5, c: 5 }, "adjusted close of 5 halves the whole bar");
  assert.equal(bars[2].c, 13);
});

test("a Yahoo error or empty result is refused, not read as no prices", () => {
  assert.throws(() => parseChart({ chart: { error: { code: "Not Found", description: "No data found" }, result: null } }), /No data found/);
});

test("today's bar is dropped while the session is still trading, kept once it has closed", () => {
  const { bars, session } = parseChart(chart());
  const during = session.end - 600, after = session.end + 60;
  assert.equal(completedBars(bars, session, during).at(-1).d, "2026-10-28");
  assert.equal(completedBars(bars, session, after).at(-1).d, "2026-10-30");
});

// Synthetic two years of sessions for the feed tests.
function sessions(n, f) {
  const out = [], d = new Date(Date.UTC(2024, 9, 1));
  while (out.length < n) {
    if (d.getUTCDay() % 6 !== 0) { const c = f(out.length); out.push({ d: d.toISOString().slice(0, 10), h: c * 1.01, l: c * 0.99, c }); }
    d.setUTCDate(d.getUTCDate() + 1);
  }
  return out;
}

test("the feed rates every fetched stock, lists the ones that failed, and scores the replay per market", () => {
  const bench = sessions(500, () => 100);
  const prices = { AAPL: { bars: sessions(500, (i) => 100 * 1.002 ** i), currency: "USD" }, MSFT: { bars: sessions(500, (i) => 100 * 0.998 ** i), currency: "USD" } };
  const universe = [{ t: "AAPL", n: "Apple", m: "US" }, { t: "MSFT", n: "Microsoft", m: "US" }, { t: "NOPE", n: "Missing", m: "US" }];
  const feed = buildFeed({ universe, markets: { US: MARKETS.US }, prices, benches: { US: bench }, builtAt: "2026-10-31T00:00:00Z" });
  assert.equal(feed.version, FEED_VERSION);
  assert.deepEqual(feed.stocks.map((s) => s.t), ["AAPL", "MSFT"], "best score first");
  assert.deepEqual(feed.failed, ["NOPE"]);
  const apple = feed.stocks[0];
  assert.equal(apple.rating, "Buy");
  assert.ok(apple.history.length <= 12 && apple.history.at(-1).d === apple.d);
  assert.equal(apple.prev, apple.history.at(-2).rating);
  assert.ok(feed.scorecard.all.scored > 0 && feed.scorecard.US.scored === feed.scorecard.all.scored);
  assert.ok(feed.scorecard.all.spread > 0, "climber rated bullish beat faller rated bearish");
  assert.equal(feed.noteKey, bench.at(-1).d, "one note per completed US session");
  assert.equal(feed.markets.US.asOf, bench.at(-1).d);
});

test("a market whose index could not be fetched rates its stocks REVIEW rather than dropping them", () => {
  const prices = { AAPL: { bars: sessions(500, (i) => 100 + i), currency: "USD" } };
  const feed = buildFeed({ universe: [{ t: "AAPL", n: "Apple", m: "US" }], markets: { US: MARKETS.US }, prices, benches: {}, builtAt: "2026-10-31T00:00:00Z" });
  assert.equal(feed.stocks[0].rating, "REVIEW");
  assert.match(feed.stocks[0].reason, /index/);
});

const feedFor = (key) => ({ noteKey: key, stocks: [{ t: "AAPL", n: "Apple", m: "US", rating: "Buy", score: 5, prev: "Overweight", r6m: 0.2, bull: ["x"], bear: [] }], scorecard: { all: { spread: 0.01, scored: 40 } }, markets: { US: MARKETS.US } });
const fakeClient = (reply) => {
  const calls = [];
  return { calls, messages: { create: async (req) => { calls.push(req); return reply; } } };
};
const ok = { stop_reason: "end_turn", content: [{ type: "thinking", thinking: "" }, { type: "text", text: "  Apple leads the screen.  " }] };

test("the daily note is written once per US session and reused until the next one", async () => {
  const client = fakeClient(ok);
  const note = await noteFor(feedFor("2026-10-30"), null, client);
  assert.deepEqual({ key: note.key, text: note.text, model: note.model }, { key: "2026-10-30", text: "Apple leads the screen.", model: NOTE_MODEL });
  assert.equal(client.calls.length, 1);
  assert.equal(client.calls[0].model, "claude-haiku-5-5");
  assert.match(client.calls[0].messages[0].content, /AAPL/);
  assert.match(client.calls[0].system, /Do not tell the reader to buy or sell/);
  assert.equal(await noteFor(feedFor("2026-10-30"), note, client), note, "same session: no second call");
  assert.equal(client.calls.length, 1);
});

test("no API key means no note; a cut-off or refused reply is not published", async () => {
  assert.equal(await noteFor(feedFor("2026-10-30"), null, null), null);
  assert.equal(await noteFor(feedFor("2026-10-30"), { key: "2026-10-29", text: "old" }, null), null, "yesterday's note is not shown against today's ratings");
  assert.equal(await noteFor(feedFor("2026-10-30"), null, fakeClient({ ...ok, stop_reason: "max_tokens" })), null);
  assert.equal(await noteFor(feedFor("2026-10-30"), null, fakeClient({ stop_reason: "refusal", content: [] })), null);
});

test("the universe covers US, Hong Kong and UK with no symbol twice", () => {
  const symbols = UNIVERSE.map((s) => s.t);
  assert.equal(new Set(symbols).size, symbols.length);
  for (const m of ["US", "HK", "UK"]) assert.ok(UNIVERSE.filter((s) => s.m === m).length >= 20, m);
  assert.ok(UNIVERSE.every((s) => MARKETS[s.m]));
});

import { test } from "node:test";
import assert from "node:assert/strict";
import { parseChart, completedBars, buildFeed, noteFor, parseNews, newsFromRss, mergeNews, aboutCompany, historyFor, fxRates, NOTE_MODEL, FEED_VERSION, SETTLE_SEC, NEWS_MAX } from "../scripts/build-stocks.mjs";
import { historyFile } from "../stocks/model.js";
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
  assert.deepEqual(bars[0], { d: "2026-10-27", h: 5.5, l: 4.5, c: 5, p: 10 }, "adjusted close of 5 halves the bar; the price alone stays");
  assert.equal(bars[2].c, 13);
});

test("the date is the exchange's own: a Hong Kong session stamped late in the UTC evening is the next day", () => {
  const ts = Date.parse("2026-10-29T20:00:00Z") / 1000;
  const hk = { chart: { error: null, result: [{ meta: { currency: "HKD", gmtoffset: 28800 }, timestamp: [ts], indicators: { quote: [{ high: [2], low: [1], close: [1.5] }] } }] } };
  const { bars, session } = parseChart(hk);
  assert.equal(bars[0].d, "2026-10-30");
  assert.equal(bars[0].c, bars[0].p, "no adjusted close: the price is the close");
  assert.equal(session, null);
  assert.deepEqual(completedBars(bars, session, ts), bars, "no session times: nothing dropped");
});

test("a second row for the same day keeps the later one", () => {
  const twice = chart({ timestamp: [open("2026-10-29"), open("2026-10-30"), open("2026-10-30") + 3600],
    indicators: { quote: [{ high: [11, 12, 13], low: [9, 10, 11], close: [10, 11, 12] }] } });
  const { bars } = parseChart(twice);
  assert.deepEqual(bars.map((b) => [b.d, b.c]), [["2026-10-29", 10], ["2026-10-30", 12]]);
});

test("a Yahoo error or empty result is refused, not read as no prices", () => {
  assert.throws(() => parseChart({ chart: { error: { code: "Not Found", description: "No data found" }, result: null } }), /No data found/);
  assert.throws(() => parseChart({ chart: { error: null, result: [] } }), /no prices/);
});

test("today's bar is dropped while the session trades and through the closing auction, kept once settled", () => {
  const { bars, session } = parseChart(chart());
  assert.equal(completedBars(bars, session, session.end - 600).at(-1).d, "2026-10-28");
  assert.equal(completedBars(bars, session, session.end + 600).at(-1).d, "2026-10-28", "auction and delayed prices");
  assert.equal(completedBars(bars, session, session.end + SETTLE_SEC + 60).at(-1).d, "2026-10-30");
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

const feedFor = (key) => ({ noteKey: key, stocks: [{ t: "AAPL", n: "Apple", m: "US", rating: "Buy", score: 5, prev: "Overweight", r6m: 0.2, bull: ["x"], bear: [],
  news: [{ t: "Apple unveils new chip", p: "Reuters", l: "https://example.com/a", at: 0 }] }], scorecard: { all: { spread: 0.01, scored: 40 } }, markets: { US: MARKETS.US } });
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

// Yahoo search's news in its v1 shape: publish times in epoch seconds, tagged tickers per article.
const NOW = Date.parse("2026-10-31T12:00:00Z");
const ago = (h) => Math.floor((NOW - h * 3600e3) / 1000);
const TENCENT = { t: "0700.HK", n: "Tencent", m: "HK", adr: "TCEHY" }, APPLE = { t: "AAPL", n: "Apple", m: "US" }, CHINA_MOBILE = { t: "0941.HK", n: "China Mobile", m: "HK" };
const article = (title, tickers, hoursAgo, extra = {}) => ({ title, publisher: "Reuters", link: `https://finance.example.com/${encodeURIComponent(title)}`, providerPublishTime: ago(hoursAgo), relatedTickers: tickers, ...extra });

test("news keeps only articles tagged with the stock or its US-listed shares, newest first", () => {
  const json = { news: [
    article("Tencent results beat", ["TCEHY"], 5),
    article("Hang Seng closes higher", ["^HSI"], 1),
    article("Tencent games licence", ["0700.HK", "NTES"], 2),
    article("Untagged market wrap", undefined, 1),
  ] };
  assert.deepEqual(parseNews(json, TENCENT, NOW).map((n) => n.t), ["Tencent games licence", "Tencent results beat"]);
  const first = parseNews(json, TENCENT, NOW)[0];
  assert.deepEqual(Object.keys(first).sort(), ["at", "l", "p", "t"]);
  assert.equal(first.at, ago(2) * 1000);
});

test("news leaves out stale, opinion, duplicate and non-web links, and keeps at most the cap", () => {
  const json = { news: [
    article("Apple shares rise", ["AAPL"], 1),
    article("Apple shares rise", ["AAPL"], 3),
    article("Opinion: Apple is overvalued", ["AAPL"], 2),
    article("Old Apple story", ["AAPL"], 24 * 8),
    article("Sneaky link", ["AAPL"], 1, { link: "javascript:alert(1)" }),
    article("No time", ["AAPL"], 1, { providerPublishTime: undefined }),
    ...Array.from({ length: 10 }, (_, i) => article(`Apple story ${i}`, ["aapl"], 10 + i)),
  ] };
  const news = parseNews(json, APPLE, NOW);
  assert.equal(news.length, NEWS_MAX);
  assert.equal(news[0].t, "Apple shares rise");
  assert.equal(news.filter((n) => n.t === "Apple shares rise").length, 1);
  assert.ok(!news.some((n) => /Opinion|Old Apple|Sneaky|No time/.test(n.t)));
  assert.deepEqual(parseNews({}, APPLE, NOW), [], "no news array: nothing, not an error");
});

// Yahoo's per-stock RSS feed, which answers when its search does not (seen live: the same search 24, 0, 24).
const rssItem = (title, hoursAgo, link = `https://finance.yahoo.com/news/${encodeURIComponent(title)}`) =>
  `<item><title>${title}</title><link>${link}</link><pubDate>${new Date(NOW - hoursAgo * 3600e3).toUTCString()}</pubDate><guid>${link}</guid></item>`;
const rss = (items) => `<?xml version="1.0"?><rss version="2.0"><channel><title>Yahoo! Finance: 0941.HK News</title>${items.join("")}</channel></rss>`;

test("news from Yahoo's per-stock RSS: last week only, opinion and non-web links left out, newest first", () => {
  const xml = rss([rssItem("China Mobile adds 5G users", 30), rssItem("China Mobile dividend raised", 2), rssItem("Old China Mobile story", 24 * 9),
    rssItem("Opinion: why China Mobile is cheap", 3), rssItem("China Mobile odd link", 1, "ftp://example.com/x"), rssItem("Is AMC Stock a Trick or a Treat?", 1)]);
  const news = newsFromRss(xml, CHINA_MOBILE, NOW);
  assert.deepEqual(news.map((n) => n.t), ["China Mobile dividend raised", "China Mobile adds 5G users"]);
  assert.equal(news[0].p, "Yahoo Finance", "the feed names no publisher, so the page credits where it came from");
  assert.equal(news[0].at, Math.floor((NOW - 2 * 3600e3) / 1000) * 1000);
  assert.deepEqual(newsFromRss("<html>not a feed</html>", CHINA_MOBILE, NOW), []);
});

test("a headline must name the company: its name, a usual short name, or a symbol of three letters or more", () => {
  const google = aboutCompany({ t: "GOOGL", n: "Alphabet", m: "US" });
  assert.ok(google("Google faces new EU probe") && google("Alphabet earnings beat") && google("GOOGL slides after results"));
  assert.ok(!google("Is AMC Stock a Trick or a Treat?"));
  const nvidia = aboutCompany({ t: "NVDA", n: "Nvidia", m: "US" });
  assert.ok(nvidia("NVDA stock jumps") && nvidia("NVIDIA unveils chip"));
  const visa = aboutCompany({ t: "V", n: "Visa", m: "US" });
  assert.ok(visa("Visa raises fees") && !visa("Plan V delayed"), "a one-letter symbol is not matched as a word");
  const pg = aboutCompany({ t: "PG", n: "Procter & Gamble", m: "US" });
  assert.ok(pg("P&G lifts prices") && pg("Procter & Gamble beats"));
  assert.ok(!aboutCompany(APPLE)("Applebee's opens 50 restaurants"), "part of a word is not the company");
  assert.ok(!aboutCompany({ t: "SHEL.L", n: "Shell", m: "UK", adr: "SHEL" })("Shellfish prices soar") && aboutCompany({ t: "SHEL.L", n: "Shell", m: "UK", adr: "SHEL" })("Shell profit falls"));
  assert.ok(aboutCompany(TENCENT)("TCEHY: what the ADR is telling you"));
});

test("both sources merge: one copy of a story, the named publisher kept, newest first, at most the cap", () => {
  const fromRss = [{ t: "Apple shares rise", p: "Yahoo Finance", l: "https://a", at: NOW - 1000 }, { t: "Apple chip news", p: "Yahoo Finance", l: "https://b", at: NOW - 5000 }];
  const fromSearch = [{ t: "apple shares rise ", p: "Reuters", l: "https://c", at: NOW - 900 }, ...Array.from({ length: 8 }, (_, i) => ({ t: `Story ${i}`, p: "Bloomberg", l: `https://s/${i}`, at: NOW - 10000 - i }))];
  const merged = mergeNews([fromRss, fromSearch]);
  assert.equal(merged.length, NEWS_MAX);
  assert.equal(merged.filter((n) => n.t.toLowerCase().trim() === "apple shares rise").length, 1);
  assert.equal(merged[0].p, "Reuters");
  assert.deepEqual(merged.map((n) => n.at), [...merged.map((n) => n.at)].sort((a, b) => b - a));
  assert.equal(mergeNews([null, fromRss]).length, 2, "a source that failed adds nothing");
  assert.equal(mergeNews([null, null]), null, "both failed: not fetched, which is not the same as no news");
});

test("the feed carries each stock's headlines, null when its news could not be fetched", () => {
  const bars = sessions(300, (i) => 100 + i);
  const universe = [{ t: "AAPL", n: "Apple", m: "US" }, { t: "MSFT", n: "Microsoft", m: "US" }];
  const prices = { AAPL: { bars, currency: "USD" }, MSFT: { bars, currency: "USD" } };
  const items = [{ t: "Apple unveils new chip", p: "Reuters", l: "https://example.com/a", at: NOW }];
  const feed = buildFeed({ universe, markets: { US: MARKETS.US }, prices, benches: { US: sessions(300, () => 100) }, news: { AAPL: items, MSFT: null }, builtAt: "2026-10-31T00:00:00Z" });
  assert.deepEqual(feed.stocks.find((s) => s.t === "AAPL").news, items);
  assert.equal(feed.stocks.find((s) => s.t === "MSFT").news, null);
});

test("the daily note sees the named stocks' headlines, credited, and is told not to guess causes", async () => {
  const client = fakeClient(ok);
  await noteFor(feedFor("2026-10-31"), null, client);
  assert.match(client.calls[0].messages[0].content, /Apple unveils new chip \(Reuters\)/);
  assert.match(client.calls[0].system, /credit/i);
  assert.match(client.calls[0].system, /do not guess/i);
});

test("US-listed shares for news are set only on Hong Kong and UK stocks, never the stock's own symbol", () => {
  const withAdr = UNIVERSE.filter((s) => s.adr);
  assert.ok(withAdr.length >= 25);
  assert.ok(withAdr.every((s) => s.m !== "US" && s.adr !== s.t && /^[A-Z]{1,5}$/.test(s.adr)));
});

test("dividends come out of the chart, dated in exchange time", () => {
  const lateUtc = Date.parse("2026-10-29T02:00:00Z") / 1000;   // 10pm on the 28th in New York
  const withDiv = chart({ events: { dividends: { [lateUtc]: { amount: 0.26, date: lateUtc } } } });
  assert.deepEqual(parseChart(withDiv).dividends, [{ d: "2026-10-28", amount: 0.26 }]);
  assert.deepEqual(parseChart(chart()).dividends, [], "none paid: an empty list");
});

test("key stats: 52-week range of the price, dividend yield over the last year, typical daily move", () => {
  const bars = sessions(300, (i) => 100 + (i % 50)).map((b) => ({ ...b, p: b.c }));
  const last = bars.at(-1);
  const dividends = [{ d: bars.at(-10).d, amount: 1 }, { d: bars.at(-100).d, amount: 1 }, { d: bars[0].d, amount: 5 }];
  const feed = buildFeed({ universe: [{ t: "AAPL", n: "Apple", m: "US" }], markets: { US: MARKETS.US }, prices: { AAPL: { bars, currency: "USD", dividends } }, benches: { US: sessions(300, () => 100) }, builtAt: "2026-10-31T00:00:00Z" });
  const st = feed.stocks[0].stats;
  assert.equal(st.hi52, 149);
  assert.equal(st.lo52, 100);
  assert.ok(Math.abs(st.divYield - 2 / last.p) < 1e-3, "only dividends paid in the last 365 days count");
  assert.ok(st.dailyMove > 0);
});

test("a dividend yield over 20% is left out: it means the dividend came in other units than the price", () => {
  const bars = sessions(300, () => 100).map((b) => ({ ...b, p: b.c }));
  const feed = buildFeed({ universe: [{ t: "ISF.L", n: "FTSE fund", m: "UK" }], markets: { UK: MARKETS.UK }, prices: { "ISF.L": { bars, currency: "GBp", dividends: [{ d: bars.at(-5).d, amount: 30 }] } }, benches: { UK: sessions(300, () => 100) }, builtAt: "2026-10-31T00:00:00Z" });
  assert.equal(feed.stocks[0].stats.divYield, null);
});

test("the daily note is about the stocks: index funds are left out of its lists", async () => {
  const feed = feedFor("2026-10-31");
  feed.stocks.push({ t: "VOO", n: "Vanguard S&P 500 ETF", m: "US", kind: "fund", rating: "Buy", score: 6, prev: "Buy", r6m: 0.1, bull: [], bear: [], news: null });
  const client = fakeClient(ok);
  await noteFor(feed, null, client);
  assert.doesNotMatch(client.calls[0].messages[0].content, /VOO/);
});

test("index funds are rated and charted like stocks but kept out of the scorecard and the news", () => {
  const bench = sessions(500, () => 100);
  const prices = { AAPL: { bars: sessions(500, (i) => 100 * 1.002 ** i), currency: "USD" }, VOO: { bars: sessions(500, (i) => 100 * 1.001 ** i), currency: "USD" } };
  const universe = [{ t: "AAPL", n: "Apple", m: "US" }, { t: "VOO", n: "Vanguard S&P 500 ETF", m: "US", kind: "fund" }];
  const both = buildFeed({ universe, markets: { US: MARKETS.US }, prices, benches: { US: bench }, news: { AAPL: [], VOO: [{ t: "x" }] }, builtAt: "2026-10-31T00:00:00Z" });
  const alone = buildFeed({ universe: universe.slice(0, 1), markets: { US: MARKETS.US }, prices, benches: { US: bench }, builtAt: "2026-10-31T00:00:00Z" });
  assert.equal(both.scorecard.all.scored, alone.scorecard.all.scored);
  const fund = both.stocks.find((s) => s.t === "VOO");
  assert.equal(fund.kind, "fund");
  assert.equal(fund.news, null);
  assert.ok(fund.rating);
});

test("a stock's history file: dated prices with its index alongside, rounded, index null where it did not trade", () => {
  const bars = sessions(5, (i) => 100 + i / 3).map((b) => ({ ...b, p: b.c - 1 }));
  const bench = [bars[0], bars[1], bars[3], bars[4]].map((b) => ({ d: b.d, c: 5000 + b.c }));
  const h = historyFor(bars, bench);
  assert.deepEqual(h.d, bars.map((b) => b.d));
  assert.deepEqual(h.p, bars.map((b) => +(b.c - 1).toPrecision(6)), "the price alone, as quoted");
  assert.equal(h.b[2], h.b[1], "a day the index did not trade carries its last close");
  assert.equal(historyFor(bars, []).b.every((x) => x === null), true);
  assert.equal(historyFile("0700.HK"), "0700_HK.json");
  assert.equal(historyFile("BRK-B"), "BRK-B.json");
});

test("the list's index funds: one per market, marked as funds", () => {
  const funds = UNIVERSE.filter((s) => s.kind === "fund");
  assert.deepEqual(funds.map((f) => f.m).sort(), ["HK", "UK", "US"]);
  assert.ok(funds.every((f) => f.about && f.about.length > 40));
});

test("the universe covers US, Hong Kong and UK with no symbol twice", () => {
  const symbols = UNIVERSE.map((s) => s.t);
  assert.equal(new Set(symbols).size, symbols.length);
  for (const m of ["US", "HK", "UK"]) assert.ok(UNIVERSE.filter((s) => s.m === m && s.kind !== "fund").length >= 20, m);
  assert.ok(UNIVERSE.every((s) => MARKETS[s.m]));
});

test("exchange rates into Australian dollars come from the latest close of each currency pair", () => {
  const bars = (c) => [{ d: "2026-10-30", h: c, l: c, c, p: c }];
  const fx = fxRates({ USD: bars(1.51), HKD: bars(0.194), GBP: bars(2.03) });
  assert.deepEqual(fx, { USD: 1.51, HKD: 0.194, GBP: 2.03 });
  assert.deepEqual(fxRates({ USD: bars(1.5), HKD: null }), { USD: 1.5 }, "a pair that failed is left out");
});

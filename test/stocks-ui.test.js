import { test } from "node:test";
import assert from "node:assert/strict";
import { plainEnglish, GLOSSARY } from "../stocks/explain.js";
import { ideas } from "../stocks/ideas.js";
import { toggle, sinceWatching, ratingChanges, markSeen } from "../stocks/watch.js";
import { chartModel, RANGES } from "../stocks/chart.js";

const stock = (over = {}) => ({
  t: "AAPL", n: "Apple", m: "US", kind: "stock", rating: "Overweight", prev: "Hold", score: 3, close: 112, price: 112,
  r1m: 0.02, r6m: 0.18, rel6: 0.06,
  facts: { rsi: 55, vol: 0.28, drawdown: 0.09, sma50: 108, sma200: 100 },
  stats: { hi52: 123, lo52: 80, divYield: 0.005, dailyMove: 0.016 }, ...over,
});

test("plain English: trend, six months against the index, swings, distance from the high, dividends, the rating", () => {
  const text = plainEnglish(stock(), "S&P 500").join(" ");
  assert.match(text, /12% above its average over the last 200 trading days/);
  assert.match(text, /uptrend/);
  assert.match(text, /rose 18%/);
  assert.match(text, /6 points better than the S&P 500/);
  assert.match(text, /28% over a year, about average for a large company/);
  assert.match(text, /9% below its highest price of the past year/);
  assert.match(text, /dividends worth about 0\.5% of its price/);
  assert.match(text, /Overweight: the points for it outweigh those against/);
});

test("plain English covers a downtrend, a calm stock at its high with no dividend, and a stock the rules can't rate", () => {
  const down = plainEnglish(stock({ close: 90, r6m: -0.04, rel6: -0.09, rating: "Underweight", facts: { rsi: 40, vol: 0.15, drawdown: 0.01, sma50: 95, sma200: 100 }, stats: { hi52: 101, lo52: 85, divYield: 0, dailyMove: 0.01 } }), "Hang Seng").join(" ");
  assert.match(down, /below its average over the last 200 trading days/);
  assert.match(down, /downtrend/);
  assert.match(down, /fell 4%, 9 points worse than the Hang Seng/);
  assert.match(down, /calm/);
  assert.match(down, /close to its highest price of the past year/);
  assert.match(down, /paid no dividends/);
  assert.match(down, /points against it outweigh those for/);
  const review = plainEnglish(stock({ rating: "REVIEW", reason: "Not enough history", facts: null, r6m: null, rel6: null }), "FTSE 100").join(" ");
  assert.match(review, /can't rate it yet: Not enough history/);
});

test("plain English for an index fund starts with what the fund holds", () => {
  const fund = plainEnglish(stock({ t: "VOO", n: "Vanguard S&P 500 ETF", kind: "fund", about: "Holds all 500 companies in the S&P 500." }), "S&P 500");
  assert.equal(fund[0], "Holds all 500 companies in the S&P 500.");
  assert.match(fund.join(" "), /one company's bad news matters much less/);
  assert.match(fund.join(" "), /Over six months its price rose 18%\./, "no 'points better than' its own index");
  assert.match(fund.join(" "), /rating only reflects the market's recent trend/);
});

test("six months on one basis: the price against the index, with dividends said separately", () => {
  const text = plainEnglish(stock({ r6p: 0.15, r6m: 0.18, rel6: 0.06 }), "FTSE 100").join(" ");
  assert.match(text, /Over six months its price rose 15%, 6 points better than the FTSE 100\. With dividends it returned 18%\./);
  assert.doesNotMatch(plainEnglish(stock({ r6p: 0.18, r6m: 0.182 }), "S&P 500").join(" "), /With dividends/, "no dividend clause when they made no real difference");
});

test("the glossary explains every term the page uses", () => {
  const terms = GLOSSARY.map((g) => g.term).join(" | ");
  for (const t of ["Index fund", "Moving average", "RSI", "Volatility", "Dividend yield", "52-week range", "Ratings", "Scorecard", "Diversification"]) assert.match(terms, new RegExp(t), t);
  assert.ok(GLOSSARY.every((g) => g.text.length > 40));
});

test("ideas: index funds to start with, steady climbers, upgrades, dips in strong stocks, downgrades, each with a reason", () => {
  const stocks = [
    stock(),
    stock({ t: "NVDA", n: "Nvidia", rating: "Buy", prev: "Buy", score: 5, facts: { rsi: 60, vol: 0.55, drawdown: 0.05, sma50: 100, sma200: 90 } }),
    stock({ t: "KO", n: "Coca-Cola", rating: "Buy", prev: "Overweight", score: 4, facts: { rsi: 52, vol: 0.16, drawdown: 0.03, sma50: 60, sma200: 58 }, close: 64, r6m: 0.09 }),
    stock({ t: "MSFT", n: "Microsoft", rating: "Hold", prev: "Overweight", score: 1, close: 410, r1m: -0.08, facts: { rsi: 35, vol: 0.25, drawdown: 0.12, sma50: 430, sma200: 400 } }),
    stock({ t: "VOO", n: "Vanguard S&P 500 ETF", kind: "fund", rating: "Hold", prev: "Hold", r6m: 0.11 }),
    stock({ t: "BAD", n: "Bad Co", rating: "REVIEW", prev: "Hold", facts: null }),
    stock({ t: "SLIP", n: "Slipping Co", rating: "Sell", prev: "Sell", close: 120, r1m: -0.12, facts: { rsi: 30, vol: 0.3, drawdown: 0.2, sma50: 130, sma200: 110 } }),
  ];
  const lists = Object.fromEntries(ideas(stocks).map((l) => [l.key, l]));
  assert.deepEqual(lists.start.items.map((i) => i.t), ["VOO"]);
  assert.deepEqual(lists.steady.items.map((i) => i.t), ["KO", "AAPL"], "volatile Nvidia is not 'steady'");
  assert.match(lists.steady.items[0].why, /9%.*16% a year/);
  assert.deepEqual(lists.upgraded.items.map((i) => i.t), ["KO", "AAPL"]);
  assert.equal(lists.upgraded.items[1].why, "Hold → Overweight");
  assert.deepEqual(lists.dips.items.map((i) => i.t), ["MSFT"], "a Sell-rated stock is no 'strong stock', however it dips");
  assert.match(lists.dips.items[0].why, /Down 8% this month, still above its 200-day average/);
  assert.deepEqual(lists.downgraded.items.map((i) => i.t), ["MSFT"]);
  assert.ok(Object.values(lists).every((l) => l.title && l.blurb));
  assert.ok(!Object.values(lists).some((l) => l.items.some((i) => i.t === "BAD")), "a stock under review is in no idea list");
});

test("watchlist: star and unstar, change since you started watching, rating changes since your last look", () => {
  const s = stock();
  let watch = toggle({}, s, "2026-10-31");
  assert.deepEqual(watch, { AAPL: { since: "2026-10-31", price: 112 } });
  assert.deepEqual(toggle(watch, s, "2026-11-01"), {}, "a second tap removes it");
  const later = stock({ price: 123.2 });
  const since = sinceWatching(watch.AAPL, later);
  assert.ok(Math.abs(since.change - 0.1) < 1e-9);
  assert.equal(since.since, "2026-10-31");
  const seen = markSeen({}, watch, [s]);
  assert.deepEqual(seen, { AAPL: "Overweight" });
  assert.deepEqual(ratingChanges(watch, seen, [stock({ rating: "Buy" })]), { AAPL: { from: "Overweight", to: "Buy" } });
  assert.deepEqual(ratingChanges(watch, seen, [s]), {});
  assert.deepEqual(ratingChanges(watch, {}, [s]), {}, "nothing seen yet: no change to report");
});

test("chart model: the range's prices, 50- and 200-day averages over the whole history, the index scaled to the price", () => {
  const n = 300, d = Array.from({ length: n }, (_, i) => `D${String(i).padStart(3, "0")}`);
  const p = d.map((_, i) => 100 + i), b = d.map((_, i) => (i === 280 ? null : 1000 + 10 * i));
  const m = chartModel({ d, p, b }, 21);
  assert.equal(m.d.length, 21);
  assert.equal(m.d[0], "D279");
  assert.deepEqual(m.p, p.slice(-21));
  assert.equal(m.ma50[0], (p.slice(230, 280).reduce((a, x) => a + x, 0)) / 50);
  assert.equal(m.ma200.at(-1), (p.slice(100, 300).reduce((a, x) => a + x, 0)) / 200);
  assert.equal(m.b[0], m.p[0], "the index starts at the price, so the lines compare");
  assert.equal(m.b[1], null);
  assert.equal(m.lo, Math.min(...m.p, ...m.ma50, ...m.ma200, ...m.b.filter((x) => x != null)));
  const all = chartModel({ d, p, b }, Infinity);
  assert.equal(all.d.length, n);
  assert.equal(all.ma200[198], null, "too little history for a 200-day average yet");
  assert.ok(Math.abs(all.change - (p.at(-1) / p[0] - 1)) < 1e-12);
  assert.deepEqual(RANGES.map((r) => r[0]), ["1M", "6M", "1Y", "2Y"]);
});

test("the offline cache lists every module the Stocks page imports", async () => {
  const { readFileSync } = await import("node:fs");
  const page = readFileSync(new URL("../stocks/stocks.js", import.meta.url), "utf8");
  const sw = readFileSync(new URL("../sw.js", import.meta.url), "utf8");
  const modules = [...page.matchAll(/from "\.\/([\w.-]+\.js)"/g)].map((m) => m[1]);
  assert.ok(modules.length >= 6);
  for (const m of modules) assert.ok(sw.includes(`"./stocks/${m}"`), `sw.js FILES is missing ./stocks/${m}`);
});

test("a thousand put in a year ago: in the stock's own currency, counting dividends", async () => {
  const { plainEnglish: pe, moneyOf } = await import("../stocks/explain.js");
  assert.match(pe(stock({ r12m: 0.25, cur: "USD" }), "S&P 500").join(" "), /US\$1,000 put into it a year ago would be worth about US\$1,250 now, counting dividends/);
  assert.match(pe(stock({ r12m: -0.1, cur: "GBp" }), "FTSE 100").join(" "), /£1,000 .* about £900 now/);
  assert.equal(moneyOf(1234.5, "HKD"), "HK$1,235");
  assert.doesNotMatch(pe(stock({ r12m: null }), "S&P 500").join(" "), /a year ago/);
});

test("Australian dollar value: the day's rate for each currency, pence counted as hundredths of a pound", async () => {
  const { audOf } = await import("../stocks/explain.js");
  const fx = { USD: 1.5, HKD: 0.2, GBP: 2 };
  assert.equal(audOf(100, "USD", fx), 150);
  assert.equal(audOf(100, "HKD", fx), 20);
  assert.equal(audOf(1000, "GBp", fx), 20, "1,000 pence is £10");
  assert.equal(audOf(100, "USD", null), null);
  assert.equal(audOf(100, "EUR", fx), null);
});

test("watchlist backup: written as JSON and read back, anything malformed refused", async () => {
  const { backupText, readBackup } = await import("../stocks/watch.js");
  const watch = { AAPL: { since: "2026-10-31", price: 112 }, "0700.HK": { since: "2026-10-01", price: 400 } };
  assert.deepEqual(readBackup(backupText(watch)), watch);
  assert.throws(() => readBackup("not json"), /not a Stocks watchlist backup/);
  assert.throws(() => readBackup(JSON.stringify({ app: "travel", watch: {} })), /not a Stocks watchlist backup/);
  assert.throws(() => readBackup(JSON.stringify({ app: "stocks-watchlist", watch: { AAPL: { since: "yesterday", price: 1 } } })), /AAPL/);
  assert.throws(() => readBackup(JSON.stringify({ app: "stocks-watchlist", watch: { "<b>": { since: "2026-10-31", price: 1 } } })), /symbol/);
});

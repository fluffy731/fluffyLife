// Builds stocks/feed.json for the Stocks page: daily prices from Yahoo Finance for every stock in
// stocks/universe.js and each market's index, the rules' call on each stock, the rules replayed over the
// past year and scored, and (when ANTHROPIC_API_KEY is set) one short note a day written by Claude Haiku.
// Runs on GitHub Actions with the hourly deploy; the phone only downloads the finished JSON.
//   node scripts/build-stocks.mjs           rebuild unless the feed is under 3 hours old
//   node scripts/build-stocks.mjs --force   rebuild now
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { createHash } from "node:crypto";
import { MARKETS, UNIVERSE } from "../stocks/universe.js";
import { analyse, replay, scorecard, sparkline, pct, REVIEW, HOLD_DAYS, REPLAY_EVERY } from "../stocks/model.js";

export const FEED_VERSION = 1;
// A fingerprint of the rules, the list and this script: a feed built by older rules is rebuilt, however fresh.
const RULES = createHash("sha256")
  .update(["../stocks/model.js", "../stocks/universe.js", "./build-stocks.mjs"].map((f) => readFileSync(new URL(f, import.meta.url))).join("\n"))
  .digest("hex").slice(0, 12);
export const NOTE_MODEL = "claude-haiku-5-5";
const OUT = "stocks/feed.json";
const FRESH_FOR = 3 * 3600e3;
const UA = "Mozilla/5.0 (compatible; fluffyLife-stocks/1.0; personal reader)";

const dayOf = (sec) => new Date(sec * 1000).toISOString().slice(0, 10);
const r4 = (x) => (Number.isFinite(x) ? +x.toPrecision(4) : null);

// ---------- Yahoo's chart format ----------
export function parseChart(json) {
  const err = json?.chart?.error;
  if (err) throw new Error(`${err.code}: ${err.description}`);
  const res = json?.chart?.result?.[0];
  if (!res?.timestamp?.length) throw new Error("no prices in the response");
  const q = res.indicators.quote[0], adj = res.indicators.adjclose?.[0]?.adjclose;
  const off = res.meta.gmtoffset || 0;
  const bars = [];
  res.timestamp.forEach((ts, i) => {
    const [h, l, c] = [q.high[i], q.low[i], q.close[i]];
    if (![h, l, c].every((x) => Number.isFinite(x) && x > 0)) return;
    const k = adj && Number.isFinite(adj[i]) && adj[i] > 0 ? adj[i] / c : 1;   // dividends and splits
    const bar = { d: dayOf(ts + off), h: h * k, l: l * k, c: c * k, p: c };      // p: price alone, for index comparisons
    if (bars.at(-1)?.d === bar.d) bars[bars.length - 1] = bar;                   // a second row for one day: the later one
    else bars.push(bar);
  });
  const reg = res.meta.currentTradingPeriod?.regular;
  return { bars, currency: res.meta.currency || "", session: reg ? { start: reg.start, end: reg.end, date: dayOf(reg.start + off) } : null };
}

// Today's bar is the live price until the session closes, and for a while after: Hong Kong's closing auction
// runs 10 minutes past the bell and Yahoo's Hong Kong prices lag 15. A call on it would read a moving number.
export const SETTLE_SEC = 45 * 60;
export function completedBars(bars, session, nowSec) {
  if (session && nowSec < session.end + SETTLE_SEC && bars.at(-1)?.d === session.date) return bars.slice(0, -1);
  return bars;
}

// ---------- the feed (pure) ----------
function stockEntry(s, { bars, currency }, bench, benchName) {
  const calls = replay(bars, bench, { benchName });
  const a = analyse(bars, bench, bars.length - 1, { benchName });
  const f = a.facts, last = bars.at(-1);
  return {
    entry: {
      t: s.t, n: s.n, m: s.m, cur: currency, d: last.d, close: r4(last.c),
      r1d: bars.length > 1 ? r4(last.c / bars.at(-2).c - 1) : null,
      r1m: r4(f?.r1m), r3m: r4(f?.r3m), r6m: r4(f?.r6m), r12m: r4(f?.r12m), rel6: r4(f?.rel6),
      rating: a.rating, score: a.score, summary: a.summary, reason: a.reason,
      analysts: a.analysts, bull: a.bull, bear: a.bear,
      plan: a.plan && { down: r4(a.plan.down), up: r4(a.plan.up), atrPct: r4(a.plan.atrPct) },
      facts: f && { rsi: r4(f.rsi), vol: r4(f.vol), drawdown: r4(f.drawdown), sma50: r4(f.sma50), sma200: r4(f.sma200) },
      spark: sparkline(bars),
      history: calls.slice(-12).map(({ d, rating }) => ({ d, rating })),
      prev: calls.at(-2)?.rating ?? null,
    },
    calls,
  };
}

const order = (a, b) => (a.score == null) - (b.score == null) || (b.score ?? 0) - (a.score ?? 0) || (b.r6m ?? -9) - (a.r6m ?? -9);

export function buildFeed({ universe, markets, prices, benches, builtAt }) {
  const stocks = [], failed = [], callsBy = { all: [] };
  for (const s of universe) {
    if (!prices[s.t]?.bars?.length) { failed.push(s.t); continue; }
    const { entry, calls } = stockEntry(s, prices[s.t], benches[s.m] || [], markets[s.m].benchName);
    stocks.push(entry);
    callsBy.all.push(...calls);
    (callsBy[s.m] ||= []).push(...calls);
  }
  const card = Object.fromEntries(Object.entries(callsBy).map(([k, calls]) => {
    const scored = calls.filter((c) => c.alpha != null).map((c) => c.d).sort();
    return [k, { ...scorecard(calls), from: scored[0] ?? null, to: scored.at(-1) ?? null }];
  }));
  const summary = Object.fromEntries(Object.entries(markets).map(([k, m]) => {
    const b = benches[k];
    return [k, { label: m.label, benchName: m.benchName, asOf: b?.at(-1)?.d ?? null, r6m: b?.length > 126 ? r4(b.at(-1).c / b.at(-127).c - 1) : null }];
  }));
  return {
    version: FEED_VERSION, rules: RULES, builtAt, holdDays: HOLD_DAYS, every: REPLAY_EVERY,
    markets: summary, stocks: stocks.sort(order), failed, scorecard: card,
    noteKey: benches.US?.at(-1)?.d ?? null, note: null,
  };
}

// ---------- the daily note ----------
const NOTE_SYSTEM = [
  "You write a short daily note for one private investor about a rules-based stock screen covering large companies in the US, Hong Kong and the UK.",
  "Use only the facts in the data you are given: do not add prices, news, events, reasons or forecasts of your own.",
  "Do not tell the reader to buy or sell; say what the rules rate highest and lowest and what changed since last week.",
  "Mention the scorecard only as how the rules have done in the past.",
  "Write in Australian English, plain text, at most 120 words, no headings, no lists, no markdown.",
].join(" ");

function notePayload(feed) {
  const rated = feed.stocks.filter((s) => s.rating !== REVIEW);
  const percent = (x) => (x == null ? null : pct(x, 1));
  const brief = (s) => ({ t: s.t, name: s.n, market: s.m, rating: s.rating, lastWeek: s.prev, sixMonthReturn: percent(s.r6m), bull: s.bull.slice(0, 2), bear: s.bear.slice(0, 1) });
  const spread = feed.scorecard.all?.spread;
  return {
    highest: rated.slice(0, 8).map(brief),
    lowest: rated.slice(Math.max(8, rated.length - 5)).map(brief),
    changed: rated.filter((s) => s.prev && s.prev !== REVIEW && s.prev !== s.rating).slice(0, 10).map((s) => ({ t: s.t, name: s.n, from: s.prev, to: s.rating })),
    scorecard: { bullishMinusBearishVsIndex: spread == null ? null : `${(spread * 100).toFixed(1)} percentage points`, callsScored: feed.scorecard.all?.scored ?? 0, holdSessions: HOLD_DAYS },
    indices: Object.values(feed.markets).map((m) => ({ name: m.benchName, sixMonthReturn: percent(m.r6m) })),
  };
}

// One note per completed US session: reused while the session is the same, never shown against a newer one.
export async function noteFor(feed, previous, client) {
  if (!feed.noteKey) return null;
  if (previous?.key === feed.noteKey) return previous;
  if (!client) return null;
  const res = await client.messages.create({
    model: NOTE_MODEL,
    max_tokens: 4000,
    output_config: { effort: "low" },
    system: NOTE_SYSTEM,
    messages: [{ role: "user", content: `Screen for the US session of ${feed.noteKey}:\n${JSON.stringify(notePayload(feed))}` }],
  });
  if (res.stop_reason !== "end_turn") { console.warn(`stocks: note not published (stop_reason ${res.stop_reason})`); return null; }
  const text = res.content.filter((b) => b.type === "text").map((b) => b.text).join("").trim();
  return text ? { key: feed.noteKey, text, model: NOTE_MODEL, at: new Date().toISOString() } : null;
}

// The note is an extra: nothing on its path (a missing SDK, an API error, a bad reply) may stop the prices.
async function writeNote(feed, previous) {
  if (!process.env.ANTHROPIC_API_KEY) return noteFor(feed, previous, null);
  let Anthropic;
  try {
    ({ default: Anthropic } = await import("@anthropic-ai/sdk"));
    return await noteFor(feed, previous, new Anthropic({ timeout: 60_000, maxRetries: 2 }));
  } catch (e) {
    const why = Anthropic && e instanceof Anthropic.APIError ? `API ${e.status ?? "no connection"}` : e.constructor.name;
    console.warn(`::warning::stocks: note not written (${why}): ${e.message}`);
    return null;
  }
}

// ---------- fetching ----------
async function getJson(url, ms = 15000) {
  const ctl = new AbortController(), timer = setTimeout(() => ctl.abort(), ms);
  try {
    const r = await fetch(url, { headers: { "user-agent": UA, accept: "application/json" }, signal: ctl.signal });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return await r.json();
  } finally { clearTimeout(timer); }
}

async function fetchBars(symbol, nowSec) {
  const url = `https://query2.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=2y&interval=1d&includeAdjustedClose=true&events=div%2Csplit`;
  let error;
  for (const wait of [0, 2000]) {   // one retry: Yahoo turns away the odd request from shared runners
    if (wait) await new Promise((r) => setTimeout(r, wait));
    try {
      const { bars, currency, session } = parseChart(await getJson(url));
      return { bars: completedBars(bars, session, nowSec), currency };
    } catch (e) { error = String(e.message || e); }
  }
  return { error };
}

async function pool(list, n, fn) {
  const out = new Array(list.length); let i = 0;
  await Promise.all(Array.from({ length: n }, async () => { while (i < list.length) { const k = i++; out[k] = await fn(list[k]); } }));
  return out;
}

function previousFeed() {
  try { return JSON.parse(readFileSync(OUT, "utf8")); } catch (e) {
    if (e.code !== "ENOENT") console.warn(`stocks: previous feed unreadable, rebuilding: ${e.message}`);
    return null;
  }
}

export async function build({ force = false } = {}) {
  const previous = previousFeed();
  if (!force && previous?.rules === RULES && Date.now() - Date.parse(previous.builtAt) < FRESH_FOR) return { kept: previous.builtAt };
  const nowSec = Math.floor(Date.now() / 1000);
  const symbols = [...Object.values(MARKETS).map((m) => m.bench), ...UNIVERSE.map((s) => s.t)];
  const got = Object.fromEntries(await pool(symbols, 4, async (s) => [s, await fetchBars(s, nowSec)]));
  const benches = Object.fromEntries(Object.entries(MARKETS).filter(([, m]) => got[m.bench].bars).map(([k, m]) => [k, got[m.bench].bars]));
  const prices = Object.fromEntries(UNIVERSE.filter((s) => got[s.t].bars).map((s) => [s.t, got[s.t]]));
  const feed = buildFeed({ universe: UNIVERSE, markets: MARKETS, prices, benches, builtAt: new Date().toISOString() });
  if (!feed.stocks.length) throw new Error(`no stock prices fetched (${got[UNIVERSE[0].t].error}); the previous feed is kept`);
  feed.note = await writeNote(feed, previous?.note);
  mkdirSync("stocks", { recursive: true });
  writeFileSync(OUT, JSON.stringify(feed));
  return {
    stocks: feed.stocks.length, failed: Object.entries(got).filter(([, v]) => v.error).map(([s, v]) => `${s} (${v.error})`),
    indices: Object.keys(benches), scored: feed.scorecard.all.scored, spread: feed.scorecard.all.spread, note: feed.note ? feed.note.key : "none",
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("stocks/feed.json:", JSON.stringify(await build({ force: process.argv.includes("--force") })));
}

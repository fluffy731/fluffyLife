// Stocks: the rules that rate a stock, and the replay that scores those rules on past prices.
// Pure functions shared by the build script (Node) and the page (browser). Every call reads only the
// prices up to its own date, so the replay is an honest test of the rules: nothing here has seen the future.
//
// Bars are completed daily sessions, oldest first: { d: "YYYY-MM-DD", h, l, c, p }. h, l and c are adjusted for
// dividends and splits (total return, for trend and momentum); p is the price alone, adjusted for splits only,
// for comparisons with an index, since the indices are price indices. Without p, c is the price.

export const RATINGS = ["Buy", "Overweight", "Hold", "Underweight", "Sell"];
// A call the rules cannot make (too little history, no index prices). Never shown or scored as a Hold.
export const REVIEW = "REVIEW";
// Sessions a call is held for when it is scored, from the first close after the call.
export const HOLD_DAYS = 20;
// History a call needs: a 200-day average and a year of momentum, with room to spare.
export const MIN_BARS = 260;
// A replayed call every this many sessions, counted back from today's.
export const REPLAY_EVERY = 5;

const DIRECTION = { Buy: 1, Overweight: 1, Hold: 0, Underweight: -1, Sell: -1 };
const YEAR = 252, HALF = 126, QUARTER = 63, MONTH = 21;

export const pct = (x, digits = 0) => `${x >= 0 ? "+" : "−"}${Math.abs(x * 100).toFixed(digits)}%`;
const abs = (x) => `${Math.abs(x * 100).toFixed(0)}%`;
const price = (b) => b.p ?? b.c;

export function sma(values, n, end) {
  if (end - n + 1 < 0) return null;
  let s = 0;
  for (let i = end - n + 1; i <= end; i++) s += values[i];
  return s / n;
}

// RSI from simple n-session sums of gains and losses (Cutler's form) ending at `end`; 50 when nothing moved.
export function rsi(closes, end, n = 14) {
  let gain = 0, loss = 0;
  for (let i = end - n + 1; i <= end; i++) {
    const ch = closes[i] - closes[i - 1];
    if (ch > 0) gain += ch; else loss -= ch;
  }
  if (gain + loss === 0) return 50;
  return (100 * gain) / (gain + loss);
}

// Average true range over n sessions ending at `end`.
export function atr(bars, end, n = 14) {
  let s = 0;
  for (let i = end - n + 1; i <= end; i++) {
    const { h, l } = bars[i], pc = bars[i - 1].c;
    s += Math.max(h - l, Math.abs(h - pc), Math.abs(l - pc));
  }
  return s / n;
}

function volatility(closes, end, n = QUARTER) {
  const r = [];
  for (let i = end - n + 1; i <= end; i++) r.push(Math.log(closes[i] / closes[i - 1]));
  const m = r.reduce((a, b) => a + b, 0) / r.length;
  return Math.sqrt(r.reduce((a, b) => a + (b - m) ** 2, 0) / (r.length - 1)) * Math.sqrt(YEAR);
}

const days = (a, b) => (Date.parse(b) - Date.parse(a)) / 864e5;

// The index close on or before `date`, or null when the index's last session before it is over 4 days old
// (a long weekend, not a missing week).
export function closeAsOf(bench, date) {
  let lo = 0, hi = bench.length - 1, hit = -1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (bench[mid].d <= date) { hit = mid; lo = mid + 1; } else hi = mid - 1;
  }
  return hit >= 0 && days(bench[hit].d, date) <= 4 ? bench[hit].c : null;
}

function review(reason) {
  return { rating: REVIEW, reason, score: null, summary: reason, analysts: [], bull: [], bear: [], plan: null, facts: null };
}

// Trend and risk read the price as quoted, the same line a chart draws, so what the page says about a
// stock matches its chart; returns read the dividend-adjusted close, so they count what an owner received.
function facts(bars, bench, end) {
  const c = bars.map((b) => b.c), pc = bars.map(price), close = pc[end];
  const b0 = closeAsOf(bench, bars[end - HALF].d), b1 = closeAsOf(bench, bars[end].d);
  if (b0 == null || b1 == null) return null;
  let high = 0;
  for (let i = end - YEAR + 1; i <= end; i++) high = Math.max(high, pc[i]);
  const r6p = close / pc[end - HALF] - 1;
  return {
    close, sma50: sma(pc, 50, end), sma200: sma(pc, 200, end), atr: atr(bars, end), rsi: rsi(pc, end), vol: volatility(c, end),
    r1m: c[end] / c[end - MONTH] - 1, r3m: c[end] / c[end - QUARTER] - 1, r6m: c[end] / c[end - HALF] - 1,
    r12m: c[end] / c[end - YEAR] - 1, r12x1: c[end - MONTH] / c[end - YEAR] - 1,
    r6p, rel6: r6p - (b1 / b0 - 1), drawdown: 1 - close / high,
  };
}

// Each analyst looks at one thing and argues both ways: bull points raise its score, bear points lower it.
function trendAnalyst(f) {
  const out = { key: "trend", label: "Trend", score: 0, bull: [], bear: [] };
  const above = f.close / f.sma200 - 1, cross = f.sma50 / f.sma200 - 1;
  if (above > 0.01) { out.score++; out.bull.push(`Above its 200-day average by ${abs(above)}`); }
  if (above < -0.01) { out.score--; out.bear.push(`Below its 200-day average by ${abs(above)}`); }
  if (cross > 0.01) { out.score++; out.bull.push("50-day average above the 200-day: the uptrend is intact"); }
  if (cross < -0.01) { out.score--; out.bear.push("50-day average below the 200-day: a downtrend"); }
  return out;
}

function momentumAnalyst(f) {
  const out = { key: "momentum", label: "Momentum", score: 0, bull: [], bear: [] };
  if (f.r12x1 > 0.02) { out.score++; out.bull.push(`Up ${abs(f.r12x1)} over the past year, leaving out the last month`); }
  if (f.r12x1 < -0.02) { out.score--; out.bear.push(`Down ${abs(f.r12x1)} over the past year, leaving out the last month`); }
  if (f.r3m > 0.05) { out.score++; out.bull.push(`Up ${abs(f.r3m)} in the last 3 months`); }
  if (f.r3m < -0.05) { out.score--; out.bear.push(`Down ${abs(f.r3m)} in the last 3 months`); }
  return out;
}

function relativeAnalyst(f, benchName) {
  const out = { key: "relative", label: `Against the ${benchName}`, score: 0, bull: [], bear: [] };
  const pts = Math.abs(f.rel6 * 100).toFixed(0);
  if (f.rel6 >= 0.05) { out.score = f.rel6 >= 0.15 ? 2 : 1; out.bull.push(`Beat the ${benchName} by ${pts} points over 6 months`); }
  if (f.rel6 <= -0.05) { out.score = f.rel6 <= -0.15 ? -2 : -1; out.bear.push(`Trailed the ${benchName} by ${pts} points over 6 months`); }
  return out;
}

// The conservative voice: objections to chasing, and the one dip worth noticing. Capped at -2 to +1.
function riskAnalyst(f) {
  const out = { key: "risk", label: "Risk", score: 0, bull: [], bear: [] };
  const ext = f.close / f.sma50 - 1;
  if (f.rsi > 75) { out.score--; out.bear.push(`RSI ${f.rsi.toFixed(0)}: stretched after a sharp run, pullback risk is high`); }
  if (f.rsi < 30 && f.close > f.sma200) { out.score++; out.bull.push(`RSI ${f.rsi.toFixed(0)} inside an uptrend: an oversold dip`); }
  if (f.drawdown >= 0.25) { out.score--; out.bear.push(`${abs(f.drawdown)} below its 52-week high`); }
  if (ext > 0.15) { out.score--; out.bear.push(`${abs(ext)} above its 50-day average: extended`); }
  if (f.vol > 0.6) { out.score--; out.bear.push(`Volatile: swings of ${abs(f.vol)} a year`); }
  out.score = Math.max(-2, Math.min(1, out.score));
  return out;
}

function judge(score) {
  if (score >= 4) return "Buy";
  if (score >= 2) return "Overweight";
  if (score <= -4) return "Sell";
  if (score <= -2) return "Underweight";
  return "Hold";
}

// The call for one stock on the session at index `end`, from prices up to that session only.
export function analyse(bars, bench, end, { benchName }) {
  if (end + 1 < MIN_BARS) return review(`Not enough history: ${end + 1} sessions, ${MIN_BARS} needed`);
  const f = facts(bars, bench, end);
  if (!f) return review(`No ${benchName} index prices for the comparison window`);
  if (!Object.values(f).every(Number.isFinite)) return review("A price in the window is missing or zero");
  const analysts = [trendAnalyst(f), momentumAnalyst(f), relativeAnalyst(f, benchName), riskAnalyst(f)];
  const score = analysts.reduce((s, a) => s + a.score, 0);
  const rating = judge(score);
  const side = score > 1 ? "Bull case wins" : score < -1 ? "Bear case wins" : "Evenly argued";
  return {
    rating, reason: null, score,
    summary: `${side}, ${score > 0 ? "+" : ""}${score}: ${analysts.map((a) => `${a.key} ${a.score > 0 ? "+" : ""}${a.score}`).join(", ")}`,
    analysts, bull: analysts.flatMap((a) => a.bull), bear: analysts.flatMap((a) => a.bear),
    plan: { down: f.close - 2 * f.atr, up: f.close + 2 * f.atr, atrPct: f.atr / f.close },
    facts: f,
  };
}

// The rules replayed every REPLAY_EVERY sessions back from today's, each call scored over HOLD_DAYS sessions
// from the next close (a call made on a close can only be acted on after it), price against price index.
// A call still `waiting` for its window to trade, or with no index price at either end, has alpha null.
export function replay(bars, bench, { benchName, every = REPLAY_EVERY, hold = HOLD_DAYS }) {
  const last = bars.length - 1, calls = [];
  for (let end = last; end >= MIN_BARS - 1; end -= every) {
    const { rating, score } = analyse(bars, bench, end, { benchName });
    const exit = end + 1 + hold;
    const call = { d: bars[end].d, rating, score, ret: null, alpha: null, waiting: exit > last };
    if (!call.waiting && rating !== REVIEW) {
      const b0 = closeAsOf(bench, bars[end + 1].d), b1 = closeAsOf(bench, bars[exit].d);
      if (b0 != null && b1 != null) {
        call.ret = price(bars[exit]) / price(bars[end + 1]) - 1;
        call.alpha = call.ret - (b1 / b0 - 1);
      }
    }
    calls.push(call);
  }
  return calls.reverse();
}

const mean = (xs) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);

// How the rules have done: per rating, how often the stock moved the way the rating said against its index,
// and the average result. The spread is the bullish ratings' average minus the bearish ratings'.
export function scorecard(calls) {
  const scored = calls.filter((c) => c.alpha != null && c.rating !== REVIEW);
  const byRating = {};
  for (const r of RATINGS) {
    const xs = scored.filter((c) => c.rating === r).map((c) => c.alpha);
    if (!xs.length) continue;
    byRating[r] = { n: xs.length, hit: DIRECTION[r] ? xs.filter((a) => a * DIRECTION[r] > 0).length / xs.length : null, alpha: mean(xs) };
  }
  const bull = mean(scored.filter((c) => DIRECTION[c.rating] > 0).map((c) => c.alpha));
  const bear = mean(scored.filter((c) => DIRECTION[c.rating] < 0).map((c) => c.alpha));
  return {
    scored: scored.length,
    pending: calls.filter((c) => c.waiting && c.rating !== REVIEW).length,
    review: calls.filter((c) => c.rating === REVIEW).length,
    byRating,
    spread: bull != null && bear != null ? bull - bear : null,
  };
}

// Where a stock's two-year history is published (stocks/history/<file>), for the page to load on demand.
export const historyFile = (t) => `${t.replace(/[^A-Za-z0-9-]/g, "_")}.json`;

// The last `span` closes thinned to at most `points`, first and last kept, for a small chart.
export function sparkline(bars, span = HALF, points = 60) {
  const xs = bars.slice(-span).map((b) => +b.c.toPrecision(6));
  if (xs.length <= points) return xs;
  const step = (xs.length - 1) / (points - 1);
  return Array.from({ length: points }, (_, i) => xs[Math.round(i * step)]);
}

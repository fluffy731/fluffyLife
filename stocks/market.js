// The Market tab's numbers: returns over a chosen period, a heat level for the map, breadth, the biggest
// movers, sectors, the mix of ratings, and each exchange's usual trading hours. Pure; shared by the page and
// the tests. Index funds stay out of the market figures: they are the indices themselves.

// [label, the feed's field, words for it]
export const PERIODS = [["1D", "r1d", "on the day"], ["1M", "r1m", "over 1 month"], ["3M", "r3m", "over 3 months"], ["6M", "r6m", "over 6 months"], ["1Y", "r12m", "over 12 months"]];
const FIELD = Object.fromEntries(PERIODS.map(([p, k]) => [p, k]));

// The move that earns the strongest colour on the map: a 3% day is as notable as a 40% year.
export const HEAT_SCALE = { "1D": 0.03, "1M": 0.1, "3M": 0.15, "6M": 0.25, "1Y": 0.4 };

export function periodReturn(s, p) {
  const x = s?.[FIELD[p]];
  return Number.isFinite(x) ? x : null;
}

// −4 (deep fall) to +4 (strong rise); null when there is no figure, so it is never shown as "flat".
export function heat(x, p) {
  if (!Number.isFinite(x)) return null;
  const step = HEAT_SCALE[p] / 4;
  return Math.max(-4, Math.min(4, Math.round(x / step))) || 0;
}

export const pool = (stocks, market) => stocks.filter((s) => s.kind !== "fund" && (market === "all" || s.m === market));

export function breadth(stocks, p) {
  const xs = stocks.map((s) => periodReturn(s, p)).filter((x) => x != null);
  const with200 = stocks.filter((s) => s.facts?.sma200 > 0 && Number.isFinite(s.close));
  return {
    up: xs.filter((x) => x > 0).length, down: xs.filter((x) => x < 0).length, flat: xs.filter((x) => x === 0).length, total: xs.length,
    above200: with200.filter((s) => s.close > s.facts.sma200).length, with200: with200.length,
  };
}

export function movers(stocks, p, n = 5) {
  const xs = stocks.map((s) => ({ t: s.t, x: periodReturn(s, p) })).filter((m) => m.x != null);
  return {
    up: xs.filter((m) => m.x > 0).sort((a, b) => b.x - a.x).slice(0, n),
    down: xs.filter((m) => m.x < 0).sort((a, b) => a.x - b.x).slice(0, n),
  };
}

const mean = (xs) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);

// Each sector's equal-weight average over the period (the list has no company sizes), best first.
export function sectors(stocks, p, companies) {
  const by = {};
  for (const s of stocks) {
    const sector = companies[s.t]?.[0], x = periodReturn(s, p);
    if (!sector || sector === "Index fund" || x == null) continue;
    (by[sector] ||= []).push({ t: s.t, x });
  }
  return Object.entries(by).map(([sector, xs]) => {
    xs.sort((a, b) => b.x - a.x);
    return { sector, avg: mean(xs.map((m) => m.x)), n: xs.length, best: xs[0].t, worst: xs.at(-1).t };
  }).sort((a, b) => b.avg - a.avg);
}

const RATING_ORDER = ["Buy", "Overweight", "Hold", "Underweight", "Sell", "REVIEW"];
export function ratingMix(stocks) {
  const counts = RATING_ORDER.map((r) => [r, stocks.filter((s) => s.rating === r).length]);
  return { counts, total: counts.reduce((a, [, n]) => a + n, 0) };
}

// The map's groups: by market in the list's own order, or by sector with the largest first. Within a group
// the tiles run hottest first, stocks with no figure last.
export function groups(stocks, by, p, companies, markets) {
  const keyOf = by === "sector" ? (s) => companies[s.t]?.[0] || "Other" : (s) => s.m;
  const by_ = new Map();
  if (by !== "sector") Object.keys(markets).forEach((k) => by_.set(k, []));
  for (const s of stocks) {
    const k = keyOf(s);
    if (!by_.has(k)) by_.set(k, []);
    by_.get(k).push(s);
  }
  const out = [...by_].filter(([, items]) => items.length).map(([key, items]) => {
    const xs = items.map((s) => periodReturn(s, p)).filter((x) => x != null);
    items.sort((a, b) => (periodReturn(b, p) ?? -Infinity) - (periodReturn(a, p) ?? -Infinity));
    return { key, label: by === "sector" ? key : markets[key]?.label || key, items, avg: mean(xs) };
  });
  return by === "sector" ? out.sort((a, b) => b.items.length - a.items.length || a.label.localeCompare(b.label)) : out;
}

// "0700.HK" → "700", "AZN.L" → "AZN": short enough for a map tile.
export const shortSymbol = (t) => t.replace(/\.(HK|L)$/, "").replace(/^0+(?=\d)/, "");

// ---------- the index chart ----------
// Indices over the last `sessions` moves of the first one (so n sessions back, as the cards' returns count),
// each as % change from the first day all of them have a close, with its level kept for the readout. The days
// come from every index, so Hong Kong's newest close shows before New York has traded that date; a market shut
// for the day carries its last close over.
// series: [{ key, d: dates, p: closes (null where none) }], e.g. an index fund's history file's d and b.
export function overlay(series, sessions) {
  const [base] = series;
  const start = base.d[Number.isFinite(sessions) ? Math.max(0, base.d.length - 1 - sessions) : 0];
  const axis = [...new Set(series.flatMap((s) => s.d.filter((x) => x >= start)))].sort();
  const at = series.map(() => ({ j: -1, last: null }));
  const d = [], levels = series.map(() => []);
  for (const day of axis) {
    const vals = series.map((s, k) => {
      const c = at[k];
      while (c.j + 1 < s.d.length && s.d[c.j + 1] <= day) { c.j++; if (s.p[c.j] != null) c.last = s.p[c.j]; }
      return c.last;
    });
    if (vals.some((v) => v == null)) continue;
    d.push(day);
    vals.forEach((v, k) => levels[k].push(v));
  }
  if (!d.length) return null;
  const lines = series.map((s, k) => ({ key: s.key, level: levels[k], pct: levels[k].map((v) => v / levels[k][0] - 1) }));
  const all = lines.flatMap((l) => l.pct);
  return { d, lines, lo: Math.min(...all), hi: Math.max(...all) };
}

// ---------- trading hours ----------
// Usual weekday sessions in each exchange's own time, minutes after midnight. Public holidays are not known.
export const HOURS = {
  US: { zone: "America/New_York", sessions: [[570, 960]] },                 // 09:30–16:00
  HK: { zone: "Asia/Hong_Kong", sessions: [[570, 720], [780, 960]] },      // 09:30–12:00, 13:00–16:00
  UK: { zone: "Europe/London", sessions: [[480, 990]] },                   // 08:00–16:30
};
const WEEKDAY = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
const formatters = {};

function local(zone, date) {
  const f = (formatters[zone] ||= new Intl.DateTimeFormat("en-US", { timeZone: zone, weekday: "short", hour: "numeric", minute: "numeric", hourCycle: "h23" }));
  const parts = Object.fromEntries(f.formatToParts(date).map((x) => [x.type, x.value]));
  return { day: WEEKDAY[parts.weekday], min: (Number(parts.hour) % 24) * 60 + Number(parts.minute) };
}

// Whether the market is in its usual session now, and when that next changes: { open, at, minutes }.
export function marketClock(market, now = new Date()) {
  const { zone, sessions } = HOURS[market];
  const start = new Date(Math.floor(now.getTime() / 60e3) * 60e3);   // whole minutes, like the local clock
  const { day, min } = local(zone, start);
  const weekday = (d) => d >= 1 && d <= 5;
  let open = false, ahead = null;
  const inside = weekday(day) && sessions.find(([a, b]) => min >= a && min < b);
  if (inside) { open = true; ahead = { days: 0, min: inside[1] }; } else {
    for (let d = 0; d <= 7 && !ahead; d++) {
      if (!weekday((day + d) % 7)) continue;
      const next = sessions.find(([a]) => d > 0 || a > min);
      if (next) ahead = { days: d, min: next[0] };
    }
  }
  let at = new Date(start.getTime() + (ahead.days * 1440 + ahead.min - min) * 60e3);
  // A clock change between now and then moves the wall time by up to an hour: put it back on the session's time.
  const drift = local(zone, at).min - ahead.min;
  if (drift && Math.abs(drift) <= 120) at = new Date(at.getTime() - drift * 60e3);
  return { open, at, minutes: Math.ceil((at.getTime() - now.getTime()) / 60e3) };
}

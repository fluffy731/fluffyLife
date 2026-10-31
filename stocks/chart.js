// The price chart's numbers: a range of a stock's history (stocks/history/<file>), its 50- and 200-day
// averages worked out over the whole history so the lines are right from the range's first day, and its
// index scaled to start at the price so the two compare at a glance. Pure; shared by the page and the tests.

export const RANGES = [["1M", 21], ["6M", 126], ["1Y", 252], ["2Y", Infinity]];

function movingAverage(p, n) {
  const out = new Array(p.length).fill(null);
  let sum = 0;
  for (let i = 0; i < p.length; i++) {
    sum += p[i];
    if (i >= n) sum -= p[i - n];
    if (i >= n - 1) out[i] = sum / n;
  }
  return out;
}

// Two stocks over the same range as % change from the first day both have a price. Markets keep different
// holidays, so the second stock's last price carries over days it did not trade.
export function compareModel(h1, h2, sessions) {
  const from = Math.max(0, h1.p.length - (Number.isFinite(sessions) ? sessions : h1.p.length));
  const d = [], a = [], b = [];
  let j = -1, a0 = null, b0 = null;
  for (let i = from; i < h1.d.length; i++) {
    while (j + 1 < h2.d.length && h2.d[j + 1] <= h1.d[i]) j++;
    if (j < 0) continue;
    a0 ??= h1.p[i];
    b0 ??= h2.p[j];
    d.push(h1.d[i]); a.push(h1.p[i] / a0 - 1); b.push(h2.p[j] / b0 - 1);
  }
  return { d, a, b, lo: Math.min(...a, ...b), hi: Math.max(...a, ...b) };
}

// h: { d: dates, p: prices, b: index closes or null }; sessions: how many trading days to show.
export function chartModel(h, sessions) {
  const from = Math.max(0, h.p.length - (Number.isFinite(sessions) ? sessions : h.p.length));
  const cut = (xs) => xs.slice(from);
  const p = cut(h.p), raw = cut(h.b || h.p.map(() => null));
  const base = raw.findIndex((x) => x != null);
  const scale = base >= 0 ? p[base] / raw[base] : null;
  const b = raw.map((x) => (x == null || scale == null ? null : x * scale));
  const ma50 = cut(movingAverage(h.p, 50)), ma200 = cut(movingAverage(h.p, 200));
  const all = [...p, ...ma50, ...ma200, ...b].filter((x) => x != null);
  return { d: cut(h.d), p, b, ma50, ma200, lo: Math.min(...all), hi: Math.max(...all), change: p.at(-1) / p[0] - 1 };
}

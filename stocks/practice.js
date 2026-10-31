// The practice portfolio: play money (A$10,000) to buy and sell the listed stocks and funds at their latest
// close, valued in Australian dollars at the day's rate, with a small fee per trade so costs are part of the
// lesson, and the same money in the S&P 500 fund to compare with. And regular investing: the same amount
// each month. Pure functions over plain objects; the page keeps the portfolio in the phone's storage.
import { audOf } from "./explain.js";

export const START_CASH = 10000, FEE = 5;
const aud = (x) => `A$${x.toLocaleString("en-AU", { maximumFractionDigits: 0 })}`;
const priceAud = (s, fx) => audOf(s.price, s.cur, fx);

export function newPractice(today, stocks, fx) {
  const voo = stocks.find((x) => x.t === "VOO");
  const vooAud = voo ? priceAud(voo, fx) : null;
  return { v: 1, created: today, start: START_CASH, cash: START_CASH, holdings: {}, trades: [], bench: vooAud == null ? null : { t: "VOO", aud: vooAud } };
}

// Buy `amount` Australian dollars' worth, fee included. Part-shares are allowed in practice.
export function buy(pf, s, amount, today, fx) {
  const p = priceAud(s, fx);
  if (p == null) throw new Error("There is no exchange rate yet, so this can't be priced in Australian dollars. Try after the next update.");
  if (!(amount > FEE)) throw new Error(`Enter more than the A$${FEE} fee.`);
  if (amount > pf.cash + 1e-9) throw new Error(`You have ${aud(pf.cash)} of practice cash left.`);
  const units = (amount - FEE) / p, held = pf.holdings[s.t] || { units: 0, cost: 0 };
  return {
    ...pf, cash: pf.cash - amount,
    holdings: { ...pf.holdings, [s.t]: { units: held.units + units, cost: held.cost + amount, lastAud: p } },
    trades: [...pf.trades, { d: today, t: s.t, side: "buy", units, aud: p, amount, fee: FEE }],
  };
}

// Sell `units` (all of them when more are asked for); the gain is against what those units cost.
export function sell(pf, s, units, today, fx) {
  const held = pf.holdings[s.t];
  if (!held) throw new Error(`You don't hold ${s.n} in your practice portfolio.`);
  const p = priceAud(s, fx);
  if (p == null) throw new Error("There is no exchange rate yet, so this can't be priced in Australian dollars. Try after the next update.");
  const n = Math.min(units, held.units), proceeds = n * p - FEE;
  if (proceeds <= 0) throw new Error(`That is worth less than the A$${FEE} fee.`);
  const costPart = (held.cost * n) / held.units, left = held.units - n;
  const holdings = { ...pf.holdings };
  if (left < 1e-9) delete holdings[s.t];
  else holdings[s.t] = { units: left, cost: held.cost - costPart, lastAud: p };
  return { ...pf, cash: pf.cash + proceeds, holdings, trades: [...pf.trades, { d: today, t: s.t, side: "sell", units: n, aud: p, amount: proceeds, fee: FEE, gain: proceeds - costPart }] };
}

// Today's value in A$: each holding (at its last trade price if it is no longer listed or priced), the total,
// the change since the start, and what the starting cash would be worth in the S&P 500 fund.
export function valuation(pf, stocks, fx) {
  const rows = Object.entries(pf.holdings).map(([t, h]) => {
    const s = stocks.find((x) => x.t === t);
    const p = (s && priceAud(s, fx)) ?? h.lastAud;
    const value = h.units * p;
    return { t, units: h.units, value, cost: h.cost, gain: value - h.cost, gainPct: value / h.cost - 1 };
  }).sort((a, b) => b.value - a.value);
  const total = pf.cash + rows.reduce((sum, r) => sum + r.value, 0);
  const voo = stocks.find((x) => x.t === "VOO"), vooNow = voo ? priceAud(voo, fx) : null;
  return {
    cash: pf.cash, rows, total, change: total - pf.start, changePct: total / pf.start - 1,
    bench: pf.bench && vooNow != null ? (pf.start * vooNow) / pf.bench.aud : null,
  };
}

// A saved portfolio, or null when there is none or it is not whole.
export function readPractice(text) {
  if (!text) return null;
  let pf;
  try { pf = JSON.parse(text); } catch { return null; }
  const ok = pf && Number.isFinite(pf.cash) && Number.isFinite(pf.start) && pf.holdings && typeof pf.holdings === "object" && Array.isArray(pf.trades)
    && Object.values(pf.holdings).every((h) => Number.isFinite(h.units) && Number.isFinite(h.cost) && Number.isFinite(h.lastAud));
  return ok ? pf : null;
}

// The same amount put in on the first trading day of each month of a stock's history, valued at its last
// price. At today's exchange rate the rate cancels out, so this is the stock's own growth; dividends and
// currency changes are left out.
export function monthlyPlan(h, amount) {
  if (!h?.p?.length) return null;
  const last = h.p.at(-1);
  let months = 0, value = 0, from = null, month = "";
  h.d.forEach((d, i) => {
    if (d.slice(0, 7) === month) return;
    month = d.slice(0, 7);
    months++;
    value += (amount * last) / h.p[i];
    from ??= d;
  });
  return { months, invested: months * amount, value, from };
}

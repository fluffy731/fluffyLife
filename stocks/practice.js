// The practice portfolio: play money (A$10,000) to buy and sell the listed stocks and funds at their latest
// close, valued in Australian dollars at the day's rate, with a small fee per trade so costs are part of the
// lesson, and the same money in the S&P 500 fund to compare with. And regular investing: the same amount
// each month. Pure functions over plain objects; the page keeps the portfolio in the phone's storage.
import { audOf } from "./explain.js";

export const START_CASH = 10000, FEE = 5, MIN_BUY = 10;
const cents = (x) => Math.round(x * 100) / 100;
const aud = (x) => `A$${x.toLocaleString("en-AU", { minimumFractionDigits: x < 100 ? 2 : 0, maximumFractionDigits: x < 100 ? 2 : 0 })}`;
const quote = (s, fx) => (s && Number.isFinite(s.price) && s.price > 0 ? audOf(s.price, s.cur, fx) : null);

// A stock's price in A$ for a trade, or a reason it has none: no price yet, or no rate for its currency.
function tradePrice(s, fx) {
  if (!s || !Number.isFinite(s.price) || s.price <= 0) throw new Error(`There is no price for ${s?.n ?? "this stock"} yet. Try after the next update.`);
  const p = audOf(s.price, s.cur, fx);
  if (p == null) throw new Error(`There is no exchange rate for ${s.cur} yet, so this can't be priced in Australian dollars. Try after the next update.`);
  return p;
}

export function newPractice(today, stocks, fx) {
  const vooAud = quote(stocks.find((x) => x.t === "VOO"), fx);
  return { v: 1, created: today, start: START_CASH, cash: START_CASH, holdings: {}, trades: [], bench: vooAud == null ? null : { t: "VOO", aud: vooAud } };
}

// Buy `amount` Australian dollars' worth, the fee included. Part-shares are allowed in practice.
export function buy(pf, s, amount, today, fx) {
  const p = tradePrice(s, fx);
  if (!(amount >= MIN_BUY)) throw new Error(`Buy at least A$${MIN_BUY} (the fee is A$${FEE} a trade).`);
  const spend = cents(amount);
  if (spend > pf.cash + 1e-9) throw new Error(`You have ${aud(pf.cash)} of practice cash left.`);
  const units = (spend - FEE) / p, held = pf.holdings[s.t] || { units: 0, cost: 0 };
  return {
    ...pf, cash: cents(pf.cash - spend),
    holdings: { ...pf.holdings, [s.t]: { units: held.units + units, cost: cents(held.cost + spend), lastAud: p } },
    trades: [...pf.trades, { d: today, t: s.t, side: "buy", units, aud: p, amount: spend, fee: FEE }],
  };
}

// Sell `units` (all of them when as many or more are asked for). A full sale is always possible: the fee
// takes at most what the holding is worth. The gain is against what the units sold cost.
export function sell(pf, s, units, today, fx) {
  const held = pf.holdings[s?.t];
  if (!held) throw new Error(`You don't hold ${s?.n ?? "that"} in your practice portfolio.`);
  if (!(units > 0)) throw new Error("Choose how many to sell.");
  const p = tradePrice(s, fx);
  const n = Math.min(units, held.units), all = n >= held.units - 1e-9;
  const value = n * p, fee = all ? Math.min(FEE, value) : FEE, proceeds = cents(value - fee);
  if (!all && proceeds <= 0) throw new Error(`That is worth less than the A$${FEE} fee.`);
  const costPart = all ? held.cost : cents((held.cost * n) / held.units);
  const holdings = { ...pf.holdings };
  if (all) delete holdings[s.t];
  else holdings[s.t] = { units: held.units - n, cost: cents(held.cost - costPart), lastAud: p };
  return { ...pf, cash: cents(pf.cash + proceeds), holdings, trades: [...pf.trades, { d: today, t: s.t, side: "sell", units: n, aud: p, amount: proceeds, fee: cents(fee), gain: cents(proceeds - costPart) }] };
}

// Today's value in A$: each holding at today's price, or at its last trade price (marked stale) when it is no
// longer listed or has no rate; the total; the change since the start; and the starting cash in the S&P 500 fund.
export function valuation(pf, stocks, fx) {
  const rows = Object.entries(pf.holdings).map(([t, h]) => {
    const live = quote(stocks.find((x) => x.t === t), fx);
    const value = h.units * (live ?? h.lastAud);
    return { t, units: h.units, value, cost: h.cost, gain: value - h.cost, gainPct: h.cost > 0 ? value / h.cost - 1 : 0, stale: live == null };
  }).sort((a, b) => b.value - a.value);
  const total = pf.cash + rows.reduce((sum, r) => sum + r.value, 0);
  const vooNow = quote(stocks.find((x) => x.t === "VOO"), fx);
  return {
    cash: pf.cash, rows, total, change: total - pf.start, changePct: total / pf.start - 1,
    bench: pf.bench && vooNow != null ? (pf.start * vooNow) / pf.bench.aud : null,
  };
}

// A saved portfolio, or null when there is none or any part of it is damaged: a half-read portfolio would
// show wrong money or stop the page, so it is refused whole.
const num = (x) => typeof x === "number" && Number.isFinite(x);
const isDay = (x) => typeof x === "string" && /^\d{4}-\d{2}-\d{2}$/.test(x);
const isObject = (x) => x !== null && typeof x === "object" && !Array.isArray(x);
const holdingOk = (h) => isObject(h) && num(h.units) && h.units > 0 && num(h.cost) && h.cost >= 0 && num(h.lastAud) && h.lastAud > 0;
const tradeOk = (t) => isObject(t) && typeof t.t === "string" && isDay(t.d) && (t.side === "buy" || t.side === "sell")
  && num(t.units) && num(t.aud) && num(t.amount) && num(t.fee) && (t.side === "buy" || num(t.gain));

export function readPractice(text) {
  if (!text) return null;
  try {
    const pf = JSON.parse(text);
    const ok = isObject(pf) && num(pf.cash) && num(pf.start) && pf.start > 0 && isDay(pf.created)
      && isObject(pf.holdings) && Object.values(pf.holdings).every(holdingOk)
      && Array.isArray(pf.trades) && pf.trades.every(tradeOk)
      && (pf.bench === null || (isObject(pf.bench) && typeof pf.bench.t === "string" && num(pf.bench.aud) && pf.bench.aud > 0));
    return ok ? pf : null;
  } catch {
    return null;
  }
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

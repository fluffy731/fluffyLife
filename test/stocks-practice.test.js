import { test } from "node:test";
import assert from "node:assert/strict";
import { newPractice, buy, sell, valuation, monthlyPlan, readPractice, START_CASH, FEE } from "../stocks/practice.js";
import { compareModel } from "../stocks/chart.js";

const FX = { USD: 1.5, HKD: 0.2, GBP: 2 };
const s = (t, price, cur = "USD", over = {}) => ({ t, n: t, price, cur, rating: "Hold", ...over });
const AAPL = s("AAPL", 100), VOO = s("VOO", 500, "USD", { kind: "fund" }), SHEL = s("SHEL.L", 2500, "GBp");

test("a new practice portfolio: A$10,000 of play money, and the S&P 500 fund's price noted to compare with later", () => {
  const pf = newPractice("2026-11-01", [AAPL, VOO], FX);
  assert.deepEqual({ cash: pf.cash, start: pf.start, created: pf.created, holdings: pf.holdings, trades: pf.trades }, { cash: START_CASH, start: START_CASH, created: "2026-11-01", holdings: {}, trades: [] });
  assert.deepEqual(pf.bench, { t: "VOO", aud: 750 });
});

test("buying spends A$ including the fee, at the price in Australian dollars; part-shares allowed", () => {
  let pf = newPractice("2026-11-01", [AAPL, VOO], FX);
  pf = buy(pf, AAPL, 1005, "2026-11-01", FX);   // A$150 a share; A$1,000 after the A$5 fee
  assert.equal(pf.cash, START_CASH - 1005);
  assert.ok(Math.abs(pf.holdings.AAPL.units - 1000 / 150) < 1e-9);
  assert.equal(pf.holdings.AAPL.cost, 1005);
  assert.deepEqual({ ...pf.trades[0], units: +pf.trades[0].units.toFixed(6) }, { d: "2026-11-01", t: "AAPL", side: "buy", units: 6.666667, aud: 150, amount: 1005, fee: FEE });
  pf = buy(pf, SHEL, 505, "2026-11-01", FX);     // 2,500 pence = £25 = A$50
  assert.ok(Math.abs(pf.holdings["SHEL.L"].units - 10) < 1e-9);
});

test("buying is refused with a reason: no exchange rate, no more than the fee, more than the cash left", () => {
  const pf = newPractice("2026-11-01", [AAPL], FX);
  assert.throws(() => buy(pf, AAPL, 500, "2026-11-01", null), /exchange rate/);
  assert.throws(() => buy(pf, AAPL, FEE, "2026-11-01", FX), /at least A\$10/);
  assert.throws(() => buy(pf, AAPL, START_CASH + 1, "2026-11-01", FX), /A\$10,000 of practice cash left/);
  assert.equal(pf.cash, START_CASH, "a refused trade changes nothing");
});

test("selling returns the proceeds less the fee and records the gain against what those units cost", () => {
  let pf = buy(newPractice("2026-11-01", [AAPL], FX), AAPL, 1505, "2026-11-01", FX);   // 10 shares at A$150
  const up = s("AAPL", 120);                                                            // now A$180
  pf = sell(pf, up, 5, "2026-12-01", FX);
  assert.ok(Math.abs(pf.holdings.AAPL.units - 5) < 1e-9);
  assert.ok(Math.abs(pf.cash - (START_CASH - 1505 + 5 * 180 - FEE)) < 1e-9);
  const trade = pf.trades.at(-1);
  assert.equal(trade.side, "sell");
  assert.ok(Math.abs(trade.gain - (5 * 180 - FEE - 1505 / 2)) < 1e-9);
  pf = sell(pf, up, 99, "2026-12-02", FX);
  assert.equal(pf.holdings.AAPL, undefined, "selling more than held sells it all");
  assert.throws(() => sell(pf, up, 1, "2026-12-03", FX), /don't hold/);
});

test("valuation: today's value of each holding in A$, the gain, the total, and the same money left in the S&P 500 fund", () => {
  let pf = newPractice("2026-11-01", [AAPL, VOO], FX);
  pf = buy(pf, AAPL, 1505, "2026-11-01", FX);
  const v = valuation(pf, [s("AAPL", 110), s("VOO", 550, "USD", { kind: "fund" })], FX);
  const row = v.rows[0];
  assert.ok(Math.abs(row.value - 10 * 165) < 1e-9);
  assert.ok(Math.abs(row.gain - (1650 - 1505)) < 1e-9);
  assert.ok(Math.abs(v.total - (START_CASH - 1505 + 1650)) < 1e-9);
  assert.ok(Math.abs(v.change - (1650 - 1505)) < 1e-9);
  assert.ok(Math.abs(v.bench - START_CASH * 1.1) < 1e-9, "VOO up 10% since the start");
  const gone = valuation(pf, [], FX);
  assert.equal(gone.rows[0].value, 1500, "a stock no longer in the list is valued at its last trade price");
});

test("a saved practice portfolio is read back only when it is whole", () => {
  const pf = buy(newPractice("2026-11-01", [AAPL, VOO], FX), AAPL, 1005, "2026-11-01", FX);
  assert.deepEqual(readPractice(JSON.stringify(pf)), pf);
  assert.equal(readPractice(null), null);
  assert.equal(readPractice("{bad json"), null);
  assert.equal(readPractice(JSON.stringify({ cash: "lots" })), null);
});

test("regular investing: the same amount on the first trading day of each month, valued at the last price", () => {
  const d = ["2025-01-02", "2025-01-03", "2025-02-03", "2025-02-04", "2025-03-03", "2025-03-04"];
  const p = [100, 110, 50, 60, 200, 100];
  const plan = monthlyPlan({ d, p }, 200);
  assert.equal(plan.months, 3);
  assert.equal(plan.invested, 600);
  assert.ok(Math.abs(plan.value - (200 * 100 / 100 + 200 * 100 / 50 + 200 * 100 / 200)) < 1e-9);
  assert.equal(plan.from, "2025-01-02");
  assert.equal(monthlyPlan({ d: [], p: [] }, 200), null);
});

test("comparing two stocks: both as % change from the range's first day, the second's price carried over its holidays", () => {
  const a = { d: ["D1", "D2", "D3", "D4"], p: [100, 110, 121, 100] };
  const b = { d: ["D1", "D3", "D4"], p: [50, 60, 40] };
  const m = compareModel(a, b, Infinity);
  assert.deepEqual(m.d, ["D1", "D2", "D3", "D4"]);
  assert.deepEqual(m.a.map((x) => +x.toFixed(4)), [0, 0.1, 0.21, 0]);
  assert.deepEqual(m.b.map((x) => +x.toFixed(4)), [0, 0, 0.2, -0.2]);
  assert.ok(m.lo <= -0.2 + 1e-9 && m.hi >= 0.21 - 1e-9);
  const late = compareModel(a, { d: ["D3", "D4"], p: [10, 12] }, Infinity);
  assert.deepEqual(late.d, ["D3", "D4"], "starts on the first day both have a price");
});

test("damaged saved data is refused whole, never half-read", () => {
  const good = buy(newPractice("2026-11-01", [AAPL, VOO], FX), AAPL, 1005, "2026-11-01", FX);
  const damaged = [
    { ...good, holdings: { AAPL: null } },
    { ...good, holdings: { AAPL: { units: 0, cost: 10, lastAud: 1 } } },
    { ...good, trades: [null] },
    { ...good, trades: [{ ...good.trades[0], amount: "<img src=x onerror=alert(1)>" }] },
    { ...good, trades: [{ ...good.trades[0], side: "short" }] },
    { ...good, trades: [{ ...good.trades[0], side: "sell" }] },          // a sale must carry its gain
    { ...good, start: 0 },
    { ...good, bench: { t: "VOO", aud: -1 } },
    { ...good, cash: Infinity },
  ];
  for (const d of damaged) assert.equal(readPractice(JSON.stringify(d)), null, JSON.stringify(d).slice(0, 80));
  assert.deepEqual(readPractice(JSON.stringify({ ...good, bench: null })).bench, null, "no benchmark is allowed");
});

test("buying needs at least A$10 and a price; a missing price is not blamed on the exchange rate", () => {
  const pf = newPractice("2026-11-01", [AAPL], FX);
  assert.throws(() => buy(pf, AAPL, 8, "2026-11-01", FX), /at least A\$10/);
  assert.throws(() => buy(pf, s("AAPL", null), 100, "2026-11-01", FX), /no price/i);
  assert.throws(() => buy(pf, s("X", 10, "EUR"), 100, "2026-11-01", FX), /exchange rate/);
});

test("repeat buys average the cost, and money is kept to the cent", () => {
  let pf = newPractice("2026-11-01", [AAPL], FX);
  pf = buy(pf, AAPL, 155, "2026-11-01", FX);                 // 1 share at A$150
  pf = buy(pf, s("AAPL", 200), 305, "2026-11-02", FX);       // 1 share at A$300
  assert.ok(Math.abs(pf.holdings.AAPL.units - 2) < 1e-9);
  assert.equal(pf.holdings.AAPL.cost, 460);
  pf = sell(pf, s("AAPL", 110), 1, "2026-11-03", FX);        // A$165 less the fee, against half the cost
  assert.equal(pf.trades.at(-1).gain, 165 - FEE - 230);
  const odd = buy(newPractice("2026-11-01", [AAPL], FX), AAPL, 333.333, "2026-11-01", FX);
  assert.equal(odd.cash, 9666.67);
});

test("a holding worth less than the fee can still be sold in full; asking to sell nothing is refused", () => {
  let pf = buy(newPractice("2026-11-01", [AAPL], FX), AAPL, 10, "2026-11-01", FX);   // A$5 of shares
  const crash = s("AAPL", 40);                                                       // now worth A$2
  pf = sell(pf, crash, Infinity, "2026-11-02", FX);
  assert.equal(pf.holdings.AAPL, undefined);
  assert.equal(pf.trades.at(-1).amount, 0, "the fee takes what is left, never more");
  const again = buy(newPractice("2026-11-01", [AAPL], FX), AAPL, 100, "2026-11-01", FX);
  assert.throws(() => sell(again, AAPL, NaN, "2026-11-02", FX), /how many/);
  assert.throws(() => sell(again, s("AAPL", 1), 0.01, "2026-11-02", FX), /less than the A\$5 fee/, "a part-sale worth under the fee is refused");
});

test("valuation in pence, without a rate, and without a benchmark", () => {
  let pf = newPractice("2026-11-01", [SHEL], FX);
  assert.equal(pf.bench, null, "no VOO in the list: no benchmark");
  pf = buy(pf, SHEL, 505, "2026-11-01", FX);                          // 10 shares at A$50
  const v = valuation(pf, [s("SHEL.L", 3000, "GBp")], FX);
  assert.ok(Math.abs(v.rows[0].value - 600) < 1e-9);
  assert.equal(v.rows[0].stale, false);
  assert.equal(v.bench, null);
  const noRate = valuation(pf, [s("SHEL.L", 3000, "GBp")], { USD: 1.5 });
  assert.equal(noRate.rows[0].value, 500, "no pound rate: the last trade price, marked as such");
  assert.equal(noRate.rows[0].stale, true);
});

test("comparing over a range uses the range's first day as the start", () => {
  const a = { d: ["D1", "D2", "D3"], p: [100, 200, 300] };
  const m = compareModel(a, a, 2);
  assert.deepEqual(m.d, ["D2", "D3"]);
  assert.deepEqual(m.a, [0, 0.5]);
});

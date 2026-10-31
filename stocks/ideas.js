// Ideas to watch: short lists picked from the ratings by plain rules, each stock with its reason. They point
// at things worth reading about; they are not recommendations to buy. Pure; shared by the page and the tests.

const RANK = { Buy: 0, Overweight: 1, Hold: 2, Underweight: 3, Sell: 4 };
const MAX = 5;
const rated = (s) => s.kind !== "fund" && s.rating in RANK;
const pc = (x) => `${Math.abs(x * 100).toFixed(0)}%`;
const best = (a, b) => (b.score ?? -99) - (a.score ?? -99) || (b.r6m ?? -9) - (a.r6m ?? -9);
const moved = (s, dir) => rated(s) && s.prev in RANK && Math.sign(RANK[s.prev] - RANK[s.rating]) === dir;

export function ideas(stocks) {
  const pick = (key, title, blurb, filter, why, sort = best) =>
    ({ key, title, blurb, items: stocks.filter(filter).sort(sort).slice(0, MAX).map((s) => ({ t: s.t, why: why(s) })) });
  return [
    pick("start", "Start here: index funds", "One purchase holds a whole market. The usual first step: most professional stock pickers fail to beat these over ten years.",
      (s) => s.kind === "fund", (s) => (s.r6m == null ? "Whole-market fund" : `Whole-market fund · ${s.r6m >= 0 ? "up" : "down"} ${pc(s.r6m)} in 6 months`), (a, b) => a.m.localeCompare(b.m)),
    pick("steady", "Steady climbers", "Rated Buy or Overweight, with smaller swings than most and close to their highs.",
      (s) => rated(s) && RANK[s.rating] <= 1 && s.facts && s.facts.vol < 0.3 && s.facts.drawdown < 0.1,
      (s) => `${s.r6m >= 0 ? "Up" : "Down"} ${pc(s.r6m)} in 6 months, swings ${pc(s.facts.vol)} a year`),
    pick("upgraded", "Upgraded this week", "The rules think better of these than a week ago.", (s) => moved(s, 1), (s) => `${s.prev} → ${s.rating}`),
    pick("dips", "Dips in strong stocks", "Down this month but still in a long-term uptrend: worth a look, though a dip can keep going.",
      (s) => rated(s) && RANK[s.rating] <= 2 && s.facts && s.close > s.facts.sma200 && s.r1m <= -0.05,
      (s) => `Down ${pc(s.r1m)} this month, still above its 200-day average`, (a, b) => a.r1m - b.r1m),
    pick("downgraded", "Downgraded this week", "The rules think less of these than a week ago.", (s) => moved(s, -1), (s) => `${s.prev} → ${s.rating}`),
  ];
}

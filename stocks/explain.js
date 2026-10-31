// Stocks in plain English, for someone new to shares: a short reading of one stock's figures, and the
// glossary on the Learn tab. Pure functions and data, shared by the page and the tests.

const pc = (x, digits = 0) => `${Math.abs(x * 100).toFixed(digits)}%`;

function swings(vol) {
  if (vol < 0.2) return "which is calm for a large company";
  if (vol < 0.35) return "about average for a large company";
  if (vol < 0.5) return "which is lively: bigger ups and downs than most large companies";
  return "which is very jumpy: expect large ups and downs";
}

function ratingLine(s) {
  if (s.rating === "REVIEW") return `The rules can't rate it yet: ${s.reason}.`;
  if (s.rating === "Buy" || s.rating === "Overweight") return `The rules rate it ${s.rating}: the points for it outweigh those against.`;
  if (s.rating === "Hold") return "The rules rate it Hold: the points for and against roughly balance.";
  return `The rules rate it ${s.rating}: the points against it outweigh those for.`;
}

// A few sentences on what the stock's figures say, from its feed entry and its market's index name.
export function plainEnglish(s, benchName) {
  const out = [];
  if (s.kind === "fund") out.push(s.about, "Buying one unit spreads your money across the whole index, so one company's bad news matters much less.");
  const f = s.facts, st = s.stats;
  if (f) {
    const gap = s.close / f.sma200 - 1;
    out.push(Math.abs(gap) < 0.02
      ? "Its price is close to its average over the last 200 trading days: no clear trend."
      : `Its price is ${pc(gap)} ${gap > 0 ? "above" : "below"} its average over the last 200 trading days (about 10 months), which usually means ${gap > 0 ? "an uptrend" : "a downtrend"}.`);
  }
  if (s.r6m != null) {
    // One basis per sentence: the price (what the chart shows) against the price index, then dividends on
    // their own. A fund is not compared with its own index: its price trails it mostly by the dividends it pays.
    const move = s.r6p ?? s.r6m;
    const vs = s.rel6 == null || s.kind === "fund" ? "" : `, ${Math.abs(s.rel6 * 100).toFixed(0)} points ${s.rel6 >= 0 ? "better" : "worse"} than the ${benchName}`;
    const paid = s.r6p != null && Math.abs(s.r6m - s.r6p) >= 0.005 ? ` With dividends it ${s.r6m >= 0 ? "returned" : "lost"} ${pc(s.r6m)}.` : "";
    out.push(`Over six months its price ${move >= 0 ? "rose" : "fell"} ${pc(move)}${vs}.${paid}`);
  }
  if (f) {
    out.push(`Its price typically swings about ${pc(f.vol)} over a year, ${swings(f.vol)}.${st?.dailyMove ? ` On a normal day it moves within about ${pc(st.dailyMove, 1)}.` : ""}`);
    out.push(f.drawdown < 0.03 ? "It is close to its highest price of the past year." : `It is ${pc(f.drawdown)} below its highest price of the past year.`);
  }
  if (st?.divYield != null) out.push(st.divYield > 0 ? `Over the past year it paid dividends worth about ${pc(st.divYield, 1)} of its price.` : "It paid no dividends in the past year.");
  out.push(ratingLine(s));
  if (s.kind === "fund") out.push("For an index fund the rating only reflects the market's recent trend; it says nothing about whether the fund is a sound long-term holding.");
  return out;
}

// The Learn tab: every term the page uses, in the order a beginner meets them.
export const GLOSSARY = [
  { term: "Share (stock)", text: "A small piece of ownership in a company. Its price moves every trading day as people buy and sell. If the company does well over years, the price and any dividends usually reflect it; if it does badly, the price can fall a long way." },
  { term: "Index", text: "A list that tracks a whole market. The S&P 500 covers 500 large US companies, the Hang Seng the largest companies listed in Hong Kong, and the FTSE 100 the 100 largest listed in London. Each stock here is compared with its own market's index." },
  { term: "Index fund (ETF)", text: "One purchase that holds every company in an index, in proportion to size, for a small yearly fee. It spreads your money across the market, so it is the usual first step for someone new: studies of professional fund managers find most fail to beat the index over ten years. Australian brokers also list funds that track the S&P 500, and many give access to overseas exchanges." },
  { term: "Diversification", text: "Not putting all your money in one company. A single stock can halve in a bad year even when the market is fine; a spread of many companies (or an index fund) smooths that out." },
  { term: "Price chart", text: "The price on each trading day. Tap or drag on the chart to read a date's price. The dashed line is the market's index, scaled to start at the same point, so you can see whether the stock did better or worse than its market." },
  { term: "Moving average (50-day, 200-day)", text: "The average price over the last 50 or 200 trading days, drawn as smoother lines on the chart. A price above its 200-day average usually means an uptrend; below means a downtrend. When the 50-day line is above the 200-day line, the recent trend is up." },
  { term: "Momentum", text: "Shares that have risen over the past year have tended to keep rising for a while, and fallers to keep falling. It is a tendency, not a rule, and it reverses without warning." },
  { term: "Against the index (relative strength)", text: "How a stock did compared with its market. \"+6 pts vs index\" means it rose 6 percentage points more than its index over six months." },
  { term: "RSI", text: "A 0 to 100 gauge of recent gains against recent losses over 14 days. Above 75 means the price has run up quickly and may be stretched; below 30 means it has been sold off hard." },
  { term: "Volatility (swings)", text: "How much the price moves over a year. About 20% to 35% is ordinary for a large company; above 50% means big ups and downs. Higher swings mean more chance of a large loss in a short time." },
  { term: "Typical daily move", text: "How far the price usually travels in one day, as a share of the price (the average daily range). It helps judge whether a day's move is unusual." },
  { term: "52-week range", text: "The lowest and highest prices of the past year. The bar shows where today's price sits between them." },
  { term: "Dividend yield", text: "Cash the company paid shareholders over the past year, as a share of today's price. 2% means $2 a year for every $100 of shares. Many growing companies pay none." },
  { term: "Currency", text: "Prices are in each market's own currency: US dollars, Hong Kong dollars, and pence for London (100 pence is one pound)." },
  { term: "Ratings", text: "Buy, Overweight, Hold, Underweight and Sell come from four simple rules about trend, momentum, performance against the index and risk. They are a starting point for your own reading, not advice, and they know nothing about the companies' businesses." },
  { term: "Scorecard", text: "The same rules replayed over the past year using only prices known on each day, then scored against each market's index. It shows how much the ratings have actually been worth. When the gap between Buy-rated and Sell-rated stocks is small, treat every rating with that in mind." },
  { term: "Before you invest", text: "Prices fall as well as rise, and individual shares can fall a long way. Invest only money you will not need for several years, spread it out, and consider a licensed financial adviser for advice on your own situation. This page is personal research, not financial advice." },
];

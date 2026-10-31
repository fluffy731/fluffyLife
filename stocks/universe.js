// The stocks the Stocks page rates: the largest companies in each market, by Yahoo Finance symbol.
// Edit freely; a symbol Yahoo does not know is listed under "not fetched" on the page, not an error.
// Picking today's giants favours past winners, so the scorecard leads with Buy-against-Sell, not against the index.
//
// The third column is the company's US-listed shares, used only to find its news: Yahoo tags few articles
// with Hong Kong or London symbols. Add one only when sure: a wrong symbol would show another company's news.

export const MARKETS = {
  US: { label: "US", bench: "^GSPC", benchName: "S&P 500" },
  HK: { label: "Hong Kong", bench: "^HSI", benchName: "Hang Seng" },
  UK: { label: "UK", bench: "^FTSE", benchName: "FTSE 100" },
};

// Other names headlines use for a company, where its display name alone would miss them. A headline must
// name the company (or a symbol of three letters or more) to be shown with it.
export const ALSO_CALLED = {
  GOOGL: ["Google"], META: ["Meta"], "BRK-B": ["Berkshire"], JPM: ["JPMorgan", "JP Morgan"], LLY: ["Lilly"],
  XOM: ["Exxon", "ExxonMobil"], PG: ["P&G", "Procter"], JNJ: ["J&J"], BAC: ["BofA"], GE: ["GE"], UNH: ["UnitedHealthcare"],
  "0939.HK": ["CCB", "Construction Bank"], "0388.HK": ["Hong Kong Exchanges"], "9618.HK": ["JD"], "0016.HK": ["Sun Hung Kai", "SHKP"],
  "2020.HK": ["Anta"], "0001.HK": ["Hutchison"],
  "BATS.L": ["BAT", "British American"], "LSEG.L": ["LSEG", "London Stock Exchange"], "BA.L": ["BAE"], "RR.L": ["Rolls Royce"],
};

const list = (m, rows) => rows.map(([t, n, adr]) => (adr ? { t, n, m, adr } : { t, n, m }));

export const UNIVERSE = [
  ...list("US", [
    ["AAPL", "Apple"], ["MSFT", "Microsoft"], ["NVDA", "Nvidia"], ["AMZN", "Amazon"], ["GOOGL", "Alphabet"],
    ["META", "Meta Platforms"], ["AVGO", "Broadcom"], ["TSLA", "Tesla"], ["BRK-B", "Berkshire Hathaway"], ["JPM", "JPMorgan Chase"],
    ["LLY", "Eli Lilly"], ["V", "Visa"], ["MA", "Mastercard"], ["UNH", "UnitedHealth"], ["XOM", "Exxon Mobil"],
    ["COST", "Costco"], ["WMT", "Walmart"], ["NFLX", "Netflix"], ["ORCL", "Oracle"], ["HD", "Home Depot"],
    ["PG", "Procter & Gamble"], ["JNJ", "Johnson & Johnson"], ["ABBV", "AbbVie"], ["BAC", "Bank of America"], ["KO", "Coca-Cola"],
    ["AMD", "AMD"], ["CRM", "Salesforce"], ["PLTR", "Palantir"], ["GE", "GE Aerospace"], ["CVX", "Chevron"],
  ]),
  ...list("HK", [
    ["0700.HK", "Tencent", "TCEHY"], ["9988.HK", "Alibaba", "BABA"], ["3690.HK", "Meituan", "MPNGY"], ["1299.HK", "AIA", "AAGIY"], ["0005.HK", "HSBC", "HSBC"],
    ["0939.HK", "China Construction Bank"], ["1398.HK", "ICBC"], ["3988.HK", "Bank of China"], ["0941.HK", "China Mobile"], ["1810.HK", "Xiaomi", "XIACY"],
    ["2318.HK", "Ping An", "PNGAY"], ["0388.HK", "HKEX", "HKXCY"], ["1211.HK", "BYD", "BYDDY"], ["9618.HK", "JD.com", "JD"], ["0883.HK", "CNOOC"],
    ["0016.HK", "Sun Hung Kai Properties"], ["0002.HK", "CLP"], ["0001.HK", "CK Hutchison"], ["9999.HK", "NetEase", "NTES"], ["2020.HK", "ANTA Sports"],
  ]),
  ...list("UK", [
    ["AZN.L", "AstraZeneca", "AZN"], ["SHEL.L", "Shell", "SHEL"], ["HSBA.L", "HSBC", "HSBC"], ["ULVR.L", "Unilever", "UL"], ["BP.L", "BP", "BP"],
    ["RIO.L", "Rio Tinto", "RIO"], ["GSK.L", "GSK", "GSK"], ["REL.L", "RELX", "RELX"], ["BATS.L", "British American Tobacco", "BTI"], ["LSEG.L", "London Stock Exchange Group", "LNSTY"],
    ["DGE.L", "Diageo", "DEO"], ["RR.L", "Rolls-Royce", "RYCEY"], ["BA.L", "BAE Systems", "BAESY"], ["GLEN.L", "Glencore", "GLNCY"], ["NG.L", "National Grid", "NGG"],
    ["LLOY.L", "Lloyds", "LYG"], ["BARC.L", "Barclays", "BCS"], ["CPG.L", "Compass", "CMPGY"], ["AAL.L", "Anglo American", "NGLOY"], ["TSCO.L", "Tesco", "TSCDY"],
  ]),
  // Index funds, one per market: each holds the whole index, the usual first step for someone starting out.
  // Rated and charted like the stocks, but kept out of the scorecard, which tests the stock ratings.
  { t: "VOO", n: "Vanguard S&P 500 ETF", m: "US", kind: "fund",
    about: "Holds all 500 companies in the S&P 500, the main US share index, in proportion to their size, for a yearly fee of about 0.03%." },
  { t: "2800.HK", n: "Tracker Fund of Hong Kong", m: "HK", kind: "fund",
    about: "Holds the companies in the Hang Seng Index, Hong Kong's main share index, in proportion to their size, for a low yearly fee (well under 0.2%)." },
  { t: "ISF.L", n: "iShares Core FTSE 100", m: "UK", kind: "fund",
    about: "Holds the 100 largest companies listed in London, the FTSE 100, in proportion to their size, for a low yearly fee (well under 0.2%)." },
];

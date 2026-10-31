// The stocks the Stocks page rates: the largest companies in each market, by Yahoo Finance symbol.
// Edit freely; a symbol Yahoo does not know is listed under "not fetched" on the page, not an error.
// Picking today's giants favours past winners, so the scorecard leads with Buy-against-Sell, not against the index.

export const MARKETS = {
  US: { label: "US", bench: "^GSPC", benchName: "S&P 500" },
  HK: { label: "Hong Kong", bench: "^HSI", benchName: "Hang Seng" },
  UK: { label: "UK", bench: "^FTSE", benchName: "FTSE 100" },
};

const list = (m, rows) => rows.map(([t, n]) => ({ t, n, m }));

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
    ["0700.HK", "Tencent"], ["9988.HK", "Alibaba"], ["3690.HK", "Meituan"], ["1299.HK", "AIA"], ["0005.HK", "HSBC"],
    ["0939.HK", "China Construction Bank"], ["1398.HK", "ICBC"], ["3988.HK", "Bank of China"], ["0941.HK", "China Mobile"], ["1810.HK", "Xiaomi"],
    ["2318.HK", "Ping An"], ["0388.HK", "HKEX"], ["1211.HK", "BYD"], ["9618.HK", "JD.com"], ["0883.HK", "CNOOC"],
    ["0016.HK", "Sun Hung Kai Properties"], ["0002.HK", "CLP"], ["0001.HK", "CK Hutchison"], ["9999.HK", "NetEase"], ["2020.HK", "ANTA Sports"],
  ]),
  ...list("UK", [
    ["AZN.L", "AstraZeneca"], ["SHEL.L", "Shell"], ["HSBA.L", "HSBC"], ["ULVR.L", "Unilever"], ["BP.L", "BP"],
    ["RIO.L", "Rio Tinto"], ["GSK.L", "GSK"], ["REL.L", "RELX"], ["BATS.L", "British American Tobacco"], ["LSEG.L", "London Stock Exchange Group"],
    ["DGE.L", "Diageo"], ["RR.L", "Rolls-Royce"], ["BA.L", "BAE Systems"], ["GLEN.L", "Glencore"], ["NG.L", "National Grid"],
    ["LLOY.L", "Lloyds"], ["BARC.L", "Barclays"], ["CPG.L", "Compass"], ["AAL.L", "Anglo American"], ["TSCO.L", "Tesco"],
  ]),
];

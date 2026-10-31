// Stocks: renders stocks/feed.json and each stock's stocks/history/<file> (built on GitHub Actions by
// scripts/build-stocks.mjs). The watchlist lives in this phone's storage only.
import { pct, REVIEW, MIN_BARS, historyFile } from "./model.js";
import { plainEnglish, GLOSSARY } from "./explain.js";
import { ideas } from "./ideas.js";
import { toggle, sinceWatching, ratingChanges, markSeen } from "./watch.js";
import { chartModel, RANGES } from "./chart.js";
import { COMPANIES } from "./companies.js";

const $ = (s) => document.querySelector(s);
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const store = {
  get: (k) => { try { return localStorage.getItem(k); } catch { return null; } },
  set: (k, v) => { try { localStorage.setItem(k, v); } catch { /* private mode */ } },
  json: (k) => { try { return JSON.parse(localStorage.getItem(k)) || {}; } catch { return {}; } },
};

const TABS = [["watchlist", "★ Watchlist"], ["ideas", "Ideas"], ["ratings", "Ratings"], ["scorecard", "Score"], ["learn", "Learn"]];
const CHIPS = [["all", "All"], ["US", "US"], ["HK", "Hong Kong"], ["UK", "UK"]];
const SORTS = [["score", "Rating"], ["r6m", "6-month return"], ["vol", "Smallest swings"], ["name", "Name"]];
const BULLISH = new Set(["Buy", "Overweight"]), BEARISH = new Set(["Underweight", "Sell"]);

let feed = null, watch = store.json("stocks.watch"), seen = store.json("stocks.seen"), changes = {};
let tab = store.get("stocks.tab") || (Object.keys(watch).length ? "watchlist" : "ideas");
let market = store.get("stocks.market") || "all", query = "", sort = "score", range = "1Y", openStock = null;

const signed = (x, digits = 0) => (x == null ? "–" : pct(x, digits));
const tone = (x) => (x == null ? "" : x >= 0 ? "pos" : "neg");
const pts = (x) => (x == null ? "–" : `${x >= 0 ? "+" : "−"}${Math.abs(x * 100).toFixed(1)} pts`);
const day = (iso) => (iso ? new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-AU", { day: "numeric", month: "short", timeZone: "UTC" }) : "–");
const dayY = (iso) => (iso ? new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "2-digit", timeZone: "UTC" }) : "–");
const price = (x, cur) => (x == null ? "–" : `${x.toLocaleString("en-AU", { maximumFractionDigits: x < 10 ? 3 : 2 })}${cur ? ` ${esc(cur)}` : ""}`);
const pill = (r) => `<span class="pill ${esc(r)}">${r === REVIEW ? "Review" : esc(r)}</span>`;
// The phone's own date: starring at 9am in Sydney is today there, not yesterday in UTC.
const today = () => { const d = new Date(); return new Date(d.getTime() - d.getTimezoneOffset() * 60e3).toISOString().slice(0, 10); };
const bench = (s) => feed.markets[s.m]?.benchName || "index";
const byT = (t) => feed.stocks.find((x) => x.t === t);
function ago(ms) {
  const m = Math.round((Date.now() - ms) / 60e3);
  return m < 60 ? `${Math.max(m, 1)} min` : m < 48 * 60 ? `${Math.round(m / 60)} h` : `${Math.round(m / 1440)} days`;
}

function spark(values, cls) {
  if (!values?.length) return "";
  const lo = Math.min(...values), hi = Math.max(...values), span = hi - lo || 1;
  const p = values.map((v, i) => `${((i / Math.max(values.length - 1, 1)) * 100).toFixed(1)},${(28 - ((v - lo) / span) * 26).toFixed(1)}`).join(" ");
  const colour = values.at(-1) >= values[0] ? "var(--up)" : "var(--down)";
  return `<svg class="${cls}" viewBox="0 0 100 30" preserveAspectRatio="none" aria-hidden="true"><polyline points="${p}" stroke="${colour}"/></svg>`;
}

async function load(fresh = false) {
  try {
    const r = await fetch("./feed.json", { cache: fresh ? "no-cache" : "default" });
    if (!r.ok) throw new Error(r.status);
    feed = await r.json();
  } catch {
    if (!feed) $("#main").innerHTML = `<div class="empty">Prices aren't available yet. They are collected with each hourly update — try again shortly.</div>`;
    return;
  }
  // A starred symbol that has left the list (not merely missed this time) is dropped, so it cannot linger.
  const known = new Set([...feed.stocks.map((s) => s.t), ...feed.failed]);
  const stale = Object.keys(watch).filter((t) => !known.has(t));
  if (stale.length) { stale.forEach((t) => delete watch[t]); store.set("stocks.watch", JSON.stringify(watch)); }
  // Rating changes for starred stocks gather here until the Watchlist has shown them (watchlistHTML marks
  // them seen); a reload before then keeps them rather than losing them.
  changes = { ...changes, ...ratingChanges(watch, seen, feed.stocks) };
  render();
}

const inMarket = (s) => market === "all" || s.m === market;

function starButton(s) {
  const on = Boolean(watch[s.t]);
  return `<button class="star${on ? " on" : ""}" data-star="${esc(s.t)}" aria-pressed="${on}" aria-label="${on ? "Remove from" : "Add to"} watchlist">${on ? "★" : "☆"}</button>`;
}

function rowHTML(s, extra = "") {
  const changed = s.prev && s.prev !== s.rating && s.prev !== REVIEW && s.rating !== REVIEW;
  const sub = s.kind === "fund" ? "Index fund" : s.rel6 == null ? "" : `<span class="${tone(s.rel6)}">${s.rel6 >= 0 ? "+" : "−"}${Math.abs(s.rel6 * 100).toFixed(0)} pts</span> vs index`;
  return `<div class="row">${starButton(s)}<button class="row-main" data-open="${esc(s.t)}">
    <span class="who"><span class="name">${esc(s.n)}</span><span class="sub">${esc(s.t)}${sub ? ` · ${sub}` : ""}</span>${extra}</span>
    ${spark(s.spark, "spark")}
    <span class="right">${pill(s.rating)}<span class="ret"><span class="num ${tone(s.r6m)}">${signed(s.r6m)}</span> 6 mo</span>${changed ? `<span class="chg">was ${esc(s.prev)}</span>` : ""}</span>
  </button></div>`;
}

function noteCard() {
  return feed.note ? `<div class="note-card"><div class="k">Daily note · ${day(feed.note.key)} · written by Claude from the ratings</div><p>${esc(feed.note.text)}</p></div>` : "";
}

function watchlistHTML() {
  const mine = feed.stocks.filter((s) => watch[s.t]);
  if (!mine.length) {
    return `<div class="card intro"><h2>Your watchlist is empty</h2>
      <p>Tap ☆ beside any stock to watch it. It then shows here first, with how much it has moved since you started watching and any change in its rating since your last visit.</p>
      <p class="muted">Saved on this phone only.</p><button class="cta" data-tab="ideas">Find ideas to watch →</button></div>`;
  }
  const changed = Object.entries(changes).filter(([t]) => byT(t));
  const banner = changed.length ? `<div class="note-card"><div class="k">Since your last look</div><p>${changed.map(([t, c]) => `${esc(byT(t).n)}: ${esc(c.from)} → <b>${esc(c.to)}</b>`).join(" · ")}</p></div>` : "";
  const rows = mine.map((s) => {
    const since = sinceWatching(watch[s.t], s);
    return rowHTML(s, since ? `<span class="sub">Since ${day(since.since)}: <span class="num ${tone(since.change)}">${signed(since.change, 1)}</span></span>` : "");
  }).join("");
  seen = markSeen(seen, watch, feed.stocks);   // shown now, so the next visit reports only newer changes
  store.set("stocks.seen", JSON.stringify(seen));
  const missed = Object.keys(watch).filter((t) => feed.failed.includes(t));
  return `${banner}<div class="list">${rows}</div>${missed.length ? `<p class="muted">Not fetched this time: ${missed.map(esc).join(", ")}.</p>` : ""}<p class="muted">Saved on this phone only. Tap ★ to remove a stock.</p>`;
}

function ideasHTML() {
  const pool = feed.stocks.filter(inMarket);
  return `${market === "all" ? noteCard() : ""}${ideas(pool).map((list) => `<div class="card idea"><h2>${esc(list.title)}</h2><p class="muted">${esc(list.blurb)}</p>
    ${list.items.length ? list.items.map((i) => { const s = byT(i.t); return `<div class="idea-row">${starButton(s)}<button class="row-main" data-open="${esc(s.t)}"><span class="who"><span class="name">${esc(s.n)} <span class="muted">${esc(s.t)}</span></span><span class="sub">${esc(i.why)}</span></span>${pill(s.rating)}</button></div>`; }).join("") : `<p class="none">None right now.</p>`}</div>`).join("")}
    <p class="muted">Ideas are starting points for your own reading, picked by simple rules. They are not recommendations to buy.</p>`;
}

const SORTERS = {
  score: (a, b) => (b.score ?? -99) - (a.score ?? -99) || (b.r6m ?? -9) - (a.r6m ?? -9),
  r6m: (a, b) => (b.r6m ?? -9) - (a.r6m ?? -9),
  vol: (a, b) => (a.facts?.vol ?? 9) - (b.facts?.vol ?? 9),
  name: (a, b) => a.n.localeCompare(b.n),
};

// Index funds join the list when searched for; otherwise it is the stocks.
function ratingRowsHTML() {
  const q = query.trim().toLowerCase();
  const words = (s) => `${s.n} ${s.t}${s.kind === "fund" ? " index fund etf" : ""}`.toLowerCase();
  const rows = feed.stocks.filter((s) => inMarket(s) && (q ? words(s).includes(q) : s.kind !== "fund")).sort(SORTERS[sort]);
  return rows.length ? `<div class="list">${rows.map((s) => rowHTML(s)).join("")}</div>` : `<div class="empty">Nothing matches.</div>`;
}

function ratingsHTML() {
  const failed = feed.failed.length ? `<p class="muted">Not fetched this time: ${feed.failed.map(esc).join(", ")}.</p>` : "";
  return `<div class="controls"><input id="q" type="search" placeholder="Search name or symbol" value="${esc(query)}" autocomplete="off" aria-label="Search stocks">
      <select id="sort" aria-label="Sort by">${SORTS.map(([k, label]) => `<option value="${k}"${k === sort ? " selected" : ""}>${label}</option>`).join("")}</select></div>
    <div id="rows">${ratingRowsHTML()}</div>${failed}`;
}

function scorecardHTML() {
  const key = market === "all" ? "all" : market, sc = feed.scorecard[key];
  if (!sc || !sc.scored) return `<div class="empty">No scored calls yet for this market.</div>`;
  const where = market === "all" ? "each stock's own index" : `the ${esc(feed.markets[market].benchName)}`;
  const head = sc.spread == null ? "Not enough bullish and bearish calls to compare yet."
    : sc.spread >= 0 ? `Bullish calls beat bearish calls by <b>${pts(sc.spread)}</b>` : `Bearish calls beat bullish calls by <b>${pts(-sc.spread)}</b>: the rules were wrong-footed`;
  const rows = Object.entries(sc.byRating).map(([r, x]) => `<tr><td>${pill(r)}</td><td class="num">${esc(x.n)}</td><td class="num">${x.hit == null ? "–" : `${Math.round(x.hit * 100)}%`}</td><td class="num ${tone(x.alpha)}">${pts(x.alpha)}</td></tr>`).join("");
  return `<div class="card"><h2>How the rules have done</h2>
      <p>${head}, on average over ${esc(feed.holdDays)} sessions, measured against ${where}.</p>
      <p class="muted">${esc(sc.scored)} calls replayed every ${esc(feed.every)} sessions from ${day(sc.from)} to ${day(sc.to)}, each using only prices known on its day and entered at the next close. ${esc(sc.pending)} recent calls wait for their ${esc(feed.holdDays)} sessions to trade.</p></div>
    <div class="card"><table><thead><tr><th>Rating</th><th>Calls</th><th>Right way</th><th>Avg vs index</th></tr></thead><tbody>${rows}</tbody></table>
      <p class="muted">"Right way" means the stock beat its index after a Buy or Overweight, or trailed it after an Underweight or Sell. Hold claims no direction.</p></div>
    <div class="card"><h2>Read it with care</h2>
      <p class="muted">The list is today's largest companies, which favours past winners, so beating the index proves little; the Buy-against-Sell gap is the fairer test. Calls a week apart overlap, so the counts overstate how much evidence there is. Costs, taxes and currency are left out. Index funds are not counted.</p></div>`;
}

function learnHTML() {
  return `<div class="card intro"><h2>New to shares? Start here</h2>
      <p>Open any stock for a plain-English reading of its figures and a price chart. Star (☆) the ones you want to follow; your Watchlist shows how they move from the day you starred them.</p>
      <p>If you are starting out, look at the index funds in <b>Ideas</b> first: one purchase holds a whole market, which spreads the risk.</p></div>
    <div class="card"><h2>What the words mean</h2>${GLOSSARY.map((g) => `<details class="term"><summary>${esc(g.term)}</summary><p>${esc(g.text)}</p></details>`).join("")}</div>
    <button class="cta wide" id="method">How the ratings are made</button>`;
}

function render() {
  $("#tabs").innerHTML = TABS.map(([k, label]) => `<button data-tab="${k}" class="${k === tab ? "on" : ""}">${label}</button>`).join("");
  $("#chips").innerHTML = ["watchlist", "learn"].includes(tab) ? "" : CHIPS.map(([k, label]) => `<button data-market="${k}" class="${k === market ? "on" : ""}">${label}</button>`).join("");
  if (!feed) return;
  const asOf = Object.values(feed.markets).filter((m) => m.asOf).map((m) => `${m.label} ${day(m.asOf)}`).join(" · ");
  $("#dateline").textContent = `Closes to ${asOf} · updated ${ago(Date.parse(feed.builtAt))} ago`;
  const view = { watchlist: watchlistHTML, ideas: ideasHTML, ratings: ratingsHTML, scorecard: scorecardHTML, learn: learnHTML }[tab] || ideasHTML;
  $("#main").innerHTML = view();
}

function sheet(html) {
  const d = $("#sheet");
  d.innerHTML = `<button class="close" data-close aria-label="Close">✕</button>${html}`;
  if (!d.open) d.showModal();
}

function planHTML(s) {
  if (!s.plan) return "";
  const width = `two average daily ranges (${(s.plan.atrPct * 200).toFixed(1)}% of the price)`;
  const line = BULLISH.has(s.rating) ? `Stop level: <b>${price(s.plan.down, s.cur)}</b>, ${width} below the close.`
    : BEARISH.has(s.rating) ? `The bear case fails above <b>${price(s.plan.up, s.cur)}</b>, ${width} above the close.`
      : `Range to watch: <b>${price(s.plan.down, s.cur)}</b> to <b>${price(s.plan.up, s.cur)}</b>, ${width} either side.`;
  return `<div class="card"><h2>Trader's levels</h2><p>${line}</p></div>`;
}

// The news analyst reports headlines; they are never part of the rating (past headlines cannot be replayed).
function newsHTML(s) {
  if (s.kind === "fund") return "";
  const items = (s.news || []).filter((n) => /^https?:\/\//i.test(n.l));
  const body = s.news == null ? `<p class="muted">News wasn't fetched this time.</p>`
    : !items.length ? `<p class="muted">No headlines naming ${esc(s.n)} in the last week.</p>`
      : items.map((n) => `<a class="headline" href="${esc(n.l)}" target="_blank" rel="noopener noreferrer"><span class="ht">${esc(n.t)}</span><span class="muted">${esc(n.p)}${n.p ? " · " : ""}${ago(n.at)} ago ↗</span></a>`).join("");
  return `<div class="card"><h2>News <span class="muted">· not part of the rating</span></h2>${body}</div>`;
}

function statsHTML(s) {
  const st = s.stats || {}, f = s.facts;
  const pos = st.hi52 > st.lo52 ? Math.min(100, Math.max(0, ((s.price - st.lo52) / (st.hi52 - st.lo52)) * 100)) : 50;
  const cell = (label, value, cls = "") => `<div><span>${label}</span><span class="num ${cls}">${value}</span></div>`;
  return `<div class="card"><h2>Key figures</h2>
    ${st.hi52 != null ? `<div class="range52"><div class="muted">52-week range</div><div class="bar"><i style="left:${pos.toFixed(1)}%"></i></div>
      <div class="ends num"><span>${price(st.lo52, s.cur)}</span><span>${price(st.hi52, s.cur)}</span></div></div>` : ""}
    <div class="facts">
      ${cell("1 month", signed(s.r1m), tone(s.r1m))}${cell("3 months", signed(s.r3m), tone(s.r3m))}
      ${cell("6 months", signed(s.r6m), tone(s.r6m))}${cell("12 months", signed(s.r12m), tone(s.r12m))}
      ${cell("Dividend yield", st.divYield == null ? "–" : st.divYield > 0 ? `${(st.divYield * 100).toFixed(1)}%` : "none")}
      ${cell("Typical daily move", st.dailyMove == null ? "–" : `${(st.dailyMove * 100).toFixed(1)}%`)}
      ${f ? `${cell("Swings a year", `${Math.round(f.vol * 100)}%`)}${cell("RSI (14)", f.rsi.toFixed(0))}
      ${cell("From 52-wk high", f.drawdown ? `−${Math.round(f.drawdown * 100)}%` : "at high")}${s.kind === "fund" ? "" : cell(`vs ${esc(bench(s))}, 6 mo`, pts(s.rel6), tone(s.rel6))}` : ""}
    </div><p class="muted">Returns include dividends; the chart and the 52-week range show the price alone. Not sure what a figure means? See the Learn tab.</p></div>`;
}

function ratingHTML(s) {
  if (s.rating === REVIEW) return "";
  const list = (xs) => (xs.length ? `<ul>${xs.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>` : `<p class="none">Nothing the rules count.</p>`);
  const dots = (n) => `<span class="dots" aria-label="score ${esc(n)}">${[-2, -1, 1, 2].map((k) => `<i class="${k < 0 && n <= k ? "n" : k > 0 && n >= k ? "p" : ""}"></i>`).join("")}</span>`;
  return `<div class="cases"><div class="case bull"><h4>Bull case</h4>${list(s.bull)}</div><div class="case bear"><h4>Bear case</h4>${list(s.bear)}</div></div>
    <div class="card"><h2>The analysts</h2>${s.analysts.map((a) => `<div class="analyst"><span>${esc(a.label)}</span>${dots(a.score)}</div>`).join("")}
      <p class="muted">Buy at +4 or more, Overweight +2 to +3, Hold −1 to +1, Underweight −2 to −3, Sell −4 or less.</p></div>${planHTML(s)}`;
}

// ---------- the price chart ----------
const W = 320, H = 150, PAD = 6;
let chartData = null, chartView = null, chartFailed = false;

function chartHTML() {
  return `<div class="card chart-card"><div class="chart-head"><h2>Price</h2><div class="ranges">${RANGES.map(([k]) => `<button data-range="${k}" class="${k === range ? "on" : ""}">${k}</button>`).join("")}</div></div>
    <div class="chart" id="chart"><p class="muted">Loading the price history…</p></div>
    <div class="legend"><span class="k price">Price</span><span class="k ma50">50-day</span><span class="k ma200">200-day</span><span class="k idx">Index</span></div></div>`;
}

const yOf = (v, m) => PAD + (H - 2 * PAD) * (1 - (v - m.lo) / (m.hi - m.lo || 1));
const xOf = (i, m) => (i / Math.max(m.p.length - 1, 1)) * W;
const path = (xs, m) => xs.map((v, i) => (v == null ? null : `${xOf(i, m).toFixed(1)},${yOf(v, m).toFixed(1)}`)).filter(Boolean).join(" ");

function drawChart(s) {
  const box = $("#chart");
  if (!box) return;
  if (!chartData) { if (chartFailed) box.innerHTML = chartFailedHTML(); return; }   // still loading otherwise
  const m = chartView = chartModel(chartData, Object.fromEntries(RANGES)[range]);
  const up = m.change >= 0;
  box.innerHTML = `<div class="readout" id="readout"><b>${price(m.p.at(-1), s.cur)}</b> · ${dayY(m.d.at(-1))} · <span class="${tone(m.change)}">${signed(m.change, 1)} over ${range}</span></div>
    <svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" id="chart-svg" role="img" aria-label="Price chart, ${esc(range)}">
      <polyline class="idx" points="${path(m.b, m)}"/><polyline class="ma200" points="${path(m.ma200, m)}"/><polyline class="ma50" points="${path(m.ma50, m)}"/>
      <polyline class="price ${up ? "up" : "down"}" points="${path(m.p, m)}"/>
      <line id="cursor" class="cursor" x1="0" x2="0" y1="0" y2="${H}" visibility="hidden"/></svg>
    <div class="axis num"><span>${dayY(m.d[0])}</span><span>${price(m.lo, "")} – ${price(m.hi, "")}</span><span>${dayY(m.d.at(-1))}</span></div>`;
  const svg = $("#chart-svg");
  const read = (e) => {
    const r = svg.getBoundingClientRect();
    const i = Math.round(Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)) * (m.p.length - 1));
    const x = xOf(i, m);
    const cur = $("#cursor");
    cur.setAttribute("x1", x); cur.setAttribute("x2", x); cur.setAttribute("visibility", "visible");
    const vs = m.b[i] == null ? "" : ` · index ${signed(m.b[i] / m.p[0] - 1, 1)}`;
    $("#readout").innerHTML = `<b>${price(m.p[i], s.cur)}</b> · ${dayY(m.d[i])} · <span class="${tone(m.p[i] / m.p[0] - 1)}">${signed(m.p[i] / m.p[0] - 1, 1)} from ${dayY(m.d[0])}</span>${vs}`;
  };
  svg.addEventListener("pointerdown", read);
  svg.addEventListener("pointermove", read);
}

const chartFailedHTML = () => `<p class="muted">The price history isn't available right now${navigator.onLine ? "" : " (offline)"}.</p>`;

async function loadChart(s) {
  chartData = null;
  chartFailed = false;
  try {
    const r = await fetch(`./history/${historyFile(s.t)}`, { cache: "default" });
    if (!r.ok) throw new Error(r.status);
    const h = await r.json();
    if (openStock !== s.t) return;
    chartData = h;
    drawChart(s);
  } catch {
    if (openStock !== s.t) return;
    chartFailed = true;
    drawChart(s);
  }
}

// ---------- one stock ----------
function caseFile(t) {
  const s = byT(t);
  if (!s) return;
  const firstOpen = openStock !== t;
  openStock = t;
  const m = feed.markets[s.m];
  const since = sinceWatching(watch[s.t], s);
  const [sector, does] = COMPANIES[s.t] || [];
  sheet(`<div class="hdr"><div class="title-row"><h3>${esc(s.n)}</h3>${starButton(s)}</div>
      ${does ? `<p class="does"><span class="sector">${esc(sector)}</span> ${esc(does)}</p>` : ""}
      <div class="muted">${esc(s.t)} · ${esc(m.label)}${s.kind === "fund" ? " · index fund" : ""} · close ${day(s.d)}: <span class="num">${price(s.price, s.cur)}</span> <span class="num ${tone(s.r1d)}">${signed(s.r1d, 1)}</span></div>
      ${since ? `<div class="watching">Watching since ${day(since.since)} at ${price(watch[s.t].price, s.cur)}: <span class="num ${tone(since.change)}">${signed(since.change, 1)}</span></div>` : ""}
      <div class="rating-line">${pill(s.rating)} <span class="muted">${esc(s.rating === REVIEW ? s.reason : s.summary)}</span></div></div>
    ${chartHTML()}
    <div class="card"><h2>In plain English</h2>${plainEnglish(s, bench(s)).map((x) => `<p>${esc(x)}</p>`).join("")}</div>
    ${statsHTML(s)}
    ${ratingHTML(s)}
    ${newsHTML(s)}
    <div class="card"><h2>The last ${s.history.length} weekly calls</h2>
      <div class="strip">${s.history.map((h) => `<i class="${esc(h.rating)}" title="${day(h.d)}: ${esc(h.rating)}"></i>`).join("")}</div>
      <div class="muted" style="display:flex;justify-content:space-between;margin-top:4px"><span>${day(s.history[0]?.d)}</span><span>${day(s.history.at(-1)?.d)}</span></div></div>
    <p class="muted">Personal research from fixed rules on past prices. Not financial advice.</p>`);
  if (firstOpen) { $("#sheet").scrollTop = 0; loadChart(s); } else drawChart(s);
}

function about() {
  openStock = null;
  $("#sheet").scrollTop = 0;
  sheet(`<h3>How the ratings are made</h3>
    <p>A small, rule-based take on a multi-agent trading desk. Four analysts each argue one angle from daily closing prices: <b>Trend</b> (200- and 50-day averages), <b>Momentum</b> (12 months leaving out the last, and 3 months), <b>Against the index</b> (6 months against the S&P 500, Hang Seng or FTSE 100) and <b>Risk</b> (stretched RSI, distance from the 50-day average and the 52-week high, volatility). The judge adds their scores into a rating. A stock with under ${MIN_BARS} sessions of history, or no index prices, is marked Review instead of rated.</p>
    <p>The <b>Scorecard</b> replays the same rules over the past year using only prices known on each day, so it is an honest test of the rules, not of hindsight.</p>
    <p>The <b>News</b> card lists up to six recent headlines from Yahoo Finance that name the company. News is shown, never rated: there is no record of what was published on each past day, so it could not be scored honestly.</p>
    <p class="muted">Prices: Yahoo Finance, refreshed every few hours from each market's daily close. The daily note is written by Claude (${esc(feed.note?.model || "when an API key is set")}) from these ratings, once per US session.</p>
    ${feed.failed.length ? `<p class="muted">Not fetched this time: ${feed.failed.map(esc).join(", ")}.</p>` : ""}
    <p class="muted">Personal research. Not financial advice: no account is taken of anyone's objectives, finances or needs.</p>`);
}

function star(t) {
  const s = byT(t);
  if (!s) return;
  watch = toggle(watch, s, today());
  store.set("stocks.watch", JSON.stringify(watch));
  seen = markSeen(seen, watch, feed.stocks);
  store.set("stocks.seen", JSON.stringify(seen));
  render();
  if ($("#sheet").open && openStock === t) caseFile(t);
}

document.addEventListener("click", (e) => {
  const el = e.target.closest("[data-star],[data-tab],[data-market],[data-range],[data-open],[data-close],#refresh,#about,#method");
  if (!el) return;
  if (el.dataset.star) { e.stopPropagation(); return star(el.dataset.star); }
  if (el.dataset.tab) { tab = el.dataset.tab; store.set("stocks.tab", tab); window.scrollTo(0, 0); return render(); }
  if (el.dataset.market) { market = el.dataset.market; store.set("stocks.market", market); return render(); }
  if (el.dataset.range) { range = el.dataset.range; $("#sheet").querySelectorAll("[data-range]").forEach((b) => b.classList.toggle("on", b.dataset.range === range)); return drawChart(byT(openStock)); }
  if (el.dataset.open) return caseFile(el.dataset.open);
  if (el.dataset.close !== undefined) { openStock = null; return $("#sheet").close(); }
  if (el.id === "refresh") return load(true);
  if ((el.id === "about" || el.id === "method") && feed) return about();
});
document.addEventListener("input", (e) => {
  if (e.target.id === "q") { query = e.target.value; $("#rows").innerHTML = ratingRowsHTML(); }
});
document.addEventListener("change", (e) => { if (e.target.id === "sort") { sort = e.target.value; $("#rows").innerHTML = ratingRowsHTML(); } });
$("#sheet").addEventListener("click", (e) => { if (e.target.id === "sheet") { openStock = null; $("#sheet").close(); } });
$("#sheet").addEventListener("close", () => { openStock = null; });
document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible" && feed && Date.now() - Date.parse(feed.builtAt) > 60 * 60e3) load(true); });

render();
load();
if ("serviceWorker" in navigator) navigator.serviceWorker.register("../sw.js").catch(() => {});

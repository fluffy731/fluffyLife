// Stocks: renders stocks/feed.json (built on GitHub Actions by scripts/build-stocks.mjs).
import { pct, REVIEW, MIN_BARS } from "./model.js";

const $ = (s) => document.querySelector(s);
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const store = { get: (k) => { try { return localStorage.getItem(k); } catch { return null; } }, set: (k, v) => { try { localStorage.setItem(k, v); } catch { /* private mode */ } } };

const TABS = [["ratings", "Ratings"], ["scorecard", "Scorecard"]];
const CHIPS = [["all", "All"], ["US", "US"], ["HK", "Hong Kong"], ["UK", "UK"]];
const BULLISH = new Set(["Buy", "Overweight"]), BEARISH = new Set(["Underweight", "Sell"]);
let feed = null, tab = store.get("stocks.tab") || "ratings", market = store.get("stocks.market") || "all";

const signed = (x, digits = 0) => (x == null ? "–" : pct(x, digits));
const tone = (x) => (x == null ? "" : x >= 0 ? "pos" : "neg");
const pts = (x) => (x == null ? "–" : `${x >= 0 ? "+" : "−"}${Math.abs(x * 100).toFixed(1)} pts`);
const day = (iso) => (iso ? new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-AU", { day: "numeric", month: "short", timeZone: "UTC" }) : "–");
const price = (x, cur) => `${x.toLocaleString("en-AU", { maximumFractionDigits: x < 10 ? 3 : 2 })}${cur ? ` ${esc(cur)}` : ""}`;
const pill = (r) => `<span class="pill ${esc(r)}">${r === REVIEW ? "Review" : esc(r)}</span>`;
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
  render();
}

const inMarket = (s) => market === "all" || s.m === market;

function rowHTML(s) {
  const changed = s.prev && s.prev !== s.rating && s.prev !== REVIEW && s.rating !== REVIEW;
  return `<button class="row" data-open="${esc(s.t)}">
    <div class="who"><div class="name">${esc(s.n)}</div>
      <div class="sub">${esc(s.t)}${s.rel6 == null ? "" : ` · <span class="${tone(s.rel6)}">${s.rel6 >= 0 ? "+" : "−"}${Math.abs(s.rel6 * 100).toFixed(0)} pts</span> vs index`}</div></div>
    ${spark(s.spark, "spark")}
    <div class="right">${pill(s.rating)}<span class="ret"><span class="num ${tone(s.r6m)}">${signed(s.r6m)}</span> 6 mo</span>${changed ? `<span class="chg">was ${esc(s.prev)}</span>` : ""}</div>
  </button>`;
}

function ratingsHTML() {
  const rows = feed.stocks.filter(inMarket);
  const note = feed.note && market === "all"
    ? `<div class="note-card"><div class="k">Daily note · ${day(feed.note.key)} · written by Claude from the ratings below</div><p>${esc(feed.note.text)}</p></div>` : "";
  const failed = feed.failed.length ? `<p class="muted">Not fetched this time: ${feed.failed.map(esc).join(", ")}.</p>` : "";
  return `${note}${rows.length ? `<div class="list">${rows.map(rowHTML).join("")}</div>` : `<div class="empty">No stocks in this market right now.</div>`}${failed}`;
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
      <p class="muted">The list is today's largest companies, which favours past winners, so beating the index proves little; the Buy-against-Sell gap is the fairer test. Calls a week apart overlap, so the counts overstate how much evidence there is. Costs, taxes and currency are left out.</p></div>`;
}

function render() {
  $("#tabs").innerHTML = TABS.map(([k, label]) => `<button data-tab="${k}" class="${k === tab ? "on" : ""}">${label}</button>`).join("");
  $("#chips").innerHTML = CHIPS.map(([k, label]) => `<button data-market="${k}" class="${k === market ? "on" : ""}">${label}</button>`).join("");
  if (!feed) return;
  const asOf = Object.values(feed.markets).filter((m) => m.asOf).map((m) => `${m.label} ${day(m.asOf)}`).join(" · ");
  $("#dateline").textContent = `Closes to ${asOf} · updated ${ago(Date.parse(feed.builtAt))} ago`;
  $("#main").innerHTML = tab === "scorecard" ? scorecardHTML() : ratingsHTML();
}

function sheet(html) {
  const d = $("#sheet");
  d.innerHTML = `<button class="close" data-close aria-label="Close">✕</button>${html}`;
  d.showModal();
  d.scrollTop = 0;
}

function planHTML(s) {
  if (!s.plan) return "";
  const range = `two average daily ranges (${(s.plan.atrPct * 200).toFixed(1)}% of the price)`;
  const line = BULLISH.has(s.rating) ? `Stop level: <b>${price(s.plan.down, s.cur)}</b>, ${range} below the close.`
    : BEARISH.has(s.rating) ? `The bear case fails above <b>${price(s.plan.up, s.cur)}</b>, ${range} above the close.`
      : `Range to watch: <b>${price(s.plan.down, s.cur)}</b> to <b>${price(s.plan.up, s.cur)}</b>, ${range} either side.`;
  return `<div class="card"><h2>Trader's levels</h2><p>${line}</p></div>`;
}

function caseFile(t) {
  const s = feed.stocks.find((x) => x.t === t);
  if (!s) return;
  const m = feed.markets[s.m];
  const list = (xs) => (xs.length ? `<ul>${xs.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>` : `<p class="none">Nothing the rules count.</p>`);
  const dots = (n) => `<span class="dots" aria-label="score ${esc(n)}">${[-2, -1, 1, 2].map((k) => `<i class="${k < 0 && n <= k ? "n" : k > 0 && n >= k ? "p" : ""}"></i>`).join("")}</span>`;
  const f = s.facts;
  sheet(`<div class="hdr"><h3>${esc(s.n)}</h3>
      <div class="muted">${esc(s.t)} · ${esc(m.label)} · close ${day(s.d)}: <span class="num">${price(s.close, s.cur)}</span> <span class="num ${tone(s.r1d)}">${signed(s.r1d, 1)}</span></div>
      ${spark(s.spark, "spark-lg")}
      <div>${pill(s.rating)} <span class="muted">${esc(s.rating === REVIEW ? s.reason : s.summary)}</span></div></div>
    ${s.rating === REVIEW ? "" : `<div class="cases"><div class="case bull"><h4>Bull case</h4>${list(s.bull)}</div><div class="case bear"><h4>Bear case</h4>${list(s.bear)}</div></div>
    <div class="card"><h2>The analysts</h2>${s.analysts.map((a) => `<div class="analyst"><span>${esc(a.label)}</span>${dots(a.score)}</div>`).join("")}
      <p class="muted">Buy at +4 or more, Overweight +2 to +3, Hold −1 to +1, Underweight −2 to −3, Sell −4 or less.</p></div>
    ${planHTML(s)}`}
    <div class="card"><h2>The last ${s.history.length} weekly calls</h2>
      <div class="strip">${s.history.map((h) => `<i class="${esc(h.rating)}" title="${day(h.d)}: ${esc(h.rating)}"></i>`).join("")}</div>
      <div class="muted" style="display:flex;justify-content:space-between;margin-top:4px"><span>${day(s.history[0]?.d)}</span><span>${day(s.history.at(-1)?.d)}</span></div></div>
    <div class="card"><h2>Figures</h2><div class="facts">
      <div><span>1 month</span><span class="num ${tone(s.r1m)}">${signed(s.r1m)}</span></div><div><span>3 months</span><span class="num ${tone(s.r3m)}">${signed(s.r3m)}</span></div>
      <div><span>6 months</span><span class="num ${tone(s.r6m)}">${signed(s.r6m)}</span></div><div><span>12 months</span><span class="num ${tone(s.r12m)}">${signed(s.r12m)}</span></div>
      ${f ? `<div><span>RSI (14)</span><span class="num">${f.rsi.toFixed(0)}</span></div><div><span>Volatility</span><span class="num">${Math.round(f.vol * 100)}% a yr</span></div>
      <div><span>From 52-wk high</span><span class="num">${f.drawdown ? `−${Math.round(f.drawdown * 100)}%` : "at high"}</span></div><div><span>vs ${esc(m.benchName)}, 6 mo</span><span class="num ${tone(s.rel6)}">${pts(s.rel6)}</span></div>` : ""}
    </div></div>`);
}

function about() {
  sheet(`<h3>Method</h3>
    <p>A small, rule-based take on a multi-agent trading desk. Four analysts each argue one angle from daily closing prices: <b>Trend</b> (200- and 50-day averages), <b>Momentum</b> (12 months leaving out the last, and 3 months), <b>Against the index</b> (6 months against the S&P 500, Hang Seng or FTSE 100) and <b>Risk</b> (stretched RSI, distance from the 50-day average and the 52-week high, volatility). The judge adds their scores into a rating. A stock with under ${MIN_BARS} sessions of history, or no index prices, is marked Review instead of rated.</p>
    <p>The <b>Scorecard</b> replays the same rules over the past year using only prices known on each day, so it is an honest test of the rules, not of hindsight.</p>
    <p class="muted">Prices: Yahoo Finance, adjusted for dividends and splits, refreshed every few hours. The daily note is written by Claude (${esc(feed.note?.model || "when an API key is set")}) from these ratings only, once per US session.</p>
    ${feed.failed.length ? `<p class="muted">Not fetched this time: ${feed.failed.map(esc).join(", ")}.</p>` : ""}
    <p class="muted">Personal research. Not financial advice: no account is taken of anyone's objectives, finances or needs.</p>`);
}

document.addEventListener("click", (e) => {
  const el = e.target.closest("[data-tab],[data-market],[data-open],[data-close],#refresh,#about");
  if (!el) return;
  if (el.dataset.tab) { tab = el.dataset.tab; store.set("stocks.tab", tab); window.scrollTo(0, 0); return render(); }
  if (el.dataset.market) { market = el.dataset.market; store.set("stocks.market", market); return render(); }
  if (el.dataset.open) return caseFile(el.dataset.open);
  if (el.dataset.close !== undefined) return $("#sheet").close();
  if (el.id === "refresh") return load(true);
  if (el.id === "about" && feed) return about();
});
$("#sheet").addEventListener("click", (e) => { if (e.target.id === "sheet") $("#sheet").close(); });
document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible" && feed && Date.now() - Date.parse(feed.builtAt) > 60 * 60e3) load(true); });

render();
load();
if ("serviceWorker" in navigator) navigator.serviceWorker.register("../sw.js").catch(() => {});

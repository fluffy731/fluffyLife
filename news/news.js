// Briefing: renders news/feed.json (built hourly on GitHub Actions by scripts/build-news.mjs).
import { TABS, LEANS, LEAN_LABEL, storiesFor, leanCounts, skew, headline, ago, koLookup } from "./model.js";

const $ = (s) => document.querySelector(s);
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const store = { get: (k) => { try { return localStorage.getItem(k); } catch { return null; } }, set: (k, v) => { try { localStorage.setItem(k, v); } catch { /* private mode */ } } };

let feed = null, byId = {}, tab = store.get("news.tab") || "top", dict = null;

async function load(fresh = false) {
  try {
    const r = await fetch("./feed.json", { cache: fresh ? "no-cache" : "default" });
    if (!r.ok) throw new Error(r.status);
    feed = await r.json();
    byId = Object.fromEntries(feed.sources.map((s) => [s.id, s]));
  } catch {
    if (!feed) $("#feed").innerHTML = `<div class="empty">News isn't available yet. It is collected every hour — try again shortly.</div>`;
    return;
  }
  render();
}

function tabsHTML() {
  return TABS.map(([k, label]) => `<button data-tab="${k}" class="${k === tab ? "on" : ""}">${esc(label)}</button>`).join("");
}

function barHTML(c) {
  const parts = [...LEANS, "T"].filter((k) => c[k]).map((k) => `<i style="flex:${c[k]};background:var(--${k})"></i>`).join("");
  return `<span class="bar" aria-hidden="true">${parts}</span>`;
}

// Korean text: each word is tappable for a dictionary lookup.
const koWords = (text) => esc(text).split(/(\s+)/).map((w) => (/[가-힣]/.test(w) ? `<span class="w" data-ko="${w}">${w}</span>` : w)).join("");

function storyHTML(s, i) {
  const c = leanCounts(s, byId), n = Object.values(c).reduce((a, b) => a + b, 0);
  const sk = skew(c);
  const title = headline(s, byId);
  const lead = s.items.find((x) => x.t === title) || s.items[0];
  const ko = s.lang === "ko";
  const topic = s.topics.find((t) => ["construction", "engineering", "property", "regulation"].includes(t));
  return `<article class="story${i === 0 ? " lead" : ""}${ko ? " ko" : ""}" data-story="${s.id}">
    ${s.image ? `<img class="pic" src="${esc(s.image)}" alt="" loading="${i < 3 ? "eager" : "lazy"}" referrerpolicy="no-referrer" onerror="this.remove()">` : ""}
    <div class="body">
      ${tab === "au" && s.geo?.includes("vic") ? `<div class="tag">Victoria</div>` : topic && tab !== topic ? `<div class="tag">${esc(topic)}</div>` : ""}
      <h2>${ko ? koWords(title) : esc(title)}</h2>
      ${lead.d ? `<p class="dek">${ko ? koWords(lead.d) : esc(lead.d)}</p>` : ""}
      <div class="meta"><span class="n">${n} ${n === 1 ? "outlet" : "outlets"}</span>${barHTML(c)}<span>${ago(s.time)}</span></div>
      ${sk ? `<div class="skew">Covered mostly by <b>${sk}-leaning</b> outlets</div>` : ""}
      <button class="toggle" data-toggle="${s.id}">${n > 1 ? `Compare ${n} headlines` : "Read"} ▾</button>
      <div class="outlets">${s.items.map((it) => {
        const src = byId[it.s] || { name: it.s, lean: "C" };
        return `<a class="outlet" href="${esc(it.l)}" target="_blank" rel="noopener">
          <div class="src"><span class="lean ${src.lean}">${esc(LEAN_LABEL[src.lean])}</span>${esc(src.name)} · ${ago(it.time)}</div>
          <div class="t">${esc(it.t)}</div>${it.d && it !== lead ? `<div class="d">${esc(it.d)}</div>` : ""}
          <span class="go">Read at ${esc(src.name)} ↗</span></a>`;
      }).join("")}</div>
    </div></article>`;
}

function render() {
  $("#tabs").innerHTML = tabsHTML();
  if (!feed) return;
  const built = new Date(feed.built);
  $("#dateline").textContent = `${built.toLocaleDateString("en-AU", { weekday: "long", day: "numeric", month: "long" })} · updated ${ago(built.getTime())} ago`;
  const list = storiesFor(tab, feed.stories, byId).slice(0, 60);
  $("#feed").innerHTML = list.length ? list.map(storyHTML).join("") : `<div class="empty">Nothing here right now.</div>`;
}

function sheet(html) {
  const d = $("#sheet");
  d.innerHTML = `<button class="close" data-close aria-label="Close">✕</button>${html}`;
  d.showModal();
}

async function lookup(word) {
  sheet(`<h3>${esc(word)}</h3><p class="note">Looking up…</p>`);
  try { dict ||= (await (await fetch("../dict/ko.json")).json()).rows; } catch { sheet(`<h3>${esc(word)}</h3><p class="note">The Korean dictionary needs to be online the first time.</p>`); return; }
  const r = koLookup(word, dict);
  sheet(r
    ? `<h3>${esc(r[0])}${r[1] && r[1] !== r[0] ? `<span class="hj" lang="zh-Hant">${esc(r[1])}</span>` : ""}</h3>
       ${r[3] ? `<p class="note">[${esc(r[3])}] · ${esc(r[2])}</p>` : `<p class="note">${esc(r[2])}</p>`}
       <p>${esc(r[4])}</p>${r[5] ? `<p class="note">${esc(r[5])}<br>${esc(r[6])}</p>` : ""}
       <p class="note">Search it in 한자 Korean → Browse to add it to your study cards.</p>`
    : `<h3>${esc(word)}</h3><p class="note">Not found in the dictionary (it may be a name or an inflected form).</p>`);
}

function about() {
  const groups = [["au", "Australia"], ["world", "World"], ["asia", "Asia"], ["ko", "한국어"], ["topic", "Construction · Engineering · Property"]];
  sheet(`<h3>Sources & method</h3>
    <p class="note">Only free-to-read outlets. Opinion, commentary, editorials and analysis columns are removed automatically. The same story from different outlets is grouped so you can compare headlines.</p>
    <div class="legend">${[...LEANS, "T"].map((k) => `<span class="lean ${k}">${LEAN_LABEL[k]}</span>`).join("")}</div>
    <p class="note">Lean labels are approximate and follow widely cited ratings (AllSides, Media Bias/Fact Check); Korean outlets follow the usual 진보·중도·보수 classification. They describe an outlet overall, not each article.</p>
    ${groups.map(([g, label]) => `<h3 style="font-size:16px;margin-top:14px">${label}</h3>${feed.sources.filter((s) => s.region === g).map((s) =>
      `<div class="src-row"><span>${esc(s.name)}</span><span><span class="lean ${s.lean}">${LEAN_LABEL[s.lean]}</span>${s.ok ? "" : ` <span class="down">feed down</span>`}</span></div>`).join("")}`).join("")}
    <p class="note" style="margin-top:12px">Updated hourly. Headlines and short summaries link to the original articles.</p>`);
}

document.addEventListener("click", (e) => {
  const el = e.target.closest("[data-tab],[data-toggle],[data-ko],[data-close],#refresh,#about");
  if (!el) return;
  if (el.dataset.tab) { tab = el.dataset.tab; store.set("news.tab", tab); window.scrollTo(0, 0); return render(); }
  if (el.dataset.toggle) { const a = el.closest(".story"); a.classList.toggle("open"); el.textContent = el.textContent.replace(/[▾▴]/, a.classList.contains("open") ? "▴" : "▾"); return; }
  if (el.dataset.ko) { e.preventDefault(); return lookup(el.dataset.ko); }
  if (el.dataset.close !== undefined) return $("#sheet").close();
  if (el.id === "refresh") return load(true);
  if (el.id === "about" && feed) return about();
});
$("#sheet").addEventListener("click", (e) => { if (e.target.id === "sheet") $("#sheet").close(); });
document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible" && feed && Date.now() - Date.parse(feed.built) > 30 * 60e3) load(true); });

render();
load();
if ("serviceWorker" in navigator) navigator.serviceWorker.register("../sw.js").catch(() => {});

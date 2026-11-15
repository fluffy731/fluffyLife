// Films: the screens. Renders films/feed.json (built weekly on GitHub Actions by scripts/build-films.mjs) on the
// Metro line look (../metro.css, data-line="film"). The ranking logic is in model.js; what the phone keeps, store.js.
import { PLACES, ERAS, NAMED_ERAS, shelfLists, genreChips, erasWithFilms, rankMap, surprise } from "./model.js";
import { load, save } from "./store.js";

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const NO_FEED = "The film list arrives with the next update, once a TMDB key has been added to the repository.";
const LISTS = { rated: "Best rated", popular: "Most popular", crowd: "Crowd-pleasers", now: "Popular right now" };
const GRID_STEP = 24;

const state = load();
let feed = null, ranks = new Map(), byId = new Map();
let tab = "browse";
let grid = null;            // { list: "rated"|"popular"|"crowd", genre: string|null, shown: number } while a full list is open

// ---------- helpers ----------
export const posterURL = (path, w = 185) => (path ? `https://image.tmdb.org/t/p/w${w}${path}` : null);
const shelf = () => ({ place: state.settings.place, era: state.settings.era, genre: state.settings.genre });
const films = () => feed?.films || [];
const seenSet = () => new Set(Object.keys(state.seen).map(Number));
const isZh = (f) => f.lang === "zh" || f.lang === "cn";
const langOf = (f) => (isZh(f) ? (f.country === "CN" ? "zh-Hans" : "zh-Hant") : f.lang === "ko" ? "ko" : "en");
const ICON_DICE = `<svg class="ic-btn" viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="8" width="10" height="10" rx="2.2"/><rect x="10.5" y="4" width="10" height="10" rx="2.2" fill="var(--surface)"/><circle cx="6.6" cy="11.1" r="1" class="pip"/><circle cx="10.4" cy="14.9" r="1" class="pip"/><circle cx="13.6" cy="7.1" r="1" class="pip"/><circle cx="15.5" cy="9" r="1" class="pip"/><circle cx="17.4" cy="10.9" r="1" class="pip"/></svg>`;

// A poster tile: the poster (or its title when there's none or it won't load), both titles, the year and rating.
export function tile(f) {
  const marks = (state.seen[f.id] ? `<i class="mark seen" title="Seen"></i>` : "") + (state.want[f.id] ? `<i class="mark want" title="On your watchlist"></i>` : "");
  const img = f.poster ? `<img loading="lazy" alt="" src="${posterURL(f.poster)}" onerror="this.remove()">` : "";
  const en = f.title && f.title !== f.original ? `<span class="t-en">${esc(f.title)}</span>` : "";
  return `<button class="film" data-film="${f.id}"><span class="poster"><span class="ph" lang="${langOf(f)}">${esc(f.original)}</span>${img}${marks}</span>`
    + `<b class="t-orig${isZh(f) ? " zh-t" : ""}" lang="${langOf(f)}">${esc(f.original)}</b>${en}`
    + `<span class="meta">${f.year} <i class="star" aria-hidden="true"></i>${(f.rating || 0).toFixed(1)}</span></button>`;
}

const chip = (attr, val, label, on) => `<button data-${attr}="${esc(val)}"${on ? ' class="on"' : ""}>${label}</button>`;

function eraLine(f) {
  const live = erasWithFilms(films(), f), named = NAMED_ERAS[f.place] || {};
  return `<div class="era-line" role="group" aria-label="Era">${ERAS.map((e) => {
    const label = named[e.id];
    const cls = ["stop", f.era === e.id ? "on" : "", label ? "interchange" : ""].filter(Boolean).join(" ");
    return `<button class="${cls}" data-era="${e.id}"${live.has(e.id) ? "" : " disabled"} aria-pressed="${f.era === e.id}"><i></i><b>${e.name}</b>${label ? `<small>${esc(label)}</small>` : ""}</button>`;
  }).join("")}</div>`;
}

function row(key, title, list) {
  if (!list.length) return "";
  return `<section class="row-list" data-list="${esc(key)}"><div class="row-head"><h2>${esc(title)}</h2><button class="all" data-all="${esc(key)}">All</button></div>`
    + `<div class="posters">${list.slice(0, 20).map(tile).join("")}</div></section>`;
}

// ---------- screens (each fills the view) ----------
function browse(el) {
  if (!feed) { el.innerHTML = `<p class="empty">${NO_FEED}</p>`; return; }
  if (grid) return fullList(el);
  const f = shelf(), all = films();
  const chips = genreChips(all, f);
  if (f.genre !== "all" && !chips.some((c) => c.genre === f.genre)) chips.unshift({ genre: f.genre, count: 0 });
  const lists = shelfLists(all, feed.stats, f);
  let rows = Object.keys(LISTS).map((k) => row(k, LISTS[k], lists[k])).join("");
  if (f.genre === "all") rows += chips.slice(0, 6).map((c) => row(`genre:${c.genre}`, c.genre, shelfLists(all, feed.stats, { ...f, genre: c.genre }).rated)).join("");
  el.innerHTML = `<div class="chips" id="place-chips">${chip("place", "all", "All", f.place === "all")}${PLACES.map((p) =>
      chip("place", p.id, `${p.name}${p.local ? ` <span lang="${p.lang}">${p.local}</span>` : ""}`, f.place === p.id)).join("")}</div>`
    + eraLine(f)
    + `<div class="chips" id="genre-chips">${chip("genre", "all", "All genres", f.genre === "all")}${chips.map((c) => chip("genre", c.genre, esc(c.genre), f.genre === c.genre)).join("")}</div>`
    + `<div class="browse-bar"><button id="surprise" class="surprise">${ICON_DICE}Surprise me</button></div>`
    + (rows || `<p class="empty">No films here yet. Try another era or genre.</p>`);
}

// A whole list as a three-across grid, with the sort switch; more posters arrive as you scroll.
function fullList(el) {
  const f = { ...shelf(), ...(grid.genre ? { genre: grid.genre } : {}) };
  const lists = shelfLists(films(), feed.stats, f);
  const sorts = ["rated", "popular", "crowd"].filter((k) => lists[k].length);
  if (!lists[grid.list]?.length) grid.list = "rated";
  const list = lists[grid.list];
  el.innerHTML = `<div class="grid-head"><button class="back" data-back>Back</button><h2>${esc(grid.genre || LISTS[grid.list])}</h2></div>`
    + `<div class="chips sorts">${sorts.map((k) => `<button data-sort="${k}"${k === grid.list ? ' class="on"' : ""}>${LISTS[k]}</button>`).join("")}</div>`
    + `<div id="grid" class="grid">${list.slice(0, grid.shown).map(tile).join("")}</div>`
    + (list.length > grid.shown ? `<div class="more-sentinel" aria-hidden="true"></div>` : "");
  const sentinel = $(".more-sentinel", el);
  if (sentinel && "IntersectionObserver" in window) {
    const io = new IntersectionObserver((es) => {
      if (!es.some((e) => e.isIntersecting)) return;
      io.disconnect();
      const from = grid.shown;
      grid.shown += GRID_STEP;
      $("#grid").insertAdjacentHTML("beforeend", list.slice(from, grid.shown).map(tile).join(""));
      if (list.length <= grid.shown) sentinel.remove(); else io.observe(sentinel);
    }, { rootMargin: "600px" });
    io.observe(sentinel);
  }
}

const SCREENS = {
  browse,
  search(el) { el.innerHTML = `<h2>Search</h2>`; },
  watchlist(el) { el.innerHTML = `<h2>Watchlist</h2>`; },
  settings(el) { el.innerHTML = `<h2>Settings</h2>`; },
};

function render() {
  SCREENS[tab]($("#view"));
  const inSheet = !!$(`#more [data-tab="${tab}"]`);
  $$("#tabs [data-tab]").forEach((b) => b.classList.toggle("active", b.dataset.tab === tab));
  $("#tabs [data-more]").classList.toggle("active", inSheet);
  $$("#more .tile[data-tab]").forEach((b) => b.classList.toggle("on", b.dataset.tab === tab));
  badge();
}

function go(t) {
  if (t === "browse" && tab === "browse") grid = null;   // tapping Browse again goes back to the shelves
  tab = t;
  closeMore();
  render();
  scrollTo(0, 0);
}

const persist = () => save(state);

function badge() {
  const n = Object.keys(state.want).length, b = $("#want-badge");
  b.hidden = !n;
  b.textContent = `${n} to watch`;
}

function toast(msg) {
  const t = $("#toast");
  t.textContent = msg;
  t.classList.add("on");
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => t.classList.remove("on"), 2600);
}

function applyTheme() {
  const theme = state.settings.theme;
  if (theme === "light" || theme === "dark") document.documentElement.dataset.theme = theme;
  else delete document.documentElement.dataset.theme;
}

// The film sheet arrives with the next task; for now opening a film just records which.
function openFilm(id) { document.body.dataset.opened = id; }

// ---------- sheets: More, and the film sheet (same slide, swipe and close) ----------
// They close on a destination, Escape, a tap above them, or a swipe down of more than 80px.
function setupSheet(sheet, onClose = () => {}) {
  sheet.addEventListener("click", (e) => { if (e.target === sheet) closeSheet(sheet, onClose); });   // the backdrop
  sheet.addEventListener("cancel", (e) => { e.preventDefault(); closeSheet(sheet, onClose); });     // Escape, with the slide
  let y0 = null;
  sheet.addEventListener("touchstart", (e) => { y0 = sheet.scrollTop <= 0 ? e.touches[0].clientY : null; }, { passive: true });
  sheet.addEventListener("touchmove", (e) => {
    if (y0 === null) return;
    const dy = Math.max(0, e.touches[0].clientY - y0);
    sheet.style.transform = dy ? `translateY(${dy}px)` : "";
  }, { passive: true });
  sheet.addEventListener("touchend", (e) => {
    if (y0 === null) return;
    const dy = e.changedTouches[0].clientY - y0; y0 = null;
    sheet.style.transform = "";
    if (dy > 80) closeSheet(sheet, onClose);
  });
}
function openSheet(sheet) { if (!sheet.open) { sheet.classList.remove("closing"); sheet.showModal(); } }
function closeSheet(sheet, onClose = () => {}) {
  if (!sheet?.open || sheet.classList.contains("closing")) return;
  const done = () => { sheet.close(); sheet.classList.remove("closing"); onClose(); };
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return done();
  sheet.classList.add("closing");
  setTimeout(done, 180);
}
const closeMore = () => closeSheet($("#more"));

// ---------- taps ----------
function setFilter(key, val) {
  state.settings[key] = val;
  persist();
  render();
}

document.addEventListener("click", (e) => {
  const el = e.target.closest("[data-tab],[data-more],[data-place],[data-era],[data-genre],[data-all],[data-sort],[data-back],[data-film],#surprise");
  if (!el || el.disabled) return;
  const d = el.dataset;
  if (d.more !== undefined) return openSheet($("#more"));
  if (d.tab) return go(d.tab);
  if (d.place) return setFilter("place", d.place);
  if (d.era) return setFilter("era", state.settings.era === d.era ? "all" : d.era);
  if (d.genre) return setFilter("genre", d.genre);
  if (d.all) {
    const genre = d.all.startsWith("genre:") ? d.all.slice(6) : null;
    grid = { list: genre ? "rated" : d.all === "now" ? "popular" : d.all, genre, shown: GRID_STEP };
    render(); scrollTo(0, 0); return;
  }
  if (d.sort) { grid.list = d.sort; grid.shown = GRID_STEP; return render(); }
  if (d.back !== undefined) { grid = null; return render(); }
  if (d.film) return openFilm(Number(d.film));
  if (el.id === "surprise") {
    const pick = surprise(films(), feed.stats, shelf(), seenSet());
    return pick ? openFilm(pick.id, { fromSurprise: true }) : toast("You've seen everything here");
  }
});

// ---------- start ----------
async function loadFeed() {
  try {
    const r = await fetch("./feed.json", { cache: "no-cache" });
    feed = r.ok ? await r.json() : null;
  } catch { feed = null; }
  if (feed && !Array.isArray(feed.films)) feed = null;
  if (feed) { ranks = rankMap(feed.films, feed.stats); byId = new Map(feed.films.map((f) => [f.id, f])); }
}

applyTheme();
setupSheet($("#more"));
render();
await loadFeed();
render();
if ("serviceWorker" in navigator) navigator.serviceWorker.register("../sw.js").catch(() => {});

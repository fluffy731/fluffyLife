// Films: the screens. Renders films/feed.json (built weekly on GitHub Actions by scripts/build-films.mjs) on the
// Metro line look (../metro.css, data-line="film"). The ranking logic is in model.js; what the phone keeps, store.js.
import { load, save } from "./store.js";

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
export const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
export const NO_FEED = "The film list arrives with the next update, once a TMDB key has been added to the repository.";

export const state = load();
export let feed = null;
let tab = "browse";

// ---------- screens (each fills the view) ----------
const SCREENS = {
  browse(el) {
    if (!feed) { el.innerHTML = `<p class="empty">${NO_FEED}</p>`; return; }
    el.innerHTML = `<h2>Browse</h2>`;
  },
  search(el) { el.innerHTML = `<h2>Search</h2>`; },
  watchlist(el) { el.innerHTML = `<h2>Watchlist</h2>`; },
  settings(el) { el.innerHTML = `<h2>Settings</h2>`; },
};

export function render() {
  SCREENS[tab]($("#view"));
  const inSheet = !!$(`#more [data-tab="${tab}"]`);
  $$("#tabs [data-tab]").forEach((b) => b.classList.toggle("active", b.dataset.tab === tab));
  $("#tabs [data-more]").classList.toggle("active", inSheet);
  $$("#more .tile[data-tab]").forEach((b) => b.classList.toggle("on", b.dataset.tab === tab));
  badge();
}

export function go(t) {
  tab = t;
  closeMore();
  render();
  scrollTo(0, 0);
}

export function persist() { save(state); }

function badge() {
  const n = Object.keys(state.want).length, b = $("#want-badge");
  b.hidden = !n;
  b.textContent = `${n} to watch`;
}

export function toast(msg) {
  const t = $("#toast");
  t.textContent = msg;
  t.classList.add("on");
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => t.classList.remove("on"), 2600);
}

export function applyTheme() {
  const theme = state.settings.theme;
  if (theme === "light" || theme === "dark") document.documentElement.dataset.theme = theme;
  else delete document.documentElement.dataset.theme;
}

// ---------- sheets: More, and the film sheet (same slide, swipe and close) ----------
// They close on a destination, Escape, a tap above them, or a swipe down of more than 80px.
export function setupSheet(sheet, onClose = () => {}) {
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
export function openSheet(sheet) { if (!sheet.open) { sheet.classList.remove("closing"); sheet.showModal(); } }
export function closeSheet(sheet, onClose = () => {}) {
  if (!sheet?.open || sheet.classList.contains("closing")) return;
  const done = () => { sheet.close(); sheet.classList.remove("closing"); onClose(); };
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return done();
  sheet.classList.add("closing");
  setTimeout(done, 180);
}
const closeMore = () => closeSheet($("#more"));

// ---------- taps ----------
document.addEventListener("click", (e) => {
  const el = e.target.closest("[data-tab],[data-more]");
  if (!el) return;
  if (el.dataset.more !== undefined) return openSheet($("#more"));
  if (el.dataset.tab) return go(el.dataset.tab);
});

// ---------- start ----------
async function loadFeed() {
  try {
    const r = await fetch("./feed.json", { cache: "no-cache" });
    feed = r.ok ? await r.json() : null;
  } catch { feed = null; }
  if (feed && !Array.isArray(feed.films)) feed = null;
}

applyTheme();
setupSheet($("#more"));
render();
await loadFeed();
render();
if ("serviceWorker" in navigator) navigator.serviceWorker.register("../sw.js").catch(() => {});

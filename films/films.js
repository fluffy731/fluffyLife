// Films: the screens. Renders films/feed.json (built weekly on GitHub Actions by scripts/build-films.mjs) on the
// Metro line look (../metro.css, data-line="film"). The ranking logic is in model.js; what the phone keeps, store.js.
import { PLACES, ERAS, NAMED_ERAS, shelfLists, genreChips, erasWithFilms, rankMap, surprise, moreLike, search, browseRows, peopleIndex, searchPeople, filmography, matchedBy, feedChange } from "./model.js";
import { load, save, toggleWant, toggleSeen, backupText, restore } from "./store.js";
import { nav } from "../lib/nav.js";

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const NO_FEED = "The film list arrives with the next update, once a TMDB key has been added to the repository.";
const LOADING = `<p class="empty">Loading films…</p>`;
const LISTS = { rated: "Best rated", popular: "Most popular", crowd: "Crowd-pleasers", now: "Popular right now" };
const GRID_STEP = 24;

const state = load();
let feed, ranks = new Map(), byId = new Map(), people = new Map();   // feed: undefined while loading, null when there is none
let fetchedAt = 0;          // when the feed was last fetched, so coming back to the app after an hour refreshes it
let person = null;          // the actor or director whose films the Search tab is showing (a TMDB id)
let tab = "browse";
let grid = null;            // { list: "rated"|"popular"|"crowd", genre: string|null, shown: number } while a full list is open

// ---------- helpers ----------
export const posterURL = (path, w = 185) => (path ? `https://image.tmdb.org/t/p/w${w}${path}` : null);
const shelf = () => ({ place: state.settings.place, era: state.settings.era, genre: state.settings.genre });
// The catalogue as Browse sees it: without Seen films when Settings says so.
const films = () => { const all = feed?.films || []; return state.settings.hideSeen ? all.filter((f) => !state.seen[f.id]) : all; };
const seenSet = () => new Set(Object.keys(state.seen).map(Number));
const isZh = (f) => f.lang === "zh" || f.lang === "cn";
const langOf = (f) => (isZh(f) ? (f.country === "CN" ? "zh-Hans" : "zh-Hant") : f.lang === "ko" ? "ko" : "en");
const ICON_DICE = `<svg class="ic-btn" viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="8" width="10" height="10" rx="2.2"/><rect x="10.5" y="4" width="10" height="10" rx="2.2" fill="var(--surface)"/><circle cx="6.6" cy="11.1" r="1" class="pip"/><circle cx="10.4" cy="14.9" r="1" class="pip"/><circle cx="13.6" cy="7.1" r="1" class="pip"/><circle cx="15.5" cy="9" r="1" class="pip"/><circle cx="17.4" cy="10.9" r="1" class="pip"/></svg>`;

// A poster tile: the poster (or its title when there's none or it won't load), both titles, the year and rating.
export function tile(f) {
  const marks = (state.seen[f.id] ? `<i class="mark seen" title="Seen"></i>` : "") + (state.want[f.id] ? `<i class="mark want" title="On your watchlist"></i>` : "");
  const img = f.poster ? `<img loading="lazy" alt="" src="${esc(posterURL(f.poster))}" onerror="this.remove()">` : "";
  const en = f.title && f.title !== f.original ? `<span class="t-en">${esc(f.title)}</span>` : "";
  return `<button class="film" data-film="${esc(f.id)}"><span class="poster"><span class="ph" lang="${langOf(f)}">${esc(f.original)}</span>${img}${marks}</span>`
    + `<b class="t-orig${isZh(f) ? " zh-t" : ""}" lang="${langOf(f)}">${esc(f.original)}</b>${en}`
    + `<span class="meta">${esc(f.year)} <i class="star" aria-hidden="true"></i>${(f.rating || 0).toFixed(1)}</span></button>`;
}

const chip = (attr, val, label, on) => `<button data-${attr}="${esc(val)}"${on ? ' class="on"' : ""}>${label}</button>`;

function eraLine(f) {
  const live = erasWithFilms(films(), f), named = NAMED_ERAS[f.place] || {};
  return `<div class="era-line" role="group" aria-label="Era">${ERAS.map((e) => {
    const label = named[e.id];
    const cls = ["stop", f.era === e.id ? "on" : "", label ? "interchange" : ""].filter(Boolean).join(" ");
    return `<button class="${cls}" data-era="${e.id}"${live.has(e.id) || f.era === e.id ? "" : " disabled"} aria-pressed="${f.era === e.id}"><i></i><b>${e.name}</b>${label ? `<small>${esc(label)}</small>` : ""}</button>`;
  }).join("")}</div>`;
}

function row(key, title, list) {
  if (!list.length) return "";
  return `<section class="row-list" data-list="${esc(key)}"><div class="row-head"><h2>${esc(title)}</h2><button class="all" data-all="${esc(key)}">All</button></div>`
    + `<div class="posters">${list.slice(0, 20).map(tile).join("")}</div></section>`;
}

// ---------- screens (each fills the view) ----------
function browse(el) {
  if (feed === undefined) { el.innerHTML = LOADING; return; }
  if (!feed) { el.innerHTML = `<p class="empty">${NO_FEED}</p>`; return; }
  if (grid) return fullList(el);
  const f = shelf(), all = films();
  const chips = genreChips(all, f);
  if (f.genre !== "all" && !chips.some((c) => c.genre === f.genre)) chips.unshift({ genre: f.genre, count: 0 });
  // Each film shows in one row only (model.js browseRows); All opens the full list.
  const rows = browseRows(all, feed.stats, f).map((r) => row(r.key, LISTS[r.key] || r.key.slice(6), r.list)).join("");
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
    + (list.length ? `<div id="grid" class="grid">${list.slice(0, grid.shown).map(tile).join("")}</div>` : `<div id="grid" class="grid"></div><p class="empty">No films here yet. Try another era or genre, or turn off Hide films I've seen.</p>`)
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

// A list row (search results, the watchlist): a small poster, both titles, the year and place. Works from a
// catalogue film or a stored snapshot.
function rowItem(f, why = null) {
  const place = PLACES.find((p) => p.id === f.places?.[0]);
  const zh = /[㐀-鿿]/.test(f.original || "");
  const img = f.poster ? `<img loading="lazy" alt="" src="${esc(posterURL(f.poster))}" onerror="this.remove()">` : "";
  const en = f.title && f.title !== f.original ? `${esc(f.title)} · ` : "";
  return `<button class="item film-row" data-film="${esc(f.id)}"><span class="poster mini">${img}</span>`
    + `<span class="row-t"><b class="${zh ? "zh-t" : ""}">${esc(f.original || f.title)}</b><span class="meta">${en}${esc(f.year || "")}${place ? ` · ${place.name}` : ""}</span>`
    + (why ? `<span class="meta why">${esc(why.role)} ${esc(why.name)}</span>` : "") + `</span></button>`;
}

let query = "", queryTimer = 0;
const initials = (name) => (name.match(/[\p{L}\p{N}]+/gu) || []).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
const personRow = (p) => `<button class="item person-row" data-person="${esc(p.id)}"><span class="avatar" aria-hidden="true">${esc(initials(p.name))}</span>`
  + `<span class="row-t"><b>${esc(p.name)}</b><span class="meta">${esc(p.role)} · ${p.count} ${p.count === 1 ? "film" : "films"}</span></span></button>`;

function searchScreen(el) {
  if (person !== null) return personScreen(el);
  el.innerHTML = `<h2>Search</h2><input type="search" id="q" placeholder="Title, actor or director" autocomplete="off" autocapitalize="off" enterkeyhint="search" value="${esc(query)}">`
    + `<div class="list results" id="results"></div>`;
  const q = $("#q", el);
  q.addEventListener("input", () => { clearTimeout(queryTimer); queryTimer = setTimeout(() => { query = q.value; showResults(); }, 120); });
  showResults();
}
function showResults() {
  const box = $("#results");
  if (!box) return;
  if (feed === undefined) { box.innerHTML = LOADING; return; }
  if (!feed) { box.innerHTML = `<p class="empty">${NO_FEED}</p>`; return; }
  const who = searchPeople(people, query, 6);
  const hits = search(feed.films, query);   // search finds Seen films too, whatever Hide seen says
  if (!who.length && !hits.length) { box.innerHTML = query.trim() ? `<p class="empty">No films or people match. The list holds the best-rated and most-rated films of each place and decade.</p>` : ""; return; }
  box.innerHTML = (who.length ? `<h3 class="sub-h">People</h3>${who.map(personRow).join("")}` : "")
    + (hits.length ? (who.length ? `<h3 class="sub-h">Films</h3>` : "") + hits.map((f) => rowItem(f, matchedBy(f, query))).join("") : "");
}

// One person's films, best known first. Back returns to the search they came from.
function personScreen(el) {
  const p = filmography(people, person);
  if (!p) { el.innerHTML = `<div class="grid-head"><button class="back" data-back-person>Back</button></div><p class="empty">${feed ? "That person isn't in this week's list." : "The film list isn't loaded right now."}</p>`; return; }
  el.innerHTML = `<div class="grid-head"><button class="back" data-back-person>Back</button></div>`
    + `<div class="person-head"><h2>${esc(p.name)}</h2></div><p class="person-sub">${esc(p.role)} · ${p.films.length} ${p.films.length === 1 ? "film" : "films"} in the list</p>`
    + `<div class="list results">${p.films.map((f) => rowItem(f)).join("")}</div>`;
}

function watchlistScreen(el) {
  const newest = (o) => Object.values(o).sort((a, b) => String(b.at || "").localeCompare(String(a.at || "")));
  const section = (title, entries) => `<h2>${title}</h2>` + (entries.length ? `<div class="list">${entries.map(rowItem).join("")}</div>` : `<p class="empty">Nothing here yet</p>`);
  el.innerHTML = section("Want to watch", newest(state.want)) + section("Seen", newest(state.seen));
}

const SCREENS = {
  browse,
  search: searchScreen,
  watchlist: watchlistScreen,
  settings: settingsScreen,
};

function render() {
  SCREENS[tab]($("#view"));
  const inSheet = !!$(`#more [data-tab="${tab}"]`);
  $$("#tabs [data-tab]").forEach((b) => b.classList.toggle("active", b.dataset.tab === tab));
  $("#tabs [data-more]").classList.toggle("active", inSheet);
  $$("#more .tile[data-tab]").forEach((b) => b.classList.toggle("on", b.dataset.tab === tab));
  badge();
  syncLevels();
}

// A full list and a person's page are drill-in screens: Back, or a swipe from the left edge, returns from them, as on an
// iPhone (lib/nav.js). They only count while on screen: change tab and the list is no longer something to go back from.
function syncLevels() {
  if (tab === "browse" && grid) nav.push("grid", () => { grid = null; render(); }); else nav.release("grid");
  if (tab === "search" && person !== null) nav.push("person", () => { person = null; render(); }); else nav.release("person");
}

function go(t) {
  if (t === "browse" && tab === "browse") grid = null;   // tapping Browse again goes back to the shelves
  if (t === "search" && tab === "search") person = null;  // and Search again, back to the search
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

const THEME_NAMES = { auto: "Phone", light: "Light", dark: "Dark" };
function settingsScreen(el) {
  const built = feed ? new Date(feed.built).toLocaleDateString("en-AU", { day: "numeric", month: "long", timeZone: "Australia/Melbourne" }) : "";
  el.innerHTML = `<h2>Settings</h2><div class="list">`
    + `<button class="btn theme-btn" data-theme>Theme: ${THEME_NAMES[state.settings.theme] || "Phone"}</button>`
    + `<label class="item check-row"><input type="checkbox" id="hide-seen"${state.settings.hideSeen ? " checked" : ""}><span>Hide films I've seen<small>From the shelves, the lists and Surprise me</small></span></label></div>`
    + `<h2>Your watchlist</h2><div class="actions"><button class="btn" data-act="backup">Back up</button><button class="btn" data-act="restore">Restore</button></div>`
    + `<p class="note">Your watchlist and Seen list stay on this phone. Back them up now and then: iPhone can clear a website's storage, and the file moves them to a new phone.</p>`
    + `<h2>About the films</h2>`
    + `<p class="note">${feed ? `Catalogue built ${built} · ${fmt(feed.films.length)} films` : feed === undefined ? "Loading films…" : NO_FEED}</p>`
    + `<p class="note">The best-rated and most-rated Hong Kong, Chinese, Korean and English-language films of each decade on TMDB, rebuilt every week. Best rated weighs each film's rating by how many people rated it; Most popular is how many people rated it; Crowd-pleasers are popular films rated below their shelf's middle. Every list is ranked within its place, so Hollywood never buries the rest. Mainland audiences mostly rate on Douban, so Chinese numbers are a rough guide.</p>`
    + `<div class="tmdb-credit"><img src="./tmdb.svg" alt="TMDB" onerror="this.remove()"><p>This product uses the TMDB API but is not endorsed or certified by TMDB.</p></div>`;
}

// Back up: the share sheet (Save to Files) on iPhone, where a download from a home-screen app is unreliable.
function backup() {
  const name = `films-backup-${new Date().toISOString().slice(0, 10)}.json`;
  const file = new File([backupText(state)], name, { type: "application/json" });
  if (navigator.canShare?.({ files: [file] })) { navigator.share({ files: [file], title: name }).catch(() => {}); return; }
  const a = Object.assign(document.createElement("a"), { href: URL.createObjectURL(file), download: name });
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 30000);
}

$("#file").addEventListener("change", async (e) => {
  const file = e.target.files?.[0];
  e.target.value = "";
  if (!file) return;
  try {
    const { added } = restore(state, await file.text());
    persist();
    render();
    toast(added === 1 ? "Added 1 film" : `Added ${added} films`);
  } catch (err) { toast(err.message); }
});

document.addEventListener("change", (e) => {
  if (e.target.id !== "hide-seen") return;
  state.settings.hideSeen = e.target.checked;
  persist();
});

// Surprise me and Another suggest each film once per visit: they work through the whole shelf (Seen films never)
// before starting again, and a fresh start never begins with the film on screen.
const suggested = new Set();
function suggest(current = null) {
  const skip = (extra) => new Set([...seenSet(), ...extra, ...(current ? [current] : [])]);
  let pick = surprise(films(), feed.stats, shelf(), skip(suggested));
  if (!pick && suggested.size) { suggested.clear(); pick = surprise(films(), feed.stats, shelf(), skip([])); }
  if (pick) suggested.add(pick.id);
  return pick;
}

// ---------- the film sheet ----------
// The titles stack on a station sign, as a trilingual Seoul station sign stacks 한글, 漢字 and English; the line's
// rule draws across and the details rise in beneath it.
const fmt = (n) => Number(n || 0).toLocaleString("en-AU");
const placeLine = (f) => f.places.map((p) => {
  const place = PLACES.find((x) => x.id === p);
  return p === "CN" && f.country === "TW" ? "Taiwan" : p === "CN" && f.country === "CN" ? "Mainland China" : place?.name;
}).filter(Boolean).join(" · ");

function sheetHTML(f, gone, fromSurprise) {
  const zh = isZh(f) || /[㐀-鿿]/.test(f.original || ""), ko = f.lang === "ko" || /[가-힣]/.test(f.original || "");
  const original = zh && !ko ? `<b class="hanja zh" lang="${langOf(f)}">${esc(f.original)}</b>` : `<b class="k"${ko ? ' lang="ko"' : ""}>${esc(f.original || f.title)}</b>`;
  const en = f.title && f.title !== f.original ? `<span class="en-t">${esc(f.title)}</span>` : "";
  const img = f.poster ? `<img alt="" src="${esc(posterURL(f.poster, 342))}" onerror="this.remove()">` : "";
  const meta = [f.year, placeLine(f), f.runtime ? `${f.runtime} min` : "", (f.genres || []).join(", ")].filter(Boolean).join(" · ");
  const r = !gone && ranks.get(f.id)?.[f.places[0]];
  const where = PLACES.find((p) => p.id === f.places[0])?.name;
  const rankLine = r ? `<p class="ranks">#${r.popular} most popular among ${esc(where)} films · #${r.rated} best rated</p>` : "";
  const rating = !gone ? `<p class="sign-rate"><i class="star" aria-hidden="true"></i>${(f.rating || 0).toFixed(1)} · ${fmt(f.votes)} ratings</p>` : "";
  const who = (c) => `<button class="who" type="button" data-person="${esc(c.id)}">${esc(c.name)}</button>`;
  const crew = [f.director ? `Directed by ${who(f.director)}` : "", f.cast?.length ? `With ${f.cast.map(who).join(", ")}` : ""].filter(Boolean);
  const want = !!state.want[f.id], seen = !!state.seen[f.id];
  const douban = f.places.some((p) => p === "HK" || p === "CN") ? `<a class="douban" href="https://search.douban.com/movie/subject_search?search_text=${encodeURIComponent(f.original || f.title)}" target="_blank" rel="noopener">Douban</a>` : "";
  const like = gone ? [] : moreLike(f, films());
  return `<div class="sheet-grab" aria-hidden="true"></div><div class="sheet-body">`
    + `<div class="card flash film-sign"><div class="sign-top"><span class="poster big"><span class="ph" lang="${langOf(f)}">${esc(f.original || f.title)}</span>${img}</span>`
    + `<div class="titles">${original}${en}</div></div><div class="rule"></div>`
    + `<p class="sign-meta">${esc(meta)}</p>${rating}${rankLine}`
    + (crew.length ? `<p class="people">${crew.join("<br>")}</p>` : "")
    + (f.plot ? `<p class="plot">${esc(f.plot)}</p>` : "")
    + (gone ? `<p class="gone">${feed ? "No longer in this week's list" : "Saved on this phone. The film list isn't loaded right now."}</p>` : "") + `</div>`
    + `<div class="actions film-actions"><button class="btn${want ? "" : " primary"}" data-act="want" aria-pressed="${want}">${want ? "On your watchlist" : "Want to watch"}</button>`
    + `<button class="btn" data-act="seen" aria-pressed="${seen}">${seen ? "Seen" : "Seen it"}</button></div>`
    + (fromSurprise ? `<button class="surprise another" data-act="another">${ICON_DICE}Another</button>` : "")
    + `<p class="links">${f.trailer ? `<a class="trailer" href="https://www.youtube.com/watch?v=${encodeURIComponent(f.trailer)}" target="_blank" rel="noopener">Trailer</a>` : ""}`
    + `<a class="tmdb" href="https://www.themoviedb.org/movie/${encodeURIComponent(f.id)}" target="_blank" rel="noopener">TMDB page</a>${douban}</p>`
    + (like.length ? `<h2>More like this</h2><div class="posters more-like">${like.map(tile).join("")}</div>` : "")
    + `</div>`;
}

function openFilm(id, { fromSurprise = false } = {}) {
  const f = byId.get(id) || state.want[id] || state.seen[id];
  if (!f) return;
  const sheet = $("#film");
  sheet.dataset.id = id;
  sheet.dataset.surprise = fromSurprise ? "1" : "";
  sheet.innerHTML = sheetHTML({ places: [], genres: [], cast: [], ...f }, !byId.has(id), fromSurprise);
  openSheet(sheet);
  sheet.scrollTop = 0;
}

function sheetAct(act) {
  const sheet = $("#film"), id = Number(sheet.dataset.id);
  const f = byId.get(id) || state.want[id] || state.seen[id];
  if (!f) return;
  const at = new Date().toISOString();
  if (act === "want") toggleWant(state, f, at);
  if (act === "seen") toggleSeen(state, f, at);
  if (act === "another") {
    const pick = suggest(id);
    return pick ? openFilm(pick.id, { fromSurprise: true }) : toast("No other films here you haven't seen");
  }
  persist();
  openFilm(id, { fromSurprise: sheet.dataset.surprise === "1" });
  render();
}

// ---------- sheets: More, and the film sheet (same slide, swipe and close) ----------
// They close on a destination, Escape, a tap above them, Back or a swipe from the left edge, or a swipe down of more
// than 80px. Back, the edge swipe and the swipe down are lib/nav.js's, each going through the same slide.
function setupSheet(sheet, onClose = () => {}) {
  sheet.addEventListener("click", (e) => { if (e.target === sheet) closeSheet(sheet, onClose); });   // the backdrop
  sheet.addEventListener("cancel", (e) => { e.preventDefault(); closeSheet(sheet, onClose); });     // Escape, with the slide
  nav.watchDialog(sheet, { close: () => closeSheet(sheet, onClose), swipeDown: true });
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
  const el = e.target.closest("[data-tab],[data-more],[data-place],[data-era],[data-genre],[data-all],[data-sort],[data-back],[data-film],[data-person],[data-back-person],[data-act],button[data-theme],#surprise,#refresh");
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
  if (d.person !== undefined) {
    if (el.closest("#film")) closeSheet($("#film"));
    go("search");               // (go resets the person when Search is tapped again, so set it after)
    person = Number(d.person);
    return render();
  }
  if (d.backPerson !== undefined) { person = null; return render(); }
  if (el.id === "refresh") return refresh();
  if (d.film) return openFilm(Number(d.film));
  if (d.act && el.closest("#film")) return sheetAct(d.act);
  if (d.act === "backup") { closeMore(); return backup(); }
  if (d.act === "restore") return $("#file").click();
  if (el.matches("button[data-theme]")) {
    const order = ["auto", "light", "dark"];
    state.settings.theme = order[(order.indexOf(state.settings.theme) + 1) % 3];
    persist(); applyTheme(); return render();
  }
  if (el.id === "surprise") {
    const pick = suggest();
    return pick ? openFilm(pick.id, { fromSurprise: true }) : toast("You've seen everything here");
  }
});

// ---------- the feed, and refreshing it ----------
async function fetchFeed() {
  try {
    const r = await fetch("./feed.json", { cache: "no-cache" });
    const f = r.ok ? await r.json() : null;
    return f && Array.isArray(f.films) ? f : null;
  } catch { return null; }
}
function setFeed(f) {
  feed = f;
  fetchedAt = Date.now();
  if (feed) {
    ranks = rankMap(feed.films, feed.stats);
    byId = new Map(feed.films.map((x) => [x.id, x]));
    people = peopleIndex(feed.films);
  }
}

// Refresh fetches the list again, without closing the app. The list is rebuilt weekly, so most taps find nothing new:
// it says so. A failed fetch (offline) keeps the list you have.
let refreshing = false;
async function refresh({ quiet = false } = {}) {
  if (refreshing) return;
  refreshing = true;
  const btn = $("#refresh");
  btn.classList.add("spin"); btn.disabled = true;
  const [next] = await Promise.all([fetchFeed(), new Promise((r) => setTimeout(r, quiet ? 0 : 500))]);   // a beat, so the turn is seen
  const change = feedChange(feed, next);
  if (change === "updated") { setFeed(next); suggested.clear(); render(); }
  else if (change === "same") fetchedAt = Date.now();
  btn.classList.remove("spin"); btn.disabled = false;
  refreshing = false;
  if (quiet) return;
  toast(change === "updated" ? `Updated · ${fmt(feed.films.length)} films`
    : change === "same" ? `Already up to date · built ${new Date(feed.built).toLocaleDateString("en-AU", { day: "numeric", month: "long", timeZone: "Australia/Melbourne" })}`
    : "Couldn't refresh. Check your connection.");
}
// Coming back to the app after an hour away: look for a newer list, quietly (a phone app can sit in the background for days).
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible" && feed && Date.now() - fetchedAt > 60 * 60e3 && !$("#film").open) refresh({ quiet: true });
});

// ---------- start ----------
applyTheme();
setupSheet($("#more"));
setupSheet($("#film"));
nav.installEdgeSwipe();
nav.pullToRefresh(window, () => refresh());
nav.onTabReselect($("#tabs"), "button[data-tab]");
render();
setFeed(await fetchFeed());
render();
if ("serviceWorker" in navigator) navigator.serviceWorker.register("../sw.js").catch(() => {});

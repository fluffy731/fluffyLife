// Explore: the three modes (Now, Late night, Tomorrow), results and the place sheet.
import {
  KINDS, kindOf, reachKm, driveBudget, pickNow, lateStart, pickLate, DAY_SLOTS, buildDayPlan, tomorrow,
  travelMinutes, haversineKm, fmtMinutes, hoursLabel, minutesLeft, dayHours, priceSymbols, priceRangeLabel, mapsUrl,
  savePlace, unsave, isSaved, noteRegion, visitFor, whyEmpty, swapStop, NEAR, nearRange, rangeKm, pickNear, upcomingEvents,
  queriesOf, openLeft, daySlots, CUISINES, cuisineLabel, DISTANCES, kmFromStep, stepFromKm, fmtKm, distanceHint,
} from "./model.js";
import { iso, weatherOn, weatherState, skyIcon } from "./today.js";
import { REGIONS, surpriseRegion } from "./regions.js";
import { $, EMOJI, esc, fmtCount, toast, openSheet, closeSheet, sheetBar } from "./ui.js";

const MINUTES = [[60, "1 h"], [120, "2 h"], [180, "3 h"], [240, "Half day"]];
const PRICES = [["any", "Any"], ["1", "$"], ["2", "$$"], ["3", "$$$"], ["4", "$$$$"]];
const LATE_QUERY = { eat: "late night food", drink: "late night bar", coffee: "late night cafe", dessert: "late night dessert",
  sights: "night lookout", activities: "late night entertainment" };
const MAX_PHOTOS = 8;
const EMPTY = {
  none: "Nothing came back for this search. Try another kind.",
  closed: "Everything we found is closed now. Try Late night, or plan Tomorrow.",
  budget: "Nothing open fits that budget. Try a bigger budget.",
  far: "Nothing open close enough for the time you have. Try more time.",
  farWalk: "Nothing open close enough on foot. Try more time, or Drive.",
  late: "Nothing open late within these limits. Try a longer night drive, a bigger budget or another kind.",
  distance: "Nothing open within that distance. Slide it further, or pick more time.",
  cuisine: "None of that cuisine came back nearby. Try another cuisine, or Any.",
};

const chip = (attr, val, label, on) => `<button class="chip" type="button" ${attr}="${esc(val)}" aria-pressed="${on}">${label}</button>`;
// Late night leaves out the daytime kinds (Nature, Beach).
const kindChips = (set, { late = false } = {}) => `<div class="chips kinds">${KINDS.filter((k) => !late || !k.day).map((k) => `<button class="chip" type="button" data-kind="${k.id}" aria-pressed="${set.has(k.id)}">${EMOJI[k.id]} ${k.label}</button>`).join("")}</div>`;
const fmtN = (n) => n.toLocaleString("en-AU");
// Places to look around: today's and coming saved events, then saved places.
function nearPicks(app) {
  const today = new Date(), iso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  const evs = upcomingEvents(app.state, iso).filter((x) => x.venue || x.area).slice(0, 3)
    .map((x) => ({ key: `e:${x.id}`, label: x.venue || x.area, q: [x.venue, x.address || x.area].filter(Boolean).join(", ") }));
  const places = app.state.saved.filter((x) => Number.isFinite(x.lat)).slice(0, 4)
    .map((x) => ({ key: `p:${x.id}`, label: x.name, q: x.name, target: { name: x.name, lat: x.lat, lng: x.lng, area: x.area } }));
  return [...evs, ...places];
}
// Cuisine only changes Eat: shown when Eat is chosen, and for Tomorrow's lunch and dinner.
const showCuisine = (u) => (u.mode === "tomorrow" ? true : (u.mode === "late" ? u.lateKinds : u.mode === "near" ? u.near.kinds : u.kinds).has("eat"));
const cuisineRow = (u) => `<p class="label">Cuisine${u.mode === "tomorrow" ? " <small>for lunch and dinner</small>" : ""}</p>
  <div class="chips scroll cuisines">${chip("data-cuisine", "any", "Any", !u.cuisines.size)}${CUISINES.map((c) => chip("data-cuisine", c.id, c.label, u.cuisines.has(c.id))).join("")}</div>`;

// A distance slider: steps from 500 m to 50 km (and Any, where time is the limit). `id` says what it sets.
// The value and the hint under it are rewritten as it moves (distanceText), without redrawing the controls.
const distanceRow = (id, label, km, { any = false, hint = "" } = {}) => `
  <p class="label"><label for="dist-${id}">${label}</label> <b class="dist-val" id="dist-${id}-val">${km == null ? "Any distance" : fmtKm(km)}</b></p>
  <input class="dist" id="dist-${id}" data-dist="${id}" type="range" min="0" max="${DISTANCES.length - (any ? 0 : 1)}" step="1" value="${stepFromKm(km, any)}"
    aria-valuetext="${km == null ? "Any distance" : fmtKm(km)}">
  <p class="hint" id="dist-${id}-hint">${esc(hint)}</p>`;
// The hint for a distance: how long it is to get there, and when your time is the tighter limit, what it reaches.
function distanceText(u, id, km, now = new Date()) {
  if (km == null) return id === "late" ? `The night drive of ${u.late} min reaches about ${Math.round(reachKm(u.late, { at: lateStart(now).at }))} km.` : "Only your time limits how far.";
  const base = distanceHint(km, { at: now });
  const limit = id === "now" ? reachKm(driveBudget(u.minutes, Math.min(...[...u.kinds].map((k) => visitFor(k, u.minutes)))), { mode: u.travel, at: now })
    : id === "late" ? reachKm(u.late, { at: lateStart(now).at }) : Infinity;
  return Number.isFinite(limit) && km > limit ? `${base}. ${id === "late" ? "Your night drive" : "Your time"} limits this to about ${fmtKm(Math.max(0.5, Math.round(limit * 2) / 2))}.` : base;
}
const budget = (u) => `<p class="label">Budget</p><div class="chips">${PRICES.map(([v, l]) => chip("data-price", v, l, String(u.price ?? "any") === v)).join("")}</div>`;

function controls(u, app) {
  if (u.mode === "near") {
    const n = u.near, picks = app ? nearPicks(app) : [];
    return `
    <p class="label"><label for="near-q">Going to</label></p>
    <input id="near-q" class="near-q" type="search" enterkeyhint="search" autocomplete="off" placeholder="A venue, address or suburb" value="${esc(n.q)}">
    ${picks.length ? `<div class="chips scroll" style="margin-top:8px">${picks.map((x) => chip("data-nearpick", x.key, esc(x.label), n.q === x.q)).join("")}</div>` : ""}
    <p class="label">Within</p><div class="chips">${NEAR.ranges.map((r) => chip("data-nrange", r.id, `<span aria-label="${r.label}">${r.short}</span>`, n.range === r.id)).join("")}</div>
    ${distanceRow("near", "Or choose a distance", rangeKm(nearRange(n.range)), { hint: distanceText(u, "near", rangeKm(nearRange(n.range))) })}
    <p class="label">Rated</p><div class="chips">${NEAR.ratings.map((r) => chip("data-nrate", r, `★ ${r}+`, n.minRating === r)).join("")}</div>
    <p class="label">Reviews</p><div class="chips">${NEAR.reviews.map((r) => chip("data-nrev", r, `${fmtN(r)}+`, n.minReviews === r)).join("")}</div>
    <p class="label">What</p>${kindChips(n.kinds)}
    ${showCuisine(u) ? cuisineRow(u) : ""}
    ${budget(u)}
    <p class="hint">Google gives each place its average rating and its number of reviews, so this means an average of ★ ${n.minRating} or more from at least ${fmtN(n.minReviews)} people.</p>`;
  }
  if (u.mode === "now") return `
    <p class="label">Time I have</p><div class="chips">${MINUTES.map(([m, l]) => chip("data-min", m, l, u.minutes === m)).join("")}</div>
    <p class="label">Getting there</p><div class="chips">${chip("data-travel", "drive", "🚗 Drive", u.travel === "drive")}${chip("data-travel", "walk", "🚶 Walk", u.travel === "walk")}</div>
    ${distanceRow("now", "How far", u.maxKm, { any: true, hint: distanceText(u, "now", u.maxKm) })}
    <p class="label">What</p>${kindChips(u.kinds)}
    ${showCuisine(u) ? cuisineRow(u) : ""}
    ${budget(u)}`;
  if (u.mode === "late") {
    const { at } = lateStart(new Date());
    return `
    <p class="label">Night drive</p><div class="chips">${[15, 30, 45].map((m) => chip("data-late", m, `${m} min`, u.late === m)).join("")}</div>
    <p class="hint">The roads are clear at night: ${u.late} min reaches about ${Math.round(reachKm(u.late, { at }))} km.</p>
    ${distanceRow("late", "How far", u.maxKm, { any: true, hint: distanceText(u, "late", u.maxKm, at) })}
    <p class="label">What</p>${kindChips(u.lateKinds, { late: true })}
    ${showCuisine(u) ? cuisineRow(u) : ""}
    ${budget(u)}`;
  }
  const region = REGIONS.find((r) => r.id === u.where);
  return `
    <p class="label">Where</p>
    <div class="chips scroll">${chip("data-where", "town", "Around town", u.where === "town")}${chip("data-where", "surprise", "🎲 Surprise me", u.where === "surprise")}${REGIONS.map((r) => chip("data-where", r.id, esc(r.name), u.where === r.id)).join("")}</div>
    <p class="hint" id="where-hint">${region ? esc(region.blurb) : u.where === "surprise" ? "A day-trip region you haven't been to lately." : `Places within about ${fmtKm(u.townKm)} of you.`}</p>
    ${u.where === "town" ? distanceRow("town", "How far around town", u.townKm, { hint: distanceHint(u.townKm) }) : ""}
    <p class="label">Start</p><div class="chips">${[["08:00", "8 am"], ["09:00", "9 am"], ["10:00", "10 am"]].map(([v, l]) => chip("data-start", v, l, u.start === v)).join("")}</div>
    <p class="label">Pace</p><div class="chips">${chip("data-pace", "relaxed", "Relaxed · 4 stops", u.pace === "relaxed")}${chip("data-pace", "full", "Full day · 5 stops", u.pace === "full")}</div>
    ${cuisineRow(u)}
    ${budget(u)}`;
}

const modeBtn = (u, id, label, sub) => `<button class="mode" type="button" id="mode-${id}" data-mode="${id}" aria-pressed="${u.mode === id}">${label}<small>${sub}</small></button>`;
const findLabel = (u) => (u.mode === "tomorrow" ? "Plan my day" : u.mode === "near" ? "Find top-rated places" : "Find places");

export function renderExplore(app) {
  const s = app.state.settings, u = app.ui, ready = s.sample || !!s.key;
  const v = $("#v-explore");
  v.innerHTML = `
    <h2 class="title">Where to?</h2>
    ${ready ? "" : `<div class="card setup">
      <h3>Connect Google for real places</h3>
      <p>Photos, prices, reviews and opening hours come from Google Places with your own key; Google's free monthly allowance covers a few searches a day. Or look around with sample places first.</p>
      <div class="row"><button class="btn primary" type="button" id="setup-google">Set up Google</button><button class="btn" type="button" id="setup-sample">Try with sample places</button></div>
    </div>`}
    <div${ready ? "" : " hidden"}>
      <div class="modes" role="group" aria-label="Mode">${modeBtn(u, "now", "Now", "short on time")}${modeBtn(u, "late", "Late night", "still open")}${modeBtn(u, "tomorrow", "Tomorrow", "full day")}${modeBtn(u, "near", "Near", "top-rated")}</div>
      <div id="controls">${controls(u, app)}</div>
      <button class="btn primary find" type="button" id="find">${findLabel(u)}</button>
      <p class="where-note" id="where-note">${app.pos ? (app.pos.fallback ? "Using Melbourne CBD (location is off)" : "Near you") : ""}</p>
    </div>
    <div class="results" id="results"></div>`;
  if (!v.dataset.bound) {
    v.addEventListener("click", (e) => onClick(app, e));
    v.addEventListener("input", (e) => {
      if (e.target.id === "near-q") { app.ui.near.q = e.target.value; app.ui.near.target = null; }
      if (e.target.dataset && e.target.dataset.dist) onDistance(app, e.target);
    });
    v.addEventListener("keydown", (e) => { if (e.target.id === "near-q" && e.key === "Enter") { e.preventDefault(); e.target.blur(); find(app); } });
    v.dataset.bound = "1";
  }
  renderResults(app);
}

// The slider moved: keep the choice, and rewrite the number and the hint under it without redrawing the controls
// (which would drop the slider mid-drag).
function onDistance(app, el) {
  const u = app.ui, id = el.dataset.dist, km = kmFromStep(+el.value, id === "now" || id === "late");
  if (id === "near") { u.near.range = `km:${km}`; document.querySelectorAll("#v-explore [data-nrange]").forEach((b) => b.setAttribute("aria-pressed", "false")); }
  else if (id === "town") u.townKm = km;
  else u.maxKm = km;
  const text = km == null ? "Any distance" : fmtKm(km);
  $(`#dist-${id}-val`).textContent = text;
  el.setAttribute("aria-valuetext", text);
  $(`#dist-${id}-hint`).textContent = id === "town" ? distanceHint(km) : id === "near" ? distanceText(u, id, km) : distanceText(u, id, km, id === "late" ? lateStart(new Date()).at : new Date());
  if (id === "town") $("#where-hint").textContent = `Places within about ${fmtKm(km)} of you.`;
}

function refreshControls(app) {
  $("#controls").innerHTML = controls(app.ui, app);
  document.querySelectorAll("#v-explore .mode").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.mode === app.ui.mode)));
  $("#find").textContent = findLabel(app.ui);
}

async function onClick(app, e) {
  const t = e.target, u = app.ui, d = (sel) => t.closest(sel);
  if (d("#setup-google")) return app.show("settings");
  if (d("#setup-sample")) { app.state.settings.sample = true; app.persist(); return renderExplore(app); }
  if (d("[data-mode]")) { u.mode = d("[data-mode]").dataset.mode; return refreshControls(app); }
  if (d("[data-min]")) { u.minutes = +d("[data-min]").dataset.min; return refreshControls(app); }
  if (d("[data-travel]")) { u.travel = d("[data-travel]").dataset.travel; return refreshControls(app); }
  if (d("[data-late]")) { u.late = +d("[data-late]").dataset.late; return refreshControls(app); }
  if (d("[data-where]")) { u.where = d("[data-where]").dataset.where; return refreshControls(app); }
  if (d("[data-start]")) { u.start = d("[data-start]").dataset.start; return refreshControls(app); }
  if (d("[data-pace]")) { u.pace = d("[data-pace]").dataset.pace; return refreshControls(app); }
  if (d("[data-price]")) { const v = d("[data-price]").dataset.price; u.price = v === "any" ? null : +v; return refreshControls(app); }
  if (d("[data-cuisine]")) {
    const c = d("[data-cuisine]").dataset.cuisine;
    if (c === "any") u.cuisines.clear(); else if (u.cuisines.has(c)) u.cuisines.delete(c); else u.cuisines.add(c);
    return refreshControls(app);
  }
  if (d("[data-nrange]")) { u.near.range = d("[data-nrange]").dataset.nrange; return refreshControls(app); }
  if (d("[data-nrate]")) { u.near.minRating = +d("[data-nrate]").dataset.nrate; return refreshControls(app); }
  if (d("[data-nrev]")) { u.near.minReviews = +d("[data-nrev]").dataset.nrev; return refreshControls(app); }
  if (d("[data-nearpick]")) {
    const x = nearPicks(app).find((p) => p.key === d("[data-nearpick]").dataset.nearpick);
    if (x) { u.near.q = x.q; u.near.label = x.label; u.near.target = x.target ? { ...x.target, q: x.q } : null; }
    return refreshControls(app);
  }
  if (d(".kinds [data-kind]")) {
    const set = u.mode === "late" ? u.lateKinds : u.mode === "near" ? u.near.kinds : u.kinds, k = d("[data-kind]").dataset.kind;
    if (set.has(k)) { if (set.size > 1) set.delete(k); else toast("Pick at least one kind"); } else set.add(k);
    return refreshControls(app);
  }
  if (d("#find")) return find(app);
  if (d("[data-open]")) return openPlace(app, d("[data-open]").dataset.open);
  if (d('[data-act="save"]')) return toggleSave(app, d('[data-act="save"]').dataset.id);
  if (d('[data-act="checkin"]')) return app.checkIn(app.places.get(d('[data-act="checkin"]').dataset.id));
  if (d('[data-act="near"]')) { const p = app.places.get(d('[data-act="near"]').dataset.id); if (p) nearFrom(app, p); return; }
  if (d("[data-swap]")) return swap(app, +d("[data-swap]").dataset.swap);
  if (d("#save-day")) return saveDay(app);
}

// ---------- Searching ----------

// An idea from Today: set the controls it names, open Explore and search (or show the setup card when there's
// no key and no sample places).
export function runPreset(app, p) {
  const u = app.ui;
  u.mode = p.mode;
  u.cuisines = new Set(p.cuisines || []);   // an idea from Today names its own controls: last time's cuisine and distance don't carry over
  u.maxKm = null;
  if (p.near) Object.assign(u.near, { q: p.near.q, label: p.near.label || p.near.q, target: p.near.target ? { ...p.near.target, q: p.near.q } : null });
  if (p.kinds) u.kinds = new Set(p.kinds);
  if (p.minutes) u.minutes = p.minutes;
  if (p.lateKinds) u.lateKinds = new Set(p.lateKinds);
  if (p.late) u.late = p.late;
  if (p.where) u.where = p.where;
  if (p.pace) u.pace = p.pace;
  if (p.start) u.start = p.start;
  app.show("explore");
  const s = app.state.settings;
  if (s.sample || s.key) return find(app);
}

async function find(app) {
  const btn = $("#find"), res = $("#results"), u = app.ui;
  btn.disabled = true; btn.textContent = u.mode === "tomorrow" ? "Planning…" : "Finding…";
  res.innerHTML = `<div class="empty">Looking around…</div>`;
  try {
    const provider = await app.getProvider();
    if (!provider) return renderExplore(app);
    let r;
    if (u.mode === "near") { $("#where-note").textContent = ""; r = await findNear(provider, u); }
    else {
      const pos = await app.locate();
      $("#where-note").textContent = pos.fallback ? "Using Melbourne CBD (location is off)" : "Near you";
      const now = new Date();
      r = u.mode === "now" ? await findNow(provider, pos, now, u) : u.mode === "late" ? await findLate(provider, pos, now, u) : await findTomorrow(app, provider, pos, now, u);
    }
    r.source = provider.label;
    app.lastResult = r;
    for (const p of r.places || (r.groups ? r.groups.flatMap((g) => g.places) : r.plan.flatMap((s) => [s.place, ...s.alternatives]).filter(Boolean))) app.places.set(p.id, p);
    renderResults(app);
  } catch (err) {
    res.innerHTML = `<div class="error"><b>Couldn't search.</b> ${esc(err.message || err)}</div>`;
  } finally {
    btn.disabled = false; btn.textContent = findLabel(u);
  }
}

async function findNow(provider, pos, now, u) {
  const kinds = [...u.kinds].map(kindOf);
  const reach = Math.max(1, reachKm(driveBudget(u.minutes, Math.min(...kinds.map((k) => visitFor(k.id, u.minutes)))), { mode: u.travel, at: now }));
  const radius = u.maxKm == null ? reach : Math.min(reach, Math.max(0.5, u.maxKm));   // the time or the distance, whichever is shorter
  // Each kind's searches (Nature asks for parks and for walking trails); parks and beaches often list no hours, so
  // Google's open-now filter would drop them: Spots checks the hours itself.
  const lists = await Promise.all(kinds.flatMap((k) => queriesOf(k.id, u.cuisines).map((q) => provider.search({ query: q, kind: k.id, center: pos, radiusKm: radius,
    openNow: !k.alwaysOpen, priceMax: u.price, max: 12 }))));
  const opts = { from: pos, at: now, minutes: u.minutes, mode: u.travel, priceMax: u.price, maxKm: u.maxKm, cuisines: u.cuisines };
  const places = pickNow(lists.flat(), opts);
  const why = places.length ? null : whyEmpty(lists.flat(), opts);
  const t = MINUTES.find(([m]) => m === u.minutes)[1];
  return { type: "list", mode: "now", at: now, travel: u.travel, places, why: why === "far" && u.travel === "walk" ? "farWalk" : why, head: `Open now · ${t} to spare`, sub: `${places.length} found${u.maxKm == null ? "" : ` within ${fmtKm(u.maxKm)}`}` };
}

// Late night asks for "late night <cuisine> restaurant" for each cuisine chosen, and its usual query otherwise.
const lateQueries = (k, cuisines) => (k === "eat" && cuisines.size ? CUISINES.filter((c) => cuisines.has(c.id)).map((c) => `late night ${c.query}`) : [LATE_QUERY[k]]);

async function findLate(provider, pos, now, u) {
  const { at, tonight } = lateStart(now);
  const kinds = [...u.lateKinds];
  const reach = Math.max(1, reachKm(u.late, { at }));
  const radius = u.maxKm == null ? reach : Math.min(reach, Math.max(0.5, u.maxKm));
  const lists = await Promise.all(kinds.flatMap((k) => lateQueries(k, u.cuisines).map((q) => provider.search({ query: q, kind: k, center: pos, radiusKm: radius, openNow: !tonight, priceMax: u.price, max: 12 }))));
  const places = pickLate(lists.flat(), { from: pos, at, maxMinutes: u.late, priceMax: u.price, maxKm: u.maxKm, cuisines: u.cuisines });
  return { type: "list", mode: "late", at, travel: "drive", places, head: tonight ? "Tonight from 10 pm" : "Open late, right now", sub: `Up to ${u.late} min drive${u.maxKm == null ? "" : `, within ${fmtKm(u.maxKm)}`}` };
}

async function findTomorrow(app, provider, pos, now, u) {
  const day = tomorrow(now);
  let region = null;
  if (u.where === "surprise") region = surpriseRegion(app.state.recentRegions);
  else if (u.where !== "town") region = REGIONS.find((r) => r.id === u.where) || null;
  if (region) { app.state = noteRegion(app.state, region.id); app.persist(); }
  const center = region ? { lat: region.lat, lng: region.lng } : pos;
  // Tomorrow's weather picks the slots: an afternoon outdoors on a good day, indoor stops on a wet one.
  const wt = weatherState(weatherOn(app.feed, iso(day)));
  const slots = daySlots(u.pace, wt.state, { beachy: wt.beachy });
  // Lunch and dinner ask for each chosen cuisine; every other stop asks as before.
  const asks = (s) => (s.kinds[0] === "eat" && u.cuisines.size ? CUISINES.filter((c) => u.cuisines.has(c.id)).map((c) => `${c.query} ${s.id}`) : [s.query]);
  const lists = await Promise.all(slots.map(async (s) => (await Promise.all(asks(s).map((q) => provider.search({ query: region ? `${q} ${region.name}` : q, kind: s.kinds[0],
    center, radiusKm: region ? 15 : u.townKm, openNow: false, priceMax: u.price, max: 10 })))).flat()));
  const plan = buildDayPlan(slots, Object.fromEntries(slots.map((s, i) => [s.id, lists[i]])), { start: pos, day, startTime: u.start, priceMax: u.price, cuisines: u.cuisines });
  return { type: "day", region, day, plan, from: pos, weather: wt.state ? wt : null, townKm: u.townKm };
}

// Near here: from a place (which has a position) or an event venue (looked up by name and address).
export function nearFrom(app, p) {
  const target = Number.isFinite(p.lat) && Number.isFinite(p.lng) ? { name: p.name, lat: p.lat, lng: p.lng, area: p.area } : null;
  const q = p.q || [p.name, p.area].filter(Boolean).join(", ");
  closeSheet();
  return runPreset(app, { mode: "near", near: { q, label: p.label || p.name, target } });
}

async function findNear(provider, u) {
  const n = u.near;
  if (!n.q.trim() && !n.target) throw new Error("Type where you're going first.");
  if (!n.target || n.target.q !== n.q) {
    const loc = await provider.locate(n.q.trim());
    if (!loc) throw new Error(`Couldn't find "${n.q.trim()}". Try a suburb or a fuller address.`);
    n.target = { ...loc, q: n.q };
  }
  const t = n.target, kinds = [...n.kinds], range = nearRange(n.range), at = new Date();
  const lists = await Promise.all(kinds.map(async (k) => (await Promise.all(queriesOf(k, u.cuisines).map((q) => provider.search({ query: q, kind: k, center: t,
    radiusKm: rangeKm(range, at), openNow: false, priceMax: u.price, max: 20, minRating: n.minRating })))).flat()));
  const groups = kinds.map((k, i) => ({ kind: k, ...pickNear(lists[i], { center: t, range, at, minRating: n.minRating, minReviews: n.minReviews, priceMax: u.price, cuisines: u.cuisines }) }));
  const cuisines = CUISINES.filter((c) => u.cuisines.has(c.id)).map((c) => c.label);
  return { type: "near", at, target: t, label: n.label && n.label !== n.q ? n.label : t.name, groups, range, minRating: n.minRating, minReviews: n.minReviews, cuisines };
}

// ---------- Showing results ----------

// The kind tile is always there; a photo covers it and removes itself if it fails, uncovering the tile.
// No referrerpolicy: the browser sends the site's origin, which is what a website-restricted key checks.
export function photoBlock(p, i, big) {
  const k = kindOf(p.kind);
  const tag = p.sample ? `<span class="tag">Sample</span>` : "";
  const tile = `<span class="kind">${k.label}</span><span class="emo" aria-hidden="true">${EMOJI[k.id]}</span>`;
  if (p.photo && p.photo.url && (big || i < MAX_PHOTOS)) {
    const credit = p.photo.author ? `<a class="credit" href="${esc(p.photo.authorUrl || mapsUrl(p))}" target="_blank" rel="noopener">Photo: ${esc(p.photo.author)}</a>` : "";
    return `<div class="pic" data-kind="${k.id}">${tile}<img src="${esc(p.photo.url)}" alt="" loading="lazy" onerror="var c=this.parentNode.querySelector('.credit');if(c)c.remove();this.remove()">${credit}${tag}</div>`;
  }
  return `<div class="pic" data-kind="${k.id}">${tag}${tile}</div>`;
}

// A park or beach with no listed hours: say so rather than "Hours unknown".
const hoursText = (p, at) => (!p.hours && kindOf(p.kind).alwaysOpen ? "No set hours" : hoursLabel(p.hours, at, p.off));
const ratingText = (p) => (p.rating != null ? `<b>★ ${p.rating.toFixed(1)}</b> (${fmtCount(p.ratingCount)})` : "★ No rating yet");
const travelText = (p, mode, from) => (p.travel != null ? `<span class="travel">${fmtMinutes(p.travel)} ${mode === "walk" ? "walk" : "drive"}</span>${from ? ` from ${esc(from)}` : ""} · ${p.km} km` : "");

function card(app, p, i, at, mode, from) {
  const k = kindOf(p.kind), saved = isSaved(app.state, p.id), left = openLeft(p, at), range = priceRangeLabel(p.priceRange);
  return `<article class="card result in" data-kind="${k.id}" style="animation-delay:${Math.min(i, 6) * 40}ms">
    ${photoBlock(p, i, false)}
    <div class="body">
      <button class="open-place" type="button" data-open="${esc(p.id)}">
        <div class="row1"><h3>${esc(p.name)}</h3>${p.price != null ? `<span class="price">${priceSymbols(p.price)}</span>` : ""}</div>
        <p class="meta">${ratingText(p)} · ${esc([cuisineLabel(p), p.area].filter(Boolean).join(" · ") || k.label)}</p>
        <p class="meta"><span class="hours${left > 0 ? " open" : ""}">${esc(hoursText(p, at))}</span>${p.travel != null ? " · " + travelText(p, mode, from) : ""}</p>
        ${range ? `<p class="range">${esc(range)} per person</p>` : ""}
      </button>
      <div class="acts">
        <button class="btn${saved ? " hot" : ""}" type="button" data-act="save" data-id="${esc(p.id)}">${saved ? "♥ Saved" : "♡ Save"}</button>
        <a class="btn maps" href="${esc(mapsUrl(p))}" target="_blank" rel="noopener">Google Maps</a>
        <button class="btn red" type="button" data-act="checkin" data-id="${esc(p.id)}">Check in</button>
      </div>
    </div>
  </article>`;
}

function renderResults(app) {
  const res = $("#results"), r = app.lastResult;
  if (!res || !r) return;
  const attrib = `<p class="attrib">${esc(r.source)}</p>`;
  if (r.type === "near") {
    const bar = `★ ${r.minRating}+ from ${fmtN(r.minReviews)}+ reviews`;
    res.innerHTML = `<div class="card region"><p class="eyebrow">Top-rated near</p><h3>${esc(r.label)}</h3>
      <p>${esc([r.target.address || r.target.area, `within a ${r.range.label}`, bar].filter(Boolean).join(" · "))}</p></div>`
      + r.groups.map((g) => `<div class="res-head"><h3>${EMOJI[g.kind]} ${esc(kindOf(g.kind).label)}${g.kind === "eat" && r.cuisines.length ? ` · ${esc(r.cuisines.join(", "))}` : ""}</h3><span>${g.places.length ? `${g.places.length}${g.more ? ` of ${g.places.length + g.more}` : ""} found` : ""}</span></div>`
        + (g.places.length ? g.places.map((p, i) => card(app, p, i, r.at, r.range.mode, r.label)).join("")
          : `<div class="empty">None ${bar.toLowerCase()} within a ${r.range.label}.${g.almost ? ` ${g.almost} more with ${fmtN(Math.floor(r.minReviews / 3))}+ reviews: try fewer reviews.` : r.range.custom ? " Try a bigger distance." : r.range.id !== NEAR.ranges.at(-1).id ? ` Try a ${r.range.mode === "walk" ? "short drive" : "longer drive"}.` : ""}</div>`)).join("")
      + attrib;
    return;
  }
  if (r.type === "list") {
    res.innerHTML = `<div class="res-head"><h3>${esc(r.head)}</h3><span>${esc(r.sub)}</span></div>`
      + (r.places.length ? r.places.map((p, i) => card(app, p, i, r.at, r.travel)).join("") : `<div class="empty">${EMPTY[r.mode === "late" ? "late" : r.why || "none"]}</div>`) + attrib;
    return;
  }
  const dayName = r.day.toLocaleDateString("en-AU", { weekday: "long", day: "numeric", month: "short" });
  const first = r.plan.find((s) => s.place);
  const away = r.region ? fmtMinutes(travelMinutes(haversineKm(r.from, r.region), { at: r.plan[0].at })) : "";
  const w = r.weather, wLine = w ? `${skyIcon(w.code, w.rain, w.max)} ${w.max ?? "?"}° · ${w.rain ?? "?"}% rain${w.state === "good" ? " · an afternoon outdoors" : w.state === "wet" ? " · indoor stops" : ""}` : "";
  let html = `<div class="card region"><p class="eyebrow">Tomorrow · ${esc(dayName)}</p><h3>${esc(r.region ? r.region.name : "Around town")}</h3>
    <p>${esc(r.region ? r.region.blurb : "Places within about 10 km of you.")}</p>${r.region ? `<p>${away} from you</p>` : ""}${wLine ? `<p>${esc(wLine)}</p>` : ""}</div><div class="stop-wrap">`;
  r.plan.forEach((s, i) => {
    if (i > 0) html += `<div class="leg">${s.place && s.travel != null ? `${fmtMinutes(s.travel)} drive` : ""}</div>`;
    else html += `<div class="leg">${first && s.place ? `${fmtMinutes(s.travel)} drive from you` : ""}</div>`;
    const time = s.at.toLocaleTimeString("en-AU", { hour: "numeric", minute: "2-digit" });
    html += `<div class="stop"><div class="time">${esc(time)}<small>${esc(s.slot.label)}</small></div><div>`
      + (s.place ? card(app, s.place, i, s.at, "drive") + (s.alternatives.length ? `<div class="acts"><button class="btn" type="button" data-swap="${i}">⇄ Swap for another</button></div>` : "")
        : `<div class="slot-empty">Nothing open at this time nearby. Try another start time or budget.</div>`)
      + `</div></div>`;
  });
  html += `</div><div class="day-acts"><button class="btn hot" type="button" id="save-day">♥ Save the whole day</button></div>${attrib}`;
  res.innerHTML = html;
}

function swap(app, i) {
  const r = app.lastResult;
  r.plan = swapStop(r.plan, i, r.from);
  for (const s of r.plan) if (s.place) app.places.set(s.place.id, s.place);
  renderResults(app);
}

function saveDay(app) {
  const places = app.lastResult.plan.map((s) => s.place).filter(Boolean);
  for (const p of places) app.state = savePlace(app.state, p);
  app.persist();
  toast(`Saved ${places.length} places`);
  renderResults(app);
}

function toggleSave(app, id) {
  const p = app.places.get(id);
  if (!p) return;
  const was = isSaved(app.state, id);
  app.state = was ? unsave(app.state, id) : savePlace(app.state, p);
  app.persist();
  toast(was ? "Removed from Saved" : `Saved ${p.name}`);
  document.querySelectorAll(`[data-act="save"][data-id="${CSS.escape(id)}"]`).forEach((b) => {
    b.textContent = was ? "♡ Save" : "♥ Saved"; b.classList.toggle("hot", !was);
  });
}

// ---------- Place sheet ----------

function sheetHTML(app, p, state) {
  const k = kindOf(p.kind), now = new Date(), range = priceRangeLabel(p.priceRange), saved = isSaved(app.state, p.id);
  const bits = [cuisineLabel(p) || k.label, p.area, p.price != null ? priceSymbols(p.price) : "", range ? `${range} per person` : ""].filter(Boolean).map(esc).join(" · ");
  let say;
  if (state === "loading") say = `<p class="hint">Loading what people say…</p>`;
  else if (state && state.error) say = `<p class="hint">Couldn't load reviews: ${esc(state.error)}</p>`;
  else if (p.summary) say = `<p class="summary">${esc(p.summary.text)}</p>${p.summary.disclosure ? `<p class="disclosure">${esc(p.summary.disclosure)}</p>` : ""}`;
  else if (p.reviews && p.reviews.length) say = p.reviews.slice(0, 2).map((r) => `<blockquote class="review">${esc(r.text.length > 280 ? r.text.slice(0, 277) + "…" : r.text)}<cite>${r.rating ? "★".repeat(Math.round(r.rating)) + " · " : ""}${esc(r.author || "Google user")}${r.when ? " · " + esc(r.when) : ""}</cite></blockquote>`).join("");
  else say = `<p class="hint">No reviews to show.</p>`;
  const tmr = (now.getDay() + 1) % 7;
  return `${sheetBar}
    ${photoBlock(p, 0, true)}
    <h2>${esc(p.name)}</h2>
    <p class="meta">${bits}</p>
    <p class="meta">${p.rating != null ? `<b>★ ${p.rating.toFixed(1)}</b> · ${fmtCount(p.ratingCount)} reviews` : "No rating yet"}</p>
    <section><h4>What people say</h4>${say}${p.reviews && p.reviews.length || p.summary ? `<p class="disclosure"><a href="${esc(mapsUrl(p))}" target="_blank" rel="noopener">All reviews on Google</a></p>` : ""}</section>
    <section><h4>Hours</h4><dl class="kv">
      <dt>Now</dt><dd>${esc(hoursText(p, now))}</dd>
      ${p.hours ? `<dt>Today</dt><dd>${esc(dayHours(p.hours, now.getDay()))}</dd><dt>Tomorrow</dt><dd>${esc(dayHours(p.hours, tmr))}</dd>` : ""}
    </dl></section>
    ${p.travel != null ? `<section><h4>Getting there</h4><p class="meta">${travelText(p, app.lastResult && app.lastResult.travel)}</p></section>` : ""}
    <div class="acts">
      <button class="btn${saved ? " hot" : ""}" type="button" data-act="save" data-id="${esc(p.id)}">${saved ? "♥ Saved" : "♡ Save"}</button>
      <a class="btn maps" href="${esc(mapsUrl(p))}" target="_blank" rel="noopener">Google Maps</a>
      <button class="btn red" type="button" data-act="checkin" data-id="${esc(p.id)}">Check in</button>
      <button class="btn" type="button" data-act="near" data-id="${esc(p.id)}">★ Top-rated near here</button>
    </div>
    <p class="attrib">${esc(p.sample ? "Sample data" : "Google Maps")}</p>`;
}

export async function openPlace(app, id, fallback) {
  const p = app.places.get(id) || fallback;
  if (!p) return;
  app.places.set(p.id, p);
  const d = openSheet(sheetHTML(app, p, "loading"));
  if (!d.dataset.bound) {
    d.addEventListener("click", (e) => {
      const s = e.target.closest('[data-act="save"]'), c = e.target.closest('[data-act="checkin"]'), n = e.target.closest('[data-act="near"]');
      if (s) toggleSave(app, s.dataset.id);
      if (c) app.checkIn(app.places.get(c.dataset.id));
      if (n && app.places.get(n.dataset.id)) nearFrom(app, app.places.get(n.dataset.id));
    });
    d.dataset.bound = "1";
  }
  try {
    const provider = await app.getProvider();
    const full = provider ? await provider.details(p) : p;
    const merged = { ...p, ...full, travel: p.travel, km: p.km };
    app.places.set(id, merged);
    if (d.open && d.querySelector("h2")?.textContent === p.name) d.querySelector(".in").innerHTML = sheetHTML(app, merged, null);
  } catch (err) {
    if (d.open) d.querySelector(".in").innerHTML = sheetHTML(app, p, { error: err.message || String(err) });
  }
}

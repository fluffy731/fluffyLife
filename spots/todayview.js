// Today: ideas for this moment, what's on today and next, and what's new in town. It makes no Google call:
// tapping an idea opens Explore and runs a Find there. Logic in today.js; the feed is spots/feed.json.
import { iso, addDays, clock, ideasFor, onToday, nextList, whenLabel, dateRange, momentLine, catOf, isTonight, kindForCat, startOn, weekdayOf } from "./today.js";
import { saveEvent, unsaveEvent, isEventSaved, upcomingEvents } from "./model.js";
import { runPreset, nearFrom } from "./explore.js";
import { $, esc, toast, openSheet, sheetBar } from "./ui.js";

const SHOW = 6;
const safe = (u) => (/^https?:\/\//.test(u || "") ? u : "");
// An event's venue as Near here wants it: looked up by name and address.
export const venueOf = (e) => ({ q: [e.venue, e.address || e.area].filter(Boolean).join(", ") || e.title, label: e.venue || e.area || e.title, name: e.venue || e.title });
export const eventMaps = (e) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([e.venue, e.address || e.area].filter(Boolean).join(", ") || e.title)}`;
const SOURCE = { wom: "What's On Melbourne (City of Melbourne)", ef: "Eventfinda" };
const FRESH_KIND = { eat: ["🍜", "Eat"], drink: ["🍸", "Drink"], coffee: ["☕", "Coffee"], dessert: ["🍨", "Dessert"], event: ["🎟️", "On"], other: ["✨", "New"] };
const FOOD = new Set(["eat", "drink", "coffee", "dessert"]);
const FILTER_NAME = { market: "Markets", festival: "Festivals", comedy: "Comedy", music: "Live music", free: "Free" };

function ago(day, today) {
  const n = Math.round((new Date(`${today}T12:00`) - new Date(`${day}T12:00`)) / 864e5);
  if (n <= 0) return "today";
  if (n === 1) return "yesterday";
  if (n < 7) return `${n} days ago`;
  return new Date(`${day}T12:00`).toLocaleDateString("en-AU", { day: "numeric", month: "short" });
}

// The kind tile is always there; a picture covers it and removes itself if it fails. No referrer, so sites
// that refuse hotlinking from other pages still send the picture.
function pic(url, emoji, kind, cls = "") {
  const img = safe(url) ? `<img src="${esc(url)}" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.remove()">` : "";
  return `<div class="pic ${cls}" data-kind="${kind}"><span class="emo" aria-hidden="true">${emoji}</span>${img}</div>`;
}

const ideaBtn = (i) => `<button class="idea card" type="button" data-idea="${esc(i.id)}"><span class="idea-emo" aria-hidden="true">${i.emoji}</span>
  <span><b>${esc(i.label)}</b><small>${esc(i.sub)}</small></span></button>`;

function evRow(app, e, day, opts) {
  const [emo] = catOf(e);
  const line = [whenLabel(e, day, opts), e.venue || e.area].filter(Boolean).join(" · ");
  return `<button class="ev card" type="button" data-ev="${esc(e.id)}" data-day="${esc(day)}" data-with="${opts.withDay ? 1 : 0}">
    <span class="ev-emo" data-kind="${kindForCat(e.cat)}" aria-hidden="true">${emo}</span>
    <span class="ev-main"><b>${esc(e.title)}</b><small>${esc(line)}</small></span>
    ${e.free ? `<span class="tag free">Free</span>` : ""}${isEventSaved(app.state, e.id) ? `<span class="saved-mark" aria-label="Saved">♥</span>` : ""}
  </button>`;
}

function eventsSection(app, key, title, list, day, opts) {
  const all = app.ui.showAll[key], shown = all ? list : list.slice(0, SHOW), f = key === "today" ? app.ui.todayFilter : null;
  const empty = f ? `Nothing like that ${isTonight(new Date()) ? "tonight" : "on today"}.` : key === "today" ? "Nothing else listed for today." : "Nothing listed yet.";
  return `<section class="tsec" id="ev-${key}">
    <div class="res-head"><h3>${esc(title)}</h3><span>${list.length ? `${list.length} on` : ""}</span></div>
    ${f ? `<div class="chips" style="margin-top:8px"><button class="chip" type="button" aria-pressed="true" data-unfilter>${esc(FILTER_NAME[f] || f)} ✕</button></div>` : ""}
    ${list.length ? `<div class="evs">${shown.map((e) => evRow(app, e, day, opts)).join("")}</div>` : `<div class="empty" style="margin-top:8px">${empty}</div>`}
    ${list.length > SHOW ? `<button class="btn more" type="button" data-more="${key}">${all ? "Show fewer" : `Show all ${list.length}`}</button>` : ""}
  </section>`;
}

function freshRow(f, today) {
  const [emo, label] = FRESH_KIND[f.kind] || FRESH_KIND.other;
  const kind = f.kind === "event" || f.kind === "other" ? "activities" : f.kind;
  return `<a class="fresh card" href="${esc(safe(f.url))}" target="_blank" rel="noopener">
    ${pic(f.image, emo, kind, "thumb")}
    <span class="fb"><span class="ftag">${label}</span><b>${esc(f.title)}</b><small>${esc(f.source)} · ${esc(ago(f.date, today))}</small></span></a>`;
}

function draw(app) {
  const v = $("#v-today"), now = new Date(), day = iso(now), f = app.feed, u = app.ui, s = app.state.settings;
  const ideas = ideasFor(now, f, { saved: upcomingEvents(app.state, day) });
  app._ideas = ideas;
  const today = onToday(f, now, { filter: u.todayFilter });
  const next = nextList(f, now);
  const freshAll = f && Array.isArray(f.fresh) ? [...f.fresh].sort((a, b) => (FOOD.has(b.kind) ? 1 : 0) - (FOOD.has(a.kind) ? 1 : 0)) : [];
  const fresh = u.showAll.fresh ? freshAll : freshAll.slice(0, SHOW);
  const roundups = f && Array.isArray(f.roundups) ? f.roundups.filter((r) => safe(r.url)) : [];
  const built = f && f.built ? new Date(f.built) : null;
  const feedNote = app.feedState === "none" ? `<div class="empty tsec">Looking up what's on…</div>`
    : !f ? `<div class="empty tsec">Events and new openings arrive with the next hourly update. Ideas above still work.</div>` : "";

  v.innerHTML = `
    <h2 class="title">Today</h2>
    <p class="moment">${esc(momentLine(now, f))}</p>
    <section class="tsec">
      <h3 class="tlabel">Right now</h3>
      <div class="ideas">${ideas.map(ideaBtn).join("")}</div>
      ${s.sample || s.key ? "" : `<p class="hint">Ideas search Google for places open now. Set up your key, or try sample places, in Settings (⚙).</p>`}
    </section>
    ${f ? eventsSection(app, "today", isTonight(now) ? "Tonight" : "On today", today, day, {}) : ""}
    ${f ? eventsSection(app, "next", next.title, next.events, next.day, { withDay: true }) : ""}
    ${f && roundups.length ? `<p class="roundups">More ideas: ${roundups.map((r) => `<a href="${esc(r.url)}" target="_blank" rel="noopener">${esc(r.source || "Round-up")}</a>`).join(" · ")}</p>` : ""}
    ${f && freshAll.length ? `<section class="tsec"><div class="res-head"><h3>New in town</h3><span>last 3 weeks</span></div>
      <div class="evs">${fresh.map((x) => freshRow(x, day)).join("")}</div>
      ${freshAll.length > SHOW ? `<button class="btn more" type="button" data-more="fresh">${u.showAll.fresh ? "Show fewer" : `Show all ${freshAll.length}`}</button>` : ""}</section>` : ""}
    ${feedNote}
    ${f ? `<p class="attrib">Events from What's On Melbourne and Eventfinda; new in town from Time Out, Concrete Playground and Google News.${built ? ` Updated ${esc(built.toLocaleTimeString("en-AU", { hour: "numeric", minute: "2-digit" }))}${iso(built) !== day ? ` ${esc(built.toLocaleDateString("en-AU", { day: "numeric", month: "short" }))}` : ""}.` : ""}</p>` : ""}`;

  if (!v.dataset.bound) { v.addEventListener("click", (e) => onClick(app, e)); v.dataset.bound = "1"; }
}

function onClick(app, e) {
  const t = e.target, u = app.ui;
  const idea = t.closest("[data-idea]");
  if (idea) {
    const i = (app._ideas || []).find((x) => x.id === idea.dataset.idea);
    if (!i) return;
    if (i.filter) { u.todayFilter = i.filter; u.showAll.today = false; draw(app); $("#ev-today")?.scrollIntoView({ behavior: "smooth", block: "start" }); return; }
    return runPreset(app, i.preset);
  }
  if (t.closest("[data-unfilter]")) { u.todayFilter = null; return draw(app); }
  const more = t.closest("[data-more]");
  if (more) { const k = more.dataset.more; u.showAll[k] = !u.showAll[k]; return draw(app); }
  const row = t.closest("[data-ev]");
  if (row) {
    const ev = (app.feed?.events || []).find((x) => x.id === row.dataset.ev);
    if (ev) openEvent(app, ev, row.dataset.day);
  }
}

// ---------- the event sheet ----------

export function openEvent(app, e, day = iso(new Date())) {
  const [emo, label] = catOf(e), t = startOn(e, day) || (e.next ? e.next.slice(11, 16) : null), nextDay = e.next ? e.next.slice(0, 10) : null;
  const today = iso(new Date());
  const when = [dateRange(e, today), t && nextDay ? `${nextDay === today ? "today" : nextDay === addDays(today, 1) ? "tomorrow" : weekdayOf(nextDay)} ${clock(t)}` : ""].filter(Boolean).join(" · ");
  const saved = isEventSaved(app.state, e.id);
  const d = openSheet(`${sheetBar}
    ${pic(e.image, emo, kindForCat(e.cat))}
    <h2>${esc(e.title)}</h2>
    <p class="meta">${emo} ${esc(label)}${e.free ? " · <b>Free</b>" : ""}${e.outdoor ? " · Outdoors" : ""}</p>
    <dl class="kv" style="margin-top:12px"><dt>When</dt><dd>${esc(when || "See details")}</dd>
      ${e.venue || e.area ? `<dt>Where</dt><dd>${esc(e.venue || e.area)}${e.address ? `<br><small>${esc(e.address)}</small>` : e.venue && e.area ? `<br><small>${esc(e.area)}</small>` : ""}</dd>` : ""}</dl>
    ${e.blurb ? `<p class="summary" style="margin-top:12px">${esc(e.blurb)}</p>` : ""}
    <div class="acts">
      <button class="btn${saved ? " hot" : ""}" type="button" data-evsave="${esc(e.id)}">${saved ? "♥ Saved" : "♡ Save"}</button>
      ${safe(e.url) ? `<a class="btn" href="${esc(e.url)}" target="_blank" rel="noopener">Details</a>` : ""}
      <a class="btn maps" href="${esc(eventMaps(e))}" target="_blank" rel="noopener">Google Maps</a>
      ${e.venue || e.area ? `<button class="btn" type="button" data-evnear="${esc(e.id)}">★ Top-rated near here</button>` : ""}
    </div>
    <p class="attrib">${esc(SOURCE[e.src] || "")}</p>`);
  d._event = e; d._day = day;
  if (!d.dataset.evbound) {
    d.addEventListener("click", (ev) => {
      if (ev.target.closest("[data-evnear]") && d._event) return nearFrom(app, venueOf(d._event));
      const b = ev.target.closest("[data-evsave]");
      if (!b) return;
      // The feed's copy, or else the one this sheet shows (a saved event whose listing has left the feed).
      const item = (app.feed?.events || []).find((x) => x.id === b.dataset.evsave) || (d._event && d._event.id === b.dataset.evsave ? d._event : null);
      const was = isEventSaved(app.state, b.dataset.evsave);
      if (!was && !item) return;
      app.state = was ? unsaveEvent(app.state, b.dataset.evsave) : saveEvent(app.state, item, iso(new Date()), d._day);
      app.persist();
      toast(was ? "Removed from Saved" : "Saved: it's in Saved until it's over");
      b.textContent = was ? "♡ Save" : "♥ Saved"; b.classList.toggle("hot", !was);
      if (app.tab === "today") draw(app);
      else if (app.tab === "saved") app.show("saved");
    });
    d.dataset.evbound = "1";
  }
}

export async function renderToday(app) {
  draw(app);
  await app.loadFeed();
  if (app.tab === "today") draw(app);
}

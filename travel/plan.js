import { TRIPS } from "./items.js";
import { load as loadPacking, save as savePacking } from "./model.js";
import { KINDS, kindOf, load, save, uid, todayISO, fixRange, reschedule, itinerary, tripDays, nights, dayLabel, rangeLabel,
  status, sortTrips, current, packingFor, toText, exportJSON, importJSON, linkedTrip } from "./plan-model.js";

const $ = (q, root = document) => root.querySelector(q);
let S = load(localStorage);
const persist = () => save(localStorage, S);
const mast = $("#mast"), view = $("#view");

function el(tag, props = {}, kids = []) {
  const n = Object.assign(document.createElement(tag), props);
  for (const k of [].concat(kids)) if (k != null && k !== false) n.append(k);
  return n;
}
function btn(text, className, onClick) {
  const b = el("button", { type: "button", className, textContent: text });
  b.addEventListener("click", onClick);
  return b;
}

const typeLabel = (id) => TRIPS.find((x) => x.id === id)?.label || "";
const nightsLabel = (t) => { const n = nights(t); return n ? `${n} night${n === 1 ? "" : "s"}` : "Day trip"; };
const mapsURL = (place) => `https://maps.apple.com/?q=${encodeURIComponent(place)}`;
const findTrip = (id) => S.trips.find((t) => t.id === id);
const openId = () => new URLSearchParams(location.hash.slice(1)).get("t");
const go = (hash) => { if (location.hash.slice(1) === hash) render(); else location.hash = hash; };

// ---------- views ----------
let shown; // which view is on screen, so re-renders after an edit don't jump the scroll position
function render() {
  const t = findTrip(openId());
  t ? renderTrip(t) : renderTrips();
  const key = t ? t.id : "";
  if (key === shown) return;
  shown = key;
  const today = t && $(".day.today");
  requestAnimationFrame(() => window.scrollTo(0, today ? today.offsetTop - mast.offsetHeight - 8 : 0));
}

function renderTrips() {
  document.title = "Trip Plan";
  const today = todayISO();
  mast.replaceChildren(el("div", { className: "mast-row" }, [el("h1", { textContent: "Trips" }), btn("＋ New trip", "primary", () => editTrip())]));
  view.replaceChildren();
  const offers = (website || []).filter((w) => !findTrip(w.trip.id));
  if (!S.trips.length && !offers.length) view.append(el("p", { className: "hint", textContent: "No trips yet. Tap ＋ New trip, then add each day's plans." }));
  for (const t of sortTrips(S.trips, today)) {
    const st = status(t, today);
    view.append(el("a", { className: `trip ${st.when}`, href: `#t=${encodeURIComponent(t.id)}` }, [
      el("span", { className: "tn", textContent: t.name }),
      el("span", { className: `when ${st.when}`, textContent: st.text }),
      el("span", { className: "meta", textContent: `${rangeLabel(t)} · ${nightsLabel(t)} · ${typeLabel(t.type)}` }),
    ]));
  }
  if (offers.length) view.append(el("h2", { className: "group", textContent: "On the website" }));
  for (const { name, trip: t } of offers) {
    view.append(el("a", { className: "trip offer", href: `#import=${name}` }, [
      el("span", { className: "tn", textContent: t.name }),
      el("span", { className: "when", textContent: "＋ Add" }),
      el("span", { className: "meta", textContent: `${rangeLabel(t)} · ${nightsLabel(t)} · ${typeLabel(t.type)}` }),
    ]));
  }
  view.append(
    el("div", { className: "tools foot" }, [btn("Back up", "chip", backup), btn("Restore", "chip", () => $("#file").click())]),
    el("p", { className: "hint small", textContent: "Your trips and edits are kept on this phone only (Safari and the home-screen app separately). Back up now and then." }),
  );
}

function renderTrip(t) {
  document.title = t.name;
  const today = todayISO(), st = status(t, today);
  mast.replaceChildren(
    el("div", { className: "mast-row" }, [btn("‹ Trips", "back", () => go("")), el("h1", { textContent: t.name }), btn("Edit", "chip", () => editTrip(t))]),
    el("p", { className: "sub" }, [`${rangeLabel(t)} · ${nightsLabel(t)} · ${typeLabel(t.type)} · `, el("span", { className: `when ${st.when}`, textContent: st.text })]),
    el("div", { className: "tools" }, [btn("🧳 Pack for this trip", "chip", () => pack(t)), btn("Share", "chip", (e) => share(t, e.currentTarget))]),
  );
  view.replaceChildren();
  for (const d of itinerary(t)) {
    const sec = el("section", { className: "sec day" + (d.date === today ? " today" : "") });
    sec.append(el("h2", {}, d.date
      ? [el("span", { className: "dn", textContent: `Day ${d.n}` }), el("span", { className: "st", textContent: dayLabel(d.date) }),
        d.date === today && el("span", { className: "tag", textContent: "today" })]
      : [el("span", { className: "st", textContent: "Not on a trip day" }), el("span", { className: "n", textContent: "tap to move" })]));
    const ul = el("ul");
    for (const i of d.items) {
      const k = kindOf(i.kind);
      const row = el("li", { className: "entry" }, [
        el("span", { className: "ic", textContent: k.icon, title: k.label }),
        el("span", { className: "tm", textContent: i.time }),
        el("div", { className: "what" }, [
          el("button", { type: "button", className: "tt", textContent: i.title }),
          !d.date && el("span", { className: "note", textContent: i.day ? dayLabel(i.day) : "No day" }),
          i.place && el("a", { className: "place", href: mapsURL(i.place), target: "_blank", rel: "noopener", textContent: i.place }),
          i.note && el("span", { className: "note", textContent: i.note }),
        ]),
      ]);
      // The whole row opens the editor (the title is the keyboard-reachable button); the Maps link still works on its own.
      row.addEventListener("click", (e) => { if (!e.target.closest("a")) editItem(t, i); });
      ul.append(row);
    }
    sec.append(ul);
    if (d.date) sec.append(btn(d.items.length ? "＋ Add" : "＋ Add plans", "add-entry", () => editItem(t, null, d.date)));
    view.append(sec);
  }
}

// ---------- actions ----------
function pack(t) {
  savePacking(localStorage, { ...loadPacking(localStorage), ...packingFor(t) });
  location.href = "./";
}

function flash(b, msg) {
  const was = b.textContent;
  b.textContent = msg;
  setTimeout(() => { b.textContent = was; }, 1500);
}

function share(t, b) {
  const text = toText(t);
  if (navigator.share) { navigator.share({ title: t.name, text }).catch(() => {}); return; }
  navigator.clipboard?.writeText(text).then(() => flash(b, "Copied ✓"), () => {});
}

function backup() {
  const name = `travel-plan-backup-${todayISO()}.json`;
  const file = new File([exportJSON(S)], name, { type: "application/json" });
  // iOS: the share sheet (Save to Files) is the reliable route; a blob download from a home-screen app is not.
  if (navigator.canShare?.({ files: [file] })) { navigator.share({ files: [file], title: name }).catch(() => {}); return; }
  const a = Object.assign(document.createElement("a"), { href: URL.createObjectURL(file), download: name });
  a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 30000);
}

$("#file").addEventListener("change", (e) => {
  const f = e.target.files[0];
  if (!f) return;
  f.text().then((txt) => {
    let r;
    try { r = importJSON(txt, S); } catch (err) { alert(err.message); return; }
    const n = r.added + r.replaced;
    if (!confirm(`Restore ${n} trip${n === 1 ? "" : "s"} from this backup?${r.replaced ? ` ${r.replaced} already here will be replaced by the backup's copy.` : ""}`)) return;
    S = { trips: r.trips }; persist(); render();
  });
  e.target.value = "";
});

// Two taps to delete, so a stray touch can't lose a trip or a booking.
function twoTap(b, run) {
  const label = b.textContent;
  let armed = 0;
  const reset = () => { clearTimeout(armed); armed = 0; b.textContent = label; b.classList.remove("armed"); };
  b.addEventListener("click", () => {
    if (armed) { reset(); run(); return; }
    b.textContent = "Tap again to delete"; b.classList.add("armed");
    armed = setTimeout(reset, 3000);
  });
  return reset;
}

// ---------- trip editor ----------
const tripDlg = $("#trip-dlg"), tripForm = $("form", tripDlg), tf = tripForm.elements;
let editingTrip = null;
$("[data-types]", tripDlg).append(...TRIPS.map((x) => el("label", {}, [el("input", { type: "radio", name: "type", value: x.id }), el("span", { textContent: x.label })])));
const tripDel = $("[data-delete]", tripDlg);
const resetTripDel = twoTap(tripDel, () => {
  S.trips = S.trips.filter((x) => x.id !== editingTrip.id); persist();
  tripDlg.close(); go("");
});

// Picking the first day fills the last day too, and the last day's picker can't go before the first.
tf.start.addEventListener("change", () => {
  tf.end.min = tf.start.value;
  if (tf.start.value && (!tf.end.value || tf.end.value < tf.start.value)) tf.end.value = tf.start.value;
});

function editTrip(t = null) {
  editingTrip = t;
  $("[data-title]", tripDlg).textContent = t ? "Edit trip" : "New trip";
  tf.title.value = t?.name || "";
  tf.start.value = t?.start || "";
  tf.end.value = t?.end || "";
  tf.end.min = tf.start.value;
  tf.type.value = t?.type || TRIPS[0].id;
  tripDel.hidden = !t; resetTripDel();
  tripDlg.showModal();
}

tripForm.addEventListener("submit", (e) => {
  if (e.submitter?.value !== "save") return;
  const name = tf.title.value.trim(), type = tf.type.value;
  if (editingTrip) {
    S.trips = S.trips.map((x) => (x.id === editingTrip.id ? { ...reschedule(x, tf.start.value, tf.end.value), name, type } : x));
    persist(); render();
  } else {
    const t = { id: uid(), name, ...fixRange(tf.start.value, tf.end.value), type, items: [] };
    S.trips.push(t); persist(); go(`t=${t.id}`);
  }
});

// ---------- entry editor ----------
const itemDlg = $("#item-dlg"), itemForm = $("form", itemDlg), xf = itemForm.elements;
let editing = null; // { tripId, item }
$("[data-kinds]", itemDlg).append(...KINDS.map((k) => el("label", {}, [el("input", { type: "radio", name: "kind", value: k.id }),
  el("span", {}, [el("b", { textContent: k.icon }), k.label])])));
const itemDel = $("[data-delete]", itemDlg);
const resetItemDel = twoTap(itemDel, () => {
  const t = findTrip(editing.tripId);
  if (t) { t.items = t.items.filter((x) => x.id !== editing.item.id); persist(); }
  itemDlg.close(); render();
});

function editItem(t, i = null, day = "") {
  editing = { tripId: t.id, item: i };
  const days = tripDays(t), at = i ? i.day : day;
  const opts = days.map((d, k) => el("option", { value: d, textContent: `Day ${k + 1} · ${dayLabel(d)}` }));
  if (!days.includes(at)) opts.unshift(el("option", { value: at, textContent: at ? `${dayLabel(at)} (not on this trip)` : "No day" }));
  xf.day.replaceChildren(...opts);
  xf.day.value = at;
  xf.kind.value = i?.kind || "do";
  xf.title.value = i?.title || "";
  xf.time.value = i?.time || "";
  xf.place.value = i?.place || "";
  xf.note.value = i?.note || "";
  itemDel.hidden = !i; resetItemDel();
  itemDlg.showModal();
}

itemForm.addEventListener("submit", (e) => {
  if (e.submitter?.value !== "save") return;
  const t = findTrip(editing.tripId);
  if (!t) return;
  const it = { id: editing.item?.id || uid(), day: xf.day.value, time: xf.time.value.slice(0, 5), kind: xf.kind.value || "do",
    title: xf.title.value.trim(), place: xf.place.value.trim(), note: xf.note.value.trim() };
  t.items = [...t.items.filter((x) => x.id !== it.id), it];
  persist(); render();
});

// ---------- trips from a link ----------
// plan.html#import=<name> loads travel/trips/<name>.json into this phone's planner, then opens it.
// A trip already here is only replaced if you say so, since that would undo edits made on the phone.
async function importFromLink(name) {
  let r;
  try {
    const res = await fetch(`./trips/${name}.json`, { cache: "no-cache" });
    if (!res.ok) throw new Error(`Couldn't find the trip "${name}" on the website.`);
    r = importJSON(await res.text(), S);
  } catch (err) { alert(err.message); history.replaceState(null, "", "#"); return render(); }
  const linked = r.trips.slice(r.trips.length - r.added - r.replaced);
  const keep = r.replaced && !confirm("This trip is already on this phone. Replace it with the website's version? Changes made on the phone will be lost.");
  if (!keep) { S = { trips: r.trips }; persist(); }
  history.replaceState(null, "", linked[0] ? `#t=${encodeURIComponent(linked[0].id)}` : "#");
  render();
}

// Trips published in travel/trips/ (listed in index.json) and not on this phone yet are offered on the Trips page.
// A home-screen app keeps its own storage and tapped links open in Safari, so this is how it gets them.
let website = null;
async function loadWebsiteTrips() {
  try {
    const res = await fetch("./trips/index.json", { cache: "no-cache" });
    if (!res.ok) return;
    const names = ((await res.json()).trips || []).filter((n) => linkedTrip(`#import=${n}`));
    const found = [];
    for (const name of names) {
      const r = await fetch(`./trips/${name}.json`, { cache: "no-cache" });
      if (r.ok) for (const trip of importJSON(await r.text(), { trips: [] }).trips) found.push({ name, trip });
    }
    website = found;
    if (!findTrip(openId())) render();
  } catch { /* offline or no index: nothing to offer */ }
}

// ---------- start ----------
window.addEventListener("hashchange", () => { const name = linkedTrip(location.hash); name ? importFromLink(name) : render(); });
const linkName = linkedTrip(location.hash);
if (linkName) { render(); importFromLink(linkName); }
else {
  // Opening the planner mid-trip goes straight to that trip; ‹ Trips still lists them all.
  if (!findTrip(openId())) {
    const now = current(S.trips, todayISO());
    if (now) history.replaceState(null, "", `#t=${encodeURIComponent(now.id)}`);
  }
  render();
}
loadWebsiteTrips();

if ("serviceWorker" in navigator) navigator.serviceWorker.register("../sw.js").catch(() => {});

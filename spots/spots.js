// Spots: boot, shared app state, tabs, settings and the choice of data source.
import { load, save, staleSaved, CBD, KINDS } from "./model.js";
import { sampleProvider } from "./samples.js";
import { loadGoogle, googleProvider, testConnection, loadedKey } from "./places.js";
import { renderExplore } from "./explore.js";
import { renderSaved, renderPassport, openCheckIn, backupNow, restoreFrom } from "./stampbook.js";
import { $, esc, toast, closeSheet } from "./ui.js";

const FIELD_NAMES = { photo: "Photos", price: "Price level", priceRange: "Price range", rating: "Ratings", hours: "Opening hours",
  mapsUrl: "Google Maps link", summary: "Review summary (Google may not offer it in Australia yet)", reviews: "Review excerpts" };

// Search choices (time, budget, kinds…) are remembered on this phone. The mode follows the clock:
// from 9 pm to 4 am Spots opens on Late night.
const UI_KEY = "spots.ui";
function loadUi() {
  const h = new Date().getHours();
  const ui = { mode: h >= 21 || h < 4 ? "late" : "now", minutes: 120, travel: "drive", kinds: new Set(["eat"]), price: null, late: 30,
    lateKinds: new Set(["eat", "drink", "dessert"]), where: "town", start: "09:00", pace: "relaxed", savedKind: "all" };
  try {
    const o = JSON.parse(localStorage.getItem(UI_KEY) || "{}");
    if ([60, 120, 180, 240].includes(o.minutes)) ui.minutes = o.minutes;
    if (["drive", "walk"].includes(o.travel)) ui.travel = o.travel;
    if ([null, 1, 2, 3, 4].includes(o.price)) ui.price = o.price;
    if ([15, 30, 45].includes(o.late)) ui.late = o.late;
    if (typeof o.where === "string") ui.where = o.where;
    if (["08:00", "09:00", "10:00"].includes(o.start)) ui.start = o.start;
    if (["relaxed", "full"].includes(o.pace)) ui.pace = o.pace;
    const kinds = (a) => (Array.isArray(a) && a.length && a.every((k) => KINDS.some((x) => x.id === k)) ? new Set(a) : null);
    ui.kinds = kinds(o.kinds) || ui.kinds; ui.lateKinds = kinds(o.lateKinds) || ui.lateKinds;
  } catch { /* first run or storage blocked: defaults */ }
  return ui;
}

const app = {
  state: load(localStorage),
  ui: loadUi(),
  pos: null, places: new Map(), lastResult: null, freshStamp: null, tab: "explore",
  persist() { save(localStorage, this.state); },
  saveUi() {
    const u = this.ui;
    try { localStorage.setItem(UI_KEY, JSON.stringify({ minutes: u.minutes, travel: u.travel, price: u.price, late: u.late, where: u.where,
      start: u.start, pace: u.pace, kinds: [...u.kinds], lateKinds: [...u.lateKinds] })); } catch { /* storage blocked */ }
  },
  refreshSaved() { if (this.tab === "saved") renderSaved(this); },

  async getProvider() {
    const s = this.state.settings;
    if (s.sample) return (this._sample ||= sampleProvider());
    if (!s.key) return null;
    if (!this._google) this._google = googleProvider(await loadGoogle(s.key));
    return this._google;
  },

  // Where you are, or Melbourne CBD when location is off or doesn't answer within 8 seconds.
  locate() {
    const fresh = this.pos && Date.now() - this.pos.t < (this.pos.fallback ? 30e3 : 5 * 60e3);
    if (fresh) return Promise.resolve(this.pos);
    return new Promise((resolve) => {
      let done = false;
      const finish = (p) => { if (done) return; done = true; clearTimeout(timer); resolve((this.pos = { ...p, t: Date.now() })); };
      const timer = setTimeout(() => finish({ ...CBD, fallback: true }), 8000);
      if (!navigator.geolocation) return finish({ ...CBD, fallback: true });
      navigator.geolocation.getCurrentPosition(
        (g) => finish({ lat: g.coords.latitude, lng: g.coords.longitude, fallback: false }),
        () => finish({ ...CBD, fallback: true }),
        { enableHighAccuracy: false, timeout: 8000, maximumAge: 300000 });
    });
  },

  show(tab) {
    this.tab = tab;
    for (const v of ["explore", "saved", "passport", "settings"]) $(`#v-${v}`).hidden = v !== tab;
    document.querySelectorAll(".tab").forEach((b) => (b.dataset.tab === tab ? b.setAttribute("aria-current", "page") : b.removeAttribute("aria-current")));
    if (tab === "explore") renderExplore(this);
    if (tab === "saved") renderSaved(this);
    if (tab === "passport") renderPassport(this);
    if (tab === "settings") renderSettings(this);
    window.scrollTo(0, 0);
  },

  checkIn(place) { openCheckIn(this, place); },
};

function applyTheme() {
  const t = app.state.settings.theme;
  if (t === "auto") delete document.documentElement.dataset.theme; else document.documentElement.dataset.theme = t;
}

function tickClock() {
  const now = new Date();
  $("#clock").textContent = now.toLocaleDateString("en-AU", { weekday: "short", day: "numeric", month: "short" }) + " · "
    + now.toLocaleTimeString("en-AU", { hour: "numeric", minute: "2-digit" }).replace(" ", " ");
}

function renderSettings(app) {
  const s = app.state.settings;
  const last = s.lastBackup ? `Last backup ${new Date(s.lastBackup).toLocaleDateString("en-AU", { day: "numeric", month: "long" })}.` : "No backup yet.";
  const theme = (id, label) => `<button class="chip" type="button" id="theme-${id}" data-theme-set="${id}" aria-pressed="${s.theme === id}">${label}</button>`;
  $("#v-settings").innerHTML = `
    <h2 class="title">Settings</h2>
    <div class="card set">
      <h3>Google Places</h3>
      <p>Real photos, prices, reviews and opening hours come from Google, using your own key. It stays on this phone and never goes into a backup.</p>
      <label class="label" for="key-in">Google Maps key</label>
      <input id="key-in" type="password" autocomplete="off" spellcheck="false" value="${esc(s.key)}" placeholder="AIza…">
      <div class="row">
        <button class="btn primary" type="button" id="key-save">Save key</button>
        <button class="btn" type="button" id="key-test"${s.key ? "" : " disabled"}>Test</button>
        ${s.key ? `<button class="btn" type="button" id="key-clear">Remove key</button>` : ""}
      </div>
      <div class="test-out" id="test-out"></div>
      <details>
        <summary>How to get a key (about 10 minutes)</summary>
        <ol>
          <li>Open <b>console.cloud.google.com</b>, sign in and create a project called Spots.</li>
          <li>Turn on billing for the project. Google gives a free allowance for each service every month; a few searches a day stays inside it.</li>
          <li>In <b>APIs &amp; Services → Library</b>, enable <b>Maps JavaScript API</b> and <b>Places API (New)</b>.</li>
          <li>In <b>Credentials</b>, create an API key. Under <i>Application restrictions</i> choose <i>Websites</i> and add <code>https://fluffy731.github.io/*</code>. Under <i>API restrictions</i> choose those two APIs.</li>
          <li>In <b>Places API (New) → Quotas</b>, set each daily limit to about 30 a day. That keeps even a misused key inside Google's free monthly allowance (about 1,000 photo and detail calls a month).</li>
          <li>Copy the key, paste it above, tap <b>Save key</b>, then <b>Test</b>.</li>
        </ol>
      </details>
    </div>
    <div class="card set">
      <h3>Sample places</h3>
      <p>Try every screen with made-up places. No key needed. Turn this off to use Google.</p>
      <label class="switch" for="sample-toggle">Use sample places <input type="checkbox" id="sample-toggle"${s.sample ? " checked" : ""}></label>
    </div>
    <div class="card set">
      <h3>Theme</h3>
      <div class="seg">${theme("auto", "Auto")}${theme("light", "Day")}${theme("dark", "Night")}</div>
    </div>
    <div class="card set">
      <h3>Backup</h3>
      <p>Saved places, stamps and stamp photos in one file. Save it to iCloud Drive or Files now and then. ${last}</p>
      <div class="row">
        <button class="btn primary" type="button" id="backup-btn">Back up now</button>
        <label class="btn" for="restore-in">Restore from file</label>
        <input id="restore-in" type="file" accept="application/json,.json" hidden>
      </div>
    </div>
    <div class="card set">
      <h3>Location</h3>
      <p>Spots asks for your location when you tap Find or Check in. When location is off, it uses Melbourne CBD. Check in lists your saved places and the places you just found, nearest first, and only picks one for you when you're within about 300 m of it.</p>
    </div>
    <p class="hint">Everything you save stays on this phone. Place details, photos and reviews come from Google Maps.</p>`;
}

document.addEventListener("click", async (e) => {
  const t = e.target;
  const tab = t.closest(".tab");
  if (tab) return app.show(tab.dataset.tab);
  if (t.closest("#fab")) return app.checkIn(null);
  const sheet = $("#sheet");
  if (t === sheet || t.closest("[data-close]")) return closeSheet();

  if (!t.closest("#v-settings")) return;
  const s = app.state.settings;
  const themeBtn = t.closest("[data-theme-set]");
  if (themeBtn) { s.theme = themeBtn.dataset.themeSet; app.persist(); applyTheme(); return renderSettings(app); }
  if (t.closest("#key-save")) {
    const key = $("#key-in").value.trim();
    s.key = key; if (key) s.sample = false; app.persist();
    toast(key ? "Key saved" : "Key removed");
    if (loadedKey() && loadedKey() !== key) return location.reload(); // the Maps script stays tied to the key it loaded with
    return renderSettings(app);
  }
  if (t.closest("#key-clear")) { s.key = ""; app.persist(); toast("Key removed"); return loadedKey() ? location.reload() : renderSettings(app); }
  if (t.closest("#key-test")) {
    const out = $("#test-out");
    out.textContent = "Testing…";
    try {
      const r = await testConnection(googleProvider(await loadGoogle(s.key)));
      out.innerHTML = r.ok
        ? `<p><b>Connected.</b> ${r.error ? esc(r.error) : "What came back:"}</p><ul>${Object.entries(FIELD_NAMES).map(([k, v]) => `<li>${r.fields.includes(k) ? "✓" : "✗"} ${v}</li>`).join("")}</ul>${r.notes.map((n) => `<p>${esc(n)}</p>`).join("")}`
        : `<p><b>Didn't connect.</b> ${esc(r.error)}</p>`;
    } catch (err) { out.innerHTML = `<p><b>Didn't connect.</b> ${esc(err.message)}</p>`; }
    return;
  }
  if (t.closest("#backup-btn")) return backupNow(app).then(() => renderSettings(app));
});

document.addEventListener("change", async (e) => {
  if (e.target.id === "sample-toggle") {
    app.state.settings.sample = e.target.checked; app.persist();
    app.lastResult = null;
    toast(e.target.checked ? "Sample places on" : "Sample places off");
  }
  if (e.target.id === "restore-in" && e.target.files[0]) { await restoreFrom(app, e.target.files[0]); renderSettings(app); }
});

// Saved places from Google: names and positions may be kept 30 days, so refresh older ones when online.
async function refreshStale() {
  const s = app.state.settings;
  if (s.sample || !s.key || !navigator.onLine) return;
  const ids = staleSaved(app.state).slice(0, 10);
  if (!ids.length) return;
  try {
    const provider = await app.getProvider();
    for (const id of ids) {
      const old = app.state.saved.find((x) => x.id === id);
      const p = await provider.details({ id, kind: old.kind });
      Object.assign(old, { name: p.name || old.name, area: p.area || old.area, lat: p.lat ?? old.lat, lng: p.lng ?? old.lng, fetchedAt: new Date().toISOString() });
    }
    app.persist();
  } catch { /* offline or quota: try again next time */ }
}

applyTheme();
tickClock(); setInterval(tickClock, 30e3);
// Coming back to the app (it may have sat in the background for hours): fix the clock and flag old results.
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState !== "visible") return;
  tickClock();
  if (app.tab === "explore" && app.onResume) app.onResume();
});
app.show("explore");
setTimeout(refreshStale, 3000);
if ("serviceWorker" in navigator) navigator.serviceWorker.register("../sw.js").catch(() => {});

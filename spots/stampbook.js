// Saved places, checking in (the stamp), the Passport, and backup and restore.
import { KINDS, kindOf, haversineKm, travelMinutes, fmtMinutes, mapsUrl, unsave, addStamp, passportStats, backupJSON, mergeBackup } from "./model.js";
import { putPhoto, getPhoto, delPhoto, thumb, photosAsDataURLs, dataURLToBlob } from "./db.js";
import { $, EMOJI, esc, toast, openSheet, closeSheet, sheetBar } from "./ui.js";
import { openPlace } from "./explore.js";

const MON = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
const stampDate = (iso) => { const [y, m, d] = iso.split("-").map(Number); return `${d} ${MON[m - 1]} ${String(y).slice(2)}`; };
const longDate = (iso) => { const [y, m, d] = iso.split("-").map(Number); return new Date(y, m - 1, d).toLocaleDateString("en-AU", { weekday: "short", day: "numeric", month: "long", year: "numeric" }); };
const tilt = (id) => { let h = 0; for (const c of id) h = (h * 31 + c.charCodeAt(0)) | 0; return (Math.abs(h) % 21) - 10; };
const distLine = (app, s) => {
  if (!app.pos || s.lat == null) return "";
  const km = haversineKm(app.pos, s);
  return ` · ${fmtMinutes(travelMinutes(km, { at: new Date() }))} · ${Math.round(km * 10) / 10} km`;
};
const byDistance = (app, list) => (app.pos ? [...list].sort((a, b) => haversineKm(app.pos, a) - haversineKm(app.pos, b)) : list);

// ---------- Saved ----------

export function renderSaved(app) {
  const v = $("#v-saved"), u = app.ui;
  const present = KINDS.filter((k) => app.state.saved.some((s) => s.kind === k.id));
  if (u.savedKind !== "all" && !present.some((k) => k.id === u.savedKind)) u.savedKind = "all";
  const list = byDistance(app, app.state.saved.filter((s) => u.savedKind === "all" || s.kind === u.savedKind));
  v.innerHTML = `<h2 class="title">Saved</h2>
    ${present.length > 1 ? `<div class="chips scroll" style="margin-bottom:12px"><button class="chip" type="button" data-skind="all" aria-pressed="${u.savedKind === "all"}">All</button>${present.map((k) => `<button class="chip" type="button" data-kind="${k.id}" data-skind="${k.id}" aria-pressed="${u.savedKind === k.id}">${EMOJI[k.id]} ${k.label}</button>`).join("")}</div>` : ""}
    ${list.length ? list.map((s) => `<div class="card saved-row" data-kind="${s.kind}">
        <span class="badge" aria-hidden="true">${EMOJI[s.kind]}</span>
        <button class="open-place" type="button" data-sopen="${esc(s.id)}"><b>${esc(s.name)}</b><small>${esc(s.area || kindOf(s.kind).label)}${distLine(app, s)}</small></button>
        <div class="row-acts">
          <a class="icon-btn" href="${esc(mapsUrl(s))}" target="_blank" rel="noopener" aria-label="Open ${esc(s.name)} in Google Maps">↗</a>
          <button class="icon-btn" type="button" data-scheck="${esc(s.id)}" aria-label="Check in at ${esc(s.name)}">◎</button>
          <button class="icon-btn" type="button" data-sdel="${esc(s.id)}" aria-label="Remove ${esc(s.name)}">✕</button>
        </div></div>`).join("")
      : `<div class="empty">Nothing saved yet. Tap Save on any place in Explore.</div>`}
    ${app.pos ? "" : list.length ? `<p class="hint">Find something in Explore to sort these by distance.</p>` : ""}`;
  if (!v.dataset.bound) {
    v.addEventListener("click", (e) => {
      const t = e.target, get = (a) => app.state.saved.find((s) => s.id === t.closest(`[${a}]`).getAttribute(a));
      if (t.closest("[data-skind]")) { app.ui.savedKind = t.closest("[data-skind]").dataset.skind; return renderSaved(app); }
      if (t.closest("[data-sdel]")) { const s = get("data-sdel"); app.state = unsave(app.state, s.id); app.persist(); toast(`Removed ${s.name}`); return renderSaved(app); }
      if (t.closest("[data-scheck]")) return openCheckIn(app, get("data-scheck"));
      if (t.closest("[data-sopen]")) { const s = get("data-sopen"); return openPlace(app, s.id, { ...s, hours: null, photo: null, rating: null, reviews: [] }); }
    });
    v.dataset.bound = "1";
  }
}

// ---------- Check in ----------

export function openCheckIn(app, pre) {
  const seen = new Set(), cands = [];
  for (const p of [pre, ...byDistance(app, app.state.saved)]) if (p && p.id && !seen.has(p.id) && cands.length < 6) { seen.add(p.id); cands.push(p); }
  const st = { sel: cands[0] ? cands[0].id : "other", rating: 4, kind: "eat", file: null };
  const d = openSheet(`${sheetBar}
    <h2>Check in</h2>
    <p class="hint">Where are you?</p>
    <div class="cands" id="cands">
      ${cands.map((p) => `<button class="cand" type="button" data-cand="${esc(p.id)}" data-kind="${kindOf(p.kind).id}" aria-pressed="${p.id === st.sel}"><span class="badge" aria-hidden="true">${EMOJI[kindOf(p.kind).id]}</span><span>${esc(p.name)}<small>${esc(p.area || kindOf(p.kind).label)}</small></span></button>`).join("")}
      <button class="cand" type="button" data-cand="other" aria-pressed="${st.sel === "other"}"><span class="badge" aria-hidden="true" style="background:var(--soft)">✎</span><span>Somewhere else<small>Type the name</small></span></button>
    </div>
    <div id="other"${st.sel === "other" ? "" : " hidden"}>
      <div class="other"><input id="other-name" type="text" placeholder="Place name" aria-label="Place name"><input id="other-area" type="text" placeholder="Suburb or city" aria-label="Suburb or city"></div>
      <div class="chips" style="margin-top:8px">${KINDS.map((k) => `<button class="chip" type="button" data-okind="${k.id}" data-kind="${k.id}" aria-pressed="${k.id === st.kind}">${EMOJI[k.id]} ${k.label}</button>`).join("")}</div>
    </div>
    <p class="label">How was it?</p>
    <div class="stars" id="stars"></div>
    <input class="note" id="ci-note" type="text" placeholder="Note: who with, what you had" aria-label="Note" style="margin-top:10px">
    <div class="photo-pick"><label class="btn" for="ci-photo">📷 Add a photo</label><input class="vh" type="file" accept="image/*" id="ci-photo">
      <img class="photo-prev" id="ci-prev" alt="Your photo" hidden></div>
    <div class="holdwrap">
      <button class="hold" type="button" id="hold" aria-label="Hold to check in">
        <svg viewBox="0 0 140 140" aria-hidden="true"><circle class="track" cx="70" cy="70" r="64"></circle><circle class="ring" id="ring" cx="70" cy="70" r="64"></circle></svg>
        <span>Check in<small>Hold</small></span>
      </button>
      <span class="hold-cap">Hold until the ring closes</span>
    </div>`);

  const stars = () => { $("#stars").innerHTML = [1, 2, 3, 4, 5].map((n) => `<button class="star${n <= st.rating ? " on" : ""}" type="button" data-star="${n}" aria-label="${n} star${n > 1 ? "s" : ""}">★</button>`).join(""); };
  stars();
  const panel = d.querySelector(".in");
  panel.addEventListener("click", (e) => {
    const c = e.target.closest("[data-cand]"), s = e.target.closest("[data-star]"), k = e.target.closest("[data-okind]");
    if (c) { st.sel = c.dataset.cand; panel.querySelectorAll("[data-cand]").forEach((b) => b.setAttribute("aria-pressed", String(b === c))); $("#other").hidden = st.sel !== "other"; }
    if (s) { st.rating = +s.dataset.star; stars(); }
    if (k) { st.kind = k.dataset.okind; panel.querySelectorAll("[data-okind]").forEach((b) => b.setAttribute("aria-pressed", String(b === k))); }
  });
  $("#ci-photo").addEventListener("change", (e) => {
    st.file = e.target.files[0] || null;
    const img = $("#ci-prev");
    if (st.file) { img.src = URL.createObjectURL(st.file); img.hidden = false; } else img.hidden = true;
  });

  // Hold for 0.8 s; letting go early cancels. Enter or Space (a keyboard click) checks in at once.
  const hold = $("#hold"), ring = $("#ring"), C = 2 * Math.PI * 64;
  ring.style.strokeDasharray = C; ring.style.strokeDashoffset = C;
  let holding = false, t0 = 0, raf = 0, busy = false;
  const go = () => { if (busy) return; busy = true; stamp(app, cands, st).finally(() => { busy = false; }); };
  const tick = () => {
    if (!holding) return;
    const p = Math.min(1, (performance.now() - t0) / 800);
    ring.style.strokeDashoffset = C * (1 - p);
    if (p >= 1) { holding = false; go(); return; }
    raf = requestAnimationFrame(tick);
  };
  const cancel = () => { if (!holding) return; holding = false; cancelAnimationFrame(raf); ring.style.strokeDashoffset = C; };
  hold.addEventListener("pointerdown", (e) => { e.preventDefault(); holding = true; t0 = performance.now(); hold.setPointerCapture(e.pointerId); tick(); });
  hold.addEventListener("pointerup", cancel);
  hold.addEventListener("pointercancel", cancel);
  hold.addEventListener("contextmenu", (e) => e.preventDefault());
  hold.addEventListener("click", (e) => { if (e.detail === 0) go(); });
}

async function stamp(app, cands, st) {
  let place;
  if (st.sel === "other") {
    const name = $("#other-name").value.trim();
    if (!name) { toast("Type the place name first"); $("#ring").style.strokeDashoffset = 2 * Math.PI * 64; $("#other-name").focus(); return; }
    place = { id: "", name, area: $("#other-area").value.trim(), kind: st.kind };
  } else place = cands.find((p) => p.id === st.sel);
  let photoId = null;
  if (st.file) {
    try { const blob = await thumb(st.file); photoId = `ph-${Date.now().toString(36)}`; await putPhoto(photoId, blob); }
    catch { toast("Couldn't keep that photo, but the check-in is saved"); photoId = null; }
  }
  const { state, stamp: s } = addStamp(app.state, { place, rating: st.rating, note: $("#ci-note").value, photoId, date: new Date() });
  if (!s) return;
  app.state = state; app.persist(); app.freshStamp = s.id;
  const slam = $("#slam"), r = tilt(s.id);
  const splats = Array.from({ length: 9 }, () => {
    const a = Math.random() * Math.PI * 2, dist = 100 + Math.random() * 50;
    return `<span class="splat" style="--dx:${Math.cos(a) * dist}px;--dy:${Math.sin(a) * dist}px;--s:${6 + Math.random() * 10}px"></span>`;
  }).join("");
  slam.innerHTML = `<div class="big-stamp" data-kind="${s.kind}" style="--r:${r}deg"><span class="em">${EMOJI[s.kind]}</span><span class="nm">${esc(s.name)}</span><span class="dt">${stampDate(s.date)}</span></div>${splats}`;
  closeSheet(); // the sheet sits in the top layer, above anything else, so it goes first
  slam.hidden = false;
  document.body.classList.remove("shake"); void document.body.offsetWidth; document.body.classList.add("shake");
  await new Promise((res) => setTimeout(res, 1100));
  slam.hidden = true; slam.innerHTML = ""; document.body.classList.remove("shake");
  toast(`Checked in at ${s.name}`);
  app.show("passport");
}

// ---------- Passport ----------

export function renderPassport(app) {
  const v = $("#v-passport"), st = passportStats(app.state), s = app.state.settings;
  const stale = app.state.stamps.length && (!s.lastBackup || Date.now() - new Date(s.lastBackup) > 30 * 864e5);
  v.innerHTML = `<h2 class="title">Passport</h2>
    <div class="stats">
      <div class="card stat"><b>${st.stamps}</b><span>${st.stamps === 1 ? "stamp" : "stamps"}</span></div>
      <div class="card stat"><b>${st.places}</b><span>${st.places === 1 ? "place" : "places"}</span></div>
      <div class="card stat"><b>${st.suburbs}</b><span>${st.suburbs === 1 ? "suburb" : "suburbs"}</span></div>
    </div>
    <div class="page">${app.state.stamps.length ? app.state.stamps.map((x) => `<button class="stamp${x.id === app.freshStamp ? " fresh" : ""}" type="button" data-kind="${x.kind}" data-stamp="${esc(x.id)}" style="--r:${tilt(x.id)}deg" aria-label="${esc(x.name)}, ${esc(longDate(x.date))}">
        <span class="em" aria-hidden="true">${EMOJI[x.kind]}</span><span class="nm">${esc(x.name)}</span><span class="dt">${stampDate(x.date)}</span></button>`).join("")
      : `<p class="empty-page">No stamps yet. Tap Check in when you get somewhere.</p>`}</div>
    ${stale ? `<div class="nudge"><span>${s.lastBackup ? "It's been a while since your last backup." : "Back up your stamps so a phone change can't lose them."}</span><button class="btn" type="button" data-backup>Back up</button></div>` : ""}`;
  app.freshStamp = null;
  if (!v.dataset.bound) {
    v.addEventListener("click", (e) => {
      if (e.target.closest("[data-backup]")) return backupNow(app).then(() => renderPassport(app));
      const b = e.target.closest("[data-stamp]");
      if (b) openStamp(app, app.state.stamps.find((x) => x.id === b.dataset.stamp));
    });
    v.dataset.bound = "1";
  }
}

async function openStamp(app, s) {
  if (!s) return;
  const d = openSheet(`${sheetBar}
    <div id="st-photo"></div>
    <h2>${esc(s.name)}</h2>
    <p class="meta">${esc([kindOf(s.kind).label, s.area].filter(Boolean).join(" · "))}</p>
    <dl class="kv" style="margin-top:12px"><dt>Date</dt><dd>${esc(longDate(s.date))}</dd>
      ${s.rating ? `<dt>Rating</dt><dd>${"★".repeat(s.rating)}${"☆".repeat(5 - s.rating)}</dd>` : ""}
      ${s.note ? `<dt>Note</dt><dd>${esc(s.note)}</dd>` : ""}</dl>
    <div class="acts">
      <a class="btn maps" href="${esc(mapsUrl({ id: s.placeId, name: s.name, area: s.area, sample: !s.placeId || s.placeId.startsWith("sample-") }))}" target="_blank" rel="noopener">Google Maps</a>
      <button class="btn" type="button" id="st-del">Delete stamp</button>
    </div>`);
  if (s.photoId) {
    const blob = await getPhoto(s.photoId);
    if (blob && d.open) $("#st-photo").innerHTML = `<img src="${URL.createObjectURL(blob)}" alt="Your photo" style="width:100%;border-radius:16px;border:2px solid var(--line)">`;
  }
  $("#st-del").addEventListener("click", async (e) => {
    const b = e.currentTarget;
    if (!b.dataset.sure) { b.dataset.sure = "1"; b.textContent = "Tap again to delete"; return; }
    app.state = { ...app.state, stamps: app.state.stamps.filter((x) => x.id !== s.id) };
    app.persist();
    if (s.photoId) await delPhoto(s.photoId);
    closeSheet(); toast("Stamp deleted"); renderPassport(app);
  });
}

// ---------- Backup and restore ----------

export async function backupNow(app) {
  const ids = app.state.stamps.map((s) => s.photoId).filter(Boolean);
  const photos = await photosAsDataURLs(ids).catch(() => ({}));
  const now = new Date();
  const name = `spots-backup-${now.toISOString().slice(0, 10)}.json`;
  const file = new File([backupJSON(app.state, photos, now)], name, { type: "application/json" });
  try {
    if (navigator.canShare && navigator.canShare({ files: [file] })) await navigator.share({ files: [file], title: "Spots backup" });
    else {
      const a = document.createElement("a");
      a.href = URL.createObjectURL(file); a.download = name; document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 10e3);
    }
  } catch (e) {
    if (e && e.name === "AbortError") return; // closed the share sheet: no backup made
    toast("Couldn't save the backup"); return;
  }
  app.state.settings.lastBackup = now.toISOString(); app.persist();
  toast("Backup saved");
}

export async function restoreFrom(app, file) {
  try {
    const { state, photos, added } = mergeBackup(app.state, await file.text());
    for (const [id, url] of Object.entries(photos)) await putPhoto(id, await dataURLToBlob(url));
    app.state = state; app.persist();
    toast(added ? `Restored ${added} item${added > 1 ? "s" : ""}` : "Nothing new in that backup");
  } catch (e) {
    toast(e.message === "Not a Spots backup" ? "That file isn't a Spots backup" : "Couldn't read that file");
  }
}

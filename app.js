import { pack } from "./data/pack.js";
import { grade } from "./lib/sm2.js";
import { TIER_ORDER, TIER_LABEL, buildUnits, isLearned, currentUnit, isUnlocked, dueItems, unseenItems, pickHourItems, seen } from "./lib/track.js";
import { wordOfHour } from "./lib/hour.js";
import { load, save, exportJSON, importJSON } from "./lib/store.js";
import { validateItem, mergeItems } from "./lib/validate.js";

// ---------- state ----------
// Safari with "Block All Cookies" throws on localStorage access; fall back to memory so the app still renders.
const ls = (() => { try { const l = window.localStorage; l.getItem("probe"); return l; } catch { const m = {}; return { getItem: (k) => m[k] ?? null, setItem: (k, v) => { m[k] = String(v); } }; } })();
let state = load(ls);
let items, vocab, grammar, units;
let tab = "home";
let learnUnitKey = null;   // null = current unit
let flipped = false;
let queue = [];            // current learn/review queue
let browse = { q: "", tier: "all" };

function rebuild() {
  const custom = state.custom || [];
  vocab = mergeItems(pack.vocab, custom.filter((c) => c.kind !== "grammar"));
  grammar = mergeItems(pack.grammar, custom.filter((c) => c.kind === "grammar"));
  items = [...vocab, ...grammar];
  units = buildUnits(vocab, grammar);
}
rebuild();

const persist = () => save(ls, state);
const $ = (s, r = document) => r.querySelector(s);
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const isGrammar = (it) => "form" in it;
const DAY = 86400000;

function fmtDue(ms) {
  const d = ms - Date.now();
  if (d <= 0) return "now";
  if (d < 3600000) return `${Math.max(1, Math.round(d / 60000))} min`;
  if (d < DAY) return `${Math.round(d / 3600000)} h`;
  return `${Math.round(d / DAY)} d`;
}

// ---------- card ----------
function cardHTML(it, open) {
  const front = isGrammar(it)
    ? `<div class="front grammar">${esc(it.form)}</div>`
    : `<div class="front">${esc(it.ko)}</div><div class="pos">${esc(it.pos)}${it.check ? '<span class="check">?</span>' : ""}</div>`;
  if (!open) return `<div class="card flash" id="card">${front}<div class="hint">tap to flip</div></div>`;
  let back;
  if (isGrammar(it)) {
    back = `<div class="zh" lang="zh-Hant">${esc(it.zh)}</div><div class="en">${esc(it.en)}</div>` +
      (it.note ? `<div class="note">${esc(it.note)}</div>` : "") +
      it.ex.map((e) => `<div class="ex"><div class="k">${esc(e.ko)}</div><div class="t" lang="zh-Hant">${esc(e.zh)}</div><div class="t">${esc(e.en)}</div></div>`).join("");
  } else {
    back = (it.hanja ? `<div class="hanja" lang="zh-Hant">${esc(it.hanja)}</div>` : `<div class="hanja none">고유어 · native word</div>`) +
      `<div class="zh" lang="zh-Hant">${esc(it.zh)}</div><div class="en">${esc(it.en)}</div>` +
      `<div class="ex"><div class="k">${esc(it.ex)}</div><div class="t" lang="zh-Hant">${esc(it.exZh)}</div><div class="t">${esc(it.exEn)}</div></div>`;
  }
  return `<div class="card flash" id="card">${front}${back}</div>`;
}

// ---------- views ----------
function renderHome() {
  const cur = currentUnit(units, state.progress);
  const due = dueItems(items, state.progress, Date.now());
  const seenCount = items.filter((i) => seen(state.progress, i.id)).length;
  const idx = units.indexOf(cur);
  const learnedInUnit = cur.items.length - unseenItems(cur, state.progress).length;
  const hour = wordOfHour(pickHourItems(units, cur, state.progress), new Date());
  const nextHour = new Date(); nextHour.setMinutes(60, 0, 0);
  return `
    <div class="stat-row">
      <div class="stat"><b>${due.length}</b><span>due now</span></div>
      <div class="stat"><b>${seenCount}</b><span>of ${items.length} seen</span></div>
      <div class="stat"><b>${idx + 1}/${units.length}</b><span>unit</span></div>
    </div>
    <h2>Word of the hour</h2>
    ${hour ? cardHTML(hour, flipped) : '<div class="card empty">No items</div>'}
    <div class="small muted" style="margin-top:6px">Changes at ${nextHour.getHours().toString().padStart(2, "0")}:00 · ${esc(TIER_LABEL[cur.tier])}</div>
    <h2>Current unit</h2>
    <div class="card">
      <div class="row"><b>${esc(TIER_LABEL[cur.tier])} · Unit ${esc(cur.unit)}</b><span class="pill ${esc(cur.tier)}">${esc(cur.tier)}</span></div>
      <div class="progress-line"><i style="width:${(learnedInUnit / cur.items.length) * 100}%"></i></div>
      <div class="small muted" style="margin-top:6px">${learnedInUnit}/${cur.items.length} introduced · ${cur.items.filter(isGrammar).length} grammar points</div>
      <div class="actions">
        <button class="btn primary" data-go="learn">Learn new</button>
        <button class="btn" data-go="review">Review ${due.length ? `(${due.length})` : ""}</button>
      </div>
    </div>
    <h2>Hourly reminder on iPhone</h2>
    <div class="card tip">
      iOS won't let a web app set its own alarm, and Shortcuts has no "hourly" repeat — so make one <b>Daily</b> automation per hour you want (e.g. 9:00, 10:00 … 21:00):
      <ol>
        <li>Shortcuts → Automation → + → <b>Time of Day</b> → repeat <b>Daily</b>, choose <b>Run Immediately</b>.</li>
        <li>Action: <b>Open App</b> → this app, if it appears in the list after Add to Home Screen.</li>
        <li>If it doesn't, use <b>Open URL</b> with this page's address. That opens Safari, which keeps its own separate progress — so the word it shows may not match this app.</li>
      </ol>
    </div>`;
}

function renderLearn() {
  const unit = (learnUnitKey && units.find((u) => u.key === learnUnitKey)) || currentUnit(units, state.progress);
  const unlocked = isUnlocked(units, units.indexOf(unit), state.progress);
  if (!queue.length || queue._key !== unit.key) { queue = unseenItems(unit, state.progress); queue._key = unit.key; flipped = false; }
  const header = `<div class="row" style="margin-bottom:10px">
      <select id="unit-pick">${units.map((u) => `<option value="${esc(u.key)}" ${u.key === unit.key ? "selected" : ""}>${esc(TIER_LABEL[u.tier])} · Unit ${esc(u.unit)}${isLearned(u, state.progress) ? " ✓" : ""}</option>`).join("")}</select>
    </div>`;
  if (!queue.length) return header + `<div class="card empty"><b>Unit done</b>${isLearned(unit, state.progress) ? "Every item here has been introduced. Pick the next unit above or go review." : ""}</div>`;
  const it = queue[0];
  return header + (unlocked ? "" : `<div class="small muted" style="margin-bottom:8px">Jumped ahead — the previous unit isn't finished yet. That's fine.</div>`) +
    `<div class="small muted" style="margin-bottom:8px">${queue.length} left in this unit</div>` +
    cardHTML(it, flipped) +
    (flipped ? `<div class="actions">
        <button class="btn primary" data-grade="good">Got it <small>review in ${esc(preview(it, "good"))}</small></button>
        <button class="btn" data-grade="easy">Already knew <small>review in ${esc(preview(it, "easy"))}</small></button>
      </div>` : `<div class="actions"><button class="btn primary" data-flip>Show meaning</button><button class="btn" data-grade="easy">Already knew</button></div>`);
}

function renderReview() {
  const due = dueItems(items, state.progress, Date.now());
  if (!queue.length || queue._key !== "review") { queue = due; queue._key = "review"; flipped = false; }
  const live = queue.filter((i) => state.progress[i.id] && state.progress[i.id].due <= Date.now()); live._key = "review"; queue = live;
  if (!queue.length) {
    const dues = items.filter((i) => seen(state.progress, i.id)).map((i) => state.progress[i.id].due).sort((a, b) => a - b);
    const next = dues.find((d) => d > Date.now());
    return `<div class="card empty"><b>Nothing due</b>${next ? `Next review in ${fmtDue(next)}.` : "Learn some new words first."}</div>`;
  }
  const it = queue[0];
  return `<div class="small muted" style="margin-bottom:8px">${queue.length} due</div>` + cardHTML(it, flipped) +
    (flipped ? `<div class="grades">
        <button class="btn again" data-grade="again">Again<small>now</small></button>
        <button class="btn hard" data-grade="hard">Hard<small>${esc(preview(it, "hard"))}</small></button>
        <button class="btn good" data-grade="good">Good<small>${esc(preview(it, "good"))}</small></button>
        <button class="btn easy" data-grade="easy">Easy<small>${esc(preview(it, "easy"))}</small></button>
      </div>` : `<div class="actions" style="grid-template-columns:1fr"><button class="btn primary" data-flip>Show answer</button></div>`);
}
const preview = (it, g) => { const s = grade(state.progress[it.id], g, Date.now()); return s.interval ? `${s.interval} d` : "now"; };

function renderBrowse() {
  const list = browseList();
  return `<input type="search" id="q" placeholder="Search 한글 · 漢字 · 中文 · English" value="${esc(browse.q)}">
    <div class="chips">${["all", ...TIER_ORDER].map((t) => `<button data-tier="${t}" class="${browse.tier === t ? "on" : ""}">${t === "all" ? "All" : TIER_LABEL[t].split(" ·")[0]}</button>`).join("")}
      <button data-add style="margin-left:auto">+ Add</button></div>
    <div id="browse-list">${browseListHTML(list)}</div>`;
}

function browseList() {
  const q = browse.q.trim().toLowerCase();
  return items.filter((i) => (browse.tier === "all" || i.tier === browse.tier) &&
    (!q || [i.ko, i.form, i.hanja, i.zh, i.en].some((f) => f && String(f).toLowerCase().includes(q))));
}

function browseListHTML(list) {
  return `<div class="small muted" style="margin-bottom:8px">${list.length} items</div>
    <div class="list">${list.slice(0, 200).map((i) => {
      const p = state.progress[i.id];
      const status = !p ? "new" : p.due <= Date.now() ? "due" : `in ${fmtDue(p.due)}`;
      return `<div class="item" data-id="${esc(i.id)}">
        <div class="row"><div><b>${esc(i.ko ?? i.form)}</b>${i.hanja ? `<span class="hj" lang="zh-Hant">${esc(i.hanja)}</span>` : ""}${i.check ? '<span class="check">?</span>' : ""}</div>
          <span class="meta"><span class="pill ${esc(i.tier)}">${esc(i.tier)} ${esc(i.unit)}</span> ${status}</span></div>
        <div class="meta" lang="zh-Hant">${esc(i.zh)} · <span lang="en">${esc(i.en)}</span></div>
        <div class="more">${isGrammar(i)
          ? (i.note ? `<div class="muted">${esc(i.note)}</div>` : "") + i.ex.map((e) => `<div><b>${esc(e.ko)}</b><br><span class="muted" lang="zh-Hant">${esc(e.zh)}</span><br><span class="muted">${esc(e.en)}</span></div>`).join("")
          : `<b>${esc(i.ex)}</b><br><span class="muted" lang="zh-Hant">${esc(i.exZh)}</span><br><span class="muted">${esc(i.exEn)}</span>`}
          <div class="actions"><button class="btn" data-edit="${esc(i.id)}">Edit</button><button class="btn" data-reset="${esc(i.id)}">Reset progress</button></div>
        </div></div>`;
    }).join("")}${list.length > 200 ? '<div class="small muted">Showing first 200 — narrow the search.</div>' : ""}</div>`;
}

function renderSettings() {
  return `<h2>Study track</h2>
    <div class="list">${units.map((u, i) => {
      const done = u.items.length - unseenItems(u, state.progress).length;
      const cur = currentUnit(units, state.progress) === u;
      return `<div class="unit ${isUnlocked(units, i, state.progress) ? "" : "locked"} ${cur ? "current" : ""}" data-unit="${esc(u.key)}">
        <span class="pill ${esc(u.tier)}">${esc(u.tier)}</span><span style="min-width:52px">Unit ${esc(u.unit)}</span>
        <div class="bar"><i style="width:${(done / u.items.length) * 100}%"></i></div>
        <span class="small muted">${done}/${u.items.length}</span></div>`;
    }).join("")}</div>
    <h2>Data</h2>
    <div class="card">
      <div class="actions">
        <button class="btn" data-export>Export backup</button>
        <button class="btn" data-import>Import backup</button>
      </div>
      <input type="file" id="file" accept="application/json" hidden>
      <div class="actions"><button class="btn" data-theme>Theme: ${esc(state.settings.theme || "auto")}</button><button class="btn" data-wipe style="color:var(--bad)">Reset all progress</button></div>
      <p class="small muted">Progress lives in this browser only. Export before clearing Safari data or switching phones.</p>
      <p class="small muted">Pack: ${esc(pack.id)} · ${pack.vocab.length} words · ${pack.grammar.length} grammar · ${(state.custom || []).length} custom</p>
    </div>`;
}

const VIEWS = { home: renderHome, learn: renderLearn, review: renderReview, browse: renderBrowse, settings: renderSettings };

function render() {
  $("#view").innerHTML = VIEWS[tab]();
  document.querySelectorAll("#tabs button").forEach((b) => b.classList.toggle("active", b.dataset.tab === tab));
  const due = dueItems(items, state.progress, Date.now()).length;
  const badge = $("#due-badge"); badge.hidden = !due; badge.textContent = due;
}

// ---------- editing ----------
function openEditor(existing) {
  const cur = currentUnit(units, state.progress);
  const it = existing || { kind: "vocab", tier: cur.tier, unit: cur.unit };
  const g = existing ? isGrammar(existing) : false;
  const ex = g ? (it.ex || []).map((e) => `${e.ko} | ${e.zh} | ${e.en}`).join("\n") : "";
  $("#dlg").innerHTML = `<form method="dialog" class="form" id="edit">
    <h3 style="margin:0 0 4px">${existing ? "Edit" : "Add"} ${g ? "grammar" : "word"}</h3>
    ${existing ? "" : `<label>Type <select name="kind"><option value="vocab">Word</option><option value="grammar">Grammar</option></select></label>`}
    <div id="fields"></div>
    <label>Tier <select name="tier">${TIER_ORDER.map((t) => `<option value="${t}" ${it.tier === t ? "selected" : ""}>${TIER_LABEL[t]}</option>`).join("")}</select></label>
    <label>Unit <input type="text" name="unit" inputmode="numeric" value="${esc(it.unit)}"></label>
    <div class="actions"><button class="btn primary" value="save">Save</button><button class="btn" value="cancel" formnovalidate>Cancel</button></div>
    ${existing && existing.id.startsWith("u") ? `<button class="btn" value="delete" formnovalidate style="margin-top:8px;width:100%;color:var(--bad)">Delete custom item</button>` : ""}
  </form>`;
  const fields = (kind) => kind === "grammar"
    ? `<label>Form <input name="form" value="${esc(it.form)}"></label>
       <label>中文 <input name="zh" value="${esc(it.zh)}" lang="zh-Hant"></label>
       <label>English <input name="en" value="${esc(it.en)}"></label>
       <label>Note <input name="note" value="${esc(it.note)}"></label>
       <label>Examples, one per line: 한국어 | 中文 | English <textarea name="ex" rows="4">${esc(ex)}</textarea></label>`
    : `<label>한글 <input name="ko" value="${esc(it.ko)}" required></label>
       <label>漢字 (blank for native) <input name="hanja" value="${esc(it.hanja)}" lang="zh-Hant"></label>
       <label>中文 <input name="zh" value="${esc(it.zh)}" lang="zh-Hant"></label>
       <label>English <input name="en" value="${esc(it.en)}"></label>
       <label>Part of speech <input name="pos" value="${esc(it.pos || "n")}"></label>
       <label>Example 한국어 <input name="ex" value="${esc(it.ex)}"></label>
       <label>Example 中文 <input name="exZh" value="${esc(it.exZh)}" lang="zh-Hant"></label>
       <label>Example English <input name="exEn" value="${esc(it.exEn)}"></label>
       <label class="inline"><input type="checkbox" name="check" ${it.check ? "checked" : ""}> Not sure about the hanja</label>`;
  $("#fields").innerHTML = fields(g ? "grammar" : "vocab");
  const kindSel = $('select[name="kind"]'); if (kindSel) kindSel.onchange = () => { $("#fields").innerHTML = fields(kindSel.value); };
  const dlg = $("#dlg");
  dlg.onclose = () => {
    if (dlg.returnValue === "delete") { state.custom = state.custom.filter((c) => c.id !== existing.id); delete state.progress[existing.id]; persist(); rebuild(); render(); }
  };
  // Validate before the dialog closes so a rejected save keeps what was typed.
  $("#edit").onsubmit = (ev) => {
    if (ev.submitter?.value !== "save") return;
    const f = new FormData($("#edit"));
    const kind = existing ? (g ? "grammar" : "vocab") : f.get("kind");
    const base = { id: existing ? existing.id : `u${Date.now().toString(36)}`, kind, tier: f.get("tier"), unit: parseInt(f.get("unit"), 10) || 1 };
    let obj;
    if (kind === "grammar") {
      obj = { ...base, form: f.get("form").trim(), zh: f.get("zh").trim(), en: f.get("en").trim(), note: f.get("note").trim(),
        ex: f.get("ex").split("\n").map((l) => l.split("|").map((s) => s.trim())).filter((p) => p[0]).map(([ko, zh = "", en = ""]) => ({ ko, zh: zh || "—", en: en || "—" })) };
    } else {
      obj = { ...base, ko: f.get("ko").trim(), hanja: f.get("hanja").trim() || null, zh: f.get("zh").trim(), en: f.get("en").trim(), pos: f.get("pos").trim() || "n",
        ex: f.get("ex").trim() || "—", exZh: f.get("exZh").trim() || "—", exEn: f.get("exEn").trim() || "—", check: f.get("check") === "on" };
    }
    const errs = validateItem(obj, kind);
    if (errs.length) { ev.preventDefault(); alert("Can't save: " + errs.join(", ")); return; }
    state.custom = (state.custom || []).filter((c) => c.id !== obj.id); state.custom.push(obj);
    persist(); rebuild(); render();
  };
  dlg.showModal();
}

// ---------- events ----------
document.addEventListener("click", (e) => {
  const t = e.target.closest("[data-tab],[data-go],[data-flip],[data-grade],[data-tier],[data-add],[data-edit],[data-reset],[data-unit],[data-export],[data-import],[data-wipe],[data-theme],#card,.item");
  if (!t) return;
  if (t.dataset.tab || t.dataset.go) { tab = t.dataset.tab || t.dataset.go; if (t.dataset.go === "learn") learnUnitKey = null; flipped = false; queue = []; window.scrollTo(0, 0); return render(); }
  if (t.dataset.flip !== undefined || t.id === "card") { flipped = !flipped; return render(); }
  if (t.dataset.grade) {
    const it = queue.shift(); if (!it) return;
    state.progress[it.id] = grade(state.progress[it.id], t.dataset.grade, Date.now());
    if (t.dataset.grade === "again") queue.push(it);
    persist(); flipped = false; return render();
  }
  if (t.dataset.tier) { browse.tier = t.dataset.tier; return render(); }
  if (t.dataset.add !== undefined) return openEditor(null);
  if (t.dataset.edit) { e.stopPropagation(); return openEditor(items.find((i) => i.id === t.dataset.edit)); }
  if (t.dataset.reset) { e.stopPropagation(); delete state.progress[t.dataset.reset]; persist(); return render(); }
  if (t.classList.contains("item")) { t.classList.toggle("open"); return; }
  if (t.dataset.unit) { learnUnitKey = t.dataset.unit; tab = "learn"; queue = []; return render(); }
  if (t.dataset.export !== undefined) {
    const name = `korean-backup-${new Date().toISOString().slice(0, 10)}.json`;
    const json = exportJSON(state);
    const file = new File([json], name, { type: "application/json" });
    // iOS: the share sheet (Save to Files) is the reliable route; a blob download from a home-screen app is not.
    if (navigator.canShare?.({ files: [file] })) { navigator.share({ files: [file], title: name }).catch(() => {}); return; }
    const a = Object.assign(document.createElement("a"), { href: URL.createObjectURL(file), download: name });
    a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 30000); return;
  }
  if (t.dataset.import !== undefined) return $("#file").click();
  if (t.dataset.wipe !== undefined) { if (confirm("Erase all progress on this device? Custom words are kept.")) { state.progress = {}; persist(); render(); } return; }
  if (t.dataset.theme !== undefined) {
    const order = ["auto", "light", "dark"]; const next = order[(order.indexOf(state.settings.theme || "auto") + 1) % 3];
    state.settings.theme = next; persist(); applyTheme(); return render();
  }
});
// Only the list re-renders while typing, so the IME composition (Korean jamo, pinyin/zhuyin candidates) is never interrupted.
document.addEventListener("input", (e) => { if (e.target.id === "q") { browse.q = e.target.value; const l = $("#browse-list"); if (l) l.innerHTML = browseListHTML(browseList()); } });
document.addEventListener("change", (e) => {
  if (e.target.id === "unit-pick") { learnUnitKey = e.target.value; queue = []; flipped = false; render(); }
  if (e.target.id === "file") {
    const f = e.target.files[0]; if (!f) return;
    f.text().then((txt) => {
      let s; try { s = importJSON(txt); } catch (err) { alert(err.message); return; }
      if (!confirm("Replace the progress AND custom words on this device with the backup?")) return;
      state = s; persist(); rebuild(); render();
    });
    e.target.value = "";
  }
});

function applyTheme() {
  const t = state.settings.theme;
  if (t === "light" || t === "dark") document.documentElement.dataset.theme = t; else delete document.documentElement.dataset.theme;
}

// ---------- boot ----------
applyTheme();
render();
setInterval(() => { if (tab === "home") render(); }, 60000);
const refresh = () => { if (document.visibilityState === "visible" && (tab === "home" || tab === "review")) render(); };
document.addEventListener("visibilitychange", refresh); window.addEventListener("pageshow", refresh);
if ("serviceWorker" in navigator) navigator.serviceWorker.register("./sw.js").catch(() => {});

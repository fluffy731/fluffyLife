// Pack-driven study engine. `start(pack)` runs one app (Korean or Cantonese); the pack supplies
// data, tiers, UI strings, card renderers, storage key and speech languages.
import { grade } from "./lib/sm2.js";
import { buildUnits, isLearned, currentUnit, isUnlocked, dueItems, unseenItems, pickHourItems, seen, kindOf } from "./lib/track.js";
import { wordOfHour } from "./lib/hour.js";
import { load, save, exportJSON, importJSON } from "./lib/store.js";
import { mergeItems } from "./lib/validate.js";
import { clipName } from "./lib/audio.js";
import { createQuiz } from "./quiz-view.js";
import { searchDict } from "./lib/dict.js";

// ---------- state ----------
let pack, t, ctx, ls, state, items, vocab, grammar, units, quiz;
let tab = "home";
let learnUnitKey = null;   // null = current unit
let flipped = false;
let queue = [];            // current learn/review queue
let browse = { q: "", tier: "all", kind: "all" };
// Offline dictionary (Korean app): loaded on first Browse search, then served offline by the service worker.
let dict = { state: "idle", rows: null, hits: [] };
function loadDict() {
  if (!pack.dict || dict.state !== "idle") return;
  dict.state = "loading";
  fetch(pack.dict.url).then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
    .then((j) => { dict = { state: "ready", rows: j.rows, hits: [] }; })
    .catch(() => { dict.state = "error"; })
    .finally(() => { const l = $("#browse-list"); if (tab === "browse" && l) l.innerHTML = browseListHTML(browseList()); });
}
function dictHTML(list) {
  const q = browse.q.trim();
  if (!pack.dict || !q) return "";
  loadDict();
  if (dict.state !== "ready") return `<h2>${t.dictTitle}</h2><div class="small muted">${dict.state === "error" ? t.dictError : t.dictLoading}</div>`;
  const have = new Set(list.map((i) => i.ko).filter(Boolean));
  dict.hits = searchDict(dict.rows, q).filter((r) => !have.has(r[0]));
  return `<h2>${t.dictTitle}</h2>` + (dict.hits.length ? `<div class="list">${dict.hits.map((r, i) => `<div class="item dict">
      <div class="row"><div><b>${esc(r[0])}</b>${r[1] && r[1] !== r[0] ? `<span class="hj" lang="zh-Hant">${esc(r[1])}</span>` : ""}${r[3] ? ` <span class="rr">[${esc(r[3])}]</span>` : ""}</div><span class="meta"><span class="pill">${esc(r[2])}</span></span></div>
      <div class="meta" lang="en">${esc(r[4])}</div>
      <div class="more">${r[5] ? `<div><b>${esc(r[5])}</b> ${say(r[5])}<br><span class="muted">${esc(r[6])}</span></div>` : ""}
        <div class="actions"><button class="btn" data-say="${esc(r[0])}">${t.listenBtn}</button>${r[2] === "字" ? "" : `<button class="btn primary" data-dictadd="${i}">${t.dictAdd}</button>`}</div></div></div>`).join("")}</div>` : `<div class="small muted">${t.dictNone}</div>`);
}

const KINDS = () => [["all", t.all], ["word", t.words], ["phrase", t.phrases], ["grammar", t.grammar]];

function rebuild() {
  const custom = state.custom || [];
  vocab = mergeItems(pack.vocab, custom.filter((c) => c.kind !== "grammar"));
  grammar = mergeItems(pack.grammar, custom.filter((c) => c.kind === "grammar"));
  items = [...vocab, ...grammar];
  units = buildUnits(vocab, grammar, pack.tiers.map((x) => x.key));
}

const persist = () => save(ls, state, pack.storageKey);
const tierLabel = (k) => pack.tiers.find((x) => x.key === k)?.label ?? k;
const unitTitle = (u) => (pack.unitTitles?.[u] ? ` · ${esc(pack.unitTitles[u])}` : "");
const $ = (s, r = document) => r.querySelector(s);
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const isGrammar = (it) => "form" in it;
const say = (text) => `<button class="say" data-say="${esc(text)}" aria-label="${t.listen}" title="${t.listen}">🔊</button>`;
const DAY = 86400000;

function fmtDue(ms) {
  const d = ms - Date.now();
  if (d <= 0) return t.now;
  if (d < 3600000) return t.minutes(Math.max(1, Math.round(d / 60000)));
  if (d < DAY) return t.hours(Math.round(d / 3600000));
  return t.days(Math.round(d / DAY));
}

// ---------- card ----------
const cardHTML = (it, open) => pack.cards.card(it, open, ctx);

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
      <div class="stat"><b>${due.length}</b><span>${t.dueNow}</span></div>
      <div class="stat"><b>${seenCount}</b><span>${t.ofSeen(items.length)}</span></div>
      <div class="stat"><b>${idx + 1}/${units.length}</b><span>${t.unit}</span></div>
    </div>
    <h2>${t.wordOfHour}</h2>
    ${hour ? cardHTML(hour, flipped) : `<div class="card empty">${t.noItems}</div>`}
    <div class="small muted" style="margin-top:6px">${t.changesAt(nextHour.getHours().toString().padStart(2, "0"))} · ${esc(tierLabel(cur.tier))}</div>${pack.homeExtra ? pack.homeExtra(ctx) : ""}
    <h2>${t.currentUnit}</h2>
    <div class="card">
      <div class="row"><b>${esc(tierLabel(cur.tier))} · ${t.unitN(esc(cur.unit))}${unitTitle(cur.unit)}</b><span class="pill ${esc(cur.tier)}">${esc(cur.tier)}</span></div>
      <div class="progress-line"><i style="width:${(learnedInUnit / cur.items.length) * 100}%"></i></div>
      <div class="small muted" style="margin-top:6px">${t.introduced(learnedInUnit, cur.items.length, cur.items.filter(isGrammar).length)}</div>
      <div class="actions">
        <button class="btn primary" data-go="learn">${t.learnNew}</button>
        <button class="btn" data-go="review">${t.review} ${due.length ? `(${due.length})` : ""}</button>
      </div>
    </div>
    ${quiz.homeCard()}
    ${t.hourlyTip}</div>`;
}

function renderLearn() {
  const unit = (learnUnitKey && units.find((u) => u.key === learnUnitKey)) || currentUnit(units, state.progress);
  const unlocked = isUnlocked(units, units.indexOf(unit), state.progress);
  const kind = state.settings.learnKind || "all";
  const qkey = `${unit.key}:${kind}`;
  if (!queue.length || queue._key !== qkey) { queue = unseenItems(unit, state.progress).filter((i) => kind === "all" || kindOf(i) === kind); queue._key = qkey; flipped = false; }
  const chips = `<div class="chips">${KINDS().map(([k, l]) => `<button data-lkind="${k}" class="${kind === k ? "on" : ""}">${l}</button>`).join("")}</div>`;
  const header = chips + `<div class="row" style="margin-bottom:10px">
      <select id="unit-pick">${units.map((u) => `<option value="${esc(u.key)}" ${u.key === unit.key ? "selected" : ""}>${esc(tierLabel(u.tier))} · ${t.unitN(esc(u.unit))}${unitTitle(u.unit)}${isLearned(u, state.progress) ? " ✓" : ""}${quiz.passed(u.key) ? " 🏅" : ""}</option>`).join("")}</select>
    </div>`;
  if (!queue.length && kind !== "all" && unseenItems(unit, state.progress).length) {
    return header + `<div class="card empty"><b>${t.noKindLeft(KINDS().find(([k]) => k === kind)[1])}</b><div class="actions" style="grid-template-columns:1fr"><button class="btn" data-lkind="all">${t.all}</button></div></div>`;
  }
  if (!queue.length) return header + `<div class="card empty"><b>${t.unitDone}</b>${isLearned(unit, state.progress) ? t.unitDoneHint : ""}</div>`;
  const it = queue[0];
  return header + (unlocked ? "" : `<div class="small muted" style="margin-bottom:8px">${t.jumpedAhead}</div>`) +
    `<div class="small muted" style="margin-bottom:8px">${t.leftInUnit(queue.length)}</div>` +
    cardHTML(it, flipped) +
    (flipped ? `<div class="actions">
        <button class="btn primary" data-grade="good">${t.gotIt} <small>${t.reviewIn(esc(preview(it, "good")))}</small></button>
        <button class="btn" data-grade="easy">${t.alreadyKnew} <small>${t.reviewIn(esc(preview(it, "easy")))}</small></button>
      </div>` : `<div class="actions"><button class="btn primary" data-flip>${t.showMeaning}</button><button class="btn" data-grade="easy">${t.alreadyKnew}</button></div>`);
}

function renderReview() {
  const due = dueItems(items, state.progress, Date.now());
  if (!queue.length || queue._key !== "review") { queue = due; queue._key = "review"; flipped = false; }
  const live = queue.filter((i) => state.progress[i.id] && state.progress[i.id].due <= Date.now()); live._key = "review"; queue = live;
  if (!queue.length) {
    const dues = items.filter((i) => seen(state.progress, i.id)).map((i) => state.progress[i.id].due).sort((a, b) => a - b);
    const next = dues.find((d) => d > Date.now());
    return `<div class="card empty"><b>${t.nothingDue}</b>${next ? t.nextReview(fmtDue(next)) : t.learnFirst}</div>`;
  }
  const it = queue[0];
  return `<div class="small muted" style="margin-bottom:8px">${t.nDue(queue.length)}</div>` + cardHTML(it, flipped) +
    (flipped ? `<div class="grades">
        <button class="btn again" data-grade="again">${t.again}<small>${t.now}</small></button>
        <button class="btn hard" data-grade="hard">${t.hard}<small>${esc(preview(it, "hard"))}</small></button>
        <button class="btn good" data-grade="good">${t.good}<small>${esc(preview(it, "good"))}</small></button>
        <button class="btn easy" data-grade="easy">${t.easy}<small>${esc(preview(it, "easy"))}</small></button>
      </div>` : `<div class="actions" style="grid-template-columns:1fr"><button class="btn primary" data-flip>${t.showAnswer}</button></div>`);
}
const preview = (it, g) => { const s = grade(state.progress[it.id], g, Date.now()); return s.interval ? t.days(s.interval) : t.now; };

function renderBrowse() {
  const list = browseList();
  return `<input type="search" id="q" placeholder="${t.searchPlaceholder}" value="${esc(browse.q)}">
    <div class="chips">${KINDS().map(([k, l]) => `<button data-kind="${k}" class="${browse.kind === k ? "on" : ""}">${l}</button>`).join("")}
      ${pack.editable ? `<button data-add style="margin-left:auto">${t.add}</button>` : ""}</div>
    <div class="chips">${["all", ...pack.tiers.map((x) => x.key)].map((k) => `<button data-tier="${k}" class="${browse.tier === k ? "on" : ""}">${k === "all" ? t.anyLevel : pack.tiers.find((x) => x.key === k).short}</button>`).join("")}</div>
    <div id="browse-list">${browseListHTML(list)}</div>`;
}

function browseList() {
  const q = browse.q.trim().toLowerCase();
  return items.filter((i) => (browse.tier === "all" || i.tier === browse.tier) &&
    (browse.kind === "all" || kindOf(i) === browse.kind) &&
    (!q || pack.cards.searchText(i).some((f) => f && String(f).toLowerCase().includes(q))));
}

function browseListHTML(list) {
  return `<div class="small muted" style="margin-bottom:8px">${t.nItems(list.length)}</div>
    <div class="list">${list.slice(0, 200).map((i) => {
      const p = state.progress[i.id];
      const status = !p ? t.statusNew : p.due <= Date.now() ? t.statusDue : t.statusIn(fmtDue(p.due));
      return pack.cards.browseRow(i, status, ctx);
    }).join("")}${list.length > 200 ? `<div class="small muted">${t.showingFirst}</div>` : ""}</div>${dictHTML(list)}`;
}

function renderSettings() {
  return `<h2>${t.studyTrack}</h2>
    <div class="list">${units.map((u, i) => {
      const done = u.items.length - unseenItems(u, state.progress).length;
      const cur = currentUnit(units, state.progress) === u;
      return `<div class="unit ${isUnlocked(units, i, state.progress) ? "" : "locked"} ${cur ? "current" : ""}" data-unit="${esc(u.key)}">
        <span class="pill ${esc(u.tier)}">${esc(u.tier)}</span><span style="min-width:52px">${t.unitN(esc(u.unit))}${unitTitle(u.unit)}</span>
        <div class="bar"><i style="width:${(done / u.items.length) * 100}%"></i></div>
        <span class="small muted">${done}/${u.items.length}</span></div>`;
    }).join("")}</div>${pack.settingsExtra ? pack.settingsExtra(ctx) : ""}
    <h2>${t.data}</h2>
    <div class="card">
      <div class="actions">
        <button class="btn" data-export>${t.exportBackup}</button>
        <button class="btn" data-import>${t.importBackup}</button>
      </div>
      <input type="file" id="file" accept="application/json" hidden>
      <div class="actions"><button class="btn" data-theme>${t.theme(esc(state.settings.theme || "auto"))}</button><button class="btn" data-wipe style="color:var(--bad)">${t.resetAll}</button></div>
      <p class="small muted">${t.progressNote}</p>
      <p class="small muted">${t.packLine(esc(pack.id), pack.vocab.length, pack.grammar.length, (state.custom || []).length)}</p>${pack.dict ? `<p class="small muted">${t.dictSource}</p>` : ""}
    </div>
    <h2>${t.speechCheck}</h2>
    <div class="card"><button class="btn" data-speechtest style="width:100%">${t.speechCheckBtn}</button><pre id="speech-log" class="speech-log"></pre></div>`;
}

const VIEWS = { home: renderHome, learn: renderLearn, review: renderReview, quiz: () => quiz.render(), browse: renderBrowse, settings: renderSettings };

function render() {
  $("#view").innerHTML = VIEWS[tab]();
  document.querySelectorAll("#tabs button").forEach((b) => b.classList.toggle("active", b.dataset.tab === tab));
  const due = dueItems(items, state.progress, Date.now()).length;
  const badge = $("#due-badge"); badge.hidden = !due; badge.textContent = due;
}

// ---------- editing ----------
function openEditor(existing, prefill = {}) {
  const cur = currentUnit(units, state.progress);
  const it = existing || { kind: "vocab", tier: cur.tier, unit: cur.unit, ...prefill };
  const g = existing ? isGrammar(existing) : false;
  const ex = g ? (it.ex || []).map((e) => `${e.ko} | ${e.zh} | ${e.en}`).join("\n") : "";
  $("#dlg").innerHTML = `<form method="dialog" class="form" id="edit">
    <h3 style="margin:0 0 4px">${existing ? "Edit" : "Add"} ${g ? "grammar" : "word"}</h3>
    ${existing ? "" : `<label>Type <select name="kind"><option value="vocab">Word</option><option value="grammar">Grammar</option></select></label>`}
    <div id="fields"></div>
    <label>Tier <select name="tier">${pack.tiers.map((x) => `<option value="${x.key}" ${it.tier === x.key ? "selected" : ""}>${x.label}</option>`).join("")}</select></label>
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
    const errs = pack.validate(obj, kind);
    if (errs.length) { ev.preventDefault(); alert("Can't save: " + errs.join(", ")); return; }
    state.custom = (state.custom || []).filter((c) => c.id !== obj.id); state.custom.push(obj);
    persist(); rebuild(); render();
  };
  dlg.showModal();
}

// ---------- events ----------
const Q_KEYS = ["qstart", "qopt", "qnext", "qretake", "qback", "qreplay", "qmiss"];
function bindEvents() {
  document.addEventListener("click", (e) => {
    const el = e.target.closest("[data-speechtest],[data-setting],[data-say],[data-tab],[data-go],[data-flip],[data-grade],[data-tier],[data-kind],[data-add],[data-edit],[data-reset],[data-unit],[data-export],[data-import],[data-wipe],[data-theme],[data-qstart],[data-qopt],[data-qnext],[data-qretake],[data-qback],[data-qreplay],[data-qmiss],[data-lkind],[data-dictadd],#card,.item");
    if (!el) return;
    if (el.dataset.say !== undefined) { e.stopPropagation(); return speak(el.dataset.say); }
    if (el.dataset.speechtest !== undefined) return speechCheck();
    if (Q_KEYS.some((k) => el.dataset[k] !== undefined)) {
      if (el.dataset.qstart !== undefined && tab !== "quiz") { tab = "quiz"; window.scrollTo(0, 0); }
      quiz.click(el); return render();
    }
    if (el.dataset.setting) { state.settings[el.dataset.setting] = el.dataset.value; persist(); queue = []; flipped = false; return render(); }
    if (el.dataset.tab || el.dataset.go) { tab = el.dataset.tab || el.dataset.go; if (el.dataset.go === "learn") learnUnitKey = null; if (tab !== "quiz") quiz.reset(); flipped = false; queue = []; window.scrollTo(0, 0); return render(); }
    if (el.dataset.flip !== undefined || el.id === "card") { flipped = !flipped; return render(); }
    if (el.dataset.grade) {
      const it = queue.shift(); if (!it) return;
      state.progress[it.id] = grade(state.progress[it.id], el.dataset.grade, Date.now());
      if (el.dataset.grade === "again") queue.push(it);
      persist(); flipped = false; return render();
    }
    if (el.dataset.tier) { browse.tier = el.dataset.tier; return render(); }
    if (el.dataset.kind) { browse.kind = el.dataset.kind; return render(); }
    if (el.dataset.lkind) { state.settings.learnKind = el.dataset.lkind; persist(); queue = []; flipped = false; return render(); }
    if (el.dataset.add !== undefined) return openEditor(null);
    if (el.dataset.dictadd !== undefined) {
      e.stopPropagation();
      const r = dict.hits[Number(el.dataset.dictadd)]; if (!r) return;
      const POS = { n: "n", v: "v", adj: "adj", adv: "adv" };
      return openEditor(null, { ko: r[0], hanja: r[1] && r[1] !== r[0] ? r[1] : null, zh: r[1] && r[1] !== r[0] ? r[1] : "", en: r[4].split("; ")[0], pos: POS[r[2]] || "n", ex: r[5], exEn: r[6] });
    }
    if (el.dataset.edit) { e.stopPropagation(); return openEditor(items.find((i) => i.id === el.dataset.edit)); }
    if (el.dataset.reset) { e.stopPropagation(); delete state.progress[el.dataset.reset]; persist(); return render(); }
    if (el.classList.contains("item")) { el.classList.toggle("open"); return; }
    if (el.dataset.unit) { learnUnitKey = el.dataset.unit; tab = "learn"; queue = []; return render(); }
    if (el.dataset.export !== undefined) {
      const name = `${pack.backupPrefix}-backup-${new Date().toISOString().slice(0, 10)}.json`;
      const json = exportJSON(state);
      const file = new File([json], name, { type: "application/json" });
      // iOS: the share sheet (Save to Files) is the reliable route; a blob download from a home-screen app is not.
      if (navigator.canShare?.({ files: [file] })) { navigator.share({ files: [file], title: name }).catch(() => {}); return; }
      const a = Object.assign(document.createElement("a"), { href: URL.createObjectURL(file), download: name });
      a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 30000); return;
    }
    if (el.dataset.import !== undefined) return $("#file").click();
    if (el.dataset.wipe !== undefined) { if (confirm(t.confirmWipe)) { state.progress = {}; state.quiz = { units: {}, practice: [] }; persist(); render(); } return; }
    if (el.dataset.theme !== undefined) {
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
        let s; try { s = importJSON(txt, pack.validate); } catch (err) { alert(err.message); return; }
        if (!confirm(t.confirmImport)) return;
        state = s; persist(); rebuild(); render();
      });
      e.target.value = "";
    }
  });
}

// Speaks `text` with the first installed voice matching one of pack.speechLang, in order
// (Cantonese: zh-HK, then zh-TW). With several candidate languages and no installed voice for any
// of them it says so in the pack's own language instead of failing silently.
let lastSpeak = "none yet";
// Recorded clips: the iPhone mutes its built-in speech voice when the ring/silent switch is on silent,
// whatever the page asks for, but it plays audio files. So 🔊 plays a pre-generated clip when one
// exists (see scripts/gen_audio.py) and only falls back to the device voice otherwise.
let clips = null;          // Set of clip names deployed for this pack, or null when none
let clipPlayer = null;     // one reused <audio> element (iOS lets a tapped element keep playing)
function loadClips() {
  if (!pack.audio) return;
  fetch(`${pack.audio.base}index.json`).then((r) => (r.ok ? r.json() : null)).then((j) => { clips = j && Array.isArray(j.clips) ? new Set(j.clips) : null; }).catch(() => {});
}
function clipFor(text) {
  if (!clips || !pack.audio) return null;
  const name = clipName(pack.audio.voice, pack.speechClean(text));
  return clips.has(name) ? `${pack.audio.base}${name}.mp3` : null;
}
// iPhone: a web page's default audio session is "ambient", which the ring/silent switch mutes —
// speech then runs (start/end fire) but nothing is heard. "playback" (iOS 16.4+) plays it like a
// media app. Side effect: background music pauses while a word is spoken.
function audible() {
  if ("audioSession" in navigator) { try { navigator.audioSession.type = "playback"; } catch { /* unsupported type */ } }
}
function speak(text) {
  const url = clipFor(text);
  if (url) {
    audible();
    clipPlayer ??= new Audio();
    clipPlayer.src = url;
    lastSpeak = `clip ${url.split("/").pop()}`;
    // play() must be called inside the tap; if the file fails (offline and never cached), use the device voice.
    clipPlayer.play().catch((e) => { lastSpeak += ` → ${e.name}, device voice`; speakDevice(text); });
    return;
  }
  speakDevice(text);
}

function speakDevice(text) {
  if (!("speechSynthesis" in window)) { lastSpeak = "no speechSynthesis"; alert(t.noSpeech); return; }
  const voices = speechSynthesis.getVoices();
  const norm = (l) => l.replace("_", "-").toLowerCase();
  let lang = pack.speechLang[0], voice = null;
  for (const l of pack.speechLang) {
    voice = voices.find((v) => norm(v.lang) === norm(l)) ?? (pack.speechLang.length === 1 ? voices.find((v) => norm(v.lang).startsWith(norm(l).split("-")[0])) : null);
    if (voice) { lang = l; break; }
  }
  // An empty list means the voices have not loaded yet (common in Safari): speak anyway and let the OS pick.
  if (!voice && voices.length && pack.speechLang.length > 1) { lastSpeak = `refused: ${voices.length} voices, none for ${pack.speechLang.join("/")}`; alert(t.noVoice); return; }
  const u = new SpeechSynthesisUtterance(pack.speechClean(text));
  u.lang = lang; u.rate = 0.85;
  if (voice) u.voice = voice;
  lastSpeak = `spoke lang=${lang} voice=${voice ? voice.name : "(os default)"} of ${voices.length}`;
  u.onerror = (e) => { lastSpeak += ` → error ${e.error}`; };
  audible();
  speechSynthesis.cancel(); speechSynthesis.speak(u);
}

// Settings → speech check: shows what this device reports and speaks one test phrase with event timing.
// Diagnostic only; it does not change how 🔊 behaves.
function speechCheck() {
  const out = $("#speech-log"); if (!out) return;
  out.textContent = "";
  const log = (m) => { out.textContent += m + "\n"; };
  const standalone = window.matchMedia?.("(display-mode: standalone)").matches || navigator.standalone === true;
  log(`mode: ${standalone ? "home-screen app" : "browser tab"}`);
  log(`system: ${(navigator.userAgent.match(/(iPhone|iPad|Android)[^;)]*;?[^;)]*/) || [navigator.platform])[0]}`);
  log(`last 🔊 tap: ${lastSpeak}`);
  log(`audio session: ${"audioSession" in navigator ? navigator.audioSession.type : "not supported"}`);
  log(`recorded clips: ${clips?.size ? `${clips.size} available` : "none deployed (device voice only)"}`);
  const testClip = clipFor(pack.speechTest);
  if (testClip) { log(`test: playing clip for "${pack.speechTest}" (what 🔊 does)`); speak(pack.speechTest); return; }
  if (!("speechSynthesis" in window)) { log("speechSynthesis: MISSING"); return; }
  const report = (label) => {
    const v = speechSynthesis.getVoices();
    const rel = v.filter((x) => /^(ko|zh|yue)/i.test(x.lang.replace("_", "-")));
    log(`${label}: ${v.length} voices; ko/zh/yue: ${rel.map((x) => `${x.lang} ${x.name}`).join(", ") || "none"}`);
  };
  report("voices now");
  log(`wanted: ${pack.speechLang.join(" → ")} · speaking=${speechSynthesis.speaking} pending=${speechSynthesis.pending} paused=${speechSynthesis.paused}`);
  const u = new SpeechSynthesisUtterance(pack.speechTest);
  u.lang = pack.speechLang[0]; u.rate = 0.85;
  const t0 = performance.now(), ms = () => Math.round(performance.now() - t0);
  let started = false;
  u.onstart = () => { started = true; log(`test: start +${ms()} ms`); };
  u.onend = () => log(`test: end +${ms()} ms`);
  u.onerror = (e) => log(`test: error "${e.error}" +${ms()} ms`);
  audible();
  speechSynthesis.speak(u);
  log(`test: speak("${pack.speechTest}", ${u.lang}) called with audio session ${"audioSession" in navigator ? navigator.audioSession.type : "n/a"}`);
  setTimeout(() => { if (!started) log("test: no start event after 3 s"); report("voices after 3 s"); }, 3000);
}

function applyTheme() {
  const theme = state.settings.theme;
  if (theme === "light" || theme === "dark") document.documentElement.dataset.theme = theme; else delete document.documentElement.dataset.theme;
}

// ---------- boot ----------
export function start(p) {
  pack = p; t = pack.ui;
  ctx = { esc, say, t, isGrammar, get settings() { return state.settings; }, get tab() { return tab; } };
  // Safari with "Block All Cookies" throws on localStorage access; fall back to memory so the app still renders.
  ls = (() => { try { const l = window.localStorage; l.getItem("probe"); return l; } catch { const m = {}; return { getItem: (k) => m[k] ?? null, setItem: (k, v) => { m[k] = String(v); } }; } })();
  state = load(ls, { key: pack.storageKey, validate: pack.validate });
  if (pack.migrate) { state = pack.migrate(state); persist(); }
  rebuild();
  loadClips();
  quiz = createQuiz({
    pack, t, esc, ctx, persist, isGrammar, tierLabel, unitTitle, speak, cardHTML,
    state: () => state, units: () => units, items: () => items,
    isLearned: (u) => isLearned(u, state.progress), unseenCount: (u) => unseenItems(u, state.progress).length,
    // Offline the clip index can still be cached while the mp3s (never cached) are not: no audio questions then.
    hasClip: (text) => navigator.onLine !== false && !!clipFor(text),
  });
  document.querySelectorAll("#tabs button").forEach((b) => { b.lastChild.textContent = t.tabs[b.dataset.tab]; });
  bindEvents();
  applyTheme();
  render();
  setInterval(() => { if (tab === "home") render(); }, 60000);
  const refresh = () => { if (document.visibilityState === "visible" && (tab === "home" || tab === "review")) render(); };
  document.addEventListener("visibilitychange", refresh); window.addEventListener("pageshow", refresh);
  if ("serviceWorker" in navigator) navigator.serviceWorker.register(pack.swPath).catch(() => {});
}

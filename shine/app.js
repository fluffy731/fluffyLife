// A Night to Shine · MC script. Two MCs; who speaks which language is set by SPEAKER in data.js (for now Solomon: English, Wade: Mandarin in simplified Chinese).
// TBC answers are kept in this browser only (localStorage); "Copy for co-MC" moves them to the other phone.
import { EVENT, SPEAKER, DEFAULTS, GROUPS, FIELDS, LISTS, ENTRANCE, SEGMENTS, RUNSHEET, RUNSHEET_NOTE, NOTES } from "./data.js";

const KEY = "shine-2026-11-13";
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

let S = {};
try { S = JSON.parse(localStorage.getItem(KEY)) || {}; } catch { S = {}; }
S.f ||= {}; S.drawn ||= {}; S.who ||= "both"; S.done ||= {}; S.cut ||= {}; S.ed ||= {};
// Delete-a-line (last-minute changes): S.cut holds the lines this phone has removed. A line is keyed by its segment, position and
// first words, so if the script is updated and that line changes, it simply comes back. Edit mode is never saved, so a reload is safe.
let editing = false, editKey = null;
// S.ed holds lines this phone has reworded (same key as S.cut); the {placeholders} in the new text still fill in.
const lineText = (k) => { for (const s of SEGS) for (let i = 0; i < s.items.length; i++) if (keyOf(s, s.items[i], i) === k) return String(s.items[i][1]); return ""; };
const keyOf = (s, it, i) => `${s.t}|${i}|${String(it[1]).slice(0, 20)}`;
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch { /* private mode: keep working without saving */ } };

// ---------- Field registry ----------
const META = {};
for (const [k, zh, en, group, ex, opt] of FIELDS) META[k] = { zh, en, group, ex, opt: !!opt };
for (const [name, L] of Object.entries(LISTS))
  for (let i = 1; i <= L.n; i++) for (const [c, zh, en] of L.cols) META[c + i] = { zh: `${zh} ${i}`, en: `${en} ${i}`, group: L.group, list: name };
// A value typed in this browser (even an empty one) wins over the default shipped in data.js.
const raw = (k) => S.f[k] ?? DEFAULTS[k] ?? "";
const val = (k) => String(raw(k)).trim();
const rowDone = (L, j) => L.cols.every(([c]) => val(c + j));
const rowAny = (L, j) => L.cols.some(([c]) => val(c + j));
const listDone = (L) => {
  const rows = Array.from({ length: L.n }, (_, j) => rowDone(L, j + 1));
  return L.need === "all" ? rows.every(Boolean) : rows.some(Boolean);
};
function tbcItems() {
  const out = FIELDS.filter((f) => !f[5]).map(([k, zh, en, group]) => ({ k, zh, en, group, done: !!val(k) }));
  for (const [name, L] of Object.entries(LISTS)) out.push({ k: name, zh: L.zh, en: L.en, group: L.group, done: listDone(L), list: true });
  return out;
}

// ---------- Time ----------
const mins = (hm) => { const [h, m] = hm.split(":").map(Number); return h * 60 + m; };
const hm12 = (hm) => { const m = typeof hm === "number" ? hm : mins(hm), h = Math.floor(m / 60); return `${((h + 11) % 12) + 1}:${String(m % 60).padStart(2, "0")}`; };
const ampm = (hm) => (mins(hm) >= 720 ? "pm" : "am");
const SEGS = SEGMENTS.map((s, i) => ({ ...s, i, a: mins(s.t), b: mins(s.e) }));
let sim = null;
try { const q = new URLSearchParams(location.search).get("at"); if (q && /^\d{1,2}:\d{2}$/.test(q)) sim = mins(q); } catch { /* no query string in some viewers */ }
function now() {
  const d = new Date(), [Y, M, D] = EVENT.date;
  const day = sim !== null || (d.getFullYear() === Y && d.getMonth() + 1 === M && d.getDate() === D);
  const m = sim ?? d.getHours() * 60 + d.getMinutes();
  const daysTo = Math.round((new Date(Y, M - 1, D) - new Date(d.getFullYear(), d.getMonth(), d.getDate())) / 864e5);
  return { d, m, day, daysTo, cur: day ? SEGS.find((s) => m >= s.a && m < s.b) : null };
}

// ---------- Rendering helpers ----------
// A speaker letter ("S" or "W") maps to the language that MC speaks; "both" shows both languages.
const LANG = Object.fromEntries(Object.entries(SPEAKER).map(([l, who]) => [who, l]));
const NAME = { S: "Solomon", W: "Wade" };
const showLang = () => LANG[S.who] || "both";
const lang = () => (showLang() === "en" ? "en" : "zh");
const bi = (zh, en) => (showLang() === "en" ? en : showLang() === "zh" ? zh : `${zh} · ${en}`);
function chip(k, l) {
  const m = META[k];
  if (!m) return esc(`{${k}}`);
  const v = val(k);
  return v
    ? `<button type="button" class="v" data-go="${k}" title="${esc(l === "en" ? "Edit" : "修改")}">${esc(v)}</button>`
    : `<button type="button" class="tbc" data-go="${k}"><small>TBC</small>${esc(l === "en" ? m.en : m.zh)}</button>`;
}
const fill = (text, l) => esc(text).replace(/\{(\w+)\}/g, (_, k) => chip(k, l));
const duo = (zh, en, tag = "span") => `<${tag} class="zh" lang="zh-Hans">${fill(zh, "zh")}</${tag}><${tag} class="en" lang="en">${fill(en, "en")}</${tag}>`;

function lineHTML([tag, text, o = {}], k) {
  if (o.if && !val(o.if)) return "";
  const cut = !!S.cut[k];
  if (cut && !editing) return "";
  const edited = S.ed[k] != null, shown = edited ? S.ed[k] : text;
  // Line tags are languages ("zh", "en") or "SW" (said together, shown as Chinese then English).
  // o.who ("S" or "W") overrides who speaks the line, e.g. Solomon in Chinese in the two-man opener.
  const who = tag === "SW" ? "SW" : o.who || SPEAKER[tag], l = tag === "en" ? "en" : "zh";
  const label = { S: NAME.S, W: NAME.W, SW: `${NAME.S} + ${NAME.W}` }[who];
  const badge = `<b class="b ${who}" title="${label}" aria-label="${label}">${who === "SW" ? "S+W" : who}</b>`;
  if (editing && editKey === k) {
    return `<div class="ln edit editing" data-s="${who}">${badge}<div class="ebox"><textarea class="ledit" rows="${Math.max(3, Math.ceil(shown.length / 30))}" lang="${l === "en" ? "en" : "zh-Hans"}" aria-label="${bi("修改这一行", "Edit this line")}">${esc(shown)}</textarea>` +
      (/\{\w+\}/.test(shown) ? `<p class="ehint">${bi("大括号里的内容会自动填入，请保留大括号", "Keep the {braces}: what is inside fills in automatically")}</p>` : "") +
      `<div class="eact"><button type="button" class="primary" data-esave="${esc(k)}">${bi("保存", "Save")}</button><button type="button" data-ecancel="1">${bi("取消", "Cancel")}</button>` +
      (edited ? `<button type="button" data-ereset="${esc(k)}">${bi("还原原文", "Restore original")}</button>` : "") + `</div></div></div>`;
  }
  const btn = !editing ? "" : `<span class="lacts">${cut ? "" : `<button type="button" class="lbtn ed" data-edit="${esc(k)}" aria-label="${bi("修改这一行", "Edit this line")}">✎</button>`}` +
    `<button type="button" class="lbtn${cut ? " back" : ""}" data-cut="${esc(k)}" aria-label="${cut ? bi("恢复这一行", "Restore this line") : bi("删除这一行", "Delete this line")}">${cut ? "↩" : "✕"}</button></span>`;
  return `<div class="ln${o.tpl ? " tpl" : ""}${cut ? " cut" : ""}${edited ? " edited" : ""}${editing ? " edit" : ""}" data-s="${who}">${badge}` +
    `<p lang="${l === "en" ? "en" : "zh-Hans"}">${fill(shown, l)}${o.tpl ? `<small class="tpl-tag">${bi("模板", "pattern")}</small>` : ""}${edited && editing ? `<small class="tpl-tag">${bi("已改", "edited")}</small>` : ""}</p>${btn}</div>`;
}

function listHTML(name, o = {}) {
  const L = LISTS[name], l = lang();
  if (name === "board") {
    return `<ol class="names">${Array.from({ length: L.n }, (_, j) => `<li>${chip("board" + (j + 1), l)}</li>`).join("")}</ol>`;
  }
  if (name === "prizes") {
    // o.from / o.to: the prizes drawn in this round (the draw is split across the evening).
    const from = o.from || 1, to = o.to || L.n;
    const done = Array.from({ length: L.n }, (_, j) => !!S.drawn[j + 1]).filter(Boolean).length;
    return `<div class="prizes"><p class="list-h">${bi(`奖品 ${from}–${to}`, `Prizes ${from}–${to}`)} <span>${bi(`已抽 ${done} / ${L.n}`, `${done} of ${L.n} drawn`)}</span></p><ol>` +
      Array.from({ length: to - from + 1 }, (_, j) => {
        const n = from + j;
        return `<li class="${S.drawn[n] ? "done" : ""}"><input type="checkbox" id="dr${n}" data-drawn="${n}"${S.drawn[n] ? " checked" : ""}>` +
          `<label for="dr${n}" class="no" aria-label="${bi(`第 ${n} 份已抽`, `Prize ${n} drawn`)}">${n}</label>` +
          `<span class="pz">${chip("prize" + n, l)}</span><span class="by">${chip("prizeBy" + n, l)}</span></li>`;
      }).join("") + `</ol></div>`;
  }
  // nepal: show filled rows; while none is filled, one chip stands for the whole list.
  const rows = Array.from({ length: L.n }, (_, j) => j + 1).filter((j) => rowAny(L, j));
  if (!rows.length) return `<p class="list-empty"><button type="button" class="tbc" data-go="award1"><small>TBC</small>${esc(bi("奖项与得奖者", "Awards and recipients"))}</button></p>`;
  return `<ol class="awards">${rows.map((j) => `<li><span class="aw">${chip("award" + j, l)}</span><span class="wn">${chip("winner" + j, l)}</span></li>`).join("")}</ol>`;
}

function itemHTML(it, s, i) {
  const [type] = it;
  if (type === "zh" || type === "en" || type === "SW") return lineHTML(it, keyOf(s, it, i));
  if (type === "cue") return `<p class="cue">${duo(it[1], it[2])}</p>`;
  if (type === "crit") return `<p class="crit">${duo(it[1], it[2])}</p>`;
  if (type === "list") return listHTML(it[1], it[2]);
  if (type === "table") return `<div class="tablewrap"><table class="cuesheet"><thead><tr><th>${bi("歌曲", "Song")}</th><th>${bi("入场", "Who walks in")}</th></tr></thead><tbody>` +
    ENTRANCE.map(([n, zh, en]) => `<tr><td>${esc(n)}</td><td>${duo(zh, en)}</td></tr>`).join("") + `</tbody></table></div>`;
  return "";
}

function segHTML(s) {
  const len = s.b - s.a;
  return `<article class="seg${s.key ? " key" : ""}" id="s${s.i}" data-i="${s.i}">
    <header class="seg-h">
      <div class="seg-meta"><time datetime="2026-11-13T${s.t}">${hm12(s.t)}<small>${ampm(s.t)}</small></time>
        <span class="dur">${len} ${bi("分钟", "min")}</span>${s.key ? `<span class="pill key">${bi("关键", "Key")}</span>` : ""}<span class="pill now">${bi("现在", "Now")}</span><span class="left"></span></div>
      <h2>${duo(s.zh, s.en)}</h2>
      <p class="at">${duo(s.at[0], s.at[1])}</p>
    </header>
    ${s.items.map((it, i) => itemHTML(it, s, i)).join("")}
  </article>`;
}

function renderScript() {
  $("#segs").innerHTML = SEGS.map(segHTML).join("");
  $("#toc").innerHTML = SEGS.map((s) => `<button type="button" data-seg="${s.i}"${s.key ? ' class="key"' : ""}><time>${hm12(s.t)}</time>${esc(lang() === "en" ? s.en : s.zh)}</button>`).join("");
  tick();
}

// ---------- TBC tab ----------
function fieldHTML(k) {
  const m = META[k];
  return `<label class="field" data-key="${k}" for="f-${k}">
    <span class="lab"><span class="zh">${esc(m.zh)}</span><span class="en">${esc(m.en)}</span><span class="tag"></span></span>
    <textarea id="f-${k}" class="fta" rows="${Math.max(1, Math.ceil(String(raw(k)).length / 30))}" data-f="${k}" placeholder="${esc(m.ex || "")}" autocomplete="off" autocapitalize="sentences" enterkeyhint="done">${esc(raw(k))}</textarea>
  </label>`;
}
function listFormHTML(name) {
  const L = LISTS[name];
  return `<div class="lform" data-list="${name}"><p class="lab"><span class="zh">${esc(L.zh)}</span><span class="en">${esc(L.en)}</span><span class="tag"></span></p>` +
    Array.from({ length: L.n }, (_, j) => `<div class="lrow" data-row="${j + 1}"><span class="n">${j + 1}</span>` +
      L.cols.map(([c, zh, en]) => `<input id="f-${c}${j + 1}" data-f="${c}${j + 1}" value="${esc(raw(c + (j + 1)))}" placeholder="${esc(`${zh} · ${en}`)}" aria-label="${esc(`${zh} ${en} ${j + 1}`)}" autocomplete="off" enterkeyhint="next">`).join("") +
      `</div>`).join("") + `</div>`;
}
function buildForm() {
  $("#groups").innerHTML = GROUPS.map(([g, zh, en]) => `<section class="grp" data-group="${g}"><h3>${esc(zh)}${zh !== en ? ` <span>${esc(en)}</span>` : ""}</h3>` +
    FIELDS.filter((f) => f[3] === g).map((f) => fieldHTML(f[0])).join("") +
    Object.entries(LISTS).filter(([, L]) => L.group === g).map(([n]) => listFormHTML(n)).join("") + `</section>`).join("");
  paintForm(); growAll();
}
// The TBC fields are auto-growing boxes, so a long bio is all visible and easy to edit. Hidden panels cannot be measured, so show() grows them again.
const grow = (el) => { if (!el.offsetParent) return; el.style.height = "auto"; if (el.scrollHeight) el.style.height = `${el.scrollHeight + 2}px`; };
const growAll = () => $$(".field textarea.fta").forEach(grow);
addEventListener("resize", growAll);
function paintForm() {
  for (const el of $$(".field[data-key]")) {
    const k = el.dataset.key, m = META[k], v = val(k);
    el.classList.toggle("need", !v && !m.opt);
    el.classList.toggle("opt", !v && m.opt);
    el.classList.toggle("ok", !!v);
    $(".tag", el).textContent = v ? "✓" : m.opt ? "可选 optional" : "TBC";
  }
  for (const el of $$(".lform")) {
    const L = LISTS[el.dataset.list], done = listDone(L);
    $(".tag", el).textContent = done ? "✓" : L.need === "all" ? `TBC · ${Array.from({ length: L.n }, (_, j) => rowDone(L, j + 1)).filter(Boolean).length}/${L.n}` : "TBC";
    el.classList.toggle("ok", done);
    for (const r of $$(".lrow", el)) {
      const j = +r.dataset.row, full = rowDone(L, j), any = rowAny(L, j);
      r.classList.toggle("need", L.need === "all" ? !full : (!done && j === 1) || (any && !full));
      r.classList.toggle("ok", full);
    }
  }
  for (const g of $$(".grp[data-group]")) g.classList.toggle("done", !$(".need", g));
  const items = tbcItems(), left = items.filter((i) => !i.done).length;
  $("#leftN").textContent = left;
  $("#leftWord").textContent = left ? "项待填 · to fill" : "全部填好 · all filled";
  $("#bar").style.width = `${Math.round(((items.length - left) / items.length) * 100)}%`;
  const badge = $("#tbcCount");
  badge.textContent = left || "✓";
  badge.classList.toggle("ok", !left);
}

// ---------- Run sheet & notes ----------
function renderRun() {
  $("#runTable").innerHTML = `<thead><tr><th>${bi("时间", "Time")}</th><th>${bi("环节", "Segment")}</th><th>${bi("要点", "Key points")}</th></tr></thead><tbody>` +
    RUNSHEET.map(([t, zh, en, nz, ne, chg]) => `<tr data-a="${mins(t)}"${chg ? ' class="chg"' : ""}><td><time>${hm12(t)}<small>${ampm(t)}</small></time></td>` +
      `<td>${duo(zh, en)}${chg ? `<span class="pill up">${bi("已更新", "Updated")}</span>` : ""}</td><td>${duo(nz, ne)}</td></tr>`).join("") + `</tbody>`;
  $("#runNote").innerHTML = duo(RUNSHEET_NOTE[0], RUNSHEET_NOTE[1]);
}
function renderNotes() {
  // A reminder with a clock time (third value) gets a tick box and a live countdown; tick() paints the countdown.
  const li = (rows) => rows.map(([zh, en, t]) => t
    ? `<li class="rem" data-a="${mins(t)}" data-k="${t}"><label class="tk"><input type="checkbox"${S.done[t] ? " checked" : ""}><span class="rt"><span class="rh"><time>${hm12(t)} ${ampm(t)}</time><span class="when"></span></span>${duo(zh, en)}</span></label></li>`
    : `<li>${duo(zh, en)}</li>`).join("");
  $("#notesBody").innerHTML = `
    <section class="note-card now-card"><h3>${bi("现在", "Right now")}</h3>
      <p class="big"><time id="noteClock">--:--</time></p><p class="sub" id="noteState"></p><p class="sub" id="noteNext"></p></section>
    <section class="note-card crit-card"><h3>${bi("必须做到", "Must not miss")}</h3><ul>${li(NOTES.crit)}</ul></section>
    <section class="note-card check-card"><h3>${bi("活动前要定", "Settle before the night")}</h3><ul>${li(NOTES.check)}</ul></section>
    <section class="note-card"><h3>${bi("串场", "Linking segments")}</h3><p>${duo(NOTES.link[0], NOTES.link[1])}</p></section>
    <section class="note-card"><h3>${bi("两位 MC", "The two MCs")}</h3>
      ${["S", "W"].map((who) => `<div class="ln" data-s="${who}"><b class="b ${who}">${who}</b><p>${LANG[who] === "en"
        ? duo(`${NAME[who]} · 英语`, `${NAME[who]} · English`)
        : duo(`${NAME[who]} · 普通话（简体中文台词）`, `${NAME[who]} · Mandarin (script in simplified Chinese)`)}</p></div>`).join("")}
      <div class="ln" data-s="SW"><b class="b SW">S+W</b><p>${duo("一起说", "Said together")}</p></div>
      <p class="hint">${duo("各自在手机上选自己的名字：自己的台词放大，搭档的台词变小，用来接话。", "Each MC picks their own name on their phone: your lines show large, your partner's show small so you know when to come in.")}</p></section>
    <section class="note-card"><h3>${bi("活动信息", "Event")}</h3><p>${esc(EVENT.title)} · ${esc(EVENT.en)}<br>${duo("2026 年 11 月 13 日（星期五）", "Friday 13 November 2026")}<br>${esc(EVENT.venue)}<br>${duo("着装：银色 / 香槟色 / 金色", "Dress: silver, champagne, gold")}</p></section>`;
}

const liveKeys = () => new Set(SEGS.flatMap((s) => s.items.map((it, i) => keyOf(s, it, i))));
// The "Delete lines" bar above the script: edit mode on/off, how many lines are removed, and restore-all.
function renderCutbar() {
  const live = liveKeys();
  const n = Object.keys(S.cut).filter((k) => live.has(k)).length;
  const eb = $("#editLines");
  eb.setAttribute("aria-pressed", String(editing));
  eb.textContent = (editing ? "✓ " : "✎ ") + (editing ? bi("完成", "Done") : bi("改稿 / 删行", "Edit / delete lines"));
  const m = Object.keys(S.ed).filter((k) => live.has(k)).length;
  $("#cutN").textContent = [n ? bi(`已删 ${n} 行`, `${n} removed`) : "", m ? bi(`已改 ${m} 行`, `${m} edited`) : ""].filter(Boolean).join(" · ");
  $("#restoreAll").textContent = bi("全部还原", "Reset all");
  $("#restoreAll").hidden = !(n || m);
  $("#cutHint").hidden = !editing;
  $("#cutHint").textContent = bi("点 ✎ 修改这一行，点 ✕ 删掉；灰色划线的是已删，点 ↩ 恢复。只影响这部手机，搭档的手机不会变。", "Tap ✎ to reword a line or ✕ to remove it; struck-through lines are removed, tap ↩ to bring one back. This only changes this phone, not your partner's.");
}
function redrawScript() { const y = scrollY; renderScript(); renderCutbar(); scrollTo(0, y); }
$("#editLines").addEventListener("click", () => { editing = !editing; editKey = null; redrawScript(); });
$("#restoreAll").addEventListener("click", () => { S.cut = {}; S.ed = {}; editKey = null; save(); redrawScript(); });
function renderAll() {
  document.body.dataset.who = S.who; document.body.dataset.lang = showLang();
  for (const b of $$("[data-who]")) b.setAttribute("aria-pressed", String(b.dataset.who === S.who));
  renderScript(); renderRun(); renderNotes(); paintPager(); tick(); renderCutbar();
}
$("#notesBody").addEventListener("change", (e) => {
  const c = e.target.closest("li.rem input");
  if (!c) return;
  const k = c.closest("li.rem").dataset.k;
  if (c.checked) S.done[k] = 1; else delete S.done[k];
  save(); tick();
});

// ---------- Tabs ----------
const PANELS = ["script", "tbc", "run", "notes"];
function show(tab) {
  if (!PANELS.includes(tab)) tab = "script";
  for (const b of $$("#tabs button")) b.setAttribute("aria-current", String(b.dataset.tab === tab));
  for (const p of PANELS) $("#" + p).hidden = p !== tab;
  S.tab = tab; save(); paintPager();
  if (tab === "tbc") growAll();
}
$("#tabs").addEventListener("click", (e) => { const b = e.target.closest("button[data-tab]"); if (b) { show(b.dataset.tab); scrollTo(0, 0); } });

// ---------- Clock and the "now" marker ----------
function tick() {
  const n = now(), first = SEGS[0], last = SEGS[SEGS.length - 1];
  $("#clock").textContent = n.day ? `${hm12(n.m)} ${n.m >= 720 ? "pm" : "am"}` : bi("11月13日", "13 Nov");
  let txt;
  if (n.cur) txt = bi(`${n.cur.zh} · 还剩 ${n.cur.b - n.m} 分钟`, `${n.cur.en} · ${n.cur.b - n.m} min left`);
  else if (n.day && n.m < first.a) txt = bi(`${hm12(first.t)} pm 开始 · 还有 ${first.a - n.m} 分钟`, `Starts ${hm12(first.t)} pm · in ${first.a - n.m} min`);
  else if ((n.day && n.m >= last.b) || n.daysTo < 0) txt = bi("活动已结束", "Event over");
  else txt = bi(`星期五 7 pm 开场 · 还有 ${n.daysTo} 天`, `Friday, 7 pm start · ${n.daysTo} ${n.daysTo === 1 ? "day" : "days"} to go`);
  $("#nowtxt").textContent = txt;
  for (const el of $$(".seg")) {
    const s = SEGS[+el.dataset.i], on = s === n.cur;
    el.classList.toggle("now", on);
    $(".left", el).textContent = on ? bi(`剩 ${s.b - n.m} 分钟`, `${s.b - n.m} min left`) : "";
  }
  for (const b of $$("#toc button")) b.classList.toggle("now", !!n.cur && +b.dataset.seg === n.cur.i);
  const rows = $$("#runTable tr[data-a]");
  let curRow = null;
  if (n.day) for (const r of rows) if (+r.dataset.a <= n.m) curRow = r;
  for (const r of rows) r.classList.toggle("now", r === curRow && n.m < 22 * 60);
  paintNotes(n, txt);
  return n;
}
// Notes tab: the live clock, and each timed reminder as "in 12 min", "now" or "overdue 4 min" until it is ticked off.
// Red only for the first 30 minutes after its time: a night of un-ticked boxes would otherwise be a wall of red.
const OVERDUE = 30;
const gapZh = (d) => { const h = Math.floor(d / 60), m = d % 60; return h ? `${h} 小时${m ? ` ${m} 分钟` : ""}` : `${m} 分钟`; };
const gapEn = (d) => { const h = Math.floor(d / 60), m = d % 60; return h ? `${h} h${m ? ` ${m} min` : ""}` : `${m} min`; };
function paintNotes(n, state) {
  const clock = $("#noteClock");
  if (!clock) return;
  clock.textContent = `${hm12(n.m)} ${n.m >= 720 ? "pm" : "am"}`;
  $("#noteState").textContent = state;
  let next = null, over = 0;
  for (const li of $$("#notesBody li.rem")) {
    const d = +li.dataset.a - n.m, done = !!S.done[li.dataset.k];
    let st = "", txt = "";
    if (done) { st = "done"; txt = bi("✓ 已完成", "✓ done"); }
    else if (n.day) {
      if (d > 0) { st = d <= 10 ? "soon" : "later"; txt = bi(`还有 ${gapZh(d)}`, `in ${gapEn(d)}`); if (!next || d < next.d) next = { li, d }; }
      else if (d === 0) { st = "soon"; txt = bi("现在", "now"); }
      else if (-d <= OVERDUE) { st = "over"; txt = bi(`已超时 ${gapZh(-d)}`, `overdue ${gapEn(-d)}`); over++; }
      else { st = "past"; txt = bi(`${gapZh(-d)}前`, `${gapEn(-d)} ago`); }
    }
    li.dataset.st = st;
    $(".when", li).textContent = txt;
  }
  const el = $("#noteNext");
  if (!n.day) { el.textContent = bi("活动当天，这里会显示倒计时；过了时间还没勾掉的，30 分钟内标红", "On the night this shows countdowns; a reminder past its time and not ticked shows red for 30 minutes"); el.className = "sub"; return; }
  const at = next ? `${hm12(+next.li.dataset.a)} ${+next.li.dataset.a >= 720 ? "pm" : "am"}` : "";
  const nx = next ? bi(`下一项：${at}（还有 ${gapZh(next.d)}）`, `Next: ${at} (in ${gapEn(next.d)})`) : "";
  const ov = over ? bi(`${over} 项已超时`, `${over} overdue`) : "";
  el.className = over ? "sub over" : "sub";
  el.textContent = [ov, nx].filter(Boolean).join(" · ") || bi("提醒都已处理", "All reminders handled");
}
$("#nowbar").addEventListener("click", () => {
  const n = tick();
  show("script");
  goTo($(`#s${(n.cur ?? SEGS[0]).i}`));
});
$("#toc").addEventListener("click", (e) => { const b = e.target.closest("button[data-seg]"); if (b) goTo($(`#s${b.dataset.seg}`)); });

// ---------- Pager (also driven by a Bluetooth page-turner's arrow / Page keys) ----------
const mast = $("#mast");
const headBottom = () => mast.getBoundingClientRect().bottom;
function goTo(el) { if (el) scrollTo({ top: el.getBoundingClientRect().top + scrollY - headBottom() - 10, behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" }); }
function where() {
  const list = $$("#segs .seg"), top = headBottom() + 24;
  let i = -1;
  list.forEach((el, j) => { if (el.getBoundingClientRect().top <= top) i = j; });
  return { list, i };
}
function step(d) {
  const { list, i } = where();
  if (d > 0) { if (i + 1 < list.length) goTo(list[i + 1]); return; }
  const cur = list[i];
  if (cur && cur.getBoundingClientRect().top < headBottom() - 40) goTo(cur);
  else if (i > 0) goTo(list[i - 1]);
}
const segName = (s) => `${hm12(s.t)} ${lang() === "en" ? s.en : s.zh}`;
function paintPager() {
  const pager = $("#pager");
  pager.hidden = S.tab !== "script" && S.tab !== undefined;
  if (pager.hidden) return;
  const { i } = where();
  $("#prevName").textContent = i > 0 ? segName(SEGS[i - 1]) : "—";
  $("#nextName").textContent = i + 1 < SEGS.length ? segName(SEGS[i + 1]) : "—";
}
$("#next").addEventListener("click", () => step(1));
$("#prev").addEventListener("click", () => step(-1));
document.addEventListener("keydown", (e) => {
  if (e.target.closest?.("input, textarea") || S.tab !== "script") return;
  if (["ArrowRight", "ArrowDown", "PageDown"].includes(e.key)) { e.preventDefault(); step(1); }
  else if (["ArrowLeft", "ArrowUp", "PageUp"].includes(e.key)) { e.preventDefault(); step(-1); }
});
let raf = 0;
addEventListener("scroll", () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(paintPager); }, { passive: true });

// ---------- Interactions ----------
document.addEventListener("click", (e) => {
  const go = e.target.closest("[data-go]");
  if (go) {
    const k = go.dataset.go;
    if ($("#onlyBlank").checked) { $("#onlyBlank").checked = false; $("#tbc").classList.remove("only-blank"); }
    show("tbc");
    const input = $(`#f-${k}`);
    if (input) {
      const box = input.closest(".field, .lrow");
      box.scrollIntoView({ block: "center" });
      input.focus({ preventScroll: true });
      box.classList.remove("flash"); void box.offsetWidth; box.classList.add("flash");
    }
    return;
  }
  const edBtn = e.target.closest("button[data-edit], button[data-esave], button[data-ecancel], button[data-ereset]");
  if (edBtn) {
    const d = edBtn.dataset;
    if (d.edit != null) editKey = d.edit;
    else if (d.esave != null) {
      const ta = $(".ledit"), t = ta ? ta.value.replace(/\s*\n\s*/g, " ").trim() : "";
      if (t && t !== lineText(d.esave).trim()) S.ed[d.esave] = t; else delete S.ed[d.esave];
      editKey = null; save();
    } else if (d.ereset != null) { delete S.ed[d.ereset]; editKey = null; save(); }
    else editKey = null;
    redrawScript();
    const box = $(".ledit"); if (box) { box.focus(); box.setSelectionRange(box.value.length, box.value.length); }
    return;
  }
  const cutBtn = e.target.closest("button[data-cut]");
  if (cutBtn) {
    const k = cutBtn.dataset.cut;
    if (S.cut[k]) delete S.cut[k]; else S.cut[k] = 1;
    save(); redrawScript();
    return;
  }
  const who = e.target.closest("button[data-who]");
  if (who) { S.who = who.dataset.who; save(); renderAll(); }
});
document.addEventListener("change", (e) => {
  const t = e.target;
  if (t.dataset.drawn) { S.drawn[t.dataset.drawn] = t.checked; save(); const y = scrollY; renderScript(); scrollTo(0, y); }
  if (t.id === "onlyBlank") $("#tbc").classList.toggle("only-blank", t.checked);
});
let rt = 0;
$("#groups").addEventListener("keydown", (e) => { if (e.key === "Enter" && e.target.classList.contains("fta")) { e.preventDefault(); e.target.blur(); } });
$("#groups").addEventListener("input", (e) => {
  const k = e.target.dataset.f;
  if (!k) return;
  if (e.target.classList.contains("fta")) {
    const v = e.target.value.replace(/\s*\n+\s*/g, " ");
    if (v !== e.target.value) e.target.value = v;
    grow(e.target);
  }
  S.f[k] = e.target.value; save(); paintForm();
  clearTimeout(rt); rt = setTimeout(renderScript, 250);
});

// ---------- Share with the co-MC ----------
// SHINE2 carries the whole master version: TBC entries, removed lines and reworded lines. SHINE1 (entries only) still imports.
const CODE = "SHINE2.", CODE_RE = /SHINE([12])\.([A-Za-z0-9_-]+)/;
function toCode() {
  const f = Object.fromEntries(Object.entries(S.f).filter(([k, v]) => META[k] && String(v).trim() !== String(DEFAULTS[k] ?? "").trim()));
  const live = liveKeys();
  const cut = Object.keys(S.cut).filter((k) => live.has(k));
  const ed = Object.fromEntries(Object.entries(S.ed).filter(([k]) => live.has(k)));
  const bytes = new TextEncoder().encode(JSON.stringify({ v: 2, f, cut, ed }));
  let bin = ""; for (const b of bytes) bin += String.fromCharCode(b);
  return CODE + btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function fromCode(text) {
  const m = String(text).match(CODE_RE);
  if (!m) return null;
  try {
    let b = m[2].replace(/-/g, "+").replace(/_/g, "/"); while (b.length % 4) b += "=";
    const j = JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(b), (c) => c.charCodeAt(0)))) || {};
    const master = m[1] === "2", src = master ? j.f : j;
    const f = {};
    for (const [k, v] of Object.entries(src || {})) if (META[k] && typeof v === "string") f[k] = v.slice(0, 1500);
    const cut = master && Array.isArray(j.cut) ? j.cut.filter((k) => typeof k === "string" && k.length < 200).slice(0, 500) : [];
    const ed = {};
    if (master && j.ed) for (const [k, v] of Object.entries(j.ed)) if (typeof v === "string" && k.length < 200 && v.trim()) ed[k] = v.slice(0, 1500);
    return { master, f, cut, ed };
  } catch { return null; }
}
const onPages = /github\.io$/.test(location.hostname);
$("#copy").addEventListener("click", () => {
  const code = toCode(), text = onPages ? `${location.origin}${location.pathname}#${code}` : code, out = $("#shareOut");
  out.hidden = false; out.value = text;
  const done = (ok) => { $("#copyMsg").textContent = ok ? (onPages ? "已复制链接，发给搭档打开即可 · Link copied: send it to your co-MC" : "已复制，发给搭档粘贴到下方 · Copied: your co-MC pastes it below") : "请手动全选复制 · Select and copy the text above"; if (!ok) out.select(); };
  try { navigator.clipboard.writeText(text).then(() => done(true), () => done(false)); } catch { done(false); }
});
// One-tap sync. The master phone taps "Publish my version": the code goes to a small public relay (ntfy.sh, one private room for this event).
// Every other phone taps "Sync from master": it fetches the newest version, applies it (replacing that phone's edits) and offers Undo.
// If the relay can't be reached (venue wifi, offline) or the code is too big for it, the old route still works: share link, clipboard, or paste on the TBC tab.
// ntfy.sh keeps a message to 4096 bytes, so a big version goes up as numbered parts (SHINE2C.<id>.<part>.<parts>.<text>) and is only used once every part has arrived.
const RELAY = "https://ntfy.sh/", ROOM = "shine-2026-11-13-034ba6ad3b6ea35b", RELAY_MAX = 3600, CHUNK = 3500, MAX_PARTS = 40;
const PART_RE = /^SHINE2C\.([0-9a-z]+)\.(\d+)\.(\d+)\.([\s\S]*)$/;
const syncMsg = (t) => { const el = $("#syncMsg"); el.textContent = t; el.hidden = !t; };
const hhmm = (ms) => new Date(ms).toLocaleTimeString("en-AU", { hour: "2-digit", minute: "2-digit", hour12: false });
const relay = async (path, init) => {
  const ctl = new AbortController(), t = setTimeout(() => ctl.abort(), 8000);
  try { const r = await fetch(RELAY + ROOM + path, { ...init, signal: ctl.signal, cache: "no-store" }); if (!r.ok) throw new Error("relay " + r.status); return r; }
  finally { clearTimeout(t); }
};
async function publish(code) {
  if (code.length <= RELAY_MAX) { await relay("", { method: "POST", body: code }); return 1; }
  const n = Math.ceil(code.length / CHUNK);
  if (n > MAX_PARTS) throw new Error("too big");
  const id = Date.now().toString(36);
  for (let i = 0; i < n; i++) await relay("", { method: "POST", body: `SHINE2C.${id}.${i}.${n}.${code.slice(i * CHUNK, (i + 1) * CHUNK)}` });
  return n;
}
async function latestMaster() {
  const lines = (await (await relay("/json?poll=1&since=all")).text()).split("\n");
  let best = null; const groups = new Map();
  const take = (message, time) => { if (!best || time >= best.time) best = { message, time }; };
  for (const ln of lines) {
    let m; try { m = JSON.parse(ln); } catch { continue; /* not a message line */ }
    if (m.event !== "message" || typeof m.message !== "string") continue;
    const c = m.message.match(PART_RE);
    if (c) {
      const id = c[1], i = +c[2], n = +c[3];
      if (!(n >= 1 && n <= MAX_PARTS && i < n)) continue;
      const g = groups.get(id) || { n, parts: {}, time: 0 };
      g.parts[i] = c[4]; g.time = Math.max(g.time, m.time); groups.set(id, g);
      if (g.n === n && Array.from({ length: n }, (_, j) => j in g.parts).every(Boolean)) take(Array.from({ length: n }, (_, j) => g.parts[j]).join(""), g.time);
    } else if (CODE_RE.test(m.message)) take(m.message, m.time);
  }
  return best;
}
function applyMaster(p) {
  S.f = { ...p.f }; S.cut = Object.fromEntries(p.cut.map((k) => [k, 1])); S.ed = { ...p.ed };
  editKey = null; save(); buildForm(); redrawScript();
}
let undoSnap = null;
$("#sendMaster").addEventListener("click", async () => {
  const code = toCode(), link = onPages ? `${location.origin}${location.pathname}#${code}` : code;
  let pre = "";
  try {
    await publish(code);
    try { await navigator.clipboard.writeText(link); } catch { /* the copy is only a spare */ }
    syncMsg(bi(`已发布（${hhmm(Date.now())}）：其他手机点「同步主版本」即可`, `Published at ${hhmm(Date.now())}: other phones just tap Sync from master`));
    return;
  } catch (e) {
    pre = e && e.message === "too big" ? bi("内容太长，同步服务放不下，改用分享链接。", "Too big for the sync service, so using the share link.") : bi("连不上同步服务，改用分享链接。", "Couldn't reach the sync service, so using the share link.");
  }
  const say = (t) => syncMsg(pre ? `${pre} ${t}` : t);
  const note = "A Night to Shine: master script version. Open the link, or copy this message and tap 同步主版本 / Sync from master.";
  let copied = false;
  try { await navigator.clipboard.writeText(link); copied = true; } catch { /* the share sheet or the TBC tab still work */ }
  try {
    if (navigator.share) { await navigator.share(onPages ? { title: "A Night to Shine · 主版本", text: note, url: link } : { title: "A Night to Shine · 主版本", text: `${note}\n${link}` }); say(bi("已打开分享，也已复制链接", "Share sheet opened; the link is also copied")); return; }
  } catch (e) { if (e && e.name === "AbortError") { say(copied ? bi("已取消分享，链接已复制，可直接粘贴发送", "Share cancelled; the link is copied, so you can paste it into a message") : ""); return; } }
  if (copied) say(bi("已复制主版本链接：粘贴发给搭档", "Master version link copied: paste it to your co-MC"));
  else { show("tbc"); $("#copy").click(); }
});
async function fromClipboard(pre) {
  const say = (t) => syncMsg(pre ? `${pre} ${t}` : t);
  try {
    const p = fromCode(await navigator.clipboard.readText());
    if (p) { syncMsg(""); offer(p); scrollTo(0, 0); return; }
    say(bi("剪贴板里没有主版本：先把搭档发来的消息拷贝下来", "No master version on the clipboard: copy your co-MC's message first"));
  } catch { say(bi("读不到剪贴板：到「待填」页最下面粘贴", "Can't read the clipboard: paste it at the bottom of the TBC tab")); }
}
$("#getMaster").addEventListener("click", async () => {
  const btn = $("#getMaster"); btn.disabled = true; syncMsg(bi("正在同步…", "Syncing…"));
  try {
    let m = null, down = false;
    try { m = await latestMaster(); } catch { down = true; }
    const p = m && fromCode(m.message);
    if (p && p.master) {
      undoSnap = { f: S.f, cut: S.cut, ed: S.ed };
      applyMaster(p);
      const t = hhmm(m.time * 1000);
      $("#undoSync").hidden = false;
      syncMsg(bi(`已同步（主版本发布于 ${t}）：${Object.keys(p.f).length} 项填写，${Object.keys(p.ed).length} 行改过，${p.cut.length} 行删除`, `Synced (master published ${t}): ${Object.keys(p.f).length} entries, ${Object.keys(p.ed).length} reworded, ${p.cut.length} removed`));
      return;
    }
    await fromClipboard(down ? bi("连不上同步服务。", "Couldn't reach the sync service.") : bi("主版本还没有发布。", "Nothing published yet."));
  } finally { btn.disabled = false; }
});
$("#undoSync").addEventListener("click", () => {
  if (!undoSnap) return;
  S.f = undoSnap.f; S.cut = undoSnap.cut; S.ed = undoSnap.ed; undoSnap = null;
  editKey = null; save(); buildForm(); redrawScript();
  $("#undoSync").hidden = true; syncMsg(bi("已撤销同步，恢复到同步前", "Sync undone: back to how it was before"));
});
let pending = null;
function offer(p) {
  pending = p;
  const nf = Object.keys(p.f).length, nc = p.cut.length, ne = Object.keys(p.ed).length, n = nf + nc + ne;
  $("#importText").textContent = p.master
    ? `搭档的主版本：${nf} 项填写，${ne} 行改过，${nc} 行删除。应用后会替换这部手机上的改动。 · Master version: ${nf} entries, ${ne} reworded and ${nc} removed lines. Applying replaces the changes on this phone.`
    : n ? `收到搭档的 ${n} 项填写 · ${n} entries from your co-MC` : "内容为空 · Nothing to import";
  $("#importBanner").hidden = false;
  $("#doImport").hidden = !n && !p.master;
  $("#doImport").textContent = p.master ? "应用主版本 Apply" : "导入 Import";
}
$("#doImport").addEventListener("click", () => {
  const master = pending && pending.master;
  if (pending && master) applyMaster(pending);
  else if (pending) { Object.assign(S.f, pending.f); save(); buildForm(); renderScript(); }
  $("#importBanner").hidden = true; pending = null; show(master ? "script" : "tbc");
});
$("#skipImport").addEventListener("click", () => { $("#importBanner").hidden = true; pending = null; });
$("#pasteGo").addEventListener("click", () => {
  const f = fromCode($("#pasteIn").value);
  $("#pasteMsg").textContent = f ? "" : "没有找到可导入的内容，请粘贴完整的链接或代码 · No code found: paste the whole link or code";
  if (f) { $("#pasteIn").value = ""; offer(f); scrollTo(0, 0); }
});
let armed = 0;
$("#reset").addEventListener("click", (e) => {
  const b = e.currentTarget;
  if (!armed) { armed = setTimeout(() => { armed = 0; b.textContent = "清除全部填写 · Clear all entries"; b.classList.remove("armed"); }, 4000); b.textContent = "再按一次确认清除 · Tap again to clear"; b.classList.add("armed"); return; }
  clearTimeout(armed); armed = 0; b.textContent = "已清除 · Cleared"; b.classList.remove("armed");
  S.f = {}; S.drawn = {}; save(); buildForm(); renderScript();
});

// ---------- Text size, theme, keep the screen on ----------
const root = document.documentElement;
const setFs = (px) => { S.fs = Math.max(15, Math.min(34, px)); root.style.setProperty("--fs", S.fs + "px"); save(); };
$("#smaller").addEventListener("click", () => setFs((S.fs || 20) - 2));
$("#bigger").addEventListener("click", () => setFs((S.fs || 20) + 2));
$("#theme").addEventListener("click", () => {
  const dark = S.theme ? S.theme === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
  S.theme = dark ? "light" : "dark"; root.dataset.theme = S.theme; save();
});
let lock = null;
async function wake() {
  try { if (!lock && document.visibilityState === "visible" && navigator.wakeLock) { lock = await navigator.wakeLock.request("screen"); lock.addEventListener("release", () => { lock = null; }); } } catch { lock = null; }
}
addEventListener("pointerdown", wake, { passive: true });
document.addEventListener("visibilitychange", wake);

// ---------- Start ----------
if (S.fs) root.style.setProperty("--fs", S.fs + "px");
if (S.theme) root.dataset.theme = S.theme;
buildForm(); renderAll();
const n0 = tick();
show(n0.cur ? "script" : S.tab || "script");
if (n0.cur && S.tab === "script") requestAnimationFrame(() => goTo($(`#s${n0.cur.i}`)));
setInterval(tick, 20000);
try { const h = decodeURIComponent(location.hash); if (CODE_RE.test(h)) { const p = fromCode(h); if (p) offer(p); history.replaceState(null, "", location.pathname + location.search); } } catch { /* hash unavailable */ }
try { if ("serviceWorker" in navigator && onPages) navigator.serviceWorker.register("../sw.js").catch(() => {}); } catch { /* not allowed here */ }

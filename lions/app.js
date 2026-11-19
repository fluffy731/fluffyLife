// Lions Charity Ball run sheet. Edits are kept in this browser (localStorage); "Copy my changes" on the Notes tab moves them to another phone.
import { DEFAULT } from './data.js';
import { MONTHS, pad, parseTime, fmt12, longDate, effTimes as effTimesOf, nowState as nowStateOf, normalise, encode, decode } from './model.js';

const KEY = 'lions-2026-11-21';
const clone = (o) => JSON.parse(JSON.stringify(o));
const S = clone(DEFAULT);
const replaceState = (next) => { Object.keys(S).forEach((k) => delete S[k]); Object.assign(S, clone(next)); };
try { const saved = normalise(JSON.parse(localStorage.getItem(KEY))); if (saved) replaceState(saved); } catch (e) { /* nothing saved yet, or storage blocked */ }

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const esc = (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const uid = () => Math.random().toString(36).slice(2, 8);
const COLS = [
  { k: 'd', n: 'Committee', c: 'com' },
  { k: 's', n: 'Sound', c: 'snd' },
  { k: 'l', n: 'Light', c: 'lgt' },
  { k: 'v', n: 'LCD screens', c: 'lcd' },
];
const WHO = [['all', 'Everyone'], ['com', 'Committee'], ['snd', 'Sound'], ['lgt', 'Light'], ['lcd', 'LCD']];
const TABS = [['schedule', 'Schedule'], ['sheet', 'Sheet'], ['checklist', 'Checklist'], ['notes', 'Notes']];

// Per-viewer conveniences only (tab, team, text size, theme, lock). The schedule itself is saved in the page.
let P = { tab: 'schedule', who: 'all', fs: 17, theme: '', locked: false };
try { Object.assign(P, JSON.parse(localStorage.getItem('lions-prefs') || '{}')); } catch (e) { /* storage blocked: keep defaults */ }
const saveP = () => { try { localStorage.setItem('lions-prefs', JSON.stringify(P)); } catch (e) { /* ignore */ } };
{ const h = location.hash.slice(1); if (TABS.some((t) => t[0] === h)) P.tab = h; }

let noticeTimer = 0;
const setNotice = (txt, ms = 8000) => { notice = txt; paintToast(); clearTimeout(noticeTimer); noticeTimer = setTimeout(() => { notice = ''; paintToast(); }, ms); };
const canWrite = true;
let saveTimer = 0, pending = false, flashText = '', flashTimer = 0, notice = '', undoState = null;
const editing = () => canWrite && !P.locked;
const row = (id) => S.rows.find((r) => r.id === id);

/* ---------- time ---------- */
const effTimes = () => effTimesOf(S.rows);
const AT = new URLSearchParams(location.search).get('at'); // ?at=19:12 rehearses the night at that time
function melNow() {
  if (AT && /^\d{1,2}:\d{2}$/.test(AT)) { const [h, m] = AT.split(':').map(Number); return { date: S.event.date, min: h * 60 + m }; }
  const p = new Intl.DateTimeFormat('en-AU', { timeZone: 'Australia/Melbourne', hour12: false, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).formatToParts(new Date());
  const g = (t) => +p.find((x) => x.type === t).value;
  const h = g('hour') % 24;
  return { date: g('year') + '-' + pad(g('month')) + '-' + pad(g('day')), min: h * 60 + g('minute') };
}
const nowState = () => nowStateOf(S.rows, S.event.date, melNow());

/* ---------- field templates ---------- */
const ro = () => (editing() ? '' : ' readonly');
const taHTML = (id, attrs, val, ph, cls = '', lab = ph) => '<textarea id="' + id + '" class="fld ' + cls + '" rows="1" ' + attrs + ' placeholder="' + esc(ph) + '"' + (lab ? ' aria-label="' + esc(lab) + '"' : '') + ro() + '>\n' + esc(val) + '</textarea>';
const inHTML = (id, attrs, val, ph, cls = '') => '<input id="' + id + '" class="fld ' + cls + '" ' + attrs + ' value="' + esc(val) + '" placeholder="' + esc(ph) + '" aria-label="' + esc(ph) + '" autocomplete="off"' + ro() + '>';
const timeHTML = (p, r, inh) => '<input id="' + p + '-t-' + r.id + '" class="fld tin" data-time="' + r.id + '" value="' + esc(fmt12(r.time)) + '" placeholder="' + esc(inh ? fmt12(inh) : 'Time') + '" autocomplete="off" aria-label="Time"' + ro() + '>';
const cueHTML = (p, r, c) => {
  const id = p + '-' + r.id + '-' + c.k, v = r[c.k] || '';
  return '<div class="cue c-' + c.c + (v.trim() ? '' : ' blank') + '"><label class="cl" for="' + id + '">' + c.n + '</label>' + taHTML(id, 'data-r="' + r.id + '" data-k="' + c.k + '"', v, editing() ? 'Add ' + c.n.toLowerCase() + ' cue' : 'No cue', '', '') + '</div>';
};
const rowTools = (r, i) =>
  '<div class="rt"><button type="button" class="btn" data-act="up" data-id="' + r.id + '" aria-label="Move up"' + (i === 0 ? ' disabled' : '') + '>▲</button>' +
  '<button type="button" class="btn" data-act="down" data-id="' + r.id + '" aria-label="Move down"' + (i === S.rows.length - 1 ? ' disabled' : '') + '>▼</button>' +
  '<button type="button" class="btn" data-act="add" data-id="' + r.id + '">+ Add segment below</button>' +
  '<button type="button" class="btn danger" data-act="del" data-id="' + r.id + '">Delete</button></div>';

/* ---------- panels ---------- */
function segHTML(r, i, ef) {
  const cont = !r.time && !r.seg;
  return '<article class="seg' + (cont ? ' cont' : '') + '" id="s-' + r.id + '" data-row="' + r.id + '"><header class="seg-h">' + timeHTML('s', r, ef[i]) +
    taHTML('s-g-' + r.id, 'data-r="' + r.id + '" data-k="seg"', r.seg, 'Segment name', 'sin') + '<span class="pill">Now</span></header>' +
    '<div class="cues">' + COLS.map((c) => cueHTML('s', r, c)).join('') + '</div>' + rowTools(r, i) + '</article>';
}
const tocHTML = (ef) => S.rows.map((r, i) => (r.time || r.seg ? '<button type="button" class="chip" data-seg="' + r.id + '"><time>' + fmt12(ef[i]).replace(' ', '') + '</time>' + esc(r.seg) + '</button>' : '')).join('');
function renderSchedule() {
  const ef = effTimes();
  return '<div class="who" role="group" aria-label="Show cues for">' + WHO.map((w) => '<button type="button" data-who="' + w[0] + '" aria-pressed="' + (P.who === w[0]) + '">' + (w[0] === 'all' ? '' : '<span class="dot d-' + w[0] + '"></span>') + w[1] + '</button>').join('') + '</div>' +
    '<div class="hintrow"><p class="hint">Pick your team to enlarge its cues. ' + (editing() ? 'Tap any text to change it. Changes are saved on this phone.' : 'Editing is locked. Tap the padlock to edit.') + '</p>' +
    '<div class="sz" role="group" aria-label="Text size"><button type="button" id="smaller" aria-label="Smaller text">A−</button><button type="button" id="bigger" aria-label="Larger text">A+</button></div></div>' +
    '<nav class="toc" id="toc" aria-label="Segments">' + tocHTML(ef) + '</nav>' +
    '<div id="segs">' + S.rows.map((r, i) => segHTML(r, i, ef)).join('') + '</div>' +
    '<button type="button" class="btn add edit-only" data-act="addEnd">+ Add segment</button>';
}
function renderSheet() {
  const ef = effTimes();
  const head = ['Time', 'Segment'].concat(COLS.map((c) => c.n === 'Committee' ? 'Committee actions and cues' : c.n)).concat(['']);
  const w = ['104px', '150px', '280px', '190px', '190px', '190px', '56px'];
  return '<p class="hint">' + (editing() ? 'Every cell is editable, as in the original sheet. ' : '') + 'Scroll sideways on a phone.</p><div class="tablewrap"><table class="grid"><colgroup>' + w.map((x) => '<col style="width:' + x + '">').join('') + '</colgroup><thead><tr>' +
    head.map((h) => '<th scope="col">' + h + '</th>').join('') + '</tr></thead><tbody>' +
    S.rows.map((r, i) => '<tr data-row="' + r.id + '"><td>' + timeHTML('g', r, ef[i]) + '</td><td>' + taHTML('g-' + r.id + '-seg', 'data-r="' + r.id + '" data-k="seg"', r.seg, 'Segment name') + '</td>' +
      COLS.map((c) => '<td>' + taHTML('g-' + r.id + '-' + c.k, 'data-r="' + r.id + '" data-k="' + c.k + '"', r[c.k] || '', '', '', c.n) + '</td>').join('') +
      '<td class="rtc"><button type="button" class="btn" data-act="up" data-id="' + r.id + '" aria-label="Move up"' + (i === 0 ? ' disabled' : '') + '>▲</button><button type="button" class="btn" data-act="down" data-id="' + r.id + '" aria-label="Move down"' + (i === S.rows.length - 1 ? ' disabled' : '') + '>▼</button>' +
      '<button type="button" class="btn" data-act="add" data-id="' + r.id + '" aria-label="Add segment below">+</button><button type="button" class="btn danger" data-act="del" data-id="' + r.id + '" aria-label="Delete segment">✕</button></td></tr>').join('') +
    '</tbody></table></div><button type="button" class="btn add edit-only" data-act="addEnd" style="margin-top:12px">+ Add segment</button>';
}
const itemHTML = (it) => '<li class="it' + (it.done ? ' done' : '') + '" data-item="' + it.id + '"><label class="tick"><input type="checkbox" id="k-' + it.id + '-c" data-tick="' + it.id + '"' + (it.done ? ' checked' : '') + (canWrite ? '' : ' disabled') + ' aria-label="Done"><span class="no" aria-hidden="true">✓</span></label>' +
  taHTML('k-' + it.id, 'data-it="' + it.id + '" data-k="text"', it.text, 'Item') + '<button type="button" class="btn danger edit-only" data-act="delItem" data-id="' + it.id + '" aria-label="Delete item">✕</button></li>';
const listHTML = (l) => '<section class="card" data-list="' + l.id + '"><div class="lh">' + inHTML('k-' + l.id + '-title', 'data-li="' + l.id + '" data-k="title"', l.title, 'List name', 'lt') +
  '<span class="cnt">' + l.items.filter((i) => i.done).length + '/' + l.items.length + '</span></div><ul class="items">' + l.items.map(itemHTML).join('') + '</ul>' +
  '<div class="rt"><button type="button" class="btn" data-act="addItem" data-id="' + l.id + '">+ Add item</button><button type="button" class="btn danger" data-act="delList" data-id="' + l.id + '">Delete list</button></div></section>';
function renderChecklist() {
  const all = S.lists.flatMap((l) => l.items), done = all.filter((i) => i.done).length;
  return '<div class="sum"><p><b id="doneN">' + done + '</b><span id="doneOf">of ' + all.length + ' done</span></p><div class="meter" aria-hidden="true"><i id="bar" style="width:' + (all.length ? Math.round(done / all.length * 100) : 0) + '%"></i></div></div>' +
    S.lists.map(listHTML).join('') + '<button type="button" class="btn add edit-only" data-act="addList">+ Add list</button>';
}
const fixHTML = (f) => '<li class="fx" data-fix="' + f.id + '"><div class="fx-h"><span class="kind k-' + esc(f.kind.toLowerCase()) + '">' + esc(f.kind) + '</span>' + taHTML('f-' + f.id + '-w', 'data-fx="' + f.id + '" data-k="where"', f.where, 'Where') + '</div>' +
  '<div class="fx-b">' + taHTML('f-' + f.id + '-a', 'data-fx="' + f.id + '" data-k="was"', f.was, 'Was', 'was') + '<span class="arr" aria-hidden="true">→</span>' + taHTML('f-' + f.id + '-b', 'data-fx="' + f.id + '" data-k="now"', f.now, 'Now', 'now') + '</div>' +
  '<div class="rt"><button type="button" class="btn danger" data-act="delFix" data-id="' + f.id + '">Delete</button></div></li>';
const shareHTML = () => '<section class="card" id="share"><div class="lh"><h2 class="lt" style="margin:6px 8px">Share changes</h2></div>' +
  '<p class="hint" style="margin:0 8px 10px">Your edits are saved on this phone only. To move them to another phone, copy them here, send the code in any chat, and paste it on the other phone.</p>' +
  '<div class="btns"><button type="button" class="btn primary" id="copyCode">Copy my changes</button></div>' +
  '<textarea id="shareOut" class="fld code" rows="3" readonly hidden aria-label="Code to share"></textarea>' +
  '<p class="msg" id="shareMsg" role="status"></p>' +
  '<label class="cl2" for="pasteIn">Paste a code from someone else</label>' +
  '<textarea id="pasteIn" class="fld code" rows="3" placeholder="LIONS1.\u2026" aria-label="Paste a code"></textarea>' +
  '<div class="btns"><button type="button" class="btn" id="pasteGo">Load this version</button><button type="button" class="btn" id="undoImport"' + (undoState ? '' : ' hidden') + '>Undo</button></div>' +
  '<p class="msg" id="pasteMsg" role="status"></p>' +
  '<div class="btns"><button type="button" class="btn danger" id="resetAll">Reset to the original sheet</button></div></section>';
function renderNotes() {
  return '<section class="card"><div class="lh"><h2 class="lt" style="margin:6px 8px">Changes made to the original sheet</h2></div><p class="hint" style="margin:0 8px 6px">Wording and times fixed when this page was built from the committee’s spreadsheet.</p><ul class="fxs">' + S.fixes.map(fixHTML).join('') + '</ul>' +
    '<button type="button" class="btn add edit-only" data-act="addFix" style="margin-top:8px;margin-bottom:0">+ Add a change</button></section>' +
    '<section class="card"><div class="lh"><h2 class="lt" style="margin:6px 8px">Notes</h2></div>' + taHTML('n-notes', 'data-n="notes"', S.notes, editing() ? 'Anything else the team should know' : 'No notes yet', '') + '</section>' + shareHTML();
}
const PANELS = { schedule: renderSchedule, sheet: renderSheet, checklist: renderChecklist, notes: renderNotes };

/* ---------- shell ---------- */
function shell() {
  const tabs = TABS.map((t) => '<button type="button" data-tab="' + t[0] + '" aria-current="' + (P.tab === t[0]) + '">' + t[1] + (t[0] === 'checklist' ? ' <span class="badge" id="tabBadge"></span>' : '') + '</button>').join('');
  $('#app').innerHTML =
    '<header class="mast" id="mast"><div class="wrap"><div class="mast-row"><div class="ttl">' +
    inHTML('m-org', 'data-m="org"', S.event.org, 'Organisation', 'eb') +
    '<h1>' + inHTML('m-title', 'data-m="title"', S.event.title, 'Event title', 'h1in') + '</h1>' +
    '<p class="sub"><span class="sv" id="subView"></span><span class="se"><input type="date" id="m-date" class="fld" data-m="date" value="' + esc(S.event.date) + '" aria-label="Date"' + ro() + '>' + inHTML('m-venue', 'data-m="venue"', S.event.venue, 'Venue') + '</span></p></div>' +
    '<div class="tools">' +
    '<button type="button" class="icon-btn" id="theme" aria-label="Dark or light"><svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true"><circle cx="10" cy="10" r="7.2" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M10 2.8a7.2 7.2 0 0 1 0 14.4z" fill="currentColor"/></svg></button>' +
    (canWrite ? '<button type="button" class="icon-btn" id="lock" aria-pressed="' + P.locked + '" aria-label="' + (P.locked ? 'Locked. Tap to edit' : 'Editing. Tap to lock') + '">' + (P.locked
      ? '<svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true"><rect x="4" y="9" width="12" height="8" rx="2" fill="currentColor"/><path d="M7 9V6.5a3 3 0 0 1 6 0V9" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>'
      : '<svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true"><rect x="4" y="9" width="12" height="8" rx="2" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M7 9V6.5a3 3 0 0 1 5.8-1" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>') + '</button>' : '') +
    '</div></div><button type="button" class="nowbar" id="nowbar"><span id="clock">--:--</span><span id="nowtxt"></span><span class="go" aria-hidden="true">→</span></button>' +
    '<nav class="tabs" id="tabs" aria-label="Pages">' + tabs + '</nav></div><div class="foil" aria-hidden="true"></div></header>' +
    '<main class="wrap" id="panel"></main>' +
    '<nav class="pager" id="pager" aria-label="Step through segments"><button type="button" id="prev"><small>Previous</small><span id="prevName">—</span></button><button type="button" id="next"><small>Next</small><span id="nextName">—</span></button></nav>' +
    '<div class="toast" id="toast" role="status" aria-live="polite" hidden></div>';
  paintSub();
}
function renderPanel() {
  $('#panel').innerHTML = PANELS[P.tab]();
  $('#pager').hidden = P.tab !== 'schedule';
  document.body.classList.toggle('wide', P.tab === 'sheet');
  $$('#tabs button').forEach((b) => b.setAttribute('aria-current', String(b.dataset.tab === P.tab)));
  document.body.dataset.who = P.who;
  paintBadge(); paintNow(); paintPager(); autosizeAll();
}
function renderAll() {
  document.body.classList.toggle('editing', editing());
  document.documentElement.style.setProperty('--fs', P.fs + 'px');
  applyTheme(); shell(); renderPanel(); paintToast();
}
function applyTheme() { const r = document.documentElement; if (P.theme) r.setAttribute('data-theme', P.theme); else r.removeAttribute('data-theme'); }
const paintSub = () => { const el = $('#subView'); if (el) el.textContent = [longDate(S.event.date), S.event.venue].filter(Boolean).join(' · '); };
function paintBadge() {
  const b = $('#tabBadge'); if (!b) return;
  const left = (S.lists.find((l) => l.title.toLowerCase() === 'to confirm') || { items: [] }).items.filter((i) => !i.done).length;
  b.hidden = !left; b.textContent = left;
}

/* ---------- now bar, pager ---------- */
const FS_OK = !!(window.CSS && CSS.supports && CSS.supports('field-sizing', 'content'));
function autosize(el) { if (FS_OK || !el.offsetParent) return; el.style.height = 'auto'; el.style.height = (el.scrollHeight + 2) + 'px'; }
const autosizeAll = () => { if (!FS_OK) requestAnimationFrame(() => $$('textarea.fld').forEach(autosize)); };

function paintNow() {
  const st = nowState(), ef = effTimes(), nm = (i) => S.rows[i].seg || 'Continued';
  const clock = $('#clock'), txt = $('#nowtxt'); if (!clock) return;
  $$('.now').forEach((el) => el.classList.remove('now'));
  const nowIds = new Set();
  if (st.phase === 'live') S.rows.forEach((r, i) => { if (st.mins[i] === st.cur) nowIds.add(r.id); });
  nowIds.forEach((id) => { $$('[data-row="' + id + '"], [data-seg="' + id + '"]').forEach((el) => el.classList.add('now')); });
  const mins = (n) => n + (n === 1 ? ' minute' : ' minutes');
  if (st.phase === 'live') {
    clock.textContent = fmt12(pad(Math.floor(st.n.min / 60)) + ':' + pad(st.n.min % 60));
    const names = S.rows.filter((r, i) => st.mins[i] === st.cur && r.seg).map((r) => r.seg).join(' + ');
    let nx = '';
    if (st.nxt != null) { const j = S.rows.findIndex((r, i) => st.mins[i] === st.nxt && r.seg); nx = ' · next ' + fmt12(pad(Math.floor(st.nxt / 60)) + ':' + pad(st.nxt % 60)) + (j >= 0 ? ' ' + nm(j) : '') + ' in ' + mins(st.nxt - st.n.min); }
    txt.textContent = 'Now: ' + (names || 'running') + nx;
  } else if (st.phase === 'early') {
    clock.textContent = fmt12(pad(Math.floor(st.n.min / 60)) + ':' + pad(st.n.min % 60));
    const first = Math.min.apply(null, st.mins.filter((m) => m != null));
    txt.textContent = 'Event day · first cue ' + fmt12(pad(Math.floor(first / 60)) + ':' + pad(first % 60));
  } else if (st.phase === 'before') {
    clock.textContent = (+S.event.date.slice(8)) + ' ' + MONTHS[+S.event.date.slice(5, 7) - 1].slice(0, 3);
    txt.textContent = st.days === 1 ? 'Tomorrow · first cue ' + fmt12(ef.find(Boolean) || '') : 'In ' + st.days + ' days · first cue ' + fmt12(ef.find(Boolean) || '');
  } else if (st.phase === 'after') { clock.textContent = 'Done'; txt.textContent = 'This event has finished'; }
  else { clock.textContent = '--:--'; txt.textContent = 'Set the event date to see the live bar'; }
}
const headBottom = () => { const m = $('#mast'); return m ? m.getBoundingClientRect().bottom : 0; };
const reduce = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
function goTo(el) { if (el) scrollTo({ top: el.getBoundingClientRect().top + scrollY - headBottom() - 10, behavior: reduce() ? 'auto' : 'smooth' }); }
const cardName = (el) => { if (!el) return '—'; const i = S.rows.findIndex((r) => r.id === el.dataset.row); if (i < 0) return '—'; const r = S.rows[i]; return (r.seg || 'Continued') + ' \u00B7 ' + fmt12(effTimes()[i]); };
function where() { const cs = $$('#segs .seg'), hb = headBottom(); let idx = 0; cs.forEach((c, i) => { if (c.getBoundingClientRect().top <= hb + 24) idx = i; }); return { cs, idx, past: cs[idx] ? cs[idx].getBoundingClientRect().top < hb - 6 : false }; }
function paintPager() {
  if (P.tab !== 'schedule' || !$('#prevName')) return;
  const w = where();
  $('#prevName').textContent = cardName(w.past ? w.cs[w.idx] : w.cs[w.idx - 1]);
  $('#nextName').textContent = cardName(w.cs[w.idx + 1]);
  $('#prev').disabled = !w.past && w.idx === 0; $('#next').disabled = w.idx >= w.cs.length - 1;
}
function step(d) { const w = where(); goTo(d < 0 ? (w.past ? w.cs[w.idx] : w.cs[w.idx - 1]) : w.cs[w.idx + 1]); }

/* ---------- saving (this phone only) ---------- */
function paintToast() {
  const t = $('#toast'); if (!t) return;
  const text = notice || flashText;
  t.className = 'toast' + (notice ? ' warn' : '') + (P.tab === 'schedule' ? '' : ' plain');
  t.textContent = text; t.hidden = !text;
}
const flash = (txt) => { flashText = txt; paintToast(); clearTimeout(flashTimer); flashTimer = setTimeout(() => { flashText = ''; paintToast(); }, 1600); };
function persist() {
  pending = false;
  try { localStorage.setItem(KEY, JSON.stringify(S)); flash('Saved on this phone'); }
  catch (e) { setNotice('This browser would not save your changes. Keep this page open, or copy them from Notes.', 12000); }
}
function touch() { pending = true; clearTimeout(saveTimer); saveTimer = setTimeout(persist, 500); }

/* ---------- sharing ---------- */
function copyCode() {
  const code = encode(S), out = $('#shareOut'), msg = $('#shareMsg');
  out.value = code;
  const manual = () => { out.hidden = false; out.focus(); out.select(); msg.className = 'msg'; msg.textContent = 'Select all and copy this code.'; };
  if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(code).then(() => { msg.className = 'msg'; msg.textContent = 'Copied. Send it in a chat, then paste it on the other phone.'; }, manual);
  else manual();
}
function showUndo(text) { const m = $('#pasteMsg'), u = $('#undoImport'); if (m) { m.className = 'msg'; m.textContent = text; } if (u) u.hidden = !undoState; }
function pasteGo() {
  const next = decode($('#pasteIn').value), msg = $('#pasteMsg');
  if (!next) { msg.className = 'msg err'; msg.textContent = 'That code was not understood. Copy the whole message, starting at LIONS1.'; return; }
  undoState = clone(S); replaceState(next); persist(); renderAll();
  showUndo('Loaded: ' + S.rows.length + ' segments. Undo brings your earlier edits back.');
}
function undoImport() {
  if (!undoState) return;
  replaceState(undoState); undoState = null; persist(); renderAll(); showUndo('Undone. Your earlier version is back.');
}
function resetAll() { undoState = clone(S); replaceState(DEFAULT); persist(); renderAll(); showUndo('Back to the original sheet. Undo brings your edits back.'); }

/* ---------- edits ---------- */
const swap = (a, b) => { const t = S.rows[a]; S.rows[a] = S.rows[b]; S.rows[b] = t; };
const newRow = () => ({ id: 'r' + uid(), time: '', seg: '', d: '', s: '', l: '', v: '' });
function refreshRow(id) {
  const r = row(id); if (!r) return;
  $$('#segs [data-row="' + id + '"]').forEach((el) => el.classList.toggle('cont', !r.time && !r.seg));
  const ef = effTimes();
  S.rows.forEach((x, i) => $$('input[data-time="' + x.id + '"]').forEach((el) => { el.placeholder = ef[i] ? fmt12(ef[i]) : 'Time'; }));
  const toc = $('#toc'); if (toc) toc.innerHTML = tocHTML(ef);
  paintNow(); paintPager();
}
function rowAct(act, id) {
  const i = S.rows.findIndex((r) => r.id === id); let focus = null;
  if (act === 'up' && i > 0) { swap(i, i - 1); focus = id; }
  else if (act === 'down' && i >= 0 && i < S.rows.length - 1) { swap(i, i + 1); focus = id; }
  else if (act === 'del' && i >= 0) S.rows.splice(i, 1);
  else if (act === 'add' && i >= 0) { const n = newRow(); S.rows.splice(i + 1, 0, n); focus = n.id; }
  else if (act === 'addEnd') { const n = newRow(); S.rows.push(n); focus = n.id; }
  else return;
  touch(); renderPanel();
  if (focus) { const el = $((P.tab === 'sheet' ? '#g-t-' : '#s-t-') + focus) || $('[data-row="' + focus + '"]'); if (el) { goTo(el.closest('[data-row]') || el); if (act === 'add' || act === 'addEnd') el.focus({ preventScroll: true }); } }
}
function listAct(act, id) {
  if (act === 'addItem') { const l = S.lists.find((x) => x.id === id); if (!l) return; const it = { id: 'i' + uid(), text: '', done: false }; l.items.push(it); touch(); renderPanel(); const el = $('#k-' + it.id); if (el) el.focus(); }
  else if (act === 'delItem') { S.lists.forEach((l) => { l.items = l.items.filter((i) => i.id !== id); }); touch(); renderPanel(); }
  else if (act === 'addList') { const l = { id: 'l' + uid(), title: '', items: [] }; S.lists.push(l); touch(); renderPanel(); const el = $('#k-' + l.id + '-title'); if (el) el.focus(); }
  else if (act === 'delList') { S.lists = S.lists.filter((l) => l.id !== id); touch(); renderPanel(); }
  else if (act === 'addFix') { const f = { id: 'x' + uid(), kind: 'Note', where: '', was: '', now: '' }; S.fixes.push(f); touch(); renderPanel(); const el = $('#f-' + f.id + '-w'); if (el) el.focus(); }
  else if (act === 'delFix') { S.fixes = S.fixes.filter((f) => f.id !== id); touch(); renderPanel(); }
}
function paintChecks() {
  const all = S.lists.flatMap((l) => l.items), done = all.filter((i) => i.done).length;
  const n = $('#doneN'); if (n) { n.textContent = done; $('#doneOf').textContent = 'of ' + all.length + ' done'; $('#bar').style.width = (all.length ? Math.round(done / all.length * 100) : 0) + '%'; }
  S.lists.forEach((l) => { const c = $('[data-list="' + l.id + '"] .cnt'); if (c) c.textContent = l.items.filter((i) => i.done).length + '/' + l.items.length; });
  paintBadge();
}
function arm(btn, run) {
  if (btn.dataset.armed) { clearTimeout(+btn.dataset.armed); delete btn.dataset.armed; run(); return; }
  const was = btn.innerHTML; btn.classList.add('armed'); btn.innerHTML = btn.textContent.trim().length <= 2 ? 'Sure?' : 'Tap again';
  btn.dataset.armed = String(setTimeout(() => { delete btn.dataset.armed; btn.classList.remove('armed'); btn.innerHTML = was; }, 3000));
}

const app = document.getElementById('app');
app.addEventListener('input', (e) => {
  const el = e.target; if (!el.classList || !el.classList.contains('fld') || el.readOnly) return;
  const d = el.dataset;
  if (d.r) { const r = row(d.r); if (!r) return; r[d.k] = el.value; if (d.k === 'seg') refreshRow(d.r); else { const c = el.closest('.cue'); if (c) c.classList.toggle('blank', !el.value.trim()); } }
  else if (d.m) { S.event[d.m] = el.value; paintSub(); if (d.m === 'date') paintNow(); }
  else if (d.li) { const l = S.lists.find((x) => x.id === d.li); if (l) { l.title = el.value; paintBadge(); } }
  else if (d.it) { S.lists.forEach((l) => l.items.forEach((i) => { if (i.id === d.it) i.text = el.value; })); }
  else if (d.fx) { const f = S.fixes.find((x) => x.id === d.fx); if (f) f[d.k] = el.value; }
  else if (d.n) S.notes = el.value;
  else return;
  autosize(el); touch();
});
app.addEventListener('change', (e) => {
  const el = e.target, d = el.dataset;
  if (d.time && !el.readOnly) {
    const r = row(d.time), v = parseTime(el.value); if (!r) return;
    if (v === null) { el.value = fmt12(r.time); flash('Time not understood. Try 7:30pm or 19:30.'); return; }
    r.time = v; el.value = fmt12(v); refreshRow(r.id); touch();
  } else if (d.tick && canWrite) {
    S.lists.forEach((l) => l.items.forEach((i) => { if (i.id === d.tick) i.done = el.checked; }));
    const li = el.closest('.it'); if (li) li.classList.toggle('done', el.checked);
    paintChecks(); touch();
  }
});
app.addEventListener('keydown', (e) => { if (e.key === 'Enter' && e.target.matches && e.target.matches('[data-k="seg"], .lt, .h1in, .eb')) { e.preventDefault(); e.target.blur(); } });
app.addEventListener('click', (e) => {
  const b = e.target.closest('button'); if (!b) return;
  if (b.dataset.tab) { P.tab = b.dataset.tab; saveP(); try { history.replaceState(null, '', '#' + P.tab); } catch (x) { /* ignore */ } renderPanel(); scrollTo(0, 0); paintToast(); return; }
  if (b.dataset.who) { P.who = b.dataset.who; saveP(); document.body.dataset.who = P.who; $$('.who button').forEach((x) => x.setAttribute('aria-pressed', String(x.dataset.who === P.who))); paintPager(); return; }
  if (b.dataset.seg) { goTo($('#s-' + b.dataset.seg)); return; }
  const id = b.id, act = b.dataset.act;
  if (id === 'smaller' || id === 'bigger') { P.fs = Math.max(14, Math.min(28, P.fs + (id === 'bigger' ? 2 : -2))); saveP(); document.documentElement.style.setProperty('--fs', P.fs + 'px'); autosizeAll(); return; }
  if (id === 'theme') { const dark = P.theme ? P.theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches; P.theme = dark ? 'light' : 'dark'; saveP(); applyTheme(); return; }
  if (id === 'lock') { P.locked = !P.locked; saveP(); renderAll(); return; }
  if (id === 'copyCode') return copyCode();
  if (id === 'pasteGo') return pasteGo();
  if (id === 'undoImport') return undoImport();
  if (id === 'resetAll') return arm(b, resetAll);
  if (id === 'prev') return step(-1);
  if (id === 'next') return step(1);
  if (id === 'nowbar') { if (P.tab !== 'schedule') { P.tab = 'schedule'; saveP(); renderPanel(); } const cur = $('#segs .seg.now'); if (cur) goTo(cur); else scrollTo({ top: 0 }); return; }
  if (!act) return;
  const rowActs = ['up', 'down', 'add', 'addEnd'];
  if (rowActs.includes(act)) return rowAct(act, b.dataset.id);
  if (act === 'del') return arm(b, () => rowAct('del', b.dataset.id));
  if (['delItem', 'delList', 'delFix'].includes(act)) return arm(b, () => listAct(act, b.dataset.id));
  listAct(act, b.dataset.id);
});
addEventListener('scroll', (() => { let raf = 0; return () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(paintPager); }; })(), { passive: true });
addEventListener('resize', autosizeAll);
addEventListener('hashchange', () => { const h = location.hash.slice(1); if (TABS.some((t) => t[0] === h) && h !== P.tab) { P.tab = h; saveP(); renderPanel(); scrollTo(0, 0); } });
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden' && pending) persist(); else wake(); });
addEventListener('pagehide', () => { if (pending) persist(); });
let lock = null;
async function wake() { try { if (!lock && document.visibilityState === 'visible' && navigator.wakeLock) { lock = await navigator.wakeLock.request('screen'); lock.addEventListener('release', () => { lock = null; }); } } catch (e) { lock = null; } }
addEventListener('pointerdown', wake, { passive: true });
if (document.fonts && document.fonts.ready) document.fonts.ready.then(autosizeAll);

/* ---------- start ---------- */
renderAll();
setInterval(paintNow, 15000);
const onPages = /github\.io$/.test(location.hostname);
try { if ('serviceWorker' in navigator && onPages) navigator.serviceWorker.register('../sw.js').catch(() => {}); } catch (e) { /* not allowed here */ }

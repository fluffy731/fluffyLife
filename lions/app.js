// Lions Charity Ball: the MC script (Paul and Salli), the blanks to fill in, and the committee's run sheet.
// One source for two builds. Lines between `//#artifact` and `//#end` go only into the claude.ai artifact (it saves by republishing itself);
// lines between `//#pages` and `//#end` go only into the GitHub Pages app (it saves in the browser). Everything else is shared.

import { DEFAULT } from './data.js';
import { META } from './meta.js';
import { MONTHS, pad, parseTime, fmt12, longDate, effTimes, nowState, parts, fieldVal, rowDone, rowAny, leftOf, keysIn, normalise, encode, decode, toParts, pickMaster } from './model.js';

const KEY = 'lions-2026-11-21';
const clone = (o) => JSON.parse(JSON.stringify(o));
const S = clone(DEFAULT);
const replaceState = (next) => { Object.keys(S).forEach((k) => delete S[k]); Object.assign(S, clone(next)); };
try { const saved = normalise(JSON.parse(localStorage.getItem(KEY)), DEFAULT); if (saved) replaceState(saved); } catch (e) { /* nothing saved yet, or storage blocked */ }

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
const TEAMS = [['all', 'Everyone'], ['com', 'Committee'], ['snd', 'Sound'], ['lgt', 'Light'], ['lcd', 'LCD']];
const ME = [['both', 'Both'], ['P', 'Paul'], ['S', 'Salli']];
const TABS = [['script', 'Script'], ['fill', 'To fill'], ['run', 'Run sheet'], ['notes', 'Notes']];
const ALIAS = { script: 'script', fill: 'fill', run: 'run', notes: 'notes', schedule: 'run', sheet: 'run', checklist: 'notes' };

// Per-viewer conveniences only (tab, whose lines, team, text size, theme, lock). The script and the answers are saved separately.
let P = { tab: 'script', me: 'both', who: 'all', view: 'cards', fs: 17, theme: '', locked: false };
try { Object.assign(P, JSON.parse(localStorage.getItem('lions-prefs') || '{}')); } catch (e) { /* storage blocked: keep defaults */ }
if (!TABS.some((t) => t[0] === P.tab)) P.tab = 'script';
const saveP = () => { try { localStorage.setItem('lions-prefs', JSON.stringify(P)); } catch (e) { /* ignore */ } };
function readHash() { const h = location.hash.slice(1), t = ALIAS[h]; if (!t) return false; P.tab = t; if (h === 'sheet') P.view = 'grid'; if (h === 'schedule') P.view = 'cards'; return true; }
readHash();

let editLines = false, showBlank = false, flashText = '', flashTimer = 0, notice = '', noticeTimer = 0;
const editing = () => canWrite && !P.locked;
const row = (id) => S.rows.find((r) => r.id === id);
const seg = (id) => S.script.find((g) => g.id === id);
const setNotice = (txt, ms = 8000) => { notice = txt; paintToast(); clearTimeout(noticeTimer); noticeTimer = setTimeout(() => { notice = ''; paintToast(); }, ms); };
const flash = (txt, ms = 2000) => { flashText = txt; paintToast(); clearTimeout(flashTimer); flashTimer = setTimeout(() => { flashText = ''; paintToast(); }, ms); };

/* ---------- time ---------- */
function melNow() {
  const at = new URLSearchParams(location.search).get('at'); // ?at=19:12 rehearses the night at that time
  if (at && /^\d{1,2}:\d{2}$/.test(at)) { const [h, m] = at.split(':').map(Number); return { date: S.event.date, min: h * 60 + m }; }
  const p = new Intl.DateTimeFormat('en-AU', { timeZone: 'Australia/Melbourne', hour12: false, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).formatToParts(new Date());
  const g = (t) => +p.find((x) => x.type === t).value;
  const h = g('hour') % 24;
  return { date: g('year') + '-' + pad(g('month')) + '-' + pad(g('day')), min: h * 60 + g('minute') };
}

/* ---------- field templates ---------- */
const ro = () => (editing() ? '' : ' readonly');
const taHTML = (id, attrs, val, ph, cls = '', lab = ph) => '<textarea id="' + id + '" class="fld ' + cls + '" rows="1" ' + attrs + ' placeholder="' + esc(ph) + '"' + (lab ? ' aria-label="' + esc(lab) + '"' : '') + ro() + '>\n' + esc(val) + '</textarea>';
const inHTML = (id, attrs, val, ph, cls = '', lab = ph) => '<input id="' + id + '" class="fld ' + cls + '" ' + attrs + ' value="' + esc(val) + '" placeholder="' + esc(ph) + '"' + (lab ? ' aria-label="' + esc(lab) + '"' : '') + ' autocomplete="off"' + ro() + '>';
const timeHTML = (id, attr, val, inh) => '<input id="' + id + '" class="fld tin" ' + attr + ' value="' + esc(fmt12(val)) + '" placeholder="' + esc(inh ? fmt12(inh) : 'Time') + '" autocomplete="off" aria-label="Time"' + ro() + '>';
const sizeBtns = () => '<div class="sz" role="group" aria-label="Text size"><button type="button" id="smaller" aria-label="Smaller text">A−</button><button type="button" id="bigger" aria-label="Larger text">A+</button></div>';
const fieldMeta = (k) => META.fields.find((f) => f[0] === k);
const labelOf = (k) => (fieldMeta(k) ? fieldMeta(k)[1] : k);
const tbcChip = (attr, label) => '<button type="button" class="tbc" ' + attr + '><small>TBC</small>' + esc(label) + '</button>';
// Spoken text with its {blanks}: a filled blank is bold, an empty one is a yellow chip that jumps to the To fill tab.
const phHTML = (text) => parts(text, S.fields).map((p) => (p.t === 'text' ? esc(p.v) : p.t === 'val' ? '<b class="v">' + esc(p.v) + '</b>' : tbcChip('data-fld="' + esc(p.k) + '"', labelOf(p.k)))).join('');

/* ---------- script ---------- */
function rosterHTML(it) {
  const r = META.rosters.find((x) => x.key === it.list); if (!r) return '';
  const rows = (S.rosters[r.key] || []).map((rw, i) => ({ rw, n: i + 1 })).filter((x) => (!it.frm || x.n >= it.frm) && (!it.to || x.n <= it.to));
  const filled = rows.filter((x) => rowAny(r.cols, x.rw));
  const head = '<h4 class="list-h">' + esc(r.title) + '</h4>';
  if (!filled.length) return '<div class="rost">' + head + '<p class="list-empty">' + tbcChip('data-roster="' + r.key + '"', 'Fill in this list') + '</p></div>';
  return '<div class="rost">' + head + '<ol class="rl">' + filled.map((x) => '<li><span class="no">' + x.n + '</span><span class="rcs">' + r.cols.map(([c, lab, opt]) => {
    const v = String(x.rw[c] ?? '').trim();
    return v ? '<span class="rc">' + esc(v) + '</span>' : (opt ? '' : tbcChip('data-roster="' + r.key + '"', lab));
  }).join('') + '</span></li>').join('') + '</ol></div>';
}
const whoLabel = { P: 'P', S: 'S', PS: 'P+S' };
function itemHTML(it) {
  if (it.when && !fieldVal(S.fields, it.when)) return '';
  if (it.k === 'list') return rosterHTML(it);
  if (it.k === 'cue') return '<p class="sd">' + phHTML(it.text) + '</p>';
  if (it.k === 'crit') return '<p class="crit">' + phHTML(it.text) + '</p>';
  return '<div class="ln' + (it.tpl ? ' tpl' : '') + '" data-s="' + it.who + '"><b class="b ' + it.who + '">' + whoLabel[it.who] + '</b><p>' + phHTML(it.text) + (it.tpl ? '<span class="tpl-tag">pattern</span>' : '') + '</p></div>';
}
function itemEditHTML(g, it, i) {
  const last = i === g.items.length - 1;
  const btn = (act, label, extra = '') => '<button type="button" class="btn sm" data-act="' + act + '" data-sg="' + g.id + '" data-id="' + it.id + '" aria-label="' + extra + '">' + label + '</button>';
  const who = it.k === 'line' ? '<button type="button" class="b2 ' + it.who + '" data-act="it-who" data-sg="' + g.id + '" data-id="' + it.id + '" aria-label="Who reads this: ' + it.who + '. Tap to change">' + whoLabel[it.who] + '</button>'
    : '<span class="kindtag">' + ({ cue: 'Cue', crit: 'Must', list: 'List' }[it.k]) + '</span>';
  const body = it.k === 'list'
    ? '<p class="listnote">List: ' + esc((META.rosters.find((x) => x.key === it.list) || { title: it.list }).title) + '. Edit its rows on the To fill tab.</p>'
    : taHTML('sc-' + it.id, 'data-sit="' + it.id + '" data-sg="' + g.id + '"', it.text, 'Text. Use {name} for a blank', it.k === 'crit' ? 'crit-in' : '', (it.k === 'line' ? 'Line' : it.k === 'cue' ? 'Cue' : 'Must-not-miss note'));
  return '<div class="ln edit" data-s="' + it.who + '"><div class="ictl">' + who + '</div><div class="ibody">' + body + '</div><div class="iact">' +
    btn('it-up', '▲', 'Move up').replace('class="btn sm"', 'class="btn sm"' + (i === 0 ? ' disabled' : '')) + btn('it-down', '▼', 'Move down').replace('class="btn sm"', 'class="btn sm"' + (last ? ' disabled' : '')) +
    btn('it-del', '✕', 'Delete').replace('class="btn sm"', 'class="btn sm danger"') + '</div></div>';
}
function scriptSegHTML(g, i, ef) {
  const ed = editLines && editing();
  const label = (g.seg || 'Segment') + ' · ' + fmt12(g.time);
  const head = ed
    ? '<header class="seg-h">' + timeHTML('sg-t-' + g.id, 'data-sgtime="' + g.id + '"', g.time, '') + taHTML('sg-n-' + g.id, 'data-sgf="seg" data-sg="' + g.id + '"', g.seg, 'Segment name', 'sin') + '</header>' +
      taHTML('sg-z-' + g.id, 'data-sgf="zh" data-sg="' + g.id + '"', g.zh, 'Chinese name', 'subf') + taHTML('sg-a-' + g.id, 'data-sgf="at" data-sg="' + g.id + '"', g.at, 'Where the MCs stand', 'subf')
    : '<header class="seg-head"><div class="seg-meta"><time>' + esc(fmt12(g.time)) + '</time>' + (g.key ? '<span class="pill key">Key</span>' : '') + '<span class="pill now">Now</span></div><h2>' + esc(g.seg) + (g.zh ? ' <span class="zh2">' + esc(g.zh) + '</span>' : '') + '</h2>' + (g.at ? '<p class="at">' + esc(g.at) + '</p>' : '') + '</header>';
  const tools = ed ? '<div class="rt"><button type="button" class="btn" data-act="it-add-line" data-sg="' + g.id + '">+ Line</button><button type="button" class="btn" data-act="it-add-cue" data-sg="' + g.id + '">+ Cue</button><button type="button" class="btn" data-act="it-add-crit" data-sg="' + g.id + '">+ Must-not-miss</button>' +
    '<button type="button" class="btn" data-act="sg-up" data-sg="' + g.id + '" aria-label="Move segment up"' + (i === 0 ? ' disabled' : '') + '>▲</button><button type="button" class="btn" data-act="sg-down" data-sg="' + g.id + '" aria-label="Move segment down"' + (i === S.script.length - 1 ? ' disabled' : '') + '>▼</button>' +
    '<button type="button" class="btn" data-act="sg-add" data-sg="' + g.id + '">+ Segment below</button><button type="button" class="btn danger" data-act="sg-del" data-sg="' + g.id + '">Delete segment</button></div>' : '';
  return '<article class="seg sseg" id="sg-' + g.id + '" data-sg="' + g.id + '" data-label="' + esc(label) + '">' + head + '<div class="lines">' +
    g.items.map((it, n) => (ed ? itemEditHTML(g, it, n) : itemHTML(it))).join('') + '</div>' + tools + '</article>';
}
const scriptToc = () => S.script.map((g) => '<button type="button" class="chip" data-sgc="' + g.id + '"><time>' + esc(fmt12(g.time)).replace(' ', '') + '</time>' + esc(g.seg) + '</button>').join('');
function renderScript() {
  const ed = editLines && editing();
  return '<div class="who me" role="group" aria-label="Whose lines">' + ME.map((m) => '<button type="button" data-me="' + m[0] + '" aria-pressed="' + (P.me === m[0]) + '">' + (m[0] === 'both' ? '' : '<b class="b ' + m[0] + '">' + m[0] + '</b>') + m[1] + '</button>').join('') + '</div>' +
    '<div class="hintrow"><p class="hint">Pick your name: your lines show large and your partner’s shrink to hand-off cues. Paul reads English, Salli reads Mandarin. Yellow means still to fill: tap it.</p>' + sizeBtns() + '</div>' +
    (editing() ? '<div class="cutbar"><button type="button" class="btn" id="editLines" aria-pressed="' + editLines + '">' + (editLines ? 'Done editing lines' : '✎ Edit lines') + '</button>' + (editLines ? '<button type="button" class="btn" id="swapMCs">Swap who reads which language</button>' : '') + '</div>' : '') +
    '<nav class="toc" id="toc" aria-label="Segments">' + scriptToc() + '</nav><div id="segs">' + S.script.map((g, i) => scriptSegHTML(g, i)).join('') + '</div>' +
    (ed ? '<button type="button" class="btn add" data-act="sg-add">+ Add segment</button>' : '');
}

/* ---------- to fill ---------- */
const scriptKeys = () => [...new Set(S.script.flatMap((g) => g.items.flatMap((it) => keysIn(it.text || ''))))];
function fieldBlock(f) {
  const [k, label, , hint, opt] = f, v = S.fields[k] ?? '', st = opt ? 'opt' : (String(v).trim() ? 'ok' : 'need');
  return '<div class="field ' + st + '" data-fk="' + esc(k) + '"><label class="lab" for="fld-' + esc(k) + '"><span>' + esc(label) + '</span><span class="tag">' + (opt ? 'Optional' : st === 'ok' ? 'Done' : 'To fill') + '</span></label>' + inHTML('fld-' + k, 'data-f="' + esc(k) + '"', v, hint || '', 'fi', '') + '</div>';
}
function rosterBlock(r) {
  const rows = S.rosters[r.key] || [], done = rows.some((rw) => rowDone(r.cols, rw));
  return '<div class="lform ' + (done ? 'ok' : 'need') + '" id="rost-' + r.key + '"><div class="lab"><span>' + esc(r.title) + '</span><span class="tag">' + (done ? 'Done' : 'To fill') + '</span></div>' +
    rows.map((rw, i) => '<div class="lrow' + (rowAny(r.cols, rw) ? ' ok' : '') + '"><span class="n">' + (i + 1) + '</span><div class="lcols">' +
      r.cols.map(([c, lab, opt]) => inHTML('rr-' + r.key + '-' + i + '-' + c, 'data-rr="' + r.key + '" data-ri="' + i + '" data-rc="' + c + '"', rw[c] ?? '', lab + (opt ? ' (optional)' : ''), 'fi', lab)).join('') + '</div></div>').join('') +
    '<div class="rt"><button type="button" class="btn" data-act="r-add" data-id="' + r.key + '">+ Add row</button><button type="button" class="btn danger" data-act="r-del" data-id="' + r.key + '">Delete last row</button></div></div>';
}
function renderFill() {
  const known = new Set(META.fields.map((f) => f[0])), extra = scriptKeys().filter((k) => !known.has(k)), l = leftOf(S, META);
  const all = META.fields.filter((f) => !f[4]).length + META.rosters.length;
  const groups = META.groups.map(([gk, gl]) => {
    const fs = META.fields.filter((f) => f[2] === gk), rs = META.rosters.filter((r) => r.group === gk);
    return '<section class="grp" data-g="' + gk + '"><h3>' + esc(gl) + '</h3>' + fs.map(fieldBlock).join('') + rs.map(rosterBlock).join('') + '</section>';
  });
  if (extra.length) groups.push('<section class="grp" data-g="other"><h3>Other blanks</h3>' + extra.map((k) => fieldBlock([k, k, 'other', 'type it here', true])).join('') + '</section>');
  return '<div class="sum"><p class="count"><b id="leftN">' + l.total + '</b> <span id="leftWord">' + (l.total === 1 ? 'blank left' : 'blanks left') + '</span></p><div class="meter" aria-hidden="true"><i id="bar" style="width:' + (all ? Math.round((all - l.total) / all * 100) : 100) + '%"></i></div>' +
    '<p class="hint">Fill these in before the night. Anything blank shows in yellow in the script.</p><label class="only" for="onlyBlank"><input type="checkbox" id="onlyBlank"' + (showBlank ? ' checked' : '') + '> Show blanks only</label></div>' +
    '<div id="groups" class="' + (showBlank ? 'only-blank' : '') + '">' + groups.join('') + '</div>';
}
function paintFill() {
  const l = leftOf(S, META), all = META.fields.filter((f) => !f[4]).length + META.rosters.length;
  const n = $('#leftN'); if (n) { n.textContent = l.total; $('#leftWord').textContent = l.total === 1 ? 'blank left' : 'blanks left'; $('#bar').style.width = (all ? Math.round((all - l.total) / all * 100) : 100) + '%'; }
  $$('.grp').forEach((g) => g.classList.toggle('done', !g.querySelector('.field.need, .lform.need')));
  paintBadge();
}
function goFill(k, isRoster) {
  P.tab = 'fill'; saveP(); try { history.replaceState(null, '', '#fill'); } catch (x) { /* ignore */ } renderPanel();
  const box = isRoster ? $('#rost-' + k) : $('[data-fk="' + k + '"]'); if (!box) return;
  const inputs = $$('input', box), el = isRoster ? (inputs.find((i) => !i.value) || inputs[0]) : inputs[0];
  goTo(box); if (el) el.focus({ preventScroll: true });
  box.classList.remove('flash'); void box.offsetWidth; box.classList.add('flash');
}

/* ---------- run sheet (the committee's cues) ---------- */
function cueHTML(p, r, c) {
  const id = p + '-' + r.id + '-' + c.k, v = r[c.k] || '';
  return '<div class="cue c-' + c.c + (v.trim() ? '' : ' blank') + '"><label class="cl" for="' + id + '">' + c.n + '</label>' + taHTML(id, 'data-r="' + r.id + '" data-k="' + c.k + '"', v, editing() ? 'Add ' + c.n.toLowerCase() + ' cue' : 'No cue', '', '') + '</div>';
}
const rowTools = (r, i) =>
  '<div class="rt"><button type="button" class="btn" data-act="up" data-id="' + r.id + '" aria-label="Move up"' + (i === 0 ? ' disabled' : '') + '>▲</button>' +
  '<button type="button" class="btn" data-act="down" data-id="' + r.id + '" aria-label="Move down"' + (i === S.rows.length - 1 ? ' disabled' : '') + '>▼</button>' +
  '<button type="button" class="btn" data-act="add" data-id="' + r.id + '">+ Add segment below</button>' +
  '<button type="button" class="btn danger" data-act="del" data-id="' + r.id + '">Delete</button></div>';
function segHTML(r, i, ef) {
  const cont = !r.time && !r.seg, label = (r.seg || 'Continued') + ' · ' + fmt12(ef[i]);
  return '<article class="seg' + (cont ? ' cont' : '') + '" id="s-' + r.id + '" data-row="' + r.id + '" data-label="' + esc(label) + '"><header class="seg-h">' + timeHTML('s-t-' + r.id, 'data-time="' + r.id + '"', r.time, ef[i]) +
    taHTML('s-g-' + r.id, 'data-r="' + r.id + '" data-k="seg"', r.seg, 'Segment name', 'sin') + '<span class="pill now">Now</span></header>' +
    '<div class="cues">' + COLS.map((c) => cueHTML('s', r, c)).join('') + '</div>' + rowTools(r, i) + '</article>';
}
const tocHTML = (ef) => S.rows.map((r, i) => (r.time || r.seg ? '<button type="button" class="chip" data-seg="' + r.id + '"><time>' + fmt12(ef[i]).replace(' ', '') + '</time>' + esc(r.seg) + '</button>' : '')).join('');
function renderCards() {
  const ef = effTimes(S.rows);
  return '<div class="who" role="group" aria-label="Show cues for">' + TEAMS.map((w) => '<button type="button" data-who="' + w[0] + '" aria-pressed="' + (P.who === w[0]) + '">' + (w[0] === 'all' ? '' : '<span class="dot d-' + w[0] + '"></span>') + w[1] + '</button>').join('') + '</div>' +
    '<div class="hintrow"><p class="hint">Pick your team to enlarge its cues. ' + (editing() ? 'Tap any text to change it.' : (canWrite ? 'Editing is locked. Tap the padlock to edit.' : '')) + '</p>' + sizeBtns() + '</div>' +
    '<nav class="toc" id="toc" aria-label="Segments">' + tocHTML(ef) + '</nav><div id="segs">' + S.rows.map((r, i) => segHTML(r, i, ef)).join('') + '</div>' +
    '<button type="button" class="btn add edit-only" data-act="addEnd">+ Add segment</button>';
}
function renderGrid() {
  const ef = effTimes(S.rows);
  const head = ['Time', 'Segment'].concat(COLS.map((c) => (c.n === 'Committee' ? 'Committee actions and cues' : c.n))).concat(['']);
  const w = ['104px', '150px', '280px', '190px', '190px', '190px', '56px'];
  return '<p class="hint">' + (editing() ? 'Every cell is editable, as in the original sheet. ' : '') + 'Scroll sideways on a phone.</p><div class="tablewrap"><table class="grid"><colgroup>' + w.map((x) => '<col style="width:' + x + '">').join('') + '</colgroup><thead><tr>' +
    head.map((h) => '<th scope="col">' + h + '</th>').join('') + '</tr></thead><tbody>' +
    S.rows.map((r, i) => '<tr data-row="' + r.id + '"><td>' + timeHTML('g-t-' + r.id, 'data-time="' + r.id + '"', r.time, ef[i]) + '</td><td>' + taHTML('g-' + r.id + '-seg', 'data-r="' + r.id + '" data-k="seg"', r.seg, 'Segment name') + '</td>' +
      COLS.map((c) => '<td>' + taHTML('g-' + r.id + '-' + c.k, 'data-r="' + r.id + '" data-k="' + c.k + '"', r[c.k] || '', '', '', c.n) + '</td>').join('') +
      '<td class="rtc"><button type="button" class="btn" data-act="up" data-id="' + r.id + '" aria-label="Move up"' + (i === 0 ? ' disabled' : '') + '>▲</button><button type="button" class="btn" data-act="down" data-id="' + r.id + '" aria-label="Move down"' + (i === S.rows.length - 1 ? ' disabled' : '') + '>▼</button>' +
      '<button type="button" class="btn" data-act="add" data-id="' + r.id + '" aria-label="Add segment below">+</button><button type="button" class="btn danger" data-act="del" data-id="' + r.id + '" aria-label="Delete segment">✕</button></td></tr>').join('') +
    '</tbody></table></div><button type="button" class="btn add edit-only" data-act="addEnd" style="margin-top:12px">+ Add segment</button>';
}
const renderRun = () => '<div class="who two" role="group" aria-label="Run sheet view"><button type="button" data-view="cards" aria-pressed="' + (P.view === 'cards') + '">Cards</button><button type="button" data-view="grid" aria-pressed="' + (P.view === 'grid') + '">Grid, like the spreadsheet</button></div>' +
  '<div style="height:10px"></div>' + (P.view === 'grid' ? renderGrid() : renderCards());

/* ---------- notes ---------- */
const checkItemHTML = (it) => '<li class="it' + (it.done ? ' done' : '') + '" data-item="' + it.id + '"><label class="tick"><input type="checkbox" id="k-' + it.id + '-c" data-tick="' + it.id + '"' + (it.done ? ' checked' : '') + (canWrite ? '' : ' disabled') + ' aria-label="Done"><span class="no" aria-hidden="true">✓</span></label>' +
  taHTML('k-' + it.id, 'data-it="' + it.id + '" data-k="text"', it.text, 'Item') + '<button type="button" class="btn danger edit-only" data-act="delItem" data-id="' + it.id + '" aria-label="Delete item">✕</button></li>';
const listHTML = (l) => '<section class="card" data-list="' + l.id + '"><div class="lh">' + inHTML('k-' + l.id + '-title', 'data-li="' + l.id + '" data-k="title"', l.title, 'List name', 'lt') +
  '<span class="cnt">' + l.items.filter((i) => i.done).length + '/' + l.items.length + '</span></div><ul class="items">' + l.items.map(checkItemHTML).join('') + '</ul>' +
  '<div class="rt"><button type="button" class="btn" data-act="addItem" data-id="' + l.id + '">+ Add item</button><button type="button" class="btn danger" data-act="delList" data-id="' + l.id + '">Delete list</button></div></section>';
const fixHTML = (f) => '<li class="fx" data-fix="' + f.id + '"><div class="fx-h"><span class="kind k-' + esc(f.kind.toLowerCase()) + '">' + esc(f.kind) + '</span>' + taHTML('f-' + f.id + '-w', 'data-fx="' + f.id + '" data-k="where"', f.where, 'Where') + '</div>' +
  '<div class="fx-b">' + taHTML('f-' + f.id + '-a', 'data-fx="' + f.id + '" data-k="was"', f.was, 'Was', 'was') + '<span class="arr" aria-hidden="true">→</span>' + taHTML('f-' + f.id + '-b', 'data-fx="' + f.id + '" data-k="now"', f.now, 'Now', 'now') + '</div>' +
  '<div class="rt"><button type="button" class="btn danger" data-act="delFix" data-id="' + f.id + '">Delete</button></div></li>';
function renderNotes() {
  const all = S.lists.flatMap((l) => l.items), done = all.filter((i) => i.done).length;
  return shareHTML() + '<div class="sum"><p><b id="doneN">' + done + '</b><span id="doneOf">of ' + all.length + ' ticked</span></p><div class="meter" aria-hidden="true"><i id="cbar" style="width:' + (all.length ? Math.round(done / all.length * 100) : 0) + '%"></i></div></div>' +
    S.lists.map(listHTML).join('') + '<button type="button" class="btn add edit-only" data-act="addList">+ Add list</button>' +
    '<section class="card"><div class="lh"><h2 class="lt" style="margin:6px 8px">Changes made to the original sheet</h2></div><p class="hint" style="margin:0 8px 6px">Wording and times fixed when this page was built from the committee’s spreadsheet.</p><ul class="fxs">' + S.fixes.map(fixHTML).join('') + '</ul>' +
    '<button type="button" class="btn add edit-only" data-act="addFix" style="margin-top:8px;margin-bottom:0">+ Add a change</button></section>' +
    '<section class="card"><div class="lh"><h2 class="lt" style="margin:6px 8px">Notes</h2></div>' + taHTML('n-notes', 'data-n="notes"', S.notes, editing() ? 'Anything else the team should know' : 'No notes yet', '') + '</section>';
}
const PANELS = { script: renderScript, fill: renderFill, run: renderRun, notes: renderNotes };

/* ---------- shell ---------- */
function shell() {
  const tabs = TABS.map((t) => '<button type="button" data-tab="' + t[0] + '" aria-current="' + (P.tab === t[0]) + '">' + t[1] + (t[0] === 'fill' || t[0] === 'notes' ? '<span class="badge" id="badge-' + t[0] + '"></span>' : '') + '</button>').join('');
  $('#app').innerHTML =
    '<header class="mast" id="mast"><div class="wrap"><div class="mast-row"><div class="ttl">' +
    inHTML('m-org', 'data-m="org"', S.event.org, 'Organisation', 'eb') +
    '<h1>' + inHTML('m-title', 'data-m="title"', S.event.title, 'Event title', 'h1in') + '</h1>' +
    '<p class="sub"><span class="sv" id="subView"></span><span class="se"><input type="date" id="m-date" class="fld" data-m="date" value="' + esc(S.event.date) + '" aria-label="Date"' + ro() + '>' + inHTML('m-venue', 'data-m="venue"', S.event.venue, 'Venue') + '</span></p></div>' +
    '<div class="tools"><button type="button" class="icon-btn" id="theme" aria-label="Dark or light"><svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true"><circle cx="10" cy="10" r="7.2" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M10 2.8a7.2 7.2 0 0 1 0 14.4z" fill="currentColor"/></svg></button>' +
    (canWrite ? '<button type="button" class="icon-btn" id="lock" aria-pressed="' + P.locked + '" aria-label="' + (P.locked ? 'Locked. Tap to edit' : 'Editing. Tap to lock') + '">' + (P.locked
      ? '<svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true"><rect x="4" y="9" width="12" height="8" rx="2" fill="currentColor"/><path d="M7 9V6.5a3 3 0 0 1 6 0V9" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>'
      : '<svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true"><rect x="4" y="9" width="12" height="8" rx="2" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M7 9V6.5a3 3 0 0 1 5.8-1" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>') + '</button>' : (resolved ? '<span class="vo">View only</span>' : '')) +
    '</div></div><button type="button" class="nowbar" id="nowbar"><span id="clock">--:--</span><span id="nowtxt"></span><span class="go" aria-hidden="true">→</span></button>' +
    '<nav class="tabs" id="tabs" aria-label="Pages">' + tabs + '</nav></div><div class="foil" aria-hidden="true"></div></header>' +
    '<main class="wrap" id="panel"></main>' +
    '<nav class="pager" id="pager" aria-label="Step through segments"><button type="button" id="prev"><small>Previous</small><span id="prevName">—</span></button><button type="button" id="next"><small>Next</small><span id="nextName">—</span></button></nav>' +
    '<div class="toast" id="toast" role="status" aria-live="polite" hidden></div>';
  paintSub();
}
const hasCards = () => P.tab === 'script' || (P.tab === 'run' && P.view === 'cards');
function renderPanel() {
  $('#panel').innerHTML = bannerHTML() + PANELS[P.tab]();
  $('#pager').hidden = !hasCards();
  document.body.classList.toggle('wide', P.tab === 'run' && P.view === 'grid');
  $$('#tabs button').forEach((b) => b.setAttribute('aria-current', String(b.dataset.tab === P.tab)));
  document.body.dataset.who = P.who; document.body.dataset.me = P.me;
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
  const f = $('#badge-fill'), n = $('#badge-notes');
  if (f) { const left = leftOf(S, META).total; f.hidden = !left; f.textContent = left; }
  if (n) { const left = (S.lists.find((l) => l.title.toLowerCase() === 'to confirm') || { items: [] }).items.filter((i) => !i.done).length; n.hidden = !left; n.textContent = left; }
}
function setTab(t) { P.tab = t; saveP(); try { history.replaceState(null, '', '#' + t); } catch (x) { /* ignore */ } renderPanel(); scrollTo(0, 0); paintToast(); }

/* ---------- now bar, pager ---------- */
const FS_OK = !!(window.CSS && CSS.supports && CSS.supports('field-sizing', 'content'));
function autosize(el) { if (FS_OK || !el.offsetParent) return; el.style.height = 'auto'; el.style.height = (el.scrollHeight + 2) + 'px'; }
const autosizeAll = () => { if (!FS_OK) requestAnimationFrame(() => $$('textarea.fld').forEach(autosize)); };
const clockText = (m) => fmt12(pad(Math.floor(m / 60)) + ':' + pad(m % 60));

function paintNow() {
  const clock = $('#clock'), txt = $('#nowtxt'); if (!clock) return;
  const n = melNow(), stRun = nowState(S.rows, S.event.date, n), stScr = nowState(S.script, S.event.date, n);
  $$('.now').forEach((el) => el.classList.remove('now'));
  if (stRun.phase === 'live') S.rows.forEach((r, i) => { if (stRun.mins[i] === stRun.cur) $$('[data-row="' + r.id + '"], [data-seg="' + r.id + '"]').forEach((el) => el.classList.add('now')); });
  if (stScr.phase === 'live') S.script.forEach((g, i) => { if (stScr.mins[i] === stScr.cur) $$('[data-sg="' + g.id + '"], [data-sgc="' + g.id + '"]').forEach((el) => el.classList.add('now')); });
  const onRun = P.tab === 'run', st = onRun ? stRun : stScr, L = onRun ? S.rows : S.script, name = (r) => r.seg || 'Continued';
  const mins = (k) => k + (k === 1 ? ' minute' : ' minutes');
  const first = st.mins ? st.mins.filter((m) => m != null) : [];
  if (st.phase === 'live') {
    clock.textContent = clockText(st.n.min);
    const names = L.filter((r, i) => st.mins[i] === st.cur && r.seg).map(name).join(' + ');
    let nx = '';
    if (st.nxt != null) { const j = L.findIndex((r, i) => st.mins[i] === st.nxt && r.seg); nx = ' · next ' + clockText(st.nxt) + (j >= 0 ? ' ' + name(L[j]) : '') + ' in ' + mins(st.nxt - st.n.min); }
    txt.textContent = 'Now: ' + (names || 'running') + nx;
  } else if (st.phase === 'early') {
    clock.textContent = clockText(st.n.min);
    txt.textContent = 'Event day · first cue ' + clockText(Math.min.apply(null, first));
  } else if (st.phase === 'before') {
    clock.textContent = (+S.event.date.slice(8)) + ' ' + MONTHS[+S.event.date.slice(5, 7) - 1].slice(0, 3);
    txt.textContent = (st.days === 1 ? 'Tomorrow' : 'In ' + st.days + ' days') + ' · first cue ' + (first.length ? clockText(Math.min.apply(null, first)) : '');
  } else if (st.phase === 'after') { clock.textContent = 'Done'; txt.textContent = 'This event has finished'; }
  else { clock.textContent = '--:--'; txt.textContent = 'Set the event date to see the live bar'; }
}
const headBottom = () => { const m = $('#mast'); return m ? m.getBoundingClientRect().bottom : 0; };
const reduce = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
function goTo(el) { if (el) scrollTo({ top: el.getBoundingClientRect().top + scrollY - headBottom() - 10, behavior: reduce() ? 'auto' : 'smooth' }); }
const cardName = (el) => (el ? el.dataset.label || '—' : '—');
function where() { const cs = $$('#segs .seg'), hb = headBottom(); let idx = 0; cs.forEach((c, i) => { if (c.getBoundingClientRect().top <= hb + 24) idx = i; }); return { cs, idx, past: cs[idx] ? cs[idx].getBoundingClientRect().top < hb - 6 : false }; }
function paintPager() {
  if (!hasCards() || !$('#prevName')) return;
  const w = where();
  $('#prevName').textContent = cardName(w.past ? w.cs[w.idx] : w.cs[w.idx - 1]);
  $('#nextName').textContent = cardName(w.cs[w.idx + 1]);
  $('#prev').disabled = !w.past && w.idx === 0; $('#next').disabled = w.idx >= w.cs.length - 1;
}
function step(d) { const w = where(); goTo(d < 0 ? (w.past ? w.cs[w.idx] : w.cs[w.idx - 1]) : w.cs[w.idx + 1]); }

/* ---------- edits ---------- */
const swap = (a, i, j) => { const t = a[i]; a[i] = a[j]; a[j] = t; };
const newRow = () => ({ id: 'r' + uid(), time: '', seg: '', d: '', s: '', l: '', v: '' });
function refreshRow(id) {
  const r = row(id); if (!r) return;
  $$('#segs [data-row="' + id + '"]').forEach((el) => el.classList.toggle('cont', !r.time && !r.seg));
  const ef = effTimes(S.rows);
  S.rows.forEach((x, i) => $$('input[data-time="' + x.id + '"]').forEach((el) => { el.placeholder = ef[i] ? fmt12(ef[i]) : 'Time'; }));
  const toc = $('#toc'); if (toc && P.tab === 'run') toc.innerHTML = tocHTML(ef);
  paintNow(); paintPager();
}
function rowAct(act, id) {
  const i = S.rows.findIndex((r) => r.id === id); let focus = null;
  if (act === 'up' && i > 0) { swap(S.rows, i, i - 1); focus = id; }
  else if (act === 'down' && i >= 0 && i < S.rows.length - 1) { swap(S.rows, i, i + 1); focus = id; }
  else if (act === 'del' && i >= 0) S.rows.splice(i, 1);
  else if (act === 'add' && i >= 0) { const n = newRow(); S.rows.splice(i + 1, 0, n); focus = n.id; }
  else if (act === 'addEnd') { const n = newRow(); S.rows.push(n); focus = n.id; }
  else return;
  touch(); renderPanel();
  if (focus) { const el = $('#s-t-' + focus) || $('#g-t-' + focus); if (el) { goTo(el.closest('[data-row]') || el); if (act === 'add' || act === 'addEnd') el.focus({ preventScroll: true }); } }
}
function scriptAct(act, sgid, id) {
  const g = seg(sgid), gi = S.script.findIndex((x) => x.id === sgid);
  const items = g ? g.items : [], i = items.findIndex((x) => x.id === id);
  const addItem = (k) => { const it = { id: 't' + uid(), k, who: 'P', text: '', tpl: false, when: '', list: '', frm: null, to: null }; items.push(it); return 'sc-' + it.id; };
  let focus = null;
  if (act === 'sg-add') { const n = { id: 'g' + uid(), time: '', seg: '', zh: '', at: '', key: false, items: [] }; S.script.splice(gi < 0 ? S.script.length : gi + 1, 0, n); focus = 'sg-n-' + n.id; }
  else if (act === 'sg-del' && g) S.script.splice(gi, 1);
  else if (act === 'sg-up' && gi > 0) { swap(S.script, gi, gi - 1); focus = 'sg-n-' + sgid; }
  else if (act === 'sg-down' && gi >= 0 && gi < S.script.length - 1) { swap(S.script, gi, gi + 1); focus = 'sg-n-' + sgid; }
  else if (act === 'it-add-line' && g) focus = addItem('line');
  else if (act === 'it-add-cue' && g) focus = addItem('cue');
  else if (act === 'it-add-crit' && g) focus = addItem('crit');
  else if (act === 'it-up' && i > 0) swap(items, i, i - 1);
  else if (act === 'it-down' && i >= 0 && i < items.length - 1) swap(items, i, i + 1);
  else if (act === 'it-del' && i >= 0) items.splice(i, 1);
  else if (act === 'it-who' && i >= 0) items[i].who = items[i].who === 'P' ? 'S' : items[i].who === 'S' ? 'PS' : 'P';
  else return;
  touch(); renderPanel();
  if (focus) { const el = $('#' + focus); if (el) { goTo(el.closest('.seg') || el); el.focus({ preventScroll: true }); } }
}
function swapMCs() {
  S.script.forEach((g) => g.items.forEach((it) => { if (it.k === 'line') { if (it.who === 'P') it.who = 'S'; else if (it.who === 'S') it.who = 'P'; } }));
  touch(); renderPanel(); flash('Swapped: Paul and Salli now read each other’s lines');
}
function listAct(act, id) {
  if (act === 'addItem') { const l = S.lists.find((x) => x.id === id); if (!l) return; const it = { id: 'i' + uid(), text: '', done: false }; l.items.push(it); touch(); renderPanel(); const el = $('#k-' + it.id); if (el) el.focus(); }
  else if (act === 'delItem') { S.lists.forEach((l) => { l.items = l.items.filter((i) => i.id !== id); }); touch(); renderPanel(); }
  else if (act === 'addList') { const l = { id: 'l' + uid(), title: '', items: [] }; S.lists.push(l); touch(); renderPanel(); const el = $('#k-' + l.id + '-title'); if (el) el.focus(); }
  else if (act === 'delList') { S.lists = S.lists.filter((l) => l.id !== id); touch(); renderPanel(); }
  else if (act === 'addFix') { const f = { id: 'x' + uid(), kind: 'Note', where: '', was: '', now: '' }; S.fixes.push(f); touch(); renderPanel(); const el = $('#f-' + f.id + '-w'); if (el) el.focus(); }
  else if (act === 'delFix') { S.fixes = S.fixes.filter((f) => f.id !== id); touch(); renderPanel(); }
  else if (act === 'r-add') { const r = META.rosters.find((x) => x.key === id); if (!r) return; (S.rosters[id] ||= []).push(Object.fromEntries(r.cols.map((c) => [c[0], '']))); touch(); renderPanel(); const box = $('#rost-' + id); if (box) { const ins = $$('input', box); if (ins.length) ins[ins.length - r.cols.length].focus(); } }
  else if (act === 'r-del') { const rows = S.rosters[id] || []; if (rows.length > 1) rows.pop(); touch(); renderPanel(); }
}
function paintChecks() {
  const all = S.lists.flatMap((l) => l.items), done = all.filter((i) => i.done).length;
  const n = $('#doneN'); if (n) { n.textContent = done; $('#doneOf').textContent = 'of ' + all.length + ' ticked'; $('#cbar').style.width = (all.length ? Math.round(done / all.length * 100) : 0) + '%'; }
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
  else if (d.sit) { const g = seg(d.sg), it = g && g.items.find((x) => x.id === d.sit); if (it) it.text = el.value; }
  else if (d.sgf) { const g = seg(d.sg); if (g) g[d.sgf] = el.value; }
  else if (d.f) { S.fields[d.f] = el.value; const box = el.closest('.field'); if (box && !box.classList.contains('opt')) { const ok = !!el.value.trim(); box.classList.toggle('ok', ok); box.classList.toggle('need', !ok); $('.tag', box).textContent = ok ? 'Done' : 'To fill'; } paintFill(); }
  else if (d.rr) {
    const rows = S.rosters[d.rr] || (S.rosters[d.rr] = []), rw = rows[+d.ri] || (rows[+d.ri] = {}); rw[d.rc] = el.value;
    const r = META.rosters.find((x) => x.key === d.rr), box = el.closest('.lform');
    if (r && box) { const ok = rows.some((x) => rowDone(r.cols, x)); box.classList.toggle('ok', ok); box.classList.toggle('need', !ok); $('.tag', box).textContent = ok ? 'Done' : 'To fill'; el.closest('.lrow').classList.toggle('ok', rowAny(r.cols, rw)); }
    paintFill();
  }
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
  if ((d.time || d.sgtime) && !el.readOnly) {
    const r = d.time ? row(d.time) : seg(d.sgtime), v = parseTime(el.value); if (!r) return;
    if (v === null) { el.value = fmt12(r.time); flash('Time not understood. Try 7:30pm or 19:30.'); return; }
    r.time = v; el.value = fmt12(v); if (d.time) refreshRow(r.id); else paintNow(); touch();
  } else if (d.tick && canWrite) {
    S.lists.forEach((l) => l.items.forEach((i) => { if (i.id === d.tick) i.done = el.checked; }));
    const li = el.closest('.it'); if (li) li.classList.toggle('done', el.checked);
    paintChecks(); touch();
  } else if (el.id === 'onlyBlank') { showBlank = el.checked; const g = $('#groups'); if (g) g.classList.toggle('only-blank', showBlank); }
});
app.addEventListener('keydown', (e) => { if (e.key === 'Enter' && e.target.matches && e.target.matches('[data-k="seg"], [data-sgf="seg"], .lt, .h1in, .eb, input.fi')) { e.preventDefault(); e.target.blur(); } });
app.addEventListener('click', (e) => {
  const b = e.target.closest('button'); if (!b) return;
  const d = b.dataset, id = b.id, act = d.act;
  if (d.tab) return setTab(d.tab);
  if (d.me) { P.me = d.me; saveP(); document.body.dataset.me = P.me; $$('.who.me button').forEach((x) => x.setAttribute('aria-pressed', String(x.dataset.me === P.me))); return paintPager(); }
  if (d.who) { P.who = d.who; saveP(); document.body.dataset.who = P.who; $$('.who button[data-who]').forEach((x) => x.setAttribute('aria-pressed', String(x.dataset.who === P.who))); return paintPager(); }
  if (d.view) { P.view = d.view; saveP(); renderPanel(); return scrollTo(0, 0); }
  if (d.seg) return goTo($('#s-' + d.seg));
  if (d.sgc) return goTo($('#sg-' + d.sgc));
  if (d.fld) return goFill(d.fld, false);
  if (d.roster) return goFill(d.roster, true);
  if (id === 'smaller' || id === 'bigger') { P.fs = Math.max(14, Math.min(28, P.fs + (id === 'bigger' ? 2 : -2))); saveP(); document.documentElement.style.setProperty('--fs', P.fs + 'px'); return autosizeAll(); }
  if (id === 'theme') { const dark = P.theme ? P.theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches; P.theme = dark ? 'light' : 'dark'; saveP(); return applyTheme(); }
  if (id === 'lock') { P.locked = !P.locked; saveP(); return renderAll(); }
  if (id === 'editLines') { editLines = !editLines; return renderPanel(); }
  if (id === 'swapMCs') return arm(b, swapMCs);
  if (id === 'prev') return step(-1);
  if (id === 'next') return step(1);
  if (id === 'nowbar') { if (!hasCards()) { P.tab = 'script'; saveP(); renderPanel(); } const cur = $('#segs .seg.now'); if (cur) goTo(cur); else scrollTo({ top: 0 }); return; }
  if (!act) return;
  if (['up', 'down', 'add', 'addEnd'].includes(act)) return rowAct(act, d.id);
  if (act === 'del') return arm(b, () => rowAct('del', d.id));
  if (act.startsWith('sg-') || act.startsWith('it-')) { if (['sg-del', 'it-del'].includes(act)) return arm(b, () => scriptAct(act, d.sg, d.id)); return scriptAct(act, d.sg, d.id); }
  if (['delItem', 'delList', 'delFix', 'r-del'].includes(act)) return arm(b, () => listAct(act, d.id));
  listAct(act, d.id);
});
addEventListener('scroll', (() => { let raf = 0; return () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(paintPager); }; })(), { passive: true });
addEventListener('resize', autosizeAll);
addEventListener('hashchange', () => { const old = P.tab + P.view; if (readHash() && old !== P.tab + P.view) { saveP(); renderPanel(); scrollTo(0, 0); } });
let lock = null;
async function wake() { try { if (!lock && document.visibilityState === 'visible' && navigator.wakeLock) { lock = await navigator.wakeLock.request('screen'); lock.addEventListener('release', () => { lock = null; }); } } catch (e) { lock = null; } }
addEventListener('pointerdown', wake, { passive: true });
if (document.fonts && document.fonts.ready) document.fonts.ready.then(autosizeAll);

/* ---------- saving: this phone only ---------- */
const canWrite = true, resolved = true;
let saveTimer = 0, pending = false, undoState = null, pendingImport = null;
const bannerHTML = () => (pendingImport ? '<div class="banner" id="importBanner"><p>A version was sent to you: ' + pendingImport.script.length + ' script segments and ' + pendingImport.rows.length + ' run sheet rows. Applying it replaces the changes on this phone. Undo is available.</p><div><button type="button" class="btn primary" id="doImport">Apply it</button><button type="button" class="btn" id="skipImport">Not now</button></div></div>' : '');
const shareHTML = () => '<section class="card" id="share"><div class="lh"><h2 class="lt" style="margin:6px 8px">Share with the other MC</h2></div>' +
  '<p class="hint" style="margin:0 8px 10px">Your edits are saved on this phone. One phone is the master. After you change the script, tap Publish my version; every other phone taps Sync from master to get it. The newest published version wins.</p>' +
  '<div class="btns"><button type="button" class="btn primary" id="sendMaster">Publish my version</button><button type="button" class="btn" id="getMaster">Sync from master</button></div>' +
  '<p class="msg" id="syncMsg" role="status" hidden></p>' +
  '<div class="btns"><button type="button" class="btn" id="copyLink">Copy a link to send</button><button type="button" class="btn" id="undoImport"' + (undoState ? '' : ' hidden') + '>Undo</button></div>' +
  '<textarea id="shareOut" class="fld code" rows="3" readonly hidden aria-label="Link to send"></textarea>' +
  '<p class="msg" id="shareMsg" role="status"></p>' +
  '<label class="cl2" for="pasteIn">Paste a link or code from someone else</label>' +
  '<textarea id="pasteIn" class="fld code" rows="3" placeholder="https://\u2026#LIONS3.\u2026" aria-label="Paste a link or code"></textarea>' +
  '<div class="btns"><button type="button" class="btn" id="pasteGo">Load this version</button></div>' +
  '<p class="msg" id="pasteMsg" role="status"></p>' +
  '<div class="btns"><button type="button" class="btn danger" id="resetAll">Reset to the original sheet</button></div></section>';
function paintToast() {
  const t = $('#toast'); if (!t) return;
  const text = notice || flashText;
  t.className = 'toast' + (notice ? ' warn' : '') + (hasCards() ? '' : ' plain');
  t.textContent = text; t.hidden = !text;
}
function persist() {
  pending = false;
  try { localStorage.setItem(KEY, JSON.stringify(S)); flash('Saved on this phone', 1600); }
  catch (e) { setNotice('This browser would not save your changes. Keep this page open, or copy them from Notes.', 12000); }
}
function touch() { pending = true; clearTimeout(saveTimer); saveTimer = setTimeout(persist, 500); }

// One-tap sync, as on Night to Shine. The master phone taps Publish my version: the whole sheet goes to a small public relay (ntfy.sh, one room for this
// event). Every other phone taps Sync from master: it fetches the newest version, applies it (replacing that phone's edits) and offers Undo.
// If the relay cannot be reached (venue wifi, offline) the link still works: it opens this page with the version in the address, and asks before applying it.
const RELAY = 'https://ntfy.sh/', ROOM = 'lions-2026-11-21-e02758128387bf84', RELAY_MAX = 3600;
const hhmm = (ms) => new Date(ms).toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit', hour12: true });
const msgIn = (id, text, err) => { const el = $(id); if (!el) return; el.textContent = text; el.hidden = !text; el.className = 'msg' + (err ? ' err' : ''); };
const relay = async (path, init) => {
  const ctl = new AbortController(), t = setTimeout(() => ctl.abort(), 8000);
  try { const r = await fetch(RELAY + ROOM + path, { ...init, signal: ctl.signal, cache: 'no-store' }); if (!r.ok) throw new Error('relay ' + r.status); return r; }
  finally { clearTimeout(t); }
};
async function publishCode(code) {
  if (code.length <= RELAY_MAX) { await relay('', { method: 'POST', body: code }); return 1; }
  const ps = toParts(code, Date.now().toString(36));
  for (const body of ps) await relay('', { method: 'POST', body });
  return ps.length;
}
async function latestMaster() {
  const lines = (await (await relay('/json?poll=1&since=all')).text()).split('\n');
  return pickMaster(lines.map((l) => { try { return JSON.parse(l); } catch (e) { return null; } }));
}
const shareLink = async () => location.origin + location.pathname + '#' + await encode(S, { end: false });
function applyVersion(next, say) {
  undoState = clone(S); replaceState(next); persist(); renderAll();
  const u = $('#undoImport'); if (u) u.hidden = false;
  msgIn('#syncMsg', say);
}
function offerVersion(next) { pendingImport = next; renderPanel(); scrollTo(0, 0); }
async function sendMaster() {
  const btn = $('#sendMaster'); if (btn) btn.disabled = true; msgIn('#syncMsg', 'Publishing\u2026');
  try {
    const code = await encode(S), link = await shareLink();
    let pre = '';
    try {
      await publishCode(code);
      try { await navigator.clipboard.writeText(link); } catch (e) { /* the copy is only a spare */ }
      return msgIn('#syncMsg', 'Published at ' + hhmm(Date.now()) + '. Other phones just tap Sync from master.');
    } catch (e) { pre = e && e.message === 'too big' ? 'Too big for the sync service, so use the link.' : 'Could not reach the sync service, so use the link.'; }
    let copied = false;
    try { await navigator.clipboard.writeText(link); copied = true; } catch (e) { /* the share sheet or the box below still work */ }
    try {
      if (navigator.share) { await navigator.share({ title: 'Lions Charity Ball: master version', text: 'Lions Charity Ball: the latest MC script. Open the link and tap Apply it.', url: link }); return msgIn('#syncMsg', pre + ' The share sheet opened' + (copied ? ', and the link is copied.' : '.'), true); }
    } catch (e) { if (e && e.name === 'AbortError') return msgIn('#syncMsg', pre + (copied ? ' Sharing cancelled; the link is copied, so you can paste it into a message.' : ''), true); }
    if (copied) return msgIn('#syncMsg', pre + ' The link is copied: paste it into a message.', true);
    const out = $('#shareOut'); if (out) { out.value = link; out.hidden = false; out.select(); }
    msgIn('#syncMsg', pre + ' Select all and copy the link below.', true);
  } finally { const b = $('#sendMaster'); if (b) b.disabled = false; }
}
async function getMaster() {
  const btn = $('#getMaster'); if (btn) btn.disabled = true; msgIn('#syncMsg', 'Syncing\u2026');
  try {
    let m = null, down = false;
    try { m = await latestMaster(); } catch (e) { down = true; }
    const next = m && await decode(m.message, DEFAULT);
    if (next) return applyVersion(next, 'Synced: the master was published at ' + hhmm(m.time * 1000) + '. Undo brings your earlier version back.');
    const why = down ? 'Could not reach the sync service. ' : 'Nothing has been published yet. ';
    try {
      const clip = await decode(await navigator.clipboard.readText(), DEFAULT);
      if (clip) return offerVersion(clip);
      msgIn('#syncMsg', why + 'Copy the link from the other MC\u2019s message first, then tap Sync again.', true);
    } catch (e) { msgIn('#syncMsg', why + 'Paste their link in the box below.', true); }
  } finally { const b = $('#getMaster'); if (b) b.disabled = false; }
}
async function copyLink() {
  const link = await shareLink(), out = $('#shareOut');
  out.value = link;
  const manual = () => { out.hidden = false; out.focus(); out.select(); msgIn('#shareMsg', 'Select all and copy this link.'); };
  if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(link).then(() => msgIn('#shareMsg', 'Link copied. Send it in a chat; the other MC opens it and taps Apply it.'), manual);
  else manual();
}
async function pasteGo() {
  const next = await decode($('#pasteIn').value, DEFAULT);
  if (!next) return msgIn('#pasteMsg', 'No version found. Paste the whole link or code, starting at the address or LIONS.', true);
  offerVersion(next);
}
function undoImport() { if (!undoState) return; replaceState(undoState); undoState = null; persist(); renderAll(); msgIn('#syncMsg', 'Undone. Your earlier version is back.'); }
function resetAll() { undoState = clone(S); replaceState(DEFAULT); persist(); renderAll(); const u = $('#undoImport'); if (u) u.hidden = false; msgIn('#syncMsg', 'Back to the original sheet. Undo brings your edits back.'); }
app.addEventListener('click', (e) => {
  const b = e.target.closest('button'); if (!b) return;
  if (b.id === 'sendMaster') return sendMaster();
  if (b.id === 'getMaster') return getMaster();
  if (b.id === 'copyLink') return copyLink();
  if (b.id === 'pasteGo') return pasteGo();
  if (b.id === 'undoImport') return undoImport();
  if (b.id === 'resetAll') return arm(b, resetAll);
  if (b.id === 'doImport') { const next = pendingImport; pendingImport = null; if (next) applyVersion(next, 'Applied. Undo brings your earlier version back.'); return; }
  if (b.id === 'skipImport') { pendingImport = null; return renderPanel(); }
});
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden' && pending) persist(); else wake(); });
addEventListener('pagehide', () => { if (pending) persist(); });

/* ---------- start ---------- */
renderAll();
setInterval(paintNow, 15000);
// A link carries a version after "#": show it and ask before replacing anything, then clear it from the address so a reload does not ask again.
if (/^#LIONS/.test(location.hash)) {
  const h = location.hash;
  try { history.replaceState(null, '', location.pathname + location.search); } catch (e) { /* ignore */ }
  decode(h, DEFAULT).then((next) => { if (next) offerVersion(next); else setNotice('That link could not be read. Ask for it to be sent again.', 10000); });
}
const onPages = /github\.io$/.test(location.hostname);
try { if ('serviceWorker' in navigator && onPages) navigator.serviceWorker.register('../sw.js').catch(() => {}); } catch (e) { /* not allowed here */ }

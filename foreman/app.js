// Foreman (Victorian build studio): UI shell. The 3D engine lives in engine.js, each step in step-NN.js, the master plan in plan.js.
import { Stage } from './engine.js';
import { STAGES, CROSS, ACTS, FLAGS, SOURCES, CHECKED, NOTES, NOTES_FOLDER, LOOP, NCC, NCC_BY_STAGE, NCC_NOTE, NCC_CHECKED } from './plan.js';
import step1 from './step-01.js';
import step2 from './step-02.js';
import step3 from './step-03.js';
import step4 from './step-04.js';
import step5 from './step-05.js';
import step6 from './step-06.js';
import step7 from './step-07.js';

const BUILT = { 1: step1, 2: step2, 3: step3, 4: step4, 5: step5, 6: step6, 7: step7 };
const TABS = [['3d', '3D model'], ['draw', 'Drawings'], ['how', 'Step by step'], ['trades', 'Trades'], ['mat', 'Materials'], ['quote', 'Quotes'], ['insp', 'Inspections'], ['exam', 'Exam'], ['study', 'NCC and notes']];
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const md = (s) => esc(s).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
const flagHtml = (f) => (FLAGS[f] ? `<span class="flag f${f}" title="${esc(FLAGS[f].hint)}">${FLAGS[f].label}</span>` : '');
const nccLink = (e) => (e.url ? ` <a href="${esc(e.url)}" target="_blank" rel="noopener noreferrer">NCC 2022 page</a>${e.found ? '' : '<span class="mini"> (address built from the site pattern)</span>'}` : '');
const nccRow = (e) => `<li><span class="chip">${esc(e.code)}</span> ${esc(e.title)} <span class="mini">${esc(e.sec)}</span>${nccLink(e)}</li>`;
function nccHtml(n) {
  const m = NCC_BY_STAGE[n]; if (!m) return '';
  return `<h3 class="sec-title">NCC for this step ${flagHtml('C')}</h3><p class="lead">${esc(NCC_NOTE)}</p>
    <div class="grid"><article class="card"><h3>Housing Provisions</h3><ul class="list">${m.hp.map((k) => nccRow(NCC.hp[k])).join('')}</ul></article>
    <article class="card"><h3>Volume Two (Class 1 and 10)</h3><ul class="list">${m.vt.map((k) => nccRow(NCC.vt[k])).join('')}</ul></article>
    <article class="card"><h3>Open the text and sources</h3><ul class="list"><li>${srcHtml('ncc25hp')}</li><li>${srcHtml('ncc25v2')}</li>${(m.also || []).map((k) => `<li>${srcHtml(k)}</li>`).join('')}</ul></article></div>
    ${m.note ? `<p class="mini" style="margin-top:8px"><b>Remember:</b> ${esc(m.note)}</p>` : ''}<p class="mini">Part numbers read from the NCC 2025 preview drafts on ${esc(NCC_CHECKED)}. No NCC text is copied here.</p>`;
}
const srcHtml = (id) => (SOURCES[id] ? `<a href="${esc(SOURCES[id][1])}" target="_blank" rel="noopener noreferrer">${esc(SOURCES[id][0])}</a>` : '');
const touch = matchMedia('(pointer: coarse)').matches;

// Per-viewer conveniences only. Everything is wrapped because storage can be blocked or empty.
const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* storage unavailable */ } },
};
const saved = store.get('vbs:v1', {});
const S = {
  step: Number.isInteger(saved.step) && saved.step >= 0 && saved.step <= STAGES.length ? saved.step : 1,
  quality: saved.quality === 'standard' || saved.quality === 'high' ? saved.quality : undefined,
  tab: TABS.some((t) => t[0] === saved.tab) ? saved.tab : '3d', ticks: saved.ticks && typeof saved.ticks === 'object' ? saved.ticks : {},
  phase: 0, spot: null, detail: null, part: null, explode: 0, labels: true, mode: 'walk', want: 'walk', drawing: null, locked: false, sceneStep: null,
};
const persist = () => store.set('vbs:v1', { step: S.step, tab: S.tab, ticks: S.ticks, quality: S.quality });

let stage = null, glFailed = false;

/* ---------- theme ---------- */
const savedTheme = store.get('vbs:theme', null);
if (savedTheme === 'light' || savedTheme === 'dark') document.documentElement.dataset.theme = savedTheme;
$('#btnTheme').addEventListener('click', () => {
  const now = document.documentElement.dataset.theme || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  const next = now === 'dark' ? 'light' : 'dark';
  document.documentElement.dataset.theme = next; store.set('vbs:theme', next);
});

/* ---------- rail ---------- */
function renderRail() {
  const built = STAGES.filter((s) => s.built).length;
  const out = [`<button class="item ${S.step === 0 ? 'on' : ''}" data-step="0" type="button"><span class="num">&#9733;</span><span><span class="tt">Master plan</span><br><span class="st">${STAGES.length} stages, ${built} built</span></span></button>`, '<div class="sep"></div>', '<div class="hd">Stages</div>'];
  for (const s of STAGES) out.push(`<button class="item ${s.built ? 'built' : ''} ${S.step === s.n ? 'on' : ''}" data-step="${s.n}" type="button"><span class="num">${s.n}</span><span><span class="tt">${esc(s.title)}</span><br><span class="st">${s.built ? 'Built' : 'Planned'}</span></span></button>`);
  $('#rail').innerHTML = out.join('');
}
$('#rail').addEventListener('click', (e) => { const b = e.target.closest('[data-step]'); if (b) selectStep(+b.dataset.step); });

/* ---------- step selection ---------- */
function selectStep(n, tab) {
  S.step = n; S.spot = null; S.detail = null; S.part = null; S.phase = 0;
  renderRail();
  if (n === 0) return renderMaster();
  const def = BUILT[n];
  if (!def) return renderPlanned(n);
  if (tab) S.tab = tab;
  renderHead(def); renderTabs(); showTab(S.tab);
  persist();
  scrollTo({ top: 0, behavior: 'auto' });
}

function hideStageUI() {
  stage?.setActive(false);
  $('#tabs').innerHTML = ''; $('#p3d').hidden = true; $('#pdyn').hidden = false; persist();
}

function renderHead(def) {
  $('#head').innerHTML = `<div class="stephead"><div class="eyebrow">Step ${def.n} of ${STAGES.length}</div><h2>${esc(def.title)}</h2><p>${esc(def.subtitle)}</p>
    <div class="legend">${['V', 'T', 'C'].map((f) => `${flagHtml(f)}<span class="mini" style="margin-right:8px">${esc(FLAGS[f].hint.split('.')[0])}</span>`).join('')}</div></div>`;
}
function renderTabs() {
  $('#tabs').innerHTML = TABS.map(([id, label]) => `<button class="tab ${S.tab === id ? 'on' : ''}" role="tab" data-tab="${id}" type="button">${label}</button>`).join('');
}
$('#tabs').addEventListener('click', (e) => { const b = e.target.closest('[data-tab]'); if (b) showTab(b.dataset.tab); });

function showTab(tab) {
  const def = BUILT[S.step]; if (!def) return;
  S.tab = tab; persist();
  $$('#tabs .tab').forEach((b) => b.classList.toggle('on', b.dataset.tab === tab));
  const is3d = tab === '3d';
  $('#p3d').hidden = !is3d; $('#pdyn').hidden = is3d;
  if (is3d) {
    const st = ensureStage();
    if (st) {
      if (S.sceneStep !== S.step) { st.setScene(def); S.sceneStep = S.step; st.setMode(S.want); st.setPhase(0); }
      st.setActive(true);
    }
    renderPhasebar(); renderCaption(); renderVtools(); renderSide(); updateHelp();
    if (st) setTimeout(() => showCoach(false), 400);
  } else {
    stage?.setActive(false);
    $('#pdyn').innerHTML = renderers[tab](def);
    if (tab === 'draw') wireDrawing();
  }
}

function ensureStage() {
  if (stage || glFailed) return stage;
  try { stage = new Stage($('#viewport'), $('#hud'), callbacks, { quality: S.quality }); S.quality = stage.quality; }
  catch (err) { glFailed = true; $('#nogl').hidden = false; console.warn('3D unavailable', err); }
  return stage;
}

/* ---------- 3D callbacks and side panels ---------- */
const callbacks = {
  onHotspot(h) { if (document.pointerLockElement) document.exitPointerLock(); S.spot = h; renderSide(); renderVtools(); },
  onQuality(q) { S.quality = q; persist(); renderVtools(); },
  onNear(h) { const p = $('#prompt'); if (h) { p.hidden = false; p.innerHTML = `<kbd>${touch ? 'Tap' : 'E'}</kbd>${esc(h.title)}`; } else p.hidden = true; },
  onMode(m) { S.mode = m; renderVtools(); updateHelp(); $('#prompt').hidden = true; },
  onPhase(i) { S.phase = i; renderPhasebar(); renderCaption(); renderSide(); renderVtools(); },
  onDetail(def) { S.detail = def; S.part = null; S.explode = 0; renderVtools(); renderSide(); renderCaption(); updateHelp(); },
  onDetailClose() { S.detail = null; S.part = null; renderVtools(); renderSide(); renderCaption(); updateHelp(); },
  onPart(p) { S.part = p; updatePart(); },
  onLock(l) { S.locked = l; renderVtools(); },
  onEscape() { stage?.closeDetail(); },
};
$('#prompt').addEventListener('click', () => { if (stage?.near) callbacks.onHotspot(stage.near); });

function renderPhasebar() {
  const def = BUILT[S.step]; if (!def) return;
  $('#phasebar').innerHTML = def.phases.map((p, i) => `<button class="ph ${i === S.phase ? 'on' : i < S.phase ? 'past' : ''}" data-ph="${i}" type="button">${i + 1}. ${esc(p.title)}</button>`).join('')
    + `<span class="nav"><button class="btn small" data-phnav="-1" type="button" ${S.phase === 0 ? 'disabled' : ''}>Back</button><button class="btn small primary" data-phnav="1" type="button" ${S.phase >= def.phases.length - 1 ? 'disabled' : ''}>Next phase</button></span>`;
}
$('#phasebar').addEventListener('click', (e) => {
  const def = BUILT[S.step], b = e.target.closest('button'); if (!b || !stage || !def) return;
  if (b.dataset.ph !== undefined) stage.setPhase(+b.dataset.ph);
  if (b.dataset.phnav) stage.setPhase(Math.min(def.phases.length - 1, Math.max(0, S.phase + +b.dataset.phnav)));
});

function renderCaption() {
  const def = BUILT[S.step], c = $('#caption'); if (!def) return;
  if (S.detail) { c.innerHTML = `<b>3D detail</b><strong>${esc(S.detail.title)}</strong><span>${esc(S.detail.sub || '')}</span>`; return; }
  const p = def.phases[S.phase] || def.phases[0];
  c.innerHTML = `<b>Phase ${S.phase + 1} of ${def.phases.length}</b><strong>${esc(p.title)}</strong><span>${esc(p.text)}</span>`;
}

function renderVtools() {
  const t = $('#vtools');
  if (S.detail) { t.innerHTML = '<button class="btn small on" data-v="back" type="button">Back to site</button><button class="btn small" data-v="reset" type="button">Reset view</button>'; return; }
  const vis = stage ? stage.visibleHotspots() : [], i = vis.indexOf(S.spot) + 1;
  t.innerHTML = `<button class="btn small ${S.mode === 'walk' ? 'on' : ''}" data-v="walk" type="button" title="First person: walk around the site">Walk</button><button class="btn small ${S.mode === 'orbit' ? 'on' : ''}" data-v="orbit" type="button" title="Bird's-eye view you can spin and zoom">Overview</button>`
    + (vis.length ? `<span class="stops"><button class="btn small" data-v="prev" type="button" aria-label="Previous stop">&lsaquo;</button><span>${i ? `Stop ${i} of ${vis.length}` : `${vis.length} stop${vis.length > 1 ? 's' : ''}`}</span><button class="btn small" data-v="next" type="button" aria-label="Next stop">&rsaquo;</button></span>` : '')
    + (S.mode === 'walk' && !touch ? `<button class="btn small look ${S.locked ? 'on' : ''}" data-v="look" type="button" title="Capture the mouse for full game-style looking">${S.locked ? 'Mouse look on (Esc)' : 'Mouse look'}</button>` : '')
    + `<button class="btn small" data-v="quality" type="button" title="High adds ambient occlusion and smoother edges. Standard is lighter on older devices."><span class="gfx-l">Graphics: </span><span class="gfx-s">Gfx: </span>${S.quality === 'high' ? 'High' : 'Std'}</button><button class="btn small" data-v="help" type="button" aria-label="How to move">?</button>`;
  syncCaption();
}
// Keep the title card clear of the toolbar when the toolbar wraps onto a second row (desktop only; phones put the toolbar at the bottom).
function syncCaption() {
  const t = $('#vtools'), c = $('#caption'); if (!t || !c) return;
  c.style.top = matchMedia('(max-width: 760px)').matches ? '' : `${t.offsetHeight + 18}px`;
}
if (window.ResizeObserver) new ResizeObserver(syncCaption).observe($('#vtools'));
addEventListener('resize', syncCaption);
$('#vtools').addEventListener('click', (e) => {
  const v = e.target.closest('[data-v]')?.dataset.v; if (!v) return;
  if (v === 'help') { showCoach(true); return; }
  if (!stage) return;
  if (v === 'walk' || v === 'orbit') { S.want = v; stage.setMode(v); }
  if (v === 'look') stage.lockLook();
  if (v === 'back') stage.closeDetail();
  if (v === 'reset') stage.resetView();
  if (v === 'prev') stage.stepStop(-1);
  if (v === 'next') stage.stepStop(1);
  if (v === 'quality') stage.setQuality(S.quality === 'high' ? 'standard' : 'high');
});

// First-time guide, reopened with the ? button.
function showCoach(force) {
  if (!force && store.get('vbs:coach', false)) return;
  if ($('#coach')) return;
  const rows = touch
    ? [['Stick', 'Use the left joystick to walk.'], ['Drag', 'Drag the view to look around.'], ['Tap', 'Tap the ground to walk there. Tap a numbered pin to go to it.'], ['Map', 'Tap the small plan to jump anywhere on the site.']]
    : [['Click', 'Click the ground to walk there. Click a numbered pin to go to it.'], ['W A S D', 'Walk with W A S D or the arrow keys. Hold Shift to run.'], ['Drag', 'Drag to look around. Press E at a pin to open it.'], ['Map', 'Click the small plan to jump anywhere. Use the arrows to visit each stop in order.']];
  const c = document.createElement('div'); c.className = 'coach'; c.id = 'coach'; c.setAttribute('role', 'dialog'); c.setAttribute('aria-label', 'How to move');
  c.innerHTML = `<div class="box"><h3>How to move around</h3><ul>${rows.map(([k, t]) => `<li><b>${esc(k)}</b><span>${esc(t)}</span></li>`).join('')}</ul><button class="btn primary go" type="button">Got it</button></div>`;
  c.addEventListener('click', (e) => { if (e.target === c || e.target.closest('.go')) { c.remove(); store.set('vbs:coach', true); } });
  $('#viewport').appendChild(c); $('.go', c).focus();
}

function updateHelp() {
  const h = $('#help');
  h.textContent = S.detail ? 'Drag to rotate. Scroll or pinch to zoom in close. Use Explode to take it apart. Tap a part or its label for the specification.'
    : S.mode === 'walk' ? (touch ? 'Left joystick to walk. Drag to look. Tap the ground to walk there, or tap a numbered pin to go to it. The small plan jumps you anywhere.' : 'Click the ground or the small plan to walk there. W A S D or arrows also walk, drag looks around, Shift runs, E opens the nearest pin. The arrows step through the stops in order.')
      : 'Drag to rotate, scroll or pinch to zoom, right-drag or two fingers to pan. Double-click the ground or click the small plan to fly there. Click a numbered pin to read it.';
}

function spotCard(h) {
  const n = stage.hotspots.indexOf(h) + 1;
  return `<div class="card"><div class="row"><h3>${n}. ${esc(h.title)}</h3><button class="btn small" data-act="closespot" type="button">Close</button></div>
    <p class="sub">${md(h.summary)}</p>
    <ul class="learn">${h.learn.map(([t, f, src]) => `<li class="f${f}">${md(t)}<span>${flagHtml(f)} ${src ? `<span class="src">${srcHtml(src)}</span>` : ''}</span></li>`).join('')}</ul>
    <div class="actions">${h.detail ? `<button class="btn primary" data-act="detail" data-id="${h.detail}" type="button">Open 3D detail</button>` : ''}${h.drawing ? `<button class="btn" data-act="drawing" data-id="${h.drawing}" type="button">Open drawing</button>` : ''}<button class="btn" data-act="goto" type="button">Go there</button></div></div>`;
}

function renderSide() {
  const def = BUILT[S.step], side = $('#side'); if (!def || !stage) return;
  if (S.detail) return renderDetailSide(side);
  const spots = stage.visibleHotspots();
  if (S.spot && !spots.includes(S.spot)) S.spot = null;
  side.innerHTML = `${S.spot ? spotCard(S.spot) : `<div class="card"><h3>Look around</h3><p class="sub">${esc(def.phases[S.phase].text)} Numbered pins mark things to learn. A dark pin with an orange dot opens a zoomable 3D detail.</p></div>`}
    <div class="card"><h3>Pins in this phase</h3><div class="spotlist">${spots.map((h) => `<button class="spot ${h.detail ? 'd' : ''} ${h === S.spot ? 'on' : ''}" data-spot="${esc(h.id)}" type="button"><span class="n">${stage.hotspots.indexOf(h) + 1}</span><span class="t">${esc(h.title)}</span></button>`).join('') || '<p class="sub">None yet.</p>'}</div></div>`;
}

function renderDetailSide(side) {
  const d = S.detail, parts = stage.parts;
  side.innerHTML = `<div class="card"><h3>${esc(d.title)}</h3><p class="sub">${esc(d.sub || '')}</p><div class="actions"><button class="btn primary" data-act="back" type="button">Back to site</button><button class="btn" data-act="reset" type="button">Reset view</button></div></div>
    <div class="card"><div class="row"><h4>Explode</h4><label class="chk"><input type="checkbox" id="lblToggle" ${S.labels ? 'checked' : ''}> Labels</label></div><input class="range" id="exRange" type="range" min="0" max="100" value="${Math.round(S.explode * 100)}" aria-label="Explode the model"><p class="src">Drag to rotate. Scroll or pinch to zoom. Tap a part or its label to focus it.</p></div>
    <div class="card"><h4>Components</h4><div class="parts" id="partlist">${parts.map((p, i) => `<button class="part" data-part="${esc(p.id)}" type="button"><span class="n">${i + 1}</span><span class="t">${esc(p.name)}</span></button>`).join('')}</div></div>
    <div id="partcard"></div>`;
  updatePart();
}

function updatePart() {
  $$('#partlist .part').forEach((b) => b.classList.toggle('on', !!S.part && b.dataset.part === S.part.id));
  const pc = $('#partcard'); if (!pc) return;
  const p = S.part;
  pc.innerHTML = p
    ? `<div class="card"><div class="row"><h3>${esc(p.name)}</h3>${flagHtml(p.flag)}</div><p class="sub" style="margin-top:6px"><b>Specification.</b> ${md(p.spec || '')}</p><p style="margin-top:8px;font-size:14.5px">${md(p.desc || '')}</p>${p.src ? `<p class="src" style="margin-top:8px">Source: ${srcHtml(p.src)}</p>` : ''}</div>`
    : '<div class="card"><p class="sub">Select a part to see its specification and why it is there.</p></div>';
}

$('#side').addEventListener('click', (e) => {
  const def = BUILT[S.step]; if (!stage || !def) return;
  const spot = e.target.closest('[data-spot]'), part = e.target.closest('[data-part]'), act = e.target.closest('[data-act]');
  if (spot) { const h = stage.hotspots.find((x) => x.id === spot.dataset.spot); S.spot = h; stage.goTo(h); renderSide(); return; }
  if (part) { stage.selectPart(part.dataset.part); return; }
  if (!act) return;
  const a = act.dataset.act;
  if (a === 'closespot') { S.spot = null; renderSide(); }
  if (a === 'goto' && S.spot) stage.goTo(S.spot);
  if (a === 'detail') stage.openDetail(act.dataset.id, def.details[act.dataset.id]);
  if (a === 'drawing') { S.drawing = act.dataset.id; showTab('draw'); }
  if (a === 'back') stage.closeDetail();
  if (a === 'reset') stage.resetView();
});
$('#side').addEventListener('input', (e) => { if (e.target.id === 'exRange') { S.explode = e.target.value / 100; stage?.setExplode(S.explode); } });
$('#side').addEventListener('change', (e) => { if (e.target.id === 'lblToggle') { S.labels = e.target.checked; stage?.setLabels(S.labels); } });

/* ---------- content tabs ---------- */
const table = (cls, head, rows) => `<table class="tbl stack ${cls}"><thead><tr>${head.map((h) => `<th>${h}</th>`).join('')}</tr></thead><tbody>${rows.join('')}</tbody></table>`;
const renderers = {
  draw(def) {
    const cur = def.drawings.find((d) => d.id === S.drawing) || def.drawings[0]; S.drawing = cur.id;
    return `<h3 class="sec-title">Drawings</h3><p class="lead">Scroll or pinch to zoom, drag to pan. Callout numbers match the component labels in the 3D detail models.</p>
      <div class="dwgbar">${def.drawings.map((d) => `<button class="btn small ${d.id === cur.id ? 'on' : ''}" data-dwg="${d.id}" type="button">${esc(d.title)}</button>`).join('')}<span class="chip">${esc(cur.scale)}</span></div>
      <div class="dview" id="dview">${cur.svg}<div class="dzoom"><button class="btn" data-z="in" type="button" aria-label="Zoom in">+</button><button class="btn" data-z="out" type="button" aria-label="Zoom out">&minus;</button><button class="btn" data-z="reset" type="button" aria-label="Reset zoom" style="font-size:13px">Fit</button></div></div>
      <ul class="list" style="margin-top:12px">${cur.notes.map((n) => `<li>${md(n)}</li>`).join('')}</ul>`;
  },
  how(def) {
    return `<h3 class="sec-title">Step by step</h3><p class="lead">Do these in order. Each has a flag and, where it was checked, a source.</p>${def.caution ? `<p class="notice">${esc(def.caution)}</p>` : ''}
      <ol class="steps">${def.howto.map(([t, d, who, f, src]) => `<li><h4>${esc(t)}</h4><p>${md(d)}</p><div class="meta">${flagHtml(f)}<span>${esc(who)}</span>${src ? `<span class="src">${srcHtml(src)}</span>` : ''}</div></li>`).join('')}</ol>`;
  },
  trades(def) {
    return `<h3 class="sec-title">Trades and professionals</h3><p class="lead">Who is needed at this step, when, what they should hold, and what to ask in the quote.</p>
      <div class="grid">${def.trades.map((t) => `<article class="card"><h3>${esc(t.t)}</h3><p class="sub">${esc(t.role)}</p><p class="mini" style="margin-top:8px"><b>When:</b> ${esc(t.when)}<br><b>Licence or registration:</b> ${esc(t.reg)}</p><h4 style="margin-top:10px">Ask in the quote</h4><ul class="list">${t.ask.map((a) => `<li>${esc(a)}</li>`).join('')}</ul></article>`).join('')}</div>`;
  },
  mat(def) {
    return `<h3 class="sec-title">Materials and where to buy them</h3><p class="lead">What to order, where it comes from and what to check. Product availability changes, so check stock and the current listing before you order.</p>
      <input class="find" id="matFind" type="search" placeholder="Filter, for example Bunnings, MGP10, mesh" aria-label="Filter materials">
      ${table('mat', ['Item', 'What to buy or order', 'Where from', 'Flag', 'Note'], def.materials.map(([i, s, w, f, n, src]) => `<tr><td data-l="Item">${esc(i)}</td><td data-l="What to buy or order">${md(s)}</td><td data-l="Where from">${esc(w)}</td><td data-l="Flag">${flagHtml(f)}</td><td data-l="Note">${esc(n || '')}${src ? ` <span class="src">${srcHtml(src)}</span>` : ''}</td></tr>`))}`;
  },
  quote(def) {
    const key = (i) => `q${def.n}.${i}`;
    return `<h3 class="sec-title">Quotes to obtain</h3><p class="lead">Who to ask, how many quotes, and what each must include. Tick them off as you go. Ticks are saved in this browser only.</p>
      <div class="grid">${def.quotes.map((q, i) => `<article class="card qcard"><div class="row"><h3>${esc(q.who)}</h3><span class="chip">${esc(q.n)} quotes</span></div><ul class="list">${q.what.map((w) => `<li>${esc(w)}</li>`).join('')}</ul>
        <div class="actions"><label class="chk"><input type="checkbox" data-tick="${key(i)}a" ${S.ticks[`${key(i)}a`] ? 'checked' : ''}> Requested</label><label class="chk"><input type="checkbox" data-tick="${key(i)}b" ${S.ticks[`${key(i)}b`] ? 'checked' : ''}> Received</label></div></article>`).join('')}</div>
      <h3 class="sec-title" style="margin-top:24px">Comparing quotes</h3><ul class="list">${def.quoteTips.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>`;
  },
  insp(def) {
    return `<h3 class="sec-title">Inspections, hold points and paperwork</h3><p class="lead">Mandatory notification stages are listed by the building surveyor on the permit. Do not go beyond one until it has been inspected.</p>
      ${table('insp', ['What', 'Who', 'When', 'What passes', 'Flag'], def.inspections.map(([w, who, when, pass, f, src]) => `<tr><td data-l="What">${esc(w)}</td><td data-l="Who">${esc(who)}</td><td data-l="When">${esc(when)}</td><td data-l="What passes">${md(pass)}${src ? ` <span class="src">${srcHtml(src)}</span>` : ''}</td><td data-l="Flag">${flagHtml(f)}</td></tr>`))}`;
  },
  study(def) {
    const list = NOTES[def.n] || [], key = (i) => `l${def.n}.${i}`, done = LOOP.filter((_, i) => S.ticks[key(i)]).length;
    return `${nccHtml(def.n)}<h3 class="sec-title" style="margin-top:26px">Your notes for this step</h3><p class="lead">Pointers into your own Builders Academy notes, chosen from section titles. Open the note named on each card, then come back to the walk-through. No course text is copied into this app.</p>
      <div class="grid">${list.map((n) => `<article class="card"><span class="chip">${esc(n.module)}</span><h3 style="margin-top:8px">${esc(n.volume)}</h3>${n.section === n.volume ? '' : `<p class="sub">${esc(n.section)}</p>`}<p class="mini" style="margin-top:6px"><b>Use it for:</b> ${esc(n.use)}</p></article>`).join('')}</div>
      <p class="mini" style="margin-top:8px">Folder on your computer: ${esc(NOTES_FOLDER)}</p>
      <h3 class="sec-title" style="margin-top:22px">Learning loop <span class="chip">${done} of ${LOOP.length} done</span></h3>
      <div class="grid">${LOOP.map((t, i) => `<label class="card chk" style="cursor:pointer"><input type="checkbox" data-tick="${key(i)}" ${S.ticks[key(i)] ? 'checked' : ''}> ${i + 1}. ${esc(t)}</label>`).join('')}</div>
      <p class="mini" style="margin-top:8px">Ticks are saved in this browser only.</p>`;
  },
  exam(def) {
    return `<h3 class="sec-title">Exam practice</h3><p class="lead">Tap a card to reveal the answer. The flag shows whether the answer was checked against a source.</p>
      <div class="actions" style="margin:0 0 12px"><button class="btn small" data-ex="shuffle" type="button">Shuffle</button><button class="btn small" data-ex="hide" type="button">Hide all answers</button></div>
      <div class="grid" id="exgrid">${def.exam.map(([q, a, f], i) => `<button class="fc" data-fc="1" type="button"><span class="q">${i + 1}. ${esc(q)}</span><span class="hint">Tap to show the answer</span><span class="a" hidden>${md(a)} ${flagHtml(f)}</span></button>`).join('')}</div>`;
  },
};

$('#pdyn').addEventListener('click', (e) => {
  const dwg = e.target.closest('[data-dwg]'), fc = e.target.closest('[data-fc]'), ex = e.target.closest('[data-ex]'), open = e.target.closest('[data-open-step]');
  if (dwg) { S.drawing = dwg.dataset.dwg; showTab('draw'); }
  if (open) selectStep(+open.dataset.openStep);
  if (fc) { const a = $('.a', fc), h = $('.hint', fc); a.hidden = !a.hidden; h.hidden = !a.hidden; }
  if (ex?.dataset.ex === 'hide') $$('#exgrid .fc').forEach((c) => { $('.a', c).hidden = true; $('.hint', c).hidden = false; });
  if (ex?.dataset.ex === 'shuffle') { const g = $('#exgrid'); [...g.children].sort(() => Math.random() - 0.5).forEach((c) => g.appendChild(c)); }
});
$('#pdyn').addEventListener('change', (e) => { const k = e.target.dataset?.tick; if (k) { S.ticks[k] = e.target.checked; persist(); } });
$('#pdyn').addEventListener('input', (e) => {
  if (e.target.id !== 'matFind') return;
  const q = e.target.value.trim().toLowerCase();
  $$('.tbl.mat tbody tr').forEach((r) => { r.hidden = q && !r.textContent.toLowerCase().includes(q); });
});

/* ---------- drawing viewer: wheel, pinch, drag and buttons all edit the SVG viewBox ---------- */
function wireDrawing() {
  const host = $('#dview'), svg = host && $('svg', host); if (!svg) return;
  const b = svg.viewBox.baseVal, full = { x: b.x, y: b.y, w: b.width, h: b.height }; let v = { ...full };
  const apply = () => svg.setAttribute('viewBox', `${v.x} ${v.y} ${v.w} ${v.h}`);
  const keep = () => { v.x = Math.min(Math.max(v.x, full.x - v.w * 0.25), full.x + full.w - v.w * 0.75); v.y = Math.min(Math.max(v.y, full.y - v.h * 0.25), full.y + full.h - v.h * 0.75); };
  const zoom = (k, cx, cy) => {
    const nw = Math.min(full.w, Math.max(full.w / 14, v.w * k)), nh = (nw * full.h) / full.w;
    v.x = cx - (cx - v.x) * (nw / v.w); v.y = cy - (cy - v.y) * (nh / v.h); v.w = nw; v.h = nh; keep(); apply();
  };
  const at = (cx, cy) => { const r = svg.getBoundingClientRect(); return { x: v.x + ((cx - r.left) / r.width) * v.w, y: v.y + ((cy - r.top) / r.height) * v.h }; };
  host.addEventListener('wheel', (e) => { e.preventDefault(); const p = at(e.clientX, e.clientY); zoom(e.deltaY < 0 ? 0.85 : 1 / 0.85, p.x, p.y); }, { passive: false });
  const ptrs = new Map(); let pinch = 0;
  host.addEventListener('pointerdown', (e) => { if (e.target.closest('.dzoom')) return; ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY }); host.setPointerCapture(e.pointerId); pinch = 0; });
  host.addEventListener('pointermove', (e) => {
    const p = ptrs.get(e.pointerId); if (!p) return;
    const r = svg.getBoundingClientRect();
    if (ptrs.size === 1) { v.x -= ((e.clientX - p.x) / r.width) * v.w; v.y -= ((e.clientY - p.y) / r.height) * v.h; keep(); apply(); }
    p.x = e.clientX; p.y = e.clientY;
    if (ptrs.size === 2) {
      const [a, c] = [...ptrs.values()], d = Math.hypot(a.x - c.x, a.y - c.y);
      if (pinch) { const m = at((a.x + c.x) / 2, (a.y + c.y) / 2); zoom(pinch / d, m.x, m.y); }
      pinch = d;
    }
  });
  const end = (e) => { ptrs.delete(e.pointerId); pinch = 0; };
  host.addEventListener('pointerup', end); host.addEventListener('pointercancel', end);
  host.addEventListener('dblclick', () => { v = { ...full }; apply(); });
  host.querySelector('.dzoom').addEventListener('click', (e) => {
    const z = e.target.closest('[data-z]')?.dataset.z; if (!z) return;
    if (z === 'reset') { v = { ...full }; apply(); return; }
    zoom(z === 'in' ? 0.7 : 1 / 0.7, v.x + v.w / 2, v.y + v.h / 2);
  });
}

/* ---------- master plan and planned stages ---------- */
function renderMaster() {
  hideStageUI();
  const built = STAGES.filter((s) => s.built).length;
  $('#head').innerHTML = `<div class="hero"><div class="eyebrow">Master plan</div><h2>From vacant block to occupancy permit</h2>
    <p class="lead" style="margin:0">Eighteen stages cover what a Victorian domestic builder is expected to know. Each stage gets the same pages as the built steps: a walkable 3D site, zoomable detail models with labelled components, drawings, trades, materials and where to buy them, quotes to obtain, inspections and exam cards.</p>
    <div class="stat"><div><b>${STAGES.length}</b><span>stages planned</span></div><div><b>${built}</b><span>built and ready</span></div><div><b>${ACTS.length}</b><span>BPC activities mapped</span></div></div></div>`;
  const cov = ACTS.map((a, i) => [a, STAGES.filter((s) => s.acts?.includes(i + 1)).map((s) => s.n)]);
  $('#pdyn').innerHTML = `<h3 class="sec-title">The 18 stages</h3>
    <div class="grid">${STAGES.map((s) => `<article class="card stage ${s.built ? 'built' : ''}"><div class="top2"><span class="big">${s.n}</span><div><h3>${esc(s.title)}</h3><span class="chip">${s.built ? 'Built' : 'Planned'}</span></div></div>
      <p>${esc(s.blurb)}</p><div class="chips">${s.topics.map((t) => `<span class="chip">${esc(t)}</span>`).join('')}</div>
      <p class="mini"><b>Trades:</b> ${s.trades.map(esc).join(', ')}</p><p class="mini"><b>NCC:</b> ${[...(NCC_BY_STAGE[s.n]?.hp || []).map((k) => 'HP ' + k), ...(NCC_BY_STAGE[s.n]?.vt || []).map((k) => 'Part ' + k)].join(', ')}</p><p class="mini"><b>Your notes:</b> ${[...new Set((NOTES[s.n] || []).map((n) => n.module.replace(' · ', ' ')))].map(esc).join(', ')}</p>${s.built ? `<div class="actions" style="margin-top:2px"><button class="btn primary small" data-open-step="${s.n}" type="button">Open step ${s.n}</button></div>` : ''}</article>`).join('')}</div>
    <h3 class="sec-title" style="margin-top:26px">Threads that run through every stage</h3>
    <div class="grid">${CROSS.map((c) => `<article class="card"><h3>${esc(c.t)}</h3><p class="sub">${esc(c.d)}</p></article>`).join('')}</div>
    <h3 class="sec-title" style="margin-top:26px">Where the BPC activities are covered</h3>
    <p class="lead">The Building and Plumbing Commission lists these twelve activities for the Domestic Builder (Unlimited) application. They are also the best guide to the exam's scope.</p>
    ${table('', ['#', 'Activity', 'Stages'], cov.map(([a, ns], i) => `<tr><td data-l="#">${i + 1}</td><td data-l="Activity">${esc(a)}</td><td data-l="Stages">${ns.map((n) => `<span class="chip">${n}</span>`).join(' ') || '<span class="mini">Cross-cutting</span>'}</td></tr>`))}`;
}

function renderPlanned(n) {
  hideStageUI();
  const s = STAGES.find((x) => x.n === n);
  $('#head').innerHTML = `<div class="stephead"><div class="eyebrow">Step ${n} of ${STAGES.length} &middot; Planned</div><h2>${esc(s.title)}</h2><p>${esc(s.blurb)}</p></div>`;
  $('#pdyn').innerHTML = `<div class="grid"><article class="card"><h3>What will be covered</h3><ul class="list">${s.topics.map((t) => `<li>${esc(t)}</li>`).join('')}</ul></article>
    <article class="card"><h3>Trades and professionals</h3><ul class="list">${s.trades.map((t) => `<li>${esc(t)}</li>`).join('')}</ul></article>
    <article class="card"><h3>Your notes</h3><ul class="list">${(NOTES[n] || []).map((x) => `<li>${esc(x.module)}: ${esc(x.section)}</li>`).join('')}</ul></article>
    <article class="card"><h3>NCC parts ${flagHtml('C')}</h3><ul class="list">${(NCC_BY_STAGE[n]?.hp || []).map((k) => nccRow(NCC.hp[k])).join('')}${(NCC_BY_STAGE[n]?.vt || []).map((k) => nccRow(NCC.vt[k])).join('')}</ul><p class="mini">${srcHtml('ncc25hp')} &middot; ${srcHtml('ncc25v2')}</p></article>
    <article class="card"><h3>BPC activities</h3><ul class="list">${(s.acts || []).map((a) => `<li>${esc(ACTS[a - 1])}</li>`).join('') || '<li>See the master plan.</li>'}</ul></article></div>
    <p class="lead" style="margin-top:16px">This step will get the same pages as the built steps: 3D walk-through, zoomable details, drawings, trades, materials, quotes, inspections and exam cards.</p>
    <div class="actions">${STAGES.filter((x) => x.built).map((x, i) => `<button class="btn ${i ? '' : 'primary'}" data-open-step="${x.n}" type="button">Open step ${x.n}</button>`).join('')}<button class="btn" data-open-step="0" type="button">Master plan</button></div>`;
}
$('#head').addEventListener('click', (e) => { const o = e.target.closest('[data-open-step]'); if (o) selectStep(+o.dataset.openStep); });

/* ---------- sources sheet ---------- */
function openSheet() {
  const def = BUILT[S.step], ids = [...new Set([...(def ? def.sources : Object.values(BUILT).flatMap((d) => d.sources)), 'ncc25hp', 'ncc25v2', ...(def ? NCC_BY_STAGE[def.n]?.also || [] : [])])];
  $('#sheetBox').innerHTML = `<div class="row"><h2 style="font-size:22px">Sources and flags</h2><button class="btn small" id="sheetClose" type="button">Close</button></div>
    <p class="sub">Checked ${esc(CHECKED)}.</p>
    <ul>${['V', 'T', 'C'].map((f) => `<li>${flagHtml(f)} ${esc(FLAGS[f].hint)}</li>`).join('')}</ul>
    <h3 style="font-size:17px">${def ? `Sources for step ${def.n}` : 'Sources used so far'}</h3>
    <ul>${ids.map((id) => `<li>${srcHtml(id)}</li>`).join('')}</ul>
    <h3 style="font-size:17px">Good to know</h3>
    <ul><li>Victoria only. NCC 2025 applies from 1 May 2026. Numbers marked Verified come from the NCC 2022 Housing Provisions text, so check clause numbers in NCC Online.</li><li>Deposit and stage-payment limits are changing under the Domestic Building Contracts Amendment Act 2025. Check the Consumer Affairs Victoria page for current figures.</li><li>Typical sizes and products are examples. The engineer's drawings, the permit and the manufacturer's instructions govern.</li><li>The 3D engine uses three.js, guided by the CloudAI-X threejs-skills repository (MIT).</li><li>Nothing leaves your browser. Quote ticks are kept in local storage on this device.</li></ul>`;
  $('#sheet').hidden = false; $('#sheetClose').focus();
}
$('#btnSources').addEventListener('click', openSheet);
$('#sheet').addEventListener('click', (e) => { if (e.target.id === 'sheet' || e.target.id === 'sheetClose') $('#sheet').hidden = true; });
addEventListener('keydown', (e) => { if (e.key === 'Escape' && !$('#sheet').hidden) $('#sheet').hidden = true; });

/* ---------- start ---------- */
renderRail();
selectStep(S.step);
// Expose a small hook so the page can be driven from tests without touching internals.
window.__vbs = { S, get stage() { return stage; }, selectStep, showTab };

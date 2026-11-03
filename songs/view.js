// The ♪ Songs tab of the Korean app. app.js creates it through pack.songs and routes every
// [data-s] click and every change event here first. Lyrics and translations stay on this phone.
import { openSongs } from "./db.js";
import { searchLrclib } from "./lrclib.js";
import { translateSong } from "./claude.js";
import {
  splitLyrics, uniqueHangulLines, normLine, hasHangul, parseSongList, songKey, newSongId, cleanSong,
  SONG_MODELS, DEFAULT_MODEL, systemText, estimateCost, studyItem, findStudyId, inReviews,
} from "./model.js";
import { grade } from "../lib/fsrs.js";
import { romanize } from "../lib/pron.js";

const KEY = "korean.songs.apiKey";
const MESSAGES = {
  noKey: "Add your Claude API key in Settings first.",
  badKey: "The API key was refused. Check it in Settings.",
  offline: "You're offline. Try again when you're connected.",
  rateLimit: "Too many requests just now. Wait a minute and retry.",
  server: "Claude had a server problem. Retry in a moment.",
  refusal: "The model declined this song. Try Sonnet 5.5 in Settings.",
  tooLong: "The reply was cut off. Try Sonnet 5.5 for long songs.",
  invalid: "The reply couldn't be read. Retry.",
  rejected: "Claude rejected the request. Check your Anthropic account (credit balance, model access).",
  noLyrics: "No lyrics found on LRCLIB. Open the song and paste them.",
  lrclib: "The lyrics search isn't answering. Try again later, or paste the lyrics.",
  nostorage: "Songs can't be saved on this device.",
};
const STATUS = { queued: "not translated", lyrics: "lyrics only", done: "translated", error: "error" };
// For a song whose lyrics aren't fetched yet, the batch estimate assumes a typical song.
const TYPICAL = { chars: 1200, lines: 30 };

export function createSongs(c) {
  const { esc, say } = c;
  let store = null, storeError = false, loaded = false;
  let songs = [];                         // in memory, so Export can run inside the tap (iOS share sheet)
  const ui = { view: "list", id: null, draft: {}, hits: [], msg: "", busy: "", open: -1, ticked: new Set(), importText: "" };

  openSongs().then((s) => s.all().then((all) => { store = s; songs = all.map(cleanSong).filter(Boolean); }))
    .catch(() => { storeError = true; })
    .finally(() => { loaded = true; if (c.tab() === "songs") c.render(); });

  // ---------- helpers ----------
  const key = () => { try { return c.ls.getItem(KEY) || ""; } catch { return ""; } };
  const model = () => (SONG_MODELS[c.state().settings.songModel] ? c.state().settings.songModel : DEFAULT_MODEL);
  const grammarList = () => c.grammar().map((g) => ({ id: g.id, form: g.form, en: g.en }));
  const sysChars = () => systemText(grammarList()).length;
  const byId = (id) => songs.find((s) => s.id === id);
  const usd = (n) => `US$${n < 0.01 ? n.toFixed(4) : n.toFixed(2)}`;
  // Only adding and importing create songs; anything else updates one that still exists, so a song
  // deleted while a batch was working on it is not brought back.
  async function save(song, { add = false } = {}) {
    const i = songs.findIndex((s) => s.id === song.id);
    if (i < 0 && !add) return;
    if (i >= 0) songs[i] = song; else songs.push(song);
    if (store) await store.put(song);
  }
  function syncDraft() {
    for (const [id, k] of [["#song-title", "title"], ["#song-artist", "artist"], ["#song-lyrics", "lyrics"]]) {
      const el = document.querySelector(id); if (el) ui.draft[k] = el.value;
    }
    const list = document.querySelector("#song-list"); if (list) ui.importText = list.value;
  }
  // After async work: keep what the user has typed, and redraw only if they are still on Songs.
  const refresh = () => { syncDraft(); if (c.tab() === "songs") c.render(); };
  const msgText = (k) => (k in MESSAGES ? MESSAGES[k] : k);
  const msgHTML = () => (ui.msg ? `<div class="card small song-msg">${esc(msgText(ui.msg))}${ui.msg === "noKey" ? `<div class="actions" style="grid-template-columns:1fr"><button class="btn" data-tab="settings">Open Settings</button></div>` : ""}</div>` : "");

  // ---------- views ----------
  function listHTML() {
    if (storeError) return `<div class="songs"><div class="card empty"><b>Songs can't be saved on this device</b>This browser has blocked its storage (a private window, or website data turned off). The rest of the app still works.</div></div>`;
    if (!loaded) return `<div class="songs"><div class="small muted">Loading…</div></div>`;
    const buttons = `<div class="actions"><button class="btn primary" data-s="add">+ Add song</button><button class="btn" data-s="import">Import list</button></div>`;
    if (!songs.length) return `<div class="songs">${msgHTML()}<div class="card empty"><b>No songs yet</b>Add a song you listen to, or import your list.${buttons}</div></div>`;
    const ticked = [...ui.ticked].map(byId).filter((s) => s && s.status !== "done");
    const total = ticked.reduce((n, s) => n + (s.lyrics
      ? estimateCost(model(), s.lyrics.length, uniqueHangulLines(splitLyrics(s.lyrics)).length, sysChars())
      : estimateCost(model(), TYPICAL.chars, TYPICAL.lines, sysChars())), 0);
    const batch = ui.busy ? `<div class="card small song-msg">${esc(ui.busy)}</div>`
      : ticked.length ? `<button class="btn primary" data-s="batch" style="width:100%;margin-top:10px">Translate ${ticked.length} song${ticked.length > 1 ? "s" : ""} (about ${usd(total)})</button>` : "";
    const sorted = songs.slice().sort((a, b) => b.addedAt - a.addedAt);
    return `<div class="songs">${msgHTML()}${buttons}${batch}<div class="list" style="margin-top:12px">${sorted.map((s) => {
      const points = s.analysis ? new Set(s.analysis.lines.flatMap((l) => l.grammar.map((g) => g.appId || normLine(g.form)))).size : 0;
      return `<div class="song-row item" data-status="${esc(s.status)}"><div class="row">
        ${s.status === "done" ? "" : `<input type="checkbox" data-s="tick" data-id="${esc(s.id)}" ${ui.ticked.has(s.id) ? "checked" : ""} aria-label="Select for translating">`}
        <div data-s="open" data-id="${esc(s.id)}" style="flex:1"><b>${esc(s.title)}</b><div class="meta">${esc(s.artist)}${s.artist ? " · " : ""}${STATUS[s.status]}${points ? ` · ${points} grammar point${points > 1 ? "s" : ""}` : ""}</div></div></div></div>`;
    }).join("")}</div></div>`;
  }

  function addHTML() {
    const d = ui.draft;
    return `<div class="songs">${msgHTML()}<button class="btn" data-s="back">‹ Songs</button>
      <h2>Add a song</h2>
      <div class="card">
        <input id="song-title" placeholder="Title" value="${esc(d.title ?? "")}" autocomplete="off">
        <input id="song-artist" placeholder="Artist (optional)" value="${esc(d.artist ?? "")}" autocomplete="off" style="margin-top:8px">
        <div class="actions" style="grid-template-columns:1fr"><button class="btn" data-s="search">${ui.busy ? esc(ui.busy) : "Search lyrics"}</button></div>
        ${ui.hits.length ? `<div class="list" style="margin-top:10px">${ui.hits.map((h, i) => `<div class="item" data-s="pick" data-i="${i}"><b>${esc(h.title)}</b><div class="meta">${esc(h.artist)}${h.album ? ` · ${esc(h.album)}` : ""}${h.instrumental ? " · instrumental" : ""}${h.lyrics ? "" : " · no lyrics"}</div></div>`).join("")}</div>` : ""}
      </div>
      <h2>Lyrics</h2>
      <div class="card">
        <textarea id="song-lyrics" rows="10" placeholder="Pick a search result, or paste the lyrics here">${esc(d.lyrics ?? "")}</textarea>
        <div class="actions" style="grid-template-columns:1fr"><button class="btn primary" data-s="save">Save song</button></div>
        <p class="small muted">Lyrics stay on this phone. They are never uploaded anywhere except to Claude when you translate.</p>
      </div></div>`;
  }

  function importHTML() {
    return `<div class="songs">${msgHTML()}<button class="btn" data-s="back">‹ Songs</button>
      <h2>Import list</h2>
      <div class="card">
        <textarea id="song-list" rows="10" placeholder="One song per line: Title – Artist">${esc(ui.importText)}</textarea>
        <p class="small muted">Or a CSV file, such as a Google Takeout YouTube Music export:</p>
        <input type="file" id="song-csv" accept=".csv,text/csv,text/plain">
        <div class="actions" style="grid-template-columns:1fr"><button class="btn primary" data-s="importGo">Import</button></div>
        <p class="small muted">Imported songs are ticked, so one tap on Translate fetches their lyrics and translates them all.</p>
      </div></div>`;
  }

  function lineHTML(raw, i, entries, song) {
    const ko = normLine(raw);
    if (!ko) return `<div class="song-gap"></div>`;
    const e = entries.get(ko);
    if (!hasHangul(ko) || !e) return `<div class="song-line plain"><div class="muted">${esc(ko)}</div></div>`;
    const li = song.analysis.lines.indexOf(e);
    const progress = c.state().progress, items = c.items();
    const btn = (kind, entry, idx) => {
      const id = findStudyId({ kind, entry, items });
      return id && inReviews(id, progress) ? `<span class="in-reviews small">✓ In reviews</span>`
        : `<button class="btn" data-s="study" data-kind="${kind}" data-li="${li}" data-idx="${idx}">+ Add to study</button>`;
    };
    return `<div class="song-line item${ui.open === i ? " open" : ""}" data-line="${i}">
      <div class="k">${esc(ko)} ${say(ko)}</div>
      <div class="rr">${esc(romanize(ko))}</div>
      <div class="zh" lang="zh-Hant">${esc(e.zh)}</div>
      <div class="en">${esc(e.en)}</div>
      <div class="more">
        ${e.grammar.map((g, gi) => `<div class="song-point"><b>${esc(g.form)}</b> <span lang="zh-Hant">${esc(g.zh)}</span> · ${esc(g.en)}<div class="muted">${esc(g.note)}</div>${btn("grammar", g, gi)}</div>`).join("")}
        ${e.words.map((w, wi) => `<div class="song-point"><b>${esc(w.base)}</b>${w.hanja ? ` <span class="hj" lang="zh-Hant">${esc(w.hanja)}</span>` : ` <span class="muted small">고유어</span>`} <span lang="zh-Hant">${esc(w.zh)}</span> · ${esc(w.en)} <span class="muted small">${esc(w.pos)}</span>${btn("word", w, wi)}</div>`).join("")}
      </div></div>`;
  }

  function songHTML() {
    const song = byId(ui.id);
    if (!song) { ui.view = "list"; return listHTML(); }
    const head = `<div class="songs">${msgHTML()}<button class="btn" data-s="back">‹ Songs</button>
      <h2>${esc(song.title)}${song.artist ? ` · ${esc(song.artist)}` : ""}</h2>`;
    const del = `<button class="btn" data-s="delete" style="width:100%;margin-top:16px;color:var(--bad)">Delete song</button></div>`;
    if (!song.lyrics) {
      return head + `<div class="card"><p class="small muted">Lyrics not fetched yet.</p>
        <div class="actions" style="grid-template-columns:1fr"><button class="btn primary" data-s="fetch">${ui.busy ? esc(ui.busy) : "Find lyrics"}</button></div>
        <textarea id="song-lyrics" rows="8" placeholder="…or paste the lyrics here" style="margin-top:10px">${esc(ui.draft.lyrics ?? "")}</textarea>
        <div class="actions" style="grid-template-columns:1fr"><button class="btn" data-s="savelyrics">Save lyrics</button></div></div>` + del;
    }
    if (song.status !== "done" || !song.analysis) {
      const lines = uniqueHangulLines(splitLyrics(song.lyrics));
      const est = estimateCost(model(), song.lyrics.length, lines.length, sysChars());
      return head + `<div class="actions" style="grid-template-columns:1fr"><button class="btn primary" data-s="translate">${ui.busy ? esc(ui.busy)
        : `${song.status === "error" ? "Retry" : "Translate & explain"} (about ${usd(est)})`}</button></div>
        <div class="card" style="margin-top:12px">${splitLyrics(song.lyrics).map((l) => (l ? `<div>${esc(l)}</div>` : "<br>")).join("")}</div>` + del;
    }
    const a = song.analysis;
    const entries = new Map(a.lines.map((l) => [normLine(l.ko), l]));
    const groups = new Map();
    for (const l of a.lines) for (const g of l.grammar) {
      const k = g.appId || normLine(g.form); const cur = groups.get(k) || { g, n: 0 }; cur.n++; groups.set(k, cur);
    }
    const items = c.items(), progress = c.state().progress;
    const sum = `<div class="card song-sum small"><div class="muted">${esc(SONG_MODELS[a.model]?.label ?? a.model)} · ${usd(a.costUsd)}</div>
      ${groups.size ? `<div class="chips">${[...groups.values()].map(({ g, n }) => {
        const id = findStudyId({ kind: "grammar", entry: g, items });
        return `<span class="song-chip">${id && inReviews(id, progress) ? "✓ " : ""}${esc(g.form)}${n > 1 ? ` ×${n}` : ""}</span>`;
      }).join("")}</div>` : ""}
      <div class="muted">Tap a line for its grammar and words.</div></div>`;
    return head + sum + `<div class="list song-lines" style="margin-top:12px">${splitLyrics(song.lyrics).map((l, i) => lineHTML(l, i, entries, song)).join("")}</div>` + del;
  }

  // ---------- actions ----------
  async function translate(song, { ask = true } = {}) {
    if (!key()) { ui.msg = "noKey"; return false; }
    const lines = uniqueHangulLines(splitLyrics(song.lyrics));
    if (!lines.length) { ui.msg = "Nothing to translate: no Korean lines in this song."; return false; }
    const m = model();
    if (ask && !confirm(`Translate with ${SONG_MODELS[m].label}? About ${usd(estimateCost(m, song.lyrics.length, lines.length, sysChars()))}`)) return false;
    try {
      const r = await translateSong({ apiKey: key(), model: m, lines, grammar: grammarList() });
      song.analysis = { model: SONG_MODELS[r.model] ? r.model : m, at: Date.now(), costUsd: r.costUsd, lines: r.analysis.lines,
        usage: { in: r.usage?.input_tokens || 0, out: r.usage?.output_tokens || 0, cacheRead: r.usage?.cache_read_input_tokens || 0 } };
      song.status = "done"; song.error = null;
    } catch (e) {
      song.status = "error"; song.error = e.code || "invalid";
      ui.msg = song.error === "rejected" && e.detail ? `Claude rejected the request: ${e.detail}` : song.error;
    }
    await save(song);
    return song.status === "done";
  }

  async function fetchLyrics(song) {
    const hits = await searchLrclib({ title: song.title, artist: song.artist });
    const hit = hits.find((h) => h.lyrics && !h.instrumental);
    if (!hit) return false;
    Object.assign(song, { lyrics: hit.lyrics, album: song.album ?? hit.album, status: "lyrics", error: null });
    await save(song);
    return true;
  }

  async function runBatch() {
    const list = [...ui.ticked].map(byId).filter((s) => s && s.status !== "done");
    for (const [i, song] of list.entries()) {
      if (!byId(song.id)) continue;            // deleted since the batch started
      ui.busy = `Translating ${i + 1} of ${list.length}: ${song.title}…`; refresh();
      try {
        if (!song.lyrics && !(await fetchLyrics(song))) { song.status = "error"; song.error = "noLyrics"; await save(song); continue; }
      } catch (e) { song.status = "error"; song.error = e.message === "offline" ? "offline" : "lrclib"; await save(song); continue; }
      if (await translate(song, { ask: false })) ui.ticked.delete(song.id);
      if (ui.msg === "noKey") break;
    }
    ui.busy = ""; refresh();
  }

  function study(song, li, kind, idx) {
    const line = song.analysis.lines[li];
    const entry = kind === "grammar" ? line?.grammar[idx] : line?.words[idx];
    if (!entry) return;
    const cu = c.currentUnit();
    let r;
    try { r = studyItem({ kind, entry, line, song, items: c.items(), unit: { tier: cu.tier, unit: cu.unit }, id: `u${Date.now().toString(36)}` }); }
    catch { ui.msg = "This one can't be made into a card (a field came back empty)."; return; }
    const st = c.state();
    if (r.item) st.custom = [...(st.custom || []), r.item];
    if (!st.progress[r.id]) st.progress[r.id] = grade(undefined, "good", Date.now());
    c.persist(); c.rebuild();
  }

  function click(el) {
    const a = el.dataset.s;
    syncDraft();
    if (a !== "tick") ui.msg = "";
    const later = (p) => { p.catch(() => {}).finally(refresh); return true; };
    switch (a) {
      case "add": ui.view = "add"; ui.draft = {}; ui.hits = []; return true;
      case "import": ui.view = "import"; return true;
      case "back": ui.view = "list"; ui.open = -1; return true;
      case "open": ui.view = "song"; ui.id = el.dataset.id; ui.open = -1; ui.draft = {}; return true;
      case "tick": { const id = el.dataset.id; if (ui.ticked.has(id)) ui.ticked.delete(id); else ui.ticked.add(id); return true; }
      case "search":
        if (!ui.draft.title?.trim()) { ui.msg = "Type a title first."; return true; }
        ui.busy = "Searching…";
        return later(searchLrclib({ title: ui.draft.title, artist: ui.draft.artist || "" })
          .then((h) => { ui.hits = h; if (!h.length) ui.msg = "No match on LRCLIB. Paste the lyrics below instead."; })
          .catch((e) => { ui.msg = e.message === "offline" ? "offline" : "lrclib"; })
          .finally(() => { ui.busy = ""; }));
      case "pick": {
        const h = ui.hits[Number(el.dataset.i)]; if (!h) return false;
        if (!h.lyrics) { ui.msg = "That result has no lyrics. Pick another, or paste them."; return true; }
        ui.draft = { title: ui.draft.title || h.title, artist: ui.draft.artist || h.artist, lyrics: h.lyrics, album: h.album, source: "lrclib" };
        return true;
      }
      case "save": {
        const d = ui.draft;
        if (!d.title?.trim() || !d.lyrics?.trim()) { ui.msg = "A song needs a title and lyrics."; return true; }
        if (!store) { ui.msg = "nostorage"; return true; }
        const song = { id: newSongId(), title: normLine(d.title), artist: normLine(d.artist), album: d.album ?? null, source: d.source || "paste",
          status: "lyrics", error: null, lyrics: d.lyrics, analysis: null, addedAt: Date.now() };
        ui.view = "song"; ui.id = song.id; ui.draft = {};
        return later(save(song, { add: true }));
      }
      case "savelyrics": {
        const song = byId(ui.id); if (!song || !ui.draft.lyrics?.trim()) { ui.msg = "Paste the lyrics first."; return true; }
        Object.assign(song, { lyrics: ui.draft.lyrics, status: "lyrics", error: null, source: "paste" }); ui.draft = {};
        return later(save(song));
      }
      case "fetch": {
        const song = byId(ui.id); if (!song) return false;
        ui.busy = "Searching…";
        return later(fetchLyrics(song).then((found) => { if (!found) ui.msg = "noLyrics"; })
          .catch((e) => { ui.msg = e.message === "offline" ? "offline" : "lrclib"; }).finally(() => { ui.busy = ""; }));
      }
      case "translate": {
        const song = byId(ui.id); if (!song || ui.busy) return false;
        ui.busy = "Translating…";
        const p = translate(song);
        c.render();
        return later(p.finally(() => { ui.busy = ""; }));
      }
      case "batch": if (ui.busy) return false; return later(runBatch());
      case "study": {
        const song = byId(ui.id); if (!song?.analysis) return false;
        ui.open = Number(el.closest("[data-line]")?.dataset.line ?? -1);
        study(song, Number(el.dataset.li), el.dataset.kind, Number(el.dataset.idx));
        return true;
      }
      case "delete": {
        const song = byId(ui.id); if (!song || !confirm(`Delete “${song.title}”?`)) return false;
        songs = songs.filter((s) => s.id !== song.id); ui.ticked.delete(song.id); ui.view = "list";
        return later(store ? store.remove(song.id) : Promise.resolve());
      }
      case "importGo": {
        if (!store) { ui.msg = "nostorage"; return true; }
        const have = new Set(songs.map((s) => songKey(s.title, s.artist)));
        const parsed = parseSongList(ui.importText);
        const fresh = parsed.filter((s) => !have.has(songKey(s.title, s.artist)));
        const now = Date.now();
        const added = fresh.map((s, i) => ({ id: newSongId(), title: s.title, artist: s.artist, album: null, source: "import",
          status: "queued", error: null, lyrics: null, analysis: null, addedAt: now + i }));
        for (const s of added) ui.ticked.add(s.id);
        ui.view = "list"; ui.importText = "";
        const skipped = parsed.length - fresh.length;
        ui.msg = `Imported ${added.length} song${added.length === 1 ? "" : "s"}${skipped ? ` (${skipped} already in your list)` : ""}.`;
        return later(Promise.all(added.map((s) => save(s, { add: true }))));
      }
      case "key-save": {
        const v = (document.querySelector("#song-key")?.value || "").trim();
        if (v) { try { c.ls.setItem(KEY, v); } catch { /* storage blocked */ } }
        return true;
      }
      case "key-clear": try { if (c.ls.removeItem) c.ls.removeItem(KEY); else c.ls.setItem(KEY, ""); } catch { /* storage blocked */ } return true;
      case "model": c.state().settings.songModel = el.dataset.model; c.persist(); return true;
      default: return false;
    }
  }

  function change(e) {
    if (e.target.id !== "song-csv") return false;
    const f = e.target.files?.[0]; if (!f) return false;
    f.text().then((txt) => { ui.importText = txt; if (c.tab() === "songs") c.render(); });
    e.target.value = "";
    return false;
  }

  function settingsHTML() {
    const k = key(), m = model();
    return `<h2>Songs</h2><div class="card">
      <input id="song-key" type="password" placeholder="Claude API key (sk-ant-…)" autocomplete="off">
      <div class="actions"><button class="btn primary" data-s="key-save">Save key</button><button class="btn" data-s="key-clear">Clear</button></div>
      <p class="small muted">${k ? `Saved: ${esc(`sk-ant-…${k.slice(-4)}`)}. ` : "No key saved. "}The key stays on this phone and is never in backups. Set a monthly spend limit on this key in the Anthropic Console.</p>
      <div class="chips">${Object.entries(SONG_MODELS).map(([id, x]) => `<button data-s="model" data-model="${esc(id)}" class="${id === m ? "on" : ""}">${esc(x.label)} ~${usd(estimateCost(id, 600, 20, sysChars()))}</button>`).join("")}</div>
      <p class="small muted">Rough cost per song. Haiku is the cheapest; Sonnet and Opus write richer notes.</p></div>`;
  }

  async function importSongs(list) {
    if (!store) return 0;
    let n = 0;
    for (const raw of list) { const s = cleanSong(raw); if (s) { await save(s, { add: true }); n++; } }
    return n;
  }

  return {
    render: () => (ui.view === "add" ? addHTML() : ui.view === "import" ? importHTML() : ui.view === "song" ? songHTML() : listHTML()),
    click, change, settingsHTML, importSongs,
    exportSongs: () => songs.slice(),
  };
}

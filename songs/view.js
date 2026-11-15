// The ♪ Songs tab, shared by the Korean and Cantonese apps. app.js creates it through pack.songs and routes
// every [data-s] click and every change event here first. Lyrics and translations stay on this phone.
// L is the study language's profile (songs/ko.js, songs/yue.js): its key and database names, which lines
// are lyrics, the Claude request and reply check, how a line and its points are drawn, its study cards and
// every UI string (L.t). Everything else here is the same in both apps.
import { openSongs } from "./db.js";
import { searchLrclib } from "./lrclib.js";
import { translateSong } from "./claude.js";
import {
  splitLyrics, lyricLines, lineCount, normLine, parseSongList, songKey, newSongId, cleanSong,
  SONG_MODELS, DEFAULT_MODEL, estimateCost, inReviews, batchSongs, findInSong, inFilter, pickLyrics, waitingForLyrics,
} from "./model.js";
import { grade } from "../lib/fsrs.js";

// For a song whose lyrics aren't fetched yet, the batch estimate assumes a typical song.
const TYPICAL = { chars: 1200, lines: 30 };

export function createSongs(c, L) {
  const { esc, say } = c;
  const T = L.t, KEY = L.keyName;
  const statusText = (s) => (s.status !== "error" ? T.status[s.status] : s.error === L.missing ? T.status.missing : s.error === "noLyrics" ? T.status.noLyrics : T.status.error);
  const lines = (lyrics) => lyricLines(lyrics, L.isLyric);
  const count = (lyrics) => lineCount(lyrics, L.isLyric);
  let store = null, storeError = false, loaded = false;
  let songs = [];                         // in memory, so Export can run inside the tap (iOS share sheet)
  const ui = { view: "list", id: null, draft: {}, hits: [], msg: "", busy: "", open: -1, ticked: new Set(), importText: "", q: "", filter: "all", relyrics: false };
  let run = null;                         // the batch in progress: { stopping }
  let lock = null;                        // Screen Wake Lock held while a batch runs

  // iPhone pauses a home-screen app when the screen locks or you switch away, which stops a batch, so a
  // batch asks to keep the screen on. Unsupported or refused: the batch still runs, the screen may sleep.
  async function keepAwake() { try { lock = (await navigator.wakeLock?.request("screen")) ?? null; } catch { lock = null; } }
  function letSleep() { const l = lock; lock = null; if (l) l.release().catch(() => {}); }
  // The system drops the lock while the app is in the background; take it again on return.
  document.addEventListener("visibilitychange", () => { if (run && document.visibilityState === "visible") keepAwake(); });

  openSongs(globalThis.indexedDB, L.dbName).then((s) => s.all().then((all) => { store = s; songs = all.map(cleanSong).filter(Boolean); }))
    .catch(() => { storeError = true; })
    .finally(() => { loaded = true; if (c.tab() === "songs") c.render(); });

  // ---------- helpers ----------
  const key = () => { try { return c.ls.getItem(KEY) || ""; } catch { return ""; } };
  const model = () => (SONG_MODELS[c.state().settings.songModel] ? c.state().settings.songModel : DEFAULT_MODEL);
  const grammarList = () => c.grammar().map((g) => ({ id: g.id, form: g.form, en: g.en }));
  const sysChars = () => L.systemText(grammarList()).length;
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
  const msgText = (k) => (k in T.msg ? T.msg[k] : k);
  const msgHTML = () => (ui.msg ? `<div class="card small song-msg">${esc(msgText(ui.msg))}${ui.msg === "noKey" ? `<div class="actions" style="grid-template-columns:1fr"><button class="btn" data-tab="settings">${esc(T.openSettings)}</button></div>` : ""}</div>` : "");

  // ---------- views ----------
  function listHTML() {
    if (storeError) return `<div class="songs"><div class="card empty"><b>${esc(T.noStoreTitle)}</b>${esc(T.noStoreBody)}</div></div>`;
    if (!loaded) return `<div class="songs"><div class="small muted">${esc(T.loading)}</div></div>`;
    const buttons = `<div class="actions"><button class="btn primary" data-s="add">${esc(T.addSong)}</button><button class="btn" data-s="import">${esc(T.importList)}</button></div>`;
    if (!songs.length) return `<div class="songs">${msgHTML()}<div class="card empty"><b>${esc(T.emptyTitle)}</b>${esc(T.emptyBody)}${buttons}</div></div>`;
    const { list, ticked } = batchSongs(songs, ui.ticked, L);
    const total = list.reduce((n, s) => n + (s.lyrics
      ? estimateCost(model(), s.lyrics.length, count(s.lyrics), sysChars())
      : estimateCost(model(), TYPICAL.chars, TYPICAL.lines, sysChars())), 0);
    const batch = ui.busy ? `<div class="card small song-msg">${esc(ui.busy)}${run ? `
        <div class="progress-line"><i style="width:${Math.round((run.at / run.of) * 100)}%"></i></div>
        <p class="small muted">${esc(T.keepOpen)}</p>
        <div class="actions" style="grid-template-columns:1fr"><button class="btn" data-s="stop" ${run.stopping ? "disabled" : ""}>${esc(run.stopping ? T.stopping : T.stop)}</button></div>` : ""}</div>`
      : list.length ? `<button class="btn primary" data-s="batch" style="width:100%;margin-top:10px">${esc(T.batchLabel(list.length, ticked))} ${esc(T.about(usd(total)))}</button>` : "";
    const inF = (f) => songs.filter((s) => inFilter(s, f)).length;
    const chips = [["all", T.filters.all], ["done", T.filters.done], ["todo", T.filters.todo], ["error", T.filters.error]]
      .filter(([f]) => f !== "error" || inF("error") || ui.filter === "error")
      .map(([f, label]) => `<button data-s="filter" data-sfilter="${f}" class="${ui.filter === f ? "on" : ""}">${esc(label)} ${inF(f)}</button>`).join("");
    return `<div class="songs">${msgHTML()}${buttons}${batch}
      <input type="search" id="song-q" class="song-find" placeholder="${esc(T.findPlaceholder)}" value="${esc(ui.q)}" autocomplete="off">
      <div class="chips">${chips}</div>
      <div id="song-results">${resultsHTML()}</div></div>`;
  }

  // The song rows under the find box. Typing redraws only this part, so the box keeps its IME composition.
  function resultsHTML() {
    const shown = songs.slice().sort((a, b) => b.addedAt - a.addedAt)
      .filter((s) => inFilter(s, ui.filter)).map((s) => [s, findInSong(s, ui.q, L)]).filter(([, hit]) => hit);
    const narrowed = ui.q.trim() || ui.filter !== "all";
    const head = `<div class="small muted">${esc(narrowed ? T.countOf(shown.length, songs.length) : T.count(songs.length))}</div>`;
    if (!shown.length) return head + `<div class="card empty small">${esc(T.noMatch(ui.q.trim()))}</div>`;
    return head + `<div class="list" style="margin-top:8px">${shown.map(([s, hit]) => {
      const points = s.analysis ? new Set(s.analysis.lines.flatMap((l) => l.grammar.map((g) => g.appId || normLine(g.form)))).size : 0;
      return `<div class="song-row item" data-status="${esc(s.status)}"><div class="row">
        ${s.status === "done" || waitingForLyrics(s, L) ? "" : `<input type="checkbox" data-s="tick" data-id="${esc(s.id)}" ${ui.ticked.has(s.id) ? "checked" : ""} aria-label="${esc(T.tickLabel)}">`}
        <div data-s="open" data-id="${esc(s.id)}" style="flex:1"><b>${esc(s.title)}</b><div class="meta">${esc(s.artist)}${s.artist ? " · " : ""}${esc(statusText(s))}${points ? ` · ${esc(T.points(points))}` : ""}</div>${hit.line ? `<div class="song-hit">${esc(hit.line)}</div>` : ""}</div></div></div>`;
    }).join("")}</div>`;
  }

  // Every LRCLIB result for this song with its language, so the right version can be picked; or paste.
  function relyricsHTML(song) {
    const rows = ui.busy ? `<div class="small muted">${esc(ui.busy)}</div>`
      : ui.hits.length ? `<div class="list">${ui.hits.map((h, i) => {
        const n = count(h.lyrics);
        const first = n ? lines(h.lyrics)[0] : splitLyrics(h.lyrics || "", L.isLyric).find(Boolean) || "";
        return `<div class="item lyric-hit"><div class="row"><b>${esc(h.title)}</b><span class="pill ${n ? "int" : ""}">${esc(n ? T.hitLines(n) : h.lyrics ? T.hitWrong : T.hitNoLyrics)}</span></div>
          <div class="meta">${esc(h.artist)}${h.album ? ` · ${esc(h.album)}` : ""}${h.instrumental ? ` · ${esc(T.instrumental)}` : ""}</div>
          ${first ? `<div class="song-hit">${esc(first)}</div>` : ""}
          ${n ? `<button class="btn" data-s="pickLyrics" data-i="${i}" style="width:100%;margin-top:8px">${esc(T.useLyrics)}</button>` : ""}</div>`;
      }).join("")}</div>` : `<div class="small muted">${esc(T.noOtherVersions)}</div>`;
    return `<h2>${esc(T.otherLyrics)}</h2>${song.analysis ? `<p class="small muted">${esc(T.changeRemoves)}</p>` : ""}${rows}
      <h2>${esc(T.orPaste)}</h2><div class="card">
        <textarea id="song-lyrics" rows="8" placeholder="${esc(T.pastePlaceholder)}">${esc(ui.draft.lyrics ?? "")}</textarea>
        <div class="actions"><button class="btn primary" data-s="savelyrics">${esc(T.saveLyrics)}</button><button class="btn" data-s="relyricsCancel">${esc(T.cancel)}</button></div></div>`;
  }

  function input(e) {
    if (e.target.id !== "song-q") return false;
    ui.q = e.target.value;
    const el = document.querySelector("#song-results"); if (el) el.innerHTML = resultsHTML();
    return true;
  }

  function addHTML() {
    const d = ui.draft;
    return `<div class="songs">${msgHTML()}<button class="btn" data-s="back">${esc(T.back)}</button>
      <h2>${esc(T.addTitle)}</h2>
      <div class="card">
        <input id="song-title" placeholder="${esc(T.titlePh)}" value="${esc(d.title ?? "")}" autocomplete="off">
        <input id="song-artist" placeholder="${esc(T.artistPh)}" value="${esc(d.artist ?? "")}" autocomplete="off" style="margin-top:8px">
        <div class="actions" style="grid-template-columns:1fr"><button class="btn" data-s="search">${esc(ui.busy || T.searchLyrics)}</button></div>
        ${ui.hits.length ? `<div class="list" style="margin-top:10px">${ui.hits.map((h, i) => `<div class="item" data-s="pick" data-i="${i}"><b>${esc(h.title)}</b><div class="meta">${esc(h.artist)}${h.album ? ` · ${esc(h.album)}` : ""}${h.instrumental ? ` · ${esc(T.instrumental)}` : ""}${h.lyrics ? "" : ` · ${esc(T.noLyricsShort)}`}</div></div>`).join("")}</div>` : ""}
      </div>
      <h2>${esc(T.lyrics)}</h2>
      <div class="card">
        <textarea id="song-lyrics" rows="10" placeholder="${esc(T.lyricsPh)}">${esc(d.lyrics ?? "")}</textarea>
        <div class="actions" style="grid-template-columns:1fr"><button class="btn primary" data-s="save">${esc(T.saveSong)}</button></div>
        <p class="small muted">${esc(T.lyricsStay)}</p>
      </div></div>`;
  }

  function importHTML() {
    return `<div class="songs">${msgHTML()}<button class="btn" data-s="back">${esc(T.back)}</button>
      <h2>${esc(T.importList)}</h2>
      <div class="card">
        <textarea id="song-list" rows="10" placeholder="${esc(T.listPh)}">${esc(ui.importText)}</textarea>
        <p class="small muted">${esc(T.csvNote)}</p>
        <input type="file" id="song-csv" accept=".csv,text/csv,text/plain">
        <div class="actions" style="grid-template-columns:1fr"><button class="btn primary" data-s="importGo">${esc(T.importGo)}</button></div>
        <p class="small muted">${esc(T.importNote)}</p>
      </div></div>`;
  }

  // One lyric line: the profile draws the line itself (L.lineHTML) and each grammar point and word; the
  // Add to study buttons are the same in both apps.
  const view = { esc, say, t: c.t };
  function lineHTML(raw, i, entries, song) {
    const lyric = normLine(raw);
    if (!lyric) return `<div class="song-gap"></div>`;
    const e = entries.get(lyric);
    if (!L.isLyric(lyric) || !e) return `<div class="song-line plain"><div class="muted">${esc(lyric)}</div></div>`;
    const li = song.analysis.lines.indexOf(e);
    const progress = c.state().progress, items = c.items();
    const btn = (kind, entry, idx) => {
      const id = L.findStudyId({ kind, entry, items });
      return id && inReviews(id, progress) ? `<span class="in-reviews small">${esc(T.inReviews)}</span>`
        : `<button class="btn" data-s="study" data-kind="${kind}" data-li="${li}" data-idx="${idx}">${esc(T.addToStudy)}</button>`;
    };
    return `<div class="song-line item${ui.open === i ? " open" : ""}" data-line="${i}">
      ${L.lineHTML(lyric, e, view)}
      <div class="more">
        ${e.grammar.map((g, gi) => `<div class="song-point">${L.grammarHTML(g, view)}${btn("grammar", g, gi)}</div>`).join("")}
        ${e.words.map((w, wi) => `<div class="song-point">${L.wordHTML(w, view)}${btn("word", w, wi)}</div>`).join("")}
      </div></div>`;
  }

  function songHTML() {
    const song = byId(ui.id);
    if (!song) { ui.view = "list"; return listHTML(); }
    // Why the last try failed, kept with the song so a batch's failures can be read later.
    const why = song.status === "error" && song.error && !ui.msg ? `<div class="card small song-msg">${esc(msgText(song.error))}</div>` : "";
    const head = `<div class="songs">${msgHTML()}<button class="btn" data-s="back">${esc(T.back)}</button>
      <h2>${esc(song.title)}${song.artist ? ` · ${esc(song.artist)}` : ""}</h2>${why}`;
    const del = `<button class="btn" data-s="delete" style="width:100%;margin-top:16px;color:var(--bad)">${esc(T.deleteSong)}</button></div>`;
    // Lyrics held: fix them from here (another search result, or pasted), or delete the song.
    const tail = `<div class="actions" style="margin-top:16px"><button class="btn" data-s="relyrics">${esc(T.findOther)}</button><button class="btn" data-s="delete" style="color:var(--bad)">${esc(T.deleteSong)}</button></div></div>`;
    if (ui.relyrics) return head + relyricsHTML(song) + "</div>";
    if (!song.lyrics) {
      // A song whose search already failed leads with the results list: searching the same way again won't help.
      const find = waitingForLyrics(song, L)
        ? `<div class="actions" style="grid-template-columns:1fr"><button class="btn primary" data-s="relyrics">${esc(T.seeAll)}</button></div>`
        : `<p class="small muted">${esc(T.notFetched)}</p>
        <div class="actions"><button class="btn primary" data-s="fetch">${esc(ui.busy || T.findLyrics)}</button><button class="btn" data-s="relyrics">${esc(T.seeAll)}</button></div>`;
      return head + `<div class="card">${find}
        <textarea id="song-lyrics" rows="8" placeholder="${esc(T.orPastePh)}" style="margin-top:10px">${esc(ui.draft.lyrics ?? "")}</textarea>
        <div class="actions" style="grid-template-columns:1fr"><button class="btn" data-s="savelyrics">${esc(T.saveLyrics)}</button></div></div>` + del;
    }
    const lyricsCard = `<div class="card" style="margin-top:12px">${splitLyrics(song.lyrics, L.isLyric).map((l) => (l ? `<div>${esc(l)}</div>` : "<br>")).join("")}</div>`;
    if (!count(song.lyrics)) {
      return head + `<div class="card small">${esc(T.noLines)}
        <div class="actions" style="grid-template-columns:1fr"><button class="btn primary" data-s="relyrics">${esc(T.findOther)}</button></div></div>` + lyricsCard + tail;
    }
    if (song.status !== "done" || !song.analysis) {
      const est = estimateCost(model(), song.lyrics.length, count(song.lyrics), sysChars());
      return head + `<div class="actions" style="grid-template-columns:1fr"><button class="btn primary" data-s="translate">${esc(ui.busy
        || `${song.status === "error" ? T.retry : T.translate} ${T.about(usd(est))}`)}</button></div>` + lyricsCard + tail;
    }
    const a = song.analysis;
    const entries = new Map(a.lines.map((l) => [normLine(L.lineKey(l)), l]));
    const groups = new Map();
    for (const l of a.lines) for (const g of l.grammar) {
      const k = g.appId || normLine(g.form); const cur = groups.get(k) || { g, n: 0 }; cur.n++; groups.set(k, cur);
    }
    const items = c.items(), progress = c.state().progress;
    const sum = `<div class="card song-sum small"><div class="muted">${esc(SONG_MODELS[a.model]?.label ?? a.model)} · ${usd(a.costUsd)}</div>
      ${groups.size ? `<div class="chips">${[...groups.values()].map(({ g, n }) => {
        const id = L.findStudyId({ kind: "grammar", entry: g, items });
        return `<span class="song-chip${id && inReviews(id, progress) ? " done" : ""}">${L.chipHTML(g, view)}${n > 1 ? ` ×${n}` : ""}</span>`;
      }).join("")}</div>` : ""}
      ${L.sumNote ? L.sumNote(a, view) : ""}<div class="muted">${esc(T.tapLine)}</div></div>`;
    return head + sum + `<div class="list song-lines" style="margin-top:12px">${splitLyrics(song.lyrics, L.isLyric).map((l, i) => lineHTML(l, i, entries, song)).join("")}</div>` + tail;
  }

  // ---------- actions ----------
  async function translate(song, { ask = true } = {}) {
    if (!key()) { ui.msg = "noKey"; return false; }
    const todo = lines(song.lyrics);
    if (!todo.length) { song.status = "error"; song.error = L.missing; await save(song); ui.msg = L.missing; return false; }
    const m = model();
    if (ask && !confirm(T.confirmTranslate(SONG_MODELS[m].label, usd(estimateCost(m, song.lyrics.length, todo.length, sysChars()))))) return false;
    L.prefetch?.();                       // Cantonese: start loading the dictionary alongside the call
    try {
      const r = await translateSong({ apiKey: key(), model: m, lines: todo, grammar: grammarList(), lang: L });
      // The Cantonese profile checks each line's Jyutping against the dictionary here (marks it ?).
      const analysed = L.afterTranslate ? await L.afterTranslate(r.analysis.lines) : r.analysis.lines;
      song.analysis = { model: SONG_MODELS[r.model] ? r.model : m, at: Date.now(), costUsd: r.costUsd, lines: analysed,
        usage: { in: r.usage?.input_tokens || 0, out: r.usage?.output_tokens || 0, cacheRead: r.usage?.cache_read_input_tokens || 0 } };
      song.status = "done"; song.error = null;
    } catch (e) {
      song.status = "error"; song.error = e.code || "invalid";
      ui.msg = song.error === "rejected" && e.detail ? T.rejectedDetail(e.detail) : song.error;
    }
    await save(song);
    return song.status === "done";
  }

  // Fetches lyrics with lines in the language. Returns null when found, or why not ("noLyrics", L.missing),
  // which is saved on the song so it waits for lyrics to be picked or pasted.
  async function fetchLyrics(song) {
    const { hit, reason } = pickLyrics(await searchLrclib({ title: song.title, artist: song.artist }), L);
    if (hit) Object.assign(song, { lyrics: hit.lyrics, album: song.album ?? hit.album, status: "lyrics", error: null });
    else Object.assign(song, { status: "error", error: reason });
    await save(song);
    return reason;
  }

  async function runBatch() {
    const { list } = batchSongs(songs, ui.ticked, L);
    run = { stopping: false, at: 0, of: list.length };
    let done = 0;
    await keepAwake();
    try {
      for (const [i, song] of list.entries()) {
        if (run.stopping) break;
        if (!byId(song.id)) continue;            // deleted since the batch started
        run.at = i; ui.busy = T.batchBusy(i + 1, list.length, song.title); refresh();
        try {
          if (!song.lyrics && (await fetchLyrics(song))) { ui.ticked.delete(song.id); continue; }
        } catch (e) { song.status = "error"; song.error = e.message === "offline" ? "offline" : "lrclib"; await save(song); continue; }
        if (await translate(song, { ask: false })) { ui.ticked.delete(song.id); done++; }
        if (ui.msg === "noKey") break;
      }
    } finally {
      letSleep();
      const failed = list.filter((s) => byId(s.id)?.status === "error").length;
      if (ui.msg !== "noKey") ui.msg = T.batchDone(run.stopping, done, list.length, failed);
      run = null; ui.busy = ""; refresh();
    }
  }

  function study(song, li, kind, idx) {
    const line = song.analysis.lines[li];
    const entry = kind === "grammar" ? line?.grammar[idx] : line?.words[idx];
    if (!entry) return;
    const cu = c.currentUnit();
    let r;
    try { r = L.studyItem({ kind, entry, line, song, items: c.items(), unit: { tier: cu.tier, unit: cu.unit }, id: `u${Date.now().toString(36)}` }); }
    catch { ui.msg = T.noCard; return; }
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
      case "back": ui.view = "list"; ui.open = -1; ui.relyrics = false; return true;
      case "open": ui.view = "song"; ui.id = el.dataset.id; ui.open = -1; ui.draft = {}; ui.relyrics = false; return true;
      case "tick": { const id = el.dataset.id; if (ui.ticked.has(id)) ui.ticked.delete(id); else ui.ticked.add(id); return true; }
      case "search":
        if (!ui.draft.title?.trim()) { ui.msg = T.needTitle; return true; }
        ui.busy = T.searching;
        return later(searchLrclib({ title: ui.draft.title, artist: ui.draft.artist || "" })
          .then((h) => { ui.hits = h; if (!h.length) ui.msg = T.noMatchLrclib; })
          .catch((e) => { ui.msg = e.message === "offline" ? "offline" : "lrclib"; })
          .finally(() => { ui.busy = ""; }));
      case "pick": {
        const h = ui.hits[Number(el.dataset.i)]; if (!h) return false;
        if (!h.lyrics) { ui.msg = T.resultNoLyrics; return true; }
        ui.draft = { title: ui.draft.title || h.title, artist: ui.draft.artist || h.artist, lyrics: h.lyrics, album: h.album, source: "lrclib" };
        return true;
      }
      case "save": {
        const d = ui.draft;
        if (!d.title?.trim() || !d.lyrics?.trim()) { ui.msg = T.needTitleLyrics; return true; }
        if (!store) { ui.msg = "nostorage"; return true; }
        const song = { id: newSongId(), title: normLine(d.title), artist: normLine(d.artist), album: d.album ?? null, source: d.source || "paste",
          status: "lyrics", error: null, lyrics: d.lyrics, analysis: null, addedAt: Date.now() };
        ui.view = "song"; ui.id = song.id; ui.draft = {};
        return later(save(song, { add: true }));
      }
      case "savelyrics": {
        const song = byId(ui.id); if (!song || !ui.draft.lyrics?.trim()) { ui.msg = T.pasteFirst; return true; }
        if (song.analysis && !confirm(T.confirmSaveLyrics)) return false;
        Object.assign(song, { lyrics: ui.draft.lyrics, status: "lyrics", error: null, source: "paste", analysis: null }); ui.draft = {}; ui.relyrics = false;
        return later(save(song));
      }
      case "relyrics": {
        const song = byId(ui.id); if (!song) return false;
        ui.relyrics = true; ui.hits = []; ui.draft = {}; ui.busy = T.searching;
        return later(searchLrclib({ title: song.title, artist: song.artist })
          .then((h) => { ui.hits = h; })
          .catch((e) => { ui.msg = e.message === "offline" ? "offline" : "lrclib"; })
          .finally(() => { ui.busy = ""; }));
      }
      case "relyricsCancel": ui.relyrics = false; ui.hits = []; return true;
      case "pickLyrics": {
        const song = byId(ui.id), h = ui.hits[Number(el.dataset.i)];
        if (!song || !h || !count(h.lyrics)) return false;
        if (song.analysis && !confirm(T.confirmUseLyrics)) return false;
        Object.assign(song, { lyrics: h.lyrics, album: h.album ?? song.album, source: "lrclib", status: "lyrics", error: null, analysis: null });
        ui.relyrics = false; ui.hits = [];
        return later(save(song));
      }
      case "fetch": {
        const song = byId(ui.id); if (!song) return false;
        ui.busy = T.searching;
        return later(fetchLyrics(song).then((why) => { if (why) ui.msg = why; })
          .catch((e) => { ui.msg = e.message === "offline" ? "offline" : "lrclib"; }).finally(() => { ui.busy = ""; }));
      }
      case "translate": {
        const song = byId(ui.id); if (!song || ui.busy) return false;
        ui.busy = T.translating;
        const p = translate(song);
        c.render();
        return later(p.finally(() => { ui.busy = ""; }));
      }
      case "batch": if (ui.busy || run) return false; return later(runBatch());
      case "stop": if (run) run.stopping = true; return true;
      case "filter": ui.filter = el.dataset.sfilter; return true;
      case "study": {
        const song = byId(ui.id); if (!song?.analysis) return false;
        ui.open = Number(el.closest("[data-line]")?.dataset.line ?? -1);
        study(song, Number(el.dataset.li), el.dataset.kind, Number(el.dataset.idx));
        return true;
      }
      case "delete": {
        const song = byId(ui.id); if (!song || !confirm(T.confirmDelete(song.title))) return false;
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
        ui.msg = T.imported(added.length, skipped);
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
    return `<h2>${esc(T.settingsTitle)}</h2><div class="card">
      <input id="song-key" type="password" placeholder="${esc(T.keyPh)}" autocomplete="off">
      <div class="actions"><button class="btn primary" data-s="key-save">${esc(T.saveKey)}</button><button class="btn" data-s="key-clear">${esc(T.clearKey)}</button></div>
      <p class="small muted">${esc(k ? T.keySaved(`sk-ant-…${k.slice(-4)}`) : T.noKeySaved)} ${esc(T.keyNote)}</p>
      <div class="chips">${Object.entries(SONG_MODELS).map(([id, x]) => `<button data-s="model" data-model="${esc(id)}" class="${id === m ? "on" : ""}">${esc(x.label)} ~${usd(estimateCost(id, 600, 20, sysChars()))}</button>`).join("")}</div>
      <p class="small muted">${esc(T.costNote)}</p></div>`;
  }

  async function importSongs(list) {
    if (!store) return 0;
    let n = 0;
    for (const raw of list) { const s = cleanSong(raw); if (s) { await save(s, { add: true }); n++; } }
    return n;
  }

  return {
    render: () => (ui.view === "add" ? addHTML() : ui.view === "import" ? importHTML() : ui.view === "song" ? songHTML() : listHTML()),
    click, change, input, settingsHTML, importSongs,
    exportSongs: () => songs.slice(),
  };
}

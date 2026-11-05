// The ♪ Songs tab of the Korean app. app.js creates it through pack.songs and routes every
// [data-s] click and every change event here first. Lyrics and translations stay on this phone.
import { openSongs } from "./db.js";
import { searchLrclib } from "./lrclib.js";
import { translateSong } from "./claude.js";
import {
  splitLyrics, uniqueHangulLines, normLine, hasHangul, parseSongList, songKey, newSongId, cleanSong,
  SONG_MODELS, DEFAULT_MODEL, systemText, estimateCost, studyItem, findStudyId, inReviews, batchSongs, findInSong, inFilter, pickLyrics, koreanLineCount, waitingForLyrics,
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
  noKorean: "Only lyrics without Korean were found: an English version, or the song is sung in English. Tap Find other lyrics to pick another version, or paste the Korean lyrics.",
  lrclib: "The lyrics search isn't answering. Try again later, or paste the lyrics.",
  nostorage: "Songs can't be saved on this device.",
};
const STATUS = { queued: "not translated", lyrics: "lyrics only", done: "translated", error: "error" };
const statusText = (s) => (s.status !== "error" ? STATUS[s.status] : s.error === "noKorean" ? "no Korean lyrics" : s.error === "noLyrics" ? "lyrics not found" : "error");
// For a song whose lyrics aren't fetched yet, the batch estimate assumes a typical song.
const TYPICAL = { chars: 1200, lines: 30 };

export function createSongs(c) {
  const { esc, say } = c;
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
    const buttons = `<div class="actions"><button class="btn primary" data-s="add">Add song</button><button class="btn" data-s="import">Import list</button></div>`;
    if (!songs.length) return `<div class="songs">${msgHTML()}<div class="card empty"><b>No songs yet</b>Add a song you listen to, or import your list.${buttons}</div></div>`;
    const { list, ticked } = batchSongs(songs, ui.ticked);
    const total = list.reduce((n, s) => n + (s.lyrics
      ? estimateCost(model(), s.lyrics.length, uniqueHangulLines(splitLyrics(s.lyrics)).length, sysChars())
      : estimateCost(model(), TYPICAL.chars, TYPICAL.lines, sysChars())), 0);
    const label = ticked ? `Translate ${list.length} song${list.length > 1 ? "s" : ""}`
      : list.length > 1 ? `Translate all ${list.length} untranslated` : "Translate 1 untranslated song";
    const batch = ui.busy ? `<div class="card small song-msg">${esc(ui.busy)}${run ? `
        <div class="progress-line"><i style="width:${Math.round((run.at / run.of) * 100)}%"></i></div>
        <p class="small muted">Keep this screen open until it finishes: iPhone pauses the app when the screen locks or you switch away. Each song is saved as soon as it's done.</p>
        <div class="actions" style="grid-template-columns:1fr"><button class="btn" data-s="stop" ${run.stopping ? "disabled" : ""}>${run.stopping ? "Stopping after this song…" : "Stop after this song"}</button></div>` : ""}</div>`
      : list.length ? `<button class="btn primary" data-s="batch" style="width:100%;margin-top:10px">${label} (about ${usd(total)})</button>` : "";
    const count = (f) => songs.filter((s) => inFilter(s, f)).length;
    const chips = [["all", "All"], ["done", "Translated"], ["todo", "To translate"], ["error", "Needs attention"]]
      .filter(([f]) => f !== "error" || count("error") || ui.filter === "error")
      .map(([f, label]) => `<button data-s="filter" data-sfilter="${f}" class="${ui.filter === f ? "on" : ""}">${label} ${count(f)}</button>`).join("");
    return `<div class="songs">${msgHTML()}${buttons}${batch}
      <input type="search" id="song-q" class="song-find" placeholder="Find: title, artist, a lyric or its meaning" value="${esc(ui.q)}" autocomplete="off">
      <div class="chips">${chips}</div>
      <div id="song-results">${resultsHTML()}</div></div>`;
  }

  // The song rows under the find box. Typing redraws only this part, so the box keeps its IME composition.
  function resultsHTML() {
    const shown = songs.slice().sort((a, b) => b.addedAt - a.addedAt)
      .filter((s) => inFilter(s, ui.filter)).map((s) => [s, findInSong(s, ui.q)]).filter(([, hit]) => hit);
    const narrowed = ui.q.trim() || ui.filter !== "all";
    const head = `<div class="small muted">${narrowed ? `${shown.length} of ${songs.length} songs` : `${songs.length} song${songs.length > 1 ? "s" : ""}`}</div>`;
    if (!shown.length) return head + `<div class="card empty small">No songs match${ui.q.trim() ? ` “${esc(ui.q.trim())}”` : " this filter"}.</div>`;
    return head + `<div class="list" style="margin-top:8px">${shown.map(([s, hit]) => {
      const points = s.analysis ? new Set(s.analysis.lines.flatMap((l) => l.grammar.map((g) => g.appId || normLine(g.form)))).size : 0;
      return `<div class="song-row item" data-status="${esc(s.status)}"><div class="row">
        ${s.status === "done" || waitingForLyrics(s) ? "" : `<input type="checkbox" data-s="tick" data-id="${esc(s.id)}" ${ui.ticked.has(s.id) ? "checked" : ""} aria-label="Select for translating">`}
        <div data-s="open" data-id="${esc(s.id)}" style="flex:1"><b>${esc(s.title)}</b><div class="meta">${esc(s.artist)}${s.artist ? " · " : ""}${statusText(s)}${points ? ` · ${points} grammar point${points > 1 ? "s" : ""}` : ""}</div>${hit.line ? `<div class="song-hit">${esc(hit.line)}</div>` : ""}</div></div></div>`;
    }).join("")}</div>`;
  }

  // Every LRCLIB result for this song with its language, so the right version can be picked; or paste.
  function relyricsHTML(song) {
    const rows = ui.busy ? `<div class="small muted">${esc(ui.busy)}</div>`
      : ui.hits.length ? `<div class="list">${ui.hits.map((h, i) => {
        const n = koreanLineCount(h.lyrics);
        const first = n ? uniqueHangulLines(splitLyrics(h.lyrics))[0] : splitLyrics(h.lyrics || "").find(Boolean) || "";
        return `<div class="item lyric-hit"><div class="row"><b>${esc(h.title)}</b><span class="pill ${n ? "int" : ""}">${n ? `Korean · ${n} lines` : h.lyrics ? "No Korean" : "No lyrics"}</span></div>
          <div class="meta">${esc(h.artist)}${h.album ? ` · ${esc(h.album)}` : ""}${h.instrumental ? " · instrumental" : ""}</div>
          ${first ? `<div class="song-hit">${esc(first)}</div>` : ""}
          ${n ? `<button class="btn" data-s="pickLyrics" data-i="${i}" style="width:100%;margin-top:8px">Use these lyrics</button>` : ""}</div>`;
      }).join("")}</div>` : `<div class="small muted">No other versions on LRCLIB. Paste the lyrics below.</div>`;
    return `<h2>Other lyrics</h2>${song.analysis ? `<p class="small muted">Changing the lyrics removes this song's translation.</p>` : ""}${rows}
      <h2>Or paste them</h2><div class="card">
        <textarea id="song-lyrics" rows="8" placeholder="Paste the Korean lyrics here">${esc(ui.draft.lyrics ?? "")}</textarea>
        <div class="actions"><button class="btn primary" data-s="savelyrics">Save lyrics</button><button class="btn" data-s="relyricsCancel">Cancel</button></div></div>`;
  }

  function input(e) {
    if (e.target.id !== "song-q") return false;
    ui.q = e.target.value;
    const el = document.querySelector("#song-results"); if (el) el.innerHTML = resultsHTML();
    return true;
  }

  function addHTML() {
    const d = ui.draft;
    return `<div class="songs">${msgHTML()}<button class="btn" data-s="back">Songs</button>
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
    return `<div class="songs">${msgHTML()}<button class="btn" data-s="back">Songs</button>
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
      return id && inReviews(id, progress) ? `<span class="in-reviews small">In reviews</span>`
        : `<button class="btn" data-s="study" data-kind="${kind}" data-li="${li}" data-idx="${idx}">Add to study</button>`;
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
    // Why the last try failed, kept with the song so a batch's failures can be read later.
    const why = song.status === "error" && song.error && !ui.msg ? `<div class="card small song-msg">${esc(msgText(song.error))}</div>` : "";
    const head = `<div class="songs">${msgHTML()}<button class="btn" data-s="back">Songs</button>
      <h2>${esc(song.title)}${song.artist ? ` · ${esc(song.artist)}` : ""}</h2>${why}`;
    const del = `<button class="btn" data-s="delete" style="width:100%;margin-top:16px;color:var(--bad)">Delete song</button></div>`;
    // Lyrics held: fix them from here (another search result, or pasted), or delete the song.
    const tail = `<div class="actions" style="margin-top:16px"><button class="btn" data-s="relyrics">Find other lyrics</button><button class="btn" data-s="delete" style="color:var(--bad)">Delete song</button></div></div>`;
    if (ui.relyrics) return head + relyricsHTML(song) + "</div>";
    if (!song.lyrics) {
      // A song whose search already failed leads with the results list: searching the same way again won't help.
      const find = waitingForLyrics(song)
        ? `<div class="actions" style="grid-template-columns:1fr"><button class="btn primary" data-s="relyrics">See all results</button></div>`
        : `<p class="small muted">Lyrics not fetched yet.</p>
        <div class="actions"><button class="btn primary" data-s="fetch">${ui.busy ? esc(ui.busy) : "Find lyrics"}</button><button class="btn" data-s="relyrics">See all results</button></div>`;
      return head + `<div class="card">${find}
        <textarea id="song-lyrics" rows="8" placeholder="…or paste the lyrics here" style="margin-top:10px">${esc(ui.draft.lyrics ?? "")}</textarea>
        <div class="actions" style="grid-template-columns:1fr"><button class="btn" data-s="savelyrics">Save lyrics</button></div></div>` + del;
    }
    const lyricsCard = `<div class="card" style="margin-top:12px">${splitLyrics(song.lyrics).map((l) => (l ? `<div>${esc(l)}</div>` : "<br>")).join("")}</div>`;
    if (!koreanLineCount(song.lyrics)) {
      return head + `<div class="card small">These lyrics have no Korean lines, so there is nothing to translate. They may be an English version, or the song may be sung in English.
        <div class="actions" style="grid-template-columns:1fr"><button class="btn primary" data-s="relyrics">Find other lyrics</button></div></div>` + lyricsCard + tail;
    }
    if (song.status !== "done" || !song.analysis) {
      const lines = uniqueHangulLines(splitLyrics(song.lyrics));
      const est = estimateCost(model(), song.lyrics.length, lines.length, sysChars());
      return head + `<div class="actions" style="grid-template-columns:1fr"><button class="btn primary" data-s="translate">${ui.busy ? esc(ui.busy)
        : `${song.status === "error" ? "Retry" : "Translate & explain"} (about ${usd(est)})`}</button></div>` + lyricsCard + tail;
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
        return `<span class="song-chip${id && inReviews(id, progress) ? " done" : ""}">${esc(g.form)}${n > 1 ? ` ×${n}` : ""}</span>`;
      }).join("")}</div>` : ""}
      <div class="muted">Tap a line for its grammar and words.</div></div>`;
    return head + sum + `<div class="list song-lines" style="margin-top:12px">${splitLyrics(song.lyrics).map((l, i) => lineHTML(l, i, entries, song)).join("")}</div>` + tail;
  }

  // ---------- actions ----------
  async function translate(song, { ask = true } = {}) {
    if (!key()) { ui.msg = "noKey"; return false; }
    const lines = uniqueHangulLines(splitLyrics(song.lyrics));
    if (!lines.length) { song.status = "error"; song.error = "noKorean"; await save(song); ui.msg = "noKorean"; return false; }
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

  // Fetches lyrics with Korean in them. Returns null when found, or why not ("noLyrics", "noKorean"),
  // which is saved on the song so it waits for lyrics to be picked or pasted.
  async function fetchLyrics(song) {
    const { hit, reason } = pickLyrics(await searchLrclib({ title: song.title, artist: song.artist }));
    if (hit) Object.assign(song, { lyrics: hit.lyrics, album: song.album ?? hit.album, status: "lyrics", error: null });
    else Object.assign(song, { status: "error", error: reason });
    await save(song);
    return reason;
  }

  async function runBatch() {
    const { list } = batchSongs(songs, ui.ticked);
    run = { stopping: false, at: 0, of: list.length };
    let done = 0;
    await keepAwake();
    try {
      for (const [i, song] of list.entries()) {
        if (run.stopping) break;
        if (!byId(song.id)) continue;            // deleted since the batch started
        run.at = i; ui.busy = `Translating ${i + 1} of ${list.length}: ${song.title}…`; refresh();
        try {
          if (!song.lyrics && (await fetchLyrics(song))) { ui.ticked.delete(song.id); continue; }
        } catch (e) { song.status = "error"; song.error = e.message === "offline" ? "offline" : "lrclib"; await save(song); continue; }
        if (await translate(song, { ask: false })) { ui.ticked.delete(song.id); done++; }
        if (ui.msg === "noKey") break;
      }
    } finally {
      letSleep();
      const failed = list.filter((s) => byId(s.id)?.status === "error").length;
      if (ui.msg !== "noKey") ui.msg = `${run.stopping ? "Stopped: translated" : "Translated"} ${done} of ${list.length}.${failed ? ` ${failed} need${failed > 1 ? "" : "s"} attention: open ${failed > 1 ? "them" : "it"} to see why.` : ""}`;
      run = null; ui.busy = ""; refresh();
    }
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
      case "back": ui.view = "list"; ui.open = -1; ui.relyrics = false; return true;
      case "open": ui.view = "song"; ui.id = el.dataset.id; ui.open = -1; ui.draft = {}; ui.relyrics = false; return true;
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
        if (song.analysis && !confirm("Save these lyrics? This song's translation will be removed.")) return false;
        Object.assign(song, { lyrics: ui.draft.lyrics, status: "lyrics", error: null, source: "paste", analysis: null }); ui.draft = {}; ui.relyrics = false;
        return later(save(song));
      }
      case "relyrics": {
        const song = byId(ui.id); if (!song) return false;
        ui.relyrics = true; ui.hits = []; ui.draft = {}; ui.busy = "Searching…";
        return later(searchLrclib({ title: song.title, artist: song.artist })
          .then((h) => { ui.hits = h; })
          .catch((e) => { ui.msg = e.message === "offline" ? "offline" : "lrclib"; })
          .finally(() => { ui.busy = ""; }));
      }
      case "relyricsCancel": ui.relyrics = false; ui.hits = []; return true;
      case "pickLyrics": {
        const song = byId(ui.id), h = ui.hits[Number(el.dataset.i)];
        if (!song || !h || !koreanLineCount(h.lyrics)) return false;
        if (song.analysis && !confirm("Use these lyrics? This song's translation will be removed.")) return false;
        Object.assign(song, { lyrics: h.lyrics, album: h.album ?? song.album, source: "lrclib", status: "lyrics", error: null, analysis: null });
        ui.relyrics = false; ui.hits = [];
        return later(save(song));
      }
      case "fetch": {
        const song = byId(ui.id); if (!song) return false;
        ui.busy = "Searching…";
        return later(fetchLyrics(song).then((why) => { if (why) ui.msg = why; })
          .catch((e) => { ui.msg = e.message === "offline" ? "offline" : "lrclib"; }).finally(() => { ui.busy = ""; }));
      }
      case "translate": {
        const song = byId(ui.id); if (!song || ui.busy) return false;
        ui.busy = "Translating…";
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
    click, change, input, settingsHTML, importSongs,
    exportSongs: () => songs.slice(),
  };
}

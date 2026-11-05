// Songs tab logic (Korean app): lyric lines, list import, the Claude request and reply, cost, study cards.
// Pure functions only, so all of it runs in Node tests. Lyrics never live in the repo: they come from
// LRCLIB or the user's paste and are stored on the phone (see songs/db.js).

import { validateItem } from "../lib/validate.js";

const HANGUL = /[가-힣ᄀ-ᇿ㄰-㆏]/;
export const hasHangul = (s) => HANGUL.test(String(s ?? ""));
export const normLine = (s) => String(s ?? "").trim().replace(/\s+/g, " ");

// LRC timestamps such as [00:01.00] or [01:02:03]; section markers such as [Chorus] or (Verse 2).
const STAMP = /\[\d{1,2}:\d{2}(?:[.:]\d{1,3})?\]/g;
const MARKER = /^\s*[[(][^\])]*[\])]\s*$/;

export function splitLyrics(text) {
  return String(text ?? "").split(/\r?\n/).map((l) => {
    const line = l.replace(STAMP, "").trim();
    return MARKER.test(line) && !hasHangul(line) ? "" : line;
  });
}

// One entry per distinct Korean line, in first-seen order: choruses are translated once.
export function uniqueHangulLines(lines) {
  const seen = new Set(), out = [];
  for (const l of lines) {
    const n = normLine(l);
    if (!n || !hasHangul(n) || seen.has(n)) continue;
    seen.add(n); out.push(n);
  }
  return out;
}

export const songKey = (title, artist) => `${normLine(title).toLowerCase()}|${normLine(artist).toLowerCase()}`;

// Minimal CSV: commas inside quotes are kept and "" is an escaped quote.
function csvRows(text) {
  const rows = []; let row = [], cell = "", q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (c === '"') q = false;
      else cell += c;
    } else if (c === '"') q = true;
    else if (c === ",") { row.push(cell); cell = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(cell); rows.push(row); row = []; cell = "";
    } else cell += c;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  return rows;
}

// "Title – Artist" lines (–, —, - or a tab), or a CSV whose header has a "title" column
// (Google Takeout's YouTube Music library export).
export function parseSongList(text) {
  const src = String(text ?? "").replace(/^﻿/, "");
  const first = src.split(/\r?\n/, 1)[0];
  let list;
  if (first.includes(",") && /title/i.test(first)) {
    const [head, ...rows] = csvRows(src);
    const ti = head.findIndex((h) => /title/i.test(h)), ai = head.findIndex((h) => /artist/i.test(h));
    list = rows.map((r) => ({ title: r[ti] ?? "", artist: ai >= 0 ? r[ai] ?? "" : "" }));
  } else {
    list = src.split(/\r?\n/).map((l) => {
      const m = l.split(/\t| [–—-] /);
      return m.length > 1 ? { title: m[0], artist: m.slice(1).join(" - ") } : { title: l, artist: "" };
    });
  }
  const seen = new Set(), out = [];
  for (const s of list) {
    const title = normLine(s.title), artist = normLine(s.artist);
    if (!title || seen.has(songKey(title, artist))) continue;
    seen.add(songKey(title, artist)); out.push({ title, artist });
  }
  return out;
}

// ---------- the Claude request ----------
// US$ per million tokens. Cache reads cost 0.1× and cache writes 1.25× the input price.
export const SONG_MODELS = {
  "claude-haiku-5-5": { label: "Claude Haiku 5.5", in: 0.10, out: 0.50 },
  "claude-sonnet-5-5": { label: "Claude Sonnet 5.5", in: 2, out: 10 },
  "claude-opus-5-5": { label: "Claude Opus 5.5", in: 4, out: 20 },
};
export const DEFAULT_MODEL = "claude-haiku-5-5";

const RULES = `You help a Korean learner (TOPIK 3–4, reads Traditional Chinese and English) study song lyrics.
For each numbered line: give a natural Traditional Chinese translation (zh) and a natural English translation (en), not word for word.
grammar: the grammar points in that line worth learning. Skip particles and endings a TOPIK 3 learner already knows unless used unusually. For each give form (e.g. -(으)ㄹ수록), en and zh meanings, and a one-sentence English note on how it works in this line; mention casual or poetic contractions (난 = 나는, 널 = 너를). Set appId only if the line truly uses that point from the GRAMMAR LIST, else null.
words: up to 5 content words: ko as in the line, base = dictionary form, hanja for Sino-Korean words else null, zh, en, pos (n, v, adj, adv, phrase).
Return n = the line number you were given for every line, once each.`;

export const systemText = (grammar) =>
  `${RULES}\n\nGRAMMAR LIST (id | form | meaning)\n${grammar.map((g) => `${g.id} | ${g.form} | ${g.en}`).join("\n")}`;

const S = { type: "string" };
const NULLABLE = { anyOf: [S, { type: "null" }] };
const obj = (props) => ({ type: "object", additionalProperties: false, required: Object.keys(props), properties: props });
export const ANALYSIS_SCHEMA = obj({
  lines: { type: "array", items: obj({
    n: { type: "integer" }, zh: S, en: S,
    grammar: { type: "array", items: obj({ form: S, appId: NULLABLE, en: S, zh: S, note: S }) },
    words: { type: "array", items: obj({ ko: S, base: S, hanja: NULLABLE, zh: S, en: S, pos: S }) },
  }) },
});

export function buildRequest({ model, lines, grammar }) {
  const req = {
    model, max_tokens: 64000,
    system: [{ type: "text", text: systemText(grammar), cache_control: { type: "ephemeral" } }],
    messages: [{ role: "user", content: lines.map((l, i) => `${i + 1}. ${l}`).join("\n") }],
    output_config: { effort: "medium", format: { type: "json_schema", schema: ANALYSIS_SCHEMA } },
  };
  // Server-side refusal fallbacks exist for Opus and Sonnet only.
  if (model !== "claude-haiku-5-5") Object.assign(req, { betas: ["server-side-fallback-2026-07-01"], fallbacks: "default" });
  return req;
}

// ---------- checking the reply ----------
const MAX = 400;
const fail = () => { throw new Error("invalid"); };
const str = (v) => (typeof v === "string" ? v.slice(0, MAX) : fail());
const strOrNull = (v) => (v == null || v === "" ? null : str(v));
const arr = (v) => (Array.isArray(v) ? v : fail());

export function parseAnalysis(text, lines, grammarIds) {
  let j;
  try { j = JSON.parse(text); } catch { fail(); }
  const got = new Map();
  for (const l of arr(j?.lines)) {
    if (!Number.isInteger(l?.n) || l.n < 1 || l.n > lines.length || got.has(l.n)) fail();
    got.set(l.n, {
      ko: lines[l.n - 1], zh: str(l.zh), en: str(l.en),
      grammar: arr(l.grammar).map((g) => {
        const appId = strOrNull(g?.appId);
        return { form: str(g.form), appId: appId && grammarIds.has(appId) ? appId : null, en: str(g.en), zh: str(g.zh), note: str(g.note) };
      }),
      words: arr(l.words).slice(0, 5).map((w) => ({ ko: str(w?.ko), base: str(w.base), hanja: strOrNull(w.hanja), zh: str(w.zh), en: str(w.en), pos: str(w.pos) })),
    });
  }
  if (got.size !== lines.length) fail();
  return { lines: lines.map((_, i) => got.get(i + 1)) };
}

// ---------- cost (US$) ----------
export function estimateCost(model, lyricsChars, lineCount, systemChars = 9000) {
  const p = SONG_MODELS[model] ?? SONG_MODELS[DEFAULT_MODEL];
  const input = Math.ceil(systemChars / 3) + Math.ceil(lyricsChars / 1.5);
  const output = 200 * lineCount + 2000;
  return (input * p.in + output * p.out) / 1e6;
}

export function actualCost(model, usage = {}) {
  const p = SONG_MODELS[model] ?? SONG_MODELS[DEFAULT_MODEL];
  const n = (k) => Number(usage[k]) || 0;
  return ((n("input_tokens") + 0.1 * n("cache_read_input_tokens") + 1.25 * n("cache_creation_input_tokens")) * p.in + n("output_tokens") * p.out) / 1e6;
}

// ---------- study cards ----------
// Returns the id to schedule and, when the app has no such card yet, a new custom item to add.
// Grammar: the app's own card (appId) or an earlier card with the same form. Word: any card for the
// same dictionary form. So tapping twice, or on something already in the deck, never duplicates.
// The id of a card the app already has for this grammar point or word, or null.
export function findStudyId({ kind, entry, items }) {
  if (kind === "grammar") {
    if (entry.appId && items.some((i) => i.id === entry.appId)) return entry.appId;
    return items.find((i) => i.form && normLine(i.form) === normLine(entry.form))?.id ?? null;
  }
  return items.find((i) => !i.form && i.ko && normLine(i.ko) === normLine(entry.base))?.id ?? null;
}

export function studyItem({ kind, entry, line, song, items, unit, id }) {
  const existing = findStudyId({ kind, entry, items });
  if (existing) return { id: existing, item: null };
  const tag = `♪ ${song.title}${song.artist ? ` – ${song.artist}` : ""}`;
  const item = kind === "grammar"
    ? { id, kind: "grammar", tier: unit.tier, unit: unit.unit, form: entry.form, en: entry.en, zh: entry.zh,
      note: entry.note ? `${entry.note} · ${tag}` : tag, ex: [{ ko: line.ko, zh: line.zh, en: line.en }] }
    : { id, kind: "vocab", tier: unit.tier, unit: unit.unit, ko: entry.base, hanja: entry.hanja || null, zh: entry.zh, en: entry.en,
      pos: entry.pos || "n", ex: line.ko, exZh: line.zh, exEn: line.en, note: tag, check: false };
  if (validateItem(item, kind === "word" ? "vocab" : "grammar").length) throw new Error("invalid item");
  return { id, item };
}

export const inReviews = (id, progress) => !!progress?.[id];

// Find a song: by title, artist, a Korean lyric line, a line's Chinese or English translation, or a grammar
// form the translation found. Case and spaces are ignored, so 볼때마다 finds "볼 때마다". Returns where it
// matched and the Korean line to show under the song (null for title and artist), or null for no match.
const squash = (s) => String(s ?? "").normalize("NFC").toLowerCase().replace(/\s+/g, "");
export function findInSong(song, q) {
  const k = squash(q);
  if (!k) return { field: null, line: null };
  if (squash(song.title).includes(k)) return { field: "title", line: null };
  if (squash(song.artist).includes(k)) return { field: "artist", line: null };
  const lyric = splitLyrics(song.lyrics ?? "").find((l) => l && squash(l).includes(k));
  if (lyric) return { field: "lyric", line: normLine(lyric) };
  const lines = song.analysis?.lines ?? [];
  const tr = lines.find((l) => squash(l.zh).includes(k) || squash(l.en).includes(k));
  if (tr) return { field: "translation", line: tr.ko };
  const gr = lines.find((l) => l.grammar.some((g) => squash(g.form).includes(k)));
  if (gr) return { field: "grammar", line: gr.ko };
  return null;
}

// The Songs list filter chips.
export function inFilter(song, f) {
  if (f === "done") return song.status === "done";
  if (f === "todo") return song.status !== "done" && song.status !== "error";
  if (f === "error") return song.status === "error";
  return true;
}

// Korean lines in a lyrics text (repeats counted once). Zero means there is nothing to translate.
export const koreanLineCount = (lyrics) => uniqueHangulLines(splitLyrics(lyrics ?? "")).length;

// The lyrics search can return an English version (or a song sung in English) first. Take the first result,
// in the search's own order, that has Korean lines; with none, say whether lyrics were missing or not Korean.
export function pickLyrics(hits) {
  const usable = hits.filter((h) => h.lyrics && !h.instrumental);
  if (!usable.length) return { hit: null, reason: "noLyrics" };
  const hit = usable.find((h) => koreanLineCount(h.lyrics) > 0);
  return hit ? { hit, reason: null } : { hit: null, reason: "noKorean" };
}

// Which songs a batch translates. Ticks live only while the app is open, so with nothing ticked (after
// reopening) the batch covers every song still to translate, minus those waiting for Korean lyrics (not found,
// or found only without Korean): they need lyrics picked or pasted first, and retrying would only fail again.
export const waitingForLyrics = (s) => (s.error === "noLyrics" || s.error === "noKorean") && !koreanLineCount(s.lyrics);
const translatable = (s) => s.status !== "done" && !waitingForLyrics(s);
export function batchSongs(songs, ticked) {
  const chosen = [...ticked].map((id) => songs.find((s) => s.id === id)).filter((s) => s && translatable(s));
  if (chosen.length) return { ticked: true, list: chosen };
  return { ticked: false, list: songs.filter(translatable) };
}

// ---------- song records (IndexedDB and backups) ----------
export const newSongId = () => `s${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

const STATUSES = ["queued", "lyrics", "done", "error"];
const s = (v) => (typeof v === "string" ? v : null);
const num = (v) => (Number.isFinite(v) ? v : 0);
const cleanG = (g) => ({ form: s(g?.form) ?? "", appId: s(g?.appId), en: s(g?.en) ?? "", zh: s(g?.zh) ?? "", note: s(g?.note) ?? "" });
const cleanW = (w) => ({ ko: s(w?.ko) ?? "", base: s(w?.base) ?? "", hanja: s(w?.hanja), zh: s(w?.zh) ?? "", en: s(w?.en) ?? "", pos: s(w?.pos) ?? "" });
const cleanLine = (l) => ({ ko: s(l?.ko) ?? "", zh: s(l?.zh) ?? "", en: s(l?.en) ?? "",
  grammar: Array.isArray(l?.grammar) ? l.grammar.map(cleanG) : [], words: Array.isArray(l?.words) ? l.words.map(cleanW) : [] });

// Backups are user files: keep only the known fields with the right types, so nothing else reaches the page.
export function cleanSong(raw) {
  if (!raw || typeof raw !== "object" || !s(raw.id) || !s(raw.title)) return null;
  const a = raw.analysis;
  const analysis = a && typeof a === "object" && Array.isArray(a.lines) ? {
    model: s(a.model) ?? DEFAULT_MODEL, at: num(a.at),
    usage: { in: num(a.usage?.in), out: num(a.usage?.out), cacheRead: num(a.usage?.cacheRead) },
    costUsd: num(a.costUsd), lines: a.lines.map(cleanLine),
  } : null;
  const lyrics = s(raw.lyrics);
  let status = STATUSES.includes(raw.status) ? raw.status : lyrics ? "lyrics" : "queued";
  if (status === "done" && !analysis) status = lyrics ? "lyrics" : "queued";
  return { id: raw.id, title: raw.title, artist: s(raw.artist) ?? "", album: s(raw.album), source: ["lrclib", "paste", "import"].includes(raw.source) ? raw.source : "paste",
    status, error: s(raw.error), lyrics, analysis, addedAt: num(raw.addedAt) };
}

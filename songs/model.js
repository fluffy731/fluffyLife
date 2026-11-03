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
export function studyItem({ kind, entry, line, song, items, unit, id }) {
  const tag = `♪ ${song.title}${song.artist ? ` – ${song.artist}` : ""}`;
  let item;
  if (kind === "grammar") {
    if (entry.appId && items.some((i) => i.id === entry.appId)) return { id: entry.appId, item: null };
    const same = items.find((i) => i.form && normLine(i.form) === normLine(entry.form));
    if (same) return { id: same.id, item: null };
    item = { id, kind: "grammar", tier: unit.tier, unit: unit.unit, form: entry.form, en: entry.en, zh: entry.zh,
      note: entry.note ? `${entry.note} · ${tag}` : tag, ex: [{ ko: line.ko, zh: line.zh, en: line.en }] };
  } else {
    const same = items.find((i) => !i.form && i.ko && normLine(i.ko) === normLine(entry.base));
    if (same) return { id: same.id, item: null };
    item = { id, kind: "vocab", tier: unit.tier, unit: unit.unit, ko: entry.base, hanja: entry.hanja || null, zh: entry.zh, en: entry.en,
      pos: entry.pos || "n", ex: line.ko, exZh: line.zh, exEn: line.en, note: tag, check: false };
  }
  if (validateItem(item, kind === "word" ? "vocab" : "grammar").length) throw new Error("invalid item");
  return { id, item };
}

export const inReviews = (id, progress) => !!progress?.[id];

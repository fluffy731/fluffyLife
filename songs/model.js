// Songs tab logic (Korean app): lyric lines, list import, the Claude request and reply, cost, study cards.
// Pure functions only, so all of it runs in Node tests. Lyrics never live in the repo: they come from
// LRCLIB or the user's paste and are stored on the phone (see songs/db.js).

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

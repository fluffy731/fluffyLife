// Films: what the phone keeps (localStorage "films.v1"): the chosen shelf and settings, the watchlist and Seen.
// Each entry is a snapshot of the film, so the watchlist still shows it after it leaves the weekly catalogue.
// Storage can be missing or refuse (private mode, cleared site data), so every read and write is guarded.

export const KEY = "films.v1";
const SETTINGS = { place: "all", era: "all", genre: "all", theme: "auto", hideSeen: false };
const store = () => { try { return globalThis.localStorage; } catch { return undefined; } };

export function load(storage = store()) {
  let raw = null;
  try { raw = JSON.parse(storage?.getItem(KEY) ?? "null"); } catch { raw = null; }
  const ok = raw && typeof raw === "object";
  return {
    settings: { ...SETTINGS, ...(ok && raw.settings && typeof raw.settings === "object" ? raw.settings : {}) },
    want: ok && raw.want && typeof raw.want === "object" ? raw.want : {},
    seen: ok && raw.seen && typeof raw.seen === "object" ? raw.seen : {},
  };
}

export function save(state, storage = store()) {
  try { storage?.setItem(KEY, JSON.stringify(state)); } catch { /* full or blocked: the page still works */ }
}

export const snapshot = (f, at) => ({ id: f.id, title: f.title, original: f.original, year: f.year, era: f.era, places: f.places,
  genres: f.genres, director: f.director, cast: f.cast, poster: f.poster, at });

export function toggleWant(state, film, at) {
  if (state.want[film.id]) { delete state.want[film.id]; return false; }
  state.want[film.id] = snapshot(film, at);
  return true;
}

// Seen takes a film off the watchlist.
export function toggleSeen(state, film, at) {
  if (state.seen[film.id]) { delete state.seen[film.id]; return false; }
  state.seen[film.id] = snapshot(film, at);
  delete state.want[film.id];
  return true;
}

export const backupText = (state) => JSON.stringify({ app: "films", version: 1, saved: new Date().toISOString(), want: state.want, seen: state.seen }, null, 1);

const NOT_OURS = "This file is not a Films backup.";
const entriesOk = (o) => o && typeof o === "object" && Object.values(o).every((e) => e && Number.isFinite(e.id));

// Merges a backup in by film id, keeping what's already here; anything else is refused before a change is made.
export function restore(state, text) {
  let b;
  try { b = JSON.parse(text); } catch { throw new Error(NOT_OURS); }
  if (!b || b.app !== "films" || !entriesOk(b.want ?? {}) || !entriesOk(b.seen ?? {})) throw new Error(NOT_OURS);
  let added = 0;
  for (const list of ["want", "seen"]) {
    for (const e of Object.values(b[list] || {})) if (!state[list][e.id]) { state[list][e.id] = e; added++; }
  }
  for (const id of Object.keys(state.seen)) delete state.want[id];
  return { added };
}

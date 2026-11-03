// Lyrics lookup on LRCLIB (https://lrclib.net), a free open lyrics database that allows browser calls.
// Called from the phone only; nothing it returns is ever stored in this repo.
import { splitLyrics } from "./model.js";

const API = "https://lrclib.net/api/search";

const toHit = (r) => ({
  title: String(r.trackName ?? ""), artist: String(r.artistName ?? ""),
  album: r.albumName ? String(r.albumName) : null,
  duration: Number.isFinite(r.duration) ? r.duration : null,
  lyrics: r.plainLyrics ? String(r.plainLyrics) : r.syncedLyrics ? splitLyrics(r.syncedLyrics).join("\n") : "",
  instrumental: !!r.instrumental,
});

async function get(params, fetchFn) {
  let res;
  try { res = await fetchFn(`${API}?${new URLSearchParams(params)}`); } catch { throw new Error("offline"); }
  if (!res.ok) throw new Error("lrclib");
  const body = await res.json();
  return Array.isArray(body) ? body.map(toHit) : [];
}

// Title + artist first; artist names often differ between YouTube Music and LRCLIB (존박 vs John Park),
// so with no hits it searches again by title alone.
export async function searchLrclib({ title = "", artist = "" }, fetchFn = (u) => fetch(u)) {
  title = title.trim(); artist = artist.trim();
  if (title && artist) {
    const hits = await get({ track_name: title, artist_name: artist }, fetchFn);
    if (hits.length) return hits;
  }
  return get({ q: title || artist }, fetchFn);
}

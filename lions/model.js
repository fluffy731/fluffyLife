// Lions Charity Ball run sheet: the logic that needs no DOM (times, the live "now" state, the share code),
// so `node --test test/lions.test.js` can check it.

export const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
export const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
export const pad = (n) => String(n).padStart(2, "0");

// "7pm", "7:30 pm", "6.45pm", "19:30", "1930" -> "HH:MM". "" stays "" (a row with no time takes the time above it).
// A bare 1-11 means pm: this is an evening schedule. Anything else returns null.
export function parseTime(raw) {
  const s = String(raw ?? "").trim().toLowerCase().replace(/\./g, ":").replace(/\s+/g, "");
  if (!s) return "";
  const m = s.match(/^(\d{1,2}):?(\d{2})?(am|pm|a|p)?$/);
  if (!m) return null;
  let h = +m[1];
  const mi = m[2] ? +m[2] : 0;
  if (mi > 59 || h > 24) return null;
  if (m[3]) {
    if (h < 1 || h > 12) return null;
    if (m[3][0] === "p" && h < 12) h += 12;
    if (m[3][0] === "a" && h === 12) h = 0;
  } else if (h >= 1 && h <= 11) h += 12;
  if (h > 23) return null;
  return pad(h) + ":" + pad(mi);
}
export const fmt12 = (t) => { if (!t) return ""; const [h, m] = t.split(":").map(Number); return `${h % 12 || 12}:${pad(m)} ${h >= 12 ? "pm" : "am"}`; };
export const toMin = (t) => { const [h, m] = t.split(":").map(Number); return h * 60 + m; };
export function longDate(d) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(d || "");
  if (!m) return "";
  const dt = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
  return `${DAYS[dt.getUTCDay()]} ${+m[3]} ${MONTHS[+m[2] - 1]} ${m[1]}`;
}

// A row with no time takes the time of the row above it.
export const effTimes = (rows) => { let last = ""; return rows.map((r) => { if (r.time) last = r.time; return r.time || last; }); };

// Where the evening is. `n` is the current { date: "YYYY-MM-DD", min: minutes since midnight } in Melbourne.
// phase: none (no valid date) | before | early (event day, before the first cue) | live | after.
export function nowState(rows, date, n) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date || "")) return { phase: "none" };
  const mins = effTimes(rows).map((t) => (t ? toMin(t) : null));
  if (n.date < date) return { phase: "before", n, mins, days: Math.round((Date.parse(date) - Date.parse(n.date)) / 864e5) };
  if (n.date > date) return { phase: "after", n, mins };
  let cur = -1, nxt = Infinity;
  for (const m of mins) {
    if (m == null) continue;
    if (m <= n.min && m > cur) cur = m;
    if (m > n.min && m < nxt) nxt = m;
  }
  return { phase: cur < 0 ? "early" : "live", n, mins, cur, nxt: nxt === Infinity ? null : nxt };
}

// ---------- state from outside (a pasted code, or localStorage) ----------
const str = (v) => (typeof v === "string" ? v : "");
const rid = (p) => p + Math.random().toString(36).slice(2, 8);
const objs = (a) => (Array.isArray(a) ? a.filter((x) => x && typeof x === "object") : []);

// Anything that comes from outside is rebuilt field by field, so a bad or hostile code can only ever give text.
export function normalise(o) {
  if (!o || typeof o !== "object" || !Array.isArray(o.rows) || !Array.isArray(o.lists) || !Array.isArray(o.fixes)) return null;
  const ev = o.event && typeof o.event === "object" ? o.event : {};
  return {
    event: { org: str(ev.org), title: str(ev.title), date: str(ev.date), venue: str(ev.venue) },
    rows: objs(o.rows).map((r) => ({ id: str(r.id) || rid("r"), time: /^([01]\d|2[0-3]):[0-5]\d$/.test(r.time) ? r.time : "", seg: str(r.seg), d: str(r.d), s: str(r.s), l: str(r.l), v: str(r.v) })),
    lists: objs(o.lists).map((l) => ({ id: str(l.id) || rid("l"), title: str(l.title), items: objs(l.items).map((i) => ({ id: str(i.id) || rid("i"), text: str(i.text), done: i.done === true })) })),
    fixes: objs(o.fixes).map((f) => ({ id: str(f.id) || rid("x"), kind: str(f.kind) || "Note", where: str(f.where), was: str(f.was), now: str(f.now) })),
    notes: str(o.notes),
  };
}

// The share code is the whole sheet as base64 text with a prefix, so it survives any chat app.
export const PREFIX = "LIONS1.";
const toB64 = (s) => { let bin = ""; new TextEncoder().encode(s).forEach((b) => { bin += String.fromCharCode(b); }); return btoa(bin); };
const fromB64 = (b) => new TextDecoder().decode(Uint8Array.from(atob(b), (c) => c.charCodeAt(0)));
// A full stop ends the code (base64 never contains one), so words around it in a chat message are ignored.
export const encode = (state) => PREFIX + toB64(JSON.stringify(state)) + ".";
export function decode(text) {
  const t = String(text ?? "");
  const i = t.indexOf(PREFIX);
  if (i < 0) return null;
  const rest = t.slice(i + PREFIX.length), end = rest.indexOf(".");
  if (end < 0) return null; // a copy that lost its end
  try { return normalise(JSON.parse(fromB64(rest.slice(0, end).replace(/[^A-Za-z0-9+/=]/g, "")))); } catch { return null; }
}

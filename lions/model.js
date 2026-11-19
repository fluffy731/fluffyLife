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

// ---------- the blanks in the script ----------
// {key} in a script line is a blank the MCs fill in. A key with no value shows as a TBC chip.
export const keysIn = (text) => [...new Set(Array.from(String(text ?? "").matchAll(/\{(\w+)\}/g), (m) => m[1]))];
export const fieldVal = (fields, k) => String(fields?.[k] ?? "").trim();
// "Thanks, {a} and {b}" with a filled -> [{ t: "text" }, { t: "val", k: "a", v }, { t: "text" }, { t: "tbc", k: "b" }]
export function parts(text, fields) {
  const out = [];
  let last = 0;
  for (const m of String(text ?? "").matchAll(/\{(\w+)\}/g)) {
    if (m.index > last) out.push({ t: "text", v: text.slice(last, m.index) });
    const v = fieldVal(fields, m[1]);
    out.push(v ? { t: "val", k: m[1], v } : { t: "tbc", k: m[1] });
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push({ t: "text", v: text.slice(last) });
  return out;
}
// A roster row is done when every required column has something in it.
export const rowDone = (cols, row) => cols.every(([c, , opt]) => opt || String(row?.[c] ?? "").trim());
export const rowAny = (cols, row) => cols.some(([c]) => String(row?.[c] ?? "").trim());
// What is still to fill: required fields with no value, and rosters with no finished row yet.
export function leftOf(state, meta) {
  const fields = meta.fields.filter((f) => !f[4] && !fieldVal(state.fields, f[0])).map((f) => f[0]);
  const rosters = meta.rosters.filter((r) => !(state.rosters?.[r.key] || []).some((row) => rowDone(r.cols, row))).map((r) => r.key);
  return { fields, rosters, total: fields.length + rosters.length };
}

// ---------- state from outside (a pasted code, or localStorage) ----------
const str = (v) => (typeof v === "string" ? v : "");
const rid = (p) => p + Math.random().toString(36).slice(2, 8);
const objs = (a) => (Array.isArray(a) ? a.filter((x) => x && typeof x === "object") : []);
const hm = (t) => (/^([01]\d|2[0-3]):[0-5]\d$/.test(t) ? t : "");
const slug = (k) => /^[A-Za-z]\w{0,39}$/.test(k);
const WHO = ["P", "S", "PS"], KINDS = ["line", "cue", "crit", "list"];
const num = (v) => (Number.isInteger(v) && v > 0 && v < 1000 ? v : null);

// Anything that comes from outside is rebuilt field by field, so a bad or hostile code can only ever give text.
// `base` is the shipped sheet: a saved copy from before the script existed gets the script from it.
export function normalise(o, base) {
  if (!o || typeof o !== "object" || !Array.isArray(o.rows) || !Array.isArray(o.lists) || !Array.isArray(o.fixes)) return null;
  const ev = o.event && typeof o.event === "object" ? o.event : {};
  const fields = {};
  if (o.fields && typeof o.fields === "object" && !Array.isArray(o.fields)) for (const [k, v] of Object.entries(o.fields)) if (slug(k) && typeof v === "string") fields[k] = v;
  const rosters = {};
  if (o.rosters && typeof o.rosters === "object" && !Array.isArray(o.rosters)) {
    for (const [k, rows] of Object.entries(o.rosters)) {
      if (!slug(k) || !Array.isArray(rows)) continue;
      rosters[k] = objs(rows).slice(0, 60).map((r) => Object.fromEntries(Object.entries(r).filter(([c, v]) => slug(c) && typeof v === "string")));
    }
  }
  const script = Array.isArray(o.script)
    ? objs(o.script).map((g) => ({
        id: str(g.id) || rid("g"), time: hm(g.time), seg: str(g.seg), zh: str(g.zh), at: str(g.at), key: g.key === true,
        items: objs(g.items).map((i) => ({
          id: str(i.id) || rid("t"), k: KINDS.includes(i.k) ? i.k : "cue", who: WHO.includes(i.who) ? i.who : "P", text: str(i.text),
          tpl: i.tpl === true, when: slug(str(i.when)) ? str(i.when) : "", list: slug(str(i.list)) ? str(i.list) : "", frm: num(i.frm), to: num(i.to),
        })),
      }))
    : null;
  const out = {
    event: { org: str(ev.org), title: str(ev.title), date: str(ev.date), venue: str(ev.venue) },
    rows: objs(o.rows).map((r) => ({ id: str(r.id) || rid("r"), time: hm(r.time), seg: str(r.seg), d: str(r.d), s: str(r.s), l: str(r.l), v: str(r.v) })),
    lists: objs(o.lists).map((l) => ({ id: str(l.id) || rid("l"), title: str(l.title), items: objs(l.items).map((i) => ({ id: str(i.id) || rid("i"), text: str(i.text), done: i.done === true })) })),
    fixes: objs(o.fixes).map((f) => ({ id: str(f.id) || rid("x"), kind: str(f.kind) || "Note", where: str(f.where), was: str(f.was), now: str(f.now) })),
    script: script || (base ? structuredClone(base.script) : []),
    fields: o.fields ? fields : (base ? { ...base.fields } : {}),
    rosters: o.rosters ? rosters : (base ? structuredClone(base.rosters) : {}),
    notes: str(o.notes),
  };
  return out;
}

// The share code is the whole sheet as base64 text with a prefix, so it survives any chat app.
export const PREFIX = "LIONS1.";
const toB64 = (s) => { let bin = ""; new TextEncoder().encode(s).forEach((b) => { bin += String.fromCharCode(b); }); return btoa(bin); };
const fromB64 = (b) => new TextDecoder().decode(Uint8Array.from(atob(b), (c) => c.charCodeAt(0)));
// A full stop ends the code (base64 never contains one), so words around it in a chat message are ignored.
export const encode = (state) => PREFIX + toB64(JSON.stringify(state)) + ".";
export function decode(text, base) {
  const t = String(text ?? "");
  const i = t.indexOf(PREFIX);
  if (i < 0) return null;
  const rest = t.slice(i + PREFIX.length), end = rest.indexOf(".");
  if (end < 0) return null; // a copy that lost its end
  try { return normalise(JSON.parse(fromB64(rest.slice(0, end).replace(/[^A-Za-z0-9+/=]/g, ""))), base); } catch { return null; }
}

// Pure helpers for the trip planner (tested in test/plan.test.js).
// Dates are "YYYY-MM-DD" calendar days and times "HH:MM", so nothing shifts when the phone changes time zone.
import { TRIPS } from "./items.js";

export const KEY = "travel.plan.v1";
export const MAX_DAYS = 90;
export const LONG_NIGHTS = 7; // this many nights or more packs as a Long trip

export const KINDS = [
  { id: "do", icon: "📍", label: "Do" },
  { id: "eat", icon: "🍜", label: "Eat" },
  { id: "move", icon: "🚆", label: "Transport" },
  { id: "fly", icon: "✈️", label: "Flight" },
  { id: "stay", icon: "🏨", label: "Stay" },
];
export const kindOf = (id) => KINDS.find((k) => k.id === id) || KINDS[0];

const DAY = 864e5;
const WD = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const pad = (n) => String(n).padStart(2, "0");
const ms = (d) => Date.UTC(+d.slice(0, 4), +d.slice(5, 7) - 1, +d.slice(8, 10));
const iso = (t) => new Date(t).toISOString().slice(0, 10);
const str = (v) => (typeof v === "string" ? v.trim() : "");

export const isDate = (d) => typeof d === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d) && iso(ms(d)) === d;
export const isTime = (t) => typeof t === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(t);
export const addDays = (d, n) => iso(ms(d) + n * DAY);
export const daysBetween = (a, b) => Math.round((ms(b) - ms(a)) / DAY);
export const todayISO = (now = new Date()) => `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
export const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

export const blank = () => ({ trips: [] });

// End before start becomes a one-day trip; anything past MAX_DAYS is cut, so a typo'd year can't make thousands of days.
export function fixRange(start, end) {
  if (!isDate(end) || end < start) end = start;
  return { start, end: daysBetween(start, end) >= MAX_DAYS ? addDays(start, MAX_DAYS - 1) : end };
}

function cleanItem(i) {
  if (!i || typeof i !== "object" || typeof i.id !== "string" || !str(i.title)) return null;
  return { id: i.id, day: isDate(i.day) ? i.day : "", time: isTime(i.time) ? i.time : "", kind: kindOf(i.kind).id,
    title: str(i.title), place: str(i.place), note: str(i.note) };
}

function cleanTrip(t) {
  if (!t || typeof t !== "object" || typeof t.id !== "string" || !isDate(t.start)) return null;
  return { id: t.id, name: str(t.name) || "Trip", ...fixRange(t.start, t.end), type: TRIPS.some((x) => x.id === t.type) ? t.type : TRIPS[0].id,
    items: (Array.isArray(t.items) ? t.items : []).map(cleanItem).filter(Boolean) };
}

const cleanTrips = (list) => (Array.isArray(list) ? list.map(cleanTrip).filter(Boolean) : []);

export function load(ls) {
  try { return { trips: cleanTrips(JSON.parse(ls.getItem(KEY) || "{}").trips) }; } catch { return blank(); }
}

export function save(ls, s) {
  try { ls.setItem(KEY, JSON.stringify(s)); } catch { /* private mode or storage full: the plan just won't persist */ }
}

export const tripDays = (t) => Array.from({ length: daysBetween(t.start, t.end) + 1 }, (_, i) => addDays(t.start, i));
export const nights = (t) => daysBetween(t.start, t.end);

// New dates for a trip. If both ends moved by the same amount the whole trip moved (a flight changed), so every
// entry moves with it and keeps its Day number. Otherwise entries stay on their dates; any now outside the trip
// show under "Not on a trip day" rather than disappearing.
export function reschedule(t, start, end) {
  const r = fixRange(start, end);
  const shift = daysBetween(t.start, r.start);
  const moved = shift !== 0 && daysBetween(t.end, r.end) === shift;
  return { ...t, ...r, items: moved ? t.items.map((i) => (i.day ? { ...i, day: addDays(i.day, shift) } : i)) : t.items };
}

// Untimed entries (a hotel, a free afternoon) sit at the top of their day, like all-day events in a calendar.
const byTime = (a, b) => (a.time > b.time) - (a.time < b.time);

export function itinerary(t) {
  const days = new Map(tripDays(t).map((d) => [d, []]));
  const loose = [];
  for (const i of t.items) (days.get(i.day) || loose).push(i);
  const out = [...days].map(([date, items], k) => ({ date, n: k + 1, items: items.sort(byTime) }));
  if (loose.length) out.push({ date: "", n: 0, items: loose.sort((a, b) => (a.day > b.day) - (a.day < b.day) || byTime(a, b)) });
  return out;
}

export const dayLabel = (d) => { const t = new Date(ms(d)); return `${WD[t.getUTCDay()]} ${t.getUTCDate()} ${MON[t.getUTCMonth()]}`; };

// "5–12 Nov 2026", "28 Nov – 3 Dec 2026", "28 Dec 2026 – 4 Jan 2027", "5 Nov 2026".
export function rangeLabel({ start, end }) {
  const [a, b] = [new Date(ms(start)), new Date(ms(end))];
  const dm = (t) => `${t.getUTCDate()} ${MON[t.getUTCMonth()]}`;
  if (start === end) return `${dm(a)} ${a.getUTCFullYear()}`;
  if (a.getUTCFullYear() !== b.getUTCFullYear()) return `${dm(a)} ${a.getUTCFullYear()} – ${dm(b)} ${b.getUTCFullYear()}`;
  if (a.getUTCMonth() !== b.getUTCMonth()) return `${dm(a)} – ${dm(b)} ${b.getUTCFullYear()}`;
  return `${a.getUTCDate()}–${dm(b)} ${b.getUTCFullYear()}`;
}

export function status(t, today) {
  if (today < t.start) { const n = daysBetween(today, t.start); return { when: "soon", text: n === 1 ? "Tomorrow" : `In ${n} days` }; }
  if (today > t.end) return { when: "past", text: "Done" };
  return { when: "now", text: `Day ${daysBetween(t.start, today) + 1} of ${nights(t) + 1}` };
}

// Trips under way or coming up first (soonest first), then past trips (most recent first).
export function sortTrips(trips, today) {
  const past = (t) => t.end < today;
  return [...trips].sort((a, b) => past(a) - past(b) || (past(a) ? (b.end > a.end) - (b.end < a.end) : (a.start > b.start) - (a.start < b.start)));
}

// The trip under way today, so the app can open straight onto it.
export const current = (trips, today) => trips.find((t) => t.start <= today && today <= t.end) || null;

export const packingFor = (t) => ({ trip: t.type, mode: nights(t) >= LONG_NIGHTS ? "long" : "short" });

// Plain-text itinerary for messaging to whoever you're travelling with.
export function toText(t) {
  const n = nights(t);
  const lines = [t.name, `${rangeLabel(t)}${n ? ` · ${n} night${n === 1 ? "" : "s"}` : ""}`];
  for (const d of itinerary(t)) {
    lines.push("", d.date ? `Day ${d.n} · ${dayLabel(d.date)}${d.items.length ? "" : " · free"}` : "Not on a trip day");
    for (const i of d.items) {
      const when = [d.date ? "" : i.day && dayLabel(i.day), i.time].filter(Boolean).join(" ");
      lines.push(`${kindOf(i.kind).icon} ${when ? `${when} ` : ""}${i.title}${i.place ? ` · ${i.place}` : ""}`);
      if (i.note) lines.push(...i.note.split("\n").map((l) => `   ${l}`));
    }
  }
  return lines.join("\n");
}

export const exportJSON = (s) => JSON.stringify({ app: "travel-plan", version: 1, trips: s.trips }, null, 1);

// A backup adds its trips; a trip already here with the same id is replaced by the backup's copy.
export function importJSON(text, s) {
  let data;
  try { data = JSON.parse(text); } catch { throw new Error("That file isn't a trip plan backup."); }
  if (!data || !Array.isArray(data.trips)) throw new Error("That file isn't a trip plan backup.");
  const incoming = cleanTrips(data.trips);
  const ids = new Set(incoming.map((t) => t.id));
  const replaced = s.trips.filter((t) => ids.has(t.id)).length;
  return { trips: [...s.trips.filter((t) => !ids.has(t.id)), ...incoming], added: incoming.length - replaced, replaced };
}

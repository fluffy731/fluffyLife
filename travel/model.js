// Pure state helpers for the packing list (tested in test/travel.test.js).
export const KEY = "travel.v1";
export const MINE = "My items";

export const blank = () => ({ trip: "overseas", mode: "short", ticked: {}, mine: [], hideDone: false });

export function load(ls) {
  try {
    const s = JSON.parse(ls.getItem(KEY) || "{}");
    return { ...blank(), ...s, ticked: { ...(s.ticked || {}) }, mine: Array.isArray(s.mine) ? s.mine.filter((t) => typeof t === "string") : [] };
  } catch { return blank(); }
}

export function save(ls, s) {
  try { ls.setItem(KEY, JSON.stringify(s)); } catch { /* private mode or storage full: ticks just won't persist */ }
}

// An item is "text" (every trip type) or ["text", "trip ids"] (only those trip types).
export const itemText = (it) => (Array.isArray(it) ? it[0] : it);
const onTrip = (it, trip) => !Array.isArray(it) || it[1].split(/\s+/).includes(trip);

// Sections as shown for a trip type and mode. Ticks key on wording; your own items are prefixed so they never clash with the list.
export function visible(sections, mode, mine, trip = "overseas") {
  const pick = (list, long) => list.filter((it) => onTrip(it, trip)).map((it) => ({ key: itemText(it), text: itemText(it), long }));
  const out = sections.filter((s) => !s.trips || s.trips.includes(trip)).map((s) => ({
    title: s.title, icon: s.icon,
    items: [...pick(s.always, false), ...(mode === "long" ? pick(s.long, true) : [])],
  }));
  out.push({ title: MINE, icon: "⭐", mine: true, items: mine.map((text) => ({ key: `mine:${text}`, text, long: false })) });
  return out;
}

export function progress(shown, ticked) {
  let done = 0, total = 0;
  for (const s of shown) for (const it of s.items) { total++; if (ticked[it.key]) done++; }
  return { done, total };
}

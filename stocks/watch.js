// The watchlist, kept on the phone: which stocks are starred, from when and at what price, and the rating
// each had when last looked at. Pure functions over plain objects; the page stores them in localStorage.

// Star or unstar a stock. Starring records today's date and the price as quoted.
export function toggle(watch, s, today) {
  const next = { ...watch };
  if (next[s.t]) delete next[s.t];
  else next[s.t] = { since: today, price: s.price };
  return next;
}

// How the price has moved since the stock was starred.
export function sinceWatching(entry, s) {
  return entry && Number.isFinite(entry.price) && entry.price > 0 && Number.isFinite(s.price) ? { change: s.price / entry.price - 1, since: entry.since } : null;
}

// Starred stocks whose rating differs from the one seen last time, as { t: { from, to } }.
export function ratingChanges(watch, seen, stocks) {
  const out = {};
  for (const s of stocks) if (watch[s.t] && seen[s.t] && seen[s.t] !== s.rating) out[s.t] = { from: seen[s.t], to: s.rating };
  return out;
}

// Remember the starred stocks' current ratings, so the next visit can say what changed.
export function markSeen(seen, watch, stocks) {
  const next = { ...seen };
  for (const s of stocks) if (watch[s.t]) next[s.t] = s.rating;
  return next;
}

// A backup file of the watchlist, for keeping it safe or moving it to another phone.
export const backupText = (watch) => JSON.stringify({ app: "stocks-watchlist", version: 1, saved: new Date().toISOString(), watch }, null, 1);

// The watchlist in a backup file, checked entry by entry; anything else is refused with a reason.
export function readBackup(text) {
  const notOurs = new Error("This file is not a Stocks watchlist backup.");
  let j;
  try { j = JSON.parse(text); } catch { throw notOurs; }
  if (j?.app !== "stocks-watchlist" || !j.watch || typeof j.watch !== "object") throw notOurs;
  const out = {};
  for (const [t, e] of Object.entries(j.watch)) {
    if (!/^[A-Z0-9^][A-Z0-9.^-]{0,11}$/.test(t)) throw new Error(`"${t}" is not a stock symbol.`);
    if (!e || !/^\d{4}-\d{2}-\d{2}$/.test(e.since) || !Number.isFinite(e.price) || e.price <= 0) throw new Error(`The entry for ${t} is damaged.`);
    out[t] = { since: e.since, price: e.price };
  }
  return out;
}

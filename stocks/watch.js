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

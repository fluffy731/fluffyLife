// Deterministic "word of the hour" from the local clock.
const pad = (n) => String(n).padStart(2, "0");

export function hourKey(d = new Date()) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}`;
}

// FNV-1a 32-bit
export function hash(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

export function wordOfHour(items, d = new Date()) {
  if (!items.length) return null;
  return items[hash(hourKey(d)) % items.length];
}

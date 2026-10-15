// Pre-generated speech clips. A clip's file name is a hash of voice + text, so the generator (CI)
// and the app agree on names without a lookup table. FNV-1a 64-bit over the UTF-8 bytes.
const enc = new TextEncoder();
const MASK = (1n << 64n) - 1n;

export function clipName(voice, text) {
  let h = 0xcbf29ce484222325n;
  for (const b of enc.encode(`${voice}|${text}`)) { h ^= BigInt(b); h = (h * 0x100000001b3n) & MASK; }
  return h.toString(16).padStart(16, "0");
}

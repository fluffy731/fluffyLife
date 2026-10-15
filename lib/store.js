// localStorage persistence with export/import.
import { validateItem } from "./validate.js";
export const KEY = "korean.v1";
const defaults = () => ({ progress: {}, custom: [], settings: {} });

export function load(ls, { key = KEY, validate = validateItem } = {}) {
  try {
    const raw = ls.getItem(key);
    const obj = raw ? JSON.parse(raw) : null;
    return normalise(obj, validate);
  } catch {
    return defaults();
  }
}

const plain = (o) => o != null && typeof o === "object" && !Array.isArray(o);

function normalise(obj, validate = validateItem) {
  if (!plain(obj)) return defaults();
  const d = defaults();
  const custom = Array.isArray(obj.custom)
    ? obj.custom.filter((c) => plain(c) && (c.kind === "grammar" || c.kind === "vocab") && validate(c, c.kind).length === 0)
    : d.custom;
  return {
    progress: plain(obj.progress) ? obj.progress : d.progress,
    custom,
    settings: plain(obj.settings) ? obj.settings : d.settings,
  };
}

export function save(ls, state, key = KEY) {
  try { ls.setItem(key, JSON.stringify(state)); return true; } catch { return false; }
}

export function exportJSON(state) {
  return JSON.stringify(state, null, 2);
}

export function importJSON(str, validate = validateItem) {
  let obj;
  try { obj = JSON.parse(str); } catch { throw new Error("Invalid backup"); }
  if (!plain(obj) || !plain(obj.progress)) throw new Error("Invalid backup");
  return normalise(obj, validate);
}

// Renames legacy progress keys (e.g. positional ids) without overwriting an entry already stored under the new key.
export function migrateProgress(progress, map) {
  const out = {};
  for (const [k, v] of Object.entries(progress)) if (!(k in map)) out[k] = v;
  for (const [k, v] of Object.entries(progress)) if (k in map && !(map[k] in out)) out[map[k]] = v;
  return out;
}

// localStorage persistence with export/import.
import { validateItem } from "./validate.js";
export const KEY = "korean.v1";
const defaults = () => ({ progress: {}, custom: [], settings: {} });

export function load(ls) {
  try {
    const raw = ls.getItem(KEY);
    const obj = raw ? JSON.parse(raw) : null;
    return normalise(obj);
  } catch {
    return defaults();
  }
}

const plain = (o) => o != null && typeof o === "object" && !Array.isArray(o);

function normalise(obj) {
  if (!plain(obj)) return defaults();
  const d = defaults();
  const custom = Array.isArray(obj.custom)
    ? obj.custom.filter((c) => plain(c) && (c.kind === "grammar" || c.kind === "vocab") && validateItem(c, c.kind).length === 0)
    : d.custom;
  return {
    progress: plain(obj.progress) ? obj.progress : d.progress,
    custom,
    settings: plain(obj.settings) ? obj.settings : d.settings,
  };
}

export function save(ls, state) {
  try { ls.setItem(KEY, JSON.stringify(state)); return true; } catch { return false; }
}

export function exportJSON(state) {
  return JSON.stringify(state, null, 2);
}

export function importJSON(str) {
  let obj;
  try { obj = JSON.parse(str); } catch { throw new Error("Invalid backup"); }
  if (!plain(obj) || !plain(obj.progress)) throw new Error("Invalid backup");
  return normalise(obj);
}

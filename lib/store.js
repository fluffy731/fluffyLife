// localStorage persistence with export/import.
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

function normalise(obj) {
  if (!obj || typeof obj !== "object") return defaults();
  const d = defaults();
  return {
    progress: obj.progress && typeof obj.progress === "object" ? obj.progress : d.progress,
    custom: Array.isArray(obj.custom) ? obj.custom : d.custom,
    settings: obj.settings && typeof obj.settings === "object" ? obj.settings : d.settings,
  };
}

export function save(ls, state) {
  ls.setItem(KEY, JSON.stringify(state));
}

export function exportJSON(state) {
  return JSON.stringify(state, null, 2);
}

export function importJSON(str) {
  let obj;
  try { obj = JSON.parse(str); } catch { throw new Error("Invalid backup"); }
  if (!obj || typeof obj !== "object" || !obj.progress || typeof obj.progress !== "object") {
    throw new Error("Invalid backup");
  }
  return normalise(obj);
}

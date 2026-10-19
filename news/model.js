// News app logic (no DOM): tabs, lean coverage, times, Korean word lookup in the Korean dictionary.
export const LEANS = ["L", "LL", "C", "LR", "R"];
export const LEAN_LABEL = { L: "Left", LL: "Lean left", C: "Centre", LR: "Lean right", R: "Right", T: "Trade press" };
export const TABS = [
  ["top", "Top"], ["au", "Australia"], ["world", "World"], ["asia", "Asia"], ["ko", "한국어"],
  ["construction", "Construction"], ["engineering", "Engineering"], ["property", "Property"], ["regulation", "Regulation"],
];
const TOPIC_TABS = new Set(["construction", "engineering", "property", "regulation"]);

export function storiesFor(tab, stories, byId) {
  if (tab === "ko") return stories.filter((s) => s.lang === "ko");
  const en = stories.filter((s) => s.lang === "en");
  if (TOPIC_TABS.has(tab)) return en.filter((s) => s.topics.includes(tab));
  if (tab === "top") return en.filter((s) => s.items.some((i) => byId[i.s]?.region !== "topic"));
  const fromRegion = (s, r) => s.items.some((i) => byId[i.s]?.region === r);
  if (!en.some((s) => s.geo)) return en.filter((s) => fromRegion(s, tab)); // feed built before place tags
  // Australia: Victorian stories first, then the rest of Australia, then Australian outlets' other
  // local stories (no place named, no overseas outlet covering it). World news from Australian
  // outlets stays in Top and World.
  if (tab === "au") {
    const rank = (s) => (s.geo.includes("vic") ? 0 : s.geo.includes("au") ? 1 : s.items.every((i) => byId[i.s]?.region === "au") ? 2 : 3);
    return en.filter((s) => fromRegion(s, "au")).map((s, k) => [rank(s), k, s]).filter(([r]) => r < 3).sort((a, b) => a[0] - b[0] || a[1] - b[1]).map(([, , s]) => s);
  }
  // Asia: stories about Asia, from any outlet.
  if (tab === "asia") return en.filter((s) => s.geo.includes("asia"));
  return en.filter((s) => fromRegion(s, tab));
}

// How many distinct outlets of each lean covered the story (trade press counted separately).
export function leanCounts(story, byId) {
  const seen = new Set(), c = { L: 0, LL: 0, C: 0, LR: 0, R: 0, T: 0 };
  for (const i of story.items) { if (seen.has(i.s) || !byId[i.s]) continue; seen.add(i.s); c[byId[i.s].lean]++; }
  return c;
}

// "Mostly left-leaning coverage" when ≥ 3 political outlets and ≥ 75% on one side.
export function skew(c) {
  const left = c.L + c.LL, right = c.R + c.LR, total = left + right + c.C;
  if (total < 3) return null;
  if (left / total >= 0.75) return "left";
  if (right / total >= 0.75) return "right";
  return null;
}

// The headline to show: a centre outlet's if there is one, else the first.
export function headline(story, byId) {
  return (story.items.find((i) => byId[i.s]?.lean === "C") || story.items[0]).t;
}

export function ago(ms, now = Date.now()) {
  const m = Math.max(0, Math.round((now - ms) / 60000));
  if (m < 60) return `${m}m`;
  const h = Math.round(m / 60);
  return h < 24 ? `${h}h` : `${Math.round(h / 24)}d`;
}

// Korean headline word → dictionary row: strips particles and common endings, then exact match.
const PARTICLE = /(에서는|에서도|으로는|에게서|까지는|에서|으로|에게|까지|부터|이나|이며|이고|에는|에도|와의|과의|만의|들의|들이|들은|들을|은|는|이|가|을|를|의|에|로|와|과|도|만|들)$/;
const ENDINGS = [[/했다$|한다$|하는$|하며$|하고$|해야$|했던$|할$|한$|해$/, "하다"], [/됐다$|된다$|되는$|되며$|되고$|될$|된$/, "되다"], [/였다$|이다$/, ""]];
export function koCandidates(word) {
  const w = word.replace(/[^가-힣]/g, "");
  if (w.length < 1) return [];
  const out = [w];
  const p = w.replace(PARTICLE, ""); if (p && p !== w) out.push(p);
  for (const [re, add] of ENDINGS) if (re.test(w)) { const base = w.replace(re, ""); if (base) { out.push(base + add); if (add) out.push(base); } }
  return [...new Set(out)].filter((x) => x.length >= 1);
}
export function koLookup(word, rows) {
  if (!rows?.length) return null;
  for (const c of koCandidates(word)) {
    let lo = 0, hi = rows.length - 1; // rows are sorted by word (code point order)
    while (lo <= hi) { const mid = (lo + hi) >> 1, k = rows[mid][0]; if (k === c) return rows[mid]; if (k < c) lo = mid + 1; else hi = mid - 1; }
  }
  return null;
}

// Cantonese dictionary for the Cantonese app (rows: [characters, jyutping, english, korean-via-hanja]).
// Search by characters, Korean meaning, Jyutping (tones and spaces optional) or English.
import { sylHTML } from "../cards/yue.js";

const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const HANGUL = /[ㄱ-ㆎ가-힣]/u, HAN = /\p{Script=Han}/u;
const bare = (jp) => jp.toLowerCase().replace(/[^a-z]/g, "");

export function searchYue(rows, query, limit = 40) {
  const q = query.trim();
  if (!q || !rows?.length) return [];
  const out = [], seen = new Set();
  const add = (r) => { if (out.length < limit && !seen.has(r)) { seen.add(r); out.push(r); } };
  if (HAN.test(q)) {
    for (const r of rows) if (r[0] === q) add(r);
    for (const r of rows) if (r[0].startsWith(q)) add(r);
    for (const r of rows) if (r[0].includes(q)) add(r);
  } else if (HANGUL.test(q)) {
    for (const r of rows) if (r[3].split(" · ").includes(q)) add(r);
    for (const r of rows) if (r[3].includes(q)) add(r);
  } else {
    const b = bare(q);
    if (b) for (const r of rows) if (bare(r[1]) === b) add(r);
    if (b) for (const r of rows) if (bare(r[1]).startsWith(b)) add(r);
    const re = new RegExp(`\\b${q.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
    rows.filter((r) => re.test(r[2])).sort((a, b2) => a[2].length - b2[2].length).forEach(add);
  }
  return out;
}

export const dictYue = {
  url: "../dict/yue.json",
  search: searchYue,
  itemKey: (i) => i.zh,
  rowKey: (r) => r[0],
  sayText: (r) => r[0],
  canAdd: () => true,
  rowHTML: (r) => `<div class="row"><div><b class="hg">${sylHTML(r[1], esc)}</b> <span class="hj" lang="zh-Hant">${esc(r[0])}</span></div></div>
      <div class="meta">${r[3] ? `<b>${esc(r[3])}</b> · ` : ""}<span lang="en">${esc(r[2])}</span></div>`,
  moreHTML: (r) => `<div class="small muted">${esc(r[1])}</div>`,
  toItem: (r) => ({ zh: r[0], jp: r[1], ko: r[3] || r[2], en: r[2], pos: "dict", exZh: "", exJp: "", exKo: "" }),
};

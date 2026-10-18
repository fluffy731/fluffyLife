// English→Korean dictionary for the English app (rows: [word, ipa, pos, korean, english definition]).
// Search by English (exact, then prefix) or by Korean meaning.
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const HANGUL = /[ㄱ-ㆎ가-힣]/u;
const POS = { n: "n", v: "v", adj: "adj", adv: "adv" };

export function searchEn(rows, query, limit = 40) {
  const q = query.trim().toLowerCase();
  if (!q || !rows?.length) return [];
  const out = [], seen = new Set();
  const add = (r) => { if (out.length < limit && !seen.has(r)) { seen.add(r); out.push(r); } };
  if (HANGUL.test(q)) {
    for (const r of rows) if (r[3].split(" · ").some((k) => k.split(" ")[0] === q)) add(r);
    for (const r of rows) if (r[3].includes(q)) add(r);
  } else {
    for (const r of rows) if (r[0].toLowerCase() === q) add(r);
    for (const r of rows) if (r[0].toLowerCase().startsWith(q)) add(r);
  }
  return out;
}

export const dictEn = {
  url: "../dict/en.json",
  search: searchEn,
  itemKey: (i) => i.en && i.en.toLowerCase(),
  rowKey: (r) => r[0].toLowerCase(),
  sayText: (r) => r[0],
  canAdd: () => true,
  rowHTML: (r) => `<div class="row"><div><b>${esc(r[0])}</b>${r[1] ? ` <span class="ipa">/${esc(r[1])}/</span>` : ""}</div><span class="meta"><span class="pill">${esc(r[2])}</span></span></div>
      <div class="meta">${esc(r[3])}</div>`,
  moreHTML: (r) => (r[4] ? `<div class="small muted" lang="en">${esc(r[4])}</div>` : ""),
  toItem: (r) => ({ en: r[0], ipa: r[1], ko: r[3], pos: POS[r[2]] || "n", ex: "", exKo: "" }),
};

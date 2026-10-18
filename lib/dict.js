// Offline dictionary search (rows from dict/ko.json: [word, hanja, pos, pron, glosses, exKo, exEn]).
// Hangul: exact, then prefix, then contains. Han characters: entries whose hanja contains them.
// Latin: English glosses containing the word as a whole word, shortest gloss first.
const HANGUL = /[ㄱ-ㆎ가-힣]/u, HAN = /\p{Script=Han}/u;

export function searchDict(rows, query, limit = 40) {
  const q = query.trim().toLowerCase();
  if (!q || !rows?.length) return [];
  const out = [], seen = new Set();
  const add = (r) => { if (out.length < limit && !seen.has(r)) { seen.add(r); out.push(r); } };
  if (HANGUL.test(q)) {
    for (const r of rows) if (r[0] === q) add(r);
    for (const r of rows) if (r[0].startsWith(q)) add(r);
    if (q.length >= 2) for (const r of rows) if (r[0].includes(q)) add(r);
  } else if (HAN.test(q)) {
    for (const r of rows) if (r[1] === q) add(r);
    for (const r of rows) if (r[1].includes(q)) add(r);
  } else {
    const re = new RegExp(`\\b${q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
    rows.filter((r) => re.test(r[4])).sort((a, b) => a[4].length - b[4].length).forEach(add);
  }
  return out;
}

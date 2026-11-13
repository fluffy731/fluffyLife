// Offline dictionary search (rows from dict/ko.json: [word, hanja, pos, pron, glosses, exKo, exEn], sorted by word).
// Hangul: exact, then prefix, then contains. Han characters: entries whose hanja contains them.
// Latin: English glosses containing the word as a whole word, shortest gloss first.
const HANGUL = /[ㄱ-ㆎ가-힣]/u, HAN = /\p{Script=Han}/u;

export function searchDict(rows, query, limit = 40) {
  const q = query.trim().toLowerCase();
  if (!q || !rows?.length) return [];
  const out = [], seen = new Set();
  const add = (r) => { if (out.length < limit && !seen.has(r)) { seen.add(r); out.push(r); } };
  if (HANGUL.test(q)) {
    // Rows are sorted by word (code point), so the word and every word starting with it sit together,
    // the word itself first. Contains-matches only fill what is left of the limit.
    let lo = 0, hi = rows.length;
    while (lo < hi) { const mid = (lo + hi) >> 1; if (rows[mid][0] < q) lo = mid + 1; else hi = mid; }
    for (let i = lo; i < rows.length && out.length < limit && rows[i][0].startsWith(q); i++) add(rows[i]);
    if (q.length >= 2) for (const r of rows) { if (out.length >= limit) break; if (r[0].includes(q)) add(r); }
  } else if (HAN.test(q)) {
    for (const r of rows) if (r[1] === q) add(r);
    for (const r of rows) if (r[1].includes(q)) add(r);
  } else {
    const re = new RegExp(`\\b${q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
    rows.filter((r) => re.test(r[4])).sort((a, b) => a[4].length - b[4].length).forEach(add);
  }
  return out;
}

// Words from 표준국어대사전 carry a Korean definition instead of English glosses: "ko" or "en".
const count = (s, re) => (s.match(re) || []).length;
export const glossLang = (r) => (count(r[4], /[가-힣]/g) > count(r[4], /[A-Za-z]/g) ? "ko" : "en");

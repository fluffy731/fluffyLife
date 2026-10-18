// Korean dictionary plugged into the Korean app's Browse (rows: [word, hanja, pos, pron, glosses, exKo, exEn]).
import { searchDict } from "../lib/dict.js";

const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const POS = { n: "n", v: "v", adj: "adj", adv: "adv" };
const hanjaOf = (r) => (r[1] && r[1] !== r[0] ? r[1] : null);

export const dictKo = {
  url: "../dict/ko.json",
  search: (rows, q) => searchDict(rows, q),
  itemKey: (i) => i.ko,
  rowKey: (r) => r[0],
  sayText: (r) => r[0],
  canAdd: (r) => r[2] !== "字",
  rowHTML: (r) => `<div class="row"><div><b>${esc(r[0])}</b>${hanjaOf(r) ? `<span class="hj" lang="zh-Hant">${esc(r[1])}</span>` : ""}${r[3] ? ` <span class="rr">[${esc(r[3])}]</span>` : ""}</div><span class="meta"><span class="pill">${esc(r[2])}</span></span></div>
      <div class="meta" lang="en">${esc(r[4])}</div>`,
  moreHTML: (r, { say }) => (r[5] ? `<div><b>${esc(r[5])}</b> ${say(r[5])}<br><span class="muted">${esc(r[6])}</span></div>` : ""),
  prefill: (r) => ({ ko: r[0], hanja: hanjaOf(r), zh: hanjaOf(r) || "", en: r[4].split("; ")[0], pos: POS[r[2]] || "n", ex: r[5], exEn: r[6] }),
};

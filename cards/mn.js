// Card and Browse-row renderers for the Mongolian pack (Cyrillic target; Simplified Chinese + English support).
// The Latin line under each Mongolian word is a reading aid computed from the Cyrillic (lib/mongol.js).
import { latin } from "../lib/mongol.js";

const lat = (s, esc) => `<div class="mnlat">${esc(latin(s))}</div>`;
const exHTML = (mn, zh, en, { esc, say }) =>
  `<div class="ex"><div class="k">${esc(mn)} ${say(mn)}</div><div class="t mnlat">${esc(latin(mn))}</div><div class="t" lang="zh-Hans">${esc(zh)}</div><div class="t">${esc(en)}</div></div>`;

export function card(it, open, ctx) {
  const { esc, say, t, isGrammar } = ctx;
  const front = isGrammar(it)
    ? `<div class="front grammar">${esc(it.form)}</div>${lat(it.form, esc)}<div class="pos">${esc(t.grammarLabel)}</div>`
    : `<div class="front">${esc(it.mn)} ${say(it.mn)}</div>${lat(it.mn, esc)}<div class="pos">${esc(t.posName(it.pos))}${it.check ? '<span class="check">?</span>' : ""}</div>`;
  if (!open) return `<div class="card flash" id="card">${front}<div class="hint">${t.tapToFlip}</div></div>`;
  const back = isGrammar(it)
    ? `<div class="zh" lang="zh-Hans">${esc(it.zh)}</div><div class="en">${esc(it.en)}</div>` +
      (it.note ? `<div class="note" lang="zh-Hans">${esc(it.note)}</div>` : "") + it.ex.map((e) => exHTML(e.mn, e.zh, e.en, ctx)).join("")
    : `<div class="zh" lang="zh-Hans">${esc(it.zh)}</div><div class="en">${esc(it.en)}</div>` + exHTML(it.exMn, it.exZh, it.exEn, ctx);
  return `<div class="card flash" id="card">${front}${back}</div>`;
}

export function browseRow(i, status, ctx) {
  const { esc, say, t, isGrammar } = ctx;
  const g = isGrammar(i), mn = g ? i.form : i.mn;
  const more = g
    ? (i.note ? `<div class="muted" lang="zh-Hans">${esc(i.note)}</div>` : "") + i.ex.map((e) => `<div><b>${esc(e.mn)}</b> ${say(e.mn)}<br><span class="muted" lang="zh-Hans">${esc(e.zh)}</span><br><span class="muted">${esc(e.en)}</span></div>`).join("")
    : `<b>${esc(i.exMn)}</b> ${say(i.exMn)}<br><span class="muted mnlat">${esc(latin(i.exMn))}</span><br><span class="muted" lang="zh-Hans">${esc(i.exZh)}</span><br><span class="muted">${esc(i.exEn)}</span>`;
  return `<div class="item" data-id="${esc(i.id)}">
        <div class="row"><div><b>${esc(mn)}</b> <span class="mnlat">${esc(latin(mn))}</span>${i.check ? '<span class="check">?</span>' : ""}</div>
          <span class="meta"><span class="pill ${esc(i.tier)}">${esc(i.tier.toUpperCase())} · ${esc(i.unit)}</span> ${status}</span></div>
        <div class="meta"><span lang="zh-Hans">${esc(i.zh)}</span> · <span lang="en">${esc(i.en)}</span></div>
        <div class="more">${more}
          ${g ? "" : `<div class="actions"><button class="btn" data-say="${esc(mn)}">${t.listenBtn}</button>`}
          ${g ? `<div class="actions">` : ""}<button class="btn" data-reset="${esc(i.id)}">${t.resetProgress}</button></div>
        </div></div>`;
}

export const searchText = (i) => [i.mn, i.mn && latin(i.mn), i.form, i.form && latin(i.form), i.zh, i.en];

// Home: the Cyrillic letters a Chinese reader needs a hint for, each with a sample word to hear.
const LETTERS = [
  ["Өө", "ö", "өдөр"], ["Үү", "ü", "үг"], ["Хх", "kh", "хоол"], ["Цц", "ts", "цай"], ["Чч", "ch", "чи"],
  ["Шш", "sh", "шөл"], ["Жж", "j", "жил"], ["Зз", "z", "зам"], ["Ээ", "e", "энэ"], ["Ыы", "y", "ажлын"], ["Лл", "l", "лаа"],
];
export function homeExtra({ esc, say, t }) {
  return `
    <h2>${esc(t.lettersTitle)}</h2>
    <div class="card letters">${LETTERS.map(([l, r, w], i) =>
      `<div class="lt"><b>${esc(l)}</b><span class="mnlat">${esc(r)}</span><span class="tkl" lang="zh-Hans">${esc(t.letterHints[i])}</span>${say(w)}</div>`).join("")}
      <p class="small muted" lang="zh-Hans">${esc(t.lettersHint)}</p>
    </div>`;
}

export const cards = { card, browseRow, searchText };

// Card and Browse-row renderers for the English pack (Korean-speaking learner): English word with IPA,
// Korean meaning, a Korean usage note (Konglish, ✗/✓ pairs, nuance) and an example.
const ipa = (s, esc) => (s ? `<div class="ipa">/${esc(s)}/</div>` : "");
const noteHTML = (n, esc) => (n ? `<div class="note">${esc(n)}</div>` : "");

export function card(it, open, ctx) {
  const { esc, say, t, isGrammar } = ctx;
  const front = isGrammar(it)
    ? `<div class="front grammar">${esc(it.form)}</div><div class="pos">${esc(t.grammarLabel)}</div>`
    : `<div class="front">${esc(it.en)} ${say(it.en)}</div>${ipa(it.ipa, esc)}<div class="pos">${esc(t.posName(it.pos))}${it.check ? '<span class="check">?</span>' : ""}</div>`;
  if (!open) return `<div class="card flash" id="card">${front}<div class="hint">${t.tapToFlip}</div></div>`;
  const back = isGrammar(it)
    ? `<div class="zh">${esc(it.ko)}</div>${noteHTML(it.note, esc)}` +
      it.ex.map((e) => `<div class="ex"><div class="k">${esc(e.en)} ${say(e.en)}</div><div class="t">${esc(e.ko)}</div></div>`).join("")
    : `<div class="zh">${esc(it.ko)}</div>${noteHTML(it.note, esc)}` +
      `<div class="ex"><div class="k">${esc(it.ex)} ${say(it.ex)}</div><div class="t">${esc(it.exKo)}</div></div>`;
  return `<div class="card flash" id="card">${front}${back}</div>`;
}

export function browseRow(i, status, ctx) {
  const { esc, say, t, isGrammar } = ctx;
  const g = isGrammar(i);
  const more = g
    ? noteHTML(i.note, esc) + i.ex.map((e) => `<div><b>${esc(e.en)}</b> ${say(e.en)}<br><span class="muted">${esc(e.ko)}</span></div>`).join("")
    : noteHTML(i.note, esc) + `<b>${esc(i.ex)}</b> ${say(i.ex)}<br><span class="muted">${esc(i.exKo)}</span>`;
  return `<div class="item" data-id="${esc(i.id)}">
        <div class="row"><div><b>${esc(g ? i.form : i.en)}</b>${g ? "" : ` <span class="ipa">/${esc(i.ipa)}/</span>`}${i.check ? '<span class="check">?</span>' : ""}</div>
          <span class="meta"><span class="pill ${esc(i.tier)}">${esc(i.tier)} ${esc(i.unit)}</span> ${status}</span></div>
        <div class="meta">${esc(i.ko)}</div>
        <div class="more">${more}
          <div class="actions">${g ? "" : `<button class="btn" data-say="${esc(i.en)}">${t.listenBtn}</button>`}<button class="btn" data-reset="${esc(i.id)}">${t.resetProgress}</button></div>
        </div></div>`;
}

export const searchText = (i) => [i.en, i.form, i.ko, i.ipa];

export const cards = { card, browseRow, searchText };

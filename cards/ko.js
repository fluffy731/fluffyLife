// Card and Browse-row renderers for the Korean pack (Korean target, Chinese/English support).
import { pronounce, romanize } from "../lib/pron.js";
import { picHTML } from "../data/pics-ko.js";

// [pronounced form] + romanisation, only when a sound-change rule actually applies.
function pronHTML(it, esc) {
  const said = pronounce(it.ko, { sino: !!it.hanja });
  const rr = romanize(it.ko, { sino: !!it.hanja });
  return `<div class="pron">${said !== it.ko ? `<span class="said">[${esc(said)}]</span> ` : ""}<span class="rr">${esc(rr)}</span></div>`;
}

// Home's word of the hour: the sign's subtitle lines on its face (hanja in signage yellow, then the meaning).
const glanceHTML = (it, { esc, isGrammar }) => `<div class="glance">${!isGrammar(it) && it.hanja ? `<span class="hanja" lang="zh-Hant">${esc(it.hanja)}</span>` : ""}<span class="en">${esc(it.en)}</span></div>`;

export function card(it, open, ctx) {
  const { esc, say, t, isGrammar } = ctx;
  const front = isGrammar(it)
    ? `<div class="front grammar">${esc(it.form)}</div>`
    : `<div class="front">${esc(it.ko)} ${say(it.ko)}</div><div class="pos">${esc(it.pos)}${it.check ? '<span class="check">?</span>' : ""}</div>`;
  if (!open) return `<div class="card flash" id="card">${front}${ctx.tab === "home" ? glanceHTML(it, ctx) : ""}<div class="hint">${t.tapToFlip}</div></div>`;
  let back;
  if (isGrammar(it)) {
    back = `<div class="rule"></div><div class="zh" lang="zh-Hant">${esc(it.zh)}</div><div class="en">${esc(it.en)}</div>` +
      (it.note ? `<div class="note">${esc(it.note)}</div>` : "") +
      it.ex.map((e) => `<div class="ex"><div class="k">${esc(e.ko)} ${say(e.ko)}</div><div class="t" lang="zh-Hant">${esc(e.zh)}</div><div class="t">${esc(e.en)}</div></div>`).join("");
  } else {
    const pic = picHTML(it.ko, esc);
    back = pronHTML(it, esc) + `<div class="rule"></div>` + (pic ? `<div class="pic">${pic}</div>` : "") +
      (it.hanja ? `<div class="hanja" lang="zh-Hant">${esc(it.hanja)}</div>` : it.pos === "phrase" || it.pos === "idiom" ? "" : `<div class="hanja none">고유어 · native word</div>`) +
      (it.zh && it.zh !== it.hanja ? `<div class="zh" lang="zh-Hant">${esc(it.zh)}</div>` : "") + `<div class="en">${esc(it.en)}</div>` +
      (it.note ? `<div class="note">${esc(it.note)}</div>` : "") +
      (it.ex && it.ex !== "—" ? `<div class="ex"><div class="k">${esc(it.ex)} ${say(it.ex)}</div>${it.exZh !== "—" ? `<div class="t" lang="zh-Hant">${esc(it.exZh)}</div>` : ""}${it.exEn !== "—" ? `<div class="t">${esc(it.exEn)}</div>` : ""}</div>` : "");
  }
  return `<div class="card flash" id="card">${front}${back}</div>`;
}

export function browseRow(i, status, { esc, say, t, isGrammar }) {
  return `<div class="item" data-id="${esc(i.id)}">
        <div class="row"><div>${i.ko ? picHTML(i.ko, esc, true) : ""}<b>${esc(i.ko ?? i.form)}</b>${i.hanja ? `<span class="hj" lang="zh-Hant">${esc(i.hanja)}</span>` : ""}${i.check ? '<span class="check">?</span>' : ""}</div>
          <span class="meta"><span class="pill ${esc(i.tier)}">${esc(i.tier)} ${esc(i.unit)}</span> ${status}</span></div>
        <div class="meta" lang="zh-Hant">${isGrammar(i) ? "" : `<span class="rr">${esc(romanize(i.ko, { sino: !!i.hanja }))}</span> · `}${esc(i.zh)} · <span lang="en">${esc(i.en)}</span></div>
        <div class="more">${isGrammar(i)
          ? (i.note ? `<div class="muted">${esc(i.note)}</div>` : "") + i.ex.map((e) => `<div><b>${esc(e.ko)}</b><br><span class="muted" lang="zh-Hant">${esc(e.zh)}</span><br><span class="muted">${esc(e.en)}</span></div>`).join("")
          : `<b>${esc(i.ex)}</b> ${say(i.ex)}<br><span class="muted" lang="zh-Hant">${esc(i.exZh)}</span><br><span class="muted">${esc(i.exEn)}</span>`}
          <div class="actions"><button class="btn" data-say="${esc(i.ko ?? i.form)}">${t.listenBtn}</button>
          <button class="btn" data-edit="${esc(i.id)}">${t.edit}</button></div>
          <div class="actions"><button class="btn" data-reset="${esc(i.id)}">${t.resetProgress}</button></div>
        </div></div>`;
}

export const searchText = (i) => [i.ko, i.form, i.hanja, i.zh, i.en];

export const cards = { card, browseRow, searchText };

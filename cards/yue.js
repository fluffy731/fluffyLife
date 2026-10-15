// Card and Browse-row renderers for the Cantonese pack. The 한글 pronunciation spelling is the
// primary line everywhere; Jyutping is a small secondary line; characters come last.
import { syllables, hangul } from "../lib/jyutping.js";
import { bridge, hasBridge } from "../lib/bridge.js";
import { HANJA_KO } from "../data/yue/hanja-ko.js";

// Tone-coloured 한글 syllables with the tone digit as a superscript.
function sylHTML(jp, esc) {
  return syllables(jp)
    .map((s) => (s.punct ? esc(s.hg) : `<span class="syl${s.tone ? ` t${s.tone}` : ""}">${esc(s.hg)}${s.tone && s.ok ? `<sup>${s.tone}</sup>` : ""}</span>`))
    .join(" ")
    .replace(/ ([,.;:!?，。！？、)])/g, "$1");
}

function bridgeHTML(zh, jp, { esc, t }) {
  const rows = bridge(zh, jp, HANJA_KO);
  if (!rows) return "";
  if (!hasBridge(rows)) return `<div class="bridge"><span class="badge-cant">${esc(t.cantoneseOnly)}</span></div>`;
  return `<div class="bridge"><div class="small muted">${esc(t.bridgeTitle)}</div>${rows.map((r) =>
    `<span class="bpair"><span class="bch" lang="zh-Hant">${esc(r.ch)}</span> <span class="bko${r.ko ? "" : " none"}">${esc(r.ko ?? "—")}</span> ↔ <span class="bhg">${esc(r.hg)}</span></span>`).join("")}</div>`;
}

const exampleHTML = (zh, jp, ko, { esc, say }) =>
  `<div class="ex"><div class="k hg">${sylHTML(jp, esc)} ${say(zh)}</div><div class="t jp">${esc(jp)}</div><div class="t" lang="zh-Hant">${esc(zh)}</div><div class="t">${esc(ko)}</div></div>`;

export function card(it, open, ctx) {
  const { esc, say, t, isGrammar } = ctx;
  if (isGrammar(it)) {
    const front = `<div class="front hgline">${sylHTML(it.formJp, esc)} ${say(it.form)}</div><div class="pos">${esc(t.grammarLabel)}</div>`;
    if (!open) return `<div class="card flash" id="card">${front}<div class="hint">${t.tapToFlip}</div></div>`;
    const back = `<div class="zh">${esc(it.ko)}</div><div class="en">${esc(it.en)}</div><div class="jp">${esc(it.formJp)}</div>` +
      `<div class="hanja" lang="zh-Hant">${esc(it.form)}</div>` +
      (it.note ? `<div class="note">${esc(it.note)}</div>` : "") +
      it.ex.map((e) => exampleHTML(e.zh, e.jp, e.ko, ctx)).join("");
    return `<div class="card flash" id="card">${front}${back}</div>`;
  }
  const front = `<div class="front hgline">${sylHTML(it.jp, esc)} ${say(it.zh)}</div><div class="pos">${esc(t.posName(it.pos))}${it.check ? '<span class="check">?</span>' : ""}</div>`;
  if (!open) return `<div class="card flash" id="card">${front}<div class="hint">${t.tapToFlip}</div></div>`;
  const back = `<div class="zh">${esc(it.ko)}</div><div class="en">${esc(it.en)}</div><div class="jp">${esc(it.jp)}</div>` +
    `<div class="hanja" lang="zh-Hant">${esc(it.zh)}</div>` + bridgeHTML(it.zh, it.jp, ctx) +
    exampleHTML(it.exZh, it.exJp, it.exKo, ctx);
  return `<div class="card flash" id="card">${front}${back}</div>`;
}

export function browseRow(i, status, ctx) {
  const { esc, say, t, isGrammar } = ctx;
  const g = isGrammar(i);
  const jp = g ? i.formJp : i.jp, zh = g ? i.form : i.zh, ko = i.ko, en = i.en;
  const more = g
    ? (i.note ? `<div class="muted">${esc(i.note)}</div>` : "") + i.ex.map((e) => `<div class="exrow"><div class="hg">${sylHTML(e.jp, esc)}</div><span class="muted" lang="zh-Hant">${esc(e.zh)}</span><br><span class="muted">${esc(e.ko)}</span></div>`).join("")
    : `<div class="hg">${sylHTML(i.exJp, esc)} ${say(i.exZh)}</div><span class="muted" lang="zh-Hant">${esc(i.exZh)}</span><br><span class="muted">${esc(i.exKo)}</span>`;
  return `<div class="item" data-id="${esc(i.id)}">
        <div class="row"><div><b class="hg">${sylHTML(jp, esc)}</b> <span class="hj" lang="zh-Hant">${esc(zh)}</span>${i.check ? '<span class="check">?</span>' : ""}</div>
          <span class="meta"><span class="pill ${esc(i.tier)}">${esc(i.tier.toUpperCase())} · ${esc(i.unit)}</span> ${status}</span></div>
        <div class="meta">${esc(ko)} · <span lang="en">${esc(en)}</span></div>
        <div class="more">${bridgeHTML(zh, jp, ctx)}${more}
          <div class="actions"><button class="btn" data-say="${esc(zh)}">${t.listenBtn}</button>
          <button class="btn" data-reset="${esc(i.id)}">${t.resetProgress}</button></div>
        </div></div>`;
}

export const searchText = (i) => [i.zh, i.jp, i.jp && hangul(i.jp), i.form, i.formJp && hangul(i.formJp), i.ko, i.en];

export const cards = { card, browseRow, searchText };

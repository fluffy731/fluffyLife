// Lists every text a pack's 🔊 buttons can speak, by rendering each card and Browse row with a
// recording `say()` — so the recordings always match what the app plays, even when cards change.
import { clipName } from "./audio.js";

const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const unesc = (s) => s.replace(/&(amp|lt|gt|quot|#39);/g, (m, e) => ({ amp: "&", lt: "<", gt: ">", quot: '"', "#39": "'" }[e]));

export function buildJobs(pack) {
  const html = [];
  const ctx = { esc, say: (text) => `<i data-say="${esc(text)}"></i>`, t: pack.ui, isGrammar: (it) => "form" in it, settings: {}, tab: "learn" };
  for (const it of [...pack.vocab, ...pack.grammar]) {
    html.push(pack.cards.card(it, false, ctx), pack.cards.card(it, true, ctx), pack.cards.browseRow(it, "", ctx));
  }
  if (pack.homeExtra) html.push(pack.homeExtra(ctx));
  html.push(`<i data-say="${esc(pack.speechTest)}"></i>`);
  const texts = new Set();
  for (const m of html.join("").matchAll(/data-say="([^"]*)"/g)) {
    const text = pack.speechClean(unesc(m[1]));
    if (text) texts.add(text);
  }
  const { voice, dir } = pack.audio;
  return [...texts].map((text) => ({ voice, text, file: `audio/${dir}/${clipName(voice, text)}.mp3` }));
}

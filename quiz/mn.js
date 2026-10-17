// Quiz question types for the Mongolian app (see lib/quiz.js for the shape).
import { latin } from "../lib/mongol.js";

const sameMeaning = (c, it) => c.zh === it.zh || c.en === it.en || c.mn === it.mn;
const replay = (t) => `<button class="say qreplay" data-qreplay aria-label="${t.quizReplay}">🔊</button>`;
const mnOption = (o, { esc }) => `<span>${esc(o.mn)}</span><small class="mnlat">${esc(latin(o.mn))}</small>`;

export const types = [
  {
    key: "meaning", kind: "vocab", caption: "qMeaning",
    applies: () => true,
    answerText: (it) => it.zh,
    reject: sameMeaning,
    promptHTML: (it, { esc }) => `<div class="qword">${esc(it.mn)}</div><div class="mnlat">${esc(latin(it.mn))}</div>`,
    optionHTML: (o, { esc }) => `<span lang="zh-Hans">${esc(o.zh)}</span><small>${esc(o.en)}</small>`,
  },
  {
    key: "reverse", kind: "vocab", caption: "qReverse",
    applies: () => true,
    answerText: (it) => it.mn,
    reject: sameMeaning,
    promptHTML: (it, { esc }) => `<div class="qword" lang="zh-Hans">${esc(it.zh)}</div><div class="muted">${esc(it.en)}</div>`,
    optionHTML: mnOption,
  },
  {
    // Reading practice: Cyrillic → which Latin spelling.
    key: "read", kind: "vocab", caption: "qRead",
    applies: () => true,
    answerText: (it) => latin(it.mn),
    reject: (c, it) => c.mn === it.mn,
    promptHTML: (it, { esc }) => `<div class="qword">${esc(it.mn)}</div>`,
    optionHTML: (o, { esc }) => `<span class="mnlat">${esc(latin(o.mn))}</span>`,
  },
  {
    key: "listen", kind: "vocab", caption: "qListenWord",
    applies: (it, env) => env.hasClip(it.mn),
    clip: (it) => it.mn,
    answerText: (it) => it.mn,
    reject: sameMeaning,
    promptHTML: (it, { t }) => replay(t),
    optionHTML: mnOption,
  },
  {
    key: "grammar", kind: "grammar", caption: "qGrammar",
    applies: (it) => it.ex?.length > 0,
    answerText: (it) => it.form,
    reject: (c, it) => c.zh === it.zh,
    promptHTML: (it, { esc }) => `<div class="qsentence">${esc(it.ex[0].mn)}</div><div class="small muted" lang="zh-Hans">${esc(it.ex[0].zh)}</div>`,
    optionHTML: (o, { esc }) => `<span>${esc(o.form)}</span><small lang="zh-Hans">${esc(o.zh)}</small>`,
  },
];

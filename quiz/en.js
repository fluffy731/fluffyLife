// Quiz question types for the English app (see lib/quiz.js for the shape).
const sameMeaning = (c, it) => c.ko === it.ko || c.en === it.en;
const replay = (t) => `<button class="say qreplay" data-qreplay aria-label="${t.quizReplay}">🔊</button>`;
const enOption = (o, { esc }) => `<span class="qko">${esc(o.en)}</span>`;
const rx = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
// The headword as it appears in its own example (case-insensitive, whole words), for fill-in-the-blank.
export const inExample = (it) => !!it.ex && new RegExp(`\\b${rx(it.en)}\\b`, "i").test(it.ex);
export const blanked = (it) => it.ex.replace(new RegExp(`\\b${rx(it.en)}\\b`, "i"), "_____");

export const types = [
  {
    key: "meaning", kind: "vocab", caption: "qMeaning",
    applies: () => true,
    answerText: (it) => it.ko,
    reject: sameMeaning,
    promptHTML: (it, { esc }) => `<div class="qword">${esc(it.en)}</div>${it.ipa ? `<div class="ipa">/${esc(it.ipa)}/</div>` : ""}`,
    optionHTML: (o, { esc }) => `<span>${esc(o.ko)}</span>`,
  },
  {
    key: "reverse", kind: "vocab", caption: "qReverse",
    applies: () => true,
    answerText: (it) => it.en,
    reject: sameMeaning,
    promptHTML: (it, { esc }) => `<div class="qword">${esc(it.ko)}</div>`,
    optionHTML: enOption,
  },
  {
    key: "blank", kind: "vocab", caption: "qBlank",
    applies: inExample,
    answerText: (it) => it.en,
    reject: (c, it) => sameMeaning(c, it) || c.pos !== it.pos,
    promptHTML: (it, { esc }) => `<div class="qsentence">${esc(blanked(it))}</div><div class="small muted">${esc(it.exKo)}</div>`,
    optionHTML: enOption,
  },
  {
    key: "listen", kind: "vocab", caption: "qListenWord",
    applies: (it, env) => env.hasClip(it.en),
    clip: (it) => it.en,
    answerText: (it) => it.en,
    reject: sameMeaning,
    promptHTML: (it, { t }) => replay(t),
    optionHTML: enOption,
  },
  {
    key: "grammar", kind: "grammar", caption: "qGrammar",
    applies: (it) => it.ex?.length > 0,
    answerText: (it) => it.form,
    reject: (c, it) => c.ko === it.ko,
    promptHTML: (it, { esc }) => `<div class="qsentence">${esc(it.ex[0].en)}</div><div class="small muted">${esc(it.ex[0].ko)}</div>`,
    optionHTML: (o, { esc }) => `<span>${esc(o.form)}</span><small>${esc(o.ko)}</small>`,
  },
];

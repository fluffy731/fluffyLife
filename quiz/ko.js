// Quiz question types for the Korean app (see lib/quiz.js for the shape).
const sameMeaning = (c, it) => c.zh === it.zh || c.en === it.en;
const replay = (t) => `<button class="say qreplay" data-qreplay aria-label="${t.quizReplay}">🔊</button>`;

// "-(으)ㄴ/는 반면(에)" → "ㄴ": the part of a form that must literally appear in a sentence using it.
export const grammarCore = (form) => form.replace(/^-/, "").replace(/\(.*?\)/g, "").split("/")[0].trim();

const koOption = (o, { esc }) => `<span class="qko">${esc(o.ko)}</span>`;

export const types = [
  {
    key: "meaning", kind: "vocab", caption: "qMeaning",
    applies: () => true,
    answerText: (it) => it.zh,
    reject: sameMeaning,
    promptHTML: (it, { esc }) => `<div class="qword">${esc(it.ko)}</div>`,
    optionHTML: (o, { esc }) => `<span lang="zh-Hant">${esc(o.zh)}</span><small>${esc(o.en)}</small>`,
  },
  {
    key: "reverse", kind: "vocab", caption: "qReverse",
    applies: () => true,
    answerText: (it) => it.ko,
    reject: sameMeaning,
    promptHTML: (it, { esc }) => `<div class="qword" lang="zh-Hant">${esc(it.zh)}</div><div class="muted">${esc(it.en)}</div>`,
    optionHTML: koOption,
  },
  {
    key: "hanja", kind: "vocab", caption: "qHanja",
    applies: (it) => !!it.hanja,
    answerText: (it) => it.ko,
    reject: (c, it) => c.hanja === it.hanja,
    promptHTML: (it, { esc }) => `<div class="qword" lang="zh-Hant">${esc(it.hanja)}</div>`,
    optionHTML: koOption,
  },
  {
    key: "listen", kind: "vocab", caption: "qListen",
    applies: (it, env) => env.hasClip(it.ko),
    clip: (it) => it.ko,
    answerText: (it) => it.ko,
    reject: sameMeaning,
    promptHTML: (it, { t }) => replay(t),
    optionHTML: koOption,
  },
  {
    key: "grammar", kind: "grammar", caption: "qGrammar",
    applies: (it) => it.ex?.length > 0,
    answerText: (it) => it.form,
    reject: (c, it) => { const core = grammarCore(c.form); return !!core && it.ex[0].ko.includes(core); },
    promptHTML: (it, { esc }) => `<div class="qsentence">${esc(it.ex[0].ko)}</div>`,
    optionHTML: (o, { esc }) => `<span class="qko">${esc(o.form)}</span>`,
  },
];

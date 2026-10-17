// Quiz question types for the Korean app (see lib/quiz.js for the shape).
const sameMeaning = (c, it) => c.zh === it.zh || c.en === it.en;
const replay = (t) => `<button class="say qreplay" data-qreplay aria-label="${t.quizReplay}">🔊</button>`;

// "-(으)ㄴ/는 반면(에)" → "는 반면": the part of a form that appears in a sentence using it. The last
// alternative is taken because the first is often a lone jamo (ㄴ) that never appears in composed text.
export const grammarCore = (form) => form.replace(/^-/, "").replace(/\(.*?\)/g, "").split("/").pop().trim();
// Two spellings of one point (-(으)ㄴ/는 데다(가) and -(으)ㄴ/는 데다가) share a core up to a suffix.
const sameForm = (a, b) => { const x = grammarCore(a).replace(/\s/g, ""), y = grammarCore(b).replace(/\s/g, ""); return !!x && !!y && (x.startsWith(y) || y.startsWith(x)); };

const koOption = (o, { esc }) => `<span class="qko">${esc(o.ko)}</span>`;

export const types = [
  {
    key: "meaning", kind: "vocab", caption: "qMeaning",
    applies: () => true,
    answerText: (it) => it.zh,
    reject: (c, it) => sameMeaning(c, it) || c.ko === it.ko,
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
    reject: (c, it) => { const core = grammarCore(c.form); return sameForm(c.form, it.form) || (!!core && it.ex[0].ko.includes(core)); },
    promptHTML: (it, { esc }) => `<div class="qsentence">${esc(it.ex[0].ko)}</div>`,
    optionHTML: (o, { esc }) => `<span class="qko">${esc(o.form)}</span>`,
  },
];

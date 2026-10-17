// Quiz question types for the Cantonese app (see lib/quiz.js). None needs reading characters:
// the learner works from the sound, the 한글 spelling and Korean meanings.
import { syllables, hangul } from "../lib/jyutping.js";
import { sylHTML } from "../cards/yue.js";

const sameMeaning = (c, it) => c.ko === it.ko || c.en === it.en;
// Homophones (三/衫 saam1) would make a sound-based question ambiguous.
const sameSound = (c, it) => sameMeaning(c, it) || c.jp === it.jp;
const replay = (t) => `<button class="say qreplay" data-qreplay aria-label="${t.quizReplay}">🔊</button>`;
const sylls = (jp) => syllables(jp).filter((s) => !s.punct);
const koOption = (o, { esc }) => `<span>${esc(o.ko)}</span>`;

export const isMono = (it) => sylls(it.jp).length === 1;

export const types = [
  {
    key: "listen", kind: "vocab", caption: "qListen",
    applies: (it, env) => env.hasClip(it.zh),
    clip: (it) => it.zh,
    answerText: (it) => it.ko,
    reject: sameSound,
    promptHTML: (it, { t }) => replay(t),
    optionHTML: koOption,
  },
  {
    key: "sound", kind: "vocab", caption: "qSound",
    applies: () => true,
    answerText: (it) => it.ko,
    reject: sameSound,
    promptHTML: (it, { esc }) => `<div class="qword hgline">${sylHTML(it.jp, esc)}</div><div class="jp">${esc(it.jp)}</div>`,
    optionHTML: koOption,
  },
  {
    key: "say", kind: "vocab", caption: "qSay",
    applies: () => true,
    answerText: (it) => hangul(it.jp),
    reject: sameMeaning,
    promptHTML: (it, { esc }) => `<div class="qword">${esc(it.ko)}</div>`,
    optionHTML: (o, { esc, say }) => `<span class="hgline">${sylHTML(o.jp, esc)}</span> ${say(o.zh)}`,
  },
  {
    key: "tone", kind: "vocab", caption: "qTone",
    applies: (it, env) => isMono(it) && env.hasClip(it.zh),
    clip: (it) => it.zh,
    fixedOptions: () => ["1", "2", "3", "4", "5", "6"],
    answerKey: (it) => String(sylls(it.jp)[0].tone),
    promptHTML: (it, { esc, t }) => `${replay(t)}<div class="qword">${esc(hangul(it.jp))}</div>`,
    optionHTML: (o, { t }) => `<span class="t${o}">${o}</span><small>${t.toneN(o)}</small>`,
  },
  {
    key: "gsound", kind: "grammar", caption: "qGsound",
    applies: () => true,
    answerText: (it) => it.ko,
    reject: (c, it) => c.ko === it.ko,
    promptHTML: (it, { esc, say }) => `<div class="qword hgline">${sylHTML(it.formJp, esc)} ${say(it.form)}</div>`,
    optionHTML: koOption,
  },
];

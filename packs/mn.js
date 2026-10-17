// The Mongolian app for a Mandarin + English speaker: Simplified Chinese UI, Latin reading aid.
import { pack as data } from "../data/mn/pack.js";
import { validateMn, MN_TIERS } from "../lib/validate-mn.js";
import { ui } from "../ui/zh.js";
import { cards, homeExtra } from "../cards/mn.js";
import { types as quizTypes } from "../quiz/mn.js";

const TIER = { a0: ["入门 · A0", "A0"], a1: ["基础 · A1", "A1"], a2: ["进阶 · A2", "A2"] };

export const mnPack = {
  ...data,
  storageKey: "mn.v1",
  backupPrefix: "mongolian",
  swPath: "../sw.js",
  // Two entries on purpose: with no Mongolian voice the app says so instead of reading Cyrillic with a wrong voice.
  speechLang: ["mn-MN", "mn"],
  speechTest: "Сайн байна уу",
  // Recorded clips (generated at deploy by scripts/gen_audio.py); iPhones have no Mongolian voice, so these matter.
  audio: { voice: "mn-MN-YesuiNeural", dir: "mn", base: "../audio/mn/" },
  speechClean: (text) => text.replace(/[-–—/…]/g, " ").replace(/\s+/g, " ").trim(),
  tiers: MN_TIERS.map((key) => ({ key, label: TIER[key][0], short: TIER[key][1] })),
  unitTitles: { 1: "问候与基本", 2: "数字与时间", 3: "家人与人", 4: "食物与饮料", 5: "购物与钱", 6: "交通与方向",
    7: "日常动词", 8: "常用形容词", 9: "身体与健康", 10: "天气与自然", 11: "家与生活", 12: "社交与文化" },
  homeExtra,
  ui, cards, editable: false, validate: validateMn,
  quiz: { types: quizTypes },
};

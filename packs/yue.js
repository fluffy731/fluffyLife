// The Cantonese app for a Korean-speaking beginner: Korean UI, 한글 pronunciation spelling.
import { pack as data } from "../data/yue/pack.js";
import { validateYue, YUE_TIERS } from "../lib/validate-yue.js";
import { ui } from "../ui/ko.js";
import { cards } from "../cards/yue.js";

const TIER = { a0: ["A0 · 생존 광동어", "A0"], a1: ["A1 · 일상 생활", "A1"], a2: ["A2 · 한 걸음 더", "A2"] };

export const yuePack = {
  ...data,
  storageKey: "yue.v1",
  backupPrefix: "yue",
  swPath: "../sw.js",
  speechLang: ["zh-HK", "zh-TW"],
  speechClean: (text) => text.trim(),
  tiers: YUE_TIERS.map((key) => ({ key, label: TIER[key][0], short: TIER[key][1] })),
  ui, cards, editable: false, validate: validateYue,
};

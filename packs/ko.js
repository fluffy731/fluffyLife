// The Korean app: Korean target language, Chinese (Traditional) + English support.
import { pack as data } from "../data/pack.js";
import { TIER_ORDER, TIER_LABEL } from "../lib/track.js";
import { validateItem } from "../lib/validate.js";
import { ui } from "../ui/en.js";
import { cards } from "../cards/ko.js";
import { types as quizTypes } from "../quiz/ko.js";

export const koPack = {
  ...data,
  storageKey: "korean.v1",
  backupPrefix: "korean",
  swPath: "../sw.js",
  speechLang: ["ko-KR"],
  speechTest: "안녕하세요",
  // Recorded clips (generated at deploy by scripts/gen_audio.py); 🔊 falls back to the device voice without them.
  audio: { voice: "ko-KR-SunHiNeural", dir: "ko", base: "../audio/ko/" },
  speechClean: (text) => text.replace(/^-|\(.*?\)/g, "").trim(),
  tiers: TIER_ORDER.map((key) => ({ key, label: TIER_LABEL[key], short: TIER_LABEL[key].split(" ·")[0] })),
  ui, cards, editable: true, validate: validateItem,
  quiz: { types: quizTypes },
};

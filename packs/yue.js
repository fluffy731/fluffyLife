// The Cantonese app for a Korean-speaking beginner: Korean UI, 한글 pronunciation spelling.
import { pack as data } from "../data/yue/pack.js";
import { LEGACY_IDS } from "../data/yue/legacy-ids.js";
import { validateYue, YUE_TIERS } from "../lib/validate-yue.js";
import { migrateProgress } from "../lib/store.js";
import { ui } from "../ui/ko.js";
import { cards, homeExtra, settingsExtra } from "../cards/yue.js";

const TIER = { a0: ["A0 · 생존 광동어", "A0"], a1: ["A1 · 일상 생활", "A1"], a2: ["A2 · 한 걸음 더", "A2"] };

export const yuePack = {
  ...data,
  storageKey: "yue.v1",
  backupPrefix: "yue",
  swPath: "../sw.js",
  // Cantonese voices only (iOS zh-HK, Android yue-HK). A Mandarin voice would read 唔該 as "wú gāi"
  // under a card that says 음 꼬이, so with no Cantonese voice the app says so instead of speaking.
  speechLang: ["zh-HK", "yue-HK"],
  speechTest: "你好",
  // Recorded clips (generated at deploy by scripts/gen_audio.py); 🔊 falls back to the device voice without them.
  audio: { voice: "zh-HK-HiuGaaiNeural", dir: "yue", base: "../audio/yue/" },
  // Grammar forms such as "형용사 + 咗" mix in Korean; only the Chinese is read aloud.
  speechClean: (text) => text.replace(/[A-Za-z0-9\u3131-\u318e\uac00-\ud7a3+()/…]/g, " ").replace(/\s+/g, " ").trim().replace(/ (?=\p{Script=Han})|(?<=\p{Script=Han}) /gu, ""),
  tiers: YUE_TIERS.map((key) => ({ key, label: TIER[key][0], short: TIER[key][1] })),
  unitTitles: { 1: "소리와 성조", 2: "인사와 예의", 3: "숫자·돈·시간", 4: "음식과 주문", 5: "대중교통", 6: "쇼핑",
    7: "사람과 가족", 8: "일상 동사", 9: "형용사", 10: "장소와 길 찾기", 11: "건강과 약국", 12: "광동어다운 말투" },
  homeExtra, settingsExtra,
  migrate: (state) => ({ ...state, progress: migrateProgress(state.progress, LEGACY_IDS) }),
  ui, cards, editable: false, validate: validateYue,
};

// The English app for a Korean speaker (intermediate → advanced): Korean UI, IPA, usage notes.
import { pack as data } from "../data/en/pack.js";
import { validateEn, EN_TIERS } from "../lib/validate-en.js";
import { ui } from "../ui/ko-en.js";
import { cards } from "../cards/en.js";
import { types as quizTypes } from "../quiz/en.js";
import { dictEn } from "./dict-en.js";

const TIER = { int: ["중급 · B1–B2", "중급"], adv: ["고급 · C1", "고급"] };

export const enPack = {
  ...data,
  storageKey: "en.v1",
  backupPrefix: "english",
  swPath: "../sw.js",
  speechLang: ["en-US"],
  speechTest: "Nice to meet you.",
  // Recorded clips (generated at deploy by scripts/gen_audio.py); 🔊 falls back to the device voice without them.
  audio: { voice: "en-US-JennyNeural", dir: "en", base: "../audio/en/" },
  speechClean: (text) => text.replace(/\(.*?\)/g, " ").replace(/\s+/g, " ").trim(),
  tiers: EN_TIERS.map((key) => ({ key, label: TIER[key][0], short: TIER[key][1] })),
  unitTitles: { 1: "일상 대화와 감정", 2: "일과 직장", 3: "학교와 공부", 4: "여행과 교통", 5: "건강과 생활",
    6: "쇼핑과 돈", 7: "관계와 성격", 8: "미디어와 기술", 9: "환경과 사회", 10: "의견 말하기",
    11: "비즈니스 회의와 협상", 12: "학술 글쓰기", 13: "경제와 금융", 14: "정치와 법", 15: "과학과 연구",
    16: "심리와 행동", 17: "문화와 예술", 18: "뉘앙스 있는 형용사·부사", 19: "관용구와 은유", 20: "토론과 설득" },
  ui, cards, editable: false, validate: validateEn,
  quiz: { types: quizTypes },
  // Offline English→Korean dictionary (built at deploy from Wiktionary translations).
  dict: dictEn,
};

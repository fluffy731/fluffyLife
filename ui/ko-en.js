// Korean UI for the English app: the shared Korean strings plus English-specific ones.
import { ui as base } from "./ko.js";

const POS = { n: "명사", v: "동사", adj: "형용사", adv: "부사", phrase: "표현", idiom: "관용구" };

export const ui = {
  ...base,
  searchPlaceholder: "영어 · 한국어 뜻 · 발음기호로 검색",
  noVoice: "이 기기에 영어 음성이 없어요. 녹음 파일이 배포되면 🔊가 녹음을 재생해요 (무음 모드에서도 들려요).",
  posName: (p) => POS[p] ?? p,
  grammarLabel: "문법",
  qMeaning: "무슨 뜻일까요?", qReverse: "영어로 뭐라고 할까요?", qListenWord: "들은 단어는 무엇일까요?",
  qBlank: "빈칸에 알맞은 말은?", qGrammar: "이 문장에 쓰인 문법은?",
};

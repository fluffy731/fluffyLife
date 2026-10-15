// Cantonese grammar points. Rows: [formZh, formJp, unit, ko, en, note (Korean), [[zh, jp, ko], …]]
// Ids are `yg<unit>-<n>`; tier follows the unit (see vocab.js).
import { tierOfUnit } from "./vocab.js";

const ROWS = [
  // ---- Unit 1 ----
  ["唔", "m4", 1, "~하지 않아요 (부정)", "not (negation)",
    "동사나 형용사 바로 앞에 唔을 붙여요. 한국어 '안'과 비슷해서 쉬워요. 예: 食(먹다) → 唔食(안 먹어요).",
    [["我唔食辣。", "ngo5 m4 sik6 laat6.", "저는 매운 걸 안 먹어요."], ["佢唔嚟。", "keoi5 m4 lai4.", "그는 안 와요."]]],
  ["係", "hai6", 1, "~이에요 (A는 B이다)", "to be (A is B)",
    "'A 係 B' 순서예요. 한국어와 달리 조사(은/는, 이/가)가 없고 係가 가운데에 와요. 부정은 唔係(hai6 앞에 m4).",
    [["我係韓國人。", "ngo5 hai6 hon4 gwok3 jan4.", "저는 한국 사람이에요."], ["你係學生嗎？", "nei5 hai6 hok6 saang1 maa3?", "학생이에요?"]]],
  ["好", "hou2", 1, "아주 ~해요", "very (before adjectives)",
    "형용사 앞에 好를 붙이면 '아주'라는 뜻이에요. 그냥 말해도 '꽤 ~하다' 정도로 자연스럽게 들려요. 예: 好靚 = 아주 예뻐요.",
    [["好好食。", "hou2 hou2 sik6.", "아주 맛있어요."], ["好靚。", "hou2 leng3.", "아주 예뻐요."]]],
];

const n = {};
export const grammar = ROWS.map(([form, formJp, unit, ko, en, note, ex]) => {
  n[unit] = (n[unit] ?? 0) + 1;
  return { id: `yg${String(unit).padStart(2, "0")}-${n[unit]}`, form, formJp, unit, tier: tierOfUnit(unit), ko, en, note,
    ex: ex.map(([zh, jp, k]) => ({ zh, jp, ko: k })) };
});

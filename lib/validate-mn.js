// Validation for Mongolian pack rows: Cyrillic Mongolian, Simplified Chinese, English.
import { CYRILLIC } from "./mongol.js";

export const MN_TIERS = ["a0", "a1", "a2"];
const str = (v) => typeof v === "string" && v.length > 0;
// Traditional-only characters that must not appear in Simplified Chinese text.
const TRAD = /[們這個說時謝東車錢買賣飯醫學書話語國會來對見開門問還樣點機電長頭氣業寫讀歲號錯難雞魚鳥馬島風飛愛嗎麼為裡後們嗎過現愛聽聽廳醫實當麵歡業種與們圖館樂體轉邊雙號廣場紅綠藍綫線認識讓請謝謝鐘錶間聞員員區處覺應總經熱齡]/u;

function checkMn(label, v, errs) { if (str(v) && !CYRILLIC.test(v)) errs.push(`${label} must be Mongolian Cyrillic: "${v}"`); }
function checkZh(label, v, errs) {
  if (!str(v)) return;
  if (!/\p{Script=Han}/u.test(v)) errs.push(`${label} must contain Chinese: "${v}"`);
  const m = v.match(TRAD); if (m) errs.push(`${label} uses Traditional "${m[0]}" (use Simplified): "${v}"`);
}

export function validateMn(item, kind) {
  const errs = [];
  if (!item || typeof item !== "object") return ["not an object"];
  const req = kind === "grammar" ? ["id", "form", "tier", "zh", "en", "note"] : ["id", "mn", "zh", "en", "pos", "tier", "exMn", "exZh", "exEn"];
  for (const k of req) if (!str(item[k])) errs.push(`missing ${k}`);
  if (!Number.isInteger(item.unit) || item.unit < 1) errs.push("unit must be a positive integer");
  if (item.tier !== undefined && !MN_TIERS.includes(item.tier)) errs.push(`bad tier ${item.tier}`);
  checkZh("zh", item.zh, errs);
  if (kind === "grammar") {
    checkMn("form", item.form, errs);
    checkZh("note", item.note, errs);
    if (!Array.isArray(item.ex) || item.ex.length === 0) errs.push("ex must be a non-empty array");
    else for (const e of item.ex) {
      if (!e || !str(e.mn) || !str(e.zh) || !str(e.en)) { errs.push("ex entries need mn, zh, en"); break; }
      checkMn("ex.mn", e.mn, errs); checkZh("ex.zh", e.zh, errs);
    }
  } else {
    checkMn("mn", item.mn, errs); checkMn("exMn", item.exMn, errs); checkZh("exZh", item.exZh, errs);
  }
  return errs;
}

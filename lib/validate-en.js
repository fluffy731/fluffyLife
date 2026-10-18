// Validation for English pack rows (Korean-speaking learner): English text, IPA, Korean glosses.
export const EN_TIERS = ["int", "adv"];
const str = (v) => typeof v === "string" && v.length > 0;
const LATIN = /^[A-Za-z0-9\s'’.,!?;:()\-–—"/&%$…]+$/u;
// Broad American IPA, without slashes: stress ˈ ˌ, length ː, syllable dots allowed.
const IPA = /^[a-zɑɐæəɚɛɜɝɪɨɔʊʌɒθðʃʒŋɡɹɾʔˈˌː.\s()‿ˑ-]+$/u;
const HANGUL = /[가-힣]/u;

function check(label, v, re, what, errs) { if (str(v) && !re.test(v)) errs.push(`${label} must be ${what}: "${v}"`); }

export function validateEn(item, kind) {
  const errs = [];
  if (!item || typeof item !== "object") return ["not an object"];
  const req = kind === "grammar" ? ["id", "form", "tier", "ko", "note"] : ["id", "en", "ipa", "ko", "pos", "tier", "ex", "exKo"];
  for (const k of req) if (!str(item[k])) errs.push(`missing ${k}`);
  if (!Number.isInteger(item.unit) || item.unit < 1) errs.push("unit must be a positive integer");
  if (item.tier !== undefined && !EN_TIERS.includes(item.tier)) errs.push(`bad tier ${item.tier}`);
  if (str(item.ko) && !HANGUL.test(item.ko)) errs.push(`ko must contain Korean: "${item.ko}"`);
  if (kind === "grammar") {
    if (str(item.note) && !HANGUL.test(item.note)) errs.push("note must be in Korean");
    if (!Array.isArray(item.ex) || item.ex.length === 0) errs.push("ex must be a non-empty array");
    else for (const e of item.ex) {
      if (!e || !str(e.en) || !str(e.ko)) { errs.push("ex entries need en, ko"); break; }
      check("ex.en", e.en, LATIN, "English", errs);
      if (!HANGUL.test(e.ko)) errs.push(`ex.ko must be Korean: "${e.ko}"`);
    }
  } else {
    check("en", item.en, LATIN, "English", errs);
    check("ex", item.ex, LATIN, "English", errs);
    check("ipa", item.ipa, IPA, "IPA without slashes", errs);
    if (str(item.exKo) && !HANGUL.test(item.exKo)) errs.push(`exKo must be Korean: "${item.exKo}"`);
  }
  return errs;
}

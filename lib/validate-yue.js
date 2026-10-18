// Validation for Cantonese pack rows. Jyutping must be well-formed and fully mapped to 한글.
import { syllables } from "./jyutping.js";

export const YUE_TIERS = ["a0", "a1", "a2"];
const str = (v) => typeof v === "string" && v.length > 0;

// Non-Jyutping tokens allowed inside example sentences (names of things people write in Latin letters).
const ALLOWED = new Set(["HK$", "MTR", "OK"]);

function checkJp(label, jp, errs) {
  if (!str(jp)) return;
  for (const s of syllables(jp)) {
    if (s.punct) {
      // A "punctuation" token containing letters or digits is a typo (nei5,hou2 · nei5hou2 · sik7 · (nei5) · HOU2).
      const bare = s.jp.replace(/[,.;:!?，。！？、…)”’]+$/, "");
      if (/[A-Za-z0-9]/.test(bare) && !ALLOWED.has(bare) && !/^\d+$/.test(bare)) errs.push(`malformed Jyutping token "${s.jp}" in ${label}`);
      continue;
    }
    if (!s.ok) errs.push(`unmapped syllable "${s.jp}" in ${label}`);
    else if (s.tone === null) errs.push(`missing tone digit on "${s.jp}" in ${label}`);
  }
}

export function validateYue(item, kind) {
  const errs = [];
  if (!item || typeof item !== "object") return ["not an object"];
  // Words added from the dictionary (ids "u…") have no example sentence.
  const custom = String(item.id || "").startsWith("u");
  const req = kind === "grammar"
    ? ["id", "form", "formJp", "tier", "ko", "en", "note"]
    : ["id", "zh", "jp", "ko", "en", "pos", "tier", ...(custom ? [] : ["exZh", "exJp", "exKo"])];
  for (const k of req) if (!str(item[k])) errs.push(`missing ${k}`);
  const spoken = kind === "grammar" ? ["form", item.form] : ["zh", item.zh];
  if (str(spoken[1]) && !/\p{Script=Han}/u.test(spoken[1])) errs.push(`${spoken[0]} must contain Han characters (it is read aloud by the zh-HK voice)`);
  if (!Number.isInteger(item.unit) || item.unit < 1) errs.push("unit must be a positive integer");
  if (item.tier !== undefined && !YUE_TIERS.includes(item.tier)) errs.push(`bad tier ${item.tier}`);
  if (kind === "grammar") {
    checkJp("formJp", item.formJp, errs);
    if (!Array.isArray(item.ex) || item.ex.length === 0) errs.push("ex must be a non-empty array");
    else for (const e of item.ex) {
      if (!e || !str(e.zh) || !str(e.jp) || !str(e.ko)) { errs.push("ex entries need zh, jp, ko"); break; }
      checkJp("ex", e.jp, errs);
    }
  } else {
    checkJp("jp", item.jp, errs);
    checkJp("exJp", item.exJp, errs);
  }
  return errs;
}

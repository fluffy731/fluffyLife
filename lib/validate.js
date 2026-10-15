// Seed/custom data validation and merging.
const TIERS = ["int", "adv", "beg"];
const VOCAB_REQ = ["id", "ko", "zh", "en", "pos", "tier", "unit", "ex", "exZh", "exEn"];
const GRAMMAR_REQ = ["id", "form", "tier", "unit", "en", "zh"];

const str = (v) => typeof v === "string" && v.length > 0;

export function validateItem(item, kind) {
  const errs = [];
  if (!item || typeof item !== "object") return ["not an object"];
  const req = kind === "grammar" ? GRAMMAR_REQ : VOCAB_REQ;
  for (const k of req) {
    if (k === "unit") { if (!Number.isInteger(item.unit) || item.unit < 1) errs.push("unit must be a positive integer"); }
    else if (!str(item[k])) errs.push(`missing ${k}`);
  }
  if (item.tier !== undefined && !TIERS.includes(item.tier)) errs.push(`bad tier ${item.tier}`);
  if (kind === "vocab") {
    if (!("hanja" in item) || !(item.hanja === null || str(item.hanja))) errs.push("hanja must be a string or null");
  } else {
    if (!Array.isArray(item.ex) || item.ex.length === 0) errs.push("ex must be a non-empty array");
    else for (const e of item.ex) if (!e || !str(e.ko) || !str(e.zh) || !str(e.en)) { errs.push("ex entries need ko, zh, en"); break; }
  }
  return errs;
}

export function mergeItems(seed, custom) {
  const byId = new Map(seed.map((i) => [i.id, i]));
  for (const c of custom) byId.set(c.id, c);
  return [...byId.values()];
}

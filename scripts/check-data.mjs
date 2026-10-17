// Validates a pack's seed data and prints every problem: node scripts/check-data.mjs ko|yue|mn
const which = process.argv[2];
const PACKS = {
  ko: async () => { const { pack } = await import("../data/pack.js"); const { validateItem } = await import("../lib/validate.js"); return [pack, validateItem]; },
  yue: async () => { const { pack } = await import("../data/yue/pack.js"); const { validateYue } = await import("../lib/validate-yue.js"); return [pack, validateYue]; },
  mn: async () => { const { vocab } = await import("../data/mn/vocab.js"); const { grammar } = await import("../data/mn/grammar.js"); const { validateMn } = await import("../lib/validate-mn.js"); return [{ vocab, grammar }, validateMn]; },
};
const [pack, validate] = await PACKS[which]();
const errs = [];
for (const v of pack.vocab) for (const e of validate(v, "vocab")) errs.push(`${v.id}: ${e}`);
for (const g of pack.grammar) for (const e of validate(g, "grammar")) errs.push(`${g.id}: ${e}`);
const ids = [...pack.vocab, ...pack.grammar].map((i) => i.id);
for (const d of new Set(ids.filter((x, i) => ids.indexOf(x) !== i))) errs.push(`duplicate id ${d}`);
const byUnit = {};
for (const i of [...pack.vocab, ...pack.grammar]) { const k = `${i.tier}-${i.unit}`; byUnit[k] = (byUnit[k] || 0) + 1; }
console.log(`${which}: ${pack.vocab.length} vocab, ${pack.grammar.length} grammar; per unit ${JSON.stringify(byUnit)}`);
console.log(errs.length ? errs.join("\n") : "OK — no problems");
process.exit(errs.length ? 1 : 0);

// Study track: units ordered int → adv → beg, unlock on previous learned.
export const TIER_ORDER = ["int", "adv", "beg"];
export const TIER_LABEL = { int: "Intermediate · TOPIK 3–4", adv: "Advanced · TOPIK 5–6", beg: "Beginner · TOPIK 1–2" };

export function buildUnits(vocab, grammar, tierOrder = TIER_ORDER) {
  const map = new Map();
  for (const it of [...vocab, ...grammar]) {
    if (!tierOrder.includes(it.tier)) continue;
    const key = `${it.tier}-${it.unit}`;
    if (!map.has(key)) map.set(key, { key, tier: it.tier, unit: it.unit, items: [] });
    map.get(key).items.push(it);
  }
  return [...map.values()].sort((a, b) =>
    tierOrder.indexOf(a.tier) - tierOrder.indexOf(b.tier) || a.unit - b.unit);
}

// An item is "seen" once it has any schedule state, whatever its reps (Again resets reps to 0).
const seen = (p, id) => p[id] != null && typeof p[id] === "object";
export { seen };

export function isLearned(unit, progress) {
  return unit.items.every((i) => seen(progress, i.id));
}

export function currentUnit(units, progress) {
  return units.find((u) => !isLearned(u, progress)) ?? units[units.length - 1];
}

export function isUnlocked(units, i, progress) {
  return i === 0 || isLearned(units[i - 1], progress);
}

export function dueItems(items, progress, now = Date.now()) {
  return items
    .filter((i) => seen(progress, i.id) && progress[i.id].due <= now)
    .sort((a, b) => progress[a.id].due - progress[b.id].due);
}

export function unseenItems(unit, progress) {
  return unit.items.filter((i) => !seen(progress, i.id));
}

// Items for word-of-the-hour: the unit, or its whole tier once the unit is learned.
export function pickHourItems(units, unit, progress) {
  if (!isLearned(unit, progress)) return unit.items;
  return units.filter((u) => u.tier === unit.tier).flatMap((u) => u.items);
}

// Learn and Browse filter by kind: set phrases and idioms are "phrase", grammar points "grammar".
export const kindOf = (it) => ("form" in it ? "grammar" : it.pos === "phrase" || it.pos === "idiom" ? "phrase" : "word");

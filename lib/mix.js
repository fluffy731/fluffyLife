// Interleaves word types so a unit never reads as a block of one kind (all hanja nouns, all verbs …).
export const BUCKETS = ["nH", "nN", "v", "adj", "etc"];

export function bucketOf(v) {
  if (v.pos === "n") return v.hanja ? "nH" : "nN";
  return v.pos === "v" || v.pos === "adj" ? v.pos : "etc";
}

// Smooth weighted round robin: each step takes the next item of the bucket furthest behind its
// proportional share. Every bucket keeps its own order, so themed rows stay roughly together.
export function mixOrder(items, bucketFn, order = BUCKETS) {
  const groups = new Map(order.map((b) => [b, []]));
  for (const it of items) groups.get(bucketFn(it))?.push(it);
  const taken = new Map(order.map((b) => [b, 0]));
  const total = items.length, out = [];
  for (let k = 0; k < total; k++) {
    let best = null, bestDeficit = -Infinity;
    for (const b of order) {
      const g = groups.get(b);
      if (taken.get(b) >= g.length) continue;
      const deficit = (g.length / total) * (k + 1) - taken.get(b);
      if (deficit > bestDeficit + 1e-9) { best = b; bestDeficit = deficit; }
    }
    out.push(groups.get(best)[taken.get(best)]);
    taken.set(best, taken.get(best) + 1);
  }
  return out;
}

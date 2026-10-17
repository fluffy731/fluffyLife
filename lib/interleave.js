// Spreads `extra` evenly through `base`, keeping both orders: interleave([a,b,c,d], [X,Y]) → a X b c Y d.
export function interleave(base, extra) {
  const out = [...base];
  extra.forEach((x, j) => out.splice(Math.round(((j + 1) * base.length) / (extra.length + 1)) + j, 0, x));
  return out;
}

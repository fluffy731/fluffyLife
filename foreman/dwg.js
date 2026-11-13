// Tiny SVG helpers for the 2D drawings. Colours come from CSS classes so drawings follow light and dark themes.
export const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const n = (v) => Math.round(v * 10) / 10;

// Material hatching, drawn the way section drawings show cut materials (AS 1100 style): brick and masonry in 45 degree lines,
// concrete as aggregate stipple, earth in diagonal lines with dashes, sand in dots, insulation as a wave, timber as grain.
// Every filled shape with one of these classes gets a hatched twin on top, so all the drawings pick it up without editing each one.
const HATCH = { 'd-conc': 'conc', 'd-slabfill': 'conc', 'd-brick': 'brick', 'd-soil': 'earth', 'd-sand': 'sand', 'd-ins': 'ins', 'd-ins2': 'ins', 'd-timber': 'grain' };
const DEFS = `<defs>
<pattern id="hp-brick" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="7" class="h-ln"/></pattern>
<pattern id="hp-conc" width="26" height="26" patternUnits="userSpaceOnUse"><circle cx="4" cy="5" r="1.1" class="h-dot"/><circle cx="17" cy="9" r="0.9" class="h-dot"/><path d="M9 19 l4 -6 l3.5 6z" class="h-tri"/><circle cx="22" cy="21" r="1.2" class="h-dot"/><path d="M1 14 l3 -4.5 l2.5 4.5z" class="h-tri"/><circle cx="12" cy="2" r="0.7" class="h-dot"/></pattern>
<pattern id="hp-earth" width="18" height="18" patternUnits="userSpaceOnUse" patternTransform="rotate(-45)"><line x1="0" y1="0" x2="0" y2="18" class="h-ln"/><line x1="9" y1="3" x2="9" y2="9" class="h-ln"/></pattern>
<pattern id="hp-sand" width="10" height="10" patternUnits="userSpaceOnUse"><circle cx="2.5" cy="2.5" r="0.75" class="h-dot"/><circle cx="7.5" cy="7" r="0.65" class="h-dot"/></pattern>
<pattern id="hp-ins" width="24" height="12" patternUnits="userSpaceOnUse"><path d="M0 6 Q6 0 12 6 T24 6" class="h-tri"/></pattern>
<pattern id="hp-grain" width="40" height="6" patternUnits="userSpaceOnUse"><path d="M0 3 Q10 1.5 20 3 T40 3" class="h-grain"/></pattern>
</defs>`;
const hatch = (body) => body.replace(/<(rect|path|polygon|circle|ellipse)\b([^>]*?)\bclass="(d-[a-z0-9]+)"([^>]*?)\/>/g,
  (m, tag, a, cls, b) => (HATCH[cls] ? `${m}<${tag}${a}class="hx hx-${HATCH[cls]}"${b}/>` : m));

export const svg = (w, h, body, label = 'Drawing') =>
  `<svg viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${esc(label)}" class="dwg">${DEFS}${hatch(body)}</svg>`;

// Title block along the foot of a drawing sheet: detail number in a bubble, title, scale note and the stage.
export function titled(svgText, { no, title, scale, stage }) {
  const m = /viewBox="0 0 ([\d.]+) ([\d.]+)"/.exec(svgText); if (!m) return svgText;
  const W = +m[1], H = +m[2], TB = 58, y = H + 6;
  const block = `<g class="tb"><rect x="0" y="${H}" width="${W}" height="${TB + 6}" class="d-bg"/><rect x="16" y="${y}" width="${W - 32}" height="${TB - 10}" rx="6" class="tb-box"/>`
    + `<circle cx="46" cy="${y + 24}" r="17" class="tb-bub"/><text x="46" y="${y + 29}" text-anchor="middle" class="tb-no">${esc(no)}</text>`
    + `<text x="74" y="${y + 21}" class="tb-title">${esc(String(title).toUpperCase())}</text><text x="74" y="${y + 39}" class="tb-sub">${esc(scale)}</text>`
    + `<text x="${W - 30}" y="${y + 21}" text-anchor="end" class="tb-sub">FOREMAN  |  Stage ${esc(stage)}</text><text x="${W - 30}" y="${y + 39}" text-anchor="end" class="tb-sub">Study drawing. Not for construction.</text></g>`;
  return svgText.replace(m[0], `viewBox="0 0 ${W} ${H + TB + 6}"`).replace(/<\/svg>$/, `${block}</svg>`);
}

export const T = (x, y, s, o = {}) =>
  `<text x="${n(x)}" y="${n(y)}" class="d-txt ${o.cls || ''}"${o.anchor ? ` text-anchor="${o.anchor}"` : ''}${o.rot ? ` transform="rotate(${o.rot} ${n(x)} ${n(y)})"` : ''}>${esc(s)}</text>`;

export const L = (x1, y1, x2, y2, cls = 'd-line') => `<line x1="${n(x1)}" y1="${n(y1)}" x2="${n(x2)}" y2="${n(y2)}" class="${cls}"/>`;
export const R = (x, y, w, h, cls = 'd-conc', rx = 0) => `<rect x="${n(x)}" y="${n(y)}" width="${n(w)}" height="${n(h)}" class="${cls}"${rx ? ` rx="${rx}"` : ''}/>`;
export const C = (x, y, r, cls = 'd-steel') => `<circle cx="${n(x)}" cy="${n(y)}" r="${n(r)}" class="${cls}"/>`;
export const P = (pts, cls = 'd-conc', close = true) => `<path d="M${pts.map(([x, y]) => `${n(x)} ${n(y)}`).join(' L')}${close ? ' Z' : ''}" class="${cls}"/>`;

// Dimension line between two points, with ticks and a label at the middle.
export function dim(x1, y1, x2, y2, label, side = 1) {
  const dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy) || 1, nx = (-dy / len) * 5, ny = (dx / len) * 5;
  const mx = (x1 + x2) / 2 + (-dy / len) * 11 * side, my = (y1 + y2) / 2 + (dx / len) * 11 * side;
  const vertical = Math.abs(dy) > Math.abs(dx);
  return `<g class="d-dimg">${L(x1, y1, x2, y2, 'd-dim')}${L(x1 - nx, y1 - ny, x1 + nx, y1 + ny, 'd-dim')}${L(x2 - nx, y2 - ny, x2 + nx, y2 + ny, 'd-dim')}${T(mx, my + (vertical ? 0 : 4), label, { anchor: 'middle', cls: 'd-dimt', rot: vertical ? -90 : 0 })}</g>`;
}

// Numbered callout: a dot on the thing, a leader line and a circled number at the far end.
export const call = (num, px, py, tx, ty) =>
  `<g class="d-call">${L(px, py, tx, ty, 'd-lead')}${C(px, py, 3, 'd-dot')}<circle cx="${n(tx)}" cy="${n(ty)}" r="11" class="d-bub"/><text x="${n(tx)}" y="${n(ty + 4)}" text-anchor="middle" class="d-num">${num}</text></g>`;

export const arrow = (x1, y1, x2, y2, cls = 'd-line') => {
  const a = Math.atan2(y2 - y1, x2 - x1), s = 8;
  const hx = (k) => x2 - s * Math.cos(a + k), hy = (k) => y2 - s * Math.sin(a + k);
  return `${L(x1, y1, x2, y2, cls)}<path d="M${n(x2)} ${n(y2)} L${n(hx(0.4))} ${n(hy(0.4))} L${n(hx(-0.4))} ${n(hy(-0.4))} Z" class="d-arrowhead"/>`;
};

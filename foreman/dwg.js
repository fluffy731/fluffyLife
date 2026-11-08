// Tiny SVG helpers for the 2D drawings. Colours come from CSS classes so drawings follow light and dark themes.
export const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const n = (v) => Math.round(v * 10) / 10;

export const svg = (w, h, body, label = 'Drawing') =>
  `<svg viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${esc(label)}" class="dwg">${body}</svg>`;

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

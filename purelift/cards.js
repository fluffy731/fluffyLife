// PureLift card effects (see cards.css and effects.html): the parts that need the pointer or a measured size.
// Everything is opt-in by class and added after the page loads, so without JavaScript cards are simply plain.

export const TILT_MAX = 8;        // degrees. The brief caps the tilt at 10.
export const MARQUEE_DASH = 10;   // percent of the border that is lit
export const SPOT_REACH = 200;    // px: the border starts to brighten this close to the pointer

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

// Tilt for a pointer at (px, py) inside a w × h card: the corner under the pointer leans away.
export function tiltAngles(px, py, w, h, max = TILT_MAX) {
  const nx = clamp((px / w) * 2 - 1, -1, 1), ny = clamp((py / h) * 2 - 1, -1, 1);
  return { rx: -ny * max, ry: nx * max };
}

// Liquid glass: where the backdrop is read from for pixel (x, y) of a w × h rounded box, as a fraction (-1..1) of the
// largest shift. Nothing moves in the middle; the rim bends strongly (read from further in, so the edge shows magnified,
// bent content); a faint zoom grows with distance from the centre.
export function liquidOffset(x, y, w, h, radius, bezel) {
  const cx = w / 2, cy = h / 2;
  const px = x + 0.5 - cx, py = y + 0.5 - cy;
  const qx = Math.abs(px) - (cx - radius), qy = Math.abs(py) - (cy - radius);
  const ox = Math.max(qx, 0), oy = Math.max(qy, 0), outside = Math.hypot(ox, oy);
  const depth = -(outside + Math.min(Math.max(qx, qy), 0) - radius);   // px in from the edge
  let nx = 0, ny = 0;                                                  // outward normal
  if (outside > 0) { nx = Math.sign(px) * ox / outside; ny = Math.sign(py) * oy / outside; }
  else if (qx > qy) nx = Math.sign(px); else ny = Math.sign(py);
  const t = clamp(1 - depth / bezel, 0, 1);
  const bend = t * t;
  const zoom = 0.1;
  return { dx: clamp(-nx * bend - (px / cx) * zoom, -1, 1), dy: clamp(-ny * bend - (py / cy) * zoom, -1, 1) };
}

export function liquidMap(w, h, radius, bezel) {
  const data = new Uint8ClampedArray(w * h * 4);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const { dx, dy } = liquidOffset(x, y, w, h, radius, bezel), i = (y * w + x) * 4;
    data[i] = 128 + 127 * dx; data[i + 1] = 128 + 127 * dy; data[i + 2] = 128; data[i + 3] = 255;
  }
  return data;
}

const SVG = "http://www.w3.org/2000/svg";
const svgEl = (name, attrs = {}) => { const el = document.createElementNS(SVG, name); for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v); return el; };
const layer = (el, cls) => { const s = document.createElement("span"); s.className = `fx-layer ${cls}`; s.setAttribute("aria-hidden", "true"); el.append(s); return s; };
const radiusOf = (el) => parseFloat(getComputedStyle(el).borderTopLeftRadius) || 0;

let ready = false, fine = false, still = false, liquidOK = false, defs = null, serial = 0;
const spots = new Set(), visible = new Set();

function setup() {
  if (ready) return; ready = true;
  fine = matchMedia("(hover: hover) and (pointer: fine)").matches;
  still = matchMedia("(prefers-reduced-motion: reduce)").matches;
  // Does this browser accept an SVG filter inside backdrop-filter? (Chrome and Edge do; Safari and Firefox don't.)
  const probe = document.createElement("div");
  probe.style.backdropFilter = "url(#fx-probe)";
  liquidOK = /url/.test(probe.style.backdropFilter || "");
  defs = svgEl("svg", { width: 0, height: 0, "aria-hidden": "true" });
  defs.style.cssText = "position:absolute;width:0;height:0;pointer-events:none";
  document.body.append(defs);
  if (fine) document.addEventListener("pointermove", onSpotMove, { passive: true });
  document.addEventListener("pointerleave", () => spots.forEach((el) => { el.style.setProperty("--spot-o", 0); el.style.setProperty("--spot-b", 0); }));
}

// 8 Spotlight. One listener drives every card in view, so the border glows near the pointer even between cards.
const spotIO = typeof IntersectionObserver === "undefined" ? null : new IntersectionObserver((entries) => {
  for (const e of entries) (e.isIntersecting ? visible.add(e.target) : visible.delete(e.target));
}, { rootMargin: `${SPOT_REACH}px` });
let spotFrame = 0, lastMove = null;
function onSpotMove(e) {
  lastMove = e;
  if (spotFrame) return;
  spotFrame = requestAnimationFrame(() => {
    spotFrame = 0;
    for (const el of visible) {
      const r = el.getBoundingClientRect(), x = lastMove.clientX - r.left, y = lastMove.clientY - r.top;
      const inside = x >= 0 && y >= 0 && x <= r.width && y <= r.height;
      const near = x > -SPOT_REACH && y > -SPOT_REACH && x < r.width + SPOT_REACH && y < r.height + SPOT_REACH;
      el.style.setProperty("--mx", `${x}px`); el.style.setProperty("--my", `${y}px`);
      el.style.setProperty("--spot-o", inside ? 1 : 0); el.style.setProperty("--spot-b", near ? 1 : 0);
    }
  });
}
function addSpot(el) {
  layer(el, "fx-spot-glow"); layer(el, "fx-spot-edge");
  spots.add(el); spotIO?.observe(el);
}

// 11 Tilt
function addTilt(el) {
  layer(el, "fx-glare");
  if (!fine || still) return;
  el.addEventListener("pointerenter", () => el.classList.add("is-tilting"));
  el.addEventListener("pointermove", (e) => {
    const r = el.getBoundingClientRect(), px = e.clientX - r.left, py = e.clientY - r.top;
    const { rx, ry } = tiltAngles(px, py, r.width, r.height);
    el.style.transform = `perspective(900px) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg)`;
    el.style.setProperty("--gx", `${(px / r.width) * 100}%`); el.style.setProperty("--gy", `${(py / r.height) * 100}%`);
    el.style.setProperty("--glare", 0.9);
  });
  el.addEventListener("pointerleave", () => {
    el.classList.remove("is-tilting");
    el.style.transform = ""; el.style.setProperty("--glare", 0);   // the CSS transition settles it back
  });
}

// 3 Holographic: the sheen's angle, position and hue follow the pointer
function addHolo(el) {
  layer(el, "fx-holo-sheen"); layer(el, "fx-holo-glitter"); layer(el, "fx-holo-glint");
  if (!fine || still) return;
  el.addEventListener("pointermove", (e) => {
    const r = el.getBoundingClientRect(), fx = clamp((e.clientX - r.left) / r.width, 0, 1), fy = clamp((e.clientY - r.top) / r.height, 0, 1);
    el.style.setProperty("--hx", `${fx * 100}%`); el.style.setProperty("--hy", `${fy * 100}%`);
    el.style.setProperty("--fx-ha", `${70 + fx * 100}deg`); el.style.setProperty("--hr", `${(fx - 0.5) * 140}deg`);
  });
  el.addEventListener("pointerleave", () => { for (const [k, v] of [["--hx", "50%"], ["--hy", "50%"], ["--fx-ha", "115deg"], ["--hr", "0deg"]]) el.style.setProperty(k, v); });
}

// 7 Marquee: an SVG rect measured to the card, drawn as 10 parts lit and 90 dark of a path normalised to 100
function addMarquee(el) {
  const svg = svgEl("svg", { class: "fx-marquee-svg", "aria-hidden": "true" });
  const rect = svgEl("rect", { pathLength: 100 });
  svg.append(rect); el.append(svg);
  rect.style.strokeDasharray = `${MARQUEE_DASH} ${100 - MARQUEE_DASH}`;
  const fit = () => {
    const w = el.offsetWidth, h = el.offsetHeight, r = Math.max(0, radiusOf(el));
    // CSS sizes win over attributes, and the site-wide "svg { width: 1em }" would shrink this to 16px
    svg.style.width = `${w}px`; svg.style.height = `${h}px`; svg.setAttribute("viewBox", `0 0 ${w} ${h}`);
    for (const [k, v] of Object.entries({ x: 1, y: 1, width: Math.max(0, w - 2), height: Math.max(0, h - 2), rx: Math.max(0, r - 1) })) rect.setAttribute(k, v);
  };
  fit(); new ResizeObserver(fit).observe(el);
}

// 2 Liquid glass: a displacement map the size of the card, rebuilt when it resizes
function addLiquid(el) {
  if (!liquidOK) return;
  const id = `fx-liquid-${++serial}`;
  const filter = svgEl("filter", { id, x: 0, y: 0, width: "100%", height: "100%", "color-interpolation-filters": "sRGB" });
  const image = svgEl("feImage", { x: 0, y: 0, preserveAspectRatio: "none", result: "map" });
  const move = svgEl("feDisplacementMap", { in: "SourceGraphic", in2: "map", xChannelSelector: "R", yChannelSelector: "G", scale: 64 });
  filter.append(image, move); defs.append(filter);
  const apply = () => {
    const w = Math.round(el.offsetWidth), h = Math.round(el.offsetHeight);
    if (!w || !h) return;
    const canvas = document.createElement("canvas"); canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext("2d"), img = ctx.createImageData(w, h);
    img.data.set(liquidMap(w, h, Math.min(radiusOf(el), w / 2, h / 2), Math.min(40, Math.min(w, h) / 3)));
    ctx.putImageData(img, 0, 0);
    image.setAttribute("width", w); image.setAttribute("height", h); image.setAttribute("href", canvas.toDataURL());
    el.style.backdropFilter = el.style.webkitBackdropFilter = `url(#${id}) blur(1px) saturate(1.5) brightness(1.06)`;
  };
  apply(); new ResizeObserver(apply).observe(el);
}

// each effect is set up once per card; one card can carry several (spotlight and tilt together)
const once = (el, name, fn) => { const key = `fx${name}`; if (el.dataset[key]) return; el.dataset[key] = "1"; fn(el); };

// Call again after adding cards to the page.
export function initCards(root = document) {
  setup();
  root.querySelectorAll(".fx-spot").forEach((el) => once(el, "spot", addSpot));
  root.querySelectorAll(".fx-tilt").forEach((el) => once(el, "tilt", addTilt));
  root.querySelectorAll(".fx-holo").forEach((el) => once(el, "holo", addHolo));
  root.querySelectorAll(".fx-marquee").forEach((el) => once(el, "marquee", addMarquee));
  root.querySelectorAll(".fx-liquid").forEach((el) => once(el, "liquid", addLiquid));
}

// Shared 3D helpers for every step. Units are metres. +z is toward the street, +x is east, +y is up.
import * as THREE from 'three';

export const C = {
  grass: 0x86ad6f, lawn: 0x74a05f, soil: 0x7a5c3e, soilDark: 0x4e3a28, sand: 0xdcc58f, rock: 0x9a9a96,
  concrete: 0xb8babd, concreteRaw: 0xa3a5a8, asphalt: 0x3f434a, kerb: 0xb4b6b9, path: 0xc9cbce,
  timber: 0xc79a5b, timberDark: 0x9b7440, steel: 0x6c7886, rebar: 0x59616b, rebarB: 0x2f6f9f, orange: 0xff7a1a,
  membrane: 0xf28c28, pvc: 0xd7d9dd, sewer: 0x8a5a3c, water: 0x2f7fd6, storm: 0x1fa39a, power: 0xd8383a, gas: 0xe6c200,
  brick: 0xb5654a, roof: 0x5c6670, wall: 0xe8e3d8, white: 0xf4f4f2, leaf: 0x4f7d45, trunk: 0x6b5236, hivis: 0xffa500, black: 0x1b1d20,
};


/* ---------- procedural textures (canvas, cached, shared by every scene) ----------
   Colour textures are sRGB; the same canvas doubles as a bump map. UVs are in metres, so each texture says how many
   metres one tile covers. Pass `tex: 'name'` to mat(). */
const rng = (seed) => { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
const pick = (r, a) => a[Math.floor(r() * a.length)];
// Draw a mark and its wrapped copies so the tile has no visible seam.
const wrapDraw = (W, H, x, y, pad, fn) => { for (const dx of [0, -W, W]) for (const dy of [0, -H, H]) { const X = x + dx, Y = y + dy; if (X > -pad && X < W + pad && Y > -pad && Y < H + pad) fn(X, Y); } };
const specks = (ctx, W, H, r, n, cols, rmin, rmax, alpha = 1) => { ctx.globalAlpha = alpha; for (let i = 0; i < n; i++) { const x = r() * W, y = r() * H, d = rmin + r() * (rmax - rmin); ctx.fillStyle = pick(r, cols); wrapDraw(W, H, x, y, d, (X, Y) => { ctx.beginPath(); ctx.arc(X, Y, d, 0, 6.2832); ctx.fill(); }); } ctx.globalAlpha = 1; };
const blotches = (ctx, W, H, r, n, cols, rmin, rmax, alpha) => { for (let i = 0; i < n; i++) { const x = r() * W, y = r() * H, d = rmin + r() * (rmax - rmin), c = pick(r, cols); wrapDraw(W, H, x, y, d, (X, Y) => { const g = ctx.createRadialGradient(X, Y, 0, X, Y, d); g.addColorStop(0, c + Math.round(alpha * 255).toString(16).padStart(2, '0')); g.addColorStop(1, c + '00'); ctx.fillStyle = g; ctx.fillRect(X - d, Y - d, d * 2, d * 2); }); } };
const GEN = {
  grass: { tile: [6, 6], size: [512, 512], bump: 0.5, draw(c, W, H) { const r = rng(11); c.fillStyle = '#7ea867'; c.fillRect(0, 0, W, H); blotches(c, W, H, r, 46, ['#5f8d4b', '#9bc27c', '#6e9a57'], 30, 90, 0.34); c.lineWidth = 1.3; for (let i = 0; i < 2600; i++) { const x = r() * W, y = r() * H, l = 6 + r() * 9, a = (r() - 0.5) * 0.9; c.strokeStyle = pick(r, ['#6f9c58', '#8ab773', '#5f8c4c', '#a2c985', '#7aa862']); c.globalAlpha = 0.75; wrapDraw(W, H, x, y, 16, (X, Y) => { c.beginPath(); c.moveTo(X, Y); c.lineTo(X + Math.sin(a) * l, Y - Math.cos(a) * l); c.stroke(); }); } c.globalAlpha = 1; } },
  soil: { tile: [1.4, 1.4], size: [256, 256], bump: 1.2, draw(c, W, H) { const r = rng(21); c.fillStyle = '#7b5e41'; c.fillRect(0, 0, W, H); blotches(c, W, H, r, 22, ['#5a4330', '#94734f'], 20, 60, 0.4); specks(c, W, H, r, 2600, ['#5d4530', '#8d6d4c', '#6b4f36', '#a07f5a', '#4a3626'], 0.6, 1.7); specks(c, W, H, r, 28, ['#8a8a84', '#a09e96', '#76746e'], 2, 4); } },
  sand: { tile: [1.2, 1.2], size: [256, 256], bump: 0.4, draw(c, W, H) { const r = rng(31); c.fillStyle = '#dcc58f'; c.fillRect(0, 0, W, H); blotches(c, W, H, r, 14, ['#c9b27a', '#ecd9a8'], 25, 70, 0.3); specks(c, W, H, r, 3200, ['#c9b27a', '#ecd9a8', '#d2bb82', '#bfa76d'], 0.5, 1.1); } },
  concrete: { tile: [2.2, 2.2], size: [256, 256], bump: 0.7, draw(c, W, H) { const r = rng(41); c.fillStyle = '#c3c5c7'; c.fillRect(0, 0, W, H); blotches(c, W, H, r, 34, ['#a9acaf', '#d8dadc'], 25, 80, 0.3); specks(c, W, H, r, 3400, ['#a4a7aa', '#d4d6d8', '#b3b6b8'], 0.4, 1.1, 0.9); specks(c, W, H, r, 55, ['#7e8184'], 0.9, 1.7, 0.55); } },
  paving: { tile: [1.5, 1.5], size: [256, 256], bump: 0.9, draw(c, W, H) { const r = rng(43); c.fillStyle = '#cfd1d3'; c.fillRect(0, 0, W, H); blotches(c, W, H, r, 18, ['#b9bcbf', '#e0e2e4'], 20, 70, 0.28); specks(c, W, H, r, 2200, ['#b1b4b7', '#dcdee0'], 0.4, 1), c.fillStyle = '#8f9396'; c.fillRect(0, 0, W, 3); c.fillRect(0, 0, 3, H); } },
  asphalt: { tile: [2, 2], size: [256, 256], bump: 1, draw(c, W, H) { const r = rng(51); c.fillStyle = '#464b53'; c.fillRect(0, 0, W, H); blotches(c, W, H, r, 22, ['#3a3e45', '#555a62'], 25, 80, 0.3); specks(c, W, H, r, 6000, ['#5a6069', '#383c43', '#6c727b', '#4b5058'], 0.5, 1.4); } },
  brick: { tile: [0.96, 0.86], size: [512, 459], bump: 1.4, draw(c, W, H) { const r = rng(61), rows = 10, ch = H / rows, bw = W / 4, m = ch * 0.116; c.fillStyle = '#c8c2b6'; c.fillRect(0, 0, W, H); for (let j = 0; j < rows; j++) for (let i = -1; i < 5; i++) { const x = i * bw + (j % 2 ? bw / 2 : 0) + m / 2, y = j * ch + m / 2; c.fillStyle = pick(r, ['#b0583f', '#a24e37', '#b86a4d', '#9c4a35', '#bd6f52', '#a85a42']); c.fillRect(x, y, bw - m, ch - m); c.globalAlpha = 0.25; for (let k = 0; k < 26; k++) { c.fillStyle = r() < 0.5 ? '#6e3220' : '#d98d6c'; c.fillRect(x + r() * (bw - m), y + r() * (ch - m), 2, 2); } c.globalAlpha = 1; } } },
  roofTile: { tile: [0.99, 1.02], size: [512, 520], bump: 1.6, draw(c, W, H) { const r = rng(71), rows = 3, rh = H / rows, tw = W / 3; c.fillStyle = '#6f757d'; c.fillRect(0, 0, W, H); for (let j = 0; j < rows; j++) for (let i = -1; i < 4; i++) { const x = i * tw + (j % 2 ? tw / 2 : 0), y = j * rh, g = c.createLinearGradient(0, y, 0, y + rh); g.addColorStop(0, '#b4b9bf'); g.addColorStop(0.8, '#a6acb3'); g.addColorStop(1, '#7a8087'); c.fillStyle = g; c.fillRect(x + 3, y + 2, tw - 6, rh - 4); c.fillStyle = 'rgba(255,255,255,.18)'; c.fillRect(x + tw * 0.46, y + 4, tw * 0.08, rh * 0.7); } specks(c, W, H, r, 1500, ['#8f959c', '#c8ccd1'], 0.5, 1, 0.5); } },
  metalRib: { tile: [0.76, 1], size: [256, 256], bump: 1.2, draw(c, W, H) { const n = 4, pw = W / n; for (let i = 0; i < n; i++) { const g = c.createLinearGradient(i * pw, 0, (i + 1) * pw, 0); g.addColorStop(0, '#9aa1a9'); g.addColorStop(0.1, '#eef1f4'); g.addColorStop(0.2, '#c3c9cf'); g.addColorStop(0.5, '#b4bbc2'); g.addColorStop(0.8, '#c9cfd5'); g.addColorStop(0.92, '#7f868e'); g.addColorStop(1, '#9aa1a9'); c.fillStyle = g; c.fillRect(i * pw, 0, pw, H); } } },
  timber: { tile: [0.9, 0.11], size: [512, 64], mode: 'long', bump: 0.7, draw(c, W, H) { const r = rng(81); c.fillStyle = '#d6ac6c'; c.fillRect(0, 0, W, H); blotches(c, W, H, r, 10, ['#c49858', '#e6c68e'], 18, 40, 0.35); for (let i = 0; i < 46; i++) { const y = r() * H; c.strokeStyle = pick(r, ['#a8792f', '#b98a43', '#8e6425']); c.globalAlpha = 0.2 + r() * 0.3; c.lineWidth = 0.6 + r() * 1.1; c.beginPath(); c.moveTo(0, y); for (let x = 0; x <= W; x += 32) c.lineTo(x, y + Math.sin(x * 0.02 + i) * 1.6); c.stroke(); } c.globalAlpha = 1; if (r() < 0.6) { const kx = r() * W, ky = H * (0.3 + r() * 0.4); c.fillStyle = '#7a531c'; c.globalAlpha = 0.55; c.beginPath(); c.ellipse(kx, ky, 9, 5, 0, 0, 6.2832); c.fill(); c.globalAlpha = 1; } } },
};
const TEXC = new Map();
export function getTex(name) {
  if (TEXC.has(name)) return TEXC.get(name);
  const g = GEN[name]; if (!g) return null;
  const cv = document.createElement('canvas'); [cv.width, cv.height] = g.size; g.draw(cv.getContext('2d'), cv.width, cv.height);
  const t = new THREE.CanvasTexture(cv);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  t.repeat.set(1 / g.tile[0], 1 / g.tile[1]);
  TEXC.set(name, t); return t;
}
// Large soft patches (tens of metres) that break up the repeat of a tiled texture: drier and greener lawn, worn asphalt.
let MACRO = null;
function macroTex() {
  if (MACRO) return MACRO;
  const cv = document.createElement('canvas'); cv.width = cv.height = 256; const c = cv.getContext('2d'), r = rng(97);
  c.fillStyle = '#808080'; c.fillRect(0, 0, 256, 256);
  blotches(c, 256, 256, r, 60, ['#ffffff', '#000000'], 18, 64, 0.32);
  MACRO = new THREE.CanvasTexture(cv); MACRO.wrapS = MACRO.wrapT = THREE.RepeatWrapping;
  return MACRO;
}
const MACRO_TINT = { grass: [1.1, 1.02, 0.72], asphalt: [1.06, 1.05, 1.03], soil: [1.08, 1.0, 0.9], concrete: [1.04, 1.03, 1.0] };
function addMacro(m, tex, amp) {
  const tint = MACRO_TINT[tex] || [1, 1, 1];
  m.onBeforeCompile = (sh) => {
    sh.uniforms.macroMap = { value: macroTex() };
    sh.fragmentShader = sh.fragmentShader.replace('void main() {', 'uniform sampler2D macroMap;\nvoid main() {').replace('#include <map_fragment>',
      `#include <map_fragment>
      float mv = texture2D(macroMap, vMapUv * ${(0.06 * GEN[tex].tile[0] / 6).toFixed(4)}).r;
      diffuseColor.rgb *= mix(1.0 - ${amp.toFixed(2)}, 1.0 + ${(amp * 0.6).toFixed(2)}, mv);
      diffuseColor.rgb = mix(diffuseColor.rgb * vec3(${tint.map((v) => v.toFixed(2)).join(', ')}), diffuseColor.rgb, smoothstep(0.25, 0.6, mv));`);
  };
  m.customProgramCacheKey = () => `macro-${tex}-${amp}`;
}

export const mat = (color, { tex, bump, macro, ...o } = {}) => {
  const m = new THREE.MeshStandardMaterial({ color, roughness: 0.88, metalness: 0, ...o });
  const t = tex && getTex(tex);
  if (t) { m.map = t; m.bumpMap = t; m.bumpScale = bump != null ? bump : GEN[tex].bump; m.userData.uv = GEN[tex].mode || 'world'; m.userData.tex = tex; }
  if (t && macro) addMacro(m, tex, macro);
  return m;
};
// Rewrite box UVs to metres per face so a textured box never stretches. 'long' puts u along each face's longer side (timber grain).
export function boxUV(geo, w, h, d, mode) {
  const uv = geo.attributes.uv, dims = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
  for (let f = 0; f < 6; f++) for (let k = 0; k < 4; k++) {
    const i = f * 4 + k, [a, b] = dims[f], u = uv.getX(i), v = uv.getY(i);
    if (mode === 'long' && b > a) uv.setXY(i, v * b, u * a); else uv.setXY(i, u * a, v * b);
  }
  uv.needsUpdate = true;
}
export const ghost = (color, opacity = 0.45, o = {}) => mat(color, { transparent: true, opacity, depthWrite: false, ...o });
export const lineMat = (color) => new THREE.LineBasicMaterial({ color });

const shadowed = (m, cast = true) => { m.castShadow = cast; m.receiveShadow = true; return m; };

export function box(w, h, d, m, x = 0, y = 0, z = 0) {
  const geo = new THREE.BoxGeometry(w, h, d);
  if (m.userData.uv) boxUV(geo, w, h, d, m.userData.uv);
  const mesh = shadowed(new THREE.Mesh(geo, m));
  mesh.position.set(x, y, z);
  return mesh;
}

// Cylinder; r is the bottom radius and r2 (default r) the top radius, so a cone collar is cyl(0.11, h, m, x, y, z, 24, true, 0.05).
export function cyl(r, h, m, x = 0, y = 0, z = 0, seg = 16, open = false, r2 = r) {
  const mesh = shadowed(new THREE.Mesh(new THREE.CylinderGeometry(r2, r, h, seg, 1, open), m));
  mesh.position.set(x, y, z);
  return mesh;
}

export function rod(a, b, r, m, seg = 8) {
  const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b), dir = B.clone().sub(A), len = dir.length();
  const mesh = shadowed(new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, seg), m));
  mesh.position.copy(A).addScaledVector(dir, 0.5);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
  return mesh;
}

export function pipe(points, r, m) {
  const g = new THREE.Group();
  for (let i = 0; i < points.length - 1; i++) g.add(rod(points[i], points[i + 1], r, m));
  for (let i = 1; i < points.length - 1; i++) {
    const s = shadowed(new THREE.Mesh(new THREE.SphereGeometry(r, 10, 8), m));
    s.position.set(...points[i]);
    g.add(s);
  }
  return g;
}

export function flat(w, d, m, x = 0, y = 0, z = 0) {
  const geo = new THREE.PlaneGeometry(w, d);
  if (m.userData.uv) { const uv = geo.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * w, uv.getY(i) * d); }
  const mesh = new THREE.Mesh(geo, m);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.set(x, y, z);
  mesh.receiveShadow = true;
  return mesh;
}

// Rectangle (x0..x1, z0..z1) with rectangular holes, as a flat mesh. Shape y maps to world -z after the rotation.
export function rectWithHoles(x0, x1, z0, z1, holes, m, y = 0) {
  const s = new THREE.Shape([[x0, -z1], [x1, -z1], [x1, -z0], [x0, -z0]].map(([x, yy]) => new THREE.Vector2(x, yy)));
  for (const h of holes || []) {
    const p = new THREE.Path();
    [[h.x0, -h.z1], [h.x0, -h.z0], [h.x1, -h.z0], [h.x1, -h.z1]].forEach(([x, yy], i) => (i ? p.lineTo(x, yy) : p.moveTo(x, yy)));
    s.holes.push(p);
  }
  const mesh = new THREE.Mesh(new THREE.ShapeGeometry(s), m);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = y;
  mesh.receiveShadow = true;
  return mesh;
}

// Extrude a 2D outline (array of [x, y]) along z by `depth`, centred on z = 0.
export function extrudeProfile(pts, depth, m) {
  const shape = new THREE.Shape(pts.map(([x, y]) => new THREE.Vector2(x, y)));
  const geo = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false });
  geo.translate(0, 0, -depth / 2);
  return shadowed(new THREE.Mesh(geo, m));
}

export function outline(mesh, color = 0x5a6572) {
  const e = new THREE.LineSegments(new THREE.EdgesGeometry(mesh.geometry, 20), lineMat(color));
  mesh.add(e);
  return mesh;
}

export function lineSet(segments, color) {
  const pos = [];
  for (const [a, b] of segments) pos.push(...a, ...b);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  return new THREE.LineSegments(g, lineMat(color));
}

export function textPlane(lines, w, h, { bg = '#ffffff', fg = '#14233a', accent = '#e8590c' } = {}) {
  const K = 2, c = document.createElement('canvas');   // 1024 px wide so small print stays sharp up close
  c.width = 512 * K; c.height = Math.round(512 * K * h / w);
  const x = c.getContext('2d');
  x.fillStyle = bg; x.fillRect(0, 0, c.width, c.height);
  x.fillStyle = accent; x.fillRect(0, 0, c.width, 14 * K);
  x.fillStyle = fg; x.textBaseline = 'top';
  const step = (c.height - 34 * K) / lines.length, room = c.width - 52 * K;
  lines.forEach((t, i) => {
    const wt = i === 0 ? 700 : 500; let fs = Math.min(46 * K, step * 0.72);
    x.font = `${wt} ${fs}px Arial, sans-serif`;
    const tw = x.measureText(t).width; if (tw > room) { fs *= room / tw; x.font = `${wt} ${fs}px Arial, sans-serif`; }   // shrink a long line to fit instead of clipping it
    x.fillText(t, 26 * K, 26 * K + i * step);
  });
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
  return new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex }));
}

// Flat polygon (3 or more points, in order) with metre UVs measured along its first edge and up the slope. Used for roofs and gables.
export function face(points, m, cast = true) {
  const P = points.map((p) => new THREE.Vector3(...p)), n = new THREE.Vector3().crossVectors(P[1].clone().sub(P[0]), P[2].clone().sub(P[0])).normalize();
  const e1 = P[1].clone().sub(P[0]).normalize(), e2 = new THREE.Vector3().crossVectors(n, e1).normalize();
  const pos = [], uv = [];
  for (let i = 1; i < P.length - 1; i++) for (const q of [P[0], P[i], P[i + 1]]) { pos.push(q.x, q.y, q.z); const r = q.clone().sub(P[0]); uv.push(r.dot(e1), r.dot(e2)); }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.computeVertexNormals();
  const mesh = new THREE.Mesh(g, m); mesh.castShadow = cast; mesh.receiveShadow = true; return mesh;
}

// Crushed rock or gravel: many small rounded stones, each a jittered low-poly ball with its own grey-brown tint.
// One instanced mesh, seeded so the pile looks the same on every visit.
export function stones(n, { x0, x1, z0, z1, y = 0, size = 0.045, seed = 5 } = {}) {
  const r = rng(seed), geo = new THREE.IcosahedronGeometry(size, 1), p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) { const k = 0.8 + r() * 0.4; p.setXYZ(i, p.getX(i) * k, p.getY(i) * k * 0.68, p.getZ(i) * k); }
  geo.computeVertexNormals();
  const inst = new THREE.InstancedMesh(geo, new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.95 }), n);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), sc = new THREE.Vector3(), t = new THREE.Vector3(), col = new THREE.Color();
  for (let i = 0; i < n; i++) {
    e.set((r() - 0.5) * 0.7, r() * 6.28, (r() - 0.5) * 0.7); q.setFromEuler(e); sc.setScalar(0.6 + r() * 0.9);
    t.set(x0 + r() * (x1 - x0), y + size * 0.3 + r() * size * 0.4, z0 + r() * (z1 - z0));
    inst.setMatrixAt(i, m4.compose(t, q, sc)); inst.setColorAt(i, col.setHSL(0.07 + r() * 0.06, 0.04 + r() * 0.08, 0.36 + r() * 0.3));
  }
  inst.castShadow = true; inst.receiveShadow = true;
  return inst;
}

export function disposeTree(obj) {
  obj.traverse((o) => {
    o.geometry?.dispose?.();
    for (const m of [o.material ?? []].flat()) {
      for (const v of Object.values(m)) if (v?.isTexture) v.dispose();
      m.dispose?.();
    }
  });
}

export const kit = { THREE, C, mat, getTex, boxUV, face, ghost, lineMat, box, cyl, rod, pipe, flat, rectWithHoles, extrudeProfile, outline, lineSet, textPlane, stones, disposeTree };

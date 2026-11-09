// Shared timber wall frame for Steps 3 and 4. Every wall is built once as merged timber meshes so the
// house stays light to draw: studs at 450 mm, plates, noggings, king and trimmer studs, lintels, sills and cripples.
// Sizes are typical (90 x 45 MGP10 pine). The engineer's drawings and the AS 1684 tables govern a real job.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { HOUSE } from './site.js';

const { x0: X0, x1: X1, z0: Z0, z1: Z1 } = HOUSE;
// Two storeys: ground wall H, then a first-floor zone FL (280 mm joists plus a 20 mm sheet), then upper walls H2. Sizes are typical.
export const F = { H: 2.7, SLAB: 0.15, E: 0.195, STUD: 0.45, T: 0.045, D: 0.09, HEAD: 2.1, LH: 0.19, FL: 0.30, H2: 2.55, FJ: 0.28, FS: 0.02 };
export const FLOOR1 = F.SLAB + F.H + F.FL;          // top of the first-floor sheet above the ground (3.15 m)
export const PLATE_UP = FLOOR1 + F.H2;               // top of the upper wall plates (5.70 m)
const e = F.E;

// a and b are plan points (x, z) on the wall centreline. `open` lists openings by their position along the wall's own axis:
// world x for walls running east-west, world z for walls running north-south. sill 0 means a doorway.
export const WALLS = [
  { id: 'front', name: 'Front wall', ext: true, a: [X0 + e, Z1 - e], b: [X1 - e, Z1 - e], open: [{ at: -3.4, w: 1.8, sill: 0.9 }, { at: 1.5, w: 0.92, sill: 0 }, { at: 3.9, w: 1.5, sill: 0.9 }] },
  { id: 'back', name: 'Back wall', ext: true, a: [X0 + e, Z0 + e], b: [X1 - e, Z0 + e], open: [{ at: -2, w: 2.4, sill: 0 }, { at: 3, w: 1.5, sill: 0.9 }] },
  { id: 'west', name: 'West wall', ext: true, a: [X0 + e, Z0 + e + 0.045], b: [X0 + e, Z1 - e - 0.045], open: [{ at: -2.7, w: 1.2, sill: 0.9 }, { at: 3, w: 1.2, sill: 0.9 }, { at: 8.5, w: 1.5, sill: 0.9 }] },
  { id: 'east', name: 'East wall', ext: true, a: [X1 - e, Z0 + e + 0.045], b: [X1 - e, Z1 - e - 0.045], open: [{ at: -2.7, w: 1.2, sill: 0.9 }, { at: 3, w: 0.9, sill: 1.5 }, { at: 8.5, w: 1.5, sill: 0.9 }] },
  { id: 'i1', name: 'Internal wall', ext: false, a: [X0 + e + 0.045, 0], b: [-0.045, 0], open: [{ at: -2.2, w: 0.82, sill: 0 }] },
  { id: 'i2', name: 'Internal wall', ext: false, a: [0.045, 0], b: [X1 - e - 0.045, 0], open: [{ at: 2.5, w: 0.82, sill: 0 }] },
  { id: 'i3', name: 'Internal wall', ext: false, a: [X0 + e + 0.045, 5.5], b: [X1 - e - 0.045, 5.5], open: [{ at: -4.6, w: 0.82, sill: 0 }, { at: 2, w: 0.82, sill: 0 }] },
  { id: 'i4', name: 'Internal wall', ext: false, a: [0, 0.045], b: [0, 5.455], open: [{ at: 2.7, w: 0.82, sill: 0 }] },
];
// Upper storey: the same wall lines stacked on the ground walls (loads go straight down), with its own openings.
const up = (w, id, open) => ({ ...w, id, name: w.name + ' (upper)', open });
export const WALLS_UP = [
  up(WALLS[0], 'front2', [{ at: -3.4, w: 1.8, sill: 0.9 }, { at: 1.5, w: 1.2, sill: 0.9 }, { at: 3.9, w: 1.5, sill: 0.9 }]),
  up(WALLS[1], 'back2', [{ at: -2.4, w: 1.8, sill: 0.9 }, { at: 3, w: 1.5, sill: 0.9 }]),
  up(WALLS[2], 'west2', [{ at: -2.7, w: 1.2, sill: 0.9 }, { at: 3, w: 1.2, sill: 0.9 }, { at: 8.5, w: 1.5, sill: 0.9 }]),
  up(WALLS[3], 'east2', [{ at: -2.7, w: 1.2, sill: 0.9 }, { at: 3, w: 1.2, sill: 0.9 }, { at: 8.5, w: 1.5, sill: 0.9 }]),
  up(WALLS[4], 'i12', [{ at: -2.2, w: 0.82, sill: 0 }]),
  up(WALLS[5], 'i22', [{ at: 2.5, w: 0.82, sill: 0 }]),
  up(WALLS[6], 'i32', [{ at: -4.6, w: 0.82, sill: 0 }, { at: 2, w: 0.82, sill: 0 }]),
  up(WALLS[7], 'i42', [{ at: 2.7, w: 0.82, sill: 0 }]),
];
// Stair void in the first floor: against the front face of the i3 wall, x from the 5th to the 13th joist, 1.05 m deep. The east end is cut back to x = 0 so the nosing line is about 0.66 m up where the floor above starts,
// which leaves about 2.2 m to the underside of the floor frame (the headroom figure itself is Part 10.3 and is flagged Confirm).
export const STAIR = { x0: -3.5367, x1: 0.0, z0: 5.545, z1: 6.6, xb: 0.458, run: 4.0, n: 17 };   // xb: first riser; the stair climbs towards -x
// A rectangle [x0, x1, z0, z1] with the stair void taken out of it: returns the pieces left over (the rectangle itself when it misses the void).
export function minusVoid(x0, x1, z0, z1) {
  const v = STAIR;
  if (x1 <= v.x0 || x0 >= v.x1 || z1 <= v.z0 || z0 >= v.z1) return [[x0, x1, z0, z1]];
  const out = [], a = Math.max(x0, v.x0), b = Math.min(x1, v.x1);
  if (x0 < v.x0) out.push([x0, v.x0, z0, z1]);
  if (x1 > v.x1) out.push([v.x1, x1, z0, z1]);
  if (z0 < v.z0) out.push([a, b, z0, v.z0]);
  if (z1 > v.z1) out.push([a, b, v.z1, z1]);
  return out;
}

// Orient a wall so local +z (the thickness axis) points into the house, then express its openings along local x.
export function wallInfo(w) {
  let [a, b] = [w.a, w.b], dx = b[0] - a[0], dz = b[1] - a[1];
  const mid = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  if ((-dz) * (0 - mid[0]) + dx * (3 - mid[1]) < 0) { [a, b] = [b, a]; dx = -dx; dz = -dz; }
  const len = Math.hypot(dx, dz), ux = dx / len, uz = dz / len, eastWest = Math.abs(ux) > 0.5;
  const open = w.open.map((o) => {
    const p = eastWest ? [o.at, mid[1]] : [mid[0], o.at];
    return { ...o, u: (p[0] - a[0]) * ux + (p[1] - a[1]) * uz };
  });
  return { ...w, a, b, len, theta: Math.atan2(-uz, ux), dir: [ux, uz], open, mid };
}

// Members for one wall in its own coordinates: x along the wall, y up from the slab, z through the thickness.
export function wallMembers(len, open, { plate2 = false, h } = {}) {
  const { T, D, HEAD, LH, STUD } = F, H = h ?? F.H, studH = H - 3 * T, y0 = T + studH / 2;
  const m = { frame: [], plate2: [], verts: [], zones: [] };
  const add = (w, h, d, x, y, z, cat) => m.frame.push([w, h, d, x, y, z || 0, cat]);
  const zones = open.map((o) => ({ l: o.u - o.w / 2, r: o.u + o.w / 2, o }));
  m.zones = zones;
  const inKing = (x) => zones.some((z) => x > z.l - 2 * T - 0.05 && x < z.r + 2 * T + 0.05);
  const inOpen = (x) => zones.find((z) => x > z.l && x < z.r);
  // bottom plate, cut across doorways
  const cuts = zones.filter((z) => z.o.sill === 0).sort((p, q) => p.l - q.l);
  let from = 0;
  for (const c of [...cuts, { l: len, r: len }]) { if (c.l - from > 0.02) add(c.l - from, T, D, (from + c.l) / 2, T / 2, 0, 'bp'); from = c.r; }
  add(len, T, D, len / 2, H - 2 * T + T / 2, 0, 'tp');
  if (plate2) m.plate2.push([len, T, D, len / 2, H - T / 2, 0, 'tp']);
  // full-height studs
  const verts = [T / 2, len - T / 2];
  for (let x = T / 2 + STUD; x < len - T / 2 - 0.1; x += STUD) if (!inKing(x)) verts.push(x);
  for (const z of zones) verts.push(z.l - 1.5 * T, z.r + 1.5 * T);
  for (const x of verts) add(T, studH, D, x, y0, 0, 'stud');
  for (const z of zones) for (const x of [z.l - 1.5 * T, z.r + 1.5 * T]) { const i = m.frame.findIndex((q) => q[3] === x && q[6] === 'stud'); if (i >= 0) m.frame[i][6] = 'king'; }
  // trimmers and lintels, sills and cripples
  for (const z of zones) {
    const th = HEAD - T;
    add(T, th, D, z.l - T / 2, T + th / 2, 0, 'trim'); add(T, th, D, z.r + T / 2, T + th / 2, 0, 'trim');
    add(z.r - z.l + 2 * T, LH, D, (z.l + z.r) / 2, HEAD + LH / 2, 0, 'lintel');
    verts.push(z.l - T / 2, z.r + T / 2);
    const top = HEAD + LH, ceil = H - 2 * T;
    for (let x = T / 2 + STUD; x < len - T / 2 - 0.05; x += STUD) {
      if (x > z.l + 0.02 && x < z.r - 0.02) {
        add(T, ceil - top, D, x, top + (ceil - top) / 2, 0, 'crip');
        if (z.o.sill > 0) add(T, z.o.sill - 2 * T, D, x, T + (z.o.sill - 2 * T) / 2, 0, 'crip');
      }
    }
    if (z.o.sill > 0) add(z.r - z.l, T, D, (z.l + z.r) / 2, z.o.sill - T / 2, 0, 'sill');
  }
  // noggings between neighbouring verticals, never across an opening, alternating height so each can be nailed
  const vs = [...new Set(verts.map((v) => +v.toFixed(4)))].sort((p, q) => p - q);
  vs.forEach((x, i) => {
    const n = vs[i + 1]; if (n === undefined) return;
    const a = x + T / 2, b = n - T / 2; if (b - a < 0.1) return;
    const mid = (a + b) / 2; if (inOpen(mid)) return;
    add(b - a, T, D, mid, 1.35 + (i % 2 ? 0.05 : -0.05), 0, 'nog');
  });
  m.verts = vs;
  return m;
}

// Merge every mesh under a static group into one mesh per material, keeping each part's placement. Cuts draw calls for groups made of many small parts (window frames, seals).
export function mergeStatic(group) {
  group.updateMatrixWorld(true);
  const inv = group.matrixWorld.clone().invert(), by = new Map();
  group.traverse((o) => {
    if (!o.isMesh) return;
    const g = o.geometry.clone(); g.applyMatrix4(new THREE.Matrix4().multiplyMatrices(inv, o.matrixWorld));
    if (!by.has(o.material)) by.set(o.material, { gs: [], cast: o.castShadow, recv: o.receiveShadow });
    by.get(o.material).gs.push(g);
  });
  if (!by.size) return group;
  group.clear();
  for (const [mt, { gs, cast, recv }] of by) { const g = mergeGeometries(gs, false); if (!g) continue; const mm = new THREE.Mesh(g, mt); mm.castShadow = cast; mm.receiveShadow = recv; group.add(mm); }
  return group;
}

export function mergeBoxes(list, mat, boxUV) {
  const geos = list.map(([w, h, d, x, y, z]) => { const g = new THREE.BoxGeometry(w, h, d); if (mat.userData.uv) boxUV(g, w, h, d, mat.userData.uv); g.translate(x, y, z); return g; });
  if (!geos.length) return null;
  const mesh = new THREE.Mesh(mergeGeometries(geos, false), mat); geos.forEach((g) => g.dispose());
  mesh.castShadow = true; mesh.receiveShadow = true; return mesh;
}

// Pure layout (no 3D objects): members, bracing, props and tie-down rods for every wall. The 3D build and the plan drawing both read it.
export function layout(walls = WALLS, h = F.H) {
  const { T } = F;
  return walls.map(wallInfo).map((w) => {
    const mem = wallMembers(w.len, w.open, { plate2: true, h });
    const spans = []; let at = 0;
    for (const z of [...mem.zones].sort((p, q) => p.l - q.l)) { spans.push([at, z.l - 2 * T - 0.05]); at = z.r + 2 * T + 0.05; }
    spans.push([at, w.len]);
    const solid = spans.filter(([p, q]) => q - p > 0.9).sort((p, q) => (q[1] - q[0]) - (p[1] - p[0]));
    const free = (u) => !mem.zones.some((z) => u > z.l - 0.25 && u < z.r + 0.25);
    const out = { w, mem, brace: [], temp: [], tie: [] };
    if (w.ext) {
      solid.forEach((sp, i) => {
        const wide = Math.min(2.4, Math.floor((sp[1] - sp[0] - 0.1) / 1.2) * 1.2);
        if (i === 0 && wide >= 1.2) out.brace.push({ kind: 'ply', u0: sp[0] + 0.05, u1: sp[0] + 0.05 + wide });
        else out.brace.push({ kind: 'strap', u0: sp[0] + 0.1, u1: sp[1] - 0.1 });
      });
      for (const f of [0.1, 0.5, 0.9]) if (free(w.len * f)) out.temp.push(w.len * f);
      for (let u = 0.3; u < w.len - 0.2; u += 1.8) if (free(u)) out.tie.push(u);
    }
    return out;
  });
}

// World position of a point given as (distance along a wall, height, offset through the wall, +z inward).
export const worldAt = (w, u, y, z = 0) => [w.a[0] + w.dir[0] * u - w.dir[1] * z, y + F.SLAB, w.a[1] + w.dir[1] * u + w.dir[0] * z];

// Everything for the framed house. The caller adds the groups it needs as layers.
export function buildFrames(kit) {
  const { mat, boxUV, cyl, rod, box, lineSet } = kit;
  const timber = mat(0xffffff, { tex: 'timber' }), ply = mat(0xffffff, { tex: 'timber', color: 0xe8c690 }), steel = mat(0xb8c0c9, { metalness: 0.6, roughness: 0.35 });
  const { H, T, D, SLAB } = F;
  const g = { chalk: new THREE.Group(), walls: new THREE.Group(), plate2: new THREE.Group(), temp: new THREE.Group(), brace: new THREE.Group(), tie: new THREE.Group(),
    floor1: new THREE.Group(), floor1S: new THREE.Group(), stairT: new THREE.Group(), walls2: new THREE.Group(), plate2u: new THREE.Group(), brace2: new THREE.Group() };
  const lay = layout(), tilts = [], chalkSegs = [];
  lay.forEach(({ w, mem, brace, temp, tie }, i) => {
    const pivot = new THREE.Group(); pivot.position.set(w.a[0], SLAB, w.a[1]); pivot.rotation.y = w.theta;
    const tilt = new THREE.Group(); pivot.add(tilt); tilt.add(mergeBoxes(mem.frame, timber, boxUV));
    g.walls.add(pivot); tilts.push({ tilt, i });
    const still = (parent) => { const s = new THREE.Group(); s.position.copy(pivot.position); s.rotation.y = w.theta; parent.add(s); return s; };
    const p2 = mergeBoxes(mem.plate2, timber, boxUV); if (p2) still(g.plate2).add(p2);
    chalkSegs.push([[w.a[0], SLAB + 0.004, w.a[1]], [w.b[0], SLAB + 0.004, w.b[1]]]);
    if (!w.ext) return;
    const tw = still(g.temp);
    for (const u of temp) { tw.add(rod([u, 2.35, D / 2 + 0.02], [u + 0.7, 0.03, 1.75], 0.022, ply)); tw.add(cyl(0.025, 0.4, ply, u + 0.7, 0.15, 1.75, 6)); }
    const bw = still(g.brace);
    for (const b of brace) {
      if (b.kind === 'ply') { const wide = b.u1 - b.u0, h = H - 2 * T - 0.02; bw.add(box(wide, h, 0.012, ply, (b.u0 + b.u1) / 2, 0.045 + h / 2, -D / 2 - 0.006)); }
      else bw.add(rod([b.u0, 0.05, D / 2 + 0.01], [b.u1, H - 2 * T, D / 2 + 0.01], 0.01, steel));
    }
    const rw = still(g.tie);
    for (const u of tie) { rw.add(cyl(0.007, H, steel, u, H / 2, D / 2 + 0.014, 8)); rw.add(cyl(0.028, 0.008, steel, u, H - 2 * T + 0.004, D / 2 + 0.014, 10)); rw.add(box(0.07, 0.003, 0.2, steel, u, H + 0.0015, 0)); }
  });
  g.chalk.add(lineSet(chalkSegs, 0xffffff));

  // first floor (platform floor: framed and sheeted before the upper walls stand on it) and the upper walls
  const Y1 = SLAB + H, YJ = Y1 + F.FJ / 2, XJ = [], NJ = 24, DX = (X1 - X0 - 2 * e) / NJ;
  for (let k = 0; k <= NJ; k++) XJ.push(X0 + e + k * DX);
  const jl = [], zA = Z0 + e, zB = Z1 - e, spans = [[zA, 0], [0, 5.5], [5.5, zB]], sv = STAIR;
  const joist = (x, za, zb) => { if (zb - za > 0.05) jl.push([T, F.FJ, zb - za - 0.01, x, YJ, (za + zb) / 2, 'joist']); };
  for (const x of XJ) {
    const inVoid = x > sv.x0 + 0.01 && x < sv.x1 - 0.01;
    joist(x, spans[0][0], spans[0][1]); joist(x, spans[1][0], spans[1][1]);
    joist(x, inVoid ? sv.z1 + 2 * T : spans[2][0], spans[2][1]);                               // cut short at the stair header
  }
  const hx = (sv.x0 + sv.x1) / 2, hw = sv.x1 - sv.x0;
  jl.push([hw, F.FJ, T, hx, YJ, sv.z1 + T / 2, 'joist'], [hw, F.FJ, T, hx, YJ, sv.z1 + 1.5 * T, 'joist']);                                  // doubled header
  for (const x of [sv.x0, sv.x1]) for (const s of [-1, 1]) jl.push([T, F.FJ, zB - 5.5 - 0.01, x + s * T, YJ, (5.5 + zB) / 2, 'joist']);       // doubled trimmers
  jl.push([X1 - X0 - 2 * e + 2 * T, F.FJ, T, 0, YJ, zA - T / 2, 'rim'], [X1 - X0 - 2 * e + 2 * T, F.FJ, T, 0, YJ, zB + T / 2, 'rim']);
  const fj = mergeBoxes(jl, timber, boxUV); g.floor1.add(fj);
  const ys = SLAB + H + F.FJ + F.FS / 2, sh = (x0, x1, z0, z1) => box(x1 - x0, F.FS, z1 - z0, ply, (x0 + x1) / 2, ys, (z0 + z1) / 2);
  const zMin = Z0 + e - T, zMax = Z1 - e + T, xMin = X0 + e - T, xMax = X1 - e + T;
  g.floor1S.add(sh(xMin, sv.x0, zMin, zMax), sh(sv.x1, xMax, zMin, zMax), sh(sv.x0, sv.x1, zMin, sv.z0), sh(sv.x0, sv.x1, sv.z1, zMax));
  const lay2 = layout(WALLS_UP, F.H2);
  lay2.forEach(({ w, mem, brace }) => {
    const pivot = new THREE.Group(); pivot.position.set(w.a[0], FLOOR1, w.a[1]); pivot.rotation.y = w.theta;
    pivot.add(mergeBoxes(mem.frame, timber, boxUV)); g.walls2.add(pivot);
    const still = (parent) => { const s = new THREE.Group(); s.position.copy(pivot.position); s.rotation.y = w.theta; parent.add(s); return s; };
    const p2 = mergeBoxes(mem.plate2, timber, boxUV); if (p2) still(g.plate2u).add(p2);
    if (!w.ext) return;
    const bw = still(g.brace2);
    for (const b of brace) {
      if (b.kind === 'ply') { const wide = b.u1 - b.u0, hh = F.H2 - 2 * T - 0.02; bw.add(box(wide, hh, 0.012, ply, (b.u0 + b.u1) / 2, 0.045 + hh / 2, -D / 2 - 0.006)); }
      else bw.add(rod([b.u0, 0.05, D / 2 + 0.01], [b.u1, F.H2 - 2 * T, D / 2 + 0.01], 0.01, steel));
    }
  });
  // rough stair for the builders: 17 risers up to the first floor beside the i3 wall, two timber strings and plain treads (the finished stair comes at fix-out)
  g.stairT.name = 'stairT';
  { const R = (FLOOR1 - SLAB) / sv.n, Gd = sv.run / (sv.n - 1), W = 0.95, zc = sv.z0 + 0.035 + W / 2, geos = [], ang = Math.atan2(R, -Gd);
    const p0 = [sv.xb, SLAB + R], p1 = [sv.xb - 15 * Gd, SLAB + 16 * R], len = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]) + 0.1;
    for (const s2 of [-1, 1]) { const gs = new THREE.BoxGeometry(len, 0.24, T); gs.rotateZ(ang); gs.translate((p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2 - 0.12, zc + s2 * (W / 2 + T / 2)); geos.push(gs); }
    for (let t = 1; t <= 16; t++) { const gt = new THREE.BoxGeometry(Gd + 0.02, 0.032, W); gt.translate(sv.xb - (t - 1) * Gd - Gd / 2 + 0.01, SLAB + t * R - 0.016, zc); geos.push(gt); }
    const sm = new THREE.Mesh(mergeGeometries(geos, false), timber); geos.forEach((q) => q.dispose()); sm.castShadow = true; sm.receiveShadow = true; g.stairT.add(sm); }
  // frames lie flat inward when s = 0 and stand up as s goes to 1, wall by wall
  const stand = (s) => {
    for (const { tilt, i } of tilts) {
      const k = Math.min(1, Math.max(0, s * 1.7 - i * 0.1)), ease = k * k * (3 - 2 * k);
      tilt.rotation.x = (1 - ease) * (Math.PI / 2); tilt.position.y = (1 - ease) * T;
    }
  };
  stand(1);
  return { groups: g, stand, lay, lay2, material: timber, ply, steel };
}

// The cured slab the frame stands on (plain, 150 mm above ground), with its rebate edge.
export function buildSlab(kit) {
  const { mat, box } = kit, c = mat(0xffffff, { tex: 'concrete' }), g = new THREE.Group();
  g.add(box(X1 - X0, 0.1, Z1 - Z0, c, 0, 0.1, (Z0 + Z1) / 2));
  return g;
}

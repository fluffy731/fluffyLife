// Step 14: tiling and floor coverings. The Step 13 house (doors, skirting, kitchen and wardrobe fixed) gets floor and wall tiles in the bathroom over the Step 10 membrane, dry-area tiles in the hall and laundry,
// timber boards in the living areas and carpet in the east bedroom. Rules marked Verified come from the BPC Guide to Standards and Tolerances 2026 (sections 14 and 15), the HIA article on movement joints
// (3 April 2025, which refers to AS 3958:2023), the NCC 2022 pages from Steps 10 and 13 and the BPC wet-area page. AS 3958, AS 1884, AS 2455.1 and AS 4586 were not opened (paywalled), so adhesive coverage,
// curing times and slab moisture limits are Typical or Confirm. Tile, board and carpet sizes are common sizes, not rules, and layers in the zoom rooms are drawn thicker than real.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import step13 from './step-13.js';
import { grp } from './step-06.js';
import { F } from './frame.js';
import { drawings, howto, trades, materials, quotes, quoteTips, inspections, exam, sources, caution } from './step-14-study.js';

const SL = F.SLAB;
const BX0 = -5.2105, BX1 = -2.0945, BZ0 = 1.295, BZ1 = 5.4055;   // bathroom floor, kept 15 mm off the lined walls so the wall tiles and sealant fit
const WX = -3.6, WZ = 2.4;                                         // floor waste from Step 2 and Step 10
const FALL = 1 / 60, SMIN = 0.012;                                 // screed 12 mm at the waste, falling 1 in 60 (inside 1:80 to 1:50)
const fy = (x, z) => SL + SMIN + Math.hypot(x - WX, z - WZ) * FALL; // top of the screed

const phases = [
  { title: 'Delivery and storage', text: 'Tiles, adhesive, grout, timber boards, carpet and underlay arrive. Batches and shades are checked against the order, and everything is stored dry and flat until the trade needs it.' },
  { title: 'Substrate checks and set-out', text: 'The slab and screed are checked for flatness, falls and dryness, and the waterproofer\'s membrane is checked and protected. The tiler marks centre lines and dry-lays a row of tiles to see the cuts.' },
  { title: 'Floor and wall tiling', text: 'Adhesive is combed onto the substrate and tiles are bedded with even joints, falling to the waste. Wall tiles go up over the membrane. The dry-area tiles in the hall and laundry are laid.' },
  { title: 'Grout, movement joints and sealing', text: 'Joints are grouted and cleaned. Flexible sealant goes in the corners and around the floor perimeter, and a threshold strip goes in the bathroom doorway.' },
  { title: 'Timber boards and carpet', text: 'Underlay and timber boards go down with a gap at every wall, and carpet is stretched over underlay and gripper rods. Strips cover the change of material at each doorway.' },
  { title: 'Inspection', text: 'Tiles are checked for lippage, cracks, grout and falls, timber for gaps and levelness, and carpet for seams, all from a normal viewing position of 1.5 m or more. Defects are listed.' },
  { title: 'Protection and handover to painting', text: 'Floors are covered with sheets and the joints are taped so the painter and the final fix do not damage them. Records and spare tiles are kept for handover.' },
];

const MAT = (kit) => {
  const { mat, ghost } = kit;
  return {
    timber: mat(0xffffff, { tex: 'timber' }), oak: mat(0xf0d3a2, { tex: 'timber' }), board: mat(0xe8e0cc, { roughness: 0.92, emissive: 0x5a5242 }), conc: mat(0xb3b2ad, { tex: 'concrete', bump: 1.6 }),
    screed: mat(0xb4b0a6, { roughness: 0.96 }), blue: mat(0x2f6fae, { roughness: 0.5 }), adh: mat(0xcdc6b4, { roughness: 0.95 }), gap: mat(0x4d5153, { roughness: 0.9 }), grout: mat(0xaeb0ab, { roughness: 0.95, emissive: 0x2a2b28 }),
    tile: mat(0xe3e8e8, { roughness: 0.3, emissive: 0x2c2f2f }), wtile: mat(0xd3e2e6, { roughness: 0.25, emissive: 0x242f32 }), dtile: mat(0xa9aeb0, { roughness: 0.45, emissive: 0x1f2122 }),
    steel: mat(0xb9c2cd, { metalness: 0.6, roughness: 0.35 }), brass: mat(0xc9a24d, { metalness: 0.7, roughness: 0.4 }), dark: mat(0x1b1d20, { roughness: 0.7 }), white: mat(0xf4f4f2, { roughness: 0.5, emissive: 0x3a3a38 }),
    seal: mat(0x2b8fd6, { roughness: 0.5, emissive: 0x0f3a5a }), card: mat(0xc8ad82, { roughness: 0.9 }), sheet: mat(0xdad8cf, { roughness: 0.85, emissive: 0x34332f }), bag: mat(0xe5e1d6, { roughness: 0.9, emissive: 0x3d3a33 }), carpet: mat(0x8c7f74, { roughness: 1, emissive: 0x211b16 }),
    under: mat(0x6f7480, { roughness: 1 }), foam: mat(0xb9a98a, { roughness: 1 }), chalk: mat(0x2b8fd6, { roughness: 0.6, emissive: 0x0f3a5a }), yellow: mat(0xf2c230, { roughness: 0.6 }), trim: mat(0xe6cfa6, { roughness: 0.7, emissive: 0x3d3322 }),
    pail: mat(0x3d6fb5, { roughness: 0.6 }), red: mat(0xd62828, { roughness: 0.6 }),
    redGhost: ghost(0xd62828, 0.5), okGhost: ghost(0x2fbf71, 0.45), sphere: ghost(0x2b8fd6, 0.4),
  };
};

// Intervals that cover [a, b] with a centred run of full tiles and a cut tile at each end that is not a sliver (at least half a tile).
function cuts(a, b, size, gap) {
  const w = b - a; let n = Math.floor((w + gap) / (size + gap)), e = (w - (n * size + (n - 1) * gap)) / 2;
  while (e - gap > 0.02 && e - gap < size / 2 && n > 1) { n -= 1; e = (w - (n * size + (n - 1) * gap)) / 2; }
  const out = [], c = e - gap > 0.02;
  if (c) out.push([a, a + e - gap]);
  for (let i = 0; i < n; i++) { const s = a + e + i * (size + gap); out.push([s, s + size]); }
  if (c) out.push([b - e + gap, b]);
  return out;
}

/* ---------- walk scene ---------- */
function build(kit) {
  const { box, cyl, rod, textPlane } = kit;
  const mk = (n) => { const g = new THREE.Group(); g.name = n; return g; };
  const s13 = step13.build(kit), m = MAT(kit);
  const KEEP13 = ['doors', 'skirt', 'kitchen', 'wardrobe'];
  const layers = [...s13.layers.slice(0, s13.baseCount), ...s13.layers.slice(s13.baseCount).filter((l) => KEEP13.includes(l.group.name))].map(({ group }) => ({ group }));
  const sign = (lines, w, h, x, y, z, ry = 0) => { const s = textPlane(lines, w, h); s.position.set(x, y, z); s.rotation.y = ry; return s; };
  const geoMesh = (geos, mt) => { const me = new THREE.Mesh(mergeGeometries(geos, false), mt); me.receiveShadow = true; me.castShadow = false; return me; };
  const rng = (() => { let s = 11; return () => (s = (s * 16807) % 2147483647) / 2147483647; })();

  // a surface that falls to the waste, lifted by a few millimetres
  const floorMesh = (mt, lift = 0) => {
    const w = BX1 - BX0, d = BZ1 - BZ0, geo = new THREE.PlaneGeometry(w, d, 26, 34);
    geo.rotateX(-Math.PI / 2);
    const p = geo.attributes.position, cx = (BX0 + BX1) / 2, cz = (BZ0 + BZ1) / 2;
    for (let i = 0; i < p.count; i++) { const x = p.getX(i) + cx, z = p.getZ(i) + cz; p.setXYZ(i, x, fy(x, z) + lift, z); }
    geo.computeVertexNormals();
    const me = new THREE.Mesh(geo, mt); me.receiveShadow = true; return me;
  };
  // a flat tile laid on the falling floor and tilted to the local fall
  const tq = new THREE.Quaternion(), UP = new THREE.Vector3(0, 1, 0), tn = new THREE.Vector3();
  const tileGeo = (cx, cz, w, d, t, lift) => {
    const g = new THREE.BoxGeometry(w, t, d), dist = Math.hypot(cx - WX, cz - WZ) || 1, k = FALL / dist;
    tn.set(-(cx - WX) * k, 1, -(cz - WZ) * k).normalize(); tq.setFromUnitVectors(UP, tn); g.applyQuaternion(tq); g.translate(cx, fy(cx, cz) + lift, cz); return g;
  };
  const line = (g, pts, r, mt) => { for (let i = 0; i < pts.length - 1; i++) g.add(rod(pts[i], pts[i + 1], r, mt, 4)); };

  // membrane on the screed, covered once the tiler starts
  const membrane = mk('membrane'); membrane.add(floorMesh(m.blue, 0.002));
  for (const [x0, x1, z] of [[BX0, BX1, BZ0 + 0.004], [BX0, BX1, BZ1 - 0.004]]) membrane.add(box(x1 - x0, 0.14, 0.004, m.blue, (x0 + x1) / 2, fy(WX, z) + 0.07 - 0.02, z));
  for (const [x, z0, z1] of [[BX0 + 0.004, BZ0, BZ1]]) membrane.add(box(0.004, 0.14, z1 - z0, m.blue, x, fy(x, 3.0) + 0.05, (z0 + z1) / 2));
  const thr = mk('threshold'); thr.add(box(0.08, 0.008, 0.82, m.steel, -2.0, fy(-2.0, 3.6) + 0.015, 3.6));

  // set-out: centre lines, a dry-laid row, a straightedge and a level
  const setout = mk('setout');
  line(setout, Array.from({ length: 22 }, (_, i) => { const z = BZ0 + (BZ1 - BZ0) * i / 21; return [WX, fy(WX, z) + 0.005, z]; }), 0.003, m.chalk);
  line(setout, Array.from({ length: 22 }, (_, i) => { const x = BX0 + (BX1 - BX0) * i / 21; return [x, fy(x, 3.4) + 0.005, 3.4]; }), 0.003, m.chalk);
  { const row = []; for (const [x0, x1] of cuts(BX0, BX1, 0.3, 0.003)) { const cx = (x0 + x1) / 2; row.push(tileGeo(cx, 3.55, x1 - x0, 0.3, 0.009, 0.0065)); } setout.add(geoMesh(row, m.tile)); }
  { const se = new THREE.Group(); se.position.set(-4.4, fy(-4.4, 4.8) + 0.05, 4.8); se.rotation.y = 0.5; se.add(box(2.0, 0.04, 0.05, m.steel, 0, 0, 0), box(0.6, 0.05, 0.04, m.yellow, 0.2, 0.045, 0)); setout.add(se); }

  // floor tiles in the bathroom, with a round cut tile and a grate at the waste
  const ftiles = mk('ftiles'), fg = [];
  for (const [x0, x1] of cuts(BX0, BX1, 0.3, 0.003)) for (const [z0, z1] of cuts(BZ0, BZ1, 0.3, 0.003)) {
    const dx = Math.max(x0 - WX, 0, WX - x1), dz = Math.max(z0 - WZ, 0, WZ - z1); if (Math.hypot(dx, dz) < 0.19) continue;
    fg.push(tileGeo((x0 + x1) / 2, (z0 + z1) / 2, x1 - x0, z1 - z0, 0.009, 0.0075));
  }
  ftiles.add(geoMesh(fg, m.tile), cyl(0.19, 0.009, m.tile, WX, fy(WX, WZ) + 0.0075, WZ, 28), cyl(0.075, 0.004, m.steel, WX, fy(WX, WZ) + 0.0125, WZ, 20));
  const gapF = mk('gapF'); gapF.add(floorMesh(m.gap, 0.005));
  const groutF = mk('groutF'); groutF.add(floorMesh(m.grout, 0.0105));

  // wall tiles: the shower walls to 2.1 m, the rest lower
  const wt = [], TH = 0.6, TW = 0.3, TG = 0.003, WT = 0.009, backs = [];
  const wall = (ax, face, dir, a, b, top) => {
    const t = SL + top, mid = (a + b) / 2;
    backs.push(ax === 'z' ? new THREE.BoxGeometry(b - a, t - SL - 0.01, 0.0105).translate(mid, (t + SL + 0.01) / 2, face + dir * 0.00525) : new THREE.BoxGeometry(0.0105, t - SL - 0.01, b - a).translate(face + dir * 0.00525, (t + SL + 0.01) / 2, mid));
    for (const [s0, s1] of cuts(a, b, TW, TG)) {
      const sm = (s0 + s1) / 2, px = ax === 'z' ? sm : face + dir * 0.03, pz = ax === 'z' ? face + dir * 0.03 : sm; let y = fy(px, pz) + 0.012;
      while (y < t - 0.02) {
        const h = Math.min(TH, t - y), cy = y + h / 2, off = 0.003 + WT / 2;
        wt.push(ax === 'z' ? new THREE.BoxGeometry(s1 - s0, h, WT).translate(sm, cy, face + dir * off) : new THREE.BoxGeometry(WT, h, s1 - s0).translate(face + dir * off, cy, sm));
        y += h + TG;
      }
    }
  };
  wall('z', 1.28, 1, BX0, BX1, 2.1); wall('z', 5.4205, -1, BX0, -2.43, 1.2);
  wall('x', -5.2255, 1, BZ0, 2.4, 2.1); wall('x', -5.2255, 1, 2.43, 3.57, 0.9); wall('x', -5.2255, 1, 3.6, BZ1, 1.2);
  wall('x', -2.0795, -1, BZ0, 3.17, 1.2); wall('x', -2.0795, -1, 4.03, BZ1, 1.2);
  const wtiles = mk('wtiles'); wtiles.add(geoMesh(wt, m.wtile));
  const wgap = mk('wgap'); wgap.add(geoMesh(backs, m.gap)); const wgrout = mk('wgrout'); wgrout.add(geoMesh(backs.map((g) => g.clone()), m.grout));

  // flexible sealant in the corners and around the floor perimeter, and the doorway threshold
  const joints = mk('joints');
  const perim = (x0, z0, x1, z1) => line(joints, Array.from({ length: 12 }, (_, i) => { const u = i / 11, x = x0 + (x1 - x0) * u, z = z0 + (z1 - z0) * u; return [x, fy(x, z) + 0.0125, z]; }), 0.0035, m.seal);
  perim(BX0 - 0.004, BZ0 - 0.004, BX1 + 0.004, BZ0 - 0.004); perim(BX0 - 0.004, BZ1 + 0.004, -2.43, BZ1 + 0.004); perim(BX0 - 0.004, BZ0, BX0 - 0.004, BZ1); perim(BX1 + 0.004, BZ0, BX1 + 0.004, 3.17); perim(BX1 + 0.004, 4.03, BX1 + 0.004, BZ1);
  for (const [x, z, h] of [[-5.2255 + 0.012, 1.28 + 0.012, 2.1], [-2.0795 - 0.012, 1.28 + 0.012, 1.2], [-5.2255 + 0.012, 5.4205 - 0.012, 1.2]]) joints.add(rod([x, fy(x, z) + 0.014, z], [x, SL + h, z], 0.012, m.seal, 4));

  // dry-area tiles in the laundry and hall, timber boards in the living areas, carpet in the east bedroom
  const dry = mk('dry'), dg = [];
  for (const [xa, xb, za, zb] of [[-5.2055, -0.0995, 0.0995, 1.1005], [-1.9005, -0.0995, 1.1205, 5.4005]]) for (const [x0, x1] of cuts(xa, xb, 0.45, 0.003)) for (const [z0, z1] of cuts(za, zb, 0.45, 0.003)) dg.push(new THREE.BoxGeometry(x1 - x0, 0.01, z1 - z0).translate((x0 + x1) / 2, SL + 0.005, (z0 + z1) / 2));
  dry.add(geoMesh(dg, m.dtile), box(5.2, 0.006, 1.0, m.grout, -2.65, SL + 0.003, 0.6), box(1.8, 0.006, 4.3, m.grout, -1.0, SL + 0.003, 3.26));
  const timber = mk('timber'), tg = [];
  for (const [x0, x1, z0, z1] of [[-5.2055, 5.2055, 5.5995, 11.2055], [-5.2055, 5.2055, -5.2055, -0.0995]]) {
    for (let z = z0; z + 0.12 <= z1 + 0.001; z += 0.1215) {
      let x = x0 - rng() * 1.2;
      while (x < x1) { const L = 1.4 + rng() * 0.9, a = Math.max(x, x0), b = Math.min(x + L, x1); if (b - a > 0.05) { const g = new THREE.BoxGeometry(b - a, 0.019, 0.12), t = 0.82 + rng() * 0.18, cs = new Float32Array(g.attributes.position.count * 3).fill(t); g.setAttribute('color', new THREE.BufferAttribute(cs, 3)); tg.push(g.translate((a + b) / 2, SL + 0.0095, z + 0.06)); } x += L + 0.0015; }
    }
  }
  const oakV = m.oak.clone(); oakV.vertexColors = true; timber.add(geoMesh(tg, oakV));
  const carpet = mk('carpet'); carpet.add(box(5.1, 0.008, 5.3, m.under, 2.65, SL + 0.004, 2.75), box(5.09, 0.008, 5.29, m.carpet, 2.65, SL + 0.012, 2.75));
  const strips = mk('strips');
  for (const [w, d, x, z] of [[0.06, 0.82, 0, 2.7], [0.82, 0.06, 2.5, 0], [0.82, 0.06, -2.2, 0], [0.82, 0.06, 2.0, 5.5]]) strips.add(box(w, 0.014, d, m.steel, x, SL + 0.007, z));

  // delivery: tile cartons, adhesive bags, grout pails, a pack of boards, a carpet roll and an underlay roll in the east margin
  const stock = mk('stock'), sx = 6.5, sz = 4.0;
  stock.add(box(1.3, 0.1, 3.6, m.timber, sx, 0.05, sz));
  for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) stock.add(box(0.46, 0.12, 0.34, m.card, sx - 0.28 + j * 0.5, 0.16 + i * 0.12, sz - 1.4), box(0.46, 0.12, 0.34, m.card, sx - 0.28 + j * 0.5, 0.16 + i * 0.12, sz - 1.0));
  for (let i = 0; i < 4; i++) stock.add(box(0.5, 0.11, 0.32, m.bag, sx - 0.3, 0.155 + i * 0.11, sz - 0.4), box(0.5, 0.11, 0.32, m.bag, sx + 0.3, 0.155 + i * 0.11, sz - 0.4));
  for (const dx of [-0.35, 0, 0.35]) stock.add(cyl(0.13, 0.3, m.pail, sx + dx, 0.25, sz + 0.1, 14));
  stock.add(box(0.5, 0.22, 2.2, m.oak, sx - 0.3, 0.21, sz + 1.0));
  { const r1 = cyl(0.16, 1.2, m.carpet, sx + 0.3, 0.26, sz + 0.9, 20), r2 = cyl(0.13, 1.1, m.foam, sx + 0.3, 0.26, sz + 1.55, 20); r1.rotation.x = Math.PI / 2; r2.rotation.x = Math.PI / 2; stock.add(r1, r2); }
  stock.add(sign(['TILING AND FLOOR STOCK', 'Check batch and shade, keep dry and flat', 'Keep spares from the same batch'], 1.6, 0.5, sx, 0.85, sz + 2.1, 0), cyl(0.025, 0.85, m.steel, sx - 0.82, 0.425, sz + 2.1, 8), cyl(0.025, 0.85, m.steel, sx + 0.82, 0.425, sz + 2.1, 8));

  // defects to find at inspection
  const defB = mk('defBath'), def = mk('defects');
  { const x = -3.0, z = 3.9; defB.add(new THREE.Mesh(tileGeo(x, z, 0.297, 0.297, 0.009, 0.0105), m.tile), new THREE.Mesh(tileGeo(x, z, 0.32, 0.32, 0.03, 0.012), m.redGhost)); }
  { const x = -4.2, z = 4.5, y = fy(x, z) + 0.0125; defB.add(new THREE.Mesh(tileGeo(x, z, 0.32, 0.32, 0.03, 0.012), m.redGhost), rod([x - 0.14, y, z - 0.08], [x - 0.02, y, z + 0.02], 0.0025, m.dark, 4), rod([x - 0.02, y, z + 0.02], [x + 0.1, y, z + 0.12], 0.0025, m.dark, 4)); }
  defB.add(sign(['LIPPAGE 3 mm / CRACKED TILE', 'Limit 1.5 mm. Cracks fail.'], 1.2, 0.42, -3.0, 0.45, 3.1, Math.PI), cyl(0.025, 0.45, m.steel, -3.58, 0.225, 3.1, 8), cyl(0.025, 0.45, m.steel, -2.42, 0.225, 3.1, 8));
  def.add(box(1.6, 0.003, 0.006, m.dark, 1.0, SL + 0.0205, 7.5), box(1.7, 0.02, 0.05, m.redGhost, 1.0, SL + 0.02, 7.5));
  def.add(sign(['GAP OVER 2 mm FOR OVER 1 m', 'Outside tolerance at completion'], 1.2, 0.42, 0.95, 0.45, 8.9, 0), cyl(0.025, 0.45, m.steel, 0.37, 0.225, 8.9, 8), cyl(0.025, 0.45, m.steel, 1.53, 0.225, 8.9, 8));

  // protection: sheets over the timber and carpet
  const cover = mk('cover');
  for (const [x0, x1, z0, z1, y] of [[-5.2, 5.2, 5.6, 11.2, SL + 0.021], [0.1, 5.2, 0.1, 5.4, SL + 0.018]]) for (let x = x0; x < x1 - 0.1; x += 1.2) for (let z = z0; z < z1 - 0.1; z += 2.4) cover.add(box(Math.min(1.19, x1 - x), 0.004, Math.min(2.39, z1 - z), m.sheet, x + Math.min(1.19, x1 - x) / 2, y + 0.002, z + Math.min(2.39, z1 - z) / 2));
  cover.add(sign(['FLOORS PROTECTED', 'Sheets taped at the joints until handover'], 1.4, 0.42, 0.0, 0.5, 9.4, 0), cyl(0.025, 0.5, m.steel, -0.65, 0.25, 9.4, 8), cyl(0.025, 0.5, m.steel, 0.65, 0.25, 9.4, 8));

  const baseCount = layers.length;   // the house layers come first, then this step's own, so a later step can keep the house and the finished floors
  layers.push({ group: stock, until: 1 }, { group: membrane, until: 2 }, { group: setout, from: 1, until: 2 }, { group: gapF, from: 2, until: 3 }, { group: groutF, from: 3 }, { group: ftiles, from: 2 },
    { group: wgap, from: 2, until: 3 }, { group: wgrout, from: 3 }, { group: wtiles, from: 2 }, { group: dry, from: 2 }, { group: thr, from: 3 }, { group: joints, from: 3 },
    { group: timber, from: 4 }, { group: carpet, from: 4 }, { group: strips, from: 4 }, { group: defB, from: 5, until: 6 }, { group: def, from: 5, until: 6 }, { group: cover, from: 6 });
  return { layers, baseCount, colliders: s13.colliders.slice(0, -1), tickers: s13.tickers, spawn: { pos: [4, 18.5], yaw: 0, pitch: 0.2 }, map: s13.map, orbit: { pos: [9.5, 9, 18], target: [0, 1.0, 5] }, hotspots: HOTSPOTS };
}

/* ---------- hotspots ---------- */
const HOTSPOTS = [
  { id: 'stock', title: 'Tiles, adhesive, boards and carpet delivered', pos: [6.5, 1.5, 3.0], stand: [6.5, 9.2], from: 0, until: 1, drawing: 'order',
    summary: 'Tiles, adhesive, grout, timber boards, carpet and underlay arrive on site. Each item is checked against the order, the batch and shade are noted, and everything is stored dry and flat until the trade that lays it is ready.',
    learn: [['Check every carton against the order before it is signed for: tile type and size, batch or shade number, quantity, and the adhesive and grout. Tiles from different batches can differ in shade and size (Typical).', 'T'], ['An allowance of about 10 per cent is common for cuts and breakage, and spares from the same batch are kept for later repairs. Ask the tiler and the supplier (Typical).', 'T'], ['Keep cartons, adhesive and grout dry and flat, off the ground. Timber boards are usually left in the house for the time the maker says so they settle to the indoor conditions (Typical).', 'T'], ['Check the tile adhesive and grout against the membrane maker\'s system data sheet, because the system, not the builder, says which products are compatible (Typical).', 'T'], ['The BPC Guide to Standards and Tolerances is advisory and applies to contracts entered into or work commenced from 1 August 2026.', 'V', 'bpcTol26']] },
  { id: 'check', title: 'Check the slab, screed and membrane before tiling', pos: [-3.6, 0.3, 2.4], stand: [-3.6, 4.5], from: 0, until: 2, drawing: 'tile',
    summary: 'Before any tile goes down the substrate is checked: flat, clean, dry and firm, with the screed falling to the waste and the waterproofer\'s membrane complete, cured and undamaged.',
    learn: [['The HIA page for AS 3958.1-2007 says the Standard covers preparing the background, fixing and grouting floor and wall tiles. It gives no figures, and the Standard was not opened.', 'V', 'hiaTileGuide'], ['A slab-on-ground is outside tolerance if its level differs by more than 10 mm in any room or area, 4 mm in any 2 m length, or 20 mm across the whole footprint, checked within the first 24 months (3.3).', 'V', 'bpcTol26'], ['The minimum fall to the waste is 1:80 and the maximum is 1:50 (clause 10.2.12). Check the fall with a level before the tiler starts.', 'V', 'bpcWet'], ['Tiling in a wet area is outside tolerance if water is retained after draining, except residual surface-tension water (14.1). Tiles that fall to a floor outlet are not outside the flatness limit for that reason (14.5).', 'V', 'bpcTol26'], ['Floor wastes must suit the tile and tile bed thickness, and the membrane stops at or in the drainage flange.', 'V', 'nccHp102'], ['Do not tile over a membrane that has been cut or that has not cured as its maker says. Have the waterproofer repair it first, then check the record from Step 10 (Typical).', 'T'], ['Slab moisture limits for tile, timber and carpet come from the Standard and the product maker. A Western Australian Government guideline sets relative humidity below 90 per cent (ASTM F2170) for resilient coverings on its own projects. It is a WA rule that excludes tile, carpet and timber.', 'C', 'waTg002']] },
  { id: 'setout', title: 'Set-out: centre lines and a dry-laid row', pos: [-3.6, 0.3, 3.4], stand: [-3.6, 1.8], from: 1, until: 2, drawing: 'tile',
    summary: 'The tiler marks centre lines and dry-lays a row of tiles to see where the cuts fall. The aim is a cut of at least half a tile at each edge, not a thin sliver, and joints that line up with the doorway and the waste.',
    learn: [['Tiles are set out from a centre line so the cut tiles at the edges are not slivers. A dry run shows the cuts before any adhesive is spread (Typical).', 'T'], ['The final alignment must be within 4 mm in 2 m of the specified joint alignment, and the joint widths consistent (14.4).', 'V', 'bpcTol26'], ['Floor tiles fall to the outlet, so the layout follows the falls. Tiles that fall to an outlet are not outside the flatness limit of 3 mm in 2 m for that reason (14.5).', 'V', 'bpcTol26'], ['Movement joints are planned now: they must go immediately above structural movement joints and at stress locations, or the tiling is outside tolerance (14.7).', 'V', 'bpcTol26'], ['The model bathroom is about 12.8 square metres. The HIA article on AS 3958:2023 says perimeter joints can be left out of areas under 10 square metres if the tiles sit at least 3 mm from the restraining surface, so the model draws perimeter joints.', 'V', 'hiaTileJoints'], ['The model uses 300 mm floor tiles with 3 mm joints. Sizes and joint widths are a design choice, and the joint width also sets the lippage limit.', 'T']] },
  { id: 'floortile', title: 'Floor tiling: bed, tile and joint', pos: [-3.6, 0.35, 3.2], stand: [-3.1, 1.8], from: 2, until: 4, detail: 'tilebed', drawing: 'tile',
    summary: 'Adhesive is combed onto the substrate with a notched trowel and each tile is bedded so the back is fully supported. The tiles are flat, the joints even, the lippage within the limit and the floor falls to the waste.',
    learn: [['Tiling must conform to AS 3958, and repairs match the existing work as closely as practicable (14.2).', 'V', 'bpcTol26'], ['Tiled surfaces must be flat and true to within 3 mm in 2 m (14.5).', 'V', 'bpcTol26'], ['Lippage limits (Table 14.6): 1.0 mm for a flat polished or honed tile with a 1.5 to 2.9 mm joint, 1.5 mm for a 3.0 to 6.0 mm joint and 2.0 mm for a joint over 6.0 mm. Smooth tiles with a regular edge and highly profiled tiles of consistent profile are 2.0 mm at any joint width.', 'V', 'bpcTol26'], ['Cracked, pitted, chipped, scratched or loose tiles are outside tolerance at completion (14.3).', 'V', 'bpcTol26'], ['The BPC guide has no clause on hollow-sounding tiles or on cutting tiles. Adhesive coverage and bed thickness come from AS 3958 and the adhesive maker, and the Standard was not opened.', 'C', 'bpcTol26'], ['The tile edition matters: the HIA summary page is for AS 3958.1-2007, and an HIA article of 3 April 2025 refers to AS 3958:2023. Confirm which edition the contract and the surveyor use.', 'C', 'hiaTileJoints'], ['The NCC Part 11.2 page gives slip ratings for stairs, ramps and landings only. No bathroom floor rating was found on the pages read, so confirm the project requirement and the tile\'s rating with the supplier. AS 4586 was not opened.', 'C', 'nccHp112']] },
  { id: 'walltile', title: 'Wall tiling over the membrane', pos: [-3.6, 1.2, 1.3], stand: [-3.6, 4.4], from: 2, until: 4, detail: 'joints', drawing: 'joints',
    summary: 'Wall tiles go over the cured membrane. In the shower the membrane runs at least 1800 mm up the walls, and the tiles cover it. Corners and junctions take flexible sealant, not grout.',
    learn: [['The walls of a shower area must be waterproofed not less than 1800 mm above the floor substrate (Part 10.2). The model tiles the shower walls to 2.1 m and the other walls lower, which is a design choice.', 'V', 'nccHp102'], ['Tile alignment is within 4 mm in 2 m of the specified joint alignment, with consistent joint widths (14.4).', 'V', 'bpcTol26'], ['Flexible or waterproof junction sealants must be installed to the manufacturer\'s requirements (14.4).', 'V', 'bpcTol26'], ['Wall movement joints go over existing structural movement joints, where tiling abuts other cladding and at the vertical corners of shower compartments. They are generally not narrower than 6 mm.', 'V', 'hiaTileJoints'], ['Cracks or leaks in a shower base or screen that are visible at completion are outside tolerance (14.1).', 'V', 'bpcTol26'], ['Screws and fixings through the membrane (towel rails, screens, shelves) are sealed as the membrane maker says. Mark them on the plan before tiling (Typical).', 'T']] },
  { id: 'joints', title: 'Grout, movement joints and sealant', pos: [-5.1, 0.3, 5.3], stand: [-3.2, 3.2], from: 3, until: 5, detail: 'joints', drawing: 'joints',
    summary: 'Grout fills the field joints. Movement joints and corners are filled with flexible sealant over backing rod, so the tiling can move without cracking, and the sealed gap around the floor edge keeps the membrane working.',
    learn: [['Perimeter joints go where tiling meets walls, columns and other restraints. Joints are generally at least 6 mm wide and are formed with sealant and backing material where waterproofing is required. The article names no sealant type.', 'V', 'hiaTileJoints'], ['Internal floors need intermediate joints no more than 4.5 m apart where any dimension is over 9 m. In direct sunlight the figure is 4.5 m where a dimension is over 6 m. External floors take 4.5 m spacing in any dimension.', 'V', 'hiaTileJoints'], ['The model bathroom is under 9 m in each direction, so it needs no intermediate floor joint, but at about 12.8 square metres it is over the 10 square metre limit for leaving out perimeter joints. This applies the article\'s figures to the model, so confirm against clause 5.4.7 of the Standard.', 'C', 'hiaTileJoints'], ['Movement joints must be installed immediately above structural movement joints and at stress locations (14.7).', 'V', 'bpcTol26'], ['Grout that becomes loose within 24 months is outside tolerance (14.4).', 'V', 'bpcTol26'], ['Grout fills the field joints, and flexible sealant fills the movement joints and corners. Grout in a corner will crack (Typical).', 'T'], ['The BPC guide has no clause on thresholds or transitions between floor coverings. A strip is fixed at each change of material and in the bathroom doorway (Typical).', 'C', 'bpcTol26'], ['The model draws the sealant bead in blue and thicker than real so it can be seen. Real sealant is usually a colour that matches the grout or the wall.', 'T']] },
  { id: 'timber', title: 'Timber boards: gaps, levels and movement', pos: [0.0, 0.2, 8.0], stand: [0.0, 10.5], from: 4, detail: 'timber', drawing: 'floors',
    summary: 'Timber boards are laid over the slab with a moisture barrier and underlay, with a gap at every wall that the skirting hides. The BPC guide sets limits on gaps, lippage, cupping, levelness and noise.',
    learn: [['Timber flooring must be installed to the NCC or to the manufacturer\'s requirements (15.1).', 'V', 'bpcTol26'], ['Lippage over 0.5 mm between adjacent boards is outside tolerance at completion (15.2).', 'V', 'bpcTol26'], ['Gaps over 2 mm between adjacent boards for more than 1 m, or over 5 mm in total across three gaps between four consecutive boards, are outside tolerance, except where sun, heat or cooling caused them (15.3).', 'V', 'bpcTol26'], ['Cupping over 1 mm per 100 mm is outside tolerance, as is swelling that causes tenting, buckling or crowning visible at completion (15.4).', 'V', 'bpcTol26'], ['Nail popping and consistent squeaking within 24 months are outside tolerance, and a floor that is noticeably springy is not within tolerance (15.5 to 15.7).', 'V', 'bpcTol26'], ['Within 24 months a floor must not differ in level by more than 10 mm in a room, 4 mm in any 2 m or 20 mm overall (15.8).', 'V', 'bpcTol26'], ['Boards are fixed with a gap at every wall, hidden by the skirting. The size of the gap, the moisture barrier and whether boards are glued or floated are the maker\'s instructions (Typical).', 'T'], ['Slab moisture limits for timber are the maker\'s. AS 1884 and AS 2455.1 were not opened.', 'C', 'wagnerRh']] },
  { id: 'carpet', title: 'Carpet, underlay and the doorway strip', pos: [0.0, 0.3, 2.7], stand: [-1.4, 2.7], from: 4, detail: 'carpet', drawing: 'floors',
    summary: 'Carpet is stretched over underlay and gripper rods and tucked at the walls. A strip at the doorway covers the edge where it meets the tiles in the hall.',
    learn: [['Carpet and vinyl must be installed to the manufacturer\'s instructions (15.9).', 'V', 'bpcTol26'], ['Seams that peak, fray or misalign and are visible from a normal viewing position within 12 months of completion are outside tolerance (15.9).', 'V', 'bpcTol26'], ['Movement noise from a correctly installed floating floor is within tolerance (15.9).', 'V', 'bpcTol26'], ['The BPC guide has nothing on carpet ripples, edges or adhesion. Textile floor covering installation is AS 2455.1, which was not opened.', 'C', 'wagnerRh'], ['Doors may need trimming after the floor coverings go down. The clearance under a door is not more than 20 mm after coverings are laid, checked within 3 months (11.4).', 'V', 'bpcTol26'], ['Gripper rods fix around the edges, the carpet is stretched onto them, and a strip or binder bar covers any edge at a doorway (Typical).', 'T']] },
  { id: 'checkb', title: 'Inspect the tiled bathroom', pos: [-3.0, 0.3, 3.8], stand: [-3.0, 1.8], from: 5, until: 6, drawing: 'tile',
    summary: 'Run a straightedge and a low light over the tiles, look for cracks and missing grout, flood the floor to check the falls, and check every sealed joint. The model has a raised tile and a cracked tile.',
    learn: [['The raised tile is 3 mm proud. For a flat polished or honed tile with a 3 mm joint the lippage limit is 1.5 mm (Table 14.6).', 'V', 'bpcTol26'], ['A cracked tile is outside tolerance at completion (14.3).', 'V', 'bpcTol26'], ['Pour water on the floor and let it drain. Water retained after draining, other than surface-tension water, is outside tolerance (14.1).', 'V', 'bpcTol26'], ['Check the grout is complete and the joints are even and in line within 4 mm in 2 m (14.4).', 'V', 'bpcTol26'], ['Check that the sealant in the corners and around the floor edge is continuous, and that the shower base and screen show no cracks or leaks (14.1).', 'V', 'bpcTol26'], ['Defects are judged from a normal viewing position of 1.5 m or more in non-critical light (600 mm for appliances and fixtures, 3 m for glass).', 'V', 'bpcTol26'], ['Check that the grate sits flush with the tile and that the tiles fall to it, then photograph the floor before it is protected (Typical).', 'T']] },
  { id: 'checkf', title: 'Inspect the timber and carpet', pos: [1.0, 0.25, 7.8], stand: [1.0, 10.5], from: 5, until: 6, drawing: 'floors',
    summary: 'Walk the floors, look along the boards for gaps and lippage, and check the carpet seams and the door clearances. The model has a gap over 2 mm that runs for more than 1 m.',
    learn: [['The model gap is over 2 mm for more than 1 m, which is outside tolerance at completion unless sun, heat or cooling caused it (15.3).', 'V', 'bpcTol26'], ['Lippage over 0.5 mm between adjacent boards is outside tolerance at completion (15.2).', 'V', 'bpcTol26'], ['Walk the floor for squeaks and spring. Consistent squeaking within 24 months is outside tolerance, and a noticeably springy floor is not within tolerance (15.6, 15.7).', 'V', 'bpcTol26'], ['Look along every carpet seam from 1.5 m or more for peaking, fraying or misalignment (15.9).', 'V', 'bpcTol26'], ['Check the clearance under each door after the coverings are down: not more than 20 mm (11.4).', 'V', 'bpcTol26'], ['Keep a defect list with photographs, and have each item fixed before the floors are covered (Typical).', 'T']] },
  { id: 'protect', title: 'Protect the floors and hand over to painting', pos: [0.0, 0.4, 8.6], stand: [0.0, 11.0], from: 6, drawing: 'order',
    summary: 'The floors are covered with sheets and the joints are taped so the painter and the final fix do not damage them. Spare tiles, the grout colour and the product records are kept for handover.',
    learn: [['Cover timber and carpet with sheets and tape the joints, and keep heavy loads off new tile until the adhesive and grout have cured as the makers say (Typical).', 'T'], ['Painting and the final fix come next in Step 15. Timber floors are often sanded and coated, and carpet laid, later than the painting, so the order on a real job is Confirm with the flooring contractor.', 'C'], ['The BPC time limits run from 3 months for door clearances and 12 months for carpet seams to 24 months for loose grout, squeaks and levelness. A defect can still be raised after handover, so record the condition on the day (Typical).', 'T'], ['Keep spare tiles, the grout colour code, the adhesive and sealant product names and the care instructions with the records (Typical).', 'T']] },
];

/* ---------- zoom rooms ---------- */
const details = {
  tilebed: {
    title: 'Floor tile build-up and perimeter joint', sub: 'Slab, screed to falls, membrane, adhesive, two tiles with a grouted joint, the wall sheet with the membrane turned up, a wall tile, a backing rod and the sealant bead. Layers are drawn thicker than real',
    floor: -0.22, gridSize: 2, camera: { pos: [0.75, 0.35, 0.95], target: [-0.02, -0.04, 0.0] },
    build(kit) {
      const { box, cyl } = kit, m = MAT(kit);
      const slab = grp(box(0.7, 0.1, 0.5, m.conc, 0, -0.135, 0));
      const screed = grp(box(0.7, 0.035, 0.5, m.screed, 0, -0.0675, 0));
      const mem = grp(box(0.7, 0.006, 0.5, m.blue, 0, -0.047, 0));
      const adhG = grp(box(0.7, 0.012, 0.5, m.adh, 0, -0.038, 0)); for (let z = -0.23; z <= 0.231; z += 0.04) adhG.add(box(0.7, 0.012, 0.015, m.adh, 0, -0.026, z));
      const tiles = grp(box(0.335, 0.02, 0.5, m.tile, -0.1725, -0.01, 0), box(0.345, 0.02, 0.5, m.tile, 0.1775, -0.01, 0));
      const grout = grp(box(0.01, 0.018, 0.5, m.grout, 0.0, -0.011, 0));
      const wall = grp(box(0.013, 0.26, 0.5, m.board, -0.3565, 0.08, 0), box(0.004, 0.16, 0.5, m.blue, -0.3475, -0.02, 0));
      const wtile = grp(box(0.009, 0.18, 0.5, m.wtile, -0.3415, 0.095, 0));
      const seal = grp(box(0.01, 0.007, 0.5, m.seal, -0.342, 0.0035, 0), cyl(0.004, 0.5, m.dark, -0.345, -0.008, 0, 10).rotateX(Math.PI / 2));
      return { parts: [
        { id: 'slab', name: 'Concrete slab', group: slab, explode: [0, -0.14, 0], anchor: [0.2, -0.14, 0.25], flag: 'V', src: 'bpcTol26', spec: 'Slab levels must not differ by more than 10 mm in a room, 4 mm in any 2 m or 20 mm overall, checked within 24 months (3.3). The slab itself is Step 2.', desc: 'The base for everything above.' },
        { id: 'screed', name: 'Screed to falls', group: screed, explode: [0, -0.08, 0], anchor: [0.2, -0.0675, 0.25], flag: 'V', src: 'bpcWet', spec: 'The screed falls to the waste at between 1:80 and 1:50 (clause 10.2.12). Thickness here is drawn larger than real, and the model screed is 12 mm at the waste.', desc: 'Laid in Step 10 to fall to the waste.' },
        { id: 'mem', name: 'Waterproof membrane', group: mem, explode: [0, -0.03, 0], anchor: [0.2, -0.047, 0.25], flag: 'V', src: 'nccHp102', spec: 'A drainage flange must be installed with the waterproofing membrane terminated at or in the flange. The membrane is applied in Step 10 and the tiler must not damage it.', desc: 'The tiler lays over it and does not cut it.' },
        { id: 'adh', name: 'Tile adhesive', group: adhG, explode: [0, 0.03, 0], anchor: [0.2, -0.032, 0.25], flag: 'T', spec: 'Adhesive is combed with a notched trowel so that ridges collapse under the tile and fully support its back. Trowel size, adhesive class and open time come from AS 3958, which was not opened, and from the adhesive maker.', desc: 'Combed ridges, drawn thicker than real.' },
        { id: 'tiles', name: 'Floor tiles', group: tiles, explode: [0, 0.12, 0], anchor: [0.2, 0.0, 0.2], flag: 'V', src: 'bpcTol26', spec: 'Flat and true within 3 mm in 2 m (14.5). Lippage limits come from Table 14.6, for example 1.5 mm for a flat polished or honed tile with a 3.0 to 6.0 mm joint. Cracked, chipped or loose tiles are outside tolerance at completion (14.3).', desc: 'Two tiles with a grouted joint between them.' },
        { id: 'grout', name: 'Grout', group: grout, explode: [0.0, 0.22, 0.05], anchor: [0.0, 0.0, 0.2], flag: 'V', src: 'bpcTol26', spec: 'Joint widths are consistent and alignment is within 4 mm in 2 m. Grout that becomes loose within 24 months is outside tolerance (14.4).', desc: 'Fills the field joint, but not the movement joints.' },
        { id: 'wall', name: 'Wall sheet and membrane upturn', group: wall, explode: [-0.22, 0.0, 0], anchor: [-0.36, 0.2, -0.2], flag: 'T', spec: 'The membrane turns up the wall at the floor junction, and in the shower it runs at least 1800 mm up (Part 10.2). The wet-area sheet is lined in Step 12.', desc: 'The wall sheet with the membrane turned up behind the tile.' },
        { id: 'wtile', name: 'Wall tile', group: wtile, explode: [-0.14, 0.06, 0.0], anchor: [-0.337, 0.12, 0.08], flag: 'V', src: 'hiaTileJoints', spec: 'Wall tiling stops short of the floor tile with a gap for sealant. Movement joints are generally not narrower than 6 mm and are formed with sealant and backing material where waterproofing is required.', desc: 'Sits above the floor tile, not on it.' },
        { id: 'seal', name: 'Perimeter sealant and backing rod', group: seal, explode: [-0.05, 0.2, 0.0], anchor: [-0.342, 0.0035, 0.25], flag: 'V', src: 'hiaTileJoints', spec: 'Perimeter joints go where tiling meets walls and other restraints, and are formed with sealant over backing rod. The sealant type is the maker\'s. The model bathroom is over 10 square metres, so it has them.', desc: 'A flexible joint, not grout.' },
      ] };
    },
  },

  joints: {
    title: 'Corner: wall and floor tiles, soft joints and grout', sub: 'Two wet-area sheets with the membrane turned up, floor tiles, wall tiles, grout, a bond breaker and the flexible sealant in the vertical corner and around the floor edge',
    floor: -0.045, gridSize: 2, camera: { pos: [0.95, 0.65, 0.95], target: [0.05, 0.2, 0.05] },
    build(kit) {
      const { box, cyl } = kit, m = MAT(kit);
      const walls = grp(box(0.013, 0.5, 0.75, m.board, -0.0065 - 0.015, 0.205, 0.345), box(0.75, 0.5, 0.013, m.board, 0.345, 0.205, -0.0065 - 0.015));
      const mem = grp(box(0.004, 0.14, 0.7, m.blue, -0.014, 0.025, 0.35), box(0.7, 0.14, 0.004, m.blue, 0.35, 0.025, -0.014), box(0.7, 0.006, 0.7, m.blue, 0.35, -0.023, 0.35));
      const bond = grp(box(0.012, 0.012, 0.7, m.white, 0.006, -0.012, 0.35), box(0.7, 0.012, 0.012, m.white, 0.35, -0.012, 0.006));
      const ft = grp(); for (const [x, z] of [[0.095, 0.095], [0.285, 0.095], [0.095, 0.285], [0.285, 0.285]]) ft.add(box(0.18, 0.02, 0.18, m.tile, x + 0.02, -0.01, z + 0.02));
      const wtl = grp(); for (const [y, z] of [[0.115, 0.13], [0.115, 0.34], [0.325, 0.13], [0.325, 0.34]]) wtl.add(box(0.009, 0.2, 0.2, m.wtile, 0.0045, y, z)); for (const [y, x] of [[0.115, 0.13], [0.115, 0.34], [0.325, 0.13], [0.325, 0.34]]) wtl.add(box(0.2, 0.2, 0.009, m.wtile, x + 0.0, y, 0.0045));
      const grout = grp(box(0.012, 0.018, 0.4, m.grout, 0.215, -0.011, 0.215), box(0.4, 0.018, 0.012, m.grout, 0.215, -0.011, 0.215), box(0.006, 0.4, 0.012, m.grout, 0.009, 0.215, 0.235));
      const soft = grp(box(0.012, 0.42, 0.012, m.seal, 0.006, 0.215, 0.006), cyl(0.004, 0.42, m.dark, 0.003, 0.215, 0.003, 8));
      const perim = grp(box(0.014, 0.008, 0.7, m.seal, 0.007, 0.003, 0.35), box(0.7, 0.008, 0.014, m.seal, 0.35, 0.003, 0.007));
      return { parts: [
        { id: 'walls', name: 'Wall sheets', group: walls, explode: [-0.12, 0, -0.12], anchor: [-0.02, 0.3, 0.45], flag: 'T', spec: 'Wet-area sheet is lined in Step 12 over the studs. The two sheets meet at the internal corner.', desc: 'Only the lower part of the corner is drawn.' },
        { id: 'mem', name: 'Membrane and upturn', group: mem, explode: [-0.07, 0.0, -0.07], anchor: [-0.012, 0.09, 0.4], flag: 'V', src: 'nccHp102', spec: 'The membrane is applied in Step 10 and turns up the walls. In the shower area the walls are waterproofed not less than 1800 mm above the floor substrate.', desc: 'Applied before the tiles and never cut by the tiler.' },
        { id: 'bond', name: 'Bond breaker', group: bond, explode: [-0.04, -0.04, -0.04], anchor: [0.006, -0.012, 0.5], flag: 'V', src: 'nccHp102', spec: 'Bond breakers must be installed at all wall and wall, wall and floor and hob and wall junctions, so that the membrane is not bonded to the substrate across a movement joint (Step 10).', desc: 'A strip along the junction, under the tile.' },
        { id: 'ft', name: 'Floor tiles', group: ft, explode: [0.0, 0.1, 0.0], anchor: [0.2, 0.0, 0.1], flag: 'V', src: 'bpcTol26', spec: 'Flat and true within 3 mm in 2 m, and lippage within Table 14.6. The tiles stop short of the wall to leave the perimeter joint.', desc: 'Stop a few millimetres from the wall.' },
        { id: 'wtl', name: 'Wall tiles', group: wtl, explode: [-0.1, 0.12, -0.1], anchor: [0.0, 0.35, 0.22], flag: 'V', src: 'bpcTol26', spec: 'Alignment within 4 mm in 2 m of the specified joint alignment, with consistent joint widths (14.4).', desc: 'Two walls of tiles, with a corner joint between them.' },
        { id: 'grout', name: 'Grout', group: grout, explode: [0.1, 0.2, 0.1], anchor: [0.215, 0.0, 0.215], flag: 'V', src: 'bpcTol26', spec: 'Grout that becomes loose within 24 months is outside tolerance (14.4).', desc: 'Fills the joints between tiles in the same plane.' },
        { id: 'soft', name: 'Soft joint in the vertical corner', group: soft, explode: [-0.05, 0.18, -0.05], anchor: [0.006, 0.3, 0.006], flag: 'V', src: 'hiaTileJoints', spec: 'Movement joints on walls go at the vertical corners of shower compartments, among other places. The joint is generally not narrower than 6 mm and is formed with sealant and backing material where waterproofing is required.', desc: 'Sealant over backing rod instead of grout.' },
        { id: 'perim', name: 'Perimeter sealant', group: perim, explode: [-0.02, 0.3, -0.02], anchor: [0.007, 0.003, 0.55], flag: 'V', src: 'hiaTileJoints', spec: 'Perimeter joints go where tiling meets walls, columns and other restraints. Flexible or waterproof junction sealants are installed to the manufacturer\'s requirements (BPC 14.4).', desc: 'Runs along the whole floor edge.' },
      ] };
    },
  },

  timber: {
    title: 'Timber floor over the slab, with a gap at the wall', sub: 'Slab, moisture barrier, underlay, boards, the expansion gap at the wall and the skirting that hides it. Thicknesses are drawn larger than real',
    floor: -0.22, gridSize: 2, camera: { pos: [0.8, 0.38, 1.0], target: [0.0, -0.02, 0.0] },
    build(kit) {
      const { box } = kit, m = MAT(kit);
      const slab = grp(box(0.7, 0.1, 0.5, m.conc, 0, -0.135, 0));
      const barrier = grp(box(0.7, 0.003, 0.5, m.okGhost, 0, -0.0835, 0));
      const underlay = grp(box(0.68, 0.01, 0.5, m.foam, 0.01, -0.0755, 0));
      const boards = grp(); for (let i = 0; i < 4; i++) boards.add(box(0.64, 0.02, 0.118, m.oak, 0.02, -0.0605 + 0.0, -0.18 + i * 0.12 + 0.06 + 0.0));
      const gap = grp(box(0.02, 0.03, 0.5, m.okGhost, -0.31, -0.05, 0));
      const skirt = grp(box(0.018, 0.1, 0.5, m.trim, -0.341, -0.02, 0));
      const wall = grp(box(0.013, 0.4, 0.5, m.board, -0.3565 - 0.018, 0.1, 0));
      return { parts: [
        { id: 'slab', name: 'Concrete slab', group: slab, explode: [0, -0.15, 0], anchor: [0.2, -0.14, 0.25], flag: 'V', src: 'bpcTol26', spec: 'Floors must not differ in level by more than 10 mm in a room, 4 mm in any 2 m or 20 mm overall within 24 months (3.3, 15.8). Slab moisture limits for timber are the maker\'s.', desc: 'The slab sets the level of the finished floor.' },
        { id: 'barrier', name: 'Moisture barrier', group: barrier, explode: [0, -0.07, 0], anchor: [0.3, -0.0835, 0.25], flag: 'T', spec: 'A barrier under floating or battened timber floors on a slab is common. Whether one is needed, and which, is the floor maker\'s instruction. AS 1884 and AS 2455.1 were not opened.', desc: 'A plastic sheet, shown see-through.' },
        { id: 'underlay', name: 'Underlay', group: underlay, explode: [0, -0.01, 0], anchor: [0.3, -0.0755, 0.25], flag: 'T', spec: 'Foam underlay softens impact sound and levels small differences. Its thickness and density are the maker\'s choice. Floating floors may make some movement noise within tolerance if correctly installed (BPC 15.9).', desc: 'Lies loose under floating boards.' },
        { id: 'boards', name: 'Timber boards', group: boards, explode: [0, 0.1, 0], anchor: [0.3, -0.0505, 0.2], flag: 'V', src: 'bpcTol26', spec: 'Gaps over 2 mm between adjacent boards for more than 1 m, lippage over 0.5 mm, and cupping over 1 mm per 100 mm are outside tolerance (15.2 to 15.4).', desc: 'Laid in staggered lengths.' },
        { id: 'gap', name: 'Expansion gap', group: gap, explode: [0, 0.12, 0], anchor: [-0.31, -0.05, 0.25], flag: 'T', spec: 'Boards are kept back from every wall so they can move with the weather, and the gap is hidden by the skirting. The size is the maker\'s instruction.', desc: 'The green strip is the gap.' },
        { id: 'skirt', name: 'Skirting', group: skirt, explode: [-0.1, 0.12, 0.0], anchor: [-0.341, -0.02, 0.25], flag: 'V', src: 'bpcTol26', spec: 'Gaps in skirting over 2 mm within 24 months are outside tolerance. The skirting is fixed to the wall, not to the boards, so the boards can move under it.', desc: 'Fixed to the wall, with a small clearance above the boards.' },
        { id: 'wall', name: 'Wall sheet', group: wall, explode: [-0.22, 0.0, 0], anchor: [-0.37, 0.2, 0.2], flag: 'T', spec: 'The wall sheet from Step 12, shown cut away.', desc: 'Shows where the skirting is fixed.' },
      ] };
    },
  },

  carpet: {
    title: 'Carpet, underlay, gripper rod and the doorway strip', sub: 'Slab, underlay, gripper rod, carpet, the strip at the doorway and the hall tile on its other side, with the skirting. Thicknesses are drawn larger than real',
    floor: -0.22, gridSize: 2, camera: { pos: [0.55, 0.4, 1.15], target: [0.02, -0.02, 0.0] },
    build(kit) {
      const { box } = kit, m = MAT(kit);
      const slab = grp(box(0.9, 0.1, 0.5, m.conc, 0, -0.135, 0));
      const underlay = grp(box(0.54, 0.014, 0.5, m.under, -0.17, -0.0735, 0));
      const gripper = grp(box(0.02, 0.01, 0.5, m.timber, -0.425, -0.0735, 0), ...[-0.2, -0.1, 0, 0.1, 0.2].map((z) => box(0.004, 0.012, 0.004, m.steel, -0.425, -0.0635, z)));
      const carpet = grp(box(0.54, 0.014, 0.5, m.carpet, -0.17, -0.0525, 0));
      const strip = grp(box(0.05, 0.016, 0.5, m.steel, 0.125, -0.0535, 0));
      const tile = grp(box(0.34, 0.012, 0.5, m.dtile, 0.32, -0.054, 0));
      const skirt = grp(box(0.018, 0.1, 0.5, m.trim, -0.451, -0.02, 0));
      return { parts: [
        { id: 'slab', name: 'Concrete slab', group: slab, explode: [0, -0.15, 0], anchor: [0.3, -0.14, 0.25], flag: 'V', src: 'bpcTol26', spec: 'Floors must not differ in level by more than 10 mm in a room, 4 mm in any 2 m or 20 mm overall within 24 months (3.3). The maker sets the slab moisture limit for each covering. AS 2455.1 was not opened.', desc: 'The slab sets the level.' },
        { id: 'underlay', name: 'Underlay', group: underlay, explode: [0, -0.04, 0], anchor: [-0.17, -0.0735, 0.25], flag: 'T', spec: 'Rubber or foam underlay supports the carpet and sets its feel. The thickness and type are the carpet maker\'s and the supplier\'s recommendation.', desc: 'Laid over the slab and held at the edge by the gripper.' },
        { id: 'gripper', name: 'Gripper rod', group: gripper, explode: [-0.05, 0.1, 0], anchor: [-0.425, -0.0635, 0.25], flag: 'T', spec: 'A timber strip with pins fixed around the room edge. The carpet is stretched onto the pins and tucked behind the skirting.', desc: 'Holds the stretched carpet at the wall.' },
        { id: 'carpet', name: 'Carpet', group: carpet, explode: [0, 0.14, 0], anchor: [-0.17, -0.0455, 0.25], flag: 'V', src: 'bpcTol26', spec: 'Installed to the manufacturer\'s instructions. Seams that peak, fray or misalign and are visible from a normal viewing position within 12 months are outside tolerance (15.9). The guide has nothing on ripples, edges or adhesion.', desc: 'Stretched, not just laid.' },
        { id: 'strip', name: 'Doorway strip', group: strip, explode: [0.03, 0.26, 0], anchor: [0.125, -0.0455, 0.25], flag: 'C', src: 'bpcTol26', spec: 'A strip or binder bar covers the edge where two coverings meet. The BPC guide has no clause on thresholds or transitions between floor coverings, so the strip and its height are the installer\'s choice.', desc: 'Covers the carpet edge and the tile edge.' },
        { id: 'tile', name: 'Hall tile', group: tile, explode: [0.12, 0.1, 0], anchor: [0.32, -0.048, 0.25], flag: 'T', spec: 'A dry-area tile in the hall. The tile height and the adhesive set how it meets the carpet. Dry-area tiles are tiled to AS 3958 too (BPC 14.2).', desc: 'The other side of the doorway.' },
        { id: 'skirt', name: 'Skirting', group: skirt, explode: [-0.12, 0.12, 0.0], anchor: [-0.451, -0.02, 0.25], flag: 'V', src: 'bpcTol26', spec: 'Gaps in skirting over 2 mm within 24 months are outside tolerance. The carpet is tucked behind it.', desc: 'Hides the tucked edge.' },
      ] };
    },
  },
};

export default {
  n: 14, id: 'floors', title: 'Tiling and floor coverings', subtitle: 'Tiling over the membrane, movement joints and grout, timber boards, carpet, doorway strips, inspection and protection.',
  phases, build, details, drawings, howto, trades, materials, quotes, quoteTips, inspections, exam, sources, caution,
};

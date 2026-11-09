// Step 13: fix-out. The Step 12 house (lined, set and ready for paint) gets internal doors with architraves and skirting, a kitchen run and a wardrobe. A full-size sample entry stair, landing and balustrade
// stands in the front yard because the model house is single-storey. Rules marked Verified come from the NCC Part 11.2 and 11.3 pages, the NCCB stair FAQ, the BPC Guide to Standards and Tolerances 2026
// and the CAV payments page. The 11.2 and 11.3 pages show no edition, the 11.3 page is cut off at 11.3.5, and AS 4586, AS/NZS 1170.1 and AS/NZS 4386.1 were not opened (paywalled).
// Door and cabinet sizes, hardware heights and the kitchen layout are typical, not rules. The stair uses 6 risers of 185 mm and goings of 250 mm so that 2R + G is 620 mm.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import step12 from './step-12.js';
import { grp } from './step-06.js';
import { WALLS, wallInfo, worldAt, F } from './frame.js';
import { drawings, howto, trades, materials, quotes, quoteTips, inspections, exam, sources, caution } from './step-13-study.js';

const phases = [
  { title: 'Delivery and set-out', text: 'Doors, trims, cabinets and stair parts arrive and are checked against the order. The stair is set out with a story rod marked at every riser, so the rise is shared evenly before any timber is cut.' },
  { title: 'Doors, frames and trims', text: 'Jambs are packed plumb, doors are hung with even gaps, architraves are fixed over the jamb and the wall, and skirting is run up to the architraves.' },
  { title: 'Stairs', text: 'Stringers, risers and treads go in, then the landing. Every riser and going is measured, and slip-resistant nosings are fixed.' },
  { title: 'Balustrades and handrails', text: 'Posts are bolted to the structure, rails and balusters follow, and the heights and the openings are checked against the barrier rules.' },
  { title: 'Kitchen and wardrobes', text: 'Cabinets are set level on the plinth, benchtops are fitted and sealed at the wall, and the wardrobe is fixed to the framing the carpenter blocked out earlier.' },
  { title: 'Inspection', text: 'Doors, trims, cabinet fronts, stair dimensions and barrier openings are checked and the defects listed. A 125 mm sphere is the test for a barrier opening.' },
  { title: 'Records and the fixing stage', text: 'Dockets, hardware and cabinet schedules, photos and the surveyor\'s record are filed. The fixing stage is reached only when every item on the CAV list is fixed.' },
];

const MAT = (kit) => {
  const { mat, ghost } = kit;
  return {
    timber: mat(0xffffff, { tex: 'timber' }), oak: mat(0xf0d3a2, { tex: 'timber' }), prime: mat(0xf2eee4, { roughness: 0.55, emissive: 0x66625a }), trim: mat(0xe6cfa6, { roughness: 0.7, emissive: 0x3d3322 }), stringer: mat(0xcdb894, { roughness: 0.95, emissive: 0x2a2316 }), white: mat(0xf4f4f2, { roughness: 0.5, emissive: 0x3a3a38 }),
    steel: mat(0xb9c2cd, { metalness: 0.6, roughness: 0.35 }), brass: mat(0xc9a24d, { metalness: 0.7, roughness: 0.4 }), dark: mat(0x1b1d20, { roughness: 0.7 }),
    carcass: mat(0xf1efe9, { roughness: 0.7, emissive: 0x3b3a37 }), front: mat(0x4f6b84, { roughness: 0.55, emissive: 0x141c25 }), stone: mat(0xdad7d0, { roughness: 0.35, emissive: 0x38362f }),
    glassb: mat(0xbfd8e6, { roughness: 0.2, emissive: 0x2a3a44 }), card: mat(0xc8ad82, { roughness: 0.9 }), render: mat(0xe3dccb, { roughness: 0.9, emissive: 0x403c32 }), board: mat(0xe8e0cc, { roughness: 0.92, emissive: 0x5a5242 }),
    orange: mat(0xff7a1a, { roughness: 0.6 }), red: mat(0xd62828, { roughness: 0.6 }), seal: mat(0xf2f2ee, { roughness: 0.4 }), fridge: mat(0xc5ccd3, { metalness: 0.4, roughness: 0.4 }),
    redGhost: ghost(0xd62828, 0.5), okGhost: ghost(0x2fbf71, 0.45), sphere: ghost(0x2b8fd6, 0.4), pad: ghost(0xfff1a8, 0.5), setout: ghost(0x2b8fd6, 0.25),
  };
};

/* ---------- parts shared by the walk scene and the zoom rooms ---------- */
// A door set in its own coordinates: x along the wall, y up from the slab, z through the wall. Opening 0.82 m, leaf 0.72 m by 2.04 m, jambs 32 mm, architraves 67 by 18 mm. Sizes are typical.
function doorSet(kit, m, { w = 0.82, leaf = true, jambs = true, ajar = 0, hinge = 1, side = 1, faces = [1, -1] } = {}) {
  const { box, rod } = kit, g = new THREE.Group(), lw = 0.72, jt = 0.032, jd = 0.158, ix = lw / 2 + 0.003, AW = 0.067, AT = 0.018, zf = 0.0885;
  if (jambs) {
    for (const s of [-1, 1]) g.add(box(jt, 2.095, jd, m.timber, s * (ix + jt / 2), 1.0475, 0));
    g.add(box(2 * ix + 2 * jt, jt, jd, m.timber, 0, 2.063 + jt / 2, 0));
  }
  for (const f of faces) {
    for (const s of [-1, 1]) g.add(box(AW, 2.069, AT, m.trim, s * (ix + 0.006 + AW / 2), 2.069 / 2, f * zf));
    g.add(box(2 * (ix + 0.006 + AW), AW, AT, m.trim, 0, 2.069 + AW / 2, f * zf));
  }
  if (leaf) {
    const hs = hinge, lf = new THREE.Group();
    lf.position.set(hs * lw / 2, 0, 0); lf.rotation.y = hs * side * ajar;
    lf.add(box(lw, 2.04, 0.035, m.prime, -hs * lw / 2, 1.04, 0));
    for (const y of [0.2, 1.04, 1.9]) lf.add(box(0.014, 0.09, 0.04, m.brass, 0, y, 0));
    for (const f of [1, -1]) { lf.add(box(0.045, 0.045, 0.008, m.steel, -hs * (lw - 0.06), 1.0, f * 0.0215), rod([-hs * (lw - 0.06), 1.0, f * 0.034], [-hs * (lw - 0.17), 1.0, f * 0.034], 0.007, m.steel, 8)); }
    g.add(lf);
  }
  return g;
}

// Stair in its own coordinates: x is the run (first riser front at x = 0), y is up from the ground, z is across. n risers, riser R, going G, width W between stringers, landing length L.
function stairParts(kit, m, { n = 6, R = 0.185, G = 0.25, W = 1.0, L = 1.2, land = true } = {}) {
  const { box, extrudeProfile } = kit, ST = 0.045, TT = 0.032, RT = 0.018, NO = 0.02, xl = (n - 1) * G, xe = land ? xl + L : xl + G, hb = 0.28;
  const poly = [[0, 0], [0, R]];
  for (let t = 1; t < n; t++) poly.push([t * G, t * R], [t * G, (t + 1) * R]);
  poly.push([xe, n * R], [xe, n * R - hb], [xl, n * R - hb], [Math.max(0.02, xl - (n * R - hb) * G / R), 0]);
  const stringers = grp(...[-1, 1].map((s) => { const me = extrudeProfile(poly, ST, m.stringer); me.position.z = s * (W / 2 + ST / 2); return me; }));
  const treads = grp(), risers = grp(), nosing = grp();
  for (let t = 1; t < n; t++) {
    treads.add(box(G + NO, TT, W, m.oak, (t - 1) * G + (G - NO) / 2, t * R - TT / 2, 0));
    nosing.add(box(0.045, 0.005, W - 0.02, m.orange, (t - 1) * G - NO + 0.0275, t * R + 0.0025, 0));
  }
  treads.add(box(xe - (xl - NO), TT, W, m.oak, (xe + xl - NO) / 2, n * R - TT / 2, 0));
  nosing.add(box(0.045, 0.005, W - 0.02, m.orange, xl - NO + 0.0275, n * R + 0.0025, 0));
  for (let t = 1; t <= n; t++) risers.add(box(RT, R - TT, W, m.prime, (t - 1) * G + RT / 2, (t - 1) * R + (R - TT) / 2, 0));
  const posts = grp(...[-1, 1].map((s) => box(0.09, n * R - hb, 0.09, m.timber, xe - 0.07, (n * R - hb) / 2, s * (W / 2 + ST / 2))));
  return { stringers, treads, risers, nosing, posts, poly, xl, xe, n, R, G, W, ST, NO, yn: (x) => R + (R / G) * (x + NO) };
}

// Barrier along both sides of a stair: posts at the foot, at the top of the flight and at the end of the landing, a round top rail that also serves as the handrail, a bottom rail and 12 mm balusters at 112 mm
// pitch, which leaves 100 mm clear. Heights: 865 mm above the nosing line on the flight, 1 m above the landing. `skip` leaves one baluster out so the gap grows past 125 mm.
function barrierParts(kit, m, st, { skip = null } = {}) {
  const { box, rod, cyl } = kit, { n, R, G, W, ST, xl, xe, yn } = st, zs = W / 2 + ST + 0.045, HS = 0.865, HL = 1.0, RAD = 0.0225, BR = 0.09, PITCH = 0.112;
  const posts = grp(), rails = grp(), bal = grp(), skipped = grp(); let skipPos = null;
  const yr = (x) => yn(x) + HS, ylL = n * R + HL;
  for (const s of [-1, 1]) {
    const z = s * zs;
    posts.add(box(0.09, yr(0.06) + 0.06, 0.09, m.timber, 0.06, (yr(0.06) + 0.06) / 2, z), box(0.09, ylL, 0.09, m.timber, xl, ylL / 2, z), box(0.09, ylL, 0.09, m.timber, xe - 0.07, ylL / 2, z));
    rails.add(rod([0.06, yr(0.06) - RAD, z], [xl, yr(xl) - RAD, z], RAD, m.oak, 12), rod([xl, ylL - RAD, z], [xe - 0.07, ylL - RAD, z], RAD, m.oak, 12));
    rails.add(rod([0.06, yn(0.06) + BR, z], [xl, yn(xl) + BR, z], 0.02, m.timber, 8), rod([xl, n * R + BR, z], [xe - 0.07, n * R + BR, z], 0.02, m.timber, 8));
    for (let x = 0.06 + PITCH; x < xl - 0.03; x += PITCH) bal.add(rod([x, yn(x) + BR, z], [x, yr(x) - RAD, z], 0.006, m.steel, 6));
    let k = 0;
    for (let x = xl + PITCH; x < xe - 0.07 - 0.03; x += PITCH, k++) {
      const r = rod([x, n * R + BR, z], [x, ylL - RAD, z], 0.006, m.steel, 6);
      if (skip && s === skip.s && k === skip.k) { skipped.add(r); skipPos = [x, n * R + 0.75, z]; } else bal.add(r);
    }
  }
  return { posts, rails, bal, skipped, skipPos, yr, ylL };
}

/* ---------- walk scene ---------- */
const SX = 0.3, SZ = 15.4, SN = 6;   // sample stair, clear of the Step 1 skip bin and toilet: local x runs toward -z from z = 15.4, so the landing ends at z = 12.95
function build(kit) {
  const { box, cyl, rod, textPlane, extrudeProfile } = kit;
  const mk = (n) => { const g = new THREE.Group(); g.name = n; return g; };
  const s12 = step12.build(kit), m = MAT(kit), { H, SLAB } = F, CEIL = H + SLAB;
  const KEEP = ['ceilSet', 'ceilTape', 'wallsSet', 'wallTape', 'ceilb', 'fixc', 'covers'];
  const layers = s12.layers.filter((l) => (l.from === undefined && l.until === undefined) || KEEP.includes(l.group.name)).map(({ group }) => ({ group }));
  const sign = (lines, w, h, x, y, z, ry = 0) => { const s = textPlane(lines, w, h); s.position.set(x, y, z); s.rotation.y = ry; return s; };
  const post = (g, x, h, z) => g.add(cyl(0.025, h, m.steel, x, h / 2, z, 8));
  const onStair = (n) => { const g = mk(n); g.position.set(SX, 0, SZ); g.rotation.y = Math.PI / 2; return g; };

  // internal doors, with the doorway at the end of the bathroom wall left as a cased opening
  const PART = [{ id: 'p1', ext: false, a: [-5.26, 1.2], b: [-2.0, 1.2], open: [] }, { id: 'p2', ext: false, a: [-2.0, 1.245], b: [-2.0, 5.455], open: [{ at: 3.6, w: 0.82, sill: 0 }] }];
  const wOf = (id) => wallInfo([...WALLS, ...PART].find((q) => q.id === id));
  const doors = mk('doors'), place = (g, w, u) => { const p = worldAt(w, u, 0, 0); g.position.set(p[0], p[1], p[2]); g.rotation.y = w.theta; doors.add(g); };
  const DOORS = [['i1', 0, { side: 1 }], ['i2', 0, { side: -1 }], ['i3', 1, { side: -1, ajar: 0.75 }], ['i4', 0, { side: 1 }], ['p2', 0, { side: -1 }]];
  for (const [id, k, o] of DOORS) { const w = wOf(id); place(doorSet(kit, m, o), w, w.open[k].u); }
  { const w = wOf('i3'); place(doorSet(kit, m, { leaf: false, jambs: false }), w, w.open[0].u); }

  // skirting: 67 by 18 mm, run along every lined wall except the doorways and the bathroom
  const skG = [], inWet = (x, z) => x > -5.3 && x < -2.0 && z > 1.2 && z < 5.5;
  for (const raw of [...WALLS, ...PART]) {
    const w = wallInfo(raw), zones = w.open.filter((o) => o.sill === 0).map((o) => [o.u - o.w / 2 - 0.026, o.u + o.w / 2 + 0.026]).sort((p, q) => p[0] - q[0]), segs = []; let at = 0;
    for (const z of zones) { if (z[0] > at + 0.02) segs.push([at, z[0]]); at = z[1]; }
    if (w.len > at + 0.02) segs.push([at, w.len]);
    for (const f of raw.ext ? [1] : [1, -1]) for (const [a, b] of segs) {
      const p = worldAt(w, (a + b) / 2, 0.0335, f * 0.0885); if (inWet(p[0], p[2])) continue;
      const g = new THREE.BoxGeometry(b - a, 0.067, 0.018); g.rotateY(w.theta); g.translate(p[0], p[1], p[2]); skG.push(g);
    }
  }
  const skirt = mk('skirt'); { const me = new THREE.Mesh(mergeGeometries(skG, false), m.trim); skirt.add(me); }

  // delivery: a pallet of doors, a bundle of trims, flat-pack cabinets and stair treads in the east margin
  const stock = mk('stock'), sx = 6.5, sz = 4.0;
  stock.add(box(1.3, 0.1, 3.6, m.timber, sx, 0.05, sz), box(0.78, 0.28, 2.1, m.prime, sx - 0.28, 0.24, sz + 0.7), box(0.25, 0.14, 2.4, m.trim, sx + 0.38, 0.17, sz + 0.5), box(0.2, 0.1, 2.4, m.trim, sx + 0.38, 0.29, sz + 0.5));
  for (let i = 0; i < 3; i++) stock.add(box(0.3, 0.07, 1.0, m.oak, sx + 0.38, 0.375 + i * 0.075, sz + 0.5));
  stock.add(box(0.6, 0.75, 0.36, m.card, sx - 0.3, 0.475, sz - 1.3), box(0.6, 0.75, 0.36, m.card, sx + 0.3, 0.475, sz - 1.3), box(0.9, 0.2, 0.62, m.card, sx, 0.2, sz - 0.7), box(0.6, 0.45, 0.36, m.card, sx - 0.3, 0.325, sz - 0.7));
  stock.add(sign(['JOINERY STOCK', 'Doors, trims, cabinets, stair parts', 'Dry, flat, off the ground, wrapped'], 1.6, 0.5, sx, 0.85, sz + 2.1, 0), cyl(0.025, 0.85, m.steel, sx - 0.82, 0.425, sz + 2.1, 8), cyl(0.025, 0.85, m.steel, sx + 0.82, 0.425, sz + 2.1, 8));

  // kitchen: an L-shaped run along the wall between the middle and front rooms, 150 mm plinth, 715 mm carcass, 35 mm top (900 mm in all), overheads 600 mm above the bench
  const kit1 = mk('kitchen'), kOkU2 = mk('kfrontOk'), kOkU2b = mk('kfrontOk2'), kBad = mk('kfrontBad');
  const z0 = 5.6, zf = 6.18, xe = 5.2055, xw = 2.6, CY = 0.15 + 0.7155 / 2;
  kit1.add(box(xe - xw, 0.15, 0.5, m.dark, (xe + xw) / 2, 0.075, z0 + 0.25 + 0.0), box(xe - xw, 0.7155, 0.58, m.carcass, (xe + xw) / 2, CY, (z0 + zf) / 2));
  kit1.add(box(0.6, 0.15, 1.2, m.dark, xe - 0.3, 0.075, zf + 0.6 - 0.03), box(0.58, 0.7155, 0.62, m.carcass, xe - 0.29, CY, zf + 0.31));
  kit1.add(box(xe - xw, 0.035, 0.62, m.stone, (xe + xw) / 2, 0.8825, z0 + 0.31), box(0.62, 0.035, 0.6, m.stone, xe - 0.31, 0.8825, zf + 0.31 + 0.0));
  const fr = (xc, wd, y = 0.5, h = 0.7, parent = kit1) => { const f = box(wd - 0.006, h, 0.018, m.front, xc, y, zf + 0.009); parent.add(f, box(0.012, 0.012, 0.012, m.steel, xc, y + h / 2 - 0.05, zf + 0.026), box(wd * 0.45, 0.012, 0.012, m.steel, xc, y + h / 2 - 0.05, zf + 0.026)); return f; };
  fr(3.0, 0.8); fr(4.3, 0.6);
  fr(3.7, 0.6, 0.5, 0.7, kOkU2); fr(3.7, 0.6, 0.5, 0.7, kOkU2b); fr(3.7, 0.6, 0.486, 0.7, kBad);
  { const f = box(0.018, 0.7, 0.594, m.front, xe - 0.58 - 0.009, 0.5, zf + 0.34); kit1.add(f, box(0.012, 0.012, 0.3, m.steel, xe - 0.58 - 0.026, 0.8, zf + 0.34)); }
  kit1.add(box(0.7, 1.75, 0.65, m.fridge, xe - 0.33, 0.15 + 0.875 - 0.15, 7.22), box(0.7, 0.01, 0.01, m.dark, xe - 0.33, 1.3, 7.22 - 0.331));
  // cooktop, sink and tap, splashback, overhead cabinets and rangehood
  kit1.add(box(0.6, 0.008, 0.5, m.dark, 3.0, 0.904, z0 + 0.3)); for (const [dx, dz] of [[-0.14, -0.1], [0.14, -0.1], [-0.14, 0.1], [0.14, 0.1]]) kit1.add(cyl(0.07, 0.005, m.steel, 3.0 + dx, 0.908, z0 + 0.3 + dz, 16));
  kit1.add(box(0.5, 0.012, 0.4, m.steel, 4.3, 0.9, z0 + 0.32), box(0.46, 0.006, 0.36, m.dark, 4.3, 0.904, z0 + 0.32), rod([4.3, 0.9, z0 + 0.08], [4.3, 1.12, z0 + 0.08], 0.011, m.steel, 8), rod([4.3, 1.12, z0 + 0.08], [4.3, 1.12, z0 + 0.2], 0.011, m.steel, 8));
  kit1.add(box(xe - xw, 0.6, 0.012, m.glassb, (xe + xw) / 2, 1.2, 5.5795 + 0.006));
  kit1.add(box(0.8, 0.12, 0.5, m.steel, 3.0, 1.62, z0 + 0.25), box(0.22, 1.2, 0.22, m.steel, 3.0, 2.22, z0 + 0.11));
  for (const [xc, wd] of [[3.7, 0.6], [4.3, 0.6]]) kit1.add(box(wd - 0.006, 0.7, 0.32, m.front, xc, 1.85, z0 + 0.16));
  const ksign = mk('ksign'); ksign.add(sign(['KITCHEN JOINERY', 'Level, plumb, even gaps, sealed', 'Bench height is typical, not a rule'], 1.5, 0.5, 3.35, 0.5, 7.4, 0), cyl(0.025, 0.5, m.steel, 2.65, 0.25, 7.4, 8), cyl(0.025, 0.5, m.steel, 4.05, 0.25, 7.4, 8));

  // wardrobe: 1.8 m wide, 600 mm deep, open front with a shelf and rail, one door closed and one open
  const ward = mk('wardrobe'), wx1 = 5.2055, wx0 = wx1 - 0.6, wz0 = 3.62, wz1 = 5.4205, wh = 2.4;
  ward.add(box(0.6, wh, 0.016, m.carcass, (wx0 + wx1) / 2, wh / 2, wz0 + 0.008), box(0.6, wh, 0.016, m.carcass, (wx0 + wx1) / 2, wh / 2, wz1 - 0.008), box(0.6, 0.016, wz1 - wz0, m.carcass, (wx0 + wx1) / 2, wh - 0.008, (wz0 + wz1) / 2), box(0.6, 0.016, wz1 - wz0, m.carcass, (wx0 + wx1) / 2, 0.15, (wz0 + wz1) / 2));
  ward.add(box(0.016, wh, wz1 - wz0, m.carcass, wx1 - 0.008, wh / 2, (wz0 + wz1) / 2), box(0.38, 0.016, wz1 - wz0 - 0.032, m.carcass, wx1 - 0.19, 1.95, (wz0 + wz1) / 2), rod([wx1 - 0.3, 1.78, wz0 + 0.016], [wx1 - 0.3, 1.78, wz1 - 0.016], 0.0125, m.steel, 10));
  ward.add(box(0.018, 2.24, 0.894, m.front, wx0 - 0.009, 0.15 + 1.12, wz0 + 0.45 + 0.0));
  { const pv = new THREE.Group(); pv.position.set(wx0 - 0.009, 0, wz1); pv.rotation.y = 1.35; pv.add(box(0.018, 2.24, 0.894, m.front, 0, 0.15 + 1.12, -0.447)); ward.add(pv); }
  ward.add(sign(['WARDROBE', 'Fixed to the framing,', 'not to the sheet'], 1.0, 0.45, 4.0, 0.9, 3.2, -Math.PI / 2), cyl(0.025, 0.9, m.steel, 4.0, 0.45, 2.75, 8), cyl(0.025, 0.9, m.steel, 4.0, 0.45, 3.65, 8));

  // sample entry stair, landing and balustrade in the front yard, with a wall and door at the landing
  const st = stairParts(kit, m, { n: SN, R: 0.185, G: 0.25, W: 1.0, L: 1.2 }), bp = barrierParts(kit, m, st, { skip: { s: 1, k: 3 } });
  const setout = onStair('setout'), stairG = onStair('stair'), lmark = onStair('lmark'), barG = onStair('barrier'), skA = onStair('skipA'), skB = onStair('skipB'), defB = onStair('defStair');
  const ghostWedge = extrudeProfile(st.poly, 1.09, m.setout); setout.add(ghostWedge);
  const rodG = mk('storyrod'); { rodG.add(box(0.05, 1.3, 0.02, m.timber, SX - 0.95, 0.65, SZ + 0.25)); for (let i = 1; i <= SN; i++) rodG.add(box(0.1, 0.012, 0.03, m.red, SX - 0.95, i * 0.185, SZ + 0.25)); rodG.add(sign(['STORY ROD', 'Total rise ÷ risers = each riser', '1110 ÷ 6 = 185 mm'], 1.3, 0.5, SX - 1.85, 0.5, SZ + 0.9, 0), cyl(0.025, 0.5, m.steel, SX - 2.45, 0.25, SZ + 0.9, 8), cyl(0.025, 0.5, m.steel, SX - 1.25, 0.25, SZ + 0.9, 8)); }
  stairG.add(st.stringers, st.treads, st.risers, st.nosing, st.posts);
  lmark.add(box(0.75, 0.012, 0.96, m.pad, st.xe - 0.375, SN * 0.185 + 0.008, 0));
  barG.add(bp.posts, bp.rails, bp.bal);
  skA.add(bp.skipped); const skR = bp.skipped.clone(); skB.add(skR);
  defB.add(new THREE.Mesh(new THREE.SphereGeometry(0.0625, 16, 12), m.redGhost)); defB.children[0].position.set(...bp.skipPos);
  defB.add(sign(['GAP OVER 125 mm', 'A 125 mm sphere passes through'], 1.25, 0.42, 0.55, 1.5, 1.05, 0), cyl(0.025, 1.5, m.steel, 0.55, 0.75, 1.05, 8));
  const entry = mk('entry'), wz = SZ - st.xe - 0.08, WY = SN * 0.185;
  entry.add(box(0.84, 3.51, 0.16, m.render, SX - 0.88, 3.51 / 2, wz), box(0.84, 3.51, 0.16, m.render, SX + 0.88, 3.51 / 2, wz), box(0.92, WY, 0.16, m.render, SX, WY / 2, wz), box(0.92, 0.3, 0.16, m.render, SX, WY + 2.1 + 0.15, wz));
  entry.add(box(0.82, 2.04, 0.04, m.prime, SX, WY + 0.02 + 1.02, wz + 0.02), box(0.045, 0.045, 0.01, m.steel, SX + 0.3, WY + 1.0, wz + 0.05), rod([SX + 0.3, WY + 1.0, wz + 0.065], [SX + 0.2, WY + 1.0, wz + 0.065], 0.007, m.steel, 8));
  entry.add(sign(['SAMPLE ENTRY STAIR', '6 risers of 185 mm, goings of 250 mm', 'Illustrative: a house with a raised floor'], 1.7, 0.6, SX, 0.85, SZ + 0.75, 0), cyl(0.025, 0.85, m.steel, SX - 0.9, 0.425, SZ + 0.75, 8), cyl(0.025, 0.85, m.steel, SX + 0.9, 0.425, SZ + 0.75, 8));

  // defects to find at inspection: a drawer front 14 mm out of line, and a missing baluster
  const defk = mk('defk');
  defk.add(box(0.606, 0.714, 0.03, m.redGhost, 3.7, 0.5, zf + 0.012), sign(['FRONT OUT OF LINE', '14 mm low: uneven gaps'], 1.1, 0.4, 2.95, 0.5, 6.9, 0), cyl(0.025, 0.5, m.steel, 2.45, 0.25, 6.9, 8), cyl(0.025, 0.5, m.steel, 3.45, 0.25, 6.9, 8));

  // fixing-stage sign in the front yard, west of the sample stair, facing east (the house front is at z = 11.5)
  const stage = mk('stage');
  stage.add(sign(['FIXING STAGE', 'Linings, doors, trims, fittings fixed', 'Then the payment is due'], 1.5, 0.65, -5.8, 1.45, 12.4, Math.PI / 2), cyl(0.025, 1.45, m.steel, -5.8, 0.72, 11.65, 8), cyl(0.025, 1.45, m.steel, -5.8, 0.72, 13.15, 8));

  const baseCount = layers.length;   // the Step 12 layers come first, then this step's own, so a later step can keep the house and drop the yard
  layers.push({ group: stock, until: 4 }, { group: setout, until: 2 }, { group: rodG, until: 2 }, { group: doors, from: 1 }, { group: skirt, from: 1 }, { group: stairG, from: 2 }, { group: lmark, from: 2, until: 5 }, { group: entry },
    { group: barG, from: 3 }, { group: skA, from: 3, until: 5 }, { group: skB, from: 6 }, { group: kit1, from: 4 }, { group: ksign, from: 4, until: 5 }, { group: kOkU2, from: 4, until: 5 }, { group: kOkU2b, from: 6 }, { group: ward, from: 4 },
    { group: kBad, from: 5, until: 6 }, { group: defk, from: 5, until: 6 }, { group: defB, from: 5, until: 6 }, { group: stage, from: 6 });
  return { layers, baseCount, colliders: [...s12.colliders, { x0: SX - 1.35, x1: SX + 1.35, z0: SZ - st.xe - 0.2, z1: SZ + 0.1 }], tickers: s12.tickers, spawn: { pos: [4, 18.5], yaw: 0, pitch: 0.2 }, map: s12.map, orbit: { pos: [9.5, 9, 18], target: [0, 1.0, 6] }, hotspots: HOTSPOTS };
}

/* ---------- hotspots ---------- */
const HOTSPOTS = [
  { id: 'stock', title: 'Joinery delivered, checked and protected', pos: [6.5, 1.5, 3.0], stand: [6.5, 9.2], from: 0, until: 4, drawing: 'order',
    summary: 'Doors, architraves, skirting, cabinets and stair parts arrive on site. Each item is checked against the order and the plans, and stored flat, dry and wrapped until the trade that fixes it is ready.',
    learn: [['Check every item against the order and the plans before it is signed for: door sizes and swings, hardware, cabinet drawings and the stair and balustrade drawings.', 'T'], ['The BPC guide expects all door edges to be sealed or painted (clause 11.6), so check that doors arrive with the edges done or plan to seal them before hanging.', 'V', 'bpcTol26'], ['The BPC guide also expects porous cut edges on joinery to be sealed (13.10). Benchtop cut-outs and trimmed panels are the usual misses.', 'V', 'bpcTol26'], ['Timber and board move as they gain or lose moisture, so deliver after lock-up and after the plaster has dried, and store doors flat and off the ground (Typical).', 'T'], ['Wrap or board over finished joinery and stair treads once they are fixed, because every trade that follows can damage them (Typical).', 'T'], ['Door, cabinet and stair sizes in the model are typical. The drawings and the specification set the real sizes.', 'T']] },
  { id: 'stair', title: 'Stair geometry: rise, going and set-out', pos: [0.3, 0.65, 14.7], stand: [3.5, 14.7], from: 0, detail: 'stairgeo', drawing: 'stair',
    summary: 'A stair is set out from the total rise. Divide it into equal risers, pick a going, and check the result against the NCC limits before any timber is cut. The sample stair has 6 risers of 185 mm and goings of 250 mm.',
    learn: [['A flight has at least 2 and not more than 18 risers.', 'V', 'nccHp112'], ['For stairs other than spiral stairs: riser 115 to 190 mm, going 240 to 355 mm, and twice the riser plus the going between 550 and 700 mm. The sample stair gives 2 x 185 + 250 = 620 mm.', 'V', 'nccHp112'], ['Dimensions are treated as constant when adjacent risers or goings differ by no more than 5 mm and the largest and smallest in a flight differ by no more than 10 mm.', 'V', 'nccHp112'], ['No opening between treads may let a 125 mm sphere pass. An attic or storeroom stair serving non-habitable rooms used infrequently has its own table (riser 130 to 225 mm, going 215 to 355 mm) and need not meet the 125 mm limit.', 'V', 'nccHp112'], ['Up to 3 consecutive winders replace a quarter landing and up to 6 replace a half landing. A tapered tread\'s going is measured at the middle of the width for treads 1 m wide or less, and 400 mm in from each side for wider treads.', 'V', 'nccHp112'], ['The NCCB FAQ says there is no minimum stair width for a Class 1 house. The FAQ is undated and shows no state variation.', 'V', 'nccbStairFaq'], ['Headroom is not on the 11.2 page, which refers to Part 10.3. That page was not read, so no headroom figure is given here.', 'C', 'nccHp112'], ['Set out with a story rod marked at each riser: total rise divided by the number of risers, measured from the finished floor levels, so floor coverings fitted later do not upset the first and last riser (Typical).', 'T'], ['The archived 2015 VBA guide says riser and going must stay consistent after floor finishes, with up to 5 mm deviation accepted if consistent. It was archived on 11 February 2022, so confirm against the current guide.', 'C', 'vbaStdTol2015']] },
  { id: 'landing', title: 'Landing, door threshold and slip resistance', pos: [0.3, 1.3, 13.65], stand: [3.3, 13.7], from: 2, drawing: 'stair',
    summary: 'The landing at the top of the sample stair is where the door opens. It has a minimum length, a flat surface, and the tread and nosing surfaces are tested for slip resistance.',
    learn: [['A landing is not less than 750 mm long (600 mm where the stair serves non-habitable rooms only) and no steeper than 1:50.', 'V', 'nccHp112'], ['A landing is needed where a door threshold opens onto a stair or ramp with a change in level of more than 3 risers or 570 mm, and it spans the full width of the doorway. Where a threshold is more than 230 mm above the adjoining surface, the steps must meet 11.2.2. This is a summary of the page, so read the clause.', 'V', 'nccHp112'], ['Slip resistance is tested to AS 4586. A tread surface is P3 or R10 dry and P4 or R11 wet. A nosing or landing edge strip is P3 dry and P4 wet. AS 4586 itself was not opened.', 'V', 'nccHp112'], ['A landing edge that leads to a flight below needs a compliant surface for at least 190 mm from the nosing, or a compliant nosing strip. The orange strips in the model are nosing strips.', 'V', 'nccHp112'], ['A ramp is not steeper than 1:8 and has landings at the top and bottom and at intervals of no more than 15 m. A driveway is not a ramp for this clause. A ramp provided to meet the Livable Housing Design Standard follows that Standard instead.', 'V', 'nccHp112'], ['The NCCB FAQ says entry stairs in uncovered areas are likely treated as wet surfaces, and the building surveyor decides. Stairs that do not serve a building, such as landscaping steps, need not comply.', 'C', 'nccbStairFaq'], ['The VBA says new livable housing requirements will apply to new houses and apartments, but the pages read give no date or level for Victoria. Confirm the adoption date and level before design.', 'C', 'vbaNccGuide']] },
  { id: 'barrier', title: 'Balustrade: heights, openings and handrails', pos: [0.89, 1.8, 14.1], stand: [2.7, 14.1], from: 3, detail: 'barrier', drawing: 'barrier',
    summary: 'A continuous barrier is needed wherever a person could fall 1 m or more. The sample landing is 1.11 m up, so it needs one. Height, openings and handrails each have their own rule.',
    learn: [['A continuous barrier is required where it is possible to fall 1 m or more. Retaining walls are excluded unless they are part of a delineated access path.', 'V', 'nccHp113'], ['Height: at least 865 mm above stair nosings or a ramp floor, and at least 1 m above the floor of landings, balconies, decks and corridors. A transition zone is allowed. 865 mm is acceptable at a landing where the barrier is on the inside edge and no longer than 500 mm.', 'V', 'nccHp113'], ['No opening may let a 125 mm sphere pass, measured above the nosing line on stairs. A non-habitable stair may use a 300 mm sphere, or top and intermediate rails with openings no more than 460 mm between rails.', 'V', 'nccHp113'], ['Where a fall exceeds 4 m, horizontal elements between 150 and 760 mm above the floor must not make the barrier easy to climb. The model fall is 1.11 m, and its balusters are vertical.', 'V', 'nccHp113'], ['A face-mounted barrier has a gap of no more than 40 mm to the edge face.', 'V', 'nccHp113'], ['Barriers are designed to AS/NZS 1170.1 loading, and glass and windows serving as barriers comply with H1D8. AS/NZS 1170.1 was not opened, so no load figures are given.', 'C', 'nccHp113'], ['A handrail is required on at least one side of a flight or ramp, full length, with the top at least 865 mm above the nosings. It is continuous, with nothing to obstruct the handhold (newel posts and ball stanchions are allowed). It is not required where the change in level is under 1 m. A barrier top rail can serve as the handrail if it can be grasped. The 11.3 page is cut off at 11.3.5 and gives no wall clearance figure.', 'C', 'nccHp113'], ['The NCCB FAQ says a handrail may end where its associated barrier ends.', 'V', 'nccbStairFaq'], ['Openable bedroom windows 2 m or more above the surface beneath need protection: a 250 N resistance to a sphere passing, or a child-resistant release where a device can be removed. No further protection is needed if the openable part is at least 1.7 m above the floor. Other rooms with a floor 4 m or more above the surface beneath need an 865 mm barrier.', 'V', 'nccHp113']] },
  { id: 'door', title: 'Hanging a door: jamb, gaps and tolerances', pos: [2.0, 1.15, 5.62], stand: [2.0, 7.6], from: 1, detail: 'doorfix', drawing: 'door',
    summary: 'The jamb is packed plumb, the leaf is hung with an even gap on three sides, and the latch and hinges are set so the door swings and shuts without binding. The BPC guide gives the numbers.',
    learn: [['Internal door clearances must be uniform, with gaps of 2 to 5 mm, and not more than 20 mm at the floor after floor coverings are laid, checked within 3 months.', 'V', 'bpcTol26'], ['A door leaf is out of tolerance if it is out of square by more than 3 mm or twisted by more than 5 mm (for a door up to 2400 by 920 mm). Bow along the height is limited to 4 mm up to 2150 mm and 6 mm from 2150 to 2400 mm, and bow across the width to 3 mm up to 1020 mm.', 'V', 'bpcTol26'], ['Door furniture (handles, locks and latches) must operate as intended 3 months after completion, and doors must not bind or jam within 3 months.', 'V', 'bpcTol26'], ['All door edges are sealed or painted (11.6). External windows and doors are out of tolerance if off level or plumb by more than 5 mm over 1800 mm (11.1).', 'V', 'bpcTol26'], ['Hinge count, hinge positions and the lever height of about 1 m are industry practice and vary with the door and the hardware maker (Typical).', 'T'], ['The livable housing package mentions easier doorways, and the model\'s 820 mm opening takes a 720 mm leaf. Door and clear opening widths are Confirm until the Victorian requirement is known.', 'C', 'vbaAccessNews'], ['The BPC guide is advisory, applies to contracts entered into or work commenced from 1 August 2026, and says manufacturer instructions and legislation take precedence.', 'V', 'bpcTol26']] },
  { id: 'trim', title: 'Architraves and skirting', pos: [0.0, 2.1, 2.7], stand: [2.6, 2.7], from: 1, detail: 'doorfix', drawing: 'door',
    summary: 'Architraves hide the joint between jamb and wall, and skirting hides the joint between wall and floor. Both are fixed after the doors are hung and before painting.',
    learn: [['Mitre or butt gaps in architraves and similar trims are outside tolerance if visible and over 1 mm within 12 months, and over 2 mm after that.', 'V', 'bpcTol26'], ['Gaps in skirting over 2 mm within 24 months are outside tolerance. Faces must be aligned and flush and the quirk consistent.', 'V', 'bpcTol26'], ['Where plasterboard meets a dissimilar material, a junction that opens over 1 mm within 12 months is outside tolerance (12.2.6). The same care applies where the architrave meets the wall.', 'V', 'bpcTol26'], ['The model uses 67 by 18 mm architraves and skirting, set 6 mm back from the jamb edge so a small reveal shows. Trim sizes and profiles are a design choice (Typical).', 'T'], ['Skirting stops at the architraves, and is left off the bathroom walls where tiles will go to the floor (Typical).', 'T'], ['Trims are primed before fixing where possible and painted in Step 15, with the nail holes and joints filled first (Typical).', 'T']] },
  { id: 'kitchen', title: 'Kitchen joinery: cabinets, benchtop and sealing', pos: [4.3, 1.0, 5.95], stand: [4.3, 8.4], from: 4, detail: 'kitchen', drawing: 'joinery',
    summary: 'Base cabinets are set level on the plinth and fixed to the wall, the benchtop goes on and is sealed, and overhead cabinets hang from the framing. The licensed trades connect the sink, cooktop and oven afterwards.',
    learn: [['Cabinet doors and drawer fronts must be aligned with consistent gaps, checked within 6 months. The guide gives no numeric gap.', 'V', 'bpcTol26'], ['Benchtop joints are uniform, close-fitted and in the same plane, checked within 6 months, and sealed or flush-filled.', 'V', 'bpcTol26'], ['The bench-to-wall junction is sealed with a matching flexible sealant, and sink and basin seals must not leak within 6 months.', 'V', 'bpcTol26'], ['Porous cut edges, such as sink and cooktop cut-outs in a chipboard benchtop, are sealed.', 'V', 'bpcTol26'], ['The model uses a 150 mm plinth, a 715 mm carcass and a 35 mm top for a 900 mm bench, with overheads 600 mm above it. These are common sizes, not NCC rules. The pages read set no bench height, and AS/NZS 4386.1 was not opened.', 'C'], ['Final connections are made by the licensed plumber, gasfitter and electrician (Stages 8, 9 and 15). Cooktop and rangehood clearances come from the manufacturer\'s instructions and the gas or electrical Standards, which were not opened.', 'C'], ['Fix overhead cabinets to the noggings or studs that the carpenter blocked out in Step 3 and the plasterer lined over in Step 12, not to the sheet alone (Typical).', 'T']] },
  { id: 'wardrobe', title: 'Wardrobe: fixing to the framing', pos: [4.9, 1.78, 4.5], stand: [2.2, 4.5], from: 4, detail: 'wardrobe', drawing: 'joinery',
    summary: 'A wardrobe carries clothes, shelves and sometimes doors, so it is fixed to the framing and not to the plasterboard. The noggings were put in before the sheets went on.',
    learn: [['Heavy fittings are fixed to the framing, not to the sheeting (Western Australian bulletin, 2017).', 'V', 'waIb85'], ['Noggings or blocking for shelves, cabinets and rails go in before the sheets cover the frame (Typical). Photograph where they are, because they are hidden after lining.', 'T'], ['Hinged doors fall under the same alignment test as cabinet doors: consistent gaps, checked within 6 months. The BPC guide has no wardrobe-specific clause.', 'C', 'bpcTol26'], ['Rail height, shelf spans and the load a rail carries depend on the section, the span and the fixings. They come from the joiner\'s drawings (Typical).', 'T'], ['A sliding door needs a level track and a plumb frame. Check with a level before the doors are hung (Typical).', 'T']] },
  { id: 'check', title: 'Inspect doors, trims and cabinet fronts', pos: [3.7, 0.5, 6.18], stand: [3.7, 8.4], from: 5, until: 6, drawing: 'door',
    summary: 'Open and close every door, look along every cabinet front, and run a finger along every sealed joint. Defects found now are fixed before the painter and the final fit-off.',
    learn: [['Open each door through its full swing. It must not bind, jam or catch, the gaps must be even, and the latch must work.', 'V', 'bpcTol26'], ['Look along the cabinet fronts for alignment and even gaps. One front sits 14 mm low in the model.', 'V', 'bpcTol26'], ['Check that the sealant beads at the bench, sink and wall are continuous and match the surface.', 'V', 'bpcTol26'], ['The BPC guide judges defects from a normal viewing position of 1.5 m or more in diffused, non-critical light (600 mm for appliances and fixtures, 3 m for glass).', 'V', 'bpcTol26'], ['Joinery is not a named inspection stage. Ask the surveyor whether they want to see any of it, and keep a defect list with photographs (Typical).', 'T'], ['The BPC guide has limits of 3, 6, 12 and 24 months for different defects, so a callback after handover can still be a defect. Record the condition at handover (Typical).', 'T']] },
  { id: 'checkb', title: 'Test the barrier and the stair', pos: [0.89, 1.66, 13.7], stand: [2.6, 13.7], from: 5, until: 6, drawing: 'barrier',
    summary: 'A 125 mm sphere is the test for a barrier opening, and a tape or gauge is the test for every riser and going. One baluster is missing in the model, so the sphere passes.',
    learn: [['Try a 125 mm sphere or gauge at every opening, including the gap above the bottom rail and beside the stringer. Nothing may pass.', 'V', 'nccHp113'], ['Measure every riser and going. Adjacent risers or goings must differ by no more than 5 mm, and the largest and smallest in a flight by no more than 10 mm.', 'V', 'nccHp112'], ['Check the top rail is at least 865 mm above the nosing line on the flight and at least 1 m above the landing, and that the handrail is continuous and can be grasped.', 'V', 'nccHp113'], ['The BPC guide counts squeaks in floors and stairs within 24 months as outside tolerance. It has no separate stair or handrail tolerance in the sections read.', 'C', 'bpcTol26'], ['The barrier loads are in AS/NZS 1170.1, which was not opened. The pages read do not describe a site proof test, so ask the designer how the fixings are to be verified.', 'C', 'nccHp113'], ['Photograph the post fixings and bolts before any cover goes on (Typical).', 'T']] },
  { id: 'stage', title: 'The fixing stage and the payment', pos: [-5.8, 1.9, 12.4], stand: [-2.9, 12.4], from: 6, drawing: 'order',
    summary: 'The fixing stage is reached when every item on the CAV list is fixed. Joinery, doors and trims are most of it, but baths, basins, troughs and sinks are on the list too.',
    learn: [['The fixing stage means all internal cladding, architraves, skirting, doors and built-in shelves are fitted and fixed in position, plus baths, basins, troughs, sinks, cabinets and cupboards.', 'V', 'cavPay'], ['For a contract covering all stages the CAV page shows base 10 per cent, frame 15 per cent, lock-up 35 per cent and fixing 25 per cent, 85 per cent in total. A contract to build to fixing uses base 12 per cent, frame 18 per cent and lock-up 40 per cent. The page was last updated on 9 July 2025.', 'V', 'cavPay'], ['The Domestic Building Contracts Amendment Bill 2025 passed on 11 September 2025. Payment limits may change when the new laws start, so check the current CAV page before pricing a contract.', 'C', 'cavAmend'], ['File the delivery dockets, hardware and cabinet schedules, product data sheets, photos of the fixings and the surveyor\'s record with the permit documents (Typical).', 'T'], ['After this come tiling and floor coverings in Step 14, then painting and the final fix in Step 15.', 'T']] },
];

/* ---------- zoom rooms ---------- */
const details = {
  doorfix: {
    title: 'Door set, architrave and skirting', sub: 'Lower hinge side of an internal door: trimmer studs, one wall sheet, packers, jamb, leaf, hinges, architrave and skirting. The far wall face is cut away',
    floor: -0.03, gridSize: 2, camera: { pos: [0.95, 0.75, 1.2], target: [-0.05, 0.38, 0.03] },
    build(kit) {
      const { box, cyl } = kit, m = MAT(kit);
      const stud = grp(box(0.045, 0.9, 0.09, m.timber, -0.0225, 0.45, 0), box(0.045, 0.9, 0.09, m.timber, -0.0675, 0.45, 0));
      const sheet = grp(box(0.6, 0.9, 0.013, m.board, -0.3, 0.45, 0.0515));
      const pack = grp(box(0.004, 0.06, 0.05, m.timber, 0.002, 0.2, 0), box(0.004, 0.06, 0.05, m.timber, 0.002, 0.7, 0));
      const jamb = grp(box(0.032, 0.9, 0.158, m.timber, 0.02, 0.45, 0));
      const leaf = grp(box(0.35, 0.88, 0.035, m.prime, 0.214, 0.46, 0));
      const hinges = grp(box(0.014, 0.09, 0.04, m.brass, 0.0375, 0.2, 0), box(0.014, 0.09, 0.04, m.brass, 0.0375, 0.75, 0));
      const gap = grp(box(0.003, 0.88, 0.04, m.okGhost, 0.0375, 0.46, 0), box(0.35, 0.02, 0.04, m.okGhost, 0.214, 0.01, 0));
      const arch = grp(box(0.067, 0.9, 0.018, m.prime, -0.0035, 0.45, 0.067));
      const skirt = grp(box(0.5, 0.067, 0.018, m.prime, -0.287, 0.0335, 0.067));
      return { parts: [
        { id: 'stud', name: 'Trimmer and king stud', group: stud, explode: [-0.35, 0, 0], anchor: [-0.05, 0.82, -0.047], flag: 'T', spec: 'The opening is framed in Step 3. The model opening is 820 mm wide, with a 720 mm leaf and 32 mm jambs, which are typical sizes.', desc: 'The jamb is packed against the trimmer, not fixed to the sheet.' },
        { id: 'sheet', name: 'Wall sheet, cut at the opening', group: sheet, explode: [-0.3, 0, 0.3], anchor: [-0.3, 0.6, 0.059], flag: 'T', spec: 'Lined in Step 12. The sheet is cut cleanly to the trimmer face so the architrave can cover the edge.', desc: 'Only the near face is drawn, so the studs and packers show.' },
        { id: 'pack', name: 'Packers', group: pack, explode: [0, 0.2, -0.25], anchor: [0.002, 0.74, -0.03], flag: 'T', spec: 'Thin packers between the trimmer and the jamb let the carpenter bring the jamb plumb and straight before fixing through them. Positions and number are industry practice.', desc: 'A few millimetres of packing each side of the fixing.' },
        { id: 'jamb', name: 'Jamb', group: jamb, explode: [0.12, 0, -0.22], anchor: [0.02, 0.82, -0.081], flag: 'T', spec: 'The BPC guide expects external windows and doors to be within 5 mm of level and plumb over 1800 mm (11.1). Internal jambs are set plumb so the clearances stay even (Typical).', desc: 'The leaf hangs from this edge, so a leaning jamb gives a leaning door.' },
        { id: 'leaf', name: 'Door leaf', group: leaf, explode: [0.4, 0, 0], anchor: [0.3, 0.7, 0.0185], flag: 'V', src: 'bpcTol26', spec: 'Out of tolerance if out of square by more than 3 mm or twisted by more than 5 mm (door up to 2400 by 920 mm). All door edges are sealed or painted (11.6).', desc: 'Only the lower hinge half is drawn.' },
        { id: 'hinges', name: 'Hinges', group: hinges, explode: [0.2, 0.15, 0.3], anchor: [0.0375, 0.75, 0.025], flag: 'T', spec: 'Three hinges are common on a full-height door, with the number and positions set by the door and hardware maker. Hinges are checked so the door does not bind or jam within 3 months (BPC 11.7).', desc: 'Cut into both the jamb and the door edge, flush.' },
        { id: 'gap', name: 'Clearance gaps', group: gap, explode: [0.05, 0, 0.0], anchor: [0.0375, 0.3, 0.02], flag: 'V', src: 'bpcTol26', spec: 'Gaps between 2 and 5 mm, uniform, and not more than 20 mm at the floor after floor coverings are laid, checked within 3 months (11.4). The model draws a 3 mm side gap and a 20 mm floor gap.', desc: 'The green strips are the clearance gaps.' },
        { id: 'arch', name: 'Architrave', group: arch, explode: [-0.12, 0, 0.35], anchor: [-0.0035, 0.8, 0.077], flag: 'V', src: 'bpcTol26', spec: 'A visible mitre or butt gap over 1 mm within 12 months (and over 2 mm after that) is outside tolerance. Faces are aligned and flush. The model uses 67 by 18 mm, set 6 mm back from the jamb edge.', desc: 'Covers the joint between the jamb and the sheet.' },
        { id: 'skirt', name: 'Skirting', group: skirt, explode: [-0.3, 0, 0.35], anchor: [-0.3, 0.07, 0.078], flag: 'V', src: 'bpcTol26', spec: 'Gaps in skirting over 2 mm within 24 months are outside tolerance, and the quirk must be consistent. The skirting butts into the architrave.', desc: 'Runs up to the architrave at the bottom of the wall.' },
      ] };
    },
  },

  stairgeo: {
    title: 'Stair flight: rise, going and nosing', sub: 'Three risers of 185 mm and goings of 250 mm with a 20 mm nosing, one cut-out stringer and slip-resistant nosing strips. The far stringer is cut away',
    floor: -0.02, gridSize: 3, camera: { pos: [1.4, 0.8, 1.7], target: [0.35, 0.3, 0.05] },
    build(kit) {
      const { box, rod } = kit, m = MAT(kit), R = 0.185, G = 0.25, st = stairParts(kit, m, { n: 3, R, G, W: 0.7, land: false });
      const near = st.stringers.children[1]; st.stringers.remove(near);
      const dimR = grp(box(0.012, R, 0.012, m.okGhost, 0.23, 1.5 * R, 0)), dimG = grp(box(G, 0.012, 0.012, m.okGhost, 0.355, 2 * R + 0.012, 0.1));
      const line = grp(rod([-0.02, R + 0.02, 0.0], [0.48, 3 * R + 0.02, 0.0], 0.004, m.red, 6));
      return { parts: [
        { id: 'stringer', name: 'Stringer', group: grp(near), explode: [0, 0, 0.4], anchor: [0.35, 0.3, 0.3725], flag: 'T', spec: 'A cut-out stringer carries the treads and risers. The model uses a 45 mm thick timber stringer on each side. Size, timber grade and spans are the stair builder\'s or engineer\'s design.', desc: 'The saw-tooth edge is cut to the riser and going.' },
        { id: 'treads', name: 'Treads', group: st.treads, explode: [0, 0.18, 0], anchor: [0.12, 0.19, 0.0], flag: 'T', spec: 'The model uses 32 mm hardwood treads with a 20 mm nosing overhang. A tread surface is P3 or R10 dry and P4 or R11 wet (AS 4586, not opened).', desc: 'Each tread sits on the stringers and under the riser above.' },
        { id: 'risers', name: 'Risers', group: st.risers, explode: [-0.25, 0, 0], anchor: [0.009, 0.1, 0.0], flag: 'V', src: 'nccHp112', spec: 'Closed risers, so the 125 mm sphere rule for openings between treads is met without checking a gap. Open-riser stairs must stop a 125 mm sphere.', desc: 'The vertical board between two treads.' },
        { id: 'nosing', name: 'Nosing strip', group: st.nosing, explode: [0, 0.35, 0], anchor: [0.2575, 0.385, 0.0], flag: 'V', src: 'nccHp112', spec: 'A nosing or landing edge strip is P3 dry and P4 wet. A landing edge that leads to a flight below needs a compliant surface for at least 190 mm from the nosing, or a compliant nosing strip.', desc: 'A contrasting strip at the front edge of each tread.' },
        { id: 'rdim', name: 'Riser: 115 to 190 mm', group: dimR, explode: [0, 0.1, 0.35], anchor: [0.23, 0.28, 0.0], flag: 'V', src: 'nccHp112', spec: 'Riser between 115 and 190 mm. Adjacent risers differ by no more than 5 mm, and the largest and smallest in a flight by no more than 10 mm. The model riser is 185 mm.', desc: 'The green bar is one riser.' },
        { id: 'gdim', name: 'Going: 240 to 355 mm', group: dimG, explode: [0, 0.1, 0.35], anchor: [0.355, 0.39, 0.1], flag: 'V', src: 'nccHp112', spec: 'Going between 240 and 355 mm, measured nosing to nosing. 2R + G is between 550 and 700 mm. The model gives 2 x 185 + 250 = 620 mm.', desc: 'The green bar is one going.' },
        { id: 'line', name: 'Line of nosings', group: line, explode: [0, 0.45, 0], anchor: [0.23, 0.42, 0.0], flag: 'V', src: 'nccHp113', spec: 'A stair barrier is at least 865 mm above the nosings, so this line is where the barrier height is measured from.', desc: 'The red line joins the nosings.' },
      ] };
    },
  },

  barrier: {
    title: 'Landing balustrade bay', sub: 'A 1 m bay: deck, joist, two posts bolted through, bottom rail, eight 12 mm balusters, round top rail and a 125 mm sphere in the widest gap',
    floor: -0.2, gridSize: 3, camera: { pos: [1.6, 1.1, 2.2], target: [0, 0.65, 0.05] },
    build(kit) {
      const { box, rod } = kit, m = MAT(kit), THREE_ = kit.THREE;
      const deck = grp(box(1.3, 0.032, 0.75, m.oak, 0, -0.016, -0.375), box(1.3, 0.14, 0.045, m.timber, 0, -0.102, -0.0225));
      const posts = grp(...[-0.5, 0.5].map((x) => box(0.09, 1.14, 0.09, m.timber, x, 0.43, 0.045)));
      const bolts = grp(...[-0.5, 0.5].map((x) => rod([x, -0.08, -0.06], [x, -0.08, 0.14], 0.006, m.steel, 8)));
      const top = grp(rod([-0.5, 0.9775, 0.045], [0.5, 0.9775, 0.045], 0.0225, m.oak, 14));
      const bot = grp(rod([-0.5, 0.09, 0.045], [0.5, 0.09, 0.045], 0.02, m.timber, 10));
      const N = 8, g = (0.91 - N * 0.012) / (N + 1), xs = Array.from({ length: N }, (_, k) => -0.455 + g + 0.006 + k * (g + 0.012));
      const bal = grp(...xs.map((x) => rod([x, 0.11, 0.045], [x, 0.955, 0.045], 0.006, m.steel, 6)));
      const sph = new THREE_.Mesh(new THREE_.SphereGeometry(0.0625, 18, 14), m.sphere); sph.position.set((xs[3] + xs[4]) / 2, 0.55, 0.045);
      const hl = grp(box(0.012, 1.0, 0.012, m.okGhost, 0.62, 0.5, 0.045));
      return { parts: [
        { id: 'deck', name: 'Deck and joist', group: deck, explode: [0, -0.15, 0], anchor: [0.0, 0.0, -0.3], flag: 'T', spec: 'The landing floor and the joist the posts bolt to. Sizes are typical. The barrier height is measured from the floor of the landing.', desc: 'The structure the barrier is fixed to.' },
        { id: 'posts', name: 'Posts', group: posts, explode: [0, 0, 0.35], anchor: [0.5, 0.9, 0.095], flag: 'V', src: 'nccHp113', spec: 'Barriers are designed to AS/NZS 1170.1 loading, which was not opened. A face-mounted barrier has a gap of no more than 40 mm to the edge face.', desc: 'Bolted through the joist, not fixed to the deck boards alone.' },
        { id: 'bolts', name: 'Through bolts', group: bolts, explode: [0, -0.3, 0.2], anchor: [0.5, -0.08, 0.14], flag: 'T', spec: 'Bolt sizes, washers and spacing come from the designer. A post fixed only to deck boards can pull out under load.', desc: 'One bolt per post shown.' },
        { id: 'top', name: 'Top rail and handrail', group: top, explode: [0, 0.22, 0], anchor: [0.0, 1.03, 0.045], flag: 'V', src: 'nccHp113', spec: 'At least 1 m above the floor of landings, balconies, decks and corridors. A barrier top rail can serve as the handrail if it can be grasped. The 45 mm round rail is typical.', desc: 'The green line at the side marks 1 m.' },
        { id: 'bot', name: 'Bottom rail', group: bot, explode: [0, -0.2, 0.3], anchor: [0.3, 0.09, 0.07], flag: 'T', spec: 'The bottom rail sits 70 mm above the deck, so that the opening under it is well inside the 125 mm sphere limit.', desc: 'Carries the balusters at the bottom.' },
        { id: 'bal', name: 'Balusters', group: bal, explode: [0, 0, 0.2], anchor: [xs[1], 0.6, 0.052], flag: 'V', src: 'nccHp113', spec: 'No opening may let a 125 mm sphere pass. Eight 12 mm balusters leave about 90 mm clear between each.', desc: 'Vertical, so nothing can be used as a ladder.' },
        { id: 'sph', name: '125 mm sphere test', group: grp(sph), explode: [0, 0, 0.55], anchor: [(xs[3] + xs[4]) / 2, 0.64, 0.045], flag: 'V', src: 'nccHp113', spec: 'The gap between balusters is measured with a 125 mm sphere. On stairs the opening is measured above the nosing line.', desc: 'The blue ball is 125 mm across and does not fit.' },
        { id: 'hl', name: 'Height marker, 1 m', group: hl, explode: [0.25, 0, 0], anchor: [0.62, 0.5, 0.05], flag: 'V', src: 'nccHp113', spec: 'At least 1 m above the landing floor. On a flight the height is 865 mm above the nosings, and a transition zone is allowed where the two meet.', desc: 'The green bar is 1 m high.' },
      ] };
    },
  },

  kitchen: {
    title: 'Base and overhead cabinet', sub: 'One 600 mm base unit, benchtop, bead of sealant, splashback and an overhead cabinet hung from a rail screwed to a nogging. Sizes are common, not rules',
    floor: -0.03, gridSize: 2, camera: { pos: [2.0, 1.7, 3.3], target: [0, 1.15, 0.2] },
    build(kit) {
      const { box, cyl } = kit, m = MAT(kit);
      const wall = grp(box(1.0, 2.2, 0.013, m.board, 0, 1.1, -0.0065));
      const nog = grp(box(1.0, 0.09, 0.045, m.timber, 0, 2.0, -0.0355));
      const rail = grp(box(0.58, 0.04, 0.004, m.steel, 0, 2.0, 0.002), ...[-0.2, 0.2].map((x) => cyl(0.004, 0.03, m.dark, x, 2.0, 0.004, 8).rotateX(Math.PI / 2)));
      const plinth = grp(box(0.6, 0.15, 0.5, m.dark, 0, 0.075, 0.28));
      const carcass = grp(box(0.58, 0.7155, 0.58, m.carcass, 0, 0.15 + 0.35775, 0.29));
      const front = grp(box(0.594, 0.7, 0.018, m.front, 0, 0.5, 0.589), box(0.3, 0.012, 0.012, m.steel, 0, 0.8, 0.607));
      const top = grp(box(0.62, 0.035, 0.62, m.stone, 0, 0.8825, 0.31));
      const seal = grp(box(0.62, 0.012, 0.012, m.seal, 0, 0.906, 0.012));
      const splash = grp(box(0.62, 0.6, 0.012, m.glassb, 0, 1.2, 0.006));
      const over = grp(box(0.6, 0.7, 0.32, m.carcass, 0, 1.85, 0.164), box(0.594, 0.7, 0.018, m.front, 0, 1.85, 0.333));
      return { parts: [
        { id: 'wall', name: 'Wall sheet', group: wall, explode: [0, 0, -0.4], anchor: [-0.45, 1.5, -0.014], flag: 'T', spec: 'Lined in Step 12. The cabinets are fixed through the sheet into the framing behind it.', desc: 'Set and ready for the cabinets.' },
        { id: 'nog', name: 'Nogging', group: nog, explode: [0, 0, -0.65], anchor: [-0.4, 2.0, -0.059], flag: 'T', spec: 'Put in before lining, at the height of the overhead rail. Photograph its position, because the sheet hides it.', desc: 'Solid timber to screw the rail into.' },
        { id: 'rail', name: 'Hanging rail and screws', group: rail, explode: [0, 0.1, 0.25], anchor: [0.2, 2.03, 0.006], flag: 'V', src: 'waIb85', spec: 'Heavy fittings are fixed to the framing, not to the sheeting (Western Australian bulletin, 2017). Rail type, screw size and spacing come from the cabinet maker.', desc: 'The overhead cabinet hangs from this rail.' },
        { id: 'plinth', name: 'Plinth', group: plinth, explode: [0, -0.12, 0.0], anchor: [0.2, 0.075, 0.53], flag: 'T', spec: 'The model plinth is 150 mm high and set back about 70 mm so feet fit under the bench. Height and set-back are typical.', desc: 'Adjustable legs set the cabinets level.' },
        { id: 'carcass', name: 'Carcass', group: carcass, explode: [0, 0, 0.0], anchor: [-0.2, 0.55, 0.0], flag: 'T', spec: 'The base carcass is about 715 mm high. Cabinets are levelled on the legs and screwed to the wall framing and to each other.', desc: 'Levelled first, then everything else sits on it.' },
        { id: 'front', name: 'Door front', group: front, explode: [0, 0, 0.35], anchor: [0.2, 0.5, 0.607], flag: 'V', src: 'bpcTol26', spec: 'Cabinet doors and drawer fronts must be aligned with consistent gaps, checked within 6 months. The guide gives no numeric gap. The model uses a 3 mm gap.', desc: 'Fronts are adjusted on their hinges after the bench is on.' },
        { id: 'top', name: 'Benchtop', group: top, explode: [0, 0.15, 0.0], anchor: [0.25, 0.905, 0.3], flag: 'V', src: 'bpcTol26', spec: 'Joints are uniform, close-fitted and in the same plane within 6 months, and sealed or flush-filled. Porous cut edges are sealed. The model top is 35 mm thick, for a 900 mm bench.', desc: 'Set level on the cabinets.' },
        { id: 'seal', name: 'Sealant bead', group: seal, explode: [0, 0.25, 0.0], anchor: [0.0, 0.92, 0.012], flag: 'V', src: 'bpcTol26', spec: 'The bench-to-wall junction is sealed with a matching flexible sealant, and sink and basin seals must not leak within 6 months.', desc: 'A continuous bead where the bench meets the wall.' },
        { id: 'splash', name: 'Splashback', group: splash, explode: [0, 0.05, 0.25], anchor: [-0.25, 1.2, 0.013], flag: 'T', spec: 'The model uses a glass-look panel 600 mm high. Tiles, glass, stone or sheet are all used. The finish is the owner\'s choice.', desc: 'Protects the wall behind the bench.' },
        { id: 'over', name: 'Overhead cabinet', group: over, explode: [0, 0.15, 0.45], anchor: [-0.2, 1.85, 0.342], flag: 'T', spec: 'The bottom sits about 600 mm above the bench in the model. Heights are common, not rules, and the drawings govern.', desc: 'Hung from the rail and levelled.' },
      ] };
    },
  },

  wardrobe: {
    title: 'Wardrobe fixing to the wall frame', sub: 'Two studs and a nogging, one wall sheet, a cleat screwed through the sheet into the nogging, two gables, a shelf and a hanging rail',
    floor: 1.28, gridSize: 2, camera: { pos: [0.5, 2.7, 2.3], target: [0, 1.8, 0.2] },
    build(kit) {
      const { box, rod, cyl } = kit, m = MAT(kit);
      const frame = grp(...[-0.3, 0.3].map((x) => box(0.045, 1.0, 0.09, m.timber, x, 1.8, 0)), box(0.555, 0.09, 0.09, m.timber, 0, 2.0, 0));
      const sheet = grp(box(0.8, 1.0, 0.013, m.board, 0, 1.8, 0.0515));
      const cleat = grp(box(0.6, 0.06, 0.018, m.timber, 0, 2.0, 0.067), ...[-0.2, 0, 0.2].map((x) => cyl(0.004, 0.06, m.steel, x, 2.0, 0.07, 8).rotateX(Math.PI / 2)));
      const gables = grp(...[-0.35, 0.35].map((x) => box(0.016, 0.9, 0.6, m.carcass, x, 1.75, 0.358)));
      const shelf = grp(box(0.684, 0.016, 0.5, m.carcass, 0, 1.9, 0.308));
      const rail = grp(rod([-0.342, 1.72, 0.3], [0.342, 1.72, 0.3], 0.0125, m.steel, 10));
      return { parts: [
        { id: 'frame', name: 'Studs and nogging', group: frame, explode: [0, 0, -0.35], anchor: [-0.3, 2.3, 0.0], flag: 'T', spec: 'The nogging goes in before lining, in the same place as the cleat. Photograph it, because the sheet hides it.', desc: 'Solid timber to screw into.' },
        { id: 'sheet', name: 'Wall sheet', group: sheet, explode: [0, 0, -0.1], anchor: [-0.3, 2.2, 0.059], flag: 'T', spec: 'The sheet is not strong enough to hold a loaded wardrobe on its own.', desc: 'Only a face, not a fixing point.' },
        { id: 'cleat', name: 'Cleat and screws', group: cleat, explode: [0, 0, 0.25], anchor: [0.2, 2.04, 0.078], flag: 'V', src: 'waIb85', spec: 'Heavy fittings are fixed to the framing, not to the sheeting (Western Australian bulletin, 2017). Screws go through the cleat and the sheet into the nogging. Screw size and spacing are the joiner\'s.', desc: 'The carcass hangs from this and is screwed to it.' },
        { id: 'gables', name: 'Gables', group: gables, explode: [0, 0, 0.45], anchor: [0.35, 2.15, 0.358], flag: 'T', spec: 'The side panels of the carcass. Panel thickness and fixings come from the joiner\'s drawings.', desc: 'Carry the shelf and rail.' },
        { id: 'shelf', name: 'Shelf', group: shelf, explode: [0, 0.35, 0.45], anchor: [0.0, 1.91, 0.45], flag: 'T', spec: 'Shelf thickness and span set the load it carries. Long spans need a centre support or a thicker board (Typical).', desc: 'Rests on the pins in the gables.' },
        { id: 'rail', name: 'Hanging rail', group: rail, explode: [0, -0.35, 0.45], anchor: [0.2, 1.72, 0.3], flag: 'T', spec: 'The rail height is set from the plans. A rail loaded with clothes needs support at mid-span if it is long (Typical).', desc: 'Carried by sockets in the gables.' },
      ] };
    },
  },
};

export default {
  n: 13, id: 'fixout', title: 'Fix-out: joinery, stairs and balustrades', subtitle: 'Doors and trims, kitchen and wardrobe fixing, stairs, landings, balustrades and handrails, inspection and the fixing stage.',
  phases, build, details, drawings, howto, trades, materials, quotes, quoteTips, inspections, exam, sources, caution,
};

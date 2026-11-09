// Step 12: internal linings. The Step 11 house (insulated, ceiling batts shown from phase 2) gets ceiling sheets, wall sheets, wet-area boards, tape and set, cornice, and a full-size sample of a framed separating wall.
// Rules marked Verified come from the NCC pages, the CAV payments page and the manufacturer and bulletin documents named in Sources. AS/NZS 2589, 2588 and 2753 were not opened (paywalled), the ABCB 9.2 page is a fragment
// with no distances, and the 9.3, 9.4 and 10.7 pages show no edition or 2019 cross-references. Sheet sizes, positions and the wet-room extent in the model are illustrative.
// Sheets are drawn about 20 mm off the stud face so they clear the bracing straps and brick ties left in the Step 3 and Step 6 models.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import step11 from './step-11.js';
import { grp } from './step-06.js';
import { WALLS, wallInfo, wallMembers, worldAt, F } from './frame.js';
import { drawings, howto, trades, materials, quotes, quoteTips, inspections, exam, sources, caution } from './step-12-study.js';

const phases = [
  { title: 'Delivery and frame check', text: 'Boards, wet-area boards, compound and tape arrive and are stored flat and dry. The frame is checked plumb, straight and dry, and the services and insulation are signed off before anything covers them.' },
  { title: 'Ceiling sheets', text: 'The ceiling is lined first. Sheets are fixed across the framing, butt joints land between the framing and are back-blocked, and the wall sheets are fitted tight up under them. Ceiling batts go over the sheets afterwards.' },
  { title: 'Wall sheets and wet-area boards', text: 'Wall sheets run horizontally with staggered butt joints. The bathroom gets wet-area board, fixed with screws and no stud adhesive.' },
  { title: 'Fire and sound separation', text: 'A detached house has no separating wall, so a full-size sample shows how one is built: two rows of studs, an air gap, insulation, two layers of board and offset outlets.' },
  { title: 'Tape, set and finish', text: 'Joints are taped and filled in coats, internal corners and cornice are set, and the finish level decides how much work the surface gets before paint.' },
  { title: 'Inspection', text: 'Walk every wall and the ceiling in side light before the painter starts. Untaped joints, missing back-blocking, popped screws and bowed frames are fixed now.' },
  { title: 'Records and the fixing stage', text: 'The dockets, photos and surveyor\'s record are filed. The fixing stage payment is not due until the cladding, doors, trims and fittings are all fixed.' },
];

const MAT = (kit) => {
  const { mat, ghost } = kit;
  return {
    timber: mat(0xffffff, { tex: 'timber' }), steel: mat(0xb9c2cd, { metalness: 0.6, roughness: 0.35 }), batt: mat(0xf0a6b4, { roughness: 1 }), dark: mat(0x1b1d20, { roughness: 0.7 }),
    board: mat(0xe8e0cc, { roughness: 0.92, emissive: 0x5a5242 }), wetb: mat(0x8fbf8c, { roughness: 0.9, emissive: 0x2b4a2a }), ceilb: mat(0xece5d3, { roughness: 0.92, emissive: 0x625a48 }),
    setB: mat(0xf2f0ea, { roughness: 0.85, emissive: 0x6a675e }), setW: mat(0xb9d8b5, { roughness: 0.85, emissive: 0x3d583b }), setC: mat(0xf6f4ef, { roughness: 0.85, emissive: 0x6e6b62 }),
    tape: mat(0xfaf8f2, { roughness: 0.8 }), card: mat(0xc8ad82, { roughness: 0.9 }), white: mat(0xf4f4f2, { roughness: 0.5 }), grey: mat(0x8f99a3, { roughness: 0.6 }),
    brass: mat(0xc9a24d, { metalness: 0.7, roughness: 0.4 }), sheet2: mat(0xd8cfb6, { roughness: 0.92, emissive: 0x4e4736 }), red: mat(0xd62828, { roughness: 0.6 }), blue: mat(0x2b8fd6, { roughness: 0.5 }),
    redGhost: ghost(0xd62828, 0.5), air: ghost(0x7fd0ff, 0.45), mortar: mat(0xd9d4c4, { roughness: 1 }),
  };
};

// A framed separating wall in its own coordinates: u along the wall, y up, z through it. Leaf A is on -z, leaf B on +z, 20 mm of air between the studs.
// One bay of insulation sits in leaf A only, because the pages read do not say where it goes. Two layers of board on each outer face, second layer offset so the joints do not line up.
function sepParts(kit, W, Hh, cut = false) {
  const { box, rod } = kit, m = MAT(kit), st = 0.035, dp = 0.09, gap = 0.02, bt = 0.013, hw = W / 2;
  const xs = []; for (let u = -hw + st / 2; u < hw - st / 2 + 0.001; u += 0.6) xs.push(u); xs.push(hw - st / 2);
  const zA = -(gap / 2 + dp / 2), zB = gap / 2 + dp / 2, zA1 = -(gap / 2 + dp + bt / 2), zA2 = zA1 - bt - 0.003, zB1 = gap / 2 + dp + bt / 2, zB2 = zB1 + bt + 0.003;
  const frame = (z) => grp(...xs.map((x) => box(st, Hh - 0.09, dp, m.timber, x, Hh / 2, z)), box(W, 0.045, dp, m.timber, 0, 0.0225, z), box(W, 0.045, dp, m.timber, 0, Hh - 0.0225, z));
  const studsA = frame(zA), studsB = frame(zB);
  const batt = grp(box(xs[1] - xs[0] - st, Hh - 0.1, dp - 0.012, m.batt, (xs[0] + xs[1]) / 2, Hh / 2, zA));
  const j1 = -hw + W * 0.4, j2 = -hw + W * 0.7;
  const layer = (z, joint, mt) => grp(box(joint - -hw - 0.003, Hh, bt, mt, (-hw + joint) / 2, Hh / 2, z), box(hw - joint - 0.003, Hh, bt, mt, (joint + hw) / 2 + 0.003, Hh / 2, z));
  const part = (z, u1, u2, mt) => grp(box(u2 - u1, Hh, bt, mt, (u1 + u2) / 2, Hh / 2, z));
  const a1 = layer(zA1, j1, m.board), a2 = layer(zA2, j2, m.sheet2);
  const b1 = cut ? part(zB1, -hw, -hw + W * 0.62, m.board) : layer(zB1, j1, m.board), b2 = cut ? part(zB2, -hw, -hw + W * 0.34, m.sheet2) : layer(zB2, j2, m.sheet2);
  const airG = grp(box(W, Hh - 0.1, gap, m.air, 0, Hh / 2, 0));
  // outlets on opposite faces, 300 mm apart along the wall, set in the outer layers
  const ox = -hw * (cut ? 0.6 : 0.3), outlets = grp(box(0.075, 0.075, 0.03, m.white, ox - 0.15, 1.1, zA2 - 0.006), box(0.075, 0.075, 0.03, m.white, ox + 0.15, 1.1, zB2 + 0.006), box(0.16, 0.16, 0.02, m.redGhost, ox - 0.15, 1.1, zA1 + 0.0));
  const pipe = grp(rod([-hw * 0.5, 0.2, zA + 0.03], [-hw * 0.5, Hh - 0.2, zA + 0.03], 0.011, m.blue, 8));
  return { studsA, studsB, batt, a1, a2, b1, b2, airG, outlets, pipe, z: { zA, zB, zA1, zA2, zB1, zB2 } };
}

/* ---------- walk scene ---------- */
function build(kit) {
  const { box, cyl, rod, textPlane } = kit;
  const mk = (n) => { const g = new THREE.Group(); g.name = n; return g; };
  const s11 = step11.build(kit), m = MAT(kit), { T, H, HEAD } = F, CEIL = H + F.SLAB, LT = 0.013, ZC = 0.0665 + LT / 2;
  const KEEP = ['wrap', 'fans', 'wallb', 'fixw', 'seal', 'ceilb', 'fixc', 'covers', 'vents'], LATE = ['ceilb', 'fixc', 'covers'];
  const layers = s11.layers.filter((l) => (l.from === undefined && l.until === undefined) || KEEP.includes(l.group.name)).map(({ group }) => (LATE.includes(group.name) ? { group, from: 2 } : { group }));
  const sign = (lines, w, h, x, y, z, ry = 0) => { const s = textPlane(lines, w, h); s.position.set(x, y, z); s.rotation.y = ry; return s; };

  // the walls that get lined: externals on the inside face, internals and the two bathroom partitions on both faces
  const PART = [{ id: 'p1', ext: false, a: [-5.26, 1.2], b: [-2.0, 1.2], open: [] }, { id: 'p2', ext: false, a: [-2.0, 1.245], b: [-2.0, 5.455], open: [{ at: 3.6, w: 0.82, sill: 0 }] }];
  const faces = [];
  for (const raw of WALLS) { const w = wallInfo(raw); faces.push({ w, zs: raw.ext ? [ZC] : [ZC, -ZC] }); }
  for (const raw of PART) faces.push({ w: wallInfo(raw), zs: [ZC, -ZC] });
  const west = faces.find((f) => f.w.id === 'west').w, uOf = (w, x, z) => (x - w.a[0]) * w.dir[0] + (z - w.a[1]) * w.dir[1];
  const cutsFor = (w) => (w.id === 'west' ? [uOf(w, west.a[0], 1.2), uOf(w, west.a[0], 5.5)].sort((p, q) => p - q) : []);
  const bays = (w, y1, y2) => {
    const zs = wallMembers(w.len, w.open).zones.slice().sort((p, q) => p.l - q.l), out = []; let at = 0;
    for (const z of zs) { if (z.l > at + 0.01) out.push([at, z.l, y1, y2]); if (z.o.sill > y1 + 0.01) out.push([z.l, z.r, y1, z.o.sill]); if (y2 > HEAD + 0.01) out.push([z.l, z.r, HEAD, y2]); at = z.r; }
    if (w.len > at + 0.01) out.push([at, w.len, y1, y2]);
    return out;
  };
  const add = (geos, w, u1, u2, y1, y2, depth, zc) => {
    const p = worldAt(w, (u1 + u2) / 2, (y1 + y2) / 2, zc), g = new THREE.BoxGeometry(u2 - u1, y2 - y1, depth); g.rotateY(w.theta); g.translate(p[0], p[1], p[2]); geos.push(g);
  };
  const inWet = (x, z) => x > -5.3 && x < -2.0 && z > 1.2 && z < 5.5;
  const mesh = (geos, mt) => { if (!geos.length) return new THREE.Group(); const me = new THREE.Mesh(mergeGeometries(geos, false), mt); me.castShadow = false; return me; };

  // wall sheets: two horizontal rows of 1.35 m, 2.4 m pieces, the second row shifted 1.2 m so the butt joints stagger; wet-area board inside the bathroom
  const dryG = [], wetG = [], tapeG = [], corG = [], defTape = [], YT = H - LT, RH = 1.35, EPS = 0.003, SEAM = 0.075;
  const east = faces.find((f) => f.w.id === 'east').w, u0 = uOf(east, 5.25, 6.5);
  for (const { w, zs } of faces) {
    const cuts = cutsFor(w);
    for (const zc of zs) {
      for (const [bu1, bu2, by1, by2] of bays(w, 0.005, YT)) {
        const ys = [by1]; for (let y = RH; y < by2 - 0.01; y += RH) if (y > by1 + 0.01) ys.push(y); ys.push(by2);
        for (let r = 0; r < ys.length - 1; r++) {
          const y1 = ys[r], y2 = ys[r + 1], us = [bu1]; let k = r % 2 ? 1.2 : 2.4;
          for (let u = bu1 + k; u < bu2 - 0.05; u += 2.4) us.push(u);
          for (const c of cuts) if (c > bu1 + 0.02 && c < bu2 - 0.02) us.push(c);
          us.push(bu2); us.sort((p, q) => p - q);
          for (let i = 0; i < us.length - 1; i++) {
            const a = us[i], b = us[i + 1]; if (b - a < 0.02) continue;
            const mid = worldAt(w, (a + b) / 2, (y1 + y2) / 2, zc), wet = inWet(mid[0], mid[2]);
            add(wet ? wetG : dryG, w, a + EPS, b - EPS, y1 + EPS, y2 - EPS, LT, zc);
            if (i > 0 && Math.abs(a - us[i]) < 1e-9 && a > bu1 + 0.02 && !cuts.includes(a)) add(tapeG, w, a - SEAM / 2, a + SEAM / 2, y1 + 0.05, y2 - 0.05, 0.002, zc + Math.sign(zc) * (LT / 2 + 0.001));
          }
          if (r > 0) {
            const zt = zc + Math.sign(zc) * (LT / 2 + 0.001);
            if (w === east && zc > 0 && bu1 < u0 && bu2 > u0) { add(tapeG, w, bu1, u0 - 0.5, y1 - SEAM / 2, y1 + SEAM / 2, 0.002, zt); add(tapeG, w, u0 + 0.5, bu2, y1 - SEAM / 2, y1 + SEAM / 2, 0.002, zt); add(defTape, w, u0 - 0.5, u0 + 0.5, y1 - SEAM / 2, y1 + SEAM / 2, 0.003, zt); }
            else add(tapeG, w, bu1, bu2, y1 - SEAM / 2, y1 + SEAM / 2, 0.002, zt);
          }
        }
      }
      // cornice: a square section set into the wall and ceiling junction
      const cg = new THREE.BoxGeometry(w.len, 0.06, 0.06), p = worldAt(w, w.len / 2, YT - 0.03, zc + Math.sign(zc) * (LT / 2 + 0.03)); cg.rotateY(w.theta); cg.translate(p[0], p[1], p[2]); corG.push(cg);
    }
  }
  const wallsPre = mk('wallsPre'), wallsSet = mk('wallsSet');
  wallsPre.add(mesh(dryG, m.board), mesh(wetG, m.wetb));
  wallsSet.add(mesh(dryG, m.setB), mesh(wetG, m.setW));
  const wallTape = mk('wallTape'); wallTape.add(mesh(tapeG, m.tape), mesh(corG, m.setC));

  // ceiling sheets: 1.2 m wide, 3.6 m long across the width, alternate columns shifted 1.8 m; underside at the plate top, tape on every joint
  const cG = [], cT = [], butts = [], X1 = 5.26, Z0 = -5.26, Z1 = 11.26;
  for (let k = 0, x = -X1; x < X1 - 0.01; k++, x += 1.2) {
    const xr = Math.min(x + 1.2, X1), zb = [Z0]; for (let z = Z0 + (k % 2 ? 1.8 : 3.6); z < Z1 - 0.1; z += 3.6) zb.push(z); zb.push(Z1);
    for (let i = 0; i < zb.length - 1; i++) {
      const g = new THREE.BoxGeometry(xr - x - 0.006, LT, zb[i + 1] - zb[i] - 0.006); g.translate((x + xr) / 2, CEIL - LT / 2, (zb[i] + zb[i + 1]) / 2); cG.push(g);
      if (i > 0) { const t = new THREE.BoxGeometry(xr - x, 0.002, SEAM); t.translate((x + xr) / 2, CEIL - LT - 0.001, zb[i]); cT.push(t); butts.push([(x + xr) / 2, zb[i]]); }
    }
    if (x > -X1 + 0.01) { const t = new THREE.BoxGeometry(SEAM, 0.002, Z1 - Z0); t.translate(x, CEIL - LT - 0.001, (Z0 + Z1) / 2); cT.push(t); }
  }
  const ceilPre = mk('ceilPre'), ceilSet = mk('ceilSet'), ceilTape = mk('ceilTape');
  ceilPre.add(mesh(cG, m.ceilb)); ceilSet.add(mesh(cG, m.setC)); ceilTape.add(mesh(cT, m.tape));

  // delivery: two stacks of sheets, bags of compound and rolls of tape on a pallet in the east margin
  const stock = mk('stock'), sx = 6.5, sz = 4.0;
  stock.add(box(1.3, 0.12, 2.6, m.timber, sx, 0.06, sz), box(1.25, 0.3, 2.4, m.board, sx, 0.27, sz - 0.0), box(1.25, 0.18, 2.4, m.wetb, sx, 0.51, sz));
  for (let i = 0; i < 3; i++) stock.add(box(0.3, 0.4, 0.18, m.white, sx - 0.4 + i * 0.4, 0.2, sz - 1.8), box(0.3, 0.4, 0.18, m.white, sx - 0.4 + i * 0.4, 0.62, sz - 1.8));
  for (let i = 0; i < 4; i++) { const t = cyl(0.05, 0.05, m.tape, sx - 0.45 + i * 0.3, 0.07, sz - 1.45, 14); stock.add(t); }
  stock.add(sign(['PLASTERBOARD STOCK', 'Flat, dry, off the ground', 'Check the board type against the order'], 1.6, 0.6, sx, 0.62, sz + 1.6, 0), cyl(0.025, 0.62, m.steel, sx - 0.82, 0.31, sz + 1.6, 8), cyl(0.025, 0.62, m.steel, sx + 0.82, 0.31, sz + 1.6, 8));

  // frame check: a 1.8 m straight edge held on the west wall studs
  const frame = mk('frame');
  frame.add(rod([-5.2, 1.62, 5.7], [-5.2, 1.62, 7.5], 0.016, m.steel, 8), box(0.03, 0.12, 0.06, m.red, -5.2, 1.62, 5.7), box(0.03, 0.12, 0.06, m.red, -5.2, 1.62, 7.5), sign(['FRAME CHECK', 'Straight edge on the studs', 'Plumb, straight, dry'], 1.5, 0.5, -4.6, 1.2, 6.6, Math.PI / 2));

  // sample of a framed separating wall in front of the house, with the two leaves, the air gap and offset outlets
  const sp = sepParts(kit, 1.8, 2.4, true), sample = mk('sample');
  sample.add(sp.studsA, sp.studsB, sp.batt, sp.a1, sp.a2, sp.b1, sp.b2, sp.outlets, sp.pipe);
  sample.add(sign(['SAMPLE: SEPARATING WALL', 'Two leaves, air gap, two layers', 'Illustrative: a detached', 'house has none'], 1.3, 0.8, 1.55, 1.55, 0.3, 0), cyl(0.025, 1.95, m.steel, 0.98, 0.975, 0.3, 8), cyl(0.025, 1.95, m.steel, 2.12, 0.975, 0.3, 8));
  sample.position.set(4.0, 0, 13.4);

  // fixing-stage sign near the front door
  const stage = mk('stage');
  stage.add(sign(['FIXING STAGE', 'Linings, doors, trims, fittings fixed', 'Then the payment is due'], 1.5, 0.65, 1.5, 1.45, 12.4, 0), cyl(0.025, 1.45, m.steel, 0.7, 0.72, 12.4, 8), cyl(0.025, 1.45, m.steel, 2.3, 0.72, 12.4, 8));

  // defects to find at inspection: a joint with no tape, and a ceiling butt joint with no back-blocking
  const defects = mk('defects'), bb = butts.reduce((a, b) => (Math.hypot(a[0] - 1.3, a[1] - 8.4) < Math.hypot(b[0] - 1.3, b[1] - 8.4) ? a : b));
  defects.add(mesh(defTape, m.redGhost), sign(['JOINT NOT TAPED'], 0.9, 0.2, 5.0, 0.75, 6.5, -Math.PI / 2), box(1.1, 0.03, 0.22, m.redGhost, bb[0], CEIL - LT - 0.02, bb[1]), sign(['NO BACK-BLOCKING'], 0.95, 0.2, bb[0], 2.45, bb[1] + 0.35, 0));

  layers.push({ group: stock, until: 5 }, { group: frame, until: 2 }, { group: ceilPre, from: 1, until: 4 }, { group: ceilSet, from: 4 }, { group: ceilTape, from: 4 }, { group: wallsPre, from: 2, until: 4 }, { group: wallsSet, from: 4 },
    { group: wallTape, from: 4 }, { group: sample, from: 3 }, { group: defects, from: 5, until: 6 }, { group: stage, from: 6 });
  return { layers, colliders: s11.colliders, tickers: s11.tickers, spawn: { pos: [4, 18.5], yaw: 0, pitch: 0.2 }, map: s11.map, orbit: { pos: [9.5, 9, 17], target: [0, 1.0, 5] }, hotspots: HOTSPOTS };
}

/* ---------- hotspots ---------- */
const HOTSPOTS = [
  { id: 'stock', title: 'Plasterboard delivered and kept flat and dry', pos: [6.5, 0.55, 4.0], stand: [6.5, 7.6], from: 0, until: 5, drawing: 'order',
    summary: 'Sheets, wet-area boards, joint compound and tape arrive on site. They are stored flat, dry and off the ground, and checked against the order before they go up.',
    learn: [['Store sheets flat, dry and off the ground, with supports at no more than 600 mm centres.', 'V', 'knaufManual'], ['Order the board type for each area from the plans and the surveyor\'s approved documents: standard board for most rooms, wet-area board for wet rooms, and the fire-rated or sound-rated system the designer specifies.', 'T'], ['Knauf describes its Firestop board as having a fire-resistant core, in 13 and 16 mm, with a data sheet dated July 2022. Fire resistance depends on the whole system, not the board alone.', 'V', 'knaufFirestop'], ['The NCC separating wall text asks for "fire-protective grade" plasterboard, but the page read does not define the term. Ask the designer which product they mean before ordering.', 'C', 'nccHp107'], ['AS/NZS 2588 (the plasterboard product standard) and AS/NZS 2589 (application and finishing) are paywalled and were not opened.', 'C']] },
  { id: 'frame', title: 'Check the frame before the sheets go on', pos: [-5.2, 1.85, 6.6], stand: [-2.8, 6.6], from: 0, until: 2, drawing: 'fix',
    summary: 'Plasterboard copies whatever the frame does. A bowed stud, a high nogging or a wet frame shows through the finished wall, so the frame is checked plumb, straight and dry first.',
    learn: [['Framing must be plumb, level, square and dry before lining.', 'V', 'knaufManual'], ['The BPC guide treats a finished internal wall as outside tolerance if it bows more than 5 mm from a 1.8 m straight edge (clause 12.1.1). A crooked frame is the usual cause, so check the frame against the same straight edge.', 'V', 'bpcTol26'], ['A Western Australian bulletin from 2017 uses a tighter framing figure: 4 mm over a 1.8 m straight edge for 90 per cent of the area at Level 4. It is not Victorian guidance.', 'C', 'waIb85'], ['Heavy fittings are fixed to the framing, not to the sheeting.', 'V', 'waIb85'], ['Add noggings or blocking where shelves, cabinets, rails and handrails will go before the sheets cover the frame (Typical).', 'T'], ['Services and insulation are inspected and signed off before lining (Steps 8 to 11). Once the sheets are on, that work is hidden.', 'T'], ['Timber shrinks as it dries. Lining a wet frame can show popped screws and cracked joints later.', 'T']] },
  { id: 'ceiling', title: 'Ceiling sheets go up first', pos: [0.5, 2.55, 8.4], stand: [0.5, 6.6], from: 1, detail: 'ceilingfix', drawing: 'fix',
    summary: 'The ceiling is lined before the walls. Sheets are screwed to the bottom chords, butt joints land between the framing and are back-blocked, and the wall sheets are fitted tight up under the ceiling afterwards.',
    learn: [['With screws only, fix ceiling sheets at 300 mm across the width. At the perimeter, fix at 300 mm for cornices and 150 mm for square set.', 'V', 'knaufManual'], ['Butt joints fall between the framing and are back-blocked. Knauf recommends back-blocking all ceiling joints.', 'V', 'knaufManual'], ['A WA bulletin on ceiling collapses blamed poor adhesive application and not following AS/NZS 2589. It gives adhesive daubs of 25 mm diameter and 15 mm high, at least 200 mm from fasteners and edges and at no more than 230 mm centres.', 'C', 'waIb85'], ['The same bulletin gives a manufacturers\' limit of about 2 kg per square metre of insulation on 10 mm board at 600 mm joist centres in wind classes N1 and N2. Heavy batts may need thicker board or closer framing.', 'C', 'waIb85'], ['Do not rely on adhesive alone to hold a ceiling up (Typical).', 'T'], ['Ceiling batts from Step 11 are laid over the sheets afterwards. The model draws them from this phase on so the layers read in order.', 'T']] },
  { id: 'walls', title: 'Wall sheets: horizontal rows and staggered joints', pos: [5.2, 1.3, 4.5], stand: [2.9, 4.5], from: 2, detail: 'wallfix', drawing: 'fix',
    summary: 'Sheets run horizontally, with the butt joints staggered and kept clear of the corners of openings. Fixing starts at the middle of each sheet and works outwards.',
    learn: [['Fix sheets horizontally for a Level 4 or 5 finish. Stagger the butt joints and keep vertical joints at least 200 mm from the edges of openings.', 'V', 'knaufManual'], ['Fasteners go 10 to 16 mm from sheet edges and are fixed from the centre outwards. Screws are at 300 mm maximum at sheet ends, and at 200 mm where a butt joint falls on framing.', 'V', 'knaufManual'], ['Adhesive daubs are at no more than 300 mm along the studs and are kept 200 mm from sheet edges and screw points. Temporary fasteners stay in at every second stud for at least 24 hours.', 'V', 'knaufManual'], ['Timber needs a fixing face of at least 35 mm at a supported sheet joint and 30 mm elsewhere. Framing centres are 600 or 450 mm.', 'V', 'knaufManual'], ['The ceiling goes first, so the wall sheets stop at the underside of the ceiling sheets and the cornice covers the junction.', 'T'], ['The model uses two rows of 1.35 m sheets on a 2.7 m wall. Sheet sizes and lengths come from the supplier (Typical).', 'T']] },
  { id: 'wet', title: 'Wet areas: board type and fixing', pos: [-5.2, 1.2, 4.6], stand: [-3.4, 4.6], from: 2, drawing: 'order',
    summary: 'Bathrooms, laundries and toilets use a board made for damp areas. The sheet is only the base: the waterproofing is a separate system, and its order with the sheets needs confirming.',
    learn: [['For wet areas the manual says to fix with screws or nails only, with no stud adhesive, and to treat the joints with base compound and paper tape.', 'V', 'knaufManual'], ['The same manual lists plasterboard as not suitable where relative humidity is above 90 per cent.', 'V', 'knaufManual'], ['The waterproofing system is covered in Step 10 and by AS 3740, which was not opened. The sheet does not waterproof the room.', 'T'], ['Order: the plan shows waterproofing in Step 10, before this step, but on site the sheet is normally fixed first and the membrane goes on the sheet. Confirm the order with the waterproofer and the membrane maker.', 'C'], ['Wet-area boards are often green, but the colour is not a standard. Read the product name, not the colour.', 'T'], ['The model greens the walls of the bathroom only. Which walls and whether the ceiling get wet-area board depends on the design (Typical).', 'T']] },
  { id: 'fire', title: 'Fire separation: boundary walls and separating walls', pos: [4.0, 2.0, 13.4], stand: [4.0, 16.9], from: 3, detail: 'sepwall', drawing: 'sep',
    summary: 'A detached house on its own block has no separating wall. Where two dwellings share a wall, or a wall sits close to a boundary, the NCC asks for fire resistance. The sample in front of the house shows the layers of a framed separating wall.',
    learn: [['Separating walls between Class 1 buildings, and between a Class 1 and a non-associated Class 10a, need an FRL of at least 60/60/60, or masonry at least 90 mm thick. The page shows no edition.', 'V', 'nccHp93'], ['The wall starts at the footings or ground slab and goes up to the underside of a non-combustible roof covering, or at least 450 mm above a combustible one.', 'V', 'nccHp93'], ['Lightweight walls are tested to Specification 6. No timber or combustible element crosses the wall, except roof battens of 75 by 50 mm or smaller, or sarking. Any gap above the wall is packed with mineral fibre.', 'V', 'nccHp93'], ['Horizontal projections within 1.8 m of the wall need a floor, ceiling or soffit system with 60 minutes\' resistance to incipient spread of fire, or FRL 30/30/30 from below, or a fire-protective underside covering. Shared eaves and verandahs are separated by a non-combustible vertical lining.', 'V', 'nccHp93'], ['A wall between a dwelling and a non-associated garage needs FRL 60/60/60 tested from the garage side, or masonry at least 90 mm, from the footings or slab to the underside of the separating floor. The page carries 2019 cross-references.', 'V', 'nccHp94'], ['An external wall near a boundary may need to be fire-resisting: FRL of at least 60/60/60 tested from outside, or masonry veneer with an external veneer of at least 90 mm, or masonry of at least 90 mm, taken up to a non-combustible roof covering or eaves lining. The distances at which this applies were not on the ABCB page read, so take them from the plans and the surveyor.', 'C', 'hiaExtWall'], ['VBA warns that garage boundary brick walls are often built too low, and that Colorbond flashing is not a fire-rated material and does not provide fire separation by itself. Talk to the building surveyor before any work outside the Deemed-to-Satisfy provisions. The VBA item is undated.', 'V', 'vbaSepWalls']] },
  { id: 'sound', title: 'Sound, and services through a separating wall', pos: [4.0, 0.65, 13.4], stand: [4.0, 15.6], from: 3, detail: 'sepwall', drawing: 'sep',
    summary: 'A shared wall has to stop noise as well as fire. Two separate rows of studs, an air gap, insulation and two layers of board give the rating, and every outlet, cable or pipe can undo it.',
    learn: [['Airborne sound: separating walls between Class 1 buildings must achieve Rw + Ctr of at least 50 for the listed constructions. The tables are labelled 2019 and the edition is not stated.', 'V', 'nccHp107'], ['Sound-insulated walls continue up to the underside of the roof, or of a ceiling that gives the required insulation.', 'V', 'nccHp107'], ['Part 10.7.8 describes a framed wall as two rows of 90 by 35 timber studs (or 64 mm steel) at 600 mm centres, an air gap of at least 20 mm, insulation, and two layers of 13 mm fire-protective grade plasterboard, or 6 mm fibre cement plus 13 mm.', 'V', 'nccHp107'], ['The model draws two layers on each outer face and puts insulation in one leaf. Where the layers and insulation go should be checked against the clause and its table.', 'C', 'nccHp107'], ['Second-layer joints must not line up with first-layer joints, and every joint is taped and filled solid. Steel framing is at least 0.6 mm thick. Noggings must not bridge studs that support different wall leaves. Perimeter members are fixed and caulked.', 'V', 'nccHp107'], ['Outlets on opposite sides are offset by at least 100 mm in masonry and at least 300 mm in framed walls. A water pipe serving one dwelling is not fixed to the other dwelling\'s leaf and keeps at least 10 mm clearance.', 'V', 'nccHp107'], ['For fire, service openings generally need FRL of -/60/60. A cable needs a tested prototype, or alternative limits: 50 mm from other services, a single cable of up to 2000 mm² with a gap up to 15 mm (otherwise 500 mm²), and gaps packed. Switches and outlets follow a tested prototype, or avoid lining up with openings opposite (300 mm horizontally or 600 mm vertically), or do not go beyond half the wall thickness.', 'V', 'nccHp93'], ['The 10.7 page gives no impact sound rating, so none is shown here.', 'C', 'nccHp107']] },
  { id: 'finish', title: 'Tape, set and finish levels', pos: [-5.2, 1.35, 6.6], stand: [-2.8, 6.6], from: 4, detail: 'joint', drawing: 'finish',
    summary: 'Joints are taped and filled in coats, and the finish level decides how much work the surface gets before paint. Level 4 is the usual default, and the one to price unless the plans say otherwise.',
    learn: [['The finish levels follow AS/NZS 2589: Level 3 is tape plus one coat, Level 4 is tape plus two coats (Knauf\'s default), and Level 5 adds a finishing coat and a skim over the whole face. The standard itself was not opened.', 'V', 'knaufManual'], ['Control joints go at 12 m centres each way in walls and ceilings, at 6 m on external ceilings, at 3.0 to 4.5 m in tiled walls, and at every change of lining material.', 'V', 'knaufManual'], ['Level 5 is worth pricing where strong side light or a gloss paint will show every joint (Typical).', 'T'], ['Cornice goes on after the ceiling and wall sheets are fixed, and is set into the joint (Typical).', 'T'], ['Each coat must dry before the next. Drying time depends on the compound and the weather (Typical).', 'T'], ['The BPC guide says plasterboard not finished to Level 4 under AS/NZS 2589 is outside tolerance (12.2.3), so Level 4 is the minimum to price. Some imperfections can remain visible at Level 4.', 'V', 'bpcTol26'], ['Plaster cornices and plasterboard ceilings are outside tolerance if they deviate more than 4 mm from a 2 m straight edge (12.2.7 and 12.2.10).', 'V', 'bpcTol26'], ['The paint-maker finish-level page was not read, so the painter\'s own tolerances are not given here.', 'C']] },
  { id: 'check', title: 'Inspect in side light before paint', pos: [5.2, 1.3, 6.5], stand: [2.9, 6.6], from: 5, until: 6, drawing: 'finish',
    summary: 'Defects are found now and fixed before painting. A joint with no tape, a ceiling butt joint with no back-blocking, a screw head through the paper and a bowed frame all show later.',
    learn: [['The prescribed inspection stages are in regulations 167 to 169 and 172 of the Building Regulations, and a surveyor can require an additional inspection under section 35 of the Building Act.', 'V', 'bpcMI01'], ['Internal linings are not a named stage. Ask the surveyor whether they want to see the concealed fire and sound details before the second layer goes on.', 'T'], ['The BPC guide gives these limits: cracks present at completion or over 1 mm wide within 24 months, screw heads or nail popping showing at completion or within 24 months, and plaster peaking or jointing visible from a normal viewing position. A normal viewing position is 1.5 m or more away in diffused, non-critical light.', 'V', 'bpcTol26'], ['Walk each wall and the ceiling with a light held along the surface. Look for untaped or cracked joints, screws through the paper, sheet ends with no framing, gaps at the ceiling, and sheets that are not tight to the frame. A lamp along the surface shows more than the guide treats as a defect, so use it to find and fix, not to judge compliance.', 'T'], ['Photograph the packing, caulked edges and fire collars of any separating wall before they are covered.', 'T'], ['Mark the fixes with tape and keep a defect list. The painter should not start on a surface that is still being repaired.', 'T']] },
  { id: 'stage', title: 'The fixing stage and the payment', pos: [1.5, 2.05, 12.4], stand: [1.5, 15.4], from: 6, drawing: 'order',
    summary: 'In a major domestic building contract the fixing stage is reached when the internal cladding, doors, trims and fittings are all fixed. Lining alone does not reach it.',
    learn: [['The fixing stage means all internal cladding, architraves, skirting, doors and built-in shelves are fitted and fixed in position, plus baths, basins, troughs, sinks, cabinets and cupboards.', 'V', 'cavPay'], ['For a contract covering all stages the CAV page shows base 10 per cent, frame 15 per cent, lock-up 35 per cent and fixing 25 per cent, 85 per cent in total. A contract to build to fixing uses base 12 per cent, frame 18 per cent and lock-up 40 per cent. The page was last updated on 9 July 2025.', 'V', 'cavPay'], ['The Domestic Building Contracts Amendment Bill 2025 passed on 11 September 2025. Payment limits may change when the new laws start, so check the current CAV page before pricing a contract.', 'C', 'cavAmend'], ['File the delivery dockets, product data sheets, photos of concealed details, the surveyor\'s record and the plasterer\'s invoice with the permit documents (Typical).', 'T'], ['After linings come the cornice finish, painting, doors, trims and fittings in later steps.', 'T']] },
];

/* ---------- zoom rooms ---------- */
const details = {
  ceilingfix: {
    title: 'Ceiling sheet fixing', sub: 'Bottom chords, two sheets with a butt joint, a back-block, screws and the wall junction. Thicknesses are typical',
    floor: -0.75, gridSize: 3, camera: { pos: [1.9, -0.45, 1.7], target: [0, 0.05, 0] },
    build(kit) {
      const { box, cyl } = kit, m = MAT(kit);
      const chords = grp(...[-0.6, 0, 0.6].map((x) => box(0.045, 0.09, 1.3, m.timber, x, 0.0515, 0)));
      const sheets = grp(box(0.347, 0.013, 1.3, m.ceilb, -0.4765, 0, 0), box(0.947, 0.013, 1.3, m.ceilb, 0.1765, 0, 0));
      const back = grp(box(0.5, 0.013, 0.2, m.sheet2, -0.3, 0.0195, 0), box(0.5, 0.013, 0.2, m.sheet2, -0.3, 0.0195, 0.5));
      const screws = grp(); for (const x of [-0.6, 0, 0.6]) for (let z = -0.6; z <= 0.61; z += 0.3) screws.add(cyl(0.006, 0.004, m.dark, x, -0.0085, z, 8));
      const wall = grp(box(1.3, 0.045, 0.09, m.timber, 0, 0.0155, -0.735), box(1.3, 0.55, 0.013, m.board, 0, -0.2905, -0.6385), box(1.3, 0.06, 0.06, m.setC, 0, -0.0365, -0.6585));
      return { parts: [
        { id: 'chords', name: 'Truss bottom chords', group: chords, explode: [0, 0.4, 0], anchor: [0.6, 0.1, 0.6], flag: 'T', spec: 'Bottom chords of the trusses from Step 4, shown at 600 mm centres. The engineer\'s truss layout sets the real spacing.', desc: 'The sheets hang from the underside of the chords.' },
        { id: 'back', name: 'Back-block', group: back, explode: [0, 0.2, 0], anchor: [-0.3, 0.03, 0.12], flag: 'V', src: 'knaufManual', spec: 'Butt joints fall between the framing and are back-blocked. Knauf recommends back-blocking all ceiling joints.', desc: 'A strip of board bridges the joint from above, so the joint does not crack.' },
        { id: 'sheets', name: 'Ceiling sheets', group: sheets, explode: [0, -0.3, 0], anchor: [0.55, -0.01, -0.55], flag: 'V', src: 'knaufManual', spec: 'Perimeter fixing at 300 mm for cornices and 150 mm for square set. Butt joints are staggered and fall between framing.', desc: 'Two sheets meet at a butt joint that falls between two chords.' },
        { id: 'screws', name: 'Screws', group: screws, explode: [0, -0.5, 0], anchor: [0, -0.012, 0.3], flag: 'V', src: 'knaufManual', spec: 'With screws only, fix at 300 mm across the width of the sheet.', desc: 'Each screw sits just below the paper face and is filled when the joints are set.' },
        { id: 'wall', name: 'Wall top, sheet and cornice', group: wall, explode: [0, -0.15, -0.35], anchor: [0.6, -0.04, -0.66], flag: 'T', spec: 'The wall sheet stops at the underside of the ceiling sheet. The cornice covers the junction. Positions are simplified in the model.', desc: 'Ceiling first, then the walls fitted up under it.' },
      ] };
    },
  },

  wallfix: {
    title: 'Wall sheet fixing', sub: 'Studs, adhesive daubs, two horizontal rows of sheet with staggered joints and the screw pattern. Spacings follow the Knauf manual',
    floor: -0.2, gridSize: 3, camera: { pos: [1.7, 0.85, 1.9], target: [0, 0.45, 0.05] },
    build(kit) {
      const { box, cyl } = kit, m = MAT(kit);
      const studs = grp(...[-0.6, 0, 0.6].map((x) => box(0.045, 0.9, 0.09, m.timber, x, 0.45, 0)), box(1.4, 0.045, 0.09, m.timber, 0, 0.0225, 0), box(1.4, 0.045, 0.09, m.timber, 0, 0.8775, 0));
      const daubs = grp(); for (const x of [-0.6, 0, 0.6]) for (const y of [0.15, 0.45, 0.75]) daubs.add(cyl(0.0125, 0.015, m.mortar, x, y, 0.0525, 10).rotateX(Math.PI / 2));
      const sheets = grp(box(0.7, 0.45, 0.013, m.board, -0.35, 0.225, 0.0715), box(0.696, 0.45, 0.013, m.board, 0.352, 0.225, 0.0715), box(1.2, 0.45, 0.013, m.board, -0.1, 0.675, 0.0715), box(0.196, 0.45, 0.013, m.board, 0.6, 0.675, 0.0715));
      const screws = grp(); for (const x of [-0.6, 0, 0.6]) for (const y of [0.08, 0.25, 0.43, 0.6, 0.78]) screws.add(cyl(0.005, 0.004, m.dark, x, y, 0.079, 8).rotateX(Math.PI / 2));
      return { parts: [
        { id: 'studs', name: 'Studs and plates', group: studs, explode: [0, 0, -0.2], anchor: [-0.6, 0.85, 0.0], flag: 'V', src: 'knaufManual', spec: 'Timber needs a fixing face of at least 35 mm at a supported joint and 30 mm elsewhere. Framing centres are 600 or 450 mm.', desc: 'Plumb, straight and dry before lining.' },
        { id: 'daubs', name: 'Adhesive daubs', group: daubs, explode: [0, 0, 0.05], anchor: [0.0, 0.45, 0.06], flag: 'V', src: 'knaufManual', spec: 'No more than 300 mm apart along the studs, kept 200 mm from sheet edges and screw points. Not used in wet areas.', desc: 'Adhesive holds the sheet flat between the screws.' },
        { id: 'sheets', name: 'Sheets, two rows', group: sheets, explode: [0, 0, 0.3], anchor: [-0.1, 0.62, 0.08], flag: 'V', src: 'knaufManual', spec: 'Fixed horizontally for Level 4 or 5. Butt joints stagger, and vertical joints stay at least 200 mm from the edges of openings.', desc: 'The lower and upper rows do not share a vertical joint.' },
        { id: 'screws', name: 'Screws', group: screws, explode: [0, 0, 0.5], anchor: [0.6, 0.6, 0.08], flag: 'V', src: 'knaufManual', spec: 'Fasteners 10 to 16 mm from sheet edges, fixed from the centre outwards. 300 mm maximum at sheet ends, 200 mm where a butt joint falls on framing.', desc: 'Drive each screw just below the paper, without breaking it.' },
      ] };
    },
  },

  sepwall: {
    title: 'Framed separating wall', sub: 'Two leaves of studs with a 20 mm air gap, insulation in one leaf, two layers of board on each outer face and outlets set 300 mm apart',
    floor: -0.2, gridSize: 3, camera: { pos: [1.7, 0.9, 1.7], target: [0, 0.55, 0] },
    build(kit) {
      const m = MAT(kit), sp = sepParts(kit, 1.0, 1.2);
      return { parts: [
        { id: 'a2', name: 'Outer layer, leaf A', group: sp.a2, explode: [0, 0, -0.55], anchor: [0.4, 1.1, -0.17], flag: 'V', src: 'nccHp107', spec: 'Two layers of 13 mm plasterboard. Second-layer joints must not line up with first-layer joints, and all joints are taped and filled solid.', desc: 'The second layer is offset so its joints sit over solid board.' },
        { id: 'a1', name: 'Inner layer, leaf A', group: sp.a1, explode: [0, 0, -0.35], anchor: [-0.4, 1.1, -0.16], flag: 'C', src: 'nccHp107', spec: 'The clause and table should be checked for where the layers go. The model draws two layers on each outer face.', desc: 'The first layer goes straight on the studs.' },
        { id: 'studsA', name: 'Leaf A studs and insulation', group: grp(sp.studsA, sp.batt), explode: [0, 0, -0.15], anchor: [-0.48, 0.2, -0.06], flag: 'V', src: 'nccHp107', spec: 'Two rows of 90 by 35 timber studs (or 64 mm steel, at least 0.6 mm thick) at 600 mm centres, with insulation. The pages read do not say which leaf holds the insulation.', desc: 'One bay of insulation is drawn, in this leaf only.' },
        { id: 'air', name: 'Air gap', group: sp.airG, explode: [0, 0.4, 0], anchor: [0.0, 1.0, 0.0], flag: 'V', src: 'nccHp107', spec: 'At least 20 mm between the two rows of studs. Noggings must not bridge studs that support different leaves.', desc: 'The two leaves do not touch, so sound does not travel through the frame.' },
        { id: 'studsB', name: 'Leaf B studs', group: sp.studsB, explode: [0, 0, 0.15], anchor: [0.48, 0.2, 0.06], flag: 'V', src: 'nccHp107', spec: 'The second row of studs, on the other dwelling\'s side. Perimeter members are fixed and caulked.', desc: 'A separate frame for the other dwelling.' },
        { id: 'b1', name: 'Inner layer, leaf B', group: sp.b1, explode: [0, 0, 0.35], anchor: [-0.4, 0.5, 0.16], flag: 'C', src: 'nccHp107', spec: 'As leaf A. Check the clause for the layer arrangement.', desc: 'First layer on the studs.' },
        { id: 'b2', name: 'Outer layer, leaf B', group: sp.b2, explode: [0, 0, 0.55], anchor: [0.4, 0.5, 0.17], flag: 'V', src: 'nccHp107', spec: 'Second-layer joints are offset from the first layer. Joints are taped and filled solid.', desc: 'The face that is painted.' },
        { id: 'outlets', name: 'Outlets, 300 mm apart', group: sp.outlets, explode: [0, 0.45, 0], anchor: [0.3, 1.1, 0.0], flag: 'V', src: 'nccHp107', spec: 'Outlets on opposite sides are at least 300 mm apart in framed walls (100 mm in masonry). For fire, outlets avoid lining up with openings opposite (300 mm horizontally or 600 mm vertically) or follow a tested prototype.', desc: 'The red patch is a fire-stopping pad behind the outlet on one side.' },
        { id: 'pipe', name: 'Water pipe', group: sp.pipe, explode: [-0.35, 0, -0.15], anchor: [-0.5, 0.6, -0.06], flag: 'V', src: 'nccHp107', spec: 'A water pipe serving one dwelling is not fixed to the other dwelling\'s leaf, and keeps at least 10 mm clearance.', desc: 'The pipe stays in its own leaf.' },
      ] };
    },
  },

  joint: {
    title: 'Taped and set joint', sub: 'Studs, two sheets with a butt joint, paper tape, two coats and a Level 5 skim. Coat thicknesses are exaggerated',
    floor: -0.15, gridSize: 3, camera: { pos: [0.6, 0.55, 1.6], target: [0, 0.4, 0.05] },
    build(kit) {
      const { box } = kit, m = MAT(kit), coat = kit.ghost(0xf6f4ef, 0.85), skim = kit.ghost(0xfdfcf8, 0.35);
      const studs = grp(box(0.045, 0.9, 0.09, m.timber, -0.6, 0.45, 0), box(0.045, 0.9, 0.09, m.timber, 0, 0.45, 0), box(0.045, 0.9, 0.09, m.timber, 0.6, 0.45, 0));
      const boards = grp(box(0.696, 0.9, 0.013, m.board, -0.35, 0.45, 0.0515), box(0.696, 0.9, 0.013, m.board, 0.35, 0.45, 0.0515));
      const tape = grp(box(0.05, 0.9, 0.002, m.tape, 0, 0.45, 0.0595));
      const c1 = grp(box(0.14, 0.9, 0.003, coat, 0, 0.45, 0.0615)), c2 = grp(box(0.26, 0.9, 0.003, coat, 0, 0.45, 0.0645));
      const sk = grp(box(1.3, 0.9, 0.003, skim, 0, 0.45, 0.067));
      return { parts: [
        { id: 'studs', name: 'Studs', group: studs, explode: [0, 0, -0.25], anchor: [0.6, 0.85, 0.0], flag: 'T', spec: 'The joint lands on or between framing depending on the sheet layout. Back-blocking is used where it lands between.', desc: 'Behind the sheets.' },
        { id: 'boards', name: 'Two sheets, butt joint', group: boards, explode: [0, 0, 0.0], anchor: [-0.6, 0.12, 0.06], flag: 'T', spec: 'A butt joint is a cut end with no taper, so it is harder to finish than a tapered edge. Staggering them avoids a line across the wall.', desc: 'The small gap between sheets is filled by the first coat.' },
        { id: 'tape', name: 'Paper tape', group: tape, explode: [0, 0, 0.13], anchor: [0, 0.8, 0.06], flag: 'V', src: 'knaufManual', spec: 'Level 3 is tape plus one coat. Level 4 is tape plus two coats. Wet-area joints use base compound and paper tape.', desc: 'The tape bridges the joint so it does not crack.' },
        { id: 'c1', name: 'First coat', group: c1, explode: [0, 0, 0.24], anchor: [0.07, 0.62, 0.062], flag: 'V', src: 'knaufManual', spec: 'Bedding coat over the tape. Level 4 needs two coats.', desc: 'Dry before the next coat.' },
        { id: 'c2', name: 'Second coat', group: c2, explode: [0, 0, 0.35], anchor: [0.13, 0.4, 0.065], flag: 'V', src: 'knaufManual', spec: 'A wider second coat feathered out. This completes a Level 4 finish.', desc: 'Sanded smooth before paint.' },
        { id: 'skim', name: 'Level 5 skim', group: sk, explode: [0, 0, 0.5], anchor: [-0.55, 0.3, 0.067], flag: 'V', src: 'knaufManual', spec: 'Level 5 adds a finishing coat and a skim over the whole face.', desc: 'Only where the plans or the finish ask for it.' },
      ] };
    },
  },
};

export default {
  n: 12, id: 'linings', title: 'Internal linings', subtitle: 'Frame check, ceiling and wall sheets, wet-area boards, fire and sound separation, tape and set, inspection and the fixing stage.',
  phases, build, details, drawings, howto, trades, materials, quotes, quoteTips, inspections, exam, sources, caution,
};

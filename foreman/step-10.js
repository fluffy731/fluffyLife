// Step 10: wet areas and waterproofing. The bathroom framed in Step 8 is lined with wet-area sheet, the floor is screeded to fall to the waste, then a waterproofer
// primes, tapes the junctions, applies the membrane in thin coats, checks it, flood tests it and hands over the record.
// Rules marked Verified come from the ABCB's NCC 2022 Housing Provisions Part 10.2 web page (a partial extract), the BPC and NCCB wet-area pages and the HIA page named in
// Sources. AS 3740 is paywalled and was not opened, so test methods, cure times and coat counts are Typical or Confirm. Layers in the zoom rooms are drawn thicker than real.
import * as THREE from 'three';
import step8 from './step-08.js';
import { grp } from './step-06.js';
import { F } from './frame.js';
import { drawings, howto, trades, materials, quotes, quoteTips, inspections, exam, sources, caution } from './step-10-study.js';

const Y0 = F.SLAB;
const TS = 0.01;                                         // wet-area sheet thickness in the model
const BX0 = -5.26, BX1 = -2.045, BZ0 = 1.245, BZ1 = 5.455;   // clear room inside the Step 8 partitions and the Step 3 frame
const WX = -3.6, WZ = 2.4;                               // floor waste: the Step 2 sewer riser
const DX = -2.0, DZ0 = 3.19, DZ1 = 4.01;                 // doorway in the east partition
const FALL = 1 / 60, SMIN = 0.012;                       // screed 12 mm at the waste, falling 1 in 60 (inside the NCC range 1:80 to 1:50)
const fy = (x, z) => Y0 + SMIN + Math.hypot(x - WX, z - WZ) * FALL;   // top of the screed
const SHOWER_TOP = Y0 + 1.8;                             // shower walls waterproofed to 1800 mm above the floor substrate

const phases = [
  { title: 'Plan the wet areas and take delivery', text: 'Decide which areas are wet areas, book the waterproofer and check the system data sheet. Wet-area sheet, primer, membrane, bond breaker tape and sealant arrive and stay dry.' },
  { title: 'Wet-area sheets and screed to falls', text: 'Wet-area sheet is fixed to the walls, the screed is laid to fall to the floor waste, the waste flange, doorway waterstop and tap flanges go in.' },
  { title: 'Clean, prime, bond breaker and fillets', text: 'The substrate is cleaned and checked dry. Primer goes on, bond breaker tape and a sealant fillet go into every internal angle and along the floor and wall junctions.' },
  { title: 'Membrane, first coat', text: 'The first thin coat of membrane goes on the floor, up the walls and over the junctions, with reinforcing bandage pressed into the angles and around penetrations.' },
  { title: 'Membrane, second coat and checks', text: 'The second coat goes on in the other direction. The shower walls are carried up to 1800 mm. The waterproofer and the builder look for pinholes and thin spots before anything covers it.' },
  { title: 'Cure and flood test', text: 'The membrane cures as the maker says. The floor is then dammed at the door and flooded, the level is marked and the area is watched for a drop.' },
  { title: 'Records, certificate and protection', text: 'The waterproofer\'s record, photographs, product details and flood test log go on file. The membrane is protected until the tiler starts (Step 14).' },
];

/* ---------- walk scene ---------- */
function build(kit) {
  const { C, mat, box, cyl, rod, textPlane, ghost } = kit;
  const mk = (n) => { const g = new THREE.Group(); g.name = n; return g; };
  const s8 = step8.build(kit);
  const DROP = ['stock', 'legend', 'conn', 'trench', 'dtest', 'backfill', 'waste', 'fixtures', 'cold', 'hot', 'plv', 'ptest', 'check'];
  const layers = s8.layers.filter((l) => !DROP.includes(l.group.name)).map(({ group }) => ({ group }));

  const m = {
    sheet: mat(0xcfd3cb, { roughness: 0.92 }), joint: mat(0x9aa093, { roughness: 0.9 }), screed: mat(0xb4b0a6, { roughness: 0.96 }),
    primer: mat(0xe3b866, { roughness: 0.7 }), tape: mat(0xf6f6f2, { roughness: 0.6 }), seal: mat(0x7d8c88, { roughness: 0.5 }),
    c1: mat(0x6eb0e2, { roughness: 0.55 }), c2: mat(0x2f6fae, { roughness: 0.5 }), fab: mat(0xffffff, { roughness: 0.8, transparent: true, opacity: 0.85 }),
    steel: mat(0xb9c2cd, { metalness: 0.6, roughness: 0.35 }), brass: mat(0xc9a24a, { metalness: 0.7, roughness: 0.35 }), white: mat(0xf4f4f2, { roughness: 0.4 }),
    timber: mat(0xffffff, { tex: 'timber' }), card: mat(0xc8ad82, { roughness: 0.9 }), orange: mat(0xe8590c, { roughness: 0.6 }), dam: mat(0x8c9094, { roughness: 0.8 }),
  };

  // floor surface that falls to the waste, lifted by a few millimetres for each coat
  const floorMesh = (mt, lift = 0) => {
    const w = BX1 - BX0, d = BZ1 - BZ0, geo = new THREE.PlaneGeometry(w, d, 26, 34);
    geo.rotateX(-Math.PI / 2);
    const p = geo.attributes.position, cx = (BX0 + BX1) / 2, cz = (BZ0 + BZ1) / 2;
    for (let i = 0; i < p.count; i++) { const x = p.getX(i) + cx, z = p.getZ(i) + cz; p.setXYZ(i, x, fy(x, z) + lift, z); }
    geo.computeVertexNormals();
    const me = new THREE.Mesh(geo, mt); me.receiveShadow = true; return me;
  };

  // the four faces of the room
  const wall = {
    N: { ax: 'z', c: BZ0 + TS, dir: 1, a: BX0, b: BX1, at: (s) => [s, BZ0 + TS] },
    E: { ax: 'x', c: BX1 - TS, dir: -1, a: BZ0, b: BZ1, at: (s) => [BX1 - TS, s] },
    S: { ax: 'z', c: BZ1 - TS, dir: -1, a: BX0, b: BX1, at: (s) => [s, BZ1 - TS] },
    W: { ax: 'x', c: BX0 + TS, dir: 1, a: BZ0, b: BZ1, at: (s) => [BX0 + TS, s] },
  };
  const upturn = (w) => (s) => { const [x, z] = w.at(s); return fy(x, z) + 0.15; };
  // a coat on the walls: spans carry either a fixed top height or a function (the 150 mm upturn follows the falling floor)
  const skin = (g, mt, w, t, spans) => {
    for (const sp of spans) {
      const put = (s0, s1, top) => {
        const bottom = Y0 + 0.01, h = top - bottom; if (h <= 0.001) return;
        const mid = (s0 + s1) / 2, len = s1 - s0 + 0.001, c = w.c + w.dir * (t / 2), y = bottom + h / 2;
        g.add(w.ax === 'z' ? box(len, h, t, mt, mid, y, c) : box(t, h, len, mt, c, y, mid));
      };
      if (typeof sp.top === 'number') put(sp.a, sp.b, sp.top);
      else for (let s = sp.a; s < sp.b - 0.001; s += 0.2) { const s1 = Math.min(sp.b, s + 0.2); put(s, s1, sp.top((s + s1) / 2)); }
    }
  };
  const coatSpans = () => ({
    N: [{ a: BX0 + TS, b: BX1 - TS, top: SHOWER_TOP }],
    W: [{ a: BZ0 + TS, b: 2.4, top: SHOWER_TOP }, { a: 2.4, b: BZ1 - TS, top: upturn(wall.W) }],
    E: [{ a: BZ0 + TS, b: DZ0, top: upturn(wall.E) }, { a: DZ1, b: BZ1 - TS, top: upturn(wall.E) }],
    S: [{ a: BX0 + TS, b: BX1 - TS, top: upturn(wall.S) }],
  });
  const coat = (name, mt, t, lift) => {
    const g = mk(name); g.add(floorMesh(mt, lift));
    const sp = coatSpans(); for (const k of ['N', 'E', 'S', 'W']) skin(g, mt, wall[k], t, sp[k]);
    return g;
  };

  // wet-area sheets: window, door and lintel openings are left out
  const sheets = mk('sheets'), H = 2.7, cx = (BX0 + BX1) / 2;
  sheets.add(box(BX1 - BX0, H, TS, m.sheet, cx, Y0 + H / 2, BZ0 + TS / 2), box(BX1 - BX0, H, TS, m.sheet, cx, Y0 + H / 2, BZ1 - TS / 2));
  const strip = (z0, z1, y0, y1) => box(TS, y1 - y0, z1 - z0, m.sheet, 0, Y0 + (y0 + y1) / 2, (z0 + z1) / 2);
  const east = (z0, z1, y0, y1) => { const b = strip(z0, z1, y0, y1); b.position.x = BX1 - TS / 2; return b; };
  const west = (z0, z1, y0, y1) => { const b = strip(z0, z1, y0, y1); b.position.x = BX0 + TS / 2; return b; };
  sheets.add(east(BZ0, DZ0, 0, H), east(DZ1, BZ1, 0, H), east(DZ0, DZ1, 2.1, H), west(BZ0, 2.4, 0, H), west(3.6, BZ1, 0, H), west(2.4, 3.6, 0, 0.9), west(2.4, 3.6, 2.1, H));
  for (const x of [-4.1, -2.9]) sheets.add(box(0.004, H, TS + 0.002, m.joint, x, Y0 + H / 2, BZ0 + TS / 2), box(0.004, H, TS + 0.002, m.joint, x, Y0 + H / 2, BZ1 - TS / 2));
  for (const z of [2.45, 3.65, 4.85]) { const a = strip(z - 0.002, z + 0.002, 0, H), b = a.clone(); a.position.x = BX0 + TS / 2; a.scale.x = 1.2; b.position.x = BX1 - TS / 2; b.scale.x = 1.2; if (z < DZ0 || z > DZ1) sheets.add(b); if (z < 2.4 || z > 3.6) sheets.add(a); }

  const screed = mk('screed'); screed.add(floorMesh(m.screed, 0), box(0.012, fy(DX, 3.6) - Y0, DZ1 - DZ0, m.screed, BX1 + 0.005, (Y0 + fy(DX, 3.6)) / 2, 3.6));

  // hardware fixed with the sheets: waste flange, doorway waterstop, tap and shower arm flanges
  const hw = mk('hardware');
  hw.add(cyl(0.075, 0.03, m.white, WX, Y0 + SMIN + 0.004, WZ, 20), cyl(0.12, 0.012, m.steel, WX, Y0 + SMIN + 0.004, WZ, 24));
  hw.add(box(0.05, 0.004, DZ1 - DZ0, m.steel, DX - 0.02, fy(DX, 3.6) + 0.004, 3.6), box(0.004, 0.03, DZ1 - DZ0, m.steel, DX - 0.043, fy(DX, 3.6) + 0.019, 3.6));
  const pz = BZ0 + TS;
  for (const [x, y] of [[-3.68, 1.3], [-3.52, 1.3], [-3.6, 2.15]]) {
    const f = cyl(0.045, 0.014, m.steel, x, y, pz + 0.007, 20); f.rotation.x = Math.PI / 2;
    const f2 = cyl(0.03, 0.02, m.white, x, y, pz + 0.014, 16); f2.rotation.x = Math.PI / 2;
    const s = cyl(0.014, 0.1, m.brass, x, y, pz + 0.06, 12); s.rotation.x = Math.PI / 2; hw.add(f, f2, s);
  }

  // primer, junction tape and sealant fillets, then the membrane coats and the bandage
  const prime = coat('primer', m.primer, 0.002, 0.002);
  const lineAt = (g, x0, z0, x1, z1, off, r, mt) => g.add(rod([x0, fy(x0, z0) + off, z0], [x1, fy(x1, z1) + off, z1], r, mt, 6));
  const edges = (g, d, off, r, mt) => {
    const xa = BX0 + TS + d, xb = BX1 - TS - d, za = BZ0 + TS + d, zb = BZ1 - TS - d;
    lineAt(g, xa, za, xb, za, off, r, mt); lineAt(g, xa, zb, xb, zb, off, r, mt); lineAt(g, xa, za, xa, zb, off, r, mt);
    lineAt(g, xb, za, xb, DZ0 - 0.02, off, r, mt); lineAt(g, xb, DZ1 + 0.02, xb, zb, off, r, mt);
  };
  const junction = mk('junction'); edges(junction, 0.012, 0.006, 0.009, m.tape); edges(junction, 0.03, 0.009, 0.007, m.seal);
  for (const [x, z, top] of [[BX0 + TS + 0.012, BZ0 + TS + 0.012, SHOWER_TOP], [BX1 - TS - 0.012, BZ0 + TS + 0.012, SHOWER_TOP], [BX0 + TS + 0.012, BZ1 - TS - 0.012, Y0 + 0.25], [BX1 - TS - 0.012, BZ1 - TS - 0.012, Y0 + 0.25]]) junction.add(rod([x, Y0 + 0.02, z], [x, top, z], 0.009, m.tape, 6));
  const c1 = coat('coat1', m.c1, 0.004, 0.004), c2 = coat('coat2', m.c2, 0.006, 0.006);
  const fabric = mk('fabric'); edges(fabric, 0.03, 0.009, 0.012, m.fab);
  for (const x of [BX0 + 0.03, BX1 - 0.03]) fabric.add(box(0.07, SHOWER_TOP - Y0 - 0.1, 0.006, m.fab, x, Y0 + (SHOWER_TOP - Y0) / 2, BZ0 + TS + 0.006));
  for (const [x, y] of [[-3.68, 1.3], [-3.52, 1.3], [-3.6, 2.15]]) { const r = new THREE.Mesh(new THREE.TorusGeometry(0.036, 0.007, 8, 20), m.fab); r.position.set(x, y, BZ0 + TS + 0.02); fabric.add(r); }
  // 1500 mm radius from the shower rose, and the 1800 mm mark
  const arc = mk('arc'), pts = [];
  for (let i = 0; i <= 56; i++) { const a = Math.PI * i / 56, x = WX + Math.cos(a) * 1.5, z = BZ0 + TS + Math.sin(a) * 1.5; if (x > BX0 + 0.02 && x < BX1 - 0.02 && z < BZ1 - 0.05) pts.push(new THREE.Vector3(x, fy(x, z) + 0.02, z)); }
  const tube = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 90, 0.012, 6), m.orange); arc.add(tube);
  const al = textPlane(['1500 mm from the shower rose'], 1.5, 0.2); al.rotation.x = -Math.PI / 2; al.position.set(-3.0, fy(-3.0, 2.6) + 0.03, 2.9); arc.add(al);
  const mark = mk('mark'), ml = textPlane(['1800 mm minimum'], 0.8, 0.16); ml.position.set(-4.7, SHOWER_TOP + 0.08, BZ0 + TS + 0.02); mark.add(ml, rod([BX0 + 0.03, SHOWER_TOP, BZ0 + TS + 0.012], [BX1 - 0.03, SHOWER_TOP, BZ0 + TS + 0.012], 0.01, m.orange, 6));

  // delivery before the floor is screeded, and the pails and tools on the screed afterwards
  const stock = mk('stock');
  for (let i = 0; i < 7; i++) stock.add(box(2.4, 0.009, 1.2, m.sheet, -4.0, Y0 + 0.06 + i * 0.011, 4.35));
  for (const x of [-5.0, -4.0, -3.0]) stock.add(box(0.1, 0.05, 1.3, m.timber, x, Y0 + 0.025, 4.35));
  const pailAt = (g, x, z, h, r, lid) => { g.add(cyl(r, h, mat(0xe9eaec, { roughness: 0.5 }), x, fy(x, z) + h / 2, z, 16), cyl(r * 1.02, 0.02, mat(lid, { roughness: 0.5 }), x, fy(x, z) + h + 0.01, z, 16)); };
  const pails = mk('pails');
  pailAt(pails, -2.5, 5.1, 0.35, 0.16, 0x2f6fae); pailAt(pails, -2.9, 5.2, 0.35, 0.16, 0x2f6fae); pailAt(pails, -2.7, 4.7, 0.25, 0.12, 0xe3b866);
  pails.add(box(0.45, 0.02, 0.28, m.card, -3.4, fy(-3.4, 4.9) + 0.01, 4.9), cyl(0.04, 0.02, m.tape, -3.4, fy(-3.4, 4.9) + 0.03, 4.9, 12));

  // signs
  const keep = mk('keepsign'), ks = textPlane(['WATERPROOFING IN PROGRESS', 'Keep out. Membrane curing.', 'Coats and cure times per the maker'], 1.5, 0.75);
  ks.position.set(-1.62, 1.25, 4.6); ks.rotation.y = Math.PI / 2; keep.add(ks, cyl(0.025, 1.2, mat(C.steel), -1.62, 0.6, 3.9, 8), cyl(0.025, 1.2, mat(C.steel), -1.62, 0.6, 5.3, 8));
  const flood = mk('flood'), water = new THREE.Mesh(new THREE.PlaneGeometry(BX1 - BX0 - 0.02, BZ1 - BZ0 - 0.02), ghost(0x9fe6ee, 0.5)); water.rotation.x = -Math.PI / 2; water.position.set(cx, fy(BX1, BZ1) + 0.03, (BZ0 + BZ1) / 2); flood.add(water);
  for (const [x0, z0, x1, z1] of [[BX0 + TS, BZ0 + TS, BX1 - TS, BZ0 + TS], [BX0 + TS, BZ1 - TS, BX1 - TS, BZ1 - TS], [BX0 + TS, BZ0 + TS, BX0 + TS, BZ1 - TS]]) flood.add(rod([x0, fy(BX1, BZ1) + 0.03, z0], [x1, fy(BX1, BZ1) + 0.03, z1], 0.008, m.white, 6));
  flood.add(box(0.04, 0.12, DZ1 - DZ0 + 0.1, m.dam, DX + 0.1, fy(DX, 3.6) + 0.06, 3.6));
  const fs = textPlane(['FLOOD TEST', 'Level marked, start time logged', 'Check for a drop and for damp below'], 1.6, 0.8); fs.position.set(-1.62, 1.25, 3.1); fs.rotation.y = Math.PI / 2; flood.add(fs, cyl(0.025, 1.2, mat(C.steel), -1.62, 0.6, 2.35, 8), cyl(0.025, 1.2, mat(C.steel), -1.62, 0.6, 3.85, 8));
  const rec = mk('record'), rs = textPlane(['WATERPROOFING RECORD', 'Product, batch and coats', 'Photos, flood test log, certificate'], 1.7, 0.8); rs.position.set(-4.4, 1.55, BZ1 - TS - 0.004); rs.rotation.y = Math.PI; rec.add(rs);
  const prot = mk('protect'); prot.add(box(1.2, 0.006, 2.4, m.card, -3.0, fy(-3.0, 4.2) + 0.012, 4.3), box(1.2, 0.006, 1.2, m.card, -4.4, fy(-4.4, 4.2) + 0.014, 4.3));

  layers.push({ group: sheets, from: 1 }, { group: screed, from: 1, until: 2 }, { group: hw, from: 1 }, { group: prime, from: 2, until: 3 }, { group: junction, from: 2, until: 3 }, { group: c1, from: 3, until: 4 }, { group: fabric, from: 3, until: 4 }, { group: c2, from: 4 },
    { group: arc, from: 1 }, { group: mark, from: 3 }, { group: stock, until: 1 }, { group: pails, from: 2, until: 6 }, { group: keep, from: 2, until: 6 }, { group: flood, from: 5, until: 6 }, { group: rec, from: 6 }, { group: prot, from: 6 });
  return {
    layers, colliders: s8.colliders, tickers: s8.tickers,
    spawn: { pos: [4, 18.5], yaw: 0, pitch: 0.2 }, map: s8.map,
    orbit: { pos: [3.5, 7.5, 8.5], target: [-3.6, 0.3, 3.3] },
    hotspots: HOTSPOTS,
  };
}

const HOTSPOTS = [
  { id: 'scope', title: 'What counts as a wet area', pos: [-3.6, 1.4, 1.27], stand: [-3.6, 4.6], from: 0, detail: 'shower', drawing: 'plan',
    summary: 'Waterproofing is about keeping water out of the building structure. The NCC protects building elements in wet areas with a waterproofing system, and for a house it gives you two ways to comply. Find out which one the design uses before you take quotes.',
    learn: [['Building elements in wet areas within a building must be protected with a waterproofing system.', 'V', 'nccHp102'], ['For Class 1 buildings the Performance Requirement is H4P1. H4D2 sets out where protection is needed and H4D3 sets out the materials and how to install them. The NCCB page names these for NCC 2022.', 'V', 'nccbWet'], ['Two ways to comply for a house: Option 1 is Housing Provisions Part 10.2 in full (10.2.1 to 10.2.32). Option 2 is 10.2.1 to 10.2.6 and 10.2.12, plus AS 3740. Use the edition of AS 3740 the NCC refers to; the NCCB page says AS 3740:2021 for NCC 2022.', 'V', 'nccbWet'], ['Wet areas are bathrooms, laundries and the like. Clauses 10.2.1 to 10.2.5 follow Table 3.8.1.1 of NCC 2019 closely, and 10.2.5 adds toilets with a bidet spray.', 'V', 'nccbWet'], ['Pages read are NCC 2022. NCC 2025 applies from 1 May 2026, so check which edition your permit was assessed against and read the matching Part 10.2.', 'C', 'hiaNcc25'], ['AS 3740 was not opened. Anything below that cites the Standard is marked Typical or Confirm.', 'C']] },
  { id: 'stock', title: 'Delivery and the system data sheet', pos: [-4.4, 0.4, 4.35], stand: [-3.3, 3.2], from: 0, until: 1,
    summary: 'Sheets, primer, membrane, tape and sealant should all come from one waterproofing system, with the maker\'s data sheet. Mixing brands is how compatibility problems start.',
    learn: [['Components must be compatible: substrates, primers, sealants, membranes and overlays.', 'V', 'bpcWet'], ['Membranes must comply with AS/NZS 4858 (the page cites the 2004 edition).', 'V', 'bpcWet'], ['Deemed-to-satisfy water-resistant wall materials include compressed fibre-cement to AS/NZS 2908.2 and water-resistant plasterboard.', 'V', 'nccHp102'], ['Ask for the maker\'s data sheet for the whole system: primer, membrane, coat count, thickness, cure times, reinforcing and the products it is compatible with.', 'T'], ['Keep sheets flat and dry, and keep membrane and primer out of the sun and the cold. Pails carry shelf lives and temperature limits.', 'T'], ['Keep the product names and batch numbers. They go in the record at the end of this step.', 'T']] },
  { id: 'sheet', title: 'Wet-area sheet and the substrate', pos: [-5.24, 1.2, 2.6], stand: [-2.7, 4.7], from: 1, detail: 'junction',
    summary: 'The membrane is only as good as what it sticks to. The substrate must be smooth, clean, dry and sound, and the sheets are fixed to the maker\'s rules, not to plasterboard habits.',
    learn: [['The substrate must be smooth, clean, dry and dust-free, with no protrusions, voids or formwork distortions.', 'V', 'bpcWet'], ['Measure substrate moisture before applying the membrane. Excess moisture can prevent curing or cause early failure.', 'V', 'bpcWet'], ['Deemed water-resistant walls include concrete treated to resist moisture movement, compressed fibre-cement to AS/NZS 2908.2 and water-resistant plasterboard.', 'V', 'nccHp102'], ['In this model the sheets stop short of the window and doorway openings, and the corner of the Step 3 doorway at the south-east corner is simply covered.', 'T'], ['Sheet joints, screw heads and cut edges are sealed or taped as the maker says. Ask the plasterer and waterproofer who is responsible for each.', 'C']] },
  { id: 'falls', title: 'Screed to falls', pos: [-3.6, 0.15, 2.6], stand: [-2.4, 5.2], from: 1, detail: 'waste', drawing: 'plan',
    summary: 'Water must run to the waste. The screed is laid to fall to it, and the fall is checked with a level before the waterproofer starts, not after.',
    learn: [['The minimum fall to the waste is 1:80 and the maximum is 1:50 (clause 10.2.12).', 'V', 'bpcWet'], ['A floor waste is not mandatory under 10.2.12 according to the NCCB page, but if one is installed the floor must be graded to it, even outside an enclosed shower.', 'V', 'nccbWet'], ['The ABCB page extract says the floor of a wet area containing a vessel must be graded to a floor waste. The two sources are worded differently, so check the clause text before you decide whether a waste is required.', 'C', 'nccHp102'], ['The model screed falls about 1 in 60 to the waste: 12 mm thick at the waste and about 57 mm at the far corner.', 'T'], ['Check the fall on the substrate, not on the tiles. Ponding under tiles is a common defect.', 'T', 'buildingLegal']] },
  { id: 'waste', title: 'Floor waste and flange', pos: [-3.6, 0.3, 2.4], stand: [-3.6, 4.3], from: 1, detail: 'waste',
    summary: 'The plumber set the waste in Step 8. Here the waterproofer\'s membrane has to finish at or in its flange, and the waste has to suit the tile and bed that go over it.',
    learn: [['A drainage flange must be installed with the waterproofing membrane terminated at or in the drainage flange.', 'V', 'nccHp102'], ['Floor wastes must suit the tile and tile bed thickness.', 'V', 'nccHp102'], ['A floor waste is required in the shower area.', 'V', 'bpcWet'], ['Ask the plumber and the tiler to agree the flange height with the waterproofer before the screed goes in.', 'T'], ['A leaking flange joint shows up in the flood test. Fix it before tiling.', 'T']] },
  { id: 'door', title: 'Doorway waterstop', pos: [-2.03, 0.12, 3.6], stand: [-3.2, 3.6], from: 1, detail: 'door',
    summary: 'The doorway is where water escapes into the next room. A waterstop angle at floor level, with the membrane sealed to it, stops it.',
    learn: [['Perimeter flashings are required at floor-level openings.', 'V', 'bpcWet'], ['Where the whole wet area floor is waterproofed, install a waterstop with a vertical leg flush with finished floor level, and terminate the floor membrane to seal to the waterstop and the flashing.', 'V', 'bpcWet'], ['Perimeter flashing vertical leg: at least 25 mm above finished floor level except across doorways. Horizontal leg: at least 50 mm wide.', 'V', 'nccHp102'], ['The ABCB page extract is partial and its clause numbers are inferred. Check the clause wording for the doorway case.', 'C', 'nccHp102'], ['Tell the door and flooring trades where the waterstop sits so that nothing is fixed through it.', 'T']] },
  { id: 'pen', title: 'Tap and shower arm penetrations', pos: [-3.6, 1.45, 1.29], stand: [-3.6, 2.7], from: 1, detail: 'pen',
    summary: 'Every pipe through the wall is a way in for water. The plumber left capped stubs in Step 8. Each one gets a flange or sealant detail that the membrane ties into.',
    learn: [['Tap and shower penetrations must be sealed with sealants, proprietary flange systems or a combination.', 'V', 'nccHp102'], ['The spindle housing of the tap body must be able to be removed to replace the washer.', 'V', 'nccHp102'], ['Mechanical fixings and recessed soap holders (niches) must be waterproofed.', 'V', 'nccHp102'], ['Wall junctions, joints and penetrations in the shower area must be waterproof.', 'V', 'nccHp102'], ['Confirm the mixer and arm positions with the plumber and tiler before the sheets are fixed, so the flanges land on solid backing.', 'T']] },
  { id: 'corner', title: 'Bond breaker and angles', pos: [-5.23, 0.45, 1.29], stand: [-3.4, 3.2], from: 2, detail: 'junction', drawing: 'junction',
    summary: 'Internal angles move a little. The bond breaker lets the membrane stretch across the joint instead of tearing, and the fillet gives it an easy curve to follow.',
    learn: [['Bond breakers must be installed at all wall/wall, wall/floor and hob/wall junctions, and at movement joints where the membrane is bonded to the substrate.', 'V', 'nccHp102'], ['The bond breaker type must suit the membrane\'s flexibility class.', 'V', 'nccHp102'], ['Wall junctions and joints within the shower area must be waterproof not less than 40 mm either side of the junction.', 'V', 'nccHp102'], ['Sealants must be flexible, mould resistant and compatible with adjacent materials.', 'V', 'bpcWet'], ['A fillet of sealant at the angle gives the membrane a cove to follow. Size and type come from the system data sheet.', 'T']] },
  { id: 'coat', title: 'Membrane coats', pos: [-4.5, 1.1, 1.29], stand: [-3.6, 3.6], from: 3, detail: 'junction',
    summary: 'The membrane goes on in thin coats, not one thick one. A thick coat traps air and leaves pinholes, and a pinhole is a leak.',
    learn: [['Apply in multiple thin coats. A single thick coat can trap air and cause pinholes.', 'V', 'bpcWet'], ['Check dry film thickness against the maker\'s data sheet, not by eye.', 'T'], ['Bandage or reinforcing goes into the angles and around penetrations before the next coat.', 'T'], ['The number of coats, the thickness and the time between coats come from the system data sheet. AS 3740 and the data sheet were not opened.', 'C']] },
  { id: 'height', title: 'Shower walls to 1800 mm', pos: [-3.6, 1.85, 1.29], stand: [-3.6, 3.6], from: 3, detail: 'shower', drawing: 'shower',
    summary: 'In the shower the walls matter as much as the floor. The membrane carries up the walls to at least 1800 mm, and the shower floor, any hob or step-down and its edge have their own rules.',
    learn: [['The shower floor must be waterproofed, including any hob or step-down, and the walls of the shower area must be waterproofed not less than 1800 mm above the floor substrate.', 'V', 'nccHp102'], ['Unenclosed shower: waterproof the floor within a 1500 mm horizontal radius of the shower rose connection.', 'V', 'bpcWet'], ['A step-down shower floor is stepped down at least 25 mm below the outside finished floor level. Hobs must be masonry, concrete, autoclaved aerated concrete or extruded polyurethane foam. Timber must not be used for a hob.', 'V', 'nccHp102'], ['Enclosed hobless shower with a screen: the waterstop vertical leg is at least 5 mm above finished floor level.', 'V', 'nccHp102'], ['A shower over a free-standing bath with no screen: any wall within the 1500 mm radius is waterproofed to at least 1800 mm.', 'V', 'bpcWet'], ['Which of these applies depends on whether the shower is enclosed, has a hob or a step-down, and what the endorsed drawings show. Confirm against the clause text.', 'C', 'nccHp102']] },
  { id: 'inspect', title: 'Look before it is covered', pos: [-3.0, 0.4, 2.0], stand: [-3.2, 4.2], from: 4, until: 5,
    summary: 'This is the check that matters. Once tiles go on, nobody can see the membrane. Inspect the whole membrane with the waterproofer while it can still be fixed cheaply.',
    learn: [['Do a visual inspection before any finish is applied. Check pinholes, dry film thickness, fillets, transitions, bonding, vertical termination heights and waterstop location.', 'V', 'bpcWet'], ['Waterproofing is not a mandatory inspection stage under section 33 of the Building Act 1993. It appears in MI 01 as an example of an additional inspection the building surveyor may require under section 35.', 'V', 'bpcMI01'], ['Photograph every coat and every detail with a tape measure or a note of the date, and keep the photographs with the record.', 'T'], ['Ask the surveyor whether they want to see the membrane before the tiles go on, and write their answer in the job file.', 'T']] },
  { id: 'flood', title: 'Flood test', pos: [-3.4, 0.35, 3.8], stand: [-2.6, 5.0], from: 5, until: 6,
    summary: 'A flood test is the practical proof. The doorway is dammed, the floor is flooded to a marked level and left, and any drop in level or damp underneath shows a leak.',
    learn: [['A flood test is normal practice: dam the outlets, fill the floor to a level set by the installer, mark it and watch for a drop over the time the maker or Standard sets.', 'T'], ['The test level and duration come from AS 3740 and the membrane maker. Neither was opened here. Confirm them before you rely on a number.', 'C'], ['Check the ceiling or room below and the adjoining rooms for damp as well as the water level.', 'T'], ['Remove the dam and clean up before the tiler starts. A failed test means a repair and a repeat, so allow the time in the programme.', 'T']] },
  { id: 'cert', title: 'Record, warranty and protection', pos: [-4.4, 1.55, 5.42], stand: [-4.4, 3.2], from: 6, drawing: 'flow',
    summary: 'The paperwork is part of the job. Keep the installer\'s record and your own photographs, and protect the membrane until the tiler is on site.',
    learn: [['Builders are obliged to provide a statutory warranty for all waterproofing work undertaken. The HIA page says so but its guidance is paywalled.', 'V', 'hiaWet'], ['A law firm article lists Domestic Building Contracts Act 1995 implied warranties (section 8) and Building Act time limits for defects. It is a secondary source, so check the sections and periods against the Acts.', 'C', 'buildingLegal'], ['The pages read here do not mention a mandatory waterproofing certificate. Ask the surveyor and check the contract, and keep the installer\'s own record either way.', 'C'], ['Keep: product names and batch numbers, coat times, photographs, flood test log, the installer\'s record and the system warranty.', 'T'], ['Protect the membrane with sheets of board until the tiler starts (Step 14), and tell every trade not to cut or drill the wet area floor.', 'T']] },
];

/* ---------- 3D detail models ---------- */
const MAT = (kit) => {
  const { mat } = kit;
  return {
    timber: mat(0xffffff, { tex: 'timber' }), conc: mat(0xffffff, { tex: 'concrete' }), screed: mat(0xb4b0a6, { roughness: 0.96 }), sheet: mat(0xcfd3cb, { roughness: 0.92 }),
    primer: mat(0xe3b866, { roughness: 0.7 }), tape: mat(0xf6f6f2, { roughness: 0.6 }), seal: mat(0x7d8c88, { roughness: 0.5 }), c1: mat(0x6eb0e2, { roughness: 0.55 }), c2: mat(0x2f6fae, { roughness: 0.5 }),
    fab: mat(0xffffff, { roughness: 0.8, transparent: true, opacity: 0.85 }), adh: mat(0xd9cdb4, { roughness: 0.95 }), tile: mat(0xe9edf0, { roughness: 0.25 }), steel: mat(0xb9c2cd, { metalness: 0.6, roughness: 0.35 }),
    brass: mat(0xc9a24a, { metalness: 0.7, roughness: 0.35 }), white: mat(0xf4f4f2, { roughness: 0.4 }), dark: mat(0x1b1d20, { roughness: 0.7 }), pvc: mat(0xd7d9dd, { roughness: 0.5 }),
    sewer: mat(0x8a5a3c, { roughness: 0.6 }), orange: mat(0xe8590c, { roughness: 0.6 }), foam: mat(0xe6e0c4, { roughness: 0.9 }),
  };
};
// a triangular bead of sealant running along x in an internal corner (floor y = 0, wall z = 0)
const wedge = (s, len, mt, x = 0, y = 0, z = 0) => {
  const sh = new THREE.Shape(); sh.moveTo(0, 0); sh.lineTo(s, 0); sh.lineTo(0, s); sh.closePath();
  const g = new THREE.ExtrudeGeometry(sh, { depth: len, bevelEnabled: false }); g.rotateY(-Math.PI / 2); g.translate(len / 2, 0, 0);
  const me = new THREE.Mesh(g, mt); me.position.set(x, y, z); me.castShadow = me.receiveShadow = true; return me;
};
// four boxes around a rectangular hole: a plate with a hole, lying flat (y) or standing (z)
const plateHole = (box, mt, w, d, hw, hd, t, x, y, z, flat = true) => {
  const g = grp(), sx = (w - hw) / 2, sz = (d - hd) / 2;
  if (flat) g.add(box(w, t, sz, mt, x, y, z - (hd + sz) / 2), box(w, t, sz, mt, x, y, z + (hd + sz) / 2), box(sx, t, hd, mt, x - (hw + sx) / 2, y, z), box(sx, t, hd, mt, x + (hw + sx) / 2, y, z));
  else g.add(box(w, sz, t, mt, x, y - (hd + sz) / 2, z), box(w, sz, t, mt, x, y + (hd + sz) / 2, z), box(sx, hd, t, mt, x - (hw + sx) / 2, y, z), box(sx, hd, t, mt, x + (hw + sx) / 2, y, z));
  return g;
};
const flatRing = (r1, r2, mt, x, y, z) => { const g = new THREE.RingGeometry(r1, r2, 36); g.rotateX(-Math.PI / 2); const me = new THREE.Mesh(g, mt); me.position.set(x, y, z); me.receiveShadow = true; return me; };

const details = {
  junction: {
    title: 'Wall and floor junction, layer by layer', sub: 'Sheet, primer, bond breaker, fillet, two coats with bandage, adhesive, tile and the flexible joint. Layers are drawn much thicker than real so you can see them', floor: -0.3, gridSize: 3,
    camera: { pos: [1.5, 1.05, 1.9], target: [0, 0.3, 0.3] },
    build(kit) {
      const { box, rod } = kit, m = MAT(kit);
      const W = 1.0, FL = 0.8, WH = 0.8;
      const Lr = (mt, t0, t1) => grp(box(W, t1 - t0, FL, mt, 0, (t0 + t1) / 2, FL / 2), box(W, WH, t1 - t0, mt, 0, WH / 2, (t0 + t1) / 2));
      const frame = grp(box(W, WH + 0.1, 0.012, m.sheet, 0, (WH + 0.1) / 2 - 0.05, -0.006)); for (const x of [-0.45, 0, 0.45]) frame.add(box(0.045, WH + 0.1, 0.09, m.timber, x, (WH + 0.1) / 2 - 0.05, -0.057)); frame.add(box(W, 0.045, 0.09, m.timber, 0, -0.0225, -0.057));
      const floor = grp(box(W, 0.04, FL + 0.1, m.screed, 0, -0.02, (FL + 0.1) / 2 - 0.05), box(W, 0.12, FL + 0.1, m.conc, 0, -0.1, (FL + 0.1) / 2 - 0.05));
      const primer = Lr(m.primer, 0, 0.004);
      const tape = grp(box(W, 0.003, 0.034, m.tape, 0, 0.0055, 0.017), box(W, 0.034, 0.003, m.tape, 0, 0.017, 0.0055));
      const fillet = grp(wedge(0.04, W, m.seal, 0, 0, 0));
      const mem1 = Lr(m.c1, 0.004, 0.014); mem1.add(wedge(0.052, W, m.c1, 0, 0, 0));
      const fabric = grp(box(W, 0.004, 0.1, m.fab, 0, 0.016, 0.05), box(W, 0.1, 0.004, m.fab, 0, 0.05, 0.016));
      const mem2 = Lr(m.c2, 0.014, 0.024); mem2.add(wedge(0.058, W, m.c2, 0, 0, 0));
      const tiles = grp(box(W, 0.02, FL - 0.024, m.adh, 0, 0.034, 0.024 + (FL - 0.024) / 2), box(W, 0.03, FL - 0.024, m.tile, 0, 0.059, 0.024 + (FL - 0.024) / 2), box(W, WH - 0.074, 0.02, m.adh, 0, 0.074 + (WH - 0.074) / 2, 0.034), box(W, WH - 0.074, 0.03, m.tile, 0, 0.074 + (WH - 0.074) / 2, 0.059));
      const joint = grp(rod([-W / 2, 0.082, 0.082], [W / 2, 0.082, 0.082], 0.011, m.dark, 8));
      return { parts: [
        { id: 'frame', name: 'Wall frame and wet-area sheet', group: frame, explode: [0, 0, -0.5], anchor: [0.3, 0.6, -0.01], flag: 'V', src: 'nccHp102', spec: 'Deemed water-resistant wall materials include compressed fibre-cement to AS/NZS 2908.2 and water-resistant plasterboard. The sheet is fixed to the maker\'s rules.', desc: 'The sheet is the surface the membrane bonds to. It must be smooth, clean, dry and dust-free.' },
        { id: 'floor', name: 'Screed on the slab, laid to fall', group: floor, explode: [0, -0.35, 0], anchor: [0.2, -0.04, 0.6], flag: 'V', src: 'bpcWet', spec: 'The screed falls to the waste at between 1:80 and 1:50. The substrate is measured for moisture before the membrane goes on.', desc: 'The screed is what water runs across. Check the fall now, because tiles will hide it.' },
        { id: 'primer', name: 'Primer', group: primer, explode: [0, 0.07, 0.07], anchor: [0, 0.002, 0.5], flag: 'V', src: 'bpcWet', spec: 'Components must be compatible, including substrates, primers, sealants, membranes and overlays. The primer is the one named in the system data sheet.', desc: 'The primer seals the surface and helps the membrane stick. It must be dry before the next step.' },
        { id: 'tape', name: 'Bond breaker tape', group: tape, explode: [0, 0.17, 0.17], anchor: [-0.3, 0.012, 0.02], flag: 'V', src: 'nccHp102', spec: 'Bond breakers must be installed at all wall/wall, wall/floor and hob/wall junctions and at movement joints where the membrane is bonded. The type must suit the membrane\'s flexibility class.', desc: 'The tape stops the membrane sticking to the joint itself, so it can stretch across the gap when the building moves.' },
        { id: 'fillet', name: 'Sealant fillet', group: fillet, explode: [0, 0.27, 0.27], anchor: [0.3, 0.014, 0.014], flag: 'T', spec: 'A flexible, mould-resistant sealant that suits the membrane. Size and type come from the system data sheet.', desc: 'A fillet turns a sharp angle into a gentle curve that the membrane can follow without thinning at the corner.' },
        { id: 'mem1', name: 'Membrane, first coat', group: mem1, explode: [0, 0.37, 0.37], anchor: [-0.2, 0.01, 0.6], flag: 'V', src: 'bpcWet', spec: 'Apply in multiple thin coats. A single thick coat can trap air and cause pinholes. The membrane must comply with AS/NZS 4858.', desc: 'The first coat covers the floor, the walls and the junctions. It is left to dry before the bandage and the next coat.' },
        { id: 'fabric', name: 'Reinforcing bandage', group: fabric, explode: [0, 0.47, 0.47], anchor: [0.35, 0.016, 0.05], flag: 'T', spec: 'A fabric strip pressed into the wet coat across the angle and around penetrations. Width and type come from the system data sheet.', desc: 'The bandage stops the membrane tearing at the joint and at pipes.' },
        { id: 'mem2', name: 'Membrane, second coat', group: mem2, explode: [0, 0.57, 0.57], anchor: [0.4, 0.02, 0.5], flag: 'V', src: 'bpcWet', spec: 'The second thin coat covers the bandage and builds the thickness. The dry film thickness is checked against the data sheet and the whole membrane is inspected before any finish.', desc: 'Together the coats make one continuous skin that goes up the wall and across the floor.' },
        { id: 'tiles', name: 'Tile adhesive and tiles', group: tiles, explode: [0, 0.69, 0.69], anchor: [0.2, 0.06, 0.6], flag: 'T', spec: 'The adhesive and the tiles suit the membrane. Tiling is Step 14, and the tiler must not damage the membrane.', desc: 'The tiles are the finish. They are not the waterproofing, because grout and tile are not waterproof on their own.' },
        { id: 'joint', name: 'Flexible joint at the tile angle', group: joint, explode: [0, 0.83, 0.83], anchor: [-0.3, 0.082, 0.082], flag: 'V', src: 'nccHp102', spec: 'A flexible sealant joint, not grout, goes in the internal angle where tiles meet. Sealants must be flexible and compatible with adjacent materials.', desc: 'The joint lets the tiles move without cracking the grout and letting water in.' },
      ] };
    },
  },

  shower: {
    title: 'Shower area with a step-down and waterstop', sub: 'Walls with the membrane to 1800 mm, floor falling to the waste, step-down, waterstop, screen and rose (an enclosed step-down shower; sizes as the NCC pages read)', floor: -0.2, gridSize: 4,
    camera: { pos: [2.9, 1.9, 3.5], target: [0, 0.78, 0.2] },
    build(kit) {
      const { box, rod, cyl, ghost } = kit, m = MAT(kit);
      const walls = grp(box(1.3, 2.13, 0.012, m.sheet, 0, 1.035, -0.606), box(0.012, 2.13, 1.3, m.sheet, -0.606, 1.035, 0.05), box(0.012, 2.13, 1.3, m.sheet, 0.606, 1.035, 0.05));
      const skin = grp(box(1.2, 1.8, 0.004, m.c2, 0, 0.9 - 0.03, -0.596), box(0.004, 1.8, 1.2, m.c2, -0.596, 0.87, 0), box(0.004, 1.8, 1.2, m.c2, 0.596, 0.87, 0));
      const mark = grp(box(1.2, 0.012, 0.012, m.orange, 0, 1.77, -0.59), box(0.012, 0.012, 1.2, m.orange, -0.59, 1.77, 0), box(0.012, 0.012, 1.2, m.orange, 0.59, 1.77, 0));
      const floor = grp(box(1.8, 0.12, 0.7, m.conc, 0, -0.06, 0.95), box(1.2, 0.15, 1.2, m.conc, 0, -0.105, 0), box(1.2, 0.004, 1.2, m.c2, 0, -0.028, 0));
      const stepEdge = grp(box(1.2, 0.03, 0.006, m.c2, 0, -0.015, 0.603), box(1.2, 0.006, 0.05, m.c2, 0, 0.003, 0.65));
      const stop = grp(box(1.3, 0.012, 0.05, m.steel, 0, 0.006, 0.66), box(1.3, 0.04, 0.005, m.steel, 0, 0.022, 0.636));
      const screen = grp(box(1.2, 1.9, 0.01, ghost(0xbfe6ff, 0.35), 0, 0.97, 0.592), box(1.2, 0.03, 0.03, m.steel, 0, 1.93, 0.592));
      const waste = grp(cyl(0.1, 0.012, m.steel, 0.15, -0.02, 0.38, 24), cyl(0.07, 0.03, m.white, 0.15, -0.03, 0.38, 20));
      const falls = grp(); for (const [x, z] of [[-0.4, -0.2], [-0.45, 0.4], [0.5, -0.3], [0.45, 0.45]]) { const a = [x, -0.02, z], b = [x + (0.15 - x) * 0.5, -0.02, z + (0.38 - z) * 0.5]; falls.add(rod(a, b, 0.012, m.orange, 6), cyl(0.04, 0.07, m.orange, b[0], -0.02, b[2], 8, false, 0.001)); }
      falls.children.forEach((c, i) => { if (i % 2) { const d = new THREE.Vector3(0.15 - c.position.x, 0, 0.38 - c.position.z).normalize(); c.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d); } });
      const rose = grp(rod([0, 2.0, -0.6], [0, 2.0, -0.36], 0.011, m.brass, 8), cyl(0.09, 0.03, m.steel, 0, 1.98, -0.3, 20), rod([-0.08, 1.15, -0.6], [-0.08, 1.15, -0.5], 0.012, m.brass, 8), rod([0.08, 1.15, -0.6], [0.08, 1.15, -0.5], 0.012, m.brass, 8));
      return { parts: [
        { id: 'walls', name: 'Shower walls, membrane to 1800 mm', group: grp(walls, skin, mark), explode: [0, 0.3, -0.5], anchor: [0.3, 1.77, -0.59], flag: 'V', src: 'nccHp102', spec: 'The walls of the shower area must be waterproofed not less than 1800 mm above the floor substrate, and wall junctions and joints not less than 40 mm either side.', desc: 'The orange line marks 1800 mm. Water from the rose splashes high, so the wall sheet behind the tiles needs the membrane too.' },
        { id: 'floor', name: 'Shower floor and slab', group: floor, explode: [0, -0.45, 0], anchor: [-0.3, -0.03, 0.1], flag: 'V', src: 'nccHp102', spec: 'The floor of the shower area must be waterproof, including any hob or step-down.', desc: 'The membrane covers the whole shower floor and runs up the walls without a break.' },
        { id: 'step', name: 'Step-down edge and membrane', group: stepEdge, explode: [0, -0.05, 0.4], anchor: [-0.3, -0.015, 0.603], flag: 'V', src: 'nccHp102', spec: 'A step-down shower floor is stepped down at least 25 mm below the outside finished floor level. Hobs must be masonry, concrete, autoclaved aerated concrete or extruded polyurethane foam. Timber must not be used for a hob.', desc: 'The step-down keeps the water in. The membrane turns up the step and over to the outer floor.' },
        { id: 'stop', name: 'Waterstop angle', group: stop, explode: [0, 0.25, 0.55], anchor: [0.4, 0.02, 0.636], flag: 'V', src: 'nccHp102', spec: 'Enclosed hobless shower with a screen: the waterstop vertical leg is not less than 5 mm above finished floor level.', desc: 'The waterstop is a second line of defence. The membrane seals to it, so water cannot track across the doorway or the screen line.' },
        { id: 'screen', name: 'Shower screen', group: screen, explode: [0, 0.2, 0.9], anchor: [0.3, 1.2, 0.592], flag: 'V', src: 'nccHp102', spec: 'With a step-down, the shower screen is installed flush with the step-down\'s finished vertical surface. Without a hob or step-down it mounts on an inverted channel over the waterstop.', desc: 'The screen sits on the step, not on the waterstop. It is sealed along the bottom as the maker says.' },
        { id: 'waste', name: 'Floor waste in the shower', group: waste, explode: [0, -0.2, 0.15], anchor: [0.15, -0.02, 0.38], flag: 'V', src: 'bpcWet', spec: 'A floor waste is required in the shower area. The membrane finishes at or in the flange.', desc: 'Water that gets past the screen drains here. The flange is part of the waterproofing, not just the plumbing.' },
        { id: 'falls', name: 'Falls to the waste (arrows)', group: falls, explode: [0, 0.5, 0.2], anchor: [-0.4, -0.02, 0.0], flag: 'V', src: 'bpcWet', spec: 'The fall to the waste is between 1:80 and 1:50. The arrows show the direction of fall, and the real fall is far too gentle to see.', desc: 'A floor that falls the wrong way, or not at all, leaves ponding water on the membrane under the tiles.' },
        { id: 'rose', name: 'Shower arm, rose and mixer stubs', group: rose, explode: [0, 0.3, 0.6], anchor: [0, 2.0, -0.45], flag: 'T', spec: 'Each pipe through the sheet has a flange or sealant detail the membrane ties into. The 1500 mm radius for an unenclosed shower is measured from the rose connection.', desc: 'The plumber leaves these as capped stubs in Step 8 and fits the rose and mixer at fit-off.' },
      ] };
    },
  },

  waste: {
    title: 'Floor waste, flange and membrane', sub: 'Slab, drain, waste body and flange, screed to fall, membrane lapped into the flange, clamp ring, tiles and grate', floor: -0.35, gridSize: 3,
    camera: { pos: [1.3, 1.1, 1.6], target: [0, 0.0, 0] },
    build(kit) {
      const { box, rod, cyl } = kit, m = MAT(kit);
      const slab = plateHole(box, m.conc, 1.2, 1.2, 0.2, 0.2, 0.15, 0, -0.075, 0);
      const drain = grp(rod([0, -0.45, 0], [0, -0.1, 0], 0.05, m.sewer, 14), cyl(0.065, 0.06, m.sewer, 0, -0.14, 0, 16));
      const body = grp(cyl(0.08, 0.1, m.pvc, 0, -0.03, 0, 20), cyl(0.14, 0.014, m.steel, 0, 0.043, 0, 28));
      const screed = plateHole(box, m.screed, 1.2, 1.2, 0.28, 0.28, 0.04, 0, 0.02, 0);
      const mem = grp(plateHole(box, m.c2, 1.2, 1.2, 0.28, 0.28, 0.004, 0, 0.042, 0), flatRing(0.1, 0.15, m.c2, 0, 0.0525, 0));
      const clamp = grp(flatRing(0.075, 0.125, m.steel, 0, 0.066, 0)); for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2 + Math.PI / 4; clamp.add(cyl(0.008, 0.012, m.steel, Math.cos(a) * 0.1, 0.066, Math.sin(a) * 0.1, 8)); }
      const tiles = plateHole(box, m.tile, 1.2, 1.2, 0.26, 0.26, 0.035, 0, 0.078, 0), tbed = plateHole(box, m.adh, 1.2, 1.2, 0.26, 0.26, 0.02, 0, 0.056, 0);
      const grate = grp(cyl(0.12, 0.012, m.steel, 0, 0.088, 0, 28)); for (const [x, z] of [[0, 0], [0.05, 0], [-0.05, 0], [0, 0.05], [0, -0.05]]) grate.add(cyl(0.012, 0.014, m.dark, x, 0.089, z, 8));
      const arrows = grp(); for (const [x, z] of [[0.45, 0], [-0.45, 0], [0, 0.45], [0, -0.45]]) { const c = cyl(0.04, 0.09, m.orange, x, 0.075, z, 8, false, 0.001); c.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(-x, 0, -z).normalize()); arrows.add(c); }
      return { parts: [
        { id: 'slab', name: 'Slab with the waste pocket', group: slab, explode: [0, -0.2, 0], anchor: [0.45, -0.075, 0.45], flag: 'T', spec: 'The Step 2 slab has a pocket or riser where the sewer comes up. The plumber sets the waste to the finished level.', desc: 'The waste has to sit at the right height for the screed, membrane, adhesive and tile that go over it.' },
        { id: 'drain', name: 'Drain pipe to the sewer', group: drain, explode: [0, -0.5, 0], anchor: [0, -0.3, 0], flag: 'T', spec: 'The Step 2 riser, typically 100 mm, runs under the slab to the sewer. The drain was tested in Step 8.', desc: 'This is the pipe the plumber left capped in Step 8.' },
        { id: 'body', name: 'Waste body and flange', group: body, explode: [0, -0.1, 0.4], anchor: [0.14, 0.043, 0], flag: 'V', src: 'nccHp102', spec: 'A drainage flange must be installed with the waterproofing membrane terminated at or in the drainage flange. Floor wastes must suit the tile and tile bed thickness.', desc: 'The flange is the surface the membrane seals to. A waste with no flange cannot be waterproofed properly.' },
        { id: 'screed', name: 'Screed laid to fall', group: screed, explode: [0, 0.1, 0], anchor: [0.5, 0.04, -0.4], flag: 'V', src: 'bpcWet', spec: 'The screed falls to the waste at between 1:80 and 1:50. The slope is far too gentle to see in the model.', desc: 'The screed is laid up to the flange so that water runs to it from every side.' },
        { id: 'mem', name: 'Membrane lapped onto the flange', group: mem, explode: [0, 0.25, 0], anchor: [0.2, 0.046, 0.2], flag: 'V', src: 'nccHp102', spec: 'The membrane terminates at or in the flange. Coats are thin and the flange is primed if the maker says so.', desc: 'Water that gets under the tiles runs on the membrane and into the flange, not under it.' },
        { id: 'clamp', name: 'Clamp ring', group: clamp, explode: [0, 0.4, 0], anchor: [0.1, 0.066, 0.1], flag: 'T', spec: 'Some flange systems clamp the membrane between a ring and the flange. Follow the maker.', desc: 'The ring pinches the membrane edge so it cannot lift.' },
        { id: 'tiles', name: 'Tile bed and tiles', group: grp(tbed, tiles), explode: [0, 0.55, 0], anchor: [-0.5, 0.08, 0.4], flag: 'T', spec: 'Tiles are cut and laid to fall to the waste. The adhesive and bed suit the waste and the membrane.', desc: 'Tiles are laid after the flood test passes.' },
        { id: 'grate', name: 'Grate', group: grate, explode: [0, 0.75, 0], anchor: [0, 0.09, 0], flag: 'T', spec: 'The grate sits flush with the tile surface and lifts out for cleaning.', desc: 'It is fitted last.' },
        { id: 'arrows', name: 'Falls to the waste (arrows)', group: arrows, explode: [0, 0.95, 0], anchor: [0.45, 0.075, 0], flag: 'V', src: 'bpcWet', spec: 'The minimum fall to the waste is 1:80 and the maximum is 1:50.', desc: 'The arrows show water running to the waste from every side.' },
      ] };
    },
  },

  pen: {
    title: 'Tap and shower penetrations', sub: 'Frame and backing, sheet, tap stubs, flanges, sealant, membrane, tiles and a recessed niche (a section through the wall, tiles on the right)', floor: -0.4, gridSize: 3,
    camera: { pos: [1.9, 0.62, 0.8], target: [0, 0.44, 0.12] },
    build(kit) {
      const { box, rod, cyl } = kit, m = MAT(kit);
      const frame = grp(box(0.05, 0.9, 0.09, m.timber, -0.5, 0.45, -0.1), box(0.05, 0.9, 0.09, m.timber, 0.5, 0.45, -0.1), box(1.0, 0.1, 0.045, m.timber, 0, 0.45, -0.14), box(1.0, 0.045, 0.09, m.timber, 0, 0.0225, -0.1), box(1.0, 0.045, 0.09, m.timber, 0, 0.9, -0.1));
      const sheet = plateHole(box, m.sheet, 1.05, 0.95, 0.06, 0.06, 0.012, 0, 0.45, 0.006, false);
      const stubs = grp(rod([-0.08, 0.45, -0.12], [-0.08, 0.45, 0.05], 0.011, m.brass, 8), rod([0.08, 0.45, -0.12], [0.08, 0.45, 0.05], 0.011, m.brass, 8));
      const taps = grp(cyl(0.028, 0.05, m.steel, -0.08, 0.45, 0.075, 14), cyl(0.028, 0.05, m.steel, 0.08, 0.45, 0.075, 14), cyl(0.014, 0.045, m.steel, -0.08, 0.45, 0.115, 10), cyl(0.014, 0.045, m.steel, 0.08, 0.45, 0.115, 10));
      for (const c of taps.children) c.rotation.x = Math.PI / 2;
      const flanges = grp(); for (const x of [-0.08, 0.08]) { const f = cyl(0.04, 0.006, m.steel, x, 0.45, 0.012, 20); f.rotation.x = Math.PI / 2; flanges.add(f); }
      const seals = grp(); for (const x of [-0.08, 0.08]) { const t = new THREE.Mesh(new THREE.TorusGeometry(0.045, 0.006, 8, 24), m.seal); t.position.set(x, 0.45, 0.02); seals.add(t); }
      const mem = grp(plateHole(box, m.c2, 1.05, 0.95, 0.07, 0.07, 0.006, 0, 0.45, 0.022, false));
      const tiles = grp(plateHole(box, m.adh, 1.05, 0.95, 0.09, 0.09, 0.02, 0, 0.45, 0.04, false), plateHole(box, m.tile, 1.05, 0.95, 0.09, 0.09, 0.03, 0, 0.45, 0.065, false));
      const niche = grp(box(0.3, 0.02, 0.08, m.c2, 0.32, 0.26, 0.06), box(0.3, 0.02, 0.08, m.c2, 0.32, 0.5, 0.06), box(0.02, 0.26, 0.08, m.c2, 0.19, 0.38, 0.06), box(0.02, 0.26, 0.08, m.c2, 0.45, 0.38, 0.06), box(0.28, 0.24, 0.01, m.c2, 0.32, 0.38, 0.02));
      return { parts: [
        { id: 'frame', name: 'Frame and backing', group: frame, explode: [0, 0, -0.5], anchor: [-0.5, 0.88, -0.1], flag: 'T', spec: 'Studs and a solid timber backing behind each tap so the fixings and the flange have something to hold.', desc: 'The plumber fixes the stubs to the backing in Step 8. The sheet goes on over it.' },
        { id: 'sheet', name: 'Wet-area sheet with holes cut', group: sheet, explode: [0, 0, -0.2], anchor: [0, 0.92, 0.006], flag: 'V', src: 'nccHp102', spec: 'Mechanical fixings must be waterproofed. The holes are cut as small as the flange allows.', desc: 'The sheet is cut around each stub, not forced over it.' },
        { id: 'stubs', name: 'Hot and cold stubs', group: stubs, explode: [0, 0, -0.05], anchor: [0, 0.38, -0.1], flag: 'T', spec: 'Brass or copper stubs capped in Step 8, at the spacing the mixer needs.', desc: 'They stay capped until fit-off, so no water runs while the walls are lined.' },
        { id: 'flanges', name: 'Flanges', group: flanges, explode: [0, 0, 0.12], anchor: [-0.08, 0.52, 0.012], flag: 'V', src: 'nccHp102', spec: 'Tap and shower penetrations must be sealed with sealants, proprietary flange systems or a combination.', desc: 'The flange gives the membrane a flat ring to seal to.' },
        { id: 'seals', name: 'Sealant ring', group: seals, explode: [0, 0, 0.22], anchor: [0.08, 0.38, 0.02], flag: 'T', spec: 'A flexible sealant bead around the pipe and under the flange, compatible with the membrane.', desc: 'It stops water creeping along the pipe.' },
        { id: 'mem', name: 'Membrane sealed to the flange', group: mem, explode: [0, 0, 0.32], anchor: [0.4, 0.85, 0.022], flag: 'V', src: 'bpcWet', spec: 'Apply in thin coats and bandage around penetrations. The membrane laps onto the flange.', desc: 'The membrane and flange together make the seal.' },
        { id: 'niche', name: 'Recessed niche, waterproofed', group: niche, explode: [0, 0, 0.45], anchor: [0.32, 0.26, 0.06], flag: 'V', src: 'nccHp102', spec: 'Recessed soap holders (niches) must be waterproofed. The niche here is drawn lined with membrane.', desc: 'A niche cuts into the wall, so its sides and back need the membrane, with a fall out of the niche.' },
        { id: 'taps', name: 'Tap bodies, spindle housings (fit-off)', group: taps, explode: [0, 0, 0.58], anchor: [0.08, 0.52, 0.09], flag: 'V', src: 'nccHp102', spec: 'The spindle housing of the tap body must be able to be removed to replace the washer. Taps are fitted at fit-off, over the tiles.', desc: 'Taps go on last. A washer change later must not mean breaking tiles.' },
        { id: 'tiles', name: 'Adhesive and tiles with holes cut', group: tiles, explode: [0, 0, 0.72], anchor: [-0.4, 0.2, 0.065], flag: 'T', spec: 'Tiles are cut around each flange and the gaps are sealed with flexible sealant.', desc: 'The tiler cuts the holes. The tiler must not drill into the membrane.' },
      ] };
    },
  },

  door: {
    title: 'Doorway: waterstop and membrane', sub: 'Slab and screed, waterstop angle, membrane turned up and sealed to it, tile bed, tile and the floor finish in the next room', floor: -0.25, gridSize: 3,
    camera: { pos: [0.7, 0.7, 2.2], target: [0, 0.2, 0] },
    build(kit) {
      const { box, rod } = kit, m = MAT(kit);
      const slab = grp(box(2.0, 0.15, 0.9, m.conc, 0, -0.075, 0), box(2.0, 0.04, 0.9, m.screed, 0, 0.02, 0));
      const stop = grp(box(0.05, 0.004, 0.9, m.steel, -0.005, 0.042, 0), box(0.004, 0.03, 0.9, m.steel, -0.03, 0.055, 0));
      const mem = grp(box(0.97, 0.004, 0.9, m.c2, -0.515, 0.042, 0), box(0.004, 0.03, 0.9, m.c2, -0.0335, 0.057, 0), box(0.03, 0.004, 0.9, m.c2, -0.01, 0.0455, 0));
      const seal = grp(rod([-0.036, 0.044, -0.45], [-0.036, 0.044, 0.45], 0.007, m.seal, 8), rod([0.025, 0.045, -0.45], [0.025, 0.045, 0.45], 0.006, m.seal, 8));
      const tiles = grp(box(0.95, 0.015, 0.9, m.adh, -0.525, 0.0505, 0), box(0.95, 0.01, 0.9, m.tile, -0.525, 0.063, 0));
      const outside = grp(box(0.95, 0.025, 0.9, m.timber, 0.525, 0.0525, 0));
      const jamb = grp(box(0.045, 0.7, 0.9, m.timber, 0.03, 0.4, 0), box(0.05, 0.012, 0.9, m.steel, 0.01, 0.07, 0));
      return { parts: [
        { id: 'slab', name: 'Slab and screed', group: slab, explode: [0, -0.2, 0], anchor: [0.7, 0.02, 0.4], flag: 'V', src: 'bpcWet', spec: 'The screed falls to the waste at 1:80 to 1:50. The doorway is the high point of the wet area floor.', desc: 'The fall runs away from the door, so water stays in the room.' },
        { id: 'stop', name: 'Waterstop angle', group: stop, explode: [0, 0.1, 0], anchor: [-0.03, 0.06, 0.4], flag: 'V', src: 'bpcWet', spec: 'Where the whole wet area floor is waterproofed, install a waterstop with a vertical leg flush with finished floor level. Perimeter flashing vertical leg is at least 25 mm above finished floor level except across doorways, and the horizontal leg at least 50 mm wide.', desc: 'The angle is fixed to the slab before the membrane. The vertical leg stops water going over the threshold.' },
        { id: 'mem', name: 'Membrane turned up the waterstop', group: mem, explode: [0, 0.2, 0], anchor: [-0.5, 0.045, 0.4], flag: 'V', src: 'bpcWet', spec: 'Terminate the floor membrane to seal to both the waterstop and the flashing.', desc: 'The membrane runs up the face of the angle and over the top of its horizontal leg.' },
        { id: 'seal', name: 'Sealant at the angle', group: seal, explode: [0, 0.3, 0], anchor: [-0.036, 0.044, -0.4], flag: 'T', spec: 'A flexible sealant bead where the membrane meets the waterstop, compatible with the membrane. The type comes from the system data sheet.', desc: 'The sealant closes the small gap where two different materials meet.' },
        { id: 'tiles', name: 'Tile bed and tile', group: tiles, explode: [-0.3, 0.45, 0], anchor: [-0.5, 0.063, -0.3], flag: 'T', spec: 'The tile adhesive and tile stop flush with the top of the vertical leg. Step 14.', desc: 'Finished floor level is where the tile surface ends. The waterstop leg is flush with it.' },
        { id: 'outside', name: 'Floor finish in the next room', group: outside, explode: [0.3, 0.3, 0], anchor: [0.6, 0.065, 0.3], flag: 'T', spec: 'Timber, carpet or tile in the next room finishes at the same level, with a threshold strip over the joint.', desc: 'Whatever the next room has, nothing is fixed through the waterstop.' },
        { id: 'jamb', name: 'Door jamb and threshold strip', group: jamb, explode: [0.45, 0.6, 0], anchor: [0.03, 0.4, 0.3], flag: 'T', spec: 'The jamb and the strip sit beside the waterstop. The door and the strip are fixed without piercing the angle.', desc: 'Door hardware is fitted at Step 13.' },
      ] };
    },
  },
};

export default {
  n: 10, id: 'wetareas', title: 'Wet areas and waterproofing', subtitle: 'The bathroom lined and screeded to fall, junctions and penetrations detailed, the membrane applied in thin coats, inspected, flood tested and recorded.',
  phases, build, details, drawings, howto, trades, materials, quotes, quoteTips, inspections, exam, sources, caution,
};

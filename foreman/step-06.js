// Step 6: external walls. Brick veneer (110 mm clay brick, 40 mm cavity, ties, DPC, weepholes, steel lintels, flashings, articulation joints),
// plus the rules for timber and fibre-cement cladding. Sizes are typical. NCC clause figures were read from the ABCB's free web pages (NCC 2022
// Housing Provisions Parts 5.2, 5.6, 5.7 and 7.5) and a NSW Building Commission note; the Standards (AS 3700, AS 4773, AS 4100) are paywalled and
// were not opened. NCC 2025 applies in Victoria from 1 May 2026, so every clause number and figure needs checking against that edition.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import step5 from './step-05.js';
import { HOUSE, BASE_COLLIDERS, MAP } from './site.js';
import { svg, T, L, R, P, dim, call, arrow } from './dwg.js';
import { F, WALLS } from './frame.js';

const { x0: X0, x1: X1, z0: Z0, z1: Z1 } = HOUSE;
const BT = 0.11, PITCH = 0.086, Y0 = 0.153, NC = 31, KH = 25, YK = (k) => Y0 + k * PITCH; // brick leaf, course pitch (76 + 10 mm), first course height, courses, head course
const JOINTS = { front: [-4.7, -1.3, 2.6, 5.0], back: [-4.2, 0.4, 4.4], west: [-4.2, -1.2, 1.4, 4.6, 6.9, 10.2], east: [-4.2, -1.2, 1.7, 4.4, 6.9, 10.2] };

const phases = [
  { title: 'Wall wrap and brick delivery', text: 'The frame is wrapped, the cavity space is kept clear and the bricks, sand and cement are delivered and stacked where the bricklayer can reach them.' },
  { title: 'Damp-proof course and first course', text: 'A continuous damp-proof course goes on the slab edge, then the first course of bricks with weepholes left open in the joints just above it.' },
  { title: 'Brickwork up to the window sills', text: 'The bricklayer builds the veneer up in a running bond, fixing a tie into every other course and keeping the cavity clear of mortar.' },
  { title: 'Lintels, flashings and the walls to the eaves', text: 'Steel lintels carry the bricks over each opening, flashings turn water out of the cavity and the brickwork runs up to the eave.' },
  { title: 'Articulation joints and weepholes', text: 'Vertical movement joints are cut or left in the brickwork and sealed, and the weepholes above the flashings are checked open.' },
  { title: 'Brickwork and flashing check', text: 'Ties, damp-proof course, weepholes, lintels and flashings are checked and photographed before the windows and the lining cover them.' },
];

/* ---------- brick and wall layout shared by the walk scene ---------- */
const EXT = WALLS.filter((w) => w.ext).map((w) => {
  const ew = w.id === 'front' || w.id === 'back', out = (w.id === 'front' || w.id === 'east') ? 1 : -1;
  const fixed = ew ? (out > 0 ? Z1 : Z0) : (out > 0 ? X1 : X0), u0 = ew ? X0 : Z0 + BT, u1 = ew ? X1 : Z1 - BT;
  const opens = w.open.map((o) => ({ a: o.at - o.w / 2, b: o.at + o.w / 2, w: o.w, at: o.at, sill: o.sill, kS: o.sill === 0 ? 0 : Math.round((F.SLAB + o.sill - Y0) / PITCH) })).sort((p, q) => p.a - q.a);
  return { id: w.id, ew, out, fixed, u0, u1, opens };
});
// box in world metres for wall W: u along the wall, d inward from the outer brick face
const cell = (W, u0, u1, y0, y1, d0, d1) => {
  const p = W.fixed - W.out * d0, q = W.fixed - W.out * d1, lo = Math.min(p, q), hi = Math.max(p, q);
  return W.ew ? { x0: u0, x1: u1, y0, y1, z0: lo, z1: hi } : { x0: lo, x1: hi, y0, y1, z0: u0, z1: u1 };
};
const freeSpans = (W, k, doorsOnly = false) => {
  const out = []; let cur = W.u0;
  for (const o of W.opens) { if (doorsOnly ? o.sill === 0 : (k >= o.kS && k < KH)) { if (o.a > cur) out.push([cur, o.a]); cur = Math.max(cur, o.b); } }
  if (W.u1 > cur) out.push([cur, W.u1]); return out;
};
const worldUV = (g) => {
  const p = g.attributes.position, n = g.attributes.normal, uv = g.attributes.uv;
  for (let i = 0; i < p.count; i++) {
    const ax = Math.abs(n.getX(i)), az = Math.abs(n.getZ(i));
    if (ax > 0.5) uv.setXY(i, p.getZ(i), p.getY(i) - Y0); else if (az > 0.5) uv.setXY(i, p.getX(i), p.getY(i) - Y0); else uv.setXY(i, p.getX(i), p.getZ(i));
  }
  uv.needsUpdate = true;
};
const mergeCells = (list, m, uv = true) => {
  if (!list.length) return null;
  const gs = list.map((c) => { const g = new THREE.BoxGeometry(c.x1 - c.x0, c.y1 - c.y0, c.z1 - c.z0); g.translate((c.x0 + c.x1) / 2, (c.y0 + c.y1) / 2, (c.z0 + c.z1) / 2); if (uv) worldUV(g); return g; });
  const me = new THREE.Mesh(mergeGeometries(gs, false), m); gs.forEach((g) => g.dispose()); me.castShadow = true; me.receiveShadow = true; return me;
};
// weephole positions across a span: first at 0.3 m in, then every 1.2 m at most
const weepAt = (a, b) => { const n = Math.max(1, Math.ceil((b - a - 0.4) / 1.2)), out = []; for (let i = 0; i < n; i++) out.push(n === 1 ? (a + b) / 2 : a + 0.3 + (i * (b - a - 0.6)) / (n - 1)); return out; };

function build(kit, opts = {}) {
  const { C, mat, box, cyl, textPlane } = kit;
  const mk = (n) => { const g = new THREE.Group(); g.name = n; return g; };
  const s5 = step5.build(kit);
  // keep the finished site, frame and roof from Stage 5, minus its scaffold and check sign
  const layers = s5.layers.filter((l) => !['scaffold', 'check'].includes(l.group.name)).map(({ group }) => ({ group }));

  const brickM = mat(0xffffff, { tex: 'brick' }), darkM = mat(0x16181b, { roughness: 0.6 }), steelM = mat(0x4b5560, { metalness: 0.5, roughness: 0.5 }), jointM = mat(0x2b2e33);
  const foil = mat(0xb4bcc6, { metalness: 0.2, roughness: 0.5, side: THREE.DoubleSide });

  // wall wrap on the frame (below the bricks): panels around each opening, 26 mm clear of the brick back
  const wrap = mk('wrap'), wl = [];
  for (const W of EXT) {
    let cur = W.u0;
    const panel = (a, b, y0, y1) => { if (b - a > 0.01 && y1 - y0 > 0.01) wl.push(cell(W, a, b, y0, y1, 0.136, 0.138)); };
    for (const o of W.opens) { panel(cur, o.a, 0.15, 2.85); panel(o.a, o.b, 0.15, F.SLAB + o.sill > 0.2 ? F.SLAB + o.sill : 0.15); panel(o.a, o.b, F.SLAB + F.HEAD, 2.85); cur = o.b; }
    panel(cur, W.u1, 0.15, 2.85);
  }
  wrap.add(mergeCells(wl, foil, false));

  // brick courses, one merged mesh per course so the bricklayer can build them up
  const bricks = mk('bricks'), courses = [];
  for (let k = 0; k < NC; k++) {
    const list = []; for (const W of EXT) for (const [a, b] of freeSpans(W, k)) list.push(cell(W, a, b, YK(k), YK(k + 1), 0, BT));
    const m = mergeCells(list, brickM); m.visible = false; courses.push(m); bricks.add(m);
  }
  // damp-proof course, continuous round the slab edge except at doorways, and showing at the face
  const dpc = mk('dpc'), dl = [];
  for (const W of EXT) { let cur = W.u0; for (const o of W.opens) if (o.sill === 0) { if (o.a > cur) dl.push(cell(W, cur, o.a, 0.15, 0.153, -0.015, 0.15)); cur = o.b; } if (W.u1 > cur) dl.push(cell(W, cur, W.u1, 0.15, 0.153, -0.015, 0.15)); }
  dpc.add(mergeCells(dl, darkM, false));
  // weepholes: first course (above the DPC) and the course above each head flashing
  const weepB = mk('weepB'), weepH = mk('weepH'), wb = [], wh = [];
  for (const W of EXT) {
    for (const [a, b] of freeSpans(W, 0)) for (const u of weepAt(a, b)) wb.push(cell(W, u - 0.006, u + 0.006, YK(0) + 0.012, YK(0) + 0.062, -0.003, 0.03));
    for (const o of W.opens) for (const u of weepAt(o.a, o.b)) wh.push(cell(W, u - 0.006, u + 0.006, YK(KH) + 0.012, YK(KH) + 0.062, -0.003, 0.03));
  }
  weepB.add(mergeCells(wb, darkM, false)); weepH.add(mergeCells(wh, darkM, false));
  // steel lintels over every opening, with bearing each end, and sloping sill bricks under the windows
  const lintels = mk('lintels'), ll = [], sills = mk('sills'), sl = [];
  for (const W of EXT) for (const o of W.opens) {
    const bear = o.w > 1 ? 0.15 : 0.1;
    ll.push(cell(W, o.a - bear, o.b + bear, YK(KH) - 0.008, YK(KH), 0, 0.09));
    if (o.sill > 0) sl.push(cell(W, o.a - 0.06, o.b + 0.06, YK(o.kS) - 0.05, YK(o.kS) + 0.004, -0.02, 0.11));
  }
  lintels.add(mergeCells(ll, steelM, false)); sills.add(mergeCells(sl, brickM));
  // articulation joints: sealed vertical strips
  const joints = mk('joints'), jl = [];
  for (const W of EXT) for (const u of JOINTS[W.id]) jl.push(cell(W, u - 0.006, u + 0.006, Y0, YK(NC), -0.003, 0.004));
  joints.add(mergeCells(jl, jointM, false));

  // stock on site: two pallets of bricks and a heap of sand
  const stock = mk('stock'), plank = mat(0xffffff, { tex: 'timber' }), sand = mat(C.sand);
  for (const [x, z, r] of [[-3.3, 14.2, 0.1], [-1.9, 14.4, -0.08]]) {
    const p = mk('pallet'); p.add(box(1.2, 0.12, 1.1, plank, 0, 0.06, 0), box(1.1, 0.7, 1.0, brickM, 0, 0.47, 0)); p.position.set(x, 0, z); p.rotation.y = r; stock.add(p);
  }
  stock.add(cyl(0.95, 0.75, sand, -5.0, 0.37, 14.0, 18, false, 0.06));

  const check = mk('check'), sign = textPlane(['CHECK POINT: WALLS', 'Ties, DPC, weeps and joints checked', 'Photograph the cavity before it closes'], 1.9, 0.9);
  sign.position.set(0, 1.5, Z1 + 1.3); check.add(sign, cyl(0.04, 1.6, mat(C.steel), -0.85, 0.8, Z1 + 1.28, 8), cyl(0.04, 1.6, mat(C.steel), 0.85, 0.8, Z1 + 1.28, 8));

  // markers tell the bricklayer ticker which phase is showing
  const m2 = mk('m2'), m3 = mk('m3'); let shown = opts.done ? NC : 0; // done: a later stage reuses the finished walls without the bricklayer animation
  const tickers = [...s5.tickers, (dt) => {
    if (!bricks.visible) { shown = opts.done ? NC : 0; courses.forEach((c) => { c.visible = !!opts.done; }); return; }
    const goal = m3.visible ? NC : m2.visible ? 11 : 1;
    shown = shown > goal ? goal : Math.min(goal, shown + dt * 7);
    courses.forEach((c, i) => { c.visible = i < Math.floor(shown + 1e-6); });
  }];

  layers.push({ group: wrap }, { group: stock, until: 4 }, { group: dpc, from: 1 }, { group: bricks, from: 1 }, { group: weepB, from: 1 }, { group: sills, from: 2 },
    { group: lintels, from: 3 }, { group: weepH, from: 3 }, { group: joints, from: 4 }, { group: check, from: 5 }, { group: m2, from: 2 }, { group: m3, from: 3 });

  return {
    layers, colliders: [...BASE_COLLIDERS, { x0: X0, x1: X1, z0: Z0, z1: Z1 }], tickers,
    spawn: { pos: [4, 18.5], yaw: 0, pitch: 0.2 }, map: MAP,
    orbit: { pos: [17, 11, 26], target: [0, 1.8, 4] },
    hotspots: [
      { id: 'wrap', title: 'Wall wrap on the frame', pos: [-2.2, 1.7, Z1 - 0.14], stand: [-2.2, 15.5], from: 0, until: 3, detail: 'veneer', drawing: 'wallsec',
        summary: 'A sheet of wall wrap (sarking) goes over the frame before any brick, so water that gets behind the brick runs down it and out through the weepholes instead of reaching the timber.',
        learn: [['In masonry veneer the clear cavity must stay at least 25 mm wide whatever sits on the frame: wall wrap, sheet bracing or services.', 'V', 'nccMas57'], ['Vapour-permeable sarking to AS 4200.1 is required behind vertical or diagonal profiled timber boards, and behind all cladding where parapets are used. Part 7.5 has no general underlay rule for every cladding.', 'V', 'nccClad75'], ['Whether the wrap should be reflective foil or vapour permeable depends on the climate zone and the NCC condensation rules. Confirm for your edition and the surveyor\'s documents.', 'C'], ['Check the frame is complete, braced and inspected, and the cavity space is clear, before the first brick goes on.', 'T']] },
      { id: 'stock', title: 'Bricks, mortar and sand', pos: [-2.6, 1.3, 14.3], stand: [-2.6, 18.2], from: 0, until: 4,
        summary: 'Bricks come on pallets and are stacked within reach of the bricklayer. Mortar is mixed from cement, lime and sand in set proportions or bought pre-mixed.',
        learn: [['A standard modular clay brick is 230 x 110 x 76 mm laid with 10 mm joints, which gives the 240 mm length and 86 mm course height this model uses.', 'T'], ['Mortar must comply with AS 3700 or AS 4773, except it may be mixed by volume in the proportions the NCC table gives. Mixes need a methyl cellulose water thickener.', 'V', 'nccMas56'], ['Order all the bricks in one batch where you can. Colour changes between firings, and a later batch may not match.', 'T'], ['Stack pallets on firm, level ground away from trenches, and keep cement dry.', 'T']] },
      { id: 'dpc', title: 'Damp-proof course', pos: [-1.0, 0.27, Z1], stand: [-1.0, 15.2], from: 1, detail: 'veneer', drawing: 'wallsec',
        summary: 'The damp-proof course (DPC) is a plastic or coated-metal strip laid on the slab edge under the first course. It stops ground moisture rising into the brick and the frame.',
        learn: [['A DPC must form a continuous barrier round the bottom perimeter of walls on a concrete slab, and run through the full thickness of the wall so it can be seen from the outside face.', 'V', 'nccMas57'], ['Typical DPC materials are embossed black polyethylene film (0.5 mm nominal, AS/NZS 2904 clause 7.6), polyethylene-coated metal with an aluminium core, bitumen-impregnated material at least 2.5 mm thick, or a continuous termite sheet with no penetrations.', 'V', 'nccMas57'], ['The outer brick leaf must not overhang the slab edge by more than 15 mm.', 'V', 'nccMas57'], ['The NSW Building Commission says the DPC must still be visible after render or paint, and that a flashing acting as a DPC should be at least 20 mm wider than the masonry.', 'V', 'nswDpc'], ['How high the DPC sits above finished ground depends on how the ground is finished and protected. The NSW note says generally 150 mm. Check the height for your site in your NCC edition.', 'C', 'nswDpc']] },
      { id: 'weeps', title: 'Weepholes', pos: [-5.5, 0.34, 5.8], stand: [-6.4, 5.8], from: 1, detail: 'veneer', drawing: 'wallsec',
        summary: 'A weephole is an open vertical joint that lets water in the cavity run out. They sit in the course just above every flashing, so the water has a way out and the wall can breathe.',
        learn: [['Weepholes go in the course immediately above any flashing, including a DPC that acts as flashing. Minimum size is 50 mm high by the width of the vertical joint, at no more than 1.2 m centres.', 'V', 'nccMas57'], ['On a slab-on-ground the cavity must drain to the outside, as 5.7.5 sets out.', 'V', 'nccMas57'], ['The cavity must be at least 25 mm wide and free of obstructions. A mortar dropping at the base blocks the weepholes, so keep the cavity clean as the wall goes up.', 'V', 'nswDpc'], ['Plastic weep vents in the joint keep insects out. Do not let the render or paint close them.', 'T']] },
      { id: 'cavity', title: 'Cavity and wall ties', pos: [X1, 1.8, 5.8], stand: [6.5, 5.8], from: 2, detail: 'veneer', drawing: 'wallsec',
        summary: 'The brick leaf stands free of the frame with a cavity between. Metal ties across the cavity stop the brick falling away from the frame, and the cavity keeps water away from the timber.',
        learn: [['Masonry veneer needs a clear cavity of at least 25 mm and no more than 75 mm between the brick and the frame. This model uses a typical 40 mm cavity.', 'V', 'nccMas57'], ['Ties are embedded at least 50 mm into each leaf, sit in adjacent courses or at the same course either side of a stud, and must stop moisture running along the tie to the frame. Tie spacing is in the NCC figures, which were not read here.', 'V', 'nccMas56'], ['Tie metal depends on where the house is. Under 1 km from breaking surf: stainless 316L or engineered polymer. 1 to 10 km from surf: heavier galvanising or stainless 304L. Elsewhere: standard galvanising (Table 5.6.5d).', 'V', 'nccMas56'], ['Masonry veneer may be no taller than 8.5 m above adjacent finished ground, and Part 5.2 is subject to the limits in H1D5(1)(c).', 'V', 'nccMas52']] },
      { id: 'sill', title: 'Sill brick and sill flashing', pos: [3.9, 1.04, Z1 + 0.03], stand: [3.9, 17.5], from: 2, detail: 'sill', drawing: 'headsill',
        summary: 'Under each window the veneer stops at a sloping sill brick, and a flashing tray below it carries any water that runs down the window out to the weepholes.',
        learn: [['Sill and head flashings extend at least 150 mm past the reveals each side, and sit no more than one course below the sill brick course.', 'V', 'nccMas57'], ['The window goes in at Step 7. Sill flashing must sit smooth and not sag into the cavity, and have weepholes at no more than 1 200 mm centres (manufacturer guide, edition not stated).', 'C', 'bradFlash'], ['A sloping sill brick, with a drip or an overhang, throws water clear of the wall below.', 'T']] },
      { id: 'lintel', title: 'Steel lintel and head flashing', pos: [-3.4, 2.36, Z1 + 0.03], stand: [-3.4, 16.2], from: 3, detail: 'lintel', drawing: 'headsill',
        summary: 'A steel angle carries the brickwork over every window and door, and a flashing laid over it turns water that runs down the cavity out through the weepholes above the lintel.',
        learn: [['Openings in masonry veneer need steel lintels, except openings up to and including 500 mm wide that are adequately supported.', 'V', 'nccMas52'], ['Lintel steel is at least 300 MPa (AS 4100) with the long leg of an angle vertical. Masonry may not overhang the horizontal leg by more than 25 mm. There must be at least three courses over the opening and no more than 3 m of masonry above it.', 'V', 'nccMas56'], ['Bearing at each end is at least 100 mm for clear spans up to 1 m and at least 150 mm over 1 m. Lintels are hot-dip galvanised (300 or 600 g/m² by durability class) or stainless 316L.', 'V', 'nccMas56'], ['Head flashing extends at least 150 mm past the opening each side, sits no more than 300 mm above the opening and turns up at least 150 mm in the cavity. No head flashing is needed where an eave wider than three times the height of veneer above the opening protects it.', 'V', 'nccMas57'], ['A common defect (NSW note): the lintel bears 100 mm but the flashing must run at least 150 mm past the opening, so a flashing cut to the lintel ends short and drains water back into the cavity. Turn the end out or lengthen it.', 'V', 'nswDpc']] },
      { id: 'joint', title: 'Articulation joints', pos: [X1, 1.55, 1.7], stand: [6.5, 1.7], from: 4, detail: 'joint', drawing: 'elev',
        summary: 'A brick wall grows and shrinks a little with moisture and temperature, and the slab can move. Vertical articulation joints, filled with flexible sealant, let the wall move without cracking.',
        learn: [['Vertical joints are required except on sites with soil class A or S. They are at least 10 mm wide and filled with flexible sealant held in place while it sets. The NCC figures were read through a text summary, so confirm them.', 'C', 'nccMas56'], ['Typical spacing from the NCC figures: no more than 6 m on a straight wall with small or no openings and no more than 5 m with larger openings, with a joint within 1.2 m of those openings. Near corners they sit within 4.5 m but not closer than 470 mm.', 'C', 'nccMas56'], ['Joints are also needed where the wall height changes by more than 20%, where wall thickness changes, at control or construction joints in the slab, and where different masonry meets.', 'C', 'nccMas56'], ['The soil class from the geotechnical report (Step 2) decides whether joints are required. Do not put one next to an arched opening.', 'C', 'nccMas56']] },
      { id: 'clad', title: 'Cladding and render', pos: [0.8, 1.7, Z0 - 0.02], stand: [0.8, -10], from: 1, detail: 'cladding', drawing: 'elev',
        summary: 'Not every wall is brick. Timber and fibre-cement cladding go straight on the wrapped frame, with their own rules for laps, fixings, flashings and clearance from the ground.',
        learn: [['Part 7.5 covers timber and composite cladding: weatherboards, profiled boards, fibre-cement boards and sheets, hardboard and plywood. Masonry and masonry veneer are outside it.', 'V', 'nccClad75'], ['Bottom of the cladding to finished ground: 100 mm in low rainfall or sandy well-drained areas, 50 mm above paved areas that slope away, 150 mm in all other cases. Cladding also extends at least 50 mm below the bearer of a suspended floor.', 'V', 'nccClad75'], ['Flash the bottom, top and sides of openings: at least 110 mm past each reveal where practicable, joins lapped 75 mm and sealed, flashing fixed at least 25 mm under the cladding and draining to the outside face.', 'V', 'nccClad75'], ['Minimum laps: splayed weatherboards 30 mm (hardwood, cypress, treated pine), 20 mm (Western Red Cedar), 25 mm (Baltic pine). Fibre-cement boards, at least 7.5 mm thick, lap at least 25 mm.', 'V', 'nccClad75'], ['Render over masonry or sheet is a system, so follow the render maker\'s details and keep the DPC visible. Confirm with the maker and the surveyor.', 'C']] },
      { id: 'check', title: 'Brickwork and flashing check', pos: [0, 1.5, Z1 + 1.3], stand: [0, 17], from: 5,
        summary: 'Once the brick goes up the cavity is closed for good. Before the windows and the lining cover the details, check each one and photograph it.',
        learn: [['Check the DPC is continuous and visible, weepholes are open, the cavity is clear, ties are fixed at the spacing shown, lintels bear correctly, flashings are turned out and joints are sealed.', 'T'], ['Ask your building surveyor whether they want to see the brickwork, flashings and ties before they are covered, and in what stage. Confirm with the RBS.', 'C'], ['Keep the brick supplier\'s data, the lintel and tie specifications and the photographs in the job file.', 'T']] },
    ],
  };
}

/* ---------- 3D detail models: wall runs along z, the outside is +x, the brick leaf sits at x from -0.11 to 0, y = 0 at the stated level ---------- */
const grp = (...kids) => { const g = new THREE.Group(); if (kids.length) g.add(...kids); return g; };
const BRICKS = [0xb0583f, 0xa24e37, 0xb86a4d, 0x9c4a35, 0xbd6f52, 0xa85a42];
function bricksIn(kit, z0, z1, yBase, k0, k1, { gaps = [] } = {}) {
  const { mat, box } = kit, ms = BRICKS.map((c) => mat(c, { roughness: 0.95 })), g = grp();
  for (let k = k0; k < k1; k++) {
    const y = yBase + k * PITCH + 0.038, off = (k & 1) ? 0.12 : 0;
    for (let i = Math.floor((z0 - off) / 0.24) - 1; i <= Math.ceil((z1 - off) / 0.24) + 1; i++) {
      let a = Math.max(z0, i * 0.24 + off), b = Math.min(z1, i * 0.24 + off + 0.23);
      for (const [p, q] of gaps) { if (a < q && b > p) { if (a < p && b > q) continue; if (a < p) b = Math.min(b, p); else if (b > q) a = Math.max(a, q); else { a = b; } } }
      if (b - a > 0.02) g.add(box(0.11, 0.076, b - a, ms[Math.abs(i * 7 + k * 3) % ms.length], -0.055, y, (a + b) / 2));
    }
  }
  return g;
}
const mortarBlock = (kit, z0, z1, y0, y1) => kit.box(0.1, y1 - y0, z1 - z0, kit.mat(0xcfc8b8), -0.055, (y0 + y1) / 2, (z0 + z1) / 2);
const tieAt = (kit, y, z) => { const { mat, rod } = kit, m = mat(0xb8c0c9, { metalness: 0.6, roughness: 0.35 }); return grp(rod([-0.2, y, z], [-0.06, y, z], 0.007, m, 6), rod([-0.2, y, z - 0.03], [-0.2, y, z + 0.03], 0.007, m, 6)); };
const weepVent = (kit, y, z) => kit.box(0.012, 0.05, 0.06, kit.mat(0x1b1d20), -0.05, y, z);

const details = {
  veneer: {
    title: 'Brick veneer at the base', sub: 'Slab edge, DPC, frame, wrap, cavity, ties, first courses and a weephole', floor: -0.15, gridSize: 3,
    camera: { pos: [1.1, 0.6, 1.55], target: [-0.1, 0.22, 0] },
    build(kit) {
      const { mat, box, ghost } = kit, timber = mat(0xffffff, { tex: 'timber' }), conc = mat(0xffffff, { tex: 'concrete' }), foil = mat(0xb4bcc6, { metalness: 0.2, roughness: 0.5, side: THREE.DoubleSide });
      const slab = grp(box(0.55, 0.15, 1.1, conc, -0.275, -0.075, 0));
      const dpc = grp(box(0.17, 0.004, 1.1, mat(0x16181b), -0.075, 0.002, 0));
      const frame = grp(box(0.09, 0.045, 1.1, timber, -0.195, 0.0265, 0), box(0.09, 0.62, 0.045, timber, -0.195, 0.35, -0.225), box(0.09, 0.62, 0.045, timber, -0.195, 0.35, 0.225), box(0.09, 0.045, 0.4, timber, -0.195, 0.4, 0));
      const ply = grp(box(0.012, 0.5, 1.1, mat(0xffffff, { tex: 'timber', color: 0xe8c690 }), -0.144, 0.325, 0));
      const wrap = grp(box(0.002, 0.5, 1.1, foil, -0.137, 0.325, 0));
      const ties = grp(); for (const y of [0.266, 0.52]) for (const z of [-0.225, 0.225]) ties.add(tieAt(kit, y, z));
      const bricks = bricksIn(kit, -0.5, 0.5, 0.013, 0, 6, { gaps: [[-0.01, 0]] });
      const mortar = grp(mortarBlock(kit, -0.5, 0.5, 0.004, 0.53));
      const weep = grp(weepVent(kit, 0.051, -0.005));
      const cavity = grp(box(0.026, 0.55, 1.0, ghost(0x58a6ff, 0.3), -0.123, 0.28, 0));
      return { parts: [
        { id: 'slab', name: 'Slab edge', group: slab, explode: [-0.25, 0, 0], anchor: [-0.3, -0.05, 0.55], flag: 'T', spec: 'Slab 150 mm above finished ground at the edge in this model. The engineer\'s rebate detail governs.', desc: 'The brick leaf is carried by the slab edge, so the slab and the brick must be set out together. The brick must not overhang the edge by more than 15 mm.' },
        { id: 'dpc', name: 'Damp-proof course', group: dpc, explode: [0, 0.1, 0], anchor: [0.0, 0.01, 0.4], flag: 'V', src: 'nccMas57', spec: 'Embossed polyethylene, 0.5 mm nominal, or one of the other materials the NCC lists. Continuous and visible at the face.', desc: 'It stops ground moisture rising through the brick and the frame. It runs right through the wall and shows at the outside face, even after render or paint.' },
        { id: 'frame', name: 'Bottom plate and studs', group: frame, explode: [-0.55, 0, 0], anchor: [-0.195, 0.2, 0.225], flag: 'T', spec: 'Typically 90 x 45 pine at 450 mm centres.', desc: 'The timber frame is kept clear of the brick by the cavity, so a damp brick cannot pass water to the timber.' },
        { id: 'ply', name: 'Sheet bracing (where used)', group: ply, explode: [-0.33, 0.14, 0], anchor: [-0.144, 0.5, -0.45], flag: 'V', src: 'nccMas57', spec: 'Plywood about 12 mm thick, fixed to the frame outside face where the engineer has braced the wall.', desc: 'The clear cavity must stay at least 25 mm even with sheet bracing and wrap on the frame, so the cavity is made wide enough for them.' },
        { id: 'wrap', name: 'Wall wrap', group: wrap, explode: [-0.16, 0.26, 0], anchor: [-0.137, 0.5, 0.45], flag: 'C', spec: 'Foil or vapour-permeable sheet, lapped as the maker shows. Check the type for the climate zone.', desc: 'The wrap sheds water that gets into the cavity. It is lapped shingle-fashion, with the top sheet outside the one below.' },
        { id: 'ties', name: 'Wall ties', group: ties, explode: [0.0, 0.18, 0], anchor: [-0.13, 0.52, 0.225], flag: 'V', src: 'nccMas56', spec: 'Galvanised or stainless, embedded at least 50 mm in each leaf. Spacing is in the NCC figures.', desc: 'They hold the brick leaf to the frame. The metal depends on how close the house is to the sea. A tie must not let water run along it to the frame.' },
        { id: 'cavity', name: 'Cavity', group: cavity, explode: [0.12, 0, 0], anchor: [-0.123, 0.5, -0.1], flag: 'V', src: 'nccMas57', spec: 'Typically 40 mm. The clear width must be at least 25 mm and no more than 75 mm for veneer.', desc: 'The air gap lets water run down and out through the weepholes. Mortar droppings at the base would block them, so the bricklayer keeps it clean.' },
        { id: 'bricks', name: 'Brick courses', group: grp(bricks, mortar), explode: [0.55, 0, 0], anchor: [0.0, 0.34, -0.38], flag: 'T', spec: 'Modular clay brick 230 x 110 x 76 mm, 10 mm joints, running bond.', desc: 'Each course is offset by half a brick from the one below so the vertical joints do not line up. The bed joint is the layer of mortar the next course sits on.' },
        { id: 'weep', name: 'Weephole in the first course', group: weep, explode: [0.8, 0.12, 0], anchor: [0.0, 0.052, -0.005], flag: 'V', src: 'nccMas57', spec: 'An open vertical joint at least 50 mm high, at no more than 1.2 m centres, in the course above the DPC.', desc: 'Water in the cavity runs down to the DPC and out here. A plastic vent keeps insects out.' },
      ] };
    },
  },

  lintel: {
    title: 'Window head: lintel and flashing', sub: 'Frame lintel, wrap, steel angle, head flashing, bricks above and weepholes', floor: -0.5, gridSize: 3,
    camera: { pos: [1.35, 0.55, 1.75], target: [-0.05, 0.12, 0] },
    build(kit) {
      const { mat, box, ghost } = kit, timber = mat(0xffffff, { tex: 'timber' }), steel = mat(0x4b5560, { metalness: 0.5, roughness: 0.5 }), foil = mat(0xb4bcc6, { metalness: 0.2, roughness: 0.5, side: THREE.DoubleSide }), flashM = mat(0xdfe3e8, { metalness: 0.3, roughness: 0.4 });
      const frame = grp(box(0.09, 0.19, 1.3, timber, -0.195, 0.095, 0), box(0.09, 0.6, 0.045, timber, -0.195, -0.3, -0.5), box(0.09, 0.6, 0.045, timber, -0.195, -0.3, 0.5), box(0.09, 0.3, 0.045, timber, -0.195, 0.34, 0.22));
      const wrap = grp(box(0.002, 0.62, 1.3, foil, -0.137, 0.31, 0));
      const angle = grp(box(0.09, 0.008, 1.1, steel, -0.065, -0.004, 0), box(0.008, 0.09, 1.1, steel, -0.114, 0.045, 0));
      const flash = grp(box(0.15, 0.003, 1.3, flashM, -0.075, 0.0055, 0), box(0.003, 0.16, 1.3, flashM, -0.1485, 0.08, 0));
      const above = bricksIn(kit, -0.7, 0.7, 0.013, 0, 3), beside = bricksIn(kit, -0.7, 0.7, 0.0, -6, 0, { gaps: [[-0.46, 0.46]] });
      const mort = grp(mortarBlock(kit, -0.7, 0.7, 0.004, 0.27), mortarBlock(kit, -0.7, -0.46, -0.52, 0), mortarBlock(kit, 0.46, 0.7, -0.52, 0));
      const weeps = grp(weepVent(kit, 0.04, -0.23), weepVent(kit, 0.04, 0.23));
      const ties = grp(tieAt(kit, 0.2, -0.22), tieAt(kit, 0.2, 0.22), tieAt(kit, -0.12, 0.55));
      return { parts: [
        { id: 'frame', name: 'Frame lintel and trimmers', group: frame, explode: [-0.4, 0, 0], anchor: [-0.195, 0.1, 0.65], flag: 'T', spec: 'Timber lintel over the opening, carried by the trimmer studs. Sized by the engineer.', desc: 'The frame carries the roof and floor loads over the opening. The brick above is carried by its own steel lintel, not by this one.' },
        { id: 'wrap', name: 'Wall wrap', group: wrap, explode: [-0.2, 0, 0], anchor: [-0.137, 0.4, 0.55], flag: 'C', spec: 'Lapped over the flashing upstand, as the maker shows.', desc: 'The upper sheet laps over the flashing upstand so water runs down onto the flashing, not behind it.' },
        { id: 'ties', name: 'Wall ties near the opening', group: ties, explode: [0.0, 0.2, 0], anchor: [-0.14, 0.2, 0.22], flag: 'C', spec: 'Extra ties are usually placed close to the opening and the head of the wall. Confirm in the NCC figures.', desc: 'Ties near openings hold the brick leaf where the wall is interrupted.' },
        { id: 'angle', name: 'Steel lintel angle', group: angle, explode: [0.18, -0.22, 0], anchor: [-0.07, -0.01, 0.55], flag: 'V', src: 'nccMas56', spec: 'Typically 90 x 90 x 8 angle, at least 300 MPa, galvanised. Long leg vertical. Bearing at least 100 mm each end for spans up to 1 m.', desc: 'It carries the brick over the opening. The brick must not overhang the horizontal leg by more than 25 mm, and at least three courses sit on it.' },
        { id: 'flash', name: 'Head flashing', group: flash, explode: [0.0, 0.25, 0], anchor: [-0.1485, 0.14, -0.55], flag: 'V', src: 'nccMas57', spec: 'Extends at least 150 mm past the opening each side, within 300 mm above it, and turns up at least 150 mm in the cavity.', desc: 'Water running down the cavity lands on the flashing and runs out through the weepholes above the lintel, not into the window head.' },
        { id: 'bricks', name: 'Bricks above and beside the opening', group: grp(above, beside, mort), explode: [0.6, 0, 0], anchor: [0.0, 0.2, -0.45], flag: 'T', spec: 'At least three courses over the opening, no more than 3 m of masonry above it.', desc: 'The brick leaf closes round the opening. Each course above the lintel rests on a mortar bed over the flashing.' },
        { id: 'weeps', name: 'Weepholes above the flashing', group: weeps, explode: [0.85, 0.12, 0], anchor: [0.0, 0.045, 0.23], flag: 'V', src: 'nccMas57', spec: 'In the course immediately above the flashing, at no more than 1.2 m centres.', desc: 'These let the water that the flashing has caught out of the wall.' },
      ] };
    },
  },

  sill: {
    title: 'Window sill: sill brick and flashing', sub: 'Frame sill, wrap, flashing tray, sloping sill brick and the bricks below', floor: -0.62, gridSize: 3,
    camera: { pos: [1.3, 0.35, 1.75], target: [-0.05, -0.1, 0] },
    build(kit) {
      const { mat, box } = kit, timber = mat(0xffffff, { tex: 'timber' }), foil = mat(0xb4bcc6, { metalness: 0.2, roughness: 0.5, side: THREE.DoubleSide }), flashM = mat(0xdfe3e8, { metalness: 0.3, roughness: 0.4 }), sillM = mat(0xa24e37, { roughness: 0.9 });
      const frame = grp(box(0.09, 0.045, 1.3, timber, -0.195, -0.0225, 0), box(0.09, 0.56, 0.045, timber, -0.195, -0.325, -0.5), box(0.09, 0.56, 0.045, timber, -0.195, -0.325, 0.5), box(0.09, 0.56, 0.045, timber, -0.195, -0.325, 0.0));
      const wrap = grp(box(0.002, 0.62, 1.3, foil, -0.137, -0.31, 0));
      const flashPieces = grp(box(0.003, 0.05, 1.3, flashM, -0.1485, -0.025, 0)); const tray = box(0.15, 0.003, 1.3, flashM, -0.075, -0.05, 0); tray.rotation.z = -0.09; flashPieces.add(tray);
      const sillB = grp(); for (const [a, b] of [[-0.62, -0.38], [-0.38, -0.14], [-0.14, 0.1], [0.1, 0.34], [0.34, 0.58]]) { const s = box(0.11, 0.055, b - a - 0.01, sillM, -0.055, -0.03, (a + b) / 2); s.rotation.z = -0.15; sillB.add(s); }
      const below = bricksIn(kit, -0.7, 0.7, -0.57, 0, 5), mort = grp(mortarBlock(kit, -0.7, 0.7, -0.57, -0.12));
      const weeps = grp(weepVent(kit, -0.07, -0.64), weepVent(kit, -0.07, 0.64));
      return { parts: [
        { id: 'frame', name: 'Frame sill and cripples', group: frame, explode: [-0.4, 0, 0], anchor: [-0.195, -0.02, 0.65], flag: 'T', spec: 'Sill trimmer over short studs (cripples). The window frame is fixed here at Step 7.', desc: 'The sill trimmer is the shelf the window sits on. Its top surface slopes away from the window or is protected by the sill flashing.' },
        { id: 'wrap', name: 'Wall wrap', group: wrap, explode: [-0.2, 0, 0], anchor: [-0.137, -0.3, 0.55], flag: 'C', spec: 'Lapped under the sill flashing upstand, as the maker shows.', desc: 'Any water behind the brick runs down the wrap and onto the flashing tray.' },
        { id: 'flash', name: 'Sill flashing tray', group: flashPieces, explode: [0.0, 0.25, 0], anchor: [-0.1, -0.05, -0.55], flag: 'V', src: 'nccMas57', spec: 'At least 150 mm past the reveals each side, within one course below the sill brick course. Smooth, not sagging into the cavity.', desc: 'It catches water that runs down the window and the cavity and carries it out to the face of the wall, where the weepholes let it drain.' },
        { id: 'sill', name: 'Sloping sill bricks', group: sillB, explode: [0.55, 0.12, 0], anchor: [-0.01, -0.02, 0.3], flag: 'T', spec: 'Bricks laid on edge with a slope away from the window, projecting slightly.', desc: 'The slope and the projection throw rainwater clear of the wall below, so the sill does not soak the courses underneath.' },
        { id: 'below', name: 'Bricks below the sill', group: grp(below, mort), explode: [0.7, -0.15, 0], anchor: [0.0, -0.3, -0.4], flag: 'T', spec: 'Normal running-bond courses. Ties go in the bed joints.', desc: 'The wall below the sill is plain brickwork with ties. The flashing sits no more than one course below the sill brick course.' },
        { id: 'weeps', name: 'Weepholes at the sill ends', group: weeps, explode: [0.9, 0.0, 0], anchor: [0.0, -0.07, 0.64], flag: 'V', src: 'nccMas57', spec: 'In the course immediately above the flashing, at no more than 1.2 m centres.', desc: 'The water the tray carries drains out through these vents in the joints at each end of the sill.' },
      ] };
    },
  },

  joint: {
    title: 'Articulation joint', sub: 'A vertical movement joint in the brickwork with its backing rod and sealant (drawn wider than a real 10 mm joint)', floor: -0.1, gridSize: 3,
    camera: { pos: [1.5, 0.75, 2.0], target: [0.05, 0.3, 0] },
    build(kit) {
      const { mat, box, rod } = kit, timber = mat(0xffffff, { tex: 'timber' }), foil = mat(0xb4bcc6, { metalness: 0.2, roughness: 0.5, side: THREE.DoubleSide }), sealM = mat(0x8a8d92, { roughness: 0.7 }), rodM = mat(0xe8d9a8);
      const frame = grp(box(0.09, 0.045, 1.1, timber, -0.195, 0.0225, 0), box(0.09, 0.6, 0.045, timber, -0.195, 0.345, -0.225), box(0.09, 0.6, 0.045, timber, -0.195, 0.345, 0.225), box(0.09, 0.045, 1.1, timber, -0.195, 0.63, 0));
      const wrap = grp(box(0.002, 0.5, 1.1, foil, -0.137, 0.325, 0));
      const left = bricksIn(kit, -0.5, -0.02, 0.013, 0, 7), right = bricksIn(kit, 0.02, 0.5, 0.013, 0, 7);
      const dpc = grp(box(0.17, 0.004, 1.1, mat(0x16181b), -0.075, 0.002, 0));
      const backer = grp(rod([-0.035, 0.013, 0], [-0.035, 0.6, 0], 0.014, rodM, 10));
      const seal = grp(box(0.014, 0.59, 0.04, sealM, -0.008, 0.306, 0));
      const ties = grp(); for (const y of [0.266, 0.52]) for (const z of [-0.225, 0.225]) ties.add(tieAt(kit, y, z));
      const mort = grp(mortarBlock(kit, -0.5, -0.02, 0.004, 0.62), mortarBlock(kit, 0.02, 0.5, 0.004, 0.62));
      return { parts: [
        { id: 'frame', name: 'Frame', group: frame, explode: [-0.3, 0, 0], anchor: [-0.195, 0.4, 0.225], flag: 'T', spec: 'The frame does not have a joint at this position. Only the brick leaf does.', desc: 'The frame is one piece. The movement joint is in the brick leaf in front of it.' },
        { id: 'wrap', name: 'Wall wrap', group: wrap, explode: [-0.12, 0.3, 0], anchor: [-0.137, 0.5, -0.4], flag: 'C', spec: 'Continues behind the joint.', desc: 'The wrap runs behind the joint, so any water that gets past the sealant is still shed down the cavity.' },
        { id: 'ties', name: 'Wall ties either side', group: ties, explode: [0, 0.16, 0], anchor: [-0.13, 0.52, 0.225], flag: 'C', spec: 'Ties are kept close to the joint, either side of it. Confirm spacing in the NCC figures.', desc: 'Each half of the wall is tied back to the frame on its own, so each half stays upright when it moves.' },
        { id: 'dpc', name: 'DPC runs through', group: dpc, explode: [0, 0.1, 0], anchor: [0.0, 0.01, 0.4], flag: 'T', spec: 'The damp-proof course is continuous across the joint.', desc: 'The joint stops the movement of the brick, not the moisture barrier below it.' },
        { id: 'bricks', name: 'Brick leaf, in two halves', group: grp(left, right, mort), explode: [0.55, 0, 0], anchor: [0.0, 0.34, 0.38], flag: 'C', spec: 'A gap of at least 10 mm, running from the DPC to the top of the wall. No mortar crosses it.', desc: 'The two halves can move apart or together a little. A joint that is filled with hard mortar does nothing.' },
        { id: 'rod', name: 'Backing rod', group: backer, explode: [0.9, 0, 0], anchor: [-0.035, 0.45, 0.0], flag: 'C', spec: 'A closed-cell foam rod pushed into the gap to set the sealant depth.', desc: 'It sets the depth of the sealant and stops the sealant sticking to the back of the joint, so it can stretch.' },
        { id: 'seal', name: 'Flexible sealant', group: seal, explode: [1.2, 0, 0], anchor: [-0.008, 0.3, 0.0], flag: 'C', spec: 'Flexible sealant, supported in the gap while it cures. Check the maker\'s data.', desc: 'The bead keeps the weather out and stretches as the joint opens and closes. It is the only part of the joint you can see.' },
      ] };
    },
  },

  cladding: {
    title: 'Timber or fibre-cement cladding', sub: 'Slab edge, frame, wrap, battens, lapped boards and the clearance above the ground', floor: -0.15, gridSize: 3,
    camera: { pos: [1.1, 0.6, 1.5], target: [-0.1, 0.3, 0] },
    build(kit) {
      const { mat, box, rod, ghost } = kit, timber = mat(0xffffff, { tex: 'timber' }), conc = mat(0xffffff, { tex: 'concrete' }), foil = mat(0xb4bcc6, { metalness: 0.2, roughness: 0.5, side: THREE.DoubleSide }), board = mat(0xd9d2c3, { roughness: 0.85 }), nail = mat(0x6b7480, { metalness: 0.6, roughness: 0.4 });
      const slab = grp(box(0.55, 0.15, 1.1, conc, -0.275, -0.075, 0));
      const frame = grp(box(0.09, 0.045, 1.1, timber, -0.195, 0.0225, 0), box(0.09, 0.9, 0.045, timber, -0.195, 0.495, -0.3), box(0.09, 0.9, 0.045, timber, -0.195, 0.495, 0.3), box(0.09, 0.045, 1.1, timber, -0.195, 0.95, 0));
      const wrap = grp(box(0.002, 0.6, 1.1, foil, -0.147, 0.4, 0));
      const batt = grp(box(0.02, 0.9, 0.045, timber, -0.136, 0.5, -0.3), box(0.02, 0.9, 0.045, timber, -0.136, 0.5, 0.3));
      const boards = grp(), nails = grp();
      for (let i = 0; i < 7; i++) { const b = box(0.016, 0.145, 1.1, board, -0.108 + i * 0.0, 0.07 + i * 0.12, 0); b.rotation.z = 0.1; boards.add(b); for (const z of [-0.3, 0.3]) nails.add(rod([-0.1, 0.07 + i * 0.12 + 0.04, z], [-0.04, 0.07 + i * 0.12 + 0.04, z], 0.0025, nail, 5)); }
      const clear = grp(box(0.2, 0.15, 1.1, ghost(0x58a6ff, 0.22), -0.1, -0.075, 0));
      return { parts: [
        { id: 'slab', name: 'Slab edge', group: slab, explode: [-0.25, 0, 0], anchor: [-0.3, -0.05, 0.55], flag: 'T', spec: 'The slab edge is 150 mm above finished ground in this model.', desc: 'The cladding stops above the ground and above the slab edge so splashing water does not soak it.' },
        { id: 'frame', name: 'Frame', group: frame, explode: [-0.3, 0, 0], anchor: [-0.195, 0.6, 0.3], flag: 'T', spec: 'Studs at no more than 600 mm centres for the fixing tables in Part 7.5.', desc: 'The boards are nailed through the battens into the studs, so stud spacing sets the fixing pattern.' },
        { id: 'wrap', name: 'Wall wrap or sarking', group: wrap, explode: [-0.1, 0.32, 0], anchor: [-0.147, 0.6, -0.45], flag: 'V', src: 'nccClad75', spec: 'Vapour-permeable sarking to AS 4200.1 behind vertical or diagonal profiled boards and where parapets are used. Overlaps at least 150 mm or taped.', desc: 'The wrap is the second line of defence if water gets behind the boards.' },
        { id: 'batt', name: 'Cavity battens', group: batt, explode: [0.05, 0, 0], anchor: [-0.136, 0.7, 0.3], flag: 'C', spec: 'Battens keep the boards off the wrap and let the wall drain and dry. Part 7.5 allows battens if the fixing penetration into the frame is kept.', desc: 'A small gap behind the boards lets air move and water drain. Confirm the batten size and fixing with the cladding maker.' },
        { id: 'boards', name: 'Lapped boards', group: boards, explode: [0.45, 0, 0], anchor: [-0.1, 0.4, -0.4], flag: 'V', src: 'nccClad75', spec: 'Minimum laps: 30 mm hardwood, cypress or treated pine, 20 mm Western Red Cedar, 25 mm Baltic pine, 25 mm fibre cement.', desc: 'Each board overlaps the one below so rain runs over the joins. The boards run along the wall and are fixed to every stud.' },
        { id: 'nails', name: 'Fixings', group: nails, explode: [0.75, 0, 0], anchor: [-0.07, 0.31, 0.3], flag: 'V', src: 'nccClad75', spec: 'One fixing per stud for narrow boards, two for boards over 130 mm. Hot-dip galvanised at least 600 g/m² (stainless within 200 m of breaking surf).', desc: 'Fixings must not go through the tip of the board below, so the boards can move with the weather.' },
        { id: 'clear', name: 'Clearance above ground (ghost)', group: clear, explode: [0.4, -0.1, 0], anchor: [-0.1, -0.075, 0.5], flag: 'V', src: 'nccClad75', spec: 'Bottom of cladding to finished ground: 100 mm low rainfall or sandy, 50 mm above sloping paved areas, 150 mm otherwise.', desc: 'The gap keeps the bottom board dry and lets it be inspected for termites, so do not bury it in garden beds or paving.' },
      ] };
    },
  },
};

/* ---------- 2D drawings ---------- */
const pl = (pts, cls = 'd-memb') => pts.slice(1).map((q, i) => L(pts[i][0], pts[i][1], q[0], q[1], cls)).join('');
function wallSection() {
  const sv = 190, sh = 570, gy = 610, ox = 330, Y = (m) => gy - sv * m, X = (d) => ox + sh * d, body = [R(0, 0, 900, 680, 'd-bg')];
  const yk = (k) => Y0 + k * PITCH;
  body.push(L(60, Y(0), 640, Y(0), 'd-ground'), R(X(0), Y(0.15), sh * 0.9, sv * 0.15, 'd-conc'), R(X(0), Y(0), sh * 0.3, sv * 0.15 + 1, 'd-conc'), R(X(-0.015), Y(0.153), sh * 0.165, 3, 'd-seal'));
  for (let k = 0; k < NC; k++) { if (k >= 11 && k < KH) continue; body.push(R(X(0), Y(yk(k + 1)), sh * BT, sv * 0.076, 'd-brick')); }
  body.push(R(X(-0.02), Y(yk(11)) - 4, sh * 0.13, 12, 'd-brick'), R(X(0.02), Y(yk(KH)), sh * 0.09, 6, 'd-steel'), R(X(0.11), Y(yk(KH)) - sv * 0.09, 7, sv * 0.09 + 6, 'd-steel'));
  body.push(R(X(0.15), Y(1.005), sh * 0.09, sv * 0.81, 'd-timber'), R(X(0.15), Y(0.195), sh * 0.09, sv * 0.045, 'd-timber'), R(X(0.15), Y(1.05), sh * 0.09, sv * 0.045, 'd-timber'), R(X(0.15), Y(2.44), sh * 0.09, sv * 0.19, 'd-timber'), R(X(0.15), Y(2.76), sh * 0.09, sv * 0.32, 'd-timber'), R(X(0.15), Y(2.85), sh * 0.09, sv * 0.09, 'd-timber'));
  body.push(R(X(0.15), Y(2.25), sh * 0.09, sv * 1.2, 'd-door'), R(X(0.24), Y(2.76), 6, sv * 2.565, 'd-cap'), L(X(0.136), Y(0.2), X(0.136), Y(2.8), 'd-wrap'));
  for (const k of [3, 9, 26, 29]) body.push(L(X(0.05), Y(yk(k) - 0.005), X(0.2), Y(yk(k) - 0.005), 'd-memb'));
  body.push(R(X(0), Y(yk(0) + 0.062), sh * 0.06, sv * 0.05, 'd-seal'), R(X(0), Y(yk(KH) + 0.062), sh * 0.06, sv * 0.05, 'd-seal'));
  body.push(pl([[X(-0.01), Y(yk(KH) + 0.005)], [X(0.15), Y(yk(KH) + 0.005)], [X(0.15), Y(yk(KH) + 0.17)]]), pl([[X(-0.01), Y(yk(11)) + 12], [X(0.15), Y(yk(11)) + 8]]));
  body.push(T(X(0.26), Y(1.3), 'Window opening (Step 7)', { cls: 'd-mute' }), T(X(0.35), Y(2.88), 'Truss heel on the top plates (Step 4)', { cls: 'd-mute' }));
  body.push(dim(X(-0.12) - 28, Y(0), X(-0.12) - 28, Y(0.15), '150', -1), dim(X(-0.12) - 62, Y(0), X(-0.12) - 62, Y(1.05), 'Sill 1 050', -1), dim(X(-0.12) - 96, Y(0), X(-0.12) - 96, Y(2.25), 'Head 2 250', -1), dim(X(0.11), Y(2.0), X(0.15), Y(2.0), '40', 1));
  body.push(call(9, X(0.04), Y(yk(11)) + 2, 70, 330), call(1, X(0.055), Y(yk(5) + 0.04), 70, 440), call(6, X(0.03), Y(yk(0) + 0.085), 70, 500), call(5, X(0.07), Y(0.152), 70, 550),
    call(8, X(0.07), Y(yk(KH)) + 3, 600, 190), call(4, X(0.136), Y(1.9), 600, 300), call(3, X(0.195), Y(0.6), 600, 440), call(2, X(0.13), Y(yk(4) + 0.03), 600, 520), call(7, X(0.12), Y(yk(3) - 0.005), 600, 570));
  body.push(T(40, 40, 'Brick veneer wall section through a window (typical, wall thickness exaggerated)', { cls: 'd-bold' }), ...['1  Brick leaf, 110 mm', '2  Cavity, typically 40 mm', '3  Frame stud 90 x 45', '4  Wall wrap', '5  DPC on the slab edge, visible at the face', '6  Weephole above the DPC', '7  Wall tie in a bed joint', '8  Steel lintel and head flashing', '9  Sloping sill brick and sill flashing'].map((t, i) => T(650, 90 + i * 20, t)));
  return svg(900, 680, body.join(''), 'Brick veneer wall section');
}

function elevation() {
  const s = 74, ox = 40, gy = 330, X = (m) => ox + (m - X0) * s, Y = (m) => gy - s * m, W = EXT[0], body = [R(0, 0, 900, 470, 'd-bg')];
  body.push(R(X(X0), Y(2.82), (X1 - X0) * s, 2.67 * s, 'd-brick'), R(X(X0), Y(0.15), (X1 - X0) * s, 0.15 * s, 'd-conc'), L(X(X0) - 10, Y(0), X(X1) + 10, Y(0), 'd-ground'), R(X(X0), Y(0.153) - 1, (X1 - X0) * s, 3, 'd-seal'));
  for (const o of W.opens) {
    const y0 = o.sill === 0 ? 0.15 : YK(o.kS), y1 = YK(KH);
    body.push(R(X(o.a), Y(y1), o.w * s, (y1 - y0) * s, 'd-bg'), R(X(o.a), Y(y1), o.w * s, (y1 - y0) * s, 'd-door'), R(X(o.a - 0.1), Y(y1), (o.w + 0.2) * s, 4, 'd-steel'));
    if (o.sill > 0) body.push(R(X(o.a - 0.06), Y(y0) - 2, (o.w + 0.12) * s, 5, 'd-brick'));
  }
  for (const [a, b] of freeSpans(W, 0)) for (const u of weepAt(a, b)) body.push(R(X(u) - 2, Y(YK(0) + 0.05), 4, 5, 'd-seal'));
  for (const o of W.opens) for (const u of weepAt(o.a, o.b)) body.push(R(X(u) - 2, Y(YK(KH) + 0.05), 4, 5, 'd-seal'));
  JOINTS.front.forEach((u, i) => body.push(L(X(u), Y(0.153), X(u), Y(2.82), 'd-cut'), T(X(u), Y(2.82) - 8, 'J' + (i + 1), { anchor: 'middle', cls: 'd-bold' })));
  const js = [X0, ...JOINTS.front, X1];
  for (let i = 0; i < js.length - 1; i++) body.push(dim(X(js[i]), gy + 34, X(js[i + 1]), gy + 34, (js[i + 1] - js[i]).toFixed(1) + ' m', 1));
  body.push(T(40, 36, 'Front wall elevation: movement joints, lintels and weepholes (typical, 74 px per metre)', { cls: 'd-bold' }));
  body.push(T(40, 420, 'Joints sit within 1.2 m of the larger openings and not more than 5 m apart. Sealed strips run from the DPC to the top of the wall.', { cls: 'd-mute' }), T(40, 440, 'Dark squares are weepholes: low in the first course, and above each lintel. Heavy dark bars are steel lintels, longer than the opening.', { cls: 'd-mute' }));
  return svg(900, 470, body.join(''), 'Front wall elevation');
}

function headSill() {
  const s = 640, body = [R(0, 0, 900, 640, 'd-bg')];
  const panel = (ox, oy) => ({ X: (d) => ox + s * d, Y: (y) => oy - s * y });
  { // head, y = 0 is the underside of the lintel angle
    const { X, Y } = panel(120, 330);
    for (let k = 0; k < 3; k++) body.push(R(X(0), Y(0.013 + k * PITCH + 0.076), s * BT, s * 0.076, 'd-brick'));
    body.push(R(X(0.02), Y(0.008), s * 0.09, s * 0.008, 'd-steel'), R(X(0.11), Y(0.098), s * 0.008, s * 0.098, 'd-steel'), R(X(0.15), Y(0.19), s * 0.09, s * 0.19, 'd-timber'), L(X(0.136), Y(-0.15), X(0.136), Y(0.45), 'd-wrap'));
    body.push(pl([[X(0), Y(0.012)], [X(0.15), Y(0.012)], [X(0.15), Y(0.172)]]), R(X(0), Y(0.075), s * 0.06, s * 0.05, 'd-seal'), dim(X(0.3), Y(0.012), X(0.3), Y(0.172), '150 up-turn', 1), dim(X(0.11), Y(0.34), X(0.15), Y(0.34), '40', 1));
    body.push(call(6, X(0.136), Y(0.38), 376, 100), call(5, X(0.2), Y(0.1), 376, 220), call(4, X(0.055), Y(0.2), 60, 150), call(3, X(0.03), Y(0.05), 60, 230), call(2, X(0.1), Y(0.012), 60, 300), call(1, X(0.06), Y(0.004), 60, 400));
    body.push(T(40, 40, 'Head (large scale)', { cls: 'd-bold' }));
  }
  { // sill, y = 0 is the top of the window sill trimmer
    const { X, Y } = panel(560, 240);
    for (let k = 0; k < 4; k++) body.push(R(X(0), Y(-0.06 - k * PITCH), s * BT, s * 0.076, 'd-brick'));
    body.push(P([[X(-0.02), Y(-0.05)], [X(0.1), Y(-0.05)], [X(0.1), Y(0.004)], [X(-0.02), Y(-0.012)]], 'd-brick'), R(X(0.15), Y(0), s * 0.09, s * 0.045, 'd-timber'), R(X(0.15), Y(-0.045), s * 0.09, s * 0.4, 'd-timber'), L(X(0.136), Y(-0.43), X(0.136), Y(0.3), 'd-wrap'));
    body.push(pl([[X(-0.005), Y(-0.058)], [X(0.15), Y(-0.04)], [X(0.15), Y(0.02)]]), dim(X(0.11), Y(-0.43), X(0.15), Y(-0.43), '40', 1));
    body.push(call(5, X(0.136), Y(0.2), 840, 60), call(4, X(0.2), Y(-0.02), 840, 150), call(1, X(0.06), Y(-0.03), 500, 190), call(2, X(0.08), Y(-0.05), 500, 260), call(3, X(0.04), Y(-0.15), 500, 380));
    body.push(T(490, 40, 'Sill (large scale)', { cls: 'd-bold' }));
  }
  body.push(T(40, 575, 'Head: 1 steel lintel angle  2 flashing, up-turned 150 mm  3 weephole above the flashing  4 three courses over the opening  5 frame lintel  6 wall wrap', { cls: 'd-mute' }), T(40, 596, 'Sill: 1 sloping sill brick  2 sill flashing tray  3 bricks below  4 frame sill (window at Step 7)  5 wall wrap', { cls: 'd-mute' }), T(40, 622, 'Real sizes at 640 px per metre. The flashing must reach 150 mm past the reveals each side, which is longer than the lintel bearing.', { cls: 'd-mute' }));
  return svg(900, 640, body.join(''), 'Window head and sill');
}

const drawings = [
  { id: 'wallsec', title: 'Wall section', scale: 'Typical, wall thickness exaggerated', svg: wallSection(),
    notes: ['A section through a window: slab edge, DPC, brick, cavity, ties, frame, wrap, lintel and sill. Callout numbers match the key.', 'The cavity must stay at least 25 mm wide and free of obstructions, and drain to the outside through weepholes above the DPC and above each flashing.', 'The window itself goes in at Step 7. Brick is shown fatter than real so the layers can be read.'] },
  { id: 'elev', title: 'Wall elevation', scale: 'Typical, 74 px per metre', svg: elevation(),
    notes: ['The front wall as seen from the street, with the steel lintels, weepholes and sealed movement joints marked.', 'Movement joint positions follow the typical NCC spacing. The engineer and the soil class decide whether they are needed at all.', 'Open the 3D joint model to see the backing rod and the sealant.'] },
  { id: 'headsill', title: 'Head and sill', scale: 'Large scale, 640 px per metre', svg: headSill(),
    notes: ['The head and the sill at real size: lintel, flashing, weepholes, sill brick and wrap.', 'Flashings run at least 150 mm past the reveals each side. A lintel bears only 100 mm, so the flashing must be longer than the lintel and turned out at the ends.', 'The lintel sizes and steel grade come from the NCC tables and the engineer.'] },
  { id: 'slabedge', title: 'Slab edge detail', scale: 'Large scale, about 1:5, typical', svg: slabEdge(),
    notes: ['A close-up of where the veneer meets the slab: the parts a supervisor checks before the first course is covered. Callout numbers match the key.',
      'The DPC runs through the full thickness of the veneer, is visible at the face and turns up behind the wall wrap, so water in the cavity is carried out through the weepholes above it.',
      'Weepholes are open joints in the course just above the DPC at no more than 1.2 m centres, kept free of mortar droppings.',
      'Where the slab edge is part of the termite management system it is left exposed for inspection. Check the exposure the system and AS 3660.1 require; do not render or pave over it.'] },
];

// Large-scale detail at the slab edge: brick on the slab, DPC turned up behind the wrap, weephole, tie, bottom plate,
// exposed slab edge and the edge beam below. Drawn at about 1 px per mm; all sizes are typical.
function slabEdge() {
  const body = [R(0, 0, 900, 790, 'd-bg')];
  const open = (pts, cls) => `<path d="M${pts.map((q) => q.join(' ')).join(' L')}" class="${cls}" fill="none"/>`;
  body.push(R(40, 430, 262, 210, 'd-soil'), L(40, 430, 300, 430, 'd-ground'));
  body.push(P([[300, 360], [720, 360], [720, 430], [420, 430], [420, 612], [300, 612]], 'd-conc'));
  body.push(R(420, 430, 300, 34, 'd-sand'), R(420, 464, 300, 176, 'd-soil'));
  body.push(open([[300, 615], [417, 615], [417, 433], [720, 433]], 'd-memb'));
  body.push(R(322, 388, 76, 200, 'd-line', 5));
  for (const [x, y] of [[332, 398], [388, 398], [332, 578], [388, 578]]) body.push(`<circle cx="${x}" cy="${y}" r="5.5" class="d-steel"/>`);
  body.push(L(404, 402, 720, 402, 'd-mesh'));
  body.push(R(300, 60, 110, 300, 'd-brick'));
  for (const y of [146, 232, 318]) body.push(L(300, y, 410, y, 'd-line'));
  body.push(R(332, 318, 10, 42, 'd-box'));
  body.push(open([[296, 360], [410, 360], [410, 353], [451, 353], [451, 296]], 'd-memb'));
  body.push(L(352, 232, 470, 225, 'd-mesh'));
  body.push(L(453, 60, 453, 358, 'd-wrap'));
  body.push(R(456, 60, 89, 255, 'd-ins'));
  body.push(R(456, 315, 89, 45, 'd-timber'), L(456, 315, 545, 360, 'd-line'), L(545, 315, 456, 360, 'd-line'));
  body.push(R(545, 60, 10, 292, 'd-board'), R(555, 318, 12, 34, 'd-timber'), R(555, 352, 165, 8, 'd-board'));
  body.push(dim(300, 50, 410, 50, '110', -1), dim(410, 50, 453, 50, 'cavity', -1), dim(456, 50, 545, 50, '90', -1), dim(268, 360, 268, 430, 'exposed', -1));
  body.push(call(1, 355, 110, 210, 110), call(2, 431, 150, 640, 110), call(3, 410, 229, 640, 165), call(4, 453, 270, 640, 220), call(5, 500, 140, 640, 275),
    call(6, 500, 337, 640, 328), call(7, 430, 353, 210, 330), call(8, 337, 335, 210, 270), call(9, 300, 395, 210, 400), call(10, 360, 500, 210, 520), call(11, 600, 433, 760, 470));
  const key = ['Brick veneer, 110 mm', 'Cavity, clear and free-draining', 'Wall tie in a bed joint, sloping down to the brick', 'Wall wrap on the frame', 'Bulk insulation between studs (stud beyond)',
    'Bottom plate on the slab (cut member)', 'DPC or flashing through the veneer, turned up behind the wrap', 'Weephole: open joint in the course above the DPC', 'Slab edge left exposed for termite inspection',
    'Edge beam, reinforced, to the engineer', 'Vapour barrier on sand bedding'];
  body.push(T(40, 26, 'Slab edge detail: brick veneer on a slab-on-ground', { cls: 'd-bold' }));
  key.forEach((t, i) => body.push(T(i < 6 ? 40 : 470, 672 + (i % 6) * 17, `${i + 1}  ${t}`)));
  body.push(T(40, 778, 'Typical, about 1:5. Our own drawing, made from the NCC Part 5.7 text and typical practice. The cavity, DPC and weephole rules are in the notes.', { cls: 'd-mute' }));
  return svg(900, 790, body.join(''), 'Slab edge detail, brick veneer');
}

/* ---------- study content ---------- */
const howto = [
  ['Check the frame is ready for the bricks', 'Frame inspected and signed off, bracing and tie-downs in, the slab edge clean and level, and no timber crossing the cavity.', 'Builder', 'T'],
  ['Choose the brick, order it and the mortar', 'Order all bricks from one batch. Check the colour on a pallet, the size and the delivery access. Agree the mortar mix and the tie type for your distance from the sea.', 'Builder', 'V', 'nccMas56'],
  ['Wrap the frame', 'Roll the wall wrap over the studs, lapped shingle-fashion, and keep the cavity at least 25 mm clear of the wrap, any sheet bracing and services.', 'Carpenter or wrapper', 'V', 'nccMas57'],
  ['Set out and lay the damp-proof course', 'Mark the brick face from the slab edge. Lay a continuous DPC on the slab edge, through the full thickness of the wall and visible at the face.', 'Bricklayer', 'V', 'nccMas57'],
  ['Lay the first course with weepholes', 'First course in a full mortar bed on the DPC. Leave open vertical joints in the first course at no more than 1.2 m centres for weepholes.', 'Bricklayer', 'V', 'nccMas57'],
  ['Build up the veneer, tying each course to the frame', 'Running bond. Fix a tie into the bed joints at the NCC spacing and close to openings, with each tie sloping so it does not carry water to the frame. Keep the cavity clean.', 'Bricklayer and labourer', 'V', 'nccMas56'],
  ['Fit the steel lintels and flashings at openings', 'Angle with the long leg vertical, bearing 100 mm (150 mm over 1 m spans), at least three courses over it. Flashing past the reveals, turned up at the back and turned out at the ends.', 'Bricklayer', 'V', 'nccMas57'],
  ['Leave and seal the articulation joints', 'Leave a gap of at least 10 mm at each joint, with no mortar across it, from the DPC to the top. Set the backing rod and flexible sealant when the wall is up.', 'Bricklayer and sealer', 'C', 'nccMas56'],
  ['Clean down and check the weepholes', 'Clean the brick, open every weephole and check the cavity base is free of mortar before anyone covers it.', 'Bricklayer', 'T'],
  ['Cladding and render, where the plan has them', 'Fix cladding to the frame with the laps, fixings and flashings of Part 7.5 and the maker\'s data, with the bottom edge clear of the ground. Render is a system with its own details.', 'Cladding installer or renderer', 'V', 'nccClad75'],
  ['Photograph, check and record', 'Photograph the DPC, ties, lintels, flashings and weepholes before they are covered. Ask the surveyor what they want to see.', 'Builder', 'T'],
];

const trades = [
  { t: 'Bricklayer (and labourer)', role: 'Lays the DPC, bricks, ties, lintels, flashings and weepholes, leaves the movement joints and cleans down.', when: 'After the frame and roof are on, before windows and linings', reg: 'Trade contractor with insurance (confirm any licence or registration requirement with the VBA)', ask: ['Supply and lay, or lay only', 'Rate per 1 000 bricks or per square metre, and extras for sills, arches and piers', 'Who supplies ties, lintels, flashings and weep vents', 'Cleaning and sealing the joints included'] },
  { t: 'Brick supplier', role: 'Supplies bricks, delivers on pallets and may supply pavers, lintels and accessories.', when: 'Order early, since colours and lead times vary', reg: 'Manufacturer or distributor', ask: ['Price per 1 000 bricks delivered and unloading', 'Lead time and batch colour match', 'Technical data for ties and flashings'] },
  { t: 'Cladding installer', role: 'Fixes timber, fibre-cement or composite cladding with the laps, fixings and flashings the NCC and maker require.', when: 'After the frame is wrapped and windows are in', reg: 'Trade contractor with insurance', ask: ['Supply and fix, or fix only', 'Board lap, fixings and flashing details', 'Clearance from ground and paving'] },
  { t: 'Renderer', role: 'Applies a render system over masonry or sheet, keeping the DPC visible.', when: 'After the walls and windows are in', reg: 'Trade contractor with insurance', ask: ['System, coats and finish', 'Movement joints and beads included', 'Warranty'] },
  { t: 'Scaffolder', role: 'Provides working platforms for the bricklayer as the walls rise.', when: 'Before the bricks go above reach', reg: 'Licensed scaffolder above the notified height (confirm with WorkSafe)', ask: ['Hire period and extensions', 'Inspection and handover certificate'] },
  { t: 'Building surveyor (RBS)', role: 'Decides which stages they want to inspect and checks the work against the permit documents.', when: 'During construction', reg: 'Registered building surveyor (BPC)', ask: ['Will they inspect brickwork, flashings or ties', 'What photographs or records they want'] },
];

const materials = [
  ['Clay bricks, 230 x 110 x 76 mm', 'Colour and texture from the brick maker. Typically supplied by manufacturers such as Austral Bricks and PGH. Confirm the range with the supplier', 'Brick manufacturer or distributor. Get two quotes', 'T', 'Order from one batch. Check any special shapes for arches and sills.'],
  ['Mortar: cement, lime and sand, or pre-mixed', 'Mixed by volume in the NCC table proportions with methyl cellulose thickener, or a bagged mix to AS 3700 or AS 4773', 'Builders merchant or Bunnings trade desk', 'V', 'The table values were not read here. Check them in the NCC.'],
  ['Damp-proof course', 'Embossed black polyethylene film, 0.5 mm nominal, to AS/NZS 2904, wide enough to run through the wall and show at the face', 'Builders merchant or Bunnings (confirm range)', 'V', 'Other NCC options are coated aluminium-core metal, bitumen-impregnated at least 2.5 mm or a continuous termite sheet.'],
  ['Wall ties', 'Galvanised or stainless by distance from surf (Table 5.6.5d), or engineered polymer', 'Masonry accessories supplier', 'V', 'Check spacing in the NCC figures.'],
  ['Steel lintels', 'Angles such as 90 x 90 x 8, at least 300 MPa, hot-dip galvanised (300 or 600 g/m² by durability class) or stainless 316L', 'Steel supplier or lintel specialist', 'V', 'Sizes come from the NCC tables and the engineer.'],
  ['Flashings and weep vents', 'Polyethylene-coated metal or flexible flashing, and plastic weep vents', 'Masonry accessories supplier', 'C', 'Check the flashing maker\'s data for lengths and laps.'],
  ['Backing rod and flexible sealant for movement joints', 'Closed-cell rod and a sealant the maker lists for masonry movement joints', 'Sealant supplier or Bunnings trade desk', 'C', 'Match the rod diameter to the joint width.'],
  ['Wall wrap', 'Foil or vapour-permeable sarking, to AS 4200.1 where Part 7.5 requires it', 'Insulation or building supplier', 'V', 'Match to the climate zone and the surveyor\'s documents.'],
  ['Cladding boards, battens and fixings', 'Timber, fibre cement, hardboard or plywood, with galvanised fixings at least 600 g/m²', 'Timber merchant or cladding maker', 'V', 'Maker\'s data governs fixing and laps.'],
];

const quotes = [
  { who: 'Bricklayer', n: '3', what: ['Supply and lay of the bricks, or lay only', 'DPC, ties, lintels, flashings and weep vents included or not', 'Movement joints, sill bricks, arches and cleaning down'] },
  { who: 'Brick supplier', n: '2 to 3', what: ['Bricks per 1 000 delivered, with unloading', 'Lead time and colour batch', 'Special shapes and sample'] },
  { who: 'Lintel and accessory supplier', n: '2', what: ['Steel lintels cut to the opening list', 'Ties, flashings and weep vents', 'Galvanising class and stainless options'] },
  { who: 'Cladding installer', n: '3', what: ['Supply and fix of boards, battens and flashings', 'Paint or finish included or not', 'Warranty'] },
  { who: 'Renderer', n: '2 to 3', what: ['Render system and coats', 'Beads and movement joints', 'Warranty and cure time'] },
  { who: 'Scaffolder', n: '2', what: ['Scaffold for the bricklayer', 'Hire period and extensions', 'Handover certificate'] },
];
const quoteTips = [
  'Ask every bricklayer to price the same list: number of bricks, openings, sill bricks, arches and movement joints. A low price that leaves out the lintels, ties or flashings is not a saving.',
  'Confirm in writing who supplies the ties, lintels, flashings and weep vents. They are cheap but are the parts that fail.',
  'Ask for the tie metal to match your distance from the sea. A cheap galvanised tie near the coast corrodes.',
  'Order the bricks from one batch and keep a sample for the surveyor. Brick colour changes between firings.',
  'Ask the bricklayer how the cavity will be kept clear of mortar droppings. A blocked weephole is a hidden defect.',
  'Keep every quote and order. They are evidence of estimating for the BPC application.',
];

const inspections = [
  ['Frame ready for brick', 'Builder', 'Before wrap and bricks', 'Frame signed off, cavity space clear, bracing and tie-downs in. Photograph.', 'T'],
  ['Wall wrap check', 'Builder', 'Before the bricks cover it', 'Laps shingle-fashion, no torn sheets, cavity still at least 25 mm clear.', 'V', 'nccMas57'],
  ['DPC check', 'Builder and RBS if asked', 'Before the first course', 'Continuous round the slab edge, through the wall, visible at the face. Material as listed in the NCC.', 'V', 'nccMas57'],
  ['Weephole check', 'Builder', 'After the first course and again after cleaning down', 'Open vertical joints at no more than 1.2 m centres, in the course above each flashing, clear of mortar.', 'V', 'nccMas57'],
  ['Tie check', 'Builder', 'As the wall rises', 'Tie type, spacing, embedment of at least 50 mm into each leaf, and fixings to the frame.', 'V', 'nccMas56'],
  ['Lintel and flashing check', 'Builder and RBS if asked', 'Before the bricks go over the opening', 'Steel grade and size, bearing at each end, flashing past the reveals and turned up and out.', 'V', 'nccMas57'],
  ['Movement joint check', 'Builder', 'Before the joints are sealed', 'Width at least 10 mm, no mortar bridging, rod and sealant set.', 'C', 'nccMas56'],
  ['Surveyor inspection (if stated)', 'RBS', 'As the permit says', 'Ask which brickwork stages the surveyor wants to see. Confirm the notification stages on your permit.', 'C'],
];

const exam = [
  ['What is the minimum clear cavity width in masonry veneer, and the maximum?', 'At least 25 mm and no more than 75 mm between the brick and the supporting frame.', 'V', 'nccMas57'],
  ['What stays at least 25 mm clear despite wall wrap or sheet bracing?', 'The clear cavity in masonry veneer.', 'V', 'nccMas57'],
  ['Where must a DPC be installed?', 'Round the bottom perimeter of walls on a concrete slab, in walls and piers below suspended floors, where a masonry wall passes through a roof or a roof abuts it, and at the bottom and tops of windows and doors.', 'V', 'nccMas57'],
  ['Which DPC materials does the NCC list?', 'Embossed black polyethylene film (0.5 mm nominal, AS/NZS 2904 cl 7.6), polyethylene-coated aluminium-core metal, bitumen-impregnated material at least 2.5 mm thick, or a continuous termite sheet.', 'V', 'nccMas57'],
  ['How far may the outer brick leaf overhang the slab edge?', 'No more than 15 mm.', 'V', 'nccMas57'],
  ['What are the weephole size and spacing rules?', 'At least 50 mm high by the vertical joint width, at no more than 1.2 m centres, in the course immediately above the flashing.', 'V', 'nccMas57'],
  ['How far must flashings extend past the reveals?', 'At least 150 mm each side. They turn up in the cavity at least 150 mm above the opening and sit no more than 300 mm above it.', 'V', 'nccMas57'],
  ['When is a head flashing not needed?', 'Where an eave wider than three times the height of the veneer above the opening protects the opening.', 'V', 'nccMas57'],
  ['What is the maximum height of masonry veneer?', '8.5 m above adjacent finished ground.', 'V', 'nccMas52'],
  ['Which openings in veneer do not need a steel lintel?', 'Those up to and including 500 mm wide that are adequately supported.', 'V', 'nccMas52'],
  ['What bearing does a lintel need?', 'At least 100 mm each end for clear spans up to 1 m and at least 150 mm over 1 m, with at least three courses of masonry over it.', 'V', 'nccMas56'],
  ['How far must a wall tie be embedded?', 'At least 50 mm into each masonry leaf.', 'V', 'nccMas56'],
  ['Why does tie metal change near the coast?', 'Salt corrodes ordinary galvanising. Within 1 km of breaking surf the NCC calls for stainless 316L or engineered polymer, and 1 to 10 km needs heavier galvanising or stainless 304L.', 'V', 'nccMas56'],
  ['What does an articulation joint do, and how wide is it?', 'It lets the brick leaf move without cracking. At least 10 mm, filled with flexible sealant. Needed except on soil class A or S sites. Confirm in the NCC figures.', 'C', 'nccMas56'],
  ['What minimum ground clearance applies to timber and composite cladding?', '100 mm in low rainfall or sandy well-drained areas, 50 mm above paved areas sloping away, 150 mm in all other cases.', 'V', 'nccClad75'],
  ['How far must flashings at timber-clad openings extend past the reveals?', 'At least 110 mm where practicable, with joins lapped at least 75 mm and sealed.', 'V', 'nccClad75'],
  ['What is a common flashing defect at lintels?', 'The lintel bears 100 mm but the flashing must run at least 150 mm past the opening, so a flashing cut to the lintel ends short and drains water back into the cavity.', 'V', 'nswDpc'],
];

export default {
  n: 6, id: 'externalwalls', title: 'External walls', subtitle: 'Brick veneer from the damp-proof course to the eaves, with cladding and render rules alongside.',
  phases, build, details, drawings, howto, trades, materials, quotes, quoteTips, inspections, exam,
  sources: ['nccMas57', 'nccMas52', 'nccMas56', 'nccClad75', 'nswDpc', 'bradFlash', 'bpcMI01', 'hiaStd25', 'hiaNcc25'],
  caution: 'Masonry and cladding figures here come from the ABCB\'s free NCC 2022 web pages and a NSW Building Commission note. NCC 2025 applies in Victoria from 1 May 2026, so check each clause and figure against that edition. The Standards (AS 3700, AS 4773, AS 4100, AS 4200.1) are paywalled and were not opened, and tie spacing and the articulation joint figures are only in drawings that were not read. The dimensions in the models and drawings are typical.',
};

// Shared with later stages that reuse the finished brick walls and the detail-model helpers.
export { EXT, cell, YK, Y0, PITCH, BT, KH, NC, grp, bricksIn, mortarBlock, tieAt, weepVent, pl };

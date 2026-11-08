// Step 2: footings and slab-on-ground (stiffened raft, brick-veneer edge rebate).
// Numeric rules marked Verified come from the NCC 2022 Housing Provisions Part 4.2 text (adopted edition), see Sources.
import { buildBase, buildSiteWorks, HOUSE, BASE_COLLIDERS, MAP } from './site.js';
import { svg, T, L, R, C as Ci, P, dim, arrow, call } from './dwg.js';

const { x0: X0, x1: X1, z0: Z0, z1: Z1 } = HOUSE;
const RING = 0.3, INT = 0.3, TR = -0.25, TOP = 0.15, MID = 5.5;
const BEAMS = [
  [X0, X1, Z0, Z0 + RING], [X0, X1, Z1 - RING, Z1], [X0, X0 + RING, Z0 + RING, Z1 - RING], [X1 - RING, X1, Z0 + RING, Z1 - RING],
  [-INT / 2, INT / 2, Z0 + RING, Z1 - RING],
  [X0 + RING, -INT / 2, -INT / 2, INT / 2], [INT / 2, X1 - RING, -INT / 2, INT / 2],
  [X0 + RING, -INT / 2, MID - INT / 2, MID + INT / 2], [INT / 2, X1 - RING, MID - INT / 2, MID + INT / 2],
];
const XS = [[X0 + RING, -INT / 2], [INT / 2, X1 - RING]];
const ZS = [[Z0 + RING, -INT / 2], [INT / 2, MID - INT / 2], [MID + INT / 2, Z1 - RING]];
const ISL = XS.flatMap(([a, b]) => ZS.map(([c, d]) => [a, b, c, d]));
const RISERS = [[-3.6, 2.4, 'sewer'], [-3.6, 5.4, 'sewer'], [-1.8, -1.0, 'sewer'], [-2, 7, 'water']];
const CZ = (Z0 + Z1) / 2, DZ = Z1 - Z0;

const phases = [
  { title: 'Set-out and pad', text: 'Profiles and string lines carry the building lines outside the dig. The pad is cut to level.' },
  { title: 'Dig the beams', text: 'Edge beams and internal beams are excavated into founding material, with clean and level bottoms.' },
  { title: 'Drainage and services', text: 'The plumber lays sewer, stormwater and water pipes. Risers stand up where fixtures will go.' },
  { title: 'Bedding, termite barrier, membrane', text: 'Bedding, sleeves and collars, then the 0.2 mm membrane lapped and taped. Edge formwork goes in.' },
  { title: 'Reinforcement and hold point', text: 'Trench mesh in the beams, mesh on chairs in the slab. Nothing is poured until the nominated inspection has passed.' },
  { title: 'Pour and finish', text: 'Concrete is pumped from the street, placed, compacted, screeded and finished.' },
  { title: 'Cure and strip', text: 'Formwork is stripped. The slab is kept moist for 7 days with no stacked loads or plant.' },
];

function instBoxes(kit, material, items) {
  const { THREE } = kit, im = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), material, items.length);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(), t = new THREE.Vector3();
  items.forEach(([x, y, z, sx, sy, sz], i) => im.setMatrixAt(i, m4.compose(t.set(x, y, z), q, s.set(sx, sy, sz))));
  im.castShadow = true;
  return im;
}

function build(kit) {
  const { THREE, C, mat, ghost, box, cyl, rod, pipe, flat, lineSet, textPlane } = kit;
  const mk = (n) => { const g = new THREE.Group(); g.name = n; return g; };
  const base = buildBase(kit, { pit: { x0: X0, x1: X1, z0: Z0, z1: Z1 } }), w = buildSiteWorks(kit);
  const pm = { sewer: mat(C.sewer), storm: mat(C.storm), water: mat(C.water) };

  const cover = mk('cover'); cover.add(flat(X1 - X0, DZ, mat(0xffffff, { tex: 'soil' }), 0, 0.007, CZ));

  const prof = mk('profiles'), tm = mat(0xffffff, { tex: 'timber' }), stake = mat(0xb89060, { tex: 'timber' }), O = 1.3, segs = [];
  for (const [ax, az, bx, bz, o] of [[X0, Z0 - O, X0, Z1 + O, 'z'], [X1, Z0 - O, X1, Z1 + O, 'z'], [X0 - O, Z0, X1 + O, Z0, 'x'], [X0 - O, Z1, X1 + O, Z1, 'x']]) {
    segs.push([[ax, 0.5, az], [bx, 0.5, bz]]);
    for (const [px, pz] of [[ax, az], [bx, bz]]) {
      if (o === 'z') { prof.add(box(0.8, 0.09, 0.045, tm, px, 0.5, pz)); for (const d of [-0.35, 0.35]) prof.add(cyl(0.025, 0.8, stake, px + d, 0.25, pz, 6)); }
      else { prof.add(box(0.045, 0.09, 0.8, tm, px, 0.5, pz)); for (const d of [-0.35, 0.35]) prof.add(cyl(0.025, 0.8, stake, px, 0.25, pz + d, 6)); }
    }
  }
  prof.add(lineSet(segs, 0xffd24a));

  const trench = mk('trench'), dark = mat(0x9a8a7a, { tex: 'soil' }), pad = mat(0xe3cba8, { tex: 'soil' });
  trench.add(box(X1 - X0, 0.02, DZ, dark, 0, TR - 0.01, CZ));
  for (const [a, b, c, d] of ISL) trench.add(box(b - a, -TR, d - c, pad, (a + b) / 2, TR / 2, (c + d) / 2));
  trench.add(box(X1 - X0, -TR, 0.04, dark, 0, TR / 2, Z0 + 0.02)); trench.add(box(X1 - X0, -TR, 0.04, dark, 0, TR / 2, Z1 - 0.02));
  trench.add(box(0.04, -TR, DZ, dark, X0 + 0.02, TR / 2, CZ)); trench.add(box(0.04, -TR, DZ, dark, X1 - 0.02, TR / 2, CZ));

  const drain = mk('drain');
  drain.add(pipe([[-3.6, 0.06, 5.4], [-3.6, 0.06, -5.3], [-3.6, 0.06, -16.5]], 0.055, pm.sewer));
  drain.add(pipe([[-1.8, 0.06, -1.0], [-3.6, 0.06, -1.0]], 0.055, pm.sewer));
  drain.add(pipe([[6.2, 0.03, -4.5], [6.2, 0.03, 12.4], [1, 0.03, 12.4], [1, 0.03, 20.3]], 0.045, pm.storm));
  drain.add(pipe([[-2, 0.04, 17.2], [-2, 0.06, 7]], 0.024, pm.water));
  for (const z of [-4.5, 11]) drain.add(cyl(0.045, 0.38, pm.storm, 6.2, 0.2, z, 12));

  const risers = mk('risers');
  for (const [x, z, k] of RISERS) {
    const r = k === 'sewer' ? 0.055 : 0.024;
    risers.add(cyl(r, 0.26, pm[k], x, 0.17, z, 14)); risers.add(cyl(r * 1.2, 0.03, mat(0xf5f5f5), x, 0.31, z, 14));
  }

  const bed = mk('bed'), sand = mat(0xffffff, { tex: 'sand' }), mm = mat(C.membrane, { side: THREE.DoubleSide, transparent: true, opacity: 0.9 });
  for (const [a, b, c, d] of ISL) {
    bed.add(box(b - a, 0.05, d - c, sand, (a + b) / 2, 0.025, (c + d) / 2));
    bed.add(flat(b - a, d - c, mm, (a + b) / 2, 0.0525, (c + d) / 2));
    for (const [len, x, z, ry] of [[b - a, (a + b) / 2, c, 0], [b - a, (a + b) / 2, d, 0], [d - c, a, (c + d) / 2, Math.PI / 2], [d - c, b, (c + d) / 2, Math.PI / 2]]) {
      const p = new THREE.Mesh(new THREE.PlaneGeometry(len, 0.3), mm); p.rotation.y = ry; p.position.set(x, -0.1, z); bed.add(p);
    }
  }
  bed.add(flat(X1 - X0, DZ, mm, 0, TR + 0.004, CZ));
  const white = mat(0xf5f5f5), steel = mat(0xc4cad1, { metalness: 0.5, roughness: 0.4 });
  for (const [x, z, k] of RISERS) {
    bed.add(cyl(k === 'sewer' ? 0.085 : 0.05, 0.1, white, x, 0.1, z, 18, true));
    const ring = new THREE.Mesh(new THREE.RingGeometry(k === 'sewer' ? 0.07 : 0.035, 0.2, 28), new THREE.MeshStandardMaterial({ color: 0xc4cad1, metalness: 0.5, roughness: 0.4, side: THREE.DoubleSide }));
    ring.rotation.x = -Math.PI / 2; ring.position.set(x, 0.058, z); bed.add(ring);
  }
  const sl = cyl(0.085, 0.35, white, -3.6, 0.04, -5.35, 18, true); sl.rotation.x = Math.PI / 2; bed.add(sl);

  const form = mk('formwork'), fm = mat(0xffffff, { tex: 'timber' });
  form.add(box(X1 - X0 + 0.14, 0.18, 0.045, fm, 0, 0.09, Z0 - 0.0225)); form.add(box(X1 - X0 + 0.14, 0.18, 0.045, fm, 0, 0.09, Z1 + 0.0225));
  form.add(box(0.045, 0.18, DZ, fm, X0 - 0.0225, 0.09, CZ)); form.add(box(0.045, 0.18, DZ, fm, X1 + 0.0225, 0.09, CZ));
  for (let x = X0; x <= X1 + 0.01; x += 1.8) for (const z of [Z0 - 0.07, Z1 + 0.07]) form.add(cyl(0.02, 0.3, stake, x, 0.1, z, 6));
  for (let z = Z0 + 1.7; z < Z1; z += 1.8) for (const x of [X0 - 0.07, X1 + 0.07]) form.add(cyl(0.02, 0.3, stake, x, 0.1, z, 6));

  const reo = mk('reo'), rebar = mat(C.rebar, { metalness: 0.45, roughness: 0.5 });
  const meshX = [], meshZ = [], chairs = [];
  for (let z = Z0 + 0.15; z <= Z1 - 0.1; z += 0.2) meshX.push([0, 0.086, z, X1 - X0 - 0.3, 0.008, 0.008]);
  for (let x = X0 + 0.15; x <= X1 - 0.1; x += 0.2) meshZ.push([x, 0.094, CZ, 0.008, 0.008, DZ - 0.3]);
  reo.add(instBoxes(kit, rebar, meshX)); reo.add(instBoxes(kit, rebar, meshZ));
  for (let x = -4.8; x <= 4.9; x += 0.8) for (let z = -4.8; z <= 11.3; z += 0.8) {
    if (ISL.some(([a, b, c, d]) => x > a + 0.05 && x < b - 0.05 && z > c + 0.05 && z < d - 0.05)) chairs.push([x, 0.066, z, 0.04, 0.03, 0.04]);
  }
  reo.add(instBoxes(kit, mat(0xcc4a2a), chairs));
  for (const [a, b, c, d] of BEAMS) {
    const alongX = b - a >= d - c, len = (alongX ? b - a : d - c) - 0.1, cx = (a + b) / 2, cz = (c + d) / 2;
    for (const [y, offs] of [[-0.21, [-0.09, 0, 0.09]], [0.1, [-0.06, 0.06]]]) for (const o of offs) {
      reo.add(alongX ? rod([cx - len / 2, y, cz + o], [cx + len / 2, y, cz + o], 0.006, rebar) : rod([cx + o, y, cz - len / 2], [cx + o, y, cz + len / 2], 0.006, rebar));
    }
  }
  const sign = textPlane(['STOP: HOLD POINT', 'Reinforcement inspection', 'No concrete until signed off'], 1.8, 0.9);
  sign.position.set(0, 1.5, Z1 + 1.3); reo.add(sign);
  reo.add(cyl(0.04, 1.6, mat(C.steel), -0.8, 0.8, Z1 + 1.28, 8)); reo.add(cyl(0.04, 1.6, mat(C.steel), 0.8, 0.8, Z1 + 1.28, 8));

  const slabInto = (g, m, zBase) => {
    g.add(box(X1 - X0, 0.1, DZ, m, 0, 0.1, CZ - zBase));
    for (const [a, b, c, d] of BEAMS) g.add(box(b - a, TOP - 0.05 - TR, d - c, m, (a + b) / 2, (TR + 0.05) / 2, (c + d) / 2 - zBase));
    return g;
  };
  const wet = mk('wet'), wetPivot = mk('pivot'); wetPivot.position.z = Z0;
  slabInto(wetPivot, mat(0x7b7e82, { roughness: 0.55 }), Z0); wet.add(wetPivot);
  const cured = slabInto(mk('cured'), mat(0xffffff, { tex: 'concrete' }), 0);
  const curing = mk('curing');
  curing.add(flat(X1 - X0, DZ, ghost(0xffffff, 0.3), 0, 0.158, CZ));
  const cs = textPlane(['CURING: 7 DAYS', 'Keep surface moist', 'No stacked loads or plant'], 1.8, 0.9);
  cs.position.set(0, 1.5, Z1 + 1.3); curing.add(cs);
  curing.add(cyl(0.04, 1.6, mat(C.steel), -0.8, 0.8, Z1 + 1.28, 8)); curing.add(cyl(0.04, 1.6, mat(C.steel), 0.8, 0.8, Z1 + 1.28, 8));

  const pump = mk('pump'), red = mat(0xd04030), boomM = mat(C.orange);
  pump.add(box(7.5, 1.0, 2.5, red, 4, 0.9, 22.6)); pump.add(box(2.2, 1.6, 2.4, red, 7.3, 1.5, 22.6));
  pump.add(rod([2.2, 1.6, 22.6], [1.6, 5.4, 19.8], 0.13, boomM)); pump.add(rod([1.6, 5.4, 19.8], [1.5, 5.8, 10], 0.1, boomM));
  pump.add(rod([1.5, 5.8, 10], [1.5, 4.4, 3.6], 0.09, boomM)); pump.add(rod([1.5, 4.4, 3.6], [1.5, 0.5, 3.4], 0.04, mat(C.black)));
  for (const p of [[1.6, 5.4, 19.8], [1.5, 5.8, 10], [1.5, 4.4, 3.6]]) { const s = new THREE.Mesh(new THREE.SphereGeometry(0.15, 12, 10), boomM); s.position.set(...p); pump.add(s); }
  const drum = cyl(1.0, 4, mat(0xdadcde), -6, 2.1, 23.4, 20); drum.rotation.z = Math.PI / 2; pump.add(drum);
  pump.add(box(6.6, 0.9, 2.5, mat(0x3c4a5c), -6.5, 0.8, 23.4)); pump.add(box(2, 1.6, 2.4, mat(0x3c4a5c), -2.6, 1.3, 23.4));

  let was = false, t0 = 0;
  const tickers = [(dt, t) => {
    if (!wet.visible) { was = false; return; }
    if (!was) { was = true; t0 = t; }
    wetPivot.scale.z = 0.02 + 0.98 * Math.min(1, (t - t0) / 9);
  }];

  const layers = [
    { group: base }, { group: w.fence }, { group: w.sign }, { group: w.silt }, { group: w.entry }, { group: w.amenities },
    { group: cover, until: 1 }, { group: prof, until: 5 }, { group: trench, from: 1, until: 6 }, { group: drain, from: 2, until: 5 },
    { group: risers, from: 2 }, { group: bed, from: 3, until: 6 }, { group: form, from: 3, until: 6 }, { group: reo, from: 4, until: 5 },
    { group: wet, from: 5, until: 6 }, { group: pump, from: 5, until: 6 }, { group: cured, from: 6 }, { group: curing, from: 6 },
  ];
  return {
    layers, colliders: BASE_COLLIDERS, tickers,
    spawn: { pos: [0, 22], yaw: 0, pitch: -0.12 }, map: MAP,
    orbit: { pos: [19, 15, 29], target: [0, 0, 4] },
    hotspots: [
      { id: 'setout', title: 'Set-out: profiles and string lines', pos: [X0 - 1.3, 0.8, Z0 - 1.3], stand: [-2, -12], from: 0, until: 5,
        summary: 'The building lines are carried to profiles set clear of the dig, so they survive excavation and can be checked at any time.',
        learn: [['Set out from the survey pegs using the endorsed site plan. The surveyor or builder checks squareness by diagonals and sets levels from the datum on the drawings.', 'T'], ['Keep profiles outside the excavation and protect them from machines.', 'T'], ['Check the slab level against the plans before digging. A common defect is a slab too low for drainage falls or the flood level.', 'T']], drawing: 'plan' },
      { id: 'site', title: 'Site class and bearing', pos: [0, 1.0, 3], stand: [0, 18], from: 0, until: 5,
        summary: 'The soil report classifies the site (A, S, M, H1, H2, E or P in AS 2870). The engineer designs the footing and slab for that class.',
        learn: [['Natural soil bearing for slab panels must be at least 50 kPa. For pads and strip footings it must be at least 100 kPa.', 'V', 'abcb42'], ['Flat sites must be generally level, with a slope no more than 1:40. Sloping sites no more than 1:10.', 'V', 'abcb42'], ['Where sand is loose or erodible, the footing bottom is at least 300 mm below finished ground level.', 'V', 'abcb42'], ['Remove loose earth, tree roots, mud and topsoil with grass roots from the excavation.', 'V', 'abcb42']] },
      { id: 'edgebeam', title: 'Edge beam trench and founding', pos: [X0 + 0.15, 0.4, Z1 - 0.2], stand: [X0 + 0.15, 18], from: 1, detail: 'edgebeam', drawing: 'secA',
        summary: 'The beam is dug to the engineer\'s size into founding material. The bottom is clean, level and free of loose material.',
        learn: [['Edge beam width at the base of the rebate is at least 200 mm. It can reduce to 150 mm if R10 or N10 ties at 900 mm spacing, or equivalent, are provided.', 'V', 'abcb42'], ['Beam depth, width and bars come from the engineer\'s drawings. Do not copy typical sizes.', 'T']] },
      { id: 'penetration', title: 'Sewer riser and penetration', pos: [-3.6, 0.5, Z0 + 0.15], stand: [-3.6, -11], from: 2, detail: 'penetration', drawing: 'secB',
        summary: 'Pipes that pass through the slab are sleeved so concrete does not bond to them, and the membrane is sealed around each one.',
        learn: [['Seal service penetrations in the membrane with tape, or with a close-fitting sleeve. Seal any other puncture with extra film and tape.', 'V', 'abcb42'], ['Pipes are laid, tested and inspected before they are covered. Confirm the plumbing inspections and certificate of compliance your plumber must arrange.', 'C'], ['Mark every riser position against the plans before the slab is poured. A missed riser means cutting into a cured slab.', 'T']] },
      { id: 'storm', title: 'Stormwater and legal point of discharge', pos: [1, 0.6, 20.3], stand: [1, 26], from: 2, until: 5, drawing: 'plan',
        summary: 'Roof water is piped to the legal point of discharge. Confirm the council report and consent early because it can move the downpipe positions.',
        learn: [['Downpipe stubs at the corners connect to the drain outside the slab, which runs to the legal point of discharge at the kerb.', 'T'], ['The legal point of discharge is set by council or the water authority. Confirm the report and consent requirement in the Building Regulations 2018.', 'C']] },
      { id: 'membrane', title: 'Membrane laps and sealing', pos: [2.5, 0.7, 6], stand: [2.5, 15], from: 3, until: 5, drawing: 'secA',
        summary: 'The 0.2 mm polyethylene membrane is the damp barrier under the slab. It lines the beams, continues under the slab and finishes at ground level.',
        learn: [['0.2 mm nominal polyethylene film, high impact resistance, branded "AS 2870 Concrete underlay, 0.2 mm High impact resistance".', 'V', 'abcb42'], ['Laps at least 200 mm at all joints. Seal punctures fully with additional film and tape.', 'V', 'abcb42'], ['Extend the membrane under edge beams to finish at ground level.', 'V', 'abcb42']] },
      { id: 'termite', title: 'Termite barrier at penetrations', pos: [-3.6, 0.5, 2.4], stand: [-3.6, 15], from: 3, until: 5, detail: 'penetration',
        summary: 'Gaps around pipes are the usual entry for termites. A physical collar or a chemical system treats each penetration.',
        learn: [['New homes need a termite management system installed to AS 3660.1. The installer provides a compliance certificate and a durable notice.', 'C'], ['The slab edge is left exposed so inspectors can see termite workings. Typically 150 mm above finished ground and 75 mm above paving. Confirm the current figures.', 'C']] },
      { id: 'junction', title: 'Beam junction and laps', pos: [0, 0.45, 0], stand: [0, 15], from: 1, until: 5, detail: 'junction', drawing: 'plan',
        summary: 'Where an internal beam meets an edge beam the bars are lapped, not just butted. Lap lengths depend on bar size.',
        learn: [['Bars up to 12 mm diameter: 500 mm splice. Bars over 12 and up to 16 mm: 700 mm splice. Trench mesh: 500 mm.', 'V', 'abcb42'], ['Bar chairs at no more than 800 mm centres for steel fabric. Reinforcement must be free of loose rust, mud, paint and oil.', 'V', 'abcb42']] },
      { id: 'hold', title: 'Reinforcement hold point', pos: [0, 1.5, Z1 + 1.3], stand: [0, 17], from: 4, until: 5,
        summary: 'The building surveyor lists the mandatory notification stages on the permit. If reinforcement is one, nothing is poured until the inspection is done.',
        learn: [['The RBS lists the stages on Form 2. The builder notifies the RBS at each stage and must not go beyond it until it has been inspected.', 'V', 'vbaMand'], ['The engineer usually inspects the reinforcement and issues a certificate. Book both before the concrete is ordered.', 'T'], ['Check cover, chairs, laps, penetrations and that the membrane is undamaged.', 'T']] },
      { id: 'pour', title: 'Concrete order and placement', pos: [4, 2.4, 22.6], stand: [4, 29], from: 5, until: 6,
        summary: 'The slab is poured from the street with a pump. The order sheet, slump and temperature are checked.',
        learn: [['Concrete to AS 3600: N20 or better (20 MPa at 28 days), 20 mm maximum aggregate, nominal 100 mm slump. The engineer\'s drawings may specify a higher grade.', 'V', 'abcb42'], ['Do not add water beyond the specified slump.', 'V', 'abcb42'], ['Not poured if site air temperature exceeds 32 degrees Celsius unless the Professional Engineer\'s written instructions are followed.', 'V', 'abcb42'], ['Keep the docket for every truck.', 'T']] },
      { id: 'cure', title: 'Curing and protection', pos: [0, 0.7, 3], stand: [0, 16], from: 6,
        summary: 'Curing lets the concrete gain strength and stops it cracking from drying out too fast.',
        learn: [['Moist cure the slab surfaces, including edges, for 7 days. Finish the slab edges before curing.', 'V', 'abcb42'], ['No stacked loads or plant on the slab for at least 7 days after the pour.', 'V', 'abcb42'], ['Collect the engineer\'s certificate, plumber\'s certificate, termite certificate, dockets and photos for the surveyor.', 'T']] },
    ],
  };
}

/* ---------- 3D detail models ---------- */
const details = {
  edgebeam: {
    title: 'Edge beam and slab edge', sub: 'Brick-veneer edge rebate, trench mesh, membrane and slab mesh', floor: -0.45, gridSize: 4,
    camera: { pos: [1.55, 0.9, 2.0], target: [0.45, 0.15, 0] },
    build(kit) {
      const { THREE, C, mat, ghost, box, rod, extrudeProfile, outline } = kit;
      const mk = () => new THREE.Group(), D = 1.2, rebar = mat(C.rebar, { metalness: 0.45, roughness: 0.5 });
      const soil = mk(), sm = mat(0xffffff, { tex: 'soil' });
      soil.add(box(0.5, 0.65, D, sm, -0.25, -0.075, 0)); soil.add(box(1.4, 0.4, D, sm, 0.7, -0.2, 0)); soil.add(box(1.1, 0.25, D, sm, 0.85, 0.125, 0));
      const sandG = mk(); sandG.add(box(0.8, 0.05, D, mat(0xffffff, { tex: 'sand' }), 0.7, 0.275, 0));
      const mem = mk(), mm = mat(C.membrane, { side: THREE.DoubleSide, transparent: true, opacity: 0.92 });
      const pl = (w, h) => new THREE.Mesh(new THREE.PlaneGeometry(w, h), mm);
      const a = pl(D, 0.25); a.rotation.y = Math.PI / 2; a.position.set(-0.003, 0.125, 0);
      const b = pl(0.3, D); b.rotation.x = -Math.PI / 2; b.position.set(0.15, 0.003, 0);
      const c = pl(D, 0.3); c.rotation.y = Math.PI / 2; c.position.set(0.303, 0.15, 0);
      const d = pl(0.8, D); d.rotation.x = -Math.PI / 2; d.position.set(0.7, 0.299, 0);
      mem.add(a, b, c, d);
      const conc = mk(); conc.add(outline(extrudeProfile([[0, 0], [0.3, 0], [0.3, 0.3], [1.1, 0.3], [1.1, 0.4], [0.11, 0.4], [0.11, 0.33], [0, 0.33]], D, ghost(C.concrete, 0.4))));
      const bars = mk();
      for (const x of [0.07, 0.15, 0.23]) bars.add(rod([x, 0.043, -0.55], [x, 0.043, 0.55], 0.006, rebar));
      for (const x of [0.17, 0.26]) bars.add(rod([x, 0.35, -0.55], [x, 0.35, 0.55], 0.006, rebar));
      for (const z of [-0.45, -0.15, 0.15, 0.45]) { bars.add(rod([0.07, 0.043, z], [0.23, 0.043, z], 0.003, rebar)); bars.add(rod([0.17, 0.35, z], [0.26, 0.35, z], 0.003, rebar)); }
      const chairs = mk(), cm = mat(0xcc4a2a);
      for (const z of [-0.4, 0.4]) { chairs.add(box(0.2, 0.03, 0.03, cm, 0.15, 0.0185, z)); for (const x of [0.5, 0.9]) chairs.add(box(0.04, 0.03, 0.04, cm, x, 0.315, z)); }
      const mesh = mk();
      for (const x of [0.4, 0.6, 0.8, 1.0]) mesh.add(rod([x, 0.336, -0.55], [x, 0.336, 0.55], 0.004, rebar));
      for (const z of [-0.5, -0.3, -0.1, 0.1, 0.3, 0.5]) mesh.add(rod([0.3, 0.344, z], [1.05, 0.344, z], 0.004, rebar));
      const rebate = mk(); rebate.add(box(0.11, 0.07, D, ghost(0xffb020, 0.55), 0.055, 0.365, 0));
      const edge = mk(); edge.add(box(0.008, 0.15, D, ghost(0xf2d03b, 0.65), -0.004, 0.325, 0));
      return { parts: [
        { id: 'soil', name: 'Founding material', group: soil, explode: [0, -0.45, 0], anchor: [-0.25, 0.1, 0.6], flag: 'V', src: 'abcb42', spec: 'Natural soil at least 100 kPa for strip footings. At least 50 kPa for slab panels.',
          desc: 'The ground the beam bears on. It is excavated flat, clean and free of loose earth, roots and mud. If the soil is not as the report describes, stop and call the engineer.' },
        { id: 'sand', name: 'Bedding sand', group: sandG, explode: [0.35, -0.2, 0], anchor: [1.0, 0.275, 0.6], flag: 'T', spec: 'About 50 mm of compacted sand or crushed rock under the membrane.',
          desc: 'Gives a smooth, even base so the membrane is not punctured. Controlled sand fill must have no gravel-size material and a blow count of 7 or more per 300 mm.' },
        { id: 'mem', name: 'Polyethylene membrane', group: mem, explode: [-0.25, -0.1, 0.2], anchor: [0.303, 0.1, 0.6], flag: 'V', src: 'abcb42', spec: '0.2 mm nominal, high impact resistance, laps at least 200 mm, taped.',
          desc: 'Damp-proofing under the slab. It lines the beam trench, runs under the slab and finishes at ground level on the outside face.' },
        { id: 'conc', name: 'Edge beam and slab concrete', group: conc, explode: [0, 0, 0], anchor: [0.2, 0.395, 0.6], flag: 'V', src: 'abcb42', spec: 'N20 or better. Typically 100 mm slab and 400 mm overall depth at the edge. Engineer governs.',
          desc: 'Shown transparent so the steel is visible. The slab and beam are poured together as one monolithic raft.' },
        { id: 'bars', name: 'Trench mesh (bottom and top)', group: bars, explode: [0, 0.45, 0], anchor: [0.07, 0.043, 0.55], flag: 'T', spec: 'For example 3-L11TM trench mesh. The engineer specifies the type and layers.',
          desc: 'Gives the beam its bending strength. The bottom layer sits on spacers so it is fully surrounded by concrete.' },
        { id: 'chairs', name: 'Spacers and bar chairs', group: chairs, explode: [0, -0.3, 0.25], anchor: [0.15, 0.0185, 0.4], flag: 'V', src: 'abcb42', spec: 'Bar chairs at no more than 800 mm centres for steel fabric. Wire chairs on membrane need flat bases.',
          desc: 'Hold the steel at the right height. Without them, mesh ends up on the membrane and has no cover, or it gets pushed down when concrete is placed.' },
        { id: 'mesh', name: 'Slab mesh (for example SL82)', group: mesh, explode: [0.3, 0.45, 0], anchor: [0.7, 0.34, 0.4], flag: 'T', spec: 'Mesh type from the engineer. Cover 30 mm to a membrane in contact with ground, 20 mm internal, 40 mm external exposure.',
          desc: 'Controls shrinkage cracking across the slab. Cover is measured from the surface of the steel to the surface of the concrete.' },
        { id: 'rebate', name: 'Rebate for brick veneer', group: rebate, explode: [-0.4, 0.25, 0], anchor: [0.055, 0.365, 0.6], flag: 'V', src: 'abcb42', spec: 'Beam width at the base of the rebate at least 200 mm, or 150 mm with R10 or N10 ties at 900 mm.',
          desc: 'The step that the brick veneer sits on, leaving a cavity gap to the frame. The size comes from the engineer\'s detail and the brick supplier.' },
        { id: 'edge', name: 'Exposed slab edge', group: edge, explode: [-0.55, 0, 0], anchor: [-0.004, 0.33, 0], flag: 'C', spec: 'Typically 150 mm above finished ground and 75 mm above paving. Confirm.',
          desc: 'The slab edge stays visible above the ground so termite inspectors can see mud tubes. Do not cover it with soil, paving or render below this line.' },
      ] };
    },
  },

  penetration: {
    title: 'Pipe penetration through a slab', sub: 'Sewer riser through membrane, termite collar, sleeve and slab', floor: -0.5, gridSize: 4,
    camera: { pos: [1.3, 0.95, 1.8], target: [0, 0.2, 0] },
    build(kit) {
      const { THREE, C, mat, ghost, box, cyl, rod, pipe, rectWithHoles, outline } = kit;
      const mk = () => new THREE.Group(), rebar = mat(C.rebar, { metalness: 0.45, roughness: 0.5 });
      const soil = mk(), sm = mat(0xffffff, { tex: 'soil' });
      soil.add(box(1, 0.45, 0.35, sm, 0, -0.225, 0.325)); soil.add(box(1, 0.45, 0.35, sm, 0, -0.225, -0.325)); soil.add(box(1, 0.28, 0.3, sm, 0, -0.31, 0));
      const sandG = mk(); sandG.add(box(1, 0.17, 0.3, ghost(C.sand, 0.5), 0, -0.085, 0)); sandG.add(box(1, 0.05, 1, mat(0xffffff, { tex: 'sand' }), 0, 0.025, 0));
      const pip = mk(), pm = mat(C.sewer);
      pip.add(pipe([[-0.5, -0.085, 0], [0, -0.085, 0], [0, 0.3, 0]], 0.055, pm)); pip.add(cyl(0.066, 0.03, mat(0xf3f3f3), 0, 0.315, 0, 18));
      const mm = mat(C.membrane, { side: THREE.DoubleSide, transparent: true, opacity: 0.92 });
      const mem = mk(); mem.add(rectWithHoles(-0.5, 0.5, -0.5, 0.5, [{ x0: -0.08, x1: 0.08, z0: -0.08, z1: 0.08 }], mm, 0.052));
      mem.add(cyl(0.078, 0.1, mm, 0, 0.1, 0, 22, true));
      const lag = mk(); lag.add(cyl(0.09, 0.1, new THREE.MeshStandardMaterial({ color: 0xf1e3a6, side: THREE.DoubleSide, roughness: 0.9 }), 0, 0.1, 0, 24, true));
      const collar = mk(), ring = new THREE.Mesh(new THREE.RingGeometry(0.095, 0.24, 40), new THREE.MeshStandardMaterial({ color: 0xc4cad1, metalness: 0.5, roughness: 0.4, side: THREE.DoubleSide }));
      ring.rotation.x = -Math.PI / 2; ring.position.y = 0.06; collar.add(ring);
      const conc = mk(); conc.add(outline(box(1, 0.1, 1, ghost(C.concrete, 0.38), 0, 0.1, 0)));
      const mesh = mk();
      for (const v of [-0.45, -0.3, -0.15, 0.15, 0.3, 0.45]) { mesh.add(rod([v, 0.101, -0.5], [v, 0.101, 0.5], 0.004, rebar)); mesh.add(rod([-0.5, 0.092, v], [0.5, 0.092, v], 0.004, rebar)); }
      for (const v of [-0.11, 0.11]) { mesh.add(rod([-0.2, 0.097, v], [0.2, 0.097, v], 0.005, mat(C.rebarB))); mesh.add(rod([v, 0.097, -0.2], [v, 0.097, 0.2], 0.005, mat(C.rebarB))); }
      const seal = mk(), tor = new THREE.Mesh(new THREE.TorusGeometry(0.078, 0.011, 8, 28), mat(C.black)); tor.rotation.x = Math.PI / 2; tor.position.y = 0.15; seal.add(tor);
      return { parts: [
        { id: 'soil', name: 'Pad and drain trench', group: soil, explode: [0, -0.45, 0], anchor: [0.5, -0.25, 0.3], flag: 'T', spec: 'Trench cut to the plumber\'s depth and fall.',
          desc: 'The drain is laid in a narrow trench below the slab. Fall and cover are the plumber\'s responsibility and are inspected before backfill.' },
        { id: 'sand', name: 'Bedding sand', group: sandG, explode: [0, -0.2, 0], anchor: [0.5, 0.025, 0.2], flag: 'T', spec: 'Sand around the pipe and as the pad under the membrane.',
          desc: 'Supports the pipe evenly and gives the membrane a smooth, puncture-free surface.' },
        { id: 'pipe', name: 'DN100 sewer pipe and riser', group: pip, explode: [0, 0.85, 0], anchor: [0, 0.28, 0], flag: 'T', spec: 'PVC drainage pipe, 100 mm, with the riser capped until fit-off.',
          desc: 'The plumber lays and tests the drain. The riser must be exactly where the fixture needs it because moving it after the pour means cutting the slab.' },
        { id: 'mem', name: 'Membrane and taped collar', group: mem, explode: [0, 0, 0], anchor: [0.35, 0.052, 0.2], flag: 'V', src: 'abcb42', spec: 'Tape or seal with a close-fitting sleeve around all service penetrations.',
          desc: 'The membrane is cut around the pipe and a film sleeve is taped to both. Any other hole is patched with extra film and tape.' },
        { id: 'collar', name: 'Termite collar', group: collar, explode: [0, 0.15, 0], anchor: [0.18, 0.06, 0.12], flag: 'C', spec: 'Physical collar or chemical system to AS 3660.1. Installer certifies.',
          desc: 'Stops termites using the gap around the pipe. It must stay undamaged until it is covered by concrete.' },
        { id: 'lag', name: 'Compressible sleeve (lagging)', group: lag, explode: [0.4, 0.2, 0], anchor: [0.09, 0.1, 0], flag: 'T', spec: 'Foam lagging through the slab thickness.',
          desc: 'Lets the pipe move without cracking the slab, and stops the concrete bonding to the pipe.' },
        { id: 'conc', name: 'Slab concrete', group: conc, explode: [0, 0.3, 0], anchor: [0.5, 0.1, -0.3], flag: 'V', src: 'abcb42', spec: 'N20 or better. Typically 100 mm thick. Engineer governs.',
          desc: 'Shown transparent. Concrete is compacted around the sleeve so there are no voids at the penetration.' },
        { id: 'mesh', name: 'Slab mesh and trimmer bars', group: mesh, explode: [0, 0.5, 0], anchor: [0.3, 0.1, 0.3], flag: 'C', spec: 'Trimmer bars around openings as the engineer details. Recess rules in NCC Housing Provisions clause 4.2.22.',
          desc: 'Mesh is cut back around the opening and the cut wires are replaced with trimmer bars so the slab is not weakened.' },
        { id: 'seal', name: 'Flexible sealant at the top', group: seal, explode: [0, 0.7, 0], anchor: [0, 0.15, 0.078], flag: 'T', spec: 'Flexible sealant between sleeve and pipe at the slab surface.',
          desc: 'Keeps water, floor screed and adhesives from running down the gap.' },
      ] };
    },
  },

  junction: {
    title: 'Beam junction and bar laps', sub: 'Internal beam meeting an edge beam, with spliced bars', floor: -0.1, gridSize: 4,
    camera: { pos: [1.7, 1.2, 1.9], target: [0, 0.15, 0.4] },
    build(kit) {
      const { THREE, C, mat, ghost, box, rod, flat, outline } = kit;
      const mk = () => new THREE.Group(), rebar = mat(C.rebar, { metalness: 0.45, roughness: 0.5 }), lapM = mat(C.rebarB, { metalness: 0.4 });
      const conc = mk(), gm = ghost(C.concrete, 0.36);
      conc.add(outline(box(1.8, 0.4, 0.4, gm, 0, 0.2, 0))); conc.add(outline(box(0.3, 0.4, 0.9, gm, 0, 0.2, 0.65))); conc.add(outline(box(0.75, 0.1, 0.9, gm, 0.525, 0.35, 0.65)));
      const main = mk();
      for (const z of [-0.1, 0, 0.1]) main.add(rod([-0.85, 0.05, z], [0.85, 0.05, z], 0.007, rebar));
      for (const z of [-0.07, 0.07]) main.add(rod([-0.85, 0.35, z], [0.85, 0.35, z], 0.007, rebar));
      const A = mk(); for (const x of [-0.08, 0, 0.08]) A.add(rod([x, 0.075, 0], [x, 0.075, 0.6], 0.007, rebar));
      for (const x of [-0.06, 0.06]) A.add(rod([x, 0.32, 0], [x, 0.32, 0.6], 0.007, rebar));
      const B = mk(); for (const x of [-0.08, 0, 0.08]) B.add(rod([x, 0.092, 0.1], [x, 0.092, 1.05], 0.007, lapM));
      for (const x of [-0.06, 0.06]) B.add(rod([x, 0.337, 0.1], [x, 0.337, 1.05], 0.007, lapM));
      B.add(box(0.22, 0.012, 0.5, ghost(0xffb020, 0.55), 0, 0.075, 0.35));
      const ch = mk(), cm = mat(0xcc4a2a);
      for (const x of [-0.6, 0.6]) ch.add(box(0.26, 0.03, 0.03, cm, x, 0.0185, 0));
      ch.add(box(0.2, 0.03, 0.03, cm, 0, 0.0185, 0.8));
      const mesh = mk();
      for (const z of [0.3, 0.5, 0.7, 0.9]) mesh.add(rod([0.2, 0.339, z], [0.88, 0.339, z], 0.004, rebar));
      for (const x of [0.25, 0.45, 0.65, 0.85]) mesh.add(rod([x, 0.347, 0.22], [x, 0.347, 1.05], 0.004, rebar));
      const mem = mk(), mm = mat(C.membrane, { side: THREE.DoubleSide, transparent: true, opacity: 0.9 });
      mem.add(flat(1.8, 0.4, mm, 0, 0.003, 0)); mem.add(flat(0.3, 0.9, mm, 0, 0.003, 0.65));
      return { parts: [
        { id: 'conc', name: 'Beam concrete (transparent)', group: conc, explode: [0, 0, 0], anchor: [0.85, 0.4, 0.2], flag: 'T', spec: 'Edge beam and internal beam poured with the slab.', desc: 'The edge beam runs left to right. The internal beam comes off it toward the front of the house, with slab on one side.' },
        { id: 'main', name: 'Edge beam bars', group: main, explode: [0, 0.45, -0.4], anchor: [-0.8, 0.05, 0.1], flag: 'T', spec: 'Bottom and top bars run the full length of the edge beam.', desc: 'These carry on past the junction. At the ends they lap with the next length by the required splice.' },
        { id: 'A', name: 'Internal beam bars, first length', group: A, explode: [0, 0.25, 0.1], anchor: [0.08, 0.075, 0.0], flag: 'T', spec: 'Starts inside the edge beam so it is anchored.', desc: 'Branch bars start inside the edge beam and run out along the internal beam.' },
        { id: 'B', name: 'Spliced bars (500 mm lap)', group: B, explode: [0, 0.6, 0.4], anchor: [-0.08, 0.092, 0.9], flag: 'V', src: 'abcb42', spec: 'Trench mesh and bars up to 12 mm: 500 mm splice. Over 12 and up to 16 mm: 700 mm.', desc: 'The second length overlaps the first by the lap length (orange zone) and is tied to it. Butting bars end to end gives no strength at the joint.' },
        { id: 'ch', name: 'Spacers and chairs', group: ch, explode: [0, -0.3, 0], anchor: [0, 0.0185, 0.8], flag: 'V', src: 'abcb42', spec: 'Chairs at no more than 800 mm centres.', desc: 'Keep the lower bars off the membrane so concrete flows underneath and gives the cover.' },
        { id: 'mesh', name: 'Slab mesh', group: mesh, explode: [0.35, 0.45, 0], anchor: [0.65, 0.34, 0.5], flag: 'T', spec: 'Mesh sits on chairs and laps over the beams.', desc: 'Slab mesh is lapped over the beams, then the slab and beam are poured together.' },
        { id: 'mem', name: 'Membrane', group: mem, explode: [0, -0.3, 0.2], anchor: [0.9, 0.003, 0.0], flag: 'V', src: 'abcb42', spec: 'Under every beam, laps at least 200 mm.', desc: 'Lines the bottom of the trenches. It runs up the sides of the trench too, as in the edge beam detail.' },
      ] };
    },
  },
};

/* ---------- 2D drawings ---------- */
function slabPlan() {
  const px = (x, z) => [90 + (x + 5.5) * 30, 80 + (z + 5.5) * 30];
  const rect = (a, b, c, d, cls) => { const [x, y] = px(a, c), [x2, y2] = px(b, d); return R(x, y, x2 - x, y2 - y, cls); };
  const [ox, oy] = px(X0, Z0), [ox2, oy2] = px(X1, Z1);
  const body = [
    R(0, 0, 760, 700, 'd-bg'), rect(X0, X1, Z0, Z1, 'd-slabfill'), ...BEAMS.map(([a, b, c, d]) => rect(a, b, c, d, 'd-beam')),
    `<polyline class="d-svc sewer" fill="none" points="${[[-3.6, 5.4], [-3.6, -5.3], [-3.6, -8]].map(([x, z]) => px(x, z).join(',')).join(' ')}"/>`,
    `<polyline class="d-svc sewer" fill="none" points="${[[-1.8, -1], [-3.6, -1]].map(([x, z]) => px(x, z).join(',')).join(' ')}"/>`,
    `<polyline class="d-svc water" fill="none" points="${[[-2, 13], [-2, 7]].map(([x, z]) => px(x, z).join(',')).join(' ')}"/>`,
    `<polyline class="d-svc storm" fill="none" points="${[[6.2, -4.5], [6.2, 12.4], [1, 12.4], [1, 13.2]].map(([x, z]) => px(x, z).join(',')).join(' ')}"/>`,
    ...RISERS.map(([x, z, k]) => Ci(...px(x, z), 6, k === 'sewer' ? 'd-rsewer' : 'd-rwater')),
    // section cuts
    L(ox - 36, px(0, 3)[1], px(-4.2, 3)[0], px(0, 3)[1], 'd-cut'), T(ox - 46, px(0, 3)[1] + 4, 'A', { anchor: 'end', cls: 'd-bold' }), T(px(-4.2, 3)[0] + 6, px(0, 3)[1] + 4, 'A', { cls: 'd-bold' }),
    L(px(-3.6, 0)[0] - 40, px(0, 2.4)[1], px(-3.6, 0)[0] + 40, px(0, 2.4)[1], 'd-cut'), T(px(-3.6, 0)[0] + 46, px(0, 2.4)[1] + 4, 'B', { cls: 'd-bold' }), T(px(-3.6, 0)[0] - 46, px(0, 2.4)[1] + 4, 'B', { anchor: 'end', cls: 'd-bold' }),
    dim(ox, oy - 26, ox2, oy - 26, '11 000'), dim(ox2 + 30, oy, ox2 + 30, oy2, '17 000'),
    dim(ox - 28, px(0, Z0)[1] + 0, ox - 28, px(0, 0)[1], '5 500'),
    call(1, ...px(X0 + 0.15, 8), ox - 70, px(0, 8)[1]), call(2, ...px(0, 8), ox2 + 70, px(0, 6)[1]), call(3, ...px(-3.6, 2.4), ox - 70, px(0, 1.5)[1] - 36),
    call(4, ...px(-0.9, 5.5), ox2 + 70, px(0, 14)[1] - 80), call(5, ...px(2, 2.8), ox2 + 70, px(0, 14)[1] - 20),
    T(560, 90, 'Notes', { cls: 'd-bold' }),
    ...['1  Edge beam 300 wide (typical)', '2  Internal beam 300 wide, bays about 5.5 m', '3  Sewer riser, sleeved and collared', '4  Beam junction, lapped bars 500 mm', '5  Slab mesh on chairs at 800 mm', 'A, B  Sections on the next drawings'].map((t, i) => T(560, 114 + i * 22, t)),
    T(560, 270, 'Typical only. Beam sizes, mesh and', { cls: 'd-mute' }), T(560, 288, 'bar sizes come from the engineer.', { cls: 'd-mute' }),
    `<g>${L(560, 330, 592, 330, 'd-svc sewer')}${T(600, 334, 'Sewer')}${L(560, 352, 592, 352, 'd-svc water')}${T(600, 356, 'Water')}${L(560, 374, 592, 374, 'd-svc storm')}${T(600, 378, 'Stormwater (outside slab)')}</g>`,
  ].join('');
  return svg(760, 700, body, 'Footing and slab plan');
}

function sectionA() {
  const s = 0.9, ox = 280, oy = 480, X = (m) => ox + s * m, Y = (m) => oy - s * m;
  const conc = [[0, 0], [300, 0], [300, 300], [900, 300], [900, 400], [110, 400], [110, 330], [0, 330]].map(([a, b]) => [X(a), Y(b)]);
  const body = [
    R(0, 0, 900, 600, 'd-bg'),
    R(X(-250), Y(250), s * 250, s * 650, 'd-soil'), R(X(0), Y(0), s * 900, s * 150, 'd-soil'), R(X(300), Y(250), s * 600, s * 250, 'd-soil'),
    R(X(300), Y(300), s * 600, s * 50, 'd-sand'),
    P(conc, 'd-conc'),
    `<polyline class="d-memb" fill="none" points="${[[0, 250], [0, 0], [300, 0], [300, 300], [900, 300]].map(([a, b]) => `${X(a)},${Y(b)}`).join(' ')}"/>`,
    ...[70, 150, 230].map((x) => Ci(X(x), Y(43), 5)), ...[170, 260].map((x) => Ci(X(x), Y(350), 5)),
    R(X(100), Y(30), s * 100, s * 30, 'd-chair'), R(X(590), Y(330), s * 24, s * 30, 'd-chair'),
    L(X(330), Y(338), X(880), Y(338), 'd-mesh'), ...[400, 600, 800].map((x) => Ci(X(x), Y(338), 3.5)),
    L(X(-250), Y(250), X(0), Y(250), 'd-ground'), T(X(-250) + 4, Y(250) - 6, 'Finished ground'),
    dim(X(920), Y(300), X(920), Y(400), '100 slab', -1), dim(X(-290), Y(0), X(-290), Y(400), '400 overall', 1), dim(X(0), Y(-30), X(300), Y(-30), '300 beam width'),
    dim(X(-60), Y(250), X(-60), Y(400), '150 exposed', 1), dim(X(0), Y(430), X(110), Y(430), '110 rebate', 1), dim(X(960), Y(250), X(960), Y(300), '50 sand', -1),
    call(1, X(-120), Y(120), X(-170), Y(-90)), call(2, X(700), Y(275), X(780), Y(225)), call(3, X(300), Y(140), X(430), Y(110)), call(4, X(210), Y(200), X(520), Y(180)),
    call(5, X(70), Y(43), X(20), Y(-90)), call(6, X(150), Y(15), X(180), Y(-90)), call(7, X(520), Y(338), X(650), Y(440)), call(8, X(55), Y(365), X(-130), Y(470)), call(9, X(0), Y(300), X(-160), Y(355)),
    T(40, 40, 'Section A-A: edge beam (typical, not to scale)', { cls: 'd-bold' }),
  ].join('');
  return svg(900, 600, body, 'Edge beam section');
}

function sectionB() {
  const s = 1.25, ox = 420, oy = 470, X = (m) => ox + s * m, Y = (m) => oy - s * m;
  const body = [
    R(0, 0, 900, 600, 'd-bg'),
    R(X(-330), Y(0), s * 660, s * 220, 'd-soil'), R(X(-330), Y(0), s * 660, s * 0.01, 'd-soil'),
    R(X(-330), Y(0), s * 660, s * 50, 'd-sand'),
    R(X(-330), Y(-100), s * 660, s * 100, 'd-sand'),
    R(X(-330), Y(-135), s * 275, s * 105, 'd-pipe'), R(X(-55), Y(300), s * 110, s * 435, 'd-pipe'),
    R(X(-330), Y(150), s * 245, s * 100, 'd-conc'), R(X(85), Y(150), s * 245, s * 100, 'd-conc'),
    R(X(-85), Y(150), s * 30, s * 100, 'd-lag'), R(X(55), Y(150), s * 30, s * 100, 'd-lag'),
    `<polyline class="d-memb" fill="none" points="${X(-330)},${Y(50)} ${X(-85)},${Y(50)} ${X(-85)},${Y(100)}"/>`,
    `<polyline class="d-memb" fill="none" points="${X(330)},${Y(50)} ${X(85)},${Y(50)} ${X(85)},${Y(100)}"/>`,
    R(X(-220), Y(58), s * 135, s * 8, 'd-collar'), R(X(85), Y(58), s * 135, s * 8, 'd-collar'),
    R(X(-58), Y(155), s * 12, s * 8, 'd-seal'), R(X(46), Y(155), s * 12, s * 8, 'd-seal'),
    L(X(-330), Y(95), X(-115), Y(95), 'd-mesh'), L(X(115), Y(95), X(330), Y(95), 'd-mesh'), Ci(X(-115), Y(95), 4), Ci(X(115), Y(95), 4),
    R(X(-65), Y(320), s * 130, s * 20, 'd-cap'),
    call(1, X(-250), Y(-120), X(-300), Y(-190)), call(2, X(-250), Y(-60), X(-200), Y(-190)), call(3, X(-55), Y(220), X(-170), Y(300)), call(4, X(-85), Y(75), X(-250), Y(30)),
    call(5, X(-160), Y(62), X(-270), Y(-30)), call(6, X(-72), Y(125), X(-60), Y(-230)), call(7, X(250), Y(110), X(300), Y(185)), call(8, X(-190), Y(95), X(-250), Y(210)), call(9, X(-52), Y(160), X(60), Y(260)),
    dim(X(340), Y(50), X(340), Y(150), '100 slab (typical)', -1),
    T(40, 40, 'Section B-B: sewer riser through the slab (typical, not to scale)', { cls: 'd-bold' }),
  ].join('');
  return svg(900, 600, body, 'Pipe penetration section');
}

const drawings = [
  { id: 'plan', title: 'Footing and slab plan', scale: 'Illustrative, 30 px per metre', svg: slabPlan(),
    notes: ['Edge beams and internal beams are shown as dark strips. Bays between them are the slab on the pad.', 'Section A-A cuts the edge beam. Section B-B cuts the sewer riser.', 'Sizes shown are typical only. The engineer\'s drawings govern and so does the permit.'] },
  { id: 'secA', title: 'Section A-A: edge beam', scale: 'Typical, not to scale',  svg: sectionA(),
    notes: ['1 Founding material. 2 Bedding sand. 3 Membrane, lapped at least 200 mm. 4 Concrete. 5 Trench mesh. 6 Spacers. 7 Slab mesh on chairs. 8 Rebate. 9 Exposed slab edge.', 'Cover: 40 mm to unprotected ground, 30 mm to a membrane in contact with the ground, 20 mm internal, 40 mm external exposure.', 'Open the 3D detail to take it apart and see how each layer sits.'] },
  { id: 'secB', title: 'Section B-B: pipe penetration', scale: 'Typical, not to scale', svg: sectionB(),
    notes: ['1 Pad and trench. 2 Bedding sand. 3 Riser and cap. 4 Membrane and taped collar. 5 Termite collar. 6 Compressible sleeve. 7 Slab concrete. 8 Mesh with trimmer bars. 9 Flexible sealant.', 'The membrane is sealed to the sleeve or pipe. Tape or seal around all service penetrations, with a close-fitting sleeve.', 'Confirm the termite system, sleeve and sealant products with the installer and your plumber.'] },
];

const howto = [
  ['Read the engineer\'s drawings and the soil report', 'Check them against the permit and endorsed plans. Note the site class, beam sizes, bar sizes, concrete grade and any hold points. Building to the permit is a core duty of the builder.', 'Builder and engineer', 'T'],
  ['Set out the building', 'Set out from the survey pegs, check diagonals, set levels from the datum, and erect profiles outside the dig.', 'Surveyor or builder', 'T'],
  ['Strip topsoil and form the pad', 'Remove topsoil and roots. Flat sites are generally level, with a slope no more than 1:40. Sloping sites no more than 1:10. Footing bottoms at least 300 mm below finished ground on loose sand or erodible sites.', 'Excavator', 'V', 'abcb42'],
  ['Dig edge beams and internal beams', 'Excavate to the engineer\'s sizes into founding material. Remove loose earth, roots, mud and debris. If the soil is not as reported, stop and call the engineer.', 'Excavator', 'V', 'abcb42'],
  ['Lay under-slab drainage and services', 'The plumber lays and tests sewer, stormwater and water pipes. The electrician lays conduits. Mark every riser against the plans and sleeve each penetration through a beam.', 'Plumber and electrician', 'C'],
  ['Place bedding and the termite barrier', 'Compact the bedding. Install the termite management system to AS 3660.1, including collars at penetrations, and keep the installer\'s certificate.', 'Termite installer', 'C'],
  ['Lay the membrane', '0.2 mm polyethylene, high impact resistance, with laps of at least 200 mm. Seal joins and punctures with tape and extra film. Seal around penetrations. Extend under the beams to finish at ground level.', 'Concreter', 'V', 'abcb42'],
  ['Fix the edge formwork', 'Set formwork to slab level and line. Check the slab edge is 150 mm or more above finished ground (confirm figure) and that the brick rebate is formed.', 'Concreter', 'T'],
  ['Fix the reinforcement', 'Trench mesh in the beams, slab mesh on chairs at no more than 800 mm centres. Cover: 40 mm to unprotected ground, 30 mm to membrane, 20 mm internal, 40 mm external. Laps: 500 mm for bars up to 12 mm and trench mesh, 700 mm for over 12 up to 16 mm.', 'Steel fixer', 'V', 'abcb42'],
  ['Hold point: inspection before the pour', 'Notify the RBS if reinforcement is a nominated stage and book the engineer. Do not go beyond the stage until it has been inspected.', 'Builder', 'V', 'vbaMand'],
  ['Order and place the concrete', 'N20 or better, 20 mm aggregate, nominal 100 mm slump, to the engineer\'s grade. Do not add water above the specified slump. Do not pour if site air temperature exceeds 32 degrees Celsius unless the engineer gives written instructions. Compact, screed and finish.', 'Concreter, supplier and pump', 'V', 'abcb42'],
  ['Cure and protect', 'Moist cure for 7 days including the edges. Finish the edges before curing. Keep stacked loads and plant off the slab for at least 7 days.', 'Concreter', 'V', 'abcb42'],
  ['Collect the paperwork', 'Engineer\'s certificate, plumber\'s certificate of compliance, termite certificate, concrete dockets, photos, and the RBS inspection record. File them for the final inspection.', 'Builder', 'T'],
];

const trades = [
  { t: 'Surveyor', role: 'Set-out of the building lines and levels. As-built survey of the slab if the permit asks for it.', when: 'Before excavation and after the pour', reg: 'Licensed surveyor', ask: ['Set-out price and return visit price', 'Level check before the pour', 'As-built plan if required'] },
  { t: 'Excavator operator', role: 'Strips topsoil, forms the pad, digs the beams and removes spoil.', when: 'After set-out', reg: 'Trade contractor with insurance', ask: ['Machine and operator rate', 'Spoil removal and tip fees', 'Trimming beams by hand'] },
  { t: 'Plumber (drainer)', role: 'Under-slab sewer, stormwater and water. Tests, inspections and the certificate of compliance.', when: 'After beams, before bedding', reg: 'Licensed plumber (drainer)', ask: ['Pipe, fittings and sleeves included', 'Inspection and test included', 'Certificate of compliance'] },
  { t: 'Electrician', role: 'Conduits for power and data under the slab.', when: 'With the plumber', reg: 'Licensed electrical contractor', ask: ['Conduit routes and pits', 'Draw cords left in conduits', 'Certificate of electrical safety later'] },
  { t: 'Termite installer', role: 'Termite management system and collars at penetrations.', when: 'Before the membrane or as the system requires', reg: 'Licensed pest control or installer', ask: ['System type and warranty', 'Certificate and durable notice', 'Inspection schedule'] },
  { t: 'Concreter', role: 'Formwork, membrane, placing, finishing and curing.', when: 'After services', reg: 'Trade contractor with insurance', ask: ['Labour only or supply and place', 'Formwork materials and strip', 'Finish type and curing method'] },
  { t: 'Steel fixer', role: 'Fixes trench mesh, slab mesh, chairs and laps to the drawings.', when: 'After the membrane', reg: 'Trade contractor with insurance', ask: ['Supply of steel and chairs', 'Cut and bend schedule', 'Re-fix after inspection'] },
  { t: 'Ready-mix supplier and pump', role: 'Supplies concrete to the order and pumps it to the slab.', when: 'On pour day', reg: 'Batching plant and pump company', ask: ['Price per cubic metre, short-load fee and minimum charge', 'Pump hire and boom reach', 'Additives, retarders and delivery spacing'] },
  { t: 'Structural engineer', role: 'Inspects reinforcement and issues the certificate.', when: 'Before the pour', reg: 'Registered engineer (confirm the current scheme)', ask: ['Inspection fee and notice needed', 'Certificate format for the RBS', 'Return visit fee'] },
  { t: 'Building surveyor (RBS)', role: 'Inspects at the nominated stages and keeps the record.', when: 'At each mandatory stage', reg: 'Registered building surveyor (BPC)', ask: ['Notice period for inspections', 'Fee per inspection', 'What documents to hold for the visit'] },
];

const materials = [
  ['Polyethylene concrete underlay', '0.2 mm nominal, high impact resistance, branded "AS 2870 Concrete underlay, 0.2 mm High impact resistance". Usually orange.', 'Reinforcing supplier (InfraBuild lists polyethylene building films). Some Bunnings stores stock concrete underlay, check the store.', 'V', 'Buy wide rolls to reduce laps. Check the branding on the roll.', 'abcb42'],
  ['Membrane tape', 'Polyethylene joining tape for laps, punctures and penetrations', 'Bunnings or reinforcing supplier', 'V', 'Laps at least 200 mm and taped.', 'abcb42'],
  ['Trench mesh', 'For example 3-L11TM. The engineer specifies the type and layers.', 'Reinforcing supplier (cut and delivered)', 'T', 'Order to the engineer\'s schedule.'],
  ['Slab mesh', 'For example SL82. Sheet size and type from the engineer.', 'Reinforcing supplier', 'T', 'Check the lap and trimmer bar notes.'],
  ['Bar chairs and block spacers', 'Chairs at no more than 800 mm centres. Wire chairs on membrane need flat bases.', 'Reinforcing supplier or Bunnings', 'V', 'Pick chairs to match the cover.', 'abcb42'],
  ['Tie wire and tie tool', 'Annealed tie wire for tying laps and chairs', 'Bunnings or reinforcing supplier', 'T', ''],
  ['Bedding sand or crushed rock', 'Clean sand with no gravel-size material for controlled fill. Blow count of 7 or more per 300 mm.', 'Landscape or quarry supplier', 'V', 'Order by the cubic metre.', 'abcb42'],
  ['Ready-mix concrete', 'N20 or better, 20 mm aggregate, nominal 100 mm slump. Higher grade if the drawings say.', 'Batching plants, for example Boral, Holcim or Hanson. Get three quotes.', 'V', 'Allow a little extra volume. Keep every docket.', 'abcb42'],
  ['Edge formwork boards', '190 x 45 MGP10 pine in 3.0 m lengths, or ply. Pegs or star pickets for support', 'Bunnings. Check the 190 x 45 MGP10 listing in your store.', 'T', 'MGP10 is machine graded pine, stress grade 10.'],
  ['Profile rails and stakes', '90 x 45 MGP10 H2 blue pine, 3.0 m', 'Bunnings (90 x 45mm MGP10 H2 blue pine 3.0m)', 'V', 'H2 is the treated grade for above-ground, protected timber.', 'bunnMGP'],
  ['PVC sewer and stormwater pipe and fittings', 'DN100 sewer, DN90 stormwater. Sleeves and lagging at beams', 'Plumbing wholesaler. The plumber supplies and warrants these', 'T', 'Owners and builders should not buy these separately.'],
  ['Termite management system', 'Physical collars or chemical reticulation to AS 3660.1', 'Installer', 'C', 'Certificate and durable notice are required.'],
  ['Conduit and draw cord', 'Heavy-duty conduit for power and data', 'Electrical wholesaler or the electrician', 'T', ''],
  ['Pipe lagging', 'Foam lagging for sleeving pipes through concrete', 'Bunnings or plumbing wholesaler', 'T', ''],
  ['Curing materials', 'Plastic sheet, hessian or curing compound, and water', 'Bunnings', 'T', 'Keep the edges moist too.'],
  ['Tools: levels, strings, pins', 'Laser level, string line, marking paint, tape measure', 'Bunnings', 'T', ''],
];

const quotes = [
  { who: 'Concreter', n: '3', what: ['Labour only or supply and place', 'Formwork, membrane, finish and curing', 'Allowance if the pour is delayed or re-booked'] },
  { who: 'Ready-mix supplier', n: '3', what: ['Price per cubic metre, minimum load and short-load fee', 'Pump hire, boom reach and hours', 'Additives, retarders and Saturday rates'] },
  { who: 'Reinforcing supplier', n: '2 to 3', what: ['Trench mesh, slab mesh, chairs and delivery', 'Cut and bend to the engineer\'s schedule', 'Return of damaged sheets'] },
  { who: 'Steel fixer', n: '2', what: ['Fix only, or supply and fix', 'Re-fix after inspection', 'Time needed before the engineer visits'] },
  { who: 'Plumber (drainer)', n: '3', what: ['Under-slab drainage and water', 'Test, inspection and certificate of compliance', 'Rework if the plans change'] },
  { who: 'Termite installer', n: '2 to 3', what: ['System type, warranty and certificate', 'Penetration collars', 'Re-treatment and inspection schedule'] },
  { who: 'Excavator', n: '2 to 3', what: ['Pad, beams and spoil removal', 'Hourly or fixed', 'Tip fees'] },
  { who: 'Structural engineer', n: '1 to 2', what: ['Inspection fee before the pour', 'Certificate for the RBS', 'Additional visit fee'] },
];
const quoteTips = [
  'Send the engineer\'s drawings and the permit stage list with every request, so the quote includes the hold points.',
  'Ask each supplier what is excluded. For the concreter, ask whether pumping, curing and edge finishing are in.',
  'For ready-mix, get the grade, slump, aggregate size and additives in writing on the quote, then match them to the drawings when ordering.',
  'Ask for the lead time. A concrete pour that is re-booked costs more than a price difference between quotes.',
  'Keep every quote and docket. They are evidence of estimating and ordering for the BPC application.',
];

const inspections = [
  ['Excavation and founding inspection', 'RBS and, if the engineer requires, the engineer', 'Before reinforcement and concrete', 'Beams at the right depth and width, bottoms clean and in the founding material, no loose earth or water.', 'C'],
  ['Under-slab drainage test and inspection', 'Plumber and plumbing inspector', 'Before the pipes are covered', 'Pipes at the right fall, tested, sleeved at beams, and the certificate of compliance followed up. Confirm the current plumbing inspection rules.', 'C'],
  ['Termite barrier certificate and notice', 'Installer', 'Before pouring if the system is under the slab', 'Collars are in place and undamaged. The installer\'s certificate and durable notice are kept.', 'C'],
  ['Membrane check', 'Builder and engineer', 'Before reinforcement', 'No tears. Laps at least 200 mm, taped. Penetrations sealed. Membrane extends under beams and finishes at ground level.', 'V', 'abcb42'],
  ['Reinforcement inspection (mandatory stage if nominated)', 'RBS and engineer', 'Before concrete is poured', 'Bar sizes, laps, cover, chairs at no more than 800 mm, free of loose rust, mud, paint and oil. Do not pour until it has been inspected.', 'V', 'vbaMand'],
  ['Concrete delivery check', 'Builder', 'During the pour', 'Docket matches the order, slump is as ordered, no added water above the slump, temperature rule followed.', 'V', 'abcb42'],
  ['Curing record', 'Builder', 'For 7 days after the pour', 'Moist cure on surfaces and edges. Nothing stacked on the slab and no plant.', 'V', 'abcb42'],
  ['Records for the surveyor', 'Builder', 'Before the next stage', 'Engineer\'s certificate, plumbing and termite certificates, dockets and photos on file.', 'T'],
];

const exam = [
  ['What membrane goes under a residential slab?', '0.2 mm nominal polyethylene film with high impact resistance, branded "AS 2870 Concrete underlay, 0.2 mm High impact resistance".', 'V'],
  ['What is the minimum lap in the membrane, and how are penetrations sealed?', 'At least 200 mm at all joints. Tape or seal with a close-fitting sleeve around penetrations, and seal punctures with extra film and tape.', 'V'],
  ['What concrete does the NCC deemed-to-satisfy text require for slabs?', 'Comply with AS 3600. N20 (20 MPa at 28 days), 20 mm aggregate, nominal 100 mm slump. Do not add water to exceed the slump.', 'V'],
  ['When must concrete not be poured without an engineer\'s written instructions?', 'If site air temperature exceeds 32 degrees Celsius.', 'V'],
  ['State the cover rules for reinforcement.', '40 mm to unprotected ground, 30 mm to a membrane in contact with the ground, 20 mm internal, 40 mm external exposure.', 'V'],
  ['What is the maximum spacing of bar chairs for steel fabric?', '800 mm centres.', 'V'],
  ['State the lap lengths for bars.', 'Bars up to 12 mm: 500 mm. Over 12 and up to 16 mm: 700 mm. Trench mesh: 500 mm.', 'V'],
  ['How long must a slab be cured and kept clear of stacked loads?', 'Moist cure for 7 days including the edges. No stacked loads or plant for at least 7 days.', 'V'],
  ['What is the minimum width of an edge beam at the base of the rebate?', '200 mm. It can reduce to 150 mm with R10 or N10 ties at 900 mm spacing, or equivalent.', 'V'],
  ['What slopes are allowed in the excavation base?', 'Flat sites generally level, with a slope no more than 1:40. Sloping sites no more than 1:10.', 'V'],
  ['What bearing pressure must natural soil have?', 'At least 50 kPa for slab panels. At least 100 kPa for pads and strip footings.', 'V'],
  ['Name the AS 2870 site classes.', 'A, S, M, H1, H2, E and P.', 'T'],
  ['What must the builder do at a mandatory notification stage?', 'Notify the RBS and not go beyond the stage until it has been inspected.', 'V'],
  ['What is the correct order: pour, membrane, reinforcement, inspection, bedding, drainage?', 'Drainage, bedding, membrane, reinforcement, inspection, pour.', 'T'],
];

export default {
  n: 2, id: 'slab', title: 'Footings and slab-on-ground', subtitle: 'From set-out to a cured slab, with every layer you can be asked about.',
  phases, build, details, drawings, howto, trades, materials, quotes, quoteTips, inspections, exam,
  sources: ['abcb42', 'hiaRaft', 'infra', 'bunnMGP', 'vbaMand', 'bpcMI01', 'hiaNcc25'],
  caution: 'Numeric rules marked Verified come from the NCC 2022 Housing Provisions Part 4.2 text. NCC 2025 applies in Victoria from 1 May 2026, so check the clause numbers and any changes in NCC Online before you rely on them in the exam.',
};

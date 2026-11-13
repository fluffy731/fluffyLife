// Step 4: roof framing with nail-plated trusses (fink trusses at 900 mm, crane lift, temporary and permanent bracing, battens).
// Sizes and spacings are typical. A real truss is designed by the truss manufacturer for the job, and its layout and bracing details govern.
// Standards (AS 4440, AS 1720.5, AS 1684) are paywalled and were not opened, so most rules here are Typical or Confirm.
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { buildBase, buildSiteWorks, HOUSE, BASE_COLLIDERS, MAP } from './site.js';
import { svg, T, L, R, P, dim, call } from './dwg.js';
import { F, buildFrames, buildSlab } from './frame.js';

const { z0: Z0, z1: Z1 } = HOUSE;
const TAN = Math.tan(Math.PI / 8), COS = Math.cos(Math.PI / 8);         // 22.5 degree pitch
const HS = 5.35, OVER = 0.45, PLATE_TOP = F.SLAB + F.H;                 // half span to the outer wall faces, eave overhang, top of the plates
const yc = (x, hs = HS) => (hs - Math.abs(x)) * TAN + 0.05;            // top chord centreline above the plate, at distance x from the centre
const ZS = []; for (let i = 0; i < 19; i++) ZS.push(Z1 - F.E - i * 0.9); ZS.push(Z0 + F.E);   // 20 trusses, front to back

const phases = [
  { title: 'Truss design and delivery', text: 'The manufacturer designs the trusses for this house. They arrive on a truck with a layout and are stacked flat and clear of the ground.' },
  { title: 'Crane and lift', text: 'A licensed crane lifts each truss onto the wall plates. The crew stands clear of the load and the overhead power lines.' },
  { title: 'Set out and fix trusses', text: 'Trusses are set at 900 mm centres from one end, plumbed, fixed to the plates and held by temporary runners as each goes up.' },
  { title: 'Permanent bracing', text: 'Ceiling and bottom-chord ties, diagonal braces and web bracing go in exactly where the manufacturer\'s layout shows.' },
  { title: 'Roof battens', text: 'Battens are fixed across the trusses at the spacing the roof cladding needs. They also brace the top chords.' },
  { title: 'Frame inspection hold point', text: 'The wall and roof frame are complete. The building surveyor inspects before any cladding or lining goes on.' },
];

// One fink truss in its own plane: x across, y up from the underside of the bottom chord (sits on the top plates), z through the thickness.
function trussParts(hs) {
  const timber = [], plates = [];
  const chord = (ax, ay, bx, by, depth = 0.09) => { const len = Math.hypot(bx - ax, by - ay); timber.push([len, depth, 0.035, (ax + bx) / 2, (ay + by) / 2, 0, Math.atan2(by - ay, bx - ax)]); };
  for (const sgn of [-1, 1]) chord(sgn * (hs + OVER), yc(hs, hs) - OVER * TAN, 0, yc(0, hs));          // top chords, eave tail to apex
  chord(-hs, 0.045, hs, 0.045);                                                                          // bottom chord
  const b1 = [-hs / 3, 0.045], b2 = [hs / 3, 0.045], mL = [-hs / 2, yc(hs / 2, hs)], mR = [hs / 2, yc(hs / 2, hs)], ap = [0, yc(0, hs) - 0.04];
  for (const [p, q] of [[b1, mL], [b1, ap], [b2, mR], [b2, ap]]) chord(p[0], p[1], q[0], q[1], 0.07);   // webs (fink pattern)
  for (const [x, y] of [[-hs, 0.09], [hs, 0.09], b1, b2, mL, mR, [0, yc(0, hs) - 0.02]]) for (const z of [-0.0195, 0.0195]) plates.push([0.2, 0.18, 0.004, x, y, z, 0]);
  return { timber, plates };
}
function mergeTruss(list, mat, boxUV, extra = {}) {
  const geos = list.map(([w, hh, d, x, y, z, rz]) => { const g = new extra.THREE.BoxGeometry(w, hh, d); if (mat.userData.uv) boxUV(g, w, hh, d, mat.userData.uv); g.rotateZ(rz || 0); g.translate(x, y, z); return g; });
  const g = mergeGeometries(geos, false); geos.forEach((q) => q.dispose()); return g;
}

function build(kit) {
  const { THREE, C, mat, box, cyl, rod, textPlane, lineSet, boxUV } = kit;
  const mk = (n) => { const g = new THREE.Group(); g.name = n; return g; };
  const base = buildBase(kit), w = buildSiteWorks(kit), slab = buildSlab(kit), fr = buildFrames(kit), G = fr.groups; fr.stand(1);
  const timber = mat(0xffffff, { tex: 'timber' }), plateM = mat(0xb9c1c9, { metalness: 0.7, roughness: 0.4 }), steel = mat(0xb8c0c9, { metalness: 0.6, roughness: 0.35 });
  const { timber: tl, plates: pl } = trussParts(HS), tg = mergeTruss(tl, timber, boxUV, { THREE }), pg = mergeTruss(pl, plateM, boxUV, { THREE });
  const inst = (geo, m, mats) => { const im = new THREE.InstancedMesh(geo, m, mats.length); mats.forEach((x, i) => im.setMatrixAt(i, x)); im.castShadow = true; im.receiveShadow = true; return im; };
  const M4 = new THREE.Matrix4(), Q = new THREE.Quaternion(), S1 = new THREE.Vector3(1, 1, 1);
  const standMats = ZS.map((z) => M4.clone().compose(new THREE.Vector3(0, PLATE_TOP, z), Q, S1));
  const trusses = mk('trusses'), tm = inst(tg, timber, standMats), tp = inst(pg, plateM, standMats); trusses.add(tm, tp);

  // delivery bundle: six trusses laid flat with bearers, in the front yard
  const bundle = mk('bundle'), flatQ = new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2, 0, 0));
  const flatMats = [0, 1, 2, 3, 4, 5].map((k) => M4.clone().compose(new THREE.Vector3(0, 0.2 + k * 0.075, 15.6), flatQ, S1));
  bundle.add(inst(tg, timber, flatMats), inst(pg, plateM, flatMats));
  for (const x of [-3.2, 0, 3.2]) bundle.add(box(0.12, 0.12, 2.4, mat(0x8a6a3c, { tex: 'timber' }), x, 0.06, 14.5));

  // crane: truck, outriggers, boom, hook and one truss on the sling
  const crane = mk('crane'), yel = mat(0xf2b01e), dk = mat(0x3c4a5c), tip = [0, 9.8, 11.3];
  crane.add(box(8.2, 1.0, 2.6, yel, 9.5, 0.9, 23.3), box(2.4, 1.7, 2.5, dk, 13.2, 1.45, 23.3), box(3.0, 1.4, 2.2, yel, 8.2, 1.9, 23.3));
  for (const dz of [-1.9, 1.9]) for (const dx of [-3, 3]) { crane.add(box(0.1, 0.9, 0.1, dk, 9.5 + dx, 0.5, 23.3 + dz)); crane.add(box(0.7, 0.05, 0.7, dk, 9.5 + dx, 0.03, 23.3 + dz)); }
  crane.add(rod([8, 2.4, 23.3], tip, 0.2, yel), cyl(0.2, 0.7, dk, 8, 2.1, 23.3, 12));
  crane.add(rod(tip, [0, 6.3, 11.3], 0.012, dk), cyl(0.2, 0.3, dk, ...tip, 12));
  crane.add(rod([0, 6.4, 11.3], [-1.9, 6.15 + yc(-1.9) - 0.05, 11.3], 0.01, dk), rod([0, 6.4, 11.3], [1.9, 6.15 + yc(1.9) - 0.05, 11.3], 0.01, dk));
  const hang = inst(tg, timber, [M4.clone().compose(new THREE.Vector3(0, 6.1, 11.3), Q, S1)]), hangP = inst(pg, plateM, [M4.clone().compose(new THREE.Vector3(0, 6.1, 11.3), Q, S1)]);
  crane.add(hang, hangP);

  // temporary runners and diagonals (top chord plane), permanent bracing, battens
  const zf = Z1 - F.E, zb = Z0 + F.E, len = zf - zb, zm = (zf + zb) / 2, py = (x) => PLATE_TOP + yc(x);
  const temp = mk('temp');
  for (const x of [-HS / 2, 0, HS / 2]) temp.add(rod([x, py(x) + 0.07, zb], [x, py(x) + 0.07, zf], 0.02, mat(0xffffff, { tex: 'timber', color: 0xe8c690 })));
  for (const [x0, x1] of [[-HS / 2, 0], [0, HS / 2]]) for (const [za, zz] of [[zb, zb + 3.6], [zf, zf - 3.6]]) temp.add(rod([x0, py(x0) + 0.06, za], [x1, py(x1) + 0.06, zz], 0.014, mat(0xffffff, { tex: 'timber', color: 0xe8c690 })));
  const perm = mk('perm');
  for (const x of [-3.6, -1.2, 1.2, 3.6]) perm.add(rod([x, PLATE_TOP + 0.12, zb], [x, PLATE_TOP + 0.12, zf], 0.016, steel));
  for (const [za, zz] of [[zb, zb + 3.6], [zf, zf - 3.6]]) { perm.add(rod([-3.6, PLATE_TOP + 0.12, za], [3.6, PLATE_TOP + 0.12, zz], 0.012, steel)); perm.add(rod([3.6, PLATE_TOP + 0.12, za], [-3.6, PLATE_TOP + 0.12, zz], 0.012, steel)); }
  for (const x of [-0.89, 0.89]) perm.add(rod([x, PLATE_TOP + 1.2, zb], [x, PLATE_TOP + 1.2, zf], 0.016, mat(0xffffff, { tex: 'timber', color: 0xe8c690 })));
  const battens = mk('battens'), bgeos = [];
  for (const sgn of [-1, 1]) for (let d = 0.25; d < (HS + OVER) / COS - 0.1; d += 0.33) {
    const x = sgn * (HS + OVER - d * COS); if (Math.abs(x) < 0.12) continue;
    const g = new THREE.BoxGeometry(0.07, 0.035, len + 0.8); boxUV(g, 0.07, 0.035, len + 0.8, 'long'); g.rotateZ(-sgn * Math.PI / 8); g.translate(x, PLATE_TOP + yc(x) + 0.075, zm); bgeos.push(g);
  }
  const bm = new THREE.Mesh(mergeGeometries(bgeos, false), timber); bm.castShadow = true; bm.receiveShadow = true; battens.add(bm);

  const hold = mk('hold'), sign = textPlane(['STOP: HOLD POINT', 'Frame inspection', 'No lining or cladding until signed off'], 1.8, 0.9);
  sign.position.set(0, 1.5, Z1 + 1.3); hold.add(sign, cyl(0.04, 1.6, mat(C.steel), -0.8, 0.8, Z1 + 1.28, 8), cyl(0.04, 1.6, mat(C.steel), 0.8, 0.8, Z1 + 1.28, 8));

  let n = 0; const setN = (v) => { n = v; tm.count = tp.count = Math.max(0, Math.min(ZS.length, Math.floor(v))); };
  setN(ZS.length);
  const tickers = [(dt) => {
    const after = perm.visible || battens.visible || hold.visible;
    if (after) { if (n < ZS.length) setN(ZS.length); return; }
    if (!trusses.visible) { if (n) setN(0); return; }
    if (n < ZS.length) setN(n + dt * 2.2);
  }];

  const layers = [
    { group: base }, { group: w.fence }, { group: w.sign }, { group: w.silt }, { group: w.entry }, { group: w.amenities }, { group: slab },
    { group: G.walls }, { group: G.plate2 }, { group: G.brace }, { group: G.tie },
    { group: bundle, until: 2 }, { group: crane, from: 1, until: 3 }, { group: trusses, from: 2 }, { group: temp, from: 2, until: 4 }, { group: perm, from: 3 }, { group: battens, from: 4 }, { group: hold, from: 5 },
  ];

  return {
    layers, colliders: BASE_COLLIDERS, tickers,
    spawn: { pos: [3.5, 18.5], yaw: 0, pitch: 0.14 }, map: MAP,
    orbit: { pos: [17, 13, 26], target: [0, 3.2, 4] },
    hotspots: [
      { id: 'design', title: 'Truss design and delivery', pos: [0, 0.8, 15.6], stand: [-3.5, 19], from: 0, until: 2, drawing: 'truss',
        summary: 'A truss is a factory-made, engineered frame. The manufacturer designs it for this house from the spans, pitch, roof weight and wind class you give them.',
        learn: [['Give the manufacturer the plans, wind classification, roof cladding type (tile or sheet), pitch, overhangs and any point loads. They design every truss and issue a layout and a design certificate.', 'T'], ['Trusses are made with pressed steel nail plates. Installation follows the manufacturer\'s layout and bracing details and the installation Standard, AS 4440. Confirm the current edition.', 'C'], ['Stack the bundle flat on bearers, clear of the ground, and cover it. Do not lift a truss by one point or stand it on its end for long.', 'T'], ['Check the delivery against the layout: every truss, correct type and mark, undamaged plates, straight chords.', 'T']] },
      { id: 'crane', title: 'Crane lift and exclusion zone', pos: [8.2, 2.6, 23.3], stand: [6, 18], from: 1, until: 3,
        summary: 'A licensed crane operator and a dogger or rigger lift the trusses. Plan the lift, keep people out from under the load, and check for overhead power lines first.',
        learn: [['Check the ground, access and the position of overhead power lines before the crane arrives. The distribution business and WorkSafe set the safe distances, so confirm them.', 'C'], ['The lift is run by a licensed crane operator with a licensed dogger or rigger. A lift plan is part of the safe work method.', 'T'], ['Nobody stands under or near a suspended load. Mark and keep an exclusion zone on the ground.', 'T'], ['Lift trusses by the points the manufacturer shows, with slings that do not crush the plates.', 'T']] },
      { id: 'set', title: 'Truss set-out and fixing', pos: [0, PLATE_TOP + 2.35, Z1 - F.E], stand: [0, 17.8], from: 2, detail: 'truss', drawing: 'truss',
        summary: 'Trusses go on at 900 mm centres from the first one, plumb, straight and fixed to the top plates with the connectors the design asks for.',
        learn: [['Typical spacing is 900 mm for sheet roofs and tile roofs often use 600 mm to 900 mm, but the manufacturer\'s layout sets it. Do not change it.', 'C'], ['Fix each truss to the wall plates with the connectors and nails on the layout. These form part of the tie-down chain from Step 3.', 'C'], ['Never cut, notch, drill or remove part of a truss. Any change needs the truss designer\'s written approval.', 'T'], ['Plumb the first truss and brace it to a solid point. Each next truss is fixed to the runners and then plumbed.', 'T']] },
      { id: 'temp', title: 'Temporary runners and bracing', pos: [0, PLATE_TOP + yc(0) + 0.2, 5], stand: [0, 18.4], from: 2, until: 4,
        summary: 'Until the permanent bracing and battens are in, runners and diagonals hold the trusses upright. Unbraced trusses can fall over like dominoes.',
        learn: [['Temporary bracing goes in as the trusses go up, in the layout shown on the manufacturer\'s details. Do not leave a truss unbraced overnight.', 'T'], ['Keep temporary bracing until the permanent bracing and battens are fixed. Check it again after strong wind.', 'T'], ['Do not stack battens, sheets or tiles on the trusses in one spot. They are designed for the roof load in a spread pattern.', 'T']] },
      { id: 'heights', title: 'Work at heights', pos: [5.7, PLATE_TOP + 0.4, 2], stand: [7.2, 8], from: 2, until: 5,
        summary: 'Roof framing is high-risk work. Edge protection, scaffold or a work platform is planned before anyone goes up.',
        learn: [['Work where a person could fall more than two metres is high-risk construction work that needs a safe work method statement. Confirm the current wording with WorkSafe Victoria.', 'C'], ['Use edge protection, scaffold or an elevated work platform. Do not rely on a harness alone for ordinary roof framing.', 'T'], ['Walk only on the truss members the manufacturer allows, and never on a bottom chord alone with no support.', 'T']] },
      { id: 'brace', title: 'Permanent bracing', pos: [0.89, PLATE_TOP + 1.2, 3], stand: [2.4, 3.2], from: 3, detail: 'trussbrace', drawing: 'truss',
        summary: 'Permanent bracing keeps the trusses in line and tied together so they act as a roof. It goes in exactly where the manufacturer\'s layout shows.',
        learn: [['Bracing includes top-chord runners or battens, bottom-chord ties, diagonal braces in the plane of the roof and the ceiling, and web bracing. The layout shows which ones apply.', 'T'], ['Fix every brace with the nails or connectors listed. A brace that is only tacked on does not work.', 'C'], ['Do not cut a brace for a service, and do not remove one without the engineer\'s approval.', 'T']] },
      { id: 'batten', title: 'Roof battens', pos: [3.2, PLATE_TOP + yc(3.2) + 0.3, 5], stand: [7, 5], from: 4, drawing: 'roofplan',
        summary: 'Battens are fixed across the trusses at the spacing the cladding needs. Tiles use a gauge set by the tile maker, and metal sheets use the spacing from the manufacturer.',
        learn: [['Batten size, spacing and fixing come from the cladding manufacturer, and the truss design must allow for the roof weight.', 'C'], ['Battens also help to brace the top chords, so fix them to every truss with the correct nails.', 'T'], ['Sarking, battens and the cladding follow in Step 5.', 'T']] },
      { id: 'hold', title: 'Frame inspection hold point', pos: [0, 1.5, Z1 + 1.3], stand: [0, 17], from: 5,
        summary: 'The wall and roof frame are complete. The building surveyor inspects at the frame stage, and nothing is lined or clad until it is passed.',
        learn: [['The frame stage is a mandatory notification stage if the permit nominates it. Notify the RBS and do not go beyond the stage until it has been inspected.', 'V', 'vbaMand'], ['Have ready: the engineer\'s frame certificate, the truss design and layout certificate, bracing details, product data and delivery dockets.', 'T'], ['Check: walls plumb, trusses at the right spacing and fixed, bracing and tie-down complete, no cut or damaged members.', 'T']] },
    ],
  };
}

/* ---------- 3D detail models ---------- */
const trussDetail = (kit, hs, count, gap) => {
  const { THREE, mat, boxUV } = kit, timber = mat(0xffffff, { tex: 'timber' }), plateM = mat(0xb9c1c9, { metalness: 0.7, roughness: 0.4 });
  const { timber: tl, plates: pl } = trussParts(hs);
  const sel = (fn) => tl.filter(fn);
  const one = (list, m, z) => { const g = mergeTruss(list.map(([w, h, d, x, y, zz, r]) => [w, h, d, x, y, (zz || 0) + z, r]), m, boxUV, { THREE }); const mesh = new THREE.Mesh(g, m); mesh.castShadow = mesh.receiveShadow = true; return mesh; };
  return { THREE, timber, plateM, tl, pl, sel, one, count, gap };
};

const details = {
  truss: {
    title: 'Fink roof truss', sub: 'Top chords, bottom chord, webs and pressed nail plates', floor: -0.05, gridSize: 7,
    camera: { pos: [3.1, 1.9, 4.3], target: [0, 0.85, 0] },
    build(kit) {
      const hs = 2.4, D = trussDetail(kit, hs, 1, 0), { THREE, ghost, box } = kit, mk = () => new THREE.Group(), grp = (m) => { const g = mk(); g.add(m); return g; };
      const tops = D.tl.slice(0, 2), bottom = D.tl.slice(2, 3), webs = D.tl.slice(3);
      const front = D.pl.filter((q) => q[5] > 0), back = D.pl.filter((q) => q[5] < 0);
      const wall = mk(); wall.add(kit.box(0.09, 0.4, 1.0, D.timber, -hs + 0.045, -0.29, 0)); wall.add(kit.box(0.09, 0.045, 1.0, D.timber, -hs + 0.045, -0.0675, 0)); wall.add(kit.box(0.09, 0.045, 1.0, D.timber, -hs + 0.045, -0.0225, 0));
      const strap = mk(); strap.add(kit.box(0.003, 0.6, 0.03, D.plateM, -hs + 0.0965, -0.16, 0.0)); strap.add(kit.box(0.1, 0.003, 0.03, D.plateM, -hs + 0.145, 0.095, 0.0));
      return { parts: [
        { id: 'top', name: 'Top chords (rafters)', group: grp(D.one(tops, D.timber, 0)), explode: [0, 0.55, 0], anchor: [-1.1, yc(-1.1, hs), 0], flag: 'T', spec: 'Typically 90 x 35 stress-graded pine. Size and grade come from the truss design.',
          desc: 'The sloping members that carry the roof cladding load. They are in compression and bending. The eave overhang is cut as part of the top chord, so never trim it.' },
        { id: 'bottom', name: 'Bottom chord', group: grp(D.one(bottom, D.timber, 0)), explode: [0, -0.55, 0], anchor: [1.0, 0.045, 0], flag: 'T', spec: 'Sits on the wall plates. Ceiling battens or plasterboard fix to it.',
          desc: 'Ties the heels together so the truss pushes down rather than out. It carries the ceiling load. It must be restrained along its length by the ceiling battens or ties.' },
        { id: 'webs', name: 'Webs', group: grp(D.one(webs, D.timber, 0)), explode: [0, 0, 0.7], anchor: [-0.7, 0.55, 0], flag: 'T', spec: 'Smaller section, as designed. The pattern here is a fink.',
          desc: 'The diagonal members between the chords. They split the span so the chords can be smaller. Removing, cutting or drilling a web changes how the whole truss works.' },
        { id: 'platesF', name: 'Nail plates (front face)', group: grp(D.one(front, D.plateM, 0)), explode: [0, 0, 1.2], anchor: [0, yc(0, hs) - 0.02, 0.02], flag: 'T', spec: 'Pressed galvanised steel plates, pressed in by the fabricator at every joint.',
          desc: 'They hold each joint together. Do not hammer, bend or remove one. Damaged plates need the manufacturer\'s approved repair.' },
        { id: 'platesB', name: 'Nail plates (rear face)', group: grp(D.one(back, D.plateM, 0)), explode: [0, 0, -1.2], anchor: [-hs / 3, 0.045, -0.02], flag: 'T', spec: 'The same plates are pressed on the other face.',
          desc: 'The same joint is pressed from both sides, so each joint has a plate on the front and the back.' },
        { id: 'wall', name: 'Wall plates and stud', group: wall, explode: [-0.5, -0.1, 0], anchor: [-hs + 0.045, -0.29, 0.5], flag: 'T', spec: 'Top plates carry the truss at the heel.',
          desc: 'The truss bears on the wall top plates. Wherever possible it sits directly over a stud, so the load goes straight down.' },
        { id: 'strap', name: 'Heel tie-down strap', group: strap, explode: [-0.35, 0.3, 0], anchor: [-hs + 0.0965, -0.16, 0], flag: 'C', spec: 'Tie-down connector to the manufacturer\'s table, with every nail hole filled.',
          desc: 'Part of the tie-down chain from Step 3. It stops the truss lifting off the wall in high wind.' },
      ] };
    },
  },

  trussbrace: {
    title: 'Roof bracing', sub: 'Runners, bottom-chord ties, diagonals and web bracing across three trusses', floor: -0.05, gridSize: 8,
    camera: { pos: [3.4, 2.6, 5.4], target: [0, 1.0, 0.9] },
    build(kit) {
      const hs = 2.4, D = trussDetail(kit, hs, 3, 0.9), { THREE, mat, rod, box } = kit, mk = () => new THREE.Group();
      const trussG = mk(); const zs = [0, 0.9, 1.8, 2.7]; for (const z of zs) { trussG.add(D.one(D.tl, D.timber, z)); trussG.add(D.one(D.pl, D.plateM, z)); }
      const steel = mat(0xb8c0c9, { metalness: 0.6, roughness: 0.35 }), ply = mat(0xffffff, { tex: 'timber', color: 0xe8c690 });
      const L0 = zs[0] - 0.05, L1 = zs[3] + 0.05;
      const run = mk(); for (const x of [-hs / 2, 0, hs / 2]) run.add(rod([x, yc(x, hs) + 0.07, L0], [x, yc(x, hs) + 0.07, L1], 0.02, ply));
      const bot = mk(); for (const x of [-1.2, 0, 1.2]) bot.add(rod([x, 0.12, L0], [x, 0.12, L1], 0.016, steel));
      const diag = mk(); diag.add(rod([-1.2, 0.12, zs[0]], [1.2, 0.12, zs[3]], 0.012, steel)); diag.add(rod([1.2, 0.12, zs[0]], [-1.2, 0.12, zs[3]], 0.012, steel));
      const web = mk(); for (const x of [-0.8, 0.8]) web.add(rod([x, 1.05, L0], [x, 1.05, L1], 0.016, ply));
      const dtop = mk(); dtop.add(rod([-hs / 2, yc(-hs / 2, hs) + 0.06, zs[0]], [0, yc(0, hs) + 0.06, zs[3]], 0.014, ply)); dtop.add(rod([hs / 2, yc(hs / 2, hs) + 0.06, zs[0]], [0, yc(0, hs) + 0.06, zs[3]], 0.014, ply));
      return { parts: [
        { id: 'trusses', name: 'Trusses at 900 mm centres', group: trussG, explode: [0, 0, 0], anchor: [-1.9, 0.6, 0], flag: 'T', spec: 'Four trusses shown. Spacing and type come from the manufacturer\'s layout.',
          desc: 'On their own, trusses are flat frames that can fall sideways. The bracing is what locks them into a roof structure.' },
        { id: 'run', name: 'Top chord runners and battens', group: run, explode: [0, 0.6, 0], anchor: [0, yc(0, hs) + 0.07, 1.0], flag: 'T', spec: 'Temporary runners first, then battens or purlins fixed to every truss.',
          desc: 'Keep the top chords at the right spacing and stop them buckling sideways. Battens do this job in the finished roof.' },
        { id: 'dtop', name: 'Top chord diagonal bracing', group: dtop, explode: [0, 0.35, 0.5], anchor: [-0.6, yc(-0.6, hs) + 0.06, 1.2], flag: 'C', spec: 'Diagonals in the plane of the roof, placed as the layout shows.',
          desc: 'They stop the whole row of trusses leaning one way. Check the number, angle and fixings against the layout.' },
        { id: 'bot', name: 'Bottom chord ties', group: bot, explode: [0, -0.5, 0], anchor: [1.2, 0.12, 0.6], flag: 'C', spec: 'Ceiling battens or bracing ties across the bottom chords at the spacing in the layout.',
          desc: 'They stop the bottom chords bowing sideways. In the finished house the ceiling battens do much of this job.' },
        { id: 'diag', name: 'Diagonal braces (ceiling plane)', group: diag, explode: [0, -0.3, 0.7], anchor: [0, 0.12, 1.35], flag: 'C', spec: 'Crossed diagonals fixed to every truss they cross.',
          desc: 'They keep the whole roof square, so it resists the wind pushing on it from the end.' },
        { id: 'web', name: 'Web bracing', group: web, explode: [0, 0.2, -0.6], anchor: [0.8, 1.05, 0.4], flag: 'C', spec: 'Continuous members along the webs where the layout calls for them.',
          desc: 'They restrain long webs from buckling. They are only needed where the manufacturer\'s layout shows them.' },
      ] };
    },
  },
};

/* ---------- 2D drawings ---------- */
function trussElev(withBrace) {
  const hs = 5.35, s = 76, ox = 450, oy = 470, X = (m) => ox + s * m, Y = (m) => oy - s * m, body = [R(0, 0, 900, 600, 'd-bg')];
  const { timber: tl, plates: pl } = trussParts(hs);
  for (const [w, h, , x, y, , rz] of tl) {
    const c = Math.cos(rz), sn = Math.sin(rz), pts = [[-w / 2, -h / 2], [w / 2, -h / 2], [w / 2, h / 2], [-w / 2, h / 2]].map(([a, b]) => [X(x + a * c - b * sn), Y(y + a * sn + b * c)]);
    body.push(P(pts, 'd-timber'));
  }
  for (const [, , , x, y, z] of pl) if (z > 0) body.push(R(X(x) - 7, Y(y) - 7, 14, 14, 'd-collar'));
  body.push(R(X(-hs - 0.1), Y(0), s * 0.2, s * 0.09, 'd-timberx'), R(X(hs - 0.1), Y(0), s * 0.2, s * 0.09, 'd-timberx'), L(X(-hs - 1), Y(-0.1), X(hs + 1), Y(-0.1), 'd-ground'));
  body.push(dim(X(-hs), Y(-0.1) + 28, X(hs), Y(-0.1) + 28, '10 700 span (wall faces)'), dim(X(hs + 0.65), Y(0), X(hs + 0.65), Y(hs * TAN), '2 216 rise', -1), T(X(2.6), Y(0.55), '22.5 degrees', { cls: 'd-mute' }));
  if (withBrace) {
    for (const x of [-hs / 2, 0, hs / 2]) body.push(R(X(x) - 6, Y(yc(x, hs) + 0.11) - 6, 12, 12, 'd-ply'));
    for (const x of [-3.6, -1.2, 1.2, 3.6]) body.push(R(X(x) - 5, Y(0.14) - 5, 10, 10, 'd-ply'));
    for (const x of [-0.89, 0.89]) body.push(R(X(x) - 5, Y(1.15) - 5, 10, 10, 'd-ply'));
    body.push(call(1, X(0), Y(yc(0, hs) + 0.11), X(0), Y(3.1)), call(2, X(-3.6), Y(0.14), X(-4.4), Y(1.2)), call(3, X(0.89), Y(1.15), X(2.2), Y(2.0)), call(4, X(hs / 2), Y(yc(hs / 2, hs) + 0.11), X(3.9), Y(3.0)));
    body.push(T(40, 40, 'Truss bracing positions (typical, not to scale)', { cls: 'd-bold' }), ...['1  Ridge runner or batten', '2  Bottom chord tie or ceiling batten', '3  Web brace, where the layout shows', '4  Top chord runner or batten'].map((t, i) => T(40, 70 + i * 20, t)));
  } else {
    const tp = [-hs, 0.045], b1 = -hs / 3;
    body.push(call(1, X(-hs / 2), Y(yc(hs / 2, hs)), X(-4.8), Y(3.4)), call(2, X(1), Y(0.045), X(2.4), Y(-1.0)), call(3, X(b1), Y(0.6), X(-1.9), Y(2.0)), call(4, X(-hs / 3 - 0.9), Y(1.15), X(-4.2), Y(0.9)), call(5, X(0), Y(yc(0, hs) - 0.02), X(0), Y(3.3)), call(6, X(-hs), Y(0.09), X(-5.9), Y(0.6)), call(7, X(-hs - 0.35), Y(-0.1), X(-5.8), Y(-1.0)));
    body.push(T(40, 40, 'Fink truss elevation (typical, not to scale)', { cls: 'd-bold' }));
  }
  return svg(900, 600, body.join(''), withBrace ? 'Truss bracing positions' : 'Truss elevation');
}

function roofPlan() {
  const k = 32, px = (x, z) => [90 + (x + 5.5) * k, 80 + (z + 5.5) * k], zf = Z1 - F.E, zb = Z0 + F.E, body = [R(0, 0, 900, 720, 'd-bg')];
  const [x0, y0] = px(-5.5 - OVER, -5.5 - OVER), [x1, y1] = px(5.5 + OVER, 11.5 + OVER);
  body.push(R(x0, y0, x1 - x0, y1 - y0, 'd-slabfill'));
  for (const z of ZS) body.push(L(...px(-HS - OVER, z), ...px(HS + OVER, z), 'd-beam'));
  body.push(L(...px(0, zb - 0.3), ...px(0, zf + 0.3), 'd-cut'));
  for (const x of [-HS / 2, HS / 2]) body.push(L(...px(x, zb), ...px(x, zf), 'd-mesh'));
  for (const [za, zz] of [[zb, zb + 3.6], [zf, zf - 3.6]]) { body.push(L(...px(-3.6, za), ...px(3.6, zz), 'd-strap'), L(...px(3.6, za), ...px(-3.6, zz), 'd-strap')); }
  for (const x of [-3.6, -1.2, 1.2, 3.6]) body.push(L(...px(x, zb), ...px(x, zf), 'd-wrap'));
  body.push(dim(x0, y0 - 28, x1, y0 - 28, '11 900 overall with eaves'), dim(x1 + 34, y0, x1 + 34, y1, '17 900 overall with eaves'), dim(...px(-5.5 - 1.2, ZS[0]), ...px(-5.5 - 1.2, ZS[1]), '900', 1),
    call(1, ...px(-3.5, ZS[5]), x0 - 62, px(0, ZS[5])[1]), call(2, ...px(0, 3), x1 + 100, px(0, 3)[1]), call(3, ...px(-HS / 2, 6), x0 - 62, px(0, 8)[1]), call(4, ...px(1.2, zb + 0.3), x1 + 100, px(0, -3)[1]),
    call(5, ...px(0.2, zb + 2.0), x1 + 100, px(0, 0)[1] + 20), call(6, ...px(2.4, zf - 1.6), x1 + 100, px(0, 10)[1]),
    T(560, 90, 'Key', { cls: 'd-bold' }), ...['1  Truss at 900 mm centres', '2  Ridge line', '3  Top chord runners and battens', '4  Bottom chord ties (ceiling)', '5  Diagonal bracing, top plane (dashed)', '6  Diagonal bracing, ceiling plane (dashed)'].map((t, i) => T(560, 114 + i * 22, t)),
    T(560, 270, 'Typical only. The truss manufacturer\'s', { cls: 'd-mute' }), T(560, 288, 'layout and bracing details govern.', { cls: 'd-mute' }));
  return svg(900, 720, body.join(''), 'Roof framing plan');
}

// Large-scale detail at the truss heel: how the roof meets the wall and how the truss is held down. About 1 px per mm, all sizes typical.
function heelDetail() {
  const body = [R(0, 0, 900, 820, 'd-bg')], t = Math.tan(22.5 * Math.PI / 180), depth = 90 / Math.cos(22.5 * Math.PI / 180);
  const low = (x) => 330 - t * (x - 395);                 // underside of the top chord, passing over the heel at the wall frame
  const open = (pts, cls) => `<path d="M${pts.map((q) => q.join(' ')).join(' L')}" class="${cls}" fill="none"/>`;
  body.push(R(505, 230, 395, 190, 'd-ins'));               // ceiling insulation beyond the truss
  body.push(R(395, 330, 505, 90, 'd-timber'));             // bottom chord
  body.push(P([[100, low(100)], [900, low(900)], [900, low(900) - depth], [100, low(100) - depth]], 'd-timber'));   // top chord and tail
  body.push(R(400, 300, 120, 100, 'd-collar'));            // nail plate at the heel
  for (const x of [97, 160, 250, 340, 430, 520, 610, 700, 790]) body.push(R(x - 19 - 0, low(x) - depth - 26, 38, 26, 'd-timberx'));
  body.push(open([[100, low(100) - depth - 2], [900, low(900) - depth - 2]], 'd-wrap'));            // sarking
  body.push(open([[60, low(60) - depth - 30], [900, low(900) - depth - 30]], 'd-memb'));             // roof cover on the battens
  body.push(R(75, low(100) - 6, 25, 190, 'd-timber'));     // fascia
  body.push(open([[8, low(100) + 20], [8, low(100) + 120], [66, low(100) + 120], [74, low(100) + 10]], 'd-line'));   // gutter
  body.push(R(100, 536, 140, 9, 'd-board'));               // eave lining
  body.push(R(395, 420, 90, 45, 'd-timber'), R(395, 465, 90, 45, 'd-timber'), L(395, 420, 485, 465, 'd-line'), L(485, 420, 395, 465, 'd-line'), L(395, 465, 485, 510, 'd-line'), L(485, 465, 395, 510, 'd-line'));
  body.push(R(395, 510, 90, 230, 'd-timber'), R(485, 430, 10, 310, 'd-board'), R(495, 420, 405, 10, 'd-board'), L(392, 420, 392, 740, 'd-wrap'));
  body.push(R(240, 552, 110, 188, 'd-brick'));
  for (const y of [638, 724]) body.push(L(240, y, 350, y, 'd-line'));
  body.push(open([[388, 340], [380, 340], [380, 600], [392, 600]], 'd-strap'));   // tie-down strap, truss to plates and stud
  body.push(open([[230, 748], [300, 734], [290, 752], [505, 736]], 'd-line'));   // break line
  body.push(dim(240, 775, 350, 775, '110', -1), dim(395, 775, 485, 775, '90', -1), dim(560, 330, 560, 420, '90', 1), T(640, 120, '22.5 degree pitch', { cls: 'd-mute' }));
  body.push(call(1, 700, low(700) - depth - 30, 760, 70), call(2, 560, low(560) - depth - 2, 640, 60), call(3, 300, low(300) - 45, 200, 150), call(4, 700, 375, 760, 470),
    call(5, 460, 350, 600, 260), call(6, 380, 470, 300, 470), call(7, 440, 465, 600, 520), call(8, 440, 650, 600, 640), call(9, 40, low(100) + 90, 40, 420),
    call(10, 170, 540, 170, 610), call(11, 295, 600, 200, 690), call(12, 760, 300, 840, 470));
  body.push(T(40, 26, 'Truss heel detail: where the roof sits on the wall', { cls: 'd-bold' }));
  ['Roof cover on battens', 'Sarking under the battens', 'Top chord and eave tail', 'Bottom chord on the plates', 'Nail plate at the heel', 'Tie-down strap or anchor',
    'Double top plate (cut)', 'Stud below', 'Fascia and gutter', 'Eave lining on trimmers', 'Brick veneer, gap under lining', 'Ceiling insulation']
    .forEach((x, i) => body.push(T(650, 568 + i * 17, `${i + 1}  ${x}`)));
  body.push(T(40, 812, 'Typical, about 1:5. Our own drawing. Tie-down type, size and spacing come from the truss maker’s layout and AS 1684 for the wind class.', { cls: 'd-mute' }));
  return svg(900, 820, body.join(''), 'Truss heel and tie-down detail');
}

const drawings = [
  { id: 'truss', title: 'Fink truss elevation', scale: 'Typical, not to scale', svg: trussElev(false),
    notes: ['1 Top chord. 2 Bottom chord. 3 Long web. 4 Short web. 5 Nail plate at the apex. 6 Heel and bearing on the top plate. 7 Eave overhang.', 'The truss pattern, member sizes and plate sizes come from the manufacturer\'s design for your job.', 'Open the 3D truss detail to take one apart and see how the plates hold the joints.'] },
  { id: 'trussbrace', title: 'Truss bracing positions', scale: 'Typical, not to scale', svg: trussElev(true),
    notes: ['Each square is a brace that runs along the roof, passing every truss. The bracing layout shows which ones your roof needs.', 'Runners and battens brace the top chords. Ties and ceiling battens brace the bottom chords. Web bracing is only used where the layout asks for it.', 'The layout from the manufacturer overrides this drawing.'] },
  { id: 'roofplan', title: 'Roof framing plan', scale: 'Illustrative, 32 px per metre', svg: roofPlan(),
    notes: ['Trusses run across the house at 900 mm centres. The ridge line runs along it.', 'Dashed lines are diagonal braces in the top-chord plane and the ceiling plane. Other lines are runners and ties.', 'This is the layout in the 3D model. Your roof will be set out from the manufacturer\'s layout.'] },
  { id: 'heel', title: 'Truss heel detail', scale: 'Large scale, about 1:5, typical', svg: heelDetail(),
    notes: ['A close-up of the heel, where the truss bears on the wall frame and is held down against wind uplift. Callout numbers match the key.',
      'The tie-down (strap, framing anchor or bolt) runs from the truss to the top plates and on into the stud or lower down, so uplift reaches the slab. Its type and spacing come from the truss maker\'s layout and AS 1684 for the site\'s wind class.',
      'The brick veneer stops short of the eave lining, leaving a gap so the frame can shrink and the roof can move without bearing on the bricks.',
      'Sarking runs under the battens and drains into the gutter. The heel height sets how much ceiling insulation fits at the edge.'] },
];

const howto = [
  ['Send the plans to the truss manufacturer', 'Give the plans, wind classification, roof cladding type, pitch, overhangs and any point loads. Ask for the layout, the design certificate and the bracing details.', 'Builder', 'T'],
  ['Get quotes and book the delivery', 'Quote from at least three manufacturers. Book delivery and the crane for after the wall frame check.', 'Builder', 'T'],
  ['Check the delivery', 'Every truss, correct mark and type, plates intact, chords straight. Store the bundle flat on bearers and cover it.', 'Builder', 'T'],
  ['Plan the lift', 'Check overhead power lines, the ground and access. Agree the lift plan and the exclusion zone with the licensed operator and the dogger.', 'Builder and crane operator', 'C'],
  ['Mark the truss positions on the plates', 'From the layout, mark every truss position on the top plates, from one end, at the spacing shown.', 'Carpenter', 'T'],
  ['Lift, set and fix the trusses', 'Fix the first truss plumb and braced, then lift each next truss, fix it to the plates with the layout\'s connectors and plumb it.', 'Carpenter and crane crew', 'C'],
  ['Fit temporary runners and bracing', 'Fix the temporary runners and diagonals as each truss goes up. Do not leave trusses unbraced.', 'Carpenter', 'T'],
  ['Fit the permanent bracing', 'Top-chord runners, bottom-chord ties, diagonal and web bracing as the manufacturer\'s details show, fixed with the listed nails or connectors.', 'Carpenter', 'C'],
  ['Check the tie-down', 'Check every truss-to-plate connector against the layout and the tie-down chain from Step 3.', 'Builder', 'C'],
  ['Fix the battens', 'Batten spacing and size come from the cladding manufacturer. Fix to every truss.', 'Carpenter or roofer', 'C'],
  ['Book and pass the frame inspection', 'Notify the RBS at the frame stage and book the engineer. Have the truss and engineer\'s certificates ready.', 'Builder', 'V', 'vbaMand'],
];

const trades = [
  { t: 'Truss manufacturer and detailer', role: 'Designs, makes and delivers the trusses with a layout, certificate and bracing details.', when: 'Order early. Allow weeks for design and manufacture', reg: 'Manufacturer with engineering and certification', ask: ['Layout, design certificate and bracing details included', 'Delivery, unloading and lead time', 'What happens if the plans change'] },
  { t: 'Crane operator and dogger or rigger', role: 'Lifts the trusses onto the walls to a lift plan.', when: 'On truss day', reg: 'Licensed crane operator and licensed dogger or rigger', ask: ['Crane size and reach, minimum hire hours', 'Lift plan and site access', 'Overhead power line allowance'] },
  { t: 'Roof carpenter', role: 'Sets, fixes and braces the trusses and fits battens.', when: 'With the crane', reg: 'Trade contractor with insurance', ask: ['Labour only or supply and fix', 'Rate per square or per hour', 'Who supplies bracing and connectors'] },
  { t: 'Scaffolder or edge protection hire', role: 'Provides scaffold or edge protection for the roof work.', when: 'Before roof work starts', reg: 'Licensed scaffolder if over the notified height', ask: ['Scaffold, edge protection and handover certificate', 'Hire period and adjustments', 'Who inspects it'] },
  { t: 'Structural engineer', role: 'Checks the frame and issues the certificate. Reviews any change to trusses or bracing.', when: 'Before the frame is covered', reg: 'Registered engineer (confirm the current scheme)', ask: ['Frame inspection fee and notice needed', 'Certificate format for the RBS', 'Fee for a variation review'] },
  { t: 'Building surveyor (RBS)', role: 'Inspects the frame stage and keeps the record.', when: 'After the roof frame is complete', reg: 'Registered building surveyor (BPC)', ask: ['Notice period for inspections', 'Fee per inspection', 'What documents to hold for the visit'] },
  { t: 'Distribution business (power lines)', role: 'Advises on clearances and, if needed, de-energises or covers overhead lines.', when: 'Before the crane day', reg: 'Local electricity distributor', ask: ['Safe clearance for the crane', 'Lead time and fees for isolation or covers'] },
];

const materials = [
  ['Nail-plated roof trusses', 'Fink or other pattern, designed by the manufacturer. Pressed galvanised nail plates', 'Truss manufacturer. Get three quotes', 'T', 'Layout, certificate and bracing details must come with the quote.'],
  ['Truss tie-down connectors', 'Galvanised straps or brackets listed on the layout', 'Truss manufacturer or connector supplier', 'C', 'Use every nail hole in the table with the right nails.'],
  ['Temporary bracing timber', 'For example 70 x 35 or 90 x 35 pine runners and diagonals. Check the layout', 'Bunnings or timber merchant', 'T', 'Keep until the permanent bracing and battens are in.'],
  ['Permanent bracing', 'Timber ties and diagonals or galvanised strap bracing, as shown on the layout', 'Truss manufacturer or hardware supplier', 'C', 'Use the product and nails the layout names.'],
  ['Roof battens', 'Size and spacing from the roof cladding supplier (for example tile maker or sheet manufacturer)', 'Timber merchant or Bunnings trade desk', 'C', 'Order after the cladding choice is made.'],
  ['90 x 45 MGP10 H2 blue pine, 3.0 m', 'For packers, blocking and fixing. MGP10 is machine graded pine, stress grade 10', 'Bunnings (90 x 45mm MGP10 H2 blue pine 3.0m)', 'V', 'Listing seen on 8 November 2026.', 'bunnMGP'],
  ['Nails, screws and connectors', 'Type, length and gauge from the layout or connector table', 'Bunnings or truss supplier', 'C', 'Do not substitute fixings.'],
  ['Edge protection and scaffold', 'Hire or purchase to the safe work method statement', 'Scaffold or hire company', 'T', 'Confirm height rules and inspection with WorkSafe.'],
  ['Slings and lifting gear', 'Supplied and certified by the crane company', 'Crane company', 'T', 'Do not use your own slings.'],
];

const quotes = [
  { who: 'Truss manufacturer', n: '3', what: ['Trusses, layout, certificate and bracing details', 'Delivery and unloading', 'Lead time and changes after ordering'] },
  { who: 'Crane operator', n: '3', what: ['Crane size and reach and minimum hours', 'Dogger or rigger included', 'Standby or delay fees'] },
  { who: 'Roof carpenter', n: '3', what: ['Labour only or supply and fix', 'Bracing, connectors and battens included', 'Edge protection responsibility'] },
  { who: 'Scaffolder or edge protection', n: '2 to 3', what: ['Scaffold and edge protection and handover', 'Hire period and adjustments', 'Inspection'] },
  { who: 'Connector and hardware supplier', n: '2', what: ['Connectors, bracing and nails to the layout', 'Delivery', 'Returns'] },
  { who: 'Structural engineer', n: '1 to 2', what: ['Frame inspection and certificate', 'Review of any change', 'Additional visit fee'] },
];
const quoteTips = [
  'Send the plans and the wind classification with every request. Ask each manufacturer for the layout, certificate and bracing details in the price.',
  'Compare delivery, crane and bracing as well as the truss price. A cheap truss price with no bracing details is not the cheapest.',
  'Ask for the lead time and when the layout is sent for approval. Changes after manufacture cost money and weeks.',
  'Check who supplies the connectors, bracing and temporary bracing so nothing is missed on the day.',
  'Keep every quote and order. They are evidence of estimating and ordering for the BPC application.',
];

const inspections = [
  ['Truss delivery check', 'Builder', 'On delivery', 'Every truss and mark against the layout. Plates intact, chords straight, no damage. Store flat on bearers.', 'T'],
  ['Lift plan and exclusion zone', 'Builder and crane operator', 'Before the crane lifts', 'Power lines, ground, access, lift plan and exclusion zone are agreed and marked.', 'C'],
  ['Truss set-out check', 'Builder', 'As trusses are set', 'Spacing as the layout, trusses plumb and straight, connectors fixed.', 'T'],
  ['Temporary bracing check', 'Builder', 'Daily while the roof is open', 'Runners and diagonals fixed. Check again after strong wind.', 'T'],
  ['Permanent bracing and tie-down check', 'Builder and engineer', 'Before battens', 'Every brace and connector is where the layout shows, with the listed fixings.', 'C'],
  ['Frame inspection (mandatory stage if nominated)', 'RBS and engineer', 'When the wall and roof frame are complete', 'Wall and roof frame as drawn, with bracing, tie-down and connections. Do not go beyond the stage until it has been inspected.', 'V', 'vbaMand'],
  ['Records for the surveyor', 'Builder', 'Before the next stage', 'Truss layout and design certificate, engineer\'s certificate, dockets and photos on file.', 'T'],
];

const exam = [
  ['Who designs the roof trusses?', 'The truss manufacturer\'s engineer, for the job, from the spans, pitch, roof weight and wind class. The layout and certificate come with the trusses.', 'T'],
  ['Which Standard covers installing nail-plated roof trusses?', 'AS 4440. Confirm the current edition.', 'C'],
  ['What is the typical spacing of trusses?', '900 mm, though tile roofs often use less. The manufacturer\'s layout sets it.', 'C'],
  ['Can a builder cut, notch, drill or remove part of a truss?', 'No. Any change needs the truss designer\'s written approval.', 'T'],
  ['What do the nail plates do?', 'They hold each joint together. They are pressed into both faces by the fabricator. Do not hammer, bend or remove them.', 'T'],
  ['Why is temporary bracing needed?', 'Trusses are flat frames that can fall sideways, one after another. Runners and diagonals hold them until the permanent bracing and battens are in.', 'T'],
  ['Name the types of permanent bracing in a truss roof.', 'Top-chord runners or battens, bottom-chord ties or ceiling battens, diagonal bracing in the roof and ceiling planes, and web bracing where the layout calls for it.', 'T'],
  ['Where does the bracing layout come from?', 'The truss manufacturer\'s layout and bracing details for the job.', 'T'],
  ['What links the roof to the wall frame?', 'Tie-down connectors at the truss heels, as the layout shows, part of the chain from Step 3.', 'C'],
  ['What must be checked before the crane arrives?', 'Overhead power lines, ground and access, the lift plan, the licensed operator and dogger, and the exclusion zone.', 'C'],
  ['When does work at height need a safe work method statement?', 'Where a person could fall more than two metres. Confirm the current rule with WorkSafe Victoria.', 'C'],
  ['Why not stack battens or tiles on the trusses in one spot?', 'The trusses are designed for a spread load. A heap in one place can overload members and the bracing.', 'T'],
  ['When does the frame inspection happen?', 'When the wall and roof frame are complete, before cladding and lining. Confirm the stage list on the permit.', 'C'],
  ['What must the builder do at a mandatory notification stage?', 'Notify the RBS and not go beyond the stage until it has been inspected.', 'V', 'vbaMand'],
];


/* ---------- shared with step 5: the finished roof frame (trusses, permanent bracing, battens) ---------- */
export { trussParts, mergeTruss, HS, OVER, PLATE_TOP, yc, TAN, COS, ZS };
export function roofFrame(kit) {
  const { THREE, mat, boxUV, rod } = kit;
  const mk = (n) => { const g = new THREE.Group(); g.name = n; return g; };
  const timber = mat(0xffffff, { tex: 'timber' }), plateM = mat(0xb9c1c9, { metalness: 0.7, roughness: 0.4 }), steel = mat(0xb8c0c9, { metalness: 0.6, roughness: 0.35 });
  const { timber: tl, plates: pl } = trussParts(HS), tg = mergeTruss(tl, timber, boxUV, { THREE }), pg = mergeTruss(pl, plateM, boxUV, { THREE });
  const M4 = new THREE.Matrix4(), Q = new THREE.Quaternion(), S1 = new THREE.Vector3(1, 1, 1);
  const mats = ZS.map((z) => M4.clone().compose(new THREE.Vector3(0, PLATE_TOP, z), Q, S1));
  const inst = (geo, m) => { const im = new THREE.InstancedMesh(geo, m, mats.length); mats.forEach((x, i) => im.setMatrixAt(i, x)); im.castShadow = true; im.receiveShadow = true; return im; };
  const trusses = mk('trusses'); trusses.add(inst(tg, timber), inst(pg, plateM));
  const zf = Z1 - F.E, zb = Z0 + F.E, len = zf - zb, zm = (zf + zb) / 2;
  const perm = mk('perm');
  for (const x of [-3.6, -1.2, 1.2, 3.6]) perm.add(rod([x, PLATE_TOP + 0.12, zb], [x, PLATE_TOP + 0.12, zf], 0.016, steel));
  for (const [za, zz] of [[zb, zb + 3.6], [zf, zf - 3.6]]) { perm.add(rod([-3.6, PLATE_TOP + 0.12, za], [3.6, PLATE_TOP + 0.12, zz], 0.012, steel)); perm.add(rod([3.6, PLATE_TOP + 0.12, za], [-3.6, PLATE_TOP + 0.12, zz], 0.012, steel)); }
  for (const x of [-0.89, 0.89]) perm.add(rod([x, PLATE_TOP + 1.2, zb], [x, PLATE_TOP + 1.2, zf], 0.016, mat(0xffffff, { tex: 'timber', color: 0xe8c690 })));
  const battens = mk('battens'), bgeos = [];
  for (const sgn of [-1, 1]) for (let d = 0.25; d < (HS + OVER) / COS - 0.1; d += 0.33) {
    const x = sgn * (HS + OVER - d * COS); if (Math.abs(x) < 0.12) continue;
    const g = new THREE.BoxGeometry(0.07, 0.035, len + 0.8); boxUV(g, 0.07, 0.035, len + 0.8, 'long'); g.rotateZ(-sgn * Math.PI / 8); g.translate(x, PLATE_TOP + yc(x) + 0.075, zm); bgeos.push(g);
  }
  const bm = new THREE.Mesh(mergeGeometries(bgeos, false), timber); bm.castShadow = true; bm.receiveShadow = true; battens.add(bm);
  return { trusses, perm, battens };
}

export default {
  n: 4, id: 'roofframe', title: 'Roof framing and trusses', subtitle: 'From truss design to a braced, tied-down roof frame ready for inspection.',
  phases, build, details, drawings, howto, trades, materials, quotes, quoteTips, inspections, exam,
  sources: ['bunnMGP', 'vbaMand', 'bpcMI01', 'cavPay', 'hiaStd25', 'hiaNcc25'],
  caution: 'A real truss roof is set out from the manufacturer\'s layout and bracing details. The Standards (AS 4440, AS 1720.5 and AS 1684) are paywalled and were not opened, so almost nothing here was checked against them. Verified applies only to the Bunnings listing and the mandatory-notification page.',
};

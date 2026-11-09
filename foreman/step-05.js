// Step 5: roof cladding (concrete tiles on sarking and battens), fascia, gutters, downpipes and stormwater to the legal point of discharge.
// Sizes are typical. Tile, gutter and drainage figures come from the maker's data and the Standards (AS 2050, AS/NZS 3500.3), most of which are
// paywalled and were not opened, so most rules here are Typical or Confirm. Verified is used only for the sources named in Sources.
import { buildBase, buildSiteWorks, HOUSE, BASE_COLLIDERS, MAP } from './site.js';
import { svg, T, L, R, C as Circ, P, dim, call, arrow } from './dwg.js';
import { F, buildFrames, buildSlab } from './frame.js';
import { roofFrame, trussParts, HS, OVER, PLATE_TOP, yc, TAN, COS } from './step-04.js';

const { z0: Z0, z1: Z1 } = HOUSE;
const ZB = Z0 + F.E, ZF = Z1 - F.E, ZM = (ZB + ZF) / 2, VERGE = 0.35, RLEN = ZF - ZB + 2 * VERGE;
const XE = HS + OVER, XT = XE + 0.05;                  // eave edge (fascia) and the tile nose, as distance from the centre line
const TILE_UP = 0.14, SARK_UP = 0.055;                  // tile surface and sarking above the top chord centre line
const ty = (x) => PLATE_TOP + yc(x) + TILE_UP, sy = (x) => PLATE_TOP + yc(x) + SARK_UP;
const YT = PLATE_TOP + yc(XE);                          // centre of the truss tail end
const G_BOT = YT - 0.125, DP_X = XE + 0.02 + 0.0575;    // gutter bottom, downpipe centre line
const DP_Z = [-4.9, 10.9];                              // two downpipes per side, each serving less than 12 m of gutter
const RT = { W: -6.3, E: 6.3, REAR: -6.5, KERB: 20.3 }; // stormwater route: collectors beside the house, joined at the rear, main to the kerb at the front
const PITCH = Math.PI / 8, SN = Math.sin(PITCH), CS = Math.cos(PITCH);
const STRIP = 1.02 * CS;                                // plan width of one strip of three tile courses

const phases = [
  { title: 'Fascia, sarking and scaffold', text: 'Fascia boards go on the truss tails, the sarking is rolled over the roof and scaffold gives the crew a safe working platform at the eaves.' },
  { title: 'Roof tiles', text: 'Tiles are laid from the eaves up to the ridge, each course lapping the one below and fixed as the tile maker and AS 2050 require.' },
  { title: 'Ridge capping and flashings', text: 'Ridge tiles are bedded and pointed or fixed dry, and every roof penetration gets its own flashing before the roof is called watertight.' },
  { title: 'Gutters and downpipes', text: 'Gutters are fixed with a fall to the outlets, with an overflow measure, and downpipes carry the water down to ground level.' },
  { title: 'Stormwater to the point of discharge', text: 'The plumber connects each downpipe to underground pipes that run to the legal point of discharge the council has set.' },
  { title: 'Roof and drainage check', text: 'The roof is checked for laps, fixings and flashings, the gutters are water-tested and the plumber\'s records are on file.' },
];

/* ---------- small helpers ---------- */
// Flat quad on a roof slope, wound so it faces up. Strip a..b is measured outward from the ridge.
const slopeQuad = (sg, a, b, hy, z0, z1) => {
  const pts = [[sg * a, hy(a), z0], [sg * a, hy(a), z1], [sg * b, hy(b), z1], [sg * b, hy(b), z0]];
  const u = [0, 0, z1 - z0], v = [pts[2][0] - pts[0][0], pts[2][1] - pts[0][1], z1 - z0];
  return u[2] * v[0] - u[0] * v[2] >= 0 ? pts : [pts[1], pts[0], pts[3], pts[2]];
};
const gutterPts = (sg) => [[0, 0.09], [0, 0], [0.115, 0], [0.115, 0.065], [0.111, 0.065], [0.111, 0.004], [0.004, 0.004], [0.004, 0.09]].map(([x, y]) => [sg * x, y]);
const polyRoute = (pts, y) => pts.map(([x, z]) => [x, y, z]);

function build(kit) {
  const { THREE, C, mat, ghost, box, cyl, rod, pipe, face, flat, extrudeProfile, textPlane } = kit;
  const mk = (n) => { const g = new THREE.Group(); g.name = n; return g; };
  const base = buildBase(kit), w = buildSiteWorks(kit), slab = buildSlab(kit), fr = buildFrames(kit), G = fr.groups; fr.stand(1);
  const rf = roofFrame(kit);
  const dark = mat(0x2f3640, { metalness: 0.5, roughness: 0.45 }), steel = mat(0xc7ccd3, { metalness: 0.6, roughness: 0.4 });
  const white = mat(0xf1efe9), foil = mat(0xb4bcc6, { metalness: 0.2, roughness: 0.5, side: THREE.DoubleSide }), tileM = mat(0x74808d, { tex: 'roofTile' });
  const plank = mat(0xffffff, { tex: 'timber' });

  // sarking: a foil sheet over the top chords, under the battens
  const sarking = mk('sarking');
  for (const sg of [-1, 1]) { const m = face(slopeQuad(sg, 0, XT, sy, ZB - VERGE, ZF + VERGE), foil, false); m.receiveShadow = true; sarking.add(m); }

  // tiles: seven strips of three courses each, revealed from the eaves up
  const tiles = mk('tiles'), strips = [], N = Math.ceil(XT / STRIP);
  for (let i = N - 1; i >= 0; i--) {
    const s = mk('strip' + i), a = i * STRIP, b = Math.min((i + 1) * STRIP, XT); s.visible = false;
    for (const sg of [-1, 1]) s.add(face(slopeQuad(sg, a, b, ty, ZB - VERGE, ZF + VERGE), tileM));
    tiles.add(s); strips.push(s);
  }
  // tile nose along each eave so the edge has some thickness
  for (const sg of [-1, 1]) tiles.add(box(0.03, 0.045, RLEN, tileM, sg * (XT - 0.005), ty(XT) - 0.02, ZM));

  const ridge = mk('ridge'), rY = ty(0) + 0.045;
  ridge.add(rod([0, rY, ZB - VERGE], [0, rY, ZF + VERGE], 0.1, tileM, 16));
  for (const z of [ZB - VERGE, ZF + VERGE]) ridge.add(cyl(0.1, 0.02, mat(0x3f454e), 0, rY, z + (z < ZM ? -0.01 : 0.01), 16).rotateX(Math.PI / 2));
  // plumbing vent through the east slope, with a flashing
  const vx = 2.0, vz = 4.0, vyy = ty(vx);
  const flash = mk('flash');
  flash.add(rod([vx, vyy - 0.2, vz], [vx, vyy + 0.55, vz], 0.05, mat(C.pvc), 14));
  const apron = box(0.42, 0.008, 0.42, dark, vx, vyy + 0.012, vz); apron.rotation.z = -PITCH; flash.add(apron);
  flash.add(cyl(0.12, 0.12, dark, vx, vyy + 0.07, vz, 20, true, 0.055));

  // fascia
  const fascia = mk('fascia');
  for (const sg of [-1, 1]) fascia.add(box(0.02, 0.19, RLEN, white, sg * (XE + 0.01), YT - 0.035, ZM));

  // gutters, brackets, end stops and downpipes
  const gutters = mk('gutters');
  for (const sg of [-1, 1]) {
    const gm = extrudeProfile(gutterPts(sg), RLEN, dark); gm.position.set(sg * (XE + 0.02), G_BOT, ZM); gutters.add(gm);
    for (let z = ZB - VERGE + 0.2; z < ZF + VERGE; z += 1.15) gutters.add(box(0.125, 0.004, 0.025, steel, sg * (XE + 0.02 + 0.0575), G_BOT - 0.003, z));
    for (const z of [ZB - VERGE, ZF + VERGE]) gutters.add(box(0.115, 0.09, 0.008, dark, sg * (XE + 0.02 + 0.0575), G_BOT + 0.045, z + (z < ZM ? 0.004 : -0.004)));
    for (const z of DP_Z) {
      gutters.add(rod([sg * DP_X, G_BOT, z], [sg * DP_X, 0.15, z], 0.045, dark, 14));
      for (const y of [0.6, 1.5, 2.4, 3.3, 4.2, 5.0]) gutters.add(box(0.03, 0.04, 0.13, steel, sg * (DP_X + 0.0), y, z));
    }
  }

  // stormwater: grated pits at each downpipe, buried pipes (drawn just above the ground so they can be seen), LPOD marker
  const storm = mk('storm'), conc = mat(0xffffff, { tex: 'concrete' }), pvc = mat(0x2f7fd6, { transparent: true, opacity: 0.78, roughness: 0.4 });
  for (const sg of [-1, 1]) for (const z of DP_Z) {
    storm.add(box(0.45, 0.12, 0.45, conc, sg * DP_X, 0.06, z), box(0.32, 0.02, 0.32, dark, sg * DP_X, 0.125, z));
    storm.add(rod([sg * DP_X, 0.04, z], [sg * (Math.abs(RT.E)), 0.04, z], 0.05, pvc, 10));
  }
  storm.add(pipe(polyRoute([[RT.E, 10.9], [RT.E, RT.REAR], [RT.W, RT.REAR], [RT.W, RT.KERB]], 0.04), 0.05, pvc));
  storm.add(box(0.5, 0.06, 0.5, conc, RT.W, 0.03, RT.REAR), box(0.3, 0.02, 0.3, dark, RT.W, 0.07, RT.REAR));
  storm.add(box(0.5, 0.06, 0.5, conc, RT.W, 0.03, 17.2), box(0.3, 0.02, 0.3, dark, RT.W, 0.07, 17.2));
  const post = cyl(0.04, 1.5, mat(C.orange), RT.W, 0.75, 19.7, 8), lp = textPlane(['LPOD', 'Legal point of discharge', 'Set by the council report'], 1.4, 0.7);
  lp.material.side = THREE.DoubleSide; lp.position.set(RT.W, 1.45, 19.74);
  storm.add(post, lp, box(0.14, 0.1, 0.12, dark, RT.W, 0.07, 20.4));
  for (const z of [3, 14]) { const a = rod([RT.W, 0.12, z], [RT.W, 0.12, z + 0.5], 0.012, mat(C.orange)); storm.add(a); }

  // scaffold and edge protection, gone before the pipes go in
  const scaf = mk('scaffold');
  for (const sg of [-1, 1]) {
    const z0 = ZB - 0.2, z1 = sg < 0 ? 9.6 : ZF + 0.2, len = z1 - z0, zc = (z0 + z1) / 2;
    for (let z = z0; z <= z1 + 0.01; z += 2.4) for (const dx of [6.05, 6.95]) scaf.add(rod([sg * dx, 0, z], [sg * dx, 7.2, z], 0.024, steel, 6));
    for (const py of [1.95, 3.95, 5.95]) {                                        // three 2 m lifts, the top platform just above the eaves
      scaf.add(box(0.9, 0.05, len, plank, sg * 6.5, py, zc), box(0.03, 0.15, len, plank, sg * 6.95, py + 0.08, zc));
      for (const dy of [-0.05, 0.5, 1.0]) scaf.add(rod([sg * 6.95, py + dy, z0], [sg * 6.95, py + dy, z1], 0.02, steel, 6));
      scaf.add(rod([sg * 6.05, py - 0.05, z0], [sg * 6.05, py - 0.05, z1], 0.02, steel, 6));
    }
  }

  const check = mk('check'), sign = textPlane(['CHECK POINT: ROOF', 'Water test and fixings checked', 'Plumber\'s records on file'], 1.9, 0.9);
  sign.position.set(0, 1.5, Z1 + 1.3); check.add(sign, cyl(0.04, 1.6, mat(C.steel), -0.85, 0.8, Z1 + 1.28, 8), cyl(0.04, 1.6, mat(C.steel), 0.85, 0.8, Z1 + 1.28, 8));

  // tiles grow from the eaves up; once the next phase is showing they are all down
  let k = 0; const setK = (v) => { k = v; strips.forEach((s, i) => { s.visible = i < Math.floor(v + 1e-6); }); };
  const tickers = [(dt) => {
    if (!tiles.visible) { if (k) setK(0); return; }
    if (ridge.visible || gutters.visible) { if (k < N) setK(N); return; }
    if (k < N) setK(Math.min(N, k + dt * 1.6));
  }];

  const layers = [
    { group: base }, { group: w.fence }, { group: w.sign }, { group: w.silt }, { group: w.entry }, { group: w.amenities }, { group: slab },
    { group: G.walls }, { group: G.plate2 }, { group: G.brace }, { group: G.tie }, { group: G.floor1 }, { group: G.floor1S }, { group: G.walls2 }, { group: G.stairT }, { group: G.plate2u }, { group: G.brace2 },
    { group: rf.trusses }, { group: rf.perm }, { group: rf.battens },
    { group: scaf, until: 3 }, { group: fascia }, { group: sarking }, { group: tiles, from: 1 }, { group: ridge, from: 2 }, { group: flash, from: 2 },
    { group: gutters, from: 3 }, { group: storm, from: 4 }, { group: check, from: 5 },
  ];

  return {
    layers, colliders: BASE_COLLIDERS, tickers,
    spawn: { pos: [4, 18.5], yaw: 0, pitch: 0.2 }, map: MAP,
    orbit: { pos: [19, 15, 28], target: [0, 4.0, 4] },
    hotspots: [
      { id: 'fascia', title: 'Fascia and eaves', pos: [XE + 0.1, YT - 0.03, 2], stand: [8.2, 13], from: 0, drawing: 'gutterdet',
        summary: 'The fascia is the board that closes the ends of the truss tails. It carries the gutter brackets, so it has to be straight, level and fixed to every truss.',
        learn: [['Fix the fascia to the end of every truss tail. The gutter brackets screw into the fascia and the truss ends, so loose fascia means a loose gutter.', 'T'], ['Fascia can be timber, metal or fibre cement. A metal fascia may need less fall in the gutter than a timber one. Check the gutter rules for your edition of the NCC.', 'C'], ['In a bushfire area the eaves, fascia and gutters have their own ember-proofing rules in AS 3959. Check the BAL in the permit.', 'C']] },
      { id: 'scaffold', title: 'Scaffold and edge protection', pos: [6.95, 4.0, 3], stand: [7.2, 14], from: 0, until: 3,
        summary: 'Gutters and tiles go on from a platform at the eaves, with guard rails. The scaffold is planned before anyone goes up and stays until the gutters and flashings are done.',
        learn: [['Work where a person could fall two metres or more needs a safe work method statement and a proper work platform or edge protection. Confirm the current rules with WorkSafe Victoria.', 'C'], ['A scaffolder with the right licence class builds scaffold above the height set in the OHS regulations, and gives you a handover certificate. Confirm the height and class with WorkSafe.', 'C'], ['Keep tiles stacked on the roof in a spread pattern, not in one heap, so no truss is overloaded.', 'T']] },
      { id: 'sarking', title: 'Sarking under the roof', pos: [-2.6, sy(2.6) + 0.1, 4], stand: [-3, 17.5], from: 0, until: 1, detail: 'roofbuild', drawing: 'roofsec',
        summary: 'Sarking is a flexible sheet rolled over the roof before the cladding. It sheds any water that gets under the tiles and helps with condensation and heat.',
        learn: [['AS 2050 covers the sarking, battens, tiles, bedding and pointing for tile roofs, and the NCC calls it up for roof tile installation.', 'V', 'hiaTiles'], ['Laps, fixing and the way the sarking is dressed into the gutter follow the maker\'s data. Sarking is usually laid before the battens, so the Step 4 battens are shown already fixed on this model.', 'C'], ['Condensation management for roofs sits in the NCC Housing Provisions Part 10.8. Some roofs need a vapour-permeable sarking. Confirm for your climate zone and edition.', 'C']] },
      { id: 'tiles', title: 'Roof tiles', pos: [3.2, ty(3.2) + 0.3, 6], stand: [3.5, 18.5], from: 1, detail: 'roofbuild', drawing: 'roofsec',
        summary: 'Concrete tiles are laid course by course from the eaves up. Each course overlaps the one below, and the batten spacing (the gauge) comes from the tile maker.',
        learn: [['Tile roofs are installed to AS 2050 and the tile maker\'s data. The installation Standard is a Deemed-to-Satisfy path in the NCC.', 'V', 'hiaTiles'], ['The truss design must allow for the weight of the tiles. Tell the truss manufacturer the cladding before they design the trusses (Step 4).', 'T'], ['Batten gauge, head lap, minimum pitch and the number of tiles to be mechanically fixed (clips or screws) depend on the tile, the pitch and the wind class. Read the maker\'s data and AS 2050.', 'C'], ['Do not walk on tiles where they sit unsupported. Walk on the lower part of the tile near a batten, and use roof ladders or a platform for repairs.', 'T']] },
      { id: 'ridge', title: 'Ridge capping', pos: [0, rY + 0.25, 2], stand: [0, 18], from: 2, detail: 'ridge', drawing: 'roofsec',
        summary: 'Ridge tiles cover the join where the two slopes meet. They are bedded and pointed with flexible pointing, or fixed dry with clips, and the ridge needs its own fixings.',
        learn: [['Ridge and hip caps are fixed to a ridge batten with the fixings the tile maker lists. Bedding mortar alone is not enough in high wind areas.', 'C'], ['Flexible pointing is used over the bedding. It stays watertight as the roof moves in the weather.', 'T'], ['A dry-ridge system replaces the mortar with clips and a ventilated strip. Follow the system maker\'s instructions.', 'T']] },
      { id: 'flash', title: 'Flashings and penetrations', pos: [vx, vyy + 0.75, vz], stand: [-1, 17], from: 2, detail: 'flash',
        summary: 'Every pipe, vent or flue that goes through the roof gets a flashing that sheds water over the tiles. A badly flashed penetration is one of the most common leaks.',
        learn: [['The flashing laps over the downslope tiles and under the upslope tiles, so water always runs over it, never behind it.', 'T'], ['Use the flashing made for the pipe size and the tile profile, with the sealant the maker lists. Sealant alone is not a flashing.', 'T'], ['A licensed plumber fits the plumbing vent through the roof. Roof plumbing is plumbing work. Confirm the licence class for each item with the VBA.', 'C']] },
      { id: 'gutters', title: 'Gutters and overflow', pos: [XE + 0.1, G_BOT + 0.1, 3.5], stand: [7.0, 13.5], from: 3, detail: 'gutter', drawing: 'gutterdet',
        summary: 'The gutter collects the roof water and moves it to the downpipes. It needs a fall to the outlets and an overflow measure so a blocked or flooded gutter spills outside, not into the roof.',
        learn: [['An eave gutter needs a minimum fall of 1 in 500, unless it is fixed to a metal fascia. Brackets go at the stop ends and at no more than 1.2 m apart.', 'C', 'nccGutter'], ['One downpipe serves no more than 12 m of gutter. This house has two on each side.', 'C', 'nccGutter'], ['Eave gutters are sized for a 5 minute rainfall at a 5% annual exceedance probability (about 1 in 20 years). Overflow measures are checked for a 1% event, using the tables in the NCC.', 'C', 'nccGutter'], ['Overflow measures include slots in the front face, a controlled back gap and a weir at the end stop. Box gutters sit outside the Housing Provisions and need AS/NZS 3500.3 or a Performance Solution.', 'C', 'nccGutter']] },
      { id: 'downpipe', title: 'Downpipes', pos: [DP_X, 1.4, 10.9], stand: [7.4, 14.8], from: 3,
        summary: 'Downpipes carry the water from each gutter outlet to a pit at ground level. They are fixed with clips and sized from the roof area they serve.',
        learn: [['Typical downpipes are 90 mm round or 100 x 50 mm rectangular. The size comes from the roof area, the gutter and the design rainfall.', 'T'], ['Space them so no downpipe serves more than 12 m of gutter, and put them where the water has a short route to the stormwater pipe.', 'C', 'nccGutter'], ['Fix the downpipe with clips at the spacing the maker lists, and connect it to a pit or stormwater riser, never to the sewer.', 'T']] },
      { id: 'storm', title: 'Stormwater pipes and pits', pos: [RT.E, 0.45, 2], stand: [8.4, 8], from: 4, detail: 'stormwater', drawing: 'stormplan',
        summary: 'Underground pipes take the water from the downpipe pits to the legal point of discharge. They need a fall, bedding, cover and inspection openings. The model shows them just above the lawn so you can see them.',
        learn: [['Stormwater drainage is designed and built to the NCC and AS/NZS 3500.3. In Victoria the performance requirements are in Volume Two Part H2.', 'V', 'vbaSD01'], ['Typical pipe is 90 mm PVC at a minimum fall of 1 in 100, laid on sand bedding with cover over it. Take the exact figures from AS/NZS 3500.3 and the plumber.', 'C'], ['Stormwater must never be connected to the sewer. It goes to the legal point of discharge.', 'T'], ['Inspection openings go at the places the Standard lists, such as bends, junctions and the boundary. Keep them accessible.', 'C']] },
      { id: 'lpod', title: 'Legal point of discharge', pos: [RT.W, 1.9, 19.74], stand: [-4.5, 18.9], from: 4, drawing: 'stormplan',
        summary: 'The legal point of discharge (LPOD) is where your stormwater leaves the property into the council drain. The council sets it in a report, and the surveyor checks that your system ends there.',
        learn: [['For a building permit that includes a stormwater system, the council\'s report under Regulation 133(2) of the Building Regulations identifies the legal point of discharge for the lot.', 'V', 'vbaSD01'], ['The Relevant Building Surveyor approves the stormwater system and makes sure its point of discharge matches the council report.', 'V', 'vbaSD01'], ['The owner is responsible for the drain up to the LPOD, and the council from the LPOD to the kerb or its drain.', 'V', 'vbaSD01'], ['Section 16 of the Water Act 1989 creates liability for unreasonable flow of water onto another person\'s land that causes damage. A planning permit may also limit the discharge rate.', 'V', 'vbaSD01'], ['Apply for the council report early. Fees and timing depend on the council.', 'T']] },
      { id: 'check', title: 'Roof and drainage check', pos: [0, 1.5, Z1 + 1.3], stand: [0, 17], from: 5,
        summary: 'Before the lining goes on, check the roof for laps, fixings, flashings and gutters, run water through the gutters and keep the plumber\'s records.',
        learn: [['Check the tile fixings, ridge fixings, flashings and sarking laps against the maker\'s data and AS 2050. Photograph them before they are hidden.', 'T'], ['Run a hose into each gutter and watch the fall, the outlets and the overflow. Look for leaks at joints and brackets.', 'T'], ['Only a licensed plumber may issue a plumbing compliance certificate. It is needed for work of $750 or more, and the plumber must lodge it within five days of finishing. Confirm that roof plumbing and stormwater work count towards it.', 'V', 'vbaCert'], ['Keep the tile maker\'s warranty and fixing guide, the plumber\'s certificate and the council LPOD report with the job file for the surveyor.', 'T']] },
    ],
  };
}

/* ---------- 3D detail models ---------- */
// Slope helpers: a part built in slope space has x up the slope, y off the slope and z along the eave, then is turned by the roof pitch.
const wp = (x, y, z = 0) => [x * CS - y * SN, x * SN + y * CS, z];
const nrm = (d) => [-SN * d, CS * d, 0];
const piv = (THREE, fn) => { const g = new THREE.Group(); g.rotation.z = PITCH; fn(g); return g; };
const sgrp = (THREE, ...kids) => { const g = new THREE.Group(); if (kids.length) g.add(...kids); return g; };

function layersFor(kit, withHole) {
  const { THREE, C, mat, box } = kit;
  const timber = mat(0xffffff, { tex: 'timber' }), foil = mat(0xb4bcc6, { metalness: 0.2, roughness: 0.5 }), tileM = mat(0x8a93a0, { tex: 'roofTile' }), steel = mat(0xb8c0c9, { metalness: 0.6, roughness: 0.35 });
  const chord = piv(THREE, (g) => { for (const z of [-0.45, 0.45]) g.add(box(1.7, 0.09, 0.035, timber, 0, -0.045, z)); });
  const sark = piv(THREE, (g) => g.add(box(1.7, 0.003, 1.3, foil, 0, 0.0015, 0)));
  const batt = piv(THREE, (g) => { for (const x of [-0.66, -0.33, 0, 0.33, 0.66]) g.add(box(0.07, 0.035, 1.3, timber, x, 0.0205, 0)); });
  const tiles = piv(THREE, (g) => { [-0.33, 0, 0.33].forEach((xc, i) => { for (const zc of [-0.48, -0.16, 0.16, 0.48]) { if (withHole && xc === 0 && Math.abs(zc) < 0.2) continue; g.add(box(0.42, 0.028, 0.31, tileM, xc, 0.05 - i * 0.004, zc)); } }); });
  const clips = piv(THREE, (g) => { for (const xc of [-0.33, 0, 0.33]) for (const zc of [-0.48, -0.16, 0.16, 0.48]) { if (withHole && xc === 0 && Math.abs(zc) < 0.2) continue; g.add(box(0.03, 0.006, 0.02, steel, xc - 0.17, 0.039, zc)); } });
  return { chord, sark, batt, tiles, clips };
}

const details = {
  roofbuild: {
    title: 'Tile roof layers', sub: 'Top chords, sarking, battens, tiles and tile clips', floor: -0.45, gridSize: 4,
    camera: { pos: [1.3, 1.0, 2.5], target: [0, 0.1, 0] },
    build(kit) {
      const { THREE } = kit, L = layersFor(kit, false);
      return { parts: [
        { id: 'chord', name: 'Top chords at 900 mm centres', group: L.chord, explode: [0, 0, 0], anchor: wp(-0.6, -0.045, 0.45), flag: 'T', spec: 'Truss top chords, typically 90 x 35 pine, as designed by the truss manufacturer.',
          desc: 'The roof loads all end up here. The cladding, the battens and the sarking only work if they are fixed to every chord at the spacing the design assumes.' },
        { id: 'sark', name: 'Sarking', group: L.sark, explode: nrm(0.18), anchor: wp(-0.75, 0.003, 0.2), flag: 'C', spec: 'Foil or vapour-permeable sheet. Laps, fixing and the way it is dressed into the gutter follow the maker\'s data.',
          desc: 'A second line of defence. It sheds any water that gets under a tile and can help with condensation and heat. On many roofs it is laid before the battens.' },
        { id: 'batt', name: 'Battens', group: L.batt, explode: nrm(0.4), anchor: wp(0.33, 0.038, -0.65), flag: 'C', spec: 'Typically 70 x 35 pine. Size, spacing and fixing come from the tile maker and AS 2050.',
          desc: 'They carry the tiles and set the gauge, the distance between courses. They also brace the top chords, so each one is fixed to every truss.' },
        { id: 'tiles', name: 'Concrete tiles', group: L.tiles, explode: nrm(0.8), anchor: wp(0, 0.064, 0.16), flag: 'C', spec: 'Each tile hooks over a batten and laps the course below. Head lap and gauge come from the tile maker.',
          desc: 'The tile sheds the water. Every course overlaps the one below, so water runs over joins instead of through them. The overlap is the head lap.' },
        { id: 'clips', name: 'Tile clips', group: L.clips, explode: nrm(0.55), anchor: wp(-0.2, 0.042, 0.16), flag: 'C', spec: 'Metal clips or screws that hold tiles down. The number to fix depends on the wind class, pitch and tile.',
          desc: 'In strong wind a tile can lift. Clips or screws hold it to the batten. Fix the number the maker and AS 2050 require for your wind region.' },
      ] };
    },
  },

  ridge: {
    title: 'Ridge capping', sub: 'Apex of the roof with sarking, ridge battens, last tiles, bedding and cap', floor: -0.5, gridSize: 4,
    camera: { pos: [1.0, 0.8, 1.9], target: [0, 0.35, 0] },
    build(kit) {
      const { THREE, C, mat, box, rod } = kit, G = (...k) => sgrp(THREE, ...k);
      const timber = mat(0xffffff, { tex: 'timber' }), foil = mat(0xb4bcc6, { metalness: 0.2, roughness: 0.5 }), tileM = mat(0x8a93a0, { tex: 'roofTile' }), plateM = mat(0xb9c1c9, { metalness: 0.7, roughness: 0.4 }), mortar = mat(0xb9b4a7);
      const slabPart = (sg, w, h, d, off, along, m) => { const b = box(w, h, d, m, sg * along * CS + sg * SN * off, -along * SN + CS * off, 0); b.rotation.z = -sg * PITCH; return b; };
      const rY0 = 0.0487 + 0.003 + 0.035 + 0.028;
      const truss = G(), tc = (sg) => { const b = box(1.4, 0.09, 0.035, timber, sg * 0.7 * CS, -0.7 * SN, 0); b.rotation.z = -sg * PITCH; return b; };
      truss.add(tc(-1), tc(1), box(0.22, 0.2, 0.004, plateM, 0, -0.03, 0.0195), box(0.22, 0.2, 0.004, plateM, 0, -0.03, -0.0195));
      const sark = G(), batt = G(), tile = G();
      for (const sg of [-1, 1]) {
        sark.add(slabPart(sg, 1.2, 0.003, 0.9, 0.0487 + 0.0015, 0.58, foil));
        for (const al of [0.12, 0.45]) batt.add(slabPart(sg, 0.07, 0.035, 0.9, 0.0517 + 0.0175, al, timber));
        tile.add(slabPart(sg, 0.42, 0.028, 0.84, 0.0887 + 0.014, 0.36, tileM));
      }
      const cap = G(rod([0, rY0 + 0.03, -0.45], [0, rY0 + 0.03, 0.45], 0.1, tileM, 20)), bed = G(box(0.2, 0.05, 0.88, mortar, 0, rY0 - 0.005, 0));
      return { parts: [
        { id: 'truss', name: 'Truss apex', group: truss, explode: [0, 0, 0], anchor: [0, -0.02, 0.0195], flag: 'T', spec: 'Top chords meet at the apex and are joined by a nail plate on each face.',
          desc: 'There is no ridge board in a truss roof. The two top chords meet and are held by nail plates, so never cut or notch them at the apex.' },
        { id: 'sark', name: 'Sarking over the ridge', group: sark, explode: [0, 0.1, 0], anchor: [0.3, 0.0487 - 0.12, 0.0], flag: 'C', spec: 'Lapped over the ridge, as the sarking maker shows.',
          desc: 'The sheet laps over the ridge so no water can run through the join. Lap sizes and tape come from the maker.' },
        { id: 'batt', name: 'Ridge battens', group: batt, explode: [0, 0.22, 0], anchor: [0.15, 0.1, 0.45], flag: 'C', spec: 'The top batten is set to suit the ridge tile, as the maker shows.',
          desc: 'The ridge batten carries the ridge tiles or the dry-ridge clips and braces the top of the truss.' },
        { id: 'tile', name: 'Last course of tiles', group: tile, explode: [0, 0.36, 0], anchor: [0.4, 0.2, 0.4], flag: 'C', spec: 'The last course is cut or chosen to suit the ridge, as the tile maker shows.',
          desc: 'The tiles on each side run up to the ridge. The cap then covers the gap between them.' },
        { id: 'bed', name: 'Bedding and flexible pointing', group: bed, explode: [0, 0.5, 0], anchor: [0.0, rY0 + 0.02, -0.4], flag: 'C', spec: 'Bedding mortar with flexible pointing, or a dry-ridge clip and strip.',
          desc: 'The bedding supports the cap. The flexible pointing seals the joint and moves with the roof. In dry-ridge systems clips and a ventilated strip do this job.' },
        { id: 'cap', name: 'Ridge cap tile', group: cap, explode: [0, 0.72, 0], anchor: [0.08, rY0 + 0.1, 0.4], flag: 'C', spec: 'Fixed with the screws or clips the maker lists, as well as the bedding.',
          desc: 'The cap closes the ridge. Mortar alone can crack and let go in high wind, so it needs its own mechanical fixing.' },
      ] };
    },
  },

  gutter: {
    title: 'Eave gutter and fascia', sub: 'Truss tails, fascia, gutter, brackets, sarking, tile nose and downpipe', floor: -1.0, gridSize: 3,
    camera: { pos: [1.2, 0.2, 2.7], target: [0.04, -0.2, 0] },
    build(kit) {
      const { THREE, C, mat, box, rod, extrudeProfile } = kit, G = (...k) => sgrp(THREE, ...k);
      const timber = mat(0xffffff, { tex: 'timber' }), foil = mat(0xb4bcc6, { metalness: 0.2, roughness: 0.5 }), tileM = mat(0x8a93a0, { tex: 'roofTile' }), dark = mat(0x2f3640, { metalness: 0.5, roughness: 0.45 }), steel = mat(0xc7ccd3, { metalness: 0.6, roughness: 0.4 }), white = mat(0xf1efe9);
      const gy = -0.125, gx = 0.018, GW = 0.115, ZL = 1.4;
      const along = (a, off) => [a * CS + SN * off, -a * SN + CS * off];                // a along the chord, outward and down; off off the chord line
      const onChord = (w, h, d, off, a0, m) => { const [x, y] = along(a0, off); const b = box(w, h, d, m, x, y, 0); b.rotation.z = -PITCH; return b; };
      const tails = G(); for (const z of [-0.45, 0.45]) tails.add(onChord(0.6, 0.09, 0.035, 0, -0.3, timber).translateZ(z));
      const fasciaP = G(box(0.018, 0.19, ZL, white, 0.009, -0.035, 0));
      const gm = extrudeProfile(gutterPts(1), ZL, dark); gm.position.set(gx, gy, 0);
      const brackets = G(); for (const z of [-0.55, 0.55]) brackets.add(box(0.125, 0.004, 0.025, steel, gx + 0.0575, gy - 0.003, z), box(0.004, 0.08, 0.025, steel, gx + GW + 0.002, gy - 0.003 + 0.04, z), rod([0.0, gy + 0.05, z], [-0.04, gy + 0.05, z], 0.006, steel, 6));
      const tile = G(onChord(0.42, 0.028, 0.84, 0.0887 + 0.014, -0.14, tileM), onChord(0.07, 0.035, 1.3, 0.0517 + 0.0175, -0.05, timber));
      const sark = G(onChord(0.6, 0.003, 1.3, 0.0487 + 0.0015, -0.3, foil), box(0.003, 0.09, 1.3, foil, gx + 0.004, -0.0, 0), box(0.04, 0.003, 1.3, foil, gx - 0.012, 0.055, 0));
      const slots = G(); for (const z of [-0.5, -0.17, 0.17, 0.5]) slots.add(box(0.006, 0.012, 0.05, mat(0x14181d), gx + GW + 0.001, gy + 0.045, z));
      const dpx = gx + 0.0575, outlet = G(rod([dpx, gy - 0.001, 0], [dpx, gy + 0.004, 0], 0.05, steel, 16));
      const dp = G(rod([dpx, gy, 0], [dpx, -0.95, 0], 0.045, dark, 16), box(0.03, 0.04, 0.13, steel, dpx, -0.5, 0));
      const soffit = G(box(0.5, 0.008, ZL, white, -0.25, -0.14, 0));
      return { parts: [
        { id: 'tails', name: 'Truss tails', group: tails, explode: [-0.18, 0.08, 0], anchor: along(-0.35, 0), flag: 'T', spec: 'The top chords project beyond the wall to make the eave. They carry the fascia and the gutter brackets.', desc: 'The eave is part of the truss, cut by the truss maker to suit the overhang. Do not trim it on site.' },
        { id: 'fascia', name: 'Fascia', group: fasciaP, explode: [0.14, 0, 0], anchor: [0.018, -0.1, -0.6], flag: 'T', spec: 'Timber, metal or fibre cement board fixed to every truss tail.', desc: 'It closes the ends of the truss tails and gives the gutter brackets something solid to fix to.' },
        { id: 'gutter', name: 'Gutter', group: G(gm), explode: [0.28, 0, 0], anchor: [gx + GW, gy + 0.03, -0.45], flag: 'C', spec: 'Metal gutter with a back that is higher than the front, so overflow spills outside.', desc: 'The back of the gutter is higher than the front so that, if it overflows, the water falls outside the house and not behind the fascia.' },
        { id: 'brackets', name: 'Gutter brackets', group: brackets, explode: [0.28, -0.15, 0], anchor: [gx + 0.0575, gy - 0.005, 0.55], flag: 'C', spec: 'At stop ends and at no more than 1.2 m centres.', desc: 'They hold the gutter in place and its fall. Too few brackets and the gutter sags and holds water.' },
        { id: 'tile', name: 'Tile nose and batten', group: tile, explode: [0.08, 0.3, 0], anchor: along(0.06, 0.1), flag: 'C', spec: 'The tile nose overhangs so water drips into the gutter, not behind it.', desc: 'The first course of tiles overhangs the fascia so every drop lands inside the gutter.' },
        { id: 'sark', name: 'Sarking dressed into the gutter', group: sark, explode: [0.04, 0.18, 0], anchor: [gx + 0.004, -0.04, 0.5], flag: 'C', spec: 'The sheet laps over the fascia top and into the gutter, as the maker shows.', desc: 'Any water that gets under the tiles runs down the sarking and into the gutter, so it never reaches the fascia or the truss ends.' },
        { id: 'slots', name: 'Overflow slots', group: slots, explode: [0.4, 0, 0], anchor: [gx + GW, gy + 0.045, 0.17], flag: 'C', spec: 'One of the overflow measures in the NCC tables, such as front face slots.', desc: 'If the gutter overfills the water leaves through the slots at the front. Overflow measures are checked for a rarer storm than the gutter size.' },
        { id: 'outlet', name: 'Outlet', group: outlet, explode: [0.28, 0.1, 0], anchor: [dpx, gy, 0], flag: 'T', spec: 'A hole in the gutter floor, with a drop outlet to the downpipe.', desc: 'The gutter is laid with a fall towards each outlet. Check the fall with a string line or a water test.' },
        { id: 'dp', name: 'Downpipe', group: dp, explode: [0.28, -0.1, 0], anchor: [dpx, -0.6, 0], flag: 'T', spec: 'Typically 90 mm round, fixed with clips.', desc: 'It carries the water down to a pit. One downpipe serves no more than 12 m of gutter.' },
        { id: 'soffit', name: 'Eave lining', group: soffit, explode: [-0.2, -0.18, 0], anchor: [-0.25, -0.14, 0.5], flag: 'T', spec: 'Fixed after the roof is closed in, as part of the external works.', desc: 'The lining closes the underside of the eave. In a bushfire area it needs materials and details to AS 3959.' },
      ] };
    },
  },

  flash: {
    title: 'Roof penetration and flashing', sub: 'A plumbing vent through the tiles, sarking and battens', floor: -0.45, gridSize: 4,
    camera: { pos: [1.2, 0.95, 2.3], target: [0, 0.2, 0] },
    build(kit) {
      const { THREE, C, mat, box, cyl, rod } = kit, L = layersFor(kit, true), G = (...k) => sgrp(THREE, ...k);
      const dark = mat(0x2f3640, { metalness: 0.5, roughness: 0.45 }), pvc = mat(C.pvc), seal = mat(0x1b1d20);
      const [px, py] = wp(0, 0.05);
      const apron = piv(THREE, (g) => g.add(box(0.42, 0.006, 0.42, dark, 0, 0.0515, 0)));
      const cone = G(cyl(0.12, 0.12, dark, px, py + 0.07, 0, 20, true, 0.055));
      const pipe = G(rod([px, py - 0.25, 0], [px, py + 0.62, 0], 0.05, pvc, 16));
      const sl = G(cyl(0.062, 0.016, seal, px, py + 0.12, 0, 16));
      return { parts: [
        { id: 'chord', name: 'Top chords', group: L.chord, explode: [0, 0, 0], anchor: wp(-0.6, -0.045, 0.45), flag: 'T', spec: 'Truss top chords.', desc: 'The pipe has to pass between two chords. It must never be cut through a truss member.' },
        { id: 'sark', name: 'Sarking', group: L.sark, explode: nrm(0.14), anchor: wp(-0.75, 0.003, 0.2), flag: 'C', spec: 'Cut and lapped around the pipe as the maker shows.', desc: 'The sarking is cut, taped to the pipe and lapped so any water under the tiles runs around it.' },
        { id: 'batt', name: 'Battens', group: L.batt, explode: nrm(0.28), anchor: wp(0.33, 0.038, -0.65), flag: 'C', spec: 'Batten spacing is kept either side of the pipe.', desc: 'Battens run either side of the pipe, with extra support where a cut or a gap is needed.' },
        { id: 'tiles', name: 'Tiles (cut round the pipe)', group: L.tiles, explode: nrm(0.55), anchor: wp(0.33, 0.064, 0.48), flag: 'C', spec: 'Tiles are cut neatly so the flashing laps over them.', desc: 'Tiles upslope sit over the flashing and tiles downslope sit under it, so the water runs over the apron.' },
        { id: 'apron', name: 'Flashing apron', group: apron, explode: nrm(0.82), anchor: wp(0.14, 0.055, 0.14), flag: 'T', spec: 'Metal or flexible apron, cut to the tile profile.', desc: 'The apron sits on the tiles with its upslope edge under the tiles above and its downslope edge over the tiles below.' },
        { id: 'cone', name: 'Collar and cone', group: cone, explode: [0, 0.4, 0], anchor: [px + 0.08, py + 0.12, 0], flag: 'T', spec: 'Sized to the pipe diameter.', desc: 'The cone grips the pipe and sheds the water around it. It is made for the pipe size, so do not stretch a small one.' },
        { id: 'seal', name: 'Sealant at the collar', group: sl, explode: [0, 0.65, 0], anchor: [px + 0.06, py + 0.14, 0], flag: 'T', spec: 'Sealant listed by the flashing maker.', desc: 'Sealant closes the last gap at the top of the cone. It finishes the flashing but never replaces it.' },
        { id: 'pipe', name: 'Plumbing vent', group: pipe, explode: [0, 0.95, 0], anchor: [px, py + 0.5, 0], flag: 'T', spec: 'Fitted by a licensed plumber.', desc: 'The vent lets air into the drainage so water flows freely. It stands clear of the roof by the height the plumbing rules require.' },
      ] };
    },
  },

  stormwater: {
    title: 'Downpipe to stormwater pipe', sub: 'Downpipe, pit, bedded pipe and the kerb connection at the legal point of discharge', floor: -0.75, gridSize: 7,
    camera: { pos: [3.3, 1.4, 3.2], target: [1.8, -0.15, 0] },
    build(kit) {
      const { THREE, C, mat, ghost, box, rod, cyl } = kit, G = (...k) => sgrp(THREE, ...k);
      const conc = mat(0xffffff, { tex: 'concrete' }), dark = mat(0x2f3640, { metalness: 0.5, roughness: 0.45 }), pvc = mat(0x2f7fd6, { roughness: 0.4 }), steel = mat(0xc7ccd3, { metalness: 0.6, roughness: 0.4 });
      const wall = G(box(0.2, 1.3, 1.2, mat(0xe8e3d8), -0.1, 0.65, 0), box(0.4, 0.15, 1.2, conc, -0.2, 0.075, 0));
      const dpp = G(rod([0.45, 1.25, 0], [0.45, 0.17, 0], 0.045, dark, 16), box(0.03, 0.04, 0.13, steel, 0.45, 0.8, 0), box(0.03, 0.04, 0.13, steel, 0.45, 0.35, 0));
      const pit = G(box(0.45, 0.55, 0.45, conc, 0.45, -0.18, 0), box(0.32, 0.02, 0.32, dark, 0.45, 0.105, 0));
      const pp = G(rod([0.675, -0.33, 0], [3.35, -0.36, 0], 0.045, pvc, 14));
      const bed = G(box(2.7, 0.22, 0.42, ghost(0xdcc58f, 0.5), 2.03, -0.35, 0));
      const soil = G(box(3.5, 0.62, 1.2, ghost(0x7a5c3e, 0.28), 1.65, -0.31, 0));
      const kerb = G(box(0.22, 0.4, 1.2, mat(0xb4b6b9), 3.55, 0.0, 0), box(0.16, 0.1, 0.1, dark, 3.46, -0.36, 0));
      return { parts: [
        { id: 'wall', name: 'House wall and slab edge', group: wall, explode: [-0.4, 0, 0], anchor: [-0.2, 0.6, 0.5], flag: 'T', spec: 'The wall is shown for scale.', desc: 'The downpipe stands clear of the slab edge and wall so it can be fixed and cleaned.' },
        { id: 'dp', name: 'Downpipe', group: dpp, explode: [0, 0.4, 0], anchor: [0.45, 0.7, 0.04], flag: 'T', spec: 'Typically 90 mm round, clipped to the wall.', desc: 'It drops the water from the gutter outlet to the pit. Roof plumbing is fitted by a licensed plumber.' },
        { id: 'pit', name: 'Grated pit', group: pit, explode: [0, 0.18, 0], anchor: [0.45, 0.105, 0.14], flag: 'C', spec: 'Concrete or plastic pit with a grate, sized by the plumber.', desc: 'The pit takes the water from the downpipe and lets debris be cleaned out before it blocks the pipe.' },
        { id: 'pipe', name: 'Stormwater pipe', group: pp, explode: [0, 0.35, 0], anchor: [1.6, -0.34, 0.05], flag: 'C', spec: 'Typically 90 mm PVC at a minimum fall of 1 in 100. Check AS/NZS 3500.3.', desc: 'It runs downhill to the legal point of discharge. The fall is small, so check it with a level before the trench is covered.' },
        { id: 'bed', name: 'Sand bedding and cover', group: bed, explode: [0, -0.3, 0.55], anchor: [2.3, -0.4, 0.2], flag: 'C', spec: 'Clean sand under, around and above the pipe, as the Standard shows.', desc: 'Bedding supports the pipe evenly so it does not crack or sag. Do not drop rocks or fill directly onto it.' },
        { id: 'soil', name: 'Backfill and lawn (ghost)', group: soil, explode: [0, 0, -0.6], anchor: [0.9, -0.1, -0.5], flag: 'C', spec: 'Backfilled and compacted after the plumber\'s inspection.', desc: 'The trench is backfilled only after any required inspection. The cover over the pipe depends on what is above it.' },
        { id: 'kerb', name: 'Kerb and adaptor (LPOD)', group: kerb, explode: [0.45, 0, 0], anchor: [3.46, -0.3, 0.05], flag: 'V', src: 'vbaSD01', spec: 'The council sets the legal point of discharge. The pipe usually ends at a kerb adaptor.', desc: 'This is where your stormwater leaves the property. The owner is responsible for the drain up to here, and the council from here to its drain.' },
      ] };
    },
  },
};

/* ---------- 2D drawings ---------- */
const rect = (cx, cy, w, h, ang, X, Y) => { // rotated rectangle in metres, as an SVG polygon
  const c = Math.cos(ang), s = Math.sin(ang);
  return [[-w / 2, -h / 2], [w / 2, -h / 2], [w / 2, h / 2], [-w / 2, h / 2]].map(([a, b]) => [X(cx + a * c - b * s), Y(cy + a * s + b * c)]);
};

function roofSection() {
  const s = 64, ox = 450, oy = 500, X = (m) => ox + s * m, Y = (m) => oy - s * m, body = [R(0, 0, 900, 560, 'd-bg')];
  body.push(L(30, Y(0), 870, Y(0), 'd-ground'), R(X(-5.5), Y(F.SLAB), 11 * s, F.SLAB * s, 'd-conc'));
  for (const sg of [-1, 1]) body.push(R(sg < 0 ? X(-HS) : X(HS - 0.09), Y(PLATE_TOP), 0.09 * s, (PLATE_TOP - F.SLAB) * s, 'd-timber'));
  const { timber } = trussParts(HS);
  for (const [w, h, , x, y, , rz] of timber) body.push(P(rect(x, PLATE_TOP + y, w, h, rz, X, Y), 'd-timber'));
  const layer = (sg, d1, d2, x1) => P([[sg * 0, yc(0) + d2], [sg * x1, yc(x1) + d2], [sg * x1, yc(x1) + d1], [0, yc(0) + d1]].map(([x, y]) => [X(x), Y(PLATE_TOP + y)]), 'd-line');
  for (const sg of [-1, 1]) {
    body.push(layer(sg, 0.0487 + 0.001, 0.0487 + 0.004, XT).replace('d-line', 'd-wrap'));
    for (let x = 0.3; x < XE; x += 0.33 * CS) body.push(P(rect(sg * x, PLATE_TOP + yc(x) + 0.075, 0.07, 0.035, -sg * PITCH, X, Y), 'd-timber'));
    body.push(layer(sg, 0.095, 0.14, XT).replace('d-line', 'd-tile'));
    body.push(R(X(sg * XE) - (sg > 0 ? 0 : 0.02 * s), Y(YT + 0.06), 0.02 * s, 0.19 * s, 'd-board'));
    body.push(P(gutterPts(sg).map(([x, y]) => [X(sg * (XE + 0.02) + x), Y(G_BOT + y)]), 'd-steel'));
  }
  body.push(Circ(X(0), Y(ty(0) + 0.07), 0.1 * s, 'd-tile'), R(X(DP_X) - 0.045 * s, Y(G_BOT), 0.09 * s, (G_BOT - 0.1) * s, 'd-box'));
  body.push(dim(X(-HS), Y(0) + 30, X(HS), Y(0) + 30, '10 700 span'), dim(X(HS), Y(YT - 0.5), X(XE), Y(YT - 0.5), '450 eave'), T(X(2.6), Y(ty(2.6)) - 14, '22.5 degrees', { cls: 'd-mute' }));
  body.push(call(1, X(-3.0), Y(ty(3.0) - 0.02), X(-3.9), Y(ty(3) + 0.55)), call(2, X(-1.7), Y(PLATE_TOP + yc(1.7) + 0.075), X(-2.5), Y(ty(1.7) + 1.4)), call(3, X(-1.0), Y(PLATE_TOP + yc(1.0) + 0.054), X(-0.3), Y(ty(0) + 0.9)),
    call(4, X(2.2), Y(PLATE_TOP + yc(2.2)), X(3.7), Y(PLATE_TOP + yc(2.2) - 0.55)), call(5, X(0), Y(ty(0) + 0.07), X(0), Y(ty(0) + 0.8)), call(6, X(-XE), Y(YT - 0.035), X(-6.9), Y(YT + 0.7)),
    call(7, X(XE + 0.08), Y(G_BOT + 0.04), X(6.9), Y(G_BOT + 0.8)), call(8, X(DP_X), Y(1.2), X(6.9), Y(1.0)));
  body.push(T(30, 36, 'Section: wall to ridge (typical, not to scale)', { cls: 'd-bold' }), ...['1  Concrete tile', '2  Batten at the tile gauge', '3  Sarking under the battens', '4  Truss top chord (900 mm centres)', '5  Ridge cap, bedded and pointed', '6  Fascia on the truss tail', '7  Gutter with a fall and overflow', '8  Downpipe to a pit'].map((t, i) => T(30, 62 + i * 18, t)));
  return svg(900, 560, body.join(''), 'Roof section from wall to ridge');
}

function gutterSection() {
  const s = 700, ox = 520, oy = 300, X = (m) => ox + s * m, Y = (m) => oy - s * m, body = [R(0, 0, 900, 620, 'd-bg')];
  const lay = (d1, d2, x0, x1, cls) => P([[x0, -x0 * TAN + d2 / COS], [x1, -x1 * TAN + d2 / COS], [x1, -x1 * TAN + d1 / COS], [x0, -x0 * TAN + d1 / COS]].map(([x, y]) => [X(x), Y(y)]), cls);
  body.push(P([[0, 0.0487], [0, -0.0487], [-0.5, -0.0487 + 0.5 * TAN], [-0.5, 0.0487 + 0.5 * TAN]].map(([x, y]) => [X(x), Y(y)]), 'd-timber'));
  body.push(R(X(-0.5), Y(-0.14), 0.5 * s, 0.008 * s, 'd-board'), R(X(0), Y(0.06), 0.018 * s, 0.19 * s, 'd-board'));
  body.push(lay(0.0487, 0.0517, -0.5, 0, 'd-wrap'), L(X(0), Y(0.056), X(0.012), Y(0.062), 'd-memb'), L(X(0.012), Y(0.062), X(0.012), Y(-0.02), 'd-memb'));
  body.push(lay(0.0537, 0.0887, -0.28, -0.23, 'd-timber'), lay(0.0537, 0.0887, -0.07, -0.02, 'd-timber'), lay(0.0887, 0.1167, -0.5, 0.065, 'd-tile'));
  body.push(P(gutterPts(1).map(([x, y]) => [X(0.018 + x), Y(-0.125 + y)]), 'd-steel'), R(X(0.018), Y(-0.126), 0.125 * s, 0.004 * s, 'd-collar'), R(X(0.018 + 0.0575 - 0.045), Y(-0.125), 0.09 * s, 0.2 * s, 'd-box'));
  body.push(L(X(0.018), Y(-0.33), X(0.018), Y(-0.37), 'd-dim'), L(X(0.133), Y(-0.33), X(0.133), Y(-0.37), 'd-dim'), dim(X(0.018), Y(-0.36), X(0.133), Y(-0.36), '115 mm girth', -1), T(40, 606, 'Fall 1 in 500 along the gutter, brackets at 1 200 maximum', { cls: 'd-mute' }));
  body.push(call(1, X(-0.36), Y(0.36 * TAN), X(-0.44), Y(0.02)), call(2, X(0.009), Y(-0.02), X(0.4), Y(0.06)), call(3, X(0.075), Y(-0.123), X(0.4), Y(-0.34)), call(4, X(0.13), Y(-0.127), X(0.4), Y(-0.26)),
    call(5, X(0.05), Y(-0.05 * TAN + 0.1027 / COS), X(0.4), Y(0.3)), call(6, X(-0.12), Y(0.12 * TAN + 0.0517 / COS), X(-0.08), Y(0.4)), call(7, X(-0.24), Y(0.24 * TAN + 0.0712 / COS), X(-0.3), Y(0.4)),
    call(8, X(0.131), Y(-0.05), X(0.4), Y(-0.15)), call(9, X(0.0755), Y(-0.26), X(0.4), Y(-0.42)));
  body.push(T(40, 40, 'Eave gutter section (typical, not to scale)', { cls: 'd-bold' }), ...['1  Truss tail (top chord)', '2  Fascia', '3  Gutter, back higher than front', '4  Bracket', '5  Tile nose over the gutter', '6  Sarking dressed into the gutter', '7  Batten', '8  Overflow slot in the front face', '9  Downpipe outlet'].map((t, i) => T(40, 440 + i * 18, t)));
  return svg(900, 620, body.join(''), 'Eave gutter section');
}

function stormPlan() {
  const s = 16, ox = 70, oy = 24, px = (x, z) => [ox + (x + 7.5) * s, oy + (z + 17.5) * s], body = [R(0, 0, 900, 700, 'd-bg')];
  const [bx0, by0] = px(-7.5, -17.5), [bx1, by1] = px(7.5, 17.5), [, ky] = px(0, 20.5), [, fy] = px(0, 18.15);
  body.push(R(0, fy, 380, ky - fy, 'd-site'), R(0, ky, 380, 700 - ky, 'd-road'), R(bx0, by0, bx1 - bx0, by1 - by0, 'd-lot'));
  const [hx0, hy0] = px(HOUSE.x0, HOUSE.z0), [hx1, hy1] = px(HOUSE.x1, HOUSE.z1), [dx0, dy0] = px(2.9, 11.4), [dx1, dy1] = px(6.1, 17.4);
  body.push(R(dx0, dy0, dx1 - dx0, dy1 - dy0, 'd-drive'), R(hx0, hy0, hx1 - hx0, hy1 - hy0, 'd-house'));
  const route = (pts) => P(pts.map(([x, z]) => px(x, z)), 'd-storm', false);
  const rl = [[RT.E, 10.9], [RT.E, RT.REAR], [RT.W, RT.REAR], [RT.W, RT.KERB]];
  body.push(route(rl));
  for (const sg of [-1, 1]) for (const z of DP_Z) { const [x, y] = px(sg * DP_X, z), [rx, ry] = px(sg * 6.3, z); body.push(L(x, y, rx, ry, 'd-storm'), R(x - 5, y - 5, 10, 10, 'd-pit'), Circ(x, y, 3, 'd-dot')); }
  body.push(arrow(...px(RT.E, 5), ...px(RT.E, 3), 'd-line'), arrow(...px(0, RT.REAR), ...px(-1.5, RT.REAR), 'd-line'), arrow(...px(RT.W, 10), ...px(RT.W, 12.5), 'd-line'));
  const [qx, qy] = px(RT.W, 17.2), [lx, ly] = px(RT.W, RT.KERB);
  body.push(R(qx - 6, qy - 6, 12, 12, 'd-pit'), Circ(lx, ly, 7, 'd-lpod'));
  body.push(call(1, ...px(5.88, 10.9), 330, px(0, 8)[1]), call(2, ...px(6.3, 2), 330, px(0, 0)[1] + 0), call(3, ...px(0, RT.REAR), 330, px(0, -9)[1]), call(4, ...px(RT.W, 8), 22, px(0, 6)[1]), call(5, qx, qy, 22, px(0, 17.2)[1] - 20), call(6, lx, ly, 70, ky + 36));
  body.push(T(430, 60, 'Stormwater plan (illustrative, 16 px per metre)', { cls: 'd-bold' }), ...['1  Downpipe and grated pit (4)', '2  Collector pipe, falls to the rear', '3  Joint at the rear corner', '4  Main pipe, falls to the front', '5  Inspection opening at the boundary', '6  Legal point of discharge at the kerb'].map((t, i) => T(430, 90 + i * 22, t)),
    T(430, 250, 'The council report sets the LPOD. Typical', { cls: 'd-mute' }), T(430, 268, 'route only. The plumber sets out the pipes', { cls: 'd-mute' }), T(430, 286, 'to the engineer\'s or designer\'s drainage plan.', { cls: 'd-mute' }), T(bx0 + 4, by1 + 18, 'Street (kerb and channel)', { cls: 'd-mute' }));
  return svg(900, 700, body.join(''), 'Stormwater plan');
}

const drawings = [
  { id: 'roofsec', title: 'Roof section', scale: 'Typical, not to scale', svg: roofSection(),
    notes: ['1 Concrete tile. 2 Batten. 3 Sarking. 4 Truss top chord. 5 Ridge cap. 6 Fascia. 7 Gutter. 8 Downpipe.', 'Layers from the top: tile, batten, sarking, top chord. The sarking drops into the gutter and the tile nose overhangs it.', 'Gauge, head lap, fixings and pitch limits come from the tile maker and AS 2050. The truss design must be based on the cladding chosen.'] },
  { id: 'gutterdet', title: 'Eave gutter', scale: 'Typical, large scale', svg: gutterSection(),
    notes: ['The gutter back is higher than the front so overflow falls outside. Brackets at no more than 1.2 m and at the stop ends.', 'Typical minimum fall is 1 in 500 for an eave gutter on a timber fascia, with an overflow measure. Confirm the figures in Part 7.4 of your NCC edition.', 'Open the 3D gutter model to take the parts apart and see where the sarking and overflow slots go.'] },
  { id: 'stormplan', title: 'Stormwater plan', scale: 'Illustrative, 16 px per metre', svg: stormPlan(),
    notes: ['Four downpipes drop to grated pits. The collectors join at the rear and the main runs to the kerb at the front.', 'The legal point of discharge comes from the council report. The surveyor checks that the stormwater system ends there.', 'The route is typical only. The plumber lays pipes to the drainage plan, with a fall, bedding, cover and inspection openings.'] },
];

const howto = [
  ['Choose the roof cladding before the trusses are designed', 'The truss manufacturer needs to know tile or sheet, because tiles are much heavier. Confirm the choice with the owner and the plans.', 'Builder', 'T'],
  ['Apply for the council stormwater report', 'Ask the council for the report that gives the legal point of discharge. The building permit needs it for a stormwater system. Allow time.', 'Builder', 'V', 'vbaSD01'],
  ['Book the roof tiler, roof plumber, plumber and scaffolder', 'Sequence them so the scaffold is up before the fascia and gutters, and stays until the flashings and gutters are done.', 'Builder', 'T'],
  ['Fix the fascia and roll out the sarking', 'Fascia to every truss tail. Sarking laps and fixing as the maker shows. The sarking is usually laid before the battens.', 'Carpenter or roofer', 'C'],
  ['Lay the tiles from the eaves up', 'Gauge, head lap and fixings from the tile maker and AS 2050. Keep the load spread, not in heaps.', 'Roof tiler', 'C'],
  ['Bed and point the ridge, then flash penetrations', 'Fix every ridge tile mechanically as well as the bedding. Flash each pipe and vent with the product made for it.', 'Roof tiler and plumber', 'C'],
  ['Fix the gutters and downpipes', 'Fall to the outlets, brackets at maximum spacing, an overflow measure, and no downpipe serving more than 12 m of gutter.', 'Roof plumber', 'C', 'nccGutter'],
  ['Lay the stormwater pipes to the legal point of discharge', 'Pipes at a fall, on sand bedding with cover, with inspection openings, ending at the point the council set.', 'Plumber or drainer', 'C'],
  ['Water-test and record', 'Run water through the gutters, check the laps, fixings and flashings and photograph them before they are covered.', 'Builder', 'T'],
  ['Collect the plumbing compliance certificate', 'A licensed plumber issues it and lodges it with the VBA within five days of finishing. File it with the job records.', 'Plumber', 'V', 'vbaCert'],
];

const trades = [
  { t: 'Roof tiler', role: 'Lays sarking, battens, tiles, ridge and hip caps to the maker\'s data and AS 2050.', when: 'After the roof frame passes inspection', reg: 'Trade contractor with insurance and tile maker accreditation where required', ask: ['Supply and fix, or fix only', 'Rate per square and extras for the ridge, hips and valleys', 'Fixing schedule for your wind class'] },
  { t: 'Roof plumber', role: 'Fixes gutters, downpipes, flashings and roof penetrations.', when: 'After the tiles and before the stormwater pipes', reg: 'Licensed plumber (confirm the licence class with the VBA)', ask: ['Gutter and downpipe material, colour and size', 'Overflow measure and the fall they allow', 'Compliance certificate included'] },
  { t: 'Plumber or drainer (stormwater)', role: 'Lays pipes and pits from the downpipes to the legal point of discharge.', when: 'After the downpipes are fixed', reg: 'Licensed plumber (confirm the licence class with the VBA)', ask: ['Pit and pipe sizes and the route', 'Council works and fees at the kerb', 'Inspection openings, testing and certificate'] },
  { t: 'Scaffolder or edge protection hire', role: 'Provides scaffold at the eaves with guard rails and a handover certificate.', when: 'Before fascia and gutter work, and until flashings are done', reg: 'Licensed scaffolder above the notified height (confirm with WorkSafe)', ask: ['Scaffold hire period and extensions', 'Inspection and handover certificate', 'Who moves it for the downpipes'] },
  { t: 'Council engineering or building department', role: 'Issues the report that sets the legal point of discharge and may inspect the kerb connection.', when: 'Before the building permit is issued', reg: 'Local council', ask: ['Fee and timing for the LPOD report', 'Whether a works permit is needed at the kerb', 'Discharge rate limits that apply to the lot'] },
  { t: 'Building surveyor (RBS)', role: 'Approves the stormwater system and checks it ends at the council\'s legal point of discharge.', when: 'Before and after construction', reg: 'Registered building surveyor (BPC)', ask: ['What drainage documents they want', 'Whether they inspect the stormwater system', 'Records needed before the occupancy permit'] },
];

const materials = [
  ['Concrete or terracotta roof tiles, with ridge and hip tiles and accessories', 'Tile profile, colour and gauge come from the tile maker. Order the accessories at the same time', 'Tile maker or distributor. Get three quotes', 'C', 'Check the maker\'s fixing guide for your wind region.'],
  ['Sarking', 'Foil or vapour-permeable sheet, with tape and fixings the maker lists', 'Building supplier or tile distributor', 'C', 'Match the type to the climate zone and the NCC condensation rules.'],
  ['Roof battens', 'Size and spacing from the tile maker. Treated pine or steel', 'Timber merchant or Bunnings trade desk', 'C', 'Already fixed in Step 4 on this model. Check the gauge with the tile maker.'],
  ['Fascia boards', 'Timber, metal or fibre cement, in the colour and length the gutter system needs', 'Timber merchant or the gutter supplier', 'T', 'Check the gutter maker\'s data for the fascia type.'],
  ['Gutters, brackets, stop ends and outlets', 'Metal gutter profile sized for the roof area and rainfall, with overflow measures', 'Gutter makers such as Lysaght or Stratco, or a roof plumbing supplier', 'C', 'Use the maker\'s tables with the NCC rainfall figures.'],
  ['Downpipes, clips and pits', 'Typically 90 mm round, with clips and grated pits to match', 'Roof plumbing or plumbing supplier', 'T', 'Confirm size from the roof area served.'],
  ['Stormwater pipe and fittings', 'Typically 90 mm PVC with bends, junctions and inspection openings', 'Plumbing supplier', 'C', 'Check the Standard before choosing the grade.'],
  ['Pipe bedding sand', 'Clean sand under, around and over the pipe', 'Landscape or quarry supplier', 'T', 'Check the bedding detail in the Standard.'],
  ['Flashings and sealants', 'Cone or apron flashings for each pipe size and tile profile, with the sealant the maker lists', 'Roofing supplier', 'T', 'Do not use sealant on its own.'],
];

const quotes = [
  { who: 'Roof tiler', n: '3', what: ['Supply and fix of tiles, sarking, ridge and hips', 'Fixing schedule for the wind class', 'Warranty and who supplies accessories'] },
  { who: 'Roof plumber', n: '3', what: ['Gutters, downpipes, flashings and penetrations', 'Overflow measure and the fall in the gutter', 'Compliance certificate'] },
  { who: 'Plumber or drainer', n: '3', what: ['Stormwater pipes and pits to the LPOD', 'Council works at the kerb', 'Testing, inspection openings and certificate'] },
  { who: 'Scaffolder', n: '2 to 3', what: ['Scaffold at the eaves, with rails', 'Hire period and extensions', 'Handover certificate and inspections'] },
  { who: 'Tile maker or distributor', n: '2', what: ['Tiles, ridge and accessories', 'Delivery to site, loaded onto the roof or not', 'Lead time and colour batches'] },
  { who: 'Council', n: '1', what: ['LPOD report fee and timing', 'Any works permit and fee for the kerb connection'] },
];
const quoteTips = [
  'Choose the cladding first and tell the truss manufacturer, because tiles are heavier than sheet and change the truss design.',
  'Ask the tiler for the fixing schedule. A cheap quote that fixes fewer tiles than the maker requires for your wind class is not a saving.',
  'Check that the plumber\'s quote includes council works at the kerb, inspection openings and the compliance certificate.',
  'Ask who removes and refits the scaffold for the downpipes and whether the hire period covers a wet week.',
  'Apply for the council LPOD report early and keep the written report. The surveyor needs it and the plumber needs the location.',
  'Keep every quote and order. They are evidence of estimating for the BPC application.',
];

const inspections = [
  ['Sarking and batten check', 'Builder and roof tiler', 'Before the tiles go on', 'Laps and fixings, battens at the right gauge and fixed to every truss. Photograph before they are hidden.', 'C'],
  ['Tile fixing check', 'Builder', 'During and after tiling', 'Head lap, gauge and the number of tiles clipped or screwed as the maker\'s schedule requires.', 'C'],
  ['Ridge and flashing check', 'Builder and plumber', 'Before the roof is called watertight', 'Every ridge cap fixed, every penetration flashed with the right product.', 'T'],
  ['Gutter fall and overflow check', 'Builder and roof plumber', 'After the gutters are fixed', 'Fall, brackets, outlets, overflow measure and the number of downpipes. Run a hose through.', 'C', 'nccGutter'],
  ['Stormwater pipe check', 'Plumber and RBS if asked', 'Before the trench is covered', 'Fall, bedding, joints and inspection openings. Test as the Standard and the plumber require.', 'C'],
  ['Legal point of discharge check', 'RBS', 'Before the final inspection', 'The system ends at the point in the council report. The RBS approves the system and makes sure it matches.', 'V', 'vbaSD01'],
  ['Plumbing compliance certificate', 'Licensed plumber', 'Within five days of finishing', 'The plumber lodges it with the VBA and gives you a signed copy. File it with the job records.', 'V', 'vbaCert'],
  ['Records for the surveyor', 'Builder', 'Before the next stage', 'Tile maker\'s warranty and fixing guide, plumber\'s certificate, the council LPOD report and photographs.', 'T'],
];

const exam = [
  ['Which Standard covers installing roof tiles?', 'AS 2050 (the HIA article covers the 2018 edition). The NCC calls it up as a Deemed-to-Satisfy path. Confirm the current edition.', 'V', 'hiaTiles'],
  ['What does sarking do?', 'It sheds water that gets under the cladding and helps with condensation and heat. On a tile roof it is laid over the trusses and under the battens.', 'C'],
  ['Who sets the legal point of discharge?', 'The council, in its report under Regulation 133(2) of the Building Regulations.', 'V', 'vbaSD01'],
  ['Who checks that the stormwater system ends at the legal point of discharge?', 'The Relevant Building Surveyor approves the system and makes sure its point of discharge matches the council report.', 'V', 'vbaSD01'],
  ['Who is responsible for the drain up to the legal point of discharge?', 'The owner. The council is responsible between the legal point of discharge and the kerb or its drain.', 'V', 'vbaSD01'],
  ['What liability does section 16 of the Water Act 1989 create?', 'Liability for unreasonable flow of water onto another person\'s land that causes injury or damage.', 'V', 'vbaSD01'],
  ['What is the typical minimum fall for an eave gutter?', '1 in 500, unless the gutter is fixed to a metal fascia. Confirm in the NCC Housing Provisions Part 7.4.', 'C', 'nccGutter'],
  ['How many metres of gutter can one downpipe serve?', 'No more than 12 m.', 'C', 'nccGutter'],
  ['What is the maximum spacing of gutter brackets?', '1.2 m, with brackets also at the stop ends.', 'C', 'nccGutter'],
  ['Why does a gutter need an overflow measure?', 'So that a blocked or overloaded gutter spills outside the building, not into the roof or ceiling. Examples are front face slots, a controlled back gap or an end stop weir.', 'C', 'nccGutter'],
  ['Why must the truss manufacturer know the roof cladding?', 'Tiles are much heavier than sheet metal, and the truss is designed for the cladding load.', 'T'],
  ['Why fix ridge caps with screws or clips as well as bedding?', 'Mortar alone can crack and let go in high wind. The maker and AS 2050 list the fixings.', 'C'],
  ['What makes a roof penetration watertight?', 'A flashing made for the pipe and tile profile that laps over the tiles downslope and under the tiles upslope. Sealant finishes the flashing but does not replace it.', 'T'],
  ['Who may issue a plumbing compliance certificate, and when?', 'Only a licensed plumber. It must be lodged within five days of finishing work, for work of $750 or more among other cases.', 'V', 'vbaCert'],
  ['Can stormwater be connected to the sewer?', 'No. It goes to the legal point of discharge.', 'C'],
];

export default {
  n: 5, id: 'roofcladding', title: 'Roof cladding, gutters and stormwater', subtitle: 'From sarking and tiles to gutters, downpipes and the legal point of discharge.',
  phases, build, details, drawings, howto, trades, materials, quotes, quoteTips, inspections, exam,
  sources: ['hiaTiles', 'vbaSD01', 'vbaCert', 'nccGutter', 'bpcMI01', 'hiaStd25', 'hiaNcc25'],
  caution: 'Tile, gutter and drainage details here are typical. The tile maker\'s data, AS 2050, AS/NZS 3500.3 and the NCC govern, and the paywalled Standards were not opened. Verified applies only to the sources named in Sources: the roof tile Standard, the legal point of discharge notes from the VBA and the plumbing certificate rules. The gutter figures come from the NCC Navigator page, whose edition was not stated, so confirm them.',
};

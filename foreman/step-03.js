// Step 3: wall framing (90 x 45 MGP10 studs at 450 mm, plates, openings, bracing and tie-down).
// Sizes and spacings here are typical. The AS 1684 series and the engineer's drawings govern, and the Standard is not freely readable,
// so almost every rule is flagged Typical or Confirm. Verified is used only for listings and pages that were opened.
import { buildBase, buildSiteWorks, HOUSE, BASE_COLLIDERS, MAP } from './site.js';
import { svg, T, L, R, P, dim, call } from './dwg.js';
import { F, layout, worldAt, wallMembers, mergeBoxes, buildFrames, buildSlab } from './frame.js';

const { z1: Z1 } = HOUSE;
const phases = [
  { title: 'Delivery and set-out', text: 'Timber packs arrive and are stored clear of the ground. The wall lines are set out on the slab with chalk.' },
  { title: 'Frames assembled flat', text: 'Plates, studs, noggings and opening members are nailed together on the slab, one wall at a time.' },
  { title: 'Frames stand up', text: 'Each frame is lifted onto its chalk line and fixed. The walls go up one after another.' },
  { title: 'Plumb, line and temporary brace', text: 'Walls are plumbed and lined with string, then held by props until the permanent bracing is in.' },
  { title: 'Bracing, top plates and tie-down', text: 'The second top plate laps the corners. Permanent bracing and tie-down rods go in to the engineer\'s detail.' },
  { title: 'Wall frame check', text: 'The frame is checked against the drawings before the trusses are lifted. The formal frame inspection usually follows the roof frame.' },
];

function build(kit) {
  const { THREE, C, mat, box, textPlane, cyl } = kit;
  const mk = (n) => { const g = new THREE.Group(); g.name = n; return g; };
  const base = buildBase(kit), w = buildSiteWorks(kit), slab = buildSlab(kit), fr = buildFrames(kit), G = fr.groups;

  const packs = mk('packs'), tm = mat(0xffffff, { tex: 'timber' }), strap = mat(0xe8590c), bearer = mat(0x8a6a3c, { tex: 'timber' });
  for (const [x, z, h] of [[6.4, 1.2, 0.55], [6.4, 4.4, 0.55], [6.4, 7.6, 0.4]]) {
    packs.add(box(1.0, h, 3.2, tm, x, 0.1 + h / 2, z));
    for (const dz of [-1.2, 1.2]) { packs.add(box(1.2, 0.08, 0.1, bearer, x, 0.04, z + dz)); packs.add(box(1.02, h + 0.02, 0.025, strap, x, 0.1 + h / 2, z + dz * 0.6)); }
  }
  packs.add(box(0.2, 0.4, 3.6, mat(0xe3c48e, { tex: 'timber' }), 5.1, 0.2, 3));

  const marker = mk('standing'), check = mk('check');
  const sign = textPlane(['CHECK POINT', 'Wall frame check', 'Before the trusses are lifted'], 1.8, 0.9);
  sign.position.set(0, 1.5, Z1 + 1.3); check.add(sign);
  check.add(cyl(0.04, 1.6, mat(C.steel), -0.8, 0.8, Z1 + 1.28, 8)); check.add(cyl(0.04, 1.6, mat(C.steel), 0.8, 0.8, Z1 + 1.28, 8));

  let s = 0;
  const tickers = [(dt) => {
    const snap = G.temp.visible || G.brace.visible || check.visible;
    const target = marker.visible || snap ? 1 : 0;
    s = snap ? 1 : s + Math.sign(target - s) * Math.min(Math.abs(target - s), dt * 0.3);
    fr.stand(s);
  }];

  const layers = [
    { group: base }, { group: w.fence }, { group: w.sign }, { group: w.silt }, { group: w.entry }, { group: w.amenities }, { group: slab },
    { group: packs, until: 3 }, { group: G.chalk, until: 2 }, { group: G.walls, from: 1 }, { group: marker, from: 2 },
    { group: G.temp, from: 3, until: 4 }, { group: G.plate2, from: 4 }, { group: G.brace, from: 4 }, { group: G.tie, from: 4 }, { group: check, from: 5 },
  ];

  // positions for pins that sit on the generated frame
  const east = fr.lay.find((l) => l.w.id === 'east'), anyPly = fr.lay.find((l) => l.brace.some((b) => b.kind === 'ply')) || east;
  const ply = anyPly.brace.find((b) => b.kind === 'ply') || anyPly.brace[0], plyMid = (ply.u0 + ply.u1) / 2;
  const plyPos = worldAt(anyPly.w, plyMid, 1.4, -0.07), plyOut = worldAt(anyPly.w, plyMid, 0, -4.5);
  const tieU = east.tie[Math.min(1, east.tie.length - 1)], tiePos = worldAt(east.w, tieU, 1.6, 0.07), tieStand = worldAt(east.w, tieU, 0, 2.2);
  const tempPos = worldAt(east.w, east.temp[0] + 0.35, 1.2, 0.9);
  const fw = fr.lay.find((l) => l.w.id === 'front'), winU = fw.w.open[0].u, winPos = worldAt(fw.w, winU, 1.5, 0);

  return {
    layers, colliders: BASE_COLLIDERS, tickers,
    spawn: { pos: [3.5, 17], yaw: 0, pitch: -0.1 }, map: MAP,
    orbit: { pos: [19, 14, 29], target: [0, 1, 4] },
    hotspots: [
      { id: 'packs', title: 'Timber delivery and storage', pos: [6.4, 1.2, 3], stand: [6.2, 15], from: 0, until: 3,
        summary: 'Check each pack against the order before it is signed for. Store it flat, clear of the ground and covered, so it stays straight and dry.',
        learn: [['Check grade stamps, size, length, treatment and quantity on delivery. Frame timber is normally stamped with its stress grade, for example MGP10.', 'T'], ['Stack on level bearers clear of the ground and cover it. Wet or twisted timber is rejected or set aside.', 'T'], ['Bunnings lists 90 x 45 MGP10 H2 blue pine in 3.0 m lengths and 90 x 45 MGP10 untreated pine in 3.6 m lengths. Frame fabricators supply pre-cut frames for larger jobs.', 'V', 'bunnMGP'], ['Treatment (H2 or other) depends on the termite management system and the design. Confirm with the designer and the installer.', 'C']], drawing: 'elev' },
      { id: 'setout', title: 'Set-out on the slab', pos: [-5.3, 0.45, 7], stand: [-6.8, 14], from: 0, until: 2,
        summary: 'The wall lines are chalked on the slab from the plan. The outer face of the frame sits back from the slab edge to leave room for the brick veneer cavity.',
        learn: [['Check the slab for level, size and square (measure both diagonals) before any timber is fixed.', 'T'], ['Mark the frame outer face from the slab edge, then every internal wall, and mark each opening. Check against the endorsed floor plan.', 'T'], ['For brick veneer the frame is typically set about 150 mm in from the slab edge: 110 mm for the brick and about 40 mm for the cavity. The engineer\'s rebate detail governs.', 'T'], ['Plates are fixed down with the anchors on the drawings and often sit on a damp-proof layer. Confirm the type and spacing with the engineer.', 'C']], drawing: 'plan' },
      { id: 'frames', title: 'Frame assembly', pos: [-1.5, 0.4, 2.2], stand: [0, 16], from: 1, until: 3, drawing: 'elev',
        summary: 'Frames are nailed together flat, then checked square by measuring the diagonals before they are stood up.',
        learn: [['Typical frame: 90 x 45 MGP10 studs at 450 or 600 mm centres, bottom plate, top plate, noggings, and king studs, trimmers, lintel and sill at each opening. Spacing comes from the AS 1684 span tables for the loads.', 'T'], ['Check each frame square by measuring both diagonals before standing it.', 'T'], ['Fix with the nail type and spacing in AS 1684 or the engineer\'s detail. Ask for the table, not a rule of thumb.', 'C'], ['Pre-nailed frames from a fabricator arrive with the engineering and a layout drawing. Check the delivery against it.', 'T']] },
      { id: 'opening', title: 'Window opening framing', pos: winPos, stand: [winPos[0], 17], from: 2, detail: 'opening', drawing: 'elev',
        summary: 'Around an opening: king studs both sides, trimmers under the lintel, the lintel across the top, a sill, and cripples above and below.',
        learn: [['The lintel carries the load over the opening. It bears on trimmer studs, and the king studs beside them stop the lintel and trimmers from moving sideways.', 'T'], ['Lintel size and material (for example LVL or doubled sawn timber) come from the AS 1684 span tables or the engineer. Do not copy typical sizes.', 'C'], ['Cripple studs above and below an opening keep the 450 mm grid so linings and cladding have something to fix to.', 'T'], ['A doorway has no sill and the bottom plate is cut through it.', 'T']] },
      { id: 'stand', title: 'Stand, fix and plumb', pos: [5.3, 1.4, 4], stand: [7.1, 14], from: 2, until: 4,
        summary: 'Frames are lifted one by one, fixed to the slab and to each other at the corners, then plumbed with a level and a string line.',
        learn: [['Lifting a long frame is a manual handling risk. Plan the lift, use enough people and keep clear of the falling line. This is a safe-work method item.', 'T'], ['Fix frames to each other at corners and intersections, and to the slab as detailed. Do not leave a frame standing with only a few nails in.', 'T'], ['Plumb each wall, then check the string line along the top plate for straightness.', 'T']] },
      { id: 'temp', title: 'Temporary bracing', pos: tempPos, stand: [7.1, 14], from: 3, until: 4,
        summary: 'Props hold the walls plumb and straight until the permanent bracing and the roof frame lock them together. A wall with no props can be blown over.',
        learn: [['Temporary bracing stays until the permanent bracing and roof frame are fixed. Wind is the main danger while the frame is open.', 'T'], ['Props are fixed to the frame and to the slab or stakes, and checked again after any storm or strong wind.', 'T'], ['Do not walk under or lean on a propped wall. Keep other trades out of the area while props are being moved.', 'T']] },
      { id: 'bracing', title: 'Permanent bracing', pos: plyPos, stand: [Math.max(-6.9, Math.min(6.9, plyOut[0])), Math.min(18, Math.max(-12, plyOut[2]))], from: 4, detail: 'bracing', drawing: 'plan',
        summary: 'Bracing resists sideways wind load (racking). It is placed in the walls and in the amounts the plan shows, and is nailed or tensioned exactly as detailed.',
        learn: [['Bracing resists racking from wind. It is placed as walls of plywood sheet, metal strap or diagonal timber, in the walls and amounts the bracing plan shows.', 'T'], ['The amount of bracing depends on the wind classification, the roof shape and the wall length. AS 1684 gives the capacities and the engineer or designer sets the plan.', 'C'], ['Nail spacing and the end fixings are part of a bracing wall\'s rating. A wall with the wrong nailing is not the wall that was designed.', 'C'], ['Never cut a brace to make room for a service. Ask the engineer first.', 'T']] },
      { id: 'tiedown', title: 'Tie-down: the load path', pos: tiePos, stand: [tieStand[0], tieStand[2]], from: 4, detail: 'tiedown', drawing: 'secWall',
        summary: 'Wind tries to lift the roof off. Tie-down connects the roof to the top plate, the frame to the bottom plate, and the bottom plate to the slab, in one continuous chain.',
        learn: [['Tie-down resists uplift, bracing resists racking. A chain is only as good as its weakest link, so check every link from roof to slab.', 'T'], ['Wind classification (AS 4055: N1 to N6 for non-cyclonic areas, C1 to C4 for cyclonic) sets how strong the chain must be. The surveyor or engineer determines it for the site.', 'T'], ['Where trusses sit directly over studs, the load path is short and direct. Check the tie-down detail for the connection type, rod size and spacing.', 'C'], ['Rods and anchors go in to the engineer\'s detail, with the embedment, edge distance and washers the product listing requires.', 'C']] },
      { id: 'check', title: 'Wall frame check', pos: [0, 1.5, Z1 + 1.3], stand: [0, 17], from: 5,
        summary: 'Before the trusses go on, check the walls against the drawings and fix any defects while they are easy to reach.',
        learn: [['Check: plumb and straight, openings and lintels as drawn, bracing and tie-down complete, all connections nailed, no cut or damaged members.', 'T'], ['The formal frame inspection by the building surveyor usually covers the wall and roof frame together, so it normally comes after the roof frame. Check the stage list on the permit.', 'C', 'vbaMand'], ['The engineer may inspect the frame and issue a certificate. Ask when they want to see it.', 'T'], ['In Victoria the contract names a frame stage for payment. Confirm the stage wording and percentages in the contract and with Consumer Affairs Victoria, because the rules are changing.', 'C', 'cavPay']] },
    ],
  };
}

/* ---------- 3D detail models ---------- */
const lump = (kit, list, cats) => {
  const g = new kit.THREE.Group(), m = mergeBoxes(list.filter((q) => cats.includes(q[6])), kit.mat(0xffffff, { tex: 'timber' }), kit.boxUV);
  if (m) g.add(m); return g;
};

const details = {
  opening: {
    title: 'Window opening in a stud wall', sub: 'King studs, trimmers, lintel, sill, cripples, noggings and plates', floor: -0.02, gridSize: 4,
    camera: { pos: [2.7, 1.8, 4.4], target: [0, 1.3, 0] },
    build(kit) {
      const { THREE, ghost, outline, box } = kit, len = 2.0, ox = -len / 2;
      const mem = wallMembers(len, [{ u: 1.0, w: 0.9, sill: 0.9 }], { plate2: true }), all = [...mem.frame, ...mem.plate2];
      const part = (cats, g0) => { const g = lump(kit, all, cats); g.position.set(ox, 0, 0); return Object.assign(g, g0 || {}); };
      const win = new THREE.Group(); win.add(outline(box(0.9, 1.2, 0.09, ghost(0x8fc3e8, 0.35), 0, 1.5, 0))); win.position.set(0, 0, 0);
      return { parts: [
        { id: 'bp', name: 'Bottom plate', group: part(['bp']), explode: [0, -0.45, 0], anchor: [-0.7, 0.0225, 0.045], flag: 'T', spec: '90 x 45 MGP10, typically. Runs under windows and is cut at doorways.',
          desc: 'Fixed to the slab with the anchors on the drawings. It spreads the load from the studs into the slab and holds the wall line.' },
        { id: 'stud', name: 'Studs and end studs', group: part(['stud']), explode: [0, 0, 0.6], anchor: [-0.9775, 1.3, 0.045], flag: 'T', spec: '90 x 45 MGP10 at 450 or 600 mm centres, from the AS 1684 span tables.',
          desc: 'The vertical members. They carry the roof and ceiling load down to the plates and give linings and cladding something to fix to.' },
        { id: 'king', name: 'King studs', group: part(['king']), explode: [0, 0, 0.32], anchor: [-0.5175, 1.5, 0.045], flag: 'T', spec: 'Full-height studs, one each side of the opening.',
          desc: 'They run from plate to plate beside the opening. They hold the trimmers and lintel in place and stop them moving sideways.' },
        { id: 'trim', name: 'Trimmer (jack) studs', group: part(['trim']), explode: [0, 0, -0.32], anchor: [-0.4725, 1.0, 0.045], flag: 'T', spec: 'From the bottom plate up to the underside of the lintel.',
          desc: 'They carry the lintel load straight down to the bottom plate. The lintel sits on them.' },
        { id: 'lintel', name: 'Lintel', group: part(['lintel']), explode: [0, 0.45, 0.1], anchor: [0, 2.195, 0.045], flag: 'C', spec: 'Size and material from the AS 1684 span tables or the engineer. For example doubled sawn timber or LVL.',
          desc: 'Carries the load of the roof, ceiling and wall above across the opening. It must be the size on the drawings, and it must bear on the trimmers.' },
        { id: 'sill', name: 'Sill trimmer', group: part(['sill']), explode: [0, -0.18, 0.25], anchor: [0, 0.8775, 0.045], flag: 'T', spec: 'Horizontal member across the bottom of the window opening.',
          desc: 'Forms the bottom of the opening and supports the window sill. Its height is set by the window schedule.' },
        { id: 'crip', name: 'Cripple studs', group: part(['crip']), explode: [0, 0, 0.85], anchor: [-0.0775, 2.45, 0.045], flag: 'T', spec: 'Short studs above the lintel and below the sill, on the stud grid.',
          desc: 'They keep the 450 mm grid so plasterboard, bracing sheets and cladding have framing to fix to above and below the window.' },
        { id: 'nog', name: 'Noggings', group: part(['nog']), explode: [0, 0, -0.65], anchor: [-0.7475, 1.3, 0.045], flag: 'C', spec: 'Short horizontal members between studs, typically staggered. Spacing rules are in AS 1684.',
          desc: 'They stop studs buckling, give a fixing edge for linings and cabinets, and are offset up and down so each end can be nailed. Check the maximum spacing for your stud size and height.' },
        { id: 'tp', name: 'Top plates (double)', group: part(['tp']), explode: [0, 0.6, 0], anchor: [-0.7, 2.6775, 0.045], flag: 'C', spec: 'Two plates, 90 x 45, with the second lapping the corners and joints of the first.',
          desc: 'Tie the tops of the studs together and spread roof loads. The second plate laps across corners and joints to lock the walls to each other. Some designs allow a single plate when the roof members sit directly over studs. Confirm in AS 1684.' },
        { id: 'win', name: 'Window opening (rough opening)', group: win, explode: [0, 0, 1.15], anchor: [0, 1.5, 0.045], flag: 'T', spec: 'The opening is cut slightly larger than the window. The manufacturer\'s schedule governs.',
          desc: 'Shown as a transparent block. The opening is sized from the window schedule and flashed later (Step 7).' },
      ] };
    },
  },

  tiedown: {
    title: 'Tie-down: roof to slab', sub: 'One link in the load path, from the truss to the slab anchor', floor: -0.3, gridSize: 5,
    camera: { pos: [3.7, 1.7, 6.3], target: [0, 1.15, 0] },
    build(kit) {
      const { THREE, C, mat, ghost, box, cyl, rod, outline } = kit, tm = mat(0xffffff, { tex: 'timber' }), steel = mat(0xb8c0c9, { metalness: 0.6, roughness: 0.35 }), mk = () => new THREE.Group();
      const slab = mk(); slab.add(outline(box(0.7, 0.28, 0.6, ghost(C.concrete, 0.4), 0, -0.14, 0)));
      const dpc = mk(); dpc.add(box(0.14, 0.004, 0.6, mat(C.black), 0, 0.002, 0));
      const bp = mk(); bp.add(box(0.09, 0.045, 0.6, tm, 0, 0.0265, 0));
      const stud = mk(); for (const z of [-0.225, 0.225]) stud.add(box(0.09, 2.565, 0.045, tm, 0, 0.049 + 1.2825, z));
      const tp = mk(); tp.add(box(0.09, 0.045, 0.6, tm, 0, 2.6325 + 0.0, 0)); tp.add(box(0.09, 0.045, 0.6, tm, 0, 2.6775, 0));
      const truss = mk(); truss.add(box(0.95, 0.09, 0.035, tm, 0.4, 2.745, 0.225));
      const top = box(1.4, 0.09, 0.035, tm, 0.3, 2.9, 0.225); top.rotation.z = Math.atan(0.4142); top.position.set(0.25, 2.88, 0.225); truss.add(top);
      truss.add(box(0.14, 0.14, 0.004, steel, -0.02, 2.77, 0.245));
      const rodG = mk(); rodG.add(cyl(0.006, 2.62, steel, 0, 1.4, 0, 10)); rodG.add(cyl(0.025, 0.006, steel, 0, 2.703, 0, 14)); rodG.add(cyl(0.012, 0.014, steel, 0, 2.713, 0, 6));
      const anchor = mk(); anchor.add(cyl(0.006, 0.2, steel, 0, -0.1, 0, 10)); anchor.add(outline(cyl(0.013, 0.19, ghost(0xf2c14e, 0.5), 0, -0.095, 0, 14)));
      const strap = mk(); strap.add(box(0.003, 0.65, 0.03, steel, 0.0465, 2.38, 0.225)); strap.add(box(0.1, 0.003, 0.03, steel, 0.095, 2.7915, 0.225));
      return { parts: [
        { id: 'slab', name: 'Slab (shown transparent)', group: slab, explode: [0, -0.5, 0], anchor: [0.35, -0.14, 0.2], flag: 'T', spec: 'The anchor goes into the structural slab or beam, at the depth and edge distance the engineer details.',
          desc: 'The end of the load chain. A tie-down anchor in a thin or cracked edge does nothing, so the detail and the placement matter.' },
        { id: 'anchor', name: 'Anchor and adhesive', group: anchor, explode: [0, -0.3, 0.3], anchor: [0, -0.1, 0.0], flag: 'C', spec: 'Cast-in or drilled and bonded threaded rod, to the product\'s approval and the engineer\'s detail.',
          desc: 'Bonded anchors need a clean hole and the right adhesive. Check the embedment, edge distance, spacing and cure time in the product listing.' },
        { id: 'dpc', name: 'Damp-proof course', group: dpc, explode: [0, -0.2, 0], anchor: [0.07, 0.002, 0.3], flag: 'C', spec: 'A damp-proof or termite-barrier layer between the slab and the plate, where the design needs one.',
          desc: 'Stops moisture wicking from the slab into the plate. Confirm the layer and the lap with the engineer and the termite installer.' },
        { id: 'bp', name: 'Bottom plate', group: bp, explode: [0, -0.08, 0.1], anchor: [-0.045, 0.0265, 0.3], flag: 'T', spec: '90 x 45 MGP10, fixed to the slab.',
          desc: 'The rod passes through a drilled hole in the plate. The plate washer spreads the load across the timber.' },
        { id: 'stud', name: 'Studs', group: stud, explode: [-0.4, 0, 0], anchor: [-0.045, 1.3, 0.225], flag: 'T', spec: '90 x 45 MGP10, at 450 mm centres here.',
          desc: 'Carry the roof load down to the plate. The rod sits in the space between two studs.' },
        { id: 'tp', name: 'Top plates (double)', group: tp, explode: [0, 0.18, 0], anchor: [-0.045, 2.655, 0.3], flag: 'C', spec: 'Two plates, 90 x 45. The rod head sits on a washer over the upper plate.',
          desc: 'The second plate laps the first. Connectors that hold the truss down work through these plates.' },
        { id: 'rod', name: 'Continuous threaded rod', group: rodG, explode: [0.45, 0.35, 0], anchor: [0, 1.4, 0], flag: 'C', spec: 'For example an M12 galvanised rod with plate washers and nuts. Size and spacing from the engineer or AS 1684.',
          desc: 'Runs from the slab anchor to the top plate and clamps the frame down. It must be tight and not bent, and the nut and washer must bear fully on the plate.' },
        { id: 'truss', name: 'Truss heel', group: truss, explode: [0, 0.6, 0.15], anchor: [0.4, 2.745, 0.225], flag: 'T', spec: 'The truss bears on the top plate, directly over a stud where possible.',
          desc: 'Shown as a short section of one truss. Fabricators supply the truss design, including the bracing and the connection details (Step 4).' },
        { id: 'strap', name: 'Truss tie-down strap', group: strap, explode: [0.4, 0.3, 0.1], anchor: [0.0465, 2.38, 0.225], flag: 'C', spec: 'Galvanised metal strap or bracket, nailed with the number and type of nails the manufacturer lists.',
          desc: 'Ties the truss to the plates and studs. Every nail hole counts, so use every hole the table asks for and use the right nail.' },
      ] };
    },
  },

  bracing: {
    title: 'Wall bracing: sheet and strap', sub: 'Plywood sheet on the outside, metal strap on the inside, hold-down rods at the ends', floor: -0.02, gridSize: 5,
    camera: { pos: [2.6, 1.9, 4.6], target: [0, 1.3, 0] },
    build(kit) {
      const { THREE, C, mat, box, cyl, rod } = kit, len = 2.4, ox = -len / 2, mem = wallMembers(len, [], { plate2: true }), all = [...mem.frame, ...mem.plate2];
      const steel = mat(0xb8c0c9, { metalness: 0.6, roughness: 0.35 }), plyM = mat(0xffffff, { tex: 'timber', color: 0xe8c690 }), mk = () => new THREE.Group();
      const frame = lump(kit, all, ['bp', 'tp', 'stud', 'nog']); frame.position.x = ox;
      const sheet = mk(); sheet.add(box(1.2, 2.58, 0.012, plyM, 0.6, 0.045 + 1.29, -0.051)); sheet.position.x = ox;
      const nails = mk(), nm = mat(0x333b44, { metalness: 0.5 });
      const dot = (x, y) => nails.add(cyl(0.004, 0.004, nm, x, y, -0.0575, 8));
      for (let x = 0.05; x <= 1.16; x += 0.15) { dot(x, 0.07); dot(x, 2.6); }
      for (let y = 0.07; y <= 2.6; y += 0.15) { dot(0.05, y); dot(1.15, y); }
      for (let y = 0.2; y <= 2.5; y += 0.3) dot(0.6, y);
      const sx = (a, b) => rod([a, 0.07, 0.049], [b, 2.58, 0.049], 0.009, steel);
      const stp = mk(); stp.add(sx(1.35, 2.3)); stp.add(box(0.05, 0.05, 0.004, steel, 1.35, 0.07, 0.05)); stp.add(box(0.05, 0.05, 0.004, steel, 2.3, 2.58, 0.05)); stp.position.x = ox;
      const hold = mk(); for (const x of [0.07, 1.13]) { hold.add(cyl(0.007, 2.7, steel, x, 1.35, 0.057, 8)); hold.add(cyl(0.028, 0.008, steel, x, 2.62, 0.057, 10)); }
      hold.position.x = ox;
      return { parts: [
        { id: 'frame', name: 'Wall frame', group: frame, explode: [0, 0, 0], anchor: [ox + 1.8225, 2.2, 0], flag: 'T', spec: 'Studs at 450 mm, plates and noggings. Any bracing wall needs a solid frame with no cut members.',
          desc: 'Bracing only works if the frame behind it is sound. Check studs, plates, noggings and every nail before the sheet goes on.' },
        { id: 'ply', name: 'Plywood sheet bracing', group: sheet, explode: [0, 0, -0.9], anchor: [ox + 0.6, 1.9, -0.057], flag: 'C', spec: 'Sheet size, thickness, grade and fixing from AS 1684 or the engineer\'s bracing plan.',
          desc: 'A full-height sheet nailed to every stud and plate stops the frame racking sideways. It is the nailing pattern that gives it strength.' },
        { id: 'nails', name: 'Edge and field nailing', group: nails, explode: [0, 0, -0.95], anchor: [ox + 0.05, 1.0, -0.0575], flag: 'C', spec: 'Closer nail spacing at the sheet edges, wider in the field. Take the numbers from the bracing detail.',
          desc: 'Edge nailing carries the load from sheet to frame. Shown as small discs. Under-nailing or nails that miss the stud give a weaker wall than the one designed.' },
        { id: 'strap', name: 'Metal strap bracing', group: stp, explode: [0, 0, 0.9], anchor: [ox + 1.8, 1.3, 0.051], flag: 'C', spec: 'Galvanised strap fixed to plates and studs and tensioned. Use the manufacturer\'s table for the number and size.',
          desc: 'A diagonal strap works in tension, so it must be straight and tight. A kink or a loose end means it will not work until the wall has already moved.' },
        { id: 'hold', name: 'Hold-down rods', group: hold, explode: [0, 0.55, 0.4], anchor: [ox + 0.07, 0.6, 0.057], flag: 'C', spec: 'Tie-down at the ends of a braced wall as the bracing detail asks, with plate washers.',
          desc: 'A braced wall tries to lift at one end when wind pushes it. The hold-down resists this by tying the end stud to the slab.' },
      ] };
    },
  },
};

/* ---------- 2D drawings ---------- */
function elevation() {
  const s = 170, ox = 110, oy = 540, X = (m) => ox + s * m, Y = (m) => oy - s * m;
  const mem = wallMembers(4.0, [{ u: 2.0, w: 1.2, sill: 0.9 }], { plate2: true }), all = [...mem.frame, ...mem.plate2];
  const body = [R(0, 0, 900, 640, 'd-bg')];
  for (const [w, h, , x, y, , cat] of all) body.push(R(X(x - w / 2), Y(y + h / 2), w * s, h * s, cat === 'tp' && y > 2.65 ? 'd-timberx' : 'd-timber'));
  const pick = (cat, i = 0) => all.filter((q) => q[6] === cat)[i];
  const at = (q, k = 0) => [X(q[3]), Y(q[4]) + k];
  const studs = all.filter((q) => q[6] === 'stud'), nog = pick('nog');
  body.push(
    L(X(-0.2), Y(0), X(4.2), Y(0), 'd-ground'),
    dim(X(0), Y(0) + 34, X(4), Y(0) + 34, '4 000 wall length'), dim(X(-0.15), Y(2.7), X(-0.15), Y(0), '2 700 overall', 1),
    dim(X(studs[1][3]), Y(2.75) - 18, X(studs[2][3]), Y(2.75) - 18, '450', 1),
    dim(X(4.1), Y(2.1), X(4.1), Y(0), '2 100 head', -1), dim(X(4.1) + 62, Y(0.9), X(4.1) + 62, Y(0), '900 sill', -1),
    dim(X(1.4), Y(2.1) + 22, X(2.6), Y(2.1) + 22, '1 200 opening', -1),
    call(1, ...at(pick('bp')), X(0.7), Y(-0.45)), call(2, ...at(studs[2]), X(0.75), Y(2.95)), call(3, ...at(pick('king')), X(1.3), Y(2.95)), call(4, ...at(pick('trim')), X(1.2), Y(0.55)),
    call(5, ...at(pick('lintel')), X(2.0), Y(2.95)), call(6, ...at(pick('sill')), X(2.0), Y(0.55)), call(7, ...at(pick('crip')), X(2.55), Y(2.95)), call(8, ...at(nog), X(0.95), Y(1.2) + 0), call(9, X(3.3), Y(2.6775), X(3.5), Y(2.95)),
    T(40, 36, 'Wall frame elevation (typical, not to scale)', { cls: 'd-bold' }),
  );
  return svg(900, 640, body.join(''), 'Wall frame elevation');
}

function wallSection() {
  const s = 0.165, ox = 330, oy = 585, X = (m) => ox + s * m, Y = (m) => oy - s * m;
  const poly = (pts, cls) => P(pts.map(([x, y]) => [X(x), Y(y)]), cls);
  const body = [
    R(0, 0, 900, 680, 'd-bg'),
    poly([[0, -250], [700, -250], [700, 150], [110, 150], [110, 80], [0, 80]], 'd-conc'),
    R(X(-300), Y(0), s * 300, s * 250, 'd-soil'), L(X(-300), Y(0), X(0), Y(0), 'd-ground'),
    R(X(0), Y(2400), s * 110, s * 2320, 'd-brick'),
    L(X(150), Y(150), X(150), Y(2850), 'd-wrap'),
    R(X(150), Y(153), s * 90, s * 45, 'd-timber'), R(X(150), Y(198), s * 90, s * 2565, 'd-timber'), R(X(150), Y(2763), s * 90, s * 45, 'd-timber'), R(X(150), Y(2808), s * 90, s * 45, 'd-timberx'),
    R(X(240), Y(2850), s * 10, s * 2700, 'd-board'),
    poly([[150, 2850], [900, 2850], [900, 2940], [150, 2940]], 'd-timber'),
    poly([[-350, 2643], [700, 3078], [700, 3178], [-350, 2743]], 'd-timber'),
    `<polyline class="d-strap" points="${X(248)},${Y(2150)} ${X(248)},${Y(2940)} ${X(330)},${Y(2940)}"/>`,
    L(X(195), Y(-170), X(195), Y(2860), 'd-mesh'),
    dim(X(1000), Y(150), X(1000), Y(2850), '2 700 frame', -1), dim(X(-360), Y(0), X(-360), Y(150), '150', 1),
    dim(X(0), Y(-300), X(110), Y(-300), '110', 1), dim(X(110), Y(-300), X(150), Y(-300), '40', 1), dim(X(150), Y(-300), X(240), Y(-300), '90', 1),
    call(1, X(300), Y(-60), X(560), Y(-200)), call(2, X(195), Y(175), X(560), Y(60)), call(3, X(195), Y(1400), X(560), Y(1300)), call(4, X(195), Y(2830), X(560), Y(2500)),
    call(5, X(150), Y(1900), X(-250), Y(1900)), call(6, X(300), Y(2940), X(640), Y(3300)), call(7, X(195), Y(-100), X(-250), Y(-200)), call(8, X(245), Y(900), X(560), Y(900)), call(9, X(55), Y(1200), X(-250), Y(1200)),
    T(40, 40, 'Section through an external wall (typical, not to scale)', { cls: 'd-bold' }),
  ].join('');
  return svg(900, 680, body, 'External wall section');
}

function framePlan() {
  const k = 32, px = (x, z) => [90 + (x + 5.5) * k, 80 + (z + 5.5) * k];
  const lay = layout(), body = [R(0, 0, 900, 720, 'd-bg')];
  const quad = (w, a, b, t) => { const ux = w.dir[0], uz = w.dir[1], nx = -uz * t, nz = ux * t; return [[a[0] + nx, a[1] + nz], [b[0] + nx, b[1] + nz], [b[0] - nx, b[1] - nz], [a[0] - nx, a[1] - nz]].map(([x, z]) => px(x, z)); };
  const along = (w, u) => [w.a[0] + w.dir[0] * u, w.a[1] + w.dir[1] * u];
  for (const { w } of lay) body.push(P(quad(w, w.a, w.b, 0.045), 'd-timber'));
  for (const { w } of lay) for (const o of w.open) {
    const a = along(w, o.u - o.w / 2), b = along(w, o.u + o.w / 2);
    body.push(P(quad(w, a, b, 0.055), 'd-bg'), P(quad(w, a, b, o.sill ? 0.02 : 0.005), o.sill ? 'd-ply' : 'd-door'));
  }
  for (const { w, brace, tie } of lay) {
    for (const b of brace) body.push(P(quad(w, along(w, b.u0), along(w, b.u1), 0.085), 'd-hatch'));
    for (const u of tie) body.push(`<circle cx="${px(...[w.a[0] + w.dir[0] * u - w.dir[1] * 0.07, w.a[1] + w.dir[1] * u + w.dir[0] * 0.07])[0].toFixed(1)}" cy="${px(...[w.a[0] + w.dir[0] * u - w.dir[1] * 0.07, w.a[1] + w.dir[1] * u + w.dir[0] * 0.07])[1].toFixed(1)}" r="3" class="d-dot"/>`);
  }
  const [x0, y0] = px(-5.5, -5.5), [x1, y1] = px(5.5, 11.5), by = (id) => lay.find((l) => l.w.id === id);
  const front = by('front'), west = by('west'), east = by('east'), i3 = by('i3');
  const pl = (l, k2) => { const b = l.brace[k2] || l.brace[0]; return b ? px(...along(l.w, (b.u0 + b.u1) / 2)) : px(0, 0); };
  body.push(
    dim(x0, y0 - 30, x1, y0 - 30, '11 000 slab'), dim(x1 + 36, y0, x1 + 36, y1, '17 000 slab'),
    call(1, ...px(0, front.w.a[1]), x1 + 110, px(0, 9)[1]), call(2, ...px(-3, 5.5), x0 - 70, px(0, 5.5)[1]), call(3, ...pl(west, 0), x0 - 70, px(0, 1)[1]),
    call(4, ...pl(east, 1), x1 + 110, px(0, 2)[1]), call(5, ...px(east.w.a[0] - east.w.dir[1] * 0.07 - 0.07, east.w.a[1] + east.w.dir[1] * 0 + 0.07 + 1.8), x1 + 110, px(0, 5)[1]),
    T(560, 90, 'Key', { cls: 'd-bold' }),
    ...['1  External wall frame, 90 mm thick', '2  Internal wall on the internal beams', '3  Braced wall: plywood sheet (hatched)', '4  Braced wall: metal strap (hatched)', '5  Tie-down rods (dots) on the inside face', 'Gaps are windows and doorways'].map((t, i) => T(560, 114 + i * 22, t)),
    T(560, 270, 'Typical layout only. Bracing walls,', { cls: 'd-mute' }), T(560, 288, 'rods and lintels come from the engineer.', { cls: 'd-mute' }),
  );
  return svg(900, 720, body.join(''), 'Wall frame plan');
}

const drawings = [
  { id: 'elev', title: 'Wall frame elevation', scale: 'Typical, not to scale', svg: elevation(),
    notes: ['1 Bottom plate. 2 Stud. 3 King stud. 4 Trimmer. 5 Lintel. 6 Sill. 7 Cripple. 8 Nogging. 9 Top plates (two).', 'Studs are shown at 450 mm. Lintel size and stud spacing come from the AS 1684 tables or the engineer.', 'Open the opening detail in 3D to take the frame apart.'] },
  { id: 'secWall', title: 'External wall section', scale: 'Typical, not to scale', svg: wallSection(),
    notes: ['1 Slab and rebate. 2 Bottom plate on a damp-proof layer. 3 Stud. 4 Top plates and truss heel. 5 Wall wrap. 6 Truss, strap and tie-down. 7 Threaded rod and anchor. 8 Plasterboard. 9 Brick veneer and cavity (see Step 6).', 'The frame sits back from the slab edge to leave room for the brick and a cavity. Confirm the dimensions on the engineer\'s detail.', 'The chain from truss to slab is shown with a dashed strap and a continuous rod. Detail and spacing come from the engineer.'] },
  { id: 'plan', title: 'Wall frame plan', scale: 'Illustrative, 32 px per metre', svg: framePlan(),
    notes: ['External and internal walls sit on the beams. Gaps in the wall are windows and doorways.', 'Hatched lengths are braced walls. Dots are tie-down rods.', 'This is the layout used in the 3D model. Your bracing plan will differ, so always use the drawings for your job.'] },
];

const howto = [
  ['Read the plans, engineer\'s details and bracing plan', 'Find the wind classification, the stud size and spacing, lintel sizes, bracing walls, tie-down details and the wall frame schedule. Check them against the permit and the endorsed plans.', 'Builder', 'T'],
  ['Check the slab', 'Check level, size and square against the plan. Fix any problem before timber goes on the slab.', 'Builder', 'T'],
  ['Order the timber or frames', 'Work out lengths and quantities from the plan. Get quotes from at least three suppliers and ask for delivery dates that match the slab cure.', 'Builder', 'T'],
  ['Set out the wall lines', 'Chalk the outer line and every internal wall. Mark openings and the positions of braced walls.', 'Carpenter', 'T'],
  ['Assemble the frames flat', 'Nail plates, studs, noggings and opening members to the drawings. Check each frame square by the diagonals.', 'Carpenter or fabricator', 'T'],
  ['Stand, fix and plumb the walls', 'Lift each frame onto its line, fix it to the slab and to the corners, then plumb and line it and fit temporary props.', 'Carpenter', 'T'],
  ['Fit the second top plate', 'Lap the second plate across corners and joints so that it ties the walls together.', 'Carpenter', 'C'],
  ['Fit the permanent bracing', 'Plywood sheet, metal strap or timber, in the walls the bracing plan shows, nailed or tensioned as detailed.', 'Carpenter', 'C'],
  ['Fit the tie-down rods and anchors', 'Anchors, rods, plate washers and nuts to the engineer\'s detail, then check each link in the chain from slab to top plate.', 'Carpenter', 'C'],
  ['Check the wall frame', 'Walk every wall against the drawings: plumb, straight, openings, lintels, bracing, tie-down and every nail.', 'Builder', 'T'],
  ['Book the engineer and surveyor', 'Ask the engineer when to inspect. Ask the building surveyor which stages the permit lists, and book the frame inspection for after the roof frame (Step 4).', 'Builder', 'C', 'vbaMand'],
];

const trades = [
  { t: 'Carpenter or framing crew', role: 'Sets out, assembles, stands, braces and ties down the wall frames.', when: 'After the slab has cured', reg: 'Trade contractor with insurance', ask: ['Labour only or supply and fix', 'Rate per square metre or per hour', 'Who supplies nails, fixings and temporary props'] },
  { t: 'Frame and truss fabricator', role: 'Makes pre-nailed wall frames and trusses from the plans and delivers them with a layout.', when: 'Order early so it is ready when the slab is', reg: 'Manufacturer with engineering and certificates', ask: ['Frame layout drawing and engineering', 'Delivery and crane or hiab included', 'Lead time and what happens if the plans change'] },
  { t: 'Timber merchant', role: 'Supplies framing timber, LVL and plates.', when: 'Before set-out', reg: 'Merchant or hardware supplier', ask: ['Grade, size, length and treatment', 'Price list and delivery windows', 'Return of unused full lengths'] },
  { t: 'Engineered timber and steel supplier', role: 'Supplies LVL lintels, beams and any steel members the engineer specifies.', when: 'Before the frames are assembled', reg: 'Manufacturer or supplier with product data', ask: ['Section sizes and lengths to the engineer\'s schedule', 'Cut to length and delivery', 'Product data and design tables'] },
  { t: 'Structural engineer', role: 'Designs the bracing, tie-down and any beams and steel. May inspect the frame and certify it.', when: 'Design before the build, visit before the frame is covered', reg: 'Registered engineer (confirm the current scheme)', ask: ['Frame inspection fee and notice needed', 'Certificate format for the RBS', 'Return visit fee'] },
  { t: 'Building surveyor (RBS)', role: 'Inspects at the stages the permit lists and records the result.', when: 'At the nominated frame stage', reg: 'Registered building surveyor (BPC)', ask: ['Notice period for inspections', 'Fee per inspection', 'What documents to hold for the visit'] },
  { t: 'Crane or hiab operator', role: 'Lifts packs and, in Step 4, trusses.', when: 'When pre-cut frames or trusses are delivered', reg: 'Licensed operator with insurance', ask: ['Lift plan and reach', 'Minimum hire hours', 'Access and overhead power lines'] },
];

const materials = [
  ['90 x 45 MGP10 H2 blue pine, 3.0 m', 'Studs, plates, noggings and trimmers. MGP10 is machine graded pine, stress grade 10. H2 is the treated grade for above-ground, protected timber.', 'Bunnings (90 x 45mm MGP10 H2 blue pine 3.0m)', 'V', 'Listing seen on 8 November 2026. Check the length, grade stamp and treatment against the drawings.', 'bunnMGP'],
  ['90 x 45 MGP10 untreated pine, 3.6 m', 'Same section in an untreated 3.6 m length.', 'Bunnings (90 x 45mm MGP10 untreated pine 3.6m)', 'V', 'Treatment depends on the design and termite system. Confirm before buying untreated.', 'bunnMGPu'],
  ['Pre-cut studs (2.4 m and 2.7 m)', 'Cut to wall height, from merchants or hardware', 'Timber merchant or Bunnings trade desk. Check the store.', 'T', 'Check the length matches the wall height less plates.'],
  ['Pre-nailed wall frames', 'Frames made to the plans with a layout drawing and engineering', 'Frame and truss fabricator', 'T', 'Get the layout drawing and engineering checked against the plans before delivery.'],
  ['LVL lintels and beams', 'For example LVL sections from timber manufacturers. Sizes from the engineer or span tables', 'Engineered timber supplier or merchant', 'T', 'Order to the engineer\'s schedule. Protect from rain.'],
  ['Structural plywood for bracing', 'Sheet size, thickness and grade as listed on the bracing plan', 'Timber merchant', 'C', 'Use the grade and thickness the bracing detail names.'],
  ['Metal strap bracing', 'Galvanised bracing strap, for example Pryda or MiTek products. Check the product table', 'Truss and frame hardware suppliers', 'C', 'Use the manufacturer\'s table for the number, size and nails.'],
  ['Framing nails', 'Type, length and gauge from AS 1684 or the engineer\'s detail', 'Bunnings or timber merchant', 'C', 'Use the nail type the table names, not what is in the ute.'],
  ['Threaded rod, nuts and plate washers', 'For example M12 galvanised. Size from the engineer', 'Hardware or fastener supplier', 'C', 'Check the grade and coating and use plate washers at the timber.'],
  ['Anchors and adhesive', 'Cast-in, drilled, or bonded threaded rod to the product listing and the engineer\'s detail', 'Anchor suppliers, for example Hilti or Ramset', 'C', 'Check embedment, edge distance and cure time on the product listing.'],
  ['Truss tie-down straps and brackets', 'Galvanised straps and brackets for the roof tie-down chain', 'Truss and connector suppliers', 'C', 'Use every nail hole the manufacturer\'s table asks for.'],
  ['Damp-proof course or plate isolation', 'Membrane strip between the slab and the bottom plate where the design needs it', 'Builders\' supplier or the termite installer', 'C', 'Confirm with the engineer and the termite installer.'],
  ['Temporary bracing timber and pegs', 'For example 70 x 35 pine props, stakes and nails', 'Bunnings or timber merchant', 'T', 'Keep the props until the permanent bracing and roof frame are done.'],
  ['Chalk line, laser level, string line, nail gun, clamps', 'Layout and fixing tools', 'Bunnings', 'T', ''],
];

const quotes = [
  { who: 'Carpenter or framing crew', n: '3', what: ['Labour only or supply and fix', 'Price per square metre or per hour', 'Who supplies temporary props, nails and fixings'] },
  { who: 'Frame and truss fabricator', n: '3', what: ['Wall frames, trusses and delivery', 'Layout drawings and engineering included', 'Lead time, crane or hiab, and changes to plans'] },
  { who: 'Timber merchant', n: '3', what: ['Grade, size, length and treatment', 'Delivery times and packs', 'Return policy for unused lengths'] },
  { who: 'Engineered timber supplier', n: '2', what: ['LVL beams and lintels to the engineer\'s schedule', 'Cut to length', 'Product data and design tables'] },
  { who: 'Connector and hardware supplier', n: '2', what: ['Bracing strap, tie-down rods, anchors and connectors', 'Product listings and tables', 'Delivery and returns'] },
  { who: 'Structural engineer', n: '1 to 2', what: ['Bracing and tie-down design if not already done', 'Frame inspection and certificate', 'Additional visit fee'] },
];
const quoteTips = [
  'Send the engineer\'s drawings and the wind classification with every request, so suppliers price the right bracing and tie-down.',
  'Compare what is included. A frame price that leaves out the engineering, delivery, crane or tie-down hardware is not the cheapest.',
  'Ask for the grade, size, treatment and fixings in writing on the quote, then match them to the drawings when ordering.',
  'Ask for lead times. Frames and trusses take weeks to make and the slab will be waiting.',
  'Keep every quote and order. They are evidence of estimating and ordering for the BPC application.',
];

const inspections = [
  ['Slab check before framing', 'Builder', 'Before any timber is fixed', 'Level, size and square against the plan. Rebate and penetrations as drawn. Any problem is fixed or recorded.', 'T'],
  ['Timber delivery check', 'Builder', 'On delivery', 'Grade stamps, sizes, lengths, treatment and quantities match the order. Timber is straight and dry.', 'T'],
  ['Set-out check', 'Builder', 'Before the first frame is stood', 'Wall lines, openings and braced walls are marked to the plan. Diagonals measured.', 'T'],
  ['Frame plumb, line and bracing check', 'Builder', 'Before the walls are left standing', 'Plumb, straight, all frames fixed to each other, temporary props in place and fixed.', 'T'],
  ['Wall frame check against the drawings', 'Builder and engineer', 'Before the trusses are lifted', 'Openings, lintels, bracing, tie-down, plates and every connection are as drawn. Any cut or damaged member is replaced.', 'C'],
  ['Frame inspection (mandatory stage if nominated)', 'RBS and engineer', 'Normally after the roof frame is complete', 'Wall and roof frame as drawn, with bracing, tie-down and connections. Do not go beyond the stage until it has been inspected.', 'C', 'vbaMand'],
  ['Records for the surveyor', 'Builder', 'Before the next stage', 'Engineer\'s certificate, delivery dockets, product data and photos on file.', 'T'],
];

const exam = [
  ['What does MGP10 mean?', 'Machine graded pine, stress grade 10. It is a common grade for framing.', 'T'],
  ['What does an H2 treatment mean on framing timber?', 'Treated for protection against termites and borers for above-ground, protected timber, so it is used inside the building envelope.', 'T'],
  ['What is the typical size and spacing of studs in a house wall?', '90 x 45 MGP10 studs at 450 or 600 mm centres. The actual size and spacing come from the AS 1684 span tables or the engineer.', 'T'],
  ['Which Standard covers residential timber framing?', 'AS 1684, in parts: non-cyclonic areas, cyclonic areas and a simplified version.', 'T'],
  ['What does bracing resist, and what does tie-down resist?', 'Bracing resists racking from horizontal wind load. Tie-down resists uplift from wind on the roof.', 'T'],
  ['What sets the amount of bracing and the strength of the tie-down?', 'The wind classification, the roof shape, the wall lengths and the design. AS 4055 gives the classes: N1 to N6 for non-cyclonic areas and C1 to C4 for cyclonic areas.', 'T'],
  ['Name the members around a window opening.', 'King studs, trimmers (jack studs), lintel, sill, cripple studs above and below, and noggings.', 'T'],
  ['What do trimmer studs do, and what do king studs do?', 'Trimmers carry the lintel load down to the bottom plate. King studs run plate to plate beside them and hold them and the lintel in place.', 'T'],
  ['What is a nogging for?', 'It stops studs buckling and gives a fixing edge for linings and fittings. Noggings are staggered so that each end can be nailed.', 'T'],
  ['Why is a second top plate used?', 'It laps over corners and joints to tie the walls together and to spread roof loads. Single top plates may be allowed where roof members sit over studs. Confirm in AS 1684.', 'C'],
  ['How must the builder treat a mandatory notification stage?', 'Notify the RBS and do not go beyond the stage until it has been inspected.', 'V', 'vbaMand'],
  ['When does the formal frame inspection usually happen?', 'Normally once the wall and roof frame are complete, before cladding and linings. Confirm the stages on the permit.', 'C'],
  ['Why must temporary bracing stay in place?', 'A frame with no roof or permanent bracing can be blown over. The props stay until the permanent bracing and the roof frame are fixed.', 'T'],
  ['Name the links in the tie-down chain.', 'Roof (truss) to top plate, top plate to studs, studs to bottom plate, and bottom plate to the slab anchor, as one connected chain.', 'T'],
  ['Name the payment stages in a major domestic building contract.', 'Base, frame, lock-up, fixing and completion. The amounts and rules are changing, so confirm with Consumer Affairs Victoria.', 'C', 'cavPay'],
];

export default {
  n: 3, id: 'wallframe', title: 'Wall framing', subtitle: 'From delivery to a braced and tied-down frame, one wall at a time.',
  phases, build, details, drawings, howto, trades, materials, quotes, quoteTips, inspections, exam,
  sources: ['bunnMGP', 'bunnMGPu', 'vbaMand', 'bpcMI01', 'cavPay', 'hiaNcc25', 'hiaStd25'],
  caution: 'Sizes, spacings and nailing here are typical. Real framing is designed from the AS 1684 series and the engineer\'s drawings for the site\'s wind classification. The Standard is paywalled, so almost nothing here was checked against it. Verified applies only to the Bunnings listings and the mandatory-notification page.',
};

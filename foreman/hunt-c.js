// Defects for the find-the-defects mode, stages 13 to 18. Shape and rules: see hunt.js.
// Positions follow the step files: the sample stair is built in its own frame at (0.3, 0, 15.4) turned a quarter turn, the ceiling underside
// is at y = 2.837, the bathroom floor falls 1 in 60 to the waste at (-3.6, 2.4), and the brick faces are on the slab edge lines.

const water = (kit, opacity = 0.65) => kit.mat(0x5fa8dc, { transparent: true, opacity, roughness: 0.05, metalness: 0.15 });
const bathFloor = (x, z) => 0.162 + Math.hypot(x + 3.6, z - 2.4) / 60;   // top of the screed in the Step 14 bathroom
const CEIL = 2.837;                                                    // underside of the ceiling sheets

export default {
  13: [
    { id: '13-doors-wet', phase: 0, title: 'Doors stored outside on bare ground', pos: [5.75, 1.0, 0.75], r: 1.4,
      hint: 'Walk round the outside of the house and check how the new joinery is being kept.',
      explain: 'Three new door leaves are leaning on the east wall, standing on wet soil with no wrap. Doors take up moisture through their edges and can bow or twist, and then they will not hang square.',
      fix: 'Store doors flat on bearers inside the dry, locked-up house, wrapped, until the carpenter hangs them.',
      flag: 'T', src: '',
      build(kit) {
        const { THREE, mat, box, flat } = kit, g = new THREE.Group(), leaf = mat(0xf2eee4, { roughness: 0.55, emissive: 0x2a2924 }), mud = mat(0x5e4630, { roughness: 1 });
        g.add(flat(1.4, 1.5, mat(0xffffff, { tex: 'soil' }), 5.95, 0.012, 0.75));
        for (let i = 0; i < 3; i++) {
          const d = new THREE.Group(); d.position.set(5.71 + i * 0.045, 1.0, 0.72 + i * 0.03); d.rotation.z = 0.15;
          d.add(box(0.035, 2.04, 0.82, leaf, 0, 0, 0), box(0.037, 0.16, 0.822, mud, 0, -0.94, 0));
          g.add(d);
        }
        return g;
      } },
    { id: '13-short-riser', phase: 2, title: 'Bottom riser shorter than the rest', pos: [0.3, 0.12, 15.55], r: 1.0,
      hint: 'Measure each step of the sample stair from the surface you actually step off.',
      explain: 'A concrete pad was poured at the foot of the stair after the stringers were set out from the ground, so the bottom riser is now about 95 mm while the others are 185 mm. Risers must be 115 to 190 mm, and adjacent risers may differ by no more than 5 mm.',
      fix: 'Set the stair out from the finished level at the foot so every riser comes out equal, and reset or recut the stringers to suit the pad.',
      flag: 'V', src: 'nccHp112',
      build(kit) {
        const { THREE, mat, box } = kit, g = new THREE.Group();
        g.add(box(1.3, 0.09, 0.7, mat(0xb8babd, { tex: 'concrete', bump: 1.2 }), 0.3, 0.045, 15.75));
        return g;
      } },
    { id: '13-rail-gap', phase: 3, title: 'Gap under the landing bottom rail', pos: [-0.29, 1.25, 13.6], r: 0.3, box: [[-0.4, 1.1, 13.0], [-0.18, 1.42, 14.15]],
      hint: 'Try the 125 mm test on every opening of the landing barrier, low down as well.',
      explain: 'On the west side of the landing the bottom rail was fixed about 260 mm above the floor, so a 125 mm sphere passes under it. No opening in a barrier may let a 125 mm sphere through.',
      fix: 'Lower the bottom rail so the gap to the landing is under 125 mm, run the balusters down to it, and test again with the sphere.',
      flag: 'V', src: 'nccHp113', hide: ['barrier'],
      build(kit) {
        // the Step 13 barrier rebuilt in the stair's own frame, with the west landing bottom rail raised; the baluster the step leaves out (east side) stays with its own layer
        const { THREE, mat, box, rod } = kit, g = new THREE.Group(); g.position.set(0.3, 0, 15.4); g.rotation.y = Math.PI / 2;
        const timber = mat(0xffffff, { tex: 'timber' }), oak = mat(0xf0d3a2, { tex: 'timber' }), steel = mat(0xb9c2cd, { metalness: 0.6, roughness: 0.35 });
        const n = 6, R = 0.185, G = 0.25, NO = 0.02, xl = 1.25, xe = 2.45, zs = 0.59, HS = 0.865, HL = 1.0, RAD = 0.0225, BR = 0.09, PITCH = 0.112;
        const yn = (x) => R + (R / G) * (x + NO), yr = (x) => yn(x) + HS, ylL = n * R + HL;
        for (const s of [-1, 1]) {
          const z = s * zs, brL = s < 0 ? 0.26 : BR;
          g.add(box(0.09, yr(0.06) + 0.06, 0.09, timber, 0.06, (yr(0.06) + 0.06) / 2, z), box(0.09, ylL, 0.09, timber, xl, ylL / 2, z), box(0.09, ylL, 0.09, timber, xe - 0.07, ylL / 2, z));
          g.add(rod([0.06, yr(0.06) - RAD, z], [xl, yr(xl) - RAD, z], RAD, oak, 12), rod([xl, ylL - RAD, z], [xe - 0.07, ylL - RAD, z], RAD, oak, 12));
          g.add(rod([0.06, yn(0.06) + BR, z], [xl, yn(xl) + BR, z], 0.02, timber, 8), rod([xl, n * R + brL, z], [xe - 0.07, n * R + brL, z], 0.02, timber, 8));
          for (let x = 0.06 + PITCH; x < xl - 0.03; x += PITCH) g.add(rod([x, yn(x) + BR, z], [x, yr(x) - RAD, z], 0.006, steel, 6));
          let k = 0;
          for (let x = xl + PITCH; x < xe - 0.07 - 0.03; x += PITCH, k++) if (!(s === 1 && k === 3)) g.add(rod([x, n * R + brL, z], [x, ylL - RAD, z], 0.006, steel, 6));
        }
        return g;
      } },
    { id: '13-cabinet-off-wall', phase: 4, title: 'Overhead cabinet pulling off the wall', pos: [4.9, 1.85, 5.75], r: 0.8,
      hint: 'Look up at the overhead cabinets in the kitchen.',
      explain: 'The end overhead cabinet was screwed to the plasterboard only. It is already pulling away at the top and has torn the sheet. Heavy fittings are fixed to the framing, not to the sheeting.',
      fix: 'Take the cabinet down, repair the lining and refix it through the sheet into the noggings or studs that were blocked out before lining.',
      flag: 'V', src: 'waIb85',
      build(kit) {
        const { THREE, mat, box } = kit, g = new THREE.Group();
        const front = mat(0x4f6b84, { roughness: 0.55, emissive: 0x141c25 }), carcass = mat(0xf1efe9, { roughness: 0.7, emissive: 0x3b3a37 }), steel = mat(0xb9c2cd, { metalness: 0.6, roughness: 0.35 });
        const piv = new THREE.Group(); piv.position.set(4.9, 1.5, 5.6); piv.rotation.x = 0.13;
        piv.add(box(0.594, 0.7, 0.3, carcass, 0, 0.35, 0.15), box(0.594, 0.7, 0.018, front, 0, 0.35, 0.309), box(0.27, 0.012, 0.012, steel, 0, 0.08, 0.325));
        g.add(piv, box(0.4, 0.07, 0.008, mat(0x8f897e, { roughness: 1 }), 4.9, 2.16, 5.584), box(0.06, 0.16, 0.008, mat(0x8f897e, { roughness: 1 }), 4.75, 2.06, 5.584));
        return g;
      } },
  ],

  14: [
    { id: '14-membrane-cut', phase: 1, title: 'Membrane cut before tiling', pos: [-4.5, 0.2, 1.8], r: 0.8,
      hint: 'Check the waterproofing in the shower corner before the tiler starts.',
      explain: 'The membrane in the shower area has been slit and a flap lifted, so the screed shows through. Tiling over it would hide a leak path into the slab and the wall frames.',
      fix: 'Stop the tiling, have the waterproofer repair the membrane as the system maker says, let it cure and record the repair.',
      flag: 'T', src: '',
      build(kit) {
        const { THREE, mat, box } = kit, g = new THREE.Group(), x = -4.5, z = 1.8;
        g.position.set(x, bathFloor(x, z) + 0.004, z); g.rotation.y = 0.6;
        g.add(box(0.55, 0.004, 0.1, mat(0xb4b0a6, { roughness: 0.96 }), 0, 0, 0));
        const flap = new THREE.Group(); flap.position.set(0, 0.002, -0.05); flap.rotation.x = 0.8;
        flap.add(box(0.55, 0.003, 0.09, mat(0x2f6fae, { roughness: 0.5 }), 0, 0, -0.045));
        g.add(flap);
        return g;
      } },
    { id: '14-grate-high', phase: 2, title: 'Floor waste grate sits above the tiles', pos: [-3.6, 0.2, 2.4], r: 0.7,
      hint: 'Look at the point the bathroom floor drains to.',
      explain: 'The grate has been set about 25 mm above the tiles, so water ponds round it instead of draining. Floor wastes must suit the tile and bed thickness so the tiles fall to the grate.',
      fix: 'Cut down the waste riser or fit an adjustable waste so the grate finishes flush with the tiles, then flood test the floor.',
      flag: 'V', src: 'nccHp102',
      build(kit) {
        const { THREE, mat, cyl } = kit, g = new THREE.Group(), y = bathFloor(-3.6, 2.4) + 0.012;
        g.add(cyl(0.085, 0.028, mat(0xb9c2cd, { metalness: 0.6, roughness: 0.35 }), -3.6, y + 0.014, 2.4, 24), cyl(0.07, 0.003, mat(0x1b1d20, { roughness: 0.7 }), -3.6, y + 0.029, 2.4, 20));
        g.add(cyl(0.34, 0.004, water(kit, 0.55), -3.6, y + 0.002, 2.4, 32));
        return g;
      } },
    { id: '14-corner-grout', phase: 3, title: 'Shower corner grouted, not sealed', pos: [-5.2, 1.1, 1.3], r: 0.35, box: [[-5.24, 0.2, 1.27], [-5.15, 2.26, 1.36]],
      hint: 'Compare the internal corners of the bathroom walls.',
      explain: 'The vertical corner of the shower has been filled with rigid grout instead of flexible sealant, and the grout has already cracked. Movement joints go at the vertical corners of shower compartments.',
      fix: 'Rake out the grout and fill the corner with a flexible sealant at least 6 mm wide, as the tile and membrane makers specify.',
      flag: 'V', src: 'hiaTileJoints',
      build(kit) {
        // a grout fillet over the Step 14 sealant bead in that corner, with a crack running up it
        const { THREE, mat, rod } = kit, g = new THREE.Group(), x = -5.2135, z = 1.292, y0 = bathFloor(x, z) + 0.014, y1 = 0.15 + 2.1;
        g.add(rod([x, y0, z], [x, y1, z], 0.018, mat(0xaeb0ab, { roughness: 0.95, emissive: 0x2a2b28 }), 10));
        const dk = mat(0x1b1d20, { roughness: 0.9 }), pts = [];
        for (let i = 0; i <= 16; i++) { const w = i % 2 ? 0.004 : -0.004; pts.push([x + 0.0125 + w, y0 + 0.05 + (i / 16) * (y1 - y0 - 0.1), z + 0.0125 - w]); }
        for (let i = 0; i < pts.length - 1; i++) g.add(rod(pts[i], pts[i + 1], 0.003, dk, 4));
        return g;
      } },
    { id: '14-boards-tented', phase: 4, title: 'Timber boards tented near the wall', pos: [-3.4, 0.22, 10.85], r: 0.4, box: [[-4.6, 0.15, 10.6], [-2.2, 0.3, 11.1]],
      hint: 'Look along the new timber floor near the front wall.',
      explain: 'The boards were laid tight to the front wall with no expansion gap, and they have swollen and lifted into a ridge. Swelling that causes tenting, buckling or crowning visible at completion is outside tolerance.',
      fix: 'Lift and relay the boards with the gap at every wall that the maker specifies, hidden under the skirting.',
      flag: 'V', src: 'bpcTol26',
      build(kit) {
        const { THREE, mat, box, face } = kit, g = new THREE.Group(), oak = mat(0xf0d3a2, { tex: 'timber' }), dk = mat(0x2a2420, { roughness: 1, side: THREE.DoubleSide });
        const x0 = -4.6, x1 = -2.2, zr = 10.85, b = 0.169, a = 0.36, w = 0.26;   // ridge about 90 mm high, exaggerated so it reads at walking distance
        for (const s of [-1, 1]) { const p = box(x1 - x0, 0.019, w, oak, (x0 + x1) / 2, b + (w / 2) * Math.sin(a) - 0.0095, zr + s * (w / 2) * Math.cos(a)); p.rotation.x = s * a; g.add(p); }
        for (const x of [x0 + 0.002, x1 - 0.002]) g.add(face([[x, b, zr - w * Math.cos(a)], [x, b + w * Math.sin(a) - 0.01, zr], [x, b, zr + w * Math.cos(a)]], dk));
        return g;
      } },
  ],

  15: [
    { id: '15-starved-patch', phase: 2, title: 'Bare patch in the wall paint', pos: [3.8, 1.45, 0.09], r: 0.9,
      hint: 'Stand back from the bedroom walls and look for colour that does not match.',
      explain: 'A patch of the bedroom wall was missed in the colour coats, so the sealer and a set joint show through. Bare or starved areas and colour variations are outside tolerance.',
      fix: 'Touch up the patch with sealer, then recoat the whole wall from corner to corner so the colour and sheen are even.',
      flag: 'V', src: 'bpcTol26',
      build(kit) {
        const { THREE, mat, box } = kit, g = new THREE.Group(), bare = mat(0xf1ece6, { roughness: 0.95, emissive: 0x55524d }), joint = mat(0xfaf8f2, { roughness: 0.95, emissive: 0x605e5a });
        g.add(box(0.62, 0.8, 0.003, bare, 3.75, 1.48, 0.0815), box(0.34, 0.42, 0.003, bare, 4.1, 1.14, 0.0815), box(0.3, 0.3, 0.003, bare, 3.5, 1.95, 0.0815));
        g.add(box(0.13, 1.2, 0.003, joint, 3.62, 1.45, 0.0823));
        return g;
      } },
    { id: '15-alarm-corner', phase: 4, title: 'Smoke alarm in the ceiling corner', pos: [-5.08, 2.8, -0.21], r: 0.8,
      hint: 'Check where each smoke alarm sits on the ceiling, including the back living area.',
      explain: 'A smoke alarm in the back living area has been fitted about 150 mm from two walls, tucked into the corner. A ceiling-mounted alarm must be at least 300 mm from the wall and ceiling corner.',
      fix: 'Move the alarm out onto the ceiling at least 300 mm from every wall, mains powered and interconnected with the others.',
      flag: 'V', src: 'nccHp95',
      build(kit) {
        const { THREE, mat, cyl } = kit, g = new THREE.Group(), x = -5.08, z = -0.21;
        g.add(cyl(0.07, 0.03, mat(0xf4f4f2, { roughness: 0.5, emissive: 0x3a3a38 }), x, CEIL - 0.015, z, 24), cyl(0.006, 0.004, mat(0xd62828, { roughness: 0.6 }), x + 0.03, CEIL - 0.032, z, 8));
        return g;
      } },
    { id: '15-gpo-shower', phase: 4, title: 'Power point inside the shower', pos: [-3.05, 1.25, 1.3], r: 0.7,
      hint: 'Look at what has been fitted on the tiled shower walls.',
      explain: 'A double power point has been fitted on the shower wall next to the mixer, where it will be sprayed. The wiring rules limit outlets in the zones round a shower. AS/NZS 3000 was not opened, so the zone sizes are not given here.',
      fix: 'Have the electrician move the outlet outside the shower zones in AS/NZS 3000 and test it before the Certificate of Electrical Safety is issued.',
      flag: 'C', src: '',
      build(kit) {
        const { THREE, mat, box } = kit, g = new THREE.Group(), w = mat(0xf4f4f2, { roughness: 0.5, emissive: 0x3a3a38 }), d = mat(0x1b1d20, { roughness: 0.7 }), x = -3.05, z = 1.292;
        g.add(box(0.15, 0.085, 0.014, w, x, 1.25, z + 0.007));
        for (const dx of [-0.036, 0.036]) g.add(box(0.007, 0.018, 0.004, d, x + dx - 0.01, 1.257, z + 0.015), box(0.007, 0.018, 0.004, d, x + dx + 0.01, 1.257, z + 0.015), box(0.006, 0.012, 0.004, d, x + dx, 1.235, z + 0.015));
        return g;
      } },
    { id: '15-basin-leak', phase: 5, title: 'Leak under the vanity', pos: [-4.5, 0.3, 4.75], r: 0.8,
      hint: 'After the taps have been run, look at the bathroom floor.',
      explain: 'Water is running out from under the vanity after the basin was tested, so the waste or a tap connection is leaking. Water supply fixtures that leak or drip within 3 months of completion are outside tolerance.',
      fix: 'Have the plumber remake the leaking joint, run the basin again and check that the cabinet stays dry.',
      flag: 'V', src: 'bpcTol26',
      build(kit) {
        const { THREE, cyl, box } = kit, g = new THREE.Group(), wm = water(kit, 0.62);
        const p = cyl(0.3, 0.012, wm, -4.5, bathFloor(-4.5, 4.7) + 0.013, 4.7, 28); p.scale.set(1.25, 1, 0.75); g.add(p);
        const q = cyl(0.16, 0.012, wm, -4.15, bathFloor(-4.15, 4.4) + 0.013, 4.4, 20); q.scale.set(1, 1, 1.4); g.add(q);
        g.add(box(0.025, 0.38, 0.004, wm, -4.42, bathFloor(-4.42, 4.96) + 0.2, 4.955));
        return g;
      } },
    { id: '15-light-loose', phase: 5, title: 'Light fitting hanging from the ceiling', pos: [3.55, 2.4, -1.47], r: 0.9,
      hint: 'Switch the lights on and look up in the back living area.',
      explain: 'A ceiling light has dropped out of its cut-out and hangs on its cable. Fittings that are loose or not fully operational within 3 months of completion are outside tolerance, and this one is also a hazard.',
      fix: 'Have the electrician refit it securely in the ceiling and test it before handover.',
      flag: 'V', src: 'bpcTol26',
      build(kit) {
        const { THREE, mat, cyl, rod } = kit, g = new THREE.Group(), x = 3.5, z = -1.5;
        g.add(cyl(0.155, 0.05, mat(0x141517, { roughness: 1 }), x, CEIL - 0.024, z, 24));   // the empty cut-out
        g.add(rod([x, CEIL - 0.05, z], [x + 0.05, CEIL - 0.5, z + 0.03], 0.006, mat(0xf4f4f2, { roughness: 0.6 }), 6));
        const f = new THREE.Group(); f.position.set(x + 0.06, CEIL - 0.53, z + 0.035); f.rotation.set(0.9, 0, 0.3);
        f.add(cyl(0.13, 0.035, mat(0xf4f4f2, { roughness: 0.5, emissive: 0x3a3a38 }), 0, 0, 0, 24), cyl(0.104, 0.01, mat(0xfff3b0, { roughness: 0.4, emissive: 0xffe27a }), 0, -0.022, 0, 24));
        g.add(f);
        return g;
      } },
  ],

  16: [
    { id: '16-plans-bal', phase: 1, title: 'Window schedule at the wrong BAL', pos: [3.4, 1.2, 13.62], r: 1.0,
      hint: 'Compare the documents on display at the front of the site.',
      explain: 'The window schedule used to order the windows says BAL-12.5, but the permit says BAL-19. Every trade must build to the BAL on the permit, so windows made to the lower level may have to be replaced.',
      fix: 'Have the designer reissue the schedule at the permit BAL, check the supplier order before manufacture, and take superseded drawings off site.',
      flag: 'T', src: '',
      build(kit) {
        const { THREE, mat, cyl, textPlane } = kit, g = new THREE.Group(), st = mat(0xb9c2cd, { metalness: 0.6, roughness: 0.35 });
        const s = textPlane(['WINDOW SCHEDULE, REV C', 'Issued for construction', 'All windows and doors: BAL-12.5', 'Supplier order placed'], 1.7, 0.75);
        s.position.set(3.4, 1.2, 13.6); g.add(s, cyl(0.03, 1.2, st, 2.55, 0.6, 13.6, 8), cyl(0.03, 1.2, st, 4.25, 0.6, 13.6, 8));
        return g;
      } },
    { id: '16-eave-gap', phase: 2, title: 'Eave lining dropped, gap at the wall', pos: [5.65, 2.6, 4.0], r: 1.0,
      hint: 'Walk along the east side and look up under the eaves.',
      explain: 'A length of eave lining has come away from the wall and hangs open, leaving a gap into the roof space. Embers can enter through gaps as small as 2 mm.',
      fix: 'Refix the lining to the framing, reseal the joint to the wall and photograph it before handover.',
      flag: 'V', src: 'yrBushfire',
      build(kit) {
        const { THREE, mat, box } = kit, g = new THREE.Group(), P = Math.PI / 8, cy = 2.715736, ln = 0.3 / Math.cos(P);
        const hole = box(ln - 0.01, 0.004, 1.2, mat(0x0d0e10, { roughness: 1 }), 5.647, cy - 0.0075, 4.0); hole.rotation.z = -P; g.add(hole);
        const pnl = box(ln, 0.008, 1.2, mat(0xe8e0cc, { roughness: 0.92, emissive: 0x5a5242 }), 5.666, 2.556, 4.0); pnl.rotation.z = 0.6; g.add(pnl);
        return g;
      } },
    { id: '16-guard-lifted', phase: 3, title: 'Gutter guard loose, leaves in the gutter', pos: [-5.92, 2.65, 6.8], r: 1.2,
      hint: 'Look along the gutters from the ground.',
      explain: 'A length of gutter guard on the west side was never fixed down and now hangs over the edge, and leaves have collected in the open gutter. Leaf litter in a gutter is fuel right at the roof edge.',
      fix: 'Clear the gutter and fix the metal guard along its full length, then show the owner how to keep it clear.',
      flag: 'T', src: '', hide: ['guards'],
      build(kit) {
        // the Step 16 guards rebuilt, with the west length between z 6.0 and 7.6 come loose
        const { THREE, mat, box } = kit, g = new THREE.Group(), mesh = mat(0x2e3238, { metalness: 0.5, roughness: 0.5 });
        const X = 5.8775, Y = 2.85 + (5.35 - 5.8) * Math.tan(Math.PI / 8) + 0.05 - 0.125 + 0.07, Z0 = -5.655, Z1 = 11.655, b = 1.25;
        g.add(box(0.115, 0.004, Z1 - Z0, mesh, X, Y, (Z0 + Z1) / 2), box(0.115, 0.004, 6.0 - Z0, mesh, -X, Y, (Z0 + 6.0) / 2), box(0.115, 0.004, Z1 - 7.6, mesh, -X, Y, (7.6 + Z1) / 2));
        // the loose length hangs down over the outside of the gutter
        const flap = box(0.115, 0.004, 1.6, mesh, -X - 0.0575 - 0.0575 * Math.cos(b) - 0.004, Y - 0.0575 * Math.sin(b), 6.8); flap.rotation.z = b; g.add(flap);
        const cols = [0x8a6a3a, 0x6e5a2e, 0xa07a3c, 0x5c4a2a].map((c) => mat(c, { roughness: 1 }));
        let s = 7; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
        for (let i = 0; i < 160; i++) {
          const l = box(0.05 + rnd() * 0.05, 0.014, 0.03 + rnd() * 0.04, cols[i % 4], -X + (rnd() - 0.5) * 0.13, Y - 0.02 + rnd() * 0.11, 6.0 + rnd() * 1.6);
          l.rotation.set(rnd() * 1.2 - 0.6, rnd() * 3, rnd() * 1.2 - 0.6); g.add(l);
        }
        return g;
      } },
    { id: '16-firewood', phase: 4, title: 'Firewood and leaves against the house', pos: [-4.6, 0.45, -5.85], r: 0.3, box: [[-5.25, 0, -8.6], [-3.45, 0.95, -5.55]],
      hint: 'Look at the deck and the back wall beside it.',
      explain: 'Firewood is stacked against the back wall next to the deck, and leaves have blown in under the open edge of the deck. Both are fuel that embers can ignite against the house.',
      fix: 'Move the firewood well away from the house, close in or screen the space under the deck, and keep it clear of leaves and stored goods.',
      flag: 'T', src: '',
      build(kit) {
        const { THREE, mat, cyl, box } = kit, g = new THREE.Group(), bark = [0x6b5236, 0x7d6244, 0x5c4630].map((c) => mat(c, { roughness: 1 }));
        for (let r = 0; r < 7; r++) for (let i = 0; i < 8 - (r % 2); i++) {
          const c = cyl(0.066, 0.45, bark[(r + i) % 3], -5.15 + i * 0.14 + (r % 2) * 0.07, 0.066 + r * 0.125, -5.8, 8); c.rotation.x = Math.PI / 2; g.add(c);
        }
        const lf = mat(0x7a5a30, { roughness: 1 });
        for (const [x, z, w, d] of [[-3.72, -6.4, 0.42, 0.9], [-3.68, -7.5, 0.36, 0.8], [-3.6, -8.45, 0.5, 0.3]]) g.add(box(w, 0.03, d, lf, x, 0.02, z));
        return g;
      } },
  ],

  17: [
    { id: '17-ponding', phase: 1, title: 'Water ponding against the wall', pos: [-5.85, 0.05, 7.2], r: 1.0,
      hint: 'Walk down the west side of the house after rain.',
      explain: 'Water is sitting against the west wall, so the ground here falls towards the house. Finished ground round a slab must fall away by at least 50 mm over the first 1 m.',
      fix: 'Regrade so the ground falls away from the wall by at least 50 mm over the first 1 m, with the slab edge still clear of the ground.',
      flag: 'V', src: 'nccHp33',
      build(kit) {
        const { THREE, mat, cyl, flat } = kit, g = new THREE.Group();
        g.add(flat(0.9, 1.8, mat(0x5a4632, { roughness: 1 }), -5.95, 0.008, 7.2));
        const p = cyl(0.5, 0.012, water(kit, 0.72), -5.85, 0.012, 7.2, 28); p.scale.set(0.75, 1, 1.35); g.add(p);
        return g;
      } },
    { id: '17-wall-high', phase: 2, title: 'Retaining wall built over 1 m', pos: [4.9, 1.0, -13.0], r: 0.4, box: [[2.8, 0.85, -13.1], [7.0, 1.2, -12.9]],
      hint: 'Compare the built retaining wall with the height on its sign.',
      explain: 'The east end of the retaining wall has a fifth row of sleepers, so it stands about 1.1 m high there, above the red 1 m line. A retaining wall less than 1 m high is exempt, but at 1 m or more it needs a building permit.',
      fix: "Take the extra course off and lower the bed behind it, or stop and get an engineer's design and a building permit before building higher.",
      flag: 'V', src: 'bp01Vba',
      build(kit) {
        const { THREE, mat, box, flat } = kit, g = new THREE.Group(), conc = mat(0xffffff, { tex: 'concrete' });
        for (const k of [7, 8, 9]) g.add(box(1.36, 0.225, 0.08, conc, -6.3 + k * 1.4, 0.1125 + 4 * 0.225, -13.0));
        g.add(box(4.2, 0.225, 4.4, mat(0xffffff, { tex: 'soil' }), 4.9, 1.0125, -15.25), flat(4.2, 4.4, mat(0xffffff, { tex: 'grass' }), 4.9, 1.127, -15.25));
        return g;
      } },
    { id: '17-pit-crossing', phase: 3, title: 'Service pit left in the crossing', pos: [3.7, 0.06, 19.2], r: 0.8,
      hint: 'Look at the new vehicle crossing over the footpath.',
      explain: 'A service pit has been left in the middle of the new vehicle crossing, under the wheel path. Pits, poles and manholes in the way of a crossing are moved through the relevant authority before the permit is issued.',
      fix: 'Have the asset owner relocate the pit clear of the crossing before the crossing permit is issued and the concrete is poured.',
      flag: 'V', src: 'banyuleCross',
      build(kit) {
        const { THREE, mat, box } = kit, g = new THREE.Group(), slot = mat(0x2f3338, { roughness: 0.8 });
        g.add(box(0.62, 0.012, 0.86, mat(0x8f9295, { tex: 'concrete' }), 3.7, 0.044, 19.2), box(0.5, 0.012, 0.74, mat(0x59616b, { metalness: 0.5, roughness: 0.5 }), 3.7, 0.05, 19.2));
        for (const dz of [-0.25, 0, 0.25]) g.add(box(0.42, 0.006, 0.03, slot, 3.7, 0.058, 19.2 + dz));
        return g;
      } },
    { id: '17-shed-front', phase: 4, title: 'Shed in front of the house', pos: [-4.2, 1.0, 14.0], r: 1.3,
      hint: 'Check where each Class 10a building on the block has been placed.',
      explain: 'A garden shed has been put in the front yard, forward of the front wall of the house. A shed that serves the house is exempt only if it is no further forward than the front wall, so this one needs a building permit or must move.',
      fix: 'Move the shed behind the line of the front wall and inside the size and height limits, or apply for a building permit and check the planning scheme.',
      flag: 'V', src: 'bp01Vba',
      build(kit) {
        const { THREE, mat, box } = kit, g = new THREE.Group(), x = -4.2, z = 14.0;
        g.add(box(1.6, 1.95, 1.2, mat(0xd9d4c4, { tex: 'metalRib' }), x, 0.975, z));
        const r = box(1.7, 0.04, 1.3, mat(0x6d7a83, { tex: 'metalRib' }), x, 1.98, z); r.rotation.x = 0.06; g.add(r);
        g.add(box(0.8, 1.7, 0.03, mat(0x3a3f46, { roughness: 0.7 }), x + 0.2, 0.86, z + 0.61));
        return g;
      } },
    { id: '17-bed-slab', phase: 5, title: 'Garden bed over the slab edge', pos: [5.85, 0.3, 3.0], r: 0.3, box: [[5.5, 0, 1.6], [6.2, 0.75, 4.4]],
      hint: 'Look at where the new garden beds meet the walls of the house.',
      explain: 'A garden bed has been built up against the east wall, so soil and mulch now cover the slab edge and bridge the termite barrier. The slab edge must stay 50 to 150 mm above finished ground, depending on the site.',
      fix: 'Pull the bed back from the wall or lower it so the slab edge shows by the NCC height for the site, and keep soil and mulch off the termite barrier.',
      flag: 'V', src: 'nccHp33',
      build(kit) {
        const { THREE, mat, box } = kit, g = new THREE.Group(), leaf = mat(0x4f7d45, { roughness: 0.9 });
        g.add(box(0.7, 0.26, 2.8, mat(0xffffff, { tex: 'soil' }), 5.85, 0.13, 3.0), box(0.7, 0.04, 2.8, mat(0x6e4a2b, { roughness: 1 }), 5.85, 0.28, 3.0));
        for (const z of [2.0, 3.0, 4.0]) { const s = new THREE.Mesh(new THREE.SphereGeometry(0.27, 12, 8), leaf); s.position.set(5.88, 0.5, z); s.castShadow = true; g.add(s); }
        return g;
      } },
  ],

  18: [
    { id: '18-cracked-glass', phase: 0, title: 'Cracked pane in a front window', pos: [4.28, 1.6, 11.33], r: 0.9,
      hint: 'Walk along the front of the house and look closely at the glass.',
      explain: 'A pane in the east front window is cracked. Faulty work like this goes on the practical completion list, dated and photographed, so it is put right before the final payment.',
      fix: 'List it with a photo and its location, have the glazier replace the pane with glass to the window schedule, then recheck it.',
      flag: 'T', src: '',
      build(kit) {
        const { THREE, mat, box } = kit, g = new THREE.Group(), cr = mat(0xffffff, { roughness: 0.3, emissive: 0xaaaaaa }), cx = 4.28, cy = 1.55, z = 11.322;
        for (const [ang, len] of [[0.3, 0.28], [1.1, 0.42], [1.9, 0.36], [2.7, 0.3], [3.5, 0.26], [4.3, 0.38], [5.2, 0.3]]) {
          const b = box(len, 0.007, 0.003, cr, cx + Math.cos(ang) * len / 2, cy + Math.sin(ang) * len / 2, z); b.rotation.z = ang; g.add(b);
        }
        for (const [ang, d] of [[0.7, 0.1], [2.3, 0.11], [3.9, 0.1], [5.6, 0.12]]) { const b = box(0.09, 0.006, 0.003, cr, cx + Math.cos(ang) * d, cy + Math.sin(ang) * d, z); b.rotation.z = ang + Math.PI / 2; g.add(b); }
        return g;
      } },
    { id: '18-moving-in', phase: 1, title: 'Owner moving in before the occupancy permit', pos: [4.3, 1.2, 14.2], r: 0.3, box: [[2.8, 0, 12.0], [6.0, 2.6, 18.5]],
      hint: 'Look at what is arriving at the house while the certificates are still being collected.',
      explain: 'A removal van is unloading furniture before the surveyor has done the final inspection or issued the occupancy permit. Occupying a new building before receiving the occupancy permit is an offence under the Building Act 1993.',
      fix: 'Agree the handover date in writing and keep the owner and their goods out until the occupancy permit is issued.',
      flag: 'V', src: 'bpcEnd',
      build(kit) {
        const { THREE, mat, box, cyl } = kit, g = new THREE.Group();
        const white = mat(0xf2f2f2, { roughness: 0.6 }), dark = mat(0x1b1d20, { roughness: 0.7 }), glass = mat(0x6f8aa3, { roughness: 0.15, metalness: 0.5 }), card = mat(0xc8ad82, { roughness: 0.9 }), sofa = mat(0x56677a, { roughness: 0.95 });
        // removal van reversed up the driveway with its back doors open
        g.add(box(2.0, 2.2, 3.4, white, 4.5, 1.45, 15.4), box(2.0, 1.45, 1.3, white, 4.5, 1.08, 17.75), box(1.8, 0.6, 0.02, glass, 4.5, 1.45, 18.41));
        for (const [x, z] of [[3.55, 14.3], [5.45, 14.3], [3.55, 17.7], [5.45, 17.7]]) { const w = cyl(0.36, 0.25, dark, x, 0.36, z, 16); w.rotation.z = Math.PI / 2; g.add(w); }
        for (const s of [-1, 1]) g.add(box(0.96, 2.0, 0.03, white, 4.5 + s * 1.48, 1.45, 13.69), box(0.02, 0.3, 3.4, mat(0xe8590c, { roughness: 0.6 }), 4.5 + s * 1.005, 1.2, 15.4));
        const ramp = box(0.9, 0.03, 1.35, mat(0xb9c2cd, { metalness: 0.6, roughness: 0.35 }), 4.5, 0.2, 13.05); ramp.rotation.x = -0.28; g.add(ramp);
        // a sofa and cartons on the driveway, heading for the front door
        g.add(box(0.8, 0.42, 1.8, sofa, 3.35, 0.21, 12.9), box(0.16, 0.4, 1.8, sofa, 3.03, 0.62, 12.9), box(0.8, 0.22, 0.14, sofa, 3.35, 0.53, 12.07), box(0.8, 0.22, 0.14, sofa, 3.35, 0.53, 13.73));
        for (const [x, y, z] of [[5.4, 0.25, 12.4], [5.4, 0.75, 12.4], [5.9, 0.25, 12.6], [5.85, 0.75, 12.55], [5.0, 0.25, 12.1]]) g.add(box(0.48, 0.48, 0.48, card, x, y, z));
        return g;
      } },
    { id: '18-alarm-capped', phase: 2, title: 'Smoke alarm still capped', pos: [-1.0, 2.8, 3.2], r: 0.8,
      hint: 'Check the smoke alarm in the hall before the surveyor arrives.',
      explain: "The hall smoke alarm still has its dust cap and the painter's tape on it, so smoke cannot reach the sensor. At the final inspection the smoke alarms must be in place and working.",
      fix: 'Remove the cap and tape, press the test button on every alarm and check that they all sound together.',
      flag: 'V', src: 'shepCerts',
      build(kit) {
        const { THREE, mat, cyl, box } = kit, g = new THREE.Group(), x = -1.0, z = 3.2, t = mat(0x4aa3df, { roughness: 0.8 });
        g.add(cyl(0.088, 0.05, mat(0xd62828, { roughness: 0.5 }), x, CEIL - 0.025, z, 20));
        g.add(box(0.28, 0.004, 0.04, t, x, CEIL - 0.052, z), box(0.04, 0.004, 0.28, t, x, CEIL - 0.053, z));
        return g;
      } },
    { id: '18-brick-crack', phase: 6, title: 'Crack in the brickwork after handover', pos: [-2.1, 2.55, 11.52], r: 1.0,
      hint: 'Months after handover, look at the brickwork round the front windows.',
      explain: 'A stepped crack has opened in the brickwork above the west front window. The owner reports it to the builder in writing and keeps photos. Under Home Warranty, major defects can be claimed for up to 6 years and other defects up to 2 years after completion.',
      fix: 'Send the builder a written request to inspect and fix it, by registered post, with dated photos, and contact Consumer Affairs Victoria if it is not resolved.',
      flag: 'V', src: 'bpcHW',
      build(kit) {
        const { THREE, mat, box } = kit, g = new THREE.Group(), dk = mat(0x1e1a18, { roughness: 1 }), z = 11.506;
        let x = -2.46, y = 2.3;
        for (let i = 0; i < 6; i++) { g.add(box(0.014, 0.1, 0.012, dk, x, y + 0.043, z)); y += 0.086; g.add(box(0.134, 0.014, 0.012, dk, x + 0.06, y, z)); x += 0.12; }
        return g;
      } },
  ],
};

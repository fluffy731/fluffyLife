// Defects for the find-the-defects mode, stages 7 to 12. Shape and rules: see hunt.js.
// No imports: every model is built from the kit the engine passes in, in world metres (+x east, +y up, +z toward the street).
// Positions follow the step files: front brick face z 11.5, back brick face z -5.5, slab top y 0.15, ceiling (plate top) y 2.85.

const grp = (kit, ...parts) => { const g = new kit.THREE.Group(); for (const p of parts) if (p) g.add(p); return g; };
const fy10 = (x, z) => 0.162 + Math.hypot(x + 3.6, z - 2.4) / 60;   // Stage 10 screed top, falling 1 in 60 to the floor waste at (-3.6, 2.4)
const CEIL = 2.85;

export default {
  /* ---------- Stage 7: windows, doors and lock-up ---------- */
  7: [
    { id: '7-head-packed', phase: 1, title: 'Window packed tight at the head', pos: [3.9, 2.26, 11.4], r: 0.9,
      hint: 'Look closely at the top edge of the window to the right of the front door.',
      explain: 'Packers have been driven in hard between the window head and the lintel. With no gap at the head, the lintel and the brickwork above can load the window and bow or jam the frame.',
      fix: 'Pack the sides and the bottom only, and leave a clear gap of at least 10 mm between the top of the window and the lintel or masonry above.',
      flag: 'V', src: 'nccWin82',
      build(kit) {
        const { mat, box } = kit, m = mat(0xf2a01e, { roughness: 0.5 }), g = grp(kit);
        for (const [x, r] of [[3.35, 0.06], [3.75, -0.05], [4.15, 0.04], [4.5, -0.07]]) { const w = box(0.1, 0.06, 0.24, m, x, 2.27, 11.39); w.rotation.y = r; g.add(w); }
        return g;
      } },
    { id: '7-sill-mortar', phase: 2, title: 'Mortar packed under the aluminium sill', pos: [3.9, 1.04, 11.42], r: 0.9,
      hint: 'Look under the window to the right of the front door, where the frame meets the brick sill.',
      explain: 'The gap under the aluminium sill has been packed solid with mortar and smeared over the sill bricks. Mortar against aluminium attacks it, and the packing sits on the sill flashing and stops it draining.',
      fix: 'Keep mortar off the frame, isolate any aluminium that may touch masonry, keep packers clear of the flashing and close the small gap with a flexible sealant.',
      flag: 'V', src: 'nccWin82',
      build(kit) {
        const { mat, box } = kit, m = mat(0xc4beb2, { tex: 'concrete', bump: 1.2 }), g = grp(kit, box(1.44, 0.05, 0.22, m, 3.9, 1.035, 11.41));
        for (const [x, w] of [[3.3, 0.16], [3.62, 0.1], [3.95, 0.2], [4.3, 0.12], [4.52, 0.09]]) g.add(box(w, 0.035, 0.08, m, x, 1.07, 11.47));
        for (const [x, w, h] of [[3.4, 0.1, 0.12], [3.8, 0.07, 0.08], [4.05, 0.12, 0.15], [4.45, 0.08, 0.1]]) g.add(box(w, h, 0.012, m, x, 0.965 - h / 2, 11.526));
        return g;
      } },
    { id: '7-head-weeps', phase: 2, title: 'Weepholes above the window sealed over', pos: [-3.4, 2.34, 11.5], r: 0.3, box: [[-4.2, 2.28, 11.44], [-2.6, 2.4, 11.56]],
      hint: 'Look at the brick course just above the large window left of the front door.',
      explain: 'The caulker has run sealant along the lintel line and over the weepholes above the head flashing. Water the flashing catches in the cavity now has no way out and can run back into the window head.',
      fix: 'Leave the weepholes in the course above every flashing open, at no more than 1.2 m centres, and seal only the frame to the brick reveal.',
      flag: 'V', src: 'nccMas57',
      build(kit) {
        const { mat, box } = kit, m = mat(0xd5d7d8, { roughness: 0.4 });
        return grp(kit, box(0.11, 0.08, 0.022, m, -4.0, 2.34, 11.505), box(0.11, 0.08, 0.022, m, -2.8, 2.34, 11.505), box(1.92, 0.016, 0.014, m, -3.4, 2.31, 11.506));
      } },
    { id: '7-door-annealed', phase: 4, title: 'Ordinary glass in the front door', pos: [1.3, 1.0, 11.35], r: 0.3, box: [[1.2, 0.75, 11.28], [1.4, 1.9, 11.4]],
      hint: 'Read the sticker on the glass in the front door.',
      explain: 'The narrow glass panel in the front door carries a supplier sticker for 4 mm annealed float glass and no safety glass mark. Glass in a door must be Grade A safety glass, apart from a few listed exceptions such as small leadlights.',
      fix: 'Replace it with Grade A safety glass of the right thickness for its area, marked by etching or a non-reusable label.',
      flag: 'V', src: 'nccGlaz84',
      build(kit) {
        const t = kit.textPlane(['4 mm CLEAR FLOAT', 'Annealed'], 0.15, 0.08); t.position.set(1.3, 0.98, 11.347);
        return grp(kit, t);
      } },
    { id: '7-band-high', phase: 4, title: 'Visibility band on the sliding door too high', pos: [-2.0, 1.9, -5.35], r: 0.35, box: [[-3.15, 1.75, -5.45], [-0.85, 2.05, -5.25]],
      hint: 'Check the large glass panes of the back sliding door at walking height.',
      explain: 'The opaque band on the sliding door has been stuck on about 1.75 m above the floor. Its lower edge must be no more than 1.2 m and its upper edge at least 700 mm above the floor, or people can walk into the glass.',
      fix: 'Fit an opaque band at least 20 mm high with its upper edge at least 700 mm and its lower edge no more than 1.2 m above the floor.',
      flag: 'V', src: 'nccGlaz84', hide: ['labels'],
      build(kit) {
        const { mat, box, textPlane } = kit, lab = textPlane(['SAFETY GLASS', 'Grade A · see label'], 0.17, 0.085);
        lab.position.set(-2.89, 0.45, -5.349); lab.rotation.y = Math.PI;
        return grp(kit, box(2.26, 0.03, 0.004, mat(0xf2f5f7, { roughness: 0.5, transparent: true, opacity: 0.9 }), -2.0, 1.9, -5.349), lab);
      } },
  ],

  /* ---------- Stage 8: plumbing and drainage rough-in ---------- */
  8: [
    { id: '8-no-bedding', phase: 1, title: 'Drain pipe laid on rocks, no bedding', pos: [-3.6, 0.08, -11.9], r: 0.3, box: [[-3.9, 0, -12.85], [-3.3, 0.25, -10.95]],
      hint: 'Follow the sewer pipe along the open trench and look at what it is lying on.',
      explain: 'Along this length the pipe sits on rocks and clods with no sand bedding. Point loads from the rocks can crack the pipe or push it off its fall once the trench is backfilled.',
      fix: 'Take out the rocks and bed the pipe on clean sand so it is evenly supported along its length, to the depth the drainer\'s Standard and the water authority require.',
      flag: 'T', src: '',
      build(kit) {
        const { mat, box, cyl, stones } = kit, soil = mat(0x6e5236, { tex: 'soil' }), rock = mat(0x8e8a84, { roughness: 1 });
        const g = grp(kit, box(0.48, 0.012, 1.9, soil, -3.6, 0.056, -11.9), stones(70, { x0: -3.8, x1: -3.4, z0: -12.8, z1: -11.0, y: 0.058, size: 0.05, seed: 11 }));
        for (const [x, z, r] of [[-3.62, -12.5, 0.07], [-3.55, -12.05, 0.06], [-3.64, -11.6, 0.075], [-3.5, -11.25, 0.05]]) g.add(cyl(r, 0.06, rock, x, 0.06, z, 6));
        return g;
      } },
    { id: '8-backfill-early', phase: 2, title: 'Trench backfilled before the inspection', pos: [-3.6, 0.2, -8.5], r: 0.3, box: [[-4.25, 0, -9.95], [-2.95, 0.45, -7.05]],
      hint: 'The drain is on test and the inspection is booked. Walk along the trench.',
      explain: 'Part of the trench has already been filled in while the drain waits for its VBA inspection. The pipe and joints must be fully visible until the inspection is done, or the auditor cannot pass the drain.',
      fix: 'Keep the whole drain uncovered and on test until it passes, or until 30 minutes after the booking time if no auditor attends.',
      flag: 'V', src: 'vbaDrainBook',
      build(kit) {
        const { mat, box, cyl } = kit, soil = mat(0xb08d68, { tex: 'soil' }), g = grp(kit, box(0.95, 0.09, 2.8, soil, -3.6, 0.045, -8.5));
        for (const z of [-9.3, -8.5, -7.7]) g.add(cyl(0.55, 0.3, soil, -3.6, 0.15, z, 14, false, 0.16));
        return g;
      } },
    { id: '8-vent-roofspace', phase: 3, title: 'Vent pipe ends inside the roof space', pos: [-2.75, 3.4, 5.53], r: 0.35, box: [[-3.05, 2.6, 5.38], [-2.45, 3.6, 5.68]],
      hint: 'Follow each grey vent pipe up from the bathroom and see where it ends.',
      explain: 'A vent from the basin branch stops in the roof space with an open end. Sewer gas and moist air will come out under the roof instead of outside, and the vent may not protect the trap seals as designed.',
      fix: 'Carry the vent up through the roof, or join it to the main vent above the highest fixture, and finish it outside at the height and clearances AS/NZS 3500.2 sets.',
      flag: 'C', src: '',
      build(kit) {
        const { mat, pipe, cyl } = kit, m = mat(0xd7d9dd, { roughness: 0.5 }), end = cyl(0.027, 0.05, m, -2.6, 3.45, 5.53, 14, true);
        end.rotation.z = Math.PI / 2 + 0.34;
        return grp(kit, pipe([[-2.9, 0.65, 5.53], [-2.9, 3.35, 5.53], [-2.62, 3.45, 5.53]], 0.02, m), end);
      } },
    { id: '8-pipe-floor', phase: 4, title: 'Hot water pipe laid across the bathroom floor', pos: [-3.3, 0.18, 3.0], r: 0.3, box: [[-3.45, 0.1, 1.2], [-2.5, 0.35, 5.45]],
      hint: 'Look at the bathroom floor where the shower and vanity will go.',
      explain: 'A hot water pipe has been dropped out of the wall and laid loose across the bathroom slab, through the shower area. Under the screed and membrane, a leak or a later fixing can wet the slab where no one can reach it.',
      fix: 'Run the pipe in the wall or ceiling space, clipped and protected, and drop it to the stub, keeping the wet area floor clear for the screed and membrane.',
      flag: 'T', src: '',
      build(kit) {
        return grp(kit, kit.pipe([[-3.3, 0.72, 1.225], [-3.3, 0.168, 1.225], [-3.3, 0.168, 4.7], [-2.6, 0.168, 5.4], [-2.6, 0.62, 5.4]], 0.014, kit.mat(0xd8383a, { roughness: 0.45 })));
      } },
    { id: '8-pressure-high', phase: 5, title: 'Static pressure over the limit', pos: [-2.0, 0.92, 7.13], r: 0.7,
      hint: 'Read the gauge on the water riser during the pressure test.',
      explain: 'The gauge above the pressure-limiting valve reads 720 kPa static. Static pressure at any outlet must be no more than 500 kPa, so the valve is faulty, set wrong or bypassed.',
      fix: 'Fit or reset the pressure-limiting valve so the static pressure is 500 kPa or less at every outlet, record the reading and tell the owner.',
      flag: 'V', src: 'bpcCW03',
      build(kit) {
        const { mat, rod, textPlane } = kit, tag = textPlane(['STATIC', '720 kPa'], 0.22, 0.12);
        tag.position.set(-2.0, 0.83, 7.135);
        return grp(kit, rod([-2.0, 0.98, 7.13], [-1.952, 1.008, 7.13], 0.004, mat(0xc0392b, { roughness: 0.5 })), tag);
      } },
  ],

  /* ---------- Stage 9: electrical and data rough-in ---------- */
  9: [
    { id: '9-temp-loose', phase: 0, title: 'Temporary board not fixed to anything', pos: [5.8, 0.6, 14.36], r: 1.0,
      hint: 'Look at how the temporary supply board near the front is held up.',
      explain: 'The temporary switchboard is sitting loose on a concrete block, propped with an offcut. A site board must be securely attached to a pole, post, wall or other rigid structure, or the free-standing unit fixed in place, so it cannot be knocked over.',
      fix: 'Mount the board on a sound post or rigid frame fixed in the ground, with the underground mains in conduit and guarded up to the enclosure.',
      flag: 'V', src: 'esvTemp', hide: ['temp'],
      build(kit) {
        const { THREE, mat, box, cyl, rod, textPlane } = kit, encl = mat(0xaab2bb, { roughness: 0.55 }), dark = mat(0x1b1d20, { roughness: 0.7 }), orange = mat(0xe8590c, { roughness: 0.6 });
        const board = new THREE.Group(), sign = textPlane(['TEMPORARY SUPPLY'], 0.6, 0.15);
        sign.position.set(0, 0.8, 0.125);
        board.add(box(0.55, 0.7, 0.24, encl, 0, 0.35, 0), box(0.5, 0.64, 0.012, dark, 0, 0.35, 0.125), sign);
        board.position.set(5.8, 0.2, 14.38); board.rotation.set(-0.2, 0, 0.07);
        return grp(kit, board, box(0.4, 0.2, 0.2, mat(0xffffff, { tex: 'concrete' }), 5.8, 0.1, 14.4), rod([5.72, 0.78, 14.2], [5.66, 0.0, 13.75], 0.025, mat(0xffffff, { tex: 'timber' })),
          rod([6.4, 0.03, 17.0], [5.95, 0.03, 14.45], 0.04, orange), cyl(0.028, 0.22, orange, 5.95, 0.11, 14.45, 10), cyl(0.045, 0.18, mat(0xb9c2cd, { metalness: 0.6, roughness: 0.35 }), 5.95, 0.09, 14.45, 12));
      } },
    { id: '9-cable-face', phase: 2, title: 'Cable stapled across the stud faces', pos: [-0.75, 1.15, 11.245], r: 0.3, box: [[-2.25, 0.5, 11.15], [0.75, 1.8, 11.3]],
      hint: 'Look at the inside face of the front wall, between the big window and the front door.',
      explain: 'A power cable has been run diagonally across the face of the studs and stapled on. Plasterboard screws and later fixings for skirting, shelves or pictures can go straight through it.',
      fix: 'Draw cables through holes bored near the centre of the studs, running straight up, down or across in line with the outlets, and protect them anywhere a fixing could reach them.',
      flag: 'C', src: '',
      build(kit) {
        const { mat, box, rod } = kit, m = mat(0xe8590c, { roughness: 0.6 }), st = mat(0x555b62, { roughness: 0.5 }), g = grp(kit, rod([-2.2, 0.55, 11.245], [0.7, 1.75, 11.245], 0.012, m));
        const a = Math.atan2(1.2, 2.9);
        for (const x of [-1.9175, -1.4675, -1.0175, -0.5675, -0.1175, 0.3325]) { const s = box(0.045, 0.012, 0.012, st, x, 0.55 + (x + 2.2) * (1.2 / 2.9), 11.236); s.rotation.z = a + Math.PI / 2; g.add(s); }
        return g;
      } },
    { id: '9-alarm-corner', phase: 3, title: 'Smoke alarm base in the corner', pos: [-5.15, 2.81, -5.15], r: 0.8,
      hint: 'Look up at the smoke alarm bases. Check the one in the back room.',
      explain: 'This smoke alarm base is tucked into the corner, about 100 mm from each wall. Smoke may not reach the dead air in a corner, so a ceiling alarm must be at least 300 mm from where the wall meets the ceiling.',
      fix: 'Move the base onto the ceiling at least 300 mm from the walls, or use a wall mount 300 to 500 mm below the ceiling if a ceiling position is not possible.',
      flag: 'V', src: 'nccHp95',
      build(kit) {
        const { mat, cyl, rod } = kit, red = mat(0xd62828, { roughness: 0.6 });
        return grp(kit, cyl(0.12, 0.04, mat(0xf4f4f2, { roughness: 0.4 }), -5.15, 2.81, -5.15, 24), cyl(0.04, 0.045, red, -5.15, 2.81, -5.15, 12),
          rod([-5.15, 2.82, -5.15], [-5.15, 2.96, -5.15], 0.014, red), rod([-1.0, 2.96, 3.2], [-5.15, 2.96, -5.15], 0.014, red));
      } },
    { id: '9-data-power', phase: 3, title: 'Data cable tied to the power cable', pos: [5.27, 0.47, 0.2], r: 0.35, box: [[5.15, 0.35, -1.8], [5.35, 0.65, 2.25]],
      hint: 'Look at the cable runs low on the east wall, where it passes the bedroom and the back room.',
      explain: 'A data cable has been cable-tied to the power cable and pulled through the same holes. Data and power need to be kept apart where they run side by side, for safety and to avoid interference.',
      fix: 'Give the data cable its own path, separated from power by the distance the Wiring Rules and cabling standards set, and cross power at right angles where it must.',
      flag: 'C', src: '',
      build(kit) {
        const { mat, box, cyl, rod } = kit, blue = mat(0x2f6fae, { roughness: 0.6 }), tie = mat(0xf4f4f2, { roughness: 0.5 });
        const g = grp(kit, rod([5.285, 0.475, -1.75], [5.285, 0.475, 2.15], 0.007, blue), rod([5.285, 0.475, 2.15], [5.285, 2.92, 2.15], 0.007, blue), box(0.04, 0.075, 0.075, blue, 5.24, 0.62, -1.75));
        for (let z = -1.41; z < 2.1; z += 0.45) { const t = cyl(0.028, 0.012, tie, 5.285, 0.462, z, 10, true); t.rotation.x = Math.PI / 2; g.add(t); }
        return g;
      } },
    { id: '9-switched-on', phase: 5, title: 'New switchboard in use before the inspection', pos: [6.1, 0.9, 9.3], r: 0.3, box: [[5.55, 0, 8.2], [6.75, 1.7, 10.45]],
      hint: 'The prescribed work has not been inspected yet. Look around the main switchboard.',
      explain: 'A work lamp is plugged in and running off the new main switchboard before the licensed electrical inspector has seen it. Prescribed work, such as the consumer mains and the main switchboard, cannot be turned on until it has been inspected.',
      fix: 'Keep site power on the temporary board and leave the new installation switched off and isolated until the inspection is done.',
      flag: 'V', src: 'esvCoesConsumers',
      build(kit) {
        const { mat, box, rod, pipe } = kit, yel = mat(0xf2c94c, { roughness: 0.6 }), dark = mat(0x2a2e33, { roughness: 0.6 }), glow = mat(0xfff4c2, { emissive: 0xffe680, emissiveIntensity: 1.6 });
        const g = grp(kit, box(0.32, 0.22, 0.09, dark, 6.4, 1.45, 8.5), box(0.27, 0.17, 0.01, glow, 6.4, 1.45, 8.55), box(0.05, 0.07, 0.05, yel, 5.66, 0.62, 10.15),
          pipe([[5.66, 0.6, 10.12], [5.85, 0.03, 9.95], [6.38, 0.03, 8.75], [6.4, 1.3, 8.5]], 0.009, yel));
        for (const [dx, dz] of [[0.35, 0.2], [-0.35, 0.2], [0, -0.38]]) g.add(rod([6.4, 1.32, 8.5], [6.4 + dx, 0, 8.5 + dz], 0.012, dark));
        return g;
      } },
  ],

  /* ---------- Stage 10: wet areas and waterproofing ---------- */
  10: [
    { id: '10-timber-hob', phase: 1, title: 'Timber hob round the shower', pos: [-3.95, 0.22, 2.95], r: 0.35, box: [[-5.27, 0.14, 2.88], [-2.6, 0.3, 3.02]],
      hint: 'Look at the edge of the shower area on the new screed.',
      explain: 'A timber hob has been built round the shower. Timber must not be used for a hob, because it swells, moves and rots when it gets wet under the tiles.',
      fix: 'Build the hob from masonry, concrete, autoclaved aerated concrete or extruded polyurethane foam, or make the shower step-down or hobless with a waterstop.',
      flag: 'V', src: 'nccHp102',
      build(kit) {
        const { mat, box } = kit, m = mat(0xffffff, { tex: 'timber' });
        return grp(kit, box(2.6, 0.12, 0.07, m, -3.95, 0.21, 2.95), box(0.07, 0.12, 1.66, m, -2.65, 0.21, 2.085));
      } },
    { id: '10-ponding', phase: 1, title: 'Water ponding on the screed', pos: [-4.65, 0.21, 4.9], r: 0.8,
      hint: 'Someone ran a hose over the new screed. Look where the water ended up.',
      explain: 'Water is lying in the corner away from the floor waste, so the screed has a hollow or falls the wrong way. Water that ponds on the screed will pond under the tiles as well.',
      fix: 'Grind or re-screed so the whole floor falls to the waste at between 1:80 and 1:50, and check it with a level before the waterproofer starts.',
      flag: 'V', src: 'bpcWet',
      build(kit) {
        const { mat, cyl } = kit, w = mat(0x7cc4e6, { transparent: true, opacity: 0.6, roughness: 0.05, metalness: 0.1, depthWrite: false });
        return grp(kit, ...[[-4.75, 4.85, 0.38], [-4.42, 5.08, 0.26], [-4.95, 5.12, 0.2]].map(([x, z, r]) => cyl(r, 0.012, w, x, fy10(x, z) + 0.004, z, 28)));
      } },
    { id: '10-short-membrane', phase: 4, title: 'Shower wall membrane stops short', pos: [-5.0, 1.65, 1.27], r: 0.3, box: [[-5.27, 1.3, 1.25], [-4.2, 2.0, 2.4]],
      hint: 'Check how high the membrane goes on the shower walls.',
      explain: 'In the shower corner the membrane stops about 1.2 m above the floor. Shower walls must be waterproofed to at least 1800 mm above the floor substrate, so water running down the wall above the membrane soaks the sheet and the frame.',
      fix: 'Carry both coats up the shower walls to at least 1800 mm above the floor substrate, across the full width of the shower area.',
      flag: 'V', src: 'nccHp102',
      build(kit) {
        const { mat, box } = kit, m = mat(0xcfd3cb, { roughness: 0.92 });
        return grp(kit, box(1.0, 0.6, 0.002, m, -4.75, 1.65, 1.2625), box(0.002, 0.6, 1.14, m, -5.2425, 1.65, 1.83));
      } },
    { id: '10-pinholes', phase: 4, title: 'Pinholes and thin spots in the membrane', pos: [-4.35, 0.19, 3.55], r: 0.7,
      hint: 'Look closely at the finished membrane on the floor, outside the shower.',
      explain: 'Part of the floor membrane is patchy, with pinholes and thin spots where the lighter first coat shows through. Each pinhole is a path for water into the slab and the rooms next door.',
      fix: 'Find every thin spot and pinhole before tiling, patch them with more thin coats to the maker\'s dry film thickness, and check again.',
      flag: 'V', src: 'bpcWet',
      build(kit) {
        const { mat, cyl } = kit, thin = mat(0x8cc3ea, { roughness: 0.6 }), hole = mat(0x3a3f45, { roughness: 0.7 }), g = grp(kit);
        for (const [x, z, r] of [[-4.4, 3.5, 0.17], [-4.18, 3.62, 0.11], [-4.55, 3.7, 0.09], [-4.25, 3.33, 0.08]]) g.add(cyl(r, 0.004, thin, x, fy10(x, z) + 0.008, z, 18));
        for (const [x, z] of [[-4.6, 3.4], [-4.48, 3.58], [-4.3, 3.45], [-4.12, 3.5], [-4.36, 3.76], [-4.2, 3.82], [-4.62, 3.62], [-4.05, 3.66], [-4.42, 3.3], [-4.28, 3.66]]) g.add(cyl(0.014, 0.006, hole, x, fy10(x, z) + 0.009, z, 10));
        return g;
      } },
    { id: '10-door-leak', phase: 5, title: 'Flood test water escaping at the doorway', pos: [-1.55, 0.16, 3.6], r: 0.8,
      hint: 'The floor is flooded. Check the floor outside the bathroom door.',
      explain: 'Water is seeping out across the hall floor at the bathroom doorway during the flood test. The membrane is not sealed to the doorway waterstop, so water gets under it and into the next room.',
      fix: 'Drain the floor, terminate and seal the membrane to the waterstop and the perimeter flashing, let it cure, then repeat the flood test.',
      flag: 'V', src: 'bpcWet',
      build(kit) {
        const { mat, cyl } = kit, wet = mat(0x454a50, { transparent: true, opacity: 0.6, roughness: 0.12, depthWrite: false });
        return grp(kit, ...[[-1.6, 3.6, 0.32], [-1.3, 3.85, 0.22], [-1.75, 3.32, 0.18], [-1.15, 3.45, 0.14]].map(([x, z, r]) => cyl(r, 0.003, wet, x, 0.152, z, 24)));
      } },
  ],

  /* ---------- Stage 11: insulation and energy efficiency ---------- */
  11: [
    { id: '11-fan-roofspace', phase: 1, title: 'Bathroom exhaust ducted into the roof space', pos: [-4.5, 3.05, 3.35], r: 0.3, box: [[-4.85, 2.85, 3.15], [-3.4, 3.25, 3.55]],
      hint: 'Follow the bathroom exhaust duct from the fan and see where it ends.',
      explain: 'The bathroom exhaust duct stops in the roof space with an open end. Moist air dumped there condenses on the cold roof and framing, which leads to mould and rot.',
      fix: 'Run the duct to a cap or vent that discharges to outdoor air through the eave or the roof, and seal its joints.',
      flag: 'V', src: 'bpcGE15', hide: ['fans'],
      build(kit) {
        const { mat, box, cyl, rod, pipe, textPlane } = kit, white = mat(0xf4f4f2, { roughness: 0.5 }), grey = mat(0x8f99a3, { roughness: 0.6 }), foil = mat(0xdfe5ea, { metalness: 0.7, roughness: 0.25 }), g = grp(kit);
        for (const [x, z, ex, label] of [[-3.6, 3.35, null, 'Bathroom 25 L/s'], [4.4, 9.4, 5.9, 'Kitchen 40 L/s'], [-4.2, 9.4, -5.9, 'Laundry 40 L/s']]) {
          const sign = textPlane([label], 0.8, 0.18); sign.position.set(x, CEIL + 0.5, z);
          g.add(box(0.3, 0.08, 0.3, white, x, CEIL - 0.04, z), cyl(0.1, 0.12, grey, x, CEIL + 0.02, z, 14), rod([x, CEIL + 0.06, z], [x, CEIL + 0.28, z], 0.05, foil), sign);
          if (ex == null) { const end = cyl(0.056, 0.06, foil, -4.7, CEIL + 0.13, z, 14, true); end.rotation.z = Math.PI / 2 + 0.29; g.add(pipe([[x, CEIL + 0.28, z], [-4.2, CEIL + 0.28, z], [-4.7, CEIL + 0.13, z]], 0.05, foil), end); continue; }
          const cap = cyl(0.09, 0.1, white, ex + Math.sign(ex) * 0.05, CEIL + 0.28, z, 16); cap.rotation.z = Math.PI / 2;
          g.add(rod([x, CEIL + 0.28, z], [ex, CEIL + 0.28, z], 0.05, foil), cap);
        }
        return g;
      } },
    { id: '11-wrap-torn', phase: 1, title: 'Torn wall wrap behind the frame', pos: [-5.34, 1.25, 10.56], r: 0.8,
      hint: 'Look at the wall wrap behind the studs on the west wall of the front room.',
      explain: 'The wall wrap is torn open between two studs and the flap is hanging loose. Rain that gets through the brick and across the cavity can now reach the frame and the insulation.',
      fix: 'Patch the tear with a piece of wrap lapped well past the hole on every side, upper piece over lower, and tape it with the maker\'s tape.',
      flag: 'T', src: '',
      build(kit) {
        const { mat, box } = kit, flap = box(0.004, 0.5, 0.3, mat(0xb4bcc6, { metalness: 0.2, roughness: 0.5 }), -5.358 + Math.sin(0.55) * 0.25, 1.53 - Math.cos(0.55) * 0.25, 10.56);
        flap.rotation.z = 0.55;
        return grp(kit, box(0.004, 0.52, 0.32, mat(0x6b3b2c, { roughness: 1 }), -5.358, 1.27, 10.56), flap);
      } },
    { id: '11-batt-downlight', phase: 6, title: 'Batt laid over a downlight', pos: [3.5, 3.0, 8.4], r: 0.8,
      hint: 'Check the ceiling insulation around the downlights in the kitchen corner.',
      explain: 'A batt has been laid straight over a downlight and its cover. Unless the fitting and cover are rated for contact with insulation, the trapped heat can damage the fitting or start a fire.',
      fix: 'Keep the clearance the light maker and the Wiring Rules require, or use a fitting rated for insulation contact, and lay the batts up to the cover, not over it.',
      flag: 'C', src: '',
      build(kit) {
        const b = kit.box(0.95, 0.2, 0.62, kit.mat(0xf2d27a, { roughness: 1 }), 3.52, CEIL + 0.13, 8.42); b.rotation.set(0.06, 0.25, -0.08);
        return grp(kit, b);
      } },
    { id: '11-eave-blocked', phase: 6, title: 'Batts pushed over the eave vent', pos: [2.5, 2.92, 11.6], r: 0.3, box: [[1.4, 2.8, 11.25], [3.6, 3.05, 11.9]],
      hint: 'Look where the ceiling batts meet the front eave.',
      explain: 'Batts have been pushed out over the top plate into the eave and are lying on the eave vent. The roof space loses its low-level ventilation, so moist air cannot get out and condensation can build up.',
      fix: 'Stop the batts at the wall line, keep the eave openings clear and fit baffles where batts reach the eave so air can flow past.',
      flag: 'T', src: '',
      build(kit) {
        const { mat, box } = kit, m = mat(0xf2d27a, { roughness: 1 }), g = grp(kit);
        for (const [x, w, r] of [[1.95, 1.1, 0.12], [3.05, 1.05, 0.08]]) { const b = box(w, 0.16, 0.62, m, x, CEIL + 0.06, 11.56); b.rotation.x = r; g.add(b); }
        return g;
      } },
    { id: '11-batt-bulge', phase: 6, title: 'Wall batts too thick for the studs', pos: [0.33, 1.2, 11.2], r: 0.3, box: [[-0.12, 0.5, 11.1], [0.8, 1.9, 11.27]],
      hint: 'Look along the inside face of the front wall, beside the front door.',
      explain: 'These wall batts are thicker than the 90 mm studs and bulge out past the frame. When the plasterboard goes on they will be squashed, and a compressed batt loses R-value.',
      fix: 'Use batts made for the stud depth so they sit at full thickness inside the frame, giving the R-value the energy report assumes.',
      flag: 'V', src: 'nccHp132',
      build(kit) {
        const { mat, box } = kit, m = mat(0xf0a6b4, { roughness: 1 }), g = grp(kit);
        for (const x of [0.5575, 0.1075]) g.add(box(0.4, 1.3, 0.05, m, x, 1.2, 11.235), box(0.34, 1.0, 0.04, m, x, 1.2, 11.195), box(0.26, 0.6, 0.03, m, x, 1.2, 11.165));
        return g;
      } },
  ],

  /* ---------- Stage 12: internal linings ---------- */
  12: [
    { id: '12-ceiling-sag', phase: 1, title: 'Ceiling sheet sagging between fixings', pos: [2.54, 2.72, 7.34], r: 0.3, box: [[1.9, 2.6, 5.5], [3.2, 2.86, 9.2]],
      hint: 'Look up at the new ceiling sheets in the living room.',
      explain: 'This ceiling sheet is sagging between the framing, a sign it has too few screws or is relying on adhesive alone. It will crack at the joints and can come down under the weight of the batts.',
      fix: 'Refix the sheet with screws at no more than 300 mm across the width and at the perimeter spacing the maker gives, with back-blocked butt joints, before the batts go on.',
      flag: 'V', src: 'knaufManual',
      build(kit) {
        const { mat, box } = kit, m = mat(0xece5d3, { roughness: 0.92, emissive: 0x625a48 }), g = grp(kit), N = 8, z0 = 5.55, z1 = 9.13, base = CEIL - 0.0135;
        const y = (t) => base - 0.15 * Math.sin(Math.PI * t);
        for (let i = 0; i < N; i++) {
          const za = z0 + (z1 - z0) * i / N, zb = z0 + (z1 - z0) * (i + 1) / N, ya = y(i / N), yb = y((i + 1) / N), len = Math.hypot(zb - za, yb - ya);
          const s = box(1.19, 0.013, len + 0.004, m, 2.54, (ya + yb) / 2, (za + zb) / 2); s.rotation.x = Math.atan2(-(yb - ya), zb - za); g.add(s);
        }
        return g;
      } },
    { id: '12-wrong-board', phase: 2, title: 'Standard plasterboard on the shower wall', pos: [-4.0, 1.5, 1.285], r: 0.3, box: [[-5.2, 0.16, 1.25], [-2.8, 2.84, 1.32]],
      hint: 'Compare the boards used inside the bathroom.',
      explain: 'A sheet of standard plasterboard has been fixed on the shower wall among the wet-area boards. Standard board is not made for damp areas and softens and grows mould if moisture gets past the tiles and membrane.',
      fix: 'Replace it with the wet-area board the plans and the waterproofing system call for, fixed with screws or nails only and no stud adhesive.',
      flag: 'T', src: '',
      build(kit) {
        const { mat, box } = kit, m = mat(0xe8e0cc, { roughness: 0.92, emissive: 0x5a5242 });
        return grp(kit, box(2.4, 1.33, 0.005, m, -4.0, 0.83, 1.2845), box(2.4, 1.33, 0.005, m, -4.0, 2.17, 1.2845));
      } },
    { id: '12-outlets-back', phase: 3, title: 'Outlets back to back in the separating wall', pos: [4.0, 0.45, 13.4], r: 0.7,
      hint: 'Check the power outlets on both faces of the sample separating wall.',
      explain: 'A pair of outlets has been set back to back at the same spot on opposite faces of the separating wall. In a framed separating wall, outlets on opposite sides must be offset by at least 300 mm, or sound and fire pass through the holes.',
      fix: 'Move one outlet so the two are at least 300 mm apart along the wall, and pack and seal round each box as the fire and sound details require.',
      flag: 'V', src: 'nccHp107',
      build(kit) {
        const { mat, box } = kit, m = mat(0xf4f4f2, { roughness: 0.5 });
        return grp(kit, box(0.075, 0.075, 0.03, m, 4.0, 0.45, 13.4 + 0.124), box(0.075, 0.075, 0.03, m, 4.0, 0.45, 13.4 - 0.1285));
      } },
    { id: '12-screw-pops', phase: 4, title: 'Screw heads showing through the finish', pos: [-0.6, 1.35, 11.22], r: 0.3, box: [[-1.6, 0.8, 11.14], [0.45, 1.9, 11.26]],
      hint: 'Walk along the inside of the front wall, between the big window and the front door, and look at the surface.',
      explain: 'Screw heads have popped and show through the set finish, a sign of a wet or moving frame or screws driven too far. Screw heads or nail popping showing at completion are outside the BPC tolerance.',
      fix: 'Drive a new screw beside each popped one, reset the old one below the surface, then fill, sand and recoat, after checking the frame is dry and the sheet is tight.',
      flag: 'V', src: 'bpcTol26',
      build(kit) {
        const { mat, cyl } = kit, head = mat(0x8d877b, { roughness: 0.6 }), ring = mat(0xc9c3b4, { roughness: 0.8 }), g = grp(kit);
        for (const [x, yy] of [[-1.4675, 1.25], [-1.4675, 1.8], [-1.0175, 0.95], [-1.0175, 1.55], [-0.5675, 1.25], [-0.5675, 1.55], [-0.5675, 1.8], [-0.1175, 0.95], [-0.1175, 1.55], [0.3325, 1.25], [0.3325, 1.8]]) {
          const a = cyl(0.03, 0.004, ring, x, yy, 11.2235, 16), b = cyl(0.014, 0.008, head, x, yy, 11.222, 12); a.rotation.x = Math.PI / 2; b.rotation.x = Math.PI / 2; g.add(a, b);
        }
        return g;
      } },
    { id: '12-claim-early', phase: 6, title: 'Fixing stage claimed before the fit-out', pos: [-1.0, 1.25, 12.6], r: 0.8,
      hint: 'Read the paperwork posted at the front of the house and compare it with what is fixed inside.',
      explain: 'A claim for the fixing stage has been issued now the linings are up, but no doors, architraves, skirting, cabinets or fittings are fixed yet. The fixing stage is not reached until they are all fitted and fixed in position.',
      fix: 'Hold the fixing stage claim until all internal cladding, architraves, skirting, doors, built-in shelves and the listed fittings are fixed, and claim no more than the contract allows for the stage.',
      flag: 'V', src: 'cavPay',
      build(kit) {
        const { mat, cyl, textPlane } = kit, steel = mat(0xb9c2cd, { metalness: 0.6, roughness: 0.35 }), t = textPlane(['PROGRESS CLAIM 4', 'Fixing stage: 25 per cent', 'Linings complete', 'Payment due in 7 days'], 0.9, 0.55);
        t.position.set(-1.0, 1.25, 12.6);
        return grp(kit, t, cyl(0.02, 1.0, steel, -1.5, 0.5, 12.59, 8), cyl(0.02, 1.0, steel, -0.5, 0.5, 12.59, 8));
      } },
  ],
};

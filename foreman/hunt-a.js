// Defects for the find-the-defects mode, stages 1 to 6. Shape and rules: see hunt.js.
// Positions are world metres and follow the stage builders: site.js, frame.js and step-01.js to step-06.js.

const PITCH = Math.PI / 8, TAN = Math.tan(PITCH), PLATE_TOP = 2.85, HS = 5.35;
const yc = (x) => (HS - Math.abs(x)) * TAN + 0.05;        // truss top chord centre line above the wall plate (step-04.js)
const ty = (x) => PLATE_TOP + yc(x) + 0.14;               // roof tile surface (step-05.js)
const G_BOT = PLATE_TOP + yc(5.8) - 0.125, DP_X = 5.8775;  // gutter bottom and downpipe centre line (step-05.js)
const YK = (k) => 0.153 + k * 0.086;                      // top of brick course k (step-06.js)

// Many identical boxes as one instanced mesh: items are [x, y, z, sx, sy, sz].
function instBoxes(kit, material, items) {
  const { THREE } = kit, im = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), material, items.length);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(), t = new THREE.Vector3();
  items.forEach(([x, y, z, sx, sy, sz], i) => im.setMatrixAt(i, m4.compose(t.set(x, y, z), q, s.set(sx, sy, sz))));
  im.castShadow = true;
  return im;
}

// A site worker in hi-vis with feet at (x, y, z), facing +z when ry is 0.
function worker(kit, x, y, z, ry = 0, armsUp = false) {
  const { THREE, mat, box, cyl } = kit, g = new THREE.Group();
  const hv = mat(0xff8a1f), pants = mat(0x2b3a55), skin = mat(0xd9a37a), hat = mat(0xf6f6f2);
  g.add(box(0.13, 0.82, 0.16, pants, -0.09, 0.41, 0), box(0.13, 0.82, 0.16, pants, 0.09, 0.41, 0), box(0.42, 0.6, 0.24, hv, 0, 1.12, 0));
  if (armsUp) g.add(box(0.1, 0.62, 0.11, hv, -0.27, 1.68, 0.02), box(0.1, 0.62, 0.11, hv, 0.27, 1.68, 0.02));
  else g.add(box(0.1, 0.6, 0.11, hv, -0.27, 1.1, 0), box(0.1, 0.6, 0.11, hv, 0.27, 1.1, 0));
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.11, 14, 10), skin); head.position.set(0, 1.56, 0); head.castShadow = true;
  g.add(head, cyl(0.125, 0.08, hat, 0, 1.66, 0, 16), cyl(0.16, 0.015, hat, 0, 1.625, 0.02, 16));
  g.position.set(x, y, z); g.rotation.y = ry;
  return g;
}

const water = (kit) => kit.mat(0x5fa8dc, { transparent: true, opacity: 0.8, roughness: 0.1 });

export default {
  /* ---------- Stage 1: permits and site establishment ---------- */
  1: [
    { id: '1-dig-gas', phase: 1, title: 'Machine digging on a marked gas line', pos: [-6.3, 0.3, 14.8], r: 1.4,
      hint: 'Look at the marked service lines near the west boundary.',
      explain: 'An excavator is digging straight over the yellow gas line. Location plans only show roughly where a service runs, so the bucket can strike the pipe before anyone sees it.',
      fix: 'Expose the pipe by hand or vacuum digging first, keep the machine outside the clearance the asset owner sets, and use a spotter.',
      flag: 'T', src: '',
      build(kit) {
        const { THREE, mat, box, cyl, rod, flat } = kit, g = new THREE.Group();
        const yel = mat(0xf2b01e), dark = mat(0x2f3338), glass = mat(0x6f8aa3, { roughness: 0.15, metalness: 0.5 });
        g.add(flat(1.1, 0.8, mat(0x3a2a1c), -6.3, 0.05, 14.8));                                   // the hole, over the gas line
        g.add(cyl(0.6, 0.4, mat(0xffffff, { tex: 'soil' }), -5.6, 0.2, 16.1, 16, false, 0.12));   // spoil heap
        g.add(box(1.7, 0.32, 0.3, dark, -4.3, 0.16, 14.35), box(1.7, 0.32, 0.3, dark, -4.3, 0.16, 15.25));
        g.add(box(1.3, 0.55, 1.15, yel, -4.25, 0.6, 14.8), box(0.75, 0.8, 0.75, yel, -4.05, 1.27, 14.55), box(0.02, 0.5, 0.6, glass, -4.44, 1.35, 14.55));
        g.add(rod([-4.8, 0.85, 14.95], [-5.75, 1.95, 14.85], 0.07, yel), rod([-5.75, 1.95, 14.85], [-6.3, 0.45, 14.8], 0.05, yel));
        g.add(box(0.4, 0.32, 0.5, dark, -6.3, 0.2, 14.8));
        return g;
      } },
    { id: '1-fence-gap', phase: 2, title: 'Fence panel down, site left open', pos: [-4.4, 0.5, 16.6], r: 0.3, box: [[-5.7, 0, 15.2], [-3.1, 1.9, 17.3]],
      hint: 'Walk the front boundary. Can the public get onto the site anywhere other than the gate?',
      explain: 'A fence panel has blown over and left a gap onto the street. Children and passers-by can now walk straight into the site.',
      fix: 'Every panel clamped to the next, each stand weighted or braced, and the fence checked at the end of each day and after wind.',
      flag: 'T', src: '', hide: ['fence'],
      build(kit) {
        const { THREE, mat, ghost, box } = kit, g = new THREE.Group();
        const panel = ghost(0x9aa5b1, 0.38), post = mat(0x59616b, { metalness: 0.6, roughness: 0.4 });
        const run = (x0, z0, x1, z1) => {   // same as buildSiteWorks in site.js
          const len = Math.hypot(x1 - x0, z1 - z0), a = Math.atan2(z1 - z0, x1 - x0);
          const p = box(len, 1.8, 0.03, panel, (x0 + x1) / 2, 0.9, (z0 + z1) / 2); p.rotation.y = -a; p.castShadow = false; g.add(p);
          const n = Math.max(1, Math.round(len / 2.4));
          for (let i = 0; i <= n; i++) g.add(box(0.07, 1.85, 0.07, post, x0 + ((x1 - x0) * i) / n, 0.92, z0 + ((z1 - z0) * i) / n));
        };
        const o = 0.35, x0 = -7.5 + o, x1 = 7.5 - o, z0 = -17.5 + o, z1 = 17.5 - o;
        run(x0, z0, x1, z0); run(x0, z0, x0, z1); run(x1, z0, x1, z1);
        run(x0, z1, -5.6, z1); run(-3.2, z1, 2.9, z1); run(6.1, z1, x1, z1);
        const fallen = new THREE.Group(); fallen.position.set(-4.4, 0.03, 16.25); fallen.rotation.y = 0.15;
        const pf = box(2.4, 0.02, 1.8, panel, 0, 0, 0); pf.castShadow = false; fallen.add(pf);
        fallen.add(box(2.4, 0.04, 0.04, post, 0, 0, -0.9), box(2.4, 0.04, 0.04, post, 0, 0, 0.9), box(0.04, 0.04, 1.8, post, -1.2, 0, 0), box(0.04, 0.04, 1.8, post, 1.2, 0, 0));
        for (let x = -0.9; x <= 0.91; x += 0.3) fallen.add(box(0.012, 0.012, 1.8, post, x, 0.005, 0));
        g.add(fallen);
        return g;
      } },
    { id: '1-sign-generic', phase: 2, title: 'Site sign without the permit details', pos: [-0.4, 1.65, 16.85], r: 1.3,
      hint: 'Read the sign on the front fence. What does it leave out?',
      explain: 'The board only says keep out. It names no permit number, builder, builder\'s registration or building surveyor, so neighbours and inspectors cannot tell who is responsible for the work.',
      fix: 'Display the permit number, builder\'s name and registration and the building surveyor, in the wording and size the permit conditions and council rules require.',
      flag: 'C', src: '', hide: ['sign'],
      build(kit) {
        const { THREE, C, mat, cyl, textPlane } = kit, g = new THREE.Group();
        g.add(cyl(0.05, 2.2, mat(C.steel), -1.6, 1.1, 16.8, 8), cyl(0.05, 2.2, mat(C.steel), 0.8, 1.1, 16.8, 8));
        const board = textPlane(['BUILDING SITE', 'Keep out', 'Authorised persons only'], 2.4, 1.2);
        board.position.set(-0.4, 1.65, 16.83); g.add(board);
        return g;
      } },
    { id: '1-stockpile-path', phase: 3, title: 'Soil stockpile on the footpath', pos: [-2.5, 0.3, 19.6], r: 1.6,
      hint: 'Look outside the sediment fence, between the block and the road.',
      explain: 'Spoil has been heaped on the footpath, outside the sediment controls, and mud is already washing over the kerb into the gutter. It blocks the path and sends soil into the stormwater drains.',
      fix: 'Keep stockpiles inside the block behind the sediment fence, clear of drains and covered, and clean the path and gutter by sweeping, not hosing.',
      flag: 'T', src: '',
      build(kit) {
        const { THREE, mat, box, cyl, flat } = kit, g = new THREE.Group(), mud = mat(0x6b5038, { roughness: 1 });
        g.add(cyl(1.05, 0.55, mat(0xffffff, { tex: 'soil' }), -2.6, 0.28, 19.2, 20, false, 0.15));
        const fan = flat(1.7, 1.0, mud, -2.2, 0.009, 19.95); fan.rotation.z = 0.25; g.add(fan);
        g.add(box(1.1, 0.012, 0.24, mud, -2.2, 0.146, 20.5), flat(2.8, 0.42, mud, -1.7, 0.009, 20.83));
        return g;
      } },
    { id: '1-lead-ground', phase: 4, title: 'Power lead lying across the vehicle entry', pos: [4.4, 0.25, 13.5], r: 0.3, box: [[-6.6, 0, 10.5], [7.0, 0.35, 13.9]],
      hint: 'Follow the temporary power from the pole to where it is being used.',
      explain: 'An extension lead runs from the temporary switchboard across the lawn, through a puddle and over the stabilised entry. Trucks and machines will drive over it and crush the insulation.',
      fix: 'Run leads overhead on insulated hooks or stands, or protect them where they must cross a path, and keep them out of water.',
      flag: 'T', src: '',
      build(kit) {
        const { THREE, C, mat, box, rod, pipe, cyl } = kit, g = new THREE.Group();
        const tim = mat(0xffffff, { tex: 'timber' }), steel = mat(0x6c7886, { metalness: 0.5, roughness: 0.4 });
        g.add(pipe([[-6.45, 1.2, 10.62], [-6.45, 0.03, 10.75], [-5.0, 0.03, 11.9], [-2.0, 0.03, 12.5], [0.8, 0.03, 12.6], [2.7, 0.03, 13.1], [2.95, 0.22, 13.25],
          [4.4, 0.23, 13.55], [5.9, 0.22, 13.35], [6.2, 0.03, 13.3], [6.5, 0.03, 13.1], [6.55, 0.85, 13.05]], 0.022, mat(C.orange)));
        g.add(cyl(0.5, 0.004, water(kit), -0.6, 0.008, 12.55, 20));
        g.add(box(0.6, 0.05, 1.2, tim, 6.62, 0.8, 13.0), box(0.3, 0.18, 0.35, mat(0x2f6fb3), 6.62, 0.92, 13.1));
        for (const [x, z] of [[6.4, 12.5], [6.84, 12.5], [6.4, 13.5], [6.84, 13.5]]) g.add(rod([x, 0, z], [x + (x < 6.6 ? 0.04 : -0.04), 0.78, z], 0.02, steel));
        return g;
      } },
  ],

  /* ---------- Stage 2: footings and slab ---------- */
  2: [
    { id: '2-membrane-tear', phase: 3, title: 'Torn membrane left unrepaired', pos: [3.05, 0.08, 9.75], r: 1.0,
      hint: 'Look closely at the orange membrane over the front slab panels.',
      explain: 'The 0.2 mm membrane is ripped open and the sand shows through. Ground moisture can rise into the slab at this spot.',
      fix: 'Patch every tear and puncture with extra membrane lapped past the damage and taped all round before the steel goes in.',
      flag: 'V', src: 'abcb42',
      build(kit) {
        const { THREE, C, mat, flat, face } = kit, g = new THREE.Group();
        const sand = mat(0xffffff, { tex: 'sand' }), mm = mat(C.membrane, { side: THREE.DoubleSide });
        const a = flat(0.85, 0.32, sand, 3.0, 0.056, 9.7); a.rotation.z = 0.35; g.add(a);
        const b = flat(0.4, 0.22, sand, 3.32, 0.057, 9.85); b.rotation.z = -0.4; g.add(b);
        g.add(face([[2.65, 0.056, 9.55], [3.05, 0.056, 9.5], [2.85, 0.2, 9.35]], mm), face([[3.1, 0.056, 9.92], [3.5, 0.056, 9.98], [3.3, 0.17, 10.15]], mm));
        return g;
      } },
    { id: '2-riser-unsealed', phase: 3, title: 'Pipe through the membrane with no seal or collar', pos: [-1.4, 0.2, 9.4], r: 0.9,
      hint: 'Check every pipe that comes up through the membrane.',
      explain: 'A riser has been pushed through a ragged cut in the membrane with no tape, sleeve or termite collar. Moisture and termites can come up beside the pipe.',
      fix: 'Seal the membrane to the pipe with tape or a close-fitting sleeve, and fit the termite collar or other treatment, before the steel goes in.',
      flag: 'V', src: 'abcb42',
      build(kit) {
        const { THREE, C, mat, cyl, flat, face } = kit, g = new THREE.Group();
        const sand = mat(0xffffff, { tex: 'sand' }), mm = mat(C.membrane, { side: THREE.DoubleSide });
        const a = flat(0.5, 0.34, sand, -1.4, 0.056, 9.4); a.rotation.z = 0.5; g.add(a);
        const b = flat(0.3, 0.42, sand, -1.35, 0.0565, 9.45); b.rotation.z = -0.3; g.add(b);
        g.add(face([[-1.65, 0.056, 9.25], [-1.35, 0.056, 9.15], [-1.55, 0.16, 9.02]], mm));
        g.add(cyl(0.055, 0.32, mat(C.sewer), -1.4, 0.16, 9.4, 14), cyl(0.066, 0.03, mat(0xf5f5f5), -1.4, 0.335, 9.4, 14));
        return g;
      } },
    { id: '2-mesh-on-membrane', phase: 4, title: 'Mesh lying on the membrane, no bar chairs', pos: [2.7, 0.08, 8.7], r: 0.3, box: [[0.6, 0, 7.4], [4.8, 0.2, 10.0]],
      hint: 'Compare the slab mesh across the front panels. Is it held up everywhere?',
      explain: 'One sheet of mesh has no bar chairs and lies flat on the membrane. It will end up at the bottom of the slab with too little cover, where it can rust and does little to control cracking.',
      fix: 'Support the mesh on bar chairs at no more than 800 mm centres so it sits at the cover shown on the engineer\'s drawings.',
      flag: 'V', src: 'abcb42', hide: ['reo'],
      build(kit) {   // the reinforcement from step-02.js, with one sheet left lying on the membrane
        const { THREE, C, mat, cyl, rod, textPlane } = kit, g = new THREE.Group();
        const X0 = -5.5, X1 = 5.5, Z0 = -5.5, Z1 = 11.5, CZ = 3, DZ = 17, R = { x0: 0.6, x1: 4.8, z0: 7.4, z1: 10.0 }, RAMP = 0.35, LOW = 0.0575;
        const rebar = mat(C.rebar, { metalness: 0.45, roughness: 0.5 }), bars = [], ramps = [];
        for (let z = Z0 + 0.15; z <= Z1 - 0.1; z += 0.2) {
          const y = 0.086, a = X0 + 0.15, b = X1 - 0.15;
          if (z < R.z0 || z > R.z1) { bars.push([0, y, z, b - a, 0.008, 0.008]); continue; }
          const p = R.x0 - RAMP, q = R.x1 + RAMP;
          bars.push([(a + p) / 2, y, z, p - a, 0.008, 0.008], [(R.x0 + R.x1) / 2, LOW, z, R.x1 - R.x0, 0.008, 0.008], [(q + b) / 2, y, z, b - q, 0.008, 0.008]);
          ramps.push([[p, y, z], [R.x0, LOW, z]], [[R.x1, LOW, z], [q, y, z]]);
        }
        for (let x = X0 + 0.15; x <= X1 - 0.1; x += 0.2) {
          const y = 0.094, lo = LOW + 0.008, a = Z0 + 0.15, b = Z1 - 0.15;
          if (x < R.x0 || x > R.x1) { bars.push([x, y, CZ, 0.008, 0.008, DZ - 0.3]); continue; }
          const p = R.z0 - RAMP, q = R.z1 + RAMP;
          bars.push([x, y, (a + p) / 2, 0.008, 0.008, p - a], [x, lo, (R.z0 + R.z1) / 2, 0.008, 0.008, R.z1 - R.z0], [x, y, (q + b) / 2, 0.008, 0.008, b - q]);
          ramps.push([[x, y, p], [x, lo, R.z0]], [[x, lo, R.z1], [x, y, q]]);
        }
        g.add(instBoxes(kit, rebar, bars));
        for (const [a, b] of ramps) g.add(rod(a, b, 0.004, rebar, 4));
        const ISL = [[-5.2, -0.15], [0.15, 5.2]].flatMap(([a, b]) => [[-5.2, -0.15], [0.15, 5.35], [5.65, 11.2]].map(([c, d]) => [a, b, c, d])), chairs = [];
        for (let x = -4.8; x <= 4.9; x += 0.8) for (let z = -4.8; z <= 11.3; z += 0.8) {
          if (x > R.x0 - 0.1 && x < R.x1 + 0.1 && z > R.z0 - 0.1 && z < R.z1 + 0.1) continue;
          if (ISL.some(([a, b, c, d]) => x > a + 0.05 && x < b - 0.05 && z > c + 0.05 && z < d - 0.05)) chairs.push([x, 0.066, z, 0.04, 0.03, 0.04]);
        }
        const chairM = mat(0xcc4a2a);
        g.add(instBoxes(kit, chairM, chairs));
        for (let i = 0; i < 14; i++) {   // the chairs for this sheet, still in a heap at its edge
          const c = kit.box(0.04, 0.03, 0.04, chairM, 4.95 + Math.sin(i * 2.4) * 0.11, 0.07 + (i % 3) * 0.022, 10.25 + Math.cos(i * 1.7) * 0.11);
          c.rotation.set(i * 0.7, i * 1.3, i * 0.4); g.add(c);
        }
        const BEAMS = [[X0, X1, Z0, Z0 + 0.3], [X0, X1, Z1 - 0.3, Z1], [X0, X0 + 0.3, Z0 + 0.3, Z1 - 0.3], [X1 - 0.3, X1, Z0 + 0.3, Z1 - 0.3], [-0.15, 0.15, Z0 + 0.3, Z1 - 0.3],
          [X0 + 0.3, -0.15, -0.15, 0.15], [0.15, X1 - 0.3, -0.15, 0.15], [X0 + 0.3, -0.15, 5.35, 5.65], [0.15, X1 - 0.3, 5.35, 5.65]];
        for (const [a, b, c, d] of BEAMS) {
          const alongX = b - a >= d - c, len = (alongX ? b - a : d - c) - 0.1, cx = (a + b) / 2, cz = (c + d) / 2;
          for (const [y, offs] of [[-0.21, [-0.09, 0, 0.09]], [0.1, [-0.06, 0.06]]]) for (const o of offs) {
            g.add(alongX ? rod([cx - len / 2, y, cz + o], [cx + len / 2, y, cz + o], 0.006, rebar) : rod([cx + o, y, cz - len / 2], [cx + o, y, cz + len / 2], 0.006, rebar));
          }
        }
        const sign = textPlane(['STOP: HOLD POINT', 'Reinforcement inspection', 'No concrete until signed off'], 1.8, 0.9);
        sign.position.set(0, 1.5, Z1 + 1.3); g.add(sign);
        g.add(cyl(0.04, 1.6, mat(C.steel), -0.8, 0.8, Z1 + 1.28, 8), cyl(0.04, 1.6, mat(C.steel), 0.8, 0.8, Z1 + 1.28, 8));
        return g;
      } },
    { id: '2-pour-early', phase: 4, title: 'Concrete placed before the hold point', pos: [-4.3, 0.15, 10.0], r: 0.3, box: [[-5.6, 0, 8.5], [-3.0, 0.4, 11.6]],
      hint: 'Read the sign at the front, then look at the corners of the slab.',
      explain: 'A corner of the slab has been poured while the reinforcement hold point is still in place. The steel under it can no longer be inspected, and the work has gone past a notified inspection stage.',
      fix: 'Notify the building surveyor at the stage, wait for the inspection to pass, and only then order and place the concrete.',
      flag: 'V', src: 'vbaMand',
      build(kit) {
        const { THREE, mat, box, cyl, rod } = kit, g = new THREE.Group(), wet = mat(0x7b7e82, { roughness: 0.55 });
        g.add(box(2.3, 0.14, 2.75, wet, -4.35, 0.08, 10.1), box(2.7, 0.05, 3.1, mat(0x85888c, { roughness: 0.6 }), -4.2, 0.06, 9.95));
        const steel = mat(0x59616b, { metalness: 0.5, roughness: 0.4 });
        g.add(box(0.6, 0.25, 0.85, mat(0x2f6f9f), -2.4, 0.5, 12.5), box(0.5, 0.04, 0.7, wet, -2.4, 0.61, 12.5));
        const wheel = cyl(0.18, 0.08, mat(0x1b1d20), -2.4, 0.18, 13.05, 14); wheel.rotation.z = Math.PI / 2; g.add(wheel);
        g.add(rod([-2.65, 0.45, 12.1], [-2.7, 0.6, 11.6], 0.02, steel), rod([-2.15, 0.45, 12.1], [-2.1, 0.6, 11.6], 0.02, steel));
        const drum = cyl(1.0, 4, mat(0xdadcde), -6, 2.1, 23.4, 20); drum.rotation.z = Math.PI / 2; g.add(drum);
        g.add(box(6.6, 0.9, 2.5, mat(0x3c4a5c), -6.5, 0.8, 23.4), box(2, 1.6, 2.4, mat(0x3c4a5c), -2.6, 1.3, 23.4));
        return g;
      } },
    { id: '2-load-curing', phase: 6, title: 'Bricks stacked on the slab while it cures', pos: [2.4, 0.6, 8.0], r: 1.4,
      hint: 'Read the curing sign, then look at what is sitting on the new slab.',
      explain: 'Pallets of bricks have been landed on the slab during the curing period. Heavy loads on young concrete can crack it before it has gained strength.',
      fix: 'Keep stacked loads and plant off the slab for at least 7 days after the pour, and keep it moist the whole time.',
      flag: 'V', src: 'abcb42',
      build(kit) {
        const { THREE, mat, box } = kit, g = new THREE.Group(), tim = mat(0xffffff, { tex: 'timber' }), br = mat(0xffffff, { tex: 'brick' });
        for (const [x, z, r] of [[1.7, 7.8, 0.12], [3.1, 8.2, -0.1]]) {
          const p = new THREE.Group(); p.add(box(1.2, 0.12, 1.1, tim, 0, 0.06, 0), box(1.1, 0.7, 1.0, br, 0, 0.47, 0));
          p.position.set(x, 0.15, z); p.rotation.y = r; g.add(p);
        }
        return g;
      } },
  ],

  /* ---------- Stage 3: wall framing ---------- */
  3: [
    { id: '3-timber-ground', phase: 0, title: 'Frame timber dumped on wet ground', pos: [0.6, 0.25, 13.3], r: 1.6,
      hint: 'Check where every pack of timber has been put down.',
      explain: 'A pack of studs sits straight on wet ground with no bearers and no cover. The bottom lengths soak up water and can bow, twist or swell before they are used.',
      fix: 'Stack timber on level bearers clear of the ground, keep it covered, and set aside any lengths that are wet or out of shape.',
      flag: 'T', src: '',
      build(kit) {
        const { THREE, mat, box, cyl, flat } = kit, g = new THREE.Group();
        g.add(flat(3.9, 1.6, mat(0x5e4630, { roughness: 1 }), 0.6, 0.008, 13.35));
        g.add(cyl(0.55, 0.004, water(kit), -0.75, 0.012, 13.9, 20), cyl(0.4, 0.004, water(kit), 2.05, 0.012, 12.75, 20));
        g.add(box(3.2, 0.42, 0.95, mat(0xffffff, { tex: 'timber' }), 0.6, 0.21, 13.3));
        for (const x of [-0.4, 1.6]) g.add(box(0.025, 0.44, 0.97, mat(0xe8590c), x, 0.21, 13.3));
        return g;
      } },
    { id: '3-prop-down', phase: 3, title: 'Temporary prop knocked out', pos: [-3.8, 0.3, 9.8], r: 1.4,
      hint: 'Walk along the front wall and check what holds every part of it upright.',
      explain: 'A temporary prop has been knocked off the front wall and left lying on the slab. That end of the wall can lean or blow over before the permanent bracing and roof are in.',
      fix: 'Re-fix the prop to the frame and to the slab or a stake, and check every prop at the start and end of each day and after strong wind.',
      flag: 'T', src: '',
      build(kit) {
        const { THREE, mat, rod } = kit, g = new THREE.Group(), ply = mat(0xffffff, { tex: 'timber', color: 0xe8c690 });
        g.add(rod([-3.0, 0.18, 10.9], [-4.6, 0.18, 8.6], 0.022, ply), rod([-4.2, 0.18, 9.05], [-4.5, 0.18, 9.4], 0.025, ply));
        return g;
      } },
    { id: '3-strap-cut', phase: 4, title: 'Bracing strap cut for a cable', pos: [5.25, 1.3, 1.5], r: 0.3, box: [[5.1, 0.15, 0.4], [5.4, 2.85, 2.6]],
      hint: 'Look at the steel strap bracing on the east wall, from inside the house.',
      explain: 'A strap brace has been cut to run a cable past it. A cut strap carries no load, so that bracing wall no longer resists wind racking as designed.',
      fix: 'Replace the strap in one length, tension and fix it as detailed, and route the cable around it.',
      flag: 'T', src: '',
      build(kit) {
        const { THREE, mat, rod } = kit, g = new THREE.Group(), steel = mat(0xb8c0c9, { metalness: 0.6, roughness: 0.35 }), x = 5.25;
        g.add(rod([x, 0.2, 0.55], [x, 0.75, 0.95], 0.011, steel), rod([x, 0.75, 0.95], [x - 0.02, 0.95, 1.2], 0.011, steel));          // lower piece, slack
        g.add(rod([x, 2.82, 2.45], [x - 0.01, 2.0, 2.32], 0.011, steel), rod([x - 0.01, 2.0, 2.32], [x - 0.05, 1.5, 2.4], 0.011, steel));  // upper piece, hanging
        g.add(rod([x - 0.02, 1.25, 0.3], [x - 0.02, 1.25, 2.7], 0.008, mat(0xf2f2ee)));                                             // the cable
        return g;
      } },
    { id: '3-notched-studs', phase: 5, title: 'Studs notched too deep for a pipe', pos: [0, 0.75, 5.52], r: 0.3, box: [[-1.4, 0.55, 5.4], [1.4, 1.1, 5.65]],
      hint: 'Check the studs where services pass through the internal walls.',
      explain: 'Six studs in the wall across the middle of the house have been notched most of the way through to fit a waste pipe. A deep notch cuts a stud\'s strength, and AS 1684 limits the size and position of notches and holes.',
      fix: 'Keep notches and holes within the AS 1684 limits or the engineer\'s detail, or run the pipe another way, and replace or reinforce any stud cut too far.',
      flag: 'C', src: '',
      build(kit) {
        const { THREE, mat, box, pipe } = kit, g = new THREE.Group(), dark = mat(0x2a1d12, { roughness: 1 }), y = 0.75, z = 5.515;
        for (const x of [-1.063, -0.613, -0.163, 0.287, 0.737, 1.187]) g.add(box(0.047, 0.075, 0.062, dark, x, y, z));
        g.add(pipe([[-1.35, 0.15, z], [-1.35, y, z], [1.35, y, z], [1.35, 1.05, z]], 0.025, mat(0xd7d9dd)));
        return g;
      } },
  ],

  /* ---------- Stage 4: roof framing ---------- */
  4: [
    { id: '4-under-load', phase: 1, title: 'Worker standing under the suspended truss', pos: [1.5, 1.0, 10.75], r: 1.2,
      hint: 'Look at who is near the load on the crane hook.',
      explain: 'A worker is standing on the slab directly under the truss hanging from the crane. If a sling or the truss fails, the load falls on them.',
      fix: 'Keep everyone out of the area under and around the load, and steady the truss with tag lines from outside the drop zone.',
      flag: 'T', src: '',
      build(kit) { return worker(kit, 1.5, 0.15, 10.75, 0, true); } },
    { id: '4-top-plate', phase: 2, title: 'Walking the wall plates with no edge protection', pos: [5.3, 3.8, 6.35], r: 1.2,
      hint: 'Look at how the crew gets around up at plate height.',
      explain: 'A carpenter is walking along the top plate nearly 3 m above the ground with no scaffold, edge protection or platform. A fall from this height can kill.',
      fix: 'Plan the roof framing with edge protection, a scaffold or a mobile work platform, so nobody has to stand on the wall plates.',
      flag: 'T', src: '',
      build(kit) { return worker(kit, 5.3, PLATE_TOP, 6.35, 0); } },
    { id: '4-nail-plate', phase: 3, title: 'Truss nail plate knocked loose', pos: [1.8, 2.9, 11.38], r: 0.9,
      hint: 'Look closely at the joints of the front truss.',
      explain: 'A nail plate is hanging off a bottom chord joint of the front truss and the chord beside it has split. The joint can no longer carry its design load.',
      fix: 'Do not hammer the plate back. Get a written repair detail from the truss manufacturer, or replace the truss.',
      flag: 'T', src: '',
      build(kit) {
        const { THREE, mat, box } = kit, g = new THREE.Group(), bx = HS / 3, by = PLATE_TOP + 0.045;
        const hinge = new THREE.Group(); hinge.position.set(bx - 0.11, by, 11.33); hinge.rotation.y = -0.75;
        hinge.add(box(0.22, 0.2, 0.004, mat(0xc8d0d8, { metalness: 0.7, roughness: 0.35 }), 0.11, 0, 0)); g.add(hinge);
        g.add(box(0.4, 0.008, 0.038, mat(0x1b1d20), bx + 0.25, by + 0.005, 11.305));
        return g;
      } },
    { id: '4-tile-heap', phase: 4, title: 'Roof tiles landed in one heap', pos: [2.7, 4.35, 4.1], r: 1.4,
      hint: 'Look at what has been loaded onto the new battens.',
      explain: 'Pallets of roof tiles have been landed in one heap on the battens at mid-span. The trusses are designed for the tile load spread over the roof, so a heap like this can overload and bend them.',
      fix: 'Load tiles in small stacks spread evenly over the roof, close to the supports, as the truss maker and tiler direct.',
      flag: 'T', src: '',
      build(kit) {
        const { THREE, mat, box } = kit, g = new THREE.Group(), tm = mat(0x74808d, { tex: 'roofTile' }), h = 0.45, x = 2.6;
        const sy = PLATE_TOP + yc(x) + 0.0925, cx = x + (h / 2) * Math.sin(PITCH), cy = sy + (h / 2) * Math.cos(PITCH);
        for (const z of [3.55, 4.6]) { const s = box(1.0, h, 0.95, tm, cx, cy, z); s.rotation.z = -PITCH; g.add(s); }
        return g;
      } },
    { id: '4-lining-early', phase: 5, title: 'Plasterboard fixed before the frame inspection', pos: [2.55, 1.4, 11.23], r: 0.3, box: [[1.9, 0.15, 8.9], [4.3, 2.7, 11.3]],
      hint: 'Read the hold point sign, then look through the front wall frame.',
      explain: 'Plasterboard is going up on the walls while the frame inspection hold point is still in place. It hides the bracing, tie-down and fixings the building surveyor has to see.',
      fix: 'Notify the building surveyor at frame stage and do not line or clad the walls until the frame inspection has passed.',
      flag: 'V', src: 'vbaMand',
      build(kit) {
        const { THREE, mat, box } = kit, g = new THREE.Group(), pb = mat(0xf1f0ea, { roughness: 0.9 });
        g.add(box(1.09, 2.4, 0.01, pb, 2.555, 1.4, 11.232), box(1.2, 0.25, 2.4, pb, 3.6, 0.275, 9.6));
        return g;
      } },
  ],

  /* ---------- Stage 5: roof cladding and stormwater ---------- */
  5: [
    { id: '5-guardrail', phase: 0, title: 'Scaffold guardrails missing', pos: [6.95, 2.6, 9.0], r: 0.3, box: [[6.7, 1.9, 6.5], [7.2, 3.1, 11.6]],
      hint: 'Walk the east scaffold and check every open edge of the platform.',
      explain: 'The guardrails and toe board stop two bays short of the front of the east scaffold. Anyone working at that end of the eave can fall off the open edge.',
      fix: 'Keep a top rail, mid rail and toe board on every open side of the platform, and have the scaffolder put them back before anyone works there.',
      flag: 'T', src: '', hide: ['scaffold'],
      build(kit) {   // the scaffold from step-05.js, with the east rails cut short
        const { THREE, mat, box, rod } = kit, g = new THREE.Group(), steel = mat(0xc7ccd3, { metalness: 0.6, roughness: 0.4 }), plank = mat(0xffffff, { tex: 'timber' });
        const ZB = -5.305, ZF = 11.305, GAP = 6.5;
        for (const sg of [-1, 1]) {
          const z0 = ZB - 0.2, z1 = sg < 0 ? 9.6 : ZF + 0.2, len = z1 - z0, zc = (z0 + z1) / 2, zr = sg > 0 ? GAP : z1;
          for (let z = z0; z <= z1 + 0.01; z += 2.4) for (const dx of [6.05, 6.95]) g.add(rod([sg * dx, 0, z], [sg * dx, 3.6, z], 0.024, steel, 6));
          g.add(box(0.9, 0.05, len, plank, sg * 6.5, 1.95, zc), box(0.03, 0.15, zr - z0, plank, sg * 6.95, 2.03, (z0 + zr) / 2));
          g.add(rod([sg * 6.95, 1.9, z0], [sg * 6.95, 1.9, z1], 0.02, steel, 6), rod([sg * 6.05, 1.9, z0], [sg * 6.05, 1.9, z1], 0.02, steel, 6));
          for (const y of [2.45, 2.95]) g.add(rod([sg * 6.95, y, z0], [sg * 6.95, y, zr], 0.02, steel, 6));
        }
        return g;
      } },
    { id: '5-tile-gap', phase: 1, title: 'Broken tiles leave a hole in the roof', pos: [3.0, ty(3.0) + 0.05, 7.95], r: 1.0,
      hint: 'Scan the finished tiles on the east slope.',
      explain: 'Two tiles near the front of the east slope are cracked and have slid out of place, leaving a gap down to the battens. Rain will run onto the sarking and can get into the roof space.',
      fix: 'Replace broken tiles with sound ones, fixed as the tile maker and AS 2050 require, and check the roof is complete before the scaffold comes down.',
      flag: 'T', src: '',
      build(kit) {
        const { THREE, mat, box, face } = kit, g = new THREE.Group(), xa = 2.75, xb = 3.08, za = 7.6, zb = 8.25, e = 0.012;
        g.add(face([[xa, ty(xa) + e, za], [xb, ty(xb) + e, za], [xb, ty(xb) + e, zb], [xa, ty(xa) + e, zb]], mat(0x24282d, { side: THREE.DoubleSide })));
        const bt = box(0.06, 0.03, zb - za, mat(0xffffff, { tex: 'timber' }), 2.92, ty(2.92) + 0.02, (za + zb) / 2); bt.rotation.z = -PITCH; g.add(bt);
        const tm = mat(0x74808d, { tex: 'roofTile' });
        for (const [x, z, yaw] of [[3.45, 7.75, 0.4], [3.75, 8.2, -0.5]]) { const t = box(0.24, 0.03, 0.3, tm, x, ty(x) + 0.03, z); t.rotation.set(0, yaw, -PITCH); g.add(t); }
        return g;
      } },
    { id: '5-vent-sealant', phase: 2, title: 'Roof vent sealed with silicone, no flashing', pos: [2.0, ty(2.0) + 0.15, 4.0], r: 1.0,
      hint: 'Look where the plumbing vent passes through the roof.',
      explain: 'The vent pipe has been pushed through the tiles and sealed with a blob of silicone instead of a flashing. Sealant cracks in the sun, and water then runs down the pipe into the roof.',
      fix: 'Fit a flashing made for the pipe size and tile profile, lapped over the tiles below and under the tiles above, with sealant only where the maker shows it.',
      flag: 'T', src: '', hide: ['flash'],
      build(kit) {
        const { THREE, C, mat, rod, cyl, box } = kit, g = new THREE.Group(), vx = 2.0, vz = 4.0, vy = ty(vx), seal = mat(0xf4f4f0, { roughness: 0.6 });
        g.add(rod([vx, vy - 0.2, vz], [vx, vy + 0.55, vz], 0.05, mat(C.pvc), 14));
        const blob = cyl(0.17, 0.07, seal, vx, vy + 0.01, vz, 18, false, 0.065); blob.rotation.z = -PITCH; g.add(blob);
        for (const [dx, dz, yaw, w] of [[0.18, 0.1, 0.5, 0.28], [-0.12, -0.16, -0.7, 0.22]]) { const s = box(w, 0.012, 0.06, seal, vx + dx, ty(vx + dx) + 0.008, vz + dz); s.rotation.set(0, yaw, -PITCH); g.add(s); }
        return g;
      } },
    { id: '5-downpipe-loose', phase: 4, title: 'Downpipe not connected to the stormwater', pos: [5.95, 0.3, 10.9], r: 1.2,
      hint: 'Follow each downpipe to where its water goes.',
      explain: 'The front-east downpipe stops above the ground and the stormwater pipe beside it is capped off. Roof water pours out at the slab edge and can soften the ground under the footings.',
      fix: 'Connect every downpipe through a pit or riser to the stormwater drain, which runs to the legal point of discharge.',
      flag: 'T', src: '', hide: ['storm'],
      build(kit) {   // the stormwater from step-05.js, without the front-east connection
        const { THREE, C, mat, box, cyl, rod, pipe, textPlane } = kit, g = new THREE.Group();
        const conc = mat(0xffffff, { tex: 'concrete' }), dark = mat(0x2f3640, { metalness: 0.5, roughness: 0.45 }), pvc = mat(0x2f7fd6, { transparent: true, opacity: 0.78, roughness: 0.4 });
        const W = -6.3, E = 6.3, REAR = -6.5, KERB = 20.3;
        for (const sg of [-1, 1]) for (const z of [-4.9, 10.9]) {
          if (sg > 0 && z > 0) continue;
          g.add(box(0.45, 0.12, 0.45, conc, sg * DP_X, 0.06, z), box(0.32, 0.02, 0.32, dark, sg * DP_X, 0.125, z), rod([sg * DP_X, 0.04, z], [sg * E, 0.04, z], 0.05, pvc, 10));
        }
        g.add(pipe([[E, 0.04, 10.9], [E, 0.04, REAR], [W, 0.04, REAR], [W, 0.04, KERB]], 0.05, pvc));
        const cap = cyl(0.06, 0.03, mat(0xf1efe9), E, 0.04, 10.92, 14); cap.rotation.x = Math.PI / 2; g.add(cap);
        g.add(box(0.5, 0.06, 0.5, conc, W, 0.03, REAR), box(0.3, 0.02, 0.3, dark, W, 0.07, REAR), box(0.5, 0.06, 0.5, conc, W, 0.03, 17.2), box(0.3, 0.02, 0.3, dark, W, 0.07, 17.2));
        const lp = textPlane(['LPOD', 'Legal point of discharge', 'Set by the council report'], 1.4, 0.7);
        lp.material.side = THREE.DoubleSide; lp.position.set(W, 1.45, 19.74);
        g.add(cyl(0.04, 1.5, mat(C.orange), W, 0.75, 19.7, 8), lp, box(0.14, 0.1, 0.12, dark, W, 0.07, 20.4));
        for (const z of [3, 14]) g.add(rod([W, 0.12, z], [W, 0.12, z + 0.5], 0.012, mat(C.orange)));
        g.add(cyl(0.75, 0.004, mat(0x5a4330, { roughness: 1 }), DP_X + 0.2, 0.007, 10.9, 24), cyl(0.5, 0.004, water(kit), DP_X + 0.15, 0.011, 10.85, 24));
        g.add(cyl(0.022, 0.15, water(kit), DP_X, 0.075, 10.9, 8));
        return g;
      } },
    { id: '5-gutter-leak', phase: 5, title: 'Gutter joint leaking in the water test', pos: [5.9, 1.3, 6.6], r: 0.3, box: [[5.6, 0, 6.3], [6.2, 2.75, 6.9]],
      hint: 'Watch the gutters while they are being water tested.',
      explain: 'Water poured into the east gutter is running out of a joint halfway along. The joint was not lapped and sealed properly, so it will drip down the wall in every storm.',
      fix: 'Lap gutter joints in the direction of flow, rivet and seal them with the maker\'s sealant, and repeat the water test until nothing leaks.',
      flag: 'T', src: '',
      build(kit) {
        const { THREE, mat, box, cyl } = kit, g = new THREE.Group(), x = DP_X, z = 6.6, wm = water(kit);
        g.add(box(0.13, 0.1, 0.035, mat(0x1b1d20, { roughness: 0.5 }), x, G_BOT + 0.045, z), cyl(0.02, G_BOT - 0.02, wm, x + 0.02, G_BOT / 2, z, 8));
        for (const y of [0.6, 1.3, 1.9]) { const d = new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 6), wm); d.position.set(x + 0.03, y, z + 0.04); g.add(d); }
        g.add(cyl(0.55, 0.004, mat(0x4a3d30, { roughness: 1 }), x + 0.05, 0.007, z, 24), cyl(0.32, 0.004, wm, x + 0.05, 0.011, z, 24));
        return g;
      } },
  ],

  /* ---------- Stage 6: external walls ---------- */
  6: [
    { id: '6-wrap-torn', phase: 0, title: 'Wall wrap torn and hanging loose', pos: [2.55, 1.3, 11.4], r: 1.0,
      hint: 'Look over the wall wrap across the front of the house.',
      explain: 'A piece of wall wrap has been ripped and hangs off the frame. Water that gets behind the bricks will reach the studs here instead of running down the wrap to the weepholes.',
      fix: 'Patch or replace the torn wrap, lapped with the upper sheet over the lower and taped, before any bricks go up.',
      flag: 'T', src: '',
      build(kit) {
        const { THREE, mat, box } = kit, g = new THREE.Group(), zf = 11.367;
        const foil = mat(0xb4bcc6, { metalness: 0.2, roughness: 0.5, side: THREE.DoubleSide });
        g.add(box(0.72, 0.7, 0.002, mat(0x1d2126), 2.56, 1.3, zf), box(0.045, 0.7, 0.004, mat(0xffffff, { tex: 'timber' }), 2.582, 1.3, zf + 0.002));
        const flap = new THREE.Group(); flap.position.set(2.56, 1.65, zf + 0.004); flap.rotation.x = -0.6; flap.add(box(0.72, 0.62, 0.003, foil, 0, -0.31, 0)); g.add(flap);
        const side = new THREE.Group(); side.position.set(2.2, 1.3, zf + 0.004); side.rotation.y = 0.9; side.add(box(0.25, 0.6, 0.003, foil, -0.125, 0, 0)); g.add(side);
        return g;
      } },
    { id: '6-brick-overhang', phase: 1, title: 'First course overhangs the slab edge', pos: [3.75, 0.2, 11.56], r: 0.35, box: [[2.0, 0.1, 11.4], [5.5, 0.3, 11.6]],
      hint: 'Sight along the first course where it meets the slab edge.',
      explain: 'East of the front door the first course has been laid about 60 mm out past the slab edge. The outer leaf may overhang the slab by no more than 15 mm, or the bricks lose their bearing.',
      fix: 'Take up and relay the course so its face sits no more than 15 mm past the slab edge, on a continuous DPC.',
      flag: 'V', src: 'nccMas57',
      build(kit) {
        const { THREE, mat, box } = kit, g = new THREE.Group(), h = 0.086;
        g.add(box(3.5, h, 0.17, mat(0xffffff, { tex: 'brick' }), 3.75, YK(0) + h / 2, 11.475));
        for (const x of [2.26, 3.73, 5.2]) g.add(box(0.012, 0.05, 0.035, mat(0x16181b, { roughness: 0.6 }), x, YK(0) + 0.037, 11.545));
        return g;
      } },
    { id: '6-mortar-bridge', phase: 2, title: 'Mortar bridging the cavity', pos: [-0.75, 1.14, 11.43], r: 1.0,
      hint: 'Look along the top of the front wall as it goes up, where the bricks meet the wrap.',
      explain: 'Mortar has been dropped on the course and pushed across the cavity onto the wall wrap. A bridge like this carries water from the bricks to the frame, and droppings build up and block the weepholes.',
      fix: 'Keep the cavity clear as the wall goes up: clean off droppings each day and leave at least 25 mm clear between the bricks and the frame.',
      flag: 'V', src: 'nccMas57',
      build(kit) {
        const { THREE, mat, box } = kit, g = new THREE.Group(), m = mat(0x8a877f, { tex: 'concrete', bump: 1.4 }), top = YK(11);
        for (const [x, w, h, z0] of [[-1.05, 0.34, 0.07, 11.355], [-0.7, 0.26, 0.09, 11.35], [-0.42, 0.22, 0.06, 11.37]]) g.add(box(w, h, 11.49 - z0, m, x, top + h / 2, (z0 + 11.49) / 2));
        g.add(box(0.2, 0.25, 0.02, m, -0.75, top - 0.05, 11.372));
        return g;
      } },
    { id: '6-joint-mortar', phase: 4, title: 'Articulation joint packed with mortar', pos: [2.6, 1.2, 11.51], r: 0.35, box: [[2.5, 0.35, 11.45], [2.7, 2.1, 11.56]],
      hint: 'Follow each vertical movement joint on the front wall from bottom to top.',
      explain: 'The movement joint between the front door and the window has been filled with hard mortar for most of its height. A packed joint cannot close up, so the brickwork beside it will crack as the wall and slab move.',
      fix: 'Rake the mortar out so the joint is clear for its full height, at least 10 mm wide, and fill it with a flexible sealant.',
      flag: 'C', src: 'nccMas56',
      build(kit) {
        const { THREE, mat, box } = kit, g = new THREE.Group(), m = mat(0x9c9a94, { tex: 'concrete', bump: 1.2 }), y0 = YK(3), y1 = YK(22);
        g.add(box(0.034, y1 - y0, 0.014, m, 2.6, (y0 + y1) / 2, 11.505));
        for (let k = 4; k < 22; k += 3) g.add(box(0.06 + (k % 2) * 0.02, 0.07, 0.01, m, 2.6 + ((k % 3) - 1) * 0.01, YK(k) + 0.04, 11.509));
        return g;
      } },
    { id: '6-weep-mortar', phase: 5, title: 'Weepholes blocked with mortar', pos: [-1.2, 0.2, 11.56], r: 1.2,
      hint: 'Look along the bottom course of the front wall, just above the slab edge.',
      explain: 'Mortar has been smeared over the open joints in the first course. Water that gets into the cavity can no longer drain out, so it sits on the damp-proof course and can wet the frame.',
      fix: 'Open perpend joints at no more than 1.2 m centres in the course just above the DPC, kept clear of mortar droppings.',
      flag: 'V', src: 'nccMas57',
      build(kit) {
        const { THREE, mat, box } = kit, g = new THREE.Group(), m = mat(0x9c9a94, { tex: 'concrete', bump: 1.2 });
        for (const x of [-3.6, -2.4, -1.2, 0, 2.6]) g.add(box(0.16, 0.07, 0.035, m, x, 0.2, 11.57));
        return g;
      } },
  ],
};

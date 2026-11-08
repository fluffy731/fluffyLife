// The shared suburban block that both steps build on. Block is 15 m x 35 m, street at +z.
// All dimensions are illustrative; real setbacks come from the planning permit and endorsed plans.
export const BLOCK = { x0: -7.5, x1: 7.5, z0: -17.5, z1: 17.5 };
export const HOUSE = { x0: -5.5, x1: 5.5, z0: -5.5, z1: 11.5 }; // slab footprint: 11 m x 17 m
// Solid boxes the walker cannot enter: the three neighbouring houses (same numbers as buildBase).
export const BASE_COLLIDERS = [
  { x0: -18.95, x1: -9.45, z0: 0.75, z1: 13.25 },
  { x0: 9.45, x1: 18.95, z0: -3.5, z1: 10.5 },
  { x0: -18.95, x1: -9.45, z0: -15.25, z1: -2.75 },
];

function neighbourHouse(kit, w, d, x, z) {
  const { THREE, C, mat, box } = kit;
  const g = new THREE.Group();
  g.add(box(w, 2.7, d, mat(C.wall), x, 1.35, z));
  const roof = new THREE.Mesh(new THREE.ConeGeometry(1, 1.7, 4), mat(C.roof));
  roof.geometry.rotateY(Math.PI / 4);
  roof.scale.set((w / Math.SQRT2) * 1.12, 1, (d / Math.SQRT2) * 1.12);
  roof.position.set(x, 2.7 + 0.85, z);
  roof.castShadow = true;
  g.add(roof);
  g.add(box(w * 0.9, 0.25, 0.2, mat(0x8a8f96), x, 0.35, z + d / 2));
  return g;
}

function tree(kit, x, z, s = 1) {
  const { THREE, C, mat, cyl } = kit;
  const g = new THREE.Group();
  g.add(cyl(0.18 * s, 2.2 * s, mat(C.trunk), x, 1.1 * s, z, 8));
  const leaf = mat(C.leaf, { flatShading: true });
  for (const [dx, dy, dz, r] of [[0, 3.1, 0, 1.5], [0.8, 2.6, 0.4, 1.0], [-0.7, 2.7, -0.3, 1.1]]) {
    const m = new THREE.Mesh(new THREE.IcosahedronGeometry(r * s, 1), leaf);
    m.position.set(x + dx * s, dy * s, z + dz * s);
    m.castShadow = true;
    g.add(m);
  }
  return g;
}

// ground, lawn, street, neighbours, trees, power pole. `pit` cuts a hole in the ground for the slab excavation.
export function buildBase(kit, { pit = null } = {}) {
  const { THREE, C, mat, box, cyl, flat, rectWithHoles } = kit;
  const g = new THREE.Group();
  g.name = 'base';
  const holes = pit ? [pit] : [];
  g.add(rectWithHoles(-120, 120, -120, 120, holes, mat(C.grass)));
  g.add(rectWithHoles(BLOCK.x0, BLOCK.x1, BLOCK.z0, BLOCK.z1, holes, mat(C.lawn), 0.004));
  g.add(flat(240, 7.5, mat(C.asphalt), 0, 0.004, 24.25));
  g.add(box(240, 0.14, 0.22, mat(C.kerb), 0, 0.07, 20.5));
  g.add(flat(240, 1.5, mat(C.path), 0, 0.003, 18.9));
  for (let x = -60; x <= 60; x += 6) g.add(flat(2.4, 0.15, mat(0xe9e9e9), x, 0.006, 24.4));
  const bm = mat(0xffffff);
  for (const [w, d, x, z] of [[15, 0.06, 0, BLOCK.z1], [15, 0.06, 0, BLOCK.z0], [0.06, 35, BLOCK.x0, 0], [0.06, 35, BLOCK.x1, 0]]) g.add(flat(w || 0.06, d, bm, x, 0.02, z));
  g.add(neighbourHouse(kit, 9.5, 12.5, -14.2, 7));
  g.add(neighbourHouse(kit, 9.5, 14, 14.2, 3.5));
  g.add(neighbourHouse(kit, 9.5, 12.5, -14.2, -9));
  [[-11, 14.5], [11.5, 13.5], [-12, -2], [12, -7], [-10, 19.8], [6.5, 19.8], [26, 18]].forEach(([x, z], i) => g.add(tree(kit, x, z, 0.9 + (i % 3) * 0.15)));
  g.add(cyl(0.13, 7.2, mat(0x6a5a45), 9, 3.6, 21.6, 8));
  g.add(box(1.7, 0.1, 0.1, mat(0x6a5a45), 9, 6.8, 21.6));
  return g;
}

// Temporary works from step 1, kept in step 2. Returns {fence, silt, entry, amenities, sign}.
export function buildSiteWorks(kit) {
  const { THREE, C, mat, ghost, box, cyl, textPlane } = kit;
  const mk = (name) => { const x = new THREE.Group(); x.name = name; return x; };
  const fence = mk('fence'), silt = mk('silt'), entry = mk('entry'), amenities = mk('amenities'), sign = mk('sign');
  const panel = ghost(0x9aa5b1, 0.38), post = mat(0x59616b);
  const run = (x0, z0, x1, z1) => {
    const len = Math.hypot(x1 - x0, z1 - z0), a = Math.atan2(z1 - z0, x1 - x0);
    const p = box(len, 1.8, 0.03, panel, (x0 + x1) / 2, 0.9, (z0 + z1) / 2);
    p.rotation.y = -a;
    p.castShadow = false;
    fence.add(p);
    const n = Math.max(1, Math.round(len / 2.4));
    for (let i = 0; i <= n; i++) fence.add(box(0.07, 1.85, 0.07, post, x0 + ((x1 - x0) * i) / n, 0.92, z0 + ((z1 - z0) * i) / n));
  };
  const o = 0.35, { x0, x1, z0, z1 } = BLOCK;
  run(x0 + o, z0 + o, x1 - o, z0 + o);
  run(x0 + o, z0 + o, x0 + o, z1 - o);
  run(x1 - o, z0 + o, x1 - o, z1 - o);
  run(x0 + o, z1 - o, 2.9, z1 - o);
  run(6.1, z1 - o, x1 - o, z1 - o);

  const black = mat(C.black, { transparent: true, opacity: 0.85 });
  for (const [a, b] of [[x0 + 0.1, 2.9], [6.1, x1 - 0.1]]) {
    const len = b - a;
    silt.add(box(len, 0.6, 0.02, black, (a + b) / 2, 0.3, z1 - 0.1));
    for (let x = a; x <= b + 0.01; x += 2) silt.add(cyl(0.025, 0.9, mat(C.steel), x, 0.45, z1 - 0.1, 6));
  }

  entry.add(box(3.2, 0.18, 6, mat(C.rock), 4.5, 0.09, 14.4));
  const rock = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.1, 0), mat(0x85857f, { flatShading: true }), 220);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), s = new THREE.Vector3(), t = new THREE.Vector3();
  for (let i = 0; i < 220; i++) {
    e.set(Math.random() * 6, Math.random() * 6, Math.random() * 6);
    q.setFromEuler(e); s.setScalar(0.7 + Math.random() * 0.9);
    t.set(4.5 + (Math.random() - 0.5) * 3.0, 0.2, 14.4 + (Math.random() - 0.5) * 5.8);
    rock.setMatrixAt(i, m4.compose(t, q, s));
  }
  rock.castShadow = true;
  entry.add(rock);

  amenities.add(box(1, 2.2, 1, mat(0x3a7bd5), -5.4, 1.1, 14.6));
  amenities.add(box(0.5, 1.6, 0.04, mat(0x2a5ea8), -5.4, 1.0, 15.12));
  amenities.add(box(3.2, 1.1, 1.7, mat(C.hivis), -3.2, 0.55, 14.6));
  amenities.add(box(3.4, 2.5, 2.4, mat(C.white), -5.2, 1.25, -13.2));
  amenities.add(box(1.2, 0.4, 2.4, mat(C.timber), 5.4, 0.2, -12.5));
  amenities.add(cyl(0.1, 3.2, mat(0x6a5a45), -6.6, 1.6, 10.5, 8));
  amenities.add(box(0.35, 0.45, 0.2, mat(0xcfd2d6), -6.45, 1.3, 10.5));

  sign.add(cyl(0.05, 2.2, mat(C.steel), -1.6, 1.1, 16.8, 8));
  sign.add(cyl(0.05, 2.2, mat(C.steel), 0.8, 1.1, 16.8, 8));
  const board = textPlane(['BUILDING PERMIT', 'Permit no. (displayed)', 'Builder + registration no.', 'Relevant Building Surveyor'], 2.4, 1.2);
  board.position.set(-0.4, 1.65, 16.83);
  sign.add(board);
  return { fence, silt, entry, amenities, sign };
}

// The shared suburban block that every step builds on. Block is 15 m x 35 m, street at +z.
// All dimensions are illustrative; real setbacks come from the planning permit and endorsed plans.
export const BLOCK = { x0: -7.5, x1: 7.5, z0: -17.5, z1: 17.5 };
export const HOUSE = { x0: -5.5, x1: 5.5, z0: -5.5, z1: 11.5 }; // slab footprint: 11 m x 17 m
// Solid boxes the walker cannot enter: the three neighbouring houses (same numbers as buildBase).
export const BASE_COLLIDERS = [
  { x0: -18.95, x1: -9.45, z0: 0.75, z1: 13.25 },
  { x0: 9.45, x1: 18.95, z0: -3.5, z1: 10.5 },
  { x0: -18.95, x1: -9.45, z0: -15.25, z1: -2.75 },
];
// Plan shapes for the minimap (metres). Painted in order.
export const MAP = {
  x0: -24, x1: 24, z0: -22, z1: 31,
  shapes: [
    { x0: -60, x1: 60, z0: 20.5, z1: 28, fill: '#5d6470' }, { x0: -60, x1: 60, z0: 18.15, z1: 20.5, fill: '#d3d5d8' },
    { x0: BLOCK.x0, x1: BLOCK.x1, z0: BLOCK.z0, z1: BLOCK.z1, fill: '#a9cf94', stroke: '#ffffff' },
    ...BASE_COLLIDERS.map((c) => ({ ...c, fill: '#e4ddd0', stroke: '#b8ae9c' })),
    { x0: HOUSE.x0, x1: HOUSE.x1, z0: HOUSE.z0, z1: HOUSE.z1, fill: '#f3f4f5', stroke: '#16325c', dash: true },
  ],
};

const hash = (x, y, z, s) => { const v = Math.sin(x * 12.9898 + y * 78.233 + z * 37.719 + s) * 43758.5453; return v - Math.floor(v); };

// Hip roof over a rectangle, ridge along x. Eaves at y, rise above it. Faces carry metre UVs for the tile texture.
function hip(kit, L, W, rise, over, y, m) {
  const { THREE, face } = kit, g = new THREE.Group();
  const a = L / 2 + over, b = W / 2 + over, rl = Math.max(0.01, L - W), top = y + rise;
  const A = [-a, y, b], B = [a, y, b], Cc = [a, y, -b], D = [-a, y, -b], R1 = [-rl / 2, top, 0], R2 = [rl / 2, top, 0];
  g.add(face([A, B, R2, R1], m), face([Cc, D, R1, R2], m), face([D, A, R1], m), face([B, Cc, R2], m));
  return g;
}

function glassMat(kit) { return kit.mat(0x6f8aa3, { roughness: 0.12, metalness: 0.65 }); }

function neighbourHouse(kit, w, d, x, z, style) {
  const { THREE, C, mat, box } = kit;
  const g = new THREE.Group(), h = 2.7;
  const wall = style === 'brick' ? mat(0xffffff, { tex: 'brick' }) : mat(style === 'cream' ? 0xe9e0cc : 0xdfe3e6, { tex: 'concrete', bump: 0.3 });
  g.add(box(w, h, d, wall, x, h / 2, z));
  const roof = hip(kit, Math.max(w, d), Math.min(w, d), 1.75, 0.5, h, mat(style === 'brick' ? 0xb7a89a : 0x6f7782, { tex: 'roofTile' }));
  if (d > w) roof.rotation.y = Math.PI / 2;
  roof.position.set(x, 0, z);
  g.add(roof);
  const trim = mat(0xf2f2ef), glass = glassMat(kit), dark = mat(0x3a3f46);
  // gutter and fascia lines around the eaves
  const o = 0.5; g.add(box(w + 2 * o, 0.12, 0.1, dark, x, h + 0.02, z + d / 2 + o), box(w + 2 * o, 0.12, 0.1, dark, x, h + 0.02, z - d / 2 - o), box(0.1, 0.12, d + 2 * o, dark, x - w / 2 - o, h + 0.02, z), box(0.1, 0.12, d + 2 * o, dark, x + w / 2 + o, h + 0.02, z));
  g.add(box(w * 0.9, 0.25, 0.2, mat(0x8a8f96), x, 0.12, z + d / 2));
  const win = (ww, wh, cx, cy, cz, axis) => { // axis 'z': on a face looking +z; 'x': on a face looking +x (s>0) or -x
    const sx = axis === 'z' ? 1 : 0.06, sz = axis === 'z' ? 0.06 : 1;
    g.add(box(ww + 0.12, wh + 0.12, 0.06, trim, cx, cy, cz).rotateY(axis === 'z' ? 0 : Math.PI / 2));
    g.add(box(ww, wh, 0.07, glass, cx, cy, cz).rotateY(axis === 'z' ? 0 : Math.PI / 2));
    return [sx, sz];
  };
  const place = (nx, nz, ww, wh, cx, cy, cz, axis) => { // build then shift out to the wall surface
    const before = g.children.length; win(ww, wh, 0, 0, 0, axis);
    for (let i = before; i < g.children.length; i++) g.children[i].position.set(cx + nx * 0.03, cy, cz + nz * 0.03);
  };
  const faceZ = z + d / 2, towards = x < 0 ? 1 : -1, faceX = x + towards * (w / 2);
  place(0, 1, 1.5, 1.2, x - w * 0.25, 1.5, faceZ, 'z'); place(0, 1, 1.5, 1.2, x + w * 0.28, 1.5, faceZ, 'z');
  for (const dz of [-d * 0.28, d * 0.05, d * 0.3]) place(towards, 0, 1.4, 1.2, faceX, 1.5, z + dz, 'x');
  g.add(box(0.95, 2.05, 0.07, mat(0x7b5a3a), x + w * 0.02, 1.03, faceZ + 0.03));
  if (style === 'brick') g.add(box(0.7, 1.4, 0.7, mat(0xffffff, { tex: 'brick' }), x - w * 0.1, h + 1.4, z - d * 0.12));
  return g;
}

// Canopy blob: jittered icosphere with a dark-to-light vertex gradient, so trees read as foliage and not as balls.
function canopy(kit, r, seed) {
  const { THREE } = kit, geo = new THREE.IcosahedronGeometry(r, 2), p = geo.attributes.position, col = [];
  const lo = new THREE.Color(0x335c33), hi = new THREE.Color(0x7aa84f), c = new THREE.Color();
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i), k = 1 + (hash(x, y, z, seed) - 0.5) * 0.3;
    p.setXYZ(i, x * k, y * k * 0.92, z * k);
    c.copy(lo).lerp(hi, Math.min(1, Math.max(0, (y / r + 1) / 2 + (hash(z, x, y, seed + 3) - 0.5) * 0.25)));
    col.push(c.r, c.g, c.b);
  }
  geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); geo.computeVertexNormals();
  return geo;
}

export function tree(kit, x, z, s = 1, seed = 1) {
  const { THREE, C, mat, cyl } = kit;
  const g = new THREE.Group();
  g.add(cyl(0.2 * s, 2.4 * s, mat(C.trunk, { roughness: 1 }), x, 1.2 * s, z, 8, false, 0.12 * s));
  const leaf = mat(0xffffff, { vertexColors: true, roughness: 1 });
  [[0, 3.3, 0, 1.55], [0.85, 2.8, 0.4, 1.05], [-0.8, 2.9, -0.35, 1.15], [0.2, 3.9, -0.3, 0.9]].forEach(([dx, dy, dz, r], i) => {
    const m = new THREE.Mesh(canopy(kit, r * s, seed * 7 + i), leaf);
    m.position.set(x + dx * s, dy * s, z + dz * s); m.castShadow = true; m.receiveShadow = true;
    g.add(m);
  });
  return g;
}

function powerLines(kit) {
  const { THREE, mat, cyl, box } = kit, g = new THREE.Group(), pole = mat(0x6a5a45), wire = new THREE.MeshBasicMaterial({ color: 0x1b1d20 });
  const xs = [-31, 9, 49], z = 21.6;
  for (const x of xs) {
    g.add(cyl(0.13, 7.2, pole, x, 3.6, z, 8)); g.add(box(1.8, 0.1, 0.1, pole, x, 6.8, z));
    for (const dx of [-0.75, 0, 0.75]) g.add(cyl(0.03, 0.12, mat(0xdfe3e8), x + dx, 6.9, z, 6));
  }
  for (let i = 0; i < xs.length - 1; i++) for (const dx of [-0.75, 0, 0.75]) {
    const a = xs[i] + dx, b = xs[i + 1] + dx, pts = [];
    for (let k = 0; k <= 8; k++) { const t = k / 8; pts.push(new THREE.Vector3(a + (b - a) * t, 6.95 - 0.9 * 4 * t * (1 - t), z)); }
    g.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 24, 0.012, 4), wire));
  }
  return g;
}

// ground, lawn, street, neighbours, trees, power lines. `pit` cuts a hole in the ground for the slab excavation.
export function buildBase(kit, { pit = null } = {}) {
  const { THREE, C, mat, box, flat, rectWithHoles } = kit;
  const g = new THREE.Group();
  g.name = 'base';
  const holes = pit ? [pit] : [];
  g.add(rectWithHoles(-120, 120, -120, 120, holes, mat(0xffffff, { tex: 'grass' })));
  g.add(rectWithHoles(BLOCK.x0, BLOCK.x1, BLOCK.z0, BLOCK.z1, holes, mat(0xe4f2d8, { tex: 'grass' }), 0.004));
  g.add(flat(240, 7.5, mat(0xffffff, { tex: 'asphalt' }), 0, 0.004, 24.25));
  g.add(box(240, 0.14, 0.22, mat(0xd2d4d6, { tex: 'concrete' }), 0, 0.07, 20.5));
  g.add(flat(240, 2.35, mat(0xffffff, { tex: 'paving' }), 0, 0.003, 19.325));
  const paint = mat(0xefefe8, { roughness: 0.7 });
  for (let x = -60; x <= 60; x += 6) g.add(flat(2.4, 0.15, paint, x, 0.006, 24.25));
  g.add(flat(240, 0.12, paint, 0, 0.006, 21.1), flat(240, 0.12, paint, 0, 0.006, 27.4));
  const bm = mat(0xffffff);
  for (const [w, d, x, z] of [[15, 0.06, 0, BLOCK.z1], [15, 0.06, 0, BLOCK.z0], [0.06, 35, BLOCK.x0, 0], [0.06, 35, BLOCK.x1, 0]]) g.add(flat(w || 0.06, d, bm, x, 0.02, z));
  g.add(neighbourHouse(kit, 9.5, 12.5, -14.2, 7, 'brick'));
  g.add(neighbourHouse(kit, 9.5, 14, 14.2, 3.5, 'cream'));
  g.add(neighbourHouse(kit, 9.5, 12.5, -14.2, -9, 'render'));
  [[-11, 14.5], [11.5, 13.5], [-12, -2], [12, -7], [-10, 19.8], [6.5, 19.8], [26, 18], [-26, 19], [-22, -8]].forEach(([x, z], i) => g.add(tree(kit, x, z, 0.9 + (i % 3) * 0.15, i + 1)));
  g.add(powerLines(kit));
  return g;
}

// Temporary works from step 1, kept in step 2. Returns {fence, silt, entry, amenities, sign}.
export function buildSiteWorks(kit) {
  const { THREE, C, mat, ghost, box, cyl, textPlane } = kit;
  const mk = (name) => { const x = new THREE.Group(); x.name = name; return x; };
  const fence = mk('fence'), silt = mk('silt'), entry = mk('entry'), amenities = mk('amenities'), sign = mk('sign');
  const panel = ghost(0x9aa5b1, 0.38), post = mat(0x59616b, { metalness: 0.6, roughness: 0.4 });
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

  entry.add(box(3.2, 0.18, 6, mat(0xb3b2ad, { tex: 'concrete', bump: 1.6 }), 4.5, 0.09, 14.4));
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
  amenities.add(box(1.2, 0.4, 2.4, mat(0xffffff, { tex: 'timber' }), 5.4, 0.2, -12.5));
  amenities.add(cyl(0.1, 3.2, mat(0x6a5a45), -6.6, 1.6, 10.5, 8));
  amenities.add(box(0.35, 0.45, 0.2, mat(0xcfd2d6), -6.45, 1.3, 10.5));

  sign.add(cyl(0.05, 2.2, mat(C.steel), -1.6, 1.1, 16.8, 8));
  sign.add(cyl(0.05, 2.2, mat(C.steel), 0.8, 1.1, 16.8, 8));
  const board = textPlane(['BUILDING PERMIT', 'Permit no. (displayed)', 'Builder + registration no.', 'Relevant Building Surveyor'], 2.4, 1.2);
  board.position.set(-0.4, 1.65, 16.83);
  sign.add(board);
  return { fence, silt, entry, amenities, sign };
}

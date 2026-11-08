// Shared 3D helpers for every step. Units are metres. +z is toward the street, +x is east, +y is up.
import * as THREE from 'three';

export const C = {
  grass: 0x86ad6f, lawn: 0x74a05f, soil: 0x7a5c3e, soilDark: 0x4e3a28, sand: 0xdcc58f, rock: 0x9a9a96,
  concrete: 0xb8babd, concreteRaw: 0xa3a5a8, asphalt: 0x3f434a, kerb: 0xb4b6b9, path: 0xc9cbce,
  timber: 0xc79a5b, timberDark: 0x9b7440, steel: 0x6c7886, rebar: 0x59616b, rebarB: 0x2f6f9f, orange: 0xff7a1a,
  membrane: 0xf28c28, pvc: 0xd7d9dd, sewer: 0x8a5a3c, water: 0x2f7fd6, storm: 0x1fa39a, power: 0xd8383a, gas: 0xe6c200,
  brick: 0xb5654a, roof: 0x5c6670, wall: 0xe8e3d8, white: 0xf4f4f2, leaf: 0x4f7d45, trunk: 0x6b5236, hivis: 0xffa500, black: 0x1b1d20,
};

export const mat = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.88, metalness: 0, ...o });
export const ghost = (color, opacity = 0.45, o = {}) => mat(color, { transparent: true, opacity, depthWrite: false, ...o });
export const lineMat = (color) => new THREE.LineBasicMaterial({ color });

const shadowed = (m, cast = true) => { m.castShadow = cast; m.receiveShadow = true; return m; };

export function box(w, h, d, m, x = 0, y = 0, z = 0) {
  const mesh = shadowed(new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m));
  mesh.position.set(x, y, z);
  return mesh;
}

// Cylinder; r is the bottom radius and r2 (default r) the top radius, so a cone collar is cyl(0.11, h, m, x, y, z, 24, true, 0.05).
export function cyl(r, h, m, x = 0, y = 0, z = 0, seg = 16, open = false, r2 = r) {
  const mesh = shadowed(new THREE.Mesh(new THREE.CylinderGeometry(r2, r, h, seg, 1, open), m));
  mesh.position.set(x, y, z);
  return mesh;
}

export function rod(a, b, r, m, seg = 8) {
  const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b), dir = B.clone().sub(A), len = dir.length();
  const mesh = shadowed(new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, seg), m));
  mesh.position.copy(A).addScaledVector(dir, 0.5);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
  return mesh;
}

export function pipe(points, r, m) {
  const g = new THREE.Group();
  for (let i = 0; i < points.length - 1; i++) g.add(rod(points[i], points[i + 1], r, m));
  for (let i = 1; i < points.length - 1; i++) {
    const s = shadowed(new THREE.Mesh(new THREE.SphereGeometry(r, 10, 8), m));
    s.position.set(...points[i]);
    g.add(s);
  }
  return g;
}

export function flat(w, d, m, x = 0, y = 0, z = 0) {
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, d), m);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.set(x, y, z);
  mesh.receiveShadow = true;
  return mesh;
}

// Rectangle (x0..x1, z0..z1) with rectangular holes, as a flat mesh. Shape y maps to world -z after the rotation.
export function rectWithHoles(x0, x1, z0, z1, holes, m, y = 0) {
  const s = new THREE.Shape([[x0, -z1], [x1, -z1], [x1, -z0], [x0, -z0]].map(([x, yy]) => new THREE.Vector2(x, yy)));
  for (const h of holes || []) {
    const p = new THREE.Path();
    [[h.x0, -h.z1], [h.x0, -h.z0], [h.x1, -h.z0], [h.x1, -h.z1]].forEach(([x, yy], i) => (i ? p.lineTo(x, yy) : p.moveTo(x, yy)));
    s.holes.push(p);
  }
  const mesh = new THREE.Mesh(new THREE.ShapeGeometry(s), m);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = y;
  mesh.receiveShadow = true;
  return mesh;
}

// Extrude a 2D outline (array of [x, y]) along z by `depth`, centred on z = 0.
export function extrudeProfile(pts, depth, m) {
  const shape = new THREE.Shape(pts.map(([x, y]) => new THREE.Vector2(x, y)));
  const geo = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false });
  geo.translate(0, 0, -depth / 2);
  return shadowed(new THREE.Mesh(geo, m));
}

export function outline(mesh, color = 0x5a6572) {
  const e = new THREE.LineSegments(new THREE.EdgesGeometry(mesh.geometry, 20), lineMat(color));
  mesh.add(e);
  return mesh;
}

export function lineSet(segments, color) {
  const pos = [];
  for (const [a, b] of segments) pos.push(...a, ...b);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  return new THREE.LineSegments(g, lineMat(color));
}

export function textPlane(lines, w, h, { bg = '#ffffff', fg = '#14233a', accent = '#e8590c' } = {}) {
  const c = document.createElement('canvas');
  c.width = 512; c.height = Math.round(512 * h / w);
  const x = c.getContext('2d');
  x.fillStyle = bg; x.fillRect(0, 0, c.width, c.height);
  x.fillStyle = accent; x.fillRect(0, 0, c.width, 14);
  x.fillStyle = fg; x.textBaseline = 'top';
  const step = (c.height - 34) / lines.length;
  lines.forEach((t, i) => { x.font = `${i === 0 ? 700 : 500} ${Math.min(46, step * 0.72)}px Arial, sans-serif`; x.fillText(t, 26, 26 + i * step); });
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex }));
}

export function disposeTree(obj) {
  obj.traverse((o) => {
    o.geometry?.dispose?.();
    for (const m of [o.material ?? []].flat()) {
      for (const v of Object.values(m)) if (v?.isTexture) v.dispose();
      m.dispose?.();
    }
  });
}

export const kit = { THREE, C, mat, ghost, lineMat, box, cyl, rod, pipe, flat, rectWithHoles, extrudeProfile, outline, lineSet, textPlane, disposeTree };

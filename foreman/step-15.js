// Step 15: painting and the final fix. The Step 14 house (floors finished) is prepared, painted, fitted off with taps, basins, switches, power points, lights and smoke alarms, tested, cleaned and checked for defects.
// Rules marked Verified come from the BPC Guide to Standards and Tolerances 2026 (sections 10.3, 10.4, 13, 16, 19 and 21, re-read against the PDF), the VBA plumbing certificate page, the Energy Safe Victoria pages and the
// NCC and BPC pages used in Steps 8 and 9. AS/NZS 2311 (painting), AS/NZS 3000, AS/NZS 3500 and the paint makers' data sheets were not opened, so paint systems, coverage and fit-off heights are Typical or Confirm.
// Paint colours, fixture positions and sizes in the model are illustrative, and the zoom rooms draw layers thicker than real.
import * as THREE from 'three';
import step14 from './step-14.js';
import { grp } from './step-06.js';
import { F, PLATE_UP } from './frame.js';
import { ALARMS, ALARMS_UP, LIGHTS } from './elec.js';
import { drawings, howto, trades, materials, quotes, quoteTips, inspections, exam, sources, caution } from './step-15-study.js';

const SL = F.SLAB, CY = F.H + F.SLAB - 0.013, UPS = PLATE_UP - (F.H + F.SLAB);          // slab top, the underside of the ceiling sheets, and the rise to the first-floor ceiling
const WX = -3.6, WZ = 2.4, fy = (x, z) => SL + 0.012 + Math.hypot(x - WX, z - WZ) / 60;   // bathroom floor from Steps 10 and 14

const phases = [
  { title: 'Delivery and checks', text: 'Paint, tape, sheets and the fittings arrive. Colours, sheens and fittings are checked against the schedule, and everything is stored dry and clean.' },
  { title: 'Preparation and masking', text: 'Floors are covered, fixing holes and dents are filled and sanded, and the edges are masked so the paint stops where it should.' },
  { title: 'Ceilings and walls painted', text: 'The ceilings and walls get a sealer and two coats, cut in at the edges and rolled, with the makers\' recoat times kept.' },
  { title: 'Doors and trims painted', text: 'Doors, architraves and skirting get an undercoat and gloss coats, brushed with the masking in place, and the tape comes off while the paint is still tacky.' },
  { title: 'Plumbing and electrical fit-off', text: 'The plumber fits the basin, taps, toilet and shower, and the electrician fits the plates, lights and smoke alarms, after the paint so nothing gets over-painted.' },
  { title: 'Commissioning and testing', text: 'Taps and the shower are run, the hot water is checked, RCDs and smoke alarms are tested, and the lights are switched on.' },
  { title: 'Cleaning, defects and certificates', text: 'The floors are uncovered and cleaned, debris is removed, the defects list is made and the certificates are collected.' },
];

const MAT = (kit) => {
  const { mat, ghost } = kit;
  return {
    timber: mat(0xffffff, { tex: 'timber' }), steel: mat(0xb9c2cd, { metalness: 0.6, roughness: 0.35 }), brass: mat(0xc9a24d, { metalness: 0.7, roughness: 0.4 }), dark: mat(0x1b1d20, { roughness: 0.7 }),
    white: mat(0xf4f4f2, { roughness: 0.5, emissive: 0x3a3a38 }), ceram: mat(0xf7f8f8, { roughness: 0.2, emissive: 0x3c3d3d }), stone: mat(0xdad7d0, { roughness: 0.35, emissive: 0x38362f }), vcab: mat(0xc9c4ba, { roughness: 0.7, emissive: 0x2d2b27 }),
    mirror: mat(0xcfe4ee, { roughness: 0.1, metalness: 0.5, emissive: 0x2a3a44 }), tin: mat(0x3d6fb5, { roughness: 0.6 }), tin2: mat(0xe5e1d6, { roughness: 0.6, emissive: 0x3d3a33 }), tape: mat(0x4aa3df, { roughness: 0.8 }),
    card: mat(0xc8ad82, { roughness: 0.9 }), sheet: mat(0xdad8cf, { roughness: 0.85, emissive: 0x34332f }), glow: mat(0xfff3b0, { roughness: 0.4, emissive: 0xffe27a }), fill: mat(0xffffff, { roughness: 0.9, emissive: 0x888888 }),
    sealr: mat(0xf1ece6, { roughness: 0.95, emissive: 0x55524d }), coat1: mat(0xdbe4ea, { roughness: 0.92, emissive: 0x2b3238 }),
    paintW: mat(0xc8d4dc, { roughness: 0.9, emissive: 0x2b3238 }), paintWet: mat(0xd9e6ea, { roughness: 0.5, emissive: 0x2e3739 }), paintC: mat(0xffffff, { roughness: 0.95, emissive: 0x6a6a68 }), gloss: mat(0xfbfbf9, { roughness: 0.22, emissive: 0x4a4a47 }),
    red: mat(0xd62828, { roughness: 0.6 }), pail: mat(0x3d6fb5, { roughness: 0.6 }), oak: mat(0xf0d3a2, { tex: 'timber' }), board: mat(0xe8e0cc, { roughness: 0.92, emissive: 0x5a5242 }), seal: mat(0x2b8fd6, { roughness: 0.5, emissive: 0x0f3a5a }),
    f1: mat(0xd62828, { roughness: 0.7 }), f2: mat(0x2b8fd6, { roughness: 0.7 }), f3: mat(0xf2c230, { roughness: 0.7 }), paper: mat(0xfafafa, { roughness: 0.9, emissive: 0x555555 }), orange: mat(0xff7a1a, { roughness: 0.6 }), trim: mat(0xe6cfa6, { roughness: 0.7, emissive: 0x3d3322 }),
    water: ghost(0x7fd0ff, 0.5), glass: ghost(0xbfe3f2, 0.3), okGhost: ghost(0x2fbf71, 0.4), redGhost: ghost(0xd62828, 0.5),
  };
};

/* ---------- walk scene ---------- */
function build(kit) {
  const { box, cyl, rod, textPlane } = kit;
  const mk = (n) => { const g = new THREE.Group(); g.name = n; return g; };
  const s14 = step14.build(kit), m = MAT(kit);
  const FIN = ['ftiles', 'groutF', 'wtiles', 'wgrout', 'dry', 'threshold', 'joints', 'timber', 'carpet', 'strips'];
  const layers = [...s14.layers.slice(0, s14.baseCount), ...s14.layers.slice(s14.baseCount).filter((l) => FIN.includes(l.group.name))].map(({ group }) => ({ group }));
  const sign = (lines, w, h, x, y, z, ry = 0) => { const s = textPlane(lines, w, h); s.position.set(x, y, z); s.rotation.y = ry; return s; };
  const post = (g, x, y, z, h) => { const c = cyl(0.025, h, m.steel, x, h / 2 + y, z, 8); g.add(c); return c; };
  const find = (n) => { let r = null; for (const l of s14.layers) if (l.group.name === n) r = l.group; return r; };

  // paint is a material swap on the lining and trim meshes, switched by two empty marker layers
  const markWalls = mk('markWalls'), markTrim = mk('markTrim'), swaps = [];
  const reg = (group, marker, table) => { if (!group) return; group.traverse((o) => { if (!o.isMesh || !o.material || !o.material.color) return; const to = table[o.material.color.getHex()]; if (to) swaps.push({ mesh: o, from: o.material, to, marker, on: false }); }); };
  reg(find('wallsSet'), markWalls, { 0xf2f0ea: m.paintW, 0xb9d8b5: m.paintWet }); reg(find('ceilSet'), markWalls, { 0xf6f4ef: m.paintC }); reg(find('ceilTape'), markWalls, { 0xfaf8f2: m.paintC });
  reg(find('wallTape'), markWalls, { 0xf6f4ef: m.paintC, 0xfaf8f2: m.paintW });
  reg(find('doors'), markTrim, { 0xe6cfa6: m.gloss, 0xf2eee4: m.gloss }); reg(find('skirt'), markTrim, { 0xe6cfa6: m.gloss });
  const ticker = () => { for (const s of swaps) { const on = s.marker.visible; if (s.on !== on) { s.on = on; s.mesh.material = on ? s.to : s.from; } } };

  // delivery: paint tins, tape, boxes of fittings and rolls on a pallet in the east margin
  const stock = mk('stock'), sx = 6.5, sz = 4.0;
  stock.add(box(1.3, 0.1, 3.6, m.timber, sx, 0.05, sz));
  for (let i = 0; i < 3; i++) for (let j = 0; j < 4; j++) stock.add(cyl(0.12, 0.2, j % 2 ? m.tin : m.tin2, sx - 0.4 + (j % 2) * 0.3, 0.2 + i * 0.2, sz - 1.4 + Math.floor(j / 2) * 0.32, 14));
  for (let i = 0; i < 3; i++) stock.add(box(0.5, 0.2, 0.36, m.card, sx - 0.25, 0.2 + i * 0.2, sz - 0.1), box(0.5, 0.2, 0.36, m.card, sx + 0.3, 0.2 + i * 0.2, sz - 0.1));
  for (let i = 0; i < 4; i++) stock.add(cyl(0.05, 0.05, m.tape, sx - 0.4 + i * 0.25, 0.13, sz + 0.55, 12));
  stock.add(box(0.7, 0.3, 0.45, m.white, sx - 0.15, 0.25, sz + 1.1), box(0.4, 0.22, 0.4, m.ceram, sx + 0.35, 0.21, sz + 1.1), box(0.35, 0.26, 0.5, m.vcab, sx, 0.23, sz + 1.55));
  stock.add(sign(['PAINT AND FITTINGS', 'Check colour, sheen and fittings against the schedule', 'Keep dry, away from heat and frost'], 1.6, 0.5, sx, 0.85, sz + 2.1, 0), post(stock, sx - 0.82, 0, sz + 2.1, 0.85), post(stock, sx + 0.82, 0, sz + 2.1, 0.85));

  // preparation: filled fixings on a wall, masking tape on the skirting tops, a step ladder and tins on a drop sheet
  const filled = mk('filled');
  for (const [x, y] of [[1.0, 1.6], [1.6, 1.2], [1.3, 0.9], [4.5, 1.5], [4.85, 1.1], [4.9, 1.8]]) filled.add(box(0.045, 0.045, 0.004, m.fill, x, y, 0.0795 + 0.002));
  const masks = mk('masks'); { const y = SL + 0.075; masks.add(box(5.12, 0.028, 0.004, m.tape, 2.64, y, 0.0795 + 0.002), box(5.12, 0.028, 0.004, m.tape, 2.64, y, 5.4205 - 0.002), box(0.004, 0.028, 5.3, m.tape, 5.2255 - 0.002, y, 2.75), box(0.004, 0.028, 5.3, m.tape, 0.0795 + 0.002, y, 2.75)); }
  const tools = mk('tools'); {
    tools.add(box(1.4, 0.004, 1.0, m.sheet, 3.8, SL + 0.03, 1.2), cyl(0.1, 0.18, m.tin, 3.5, SL + 0.12, 1.2, 14), cyl(0.1, 0.18, m.tin2, 3.8, SL + 0.12, 1.25, 14), box(0.3, 0.03, 0.2, m.tin, 4.1, SL + 0.045, 1.15));
    for (const s of [-1, 1]) { tools.add(rod([4.7 + s * 0.28, SL + 0.03, 1.0], [4.7 + s * 0.02, SL + 1.5, 1.3], 0.015, m.steel, 6), rod([4.7 + s * 0.28, SL + 0.03, 1.6], [4.7 + s * 0.02, SL + 1.5, 1.3], 0.015, m.steel, 6)); }
    for (let k = 1; k <= 4; k++) tools.add(rod([4.7 - 0.27 + 0.03 * k * 0.2, SL + 0.35 * k, 1.0 + 0.07 * k], [4.7 + 0.27, SL + 0.35 * k, 1.0 + 0.07 * k], 0.012, m.steel, 6));
  }
  const cover = mk('cover');
  for (const [x0, x1, z0, z1, y] of [[-5.2, 5.2, 5.6, 11.2, SL + 0.021], [0.1, 5.2, 0.1, 5.4, SL + 0.018], [-5.2, 5.2, -5.2, -0.1, SL + 0.021]]) for (let x = x0; x < x1 - 0.1; x += 1.2) for (let z = z0; z < z1 - 0.1; z += 2.4) { const w = Math.min(1.19, x1 - x), d = Math.min(2.39, z1 - z); cover.add(box(w, 0.004, d, m.sheet, x + w / 2, y + 0.002, z + d / 2)); }

  // fit-off: bedroom power points and switch, ceiling lights, smoke alarms, and the bathroom fittings
  const fit = mk('fit'), swOk = mk('swOk'), glow = mk('glow');
  for (const x of [1.4, 4.1]) fit.add(box(0.085, 0.085, 0.012, m.white, x, 0.45, 0.0795 + 0.006), box(0.02, 0.008, 0.003, m.dark, x - 0.012, 0.455, 0.0795 + 0.013), box(0.02, 0.008, 0.003, m.dark, x + 0.012, 0.455, 0.0795 + 0.013));
  for (const z of [1.6, 3.2]) fit.add(box(0.012, 0.085, 0.085, m.white, 5.2255 - 0.006, 0.45, z));
  fit.add(box(0.085, 0.085, 0.012, m.white, 3.4, 0.45, 5.4205 - 0.006));
  swOk.add(box(0.012, 0.115, 0.07, m.white, 0.0795 + 0.006, 1.35, 3.35), box(0.006, 0.035, 0.022, m.white, 0.0795 + 0.014, 1.38, 3.325), box(0.006, 0.035, 0.022, m.white, 0.0795 + 0.014, 1.38, 3.375));
  const LT = LIGHTS.filter(([x, z]) => !(x === 2.6 && z === 2.75)).concat([[3.9, 2.75]]);   // Step 9 light points, with the bedroom one moved off its smoke alarm
  for (const [x, z] of LT) { const r = x === -3.6 ? 0.08 : 0.13; fit.add(cyl(r, 0.035, m.white, x, CY - 0.0175, z, 24)); glow.add(cyl(r * 0.8, 0.01, m.glow, x, CY - 0.04, z, 24)); }
  for (const [x, z] of ALARMS) fit.add(cyl(0.07, 0.03, m.white, x, CY - 0.015, z, 24), cyl(0.006, 0.004, m.red, x + 0.03, CY - 0.032, z, 8));
  for (const [x, z] of ALARMS_UP) fit.add(cyl(0.07, 0.03, m.white, x, CY + UPS - 0.015, z, 24), cyl(0.006, 0.004, m.red, x + 0.03, CY + UPS - 0.032, z, 8));   // first-floor alarm on its own storey
  // bathroom: vanity and basin, mirror, toilet, shower fittings and screen
  { const vy = fy(-4.6, 5.18) + 0.013, z0 = 5.4085;
    fit.add(box(0.9, 0.8, 0.45, m.vcab, -4.6, vy + 0.4, z0 - 0.225), box(0.94, 0.03, 0.49, m.stone, -4.6, vy + 0.815, z0 - 0.245), box(0.5, 0.1, 0.36, m.ceram, -4.6, vy + 0.88, z0 - 0.26), cyl(0.014, 0.14, m.steel, -4.6, vy + 0.9, z0 - 0.06, 10), rod([-4.6, vy + 0.97, z0 - 0.06], [-4.6, vy + 0.96, z0 - 0.2], 0.012, m.steel, 8), box(0.8, 0.6, 0.012, m.mirror, -4.6, 1.65, 5.4205 - 0.006));
    const wy = fy(-2.2, 4.75) + 0.013, wx = -2.0915;
    fit.add(box(0.55, 0.38, 0.36, m.ceram, wx - 0.28, wy + 0.19, 4.75), box(0.18, 0.4, 0.36, m.ceram, wx - 0.09, wy + 0.6, 4.75), box(0.5, 0.02, 0.34, m.white, wx - 0.3, wy + 0.4, 4.75), box(0.08, 0.02, 0.1, m.steel, wx - 0.09, wy + 0.81, 4.75));
    fit.add(rod([WX, 2.0, 1.292], [WX, 2.0, 1.5], 0.012, m.steel, 8), cyl(0.09, 0.02, m.steel, WX, 1.98, 1.5, 16), box(0.1, 0.1, 0.05, m.steel, WX, 1.1, 1.292 + 0.025), rod([WX + 0.04, 1.1, 1.35], [WX + 0.12, 1.1, 1.42], 0.01, m.steel, 6));
    fit.add(box(0.01, 1.9, 1.0, m.glass, -2.75, fy(-2.75, 1.8) + 0.96, 1.8), box(0.03, 0.05, 0.03, m.steel, -2.75, 1.7, 1.3), box(0.03, 0.05, 0.03, m.steel, -2.75, 0.5, 1.3), box(0.03, 0.05, 0.03, m.steel, -2.75, 1.7, 2.3), box(0.03, 0.05, 0.03, m.steel, -2.75, 0.5, 2.3));
  }
  // testing: water from the tap and the shower, a smoke alarm test halo
  const test = mk('test'); {
    const vy = fy(-4.6, 5.18) + 0.013;
    test.add(cyl(0.007, 0.16, m.water, -4.6, vy + 1.0 - 0.1 - 0.0, 5.4085 - 0.2, 8), cyl(0.05, 1.7, m.water, WX, 1.1, 1.5, 16, true, 0.42));
    const halo = new THREE.Mesh(new THREE.SphereGeometry(0.3, 16, 12), m.okGhost); halo.position.set(ALARMS[0][0], CY - 0.1, ALARMS[0][1]); test.add(halo);
  }

  // defects to find: a paint run, an unfilled fixing, a crooked switch plate
  const swBad = mk('swBad'), defects = mk('defects');
  { const g = new THREE.Group(); g.position.set(0.0795 + 0.006, 1.35, 3.35); g.rotation.x = 0.11; g.add(box(0.012, 0.115, 0.07, m.white, 0, 0, 0), box(0.006, 0.035, 0.022, m.white, 0.008, 0.03, -0.025), box(0.006, 0.035, 0.022, m.white, 0.008, 0.03, 0.025)); swBad.add(g, box(0.02, 0.17, 0.11, m.redGhost, 0.0795 + 0.012, 1.35, 3.35)); }
  defects.add(box(0.02, 0.26, 0.004, m.fill, 3.45, 1.78, 0.0795 + 0.002), box(0.06, 0.28, 0.01, m.redGhost, 3.45, 1.78, 0.0795 + 0.006), box(0.03, 0.03, 0.004, m.dark, 4.0, 1.45, 0.0795 + 0.002), box(0.08, 0.08, 0.01, m.redGhost, 4.0, 1.45, 0.0795 + 0.006));
  defects.add(sign(['DEFECTS TO FIND', 'Paint run, unfilled fixing, crooked switch plate'], 1.3, 0.42, 3.7, 0.9, 1.05, 0), post(defects, 3.08, 0, 1.05, 0.9), post(defects, 4.32, 0, 1.05, 0.9));

  // cleaning and handover: building debris, and a table of certificates
  const debris = mk('debris'); {
    const dx = 6.5, dz = 8.5; debris.add(box(1.2, 0.08, 1.4, m.timber, dx, 0.04, dz));
    for (const [x, z, w, d, h] of [[-0.3, -0.3, 0.6, 0.5, 0.3], [0.2, 0.2, 0.5, 0.4, 0.25], [0.0, 0.35, 0.3, 0.3, 0.5], [-0.35, 0.3, 0.4, 0.3, 0.2]]) debris.add(box(w, h, d, m.card, dx + x, 0.08 + h / 2, dz + z));
    debris.add(cyl(0.2, 0.5, m.tin2, dx + 0.45, 0.33, dz - 0.4, 12), box(0.7, 0.01, 0.5, m.sheet, dx + 0.2, 0.09, dz + 0.55));
    debris.add(sign(['BUILDING DEBRIS ON SITE', 'A defect at completion (BPC 21.4)'], 1.4, 0.42, dx, 1.1, 7.2, 0), post(debris, dx - 0.7, 0, 7.2, 1.1), post(debris, dx + 0.7, 0, 7.2, 1.1));
  }
  const certs = mk('certs'); {
    const cx = 6.5, cz = -1.8; certs.add(box(1.4, 0.04, 0.8, m.timber, cx, 0.82, cz), ...[[-0.5, -0.2], [0.5, 0.2]].map(([x]) => box(0.05, 0.8, 0.05, m.steel, cx + x, 0.4, cz - 0.3)), ...[[-0.5], [0.5]].map(([x]) => box(0.05, 0.8, 0.05, m.steel, cx + x, 0.4, cz + 0.3)));
    certs.add(box(0.28, 0.04, 0.36, m.f1, cx - 0.4, 0.86, cz), box(0.28, 0.04, 0.36, m.f2, cx - 0.1, 0.88, cz + 0.02), box(0.28, 0.04, 0.36, m.f3, cx + 0.2, 0.86, cz), box(0.3, 0.012, 0.4, m.paper, cx + 0.5, 0.85, cz), box(0.3, 0.012, 0.4, m.paper, cx + 0.52, 0.862, cz + 0.02));
    certs.add(sign(['CERTIFICATES TO COLLECT', 'Plumbing, electrical, gas and the surveyor\'s records'], 1.5, 0.42, cx, 1.3, -0.4, Math.PI), post(certs, cx - 0.75, 0, -0.4, 1.3), post(certs, cx + 0.75, 0, -0.4, 1.3));
  }

  layers.push({ group: stock, until: 1 }, { group: cover, from: 1, until: 6 }, { group: filled, from: 1, until: 2 }, { group: masks, from: 1, until: 4 }, { group: tools, from: 1, until: 5 }, { group: markWalls, from: 2 }, { group: markTrim, from: 3 },
    { group: fit, from: 4 }, { group: swOk, from: 4, until: 6 }, { group: glow, from: 5 }, { group: test, from: 5, until: 6 }, { group: swBad, from: 6 }, { group: defects, from: 6 }, { group: debris, from: 6 }, { group: certs, from: 6 });
  return { layers, colliders: s14.colliders, tickers: [...s14.tickers, ticker], spawn: { pos: [4, 18.5], yaw: 0, pitch: 0.2 }, map: s14.map, orbit: { pos: [9.5, 9, 18], target: [0, 1.0, 5] }, hotspots: HOTSPOTS };
}

/* ---------- hotspots ---------- */
const HOTSPOTS = [
  { id: 'stock', title: 'Paint, filler, tape and fittings delivered', pos: [6.5, 1.5, 3.0], stand: [6.5, 9.2], from: 0, until: 1, drawing: 'order',
    summary: 'Paint, filler, masking tape, sealant and the boxed fittings arrive. Each item is checked against the colour and fittings schedule, and everything is stored dry and away from frost and heat.',
    learn: [['Check each delivery against the colour schedule: product, colour code, sheen and quantity. Tinted paint from different batches can differ in shade, so paint for one room or wall is usually ordered in one batch (Typical).', 'T'], ['Keep paint, filler and sealant dry and upright, and inside the temperatures on the label (Typical).', 'T'], ['Check each fitting in its box against the schedule before it is fitted. Fittings that are cracked, chipped or scratched when viewed from a normal viewing position at completion are outside tolerance (21.1).', 'V', 'bpcTol26'], ['A normal viewing position is 1.5 m or more away, in diffused non-critical light, or 600 mm for appliances and fixtures and 3 m for glass.', 'V', 'bpcTol26'], ['Painting must follow the maker\'s instructions and the recommendations of AS/NZS 2311 (16.1). AS/NZS 2311 is paywalled and was not opened.', 'V', 'bpcTol26'], ['The BPC Guide to Standards and Tolerances is advisory and applies to contracts entered into or work commenced from 1 August 2026.', 'V', 'bpcTol26']] },
  { id: 'prep', title: 'Preparation: fill, sand and mask', pos: [4.4, 1.5, 0.3], stand: [3.4, 3.6], from: 1, until: 2, drawing: 'paint',
    summary: 'The floors are covered, fixing holes and dents are filled and sanded, and the edges are masked. Preparation decides how many blemishes show under the coats.',
    learn: [['Fixings, and unfilled depressions caused by fixings, are outside tolerance in painted or stained surfaces (16.3). Mechanical imperfections, damage, holes and other unfilled depressions that can be seen from a normal viewing position are outside tolerance too (16.4). The middle of the 16.3 text was cut off when read.', 'V', 'bpcTol26'], ['Fill nail and screw holes and dents, let the filler dry, sand it flush and dust the surface before sealing (Typical).', 'T'], ['The finish level set in Step 12 decides how much work the plasterboard needs before paint. Glossy paint and low-angle light show more flaws than flat paint (Typical).', 'T'], ['Cover the floors with sheets and tape the joints, and mask the fittings and the sealed joints (Typical).', 'T'], ['Check that the Step 14 tiles, grout and sealant are clean and protected before any paint goes near them (Typical).', 'T'], ['Many painters put a first coat on before the doors and trims are hung and finish afterwards. The model paints after the fix-out, so confirm the order with the painter.', 'C']] },
  { id: 'paintw', title: 'Ceilings and walls: sealer and two coats', pos: [0.9, 1.6, 0.2], stand: [1.0, 3.5], from: 2, until: 4, detail: 'paint', drawing: 'paint',
    summary: 'The ceilings and walls are sealed and given two coats, cut in at the edges with a brush and rolled in the middle. The maker\'s recoat times are kept, and the finished surface is checked from a normal viewing position.',
    learn: [['Painting is outside tolerance if it does not conform to the manufacturer\'s instructions and the recommendations of AS/NZS 2311 Guide to the painting of buildings. Coatings need suitable durability for the conditions and the expected wear (16.1).', 'V', 'bpcTol26'], ['Paint runs, sags, wrinkling, dust, bare or starved areas, colour variations, surface cracks and irregular or coarse brush marks are outside tolerance (16.2). The clause was cut off after its list when read.', 'V', 'bpcTol26'], ['Interior coatings of any finish must not fail by lifting, blistering, flaking or fading within 36 months of completion (Table 16.5).', 'V', 'bpcTol26'], ['New plasterboard is sealed first so the set joints and the sheet paper take the paint evenly, then given two finish coats. Spread rate, coats and recoat time are on the maker\'s data sheet (Typical).', 'T'], ['Ceilings are usually painted first so drips fall onto walls still to be painted (Typical).', 'T'], ['The colours and sheens in the model are illustrative. The real ones are in the colour schedule in the contract (Typical).', 'T']] },
  { id: 'trims', title: 'Doors, architraves and skirting', pos: [2.5, 1.3, 0.2], stand: [2.5, 3.0], from: 3, until: 5, drawing: 'paint',
    summary: 'Doors, architraves and skirting get an undercoat and gloss or semi-gloss coats with a brush. Gaps are filled with flexible paintable filler first, and the tape comes off while the last coat is still tacky.',
    learn: [['Gaps between skirting and architraves and the wall are filled with flexible, paintable filler so the paint line is straight (Typical).', 'T'], ['Gaps in skirting over 2 mm within 24 months are outside tolerance. Fill gaps before the last coat.', 'V', 'bpcTol26'], ['Irregular and coarse brush marks, paint runs and sags are outside tolerance (16.2).', 'V', 'bpcTol26'], ['Gloss and semi-gloss show brush marks and runs more than flat paint, so thin, even coats are the usual approach (Typical).', 'T'], ['Paint all door edges, including the top and the bottom, so moisture cannot enter. Remove or mask the door hardware first (Typical).', 'T'], ['Pull masking tape off while the last coat is still tacky, at an angle back over itself, so the paint edge does not tear (Typical).', 'T']] },
  { id: 'fitp', title: 'Plumbing fit-off: basin, tap, toilet and shower', pos: [-4.6, 1.3, 5.3], stand: [-3.4, 4.0], from: 4, detail: 'basin', drawing: 'fit',
    summary: 'The licensed plumber fits the basin, mixer, toilet and shower fittings after the painting, so the paint stays off them. Every joint is checked for leaks, and the water must run away and not stand in the fixture.',
    learn: [['Water supply fixtures are outside tolerance if they leak or drip within 3 months from completion, or are not located to fully and clearly discharge into sanitary fixtures such as baths, basins and sinks (10.3).', 'V', 'bpcTol26'], ['Sanitary fixtures such as baths, basins, sinks, showers and troughs are outside tolerance if they retain water after they are drained, other than water held by surface tension (10.4).', 'V', 'bpcTol26'], ['Plumbing work worth $750 or more, including materials, appliances and fixtures, needs a compliance certificate from a licensed plumber. The plumber gives it to the owner within five days of completing the work and lodges it with the VBA within five days.', 'V', 'vbaCert'], ['Hot water at shower and tap outlets must not exceed 50 degrees Celsius, which is the job of the tempering valve fitted in Step 8. The page does not name Victoria. Check the outlet temperature when commissioning.', 'V', 'bpcHotWater'], ['Each basin tap and the toilet cistern has its own isolating valve, so one fixture can be shut off without shutting off the house (Typical).', 'T'], ['A trap under each fixture holds a water seal that keeps drain gas out. Trap size and waste fall come from AS/NZS 3500, which was not opened (Confirm). Product certification marks for taps and valves were not checked for this step.', 'C'], ['The fixtures and their positions in the model are illustrative and not from a plumbing plan.', 'T']] },
  { id: 'fite', title: 'Electrical fit-off: power points, switches and lights', pos: [5.0, 0.9, 1.6], stand: [3.4, 2.8], from: 4, detail: 'fitoff', drawing: 'fit',
    summary: 'The licensed electrician fits the power points, switches, lights and smoke alarms after the painting and connects them to the circuits roughed in at Step 9. Plates are fitted straight and level.',
    learn: [['Electrical work is outside tolerance if a product, fixture or fitting appears out of level or inconsistent with similar installations when viewed from a normal viewing position (19).', 'V', 'bpcTol26'], ['All electrical installation work needs a Certificate of Electrical Safety, issued by a registered electrical contractor or licensed electrician.', 'V', 'esvCoes'], ['A builder cannot do the wiring on their own build unless they are a licensed electrician.', 'V', 'esvCoesConsumers'], ['Smoke alarms must comply with AS 3786, be powered from the consumer mains where connected, and be interconnected where there is more than one. They are fitted to the bases cabled in Step 9. The ABCB page carries NSW-labelled text and no edition.', 'V', 'nccHp95'], ['A ceiling-mounted alarm is at least 300 mm from the wall and ceiling corner and 500 to 1500 mm from the high point of a sloping ceiling.', 'V', 'nccHp95'], ['Plates and fittings go on after the paint, so the painter cuts in round the boxes and does not paint the mechanisms (Typical).', 'T'], ['Heights, spacings and the number of points come from the electrician\'s design and AS/NZS 3000, which was not opened. Downlight clearances from insulation are the maker\'s and the Standard\'s (Confirm). The model uses the illustrative Step 9 positions.', 'C']] },
  { id: 'commission', title: 'Commissioning: run, test and record', pos: [-1.0, 2.6, 3.2], stand: [-1.0, 4.8], from: 5, until: 6, drawing: 'test',
    summary: 'Taps and the shower are run and checked for leaks and drainage, the hot water is checked, the RCDs and smoke alarms are tested, and every light and power point is tried. Results are recorded for the certificates.',
    learn: [['Water supply fixtures that leak or drip within 3 months of completion are outside tolerance (10.3). Sanitary fixtures that retain water after draining, other than surface-tension water, are outside tolerance (10.4).', 'V', 'bpcTol26'], ['Run every tap, the toilet and the shower, look under the basin and behind the toilet for drips, and record the hot water temperature at an outlet (Typical).', 'T'], ['RCDs and RCBOs must be tested to verify they are installed and operating correctly before the Certificate of Electrical Safety is signed, and the confirmation is recorded at the switchboard. The guidance is dated December 2021 and its 30-day interim discretion may have changed.', 'V', 'esvRcd'], ['Prescribed work is inspected by an independent licensed electrical inspector, completed within 8 business days of the work, and stays switched off until then.', 'V', 'esvLei'], ['Press the test button on each smoke alarm. Interconnected alarms should all sound together. The maker states the test and maintenance method (Typical).', 'T'], ['Fittings and appliances that are loose or not fully operational within 3 months of completion are outside tolerance (21.1).', 'V', 'bpcTol26']] },
  { id: 'defect', title: 'Inspect the paint: runs, fixings and finish', pos: [3.7, 1.7, 0.2], stand: [3.7, 3.6], from: 6, drawing: 'paint',
    summary: 'Walk the walls from 1.5 m and note runs, sags, bare patches, unfilled fixings and brush marks. The model has a paint run and an unfilled fixing.',
    learn: [['The model run is a paint run, which is outside tolerance (16.2).', 'V', 'bpcTol26'], ['The model fixing is unfilled. Unfilled depressions caused by fixings are outside tolerance in painted surfaces (16.3).', 'V', 'bpcTol26'], ['A normal viewing position is 1.5 m or more away, in diffused light that is not glancing or parallel to the surface. A defect has to be visible from there to count.', 'V', 'bpcTol26'], ['A check in raking side light finds more than the guide counts. Mark what you find, then decide what is outside tolerance by the guide\'s test (Typical).', 'T'], ['Interior coatings must last at least 36 months from completion without lifting, blistering, flaking or fading (Table 16.5).', 'V', 'bpcTol26'], ['Keep the colour codes, sheens and a little leftover paint with the handover records for touch-ups (Typical).', 'T']] },
  { id: 'defsw', title: 'Inspect the fit-off: plates, switches and fittings', pos: [0.2, 1.5, 3.35], stand: [2.6, 3.4], from: 6, drawing: 'fit',
    summary: 'Check that every plate, switch and fitting is level, tight, clean and consistent with the others in the room. The model has one switch plate that leans.',
    learn: [['Electrical work is outside tolerance if a product, fixture or fitting appears out of level or inconsistent with similar installations when viewed from a normal viewing position (19).', 'V', 'bpcTol26'], ['Appliances and fittings that are cracked, chipped or scratched at completion are outside tolerance. They are viewed from 600 mm for appliances and fixtures and 3 m for glass (21.1).', 'V', 'bpcTol26'], ['Fittings that are loose, or not fully operational within 3 months of completion, are outside tolerance (21.1).', 'V', 'bpcTol26'], ['Check that each plate sits flat, the screws are tight and the paint line round it is clean (Typical).', 'T'], ['Switch on every light and try every power point and switch, and photograph the fittings before handover (Typical).', 'T']] },
  { id: 'clean', title: 'Clean, clear the debris and uncover the floors', pos: [6.5, 2.0, 8.5], stand: [6.5, 12.0], from: 6, drawing: 'order',
    summary: 'Windows, floors, sanitary fixtures and joinery must be clean and ready for use at completion, and the building debris must be off the site. The floor protection comes up last.',
    learn: [['Building works including windows, floors, sanitary fixtures and joinery are outside tolerance if they are not clean and ready for use at the time of completion (21.4).', 'V', 'bpcTol26'], ['Building debris is outside tolerance if it remains on site at the time of completion (21.4).', 'V', 'bpcTol26'], ['Building maintenance is an ongoing requirement. An assessment against the tolerances must weigh the effect of reasonable maintenance, and whether a matter relates to the builder\'s workmanship or to general use (21.5).', 'V', 'bpcTol26'], ['Uncover the floors last, take the tape off without lifting the finish, vacuum, then clean each surface with a product its maker approves (Typical).', 'T'], ['A final clean is often a separate trade, done after every other trade has left, and a waste bin is arranged for the debris before it (Typical).', 'T']] },
  { id: 'certs', title: 'Collect the certificates and handover records', pos: [6.5, 2.0, -1.8], stand: [6.5, -5.0], from: 6, drawing: 'test',
    summary: 'Before handover the builder collects the plumbing and electrical certificates, the gas records, the surveyor\'s inspection records and the product, care and warranty documents.',
    learn: [['Plumbing: the plumber gives the compliance certificate to the owner within five days of completing the work and lodges it with the VBA within five days.', 'V', 'vbaCert'], ['Electrical: the installer lodges the Certificate of Electrical Safety through ESVConnect. Prescribed work is copied to the customer within 4 days once the inspection is complete, and non-prescribed work within 30 days. A copy also goes to Energy Safe.', 'V', 'esvCoesConsumers'], ['The BPC time limits run from completion: 3 months for fixtures that leak or drip (10.3) and for fittings that are loose or not operating (21.1), and 36 months for interior paint (Table 16.5). Record the condition on the day.', 'V', 'bpcTol26'], ['The final inspection, the occupancy permit and the handover are covered in Stage 18 (Typical).', 'T'], ['Keep the colour codes, appliance manuals and warranties, and the sealant, grout and floor care instructions together (Typical).', 'T']] },
];

/* ---------- zoom rooms ---------- */
const details = {
  paint: {
    title: 'Wall paint system: sealer and two coats', sub: 'Stud, wall sheet, taped and set joint, sealer, first coat, second coat, and the skirting with its sealed top edge. Layers are drawn thicker than real, and each coat stops lower than the one behind so every layer shows',
    floor: -0.27, gridSize: 2, camera: { pos: [0.85, 0.4, 0.85], target: [0.09, 0.0, 0.0] },
    build(kit) {
      const { box } = kit, m = MAT(kit);
      const stud = grp(box(0.09, 0.5, 0.045, m.timber, -0.045, 0, 0));
      const sheet = grp(box(0.0135, 0.4, 0.298, m.board, 0.00675, 0, -0.151), box(0.0135, 0.4, 0.298, m.board, 0.00675, 0, 0.151));
      const joint = grp(box(0.002, 0.4, 0.07, m.sheet, 0.0145, 0, 0), box(0.003, 0.4, 0.16, m.fill, 0.017, 0, 0));
      const sealer = grp(box(0.002, 0.34, 0.6, m.sealr, 0.0195, -0.03, 0));
      const coat1 = grp(box(0.003, 0.26, 0.6, m.coat1, 0.022, -0.07, 0));
      const coat2 = grp(box(0.003, 0.18, 0.6, m.paintW, 0.025, -0.11, 0));
      const skirt = grp(box(0.018, 0.07, 0.6, m.gloss, 0.0355, -0.165, 0));
      const caulk = grp(box(0.006, 0.006, 0.6, m.seal, 0.0295, -0.1285, 0));
      return { parts: [
        { id: 'stud', name: 'Stud', group: stud, explode: [-0.16, 0, 0], anchor: [-0.045, 0.25, 0.0], flag: 'T', spec: 'The wall frame from Step 3. The sheets are fixed to it in Step 12, and paint never touches it. The stud is drawn taller than the wall so it can be seen.', desc: 'Behind the sheet.' },
        { id: 'sheet', name: 'Wall sheet', group: sheet, explode: [-0.08, 0, 0], anchor: [0.0068, 0.2, 0.25], flag: 'T', spec: 'The plasterboard from Step 12. Its tapered edges recess the joint so the set can finish flush.', desc: 'Two sheets meet over the stud.' },
        { id: 'joint', name: 'Taped and set joint', group: joint, explode: [0.0, 0, 0], anchor: [0.017, 0.17, 0.0], flag: 'T', spec: 'Paper tape bedded in compound and finished with set coats in Step 12. The finish level decides how much work the surface needs before paint. It is sanded smooth and dusted off before sealing.', desc: 'The joint shows through thin paint if it is not finished well.' },
        { id: 'sealer', name: 'Sealer coat', group: sealer, explode: [0.08, 0, 0], anchor: [0.0195, 0.12, 0.22], flag: 'T', spec: 'A sealer or primer evens out the porosity of the set joints and the sheet paper so the finish coats take evenly. The product and the spread rate are on the maker\'s data sheet.', desc: 'The first coat on new plasterboard.' },
        { id: 'coat1', name: 'First finish coat', group: coat1, explode: [0.16, 0, 0], anchor: [0.022, 0.03, -0.22], flag: 'T', spec: 'The maker sets the coverage and the recoat time. Painting must follow the maker\'s instructions and the recommendations of AS/NZS 2311, which was not opened (BPC 16.1).', desc: 'Cut in at the edges and rolled.' },
        { id: 'coat2', name: 'Second finish coat', group: coat2, explode: [0.24, 0, 0], anchor: [0.025, -0.1, 0.1], flag: 'V', src: 'bpcTol26', spec: 'Runs, sags, wrinkling, dust, bare or starved areas, colour variations and coarse brush marks are outside tolerance (16.2). Interior coatings must last 36 months from completion (Table 16.5).', desc: 'The coat that is judged at handover.' },
        { id: 'skirt', name: 'Skirting, gloss coat', group: skirt, explode: [0.34, 0, 0], anchor: [0.0355, -0.165, 0.25], flag: 'V', src: 'bpcTol26', spec: 'Skirting is fixed in Step 13 and painted in gloss or semi-gloss. Gaps in skirting over 2 mm within 24 months are outside tolerance, so gaps are filled before the last coat.', desc: 'Painted with a brush after the walls.' },
        { id: 'caulk', name: 'Flexible filler line', group: caulk, explode: [0.3, 0.07, 0], anchor: [0.0295, -0.1285, -0.2], flag: 'T', spec: 'A flexible, paintable filler closes the gap between the skirting and the wall so the paint line is straight. The model draws it blue so it can be seen. Real filler is painted over.', desc: 'Applied before the last coat.' },
      ] };
    },
  },

  fitoff: {
    title: 'Power point: box, mechanism and plate in a wall', sub: 'Stud, wall sheet with its cut-out, mounting box, cable, socket mechanism, the wall paint cut in round the box and the cover plate. The box and plate are drawn larger than real',
    floor: -0.27, gridSize: 2, camera: { pos: [0.75, 0.32, 0.8], target: [0.04, 0.0, 0.0] },
    build(kit) {
      const { box, rod } = kit, m = MAT(kit);
      const sh = (y0, y1, z0, z1, mt, x, th) => box(th, y1 - y0, z1 - z0, mt, x, (y0 + y1) / 2, (z0 + z1) / 2);
      const ring = (x, th, mt, h) => [sh(h, 0.2, -0.2, 0.2, mt, x, th), sh(-0.2, -h, -0.2, 0.2, mt, x, th), sh(-h, h, -0.2, -h, mt, x, th), sh(-h, h, h, 0.2, mt, x, th)];
      const stud = grp(box(0.09, 0.46, 0.045, m.timber, -0.045, 0, -0.085));
      const sheet = grp(...ring(0.00675, 0.0135, m.board, 0.045));
      const paint = grp(...ring(0.0150, 0.003, m.paintW, 0.045));
      const bx = grp(box(0.003, 0.088, 0.088, m.tin2, -0.035, 0, 0), box(0.05, 0.003, 0.088, m.tin2, -0.0115, 0.0425, 0), box(0.05, 0.003, 0.088, m.tin2, -0.0115, -0.0425, 0), box(0.05, 0.082, 0.003, m.tin2, -0.0115, 0, -0.0425), box(0.05, 0.082, 0.003, m.tin2, -0.0115, 0, 0.0425));
      const cable = grp(rod([-0.03, 0.235, 0.02], [-0.03, 0.043, 0.02], 0.007, m.orange, 8));
      const mech = grp(box(0.025, 0.06, 0.06, m.white, 0.0, 0, 0), box(0.004, 0.01, 0.01, m.dark, 0.0145, 0.012, -0.016), box(0.004, 0.01, 0.01, m.dark, 0.0145, 0.012, 0.016), box(0.004, 0.01, 0.01, m.dark, 0.0145, -0.015, 0));
      const plate = grp(box(0.004, 0.115, 0.115, m.white, 0.0175, 0, 0), box(0.002, 0.012, 0.004, m.dark, 0.0205, 0.012, -0.016), box(0.002, 0.012, 0.004, m.dark, 0.0205, 0.012, 0.016), box(0.002, 0.012, 0.004, m.dark, 0.0205, -0.012, 0));
      return { parts: [
        { id: 'stud', name: 'Stud', group: stud, explode: [-0.18, 0, 0], anchor: [-0.045, -0.23, -0.085], flag: 'T', spec: 'The frame from Step 3. The box is fixed to the framing or a nogging, and not to the plasterboard alone.', desc: 'Drawn taller than the wall so it shows.' },
        { id: 'sheet', name: 'Wall sheet with cut-out', group: sheet, explode: [-0.06, 0, 0], anchor: [0.0068, 0.19, 0.17], flag: 'T', spec: 'The sheet from Step 12, cut out for the box. The cut-out is the electrician\'s and is made after the sheet is up.', desc: 'The hole is slightly larger than the box.' },
        { id: 'cable', name: 'Sheathed cable', group: cable, explode: [-0.12, 0.1, 0], anchor: [-0.03, 0.23, 0.02], flag: 'C', spec: 'The cable was run in Step 9. Its size, how many cables a box takes, and the rules for holes in studs come from AS/NZS 3000, which was not opened.', desc: 'Comes down the wall cavity to the box.' },
        { id: 'box', name: 'Flush mounting box', group: bx, explode: [0.02, 0, 0], anchor: [-0.0115, -0.0425, 0.0], flag: 'T', spec: 'A flush box set into the sheet and fixed to the framing. The box type and depth are the electrician\'s.', desc: 'A hollow shell, drawn thin.' },
        { id: 'mech', name: 'Socket mechanism', group: mech, explode: [0.12, 0, 0], anchor: [0.0, -0.03, 0.03], flag: 'V', src: 'esvCoesConsumers', spec: 'Wired, fixed and tested by a registered electrical contractor or licensed electrician. A builder cannot do the work unless licensed. Every installation needs a Certificate of Electrical Safety.', desc: 'Connects the cable to the plug.' },
        { id: 'paint', name: 'Wall paint, cut in round the box', group: paint, explode: [0.11, 0, 0], anchor: [0.015, -0.15, 0.17], flag: 'T', spec: 'The painter cuts in round the boxes and leaves the mechanisms out so the plates sit on a clean finish.', desc: 'Painted before the plate goes on.' },
        { id: 'plate', name: 'Cover plate', group: plate, explode: [0.25, 0, 0], anchor: [0.0185, 0.0575, 0.0575], flag: 'V', src: 'bpcTol26', spec: 'Electrical work is outside tolerance if a product, fixture or fitting appears out of level, or inconsistent with similar installations, from a normal viewing position (19).', desc: 'Fitted last, straight and level.' },
      ] };
    },
  },

  basin: {
    title: 'Vanity basin, mixer, valves and trap', sub: 'Wall with the supply and waste pipes, the cabinet, the stone top, the basin, the mixer tap, flexible hoses, isolating valves and the trap. Sizes are illustrative, and the basin is a drop-in bowl',
    floor: -0.37, gridSize: 2, camera: { pos: [0.9, 0.5, 1.4], target: [0.0, 0.1, -0.03] },
    build(kit) {
      const { box, cyl, rod } = kit, m = MAT(kit);
      const wall = grp(box(0.95, 0.7, 0.013, m.board, 0, 0.0, -0.2065), rod([0.06, -0.02, -0.2], [0.06, -0.02, -0.19], 0.02, m.dark, 10));
      const cab = grp(box(0.02, 0.5, 0.4, m.vcab, -0.34, -0.1, 0), box(0.02, 0.5, 0.4, m.vcab, 0.34, -0.1, 0), box(0.7, 0.02, 0.4, m.vcab, 0, -0.34, 0), box(0.7, 0.05, 0.02, m.vcab, 0, 0.115, 0.19));
      const top = grp(box(0.74, 0.025, 0.44, m.stone, 0, 0.1625, 0));
      const basin = grp(box(0.4, 0.08, 0.3, m.ceram, 0, 0.215, 0.0), box(0.34, 0.006, 0.24, m.water, 0, 0.255, 0.0));
      const tap = grp(cyl(0.014, 0.12, m.steel, 0, 0.315, -0.1, 12), rod([0, 0.35, -0.1], [0, 0.34, -0.02], 0.011, m.steel, 8), box(0.05, 0.012, 0.012, m.steel, 0, 0.385, -0.1));
      const hoses = grp(rod([-0.03, 0.2, -0.1], [-0.03, 0.0, -0.1], 0.007, m.tin, 6), rod([-0.03, 0.0, -0.1], [-0.12, -0.12, -0.17], 0.007, m.tin, 6), rod([0.03, 0.2, -0.1], [0.03, 0.0, -0.1], 0.007, m.red, 6), rod([0.03, 0.0, -0.1], [0.14, -0.12, -0.17], 0.007, m.red, 6));
      const valves = grp(cyl(0.02, 0.05, m.brass, -0.12, -0.12, -0.17, 12), cyl(0.02, 0.05, m.brass, 0.14, -0.12, -0.17, 12), rod([-0.12, -0.12, -0.19], [-0.12, -0.12, -0.2], 0.012, m.steel, 8), rod([0.14, -0.12, -0.19], [0.14, -0.12, -0.2], 0.012, m.steel, 8));
      const trap = grp(rod([0.0, 0.17, 0.0], [0.0, -0.02, 0.0], 0.018, m.steel, 10), rod([0.0, -0.02, 0.0], [0.0, -0.06, 0.0], 0.018, m.steel, 10), rod([0.0, -0.06, 0.0], [0.06, -0.06, 0.0], 0.018, m.steel, 10), rod([0.06, -0.06, 0.0], [0.06, -0.02, 0.0], 0.018, m.steel, 10), rod([0.06, -0.02, 0.0], [0.06, -0.02, -0.19], 0.018, m.steel, 10));
      return { parts: [
        { id: 'wall', name: 'Wall with the supply and waste pipes', group: wall, explode: [0, 0, -0.25], anchor: [-0.3, 0.25, -0.2], flag: 'V', src: 'vbaCert', spec: 'The pipes in the wall were roughed in and tested in Step 8, before the lining went on. The plumber gives the compliance certificate to the owner within five days of completing the work and lodges it with the VBA within five days.', desc: 'Cut away to show the pipes coming through.' },
        { id: 'cab', name: 'Vanity cabinet', group: cab, explode: [0, -0.1, 0], anchor: [-0.3, -0.25, 0.2], flag: 'T', spec: 'Fixed to the wall framing in Step 13 with room round the pipes. Heights and sizes are the supplier\'s.', desc: 'Drawn open at the front and back so the pipes show.' },
        { id: 'top', name: 'Stone top', group: top, explode: [0, 0.03, 0], anchor: [0.3, 0.1625, 0.2], flag: 'T', spec: 'A top with a cut-out for the basin, sealed at the wall with a flexible sealant so water does not run behind it (Typical).', desc: 'Sits on the cabinet.' },
        { id: 'basin', name: 'Basin', group: basin, explode: [0, 0.1, 0], anchor: [0.2, 0.215, 0.15], flag: 'V', src: 'bpcTol26', spec: 'Sanitary fixtures such as basins are outside tolerance if they retain water after they are drained, other than surface-tension water (10.4). Fixtures are viewed from 600 mm (21.1).', desc: 'The water drains away and does not stand.' },
        { id: 'tap', name: 'Mixer tap', group: tap, explode: [0, 0.17, 0], anchor: [0.0, 0.385, -0.1], flag: 'V', src: 'bpcTol26', spec: 'Water supply fixtures are outside tolerance if they leak or drip within 3 months of completion, or are not located to fully and clearly discharge into the basin (10.3).', desc: 'The spout must discharge into the bowl.' },
        { id: 'hoses', name: 'Flexible hoses', group: hoses, explode: [0.0, 0.0, 0.15], anchor: [0.03, 0.1, -0.1], flag: 'T', spec: 'Braided hoses connect the tap tails to the isolating valves. Check each connection for drips when the water is first turned on (Typical).', desc: 'Blue is cold and red is hot.' },
        { id: 'valves', name: 'Isolating valves', group: valves, explode: [0, -0.06, 0.15], anchor: [0.14, -0.12, -0.17], flag: 'T', spec: 'Each supply has its own valve so the fixture can be shut off without shutting off the house (Typical). The hot supply comes from the tempering valve fitted in Step 8, which keeps outlets at or below 50 degrees Celsius.', desc: 'A quarter-turn valve on each supply.' },
        { id: 'trap', name: 'Trap and waste', group: trap, explode: [0, -0.1, 0.18], anchor: [0.06, -0.06, 0.0], flag: 'C', spec: 'A trap holds a water seal that keeps drain gas out. Trap size and the fall of the waste come from AS/NZS 3500, which was not opened.', desc: 'Tailpiece, U-bend and the waste into the wall.' },
      ] };
    },
  },
};

export default {
  n: 15, id: 'paint', title: 'Painting and the final fix', subtitle: 'Preparation and masking, ceilings, walls and trims painted, plumbing and electrical fit-off, commissioning and testing, cleaning, defects and certificates.',
  phases, build, details, drawings, howto, trades, materials, quotes, quoteTips, inspections, exam, sources, caution,
};

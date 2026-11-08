// Step 8: plumbing and drainage rough-in. A licensed plumber and drainer run the external sewer drain (tested and inspected before backfill), then rough in the
// waste, soil, vent, cold water, hot water and gas pipes inside the frame, fit the pressure-limiting and tempering valves, test everything and hand over certificates.
// Sizes and layouts are typical. Rules marked Verified come from the VBA and BPC pages and the ABCB's free NCC 2022 Volume Three pages named in Sources; the
// AS/NZS 3500 and gas Standards are paywalled and were not opened, so pipe sizes, grades, test heads and test times are Typical or Confirm.
import * as THREE from 'three';
import step7 from './step-07.js';
import { grp } from './step-06.js';
import { HOUSE, BASE_COLLIDERS, MAP } from './site.js';
import { svg, T, L, R, C as Circ, dim, call, arrow } from './dwg.js';
import { F, wallInfo, wallMembers, mergeBoxes } from './frame.js';
import { PLATE_TOP, yc } from './step-04.js';

const { x0: X0, x1: X1, z0: Z0, z1: Z1 } = HOUSE;
const Y0 = F.SLAB;                                  // top of the slab
const CY = PLATE_TOP + 0.07, HY = PLATE_TOP + 0.15, VY = PLATE_TOP + 0.25;   // cold, hot and vent runs in the ceiling space
const VX = 2.0, VZ = 4.0, VROOF = PLATE_TOP + yc(VX) + 0.14 - 0.2;           // where the Step 5 roof vent pipe starts
const SX = -3.6, SZ = 5.4;                          // stack foot: the Step 2 sewer riser beside the wall
const FWX = -3.6, FWZ = 2.4;                        // floor waste: the other Step 2 sewer riser
const MX = -2, MZ = 7;                              // the Step 2 water riser
const TX = -3.6, TZ0 = -16.5, TZ1 = -5.6, ZU = TZ1 - 0.35;   // external drain trench: boundary end, house end, test point
const HX = -5.61, HZ = 1.22;                        // hot water unit, outside the west wall

const phases = [
  { title: 'Plumber, consent and delivery', text: 'Check the plumber\'s licence and the water authority\'s consent to connect. Pipes, fittings and the hot water unit are delivered. The bathroom walls are framed (added to this model, since the Step 3 frame has none).' },
  { title: 'Drain trench and pipe laid', text: 'The drainer opens the trench from the house to the sewer connection, beds the pipe in sand to a continuous fall and keeps every joint visible.' },
  { title: 'Drain test and inspection', text: 'The drain is put on test while the trench is open and the VBA inspection is booked. Nothing is covered until the inspection is done.' },
  { title: 'Backfill, waste and vent pipes', text: 'The trench is backfilled. The plumber roughs in the soil stack, branch wastes and the vent through the roof. Ghost shapes show where the fixtures will go.' },
  { title: 'Water, hot water and gas pipes', text: 'Cold and hot pipes go in through the ceiling space and walls, the pressure-limiting valve is fitted, the hot water unit is hung outside with its tempering valve and the gas line is run from the meter.' },
  { title: 'Pressure and leak tests', text: 'Every system is tested before the walls are lined: pressure gauge on the water, air or water test on the drains and a gas leak test.' },
  { title: 'Certificates and the record', text: 'The licensed plumber\'s compliance certificates go to the owner and the VBA, and test records, photographs and the as-laid plan go on file.' },
];

/* ---------- walk scene ---------- */
function build(kit) {
  const { C, mat, box, cyl, rod, pipe, textPlane, ghost, boxUV } = kit;
  const mk = (n) => { const g = new THREE.Group(); g.name = n; return g; };
  const s7 = step7.build(kit);
  // keep the finished house from Step 7 with its windows, minus the stock, doors and check sign. The roof cladding is hidden so you can see in.
  const HIDE = ['crates', 'rack', 'garage', 'check', 'doors', 'sealsD', 'hardware', 'labels', 'tiles', 'sarking', 'ridge', 'amenities'];
  const layers = s7.layers.filter((l) => !HIDE.includes(l.group.name)).map(({ group }) => ({ group }));

  const timber = mat(0xffffff, { tex: 'timber' }), plank = timber, card = mat(0xc8ad82, { roughness: 0.9 }), steel = mat(0x9aa3ad, { metalness: 0.5, roughness: 0.45 });
  const m = {
    cold: mat(0x2f7fd6, { roughness: 0.45 }), hot: mat(0xd8383a, { roughness: 0.45 }), waste: mat(0xd7d9dd, { roughness: 0.5 }), sewer: mat(0x8a5a3c, { roughness: 0.6 }),
    gas: mat(0xe6c200, { roughness: 0.5 }), brass: mat(0xc9a24a, { metalness: 0.7, roughness: 0.35 }), white: mat(0xf4f4f2, { roughness: 0.35 }), copper: mat(0xb87333, { metalness: 0.7, roughness: 0.4 }),
    soil: mat(0xffffff, { tex: 'soil' }), sand: mat(0xffffff, { tex: 'sand' }), conc: mat(0xffffff, { tex: 'concrete' }), dark: mat(0x1b1d20, { roughness: 0.7 }),
  };
  const cap = (g, p, r, mt = m.brass) => { const s = new THREE.Mesh(new THREE.SphereGeometry(r, 10, 8), mt); s.position.set(...p); s.castShadow = true; g.add(s); };
  const post = (g, x, z, h = 1.6) => g.add(cyl(0.04, h, mat(C.steel), x, h / 2, z, 8));

  // bathroom partition walls (timber frames built like the Step 3 walls), added to the model
  const parts = mk('partitions');
  for (const w of [
    { id: 'p1', ext: false, a: [-5.26, 1.2], b: [-2.0, 1.2], open: [] },
    { id: 'p2', ext: false, a: [-2.0, 1.245], b: [-2.0, 5.455], open: [{ at: 3.6, w: 0.82, sill: 0 }] },
  ]) {
    const wi = wallInfo(w), mem = wallMembers(wi.len, wi.open, { plate2: true });
    const pv = new THREE.Group(); pv.position.set(wi.a[0], Y0, wi.a[1]); pv.rotation.y = wi.theta;
    pv.add(mergeBoxes(mem.frame, timber, boxUV)); const p2 = mergeBoxes(mem.plate2, timber, boxUV); if (p2) pv.add(p2);
    parts.add(pv);
  }

  // Step 1 site shed omitted here: it would sit across the sewer trench (x -3.6, z -16.5..-5.6). Toilet, skip, power pole and timber stay.
  const amen = mk('amen');
  amen.add(box(1, 2.2, 1, mat(0x3a7bd5), -5.4, 1.1, 14.6), box(0.5, 1.6, 0.04, mat(0x2a5ea8), -5.4, 1.0, 15.12), box(3.2, 1.1, 1.7, mat(C.hivis), -3.2, 0.55, 14.6), box(1.2, 0.4, 2.4, timber, 5.4, 0.2, -12.5), cyl(0.1, 3.2, mat(0x6a5a45), -6.6, 1.6, 10.5, 8), box(0.35, 0.45, 0.2, mat(0xcfd2d6), -6.45, 1.3, 10.5));

  // delivery: pipes in a rack, PEX coils, copper, hot water unit carton, in the clear space between the skip and the entry
  const stock = mk('stock');
  for (const x of [-1.0, 0.8, 2.4]) stock.add(box(0.1, 0.1, 1.4, plank, x, 0.05, 13.1));
  for (const [dz, dy, r, mt] of [[12.7, 0.16, 0.055, m.waste], [12.81, 0.16, 0.055, m.waste], [12.92, 0.16, 0.055, m.waste], [12.755, 0.235, 0.04, m.waste], [12.865, 0.235, 0.04, m.waste], [12.81, 0.3, 0.025, m.waste], [13.18, 0.16, 0.055, m.sewer], [13.29, 0.16, 0.055, m.sewer]]) stock.add(rod([-1.1, dy, dz], [2.7, dy, dz], r, mt, 10));
  for (const [x, z, mt] of [[-0.4, 14.1, m.cold], [0.5, 14.1, m.hot]]) { const t = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.03, 8, 28), mt); t.rotation.x = Math.PI / 2; t.position.set(x, 0.06, z); t.castShadow = true; stock.add(t); }
  for (let i = 0; i < 4; i++) stock.add(rod([1.2, 0.34 + i * 0.024, 14.0], [2.6, 0.34 + i * 0.024, 14.0], 0.011, m.copper, 8));
  stock.add(box(0.5, 0.78, 0.34, card, 2.2, 0.39, 14.6), box(0.5, 0.05, 0.4, plank, 2.2, 0.03, 14.6));

  // pipe colour key and the standards sign
  const legend = mk('legend'), key = textPlane(['PIPE COLOURS IN THIS MODEL', 'Blue cold water    Red hot water', 'Grey waste and vent    Brown sewer', 'Yellow gas'], 2.3, 1.05);
  key.position.set(-7.8, 1.55, 15.6); legend.add(key); post(legend, -8.9, 15.68); post(legend, -6.7, 15.68);

  // the authority's sewer connection point at the rear: a marked cover and a peg
  const conn = mk('conn'); conn.add(cyl(0.3, 0.04, m.conc, TX, 0.02, TZ0 - 0.3, 20), cyl(0.2, 0.02, steel, TX, 0.05, TZ0 - 0.3, 20), cyl(0.03, 0.9, mat(C.orange), TX + 0.5, 0.45, TZ0 - 0.3, 8));
  const csign = textPlane(['SEWER CONNECTION POINT', 'Water authority consent first'], 1.5, 0.6); csign.position.set(TX + 0.9, 0.95, TZ0 - 0.3); csign.rotation.y = -0.5; conn.add(csign); post(conn, TX + 0.2, TZ0 - 0.3, 0.7); post(conn, TX + 1.6, TZ0 - 0.3, 0.7);
  // the external drain: a dark strip on the ground stands in for the open trench
  const len = TZ1 - TZ0, mid = (TZ0 + TZ1) / 2, trench = mk('trench');
  trench.add(box(0.64, 0.02, len, mat(0xffffff, { tex: 'soil', color: 0x4e3a28 }), TX, 0.011, mid), box(0.46, 0.03, len - 0.1, m.sand, TX, 0.035, mid), rod([TX, 0.085, TZ1], [TX, 0.085, TZ0], 0.055, m.sewer, 12));
  for (let z = TZ1 - 0.4; z > TZ0; z -= 1.1) trench.add(box(0.5, 0.04, 0.05, m.sewer, TX, 0.085, z), box(0.04, 0.4, 0.5, plank, TX - 0.34, 0.2, z), box(0.04, 0.4, 0.5, plank, TX + 0.34, 0.2, z), box(0.64, 0.05, 0.05, plank, TX, 0.36, z));
  for (let z = -7; z > TZ0; z -= 2.4) trench.add(cyl(0.55, 0.4, m.soil, TX + 1.0, 0.2, z, 12, false, 0.1));
  const dtest = mk('dtest'), tw = new THREE.Mesh(new THREE.CylinderGeometry(0.034, 0.034, 1.25, 14), ghost(0x58a6ff, 0.75)); tw.position.set(TX, 0.75, ZU); dtest.add(tw);
  dtest.add(rod([TX, 0.09, ZU], [TX, 1.5, ZU], 0.045, m.waste, 12), cyl(0.07, 0.03, steel, TX, 1.52, ZU, 18));
  const tsign = textPlane(['DRAIN ON TEST', 'VBA inspection booked', 'Do not backfill until passed'], 1.6, 0.8); tsign.position.set(TX - 1.5, 1.1, ZU); tsign.rotation.y = 0.5; dtest.add(tsign); post(dtest, TX - 1.9, ZU - 0.1, 1.0); post(dtest, TX - 1.1, ZU + 0.1, 1.0);
  const backfill = mk('backfill'), io = mat(0xffffff, { tex: 'soil', color: 0xb89a78 });
  backfill.add(box(0.8, 0.03, len, io, TX, 0.015, mid), cyl(0.1, 0.05, m.waste, TX, 0.03, ZU, 18), cyl(0.12, 0.012, steel, TX, 0.06, ZU, 18), cyl(0.025, 0.55, mat(C.orange), TX + 0.5, 0.27, TZ0 + 0.2, 8));

  // waste, soil and vent
  const waste = mk('waste'), fx = mk('fixtures'), gh = ghost(0xaee0ff, 0.35), gw = ghost(0xffffff, 0.4);
  waste.add(rod([SX, Y0, SZ], [SX, VY, SZ], 0.055, m.waste, 14), cyl(0.075, 0.03, m.waste, SX, Y0 + 0.015, SZ, 18));
  waste.add(pipe([[-3.2, Y0 + 0.18, SZ], [SX, Y0 + 0.18, SZ]], 0.05, m.waste));
  waste.add(pipe([[-2.4, Y0 + 0.55, 5.53], [-2.4, Y0 + 0.5, 5.53], [SX, Y0 + 0.5, 5.53], [SX, Y0 + 0.5, SZ + 0.06]], 0.02, m.waste));
  waste.add(pipe([[SX, VY, SZ], [VX, VY, SZ], [VX, VY, VZ], [VX, VROOF, VZ]], 0.04, m.waste));
  waste.add(cyl(0.075, 0.025, m.waste, FWX, Y0 + 0.012, FWZ, 18)); cap(waste, [-3.2, Y0 + 0.18, SZ], 0.052, m.waste); cap(waste, [-2.4, Y0 + 0.57, 5.53], 0.024, m.waste);
  const wcP = box(0.38, 0.4, 0.55, gw, -3.2, Y0 + 0.2, 5.1), cist = box(0.38, 0.45, 0.14, gw, -3.2, Y0 + 0.7, 5.4), van = box(0.5, 0.82, 0.45, gw, -2.4, Y0 + 0.41, 5.22), sh = box(1.2, 0.02, 1.2, gh, -3.6, Y0 + 0.01, 1.85);
  fx.add(wcP, cist, van, sh);
  for (const [t, x, z] of [['WC', -3.2, 4.75], ['BASIN', -2.35, 4.9], ['SHOWER', -3.6, 1.85]]) { const l = textPlane([t], 0.5, 0.2); l.rotation.x = -Math.PI / 2; l.position.set(x, Y0 + 0.03, z); fx.add(l); }

  // cold water, hot water, hot water unit, gas
  const cold = mk('cold'), hot = mk('hot'), hwu = mk('hwu'), gas = mk('gas'), plv = mk('plv');
  cold.add(pipe([[MX, Y0, MZ], [MX, CY, MZ], [MX, CY, 1.2], [-4.1, CY, 1.17], [-4.1, 0.95, 1.17], [HX, 0.95, 1.17], [HX, 1.05, 1.17]], 0.015, m.cold));
  cold.add(pipe([[MX, CY, 5.5], [-3.2, CY, 5.49], [-3.2, Y0 + 0.5, 5.49]], 0.012, m.cold), pipe([[-2.34, CY, 5.49], [-2.34, Y0 + 0.55, 5.49]], 0.012, m.cold), pipe([[-3.52, CY, 1.17], [-3.52, 1.3, 1.17]], 0.012, m.cold));
  for (const p of [[-3.2, Y0 + 0.5, 5.49], [-2.34, Y0 + 0.55, 5.49], [-3.52, 1.3, 1.17]]) cap(cold, p, 0.02);
  hot.add(pipe([[HX, 1.05, 1.225], [HX, 0.9, 1.225]], 0.015, m.hot), pipe([[HX, 0.76, 1.225], [HX, 0.72, 1.225], [-3.68, 0.72, 1.225], [-3.68, 1.3, 1.225]], 0.015, m.hot));
  hot.add(pipe([[-3.0, 0.72, 1.225], [-3.0, HY, 1.225], [-2.1, HY, 1.225], [-2.1, HY, 5.55], [-2.46, HY, 5.55], [-2.46, Y0 + 0.55, 5.55]], 0.012, m.hot));
  for (const p of [[-3.68, 1.3, 1.225], [-2.46, Y0 + 0.55, 5.55]]) cap(hot, p, 0.02);
  hot.add(rod([-3.6, 1.3, 1.23], [-3.6, Y0 + 2.0, 1.23], 0.011, m.copper, 8));
  hwu.add(box(0.22, 0.62, 0.36, m.white, HX, 1.05 + 0.31, HZ), box(0.02, 0.5, 0.3, steel, HX + 0.115, 1.36, HZ), box(0.03, 0.72, 0.3, steel, -5.515, 1.4, HZ), cyl(0.055, 0.2, steel, HX, 1.05 + 0.62 + 0.1, HZ, 16), cyl(0.09, 0.06, steel, HX, 1.05 + 0.62 + 0.23, HZ, 16, false, 0.04));
  hwu.add(box(0.07, 0.11, 0.07, m.brass, HX, 0.83, 1.225), pipe([[HX, 0.95, 1.17], [HX, 0.86, 1.17], [HX, 0.86, 1.2]], 0.01, m.cold));
  gas.add(box(0.2, 0.45, 0.35, mat(0x7d8791, { metalness: 0.4, roughness: 0.5 }), -5.62, 0.45, 10.0), cyl(0.06, 0.1, m.gas, -5.62, 0.72, 10.0, 14));
  gas.add(pipe([[HX, 1.05, 1.32], [HX, 0.62, 1.32], [HX, 0.6, 1.32], [HX, 0.6, 9.8]], 0.012, m.gas), box(0.05, 0.05, 0.05, m.gas, HX, 0.85, 1.32));
  for (let z = 2.2; z < 9.6; z += 1.2) gas.add(box(0.03, 0.04, 0.03, steel, -5.585, 0.6, z));
  const hv = cyl(0.032, 0.14, m.brass, MX, 0.7, MZ, 14); plv.add(hv, cyl(0.045, 0.05, m.hot, MX, 0.8, MZ, 14), cyl(0.035, 0.08, m.brass, MX, 0.45, MZ, 14), box(0.12, 0.02, 0.02, m.cold, MX + 0.06, 0.52, MZ));
  const meter = mk('meter'); meter.add(box(0.38, 0.05, 0.28, m.conc, -2, 0.025, 17.2), pipe([[-2, 0.04, 17.2], [MX, 0.04, 17.0]], 0.02, m.cold));
  const wl = textPlane(['W'], 0.22, 0.2); wl.rotation.x = -Math.PI / 2; wl.position.set(-2, 0.056, 17.2); meter.add(wl);

  // pressure test rig
  const ptest = mk('ptest'), gg = cyl(0.075, 0.035, steel, MX, 0.98, MZ + 0.1, 24); gg.rotation.x = Math.PI / 2; const gf = cyl(0.062, 0.006, m.white, MX, 0.98, MZ + 0.12, 24); gf.rotation.x = Math.PI / 2;
  ptest.add(gg, gf, rod([MX, 0.9, MZ], [MX, 0.98, MZ + 0.1], 0.012, m.brass, 8), rod([HX - 0.0, 0.7, 9.8], [HX, 0.7, 9.8], 0.01, m.gas, 6));
  const psign = textPlane(['PRESSURE TEST', 'Pipes charged, no loss allowed', 'Read static pressure: 500 kPa or less'], 1.8, 0.85); psign.position.set(-0.8, 1.45, 7.6); ptest.add(psign); post(ptest, -1.6, 7.68); post(ptest, 0.0, 7.68);
  const check = mk('check'), sign = textPlane(['CHECK POINT: PLUMBING', 'Certificates of compliance to the owner', 'Test results, photos and as-laid plan on file'], 1.9, 0.9);
  sign.position.set(0, 1.5, Z1 + 1.3); check.add(sign); post(check, -0.85, Z1 + 1.4); post(check, 0.85, Z1 + 1.4);

  layers.push({ group: parts }, { group: amen }, { group: stock, until: 4 }, { group: legend }, { group: meter }, { group: conn }, { group: trench, from: 1, until: 3 }, { group: dtest, from: 2, until: 3 }, { group: backfill, from: 3 },
    { group: waste, from: 3 }, { group: fx, from: 3 }, { group: cold, from: 4 }, { group: hot, from: 4 }, { group: hwu, from: 4 }, { group: gas, from: 4 }, { group: plv, from: 4 },
    { group: ptest, from: 5, until: 6 }, { group: check, from: 6 });

  const ring = [{ x0: -5.7, x1: 5.7, z0: -5.7, z1: -5.3 }, { x0: -5.7, x1: -5.3, z0: -5.7, z1: 11.7 }, { x0: 5.3, x1: 5.7, z0: -5.7, z1: 11.7 }, { x0: -5.7, x1: 0.9, z0: 11.3, z1: 11.7 }, { x0: 2.1, x1: 5.7, z0: 11.3, z1: 11.7 }];
  return {
    layers, colliders: [...BASE_COLLIDERS, ...ring], tickers: s7.tickers,
    spawn: { pos: [4, 18.5], yaw: 0, pitch: 0.2 }, map: MAP,
    orbit: { pos: [9, 12, 7], target: [-3, 0.5, 3.2] },
    hotspots: HOTSPOTS,
  };
}

const HOTSPOTS = [
  { id: 'licence', title: 'Licensed plumber and certificate', pos: [0.9, 0.95, 13.1], stand: [2.6, 16.6], from: 0, until: 4, drawing: 'cert',
    summary: 'Plumbing is a regulated trade in Victoria. Only a licensed plumber can issue a compliance certificate, so check the licence and the class of work before you take quotes, not after the pipes are in.',
    learn: [['Only a licensed plumber can issue a compliance certificate. A registered plumber cannot.', 'V', 'vbaCert'], ['A certificate is needed for plumbing work worth $750 or more (including materials, appliances and fixtures), below-ground sanitary drains, installing, relocating, replacing or converting a gas-using appliance, installing, modifying or relocating consumer gas piping, and cooling towers.', 'V', 'vbaCert'], ['Plumbers\' licensing and registration come from Part 12A of the Building Act 1993 and the Plumbing Regulations 2018, which took effect on 18 November 2018.', 'V', 'vbaPlumbFw'], ['The VBA registers plumbing practitioners by class of work, such as Drainage and Water supply. Drainage and water supply applicants must also have completed an accredited Install Trench Support course.', 'V', 'vbaDrainage'], ['Ask for the plumber\'s licence number and the class of work it covers, and check it on the VBA\'s register before signing. The register itself was not opened here.', 'T'], ['Keep the plumber\'s licence number, quote and certificate together in the job file. They are evidence for the BPC application.', 'T']] },
  { id: 'std', title: 'Plumbing Code and Standards', pos: [-7.8, 2.2, 15.6], stand: [-7.8, 19.4], from: 0,
    summary: 'Plumbing is built to the Plumbing Code of Australia, which is NCC Volume Three, and to the AS/NZS 3500 series it calls up. Work started on or after 20 October 2025 must follow the 2025 edition of that series.',
    learn: [['The Plumbing Code of Australia is NCC Volume Three. It applies to all building classes whenever plumbing work is carried out and is incorporated by the Building Act and the Plumbing Regulations, with some Victorian variations.', 'V', 'vbaPlumbFw'], ['AS/NZS 3500 has four parts: 1 cold water, 2 sanitary plumbing and drainage, 3 stormwater drainage and 4 heated water.', 'V', 'bpcStd3500'], ['The 2025 edition was published on 17 April 2025 and replaces the 2021 edition. All plumbing work commenced on or after 20 October 2025 must comply with it.', 'V', 'bpcStd3500'], ['The Standards are paywalled and were not opened. Pipe sizes, grades, test heads and test times come from the plumber and the Standard itself, not from this app.', 'C'], ['The Volume Three pages linked in this step are the NCC 2022 text. Which Volume Three edition applies to your permit was not confirmed.', 'C', 'nccB1']] },
  { id: 'consent', title: 'Sewer connection and consent to connect', pos: [TX, 1.3, TZ0 - 0.3], stand: [-6.4, -13.5], from: 0,
    summary: 'The drain ends at a connection to the sewer set by the water authority. The authority\'s consent to connect comes first. Stormwater has its own legal point of discharge and does not need a drain inspection.',
    learn: [['A consent to connect from the water authority comes first, before the drain inspection. Take its conditions to the inspection.', 'V', 'vbaDrainBook'], ['Take the as-laid plan and the soil classification report to the inspection as well, plus an expert report for highly or extremely reactive soils.', 'V', 'vbaDrainBook'], ['Below-ground sanitary drainage means the system from the above-ground sewage or waste pipes to a land application system, a holding tank connection or the connection with the sewerage authority\'s discharge system.', 'V', 'vbaDrainage'], ['Stormwater drainage does not need a VBA drain inspection. The legal point of discharge was covered in Step 5.', 'V', 'vbaDrainBook'], ['The authority\'s own fees, connection points and who builds the connection vary by area. Ask the local water authority.', 'C']] },
  { id: 'trench', title: 'Drain trench and pipe', pos: [-3.6, 1.0, -10.5], stand: [-6.5, -9.0], from: 1, until: 3, detail: 'trench', drawing: 'drainsec',
    summary: 'The drainer lays the sewer pipe on sand in a trench to a continuous fall toward the sewer. The pipe, joints and bedding must stay visible until the inspection passes. The ground is drawn flat here, so open the detail room for the true section.',
    learn: [['Drainage practitioners must complete an accredited Install Trench Support course, so the trench is shored or battered to suit its depth and soil.', 'V', 'vbaDrainage'], ['The VBA page lists trench excavation, trenchless technology and directional boring as excluded from drainage work, so an excavator can dig the trench. The drainer still lays and tests the pipe.', 'V', 'vbaDrainage'], ['Typical laying: sand bedding under and around the pipe, sockets facing upstream, joints made clean and square, and a continuous fall toward the sewer. Grades and bedding depths are set by AS/NZS 3500.2 and the authority, which were not opened.', 'C'], ['Part C1 changes AS/NZS 3500.2 so that pipework must be free of leaks under air test. Test durations were not on the page read.', 'V', 'nccC1'], ['Keep a sketch of the drain as laid, with measurements to fixed points, because it becomes the as-laid plan.', 'T']] },
  { id: 'dtest', title: 'Drain test and inspection', pos: [-3.6, 1.8, ZU], stand: [-6.4, -8.0], from: 2, until: 3, detail: 'trench', drawing: 'cert',
    summary: 'The drain is tested while the trench is open and a VBA auditor inspects it. Book the inspection early. If the work is not ready or fully visible, the booking can cost you an infringement notice.',
    learn: [['A below-ground sanitary drainage inspection must be booked in VBA360. Stormwater drainage needs none.', 'V', 'vbaDrainBook'], ['The work must be fully visible before it is backfilled. If no auditor attends, the trench may be backfilled 30 minutes after the booking time.', 'V', 'vbaDrainBook'], ['Bookings are 7 am to 4 pm Monday to Saturday and are made before 4 pm the day before. Cancellation rules apply.', 'V', 'vbaDrainBook'], ['The drain must be on test to the current standard when the auditor arrives.', 'V', 'vbaDrainBook'], ['Not being ready, or not attending, can bring an infringement under section 221ZP(3) of the Building Act 1993. A failed drain gets a rectification notice with 14 days to fix it and rebook.', 'V', 'vbaDrainBook'], ['The test head, method and duration come from AS/NZS 3500.2, which was not opened. The standpipe and water column in the model are for show.', 'C']] },
  { id: 'backfill', title: 'Backfill and inspection opening', pos: [-3.6, 0.8, -9.5], stand: [-6.4, -9.0], from: 3,
    summary: 'Once the drain has passed, the drainer backfills in layers, leaves an inspection opening at the surface, and finishes the as-laid plan. The certificate for below-ground sanitary drains is issued afterwards.',
    learn: [['Backfill only after the inspection has passed, or after the 30 minute window when no auditor attends.', 'V', 'vbaDrainBook'], ['A below-ground sanitary drain is on the list of work that needs a compliance certificate from a licensed plumber.', 'V', 'vbaCert'], ['Typical backfilling: sand around the pipe, then clean fill in compacted layers with no large stones against the pipe. Compaction and cover depth follow the Standard and the authority.', 'C'], ['Inspection openings stay accessible at the surface and are not paved over or buried.', 'T']] },
  { id: 'waste', title: 'Waste, soil and vent pipes', pos: [SX, 1.7, SZ - 0.1], stand: [-3.6, 3.1], from: 3, detail: 'stack', drawing: 'wastesch',
    summary: 'The soil stack carries toilet waste down to the drain and the vent carries air up to the roof, so the water seals in the traps are not sucked out or blown through. Fixtures are not fitted at this stage: ghost shapes show where they go.',
    learn: [['Trap seals must not drop below 70 mm in pressurised rooms or 25 mm elsewhere, at pressures up to plus or minus 375 Pa.', 'V', 'nccC1'], ['Ventilation (C1P5): the system must avoid hydraulic load imbalance, keeping trap-seal air pressure within plus or minus 375 Pa in at least 99% of annual peak-hour cases.', 'V', 'nccC1'], ['Water closets connect to the stack using sweep or 45 degree junctions.', 'V', 'nccC1'], ['Bends and branch length are limited, measured from the trap weir to the stack. The page read gives no numbers.', 'V', 'nccC1'], ['Pipe sizes follow the discharge units in Table C1V1b, whose values were not on the page. Typical sizes: 100 mm stack and WC branch, 40 or 50 mm for basins and showers.', 'T'], ['The vent goes through the roof with the flashing from Step 5. Its height and distance from openings are set by AS/NZS 3500.2, which was not opened.', 'C'], ['Stubs are capped until fit-off so nothing falls into the drain.', 'T']] },
  { id: 'water', title: 'Cold and hot water pipes', pos: [-3.6, 1.3, 1.2], stand: [-3.6, 3.6], from: 4, detail: 'water', drawing: 'watersch',
    summary: 'Cold and hot pipes run through the ceiling space and drop through the walls to capped stubs where the taps and mixers go. Pipes are clipped, kept apart and protected where nails and screws could reach them.',
    learn: [['A cold water service must be connected to a drinking water supply (B1P1).', 'V', 'nccB1'], ['Pipework velocity must not exceed 3 metres per second for more than 1% of the time in the annual peak hour (B1P2).', 'V', 'nccB1'], ['Shower, basin, kitchen sink and laundry outlets must flow no more than 9 litres a minute (B1P4).', 'V', 'nccB1'], ['Cold water services must comply with AS/NZS 3500.1 (B1D3). The service must avoid failure or uncontrolled discharge (B1P6).', 'V', 'nccB1'], ['Pipes, fittings and valves should carry WaterMark certification. Check the labels before they go in the wall. The scheme was not checked here.', 'C'], ['Pipes through studs and plates are clipped and protected with nail plates where a fixing could reach them. Pipes in the ceiling space are kept off the roof cladding and insulated.', 'T']] },
  { id: 'hwu', title: 'Hot water unit and tempering valve', pos: [-5.9, 1.55, HZ], stand: [-7.1, 3.3], from: 4, detail: 'hwu',
    summary: 'The hot water unit is hung outside the bathroom wall with a flue, a gas cock and cold and hot connections. A tempering valve on its hot outlet mixes in cold water so the taps never run too hot.',
    learn: [['Hot water at shower and tap outlets must not exceed 50 degrees Celsius. For early childhood centres, schools and nursing homes it is 45 degrees.', 'V', 'bpcHotWater'], ['Tempering valves reduce the temperature at the outlet. Systems installed before 5 August 1998 are unlikely to be tempered.', 'V', 'bpcHotWater'], ['Stored hot water should be above 60 degrees Celsius to prevent Legionella growth.', 'V', 'bpcHotWater'], ['Installing, relocating, replacing or converting a gas-using appliance needs a compliance certificate from a licensed plumber.', 'V', 'vbaCert'], ['The VBA water supply page lists thermostatic mixing valve work among the items excluded from that class (from 18 November 2019) and does not say which class covers it. Ask the plumber how the valve is certified.', 'C', 'vbaWater'], ['The flue terminal position, clearances from openings and the unit\'s installation rules come from the maker and the gas Standards, which were not opened. Part B2 of Volume Three covers heated water, but its page was not read.', 'C']] },
  { id: 'gas', title: 'Gas pipe and the gas appliance', pos: [-5.9, 0.9, 6.0], stand: [-7.1, 7.6], from: 4, detail: 'hwu',
    summary: 'Gas runs from the meter outside the house to each gas appliance in a fixed pipe. Gas fitting is licensed work. The pipe is tested for leaks and certified before the gas is turned on.',
    learn: [['Installing, modifying or relocating consumer gas piping needs a compliance certificate from a licensed plumber.', 'V', 'vbaCert'], ['The certificate goes to the owner within five days of completing the work and is lodged with the VBA within five days.', 'V', 'vbaCert'], ['Gas pipes are leak tested before the appliance is connected and the gas is turned on. Test pressure and time come from the gas Standard, which was not opened.', 'C'], ['The meter and regulator belong to the gas network and the connection is arranged with the retailer or distributor. This was not checked.', 'C'], ['Gas pipe is yellow in this model so it stands out. Real pipe marking follows the Standards.', 'C']] },
  { id: 'plv', title: 'Water pressure and the pressure-limiting valve', pos: [MX, 1.25, MZ], stand: [-2, 9.8], from: 4, detail: 'pressure', drawing: 'watersch',
    summary: 'Mains pressure can be too high for fixtures and pipes. The NCC sets a working pressure of at least 50 kPa and a static pressure of no more than 500 kPa. A pressure-limiting valve cuts it where it is too high.',
    learn: [['B1P5: working pressure not less than 50 kPa and static pressure not more than 500 kPa, or pressures suitable for correct fixture function.', 'V', 'nccB1'], ['Practice note CW 03 (version 3.0, 25 March 2026): the maximum static pressure at any outlet is 500 kPa, except fire service outlets. A pressure-limiting or pressure-reducing valve is needed above that.', 'V', 'bpcCW03'], ['Pressure can be measured at the meter outlet or at a garden tap.', 'V', 'bpcCW03'], ['Practitioners must tell the homeowner if the pressure exceeds 500 kPa and keep records.', 'V', 'bpcCW03'], ['The practice note cites NCC Volume Three B1P5 and B2P9 and AS/NZS 3500.1, 3500.4 and 4020.', 'V', 'bpcCW03'], ['Existing low-pressure gravity-only services are exempt from the 50 kPa and 500 kPa limits.', 'V', 'nccB1']] },
  { id: 'meter', title: 'Water meter and the W box', pos: [-2, 0.5, 17.2], stand: [-3.6, 15.4], from: 0, detail: 'pressure',
    summary: 'The water authority owns the meter. The plumber connects the house service from the meter outlet, and valves below ground inside the boundary have a surface box and riser marked W.',
    learn: [['Below-ground valves within the property boundary need a surface box and riser marked W (B1D3).', 'V', 'nccB1'], ['The cold water service must be connected to a drinking water supply (B1P1).', 'V', 'nccB1'], ['Static pressure can be measured at the meter outlet.', 'V', 'bpcCW03'], ['The NCC page read has no backflow requirement. The VBA water supply page says backflow prevention work is not in the water supply class, yet lists installing and connecting backflow devices as typical work, and does not reconcile the two. Ask the plumber and the authority what is needed.', 'C', 'vbaWater'], ['Meter size, who supplies it and connection fees are set by the water authority.', 'C']] },
  { id: 'ptest', title: 'Pressure and leak tests', pos: [-0.8, 1.9, 7.6], stand: [-0.8, 10.4], from: 5, until: 6, detail: 'pressure',
    summary: 'Before the walls are lined, every system is tested: a gauge on the water pipes, a leak test on the drains and a gas leak test. A leak found now is a quick repair. Behind a tiled wall it is a rebuild.',
    learn: [['Read the static pressure at the meter outlet or a garden tap and compare it with the 500 kPa limit.', 'V', 'bpcCW03'], ['Part C1 says sanitary pipework must be free of leaks under air test, as changed into AS/NZS 3500.2 clauses 15.1A and 15.3.3. The test durations were not on the page.', 'V', 'nccC1'], ['Water pipes are pressure tested and gas pipes leak tested before use. Test pressures and times come from the Standards and the maker\'s data, which were not opened.', 'C'], ['Photograph the pipes before the lining goes on. The photos show later trades where the pipes run.', 'T'], ['Keep the test results with the certificate in the job file.', 'T']] },
  { id: 'certs', title: 'Certificates and the record', pos: [0, 1.5, Z1 + 1.3], stand: [2.6, 15.8], from: 6, drawing: 'cert',
    summary: 'Before the lining goes on, the plumbing certificates and test records are on file. The licensed plumber gives the certificate to the owner and lodges it with the VBA, and the owner can complain if it is not issued.',
    learn: [['The licensed plumber gives the compliance certificate to the owner within five days of completing the work and lodges it with the VBA within five days.', 'V', 'vbaCert'], ['The owner should keep a copy and can complain through VBA360 if a certificate is not issued.', 'V', 'vbaCert'], ['If the contract ends early, the owner may be entitled to a certificate for the incomplete work, requested in writing.', 'V', 'vbaCert'], ['A certificate is needed for plumbing work worth $750 or more, below-ground sanitary drains, gas appliance and consumer gas piping work, and cooling towers.', 'V', 'vbaCert'], ['The surveyor will ask for the plumbing certificates at final inspection, so keep them with the as-laid plan and test records for the handover file in Step 18.', 'T']] },
];

/* ---------- 3D detail models ---------- */
const MAT = (kit) => {
  const { mat } = kit;
  return {
    timber: mat(0xffffff, { tex: 'timber' }), conc: mat(0xffffff, { tex: 'concrete' }), soil: mat(0xffffff, { tex: 'soil' }), soil2: mat(0xffffff, { tex: 'soil', color: 0xc2a27c }), sand: mat(0xffffff, { tex: 'sand' }),
    brick: mat(0xffffff, { tex: 'brick' }), cold: mat(0x2f7fd6, { roughness: 0.45 }), hot: mat(0xd8383a, { roughness: 0.45 }), waste: mat(0xd7d9dd, { roughness: 0.5 }), sewer: mat(0x8a5a3c, { roughness: 0.6 }),
    gas: mat(0xe6c200, { roughness: 0.5 }), brass: mat(0xc9a24a, { metalness: 0.7, roughness: 0.35 }), white: mat(0xf4f4f2, { roughness: 0.35 }), copper: mat(0xb87333, { metalness: 0.7, roughness: 0.4 }),
    steel: mat(0x9aa3ad, { metalness: 0.5, roughness: 0.45 }), dark: mat(0x1b1d20, { roughness: 0.7 }), ply: mat(0xe0c28c, { roughness: 0.8 }),
  };
};

const details = {
  trench: {
    title: 'Drain trench in section', sub: 'Ground, bedding, pipe, sand surround, backfill, test standpipe and inspection opening (sizes typical; the Standard governs)', floor: -0.9, gridSize: 3,
    camera: { pos: [2.15, 0.7, 2.3], target: [0, -0.3, 0] },
    build(kit) {
      const { box, rod, cyl, ghost } = kit, m = MAT(kit);
      // ground y = 0, pipe runs along z, trench x -0.3 to 0.3 and 0.85 m deep; the near side wall is cut away so the layers show
      const ground = grp(box(0.8, 0.85, 1.9, m.soil, -0.7, -0.425, 0), box(0.8, 0.85, 0.9, m.soil, 0.7, -0.425, -0.5));
      const bed = grp(box(0.6, 0.1, 1.9, m.sand, 0, -0.8, 0));
      const ring = (z) => cyl(0.07, 0.07, m.sewer, 0, -0.695, z, 16);
      const pipeG = grp(rod([0, -0.695, -0.95], [0, -0.695, 0.95], 0.055, m.sewer, 14), ring(-0.4), ring(0.4));
      for (const q of pipeG.children.slice(1)) q.rotation.x = Math.PI / 2;
      const surround = grp(box(0.6, 0.26, 1.9, ghost(0xdcc58f, 0.55), 0, -0.62, 0));
      const fill = grp(box(0.6, 0.49, 1.9, m.soil2, 0, -0.245, 0));
      const stand = grp(rod([0, -0.64, -0.7], [0, 0.95, -0.7], 0.04, m.waste, 12), rod([0, -0.5, -0.7], [0, 0.75, -0.7], 0.03, ghost(0x58a6ff, 0.8), 12), cyl(0.07, 0.03, m.steel, 0, 0.97, -0.7, 18));
      const io = grp(rod([0, -0.64, 0.6], [0, -0.03, 0.6], 0.045, m.waste, 12), cyl(0.1, 0.04, m.steel, 0, -0.01, 0.6, 18));
      return { parts: [
        { id: 'ground', name: 'Ground and trench walls', group: ground, explode: [-0.55, 0, 0], anchor: [-0.7, -0.4, 0.5], flag: 'T', spec: 'About 600 mm wide in this model. Deeper or softer trenches are shored or battered. Drainers must hold an Install Trench Support course.', desc: 'The trench is dug to give the pipe its fall. The sides stay safe by shoring or sloping, and nobody works in an unsupported deep trench.' },
        { id: 'bed', name: 'Bedding sand', group: bed, explode: [0, -0.3, 0], anchor: [0, -0.8, 0.8], flag: 'C', spec: 'A layer of sand under the pipe, typically about 100 mm. The depth and material come from AS/NZS 3500.2 and the authority, which were not opened.', desc: 'The sand gives the pipe an even bed so it keeps its grade and is not point-loaded by a stone.' },
        { id: 'pipe', name: 'Sewer pipe', group: pipeG, explode: [0.6, 0, 0], anchor: [0, -0.695, 0.4], flag: 'T', spec: 'Typically 100 mm PVC drain pipe with sockets facing upstream, laid to a continuous fall toward the sewer.', desc: 'A drain that is not graded or has a belly holds waste and blocks. The grade is checked at every length before the sand goes round it.' },
        { id: 'surround', name: 'Sand surround (ghost)', group: surround, explode: [0, 0.4, 0], anchor: [0, -0.5, 0.2], flag: 'C', spec: 'Sand placed round and over the pipe by hand, kept free of stones. Depths come from the Standard.', desc: 'It protects the pipe from the heavier fill above and from sharp stones.' },
        { id: 'fill', name: 'Backfill', group: fill, explode: [0, 0.95, 0], anchor: [0, -0.25, 0.3], flag: 'C', spec: 'Clean fill placed in layers and compacted. Not placed until the inspection has passed.', desc: 'Backfill only goes in once the drain has been tested and inspected, or the 30 minute booking window has passed with no auditor attending.' },
        { id: 'stand', name: 'Test standpipe and water column', group: stand, explode: [0.0, 0.3, 0], anchor: [0, 0.8, -0.7], flag: 'C', spec: 'The drain is put on test with a head of water or air. The head and duration come from AS/NZS 3500.2, which was not opened.', desc: 'The water level should stay put while the auditor watches. A falling level means a leak, and the joints are checked.' },
        { id: 'io', name: 'Inspection opening', group: io, explode: [0.0, 0.5, 0], anchor: [0, -0.1, 0.6], flag: 'T', spec: 'A vertical access riser with a screwed cap at the surface, kept clear of paving and soil.', desc: 'It lets a plumber rod or camera the drain later. The cap stays visible at the surface.' },
      ] };
    },
  },

  stack: {
    title: 'Soil stack and vent', sub: 'Slab, wall frame, stack, WC branch, basin waste, floor waste and vent. The wall is shown as studs with the pipes in front of it, as a duct would hide them', floor: -0.15, gridSize: 3,
    camera: { pos: [1.4, 1.0, 2.7], target: [0, 0.8, 0] },
    build(kit) {
      const { box, rod, cyl, ghost, pipe } = kit, m = MAT(kit);
      const slab = grp(box(2.6, 0.15, 1.6, m.conc, 0, -0.075, 0.5));
      const studs = grp(box(2.4, 0.045, 0.09, m.timber, 0, 0.0225, 0), box(2.4, 0.045, 0.09, m.timber, 0, 2.0225, 0), box(2.4, 0.045, 0.09, m.timber, 0, 2.0675, 0)); for (let i = -3; i <= 3; i++) studs.add(box(0.045, 1.98, 0.09, m.timber, i * 0.4, 1.03, 0));
      const stackG = grp(rod([-0.8, 0, 0.12], [-0.8, 2.3, 0.12], 0.055, m.waste, 14), cyl(0.075, 0.03, m.waste, -0.8, 0.015, 0.12, 18), cyl(0.065, 0.08, m.waste, -0.8, 1.6, 0.12, 16));
      const wcb = grp(rod([-0.8, 0.18, 0.12], [-0.2, 0.18, 0.12], 0.05, m.waste, 14), rod([-0.2, 0.18, 0.12], [-0.2, 0.18, 0.4], 0.05, m.waste, 14), cyl(0.055, 0.03, m.waste, -0.2, 0.18, 0.4, 14), box(0.38, 0.4, 0.55, ghost(0xffffff, 0.4), -0.2, 0.2, 0.6), box(0.38, 0.45, 0.14, ghost(0xffffff, 0.4), -0.2, 0.7, 0.2));
      const basin = grp(pipe([[0.6, 0.62, 0.12], [0.6, 0.5, 0.12], [-0.8, 0.5, 0.12]], 0.02, m.waste), box(0.5, 0.82, 0.45, ghost(0xffffff, 0.4), 0.6, 0.41, 0.4), cyl(0.026, 0.03, m.waste, 0.6, 0.64, 0.12, 12));
      const fw = grp(cyl(0.075, 0.03, m.waste, 1.0, 0.015, 0.9, 18), cyl(0.04, 0.01, m.steel, 1.0, 0.035, 0.9, 18), box(1.0, 0.01, 0.9, ghost(0xaee0ff, 0.35), 1.0, 0.02, 0.9));
      const vent = grp(pipe([[-0.8, 2.3, 0.12], [-0.8, 2.55, 0.12], [0.9, 2.55, 0.12], [0.9, 3.0, 0.12]], 0.04, m.waste));
      return { parts: [
        { id: 'slab', name: 'Slab and Step 2 stub-ups', group: slab, explode: [0, -0.35, 0], anchor: [1.0, -0.05, 1.0], flag: 'T', spec: 'The sewer risers were cast into the slab in Step 2. The stack and floor waste connect to them.', desc: 'Every fixture waste ends at a riser through the slab, so the layout starts with where those risers were put.' },
        { id: 'studs', name: 'Wall frame', group: studs, explode: [0, 0, -0.5], anchor: [0.4, 1.4, 0], flag: 'T', spec: '90 x 45 studs at about 400 to 450 mm. A 100 mm stack is thicker than the wall, so it is boxed in front of the frame or the frame is thickened.', desc: 'Pipes must not be cut into studs and plates beyond what the framing rules allow. Big waste pipes sit in a duct in front of the wall.' },
        { id: 'stack', name: 'Soil stack', group: stackG, explode: [-0.3, 0, 0.35], anchor: [-0.8, 1.2, 0.12], flag: 'T', spec: 'Typically 100 mm. It rises from the slab riser to the roof, where it becomes the vent.', desc: 'It carries waste down to the drain and keeps the system open to the air at the top.' },
        { id: 'wcb', name: 'WC branch and pan outlet (ghost pan)', group: wcb, explode: [0.0, 0.15, 0.45], anchor: [-0.2, 0.18, 0.28], flag: 'V', src: 'nccC1', spec: 'Water closets connect to the stack using sweep or 45 degree junctions. The pan is fitted later, at fit-off.', desc: 'The branch runs to the pan outlet with a continuous fall. The pan comes at fit-off, and the outlet stays capped until then.' },
        { id: 'basin', name: 'Basin waste and trap position', group: basin, explode: [0.3, 0.2, 0.45], anchor: [0.6, 0.5, 0.12], flag: 'C', spec: 'Typically 40 mm. Branch length and bends are limited, measured from the trap weir to the stack.', desc: 'The waste ends at a capped stub at the basin height. The trap goes on at fit-off.' },
        { id: 'fw', name: 'Shower floor waste', group: fw, explode: [0.0, 0.3, 0.3], anchor: [1.0, 0.04, 0.9], flag: 'T', spec: 'A floor waste cast into the slab, with a grate fitted after the membrane and tiles go on.', desc: 'The shower floor falls to this waste. Wet-area waterproofing is Step 10.' },
        { id: 'vent', name: 'Vent', group: vent, explode: [0.0, 0.55, 0.2], anchor: [0.9, 2.8, 0.12], flag: 'V', src: 'nccC1', spec: 'Ventilation (C1P5) keeps trap-seal air pressure within plus or minus 375 Pa in at least 99% of annual peak-hour cases.', desc: 'The vent lets air in behind a flush so the water seal in each trap is not sucked out. It goes through the roof with a flashing.' },
      ] };
    },
  },

  water: {
    title: 'Pipes in the wall at the shower', sub: 'Studs, noggings and backing, cold and hot pipes, clips, nail plates, capped stubs and the shower arm (typical; the maker\'s data governs)', floor: 0, gridSize: 3,
    camera: { pos: [0.8, 1.2, 2.4], target: [0, 1.05, 0] },
    build(kit) {
      const { box, rod, cyl, pipe } = kit, m = MAT(kit);
      const studs = grp(box(2.4, 0.045, 0.09, m.timber, 0, 0.0225, 0), box(2.4, 0.045, 0.09, m.timber, 0, 1.9775, 0), box(2.4, 0.045, 0.09, m.timber, 0, 2.0225, 0)); for (let i = -3; i <= 3; i++) studs.add(box(0.045, 1.93, 0.09, m.timber, i * 0.4, 1.01, 0));
      const back = grp(box(0.35, 0.09, 0.045, m.timber, -0.2, 0.95, 0.0), box(0.35, 0.09, 0.045, m.timber, -0.2, 1.4, 0.0), box(0.36, 0.5, 0.018, m.ply, -0.2, 1.17, 0.05));
      const coldG = grp(pipe([[-0.35, 2.07, 0.0], [-0.35, 1.15, 0.0], [-0.35, 1.15, 0.035]], 0.011, m.cold)); coldG.add(box(0.03, 0.02, 0.05, m.cold, -0.35, 2.07, 0.0));
      const hotG = grp(pipe([[-1.2, 0.72, 0.0], [-0.05, 0.72, 0.0], [-0.05, 1.15, 0.0], [-0.05, 1.15, 0.035]], 0.011, m.hot));
      const clips = grp(); for (const [x, y] of [[-0.35, 1.8], [-0.35, 1.4], [-0.05, 0.9], [-0.8, 0.72], [-1.15, 0.72]]) clips.add(box(0.035, 0.03, 0.025, m.brass, x, y, 0.02));
      const plates = grp(); for (const x of [-0.8, -0.4]) plates.add(box(0.006, 0.12, 0.1, m.steel, x + 0.0, 0.72, 0.0)); plates.add(box(0.006, 0.12, 0.1, m.steel, -0.4, 1.9, 0.0));
      const stubs = grp(cyl(0.024, 0.04, m.brass, -0.35, 1.15, 0.055, 12), cyl(0.024, 0.04, m.brass, -0.05, 1.15, 0.055, 12)); for (const q of stubs.children) q.rotation.x = Math.PI / 2;
      const arm = grp(pipe([[-0.2, 1.15, 0.035], [-0.2, 1.9, 0.035], [-0.2, 1.9, 0.07]], 0.011, m.copper), cyl(0.026, 0.03, m.brass, -0.2, 1.9, 0.09, 12)); arm.children[1].rotation.x = Math.PI / 2;
      return { parts: [
        { id: 'studs', name: 'Wall studs and plates', group: studs, explode: [0, 0, -0.55], anchor: [0.8, 1.0, 0], flag: 'T', spec: '90 x 45 studs at about 400 to 450 mm with top and bottom plates. Holes and notches follow the framing rules.', desc: 'Pipes run between the studs where possible. Where they must go through, the hole is kept small and the pipe protected.' },
        { id: 'back', name: 'Noggings and backing sheet', group: back, explode: [-0.4, 0.15, 0.35], anchor: [-0.2, 1.17, 0.05], flag: 'T', spec: 'Noggings either side of the mixer with a ply backing, so the mixer and the shower arm are fixed to something solid.', desc: 'Fittings pull and twist when they are used. Without backing the wall lining and the pipes crack.' },
        { id: 'cold', name: 'Cold water pipe', group: coldG, explode: [-0.25, 0.25, 0.6], anchor: [-0.35, 1.7, 0], flag: 'C', src: 'nccB1', spec: 'Typically 15 or 20 mm PEX or copper dropping from the ceiling run. Pipework velocity must not exceed 3 m/s for more than 1% of the peak hour (B1P2).', desc: 'The cold drop ends at a capped stub at the mixer height. The mixer is fitted at fit-off.' },
        { id: 'hot', name: 'Hot water pipe', group: hotG, explode: [0.25, -0.15, 0.6], anchor: [-0.05, 0.95, 0], flag: 'C', spec: 'Hot pipe from the hot water unit, kept apart from the cold pipe and insulated where the maker or the Standard calls for it.', desc: 'Hot and cold must never be swapped. The usual rule is hot on the left. Check against the mixer.' },
        { id: 'clips', name: 'Pipe clips', group: clips, explode: [0, 0, 0.75], anchor: [-0.35, 1.4, 0.02], flag: 'T', spec: 'Clips at the maker\'s spacing so the pipe cannot rattle or sag.', desc: 'Loose pipes knock when the water stops and wear through where they touch timber.' },
        { id: 'plates', name: 'Nail plates', group: plates, explode: [0, 0.2, 0.45], anchor: [-0.4, 0.72, 0.0], flag: 'T', spec: 'Steel plates on the stud face where a pipe passes through, so a lining nail or screw cannot reach it.', desc: 'A screw through a hidden pipe is a leak behind the lining. A plate stops that.' },
        { id: 'stubs', name: 'Capped stubs', group: stubs, explode: [0, 0, 0.9], anchor: [-0.05, 1.15, 0.06], flag: 'T', spec: 'Stubs stand slightly proud of the framing and are capped or plugged for the pressure test.', desc: 'The caps let the pipes be tested before the mixer is fitted. They also keep the pipe clean.' },
        { id: 'arm', name: 'Shower arm drop', group: arm, explode: [0.1, 0.3, 0.7], anchor: [-0.2, 1.7, 0.035], flag: 'T', spec: 'A drop from the mixer outlet to the arm elbow, fixed to backing at the rose height.', desc: 'The arm elbow gets backing too, because the rose is heavy and is pulled on in use.' },
      ] };
    },
  },

  hwu: {
    title: 'Hot water unit, tempering valve and gas', sub: 'Brick wall, bracket, gas hot water unit with flue, gas line and cock, cold supply, tempering valve and hot outlet (typical; the maker\'s instructions govern)', floor: 0, gridSize: 3,
    camera: { pos: [1.7, 1.15, 1.5], target: [0.12, 0.95, 0.05] },
    build(kit) {
      const { box, rod, cyl, pipe } = kit, m = MAT(kit);
      // wall runs along z, the outside is +x, the brick leaf is x -0.11 to 0, ground y = 0
      const wall = grp(box(0.11, 1.8, 1.9, m.brick, -0.055, 0.9, 0), box(0.09, 1.8, 1.9, m.timber, -0.195, 0.9, 0));
      const brk = grp(box(0.03, 0.72, 0.3, m.steel, 0.015, 1.4, 0.05));
      const unit = grp(box(0.22, 0.62, 0.36, m.white, 0.14, 1.36, 0.05), box(0.02, 0.5, 0.3, m.steel, 0.255, 1.36, 0.05), box(0.04, 0.05, 0.12, m.dark, 0.255, 1.12, 0.05));
      const flue = grp(cyl(0.055, 0.2, m.steel, 0.14, 1.77, 0.05, 16), cyl(0.09, 0.06, m.steel, 0.14, 1.9, 0.05, 16, false, 0.04));
      const gasG = grp(pipe([[0.14, 1.05, 0.15], [0.14, 0.7, 0.15], [0.14, 0.62, 0.15], [0.14, 0.62, 0.9]], 0.012, m.gas), box(0.05, 0.05, 0.05, m.gas, 0.14, 0.85, 0.15), box(0.06, 0.012, 0.012, m.gas, 0.14, 0.9, 0.15));
      const coldG = grp(pipe([[0.14, 1.05, -0.02], [0.14, 0.9, -0.02], [0.0, 0.9, -0.02]], 0.012, m.cold), box(0.04, 0.05, 0.05, m.cold, 0.14, 0.97, -0.02), box(0.06, 0.012, 0.012, m.cold, 0.14, 1.0, -0.02));
      const tv = grp(box(0.07, 0.11, 0.07, m.brass, 0.14, 0.78, 0.05), pipe([[0.14, 0.9, -0.02], [0.14, 0.78, -0.02], [0.14, 0.78, 0.03]], 0.01, m.cold));
      const hotG = grp(pipe([[0.14, 1.05, 0.05], [0.14, 0.9, 0.05], [0.14, 0.84, 0.05]], 0.012, m.hot), pipe([[0.14, 0.72, 0.05], [0.14, 0.7, 0.05], [0.0, 0.7, 0.05]], 0.012, m.hot));
      return { parts: [
        { id: 'wall', name: 'Wall: brick leaf and frame', group: wall, explode: [-0.55, 0, 0], anchor: [-0.055, 0.4, 0.8], flag: 'T', spec: 'The unit is fixed to the frame through the brick, with sleeves where pipes pass the cavity. Penetrations are sealed.', desc: 'Every pipe through the wall is a possible leak path, so each one gets a sleeve and a sealed collar.' },
        { id: 'brk', name: 'Mounting bracket', group: brk, explode: [0.12, 0, 0], anchor: [0.015, 1.4, 0.1], flag: 'T', spec: 'Fixed to solid backing in the frame, to the maker\'s fixing pattern.', desc: 'The unit is heavy when full of water. The bracket goes into the frame, not just the brick face.' },
        { id: 'unit', name: 'Hot water unit', group: unit, explode: [0.55, 0, 0], anchor: [0.255, 1.36, 0.05], flag: 'C', spec: 'A gas instantaneous unit is shown. A storage unit also has a relief valve with a drain line. Installation rules come from the maker and the gas Standards, which were not opened.', desc: 'The unit heats the water on demand. It is installed to the maker\'s instructions, including clearances and a certified flue.' },
        { id: 'flue', name: 'Flue and cowl', group: flue, explode: [0.0, 0.5, 0], anchor: [0.14, 1.9, 0.05], flag: 'C', spec: 'A flue terminal clear of openings and walls to the maker\'s rules and the gas Standard, which were not opened.', desc: 'Burnt gases must leave outdoors and away from windows and vents. The terminal position is a safety item.' },
        { id: 'gas', name: 'Gas line and gas cock', group: gasG, explode: [0.6, -0.1, 0.3], anchor: [0.14, 0.85, 0.15], flag: 'V', src: 'vbaCert', spec: 'Consumer gas piping and the appliance connection need a compliance certificate from a licensed plumber.', desc: 'The gas cock isolates the appliance. The line runs along the outside wall from the meter and is clipped at regular spacing.' },
        { id: 'cold', name: 'Cold supply and isolating valve', group: coldG, explode: [0.65, 0.1, -0.3], anchor: [0.14, 0.97, -0.02], flag: 'T', spec: 'A cold supply with an isolating valve at the unit, so the unit can be serviced without shutting the house.', desc: 'The valve is a service point. Keep it where it can be reached.' },
        { id: 'tv', name: 'Tempering valve', group: tv, explode: [0.8, -0.1, 0.15], anchor: [0.14, 0.78, 0.05], flag: 'V', src: 'bpcHotWater', spec: 'It mixes cold water into the hot so outlets in the bathroom stay at or below 50 degrees Celsius.', desc: 'Scalding is a real risk. A tempering valve is the control that keeps the outlet temperature down while the store stays hot enough against Legionella.' },
        { id: 'hot', name: 'Hot outlet to the wall', group: hotG, explode: [0.5, -0.2, 0.0], anchor: [0.07, 0.7, 0.05], flag: 'V', src: 'bpcHotWater', spec: 'Hot pipe after the tempering valve, insulated and passing through the wall in a sleeve. Stored hot water should be above 60 degrees Celsius.', desc: 'The tempered line goes through the wall to the bathroom outlets. Insulation keeps heat in the pipe.' },
      ] };
    },
  },

  pressure: {
    title: 'Water entry, pressure valve and test point', sub: 'Meter box with W lid, service pipe, isolating valve, pressure-limiting valve, test gauge and garden tap (typical; the authority and maker govern)', floor: -0.65, gridSize: 3,
    camera: { pos: [2.15, 0.9, 2.35], target: [0.2, 0.3, 0] },
    build(kit) {
      const { box, rod, cyl, pipe, textPlane } = kit, m = MAT(kit);
      const ground = grp(box(2.6, 0.6, 1.1, m.soil, 0.3, -0.3, 0), box(0.08, 1.4, 1.1, m.brick, 1.3, 0.7, 0));
      const lid = grp(box(0.42, 0.04, 0.32, m.conc, -0.7, 0.0, 0)); const wl = textPlane(['W'], 0.26, 0.22); wl.rotation.x = -Math.PI / 2; wl.position.set(-0.7, 0.025, 0); lid.add(wl);
      const meter = grp(box(0.36, 0.38, 0.26, m.dark, -0.7, -0.2, 0), cyl(0.06, 0.2, m.brass, -0.7, -0.15, 0, 16), box(0.1, 0.04, 0.1, m.white, -0.7, -0.03, 0));
      const svc = grp(pipe([[-0.55, -0.15, 0], [0.1, -0.15, 0], [0.1, 0.0, 0], [0.5, 0.0, 0], [0.5, 1.2, 0]], 0.018, m.cold));
      const iso = grp(cyl(0.035, 0.1, m.brass, 0.5, 0.25, 0, 14), box(0.14, 0.02, 0.02, m.cold, 0.5, 0.33, 0));
      const plv = grp(cyl(0.035, 0.14, m.brass, 0.5, 0.58, 0, 14), cyl(0.05, 0.05, m.hot, 0.5, 0.7, 0, 14));
      const gauge = grp(rod([0.5, 0.95, 0], [0.5, 0.95, 0.1], 0.012, m.brass, 8)); const gb = cyl(0.08, 0.04, m.steel, 0.5, 0.95, 0.12, 24); gb.rotation.x = Math.PI / 2; const gf = cyl(0.066, 0.006, m.white, 0.5, 0.95, 0.145, 24); gf.rotation.x = Math.PI / 2; gauge.add(gb, gf);
      const tap = grp(pipe([[0.5, 0.45, 0], [1.0, 0.45, 0], [1.2, 0.45, 0]], 0.014, m.cold), cyl(0.03, 0.08, m.brass, 1.15, 0.45, 0.0, 12), box(0.1, 0.02, 0.02, m.cold, 1.15, 0.52, 0));
      return { parts: [
        { id: 'ground', name: 'Ground and wall', group: ground, explode: [0, -0.4, 0], anchor: [0.3, -0.3, 0.5], flag: 'T', spec: 'Footpath or garden ground over the buried service and the wall of the house.', desc: 'The service pipe runs underground from the meter to the house and comes up beside the wall.' },
        { id: 'lid', name: 'Surface box lid marked W', group: lid, explode: [0, 0.5, 0], anchor: [-0.7, 0.02, 0.1], flag: 'V', src: 'nccB1', spec: 'Below-ground valves within the property boundary need a surface box and riser marked W (B1D3).', desc: 'The W lets anyone find the water valve in a hurry. It stays visible and clear of paving.' },
        { id: 'meter', name: 'Meter box and meter', group: meter, explode: [-0.2, 0.15, 0.0], anchor: [-0.7, -0.2, 0.14], flag: 'C', spec: 'The water authority owns the meter. Size, supply and fees are set by the authority.', desc: 'The meter reads the water used. The plumber connects the house service from the meter outlet.' },
        { id: 'svc', name: 'Service pipe to the house', group: svc, explode: [0.25, 0.3, 0.0], anchor: [0.1, -0.08, 0], flag: 'C', src: 'nccB1', spec: 'Connected to a drinking water supply (B1P1) and built to AS/NZS 3500.1 (B1D3). Pipe type and depth follow the Standard.', desc: 'The pipe rises beside the wall and enters the house through the slab or wall with a sleeve.' },
        { id: 'iso', name: 'House isolating valve', group: iso, explode: [0.0, 0.25, 0.2], anchor: [0.5, 0.25, 0.05], flag: 'T', spec: 'A valve at the house entry so the whole house can be shut off.', desc: 'Everyone in the house needs to know where this valve is.' },
        { id: 'plv', name: 'Pressure-limiting valve', group: plv, explode: [-0.1, 0.4, 0.3], anchor: [0.5, 0.7, 0.05], flag: 'V', src: 'bpcCW03', spec: 'A valve is needed where static pressure exceeds 500 kPa at any outlet. Maximum static pressure is 500 kPa and working pressure at least 50 kPa.', desc: 'It holds the house pressure at a safe level. Without it, high mains pressure shortens the life of taps, valves and appliances.' },
        { id: 'gauge', name: 'Test gauge', group: gauge, explode: [0.1, 0.6, 0.45], anchor: [0.5, 0.95, 0.15], flag: 'V', src: 'bpcCW03', spec: 'Static pressure can be measured at the meter outlet or at a garden tap.', desc: 'The gauge shows the pressure so the plumber can compare it with the 500 kPa limit and record it for the owner.' },
        { id: 'tap', name: 'Garden tap', group: tap, explode: [0.45, 0.3, 0.1], anchor: [1.15, 0.45, 0], flag: 'V', src: 'bpcCW03', spec: 'A hose tap on the wall is an easy place to read the static pressure with a gauge.', desc: 'Because the tap is on the wall, the gauge can be fixed there for a test.' },
      ] };
    },
  },
};

/* ---------- 2D drawings ---------- */
// Wrap a note into lines of at most n characters so nothing runs off the drawing.
const wrapT = (x, y, text, n, dy = 18, cls = 'd-mute') => { const out = []; let cur = ''; for (const w of text.split(' ')) { if ((cur + ' ' + w).trim().length > n) { out.push(cur); cur = w; } else cur = (cur + ' ' + w).trim(); } if (cur) out.push(cur); return out.map((t, i) => T(x, y + i * dy, t, { cls })); };
function drainSec() {
  const s = 470, gy = 130, cx = 450, X = (d) => cx + s * d, Y = (y) => gy - s * y, body = [R(0, 0, 900, 700, 'd-bg')];
  body.push(R(40, gy, 820, s * 0.85 + 30, 'd-soil'), R(X(-0.3), Y(-0.85), s * 0.6, s * 0.1, 'd-sand'), R(X(-0.3), Y(-0.49), s * 0.6, s * 0.26, 'd-sand'), R(X(-0.3), Y(0), s * 0.6, s * 0.51, 'd-conc'));
  body.push(R(X(-0.3), Y(0), s * 0.6, s * 0.85, 'd-line'), R(X(-0.33), Y(0), s * 0.03, s * 0.6, 'd-timber'), R(X(0.3), Y(0), s * 0.03, s * 0.6, 'd-timber'), Circ(X(0), Y(-0.695), s * 0.055, 'd-pipe'), L(40, gy, 860, gy, 'd-ground'));
  body.push(dim(X(-0.3), Y(0.1), X(0.3), Y(0.1), '600 typical', 1), dim(X(0.42), Y(0), X(0.42), Y(-0.85), '850 typical', 1));
  body.push(call(1, X(-0.55), Y(-0.3), 110, 330), call(2, X(0.0), Y(-0.25), 760, 200), call(3, X(0.15), Y(-0.6), 760, 330), call(4, X(0.0), Y(-0.695), 760, 430), call(5, X(-0.15), Y(-0.8), 110, 500), call(6, X(-0.315), Y(-0.2), 110, 220));
  body.push(T(40, 40, 'Drain trench in section (typical)', { cls: 'd-bold' }), ...wrapT(40, 590, '1 ground  2 backfill in compacted layers  3 sand surround  4 100 mm pipe, sockets upstream  5 bedding sand  6 trench support', 118));
  body.push(...wrapT(40, 632, 'Typical, not a specific job. Depths and bedding come from AS/NZS 3500.2 and the authority (not opened). Drainers must hold an Install Trench Support course (VBA). Real sizes at 470 px per metre.', 118));
  return svg(900, 700, body.join(''), 'Drain trench section');
}

function wasteSch() {
  const body = [R(0, 0, 900, 760, 'd-bg')];
  body.push(R(40, 470, 820, 26, 'd-conc'), R(40, 496, 820, 74, 'd-soil'), L(380, 535, 380, 470, 'd-svc sewer'), L(680, 535, 680, 470, 'd-svc sewer'), L(680, 535, 40, 535, 'd-svc sewer'), R(52, 526, 18, 12, 'd-cap'));
  body.push(L(420, 190, 860, 60, 'd-line'), L(380, 470, 380, 150, 'd-svc waste'), L(380, 150, 660, 150, 'd-svc waste'), L(660, 150, 660, 70, 'd-svc waste'), R(640, 112, 40, 8, 'd-collar'));
  body.push(R(430, 428, 55, 42, 'd-box'), R(448, 380, 28, 44, 'd-box'), L(430, 452, 380, 452, 'd-svc waste'));
  body.push(R(170, 398, 80, 72, 'd-box'), R(165, 380, 90, 18, 'd-box'), L(210, 415, 210, 440, 'd-svc waste'), L(210, 440, 380, 440, 'd-svc waste'), R(600, 462, 160, 8, 'd-box'), R(670, 463, 20, 8, 'd-cap'));
  body.push(call(1, 380, 300, 470, 300), call(2, 660, 90, 760, 130), call(3, 405, 452, 470, 520), call(4, 300, 440, 300, 380), call(5, 680, 466, 740, 420), call(6, 200, 535, 200, 590), call(7, 61, 532, 120, 590), call(8, 210, 428, 120, 350));
  body.push(T(40, 40, 'Soil stack, branches and vent (schematic)', { cls: 'd-bold' }), T(450, 70, 'Roof', { cls: 'd-mute' }), T(70, 466, 'Slab', { cls: 'd-mute' }));
  body.push(...wrapT(40, 640, '1 soil stack  2 vent through the roof with a flashing  3 WC branch  4 basin waste and trap  5 shower floor waste  6 drain under the slab to the sewer  7 inspection opening  8 trap seal', 118));
  body.push(...wrapT(40, 696, 'Schematic, not to scale. Trap seals must not drop below 70 mm in pressurised rooms or 25 mm elsewhere, at up to plus or minus 375 Pa (NCC Volume Three Part C1). Pipe sizes, grades and vent heights come from AS/NZS 3500.2, which was not opened.', 118));
  return svg(900, 760, body.join(''), 'Soil stack and vent schematic');
}

function waterSch() {
  const body = [R(0, 0, 900, 620, 'd-bg')], blk = (x, y, w, h, lines) => { body.push(R(x, y, w, h, 'd-box', 6)); lines.forEach((t, i) => body.push(T(x + 10, y + 22 + i * 17, t, { cls: i ? 'd-mute' : 'd-bold' }))); };
  blk(30, 90, 120, 84, ['Street main', 'water authority']); blk(190, 90, 120, 84, ['Meter and W box', 'authority owns meter']); blk(350, 90, 150, 84, ['Isolating valve and', 'pressure-limiting valve']); blk(540, 90, 150, 84, ['Cold pipes', 'ceiling space and walls']); blk(730, 90, 140, 84, ['Cold outlets', 'taps, WC, shower']);
  blk(540, 280, 150, 84, ['Hot water unit', 'outside the wall']); blk(730, 280, 140, 84, ['Tempering valve', 'on the hot outlet']); blk(730, 440, 140, 84, ['Hot outlets', 'shower and basin']);
  for (const [a, b] of [[150, 190], [310, 350], [500, 540], [690, 730]]) body.push(arrow(a, 132, b, 132, 'd-svc water'));
  body.push(arrow(615, 174, 615, 280, 'd-svc water'), arrow(690, 322, 730, 322, 'd-svc hot'), arrow(800, 364, 800, 440, 'd-svc hot'));
  body.push(T(40, 40, 'Water supply and hot water (schematic)', { cls: 'd-bold' }));
  body.push(...wrapT(350, 206, 'Static pressure 500 kPa or less. Working pressure 50 kPa or more (NCC B1P5)', 30, 17), ...wrapT(190, 206, 'Read the pressure at the meter outlet or a garden tap (practice note CW 03)', 24, 17));
  body.push(T(30, 320, 'Hot water store above 60 degrees Celsius', { cls: 'd-mute' }), T(30, 338, 'to prevent Legionella (BPC)', { cls: 'd-mute' }), T(30, 400, 'Outlets at shower and taps: 50 degrees Celsius or less', { cls: 'd-mute' }), T(30, 418, '45 degrees for early childhood, schools, nursing homes (BPC)', { cls: 'd-mute' }));
  body.push(T(30, 560, 'Schematic, not to scale. Blue is cold, red is hot. Pipe sizes, backflow devices and test pressures come from AS/NZS 3500.1 and 3500.4 and the', { cls: 'd-mute' }), T(30, 580, 'water authority, which were not opened. The 500 kPa and 50 kPa figures are from NCC Volume Three Part B1 and BPC practice note CW 03.', { cls: 'd-mute' }));
  return svg(900, 620, body.join(''), 'Water supply and hot water schematic');
}

function certDwg() {
  const body = [R(0, 0, 900, 640, 'd-bg')], blk = (x, y, w, h, lines) => { body.push(R(x, y, w, h, 'd-box', 6)); lines.forEach((t, i) => body.push(T(x + 10, y + 22 + i * 16, t, { cls: i ? 'd-mute' : 'd-bold' }))); };
  body.push(T(40, 40, 'Drain inspection and compliance certificate', { cls: 'd-bold' }), T(40, 68, 'A  Below-ground sanitary drain', { cls: 'd-bold' }), T(480, 68, 'B  Compliance certificate', { cls: 'd-bold' }));
  blk(40, 84, 380, 56, ['Consent to connect from the water authority', 'Comes first; take its conditions to the inspection']); blk(40, 170, 380, 56, ['Drain laid, fully visible and on test', 'Stormwater needs no VBA inspection']);
  blk(40, 256, 380, 72, ['Book in VBA360', 'Before 4 pm the day before, 7 am to 4 pm Mon to Sat', 'No auditor? Backfill 30 minutes after booking time']); blk(40, 358, 380, 72, ['Auditor inspects', 'Bring consent conditions, as-laid plan, soil report', 'Reactive soils also need an expert report']);
  blk(40, 460, 180, 72, ['Pass', 'Backfill']); blk(240, 460, 180, 72, ['Fail', 'Notice: 14 days', 'to fix and rebook']);
  for (const [y1, y2] of [[140, 170], [226, 256], [328, 358], [430, 460]]) body.push(arrow(230, y1, 230, y2));
  blk(480, 84, 380, 56, ['Licensed plumber completes the work', 'A registered plumber cannot issue the certificate']); blk(480, 170, 380, 56, ['Plumber completes the compliance certificate', 'Copy to the owner within 5 days of completing the work']);
  blk(480, 256, 380, 56, ['Plumber lodges it with the VBA', 'Within 5 days']); blk(480, 342, 380, 72, ['Owner keeps a copy', 'Can complain through VBA360 if not issued', 'Early contract end: ask in writing for work done']);
  for (const [y1, y2] of [[140, 170], [226, 256], [312, 342]]) body.push(arrow(670, y1, 670, y2));
  body.push(...wrapT(480, 446, 'Needed for plumbing work worth $750 or more, below-ground sanitary drains, gas appliance and consumer gas piping work, and cooling towers.', 58, 18));
  body.push(T(40, 580, 'Sources: VBA drain inspection bookings and plumbing compliance certificates pages. The infringement under Building Act s221ZP(3) applies', { cls: 'd-mute' }), T(40, 600, 'to a no-show or work that is not ready. Pages were undated, so check the current rules on the VBA site.', { cls: 'd-mute' }));
  return svg(900, 640, body.join(''), 'Drain inspection and compliance certificate flow');
}

const drawings = [
  { id: 'drainsec', title: 'Drain trench section', scale: 'Large scale, 470 px per metre', svg: drainSec(),
    notes: ['A section through the external sewer trench: ground, bedding sand, 100 mm pipe, sand surround, backfill and trench support. Callout numbers match the key.', 'The drain keeps a continuous fall to the sewer. It stays visible and on test until the VBA inspection is done, or until 30 minutes after the booking time if no auditor attends.', 'Depths and bedding are typical. AS/NZS 3500.2 and the water authority\'s conditions govern, and neither was opened.'] },
  { id: 'wastesch', title: 'Stack, branches and vent', scale: 'Schematic, not to scale', svg: wasteSch(),
    notes: ['The soil stack, a WC branch, a basin waste, a shower floor waste and the vent through the roof, with the drain under the slab running to the sewer.', 'The vent keeps the trap seals from being sucked out. Seals must stay at 70 mm in pressurised rooms or 25 mm elsewhere, at up to plus or minus 375 Pa.', 'Sizes, grades and vent heights are from AS/NZS 3500.2 and are not shown here.'] },
  { id: 'watersch', title: 'Water supply and hot water', scale: 'Schematic, not to scale', svg: waterSch(),
    notes: ['Street main, meter and W box, isolating and pressure-limiting valves, cold pipes in the house, hot water unit and tempering valve to the hot outlets.', 'Static pressure may not exceed 500 kPa, working pressure must be at least 50 kPa, outlets run at 50 degrees Celsius or less and stored hot water stays above 60 degrees.', 'Pipe sizes, backflow protection and test pressures are not shown. They come from AS/NZS 3500.1 and 3500.4 and the water authority.'] },
  { id: 'cert', title: 'Drain inspection and certificate', scale: 'Flow diagram', svg: certDwg(),
    notes: ['Two flows: the VBA inspection of a below-ground sanitary drain, and the compliance certificate from the licensed plumber.', 'Know the numbers: book before 4 pm the day before, 30 minutes to backfill if no auditor attends, 14 days to rectify a failed drain, and five days to give and lodge the certificate.', 'The pages carry no date, so check the current rules on the VBA site before relying on any time limit.'] },
];

/* ---------- study content ---------- */
const howto = [
  ['Check licences and consent first', 'Confirm the plumber\'s licence and the class of work, and get the water authority\'s consent to connect before any drain is laid. Keep the licence number and consent conditions in the job file.', 'Builder', 'V', 'vbaDrainBook'],
  ['Check the plumbing layout against the plans', 'Compare fixture positions, the hot water unit, the gas meter, the vent route and the Step 2 slab risers with the plans and the services layout. A fixture moved now means the slab riser is in the wrong place.', 'Builder and plumber', 'T'],
  ['Lay the external drain', 'Open the trench with support to suit its depth, bed the 100 mm pipe in sand with sockets facing upstream, check the fall at every length and keep every joint visible.', 'Drainer (excavator digs)', 'C', 'vbaDrainage'],
  ['Put the drain on test', 'Test the drain while it is open, to the current standard. Keep the test records and photograph the pipe, joints and bedding before covering.', 'Drainer', 'V', 'vbaDrainBook'],
  ['Book and attend the VBA inspection', 'Book in VBA360 before 4 pm the day before. Have the work fully visible and on test, with the consent conditions, as-laid plan and soil classification report on site. A failed drain gets 14 days to fix and rebook.', 'Drainer and builder', 'V', 'vbaDrainBook'],
  ['Backfill and finish the as-laid plan', 'Backfill in layers only after the inspection passes or the 30 minute window has run. Leave the inspection opening accessible and finish the as-laid plan.', 'Drainer', 'V', 'vbaDrainBook'],
  ['Rough in waste, soil and vent pipes', 'Fit the stack, the branches and the vent to the roof with the Step 5 flashing, keeping bends and branch lengths within the limits. Cap every stub.', 'Plumber', 'C', 'nccC1'],
  ['Rough in cold and hot water pipes', 'Run cold and hot through the ceiling space and walls, clipped and protected, with capped stubs at the backing for each tap and mixer. Check pipe labels for WaterMark.', 'Plumber', 'C', 'nccB1'],
  ['Hang the hot water unit and fit the tempering valve', 'Fix the unit to solid backing, fit the isolating valves and the tempering valve, and keep the flue clear of openings to the maker\'s rules.', 'Plumber', 'C', 'bpcHotWater'],
  ['Run the gas line', 'Run gas pipe from the meter to the appliance, clipped, with a gas cock at the unit, and leak test it before the gas is turned on.', 'Licensed plumber (gas)', 'C', 'vbaCert'],
  ['Fit the pressure-limiting valve and read the pressure', 'Read the static pressure at the meter outlet or a garden tap. If it exceeds 500 kPa, a pressure-limiting or pressure-reducing valve is needed and the owner is told.', 'Plumber', 'V', 'bpcCW03'],
  ['Test, photograph and collect certificates', 'Test every system before the lining goes on, photograph the pipes in the walls, and make sure the owner receives the compliance certificates within five days and the VBA has them.', 'Plumber and builder', 'V', 'vbaCert'],
];

const trades = [
  { t: 'Licensed plumber', role: 'Roughs in sanitary, water and vent pipes, fits valves and the hot water unit, tests the work and issues the compliance certificate.', when: 'After lock-up and before the walls are lined', reg: 'Licensed plumber with the VBA. Only a licensed plumber can issue a compliance certificate.', ask: ['Licence number and class of work', 'Quote for rough-in and fit-off as two prices', 'Who supplies the hot water unit and the valves', 'Certificate timing and test records included'] },
  { t: 'Drainer', role: 'Lays the below-ground sanitary drain, tests it and has it inspected before backfill.', when: 'Before the slab for the under-slab drain (Step 2), and for the external run once the house is set out', reg: 'Registered in the Drainage class, with an Install Trench Support course (VBA).', ask: ['Licence and class', 'Who digs and who backfills the trench', 'Who books the VBA inspection', 'As-laid plan included'] },
  { t: 'Gas fitter', role: 'Runs consumer gas piping, connects the gas appliance, leak tests and certifies it.', when: 'With the hot water unit', reg: 'Licensed plumber doing gas fitting (class and licence to be confirmed with the VBA).', ask: ['Licence number', 'Test and certificate included', 'Meter connection with the retailer'] },
  { t: 'Excavator', role: 'Digs the external drain trench and backfills it after the inspection.', when: 'Just before the drain is laid', reg: 'Trade contractor with insurance. The VBA page lists trench excavation as excluded from drainage work.', ask: ['Trench depth and width', 'Spoil removal', 'Trench support supplied by whom'] },
  { t: 'Water authority', role: 'Gives consent to connect, owns the meter and sets connection fees and points.', when: 'Before the drain is laid and before the water is connected', reg: 'Statutory water authority for the area', ask: ['Consent to connect conditions', 'Meter size and fees', 'Connection time'] },
  { t: 'Hot water unit supplier', role: 'Supplies the unit, tempering valve and flue parts to the schedule.', when: 'Before the rough-in is finished', reg: 'Manufacturer or supplier. Ask about the warranty and approvals.', ask: ['Unit type, size and efficiency', 'Delivery and warranty', 'Tempering valve supplied or not'] },
  { t: 'Building surveyor (RBS)', role: 'Decides whether to see the plumbing, and checks certificates at final inspection.', when: 'During construction and at the end', reg: 'Registered building surveyor (BPC)', ask: ['Do they want to inspect the rough-in', 'What certificates they need to see'] },
];

const materials = [
  ['uPVC drain and waste pipe and fittings', 'Sewer-grade 100 mm pipe for drains, 100 mm stack, 40 and 50 mm waste pipe, solvent-welded', 'Plumbing supplier. Bunnings stocks some fittings (confirm the range)', 'T', 'Buy the pipe and fittings the plumber specifies. Check the markings.'],
  ['Bedding sand and clean fill', 'Clean sand for bedding and surround with no stones, clean fill for the layers above', 'Landscape or quarry supplier', 'T', 'Order enough for the whole trench and keep it dry.'],
  ['PEX or copper water pipe', 'Cold and hot pipe with WaterMark labelling, with clips and nail plates', 'Plumbing supplier', 'C', 'WaterMark was not checked here. Keep the labels visible until the inspection.'],
  ['Brass valves and fittings', 'Isolating valves, stub-out fittings and caps with WaterMark labelling', 'Plumbing supplier', 'C', 'Match the valve to the pipe type.'],
  ['Pressure-limiting valve', 'A valve rated for the supply pressure, set at or below 500 kPa at outlets', 'Plumbing supplier', 'V', 'The 500 kPa limit is from NCC B1P5 and practice note CW 03.'],
  ['Tempering valve', 'A valve that limits outlet temperature to 50 degrees Celsius or less (45 degrees for early childhood, schools and nursing homes)', 'Hot water unit or plumbing supplier', 'V', 'Limits are from the BPC hot water safety page.'],
  ['Hot water unit', 'Gas instantaneous, gas storage, electric or heat pump, matched to the energy report', 'Hot water unit supplier. Get 2 to 3 quotes', 'C', 'Check the unit against the energy report and the gas supply.'],
  ['Gas pipe, cock and fittings', 'Gas-rated pipe, an isolating cock at the appliance and clips', 'Plumbing supplier', 'C', 'Gas parts come from the gas fitter\'s stock. Do not buy loose.'],
  ['Test gauge, plugs and caps', 'A calibrated pressure gauge, blanking plugs for the drains and caps for the water stubs', 'Plumber supplies', 'T', 'The plumber owns the test gear. Ask for the results.'],
];

const quotes = [
  { who: 'Licensed plumber', n: '3', what: ['Rough-in and fit-off priced separately, with fixtures supplied by whom', 'Licence number, class and certificate timing', 'Hot water unit and tempering valve included or not'] },
  { who: 'Drainer', n: '3', what: ['External drain from the house to the sewer connection', 'VBA inspection booking and the as-laid plan', 'Who digs, supplies bedding and backfills'] },
  { who: 'Excavator', n: '2', what: ['Trench digging and backfilling', 'Spoil removal and trench support', 'Hourly or fixed rate'] },
  { who: 'Gas fitter', n: '2', what: ['Gas line from the meter to the appliance', 'Leak test and certificate', 'Connection to the meter with the retailer'] },
  { who: 'Hot water unit supplier', n: '3', what: ['Unit price and delivery', 'Efficiency and warranty', 'Flue parts and tempering valve'] },
];
const quoteTips = [
  'Ask every plumber for rough-in and fit-off as two separate prices, with the fixtures and tapware supplied by whom stated in writing. A low rough-in price can hide a high fit-off price.',
  'Ask each tenderer for their licence number and the class of work it covers, and check it on the VBA register. Only a licensed plumber can issue a compliance certificate.',
  'Check whether the drainer or the plumber books the VBA inspection and who attends. A no-show can bring an infringement.',
  'Ask whether the quote includes the pressure test, the as-laid plan and the certificates. They are part of the job, not extras.',
  'Water authority consent and connection fees are separate costs. Add them to the estimate and allow the lead time.',
  'Keep every quote, order and certificate. They are evidence of estimating and supervision for the BPC application.',
];

const inspections = [
  ['Licence and class check', 'Builder', 'Before signing', 'Licence number, class of work and insurance on file.', 'T'],
  ['Consent to connect', 'Water authority', 'Before the drain is laid', 'Consent granted, conditions and as-laid plan template held.', 'V', 'vbaDrainBook'],
  ['Trench and pipe check', 'Drainer and builder', 'Before the test', 'Fall, bedding, sockets upstream, joints visible and trench supported.', 'C'],
  ['Drain test', 'Drainer', 'Before the inspection', 'Drain on test to the current standard, records kept.', 'V', 'vbaDrainBook'],
  ['VBA drain inspection', 'VBA auditor', 'Before backfill', 'Work fully visible and on test. Book before 4 pm the day before, bring the consent conditions, as-laid plan and soil report.', 'V', 'vbaDrainBook'],
  ['Waste and vent rough-in check', 'Plumber and builder', 'Before the lining', 'Branches, junctions, vent to the roof, stubs capped, pipes clipped and protected.', 'C', 'nccC1'],
  ['Water pipe check and test', 'Plumber and builder', 'Before the lining', 'Pipes clipped, hot and cold correct, nail plates fitted, pressure test passed, static pressure at or below 500 kPa.', 'V', 'bpcCW03'],
  ['Hot water and gas check', 'Plumber and gas fitter', 'Before the gas is turned on', 'Unit fixed to backing, tempering valve fitted, flue clear, gas leak tested.', 'C', 'bpcHotWater'],
  ['Certificate collection', 'Builder', 'Within five days of completing the work', 'Compliance certificate given to the owner and lodged with the VBA, test records and photographs on file.', 'V', 'vbaCert'],
  ['Surveyor inspection (if stated)', 'RBS', 'As the permit says', 'Ask whether the surveyor wants to see the rough-in before the lining goes on. Confirm the notification stages on your permit.', 'C'],
];

const exam = [
  ['Who can issue a plumbing compliance certificate?', 'A licensed plumber. A registered plumber cannot.', 'V', 'vbaCert'],
  ['When is a plumbing compliance certificate needed?', 'For plumbing work worth $750 or more (including materials, appliances and fixtures), below-ground sanitary drains, installing, relocating, replacing or converting a gas-using appliance, installing, modifying or relocating consumer gas piping, and cooling towers.', 'V', 'vbaCert'],
  ['What are the two five-day rules for the certificate?', 'The plumber gives it to the owner within five days of completing the work and lodges it with the VBA within five days.', 'V', 'vbaCert'],
  ['What can an owner do if the certificate is not issued?', 'Keep a copy of any they receive and complain through VBA360. If the contract ends early, they may be entitled to a certificate for the incomplete work, requested in writing.', 'V', 'vbaCert'],
  ['Which Act and Regulations govern plumbers?', 'Part 12A of the Building Act 1993 and the Plumbing Regulations 2018 (in effect from 18 November 2018).', 'V', 'vbaPlumbFw'],
  ['What is the Plumbing Code of Australia?', 'NCC Volume Three. It applies to all building classes whenever plumbing work is carried out.', 'V', 'vbaPlumbFw'],
  ['What are the four parts of AS/NZS 3500?', 'Part 1 cold water, Part 2 sanitary plumbing and drainage, Part 3 stormwater drainage, Part 4 heated water.', 'V', 'bpcStd3500'],
  ['Which edition of AS/NZS 3500 applies to new work?', 'The 2025 edition, published 17 April 2025, for all plumbing work commenced on or after 20 October 2025. It replaces the 2021 edition.', 'V', 'bpcStd3500'],
  ['What must be booked for a below-ground sanitary drain, and where?', 'A VBA drain inspection, booked in VBA360. Stormwater drainage needs none.', 'V', 'vbaDrainBook'],
  ['When must a drain inspection be booked, and when are inspections held?', 'Before 4 pm the day before. Inspections run 7 am to 4 pm Monday to Saturday.', 'V', 'vbaDrainBook'],
  ['What if no auditor attends the booking?', 'The trench may be backfilled 30 minutes after the booking time.', 'V', 'vbaDrainBook'],
  ['What must be in place before the inspection?', 'A consent to connect from the water authority, the drain fully visible and on test, with the consent conditions, as-laid plan and soil classification report (plus an expert report for highly or extremely reactive soils).', 'V', 'vbaDrainBook'],
  ['What happens if a drain fails the inspection?', 'A rectification notice with 14 days to fix and rebook. Being not ready or not attending can bring an infringement under section 221ZP(3) of the Building Act 1993.', 'V', 'vbaDrainBook'],
  ['What must drainage practitioners complete besides the competencies?', 'An accredited Install Trench Support course.', 'V', 'vbaDrainage'],
  ['What is the NCC limit on static water pressure, and the minimum working pressure?', 'Static pressure not more than 500 kPa and working pressure not less than 50 kPa (B1P5).', 'V', 'nccB1'],
  ['What happens when static pressure exceeds 500 kPa?', 'A pressure-limiting or pressure-reducing valve is needed. The practitioner must tell the homeowner and keep records. It can be measured at the meter outlet or a garden tap.', 'V', 'bpcCW03'],
  ['What mark does a below-ground valve box inside the boundary carry?', 'A surface box and riser marked W (B1D3).', 'V', 'nccB1'],
  ['What is the maximum hot water temperature at shower and tap outlets?', '50 degrees Celsius, or 45 degrees for early childhood centres, schools and nursing homes.', 'V', 'bpcHotWater'],
  ['At what temperature should stored hot water be kept, and why?', 'Above 60 degrees Celsius, to prevent Legionella growth.', 'V', 'bpcHotWater'],
  ['What is the minimum trap seal depth?', '70 mm in pressurised rooms and 25 mm elsewhere, at pressures up to plus or minus 375 Pa.', 'V', 'nccC1'],
  ['How must water closets connect to the stack?', 'Using sweep or 45 degree junctions.', 'V', 'nccC1'],
  ['What limits does the NCC put on water outlet flow?', 'Shower, basin, kitchen sink and laundry outlets must flow no more than 9 litres a minute (B1P4).', 'V', 'nccB1'],
];

export default {
  n: 8, id: 'plumbing', title: 'Plumbing and drainage rough-in', subtitle: 'The external drain tested and inspected, waste, vent, water and gas pipes roughed in, valves fitted, systems tested and certificates handed over.',
  phases, build, details, drawings, howto, trades, materials, quotes, quoteTips, inspections, exam,
  sources: ['vbaCert', 'vbaDrainBook', 'vbaDrainage', 'vbaWater', 'vbaPlumbFw', 'bpcCW03', 'bpcHotWater', 'bpcStd3500', 'nccB1', 'nccC1', 'bpcMI01', 'hiaNcc25'],
  caution: 'Plumbing rules here come from VBA and BPC pages (none shows a date) and the ABCB\'s free NCC 2022 Volume Three pages (Parts B1 and C1). The AS/NZS 3500 series and the gas Standards are paywalled and were not opened, so pipe sizes, grades, bedding, test heads, test times and the flue and gas rules are Typical or Confirm. The Part B2 heated water page and the BPC page on drain inspections were not read. Which edition of Volume Three applies to your permit was not confirmed. The model layout is typical: the bathroom partition walls and the hot water unit position are added for illustration.',
};

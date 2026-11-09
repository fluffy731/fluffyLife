// Step 9: electrical and data rough-in. The house from Step 8 is still open, so the electrician (a licensed worker for a registered electrical contractor) runs cables through
// the frame, cables the smoke alarm bases, places the data hub, wires the switchboard, tests, has the prescribed work inspected and lodges the Certificate of Electrical Safety.
// Rules marked Verified come from the Energy Safe Victoria pages, the VBA smoke alarm practice note and the NCC pages named in Sources. AS/NZS 3000 and the other Standards are
// paywalled and were not opened, so cable sizes, point heights, circuit layouts and test methods are Typical or Confirm. Positions in the model are illustrative.
import * as THREE from 'three';
import step8 from './step-08.js';
import { grp } from './step-06.js';
import { worldAt } from './frame.js';
import { BOARD, PIT, TEMP, STOCK, HUB, TELCO, ALARMS, LIGHTS, outlets } from './elec.js';
import { drawings, howto, trades, materials, quotes, quoteTips, inspections, exam, sources, caution } from './step-09-study.js';

const phases = [
  { title: 'Plan the circuits and the supply', text: 'The electrician prepares the circuit schedule and applies to the distributor. Cable, conduit, mounting boxes and the switchboard are delivered, and a temporary board keeps the site powered.' },
  { title: 'Underground mains and the switchboard', text: 'The consumer mains run in orange conduit from the service pit to the meter box and main switchboard on the east wall. Mains and the main switchboard are prescribed work.' },
  { title: 'Rough-in: cables through the frame', text: 'Cables go through the studs and over the top plates while the frame is open. Mounting boxes go in for power points, switches and lights.' },
  { title: 'Smoke alarm bases, data and telecommunications', text: 'Smoke alarm bases are cabled from the mains and linked together, the data hub is placed with cables to each outlet, and the telecommunications lead-in is laid.' },
  { title: 'Switchboard wiring and protection', text: 'The board is wired: main switch, residual current devices (RCDs), circuit breakers, neutral and earth bars, and the circuit schedule.' },
  { title: 'Testing and the prescribed inspection', text: 'The electrician tests the installation, including the RCDs. A licensed electrical inspector inspects the prescribed work, and it stays switched off until then.' },
  { title: 'Certificate of Electrical Safety and handover', text: 'The electrician lodges the certificate and gives copies. The distributor connects the permanent supply and the temporary board comes out. Fit-off follows the linings.' },
];

const MAT = (kit) => {
  const { mat } = kit;
  return {
    timber: mat(0xffffff, { tex: 'timber' }), conc: mat(0xffffff, { tex: 'concrete' }), steel: mat(0xb9c2cd, { metalness: 0.6, roughness: 0.35 }), enclosure: mat(0xaab2bb, { roughness: 0.55 }),
    orange: mat(0xe8590c, { roughness: 0.6 }), power: mat(0xe8590c, { roughness: 0.6 }), light: mat(0xf2c94c, { roughness: 0.6 }), data: mat(0x2f6fae, { roughness: 0.6 }), telco: mat(0xf4f4f2, { roughness: 0.6 }),
    alarm: mat(0xd62828, { roughness: 0.6 }), earth: mat(0x3aa655, { roughness: 0.6 }), white: mat(0xf4f4f2, { roughness: 0.4 }), dark: mat(0x1b1d20, { roughness: 0.7 }), red: mat(0xc0392b, { roughness: 0.5 }),
    blue: mat(0x2b6fd6, { roughness: 0.5 }), brass: mat(0xc9a24a, { metalness: 0.7, roughness: 0.35 }), card: mat(0xc8ad82, { roughness: 0.9 }), soil: mat(0x5a4631, { roughness: 1 }), tape: mat(0xffd43b, { roughness: 0.6 }),
    drum: mat(0xd9d9d6, { roughness: 0.7 }), green: mat(0x2fb36b, { roughness: 0.5 }),
  };
};

/* ---------- walk scene ---------- */
function build(kit) {
  const { mat, box, cyl, rod, pipe, textPlane, ghost } = kit;
  const mk = (n) => { const g = new THREE.Group(); g.name = n; return g; };
  const s8 = step8.build(kit);
  const DROP = ['stock', 'legend', 'conn', 'trench', 'dtest', 'backfill', 'waste', 'fixtures', 'cold', 'hot', 'plv', 'ptest', 'check'];
  const layers = s8.layers.filter((l) => !DROP.includes(l.group.name)).map(({ group }) => ({ group }));
  const m = MAT(kit), O = outlets();
  const R = (g, a, b, r, mt) => { g.add(rod(a, b, r, mt, 6)); };
  const sign = (lines, w, h, x, y, z, ry = 0) => { const s = textPlane(lines, w, h); s.position.set(x, y, z); s.rotation.y = ry; return s; };

  // delivery: cable drums, conduit, a carton of boxes and the switchboard on a pallet
  const stock = mk('stock'), [sx, sz] = STOCK;
  for (const dz of [-0.5, 0.5]) { const drum = grp(cyl(0.4, 0.03, m.timber, 0, -0.14, 0, 28), cyl(0.4, 0.03, m.timber, 0, 0.14, 0, 28), cyl(0.18, 0.26, m.card, 0, 0, 0, 20), cyl(0.3, 0.22, m.drum, 0, 0, 0, 24)); drum.rotation.z = Math.PI / 2; drum.position.set(sx, 0.4, sz + dz); stock.add(drum); }
  for (const [dy, dx] of [[0.04, -0.1], [0.04, 0], [0.04, 0.1], [0.1, -0.05], [0.1, 0.05]]) R(stock, [sx + dx, dy, sz + 1.1], [sx + dx, dy, sz + 3.5], 0.03, m.orange);
  stock.add(box(0.5, 0.3, 0.4, m.card, sx + 0.55, 0.15, sz - 1.2), box(0.8, 0.12, 0.6, m.timber, sx - 0.25, 0.06, sz - 1.4), box(0.45, 0.7, 0.2, m.enclosure, sx - 0.25, 0.47, sz - 1.4));
  stock.add(sign(['ELECTRICAL STOCK', 'Cable, conduit, boxes, switchboard'], 1.5, 0.5, sx, 1.6, sz - 2.3, 0), cyl(0.025, 1.6, m.steel, sx - 0.78, 0.8, sz - 2.3, 8), cyl(0.025, 1.6, m.steel, sx + 0.78, 0.8, sz - 2.3, 8));

  // temporary board on a post, with its underground mains
  const temp = mk('temp'), [tx, tz] = TEMP;
  temp.add(cyl(0.07, 2.2, m.timber, tx, 1.1, tz, 12), box(0.55, 0.7, 0.24, m.enclosure, tx, 1.5, tz + 0.16), box(0.5, 0.64, 0.012, m.dark, tx, 1.5, tz + 0.29), sign(['TEMPORARY SUPPLY'], 0.8, 0.2, tx, 2.05, tz + 0.2));
  temp.add(cyl(0.028, 1.15, m.orange, tx + 0.15, 0.575, tz + 0.16, 10), cyl(0.045, 1.05, m.steel, tx + 0.15, 0.525, tz + 0.16, 12));
  R(temp, [PIT[0], 0.03, PIT[1]], [tx + 0.15, 0.03, tz + 0.16], 0.04, m.orange);

  // consumer mains in orange conduit from the service pit to the meter box, with the trench and the marker tape
  const mains = mk('mains'), pit = new THREE.Group();
  pit.add(cyl(0.3, 0.04, m.conc, PIT[0], 0.02, PIT[1], 20)); const pl = textPlane(['E'], 0.22, 0.2); pl.rotation.x = -Math.PI / 2; pl.position.set(PIT[0], 0.046, PIT[1]); pit.add(pl);
  mains.add(pit);
  R(mains, [PIT[0], 0.03, PIT[1]], [PIT[0], 0.03, BOARD.z], 0.04, m.orange); R(mains, [PIT[0], 0.03, BOARD.z], [BOARD.x, 0.03, BOARD.z], 0.04, m.orange); R(mains, [BOARD.x, 0.03, BOARD.z], [BOARD.x, BOARD.y - BOARD.h / 2, BOARD.z], 0.035, m.orange);
  const trench = mk('trench'); trench.add(box(0.5, 0.012, PIT[1] - BOARD.z + 0.5, m.soil, PIT[0], 0.006, (PIT[1] + BOARD.z) / 2), box(PIT[0] - BOARD.x + 0.5, 0.012, 0.5, m.soil, (PIT[0] + BOARD.x) / 2, 0.006, BOARD.z));
  const tape = mk('tape'); tape.add(box(0.1, 0.006, PIT[1] - BOARD.z, m.tape, PIT[0] + 0.14, 0.036, (PIT[1] + BOARD.z) / 2));

  // meter box and main switchboard: shell, closed door, then the open door and the wired panel
  const bx = BOARD.x, by = BOARD.y, bz = BOARD.z, bw = BOARD.w, bh = BOARD.h, bd = BOARD.d;
  const shell = mk('board'); shell.add(box(0.01, bh, bw, m.enclosure, bx - bd / 2 + 0.005, by, bz), box(bd, 0.012, bw, m.enclosure, bx, by + bh / 2 - 0.006, bz), box(bd, 0.012, bw, m.enclosure, bx, by - bh / 2 + 0.006, bz), box(bd, bh, 0.012, m.enclosure, bx, by, bz - bw / 2 + 0.006), box(bd, bh, 0.012, m.enclosure, bx, by, bz + bw / 2 - 0.006));
  const doorC = mk('doorClosed'); doorC.add(box(0.012, bh - 0.01, bw - 0.01, m.white, bx + bd / 2 - 0.006, by, bz), box(0.004, 0.18, 0.2, m.dark, bx + bd / 2 + 0.002, by + 0.3, bz), sign(['MAIN SWITCHBOARD'], 0.34, 0.1, bx + bd / 2 + 0.004, by - 0.05, bz, Math.PI / 2));
  const doorO = mk('doorOpen'); doorO.add(box(0.4, bh - 0.04, 0.012, m.white, bx + bd / 2 + 0.2, by, bz + bw / 2 + 0.006));
  const px = bx - bd / 2 + 0.03;
  doorO.add(box(0.04, 0.28, 0.2, m.white, px, by + 0.38, bz - 0.08), box(0.045, 0.1, 0.1, m.dark, px, by + 0.38, bz - 0.08), box(0.04, 0.1, 0.07, m.red, px, by + 0.4, bz + 0.12), box(0.04, 0.08, 0.1, m.white, px, by + 0.2, bz - 0.12));
  for (const z of [-0.1, 0.0]) doorO.add(box(0.04, 0.12, 0.07, m.blue, px, by + 0.06, bz + z));
  for (let i = 0; i < 8; i++) { const z = bz - 0.16 + i * 0.046; doorO.add(box(0.035, 0.1, 0.03, m.white, px, by - 0.12, z)); R(doorO, [px, by - 0.17, z], [px, by - 0.5, z], 0.005, i % 2 ? m.power : m.light); }
  doorO.add(box(0.04, 0.025, 0.36, m.brass, px, by - 0.3, bz), sign(['CIRCUITS', '1 Lights  2 Power  3 Oven', '4 Hot water  5 Air con'], 0.34, 0.14, bx + bd / 2 + 0.2, by + 0.38, bz + bw / 2 - 0.004, Math.PI));

  // cables through the frame, power points and switches, light points and the cable over the top plates
  const cab = mk('cables'), pts = mk('points'), lamps = mk('lights');
  for (const { w, a, b } of O.runs) R(cab, worldAt(w, a, 0.3, 0.02), worldAt(w, b, 0.3, 0.02), 0.015, m.power);
  for (const { w } of O.tops) R(cab, worldAt(w, 0.1, 2.76, 0.02), worldAt(w, w.len - 0.1, 2.76, 0.02), 0.014, m.light);
  const mbox = (g, p, w, mt) => { const me = box(0.075, 0.075, 0.05, mt, p[0], p[1], p[2]); me.rotation.y = w.theta; g.add(me); };
  for (const { w, pos } of O.gpo) mbox(pts, pos, w, m.orange);
  for (const { w, pos } of O.sw) { mbox(pts, pos, w, m.white); R(pts, pos, [pos[0], 2.9, pos[2]], 0.008, m.light); }
  for (const [x, z] of LIGHTS) { lamps.add(cyl(0.05, 0.04, m.light, x, 2.82, z, 12)); R(lamps, [x, 2.82, z], [x, 2.93, z], 0.008, m.light); }

  // smoke alarm bases cabled from the mains and linked together
  const smoke = mk('smoke');
  for (const [x, z] of ALARMS) { smoke.add(cyl(0.12, 0.04, m.white, x, 2.81, z, 24), cyl(0.04, 0.045, m.alarm, x, 2.81, z, 12)); R(smoke, [x, 2.82, z], [x, 2.96, z], 0.014, m.alarm); }
  R(smoke, [ALARMS[0][0], 2.96, ALARMS[0][1]], [ALARMS[1][0], 2.96, ALARMS[1][1]], 0.014, m.alarm); R(smoke, [ALARMS[0][0], 2.96, ALARMS[0][1]], [ALARMS[2][0], 2.96, ALARMS[2][1]], 0.014, m.alarm);

  // data hub, data cables to each outlet and the telecommunications lead-in
  const data = mk('data'), [hx, hz] = HUB;
  data.add(box(0.32, 0.42, 0.07, m.dark, hx, 1.4, hz), sign(['DATA'], 0.26, 0.1, hx, 1.4, hz - 0.037, Math.PI));
  for (const [px2, pz2] of [[-1.0, 11.2], [0.09, 3.0], [5.2, 4.0], [-1.0, -5.2]]) { data.add(pipe([[hx, 1.2, hz], [hx, 2.92, hz], [px2, 2.92, pz2], [px2, 0.45, pz2]], 0.006, m.data), box(0.075, 0.075, 0.04, m.blue, px2, 0.3, pz2)); }
  data.add(cyl(0.2, 0.04, m.conc, TELCO[0], 0.02, TELCO[1], 20)); const tl = textPlane(['T'], 0.22, 0.2); tl.rotation.x = -Math.PI / 2; tl.position.set(TELCO[0], 0.046, TELCO[1]); data.add(tl);
  R(data, [TELCO[0], 0.03, TELCO[1]], [TELCO[0], 0.03, 11.6], 0.03, m.telco); R(data, [TELCO[0], 0.03, 11.6], [TELCO[0], 1.4, 11.6], 0.03, m.telco); data.add(box(0.1, 0.1, 0.06, m.telco, TELCO[0], 1.4, 11.58));
  data.add(pipe([[TELCO[0], 1.4, 11.25], [TELCO[0], 2.92, 11.25], [TELCO[0], 2.92, hz], [hx, 2.92, hz], [hx, 1.6, hz]], 0.006, m.telco));

  // testing and the inspection sign, then the certificate sign
  const test = mk('test');
  test.add(cyl(0.2, 0.45, m.timber, 6.8, 0.225, 9.7, 12), box(0.3, 0.12, 0.22, m.dark, 6.8, 0.51, 9.7), box(0.18, 0.05, 0.002, m.green, 6.8, 0.53, 9.81));
  R(test, [6.7, 0.52, 9.7], [bx + bd / 2, by - 0.35, bz - 0.1], 0.006, m.red); R(test, [6.7, 0.52, 9.7], [bx + bd / 2, by - 0.35, bz + 0.1], 0.006, m.dark);
  test.add(sign(['PRESCRIBED WORK', 'Do not switch on until inspected'], 1.1, 0.5, 6.95, 1.05, 10.95, Math.PI - 0.15), cyl(0.025, 0.8, m.steel, 6.95 - 0.5, 0.4, 10.95, 8), cyl(0.025, 0.8, m.steel, 6.95 + 0.5, 0.4, 10.95, 8));
  const coes = mk('coes');
  coes.add(sign(['CERTIFICATE OF ELECTRICAL SAFETY', 'Lodged by the electrician', 'Copies: customer and Energy Safe'], 1.3, 0.65, 6.95, 1.2, 10.95, Math.PI - 0.15), cyl(0.025, 0.9, m.steel, 6.95 - 0.55, 0.45, 10.95, 8), cyl(0.025, 0.9, m.steel, 6.95 + 0.55, 0.45, 10.95, 8));

  layers.push({ group: stock, until: 1 }, { group: temp, until: 6 }, { group: mains, from: 1 }, { group: trench, from: 1, until: 3 }, { group: tape, from: 2 }, { group: shell, from: 1 }, { group: doorC, from: 1, until: 4 }, { group: doorO, from: 4 },
    { group: cab, from: 2 }, { group: pts, from: 2 }, { group: lamps, from: 2 }, { group: smoke, from: 3 }, { group: data, from: 3 }, { group: test, from: 5, until: 6 }, { group: coes, from: 6 });
  return {
    layers, colliders: s8.colliders, tickers: s8.tickers,
    spawn: { pos: [4, 18.5], yaw: 0, pitch: 0.2 }, map: s8.map,
    orbit: { pos: [9.5, 9, 17], target: [0, 0.6, 5] },
    hotspots: HOTSPOTS,
  };
}

/* ---------- hotspots ---------- */
const HOTSPOTS = [
  { id: 'plan', title: 'Who does what: circuits and licensing', pos: [6.5, 0.7, 3.4], stand: [6.5, 7.4], from: 0, drawing: 'layout',
    summary: 'Electrical installation work is for a licensed electrician working for a registered electrical contractor. As the builder you coordinate the circuit plan, the supply application and the paperwork, but you do not do the wiring yourself.',
    learn: [['A Certificate of Electrical Safety is required for all electrical installation work, under the Electricity Safety Act 1998 and the Electricity Safety (General) Regulations 2019.', 'V', 'esvCoes'], ['The certificate system exists to make sure only qualified persons carry out installation work and to let completed work be audited.', 'V', 'esvCoes'], ['A Registered Electrical Contractor or licensed electrician issues the certificate. Unlicensed people cannot purchase or lodge one.', 'V', 'esvCoesConsumers'], ['Wiring is governed by AS/NZS 3000 (the Wiring Rules), which is paywalled and was not opened. Nothing here about cable sizes, circuit layouts or point heights comes from it.', 'C'], ['Ask the electrician for the circuit schedule early, and agree the switchboard, the meter and the data hub positions with the designer, the owner and the distributor before the frame is lined.', 'T'], ['Connection steps and fees differ by distributor. Check yours before you promise a date.', 'C']] },
  { id: 'temp', title: 'Temporary supply on site', pos: [5.8, 1.4, 14.4], stand: [4.4, 17.0], from: 0, until: 6, detail: 'temp', drawing: 'flow',
    summary: 'A temporary board powers tools until the permanent supply is connected. The rules for how it is mounted and how its underground mains are protected are specific.',
    learn: [['A switchboard or metering enclosure on a construction site must be securely attached to a pole, post, wall or other rigid and secure structure. A free-standing unit must be fixed in place.', 'V', 'esvTemp'], ['Underground consumer mains entering an enclosure must run in non-metallic conduit from where they leave the ground to where they enter the enclosure.', 'V', 'esvTemp'], ['Extra mechanical protection is required from ground level to within 100 mm of the enclosure, meeting WSX3 in AS/NZS 3013 Appendix F. Options are galvanised steel tube at least 3.2 mm thick, or sheet steel at least 1.6 mm thick with an unsupported width of no more than 100 mm.', 'V', 'esvTemp'], ['Underground mains must be double insulated up to the first protective device inside the enclosure.', 'V', 'esvTemp'], ['The page does not say who may supply or install a temporary board, or what certificate it needs. Ask the electrician and the distributor.', 'C'], ['Keep the board locked, out of puddles and away from vehicle paths.', 'T']] },
  { id: 'mains', title: 'Consumer mains and the service pit', pos: [6.4, 0.1, 16.2], stand: [3.6, 15.0], from: 1, drawing: 'layout',
    summary: 'Consumer mains are the cables from the distributor\'s supply point to your main switchboard. They are prescribed electrical work, so they are inspected before they are switched on.',
    learn: [['Prescribed electrical work includes consumer mains and the main switchboard, as the ESV page gives them as examples.', 'V', 'esvCoesConsumers'], ['Prescribed work cannot be turned on or left turned on until it has been inspected.', 'V', 'esvCoesConsumers'], ['The licensed electrical inspector page lists tests for consumer mains, citing Regulation 241 of the regulations.', 'V', 'esvLei'], ['The model shows the mains in orange underground conduit with yellow marker tape above. Depth, conduit type and pit position come from the distributor\'s service rules and AS/NZS 3000, neither opened here.', 'C'], ['Ask the electrician whether the mains must be inspected before the trench is backfilled.', 'T']] },
  { id: 'board', title: 'Meter box and main switchboard', pos: [5.62, 1.1, 10.3], stand: [7.1, 8.0], from: 1, until: 4, detail: 'board', drawing: 'board',
    summary: 'The meter box and main switchboard go on an outside wall where the distributor and the electrician agree. The enclosure goes in first and the board is wired later in the job.',
    learn: [['The main switchboard is prescribed work and is inspected by a licensed electrical inspector before it is switched on.', 'V', 'esvCoesConsumers'], ['Where the meter and board go depends on the distributor\'s rules and AS/NZS 3000 (working space, height, weather protection). Neither was opened. The east wall position here is illustrative.', 'C'], ['Tell the bricklayer and the plumber where the board goes so the brick veneer, flashings and pipes leave room for it.', 'T']] },
  { id: 'cables', title: 'Cables through the frame', pos: [-0.4, 0.85, 11.24], stand: [-1.2, 9.2], from: 2, detail: 'stud',
    summary: 'Cables are drawn through holes in the studs and over the top plates before the linings go on. Tidy runs make life easier for every later trade.',
    learn: [['Rough-in happens while the frame is open. Once the linings are on, cables are hidden and any problem costs much more to fix.', 'T'], ['Cable sizes, cable types, protection from fixings and the spacing of supports come from AS/NZS 3000, which was not opened.', 'C'], ['Holes and notches in studs must follow the structural drawings and AS 1684. Do not let any trade cut studs freely.', 'C'], ['The cable colours in the model are for teaching. Real cables are mostly one colour.', 'T'], ['Keep cables clear of gas and water pipes and the hot water unit.', 'T']] },
  { id: 'points', title: 'Power points and switches', pos: [1.31, 1.0, 5.44], stand: [0.9, 3.5], from: 2, drawing: 'layout',
    summary: 'Mounting boxes go in at the heights on the plans. Switches sit beside each doorway and power points are spread along the walls.',
    learn: [['The model uses 300 mm for power points and 1100 mm for switches. Check the plans and any accessibility requirement that applies, because heights vary.', 'T'], ['Boxes sit on the stud faces so the linings can be cut around them.', 'T'], ['Power points near wet areas have their own rules in AS/NZS 3000 (zones). Not opened here.', 'C']] },
  { id: 'smoke', title: 'Smoke alarms', pos: [-1.0, 2.8, 3.2], stand: [-1.0, 4.5], from: 3, detail: 'alarm', drawing: 'alarm',
    summary: 'Smoke alarms in a new house are powered from the mains and interconnected. The electrician cables the bases now, and the alarms are fitted after the ceilings.',
    learn: [['Smoke alarms must comply with AS 3786, be powered from the consumer mains where one is connected to the building, and be interconnected where there is more than one alarm.', 'V', 'nccHp95'], ['The VBA practice note gives the same mains and interconnection rules for Class 1 buildings in Victoria (version 3.0, 17 March 2023).', 'V', 'vbaEsm09'], ['Class 1a: alarms go in any storey with bedrooms, in every corridor or hallway associated with a bedroom (or between the bedrooms and the rest of the building if there is none), and in each other storey.', 'V', 'nccHp95'], ['A ceiling-mounted alarm is at least 300 mm from the wall and ceiling corner and 500 to 1500 mm from the high point of a sloping ceiling. If that is not possible, a wall-mounted alarm goes 300 to 500 mm below the ceiling.', 'V', 'nccHp95'], ['Interconnection applies within a single dwelling only.', 'V', 'nccHp95'], ['Complying with Housing Provisions Part 9.5 satisfies the smoke-detection performance requirement in Volume Two Part H3. The H3 page I read does not show the clause labels, so check the clause number, and it shows no Victorian variation.', 'V', 'nccVtH3'], ['A building permit is generally required to install a smoke alarm system. An exemption may apply (Regulations, Schedule 3, Item 4) if it complies with the NCC.', 'V', 'vbaEsm09'], ['The ABCB page I read carries NSW-labelled text and does not state its edition, and the VBA note is dated March 2023. Check both against the edition your permit was assessed under.', 'C', 'nccHp95']] },
  { id: 'data', title: 'Data and telecommunications', pos: [-1.0, 1.4, 5.43], stand: [-1.0, 3.4], from: 3, drawing: 'layout',
    summary: 'Data cables run from a central hub to each outlet, and a conduit from the street pit carries the telecommunications lead-in. This is easiest while the frame is open.',
    learn: [['Network operators set their own rules for pits, conduits and the first connection point. Check the operator\'s requirements for new homes.', 'C'], ['Keep data cables apart from power cables where they run alongside. The spacing is in AS/NZS 3000 and the cabling standards, not opened here.', 'C'], ['A hub or cupboard near the entry saves long runs to the router.', 'T'], ['Telecommunications cabling has its own registration rules. I did not check them, so ask the cabler to show their registration.', 'C']] },
  { id: 'rcd', title: 'RCDs and the circuit breakers', pos: [5.62, 1.0, 10.3], stand: [7.1, 8.8], from: 4, detail: 'board', drawing: 'board',
    summary: 'The board is wired with a main switch, residual current devices (RCDs) and circuit breakers. The RCDs must be tested before the certificate is signed.',
    learn: [['Amendment 2 to the Wiring Rules took effect on 1 November 2021 and requires RCDs and RCBOs to be tested to verify they have been installed correctly and are operating correctly.', 'V', 'esvRcd'], ['Testing is required before a Certificate of Electrical Safety is signed. For a new installation, that means before the distributor connects supply.', 'V', 'esvRcd'], ['The ESV guidance (December 2021) said that until further notice it would not enforce testing before certification for an installation not yet connected, if conditions were met. Testing then has to happen within 30 days of connection and be noted on the certificate. Check whether that discretion still applies.', 'C', 'esvRcd'], ['Confirmation of the testing must be recorded and available at the switchboard where the RCDs and RCBOs are installed.', 'V', 'esvRcd'], ['When a switchboard is replaced, RCDs are required on all final sub-circuits (AS/NZS 3000).', 'V', 'esvTesting'], ['Circuit splits, breaker ratings and cable sizes come from the electrician\'s design and AS/NZS 3000, which was not opened.', 'C']] },
  { id: 'test', title: 'Testing and the prescribed inspection', pos: [6.8, 0.85, 10.3], stand: [7.5, 7.9], from: 5, until: 6, drawing: 'flow',
    summary: 'The electrician tests the installation. A licensed electrical inspector, arranged by the electrician, inspects the prescribed work, and it cannot be switched on until that is done.',
    learn: [['Inspection should be completed within 8 business days of completing the work.', 'V', 'esvCoesConsumers'], ['The inspection is carried out by an independent licensed electrical inspector arranged by the electrician or contractor. Energy Safe does not arrange or schedule it.', 'V', 'esvCoesConsumers'], ['The installer signs the Prescribed COES before the inspector inspects. The inspector may only inspect within the scope of their licence, at the address on the certificate.', 'V', 'esvLei'], ['The inspector signs the Certificate of Inspection, lists any defects, and completes a safety statement if the installation will be unsafe when connected.', 'V', 'esvLei'], ['Defects are notified within 4 business days of the inspection, and the inspection is reported to ESV within 4 business days.', 'V', 'esvLei'], ['Test methods (continuity, insulation resistance, polarity) follow AS/NZS 3017, which was not opened.', 'C']] },
  { id: 'coes', title: 'Certificate of Electrical Safety', pos: [6.95, 1.2, 10.95], stand: [7.5, 8.2], from: 6, drawing: 'flow',
    summary: 'The electrician lodges a Certificate of Electrical Safety for all installation work and gives you a copy. Keep it, because it is your evidence that licensed work was done.',
    learn: [['Electronic certificates are lodged through ESVConnect, and paper certificates are lodged through the phone system.', 'V', 'esvCoes'], ['For prescribed work the customer\'s copy is due within 4 days once the inspection is complete. For non-prescribed work, such as lights, power points and hot water, it is due within 30 days.', 'V', 'esvCoesConsumers'], ['The electrician gives a copy to the customer (whoever engaged them) and to Energy Safe. If a builder engaged the electrician, the owner can ask the builder or Energy Safe for a copy.', 'V', 'esvCoesConsumers'], ['Failure to comply with these requirements is a criminal offence, and licensed workers may face disciplinary action.', 'V', 'esvCoes'], ['Energy Safe may audit work for free, and the owner can refuse an audit.', 'V', 'esvCoesConsumers'], ['Whether the building surveyor wants a copy before the occupancy permit was not checked.', 'C']] },
];

/* ---------- zoom rooms ---------- */
const details = {
  board: {
    title: 'Main switchboard, layer by layer', sub: 'Enclosure, meter panel, main switch, RCDs, circuit breakers, neutral and earth bars, circuit schedule and the test record. The layout is typical, not a design',
    floor: -0.25, gridSize: 3, camera: { pos: [2.5, 0.8, 1.0], target: [0, 0.45, 0.2] },
    build(kit) {
      const { box, rod, cyl } = kit, m = MAT(kit), mt = kit.mat;
      const shell = grp(box(0.5, 0.9, 0.01, m.enclosure, 0, 0.45, -0.1), box(0.5, 0.012, 0.16, m.enclosure, 0, 0.9, -0.02), box(0.5, 0.012, 0.16, m.enclosure, 0, 0, -0.02), box(0.012, 0.9, 0.16, m.enclosure, -0.25, 0.45, -0.02), box(0.012, 0.9, 0.16, m.enclosure, 0.25, 0.45, -0.02));
      const bars = grp(box(0.4, 0.03, 0.03, m.brass, 0, 0.14, -0.06), box(0.4, 0.03, 0.03, m.brass, 0, 0.08, -0.06), box(0.01, 0.034, 0.034, m.blue, -0.21, 0.14, -0.06), box(0.01, 0.034, 0.034, m.earth, -0.21, 0.08, -0.06));
      const meter = grp(box(0.2, 0.26, 0.03, m.white, -0.12, 0.76, -0.04), cyl(0.07, 0.04, m.dark, -0.12, 0.76, -0.015, 20));
      meter.children[1].rotation.x = Math.PI / 2;
      const main = grp(box(0.08, 0.1, 0.05, m.red, 0.12, 0.76, -0.03), box(0.03, 0.04, 0.02, m.white, 0.12, 0.78, 0.0));
      const rcd = grp(box(0.1, 0.13, 0.06, m.blue, -0.12, 0.55, -0.02), box(0.1, 0.13, 0.06, m.blue, 0.0, 0.55, -0.02), box(0.1, 0.13, 0.06, m.blue, 0.12, 0.55, -0.02));
      for (const c of rcd.children) c.add(new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.025, 0.01), mt(0xffffff, { roughness: 0.5 })));
      const mcb = grp(); for (let i = 0; i < 9; i++) mcb.add(box(0.035, 0.1, 0.05, m.white, -0.18 + i * 0.045, 0.34, -0.03), box(0.012, 0.03, 0.01, m.dark, -0.18 + i * 0.045, 0.37, -0.0));
      const wires = grp(); for (let i = 0; i < 9; i++) wires.add(rod([-0.18 + i * 0.045, 0.28, -0.04], [-0.18 + i * 0.045, 0.02, -0.04], 0.006, i % 2 ? m.power : m.light, 6));
      const sched = grp(kit.textPlane(['CIRCUIT SCHEDULE', '1 Lights  2 Power  3 Oven', '4 Hot water  5 Air con'], 0.3, 0.15)); sched.children[0].position.set(0.0, 0.2, 0.04);
      const tag = grp(kit.textPlane(['RCD TEST RECORD', 'Date, tester, trip times'], 0.2, 0.1)); tag.children[0].position.set(0.16, 0.12, 0.05);
      const door = grp(box(0.5, 0.9, 0.012, m.white, 0, 0.45, 0.09), box(0.2, 0.12, 0.004, m.dark, -0.1, 0.72, 0.098));
      return { parts: [
        { id: 'shell', name: 'Enclosure', group: shell, explode: [0, 0, -0.45], anchor: [-0.25, 0.7, -0.02], flag: 'T', spec: 'A steel or polycarbonate box fixed to the wall at a position the distributor and the electrician agree. The model\'s size is illustrative.', desc: 'The enclosure goes in first, with the conduit entering at the bottom, and is weathertight.' },
        { id: 'bars', name: 'Neutral and earth bars', group: bars, explode: [0, 0, -0.28], anchor: [0.18, 0.11, -0.06], flag: 'T', spec: 'One bar for neutral, one for earth, with a link to the earth electrode. Bar sizes come from the design.', desc: 'Every circuit returns to the neutral bar, and every earth wire lands on the earth bar.' },
        { id: 'meter', name: 'Meter panel', group: meter, explode: [0, 0.1, -0.1], anchor: [-0.12, 0.76, 0.0], flag: 'C', spec: 'The distributor supplies and seals the meter. The panel position and size come from the distributor\'s rules.', desc: 'The meter is the distributor\'s equipment, so nobody else breaks the seal.' },
        { id: 'main', name: 'Main switch', group: main, explode: [0.0, 0.12, 0.0], anchor: [0.12, 0.84, 0.01], flag: 'T', spec: 'The main switch isolates the whole installation. It is part of the main switchboard, which is prescribed work.', desc: 'It turns off everything in the house at once.' },
        { id: 'rcd', name: 'RCDs', group: rcd, explode: [0, 0.05, 0.15], anchor: [-0.12, 0.64, 0.02], flag: 'V', src: 'esvRcd', spec: 'RCDs and RCBOs must be tested to verify they are installed correctly and operating correctly, before the Certificate of Electrical Safety is signed. The number and type of RCDs come from the design.', desc: 'An RCD switches off in a fraction of a second if current leaks, which protects people from shock.' },
        { id: 'mcb', name: 'Circuit breakers', group: mcb, explode: [0, 0, 0.3], anchor: [-0.18, 0.4, 0.0], flag: 'T', spec: 'One breaker per circuit. Ratings and cable sizes come from the electrician\'s design and AS/NZS 3000, which was not opened.', desc: 'A breaker trips if a circuit is overloaded or short circuits.' },
        { id: 'wires', name: 'Circuit cables', group: wires, explode: [0, -0.1, 0.18], anchor: [0.18, 0.08, -0.04], flag: 'T', spec: 'Each cable leaves the bottom or top of the board in conduit or with a cable entry. Colours are for teaching only.', desc: 'The cables you saw run through the frame come back to these breakers.' },
        { id: 'sched', name: 'Circuit schedule label', group: sched, explode: [0, 0, 0.5], anchor: [0, 0.27, 0.04], flag: 'T', spec: 'The schedule says what each breaker feeds. The electrician writes it, and it stays on the board.', desc: 'The next person to work on the house depends on it.' },
        { id: 'tag', name: 'RCD test record', group: tag, explode: [0.05, -0.1, 0.62], anchor: [0.16, 0.12, 0.05], flag: 'V', src: 'esvRcd', spec: 'Confirmation of the RCD and RCBO testing must be recorded and available at the switchboard where they are installed.', desc: 'A card or label on the board that shows the RCDs were tested, when and by whom.' },
        { id: 'door', name: 'Door', group: door, explode: [0.3, 0.1, 0.85], anchor: [0.2, 0.85, 0.09], flag: 'T', spec: 'A lockable door with a window for the meter. It is opened for testing and by the distributor to read the meter.', desc: 'It keeps the weather and curious hands out of the board.' },
      ] };
    },
  },

  stud: {
    title: 'Cable through a stud', sub: 'Stud, hole, cable, clips, nail plate, mounting box and the future lining. Sizes and spacings are typical, not from AS/NZS 3000',
    floor: -0.25, gridSize: 3, camera: { pos: [1.4, 0.9, 1.7], target: [0, 0.45, 0.05] },
    build(kit) {
      const { box, rod, cyl } = kit, m = MAT(kit);
      const studs = grp(box(0.045, 0.9, 0.09, m.timber, -0.3, 0.45, 0), box(0.045, 0.9, 0.09, m.timber, 0.3, 0.45, 0), box(0.6, 0.045, 0.09, m.timber, 0, 0.0225, 0), box(0.6, 0.045, 0.09, m.timber, 0, 0.9, 0), box(0.6, 0.04, 0.05, m.timber, 0, 0.7, 0));
      const holes = grp(); for (const x of [-0.3, 0.3]) { const t = new THREE.Mesh(new THREE.TorusGeometry(0.014, 0.004, 8, 20), m.orange); t.rotation.y = Math.PI / 2; t.position.set(x + 0.024, 0.45, 0); holes.add(t); }
      const cable = grp(rod([-0.55, 0.45, 0], [0.55, 0.45, 0], 0.008, m.power, 8), rod([-0.5, 0.3, 0.02], [-0.5, 0.45, 0], 0.008, m.light, 8));
      const clips = grp(); for (const x of [-0.45, 0.0, 0.45]) clips.add(box(0.012, 0.03, 0.03, m.white, x, 0.45, 0));
      const plates = grp(box(0.003, 0.1, 0.09, m.steel, -0.3 + 0.0235, 0.45, 0), box(0.003, 0.1, 0.09, m.steel, 0.3 - 0.0235, 0.45, 0));
      const gpo = grp(box(0.075, 0.075, 0.05, m.orange, 0.12, 0.45, 0.06), rod([0.12, 0.45, 0.04], [0.0, 0.45, 0.0], 0.007, m.power, 6));
      const lining = grp(box(0.7, 0.9, 0.013, kit.ghost(0xeeeeee, 0.22), 0, 0.45, 0.1), box(0.07, 0.07, 0.016, kit.ghost(0xff8a00, 0.6), 0.12, 0.45, 0.1));
      return { parts: [
        { id: 'studs', name: 'Studs, plates and noggin', group: studs, explode: [0, 0, -0.4], anchor: [-0.3, 0.8, -0.04], flag: 'T', spec: 'Studs at 450 mm, 90 by 45 timber. Cuts and holes in structural members follow the structural drawings and AS 1684, not what is convenient.', desc: 'The frame is the structure. Trades work around it, not through it.' },
        { id: 'holes', name: 'Holes with grommets', group: holes, explode: [0, 0.14, -0.15], anchor: [0.324, 0.5, 0], flag: 'C', spec: 'Holes are drilled through the middle of the stud, as small as the cable allows, and often fitted with grommets. Size and position limits come from the structural drawings and AS 1684.', desc: 'A neat, small hole keeps the stud strong.' },
        { id: 'cable', name: 'Cable', group: cable, explode: [0, 0.3, 0], anchor: [-0.3, 0.45, 0.0], flag: 'T', spec: 'The cable runs through the studs at a typical height. Cable type and size depend on the circuit and come from the design and AS/NZS 3000.', desc: 'Cables are run once, before any lining hides them.' },
        { id: 'clips', name: 'Cable supports', group: clips, explode: [0, 0.45, 0.1], anchor: [0.0, 0.5, 0.0], flag: 'C', spec: 'Cables are supported at intervals set by AS/NZS 3000, which was not opened. Do not let a cable hang in a loose loop.', desc: 'Clips keep the cable where the electrician put it.' },
        { id: 'plates', name: 'Steel nail plates', group: plates, explode: [0, 0.6, 0.25], anchor: [-0.3, 0.52, 0.05], flag: 'C', spec: 'Where a cable passes close to the stud face, a steel plate protects it from nails and screws. The distance and the plate size come from AS/NZS 3000.', desc: 'The plasterer and the cabinetmaker will fix into this wall. The plate tells their screws to stop.' },
        { id: 'gpo', name: 'Mounting box', group: gpo, explode: [0.1, 0.12, 0.45], anchor: [0.12, 0.5, 0.08], flag: 'T', spec: 'The box is fixed to the stud so its face sits flush with the finished lining. Heights vary: the model uses 300 mm for power points and 1100 mm for switches.', desc: 'The box holds the future power point or switch.' },
        { id: 'lining', name: 'Future lining', group: lining, explode: [0, 0, 0.8], anchor: [-0.3, 0.8, 0.1], flag: 'T', spec: 'The plasterboard is Step 12. It is cut around each box, and the cables behind it stay where they were put.', desc: 'Once this goes on, you cannot see the cables any more. Photograph the walls first.' },
      ] };
    },
  },

  alarm: {
    title: 'Smoke alarm placement', sub: 'Ceiling, wall corner, the 300 mm keep-clear strips, the base, the alarm and the cables. The distances are the NCC figures read for this step',
    floor: -0.9, gridSize: 3, camera: { pos: [1.7, 0.7, 1.9], target: [0, -0.05, 0] },
    build(kit) {
      const { box, rod, cyl, ghost } = kit, m = MAT(kit);
      const ceiling = grp(box(1.8, 0.013, 1.8, ghost(0xeeeeee, 0.3), 0.1, 0, 0.1));
      const walls = grp(box(0.012, 0.9, 1.8, m.timber, -0.8, -0.45, 0.1), box(1.8, 0.9, 0.012, m.timber, 0.1, -0.45, -0.8));
      const zone = grp(box(0.3, 0.004, 1.7, ghost(0xff8a00, 0.55), -0.65, -0.009, 0.1), box(1.7, 0.004, 0.3, ghost(0xff8a00, 0.55), 0.1, -0.009, -0.65));
      const base = grp(cyl(0.075, 0.025, m.white, 0.0, 0.02, 0.0, 24));
      const alarm = grp(cyl(0.07, 0.04, m.white, 0.0, -0.03, 0.0, 28), cyl(0.012, 0.006, m.green, 0.04, -0.054, 0.0, 10));
      const cable = grp(rod([0, 0.04, 0], [0, 0.4, 0], 0.008, m.power, 6), rod([0, 0.4, 0], [0.7, 0.4, 0.3], 0.008, m.power, 6));
      const link = grp(rod([0.02, 0.04, 0.02], [0.02, 0.45, 0.02], 0.008, m.alarm, 6), rod([0.02, 0.45, 0.02], [0.8, 0.45, 0.6], 0.008, m.alarm, 6));
      const dims = grp(rod([-0.79, -0.02, 0.0], [-0.15, -0.02, 0.0], 0.004, m.dark, 6), rod([0.0, -0.02, -0.79], [0.0, -0.02, -0.15], 0.004, m.dark, 6));
      return { parts: [
        { id: 'ceiling', name: 'Ceiling (future, Step 12)', group: ceiling, explode: [0, 0.35, 0], anchor: [0.6, 0, 0.6], flag: 'T', spec: 'The plasterboard goes on after the electrician has cabled the bases. The alarms are fitted at fit-off.', desc: 'The ceiling is drawn ghosted so you can see the base fixed to it.' },
        { id: 'walls', name: 'Walls', group: walls, explode: [-0.2, -0.15, -0.2], anchor: [-0.8, -0.7, 0.4], flag: 'T', spec: 'Two walls forming an internal corner, to show the keep-clear distance.', desc: 'The corner where the wall meets the ceiling is the starting point for the distance.' },
        { id: 'zone', name: '300 mm keep-clear strips', group: zone, explode: [0, -0.12, 0], anchor: [-0.65, -0.01, 0.6], flag: 'V', src: 'nccHp95', spec: 'A ceiling-mounted alarm must be at least 300 mm from the wall and ceiling corner. On a sloping ceiling it must be 500 to 1500 mm from the high point or apex.', desc: 'Dead air collects in corners and at the apex of a pitched ceiling, and smoke may not reach an alarm there.' },
        { id: 'dims', name: 'Distance marks', group: dims, explode: [0, -0.25, 0], anchor: [-0.5, -0.02, 0.0], flag: 'V', src: 'nccHp95', spec: 'If a ceiling mount is not possible, a wall-mounted alarm goes 300 to 500 mm below the ceiling at the wall junction.', desc: 'The lines show the 300 mm distance from each wall.' },
        { id: 'base', name: 'Mounting base', group: base, explode: [0, 0.15, 0], anchor: [0, 0.03, 0.0], flag: 'T', spec: 'The base takes the mains cable and the interconnect cable and holds the alarm. The electrician fits it at rough-in.', desc: 'The base is the part that stays fixed when the alarm is removed for cleaning.' },
        { id: 'alarm', name: 'Smoke alarm', group: alarm, explode: [0, -0.35, 0], anchor: [0, -0.05, 0.0], flag: 'V', src: 'nccHp95', spec: 'Alarms must comply with AS 3786, be powered from the consumer mains where connected, and be interconnected where there is more than one. Interconnection applies within a single dwelling only.', desc: 'When one alarm sounds, they all sound.' },
        { id: 'cable', name: 'Mains supply cable', group: cable, explode: [0, 0.3, 0], anchor: [0.35, 0.4, 0.15], flag: 'T', spec: 'The cable comes from the lighting or a dedicated circuit in the board. Circuit and cable size are the electrician\'s design.', desc: 'The mains supply keeps the alarm powered. A battery inside is a backup.' },
        { id: 'link', name: 'Interconnect cable', group: link, explode: [0, 0.45, 0.1], anchor: [0.4, 0.45, 0.3], flag: 'V', src: 'nccHp95', spec: 'Alarms are interconnected where there is more than one, so all sound together.', desc: 'The red cable links this alarm to the next one.' },
      ] };
    },
  },

  temp: {
    title: 'Temporary switchboard on site', sub: 'Post, enclosure, non-metallic conduit, steel guard and the underground mains. The figures are the ESV site requirements read for this step',
    floor: -0.1, gridSize: 4, camera: { pos: [2.6, 1.7, 3.2], target: [0, 0.95, 0] },
    build(kit) {
      const { box, rod, cyl } = kit, m = MAT(kit);
      const ground = grp(box(1.8, 0.2, 1.2, m.soil, 0, -0.1, 0.0));
      const post = grp(cyl(0.07, 2.0, m.timber, -0.25, 0.9, 0, 12));
      const encl = grp(box(0.55, 0.7, 0.24, m.enclosure, 0, 1.45, 0.0), box(0.5, 0.64, 0.012, m.dark, 0, 1.45, 0.13));
      const conduit = grp(cyl(0.028, 1.1, m.orange, 0.15, 0.55, 0.0, 10));
      const guard = grp(cyl(0.045, 1.0, kit.ghost(0xb9c2cd, 0.5), 0.15, 0.5, 0.0, 14));
      const mains = grp(rod([0.15, 0.05, 0], [0.15, -0.1, 0.0], 0.012, m.dark, 8), rod([0.15, -0.1, 0], [0.9, -0.1, 0.0], 0.012, m.dark, 8));
      const marker = grp(box(0.1, 0.006, 0.75, m.tape, 0.45, -0.04, 0.0));
      const fix = grp(box(0.04, 0.04, 0.04, m.steel, -0.25, 1.2, 0.07), box(0.04, 0.04, 0.04, m.steel, -0.25, 1.7, 0.07));
      return { parts: [
        { id: 'ground', name: 'Ground and trench', group: ground, explode: [0, -0.4, 0], anchor: [-0.8, -0.03, 0.3], flag: 'T', spec: 'The ground is shown as a block so you can see the underground mains. Trench depth comes from the distributor\'s rules.', desc: 'The mains run below the surface.' },
        { id: 'post', name: 'Post', group: post, explode: [-0.45, 0, 0], anchor: [-0.25, 0.4, 0.0], flag: 'V', src: 'esvTemp', spec: 'The enclosure must be securely attached to a pole, post, wall or other structure that is rigid and secure. A free-standing unit must be fixed in place.', desc: 'A firm post stops the board toppling or being knocked.' },
        { id: 'fix', name: 'Fixings to the post', group: fix, explode: [-0.25, 0.1, 0.15], anchor: [-0.25, 1.2, 0.07], flag: 'T', spec: 'Bolts or screws hold the enclosure to the post. Use fixings that cannot be undone by hand.', desc: 'The board is bolted on, not leaned on.' },
        { id: 'encl', name: 'Enclosure', group: encl, explode: [0, 0.25, 0.1], anchor: [0, 1.82, 0.0], flag: 'T', spec: 'A lockable weatherproof box with the main switch, RCDs and outlets for site tools. Contents are the electrician\'s design.', desc: 'The board powers tools until the permanent supply is connected.' },
        { id: 'conduit', name: 'Non-metallic conduit', group: conduit, explode: [0.45, 0.1, 0], anchor: [0.15, 0.2, 0.0], flag: 'V', src: 'esvTemp', spec: 'Underground consumer mains entering an enclosure must run in non-metallic conduit from where they leave the ground to where they enter the enclosure.', desc: 'The conduit protects the mains from damage and keeps water out of the board.' },
        { id: 'guard', name: 'Steel guard (WSX3)', group: guard, explode: [0.9, 0.1, 0.1], anchor: [0.15, 0.8, 0.0], flag: 'V', src: 'esvTemp', spec: 'Additional mechanical protection from ground level to within 100 mm of the enclosure, to WSX3 in AS/NZS 3013 Appendix F: galvanised steel tube at least 3.2 mm thick, or sheet steel at least 1.6 mm thick with an unsupported width of no more than 100 mm.', desc: 'The guard stops a ute, a spade or a skid steer cutting the conduit.' },
        { id: 'mains', name: 'Underground mains', group: mains, explode: [0.2, -0.25, 0], anchor: [0.5, -0.1, 0.0], flag: 'V', src: 'esvTemp', spec: 'Underground mains must be double insulated up to the first protective device inside the enclosure.', desc: 'Double insulation means a nick in the outer layer does not make the cable live to touch.' },
        { id: 'marker', name: 'Marker tape', group: marker, explode: [0.2, 0.0, 0], anchor: [0.45, -0.03, 0.2], flag: 'T', spec: 'A yellow tape above the cable warns diggers. The tape and depth are the distributor\'s and AS/NZS 3000\'s rules, not opened here.', desc: 'It tells the next person digging that there is electricity below.' },
      ] };
    },
  },
};

export default {
  n: 9, id: 'electrical', title: 'Electrical and data rough-in', subtitle: 'Mains and switchboard, cables through the open frame, smoke alarm bases and data, RCD testing, the prescribed inspection and the Certificate of Electrical Safety.',
  phases, build, details, drawings, howto, trades, materials, quotes, quoteTips, inspections, exam, sources, caution,
};

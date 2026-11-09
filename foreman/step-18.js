// Step 18: completion, occupancy and handover. The finished Step 17 house and yard are walked with the owner, the certificates are collected, the surveyor inspects, the occupancy permit is issued,
// the final payment is made, the keys and records are handed over, and the warranty clock starts. The Step 17 permit and check signs, the falls arrows and the garage footprint come down.
// Facts marked Verified come from BPC pages (Home Warranty and the end of a building project, both last updated 30 June 2026), Consumer Affairs Victoria pages, a Stonnington page, one council's list of final inspection documents,
// and law firm articles, read on 9 November 2026. The Building Act 1993, the Domestic Building Contracts Act 1995, the 2026 insurance regulations and each council's own checklist were not opened.
// The certificate boards, the figure, the table, the payment chart and the warranty clock are illustrative, and the positions follow the Step 17 yard.
import * as THREE from 'three';
import step17 from './step-17.js';
import { grp } from './step-06.js';
import { drawings, howto, trades, materials, quotes, quoteTips, inspections, exam, sources, caution } from './step-18-study.js';

const phases = [
  { title: 'Practical completion', text: 'The builder and owner walk the finished house and list every unfinished or faulty item for fixing.' },
  { title: 'Certificates', text: 'The trades hand over their certificates and the builder collects them for the building surveyor.' },
  { title: 'Final inspection', text: 'The building surveyor inspects the finished building and checks the paperwork and the safety items.' },
  { title: 'Occupancy permit', text: 'The surveyor issues an occupancy permit for a new home, or a certificate of final inspection for an extension.' },
  { title: 'Final payment', text: 'The owner checks the contract has been delivered and the final payment is made. The final cost is reported where required.' },
  { title: 'Handover', text: 'Keys, certificates, warranties, manuals and records go to the owner, with the Notice of Cover or the policy.' },
  { title: 'Defects period', text: 'The warranties run on. The owner reports faulty work in writing, and Home Warranty and the statutory warranties apply.' },
];

const MAT = (kit) => {
  const { mat } = kit;
  return {
    timber: mat(0xffffff, { tex: 'timber' }), steel: mat(0xb9c2cd, { metalness: 0.6, roughness: 0.35 }), dark: mat(0x1b1d20, { roughness: 0.7 }), conc: mat(0xffffff, { tex: 'concrete' }),
    paper: mat(0xf7f6f0, { roughness: 0.9 }), navy: mat(0x1f3a5f, { roughness: 0.7 }), white: mat(0xf2f2f2, { roughness: 0.6 }), hivis: mat(0xff7a1a, { roughness: 0.7 }), skin: mat(0xe0b48f, { roughness: 0.8 }), pants: mat(0x2b3a55, { roughness: 0.9 }),
    green: mat(0x2fbf71, { roughness: 0.6 }), amber: mat(0xf2c230, { roughness: 0.6 }), red: mat(0xd62828, { roughness: 0.6 }), blue: mat(0x2f7fd6, { roughness: 0.6 }), sky: mat(0x7fc4ec, { roughness: 0.6 }), brown: mat(0x8a5a3c, { roughness: 0.7 }),
    purple: mat(0x7c5cff, { roughness: 0.6 }), grey: mat(0x8c96a1, { roughness: 0.7 }), orange: mat(0xe8590c, { roughness: 0.6 }),
  };
};

// the eight certificates, in the order of the labels in the 3D room and the numbers in the drawing
const CERTS = [['plumbing', 'blue'], ['electrical', 'amber'], ['glazing', 'sky'], ['termite', 'brown'], ['energy', 'green'], ['waterproofing', 'purple'], ['bal', 'orange'], ['engineer', 'grey']];

/* ---------- walk scene ---------- */
function build(kit) {
  const { box, cyl, textPlane } = kit;
  const mk = (n) => { const g = new THREE.Group(); g.name = n; return g; };
  const s17 = step17.build(kit), m = MAT(kit);
  const DROP = ['permitSign', 'checkSign', 'lpodSign', 'falls', 'garageFp'];
  const layers = s17.layers.filter((l) => !DROP.includes(l.group.name)).map(({ group }) => ({ group }));
  for (const { group } of layers) for (const c of group.children.filter((k) => k.userData && k.userData.sign)) group.remove(c);   // the Step 17 boards come down
  const sign = (lines, w, h, x, y, z, ry = 0, accent) => { const s = textPlane(lines, w, h, accent ? { accent } : {}); s.position.set(x, y, z); s.rotation.y = ry; return s; };
  const post = (g, x, z, h, r = 0.03) => { const c = cyl(r, h, m.steel, x, h / 2, z, 8); g.add(c); return c; };
  const table = (g, x, z, w = 1.6, d = 0.7) => { g.add(box(w, 0.05, d, m.timber, x, 0.8, z)); for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.add(cyl(0.025, 0.78, m.steel, x + sx * (w / 2 - 0.08), 0.39, z + sz * (d / 2 - 0.08), 8)); };

  // practical completion board, front lawn
  const walk = mk('walk');
  walk.add(sign(['PRACTICAL COMPLETION', 'Walk every room with the owner', 'List each faulty or unfinished item'], 2.0, 0.7, -4.4, 1.1, 14.2, 0), post(walk, -5.3, 14.2, 1.1), post(walk, -3.5, 14.2, 1.1));
  for (const [x, z] of [[-5.8, 13.3], [-3.0, 13.1]]) { walk.add(cyl(0.16, 0.5, m.orange, x, 0.25, z, 12, false, 0.03)); walk.add(cyl(0.2, 0.03, m.orange, x, 0.015, z, 12)); }

  // certificates table with the eight sheets
  const certs = mk('certs');
  table(certs, -2.9, 14.0, 1.7, 0.7);
  CERTS.forEach(([, c], i) => { const col = i % 4, row = Math.floor(i / 4); const x = -3.45 + col * 0.37, z = 13.85 + row * 0.3; certs.add(box(0.32, 0.012, 0.26, m.paper, x, 0.832, z), box(0.32, 0.013, 0.05, m[c], x, 0.834, z - 0.105)); });
  certs.add(sign(['CERTIFICATES TO COLLECT', 'Plumbing, electrical, glazing, termite', 'Energy, waterproofing, BAL, engineer'], 2.0, 0.7, -2.9, 1.1, 13.1, 0), post(certs, -3.8, 13.1, 1.1), post(certs, -2.0, 13.1, 1.1));

  // the surveyor at the front door, with a clipboard, and a board
  const surveyor = mk('surveyor');
  { const p = new THREE.Group(); p.position.set(1.5, 0, 12.5); p.rotation.y = 0;
    p.add(box(0.14, 0.8, 0.16, m.pants, -0.08, 0.4, 0), box(0.14, 0.8, 0.16, m.pants, 0.08, 0.4, 0), box(0.36, 0.56, 0.22, m.hivis, 0, 1.08, 0), box(0.1, 0.52, 0.1, m.hivis, -0.24, 1.06, 0), box(0.1, 0.52, 0.1, m.hivis, 0.24, 1.06, 0.05));
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.11, 14, 10), m.skin); head.position.set(0, 1.5, 0); p.add(head);
    p.add(cyl(0.125, 0.07, m.white, 0, 1.6, 0, 14), cyl(0.17, 0.015, m.white, 0, 1.575, 0, 14), box(0.22, 0.3, 0.015, m.timber, 0.2, 1.12, 0.17), box(0.19, 0.26, 0.006, m.paper, 0.2, 1.12, 0.18));
    surveyor.add(p); }
  surveyor.add(sign(['FINAL INSPECTION', 'The surveyor checks the work', 'and the paperwork'], 1.6, 0.6, -0.1, 1.1, 13.2, 0), post(surveyor, -0.8, 13.2, 1.1), post(surveyor, 0.6, 13.2, 1.1));

  // occupancy permit board on the driveway
  const occ = mk('occ');
  occ.add(sign(['OCCUPANCY PERMIT', 'New home: needed before moving in', 'Extension: final inspection certificate'], 2.2, 0.8, 3.9, 1.1, 14.2, 0, '#2fbf71'), post(occ, 2.9, 14.2, 1.1), post(occ, 4.9, 14.2, 1.1));

  // final payment chart in the rear yard: stage limits as bars. The rear boards sit 3.7 m from their stands so they stay clear of the info panel and the button
  const PZ = -10.4;
  const pay = mk('pay');
  pay.add(box(2.4, 1.15, 0.05, m.paper, -4.8, 1.2, PZ), sign(['FINAL PAYMENT', 'Pay for completed stages only'], 2.2, 0.38, -4.8, 1.575, PZ + 0.04, 0));
  [['Base 10%', 10, 'green'], ['Frame 15%', 15, 'green'], ['Lock-up 35%', 35, 'green'], ['Fixing 25%', 25, 'green'], ['Balance 15%', 15, 'red']].forEach(([t, p, c], i) => {
    const x = -4.8 - 0.92 + i * 0.46, h = p * 0.0128;
    pay.add(box(0.32, h, 0.04, m[c], x, 0.9 + h / 2, PZ + 0.04), sign([t], 0.46, 0.15, x, 0.76, PZ + 0.045, 0, '#ffffff'));
  });
  post(pay, -5.9, PZ, 0.65); post(pay, -3.7, PZ, 0.65);

  // handover table with the pack
  const HZ = -10.1, handover = mk('handover');
  table(handover, -2.8, HZ, 1.6, 0.7);
  handover.add(box(0.34, 0.03, 0.25, m.navy, -3.2, 0.835, HZ), box(0.3, 0.02, 0.21, m.paper, -3.2, 0.855, HZ), cyl(0.045, 0.012, m.steel, -2.5, 0.83, HZ - 0.1, 14));
  for (let k = 0; k < 3; k++) handover.add(box(0.03, 0.006, 0.09, m.steel, -2.5 + (k - 1) * 0.04, 0.83, HZ));
  for (let k = 0; k < 3; k++) handover.add(box(0.2, 0.012, 0.28, [m.green, m.amber, m.blue][k], -2.9 + k * 0.02, 0.84 + k * 0.012, HZ + 0.05));
  handover.add(sign(['HANDOVER PACK', 'Keys, certificates, warranties', 'Manuals, plans, Notice of Cover'], 2.0, 0.7, -2.8, 1.35, HZ - 0.7, 0), post(handover, -3.7, HZ - 0.7, 1.35), post(handover, -1.9, HZ - 0.7, 1.35));

  // warranty clock: horizontal bars, 0.2 m a year
  const clock = mk('clock');
  clock.add(box(2.6, 1.4, 0.05, m.paper, -0.8, 1.1, PZ), sign(['WARRANTY CLOCK', 'Years after completion'], 2.4, 0.34, -0.8, 1.62, PZ + 0.04, 0));
  [['Claim against the builder: 10 years', 10, 'red', 1.28], ['Major defects: 6 years', 6, 'green', 1.06], ['Old DBI: 6 years', 6, 'amber', 0.84], ['Other defects: 2 years', 2, 'green', 0.62]].forEach(([t, y, c, yy]) => {
    clock.add(box(y * 0.2, 0.1, 0.04, m[c], -1.9 + y * 0.1, yy - 0.07, PZ + 0.04), sign([t], 1.5, 0.14, -1.15, yy + 0.04, PZ + 0.045, 0, '#ffffff'));
  });
  clock.add(box(0.02, 1.0, 0.045, m.dark, -1.9, 0.95, PZ + 0.04));
  post(clock, -2.1, PZ, 0.5); post(clock, 0.5, PZ, 0.5);

  // letterbox on the front fence, for the registered post
  const mail = mk('mail');
  mail.add(box(0.36, 0.26, 0.24, m.red, 2.55, 1.45, 17.6), box(0.3, 0.04, 0.2, m.dark, 2.55, 1.6, 17.6), box(0.05, 0.14, 0.02, m.amber, 2.74, 1.6, 17.73));
  post(mail, 2.55, 17.6, 1.3, 0.04);

  layers.push({ group: walk }, { group: certs, from: 1 }, { group: surveyor, from: 2 }, { group: occ, from: 3 }, { group: pay, from: 4 }, { group: handover, from: 5 }, { group: clock, from: 6 }, { group: mail, from: 6 });
  return { layers, colliders: s17.colliders, tickers: s17.tickers, spawn: { pos: [4, 18.5], yaw: 0, pitch: 0.2 }, map: s17.map, orbit: { pos: [26, 18, 26], target: [0, 0.5, 0] }, hotspots: HOTSPOTS };
}

/* ---------- hotspots ---------- */
const HOTSPOTS = [
  { id: 'walk', title: 'Practical completion: the walk-through and the defects list', pos: [-4.4, 1.55, 14.2], stand: [-4.4, 16.6], from: 0, drawing: 'complete',
    summary: 'The house is complete when everything in the plans and specifications is finished to the agreed standard and the major defects are fixed. The builder and owner walk it together and write down each unfinished or faulty item.',
    learn: [['The works are complete when everything in the plans and specifications is finished to the agreed standard and the major defects are fixed.', 'V', 'cavComplete'], ['The owner may pay an independent building consultant to check for defects or unfinished work.', 'V', 'cavComplete'], ['List incomplete or faulty work and raise it with the builder straight away.', 'V', 'cavComplete'], ['The BPC guide to standards and tolerances is the reference for what finish is acceptable (used in Stage 15).', 'V', 'bpcTol26'], ['Date and photograph each item, give it a location and agree the list in writing, so the recheck is quick (Typical).', 'T']] },
  { id: 'certs', title: 'Certificates to collect', pos: [-2.9, 1.55, 14.2], stand: [-2.9, 16.6], from: 1, detail: 'certs', drawing: 'certs',
    summary: 'The surveyor needs paperwork from the trades before the final inspection. One council lists the plumbing, electrical, glazing, termite, energy and waterproofing certificates, with a BAL letter and septic approval where they apply. Another surveyor can ask for more or less.',
    learn: [['One council lists the electrical safety certificate, the plumber’s compliance certificate, termite protection certificates with a durable notice in the switchboard, the glazier’s certificate (AS 1288 and AS 2047), an energy letter, a waterproofing certificate, septic approval and a BAL letter.', 'V', 'shepCerts'], ['The surveyor may ask the practitioners involved in the construction for certificates or statements before issuing the occupancy permit.', 'V', 'bpcEnd'], ['Plumbing and electrical certificate timing is in Stage 15, from the VBA and Energy Safe Victoria pages.', 'V', 'vbaCert'], ['The list is one council’s and has no date. Ask your surveyor for theirs early.', 'C', 'shepCerts'], ['Engineer’s certificates are not on that list but a surveyor may ask for them.', 'C', 'bpcEnd']] },
  { id: 'inspect', title: 'Final inspection', pos: [0.5, 1.55, 12.8], stand: [0.9, 15.4], from: 2, drawing: 'complete',
    summary: 'The building surveyor inspects the finished building against the permit and checks the certificates. Smoke alarms and the stormwater connection to the legal point of discharge are checked as safety items.',
    learn: [['One council’s final inspection list says smoke alarms must be in place and working, and that stormwater has been connected to the council’s legal point of discharge.', 'V', 'shepCerts'], ['The surveyor may ask the practitioners involved for certificates or statements.', 'V', 'bpcEnd'], ['The permit lists the mandatory notification stages and the final inspection is the last of them for a new home (Typical).', 'T'], ['Have the site clear, the services on, the keys to every lock and the paperwork on a table (Typical).', 'T'], ['A failed item is fixed and rechecked before the permit is issued (Typical).', 'T']] },
  { id: 'occupancy', title: 'Occupancy permit or certificate of final inspection', pos: [3.9, 1.55, 14.2], stand: [3.9, 16.8], from: 3, drawing: 'complete',
    summary: 'A new home needs an occupancy permit before anyone occupies it. An extension or alteration gets a certificate of final inspection instead. The building permit says which is needed.',
    learn: [['The occupancy permit confirms the building surveyor is satisfied the building is suitable for occupation.', 'V', 'bpcEnd'], ['Occupying a new building before receiving the permit is an offence under the Building Act 1993.', 'V', 'bpcEnd'], ['The owner or the builder may apply.', 'V', 'bpcEnd'], ['A certificate of final inspection is issued for extensions or alterations to existing homes. One council says it sets the start date for the liability period for building faults.', 'V', 'stonOcc'], ['A law firm reads section 134 of the Building Act 1993 as running 10 years from the date of issue of the occupancy permit, while CAV says 10 years from completion. The Act was not opened.', 'C', 'madd134']] },
  { id: 'pay', title: 'Final payment and the final cost', pos: [-4.8, 1.85, -10.4], stand: [-4.8, -6.7], from: 4, drawing: 'payments',
    summary: 'The owner pays for completed stages and checks everything in the contract is delivered and working before the final payment. The final cost may need reporting to the BPC.',
    learn: [['For a contract to build all stages the page lists base 10%, frame 15%, lock-up 35% and fixing 25%. The 15% balance after fixing is the remainder, so confirm it.', 'C', 'cavPay2'], ['The deposit limit is 10% for contracts under $20,000 and 5% for contracts of $20,000 or more.', 'V', 'cavPay2'], ['By law you pay for completed stages. The page says not to pay in advance and warns Home Warranty may not cover work paid for before completion.', 'V', 'cavPay2'], ['Check everything in the contract is delivered and in working order before the final payment.', 'V', 'cavComplete'], ['Tell the BPC within 28 days if the cost of a non-staged permit changes by $15,625 or more.', 'V', 'bpcEnd'], ['The 2025 Act takes effect by 1 December 2026 and lets regulations set the stages and limits.', 'V', 'cavNewLaws']] },
  { id: 'handover', title: 'Handover: keys, certificates, warranties and records', pos: [-2.8, 1.85, -10.8], stand: [-2.8, -6.7], from: 5, detail: 'pack', drawing: 'complete',
    summary: 'At handover the owner gets the keys, the certificates, the permit documents, the manufacturers’ warranties and manuals, the as-built plans, the maintenance guide and the Notice of Cover or the policy.',
    learn: [['Keep all documents, agreements and certificates for the project.', 'V', 'cavComplete'], ['The BPC gives the owner a Notice of Cover once it accepts the Home Warranty premium.', 'V', 'bpcHWb'], ['The statutory warranties cannot be waived and apply whatever the cost, and the right passes to a new owner within the time limit.', 'V', 'cavWarranty'], ['Count the keys and sign for them. Hand over manuals, warranty sheets, the paint schedule, spare tiles and the maintenance guide (Typical).', 'T'], ['The pages read do not list what a handover pack must hold, so this list is Typical.', 'C']] },
  { id: 'clock', title: 'The warranty clock', pos: [-0.8, 1.9, -10.4], stand: [-0.8, -6.7], from: 6, detail: 'clock', drawing: 'clock',
    summary: 'Home Warranty covers major defects for up to 6 years and other defects for up to 2 years after completion, and a claim against the builder runs up to 10 years. The start dates and the notification period are Confirm.',
    learn: [['Home Warranty replaced DBI for eligible work over $20,000 under contracts signed on or after 1 July 2026, up to three storeys, with up to $400,000 in assistance.', 'V', 'bpcHW'], ['Major defects can be claimed for up to 6 years and other defects or non-compliant work up to 2 years after completion.', 'V', 'bpcHW'], ['DBI policies issued before 1 July 2026 stay on their original terms and do not transfer to Home Warranty.', 'V', 'bpcHWb'], ['CAV says a claim against the builder can be made up to 10 years from the date the work was completed.', 'V', 'cavWarranty'], ['HWL Ebsworth reports a 12-month notification to the BPC from when the owner is aware of a defect and a 30% sub-limit for incomplete work. These are not on the BPC pages read.', 'C', 'hweHW']] },
  { id: 'defects', title: 'Reporting a defect: the registered post', pos: [2.55, 1.75, 17.6], stand: [2.55, 19.7], from: 6, drawing: 'clock',
    summary: 'The owner lists the faulty work, raises it with the builder straight away and follows up in writing by registered post. Home Warranty says first try to resolve the issue with the builder, and a claim may be possible if the builder is unable or unwilling to fix eligible work.',
    learn: [['Send a written request to complete or fix the work, with any agreements made in writing, by registered post, and contact Consumer Affairs Victoria for advice.', 'V', 'cavComplete'], ['Home Warranty says first try to resolve the issue with your builder, and keep photos, reports and communications.', 'V', 'bpcHW'], ['If the builder is unable or unwilling to complete or fix eligible work, a claim may be possible.', 'V', 'bpcHW'], ['How a claim is lodged was not on the pages read. Check the BPC page for the current steps.', 'C', 'bpcHW'], ['Keep the occupancy permit date, the completion date and the Notice of Cover with the defects list (Typical).', 'T']] },
];

/* ---------- zoom rooms ---------- */
const details = {
  certs: {
    title: 'Final inspection certificates: eight sheets', sub: 'Plumbing, electrical safety, glazing, termite, energy, waterproofing, BAL and engineer. One council’s list, and another surveyor can ask for different documents',
    floor: -0.08, gridSize: 2, camera: { pos: [1.0, 1.05, 1.6], target: [0, 0.42, 0] },
    build(kit) {
      const { box } = kit, m = MAT(kit);
      const sheet = (c, x) => grp(box(0.42, 0.012, 0.3, m.paper, x, 0, 0), box(0.42, 0.014, 0.05, m[c], x, 0.001, -0.125), box(0.3, 0.014, 0.01, m.grey, x, 0.001, -0.04), box(0.3, 0.014, 0.01, m.grey, x, 0.001, 0), box(0.3, 0.014, 0.01, m.grey, x, 0.001, 0.04));
      const spec = {
        plumbing: ['Plumbing certificate of compliance', 'V', 'shepCerts', 'One council list asks for the plumber’s certificate of compliance for all plumbing work. Timing is in Stage 15 from the VBA page.', 'From the plumber.'],
        electrical: ['Certificate of electrical safety', 'V', 'shepCerts', 'One council list asks for the certificate of electrical safety from the electrician for all electrical work.', 'From the electrician.'],
        glazing: ['Glazier’s certificate', 'V', 'shepCerts', 'It confirms windows and shower screens were installed to AS 1288 and AS 2047, per one council’s list. The Standards were not opened.', 'Windows and screens.'],
        termite: ['Termite protection certificate', 'V', 'shepCerts', 'The certificate comes with a durable notice fixed inside the electrical switchboard, per one council’s list.', 'With the switchboard notice.'],
        energy: ['Energy report letter', 'V', 'shepCerts', 'A letter confirming the building work meets the requirements of the Energy Report, per one council’s list.', 'Matches the energy report.'],
        waterproofing: ['Waterproofing certificate', 'V', 'shepCerts', 'The “Waterproofing of Wet areas in Residential Buildings” certificate, completed and signed, per one council’s list.', 'Wet areas.'],
        bal: ['BAL letter', 'V', 'shepCerts', 'Where it applies, a letter confirming the dwelling meets the required Bushfire Attack Level under AS 3959. AS 3959 was not opened.', 'Bushfire areas only.'],
        engineer: ['Engineer’s certificates', 'C', 'bpcEnd', 'Not on the list read. The BPC says the surveyor may ask the practitioners involved in construction for certificates or statements.', 'If the surveyor asks.'],
      };
      return { parts: CERTS.map(([id, c], i) => ({ id, name: spec[id][0], group: sheet(c, 0), explode: [0.02 * (i % 2 ? 1 : -1), 0.1 * i, 0], anchor: [0.2, 0.02, 0.1], flag: spec[id][1], src: spec[id][2], spec: spec[id][3], desc: spec[id][4] })) };
    },
  },

  pack: {
    title: 'Handover pack: keys, folder, manuals, plans, notice and guide', sub: 'What goes to the owner at handover. The Notice of Cover is from the BPC page, and the rest of the pack is Typical',
    floor: -0.1, gridSize: 2, camera: { pos: [0.85, 0.85, 1.35], target: [0, 0.2, 0] },
    build(kit) {
      const { box, cyl } = kit, m = MAT(kit);
      const keys = grp(cyl(0.05, 0.012, m.steel, 0, 0, 0, 16), ...[-1, 0, 1].map((k) => box(0.035, 0.008, 0.11, m.steel, k * 0.045, 0, 0.09)));
      const folder = grp(box(0.34, 0.035, 0.25, m.navy, 0, 0, 0), box(0.3, 0.03, 0.21, m.paper, 0, 0.01, 0));
      const manuals = grp(...[0, 1, 2].map((k) => box(0.2, 0.014, 0.28, [m.green, m.amber, m.blue][k], k * 0.02, k * 0.015, 0)));
      const planCyl = cyl(0.035, 0.42, m.paper, 0, 0, 0, 16); planCyl.rotation.z = Math.PI / 2;
      const plans = grp(planCyl, ...[-0.14, 0.14].map((x) => cyl(0.04, 0.02, m.red, x, 0, 0, 16)));
      plans.children.slice(1).forEach((c) => { c.rotation.z = Math.PI / 2; });
      const notice = grp(box(0.26, 0.008, 0.34, m.paper, 0, 0, 0), box(0.26, 0.009, 0.06, m.green, 0, 0.001, -0.14), box(0.18, 0.009, 0.012, m.grey, 0, 0.001, -0.04), box(0.18, 0.009, 0.012, m.grey, 0, 0.001, 0));
      const guide = grp(box(0.16, 0.02, 0.22, m.orange, 0, 0, 0), box(0.14, 0.022, 0.012, m.paper, 0, 0.001, -0.04));
      const mv = (g, x, z) => { g.children.forEach((c) => { c.position.x += x; c.position.z += z; c.position.y += 0.02; }); return g; };
      return { parts: [
        { id: 'keys', name: 'Keys and key register', group: mv(keys, -0.35, 0.15), explode: [-0.08, 0.2, 0], anchor: [-0.3, 0.02, 0.2], flag: 'T', spec: 'Every lock has a key, counted and signed for. The pages read do not describe a key handover, so this is Typical.', desc: 'Count them and sign.' },
        { id: 'folder', name: 'Certificates folder', group: mv(folder, -0.05, 0.1), explode: [0, 0.3, 0], anchor: [0.12, 0.04, 0.22], flag: 'V', src: 'cavComplete', spec: 'The CAV page says to keep all documents, agreements and certificates for the project. The folder holds the permit, the certificates and the occupancy permit or certificate of final inspection.', desc: 'Keep every document.' },
        { id: 'manuals', name: 'Warranties and manuals', group: mv(manuals, 0.32, 0.12), explode: [0.12, 0.25, 0], anchor: [0.4, 0.05, 0.2], flag: 'T', spec: 'Manufacturers’ warranty sheets and manuals for the appliances, the hot water unit, windows, roofing, flooring and fixtures. Typical practice.', desc: 'From each supplier.' },
        { id: 'plans', name: 'As-built plans', group: mv(plans, -0.22, -0.2), explode: [-0.1, 0.35, 0], anchor: [-0.05, 0.04, -0.2], flag: 'T', spec: 'The plans as built, including any variations. The pages read do not require them in the pack, so this is Typical.', desc: 'Plans as built.' },
        { id: 'notice', name: 'Notice of Cover', group: mv(notice, 0.1, -0.2), explode: [0.05, 0.4, 0], anchor: [0.23, 0.03, -0.1], flag: 'V', src: 'bpcHWb', spec: 'The BPC gives the owner a Notice of Cover once it accepts the Home Warranty premium. For older contracts the pack holds the DBI certificate of insurance instead.', desc: 'From the BPC.' },
        { id: 'guide', name: 'Maintenance guide', group: mv(guide, 0.4, -0.2), explode: [0.18, 0.3, 0], anchor: [0.4, 0.04, -0.1], flag: 'T', spec: 'A short guide to cleaning, gutters, sealant, grout, termite checks and service dates. Not stated on the pages read.', desc: 'How to look after it.' },
      ] };
    },
  },

  clock: {
    title: 'The warranty clock: four bars and the start line', sub: 'Home Warranty runs 2 years for other defects and 6 years for major defects. The claim against the builder runs 10 years. The old DBI ran 6 years. Bars are drawn at 0.2 m a year',
    floor: -0.1, gridSize: 3, camera: { pos: [1.25, 1.2, 3.1], target: [0.85, 0.35, 0] },
    build(kit) {
      const { box } = kit, m = MAT(kit);
      const bar = (y, yr, c, z) => grp(box(yr * 0.2, 0.1, 0.12, m[c], yr * 0.1, 0, z));
      return { parts: [
        { id: 'other', name: 'Other defects: up to 2 years', group: bar(0, 2, 'green', 0.4), explode: [0, 0.0, 0], anchor: [0.4, 0.06, 0.46], flag: 'V', src: 'bpcHW', spec: 'Home Warranty covers other defects or non-compliant work for up to 2 years after completion.', desc: 'Home Warranty.' },
        { id: 'major', name: 'Major defects: up to 6 years', group: bar(0, 6, 'green', 0.2), explode: [0, 0.14, 0], anchor: [1.2, 0.06, 0.26], flag: 'V', src: 'bpcHW', spec: 'Home Warranty covers major defects for up to 6 years after completion.', desc: 'Home Warranty.' },
        { id: 'builder', name: 'Claim against the builder: up to 10 years', group: bar(0, 10, 'red', 0.0), explode: [0, 0.28, 0], anchor: [2.0, 0.06, 0.06], flag: 'C', src: 'madd134', spec: 'CAV says up to 10 years from the date the work was completed. A law firm reads section 134 of the Building Act 1993 as 10 years from the date of the occupancy permit. Confirm which.', desc: 'Start date is Confirm.' },
        { id: 'dbi', name: 'Old DBI: 6 years', group: bar(0, 6, 'amber', -0.2), explode: [0, 0.42, 0], anchor: [1.2, 0.06, -0.14], flag: 'V', src: 'cavComplete', spec: 'Under the old scheme DBI protected the owner for 6 years for work over $16,000 if the builder died, became insolvent or disappeared. It applies to contracts before 1 July 2026.', desc: 'Contracts before 1 July 2026.' },
        { id: 'start', name: 'Start of the clock', group: grp(box(0.03, 0.7, 0.9, m.dark, 0, 0.3, 0.1)), explode: [-0.2, 0.0, 0], anchor: [0, 0.65, 0.5], flag: 'C', src: 'madd134', spec: 'The clock starts at completion on some pages and at the occupancy permit date on others, and the Home Warranty page says only “after completion”. Confirm which.', desc: 'Completion or permit date.' },
      ] };
    },
  },
};

export default {
  n: 18, id: 'handover', title: 'Completion, occupancy and handover', subtitle: 'The defects list, the certificates, the final inspection, the occupancy permit, the final payment, the handover pack and the warranty clock, with Home Warranty from 1 July 2026 and the older DBI shown for earlier contracts.',
  phases, build, details, drawings, howto, trades, materials, quotes, quoteTips, inspections, exam, sources: [...sources, 'vbaCert', 'bpcTol26'], caution,
};

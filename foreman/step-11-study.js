// Step 11 study content: drawings, steps, trades, materials, quotes, inspections and exam cards for insulation and energy efficiency.
// Flags: V = Verified against a source named in SOURCES, T = Typical practice, C = Confirm. The ABCB pages carry NSW-labelled text or 2019 cross-references and no stated edition.
// R-value tables, AS/NZS 4859.1, AS 3999, AS/NZS 4200 and AS 2047 were not opened.
import { svg, T, L, R, C as Circ, P, dim, call, arrow } from './dwg.js';

const wrapT = (x, y, text, n, dy = 18, cls = 'd-mute') => { const out = []; let cur = ''; for (const w of text.split(' ')) { if ((cur + ' ' + w).trim().length > n) { out.push(cur); cur = w; } else cur = (cur + ' ' + w).trim(); } if (cur) out.push(cur); return out.map((t, i) => T(x, y + i * dy, t, { cls })); };

/* ---------- drawings ---------- */
function routeDwg() {
  const body = [R(0, 0, 900, 800, 'd-bg')], blk = (x, y, w, h, lines) => { body.push(R(x, y, w, h, 'd-box', 6)); lines.forEach((t, i) => body.push(T(x + 12, y + 22 + i * 16, t, { cls: i ? 'd-mute' : 'd-bold' }))); };
  const A = 40, B = 450, W = 380;
  body.push(T(40, 40, 'From the energy report to the as-built records', { cls: 'd-bold' }), T(A, 68, 'A  Design and approval', { cls: 'd-bold' }), T(B, 68, 'B  Build it and prove it', { cls: 'd-bold' }));
  blk(A, 84, W, 56, ['Plans and the energy rating', 'Class 1 house, climate zone 6 (Typical)']); blk(A, 160, W, 56, ['An assessor models the house', 'NatHERS software: 7 stars, whole-of-home 60 or more']);
  blk(A, 236, W, 56, ['Certificate with stamp and QR code', 'Ties the certificate to the stamped plans']); blk(A, 312, W, 72, ['Permit documents list the features', 'Insulation, windows and sealing the house is rated on', 'Confirm what your surveyor wants to see']);
  for (const [y1, y2] of [[140, 160], [216, 236], [292, 312]]) body.push(arrow(A + W / 2, y1, A + W / 2, y2));
  blk(B, 84, W, 56, ['Order to the report', 'R-values and products as listed']); blk(B, 160, W, 56, ['Wrap, ducts, wall batts, sealing', 'Before the plasterboard goes up']);
  blk(B, 236, W, 56, ['Ceiling batts and roof space vents', 'Clear of downlights, fans and eave vents']); blk(B, 312, W, 72, ['Inspect and photograph', 'Gaps, squashed batts, missing seals', 'Fix them while they can still be reached']);
  blk(B, 404, W, 56, ['Records to the file', 'Labels, photographs, certificate, window schedule']);
  for (const [y1, y2] of [[140, 160], [216, 236], [292, 312], [384, 404]]) body.push(arrow(B + W / 2, y1, B + W / 2, y2));
  body.push(L(A + W, 348, 435, 348), L(435, 348, 435, 112), arrow(435, 112, B, 112));
  // C: the two scores, drawn to scale
  body.push(T(40, 500, 'C  The two scores a new house has to reach', { cls: 'd-bold' }));
  const sx = 60, sw = 400, star = (n) => sx + (n / 10) * sw, who = (n) => sx + (n / 150) * sw;
  body.push(T(60, 534, 'NatHERS star rating, 0 to 10', { cls: 'd-mute' }), R(sx, 544, sw, 20, 'd-conc'), R(star(7), 544, star(10) - star(7), 20, 'd-e-ok'), L(star(7), 538, star(7), 570, 'd-cut'));
  for (let i = 0; i <= 10; i++) body.push(L(star(i), 564, star(i), 570, 'd-dim'), T(star(i), 584, String(i), { anchor: 'middle', cls: 'd-dimt' }));
  body.push(T(star(7) - 6, 534, '7 stars minimum', { anchor: 'end', cls: 'd-bold' }));
  body.push(T(60, 612, 'Whole-of-home rating, 0 to 150', { cls: 'd-mute' }), R(sx, 638, sw, 20, 'd-conc'), R(who(60), 638, who(150) - who(60), 20, 'd-e-ok'), L(who(60), 632, who(60), 664, 'd-cut'), L(who(50), 638, who(50), 664, 'd-dim'));
  for (const n of [0, 50, 100, 150]) body.push(L(who(n), 658, who(n), 664, 'd-dim'), T(who(n), 680, String(n), { anchor: 'middle', cls: 'd-dimt' }));
  body.push(T(who(60) + 6, 630, 'Class 1 needs 60', { cls: 'd-bold' }), T(who(50) - 4, 702, 'Class 2 (apartments) needs 50', { anchor: 'middle', cls: 'd-mute' }));
  body.push(...wrapT(520, 530, 'From 1 May 2024 a new home needs 7 stars and a whole-of-home rating of at least 60.', 44, 18));
  body.push(...wrapT(520, 590, 'The whole-of-home budget covers heating, cooling, hot water, lighting and pool or spa pumps.', 44, 18));
  body.push(...wrapT(520, 660, 'A 7-star house uses about 20 to 25 per cent less heating and cooling energy than a 6-star house.', 44, 18));
  body.push(...wrapT(40, 740, 'Verified against the VBA and Sustainability Victoria pages in Sources. None of them names an NCC edition, so confirm the edition your permit was assessed under. The permit documents and certificate content come from the assessor and surveyor.', 112, 18));
  return svg(900, 800, body.join(''), 'Energy report to as-built records');
}

function wallDwg() {
  const body = [R(0, 0, 900, 920, 'd-bg')], k = 2.4, x0 = 60, y1 = 130, y2 = 430;
  body.push(T(40, 40, 'Wall insulation, outside to inside', { cls: 'd-bold' }), T(40, 66, 'A  Plan section through an external wall, 2.4 px per mm', { cls: 'd-bold' }));
  const xs = [x0, x0 + 110 * k, x0 + 150 * k, x0 + 150 * k, x0 + 240 * k, x0 + 253 * k];
  body.push(R(xs[0], y1, xs[1] - xs[0], y2 - y1, 'd-brick'), `<rect x="${xs[1]}" y="${y1}" width="${xs[2] - xs[1]}" height="${y2 - y1}" class="d-cav"/>`);
  body.push(R(xs[3], y1, xs[4] - xs[3], 108, 'd-timber'), R(xs[3], y2 - 108, xs[4] - xs[3], 108, 'd-timber'), R(xs[3], y1 + 108, xs[4] - xs[3], y2 - y1 - 216, 'd-ins'));
  body.push(R(xs[4], y1, xs[5] - xs[4], y2 - y1, 'd-board'), L(xs[3], y1, xs[3], y2, 'd-wm'));
  body.push(T(x0, 112, 'OUTSIDE', { cls: 'd-mute' }), T(xs[5] + 10, 160, 'INSIDE', { cls: 'd-mute' }));
  body.push(dim(xs[0], y2 + 12, xs[5], y2 + 12, '253 mm', 1));
  body.push(call(1, (xs[0] + xs[1]) / 2, y1 + 40, (xs[0] + xs[1]) / 2, 84), call(2, (xs[1] + xs[2]) / 2, y1 + 40, (xs[1] + xs[2]) / 2, 84), call(3, xs[3], y1 + 60, xs[3] + 4, 84), call(4, xs[3] + 150, y1 + 54, xs[3] + 150, 84), call(6, (xs[4] + xs[5]) / 2, y1 + 40, (xs[4] + xs[5]) / 2, 84), call(5, xs[3] + 120, 238, 740, 280));
  body.push(T(740, 308, 'between studs', { anchor: 'middle', cls: 'd-mute' }));
  body.push(arrow(xs[5] + 2, y2 + 58, xs[0], y2 + 58, 'd-air'), T((xs[0] + xs[5]) / 2, y2 + 50, 'Warm, moist indoor air pushes outward. A vapour permeable wrap lets it out.', { anchor: 'middle', cls: 'd-mute' }));
  const key = [['1', 'Brick veneer, about 110 mm. Not insulation'], ['2', 'Drained cavity, about 40 mm'], ['3', 'Wall wrap, outside the insulation'], ['4', 'Stud, 90 by 45 mm (shown at the section)'], ['5', 'Wall batt, fills the frame depth'], ['6', 'Lining, 13 mm plasterboard (Step 12)']];
  key.forEach(([n, t], i) => { const col = i % 2, row = Math.floor(i / 2); body.push(T(60 + col * 410, 520 + row * 22, n, { cls: 'd-bold' }), T(80 + col * 410, 520 + row * 22, t, { cls: '' })); });
  // B: three bays
  body.push(T(40, 598, 'B  Batt fitting, one bay at a time', { cls: 'd-bold' }));
  const bay = (x, y, filled) => { body.push(R(x, y, 200, 12, 'd-timber'), R(x, y + 150, 200, 12, 'd-timber'), R(x, y, 14, 162, 'd-timber'), R(x + 186, y, 14, 162, 'd-timber')); if (filled === 'full') body.push(R(x + 14, y + 12, 172, 138, 'd-ins')); else if (filled === 'gap') { body.push(R(x + 14, y + 52, 172, 98, 'd-ins'), R(x + 14, y + 12, 172, 40, 'd-gap')); } };
  bay(60, 630, 'full'); bay(350, 630, 'gap');
  body.push(T(160, 620, 'Good', { anchor: 'middle', cls: 'd-bold' }), T(450, 620, 'Gap at the top', { anchor: 'middle', cls: 'd-bold' }), T(745, 620, 'Squashed, seen in plan', { anchor: 'middle', cls: 'd-bold' }));
  // the squashed batt in plan: the frame is 90 mm deep and the batt has been forced into 40 mm
  body.push(R(640, 642, 216, 30, 'd-timber'), R(640, 732, 216, 30, 'd-timber'), `<rect x="640" y="672" width="216" height="60" class="d-cut" fill="none"/>`, R(718, 672, 138, 60, 'd-gap'), R(640, 672, 78, 60, 'd-ins'));
  body.push(T(679, 707, 'batt', { anchor: 'middle', cls: 'd-mute' }), T(787, 707, 'lost depth', { anchor: 'middle', cls: 'd-mute' }), T(640, 780, 'dashed = full frame depth', { cls: 'd-mute' }));
  body.push(...wrapT(60, 816, 'A full bay: the batt touches the plates and both studs.', 28, 16), ...wrapT(350, 816, 'A strip with no batt is a path for heat. It can be small and still matter.', 30, 16), ...wrapT(640, 806, 'A compressed batt loses R-value. The R-value is reduced if insulation is compressed.', 36, 16));
  body.push(...wrapT(40, 876, 'Typical, drawn from the model. Sizes are typical. R-values come from the energy report, because the NCC R-value tables were not read. Batts continue across the plates and noggings, with no gaps.', 112, 16));
  return svg(900, 920, body.join(''), 'Wall insulation section and batt fitting');
}

function exhaustDwg() {
  const body = [R(0, 0, 900, 800, 'd-bg')];
  body.push(T(40, 40, 'Getting moisture out of the house', { cls: 'd-bold' }), T(40, 68, 'A  Section through a bathroom', { cls: 'd-bold' }), T(500, 68, 'B  Required flow rate, litres per second', { cls: 'd-bold' }));
  // A: wall, ceiling, roof, fan, duct, cap and make-up air
  body.push(L(40, 150, 420, 90, 'd-line'), L(60, 150, 60, 340, 'd-wall'), L(60, 215, 400, 215, 'd-wall'), L(400, 215, 400, 296, 'd-wall'), L(40, 340, 440, 340, 'd-line'));
  body.push(R(404, 296, 8, 44, 'd-timber'), R(404, 336, 8, 4, 'd-gap'));
  body.push(R(190, 202, 36, 13, 'd-box', 2), L(208, 202, 208, 160, 'd-duct'), L(208, 160, 70, 160, 'd-duct'), R(44, 148, 12, 24, 'd-cap'));
  body.push(arrow(208, 300, 208, 222, 'd-air'), arrow(150, 160, 106, 160, 'd-air'), arrow(52, 160, 14, 160, 'd-air'), arrow(480, 330, 414, 330, 'd-air'));
  body.push(Circ(350, 280, 6, 'd-e-sw'), L(350, 215, 350, 274, 'd-line'));
  body.push(T(340, 300, 'light switch', { anchor: 'middle', cls: 'd-mute' }), T(214, 196, 'fan', { cls: 'd-mute' }), T(80, 184, 'duct to outdoor air', { cls: 'd-mute' }), T(44, 186, 'cap', { cls: 'd-mute' }), T(424, 318, 'make-up air', { cls: 'd-mute' }), T(424, 358, 'under the door', { cls: 'd-mute' }), T(230, 262, 'moist air', { cls: 'd-mute' }), T(250, 172, 'roof space', { cls: 'd-mute' }));
  body.push(...wrapT(60, 380, 'The fan discharges outside through a duct and a cap. It does not discharge into the roof space. Fresh air comes back in through a gap under the door, so the fan has air to draw.', 52, 18));
  // B: flow rates to scale, 6 px per L/s
  const rows = [['Bathroom or toilet', 25], ['Kitchen with rangehood', 40], ['Laundry', 40]];
  rows.forEach(([n, v], i) => { const y = 100 + i * 52; body.push(T(500, y + 14, n, { cls: '' }), R(500, y + 22, v * 6, 16, 'd-e-ok'), T(500 + v * 6 + 8, y + 35, `${v} L/s`, { cls: 'd-bold' })); });
  body.push(...wrapT(500, 264, 'Discharge is by a shaft or duct to outdoor air. A bathroom fan that is not run continuously is interlocked with the light and has a 10 minute run-on timer.', 52, 18));
  // C: bathroom fan control
  body.push(T(40, 500, 'C  Bathroom fan that is not run continuously', { cls: 'd-bold' }));
  const bl = (x, y, w, t1, t2) => { body.push(R(x, y, w, 52, 'd-box', 6), T(x + w / 2, y + 22, t1, { anchor: 'middle', cls: 'd-bold' }), T(x + w / 2, y + 40, t2, { anchor: 'middle', cls: 'd-mute' })); };
  bl(40, 516, 150, 'Light switched on', 'Fan starts'); bl(230, 516, 150, 'Light switched off', 'Fan keeps running'); bl(420, 516, 150, '10 minutes later', 'Fan stops'); body.push(arrow(190, 542, 230, 542), arrow(380, 542, 420, 542));
  // D: dryer
  body.push(T(40, 620, 'D  Clothes dryer that vents', { cls: 'd-bold' }));
  bl(40, 636, 150, 'Venting dryer', 'Moist air out'); bl(230, 636, 150, 'Duct', 'Short run (Typical)'); bl(420, 636, 150, 'Outdoor air', 'Not the roof space'); body.push(arrow(190, 662, 230, 662), arrow(380, 662, 420, 662));
  body.push(...wrapT(620, 530, 'Interlocked means the fan starts when the light is switched on.', 34, 18), ...wrapT(620, 636, 'Condensing dryers are excluded. The surveyor checks that the drawings show a venting dryer and its discharge.', 34, 18));
  body.push(...wrapT(40, 740, 'Rates and the interlock come from GE 15 (version 1.0, 4 December 2024, NCC 2022), a BPC practice note. The model shows one run per fan. Make-up air is 14,000 mm² of openings or compliance with AS 1668.2:2012, which was not opened. Duct size and run length follow the fan maker.', 112, 16));
  return svg(900, 800, body.join(''), 'Exhaust ventilation');
}

function roofDwg() {
  const body = [R(0, 0, 900, 860, 'd-bg')], A = [], pitch = 22.5, tn = Math.tan(pitch * Math.PI / 180), ry = (x) => 236 + Math.abs(400 - x) * tn;
  body.push(T(40, 40, 'Roof space ventilation, climate zones 6 to 8', { cls: 'd-bold' }), T(40, 66, 'A  Section of a pitched roof, 22.5 degrees as an example', { cls: 'd-bold' }));
  A.push(L(60, ry(60), 400, 236, 'd-line'), L(400, 236, 740, ry(740), 'd-line'), L(100, 360, 100, 470, 'd-wall'), L(700, 360, 700, 470, 'd-wall'), L(100, 360, 700, 360, 'd-wall'));
  A.push(R(100, 338, 600, 22, 'd-ins2'), R(100, 350, 26, 10, 'd-timber'), R(674, 350, 26, 10, 'd-timber'), R(62, ry(62) + 2, 38, 6, 'd-seal'), R(700, ry(700) + 2, 38, 6, 'd-seal'), R(385, 226, 30, 10, 'd-seal'));
  A.push(L(104, 338, 150, ry(150) + 6, 'd-line'), L(696, 338, 650, ry(650) + 6, 'd-line'));
  const pts = (side) => { const a = []; for (let x = 150; x <= 392; x += 30) a.push([side < 0 ? x : 800 - x, ry(x) + 16]); return a; };
  for (const s of [-1, 1]) { A.push(arrow(s < 0 ? 81 : 719, 430, s < 0 ? 81 : 719, ry(81) + 12, 'd-air'), P([[s < 0 ? 81 : 719, ry(81) + 12], ...pts(s)], 'd-air', false)); }
  A.push(arrow(400, 252, 400, 196, 'd-air'));
  A.push(call(1, 81, ry(81) + 5, 40, 420), call(2, 112, 349, 130, 470), call(3, 125, 342, 200, 250), call(4, 400, 231, 470, 190), call(5, 540, 300, 640, 220), call(6, 400, 361, 400, 410));
  A.push(T(600, 270, 'pitch 22.5° (example)', { cls: 'd-mute' }), T(120, 395, 'ceiling', { cls: 'd-mute' }));
  body.push(`<g transform="translate(0,-60)">${A.join('')}</g>`);
  const key = [['1', 'Eave vent, in the soffit. Air comes in here'], ['2', 'Ceiling batts overlap the top of the wall by 50 mm or more where the wall has no insulation'], ['3', 'Baffle keeps the batts off the eave vent'], ['4', 'High level vent. Air leaves here'], ['5', 'Roof space, at least 20 mm high'], ['6', 'Ceiling lining and batts']];
  key.forEach(([n, t], i) => { const col = i % 2, row = Math.floor(i / 2); body.push(T(60 + col * 410, 470 + row * 48, n, { cls: 'd-bold' }), ...wrapT(80 + col * 410, 470 + row * 48, t, 46, 16, '')); });
  // B: what the area numbers mean, slot width at 4 px per mm
  body.push(T(40, 640, 'B  What the numbers mean, as an open slot 1 m long', { cls: 'd-bold' }));
  [[25, '25,000 mm² per metre'], [18, '18,000 mm² per metre'], [7, '7,000 mm² per metre'], [5, '5,000 mm² per metre']].forEach(([mm, t], i) => { const y = 660 + i * 26; body.push(R(60, y, mm * 4, 12, 'd-e-ok'), T(60 + mm * 4 + 10, y + 11, `${t}, a ${mm} mm slot`, { cls: '' })); });
  body.push(...wrapT(500, 668, 'Real vents open less than their gross size, so use the maker\'s rated free area. Check the rated open area on the product label.', 46, 16));
  body.push(...wrapT(40, 790, 'Under 10 degrees: 25,000 at each of two opposing ends. 10 to under 15: 25,000 at the eaves and 5,000 high. 15 to under 75: 7,000 at the eaves and 5,000 high, plus 18,000 at the eaves for a cathedral ceiling. All in mm² per metre, from GE 15 (NCC 2022).', 112, 16));
  return svg(900, 850, body.join(''), 'Roof space ventilation section');
}

export const drawings = [
  { id: 'route', title: 'Energy report to records', scale: 'Flow, with the two scores to scale', svg: routeDwg(),
    notes: ['From the design to the as-built records: the assessor models the house, the certificate and permit documents list what is built, and the builder builds to them and proves it.', 'From 1 May 2024 a new Victorian home needs NatHERS 7 stars and a whole-of-home rating of at least 60. The whole-of-home score covers heating, cooling, hot water, lighting and pool or spa pumps.', 'The VBA and Sustainability Victoria pages name no NCC edition, so confirm which edition your permit was assessed under.'] },
  { id: 'wall', title: 'Wall insulation', scale: 'Plan section at 2.4 px per mm, bays shown as elevations', svg: wallDwg(),
    notes: ['The layers of an external brick veneer wall, outside to inside: brick, drained cavity, wall wrap, frame with batts and lining. Then a full bay, a bay with a gap and a squashed batt.', 'Insulation must abut or overlap adjoining insulation to form a continuous barrier, and its R-value is reduced if it is compressed. The wrap goes on the outside of the insulation and must be vapour permeable enough for the climate zone.', 'R-values come from the energy report. The NCC R-value tables were not read, and the NCC pages carry NSW-labelled text or 2019 cross-references and no stated edition.'] },
  { id: 'exhaust', title: 'Exhaust ventilation', scale: 'Schematic, flow rates to scale', svg: exhaustDwg(),
    notes: ['Exhaust rates are 25 L/s for bathrooms and sanitary compartments and 40 L/s for kitchens and laundries, discharged by a duct or shaft to outdoor air.', 'A bathroom fan that is not run continuously is interlocked with the light and has a 10 minute run-on. A venting clothes dryer discharges to outdoor air.', 'Rates come from GE 15 (version 1.0, 4 December 2024, NCC 2022). The model\'s fan positions and duct runs are illustrative.'] },
  { id: 'roof', title: 'Roof space ventilation', scale: 'Section, slot widths at 4 px per mm', svg: roofDwg(),
    notes: ['In climate zones 6 to 8 the roof space needs openings at the eaves and high up, sized by roof pitch. The roof space must be at least 20 mm high.', 'Keep the eave vent clear with a baffle, and keep ceiling batts overlapping the top of the wall by at least 50 mm where the wall has no insulation.', 'Exemptions include concrete roofs, structural insulated roof panels, BAL FZ roofs, roof spaces directly under tiles with no sarking, and Class 10a roof spaces serving no other class. Real vent products open less than their gross size.'] },
];

/* ---------- study content ---------- */
export const howto = [
  ['Get the energy report and read it', 'Ask the designer for the stamped NatHERS certificate and the permit documents. Read the R-values, the window schedule, the sealing and ventilation notes and the products named. The stamp and QR code tie the certificate to the plans, so a surveyor can check the built house against it.', 'Builder and designer', 'V', 'nathersBuild'],
  ['Order to the report', 'Order the insulation to the R-values and products listed. Do not swap a product without asking the assessor, because a different product can change the rating.', 'Builder', 'T'],
  ['Take delivery and keep it dry', 'Check the labels on each pack for the R-value and product, keep the packs off the ground and covered, and photograph the labels for the records.', 'Builder', 'T'],
  ['Check the wall wrap', 'Wall sarking goes on the exterior side of the insulation and must comply with AS/NZS 4200.1, installed to AS/NZS 4200.2. In zones 4 and 5 it must be vapour permeance Class 3 or better, and in zones 6 to 8 Class 4 or better. Lap and seal it at joints and openings as the maker directs.', 'Carpenter or builder', 'V', 'bpcGE15'],
  ['Duct the exhaust fans to outdoor air', 'Size the fans to 25 L/s for bathrooms and 40 L/s for kitchens and laundries, and discharge by a duct or shaft to outdoor air, not into the roof space. Interlock a bathroom fan that is not run continuously with the light, with a 10 minute run-on. Settle who fits the roof or eave cap.', 'Electrician and roofer', 'V', 'bpcGE15'],
  ['Fit the wall batts', 'Cut batts to fit snugly between studs and plates, filling the depth and touching the next piece. Do not compress them. Cut around boxes and cables without squashing the batt, and fit reflective foil with the airspace its R-value needs.', 'Insulation installer', 'V', 'nccHp132'],
  ['Seal around windows, doors and penetrations', 'Seal the junctions around windows and doors, and every penetration through the walls and ceiling, with close-fitting trim, expanding foam, rubber strip or caulking. Windows that meet the AS 2047 air infiltration limits are exempt from edge seals.', 'Carpenter or builder', 'V', 'nccHp134'],
  ['Fit door seals and fan dampers', 'The bottom of an external door needs a draught protection device. Exhaust fans serving a conditioned space or a habitable room in zones 4 to 8 need a sealing device such as a self-closing damper or filter.', 'Carpenter and electrician', 'V', 'nccHp134'],
  ['Lay the ceiling batts', 'Lay batts over the ceiling lining so they touch and cover the top of the wall by 50 mm or more where the wall has no insulation. This is normally done after the ceiling plasterboard of Step 12 is fixed. Keep batts clear of downlights, flues and fans, using covers or fittings rated for insulation contact.', 'Insulation installer', 'V', 'nccHp132'],
  ['Keep the roof space vents clear', 'Check the eave and high level openings against the pitch table, and fit baffles so batts do not block the eave vents. Real vent products open less than their gross size, so read the rated free area.', 'Roofer and installer', 'V', 'bpcGE15'],
  ['Inspect and photograph', 'Walk every wall bay before the plasterboard goes up and the ceiling once the batts are laid. Look for gaps, squashed batts, missing seals and covers. Photograph each wall and the ceiling.', 'Builder', 'T'],
  ['File the records', 'Keep the certificate, product labels, installer\'s invoice, photographs and inspection record with the permit documents, and check the installed windows match the window schedule.', 'Builder', 'T'],
];

export const trades = [
  { t: 'NatHERS accredited assessor', role: 'Models the house in accredited software, checks the whole-of-home rating, and issues the certificate with the stamped plans.', when: 'Before the permit. Again if the design changes', reg: 'A NatHERS accredited assessor using accredited software (NatHERS factsheet, July 2019). The accreditation scheme was not checked further.', ask: ['Certificate with stamp and QR code', 'Whole-of-home rating shown', 'Re-assessment cost if windows or insulation change', 'What the surveyor needs at final'] },
  { t: 'Insulation installer', role: 'Installs wall and ceiling batts, reflective foil and any floor insulation to the energy report.', when: 'After the wall wrap and services rough-in, before the linings. Ceiling batts after the ceiling lining', reg: 'Licensing or registration for insulation installers was not checked. Ask for insurance and evidence of experience (Typical).', ask: ['R-value and product by location', 'Labour only or supply and install', 'Photographs of each wall and the ceiling on completion', 'Cover for downlights and fans'] },
  { t: 'Roofer', role: 'Fits eave and high-level roof vents, fan caps and the roof sarking.', when: 'With the roof, before the ceiling batts', reg: 'Work under the builder\'s contract. Any separate roofing licence rules were not checked.', ask: ['Vent area per metre and the rated free area', 'Who fits the exhaust caps', 'Baffles at the eaves'] },
  { t: 'Window supplier or glazier', role: 'Supplies windows and glazing to the window schedule and seals the frame.', when: 'Frames at lock-up, sealing before linings', reg: 'Windows must match the energy report. AS 2047 air infiltration limits were not opened.', ask: ['Frame and glass to the window schedule', 'AS 2047 test evidence', 'Edge seal or gap fill details'] },
  { t: 'Electrician', role: 'Wires the exhaust fans and fits downlights and covers suitable for insulation contact.', when: 'Rough-in, then fit-off', reg: 'Electrical installation work needs a licensed electrician and a Certificate of Electrical Safety (Step 9).', ask: ['Fan rates and interlock with the light', 'Downlights or covers rated for insulation', 'Who fits the fan damper'] },
  { t: 'Building surveyor (RBS)', role: 'Checks the documents against the permit and can require additional inspections.', when: 'As listed on the permit', reg: 'Insulation is not named as a mandatory stage. The surveyor can require an additional inspection under section 35, with energy efficiency features as an example.', ask: ['Whether they want to inspect insulation', 'What evidence they want before the occupancy permit', 'Which NCC edition the permit was assessed under'] },
];

export const materials = [
  ['Wall batts', 'Bulk insulation cut to fit between studs, sold by R-value (glasswool, polyester or similar)', 'Insulation merchants. Bunnings stocks some batts (confirm the range). Makers include Bradford, Knauf, Fletcher and Autex', 'T', 'The R-value and product come from the energy report.'],
  ['Ceiling batts', 'Thicker bulk batts laid over the ceiling lining, often in a wider format', 'Insulation merchants. Bunnings stocks some (confirm the range)', 'T', 'Check the R-value on the label. Clearances around downlights come from AS/NZS 3000 and the product instructions, neither opened.'],
  ['Wall wrap', 'Vapour permeable membrane on the outside of the insulation, complying with AS/NZS 4200.1', 'Building suppliers', 'V', 'Class 3 in zones 4 and 5 (0.143 μg/N.s) and Class 4 in zones 6 to 8 (1.14 μg/N.s), from GE 15.'],
  ['Reflective foil insulation', 'Foil laminate that needs a still airspace to work', 'Building suppliers', 'V', 'Roll overlaps of at least 150 mm or taped. In roofs, emittance of 0.05 or less, airspace of at least 20 mm and facing downward in zones 3 to 8 (ABCB Part 13.2 page).'],
  ['Expanding foam and sealant', 'Foam and caulking for the gap between frame and stud, and for penetrations', 'Bunnings and building suppliers', 'V', 'Expanding foam and caulking are named sealing methods in Part 13.4. Use a product the maker rates for the purpose (Typical).'],
  ['Door draught seals', 'A bottom seal for external doors, plus jamb strips', 'Door suppliers and Bunnings', 'V', 'The bottom edge of an external door needs a draught protection device (Part 13.4).'],
  ['Exhaust fans with dampers', 'Ceiling or wall fans rated for 25 or 40 L/s, with a self-closing damper', 'Electrical wholesalers and Bunnings (confirm the range)', 'V', '25 L/s for bathrooms and 40 L/s for kitchens and laundries (GE 15). Damper or filter required by Part 13.4.'],
  ['Ducting and external caps', 'Flexible or rigid duct to a cap at the eave, wall or roof', 'Electrical wholesalers and roofing suppliers', 'T', 'Discharge to outdoor air is required. Duct size and length follow the fan maker.'],
  ['Downlight covers', 'Covers or fittings that let batts sit near a downlight', 'Electrical wholesalers', 'C', 'Rated clearances come from AS/NZS 3000 and the product instructions, neither opened.'],
  ['Roof vents', 'Eave vents in the soffit and ridge or roof vents at high level', 'Roofing suppliers', 'V', 'Opening area per metre by pitch, from GE 15. Check the rated free area on the product.'],
  ['Tape and fixings for wrap and foil', 'Tape and staples the maker names', 'Building suppliers', 'T', 'Use the product the wrap maker specifies.'],
];

export const quotes = [
  { who: 'Insulation installer or supplier', n: '3', what: ['R-value and product by location: walls, ceiling, any floor', 'Supply and install or labour only, and waste', 'Photographs on completion and compliance with the energy report'] },
  { who: 'NatHERS assessor', n: '2', what: ['Certificate and whole-of-home rating', 'Re-assessment if the design changes', 'Stamped documents delivered with the plans'] },
  { who: 'Window supplier', n: '3', what: ['Frames and glass to the window schedule', 'Air infiltration test evidence', 'Lead time and sealing details'] },
  { who: 'Exhaust fans and ducting', n: '2', what: ['Fans by room with the flow rates', 'Ducts, caps and dampers', 'Who fits the cap and who wires the fan'] },
  { who: 'Roofer (vents)', n: '2', what: ['Eave and high-level vent area per metre', 'Rated free area of the products', 'Baffles at the eaves'] },
];
export const quoteTips = [
  'Ask every insulation quote to list the R-value and product by location. A quote for "insulation to the house" hides what is missing, and the energy report fixes the R-values you need.',
  'Check the quote says who supplies the downlight covers and who fits the fan dampers and caps. They fall between trades.',
  'Ask the installer to photograph each wall and the ceiling before the plasterer starts, and make that part of the price.',
  'If a product changes, ask the assessor before ordering. A different product or window can change the rating and the certificate.',
  'Keep the energy report, the stamped plans, the product labels, the invoice and the photographs together. They show the house matches the report.',
  'Keep every quote and the energy report. They are evidence of estimating and supervision for the BPC application.',
];

export const inspections = [
  ['Energy report check', 'Builder and designer', 'Before ordering', 'The window schedule, R-values, products and sealing notes match the plans and permit documents. Confirm which NCC edition the permit was assessed under.', 'C', 'vbaEeReq'],
  ['Delivery check', 'Builder', 'On delivery', 'Labels show the right R-value and product, packs are dry and off the ground, and photographs are taken of the labels.', 'T'],
  ['Wall wrap check', 'Builder', 'Before wall batts', 'Wrap is intact, on the outside of the insulation, lapped and sealed at joints and openings, and rated Class 3 or better in zones 4 and 5, or Class 4 or better in zones 6 to 8.', 'V', 'bpcGE15'],
  ['Exhaust duct check', 'Electrician and builder', 'Before the ceiling lining', 'Fans rated 25 or 40 L/s, ducts run to outdoor air with a cap, dampers fitted, and a bathroom fan interlocked with the light.', 'V', 'bpcGE15'],
  ['Wall batt inspection', 'Builder and installer', 'Before the plasterboard', 'Batts abut or overlap with no gaps, fill the bay depth, are not compressed, and reach the top and bottom plates.', 'V', 'nccHp132'],
  ['Sealing check', 'Builder', 'Before the plasterboard', 'Window and door junctions, penetrations and fans sealed, door bottoms fitted with a draught device, and dampers fitted.', 'V', 'nccHp134'],
  ['Ceiling batt check', 'Builder and installer', 'After the batts are laid', 'Batts touch and overlap the top of the wall by 50 mm or more where the wall has no insulation, covers sit over downlights and fans, and eave vents are clear.', 'V', 'nccHp132'],
  ['Roof ventilation check', 'Builder and roofer', 'Before the roof space is closed', 'Openings at the eaves and high level match the pitch table, and the roof space is at least 20 mm high.', 'V', 'bpcGE15'],
  ['Surveyor inspection (if required)', 'Building surveyor', 'As the permit lists, or as the surveyor requires', 'Insulation is not a named stage. The surveyor can require an additional inspection under section 35, with energy efficiency features as an example.', 'V', 'bpcMI01'],
  ['As-built verification (optional)', 'Assessor or tester', 'Near completion', 'Thermal imaging and airtightness testing were offered free to builders of new 7-star homes. The page is undated, so check whether the offer still runs.', 'C', 'svAbv'],
  ['Records', 'Builder', 'Before the occupancy permit', 'Certificate, product labels, installer invoice, photographs and the window schedule are filed with the permit documents.', 'T'],
];

export const exam = [
  ['What energy rating must a new Victorian home meet from 1 May 2024?', 'NatHERS 7 stars and a whole-of-home rating of at least 60.', 'V', 'vbaEeReq'],
  ['What does the whole-of-home rating cover?', 'Heating, cooling, hot water, lighting and pool or spa pumps. It is scored from 0 to 150.', 'V', 'svSeven'],
  ['What are the whole-of-home minimums for a Class 1 house and for a Class 2 apartment?', '60 for Class 1 and 50 for Class 2.', 'V', 'svSeven'],
  ['How much less heating and cooling does a 7-star house use than a 6-star house?', 'About 20 to 25 per cent.', 'V', 'svSeven'],
  ['Which performance requirements must a Class 1 house meet for energy efficiency?', 'H6P1 for thermal performance and H6P2 for energy usage, which can be met by a Deemed-to-Satisfy solution.', 'V', 'vbaEeFaq'],
  ['Who issues the NatHERS certificate, and what links it to the plans?', 'An accredited assessor using accredited software. A stamp and QR code link it to the plans.', 'V', 'nathersBuild'],
  ['Is rooftop solar or double glazing required for 7 stars?', 'No. Rooftop solar is not required and double glazing is not mandatory.', 'V', 'energyVicStd'],
  ['What does the all-electric rule for new homes apply to?', 'From 1 January 2024, new homes and residential subdivisions that need a planning permit connect only to all-electric networks, applied through the planning permit process.', 'V', 'vicAllElectric'],
  ['What must insulation do where pieces meet?', 'Abut or overlap adjoining insulation so the barrier is continuous.', 'V', 'nccHp132'],
  ['What happens to R-value if insulation is compressed?', 'The R-value is reduced.', 'V', 'nccHp132'],
  ['How much must reflective insulation rolls overlap?', 'At least 150 mm, or be taped.', 'V', 'nccHp132'],
  ['What does reflective insulation in a roof need in zones 3 to 8?', 'Surface emittance of 0.05 or less, an airspace of at least 20 mm and a downward facing surface.', 'V', 'nccHp132'],
  ['How far must bulk ceiling insulation overlap an external wall that has no insulation?', 'At least 50 mm.', 'V', 'nccHp132'],
  ['When is a thermal break needed under a metal roof?', 'Where metal sheeting is fixed directly to metal framing, a thermal break of at least R0.2.', 'V', 'nccHp132'],
  ['What must be sealed under Part 13.4?', 'Roof lights, external doors and windows, exhaust fans and chimneys, for conditioned spaces or habitable rooms in zones 4 to 8.', 'V', 'nccHp134'],
  ['What does the bottom of an external door need?', 'A draught protection device.', 'V', 'nccHp134'],
  ['What sealing device does an exhaust fan need?', 'A self-closing damper or filter, where it serves a conditioned space or a habitable room in zones 4 to 8.', 'V', 'nccHp134'],
  ['How may junctions and penetrations be sealed?', 'With close-fitting trim, expanding foam, rubber strip or caulking.', 'V', 'nccHp134'],
  ['Which windows are exempt from edge seals?', 'Windows that meet the AS 2047 air infiltration maxima.', 'V', 'nccHp134'],
  ['What air leakage level does the NCC effectively require, and is post-build testing mandatory?', 'Under 10 air changes per hour at 50 Pa. Post-build testing is not mandatory.', 'V', 'svSeven'],
  ['Where does wall sarking go and which Standards apply?', 'On the exterior side of the primary insulation, complying with AS/NZS 4200.1 and installed to AS/NZS 4200.2.', 'V', 'bpcGE15'],
  ['What vapour permeance must wall sarking have in each zone?', 'Zones 4 and 5: Class 3 or better (0.143 μg/N.s). Zones 6, 7 and 8: Class 4 or better (1.14 μg/N.s).', 'V', 'bpcGE15'],
  ['What is needed if a wall has no pliable membrane?', 'A drained cavity, except for single-skin concrete and masonry.', 'V', 'bpcGE15'],
  ['What are the exhaust flow rates?', 'Bathrooms and sanitary compartments 25 L/s. Kitchens (including rangehoods) and laundries 40 L/s.', 'V', 'bpcGE15'],
  ['Where must exhaust discharge?', 'By a shaft or duct to outdoor air.', 'V', 'bpcGE15'],
  ['How is a bathroom exhaust fan that is not run continuously controlled?', 'Interlocked with the light and with a 10 minute run-on timer.', 'V', 'bpcGE15'],
  ['How much make-up air opening does a room without natural ventilation need?', '14,000 mm² of openings, or compliance with AS 1668.2:2012.', 'V', 'bpcGE15'],
  ['Where must a venting clothes dryer discharge?', 'To outdoor air. Condensing dryers are excluded.', 'V', 'bpcGE15'],
  ['In which climate zones are roof space openings required, and how high must the roof space be?', 'Zones 6, 7 and 8, with a roof space at least 20 mm high.', 'V', 'bpcGE15'],
  ['What roof space openings are needed for a pitch of 15 degrees to under 75?', '7,000 mm² per metre at the eaves and 5,000 mm² per metre at high level, plus 18,000 mm² per metre at the eaves for a cathedral ceiling.', 'V', 'bpcGE15'],
  ['What roof space openings are needed under 10 degrees, and from 10 to under 15?', 'Under 10: 25,000 mm² per metre at each of two opposing ends. 10 to under 15: 25,000 at the eaves and 5,000 at high level.', 'V', 'bpcGE15'],
  ['Which roofs are exempt from the roof space ventilation rules?', 'Concrete roofs, structural insulated roof panels, roofs required to meet BAL FZ, roof spaces directly beneath tiles with no sarking, and Class 10a roof spaces not serving other classes.', 'V', 'bpcGE15'],
  ['Is insulation a mandatory inspection stage?', 'It is not named. The surveyor lists the prescribed stages on the permit and can require an additional inspection under section 35, with energy efficiency features as an example.', 'V', 'bpcMI01'],
  ['What is GE 15?', 'The BPC practice note on condensation management, version 1.0, 4 December 2024, written for NCC 2022 and applying to Class 1 buildings.', 'V', 'bpcGE15'],
  ['Which NCC climate zone is Melbourne in?', 'Zone 6. Check your site on the ABCB climate zone map.', 'T'],
];

/* ---------- sources and caution ---------- */
export const sources = ['vbaEeReq', 'vbaEeFaq', 'svSeven', 'energyVicStd', 'nathersBuild', 'vicAllElectric', 'bpcGE15', 'nccHp132', 'nccHp134', 'nccHp108', 'bpcMI01', 'svAbv', 'bpcEE03'];
export const caution = 'Energy rules here come from VBA, Sustainability Victoria and Energy Victoria pages, a NatHERS factsheet from July 2019, the BPC practice note GE 15 (version 1.0, 4 December 2024, NCC 2022) and ABCB NCC 2022 web pages. The ABCB Part 13.2 and 13.4 pages carry NSW-labelled text and no stated edition, the Part 10.8 page shows 2019 cross-references, and none of the VBA or Sustainability Victoria pages names an edition, so confirm the NCC edition your permit was assessed under. The R-value tables were not read, so no R-values are given: take them from the energy report. AS/NZS 4859.1, AS 3999, AS/NZS 4200, AS 2047 and AS/NZS 3000 were not opened, so insulation product standards, bulk insulation installation rules and downlight clearances are Confirm. The older BPC note EE 03 was written for NCC 2019, so its window schedule and permit document points are Confirm. Part 13.7 lighting limits were not read. The Sustainability Victoria free as-built test page is undated and may have ended. Batt positions, thickness and the stud spacing in the model are approximations, and the model shows ceiling batts in this stage even though they are normally laid after the ceiling lining.';

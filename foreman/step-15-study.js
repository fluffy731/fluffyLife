// Step 15 study content: drawings, steps, trades, materials, quotes, inspections and exam cards for painting and the final fix.
// Flags: V = Verified against a source named in SOURCES, T = Typical practice, C = Confirm. BPC sections 10.3, 10.4, 16, 19 and 21 and the normal-viewing-position definition were re-read against the PDF on 9 November 2026
// (Guide to Standards and Tolerances 2026, advisory, from 1 August 2026); the text of 16.2 and 16.3 was cut off in the fetch. AS/NZS 2311 (painting), AS/NZS 3000, AS/NZS 3500 and the paint makers' data sheets were not opened.
// Certificate timings come from the VBA and Energy Safe Victoria pages used in Steps 8 and 9. Paint systems, sheens, positions and sizes in the model are illustrative.
import { svg, T, L, R, C as Circ, P, dim, call, arrow } from './dwg.js';

const wrapT = (x, y, text, n, dy = 18, cls = 'd-mute') => { const out = []; let cur = ''; for (const w of text.split(' ')) { if ((cur + ' ' + w).trim().length > n) { out.push(cur); cur = w; } else cur = (cur + ' ' + w).trim(); } if (cur) out.push(cur); return out.map((t, i) => T(x, y + i * dy, t, { cls })); };
const keyList = (body, x, y, items, n, step, off = 20) => items.forEach(([k, t], i) => { body.push(T(x, y + i * step, k, { cls: 'd-bold' }), ...wrapT(x + off, y + i * step, t, n, 16, '')); });
const lt = (body, x, y, k) => body.push(Circ(x, y, 11, 'd-dot'), `<text x="${x}" y="${y + 4}" text-anchor="middle" class="d-num">${k}</text>`);

/* ---------- drawings ---------- */
function orderDwg() {
  const body = [R(0, 0, 900, 1060, 'd-bg')], blk = (x, y, w, h, lines) => { body.push(R(x, y, w, h, 'd-box', 6)); lines.forEach((t, i) => body.push(T(x + 12, y + 22 + i * 16, t, { cls: i ? 'd-mute' : 'd-bold' }))); };
  const A = 40, B = 450, W = 380;
  body.push(T(40, 40, 'Order of work, who is on site and the time limits', { cls: 'd-bold' }), T(A, 68, 'A  Paint', { cls: 'd-bold' }), T(B, 68, 'B  Fit-off and handover', { cls: 'd-bold' }));
  blk(A, 84, W, 56, ['1  Delivery and checks', 'Colour, sheen and fittings against the schedule']); blk(A, 160, W, 72, ['2  Preparation and masking', 'Fill and sand the fixings and dents', 'Cover the floors, mask the edges']);
  blk(A, 252, W, 72, ['3  Ceilings and walls', 'Sealer, then two coats', 'The maker\'s recoat time is kept']); blk(A, 344, W, 72, ['4  Doors, architraves and skirting', 'Fill the gaps, undercoat, then gloss coats', 'Tape comes off while the last coat is tacky']);
  for (const y of [140, 232, 324]) body.push(arrow(A + W / 2, y, A + W / 2, y + 20));
  blk(B, 84, W, 72, ['5  Plumbing and electrical fit-off', 'Basin, mixer, toilet and shower fittings,', 'plates, lights and smoke alarms']); blk(B, 176, W, 72, ['6  Commissioning and testing', 'Run the water, check the hot water,', 'test the RCDs and the smoke alarms']);
  blk(B, 268, W, 72, ['7  Clean, defects and certificates', 'Clean, clear the debris, uncover the floors,', 'make the defect list, collect the certificates']);
  for (const y of [156, 248]) body.push(arrow(B + W / 2, y, B + W / 2, y + 20));
  body.push(L(A + W, 380, 435, 380), L(435, 380, 435, 120), arrow(435, 120, B, 120));
  body.push(...wrapT(40, 450, 'The model paints after the fix-out, and fits off after the painting so the paint stays off the fittings. Many painters put a first coat on before the doors and trims are hung and finish afterwards, so confirm the order with the painter.', 112, 16));
  // C: who is on site
  body.push(T(40, 530, 'C  Who is on site in each phase (typical, not a rule)', { cls: 'd-bold' }));
  const x0 = 250, cw = 85, rows = [['Builder', [1, 2, 3, 4, 5, 6, 7]], ['Painter', [2, 3, 4]], ['Plumber (licensed)', [5, 6]], ['Electrician (licensed)', [5, 6]], ['Shower screen installer', [5]], ['Cleaner', [7]]];
  for (let i = 1; i <= 7; i++) body.push(T(x0 + (i - 0.5) * cw, 562, String(i), { anchor: 'middle', cls: 'd-bold' }), L(x0 + i * cw, 570, x0 + i * cw, 570 + rows.length * 32, 'd-dim'));
  rows.forEach(([name, ph], r) => { const y = 576 + r * 32; body.push(T(40, y + 17, name, { cls: '' }), L(40, y + 28, x0 + 7 * cw, y + 28, 'd-dim')); for (const p of ph) body.push(R(x0 + (p - 1) * cw + 4, y + 4, cw - 8, 18, 'd-timber')); });
  body.push(L(x0, 570, x0, 576 + rows.length * 32, 'd-dim'));
  // D: time limits
  body.push(T(40, 810, 'D  When the BPC time limits run, from completion (18 px per month)', { cls: 'd-bold' }));
  const sx = 170, p = 18;
  body.push(L(sx, 980, sx + 36 * p, 980, 'd-dim'));
  for (const m of [0, 3, 12, 24, 36]) body.push(L(sx + m * p, 976, sx + m * p, 984, 'd-dim'), T(sx + m * p, 1002, String(m), { anchor: 'middle', cls: 'd-dimt' }));
  body.push(T(sx + 18 * p, 1024, 'months from completion', { anchor: 'middle', cls: 'd-mute' }));
  const bars = [['At completion', 0, 'Paint blemishes (16.2), unfilled fixings (16.3), debris and cleaning (21.4)', 'd-gap'], ['3 months', 3, 'Fixtures that leak or drip (10.3). Fittings loose or not operating (21.1)', 'd-timber'], ['24 months', 24, 'Gaps in skirting over 2 mm', 'd-ins2'], ['36 months', 36, 'Interior coatings that lift, blister, flake or fade (Table 16.5)', 'd-conc']];
  bars.forEach(([name, m, text, cls], i) => { const y = 838 + i * 34; body.push(T(40, y + 16, name, { cls: 'd-bold' }), R(sx, y, Math.max(m * p, 4), 22, cls), T(m >= 24 ? sx + 8 : sx + Math.max(m * p, 4) + 8, y + 16, text, { cls: '' })); });
  body.push(...wrapT(40, 1040, 'Figures are from BPC sections 10.3, 16.5, 21.1 and 21.4 and the skirting clause, advisory, for contracts from 1 August 2026.', 112, 16));
  return svg(900, 1060, body.join(''), 'Order of work, who is on site and the time limits');
}

function paintDwg() {
  const body = [R(0, 0, 900, 1340, 'd-bg')];
  body.push(T(40, 40, 'Paint build-up, blemishes and durability', { cls: 'd-bold' }), T(40, 68, 'A  Section through the wall surface at a joint, layers drawn thicker than real', { cls: 'd-bold' }));
  const y0 = 130, h = 200;
  body.push(R(60, y0, 130, h, 'd-timber'), R(190, y0, 50, h, 'd-board'), R(240, y0 + 80, 20, 70, 'd-sheet'), R(260, y0, 12, h, 'd-adh'), R(272, y0, 14, h, 'd-glass'), R(286, y0, 14, h, 'd-tilef'));
  body.push(call(1, 125, y0 + 10, 125, y0 - 30), call(2, 215, y0 + 10, 215, y0 - 30), call(3, 250, y0 + 150, 215, y0 + 190), call(4, 266, y0 + 10, 266, y0 - 30), call(5, 279, y0 + h - 8, 279, y0 + h + 34), call(6, 293, y0 + h - 8, 330, y0 + h + 34));
  body.push(...wrapT(60, y0 + h + 70, 'Stud, sheet and joint (Steps 3 and 12), then the coats. Each coat is a few tenths of a millimetre in real life.', 42, 16));
  keyList(body, 400, 112, [['1', 'Stud, behind the sheet'], ['2', 'Plasterboard sheet'], ['3', 'Taped and set joint, sanded smooth'], ['4', 'Sealer or primer coat'], ['5', 'First finish coat'], ['6', 'Second finish coat'], ['7', 'Skirting with its gloss coat'], ['8', 'Flexible paintable filler line']], 50, 30);
  body.push(...wrapT(400, 360, 'Numbers match the labels in the 3D detail room. In the room each coat stops lower than the one behind it so every layer shows.', 48, 16));
  // B: skirting
  body.push(T(40, 470, 'B  Skirting at the floor, elevation', { cls: 'd-bold' }));
  body.push(R(60, 500, 300, 150, 'd-tilef'), R(60, 610, 300, 40, 'd-door'), R(60, 650, 300, 18, 'd-timber'), R(60, 606, 300, 4, 'd-sealant'), R(60, 646, 300, 4, 'd-sealant'), L(60, 650, 360, 650, 'd-line'));
  body.push(call(7, 200, 632, 200, 700), call(8, 120, 608, 80, 540), T(380, 580, 'Gap above the skirting filled before the last coat', { cls: '' }), T(380, 610, 'Skirting gaps over 2 mm within 24 months are outside tolerance', { cls: 'd-mute' }), T(380, 640, 'The filler is drawn blue so it can be seen', { cls: 'd-mute' }));
  // C: blemishes
  body.push(T(40, 760, 'C  Blemishes the BPC guide lists as outside tolerance (clause 16.2), drawn as simple swatches', { cls: 'd-bold' }));
  const sw = [['Paint runs', (x, y) => [R(x + 74, y + 8, 3, 38, 'd-timberx'), Circ(x + 75.5, y + 50, 5, 'd-timberx')]], ['Sags', (x, y) => [R(x + 35, y + 8, 80, 30, 'd-timberx'), Circ(x + 50, y + 40, 6, 'd-timberx'), Circ(x + 75, y + 42, 7, 'd-timberx'), Circ(x + 100, y + 40, 6, 'd-timberx')]],
    ['Wrinkling', (x, y) => [P([[x + 15, y + 40], [x + 40, y + 28], [x + 65, y + 44], [x + 90, y + 28], [x + 115, y + 44], [x + 135, y + 32]], 'd-line', false)]], ['Dust in the paint', (x, y) => [...[[30, 20], [60, 45], [90, 18], [110, 40], [45, 50], [125, 22], [75, 30]].map(([a, b]) => Circ(x + a, y + b, 2.5, 'd-dot'))]],
    ['Bare or starved areas', (x, y) => [R(x + 40, y + 14, 70, 38, 'd-board')]], ['Colour variations', (x, y) => [R(x + 20, y + 10, 60, 50, 'd-ins2'), R(x + 80, y + 10, 50, 50, 'd-tilef')]],
    ['Surface cracks', (x, y) => [P([[x + 20, y + 15], [x + 45, y + 32], [x + 60, y + 18], [x + 85, y + 44], [x + 110, y + 28], [x + 135, y + 52]], 'd-line', false)]], ['Coarse brush marks', (x, y) => [...[12, 24, 36, 48, 58].map((o) => L(x + 20, y + o, x + 130, y + o + 3, 'd-line'))]]];
  sw.forEach(([name, fn], i) => { const x = 40 + (i % 4) * 210, y = 790 + Math.floor(i / 4) * 120; body.push(R(x, y, 150, 70, 'd-wfloor'), ...fn(x, y), T(x, y + 92, name, { cls: 'd-bold' })); });
  body.push(...wrapT(40, 1040, 'The clause continues after its list, and the end of the sentence was cut off when read. The guide judges defects from a normal viewing position: 1.5 m or more away, in diffused light that is not glancing or parallel to the surface.', 112, 16));
  // D: durability
  body.push(T(40, 1110, 'D  Minimum durability from completion, Table 16.5 (12 px per month)', { cls: 'd-bold' }));
  const rows = [['Interior, all finishes', 36, 'd-conc'], ['Exterior acrylic', 36, 'd-ins2'], ['Exterior enamel', 24, 'd-ins2'], ['Exterior semitransparent stains', 12, 'd-ins2']], bx = 300;
  rows.forEach(([name, m, cls], i) => { const y = 1130 + i * 28; body.push(T(40, y + 15, name, { cls: '' }), R(bx, y, m * 12, 20, cls), T(bx + m * 12 + 8, y + 15, `${m} months`, { cls: 'd-bold' })); });
  body.push(T(40, 1130 + 4 * 28 + 15, 'Exterior clear finishes', { cls: '' }), T(bx, 1130 + 4 * 28 + 15, 'Not recommended', { cls: 'd-bold' }));
  body.push(...wrapT(40, 1296, 'A coating fails if it lifts, blisters, flakes, fades or similar within the period. Painting must follow the maker\'s instructions and AS/NZS 2311, which was not opened.', 112, 16));
  return svg(900, 1340, body.join(''), 'Paint build-up, blemishes and durability');
}

function fitDwg() {
  const body = [R(0, 0, 900, 1260, 'd-bg')];
  body.push(T(40, 40, 'Fit-off positions and viewing distances', { cls: 'd-bold' }), T(40, 68, 'A  Plan of the model bathroom, 0.13 px per mm', { cls: 'd-bold' }));
  const BX0 = -5.2105, BX1 = -2.0945, BZ0 = 1.295, BZ1 = 5.4055, s = 130, X = (x) => 70 + (x - BX0) * s, Z = (z) => 110 + (z - BZ0) * s, w = 5;
  body.push(R(X(BX0), Z(BZ0), (BX1 - BX0) * s, (BZ1 - BZ0) * s, 'd-wfloor'));
  body.push(L(X(BX0) - w, Z(BZ0) - w, X(BX1) + w, Z(BZ0) - w, 'd-wall'), L(X(BX0) - w, Z(BZ0) - w, X(BX0) - w, Z(BZ1) + w, 'd-wall'), L(X(BX0) - w, Z(BZ1) + w, X(BX1) + w, Z(BZ1) + w, 'd-wall'), L(X(BX1) + w, Z(BZ0) - w, X(BX1) + w, Z(3.17), 'd-wall'), L(X(BX1) + w, Z(4.03), X(BX1) + w, Z(BZ1) + w, 'd-wall'));
  body.push(R(X(-5.05), Z(5.4085 - 0.45), 0.9 * s, 0.45 * s, 'd-box'), R(X(-4.8), Z(5.4085 - 0.36), 0.4 * s, 0.3 * s, 'd-tilef'), R(X(-2.64), Z(4.57), 0.55 * s, 0.36 * s, 'd-box'), R(X(-2.27), Z(4.57), 0.18 * s, 0.36 * s, 'd-tilef'));
  body.push(L(X(-2.75), Z(1.3), X(-2.75), Z(2.3), 'd-glass'), Circ(X(-3.6), Z(2.4), 7, 'd-steel'), Circ(X(-3.6), Z(1.45), 8, 'd-steel'), Circ(X(-3.6), Z(3.4), 8, 'd-steel'), L(X(-5.0), Z(5.4), X(-4.2), Z(5.4), 'd-line'));
  lt(body, X(-4.9), Z(4.96) - 22, 'a'); lt(body, X(-4.6), Z(4.96) - 22, 'b'); lt(body, X(-2.35), Z(4.4), 'c'); lt(body, X(-3.6), Z(1.45) + 24, 'd'); lt(body, X(-2.75) - 20, Z(1.8), 'e'); lt(body, X(-4.3), Z(4.96) - 22, 'f'); lt(body, X(-3.6) + 24, Z(3.4), 'g'); lt(body, X(-3.6) + 24, Z(2.4), 'h');
  body.push(T(X(BX1) + 20, Z(3.6) + 4, 'doorway', { cls: 'd-bold' }));
  keyList(body, 560, 130, [['a', 'Vanity cabinet and stone top'], ['b', 'Basin and mixer tap'], ['c', 'Toilet suite and cistern'], ['d', 'Shower head and mixer, on the north wall'], ['e', 'Shower screen'], ['f', 'Mirror, above the vanity'], ['g', 'Ceiling light'], ['h', 'Floor waste']], 40, 34);
  body.push(...wrapT(560, 420, 'Letters are for this plan only. They are not the 3D labels. Positions and sizes are illustrative. A real job follows the plumbing plan, the maker\'s spacings and AS/NZS 3500, which was not opened.', 40, 16));
  // B: bedroom
  body.push(T(40, 700, 'B  Plan of the east bedroom, 0.055 px per mm', { cls: 'd-bold' }));
  const X2 = (x) => 60 + (x - 0.0795) * 55, Z2 = (z) => 730 + (z - 0.0795) * 55;
  body.push(R(X2(0.0795), Z2(0.0795), 5.146 * 55, 5.341 * 55, 'd-wfloor'), R(X2(4.6055), Z2(3.62), 0.6 * 55, 1.8 * 55, 'd-box'));
  body.push(L(X2(0.0795), Z2(0.0795), X2(2.09), Z2(0.0795), 'd-wall'), L(X2(2.91), Z2(0.0795), X2(5.2255), Z2(0.0795), 'd-wall'), L(X2(5.2255), Z2(0.0795), X2(5.2255), Z2(5.4205), 'd-wall'), L(X2(0.0795), Z2(0.0795), X2(0.0795), Z2(2.29), 'd-wall'), L(X2(0.0795), Z2(3.11), X2(0.0795), Z2(5.4205), 'd-wall'), L(X2(0.0795), Z2(5.4205), X2(1.59), Z2(5.4205), 'd-wall'), L(X2(2.41), Z2(5.4205), X2(5.2255), Z2(5.4205), 'd-wall'));
  for (const [x, z] of [[1.4, 0.0795], [4.1, 0.0795], [5.2255, 1.6], [5.2255, 3.2], [3.4, 5.4205]]) body.push(Circ(X2(x), Z2(z), 5, 'd-steel'));
  body.push(Circ(X2(0.0795), Z2(3.35), 5, 'd-dot'), Circ(X2(3.9), Z2(2.75), 9, 'd-dot'), Circ(X2(2.6), Z2(2.75), 7, 'd-e-ok'));
  lt(body, X2(2.75), Z2(0.0795) + 22, 'i'); lt(body, X2(0.0795) + 26, Z2(3.35), 'j'); lt(body, X2(3.9) + 24, Z2(2.75), 'k'); lt(body, X2(2.6) - 24, Z2(2.75), 'l'); body.push(T(X2(4.9), Z2(4.5) + 4, 'wardrobe', { anchor: 'middle', cls: 'd-mute' }));
  keyList(body, 400, 750, [['i', 'Power points, on the north, east and south walls'], ['j', 'Light switch, beside the door'], ['k', 'Ceiling light'], ['l', 'Smoke alarm, on the base cabled in Step 9']], 46, 34);
  body.push(...wrapT(400, 900, 'The smoke alarm and light positions come from the Step 9 layout. The light is moved aside so the two do not overlap. The wardrobe takes the east wall, so no power point sits behind it.', 46, 16));
  // C: viewing distances
  body.push(T(40, 1060, 'C  Where a defect is judged from, BPC normal viewing position (100 px per m)', { cls: 'd-bold' }));
  const rows = [['Walls, ceilings, floors and joinery', 1.5], ['Appliances and fixtures', 0.6], ['Glass', 3.0]], bx = 330;
  rows.forEach(([name, m], i) => { const y = 1088 + i * 34; body.push(T(40, y + 16, name, { cls: '' }), R(bx, y, m * 100, 22, 'd-timber'), T(bx + m * 100 + 8, y + 16, m < 1 ? `${m * 1000} mm` : `${m} m`, { cls: 'd-bold' })); });
  body.push(...wrapT(40, 1210, 'A normal viewing position is that distance or more, with the surface lit by diffused, non-critical light. Light that strikes the surface at a glancing angle, or parallel to it, is critical light and is not the guide\'s test.', 112, 16));
  return svg(900, 1260, body.join(''), 'Fit-off positions and viewing distances');
}

function testDwg() {
  const body = [R(0, 0, 900, 1140, 'd-bg')], blk = (x, y, w, h, lines) => { body.push(R(x, y, w, h, 'd-box', 6)); lines.forEach((t, i) => body.push(T(x + 12, y + 22 + i * 16, t, { cls: i ? 'd-mute' : 'd-bold' }))); };
  body.push(T(40, 40, 'Tests, certificates and handover records', { cls: 'd-bold' }), T(40, 68, 'A  Tests before handover', { cls: 'd-bold' }));
  const cols = [40, 330, 620], rows = [['Test', 'Who', 'Record'], ['Run all taps, the toilet and the shower. Check for leaks', 'Plumber and builder', 'Photos and a note'], ['Hot water temperature at an outlet, not over 50 degrees', 'Plumber', 'Reading and date'], ['RCDs and RCBOs, before the certificate is signed', 'Electrician', 'Recorded at the switchboard'], ['Smoke alarms: press test, all interconnected alarms sound', 'Electrician and builder', 'Note and date'], ['Every light, power point and switch', 'Electrician', 'Note']];
  rows.forEach((r, i) => { const y = 84 + i * 50; body.push(L(40, y + 44, 860, y + 44, 'd-dim')); r.forEach((c, k) => body.push(...wrapT(cols[k], y + 18, c, k === 0 ? 38 : 28, 15, i === 0 ? 'd-bold' : ''))); });
  // B: certificate timelines
  body.push(T(40, 420, 'B  Certificate timelines', { cls: 'd-bold' }));
  body.push(T(40, 450, 'Plumbing', { cls: 'd-bold' })); blk(40, 460, 200, 56, ['Work complete', 'By the licensed plumber']); blk(290, 460, 260, 56, ['Owner gets the certificate', 'Within five days']); blk(600, 460, 260, 56, ['Lodged with the VBA', 'Within five days']);
  body.push(arrow(240, 488, 290, 488), arrow(550, 488, 600, 488));
  body.push(T(40, 560, 'Electrical, prescribed work (the main switchboard)', { cls: 'd-bold' })); blk(40, 570, 200, 72, ['Work complete', 'Installer signs the', 'prescribed certificate']); blk(290, 570, 260, 72, ['Independent inspection', 'Within 8 business days', 'The work stays off until then']); blk(600, 570, 260, 72, ['Copy to the customer', 'Within 4 days of the', 'inspection being complete']);
  body.push(arrow(240, 606, 290, 606), arrow(550, 606, 600, 606));
  body.push(T(40, 686, 'Electrical, non-prescribed work', { cls: 'd-bold' })); blk(40, 696, 200, 56, ['Work complete', 'Certificate signed']); blk(290, 696, 570, 56, ['Copy to the customer within 30 days', 'A copy also goes to Energy Safe']);
  body.push(arrow(240, 724, 290, 724));
  body.push(...wrapT(40, 780, 'Plumbing timings are from the VBA page used in Step 8, for work worth $750 or more. Electrical timings are from the Energy Safe Victoria pages used in Step 9. The RCD guidance is dated December 2021, so check whether its interim discretion has changed.', 112, 16));
  // C: handover records
  body.push(T(40, 880, 'C  Records the builder collects before handover', { cls: 'd-bold' }));
  const items = ['Plumbing compliance certificate', 'Certificate of Electrical Safety', 'RCD test record at the switchboard', 'Hot water temperature reading', 'Surveyor\'s inspection records', 'Colour and sheen schedule, spare paint', 'Appliance manuals and warranties', 'Sealant, grout and floor care details', 'Photographs of the finished work', 'Defect list with the items closed out'];
  items.forEach((t, i) => { const x = 40 + (i % 2) * 430, y = 910 + Math.floor(i / 2) * 36; body.push(R(x, y, 16, 16, 'd-box'), T(x + 28, y + 13, t, { cls: '' })); });
  body.push(...wrapT(40, 1110, 'The final inspection, the occupancy permit and the handover are Stage 18. The list is typical, and the contract and the surveyor may ask for more.', 112, 16));
  return svg(900, 1140, body.join(''), 'Tests, certificates and handover records');
}

export const drawings = [
  { id: 'order', title: 'Order of work, trades and time limits', scale: 'Flow, with the time limits to scale', svg: orderDwg(),
    notes: ['The model prepares and masks, paints the ceilings and walls, then the doors and trims, and fits off after the paint so the paint stays off the fittings.', 'Many painters put a first coat on before the doors and trims are hung, and finish afterwards. Confirm the order with the painter.', 'The plumber and electrician must be licensed to certify their work, and the builder collects both certificates.', 'BPC time limits run from completion: 3 months for fixtures that leak or drip and for fittings that are loose or not operating, 24 months for gaps in skirting over 2 mm, and 36 months for interior coatings that lift, blister, flake or fade.'] },
  { id: 'paint', title: 'Paint build-up, blemishes and durability', scale: 'Section not to scale, durability at 12 px per month', svg: paintDwg(),
    notes: ['Paint is sealed first and then given two finish coats. The maker\'s data sheet sets the product, the spread rate and the recoat time, and the BPC guide says painting must follow them and the recommendations of AS/NZS 2311, which was not opened.', 'Runs, sags, wrinkling, dust, bare or starved areas, colour variations, surface cracks and coarse brush marks are outside tolerance (16.2). Unfilled depressions caused by fixings are outside tolerance too (16.3).', 'Interior coatings of any finish must last 36 months from completion before they lift, blister, flake or fade (Table 16.5).', 'Numbers 1 to 8 match the labels in the 3D wall paint room. Layers are drawn far thicker than real.'] },
  { id: 'fit', title: 'Fit-off positions and viewing distances', scale: 'Plans at 0.13 and 0.055 px per mm, distances at 100 px per m', svg: fitDwg(),
    notes: ['The plumber fits the vanity, basin, mixer, toilet and shower fittings after the painting. The electrician fits the plates, lights and smoke alarms.', 'Fittings and electrical work are judged from a normal viewing position: 1.5 m for most surfaces, 600 mm for appliances and fixtures and 3 m for glass. A plate that is out of level or inconsistent with others is outside tolerance (19).', 'Positions are illustrative. The smoke alarm and light positions come from the Step 9 layout, and the real positions come from the plans, the electrician\'s design and AS/NZS 3000, which was not opened.', 'Letters in the plans are not the 3D labels.'] },
  { id: 'test', title: 'Tests, certificates and handover records', scale: 'Flow and tables, not to scale', svg: testDwg(),
    notes: ['Run the water, check the hot water temperature, test the RCDs and smoke alarms, and try every light and power point before handover.', 'The plumber gives the compliance certificate to the owner within five days of completing the work and lodges it with the VBA within five days.', 'Prescribed electrical work is inspected within 8 business days of the work, stays off until then, and the customer gets a copy within 4 days of the inspection being complete. Non-prescribed work is copied within 30 days.', 'The RCD guidance is dated December 2021 and its interim discretion may have changed, so check before relying on it.'] },
];

/* ---------- steps ---------- */
export const howto = [
  ['Check the delivery and store the materials', 'Check paint, sealer, filler, tape, sealant and the boxed fittings against the colour and fittings schedule: product, colour code, sheen, model, finish and quantity. Keep everything dry, upright and inside the temperatures on the label, and check each fitting for cracks, chips and scratches in its box.', 'Builder and painter', 'V', 'bpcTol26'],
  ['Prepare the surfaces', 'Fill nail and screw holes and dents, let the filler dry, sand it flush and dust the surface. Fixings and unfilled depressions in painted surfaces are outside tolerance, as are holes and mechanical damage seen from a normal viewing position.', 'Painter', 'V', 'bpcTol26'],
  ['Cover and mask', 'Cover the floors with sheets and tape the joints, mask the fittings, the tiles and the sealed joints, and fill the gaps round the skirting and the architraves with flexible paintable filler.', 'Painter', 'T'],
  ['Seal and paint the ceilings and walls', 'Seal the new plasterboard, then give two finish coats, ceilings first. Cut in at the edges with a brush and roll the middle, following the maker\'s coverage and recoat time. Avoid runs, sags, wrinkling, dust, bare patches, colour variations and coarse brush marks.', 'Painter', 'V', 'bpcTol26'],
  ['Paint the doors, architraves and skirting', 'Undercoat, then thin gloss or semi-gloss coats with a brush, including all door edges. Fill gaps in the skirting over 2 mm before the last coat, and pull the masking tape off while the last coat is still tacky.', 'Painter', 'V', 'bpcTol26'],
  ['Fit the plumbing fixtures', 'Fit the basin, mixer, toilet, shower fittings and screen, each tap with its isolating valve and every waste with a trap. Check that water discharges into the basin, that no joint leaks, and that nothing holds water after it drains.', 'Licensed plumber', 'V', 'bpcTol26'],
  ['Fit the electrical points, lights and smoke alarms', 'Fit the power points, switches, lights and smoke alarms to the circuits and bases roughed in at Step 9. Plates are straight and level and match the others in the room. Only a registered electrical contractor or licensed electrician can do and certify the work.', 'Licensed electrician', 'V', 'esvCoesConsumers'],
  ['Commission and test', 'Run every tap and the shower, record the hot water temperature at an outlet, test the RCDs before the certificate is signed, press the smoke alarm test buttons, and try every light, power point and switch. Record the results.', 'Plumber, electrician and builder', 'V', 'esvRcd'],
  ['Clean, find the defects and uncover the floors', 'Clear the building debris, clean the windows, floors, sanitary fixtures and joinery, uncover the floors last, and walk every room from a normal viewing position making a defect list with photographs.', 'Builder and cleaner', 'V', 'bpcTol26'],
  ['Collect the certificates and the handover records', 'Collect the plumbing and electrical certificates, the test records, the paint schedule, the manuals, warranties and care details, and the defect list with the items closed out. The final inspection and the occupancy permit follow in Stage 18.', 'Builder', 'V', 'vbaCert'],
];

export const trades = [
  { t: 'Painter', role: 'Prepares the surfaces, seals and paints the ceilings, walls and trims, and touches up after the fit-off.', when: 'After the fix-out, before the plumbing and electrical fit-off', reg: 'No licence rule was found on the sources read. Check before engaging someone directly. Not checked here.', ask: ['Brand, product line, sheen, colour code and coats written on the quote', 'What preparation is included: filling, sanding and spot priming', 'Who masks and covers, who cleans up, and the touch-up visit'] },
  { t: 'Plumber (licensed)', role: 'Fits the basin, taps, toilet and shower fittings, connects the traps and wastes, and checks and certifies the work.', when: 'After the painting, before commissioning', reg: 'Plumbing work of $750 or more needs a compliance certificate from a licensed plumber. A registered plumber cannot issue it (Step 8).', ask: ['Certificate included and when the owner gets it', 'Who supplies the fixtures and who covers a cracked or scratched one', 'Hot water temperature reading at the outlets'] },
  { t: 'Electrician (licensed)', role: 'Fits the plates, switches, lights and smoke alarms, tests the RCDs and issues the Certificate of Electrical Safety.', when: 'After the painting, before commissioning', reg: 'Only a registered electrical contractor or licensed electrician can issue a certificate. A builder cannot do the wiring unless licensed (Step 9).', ask: ['RCD test record at the switchboard', 'Who arranges the prescribed inspection', 'Copies of the certificates and when they arrive'] },
  { t: 'Shower screen installer', role: 'Measures and fits the screen after the tiling and seals it to the tiles.', when: 'After the wall and floor tiles and the sealant', reg: 'Not checked.', ask: ['Measure after the tiling, not before', 'Sealant and fixings that suit the membrane', 'Who covers a scratched or cracked screen at handover'] },
  { t: 'Cleaner', role: 'Cleans windows, floors, fixtures and joinery after every other trade has left, and uncovers the floors.', when: 'Last, before handover', reg: 'Not checked.', ask: ['Products approved for the tile, timber and benchtops', 'Who removes the floor protection', 'Who removes the debris and the bins'] },
];

export const materials = [
  ['Sealer or primer', 'A sealer or primer for new plasterboard, chosen to suit the paint system', 'Paint retailers, trade paint stores and hardware stores', 'T', 'The maker\'s data sheet sets the product and the spread rate.'],
  ['Interior wall paint', 'A low-sheen acrylic is common for walls, and a washable one for kitchens and bathrooms', 'Paint retailers, trade paint stores and hardware stores', 'T', 'Interior coatings must last 36 months from completion (BPC Table 16.5).'],
  ['Ceiling paint', 'A flat white ceiling paint', 'Paint retailers, trade paint stores and hardware stores', 'T', 'A flat finish shows fewer flaws in side light.'],
  ['Gloss or semi-gloss for trims', 'A water-based or oil-based gloss or semi-gloss for doors, architraves and skirting, with an undercoat', 'Paint retailers, trade paint stores and hardware stores', 'T', 'Gloss shows brush marks and runs more than flat paint.'],
  ['Filler, sandpaper and flexible gap filler', 'Powder or ready-mixed filler, sanding sheets, and paintable flexible filler for the gaps at trims', 'Hardware stores and trade suppliers', 'T', 'Unfilled depressions from fixings in painted surfaces are outside tolerance (16.3).'],
  ['Masking tape and drop sheets', 'Low-tack masking tape, plastic and cloth drop sheets, and floor protection', 'Hardware stores and trade suppliers', 'T', 'Remove the tape while the last coat is tacky.'],
  ['Plumbing fixtures and tapware', 'Basin, mixer, toilet suite, shower rail and screen, with isolating valves and flexible hoses', 'Plumbing suppliers and hardware stores', 'T', 'Product certification marks were not checked for this step.'],
  ['Electrical fittings', 'Plates, power points, switches, lights and mains-powered interconnected smoke alarms', 'Electrical wholesalers and hardware stores', 'V', 'Smoke alarms must comply with AS 3786 and be interconnected where there is more than one (NCC 9.5).'],
  ['Cleaning supplies and a waste bin', 'Cleaning products approved for each surface, and a bin for the debris', 'Hardware stores and bin hire companies', 'T', 'Building debris left on site at completion is outside tolerance (21.4).'],
];

export const quotes = [
  { who: 'Painter', n: '3', what: ['Brand, product line, sheen, colour code and number of coats', 'Preparation included: filling, sanding and spot priming', 'Masking, covering, clean-up and one touch-up visit'] },
  { who: 'Plumber (fit-off)', n: '2', what: ['Fixtures supplied or fitted only, and who covers a damaged fixture', 'Compliance certificate included and the date it will be given', 'Hot water temperature check at the outlets'] },
  { who: 'Electrician (fit-off)', n: '2', what: ['Plates, lights and smoke alarms supplied or fitted only', 'RCD test record and the Certificate of Electrical Safety', 'Who arranges the prescribed inspection'] },
  { who: 'Shower screen installer', n: '2', what: ['Measure after tiling, lead time and the glass type', 'Sealant and fixings that suit the membrane', 'Cover for a scratched or cracked screen at handover'] },
  { who: 'Cleaner', n: '2', what: ['Scope: windows, floors, fixtures, joinery and benchtops', 'Whether the floor protection comes up in the price', 'Return visit if something is missed'] },
];

export const quoteTips = [
  'Put the paint brand, product line, sheen, colour code and number of coats on the painter\'s quote. "Paint the house" hides a lot of choices.',
  'Ask the painter what preparation is included and what costs extra. Filling and sanding are where cheap quotes cut.',
  'Ask who supplies each fitting and who is responsible for a cracked, chipped or scratched one at handover.',
  'Ask the plumber and electrician to confirm the certificates are in the price and when you will receive them.',
  'Agree who removes the floor protection and does the final clean, and put the order of work in writing.',
  'Put a touch-up visit in writing. The BPC limits run 3 months for leaking fixtures and loose fittings, and 36 months for interior paint.',
];

export const inspections = [
  ['Delivery check', 'Builder and painter', 'On delivery', 'Paint, sealer, filler and fittings match the colour and fittings schedule: product, colour code, sheen, model, finish and quantity, with no cracks, chips or scratches in the fittings.', 'T'],
  ['Surface preparation check', 'Builder and painter', 'Before the first coat', 'Fixings and dents are filled and sanded, the surface is dusted, and there are no unfilled depressions caused by fixings or mechanical damage that can be seen from a normal viewing position.', 'V', 'bpcTol26'],
  ['Masking and protection check', 'Painter', 'Before painting', 'The floors are covered and taped, the fittings and the sealed joints are masked, and the gaps at the trims are filled.', 'T'],
  ['Coat check', 'Builder and painter', 'After each coat', 'The coats follow the maker\'s data sheet for the product, the spread rate and the recoat time (16.1). AS/NZS 2311 was not opened.', 'V', 'bpcTol26'],
  ['Paint finish check', 'Builder', 'At completion', 'No runs, sags, wrinkling, dust, bare or starved areas, colour variations, surface cracks or coarse brush marks, viewed from 1.5 m or more in diffused light (16.2).', 'V', 'bpcTol26'],
  ['Trim and skirting check', 'Builder', 'At completion, and within 24 months', 'Gaps in the skirting are not over 2 mm, and the paint line at the trims is straight.', 'V', 'bpcTol26'],
  ['Paint durability check', 'Builder', 'Within 36 months of completion', 'Interior coatings have not lifted, blistered, flaked or faded (Table 16.5).', 'V', 'bpcTol26'],
  ['Plumbing fit-off check', 'Builder and plumber', 'After fitting, and within 3 months of completion', 'No fixture leaks or drips, taps discharge clearly into the basin, and no fixture retains water after it drains, other than surface-tension water (10.3, 10.4).', 'V', 'bpcTol26'],
  ['Hot water temperature check', 'Plumber', 'At commissioning', 'Hot water at shower and tap outlets is not over 50 degrees Celsius. The BPC page does not name Victoria.', 'V', 'bpcHotWater'],
  ['Electrical fit-off check', 'Builder and electrician', 'After fitting', 'Plates, switches and fittings are level and consistent with similar installations, viewed from a normal viewing position (19).', 'V', 'bpcTol26'],
  ['RCD test', 'Electrician', 'Before the certificate is signed', 'RCDs and RCBOs are tested to verify they are installed and operating correctly, and the confirmation is recorded at the switchboard. The guidance is dated December 2021.', 'V', 'esvRcd'],
  ['Prescribed electrical inspection', 'Licensed electrical inspector', 'Within 8 business days of completing the work', 'The installer has signed the prescribed certificate, the inspector inspects, and the work stays off until then.', 'V', 'esvLei'],
  ['Smoke alarm test', 'Electrician and builder', 'At commissioning', 'Each alarm is tested and interconnected alarms sound together. Alarms are at least 300 mm from the wall and ceiling corner.', 'V', 'nccHp95'],
  ['Fittings and appliances check', 'Builder', 'At completion, and within 3 months', 'No fitting or appliance is cracked, chipped or scratched at completion, or loose or not fully operational within 3 months (21.1).', 'V', 'bpcTol26'],
  ['Cleaning and debris check', 'Builder', 'At completion', 'Windows, floors, sanitary fixtures and joinery are clean and ready for use, and no building debris remains on site (21.4).', 'V', 'bpcTol26'],
  ['Certificate collection', 'Builder', 'Within five days of the plumbing work, and per the electrical timings', 'The plumbing certificate and the Certificate of Electrical Safety are received, and the test records, manuals and warranties are filed.', 'V', 'vbaCert'],
  ['Surveyor\'s view', 'Builder and building surveyor', 'Before the final inspection', 'Ask the surveyor what they want to see before the final inspection. Stage 18 covers the occupancy permit.', 'T'],
];

export const exam = [
  ['What must painting conform to under the BPC guide?', 'The manufacturer\'s instructions and the recommendations of AS/NZS 2311 Guide to the painting of buildings. Coatings must have suitable durability for the conditions and the expected wear (16.1). AS/NZS 2311 was not opened.', 'V', 'bpcTol26'],
  ['Which paint blemishes does the guide list as outside tolerance?', 'Paint runs, sags, wrinkling, dust, bare or starved painted areas, colour variations, surface cracks, and irregular and coarse brush marks (16.2). The clause was cut off after its list when read.', 'V', 'bpcTol26'],
  ['What does the guide say about fixings in painted surfaces?', 'Fixings, and unfilled depressions caused by fixings, are outside tolerance in painted or stained surfaces (16.3). The middle of the clause was cut off when read.', 'V', 'bpcTol26'],
  ['What does the guide say about holes and damage in painted surfaces?', 'Mechanical imperfections, damage, holes and any other unfilled depressions are outside tolerance if they can be seen from a normal viewing position (16.4).', 'V', 'bpcTol26'],
  ['How long must interior coatings last?', 'At least 36 months from completion, for all finishes, without lifting, blistering, flaking, fading or similar (Table 16.5).', 'V', 'bpcTol26'],
  ['How long must exterior acrylic and exterior enamel last?', 'Exterior acrylic 36 months and exterior enamel 24 months (Table 16.5).', 'V', 'bpcTol26'],
  ['What are the durability periods for exterior semitransparent stains and clear finishes?', '12 months for semitransparent stains. Exterior clear finishes are listed as not recommended (Table 16.5).', 'V', 'bpcTol26'],
  ['What does the guide say about electrical products and fittings?', 'Electrical work is outside tolerance if a product, fixture or fitting appears out of level or inconsistent with similar installations when viewed from a normal viewing position (19).', 'V', 'bpcTol26'],
  ['When are appliances and fittings outside tolerance?', 'If they are cracked, chipped or scratched when viewed from a normal viewing position at completion, or are loose or not fully operational within 3 months of completion (21.1).', 'V', 'bpcTol26'],
  ['What does the guide say about cleaning?', 'Windows, floors, sanitary fixtures and joinery are outside tolerance if they are not clean and ready for use at completion, and building debris is outside tolerance if it remains on site at completion (21.4).', 'V', 'bpcTol26'],
  ['What does the guide say about building maintenance?', 'It is an ongoing requirement, so an assessment against the tolerances has to weigh the effect of reasonable maintenance and whether the matter relates to the builder\'s workmanship or general building use (21.5).', 'V', 'bpcTol26'],
  ['When are water supply fixtures outside tolerance?', 'If they leak or drip within 3 months from completion, or are not located to fully and clearly discharge into sanitary fixtures such as baths, basins and sinks (10.3).', 'V', 'bpcTol26'],
  ['When are sanitary fixtures outside tolerance for retaining water?', 'If baths, basins, sinks, showers or troughs retain water after they are drained, other than water held by surface tension (10.4).', 'V', 'bpcTol26'],
  ['What is a normal viewing position?', '1.5 m or more away, with the surface lit by non-critical light, or 600 mm for appliances and fixtures and 3 m for glass.', 'V', 'bpcTol26'],
  ['What is non-critical light?', 'Diffused light that strikes the surface and is not glancing or parallel to it.', 'V', 'bpcTol26'],
  ['Is a defect found in raking side light always outside tolerance?', 'No. The guide judges defects from a normal viewing position in non-critical light, so a flaw seen only in glancing light does not count by the guide\'s test. A builder may still choose to fix it.', 'T'],
  ['When does the BPC guide apply?', 'To contracts entered into or work commenced from 1 August 2026. It is advisory, and manufacturer instructions and legislation take precedence.', 'V', 'bpcTol26'],
  ['Who can issue a plumbing compliance certificate?', 'A licensed plumber. A registered plumber cannot.', 'V', 'vbaCert'],
  ['What are the plumbing certificate timings?', 'The plumber gives it to the owner within five days of completing the work and lodges it with the VBA within five days.', 'V', 'vbaCert'],
  ['What plumbing work needs a compliance certificate?', 'Plumbing work worth $750 or more including materials, appliances and fixtures, below-ground sanitary drains, gas appliance and consumer gas piping work, and cooling towers.', 'V', 'vbaCert'],
  ['What work needs a Certificate of Electrical Safety?', 'All electrical installation work. It is issued by a registered electrical contractor or licensed electrician.', 'V', 'esvCoes'],
  ['Can a builder wire the house they are building?', 'Not unless they are a licensed electrician. Only a registered electrical contractor or licensed electrician can issue the certificate.', 'V', 'esvCoesConsumers'],
  ['When must RCDs be tested?', 'Before the Certificate of Electrical Safety is signed, with the confirmation recorded and available at the switchboard. The guidance is dated December 2021 and its interim discretion may have changed.', 'V', 'esvRcd'],
  ['When is prescribed electrical work inspected?', 'By an independent licensed electrical inspector within 8 business days of completing the work, and the work stays off until then.', 'V', 'esvLei'],
  ['When does the customer get the electrical certificate?', 'Within 4 days once the inspection is complete for prescribed work, and within 30 days for non-prescribed work. A copy also goes to Energy Safe.', 'V', 'esvCoesConsumers'],
  ['What is the maximum hot water temperature at shower and tap outlets?', '50 degrees Celsius. The BPC page does not name Victoria.', 'V', 'bpcHotWater'],
  ['What must smoke alarms comply with?', 'AS 3786. They are powered from the consumer mains where connected and interconnected where there is more than one in a dwelling. The ABCB page carries NSW-labelled text and no edition.', 'V', 'nccHp95'],
  ['How far from the wall and ceiling corner must a ceiling smoke alarm be?', 'At least 300 mm. On a sloping ceiling, 500 to 1500 mm from the high point.', 'V', 'nccHp95'],
  ['What order should painting and the fit-off go in?', 'The model paints first and fits off after, so the paint stays off the fittings. Many painters put a first coat on before the doors and trims are hung and finish afterwards, so confirm the order with the painter.', 'C'],
  ['What paint system and sheen should a new house have?', 'Not confirmed. The maker\'s data sheet and the contract colour schedule decide the system, the sheen, the coats and the recoat time.', 'C'],
  ['Which electrical heights and spacings apply to power points and switches?', 'Not confirmed. They come from the electrician\'s design and AS/NZS 3000, which was not opened.', 'C'],
];

export const sources = ['bpcTol26', 'vbaCert', 'esvCoes', 'esvCoesConsumers', 'esvRcd', 'esvLei', 'bpcHotWater', 'nccHp95', 'vbaEsm09'];
export const caution = 'The painting, electrical, fixture and completion limits come from the BPC Guide to Standards and Tolerances 2026 (sections 10.3, 10.4, 16, 19 and 21 and the normal-viewing-position definition), which is advisory and applies from 1 August 2026. These sections were re-read against the PDF on 9 November 2026, but the text of clauses 16.2 and 16.3 was cut off in the fetch, and sections 17, 18 and 20 were not fully read. AS/NZS 2311 (painting), AS/NZS 3000, AS/NZS 3500 and the paint makers\' data sheets were not opened, so the paint systems, sheens, coverage, recoat times, power point heights and trap details are Typical or Confirm. The plumbing certificate timings come from the VBA page, and the electrical timings and RCD guidance from the Energy Safe Victoria pages used in Steps 8 and 9: the RCD guidance is dated December 2021 and its interim 30-day discretion may have changed, the BPC hot water page names no state, and the NCC smoke alarm page carries NSW-labelled text with no edition. The model paints after the fix-out and fits off after painting, whereas many painters put a first coat on earlier: Confirm. Colours, fixtures, positions and sizes are illustrative, the positions of the smoke alarms and lights follow the Step 9 layout, and the zoom rooms draw layers and fittings far thicker than real. The sealant and filler are drawn blue so they can be seen.';

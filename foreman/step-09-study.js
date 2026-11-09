// Step 9 study content: drawings, steps, trades, materials, quotes, inspections and exam cards for electrical and data rough-in.
// Flags: V = Verified against a source named in SOURCES, T = Typical practice, C = Confirm. AS/NZS 3000, 3017 and 3786 were not opened, and the NCC lighting limits were not read.
import { svg, T, L, R, C as Circ, P, dim, call, arrow } from './dwg.js';
import { WALLS, wallInfo, wallMembers, worldAt } from './frame.js';
import { BOARD, PIT, TEMP, STOCK, HUB, TELCO, ALARMS, LIGHTS, outlets } from './elec.js';

const wrapT = (x, y, text, n, dy = 18, cls = 'd-mute') => { const out = []; let cur = ''; for (const w of text.split(' ')) { if ((cur + ' ' + w).trim().length > n) { out.push(cur); cur = w; } else cur = (cur + ' ' + w).trim(); } if (cur) out.push(cur); return out.map((t, i) => T(x, y + i * dy, t, { cls })); };

/* ---------- drawings ---------- */
function layoutDwg() {
  const s = 30, X = (x) => 80 + (x + 7.5) * s, Y = (z) => 70 + (z + 6.5) * s, body = [R(0, 0, 900, 880, 'd-bg')], O = outlets();
  body.push(R(X(-7.5), Y(-6.5), 15 * s, 24 * s, 'd-lot'), L(X(-7.5), Y(17.5), X(7.5), Y(17.5), 'd-boundary'), R(X(-5.5), Y(-5.5), 11 * s, 17 * s, 'd-house'));
  // walls, with gaps for doorways and windows
  for (const raw of WALLS) {
    const w = wallInfo(raw), zs = wallMembers(w.len, w.open).zones.slice().sort((p, q) => p.l - q.l);
    const pt = (u) => { const p = worldAt(w, u, 0, 0); return [X(p[0]), Y(p[2])]; }, seg = (u1, u2, cls) => { const [a, b] = pt(u1), [c, d] = pt(u2); body.push(L(a, b, c, d, cls)); };
    let at = 0;
    for (const z of zs) { seg(at, z.l, 'd-wall'); seg(z.l, z.r, z.o.sill === 0 ? 'd-door' : 'd-wrap'); at = z.r; }
    seg(at, w.len, 'd-wall');
  }
  // power cable runs, then points
  for (const { w, a, b } of O.runs) { const p = worldAt(w, a, 0.3, 0.14), q = worldAt(w, b, 0.3, 0.14); body.push(L(X(p[0]), Y(p[2]), X(q[0]), Y(q[2]), 'd-e-pow')); }
  // underground services: mains and temporary post, telecommunications lead-in and stock
  body.push(L(X(PIT[0]), Y(PIT[1]), X(PIT[0]), Y(BOARD.z), 'd-e-cond'), L(X(PIT[0]), Y(BOARD.z), X(BOARD.x), Y(BOARD.z), 'd-e-cond'));
  body.push(L(X(TELCO[0]), Y(TELCO[1]), X(HUB[0]), Y(HUB[1]), 'd-e-tel'));
  body.push(Circ(X(PIT[0]), Y(PIT[1]), 8, 'd-pit'), T(X(PIT[0]), Y(PIT[1]) + 4, 'E', { anchor: 'middle', cls: 'd-bold' }), Circ(X(TELCO[0]), Y(TELCO[1]), 8, 'd-pit'), T(X(TELCO[0]), Y(TELCO[1]) + 4, 'T', { anchor: 'middle', cls: 'd-bold' }));
  body.push(R(X(TEMP[0]) - 5, Y(TEMP[1]) - 5, 10, 10, 'd-e-board'), R(X(STOCK[0]) - 12, Y(STOCK[1]) - 9, 24, 18, 'd-box', 3), T(X(STOCK[0]) - 16, Y(STOCK[1]) + 4, 'Stock', { anchor: 'end', cls: 'd-mute' }), T(X(TEMP[0]) - 12, Y(TEMP[1]) + 4, 'Temp', { anchor: 'end', cls: 'd-mute' }));
  body.push(R(X(BOARD.x) - 4, Y(BOARD.z) - 7, 9, 14, 'd-e-board'));
  // data hub and cables
  for (const [dx, dz] of [[-1.0, 11.2], [0.09, 3.0], [5.2, 4.0], [-1.0, -5.2]]) body.push(L(X(HUB[0]), Y(HUB[1]), X(dx), Y(dz), 'd-e-data'), R(X(dx) - 3, Y(dz) - 3, 6, 6, 'd-e-blue'));
  body.push(R(X(HUB[0]) - 7, Y(HUB[1]) - 4, 14, 8, 'd-e-blue'));
  // interconnect and alarms
  body.push(L(X(ALARMS[0][0]), Y(ALARMS[0][1]), X(ALARMS[1][0]), Y(ALARMS[1][1]), 'd-e-ic'), L(X(ALARMS[0][0]), Y(ALARMS[0][1]), X(ALARMS[2][0]), Y(ALARMS[2][1]), 'd-e-ic'));
  for (const [x, z, n] of ALARMS) body.push(Circ(X(x), Y(z), 6, 'd-e-alarm'), T(X(x) + 10, Y(z) - 8, n, { cls: 'd-mute' }));
  for (const [x, z] of LIGHTS) body.push(Circ(X(x), Y(z), 3.5, 'd-e-lpt'));
  for (const { pos } of O.gpo) body.push(R(X(pos[0]) - 3, Y(pos[2]) - 3, 6, 6, 'd-e-gpo'));
  for (const { pos } of O.sw) body.push(Circ(X(pos[0]), Y(pos[2]), 4, 'd-e-sw'));
  body.push(T(X(0), Y(17.5) + 24, 'Street (front boundary)', { anchor: 'middle', cls: 'd-mute' }), dim(X(-5.5), Y(-5.5) - 14, X(5.5), Y(-5.5) - 14, '11.0 m', -1));
  // callouts: the east side on the right, the interior on the left
  const east = O.gpo.slice().sort((p, q) => q.pos[0] - p.pos[0])[0].pos, sx = X(0.4 * ALARMS[0][0] + 0.6 * ALARMS[1][0]), sy = Y(0.4 * ALARMS[0][1] + 0.6 * ALARMS[1][1]);
  body.push(call(1, X(BOARD.x), Y(BOARD.z), 566, 520), call(3, X(TEMP[0]), Y(TEMP[1]), 566, 650), call(2, X(PIT[0]), Y(15.6), 566, 730), call(6, X(east[0]), Y(east[2]), 566, 400), call(5, sx, sy, 566, 250));
  body.push(call(7, X(HUB[0]), Y(HUB[1]), 40, 470), call(4, X(ALARMS[0][0]), Y(ALARMS[0][1]), 40, 330), call(8, X(TELCO[0]), Y(TELCO[1]), 40, 775));
  const key = [['1', 'Meter box and main switchboard on the east wall'], ['2', 'Consumer mains in conduit from the service pit'], ['3', 'Temporary supply post on site'], ['4', 'Smoke alarm base in the hall (mains powered)'], ['5', 'Interconnect cable linking the alarms'], ['6', 'Power point (a typical position, found from the wall layout)'], ['7', 'Data hub near the entry, with a cable to each outlet'], ['8', 'Telecommunications pit and lead-in']];
  let ky = 100;
  for (const [n, t] of key) { const lines = wrapT(620, ky, t, 34, 15, ''); body.push(T(600, ky, n, { cls: 'd-bold' }), ...lines); ky += 15 * Math.max(1, Math.ceil(t.length / 34)) + 18; }
  body.push(T(600, 460, 'Symbols', { cls: 'd-bold' }));
  const sym = [['line', 'd-e-pow', 'Power cable, in the walls'], ['line', 'd-e-lt', 'Lighting cable, in the roof space (not drawn)'], ['line', 'd-e-data', 'Data cable'], ['line', 'd-e-ic', 'Smoke alarm interconnect'], ['line', 'd-e-cond', 'Mains conduit, underground'], ['line', 'd-e-tel', 'Telecommunications lead-in'], ['sq', 'd-e-gpo', 'Power point'], ['circ', 'd-e-sw', 'Light switch'], ['circ', 'd-e-lpt', 'Light point'], ['circ', 'd-e-alarm', 'Smoke alarm']];
  sym.forEach(([k, cls, t], i) => { const y = 486 + i * 24; if (k === 'line') body.push(L(600, y, 640, y, cls)); else if (k === 'sq') body.push(R(614, y - 4, 8, 8, cls)); else body.push(Circ(620, y, 5, cls)); body.push(T(654, y + 4, t, { cls: '' })); });
  body.push(T(40, 40, 'Electrical and data layout, as in the model', { cls: 'd-bold' }));
  body.push(...wrapT(40, 836, 'Typical, drawn from the model. Positions are illustrative. The meter box position is the distributor\'s rule, and cable runs, point heights and circuits come from the electrician\'s design and AS/NZS 3000, which was not opened.', 112, 18));
  return svg(900, 880, body.join(''), 'Electrical and data layout plan');
}

function boardDwg() {
  const body = [R(0, 0, 900, 760, 'd-bg')], blk = (x, y, w, h, lines) => { body.push(R(x, y, w, h, 'd-box', 6)); lines.forEach((t, i) => body.push(T(x + w / 2, y + 20 + i * 16, t, { cls: i ? 'd-mute' : 'd-bold', anchor: 'middle' }))); };
  body.push(T(40, 40, 'Single-line diagram of a typical switchboard', { cls: 'd-bold' }));
  blk(130, 70, 300, 48, ['Distributor\'s supply', 'Service pit and supply point']); blk(130, 148, 300, 48, ['Consumer mains', 'Underground, in conduit']); blk(130, 226, 300, 48, ['Meter', 'The distributor\'s equipment, sealed']);
  body.push(`<rect x="96" y="292" width="392" height="300" class="d-cut" fill="none"/>`, T(100, 286, 'Main switchboard', { cls: 'd-bold' }));
  blk(130, 304, 300, 48, ['Main switch', 'Isolates the whole house']);
  for (const [y1, y2] of [[118, 148], [196, 226], [274, 304]]) body.push(arrow(280, y1, 280, y2));
  body.push(arrow(280, 352, 280, 376), L(110, 380, 450, 380, 'd-e-bus'), T(112, 370, 'Active bus', { cls: 'd-mute' }));
  blk(110, 410, 150, 56, ['RCD 1', 'Circuits 1 and 2']); blk(300, 410, 150, 56, ['RCD 2', 'Circuits 3, 4 and 5']);
  body.push(arrow(185, 380, 185, 410), arrow(375, 380, 375, 410));
  const cb = [[125, 1, 'Lights'], [189, 2, 'Power'], [283, 3, 'Oven'], [347, 4, 'Hot water'], [411, 5, 'Air con']];
  for (const [x, n, name] of cb) { body.push(R(x, 500, 56, 44, 'd-box', 4), T(x + 28, 527, String(n), { cls: 'd-bold', anchor: 'middle' }), arrow(x + 28, n < 3 ? 466 : 466, x + 28, 500), arrow(x + 28, 544, x + 28, 560), T(x + 28, 580, name, { cls: 'd-mute', anchor: 'middle' })); }
  body.push(L(520, 380, 520, 560, 'd-e-neu'), L(600, 380, 600, 560, 'd-e-ear'), T(520, 370, 'Neutral bar', { anchor: 'middle', cls: 'd-mute' }), T(600, 370, 'Earth bar', { anchor: 'middle', cls: 'd-mute' }));
  body.push(L(600, 560, 600, 610, 'd-e-ear'), L(584, 610, 616, 610, 'd-line'), L(590, 618, 610, 618, 'd-line'), L(595, 626, 605, 626, 'd-line'), T(600, 650, 'Earth electrode', { anchor: 'middle', cls: 'd-mute' }));
  body.push(...wrapT(520, 130, 'Typical layout, not a design. Circuits, ratings and the number of RCDs come from the electrician\'s design and AS/NZS 3000, which was not opened.', 44, 18));
  body.push(...wrapT(520, 220, 'Consumer mains and the main switchboard are prescribed work. A licensed electrical inspector inspects them, and they cannot be switched on until that is done.', 44, 18));
  body.push(...wrapT(520, 310, 'RCDs and RCBOs must be tested before the Certificate of Electrical Safety is signed, with the result recorded at the board.', 44, 18));
  body.push(...wrapT(40, 680, 'Every circuit\'s neutral returns to the neutral bar and every earth wire lands on the earth bar. The earth bar is linked to the earth electrode. Labels on the board: circuit schedule and RCD test record.', 112, 18));
  return svg(900, 760, body.join(''), 'Switchboard single-line diagram');
}

function alarmDwg() {
  const body = [R(0, 0, 900, 830, 'd-bg')];
  body.push(T(40, 62, 'A  Ceiling plan at a corner', { cls: 'd-bold' }), T(470, 62, 'B  Sloping ceiling, section', { cls: 'd-bold' }), T(40, 452, 'C  Wall-mounted alarm, section', { cls: 'd-bold' }), T(470, 452, 'D  Linked alarms, as in the model', { cls: 'd-bold' }));
  // A: the 300 mm strips beside a wall and ceiling corner, at 200 px per metre
  body.push(R(70, 110, 340, 210, 'd-e-ceil'), R(70, 110, 340, 60, 'd-e-keep'), R(70, 110, 60, 210, 'd-e-keep'), L(70, 110, 410, 110, 'd-wall'), L(70, 110, 70, 320, 'd-wall'));
  body.push(Circ(260, 235, 14, 'd-e-alarm'), `<circle cx="96" cy="136" r="12" class="d-cut" fill="none"/>`, T(130, 142, 'Not here', { cls: 'd-mute' }), T(282, 239, 'Alarm', { cls: 'd-mute' }));
  body.push(dim(425, 110, 425, 170, '300 mm', 1), dim(70, 336, 130, 336, '300 mm', 1));
  body.push(...wrapT(60, 372, 'A ceiling alarm is at least 300 mm from the corner where the wall meets the ceiling. Dead air collects in corners, so smoke may not reach an alarm there.', 52, 18));
  // B: a gable section with a ruler from the apex
  body.push(L(490, 330, 675, 170, 'd-wall'), L(675, 170, 860, 330, 'd-wall'), L(490, 330, 490, 372, 'd-wall'), L(860, 330, 860, 372, 'd-wall'), Circ(675, 170, 4, 'd-dot'), T(675, 156, 'apex', { anchor: 'middle', cls: 'd-mute' }));
  body.push(R(525, 112, 100, 14, 'd-e-ok'), R(625, 112, 100, 14, 'd-e-keep'), R(725, 112, 100, 14, 'd-e-ok'));
  for (const x of [525, 625, 725, 825]) body.push(L(x, 126, x, x < 675 ? 330 - (x - 490) * (160 / 185) : 170 + (x - 675) * (160 / 185), 'd-dim'));
  body.push(T(575, 106, '0.5 to 1.5 m', { anchor: 'middle', cls: 'd-mute' }), T(775, 106, '0.5 to 1.5 m', { anchor: 'middle', cls: 'd-mute' }), T(675, 106, 'too close', { anchor: 'middle', cls: 'd-mute' }));
  body.push(Circ(590, 330 - (590 - 490) * (160 / 185), 9, 'd-e-alarm'));
  body.push(...wrapT(490, 394, 'On a sloping ceiling the alarm is 500 to 1500 mm from the high point. How the distance is measured, level or along the slope, is shown in the NCC figure, which I did not see.', 60, 18));
  // C: a wall alarm 300 to 500 mm below the ceiling, at 200 px per metre
  body.push(L(70, 490, 420, 490, 'd-wall'), L(70, 490, 70, 690, 'd-wall'), R(72, 550, 340, 40, 'd-e-ok'), R(72, 562, 16, 24, 'd-e-alarm'));
  body.push(dim(250, 490, 250, 550, '300 mm', 1), dim(340, 490, 340, 590, '500 mm', 1), T(110, 575, 'Alarm', { cls: 'd-mute' }));
  body.push(...wrapT(90, 628, 'If a ceiling mount is not possible, a wall-mounted alarm goes 300 to 500 mm below the ceiling.', 52, 18));
  // D: the three alarms of the model, linked
  const rooms = [[490, 520, 130, 120, 'Bedroom'], [620, 520, 90, 120, 'Hall'], [710, 520, 150, 120, 'Living']];
  for (const [x, y, w, h, n] of rooms) body.push(R(x, y, w, h, 'd-e-ceil'), T(x + w / 2, y + h + 20, n, { cls: 'd-mute', anchor: 'middle' }));
  body.push(L(665, 580, 555, 580, 'd-e-ic'), L(665, 580, 785, 580, 'd-e-ic'), Circ(555, 580, 9, 'd-e-alarm'), Circ(665, 580, 9, 'd-e-alarm'), Circ(785, 580, 9, 'd-e-alarm'));
  body.push(...wrapT(490, 690, 'All the alarms in a dwelling are interconnected, so when one sounds they all sound. Interconnection applies within one dwelling only. Positions here are illustrative.', 56, 18));
  body.push(...wrapT(40, 770, 'Distances from the ABCB Housing Provisions Part 9.5 page, which carries NSW-labelled text and no stated edition. Alarms comply with AS 3786, which was not opened. Check the clause and figure for the edition your permit was assessed under.', 112, 18));
  return svg(900, 830, body.join(''), 'Smoke alarm placement');
}

function flowDwg() {
  const body = [R(0, 0, 900, 700, 'd-bg')], blk = (x, y, w, h, lines) => { body.push(R(x, y, w, h, 'd-box', 6)); lines.forEach((t, i) => body.push(T(x + 12, y + 22 + i * 16, t, { cls: i ? 'd-mute' : 'd-bold' }))); };
  const A = 40, B = 470, W = 360;
  body.push(T(40, 40, 'Electrical sequence, from plan to certificate', { cls: 'd-bold' }), T(A, 68, 'A  Plan and rough-in', { cls: 'd-bold' }), T(B, 68, 'B  Test, inspect, certify', { cls: 'd-bold' }));
  blk(A, 84, W, 56, ['Plan the circuits and the supply', 'Circuit schedule, distributor application']); blk(A, 170, W, 56, ['Temporary supply and stock on site', 'Board on a post, conduit, steel guard']);
  blk(A, 256, W, 56, ['Mains and the switchboard enclosure', 'Prescribed work: mains, main switchboard']); blk(A, 342, W, 72, ['Rough-in while the frame is open', 'Cables, boxes, alarm bases, data and lead-in', 'Photograph the walls before the linings']);
  for (const [y1, y2] of [[140, 170], [226, 256], [312, 342]]) body.push(arrow(A + W / 2, y1, A + W / 2, y2));
  blk(B, 84, W, 56, ['Wire the switchboard', 'Main switch, RCDs, breakers, schedule label']); blk(B, 170, W, 56, ['Test the installation', 'RCDs tested, result recorded at the board']);
  blk(B, 256, W, 56, ['Installer signs the Prescribed COES', 'Then the licensed electrical inspector inspects']); blk(B, 342, W, 72, ['Inspection within 8 business days', 'Defects notified within 4 business days', 'Not switched on until inspected']);
  blk(B, 444, W, 56, ['Lodge the certificate and give copies', 'Customer and Energy Safe, through ESVConnect']); blk(B, 530, W, 72, ['Connect and fit off', 'The distributor connects the supply', 'Alarms and fittings go on after the linings']);
  for (const [y1, y2] of [[140, 170], [226, 256], [312, 342], [414, 444], [500, 530]]) body.push(arrow(B + W / 2, y1, B + W / 2, y2));
  body.push(L(A + W, 378, 435, 378), L(435, 378, 435, 112), arrow(435, 112, B, 112));
  body.push(...wrapT(40, 640, 'Certificate timing: for prescribed work the customer\'s copy is due within 4 days once the inspection is complete, and for non-prescribed work within 30 days. Cable sizes, test methods and fit-off rules come from AS/NZS 3000 and AS/NZS 3017, which were not opened.', 112, 18));
  return svg(900, 700, body.join(''), 'Electrical sequence flow');
}

export const drawings = [
  { id: 'layout', title: 'Layout plan', scale: 'Plan, 30 px per metre', svg: layoutDwg(),
    notes: ['The model\'s electrical layout: the meter box and main switchboard on the east wall, mains in conduit from the service pit, a temporary supply post, power points, switches, lights, smoke alarms, the data hub and the telecommunications lead-in. Callout numbers match the key.', 'Positions are illustrative. The meter box position is the distributor\'s rule, and point heights, circuits and cable runs come from the electrician\'s design and AS/NZS 3000, which was not opened.', 'The colours are for teaching. Real cables are mostly one colour.'] },
  { id: 'board', title: 'Switchboard diagram', scale: 'Single-line, not to scale', svg: boardDwg(),
    notes: ['A single-line diagram of a typical main switchboard: supply, mains, meter, main switch, RCDs, circuit breakers, neutral and earth bars and the earth electrode.', 'Consumer mains and the main switchboard are prescribed work, inspected before they are switched on. RCD tests are recorded at the board.', 'Circuits, ratings and the number of RCDs are the electrician\'s design. The layout here is typical, not a design.'] },
  { id: 'alarm', title: 'Smoke alarm placement', scale: 'Schematic, distances marked', svg: alarmDwg(),
    notes: ['Ceiling alarms are at least 300 mm from the corner where the wall meets the ceiling. On a sloping ceiling they are 500 to 1500 mm from the apex. A wall-mounted alarm goes 300 to 500 mm below the ceiling.', 'Alarms must comply with AS 3786, be mains powered where the building has mains, and be interconnected where there is more than one.', 'The distances come from an ABCB page with NSW-labelled text and no stated edition. Check the clause and figure for the edition that applies.'] },
  { id: 'flow', title: 'Sequence and certificate', scale: 'Flow diagram', svg: flowDwg(),
    notes: ['Two flows: planning and rough-in while the frame is open, then wiring the board, testing, the prescribed inspection, lodging the certificate and connection.', 'Prescribed work is not switched on until it has been inspected, and the inspector is arranged by the electrician.', 'Keep the certificate copy. It is your evidence that licensed work was done.'] },
];

/* ---------- study content ---------- */
export const howto = [
  ['Plan the circuits and the supply', 'Ask the electrician for a circuit schedule from the plans: points by room, the switchboard and meter positions, smoke alarms, data and any solar provision. Apply to the distributor for the supply and agree where the meter box goes.', 'Builder and electrician', 'T'],
  ['Set up the temporary supply', 'Fix the temporary board to a post or other rigid structure. Run the underground mains in non-metallic conduit, with the steel guard from ground level to within 100 mm of the enclosure, and use mains that are double insulated up to the first protective device.', 'Electrician', 'V', 'esvTemp'],
  ['Take delivery and store the electrical stock', 'Cable drums, conduit, mounting boxes and the switchboard come to site. Store them dry and secure, away from the trench and the delivery path.', 'Electrician', 'T'],
  ['Lay the consumer mains and fix the enclosure', 'Run the mains in conduit from the service pit to the meter box and fix the enclosure where the plans and the distributor agree. This is prescribed work, so it is inspected before it is switched on. Depth and conduit come from the distributor\'s rules.', 'Electrician', 'V', 'esvCoesConsumers'],
  ['Fix the mounting boxes', 'Fix a box at each power point, switch and light position, at the heights on the plans. The model uses 300 mm for power points and 1100 mm for switches.', 'Electrician', 'T'],
  ['Run the cables through the frame', 'Drill small holes in the middle of the studs, run the cables and clip them, with nail plates where a cable passes close to the face of a stud. Hole sizes and positions follow the structural drawings and AS 1684.', 'Electrician', 'C'],
  ['Cable the smoke alarm bases', 'Fix a base at each alarm position and run the mains and interconnect cables. Alarms comply with AS 3786, are powered from the mains and are interconnected. Keep each ceiling alarm at least 300 mm from the wall and ceiling corner.', 'Electrician', 'V', 'nccHp95'],
  ['Lay the data and telecommunications cables', 'Place the data hub near the entry, run a cable to each outlet and lay the telecommunications lead-in from the street pit. Check the network operator\'s requirements first.', 'Data cabler', 'C'],
  ['Check and photograph before the linings', 'Walk the frame with the electrician. Check holes, clips, nail plates and the position of every box, then photograph each wall before the plasterer starts.', 'Builder and electrician', 'T'],
  ['Wire and label the switchboard', 'Fit the main switch, RCDs, circuit breakers, neutral and earth bars. Wire each circuit and fix the circuit schedule label.', 'Electrician', 'T'],
  ['Test the installation, including the RCDs', 'Test the installation. RCDs and RCBOs must be tested to verify they are installed and operating correctly, and the test happens before the certificate is signed. Record the result at the switchboard.', 'Electrician', 'V', 'esvRcd'],
  ['Arrange the prescribed inspection', 'The electrician arranges an independent licensed electrical inspector, and the installer signs the Prescribed COES first. Inspection should be completed within 8 business days of completing the work, and the work stays switched off until then.', 'Electrician', 'V', 'esvCoesConsumers'],
  ['Lodge the certificate and collect your copy', 'The electrician lodges the certificate, which is electronic through ESVConnect, and gives copies to the customer and Energy Safe. File your copy with the plans and the permit documents.', 'Electrician and builder', 'V', 'esvCoes'],
];

export const trades = [
  { t: 'Registered electrical contractor or licensed electrician', role: 'Designs the circuits, supplies and installs the wiring, wires the switchboard, tests, arranges the inspection and lodges the Certificate of Electrical Safety.', when: 'Before the frame is lined, and again at fit-off', reg: 'A Certificate of Electrical Safety is required for all electrical installation work, and only a registered electrical contractor or licensed electrician can issue one. The builder does not do the wiring.', ask: ['Licence and registration numbers', 'Points by room in a circuit schedule', 'Inspection fee and certificate lodging included', 'Who supplies smoke alarms and fittings'] },
  { t: 'Licensed electrical inspector', role: 'Independently inspects prescribed work (consumer mains, main switchboard, solar or battery systems) within the scope of their licence.', when: 'Within 8 business days of completing prescribed work', reg: 'Licensed electrical inspector. The electrician or contractor arranges the inspection. Energy Safe does not arrange or schedule it.', ask: ['Who arranges and pays for the inspection', 'What the inspector will want to see', 'When defects are notified'] },
  { t: 'Electricity distributor', role: 'Supplies and seals the meter, sets the rules for the service pit and meter box, and connects the supply.', when: 'Application early. Connection after the inspection', reg: 'Rules and fees vary by distributor, and were not read for this step. Check yours.', ask: ['Meter box position and clearances', 'Application steps and fees', 'Connection timeframe'] },
  { t: 'Data and telecommunications cabler', role: 'Lays the data cables, the hub and the telecommunications lead-in.', when: 'During rough-in, while the frame is open', reg: 'Cabling registration and network operator rules were not checked. Ask the cabler to show their registration.', ask: ['Cable type and number of outlets', 'Hub or cupboard position', 'Lead-in conduit and who supplies it'] },
  { t: 'Solar installer (if used)', role: 'Designs and installs a solar system, which is prescribed work.', when: 'After the roof, with inspection like other prescribed work', reg: 'Prescribed work needs inspection before it is switched on. The tests for solar cite AS/NZS 5033, which was not opened.', ask: ['System size and inverter position', 'Inspection and certificate arrangements', 'Roof penetration and flashing details'] },
  { t: 'Building surveyor (RBS)', role: 'Assesses the smoke alarms against the permit and checks the work at final inspection.', when: 'Before the occupancy permit', reg: 'Registered building surveyor (BPC). A building permit is generally required to install a smoke alarm system, with a possible exemption if it complies with the NCC.', ask: ['Which smoke alarm edition and clause apply', 'Whether they want a copy of the certificate at final'] },
];

export const materials = [
  ['Electrical cable', 'Sheathed cable in sizes chosen by the electrician for each circuit, on drums', 'Electrical wholesaler. The electrician normally supplies', 'C', 'Sizes come from the design and AS/NZS 3000, which was not opened.'],
  ['Underground mains conduit', 'Orange conduit for the consumer mains from the service pit to the meter box', 'Electrical wholesaler or the electrician', 'C', 'Orange is the usual conduit colour (Typical). Type, size and depth come from the distributor\'s rules.'],
  ['Mounting boxes', 'Plastic or metal boxes fixed to the studs for power points, switches and lights', 'Electrical wholesaler. Bunnings stocks some (confirm the range)', 'T', 'The electrician chooses the size and type.'],
  ['Switchboard enclosure and meter box', 'A weatherproof enclosure with a lockable door and a meter panel', 'Electrical wholesaler. Position and size per the distributor', 'C', 'Meter position is the distributor\'s rule.'],
  ['Main switch, RCDs and circuit breakers', 'The protective devices fitted to the board, with the neutral and earth bars', 'Electrical wholesaler', 'V', 'RCDs and RCBOs must be tested before the certificate is signed (ESV, December 2021 guidance). Numbers and ratings are the electrician\'s design.'],
  ['Power points and switches', 'Flush plates and mechanisms for power points and light switches', 'Electrical wholesaler or Bunnings. Makers include Clipsal and HPM (confirm the range)', 'T', 'Fit-off is after the linings and paint.'],
  ['Smoke alarms and bases', 'Mains-powered, interconnectable alarms that comply with AS 3786', 'Electrical wholesaler or the electrician', 'V', 'Alarms must comply with AS 3786, be mains powered and be interconnected (ABCB Part 9.5 page).'],
  ['Data cable and hub', 'Network cable, a hub or cabinet and data outlets', 'Electrical wholesaler. Bunnings stocks some cable (confirm the range)', 'T', 'Use what the cabler specifies.'],
  ['Temporary board and steel guard', 'A weatherproof temporary board on a post, with non-metallic conduit and a steel guard', 'The electrician supplies, or an equipment hire company', 'V', 'Steel guard options: galvanised tube at least 3.2 mm, or sheet steel at least 1.6 mm with an unsupported width of no more than 100 mm.'],
  ['Cable supports, grommets and nail plates', 'Clips, grommets for the holes and steel plates to protect cable near the stud face', 'Electrical wholesaler', 'C', 'Spacings and plate sizes come from AS/NZS 3000, which was not opened.'],
];

export const quotes = [
  { who: 'Registered electrical contractor', n: '3', what: ['Points by room: power points, lights, switches, data outlets and smoke alarms', 'Switchboard, RCDs, smoke alarms and the temporary supply named', 'Inspection fee, RCD tests and certificate lodging included'] },
  { who: 'Data and telecommunications cabler', n: '2', what: ['Outlets by room and cable type', 'Hub or cupboard position', 'Lead-in conduit and who supplies it'] },
  { who: 'Solar installer (optional)', n: '3', what: ['System size, panels and inverter', 'Inspection and certificate arrangements', 'Roof flashing and who is liable for leaks'] },
  { who: 'Electricity distributor (fees)', n: '1', what: ['Connection fees and timeframe', 'Meter and pit requirements', 'What must be inspected before connection'] },
  { who: 'Temporary supply (electrician or hire)', n: '2', what: ['Board and guard supplied and who installs them', 'Hire cost per week and removal', 'Who certifies it'] },
];
export const quoteTips = [
  'Ask the electrician to price by room against a schedule of points, so quotes can be compared. A quote for "electrical to the house" hides what is missing.',
  'Check the quote says who arranges and pays for the licensed electrical inspector, and that certificate lodging is included. They are part of the job, not extras.',
  'Ask whether the RCD tests and the record at the board are included, and whether the electrician will complete them before the certificate is signed.',
  'Settle who supplies the light fittings, smoke alarms and power points, and whether they are allowances in the contract.',
  'Ask for the licence and registration numbers and check them with Energy Safe before signing.',
  'Keep every quote, the circuit schedule, wall photographs taken before the linings and the certificate copy. They are evidence of estimating and supervision for the BPC application.',
];

export const inspections = [
  ['Circuit plan check', 'Builder and electrician', 'Before rough-in', 'Points by room match the plans. Board, meter and data hub positions agreed with the designer, owner and distributor.', 'T'],
  ['Temporary supply check', 'Electrician and builder', 'Before the board is used', 'Enclosure fixed to a post or rigid structure, non-metallic conduit, steel guard to within 100 mm of the enclosure, mains double insulated to the first protective device.', 'V', 'esvTemp'],
  ['Mains trench check', 'Electrician and builder', 'Before backfill', 'Conduit and marker tape in place. Ask the distributor and the electrician whether they want to see it before it is covered.', 'C'],
  ['Frame cabling check', 'Builder and electrician', 'Before the linings', 'Cables through the middle of the studs, holes small, clips fitted, nail plates where needed, nothing cut that the structural drawings do not allow.', 'C'],
  ['Wall photographs', 'Builder', 'Before the plasterer starts', 'Every wall photographed with the cables and boxes visible, for the record and for later trades.', 'T'],
  ['Smoke alarm layout check', 'Builder and building surveyor', 'Before the ceilings', 'Alarms in each required location, at least 300 mm from corners, 500 to 1500 mm from an apex, interconnected and on mains power.', 'V', 'nccHp95'],
  ['Switchboard wiring and label check', 'Electrician', 'Before testing', 'Main switch, RCDs and breakers fitted, neutral and earth landed, circuit schedule label fixed.', 'T'],
  ['RCD test and record', 'Electrician', 'Before the certificate is signed', 'RCDs and RCBOs tested and the confirmation recorded and available at the switchboard. Check whether ESV\'s interim 30-day discretion still applies.', 'V', 'esvRcd'],
  ['Prescribed work inspection', 'Licensed electrical inspector', 'Within 8 business days of completing the work', 'The installer has signed the Prescribed COES. The inspector inspects within the scope of their licence, and the work is not switched on until it is done.', 'V', 'esvLei'],
  ['Certificate lodged and copies collected', 'Electrician and builder', 'After the inspection', 'Prescribed work copy to the customer within 4 days once the inspection is complete, and non-prescribed work within 30 days. A copy also goes to Energy Safe.', 'V', 'esvCoesConsumers'],
];

export const exam = [
  ['Which Act and regulations require a Certificate of Electrical Safety?', 'The Electricity Safety Act 1998 and the Electricity Safety (General) Regulations 2019.', 'V', 'esvCoes'],
  ['What work requires a Certificate of Electrical Safety?', 'All electrical installation work.', 'V', 'esvCoes'],
  ['Who can issue a Certificate of Electrical Safety?', 'A registered electrical contractor or licensed electrician. Unlicensed people cannot purchase or lodge one.', 'V', 'esvCoesConsumers'],
  ['Can a builder do the wiring on a house they are building?', 'Not unless they are a licensed electrician. Electrical installation work needs a certificate, and only a registered electrical contractor or licensed electrician can issue one.', 'V', 'esvCoesConsumers'],
  ['How are certificates lodged?', 'Electronic certificates are lodged through ESVConnect, and paper certificates through the interactive voice response phone system.', 'V', 'esvCoes'],
  ['What is the consequence of not complying with the certificate requirements?', 'It is a criminal offence, and licensed workers may face disciplinary action.', 'V', 'esvCoes'],
  ['Give examples of prescribed electrical work.', 'Consumer mains, the main switchboard, and solar or battery systems.', 'V', 'esvCoesConsumers'],
  ['When should the inspection of prescribed work be completed?', 'Within 8 business days of completing the work.', 'V', 'esvCoesConsumers'],
  ['Who inspects prescribed work, and who arranges it?', 'An independent licensed electrical inspector, arranged by the registered electrical contractor or electrician. Energy Safe does not arrange or schedule it.', 'V', 'esvCoesConsumers'],
  ['When can prescribed work be switched on?', 'Not until it has been inspected. It must be inspected before connection to supply.', 'V', 'esvCoesConsumers'],
  ['Who signs first, the installer or the inspector?', 'The installer signs the Prescribed Certificate of Electrical Safety before the licensed electrical inspector inspects.', 'V', 'esvLei'],
  ['Within what time does the inspector notify defects, report to ESV and return the certificate?', 'Within 4 business days for each.', 'V', 'esvLei'],
  ['How long does the inspector keep their copy?', 'Three years.', 'V', 'esvLei'],
  ['When is the customer\'s copy of a Prescribed COES due?', 'Within 4 days, once the inspection is complete.', 'V', 'esvCoesConsumers'],
  ['When is the customer\'s copy due for non-prescribed work?', 'Within 30 days. A copy also goes to Energy Safe.', 'V', 'esvCoesConsumers'],
  ['How must a temporary switchboard enclosure be mounted on a construction site?', 'Securely attached to a pole, post, wall or other rigid and secure structure. A free-standing unit must be fixed in place.', 'V', 'esvTemp'],
  ['What conduit must underground mains to a temporary enclosure run in?', 'Non-metallic conduit, from where the mains leave the ground to where they enter the enclosure.', 'V', 'esvTemp'],
  ['What extra protection does the temporary mains conduit need?', 'WSX3 mechanical protection (AS/NZS 3013 Appendix F) from ground level to within 100 mm of the enclosure. Options: galvanised steel tube at least 3.2 mm thick, or sheet steel at least 1.6 mm thick with an unsupported width of no more than 100 mm.', 'V', 'esvTemp'],
  ['How must underground mains to a temporary board be insulated?', 'Double insulated up to the first protective device.', 'V', 'esvTemp'],
  ['What did Wiring Rules Amendment 2 require from 1 November 2021?', 'RCDs and RCBOs must be tested to verify they have been installed correctly and are operating correctly.', 'V', 'esvRcd'],
  ['When must the RCD test happen?', 'Before the Certificate of Electrical Safety is signed. For a new installation not yet connected, before the distributor connects supply.', 'V', 'esvRcd'],
  ['Where is confirmation of RCD testing recorded?', 'It must be recorded and available at the switchboard where the RCDs and RCBOs are installed.', 'V', 'esvRcd'],
  ['What interim discretion did ESV give in December 2021?', 'Testing within 30 days of connection, noted on the certificate, for installations not yet connected. Confirm whether it still applies.', 'C', 'esvRcd'],
  ['Which Standard must smoke alarms comply with, and how are they powered?', 'AS 3786. They are powered from the consumer mains where the building has mains, and interconnected where there is more than one alarm.', 'V', 'nccHp95'],
  ['Where do smoke alarms go in a Class 1a building?', 'In any storey with bedrooms: in each corridor or hallway associated with a bedroom, or the area between the bedrooms and the rest of the building. Also in each other storey.', 'V', 'nccHp95'],
  ['What are the ceiling placement distances for a smoke alarm?', 'At least 300 mm from the wall and ceiling corner, and 500 to 1500 mm from the apex of a sloping ceiling. A wall-mounted alarm goes 300 to 500 mm below the ceiling.', 'V', 'nccHp95'],
  ['Does interconnection of smoke alarms extend between dwellings?', 'No. It applies within a single dwelling only.', 'V', 'nccHp95'],
  ['Does installing a smoke alarm system need a building permit in Victoria?', 'A permit is generally required. An exemption may apply under Schedule 3, Item 4 of the Building Regulations if the system complies with the NCC.', 'V', 'vbaEsm09'],
];

/* ---------- sources and caution ---------- */
export const sources = ['esvCoes', 'esvCoesConsumers', 'esvLei', 'esvInstall', 'esvTemp', 'esvRcd', 'esvTesting', 'vbaEsm09', 'nccHp95', 'nccVtH3', 'nccHp137'];
export const caution = 'Electrical rules here come from Energy Safe Victoria pages (certificates, licensed electrical inspectors, temporary switchboards, the December 2021 RCD guidance), a VBA smoke alarm practice note (version 3.0, March 2023) and ABCB NCC 2022 web pages. The ABCB Part 9.5 page carries NSW-labelled text and no stated edition, the Part H3 page does not show clause labels, and the Part 13.7 lighting limits were not read, so no lighting numbers are given. AS/NZS 3000, AS/NZS 3017, AS/NZS 3786 and AS 1670 are paywalled and were not opened, so cable sizes, breaker ratings, point heights, stud hole rules and test methods are Typical or Confirm. The ESV RCD discretion dates from December 2021 and may have changed. Meter box position is the distributor\'s rule. Network and cabling registration rules were not checked. Positions in the model (meter box, pit, alarms, data hub) are illustrative.';

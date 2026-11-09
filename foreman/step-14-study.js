// Step 14 study content: drawings, steps, trades, materials, quotes, inspections and exam cards for tiling and floor coverings.
// Flags: V = Verified against a source named in SOURCES, T = Typical practice, C = Confirm. BPC sections 14, 15, 3.3 and 11.4 were re-read against the PDF (Guide to Standards and Tolerances 2026, advisory, from 1 August 2026).
// AS 3958 (edition unclear), AS 1884, AS 2455.1, AS 2796.1 and AS 4586 were not opened (paywalled). The HIA movement-joint article is a summary and names no sealant. Sizes, layers and room zones in the model are illustrative.
import { svg, T, L, R, C as Circ, P, dim, call, arrow } from './dwg.js';

const wrapT = (x, y, text, n, dy = 18, cls = 'd-mute') => { const out = []; let cur = ''; for (const w of text.split(' ')) { if ((cur + ' ' + w).trim().length > n) { out.push(cur); cur = w; } else cur = (cur + ' ' + w).trim(); } if (cur) out.push(cur); return out.map((t, i) => T(x, y + i * dy, t, { cls })); };
const keyList = (body, x, y, items, n, step, off = 20) => items.forEach(([k, t], i) => { body.push(T(x, y + i * step, k, { cls: 'd-bold' }), ...wrapT(x + off, y + i * step, t, n, 16, '')); });
const dash = (x1, y1, x2, y2) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" class="d-cut" fill="none"/>`;

/* ---------- drawings ---------- */
function tileDwg() {
  const body = [R(0, 0, 900, 1090, 'd-bg')];
  body.push(T(40, 40, 'Tile build-up, lippage limits and falls', { cls: 'd-bold' }), T(40, 68, 'A  Section through the floor and the wall junction, layers not to scale', { cls: 'd-bold' }));
  const fx0 = 90, fx1 = 470, top = 330;
  body.push(R(fx0 - 30, top, fx1 - fx0 + 30, 80, 'd-conc'), R(fx0, top - 40, fx1 - fx0, 40, 'd-slabfill'), R(fx0, top - 56, fx1 - fx0, 16, 'd-adh'));
  for (let x = fx0 + 40; x < fx1; x += 16) body.push(R(x, top - 62, 8, 6, 'd-adh'));
  body.push(R(122, top - 80, 140, 24, 'd-tilef'), R(270, top - 80, 190, 24, 'd-tilef'), R(262, top - 78, 8, 22, 'd-board'));
  body.push(R(60, 150, 30, top - 150 - 40, 'd-sheet'), L(fx0 + 2, top - 40, fx1, top - 40, 'd-memb'), L(fx0 + 2, top - 40, fx0 + 2, 150, 'd-memb'));
  body.push(R(98, 150, 12, 100 + 0, 'd-tilef'), R(110, 250, 12, 12, 'd-sealant'), Circ(116, 268, 5, 'd-collar'));
  body.push(L(30, top, fx0 - 30, top, 'd-line'));
  const pts = [[440, 370, 1], [440, 310, 2], [440, 290, 3], [440, 282, 4], [440, 262, 5], [266, 262, 6], [75, 200, 7], [104, 200, 8], [116, 256, 9]];
  const bub = { 1: [500, 380], 2: [500, 340], 3: [500, 300], 4: [500, 262], 5: [500, 224], 6: [266, 150], 7: [60, 120], 8: [130, 120], 9: [230, 205] };
  for (const [px, py, n] of pts) body.push(call(n, px, py, bub[n][0], bub[n][1]));
  keyList(body, 548, 110, [['1', 'Concrete slab, Step 2'], ['2', 'Screed, 1:80 to 1:50 falls'], ['3', 'Membrane, never cut by the tiler'], ['4', 'Adhesive, combed, full back support'], ['5', 'Tile, flat within 3 mm in 2 m'], ['6', 'Grout, no voids or pinholes'], ['7', 'Wall sheet and membrane upturn'], ['8', 'Wall tile, stops above floor tile'], ['9', 'Backing rod and flexible sealant']], 40, 30);
  body.push(T(fx0 + 6, 430, 'Layers are drawn thicker than real. The wall tile stops above the floor tile so the sealant can move.', { cls: 'd-mute' }));
  // B: lippage table
  body.push(T(40, 500, 'B  Lippage limits, Table 14.6 of the BPC guide (100 px per mm)', { cls: 'd-bold' }));
  const rows = [['Flat, polished or honed, joint 1.5 to 2.9 mm', 1.0], ['Flat, polished or honed, joint 3.0 to 6.0 mm', 1.5], ['Flat, polished or honed, joint over 6.0 mm', 2.0], ['Smooth, regular edge finish, any joint', 2.0], ['Highly profiled, consistent surface, any joint', 2.0]];
  const bx = 350, by = 520;
  rows.forEach(([name, mm], i) => { const y = by + i * 36; body.push(T(40, y + 17, name, { cls: '' }), R(bx, y, mm * 100, 24, 'd-timber'), T(bx + mm * 100 + 8, y + 17, `${mm.toFixed(1)} mm`, { cls: 'd-bold' })); });
  for (let k = 0; k <= 6; k++) body.push(L(bx + k * 50, by + 184, bx + k * 50, by + 190, 'd-dim'), T(bx + k * 50, by + 204, (k / 2).toFixed(1), { anchor: 'middle', cls: 'd-dimt' }));
  body.push(L(bx, by + 184, bx + 300, by + 184, 'd-dim'), T(bx + 150, by + 224, 'allowed lippage between two adjacent tiles (mm)', { anchor: 'middle', cls: 'd-mute' }));
  body.push(dash(bx + 300, by - 8, bx + 300, by + 184), T(bx + 308, by + 124, 'model tile: 3 mm proud', { cls: 'd-bold' }));
  body.push(...wrapT(680, 530, 'The model uses a 3 mm joint, so the limit for a flat polished or honed tile is 1.5 mm. Part 5 of AS 3958 has further information (Standard not opened).', 26, 16));
  // C: falls
  body.push(T(40, 790, 'C  Falls to the waste, 3.4 m from the waste to the far corner (height drawn 8 times)', { cls: 'd-bold' }));
  const x0 = 80, x1 = 590, yb = 980, k = 8, pxmm = 0.15;
  body.push(L(x0, yb, x1, yb, 'd-ground'), R(x0 - 22, yb - 4, 22, 14, 'd-steel'), T(x0 - 22, yb + 30, 'waste', { cls: 'd-mute' }));
  for (const [ratio, cls, label] of [[80, 'd-e-ok', '1:80, 42 mm: flattest allowed'], [60, 'd-line', '1:60, 57 mm: model'], [50, 'd-gap', '1:50, 68 mm: steepest allowed']]) {
    const yEnd = yb - (k * (x1 - x0)) / ratio;
    body.push(L(x0, yb, x1, yEnd, cls), T(x1 + 10, yEnd + 4, label, { cls: ratio === 60 ? 'd-bold' : 'd-mute' }));
  }
  body.push(dim(x0, 1008, x1, 1008, '3400 mm along the fall', 1), T(x0 + 4, yb - 12, 'screed 12 mm at the waste', { cls: 'd-mute' }));
  body.push(...wrapT(40, 1050, 'The rise is the distance divided by the fall ratio. The model bathroom is about 3.4 m from the waste to its far corner, so its screed is about 57 mm higher there than at the waste.', 112, 16));
  return svg(900, 1090, body.join(''), 'Tile build-up, lippage limits and falls');
}

function jointsDwg() {
  const body = [R(0, 0, 900, 1090, 'd-bg')];
  body.push(T(40, 40, 'Movement joints, corners and the bathroom doorway', { cls: 'd-bold' }), T(40, 68, 'A  Plan of the model bathroom, 0.13 px per mm', { cls: 'd-bold' }));
  const BX0 = -5.2105, BX1 = -2.0945, BZ0 = 1.295, BZ1 = 5.4055, s = 130, X = (x) => 70 + (x - BX0) * s, Z = (z) => 110 + (z - BZ0) * s;
  body.push(R(X(BX0), Z(BZ0), (BX1 - BX0) * s, (BZ1 - BZ0) * s, 'd-wfloor'));
  for (let x = BX0 + 0.3; x < BX1; x += 0.303) body.push(L(X(x), Z(BZ0), X(x), Z(BZ1), 'd-dim'));
  for (let z = BZ0 + 0.3; z < BZ1; z += 0.303) body.push(L(X(BX0), Z(z), X(BX1), Z(z), 'd-dim'));
  const w = 5;
  body.push(L(X(BX0) - w, Z(BZ0) - w, X(BX1) + w, Z(BZ0) - w, 'd-wall'), L(X(BX0) - w, Z(BZ0) - w, X(BX0) - w, Z(BZ1) + w, 'd-wall'), L(X(BX0) - w, Z(BZ1) + w, X(BX1) + w, Z(BZ1) + w, 'd-wall'));
  body.push(L(X(BX1) + w, Z(BZ0) - w, X(BX1) + w, Z(3.17), 'd-wall'), L(X(BX1) + w, Z(4.03), X(BX1) + w, Z(BZ1) + w, 'd-wall'));
  body.push(R(X(BX0) - 9, Z(2.4), 8, 1.17 * s, 'd-glass'), R(X(BX1) - 3, Z(3.17), 10, 0.86 * s, 'd-ins2'));
  const perim = [[X(BX0), Z(BZ0), X(BX1), Z(BZ0)], [X(BX0), Z(BZ0), X(BX0), Z(BZ1)], [X(BX0), Z(BZ1), X(-2.43), Z(BZ1)], [X(BX1), Z(BZ0), X(BX1), Z(3.17)], [X(BX1), Z(4.03), X(BX1), Z(BZ1)]];
  for (const [a, b, c, d] of perim) body.push(L(a, b, c, d, 'd-s-m2'));
  body.push(Circ(X(-3.6), Z(2.4), 8, 'd-steel'));
  for (const [x, z] of [[BX0, BZ0], [BX1, BZ0], [BX0, BZ1]]) body.push(Circ(X(x) + (x === BX0 ? 6 : -6), Z(z) + (z === BZ0 ? 6 : -6), 5, 'd-dot'));
  body.push(call(7, X(BX0) + 6, Z(BZ0) + 6, X(BX0) + 46, Z(BZ0) - 16), call(8, X(-3.0), Z(BZ1), X(-3.0), Z(BZ1) + 44), T(X(-3.6) + 14, Z(2.4) + 4, 'waste', { cls: 'd-bold' }), T(X(BX1) + 20, Z(3.6) + 4, 'doorway strip', { cls: 'd-bold' }));
  body.push(dim(X(BX0), Z(BZ1) + 70, X(BX1), Z(BZ1) + 70, '3116 mm', 1), dim(X(BX0) - 40, Z(BZ0), X(BX0) - 40, Z(BZ1), '4111 mm', -1));
  keyList(body, 560, 130, [['7', 'Soft joints in the vertical corners (dots)'], ['8', 'Perimeter sealant (blue line) where the floor meets the walls']], 40, 40);
  body.push(...wrapT(560, 250, 'Numbers match the labels in the 3D detail room. The floor falls to the waste, and the tiles stop at a threshold strip in the doorway, not at grout.', 40, 16), ...wrapT(560, 330, 'Grout lines are drawn for the tile layout. The window is on the west wall and the bathroom door is a cased opening on the east wall.', 40, 16));
  // B: spacing rule
  body.push(T(40, 760, 'B  Where intermediate joints are needed, from the HIA article on AS 3958:2023 (40 px per m)', { cls: 'd-bold' }));
  const ax = 280, ay = 790;
  const rows = [['Internal floor: joints needed above', 9], ['Internal, in direct sunlight: above', 6], ['Joint spacing once needed', 4.5]];
  rows.forEach(([name, m], i) => { const y = ay + i * 34; body.push(T(40, y + 15, name, { cls: '' }), R(ax, y, m * 40, 22, 'd-timberx'), T(ax + m * 40 + 8, y + 15, `${m} m`, { cls: 'd-bold' })); });
  body.push(R(ax, ay + 108, 3.116 * 40, 12, 'd-tilef'), R(ax, ay + 126, 4.111 * 40, 12, 'd-tilef'), T(40, ay + 118, 'Model bathroom: width', { cls: '' }), T(40, ay + 136, 'Model bathroom: length', { cls: '' }), T(ax + 3.116 * 40 + 8, ay + 118, '3.1 m', { cls: 'd-bold' }), T(ax + 4.111 * 40 + 8, ay + 136, '4.1 m', { cls: 'd-bold' }));
  for (let m = 0; m <= 10; m += 2) body.push(L(ax + m * 40, ay + 150, ax + m * 40, ay + 156, 'd-dim'), T(ax + m * 40, ay + 170, String(m), { anchor: 'middle', cls: 'd-dimt' }));
  body.push(L(ax, ay + 150, ax + 400, ay + 150, 'd-dim'), T(ax + 200, ay + 190, 'metres', { anchor: 'middle', cls: 'd-mute' }));
  body.push(...wrapT(40, ay + 220, 'External floors take joints no more than 4.5 m apart in any dimension. Perimeter joints are generally at least 6 mm wide and are formed with sealant over backing material where waterproofing is required. The article says perimeter joints can be left out of areas under 10 square metres if the tiles sit at least 3 mm from the restraining surface. The model bathroom is about 12.8 square metres, so it has them. This applies the article to the model, so confirm against clause 5.4.7 of the Standard.', 112, 16));
  return svg(900, 1090, body.join(''), 'Movement joints, corners and the doorway');
}

function floorsDwg() {
  const body = [R(0, 0, 900, 1100, 'd-bg')];
  body.push(T(40, 40, 'Floor finishes, doorway strips and limits', { cls: 'd-bold' }), T(40, 68, 'A  Plan of the model house, 0.034 px per mm', { cls: 'd-bold' }));
  const s = 34, X = (x) => 50 + (x + 5.5) * s, Z = (z) => 90 + (z + 5.5) * s;
  const zone = (x0, x1, z0, z1, cls) => body.push(R(X(x0), Z(z0), (x1 - x0) * s, (z1 - z0) * s, cls));
  body.push(R(X(-5.5), Z(-5.5), 11 * s, 17 * s, 'd-wfloor'));
  zone(-5.2, 5.2, -5.2, -0.1, 'd-timber'); zone(-5.2, 5.2, 5.6, 11.2, 'd-timber'); zone(0.1, 5.2, 0.1, 5.4, 'd-ins2'); zone(-5.2, -0.1, 0.1, 1.1, 'd-tile'); zone(-1.9, -0.1, 1.12, 5.4, 'd-tile'); zone(-5.2105, -2.0945, 1.295, 5.4055, 'd-tilef');
  const walls = [[-5.5, -5.5, 5.5, -5.5], [5.5, -5.5, 5.5, 11.5], [5.5, 11.5, -5.5, 11.5], [-5.5, 11.5, -5.5, -5.5], [-5.5, 0, 5.5, 0], [-5.5, 5.5, 5.5, 5.5], [0, 0, 0, 5.5]];
  for (const [a, b, c, d] of walls) body.push(L(X(a), Z(b), X(c), Z(d), 'd-wall'));
  const strips = [[0, 2.7, 1], [2.5, 0, 2], [-2.2, 0, 3], [2.0, 5.5, 4]];
  for (const [x, z, n] of strips) body.push(Circ(X(x), Z(z), 7, 'd-dot'), `<text x="${X(x)}" y="${Z(z) + 4}" text-anchor="middle" class="d-num">${'abcd'[n - 1]}</text>`);
  body.push(T(X(0), Z(-2.7), 'timber boards', { anchor: 'middle', cls: 'd-bold' }), T(X(0), Z(8.4), 'timber boards', { anchor: 'middle', cls: 'd-bold' }), T(X(2.65), Z(2.8), 'carpet', { anchor: 'middle', cls: 'd-bold' }), T(X(-3.65), Z(3.4), 'bath tiles', { anchor: 'middle', cls: 'd-bold' }), T(X(-3.65), Z(0.65), 'laundry tiles', { anchor: 'middle', cls: 'd-bold' }), T(X(-1.0), Z(3.4), 'hall', { anchor: 'middle', cls: 'd-bold' }));
  body.push(dim(X(-5.5), Z(11.5) + 22, X(5.5), Z(11.5) + 22, '11 000 mm', 1));
  // legend and strip detail
  body.push(T(480, 110, 'Doorway strips', { cls: 'd-bold' }));
  keyList(body, 480, 136, [['a', 'Hall tile and carpet, at the east bedroom door'], ['b', 'Carpet and timber, at the east bedroom door to the north'], ['c', 'Laundry tile and timber, at the laundry door to the north'], ['d', 'Carpet and timber, at the east bedroom door to the front']], 46, 34);
  body.push(T(480, 310, 'B  Section at strip a, tile to carpet, not to scale', { cls: 'd-bold' }));
  const sy = 440;
  body.push(R(480, sy, 380, 36, 'd-conc'), R(480, sy - 14, 170, 14, 'd-adh'), R(480, sy - 26, 170, 12, 'd-tile'), R(650, sy - 26, 200, 8, 'd-box'), R(650, sy - 18, 200, 18, 'd-ins2'), R(740, sy - 6, 110, 6, 'd-timber'), R(644, sy - 30, 22, 8, 'd-steel'), R(850, sy - 40, 10, 40, 'd-board'));
  body.push(call(6, 560, sy - 20, 560, sy - 70), call(5, 655, sy - 26, 655, sy - 92), call(4, 760, sy - 12, 790, sy - 70), call(2, 790, sy - 3, 820, sy + 60));
  keyList(body, 480, 520, [['2', 'Underlay'], ['4', 'Carpet, stretched onto the gripper'], ['5', 'Strip fixed to the slab, covering both edges'], ['6', 'Hall tile on adhesive']], 46, 22);
  body.push(...wrapT(480, 620, 'Numbers match the labels in the carpet detail room.', 46, 16));
  // C: limits
  body.push(T(40, 760, 'C  Limits in the BPC Guide to Standards and Tolerances 2026 (advisory)', { cls: 'd-bold' }));
  keyList(body, 40, 788, [['15.2', 'Lippage over 0.5 mm between adjacent boards, at completion.'], ['15.3', 'Gaps over 2 mm between boards for more than 1 m, or over 5 mm in total across three gaps in four boards. Not heat or sun damage.'], ['15.4', 'Cupping over 1 mm per 100 mm, and tenting, buckling or crowning from swelling.'], ['15.5, 15.6', 'Nail popping and consistent squeaks within 24 months. Springy floors (15.7) have no time limit.'], ['15.8, 3.3', 'Level within 24 months: 10 mm in a room, 4 mm in 2 m, 20 mm across the footprint.'], ['15.9', 'Carpet and vinyl joins that peak, fray or misalign, visible within 12 months. Movement noise in a floating floor is within tolerance.']], 100, 46, 70);
  body.push(...wrapT(40, 1066, 'Applies to contracts entered into or work commenced from 1 August 2026. The guide has no clause on thresholds or transitions, so the strips are Typical.', 112, 14));
  return svg(900, 1100, body.join(''), 'Floor finishes, doorway strips and limits');
}

function orderDwg() {
  const body = [R(0, 0, 900, 960, 'd-bg')], blk = (x, y, w, h, lines) => { body.push(R(x, y, w, h, 'd-box', 6)); lines.forEach((t, i) => body.push(T(x + 12, y + 22 + i * 16, t, { cls: i ? 'd-mute' : 'd-bold' }))); };
  const A = 40, B = 450, W = 380;
  body.push(T(40, 40, 'Order of work and the time limits that follow', { cls: 'd-bold' }), T(A, 68, 'A  Tiling', { cls: 'd-bold' }), T(B, 68, 'B  Timber, carpet and handover', { cls: 'd-bold' }));
  blk(A, 84, W, 56, ['Delivery and check', 'Batch, shade, quantity, adhesive and grout']); blk(A, 160, W, 72, ['Check the substrate', 'Flat, falls to the waste, dry, firm', 'Membrane complete, cured and undamaged']);
  blk(A, 252, W, 56, ['Set out', 'Centre lines and a dry-laid row']); blk(A, 328, W, 56, ['Tile walls and floor', 'Walls first or floor first: Confirm with the tiler']);
  blk(A, 404, W, 72, ['Grout and seal', 'Clean the grout, then sealant in the corners', 'and around the floor edge']);
  for (const [y1, y2] of [[140, 160], [232, 252], [308, 328], [384, 404]]) body.push(arrow(A + W / 2, y1, A + W / 2, y2));
  blk(B, 84, W, 72, ['Boards acclimatised', 'Left in the house as the maker says', 'Slab moisture checked: Confirm']); blk(B, 176, W, 56, ['Timber boards and underlay', 'Gap at every wall, then skirting']);
  blk(B, 252, W, 56, ['Carpet over underlay and gripper', 'Strips at each change of floor']); blk(B, 328, W, 56, ['Inspect and list defects', 'Fix before the floors are covered']);
  blk(B, 404, W, 72, ['Protect and hand over', 'Sheets taped at the joints', 'Spare tiles and product records kept']);
  for (const [y1, y2] of [[156, 176], [232, 252], [308, 328], [384, 404]]) body.push(arrow(B + W / 2, y1, B + W / 2, y2));
  body.push(L(A + W, 440, 435, 440), L(435, 440, 435, 120), arrow(435, 120, B, 120));
  body.push(...wrapT(40, 500, 'The model lays timber and carpet before painting, as the stage plan does. On many jobs carpet and timber go last, after painting and the final fix, so confirm the order with the flooring contractor.', 112, 16));
  // C: time limits
  body.push(T(40, 580, 'C  When the BPC time limits run, from completion (30 px per month)', { cls: 'd-bold' }));
  const sx = 170, p = 30;
  body.push(L(sx, 760, sx + 24 * p, 760, 'd-dim'));
  for (const m of [0, 3, 6, 9, 12, 18, 24]) body.push(L(sx + m * p, 756, sx + m * p, 764, 'd-dim'), T(sx + m * p, 782, String(m), { anchor: 'middle', cls: 'd-dimt' }));
  body.push(T(sx + 12 * p, 804, 'months from completion', { anchor: 'middle', cls: 'd-mute' }));
  const bars = [['At completion', 0, 'Lippage, cracked tiles, gaps over 2 mm', 'd-gap'], ['3 months', 3, 'Door clearances 2 to 5 mm (11.4)', 'd-timber'], ['12 months', 12, 'Carpet and vinyl joins (15.9)', 'd-ins2'], ['24 months', 24, 'Loose grout, squeaks, nail popping, floor levels', 'd-conc']];
  bars.forEach(([name, m, text, cls], i) => { const y = 606 + i * 36; body.push(T(40, y + 16, name, { cls: 'd-bold' }), R(sx, y, Math.max(m * p, 4), 22, cls), T(m >= 24 ? sx + 8 : sx + Math.max(m * p, 4) + 8, y + 16, text, { cls: '' })); });
  body.push(...wrapT(40, 840, 'Limits with no time in the guide, such as lippage between tiles (14.6), cracked or loose tiles (14.3) and board gaps (15.3), are checked at completion. A defect can still be raised after handover, so record the condition on the day.', 112, 16));
  body.push(...wrapT(40, 896, 'Figures are from BPC sections 14, 15, 3.3 and 11.4, advisory, for contracts from 1 August 2026. Sections were re-read against the PDF.', 112, 16));
  return svg(900, 960, body.join(''), 'Order of work and the time limits');
}

export const drawings = [
  { id: 'order', title: 'Order of work and time limits', scale: 'Flow, with the time limits to scale', svg: orderDwg(),
    notes: ['Check the delivery, check the substrate, set out, tile, grout and seal. Timber and carpet follow, then inspection and protection.', 'Whether walls or floor are tiled first is the tiler\'s call and the membrane maker\'s system, so Confirm.', 'The model lays timber and carpet before painting. On many jobs they go last, so Confirm the order with the flooring contractor.', 'BPC time limits run from completion: 3 months for door clearances, 12 months for carpet joins and 24 months for loose grout, squeaks, nail popping and floor levels.'] },
  { id: 'tile', title: 'Tile build-up, lippage and falls', scale: 'Section not to scale, lippage at 100 px per mm, falls at 0.15 px per mm with the height drawn 8 times', svg: tileDwg(),
    notes: ['The tiler works over the screed and membrane from Step 10. A cut or uncured membrane is repaired by the waterproofer before any tile goes down.', 'Tiled surfaces are flat and true within 3 mm in 2 m, and the limit for a flat polished or honed tile with a 3 mm joint is 1.5 mm of lippage (14.5, Table 14.6).', 'The screed falls to the waste at between 1:80 and 1:50. Tiles that fall to a floor outlet are not outside the flatness limit for that reason (14.5).', 'Adhesive coverage, bed thickness and tile edition come from AS 3958 and the adhesive maker. The Standard was not opened, and its edition is unclear (Confirm).'] },
  { id: 'joints', title: 'Movement joints, corners and doorway', scale: 'Plan at 0.13 px per mm, rule chart at 40 px per m', svg: jointsDwg(),
    notes: ['Movement joints go immediately above structural movement joints and where stress is expected (14.7). Grout in a corner will crack (Typical).', 'The HIA article on AS 3958:2023 gives internal floor joints at no more than 4.5 m once a dimension passes 9 m, and 6 m in direct sunlight. The model bathroom is under both limits.', 'Perimeter joints are generally at least 6 mm wide and are sealed over backing material. At about 12.8 square metres the model bathroom is over the article\'s 10 square metre limit for leaving them out.', 'The model bathroom floor sits about 45 mm above the hall because the Step 10 slab is not recessed. A real house recesses it or ramps the doorway.'] },
  { id: 'floors', title: 'Floor finishes, strips and limits', scale: 'Plan at 0.034 px per mm', svg: floorsDwg(),
    notes: ['The model has tiles in the bathroom, laundry and hall, timber in the north and front bands and carpet in the east bedroom. The zones are illustrative.', 'The BPC guide gives limits on timber lippage (0.5 mm), gaps (2 mm over 1 m), cupping (1 mm per 100 mm), squeaks and levels, and on carpet joins (12 months).', 'The guide has no clause on thresholds or transitions between floor coverings, so the strips are Typical.', 'Doors may need trimming after the floors go down. The clearance under a door is not more than 20 mm after coverings are laid (11.4).'] },
];

/* ---------- steps ---------- */
export const howto = [
  ['Check the delivery and store the materials', 'Check tile type, size, batch or shade, quantity, adhesive, grout, boards, carpet and underlay against the order. Keep tiles, adhesive and grout dry and flat, and leave boards in the house for the time the maker says. Keep spare tiles from the same batch.', 'Builder and tiler', 'T'],
  ['Check the substrate', 'Check the slab and screed for flatness, falls to the waste, dryness and soundness. Check the waterproofer\'s membrane is complete, cured and undamaged, and check the Step 10 records. Have any cut or damaged membrane repaired by the waterproofer before tiling.', 'Builder, tiler and waterproofer', 'V', 'bpcWet'],
  ['Set out the tiles', 'Mark centre lines and dry-lay a row across the room so the cut tiles at the edges are not slivers. Set out so the layout follows the falls and lines up with the waste and the doorway, and mark where the movement joints and fixings through the membrane go.', 'Tiler', 'V', 'bpcTol26'],
  ['Tile the walls and the floor', 'Comb the adhesive with a notched trowel and bed each tile so its back is fully supported. Keep the joints even and in line within 4 mm in 2 m, keep the surface flat within 3 mm in 2 m, and keep lippage within Table 14.6. Stop the wall tiles short of the floor tiles so the sealant can move.', 'Tiler', 'V', 'bpcTol26'],
  ['Grout the joints', 'Fill the field joints so the grout is consistent, smooth and free of voids, pinholes and low spots, and clean the tiles. Leave the corners and movement joints free of grout.', 'Tiler', 'V', 'bpcTol26'],
  ['Seal the joints and fit the strip', 'Form the movement joints, vertical corners and floor perimeter with backing rod and flexible sealant installed to the maker\'s requirements, and fix a threshold strip in the doorway. Sealant with lumps, voids or debris visible from a normal viewing position is outside tolerance.', 'Tiler', 'V', 'bpcTol26'],
  ['Lay the timber boards', 'Fit the barrier and underlay the maker calls for, and lay the boards with a gap at every wall that the skirting hides. Keep lippage to 0.5 mm, gaps to 2 mm over 1 m, and fix the skirting to the wall, not the boards.', 'Flooring installer', 'V', 'bpcTol26'],
  ['Lay the carpet', 'Fix gripper rods round the edges, lay the underlay, then stretch the carpet onto the grippers following the maker\'s instructions. Keep seams out of the line of sight and fix a strip at each change of floor.', 'Flooring installer', 'V', 'bpcTol26'],
  ['Trim the doors', 'Check the clearance under each door after the coverings are down. It must be not more than 20 mm and the leaf must still have 2 to 5 mm gaps and not bind.', 'Carpenter', 'V', 'bpcTol26'],
  ['Inspect and list defects', 'Run a straightedge and a low light over the tiles, flood the wet floor to check the falls, look along the boards and the carpet seams from 1.5 m or more, walk the floors for squeaks and spring, and keep a defect list with photographs.', 'Builder', 'V', 'bpcTol26'],
  ['Protect the floors and file the records', 'Cover the timber and carpet with sheets taped at the joints, and keep loads off new tile until the adhesive and grout have cured as the makers say. File product names, grout colour code, spare tiles, care instructions and photographs for handover.', 'Builder', 'T'],
];

export const trades = [
  { t: 'Tiler', role: 'Prepares the substrate surface, sets out, lays and grouts wall and floor tiles and forms the sealed joints.', when: 'After the waterproofing membrane is cured and checked, before painting', reg: 'Tiling is covered by the contract and by AS 3958 (BPC 14.2). Check any trade licence rules before engaging someone directly. Not checked here.', ask: ['Set-out drawing with the cuts, the joint width and the movement joints', 'Adhesive and grout products that suit the membrane system', 'Who repairs the membrane if it is cut, and who flood tests the floor'] },
  { t: 'Flooring installer', role: 'Lays timber boards, carpet, underlay and the strips at doorways.', when: 'After wet trades and plastering, and before or after painting depending on the job', reg: 'Installation follows the maker\'s requirements and the NCC (BPC 15.1, 15.9). Registration rules were not checked.', ask: ['Moisture limit and test the maker requires on the slab', 'Gap at the walls and the underlay or barrier', 'Whether sanding and coating, or carpet, go after painting'] },
  { t: 'Waterproofer', role: 'Applies and cures the membrane, and repairs it if the tiler damages it. A hold point before tiling.', when: 'Before tiling, with the membrane record kept', reg: 'Wet-area waterproofing is a Step 10 hold point. Not rechecked here.', ask: ['Cure time before tiling', 'Repair method and who pays if it is cut', 'The system data sheet for the adhesive and grout'] },
  { t: 'Floor preparation contractor', role: 'Grinds, patches or levels a slab so it is flat and sound before the coverings go on.', when: 'Before the floor coverings, if the slab is out', reg: 'Slab levels are checked at 10 mm in a room, 4 mm in 2 m and 20 mm overall (BPC 3.3). Not checked further.', ask: ['Flatness reading before and after', 'Primer and levelling product that suit the covering', 'Moisture reading and the method'] },
  { t: 'Carpenter', role: 'Trims doors after the floor coverings go down, and fixes the skirting.', when: 'After the coverings, before painting', reg: 'The floor gap under a door is not more than 20 mm after coverings are laid (BPC 11.4).', ask: ['Door trimming after the floor height is known', 'Skirting fixed to the wall, not the boards', 'Gaps over 2 mm in the skirting fixed before paint'] },
  { t: 'Painter and cleaner', role: 'Paint the walls and trims and clean the floors at the end, with the floors protected.', when: 'After the floors are protected, in Step 15 and Step 18', reg: 'Not checked.', ask: ['Who removes the protection sheets', 'Cleaner approved for the tile, grout and timber finish', 'Touch-up of sealant and grout after painting'] },
];

export const materials = [
  ['Floor and wall tiles', 'Ceramic, porcelain or stone tiles in common sizes such as 300 by 300 or 300 by 600 mm, with a slip rating that suits the area', 'Tile retailers and trade tile suppliers (confirm stock and batch)', 'T', 'Slip ratings are a project requirement: no bathroom floor rating was found on the pages read.'],
  ['Tile adhesive', 'Cement-based adhesive in a class that suits the tile and the substrate, with a flexible additive for some systems', 'Hardware stores such as Bunnings and trade tile suppliers', 'T', 'Use the system the membrane maker lists. Coverage and trowel size come from AS 3958.'],
  ['Grout', 'Cement-based or epoxy grout in a colour that matches the design', 'Hardware stores and trade tile suppliers', 'T', 'Joint width sets the lippage limit (Table 14.6).'],
  ['Flexible sealant and backing rod', 'Flexible sealant in a matching colour, and closed-cell backing rod', 'Hardware stores and trade suppliers', 'V', 'Flexible sealants are installed to the maker\'s requirements (BPC 14.4). The HIA article names no sealant type.'],
  ['Threshold and transition strips', 'Aluminium, brass or stainless strips for each change of floor', 'Hardware stores and flooring suppliers', 'T', 'The BPC guide has no clause on thresholds or transitions.'],
  ['Floor levelling compound and primer', 'Cement-based levelling compound and a primer that suits the slab and the covering', 'Hardware stores and trade suppliers', 'T', 'Follow the maker for the thickness and the cure time.'],
  ['Timber flooring', 'Solid tongue and groove boards or engineered boards in common widths and thicknesses', 'Timber flooring suppliers and hardware stores', 'V', 'Sawn and milled hardwood flooring must conform to AS 2796.1 (BPC 15.1). The Standard was not opened.'],
  ['Underlay and moisture barrier', 'Foam or rubber underlay, and a plastic moisture barrier where the maker calls for one', 'Flooring suppliers and hardware stores', 'T', 'Whether a barrier is needed is the floor maker\'s instruction.'],
  ['Carpet and gripper rods', 'Carpet in rolls, timber gripper rods with pins, and carpet underlay', 'Carpet retailers and flooring suppliers', 'T', 'Installed to the maker\'s instructions (BPC 15.9).'],
  ['Protection sheets and tape', 'Hardboard or heavy cardboard sheets and low-tack tape', 'Hardware stores and trade suppliers', 'T', 'Keeps the painter and the final fix from marking the floors.'],
];

export const quotes = [
  { who: 'Tiler', n: '3', what: ['Tile supply or labour only, and the allowance for cuts and breakage', 'Set-out drawing, joint width and movement joints', 'Adhesive, grout and sealant products and the membrane system they suit'] },
  { who: 'Flooring installer (timber and carpet)', n: '3', what: ['Measure and supply, with the underlay and the strips', 'Moisture test and the limit the maker requires', 'Sanding and coating, or carpet, and where they fall in the programme'] },
  { who: 'Floor preparation contractor', n: '2', what: ['Flatness reading and a price per square metre', 'Levelling compound and primer', 'Moisture reading and a record'] },
  { who: 'Tile supplier', n: '2', what: ['Batch and shade number on the delivery, and a spare box from the same batch', 'Slip rating for the bathroom floor', 'Lead time and returns'] },
];

export const quoteTips = [
  'Ask the tiler to write the tile size, the joint width and the movement joints on the quote. "Tiling" hides a lot of items.',
  'Ask for the tile batch and shade number on the delivery, and keep a spare box from the same batch for repairs.',
  'Ask the flooring installer which moisture test and limit the maker requires for the slab, and who pays if the slab is too wet.',
  'Put the order of work in writing: membrane cured, tiles, grout and sealant, then boards and carpet, then the painter.',
  'Put a callback period in writing. The BPC limits run 3, 12 and 24 months, so agree who returns and when.',
  'Ask who removes the protection sheets, and who repairs the floors if the painter or another trade damages them.',
];

export const inspections = [
  ['Delivery check', 'Builder and tiler', 'On delivery', 'Tile type, size, batch or shade, quantity, adhesive and grout match the order. Everything is stored dry and flat, and spare tiles are kept from the same batch.', 'T'],
  ['Substrate check', 'Builder, tiler and waterproofer', 'Before tiling', 'Slab and screed are flat, firm, clean and dry, the screed falls to the waste, and the membrane is complete, cured and undamaged. Slab levels are within 10 mm in a room, 4 mm in 2 m and 20 mm overall (3.3).', 'V', 'bpcTol26'],
  ['Slab moisture check', 'Flooring installer', 'Before timber, carpet or resilient coverings', 'The moisture reading is within the limit the floor maker requires. The limit and the test method are the maker\'s and the Standard\'s, which were not opened.', 'C', 'wagnerRh'],
  ['Set-out check', 'Builder and tiler', 'Before the adhesive is spread', 'Centre lines are marked, the dry row shows cut tiles of at least half a tile at the edges, and the joints suit the waste, the doorway and the movement joints.', 'T'],
  ['Tile flatness and lippage check', 'Builder and tiler', 'After the tiles are laid', 'The surface is flat and true within 3 mm in 2 m, and lippage is within Table 14.6. For a flat polished or honed tile with a 3 mm joint the limit is 1.5 mm.', 'V', 'bpcTol26'],
  ['Cracked and loose tile check', 'Builder', 'At completion', 'No tile is cracked, pitted, chipped, scratched or loose. Tap the tiles and listen for hollow sounds, though the guide has no clause on hollow tiles.', 'V', 'bpcTol26'],
  ['Falls and water retention check', 'Builder', 'After tiling, before protection', 'Water poured on the floor drains to the waste. Water retained after draining, other than surface-tension water, is outside tolerance.', 'V', 'bpcTol26'],
  ['Grout and joint check', 'Builder and tiler', 'After grouting', 'Grout is consistent, smooth and free of voids and pinholes. Joints are within 4 mm in 2 m of the specified alignment and of consistent width.', 'V', 'bpcTol26'],
  ['Sealant and movement joint check', 'Builder and tiler', 'After sealing', 'Movement joints are over structural movement joints, corners and the floor perimeter are sealed with flexible sealant installed to the maker\'s requirements, and the sealant has no lumps, voids or debris.', 'V', 'bpcTol26'],
  ['Shower and screen check', 'Builder', 'At completion', 'No visible scratches, cracks or leaks in the shower base, screen or glass from a normal viewing position.', 'V', 'bpcTol26'],
  ['Timber floor check', 'Builder and flooring installer', 'After the boards are laid', 'Lippage is not over 0.5 mm, gaps are not over 2 mm for more than 1 m, cupping is not over 1 mm per 100 mm, there is no tenting, buckling or crowning, and there are no blemishes caused by building work.', 'V', 'bpcTol26'],
  ['Squeak, spring and level check', 'Builder', 'At completion, and again within 24 months', 'No consistent squeaks, no noticeably springy floor, and level within 10 mm in a room, 4 mm in 2 m and 20 mm overall.', 'V', 'bpcTol26'],
  ['Carpet check', 'Builder and flooring installer', 'After laying, and within 12 months', 'Seams do not peak, fray or misalign when viewed from a normal viewing position, and the installation follows the maker\'s instructions.', 'V', 'bpcTol26'],
  ['Door clearance check', 'Builder and carpenter', 'After the coverings, and within 3 months', 'The clearance under each door is not more than 20 mm, and the leaf gaps are 2 to 5 mm and even.', 'V', 'bpcTol26'],
  ['Slip resistance check', 'Builder and surveyor', 'Before tiles are ordered', 'The tile has the slip rating the project requires. No bathroom floor rating was found on the NCC pages read.', 'C', 'nccHp112'],
  ['Surveyor\'s view', 'Builder and building surveyor', 'Before the final inspection', 'Ask the surveyor whether they want to see the tiling, the sealed joints or the strips. Floor coverings are not a named inspection stage.', 'T'],
];

export const exam = [
  ['What Standard must tiling conform to under the BPC guide?', 'AS 3958, which covers the installation of ceramic and stone tiles. The guide does not give the edition, and the Standard was not opened.', 'V', 'bpcTol26'],
  ['Are tiles that fall to a floor outlet outside the flatness limit?', 'No. Tiled surfaces must be flat and true within 3 mm in 2 m, but tiles required to fall and drain to a floor outlet are not outside tolerance for that reason (14.5).', 'V', 'bpcTol26'],
  ['How much lippage is allowed between two flat polished or honed tiles with a 3 mm joint?', '1.5 mm. The limit is 1.0 mm for a joint of 1.5 to 2.9 mm, 1.5 mm for 3.0 to 6.0 mm and 2.0 mm for a joint over 6.0 mm (Table 14.6).', 'V', 'bpcTol26'],
  ['What lippage is allowed for smooth tiles with a regular edge, or highly profiled tiles of consistent surface?', '2.0 mm at any joint width.', 'V', 'bpcTol26'],
  ['How much can joint alignment vary?', 'Within 4 mm in 2 m of the specified joint alignment, and as far as practicable of consistent width (14.4).', 'V', 'bpcTol26'],
  ['When are tiles outside tolerance for cracks, chips or looseness?', 'If they are cracked, pitted, chipped, scratched or loose at completion (14.3).', 'V', 'bpcTol26'],
  ['What does the BPC guide say about grout?', 'It must be consistent, smooth and evenly finished, free of voids, pinholes and low spots, and grout that becomes loose within 24 months is outside tolerance (14.4).', 'V', 'bpcTol26'],
  ['What does the BPC guide say about junction sealants?', 'Flexible or waterproof sealants must be installed to the maker\'s requirements, and lumps, voids, debris or surface imperfections visible at completion are outside tolerance (14.4).', 'V', 'bpcTol26'],
  ['Where must movement joints go in a tiled floor?', 'Immediately above structural movement joints and at locations where stress might be expected (14.7).', 'V', 'bpcTol26'],
  ['What water retention is allowed on a wet-area tiled floor?', 'None after draining, except residual water held by surface tension. Textured tiles that hold water by surface tension are not outside tolerance (14.1).', 'V', 'bpcTol26'],
  ['What shower defects does the BPC guide treat as outside tolerance?', 'Scratches, cracks or leaks in shower bases, screens and glass that are visible from a normal viewing position at completion. Leaks from a semi-frameless or frameless screen that is not meant to contain water are not outside tolerance (14.1).', 'V', 'bpcTol26'],
  ['What fall must a wet-area floor have to the waste?', 'Between 1:80 and 1:50 (clause 10.2.12 in the BPC summary of NCC 2022).', 'V', 'bpcWet'],
  ['How far up must shower walls be waterproofed?', 'Not less than 1800 mm above the floor substrate (Part 10.2). The model tiles to 2.1 m, which is a design choice.', 'V', 'nccHp102'],
  ['How must a floor waste suit the tiling?', 'It must suit the tile and tile bed thickness, and the membrane stops at or in the drainage flange.', 'V', 'nccHp102'],
  ['How wide are movement joints generally, and what goes in them?', 'Generally not narrower than 6 mm, formed with sealant and backing material where waterproofing is required. The article names no sealant type.', 'V', 'hiaTileJoints'],
  ['When are intermediate movement joints needed in an internal tiled floor?', 'Where any dimension is over 9 m, at no more than 4.5 m apart. In direct sunlight the figure is a dimension over 6 m. External floors take 4.5 m spacing in any dimension (HIA article on AS 3958:2023).', 'V', 'hiaTileJoints'],
  ['When can perimeter joints be left out of a tiled floor?', 'The HIA article says areas under 10 square metres, if the tiles sit at least 3 mm from the restraining surface. Confirm against clause 5.4.7 of the Standard.', 'C', 'hiaTileJoints'],
  ['Which edition of AS 3958 applies?', 'Not confirmed. The BPC guide cites AS 3958, the HIA summary page is for AS 3958.1-2007 and the HIA article of 3 April 2025 refers to AS 3958:2023.', 'C', 'hiaTileJoints'],
  ['What slip rating does a bathroom floor need?', 'Not confirmed. The NCC Part 11.2 page gives slip ratings for stairs only, so check the project requirement and the tile\'s rating.', 'C', 'nccHp112'],
  ['What lippage between adjacent floorboards is outside tolerance?', 'More than 0.5 mm at completion (15.2).', 'V', 'bpcTol26'],
  ['What gaps in timber flooring are outside tolerance?', 'More than 2 mm between adjacent boards for more than 1 m, or more than 5 mm in total across three gaps between four boards, except where sun, cooling or heating appliances caused them (15.3).', 'V', 'bpcTol26'],
  ['How much cupping is outside tolerance?', 'More than 1 mm per 100 mm. Swelling that causes tenting, buckling or crowning visible at completion is also outside tolerance (15.4).', 'V', 'bpcTol26'],
  ['How long do the nail popping and squeak limits run?', '24 months from completion for nail heads or popping (15.5) and for consistent squeaks, including on stairs (15.6). Springy floors (15.7) have no time limit.', 'V', 'bpcTol26'],
  ['How much can a floor vary in level?', 'Within 24 months, no more than 10 mm in any room or area, 4 mm in any 2 m length, and 20 mm across the entire footprint (15.8). A slab-on-ground has the same limits (3.3).', 'V', 'bpcTol26'],
  ['What Standard must sawn and milled hardwood flooring conform to?', 'AS 2796.1 (BPC 15.1). The Standard was not opened.', 'V', 'bpcTol26'],
  ['What does the BPC guide say about carpet and vinyl joins?', 'Joins that peak, fray or misalign and are visible from a normal viewing position within 12 months of completion are outside tolerance (15.9).', 'V', 'bpcTol26'],
  ['Is movement noise from a floating floor a defect?', 'No. The guide says movement noises are an inherent characteristic of floating floors and are within tolerance if the floor is installed to the maker\'s requirements (15.9).', 'V', 'bpcTol26'],
  ['How much clearance may there be under an internal door after the floor coverings are laid?', 'Not more than 20 mm, and leaf clearances of 2 to 5 mm and uniform, checked within 3 months (11.4).', 'V', 'bpcTol26'],
  ['What does the BPC guide say about thresholds and transitions between floor coverings?', 'Nothing was found in the sections read, so strips and their height are Typical.', 'C', 'bpcTol26'],
  ['What is a normal viewing position in the BPC guide?', '1.5 m or more away in diffused, non-critical light, with 600 mm for appliances and fixtures and 3 m for glass.', 'V', 'bpcTol26'],
  ['What moisture limit applies to a slab under tile, timber or carpet?', 'Not confirmed. The maker and the Standard set it. A Western Australian Government guideline sets relative humidity below 90 per cent for resilient coverings on its own projects, which is not a Victorian rule and excludes tile, timber and carpet.', 'C', 'waTg002'],
  ['When does the BPC guide apply?', 'To contracts entered into or work commenced from 1 August 2026. It is advisory, and manufacturer instructions and legislation take precedence.', 'V', 'bpcTol26'],
];

export const sources = ['bpcTol26', 'hiaTileJoints', 'hiaTileGuide', 'nccHp102', 'nccHp112', 'bpcWet', 'nccbWet', 'waTg002', 'wagnerRh'];
export const caution = 'The tiling and floor-covering limits come from the BPC Guide to Standards and Tolerances 2026 (sections 14, 15, 3.3 and 11.4), which is advisory and applies from 1 August 2026; these sections were re-read against the PDF, but the last part of the PDF was not returned when fetched. The guide has no clause on hollow tiles, thresholds, carpet ripples, edges, adhesion or timber finish. AS 3958 (edition unclear: the BPC guide cites AS 3958, the HIA summary page is for AS 3958.1-2007 and the HIA article of 3 April 2025 refers to AS 3958:2023), AS 1884, AS 2455.1, AS 2796.1 and AS 4586 were not opened. The HIA joints article is a summary and names no sealant. The NCC Part 11.2 page gives slip ratings for stairs only, so no bathroom floor rating was found. The Western Australian TG002 is WA-only and covers resilient coverings only, and the Wagner page is a vendor page. Adhesive coverage, curing times and slab moisture limits are Typical or Confirm. The model bathroom floor sits about 45 mm above the hall because the slab is not recessed, the room zones, tile sizes and layer thicknesses are illustrative, and the zoom rooms draw layers thicker than real. The sealant beads are drawn blue and thicker than real so they can be seen. The model lays timber and carpet before painting, which many jobs do last: confirm the order.';

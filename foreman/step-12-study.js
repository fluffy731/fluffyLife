// Step 12 study content: drawings, steps, trades, materials, quotes, inspections and exam cards for internal linings.
// Flags: V = Verified against a source named in SOURCES, T = Typical practice, C = Confirm. AS/NZS 2589, 2588 and 2753 were not opened (paywalled). The ABCB 9.2 page is a fragment with no distances or FRL values,
// the 9.3 page shows no edition, and the 9.4 and 10.7 pages carry 2019 cross-references. The Knauf manual is a manufacturer document, undated, and was read to about 100,000 of its 138,544 characters.
import { svg, T, L, R, C as Circ, P, dim, call, arrow } from './dwg.js';

const wrapT = (x, y, text, n, dy = 18, cls = 'd-mute') => { const out = []; let cur = ''; for (const w of text.split(' ')) { if ((cur + ' ' + w).trim().length > n) { out.push(cur); cur = w; } else cur = (cur + ' ' + w).trim(); } if (cur) out.push(cur); return out.map((t, i) => T(x, y + i * dy, t, { cls })); };
const keyList = (body, x, y, items, n, step) => items.forEach(([k, t], i) => { body.push(T(x, y + i * step, k, { cls: 'd-bold' }), ...wrapT(x + 20, y + i * step, t, n, 16, '')); });

/* ---------- drawings ---------- */
function orderDwg() {
  const body = [R(0, 0, 900, 900, 'd-bg')], blk = (x, y, w, h, lines) => { body.push(R(x, y, w, h, 'd-box', 6)); lines.forEach((t, i) => body.push(T(x + 12, y + 22 + i * 16, t, { cls: i ? 'd-mute' : 'd-bold' }))); };
  const A = 40, B = 450, W = 380;
  body.push(T(40, 40, 'Order of work from frame to paint', { cls: 'd-bold' }), T(A, 68, 'A  Before the walls are lined', { cls: 'd-bold' }), T(B, 68, 'B  Lining, finishing and checking', { cls: 'd-bold' }));
  blk(A, 84, W, 56, ['Frame check', 'Plumb, straight, dry. Blocking for heavy fittings']); blk(A, 160, W, 56, ['Services and insulation signed off', 'Steps 8 to 11. Hidden once the sheets go on']);
  blk(A, 236, W, 56, ['Ceiling sheets', 'Across the framing, butt joints back-blocked']); blk(A, 312, W, 72, ['Wall sheets', 'Horizontal rows with staggered butt joints', 'Fitted tight up under the ceiling']);
  for (const [y1, y2] of [[140, 160], [216, 236], [292, 312]]) body.push(arrow(A + W / 2, y1, A + W / 2, y2));
  blk(B, 84, W, 72, ['Wet areas', 'Board fixed with screws, no stud adhesive', 'Order with the waterproofer: Confirm']); blk(B, 176, W, 56, ['Fire and sound details photographed', 'Before a second layer covers them']);
  blk(B, 252, W, 56, ['Tape, set and cornice', 'Level 4 unless the plans say otherwise']); blk(B, 328, W, 56, ['Inspect in side light', 'Fix defects before the painter starts']);
  for (const [y1, y2] of [[156, 176], [232, 252], [308, 328]]) body.push(arrow(B + W / 2, y1, B + W / 2, y2));
  body.push(L(A + W, 348, 435, 348), L(435, 348, 435, 120), arrow(435, 120, B, 120));
  // C: the payment limits, 7 px per cent
  body.push(T(40, 440, 'C  Payment limits for the stages, drawn to scale (7 px per cent of the price)', { cls: 'd-bold' }));
  const sx = 60, p = 7, seg = (x, pc, cls) => R(x, 0, pc * p, 26, cls);
  const bar = (y, label, segs, rest) => {
    body.push(T(sx, y, label, { cls: 'd-mute' })); let x = sx;
    for (const [name, pc, cls] of segs) { body.push(`<g transform="translate(0,${y + 28})">${seg(x, pc, cls)}</g>`, T(x + (pc * p) / 2, y + 22, `${name} ${pc}`, { anchor: 'middle', cls: 'd-bold' })); x += pc * p; }
    if (rest) body.push(`<rect x="${x}" y="${y + 28}" width="${rest[0] * p}" height="26" class="d-cut" fill="none" stroke-dasharray="5 4"/>`, T(x + (rest[0] * p) / 2, y + 46, rest[1], { anchor: 'middle', cls: 'd-mute' }));
  };
  bar(476, 'A contract covering all stages (85 per cent in total)', [['Base', 10, 'd-conc'], ['Frame', 15, 'd-timber'], ['Lock-up', 35, 'd-brick'], ['Fixing', 25, 'd-board']], [15, 'not read']);
  bar(566, 'A contract to build to fixing', [['Base', 12, 'd-conc'], ['Frame', 18, 'd-timber'], ['Lock-up', 40, 'd-brick']], [30, 'fixing: not read']);
  body.push(L(sx, 660, sx + 100 * p, 660, 'd-dim'));
  for (let i = 0; i <= 10; i++) body.push(L(sx + i * 10 * p, 656, sx + i * 10 * p, 664, 'd-dim'), T(sx + i * 10 * p, 680, String(i * 10), { anchor: 'middle', cls: 'd-dimt' }));
  body.push(T(sx + 50 * p, 700, 'per cent of the contract price', { anchor: 'middle', cls: 'd-mute' }));
  body.push(...wrapT(40, 740, 'The fixing stage is reached when all internal cladding, architraves, skirting, doors and built-in shelves are fitted and fixed, plus baths, basins, troughs, sinks, cabinets and cupboards. Plasterboard on its own is not the fixing stage.', 112, 18));
  body.push(...wrapT(40, 806, 'Percentages are from the CAV payments page, last updated 9 July 2025. The Domestic Building Contracts Amendment Bill 2025 passed on 11 September 2025, so check the current page. The dashed boxes are figures this page read did not give.', 112, 18));
  return svg(900, 900, body.join(''), 'Order of work and payment stages');
}

function fixDwg() {
  const body = [R(0, 0, 900, 1110, 'd-bg')], s = 0.15, x0 = 70, y0 = 110, WW = 3600 * s, HH = 2700 * s;
  body.push(T(40, 40, 'Where the screws go, to scale', { cls: 'd-bold' }), T(40, 66, 'A  Wall elevation, 3.6 m by 2.7 m, 0.15 px per mm', { cls: 'd-bold' }));
  const px = (u) => x0 + u * s, py = (y) => y0 + HH - y * s;
  const r0 = [[0, 2400], [2400, 3600]], r1 = [[0, 1200], [1200, 3600]];
  for (const [a, b] of r0) body.push(R(px(a), py(1350), (b - a) * s, 1350 * s, 'd-board'));
  for (const [a, b] of r1) body.push(R(px(a), py(2700), (b - a) * s, 1350 * s, 'd-board'));
  for (let u = 0; u <= 3600; u += 600) for (let y = 0; y <= 2700;) {
    const d = (u === 2400 && y < 1350) || (u === 1200 && y >= 1350) ? 200 : 300, ym = Math.min(Math.max(y, 25), 2675);
    body.push(Circ(px(Math.min(Math.max(u, 15), 3585)), py(ym), 1.8, 'd-dot')); y += d;
  }
  body.push(dim(x0, y0 + HH + 12, x0 + WW, y0 + HH + 12, '3600 mm', 1), dim(px(1200), y0 - 14, px(2400), y0 - 14, '1200 mm stagger', 1));
  body.push(call(1, px(1200), py(2000), px(1200) - 26, py(2000) - 30), call(2, px(2400), py(500), px(2400) + 26, py(500) + 34), call(3, px(3000), py(1350), px(3000) + 30, py(1350) - 30), call(4, px(600), py(700), px(600) - 20, py(700) + 40));
  keyList(body, 640, 130, [['1', 'Row 2 butt joint (1200 mm). It sits on a different stud from row 1'], ['2', 'Row 1 butt joint (2400 mm). Screws at 200 mm where a joint meets a stud, 300 mm elsewhere'], ['3', 'The joint between the two 1350 mm rows'], ['4', 'Studs at 600 mm centres, shown as the dotted lines of screws']], 28, 82);
  body.push(...wrapT(640, 470, 'Vertical joints stay at least 200 mm from the edges of openings. Fasteners go 10 to 16 mm from sheet edges.', 28, 16));
  // B: ceiling plan
  const cy0 = 650, cs = 0.15, cx = (u) => x0 + u * cs, cyy = (v) => cy0 + v * cs;
  body.push(T(40, 618, 'B  Ceiling plan, 3.6 m by 2.4 m, 0.15 px per mm', { cls: 'd-bold' }));
  for (const [a, b] of [[0, 2100], [2100, 3600]]) body.push(R(cx(a), cyy(0), (b - a) * cs, 1200 * cs, 'd-board'));
  for (const [a, b] of [[0, 900], [900, 3600]]) body.push(R(cx(a), cyy(1200), (b - a) * cs, 1200 * cs, 'd-board'));
  for (let u = 0; u <= 3600; u += 600) { body.push(L(cx(u), cyy(0), cx(u), cyy(2400), 'd-dim')); for (let v = 150; v < 2400; v += 300) body.push(Circ(cx(Math.min(Math.max(u, 15), 3585)), cyy(v), 1.8, 'd-dot')); }
  for (const [j, v] of [[2100, 250], [2100, 950], [900, 1450], [900, 2150]]) body.push(`<rect x="${cx(j - 250)}" y="${cyy(v)}" width="${500 * cs}" height="${200 * cs}" class="d-conc" fill-opacity=".7"/>`);
  for (let u = 0; u <= 3600; u += 300) body.push(Circ(cx(Math.min(Math.max(u, 15), 3585)), cyy(2380), 1.8, 'd-dot'));
  body.push(dim(x0, cyy(2400) + 12, x0 + WW, cyy(2400) + 12, '3600 mm', 1), call(5, cx(1800), cyy(600), cx(1800) - 30, cyy(600) - 22), call(6, cx(2100), cyy(950), cx(2100) + 26, cyy(950) + 30), call(7, cx(600), cyy(1650), cx(600) - 26, cyy(1650) + 26), call(8, cx(3000), cyy(2380), cx(3000) + 30, cyy(2380) - 30));
  keyList(body, 640, 660, [['5', 'Chords at 600 mm centres. The truss layout sets the real spacing'], ['6', 'Butt joints fall between the chords and are back-blocked (the blocks are shaded)'], ['7', 'Screws at 300 mm across the width of the sheet'], ['8', 'At the perimeter: 300 mm for cornices, 150 mm for square set']], 28, 82);
  body.push(...wrapT(40, 1086, 'Spacings are from the Knauf installation manual, a manufacturer document. AS/NZS 2589 was not opened.', 112, 16));
  return svg(900, 1110, body.join(''), 'Wall and ceiling fixing patterns');
}

function sepDwg() {
  const body = [R(0, 0, 900, 1200, 'd-bg')], s = 0.9, x0 = 70, y0 = 140, run = 700 * s;
  body.push(T(40, 40, 'Framed separating wall, plan section', { cls: 'd-bold' }), T(40, 66, 'A  Layers across the wall, 0.9 px per mm, run of 700 mm', { cls: 'd-bold' }));
  const L2a = 13, L1a = 13, ST = 90, GAP = 20, W2 = [['l2a', L2a, 'd-board'], ['l1a', L1a, 'd-board'], ['stA', ST, 'ins'], ['gap', GAP, 'd-cav'], ['stB', ST, 'cav'], ['l1b', L1a, 'd-board'], ['l2b', L2a, 'd-board']];
  let x = x0; const at = {};
  for (const [id, mm, cls] of W2) { at[id] = [x, mm * s]; if (cls === 'ins') body.push(R(x, y0, mm * s, run, 'd-ins')); else if (cls === 'cav') body.push(`<rect x="${x}" y="${y0}" width="${mm * s}" height="${run}" class="d-cav"/>`); else body.push(R(x, y0, mm * s, run, cls)); x += mm * s; }
  for (const k of ['stA', 'stB']) for (const mm of [50, 650]) body.push(R(at[k][0], y0 + (mm - 17.5) * s, at[k][1], 35 * s, 'd-timber'));
  for (const [k, mm] of [['l1a', 250], ['l2a', 450], ['l1b', 250], ['l2b', 450]]) body.push(R(at[k][0], y0 + mm * s - 1.5, at[k][1], 3, 'd-bg'));
  const pipeY = y0 + 480 * s; body.push(Circ(at.stA[0] + at.stA[1] / 2, pipeY, 6, 'd-e-sw'));
  const tot = at.l2b[0] + at.l2b[1] - x0;
  body.push(dim(x0, y0 + run + 14, x0 + tot, y0 + run + 14, '252 mm', 1), dim(at.gap[0], y0 - 14, at.gap[0] + at.gap[1], y0 - 14, '20 mm min', 1));
  body.push(T(x0, y0 - 34, 'LEAF A', { cls: 'd-mute' }), T(at.l2b[0], y0 - 34, 'LEAF B', { cls: 'd-mute' }));
  body.push(call(1, at.l2a[0] + 6, y0 + 140, at.l2a[0] - 24, y0 + 140), call(2, at.stA[0] + 40, y0 + 330, at.stA[0] + 160, y0 + 330), call(3, at.gap[0] + 9, y0 + 560, at.gap[0] + 70, y0 + 575), call(4, at.stB[0] + 40, y0 + 170, at.stB[0] + 160, y0 + 170), call(5, at.stA[0] + 40, pipeY, at.stA[0] + 160, pipeY));
  keyList(body, 380, 180, [['1', 'Two layers of 13 mm board on each outer face. Layer 2 joints do not line up with layer 1, and all joints are taped and filled solid'], ['2', 'Leaf A: 90 by 35 studs at 600 mm centres with insulation (the pages read do not say which leaf)'], ['3', 'Air gap of at least 20 mm. Noggings must not bridge studs that support different leaves'], ['4', 'Leaf B: its own row of studs, caulked at the perimeter'], ['5', 'A water pipe serving one dwelling stays in its own leaf, at least 10 mm from the other']], 62, 92);
  body.push(...wrapT(380, 680, 'Drawn from the NCC Part 10.7.8 text: 90 by 35 timber (or 64 mm steel) at 600 mm centres, gap of at least 20 mm, insulation and two layers of 13 mm fire-protective grade plasterboard. The layer arrangement is Confirm.', 62, 16));
  // B: outlets, elevation at 0.4 px per mm
  const e = 0.4, ex = 70, ey = 860;
  body.push(T(40, 830, 'B  Outlets on opposite faces, elevation at 0.4 px per mm', { cls: 'd-bold' }), R(ex, ey, 1200 * e, 700 * e, 'd-board'));
  body.push(R(ex + 300 * e - 14, ey + 280 * e, 28, 28, 'd-e-keep'), `<rect x="${ex + 600 * e - 14}" y="${ey + 280 * e}" width="28" height="28" class="d-cut" fill="none" stroke-dasharray="4 3"/>`);
  body.push(dim(ex + 300 * e, ey + 280 * e - 14, ex + 600 * e, ey + 280 * e - 14, '300 mm', 1), T(ex + 300 * e, ey + 280 * e + 46, 'front face', { anchor: 'middle', cls: 'd-mute' }), T(ex + 600 * e, ey + 280 * e + 46, 'rear face (dashed)', { anchor: 'middle', cls: 'd-mute' }));
  body.push(...wrapT(580, 880, 'Framed wall: at least 300 mm between outlets on opposite sides. Masonry: at least 100 mm.', 36, 16), ...wrapT(580, 950, 'For fire, a switch or outlet also avoids lining up with an opening opposite (300 mm sideways or 600 mm up) or follows a tested prototype.', 36, 16));
  body.push(...wrapT(40, 1176, 'Both leaves, the layers and the clearances are from the NCC pages in Sources. The 10.7 page gives no impact rating.', 112, 16));
  return svg(900, 1200, body.join(''), 'Framed separating wall section');
}

function finishDwg() {
  const body = [R(0, 0, 900, 980, 'd-bg')];
  body.push(T(40, 40, 'Finish levels, control joints and flatness', { cls: 'd-bold' }), T(40, 66, 'A  A butt joint at each finish level, plan section, coats exaggerated', { cls: 'd-bold' }));
  const panel = (x, name, sub, n) => {
    const w = 260, c = x + w / 2, by = 190;
    body.push(R(x, by, w / 2 - 2, 56, 'd-board'), R(c + 2, by, w / 2 - 2, 56, 'd-board'), R(c - 15, by - 4, 30, 4, 'd-bg'));
    const layers = [30, 70, 130, 190, w]; for (let i = 0; i < n; i++) body.push(R(c - layers[i] / 2, by - 4 - 4 * (i + 1) + 4, layers[i], 4, i === 4 ? 'd-ins2' : 'd-gap'));
    body.push(T(c, 130, name, { anchor: 'middle', cls: 'd-bold' }), T(c, 150, sub, { anchor: 'middle', cls: 'd-mute' }));
  };
  panel(40, 'Level 3', 'tape and one coat', 2); panel(320, 'Level 4', 'tape and two coats', 3); panel(600, 'Level 5', 'adds a coat and a skim', 5);
  body.push(...wrapT(40, 290, 'Level 4 is Knauf\'s default and the BPC guide\'s minimum for finished work. Level 5 skims the whole face, so it suits strong side light or gloss paint. Levels are from AS/NZS 2589 as set out in the Knauf manual. The standard was not opened.', 112, 16));
  // B: control joints at 0.03 px per mm
  body.push(T(40, 366, 'B  Control joint spacing, 0.03 px per mm', { cls: 'd-bold' }));
  const k = 0.03, bx = 60, row = (y, label, lenm, js) => {
    body.push(T(bx, y, label, { cls: 'd-mute' }), R(bx, y + 8, lenm * 1000 * k, 22, 'd-board'));
    for (const j of js) body.push(L(bx + j * 1000 * k, y + 2, bx + j * 1000 * k, y + 36, 'd-cut'), T(bx + j * 1000 * k, y + 52, `${j} m`, { anchor: 'middle', cls: 'd-dimt' }));
  };
  row(400, 'Walls and ceilings, each direction: 12 m centres', 24, [12]); row(468, 'External ceilings: 6 m centres', 24, [6, 12, 18]); row(536, 'Tiled walls: 3.0 to 4.5 m (4.5 m shown)', 13.5, [4.5, 9]);
  body.push(...wrapT(40, 614, 'A control joint is also needed at every change of lining material. Spacings are from the Knauf manual.', 112, 16));
  // C: flatness
  body.push(T(40, 666, 'C  Flatness check with a 1.8 m straight edge, vertical scale exaggerated', { cls: 'd-bold' }));
  const sx = 80, sy = 770, sl = 1800 * 0.3, pts = []; for (let i = 0; i <= 60; i++) { const u = i / 60; pts.push([sx + u * sl, sy + 7.5 * 4 * u * (1 - u)]); }
  body.push(`<polyline points="${pts.map((q) => q.join(',')).join(' ')}" class="d-cut" fill="none"/>`, L(sx - 20, sy, sx + sl + 20, sy, 'd-line'));
  body.push(L(sx + sl / 2, sy, sx + sl / 2, sy + 7.5, 'd-lead'), T(sx + sl / 2 + 14, sy + 30, '5 mm bow at the low point, drawn 5 times too tall', { cls: 'd-mute' }), T(sx, sy + 30, 'wall face', { cls: 'd-mute' }), T(sx, sy - 14, 'straight edge, 1800 mm', { cls: 'd-mute' }));
  body.push(...wrapT(40, 870, 'The BPC Guide to Standards and Tolerances 2026 treats an internal wall that bows more than 5 mm from a 1.8 m straight edge as outside tolerance, and cornices and plasterboard ceilings that deviate more than 4 mm from a 2 m straight edge. The guide is advisory and applies to contracts entered into or work commenced from 1 August 2026.', 112, 16));
  body.push(...wrapT(40, 952, 'The guide judges from a normal viewing position of 1.5 m or more in diffused light. A lamp held along the surface shows more than that, so use it to find and fix defects, not to judge compliance.', 112, 16));
  return svg(900, 1010, body.join(''), 'Finish levels and control joints');
}

export const drawings = [
  { id: 'order', title: 'Order of work and payment', scale: 'Flow, with the payment limits to scale', svg: orderDwg(),
    notes: ['Services and insulation are signed off first, then the ceiling is lined, then the walls, then the joints are taped and set, then the work is inspected before paint.', 'Wet areas: the plan shows waterproofing in Step 10, but the sheet is usually fixed first and the membrane goes on it. Confirm the order with the waterproofer and the membrane maker.', 'The fixing stage is reached when all internal cladding, architraves, skirting, doors and built-in shelves are fixed, with baths, basins, sinks, cabinets and cupboards. The limits are from the CAV payments page, last updated 9 July 2025.', 'The Domestic Building Contracts Amendment Bill 2025 passed on 11 September 2025. Check the current CAV page before pricing a contract.'] },
  { id: 'fix', title: 'Fixing patterns', scale: 'Wall and ceiling at 0.15 px per mm', svg: fixDwg(),
    notes: ['Walls: sheets run horizontally, butt joints are staggered and stay at least 200 mm from the edges of openings. Screws are 10 to 16 mm from the edges and fixed from the centre outwards, at 300 mm maximum and 200 mm where a butt joint falls on framing.', 'Ceilings: butt joints fall between the framing and are back-blocked. With screws only the spacing is 300 mm across the width, and at the perimeter 300 mm for cornices and 150 mm for square set.', 'Adhesive daubs are no more than 300 mm apart along studs and 200 mm from sheet edges and screw points. They are not used in wet areas.', 'These figures are from the Knauf installation manual, a manufacturer document. AS/NZS 2589 was not opened.'] },
  { id: 'sep', title: 'Separating wall', scale: 'Plan section at 0.9 px per mm, elevation at 0.4 px per mm', svg: sepDwg(),
    notes: ['A framed wall between two dwellings: two rows of 90 by 35 studs at 600 mm centres, an air gap of at least 20 mm, insulation and two layers of 13 mm fire-protective grade plasterboard. The model and drawing show two layers on each outer face, which is Confirm.', 'Second-layer joints do not line up with first-layer joints, and all joints are taped and filled solid. Noggings must not bridge the two leaves. Perimeter members are fixed and caulked.', 'Outlets on opposite sides are at least 300 mm apart in framed walls. A pipe serving one dwelling is not fixed to the other leaf and keeps at least 10 mm clearance.', 'A detached house has no separating wall. Whether a wall near a boundary needs fire resistance depends on the setback, which the ABCB 9.2 page read did not give. Take it from the plans and the surveyor.'] },
  { id: 'finish', title: 'Finish levels and joints', scale: 'Sections exaggerated, joints at 0.03 px per mm', svg: finishDwg(),
    notes: ['Level 3 is tape and one coat, Level 4 is tape and two coats, and Level 5 adds a finishing coat and a skim over the whole face. Knauf names Level 4 as the default.', 'Control joints: walls and ceilings at 12 m centres each way, external ceilings at 6 m, tiled walls at 3.0 to 4.5 m, and at every change of lining material.', 'The BPC guide treats a wall that bows more than 5 mm from a 1.8 m straight edge, and a cornice or ceiling that deviates more than 4 mm from a 2 m straight edge, as outside tolerance. The guide is advisory.', 'Inspect before paint. A low lamp shows untaped joints, popped screws and bowed framing, but the BPC guide judges from a normal viewing position of 1.5 m or more.'] },
];

/* ---------- steps ---------- */
export const howto = [
  ['Check the frame', 'Hold a straight edge against the studs and the ceiling framing. Framing must be plumb, level, square and dry before lining. Fix bowed studs and high noggings now, because the sheet copies the frame.', 'Builder and plasterer', 'V', 'knaufManual'],
  ['Get services and insulation signed off', 'Electrical and plumbing rough-in, exhaust ducts and insulation (Steps 8 to 11) are checked and photographed. Once the sheets are on, the work is hidden and any fix means cutting the lining.', 'Builder, electrician, plumber, installer', 'T'],
  ['Put in the blocking', 'Add noggings or blocking where shelves, cabinets, rails, handrails and heavy fittings will go. Heavy fittings are fixed to framing, not to the sheeting.', 'Carpenter', 'V', 'waIb85'],
  ['Order and store the board', 'Order the board type for each area from the plans: standard, wet-area, and any fire-rated or sound-rated system. Store sheets flat, dry and off the ground, with supports at no more than 600 mm centres.', 'Builder and plasterer', 'V', 'knaufManual'],
  ['Line the ceilings first', 'Fix ceiling sheets across the framing. Butt joints fall between the framing and are back-blocked. With screws only, fix at 300 mm across the width, and at the perimeter 300 mm for cornices or 150 mm for square set. Ceiling batts go over the sheets afterwards.', 'Plasterer', 'V', 'knaufManual'],
  ['Line the walls', 'Run sheets horizontally for a Level 4 or 5 finish, with butt joints staggered and vertical joints at least 200 mm from the edges of openings. Fix 10 to 16 mm from edges, from the centre outwards, at 300 mm maximum and 200 mm where a butt joint falls on framing. Keep temporary fasteners in at every second stud for at least 24 hours when adhesive is used.', 'Plasterer', 'V', 'knaufManual'],
  ['Line the wet areas', 'Use the wet-area board the plans call for, fixed with screws or nails only and no stud adhesive, with joints in base compound and paper tape. Confirm with the waterproofer whether the membrane goes on after the sheet, and who supplies what.', 'Plasterer and waterproofer', 'V', 'knaufManual'],
  ['Build any separating wall', 'Only where two dwellings share a wall. Build the framed wall to the NCC Part 10.7.8 text and the surveyor\'s fire design: two rows of studs, an air gap of at least 20 mm, insulation, two layers of board, joints staggered and filled solid, perimeter members fixed and caulked, and outlets offset.', 'Builder, carpenter, plasterer', 'V', 'nccHp107'],
  ['Photograph concealed details', 'Photograph the packing, caulked edges, fire collars and service clearances of any separating wall before the second layer covers them.', 'Builder', 'T'],
  ['Fit the cornice', 'Fix the cornice or leave the junction square for a square set, as the plans say. The perimeter screw spacing depends on which one it is.', 'Plasterer', 'T'],
  ['Tape and set', 'Tape every joint and fill in coats to the finish level in the specification: Level 3 is tape and one coat, Level 4 tape and two coats, Level 5 adds a finishing coat and a skim. Add control joints at 12 m centres each way, and at every change of lining material.', 'Plasterer', 'V', 'knaufManual'],
  ['Inspect in side light', 'Hold a lamp along each wall and the ceiling at a low angle. Mark untaped joints, popped screws, missing back-blocking, gaps at the ceiling and bowed areas, and have them fixed before the painter starts.', 'Builder', 'T'],
  ['File the records and claim the stage correctly', 'File the dockets, data sheets, photographs and the surveyor\'s record. Do not claim the fixing stage until the internal cladding, doors, trims, shelves and fittings are all fixed.', 'Builder', 'V', 'cavPay'],
];

export const trades = [
  { t: 'Plasterer', role: 'Supplies and fixes the sheets, tapes and sets the joints, and fits the cornice. Often one crew does all three.', when: 'After services and insulation are signed off. Ceilings first, then walls, then set', reg: 'The registration or licensing rule for plastering in Victoria was not checked. The builder is still responsible under the contract and the permit.', ask: ['Board type and thickness by room', 'Finish level in the quote (Level 4 unless the plans say otherwise)', 'Back-blocking, cornice and control joints included', 'Who removes the offcuts'] },
  { t: 'Carpenter', role: 'Straightens framing, adds blocking for heavy fittings and builds any separating wall frames.', when: 'Before the sheets go on', reg: 'Carpentry for a registered builder\'s job falls under the builder\'s contract. Check any trade licence rules before engaging someone directly.', ask: ['Blocking positions marked on a plan', 'Two rows of studs and the 20 mm gap if there is a separating wall', 'Fix and caulk of the perimeter members'] },
  { t: 'Electrician and plumber', role: 'Finish the rough-in before lining, and return after set for fittings. Services through a separating wall follow the NCC clearances.', when: 'Rough-in before lining. Fit-off after paint', reg: 'Electrical and plumbing work needs a licence, so a builder cannot do it unless licensed (Steps 8 and 9).', ask: ['Rough-in complete and tested before lining', 'Outlets offset where a separating wall is involved', 'Pipes and cables kept in their own leaf'] },
  { t: 'Insulation installer', role: 'Wall batts are in before lining. Ceiling batts are laid over the sheets afterwards.', when: 'Walls before lining, ceiling after the ceiling sheets', reg: 'Not checked further than Step 11.', ask: ['Ceiling batts after the ceiling is lined', 'Weight of the batts for the board thickness (see the WA bulletin)', 'Photographs of the walls before lining'] },
  { t: 'Painter', role: 'Primes and paints after the set coat and the inspection.', when: 'After the surface passes inspection in side light', reg: 'Not checked.', ask: ['The finish level they expect', 'Paint system and number of coats', 'Who marks and fixes minor defects'] },
  { t: 'Building surveyor (RBS)', role: 'Sets the prescribed stages on the permit, can require an additional inspection under section 35, and approves the fire and sound design of any separating wall.', when: 'As the permit lists, or when the surveyor asks', reg: 'A registered building surveyor under the Building Act. Prescribed stages are in the Building Regulations (regulations 167 to 169 and 172).', ask: ['Whether they want to see concealed details before the second layer', 'Fire report for boundary walls', 'What they need to see before the occupancy permit'] },
];

export const materials = [
  ['Standard plasterboard', 'Paper-faced gypsum board in 10 and 13 mm, 1200 and 1350 mm wide and in a range of lengths', 'Plasterboard suppliers. Makers include Knauf and Gyprock (confirm the range and sizes)', 'T', 'The plans or the plasterer name the thickness and length.'],
  ['Wet-area board', 'A board made for damp areas, often green-faced, used in bathrooms, laundries and toilets', 'Plasterboard suppliers', 'T', 'Read the product name, not the colour. The waterproofing system is separate.'],
  ['Fire-rated board', 'A board with a fire-resistant core. Knauf Firestop comes in 13 and 16 mm and is tested to AS/NZS 2588:2018', 'Plasterboard suppliers', 'V', 'Fire resistance depends on the whole system. The NCC text asks for "fire-protective grade", which the page read does not define.'],
  ['Cornice', 'A moulded or cove strip for the wall and ceiling junction', 'Plasterboard suppliers and Bunnings', 'T', 'Check whether the plans call for cornice or a square set.'],
  ['Joint compound and paper tape', 'Base compound, topping compound and tape for joints. Wet areas use base compound and paper tape', 'Plasterboard suppliers and Bunnings', 'V', 'Use the system the board maker names.'],
  ['Plasterboard screws', 'Drywall screws. A WA bulletin quotes 30 mm screws for softwood from AS/NZS 2589:2017 Table 2.9.1', 'Plasterboard suppliers and Bunnings', 'C', 'Check the length for the board thickness and the framing.'],
  ['Stud adhesive', 'Adhesive daubs along studs to hold the sheet flat between screws', 'Plasterboard suppliers', 'V', 'Not used in wet areas. Daub spacing is in the Knauf manual.'],
  ['Back-block strips', 'Offcuts of board fixed behind a ceiling joint to bridge it', 'Cut on site', 'T', 'Knauf recommends back-blocking all ceiling joints.'],
  ['Mineral fibre packing', 'Fills any gap above a separating wall, with no timber or combustible crossing it', 'Insulation and fire-stopping suppliers', 'V', 'Only where there is a separating wall.'],
  ['Acoustic insulation batts', 'Batts between the studs of one leaf of a separating wall', 'Insulation merchants', 'C', 'The pages read do not give the density or which leaf. Take both from the NCC table and the designer.'],
  ['Fire-stopping collars and sealant', 'Collars and sealant where services pass through a fire-rated wall', 'Fire-stopping suppliers', 'C', 'Use a tested system. The NCC also gives alternative limits for cables.'],
];

export const quotes = [
  { who: 'Plasterer (supply, fix and set)', n: '3', what: ['Board type and thickness by room, including wet-area and fire-rated board', 'Finish level, cornice, back-blocking and control joints', 'Who supplies the screws, compound and tape, and who cleans up'] },
  { who: 'Carpenter (blocking and separating wall frames)', n: '2', what: ['Blocking to a marked plan', 'Two-leaf frames and the 20 mm gap, if any', 'Hours and a rate for repairs found at the frame check'] },
  { who: 'Insulation installer (ceiling batts)', n: '2', what: ['Ceiling batts laid after the ceiling is lined', 'Weight of the batts against the board thickness', 'Photographs on completion'] },
  { who: 'Waterproofer', n: '2', what: ['Membrane over the wet-area sheets, with the order agreed in writing', 'Flood test and certificate', 'Who supplies the sealing at the penetrations'] },
  { who: 'Painter', n: '3', what: ['Finish level expected and paint system', 'Number of coats and any patching', 'Start date after the plaster inspection'] },
];
export const quoteTips = [
  'Ask the plasterer to name the board type for each room and the finish level in the quote. "Plastering to the house" hides wet-area board, fire-rated board and Level 5.',
  'Put the ceiling-before-walls order and back-blocking in the quote. They are quick to leave out.',
  'Agree with the waterproofer and the plasterer who does what in the wet areas, in what order, before either starts.',
  'Ask the installer to photograph every wall before the plasterer starts, and make that part of the price.',
  'For any separating wall, get the fire and sound design in writing from the designer and surveyor before pricing it. Do not copy a detail from another job.',
  'Keep the quotes, dockets and photographs. They are evidence of estimating and supervision for the BPC application.',
];

export const inspections = [
  ['Frame check', 'Builder and plasterer', 'Before any sheet goes on', 'Framing is plumb, level, square and dry, bowed studs are fixed and blocking is in for the heavy fittings.', 'V', 'knaufManual'],
  ['Services and insulation sign-off', 'Builder, electrician, plumber and installer', 'Before lining', 'Rough-in is tested and photographed, ducts are ducted outside, and wall batts fill every bay.', 'T'],
  ['Delivery check', 'Builder', 'On delivery', 'The board type matches the order, sheets are flat, dry and off the ground, and supports are at no more than 600 mm centres.', 'V', 'knaufManual'],
  ['Ceiling check', 'Builder and plasterer', 'After the ceiling is lined', 'Butt joints fall between the framing and are back-blocked, screws are at 300 mm across the width, and the perimeter spacing suits the cornice or square set.', 'V', 'knaufManual'],
  ['Wall check', 'Builder and plasterer', 'After the walls are lined', 'Sheets are horizontal, butt joints are staggered, vertical joints stay 200 mm from openings, and fasteners are 10 to 16 mm from the edges.', 'V', 'knaufManual'],
  ['Wet-area check', 'Builder, plasterer and waterproofer', 'Before the membrane', 'The board is the wet-area type, fixed with screws or nails and no stud adhesive, with joints in base compound and paper tape.', 'V', 'knaufManual'],
  ['Separating wall check (if any)', 'Builder and surveyor', 'Before the second layer', 'Two rows of studs, a gap of at least 20 mm, insulation, packed and caulked perimeters, outlets offset and pipes clear. Photographs taken.', 'V', 'nccHp107'],
  ['Surveyor inspection (if required)', 'Building surveyor', 'As the permit lists, or as the surveyor requires', 'Internal linings are not a named stage. The surveyor can require an additional inspection under section 35.', 'T', 'bpcMI01'],
  ['Side-light check', 'Builder', 'Before paint', 'Untaped joints, popped screws, missing back-blocking and gaps at the ceiling are marked and fixed.', 'T'],
  ['Finish level check', 'Builder and plasterer', 'Before paint', 'The surface is Level 4 or the level in the specification, walls bow no more than 5 mm from a 1.8 m straight edge, and cornices and ceilings deviate no more than 4 mm from a 2 m straight edge.', 'V', 'bpcTol26'],
  ['Records and fixing stage', 'Builder', 'Before claiming the fixing stage', 'Dockets, photographs and the surveyor\'s record are filed. The fixing stage claim waits until all cladding, doors, trims, shelves and fittings are fixed.', 'V', 'cavPay'],
];

export const exam = [
  ['What is the fixing stage of a major domestic building contract?', 'All internal cladding, architraves, skirting, doors and built-in shelves are fitted and fixed, plus baths, basins, troughs, sinks, cabinets and cupboards.', 'V', 'cavPay'],
  ['What are the stage payment limits for a contract covering all stages?', 'Base 10 per cent, frame 15 per cent, lock-up 35 per cent and fixing 25 per cent, 85 per cent in total.', 'V', 'cavPay'],
  ['What are the base, frame and lock-up limits for a contract to build to fixing?', 'Base 12 per cent, frame 18 per cent and lock-up 40 per cent.', 'V', 'cavPay'],
  ['What happened to the domestic building contract laws in September 2025?', 'The Domestic Building Contracts Amendment Bill 2025 passed on 11 September 2025. Payment limits may change, so check the current CAV page.', 'C', 'cavAmend'],
  ['Which goes up first, the ceiling sheets or the wall sheets?', 'The ceiling. The wall sheets are fitted up under it.', 'T'],
  ['Which way do wall sheets run for a Level 4 or 5 finish?', 'Horizontally.', 'V', 'knaufManual'],
  ['How far must a vertical joint be from the edge of an opening?', 'At least 200 mm.', 'V', 'knaufManual'],
  ['How far from the sheet edge do fasteners go?', '10 to 16 mm.', 'V', 'knaufManual'],
  ['What are the maximum screw spacings on a wall?', '300 mm at sheet ends, and 200 mm where a butt joint falls on framing.', 'V', 'knaufManual'],
  ['In what order are fasteners driven in a sheet?', 'From the centre outwards.', 'V', 'knaufManual'],
  ['What is the spacing of adhesive daubs on studs?', 'No more than 300 mm along the studs, kept 200 mm from sheet edges and screw points.', 'V', 'knaufManual'],
  ['How long do temporary fasteners stay in when adhesive is used?', 'At every second stud for at least 24 hours.', 'V', 'knaufManual'],
  ['What fixing face does a timber stud need?', 'At least 35 mm at a supported sheet joint and 30 mm elsewhere.', 'V', 'knaufManual'],
  ['What are the screw spacings on a ceiling fixed with screws only?', '300 mm across the width, and at the perimeter 300 mm for cornices and 150 mm for square set.', 'V', 'knaufManual'],
  ['Where do ceiling butt joints fall, and what does Knauf recommend?', 'Between the framing, back-blocked. Knauf recommends back-blocking all ceiling joints.', 'V', 'knaufManual'],
  ['What did the WA bulletin blame for ceiling collapses?', 'Poor adhesive application and not following AS/NZS 2589. It is a 2017 Western Australian document.', 'C', 'waIb85'],
  ['What are finish levels 3, 4 and 5?', 'Level 3 is tape and one coat, Level 4 is tape and two coats, and Level 5 adds a finishing coat and a skim over the whole face.', 'V', 'knaufManual'],
  ['How far apart are control joints?', '12 m centres each way in walls and ceilings, 6 m in external ceilings, 3.0 to 4.5 m in tiled walls, and at every change of lining material.', 'V', 'knaufManual'],
  ['How are wet-area sheets fixed and finished?', 'With screws or nails only and no stud adhesive, with joints in base compound and paper tape.', 'V', 'knaufManual'],
  ['What humidity limit does the Knauf manual give for plasterboard?', 'It is not suitable where relative humidity is above 90 per cent.', 'V', 'knaufManual'],
  ['How should plasterboard be stored?', 'Flat, dry and off the ground, with supports at no more than 600 mm centres.', 'V', 'knaufManual'],
  ['What condition must framing be in before lining?', 'Plumb, level, square and dry.', 'V', 'knaufManual'],
  ['Where are heavy fittings fixed?', 'To the framing, not to the sheeting.', 'V', 'waIb85'],
  ['What is the minimum FRL of a separating wall between Class 1 buildings?', '60/60/60, or masonry at least 90 mm thick. The page shows no edition.', 'V', 'nccHp93'],
  ['Where does a separating wall start and finish?', 'From the footings or ground slab up to the underside of a non-combustible roof covering, or at least 450 mm above a combustible one.', 'V', 'nccHp93'],
  ['What may cross a lightweight separating wall?', 'Nothing combustible, except roof battens of 75 by 50 mm or smaller, or sarking. Any gap above the wall is packed with mineral fibre.', 'V', 'nccHp93'],
  ['What is the fire rule for eaves and verandahs within 1.8 m of a separating wall?', 'A system with 60 minutes\' resistance to incipient spread of fire, or FRL 30/30/30 from below, or a fire-protective underside covering. Shared eaves are separated by a non-combustible vertical lining.', 'V', 'nccHp93'],
  ['What FRL does a wall between a dwelling and a non-associated garage need?', '60/60/60 tested from the garage side, or masonry at least 90 mm. The page carries 2019 cross-references.', 'V', 'nccHp94'],
  ['What did the VBA say about Colorbond flashing on a boundary wall?', 'It is not a fire-rated material and does not provide fire separation in its own right.', 'V', 'vbaSepWalls'],
  ['What airborne sound figure must a Class 1 separating wall reach?', 'Rw + Ctr of at least 50 for the listed constructions. The tables are labelled 2019.', 'V', 'nccHp107'],
  ['What is a framed separating wall made of?', 'Two rows of 90 by 35 timber studs (or 64 mm steel) at 600 mm centres, an air gap of at least 20 mm, insulation and two layers of 13 mm fire-protective grade plasterboard.', 'V', 'nccHp107'],
  ['How far apart must outlets on opposite sides of a separating wall be?', 'At least 300 mm in a framed wall and 100 mm in masonry. A pipe for one dwelling keeps at least 10 mm from the other leaf.', 'V', 'nccHp107'],
  ['What limits does the NCC give for a cable through a separating wall?', '50 mm from other services, a single cable of up to 2000 mm² with a gap up to 15 mm (otherwise 500 mm²), and the gaps packed. Otherwise use a tested prototype.', 'V', 'nccHp93'],
  ['Is a surveyor inspection of internal linings mandatory?', 'Linings are not a named stage. The surveyor lists the stages on the permit and can require an additional inspection under section 35.', 'T', 'bpcMI01'],
  ['What finish level is the minimum for plasterboard in a finished Victorian home?', 'Level 4 under AS/NZS 2589. The BPC guide treats a lower finish as outside tolerance.', 'V', 'bpcTol26'],
  ['How far may an internal wall bow from a 1.8 m straight edge, per the BPC guide?', 'Not more than 5 mm.', 'V', 'bpcTol26'],
  ['What straight-edge limit applies to plaster cornices and plasterboard ceilings?', 'Not more than 4 mm from a 2 m straight edge.', 'V', 'bpcTol26'],
  ['When is a plasterboard crack outside tolerance in the BPC guide?', 'If it is present at completion, or is over 1 mm wide within 24 months and visible. Nail popping within 24 months is also outside tolerance.', 'V', 'bpcTol26'],
  ['What is a normal viewing position in the BPC guide?', '1.5 m or more away, in diffused, non-critical light.', 'V', 'bpcTol26'],
  ['What does "fire-protective grade" mean in the NCC separating wall text?', 'It is not defined on the page read, so ask the designer which product is meant.', 'C', 'nccHp107'],
];

/* ---------- sources and caution ---------- */
export const sources = ['cavPay', 'cavAmend', 'bpcMI01', 'nccHp93', 'nccHp94', 'nccHp92', 'nccHp107', 'hiaExtWall', 'vbaSepWalls', 'knaufManual', 'knaufFirestop', 'waIb85', 'bpcTol26'];
export const caution = 'Fire and sound rules here come from ABCB NCC web pages. The Part 9.3 page shows no edition, the 9.4 and 10.7 pages carry 2019 cross-references, the 9.2 page is a fragment with no distances or FRL values, and the 10.7 page gives no impact rating and does not define "fire-protective grade". Fixing spacings, finish levels and control joints come from a Knauf installation manual, a manufacturer document with no date, read to about 100,000 of its 138,544 characters, the adhesive and ceiling weight figures from a 2017 Western Australian bulletin, and the finish tolerances from the BPC Guide to Standards and Tolerances 2026 (advisory, applies from 1 August 2026, sections 16.3 to 21 were partly cut off when read). AS/NZS 2589, AS/NZS 2588 and AS 2753 are paywalled and were not opened. The payment limits are from a CAV page last updated on 9 July 2025, and the Domestic Building Contracts Amendment Bill 2025 passed on 11 September 2025, so check the current page. The order of waterproofing and lining, and the paint-maker finish-level page, were not confirmed. Sheet sizes, positions and the extent of wet-area board in the model are illustrative.';

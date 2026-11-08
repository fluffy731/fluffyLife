// Step 13 study content: drawings, steps, trades, materials, quotes, inspections and exam cards for fix-out: joinery, stairs and balustrades.
// Flags: V = Verified against a source named in SOURCES, T = Typical practice, C = Confirm. The NCC 2022 Part 11.2 and 11.3 pages show no edition, the 11.2 figures are image-only, and the 11.3 page is cut off at 11.3.5.
// AS 4586, AS/NZS 1170.1, AS 1288, AS 2688 and AS/NZS 4386.1 were not opened (paywalled). The BPC Guide to Standards and Tolerances 2026 is advisory and applies from 1 August 2026.
import { svg, T, L, R, C as Circ, P, dim, call, arrow } from './dwg.js';

const wrapT = (x, y, text, n, dy = 18, cls = 'd-mute') => { const out = []; let cur = ''; for (const w of text.split(' ')) { if ((cur + ' ' + w).trim().length > n) { out.push(cur); cur = w; } else cur = (cur + ' ' + w).trim(); } if (cur) out.push(cur); return out.map((t, i) => T(x, y + i * dy, t, { cls })); };
const keyList = (body, x, y, items, n, step, off = 20) => items.forEach(([k, t], i) => { body.push(T(x, y + i * step, k, { cls: 'd-bold' }), ...wrapT(x + off, y + i * step, t, n, 16, '')); });
const dash = (x1, y1, x2, y2) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" class="d-cut" fill="none"/>`;

/* ---------- drawings ---------- */
function stairDwg() {
  const body = [R(0, 0, 900, 1060, 'd-bg')], s = 0.3, x0 = 120, yg = 470, n = 6, Rr = 185, G = 250, Ld = 1200, X = (x) => x0 + x * s, Y = (y) => yg - y * s, xl = (n - 1) * G, xe = xl + Ld;
  body.push(T(40, 40, 'Stair flight, landing and the NCC limits', { cls: 'd-bold' }), T(40, 68, 'A  Elevation of the sample stair, 0.3 px per mm', { cls: 'd-bold' }));
  const pts = [[0, 0], [0, Rr]]; for (let t = 1; t < n; t++) pts.push([t * G, t * Rr], [t * G, (t + 1) * Rr]);
  pts.push([xe, n * Rr], [xe, n * Rr - 200], [xl, n * Rr - 200], [20, 0]);
  body.push(P(pts.map(([x, y]) => [X(x), Y(y)]), 'd-timber'), L(X(-300), Y(0), X(xe + 150), Y(0), 'd-line'));
  body.push(dash(X(-20), Y(Rr), X(xl - 20), Y(n * Rr)), T(X(300), Y(1000), 'line of nosings', { cls: 'd-mute' }));
  body.push(dim(X(-170), Y(0), X(-170), Y(n * Rr), '1110 total rise = 6 x 185', 1), dim(X(4 * G), Y(4 * Rr), X(4 * G), Y(5 * Rr), '185 riser', -1), dim(X(2 * G - 20), Y(3 * Rr) - 26, X(3 * G - 20), Y(3 * Rr) - 26, '250 going', 1));
  body.push(dim(X(xl - 20), Y(n * Rr) - 36, X(xe), Y(n * Rr) - 36, '1200 landing (750 mm minimum)', 1), T(X(xe) - 4, Y(0) + 22, 'door end', { anchor: 'end', cls: 'd-mute' }), T(X(0), Y(0) + 22, 'first riser', { anchor: 'middle', cls: 'd-mute' }));
  body.push(T(X(1500), Y(300), '2R + G = 2 x 185 + 250 = 620 mm', { cls: 'd-bold' }), T(X(1500), Y(300) + 18, 'allowed range 550 to 700 mm', { cls: 'd-mute' }));
  body.push(T(X(1500), Y(300) + 44, 'Orange nosing strips: P3 dry, P4 wet (AS 4586)', { cls: 'd-mute' }));
  // B: allowed region in riser and going space
  const ox = 110, oy = 960, cx = (r) => ox + (r - 100) * 3, cy = (g) => oy - (g - 200) * 1.5;
  body.push(T(40, 580, 'B  Riser and going allowed by Table 11.2.2a (stairs other than spiral)', { cls: 'd-bold' }));
  const reg = [[115, 320], [115, 355], [172.5, 355], [190, 320], [190, 240], [155, 240]];
  body.push(P(reg.map(([r, g]) => [cx(r), cy(g)]), 'd-timberx'), L(ox, oy, ox + 300, oy, 'd-line'), L(ox, oy, ox, oy - 300, 'd-line'));
  for (let r = 100; r <= 200; r += 20) body.push(L(cx(r), oy, cx(r), oy + 6, 'd-dim'), T(cx(r), oy + 20, String(r), { anchor: 'middle', cls: 'd-dimt' }));
  for (let g = 200; g <= 400; g += 40) body.push(L(ox - 6, cy(g), ox, cy(g), 'd-dim'), T(ox - 10, cy(g) + 4, String(g), { anchor: 'end', cls: 'd-dimt' }));
  body.push(T(ox + 150, oy + 42, 'Riser R (mm)', { anchor: 'middle', cls: 'd-mute' }), T(ox - 58, oy - 150, 'Going G (mm)', { anchor: 'middle', cls: 'd-mute', rot: -90 }));
  body.push(Circ(cx(185), cy(250), 6, 'd-dot'), T(cx(185) - 12, cy(250) + 5, 'sample stair 185 / 250', { anchor: 'end', cls: 'd-bold' }));
  body.push(T(cx(115) + 6, cy(355) - 8, 'G 355 max', { cls: 'd-dimt' }), T(cx(190) + 8, cy(240) + 4, 'G 240 min', { cls: 'd-dimt' }), T(cx(115) - 4, cy(337), 'R 115 min', { anchor: 'end', cls: 'd-dimt' }), T(cx(190) + 8, cy(300), 'R 190 max', { cls: 'd-dimt' }));
  body.push(...wrapT(470, 640, 'The shaded area meets all three limits: riser 115 to 190 mm, going 240 to 355 mm and 2R + G from 550 to 700 mm. The two sloping edges are the 2R + G limits.', 52, 18));
  body.push(...wrapT(470, 720, 'Adjacent risers or goings may differ by no more than 5 mm, and the largest and smallest in a flight by no more than 10 mm.', 52, 18));
  body.push(...wrapT(470, 780, 'A flight has 2 to 18 risers. Spiral, attic and storeroom stairs have their own tables. Headroom is in Part 10.3, which was not read.', 52, 18));
  body.push(...wrapT(470, 842, 'NCC 2022 Part 11.2 page shows no edition and its figures are image-only, so check the table in the edition that applies.', 52, 18));
  return svg(900, 1060, body.join(''), 'Stair flight, landing and limits');
}

function barrierDwg() {
  const body = [R(0, 0, 900, 1090, 'd-bg')], s = 0.3, x0 = 120, yg = 730, n = 6, Rr = 185, G = 250, Ld = 1200, X = (x) => x0 + x * s, Y = (y) => yg - y * s, xl = (n - 1) * G, xe = xl + Ld, nl = (x) => Rr + (Rr / G) * (x + 20);
  body.push(T(40, 40, 'Balustrade: heights and openings', { cls: 'd-bold' }), T(40, 68, 'A  Elevation of the barrier on the sample stair, 0.3 px per mm', { cls: 'd-bold' }));
  const pts = [[0, 0], [0, Rr]]; for (let t = 1; t < n; t++) pts.push([t * G, t * Rr], [t * G, (t + 1) * Rr]);
  pts.push([xe, n * Rr], [xe, n * Rr - 200], [xl, n * Rr - 200], [20, 0]);
  body.push(P(pts.map(([x, y]) => [X(x), Y(y)]), 'd-timber'), L(X(-300), Y(0), X(xe + 150), Y(0), 'd-line'));
  for (const px of [60, xl, xe - 70]) body.push(R(X(px) - 13.5, Y(px === 60 ? nl(60) + 865 + 60 : n * Rr + 1000), 27, (px === 60 ? nl(60) + 865 + 60 : n * Rr + 1000) * s, 'd-timber'));
  body.push(L(X(60), Y(nl(60) + 865 - 22), X(xl), Y(nl(xl) + 865 - 22), 'd-wall'), L(X(xl), Y(n * Rr + 1000 - 22), X(xe - 70), Y(n * Rr + 1000 - 22), 'd-wall'));
  for (let x = 170; x < xl - 30; x += 112) body.push(L(X(x), Y(nl(x) + 90), X(x), Y(nl(x) + 865 - 22), 'd-line'));
  for (let x = xl + 112; x < xe - 100; x += 112) body.push(L(X(x), Y(n * Rr + 90), X(x), Y(n * Rr + 1000 - 22), 'd-line'));
  body.push(L(X(60), Y(nl(60) + 90), X(xl), Y(nl(xl) + 90), 'd-line'), L(X(xl), Y(n * Rr + 90), X(xe - 70), Y(n * Rr + 90), 'd-line'));
  body.push(dash(X(-20), Y(Rr), X(xl - 20), Y(n * Rr)));
  body.push(dim(X(700), Y(nl(700)), X(700), Y(nl(700) + 865), '865 above the nosing line', -1), dim(X(1850), Y(n * Rr), X(1850), Y(n * Rr + 1000), '1000 above the landing', 1));
  body.push(T(X(xl) - 10, Y(n * Rr + 1000) - 16, 'transition zone', { anchor: 'middle', cls: 'd-mute' }), T(X(1250), Y(-0) + 24, 'Balusters: 12 mm at 112 mm pitch, 100 mm clear', { cls: 'd-mute' }));
  body.push(T(X(100), Y(1900), 'Round top rail: also the handrail if it can be grasped', { cls: 'd-mute' }), T(X(100), Y(1900) + 18, 'Full length of the flight and continuous', { cls: 'd-mute' }));
  // B: sphere test
  body.push(T(40, 790, 'B  125 mm sphere test between balusters, 1.6 px per mm', { cls: 'd-bold' }));
  body.push(L(80, 818, 780, 818, 'd-wall'), L(80, 1040, 780, 1040, 'd-wall'));
  const bx = [100, 279, 538, 717]; for (const x of bx) body.push(R(x, 820, 19, 218, 'd-conc'));
  body.push(`<circle cx="199" cy="929" r="100" class="d-cut" fill="none"/>`, Circ(199, 929, 4, 'd-dot'), `<circle cx="418" cy="929" r="100" class="d-cut" fill="none"/>`, Circ(418, 929, 4, 'd-dot'));
  body.push(T(199, 1062, '100 mm gap: sphere stops. Complies.', { anchor: 'middle', cls: 'd-bold' }), T(418, 1080, '150 mm gap: sphere fits. Fails.', { anchor: 'middle', cls: 'd-bold' }), T(637, 1062, '100 mm gap', { anchor: 'middle', cls: 'd-mute' }));
  body.push(dim(318, 929, 518, 929, '125 mm sphere', 1), T(790, 840, 'Test every opening:', { cls: 'd-bold' }), T(790, 860, 'above the bottom rail,', { cls: 'd-mute' }), T(790, 876, 'beside the stringer,', { cls: 'd-mute' }), T(790, 892, 'under the handrail.', { cls: 'd-mute' }));
  return svg(900, 1090, body.join(''), 'Balustrade heights and openings');
}

function doorDwg() {
  const body = [R(0, 0, 900, 1060, 'd-bg')], s = 0.27, cxd = 170, yg = 700, X = (x) => cxd + x * s, Y = (y) => yg - y * s;
  body.push(T(40, 40, 'Internal door, architrave and tolerances', { cls: 'd-bold' }), T(40, 68, 'A  Elevation, 0.27 px per mm', { cls: 'd-bold' }));
  body.push(L(X(-500), Y(0), X(500), Y(0), 'd-line'), R(X(-410), Y(2100), 820 * s, 2100 * s, 'd-wfloor'));
  body.push(R(X(-363 - 32), Y(2095), 32 * s, 2095 * s, 'd-timber'), R(X(363), Y(2095), 32 * s, 2095 * s, 'd-timber'), R(X(-395), Y(2095), 790 * s, 32 * s, 'd-timber'));
  body.push(R(X(-436), Y(2069), 67 * s, 2069 * s, 'd-board'), R(X(363 + 6), Y(2069), 67 * s, 2069 * s, 'd-board'), R(X(-436), Y(2136), 872 * s, 67 * s, 'd-board'));
  body.push(R(X(-363), Y(2060), 720 * s, 2040 * s, 'd-door'), R(X(363) - 24, Y(1030), 13, 6, 'd-ins'));
  body.push(T(X(0), Y(1100), 'leaf 720 x 2040', { anchor: 'middle', cls: 'd-mute' }), L(X(-500), Y(67), X(-436), Y(67), 'd-line'), T(X(-500) + 4, Y(67) - 8, 'skirting 67', { cls: 'd-mute' }));
  body.push(dim(X(-440), Y(0), X(-440), Y(20), '', 1), T(X(-452), Y(20) + 4, '20 floor gap', { anchor: 'end', cls: 'd-dimt' }), T(X(420), Y(2063), 'head gap 3', { cls: 'd-dimt' }), T(X(420), Y(1500), 'side gaps 3', { cls: 'd-dimt' }));
  body.push(dim(X(-436), Y(2136) - 12, X(436), Y(2136) - 12, '872 over the architraves', -1), dim(X(500), Y(0), X(500), Y(2136), '2136 to top of architrave', 1));
  // B: plan section through the hinge jamb
  const px = (x) => 610 + 1.5 * x, pz = (z) => 330 - 1.5 * z;
  body.push(T(330, 100, 'B  Plan section at the hinge jamb, 1.5 px per mm', { cls: 'd-bold' }));
  body.push(R(px(-45), pz(45), 45 * 1.5, 90 * 1.5, 'd-timber'), R(px(-90), pz(45), 45 * 1.5, 90 * 1.5, 'd-timber'), R(px(-200), pz(58), 200 * 1.5, 13 * 1.5, 'd-board'), R(px(-200), pz(-45), 200 * 1.5, 13 * 1.5, 'd-board'));
  body.push(R(px(0), pz(25), 4 * 1.5, 50 * 1.5, 'd-ply'), R(px(4), pz(79), 32 * 1.5, 158 * 1.5, 'd-timber'), R(px(39), pz(17.5), 100 * 1.5, 35 * 1.5, 'd-door'), R(px(-37), pz(76), 67 * 1.5, 18 * 1.5, 'd-board'));
  body.push(R(px(36), pz(10), 3 * 1.5, 20 * 1.5, 'd-ins'));
  body.push(T(px(-190), pz(58) - 24, 'wall sheet 13', { cls: 'd-mute' }), T(px(-150), pz(-0) + 4, 'studs 90 x 45', { cls: 'd-mute' }), T(px(-24), pz(79) - 28, 'architrave 67 x 18, set back 6 mm from the jamb edge', { cls: 'd-mute' }), T(px(70), pz(79) - 6, 'jamb 32 x 158', { cls: 'd-mute' }), T(px(100), pz(-17.5) + 18, 'leaf 35', { cls: 'd-mute' }), T(px(-3), pz(-60) + 22, 'packers', { anchor: 'middle', cls: 'd-mute' }));
  body.push(T(px(60), pz(0) + 4, '3 mm gap', { cls: 'd-dimt' }));
  // C: tolerances from the BPC guide
  body.push(T(40, 780, 'C  Limits in the BPC Guide to Standards and Tolerances 2026 (advisory)', { cls: 'd-bold' }));
  keyList(body, 40, 808, [['11.4', 'Internal door gaps 2 to 5 mm and uniform. Floor gap not more than 20 mm after floor coverings. Checked within 3 months.'], ['11.5', 'Leaf out of square more than 3 mm, or twisted more than 5 mm, is out of tolerance. Bow: 4 mm along the height (to 2150 mm), 3 mm across the width (to 1020 mm).'], ['11.3, 11.7', 'Handles and latches must operate as intended and doors must not bind or jam within 3 months.'], ['13.1 to 13.3', 'Visible architrave mitre or butt gaps over 1 mm within 12 months (2 mm after), and skirting gaps over 2 mm within 24 months.']], 96, 58, 92);
  body.push(...wrapT(40, 1042, 'Applies to contracts entered into or work commenced from 1 August 2026. Manufacturer instructions and legislation take precedence over the guide.', 112, 16));
  return svg(900, 1060, body.join(''), 'Door, architrave and tolerances');
}

function joineryDwg() {
  const body = [R(0, 0, 900, 1060, 'd-bg')], s = 0.25, yg = 720, x0 = 120, X = (x) => x0 + x * s, Y = (y) => yg - y * s;
  body.push(T(40, 40, 'Kitchen run and wardrobe: sections', { cls: 'd-bold' }), T(40, 68, 'A  Kitchen section, 0.25 px per mm. Heights are common sizes, not rules', { cls: 'd-bold' }));
  body.push(L(X(-80), Y(0), X(700), Y(0), 'd-line'), R(X(-13), Y(2300), 13 * s, 2300 * s, 'd-board'), R(X(-58), Y(2045), 45 * s, 90 * s, 'd-timber'));
  body.push(R(X(70), Y(150), 500 * s, 150 * s, 'd-conc'), R(X(0), Y(865), 580 * s, 715 * s, 'd-box'), R(X(0), Y(900), 620 * s, 35 * s, 'd-brick'), R(X(0), Y(1500), 12 * s, 600 * s, 'd-ins2'));
  body.push(R(X(0), Y(2200), 320 * s, 700 * s, 'd-box'));
  body.push(R(X(0) - 1, Y(2020), 5, 10.4, 'd-ins'), R(X(580), Y(865), 18 * s, 700 * s, 'd-timber'), R(X(320), Y(2200), 18 * s, 700 * s, 'd-timber'));
  body.push(dim(X(-130), Y(0), X(-130), Y(150), '150', 1), dim(X(-130), Y(150), X(-130), Y(865), '715', 1), dim(X(-130), Y(865), X(-130), Y(900), '35', 1), dim(X(-130), Y(900), X(-130), Y(1500), '600 clear', 1), dim(X(-130), Y(1500), X(-130), Y(2200), '700 overhead', 1));
  body.push(T(X(700), Y(450), 'base cabinet and plinth', { cls: 'd-mute' }), T(X(700), Y(450) + 16, 'plinth set back about 70 mm', { cls: 'd-mute' }), T(X(700), Y(900) + 4, 'benchtop, sealed at the wall', { cls: 'd-mute' }), T(X(700), Y(1200), 'splashback', { cls: 'd-mute' }), T(X(700), Y(1850), 'overhead cabinet on a hanging rail', { cls: 'd-mute' }), T(X(700), Y(2045) - 12, 'nogging behind the sheet', { cls: 'd-mute' }));
  // B: wardrobe section
  const wx = 600, WX = (x) => wx + x * s;
  body.push(T(430, 100, 'B  Wardrobe section, 0.25 px per mm', { cls: 'd-bold' }));
  body.push(R(WX(-13), Y(2400), 13 * s, 2400 * s, 'd-board'), R(WX(-58), Y(2045), 45 * s, 90 * s, 'd-timber'), R(WX(0), Y(2030), 18 * s, 60 * s, 'd-timber'), R(WX(0), Y(2400), 600 * s, 16 * s, 'd-box'), R(WX(0), Y(1908), 520 * s, 16 * s, 'd-box'), R(WX(0), Y(150), 600 * s, 16 * s, 'd-box'));
  body.push(Circ(WX(300), Y(1720), 5, 'd-steel'), L(WX(0), Y(0), WX(660), Y(0), 'd-line'));
  body.push(T(WX(630), Y(2400) + 4, 'top, 600 deep', { cls: 'd-mute' }), T(WX(540), Y(1908) + 4, 'shelf', { cls: 'd-mute' }), T(WX(330), Y(1720) + 4, 'hanging rail', { cls: 'd-mute' }), T(WX(-130), Y(2045) - 10, 'nogging', { anchor: 'middle', cls: 'd-mute' }), T(WX(24), Y(2030) + 14, 'cleat into the nogging', { cls: 'd-mute' }));
  // C: limits
  body.push(T(40, 780, 'C  Limits in the BPC Guide to Standards and Tolerances 2026 (advisory)', { cls: 'd-bold' }));
  keyList(body, 40, 808, [['13.4', 'Cabinet doors and drawer fronts aligned with consistent gaps. Checked within 6 months. The guide gives no numeric gap.'], ['13.8', 'Benchtop joints uniform, close-fitted, in the same plane, and sealed or flush-filled. Checked within 6 months.'], ['13.9', 'Bench-to-wall junctions sealed with a matching flexible sealant. Sink and basin seals must not leak within 6 months.'], ['13.10', 'Porous cut edges sealed.'], ['', 'No wardrobe-specific clause was found. Heavy fittings go to the framing, not the sheet (Western Australian bulletin, 2017).']], 96, 52, 52);
  return svg(900, 1060, body.join(''), 'Kitchen run and wardrobe sections');
}

function orderDwg() {
  const body = [R(0, 0, 900, 900, 'd-bg')], blk = (x, y, w, h, lines) => { body.push(R(x, y, w, h, 'd-box', 6)); lines.forEach((t, i) => body.push(T(x + 12, y + 22 + i * 16, t, { cls: i ? 'd-mute' : 'd-bold' }))); };
  const A = 40, B = 450, W = 380;
  body.push(T(40, 40, 'Order of work from lining to the fixing stage', { cls: 'd-bold' }), T(A, 68, 'A  Doors, trims and stairs', { cls: 'd-bold' }), T(B, 68, 'B  Balustrades, joinery and checking', { cls: 'd-bold' }));
  blk(A, 84, W, 56, ['Delivery and set-out', 'Check the order. Story rod for the stair']); blk(A, 160, W, 56, ['Doors hung, architraves and skirting', 'Even gaps, then trims, then paint later']);
  blk(A, 236, W, 56, ['Stair built', 'Stringers, risers, treads, nosing strips']); blk(A, 312, W, 72, ['Stair measured', 'Every riser and going', 'Adjacent within 5 mm, flight within 10 mm']);
  for (const [y1, y2] of [[140, 160], [216, 236], [292, 312]]) body.push(arrow(A + W / 2, y1, A + W / 2, y2));
  blk(B, 84, W, 72, ['Balustrade and handrail', 'Posts bolted to the structure', '865 mm on the flight, 1 m on the landing']); blk(B, 176, W, 56, ['125 mm sphere test', 'Every opening']);
  blk(B, 252, W, 56, ['Kitchen and wardrobes', 'Levelled, fixed to framing, sealed']); blk(B, 328, W, 56, ['Inspect and list defects', 'Fix before painting and the final fix']);
  for (const [y1, y2] of [[156, 176], [232, 252], [308, 328]]) body.push(arrow(B + W / 2, y1, B + W / 2, y2));
  body.push(L(A + W, 348, 435, 348), L(435, 348, 435, 120), arrow(435, 120, B, 120));
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
  body.push(...wrapT(40, 740, 'The fixing stage is reached when all internal cladding, architraves, skirting, doors and built-in shelves are fitted and fixed, plus baths, basins, troughs, sinks, cabinets and cupboards. Stairs and balustrades are not named on that list. They are normally finished before the final inspection (Typical).', 112, 18));
  body.push(...wrapT(40, 824, 'Percentages are from the CAV payments page, last updated 9 July 2025. The Domestic Building Contracts Amendment Bill 2025 passed on 11 September 2025, so check the current page. The dashed boxes are figures this page read did not give.', 112, 18));
  return svg(900, 900, body.join(''), 'Order of work and payment stages');
}

export const drawings = [
  { id: 'order', title: 'Order of work and payment', scale: 'Flow, with the payment limits to scale', svg: orderDwg(),
    notes: ['Check the order on delivery, hang the doors, fix the trims, set out and build the stair, fix the balustrade, fit the kitchen and wardrobes, then inspect and list defects before painting.', 'The fixing stage is reached when every item on the CAV list is fixed. Plumbing and electrical fit-off and painting come later, but baths, basins, troughs and sinks are on the list, so confirm what counts with the contract.', 'The all-stages contract limits are base 10, frame 15, lock-up 35 and fixing 25 per cent. The page did not give a fixing percentage for a contract to build to fixing, or the remaining 15 per cent for an all-stages contract.', 'Stairs and balustrades are not named on the CAV fixing list. They are normally finished before the final inspection in Step 18 (Typical).'] },
  { id: 'stair', title: 'Stair geometry', scale: 'Elevation at 0.3 px per mm, limits chart at 3 px per mm of riser', svg: stairDwg(),
    notes: ['The sample stair has 6 risers of 185 mm and goings of 250 mm, which gives 2R + G = 620 mm, inside the 550 to 700 mm range.', 'Riser 115 to 190 mm, going 240 to 355 mm. Adjacent risers or goings differ by no more than 5 mm and the largest and smallest in a flight by no more than 10 mm.', 'A landing is at least 750 mm long and no steeper than 1:50. A tread surface is P3 or R10 dry and P4 or R11 wet, and a nosing strip P3 dry and P4 wet. AS 4586 was not opened.', 'The 11.2 page shows no edition and its figures are image-only. Headroom is in Part 10.3, which was not read.'] },
  { id: 'barrier', title: 'Balustrade heights and openings', scale: 'Elevation at 0.3 px per mm, sphere test at 1.6 px per mm', svg: barrierDwg(),
    notes: ['A continuous barrier is needed where it is possible to fall 1 m or more. It is at least 865 mm above the nosings on a flight and at least 1 m above the floor of a landing, balcony, deck or corridor.', 'No opening may let a 125 mm sphere pass, measured above the nosing line on a stair. Eight 12 mm balusters in a 1 m bay leave about 90 mm clear, and 112 mm pitch leaves 100 mm.', 'A handrail is needed on at least one side of a flight, full length, with its top at least 865 mm above the nosings, and a barrier top rail can serve if it can be grasped. The 11.3 page is cut off at 11.3.5.', 'Barriers are designed to AS/NZS 1170.1 loading. That Standard was not opened, so no load figures are given.'] },
  { id: 'door', title: 'Door, architrave and tolerances', scale: 'Elevation at 0.27 px per mm, section at 1.5 px per mm', svg: doorDwg(),
    notes: ['An 820 mm opening takes a 720 mm leaf, 32 mm jambs and 3 mm gaps with some packing. Sizes are typical, and the hardware maker and the plans set the real ones.', 'The BPC guide gives internal door gaps of 2 to 5 mm, a floor gap not more than 20 mm after floor coverings, and a 3 month period for binding and latches.', 'Architrave gaps over 1 mm within 12 months and skirting gaps over 2 mm within 24 months are outside tolerance if visible.', 'The BPC guide is advisory and applies from 1 August 2026.'] },
  { id: 'joinery', title: 'Kitchen and wardrobe sections', scale: 'Sections at 0.25 px per mm', svg: joineryDwg(),
    notes: ['The kitchen uses a 150 mm plinth, a 715 mm carcass and a 35 mm top for a 900 mm bench, with overheads 600 mm above it. Common sizes, not rules.', 'Overhead cabinets hang from a rail screwed through the sheet into a nogging. Heavy fittings are fixed to the framing, not to the sheet.', 'The BPC guide gives 6 months for cabinet front alignment, benchtop joints and bench-to-wall sealing, and wants porous cut edges sealed.', 'The wardrobe section shows the cleat, shelf and rail positions in the model. The joiner\'s drawings set the real ones.'] },
];

/* ---------- steps ---------- */
export const howto = [
  ['Check the order and store the joinery', 'Check doors, trims, cabinets, hardware and stair parts against the order and the plans when they arrive. Store them flat, dry and wrapped. Seal or paint all door edges, and seal porous cut edges on joinery before fixing.', 'Builder and carpenter', 'V', 'bpcTol26'],
  ['Check the frame is ready for fix-out', 'Confirm the noggings are in for handrails, cabinets, shelves and rails, and that you have photographs of them from before lining. Check the floor level where the stair or cabinets will stand.', 'Builder and carpenter', 'T'],
  ['Set out the stair', 'Measure the total rise from finished floor to finished floor and divide by the number of risers. The riser must be 115 to 190 mm and the going 240 to 355 mm, with 2R + G between 550 and 700 mm. Mark every riser on a story rod and check the result before cutting.', 'Carpenter or stair builder', 'V', 'nccHp112'],
  ['Hang the doors', 'Pack the jamb plumb and straight, fix through the packers, and hang the leaf with even gaps of 2 to 5 mm and no more than 20 mm at the floor after floor coverings. Seal or paint all edges. Fit the hinges and latch so the door does not bind.', 'Carpenter', 'V', 'bpcTol26'],
  ['Fix architraves and skirting', 'Fix the architraves over the jamb and the wall, set back a few millimetres from the jamb edge, then run the skirting up to them. Keep joints tight and faces flush, because gaps over 1 mm in architraves and 2 mm in skirting can be defects.', 'Carpenter', 'V', 'bpcTol26'],
  ['Build the stair', 'Fix the stringers, then the risers and treads, then the landing. Use closed risers, or check that no gap lets a 125 mm sphere pass. Fix slip-resistant nosing strips and make the landing at least 750 mm long and no steeper than 1:50.', 'Carpenter or stair builder', 'V', 'nccHp112'],
  ['Measure the stair', 'Measure every riser and going with a tape or stair gauge. Adjacent risers or goings may differ by no more than 5 mm, and the largest and smallest in the flight by no more than 10 mm. Fix any outliers before the balustrade goes on.', 'Builder and carpenter', 'V', 'nccHp112'],
  ['Fix the posts, rails and balusters', 'Bolt the posts to the structure, not only to the deck boards. Set the top rail at least 865 mm above the nosings on the flight and at least 1 m above the landing. Space the balusters so that no opening passes a 125 mm sphere, and make the handrail continuous and graspable.', 'Carpenter or balustrade maker', 'V', 'nccHp113'],
  ['Test the barrier', 'Try a 125 mm sphere or gauge in every opening, including above the bottom rail and beside the stringer. Check the heights with a tape and push on the posts. Ask the designer how the fixings are to be verified against AS/NZS 1170.1.', 'Builder', 'V', 'nccHp113'],
  ['Fit the kitchen', 'Set the base cabinets level on the plinth and screw them to the wall framing and to each other. Fit the benchtop with tight joints, seal the porous cut edges, and bead the wall junction with matching flexible sealant. Hang the overhead cabinets from a rail screwed into the noggings.', 'Joiner', 'V', 'bpcTol26'],
  ['Fix the wardrobe', 'Fix the cleats and carcass to the framing the carpenter blocked out, not to the plasterboard alone. Check the hanging rail and shelf are level, and adjust the door fronts for even gaps.', 'Joiner', 'V', 'waIb85'],
  ['Inspect and list defects', 'Open and close every door, look along each cabinet run, run the sphere and tape over the stair and barrier, and look from a normal viewing position of 1.5 m or more in diffused light. Keep a defect list with photographs, and have each item fixed before painting.', 'Builder', 'V', 'bpcTol26'],
  ['File the records and claim the stage correctly', 'File dockets, hardware and cabinet schedules, photographs and the surveyor\'s record. Do not claim the fixing stage until every item on the CAV list is fixed, including baths, basins, troughs and sinks.', 'Builder', 'V', 'cavPay'],
];

export const trades = [
  { t: 'Carpenter', role: 'Hangs doors, fixes architraves and skirting, builds the stair and fixes the balustrade, unless a stair maker supplies it.', when: 'After lining and before painting. Stairs before floor coverings', reg: 'Carpentry on a registered builder\'s job falls under the builder\'s contract. Check any trade licence rules before engaging someone directly. Not checked here.', ask: ['Door and hardware schedule against the plans', 'Stair set-out with the riser and going written down', 'Photographs of the post fixings before any cover goes on'] },
  { t: 'Joiner and cabinet maker', role: 'Makes and installs the kitchen, vanities and wardrobes, usually to the designer\'s drawings.', when: 'After lining and floor levels are set, before the final fix', reg: 'Registration rules for joinery were not checked. The builder is still responsible under the contract.', ask: ['Shop drawings approved before cutting', 'Who supplies the benchtop, handles and sealant', 'Sealed cut edges and the fixing method into the framing'] },
  { t: 'Stair and balustrade maker', role: 'Supplies and sometimes installs the stair, handrail and balustrade to the drawings and the NCC limits.', when: 'After the structure is ready and before floor coverings', reg: 'Barriers are designed to AS/NZS 1170.1 loading. Who certifies a proprietary balustrade was not checked. Ask the designer and the surveyor.', ask: ['A drawing showing riser, going, heights and openings', 'Post fixing details and the loads they were designed for', 'Whether treads and nosings come slip-tested'] },
  { t: 'Glazier', role: 'Supplies glass balustrade panels or glass infill where the design uses them.', when: 'After the posts or channels are in', reg: 'Glass and windows serving as barriers comply with H1D8, which was not read. Ask the glazier for the design basis.', ask: ['Glass type and thickness for the loading', 'Fixing channel or clamp design', 'Edge treatment and delivery protection'] },
  { t: 'Benchtop fabricator', role: 'Templates, cuts and installs stone, laminate or other benchtops.', when: 'After the cabinets are fixed and level', reg: 'Not checked.', ask: ['Template after the cabinets are in', 'Joint position and sealing', 'Cut-out edges sealed and the sink or cooktop fit'] },
  { t: 'Plumber, gasfitter and electrician', role: 'Connect the sink, cooktop, oven and rangehood after the cabinets and benchtop are in.', when: 'After the kitchen is fitted. Final fit-off follows in Step 15', reg: 'Plumbing, gas and electrical work needs a licence, so a builder cannot do it unless licensed (Steps 8 and 9).', ask: ['Rough-in positions checked against the cabinet drawings', 'Clearances from the manufacturer\'s instructions', 'Certificates of compliance and electrical safety certificates'] },
];

export const materials = [
  ['Internal doors', 'Flush doors, hollow or solid core, commonly 2040 mm high in widths of 720, 770, 820 and 870 mm', 'Hardware stores such as Bunnings and trade joinery suppliers (confirm sizes and stock)', 'T', 'The plans and the hardware schedule set sizes. Edges are sealed or painted.'],
  ['Door jambs and stops', 'Timber jamb sets, often pine or primed MDF, about 32 mm thick, cut to the wall thickness', 'Hardware stores and joinery suppliers', 'T', 'Jamb width must suit the wall plus both linings.'],
  ['Architraves and skirting', 'Primed MDF or finger-jointed pine in common profiles, such as 67 by 18 mm', 'Hardware stores and timber merchants', 'T', 'Profile and height are a design choice.'],
  ['Door hardware', 'Lever sets, latches, hinges, door stops and privacy locks', 'Hardware stores and hardware suppliers', 'T', 'Check the finish and the backset against the door.'],
  ['Stair timber', 'Stringers in sawn or engineered timber, treads in hardwood or engineered board, risers in primed board', 'Stair makers, timber merchants and joinery suppliers', 'T', 'Sections and spans are the stair builder\'s or engineer\'s design.'],
  ['Nosing strips and slip-resistant finishes', 'Aluminium or PVC nosings, and tread surfaces tested for slip resistance', 'Flooring and stair accessory suppliers', 'V', 'A tread surface is P3 or R10 dry and P4 or R11 wet, and a nosing strip P3 dry and P4 wet (AS 4586, not opened).'],
  ['Balustrade systems', 'Timber, steel, aluminium or glass balustrades, with posts, rails, balusters or infill panels', 'Balustrade makers, fabricators and hardware suppliers', 'T', 'Openings must not pass a 125 mm sphere. Loads follow AS/NZS 1170.1, which was not opened.'],
  ['Kitchen cabinets', 'Flat-pack or made-to-order carcasses, door fronts, drawers and hardware', 'Hardware stores for flat-pack, and joiners for custom', 'T', 'Drawings must show the services, the appliance sizes and the fixings.'],
  ['Benchtops', 'Laminate, engineered stone, timber or solid surface in common thicknesses', 'Benchtop fabricators and kitchen suppliers', 'T', 'Joints are close-fitted and sealed, and porous cut edges are sealed (BPC 13.8, 13.10).'],
  ['Sealant', 'Flexible sealant in a colour that matches the bench and wall', 'Hardware stores and trade suppliers', 'V', 'The bench-to-wall junction is sealed with a matching flexible sealant (BPC 13.9).'],
  ['Wardrobe fittings', 'Hanging rail, rail sockets, shelf pins, hinges or sliding tracks and handles', 'Hardware stores and joinery suppliers', 'T', 'Loads depend on the rail and the fixings. Fix to the framing, not the sheet.'],
];

export const quotes = [
  { who: 'Carpenter (doors, trims and stair)', n: '3', what: ['Door schedule, hardware and who supplies them', 'Architrave and skirting profile and the finish level for paint', 'Stair set-out, treads, nosing strips and the landing'] },
  { who: 'Joiner (kitchen, vanities and wardrobes)', n: '3', what: ['Shop drawings approved before cutting', 'Benchtop, splashback, handles and sealed edges', 'Appliance cut-outs, services and the fixing into the framing'] },
  { who: 'Stair and balustrade maker', n: '2', what: ['Drawing with riser, going, heights and openings', 'Post fixings and the design loads', 'Handrail shape, continuity and ends'] },
  { who: 'Benchtop fabricator', n: '2', what: ['Template visit after the cabinets are in', 'Thickness, edge profile and joint positions', 'Cut-outs, sealing and delivery protection'] },
  { who: 'Glazier (if a glass balustrade is used)', n: '2', what: ['Glass type and thickness for the loading', 'Fixing channels or clamps', 'Lead time and protection on site'] },
];

export const quoteTips = [
  'Ask for a door and hardware schedule in the quote, with sizes and who supplies the handles, hinges and stops. "Doors and trims" hides a lot of items.',
  'Ask the stair maker to write the riser and going on the quote, and to confirm that the flight complies with Part 11.2 as it applies to your permit.',
  'Ask for the balustrade heights, the opening size and the post fixing in the quote. These are the items a surveyor checks and a defect usually shows up in.',
  'Make the joiner supply shop drawings before cutting. Changes after the cabinets are made cost more than changes on a drawing.',
  'Put a callback period in writing. The BPC guide has limits of 3, 6, 12 and 24 months for different defects, so agree who returns and when.',
  'Keep the order of trades clear: stairs before floor coverings, cabinets before the benchtop, benchtop before the plumber and gasfitter.',
];

export const inspections = [
  ['Delivery check', 'Builder and carpenter', 'On delivery', 'Items match the order and plans, door edges are sealed or painted, and everything is stored flat and dry.', 'V', 'bpcTol26'],
  ['Stair set-out check', 'Builder and stair builder', 'Before cutting', 'Total rise divided by the number of risers gives a riser of 115 to 190 mm, a going of 240 to 355 mm and 2R + G of 550 to 700 mm.', 'V', 'nccHp112'],
  ['Door hanging check', 'Builder and carpenter', 'After hanging', 'Gaps are 2 to 5 mm and even, the floor gap is not more than 20 mm, edges are sealed, and the door neither binds nor jams.', 'V', 'bpcTol26'],
  ['Trim check', 'Builder and carpenter', 'After trims are fixed', 'Mitre and butt joints are tight, faces are flush and the skirting runs up to the architrave.', 'V', 'bpcTol26'],
  ['Stair dimension check', 'Builder', 'After the stair is built', 'Adjacent risers and goings differ by no more than 5 mm and the flight by no more than 10 mm. The landing is at least 750 mm long and no steeper than 1:50.', 'V', 'nccHp112'],
  ['Slip resistance check', 'Builder and surveyor', 'Before the surface is covered', 'Tread surfaces and nosing strips have the slip classification the plans call for.', 'C', 'nccHp112'],
  ['Barrier height and opening check', 'Builder', 'After the balustrade is fixed', 'Top rail at least 865 mm above the nosings on the flight and at least 1 m above the landing. A 125 mm sphere passes no opening.', 'V', 'nccHp113'],
  ['Handrail check', 'Builder', 'After the balustrade is fixed', 'A handrail is on at least one side of the flight for its full length, continuous and graspable.', 'C', 'nccHp113'],
  ['Kitchen joinery check', 'Builder and joiner', 'After the benchtop and cabinets are fitted', 'Fronts are aligned with consistent gaps, benchtop joints are tight and sealed, the wall junction is beaded and porous edges are sealed.', 'V', 'bpcTol26'],
  ['Wardrobe fixing check', 'Builder and joiner', 'After fixing', 'The carcass is screwed into framing, and rails, shelves and doors are level and aligned.', 'T'],
  ['Surveyor\'s view', 'Builder and building surveyor', 'Before the final inspection', 'Ask the surveyor which of the stair, barrier and joinery details they want to see, and keep the record. Joinery is not a named inspection stage.', 'T'],
];

export const exam = [
  ['What riser height is allowed on a stair other than a spiral stair?', '115 to 190 mm (NCC 2022 Part 11.2, Table 11.2.2a).', 'V', 'nccHp112'],
  ['What going is allowed on a stair other than a spiral stair?', '240 to 355 mm.', 'V', 'nccHp112'],
  ['What is the 2R + G rule?', 'Twice the riser plus the going must be between 550 and 700 mm.', 'V', 'nccHp112'],
  ['How many risers can a flight have?', 'At least 2 and not more than 18.', 'V', 'nccHp112'],
  ['When are risers and goings treated as constant?', 'When adjacent risers or goings differ by no more than 5 mm and the largest and smallest in the flight differ by no more than 10 mm.', 'V', 'nccHp112'],
  ['What opening limit applies between treads?', 'No opening may let a 125 mm sphere pass. Attic and storeroom stairs serving non-habitable rooms used infrequently are exempt.', 'V', 'nccHp112'],
  ['What are the limits for an attic or storeroom stair?', 'Riser 130 to 225 mm, going 215 to 355 mm, and 2R + G 540 to 700 mm (Table 11.2.2b).', 'V', 'nccHp112'],
  ['How many winders replace a quarter landing, and how many a half landing?', 'Up to 3 for a quarter landing and up to 6 for a half landing.', 'V', 'nccHp112'],
  ['Where is the going measured on a tapered tread?', 'At the middle of the width for treads 1 m wide or less, and 400 mm in from each side for wider treads.', 'V', 'nccHp112'],
  ['What is the minimum length of a landing?', '750 mm, or 600 mm where the stair serves non-habitable rooms only. It is no steeper than 1:50.', 'V', 'nccHp112'],
  ['When does a door threshold need a landing?', 'Where the door opens onto a stair or ramp with a change in level of more than 3 risers or 570 mm. The landing spans the full doorway width.', 'V', 'nccHp112'],
  ['What is the steepest allowed ramp?', '1:8, with landings at the top and bottom and at intervals of no more than 15 m. A driveway is not a ramp for this clause.', 'V', 'nccHp112'],
  ['What slip resistance does a stair tread need, and which Standard tests it?', 'P3 or R10 dry and P4 or R11 wet, tested to AS 4586.', 'V', 'nccHp112'],
  ['What slip resistance does a nosing or landing edge strip need?', 'P3 dry and P4 wet. A landing edge leading to a flight below also needs a compliant surface for at least 190 mm from the nosing, or a compliant nosing strip.', 'V', 'nccHp112'],
  ['Is there a minimum stair width in a Class 1 house?', 'The NCCB FAQ says no. The FAQ is undated and shows no state variation.', 'V', 'nccbStairFaq'],
  ['Where does a stair headroom figure come from?', 'The Part 11.2 page refers to Part 10.3. That page was not read, so confirm the figure there.', 'C', 'nccHp112'],
  ['When is a continuous barrier required?', 'Where it is possible to fall 1 m or more. Retaining walls are excluded unless part of a delineated access path.', 'V', 'nccHp113'],
  ['What is the barrier height on a stair?', 'At least 865 mm above the stair nosings.', 'V', 'nccHp113'],
  ['What is the barrier height on a landing, balcony, deck or corridor?', 'At least 1 m above the floor. 865 mm is acceptable at a landing where the barrier is on the inside edge and no longer than 500 mm.', 'V', 'nccHp113'],
  ['What opening limit applies to a barrier, and where is it measured on a stair?', 'No opening may let a 125 mm sphere pass, measured above the nosing line.', 'V', 'nccHp113'],
  ['What opening limit applies to a non-habitable stair barrier?', 'A 300 mm sphere, or top and intermediate rails with openings no more than 460 mm between rails.', 'V', 'nccHp113'],
  ['What extra rule applies where a fall exceeds 4 m?', 'Horizontal elements between 150 and 760 mm above the floor must not make the barrier easy to climb.', 'V', 'nccHp113'],
  ['How far can a face-mounted barrier sit from the edge face?', 'No more than 40 mm.', 'V', 'nccHp113'],
  ['What loading Standard applies to a barrier?', 'AS/NZS 1170.1. The Standard was not opened here.', 'V', 'nccHp113'],
  ['Where is a handrail required?', 'On at least one side of a flight or ramp, full length, with its top at least 865 mm above the nosings. The 11.3 page is cut off at 11.3.5, so read the clause.', 'C', 'nccHp113'],
  ['Can a barrier top rail serve as a handrail?', 'Yes, if it can be grasped and nothing obstructs the handhold. The page allows newel posts and ball stanchions.', 'C', 'nccHp113'],
  ['Can a handrail stop where its barrier stops?', 'Yes, per the NCCB FAQ.', 'V', 'nccbStairFaq'],
  ['What protection do openable bedroom windows 2 m or more above the surface beneath need?', 'A 250 N resistance to a sphere passing, or a child-resistant release where a device can be removed. None is needed if the openable part is at least 1.7 m above the floor.', 'V', 'nccHp113'],
  ['What internal door gaps does the BPC guide expect?', '2 to 5 mm and uniform, with the floor gap not more than 20 mm after floor coverings, checked within 3 months.', 'V', 'bpcTol26'],
  ['What are the BPC guide limits on door squareness and twist?', 'Out of square by more than 3 mm, or twisted by more than 5 mm (door up to 2400 by 920 mm), is out of tolerance.', 'V', 'bpcTol26'],
  ['How long do door furniture and binding limits run in the BPC guide?', 'Handles, locks and latches must operate as intended, and doors must not bind or jam, within 3 months.', 'V', 'bpcTol26'],
  ['What does the BPC guide say about door edges?', 'All door edges are sealed or painted.', 'V', 'bpcTol26'],
  ['What architrave and skirting gaps are out of tolerance?', 'Visible architrave mitre or butt gaps over 1 mm within 12 months (2 mm after), and skirting gaps over 2 mm within 24 months.', 'V', 'bpcTol26'],
  ['What does the BPC guide require of cabinet doors and drawer fronts?', 'Aligned with consistent gaps, checked within 6 months. It gives no numeric gap.', 'V', 'bpcTol26'],
  ['What does the BPC guide require at the bench-to-wall junction and at porous cut edges?', 'A matching flexible sealant at the junction, and porous cut edges sealed. Sink and basin seals must not leak within 6 months.', 'V', 'bpcTol26'],
  ['Are stair squeaks covered by the BPC guide?', 'Yes: squeaks within 24 months, including stairs (15.6). No separate stair or handrail tolerance was found in the sections read.', 'C', 'bpcTol26'],
  ['What is a normal viewing position in the BPC guide?', '1.5 m or more away in diffused, non-critical light, with 600 mm for appliances and fixtures and 3 m for glass.', 'V', 'bpcTol26'],
  ['What does the fixing stage include under the CAV page?', 'All internal cladding, architraves, skirting, doors and built-in shelves fitted and fixed, plus baths, basins, troughs, sinks, cabinets and cupboards.', 'V', 'cavPay'],
  ['What fixing percentage does the CAV page show for a contract covering all stages?', '25 per cent, with base 10, frame 15 and lock-up 35, which makes 85 per cent. Check the current page, because the 2025 amendment Act may change the limits.', 'V', 'cavPay'],
  ['Which livable housing level and start date apply to new Victorian houses?', 'Not confirmed. The pages read say new requirements will apply, but give no date or level for Victoria.', 'C', 'vbaNccGuide'],
];

export const sources = ['nccHp112', 'nccHp113', 'nccbStairFaq', 'nccVolH5', 'vbaNccGuide', 'vbaAccessNews', 'bpcTol26', 'vbaStdTol2015', 'waIb85', 'cavPay', 'cavAmend'];
export const caution = 'The stair and barrier rules here come from ABCB NCC 2022 web pages. The Part 11.2 and 11.3 pages show no edition or Victorian variation, the 11.2 figures are image-only, and the 11.3 page is cut off at 11.3.5 and carries a 2019 cross-reference. NCC 2025 applies in Victoria from 1 May 2026, so check the clause numbers and figures in the edition on your permit. AS 4586, AS/NZS 1170.1, AS 1288, AS 2688 and AS/NZS 4386.1 were not opened. The livable housing level and start date for Victoria are not confirmed. The BPC Guide to Standards and Tolerances 2026 is advisory, applies from 1 August 2026 and gives no stair or handrail tolerance beyond squeaks. The NCCB stair FAQ is undated. The archived 2015 VBA guide is older context only. The model uses typical door, cabinet and trim sizes, a 6-riser sample stair beside the house, and a kitchen layout and wardrobe that are illustrative. Bench heights are common sizes, not NCC rules.';

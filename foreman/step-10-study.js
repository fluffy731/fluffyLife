// Step 10 study content: drawings, steps, trades, materials, quotes, inspections and exam cards for wet areas and waterproofing.
// Flags: V = Verified against a source named in SOURCES, T = Typical practice, C = Confirm. AS 3740 and the membrane data sheets were not opened.
import { svg, T, L, R, C as Circ, P, dim, call, arrow } from './dwg.js';

const wrapT = (x, y, text, n, dy = 18, cls = 'd-mute') => { const out = []; let cur = ''; for (const w of text.split(' ')) { if ((cur + ' ' + w).trim().length > n) { out.push(cur); cur = w; } else cur = (cur + ' ' + w).trim(); } if (cur) out.push(cur); return out.map((t, i) => T(x, y + i * dy, t, { cls })); };

/* ---------- drawings ---------- */
function planDwg() {
  const s = 130, X = (x) => 110 + (x + 5.26) * s, Y = (z) => 80 + (z - 1.245) * s, body = [R(0, 0, 900, 780, 'd-bg')];
  const x0 = X(-5.26), x1 = X(-2.045), y0 = Y(1.245), y1 = Y(5.455), cx = X(-3.6), wy = Y(2.4), r = 1.5 * s;
  body.push(`<rect x="${x0}" y="${y0}" width="${x1 - x0}" height="${y1 - y0}" class="d-wfloor"/>`);
  // walls with the window gap in the west wall and the doorway gap in the east wall
  body.push(L(x0, y0, x1, y0, 'd-wall'), L(x0, y1, x1, y1, 'd-wall'), L(x0, y0, x0, Y(2.4), 'd-wall'), L(x0, Y(3.6), x0, y1, 'd-wall'), L(x1, y0, x1, Y(3.19), 'd-wall'), L(x1, Y(4.01), x1, y1, 'd-wall'));
  body.push(R(x0 - 4, Y(2.4), 8, Y(3.6) - Y(2.4), 'd-glass'));
  // membrane: to 1800 along the north wall and the west wall up to the window, a low upturn on the rest
  body.push(L(x0 + 8, y0 + 8, x1 - 8, y0 + 8, 'd-wm'), L(x0 + 8, y0 + 8, x0 + 8, Y(2.4), 'd-wm'));
  body.push(L(x0 + 8, Y(2.4), x0 + 8, y1 - 8, 'd-wm-thin'), L(x0 + 8, y1 - 8, x1 - 8, y1 - 8, 'd-wm-thin'), L(x1 - 8, y1 - 8, x1 - 8, Y(4.01), 'd-wm-thin'), L(x1 - 8, Y(3.19), x1 - 8, y0 + 8, 'd-wm-thin'));
  body.push(L(x1 - 1, Y(3.19), x1 - 1, Y(4.01), 'd-stopline'));
  // 1500 mm radius about the rose, drawn into the room
  body.push(`<path d="M${cx + r} ${y0} A${r} ${r} 0 0 1 ${cx - r} ${y0}" class="d-cut" fill="none"/>`);
  body.push(Circ(cx, wy, 8, 'd-steel'), Circ(cx, y0 + 10, 5, 'd-chair'));
  // falls toward the waste
  for (const [ax, az, bx, bz] of [[-2.3, 5.0, -3.35, 2.8], [-4.9, 5.0, -3.85, 2.8], [-2.3, 2.1, -3.25, 2.35], [-4.9, 2.0, -3.95, 2.3], [-2.3, 3.6, -3.3, 2.55]]) body.push(arrow(X(ax), Y(az), X(bx), Y(bz), 'd-line'));
  body.push(T(x0 + 14, y1 - 18, 'Fall to waste 1:80 to 1:50', { cls: 'd-mute' }), T(cx - 62, y0 + 34, 'rose', { cls: 'd-mute' }));
  body.push(dim(x0, y1 + 22, x1, y1 + 22, '3.2 m', 1));
  // callouts: bubbles on the right, the waste and window on the left
  body.push(call(3, cx - 90, y0 + 10, 572, 104), call(7, cx + 10, y0 + 10, 572, 168), call(4, cx + r * 0.7071, y0 + r * 0.7071, 572, 236), call(2, x1, Y(3.6), 572, 386), call(5, x1 - 8, Y(4.9), 572, 500), call(1, cx, wy, 56, 262), call(6, x0, Y(3.0), 56, 330));
  const key = [['1', 'Floor waste, with the membrane ending at or in its flange'], ['2', 'Doorway waterstop, membrane sealed to it'], ['3', 'Shower walls, membrane to 1800 mm above the floor substrate'], ['4', 'Unenclosed shower: floor waterproofed within 1500 mm of the rose'], ['5', 'Other walls: membrane up the wall (a low upturn, Typical)'], ['6', 'Window in the west wall, sill 900 mm'], ['7', 'Tap and shower arm penetrations in the north wall']];
  let ky = 100;
  for (const [n, t] of key) { const lines = wrapT(620, ky, t, 34, 15, ''); body.push(T(600, ky, n, { cls: 'd-bold' }), ...lines); ky += 15 * Math.max(1, Math.ceil(t.length / 34)) + 22; }
  body.push(T(40, 40, 'Bathroom plan, 3.2 m by 4.2 m, as in the model', { cls: 'd-bold' }));
  body.push(...wrapT(40, 700, 'Typical, drawn from the model. The 1500 mm radius applies to an unenclosed shower. Wall heights and upturns follow the endorsed drawings, the membrane data sheet and the clause text. AS 3740 was not opened.', 112, 18));
  return svg(900, 780, body.join(''), 'Bathroom waterproofing plan');
}

function junctionDwg() {
  const body = [R(0, 0, 900, 740, 'd-bg')], fx = 300, fy = 440;   // wall face at x = 300, screed surface at y = 440
  const Q = (pts, cls) => P(pts.map(([x, y]) => [fx + x, fy - y]), cls);          // points in wall-face / floor-surface coordinates
  const cc = (o) => 44.6 + 0.414 * o;                                              // keeps each coat parallel to the fillet
  const lay = (cls, o, c, run = 600) => `<path d="M${fx + run} ${fy - o} L${fx + c} ${fy - o} L${fx + o} ${fy - c} L${fx + o} 110" class="${cls}" fill="none"/>`;
  body.push(R(120, fy + 30, 700, 70, 'd-conc'), R(fx, fy, 520, 30, 'd-slabfill'));
  body.push(R(200, 110, 84, fy + 30 - 110, 'd-timber'), R(284, 110, 16, fy + 30 - 110, 'd-sheet'));
  body.push(Q([[820 - fx, 33], [58.2, 33], [33, 58.2], [33, 330], [23, 330], [23, 54.1], [54.1, 23], [820 - fx, 23]], 'd-adh'));
  body.push(R(fx + 63, fy - 55, 457, 22, 'd-tilef'), R(fx + 33, 110, 22, fy - 110 - 58.2, 'd-tilef'));
  body.push(lay('d-s-prim', 2, 2, 520));
  body.push(`<path d="M${fx + 70} ${fy - 5} L${fx + 5} ${fy - 5} L${fx + 5} ${fy - 70}" class="d-s-tape" fill="none"/>`);
  body.push(Q([[3, 3], [46, 3], [3, 46]], 'd-sealant'));
  body.push(lay('d-s-m1', 8, cc(8), 520), `<path d="M${fx + 100} ${fy - 14} L${fx + cc(14)} ${fy - 14} L${fx + 14} ${fy - cc(14)} L${fx + 14} ${fy - 100}" class="d-s-fab" fill="none"/>`, lay('d-s-m2', 20, cc(20), 520));
  body.push(Circ(fx + 59, fy - 57, 6, 'd-seal'));
  // wall run labels along the top, floor run labels to the right and below
  body.push(call(1, 292, 150, 226, 62), call(3, fx + 2, 130, 268, 62), call(6, fx + 8, 130, 310, 62), call(7, fx + 14, 130, 352, 62), call(8, fx + 20, 130, 394, 62), call(9, fx + 44, 130, 436, 62));
  body.push(call(10, fx + 59, fy - 57, 700, 150), call(5, fx + 10, fy - 10, 316, 560), call(4, fx + 62, fy - 5, 372, 560), call(2, 520, fy + 14, 440, 560));
  body.push(T(40, 40, 'Wall and floor junction, layer by layer', { cls: 'd-bold' }), T(660, fy - 80, 'Floor tile', { cls: 'd-mute' }));
  body.push(...wrapT(40, 612, '1 wet-area sheet and frame  2 screed on slab, to fall  3 primer  4 bond breaker tape  5 sealant fillet  6 membrane, first coat  7 reinforcing bandage  8 membrane, second coat  9 tile adhesive and tile  10 flexible sealant joint', 112, 18));
  body.push(...wrapT(40, 690, 'Layers are drawn about five times thicker than real, and every coat is thin. Types, thicknesses and cure times come from the system data sheet, which was not opened here.', 112, 18));
  return svg(900, 740, body.join(''), 'Wall and floor junction build-up');
}

function showerDwg() {
  const body = [R(0, 0, 900, 800, 'd-bg')];
  body.push(R(120, 560, 740, 60, 'd-conc'), R(200, 540, 300, 20, 'd-slabfill'), R(500, 506, 360, 54, 'd-slabfill'));
  body.push(R(150, 90, 26, 470, 'd-timber'), R(176, 90, 24, 450, 'd-sheet'));
  body.push(R(206, 140, 12, 380, 'd-tilef'), R(544, 490, 316, 13, 'd-tilef'));
  body.push(P([[204, 537], [204, 520], [350, 527], [496, 520], [496, 537]], 'd-tilef'));
  body.push(`<path d="M203 150 L203 537 L497 537 L497 503 L700 503" class="d-wm" fill="none"/>`);
  body.push(R(500, 484, 5, 22, 'd-steel'), R(500, 502, 44, 4, 'd-steel'));
  body.push(R(470, 80, 7, 440, 'd-glass'), R(338, 523, 24, 5, 'd-steel'));
  body.push(L(203, 150, 470, 150, 'd-cut'), dim(135, 150, 135, 537, '1800 min above the floor substrate', 1));
  body.push(L(496, 520, 640, 520, 'd-ground'), L(560, 490, 640, 490, 'd-ground'), dim(640, 490, 640, 520, '', 1), T(652, 510, '25 min step-down', { cls: 'd-mute' }));
  body.push(call(1, 188, 220, 170, 62), call(7, 330, 150, 340, 100), call(5, 470, 240, 410, 240), call(6, 350, 524, 350, 450), call(4, 502, 490, 580, 440), call(3, 497, 520, 497, 650), call(2, 300, 550, 300, 650));
  body.push(T(40, 40, 'Shower area with a step-down (schematic, not to scale)', { cls: 'd-bold' }), T(220, 480, 'Shower floor falls to the waste', { cls: 'd-mute' }), T(620, 470, 'Outside floor', { cls: 'd-mute' }), T(512, 476, '5 min above FFL', { cls: 'd-mute' }));
  body.push(...wrapT(40, 686, '1 wet-area sheet, frame and the membrane up the wall  2 floor substrate and screed to fall  3 step-down edge, membrane turned up  4 waterstop, vertical leg at least 5 mm above finished floor level  5 screen at the step  6 floor waste and flange  7 line at 1800 mm', 112, 18));
  body.push(...wrapT(40, 744, 'Not to scale. Figures come from the ABCB Housing Provisions Part 10.2 page, a partial extract: walls 1800 mm, step-down 25 mm, waterstop leg 5 mm. Confirm against the clause text and the endorsed drawings.', 112, 18));
  return svg(900, 800, body.join(''), 'Shower area section schematic');
}

function flowDwg() {
  const body = [R(0, 0, 900, 700, 'd-bg')], blk = (x, y, w, h, lines) => { body.push(R(x, y, w, h, 'd-box', 6)); lines.forEach((t, i) => body.push(T(x + 12, y + 22 + i * 16, t, { cls: i ? 'd-mute' : 'd-bold' }))); };
  const A = 40, B = 470, W = 360;
  body.push(T(40, 40, 'Waterproofing sequence and the record', { cls: 'd-bold' }), T(A, 68, 'A  Prepare', { cls: 'd-bold' }), T(B, 68, 'B  Apply, test and record', { cls: 'd-bold' }));
  blk(A, 84, W, 56, ['Plan the wet areas, agree the system', 'Waterproofer, plumber, plasterer, tiler together']); blk(A, 170, W, 56, ['Sheets fixed, screed laid to fall', 'Fall checked with a level on the substrate']);
  blk(A, 256, W, 56, ['Waste flange, waterstop, tap flanges fixed', 'Backing in place, penetrations capped']); blk(A, 342, W, 72, ['Check the substrate', 'Smooth, clean, dry, no voids', 'Moisture measured before coating']);
  for (const [y1, y2] of [[140, 170], [226, 256], [312, 342]]) body.push(arrow(A + W / 2, y1, A + W / 2, y2));
  blk(B, 84, W, 56, ['Primer, then bond breaker and fillets', 'Every angle, wall to floor, movement joints']); blk(B, 170, W, 56, ['First thin coat, bandage at angles and pipes', 'Not one thick coat']);
  blk(B, 256, W, 56, ['Second coat, shower walls to 1800 mm', 'Dry film thickness checked']); blk(B, 342, W, 72, ['Look before it is covered', 'Pinholes, thickness, fillets, transitions,', 'bonding, termination heights, waterstop']);
  blk(B, 444, W, 56, ['Cure, then flood test', 'Dam, flood to a marked level, watch for a drop']); blk(B, 530, W, 72, ['Record and hand over', 'Product and batch, photos, test log,', 'installer record, warranty; protect the membrane']);
  for (const [y1, y2] of [[140, 170], [226, 256], [312, 342], [414, 444], [500, 530]]) body.push(arrow(B + W / 2, y1, B + W / 2, y2));
  body.push(L(A + W, 378, 435, 378), L(435, 378, 435, 112), arrow(435, 112, B, 112));
  body.push(...wrapT(40, 640, 'Waterproofing is not a mandatory inspection stage. The building surveyor can ask to see it as an additional inspection (MI 01). Test method, cure times and coat counts come from AS 3740 and the system data sheet, neither of which was opened.', 112, 18));
  return svg(900, 700, body.join(''), 'Waterproofing sequence flow');
}

export const drawings = [
  { id: 'plan', title: 'Bathroom plan', scale: 'Plan, 150 px per metre', svg: planDwg(),
    notes: ['The bathroom floor falls to the waste. The membrane covers the whole floor, runs up the walls and is sealed at the doorway. Callout numbers match the key.', 'The orange dashed arc is the 1500 mm radius that applies to an unenclosed shower. The thick blue line is the membrane to 1800 mm on the shower walls, and the thin line is a low upturn on the other walls (a typical figure; check the data sheet).', 'Figures come from the ABCB Part 10.2 page extract and the BPC page. AS 3740 was not opened.'] },
  { id: 'junction', title: 'Junction build-up', scale: 'Large scale, layers exaggerated', svg: junctionDwg(),
    notes: ['A section through a wall and floor angle, showing each layer from the sheet and screed out to the tile and the flexible joint. Callout numbers match the 3D detail.', 'Bond breakers are required at wall to wall, wall to floor and hob to wall junctions, and at movement joints where the membrane is bonded. The fillet gives the membrane an easy curve.', 'Thicknesses are drawn about five times real. Types and thicknesses come from the system data sheet.'] },
  { id: 'shower', title: 'Shower area section', scale: 'Schematic, not to scale', svg: showerDwg(),
    notes: ['The shower walls carry the membrane to at least 1800 mm above the floor substrate. A step-down of at least 25 mm holds the water in, and the waterstop is at or above finished floor level.', 'An unenclosed shower waterproofs the floor within 1500 mm of the rose, and has a waterstop at that radius.', 'Which details apply depends on whether the shower has a hob, a step-down or a screen. Confirm against the clause text.'] },
  { id: 'flow', title: 'Sequence and record', scale: 'Flow diagram', svg: flowDwg(),
    notes: ['Two flows: preparing the substrate and fittings, then applying, checking, testing and recording the membrane.', 'The visual check before any finish is covered is the most useful single inspection you can do.', 'Keep the record. It is your evidence if a leak shows up later.'] },
];

/* ---------- study content ---------- */
export const howto = [
  ['Decide the wet areas and the compliance route', 'List every wet area on the plans: bathroom, ensuite, laundry, toilet with a bidet spray. Find out from the designer or surveyor whether the design follows Housing Provisions Part 10.2 in full or Part 10.2.1 to 10.2.6 and 10.2.12 plus AS 3740.', 'Builder', 'V', 'nccbWet'],
  ['Agree one waterproofing system', 'Choose a system from one maker: primer, membrane, bond breaker, sealant and reinforcing, with its data sheet. Check the tile adhesive is compatible with it.', 'Builder and waterproofer', 'V', 'bpcWet'],
  ['Hold a pre-start with the trades', 'Meet the waterproofer, plumber, plasterer and tiler. Agree the flange heights, the waterstop position, the mixer positions, the hob or step-down and who fixes and seals what.', 'Builder', 'T'],
  ['Fix the wet-area sheet', 'Use a water-resistant sheet from the NCC list, fixed to the maker\'s spacing, with the cut edges and joints sealed as the maker says. Leave the openings clear.', 'Plasterer', 'V', 'nccHp102'],
  ['Screed to falls and check', 'Lay the screed to fall to the waste at between 1:80 and 1:50. Check the fall with a level and a straight edge before the waterproofer starts.', 'Screeder or tiler', 'V', 'bpcWet'],
  ['Fix the waste flange, waterstops and flanges', 'Set the waste flange to suit the tile bed, fix the doorway waterstop at floor level and fix a flange or detail at each tap and shower arm.', 'Plumber and waterproofer', 'V', 'nccHp102'],
  ['Prepare the substrate', 'Clean it and remove dust. Measure the moisture and wait if it is too wet. Fill voids, remove protrusions and check the sheets are sound.', 'Waterproofer', 'V', 'bpcWet'],
  ['Prime, tape and fillet', 'Prime to the data sheet. Fit bond breaker tape into every wall to wall, wall to floor and hob to wall angle, and at movement joints, then run a sealant fillet.', 'Waterproofer', 'V', 'nccHp102'],
  ['Apply the membrane in thin coats', 'Apply the first coat across the floor, up the walls and over the junctions, press bandage into the angles and around pipes, then apply the second coat in the other direction. Carry the shower walls up to at least 1800 mm.', 'Waterproofer', 'V', 'bpcWet'],
  ['Inspect before anything covers it', 'Walk the whole membrane with the waterproofer. Check pinholes, thickness, fillets, transitions, bonding, termination heights and the waterstop. Photograph it.', 'Builder and waterproofer', 'V', 'bpcWet'],
  ['Cure and flood test', 'Let the membrane cure as the maker says. Dam the doorway, flood the floor to a marked level, log the start time and check the level and the room below after the test period.', 'Waterproofer and builder', 'C'],
  ['Record, protect and hand to the tiler', 'File the product and batch details, photographs, test log and the installer\'s record. Protect the membrane with board and tell the tiler not to cut or drill into it.', 'Builder', 'T'],
];

export const trades = [
  { t: 'Waterproofer', role: 'Prepares the substrate, primes, fits bond breakers and fillets, applies the membrane in thin coats, flood tests and gives a record.', when: 'After the sheets and screed, before the tiles', reg: 'Victoria has no separate waterproofing licence in the pages read here; the builder carries the statutory warranty. Ask for experience, insurance and the maker\'s approval.', ask: ['Which system and which data sheet', 'Number of coats and cure times', 'Flood test included and who attends', 'Installer record and warranty provided'] },
  { t: 'Plasterer or wet-area sheet fixer', role: 'Fixes water-resistant wall sheet in the wet areas and seals the cut edges and joints.', when: 'After the plumber\'s rough-in, before the waterproofer', reg: 'Trade contractor with insurance', ask: ['Sheet type and brand', 'Fixing spacing as per the maker', 'Who seals the joints', 'Openings left clear for flanges'] },
  { t: 'Screeder or tiler', role: 'Lays the screed to fall to the waste, and later tiles over the membrane.', when: 'Screed before the waterproofing, tiles after the flood test', reg: 'Trade contractor with insurance', ask: ['Fall and flange height agreed', 'Who checks the fall', 'Tile adhesive compatible with the membrane'] },
  { t: 'Plumber', role: 'Sets the waste, fits flanges and stubs at the taps and the shower arm, and fits off the taps and the grate afterwards.', when: 'Rough-in in Step 8 and fit-off in Step 15', reg: 'Licensed plumber. A compliance certificate is needed for plumbing work worth $750 or more.', ask: ['Flange type and height', 'Stub positions fixed to backing', 'Fit-off without drilling the membrane'] },
  { t: 'Glazier', role: 'Supplies and fits the shower screen after the tiles.', when: 'After tiling', reg: 'Trade contractor with insurance', ask: ['Channel or flush fixing', 'Seal at the bottom', 'No fixings through the waterstop'] },
  { t: 'Building surveyor (RBS)', role: 'May require an additional inspection of the waterproofing under section 35, and checks the work at final inspection.', when: 'Before the membrane is covered', reg: 'Registered building surveyor (BPC)', ask: ['Do they want to see the membrane', 'What record they expect at final'] },
];

export const materials = [
  ['Wet-area sheet', 'Compressed fibre-cement or water-resistant plasterboard, from the NCC list of water-resistant wall materials', 'Plasterboard or building supplier. Bunnings stocks some sheet (confirm the range)', 'V', 'The sheet type must match the system. Ask the membrane maker.'],
  ['Screed', 'Cement screed or a proprietary levelling mix laid to fall', 'Building supplier or tiler supplies', 'T', 'Order the mix the tiler specifies.'],
  ['Primer', 'The primer named in the system data sheet', 'Waterproofing supplier or maker', 'C', 'Primers are product specific, so do not substitute.'],
  ['Liquid membrane', 'A membrane that complies with AS/NZS 4858, applied in thin coats', 'Waterproofing supplier or maker. Examples of makers include Ardex, Davco, Sika and Mapei (confirm the range)', 'V', 'AS/NZS 4858 is cited on the BPC page. Check the product is rated for wet areas.'],
  ['Bond breaker tape', 'Tape that suits the membrane\'s flexibility class', 'Waterproofing supplier', 'V', 'The NCC page says the type must suit the flexibility class.'],
  ['Sealant for fillets and joints', 'Flexible, mould-resistant sealant compatible with the membrane', 'Waterproofing supplier', 'V', 'Sealants must be flexible and compatible with adjacent materials.'],
  ['Reinforcing bandage', 'A fabric strip for angles and penetrations', 'Waterproofing supplier', 'T', 'Use the maker\'s bandage if the system has one.'],
  ['Waste flange, waterstop angle and tap flanges', 'A drainage flange, a metal waterstop angle and proprietary flanges for the stubs', 'Plumbing or waterproofing supplier', 'V', 'The waterstop and flange details are from the ABCB page. Check the product suits the tile bed.'],
  ['Flood test dam and board', 'A temporary dam, a marking pen and board to protect the membrane', 'Waterproofer supplies', 'T', 'Ask the waterproofer to leave the protection board.'],
];

export const quotes = [
  { who: 'Waterproofer', n: '3', what: ['Areas, coats and wall heights, shown by room', 'System and data sheet named', 'Flood test, installer record and warranty included'] },
  { who: 'Plasterer (wet-area sheet)', n: '3', what: ['Sheet type and areas', 'Joints and edges sealed by whom', 'Openings left for flanges'] },
  { who: 'Screeder or tiler (screed to falls)', n: '2', what: ['Fall and thickness range', 'Who checks the fall', 'Cure time before the waterproofer starts'] },
  { who: 'Plumber (flanges and stubs)', n: '2', what: ['Flanges and stub positions', 'Waste flange height', 'Fit-off timing and who protects the membrane'] },
  { who: 'Glazier (shower screen)', n: '3', what: ['Frameless or framed, channel or flush', 'Seal at the bottom', 'Fixing details that do not pierce the waterstop'] },
];
export const quoteTips = [
  'Ask the waterproofer to price each room separately, and to say which walls go to 1800 mm. Vague quotes for "bathroom waterproofing" are how a shower wall gets missed.',
  'Ask for the system data sheet before you sign. If the product, the coats and the cure time are not on the quote, they are not promised.',
  'Check that the flood test, the installer\'s record and the photographs are included, and who attends the test. They are part of the job, not extras.',
  'Ask what happens if the flood test fails: who repairs it, who pays for a repeat and how long it takes. Put it in writing.',
  'Do not accept a waterproofer who offers to skip the flood test to save time. The cost of a failed bathroom after tiling is many times the saving.',
  'Keep every quote, data sheet, photograph and certificate. They are evidence of estimating and supervision for the BPC application.',
];

export const inspections = [
  ['Compliance route check', 'Builder', 'Before quoting', 'Plans show the wet areas and the route (Part 10.2 in full, or 10.2.1 to 10.2.6 and 10.2.12 with AS 3740).', 'V', 'nccbWet'],
  ['Sheet and substrate check', 'Builder and plasterer', 'Before the waterproofer starts', 'Sheets fixed, joints sealed as the maker says, surface smooth, clean, dry and sound.', 'V', 'bpcWet'],
  ['Fall check', 'Builder and screeder', 'Before the waterproofer starts', 'Fall to the waste between 1:80 and 1:50, no ponding, flange at the right height.', 'V', 'bpcWet'],
  ['Flange and waterstop check', 'Builder and plumber', 'Before the membrane', 'Waste flange set, doorway waterstop fixed with its leg at the right height, tap flanges and backing fixed.', 'V', 'nccHp102'],
  ['Substrate moisture check', 'Waterproofer', 'Before priming', 'Moisture measured and within the data sheet limit.', 'V', 'bpcWet'],
  ['Bond breaker and fillet check', 'Waterproofer and builder', 'Before the first coat', 'Bond breaker in every angle and movement joint, fillets sealed.', 'V', 'nccHp102'],
  ['Visual membrane inspection', 'Waterproofer and builder', 'Before any finish', 'Pinholes, dry film thickness, fillets, transitions, bonding, termination heights and waterstop location.', 'V', 'bpcWet'],
  ['Surveyor inspection (if required)', 'RBS', 'Before the tiles', 'Waterproofing is not a mandatory stage, but the surveyor can require an additional inspection under section 35.', 'V', 'bpcMI01'],
  ['Flood test', 'Waterproofer and builder', 'After the cure time', 'Level marked, start time logged, no drop and no damp below. Test level and time to be confirmed.', 'C'],
  ['Record and warranty collection', 'Builder', 'Before the tiler starts', 'Product, batch, photographs, test log and the installer\'s record on file. Statutory warranty position understood.', 'V', 'hiaWet'],
];

export const exam = [
  ['Why are wet areas waterproofed?', 'To protect the building elements in wet areas from water. Building elements in wet areas within a building must be protected with a waterproofing system.', 'V', 'nccHp102'],
  ['Which NCC provisions apply to wet areas in a house in NCC 2022?', 'Performance Requirement H4P1, with the deemed-to-satisfy H4D2 (where protection is needed) and H4D3 (materials and installation), supported by Housing Provisions Part 10.2.', 'V', 'nccbWet'],
  ['What are the two compliance options for a house?', 'Option 1: Housing Provisions Part 10.2 in full (10.2.1 to 10.2.32). Option 2: Part 10.2.1 to 10.2.6 and 10.2.12, plus AS 3740.', 'V', 'nccbWet'],
  ['Which edition of AS 3740 does the NCCB page say to use with NCC 2022?', 'AS 3740:2021.', 'V', 'nccbWet'],
  ['How high must the membrane go on the walls of a shower area?', 'Not less than 1800 mm above the floor substrate.', 'V', 'nccHp102'],
  ['What is the minimum width of waterproofing either side of a wall junction in the shower area?', 'Not less than 40 mm either side of the junction.', 'V', 'nccHp102'],
  ['What are the minimum and maximum falls to a floor waste?', '1:80 minimum and 1:50 maximum.', 'V', 'bpcWet'],
  ['What is the minimum step-down for a step-down shower?', 'At least 25 mm below the outside finished floor level.', 'V', 'nccHp102'],
  ['What materials may a shower hob be built from?', 'Masonry, concrete, autoclaved aerated concrete or extruded polyurethane foam. Timber must not be used.', 'V', 'nccHp102'],
  ['How far from the rose must the waterstop be at an unenclosed shower?', 'A minimum horizontal distance of 1500 mm from the shower rose.', 'V', 'nccHp102'],
  ['Within what radius is the floor waterproofed at an unenclosed shower?', '1500 mm horizontal radius from the shower rose connection.', 'V', 'bpcWet'],
  ['What is the minimum height of the waterstop leg at an enclosed hobless shower with a screen?', 'Not less than 5 mm above finished floor level.', 'V', 'nccHp102'],
  ['What are the minimum sizes of a perimeter flashing?', 'The vertical leg at least 25 mm above finished floor level, except across doorways, and the horizontal leg at least 50 mm wide.', 'V', 'nccHp102'],
  ['Where are bond breakers required?', 'At all wall to wall, wall to floor and hob to wall junctions, and at movement joints where the membrane is bonded to the substrate.', 'V', 'nccHp102'],
  ['What must a bond breaker match?', 'The membrane\'s flexibility class.', 'V', 'nccHp102'],
  ['How should a liquid membrane be applied, and why?', 'In multiple thin coats. A single thick coat can trap air and cause pinholes.', 'V', 'bpcWet'],
  ['Which Standard must wet-area membranes comply with?', 'AS/NZS 4858 (the BPC page cites the 2004 edition).', 'V', 'bpcWet'],
  ['What must be true of the substrate before the membrane goes on?', 'Smooth, clean, dry and dust-free, with no protrusions or voids, and its moisture measured.', 'V', 'bpcWet'],
  ['What must be inspected before any finish is applied?', 'Pinholes, dry film thickness, fillets, transitions, bonding, vertical termination heights and waterstop location.', 'V', 'bpcWet'],
  ['How must tap and shower penetrations be sealed?', 'With sealants, proprietary flange systems or a combination. The tap spindle housing must be removable to replace the washer.', 'V', 'nccHp102'],
  ['What must happen to the membrane at a drainage flange?', 'It must terminate at or in the flange.', 'V', 'nccHp102'],
  ['What must be waterproofed on a recessed soap holder?', 'Recessed soap holders (niches) and mechanical fixings must be waterproofed.', 'V', 'nccHp102'],
  ['Is waterproofing a mandatory inspection stage in Victoria?', 'No. Under MI 01 it is an example of an additional inspection the building surveyor may require under section 35 of the Building Act 1993, not a mandatory stage under section 33.', 'V', 'bpcMI01'],
  ['What is the builder\'s obligation after waterproofing work?', 'To provide a statutory warranty for all waterproofing work undertaken, according to the HIA page.', 'V', 'hiaWet'],
];

/* ---------- sources and caution ---------- */
export const sources = ['nccHp102', 'bpcWet', 'nccbWet', 'hiaWet', 'bpcMI01', 'vbaWet', 'vbaWetFs', 'bpcWetFaq', 'buildingLegal', 'hiaNcc25'];
export const caution = 'Wet-area rules here come from the ABCB\'s NCC 2022 Housing Provisions Part 10.2 web page (a partial extract whose clause numbers are inferred and whose edition is not stated), the BPC and NCCB wet-area pages and a paywalled HIA page. The VBA waterproofing page, the VBA fact sheet and the BPC wet-area FAQ would not load and were not read. AS 3740, AS/NZS 4858 and the membrane data sheets were not opened, so coat counts, thicknesses, cure times and the flood test method are Typical or Confirm. The sources read differ on whether a floor waste is required, so check the clause. A law firm article is cited for liability periods and is a secondary source. The model layout is typical: the wet-area sheet, falls and door position are added for illustration, and the doorway at the south-east corner of the Step 3 frame is simply covered.';

// Step 16 study content: drawings, steps, trades, materials, quotes, inspections and exam cards for bushfire and fire safety.
// Flags: V = Verified against a source named in SOURCES, T = Typical practice, C = Confirm. Read on 9 November 2026: the VBA and BPC bushfire pages, the Planning Victoria and CFA pages, the HIA overview of AS 3959:2018,
// a Lysaght page, a Geoscience Australia page, a council BAL form and a council construction page. AS 3959 itself is paywalled and was NOT opened, so the distance tables, mesh sizes, gap limits, glass and door rules for each BAL are Typical or Confirm.
// The council form and the Geoscience Australia page describe AS 3959-2009, and the BPC says assessments follow AS 3959-2018, so the method is described here and the numbers are left to the current Standard.
// The CFA says VC248 changed Clauses 13.02, 44.06 and 53.02 on 5 May 2026, so planning detail may have moved. The BAL, vegetation, distances and fittings in the model are illustrative and are not a real assessment.
import { svg, T, L, R, C as Circ, P, dim, call, arrow } from './dwg.js';
import { WALLS } from './frame.js';
import { ALARMS } from './elec.js';

const wrapT = (x, y, text, n, dy = 18, cls = 'd-mute') => { const out = []; let cur = ''; for (const w of text.split(' ')) { if ((cur + ' ' + w).trim().length > n) { out.push(cur); cur = w; } else cur = (cur + ' ' + w).trim(); } if (cur) out.push(cur); return out.map((t, i) => T(x, y + i * dy, t, { cls })); };
const keyList = (body, x, y, items, n, step, off = 20) => items.forEach(([k, t], i) => { body.push(T(x, y + i * step, k, { cls: 'd-bold' }), ...wrapT(x + off, y + i * step, t, n, 16, '')); });

/* ---------- drawings ---------- */
function balDwg() {
  const body = [R(0, 0, 900, 1090, 'd-bg')];
  body.push(T(40, 40, 'The BAL site assessment, step by step', { cls: 'd-bold' }), T(40, 68, 'A  The five steps of Method 1 (as described for AS 3959-2009: confirm the method and tables in the edition your permit uses)', { cls: 'd-bold' }));
  const steps = [['1  FDI', ['Fire Danger Index for', 'the place. Victoria:', '100 general, 50 alpine']], ['2  Vegetation', ['Classify the vegetation', 'in each direction:', 'Groups A to G']], ['3  Distance', ['Horizontal distance from', 'the building to each', 'classified vegetation']], ['4  Slope', ['Effective slope under the', 'vegetation, relative to', 'the building']], ['5  BAL table', ['Read the BAL from the', 'AS 3959 table. The', 'highest result applies']]];
  steps.forEach(([h, ls], i) => { const x = 40 + i * 167; body.push(R(x, 84, 150, 112, 'd-box', 6), T(x + 12, 108, h, { cls: 'd-bold' }), ...ls.map((t, k) => T(x + 12, 132 + k * 18, t, { cls: 'd-mute' }))); if (i < 4) body.push(arrow(x + 150, 140, x + 167, 140)); });
  body.push(...wrapT(40, 224, 'Vegetation more than 100 m away is BAL-Low. Where there is more than one type of vegetation each is classified separately and the worst case applies. Low-threat vegetation (managed lawns, orchards, golf courses) and non-vegetated areas are excluded. The method is not valid where the effective slope is more than 20 degrees downslope.', 112, 16));
  // B: plan
  body.push(T(40, 320, 'B  Plan: what is measured (illustrative, not to scale)', { cls: 'd-bold' }));
  body.push(R(60, 340, 480, 70, 'd-ins2'), T(80, 380, 'Classified vegetation: Group A, forest', { cls: 'd-bold' }));
  body.push(R(180, 500, 240, 230, 'd-lot'), R(220, 560, 160, 120, 'd-house'), T(300, 628, 'House', { anchor: 'middle', cls: 'd-bold' }));
  body.push(L(300, 410, 300, 560, 'd-cut'), arrow(300, 470, 300, 410), arrow(300, 500, 300, 560));
  body.push(T(318, 462, 'Distance, measured horizontally', { cls: '' }), T(318, 482, 'from the building to the vegetation', { cls: '' }));
  body.push(L(60, 410, 540, 410, 'd-ground'), ...wrapT(60, 430, 'Slope under the vegetation: flat, upslope, or downslope in bands from over 0 to 5 degrees up to over 15 to 20 degrees', 38, 16));
  keyList(body, 570, 360, [['a', 'The assessor records property details, the vegetation, the slope and the distance'], ['b', 'The BAL is assessed for the likely revegetated state after burnt areas regrow'], ['c', 'A suitably qualified person can provide a BAL assessment']], 40, 64);
  // C: levels
  body.push(T(40, 770, 'C  The six levels and what each describes', { cls: 'd-bold' }));
  const lv = [['BAL-Low', 'No construction requirements', 'Not stated', 'd-sheet'], ['BAL-12.5', 'Ember attack', '12.5 (Typical: the number in the name)', 'd-ins2'], ['BAL-19', 'Embers, plus increased heat', 'Up to 19', 'd-ins2'], ['BAL-29', 'Embers, plus increased heat', 'Up to 29', 'd-gap'], ['BAL-40', 'Adds likelihood of direct flame contact', 'Up to 40', 'd-gap'], ['BAL-FZ', 'Direct flame, embers and heat', 'Not stated', 'd-gap']];
  body.push(T(60, 800, 'Level', { cls: 'd-bold' }), T(190, 800, 'Exposure described', { cls: 'd-bold' }), T(560, 800, 'Radiant heat, kW/m²', { cls: 'd-bold' }));
  lv.forEach(([n, d, r, cls], i) => { const y = 810 + i * 34; body.push(R(40, y, 18, 22, cls), T(66, y + 16, n, { cls: 'd-bold' }), T(190, y + 16, d, { cls: '' }), T(560, y + 16, r, { cls: '' }), L(40, y + 28, 860, y + 28, 'd-dim')); });
  body.push(...wrapT(40, 1040, 'Descriptions are from the HIA overview of AS 3959:2018 and the heat figures are from a Lysaght page that names AS 3959-2009. The HIA page says the Standard does not guarantee a building will survive a bushfire on every occasion.', 112, 16));
  return svg(900, 1090, body.join(''), 'The BAL site assessment, step by step');
}

function permitDwg() {
  const body = [R(0, 0, 900, 900, 'd-bg')], blk = (x, y, w, h, lines, cls = 'd-box') => { body.push(R(x, y, w, h, cls, 6)); lines.forEach((t, i) => body.push(T(x + 12, y + 22 + i * 16, t, { cls: i ? 'd-mute' : 'd-bold' }))); };
  body.push(T(40, 40, 'Bushfire areas, overlays and the two permits', { cls: 'd-bold' }));
  blk(40, 70, 420, 70, ['1  Is the property in a Bushfire Prone Area (BPA)?', 'Check the council property report or the', 'State planning maps']);
  blk(500, 70, 360, 70, ['No BPA', 'The BPA minimum does not apply.', 'Confirm with the relevant building surveyor']);
  blk(40, 180, 420, 90, ['2  In a BPA: BAL assessment under AS 3959', 'New homes need at least BAL-12.5, even where the', 'assessment says BAL-Low. A higher BAL may apply']);
  blk(40, 310, 420, 90, ['3  Is the Bushfire Management Overlay (BMO) there?', 'Planning control for very high and extreme hazard.', 'BMO areas are also BPAs by default']);
  blk(500, 310, 360, 170, ['BMO: planning permit first', 'Bushfire Management Statement (Clause 44.06)', 'Defendable space, water supply, access and', 'vegetation management. Fire authority may be', 'referred. Then the building permit']);
  blk(40, 440, 420, 90, ['4  Building permit', 'Issued through a private building surveyor, or the', 'council. The BAL is shown in the permit documents']);
  blk(40, 570, 420, 90, ['5  Build to the BAL', 'Roof, eaves, walls, windows, doors, decks and', 'attached structures (AS 3959 sections 3 and 5 to 9)']);
  blk(40, 700, 420, 90, ['6  Keep the protection measures', 'A BMO permit carries a condition to maintain the', 'measures (2011 sheet: confirm the current wording)'], 'd-gap');
  for (const y of [140, 270, 400, 530, 660]) body.push(arrow(250, y, 250, y + 40));
  body.push(arrow(460, 105, 500, 105), arrow(460, 355, 500, 355));
  body.push(T(472, 98, 'no', { cls: 'd-mute' }), T(468, 348, 'yes', { cls: 'd-mute' }));
  body.push(...wrapT(500, 520, 'The CFA says VC248, gazetted on 5 May 2026, changed Clauses 13.02, 44.06 and 53.02 and that its content is still being updated. Check the planning scheme in force on the permit date.', 46, 16));
  body.push(...wrapT(500, 620, 'Where the planning process has already considered the bushfire requirements, the building permit does not need to consider them again.', 46, 16));
  body.push(...wrapT(40, 830, 'A BPA is an area designated under section 192A of the Building Act 1993. The BMO is Clause 44.06 of the Victoria Planning Provisions. The Bushfire Management Statement shows how an application meets the scheme.', 112, 16));
  return svg(900, 900, body.join(''), 'Bushfire areas, overlays and the two permits');
}

function buildDwg() {
  const body = [R(0, 0, 900, 1060, 'd-bg')];
  body.push(T(40, 40, 'Ember-proofing the eave and the window', { cls: 'd-bold' }), T(40, 68, 'A  Section through the eave, roof edge and wall (illustrative, layers thicker than real)', { cls: 'd-bold' }));
  body.push(R(194, 300, 36, 250, 'd-timber'), R(230, 300, 44, 250, 'd-brick'), R(170, 292, 110, 8, 'd-timber'));
  body.push(P([[180, 256], [560, 413], [560, 449], [180, 292]], 'd-timber'), P([[180, 238], [610, 414], [610, 418], [180, 242]], 'd-ins2'), P([[180, 222], [620, 403], [620, 417], [180, 236]], 'd-tile'));
  body.push(R(274, 440, 286, 6, 'd-board'), L(380, 443, 450, 443, 'd-mesh'), R(560, 394, 8, 80, 'd-cap'), R(568, 456, 56, 4, 'd-steel'), R(568, 436, 4, 24, 'd-steel'), R(620, 446, 4, 14, 'd-steel'), L(572, 440, 622, 447, 'd-mesh'), R(268, 436, 8, 5, 'd-wm'));
  body.push(call(1, 252, 480, 252, 600), call(2, 300, 330, 380, 200), call(3, 400, 300, 440, 200), call(4, 480, 336, 560, 200), call(5, 330, 444, 330, 500), call(6, 420, 447, 420, 520), call(7, 268, 436, 200, 560), call(8, 564, 420, 700, 380), call(9, 596, 458, 700, 500), call(10, 596, 443, 700, 440));
  keyList(body, 640, 110, [['1', 'Brick veneer wall'], ['2', 'Truss tail'], ['3', 'Sarking'], ['4', 'Roof tile'], ['5', 'Eave lining'], ['6', 'Vent with ember mesh'], ['7', 'Sealant bead at the wall'], ['8', 'Fascia'], ['9', 'Gutter, non-combustible'], ['10', 'Gutter guard']], 30, 24);
  body.push(...wrapT(40, 640, 'Numbers 1 to 10 match the labels in the 3D eave room. The blue bead is sealant closing the gap where the lining meets the wall. Embers can enter gaps as small as 2 mm (council page), so gaps at the wall and roof junction are closed and openings are screened.', 112, 16));
  // B: window elevation
  body.push(T(40, 740, 'B  Window with its ember screen, elevation (letters, not the 3D numbers)', { cls: 'd-bold' }));
  body.push(R(60, 770, 240, 200, 'd-brick'), R(110, 800, 140, 140, 'd-steel'), R(120, 810, 120, 120, 'd-glass'), R(104, 794, 152, 152, 'd-cav'));
  for (let k = 0; k < 10; k++) body.push(L(104 + k * 17, 794, 104 + k * 17, 946, 'd-mesh'));
  body.push(R(106, 938, 148, 6, 'd-sealant'));
  body.push(call('a', 70, 780, 40, 760), call('b', 114, 870, 40, 870), call('c', 180, 870, 340, 840), call('d', 180, 942, 340, 960), call('e', 104, 880, 40, 920), call('f', 200, 798, 340, 800));
  keyList(body, 340, 790, [['a', 'Brick wall around the opening'], ['b', 'Window frame'], ['c', 'Glass'], ['d', 'Sealant round the frame'], ['e', 'Screen frame'], ['f', 'Metal mesh screen']], 44, 28);
  body.push(...wrapT(40, 1010, 'BAL-12.5 includes sealing roofs, sealing round doors and windows and screening windows (BPC). Higher levels add requirements for glass, frames, doors and shutters that were not read here: AS 3959 is paywalled.', 112, 16));
  return svg(900, 1060, body.join(''), 'Ember-proofing the eave and the window');
}

function fireDwg() {
  const S = 22, ox = 130, oy = 130, X0 = -5.5, Z0 = -5.5, px = (x) => ox + (x - X0) * S, pz = (z) => oy + (z - Z0) * S;
  const body = [R(0, 0, 900, 690, 'd-bg')];
  body.push(T(40, 40, 'Smoke alarms and the distance to the boundary', { cls: 'd-bold' }), T(40, 68, 'A  Plan of the model house on its block (22 px per m, illustrative)', { cls: 'd-bold' }));
  body.push(R(px(-7.5), 100, 15 * S, pz(17.5) - 100, 'd-lot'), T(px(-7.5) + 8, 118, 'Block: rear boundary is further up, off this sketch', { cls: 'd-mute' }));
  body.push(R(px(-5.5), pz(-5.5), 11 * S, 17 * S, 'd-house'));
  for (const w of WALLS) body.push(L(px(w.a[0]), pz(w.a[1]), px(w.b[0]), pz(w.b[1]), w.ext ? 'd-wall' : 'd-line'));
  ALARMS.forEach(([x, z, n], i) => { body.push(Circ(px(x), pz(z), 11, 'd-dot'), `<text x="${px(x)}" y="${pz(z) + 4}" text-anchor="middle" class="d-num">${'ABC'[i]}</text>`); });
  body.push(dim(px(-7.5), pz(3), px(-5.5), pz(3), '2.0 m', 1), dim(px(5.5), pz(3), px(7.5), pz(3), '2.0 m', 1));
  keyList(body, 520, 112, [['A', 'Hall alarm'], ['B', 'Bedroom alarm'], ['C', 'Living alarm']], 36, 28);
  body.push(...wrapT(520, 220, 'Positions are the Step 9 layout, illustrative. Smoke alarms must comply with AS 3786, be powered from the consumer mains where connected, and be interconnected where there is more than one (NCC Housing Provisions 9.5, page carries NSW-labelled text).', 46, 16));
  body.push(...wrapT(520, 360, 'A ceiling-mounted alarm is at least 300 mm from the wall and ceiling corner and 500 to 1500 mm from the high point of a sloping ceiling.', 46, 16));
  body.push(T(520, 470, 'B  Boundary distance and fire separation', { cls: 'd-bold' }));
  body.push(...wrapT(520, 496, 'The distance from an external wall to the boundary or to another building decides whether the wall needs a fire rating. Distances and ratings are in NCC Housing Provisions Part 9.2, and the page read was a fragment without them, so they are Confirm. Garages and sheds are Class 10 and come in Stage 17.', 46, 16));
  body.push(...wrapT(520, 630, 'In this model each side wall is 2.0 m from its boundary. A real block can put a wall much closer, and the surveyor checks it.', 46, 16));
  return svg(900, 690, body.join(''), 'Smoke alarms and the distance to the boundary');
}

export const drawings = [
  { id: 'bal', title: 'The BAL site assessment', scale: 'Flow, plan not to scale', svg: balDwg(),
    notes: ['The BAL is a measure of how severely a building could be exposed to ember attack, radiant heat and direct flame contact. It sets the construction requirements.', 'Method 1 uses the Fire Danger Index, the vegetation class in each direction, the distance to it and the effective slope, and takes the highest BAL from the table. The pages that describe the method name AS 3959-2009, and the BPC says assessments follow AS 3959-2018, so confirm the tables in the edition on your permit.', 'The model scene shows a forest at the rear and a tape to the rear wall. The distances are not to scale and the BAL is not a real assessment.', 'The VBA, BPC and CFA pages do not say who prepares the assessment. Planning Victoria says a suitably qualified person can provide one.'] },
  { id: 'permit', title: 'Bushfire areas, overlays and the two permits', scale: 'Flow, not to scale', svg: permitDwg(),
    notes: ['All new homes in a Bushfire Prone Area must be built to at least BAL-12.5, even where the assessment says BAL-Low (BPC).', 'Where the Bushfire Management Overlay applies, a planning permit is needed as well as the building permit, and the building permit is assessed after the planning process.', 'VC248 was gazetted on 5 May 2026 and changed Clauses 13.02, 44.06 and 53.02 according to the CFA, so planning details may have changed. Read the scheme in force.', 'The BMO conditions line comes from a 2011 information sheet, so confirm the current wording.'] },
  { id: 'build', title: 'Ember-proofing the eave and the window', scale: 'Sections not to scale', svg: buildDwg(),
    notes: ['The pages read say BAL-12.5 includes sealing roofs and the gaps around doors and windows, and screening windows. Embers can enter gaps as small as 2 mm.', 'AS 3959 is paywalled and was not opened, so mesh sizes, gap limits, glass types and door rules for each BAL are Typical or Confirm.', 'Numbers 1 to 10 match the labels in the 3D eave room. The window letters belong to the window room, which has its own labels.', 'The eave lining, vents, gutter guards and window screens in the model are illustrative.'] },
  { id: 'fire', title: 'Smoke alarms and the distance to the boundary', scale: 'Plan at 22 px per m', svg: fireDwg(),
    notes: ['Smoke alarms were roughed in at Step 9 and fitted at Step 15. They must comply with AS 3786 and be interconnected where there is more than one.', 'The distance from a wall to the boundary decides its fire rating. The distances and ratings were not on the page read, so they are Confirm.', 'The bushfire rules and the fire separation rules both apply to a house in a bushfire area.', 'Letters A to C match the alarm positions in the 3D scene.'] },
];

/* ---------- steps ---------- */
export const howto = [
  ['Check whether the property is in a Bushfire Prone Area or the overlay', 'Look at the council property report and the State planning maps. A Bushfire Prone Area triggers a minimum construction standard. The Bushfire Management Overlay is a planning control that also needs a planning permit.', 'Builder, with the council or surveyor', 'V', 'bpcBpa'],
  ['Get the BAL assessed', 'A suitably qualified person assesses the Fire Danger Index, the vegetation within 100 m, the distance and the effective slope, and writes the BAL. The BPC says to assess the likely revegetated state after regrowth.', 'Bushfire assessor', 'V', 'bpcBalReport'],
  ['Put the BAL on the plans and the permit', 'The BAL goes in the permit documents so every trade and supplier builds to the same level. If the planning permit already set the BAL, confirm with the surveyor how it is carried across.', 'Designer, surveyor and builder', 'V', 'planVicBpa'],
  ['Seal the roof and screen the openings', 'Roof coverings, ridge and flashings are closed so embers cannot get in, vents and openings in the roof space and eaves are screened with metal mesh, and gaps at the roof and wall junction are sealed.', 'Roofer and carpenter', 'V', 'yrBushfire'],
  ['Line the eaves and fit non-combustible gutters and guards', 'Eaves are lined, vents are screened, and gutters, downpipes and gutter guards are metal so leaves and embers do not build up. The lining material and the guard type come from AS 3959 for the BAL.', 'Roofer and plumber', 'T'],
  ['Fit the windows, doors and screens', 'Windows get the glass, frame and screen for the BAL, doors get seals, and openable windows are screened. Higher BALs add shutters or tested products.', 'Window maker and glazier', 'V', 'bpcBpa'],
  ['Build the deck and attached structures to the BAL', 'Decks and the parts of external walls close to the ground use non-combustible material, 6 mm fibre cement or bushfire-resisting timber, and attached structures are covered by the Standard too.', 'Carpenter', 'V', 'yrBushfire'],
  ['Check the smoke alarms and the fire separation', 'Smoke alarms comply with AS 3786 and are interconnected. External walls near a boundary meet the fire rating in the Housing Provisions.', 'Electrician and builder', 'V', 'nccHp95'],
  ['Have the surveyor inspect the bushfire work', 'The surveyor checks the built work against the BAL on the permit and the permit conditions. Photograph the sealing, mesh and gutter guards before the lining and landscaping cover them.', 'Building surveyor and builder', 'T'],
  ['Hand over the maintenance duties', 'Give the owner the BAL, the product details and the care duties. A BMO permit carries a condition to keep the protection measures in place (2011 sheet: confirm).', 'Builder', 'C'],
];

export const trades = [
  { t: 'Bushfire assessor', role: 'Assesses the BAL: Fire Danger Index, vegetation, distance and slope, and writes the report.', when: 'Before the building permit, and before the design is fixed', reg: 'Planning Victoria says a suitably qualified person can provide a BAL assessment, and Fire Protection Association Australia provides training and accreditation. Who may sign it for the building permit was not found.', ask: ['The Standard edition and the method used', 'The BAL in each direction and the vegetation it came from', 'Whether the report is the one the surveyor will accept'] },
  { t: 'Building surveyor', role: 'Checks the design against the BAL and the Building Regulations, issues the permit and inspects the work.', when: 'Permit stage and the inspections', reg: 'Registered building surveyor. Where the planning stage set the BAL, the surveyor deals with it as part of the permit (2011 sheet: confirm).', ask: ['Which BAL is on the permit', 'Which bushfire items they will inspect and when', 'Photos they want before the lining goes on'] },
  { t: 'Roofer', role: 'Lays the sarking and roof, closes the ridge and flashings, and fits the guards and screens that stop embers getting in.', when: 'Roof stage, with the gutter work', reg: 'Not checked here. Check licensing for roofing before engaging someone directly.', ask: ['Products named for the BAL, with their test or compliance evidence', 'Who seals the roof and wall junction', 'Warranty on the sealing and mesh'] },
  { t: 'Window maker and glazier', role: 'Supplies and fits windows, glass, frames and screens made for the BAL.', when: 'Lock-up stage', reg: 'Not checked here.', ask: ['The BAL the product is rated for and the evidence', 'Glass type and thickness, frame material, screen mesh and seals', 'Whether shutters are needed at the BAL'] },
  { t: 'Carpenter and decker', role: 'Builds the deck and the other attached structures from material that suits the BAL.', when: 'After the roof is on', reg: 'Not checked here.', ask: ['Timber species or non-combustible material and the BAL it suits', 'What is closed in under the deck', 'Fixings and gaps at the wall'] },
];

export const materials = [
  ['Metal ember mesh', 'Corrosion-resistant metal mesh for vents, eave openings and screens, with a small aperture (2 mm is typical: confirm in AS 3959)', 'Mesh makers, roofing suppliers and hardware stores', 'T', 'Embers can enter gaps as small as 2 mm (council page).'],
  ['Bushfire-rated sarking', 'Sarking or wall wrap sold for bushfire areas', 'Insulation and roofing suppliers', 'C', 'Sarking is covered by the general requirements of AS 3959 (HIA overview). The product requirement was not read.'],
  ['Non-combustible gutters and guards', 'Steel or aluminium gutters, downpipes and a metal gutter guard', 'Roofing and plumbing suppliers', 'T', 'The Lysaght page advises non-combustible external walls, roofs, gutters and downpipes.'],
  ['Fire-resisting eave lining', 'Fibre cement or similar lining for the eaves, with sealed joints', 'Building suppliers', 'C', 'The lining and thickness come from AS 3959 for the BAL.'],
  ['Toughened glass and screens', 'Windows with the glass type, frame and mesh screen required for the BAL', 'Window makers and glaziers', 'C', 'One council page gives 5 mm toughened glass as the baseline at BAL-19, with an unclear table.'],
  ['Sealant and seals', 'Sealant and weather strips for the gaps round roofs, windows and doors', 'Hardware stores and trade suppliers', 'T', 'BAL-12.5 includes sealing round doors and windows (BPC).'],
  ['Bushfire-resisting timber or fibre cement for decks', 'Non-combustible material, 6 mm fibre cement or bushfire-resisting timber for decks and low wall parts', 'Timber yards and building suppliers', 'V', 'Council page for BAL-12.5 and 19: decks and wall parts under 400 mm above ground.'],
  ['Mains smoke alarms', 'Mains-powered interconnected alarms to AS 3786', 'Electrical wholesalers', 'V', 'Smoke alarms must comply with AS 3786 and be interconnected where there is more than one (NCC 9.5).'],
];

export const quotes = [
  { who: 'Bushfire assessor', n: '2', what: ['The Standard edition and the method, and the BAL for each direction', 'Whether they attend the site and the report is accepted by the surveyor', 'Time to issue, so the permit is not held up'] },
  { who: 'Roofer', n: '3', what: ['Products for the BAL, with evidence of compliance', 'Who seals the junction of the roof and walls, and the ridge', 'Gutter guards and the mesh on vents included or not'] },
  { who: 'Window maker', n: '3', what: ['Glass, frame and screen rated for the BAL', 'Whether shutters or other products are needed at the BAL', 'Lead time, because bushfire products are often made to order'] },
  { who: 'Decker or carpenter', n: '2', what: ['Material and the BAL it suits', 'What is closed in under the deck', 'Fixings and the gap to the wall'] },
  { who: 'Building surveyor', n: '2', what: ['The bushfire items they will inspect and at which stage', 'Cost of extra inspections', 'What they need from the BAL assessor'] },
];

export const quoteTips = [
  'Write the BAL on every quote request. A product that suits BAL-12.5 may not suit BAL-29, and the price changes.',
  'Ask each trade for the evidence that the product suits the BAL, and keep it with the permit documents.',
  'Ask who seals the gaps at the roof and wall junction. It falls between the roofer, the carpenter and the bricklayer.',
  'Ask for a lead time on windows and screens made for the BAL, and order them before the walls are ready.',
  'Allow for a surveyor inspection before the eave linings and gutter guards are covered, and agree the photo evidence.',
  'If the property is in the overlay, ask the designer to confirm the planning permit conditions are in the contract.',
];

export const inspections = [
  ['Overlay and BPA check', 'Builder and designer', 'Before the contract is signed', 'The council or State maps are checked for the BPA and the BMO, and the answer is on file.', 'V', 'planVicBpa'],
  ['BAL report check', 'Builder and surveyor', 'Before the permit', 'The BAL report names the Standard edition, the vegetation, the distance and the slope, and the surveyor accepts it.', 'V', 'bpcBalReport'],
  ['Minimum construction check', 'Surveyor', 'At permit', 'In a BPA the plans show at least BAL-12.5, even if the assessment said BAL-Low.', 'V', 'bpcBpa'],
  ['Planning permit conditions', 'Builder and designer', 'Before the building permit', 'Where the BMO applies, the planning permit conditions (defendable space, water supply, access, vegetation management) are in the contract and the plans.', 'V', 'planVicBpa'],
  ['Product evidence', 'Builder', 'On delivery', 'Each bushfire product matches the BAL on the permit and the evidence is on file.', 'T'],
  ['Roof and eave sealing', 'Surveyor and builder', 'Before the eave lining is closed', 'The roof is closed, the junction with the walls is sealed, vents are screened and nothing is left open.', 'T'],
  ['Mesh and vents', 'Builder', 'Before painting', 'All vents and openings in the roof space and eaves are screened with metal mesh, and the mesh is fixed all round.', 'T'],
  ['Gutters and guards', 'Builder', 'After the gutters are fixed', 'Gutters, downpipes and guards are metal, the guards are fixed along the full length, and joins are tight.', 'T'],
  ['Windows and doors', 'Surveyor and builder', 'After fitting', 'Glass, frames and screens are the ones rated for the BAL, openable windows are screened, and doors are sealed round the edges.', 'T'],
  ['Deck and attached structures', 'Surveyor and builder', 'Before the deck is closed in', 'The deck material suits the BAL, wall parts near the ground use suitable material, and the space under the deck is closed or screened.', 'V', 'yrBushfire'],
  ['Smoke alarms', 'Electrician', 'Commissioning', 'Alarms comply with AS 3786, are interconnected and each tested. Positions are at least 300 mm from the wall and ceiling corner.', 'V', 'nccHp95'],
  ['Fire separation to boundaries', 'Surveyor', 'At the frame and lining stages', 'External walls near a boundary have the rating the Housing Provisions require. The distances and ratings were not read.', 'C'],
  ['Final bushfire check', 'Surveyor', 'Before the final inspection', 'Every bushfire item on the permit is built, and photographs are taken of the sealing, the mesh and the guards before they are covered.', 'T'],
  ['Maintenance handover', 'Builder', 'At handover', 'The owner has the BAL, the product details and the care duties, and any BMO permit conditions to maintain the measures.', 'C'],
];

export const exam = [
  ['What does BAL stand for and what does it measure?', 'Bushfire Attack Level. It measures the severity of a building’s potential exposure to ember attack, radiant heat and direct flame contact, and sets the construction requirements.', 'V', 'cfaGlossary'],
  ['Which Standard sets the construction requirements for a BAL?', 'AS 3959. The BPC says assessments follow AS 3959-2018, while some council and Geoscience Australia pages still describe AS 3959-2009, so check the edition on the permit.', 'V', 'bpcBalReport'],
  ['What are the six levels?', 'BAL-Low, BAL-12.5, BAL-19, BAL-29, BAL-40 and BAL-FZ (Flame Zone).', 'V', 'hiaAs3959'],
  ['What is the lowest BAL for a new home in a Bushfire Prone Area?', 'BAL-12.5. Even where the assessment says BAL-Low, new homes in a designated BPA are built to a minimum of BAL-12.5.', 'V', 'bpcBpa'],
  ['What does BAL-12.5 include?', 'Sealing roofs, sealing around doors and windows, and screening windows.', 'V', 'bpcBpa'],
  ['What does the HIA overview say each level addresses?', 'BAL-12.5 is ember attack. BAL-19 and BAL-29 add increased heat flux. BAL-40 adds the likelihood of direct flame contact. BAL-FZ is direct flame contact, embers and heat flux.', 'V', 'hiaAs3959'],
  ['What radiant heat figures does the Lysaght page give?', 'Up to 19 kW/m² for BAL-19, up to 29 for BAL-29 and up to 40 for BAL-40. The page names AS 3959-2009.', 'V', 'lysaghtBal'],
  ['What inputs does the BAL assessment use?', 'The Fire Danger Index, the vegetation class in each direction, the horizontal distance to it and the effective slope. The highest BAL from the table applies.', 'V', 'cgBalForm'],
  ['What is the Fire Danger Index for Victoria in the council form?', '100 for Victoria general (excluding alpine areas) and 50 for Victorian alpine areas. The form describes AS 3959-2009.', 'V', 'cgBalForm'],
  ['What are the seven vegetation groups?', 'A forest, B woodland, C shrubland, D scrub, E mallee and mulga, F rainforest and G grassland.', 'V', 'cgBalForm'],
  ['How far from the building does the assessment look?', 'Vegetation more than 100 m away is classed as BAL-Low in the 2009 edition form. Low-threat vegetation and non-vegetated areas are excluded.', 'V', 'cgBalForm'],
  ['What if there is more than one vegetation type?', 'Each is classified separately and the worst case applies.', 'V', 'gaBal'],
  ['When is Method 1 not valid?', 'Where the effective slope is more than 20 degrees downslope (Geoscience Australia toolbox).', 'V', 'gaBal'],
  ['What state of the vegetation should the BAL be assessed for?', 'The likely revegetated state following regrowth of burnt areas.', 'V', 'bpcBpa'],
  ['What is a Bushfire Prone Area?', 'An area designated as bushfire prone under section 192A of the Building Act 1993.', 'V', 'cfaGlossary'],
  ['What is the Bushfire Management Overlay?', 'The planning overlay in Clause 44.06 of the Victoria Planning Provisions, for areas of very high and extreme bushfire hazard.', 'V', 'cfaGlossary'],
  ['What permits are needed in a BMO?', 'A planning permit as well as a building permit. The building permit is assessed after the planning process, and bushfire requirements already considered need not be considered again.', 'V', 'planVicBpa'],
  ['What are the mandatory BMO protection measures?', 'Defendable space, water supply, access and ongoing vegetation management.', 'V', 'planVicBpa'],
  ['What is a Bushfire Management Statement?', 'A document prepared under Clause 44.06 that shows how the application meets the requirements of the scheme.', 'V', 'cfaGlossary'],
  ['What did VC248 do?', 'The CFA says it was gazetted on 5 May 2026 and changed Clauses 13.02, 44.06 and 53.02. Planning detail may have moved, so read the scheme in force.', 'V', 'cfaGlossary'],
  ['How small a gap can embers enter?', 'The council page says embers can enter through gaps as small as two millimetres.', 'V', 'yrBushfire'],
  ['What do the general sections of AS 3959 cover, according to the HIA overview?', 'Attached and adjacent structures, decorative mouldings, gaps and screening materials, bushfire shutters, glazing and sarking. Sections 5 to 9 cover each BAL from the subfloor to the roof, including windows and external doors.', 'V', 'hiaAs3959'],
  ['What do decks and low wall parts need at BAL-12.5 and 19, per the council page?', 'Wall parts less than 400 mm above ground and decks use non-combustible material, 6 mm fibre cement or bushfire-resisting or naturally fire-resistant timber.', 'V', 'yrBushfire'],
  ['What general design advice does the Lysaght page give?', 'Use non-combustible external walls, roofs, gutters and downpipes, keep the roof simple, minimise space under floors and decks, remove gaps at the wall and roof junction and avoid re-entrant corners.', 'V', 'lysaghtBal'],
  ['What must smoke alarms comply with?', 'AS 3786. They must be powered from the consumer mains where connected and interconnected where there is more than one (NCC 9.5, page carries NSW-labelled text).', 'V', 'nccHp95'],
  ['What is the maximum mesh aperture for ember screens?', 'Typically 2 mm, in corrosion-resistant metal, but this was not confirmed. AS 3959 is the source.', 'C'],
  ['What glass is needed at each BAL?', 'Not confirmed. One council page gives 5 mm toughened glass as the BAL-19 baseline with an unclear table, and higher levels add shutters or tested products.', 'C'],
  ['What distance from vegetation gives each BAL?', 'Not confirmed. The distances come from the AS 3959 table for the FDI, vegetation class and slope, which was not opened.', 'C'],
  ['What fire rating applies to a wall near a boundary?', 'Not confirmed. The NCC Housing Provisions Part 9.2 page read was a fragment without the distances and ratings.', 'C'],
  ['Who may prepare the BAL assessment for a permit?', 'Not confirmed. Planning Victoria says a suitably qualified person, and the VBA and BPC pages do not say who.', 'C'],
];

export const sources = ['bpcBpa', 'vbaBpa', 'bpcBalReport', 'planVicBpa', 'cfaGlossary', 'csiroVic', 'hiaAs3959', 'lysaghtBal', 'cgBalForm', 'gaBal', 'yrBushfire', 'dpcdBmo', 'nccHp95', 'vbaEsm09', 'nccHp92'];
export const caution = 'The bushfire rules here come from the VBA, BPC, Planning Victoria and CFA pages and the HIA overview of AS 3959:2018, all read on 9 November 2026. AS 3959 is paywalled and was not opened, so the distance tables, mesh apertures, gap limits and the glass, frame and door rules for each BAL are Typical or Confirm. The council form and the Geoscience Australia page describe AS 3959-2009 and the BPC says assessments follow AS 3959-2018, so the method is described and the numbers are left to the current Standard. The radiant heat figures come from a Lysaght page that also names AS 3959-2009. The CFA says VC248 changed Clauses 13.02, 44.06 and 53.02 on 5 May 2026, so the planning detail may have moved, and the BMO condition on maintenance comes from a 2011 information sheet. The pages do not say who prepares a BAL assessment for a permit. The smoke alarm rules come from the NCC Housing Provisions page used in Step 9 (NSW-labelled text, no edition) and the VBA smoke alarm note. The NCC Housing Provisions Part 9.2 page read was a fragment without the distances and ratings, so the fire separation rules are Confirm. Bushfire construction is called up through NCC Volume Two and the Victorian variations, which were not read for this step. The vegetation, tape, BAL level, mesh, lining, guards, screens and deck in the model are illustrative and are not a real assessment, and the zoom rooms draw layers thicker than real.';

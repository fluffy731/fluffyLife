// Step 18 study content: drawings, steps, trades, materials, quotes, inspections and exam cards for completion, occupancy and handover.
// Flags: V = Verified against a source named in SOURCES, T = Typical practice, C = Confirm. Read on 9 November 2026: BPC pages on Home Warranty and the end of a building project (both last updated 30 June 2026),
// the BPC page for builders on the new insurance, Consumer Affairs Victoria pages (completion checklist 2 July 2025, implied warranties 9 July 2025, deposits and payments 1 July 2026, new contract laws 15 September 2025),
// council pages (Stonnington on occupancy permits, and a Greater Shepparton list of final inspection documents with no date), two law firm articles (Maddocks on section 134 and on the 2025 Act) and HWL Ebsworth (30 June 2026).
// The Building Act 1993 itself, the Domestic Building Contracts Act 1995, the Building (Statutory Insurance Scheme) Regulations 2026 and every council's own checklist were NOT opened, so section numbers come from the articles
// and the certificate list is one council's. The final balance after fixing (15%) is arithmetic, and how a claim is made under Home Warranty was not on the pages read.
import { svg, T, L, R, C as Circ, P, dim, call, arrow } from './dwg.js';

const wrapT = (x, y, text, n, dy = 18, cls = 'd-mute') => { const out = []; let cur = ''; for (const w of text.split(' ')) { if ((cur + ' ' + w).trim().length > n) { out.push(cur); cur = w; } else cur = (cur + ' ' + w).trim(); } if (cur) out.push(cur); return out.map((t, i) => T(x, y + i * dy, t, { cls })); };
const keyList = (body, x, y, items, n, step, off = 20) => items.forEach(([k, t], i) => { body.push(T(x, y + i * step, k, { cls: 'd-bold' }), ...wrapT(x + off, y + i * step, t, n, 16, '')); });
const bub = (body, x, y, k) => body.push(Circ(x, y, 11, 'd-bub'), `<text x="${x}" y="${y + 4}" text-anchor="middle" class="d-num">${k}</text>`);
const chip = (f) => ({ V: 'd-fv', T: 'd-ft', C: 'd-fc' }[f]);

/* ---------- drawings ---------- */
function completeDwg() {
  const body = [R(0, 0, 900, 1130, 'd-bg')];
  body.push(T(40, 40, 'From practical completion to the end of the defects period', { cls: 'd-bold' }), T(40, 68, 'A  The seven steps (dots: green verified, amber typical, red confirm)', { cls: 'd-bold' }));
  const steps = [
    ['Practical completion', 'Builder and owner', 'Everything in the plans and specifications is finished to the agreed standard and the major defects are fixed. The owner walks the house and lists incomplete or faulty work.', 'V'],
    ['Certificates', 'Trades and builder', 'Collect the certificates the surveyor asks for: plumbing, electrical safety, glazing, termite protection, energy, waterproofing, and BAL where it applies.', 'V'],
    ['Final inspection', 'Building surveyor', 'The surveyor inspects the finished building against the permit and checks the paperwork and the safety items.', 'T'],
    ['Occupancy permit or CFI', 'Building surveyor', 'A new home needs an occupancy permit before anyone occupies it. An extension or alteration gets a certificate of final inspection (CFI).', 'V'],
    ['Final payment', 'Owner', 'Check everything in the contract is delivered and in working order, then pay. By law the owner pays for completed stages, not in advance.', 'V'],
    ['Handover', 'Builder to owner', 'Keys, permit papers, certificates, warranties, manuals, plans and the Notice of Cover or policy go to the owner. Keep every document.', 'T'],
    ['Defects period and warranties', 'Owner and builder', 'The owner lists faulty work and writes to the builder. Home Warranty and the statutory warranties run on from completion.', 'C'],
  ];
  steps.forEach(([t, who, d, f], i) => {
    const y = 84 + i * 92;
    body.push(R(40, y, 820, 80, 'd-box', 8)); bub(body, 72, y + 40, 'ABCDEFG'[i]);
    body.push(...wrapT(104, y + 26, t, 27, 16, 'd-bold'), T(104, y + 66, who, { cls: 'd-mute' }), ...wrapT(340, y + 26, d, 66, 16, ''), R(836, y + 10, 14, 14, chip(f), 3));
    if (i < steps.length - 1) body.push(arrow(72, y + 80, 72, y + 92));
  });
  body.push(T(40, 770, 'B  Occupancy permit or certificate of final inspection', { cls: 'd-bold' }));
  body.push(R(40, 782, 820, 28, 'd-box'), T(52, 801, 'Question', { cls: 'd-bold' }), T(190, 801, 'Occupancy permit', { cls: 'd-bold' }), T(530, 801, 'Certificate of final inspection', { cls: 'd-bold' }));
  const rows = [
    ['It is for', 'A new home, including units and apartments. The building permit says which one is needed.', 'Extensions and alterations to an existing home, which do not need a new occupancy permit.'],
    ['It means', 'The building surveyor is satisfied the building is suitable for occupation.', 'Issued after the final inspection stage is approved. One council says it starts the liability period for building faults.'],
    ['Who applies', 'The owner or the builder.', 'Not stated on the pages read.'],
    ['If it is missing', 'It is an offence to occupy a new building before the permit is issued (Building Act 1993).', 'Not stated on the pages read.'],
  ];
  rows.forEach(([a, b, c], i) => {
    const y = 820 + i * 62;
    body.push(T(52, y + 18, a, { cls: 'd-bold' }), ...wrapT(190, y + 18, b, 44, 16, ''), ...wrapT(530, y + 18, c, 44, 16, ''), L(40, y + 56, 860, y + 56, 'd-dim'));
  });
  body.push(...wrapT(40, 1086, 'Sources: BPC at the end of your building project (30 June 2026), Consumer Affairs Victoria completion checklist (2 July 2025), the Stonnington page on occupancy permits and one council list of final inspection documents. The step order is the usual order, and a contract can tie the final payment to the permit, so read the contract.', 120, 16));
  return svg(900, 1130, body.join(''), 'From practical completion to the end of the defects period');
}

function certsDwg() {
  const body = [R(0, 0, 900, 1040, 'd-bg')];
  body.push(T(40, 40, 'Certificates to collect before the final inspection', { cls: 'd-bold' }), T(40, 68, 'A  One council’s list at final inspection (ask your surveyor for theirs). Numbers match the 3D certificates room', { cls: 'd-bold' }));
  body.push(R(40, 82, 820, 28, 'd-box'), T(84, 101, 'Certificate', { cls: 'd-bold' }), T(340, 101, 'From', { cls: 'd-bold' }), T(640, 101, 'Where this model covers the work', { cls: 'd-bold' }));
  const rows = [
    ['Plumbing certificate of compliance', 'The licensed plumber, for all plumbing work', 'Stages 5, 8 and 15', 'V'],
    ['Certificate of electrical safety', 'The registered electrician, for all electrical work', 'Stages 9 and 15', 'V'],
    ['Glazier’s certificate', 'The glazier: windows and shower screens installed to AS 1288 and AS 2047', 'Stages 7 and 15', 'V'],
    ['Termite protection certificate', 'The termite installer, with the durable notice fixed inside the switchboard', 'Stages 2 and 9', 'V'],
    ['Energy report letter', 'A letter confirming the work meets the requirements of the Energy Report', 'Stage 11', 'V'],
    ['Waterproofing certificate', 'The “Waterproofing of Wet areas in Residential Buildings” certificate, completed and signed', 'Stage 10', 'V'],
    ['BAL letter', 'A letter confirming the dwelling meets the BAL under AS 3959, where it applies', 'Stage 16', 'V'],
    ['Engineer’s certificates', 'The structural engineer. The surveyor may ask the practitioners involved for certificates or statements. Not on the list read', 'Stages 2, 3, 4 and 17', 'C'],
  ];
  rows.forEach(([a, b, c, f], i) => {
    const y = 122 + i * 84;
    bub(body, 60, y + 34, i + 1);
    body.push(...wrapT(84, y + 30, a, 28, 16, 'd-bold'), ...wrapT(340, y + 22, b, 46, 16, ''), T(640, y + 30, c, { cls: 'd-mute' }), R(836, y + 20, 14, 14, chip(f), 3), L(40, y + 74, 860, y + 74, 'd-dim'));
  });
  body.push(T(40, 812, 'B  Also on the same list', { cls: 'd-bold' }));
  keyList(body, 40, 836, [['•', 'The signed “Application for an Occupancy Permit” form.'], ['•', 'A Certificate of Approval to Use a Septic Tank System from the Environmental Health Officer, where there is one.'], ['•', 'Safety items that must be in place and working: smoke alarms, and stormwater connected to the council’s legal point of discharge.']], 100, 40, 18);
  body.push(T(40, 972, 'C  Cautions', { cls: 'd-bold' }));
  body.push(...wrapT(40, 994, 'The list is one council’s, with no date, so another surveyor can ask for more or less. The stage numbers are where this model covers each item. Plumbing and electrical certificate timing is in Stage 15.', 112, 16));
  return svg(900, 1040, body.join(''), 'Certificates to collect before the final inspection');
}

function paymentsDwg() {
  const body = [R(0, 0, 900, 1010, 'd-bg')];
  body.push(T(40, 40, 'Final payment and the final cost', { cls: 'd-bold' }), T(40, 68, 'A  Stage payment limits, build all stages: share of the contract price', { cls: 'd-bold' }));
  const segs = [['Base', 10, 'V'], ['Frame', 15, 'V'], ['Lock-up', 35, 'V'], ['Fixing', 25, 'V'], ['Balance', 15, 'C']];
  let x = 60;
  segs.forEach(([n, p, f]) => { const w = p * 7.8; body.push(R(x, 90, w, 64, chip(f)), R(x, 90, w, 64, 'd-box'), T(x + 8, 118, p + '%', { cls: 'd-bold' }), T(x + 8, 140, n, { cls: 'd-mute' })); x += w; });
  body.push(...wrapT(60, 184, 'The page lists base 10%, frame 15%, lock-up 35% and fixing 25%, and calls this the usual schedule. The 15% balance after fixing is worked out here as the remainder, so it is Confirm.', 108, 16));
  body.push(T(40, 262, 'B  Worked example, $500,000 contract (illustrative)', { cls: 'd-bold' }));
  body.push(R(40, 276, 820, 26, 'd-box'), T(52, 294, 'Payment', { cls: 'd-bold' }), T(300, 294, 'Share', { cls: 'd-bold' }), T(480, 294, 'Amount', { cls: 'd-bold' }));
  const ex = [['Deposit limit ($20,000+ contracts)', '5%', '$25,000'], ['Base', '10%', '$50,000'], ['Frame', '15%', '$75,000'], ['Lock-up', '35%', '$175,000'], ['Fixing', '25%', '$125,000'], ['Balance after fixing (worked out)', '15%', '$75,000']];
  ex.forEach(([a, b, c], i) => { const y = 312 + i * 30; body.push(...wrapT(52, y + 14, a, 52, 14, ''), T(300, y + 14, b), T(480, y + 14, c), L(40, y + 24, 860, y + 24, 'd-dim')); });
  body.push(...wrapT(40, 516, 'How the deposit is credited against the first payment was not on the page read. The limits are the most that can be asked at each stage, and the contract sets the actual amounts.', 112, 16));
  body.push(T(40, 570, 'C  Before the final payment', { cls: 'd-bold' }));
  const checks = ['Everything in the contract is delivered and in working order.', 'The occupancy permit or certificate of final inspection has been issued.', 'The defects list is fixed or agreed in writing.', 'A copy of the Notice of Cover or the policy is in hand.', 'No payment is made in advance: the page warns that Home Warranty may not cover work paid for before completion.'];
  checks.forEach((c, i) => { const y = 590 + i * 34; body.push(R(52, y, 16, 16, 'd-box', 3), ...wrapT(80, y + 13, c, 100, 14, '')); });
  body.push(T(40, 790, 'D  Final cost reporting', { cls: 'd-bold' }));
  body.push(...wrapT(40, 812, 'For a non-staged permit the owner tells the BPC within 28 days of becoming aware that the cost has gone up or down by $15,625 or more. For staged permits the BPC may ask for the final cost and supporting documents. A penalty levy can apply for not reporting an increase.', 112, 16));
  body.push(T(40, 890, 'E  What may change', { cls: 'd-bold' }));
  body.push(...wrapT(40, 912, 'The Domestic Building Contracts Amendment Act 2025 passed on 11 September 2025 and takes effect by 1 December 2026. Progress payment stages and limits can be set by regulation and payments must meet a proportionality requirement, so check the regulations before relying on these figures.', 112, 16));
  return svg(900, 1010, body.join(''), 'Final payment and the final cost');
}

function clockDwg() {
  const body = [R(0, 0, 900, 1060, 'd-bg')];
  body.push(T(40, 40, 'The warranty clock', { cls: 'd-bold' }), T(40, 68, 'A  How long each protection runs after completion (numbers match the 3D warranty clock)', { cls: 'd-bold' }));
  const X0 = 110, PX = 70;
  for (let yr = 0; yr <= 10; yr++) body.push(L(X0 + yr * PX, 100, X0 + yr * PX, 372, 'd-dim'), T(X0 + yr * PX - (yr > 9 ? 7 : 3), 97, String(yr), { cls: 'd-mute' }));
  body.push(T(X0 + 240, 80, 'years after completion', { cls: 'd-mute' }));
  const bars = [
    [1, 'Other defects: up to 2 years', 2, 'd-fv', 'Home Warranty'],
    [2, 'Major defects: up to 6 years', 6, 'd-fv', 'Home Warranty'],
    [3, 'Claim against the builder: up to 10 years', 10, 'd-fc', 'Building Act 1993'],
    [4, 'DBI for contracts before 1 July 2026: 6 years', 6, 'd-ft', 'Older scheme'],
  ];
  bars.forEach(([n, t, yrs, c, tag], i) => {
    const y = 120 + i * 62;
    bub(body, 60, y + 16, n); body.push(R(X0, y, yrs * PX, 32, c), R(X0, y, yrs * PX, 32, 'd-box'));
    const out = yrs * PX < 200, tx = out ? X0 + yrs * PX + 10 : X0 + 10;
    body.push(T(tx, y + 21, t, { cls: 'd-bold' }), T(out ? tx + t.length * 7 + 14 : X0 + yrs * PX + 10, y + 21, tag, { cls: 'd-mute' }));
  });
  body.push(L(X0, 104, X0, 392, 'd-cut'), call(5, X0, 380, 80, 410));
  body.push(T(104, 414, 'Start: completion, or the date of the occupancy permit', { cls: 'd-mute' }));
  keyList(body, 40, 450, [['1', 'Home Warranty: up to 2 years after completion for other defects or non-compliant work (BPC).'], ['2', 'Home Warranty: up to 6 years after completion for major defects (BPC).'], ['3', 'Claim against the builder: 10 years. CAV says from the date the work was completed. A law firm says section 134 runs 10 years from the date of the occupancy permit. Confirm which.'], ['4', 'The old DBI protected the owner for 6 years for work over $16,000, if the builder died, became insolvent or disappeared (CAV checklist).'], ['5', 'The start of each clock is not stated the same way on every page read.']], 100, 36, 22);
  body.push(T(40, 706, 'B  Reporting a defect', { cls: 'd-bold' }));
  const st = [['1 List it', 'Write down each incomplete or faulty item, with photos.'], ['2 Tell the builder', 'Raise it straight away. Send a written request to fix it by registered post.'], ['3 Builder fixes', 'Home Warranty says first try to resolve the issue with the builder.'], ['4 Claim', 'If the builder is unable or unwilling to complete or fix eligible work, a Home Warranty claim may be possible.']];
  st.forEach(([h, t], i) => { const x = 40 + i * 207; body.push(R(x, 722, 190, 112, 'd-box', 6), T(x + 12, 746, h, { cls: 'd-bold' }), ...wrapT(x + 12, 768, t, 26, 15, 'd-mute')); if (i < 3) body.push(arrow(x + 190, 778, x + 207, 778)); });
  body.push(T(40, 872, 'C  Where the sources differ', { cls: 'd-bold' }));
  keyList(body, 40, 896, [['•', 'The BPC pages give 6 years for major defects and 2 years for other defects after completion, and no notification period.'], ['•', 'HWL Ebsworth (30 June 2026) reports a 12-month notification to the BPC from when the owner is aware of a defect, and a 30% sub-limit for incomplete work. Neither is on the BPC pages read.'], ['•', 'CAV says 10 years from completion for a claim against the builder. A law firm reads section 134 as 10 years from the occupancy permit.']], 100, 40, 18);
  return svg(900, 1060, body.join(''), 'The warranty clock');
}

export const drawings = [
  { id: 'complete', title: 'From practical completion to the end of the defects period', scale: 'Flow and table, not to scale', svg: completeDwg(),
    notes: ['The step order is the usual order. A contract can tie the final payment to the occupancy permit, so read the contract before relying on it.', 'The BPC says the building permit states whether an occupancy permit or a certificate of final inspection is needed, and that occupying a new building before the permit is an offence under the Building Act 1993. The Act itself was not opened.', 'The CFI row about the liability period is from one council page. Who applies for a certificate of final inspection and what happens if it is missing were not on the pages read.', 'Step 3, the final inspection, and step 6, the handover list, are Typical: the pages read do not describe them.'] },
  { id: 'certs', title: 'Certificates to collect before the final inspection', scale: 'Table, not to scale', svg: certsDwg(),
    notes: ['The list is one council’s final inspection checklist, with no date. Another surveyor can ask for more or fewer documents, so ask for theirs early.', 'Numbers 1 to 8 match the labels in the 3D certificates room. The engineer’s certificates are not on the list read, but the BPC says a surveyor may ask the practitioners involved for certificates or statements.', 'The stage numbers show where this model covers the work, and the plumbing and electrical certificate timing is in Stage 15.'] },
  { id: 'payments', title: 'Final payment and the final cost', scale: 'Bar and table, not to scale', svg: paymentsDwg(),
    notes: ['The CAV page gives the stage limits for a contract to build all stages as base 10%, frame 15%, lock-up 35% and fixing 25%, and a 5% deposit limit for contracts of $20,000 or more. The 15% balance is worked out here.', 'The page says you pay for completed stages and should not pay in advance, and that Home Warranty may not cover work paid for before completion.', 'The 2025 Act lets regulations set the stages and limits and takes effect by 1 December 2026, so the figures may move.'] },
  { id: 'clock', title: 'The warranty clock', scale: 'Timeline, 70 px per year', svg: clockDwg(),
    notes: ['Numbers 1 to 5 match the labels in the 3D warranty clock. Bars 1 and 2 are from the BPC Home Warranty page, bar 3 from CAV and a law firm, and bar 4 is the old scheme.', 'Home Warranty applies to eligible work over $20,000 under contracts signed on or after 1 July 2026, up to three storeys, and covers up to $400,000. Policies issued before that stay on their original terms.', 'A secondary source reports a 12-month notification limit and a 30% sub-limit for incomplete work that the BPC pages read do not show, so both are Confirm.'] },
];

/* ---------- steps ---------- */
export const howto = [
  ['Reach practical completion and walk the house', 'The work is complete when everything in the plans and specifications is finished to the agreed standard and the major defects are fixed. Walk the house with the owner, room by room.', 'Builder and owner', 'V', 'cavComplete'],
  ['Write the defects list and fix it', 'List every incomplete or faulty item with a photo and a location. The owner may pay an independent building consultant to check for defects or unfinished work. Fix and recheck each item before the final inspection.', 'Builder, owner and trades', 'V', 'cavComplete'],
  ['Collect the certificates', 'Collect the plumbing certificate of compliance, the certificate of electrical safety, the glazier’s certificate, the termite protection certificate, the energy letter, the waterproofing certificate, and the BAL letter and septic approval where they apply. This is one council’s list, so ask your surveyor for theirs.', 'Trades and builder', 'V', 'shepCerts'],
  ['Apply for the occupancy permit', 'The owner or the builder may apply. The building surveyor may ask the practitioners involved in the construction for certificates or statements before issuing it.', 'Owner or builder', 'V', 'bpcEnd'],
  ['Pass the final inspection', 'The surveyor inspects the finished work against the permit and the certificates. Smoke alarms and stormwater connected to the council’s legal point of discharge are checked as safety items that must be in place and working.', 'Building surveyor', 'V', 'shepCerts'],
  ['Receive the occupancy permit or certificate of final inspection', 'A new home needs an occupancy permit before anyone occupies it, and it is an offence under the Building Act 1993 to occupy a new building before it is issued. An extension or alteration gets a certificate of final inspection.', 'Building surveyor', 'V', 'bpcEnd'],
  ['Report the final cost', 'For a non-staged permit, tell the BPC within 28 days of becoming aware that the cost has changed by $15,625 or more. For staged permits the BPC may ask for the final cost and supporting documents. Keep the quotes, invoices and amended permits.', 'Owner, or surveyor for later amendments', 'V', 'bpcEnd'],
  ['Check the contract, then make the final payment', 'Check everything in the contract is delivered and in working order before the final payment. By law the owner pays for completed stages and does not pay in advance. Follow the payment terms in the contract.', 'Owner', 'V', 'cavComplete'],
  ['Hand over the keys, records and warranties', 'Keys, permit documents, certificates, manufacturers’ warranties, manuals, as-built plans, a maintenance guide, a paint and finishes schedule and the Notice of Cover or policy go to the owner. Keep every document for the project.', 'Builder', 'T'],
  ['Run the defects period', 'The owner lists faulty work, raises it with the builder straight away and follows up in writing by registered post. Home Warranty covers major defects for up to 6 years and other defects for up to 2 years after completion, and a claim against the builder runs up to 10 years. The start dates are Confirm.', 'Owner and builder', 'C', 'bpcHW'],
];
export const trades = [
  { t: 'Building surveyor', role: 'Inspects the finished building, checks the paperwork and issues the occupancy permit or certificate of final inspection.', when: 'Final inspection', reg: 'Registered building surveyor.', ask: ['Their list of final certificates, early', 'Which inspections are still to come', 'How long after the inspection the permit is issued'] },
  { t: 'Plumber', role: 'Gives the plumbing certificate of compliance for all plumbing work.', when: 'After fit-off and testing', reg: 'Licensed plumber. Certificate timing is in Stage 15 from the VBA page.', ask: ['The certificate of compliance for every job', 'Test results', 'Warranty papers for fixtures and the hot water unit'] },
  { t: 'Electrician', role: 'Gives the certificate of electrical safety for all electrical work.', when: 'After fit-off and testing', reg: 'Registered electrician. Electrical timing is in Stage 15.', ask: ['The certificate of electrical safety', 'Test results and the switchboard schedule', 'Manuals for the alarms and any equipment'] },
  { t: 'Glazier', role: 'Gives the certificate that windows and shower screens were installed to AS 1288 and AS 2047.', when: 'After the windows and screens are in', reg: 'One council list asks for it. Licensing was not checked here.', ask: ['The glazing certificate', 'The window schedule and energy ratings', 'Care and warranty sheets'] },
  { t: 'Termite protection installer', role: 'Gives the termite protection certificate and fixes the durable notice inside the switchboard.', when: 'After the barrier and before handover', reg: 'One council list asks for it. Licensing was not checked here.', ask: ['The termite certificate', 'The notice fixed in the switchboard', 'The inspection and renewal schedule'] },
  { t: 'Waterproofer and energy assessor', role: 'Provide the waterproofing certificate for wet areas and the letter that the work meets the Energy Report.', when: 'Before the final inspection', reg: 'One council list asks for both. Who may sign was not checked here.', ask: ['The signed waterproofing certificate', 'The energy compliance letter', 'Membrane and insulation product sheets'] },
  { t: 'Structural engineer', role: 'Gives certificates or statements for the structure and any retaining wall when the surveyor asks.', when: 'After the last inspection they attend', reg: 'The BPC says the surveyor may ask the practitioners involved for certificates or statements.', ask: ['Which certificates they will give', 'Inspections they will attend', 'How long they take to issue'] },
  { t: 'Independent building consultant', role: 'Checks the finished work for defects or unfinished items on the owner’s behalf.', when: 'Before the final payment', reg: 'The CAV page says an owner may pay one. Licensing was not checked here.', ask: ['The scope and the report format', 'Photos and a defects list', 'Whether they will recheck the fixes'] },
];
export const materials = [
  ['Durable termite notice', 'The notice fixed inside the switchboard, fitted by the termite installer', 'Termite installer', 'V', 'One council list asks for a durable notice inside the electrical switchboard.'],
  ['Handover folder and document pack', 'A binder or digital folder for certificates, permits, warranties and manuals', 'Bunnings and stationery suppliers', 'T', 'The CAV page says to keep all documents, agreements and certificates for the project.'],
  ['Key set, key register and spare keys', 'Keys for every lock, counted and signed for at handover', 'Locksmith and hardware suppliers', 'T', 'Count them at handover and write down who holds which key.'],
  ['Manufacturers’ warranty sheets and manuals', 'Appliances, hot water unit, windows, roofing, flooring and fixtures', 'Each manufacturer or supplier', 'T', 'Keep them with the certificates.'],
  ['Spare tiles, paint and touch-up kit', 'Leftover tiles and paint, labelled with room and colour', 'Tile and paint suppliers', 'T', 'Useful for repairs later, and the paint schedule records the colours.'],
  ['Smoke alarm spare batteries and test notes', 'Spare batteries if the alarms have them, and the test method', 'Bunnings and electrical suppliers', 'T', 'Smoke alarms are checked as safety items at the final inspection.'],
  ['Maintenance guide', 'A short guide: cleaning, gutters, sealant, tile grout, termite checks and service dates', 'Builder or consultant', 'T', 'Not stated on the pages read.'],
  ['Builder’s clean', 'A final clean before the inspection and the handover', 'Cleaning contractor', 'T', 'Do it after the last trade has finished.'],
];
export const quotes = [
  { who: 'Building surveyor', n: '2', what: ['Final inspection and occupancy permit fee', 'Which certificates they require', 'Time to issue after the final inspection'] },
  { who: 'Independent building consultant', n: '2 or 3', what: ['Pre-handover inspection and report', 'Photos and a defects list', 'A recheck after the fixes'] },
  { who: 'Cleaner', n: '3', what: ['Builder’s clean before handover', 'Windows, tiles, floors and fixtures included or not', 'Rubbish removal'] },
  { who: 'Termite installer', n: '2', what: ['Termite protection certificate and notice', 'Inspection schedule and renewal cost', 'Warranty terms'] },
  { who: 'Engineer', n: '2', what: ['Final certificates or statements', 'Site inspection fee', 'Time to issue'] },
];
export const quoteTips = [
  'Ask the surveyor for their final certificate list early, so the trades can be told what to hand over before they leave site.',
  'Put the certificate for each trade into the trade’s own quote, so the price covers the paperwork.',
  'Ask the consultant to list defects against the plans and specifications, not against personal taste.',
  'Keep the final payment tied to the contract terms and to the permit, and do not pay in advance.',
  'Ask the termite installer for the inspection schedule and who reminds the owner.',
];
export const inspections = [
  ['Practical completion walk-through', 'Owner and builder', 'Before the final inspection', 'Everything in the plans and specifications is finished to the agreed standard and the major defects are fixed.', 'V', 'cavComplete'],
  ['Defects list and recheck', 'Owner and builder', 'Before the final payment', 'Each listed item is fixed or agreed in writing, and rechecked.', 'T'],
  ['Plumbing certificate of compliance', 'Plumber', 'Before the final inspection', 'The certificate for all plumbing work is in hand.', 'V', 'shepCerts'],
  ['Certificate of electrical safety', 'Electrician', 'Before the final inspection', 'The certificate for all electrical work is in hand.', 'V', 'shepCerts'],
  ['Glazing certificate', 'Glazier', 'Before the final inspection', 'Windows and shower screens installed to AS 1288 and AS 2047.', 'V', 'shepCerts'],
  ['Termite protection certificate and notice', 'Termite installer', 'Before the final inspection', 'The certificate is in hand and the durable notice is inside the switchboard.', 'V', 'shepCerts'],
  ['Energy report letter', 'Designer or assessor', 'Before the final inspection', 'A letter confirms the building work meets the Energy Report.', 'V', 'shepCerts'],
  ['Waterproofing certificate', 'Waterproofer or builder', 'Before the final inspection', 'The wet areas certificate is completed and signed.', 'V', 'shepCerts'],
  ['BAL letter', 'Designer or consultant', 'Before the final inspection', 'Where it applies, a letter confirms the dwelling meets the required BAL under AS 3959.', 'V', 'shepCerts'],
  ['Safety items working', 'Surveyor', 'At the final inspection', 'Smoke alarms are in place and working, and stormwater is connected to the council’s legal point of discharge.', 'V', 'shepCerts'],
  ['Final inspection', 'Building surveyor', 'After the certificates are in', 'The finished building matches the permit and the paperwork is complete.', 'T'],
  ['Occupancy permit or certificate of final inspection', 'Building surveyor', 'After the final inspection', 'A new home has an occupancy permit before anyone moves in. An extension or alteration has a certificate of final inspection.', 'V', 'bpcEnd'],
  ['Final cost report', 'Owner or surveyor', 'Within 28 days of becoming aware', 'A cost change of $15,625 or more on a non-staged permit is reported to the BPC.', 'V', 'bpcEnd'],
  ['Handover check', 'Builder and owner', 'At handover', 'Keys, certificates, warranties, manuals, plans, the Notice of Cover and the maintenance guide are handed over and signed for.', 'T'],
];
export const exam = [
  ['When is an occupancy permit required?', 'The building permit states which you need. A new home, including units and apartments, always needs one before it is occupied.', 'V', 'bpcEnd'],
  ['What does an occupancy permit confirm?', 'That the building surveyor is satisfied the building is suitable for occupation.', 'V', 'bpcEnd'],
  ['What is the offence about an occupancy permit?', 'Occupying a new building before receiving the permit is an offence under the Building Act 1993.', 'V', 'bpcEnd'],
  ['Who may apply for an occupancy permit?', 'The owner or the builder.', 'V', 'bpcEnd'],
  ['What can the surveyor ask for before issuing it?', 'Certificates or statements from the practitioners involved in the construction.', 'V', 'bpcEnd'],
  ['When is a certificate of final inspection issued?', 'For extensions or alterations to existing homes, which do not need a new occupancy permit.', 'V', 'bpcEnd'],
  ['Why does a certificate of final inspection matter?', 'One council says it sets the start date for the liability period for building faults.', 'V', 'stonOcc'],
  ['From what date does the 10-year limit for building actions run?', 'A law firm article reads section 134 of the Building Act 1993 as 10 years after the date of issue of the occupancy permit. The Act was not opened, and CAV says 10 years from completion, so confirm.', 'C', 'madd134'],
  ['How long can a claim be made against a builder, according to CAV?', 'Up to 10 years from the date the work was completed, and the right passes to a new owner within that time.', 'V', 'cavWarranty'],
  ['What are the implied warranties on domestic building work?', 'The CAV page lists four: work done in a workman-like manner, with reasonable care and skill, using suitable materials, and within the date in the contract. The Act itself was not opened.', 'V', 'cavWarranty'],
  ['Can the warranties be signed away?', 'No. Neither the builder nor the client can waive them, and they apply whatever the cost and whether or not the contract is written.', 'V', 'cavWarranty'],
  ['Which scheme replaced DBI for new work?', 'Home Warranty, for eligible work under contracts signed on or after 1 July 2026. HIA and MBAV call it the First Resort Home Warranty Scheme.', 'V', 'bpcHW'],
  ['What does Home Warranty apply to?', 'Eligible domestic building work over $20,000 for homes and residential buildings up to three storeys.', 'V', 'bpcHW'],
  ['What is the maximum Home Warranty cover?', '$400,000 per home, subject to eligibility, limits and exclusions.', 'V', 'bpcHW'],
  ['How long can an owner claim for defects under Home Warranty?', 'Major defects up to 6 years and other defects or non-compliant work up to 2 years after completion.', 'V', 'bpcHW'],
  ['What does Home Warranty cover?', 'Eligible work that is incomplete, defective or non-compliant, with related costs such as lost deposits, accommodation, removal and storage, and securing an incomplete site.', 'V', 'bpcHW'],
  ['Must the owner contact the builder first?', 'In most cases yes: the page says to first try to resolve the issue with the builder.', 'V', 'bpcHW'],
  ['When does Home Warranty cover start?', 'From the earliest of the builder paying the premium, starting the work or signing the major domestic building contract.', 'V', 'bpcHW'],
  ['When must the builder pay the premium?', 'Before the earlier of 10 business days after signing or the work starting.', 'V', 'bpcHW'],
  ['What happens to DBI policies issued before 1 July 2026?', 'They continue on their original terms until they expire and do not transfer to Home Warranty.', 'V', 'bpcHWb'],
  ['How did the old DBI differ?', 'It was a last resort in limited cases such as the builder becoming insolvent, disappearing or dying. The new scheme lets owners claim when a building issue is first identified.', 'V', 'vicHW'],
  ['What did CAV say DBI protected?', 'If the builder died, became insolvent or disappeared, for 6 years for work over $16,000 where insurance was taken out. That is the old scheme.', 'V', 'cavComplete'],
  ['What notification period did a law firm report for Home Warranty?', '12 months to notify the BPC from when the owner is aware of a defect, with incomplete work sub-limited to 30% of the contract sum. These are not on the BPC pages read, so confirm.', 'C', 'hweHW'],
  ['What are the stage payment limits to build all stages?', 'Base 10%, frame 15%, lock-up 35% and fixing 25%. The 15% balance after fixing is the remainder, so confirm it.', 'C', 'cavPay2'],
  ['What is the maximum deposit?', '10% for contracts under $20,000 and 5% for contracts of $20,000 or more.', 'V', 'cavPay2'],
  ['When does the owner pay?', 'For completed stages. The page says do not pay in advance, and warns that Home Warranty may not cover work paid for before completion.', 'V', 'cavPay2'],
  ['What should the owner check before the final payment?', 'That everything in the contract is delivered and in working order.', 'V', 'cavComplete'],
  ['When must a cost change be reported to the BPC?', 'For non-staged permits, within 28 days of becoming aware of an increase or decrease of $15,625 or more. A penalty levy may apply if an increase is not reported.', 'V', 'bpcEnd'],
  ['Who reports the revised cost for permit amendments accepted from 26 November 2025?', 'The relevant building surveyor notifies the BPC. Otherwise the applicant does.', 'V', 'bpcEnd'],
  ['Which documents did one council list at final inspection?', 'The occupancy permit application, the certificate of electrical safety, the plumber’s certificate of compliance, termite protection certificates with a notice in the switchboard, the glazier’s certificate, the energy letter, the waterproofing certificate, septic approval and a BAL letter where they apply.', 'V', 'shepCerts'],
  ['Which Standards does the glazier’s certificate name?', 'AS 1288 and AS 2047 (one council’s list).', 'V', 'shepCerts'],
  ['Where does the termite notice go?', 'Fixed inside the electrical switchboard (one council’s list).', 'V', 'shepCerts'],
  ['What should the owner do about defects?', 'List incomplete or faulty work, raise it with the builder straight away, and send a written request to complete or fix the work by registered post.', 'V', 'cavComplete'],
  ['May the owner get an independent check?', 'Yes. The owner may pay an independent building consultant to check for defects or unfinished work.', 'V', 'cavComplete'],
  ['When do the 2025 contract law changes take effect?', 'By 1 December 2026, on a date to be proclaimed. The current laws apply until then.', 'V', 'cavNewLaws'],
  ['What can the 2025 Act do about progress payments?', 'Progress payment stages and limits can be set by regulation, and payments for completed work must meet a proportionality requirement.', 'V', 'cavNewLaws'],
  ['When can an owner terminate under the 2025 Act?', 'A law firm says if the price rises by 15% or more or completion exceeds 1.5 times the agreed period (section 41).', 'V', 'maddActs'],
  ['Put in order: final payment, occupancy permit, certificates, practical completion, handover.', 'Practical completion, certificates, final inspection and occupancy permit, final payment, handover. A contract can tie the final payment to the permit, so confirm.', 'C'],
];
export const sources = ['bpcEnd', 'vbaEnd', 'cavComplete', 'cavWarranty', 'cavPay2', 'stonOcc', 'shepCerts', 'madd134', 'cavNewLaws', 'maddActs', 'bpcHW', 'bpcHWb', 'bpcDBI', 'vicHW', 'hweHW', 'hiaHW', 'mbavJuly'];
export const caution = 'Home Warranty replaced Domestic Building Insurance for eligible work under contracts signed on or after 1 July 2026. The BPC pages give the $20,000 threshold, the $400,000 cap and the 6-year and 2-year periods, while a law firm reports a 12-month notification period and a 30% sub-limit that the BPC pages read do not show, so those are Confirm. The Domestic Building Contracts Amendment Act 2025 takes effect by 1 December 2026 and can change the stage payments. The Building Act 1993, the Domestic Building Contracts Act 1995 and the 2026 insurance regulations were not opened, so the 10-year limit and the warranty list come from CAV and law firm pages. The certificate list is one council’s and another surveyor may ask for different documents. Final inspection and handover details are Typical.';

// Step 17 study content: drawings, steps, trades, materials, quotes, inspections and exam cards for external works.
// Flags: V = Verified against a source named in SOURCES, T = Typical practice, C = Confirm. Read on 9 November 2026: VBA Building Practice Note BP 01 (version 4.0, marked superseded on 1 November 2023) and the building.vic.gov.au copy,
// VBA SD 01 (version 2.0, 24 April 2023), NCC Housing Provisions 3.3 and 3.2, council pages for retaining walls, fences, stormwater and one council vehicle crossing specification, and the Victorian Government fencing page.
// The Building Regulations 2018 (Schedule 3, regulation 133), AS 4678 (earth-retaining structures), AS 1684, AS 3600 and each council's own crossing standard were NOT opened, so design rules, footing sizes and other councils' crossing rules are Typical or Confirm.
// BP 01 was superseded on 1 November 2023 and the current note was not found, so its thresholds are Verified for that version only and must be confirmed. The yard, wall, fence, shed and crossing in the model are illustrative.
import { svg, T, L, R, C as Circ, P, dim, call, arrow } from './dwg.js';

const wrapT = (x, y, text, n, dy = 18, cls = 'd-mute') => { const out = []; let cur = ''; for (const w of text.split(' ')) { if ((cur + ' ' + w).trim().length > n) { out.push(cur); cur = w; } else cur = (cur + ' ' + w).trim(); } if (cur) out.push(cur); return out.map((t, i) => T(x, y + i * dy, t, { cls })); };
const keyList = (body, x, y, items, n, step, off = 20) => items.forEach(([k, t], i) => { body.push(T(x, y + i * step, k, { cls: 'd-bold' }), ...wrapT(x + off, y + i * step, t, n, 16, '')); });

/* ---------- drawings ---------- */
function permitsDwg() {
  const body = [R(0, 0, 900, 1100, 'd-bg')];
  body.push(T(40, 40, 'Which external work needs which permit', { cls: 'd-bold' }), T(40, 68, 'A  Exemptions in BP 01 v4.0 (superseded 1 Nov 2023: confirm the current note and Schedule 3 of the Building Regulations 2018)', { cls: 'd-bold' }));
  body.push(R(40, 84, 820, 28, 'd-box'), T(52, 103, 'Work', { cls: 'd-bold' }), T(212, 103, 'No building permit if (BP 01 v4.0)', { cls: 'd-bold' }), T(640, 103, 'Watch for', { cls: 'd-bold' }));
  const rows = [
    ['Retaining wall', 'Less than 1 m high, unless it is tied to other building work or protects adjoining property', 'Council pages say 1 m or over needs a permit. Engineer design. Overlays'],
    ['Fence', 'Not more than 2 m. Within 3 m of a street 1.5 m, or 1.2 m if masonry or concrete. Within 9 m of a street intersection 1 m above the footpath', 'Pool and spa barriers are separate. Fences Act 1968 for dividing fences'],
    ['Deck', 'No exemption: a deck attached to a building needs a permit, and so does a detached deck that is part of the amenity of a building', 'The building.vic.gov.au copy says regardless of size'],
    ['Pergola', 'Not more than 3.6 m high and 20 m² floor area, and no further forward than the front wall (2.5 m forward for a Class 1)', 'A planning permit may still be needed'],
    ['Carport, garage or shed (freestanding Class 10a)', 'Floor area 10 m² or less, 3 m high or less (2.4 m within 1 m of a boundary), not masonry, and not forward of the front wall of the building it serves', 'Over an easement the authority may need to consent. Planning permit'],
    ['Vehicle crossing', 'Not a building permit: a council permit for works in the road reserve is needed first', 'Each council has its own standard and fee'],
    ['Stormwater', 'A council report on the legal point of discharge goes with a permit application that includes a stormwater system (regulation 133(2))', 'The surveyor approves the system against the report'],
  ];
  rows.forEach(([a, b, c], i) => {
    const y = 124 + i * 86;
    body.push(...wrapT(52, y + 16, a, 20, 16, 'd-bold'), ...wrapT(212, y + 16, b, 56, 16, ''), ...wrapT(640, y + 16, c, 30, 16, 'd-mute'), L(40, y + 78, 860, y + 78, 'd-dim'));
  });
  body.push(T(40, 770, 'B  Fence heights near the street (elevation, not to scale: 60 px per m)', { cls: 'd-bold' }));
  const gy = 980, H = (m) => m * 60;
  body.push(L(40, gy, 640, gy, 'd-ground'));
  body.push(R(60, gy - H(1.2), 140, H(1.2), 'd-brick'), R(250, gy - H(1.5), 140, H(1.5), 'd-timber'), R(440, gy - H(1.8), 140, H(1.8), 'd-timber'));
  body.push(L(40, gy - H(2.0), 620, gy - H(2.0), 'd-cut'), T(44, gy - H(2.0) - 5, '2.0 m limit', { cls: 'd-mute' }));
  body.push(...wrapT(60, gy + 20, 'a  Masonry within 3 m of the street: 1.2 m', 20, 16, ''), ...wrapT(250, gy + 20, 'b  Other fence within 3 m of the street: 1.5 m', 20, 16, ''), ...wrapT(440, gy + 20, 'c  Side or rear boundary: 1.8 m shown, 2.0 m is the limit', 20, 16, ''));
  body.push(T(660, 770, 'C  Fences Act 1968, in short', { cls: 'd-bold' }));
  keyList(body, 660, 798, [['1', 'Serve a fencing notice. Registered post gives proof.'], ['2', 'The neighbour has 30 days to respond.'], ['3', 'No reply: build, then seek their share in the Magistrates’ Court.'], ['4', 'Costs are shared equally. Someone who wants a better fence pays the difference.']], 26, 62);
  body.push(...wrapT(40, 1075, 'Heights are from BP 01 v4.0 and the Hume council page. The Fences Act points are from the Victorian Government fencing page. The model front fence is 1.2 m and the side fences 1.8 m.', 120, 16));
  return svg(900, 1100, body.join(''), 'Which external work needs which permit');
}

function retainDwg() {
  const body = [R(0, 0, 900, 1000, 'd-bg')];
  body.push(T(40, 40, 'The retaining wall: height, drainage and the permit test', { cls: 'd-bold' }), T(40, 68, 'A  Section through a sleeper wall (illustrative, not to scale: numbers 1 to 7 match the labels in the 3D wall room)', { cls: 'd-bold' }));
  // ground levels: low side left, high side right
  body.push(R(80, 420, 250, 90, 'd-soil'), R(340, 270, 300, 240, 'd-soil'));
  body.push(L(60, 420, 340, 420, 'd-ground'));
  body.push(R(300, 470, 200, 50, 'd-conc'), R(336, 250, 8, 280, 'd-steel'));
  for (let k = 0; k < 4; k++) body.push(R(343, 270 + k * 37, 14, 37, 'd-conc'));
  body.push(R(358, 270, 4, 200, 'd-wm'), R(362, 270, 52, 200, 'd-sand'), Circ(400, 452, 10, 'd-pipe'));
  body.push(L(340, 270, 640, 270, 'd-ground'));
  body.push(dim(300, 270, 300, 420, '0.9 m', 1));
  body.push(call(1, 400, 495, 400, 560), call(2, 340, 330, 250, 330), call(3, 361, 340, 440, 220), call(4, 350, 300, 250, 250), call(5, 395, 455, 520, 560), call(6, 390, 330, 520, 330), call(7, 560, 400, 700, 440));
  keyList(body, 660, 110, [['1', 'Footing'], ['2', 'Post'], ['3', 'Geotextile'], ['4', 'Sleepers'], ['5', 'Ag pipe'], ['6', 'Free-draining gravel'], ['7', 'Retained soil']], 30, 28);
  body.push(...wrapT(40, 590, 'Height is measured from the top of the wall to its lowest point (Boroondara page). BP 01 v4.0 exempts a wall less than 1 m high unless it is tied to other building work or protects adjoining property. Council pages say 1 m or over needs a building permit and an engineer’s design and certification.', 112, 16));
  body.push(T(40, 680, 'B  The permit test, step by step', { cls: 'd-bold' }));
  const steps = [['1  Height', ['Under 1 m, or 1 m', 'or over? Measure top', 'to lowest point']], ['2  Linked work', ['Is it part of other', 'building work, or does', 'it protect a neighbour?']], ['3  Boundary', ['Near a boundary or', 'building? Council page:', 'excavation walls over', '400 mm need a set-back', 'equal to their height']], ['4  Planning', ['Overlays, heritage,', 'easements, protected', 'trees, covenants']], ['5  Engineer', ['Engineer design and', 'certification for a', 'wall that needs a', 'permit (council page)']]];
  steps.forEach(([h, ls], i) => { const x = 40 + i * 167; body.push(R(x, 700, 150, 130, 'd-box', 6), T(x + 12, 724, h, { cls: 'd-bold' }), ...ls.map((t, k) => T(x + 12, 746 + k * 16, t, { cls: 'd-mute' }))); if (i < 4) body.push(arrow(x + 150, 765, x + 167, 765)); });
  body.push(...wrapT(40, 870, 'The set-back and overlay points are from the Boroondara council page, not from the Regulations, so they are Confirm. The NCC 3.2 page read has no retaining wall rules, and AS 4678 was not opened, so loads, footings and drainage design come from the engineer.', 112, 16));
  body.push(...wrapT(40, 940, 'Retaining groundwater: the Boroondara stormwater page says groundwater cannot go into the council drain, so ask the council and the surveyor where a wall drain may discharge.', 112, 16));
  return svg(900, 1000, body.join(''), 'The retaining wall: height, drainage and the permit test');
}

function drainDwg() {
  const body = [R(0, 0, 900, 1010, 'd-bg')];
  body.push(T(40, 40, 'Stormwater to the legal point of discharge, and falls away from the house', { cls: 'd-bold' }), T(40, 68, 'A  Plan of the block (illustrative, 15 px per m: the street is at the bottom)', { cls: 'd-bold' }));
  const bx = 100, by = 90, bw = 225, bh = 525, X = (x) => bx + (x + 7.5) * 15, Z = (z) => by + (z + 17.5) * 15;
  body.push(R(bx, by, bw, bh, 'd-lot'), R(X(-5.5), Z(-5.5), 165, 255, 'd-house'));
  body.push(R(bx - 20, by + bh + 8, bw + 40, 28, 'd-conc'), R(bx - 20, by + bh + 36, bw + 40, 50, 'd-road'));
  body.push(T(bx + 112, by + bh + 27, 'Footpath and kerb', { anchor: 'middle', cls: 'd-mute' }), T(bx + 112, by + bh + 66, 'Street', { anchor: 'middle', cls: 'd-bold' }));
  body.push(T(X(0), Z(3) + 4, 'House', { anchor: 'middle', cls: 'd-bold' }));
  const pitA = [X(-6.2), Z(-4.5)], pitB = [X(-6.2), Z(6)], pitC = [X(-6.2), Z(16)], out = [X(-6.2), by + bh + 36];
  body.push(`<path d="M${pitA[0]} ${pitA[1]} L${pitB[0]} ${pitB[1]} L${pitC[0]} ${pitC[1]} L${out[0]} ${out[1]}" class="d-storm"/>`);
  for (const [x, y] of [pitA, pitB, pitC]) body.push(R(x - 6, y - 6, 12, 12, 'd-pit'));
  body.push(Circ(out[0], out[1], 8, 'd-lpod'));
  body.push(call('a', pitA[0], pitA[1], 62, pitA[1]), call('b', pitB[0], pitB[1], 62, pitB[1]), call('c', pitC[0], pitC[1], 62, pitC[1]), call('d', out[0], out[1], 62, out[1]));
  for (const [x, z, ux, uy] of [[0, 11.5, 0, 1], [0, -5.5, 0, -1], [5.5, 3, 1, 0], [-5.5, 3, -1, 0]]) body.push(arrow(X(x), Z(z), X(x) + ux * 26, Z(z) + uy * 26, 'd-cut'));
  keyList(body, 360, 110, [['a', 'Pit at the rear corner, collects the downpipe'], ['b', 'Pit at mid length'], ['c', 'Pit near the front boundary'], ['d', 'Legal point of discharge at the kerb, set by the council report'], ['→', 'Ground falls away from the walls']], 46, 44);
  body.push(...wrapT(360, 350, 'The council is responsible for the drain beyond the legal point of discharge, and the owner for the system up to it (VBA SD 01). A council report names the point, and the surveyor approves the system against it. The point is usually an underground drain, a kerb or an open table drain (council page). The pipes in the model run above ground so they can be seen.', 54, 16));
  body.push(T(360, 480, 'B  Falls and levels (NCC Housing Provisions 3.3.3, fall exaggerated)', { cls: 'd-bold' }));
  body.push(P([[360, 560], [480, 560], [620, 576], [620, 620], [360, 620]], 'd-soil'), R(360, 510, 120, 50, 'd-slabfill'), L(480, 560, 620, 576, 'd-line'), T(370, 540, 'Slab edge', { cls: 'd-bold' }));
  body.push(dim(620, 560, 620, 576, '50 mm', 1), dim(480, 632, 620, 632, '1 m', 1));
  body.push(...wrapT(360, 662, 'Finished ground falls at least 50 mm over the first 1 m, or 25 mm for reasonably impermeable surfaces in a low rainfall area. The slab edge is at least 100 mm above finished ground in a low rainfall or sandy well-drained area, 50 mm above a sloping impermeable area and 150 mm in other cases.', 54, 16));
  body.push(T(360, 770, 'C  Cover over a 90 mm Class 6 UPVC drain (NCC 3.3)', { cls: 'd-bold' }));
  [['Under soil', '100 mm'], ['Under paving or concrete', '50 mm to the underside'], ['Light vehicle traffic', '75 mm reinforced concrete'], ['', '100 mm paved']].forEach(([a, b], i) => { const y = 796 + i * 26; body.push(T(364, y, a, { cls: 'd-bold' }), T(560, y, b, { cls: '' }), L(360, y + 8, 860, y + 8, 'd-dim')); });
  body.push(...wrapT(40, 950, 'The NCC page states no edition. Pipe sizes and pit spacing were not in the VBA note or the council pages, so they come from the drainer’s design and the surveyor.', 112, 16));
  return svg(900, 1010, body.join(''), 'Stormwater to the legal point of discharge, and falls away from the house');
}

function crossingDwg() {
  const body = [R(0, 0, 900, 1030, 'd-bg')];
  body.push(T(40, 40, 'The vehicle crossing and the driveway', { cls: 'd-bold' }), T(40, 68, 'A  Section through a crossing (Banyule specification, illustrative: numbers 1 to 7 match the labels in the 3D crossing room)', { cls: 'd-bold' }));
  body.push(R(130, 300, 480, 60, 'd-soil'), R(130, 280, 480, 20, 'd-sand'), R(130, 220, 480, 60, 'd-conc'), L(130, 250, 610, 250, 'd-mesh'));
  body.push(R(70, 250, 60, 30, 'd-site'), R(610, 190, 40, 90, 'd-conc'), R(650, 240, 150, 40, 'd-road'));
  body.push(L(40, 220, 820, 220, 'd-ground'));
  body.push(T(130, 122, 'Slab: 150 mm minimum, drawn at about true thickness against the 50 mm base', { cls: 'd-mute' }));
  body.push(call(1, 250, 330, 250, 400), call(2, 400, 290, 400, 400), call(3, 300, 250, 300, 150), call(4, 450, 232, 450, 150), call(5, 100, 265, 100, 150), call(6, 630, 235, 720, 150), call(7, 720, 262, 780, 330));
  keyList(body, 90, 460, [['1', 'Compacted subgrade, hard and uniform'], ['2', '50 mm compacted fine crushed rock'], ['3', 'F72 mesh, placed centrally'], ['4', 'Concrete, 25 MPa, 150 mm minimum'], ['5', 'Footpath next to the crossing'], ['6', 'Kerb and channel'], ['7', 'Road']], 44, 28);
  body.push(...wrapT(480, 460, 'The specification says 25 MPa concrete at 28 days, at least 150 mm over 50 mm of compacted fine crushed rock, and F72 mesh placed centrally in concrete thicker than 100 mm. It is one council’s specification, last amended in 2015, so every council’s own standard governs.', 48, 16));
  body.push(T(40, 700, 'B  Width and permit steps (Banyule specification)', { cls: 'd-bold' }));
  keyList(body, 40, 730, [['W', 'Width 3.0 m minimum and 7.6 m maximum at the building line'], ['K', 'Corner lot: at least 9.0 m from the intersection of the lot boundaries'], ['O', 'Trees, pits, poles, valves and manholes are moved through the authority before the permit is issued']], 50, 50);
  const steps = [['1  Permit', ['Works within the road', 'reserve, valid 28 days']], ['2  Inspect', ['24 hours’ notice, and the', 'officer’s approval before', 'the pour']], ['3  Pour', ['Cure: above 25 °C keep', 'the concrete moist for', 'seven days']], ['4  Final', ['Final inspection. Non-', 'conforming work can be', 'ordered out']]];
  steps.forEach(([h, ls], i) => { const x = 40 + i * 210; body.push(R(x, 890, 190, 90, 'd-box', 6), T(x + 12, 914, h, { cls: 'd-bold' }), ...ls.map((t, k) => T(x + 12, 934 + k * 16, t, { cls: 'd-mute' }))); if (i < 3) body.push(arrow(x + 190, 935, x + 210, 935)); });
  body.push(...wrapT(40, 1008, 'Boroondara asks for a Road Opening Permit for works on local roads, and consent from the Department of Transport and Planning where the road is a declared road.', 112, 16));
  return svg(900, 1030, body.join(''), 'The vehicle crossing and the driveway');
}

export const drawings = [
  { id: 'permits', title: 'Which external work needs which permit', scale: 'Table and elevation, not to scale', svg: permitsDwg(),
    notes: ['The table is BP 01 version 4.0, which the VBA marked superseded on 1 November 2023. The current note was not found, so the numbers are Verified for that version and Confirm for today. Schedule 3 of the Building Regulations 2018 holds the prescribed exemptions and was not opened.', 'A building permit exemption does not remove the planning permit, the easement consent or the National Construction Code. A freestanding Class 10a building over an easement may need the authority’s consent.', 'The Fences Act points come from the Victorian Government page. The Hume council page words the retaining wall limit as higher than 1 m, while BP 01 says less than 1 m is exempt, so a wall exactly 1 m high is a Confirm point.', 'The model front fence is 1.2 m and the side and rear fences are 1.8 m. The shed is 9.4 m² and 2.4 m high at its tallest.'] },
  { id: 'retain', title: 'The retaining wall: height, drainage and the permit test', scale: 'Section not to scale', svg: retainDwg(),
    notes: ['Numbers 1 to 7 match the labels in the 3D wall room. The wall is drawn as a concrete sleeper wall, which is typical but not the only kind.', 'The height test is top of wall to lowest point. BP 01 exempts a wall under 1 m unless it is linked to other building work or protects adjoining property.', 'The set-back and overlay points are from one council page. The NCC 3.2 page read has no retaining wall rules, and AS 4678 and the engineer’s design govern loads, footings and drainage.', 'Where drained groundwater may discharge is a council question, because one council page says groundwater cannot go into its drain.'] },
  { id: 'drain', title: 'Stormwater to the legal point of discharge, and falls away from the house', scale: 'Plan at 15 px per m', svg: drainDwg(),
    notes: ['The VBA note says the council report identifies the legal point of discharge, the owner is responsible up to it, and the surveyor must approve the system consistent with the report. Regulation 133(2) calls for the report with a permit application that includes a stormwater system.', 'NCC Housing Provisions 3.3.3 sets the falls and slab heights shown, and the 3.3 cover figures are for 90 mm Class 6 UPVC. The page states no edition.', 'Pipe sizes and pit spacing were not in the pages read, so they come from the drainer’s design and the surveyor.', 'Letters a to d match the pits and the kerb outlet in the 3D scene.'] },
  { id: 'crossing', title: 'The vehicle crossing and the driveway', scale: 'Section not to scale', svg: crossingDwg(),
    notes: ['The figures are from one council’s specification, CD8716, last amended on 14 July 2015. Other councils set their own concrete, thickness, width, set-out and fees, so read the one for the property.', 'Numbers 1 to 7 match the labels in the 3D crossing room. Layers are drawn at about true thickness.', 'The permit is a council permit for works in the road reserve, not a building permit, and in the specification it is valid for 28 days.', 'The driveway on the private side is not covered by the specification read, so its thickness and finish are Typical.'] },
];

/* ---------- steps ---------- */
export const howto = [
  ['Decide which external work needs a building permit', 'Check each item against the Building Practice Note exemptions: retaining walls under 1 m, fences up to 2 m (lower near the street), pergolas, and freestanding Class 10a buildings of 10 m² or less. Decks attached to a building need a permit. A planning permit or easement consent may still apply.', 'Builder, with the surveyor', 'V', 'bp01Vba'],
  ['Get the legal point of discharge from the council', 'Apply for the council report that names the legal point of discharge. It goes with any permit application that includes a stormwater system, and the surveyor approves the system against it.', 'Builder or drainer, council and surveyor', 'V', 'vbaSd01'],
  ['Lay the stormwater and set the falls', 'Drain the downpipes to the legal point of discharge, with the cover over the pipes that the NCC gives. Grade the finished ground so it falls away from the house, and keep the slab edge above it by the NCC height.', 'Licensed plumber and landscaper', 'V', 'nccHp33'],
  ['Build the retaining wall to the engineer’s design', 'Footings, posts and sleepers are built to the design. The drain, geotextile and free-draining gravel go in as the wall rises, and the outlet is agreed before the backfill.', 'Wall builder and engineer', 'C'],
  ['Serve the fencing notice and build the fences', 'For a dividing fence serve a fencing notice and allow the 30 days. Check the height against the street limits, then fix posts, rails and palings.', 'Owner, builder and fencer', 'V', 'vicFencing'],
  ['Get the crossing permit and build the crossing', 'Apply to the council for the permit to work in the road reserve. Book the inspection before the pour, pour and cure the concrete, and book the final inspection.', 'Concreter and council', 'V', 'banyuleCross'],
  ['Pour the driveway and the paths', 'The driveway is poured over compacted fine crushed rock with mesh, falls to a drain, and joints cut. The finish and thickness on the private side are the designer’s.', 'Concreter', 'T'],
  ['Place the shed or garage, and the deck, within the rules', 'A freestanding Class 10a building is exempt only if it meets every BP 01 condition. If it is bigger, taller, masonry or forward of the front wall, or it is a deck attached to the house, it needs a building permit.', 'Builder and surveyor', 'V', 'bp01Vba'],
  ['Plant and mulch without bridging the slab edge', 'Garden beds, mulch and turf stay below the slab edge height and clear of the termite barrier and the weep holes. Keep roots and irrigation away from the footings.', 'Landscaper', 'T'],
  ['Check, photograph and remove the temporary works', 'Photograph the drains, the wall drainage and the footings before they are covered. Remove the temporary fence and site facilities, and take the external work to the final inspection in Stage 18.', 'Builder and surveyor', 'T'],
];
export const trades = [
  { t: 'Drainer or plumber', role: 'Lays the stormwater pipes and pits to the legal point of discharge and tests them.', when: 'After the slab and before the paving', reg: 'Whether the stormwater work needs a licensed plumber and a certificate was not checked here. The VBA note says the surveyor approves the system against the council report.', ask: ['The legal point of discharge on the council report', 'Pipe size, cover and fall for each run', 'Test and certificate for the work'] },
  { t: 'Structural engineer', role: 'Designs the retaining wall, its footings and its drainage, and inspects it.', when: 'Before the wall is quoted', reg: 'A council page asks for a design and certification by a qualified structural engineer for a wall that needs a permit.', ask: ['Wall height, surcharge and soil assumptions', 'Footing, post and sleeper details', 'Which inspections they will attend'] },
  { t: 'Wall builder or landscaper', role: 'Builds the retaining wall, the drain and the backfill, and finishes the garden.', when: 'After the house is built, before the garden', reg: 'Not checked here. Check licensing before engaging someone directly.', ask: ['The drawings they will build to', 'Where the wall drain outlets', 'Photographs before the backfill'] },
  { t: 'Fencer', role: 'Sets posts and rails and fixes palings or sheets along the boundaries.', when: 'After the retaining wall and before the landscaping', reg: 'Not checked here. A dividing fence is subject to the Fences Act 1968.', ask: ['Heights and the street limits', 'Post depth, footing and timber treatment', 'Who serves the fencing notice'] },
  { t: 'Concreter', role: 'Builds the vehicle crossing, driveway and paths: base, mesh, pour, joints and curing.', when: 'After the council permit', reg: 'Not checked here. Council inspects the crossing.', ask: ['The council specification they will build to', 'Concrete strength, thickness and mesh', 'Who books the inspections'] },
  { t: 'Carpenter and shed installer', role: 'Builds the deck and installs the shed or garage.', when: 'After the permit or exemption check', reg: 'Not checked here.', ask: ['Floor area, height and distance to the boundary', 'Whether a permit is needed', 'Fixings and footings'] },
  { t: 'Building surveyor', role: 'Decides if each item needs a permit, approves the stormwater against the council report and inspects.', when: 'Permit stage and the final inspection', reg: 'Registered building surveyor.', ask: ['Which external items are in the permit', 'Which inspections they want for the drains and the wall', 'What they need for the final'] },
];
export const materials = [
  ['Treated pine posts, rails and palings', 'Timber for a paling fence, with treated posts for ground contact (H4 is typical: confirm in the design)', 'Bunnings and timber yards', 'T', 'The Victorian Government page gives a 1.8 m timber paling fence as an example.'],
  ['Concrete for post footings', 'Pre-mix or bagged concrete for the post holes', 'Bunnings and ready-mix suppliers', 'T', 'Hole size and depth come from the fence design.'],
  ['Concrete sleepers and steel posts', 'Precast sleepers between galvanised steel posts, sized by the engineer', 'Landscape and retaining wall suppliers', 'T', 'A council page says walls can be timber, brick, concrete or rock.'],
  ['Geotextile and free-draining gravel', 'Fabric against the sleepers and clean gravel behind', 'Landscape suppliers', 'T', 'The drainage layers come from the engineer’s drawing.'],
  ['Slotted ag pipe', '100 mm slotted drainage pipe laid to a fall and an outlet', 'Bunnings and plumbing suppliers', 'T', 'Where it may discharge is a council question.'],
  ['90 mm Class 6 UPVC stormwater pipe and pits', 'Pipes, junctions and grated pits for the stormwater run', 'Plumbing suppliers and Bunnings', 'V', 'NCC 3.3 gives cover over 90 mm Class 6 UPVC under soil, paving and light traffic.'],
  ['Ready-mix concrete, 25 MPa', 'Concrete for the crossing, delivered by truck', 'Ready-mix suppliers', 'V', 'Banyule specification: 25 MPa at 28 days for a standard crossing.'],
  ['Fine crushed rock', 'Compacted base under the crossing and driveway', 'Quarries and landscape suppliers', 'V', 'Banyule specification: 50 mm of compacted fine crushed rock.'],
  ['F72 mesh and bar chairs', 'Reinforcing mesh for the crossing and driveway, kept off the ground on chairs', 'Reinforcing suppliers', 'V', 'Banyule specification: F72 mesh placed centrally in concrete over 100 mm thick.'],
  ['Colorbond-type shed kit', 'A steel shed kit, 10 m² or less, and its slab or base', 'Bunnings and shed suppliers', 'T', 'BP 01 exempts a freestanding Class 10a building of 10 m² or less that is not masonry.'],
  ['Mulch, soil and turf', 'Garden materials kept below the slab edge height', 'Landscape suppliers and Bunnings', 'T', 'NCC 3.3.3 sets slab height above finished ground.'],
];
export const quotes = [
  { who: 'Structural engineer', n: '2', what: ['Design and certification of the retaining wall', 'Inspections they will attend', 'Time to issue, so the permit is not held up'] },
  { who: 'Wall builder or landscaper', n: '3', what: ['Built to the engineer’s drawings, with the drain and outlet', 'Backfill, geotextile and gravel included or not', 'Photos before backfill'] },
  { who: 'Fencer', n: '3', what: ['Heights, timber and post depth', 'Removal of the old fence and gates', 'Who serves the fencing notice and the cost split'] },
  { who: 'Concreter', n: '3', what: ['Crossing and driveway to the council specification', 'Permit, inspections and any bond', 'Joints, finish and curing'] },
  { who: 'Drainer or plumber', n: '3', what: ['Stormwater to the legal point of discharge', 'Pits, pipes, cover and test', 'Council connection and any permit'] },
  { who: 'Shed or garage supplier', n: '2', what: ['Floor area, height and walls against the exemption', 'Slab or base, delivery and fixing', 'Who handles the permit if one is needed'] },
];
export const quoteTips = [
  'Give each trade the same drawings and the council specification, so the quotes can be compared.',
  'Ask the concreter who books the council inspections and who pays any bond, and allow for the 28 days the permit may last.',
  'Ask the engineer to say where the wall drain outlets, and agree it with the surveyor before the wall is quoted.',
  'Write the fence height and the distance from the street on the quote request, because the limit is lower near the street.',
  'For a dividing fence agree who serves the notice and how the cost is split before work starts.',
  'If a quote adds a deck or a shed, ask whether it needs a building permit, and keep the answer with the permit documents.',
];
export const inspections = [
  ['Permit or exemption check', 'Builder and surveyor', 'Before each item is quoted', 'Each external item is checked against BP 01 and written down as in the permit or exempt, with the reason.', 'V', 'bp01Vba'],
  ['Legal point of discharge', 'Builder and surveyor', 'Before the permit application', 'The council report is on file and the stormwater plan ends at the point it names.', 'V', 'vbaSd01'],
  ['Stormwater run', 'Drainer and surveyor', 'Before the trench is covered', 'Pipes are the right size with the required cover, falls are uniform and joints are tight.', 'V', 'nccHp33'],
  ['Falls away from the house', 'Builder', 'Before the garden and paving', 'Finished ground falls at least 50 mm over the first 1 m, or 25 mm where the NCC allows for impermeable surfaces.', 'V', 'nccHp33'],
  ['Slab edge height', 'Builder', 'Before the mulch and turf', 'The slab edge is at least 100, 50 or 150 mm above finished ground as the NCC says for the site.', 'V', 'nccHp33'],
  ['Retaining wall footings', 'Engineer', 'Before the footings are poured', 'Footings are the size and depth on the design and the ground matches the assumptions.', 'T'],
  ['Retaining wall drainage', 'Engineer and builder', 'Before the backfill', 'Geotextile, gravel and the drain are in, the drain falls to its outlet and photographs are taken.', 'T'],
  ['Retaining wall height and permit', 'Surveyor', 'Before the wall is built', 'The height is measured from the top of the wall to its lowest point, and the permit or exemption is on file.', 'V', 'boroRetain'],
  ['Fence heights', 'Builder', 'After the fence is built', 'Heights are within BP 01: 2 m, and 1.5 m or 1.2 m masonry within 3 m of the street, and 1 m near an intersection.', 'V', 'bp01Vba'],
  ['Fencing notice', 'Owner', 'Before a dividing fence is built', 'The notice was served, the 30 days have passed or the neighbour agreed, and the cost split is written down.', 'V', 'vicFencing'],
  ['Crossing permit and pre-pour inspection', 'Concreter and council', 'Before the pour', 'The permit is current, the base and mesh are in, and the council officer has approved the pour.', 'V', 'banyuleCross'],
  ['Crossing final inspection', 'Council', 'After the pour and cure', 'The crossing is built to the specification and the footpath and kerb are reinstated.', 'V', 'banyuleCross'],
  ['Class 10a exemption check', 'Surveyor', 'Before the shed or garage is ordered', 'Area, height, distance to the boundary, wall material and position all meet BP 01, or a permit is obtained.', 'V', 'bp01Vba'],
  ['Deck permit', 'Surveyor', 'Before the deck is built', 'An attached deck has a building permit, and so does a detached deck that is part of the amenity of a building.', 'V', 'bp01Vba'],
  ['Final external check', 'Builder and surveyor', 'Before the final inspection', 'Temporary works are removed, drains work, the garden is clear of the slab edge and photographs are on file.', 'T'],
];
export const exam = [
  ['When is a retaining wall exempt from a building permit?', 'BP 01 v4.0 says a retaining wall less than 1 m high is exempt, unless it is associated with other building work or protects adjoining property.', 'V', 'bp01Vba'],
  ['How is the height of a retaining wall measured?', 'From the top of the wall to its lowest point (Boroondara page).', 'V', 'boroRetain'],
  ['What do council pages say for a wall of 1 m or more?', 'A building permit is needed. One page says the drawings need design and certification by a structural engineer.', 'V', 'mrscRetain'],
  ['Does a wall under 1 m ever need a permit?', 'Yes, if it is tied to other building work or protects adjoining property, and council pages add walls near a building or boundary where damage is a risk.', 'V', 'mrscRetain'],
  ['What did one council say about excavation walls near a boundary?', 'For excavation walls over 400 mm the set-back from the boundary equals the wall height, 1 to 1. This is a council page, not the Regulations, so confirm it.', 'C', 'boroRetain'],
  ['Which planning controls can affect a retaining wall?', 'Heritage and several overlays can need a planning permit, and easements, covenants and protected trees need checking (Boroondara and Macedon Ranges pages).', 'V', 'boroRetain'],
  ['What is the maximum fence height without a building permit?', 'Not more than 2 m (BP 01 v4.0).', 'V', 'bp01Vba'],
  ['What are the limits for a fence within 3 m of a street?', '1.5 m if not masonry, concrete or similar, and 1.2 m if masonry, concrete or similar.', 'V', 'bp01Vba'],
  ['What is the limit near a street intersection?', 'Within 9 m of the intersection point the fence is limited to 1 m above the footpath.', 'V', 'bp01Vba'],
  ['Are pool barriers covered by the fence exemption?', 'No. BP 01 treats swimming pool and spa barriers separately.', 'V', 'bp01Dtp'],
  ['How are dividing fence costs shared?', 'Equally between neighbours under the Fences Act 1968. A neighbour who wants a better fence pays the difference.', 'V', 'vicFencing'],
  ['What is a fencing notice?', 'A formal document setting out a proposal to repair, replace or build a dividing fence. The neighbour has 30 days to respond.', 'V', 'vicFencing'],
  ['What if the neighbour does not respond?', 'The work can go ahead and you can seek their share in the Magistrates’ Court. The page recommends registered post to prove delivery.', 'V', 'vicFencing'],
  ['Does the law set a fence height or material?', 'No. A sufficient dividing fence depends on the existing style, the use of the land and local fence types. A 1.8 m timber paling fence is the page’s residential example.', 'V', 'vicFencing'],
  ['Which decks need a building permit?', 'A deck attached to a building does. A detached deck that is part of the amenity of a building does as well. The building.vic.gov.au copy says regardless of size.', 'V', 'bp01Dtp'],
  ['When is a pergola exempt?', 'Not more than 3.6 m high and 20 m² floor area, and no further forward than the front wall (2.5 m forward of it for a Class 1).', 'V', 'bp01Vba'],
  ['When is a freestanding Class 10a building exempt?', 'Floor area 10 m² or less, 3 m high or less (2.4 m within 1 m of a boundary), not masonry, and not further forward than the front wall of the building it serves.', 'V', 'bp01Vba'],
  ['What if the Class 10a building serves no other building?', 'It must be the only Class 10a building on the allotment, at least 9 m from the front street alignment and 2 m from each side street alignment.', 'V', 'bp01Vba'],
  ['What else can still apply to an exempt building?', 'A planning permit may be required and the work must still comply with the National Construction Code where it applies. Over an easement the authority may need to consent.', 'V', 'bp01Dtp'],
  ['Where are the prescribed exemptions?', 'Schedule 3 of the Building Regulations 2018, according to the building.vic.gov.au copy of BP 01. It was not opened here.', 'V', 'bp01Dtp'],
  ['What is the legal point of discharge?', 'The point where stormwater from a property flows into the council drainage network. The council report identifies it for the allotment.', 'V', 'vbaSd01'],
  ['Who is responsible for the drain either side of the legal point of discharge?', 'The owner up to the point, and the council beyond it (VBA SD 01).', 'V', 'vbaSd01'],
  ['Which regulation requires the council report?', 'Regulation 133(2) of the Building Regulations 2018 for a permit application that includes a stormwater drainage system.', 'V', 'vbaSd01'],
  ['Who approves the stormwater system?', 'The relevant building surveyor, ensuring the point of discharge is consistent with the council report.', 'V', 'vbaSd01'],
  ['What can the point of discharge be?', 'Usually an underground drain, a kerb or an open table drain (Stonnington page).', 'V', 'stonLpod'],
  ['What can go into the council stormwater system?', 'Rainwater only. The Boroondara page says groundwater and wastewater cannot, and wastewater goes to the sewer.', 'V', 'boroStorm'],
  ['What fall must finished ground have away from a slab-on-ground?', 'At least 50 mm over the first 1 m, or 25 mm over the first 1 m for reasonably impermeable surfaces in a low rainfall area (NCC 3.3.3). The page states no edition.', 'V', 'nccHp33'],
  ['How high must the slab edge be above finished ground?', 'At least 100 mm in low rainfall or sandy well-drained areas, 50 mm above a sloping impermeable area and 150 mm in other cases (NCC 3.3.3).', 'V', 'nccHp33'],
  ['What cover is needed over a 90 mm Class 6 UPVC drain?', '100 mm under soil, 50 mm under paving or concrete, and 75 mm under reinforced concrete or 100 mm paved for light vehicle traffic (NCC 3.3).', 'V', 'nccHp33'],
  ['What fall must a subsoil drain have?', 'A uniform fall of at least 1 in 300, discharging to an external silt pit or sump (NCC 3.3.4).', 'V', 'nccHp33'],
  ['What concrete does the Banyule specification require for a standard crossing?', '25 MPa at 28 days, 150 mm minimum over 50 mm of compacted fine crushed rock, with F72 mesh placed centrally. It is one council’s specification.', 'V', 'banyuleCross'],
  ['What width can a Banyule crossing be?', 'At least 3.0 m and at most 7.6 m at the building line, and on a corner lot at least 9.0 m from the intersection of the lot boundaries.', 'V', 'banyuleCross'],
  ['What permit is needed for a vehicle crossing?', 'A council permit for works in the road reserve. In Banyule it is valid for 28 days from payment, and the council inspects before the pour and at the end.', 'V', 'banyuleCross'],
  ['Which concreting step does the Banyule specification give for hot weather?', 'Above 25 °C the concrete is kept moist for seven days.', 'V', 'banyuleCross'],
  ['What must a retaining wall’s design cover?', 'Not confirmed here. The NCC 3.2 page read has no retaining wall rules and AS 4678 was not opened, so loads, footings and drainage come from the engineer.', 'C'],
  ['What are the rules for a wall of exactly 1 m?', 'Not confirmed. BP 01 exempts a wall less than 1 m high, the Boroondara and Macedon Ranges pages say 1 m or over needs a permit, and the Hume page says higher than 1 m.', 'C'],
  ['Where may a retaining wall drain discharge?', 'Not confirmed. It is a question for the council and the surveyor, because one council says groundwater cannot go into its drain.', 'C'],
];
export const sources = ['bp01Vba', 'bp01Dtp', 'vbaSd01', 'nccHp33', 'nccHp32', 'boroRetain', 'mrscRetain', 'humeFence', 'vicFencing', 'stonLpod', 'boroStorm', 'banyuleCross'];
export const caution = 'The thresholds here come from Victorian Building Authority Building Practice Note BP 01 version 4.0, which the VBA marked superseded on 1 November 2023, and the building.vic.gov.au copy, so they are Verified for that version only and need confirming against the current note and Schedule 3 of the Building Regulations 2018, which were not opened. The stormwater points come from VBA SD 01 version 2.0 (24 April 2023), NCC Housing Provisions 3.3 (the page states no edition) and two council pages. The NCC 3.2 page read has no retaining wall rules, and AS 4678, AS 1684 and AS 3600 were not opened, so design, footings and drainage for a wall, fence or slab are the engineer’s and are Typical or Confirm. The retaining wall set-back, overlay and engineer points come from council pages, and the Hume page words the 1 m limit differently from BP 01. The vehicle crossing figures come from one council’s specification last amended in 2015, and every council sets its own. Whether stormwater work needs a licensed plumber and a certificate was not checked, and the Fences Act points come from a one-page Victorian Government summary. The yard, wall, fence, crossing, shed and garage footprint in the model are illustrative, the pipes are drawn above ground so they can be seen, and the zoom rooms draw layers at about true thickness.';

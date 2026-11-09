// Step 11: insulation and energy efficiency. The Step 8 house (finished shell, roof cladding hidden) gets wall wrap checks, ducted exhaust fans, wall batts, sealing, ceiling batts and roof space ventilation.
// Rules marked Verified come from the VBA, BPC, Sustainability Victoria and ABCB pages named in Sources. The ABCB pages carry NSW-labelled text or 2019 cross-references and no stated edition, and R-value tables, AS/NZS 4859.1,
// AS 3999, AS/NZS 4200 and AS 2047 were not opened, so R-values are Confirm. Batt thickness and positions in the model are illustrative.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import step8 from './step-08.js';
import { grp } from './step-06.js';
import { WALLS, wallInfo, wallMembers, worldAt, F } from './frame.js';
import { LIGHTS } from './elec.js';
import { drawings, howto, trades, materials, quotes, quoteTips, inspections, exam, sources, caution } from './step-11-study.js';

const phases = [
  { title: 'Energy report and compliance route', text: 'The NatHERS assessor\'s report sets the insulation, glazing and sealing the house is built to. Insulation arrives on site and is kept dry.' },
  { title: 'Wall wrap and condensation checks', text: 'The vapour permeable wall wrap is checked and the exhaust fans are ducted to outdoor air, so moisture has a way out of the house.' },
  { title: 'Wall insulation', text: 'Batts go snugly between the studs of the external walls, with no gaps and no squashing. Reflective foil needs an air space.' },
  { title: 'Sealing', text: 'Gaps around windows, doors, fans and penetrations are sealed, doors get draught strips and exhaust fans get dampers.' },
  { title: 'Ceiling insulation and roof ventilation', text: 'Ceiling batts are laid over the ceiling lining, kept clear of downlights and fans. On site that is normally after the ceiling plasterboard of Step 12, but the model shows it here. The roof space needs vents at the eaves and at high level (climate zone 6).' },
  { title: 'Inspection', text: 'Walk every wall bay before the plasterboard goes up, and the ceiling once the batts are laid. Gaps, squashed batts and missing seals are fixed now.' },
  { title: 'Records and handover', text: 'The product labels, photographs and certificate are filed, so the house can be shown to match the energy report.' },
];

const MAT = (kit) => {
  const { mat, ghost } = kit;
  return {
    timber: mat(0xffffff, { tex: 'timber' }), steel: mat(0xb9c2cd, { metalness: 0.6, roughness: 0.35 }), batt: mat(0xf0a6b4, { roughness: 1 }), batt2: mat(0xf2d27a, { roughness: 1 }),
    foil: mat(0xdfe5ea, { metalness: 0.7, roughness: 0.25 }), foam: mat(0xf2c94c, { roughness: 0.9 }), dark: mat(0x1b1d20, { roughness: 0.7 }), white: mat(0xf4f4f2, { roughness: 0.5 }), card: mat(0xc8ad82, { roughness: 0.9 }),
    brick: mat(0xc9705a, { roughness: 0.95 }), red: mat(0xd62828, { roughness: 0.6 }), blue: mat(0x2b8fd6, { roughness: 0.5 }), green: mat(0x2fb36b, { roughness: 0.5 }), grey: mat(0x8f99a3, { roughness: 0.6 }),
    wrap: ghost(0x5aa9e6, 0.28), lining: ghost(0xeeeeee, 0.24), redGhost: ghost(0xd62828, 0.5), air: ghost(0x7fd0ff, 0.5), cavity: ghost(0xbfd7ea, 0.25), cover: ghost(0xb9c2cd, 0.55),
  };
};

/* ---------- walk scene ---------- */
function build(kit) {
  const { box, cyl, rod, textPlane } = kit;
  const mk = (n) => { const g = new THREE.Group(); g.name = n; return g; };
  const s8 = step8.build(kit);
  const DROP = ['stock', 'legend', 'conn', 'trench', 'dtest', 'backfill', 'waste', 'fixtures', 'cold', 'hot', 'plv', 'ptest', 'check'];
  const layers = s8.layers.filter((l) => !DROP.includes(l.group.name)).map(({ group }) => ({ group }));
  const m = MAT(kit), { T, H, HEAD } = F, TOP = H - 2 * T, CEIL = H + F.SLAB;
  const R = (g, a, b, r, mt) => { g.add(rod(a, b, r, mt, 6)); };
  const sign = (lines, w, h, x, y, z, ry = 0) => { const s = textPlane(lines, w, h); s.position.set(x, y, z); s.rotation.y = ry; return s; };
  const ext = WALLS.filter((w) => w.ext).map(wallInfo);

  // bays of a wall between its openings, over and under each window, in the wall's own units
  const bays = (w, y1, y2) => {
    const zs = wallMembers(w.len, w.open).zones.slice().sort((p, q) => p.l - q.l), out = []; let at = 0;
    for (const z of zs) { if (z.l > at + 0.01) out.push([at, z.l, y1, y2]); if (z.o.sill > y1 + 0.01) out.push([z.l, z.r, y1, z.o.sill]); if (y2 > HEAD + 0.01) out.push([z.l, z.r, HEAD, y2]); at = z.r; }
    if (w.len > at + 0.01) out.push([at, w.len, y1, y2]);
    return out;
  };
  const piece = (g, w, u1, u2, y1, y2, depth, zc, mt) => { const p = worldAt(w, (u1 + u2) / 2, (y1 + y2) / 2, zc), b = box(u2 - u1, y2 - y1, depth, mt, p[0], p[1], p[2]); b.rotation.y = w.theta; g.add(b); return b; };

  // delivery: packs of batts on a pallet, rolls of foil and a keep-dry sign, in the east margin
  const stock = mk('stock'), sx = 6.5, sz = 4.0;
  stock.add(box(1.3, 0.12, 1.1, m.timber, sx, 0.06, sz));
  for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) stock.add(box(0.55, 0.42, 1.15, m.batt, sx - 0.3 + i * 0.6, 0.33, sz - 0.25 + j * 0.5), box(0.55, 0.42, 1.15, m.batt2, sx - 0.3 + i * 0.6, 0.75, sz - 0.25 + j * 0.5));
  for (const dz of [-1.0, -1.4]) { const roll = cyl(0.18, 1.2, m.foil, sx, 0.2, sz + dz, 20); roll.rotation.z = Math.PI / 2; stock.add(roll); }
  stock.add(sign(['INSULATION STOCK', 'Keep dry. Check R-value labels'], 1.5, 0.5, sx, 1.4, sz + 1.5, 0), cyl(0.025, 1.4, m.steel, sx - 0.78, 0.7, sz + 1.5, 8), cyl(0.025, 1.4, m.steel, sx + 0.78, 0.7, sz + 1.5, 8));

  // energy report sign near the front door, then the records sign in its place
  const route = mk('route'), recs = mk('recs');
  route.add(sign(['ENERGY REPORT', 'NatHERS 7 stars', 'Whole-of-home 60 or more'], 1.5, 0.65, 1.5, 1.45, 12.4, 0), cyl(0.025, 1.45, m.steel, 0.7, 0.72, 12.4, 8), cyl(0.025, 1.45, m.steel, 2.3, 0.72, 12.4, 8));
  recs.add(sign(['ENERGY RECORDS', 'Labels, photos, certificate', 'Filed with the permit documents'], 1.5, 0.65, 1.5, 1.45, 12.4, 0), cyl(0.025, 1.45, m.steel, 0.7, 0.72, 12.4, 8), cyl(0.025, 1.45, m.steel, 2.3, 0.72, 12.4, 8));

  // wall wrap on the outer face of every external wall, drawn as a faint blue film
  const wrap = mk('wrap');
  for (const w of ext) for (const [u1, u2, y1, y2] of bays(w, 0, H)) piece(wrap, w, u1, u2, y1, y2, 0.003, -0.056, m.wrap);

  // exhaust fans in the ceiling, with ducts out through the eaves to a cap
  const fans = mk('fans'), FANS = [[-3.6, 3.35, -5.9, 'Bathroom 25 L/s'], [4.4, 9.4, 5.9, 'Kitchen 40 L/s'], [-4.2, 9.4, -5.9, 'Laundry 40 L/s']];
  for (const [x, z, ex, label] of FANS) {
    fans.add(box(0.3, 0.08, 0.3, m.white, x, CEIL - 0.04, z), cyl(0.1, 0.12, m.grey, x, CEIL + 0.02, z, 14));
    R(fans, [x, CEIL + 0.06, z], [x, CEIL + 0.28, z], 0.05, m.foil); R(fans, [x, CEIL + 0.28, z], [ex, CEIL + 0.28, z], 0.05, m.foil);
    const cap = cyl(0.09, 0.1, m.white, ex + Math.sign(ex) * 0.05, CEIL + 0.28, z, 16); cap.rotation.z = Math.PI / 2; fans.add(cap, sign([label], 0.8, 0.18, x, CEIL + 0.5, z, 0));
  }

  // wall batts between the studs of the external walls, with one gap in the east wall to find at inspection
  const wallb = mk('wallb'), fixw = mk('fixw'), defects = mk('defects');
  const east = ext.find((w) => w.id === 'east'), u0 = (5.25 - east.a[0]) * east.dir[0] + (6.5 - east.a[1]) * east.dir[1], GAP = 0.2;
  for (const w of ext) for (const [u1, u2, y1, y2] of bays(w, T, TOP)) {
    const full = y1 === T && y2 === TOP;
    if (w === east && full && u0 > u1 && u0 < u2) { piece(wallb, w, u1, u0 - GAP, y1, y2, 0.07, -0.01, m.batt); piece(wallb, w, u0 + GAP, u2, y1, y2, 0.07, -0.01, m.batt); piece(fixw, w, u0 - GAP, u0 + GAP, y1, y2, 0.07, -0.01, m.batt); piece(defects, w, u0 - GAP, u0 + GAP, y1, y2, 0.075, -0.01, m.redGhost); }
    else piece(wallb, w, u1, u2, y1, y2, 0.07, -0.01, m.batt);
  }

  // sealing: foam around window frames, a draught strip and jamb strips at the door, dampers on the fans
  const seal = mk('seal');
  for (const w of ext) for (const z of wallMembers(w.len, w.open).zones) {
    const top = HEAD, bot = z.o.sill, a = z.l + 0.015, b = z.r - 0.015;
    if (bot > 0) R(seal, worldAt(w, a, bot, 0.05), worldAt(w, b, bot, 0.05), 0.012, m.foam);
    R(seal, worldAt(w, a, bot, 0.05), worldAt(w, a, top, 0.05), 0.012, m.foam); R(seal, worldAt(w, b, bot, 0.05), worldAt(w, b, top, 0.05), 0.012, m.foam); R(seal, worldAt(w, a, top, 0.05), worldAt(w, b, top, 0.05), 0.012, m.foam);
    if (bot === 0) { piece(seal, w, z.l + 0.04, z.r - 0.04, 0.01, 0.045, 0.06, 0.03, m.dark); piece(seal, w, z.l + 0.025, z.l + 0.05, 0.05, top - 0.02, 0.02, 0.035, m.dark); piece(seal, w, z.r - 0.05, z.r - 0.025, 0.05, top - 0.02, 0.02, 0.035, m.dark); }
  }
  for (const [x, z] of FANS) seal.add(cyl(0.11, 0.025, m.dark, x, CEIL - 0.095, z, 14));

  // ceiling: a faint lining, batts laid over it in a grid, downlight covers and eave vents
  const ceilL = mk('ceilL'), ceilb = mk('ceilb'), fixc = mk('fixc'), covers = mk('covers'), vents = mk('vents'), gapC = [-1.2, 1.6];
  ceilL.add(box(10.6, 0.012, 16.6, m.lining, 0, CEIL + 0.006, 3.0));
  const geos = [], fixGeo = [], TX = 1.18, TZ = 0.592, X0 = -5.3, Z0 = -5.3, TH = 0.17;
  for (let i = 0; i < 9; i++) for (let j = 0; j < 28; j++) {
    const cx = X0 + (i + 0.5) * TX, cz = Z0 + (j + 0.5) * TZ;
    if (LIGHTS.some(([lx, lz]) => Math.abs(cx - lx) < TX / 2 + 0.2 && Math.abs(cz - lz) < TZ / 2 + 0.2) || FANS.some(([fx, fz]) => Math.abs(cx - fx) < TX / 2 + 0.2 && Math.abs(cz - fz) < TZ / 2 + 0.2)) continue;
    const g = new THREE.BoxGeometry(TX - 0.012, TH, TZ - 0.012); g.translate(cx, CEIL + 0.012 + TH / 2, cz);
    if (Math.abs(cx - gapC[0]) < TX / 2 && Math.abs(cz - gapC[1]) < TZ / 2) fixGeo.push(g); else geos.push(g);
  }
  const bm = new THREE.Mesh(mergeGeometries(geos, false), m.batt2); bm.castShadow = false; ceilb.add(bm);
  const fm = new THREE.Mesh(mergeGeometries(fixGeo, false), m.batt2); fixc.add(fm);
  defects.add(box(TX - 0.012, TH + 0.01, TZ - 0.012, m.redGhost, gapC[0] + 0.0, CEIL + 0.012 + TH / 2, gapC[1] + 0.0));
  for (const [x, z] of LIGHTS) covers.add(cyl(0.12, 0.2, m.cover, x, CEIL + 0.11, z, 16), cyl(0.05, 0.05, m.white, x, CEIL - 0.02, z, 14));
  for (const [x, z] of FANS) covers.add(cyl(0.16, 0.2, m.cover, x, CEIL + 0.11, z, 16));
  for (const zz of [-5.75, 11.75]) {
    vents.add(box(9.0, 0.03, 0.2, m.dark, 0, CEIL - 0.02, zz));
    for (let x = -4; x <= 4; x += 2) { const dir = zz > 0 ? -1 : 1; R(vents, [x, CEIL - 0.45, zz - dir * 0.7], [x, CEIL + 0.02, zz + dir * 0.05], 0.02, m.air); vents.add(cyl(0.001, 0.14, m.air, x, CEIL + 0.07, zz + dir * 0.12, 10, false, 0.07)); }
  }

  // defect flags at inspection
  defects.add(sign(['GAP: fix before lining'], 1.0, 0.2, 5.0, 0.75, 6.5, -Math.PI / 2), sign(['GAP in ceiling batts'], 1.0, 0.2, gapC[0], CEIL + 0.6, gapC[1], 0));

  layers.push({ group: stock, until: 3 }, { group: route, until: 6 }, { group: recs, from: 6 }, { group: wrap, from: 1 }, { group: fans, from: 1 }, { group: wallb, from: 2 }, { group: fixw, from: 6 }, { group: seal, from: 3 },
    { group: ceilL, from: 4 }, { group: ceilb, from: 4 }, { group: fixc, from: 6 }, { group: covers, from: 4 }, { group: vents, from: 4 }, { group: defects, from: 5, until: 6 });
  return { layers, colliders: s8.colliders, tickers: s8.tickers, spawn: { pos: [4, 18.5], yaw: 0, pitch: 0.2 }, map: s8.map, orbit: { pos: [9.5, 9, 17], target: [0, 1.0, 5] }, hotspots: HOTSPOTS };
}

/* ---------- hotspots ---------- */
const HOTSPOTS = [
  { id: 'route', title: 'The energy rating and the compliance route', pos: [1.5, 2.05, 12.4], stand: [1.5, 15.4], from: 0, until: 6, drawing: 'route',
    summary: 'A new Victorian house is designed to an energy rating, and the builder builds to it. The report sets the insulation, the windows and the sealing, so the report is part of the contract with the building surveyor.',
    learn: [['From 1 May 2024 a new home must meet NatHERS 7 stars and a whole-of-home rating of not less than 60.', 'V', 'vbaEeReq'], ['The whole-of-home budget covers heating, cooling, hot water, lighting and pool or spa pumps, scored 0 to 150. A house needs 60 or more. It is assessed with a NatHERS whole-of-home tool such as FirstRate5.', 'V', 'svSeven'], ['7 stars typically needs 20 to 25 per cent less heating and cooling energy than 6 stars.', 'V', 'svSeven'], ['Class 1 buildings must meet performance requirements H6P1 (thermal performance) and H6P2 (energy usage), which can be met by a Deemed-to-Satisfy solution.', 'V', 'vbaEeFaq'], ['A NatHERS accredited assessor models the house with accredited software and issues a certificate. A stamp and QR code can tie the certificate to the plans so a surveyor can check the built house against it.', 'V', 'nathersBuild'], ['Rooftop solar is not required, and double glazing is not mandatory for 7 stars.', 'V', 'energyVicStd'], ['From 1 January 2024, new homes and residential subdivisions that need a planning permit connect only to all-electric networks. It is applied through the planning permit process. The page lists no exemptions, so check with your council whether yours needs a permit.', 'V', 'vicAllElectric'], ['None of these pages names the NCC edition. Confirm which edition your permit was assessed under before using any figure.', 'C', 'vbaEeReq']] },
  { id: 'stock', title: 'Insulation delivered and kept dry', pos: [6.5, 0.7, 4.0], stand: [6.5, 7.4], from: 0, until: 3,
    summary: 'Batts and foil are ordered to the R-values on the energy report. They arrive in packs, are kept dry and are checked against the labels before they go in.',
    learn: [['Order to the R-values and products in the stamped energy report. Do not swap a product without asking the assessor.', 'T'], ['Check each pack label for the R-value, the product name and the standard it claims. The BPC note on new houses (NCC 2019) cites AS/NZS 4859.1 for insulation materials.', 'C', 'bpcEE03'], ['Wet batts lose performance and can grow mould. Keep the packs off the ground and covered.', 'T'], ['Keep a label or photo of each product for the records.', 'T']] },
  { id: 'wrap', title: 'Wall wrap and vapour permeance', pos: [-5.25, 1.3, 6.8], stand: [-2.8, 6.8], from: 1, detail: 'wall', drawing: 'wall',
    summary: 'The pliable membrane (wall wrap) behind the brick or cladding keeps rain out and lets moisture out. It sits on the outside of the insulation, and it must be vapour permeable enough for your climate zone.',
    learn: [['Wall sarking must comply with AS/NZS 4200.1 and be installed to AS/NZS 4200.2. It goes on the exterior side of the primary insulation layer.', 'V', 'bpcGE15'], ['In climate zones 4 and 5 the vapour permeance must be no less than Class 3 (0.143 μg/N.s). In zones 6, 7 and 8 it must be no less than Class 4 (1.14 μg/N.s). Melbourne is in climate zone 6, so check your site on the ABCB map.', 'V', 'bpcGE15'], ['Without a membrane, a drained cavity must separate the primary water control layer from water-sensitive materials. This does not apply to single-skin concrete and masonry walls.', 'V', 'bpcGE15'], ['The NCC Part 10.8 page shows the same roof space openings table and the clause numbers 10.8.1 to 10.8.3, but no climate zones. It also carries 2019 cross-references and no stated edition, so use the BPC note for the zones.', 'C', 'nccHp108'], ['Lap the wrap at joints and tape or seal it around openings. The maker\'s instructions govern.', 'T']] },
  { id: 'exhaust', title: 'Exhaust fans ducted outside', pos: [-3.6, 2.8, 3.35], stand: [-3.0, 4.8], from: 1, drawing: 'exhaust',
    summary: 'Moisture from the bathroom, kitchen and laundry has to leave the house. Fans are sized to the NCC flow rates and ducted to outdoor air, not into the roof space.',
    learn: [['Required flow rates: bathrooms and sanitary compartments 25 L/s, kitchens (including rangehoods) and laundries 40 L/s.', 'V', 'bpcGE15'], ['Exhaust must discharge by a shaft or duct to outdoor air.', 'V', 'bpcGE15'], ['A venting clothes dryer must discharge to outdoor air. Condensing dryers are excluded.', 'V', 'bpcGE15'], ['Make-up air comes through openings of 14,000 mm², or the room complies with AS 1668.2:2012, which was not opened.', 'V', 'bpcGE15'], ['For scale, 14,000 mm² is about a 20 mm gap under a 700 mm wide door. That is arithmetic, not a rule on the pages read.', 'T'], ['A bathroom exhaust that does not run continuously must be interlocked with the light switch and have a 10 minute run-on timer.', 'V', 'bpcGE15'], ['Building surveyors check that the drawings show any venting clothes dryer and its discharge route.', 'V', 'bpcGE15'], ['Fan wiring and the roof cap are shared between the electrician and the roofer. Settle who fits the cap before the roof is on.', 'T']] },
  { id: 'walls', title: 'Wall batts between the studs', pos: [5.25, 1.3, 4.5], stand: [2.9, 4.5], from: 2, detail: 'wall', drawing: 'wall',
    summary: 'Wall batts fill the bays between studs. They must touch the next piece, fill the depth of the bay and not be squashed, because a squashed batt loses R-value.',
    learn: [['Insulation must abut or overlap adjoining insulation and form a continuous barrier with the ceiling, walls, bulkheads and floors. It must not affect the safe or effective operation of services.', 'V', 'nccHp132'], ['R-value is reduced if insulation is compressed, so the space must allow the full thickness or the R-value must be reduced.', 'V', 'nccHp132'], ['Reflective insulation needs the airspace its tested R-value assumes, close fitting around penetrations and openings, adequate support, and roll overlaps of at least 150 mm or taping.', 'V', 'nccHp132'], ['Minimum wall R-values depend on the climate zone and the wall type, in tables that were not read. Take the figure from the energy report.', 'C', 'nccHp132'], ['Cut batts to fit, cut around cables and boxes without squashing them, and keep batts off hot flues and certain light fittings.', 'T']] },
  { id: 'seal', title: 'Sealing gaps, doors and fans', pos: [1.5, 0.2, 11.24], stand: [1.5, 8.8], from: 3, detail: 'seal', drawing: 'wall',
    summary: 'A well-insulated house still loses heat if air leaks through it. Windows, doors, fans and every penetration are sealed so the air stays where the designer intended.',
    learn: [['External windows and doors serving a conditioned space (or a habitable room in climate zones 4 to 8) must be sealed. The bottom edge of a door needs a draught protection device. Windows meeting the AS 2047 air infiltration limits are exempt from the edge-seal requirement.', 'V', 'nccHp134'], ['Exhaust fans serving a conditioned space or a habitable room in climate zones 4 to 8 need a sealing device such as a self-closing damper or filter. Roof lights also need sealing.', 'V', 'nccHp134'], ['Ceilings, walls and floors forming the external fabric must be built to minimise air leakage, by close-fitting linings at junctions or by sealing junctions and penetrations with close-fitting trim, expanding foam, rubber strip or caulking.', 'V', 'nccHp134'], ['The 13.4 page states no air permeability figure. Sustainability Victoria says the NCC effectively requires new homes to be under 10 air changes per hour at 50 Pa, and that post-build airtightness testing is not mandatory.', 'V', 'svSeven'], ['The ABCB page carries NSW-labelled variant text and no stated edition.', 'C', 'nccHp134'], ['Foam gaps around frames only after the glazier has checked the frame is square and fixed.', 'T']] },
  { id: 'ceiling', title: 'Ceiling insulation', pos: [0.0, 2.9, 8.4], stand: [0.0, 4.2], from: 4, detail: 'ceiling',
    summary: 'Most of a house\'s heat leaves through the ceiling, so ceiling insulation is the thickest layer. It is laid over the lining, kept clear of downlights and fans, and must overlap the top of the external walls.',
    learn: [['In a ceiling with no insulation in the wall beneath, bulk insulation must overlap the external wall by at least 50 mm.', 'V', 'nccHp132'], ['Roof and ceiling R-values come from NCC tables by climate zone and roof type, which were not read. Take the figure from the energy report.', 'C', 'nccHp132'], ['Ceiling insulation may drop to R3.0 within 450 mm of an external wall, subject to conditions that were not read.', 'C', 'nccHp132'], ['Where metal roof sheeting is fixed directly to metal framing, a thermal break with an R-value of at least 0.2 is required.', 'V', 'nccHp132'], ['Reflective insulation in a roof must have a surface emittance of no more than 0.05 and an airspace of at least 20 mm, and face downward in climate zones 3 to 8.', 'V', 'nccHp132'], ['Clearances around downlights, flues and fans come from AS/NZS 3000 and the product instructions. Neither was opened. Use covers or fittings rated for insulation contact.', 'C']] },
  { id: 'vent', title: 'Roof space ventilation', pos: [0.0, 2.9, 11.75], stand: [0.0, 15.4], from: 4, drawing: 'roof',
    summary: 'In climate zone 6 the roof space needs openings at the eaves and at high level so moist air can leave. The size of the openings depends on the roof pitch.',
    learn: [['Roof space ventilation rules apply in climate zones 6, 7 and 8 only. The roof space must be at least 20 mm high.', 'V', 'bpcGE15'], ['Under 10 degrees: 25,000 mm² per metre at each of two opposing ends. From 10 to under 15 degrees: 25,000 mm² per metre at the eaves and 5,000 mm² per metre at high level.', 'V', 'bpcGE15'], ['From 15 to under 75 degrees: 7,000 mm² per metre at the eaves and 5,000 mm² per metre at high level, plus an extra 18,000 mm² per metre at the eaves for a cathedral ceiling.', 'V', 'bpcGE15'], ['Exemptions include concrete roofs, structural insulated roof panels, roofs required to meet BAL FZ, roof spaces directly under roof tiles with no sarking, and Class 10a roof spaces serving no other class.', 'V', 'bpcGE15'], ['The same openings table is on the NCC Part 10.8 page.', 'V', 'nccHp108'], ['Where the openings go on a particular roof is the roofer\'s and designer\'s call. Do not block eave vents with insulation, and use baffles where batts reach the eave.', 'T']] },
  { id: 'check', title: 'Inspect before the linings', pos: [5.25, 1.3, 6.5], stand: [2.9, 6.6], from: 5, until: 6, drawing: 'wall',
    summary: 'Insulation is hidden once the linings go on, so this is the last chance to see it. A gap or a squashed batt costs more to fix after plasterboard than before.',
    learn: [['Insulation is not named as a mandatory stage. The surveyor lists the prescribed stages on the permit, and the surveyor can require an additional inspection under section 35, with features required to meet energy efficiency requirements given as an example.', 'V', 'bpcMI01'], ['Look at every bay and the whole ceiling: gaps, squashed batts, missing seals, batts that do not reach the top or bottom plate, and covers over every downlight.', 'T'], ['Sustainability Victoria has offered builders of new 7-star homes a free as-built verification with thermal imaging and airtightness testing. The page is undated, so check whether the offer still runs.', 'C', 'svAbv'], ['Photograph each wall and the ceiling before the plasterer starts.', 'T']] },
  { id: 'cert', title: 'Records and the as-built check', pos: [1.5, 2.05, 12.4], stand: [1.5, 15.4], from: 6, drawing: 'route',
    summary: 'The certificate, the product labels and the photographs show that the house matches the energy report. File them with the permit documents.',
    learn: [['The stamp and QR code on the NatHERS certificate let a surveyor tie the certificate to the plans, so features such as glazing and insulation can be checked against the built house.', 'V', 'nathersBuild'], ['Keep the product labels or data sheets, the installer\'s invoice, the photographs and the inspection record with the permit documents.', 'T'], ['Check the installed windows match the window schedule in the energy report. A different frame or glass can change the rating.', 'T'], ['Whether the surveyor wants insulation evidence before the occupancy permit was not checked. Ask.', 'C']] },
];

/* ---------- zoom rooms ---------- */
const details = {
  wall: {
    title: 'Wall layers, outside to inside', sub: 'Brick, drained cavity, wall wrap, studs, batts and the lining. Thicknesses are typical, and the batt R-value comes from the energy report',
    floor: -0.25, gridSize: 3, camera: { pos: [1.9, 0.75, 0.95], target: [0, 0.42, 0.0] },
    build(kit) {
      const { box, rod, cyl } = kit, m = MAT(kit);
      const brick = grp(box(0.6, 0.9, 0.11, m.brick, 0, 0.45, -0.19));
      const cavity = grp(box(0.6, 0.9, 0.04, m.cavity, 0, 0.45, -0.115));
      const wrap = grp(box(0.6, 0.9, 0.004, m.wrap, 0, 0.45, -0.085));
      const studs = grp(box(0.045, 0.9, 0.09, m.timber, -0.28, 0.45, 0), box(0.045, 0.9, 0.09, m.timber, 0.0, 0.45, 0), box(0.045, 0.9, 0.09, m.timber, 0.28, 0.45, 0), box(0.6, 0.045, 0.09, m.timber, 0, 0.0225, 0));
      const batts = grp(box(0.232, 0.84, 0.07, m.batt, -0.14, 0.45, -0.01), box(0.232, 0.84, 0.07, m.batt, 0.14, 0.45, -0.01));
      const lining = grp(box(0.6, 0.9, 0.013, m.lining, 0, 0.45, 0.06));
      const arrow = grp(rod([0.2, 0.8, 0.28], [0.2, 0.8, -0.2], 0.008, m.air, 6), cyl(0.001, 0.07, m.air, 0.2, 0.8, -0.23, 10, false, 0.03));
      return { parts: [
        { id: 'brick', name: 'Brick veneer', group: brick, explode: [0, 0, -0.4], anchor: [0.0, 0.8, -0.19], flag: 'T', spec: 'Brick veneer is the outer skin from Step 6. It is not part of the thermal insulation.', desc: 'The brick keeps rain off the wall. It does not insulate it.' },
        { id: 'cavity', name: 'Drained cavity', group: cavity, explode: [0, 0, -0.24], anchor: [0.24, 0.6, -0.115], flag: 'V', src: 'bpcGE15', spec: 'Without a pliable membrane a drained cavity must separate the primary water control layer from water-sensitive materials. It does not apply to single-skin concrete and masonry walls.', desc: 'A gap behind the brick lets water that gets in run down and out through the weep holes.' },
        { id: 'wrap', name: 'Wall wrap', group: wrap, explode: [0, 0, -0.1], anchor: [-0.24, 0.7, -0.085], flag: 'V', src: 'bpcGE15', spec: 'AS/NZS 4200.1 and 4200.2. On the outside of the insulation. Class 3 (0.143 μg/N.s) in climate zones 4 and 5, Class 4 (1.14 μg/N.s) in zones 6 to 8.', desc: 'It keeps wind and rain out but lets water vapour out of the wall.' },
        { id: 'studs', name: 'Studs and plate', group: studs, explode: [0, 0, 0], anchor: [0.0, 0.88, 0.045], flag: 'T', spec: '90 by 45 timber at 450 mm centres in the model (shown closer). The insulation fits between them.', desc: 'The frame sets the depth of the insulation. Studs conduct heat more easily than batts do.' },
        { id: 'batts', name: 'Wall batts', group: batts, explode: [0, 0, 0.2], anchor: [-0.14, 0.2, 0.04], flag: 'V', src: 'nccHp132', spec: 'Insulation must abut or overlap adjoining insulation to form a continuous barrier. R-value is reduced if it is compressed. R-value comes from the energy report.', desc: 'The batts fill the bay. A gap or a squashed batt is a path for heat.' },
        { id: 'lining', name: 'Lining (Step 12)', group: lining, explode: [0, 0, 0.45], anchor: [0.24, 0.2, 0.06], flag: 'T', spec: 'Plasterboard goes on in Step 12. Once it is up, the insulation can no longer be inspected.', desc: 'This is the point of no return for checking the insulation.' },
        { id: 'vapour', name: 'Moisture path', group: arrow, explode: [0, 0.3, 0], anchor: [0.2, 0.8, 0.0], flag: 'T', spec: 'Warm indoor air carries moisture outward. A vapour permeable wrap lets it escape instead of condensing inside the wall.', desc: 'The arrow shows moisture leaving the house through the wall.' },
      ] };
    },
  },

  ceiling: {
    title: 'Ceiling insulation', sub: 'Lining, truss bottom chords, batts, a downlight with its cover and a gap that costs heat. Thickness is illustrative',
    floor: -0.35, gridSize: 3, camera: { pos: [2.3, 1.0, 1.5], target: [0, 0.2, 0] },
    build(kit) {
      const { box, rod, cyl } = kit, m = MAT(kit);
      const lining = grp(box(1.3, 0.013, 1.3, m.lining, 0, 0, 0));
      const chords = grp(box(0.045, 0.09, 1.3, m.timber, -0.0, 0.058, 0), box(0.045, 0.09, 1.3, m.timber, 0.6, 0.058, 0), box(0.045, 0.09, 1.3, m.timber, -0.6, 0.058, 0));
      const batts = grp(box(0.54, 0.17, 0.62, m.batt2, -0.3, 0.098, 0.3), box(0.54, 0.17, 0.62, m.batt2, 0.3, 0.098, 0.3), box(0.54, 0.17, 0.62, m.batt2, -0.3, 0.098, -0.36), box(0.54, 0.17, 0.62, m.batt2, 0.3, 0.098, -0.36));
      const light = grp(cyl(0.05, 0.05, m.white, 0.3, -0.02, -0.36, 14), cyl(0.12, 0.2, m.cover, 0.3, 0.11, -0.36, 16));
      const gap = grp(box(0.54, 0.17, 0.1, m.redGhost, -0.3, 0.098, -0.02));
      const vent = grp(box(1.3, 0.03, 0.16, m.dark, 0, 0.05, 0.72), rod([0.0, -0.3, 0.9], [0.0, 0.08, 0.72], 0.012, m.air, 6));
      return { parts: [
        { id: 'lining', name: 'Ceiling lining (Step 12)', group: lining, explode: [0, -0.35, 0], anchor: [0.55, 0, 0.55], flag: 'T', spec: 'Plasterboard fixed to the underside of the bottom chords. The model draws it faintly.', desc: 'The batts rest on this.' },
        { id: 'chords', name: 'Truss bottom chords', group: chords, explode: [0, 0.0, 0], anchor: [0.6, 0.12, -0.6], flag: 'T', spec: 'Bottom chords of the trusses, from Step 4. Batts lie between and over them.', desc: 'Timber conducts heat better than batts, so batts over the top of the chords help.' },
        { id: 'batts', name: 'Ceiling batts', group: batts, explode: [0, 0.4, 0], anchor: [-0.3, 0.19, 0.3], flag: 'C', spec: 'Thickness depends on the R-value and the product. The R-value comes from the energy report. The NCC roof and ceiling R-value tables were not read.', desc: 'The thickest layer in the house. Keep it fluffed up and unsquashed.' },
        { id: 'light', name: 'Downlight and cover', group: light, explode: [0, 0.7, 0], anchor: [0.3, 0.2, -0.36], flag: 'C', spec: 'Insulation clearances around downlights come from AS/NZS 3000 and the product instructions, neither opened. Use covers or fittings rated for insulation contact.', desc: 'The cover keeps batts clear of the fitting, so a batt is not squashed or cut around it.' },
        { id: 'gap', name: 'A gap', group: gap, explode: [0, 0.75, 0], anchor: [-0.3, 0.2, -0.02], flag: 'V', src: 'nccHp132', spec: 'Insulation must abut or overlap adjoining insulation to form a continuous barrier.', desc: 'A strip with no batt lets heat through. Thermal imaging can show it.' },
        { id: 'vent', name: 'Eave vent', group: vent, explode: [0, 0.2, 0.5], anchor: [0, 0.1, 0.72], flag: 'V', src: 'bpcGE15', spec: 'In climate zones 6 to 8 the roof space needs openings at the eaves and at high level, sized by roof pitch. Do not block them with batts.', desc: 'Air comes in at the eaves and leaves high up, taking moisture with it.' },
      ] };
    },
  },

  seal: {
    title: 'Sealing gaps and doors', sub: 'Stud, window frame, foam gap fill, trim, a door draught strip and a fan damper. Sizes are typical',
    floor: -0.25, gridSize: 3, camera: { pos: [0.5, 0.85, 2.7], target: [0.1, 0.4, 0] },
    build(kit) {
      const { box, rod, cyl } = kit, m = MAT(kit);
      const studs = grp(box(0.045, 0.9, 0.09, m.timber, -0.5, 0.45, 0), box(0.045, 0.9, 0.09, m.timber, -0.45, 0.45, 0.0));
      const frame = grp(box(0.07, 0.9, 0.09, m.steel, -0.32, 0.45, 0));
      const foam = grp(rod([-0.395, 0.0, 0.0], [-0.395, 0.9, 0.0], 0.014, m.foam, 8));
      const trim = grp(box(0.012, 0.9, 0.07, kit.ghost(0xc8ad82, 0.55), -0.26, 0.45, 0.07));
      const strip = grp(box(0.5, 0.03, 0.05, m.dark, 0.7, 0.03, 0.0), box(0.5, 0.012, 0.09, m.steel, 0.7, 0.006, 0.0));
      const damper = grp(cyl(0.11, 0.03, m.white, 0.7, 0.62, 0.0, 18), box(0.15, 0.01, 0.1, m.dark, 0.7, 0.64, 0.0), rod([0.7, 0.64, 0.0], [0.7, 0.9, 0.0], 0.04, m.foil, 8));
      return { parts: [
        { id: 'studs', name: 'Stud and trimmer', group: studs, explode: [-0.3, 0, 0], anchor: [-0.5, 0.85, 0.05], flag: 'T', spec: 'The frame around the opening. The gap between frame and stud is the leak.', desc: 'The frame is built a little oversize so the window can be set square.' },
        { id: 'frame', name: 'Window frame', group: frame, explode: [0.2, 0, 0.0], anchor: [-0.32, 0.8, 0.05], flag: 'T', spec: 'Frames that meet the AS 2047 air infiltration limits are exempt from the edge-seal requirement.', desc: 'The glazier sets the frame in the opening.' },
        { id: 'foam', name: 'Foam gap fill', group: foam, explode: [0.0, 0.0, 0.22], anchor: [-0.395, 0.55, 0.0], flag: 'V', src: 'nccHp134', spec: 'Junctions and penetrations are sealed with close-fitting trim, expanding foam, rubber strip or caulking.', desc: 'Foam fills the gap between frame and stud so no air leaks around the window. Use a foam the maker rates for windows (Typical).' },
        { id: 'trim', name: 'Trim', group: trim, explode: [0.45, 0, 0.1], anchor: [-0.26, 0.85, 0.07], flag: 'V', src: 'nccHp134', spec: 'Close-fitting internal linings and trim can also close the junction.', desc: 'The architrave covers the foam and closes the junction on the inside.' },
        { id: 'strip', name: 'Door draught strip', group: strip, explode: [0, 0.18, 0.1], anchor: [0.7, 0.05, 0.0], flag: 'V', src: 'nccHp134', spec: 'The bottom edge of an external door serving a conditioned space needs a draught protection device.', desc: 'A strip under the door stops air blowing in at the threshold.' },
        { id: 'damper', name: 'Fan damper', group: damper, explode: [0, 0.3, 0], anchor: [0.7, 0.7, 0.0], flag: 'V', src: 'nccHp134', spec: 'Exhaust fans need a sealing device such as a self-closing damper or filter when they serve a conditioned space or a habitable room in climate zones 4 to 8.', desc: 'The flap closes when the fan stops, so wind does not blow back in.' },
      ] };
    },
  },
};

export default {
  n: 11, id: 'insulation', title: 'Insulation and energy efficiency', subtitle: 'The energy report, wall wrap and condensation, exhaust ducting, wall and ceiling batts, sealing, roof space ventilation, inspection and records.',
  phases, build, details, drawings, howto, trades, materials, quotes, quoteTips, inspections, exam, sources, caution,
};

// Step 16: bushfire and fire safety. The finished Step 15 house gets a closed tile roof, a forest at the rear to assess, and the ember-proofing for a BAL: lined and screened eaves, gutter guards, window screens, door seals and a deck.
// Facts marked Verified come from the VBA, BPC, Planning Victoria and CFA pages, the HIA overview of AS 3959:2018, a council form and a council construction page, read on 9 November 2026.
// AS 3959 is paywalled and was not opened, so distances, mesh sizes, gap limits and the glass and door rules for each BAL are Typical or Confirm. The forest, tape, BAL level and all fittings in the model are illustrative.
import * as THREE from 'three';
import step05 from './step-05.js';
import step15 from './step-15.js';
import { tree } from './site.js';
import { grp } from './step-06.js';
import { F, WALLS } from './frame.js';
import { ALARMS, ALARMS_UP } from './elec.js';
import { HS, OVER, PLATE_TOP, yc } from './step-04.js';
import { drawings, howto, trades, materials, quotes, quoteTips, inspections, exam, sources, caution } from './step-16-study.js';

const SL = F.SLAB, XE = HS + OVER, TAN8 = Math.tan(Math.PI / 8);
const ZB = -5.5 + F.E, ZF = 11.5 - F.E, ZM = (ZB + ZF) / 2, RLEN = ZF - ZB + 0.7;      // roof length, with the 0.35 m verge at each end
const YT = PLATE_TOP + yc(XE), G_BOT = YT - 0.125;                                      // truss tail end and gutter bottom, as in Step 5

const phases = [
  { title: 'Site assessment', text: 'The vegetation within 100 m is classified, its distance and slope are measured and the Fire Danger Index is found. The BAL is the highest result from the AS 3959 table.' },
  { title: 'Overlays, permits and the BAL', text: 'The property is checked for the Bushfire Prone Area and the Bushfire Management Overlay. The BAL goes on the plans and the permit so every trade builds to the same level.' },
  { title: 'Roof and eaves sealed', text: 'The roof is closed, the eaves are lined, the vents are screened with metal mesh and the gap where the lining meets the wall is sealed.' },
  { title: 'Gutters, windows and doors', text: 'Metal gutter guards go on, openable windows get mesh screens and the doors are sealed round the edges.' },
  { title: 'Deck and attached structures', text: 'A deck against the house is built from material that suits the BAL, and the space under it is kept closed or screened.' },
  { title: 'Fire safety inside', text: 'The smoke alarms are tested and interconnected, and the distance from each wall to the boundary is checked for fire separation.' },
  { title: 'Checks and handover', text: 'The surveyor checks the bushfire work against the BAL on the permit, photographs are taken before anything is covered, and the owner gets the care duties.' },
];

const MAT = (kit) => {
  const { mat, ghost } = kit;
  return {
    timber: mat(0xffffff, { tex: 'timber' }), oak: mat(0xe9c9a0, { tex: 'timber' }), steel: mat(0xb9c2cd, { metalness: 0.6, roughness: 0.35 }), dark: mat(0x1b1d20, { roughness: 0.7 }), conc: mat(0xffffff, { tex: 'concrete' }), brick: mat(0xffffff, { tex: 'brick' }),
    white: mat(0xf4f4f2, { roughness: 0.5, emissive: 0x3a3a38 }), board: mat(0xe8e0cc, { roughness: 0.92, emissive: 0x5a5242 }), foil: mat(0xb4bcc6, { metalness: 0.2, roughness: 0.5 }), tile: mat(0x74808d, { tex: 'roofTile' }),
    meshM: mat(0x2e3238, { metalness: 0.5, roughness: 0.5 }), seal: mat(0x2b8fd6, { roughness: 0.5, emissive: 0x0f3a5a }), yellow: mat(0xf2c230, { roughness: 0.6 }), orange: mat(0xff7a1a, { roughness: 0.6 }), red: mat(0xd62828, { roughness: 0.6 }),
    forest: mat(0x3f6a33, { roughness: 1 }), screen: ghost(0x9aa6b2, 0.42), glass: ghost(0xbfe3f2, 0.3), okGhost: ghost(0x2fbf71, 0.4), redGhost: ghost(0xd62828, 0.45), deck: mat(0xc99a62, { tex: 'timber' }),
  };
};

/* ---------- walk scene ---------- */
function build(kit) {
  const { box, cyl, rod, flat, textPlane } = kit;
  const mk = (n) => { const g = new THREE.Group(); g.name = n; return g; };
  const s15 = step15.build(kit), s5 = step05.build(kit), m = MAT(kit);
  const g5 = (n) => s5.layers.find((l) => l.group.name === n).group;
  const KEEP = ['markWalls', 'markTrim', 'fit', 'glow', 'swOk'];
  const layers = s15.layers.filter((l) => (l.from === undefined && l.until === undefined) || KEEP.includes(l.group.name)).map(({ group }) => ({ group }));
  const sign = (lines, w, h, x, y, z, ry = 0) => { const s = textPlane(lines, w, h); s.position.set(x, y, z); s.rotation.y = ry; return s; };
  const post = (g, x, y, z, h) => { const c = cyl(0.03, h, m.steel, x, h / 2 + y, z, 8); g.add(c); return c; };

  // the roof is closed again for this stage: sarking, tiles and ridge from Step 5
  const roofSark = g5('sarking'), roofTiles = g5('tiles'), roofRidge = g5('ridge');
  roofTiles.children.forEach((c) => { c.visible = true; });

  // forest at the rear, with a tape from the rear wall to the nearest trees
  const bush = mk('bush'); {
    bush.add(flat(64, 20, m.forest, 0, 0.012, -42));
    for (let r = 0; r < 3; r++) for (let i = 0; i < 11; i++) { const x = -30 + i * 6 + ((i * 7 + r * 3) % 5) * 0.5 - 1, z = -38 - r * 4.5 - ((i * 3 + r) % 3) * 0.7; bush.add(tree(kit, x, z, 1.5 + ((i + r) % 3) * 0.25, i + r * 11 + 3)); }
    bush.add(sign(['CLASSIFIED VEGETATION', 'Group A, forest (illustrative)'], 5.2, 1.3, 3, 2.2, -34.5, 0), post(bush, 0.6, 0, -34.5, 2.2), post(bush, 5.4, 0, -34.5, 2.2));
  }
  const assess = mk('assess'); {
    assess.add(rod([3, 0.25, -5.62], [3, 0.25, -36.5], 0.035, m.yellow, 8), cyl(0.05, 0.9, m.yellow, 3, 0.45, -36.5, 8), cyl(0.05, 0.9, m.yellow, 3, 0.45, -5.62, 8));
    for (let z = -10; z > -36; z -= 5) assess.add(box(0.05, 0.4, 0.05, m.red, 3, 0.2, z));
    assess.add(sign(['BAL ASSESSMENT', 'FDI + vegetation + distance + slope', 'BAL from the AS 3959 table'], 2.4, 0.8, 3, 1.3, -14.5, 0), post(assess, 1.9, 0, -14.5, 1.3), post(assess, 4.1, 0, -14.5, 1.3));
  }
  // embers drifting from the forest towards the house
  const embers = mk('embers'), NE = 80, ep = new Float32Array(NE * 3), ev = [];
  for (let i = 0; i < NE; i++) { ep[i * 3] = -16 + ((i * 37) % 32); ep[i * 3 + 1] = 0.8 + ((i * 13) % 70) / 10; ep[i * 3 + 2] = -34 + ((i * 29) % 54); ev.push(4 + ((i * 11) % 30) / 10); }
  const egeo = new THREE.BufferGeometry(); egeo.setAttribute('position', new THREE.BufferAttribute(ep, 3));
  const pts = new THREE.Points(egeo, new THREE.PointsMaterial({ color: 0xff7a1a, size: 0.3, sizeAttenuation: true, transparent: true, opacity: 0.95 })); pts.frustumCulled = false; embers.add(pts);
  const ticker = (dt, t) => {
    if (!embers.visible) return;
    for (let i = 0; i < NE; i++) { ep[i * 3 + 2] += ev[i] * dt; ep[i * 3 + 1] += Math.sin(t * 2 + i) * dt * 0.6; ep[i * 3] += Math.cos(t + i * 1.7) * dt * 0.4; if (ep[i * 3 + 2] > 20) { ep[i * 3 + 2] = -34; ep[i * 3 + 1] = 0.8 + ((i * 13) % 70) / 10; } }
    egeo.attributes.position.needsUpdate = true;
  };

  // permit board and the surveyor's check board at the front
  const permitSign = mk('permitSign'); permitSign.add(sign(['PERMITS', 'Bushfire Prone Area? Overlay (BMO)?', 'BAL on the permit: BAL-19 (illustrative)'], 1.9, 0.62, 6, 1.25, 13.6, 0), post(permitSign, 5.1, 0, 13.6, 1.25), post(permitSign, 6.9, 0, 13.6, 1.25));
  const insp = mk('insp'); insp.add(sign(['BUSHFIRE CHECKS', 'BAL on the permit, mesh, guards, seals, deck', 'Photograph before anything is covered'], 1.9, 0.62, 3.5, 1.25, 13.6, 0), post(insp, 2.6, 0, 13.6, 1.25), post(insp, 4.4, 0, 13.6, 1.25));

  // eaves: raked lining under the truss tails, vents with mesh, and a sealant bead at the wall
  const eaves = mk('eaves'), guards = mk('guards');
  for (const sg of [-1, 1]) {
    const cx = sg * 5.65, cy = PLATE_TOP + yc(5.65) - 0.06, ln = 0.3 / Math.cos(Math.PI / 8);
    const lining = box(ln, 0.008, RLEN - 0.7, m.board, cx, cy, ZM); lining.rotation.z = -sg * Math.PI / 8; eaves.add(lining);
    for (let z = -4.4; z < 11; z += 2.4) { const v = box(0.1, 0.012, 0.5, m.meshM, cx, cy - 0.01, z); v.rotation.z = -sg * Math.PI / 8; eaves.add(v); }
    eaves.add(box(0.012, 0.012, RLEN - 0.7, m.seal, sg * 5.506, cy + 0.04, ZM));
    guards.add(box(0.115, 0.004, RLEN, m.meshM, sg * (XE + 0.02 + 0.0575), G_BOT + 0.07, ZM));
  }
  // gable ends: a lined infill closes the triangle under the verge at the front and the back
  const gable = mk('gable'), gm = kit.mat(0xe6dfcc, { roughness: 0.9, side: THREE.DoubleSide }), gy = PLATE_TOP, gA = PLATE_TOP + yc(0) - 0.12;
  for (const z of [11.45, -5.45]) gable.add(kit.face([[-5.45, gy, z], [5.45, gy, z], [0, gA, z]], gm));
  // window screens and door seals
  const screens = mk('screens');
  const wallPlace = { front: [0, 11.5 + 0.025], back: [0, -5.5 - 0.025], west: [-5.5 - 0.025, 0], east: [5.5 + 0.025, 0] };
  for (const w of WALLS.filter((q) => q.ext)) {
    const along = w.id === 'front' || w.id === 'back';
    for (const o of w.open) {
      const y0 = SL + (o.sill || 0.02) + 0.02, y1 = SL + F.HEAD - 0.03, h = y1 - y0, ww = o.w - 0.06, yc0 = (y0 + y1) / 2;
      const px = along ? o.at : wallPlace[w.id][0], pz = along ? wallPlace[w.id][1] : o.at;
      if (o.sill === 0 && w.id === 'front') { // front door: weather strips round the leaf
        const d = [[0.02, 2.1, 0.02, o.at - o.w / 2, SL + 1.05], [0.02, 2.1, 0.02, o.at + o.w / 2, SL + 1.05], [o.w, 0.02, 0.02, o.at, SL + 2.1], [o.w, 0.02, 0.025, o.at, SL + 0.02]];
        for (const [a, b, c, x, y] of d) screens.add(box(a, b, c, m.dark, x, y, 11.5 + 0.012));
        continue;
      }
      screens.add(along ? box(ww, h, 0.004, m.screen, px, yc0, pz) : box(0.004, h, ww, m.screen, px, yc0, pz));
      const fr = (a, b, c, dx, dy, dz) => screens.add(box(a, b, c, m.steel, px + dx, yc0 + dy, pz + dz));
      if (along) { fr(ww, 0.02, 0.02, 0, h / 2, 0); fr(ww, 0.02, 0.02, 0, -h / 2, 0); fr(0.02, h, 0.02, -ww / 2, 0, 0); fr(0.02, h, 0.02, ww / 2, 0, 0); }
      else { fr(0.02, 0.02, ww, 0, h / 2, 0); fr(0.02, 0.02, ww, 0, -h / 2, 0); fr(0.02, h, 0.02, 0, 0, -ww / 2); fr(0.02, h, 0.02, 0, 0, ww / 2); }
    }
  }
  // deck against the back wall, by the sliding door
  const deck = mk('deck'); {
    const dx0 = -3.6, dx1 = -0.4, dz0 = -5.5, dz1 = -8.5, cxm = (dx0 + dx1) / 2, czm = (dz0 + dz1) / 2, y = SL;
    for (let x = dx0 + 0.07; x < dx1; x += 0.15) deck.add(box(0.14, 0.03, 3.0, m.deck, x, y - 0.015, czm));
    for (const z of [-5.7, -7.0, -8.35]) deck.add(box(3.2, 0.12, 0.05, m.timber, cxm, y - 0.09, z));
    for (const x of [dx0 + 0.1, cxm, dx1 - 0.1]) deck.add(box(0.1, 0.12, 0.1, m.steel, x, 0.06, dz1 + 0.15));
  }
  // fire safety: boundary distances on the ground and halos on the smoke alarms
  const sepm = mk('sepm');
  for (const sg of [-1, 1]) { sepm.add(box(2.0, 0.02, 0.06, m.orange, sg * 6.5, 0.04, -2.7), cyl(0.04, 1.0, m.orange, sg * 7.5, 0.5, -2.7, 8), sign(['2.0 m to the boundary'], 1.1, 0.3, sg * 6.5, 1.0, -2.7, sg > 0 ? Math.PI / 2 : -Math.PI / 2)); }
  const halo = mk('halo'); for (const [x, z] of ALARMS) { const h = new THREE.Mesh(new THREE.SphereGeometry(0.3, 16, 12), m.okGhost); h.position.set(x, F.H + SL - 0.13, z); halo.add(h); }
  for (const [x, z] of ALARMS_UP) { const h = new THREE.Mesh(new THREE.SphereGeometry(0.3, 16, 12), m.okGhost); h.position.set(x, PLATE_TOP - 0.13, z); halo.add(h); }

  layers.push({ group: roofSark }, { group: roofTiles }, { group: roofRidge }, { group: bush }, { group: assess, until: 2 }, { group: embers, until: 3 }, { group: permitSign, from: 1 }, { group: eaves, from: 2 }, { group: gable, from: 2 }, { group: guards, from: 3 }, { group: screens, from: 3 }, { group: deck, from: 4 }, { group: sepm, from: 5 }, { group: halo, from: 5 }, { group: insp, from: 6 });
  return { layers, colliders: s15.colliders, tickers: [...s15.tickers, ticker], spawn: { pos: [4, 18.5], yaw: 0, pitch: 0.2 }, map: s15.map, orbit: { pos: [16, 13, 22], target: [0, 1.2, -4] }, hotspots: HOTSPOTS };
}

/* ---------- hotspots ---------- */
const HOTSPOTS = [
  { id: 'veg', title: 'Site assessment: vegetation, distance and slope', pos: [3, 1.8, -14.5], stand: [3, -10.2], from: 0, until: 2, drawing: 'bal',
    summary: 'The assessor classifies the vegetation within 100 m, measures the distance from the building to it, notes the slope and the Fire Danger Index, and reads the BAL from the AS 3959 table. The forest, the tape and the level in the model are illustrative.',
    learn: [['The BAL measures how severely a building could be exposed to ember attack, radiant heat and direct flame contact. It sets the construction requirements.', 'V', 'cfaGlossary'], ['Method 1, as described for AS 3959-2009, has five steps: the Fire Danger Index, the vegetation class in each direction, the horizontal distance, the effective slope, then the BAL from the table. The highest BAL applies.', 'V', 'cgBalForm'], ['The council form gives the Fire Danger Index as 100 for Victoria general and 50 for Victorian alpine areas.', 'V', 'cgBalForm'], ['The vegetation groups are A forest, B woodland, C shrubland, D scrub, E mallee and mulga, F rainforest and G grassland.', 'V', 'cgBalForm'], ['Where there is more than one vegetation type, each is classified and the worst case applies. Low-threat vegetation such as managed lawns, orchards and golf courses, and non-vegetated areas, are excluded. Vegetation more than 100 m away is classed as BAL-Low in the 2009 method.', 'V', 'gaBal'], ['Distance is measured in the horizontal plane. The effective slope is the slope under the vegetation relative to the building, and the method is not valid where it is more than 20 degrees downslope.', 'V', 'gaBal'], ['The BAL should be assessed for the likely revegetated state following regrowth of burnt areas.', 'V', 'bpcBpa'], ['The BPC says assessments follow AS 3959-2018, while the council form and the toolbox describe the 2009 edition. The distance tables are in the Standard and were not opened, so the distance for each BAL is Confirm.', 'C']] },
  { id: 'overlay', title: 'Bushfire Prone Area, the overlay and the permits', pos: [6.0, 1.8, 13.6], stand: [6.0, 16.4], from: 1, drawing: 'permit',
    summary: 'A Bushfire Prone Area sets a minimum construction standard. The Bushfire Management Overlay also needs a planning permit, assessed before the building permit. The BAL is shown in the permit documents.',
    learn: [['All new homes in a Bushfire Prone Area must be built to a minimum of BAL-12.5, even where the assessment says BAL-Low. A higher level may apply.', 'V', 'bpcBpa'], ['A Bushfire Prone Area is an area designated under section 192A of the Building Act 1993.', 'V', 'cfaGlossary'], ['The Bushfire Management Overlay is Clause 44.06 of the Victoria Planning Provisions, and a Bushfire Management Statement shows how an application meets its requirements.', 'V', 'cfaGlossary'], ['In the overlay a planning permit is needed as well as the building permit. The building permit is assessed after the planning process, and bushfire requirements already considered need not be considered again.', 'V', 'planVicBpa'], ['The mandatory protection measures are defendable space, water supply, access and ongoing vegetation management. Overlay areas are also Bushfire Prone Areas by default.', 'V', 'planVicBpa'], ['The CFA says VC248, gazetted on 5 May 2026, changed Clauses 13.02, 44.06 and 53.02, so read the scheme in force on the permit date.', 'V', 'cfaGlossary'], ['Planning Victoria says a suitably qualified person can provide a BAL assessment. The VBA and BPC pages do not say who prepares it for a permit, so check with the surveyor.', 'V', 'planVicBpa'], ['A 2011 information sheet says a BAL set at the planning stage is accepted by the surveyor, and that an overlay permit carries a condition to maintain the protection measures. It is out of date, so confirm.', 'C', 'dpcdBmo']] },
  { id: 'roof', title: 'Roof and gable end: sealed against embers', pos: [0, PLATE_TOP + 1.0, 11.55], stand: [0, 14.4], from: 2, drawing: 'build',
    summary: 'Embers land on roofs and look for gaps. The tile roof from Step 5 is closed at the ridge and eaves, the sarking is covered by the general requirements of AS 3959, and the junction with the walls is sealed.',
    learn: [['BAL-12.5 includes sealing roofs so embers cannot get in.', 'V', 'bpcBpa'], ['Embers can enter through gaps as small as two millimetres.', 'V', 'yrBushfire'], ['At higher levels the council page says the roof underside and the space above the ceiling should be covered and sealed with non-flammable insulating blankets.', 'V', 'yrBushfire'], ['The Lysaght page advises non-combustible roofs, a simple roof shape, no gaps at the wall and roof junction and no re-entrant corners.', 'V', 'lysaghtBal'], ['The HIA overview says sections 5 to 9 of AS 3959 cover each level from the subfloor to the roof, and the general sections cover gaps, screening materials and sarking. The product rules were not read.', 'V', 'hiaAs3959'], ['The model roof is concrete tile on sarking and battens from Step 5. Whether it meets a given BAL depends on the product and the Standard (Confirm).', 'C']] },
  { id: 'eaves', title: 'Eaves, vents, gutters and guards', pos: [5.8, PLATE_TOP - 0.2, 7.5], stand: [8.3, 8.0], from: 2, detail: 'eave', drawing: 'build',
    summary: 'The eaves are lined, every vent is screened with metal mesh, the gap where the lining meets the wall is sealed, and a metal guard covers the gutter so leaves and embers do not collect.',
    learn: [['Openings in the eaves and the roof space are screened with corrosion-resistant metal mesh with a small aperture. Two millimetres is the usual figure, which fits the 2 mm gap the council page gives, but the aperture and the metals come from AS 3959 and were not opened.', 'C', 'yrBushfire'], ['The Lysaght page advises non-combustible gutters and downpipes, and no gaps at the junction of the wall and the roof.', 'V', 'lysaghtBal'], ['The eave lining is fixed with sealed joints so no gap is left for embers. The lining and its thickness for each BAL are in AS 3959 (Confirm).', 'C'], ['A metal gutter guard is fixed along the full length and keeps leaves out, because leaf litter in a gutter is fuel (Typical).', 'T'], ['The HIA overview says the general sections cover gaps and screening materials. Gap limits and mesh sizes were not read.', 'V', 'hiaAs3959'], ['In the model the lining is a raked board under the truss tails, the vents carry a dark mesh, a blue bead seals the lining to the wall, and a guard lies over the gutter. The bead is blue so it can be seen.', 'T']] },
  { id: 'glazing', title: 'Windows, doors and ember screens', pos: [-5.5, 1.7, 3.0], stand: [-7.8, 3.0], from: 3, detail: 'window', drawing: 'build',
    summary: 'BAL-12.5 includes sealing round doors and windows and screening windows. Higher levels add requirements for glass, frames, doors and shutters.',
    learn: [['BAL-12.5 includes sealing round doors and windows and screening windows.', 'V', 'bpcBpa'], ['The HIA overview says sections 5 to 9 of AS 3959 cover windows and external doors at each level, and the general sections cover glazing and bushfire shutters.', 'V', 'hiaAs3959'], ['One council page gives 5 mm toughened glass as the baseline at BAL-19, but its table layout is unclear. Glass and frame rules for each BAL are Confirm.', 'C', 'yrBushfire'], ['The council page says glazing and shutters become more costly at BAL-40 and Flame Zone.', 'C', 'yrBushfire'], ['A mesh screen fits each openable window, with a metal frame and fixings. The mesh size comes from AS 3959 (Typical).', 'T'], ['Doors are sealed round the edges with weather strips so embers cannot get in under or round the leaf (Typical).', 'T'], ['Bushfire-rated windows are often made to order, so allow lead time and order them early (Typical).', 'T']] },
  { id: 'deck', title: 'Deck and attached structures', pos: [-2.0, 0.6, -7.3], stand: [-2.0, -10.5], from: 4, detail: 'deck', drawing: 'build',
    summary: 'A deck against the house is part of the fire exposure. The council page says decks, and wall parts close to the ground, use non-combustible material, 6 mm fibre cement or bushfire-resisting timber at BAL-12.5 and 19.',
    learn: [['The council page says parts of external walls less than 400 mm above the ground, and decks, are non-combustible, 6 mm fibre cement clad, or bushfire-resisting or naturally fire-resistant timber (BAL-12.5 and 19).', 'V', 'yrBushfire'], ['The HIA overview says the general requirements cover attached and adjacent structures, so decks, pergolas and carports attached to the house are included.', 'V', 'hiaAs3959'], ['The Lysaght page advises minimising open space under decks.', 'V', 'lysaghtBal'], ['Keep the space under a low deck closed or screened, and keep it free of leaves and stored goods, so embers and litter do not collect (Typical).', 'T'], ['The species list of bushfire-resisting timbers and the rules at higher levels are in AS 3959 and were not opened (Confirm).', 'C'], ['The model deck is a low timber-look deck on a steel and timber frame. Sizes and the material are illustrative.', 'T']] },
  { id: 'smoke', title: 'Smoke alarms: tested and interconnected', pos: [2.6, 2.6, 2.75], stand: [3.4, 3.8], from: 5, drawing: 'fire',
    summary: 'Smoke alarms warn the people inside. They are mains-powered and interconnected, tested and recorded. The bushfire construction protects the building, and the alarms protect the people.',
    learn: [['Smoke alarms must comply with AS 3786, be powered from the consumer mains where connected, and be interconnected where there is more than one. The ABCB page carries NSW-labelled text and no edition.', 'V', 'nccHp95'], ['A ceiling-mounted alarm is at least 300 mm from the wall and ceiling corner and 500 to 1500 mm from the high point of a sloping ceiling.', 'V', 'nccHp95'], ['The VBA has a building practice note on smoke alarms in Class 1a buildings (ESM 09, version 3.0, 17 March 2023).', 'V', 'vbaEsm09'], ['The HIA overview says AS 3959 aims to protect the occupants until the fire front passes and to give some protection to the building. It does not guarantee a building will survive a bushfire on every occasion.', 'V', 'hiaAs3959'], ['Press the test button on each alarm and check that they all sound together. The maker states the test and maintenance method (Typical).', 'T']] },
  { id: 'sep', title: 'Fire separation: walls and boundaries', pos: [6.5, 1.2, -2.7], stand: [7.2, -0.3], from: 5, drawing: 'fire',
    summary: 'The distance from an external wall to the boundary, or to another building, decides whether the wall needs a fire rating. The model walls are 2.0 m from their boundaries, and a real block can put a wall much closer.',
    learn: [['The fire separation of external walls is in NCC Housing Provisions Part 9.2. The page read was a fragment without the distances and ratings, so those are Confirm.', 'C', 'nccHp92'], ['The VBA has flagged separating walls built on boundaries as a fire-safety gap (a 2017 news item that uses BCA 2019-era clause numbers).', 'V', 'vbaSepWalls'], ['The bushfire rules and the fire separation rules both apply to a house in a bushfire area, and the surveyor checks both (Typical).', 'T'], ['In the model each side wall is 2.0 m from its boundary, and the orange tapes show the distance. Real set-backs come from the permit.', 'T'], ['Garages and sheds are Class 10 buildings and come in Stage 17 (Typical).', 'T']] },
  { id: 'inspect', title: 'Surveyor checks, photos and the care duties', pos: [3.5, 1.8, 13.6], stand: [3.5, 16.4], from: 6, drawing: 'permit',
    summary: 'The surveyor checks the bushfire work against the BAL on the permit. Photographs of the sealing, mesh, guards and seals are taken before anything is covered, and the owner gets the care duties.',
    learn: [['In the overlay the planning permit conditions, which cover defendable space, water supply, access and vegetation management, carry on after the building is finished.', 'V', 'planVicBpa'], ['A 2011 information sheet says an overlay permit carries a condition to maintain the protection measures. It is out of date, so confirm the current wording.', 'C', 'dpcdBmo'], ['Check each bushfire item against the BAL on the permit: roof, eaves, vents, gutters, windows, doors, decks and attached structures (Typical).', 'T'], ['Take photographs of the sealing, mesh, guards and seals before the linings and landscaping cover them. They are the evidence later (Typical).', 'T'], ['Give the owner the BAL, the product details and the care duties, such as keeping gutters and the roof clear. The final inspection and the occupancy permit are covered in Stage 18 (Typical).', 'T']] },
];

/* ---------- zoom rooms ---------- */
const details = {
  eave: {
    title: 'Eave and roof edge: lining, vent, sealed junction, gutter and guard', sub: 'Brick veneer wall, truss tail, sarking, tile, raked eave lining, a vent with mesh, the sealant bead at the wall, the fascia, a metal gutter and its guard. Layers are drawn thicker than real',
    floor: -0.5, gridSize: 2, camera: { pos: [0.66, 0.2, 1.75], target: [0.03, -0.13, 0] },
    build(kit) {
      const { box } = kit, m = MAT(kit), A = Math.PI / 8, nx = Math.sin(A), ny = Math.cos(A), yT = (x) => -0.045 - TAN8 * (x + 0.05);
      const at = (x, n) => [x + n * nx, yT(x) + n * ny];                                      // a point on the tail line at x, moved n along the roof normal
      const sl = (len, th, mt, x, n, dz = 0.5) => { const [px, py] = at(x, n); const b = box(len, th, dz, mt, px, py, 0); b.rotation.z = -A; return b; };
      const wall = grp(box(0.11, 0.5, 0.5, m.brick, -0.245, -0.25, 0), box(0.1, 0.5, 0.5, m.timber, -0.35, -0.25, 0), box(0.22, 0.045, 0.5, m.timber, -0.3, 0.0225, 0));
      const tail = grp(sl(0.78, 0.09, m.timber, -0.05, 0, 0.05).translateZ(-0.15), sl(0.78, 0.09, m.timber, -0.05, 0, 0.05).translateZ(0.15));
      const sark = grp(sl(0.84, 0.004, m.foil, -0.03, 0.05));
      const tile = grp(sl(0.84, 0.03, m.tile, -0.03, 0.09));
      const lining = grp(sl(0.4, 0.008, m.board, 0.02, -0.052));
      const vent = grp(sl(0.1, 0.012, m.meshM, 0.08, -0.058));
      const [bx, by] = at(-0.19, -0.04), seal = grp(box(0.014, 0.014, 0.5, m.seal, bx + 0.012, by, 0));
      const fascia = grp(box(0.02, 0.19, 0.5, m.white, 0.31, yT(0.3) - 0.01, 0));
      const gutter = grp(box(0.115, 0.004, 0.5, m.dark, 0.3875, -0.3, 0), box(0.004, 0.09, 0.5, m.dark, 0.33, -0.255, 0), box(0.004, 0.065, 0.5, m.dark, 0.441, -0.2675, 0));
      const guard = grp(box(0.115, 0.004, 0.5, m.meshM, 0.3875, -0.225, 0));
      return { parts: [
        { id: 'wall', name: 'Brick veneer wall and top plate', group: wall, explode: [-0.2, -0.04, 0], anchor: [-0.245, -0.35, 0.25], flag: 'V', src: 'lysaghtBal', spec: 'Brick is non-combustible, and the page advises non-combustible external walls and no gaps at the junction of the wall and the roof. The wall is cut off to show the top.', desc: 'The wall the roof edge meets.' },
        { id: 'tail', name: 'Truss tail', group: tail, explode: [0.0, 0.0, 0], anchor: [0.12, -0.115, 0.22], flag: 'T', spec: 'The tail of the truss from Step 4 carries the roof edge over the wall. Only two trusses are drawn.', desc: 'Everything else hangs from it.' },
        { id: 'sark', name: 'Sarking', group: sark, explode: [0.05, 0.12, 0], anchor: [-0.01, 0.02, -0.25], flag: 'V', src: 'hiaAs3959', spec: 'The HIA overview says the general requirements of AS 3959 cover sarking. The product requirement was not read.', desc: 'Under the tile and the battens.' },
        { id: 'tile', name: 'Roof tile', group: tile, explode: [0.1, 0.24, 0], anchor: [0.02, 0.06, 0.25], flag: 'C', spec: 'Whether a tile suits a given BAL depends on the product and AS 3959. Roofs are sealed so embers cannot get in, and the gaps at the ridge and edges are closed.', desc: 'The tile roof from Step 5.' },
        { id: 'lining', name: 'Eave lining', group: lining, explode: [-0.05, -0.1, 0], anchor: [0.2, -0.17, 0.25], flag: 'C', spec: 'The lining closes the underside of the eave so embers cannot get between the truss tails. The material and thickness for each BAL are in AS 3959. It is drawn as a raked board under the tails.', desc: 'Fixed under the truss tails.' },
        { id: 'vent', name: 'Vent with metal mesh', group: vent, explode: [-0.08, -0.22, 0], anchor: [0.06, -0.17, -0.25], flag: 'C', spec: 'Eave vents are screened with corrosion-resistant metal mesh with a small aperture. Two millimetres is the usual figure, but the aperture and the metals come from AS 3959, which was not opened.', desc: 'Air can pass, embers cannot.' },
        { id: 'seal', name: 'Sealant bead', group: seal, explode: [-0.14, -0.06, 0], anchor: [-0.17, -0.03, 0.25], flag: 'V', src: 'yrBushfire', spec: 'Embers can enter gaps as small as two millimetres, so the gap where the lining meets the wall is sealed. The model draws the sealant blue so it can be seen.', desc: 'Closes the gap at the wall.' },
        { id: 'fascia', name: 'Fascia', group: fascia, explode: [0.14, 0, 0], anchor: [0.31, -0.1, 0.25], flag: 'T', spec: 'The board over the truss ends from Step 5 that carries the gutter. A metal or fibre cement fascia suits a bushfire area, and the product for each BAL is in AS 3959.', desc: 'Closes the ends of the truss tails.' },
        { id: 'gutter', name: 'Metal gutter', group: gutter, explode: [0.24, -0.1, 0], anchor: [0.39, -0.3, 0.25], flag: 'V', src: 'lysaghtBal', spec: 'The page advises non-combustible gutters and downpipes. A steel or aluminium gutter does not ignite.', desc: 'Carries the water to the downpipes.' },
        { id: 'guard', name: 'Gutter guard', group: guard, explode: [0.24, 0.14, 0], anchor: [0.39, -0.225, -0.25], flag: 'T', spec: 'A metal guard covers the gutter so leaves and embers do not collect. It is fixed along the full length. The product for each BAL is in AS 3959.', desc: 'Keeps fuel out of the gutter.' },
      ] };
    },
  },

  window: {
    title: 'Window, sealant and ember screen', sub: 'Brick wall with its opening, the window frame and glass, the sealant round the frame, and the screen frame with its metal mesh. Sizes are illustrative, and the sealant is drawn blue so it can be seen',
    floor: -0.45, gridSize: 2, camera: { pos: [0.9, 0.35, 0.95], target: [0.0, 0.0, 0.0] },
    build(kit) {
      const { box } = kit, m = MAT(kit);
      const ring = (x, th, mt, ow, oh, iw, ih) => [box(th, (oh - ih) / 2, ow, mt, x, (oh + ih) / 4, 0), box(th, (oh - ih) / 2, ow, mt, x, -(oh + ih) / 4, 0), box(th, ih, (ow - iw) / 2, mt, x, 0, (ow + iw) / 4), box(th, ih, (ow - iw) / 2, mt, x, 0, -(ow + iw) / 4)];
      const wall = grp(...ring(-0.055, 0.11, m.brick, 0.95, 0.85, 0.44, 0.5));
      const frame = grp(...ring(-0.06, 0.06, m.steel, 0.44, 0.5, 0.4, 0.46));
      const glass = grp(box(0.006, 0.46, 0.4, m.glass, -0.06, 0, 0));
      const seal = grp(...ring(0.006, 0.012, m.seal, 0.47, 0.53, 0.44, 0.5));
      const sframe = grp(...ring(0.04, 0.02, m.steel, 0.5, 0.56, 0.46, 0.52));
      const wires = []; for (let k = -5; k <= 5; k++) wires.push(box(0.002, 0.52, 0.002, m.meshM, 0.04, 0, k * 0.04)); for (let k = -6; k <= 6; k++) wires.push(box(0.002, 0.002, 0.46, m.meshM, 0.04, k * 0.04, 0));
      const mesh = grp(box(0.003, 0.52, 0.46, m.screen, 0.04, 0, 0), ...wires);
      return { parts: [
        { id: 'wall', name: 'Brick wall round the opening', group: wall, explode: [-0.22, 0, 0], anchor: [-0.055, 0.3, 0.3], flag: 'V', src: 'lysaghtBal', spec: 'Brick veneer is non-combustible. The wall is shown with the opening cut and the weepholes and flashings left out.', desc: 'Drawn as a slab with an opening.' },
        { id: 'frame', name: 'Window frame', group: frame, explode: [-0.1, 0, 0], anchor: [-0.06, -0.24, 0.2], flag: 'C', spec: 'The frame material for each BAL is in AS 3959, which was not opened. A metal frame is drawn.', desc: 'Holds the glass in the opening.' },
        { id: 'glass', name: 'Glass', group: glass, explode: [-0.03, 0, 0], anchor: [-0.06, 0.1, 0.0], flag: 'C', src: 'yrBushfire', spec: 'One council page gives 5 mm toughened glass as the baseline at BAL-19, but its table layout is unclear. Glass and glazing rules for each BAL are in AS 3959 and were not opened.', desc: 'The glass must suit the BAL.' },
        { id: 'seal', name: 'Sealant round the frame', group: seal, explode: [0.06, 0, 0], anchor: [0.006, 0.265, -0.15], flag: 'V', src: 'bpcBpa', spec: 'BAL-12.5 includes sealing round doors and windows so embers cannot get in. The sealant product is the maker’s choice.', desc: 'Closes the gap round the frame.' },
        { id: 'sframe', name: 'Screen frame', group: sframe, explode: [0.14, 0, 0], anchor: [0.04, -0.28, 0.2], flag: 'T', spec: 'A metal frame holds the mesh over the openable window and is fixed to the window or the wall. The details come from AS 3959.', desc: 'Holds the mesh.' },
        { id: 'mesh', name: 'Metal mesh screen', group: mesh, explode: [0.22, 0, 0], anchor: [0.04, 0.05, -0.2], flag: 'V', src: 'bpcBpa', spec: 'BAL-12.5 includes screening windows. Embers can enter gaps as small as two millimetres (council page), and the mesh aperture comes from AS 3959, which was not opened.', desc: 'Lets air through and stops embers.' },
      ] };
    },
  },

  deck: {
    title: 'Deck against the house: wall base, slab, frame and boards', sub: 'Low brick wall, slab edge, post, bearer, joists and decking boards. The material is bushfire-resisting timber or non-combustible, and the space under the deck is kept closed. Sizes are illustrative',
    floor: -0.4, gridSize: 2, camera: { pos: [0.95, 0.45, 1.4], target: [0.1, -0.15, 0.0] },
    build(kit) {
      const { box } = kit, m = MAT(kit);
      const wall = grp(box(0.11, 0.45, 0.5, m.brick, -0.245, 0.0, 0), box(0.1, 0.45, 0.5, m.timber, -0.35, 0.0, 0));
      const slab = grp(box(0.3, 0.15, 0.5, m.conc, -0.2, -0.275, 0));
      const post = grp(box(0.09, 0.28, 0.09, m.steel, 0.35, -0.26, 0));
      const bearer = grp(box(0.09, 0.14, 0.5, m.timber, 0.35, -0.07, 0));
      const joist = grp(box(0.64, 0.12, 0.045, m.timber, 0.05, -0.0, -0.18), box(0.64, 0.12, 0.045, m.timber, 0.05, 0, 0), box(0.64, 0.12, 0.045, m.timber, 0.05, 0, 0.18));
      const boards = grp(...[0, 1, 2, 3, 4].map((i) => box(0.14, 0.03, 0.5, m.deck, -0.12 + i * 0.16, 0.075, 0)));
      return { parts: [
        { id: 'wall', name: 'Wall base', group: wall, explode: [-0.22, 0.03, 0], anchor: [-0.245, 0.2, 0.25], flag: 'V', src: 'yrBushfire', spec: 'The council page says parts of external walls less than 400 mm above the ground are non-combustible, 6 mm fibre cement clad, or bushfire-resisting or naturally fire-resistant timber at BAL-12.5 and 19. Brick is non-combustible.', desc: 'The lowest part of the wall.' },
        { id: 'slab', name: 'Slab edge', group: slab, explode: [-0.14, -0.1, 0], anchor: [-0.2, -0.35, 0.25], flag: 'T', spec: 'The slab from Step 2 carries the wall. The deck is fixed to the wall or stands clear, as the design says.', desc: 'The house slab.' },
        { id: 'post', name: 'Post', group: post, explode: [0.0, -0.07, 0], anchor: [0.35, -0.38, 0.05], flag: 'T', spec: 'A steel post carries the bearer. The footing and fixing come from the structural design.', desc: 'Carries the outer edge.' },
        { id: 'bearer', name: 'Bearer', group: bearer, explode: [0.1, -0.05, 0], anchor: [0.35, -0.14, -0.25], flag: 'C', spec: 'The bearer carries the joists. Timber species that are bushfire-resisting, and the rules at higher levels, are in AS 3959 and were not opened.', desc: 'Runs along the outer edge.' },
        { id: 'joist', name: 'Joists', group: joist, explode: [0.0, 0.05, 0], anchor: [0.0, -0.06, 0.22], flag: 'C', spec: 'Joists carry the boards. The material and the spacing come from the design and the Standard.', desc: 'Run out from the wall.' },
        { id: 'boards', name: 'Decking boards', group: boards, explode: [0.0, 0.18, 0], anchor: [0.2, 0.09, -0.25], flag: 'V', src: 'yrBushfire', spec: 'The council page says decks are non-combustible material, 6 mm fibre cement clad, or bushfire-resisting or naturally fire-resistant timber at BAL-12.5 and 19. The space under the deck is kept closed or screened.', desc: 'The walking surface.' },
      ] };
    },
  },
};

export default {
  n: 16, id: 'bushfire', title: 'Bushfire and fire safety', subtitle: 'The BAL site assessment, overlays and permits, a sealed roof and eaves, gutter guards, window screens and door seals, a deck, smoke alarms, fire separation and the surveyor’s checks.',
  phases, build, details, drawings, howto, trades, materials, quotes, quoteTips, inspections, exam, sources, caution,
};

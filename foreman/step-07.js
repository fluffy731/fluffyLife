// Step 7: windows, doors and lock-up. Windows and external doors are fixed into the finished brick-veneer house from Step 6, flashed and sealed,
// safety glass is checked against Part 8.4, locks go on and the house reaches lock-up. Sizes are typical. NCC figures were read from the ABCB's free
// web pages (NCC 2022 Housing Provisions Parts 8.2, 8.4 and 13.3) and the Your Home guide; the Standards (AS 2047, AS 1288) are paywalled and were not
// opened. NCC 2025 applies in Victoria from 1 May 2026, so every clause number and figure needs checking against that edition.
import * as THREE from 'three';
import step6, { grp, bricksIn, mortarBlock, tieAt, pl, PITCH, BT } from './step-06.js';
import { HOUSE, BASE_COLLIDERS, MAP } from './site.js';
import { svg, T, L, R, P, dim, call } from './dwg.js';
import { F, WALLS } from './frame.js';

const { x0: X0, x1: X1, z0: Z0, z1: Z1 } = HOUSE;
const HEADY = F.SLAB + F.HEAD;   // underside of the frame lintel, metres above the ground
const WZ = -0.185;               // centre of the window frame, metres behind the brick face (it sits in the frame opening)

const phases = [
  { title: 'Delivery and opening check', text: 'Windows, door leaves and the garage door arrive. Before anything is fixed, each opening is checked for size, level and square, and the sill flashing is checked.' },
  { title: 'Windows set, packed and fixed', text: 'Each window goes into its opening on packers along the sides and bottom, is checked plumb, level and square, and is fixed through the jambs with a 10 mm gap left at the head.' },
  { title: 'Flashing and sealing around the windows', text: 'The wrap is lapped to the flashings, a backing rod and flexible sealant go round each frame, and the weepholes stay open.' },
  { title: 'External doors hung', text: 'The front door goes into its frame over a sill pan, and the sliding door goes into its track. Both are checked for swing, seal and clearance.' },
  { title: 'Locks, safety glass and security', text: 'Locks and handles go on, safety glass is labelled and the big panes get a visible band so no one walks into them.' },
  { title: 'Lock-up check', text: 'Every opening is closed and lockable, every flashing and glass label is photographed, and the contract\'s own lock-up conditions are checked before any payment claim.' },
];

/* ---------- walk scene ---------- */
const WALLS_EXT = WALLS.filter((w) => w.ext);
const wallGeom = (id) => { const w = WALLS_EXT.find((q) => q.id === id), ew = id === 'front' || id === 'back', out = (id === 'front' || id === 'east') ? 1 : -1; return { w, ew, out, fixed: ew ? (out > 0 ? Z1 : Z0) : (out > 0 ? X1 : X0) }; };

function build(kit) {
  const { C, mat, box, cyl, rod, textPlane } = kit;
  const mk = (n) => { const g = new THREE.Group(); g.name = n; return g; };
  const s6 = step6.build(kit, { done: true });
  // keep the finished site, frame, roof and brick walls from Stage 6, minus its stock, check sign and markers
  const layers = s6.layers.filter((l) => !['stock', 'check', 'm2', 'm3'].includes(l.group.name)).map(({ group }) => ({ group }));

  const alu = mat(0x2d3338, { metalness: 0.45, roughness: 0.45 }), glassM = mat(0x8fb4d0, { roughness: 0.08, metalness: 0.5, transparent: true, opacity: 0.38, depthWrite: false });
  const obscure = mat(0xe6eef2, { roughness: 0.6, transparent: true, opacity: 0.78, depthWrite: false }), sealM = mat(0x5a6067, { roughness: 0.75 }), chrome = mat(0xc9ced4, { metalness: 0.85, roughness: 0.25 });
  const doorM = mat(0x1f4e6b, { roughness: 0.55 }), timber = mat(0xffffff, { tex: 'timber' }), primed = mat(0xe8e5dc, { roughness: 0.7 }), alum2 = mat(0xaeb4ba, { metalness: 0.6, roughness: 0.4 });
  const place = (W, o, g) => { // g is built in wall axes: x along the wall, y up, z outward from the brick face
    const { ew, out, fixed } = W;
    g.position.set(ew ? o.at : fixed, 0, ew ? fixed : o.at);
    g.rotation.y = ew ? (out > 0 ? 0 : Math.PI) : (out > 0 ? Math.PI / 2 : -Math.PI / 2);
    return g;
  };
  const ring = (g, mm, w, y0, y1, zc, d, fw = 0.05) => { const h = y1 - y0, cy = (y0 + y1) / 2; g.add(box(w, fw, d, mm, 0, y0 + fw / 2, zc), box(w, fw, d, mm, 0, y1 - fw / 2, zc), box(fw, h - 2 * fw, d, mm, -w / 2 + fw / 2, cy, zc), box(fw, h - 2 * fw, d, mm, w / 2 - fw / 2, cy, zc)); };

  const windows = mk('windows'), doors = mk('doors'), sealsW = mk('sealsW'), sealsD = mk('sealsD'), hardware = mk('hardware'), labels = mk('labels');
  const bead = (g, w, y0, y1) => { const t = 0.014, cy = (y0 + y1) / 2, z = WZ + 0.035 + 0.004; g.add(box(w + 2 * t, t, 0.012, sealM, 0, y1 + t / 2, z), box(w + 2 * t, t, 0.012, sealM, 0, y0 - t / 2, z), box(t, y1 - y0, 0.012, sealM, -w / 2 - t / 2, cy, z), box(t, y1 - y0, 0.012, sealM, w / 2 + t / 2, cy, z)); };
  for (const w of WALLS_EXT) {
    const W = wallGeom(w.id);
    for (const o of w.open) {
      if (o.sill > 0) { // window
        const g = new THREE.Group(), ww = o.w - 0.02, y0 = F.SLAB + o.sill + 0.005, y1 = HEADY - 0.01, cy = (y0 + y1) / 2, h = y1 - y0;
        ring(g, alu, ww, y0, y1, WZ, 0.07);
        g.add(box(ww - 0.1, h - 0.1, 0.006, o.sill >= 1.5 ? obscure : glassM, 0, cy, WZ));
        if (o.w >= 1.4) { g.add(box(0.05, h - 0.1, 0.085, alu, 0, cy, WZ - 0.007), box(ww / 2 - 0.05, 0.035, 0.02, alu, ww / 4, y1 - 0.0675, WZ + 0.045), box(ww / 2 - 0.05, 0.035, 0.02, alu, ww / 4, y0 + 0.0675, WZ + 0.045)); }
        else g.add(box(ww - 0.1, 0.04, 0.07, alu, 0, y0 + h * 0.62, WZ));
        windows.add(place(W, o, g));
        const sg = new THREE.Group(); bead(sg, ww, y0, y1); sealsW.add(place(W, o, sg));
      } else if (w.id === 'front') { // front door in a timber frame, over a threshold
        const g = new THREE.Group(), y0 = F.SLAB + 0.02, y1 = HEADY - 0.005, h = y1 - y0, cy = (y0 + y1) / 2, lw = o.w - 0.12, lh = h - 0.07;
        g.add(box(0.045, h, 0.07, timber, -o.w / 2 + 0.03, cy, WZ), box(0.045, h, 0.07, timber, o.w / 2 - 0.03, cy, WZ), box(o.w - 0.02, 0.045, 0.07, timber, 0, y1 - 0.0225, WZ));
        g.add(box(lw, lh, 0.04, doorM, 0, y0 + 0.015 + lh / 2, WZ + 0.005), box(0.17, 1.1, 0.046, glassM, -lw / 2 + 0.2, cy + 0.12, WZ + 0.005), box(o.w - 0.02, 0.02, 0.14, alum2, 0, F.SLAB + 0.01, -0.09));
        doors.add(place(W, o, g));
        const sg = new THREE.Group(); bead(sg, o.w - 0.02, y0, y1); sealsD.add(place(W, o, sg));
        const hg = new THREE.Group(); hg.add(box(0.13, 0.02, 0.03, chrome, 0.27, F.SLAB + 1.0, WZ + 0.045), box(0.04, 0.16, 0.012, chrome, 0.32, F.SLAB + 1.0, WZ + 0.032));
        const dl = cyl(0.024, 0.02, chrome, 0.3, F.SLAB + 1.25, WZ + 0.034, 18); dl.rotation.x = Math.PI / 2; hg.add(dl); hardware.add(place(W, o, hg));
      } else { // back sliding door: two leaves in an aluminium frame
        const g = new THREE.Group(), ww = o.w - 0.02, y0 = F.SLAB + 0.02, y1 = HEADY - 0.01, cy = (y0 + y1) / 2, h = y1 - y0, lw = ww / 2 + 0.03;
        ring(g, alu, ww, y0, y1, WZ, 0.07, 0.06);
        for (const [sx, dz] of [[-ww / 4 - 0.0075, -0.012], [ww / 4 + 0.0075, 0.03]]) { ring(g, alu, lw - 0.07, y0 + 0.06, y1 - 0.06, WZ + dz, 0.04, 0.045); g.add(box(lw - 0.16, h - 0.22, 0.006, glassM, sx, cy, WZ + dz)); }
        doors.add(place(W, o, g));
        const sg = new THREE.Group(); bead(sg, ww, y0, y1); sealsD.add(place(W, o, sg));
        const hg = new THREE.Group(); hg.add(box(0.03, 0.22, 0.02, chrome, -0.04, F.SLAB + 1.05, WZ + 0.052)); hardware.add(place(W, o, hg));
        // opaque band and the etched safety-glass label on the front leaf
        const lg = new THREE.Group(), band = box(ww - 0.12, 0.025, 0.004, mat(0xf2f5f7, { roughness: 0.5, transparent: true, opacity: 0.9 }), 0, F.SLAB + 0.93, WZ + 0.034), lab = textPlane(['SAFETY GLASS', 'Grade A · see label'], 0.17, 0.085);
        lab.position.set(ww / 2 - 0.3, y0 + 0.28, WZ + 0.034); lg.add(band, lab); labels.add(place(W, o, lg));
      }
    }
  }

  // stock on site: window packs and door leaves leaning on a rack; garage-door pack stays until the garage is built
  const crates = mk('crates'), rack = mk('rack'), garage = mk('garage');
  const card = mat(0xc8ad82, { roughness: 0.9 }), plank = mat(0xffffff, { tex: 'timber' });
  for (const [x, z, r, w, h] of [[-4.6, 14.3, 0.1, 1.9, 1.25], [-4.5, 14.75, 0.05, 1.5, 1.2], [-3.1, 14.4, -0.08, 1.2, 1.2]]) {
    const p = mk('pack'); p.add(box(w, h, 0.28, card, 0, h / 2 + 0.1, 0), box(w + 0.1, 0.08, 0.34, plank, 0, 0.04, 0), box(w + 0.04, 0.05, 0.3, plank, 0, h + 0.12, 0)); p.position.set(x, 0, z); p.rotation.y = r; crates.add(p);
  }
  rack.add(box(1.0, 0.06, 0.06, plank, -1.2, 0.03, 14.5), box(0.06, 1.7, 0.06, plank, -1.65, 0.85, 14.5), box(0.06, 1.7, 0.06, plank, -0.75, 0.85, 14.5));
  for (let i = 0; i < 3; i++) { const l = box(0.82, 2.04, 0.045, i === 0 ? doorM : primed, -1.45 + i * 0.28, 1.0, 14.62 - i * 0.07); l.rotation.x = -0.12; rack.add(l); }
  const steelG = mat(0x9aa3ad, { metalness: 0.5, roughness: 0.45 });
  garage.add(box(2.6, 0.1, 0.12, plank, 4.0, 0.05, 14.4), box(2.6, 0.1, 0.12, plank, 4.0, 0.05, 15.0));
  for (let i = 0; i < 4; i++) garage.add(box(2.4, 0.045, 0.52, steelG, 4.0, 0.125 + i * 0.05, 14.7));
  garage.add(box(0.9, 0.3, 0.4, card, 4.0, 0.46, 14.7), rod([2.8, 0.1, 15.35], [5.2, 0.1, 15.35], 0.02, steelG, 8), rod([2.8, 0.14, 15.35], [5.2, 0.14, 15.35], 0.02, steelG, 8));

  const check = mk('check'), sign = textPlane(['CHECK POINT: LOCK-UP', 'Windows and doors fixed, sealed, locked', 'Photograph flashings and glass labels'], 1.9, 0.9);
  sign.position.set(0, 1.5, Z1 + 1.3); check.add(sign, cyl(0.04, 1.6, mat(C.steel), -0.85, 0.8, Z1 + 1.28, 8), cyl(0.04, 1.6, mat(C.steel), 0.85, 0.8, Z1 + 1.28, 8));

  layers.push({ group: crates, until: 2 }, { group: rack, until: 3 }, { group: garage }, { group: windows, from: 1 }, { group: sealsW, from: 2 }, { group: doors, from: 3 }, { group: sealsD, from: 3 },
    { group: hardware, from: 4 }, { group: labels, from: 4 }, { group: check, from: 5 });

  return {
    layers, colliders: [...BASE_COLLIDERS, { x0: X0, x1: X1, z0: Z0, z1: Z1 }], tickers: s6.tickers,
    spawn: { pos: [4, 18.5], yaw: 0, pitch: 0.2 }, map: MAP,
    orbit: { pos: [17, 11, 26], target: [0, 1.8, 4] },
    hotspots: [
      { id: 'stock', title: 'Windows and doors delivered', pos: [-3.9, 1.4, 14.4], stand: [-3.9, 18.2], from: 0, until: 2, detail: 'window', drawing: 'winsec',
        summary: 'Windows and door leaves are made to size from the window schedule. Check each against the order before anyone fixes it, and store them upright, dry and out of the sun until the openings are ready.',
        learn: [['Check size, frame colour, glass type and opening style for every window against the schedule in the permit documents. A wrong window is costly to replace once it is flashed in.', 'T'], ['Part 8.2 covers windows and external glazed doors. It does not cover internal or revolving doors, fixed louvres, skylights, windows not in the vertical plane, greenhouse windows or frameless sliding doors.', 'V', 'nccWin82'], ['Glass in doors and in low or large windows must suit Part 8.4 (human impact). Ask the maker to state the glass type for each pane, because safety glass is marked.', 'V', 'nccGlaz84'], ['Ask for the rated U-value and SHGC of each window and compare them with the energy report. A different window from the one that was rated can break the rating.', 'C', 'yourHomeGlaz'], ['Keep the protective film on until handover, stand packs on level bearers and keep them off wet ground.', 'T']] },
      { id: 'opening', title: 'Check the opening', pos: [3.9, 1.65, Z1 + 0.04], stand: [3.9, 15.6], from: 0, until: 1, detail: 'window', drawing: 'winsec',
        summary: 'Before the window goes in, check the opening is the right size, the sill trimmer is level, the wrap is folded in and the sill flashing is sitting smooth. A square, level opening makes the window easy to fit and seal.',
        learn: [['The window should be as close as possible to perpendicular with the vertical and horizontal planes, with equal diagonal measurements so it is square (NCC explanatory note).', 'V', 'nccWin82'], ['Allow at least a 10 mm gap between the top of the window assembly and any loadbearing framing or masonry. The gap may be bigger to allow for settlement over wide openings.', 'V', 'nccWin82'], ['Structural building loads must not be transferred to the window assembly, so the lintel above carries the load and the window only carries its own.', 'V', 'nccWin82'], ['Sill flashing sits smooth and does not sag into the cavity (manufacturer guide, edition not stated).', 'C', 'bradFlash']] },
      { id: 'window', title: 'Window fixed in the opening', pos: [-3.4, 1.65, Z1 + 0.04], stand: [-3.4, 15.6], from: 1, detail: 'window', drawing: 'winsec',
        summary: 'The window sits in the frame opening on packers along the sides and bottom, held straight, and is fixed through the jambs into the trimmer studs. The gap at the top is left empty so the lintel never loads the window.',
        learn: [['Packing goes along each side and the bottom, fixed to keep the sides and bottom of the window straight, and must be clear of any flashing material.', 'V', 'nccWin82'], ['Packing should suit both the frame and the window assembly and be fixed so it stays in place permanently.', 'V', 'nccWin82'], ['Aluminium sills that may touch masonry, particularly mortar, need an isolating material. The NCC notes give bituminous membranes and paints or caulking compounds containing zinc chromates as examples.', 'V', 'nccWin82'], ['Gaps between sills and external skins should be kept small to limit water getting in.', 'V', 'nccWin82'], ['Fixing type and spacing come from the window maker. NCC Figure 8.2.2 shows fixing positions but was not on the page read, so check it.', 'C', 'nccWin82']] },
      { id: 'seal', title: 'Flashing and sealant round the frame', pos: [-4.3, 1.65, Z1 + 0.04], stand: [-4.3, 15.2], from: 2, detail: 'jamb', drawing: 'jamb',
        summary: 'Water that gets past the sealant must still end up outside. The wrap laps over the sill flashing, the head flashing from Step 6 sheds water over the window, and the weepholes keep the cavity draining.',
        learn: [['Sill and head flashings from Step 6 extend at least 150 mm past the reveals each side and sit within the course limits the NCC gives, so water at a window jamb lands on a flashing and runs out.', 'V', 'nccMas57'], ['The wrap is turned into the opening and lapped shingle-fashion over the sill flashing upturn, so water runs down onto the flashing and not behind it.', 'T'], ['Backing rod then flexible sealant go round the frame to the maker\'s data. The sealant is a weather seal that needs maintenance. The flashings and wrap are the real defence.', 'T'], ['Do not seal the weepholes or the cavity base. Flashing weepholes are at no more than 1 200 mm centres (manufacturer guide, edition not stated).', 'C', 'bradFlash']] },
      { id: 'wers', title: 'Window energy ratings', pos: [3.0, 1.65, Z0 - 0.04], stand: [3.0, -9.5], from: 1,
        summary: 'Each window has two numbers that decide its energy performance: U-value, which is how well it holds heat in or out, and SHGC, which is how much sun heat it lets through. They come from the window maker\'s rating.',
        learn: [['A lower U-value means more resistance to heat flow and a better insulating window.', 'V', 'yourHomeGlaz'], ['SHGC runs from 0 to 1. A lower SHGC lets less solar heat through. For temperate climates the guide says north-facing glass wants a high SHGC with fixed shading, east and west glass a low one, and south glass can be any.', 'V', 'yourHomeGlaz'], ['WERS lists a window\'s U-value, SHGC, air infiltration and visible light transmittance, with star ratings for heating and cooling. The guide\'s indicative table values cannot be used for compliance, so use the rated figures for the actual product.', 'V', 'yourHomeGlaz'], ['Part 13.3 of the Housing Provisions has external glazing tables and factors by climate zone, orientation and shading. The page read did not show a compliance route or any values, so confirm the route (NatHERS or the tables) with the energy rater in Step 11.', 'C', 'nccEnergy133'], ['The window schedule in the energy report is part of the permit documents. Any substitution goes back to the rater first.', 'T']] },
      { id: 'door', title: 'Front door and threshold', pos: [1.5, 1.4, Z1 + 0.04], stand: [1.5, 15.8], from: 3, detail: 'door', drawing: 'doorsec',
        summary: 'The door frame goes in plumb with the threshold on a sill pan, so any water that gets under the door drains outside and not into the slab edge. The leaf is hung with a seal at the bottom and a lock on the latch side.',
        learn: [['Windows and external glazed doors share Part 8.2, so the packing, gap and no-load rules apply to glazed doors as well. For solid door sets follow the maker\'s installation sheet.', 'V', 'nccWin82'], ['Glass in doors must be Grade A safety glass to Table 8.4.2, with listed exceptions such as unframed doors (toughened, at least 10 mm) and annealed leadlights up to 0.05 m².', 'V', 'nccGlaz84'], ['A sill pan or membrane under the threshold, turned up at the back and over the slab edge at the front, is typical practice. Follow the door maker\'s detail.', 'T'], ['Check swing, clearances, threshold height and the bottom seal. Outside the door there is a 150 mm step to the ground until the landing is built in Step 17.', 'T']] },
      { id: 'glazing', title: 'Safety glass in the sliding door', pos: [-2.0, 1.4, Z0 - 0.04], stand: [-2.0, -9.5], from: 3, detail: 'glazing', drawing: 'glaz',
        summary: 'People walk into glass. Part 8.4 sets where safety glass is needed (doors, panels beside them and glass near the floor), how thick glass must be for its area, how visible big panes must be, and how safety glass is marked.',
        learn: [['Glass in a door must be Grade A safety glass under Table 8.4.2, with exceptions. Sizes in the table: toughened 3 mm up to 1 m², 4 mm up to 2 m², 5 mm up to 3 m², 6 mm up to 4 m². Laminated 5.38 mm up to 2.2 m², 6.38 mm up to 3 m², 8.38 mm up to 5 m². Annealed 5 mm up to 0.3 m² and 6 mm up to 0.9 m².', 'V', 'nccGlaz84'], ['Side panels with a sight line under 300 mm from the doorway edge are covered by Part 8.4.3.', 'V', 'nccGlaz84'], ['Where the sight line is under 500 mm above the floor, glass must be Grade A safety glass, or annealed glass at least 5 mm thick if the pane is 1.2 m² or less.', 'V', 'nccGlaz84'], ['A wet area sight line under 2.0 m needs toughened glass at least 6 mm for exposed edges, with organic-coated glass sizes in Table 8.4.6: 3 mm up to 1 m², 4 mm up to 1.5 m², 5 mm up to 2 m², 6 mm or more up to 3 m².', 'V', 'nccGlaz84'], ['A visible opaque band must be at least 20 mm high, with the upper edge at least 700 mm and the lower edge no more than 1.2 m above the floor.', 'V', 'nccGlaz84'], ['Safety glass must be marked by etching or a non-reusable label stating the standard, supplier, grade, thickness and type. AS 1288 is the Standard that selects and installs glass, but the page read does not name it, so confirm.', 'C', 'nccGlaz84']] },
      { id: 'lock', title: 'Locks and security', pos: [1.85, 1.15, Z1 + 0.06], stand: [1.85, 15.6], from: 4, detail: 'door', drawing: 'doorsec',
        summary: 'Lock-up means the house can be locked. A deadlock goes on every external door, windows are latched, and the keys stay with the builder until handover. The lock-up stage is also when the contract lets you claim a larger payment.',
        learn: [['The contract defines lock-up. The Consumer Affairs Victoria page says external cladding and roof covering are fixed, the flooring is laid, and external doors and windows are fixed even if only temporary. It was updated 9 July 2025, before the 2025 Act.', 'C', 'cavPay'], ['Most builders fit keyed deadlocks to external doors and keep the keys until handover. Temporary locks or door boards are common while the fit-out goes on.', 'T'], ['Keep a key register and record who has been on site. Site security is part of the site safety plan from Step 1.', 'T'], ['Whether an external door lock must open without a key from the inside depends on the NCC egress rules. This was not checked here, so ask the surveyor before choosing a lockset.', 'C']] },
      { id: 'garage', title: 'Garage door (delivery pack)', pos: [4.0, 0.95, 14.7], stand: [4.0, 18.3], from: 0, detail: 'garage',
        summary: 'This house has no garage in the model, so the garage door is shown as a delivery pack: stacked steel panels, tracks and the opener carton. A sectional door is ordered with the other doors, and the supplier usually fits it.',
        learn: [['Check the opening width and height, the headroom above it and the side room for tracks before ordering. The header over a garage opening is sized by the engineer.', 'T'], ['Openers have entrapment protection: photo-eye sensors and auto-reverse when the door meets resistance. Test them at handover and keep the instructions.', 'T'], ['Ask the supplier for the door\'s wind rating and check it suits the wind classification on the permit documents (Step 4).', 'C'], ['Check the contract documents say who supplies the door, the opener and the remotes, and whether a garage door is in the contract price.', 'T']] },
      { id: 'lockup', title: 'Lock-up check', pos: [0, 1.5, Z1 + 1.3], stand: [0, 17], from: 5,
        summary: 'Lock-up is a payment stage, so the contract decides when it is reached. Before any claim, check each condition in the contract, photograph the finished openings and check the payment limit for your contract type.',
        learn: [['Check every condition in your contract\'s lock-up definition before claiming. The Consumer Affairs Victoria page lists external cladding and roof covering fixed, flooring laid, and external doors and windows fixed (even if temporary).', 'C', 'cavPay'], ['The page shows a lock-up payment limit of 40% where the contract is to build to fixing, and 35% where it covers all stages (page last updated 9 July 2025). Step 1 lists the all-stage table.', 'C', 'cavPay'], ['The Domestic Building Contracts Amendment Act 2025 passed on 11 September 2025 and takes effect by 1 December 2026. Regulations can set deposit limits, progress payment stages and limits, and payments must be proportionate to the work done. Check the current figures before using any number here.', 'C', 'cavAmend'], ['Photograph the finished windows, flashings, doors and glass labels. Ask the surveyor whether they want to inspect at lock-up.', 'T']] },
    ],
  };
}

/* ---------- 3D detail models: wall runs along z, the outside is +x, the brick leaf sits at x from -0.11 to 0, y = 0 at the stated level ---------- */
const MAT = (kit) => {
  const { mat } = kit;
  return {
    timber: mat(0xffffff, { tex: 'timber' }), conc: mat(0xffffff, { tex: 'concrete' }), foil: mat(0xb4bcc6, { metalness: 0.2, roughness: 0.5, side: THREE.DoubleSide }), flash: mat(0xdfe3e8, { metalness: 0.3, roughness: 0.4, side: THREE.DoubleSide }),
    alu: mat(0x2d3338, { metalness: 0.45, roughness: 0.45 }), glass: mat(0x8fb4d0, { roughness: 0.08, metalness: 0.5, transparent: true, opacity: 0.4, depthWrite: false }), chrome: mat(0xc9ced4, { metalness: 0.85, roughness: 0.25 }),
    dark: mat(0x1b1d20, { roughness: 0.7 }), pack: mat(0xd9b27a, { roughness: 0.8 }), seal: mat(0x5a6067, { roughness: 0.75 }), door: mat(0x1f4e6b, { roughness: 0.55 }), steel: mat(0x9aa3ad, { metalness: 0.5, roughness: 0.45 }), plaster: mat(0xe9e6df, { roughness: 0.9 }),
  };
};
const ringIn = (kit, mm, g, w, y0, y1, xc, d, zc = 0, fw = 0.05) => { const { box } = kit, h = y1 - y0, cy = (y0 + y1) / 2; g.add(box(d, fw, w, mm, xc, y0 + fw / 2, zc), box(d, fw, w, mm, xc, y1 - fw / 2, zc), box(d, h - 2 * fw, fw, mm, xc, cy, zc - w / 2 + fw / 2), box(d, h - 2 * fw, fw, mm, xc, cy, zc + w / 2 - fw / 2)); return g; };

const details = {
  window: {
    title: 'Window in the frame opening', sub: 'Frame trimmers and lintel, wrap, sill flashing, packers, window and glass, fixing screws, head gap and the brick sill', floor: -0.55, gridSize: 3,
    camera: { pos: [1.5, 0.75, 1.95], target: [-0.1, 0.3, 0] },
    build(kit) {
      const { box, rod, ghost } = kit, m = MAT(kit);
      // opening: z -0.45 to 0.45, y 0 (top of the sill trimmer) to 0.8 (underside of the frame lintel)
      const frame = grp(box(0.09, 0.845, 0.045, m.timber, -0.195, 0.3775, -0.4725), box(0.09, 0.845, 0.045, m.timber, -0.195, 0.3775, 0.4725), box(0.09, 0.045, 1.0, m.timber, -0.195, -0.0225, 0), box(0.09, 0.19, 1.0, m.timber, -0.195, 0.895, 0), box(0.09, 0.4, 0.045, m.timber, -0.195, -0.245, -0.2), box(0.09, 0.4, 0.045, m.timber, -0.195, -0.245, 0.2));
      const wrap = grp(box(0.002, 1.2, 0.3, m.foil, -0.147, 0.3, -0.6), box(0.002, 1.2, 0.3, m.foil, -0.147, 0.3, 0.6), box(0.002, 0.45, 0.9, m.foil, -0.147, -0.275, 0), box(0.002, 0.2, 0.9, m.foil, -0.147, 0.9, 0));
      const tray = box(0.15, 0.003, 0.98, m.flash, -0.075, 0.0015, 0); tray.rotation.z = -0.07;
      const pan = grp(tray, box(0.003, 0.05, 0.98, m.flash, -0.148, 0.025, 0));
      const packers = grp(box(0.06, 0.005, 0.05, m.pack, -0.19, 0.0025, -0.3), box(0.06, 0.005, 0.05, m.pack, -0.19, 0.0025, 0.3)); for (const y of [0.2, 0.6]) for (const z of [-0.445, 0.445]) packers.add(box(0.05, 0.05, 0.01, m.pack, -0.19, y, z));
      const win = ringIn(kit, m.alu, grp(), 0.88, 0.005, 0.79, -0.185, 0.07); win.add(box(0.07, 0.74, 0.04, m.alu, -0.185, 0.4, 0));
      const glass = grp(box(0.006, 0.68, 0.38, m.glass, -0.185, 0.4, -0.22), box(0.006, 0.68, 0.38, m.glass, -0.185, 0.4, 0.22));
      const screws = grp(); for (const y of [0.2, 0.6]) for (const z of [-1, 1]) screws.add(rod([-0.185, y, z * 0.4], [-0.185, y, z * 0.475], 0.004, m.chrome, 6));
      const gap = grp(box(0.07, 0.01, 0.9, ghost(0x58a6ff, 0.5), -0.185, 0.795, 0));
      const bricks = grp(bricksIn(kit, -0.75, 0.75, -0.52, 0, 6), mortarBlock(kit, -0.75, 0.75, -0.52, -0.005));
      return { parts: [
        { id: 'frame', name: 'Frame trimmers, sill and lintel', group: frame, explode: [-0.6, 0, 0], anchor: [-0.195, 0.3, 0.4725], flag: 'T', spec: 'Typically 90 x 45 pine trimmers either side, a sill trimmer and a lintel member sized by the engineer.', desc: 'The frame carries the roof and floor loads over the opening. The window sits inside it and carries only its own weight.' },
        { id: 'wrap', name: 'Wall wrap', group: wrap, explode: [-0.32, 0, 0], anchor: [-0.147, 0.7, -0.6], flag: 'C', spec: 'Folded into the opening and lapped over the flashing upstand, as the maker shows.', desc: 'It sheds water that gets behind the brick. The top sheet laps over the sill flashing so water runs onto it, not behind it.' },
        { id: 'pan', name: 'Sill flashing tray', group: pan, explode: [0.05, 0.3, 0], anchor: [-0.075, 0.01, 0.35], flag: 'V', src: 'nccMas57', spec: 'From Step 6: at least 150 mm past the reveals, smooth and not sagging, sloped slightly to the outside.', desc: 'It carries water that runs down the window out to the face of the wall, where the weepholes let it drain.' },
        { id: 'packers', name: 'Packers', group: packers, explode: [-0.14, -0.15, 0], anchor: [-0.19, 0.0025, 0.3], flag: 'V', src: 'nccWin82', spec: 'Along each side and the bottom, fixed in place and clear of any flashing material.', desc: 'They hold the window straight and square in the opening while it is fixed, and set the clear gaps round it.' },
        { id: 'win', name: 'Window frame', group: win, explode: [0.35, 0, 0], anchor: [-0.185, 0.77, 0.3], flag: 'T', spec: 'Aluminium, timber or uPVC frame sized 10 mm under the opening each side. Typical depth 70 mm.', desc: 'The frame is made to the window schedule. It is fixed to the trimmers through the jambs and stays square only if the packers are right.' },
        { id: 'glass', name: 'Glass', group: glass, explode: [0.62, 0, 0], anchor: [-0.185, 0.4, -0.22], flag: 'V', src: 'nccGlaz84', spec: 'Glass type and thickness are set by the energy report and Part 8.4. Safety glass is marked.', desc: 'The glass is set in the frame by the maker. Its type decides the window\'s U-value and SHGC and whether it must be safety glass.' },
        { id: 'screws', name: 'Fixing screws', group: screws, explode: [0.12, 0.3, 0], anchor: [-0.185, 0.6, 0.45], flag: 'C', spec: 'Maker\'s screws at the maker\'s spacing, through the jambs into the trimmers.', desc: 'The jambs are fixed to the trimmer studs. Fixings must not pull the frame out of square.' },
        { id: 'gap', name: 'Head gap (ghost)', group: gap, explode: [0.62, 0.12, 0], anchor: [-0.185, 0.795, 0], flag: 'V', src: 'nccWin82', spec: 'At least 10 mm between the top of the window and loadbearing framing or masonry. It may be bigger over wide openings.', desc: 'The gap lets the lintel settle without loading the window. It is left empty and covered by the flashing and trim.' },
        { id: 'bricks', name: 'Bricks and sill below', group: bricks, explode: [0.8, -0.1, 0], anchor: [0.0, -0.3, -0.5], flag: 'T', spec: 'Normal running-bond courses under a sloping sill brick, from Step 6.', desc: 'The brick leaf closes round the window. The sloping sill brick throws rain clear of the wall under it.' },
      ] };
    },
  },

  jamb: {
    title: 'Window jamb in plan', sub: 'Brick reveal, cavity, wrap, trimmer and king stud, packer, screw, window jamb, backing rod and sealant (sealant gap drawn wider than real)', floor: -0.02, gridSize: 3,
    camera: { pos: [0.5, 0.62, 0.8], target: [-0.13, 0.1, 0.0] },
    build(kit) {
      const { box, rod, cyl, ghost } = kit, m = MAT(kit);
      // opening edge at z = 0, the opening is z > 0; a 0.25 m slice of the wall, y from 0 to 0.25
      const lining = grp(box(0.01, 0.25, 0.62, m.plaster, -0.245, 0.125, -0.31), box(0.015, 0.25, 0.06, m.timber, -0.2575, 0.125, 0.03));
      const frame = grp(box(0.09, 0.25, 0.045, m.timber, -0.195, 0.125, -0.0225), box(0.09, 0.25, 0.045, m.timber, -0.195, 0.125, -0.0675), box(0.09, 0.25, 0.045, m.timber, -0.195, 0.125, -0.5));
      const wrap = grp(box(0.002, 0.25, 0.62, m.foil, -0.147, 0.125, -0.31), box(0.09, 0.25, 0.002, m.foil, -0.195, 0.125, 0.001));
      const packer = grp(box(0.05, 0.05, 0.01, m.pack, -0.185, 0.125, 0.005)); const sc = rod([-0.185, 0.125, 0.045], [-0.185, 0.125, -0.045], 0.0045, m.chrome, 6); packer.add(sc);
      const jambF = grp(box(0.07, 0.25, 0.05, m.alu, -0.185, 0.125, 0.035), box(0.006, 0.25, 0.14, m.glass, -0.185, 0.125, 0.15));
      const seal = grp(rod([-0.1575, 0, 0.005], [-0.1575, 0.25, 0.005], 0.0045, mat0(kit, 0xe8d9a8), 8), box(0.008, 0.25, 0.012, m.seal, -0.146, 0.125, 0.005));
      const bricks = grp(bricksIn(kit, -0.6, 0, 0.0, 0, 3), mortarBlock(kit, -0.6, 0, 0.0, 0.258));
      const cavity = grp(box(0.04, 0.25, 0.6, ghost(0x58a6ff, 0.28), -0.13, 0.125, -0.3));
      const ties = grp(tieAt(kit, 0.12, -0.12));
      return { parts: [
        { id: 'lining', name: 'Internal lining and trim', group: lining, explode: [-0.33, 0, 0], anchor: [-0.245, 0.2, -0.3], flag: 'T', spec: '10 mm plasterboard on the inside of the frame, with an architrave or reveal trim at the window.', desc: 'The lining closes the inside of the wall. The window frame is fixed before it goes on.' },
        { id: 'frame', name: 'Trimmer, king stud and stud', group: frame, explode: [-0.18, 0, 0], anchor: [-0.195, 0.2, -0.0675], flag: 'T', spec: 'Trimmer stud beside the opening, king stud next to it, studs at 450 mm.', desc: 'The trimmer is what the window is fixed to. The king stud carries the lintel load past the opening.' },
        { id: 'wrap', name: 'Wall wrap, turned into the opening', group: wrap, explode: [-0.08, 0.0, 0.06], anchor: [-0.147, 0.2, -0.3], flag: 'C', spec: 'Wrap on the frame, folded into the reveal and lapped to the window maker\'s flashing tape.', desc: 'The turned edge stops water running behind the window frame at the jamb.' },
        { id: 'ties', name: 'Wall tie beside the opening', group: ties, explode: [0.0, 0.12, 0], anchor: [-0.13, 0.12, -0.12], flag: 'C', spec: 'Ties are kept close to the opening. Confirm spacing in the NCC figures.', desc: 'The tie holds the brick next to the reveal back to the frame.' },
        { id: 'packer', name: 'Packer and fixing screw', group: packer, explode: [0.0, 0.12, -0.12], anchor: [-0.185, 0.15, 0.005], flag: 'V', src: 'nccWin82', spec: 'Packing along each side, fixed in place, clear of any flashing; a screw through the jamb into the trimmer.', desc: 'The packer sets the 10 mm clear gap and keeps the jamb straight while the screw pulls it to the trimmer.' },
        { id: 'jamb', name: 'Window jamb and glass edge', group: jambF, explode: [0.06, 0.0, 0.18], anchor: [-0.185, 0.2, 0.035], flag: 'T', spec: 'Aluminium jamb about 70 mm deep. The glass sits in a rebate and is held by a bead or gasket.', desc: 'The jamb is the part of the window that sits against the opening. Its outer face is where the sealant bonds.' },
        { id: 'seal', name: 'Backing rod and sealant', group: seal, explode: [0.27, 0.12, 0.12], anchor: [-0.146, 0.2, 0.005], flag: 'C', spec: 'Closed-cell backing rod, then flexible sealant to the maker\'s data, in a gap about 10 mm wide.', desc: 'The rod sets the depth of the sealant and lets it stretch. The sealant is a weather seal that needs maintenance, not the main barrier.' },
        { id: 'bricks', name: 'Brick reveal', group: bricks, explode: [0.33, 0.0, -0.12], anchor: [0.0, 0.1, -0.3], flag: 'T', spec: 'Brick leaf ends at the opening. The window is set behind it in the frame plane.', desc: 'The brick returns round the opening, so you see a reveal about 150 mm deep from outside.' },
        { id: 'cavity', name: 'Cavity (ghost)', group: cavity, explode: [0.12, 0.0, -0.06], anchor: [-0.13, 0.2, -0.3], flag: 'V', src: 'nccMas57', spec: 'Typically 40 mm; at least 25 mm clear and no more than 75 mm for veneer.', desc: 'The air gap lets water drain down to the flashing and out. The wrap and ties cross it, but nothing should block it.' },
      ] };
    },
  },

  door: {
    title: 'External door and threshold', sub: 'Slab edge, DPC, trimmers and door frame, wrap, sill pan, threshold, door leaf, bottom seal, hinges, deadlock and strike plate', floor: -0.15, gridSize: 3,
    camera: { pos: [1.5, 0.75, 2.0], target: [-0.1, 0.4, 0] },
    build(kit) {
      const { box, cyl } = kit, m = MAT(kit);
      // door opening z -0.46 to 0.46, slab top at y = 0, door leaf lower 1.2 m shown
      const slab = grp(box(0.55, 0.15, 1.3, m.conc, -0.275, -0.075, 0));
      const dpc = grp(box(0.17, 0.004, 0.19, m.dark, -0.075, 0.002, -0.555), box(0.17, 0.004, 0.19, m.dark, -0.075, 0.002, 0.555));
      const frame = grp(box(0.09, 1.25, 0.045, m.timber, -0.195, 0.625, -0.4825), box(0.09, 1.25, 0.045, m.timber, -0.195, 0.625, 0.4825), box(0.09, 1.2, 0.035, m.timber, -0.195, 0.6, -0.4425), box(0.09, 1.2, 0.035, m.timber, -0.195, 0.6, 0.4425));
      const wrap = grp(box(0.002, 1.2, 0.245, m.foil, -0.147, 0.6, -0.6275), box(0.002, 1.2, 0.245, m.foil, -0.147, 0.6, 0.6275));
      const pan = grp(box(0.21, 0.003, 0.96, m.flash, -0.105, 0.0015, 0), box(0.003, 0.05, 0.96, m.flash, -0.2085, 0.025, 0), box(0.21, 0.05, 0.003, m.flash, -0.105, 0.025, -0.48), box(0.21, 0.05, 0.003, m.flash, -0.105, 0.025, 0.48), box(0.003, 0.05, 0.96, m.flash, 0.0, -0.025, 0));
      const thresh = grp(box(0.16, 0.02, 0.9, mat0(kit, 0xaeb4ba, { metalness: 0.6, roughness: 0.4 }), -0.1, 0.013, 0));
      const leaf = grp(box(0.04, 1.15, 0.82, m.door, -0.17, 0.6, 0));
      const seal = grp(box(0.03, 0.02, 0.82, m.dark, -0.17, 0.035, 0));
      const hinges = grp(box(0.015, 0.1, 0.02, m.chrome, -0.14, 0.2, -0.42), box(0.015, 0.1, 0.02, m.chrome, -0.14, 0.95, -0.42));
      const lock = grp(box(0.03, 0.18, 0.04, m.chrome, -0.17, 0.9, 0.39)); const cy = cyl(0.024, 0.02, m.chrome, -0.145, 0.78, 0.2, 18); cy.rotation.z = Math.PI / 2; lock.add(cy, box(0.05, 0.12, 0.004, m.chrome, -0.17, 0.9, 0.4265));
      const bricks = grp(bricksIn(kit, -0.95, -0.46, 0.013, 0, 6), bricksIn(kit, 0.46, 0.95, 0.013, 0, 6), mortarBlock(kit, -0.95, -0.46, 0.004, 0.53), mortarBlock(kit, 0.46, 0.95, 0.004, 0.53));
      return { parts: [
        { id: 'slab', name: 'Slab edge', group: slab, explode: [-0.28, 0, 0], anchor: [-0.3, -0.05, 0.62], flag: 'T', spec: 'Slab top is the finished-floor reference at the doorway. The bottom plate is cut across the opening.', desc: 'The door sits on the slab edge. The slab is 150 mm above the ground here, so there is a step down outside until the landing is built.' },
        { id: 'dpc', name: 'Damp-proof course', group: dpc, explode: [0.0, 0.1, 0], anchor: [-0.075, 0.004, 0.555], flag: 'V', src: 'nccMas57', spec: 'Continuous round the slab edge; it stops at the doorway where the sill pan takes over.', desc: 'The DPC stops ground moisture rising through the brick beside the door.' },
        { id: 'frame', name: 'Trimmers and door frame', group: frame, explode: [-0.55, 0, 0], anchor: [-0.195, 0.9, 0.4825], flag: 'T', spec: 'Trimmer studs beside the opening and timber jamb linings 35 mm thick, fixed plumb.', desc: 'The jamb linings give the leaf its stop and hinge line. They are packed and fixed to the trimmers like a window.' },
        { id: 'wrap', name: 'Wall wrap', group: wrap, explode: [-0.3, 0, 0], anchor: [-0.147, 0.7, 0.6275], flag: 'C', spec: 'Turned into the opening and lapped over the sill pan upturn.', desc: 'Water behind the brick runs down the wrap and onto the sill pan, not into the frame.' },
        { id: 'pan', name: 'Sill pan flashing', group: pan, explode: [0.05, 0.28, 0], anchor: [-0.105, 0.004, 0.3], flag: 'T', spec: 'Membrane or metal pan under the threshold, turned up at the back and ends and down over the slab edge.', desc: 'Any water that gets under the threshold drains to the outside, not into the slab edge or the frame.' },
        { id: 'thresh', name: 'Threshold', group: thresh, explode: [0.35, 0.25, 0], anchor: [-0.1, 0.023, -0.3], flag: 'T', spec: 'Aluminium or timber threshold, sloped to the outside, sealed to the pan.', desc: 'The threshold is the sill of the door. It must slope outward and be sealed so water cannot run in.' },
        { id: 'leaf', name: 'Door leaf', group: leaf, explode: [0.4, 0, 0], anchor: [-0.17, 0.6, 0.0], flag: 'T', spec: 'Typically 2040 x 820 mm solid or glazed leaf. Glass in a door must be Grade A safety glass.', desc: 'The leaf hangs on three hinges and closes against the stop. Check swing and clearances before the locks go on.' },
        { id: 'seal', name: 'Bottom seal', group: seal, explode: [0.6, -0.2, 0], anchor: [-0.17, 0.035, 0.2], flag: 'T', spec: 'Rubber or brush seal along the bottom of the leaf, sitting on the threshold.', desc: 'The seal keeps wind and rain out, and draughts, under the door.' },
        { id: 'hinges', name: 'Hinges', group: hinges, explode: [0.55, 0.0, -0.25], anchor: [-0.14, 0.95, -0.42], flag: 'T', spec: 'Typically three hinges per leaf, fixed into the jamb lining.', desc: 'The hinge side carries the weight. Loose or sagging hinges are the usual cause of a door that will not lock.' },
        { id: 'lock', name: 'Deadlock and strike plate', group: lock, explode: [0.8, 0.0, 0.2], anchor: [-0.17, 0.9, 0.39], flag: 'T', spec: 'Keyed deadlock in the latch edge, with a strike plate in the jamb. Check the NCC egress rules before choosing it.', desc: 'The deadlock is what makes the house secure at lock-up. The strike plate takes the bolt into solid timber.' },
        { id: 'bricks', name: 'Brick reveals', group: bricks, explode: [0.25, 0.0, 0.0], anchor: [0.0, 0.3, -0.7], flag: 'T', spec: 'Brick leaf either side, from Step 6.', desc: 'The brick returns at the sides of the doorway. The door frame sits behind them.' },
      ] };
    },
  },

  glazing: {
    title: 'Glass and human impact', sub: 'Door with a side panel, glass near the floor and zones where Part 8.4 asks for safety glass, an opaque band and a safety label', floor: 0, gridSize: 3,
    camera: { pos: [3.7, 1.15, 0.2], target: [0, 1.0, 0.15] },
    build(kit) {
      const { box, ghost, textPlane } = kit, m = MAT(kit);
      // door leaf z -1.1 to -0.28; side panel z -0.25 to 0.25; window z 0.5 to 1.5; floor y = 0
      const leaf = grp(box(0.045, 2.04, 0.1, m.timber, 0, 1.02, -1.05), box(0.045, 2.04, 0.1, m.timber, 0, 1.02, -0.33), box(0.045, 0.1, 0.72, m.timber, 0, 1.99, -0.69), box(0.045, 0.45, 0.72, m.timber, 0, 0.225, -0.69), box(0.045, 0.08, 0.72, m.timber, 0, 1.0, -0.69));
      const dglass = grp(box(0.012, 0.9, 0.52, m.glass, 0, 1.5, -0.69), box(0.012, 0.4, 0.52, m.glass, 0, 0.6, -0.69));
      const side = grp(box(0.03, 0.04, 0.5, m.alu, 0, 0.02, 0), box(0.03, 0.04, 0.5, m.alu, 0, 2.02, 0), box(0.03, 2.04, 0.03, m.alu, 0, 1.02, -0.235), box(0.03, 2.04, 0.03, m.alu, 0, 1.02, 0.235), box(0.012, 2.0, 0.44, m.glass, 0, 1.02, 0));
      const win = grp(); ringIn(kit, m.alu, win, 1.0, 0.3, 1.9, 0, 0.04, 1.0); win.add(box(0.008, 1.5, 0.9, m.glass, 0, 1.1, 1.0));
      const z300 = grp(box(0.02, 2.04, 0.3, ghost(0xff9800, 0.3), 0.035, 1.02, -0.13)), z500 = grp(box(0.02, 0.5, 1.0, ghost(0xff9800, 0.3), 0.03, 0.25, 1.0));
      const band = grp(box(0.014, 0.025, 0.44, mat0(kit, 0xf2f5f7, { roughness: 0.5 }), 0.02, 0.93, 0));
      const lab = textPlane(['SAFETY GLASS', 'standard · supplier', 'grade · thickness · type'], 0.2, 0.1); lab.rotation.y = Math.PI / 2; lab.position.set(0.024, 0.14, 0.12); const label = grp(lab);
      return { parts: [
        { id: 'leaf', name: 'Door leaf frame', group: leaf, explode: [-0.2, 0, 0], anchor: [0, 1.0, -1.05], flag: 'T', spec: 'Timber or aluminium stiles and rails, 820 mm wide. The glass is fixed in a rebate.', desc: 'The leaf frame holds the glass. Glass in a door must be Grade A safety glass, with a few listed exceptions.' },
        { id: 'dglass', name: 'Door glass', group: dglass, explode: [0.25, 0, 0], anchor: [0, 1.5, -0.69], flag: 'V', src: 'nccGlaz84', spec: 'Table 8.4.2: toughened 3 mm up to 1 m², 4 mm up to 2 m², 5 mm up to 3 m², 6 mm up to 4 m²; laminated 5.38 mm up to 2.2 m², 6.38 mm up to 3 m², 8.38 mm up to 5 m².', desc: 'The thickness needed depends on the glass type and the pane\'s area. Safety glass breaks safely or stays together when hit.' },
        { id: 'side', name: 'Side panel', group: side, explode: [0.0, 0, 0.0], anchor: [0, 1.5, 0.235], flag: 'V', src: 'nccGlaz84', spec: 'A panel with a sight line under 300 mm from the doorway edge is covered by Part 8.4.3.', desc: 'A panel right beside a door is easy to walk or fall into, so it is treated like the door.' },
        { id: 'z300', name: '300 mm zone (ghost)', group: z300, explode: [0.5, 0, 0], anchor: [0.035, 1.8, -0.13], flag: 'V', src: 'nccGlaz84', spec: 'Measured from the edge of the doorway.', desc: 'Glass inside this zone must meet the door-glass rules in Table 8.4.2.' },
        { id: 'win', name: 'Window near the floor', group: win, explode: [0.0, 0, 0.1], anchor: [0, 1.7, 1.0], flag: 'V', src: 'nccGlaz84', spec: 'Sight line under 500 mm above the floor: Grade A safety glass, or annealed glass at least 5 mm thick if the pane is 1.2 m² or less.', desc: 'A low window can be walked into or fallen onto. The lower 500 mm is where a fall or a push is most likely to hit.' },
        { id: 'z500', name: '500 mm zone (ghost)', group: z500, explode: [0.5, 0, 0.1], anchor: [0.03, 0.25, 1.0], flag: 'V', src: 'nccGlaz84', spec: 'The sight line is measured above the finished floor.', desc: 'Glass in this zone needs one of the Part 8.4.5 options.' },
        { id: 'band', name: 'Opaque band', group: band, explode: [0.7, 0, 0], anchor: [0.02, 0.93, 0.0], flag: 'V', src: 'nccGlaz84', spec: 'At least 20 mm high, with the upper edge at least 700 mm and the lower edge no more than 1.2 m above the floor.', desc: 'A band or frosting makes a full-height pane visible so nobody walks through it thinking it is an opening.' },
        { id: 'label', name: 'Safety-glass mark', group: label, explode: [0.8, 0.1, 0], anchor: [0.024, 0.14, 0.12], flag: 'V', src: 'nccGlaz84', spec: 'Etched or a non-reusable label stating the standard, supplier, grade, thickness and type.', desc: 'The mark lets the surveyor see that the pane is safety glass. A paper label that peels off does not count.' },
      ] };
    },
  },

  garage: {
    title: 'Sectional garage door', sub: 'Frame opening, steel panels, vertical and horizontal tracks, torsion spring, opener, safety sensors and seals', floor: -0.15, gridSize: 4,
    camera: { pos: [3.4, 1.6, 3.3], target: [-0.7, 1.0, 0] },
    build(kit) {
      const { box, rod } = kit, m = MAT(kit);
      const slab = grp(box(0.55, 0.15, 3.1, m.conc, -0.275, -0.075, 0));
      const frame = grp(box(0.09, 2.2, 0.09, m.timber, -0.195, 1.1, -1.25), box(0.09, 2.2, 0.09, m.timber, -0.195, 1.1, 1.25), box(0.09, 0.3, 2.6, m.timber, -0.195, 2.25, 0));
      const panels = grp(); for (let i = 0; i < 4; i++) panels.add(box(0.04, 0.515, 2.36, m.steel, -0.12, 0.2625 + i * 0.525, 0), box(0.05, 0.02, 2.36, m.dark, -0.12, 0.525 + i * 0.525, 0));
      const vtrack = grp(box(0.05, 2.1, 0.04, m.steel, -0.17, 1.05, -1.2), box(0.05, 2.1, 0.04, m.steel, -0.17, 1.05, 1.2));
      const htrack = grp(); for (const z of [-1.2, 1.2]) htrack.add(rod([-0.17, 2.1, z], [-0.5, 2.18, z], 0.02, m.steel, 8), rod([-0.5, 2.18, z], [-2.4, 2.2, z], 0.02, m.steel, 8), rod([-1.0, 2.5, z], [-1.0, 2.2, z], 0.008, m.steel, 6), rod([-2.0, 2.5, z], [-2.0, 2.2, z], 0.008, m.steel, 6));
      const spring = grp(rod([-0.3, 2.4, -1.1], [-0.3, 2.4, 1.1], 0.03, mat0(kit, 0x8b1f1f, { metalness: 0.4, roughness: 0.5 }), 12), rod([-0.3, 2.4, -1.2], [-0.17, 2.1, -1.2], 0.004, m.steel, 5), rod([-0.3, 2.4, 1.2], [-0.17, 2.1, 1.2], 0.004, m.steel, 5));
      const opener = grp(rod([-0.4, 2.35, 0], [-2.3, 2.35, 0], 0.012, m.steel, 8), box(0.3, 0.2, 0.22, mat0(kit, 0xf1f2f3, { roughness: 0.5 }), -2.3, 2.3, 0), box(0.04, 0.12, 0.05, m.steel, -0.4, 2.3, 0));
      const eyes = grp(box(0.03, 0.06, 0.03, mat0(kit, 0xd33a2c, { roughness: 0.5 }), -0.15, 0.15, -1.33), box(0.03, 0.06, 0.03, mat0(kit, 0xd33a2c, { roughness: 0.5 }), -0.15, 0.15, 1.33));
      const seal = grp(box(0.05, 0.03, 2.36, m.dark, -0.12, 0.015, 0), box(0.04, 2.1, 0.02, m.dark, -0.12, 1.05, -1.19), box(0.04, 2.1, 0.02, m.dark, -0.12, 1.05, 1.19));
      return { parts: [
        { id: 'slab', name: 'Slab', group: slab, explode: [-0.3, 0, 0], anchor: [-0.3, -0.05, 1.2], flag: 'T', spec: 'Floor level inside the garage is often 20 to 40 mm below the house floor. The slab falls to the door so water runs out.', desc: 'The door sits on the slab edge. The door bottom seal needs a flat, level strip to seal against.' },
        { id: 'frame', name: 'Frame opening and header', group: frame, explode: [-0.7, 0, 0], anchor: [-0.195, 2.25, 1.0], flag: 'T', spec: 'Timber or steel jambs with a header sized by the engineer. The header carries the roof load over a 2.4 m opening.', desc: 'The header is a structural member, not just a trim. It also carries the tracks and the torsion spring.' },
        { id: 'panels', name: 'Steel panels', group: panels, explode: [0.3, 0, 1.8], anchor: [-0.12, 1.3, 0.9], flag: 'T', spec: 'Typically four insulated steel sections, 2400 wide by about 2100 high in total, with hinges between sections.', desc: 'The sections fold at the hinges as the door rises along the tracks.' },
        { id: 'vtrack', name: 'Vertical tracks', group: vtrack, explode: [-0.35, 0, 0], anchor: [-0.17, 1.2, -1.2], flag: 'T', spec: 'Steel, fixed to the jambs plumb and parallel, with rollers in the track.', desc: 'The rollers run in the track. Tracks out of plumb make the door bind or jump.' },
        { id: 'htrack', name: 'Horizontal tracks', group: htrack, explode: [-0.3, 0.3, 0], anchor: [-1.3, 2.2, 1.2], flag: 'T', spec: 'Slightly inclined, braced from the roof framing at the maker\'s spacing.', desc: 'The tracks guide the door into the roof space when it is open.' },
        { id: 'spring', name: 'Torsion spring', group: spring, explode: [-0.3, 0.4, 0], anchor: [-0.3, 2.4, 0.5], flag: 'T', spec: 'A wound spring on a shaft above the door, balanced to the door\'s weight. Adjust only with the right tools.', desc: 'The spring balances the door so a small motor or a hand can lift it. A broken spring is dangerous.' },
        { id: 'opener', name: 'Opener and rail', group: opener, explode: [0.0, 0.5, 0], anchor: [-2.3, 2.3, 0.0], flag: 'T', spec: 'Ceiling-mounted motor on a rail, with remotes. Follow the opener maker\'s installation guide.', desc: 'The motor drives the door along the rail. Safety reverse and sensors must be tested at handover.' },
        { id: 'eyes', name: 'Photo-eye sensors', group: eyes, explode: [0.35, 0, 0], anchor: [-0.15, 0.15, 1.33], flag: 'T', spec: 'About 150 mm above the floor each side, aimed at each other.', desc: 'If something breaks the beam while the door is closing, the door must stop and reverse.' },
        { id: 'seal', name: 'Seals', group: seal, explode: [0.35, 0, 0], anchor: [-0.12, 0.015, -0.9], flag: 'T', spec: 'Rubber bottom seal and jamb seals, adjusted so they just touch.', desc: 'The seals keep rain, wind and vermin out of the garage.' },
      ] };
    },
  },
};
function mat0(kit, color, o) { return kit.mat(color, o); }

/* ---------- 2D drawings ---------- */
function winSec() {
  const s = 640, body = [R(0, 0, 900, 640, 'd-bg')];
  const panel = (ox, oy) => ({ X: (d) => ox + s * d, Y: (y) => oy - s * y });
  { // head: y = 0 is the underside of the frame lintel and the steel lintel angle
    const { X, Y } = panel(110, 330);
    for (let k = 0; k < 3; k++) body.push(R(X(0), Y(0.013 + k * PITCH + 0.076), s * BT, s * 0.076, 'd-brick'));
    body.push(R(X(0.02), Y(0.008), s * 0.09, s * 0.008, 'd-steel'), R(X(0.11), Y(0.098), s * 0.008, s * 0.098, 'd-steel'), R(X(0.15), Y(0.19), s * 0.09, s * 0.19, 'd-timber'), L(X(0.136), Y(-0.32), X(0.136), Y(0.45), 'd-wrap'));
    body.push(pl([[X(0), Y(0.012)], [X(0.15), Y(0.012)], [X(0.15), Y(0.172)]]), R(X(0), Y(0.075), s * 0.06, s * 0.05, 'd-seal'));
    body.push(R(X(0.15), Y(-0.01), s * 0.07, s * 0.05, 'd-steel'), R(X(0.1815), Y(-0.06), s * 0.007, s * 0.24, 'd-glass'));
    body.push(dim(X(0.3), Y(0), X(0.3), Y(-0.01), '10 min', 1), dim(X(0.11), Y(0.34), X(0.15), Y(0.34), '40', 1));
    body.push(call(1, X(0.18), Y(-0.035), 330, 440), call(2, X(0.185), Y(-0.2), 330, 500), call(3, X(0.2), Y(-0.005), 340, 380), call(4, X(0.055), Y(0.004), 40, 150), call(5, X(0.07), Y(0.012), 40, 230), call(6, X(0.2), Y(0.1), 340, 100));
    body.push(T(40, 40, 'Head of a window (large scale)', { cls: 'd-bold' }));
  }
  { // sill: y = 0 is the top of the sill trimmer
    const { X, Y } = panel(560, 300);
    for (let k = 0; k < 3; k++) body.push(R(X(0), Y(-0.06 - k * PITCH), s * BT, s * 0.076, 'd-brick'));
    body.push(P([[X(-0.02), Y(-0.05)], [X(0.1), Y(-0.05)], [X(0.1), Y(0.004)], [X(-0.02), Y(-0.012)]], 'd-brick'), R(X(0.15), Y(0), s * 0.09, s * 0.045, 'd-timber'), R(X(0.15), Y(-0.045), s * 0.09, s * 0.25, 'd-timber'), L(X(0.136), Y(-0.3), X(0.136), Y(0.4), 'd-wrap'));
    body.push(pl([[X(-0.005), Y(-0.058)], [X(0.15), Y(-0.04)], [X(0.15), Y(0.02)]]));
    body.push(R(X(0.15), Y(0.055), s * 0.07, s * 0.05, 'd-steel'), R(X(0.1815), Y(0.355), s * 0.007, s * 0.3, 'd-glass'), R(X(0.16), Y(0.005), s * 0.05, 3, 'd-seal'));
    body.push(call(1, X(0.18), Y(0.03), 840, 200), call(2, X(0.185), Y(0.25), 840, 130), call(3, X(0.185), Y(0.003), 840, 270), call(4, X(0.08), Y(-0.048), 500, 380), call(5, X(0.05), Y(-0.03), 500, 330), call(6, X(0.2), Y(-0.15), 840, 340));
    body.push(T(490, 40, 'Sill of a window (large scale)', { cls: 'd-bold' }));
  }
  body.push(T(40, 560, 'Head: 1 window head member  2 glass  3 10 mm gap under the frame lintel  4 steel lintel angle  5 head flashing  6 frame lintel', { cls: 'd-mute' }), T(40, 582, 'Sill: 1 window sill member  2 glass  3 packer, clear of the flashing  4 sill flashing  5 sloping sill brick  6 frame sill trimmer', { cls: 'd-mute' }), T(40, 612, 'Real sizes at 640 px per metre. The window sits in the frame opening behind the brick, with at least 10 mm clear at the head (NCC Part 8.2).', { cls: 'd-mute' }));
  return svg(900, 640, body.join(''), 'Window head and sill');
}

function jambPlan() {
  const s = 900, ox = 560, oy = 130, X = (u) => ox + s * u, Y = (d) => oy + s * d, body = [R(0, 0, 900, 620, 'd-bg')];
  // outside is at the top; the wall is to the left of the opening edge (u = 0), the opening is to the right
  body.push(R(X(-0.6), Y(0), s * 0.6, s * BT, 'd-brick'));
  for (const u of [-0.48, -0.24, -0.0]) body.push(L(X(u), Y(0), X(u), Y(BT), 'd-line'));
  body.push(R(X(-0.045), Y(0.15), s * 0.045, s * 0.09, 'd-timber'), R(X(-0.09), Y(0.15), s * 0.045, s * 0.09, 'd-timber'), R(X(-0.52), Y(0.15), s * 0.045, s * 0.09, 'd-timber'), R(X(-0.6), Y(0.24), s * 0.6, s * 0.01, 'd-board'));
  body.push(pl([[X(-0.6), Y(0.136)], [X(0), Y(0.136)], [X(0), Y(0.24)]], 'd-wrap'));
  body.push(R(X(0.01), Y(0.15), s * 0.05, s * 0.07, 'd-steel'), R(X(0.06), Y(0.1815), s * 0.14, s * 0.007, 'd-glass'), R(X(0), Y(0.165), s * 0.01, s * 0.05, 'd-seal'), L(X(-0.05), Y(0.185), X(0.035), Y(0.185), 'd-memb'));
  body.push(R(X(0), Y(0.147), s * 0.01, s * 0.012, 'd-seal'), C0(X(0.005), Y(0.1575), 4));
  body.push(L(X(-0.6), Y(0.11), X(0), Y(0.11), 'd-cut'), L(X(-0.6), Y(0.15), X(0), Y(0.15), 'd-cut'));
  body.push(dim(X(-0.64), Y(0), X(-0.64), Y(0.25), 'about 250 overall', -1), dim(X(0.0), Y(0.28), X(0.01), Y(0.28), '10', 1));
  body.push(call(1, X(-0.3), Y(0.055), 160, 80), call(2, X(-0.3), Y(0.13), 160, 150), call(3, X(-0.3), Y(0.136), 160, 220), call(4, X(-0.07), Y(0.195), 160, 300), call(5, X(0.005), Y(0.19), 760, 300), call(6, X(0.0), Y(0.185), 760, 370), call(7, X(0.035), Y(0.17), 760, 440), call(8, X(0.13), Y(0.185), 760, 210), call(9, X(0.005), Y(0.153), 760, 120), call(10, X(-0.3), Y(0.245), 160, 380));
  body.push(T(40, 40, 'Window jamb in plan (large scale)', { cls: 'd-bold' }), T(660, 40, 'Outside', { cls: 'd-mute' }), T(660, 600, 'Inside', { cls: 'd-mute' }));
  body.push(T(40, 520, '1 brick reveal  2 cavity  3 wall wrap turned into the opening  4 trimmer and king stud  5 packer, clear of the flashing  6 fixing screw', { cls: 'd-mute' }), T(40, 542, '7 window jamb  8 glass  9 backing rod and flexible sealant  10 internal lining', { cls: 'd-mute' }), T(40, 572, 'Real sizes at 900 px per metre. Fixing type, spacing and the sealant gap come from the window maker\'s installation guide.', { cls: 'd-mute' }));
  return svg(900, 620, body.join(''), 'Window jamb in plan');
}
const C0 = (x, y, r) => `<circle cx="${x}" cy="${y}" r="${r}" class="d-seal"/>`;

function glazDwg() {
  const s = 190, gy = 500, Y = (m) => gy - s * m, body = [R(0, 0, 900, 620, 'd-bg')];
  body.push(L(20, gy, 880, gy, 'd-ground'));
  { // A: door with a side panel
    const ox = 40;
    body.push(R(ox, Y(2.04), s * 0.82, s * 2.04, 'd-timber'), R(ox + s * 0.14, Y(1.9), s * 0.54, s * 0.95, 'd-glass'), R(ox + s * 0.14, Y(0.9), s * 0.54, s * 0.4, 'd-glass'), R(ox + s * 0.85, Y(2.04), s * 0.5, s * 2.04, 'd-glass'), R(ox + s * 0.82, Y(2.04), s * 0.3, s * 2.04, 'd-hatch'));
    body.push(dim(ox + s * 0.82, Y(2.1), ox + s * 1.12, Y(2.1), '300', 1), T(ox, Y(2.04) - 34, 'A  Door and side panel', { cls: 'd-bold' }), T(ox, Y(2.04) - 18, 'Part 8.4.3: within 300 mm of the doorway', { cls: 'd-mute' }));
  }
  { // B: window near the floor
    const ox = 345;
    body.push(R(ox, Y(1.8), s * 1.2, s * 1.5, 'd-glass'), R(ox, Y(0.5), s * 1.2, s * 0.2, 'd-hatch'), L(ox - 10, Y(0.5), ox + s * 1.2 + 10, Y(0.5), 'd-cut'));
    body.push(dim(ox - 14, Y(0), ox - 14, Y(0.5), '500', -1), dim(ox - 14, Y(0.5), ox - 14, Y(0.3), '', -1), T(ox, Y(2.04) - 34, 'B  Glass near the floor', { cls: 'd-bold' }), T(ox, Y(2.04) - 18, 'Part 8.4.5: sight line under 500 mm', { cls: 'd-mute' }));
  }
  { // C: full-height glass with a band
    const ox = 640;
    body.push(R(ox, Y(2.1), s * 1.2, s * 2.1, 'd-glass'), R(ox, Y(0.925), s * 1.2, Math.max(3, s * 0.025), 'd-steel'), L(ox - 10, Y(0.7), ox + s * 1.2 + 10, Y(0.7), 'd-cut'), L(ox - 10, Y(1.2), ox + s * 1.2 + 10, Y(1.2), 'd-cut'));
    body.push(dim(ox + s * 1.2 + 14, Y(0.7), ox + s * 1.2 + 14, Y(1.2), 'band between 700 and 1200', 1), T(ox, Y(2.04) - 34, 'C  Full-height glass', { cls: 'd-bold' }), T(ox, Y(2.04) - 18, 'Part 8.4.7: opaque band', { cls: 'd-mute' }));
  }
  const foot = ['Door glass (Table 8.4.2): toughened 3 mm up to 1 m², 4 mm up to 2 m², 5 mm up to 3 m², 6 mm up to 4 m².', 'Laminated 5.38 mm up to 2.2 m², 6.38 mm up to 3 m², 8.38 mm up to 5 m². Annealed 5 mm up to 0.3 m², 6 mm up to 0.9 m².', 'Orange areas are where the Part 8.4 rules apply. The band must be at least 20 mm high. Safety glass is marked by etching or a non-reusable label (8.4.8).', 'The exceptions in 8.4.4 and the NCC 2025 clause numbers were not checked. Elevations are drawn at 190 px per metre.'];
  foot.forEach((t, i) => body.push(T(40, 540 + i * 19, t, { cls: 'd-mute' })));
  return svg(900, 620, body.join(''), 'Glazing human impact zones');
}

function doorSec() {
  const s = 640, ox = 130, oy = 400, X = (d) => ox + s * d, Y = (y) => oy - s * y, body = [R(0, 0, 900, 640, 'd-bg')];
  // vertical section through the door centre; outside on the left, y = 0 is the top of the slab
  body.push(R(X(0), Y(0), s * 0.55, s * 0.15, 'd-conc'), L(X(-0.2), Y(-0.15), X(0), Y(-0.15), 'd-ground'), R(X(0.25), Y(0.02), s * 0.3, 4, 'd-board'));
  body.push(R(X(0.04), Y(0.02), s * 0.17, s * 0.02, 'd-steel'), R(X(0.15), Y(0.5), s * 0.045, s * 0.46, 'd-timber'), R(X(0.15), Y(0.035), s * 0.045, s * 0.01, 'd-seal'));
  body.push(pl([[X(0), Y(-0.05)], [X(0), Y(0.003)], [X(0.21), Y(0.003)], [X(0.21), Y(0.06)]]), R(X(0.21), Y(0.5), s * 0.09, s * 0.5, 'd-timber'));
  body.push(dim(X(-0.06), Y(-0.15), X(-0.06), Y(0), '150 step', -1), call(1, X(0.1), Y(0.03), 40, 120), call(2, X(0.1), Y(0.003), 40, 220), call(3, X(0.17), Y(0.3), 420, 110), call(4, X(0.17), Y(0.04), 620, 430), call(5, X(0.2), Y(-0.07), 620, 500), call(6, X(0.255), Y(0.3), 700, 140));
  body.push(T(40, 40, 'Door threshold section (large scale, typical)', { cls: 'd-bold' }), T(40, 545, '1 threshold, sloped to the outside  2 sill pan, up at the back and down over the slab edge', { cls: 'd-mute' }), T(40, 566, '3 door leaf  4 bottom seal  5 slab edge  6 door frame jamb lining', { cls: 'd-mute' }), T(40, 596, 'Outside is on the left. Real sizes at 640 px per metre. Follow the door maker\'s threshold and sill pan detail, which was not read here.', { cls: 'd-mute' }));
  return svg(900, 640, body.join(''), 'Door threshold section');
}

const drawings = [
  { id: 'winsec', title: 'Window head and sill', scale: 'Large scale, 640 px per metre', svg: winSec(),
    notes: ['The head and sill of a window at real size: window frame, glass, packer, head gap, flashings, steel lintel and sloping sill brick. Callout numbers match the key.', 'The window sits in the frame opening behind the brick. At least 10 mm is left clear between the top of the window and the lintel above (NCC Part 8.2).', 'The sill flashing carries water out to the face. The window maker\'s installation guide governs the fixing and the sealant.'] },
  { id: 'jamb', title: 'Window jamb in plan', scale: 'Large scale, 900 px per metre', svg: jambPlan(),
    notes: ['A section from above through the jamb: brick reveal, cavity, wrap, trimmer, packer, screw, window jamb, backing rod and sealant.', 'Packers go along each side and the bottom, fixed in place and clear of any flashing (NCC Part 8.2). The sealant is the outer weather seal, with the wrap and flashings behind it.', 'The sealant gap is drawn at 10 mm so it can be read. Real gaps and fixing are the window maker\'s.'] },
  { id: 'glaz', title: 'Glazing human impact', scale: 'Elevations, 190 px per metre', svg: glazDwg(),
    notes: ['Where Part 8.4 asks for safety glass: a door and the panel next to it, glass near the floor, and large panes that need a visible band.', 'The Table 8.4.2 sizes are for door glass. Wet area glass has its own table (8.4.6). The marking rule is in 8.4.8.', 'These figures come from the ABCB\'s NCC 2022 web page. NCC 2025 applies in Victoria from 1 May 2026, so check the clause numbers and values against that edition.'] },
  { id: 'doorsec', title: 'Door threshold', scale: 'Large scale, 640 px per metre', svg: doorSec(),
    notes: ['A section through the bottom of an external door: threshold, sill pan, leaf, bottom seal and slab edge.', 'The sill pan turns up at the back and ends and down over the slab edge, so water under the threshold drains outside.', 'This is a typical arrangement. The door maker\'s threshold and sill pan detail governs.'] },
];

/* ---------- study content ---------- */
const howto = [
  ['Check the window and door schedule against the plans', 'Compare every size, frame colour, glass type and opening style with the permit documents and the energy report before ordering. A substitution goes back to the designer and rater.', 'Builder', 'T'],
  ['Order and check the delivery', 'Ask for rated U-value and SHGC, glass type for each pane, finishes, hardware and lead time. On delivery check each unit against the order, keep the film on and stand them upright, dry and off wet ground.', 'Builder', 'C', 'yourHomeGlaz'],
  ['Check the openings', 'Measure width, height and diagonals. The sill trimmer must be level and the wrap folded into the opening. Sill flashing from Step 6 should sit smooth.', 'Builder and carpenter', 'V', 'nccWin82'],
  ['Prepare the sill', 'Isolate aluminium from masonry and mortar with an isolating material. Fix the packers along the sides and bottom, clear of the flashing.', 'Window installer', 'V', 'nccWin82'],
  ['Set the window', 'Lift the window in, check plumb, level and square (equal diagonals) and keep a 10 mm gap at the head. Do not let the lintel load the window.', 'Window installer', 'V', 'nccWin82'],
  ['Fix the window', 'Fix through the jambs into the trimmers with the maker\'s screws and spacing, checking the frame stays square.', 'Window installer', 'C', 'nccWin82'],
  ['Flash and seal', 'Lap the wrap over the sill flashing, turn it into the opening, fit backing rod and flexible sealant round the frame, and leave every weephole open.', 'Window installer and bricklayer', 'C', 'bradFlash'],
  ['Hang the external doors', 'Fix door frames plumb on a sill pan, hang the leaf on its hinges, fit the bottom seal and check swing and clearances. Glazed doors follow Part 8.2 and 8.4.', 'Carpenter or door installer', 'V', 'nccWin82'],
  ['Check glass against Part 8.4', 'Look at each pane: door glass, side panels, glass below 500 mm, wet areas and big panes. Check the thickness against the tables, the band on large panes and the safety mark.', 'Builder', 'V', 'nccGlaz84'],
  ['Fit locks and the garage door', 'Fit deadlocks and window latches, store the keys and fit the garage door and its opener, testing the sensors and the safety reverse.', 'Carpenter, locksmith and garage door installer', 'T'],
  ['Check lock-up, photograph and record', 'Close and lock every opening. Photograph the flashings, sealant and glass labels. Check your contract\'s own lock-up conditions before claiming payment.', 'Builder', 'C', 'cavPay'],
];

const trades = [
  { t: 'Window and door maker or supplier', role: 'Makes windows and external doors to the schedule, supplies glass, hardware and usually the installation guide and warranty.', when: 'Order as soon as the frame is inspected, since lead times can be many weeks', reg: 'Manufacturer. Ask for rated U-value and SHGC and the glass type.', ask: ['Price per unit and for the whole schedule', 'Rated U-value and SHGC, and the glass type and thickness per pane', 'Lead time, delivery, and supply only or supply and install', 'Warranty and installation guide'] },
  { t: 'Window installer', role: 'Sets, packs, fixes, flashes and seals windows. Often the maker\'s own installer or a carpenter.', when: 'After the brickwork and before the lining goes in', reg: 'Trade contractor with insurance (confirm any licence or registration requirement with the VBA)', ask: ['Supply and fix or fix only', 'Packers, flashing tape and sealant included', 'Who is liable for leaks at the frame'] },
  { t: 'Glazier', role: 'Cuts and fits glass, replaces broken panes and fits glass to doors and fixed panels.', when: 'When glass is supplied separately or something breaks on site', reg: 'Trade contractor with insurance', ask: ['Glass type, thickness and marking', 'Rate for replacement and site visits', 'Safety glass certificates'] },
  { t: 'Carpenter', role: 'Hangs doors, fits frames, jamb linings, hardware and trims.', when: 'Door frames at lock-up, rest at fit-out', reg: 'Trade contractor with insurance', ask: ['Hanging only or supply and hang', 'Hardware supplied by whom', 'Programme'] },
  { t: 'Garage door installer', role: 'Fits the garage door, tracks, spring and opener, and tests the safety reverse.', when: 'Once the garage opening and header are finished', reg: 'Supplier\'s installer', ask: ['Door and opener price and wind rating', 'Remotes and keypad included', 'Warranty and servicing'] },
  { t: 'Locksmith', role: 'Supplies and fits keyed locks, keys the house alike and records the key register.', when: 'At lock-up and again at handover', reg: 'Trade contractor', ask: ['Keyed alike or master key', 'Temporary locks until handover', 'Replacement keys and records'] },
  { t: 'Building surveyor (RBS)', role: 'Decides whether to inspect at lock-up and checks glazing and flashing against the permit documents.', when: 'During construction', reg: 'Registered building surveyor (BPC)', ask: ['Do they inspect flashings or glazing', 'What photographs they want at lock-up'] },
];

const materials = [
  ['Aluminium windows and sliding doors', 'Made to the schedule with rated U-value and SHGC and a stated glass type', 'Window maker. Get 2 to 3 quotes on the same schedule', 'C', 'Ask for the rating printout and keep it with the energy report.'],
  ['Timber or uPVC windows', 'Made to the schedule, often better U-values than single-glazed aluminium', 'Window maker', 'V', 'The Your Home guide says timber and uPVC insulate better than aluminium, and thermal breaks help aluminium.'],
  ['Safety glass', 'Toughened or laminated to Table 8.4.2 and marked with etch or a non-reusable label', 'Glazier or window maker', 'V', 'Check the thickness against the table for each pane.'],
  ['Packers', 'Plastic or hardwood shims that suit the frame, fixed so they do not move', 'Hardware supplier or Bunnings (confirm the range)', 'V', 'Keep clear of the flashing.'],
  ['Flashing tape and sill tray', 'Flexible or metal flashing in the window maker\'s system, with a wrap-compatible tape', 'Window maker or building supplier', 'C', 'Match the wrap and the flashing.'],
  ['Backing rod and flexible sealant', 'Closed-cell rod and a sealant the maker lists for the frame and brick', 'Sealant supplier or Bunnings trade desk', 'C', 'Match the rod size to the gap.'],
  ['External door set', 'Solid or glazed leaf with timber or aluminium frame and threshold, usually from a door maker', 'Door supplier or Bunnings trade desk (standard sizes, confirm range)', 'T', 'Glass in doors must be safety glass.'],
  ['Locks and handles', 'Keyed deadlocks for external doors, window latches', 'Locksmith or hardware supplier', 'T', 'Check egress rules before choosing.'],
  ['Sectional garage door and opener', 'Steel panels, tracks, torsion spring, opener and remotes, with a wind rating', 'Garage door supplier. Get 2 to 3 quotes', 'T', 'Ask for the wind rating and the safety features.'],
];

const quotes = [
  { who: 'Window and door maker', n: '3', what: ['The whole schedule priced the same way, with sizes and glass type for each unit', 'Rated U-value and SHGC and the WERS or AFRC listing', 'Supply only or supply and install, lead time and warranty'] },
  { who: 'Window installer', n: '2 to 3', what: ['Fix only or supply and fix', 'Flashing tape, packers and sealant included', 'Liability for leaks at the frame'] },
  { who: 'Garage door supplier', n: '3', what: ['Door, opener and remotes', 'Wind rating, safety features and warranty', 'Installation and servicing'] },
  { who: 'Door supplier', n: '2', what: ['Leaf, frame, threshold and hardware', 'Glass type and marking', 'Lead time'] },
  { who: 'Locksmith', n: '2', what: ['Keyed-alike deadlocks and window latches', 'Temporary locks and key register', 'Rekey and replacement keys'] },
  { who: 'Glazier', n: '2', what: ['Replacement of any broken pane on site', 'Safety glass and marking', 'Call-out rate'] },
];
const quoteTips = [
  'Send every window maker the same schedule and ask for a priced line for each unit. A low total that drops a unit or a glass upgrade is not a saving.',
  'Ask for the rated U-value and SHGC for each window and keep the printout. The energy report depends on those figures, and a different window can break the rating.',
  'Ask what glass is in each pane and whether it is safety glass. Part 8.4 decides the glass for doors, panels and low windows.',
  'Confirm in writing who supplies the packers, flashing tape and sealant, and who is liable for a leak at the frame.',
  'Check lead times before the frame is complete. Windows are made to order and the house cannot lock up without them.',
  'Keep every quote and order. They are evidence of estimating for the BPC application.',
];

const inspections = [
  ['Window and door schedule check', 'Builder', 'Before ordering', 'Sizes, glass type, rating and style against the permit documents and energy report.', 'T'],
  ['Delivery check', 'Builder', 'When windows arrive', 'Each unit against the order, damage, glass type and safety marks.', 'T'],
  ['Opening check', 'Builder', 'Before the window goes in', 'Size, level, square (equal diagonals), clear of debris, wrap folded in and sill flashing smooth.', 'V', 'nccWin82'],
  ['Window fixing check', 'Builder', 'After fixing', 'Plumb, level, square, packing along sides and bottom clear of flashing, 10 mm head gap, fixings done.', 'V', 'nccWin82'],
  ['Flashing and sealant check', 'Builder and RBS if asked', 'Before the lining and trims cover them', 'Wrap lapped to the flashing, backing rod and sealant continuous, weepholes open.', 'C', 'bradFlash'],
  ['Glazing check', 'Builder', 'Before handover', 'Door glass and glass below 500 mm are safety glass, large panes have a band, and safety marks are on the glass.', 'V', 'nccGlaz84'],
  ['Door check', 'Builder', 'At lock-up', 'Plumb, swing, bottom seal, locks working, keys accounted for.', 'T'],
  ['Lock-up claim check', 'Builder', 'Before any payment claim', 'Every condition of the contract\'s own lock-up definition is met.', 'C', 'cavPay'],
  ['Surveyor inspection (if stated)', 'RBS', 'As the permit says', 'Ask whether the surveyor wants to see the flashings, glazing or lock-up. Confirm the notification stages on your permit.', 'C'],
];

const exam = [
  ['What must not be transferred to a window assembly?', 'Structural building loads.', 'V', 'nccWin82'],
  ['What gap is needed at the head of a window?', 'At least 10 mm between the top of the window assembly and any loadbearing framing or masonry. It may be bigger to allow for frame settlement over wide openings.', 'V', 'nccWin82'],
  ['Where does packing go, and what must it avoid?', 'Along each side and the bottom, fixed to keep the sides and bottom of the window straight, and clear of any flashing material.', 'V', 'nccWin82'],
  ['What should be done where an aluminium sill may touch masonry or mortar?', 'Use an isolating material. The NCC notes give bituminous membranes and zinc chromate paints and caulking compounds as examples.', 'V', 'nccWin82'],
  ['Which kinds of window and door does Part 8.2 not cover?', 'Internal or revolving doors, fixed louvres, skylights and rooflights, windows not in the vertical plane, greenhouse windows and frameless sliding doors.', 'V', 'nccWin82'],
  ['What glass must a door have?', 'Grade A safety glass to Table 8.4.2, with listed exceptions such as unframed doors (toughened, at least 10 mm) and annealed leadlights up to 0.05 m².', 'V', 'nccGlaz84'],
  ['Give the Table 8.4.2 sizes for toughened glass.', '3 mm up to 1 m², 4 mm up to 2 m², 5 mm up to 3 m², 6 mm up to 4 m².', 'V', 'nccGlaz84'],
  ['Give the Table 8.4.2 sizes for laminated glass.', '5.38 mm up to 2.2 m², 6.38 mm up to 3 m², 8.38 mm up to 5 m².', 'V', 'nccGlaz84'],
  ['Give the Table 8.4.2 sizes for annealed glass.', '5 mm up to 0.3 m² and 6 mm up to 0.9 m².', 'V', 'nccGlaz84'],
  ['When does a side panel need safety glass?', 'When its sight line is under 300 mm from the doorway edge (Part 8.4.3).', 'V', 'nccGlaz84'],
  ['What is needed for glass with a sight line under 500 mm above the floor?', 'Grade A safety glass, or annealed glass at least 5 mm thick if the pane is 1.2 m² or less.', 'V', 'nccGlaz84'],
  ['What does the opaque band on a large pane have to be?', 'At least 20 mm high, with the upper edge at least 700 mm and the lower edge no more than 1.2 m above the floor.', 'V', 'nccGlaz84'],
  ['How is safety glass marked?', 'By etching or a non-reusable label stating the standard, supplier, grade, thickness and type.', 'V', 'nccGlaz84'],
  ['What does a lower window U-value mean?', 'More resistance to heat flow, so better insulation.', 'V', 'yourHomeGlaz'],
  ['What range does SHGC have, and what does a low value mean?', '0 to 1. A lower SHGC lets less solar heat through. For temperate climates the guide suggests high SHGC on north-facing glass with fixed shading, low on east and west.', 'V', 'yourHomeGlaz'],
  ['What does WERS list for a window?', 'System U-value, SHGC, air infiltration and visible light transmittance, with star ratings for heating and cooling.', 'V', 'yourHomeGlaz'],
  ['How does the Consumer Affairs Victoria page define lock-up?', 'External cladding and roof covering fixed, flooring laid, and external doors and windows fixed, even if only temporary. The page was updated 9 July 2025, before the 2025 Act.', 'C', 'cavPay'],
  ['What is the lock-up payment limit on that page?', '40% where the contract is to build to fixing and 35% where it covers all stages.', 'C', 'cavPay'],
  ['When do the Domestic Building Contracts Amendment Act 2025 changes take effect?', 'The Act passed on 11 September 2025 and takes effect by 1 December 2026. Regulations can set deposit limits, progress payment stages and limits, and payments must be proportionate to work done.', 'C', 'cavAmend'],
];

export default {
  n: 7, id: 'windowsdoors', title: 'Windows, doors and lock-up', subtitle: 'Windows and external doors fixed, flashed, sealed and locked, with safety glass checked and the lock-up stage reached.',
  phases, build, details, drawings, howto, trades, materials, quotes, quoteTips, inspections, exam,
  sources: ['nccWin82', 'nccGlaz84', 'nccEnergy133', 'yourHomeGlaz', 'cavPay', 'cavAmend', 'nccMas57', 'bradFlash', 'bpcMI01', 'hiaStd25', 'hiaNcc25'],
  caution: 'Window and glazing figures here come from the ABCB\'s free NCC 2022 web pages (Parts 8.2, 8.4 and 13.3) and the Your Home guide. NCC 2025 applies in Victoria from 1 May 2026, so check each clause and figure against that edition. The Standards (AS 2047 for windows and AS 1288 for glass) are paywalled and were not opened, and the Part 8.2 fixing figure and the Part 13.3 values were not on the pages read. The lock-up definition and payment limits come from a Consumer Affairs Victoria page last updated 9 July 2025; the Domestic Building Contracts Amendment Act 2025 takes effect by 1 December 2026, so confirm the current figures. The dimensions in the models and drawings are typical.',
};

// Step 17: external works. The finished Step 15 house gets stormwater to the legal point of discharge, ground falling away from the walls, a retaining wall, boundary and front fences, a vehicle crossing and driveway,
// a Class 10a shed and a garage footprint that is too big to be exempt, and a garden. The temporary site fence, sign and entry come down.
// Facts marked Verified come from VBA Building Practice Note BP 01 (version 4.0, marked superseded on 1 November 2023, plus the building.vic.gov.au copy), VBA SD 01 (version 2.0), NCC Housing Provisions 3.3, council pages
// and one council's vehicle crossing specification, read on 9 November 2026. The Building Regulations 2018 (Schedule 3 and regulation 133), AS 4678 and each council's own standard were not opened,
// so design rules, footings and other councils' crossing rules are Typical or Confirm. The yard, wall, fence, crossing, shed and garage footprint are illustrative, the pipes are drawn above ground, and the zoom rooms draw layers at about true thickness.
import * as THREE from 'three';
import step05 from './step-05.js';
import step15 from './step-15.js';
import { tree } from './site.js';
import { grp } from './step-06.js';
import { PLATE_TOP, yc } from './step-04.js';
import { drawings, howto, trades, materials, quotes, quoteTips, inspections, exam, sources, caution } from './step-17-study.js';

const phases = [
  { title: 'Permits and approvals', text: 'Each external item is checked for a building permit or an exemption, the council report names the legal point of discharge, and the crossing permit is applied for.' },
  { title: 'Stormwater and falls', text: 'The stormwater pipes and pits are laid to the legal point of discharge at the kerb, and the ground is graded to fall away from the walls.' },
  { title: 'Retaining wall and fences', text: 'The retaining wall goes in to the engineer’s design with its drain, then the boundary and front fences are built after the fencing notice.' },
  { title: 'Driveway, crossing and paths', text: 'The council permit is in place, the crossing and driveway are built over compacted rock with mesh, and the front path is laid.' },
  { title: 'Class 10 buildings', text: 'A shed within the exemption is placed, and a garage or deck that is outside it is shown with the permit it needs.' },
  { title: 'Landscaping', text: 'Garden beds, mulch, shrubs and trees go in below the slab edge and clear of the footings and drains.' },
  { title: 'External checks', text: 'The external work is checked and photographed, the temporary works are gone and the surveyor has the council and engineer paperwork.' },
];

const MAT = (kit) => {
  const { mat, ghost } = kit;
  return {
    timber: mat(0xffffff, { tex: 'timber' }), paling: mat(0xe3c38f, { tex: 'timber' }), steel: mat(0xb9c2cd, { metalness: 0.6, roughness: 0.35 }), dark: mat(0x1b1d20, { roughness: 0.7 }), conc: mat(0xffffff, { tex: 'concrete' }),
    paving: mat(0xffffff, { tex: 'paving' }), soil: mat(0xffffff, { tex: 'soil' }), grass: mat(0xffffff, { tex: 'grass' }), asphalt: mat(0xffffff, { tex: 'asphalt' }), shed: mat(0xe7e0cf, { tex: 'metalRib' }), shedRoof: mat(0x6d7a83, { tex: 'metalRib' }),
    gravel: mat(0xa5a39d, { roughness: 1 }), geo: mat(0xe6e1d2, { roughness: 1, emissive: 0x4a463a }), mulch: mat(0x6e4a2b, { roughness: 1 }), storm: mat(0x1fa39a, { roughness: 0.5 }), orange: mat(0xff7a1a, { roughness: 0.6 }), red: mat(0xd62828, { roughness: 0.6 }),
    green: mat(0x2fbf71, { roughness: 0.6 }), yellow: mat(0xf2c230, { roughness: 0.6 }), okGhost: ghost(0x2fbf71, 0.4), redGhost: ghost(0xd62828, 0.42),
  };
};

/* ---------- walk scene ---------- */
function build(kit) {
  const { box, cyl, rod, flat, textPlane, pipe } = kit;
  const mk = (n) => { const g = new THREE.Group(); g.name = n; return g; };
  const s15 = step15.build(kit), s5 = step05.build(kit), m = MAT(kit);
  const g5 = (n) => s5.layers.find((l) => l.group.name === n).group;
  const KEEP = ['markWalls', 'markTrim', 'fit', 'glow', 'swOk'], DROP = ['fence', 'silt', 'entry', 'amenities', 'amen', 'sign'];
  const layers = s15.layers.filter((l) => ((l.from === undefined && l.until === undefined) || KEEP.includes(l.group.name)) && !DROP.includes(l.group.name)).map(({ group }) => ({ group }));
  const sign = (lines, w, h, x, y, z, ry = 0) => { const s = textPlane(lines, w, h); s.position.set(x, y, z); s.rotation.y = ry; s.userData.sign = true; return s; };
  const post = (g, x, y, z, h, r = 0.03) => { const c = cyl(r, h, m.steel, x, h / 2 + y, z, 8); c.userData.sign = true; g.add(c); return c; };

  // the house roof is closed again from Step 5, with the gable ends filled in
  const roofSark = g5('sarking'), roofTiles = g5('tiles'), roofRidge = g5('ridge');
  roofTiles.children.forEach((c) => { c.visible = true; });
  const gable = mk('gable'), gm = kit.mat(0xe6dfcc, { roughness: 0.9, side: THREE.DoubleSide }), gy = PLATE_TOP, gA = PLATE_TOP + yc(0) - 0.12;
  for (const z of [11.45, -5.45]) gable.add(kit.face([[-5.45, gy, z], [5.45, gy, z], [0, gA, z]], gm));

  // permit board and the final check board, in the front yard
  const permitSign = mk('permitSign'); permitSign.add(sign(['EXTERNAL WORKS: PERMITS', 'Building permit or exempt? Wall, fence, shed, deck', 'Council: crossing permit and legal point of discharge'], 2.0, 0.66, -1.4, 1.3, 15.2, 0), post(permitSign, -2.3, 0, 15.2, 1.3), post(permitSign, -0.5, 0, 15.2, 1.3));
  const checkSign = mk('checkSign'); checkSign.add(sign(['EXTERNAL CHECKS', 'Drains, wall drain, footings: photographed', 'Temporary works removed'], 2.0, 0.66, -1.4, 1.3, 15.2, 0), post(checkSign, -2.3, 0, 15.2, 1.3), post(checkSign, -0.5, 0, 15.2, 1.3));

  // stormwater: three pits and a pipe run to the kerb outlet (drawn above ground so it can be seen)
  const storm = mk('storm'), PX = -6.9, pits = [-4.5, 6.0, 16.0];
  storm.add(pipe([[PX, 0.07, pits[0]], [PX, 0.07, pits[1]], [PX, 0.07, pits[2]], [PX, 0.07, 20.42]], 0.05, m.storm));
  for (const z of pits) { storm.add(box(0.5, 0.1, 0.5, m.dark, PX, 0.05, z)); for (let k = -1; k <= 1; k++) storm.add(box(0.4, 0.012, 0.03, m.steel, PX, 0.108, z + k * 0.12)); }
  storm.add(box(0.26, 0.12, 0.07, m.orange, PX, 0.1, 20.42));
  const lpodSign = mk('lpodSign'); lpodSign.add(sign(['LEGAL POINT OF DISCHARGE', 'Set by the council report', 'Kerb outlet at the street'], 1.6, 0.6, -6.6, 1.2, 14.8, 0), post(lpodSign, -7.3, 0, 14.8, 1.2), post(lpodSign, -5.9, 0, 14.8, 1.2));

  // falls away from the walls: green arrows on the ground and a sign in the west gap
  const falls = mk('falls');
  const arrowAt = (x, z, ux, uz, len = 0.8) => {
    const x1 = x + ux * len, z1 = z + uz * len;
    falls.add(rod([x, 0.05, z], [x1, 0.05, z1], 0.02, m.green, 6));
    const tip = cyl(0.07, 0.2, m.green, x1 + ux * 0.08, 0.05, z1 + uz * 0.08, 8, false, 0);
    if (ux) tip.rotation.z = -Math.PI / 2 * ux; else tip.rotation.x = Math.PI / 2 * uz;
    falls.add(tip);
  };
  for (const x of [-4.5, -2.5]) arrowAt(x, 11.85, 0, 1); for (const x of [-4, 0, 4]) arrowAt(x, -5.85, 0, -1);
  for (const z of [-3, 1, 5, 9]) { arrowAt(-5.85, z, -1, 0, 0.55); arrowAt(5.85, z, 1, 0, 0.9); }
  falls.add(sign(['GROUND FALLS AWAY', 'At least 50 mm over the first 1 m', '25 mm: impermeable, low rainfall'], 1.8, 0.62, -6.5, 1.2, 3.2, 0), post(falls, -7.25, 0, 3.2, 1.2), post(falls, -5.75, 0, 3.2, 1.2));

  // fences: posts, two rails and instanced palings. Front 1.2 m, side and rear 1.8 m. The street fence stops for the path and the driveway.
  const fences = mk('fences'), dummy = new THREE.Object3D(), pal = { 1.2: [], 1.8: [] };
  const fenceRun = (x0, z0, x1, z1, h, inx, inz) => {
    const len = Math.hypot(x1 - x0, z1 - z0), ux = (x1 - x0) / len, uz = (z1 - z0) / len, ry = Math.abs(ux) > 0.5 ? 0 : Math.PI / 2, n = Math.max(1, Math.round(len / 2.4));
    for (let i = 0; i <= n; i++) fences.add(box(0.1, h + 0.1, 0.1, m.timber, x0 + (x1 - x0) * i / n, (h + 0.1) / 2, z0 + (z1 - z0) * i / n));
    for (const f of [0.22, 0.82]) { const r = box(len, 0.07, 0.04, m.timber, (x0 + x1) / 2 + inx * 0.045, h * f, (z0 + z1) / 2 + inz * 0.045); r.rotation.y = ry; fences.add(r); }
    for (let k = 0; k < Math.floor(len / 0.1); k++) { const t = (k + 0.5) * 0.1; pal[h].push([x0 + ux * t - inx * 0.01, z0 + uz * t - inz * 0.01, ry]); }
  };
  for (const [a, b] of [[-7.45, 0.8], [2.2, 2.9], [6.1, 7.45]]) fenceRun(a, 17.35, b, 17.35, 1.2, 0, -1);
  fenceRun(-7.45, -17.4, -7.45, 11.9, 1.8, 1, 0); fenceRun(7.45, -17.4, 7.45, 11.9, 1.8, -1, 0); fenceRun(-7.45, 11.9, -7.45, 17.35, 1.2, 1, 0); fenceRun(7.45, 11.9, 7.45, 17.35, 1.2, -1, 0);
  fenceRun(-7.45, -17.4, 7.45, -17.4, 1.8, 0, 1);
  for (const h of [1.2, 1.8]) {
    const g = box(0.08, h, 0.02, m.paling).geometry, im = new THREE.InstancedMesh(g, m.paling, pal[h].length);
    pal[h].forEach(([x, z, ry], i) => { dummy.position.set(x, h / 2 + 0.02, z); dummy.rotation.set(0, ry, 0); dummy.updateMatrix(); im.setMatrixAt(i, dummy.matrix); });
    im.castShadow = true; im.receiveShadow = true; fences.add(im);
  }

  // retaining wall across the rear yard: concrete sleepers between steel posts, a raised bed behind, a 1.0 m limit line in front
  const wall = mk('wall'), WZ = -13.0;
  wall.add(box(14.0, 0.9, 4.4, m.soil, 0, 0.45, -15.25), flat(14.0, 4.4, m.grass, 0, 0.905, -15.25));
  for (let c = 0; c < 4; c++) for (let k = 0; k < 10; k++) wall.add(box(1.36, 0.225, 0.08, m.conc, -6.3 + k * 1.4, 0.1125 + c * 0.225, WZ));
  for (let k = 0; k <= 10; k++) wall.add(box(0.1, 1.2, 0.1, m.steel, -7.0 + k * 1.4, 0.55, WZ + 0.07));
  wall.add(rod([-7, 1.0, WZ + 0.2], [7, 1.0, WZ + 0.2], 0.012, m.red, 6));
  for (const x of [-7, 7]) wall.add(rod([x, 0, WZ + 0.2], [x, 1.0, WZ + 0.2], 0.012, m.red, 6));
  const outlet = cyl(0.05, 0.4, m.dark, -6.85, 0.08, WZ + 0.2, 10); outlet.rotation.x = Math.PI / 2; wall.add(outlet);
  wall.add(sign(['RETAINING WALL: 0.9 m', 'Under 1 m: exempt (BP 01 v4.0)', '1 m or over: building permit, engineer'], 2.4, 0.78, 0, 1.1, WZ + 0.6, 0), post(wall, -1.1, 0, WZ + 0.6, 1.1), post(wall, 1.1, 0, WZ + 0.6, 1.1));

  // vehicle crossing, driveway and front path
  const drive = mk('drive'), DX = 4.5;
  drive.add(box(3.2, 0.04, 5.7, m.conc, DX, 0.02, 14.65), box(3.2, 0.04, 2.9, m.conc, DX, 0.02, 18.95));
  const ramp = box(3.2, 0.04, 0.78, m.conc, DX, 0.095, 20.65); ramp.rotation.x = 0.2; drive.add(ramp);
  for (const z of [14.5, 17.5, 20.2]) drive.add(box(3.2, 0.006, 0.025, m.dark, DX, 0.043, z));
  drive.add(box(3.2, 0.006, 0.025, m.dark, DX, 0.043, 12.0));
  const pathG = mk('pathG'); pathG.add(box(1.2, 0.03, 5.9, m.paving, 1.5, 0.015, 14.55));

  // Class 10: a shed that is inside the exemption, and a garage footprint that is not
  const shed = mk('shed');
  shed.add(box(2.6, 2.3, 3.6, m.shed, 5.5, 1.15, -9.2)); const sr = box(2.7, 0.05, 3.7, m.shedRoof, 5.5, 2.36, -9.2); sr.rotation.z = -0.038; shed.add(sr);
  shed.add(box(1.2, 2.0, 0.04, m.dark, 5.5, 1.0, -7.39), box(0.05, 0.08, 0.06, m.steel, 5.0, 1.0, -7.35));
  shed.add(sign(['CLASS 10a SHED', '9.4 m² and 2.4 m high at most', 'Exempt only if every BP 01 condition holds'], 2.2, 0.72, 3.4, 1.1, -9.2, -Math.PI / 2), post(shed, 3.4, 0, -10.2, 1.1), post(shed, 3.4, 0, -8.2, 1.1));
  const garageFp = mk('garageFp');
  garageFp.add(flat(3.0, 5.8, m.redGhost, -5.3, 0.04, -9.1));
  for (const [x, z] of [[-6.8, -6.2], [-3.8, -6.2], [-6.8, -12.0], [-3.8, -12.0]]) garageFp.add(cyl(0.04, 1.2, m.red, x, 0.6, z, 8));
  garageFp.add(sign(['GARAGE FOOTPRINT: 17 m²', 'Over 10 m²: building permit', 'Check planning and fire separation'], 2.2, 0.72, -3.4, 1.1, -9.1, Math.PI / 2), post(garageFp, -3.4, 0, -10.1, 1.1), post(garageFp, -3.4, 0, -8.1, 1.1));

  // garden: mulch bed along the front wall, shrubs and two small trees
  const garden = mk('garden');
  garden.add(box(5.4, 0.06, 1.0, m.mulch, -2.5, 0.03, 12.25));
  [-4.6, -3.3, -2.0, -0.7].forEach((x, i) => garden.add(tree(kit, x, 12.3, 0.28, 20 + i)));
  garden.add(tree(kit, -6.0, 14.0, 0.5, 31), tree(kit, 1.5, -10.5, 0.6, 32));

  layers.push({ group: roofSark }, { group: roofTiles }, { group: roofRidge }, { group: gable }, { group: permitSign, until: 5 }, { group: checkSign, from: 6 }, { group: storm, from: 1 }, { group: lpodSign, from: 1 }, { group: falls, from: 1 },
    { group: wall, from: 2 }, { group: fences, from: 2 }, { group: drive, from: 3 }, { group: pathG, from: 3 }, { group: shed, from: 4 }, { group: garageFp, from: 4 }, { group: garden, from: 5 });
  return { layers, colliders: s15.colliders, tickers: s15.tickers, spawn: { pos: [4, 18.5], yaw: 0, pitch: 0.2 }, map: s15.map, orbit: { pos: [26, 18, 26], target: [0, 0.5, 0] }, hotspots: HOTSPOTS };
}

/* ---------- hotspots ---------- */
const HOTSPOTS = [
  { id: 'permit', title: 'Permits for external work: which need one', pos: [-1.4, 1.7, 15.2], stand: [-1.4, 16.8], from: 0, until: 5, drawing: 'permits',
    summary: 'Fences, retaining walls, decks, pergolas and sheds each have their own exemption test, and some work needs a council permit that is not a building permit. Check each item before it is quoted.',
    learn: [['BP 01 lists the building work that needs no building permit. It is guidance, and Schedule 3 of the Building Regulations 2018 holds the prescribed exemptions.', 'V', 'bp01Dtp'], ['The VBA marked version 4.0 superseded on 1 November 2023 and the current note was not found, so confirm every number against the current note.', 'C', 'bp01Vba'], ['A planning permit may still be required for exempt work, the work must still comply with the NCC where it applies, and a freestanding Class 10a building over an easement may need the authority’s consent.', 'V', 'bp01Dtp'], ['A vehicle crossing needs a council permit to work in the road reserve. That is not a building permit.', 'V', 'banyuleCross'], ['A permit application that includes a stormwater drainage system needs the council report on the legal point of discharge (regulation 133(2)).', 'V', 'vbaSd01'], ['Write down for each external item whether it is in the permit or exempt, with the reason, and keep it with the permit documents (Typical).', 'T']] },
  { id: 'drain', title: 'Stormwater and the legal point of discharge', pos: [-6.6, 1.6, 14.8], stand: [-6.6, 16.6], from: 1, drawing: 'drain',
    summary: 'The roof water leaves the house in pipes to the legal point of discharge named in the council report. The owner looks after the system up to that point and the council looks after the drain beyond it. The pipes in the model run above ground so they can be seen.',
    learn: [['The council is responsible for the stormwater drain beyond the legal point of discharge and the owner for the system up to it.', 'V', 'vbaSd01'], ['The council report identifies the point for the allotment. The building surveyor must approve the system so the point of discharge is consistent with it, and regulation 133(2) calls for the report with a permit application that includes a stormwater system.', 'V', 'vbaSd01'], ['The point is usually an underground drain, a kerb or an open table drain.', 'V', 'stonLpod'], ['The council stormwater system takes rainwater only. One council page says groundwater and wastewater cannot go into it, and wastewater goes to the sewer.', 'V', 'boroStorm'], ['Works on local roads need a Road Opening Permit, and a declared road also needs consent from the Department of Transport and Planning (Boroondara page).', 'V', 'boroStorm'], ['Cover over a 90 mm Class 6 UPVC drain is 100 mm under soil and 50 mm under paving or concrete, and for light vehicle traffic 75 mm of reinforced concrete or 100 mm paved. The page states no edition.', 'V', 'nccHp33'], ['Pipe sizes and pit spacing were not in the pages read, so they come from the drainer’s design and the surveyor. Whether the work needs a licensed plumber and a certificate was not checked.', 'C']] },
  { id: 'falls', title: 'Falls away from the house and the slab edge', pos: [-6.5, 1.65, 3.4], stand: [-6.5, 6.2], from: 1, drawing: 'drain',
    summary: 'The ground round the house must slope away from it, and the slab edge must stay above the finished ground. Garden beds, paving and turf are set to these levels. The arrows show the fall, which the flat ground in the model does not have.',
    learn: [['Finished ground round a slab-on-ground falls away from the building by at least 50 mm over the first 1 m, or 25 mm over the first 1 m for reasonably impermeable surfaces in a low rainfall area (NCC 3.3.3).', 'V', 'nccHp33'], ['The slab edge is at least 100 mm above finished ground in a low rainfall or sandy well-drained area, 50 mm above a sloping impermeable area and 150 mm in other cases.', 'V', 'nccHp33'], ['Subsoil drains need a uniform fall of at least 1 in 300 to an external silt pit or sump, and the notes say to use them in clay only where nothing else will do.', 'V', 'nccHp33'], ['The page states no edition and the Livable Housing Design exceptions were not read, so check the clause in the edition on the permit.', 'C', 'nccHp33'], ['Check the levels with a level or laser before the paving and turf go on (Typical).', 'T']] },
  { id: 'fence', title: 'Fences: height limits and the Fences Act', pos: [-4.4, 1.0, 17.35], stand: [-4.4, 19.4], from: 2, detail: 'fence', drawing: 'permits',
    summary: 'The front fence is 1.2 m and the side and rear fences are 1.8 m. A fence needs no building permit up to 2 m, with lower limits near a street, and a dividing fence follows the Fences Act 1968.',
    learn: [['A fence is exempt if it is not more than 2 m high. Within 3 m of a street it is limited to 1.5 m, or 1.2 m if masonry, concrete or similar.', 'V', 'bp01Vba'], ['Within 9 m of a street intersection point the limit is 1 m above the footpath. Swimming pool and spa barriers are treated separately.', 'V', 'bp01Dtp'], ['Neighbours share the cost of a dividing fence equally. A fencing notice gives the neighbour 30 days to respond, and if they do not the work can go ahead and their share can be sought in the Magistrates’ Court.', 'V', 'vicFencing'], ['The law does not set a height or material. A 1.8 m timber paling fence is the page’s example for a residential property, and a neighbour who wants a better fence pays the difference.', 'V', 'vicFencing'], ['One council says it cannot mediate fence disputes between private owners and points people to the Dispute Settlement Centre of Victoria.', 'V', 'humeFence'], ['Posts for ground contact are usually treated timber set in concrete, and the depth, spacing and footing come from the fence design (Typical).', 'T']] },
  { id: 'retain', title: 'Retaining wall: height, drainage and the permit test', pos: [0, 1.6, -13.0], stand: [0, -9.8], from: 2, detail: 'retain', drawing: 'retain',
    summary: 'The model wall holds up a raised garden 0.9 m high. BP 01 exempts a wall less than 1 m high, but not one tied to other building work or protecting adjoining property, and council pages say 1 m or over needs a permit and an engineer.',
    learn: [['A retaining wall less than 1 m high is exempt from a building permit, unless it is associated with other building work or with protection of adjoining property (BP 01 v4.0).', 'V', 'bp01Vba'], ['Council pages say a wall of 1 m or over needs a building permit. The height is measured from the top of the wall to its lowest point.', 'V', 'boroRetain'], ['One council asks for a design and certification by a qualified structural engineer, and says a wall under 1 m near a building or boundary can need a permit where there is a risk to adjoining property.', 'V', 'mrscRetain'], ['The same page says an excavation wall over 400 mm needs a set-back equal to its height. This comes from a council page, not the Regulations, so confirm it.', 'C', 'boroRetain'], ['Overlays, heritage, easements, covenants and protected trees can each need a permit or consent.', 'V', 'boroRetain'], ['A wall drain is a slotted pipe in gravel behind geotextile, falling to an outlet. Where it may discharge is a question for the council and surveyor, because one council says groundwater cannot go into its drain (Typical).', 'T'], ['The NCC 3.2 page read has no retaining wall rules, and AS 4678 was not opened, so loads, footings and drainage come from the engineer.', 'C', 'nccHp32']] },
  { id: 'driveway', title: 'Driveway and vehicle crossing', pos: [4.5, 0.2, 16.4], stand: [4.5, 14.2], from: 3, detail: 'crossing', drawing: 'crossing',
    summary: 'The crossing is built over the footpath to the council’s specification, after a council permit for works in the road reserve. The driveway on the private side carries on from it.',
    learn: [['A Works Within Road Reserve permit is needed before any work in the road reserve. In Banyule it is valid for 28 days from payment, and the council may ask for a bond.', 'V', 'banyuleCross'], ['A standard crossing is 25 MPa concrete at 28 days, at least 150 mm thick over 50 mm of compacted fine crushed rock, with F72 mesh placed centrally.', 'V', 'banyuleCross'], ['The width is at least 3.0 m and at most 7.6 m, and on a corner lot the crossing is at least 9.0 m from the intersection of the lot boundaries.', 'V', 'banyuleCross'], ['Street trees, pits, poles and manholes in the way are moved through the relevant authority before the permit is issued. The street tree beside the crossing in the model is just outside its width.', 'V', 'banyuleCross'], ['Book the inspection with 24 hours’ notice and get the officer’s approval before the pour. Above 25 °C keep the concrete moist for seven days, and book a final inspection.', 'V', 'banyuleCross'], ['This is one council’s specification, last amended in 2015. Every council sets its own, so read the one for the property.', 'C', 'banyuleCross'], ['The driveway on the private side is not covered by the specification read, so its thickness, falls and finish are Typical.', 'T']] },
  { id: 'shed', title: 'Class 10a: a shed that needs no permit', pos: [3.4, 1.55, -9.2], stand: [0.6, -8.6], from: 4, drawing: 'permits',
    summary: 'A freestanding shed is exempt only if every condition holds: 10 m² or less, 3 m high or less (2.4 m within 1 m of a boundary), not masonry and not forward of the front wall. The model shed is 9.4 m², at most 2.4 m high and 0.7 m from the boundary.',
    learn: [['A freestanding Class 10a building is exempt if its floor area is not more than 10 m², it is not more than 3 m high (2.4 m if within 1 m of a boundary), and it is not masonry.', 'V', 'bp01Vba'], ['If it serves another building it must be no further forward than that building’s front wall. If it serves none it must be the only Class 10a building on the allotment, at least 9 m from the front street alignment and 2 m from each side street alignment.', 'V', 'bp01Vba'], ['A planning permit may still be required, and over an easement the authority may need to consent.', 'V', 'bp01Dtp'], ['The building.vic.gov.au copy also says demolishing a freestanding Class 10 building is exempt if it is not masonry, is not over 40 m² and does not affect public safety.', 'V', 'bp01Dtp'], ['The slab or base and the fixing for a shed kit come from the supplier’s design (Typical).', 'T']] },
  { id: 'garage', title: 'Class 10a: a garage that needs a permit', pos: [-3.4, 1.6, -9.1], stand: [-0.9, -9.1], from: 4, drawing: 'permits',
    summary: 'The red footprint is 3.0 by 5.8 m, 17 m², which is over the 10 m² limit, so it would need a building permit and a planning check. A deck attached to the house needs a permit whatever its size.',
    learn: [['The exemption stops at 10 m². A bigger garage, a masonry one, or one forward of the front wall is outside it and needs a building permit.', 'V', 'bp01Vba'], ['A deck attached to a building needs a building permit, and so does a detached deck that is part of the amenity of a building. The building.vic.gov.au copy says regardless of size.', 'V', 'bp01Dtp'], ['A pergola is exempt if it is not more than 3.6 m high and 20 m², and no further forward than the front wall (2.5 m forward for a Class 1).', 'V', 'bp01Vba'], ['Walls near a boundary can need a fire rating. The NCC Housing Provisions 9.2 page read was a fragment without the distances and ratings, so they are Confirm.', 'C', 'nccHp92'], ['The Step 7 garage door pack was kept for a garage, but this model has no garage building. The footprint only shows the size at which the permit starts.', 'T']] },
  { id: 'garden', title: 'Landscaping and the slab edge', pos: [-3.4, 0.5, 12.2], stand: [-3.4, 13.9], from: 5, drawing: 'drain',
    summary: 'Garden beds and mulch stay below the slab edge, and plants and trees stay clear of the footings and drains. The mulch in the model stops short of the wall.',
    learn: [['The NCC sets the slab edge height above finished ground at 100, 50 or 150 mm depending on the site, so beds, mulch and turf stay below it.', 'V', 'nccHp33'], ['Mulch and soil must not bridge the termite barrier or cover the slab edge (Typical).', 'T'], ['Protected trees may need a separate permit (Boroondara retaining wall page).', 'V', 'boroRetain'], ['Keep tree roots and irrigation away from footings and drains, because roots can break pipes and wet reactive soils (Typical).', 'T'], ['Check the finished levels once the garden is in, so the falls still run away from the walls (Typical).', 'T']] },
  { id: 'check', title: 'External checks, photographs and the temporary works', pos: [-1.4, 1.7, 15.2], stand: [-1.4, 16.8], from: 6, drawing: 'permits',
    summary: 'Before the final inspection the external work is checked and photographed, the temporary fence and site facilities have gone, and the surveyor has the council and engineer paperwork.',
    learn: [['Photograph the drains, the wall drain and the footings before they are covered. They are the evidence later (Typical).', 'T'], ['Collect the council’s final inspection of the crossing, the engineer’s certificate for the wall and any stormwater certificate. Which certificates apply was not checked (Confirm).', 'C'], ['Check each external item against the permit or exemption note kept at the start (Typical).', 'T'], ['The final inspection, the certificates and the occupancy permit are covered in Stage 18 (Typical).', 'T']] },
];

/* ---------- zoom rooms ---------- */
const details = {
  retain: {
    title: 'Retaining wall: footing, post, sleepers, drain and backfill', sub: 'Concrete footing, steel post, concrete sleepers, geotextile, free-draining gravel, a slotted drain and the retained soil. The wall is 0.9 m above the low-side ground. Sizes are illustrative and the design is the engineer’s',
    floor: -0.6, gridSize: 2, camera: { pos: [1.9, 0.85, 2.5], target: [0.2, 0.22, 0] },
    build(kit) {
      const { box, cyl } = kit, m = MAT(kit);
      const footing = grp(box(0.7, 0.25, 0.6, m.conc, 0.05, -0.325, 0));
      const post = grp(box(0.09, 1.4, 0.09, m.steel, -0.04, 0.25, -0.26), box(0.09, 1.4, 0.09, m.steel, -0.04, 0.25, 0.26));
      const geo = grp(box(0.006, 1.05, 0.55, m.geo, 0.145, 0.375, 0));
      const sleepers = grp(...[0, 1, 2, 3, 4].map((i) => box(0.1, 0.215, 0.44, m.conc, 0.09, -0.09 + i * 0.22, 0)));
      const pipeM = cyl(0.05, 0.55, m.dark, 0.24, -0.12, 0, 12); pipeM.rotation.x = Math.PI / 2;
      const pipeG = grp(pipeM);
      const gravel = grp(box(0.2, 0.95, 0.55, m.gravel, 0.25, 0.3, 0));
      const soil = grp(box(0.5, 1.05, 0.55, m.soil, 0.6, 0.375, 0));
      return { parts: [
        { id: 'footing', name: 'Concrete footing', group: footing, explode: [0, -0.22, 0], anchor: [0.35, -0.325, 0.3], flag: 'T', spec: 'A concrete strip footing carries the posts and sleepers. Its size and depth come from the engineer’s design and the ground, and were not opened here.', desc: 'Sized by the engineer.' },
        { id: 'post', name: 'Steel post', group: post, explode: [-0.3, 0.05, 0], anchor: [-0.04, 0.85, 0.26], flag: 'T', spec: 'Posts at about 1.4 m centres hold the sleepers between their flanges. Galvanised steel or treated timber are typical, and the design says which.', desc: 'Set in the footing.' },
        { id: 'geo', name: 'Geotextile', group: geo, explode: [0.12, 0.2, 0], anchor: [0.145, 0.78, -0.25], flag: 'T', spec: 'Fabric against the back of the sleepers keeps the soil out of the gravel and the drain.', desc: 'Stops the soil clogging the drain.' },
        { id: 'sleepers', name: 'Concrete sleepers', group: sleepers, explode: [-0.12, 0.12, 0], anchor: [0.05, 0.3, 0.22], flag: 'T', spec: 'Precast concrete sleepers stack between the posts. The lowest one is buried so the retained height is measured from the low-side ground, here 0.9 m, to the top of the wall.', desc: 'The face of the wall.' },
        { id: 'drain', name: 'Slotted ag pipe', group: pipeG, explode: [0.18, -0.28, 0], anchor: [0.24, -0.12, 0.28], flag: 'C', spec: 'A slotted pipe falls to an outlet at the wall end. Where it may discharge is a council and surveyor question, because one council page says groundwater cannot go into its drain.', desc: 'Carries the seepage out.' },
        { id: 'gravel', name: 'Free-draining gravel', group: gravel, explode: [0.22, 0.28, 0], anchor: [0.25, 0.58, 0.27], flag: 'T', spec: 'Clean gravel behind the geotextile lets the water drop to the pipe.', desc: 'Lets water through.' },
        { id: 'soil', name: 'Retained soil', group: soil, explode: [0.5, 0.1, 0], anchor: [0.6, 0.62, 0.27], flag: 'V', src: 'boroRetain', spec: 'Height is measured from the top of the wall to its lowest point (Boroondara page). BP 01 v4.0 exempts a wall under 1 m unless it is linked to other building work or protects adjoining property.', desc: 'The raised garden.' },
      ] };
    },
  },

  crossing: {
    title: 'Vehicle crossing: subgrade, base, mesh, slab, footpath, kerb and road', sub: 'Compacted subgrade, 50 mm of fine crushed rock, F72 mesh, a 150 mm concrete slab, the footpath beside it, the kerb and channel and the road. From one council’s specification, about true thickness',
    floor: -0.45, gridSize: 2, camera: { pos: [1.65, 0.9, 1.65], target: [0.08, -0.05, 0] },
    build(kit) {
      const { box } = kit, m = MAT(kit);
      const sub = grp(box(1.6, 0.3, 0.6, m.soil, -0.1, -0.2, 0));
      const base = grp(box(1.6, 0.05, 0.6, m.gravel, -0.1, -0.025, 0));
      const wires = []; for (let k = -3; k <= 2; k++) wires.push(box(0.01, 0.01, 0.56, m.steel, -0.1 + k * 0.2, 0.075, 0)); for (const z of [-0.2, 0, 0.2]) wires.push(box(1.1, 0.01, 0.01, m.steel, -0.1, 0.075, z));
      const mesh = grp(...wires);
      const slab = grp(box(1.2, 0.15, 0.6, m.conc, -0.1, 0.075, 0));
      const path = grp(box(0.5, 0.1, 0.6, m.paving, -0.95, 0.05, 0));
      const kerb = grp(box(0.18, 0.2, 0.6, m.conc, 0.59, 0.05, 0));
      const road = grp(box(0.5, 0.1, 0.6, m.asphalt, 0.93, 0.0, 0));
      return { parts: [
        { id: 'sub', name: 'Compacted subgrade', group: sub, explode: [0, -0.2, 0], anchor: [-0.1, -0.28, 0.3], flag: 'V', src: 'banyuleCross', spec: 'Fill and subgrade are compacted to a uniform hard surface at least 150 mm deep below the concrete level, and soft or spongy areas are rejected.', desc: 'Hard and uniform.' },
        { id: 'base', name: 'Fine crushed rock', group: base, explode: [0, -0.08, 0], anchor: [0.4, -0.03, 0.3], flag: 'V', src: 'banyuleCross', spec: 'The specification asks for 50 mm of compacted fine crushed rock under the concrete, well watered before the pour in summer.', desc: 'The base.' },
        { id: 'mesh', name: 'F72 mesh', group: mesh, explode: [0, 0.28, 0], anchor: [-0.5, 0.075, 0.28], flag: 'V', src: 'banyuleCross', spec: 'F72 mesh is placed centrally in concrete thicker than 100 mm, on bar chairs and in place before inspection. The model draws the bars thicker than real.', desc: 'Held at mid depth.' },
        { id: 'slab', name: 'Concrete slab', group: slab, explode: [0, 0.14, 0], anchor: [0.2, 0.15, 0.3], flag: 'V', src: 'banyuleCross', spec: '25 MPa at 28 days, at least 150 mm thick. Above 25 °C the concrete is kept moist for seven days.', desc: 'The crossing.' },
        { id: 'path', name: 'Footpath beside the crossing', group: path, explode: [-0.28, 0.06, 0], anchor: [-0.95, 0.1, 0.3], flag: 'V', src: 'banyuleCross', spec: 'A path under 150 mm thick at the crossing is flagged as substandard, and a damaged path inside the crossing is broken out to a joint and replaced with 150 mm of concrete.', desc: 'Reinstated if damaged.' },
        { id: 'kerb', name: 'Kerb and channel', group: kerb, explode: [0.18, 0.06, 0], anchor: [0.59, 0.15, 0.3], flag: 'V', src: 'banyuleCross', spec: 'Where there is no layback the kerb and channel is removed to the nearest joint, or cut with the council’s approval so no section is shorter than 1.5 m. The layback is not drawn.', desc: 'Cut back for the crossing.' },
        { id: 'road', name: 'Road', group: road, explode: [0.38, 0.0, 0], anchor: [0.93, 0.06, 0.3], flag: 'T', spec: 'The road edge the crossing meets. The council owns it, and works in the road reserve need the council’s permit.', desc: 'Council road.' },
      ] };
    },
  },

  fence: {
    title: 'Timber paling fence: footing, post, rails, palings and cap', sub: 'Concrete footing, treated post, two rails, palings and a cap rail. Sizes are illustrative. The height is the 1.8 m example the Victorian Government page gives for a residential fence',
    floor: -0.8, gridSize: 3, camera: { pos: [2.7, 1.0, 4.7], target: [0.05, 0.8, 0] },
    build(kit) {
      const { box, cyl } = kit, m = MAT(kit);
      const footing = grp(cyl(0.15, 0.6, m.conc, 0, -0.3, 0, 16));
      const post = grp(box(0.1, 2.2, 0.1, m.timber, 0, 0.5, 0));
      const rails = grp(box(0.045, 0.07, 1.3, m.timber, 0.075, 0.4, 0), box(0.045, 0.07, 1.3, m.timber, 0.075, 1.4, 0));
      const palings = grp(...[-4, -3, -2, -1, 0, 1, 2, 3, 4].map((i) => box(0.02, 1.75, 0.12, m.paling, 0.12, 0.925, i * 0.14)));
      const cap = grp(box(0.05, 0.07, 1.3, m.timber, 0.115, 1.835, 0));
      return { parts: [
        { id: 'footing', name: 'Concrete footing', group: footing, explode: [0, -0.25, 0], anchor: [0.15, -0.3, 0.15], flag: 'T', spec: 'The post is set in a concreted hole. The depth and diameter come from the fence design, and 600 mm is only a typical depth.', desc: 'Holds the post.' },
        { id: 'post', name: 'Treated post', group: post, explode: [-0.25, 0.0, 0], anchor: [-0.05, 1.5, 0.05], flag: 'T', spec: 'Timber posts for ground contact are usually treated, H4 being typical. The design gives the section, spacing and treatment.', desc: 'Carries the rails.' },
        { id: 'rails', name: 'Rails', group: rails, explode: [0.05, 0.0, 0], anchor: [0.075, 1.4, 0.6], flag: 'T', spec: 'Two or three rails join the posts and carry the palings, and the fence in the model has two.', desc: 'Join the posts.' },
        { id: 'palings', name: 'Palings', group: palings, explode: [0.3, 0.0, 0], anchor: [0.12, 1.0, -0.55], flag: 'V', src: 'vicFencing', spec: 'The Victorian Government page gives a 1.8 m timber paling fence as the example for a residential property, and says the law sets no height or material.', desc: 'The fence face.' },
        { id: 'cap', name: 'Cap rail', group: cap, explode: [0.3, 0.25, 0], anchor: [0.115, 1.835, 0.6], flag: 'T', spec: 'A cap rail along the top finishes the palings and sheds water off the ends.', desc: 'Tops the palings.' },
      ] };
    },
  },
};

export default {
  n: 17, id: 'external', title: 'External works', subtitle: 'Permits and exemptions, stormwater to the legal point of discharge, falls away from the house, a retaining wall, fences, a vehicle crossing and driveway, Class 10 buildings, and the garden.',
  phases, build, details, drawings, howto, trades, materials, quotes, quoteTips, inspections, exam, sources: [...sources, 'nccHp92'], caution,
};

// Step 1: permits, contract and site establishment.
import { buildBase, buildSiteWorks, BLOCK, HOUSE, BASE_COLLIDERS, MAP } from './site.js';
import { svg, T, L, R, C as Ci, P, dim, arrow, call } from './dwg.js';

const phases = [
  { title: 'The block', text: 'A vacant 15 m by 35 m block with a house on each side. Survey pegs mark the title boundaries.' },
  { title: 'Survey and services', text: 'The footprint is set out and underground services are located before the design is locked in.' },
  { title: 'Fence and permit sign', text: 'With the permit issued and the contract and insurance cover in place, the site is fenced and signed.' },
  { title: 'Erosion control and entry', text: 'Sediment fence and a stabilised entry go in before any digging starts.' },
  { title: 'Amenities and power', text: 'Toilet, temporary power, skip and storage complete the site establishment.' },
];

function build(kit) {
  const { THREE, C, mat, ghost, box, cyl, flat, lineSet } = kit;
  const mk = (n) => { const g = new THREE.Group(); g.name = n; return g; };
  const base = buildBase(kit), w = buildSiteWorks(kit);

  const survey = mk('survey');
  for (const [x, z] of [[BLOCK.x0, BLOCK.z0], [BLOCK.x1, BLOCK.z0], [BLOCK.x0, BLOCK.z1], [BLOCK.x1, BLOCK.z1]]) {
    survey.add(cyl(0.03, 0.5, mat(0xffffff, { tex: 'timber' }), x, 0.25, z, 8));
    survey.add(cyl(0.034, 0.08, mat(C.orange), x, 0.52, z, 8));
  }

  const env = mk('envelope');
  env.add(flat(HOUSE.x1 - HOUSE.x0, HOUSE.z1 - HOUSE.z0, ghost(0x2f7fd6, 0.32), 0, 0.03, (HOUSE.z0 + HOUSE.z1) / 2));
  const y = 0.06, { x0, x1, z0, z1 } = HOUSE;
  env.add(lineSet([[[x0, y, z0], [x1, y, z0]], [[x1, y, z0], [x1, y, z1]], [[x1, y, z1], [x0, y, z1]], [[x0, y, z1], [x0, y, z0]]], 0x1c5fb0));

  const services = mk('services');
  const gl = (pts, color, wd = 0.16) => {
    const m = mat(color, { emissive: color, emissiveIntensity: 0.3 });
    for (let i = 0; i < pts.length - 1; i++) {
      const [ax, az] = pts[i], [bx, bz] = pts[i + 1], len = Math.hypot(bx - ax, bz - az);
      const seg = box(len, 0.02, wd, m, (ax + bx) / 2, 0.04, (az + bz) / 2);
      seg.rotation.y = -Math.atan2(bz - az, bx - ax); seg.castShadow = false;
      services.add(seg);
    }
    const [ex, ez] = pts[0];
    services.add(cyl(0.22, 0.03, m, ex, 0.05, ez, 20));
  };
  gl([[-3.6, -5.5], [-3.6, -17.5]], C.sewer);
  gl([[-2, 17.2], [-2, 11.5]], C.water);
  gl([[1, 20.3], [1, 11.5]], C.storm);
  gl([[9, 21], [5.5, 18.5], [5.5, 11.5]], C.power);
  gl([[-6.3, 20.3], [-6.3, 11.5]], C.gas);

  const layers = [
    { group: base }, { group: survey }, { group: env, from: 1 }, { group: services, from: 1 },
    { group: w.fence, from: 2 }, { group: w.sign, from: 2 }, { group: w.silt, from: 3 }, { group: w.entry, from: 3 }, { group: w.amenities, from: 4 },
  ];
  return {
    layers, colliders: BASE_COLLIDERS,
    spawn: { pos: [0, 22], yaw: 0, pitch: -0.1 }, map: MAP,
    orbit: { pos: [22, 18, 34], target: [0, 0, 3] },
    hotspots: [
      { id: 'title', title: 'Boundaries, title and survey pegs', pos: [-7.5, 0.9, 17.5], stand: [-8, 25], from: 0,
        summary: 'The pegs mark the title boundaries. Setbacks, set-out, fences and neighbour protection are all measured from them.',
        learn: [['Get a feature and level survey from a licensed land surveyor, and a re-establishment survey if pegs are missing.', 'T'], ['Read the title for easements and covenants. Building over a sewer easement needs the water authority\'s consent.', 'C'], ['Planning overlays such as heritage, bushfire, flood or vegetation can mean a planning permit is needed before the building permit.', 'C']], drawing: 'site' },
      { id: 'dbyd', title: 'Dial Before You Dig and service connections', pos: [-2, 0.9, 17.2], stand: [-2, 24], from: 1,
        summary: 'Get the underground service plans before any digging. The coloured lines show typical locations of sewer, water, stormwater, power and gas.',
        learn: [['Lodge a Dial Before You Dig enquiry and get location plans from each service authority before excavating.', 'T'], ['Colours here are for learning: sewer brown, water blue, stormwater teal, power red, gas yellow. Follow the colours on your location plans on the real site.', 'T'], ['Your water authority sets connection and build-over rules. Check early because they can move the footprint.', 'C']], drawing: 'site' },
      { id: 'footprint', title: 'House footprint and setbacks', pos: [0, 1.3, 11.5], stand: [0, 22], from: 1,
        summary: 'The blue ghost slab is the approved footprint. The planning permit and the endorsed plans fix the setback to each boundary.',
        learn: [['Boundary setbacks come from the endorsed plans and the siting rules in the Building Regulations 2018. The building surveyor checks them at permit stage.', 'C'], ['Check the footprint against easements, tree protection zones and the sewer location before ordering anything.', 'T']], drawing: 'site' },
      { id: 'sign', title: 'Permit sign and site records', pos: [-0.4, 1.95, 16.9], stand: [-0.4, 22], from: 2,
        summary: 'Display the permit and builder details as the permit conditions and council rules require. Keep the permit, plans, engineer\'s documents and the Notice of Cover (the DBI certificate for older contracts) on site.',
        learn: [['Home Warranty replaces DBI for eligible work under contracts signed on or after 1 July 2026: work over $20,000, up to three storeys. The builder pays the premium and the BPC gives the owner a Notice of Cover.', 'V', 'bpcHW'], ['Before 1 July 2026 the builder had to take out DBI before any payment and give the owner a copy of the certificate within seven days. Existing DBI policies stay on their original terms.', 'C', 'bpcDBI'], ['The surveyor must not issue the permit unless the builder named matches the contract and the insurance evidence (Building Act 1993 s 24A). What counts as the evidence under Home Warranty is Confirm.', 'C', 'bpcDBI'], ['Building work must not start until the permit is in force (Building Act 1993 s 16).', 'C'], ['Sign wording and size: confirm what your permit conditions and council local law require.', 'C']], drawing: 'pathway' },
      { id: 'fence', title: 'Temporary site fence', pos: [-4.5, 1.4, 17.15], stand: [-4.5, 22], from: 2, detail: 'fence',
        summary: 'Keeps the public out and neighbours\' children safe. Panels are clamped, the stands are weighted and the gate locks.',
        learn: [['Typical panel is 2.4 m wide by 1.8 m high with weighted stands and clamps. Hire is usually cheaper than buying for one build.', 'T'], ['Check council local laws for permits if the fence or hoarding extends past the boundary or occupies the footpath.', 'C'], ['Lock the gate when the site is unattended and check the fence after storms.', 'T']] },
      { id: 'silt', title: 'Sediment fence', pos: [-4.5, 0.55, 17.4], stand: [-4.5, 22], from: 3, detail: 'silt',
        summary: 'Traps soil in runoff so it does not wash into the street and stormwater drains. The toe of the fabric is trenched in, and the fabric is fixed to the uphill face of posts set on the downhill side.',
        learn: [['Install before earthworks start and keep it cleaned and repaired.', 'T'], ['Do not put it across a concentrated flow. Use a sediment trap or a diversion instead.', 'T'], ['Soil leaving site into the stormwater system can lead to fines from EPA or council. Confirm the current guideline for house sites.', 'C']] },
      { id: 'entry', title: 'Stabilised entry', pos: [4.5, 0.7, 14.4], stand: [4.5, 22], from: 3, detail: 'entry',
        summary: 'A rock pad over geotextile that shakes mud off wheels before trucks reach the street. Every truck uses it.',
        learn: [['A typical pad is about 3 m wide and 6 m long on separation fabric with clean, angular rock. Confirm size and rock grading with council or EPA guidance.', 'C'], ['Protect the kerb and crossover. The builder answers for damage to council assets.', 'C'], ['Sweep the road if mud gets out. Do not hose it into the drain.', 'T']] },
      { id: 'amenities', title: 'Toilet, power, skip and storage', pos: [-5.4, 1.6, 14.6], stand: [-2, 22], from: 4,
        summary: 'Welfare facilities and a safe temporary supply are needed from the first day of work.',
        learn: [['Provide toilet facilities for workers on site. Confirm numbers and standards in the OHS Regulations 2017.', 'C'], ['Temporary power is installed by a licensed electrician with RCD protection. Leads are tested and tagged.', 'T'], ['Store materials inside the fence and clear of the stormwater path. Skip bins sit on the block unless a council permit is held for the road.', 'C']] },
    ],
  };
}

/* ---------- 3D detail models (coordinates are local; the engine places them in a separate room) ---------- */
const details = {
  entry: {
    title: 'Stabilised construction entry', sub: 'Rock pad on geotextile over compacted subgrade', floor: -0.75, gridSize: 8,
    camera: { pos: [4.6, 3.2, 6], target: [0, 0.1, 0] },
    build(kit) {
      const { THREE, C, mat, box } = kit;
      const mk = () => new THREE.Group();
      const sub = mk(); sub.add(box(3, 0.3, 4, mat(0xffffff, { tex: 'soil' }), 0, -0.15, 0));
      const geo = mk(); geo.add(box(3.04, 0.012, 4.04, mat(0xe6e9ec), 0, 0.006, 0));
      const rock = mk(); rock.add(box(3, 0.18, 4, mat(0xb3b2ad, { tex: 'concrete', bump: 1.6 }), 0, 0.1, 0));
      rock.add(kit.stones(2600, { x0: -1.48, x1: 1.48, z0: -1.98, z1: 1.98, y: 0.19, size: 0.03, seed: 11 }));
      const kerb = mk();
      kerb.add(box(3.4, 0.14, 0.25, mat(C.kerb), 0, 0.07, 2.35));
      kerb.add(box(3, 0.035, 0.8, mat(C.steel), 0, 0.17, 2.28));
      const bund = mk();
      for (let i = 0; i < 6; i++) bund.add(box(0.5, 0.17, 0.26, mat(0xd8c9a0), -0.9 + i * 0.36 + (i > 2 ? -0.05 : 0), 0.21 + (i % 2) * 0.17, -2.1));
      const extras = mk();
      extras.add(box(8, 0.02, 2.6, mat(C.asphalt), 0, 0.005, 3.75));
      return { extras, parts: [
        { id: 'sub', name: 'Compacted subgrade', group: sub, explode: [0, -0.4, 0], anchor: [1.5, -0.15, 0.6], flag: 'T', spec: 'Existing soil, stripped of topsoil and compacted.',
          desc: 'A firm base so the rock does not sink into soft ground. Strip the topsoil, shape a slight fall back to the block, and compact before laying fabric.' },
        { id: 'geo', name: 'Geotextile separation fabric', group: geo, explode: [0, 0.05, 0], anchor: [1.52, 0.006, -1.2], flag: 'T', spec: 'Non-woven geotextile, lapped and pinned.',
          desc: 'Stops the rock being pushed into the subgrade and stops mud pumping up through it. Lap joints and pin them down.' },
        { id: 'rock', name: 'Angular rock pad', group: rock, explode: [0, 0.45, 0], anchor: [1.5, 0.15, 1.0], flag: 'C', spec: 'Clean, hard, angular rock. Confirm size and depth with council or EPA guidance.',
          desc: 'The rough surface knocks mud off tyres. It clogs with soil over time, so top up or replace it when the voids fill.' },
        { id: 'kerb', name: 'Kerb and crossover protection', group: kerb, explode: [0, 0.8, 0.4], anchor: [0.9, 0.17, 2.3], flag: 'C', spec: 'Steel plates or rubber ramps over the kerb and crossover.',
          desc: 'Spreads the load of trucks so the kerb and footpath are not cracked. Damage to council assets is the builder\'s cost. Confirm whether council asks for an asset protection permit.' },
        { id: 'bund', name: 'Diversion bund', group: bund, explode: [0, 0.8, -0.5], anchor: [-0.5, 0.3, -2.1], flag: 'T', spec: 'Sandbags or a low earth mound across the top of the pad.',
          desc: 'Turns site runoff along the sediment fence instead of letting it run straight across the pad and onto the street.' },
      ] };
    },
  },

  silt: {
    title: 'Sediment fence', sub: 'Section through a trenched-in geotextile fence', floor: -0.52, gridSize: 6,
    camera: { pos: [3.4, 1.7, 3.3], target: [0, 0.2, 0] },
    build(kit) {
      const { THREE, C, mat, ghost, box, cyl, rod } = kit;
      const mk = () => new THREE.Group();
      const ground = mk(), soil = mat(0xffffff, { tex: 'soil' });
      ground.add(box(4, 0.5, 1.2, soil, 0, -0.25, 0.75));
      ground.add(box(4, 0.5, 1.2, soil, 0, -0.25, -0.75));
      ground.add(box(4, 0.35, 0.3, mat(0x9a8a7a, { tex: 'soil' }), 0, -0.325, 0));
      const fill = mk(); fill.add(box(3.98, 0.15, 0.15, mat(0x8a6a48), 0, -0.075, 0.075));
      const fabric = mk(); const fm = mat(C.black, { side: THREE.DoubleSide, transparent: true, opacity: 0.88 });
      fabric.add(new THREE.Mesh(new THREE.PlaneGeometry(3.98, 0.8), fm)); fabric.children[0].position.set(0, 0.25, 0);
      const flap = new THREE.Mesh(new THREE.PlaneGeometry(3.98, 0.15), fm); flap.rotation.x = Math.PI / 2; flap.position.set(0, -0.145, 0.075); fabric.add(flap);
      const posts = mk(); for (const x of [-1.5, 0, 1.5]) posts.add(cyl(0.022, 0.95, mat(C.steel), x, 0.2, -0.05, 8));
      const wire = mk(); wire.add(rod([-1.7, 0.58, -0.05], [1.7, 0.58, -0.05], 0.006, mat(0x333840)));
      const extras = mk();
      const arrowMat = mat(C.orange);
      extras.add(rod([0, 0.06, 1.1], [0, 0.06, 0.4], 0.02, arrowMat));
      const cone = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.15, 12), arrowMat); cone.rotation.x = -Math.PI / 2; cone.position.set(0, 0.06, 0.32); extras.add(cone);
      return { extras, parts: [
        { id: 'ground', name: 'Ground and toe trench', group: ground, explode: [0, 0, 0.0], anchor: [1.9, -0.25, 0.8], flag: 'T', spec: 'Trench about 150 mm deep and wide, on the uphill side of the posts.',
          desc: 'Cut the trench along a contour so water spreads along the fence rather than running along it. The slope arrow shows runoff arriving from the uphill side.' },
        { id: 'fill', name: 'Compacted backfill', group: fill, explode: [0, 0.55, 0.3], anchor: [1.2, -0.07, 0.075], flag: 'T', spec: 'Soil returned to the trench and tamped.',
          desc: 'Holds the buried toe of the fabric. If it is not compacted water simply flows under the fabric.' },
        { id: 'fabric', name: 'Geotextile sediment fabric', group: fabric, explode: [0, 0.15, -0.45], anchor: [-1.0, 0.45, 0], flag: 'T', spec: 'About 0.9 m fabric, with about 150 mm buried and turned into the trench.',
          desc: 'Lets water through slowly and traps the soil. Fix it to the uphill face of the posts, so the water pushing on the fabric presses it against them.' },
        { id: 'posts', name: 'Posts', group: posts, explode: [0, 0.1, -1.0], anchor: [1.5, 0.5, -0.05], flag: 'T', spec: 'Star pickets or hardwood stakes at about 2 m or closer.',
          desc: 'Support the fabric and take the load of trapped sediment. Drive them into undisturbed ground, not into the loose backfill.' },
        { id: 'wire', name: 'Top support wire or ties', group: wire, explode: [0, 0.45, -1.0], anchor: [-1.7, 0.58, -0.05], flag: 'T', spec: 'Tensioned wire or ties along the top of the fabric.',
          desc: 'Stops the fabric sagging between posts. Clear sediment before it is half the fence height, or the fence will fail.' },
      ] };
    },
  },

  fence: {
    title: 'Temporary site fence panel', sub: 'Panel, stands, clamps, weights, stay and cloth', floor: 0, gridSize: 6,
    camera: { pos: [3.4, 1.8, 4.2], target: [0, 0.9, 0] },
    build(kit) {
      const { THREE, C, mat, ghost, box, cyl, rod, lineSet } = kit;
      const mk = () => new THREE.Group(), steel = mat(C.steel, { metalness: 0.4, roughness: 0.5 });
      const b = 0.06, H = 1.8, Wd = 2.4;
      const panel = mk();
      for (const [a, c] of [[[-Wd / 2, b, 0], [Wd / 2, b, 0]], [[-Wd / 2, b + H, 0], [Wd / 2, b + H, 0]], [[-Wd / 2, b, 0], [-Wd / 2, b + H, 0]], [[Wd / 2, b, 0], [Wd / 2, b + H, 0]]]) panel.add(rod(a, c, 0.013, steel));
      const segs = [];
      for (let x = -Wd / 2 + 0.1; x < Wd / 2; x += 0.1) segs.push([[x, b, 0], [x, b + H, 0]]);
      for (let y = b + 0.1; y < b + H; y += 0.1) segs.push([[-Wd / 2, y, 0], [Wd / 2, y, 0]]);
      panel.add(lineSet(segs, 0x8d98a5));
      const stand = mk();
      for (const x of [-1.2, 1.2]) { stand.add(box(0.07, 0.04, 0.9, steel, x, 0.02, 0)); stand.add(cyl(0.028, 0.5, steel, x, 0.27, 0, 10)); }
      const weight = mk();
      for (const x of [-1.2, 1.2]) for (const z of [-0.28, 0.28]) weight.add(box(0.16, 0.12, 0.3, mat(0xffffff, { tex: 'concrete' }), x, 0.1, z));
      const clamp = mk();
      for (const x of [-1.2, 1.2]) for (const y of [0.45, 1.5]) clamp.add(cyl(0.038, 0.05, mat(C.orange), x, y, 0, 12));
      const brace = mk(); brace.add(rod([1.2, 1.7, 0], [1.2, 0.04, 1.3], 0.014, steel));
      const cloth = mk(); cloth.add(box(2.4, 1.8, 0.012, ghost(0x2e6b3a, 0.5), 0, 0.96, 0.04));
      return { parts: [
        { id: 'stand', name: 'Stands (feet)', group: stand, explode: [0, -0.35, 0], anchor: [-1.2, 0.02, 0.3], flag: 'T', spec: 'Steel feet with a socket for the panel upright.', desc: 'Hold the panel upright without digging. Face the feet inwards where the footpath is used.' },
        { id: 'weight', name: 'Concrete weights or sandbags', group: weight, explode: [0, 0.3, 0.6], anchor: [1.2, 0.1, -0.28], flag: 'T', spec: 'Concrete blocks or sandbags on each foot.', desc: 'Stops the panel blowing over in wind. Check them after storms, and replace split sandbags.' },
        { id: 'panel', name: 'Chain-mesh panel', group: panel, explode: [0, 0, 0], anchor: [-0.6, 1.2, 0], flag: 'T', spec: 'Typically 2.4 m wide by 1.8 m high.', desc: 'Keeps the public out of the site. Panels are fixed edge to edge so that there is no gap a child can pass through.' },
        { id: 'clamp', name: 'Coupler clamps', group: clamp, explode: [0, 0.35, 0.3], anchor: [1.2, 1.5, 0], flag: 'T', spec: 'Two or more clamps per joint.', desc: 'Join adjacent panels and hold them to the feet. Tighten them every time panels are moved.' },
        { id: 'brace', name: 'Stay brace', group: brace, explode: [0, 0.3, 0.8], anchor: [1.2, 0.9, 0.65], flag: 'T', spec: 'Angled stay at corners and at the gate.', desc: 'Needed where wind or pushing could topple a run, such as corners, gates and the ends of runs.' },
        { id: 'cloth', name: 'Shade cloth or hoarding (optional)', group: cloth, explode: [0, 0, 1.1], anchor: [0.6, 1.3, 0.04], flag: 'T', spec: 'Dust and screening cloth, tied at close spacing.', desc: 'Reduces dust and screens the site. It makes the fence a sail, so tie it well and add stays. Check council rules for hoarding.' },
      ] };
    },
  },
};

/* ---------- 2D drawings ---------- */
function sitePlan() {
  const px = (x, z) => [60 + (x + 7.5) * 16, 20 + (z + 17.5) * 16];
  const [bx0, by0] = px(BLOCK.x0, BLOCK.z0), [bx1, by1] = px(BLOCK.x1, BLOCK.z1);
  const [hx0, hy0] = px(HOUSE.x0, HOUSE.z0), [hx1, hy1] = px(HOUSE.x1, HOUSE.z1);
  const path = (pts, cls) => `<polyline class="${cls}" fill="none" points="${pts.map(([x, z]) => px(x, z).join(',')).join(' ')}"/>`;
  const fx = 0.35, f0 = px(BLOCK.x0 + fx, BLOCK.z0 + fx), f1 = px(BLOCK.x1 - fx, BLOCK.z1 - fx), g0 = px(2.9, 0)[0], g1 = px(6.1, 0)[0];
  const body = [
    R(0, 0, 760, 620, 'd-bg'),
    R(bx0 - 40, by1, bx1 - bx0 + 80, 36, 'd-road'), T(bx0 + 120, by1 + 23, 'STREET', { anchor: 'middle', cls: 'd-mute' }),
    R(bx0, by0, bx1 - bx0, by1 - by0, 'd-lot'),
    `<polyline class="d-fenceline" fill="none" points="${f0.join(',')} ${px(BLOCK.x1 - fx, BLOCK.z0 + fx).join(',')} ${f1[0]},${f1[1]} ${g1},${f1[1]}"/>`,
    `<polyline class="d-fenceline" fill="none" points="${g0},${f1[1]} ${px(BLOCK.x0 + fx, BLOCK.z1 - fx).join(',')} ${f0.join(',')}"/>`,
    L(bx0, by1, bx1, by1, 'd-boundary'),
    R(hx0, hy0, hx1 - hx0, hy1 - hy0, 'd-house'),
    T((hx0 + hx1) / 2, (hy0 + hy1) / 2, 'HOUSE', { anchor: 'middle', cls: 'd-bold' }),
    T((hx0 + hx1) / 2, (hy0 + hy1) / 2 + 16, '11 m x 17 m slab (illustrative)', { anchor: 'middle', cls: 'd-mute' }),
    R(g0, hy1, g1 - g0, by1 - hy1 - 14, 'd-drive'), T((g0 + g1) / 2, hy1 + 30, 'Entry', { anchor: 'middle', cls: 'd-mute' }),
    L(bx0, by1 - 6, g0, by1 - 6, 'd-silt'), L(g1, by1 - 6, bx1, by1 - 6, 'd-silt'),
    path([[-3.6, -5.5], [-3.6, -17.5]], 'd-svc sewer'), path([[-2, 17.2], [-2, 11.5]], 'd-svc water'), path([[1, 20.3], [1, 11.5]], 'd-svc storm'),
    path([[9, 21], [5.5, 18.5], [5.5, 11.5]], 'd-svc power'), path([[-6.3, 20.3], [-6.3, 11.5]], 'd-svc gas'),
    R(...px(-5.9, 14.1), 16, 16, 'd-site'), T(...px(-5.4, 13.6), 'WC', { anchor: 'middle', cls: 'd-mute' }),
    dim(bx1 + 24, hy1, bx1 + 24, by1, '6 m front'), dim(bx1 + 24, by0, bx1 + 24, hy0, '12 m rear'),
    dim(bx0, hy0 - 14, hx0, hy0 - 14, '2 m'), dim(hx1, hy0 - 14, bx1, hy0 - 14, '2 m'),
    dim(bx0, by0 - 14, bx1, by0 - 14, '15 m'),
    call(1, bx0, by1, bx0 - 30, by1 - 40), call(2, ...px(-2, 15), bx0 - 30, by1 - 120), call(3, ...px(0, 8), bx0 - 30, hy0 + 40),
    call(4, ...px(6.1, 17.15), bx1 + 60, by1 - 40), call(5, g0 + 20, by1 - 6, bx1 + 60, by1 - 90),
    // north arrow and legend
    arrow(690, 110, 690, 50), T(690, 40, 'N', { anchor: 'middle', cls: 'd-bold' }),
    T(430, 30, 'Legend', { cls: 'd-bold' }),
    ...[['sewer', 'Sewer (rear connection)'], ['water', 'Water supply'], ['storm', 'Stormwater to kerb'], ['power', 'Power service'], ['gas', 'Gas service']].map(([c, t], i) => `${L(430, 52 + i * 22, 462, 52 + i * 22, `d-svc ${c}`)}${T(472, 56 + i * 22, t)}`),
    `${L(430, 166, 462, 166, 'd-fenceline')}${T(472, 170, 'Temporary fence')}`, `${L(430, 188, 462, 188, 'd-silt')}${T(472, 192, 'Sediment fence')}`,
    T(430, 232, '1  Title boundary and pegs', {}), T(430, 252, '2  Service connections', {}), T(430, 272, '3  Footprint and setbacks', {}), T(430, 292, '4  Stabilised entry', {}), T(430, 312, '5  Sediment fence', {}),
    T(430, 352, 'Illustrative block only.', { cls: 'd-mute' }), T(430, 370, 'Setbacks and service locations come from', { cls: 'd-mute' }), T(430, 388, 'the endorsed plans and authority plans.', { cls: 'd-mute' }),
  ].join('');
  return svg(760, 620, body, 'Site plan with setbacks, services, fences and entry');
}

function pathway() {
  const steps = [
    ['1', 'Check planning', 'Zone and overlays. Planning permit needed?', 'T'],
    ['2', 'Design and reports', 'Plans, engineer, soil report, energy rating', 'T'],
    ['3', 'Contract and Home Warranty', 'Major contract over $10,000. Warranty over $20,000', 'V'],
    ['4', 'Building permit application', 'Surveyor checks registration and insurance evidence', 'C'],
    ['5', 'Permit issued', 'Form 2 lists the mandatory notification stages', 'V'],
    ['6', 'Site establishment', 'Fence, sign, erosion control, safety plan', 'T'],
    ['7', 'Build and notify', 'Stop at each nominated stage until inspected', 'V'],
    ['8', 'Completion', 'Final inspection, occupancy permit or certificate', 'C'],
  ];
  const col = { V: 'd-fv', T: 'd-ft', C: 'd-fc' };
  const parts = [R(0, 0, 720, 800, 'd-bg')];
  steps.forEach(([n, t, d, f], i) => {
    const y = 24 + i * 94;
    parts.push(R(120, y, 480, 66, 'd-box', 10), `<circle cx="150" cy="${y + 33}" r="16" class="d-bub"/>`, `<text x="150" y="${y + 38}" text-anchor="middle" class="d-num">${n}</text>`,
      T(180, y + 28, t, { cls: 'd-bold' }), T(180, y + 48, d, { cls: 'd-mute' }), `<circle cx="578" cy="${y + 33}" r="7" class="${col[f]}"/>`);
    if (i < steps.length - 1) parts.push(arrow(360, y + 66, 360, y + 92));
  });
  parts.push(T(120, 784, 'Dots: green verified, amber typical, red confirm. Time limits and exact forms: confirm with your building surveyor.', { cls: 'd-mute' }));
  return svg(720, 800, parts.join(''), 'Victorian new-home permit pathway');
}

const drawings = [
  { id: 'site', title: 'Site plan', scale: 'Illustrative, about 1:60 on the page', svg: sitePlan(),
    notes: ['Setbacks of 6 m front, 2 m sides and 12 m rear are examples. The planning permit and endorsed plans set the real ones.', 'Services run where the authority plans show them. The colours here are for learning.', 'The temporary fence has a gap for the stabilised entry. Sediment fence runs along the low (street) side.'] },
  { id: 'pathway', title: 'Permit pathway', scale: 'Flow, not to scale', svg: pathway(),
    notes: ['Order matters in the exam: planning, then building permit, with the contract and the insurance cover in place before the permit is issued.', 'The permit lists the mandatory notification stages. Do not go past a stage until it has been inspected.', 'Confirm time limits for starting and finishing under the Building Act 1993 with your surveyor.'] },
];

const howto = [
  ['Check what approvals the land needs', 'Look up the zone and overlays (heritage, bushfire, flood, vegetation) in the planning scheme, and read the title for easements and covenants. A planning permit can be needed before the building permit.', 'Town planner or council', 'T'],
  ['Assemble the design team', 'Building designer or architect, structural engineer, geotechnical engineer, energy rater and, if the site needs it, a bushfire consultant. Each produces a document the building surveyor will ask for.', 'Owner and builder', 'T'],
  ['Survey the site and locate services', 'A feature and level survey fixes boundaries, levels, trees and existing structures. Lodge a Dial Before You Dig enquiry and collect service plans.', 'Land surveyor', 'T'],
  ['Get the soil report', 'Boreholes and a report classify the site under AS 2870 (A, S, M, H1, H2, E, P). The footing design follows from this class.', 'Geotechnical engineer', 'T'],
  ['Estimate and quote', 'Work out quantities and take trade and supplier quotes. Compare inclusions, exclusions, validity period and GST. Add allowances, overheads and margin.', 'Builder', 'T'],
  ['Sign a compliant major domestic building contract', 'A written contract is needed for domestic building work over $10,000, and only a registered builder may enter it. The deposit is capped at 10% under $20,000 and 5% at $20,000 or more.', 'Builder and owner', 'V', 'cavPay'],
  ['Arrange Home Warranty cover', 'Under contracts signed on or after 1 July 2026, eligible work over $20,000 and up to three storeys needs Home Warranty cover. The builder pays the premium before the earlier of 10 business days after signing or the work starting, and the BPC gives the owner a Notice of Cover once it accepts the premium. For contracts before that date, DBI applied over $16,000.', 'Builder', 'V', 'bpcHW'],
  ['Appoint the building surveyor and apply for the permit', 'The relevant building surveyor (RBS) checks the documents and, before issuing the permit, that the named builder matches the contract and the insurance evidence (Building Act 1993 s 24A). What the surveyor now asks for under Home Warranty is Confirm.', 'Owner or builder and RBS', 'C', 'bpcDBI'],
  ['Receive the permit and read the stage list', 'The RBS lists the mandatory notification stages on the permit (Form 2). Builders must notify the RBS at each stage and not go beyond it until it has been inspected.', 'Builder', 'V', 'vbaMand'],
  ['Write the safety plan and run inductions', 'Site-specific safety plan, safe work method statements for high-risk construction work, and inductions for every worker. Keep records.', 'Builder', 'C'],
  ['Establish the site', 'Fence, permit sign, sediment fence and stabilised entry first. Then toilet, temporary power, skip and storage. Photograph the neighbours\' boundaries and street assets before starting.', 'Builder and hire companies', 'T'],
  ['Order long-lead items', 'Trusses, windows, kitchen and tiles can have long lead times. Order early and tie delivery dates to the programme.', 'Builder', 'T'],
];

const trades = [
  { t: 'Land surveyor', role: 'Feature and level survey, boundary re-establishment, later set-out and levels.', when: 'Before design is finalised', reg: 'Licensed surveyor (Victoria)', ask: ['Scope: feature and level survey, title boundaries, re-establishment, set-out later', 'Turnaround and cost of a return visit for set-out', 'Deliverable: CAD and PDF'] },
  { t: 'Geotechnical engineer', role: 'Boreholes, soil classification to AS 2870 and footing recommendations.', when: 'Before the footing design', reg: 'Engineer with geotechnical experience', ask: ['Number and depth of bores', 'Whether the report suits the engineer\'s footing design', 'Cost of re-test if site is filled'] },
  { t: 'Structural engineer', role: 'Footing, slab, frame, lintel and steel design with inspection certificates.', when: 'Before permit application', reg: 'Registered engineer (confirm the current registration scheme)', ask: ['Scope: footings, slab, frame, steel, roof tie-down', 'Site visits and inspection certificates included', 'Revisions if the design changes'] },
  { t: 'Energy rater', role: 'NatHERS or other compliance report for the building permit.', when: 'Alongside design', reg: 'Accredited assessor', ask: ['Which route the report uses', 'Revisions after window or layout changes', 'Final compliance sign-off after build'] },
  { t: 'Building surveyor (RBS)', role: 'Assesses documents, issues the permit, nominates the mandatory stages, inspects and issues the occupancy permit.', when: 'Appointed before application', reg: 'Registered building surveyor (BPC)', ask: ['Permit fee and who lodges levies', 'Inspection fee per visit and the stage list', 'Typical turnaround for permit and inspections'] },
  { t: 'Insurer and the BPC', role: 'The Home Warranty premium goes to the BPC. Contract works and public liability cover come from an insurer.', when: 'Before the work starts', reg: 'BPC; approved insurer', ask: ['Premium for this contract price', 'Policy conditions and exclusions', 'How the Notice of Cover or certificate is issued'] },
  { t: 'Site establishment hire', role: 'Temporary fence, toilet, skip bins and site sheds.', when: 'Before work starts', reg: 'Hire companies', ask: ['Hire period and weekly rate', 'Delivery, removal and damage charges', 'Gates, wind rating and shade cloth'] },
  { t: 'Electrician (temporary power)', role: 'Temporary supply, board with RCDs, test and tag.', when: 'Site establishment', reg: 'Licensed electrical contractor (Energy Safe Victoria)', ask: ['Supply authority application included', 'RCD protection and test and tag', 'Removal at the end'] },
];

const materials = [
  ['Temporary fence panels, stands, clamps', '2.4 m x 1.8 m panels, concrete or sandbag weights, couplers', 'Fence hire company', 'T', 'Hire for the build. Include gate and wind bracing.'],
  ['Sediment fence', 'Geotextile fabric with posts and ties', 'Erosion-control or landscape supplier. Bunnings may stock it, check the store', 'C', 'Use fabric rated for sediment control.'],
  ['Star pickets', '1.8 m steel pickets, driven in with a post driver', 'Bunnings', 'T', 'For sediment fence and signs.'],
  ['Geotextile fabric', 'Non-woven, for under the entry rock', 'Landscape supplier or Bunnings', 'T', 'Lap and pin it.'],
  ['Entry rock', 'Clean, hard, angular rock, size and depth to council or EPA guidance', 'Quarry or landscape supplier', 'C', 'Ask the supplier for delivery by tipper.'],
  ['Set-out pegs and profile rails', '90 x 45 MGP10 H2 blue pine, 3.0 m, cut for pegs, stakes and rails', 'Bunnings (90 x 45 MGP10 H2 blue pine 3.0 m, listed in the verified source)', 'V', 'MGP10 means machine graded pine, stress grade 10.', 'bunnMGP'],
  ['String line, pegs, paint, level', 'String, marker paint, laser or dumpy level', 'Bunnings', 'T', 'For the set-out in Step 2.'],
  ['Safety signs and PPE', 'Site signs, hi-vis, boots, glasses, hearing protection, first-aid kit', 'Bunnings or a safety supplier', 'T', 'Match the safety plan.'],
  ['Portable toilet', 'Hire with weekly service', 'Portable toilet hire', 'T', 'Check the service frequency in the quote.'],
  ['Skip bin', 'Size to suit stage, weekly collection', 'Skip bin company', 'T', 'On the block, or with a council permit for the road.'],
  ['Temporary power board', 'Double-insulated board with RCDs', 'Electrician or electrical wholesaler', 'T', 'Installed by a licensed electrician.'],
];

const quotes = [
  { who: 'Land surveyor', n: '2 to 3', what: ['Feature and level survey', 'Re-establishment of boundaries', 'Set-out and levels for the slab (price a return visit)'] },
  { who: 'Geotechnical engineer', n: '2', what: ['Number and depth of bores', 'Classification report to AS 2870', 'Footing recommendations'] },
  { who: 'Building surveyor (RBS)', n: '3', what: ['Permit fee and levies', 'Fee per inspection and the number of stages', 'Occupancy permit and final inspection'] },
  { who: 'Structural engineer and energy rater', n: '2 each', what: ['Scope and drawings issued', 'Site visits and inspection certificates', 'Revisions if the design changes'] },
  { who: 'Insurer (contract works and liability)', n: '2 or more', what: ['Premium for the contract price', 'Exclusions and conditions', 'When the certificate is issued'] },
  { who: 'Site establishment hire', n: '3', what: ['Fence, toilet and skip, with delivery and collection', 'Hire period and extensions', 'Damage and cleaning charges'] },
];
const quoteTips = [
  'Send every supplier the same drawings and scope so quotes can be compared line by line.',
  'Ask for inclusions, exclusions, price validity, GST and variation rates in writing.',
  'Check the licence or registration of every trade before accepting.',
  'Ask what is not included. The cheapest quote is often the one with the most exclusions.',
  'Keep every quote on file. They are evidence of estimating and quotation work for the BPC application.',
];

const inspections = [
  ['Building permit in force before any work', 'Building surveyor', 'Before site establishment', 'Permit issued with the stage list on Form 2.', 'C'],
  ['Builder registration and insurance evidence', 'Building surveyor', 'Before the permit is issued', 'Builder named on the permit matches the contract and the insurance evidence.', 'C', 'bpcDBI'],
  ['Mandatory notification stages understood', 'Builder', 'When the permit is received', 'Every stage on Form 2 is in the programme. You must not go past a stage until it is inspected.', 'V', 'vbaMand'],
  ['Council asset protection or road permits', 'Council', 'Before site establishment', 'Permits held for crossover protection, skips on the road or footpath occupation, if required.', 'C'],
  ['Safety plan and inductions', 'Builder', 'Before the first worker', 'Safety plan written, safe work method statements ready, inductions recorded.', 'C'],
  ['Erosion and sediment controls in place', 'Builder', 'Before earthworks', 'Sediment fence trenched in, entry pad built, no bare soil leaving site.', 'T'],
  ['Time limits on the permit', 'Builder', 'From permit issue', 'Check when work must start and finish. Confirm under the Building Act 1993 with your surveyor.', 'C'],
];

const exam = [
  ['What is the contract price above which a major domestic building contract is required, and who may enter into it?', 'Over $10,000, and only a registered builder may enter into it.', 'V'],
  ['At what price is Home Warranty cover required, and when must the premium be paid?', 'Over $20,000, for work up to three storeys under contracts signed on or after 1 July 2026. The premium is due before the earlier of 10 business days after signing or the work starting. Before that, DBI applied over $16,000.', 'V'],
  ['What is the maximum deposit for a major domestic building contract?', '10% if the price is under $20,000. 5% if it is $20,000 or more.', 'V'],
  ['In a contract to build all stages, what are the listed stage payment limits?', 'Base 10%, frame 15%, lock-up 35%, fixing 25%, with the balance after fixing as the final payment. Confirm the final balance and the 2025 amendments.', 'C'],
  ['Who lists the mandatory notification stages and where?', 'The relevant building surveyor, on the building permit (Form 2).', 'V'],
  ['What must a builder do at a mandatory notification stage?', 'Notify the RBS and not go beyond the stage until it has been inspected.', 'V'],
  ['What must the building surveyor check before issuing the permit?', 'That the builder named matches the contract and the insurance evidence (Building Act 1993 s 24A). What counts as the evidence under Home Warranty is Confirm.', 'C'],
  ['Put in order: contract, building permit, Home Warranty cover, site establishment, planning check.', 'Planning check, contract, Home Warranty cover, building permit, site establishment. The contract and the insurance cover are in place before the permit is issued. The exact timing under Home Warranty is Confirm.', 'C'],
  ['Why does a stabilised entry exist?', 'To remove mud from truck wheels before they reach the road, so sediment does not enter the stormwater system.', 'T'],
  ['Where does a sediment fence go and what does it need?', 'Along a contour on the downhill side of the disturbed area, with the toe buried in a trench and the fabric fixed to the uphill face of the posts.', 'T'],
];

export default {
  n: 1, id: 'permits', title: 'Permits, contract and site establishment', subtitle: 'Everything that has to be in place before the first shovel goes in the ground.',
  phases, build, details, drawings, howto, trades, materials, quotes, quoteTips, inspections, exam,
  sources: ['bpcHW', 'bpcHWb', 'bpcDBI', 'cavPay', 'cavContract', 'vbaMand', 'bpcMI01', 'bpcWork', 'hiaAct', 'bunnMGP'],
  caution: 'Home Warranty replaced Domestic Building Insurance for contracts signed on or after 1 July 2026, so the old DBI figures ($16,000, six years) apply only to earlier contracts. Deposit and stage-payment rules are changing under the Domestic Building Contracts Amendment Act 2025, with the limits to be set by regulation. Check current figures on the CAV site before relying on any figure here.',
};

// 3D engine: one renderer, three ways to look (game-style walk, orbit overview, zoomable detail room).
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { GTAOPass } from 'three/addons/postprocessing/GTAOPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { Sky } from 'three/addons/objects/Sky.js';
import { EXRLoader } from 'three/addons/loaders/EXRLoader.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { kit, disposeTree } from './kit.js';

const EYE = 1.7, RADIUS = 0.45, WALK = 4.2, RUN = 8.5;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const SKY = new THREE.Color(0xcfe3f2), HAZE = 0xc9d8e6, DETAIL_BG = new THREE.Color(0xe8edf3);
const SUN_DIR = new THREE.Vector3(32, 52, 26).normalize();
const sstep = (t) => t * t * (3 - 2 * t);
// Section-cut hatch by texture: 1 masonry, 2 concrete, 3 earth, 4 timber, 5 insulation. TEX_TONE is each texture's average colour.
const HATCH = { brick: 1, concrete: 2, paving: 2, soil: 3, sand: 3, timber: 4 };
const TEX_TONE = { brick: 0xad5a40, concrete: 0xbfc1c3, paving: 0xc9cbcd, soil: 0x7b5e41, sand: 0xdcc58f, timber: 0xd2a868, roofTile: 0x9ea4ab, metalRib: 0xbfc5cb, grass: 0x7ea867, asphalt: 0x464b53 };
const el = (tag, cls, parent) => { const e = document.createElement(tag); if (cls) e.className = cls; parent?.appendChild(e); return e; };
const svgEl = (tag, parent) => { const e = document.createElementNS('http://www.w3.org/2000/svg', tag); parent?.appendChild(e); return e; };

export class Stage {
  constructor(host, hud, cb = {}, opts = {}) {
    this.host = host; this.hud = hud; this.cb = cb;
    this.mode = 'orbit'; this.base = 'orbit'; this.phase = 0; this.active = true;
    this.w = 0; this.h = 0;
    this.yaw = 0; this.pitch = -0.05; this.pos = new THREE.Vector2(0, 0);
    this.keys = new Set(); this.joy = { x: 0, y: 0 };
    this.colliders = []; this.layers = []; this.pins = []; this.parts = []; this.tickers = [];
    this.exNow = 0; this.exGoal = 0; this.focus = null; this.selected = null; this.locked = false; this.labelsOn = true;
    this.orbitSaved = null; this.def = null; this.detailKey = null;
    this._v = new THREE.Vector3(); this._b = new THREE.Box3(); this._ray = new THREE.Raycaster(); this._m = new THREE.Vector2();

    const r = this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    r.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    r.shadowMap.enabled = true; r.shadowMap.type = THREE.PCFShadowMap;
    r.toneMapping = THREE.AgXToneMapping; r.toneMappingExposure = 1.0;   // AgX rolls highlights off like a camera, so sunlit render and sky read as a photo, not a cartoon
    this.coarse = !!window.matchMedia?.('(pointer: coarse)').matches;
    this.quality = opts.quality || (this.coarse ? 'standard' : 'high');
    r.localClippingEnabled = true;   // the section cut clips the house only, never the ground, sky or neighbours
    r.domElement.className = 'gl'; r.domElement.tabIndex = 0;
    r.domElement.setAttribute('aria-label', '3D view. Use W A S D or arrow keys to walk, drag to look, E to open a detail.');
    host.prepend(r.domElement);

    this.scene = new THREE.Scene();
    this.scene.background = SKY; this.scene.fog = new THREE.Fog(HAZE, 60, 330);
    this.camera = new THREE.PerspectiveCamera(62, 1, 0.05, 600);
    this.camera.rotation.order = 'YXZ';
    this._buildSky();
    this.scene.add(new THREE.HemisphereLight(0xeaf3ff, 0x8a9a74, 0.12));   // a small fill; most ambient light now comes from the sky photo below
    const sun = this.sun = new THREE.DirectionalLight(0xfff0d6, 2.7);
    sun.position.copy(SUN_DIR).multiplyScalar(66); sun.target.position.set(0, 0, 6);
    sun.castShadow = true; sun.shadow.mapSize.setScalar(this.coarse ? 2048 : 4096); sun.shadow.radius = 3.5; sun.shadow.intensity = 0.88;
    this.mainShadow = { left: -40, right: 40, top: 40, bottom: -40, near: 8, far: 150 };
    Object.assign(sun.shadow.camera, this.mainShadow);
    sun.shadow.bias = -0.0003; sun.shadow.normalBias = 0.035;
    this.scene.add(sun, sun.target);
    this.world = new THREE.Group(); this.detailRoot = new THREE.Group();
    this.detailRoot.position.set(2000, 0, 0); this.detailRoot.visible = false;
    this.scene.add(this.world, this.detailRoot);
    this.marker = new THREE.Mesh(new THREE.RingGeometry(0.26, 0.36, 40), new THREE.MeshBasicMaterial({ color: 0xff7a1a, transparent: true, opacity: 0.9, depthTest: false, toneMapped: false }));
    this.marker.rotation.x = -Math.PI / 2; this.marker.renderOrder = 20; this.marker.visible = false; this.marker.userData.noAO = true;
    this.scene.add(this.marker);
    this.walkTo = null; this.glide = null; this.stuck = 0; this.stop = null; this.map = null; this._mapN = 0;

    this.controls = new OrbitControls(this.camera, r.domElement);
    Object.assign(this.controls, { enableDamping: true, dampingFactor: 0.08, enabled: true, screenSpacePanning: true });
    this.controls.addEventListener('start', () => { this.focus = null; });

    // HUD layers
    hud.dataset.mode = 'orbit';
    this.pinLayer = el('div', 'pins', hud);
    this.leaders = svgEl('svg', hud); this.leaders.setAttribute('class', 'leaders');
    this.labelLayer = el('div', 'labels', hud);
    this.fadeEl = el('div', 'fade', hud);
    this.joyEl = el('div', 'joy', hud); this.knob = el('div', 'knob', this.joyEl);
    this.mapEl = el('canvas', 'minimap', hud); this.mapEl.setAttribute('aria-label', 'Site plan. Tap or click a spot to walk there.'); this.mapEl.style.display = 'none';
    this.mapCtx = this.mapEl.getContext('2d');
    this._bindInput();

    this.timer = new THREE.Timer();
    new ResizeObserver(() => this.resize()).observe(host);
    this.resize();
    r.setAnimationLoop((ts) => this._tick(ts));
  }

  /* ---------- sky, light and post-processing ---------- */
  _buildSky() {
    const mat = new THREE.ShaderMaterial({
      side: THREE.BackSide, depthWrite: false, fog: false, toneMapped: false,
      uniforms: { top: { value: new THREE.Color(0x3f86cf) }, hor: { value: new THREE.Color(0xcfe3f2) }, gnd: { value: new THREE.Color(0x93a083) }, sunDir: { value: SUN_DIR.clone() }, sunK: { value: 1 } },
      vertexShader: 'varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: `uniform vec3 top; uniform vec3 hor; uniform vec3 gnd; uniform vec3 sunDir; uniform float sunK; varying vec3 vP;
        void main(){ vec3 d = normalize(vP); float h = d.y;
          vec3 c = h > 0.0 ? mix(hor, top, pow(h, 0.5)) : mix(hor, gnd, smoothstep(0.0, 0.3, -h));
          float s = max(dot(d, normalize(sunDir)), 0.0);
          c += vec3(1.0, 0.93, 0.75) * (pow(s, 900.0) * 1.4 + pow(s, 14.0) * 0.2) * sunK;
          gl_FragColor = vec4(c, 1.0);
          #include <colorspace_fragment>
        }`,
    });
    // Physically based sky (Preetham scattering) with slow drifting cloud, centred on the camera every frame.
    this.dome = new Sky(); this.dome.scale.setScalar(450);
    const su = this.dome.material.uniforms;
    su.turbidity.value = 2.4; su.rayleigh.value = 0.95; su.mieCoefficient.value = 0.004; su.mieDirectionalG.value = 0.86;
    su.cloudCoverage.value = 0.38; su.cloudDensity.value = 0.45; su.sunPosition.value.copy(SUN_DIR);
    this.dome.material.fog = false;
    this.dome.frustumCulled = false; this.dome.renderOrder = -10; this.dome.userData.noAO = true;
    this.scene.add(this.dome);
    this.band = this._horizon(); this.scene.add(this.band);
    // Sky-lit image-based lighting: bake a dimmer copy of the dome into a PMREM cube once.
    const pm = new THREE.PMREMGenerator(this.renderer), es = new THREE.Scene();
    const ed = new THREE.Mesh(new THREE.SphereGeometry(50, 32, 16), mat.clone());
    ed.material.uniforms.sunK.value = 0.12; es.add(ed);
    this.scene.environment = pm.fromScene(es, 0).texture; this.scene.environmentIntensity = 1.0;
    ed.geometry.dispose(); ed.material.dispose(); pm.dispose();
    this._loadHdri();
  }

  // Image-based light from a real outdoor sky photo: Poly Haven's park HDRI (CC0), the 512 px copy from @pmndrs/assets (CC0).
  // The gradient bake above lights the scene until it arrives, and stays if it cannot load.
  async _loadHdri() {
    try {
      const tex = await new EXRLoader().loadAsync(new URL('./env/park.exr', import.meta.url).href);
      tex.mapping = THREE.EquirectangularReflectionMapping;
      const pm = new THREE.PMREMGenerator(this.renderer), env = pm.fromEquirectangular(tex).texture; pm.dispose();
      this.scene.environment?.dispose(); this.scene.environment = env; this.scene.environmentIntensity = 0.6;
      this.hdri = tex;   // kept for photo mode, which needs a plain texture as its sky
    } catch (err) { console.warn('Sky photo unavailable, keeping the gradient light.', err); }
  }

  // Distant suburb: a ring of tree crowns and rooftops painted once, so the horizon is not an empty plane.
  _horizon() {
    const c = document.createElement('canvas'); c.width = 4096; c.height = 256;
    const x = c.getContext('2d'); let a = 3; const r = () => { a = (a * 16807) % 2147483647; return a / 2147483647; };
    for (let i = 0; i < 160; i++) { const px = r() * 4096, w = 40 + r() * 60, h = 12 + r() * 10, y = 224 - h; x.fillStyle = ['#8d9095', '#9b887a', '#7f868d', '#a39a8c'][Math.floor(r() * 4)]; x.beginPath(); x.moveTo(px, 232); x.lineTo(px, y); x.lineTo(px + w / 2, y - 11); x.lineTo(px + w, y); x.lineTo(px + w, 232); x.fill(); }
    for (let i = 0; i < 560; i++) { const px = r() * 4096, py = 150 + r() * 72, rr = 16 + r() * 34; x.fillStyle = ['#5d7358', '#677d60', '#55694f', '#71866a', '#7a8a6a'][Math.floor(r() * 5)]; x.beginPath(); x.arc(px, py, rr, 0, 6.2832); x.fill(); }
    x.fillStyle = '#6b7f62'; x.fillRect(0, 228, 4096, 28);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = THREE.RepeatWrapping; t.repeat.x = 3; t.anisotropy = 4;
    const band = new THREE.Mesh(new THREE.CylinderGeometry(190, 190, 26, 96, 1, true), new THREE.MeshBasicMaterial({ map: t, alphaTest: 0.5, side: THREE.BackSide }));
    band.position.y = 9; band.userData.noAO = true; band.raycast = () => {};
    return band;
  }

  _initComposer() {
    if (this.composer || this.quality !== 'high' || !this.w) return;
    try {
      const rt = new THREE.WebGLRenderTarget(this.w, this.h, { type: THREE.HalfFloatType, samples: 4 });
      const c = this.composer = new EffectComposer(this.renderer, rt);
      c.addPass(new RenderPass(this.scene, this.camera));
      const ao = this.gtao = new GTAOPass(this.scene, this.camera, this.w, this.h);
      ao.updateGtaoMaterial({ radius: 0.5, distanceExponent: 1.4, thickness: 1.2, scale: 1.3, samples: 12 });
      ao.updatePdMaterial({ lumaPhi: 10, depthPhi: 2, normalPhi: 3, radius: 6, rings: 2, samples: 12 });
      ao.blendIntensity = 0.9;
      // Ghost (transparent) parts and the sky must not cast ambient occlusion.
      const hide = ao._overrideVisibility.bind(ao);
      ao._overrideVisibility = () => { hide(); this.scene.traverse((o) => { if (o.visible && ((o.isMesh && o.material?.transparent && !o.userData.keepAO) || o.userData.noAO)) { ao._visibilityCache.push(o); o.visible = false; } }); };
      c.addPass(ao); c.addPass(new OutputPass());
      c.setSize(this.w, this.h);
    } catch (err) {
      console.warn('Post-processing unavailable, using standard quality.', err);
      this.composer = null; this.quality = 'standard'; this.cb.onQuality?.('standard');
    }
  }

  setQuality(q) { this.quality = q === 'high' ? 'high' : 'standard'; if (this.quality === 'high') this._initComposer(); this.cb.onQuality?.(this.quality); }

  // The one sun serves both rooms: move it (and shrink its shadow frustum) while a detail room is open.
  _sunTo(detail) {
    const sh = this.sun.shadow.camera;
    if (detail) { this.sun.position.set(2000 + 6.8, 11, 5.5); this.sun.target.position.set(2000, 0.3, 0); Object.assign(sh, { left: -5, right: 5, top: 5, bottom: -5, near: 1, far: 40 }); }
    else { this.sun.position.copy(SUN_DIR).multiplyScalar(66); this.sun.target.position.set(0, 0, 6); Object.assign(sh, this.mainShadow); }
    sh.updateProjectionMatrix();
  }

  // Thin dark edge lines on boxes, extrusions and fat cylinders make detail models read like drawings.
  _edges(group) {
    const list = [];
    group.traverse((o) => {
      if (!o.isMesh || o.isInstancedMesh || o.userData.noEdge) return;
      const g = o.geometry, t = g.type;
      if (t === 'BoxGeometry' || t === 'ExtrudeGeometry' || (t === 'CylinderGeometry' && g.parameters.radiusBottom >= 0.03)) list.push(o);
    });
    for (const o of list) {
      const l = new THREE.LineSegments(new THREE.EdgesGeometry(o.geometry, 25), new THREE.LineBasicMaterial({ color: 0x1f2b3a, transparent: true, opacity: 0.36 }));
      l.raycast = () => {}; l.userData.noAO = true; o.add(l);
    }
  }

  /* ---------- minimap ---------- */
  _layoutMap() {
    if (!this.map) return;
    const m = this.map, w = this.mapEl.clientWidth || 132, h = Math.round(w * (m.z1 - m.z0) / (m.x1 - m.x0)), d = Math.min(window.devicePixelRatio || 1, 2);
    this.mapEl.style.height = h + 'px'; this.mapEl.width = Math.round(w * d); this.mapEl.height = Math.round(h * d); this._mapW = w; this._mapH = h; this._mapD = d;
  }
  _mp(x, z) { const m = this.map; return [((x - m.x0) / (m.x1 - m.x0)) * this._mapW, ((z - m.z0) / (m.z1 - m.z0)) * this._mapH]; }
  _drawMap() {
    if (!this.map || this.mode === 'detail' || !this._mapW) return;
    const c = this.mapCtx, m = this.map, W = this._mapW, H = this._mapH;
    c.setTransform(this._mapD, 0, 0, this._mapD, 0, 0);
    c.fillStyle = '#9fc58a'; c.fillRect(0, 0, W, H);
    for (const sh of m.shapes) {
      const [x0, y0] = this._mp(sh.x0, sh.z0), [x1, y1] = this._mp(sh.x1, sh.z1);
      c.fillStyle = sh.fill; c.fillRect(x0, y0, x1 - x0, y1 - y0);
      if (sh.stroke) { c.strokeStyle = sh.stroke; c.lineWidth = 1; c.setLineDash(sh.dash ? [3, 2] : []); c.strokeRect(x0 + 0.5, y0 + 0.5, x1 - x0 - 1, y1 - y0 - 1); c.setLineDash([]); }
    }
    this.visibleHotspots().forEach((h) => {
      const [x, y] = this._mp(h.pos[0], h.pos[2]), i = this.hotspots.indexOf(h) + 1, on = this.near === h || this.stop === h;
      c.fillStyle = on ? '#e8590c' : '#16325c'; c.beginPath(); c.arc(x, y, on ? 6 : 5, 0, 6.2832); c.fill();
      c.fillStyle = '#fff'; c.font = '700 7.5px system-ui, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(String(i), x, y + 0.4);
    });
    if (this.walkTo) { const [x, y] = this._mp(this.walkTo.x, this.walkTo.z); c.strokeStyle = '#ff7a1a'; c.lineWidth = 1.6; c.beginPath(); c.moveTo(x - 3.5, y - 3.5); c.lineTo(x + 3.5, y + 3.5); c.moveTo(x + 3.5, y - 3.5); c.lineTo(x - 3.5, y + 3.5); c.stroke(); }
    // you are here: a dot with a view cone
    const walk = this.mode === 'walk', px = walk ? this.pos.x : this.camera.position.x, pz = walk ? this.pos.y : this.camera.position.z;
    const ang = walk ? Math.atan2(-Math.cos(this.yaw), -Math.sin(this.yaw)) : Math.atan2(this.controls.target.z - pz, this.controls.target.x - px);
    const [x, y] = this._mp(px, pz);
    c.fillStyle = 'rgba(232,89,12,.28)'; c.beginPath(); c.moveTo(x, y); c.arc(x, y, 17, ang - 0.55, ang + 0.55); c.closePath(); c.fill();
    c.fillStyle = '#e8590c'; c.strokeStyle = '#fff'; c.lineWidth = 1.6; c.beginPath(); c.arc(x, y, 4, 0, 6.2832); c.fill(); c.stroke();
  }
  _mapClick(e) {
    if (!this.map) return;
    const r = this.mapEl.getBoundingClientRect(), m = this.map;
    const x = m.x0 + ((e.clientX - r.left) / r.width) * (m.x1 - m.x0), z = m.z0 + ((e.clientY - r.top) / r.height) * (m.z1 - m.z0);
    if (this.mode === 'walk') this._setWalkTarget(x, z);
    else if (this.mode === 'orbit') this.focus = { target: new THREE.Vector3(x, 0, z), dist: 16 };
  }

  /* ---------- tour stops ---------- */
  stepStop(dir = 1) {
    const vis = this.visibleHotspots(); if (!vis.length || this.mode === 'detail') return null;
    let i = vis.indexOf(this.stop); i = i < 0 ? (dir > 0 ? 0 : vis.length - 1) : (i + dir + vis.length) % vis.length;
    const h = vis[i]; this.stop = h; this.goTo(h); this.cb.onHotspot?.(h);
    return h;
  }

  /* ---------- scene loading ---------- */
  setScene(def) {
    this.stopPhoto(); this.closeDetail(true); this.setSection(null); this.setHunt(null);
    for (const l of this.layers) { this.world.remove(l.group); disposeTree(l.group); }
    this.pinLayer.replaceChildren(); this.pins = []; this.layers = []; this.tickers = [];
    this.def = def;
    const built = def.build(kit);
    for (const l of built.layers) { this.world.add(l.group); this.layers.push({ from: 0, until: 99, ...l }); }
    this.colliders = built.colliders || [];
    this.tickers = built.tickers || [];
    this.spawn = built.spawn || { pos: [0, 20], yaw: 0, pitch: -0.05 };
    this.overview = built.orbit || { pos: [26, 24, 38], target: [0, 0, 4] };
    this.pos.set(this.spawn.pos[0], this.spawn.pos[1]); this.yaw = this.spawn.yaw || 0; this.pitch = this.spawn.pitch ?? -0.05;
    this.orbitSaved = { pos: new THREE.Vector3(...this.overview.pos), target: new THREE.Vector3(...this.overview.target) };
    (built.hotspots || []).forEach((h, i) => {
      const b = el('button', 'pin', this.pinLayer);
      b.type = 'button'; b.textContent = String(i + 1); b.title = h.title; b.setAttribute('aria-label', `${i + 1}. ${h.title}`);
      if (h.detail) b.classList.add('has-detail');
      b.addEventListener('click', () => { this.stop = h; this.cb.onHotspot?.(h); if (this.mode !== 'detail') this.goTo(h); });
      this.pins.push({ h, el: b, v: new THREE.Vector3(...h.pos) });
    });
    this.hotspots = (built.hotspots || []);
    this.stop = null; this.walkTo = null; this.glide = null; this.map = built.map || null;
    this.mapEl.style.display = this.map ? '' : 'none'; this._layoutMap();
    this.setPhase(0);
    this._applyMode(this.base);
  }

  setPhase(i) {
    this.phase = i;
    for (const l of this.layers) l.group.visible = i >= l.from && i < l.until;
    this.cb.onPhase?.(i);
  }

  visibleHotspots() { return this.hotspots.filter((h) => this.phase >= (h.from || 0) && this.phase < (h.until ?? 99)); }

  /* ---------- modes ---------- */
  setMode(m) {
    if (this.mode === 'detail') return;
    if (m === this.mode) return;
    if (this.mode === 'orbit') this._saveOrbit();
    this.base = m; this._applyMode(m);
  }
  _saveOrbit() { this.orbitSaved = { pos: this.camera.position.clone(), target: this.controls.target.clone() }; }
  _applyMode(m) {
    this.mode = m; this.hud.dataset.mode = m; this.focus = null; this._viewShift();
    if (document.pointerLockElement) document.exitPointerLock?.();
    this.scene.background = SKY; this.scene.fog = new THREE.Fog(HAZE, 60, 330); this.dome.visible = true; this.band.visible = true; this._sunTo(false);
    this.world.visible = true; this.detailRoot.visible = false;
    this._clearLabels();
    if (m === 'walk') {
      this.controls.enabled = false;
      this.camera.position.set(this.pos.x, EYE, this.pos.y);
      this._look();
    } else {
      Object.assign(this.controls, { enabled: true, minDistance: 2, maxDistance: 110, maxPolarAngle: Math.PI / 2 - 0.02 });
      this.camera.position.copy(this.orbitSaved.pos); this.controls.target.copy(this.orbitSaved.target); this.controls.update();
    }
    this.cb.onMode?.(m);
  }
  _look() { this.pitch = clamp(this.pitch, -1.35, 1.35); this.camera.rotation.set(this.pitch, this.yaw, 0, 'YXZ'); }

  goTo(h) {
    this.focus = null;
    if (this.mode === 'walk') {
      const s = h.stand || [h.pos[0], h.pos[2] + 4];
      const dx = h.pos[0] - s[0], dz = h.pos[2] - s[1];
      const to = { x: s[0], z: s[1], yaw: Math.atan2(-dx, -dz), pitch: Math.atan2(h.pos[1] - EYE, Math.hypot(dx, dz)) * 0.8 };
      this.walkTo = null; this.marker.visible = false;
      this.glide = { t: 0, dur: clamp(Math.hypot(to.x - this.pos.x, to.z - this.pos.y) / 14, 0.5, 1.4), from: { x: this.pos.x, z: this.pos.y, yaw: this.yaw, pitch: this.pitch }, to };
    } else if (this.mode === 'orbit') {
      this.focus = { target: new THREE.Vector3(...h.pos), dist: h.dist || 7 };
    }
  }

  lockLook() {
    if (this.mode !== 'walk') return;
    try { const p = this.renderer.domElement.requestPointerLock(); p?.catch?.(() => {}); } catch { /* not allowed here */ }
  }

  /* ---------- detail room ---------- */
  openDetail(key, def) {
    if (this.mode === 'detail') return;
    this._fade(() => {
      if (this.mode === 'orbit') this._saveOrbit();
      this.focus = null; // a site-view focus tween (orbit mode) must not keep steering the camera inside the detail room
      this.detailKey = key; this.detailDef = def;
      const built = def.build(kit);
      this.detailGroup = new THREE.Group();
      this.detailRoot.add(this.detailGroup);
      this.parts = built.parts.map((p, i) => {
        p.i = i; p.base = p.group.position.clone();
        p.group.traverse((o) => { o.userData.partId = p.id; });
        this.detailGroup.add(p.group);
        return p;
      });
      if (built.extras) this.detailGroup.add(built.extras);
      this._edges(this.detailGroup);
      if (def.floor !== undefined) {
        const grid = new THREE.GridHelper(def.gridSize || 6, def.gridSize ? def.gridSize * 4 : 24, 0x9aa7b5, 0xc8d0da);
        grid.position.y = def.floor; this.detailGroup.add(grid);
        const sc = new THREE.Mesh(new THREE.PlaneGeometry(def.gridSize || 6, def.gridSize || 6), new THREE.ShadowMaterial({ opacity: 0.2 }));
        sc.rotation.x = -Math.PI / 2; sc.position.y = def.floor + 0.002; sc.receiveShadow = true; sc.userData.noAO = true; this.detailGroup.add(sc);
      }
      this.exNow = this.exGoal = 0; this.selected = null;
      this.mode = 'detail'; this.hud.dataset.mode = 'detail';
      this._viewShift();
      this.world.visible = false; this.detailRoot.visible = true;
      this.scene.background = DETAIL_BG; this.scene.fog = null; this.dome.visible = false; this.band.visible = false; this._sunTo(true); this.marker.visible = false;
      if (document.pointerLockElement) document.exitPointerLock?.();
      const cam = def.camera;
      this.camera.position.set(2000 + cam.pos[0], cam.pos[1], cam.pos[2]);
      this.controls.target.set(2000 + cam.target[0], cam.target[1], cam.target[2]);
      Object.assign(this.controls, { enabled: true, minDistance: 0.12, maxDistance: 40, maxPolarAngle: Math.PI });
      this.controls.update();
      this.detailHome = { pos: this.camera.position.clone(), target: this.controls.target.clone() };
      this.pinLayer.style.display = 'none';
      this._buildLabels();
      this.cb.onDetail?.(def, this.parts);
    });
  }

  closeDetail(silent = false) {
    if (this.mode !== 'detail') return;
    const done = () => {
      this.detailRoot.remove(this.detailGroup); disposeTree(this.detailGroup);
      if (this.hlBox) { this.scene.remove(this.hlBox); this.hlBox = null; }
      this.parts = []; this.selected = null; this.detailKey = null;
      this.pinLayer.style.display = '';
      this._clearLabels();
      this._applyMode(this.base);
      this.cb.onDetailClose?.();
    };
    if (silent) done(); else this._fade(done);
  }

  setExplode(t) { this.exGoal = clamp(t, 0, 1); }
  setLabels(on) { this.labelsOn = on; this.labelLayer.style.display = on ? '' : 'none'; this.leaders.style.display = on ? '' : 'none'; }
  resetView() {
    if (this.mode !== 'detail' || !this.detailHome) return;
    this.focus = null; this.camera.position.copy(this.detailHome.pos); this.controls.target.copy(this.detailHome.target); this.controls.update();
  }

  selectPart(id, focus = true) {
    const p = this.parts.find((x) => x.id === id) || null;
    this.selected = p;
    this.labels?.forEach((l) => l.el.classList.toggle('sel', l.p === p));
    if (this.hlBox) { this.scene.remove(this.hlBox); this.hlBox = null; }
    if (p) {
      this._b.setFromObject(p.group);
      this.hlBox = new THREE.Box3Helper(this._b.clone(), 0xe8590c);
      this.hlBox.material.depthTest = false; this.hlBox.renderOrder = 10;
      this.scene.add(this.hlBox);
      if (focus) {
        const size = this._b.getSize(new THREE.Vector3()).length();
        this.focus = { target: this._b.getCenter(new THREE.Vector3()), dist: clamp(size * 1.7, 0.35, 12) };
      }
    }
    this.cb.onPart?.(p);
  }

  /* ---------- labels ---------- */
  _clearLabels() { this.labelLayer.replaceChildren(); this.leaders.replaceChildren(); this.labels = []; }
  _buildLabels() {
    this._clearLabels();
    this.labels = this.parts.map((p, i) => {
      const e = el('button', 'lbl', this.labelLayer); e.type = 'button';
      e.innerHTML = `<b>${i + 1}</b><span></span>`; e.lastChild.textContent = p.name;
      e.addEventListener('click', () => this.selectPart(p.id));
      const line = svgEl('line', this.leaders), dot = svgEl('circle', this.leaders);
      dot.setAttribute('r', '4');
      return { p, el: e, line, dot, w: 0 };
    });
    for (const l of this.labels) l.w = l.el.offsetWidth || 160;
  }
  _layoutLabels() {
    if (!this.labels?.length) return;
    const { w, h } = this, narrow = w < 600, H = 28, G = 6, items = [];
    for (const l of this.labels) {
      const p = l.p;
      this._v.set(2000 + p.anchor[0] + p.explode[0] * this.exNow, p.anchor[1] + p.explode[1] * this.exNow, p.anchor[2] + p.explode[2] * this.exNow).project(this.camera);
      const behind = this._v.z > 1;
      items.push({ l, x: (this._v.x * 0.5 + 0.5) * w, y: (-this._v.y * 0.5 + 0.5) * h, behind });
    }
    this.hud.classList.toggle('narrow', narrow);
    if (narrow) {
      for (const it of items) {
        it.l.el.style.display = it.behind ? 'none' : '';
        it.l.el.style.transform = `translate(${it.x}px, ${it.y}px) translate(-50%,-50%)`;
        it.l.line.style.display = 'none'; it.l.dot.style.display = 'none';
      }
      return;
    }
    const left = items.filter((i) => (i.l.p.side ? i.l.p.side === 'l' : i.x < w / 2)).sort((a, b) => a.y - b.y);
    const right = items.filter((i) => !left.includes(i)).sort((a, b) => a.y - b.y);
    for (const [col, isLeft] of [[left, true], [right, false]]) {
      const TOP = h > 420 ? 74 : 8; // keep label columns clear of the title card and the view buttons
      let prev = TOP - H - G;
      for (const it of col) { it.ly = Math.max(clamp(it.y - H / 2, TOP, h - H - 8), prev + H + G); prev = it.ly; }
      let over = prev + H - (h - 8);
      if (over > 0) for (let k = col.length - 1; k >= 0; k--) { col[k].ly -= over; if (k > 0) over = Math.max(0, col[k - 1].ly + H + G - col[k].ly + 0) ? over : 0; }
      for (const it of col) {
        const ew = it.l.w, lx = isLeft ? 10 : w - 10 - ew;
        it.l.el.style.display = ''; it.l.el.style.transform = `translate(${lx}px, ${it.ly}px)`;
        const ex = isLeft ? lx + ew : lx, ey = it.ly + H / 2;
        const on = !it.behind;
        for (const [n, v] of [['x1', ex], ['y1', ey], ['x2', it.x], ['y2', it.y]]) it.l.line.setAttribute(n, v.toFixed(1));
        it.l.dot.setAttribute('cx', it.x.toFixed(1)); it.l.dot.setAttribute('cy', it.y.toFixed(1));
        it.l.line.style.display = on ? '' : 'none'; it.l.dot.style.display = on ? '' : 'none';
        const sel = it.l.p === this.selected;
        it.l.line.setAttribute('class', sel ? 'sel' : ''); it.l.dot.setAttribute('class', sel ? 'sel' : '');
      }
    }
  }

  /* ---------- input ---------- */
  _bindInput() {
    const cv = this.renderer.domElement;
    const typing = () => /INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName || '');
    window.addEventListener('keydown', (e) => {
      if (!this.active || typing() || e.ctrlKey || e.metaKey || e.altKey) return;
      if (this.mode === 'walk') {
        if (e.code === 'KeyE' || e.code === 'Enter') { if (this.near) this.cb.onHotspot?.(this.near); return; }
        if (/^(KeyW|KeyA|KeyS|KeyD|Arrow(Up|Down|Left|Right)|ShiftLeft|ShiftRight)$/.test(e.code)) { this.keys.add(e.code); if (e.code.startsWith('Arrow')) e.preventDefault(); }
      }
      if (e.code === 'Escape' && this.mode === 'detail') this.cb.onEscape?.();
    });
    window.addEventListener('keyup', (e) => this.keys.delete(e.code));
    window.addEventListener('blur', () => this.keys.clear());
    document.addEventListener('pointerlockchange', () => { this.locked = document.pointerLockElement === cv; this.cb.onLock?.(this.locked); });

    let drag = null;
    cv.addEventListener('pointerdown', (e) => {
      if (this.mode === 'walk') { drag = { id: e.pointerId, x: e.clientX, y: e.clientY, sx: e.clientX, sy: e.clientY, t: performance.now(), moved: false, walk: true }; cv.setPointerCapture?.(e.pointerId); cv.focus({ preventScroll: true }); }
      else if (this.mode === 'detail') drag = { id: e.pointerId, x: e.clientX, y: e.clientY, sx: e.clientX, sy: e.clientY, pick: true };
      else if (this.hunt) drag = { id: e.pointerId, x: e.clientX, y: e.clientY, sx: e.clientX, sy: e.clientY, t: performance.now(), inspect: true };
    });
    cv.addEventListener('pointermove', (e) => {
      if (this.mode !== 'walk') return;
      if (this.locked) { this.yaw -= e.movementX * 0.0022; this.pitch -= e.movementY * 0.0022; this._look(); return; }
      if (!drag || e.pointerId !== drag.id) return;
      if (!drag.moved) { if (Math.hypot(e.clientX - drag.sx, e.clientY - drag.sy) < 5) return; drag.moved = true; this.walkTo = null; this.glide = null; this.marker.visible = false; }
      this.yaw += (e.clientX - drag.x) * 0.0042; this.pitch += (e.clientY - drag.y) * 0.0042;
      drag.x = e.clientX; drag.y = e.clientY; this._look();
    });
    const up = (e) => {
      if (drag?.pick && Math.hypot(e.clientX - drag.sx, e.clientY - drag.sy) < 5) this._pick(e);
      else if (this.hunt && drag && !drag.moved && Math.hypot(e.clientX - drag.sx, e.clientY - drag.sy) < 6 && performance.now() - drag.t < 600) this._inspect(e);
      else if (drag?.walk && !drag.moved && !this.locked && performance.now() - drag.t < 500) this._walkClick(e);
      drag = null;
    };
    cv.addEventListener('dblclick', (e) => { if (this.mode === 'orbit') { const p = this._groundPoint(e); if (p) this.focus = { target: new THREE.Vector3(p[0], 0, p[1]), dist: 12 }; } });
    this.mapEl.addEventListener('pointerdown', (e) => { e.preventDefault(); e.stopPropagation(); this._mapClick(e); });
    cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', () => { drag = null; });

    const J = 44;
    const joyMove = (e) => {
      const r = this.joyEl.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      let dx = e.clientX - cx, dy = e.clientY - cy; const d = Math.hypot(dx, dy);
      if (d > J) { dx = (dx / d) * J; dy = (dy / d) * J; }
      this.knob.style.transform = `translate(${dx}px, ${dy}px)`; this.joy.x = dx / J; this.joy.y = dy / J;
    };
    this.joyEl.addEventListener('pointerdown', (e) => { this.joyEl.setPointerCapture(e.pointerId); joyMove(e); });
    this.joyEl.addEventListener('pointermove', (e) => { if (this.joyEl.hasPointerCapture(e.pointerId)) joyMove(e); });
    const joyEnd = () => { this.joy.x = this.joy.y = 0; this.knob.style.transform = ''; };
    this.joyEl.addEventListener('pointerup', joyEnd); this.joyEl.addEventListener('pointercancel', joyEnd);
  }

  _groundPoint(e) {
    const r = this.renderer.domElement.getBoundingClientRect();
    this._m.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    this._ray.setFromCamera(this._m, this.camera);
    const o = this._ray.ray.origin, d = this._ray.ray.direction;
    if (d.y >= -0.01) return null;
    const t = -o.y / d.y; if (t > 120) return null;
    return [o.x + d.x * t, o.z + d.z * t];
  }
  _walkClick(e) { const p = this._groundPoint(e); if (p) this._setWalkTarget(p[0], p[1]); }
  _setWalkTarget(x, z) {
    const [cx, cz] = this._collide(clamp(x, -48, 48), clamp(z, -48, 48));
    this.walkTo = { x: cx, z: cz }; this.glide = null; this.stuck = 0;
    this.marker.position.set(cx, 0.03, cz); this.marker.visible = true;
  }

  _pick(e) {
    const r = this.renderer.domElement.getBoundingClientRect();
    this._m.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    this._ray.setFromCamera(this._m, this.camera);
    const hit = this._ray.intersectObjects(this.parts.map((p) => p.group), true).find((x) => x.object.userData.partId && x.object.visible);
    this.selectPart(hit ? hit.object.userData.partId : null, !!hit);
  }

  /* ---------- loop ---------- */
  resize() {
    const w = this.host.clientWidth, h = this.host.clientHeight;
    if (!w || !h) return;
    this.w = w; this.h = h;
    this.renderer.setSize(w, h, false); this.composer?.setSize(w, h); this._layoutMap();
    this.camera.aspect = w / h; this._viewShift();
    if (this.labels) for (const l of this.labels) l.w = l.el.offsetWidth || l.w;
  }

  // In a detail room the title card covers the top of the view, so push the model down into the clear area.
  _viewShift() {
    const w = this.w, h = this.h; if (!w || !h) return;
    let dy = 0;
    if (this.mode === 'detail') {
      const cap = document.getElementById('caption'); let bottom = 0;   // measure the title card so a tall one doesn't hide the labels behind it
      if (cap && cap.offsetParent) bottom = Math.max(0, cap.getBoundingClientRect().bottom - this.host.getBoundingClientRect().top);
      dy = Math.round(Math.min(h * 0.3, Math.max(Math.min(64, h * 0.13), bottom * 0.5)));
    }
    if (dy) this.camera.setViewOffset(w, h, 0, -dy, w, h); else this.camera.clearViewOffset();
    this.camera.updateProjectionMatrix();
  }

  setActive(on) { this.active = on; if (on) this.resize(); }

  /* ---------- photo render ----------
     Path-traced still of the current view (three-gpu-pathtracer, MIT): true soft shadows, bounced light and reflections.
     Loaded only when asked for. Things it cannot draw (the sky shader, the horizon ring, section caps, instancing)
     are swapped for stand-ins while it runs and put back afterwards. cb(samples, target, done). */
  async startPhoto(cb, target = 256) {
    if (this.photo) return;
    this.photo = { pending: true };
    let mod;
    try { mod = await import('three-gpu-pathtracer'); } catch (err) { this.photo = null; throw err; }
    const restore = [], hide = (o) => { if (!o.visible) return; o.visible = false; restore.push(() => { o.visible = true; }); };
    hide(this.dome); hide(this.band); hide(this.marker);
    const sec = this.section; if (sec) { this.setSection(null); restore.push(() => this.setSection(sec)); }
    // one plain mesh per instanced mesh (the tracer reads geometry once per mesh)
    const inst = []; this.scene.traverseVisible((o) => { if (o.isInstancedMesh && !o.userData.cap) inst.push(o); });
    const extra = new THREE.Group(), m4 = new THREE.Matrix4(), col = new THREE.Color(), clones = [];
    for (const o of inst) {
      const geos = [];
      for (let i = 0; i < o.count; i++) {
        const g = o.geometry.clone(); o.getMatrixAt(i, m4); g.applyMatrix4(m4);
        if (o.instanceColor) { o.getColorAt(i, col); const n = g.attributes.position.count, c = new Float32Array(n * 3); for (let k = 0; k < n; k++) c.set([col.r, col.g, col.b], k * 3); g.setAttribute('color', new THREE.BufferAttribute(c, 3)); }
        geos.push(g.index ? g.toNonIndexed() : g);
      }
      const mt = o.instanceColor ? Object.assign(o.material.clone(), { vertexColors: true }) : o.material; if (mt !== o.material) clones.push(mt);
      const merged = new THREE.Mesh(mergeGeometries(geos, false), mt);
      geos.forEach((g) => g.dispose()); o.updateMatrixWorld(); merged.applyMatrix4(o.matrixWorld); extra.add(merged); hide(o);
    }
    this.scene.add(extra);
    restore.push(() => { this.scene.remove(extra); extra.traverse((q) => q.geometry?.dispose()); clones.forEach((m) => m.dispose()); });
    const bg = this.scene.background, env = this.scene.environment, envI = this.scene.environmentIntensity, fog = this.scene.fog;
    restore.push(() => { this.scene.background = bg; this.scene.environment = env; this.scene.environmentIntensity = envI; this.scene.fog = fog; });
    if (this.mode !== 'detail') { const g = new mod.GradientEquirectTexture(64); g.topColor.set(0x4d8ccc); g.bottomColor.set(0xdfe8f0); g.exponent = 3; g.update(); this.scene.background = g; restore.push(() => g.dispose()); }
    if (this.hdri) { this.scene.environment = this.hdri; this.scene.environmentIntensity = 0.75; }
    this.scene.fog = null;
    this.pinLayer.style.visibility = 'hidden'; restore.push(() => { this.pinLayer.style.visibility = ''; });
    this.controls.enabled = false; restore.push(() => { this.controls.enabled = this.mode !== 'walk'; });
    const pt = new mod.WebGLPathTracer(this.renderer);
    Object.assign(pt, { minSamples: 1, renderDelay: 0, fadeDuration: 0, dynamicLowRes: false, bounces: 5, filterGlossyFactor: 0.5 });
    pt.tiles.set(2, 2);
    this.photo = { pt, restore, target, cb, n: 0 };
    await new Promise((r) => requestAnimationFrame(() => setTimeout(r, 30)));   // let the "preparing" message paint before the BVH build blocks
    try { pt.setScene(this.scene, this.camera); }
    catch (err) { this.stopPhoto(); throw err; }
    if (this.photo) this.photo.ready = true;
  }
  stopPhoto() {
    const p = this.photo; if (!p) return; this.photo = null;
    p.pt?.dispose?.(); for (const f of (p.restore || []).reverse()) f();
  }
  savePhoto() { if (this.photo) this.photo.save = true; }

  /* ---------- find the defects ----------
     list = defects for the phase on show: { id, title, pos: [x, y, z], r, build?(kit) -> Object3D, hide?: [object names] }.
     The defective version is swapped into the scene; a click inspects that spot, and a defect counts as found when the
     click lands within r metres of it. Pass null to stop and restore the scene. */
  setHunt(list) {
    if (this.hunt) {
      this.world.remove(this.hunt.group); disposeTree(this.hunt.group);
      for (const [o, v] of this.hunt.hidden) o.visible = v;
      for (const p of this.hunt.pins) p.el.remove();
      this.hunt = null;
    }
    if (!list?.length) return;
    const group = new THREE.Group(), hidden = [];
    group.name = 'hunt';
    for (const d of list) {
      if (d.build) { try { const o = d.build(kit); if (o) group.add(o); } catch (err) { console.warn('Defect model failed', d.id, err); } }
      for (const name of d.hide || []) for (const l of this.layers) l.group.traverse((o) => { if (o.name === name) { hidden.push([o, o.visible]); o.visible = false; } });
    }
    this.world.add(group);
    this.hunt = { list, group, hidden, found: new Set(), pins: [] };
    if (this.section) this._clipAll(true);   // the defects are cut by the section too
  }
  _inspect(e) {
    const h = this.hunt; if (!h) return;
    const r = this.renderer.domElement.getBoundingClientRect();
    this._m.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    this._ray.setFromCamera(this._m, this.camera);
    const hits = this._ray.intersectObject(this.world, true).filter((x) => x.object.visible && !x.object.userData.cap && this._shown(x.object));
    let p = hits[0]?.point;
    if (!p) { const g = this._groundPoint(e); if (g) p = new THREE.Vector3(g[0], 0, g[1]); }
    if (!p) return;
    // the nearest defect not yet found whose zone the click falls in; the ray passing close by also counts, for small parts
    let best = null, bd = Infinity;
    for (const d of h.list) {
      if (h.found.has(d.id)) continue;
      let dist;
      if (d.box) { const bx = this._b.set(this._v.set(...d.box[0]), new THREE.Vector3(...d.box[1])); dist = this._ray.ray.intersectsBox(bx) ? 0 : bx.distanceToPoint(p); }
      else { const c = this._v.set(...d.pos); dist = Math.min(c.distanceTo(p), this._ray.ray.distanceToPoint(c) * 1.4); }
      if (dist <= (d.r ?? 1) && dist < bd) { bd = dist; best = d; }
    }
    if (best) { h.found.add(best.id); this._huntPin(best, 'found'); }
    else { this.marker.position.set(p.x, p.y + 0.03, p.z); this.marker.visible = true; clearTimeout(this._mk); this._mk = setTimeout(() => { this.marker.visible = false; }, 700); }
    this.cb.onHunt?.(best, h.found.size, h.list.length);
  }
  huntReveal() { const h = this.hunt; if (!h) return; for (const d of h.list) if (!h.found.has(d.id)) this._huntPin(d, 'missed'); }
  _huntPin(d, cls) {
    const b = el('button', `pin hunt ${cls}`, this.pinLayer); b.type = 'button'; b.textContent = cls === 'found' ? '✓' : '!';
    b.title = d.title; b.setAttribute('aria-label', d.title);
    b.addEventListener('click', () => this.cb.onHuntPin?.(d));
    this.hunt.pins.push({ h: { pos: d.pos }, el: b, v: new THREE.Vector3(...d.pos), hunt: true });
  }
  _shown(o) { for (let q = o; q; q = q.parent) if (!q.visible) return false; return true; }

  /* ---------- section cut ----------
     A clipping plane slices the house; the base (ground, street, neighbours, trees) is never cut.
     Cut faces are filled by drawing each closed solid's back faces in a flat colour with a screen-space hatch,
     so a brick, concrete or timber solid reads like the same material in a 2D section drawing.
     s = null (off) or { axis: 'z' (across the house), 'x' (along it) or 'y' (plan cut), at: metres, flip: bool, bounds }. */
  setSection(s) {
    if (!this.clip) { this.clip = new THREE.Plane(); this.clipList = [this.clip]; this.capMats = new Map(); }
    const was = !!this.section;
    this.section = s || null;
    if (!s) { if (was) this._clipAll(false); return; }
    const n = { x: [-1, 0, 0], z: [0, 0, -1], y: [0, -1, 0] }[s.axis] || [0, 0, -1], k = s.flip ? -1 : 1;
    this.clip.normal.set(n[0] * k, n[1] * k, n[2] * k); this.clip.constant = s.at * k;
    if (!was) this._clipAll(true);
  }
  // Point the orbit camera square at the cut face.
  viewSection() {
    const s = this.section; if (!s || this.mode === 'detail') return;
    if (this.mode !== 'orbit') this.setMode('orbit');
    const b = s.bounds || { x0: -6, x1: 6, z0: -6, z1: 12 }, cx = (b.x0 + b.x1) / 2, cz = (b.z0 + b.z1) / 2, k = s.flip ? -1 : 1;
    // high enough to look over the neighbours' roofs, close enough that the cut fills the view
    const pos = s.axis === 'x' ? [s.at + k * 9, 7.5, cz] : s.axis === 'y' ? [cx + 0.01, 24, cz + 0.01] : [cx + 1.5, 4.2, s.at + k * 12];
    const tgt = s.axis === 'x' ? [s.at, 1.2, cz] : s.axis === 'y' ? [cx, 0, cz] : [cx, 1.3, s.at];
    this.focus = null; this.camera.position.set(...pos); this.controls.target.set(...tgt); this.controls.update();
  }
  _clipAll(on) {
    const walk = (o) => {
      if (o.userData.noClip || o.userData.cap) return;
      if (o.isMesh || o.isLine || o.isPoints) {
        for (const m of [o.material].flat()) if (m) { m.clippingPlanes = on ? this.clipList : null; m.clipShadows = true; }
        if (o.isMesh) {
          if (on && !o.userData.capMesh && this._closed(o)) o.userData.capMesh = this._cap(o);
          if (o.userData.capMesh) o.userData.capMesh.visible = on;
        }
      }
      for (const c of o.children) walk(c);
    };
    for (const l of this.layers) walk(l.group);
    if (this.hunt) walk(this.hunt.group);
  }
  _closed(o) {
    const m = [o.material].flat()[0], g = o.geometry;
    if (!m || m.transparent || m.side === THREE.DoubleSide || o.userData.noCap) return false;
    if (g.userData.closed != null) return g.userData.closed;
    const t = g.type, p = g.parameters || {};
    if (t === 'BoxGeometry' || t === 'ExtrudeGeometry' || t === 'SphereGeometry' || t === 'IcosahedronGeometry' || t === 'TorusGeometry') return true;
    if (t === 'CylinderGeometry') return !p.openEnded;
    // merged boxes (frame members, battens, linings): 24 vertices and 36 indices per box
    if (t === 'BufferGeometry' && g.index) { const v = g.attributes.position.count, i = g.index.count; return v % 24 === 0 && i % 36 === 0 && i / 36 === v / 24; }
    return false;
  }
  _cap(o) {
    const src = [o.material].flat()[0], kind = src.userData.hatch || HATCH[src.userData.tex] || 0;
    const col = new THREE.Color().copy(src.color || new THREE.Color(0x999999));
    if (src.userData.tex && src.map) col.multiply(new THREE.Color(TEX_TONE[src.userData.tex] || 0xb0b0b0));
    const key = kind + ':' + col.getHexString();
    let m = this.capMats.get(key);
    if (!m) {
      m = new THREE.MeshBasicMaterial({ color: col.multiplyScalar(0.92), side: THREE.BackSide, clippingPlanes: this.clipList, toneMapped: false });
      m.onBeforeCompile = (sh) => {
        sh.fragmentShader = sh.fragmentShader.replace('#include <dithering_fragment>', `#include <dithering_fragment>
          vec2 fc = gl_FragCoord.xy; float ln = 0.0;
          ${['', // 0 solid
            'ln = step(mod(fc.x + fc.y, 9.0), 1.4);', // 1 brick and masonry: 45 degree lines
            'vec2 cl = floor(fc / 7.0); float h = fract(sin(dot(cl, vec2(12.9898, 78.233))) * 43758.5453); ln = step(0.8, h) * step(length(fract(fc / 7.0) - 0.5), 0.22);', // 2 concrete: stipple
            'ln = step(mod(fc.x - fc.y, 11.0), 1.2) + step(mod(fc.x - fc.y + 5.0, 11.0), 0.7) * step(mod(fc.x + fc.y, 6.0), 3.0);', // 3 earth: lines and dashes
            'ln = step(mod(fc.y * 1.7 + fc.x * 0.6, 6.0), 0.9);', // 4 timber: fine grain lines
            'ln = step(mod(fc.y + 3.0 * sin(fc.x * 0.4), 9.0), 1.5);'][kind] || ''}   // 5 insulation: wave
          gl_FragColor.rgb *= 1.0 - 0.5 * clamp(ln, 0.0, 1.0);`);
      };
      m.customProgramCacheKey = () => 'cap' + kind;
      this.capMats.set(key, m);
    }
    const cap = o.isInstancedMesh ? new THREE.InstancedMesh(o.geometry, m, o.count) : new THREE.Mesh(o.geometry, m);
    if (o.isInstancedMesh) cap.instanceMatrix = o.instanceMatrix;
    cap.userData.cap = true; cap.userData.noAO = true; cap.raycast = () => {}; cap.renderOrder = 1;
    o.add(cap);
    return cap;
  }

  _fade(fn) {
    this.fadeEl.classList.add('on');
    setTimeout(() => { fn(); requestAnimationFrame(() => this.fadeEl.classList.remove('on')); }, 190);
  }

  _collide(x, z) {
    for (const c of this.colliders) {
      const cx = clamp(x, c.x0, c.x1), cz = clamp(z, c.z0, c.z1), dx = x - cx, dz = z - cz, d2 = dx * dx + dz * dz;
      if (d2 >= RADIUS * RADIUS) continue;
      if (d2 > 1e-8) { const d = Math.sqrt(d2); x = cx + (dx / d) * RADIUS; z = cz + (dz / d) * RADIUS; }
      else { const m = Math.min(x - c.x0, c.x1 - x, z - c.z0, c.z1 - z); if (m === x - c.x0) x = c.x0 - RADIUS; else if (m === c.x1 - x) x = c.x1 + RADIUS; else if (m === z - c.z0) z = c.z0 - RADIUS; else z = c.z1 + RADIUS; }
    }
    return [x, z];
  }

  _tick(ts) {
    this.timer.update(ts);
    const dt = Math.min(this.timer.getDelta(), 0.1), t = this.timer.getElapsed();
    if (!this.active || !this.w) return;
    if (this.photo) {
      const p = this.photo;
      if (p.ready) {
        p.pt.renderSample(); const n = Math.floor(p.pt.samples);
        if (p.save) { p.save = false; this.renderer.domElement.toBlob((b) => { if (!b) return; const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = 'foreman-photo.png'; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 4000); }); }
        if (n !== p.n) { p.n = n; p.cb?.(n, p.target, n >= p.target); }
        if (n >= p.target) p.pt.pausePathTracing = true;
      }
      return;
    }
    if (!this.composer && this.quality === 'high') this._initComposer();
    for (const f of this.tickers) f(dt, t);
    this.dome.position.copy(this.camera.position); this.dome.material.uniforms.time.value = t;

    if (this.mode === 'walk') {
      const k = this.keys, run = k.has('ShiftLeft') || k.has('ShiftRight');
      const turn = (k.has('ArrowLeft') ? 1 : 0) - (k.has('ArrowRight') ? 1 : 0);
      if (turn) { this.yaw += turn * 1.7 * dt; }
      const f = (k.has('KeyW') || k.has('ArrowUp') ? 1 : 0) - (k.has('KeyS') || k.has('ArrowDown') ? 1 : 0) - this.joy.y;
      const s = (k.has('KeyD') ? 1 : 0) - (k.has('KeyA') ? 1 : 0) + this.joy.x;
      if (f || s || turn) { this.glide = null; if (this.walkTo) { this.walkTo = null; this.marker.visible = false; } }
      if (this.glide) {
        const g = this.glide; g.t += dt / g.dur; const e = sstep(Math.min(1, g.t));
        this.pos.set(g.from.x + (g.to.x - g.from.x) * e, g.from.z + (g.to.z - g.from.z) * e);
        const dy = Math.atan2(Math.sin(g.to.yaw - g.from.yaw), Math.cos(g.to.yaw - g.from.yaw));
        this.yaw = g.from.yaw + dy * e; this.pitch = g.from.pitch + (g.to.pitch - g.from.pitch) * e;
        if (g.t >= 1) this.glide = null;
      } else if (!(f || s) && this.walkTo) {
        const dx = this.walkTo.x - this.pos.x, dz = this.walkTo.z - this.pos.y, d = Math.hypot(dx, dz);
        if (d < 0.12) { this.walkTo = null; this.marker.visible = false; }
        else {
          const sp = Math.min(d, (run ? RUN : WALK) * dt), [cx, cz] = this._collide(this.pos.x + (dx / d) * sp, this.pos.y + (dz / d) * sp);
          this.stuck = Math.hypot(cx - this.pos.x, cz - this.pos.y) < sp * 0.25 ? this.stuck + dt : 0;
          this.pos.set(cx, cz);
          if (this.stuck > 0.4) { this.walkTo = null; this.marker.visible = false; }
          const want = Math.atan2(-dx, -dz), dy = Math.atan2(Math.sin(want - this.yaw), Math.cos(want - this.yaw));
          this.yaw += dy * Math.min(1, dt * 5); this.pitch += (-0.06 - this.pitch) * Math.min(1, dt * 3);
        }
      }
      if (f || s) {
        const len = Math.max(1, Math.hypot(f, s)), sp = (run ? RUN : WALK) * dt / len;
        const nx = this.pos.x + (-Math.sin(this.yaw) * f + Math.cos(this.yaw) * s) * sp;
        const nz = this.pos.y + (-Math.cos(this.yaw) * f - Math.sin(this.yaw) * s) * sp;
        const [cx, cz] = this._collide(clamp(nx, -48, 48), clamp(nz, -48, 48));
        this.pos.set(cx, cz);
      }
      this.camera.position.set(this.pos.x, EYE + Math.sin(t * 9) * ((f || s || this.walkTo) ? 0.012 : 0), this.pos.y);
      if (this.marker.visible) { this.marker.position.y = 0.03; this.marker.scale.setScalar(1 + 0.12 * Math.sin(t * 8)); }
      this._look();
      // nearest visible hotspot within reach
      let best = null, bd = 5.5;
      for (const p of this.pins) {
        if (!(this.phase >= (p.h.from || 0) && this.phase < (p.h.until ?? 99))) continue;
        const d = Math.hypot(p.h.pos[0] - this.pos.x, p.h.pos[2] - this.pos.y);
        if (d < bd) { bd = d; best = p.h; }
      }
      if (best !== this.near) { this.near = best; this.cb.onNear?.(best); }
    } else {
      if (this.near) { this.near = null; this.cb.onNear?.(null); }
      if (this.marker.visible && this.mode !== 'walk') this.marker.visible = false;
      if (this.focus) {
        const c = this.controls, a = 1 - Math.exp(-dt * 6);
        c.target.lerp(this.focus.target, a);
        const off = this._v.copy(this.camera.position).sub(c.target), d = off.length() || 1;
        const nd = d + (this.focus.dist - d) * a;
        this.camera.position.copy(c.target).addScaledVector(off.divideScalar(d), nd);
        if (c.target.distanceTo(this.focus.target) < 0.003 && Math.abs(nd - this.focus.dist) < 0.01) this.focus = null;
      }
      this.controls.update();
    }

    if (this.mode === 'detail') {
      this.exNow += (this.exGoal - this.exNow) * (1 - Math.exp(-dt * 7));
      if (Math.abs(this.exGoal - this.exNow) < 0.0005) this.exNow = this.exGoal;
      for (const p of this.parts) p.group.position.set(p.base.x + p.explode[0] * this.exNow, p.base.y + p.explode[1] * this.exNow, p.base.z + p.explode[2] * this.exNow);
      if (this.hlBox && this.selected) this.hlBox.box.setFromObject(this.selected.group);
      this._layoutLabels();
    } else {
      this._updatePins();
    }
    if (this.composer && this.quality === 'high' && this.mode !== 'detail') this.composer.render(dt); else this.renderer.render(this.scene, this.camera);
    if (++this._mapN % 3 === 0) this._drawMap();
  }

  _updatePins() {
    const { w, h } = this, live = [];
    for (const p of this.hunt?.pins || []) {
      const v = this._v.copy(p.v).project(this.camera), on = v.z < 1 && Math.abs(v.x) < 1.08 && Math.abs(v.y) < 1.08;
      p.el.style.display = on ? '' : 'none';
      if (on) p.el.style.transform = `translate(${(v.x * 0.5 + 0.5) * w}px, ${(-v.y * 0.5 + 0.5) * h}px) translate(-50%,-50%)`;
    }
    for (const p of this.pins) {
      const hs = p.h, show = this.phase >= (hs.from || 0) && this.phase < (hs.until ?? 99);
      if (!show) { p.el.style.display = 'none'; continue; }
      const v = this._v.copy(p.v).project(this.camera);
      const dist = this.camera.position.distanceTo(p.v);
      const on = v.z < 1 && Math.abs(v.x) < 1.08 && Math.abs(v.y) < 1.08 && dist < 90;
      if (!on) { p.el.style.display = 'none'; continue; }
      live.push({ p, x: (v.x * 0.5 + 0.5) * w, y: (-v.y * 0.5 + 0.5) * h, dist, rank: this.near === hs || this.focus?.hs === hs ? -1 : dist });
    }
    // Declutter: nearest pins win, and a pin that would sit on top of one already placed stays hidden until you move closer.
    live.sort((m, n) => m.rank - n.rank);
    const placed = [], gap = w < 600 ? 26 : 32;
    for (const q of live) {
      const clash = placed.some((o) => Math.abs(o.x - q.x) < gap && Math.abs(o.y - q.y) < gap);
      if (clash) { q.p.el.style.display = 'none'; continue; }
      placed.push(q);
      q.p.el.style.display = '';
      q.p.el.style.transform = `translate(${q.x}px, ${q.y}px) translate(-50%,-50%) scale(${clamp(1.25 - q.dist / 90, 0.7, 1.15).toFixed(2)})`;
      q.p.el.classList.toggle('near', this.near === q.p.h);
    }
  }

  dispose() { this.renderer.setAnimationLoop(null); this.composer?.dispose?.(); this.renderer.dispose(); }
}

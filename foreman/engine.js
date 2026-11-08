// 3D engine: one renderer, three ways to look (game-style walk, orbit overview, zoomable detail room).
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { kit, disposeTree } from './kit.js';

const EYE = 1.7, RADIUS = 0.45, WALK = 4.2, RUN = 8.5;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const SKY = new THREE.Color(0xbfd9ee), DETAIL_BG = new THREE.Color(0xe8edf3);
const el = (tag, cls, parent) => { const e = document.createElement(tag); if (cls) e.className = cls; parent?.appendChild(e); return e; };
const svgEl = (tag, parent) => { const e = document.createElementNS('http://www.w3.org/2000/svg', tag); parent?.appendChild(e); return e; };

export class Stage {
  constructor(host, hud, cb = {}) {
    this.host = host; this.hud = hud; this.cb = cb;
    this.mode = 'orbit'; this.base = 'orbit'; this.phase = 0; this.active = true;
    this.w = 0; this.h = 0;
    this.yaw = 0; this.pitch = -0.05; this.pos = new THREE.Vector2(0, 0);
    this.keys = new Set(); this.joy = { x: 0, y: 0 };
    this.colliders = []; this.layers = []; this.pins = []; this.parts = []; this.tickers = [];
    this.exNow = 0; this.exGoal = 0; this.focus = null; this.selected = null; this.locked = false; this.labelsOn = true;
    this.orbitSaved = null; this.def = null; this.detailKey = null;
    this._v = new THREE.Vector3(); this._b = new THREE.Box3(); this._ray = new THREE.Raycaster(); this._m = new THREE.Vector2();

    const r = this.renderer = new THREE.WebGLRenderer({ antialias: true });
    r.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    r.shadowMap.enabled = true; r.shadowMap.type = THREE.PCFShadowMap;
    r.domElement.className = 'gl'; r.domElement.tabIndex = 0;
    r.domElement.setAttribute('aria-label', '3D view. Use W A S D or arrow keys to walk, drag to look, E to open a detail.');
    host.prepend(r.domElement);

    this.scene = new THREE.Scene();
    this.scene.background = SKY; this.scene.fog = new THREE.Fog(SKY, 80, 200);
    this.camera = new THREE.PerspectiveCamera(60, 1, 0.05, 600);
    this.camera.rotation.order = 'YXZ';
    this.scene.add(new THREE.HemisphereLight(0xffffff, 0x7d8a6a, 1.05));
    const sun = this.sun = new THREE.DirectionalLight(0xfff3dc, 2.2);
    sun.position.set(32, 52, 26); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
    Object.assign(sun.shadow.camera, { left: -45, right: 45, top: 45, bottom: -45, near: 5, far: 140 });
    sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.03;
    this.scene.add(sun);
    this.world = new THREE.Group(); this.detailRoot = new THREE.Group();
    this.detailRoot.position.set(2000, 0, 0); this.detailRoot.visible = false;
    this.scene.add(this.world, this.detailRoot);

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
    this._bindInput();

    this.timer = new THREE.Timer();
    new ResizeObserver(() => this.resize()).observe(host);
    this.resize();
    r.setAnimationLoop((ts) => this._tick(ts));
  }

  /* ---------- scene loading ---------- */
  setScene(def) {
    this.closeDetail(true);
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
      b.addEventListener('click', () => { this.cb.onHotspot?.(h); });
      this.pins.push({ h, el: b, v: new THREE.Vector3(...h.pos) });
    });
    this.hotspots = (built.hotspots || []);
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
    this.mode = m; this.hud.dataset.mode = m; this.focus = null;
    if (document.pointerLockElement) document.exitPointerLock?.();
    this.scene.background = SKY; this.scene.fog = new THREE.Fog(SKY, 80, 200);
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
      this.pos.set(s[0], s[1]);
      const dx = h.pos[0] - s[0], dz = h.pos[2] - s[1];
      this.yaw = Math.atan2(-dx, -dz);
      this.pitch = Math.atan2(h.pos[1] - EYE, Math.hypot(dx, dz)) * 0.8;
      this.camera.position.set(this.pos.x, EYE, this.pos.y); this._look();
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
      if (def.floor !== undefined) {
        const grid = new THREE.GridHelper(def.gridSize || 6, def.gridSize ? def.gridSize * 4 : 24, 0x9aa7b5, 0xc8d0da);
        grid.position.y = def.floor; this.detailGroup.add(grid);
      }
      this.exNow = this.exGoal = 0; this.selected = null;
      this.mode = 'detail'; this.hud.dataset.mode = 'detail';
      this.world.visible = false; this.detailRoot.visible = true;
      this.scene.background = DETAIL_BG; this.scene.fog = null;
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
      if (this.mode === 'walk') { drag = { id: e.pointerId, x: e.clientX, y: e.clientY }; cv.setPointerCapture?.(e.pointerId); cv.focus({ preventScroll: true }); }
      else if (this.mode === 'detail') drag = { id: e.pointerId, x: e.clientX, y: e.clientY, sx: e.clientX, sy: e.clientY, pick: true };
    });
    cv.addEventListener('pointermove', (e) => {
      if (this.mode !== 'walk') return;
      if (this.locked) { this.yaw -= e.movementX * 0.0022; this.pitch -= e.movementY * 0.0022; this._look(); return; }
      if (!drag || e.pointerId !== drag.id) return;
      this.yaw += (e.clientX - drag.x) * 0.0042; this.pitch += (e.clientY - drag.y) * 0.0042;
      drag.x = e.clientX; drag.y = e.clientY; this._look();
    });
    const up = (e) => {
      if (drag?.pick && Math.hypot(e.clientX - drag.sx, e.clientY - drag.sy) < 5) this._pick(e);
      drag = null;
    };
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
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h; this.camera.updateProjectionMatrix();
    if (this.labels) for (const l of this.labels) l.w = l.el.offsetWidth || l.w;
  }

  setActive(on) { this.active = on; if (on) this.resize(); }

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
    for (const f of this.tickers) f(dt, t);

    if (this.mode === 'walk') {
      const k = this.keys, run = k.has('ShiftLeft') || k.has('ShiftRight');
      const turn = (k.has('ArrowLeft') ? 1 : 0) - (k.has('ArrowRight') ? 1 : 0);
      if (turn) { this.yaw += turn * 1.7 * dt; }
      const f = (k.has('KeyW') || k.has('ArrowUp') ? 1 : 0) - (k.has('KeyS') || k.has('ArrowDown') ? 1 : 0) - this.joy.y;
      const s = (k.has('KeyD') ? 1 : 0) - (k.has('KeyA') ? 1 : 0) + this.joy.x;
      if (f || s) {
        const len = Math.max(1, Math.hypot(f, s)), sp = (run ? RUN : WALK) * dt / len;
        const nx = this.pos.x + (-Math.sin(this.yaw) * f + Math.cos(this.yaw) * s) * sp;
        const nz = this.pos.y + (-Math.cos(this.yaw) * f - Math.sin(this.yaw) * s) * sp;
        const [cx, cz] = this._collide(clamp(nx, -48, 48), clamp(nz, -48, 48));
        this.pos.set(cx, cz);
      }
      this.camera.position.set(this.pos.x, EYE + Math.sin(t * 9) * ((f || s) ? 0.012 : 0), this.pos.y);
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
    this.renderer.render(this.scene, this.camera);
  }

  _updatePins() {
    const { w, h } = this;
    for (const p of this.pins) {
      const hs = p.h, show = this.phase >= (hs.from || 0) && this.phase < (hs.until ?? 99);
      if (!show) { p.el.style.display = 'none'; continue; }
      const v = this._v.copy(p.v).project(this.camera);
      const dist = this.camera.position.distanceTo(p.v);
      const on = v.z < 1 && Math.abs(v.x) < 1.08 && Math.abs(v.y) < 1.08 && dist < 90;
      p.el.style.display = on ? '' : 'none';
      if (on) {
        p.el.style.transform = `translate(${(v.x * 0.5 + 0.5) * w}px, ${(-v.y * 0.5 + 0.5) * h}px) translate(-50%,-50%) scale(${clamp(1.25 - dist / 90, 0.7, 1.15).toFixed(2)})`;
        p.el.classList.toggle('near', this.near === hs);
      }
    }
  }

  dispose() { this.renderer.setAnimationLoop(null); this.renderer.dispose(); }
}

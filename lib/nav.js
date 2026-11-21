// Navigation the way an iPhone app does it, shared by the home-screen apps.
// The apps are single pages: tabs, drill-in screens and <dialog> sheets never touched the browser's history, so
// iOS's own back swipe (and the browser Back button) had nothing to go back to. A "level" is an open sheet or
// drill-in screen. Opening one adds a history entry (same URL, so apps that use the hash are untouched); Back, or a
// swipe from the left edge, closes the top one. Tabs are not levels: like a tab bar on iPhone, Back at the root
// does nothing.
// No DOM at import time; createNav takes a window and document so the bookkeeping is tested in Node
// (test/nav.test.js). The gesture code is checked in a real browser (scripts/ in the task notes).

export const EDGE = 22;       // px from the left edge where a back swipe may start (a thumb's width, clear of chip rows)
export const BACK_DX = 70;    // px dragged right to go back
export const CLOSE_DY = 80;   // px dragged down to close a sheet
const SLOP = 10;              // px of drag before it has a direction
const FLICK = 0.45;           // px/ms: a short, quick swipe counts too
const FLICK_MIN = 40;         // px: but not a twitch

// The thresholds for every gesture, with no DOM: axis is the direction the drag has settled on, back is "this swipe
// from the edge goes back", close is "this drag down closes the sheet". dt is milliseconds.
export function swipeDecision({ dx = 0, dy = 0, dt = 1, edge = false } = {}) {
  const ax = Math.abs(dx), ay = Math.abs(dy);
  const axis = ax < SLOP && ay < SLOP ? null : ax > ay ? "x" : "y";
  const flat = ay <= ax * 0.6;
  const quick = dx >= FLICK_MIN && dx / Math.max(dt, 1) >= FLICK;
  return {
    axis,
    back: edge && axis === "x" && dx > 0 && flat && (dx >= BACK_DX || quick),
    close: axis === "y" && dy > CLOSE_DY,
  };
}

const noop = () => {};
const depthOf = (state) => (state && Number.isInteger(state.nav) && state.nav > 0 ? state.nav : 0);
const FORM = "input, select, textarea, [data-no-swipe]";

export function createNav({ win = globalThis.window, doc = globalThis.document } = {}) {
  const hist = win && win.history;
  const inert = {
    get depth() { return 0; },
    push: noop, release: noop, back: noop,
    watchDialog: () => noop, installEdgeSwipe: () => noop, pullToRefresh: () => noop, onTabReselect: () => noop, swipeDownToClose: () => noop,
  };
  if (!hist) return inert;

  // One entry per pushed history entry, bottom to top. key === null is a dead entry: its level was closed while
  // another sat above it, so its history entry can't be removed yet; it is skipped silently when Back reaches it.
  const stack = [];
  let silent = 0, silentTimer = 0, seq = 0;
  const watched = new Set();

  // Our own history.go() will fire popstate; that event must not close anything. If the browser never fires it,
  // forget the expectation after a moment so a real Back is never swallowed.
  function expectPop(delta) {
    silent++;
    hist.go(delta);
    win.clearTimeout?.(silentTimer);
    silentTimer = win.setTimeout?.(() => { silent = 0; }, 800);
    silentTimer?.unref?.();
  }
  function trim() {
    let n = 0;
    while (stack.length && stack[stack.length - 1].key === null) { stack.pop(); n++; }
    if (n) expectPop(-n);
  }

  win.addEventListener("popstate", (e) => {
    if (silent > 0) { if (--silent === 0) win.clearTimeout?.(silentTimer); return; }
    const target = depthOf(e.state);
    // Forward onto an entry no level owns (iPhone's right-edge swipe, or one left over from before a reload): send it back.
    if (target > stack.length) return expectPop(stack.length - target);
    while (stack.length > target) {
      const lvl = stack.pop();
      if (lvl.key !== null) { try { lvl.onBack(); } catch { /* a handler that fails must not strand the stack */ } }
    }
    trim();
  });
  // After a reload the current entry can still carry a depth from the last visit; nothing is open now.
  if (depthOf(hist.state)) hist.replaceState(null, "");

  const api = {
    get depth() { return stack.length; },

    // A level opened. onBack hides it and must not call release (history has already moved).
    push(key, onBack) {
      const open = stack.find((l) => l.key === key);
      if (open) { open.onBack = onBack; return; }   // the same sheet showing new content: one entry
      stack.push({ key, onBack });
      hist.pushState({ nav: stack.length }, "");
    },

    // The UI closed a level itself (✕, backdrop, Escape, code). Its history entry goes too, without running onBack.
    release(key) {
      const i = stack.findIndex((l) => l.key === key);
      if (i < 0) return;
      if (i < stack.length - 1) { stack[i] = { key: null, onBack: null }; return; }
      stack.pop();
      let n = 1;
      while (stack.length && stack[stack.length - 1].key === null) { stack.pop(); n++; }
      expectPop(-n);
    },

    back() { if (stack.length) hist.go(-1); },

    // A <dialog> sheet: opening pushes a level, closing by any path releases it, and Back runs the app's own close
    // (so its slide-out animation stays). Content swaps on an open dialog don't touch history.
    watchDialog(dialog, { close, swipeDown = false } = {}) {
      if (!dialog) return noop;
      const key = dialog.id || `dialog-${++seq}`;
      const shut = close || (() => dialog.close());
      const sync = () => { if (dialog.open) api.push(key, shut); else api.release(key); };
      const MO = win.MutationObserver;
      const mo = MO ? new MO(sync) : null;
      if (mo) mo.observe(dialog, { attributes: true, attributeFilter: ["open"] });
      watched.add(dialog);
      if (dialog.open) sync();
      const off = swipeDown ? api.swipeDownToClose(dialog, shut) : noop;
      return () => { if (mo) mo.disconnect(); watched.delete(dialog); off(); api.release(key); };
    },

    // Drag a sheet down to close it, only from the top of its content so scrolling still works.
    swipeDownToClose(dialog, close = () => dialog.close(), { ignore = FORM } = {}) {
      if (!dialog || !doc) return noop;
      let g = null;
      const reset = () => { dialog.style.transform = ""; };
      const start = (e) => {
        g = e.touches.length === 1 && dialog.scrollTop <= 0 && !e.target.closest?.(ignore)
          ? { x: e.touches[0].clientX, y: e.touches[0].clientY, t: e.timeStamp, drag: false } : null;
      };
      const move = (e) => {
        if (!g) return;
        const dx = e.touches[0].clientX - g.x, dy = e.touches[0].clientY - g.y;
        const { axis } = swipeDecision({ dx, dy });
        if (!g.drag && axis === "x") { g = null; return; }
        if (axis === "y" && dy > 0 && dialog.scrollTop <= 0) { g.drag = true; dialog.style.transform = `translateY(${dy}px)`; }
        else if (g.drag) reset();
      };
      const end = (e) => {
        if (!g) return;
        const t = e.changedTouches[0], d = swipeDecision({ dx: t.clientX - g.x, dy: t.clientY - g.y, dt: e.timeStamp - g.t });
        const drag = g.drag; g = null;
        if (!drag) return;
        reset();
        if (d.close) close();
      };
      const cancel = () => { g = null; reset(); };
      dialog.addEventListener("touchstart", start, { passive: true });
      dialog.addEventListener("touchmove", move, { passive: true });
      dialog.addEventListener("touchend", end);
      dialog.addEventListener("touchcancel", cancel);
      return () => {
        dialog.removeEventListener("touchstart", start); dialog.removeEventListener("touchmove", move);
        dialog.removeEventListener("touchend", end); dialog.removeEventListener("touchcancel", cancel);
      };
    },

    // Swipe right from the left edge to go back, the sheet or screen following the finger. iOS's own gesture, where
    // it exists, cancels the touch and fires popstate, which closes the same level once: never both.
    installEdgeSwipe() {
      if (!doc || api._edge) return api._edge || noop;
      let g = null;
      const reduced = () => win.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
      const main = () => doc.querySelector("main");
      const openDialogs = () => [...doc.querySelectorAll("dialog[open]")];
      const scrolledAside = (el) => {
        for (; el && el.nodeType === 1 && el !== doc.body; el = el.parentElement) {
          if (el.scrollWidth > el.clientWidth + 1 && /(auto|scroll)/.test(win.getComputedStyle(el).overflowX) && el.scrollLeft > 0) return true;
        }
        return false;
      };
      const settle = (el) => { el.style.transition = ""; el.style.transform = ""; el.style.visibility = ""; el.classList.remove("nav-dragging"); };

      const start = (e) => {
        g = null;
        if (!stack.length || e.touches.length !== 1) return;
        const t = e.touches[0];
        if (t.clientX > EDGE || e.target.closest?.("input[type=range]") || scrolledAside(e.target)) return;
        const open = openDialogs();
        if (open.some((d) => !watched.has(d))) return;   // a dialog this layer doesn't know: leave history alone
        g = { x: t.clientX, y: t.clientY, t: e.timeStamp, el: open[open.length - 1] || main(), drag: false };
      };
      const move = (e) => {
        if (!g) return;
        const dx = e.touches[0].clientX - g.x, dy = e.touches[0].clientY - g.y;
        const { axis } = swipeDecision({ dx, dy, edge: true });
        if (axis === "y" || (axis === "x" && dx < 0)) { if (g.drag && g.el) settle(g.el); g = null; return; }
        if (axis !== "x" || !g.el) return;
        g.drag = true;
        g.el.classList.add("nav-dragging");
        g.el.style.transition = "none";
        g.el.style.transform = `translateX(${dx}px)`;
      };
      const end = (e) => {
        if (!g) return;
        const t = e.changedTouches[0], { el, drag } = g;
        const d = swipeDecision({ dx: t.clientX - g.x, dy: t.clientY - g.y, dt: e.timeStamp - g.t, edge: true });
        g = null;
        if (!d.back || !stack.length) { if (drag && el) { el.style.transition = "transform 200ms cubic-bezier(.2,.7,.3,1)"; el.style.transform = ""; setTimeout(() => settle(el), 220); } return; }
        if (!el || reduced()) { if (el) settle(el); api.back(); return; }
        // Slide it off, then hand over to the app's own close. A dialog stays hidden while its own close animation
        // runs, so it doesn't flash back onscreen.
        const isDialog = el.localName === "dialog";
        el.style.transition = "transform 150ms cubic-bezier(.3,.7,.4,1)";
        el.style.transform = `translateX(${win.innerWidth || 400}px)`;
        setTimeout(() => {
          if (isDialog) el.style.visibility = "hidden";
          api.back();
          if (isDialog) setTimeout(() => settle(el), 450); else settle(el);
        }, 150);
      };
      const cancel = () => { if (g && g.drag && g.el) settle(g.el); g = null; };
      doc.addEventListener("touchstart", start, { passive: true });
      doc.addEventListener("touchmove", move, { passive: true });
      doc.addEventListener("touchend", end);
      doc.addEventListener("touchcancel", cancel);
      return (api._edge = () => {
        doc.removeEventListener("touchstart", start); doc.removeEventListener("touchmove", move);
        doc.removeEventListener("touchend", end); doc.removeEventListener("touchcancel", cancel);
        api._edge = null;
      });
    },

    // Pull down at the top of the page (or of el, a scroll container) to refresh, like Mail or Safari. onRefresh may
    // return a promise; the spinner stays until it settles (and at least half a second, so it is seen). enabled() lets
    // an app switch it off on screens where a pull means something else (flashcards); ignore is a selector for parts of
    // the page where a vertical drag already means something (a chart).
    pullToRefresh(el, onRefresh, { threshold = 70, enabled = () => true, ignore = "" } = {}) {
      if (!doc) return noop;
      const scroller = !el || el === win || el === doc || el === doc.documentElement || el === doc.body ? null : el;
      const top = () => (scroller ? scroller.scrollTop : win.scrollY || doc.documentElement.scrollTop || 0) <= 0;
      let g = null, busy = false, ind = null;
      const indicator = () => {
        if (ind) return ind;
        ind = doc.createElement("div");
        ind.className = "nav-ptr";
        ind.setAttribute("aria-hidden", "true");
        ind.innerHTML = "<i></i>";
        doc.body.appendChild(ind);
        return ind;
      };
      const show = (pull) => {
        const n = indicator();
        n.style.transition = "none";
        n.style.opacity = String(Math.min(1, pull / threshold));
        n.style.transform = `translateY(${Math.min(pull * 0.55, 72)}px)`;
        n.style.setProperty("--p", String(Math.min(pull / threshold, 1) * 180));
        n.classList.toggle("ready", pull >= threshold);
      };
      const hide = () => {
        if (!ind) return;
        ind.style.transition = "";
        ind.style.opacity = "";
        ind.style.transform = "";
        ind.classList.remove("ready", "busy");
      };
      const scrolledAside = (n) => {
        for (; n && n.nodeType === 1 && n !== doc.body; n = n.parentElement) {
          if (n.scrollWidth > n.clientWidth + 1 && /(auto|scroll)/.test(win.getComputedStyle(n).overflowX)) return true;
        }
        return false;
      };
      const start = (e) => {
        g = null;
        if (busy || e.touches.length !== 1 || doc.querySelector("dialog[open]") || !top() || !enabled()) return;
        const t = e.touches[0];
        if (t.clientX <= EDGE || e.target.closest?.(`${FORM}, [data-no-ptr]${ignore ? `, ${ignore}` : ""}`) || scrolledAside(e.target)) return;
        g = { x: t.clientX, y: t.clientY, pull: 0, on: false };
      };
      const move = (e) => {
        if (!g) return;
        const dx = e.touches[0].clientX - g.x, dy = e.touches[0].clientY - g.y;
        if (!g.on) {
          const { axis } = swipeDecision({ dx, dy });
          if (axis === "x" || (axis === "y" && dy < 0)) { g = null; return; }
          if (axis !== "y") return;
          g.on = true;
        }
        if (!top()) { g.on = false; g = null; hide(); return; }
        if (e.cancelable) e.preventDefault();   // our own indicator replaces iOS's rubber band
        g.pull = Math.max(0, dy);
        show(g.pull);
      };
      const end = async () => {
        if (!g) return;
        const { on, pull } = g; g = null;
        if (!on) return;
        if (pull < threshold) return hide();
        busy = true;
        const n = indicator();
        n.style.transition = "";
        n.style.opacity = "1";
        n.style.transform = "translateY(52px)";
        n.classList.add("busy");
        try { await Promise.all([Promise.resolve().then(onRefresh), new Promise((r) => setTimeout(r, 500))]); } catch { /* the app reports its own errors */ }
        busy = false;
        hide();
      };
      const cancel = () => { if (g && g.on) hide(); g = null; };
      doc.addEventListener("touchstart", start, { passive: true });
      doc.addEventListener("touchmove", move, { passive: false });
      doc.addEventListener("touchend", end);
      doc.addEventListener("touchcancel", cancel);
      return () => {
        doc.removeEventListener("touchstart", start); doc.removeEventListener("touchmove", move);
        doc.removeEventListener("touchend", end); doc.removeEventListener("touchcancel", cancel);
        if (ind) ind.remove();
        ind = null;
      };
    },

    // Tapping the tab you are already on scrolls to the top, as on iPhone. Runs before the app's own tab handler, so
    // "already on" still means the old tab.
    onTabReselect(bar, selector, handler = () => win.scrollTo({ top: 0, behavior: "smooth" })) {
      if (!bar) return noop;
      const current = (b) => b.classList.contains("active") || b.classList.contains("on") || b.getAttribute("aria-current") === "page" || b.getAttribute("aria-selected") === "true";
      const on = (e) => { const b = e.target.closest?.(selector); if (b && bar.contains(b) && current(b)) handler(b, e); };
      bar.addEventListener("click", on);
      return () => bar.removeEventListener("click", on);
    },
  };
  return api;
}

// The ready-made instance for pages. Built on first use so importing this in Node touches nothing.
let shared;
export const nav = new Proxy({}, {
  get(_, key) {
    shared ||= createNav();
    const v = shared[key];
    return typeof v === "function" ? v.bind(shared) : v;
  },
});
export default nav;

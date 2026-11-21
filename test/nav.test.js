import { test } from "node:test";
import assert from "node:assert/strict";
import { createNav, swipeDecision, EDGE, BACK_DX, CLOSE_DY } from "../lib/nav.js";

// A window with a history that behaves like the browser's: pushState drops the forward entries, back/go move
// asynchronously and then fire popstate with the state of the entry landed on.
function fakeWindow(initialState = null) {
  const listeners = { popstate: [] };
  const h = { entries: [{ state: initialState }], index: 0, calls: [], pushes: [], replaced: [] };
  const win = {
    listeners,
    history: {
      get state() { return h.entries[h.index].state; },
      pushState(state, title, url) { h.pushes.push({ state, url }); h.entries.splice(h.index + 1); h.entries.push({ state }); h.index++; },
      replaceState(state, title, url) { h.replaced.push({ state, url }); h.entries[h.index] = { state }; },
      back() { this.go(-1); },
      go(d) {
        h.calls.push(d);
        queueMicrotask(() => {
          const i = h.index + d;
          if (i < 0 || i >= h.entries.length) return;
          h.index = i;
          for (const fn of listeners.popstate) fn({ state: h.entries[i].state });
        });
      },
    },
    addEventListener(type, fn) { (listeners[type] ||= []).push(fn); },
    removeEventListener(type, fn) { listeners[type] = (listeners[type] || []).filter((f) => f !== fn); },
    setTimeout: (fn, ms) => setTimeout(fn, ms), clearTimeout: (t) => clearTimeout(t),
  };
  return { win, h };
}
const tick = () => new Promise((r) => setTimeout(r, 0));
const setup = (state) => { const e = fakeWindow(state); return { ...e, nav: createNav({ win: e.win, doc: null }) }; };

test("push opens a level: one history entry, the same URL, depth 1", () => {
  const { nav, h } = setup();
  nav.push("sheet", () => {});
  assert.equal(nav.depth, 1);
  assert.deepEqual(h.pushes, [{ state: { nav: 1 }, url: undefined }]);
});

test("Back closes the top level through onBack, once, and adds no history", async () => {
  const { nav, h } = setup();
  let backs = 0;
  nav.push("sheet", () => { backs++; });
  nav.back();
  await tick();
  assert.equal(backs, 1);
  assert.equal(nav.depth, 0);
  assert.equal(h.index, 0);
  assert.equal(h.pushes.length, 1);
});

test("release (the UI closed it) pops the history entry without running onBack", async () => {
  const { nav, h } = setup();
  let backs = 0;
  nav.push("sheet", () => { backs++; });
  nav.release("sheet");
  await tick();
  assert.equal(backs, 0);
  assert.equal(nav.depth, 0);
  assert.equal(h.index, 0);
});

test("release of a key that is not open does nothing", async () => {
  const { nav, h } = setup();
  nav.release("nope");
  await tick();
  assert.deepEqual(h.calls, []);
  assert.equal(nav.depth, 0);
});

test("Back at the root does nothing, as on iPhone", async () => {
  const { nav, h } = setup();
  nav.back();
  await tick();
  assert.deepEqual(h.calls, []);
});

test("pushing a key that is already open swaps its handler instead of adding an entry", () => {
  const { nav, h } = setup();
  let which = "";
  nav.push("sheet", () => { which = "old"; });
  nav.push("sheet", () => { which = "new"; });
  assert.equal(nav.depth, 1);
  assert.equal(h.pushes.length, 1);
  nav.back();
  return tick().then(() => assert.equal(which, "new"));
});

test("levels close top-down, one Back each", async () => {
  const { nav } = setup();
  const log = [];
  nav.push("a", () => log.push("a"));
  nav.push("b", () => log.push("b"));
  nav.back(); await tick();
  assert.deepEqual(log, ["b"]);
  assert.equal(nav.depth, 1);
  nav.back(); await tick();
  assert.deepEqual(log, ["b", "a"]);
  assert.equal(nav.depth, 0);
});

test("closing a lower level first keeps history aligned: its entry is skipped silently later", async () => {
  const { nav, h } = setup();
  const log = [];
  nav.push("a", () => log.push("a"));
  nav.push("b", () => log.push("b"));
  nav.release("a");            // a closed under b: its history entry can't be removed yet
  await tick();
  assert.equal(nav.depth, 2);
  assert.deepEqual(h.calls, []);
  nav.back(); await tick();    // b closes; the dead entry under it is skipped in the same step
  await tick();
  assert.deepEqual(log, ["b"], "a's handler never runs: it was already closed");
  assert.equal(nav.depth, 0);
  assert.equal(h.index, 0, "history is back at the root, not stranded on a's entry");
});

test("release then an immediate push (a sheet re-opened at once) stays consistent", async () => {
  const { nav } = setup();
  const log = [];
  nav.push("sheet", () => log.push("first"));
  nav.release("sheet");
  nav.push("sheet", () => log.push("second"));
  await tick();
  assert.equal(nav.depth, 1);
  nav.back(); await tick();
  assert.deepEqual(log, ["second"]);
  assert.equal(nav.depth, 0);
});

test("a forward step (iPhone's right-edge swipe) onto a dead entry is undone silently", async () => {
  const { nav, h, win } = setup();
  nav.push("a", () => {});
  nav.back(); await tick();
  assert.equal(nav.depth, 0);
  win.history.go(1); await tick();   // forward onto the entry that was popped
  await tick();
  assert.equal(h.index, 0, "sent straight back");
  assert.equal(nav.depth, 0);
});

test("a reload that left a stale nav entry current is normalised, not trusted", () => {
  const { nav, h } = setup({ nav: 2 });
  assert.equal(nav.depth, 0);
  assert.deepEqual(h.replaced, [{ state: null, url: undefined }]);
});

test("a stale entry reached with Back is skipped on the way down", async () => {
  const e = fakeWindow(null);
  e.h.entries = [{ state: null }, { state: { nav: 1 } }, { state: null }];  // a reload left entry 1 behind
  e.h.index = 2;
  const nav = createNav({ win: e.win, doc: null });
  e.win.history.go(-1); await tick();
  await tick();
  assert.equal(e.h.index, 0, "stale entry skipped to the real root");
  assert.equal(nav.depth, 0);
});

test("our own pop is not mistaken for the user's Back, even if an app's replaceState wiped the entry's state", async () => {
  const { nav, win } = setup();
  const log = [];
  nav.push("a", () => log.push("a"));
  win.history.replaceState(null, "");        // travel/plan.js and the Lions page do this to the current entry
  nav.push("b", () => log.push("b"));
  nav.release("b");                          // lands on a's entry, which now reads as depth 0
  await tick();
  await tick();
  assert.deepEqual(log, [], "a must not be closed by our own pop");
  assert.equal(nav.depth, 1);
});

test("createNav without a window is inert", () => {
  const nav = createNav({ win: undefined, doc: undefined });
  nav.push("x", () => {});
  nav.release("x");
  nav.back();
  assert.equal(nav.depth, 0);
});

// ---------- dialogs ----------

function fakeDialog(id = "sheet") {
  const observers = [];
  class MO { constructor(cb) { this.cb = cb; observers.push(this); } observe() {} disconnect() {} }
  const d = {
    id, open: false,
    showModal() { this.open = true; },
    close() { this.open = false; },
    flush() { for (const o of observers) o.cb([]); },
  };
  return { d, MO };
}
const withDialogs = (state) => {
  const { d, MO } = fakeDialog();
  const e = fakeWindow(state);
  e.win.MutationObserver = MO;
  return { ...e, d, nav: createNav({ win: e.win, doc: null }) };
};

test("watchDialog: opening pushes a level, Back closes it through the app's own close", async () => {
  const { nav, d } = withDialogs();
  const closed = [];
  nav.watchDialog(d, { close: () => { closed.push("app"); d.close(); } });
  d.showModal(); d.flush();
  assert.equal(nav.depth, 1);
  nav.back(); await tick();
  assert.deepEqual(closed, ["app"]);
  d.flush();
  assert.equal(nav.depth, 0);
});

test("watchDialog: closing from the UI pops the history entry", async () => {
  const { nav, d, h } = withDialogs();
  nav.watchDialog(d);
  d.showModal(); d.flush();
  d.close(); d.flush();
  await tick();
  assert.equal(nav.depth, 0);
  assert.equal(h.index, 0);
});

test("watchDialog: without a close option, Back calls dialog.close()", async () => {
  const { nav, d } = withDialogs();
  nav.watchDialog(d);
  d.showModal(); d.flush();
  nav.back(); await tick();
  assert.equal(d.open, false);
});

test("watchDialog: swapping the content of an open dialog never pushes twice", () => {
  const { nav, d, h } = withDialogs();
  nav.watchDialog(d);
  d.showModal(); d.flush();
  d.flush(); d.flush();
  assert.equal(h.pushes.length, 1);
  assert.equal(nav.depth, 1);
});

test("watchDialog: re-opened straight after closing leaves one level", async () => {
  const { nav, d } = withDialogs();
  nav.watchDialog(d);
  d.showModal(); d.flush();
  d.close(); d.showModal(); d.flush();   // one observer batch: closed and open again
  await tick();
  assert.equal(nav.depth, 1);
  nav.back(); await tick();
  assert.equal(d.open, false);
  assert.equal(nav.depth, 0);
});

test("watchDialog: a dialog already open when watched counts at once", () => {
  const { nav, d } = withDialogs();
  d.showModal();
  nav.watchDialog(d);
  assert.equal(nav.depth, 1);
});

// ---------- gestures: the thresholds ----------

test("swipeDecision: from the left edge, far enough and flat, goes back", () => {
  const r = swipeDecision({ dx: BACK_DX, dy: 6, dt: 400, edge: true });
  assert.equal(r.axis, "x");
  assert.equal(r.back, true);
});

test("swipeDecision: not from the edge never goes back", () => {
  assert.equal(swipeDecision({ dx: 200, dy: 4, dt: 300, edge: false }).back, false);
});

test("swipeDecision: too short and slow springs back", () => {
  assert.equal(swipeDecision({ dx: BACK_DX - 1, dy: 0, dt: 900, edge: true }).back, false);
});

test("swipeDecision: a short quick flick from the edge still goes back", () => {
  assert.equal(swipeDecision({ dx: 45, dy: 5, dt: 60, edge: true }).back, true);
});

test("swipeDecision: mostly vertical is a scroll, not a back", () => {
  const r = swipeDecision({ dx: 80, dy: 120, dt: 300, edge: true });
  assert.equal(r.axis, "y");
  assert.equal(r.back, false);
});

test("swipeDecision: a small wobble has no axis yet", () => {
  assert.equal(swipeDecision({ dx: 3, dy: 2, dt: 50, edge: true }).axis, null);
});

test("swipeDecision: a sheet closes past CLOSE_DY downwards, not upwards or sideways", () => {
  assert.equal(swipeDecision({ dx: 4, dy: CLOSE_DY + 1, dt: 300 }).close, true);
  assert.equal(swipeDecision({ dx: 4, dy: CLOSE_DY, dt: 300 }).close, false);
  assert.equal(swipeDecision({ dx: 4, dy: -200, dt: 300 }).close, false);
  assert.equal(swipeDecision({ dx: 200, dy: 100, dt: 300 }).close, false);
});

test("the edge zone is a thumb's width, not the whole screen", () => {
  assert.ok(EDGE >= 16 && EDGE <= 30);
});

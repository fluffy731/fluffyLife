import { SECTIONS, TRIPS } from "./items.js";
import { load, save, visible, progress } from "./model.js";

const $ = (q) => document.querySelector(q);
const S = load(localStorage);
const list = $("#list");
const collapsed = new Set();
const persist = () => save(localStorage, S);

function el(tag, props = {}, kids = []) {
  const n = Object.assign(document.createElement(tag), props);
  for (const k of [].concat(kids)) n.append(k);
  return n;
}

function render() {
  const shown = visible(SECTIONS, S.mode, S.mine, S.trip);
  list.replaceChildren();
  for (const sec of shown) {
    const items = S.hideDone ? sec.items.filter((it) => !S.ticked[it.key]) : sec.items;
    const { done, total } = progress([sec], S.ticked);
    const det = el("details", { className: "sec" + (total && done === total ? " full" : ""), open: !collapsed.has(sec.title) });
    det.addEventListener("toggle", () => { det.open ? collapsed.delete(sec.title) : collapsed.add(sec.title); paintExpand(); });
    det.append(el("summary", {}, [el("span", { className: "ic", textContent: sec.icon }), el("span", { className: "st", textContent: sec.title }),
      el("span", { className: "n", textContent: total ? `${done}/${total}` : "" })]));
    const ul = el("ul");
    for (const it of items) {
      const box = el("input", { type: "checkbox", checked: !!S.ticked[it.key] });
      box.addEventListener("change", () => {
        if (box.checked) S.ticked[it.key] = true; else delete S.ticked[it.key];
        persist(); render();
      });
      const kids = [box, el("span", { className: "t", textContent: it.text })];
      if (it.long) kids.push(el("span", { className: "tag", textContent: "long" }));
      const row = el("li", { className: S.ticked[it.key] ? "done" : "" }, el("label", {}, kids));
      if (sec.mine) {
        const del = el("button", { type: "button", className: "del", textContent: "✕", ariaLabel: `Remove ${it.text}` });
        del.addEventListener("click", () => { S.mine = S.mine.filter((t) => t !== it.text); delete S.ticked[it.key]; persist(); render(); });
        row.append(del);
      }
      ul.append(row);
    }
    if (S.hideDone && total && !items.length) ul.append(el("li", { className: "empty", textContent: "All packed ✓" }));
    det.append(ul);
    if (sec.mine) det.append(mineForm());
    list.append(det);
  }
  const { done, total } = progress(shown, S.ticked);
  $("#count").textContent = `${done} / ${total} packed`;
  $("#bar").style.width = total ? `${(100 * done) / total}%` : "0";
  for (const b of document.querySelectorAll("[data-mode]")) b.setAttribute("aria-checked", String(b.dataset.mode === S.mode));
  for (const b of document.querySelectorAll("[data-trip]")) b.setAttribute("aria-checked", String(b.dataset.trip === S.trip));
  $("#hideDone").checked = S.hideDone;
  paintExpand();
}

function mineForm() {
  const f = $("#mine-form").content.firstElementChild.cloneNode(true);
  f.addEventListener("submit", (e) => {
    e.preventDefault();
    const text = f.elements.text.value.trim();
    if (text && !S.mine.includes(text)) { S.mine.push(text); persist(); }
    render();
    list.querySelector(".add input")?.focus();
  });
  return f;
}

const allClosed = () => list.children.length > 0 && [...list.children].every((d) => !d.open);
function paintExpand() {
  $("#expand").textContent = allClosed() ? "Expand all" : "Collapse all";
}

if (!TRIPS.some((t) => t.id === S.trip)) S.trip = TRIPS[0].id;
$("#trips").append(...TRIPS.map((t) => {
  const b = el("button", { type: "button", textContent: t.label });
  b.setAttribute("role", "radio"); b.dataset.trip = t.id;
  b.addEventListener("click", () => { S.trip = t.id; persist(); render(); });
  return b;
}));
for (const b of document.querySelectorAll("[data-mode]")) b.addEventListener("click", () => { S.mode = b.dataset.mode; persist(); render(); });
$("#hideDone").addEventListener("change", (e) => { S.hideDone = e.target.checked; persist(); render(); });
$("#expand").addEventListener("click", () => {
  if (allClosed()) collapsed.clear();
  else for (const s of visible(SECTIONS, S.mode, S.mine, S.trip)) collapsed.add(s.title);
  render();
});

// Two taps to reset, so a stray touch can't wipe a half-packed bag. Keeps your own items and the trip mode.
let armed = 0;
$("#reset").addEventListener("click", (e) => {
  const b = e.currentTarget;
  if (!armed) {
    b.textContent = "Tap again to clear"; b.classList.add("armed");
    armed = setTimeout(() => { armed = 0; b.textContent = "Reset ticks"; b.classList.remove("armed"); }, 3000);
    return;
  }
  clearTimeout(armed); armed = 0; b.textContent = "Reset ticks"; b.classList.remove("armed");
  S.ticked = {}; persist(); render();
});

render();

if ("serviceWorker" in navigator) navigator.serviceWorker.register("../sw.js").catch(() => {});

// Small DOM helpers shared by the Spots screens.
export const EMOJI = { eat: "🍜", drink: "🍸", coffee: "☕", sights: "🏛️", activities: "🎳", dessert: "🍨" };
export const $ = (sel, root = document) => root.querySelector(sel);
export const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
export const fmtCount = (n) => Number(n || 0).toLocaleString("en-AU");

let toastTimer = 0;
export function toast(msg) {
  const t = $("#toast"), d = $("#sheet");
  const host = d && d.open ? d : document.body; // an open sheet covers everything, so the message goes inside it
  if (t.parentNode !== host) host.appendChild(t);
  t.textContent = msg; t.classList.add("on");
  clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove("on"), 2200);
}

// The toast may be inside the sheet (see toast); take it out before the sheet's contents are replaced.
const rescueToast = () => { const t = $("#toast"); if (t && t.parentNode !== document.body) document.body.appendChild(t); };

export function openSheet(html) {
  const d = $("#sheet");
  rescueToast();
  d.innerHTML = `<div class="in">${html}</div>`;
  if (!d.open) d.showModal();
  d.scrollTop = 0;
  return d;
}
export function closeSheet() { const d = $("#sheet"); rescueToast(); if (d.open) d.close(); }

export const sheetBar = `<div class="bar"><span class="grab"></span><button class="icon-btn" type="button" data-close aria-label="Close">✕</button></div>`;

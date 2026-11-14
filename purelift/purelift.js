// PureLift: language switch, phone menu, the endless photo strip and the WeChat pop-up.
const root = document.documentElement;
const TITLES = { en: "PureLift · Aesthetic Clinic", zh: "PureLift 医美诊所" };

function setLang(lang, { save = true } = {}) {
  lang = lang === "zh" ? "zh" : "en";
  root.dataset.lang = lang;
  root.lang = lang === "zh" ? "zh-Hans" : "en-AU";
  document.title = TITLES[lang];
  for (const b of document.querySelectorAll("[data-set-lang]")) b.setAttribute("aria-pressed", String(b.dataset.setLang === lang));
  if (save) {
    try { localStorage.setItem("purelift-lang", lang); } catch {}
    // A shared link keeps working: ?lang= follows the choice instead of overriding it on reload.
    const url = new URL(location.href);
    if (url.searchParams.has("lang")) { url.searchParams.set("lang", lang); history.replaceState(null, "", url); }
  }
}
setLang(root.dataset.lang, { save: false });

// Language dropdown (desktop)
const langBtn = document.querySelector(".lang-btn");
const langMenu = document.getElementById("lang-menu");
const setLangMenu = (open) => { langBtn.setAttribute("aria-expanded", String(open)); langMenu.hidden = !open; };
langBtn.addEventListener("click", (e) => { e.stopPropagation(); setLangMenu(langMenu.hidden); });
document.addEventListener("click", (e) => {
  const b = e.target.closest("[data-set-lang]");
  if (b) { setLang(b.dataset.setLang); setLangMenu(false); setDrawer(false); return; }
  if (!e.target.closest(".lang")) setLangMenu(false);
});

// Phone menu
const menuBtn = document.querySelector(".menu-btn");
const drawer = document.getElementById("drawer");
function setDrawer(open) {
  // Start the menu at the header's real bottom edge (the draft banner can push the header down).
  if (open) drawer.style.top = `${Math.max(0, document.querySelector(".header").getBoundingClientRect().bottom)}px`;
  menuBtn.setAttribute("aria-expanded", String(open));
  drawer.hidden = !open;
  root.classList.toggle("menu-open", open);
}
menuBtn.addEventListener("click", () => setDrawer(drawer.hidden));
drawer.addEventListener("click", (e) => { if (e.target === drawer || e.target.closest("a")) setDrawer(false); });
document.addEventListener("keydown", (e) => {
  if (e.key !== "Escape") return;
  if (!langMenu.hidden) { setLangMenu(false); langBtn.focus(); }
  if (!drawer.hidden) { setDrawer(false); menuBtn.focus(); }
});
matchMedia("(min-width: 1101px)").addEventListener("change", (m) => { if (m.matches) setDrawer(false); });

// Photo strip: a second copy of the tiles makes the scroll seamless (the animation moves it by half).
const track = document.querySelector(".mv-track");
if (track) for (const tile of [...track.children]) track.append(tile.cloneNode(true));

// WeChat pop-up
const wx = document.getElementById("wx-dialog");
for (const b of document.querySelectorAll("[data-wechat]")) b.addEventListener("click", () => wx.showModal());
wx.addEventListener("click", (e) => { if (e.target === wx) wx.close(); });

for (const el of document.querySelectorAll("[data-year]")) el.textContent = new Date().getFullYear();

// PureLift: what every page shares. Language switch, language dropdown, phone menu, QR pop-ups, the year.
const root = document.documentElement;

export function currentLang() { return root.dataset.lang === "zh" ? "zh" : "en"; }

export function setLang(lang, { save = true } = {}) {
  lang = lang === "zh" ? "zh" : "en";
  root.dataset.lang = lang;
  root.lang = lang === "zh" ? "zh-Hans" : "en-AU";
  for (const b of document.querySelectorAll("[data-set-lang]")) b.setAttribute("aria-pressed", String(b.dataset.setLang === lang));
  if (save) {
    try { localStorage.setItem("purelift-lang", lang); } catch {}
    // A shared link keeps working: ?lang= follows the choice instead of overriding it on reload.
    const url = new URL(location.href);
    if (url.searchParams.has("lang")) { url.searchParams.set("lang", lang); history.replaceState(null, "", url); }
  }
  document.dispatchEvent(new CustomEvent("purelift:lang", { detail: lang }));
}

export function initCommon() {
  setLang(currentLang(), { save: false });

  const langBtn = document.querySelector(".lang-btn");
  const langMenu = document.getElementById("lang-menu");
  const setLangMenu = (open) => { if (!langBtn) return; langBtn.setAttribute("aria-expanded", String(open)); langMenu.hidden = !open; };
  langBtn?.addEventListener("click", (e) => { e.stopPropagation(); setLangMenu(langMenu.hidden); });

  const menuBtn = document.querySelector(".menu-btn");
  const drawer = document.getElementById("drawer");
  const setDrawer = (open) => {
    if (!menuBtn || !drawer) return;
    // Start the menu at the header's real bottom edge (the draft banner can push the header down).
    if (open) drawer.style.top = `${Math.max(0, document.querySelector(".header").getBoundingClientRect().bottom)}px`;
    menuBtn.setAttribute("aria-expanded", String(open));
    drawer.hidden = !open;
    root.classList.toggle("menu-open", open);
  };
  menuBtn?.addEventListener("click", () => setDrawer(drawer.hidden));
  drawer?.addEventListener("click", (e) => { if (e.target === drawer || e.target.closest("a")) setDrawer(false); });
  matchMedia("(min-width: 1101px)").addEventListener("change", (m) => { if (m.matches) setDrawer(false); });

  document.addEventListener("click", (e) => {
    const b = e.target.closest("[data-set-lang]");
    if (b) { setLang(b.dataset.setLang); setLangMenu(false); setDrawer(false); return; }
    if (!e.target.closest(".lang")) setLangMenu(false);
  });
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    if (langMenu && !langMenu.hidden) { setLangMenu(false); langBtn.focus(); }
    if (drawer && !drawer.hidden) { setDrawer(false); menuBtn.focus(); }
  });

  // QR pop-up: data-qr="wechat" or "instagram" opens the matching panel.
  const dialog = document.getElementById("qr-dialog");
  if (dialog) {
    document.addEventListener("click", (e) => {
      const b = e.target.closest("[data-qr]");
      if (!b) return;
      for (const p of dialog.querySelectorAll("[data-qr-panel]")) p.hidden = p.dataset.qrPanel !== b.dataset.qr;
      dialog.showModal();
    });
    dialog.addEventListener("click", (e) => { if (e.target === dialog) dialog.close(); });
  }

  for (const el of document.querySelectorAll("[data-year]")) el.textContent = new Date().getFullYear();
}

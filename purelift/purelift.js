// PureLift: mobile menu, header shadow on scroll, and the phone's floating booking button.
const header = document.querySelector(".site-header");
const nav = document.getElementById("site-nav");
const toggle = document.querySelector(".nav-toggle");

function setMenu(open) {
  toggle.setAttribute("aria-expanded", String(open));
  nav.classList.toggle("open", open);
}
toggle.addEventListener("click", () => setMenu(toggle.getAttribute("aria-expanded") !== "true"));
nav.addEventListener("click", (e) => { if (e.target.closest("a")) setMenu(false); });
document.addEventListener("keydown", (e) => { if (e.key === "Escape" && nav.classList.contains("open")) { setMenu(false); toggle.focus(); } });

const onScroll = () => header.classList.toggle("scrolled", window.scrollY > 8);
window.addEventListener("scroll", onScroll, { passive: true });
onScroll();

// The floating button shows once the hero's own buttons have scrolled up out of view (not while they
// are still below the fold on arrival), and hides over the booking band.
const mobileCta = document.querySelector(".mobile-cta");
const heroCtas = document.querySelector(".hero .cta-row");
const book = document.getElementById("book");
if (mobileCta && heroCtas && book && "IntersectionObserver" in window) {
  let heroPassed = false, bookVisible = false;
  const update = () => mobileCta.classList.toggle("show", heroPassed && !bookVisible);
  new IntersectionObserver(([e]) => { heroPassed = !e.isIntersecting && e.boundingClientRect.top < 0; update(); }).observe(heroCtas);
  new IntersectionObserver(([e]) => { bookVisible = e.isIntersecting; update(); }).observe(book);
}

for (const el of document.querySelectorAll("[data-year]")) el.textContent = new Date().getFullYear();

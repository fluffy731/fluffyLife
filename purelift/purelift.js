// PureLift home page: shared behaviour, the endless photo strip and the knowledge-base cards.
import { initCommon, currentLang } from "./common.js";
import { ARTICLES } from "./kb/index.js";
import { CATEGORIES, publicArticles, articleHref, escapeHtml } from "./kb-view.js";
import { initCards } from "./cards.js";

initCommon();

// The tab title follows the language.
const TITLES = { en: "PureLift Cosmetic · The heart of nursing, aesthetics with warmth", zh: "PureLift Cosmetic · 以护理的初心，做有温度的医美" };
const setTitle = () => { document.title = TITLES[currentLang()]; };
document.addEventListener("purelift:lang", setTitle);
setTitle();

// Photo strip: a second copy of the tiles makes the scroll seamless (the animation moves it by half).
const track = document.querySelector(".mv-track");
if (track) for (const tile of [...track.children]) track.append(tile.cloneNode(true));

// Knowledge-base cards
const showReview = new URLSearchParams(location.search).has("review");
const grid = document.getElementById("kb-grid");
const pair = (o) => `<span lang="en">${escapeHtml(o.en)}</span><span lang="zh-Hans">${escapeHtml(o.zh)}</span>`;
const list = publicArticles(ARTICLES, { showReview });
grid.innerHTML = list.map((a) => `
  <li class="kb-card${a.review ? " is-review" : ""}" data-cat="${a.category}">
    <a href="${articleHref(a.id, { showReview })}">
      <span class="kb-cat">${pair(CATEGORIES[a.category])}</span>
      ${a.review ? `<span class="kb-review">${pair({ en: "Held for TGA review", zh: "待 TGA 合规审核" })}</span>` : ""}
      <h3>${pair({ en: a.en.title, zh: a.zh.title })}</h3>
      <p>${pair({ en: a.en.summary, zh: a.zh.summary })}</p>
      <span class="kb-more">${pair({ en: "Read more", zh: "阅读全文" })}<svg aria-hidden="true"><use href="#i-chev"/></svg></span>
    </a>
  </li>`).join("");

const held = ARTICLES.length - list.length;
const heldNote = document.getElementById("kb-held");
if (held && document.body.classList.contains("draft")) {
  heldNote.innerHTML = pair({
    en: `Draft note: ${held} more articles (about prescription-only or restricted treatments) are held back until the clinic has checked them against the TGA advertising rules. Add ?review=1 to the address to see them.`,
    zh: `草稿提示：另有 ${held} 篇涉及处方药物或受限治疗的文章，待诊所按 TGA 广告规定审核后再发布。在网址后加上 ?review=1 可查看。`,
  });
  heldNote.hidden = false;
}

function filter(cat) {
  for (const b of document.querySelectorAll("[data-kb-cat]")) b.setAttribute("aria-pressed", String(b.dataset.kbCat === cat));
  for (const li of grid.children) li.hidden = cat !== "all" && li.dataset.cat !== cat;
}
document.addEventListener("click", (e) => {
  const b = e.target.closest("[data-kb-cat]");
  if (b) filter(b.dataset.kbCat);
  const link = e.target.closest("[data-kb-link]");
  if (link) filter(link.dataset.kbLink);
});

// Card effects on the calm rows: spotlight on every card in a row, a gentle tilt on the knowledge cards and figures.
for (const el of document.querySelectorAll(".kb-card a, .stat, .teach li, .pillars li")) el.classList.add("fx-spot");
for (const el of document.querySelectorAll(".kb-card a, .stat")) el.classList.add("fx-tilt");
initCards();

// PureLift article page: article.html?id=<id> loads kb/<id>.json and shows it in both languages.
import { initCommon, currentLang } from "./common.js";
import { ARTICLES } from "./kb/index.js";
import { CATEGORIES, publicArticles, renderBlocks, inline, escapeHtml, articleHref } from "./kb-view.js";

initCommon();

const params = new URLSearchParams(location.search);
const showReview = params.has("review");
const list = publicArticles(ARTICLES, { showReview });
const entry = list.find((a) => a.id === params.get("id")); // only ids from the index are ever fetched
const box = document.getElementById("article");
const pair = (en, zh) => `<span lang="en">${en}</span><span lang="zh-Hans">${zh}</span>`;

function setTitle() {
  const l = currentLang();
  document.title = entry ? `${entry[l].title} · PureLift Cosmetic` : l === "zh" ? "医美知识库 · PureLift Cosmetic" : "Knowledge base · PureLift Cosmetic";
}
document.addEventListener("purelift:lang", setTitle);

function notFound() {
  box.innerHTML = `<div class="art-missing">
    <p>${pair("This article is not available.", "暂时无法查看这篇文章。")}</p>
    <p><a class="btn-pill" href="./#knowledge">${pair("Back to the knowledge base", "返回医美知识库")}<svg aria-hidden="true"><use href="#i-chev"/></svg></a></p>
  </div>`;
}

if (!entry) {
  notFound();
} else {
  try {
    const res = await fetch(`kb/${entry.id}.json`);
    if (!res.ok) throw new Error(res.status);
    const a = await res.json();
    const i = list.indexOf(entry), prev = list[i - 1], next = list[i + 1];
    const side = (l) => `
      <div lang="${l === "zh" ? "zh-Hans" : "en"}">
        <span class="kb-cat">${escapeHtml(CATEGORIES[a.category][l])}</span>
        <h1>${inline(a[l].title)}</h1>
        <p class="art-summary">${inline(a[l].summary)}</p>
        <div class="art-body">${renderBlocks(a[l].blocks)}</div>
      </div>`;
    box.innerHTML = `
      ${a.review ? `<p class="art-review">${pair("Draft: held for TGA review. This article mentions prescription-only or restricted products and is not shown on the public site until the clinic has checked it against the advertising rules.", "草稿：待 TGA 合规审核。本文涉及处方药物或受限产品，在诊所按广告规定完成审核前不会在公开网站显示。")}</p>` : ""}
      ${side("en")}${side("zh")}
      <nav class="art-nav" aria-label="More articles">
        ${prev ? `<a class="btn-line" href="${articleHref(prev.id, { showReview })}">‹ ${pair(escapeHtml(prev.en.title.split(":")[0]), escapeHtml(prev.zh.title.split("：")[0]))}</a>` : "<span></span>"}
        ${next ? `<a class="btn-line" href="${articleHref(next.id, { showReview })}">${pair(escapeHtml(next.en.title.split(":")[0]), escapeHtml(next.zh.title.split("：")[0]))} ›</a>` : ""}
      </nav>`;
  } catch {
    notFound();
  }
}
setTitle();

// PureLift knowledge base: pure helpers shared by the home page, the article page and the tests.

export const CATEGORIES = {
  skincare: { en: "Skincare ingredients", zh: "护肤成分" },
  treatment: { en: "Treatments", zh: "治疗与操作" },
  concern: { en: "Skin concerns", zh: "皮肤问题" },
};

// Articles about prescription-only or restricted products stay off the public site until the clinic
// has checked them against the TGA advertising rules. ?review=1 shows them for that review.
export function publicArticles(articles, { showReview = false } = {}) {
  return articles.filter((a) => showReview || !a.review);
}

export function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
}

// **bold** is the only inline markup the articles use.
export function inline(text) {
  return escapeHtml(text).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
}

export function renderBlocks(blocks) {
  return blocks.map((b) => {
    switch (b.t) {
      case "p": return `<p>${inline(b.text)}</p>`;
      case "h": return `<h2>${inline(b.text)}</h2>`;
      case "h3": return `<h3>${inline(b.text)}</h3>`;
      case "ul": case "ol": return `<${b.t}>${b.items.map((i) => `<li>${inline(i)}</li>`).join("")}</${b.t}>`;
      case "table": return `<div class="table-wrap"><table><thead><tr>${b.head.map((h) => `<th scope="col">${inline(h)}</th>`).join("")}</tr></thead><tbody>${b.rows.map((r) => `<tr>${r.map((c) => `<td>${inline(c)}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
      case "warn": return `<p class="warn" role="note">${inline(b.text)}</p>`;
      case "note": return `<p class="note">${inline(b.text)}</p>`;
      default: throw new Error(`Unknown block type: ${b.t}`);
    }
  }).join("\n");
}

export const articleHref = (id, { showReview = false } = {}) => `article.html?id=${encodeURIComponent(id)}${showReview ? "&review=1" : ""}`;

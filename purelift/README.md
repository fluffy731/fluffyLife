# PureLift Cosmetic website

A small static site in English and Simplified Chinese: the home page (`index.html`), a knowledge-base article page (`article.html`), and the code behind them. No build step apart from one optional script for the knowledge-base index. Preview locally with `python3 -m http.server` from the repo root, then open `http://localhost:8000/purelift/`.

| File | What it is |
|---|---|
| `index.html`, `purelift.css`, `purelift.js` | The home page. `common.js` holds what every page shares: language switch, phone menu, QR pop-ups. |
| `article.html`, `article.js`, `kb-view.js` | One article at a time: `article.html?id=retinol`. `kb-view.js` turns an article's blocks into HTML (text is escaped; `**bold**` is the only markup). |
| `kb/<id>.json` | The knowledge-base articles, English and Chinese side by side, block by block. |
| `kb/index.js` | The card list for the home page. Generated: `node scripts/purelift-kb.mjs`. |
| `img/`, `fonts/` | Photos, logo, QR codes; Noto Sans and Roboto (SIL Open Font License). Chinese uses the visitor's system font. |

The layout, buttons and sections follow the reference clinic site the owner chose. The colours come from the clinic's hero photo (the wall colour is the page ground). The colour block at the top of `purelift.css` says how to switch to white and blue.

## Frosted glass

The look is layered. `body::before` (in the "Frosted glass" block at the end of `purelift.css`) fixes soft light colour behind the page, kept at least as light as the wall colour so text keeps its contrast. A few sections (hero, first visit, updates, clinic, areas of focus) sit on a pre-blurred photo (`img/bg-*.jpg`, a few KB each, made from the clinic's photos). The panels on top are translucent white with a backdrop blur, a bright edge and a soft shadow. Cards inside a frosted band skip their own blur to keep scrolling smooth on phones. The tokens (`--glass`, `--glass-blur` and friends) are at the top of that block. Where `backdrop-filter` isn't supported, or the visitor asks for reduced transparency or more contrast, the panels become nearly opaque and everything else stays the same.

## Two languages

Every piece of text is written twice, side by side:

```html
<span lang="en">Our clinic</span><span lang="zh-Hans">诊所信息</span>
```

Only the chosen language shows. The page picks it from `?lang=zh` or `?lang=en` in the address, then the visitor's last choice, then their browser language. `node --test test/purelift.test.js` fails if an English text has no Chinese partner.

## Knowledge base

The 17 articles come from the clinic's "医美知识库" document. Each is a JSON file with `zh` and `en` halves that must have the same blocks (paragraphs, headings, lists, tables). After editing one, run `node scripts/purelift-kb.mjs`: it checks that the two halves line up and rewrites `kb/index.js`.

Five articles mention prescription-only or restricted products (botulinum toxin, platelet-rich plasma ×2, injectable hyaluronic acid, polynucleotides) and are marked `"review": true`. They are **not shown on the public site**; add `?review=1` to a page address to see them. Under the TGA's advertising rules, consumer-facing content about prescription-only medicines is restricted, and the clinic should have them checked (by its own advisers or the TGA's guidance) before clearing the flag.

## Placeholders

Unknown facts are wrapped in `<span class="ph">[…]</span>` and shown in yellow while `<body class="draft">` is set: street address, opening hours and days closed, consultation length and fee, payment methods, cancellation policy, languages spoken on each day, the ABN and a few lines on the clinic page.

## Launch checklist

1. Replace every `class="ph"` placeholder (search the file for `ph"`), in English and Chinese.
2. Point every `data-booking` link at the booking system and `data-map` at the map. The phone number (0452 600 804), WeChat QR and the Instagram handle (@purelift_cosmetic, read from the clinic's video) are already in; scan-test the two QR codes and open the Instagram link before launch.
3. Check the photos: say who each person is and that they agreed to appear. Several photos show the neighbouring tenants' signs and phone number (03 8820 6426); the entrance close-up was dropped for that reason, but the street view of the building is still on the page. This matters for the two visitors in the council photo and the colleague in the training photo, for any client, and for photos that show medicine packaging.
4. Add a privacy policy page (health service providers have obligations under the Privacy Act 1988) and link it from the footer.
5. Remove `class="draft"` from `<body>` in both HTML files: the yellow banner and highlights disappear.
6. Delete the `<meta name="robots" content="noindex, nofollow">` line in both HTML files so search engines can list the site.
7. Check the copy and images against the advertising rules that apply to the clinic. In Australia: the TGA's rules on prescription-only medicines, and AHPRA's guidelines for advertising cosmetic procedures (testimonials, before-and-after photos, discounts and time-limited offers are restricted). This matters most for the care pricing, the council and training updates, the photos, and the five held articles.
8. Run `npm test`.

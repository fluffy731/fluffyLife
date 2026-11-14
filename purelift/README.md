# PureLift website

One static page in English and Simplified Chinese: `index.html`, `purelift.css`, `purelift.js`, with images in `img/` and fonts in `fonts/` (Noto Sans and Roboto, SIL Open Font License; Chinese uses the visitor's system font, such as PingFang SC or Microsoft YaHei). No build step. Preview locally with `python3 -m http.server` from the repo root, then open `http://localhost:8000/purelift/`.

The layout, buttons and sections follow the reference clinic site the owner chose (header with a Language button, scrolling strip of slanted photos, campaign banner, news box, 7 promises, numbers, a messaging-app block, signature treatments, treatment menu band, gallery, clinic card, black footer, fixed booking buttons). The colours come from the hero photo; the colour block at the top of `purelift.css` says how to switch to white and blue.

## Two languages

Every piece of text is written twice, side by side:

```html
<span lang="en">Our clinic</span><span lang="zh-Hans">诊所信息</span>
```

Only the chosen language shows. The page picks it from `?lang=zh` or `?lang=en` in the address, then the visitor's last choice, then their browser language. The Language button (header), the menu on phones and the footer all switch it. `node --test test/purelift.test.js` fails if an English text has no Chinese partner.

## Filling in the content

Every unknown fact is wrapped in `<span class="ph">[…]</span>` and shows highlighted in yellow while `<body class="draft">` is set. Replace each one (in both languages) and drop the span. The photos are crops of the one supplied picture, as placeholders.

## Launch checklist

1. Replace every `class="ph"` placeholder (search the file for `ph"`), in English and Chinese.
2. Point every `data-booking` link at the booking system, every `data-phone` link at `tel:+61…`, `data-map` at the map, and each `data-social` link at the account.
3. Put the WeChat ID and QR code in the `wx-dialog` at the bottom of `index.html`.
4. Replace the placeholder photos with the clinic's own.
5. Remove `class="draft"` from `<body>`: the yellow banner and highlights disappear.
6. Delete the `<meta name="robots" content="noindex, nofollow">` line so search engines can list the site.
7. Check the copy and images against the advertising rules that apply to the clinic. In Australia: the TGA's ban on advertising prescription-only medicines to the public, and AHPRA's guidelines for advertising cosmetic procedures (testimonials, before-and-after photos, discounts and time-limited offers are restricted). This matters most for the campaign banner, the numbers section and the gallery.
8. Run `node --test test/purelift.test.js`.

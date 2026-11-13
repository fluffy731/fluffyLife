# PureLift website

One static page: `index.html`, `purelift.css`, `purelift.js`, with images in `img/` and fonts in `fonts/` (Cormorant Garamond and Jost, SIL Open Font License). No build step. Preview locally with `python3 -m http.server` from the repo root, then open `http://localhost:8000/purelift/`.

## Filling in the content

Every unknown fact is wrapped in `<span class="ph">[…]</span>` and shows highlighted in yellow while `<body class="draft">` is set. Replace each one with the real text and drop the span. The treatment cards are a placeholder menu of six; add or remove `<article class="card">` blocks to match the real list.

## Launch checklist

1. Replace every `class="ph"` placeholder (search the file for `ph"`).
2. Point the **Book online** button (`data-booking`) at the clinic's booking system, and the phone button at `tel:`.
3. Add the practitioner's portrait in place of the `.portrait` panel.
4. Remove `class="draft"` from `<body>`: the yellow banner and highlights disappear.
5. Delete the `<meta name="robots" content="noindex, nofollow">` line so search engines can list the site.
6. Check the copy and images against the advertising rules that apply to the clinic (in Australia: the TGA's ban on advertising prescription-only medicines to the public, and AHPRA's guidelines for advertising cosmetic procedures).
7. Run `node --test test/purelift.test.js`.

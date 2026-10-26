# James Taylor, Chef

Personal site for James Taylor, executive chef and partner at The Joyce (448 Española Way, Miami Beach),
formerly of Alinea, Roister and Bavette's in Chicago. It's a scrapbook: his story told in torn paper,
photo prints, cut-outs, tape, kitchen tickets, marker notes and press clippings, with one thing that
isn't paper: the broiler. He cooks Chicago style, from above, at about 900°, and the fire on the page
is live WebGL.

Vite + React + motion + Lenis.

## Run

```
npm install
npm run dev
npm run build      # typecheck + production build into dist/
```

## What's on the page

| Section | File | What it does |
| --- | --- | --- |
| Preloader | `src/ui/Preloader.tsx` | The broiler preheats: a dial climbs from 72° to 900°F, then the cover lifts. |
| Hero | `src/sections/Hero.tsx`, `src/ui/BroilerFire.tsx` | The paper is torn open on live fire (the pointer fans it). His name goes on in cut-out letters, one slapped down at a time; a raw ribeye, Chicago and the broiler are lying around, and with a mouse you can pick them up and move them. |
| Creed | `src/sections/Creed.tsx` | His line about his food, inking in word by word as it scrolls past, with a highlighter on "memorable meals". |
| Story | `src/sections/Story.tsx` | Five scrapbook pages: TGI Fridays at five, Chicago (Le Cordon Bleu, Bavette's), Roister and Alinea, Miami, Española Way. Each has its photos, his words and the kitchen tickets, stamped FIRED as they come into view. |
| Notebook | `src/sections/Notebook.tsx` | The five signatures as notebook pages built from their ingredients, with his notes and the press line. The burger page has the "burgerability" dictionary entry and twenty bun trials, nineteen crossed out. |
| 900° | `src/sections/Broiler.tsx` | Hold the button: the broiler comes on over a raw ribeye and it sears as the dial climbs to 900°F. Let go and it rests. |
| Press, The Joyce, Book | `src/sections/*.tsx` | Critics' lines as taped-up clippings, the restaurant behind green velvet that parts on scroll, private events. |

The collage pieces (`Spread`, `Piece`, `Print`, `Cutout`, `Note`, `Doodle`, `Label`, `Scrap`,
`Clipping`, `Torn`) are in `src/ui/collage.tsx`. A `Piece` is placed in % of its page, with its own
placement on phones, slaps down when it comes into view and drifts at its own depth as you scroll.

All copy is in `src/content.ts`. Every quote is verbatim from the source named beside it, and the
sources are listed in the footer.

## The photos

The photos aren't of his plates, they're the places he cooked and what goes into the food, all from
photographers who license their work openly (CC0, public domain, CC BY, CC BY-SA). Credits are in
the footer and in `photos/CREDITS.md`. When James has his own photography, swap it in through
`photos/sources.json`.

```
python3 scripts/photos.py          # fetch, cut out / treat, write public/photos/ and src/photos.ts
python3 scripts/photos.py bun      # just one
node scripts/og.cjs                # share card from the live hero (dev server on :5190)
```

`photos/sources.json` lists each photo: a Wikimedia Commons file or an Openverse id, a treatment
(`print`, `copy` for a black-and-white photocopy, or `cutout`, which uses `rembg` and adds a sticker
edge), an optional crop and the alt text. Downloads are cached in `photos/cache/` (gitignored).
Python needs Pillow, numpy, scipy and `rembg`.

The green velvet tile (`src/assets/velvet.jpg`) is derived from Poly Haven's `velour_velvet` (CC0).

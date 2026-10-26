# James Taylor, Chef

Personal site for James Taylor, executive chef and partner at The Joyce (448 Española Way, Miami Beach),
formerly of Alinea, Roister and Bavette's in Chicago. It's a scrapbook: his story told in torn paper,
photo prints, cut-outs, tape, kitchen tickets, marker notes, press clippings and moving prints of
1950s film, with one thing that isn't paper: the broiler. He cooks Chicago style, from above, at about
900°. The fire on the page is live WebGL, and the steak under it is real: 3D scans of real steaks,
rendered in Blender and scrubbed by scroll.

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
| Creed | `src/sections/Creed.tsx` | His line about his food, inking in word by word as it scrolls past, with a highlighter on "memorable meals", beside a moving print of a family dinner from a 1950 film. |
| Story | `src/sections/Story.tsx` | Five scrapbook pages: TGI Fridays at five, Chicago (Le Cordon Bleu, Bavette's), Roister and Alinea, Miami, Española Way. Each has its photos, his words and the kitchen tickets, stamped FIRED as they come into view. |
| Notebook | `src/sections/Notebook.tsx` | The five signatures as notebook pages built from their ingredients, with his notes and the press line. The burger page has the "burgerability" dictionary entry and twenty bun trials, nineteen crossed out. |
| 900° | `src/sections/Broiler.tsx`, `src/ui/ScrubFilm.tsx` | A film scrubbed by scroll: a raw bone-in rib steak under the broiler, a flash of heat, the same cut seared, another flash, then sliced pink, with live flame along the top of the shot and his words over it. Then your turn: hold the button and a raw ribeye sears as the dial climbs to 900°F. |
| Press, The Joyce, Book | `src/sections/*.tsx` | Critics' lines as taped-up clippings, the restaurant behind green velvet that parts on scroll, private events. |

The collage pieces (`Spread`, `Piece`, `Print`, `Cutout`, `Note`, `Doodle`, `Label`, `Scrap`,
`Clipping`, `Torn`) are in `src/ui/collage.tsx`. A `Piece` is placed in % of its page, with its own
placement on phones, slaps down when it comes into view and drifts at its own depth as you scroll.

All copy is in `src/content.ts`. Every quote is verbatim from the source named beside it, and the
sources are listed in the footer.

## The steak film

Three photogrammetry scans of real steaks (raw on a grate, seared on a board, sliced on a plate),
published on Sketchfab under CC BY by their authors and fetched from the Objaverse mirror. They're
listed with credits in `models/sources.json`.

```
python3 models/fetch.py                               # scans + HDRI into models/cache/, credits into src/scans.ts
blender -b -P models/film.py -- --only 50             # one look-dev frame
blender -b -P models/film.py -- --w 1280 --h 800 --samples 48   # all 96 frames (about a minute each on 4 cores)
python3 scripts/pack.py models/out/film film-steak --width 1280 --quality 80
```

The scans come in unlit (their photographed colour), which is what makes them look real; the film keeps
that and adds a lit layer so the broiler's light and flashes land on the meat.

## The archive film

Short silent loops from public-domain films in the Prelinger Archives on the Internet Archive ("A Date
With Your Family", 1950; "Where the Sun Reigns", 1955, a tour of Miami-Dade; "Carving Magic", Swift &
Company). `photos/clips.json` lists them; `python3 scripts/clips.py` cuts them with ffmpeg into
`public/clips/` and writes `src/clips.ts`.

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

# *Scaling Up-Side-Down* cover

The hardcover for Michael Wentz's book: three front-cover directions, a 3D mockup of each, a thumbnail check, and
the full wrap (back, spine, front) for the recommended direction. Made 19 Nov 2026 for James. The book goes to
layout on **1 Dec** and publishes on **1 Jan**.

Everything is real type, vector work and real 3D (Blender Cycles). There are no AI-generated images. Every file can
be edited and rebuilt from source (`build.sh`).

## The five directions

James asked for five (19 Nov, relayed mid-task), so he can pick the top two for Michael. Numbered as in
`out/contact-sheet.jpg`. Each has a flat front (`out/flat/<name>.png` / `.pdf` with bleed, `<name>-trim.png` at
1800 x 2700), a Blender mockup (`out/mockups/mockup-<letter>.png`) and thumbnails (`out/thumbs/`).

| # | Name (files) | Idea |
| - | - | - |
| 1 | **The Stack** (`a-stack`) | Michael's mockup, made exact. The same layout, so the identity the site uses is kept. The blocks are a real render with real wood, satin paint and stamped words, not an AI picture. SCALING is exactly the stack's height, the stamps share one size, and everything hangs on one centred grid. |
| 2 | **Upside-Down** (`b-upside-down`) | Type only, a poster. The title does what it says: down the three paint bands, UP stands, SIDE lies on its side and DOWN hangs upside down, a quarter turn further each time, stepping across the page. |
| 3 | **The Cycle** (`c-cycle`) | The model as an analyst's chart (Michael was a Morningstar equity analyst). Up, sideways, a short step down, repeat: the line climbs past the dashed "all at once" curve, which spikes and crashes. UP-SIDE-DOWN in the three paints is the chart's legend. |
| 4 | **The Twelve** (`d-twelve`) | The book as an operating system. The twelve systems of Chapter 10, four per move, as a numbered grid of tiles in the three paints. The names and colour bands are the site's own (`render/make_systems.py`). Twelve is also where the book says most teams should stop. |
| 5 | **The Trap** (`e-trap`) | The problem as one object: raw-wood blocks (the site's hires and tools) stacked as an upside-down pyramid, everything resting on a single block. A dark, quiet Cycles render (`src/blender/inverted.py`) with the title in the space above it. |

The thumbnail check at 150 and 100 px (`out/thumbs/row-150.png`, `row-100.png`):
- 1 and 5 read best as pictures.
- 2 and 4 read as strong colour.
- 3's title reads, but its chart gets thin.
- 2's sideways SIDE gets hard to read at 100 px.

## The full wrap (direction 1, built before the switch to five)

This was built for direction 1 before James asked for five and for no wrap until he picks; it is kept as the
template for whichever two he picks (the back, the spine and the parameters carry over). `out/wrap/wrap.png` / `.pdf` (the art) and `out/wrap/wrap-guides.png` (with the trim, the spine folds and the
measurements). Source: `src/covers/wrap.html`.

- **Back**: the back-cover copy, word for word from `scaling-upside-down/src/copy.ts` (the lines marked "the back cover"):
  "That isn't scaling. That's scaling upside down.", the "In Scaling Up-Side-Down, entrepreneur Michael Wentz
  reveals..." deck, the cycle chart with its legend (UP / SIDE / DOWN / THE SCALING TRAP), and "Part diagnosis,
  part operating system...". At the foot: SCALINGUPSIDEDOWN.COM and a white 2 x 1.2 in box for the ISBN and price
  barcode.
- **Spine**: the three paints as chips at the head (the blocks, end on), SCALING UP-SIDE-DOWN reading top to bottom
  (the US convention), and WENTZ. Its type scales with the spine width.
- **Front**: `a-stack.html` itself, laid in.

**The spine width is a placeholder (0.9 in).** It depends on the page count and the paper, which we don't have
yet. The printer's spine calculator gives the real number. To change it, run `SPINE_IN=1.05 ./build.sh wrap`, or
open `src/covers/wrap.html?spine=1.05&guides=1` in Chrome. Everything moves with it, and the spine type resizes.

**Hardcover case wraps need more than 0.125 in.** A case-laminate cover is printed larger than the board, and it
folds over the board edges (about 0.625 to 0.75 in a side, depending on the printer) with a hinge groove beside the
spine. The wrap takes both as parameters, `?wrap=0.75&hinge=0.4`, so it can be fitted to the printer's own template
in a minute once we know who prints it. Leave the barcode box where the printer's template puts it.

## Specs

- Front: 6 x 9 in trim, 300 dpi = 1800 x 2700 px, plus 0.125 in bleed all round = **1875 x 2775 px** (6.25 x 9.25 in).
  Words are kept 0.375 in inside the trim.
- Colour: RGB (sRGB). The printer converts to CMYK; ask for a hard proof. The three paints are the site's
  (`render/scene_setup.py`): green `#1f4a2b`, ochre `#e09a24`, red `#97201a`, with paper `#f1ebdf` and ink `#1c1a17`.
  The ochre is the one to watch on press.
- PDFs are vector type with the fonts embedded (Chromium print). The block render in A is a 1500 x 2140 px Cycles
  render, which is more than 300 dpi at its printed size.
- Fonts (all SIL Open Font License, free for print): Anton (SCALING), Playfair Display Black (the stamps), Libre
  Caslon Text (subtitle and back copy), Inter Tight (author). See `fonts/README.md`.

## Files

```
research/reference-board.md   what real covers taught this one (read first)
src/covers/common.css, fit.js shared kit: paints, fonts, print size, guides (?guides=1)
src/covers/a-stack.html       direction A front
src/covers/b-upside-down.html direction B front
src/covers/c-cycle.html       direction C front
src/covers/d-twelve.html      direction D front
src/covers/e-trap.html        direction E front
src/covers/spine.html         the spine, any direction and width (?dir=a&in=0.9)
src/covers/wrap.html          the full wrap (?spine=&wrap=&hinge=&guides=1)
src/blender/make_faces.py     paints the blocks' faces and stamps (PIL)
src/blender/blocks.py         renders the stack for A (Cycles, transparent, with its shadow)
src/blender/mockup.py         the 3D hardcover mockup of any front + spine
src/blender/inverted.py       renders the upside-down tower for E (Cycles, full frame)
src/measure_render.py         finds the stack in the render so A's type can align to it
src/render.cjs                HTML -> print PNG + vector PDF (Playwright Chromium)
build.sh                      rebuilds everything
out/                          the results (flat, thumbs, mockups, spine, wrap, render)
```

Each HTML file keeps its layout numbers in one `const L = {...}` block at the top of its script, in print pixels.
Change those, not the CSS. Open any file in Chrome with `--allow-file-access-from-files` to preview it.

## Rebuilding

```
BLENDER=/path/to/blender-4.5/blender ./build.sh          # everything (about 40 min on 4 cores, mostly Blender)
./build.sh fronts | thumbs | mockups | sheet | wrap      # one part (MOCKS="d e" for some mockups)
```
Needs Node with Playwright (Chromium), ImageMagick, Python 3 with Pillow, and Blender 4.5 LTS. `build.sh` fetches the Poly Haven CC0
wood texture and studio HDRI into `assets/` (not committed). The stack render is skipped if
`out/render/blocks_front.png` exists: delete it after changing the blocks or their stamps.

## Needed from Michael

1. **Page count and paper** (cream or white, and its weight) for the real spine width.
2. **Trim size and binding**: is it 6 x 9 in, case-laminate hardcover (printed boards) or cloth with a dust jacket?
   A jacket adds flaps (about 3 to 3.5 in each) with room for an author bio and photo.
3. **Printer or publisher** (IngramSpark, KDP hardcover, Lulu, an offset printer...) for their wrap template, and
   any publisher or imprint logo for the spine foot and back.
4. **ISBN** (hardcover has its own) and the **price** for the barcode, or the barcode file itself.
5. **The final subtitle.** The cover uses "Revenue Up. Margins Down. How to Avoid the Scaling Trap." from his mockup.
6. **The whole back-cover text.** The site quotes four lines of it; the rest of his back cover (and any endorsements
   or author bio) should come from him, word for word, and goes in the space above the barcode.
7. Whether **scalingupsidedown.com** should be printed on the back (the domain is not pointed at the site yet).

# *Scaling Up-Side-Down* cover

The hardcover for Michael Wentz's book: three front-cover directions, a 3D mockup of each, a thumbnail check, and
the full wrap (back, spine, front) for the recommended direction. Made 19 Nov 2026 for James. The book goes to
layout on **1 Dec** and publishes on **1 Jan**.

Everything is real type, vector work and real 3D (Blender Cycles). There are no AI-generated images. Every file can
be edited and rebuilt from source (`build.sh`).

## The first five directions (1-5)

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

## Round 2: five that break the template (6-10)

James: "Think outside the box more on these cover ideas." 1-5 all share one layout (big title on top, a picture,
subtitle and author at the foot). 6-10 are each built on one idea, and the layout is part of it. They share one kit,
from James's taste rules:
- chalk ground;
- Inter Tight at 500, tracked -0.03em;
- JetBrains Mono labels;
- the book's paints only where they mean something;
- texture only as a local layer;
- imagery real or photo-real.

The research behind them is in `research/reference-board.md`, under "Round 2".

| # | Name (files) | The one idea |
| - | - | - |
| 6 | **Tête-bêche** (`f-tete-beche`) | The book does what its title says. Like a tête-bêche (two books bound head to tail), the cover reads both ways up. The right way up is the title in ink with "Revenue Up." Turned over, it is the same title in red, the company scaling upside down, where "Margins Down." is the right way up. The full subtitle and the author sit on the hatched fold. |
| 7 | **Tree rings** (`g-rings`) | Up, Side and Down is how real things grow. A photo-real log slice (Cycles, `src/blender/make_rings.py` + `rings.py`) whose rings are laid down in cycles: wide growth years, even steady years, tight lean years, then growth again. Mono annotations point at one real cycle, read from the centre out. It looks nothing like a business book, and it carries the whole model. |
| 8 | **Boot screen** (`h-boot`) | Software as a book. The cover is a spec sheet: the book's own block stack (the Blender render) drawn in characters (`src/make_ascii.py`), the three moves annotated in mono with the manuscript's words (L3315-3317), and the title set at the foot like a product name. The picture comes first and the title last. |
| 9 | **The Ledger** (`i-ledger`) | The subtitle is the data. It uses Michael's own exhibit from Chapter 17, "the margin inversion" (the site's former panel, `src/story.ts` at c492fab^): team 12 to 25, revenue $3M to $4.2M, margin 20% to 5%, owner take $900K to $150K. Every number is drawn at a size proportional to its value, on one baseline per row, so the type is the chart. Red is used only for what falls, with a hatched wedge tracing the margin's drop. |
| 10 | **Scaling** (`j-scaling`) | The word scales. Each letter of SCALING is 1.37 times the last and stands a little higher, compounding like a growth curve, until the G is too big for the cover and runs off it. That G is hatched red: the breaking point. Small mono readouts give each letter's size. |

**Thumbnails** (`out/thumbs/row-150-numbered.png`): all ten read at 150 px. In a row of covers, 6 and 7 catch the eye
most of 6-10, and 6-10 are quieter than 1-5 by design (space and type, not big colour). 9's and 10's subtitles are too
small to read at 150 px; their titles read.

### James's six checks (1-5 each; a 3 means "fine, not his")

Scored against the references, after the first fixes. Texture was the lowest score on 6, 9 and 10 (about 2: no
texture at all), so each got a local, functional one: a hatched fold on 6, a hatched falling wedge on 9 and a
hatched G on 10.

| # | Type | Colour discipline | Grain / texture | Gradient | Density / craft | Never-do list | Lowest, and what would lift it |
| - | - | - | - | - | - | - | - |
| 6 | 5 | 4 | 3 | n/a | 4 | 5 | Texture: it is a type cover by design. A blind deboss along the fold would be the real-world version (optional finish). |
| 7 | 4 | 5 | 5 | 4 | 4 | 5 | Type: the title is set well but quiet against the wood. Could go one size up. |
| 8 | 5 | 4 | 5 | n/a | 5 | 4 | Never-do: ASCII sits near "tech cliché". It earns its place because it draws the book's real object, not decoration. |
| 9 | 5 | 5 | 4 | n/a | 5 | 5 | Texture: the wedge is the only one. That is right for an exhibit. |
| 10 | 5 | 5 | 4 | n/a | 3 | 4 | Density: the top right is sparse. The climb needs the air, but it is the weakest score here. |

### Optional finishes (none needed: all ten print in ordinary 4-colour)
- **7, Tree rings:** a spot gloss or a light emboss on the rings, so they can be felt. This needs offset or specialist
  printing: print-on-demand (IngramSpark, KDP) can't do spot finishes. There is a setup charge plus a per-copy cost;
  ask the printer for a quote.
- **6, Tête-bêche:** a blind deboss along the fold, on the same terms.

## Round 3: drawn lettering, and a reason to pick it up (11-15)

James: "I want you to change the font. I don't want it to look like you just typed 'Scaling Up-Side-Down'. The font
should be like drawn… more of an image… a bit of symbolism… the cover should be inviting." Two things missed on all
ten: the title was typed, and none of them pulled you in.

**The lettering.** Every title in 11-15 is drawn from one set of letterforms made for this book (`src/lettering.py`).
Each capital is a skeleton of strokes and arcs, with no font behind it, and each cover builds the letters its own way.
The subtitle and author stay quiet and typeset. The research is in `research/reference-board.md`, "Round 3".

| # | Name (files) | How the letters are made | The hook (one sentence) |
| - | - | - | - |
| 11 | **Built** (`k-built`, `src/blender/built.py`) | SCALING laid up from about 280 wooden blocks (the letterforms rasterised to a grid, one block per cell) in low evening sun. UP-SIDE-DOWN is drawn on the wall in the three paints. | The G is going over: a moment before the fall. |
| 12 | **Grown** (`l-grown`, `src/make_tree.py`) | A tree whose crown is SCALING: every letter a living branch, tapered, in leaf. UP-SIDE-DOWN grows above as twigs. | You look twice: it's a tree, and someone has pruned it (a sawn stub on the G, the cut shoot on the ground, red leaves falling). |
| 13 | **Light** (`m-light`, `src/blender/light.py`) | Cut through a wall, stencil-fashion (bridges hold the counters), lit from behind by a low sun. | The sunlight lays the same words across the floor upside down: the trap, made by the room. |
| 14 | **Window** (`n-window`, `src/blender/paper.py`) | Heavy stencil letters cut through cream paper, with a round window above them. | You see a sunset world only through the letters, hills that climb, level and dip, so you lean in. |
| 15 | **Stitched** (`o-stitched`, `src/make_stitch.py`) | About 1,000 satin stitches along the skeletons, on linen, in a beech hoop. SCALING is in dark thread, UP / SIDE / DOWN in the three paints. | The G is coming undone, and its thread runs out of the hoop to a hanging needle. Pull it and it unravels. |

**The symbolism, felt rather than explained:**
- 11: built too fast, it topples.
- 12: growth, then pruning.
- 13: the upside-down world.
- 14: the cycle as a horizon.
- 15: the overstretched thread.

**Warmth:** low sun (11, 13, 14), wood, paper and linen (all five), and a warm palette with no chart in sight.

**The check** (each next to its two closest references; is the title drawn, not typed? would I pick it up?):
- **11**: drawn, yes (built from blocks). Pick up: maybe. The first framing failed the 150 px test (the oblique view
  made SCALING unreadable), so it was re-shot at a gentler angle. It is still the quietest of the five.
- **12**: drawn, yes. Pick up: yes. It's warm, and you look at it twice. UP-SIDE-DOWN was redrawn as twigs: as plain
  strokes it looked typed.
- **13**: drawn, yes (a cut and a light). Pick up: yes. The strongest second look of the set.
- **14**: drawn, yes. Pick up: yes. First version: the sky behind the letters was too pale to read and the sheet was
  empty. The sky was deepened and a round sun window added.
- **15**: drawn, yes, unmistakably handmade. Pick up: yes. First version: the unravelling was too subtle, so the G's bowl
  now visibly comes apart where the thread leaves it.

**Spines for 11-15:** the title on the spine is drawn too (`out/render/spine-word.svg`), not set in a font.

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
src/covers/f-tete-beche.html  6  ·  g-rings.html 7  ·  h-boot.html 8  ·  i-ledger.html 9  ·  j-scaling.html 10
src/blender/make_rings.py     paints the log slice's end grain for 7 (rings in Up/Side/Down cycles)
src/blender/rings.py          photographs it from above (Cycles, orthographic flat lay)
src/make_ascii.py             draws the block stack in characters for 8
src/lettering.py              the book's own letterforms (11-15): skeletons of strokes and arcs, no font
src/make_word.py              draws a word in them (UP-SIDE-DOWN, the spine title)
src/blender/built.py · light.py · paper.py   11, 13, 14 (Cycles)
src/make_tree.py · make_stitch.py            12, 15 (SVG)
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

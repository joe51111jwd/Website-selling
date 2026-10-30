# Corrected Edition · Scaling Up-Side-Down

A homepage option for Michael Wentz's *Scaling Up-Side-Down*. Each screen is a lit proof sheet on
a dark desk: the founder's own thought is set in print and struck through in Michael's red pencil,
and his correction is set large in its place. At the end the inherited playbook is set in plain
ink; press and hold **Strike it** and the pencil rules through each belief, then corner to corner,
and the sheet lifts off the desk and slides away. Underneath: the Bootloader file (V16, 35,445
words, for any AI assistant) next to the book. Both paths are also on the desk under the sheet
from the start, and if nobody holds, the pencil does it by itself after a moment.

Brief: `../brief/BRIEF-corrected-edition.md`.

## Run

```bash
npm install
npm run dev            # local dev server
npm run build          # tsc --noEmit && vite build  → dist/
npm run preview        # serve dist/
npm run build:single   # one self-contained file → dist-single/index.html (JS, CSS, fonts inlined)
```

`vite.config.ts` uses `base: './'`, so `dist/` works from any path. The page makes no
third-party requests: Newsreader (variable, opsz + wght, roman and italic) and Courier Prime
come from `@fontsource` packages, latin subset only, and the display face is preloaded.

## Copy

Every sentence is Michael's, word for word, from `src/copy.ts` (each line cites its source line;
labels are marked `// label`). Check:

```bash
node ../tools/copycheck.mjs src/copy.ts $(find src -name '*.tsx')   # must print "0 not found"
```

## Debug URL params (work in production builds)

| Param | Effect |
|---|---|
| `?sheet=2` / `3` / `4` / `5` / `6` | Scrolls to that sheet with every sheet's marks done (sheet 04 after the transpose). |
| `?finale=open` | The playbook is already struck: the file and the book are revealed. |
| `?nonav=1` | After the "Yours" stamp, stay on the page instead of opening the live opt-in. |
| `?motion=1` | Full motion even under a software renderer (headless screenshots), for judging the intro and Strike it. |

## The sheets

| # | Section | What happens |
|---|---|---|
| 01 | `#top` hero (`<header>`) | “I should be further by now” prints in word by word, is ruled through in red (dele loop in the margin, caret pointing at a word boundary), and **Each cycle starts higher than the last** rises out of the paper. A two-lap UP · SIDE · DOWN rule draws under it, each lap starting higher. Support line; the imprint (*Scaling Up-Side-Down* · a book by Michael Wentz / for bootstrapped founders · teams of 1–12); the two paths; and what the Bootloader is (SUSD_Bootloader_V16.md · 35,445 words · for any AI assistant). |
| 02 | `#growth` | Growth is a straight line upward → **Growth comes from completing cycles**, over a stair carrying Michael's four sentences, each on its own leg, left to right. Phone: four led lines; tablet: the stair, scaled. |
| 03 | `#people` (COULD, cut first) | More people = more capacity → **More people = more coordination cost (unless absorbed)**, glossed in the margin (“Systems absorb the growth”, BL 862) with a ruled leader, and the pathway arithmetic under the support line (8 · 28, **12 · 66**, 15 · 105). |
| 04 | `#equation` | A transpose loop marks the two nouns; after 1.2 s in view they trade places along arcs (FLIP), “Redline.” is struck and “Oxygen.” drops in: **Capacity > Complexity = Oxygen.** Then the record of the edit writes in above it (the old line, struck, with the caret) and the support line (BL 718). *Swap* (left margin, under *tr.*) or the loop toggles it. |
| 05 | `#fit` | Too big to be small, too small to be big: four rows marked *stet* (green dots), four struck *del.*; the notes sit in the right margin column; the pen lifts over “-”, “+” and “=”. |
| 06 | `#paths` / `#file` | The playbook you inherited: four Traditional-Logic beliefs (BL 1439, 1426, 692, 693) in plain ink. The file peeks out from under it (filename and word count on the tab), and both paths sit on the desk: **Get the Bootloader** and **The book · Pre-orders open soon**. Hold **Strike it** (700 ms; the ring fills and each belief is ruled through as you hold; Enter or Space works at once) or wait about 2 s: a red rule runs corner to corner, the sheet lifts (rotateX, perspective) and slides away. Underneath: *The book changed how you think. This SUSD Bootloader changes how you operate.*, the file with the email opt-in, and the book. Every “Get the Bootloader” link runs the same sequence at a third of the time and focuses the email field; every “The book” link does it and lands on the book. The struck state is kept for the session. |

Submitting a valid email stamps “Yours” on the file, writes a green *stet* by the filename, then
opens `https://scaling-up-side-down.vercel.app/appendix#get` (the live opt-in). Nothing is sent or
stored here.

## How it is built

- `src/marks/`: the proof-mark engine. Text is measured with offset chains inside each sheet's
  unrotated inner box (so the sheet's rotation does not skew the marks); strikes cross the middle
  of the x-height from real font metrics; wobble is seeded (mulberry32) so screenshots repeat.
  Marks are SVG paths drawn on with `stroke-dashoffset`; never a CSS line-through.
- `src/motion/clock.ts`: intros run on the page's single rAF loop (`ticker.ts`) against wall-clock
  time, so every frame is a coherent moment; moving pieces are promoted only while they move.
- `src/motion/light.ts`: the lamp. A ±4° raking light follows the pointer (lerp 0.06), as a
  compositor-only rotation of each sheet's light layer.
- `src/paper.ts`: paper grain and laid lines, the raking light, the desk lamp and the sheets' soft
  shadows are drawn once into small CPU canvases after the first frame and encoded off the main
  thread (toBlob → object URLs); the lamp and shadows fade in when ready (no image files, no
  runtime filters or large CSS blurs/gradients to rasterise).
- Type has floors (`max(…px, calc(n * var(--u)))`) so labels stay legible on 1280×720 laptops;
  struck text under 24 px uses the darker `--ink-struck-small` (5.1:1).
- Tablet (portrait 600–1100 px) is its own tier: desktop actions row, the scaled stair, margin
  notes, and the file and the book side by side.
- Fonts: `scripts/subset-fonts.py` subsets Newsreader from the @fontsource package to the page's
  glyphs and axis ranges (142 KB of fonts in total).
- Calm mode: under a software renderer (SwiftShader, llvmpipe: VMs, remote desktops, headless
  screenshot tools; detected from the WebGL renderer string) the sheets start settled, as under
  reduced motion, because per-frame repaints of large lit type starve a software rasteriser.
  User-triggered interactions (the transpose, Strike it, the stamp) still play.
- Reduced motion: every sheet renders in its end state, the finale shows the file with the struck
  playbook as a small static sheet above it, no scroll-snap.

## Changes from the brief (round 2, after review)

- Sheet 06's four lines are no longer pre-struck: they are a plain recap, and the hold strikes
  them (so “Strike it” means something). The fourth line is now “Scale up at any cost” (BL 693,
  a Traditional-Logic cell) instead of “Complexity > Capacity = Redline.”, which is the book's
  own warning, not inherited advice.
- The finale headline is the plain line (“The book changed how you think. This SUSD Bootloader
  changes how you operate.”); “This is not a playbook. It is a constraint layer.” is its subhead.
- Sheet 04's support line is BL 718 (“The business can breathe. Systems carry what the business
  creates.”), and its button is *Swap*.
- Nothing on the page calls the Bootloader free; that needs Michael's word.

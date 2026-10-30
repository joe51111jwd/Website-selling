# Waterline — Scaling Up-Side-Down (option)

Michael Wentz's thesis is set huge, and real water rises toward it as you scroll. Each scroll step is
another hire: dry up to twelve people, touching the words at thirteen, swallowed in red past fifteen.
Then Up, Side and Down drain it lap by lap, and getting the Bootloader drains the whole page dry.

Brief: `../brief/BRIEF-waterline.md`. Every sentence on the page is Michael's, word for word, from
`src/copy.ts` (each line carries its source reference).

## Run

```bash
npm install
npm run dev            # local dev server
npm run build          # tsc --noEmit && vite build  → dist/ (base './', works from any path)
npm run preview        # serve dist/
npm run build:single   # one self-contained file → dist-single/index.html (JS, CSS, fonts, favicon inlined)
```

Copy gate (must report `0 not found`):

```bash
node ../tools/copycheck.mjs src/copy.ts $(find src -name '*.tsx') index.html
```

## Debug URL params (harmless in production)

| Param | Effect |
|---|---|
| `?n=13`, `?n=15`, `?n=39` | Pin the tide stage at that headcount (39 is Redline). |
| `?section=turn` | Jump to the turn, line above the water. |
| `?section=cycle&lap=1..3` | Jump to the end of that lap of the cycle. |
| `?section=oxygen` | Jump to the Oxygen end state. |
| `?fallback=1` | Force the CSS water (no WebGL). |
| `?gl=1` | Force the live WebGL water (skip the frame-time probe). |
| `?nonav=1` | Play the drain after a valid email but stay on the page. |
| `?reduced=1` | Force the reduced-motion page. |
| `?debug=1` | Expose the engine as `window.__engine`. |

## What each section does

0. **Rail** (fixed for the whole page). Title left; `The book` and the pill `Get the free Bootloader`
   (sub-label `Framework file for your AI`, so a stranger knows what the Bootloader is) right, both to
   `#paths`. It reads the water: paper behind it while the water is low, clear when the surface reaches
   it, cream type under water (the flood, the start of the turn). A hairline appears where normal-flow
   content starts to scroll beneath it. There is no bottom bar on phones (it covered captions).
1. **Tide** (`#tide`, sticky, height from `TIDE_TRAVEL`: 462vh). The hero is its top. The kicker says
   what it is and who it is for. Scroll maps to headcount in steps (8 → 12, hold, 13, 14, 15 → 39;
   schedule in screens in `tide.controller.ts`). The water level is linear in lines of communication
   n(n−1)/2 between control points measured from the H1 (8 clears the descenders, 12 laps the
   baseline, 13 touches the letters, 15 is halfway up, 20 is over). A `complexity` level mark rides the
   surface over the readout once the water has settled. 13–14 holds for almost a screen with
   `THRESHOLD`, `Past twelve, something breaks.` and the threshold line. From 36 the stage reads
   Redline (`Complexity > Capacity = Redline.`), which holds for almost a screen and only fades as the
   stage scrolls away into the turn. The read-only gauge runs red above 12 (threshold and graveyard);
   its zone names are whole words that flip colour as the water passes them. Desktop (≥1280) shows the
   names and the book's question `How many people are on your team?` at the gauge's head; below 1280
   the gauge shows numbers and the question sits above `Scroll to hire`.
2. **Turn** (`#turn`, 200vh, overlaps the tide's last screen). The line starts low in the flooded
   water and rises at once while the water drains to 0.70V: `You were never the problem. The model you
   inherited was.` breaks the surface, holds, then fades in place.
3. **Cycle** (`#cycle`, height from `CYCLE_TRAVEL`: 437vh; overlaps the turn by a screen so its stage
   fades in exactly where the turn line was; timeline in `cycle.timeline.ts`). `Up. Side. Down.
   Repeat.` stands on a deck labelled `capacity`; the water is `complexity`. A legend in the water keeps
   `Up for growth. Side for stability. Down for pruning.` on screen, the playing phase lit, and under
   it the Compounding Mechanism table (BL 861–864) one cell at a time: lap 1 says what happens
   (`Revenue expands, reach grows, capacity stretches` …), lap 2 what compounds (`Volume increases` …),
   lap 3 the next Up (`Starts from higher base`, `All three gains stack`). Laps 2–3 run at ~40% of lap
   1. Each Side slides in a hatched stratum (`Systems · cycle k`) that lifts the deck; a dimension line
   measures the `margin`, the clear air between the lowest stratum and the water. The close line comes
   in two steps (`Each cycle starts higher than the last` / `because …`). Oxygen: the water drains away
   and the group settles at the optical centre.
4. **Two paths** (`#paths`). M L234 split over the two columns: `Half of this book is meant to be
   read.` over the book (typographic cover, the author line from BL 51, `Pre-orders open soon`, disabled
   until `LINKS.preorder` is set) and `The other half is meant to be used.` over the SUSD Bootloader as
   a file (`SUSD_Bootloader_V16.md`; its face shows its title, its PURPOSE line and what it does, BL 1–15;
   `Free`; `Works with ChatGPT, Claude or any AI`; `Upload the file … Then let the system locate you.`)
   with the email opt-in. Phones show the two halves together, then the file, then the book, each named
   by a small label. A valid email plays **the drain** (chop, level falls off the page, a red `Yours`
   stamp lands on clean paper with `The file is the operating system.`, `Taking you to the download
   page…`) and then opens `LINKS.get`; a wall-clock guard navigates even if the tab is hidden. No email
   is sent or stored.
5. **Footer.** Dry paper below the paths' 72 px strip of water (the dock).

## How the water works

- `src/water/model.ts` is the single water model (level spring, swell, ripples). `src/water/gl.ts`
  is raw WebGL2 (one full-screen triangle) evaluating the **same** surface formula.
- `src/water/WetText.tsx` renders text twice in one grid cell; the engine clips the dry copy to the
  air and the wet copy to the water with polygons sampled from the same surface function, so type
  and water line up by construction (no text is ever drawn into WebGL).
- `src/engine/engine.ts` runs the one rAF loop: section controllers set the target level, the model
  steps, captions update, then every wet text is clipped (all reads, then all writes), then the
  water draws. The loop pauses when the tab is hidden and when the water is off-screen and at rest.
- CSS fallback (`?fallback=1`, no WebGL2, or a slow device): a still SVG surface built from the
  same formula, moved by the same spring. Slow is measured, not guessed: once the intro is over and
  the water covers at least a quarter of the screen (the costly case), 30 frames are sampled; a median
  over 30 ms switches to the CSS water. A watchdog then keeps a 60-frame rolling median for the first
  20 s of on-screen water and switches if it exceeds 28 ms (frames over 250 ms, e.g. tab switches, are
  ignored). Automated browsers
  (`navigator.webdriver`, i.e. screenshots and audits) skip the probe because they render WebGL in
  software; their frame times say nothing about a real device. The shader returns early above the
  crest, and scripted tweens (the drain) run on the wall clock.
- `prefers-reduced-motion`: no loop at all; the sticky sequences become stacked static blocks
  (hero, 13, Redline, turn, cycle end, Oxygen, paths), each with its own fixed waterline.

## Fonts

Self-hosted, no third-party requests. Bricolage Grotesque comes straight from
`@fontsource-variable/bricolage-grotesque` (latin, opsz + wdth + wght). JetBrains Mono is a subset of
`@fontsource-variable/jetbrains-mono` (latin, wght axis) to the characters the page uses, without
code ligatures, generated with:

```bash
pyftsubset node_modules/@fontsource-variable/jetbrains-mono/files/jetbrains-mono-latin-wght-normal.woff2 \
  --unicodes="U+0020-007E,U+00A0,U+00B7,U+2013,U+2014,U+2018,U+2019,U+201C,U+201D,U+2026" \
  --layout-features='' --flavor=woff2 --output-file=src/fonts/jetbrains-mono-wght-subset.woff2
```

Budgets: JS ≈ 70 KB gzipped (≤ 110), fonts ≈ 144 KB (≤ 160).

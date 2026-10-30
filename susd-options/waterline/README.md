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

1. **Tide** (`#tide`, sticky, 434vh). The hero is its top. The kicker says what it is and who it
   is for (`A book by Michael Wentz · For bootstrapped founders · Teams of 1–12`). Scroll maps to
   headcount in steps (8 → 12, hold, 13, 14, 15 → 39; schedule in screens in `tide.controller.ts`).
   The water level is linear in lines of communication n(n−1)/2 between control points measured
   from the H1 (8 clears the descenders, 12 laps the baseline, 13 touches the letters, 15 is halfway
   up, 20 is over). A `complexity` level mark rides the surface over the readout (people · lines of
   communication) while the sentence is dry. 13–14 holds for almost a screen with `THRESHOLD`,
   `Past twelve, something breaks.` and the threshold line. The read-only gauge names each zone in
   the middle of its span (phones: numbers, with the live headcount on the marker). Flooded at 39:
   `Complexity > Capacity = Redline.`; the whole stage fades before it scrolls away.
2. **Turn** (`#turn`, 200vh, overlaps the tide's last screen). Dark still water, then it drains to
   0.70V while `You were never the problem. The model you inherited was.` rises and breaks the surface.
3. **Cycle** (`#cycle`, 680vh; timeline in `cycle.timeline.ts`). `Up. Side. Down. Repeat.` stands on
   a deck labelled `capacity`, below the descenders; the water is `complexity`. A legend in the water
   keeps `Up for growth. Side for stability. Down for pruning.` on screen, the playing phase lit, with
   the Side/Down sub-captions under it. Lap 1 plays at 0.6 screens a phase, laps 2–3 at 0.35. Up
   raises the water, Side slides a hatched `systems` stratum under the deck and lifts it (its
   underline lies on the deck), Down drains it. A dimension line measures the `margin` from lap 2.
   The close line holds for a full screen in the water; it ends on `Capacity > Complexity = Oxygen.`
4. **Two paths** (`#paths`). M L234 split over the two columns: `Half of this book is meant to be
   read.` over the book (typographic cover, `Pre-orders open soon`, disabled until `LINKS.preorder`
   is set) and `The other half is meant to be used.` over the SUSD Bootloader as a file
   (`SUSD_Bootloader_V16.md`, its real first lines on the face, `Free`, `Works with ChatGPT, Claude
   or any AI`) with the email opt-in. Rows are shared, so the two calls to action line up. A valid
   email plays **the drain** (chop, level falls off the page, a red `Yours` stamp lands, `Taking you
   to the download page…`) and then opens `LINKS.get`. No email is sent or stored. The DOM puts the
   file first (phones show it first; focus order matches); desktop places the book on the left.
5. **Footer.** The dock's water runs on under it (wet inks) until the drain leaves it dry.

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
  same formula, moved by the same spring. Slow is measured, not guessed: 30 frames after boot, if
  the median frame takes over 30 ms the page switches to the CSS water. Automated browsers
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

Budgets: JS ≈ 68 KB gzipped (≤ 110), fonts ≈ 144 KB (≤ 160).

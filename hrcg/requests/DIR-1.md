# DIR-1 → A3 · director review of the QA desktop shots (1440×900, `qa/shots/desktop-a-10*.jpg`)

1. **A-103 BOLTED ASSEMBLY: the circle eats the H2.** At rest the detail circle covers most of the
   heading, so it reads "BOLTE / ASSEM" — that reads as a layout bug, not as "type behind a drawing
   frame". Keep the overlap to a *bite*: the circle may cover at most the last 1–2 letters of the longer
   line (target ≤ 15% of the H2's glyph area), and every word must stay recognisable at 1440×900, 1280×800
   and 390×844. Also: a stencil numeral is clipped at the right edge ("5"/"3" fragment) and a thin framed
   rectangle peeks out on the far right; make the 03 stencil and any secondary frame sit fully inside the
   content column (or drop the secondary frame).
2. **A-102 DRYWALL INSTALLATION: the 4:5 perspective crop reads as a stud edge.** Most of the frame is a
   metal stud and the board's edge, so a visitor can't tell what is happening. Re-pick the crop window
   (still x ≥ 0.50 of the frame so the head and visor stay out, per the brief) and/or the in-point so the
   board face and both hands read as "a robot pressing a sheet onto a frame". If no window inside the rule
   works, ask A5 (requests/) for a re-cut of `el-c31` with a different x offset; tell me the frame range.
3. Your outstanding items from A6-5 still apply (accessible names: append the visible numbers).

Reply in this file with what you changed (and a fresh screenshot path). Director.

---
**A3 fixer reply (13:35).** Retakes are in `qa/review/r1/` (names below); typecheck, vitest and the build check pass.

1. **A-103: the circle no longer eats the H2, at landing or at any scroll offset.**
   - *Landing (F-007):* the stage holds the composed sheet for 20vh after any landing (`data-land="0"`; the entrance
     starts at landing + 20vh, and the pin is lengthened by the same amount, so the hold keeps its 42vh). An INDEX jump to
     A-103 arrives at e = 0 with BOLTED ASSEMBLY whole and focused: `r1/a11y-perf/kbd-index-to-a103.jpg`,
     `r1/art/1440-a-103-land.jpg`, `r1/art/1280-a-103-land.jpg`.
   - *At rest:* the circle sits a hair (0.1 em) right of ASSEMBLY's Y. Measured H2 glyph area under the circle: **0%**
     at 1024×768, 1280×800, 1366×768, 1440×900 and 1920×1080 (pixel count with the circle hidden). Phones stack
     (H2 above the circle): `r1/stage-a-103-000vh-390.jpg`. If you want a token bite back, `--gap: -0.06` in
     `a103.css` tucks only the tip of the Y's arm (well under your 15%); I left it at 0 because the brief for this
     round says the H2 must never sit under the circle.
   - *During the iris:* everything but the circle (tag, H2, spec, beats, 03, PLAN 03, leader and reference) prints out
     over e 0–0.3 *before* the circle grows, and the composition is inert from then on, so no type is ever under the
     film. The circle swells 30% (by area), the detail dissolves to c32 inside it with the caption hand-over, then it
     opens by area to 16:9 on the spine: `r1/motion/a103-iris-entrance-grid.png`.
   - *03 stencil and PLAN 03:* both sit fully inside the content column at rest, PLAN 03 ≥ 24 px clear of the circle
     (24–147 px across the five sizes), and both are gone before the frame grows, so nothing peeks past the hold frame
     (`r1/stage-a-103-060vh-1440.jpg`, `r1/art/1280-a-103-060vh.jpg`).
2. **A-102 crop:** A5 re-cut `el-c31` (window x 0.44 below the head, F-009); it reads as 07 pressing the board with its
   forearm and hand, the 07 stencil on its chest. I applied your alt from A5-fix-4 and capped the film's height so its
   caption (the AI disclosure) is on screen at the landing at 1280×800 too: `r1/art/1440-a-102-land.jpg`,
   `r1/art/crop-1440-a102-persp.png`, `r1/art/1280-a-102-land.jpg`, `r1/phone/a-102-land-390.jpg`. I tried the film at
   six columns (its board running into the gypsum panel); it pushed the caption under the strip, so it stays at five.
3. **Accessible names (A6-5):** the visible numbers lead: `01-A / A-101: go to perspective, concept film of
   bricklaying` and `1 / A-101 detail: concept film of …` (the slash form is the one the copy lint allows). axe
   `label-content-name-mismatch` passes on A-101 and A-105.

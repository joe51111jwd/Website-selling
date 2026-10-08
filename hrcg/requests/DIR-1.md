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

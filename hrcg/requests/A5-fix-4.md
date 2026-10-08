# A5 fixer → A3 · F-009: `el-c31` is re-cut and re-crushed (for your A-102 / DIR-1 #2)

**Live since 13:14:** `public/media/perspectives/el-c31.{av1,h264}.mp4` and `el-c31.poster.{avif,jpg}`. Same id, same
size (1080×1350, 4:5), same duration (121 frames, plays once and holds), so `<LoopVideo id="el-c31">` needs no change.

**What changed**
- **Window:** x 845–1409, rows 371–1076 of the 1920×1076 mezzanine (x 0.44, from 0.345 of the height down),
  scaled 1.915×. It shows the board face, both forearms and hands pressing on it, and the "07" on the chest. The
  head (and its ~3.0 s visor glint) stays above the window in every frame (C6). The old window was x 0.55, full
  height: studs, the board's edge, and two hands sticking out of a black blob.
- **Crowd crush:** 07 and the set are kept whole; everything behind them goes to `#0B0B0A` with the clip's grain;
  the gaps between the studs are crushed too, so no spectator shows at any frame.
- Every 12th frame of the new cut: `qa/review/r1/a5/f009-el-c31-every12-new-window.jpg`; 3.4 s:
  `qa/review/r1/a5/f009-el-c31-t3.4-new-window.jpg`.

**Note on DIR-1 #2.** The director asked to keep x ≥ 0.50 "so the head and visor stay out". F-009 asks for x ≈ 0.42.
At full height neither works (at x 0.42 the head is in frame; at x ≥ 0.53 there is no forearm). This window starts at
x 0.44 *below* the head instead, which meets both the head-out rule and F-009's "board, both hands and the forearms".
The alt (`A102.alt.perspective`, "close on robot 07's hands pressing a sheet of drywall flat against a steel stud
frame; dust hangs in the light") still fits; the studs are now only a sliver at the right edge, so "against a steel
stud frame" is implied rather than shown. Your call whether the alt needs a touch.

Please retake `art/1440-a-102-land.jpg` and `art/crop-1440-a102-persp.png` after your A-102 composition work; I've
put my own land retake in `qa/review/r1/a5/` when it lands.

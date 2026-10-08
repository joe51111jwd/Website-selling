# A2 fixer → A5 · H-2(b): the 9:16 ghost is not the 9:16 film's first frame

**File (A5):** `public/media/hero/hero-ground-916.{avif,jpg}` (and its pipeline step).

**What I checked.** The film has to rise *out of* the ghost without a jump (director H-2(b)): the ghost in the
ground must be the frame the film starts on, at the same place. I extracted frame 0 of each shipped snap film
(`ffmpeg -i hero-snap-{169,916}.h264.mp4 -vf select=eq(n\,0)`) and compared it with the shipped ground:

| take | film frame 0 vs `hero-ground-*` | verdict |
|---|---|---|
| 16:9 (c34) | same pose, best shift (0, 0) px, correlation 0.92 | ✓ rises without a jump |
| 9:16 (N01) | ghost: 07 upright holding the vertical line, no dust. Film frame 0: 07 crouched lower, arms at the knees, the dust bank already across the bottom third. Correlation 0.61 | ✗ the pose jumps as the film fades in (S + 0.25 → S + 0.8) |

Side by side (film frame 0 left, ground boosted right): `$S/a2fix/ghost/cmp-916.png` and `cmp-169.png`.

**Change asked.** Bake the 9:16 ghost from the frame `hero-snap-916` starts on (its frame 0, i.e. the N01 frame the
9:16 film is cut from), graded down exactly as the 16:9 one (10–14 %, H1 contrast gate re-checked). Same id, same
size. Nothing changes on my side: the film already fades in over the ground from S + 0.25 s (550 ms, SETTLE).

**Why it matters.** On phones (most visitors) the first thing the film does is replace the ghost; a different pose
reads as a cut, not a rise.

---
**Director decision (12:59+):** A2 is right. Rising out of the ghost with no jump matters more than keeping the dust out of the
pre-snap ground. At 12% on slab black the dust bank reads as faint texture. **A5: bake `hero-ground-916` from
`hero-snap-916` frame 0** (`kind='film'`, the same treatment as 16:9; drop the separate NEAR darkening if the film already carries it).
Use the same 12% opacity, and re-run the H1 contrast gate on 390×844 and 390×664 before marking it DONE. A2 needs to change nothing. (director)

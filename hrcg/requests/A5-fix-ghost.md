# A5 fixer → A2 · H-2(b): the hero ground now carries a pre-snap ghost of the film

**Shipped (12:24):** `public/media/hero/hero-ground-169.{avif,jpg}` and `hero-ground-916.{avif,jpg}`. Same ids, same
sizes (1920×1076 and 1076×1912), same formats; AVIF 41.3 kB / 41.4 kB (≤ 60 kB), JPEG 116 / 115 kB. Built by
`pipeline/stills.py --only hero-ground-169,hero-ground-916 --ghost 0.12`.

**What it is.** The slab ground as before (graded `tex-slab` tile × rgb(31 31 30)), with one frame of the hero's own
footage on top at **12% opacity** (sRGB normal blend, the same as a CSS layer at `opacity: .12`). Nothing else is
added; your `.cv-pool` gradient still sits on top in CSS.

## Source frame and exact placement

| | Ghost frame | Film's first frame | Placement |
|---|---|---|---|
| **16:9** `hero-ground-169` | c34 frame 60, decoded from the shipped `hero-snap-169.av1.mp4` **frame 0** (NEAR darkening included, as in the film) | the same frame | pixel-identical registration: same 1920×1076 crop (x 2–1922 of the source), no shift, no scale |
| **9:16** `hero-ground-916` | N01b frame **48** (07 crouched, holding the line taut, before the release at about frame 54), crop 1076×1912 at y 6 (as the film), with the film's NEAR darkening applied | N01b frame 76 (`hero-snap-916` frame 0): already after the snap, dust up | same crop and camera (static); 07's head/chest sits **18.7 px left and 7.8 px lower** in the ghost than in film frame 0 (phase correlation on the head/chest box; that is ~7 × 3 px on a 390 px phone). The lamp, floor and tape measure line up to < 0.5 px. |

So the ghost is laid out exactly like the film: draw `hero-ground-*` in the same `.cv-box` with the same
`object-fit: cover` and mask as `.cv-film` (it already is, in `.cv-ground-in`), and the film can rise out of it.

## For the hand-off (your side)

- **16:9:** the film's first frame *is* the ghost at 100% instead of 12%, so a plain opacity ramp of `.cv-film`
  from 0 to 1 is jump-free. Keep the ground visible under the film until the film is opaque.
- **9:16:** the body matches but the pose doesn't: in the ghost 07 holds the line up; in film frame 0 the line is
  released and the dust is rising. Ramp the film in over at least ~250 ms so the 7 px move and the arm reads as
  motion, not a cut. If you prefer the 9:16 ghost to be the film's frame 0 instead (zero jump, but with the dust
  cloud already in the "pre-snap" ground), tell me: it is one line in `GHOST_SRC` in `pipeline/stills.py`.

## H1 contrast gate (pre-snap pencil H1, measured on the real pixels)

Method: `$S/a5fix/ghost/ghostcap.cjs` loads the dev server in capture mode (`?capture&heroperf=0`), seeks the hero to
t = 1.5 s (armed, pencil H1, line paid out), screenshots with and without `.cv-far, .cv-near`, and
`$S/a5fix/ghost/contrast.py` takes the WCAG contrast of every interior glyph pixel (eroded 1 px) against the same
pixel without the H1. Gate: large text ≥ 3:1 on ≥ 90% of glyph pixels and every block's median ≥ 3:1.
Results (and the old, ghost-free ground for comparison) are in `qa/review/r1/a5/h2b-ghost-contrast.json`:

| Viewport | ≥ 3:1 | p10 | median |
|---|---|---|---|
| 1440×900 | see json | 4.4 | 4.5 |
| 1280×800 | | 4.4 | 4.5 |
| 390×844 (phone context) | | 4.4 | 4.5 |
| 390×664 | | 4.4 | 4.5 |

The ghost costs about 0.1 of contrast (the old ground: p10 4.44 / 4.50); the brightest background pixel under a
glyph goes from rgb 37 to rgb ~50. 12% is the middle of the director's 10–14% and passes with a wide margin, so I
did not push it higher. Frames: `qa/review/r1/a5/h2b-ghost-{1440,390}-t1.5-{before,after}.png`.

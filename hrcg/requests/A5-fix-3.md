# A5 fixer → A7 · new mezzanines for F-011 / F-012 (heads-up: wait for the READY line below)

**Files (A7):** `film/public/clips/*` are written by A5 (`pipeline/export_film.sh`); you re-render from them.

## c31 (F-009 → your F-012) — DONE once the READY line below is filled in
- `c31-169.mp4` / `c31-45.mp4` are re-crushed (crush mode 2: 07, the board and the studs are kept whole, the
  background goes to `#0B0B0A` with the clip's grain, and the gaps between the studs are crushed too, so the
  spectator at about 3.4 s is gone).
- **`c31-45.mp4` has a new window:** x 845–1409, rows 371–1076 of the 1920×1076 mezzanine (564×705, 4:5),
  scaled 1.915× to 1080×1350. It shows the board face, both forearms and hands, and the "07" chest number; the
  head stays above the window in every frame (C6). The old window was x 1059–1920 full height (studs and a board
  edge). In `film/src/clips.ts` the c31 entry should become `offset: [845, 371], scale: 1080 / 564` and
  `c31_45: [845, 371, 564, 705]`, if you use those numbers for anything (I don't edit your files).
- Re-render THE SET's HANG DRYWALL beat (0:13–0:15) from it; F-012's check (frames 0:13.2 / 0:14.0 / 0:14.6, no
  warm figure between the studs) then holds by construction.

## c34 (F-011)
- `c34-169.mp4` already has the tape livery fully shifted (since 08:58). For F-011, export
  `film/public/stills/c34-f84.png` as frame 84 of that file, as the fixlist says. It has **no** NEAR darkening, so
  it matches the site's hero still everywhere except under the NEAR box.
- If I also smudge the pseudo-lettering on the tape housing (F-049), `c34-169.mp4` changes again; I will say so
  here. Until then, render from the current file.

## Also changing in this round (F-047 halos, F-048 tool livery)
`c30-n09-169/45`, `c32-169`, `c33-169/239` (halo-free crush) and `b41/b42/b43-1440` (orange/red power tools
turned graphite). THE SET uses all of them; the beats look the same apart from the halos and the tools. I'll mark
each one READY below with a time.

## READY
- c31-169, c31-45: (pending)

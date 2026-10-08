# A5 fixer → A7 · new mezzanines for F-011 / F-012 (all READY, 14:42)

**Files (A7):** `film/public/clips/*` are written by A5 (`pipeline/export_film.sh`); you re-render from them.

## c31 (F-009 → your F-012)
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
- Update 14:03: the tape housing's pseudo-lettering is now smudged too (F-049), so `c34-169.mp4` changed again; render
  from the 14:42 file (see READY).

## Also changed in this round (F-047 halos, F-048 tool livery)
`c30-n09-169/45`, `c32-169`, `c33-169/239` (halo-free crush) and `b41/b42/b43-1440` (orange/red power tools
turned graphite). THE SET uses all of them; the beats look the same apart from the halos and the tools.

## READY (all re-exported by `pipeline/export_film.sh`, 14:06 and, for b41, 14:42)
- **c31-169, c31-45**: new crush; c31-45 in the new window (above). The site's `el-c31` is the same window.
- **c34-169**: tape livery as before, plus the tape housing's pseudo-lettering smudged (F-049). Use frame 84 of this
  file for `stills/c34-f84.png` (F-011). The site's hero film/stills were re-cut from the same mezzanine.
- **c30-n09-169/45, c32-169, c33-169/239**: halo-free crush (F-047).
- **b41/b42/b43-1440**: the orange drill (b41: on the floor, picked up, held at the board), the red impact wrench (b42)
  and the red pipe cutter (b43) are graphite; 07's orange pads are untouched (F-048). b41's battery label is smudged.
- b40, b44, v0, n03, n04, n01b: unchanged in content (re-copied). Note the site's PLAN 01 now holds b40 at frame 10
  and DETAIL 3 holds n03 at frame 84 (F-050 / F-049); if THE SET shows b40 after ~0.5 s or n03 after ~3.6 s, the
  same bare mortar slabs / socket lettering are on screen there.

When your re-render is in `film/deliver/`, tell me here and I'll do F-010 (copy into `public/media/{film,og}`,
manifest, `qa_shipped.py` stills scan).

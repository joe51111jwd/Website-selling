# A5 fixer → A6 · inputs for F-053 (crowd / livery sign-off in `qa/TRUTH.md`)

**Files (A6):** `qa/TRUTH.md` (the D4, D10, D11 lines), `scripts/qa.mjs` if you want to gate on it.

**What A5 now produces** (`scripts/cpuq $S/concept/wild-spike/venv/bin/python -I pipeline/qa_shipped.py $S/a5qa/shipped`):
- `pipeline/out/assets-shipped.json` → `_summary.liveryFrames` is the gate (F-010 / F-048): tape-measure livery in the
  hero films' tape ROIs and in b44 (bay border excluded), orange/red tool livery in the plan clips' tool ROIs, and the
  social cards, posters and film stills. `_summary.yellowElsewhereInfo` lists clips whose yellow is the set's own brass
  fittings, copper or the arena's bay tape (not gated). Per clip: `toolLiveryFrames`, `visorFramesWithPoints`.
- **Manual crowd sign-off (F-009):** `$S/a5qa/shipped/<id>-every12.jpg`, every 12th frame of every shipped clip.
  For the record, A5 looked at `el-c31` (new window, no head, no spectators: `qa/review/r1/a5/f009-el-c31-every12-new-window.jpg`)
  and at c31's stud gaps at 3.4 s (`qa/review/r1/a5/f009-c31-t3.4-stud-gap-before-after.jpg`: the warm figure is gone).
- **Halos (F-047):** `qa/review/r1/a5/f047-mezz-f60-n09r-c32-c33-before-after.jpg`.
- **Tools (F-048):** `qa/review/r1/a5/f048-*.jpg` (b41 drill on the floor, picked up and held; b42 wrench; b43 cutter).
- **Brickwork (F-050):** plan-b40 now plays frames 0–10 and holds (07 lowering a brick onto one mortar bed). The fixlist's
  0–2.0 s window would still have ended on two bare mortar slabs in the course (they appear from frame ~12 and stay):
  `qa/review/r1/a5/f050-b40-course-*.jpg`. det-v0 is unchanged (see the A5 hand-back).
- **Pseudo-text (F-049):** det-n03 now plays frames 0–84 and holds (the lettering turns into view from ~88):
  `qa/review/r1/a5/f049-det-n03-socket-f60-76-84-92-110.jpg`. The b41 battery label is smudged; the c34 tape housing is
  smudged in the mezzanine, hence in the hero film, stills and THE SET's source.

No change requested in your files beyond recording these; tell me if `qa.mjs` should read a different field.

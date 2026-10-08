# A3 fixer → A4 · F-079 north arrows: the colour of TRUE NORTH

**File (A4):** `src/sheets/a4/a4.css`, the rule `.a200-tn { color: var(--pencil); }` (about line 170).

**What A3 changed (F-079, `src/marks/NorthArrow.tsx` + `src/marks/marks.css`):** every `NorthArrow` now draws
in chalk by default (`.mk-na { color: var(--chalk) }`), with a 1.5 px shaft (`.mk-na-shaft`) and a 6 px
slab-black halo on every part: an underlay path `.mk-na-halo` (7.5 px, same `pathLength=1` + `data-draw`, so
your scroll-driven `.a200-tn [data-draw]` / `.a200-gn [data-draw]` overrides draw it in step with the shaft)
and `paint-order: stroke` on the head, the base dot and the label. Your `.a200-halo` layers and the
`.a200-compass .mk-label` halo still work on top of this; they are now redundant but harmless.

**The change asked:** F-079 says *both* arrows are chalk ("TRUE NORTH is drawn at the same pencil weight as
the streets" was the defect). `.a200-tn { color: var(--pencil) }` is more specific in the cascade than
`.mk-na` and keeps TRUE NORTH pencil. Please delete it (or set it to `var(--chalk)`), unless you want TRUE
NORTH deliberately secondary to THE 1811 GRID; in that case keep it and tell the director it is a choice.

**Retake:** `qa/review/r1/art/1440-a-200-100vh-arrows.jpg` (A3) shows the arrows with the halo as of A3's pass.

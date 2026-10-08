# A1 fixer → A3 · F-015 landing gate: A-102's beat list sits on top of its H2

**File (A3):** `src/marks/sheets/a102.css` (or wherever `.a102-beats` is styled) / `src/sheets/A102Drywall.tsx`.

**Change:** keep `ul.a102-beats` from covering the H2 at the landing, e.g. `.a102-beats { pointer-events: none; }`
(re-enable `pointer-events: auto` on any interactive child), or put the H2 above it (`position: relative; z-index`).

**Why:** after an INDEX or strip jump to A-102, the focused H2 must be the element hit at its own centre
(FIXLIST F-015 verify; F-053 gate 3 "landing check"). Probe at the A-102 landing (1440×900 and 390×844, dev server,
11:58): the H2 `DRYWALL INSTALLATION` is at `[772,181 557×193]`, fully inside the unobscured band, but
`elementFromPoint` at 25/50/75% of its width returns `UL.a102-beats [732,127 636×1272]` (opacity 1, pointer-events auto),
a list box that spans the whole panel. On the phone the same list covers the H2 at y 76–156.

Everything else on the INDEX / CTA landing walk passes on desktop and phone (A-100, A-101, A-103 with your
`data-land="0"`, A-104, A-105, A-200, A-300, A-301, A-900, both CTAs). Probe: `$S/a1fix/landing.cjs <url> desktop|phone`.

---
**DONE (A3 fixer, 12:40).** `src/marks/sheets/a102.css`: `.a102-beats { pointer-events: none; }` (the beats are not
interactive, so nothing inside needs it back). `elementFromPoint` at the H2's centre now reaches the H2 on desktop and phone.

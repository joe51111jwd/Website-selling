# A1 fixer → A5 · F-002: the slab texture is 10% of the first-view budget

**File (A5):** `public/media/tex/tex-slab.avif` (and its `tex-slab.jpg` twin).

**Change:** re-encode the tile to **≤ 40 kB AVIF** at the same 1024 × 1024 px (base.css tiles it at
`background-size: 1024px 1024px`, multiplied over `rgb(31 31 30)` at about 12% exposure, so fine grain below the
multiply's visibility can go: e.g. a stronger quantiser, or a 512 px encode upscaled ×2 if it still tiles
seamlessly). Keep the file names, so no CSS change is needed. The JPEG twin only serves browsers without AVIF; ≤ 120 kB
would be enough there.

**Why:** in the R-PROD first-view probe (`$S/a11yperf/firstview.cjs` on a clean production build, 1440×900, 0–9 s,
after F-002's changes) the page moves about 1.12 MB on desktop once A2/A3 land F-006/F-037, against the 1.1 MB budget
(brief §7e/§8.6). `tex-slab.avif` is 101 kB of that, requested at 0.25 s by `body` on every page. Saving ~60 kB here
puts desktop under the budget with margin. Phone is already ~1.03 MB.

**Check:** the slab must still read as concrete in `qa/review/r1/art/1440-a-102-090vh.jpg`-type frames (the texture is
visible in the slab margins at 1440).

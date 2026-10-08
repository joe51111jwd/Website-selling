# A3 fixer → A5 · el-c31 alt in the manifest (director's 13:25 note on A5-fix-4)

**File (A5):** `src/media/manifest.json` (via `pipeline/build_manifest.py`), entry `el-c31`, field `alt`.

**Change:** set it to the director's alt, which A3 now uses on the page (`A102.alt.perspective`,
`src/content/copy/a100-a103.ts`):

`AI-generated concept film, close on robot 07’s hand and forearm pressing a sheet of drywall flat, the 07 stencil on its chest.`

**Why:** the re-cut window shows no stud frame and no hanging dust, so the old alt ("… against a steel stud frame;
dust hangs in the light.") describes things that are not in the shot (truth rule). The page passes A3's string as the
video's `aria-label`, so the manifest alt is only a fallback, but QA and THE SET read the manifest; keep them the same.

Thanks for the new window: it reads as 07 pressing the board at 1440, 1280 and 390 (retakes in `qa/review/r1/art/`).

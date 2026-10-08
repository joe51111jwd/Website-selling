# A5 fixer → A2 · F-051: new b44 line endpoints (for F-005 step 8, `FRESH_FALLBACK` in `src/hero/PlanCut.ts`)

**File (A2):** `src/hero/PlanCut.ts`, `FRESH_FALLBACK`.

**Change:** set it to the manifest's new value for `plan-b44-260` / `plan-b44` / `plan-b44-m`:

```ts
// core of the snapped stripe in the registered b44 frame at 2.60 s (pixel scan of plan-b44-260.jpg, ≥50% filled columns)
a: [0.400, 0.528], b: [0.728, 0.528]
```

**Why:** the old value `[[0.38819, 0.52551], [0.75417, 0.52804]]` (D5's centreline) ran along the top edge of the stripe and out past
both ends over the dust fringe and the reel string (`qa/review/motion/zoom-plan06-line.png`). The new one is measured in
`pipeline/build_manifest.py` (`stripe_core()`): stripe rows 746–775 of 1440 (centre 0.528), filled columns 577–1048 (0.400–0.728).
The right end stops before the dust fringe (0.735 at 15% fill), so the deposit sits inside the stripe's ends.
The line is now about 0.328 of the frame wide (was 0.366), so the plan scales up about 11.6% at registration.
`src/media/manifest.json` already carries it, and `controller.ts` reads `lineEndpoints` from the manifest when it isn't the mock.

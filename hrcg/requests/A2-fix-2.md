# A2 fixer → A5 (FYI, no action needed) · how the site now renders your F-008 freeze data (F-004)

So your limit-pose renders (`$S/a5qa/d1/*`) can match what the site draws. Code: `src/hero/freezeMaterial.ts`,
`src/hero/FreezeScene.ts`.

1. **aEdge over all 8 neighbours**, as you asked (A5-fix-2 §2.1): `edgeMeasure()`.
2. **Draw order as you suggested (§2.2):** plate → mesh (edge alpha, depthWrite on) → FAR plane (depthTest off) →
   07's layer (the mesh again, alpha = `hero-matte` alpha at vUv, depthTest off) → NEAR plane. On the 9:16 take FAR
   goes over 07's layer (no FAR occlusion on phones, §3). Type lines are merged into one plane per depth, so the
   scene is 5 draw calls.
3. **Three changes against the plain spec, all for how the gaps look (retakes in `qa/review/r1/a2/`):**
   - **Plate at the still's exposure.** Where a stretched cell opens, the plate is the background, and at 60 % it
     read as a dark stair-stepped outline round 07 (your own `rest-169.png` shows it too). The plate material now
     has colour gain 1/0.6. Before/after: `$S/a2fix/f004-cmp.png` (dark band) vs `f004b-cmp.png` (clean).
   - **Feathered alpha.** `1 − smoothstep(0.04, 0.08, aEdge)` is baked per vertex, then `min(raw, gauss(raw, σ 1.25
     cells))`, so below the matte cut (forearm, knee, hand: no matte edge) the gap fades over ~2 cells instead of a
     one-cell stair-step (`$S/a2fix/z-arm.png` before, `z-final.png` after).
   - **k grows with the turn:** `k = clamp((|yaw| + |pitch|) / (rest yaw + |rest pitch|), 0, 1)` instead of
     reaching 1 at 0.5°. At small turns the stretch is a few px and the still is better than plate; the gaps
     crossfade in over the swing instead of popping at 0.5°. Yaw 0 is still the full still (QA H5).
4. F-022 as you recommended: 16:9 `farLeft` 0.095 (cap 0.135, size 0.131); 9:16 cap 0.13, size 0.070, no FAR
   occlusion (the CSS near-matte is hidden on portrait too, so the DOM → GL hand-over doesn't pop).

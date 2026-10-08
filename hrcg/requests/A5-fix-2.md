# A5 fixer → A2 · F-008 / F-046 shipped: new freeze depth, matte and meta; what F-004 and F-022 should use

**Files (A2):** `src/hero/freezeMaterial.ts`, `src/hero/FreezeScene.ts`, `src/hero/heroLayout.ts`, `src/hero/cover.css`.
**Shipped by A5 (12:14–12:30):** `public/media/hero/hero-depth-{169,916}.bin`, `hero-matte-{169,916}.webp`,
`hero-meta-{169,916}.json`, `hero-plate-{169,916}.*` (stills re-saved, pixel-identical; the films are untouched).
Rebuild with `scripts/cpuq pipeline/run_hero.sh all --refreeze`.

## 1. What the data now is (F-008)

- **Depth, "nearer wins".** The inverse depth is grey-dilated by 19 px (a cell diagonal + 2 × 3 px + 2) before the
  grid is sampled. Around 07's upper body (above the matte cut), wherever the depth really jumps (Δd > 0.05 within
  31 px), the soft DA2 ramp is snapped to a **hard one-cell step**: the near side keeps 07's depth, the rest takes the
  local background depth. Above the cut, 07 is a smooth relief (normalised blur, σ = 5 cells), so its own internal
  steps (arm over torso) no longer make single stretched cells.
- **Matte** = 07's undilated depth core (d > the FAR-plane depth) grown by 3 px, feathered σ 1.2 px (16:9) /
  1.6 px (9:16), with a soft cut (ramp over 3% of H ending at 0.62 / 0.45 H). It lies wholly inside the
  uniformly-near part of the mesh: no triangle that the matte touches spans a depth step.
- `hero-meta-*.json` gains `depthDilation`, `edgeAlpha`, `farGlyphs`, `restStretch`, and per limit pose `stretch`.
  `pivotZ` moved slightly (16:9 2.3486 → 2.3257; 9:16 2.2365 → 2.1858); `a`, `b`, `plate` are unchanged.
- Limit-pose gate (`gates.stretchPastMatte`): no visible triangle within 3 cells of the matte stretches more than
  2 px past a rigid copy. **Passes in all 9 poses and at rest, both orientations** (max 1.05 px at yaw 10°; rest
  0.53 px). Renders: `$S/a5qa/d1/limit-*.png`, `rest-*.png`; before/after crops in
  `qa/review/r1/f008-rest-{169,916}-crop-before-after.png`.

## 2. F-004: two changes to the spec, please

1. **Bake `aEdge` over all 8 neighbours, not 4.** With 4, a vertex whose only far neighbour is diagonal (every
   stair-step of the silhouette on the grid) keeps a small aEdge, and the triangle across that diagonal
   (your index order a-c-b / b-c-d) stays visible and stretched. Same data, same poses:
   - 8 neighbours: 0 offending triangles at rest (max 0.53 px), 0 at yaw 10°.
   - 4 neighbours: **148** at rest on 16:9 (up to 11.7 px), 174 at yaw 10°; 52 on 9:16 (up to 4.7 px).
   `aEdge_i = max over the 8 neighbours n of |z_i − z_n| / z_i`, then `a = 1 − smoothstep(0.04, 0.08, vEdge·uK)`,
   discard below 0.01, exactly as F-004 says.
2. **Occlude FAR with 07's matte layer, not with the mesh's depth buffer.** The dilated ring (background texels
   that move with 07) is at 07's depth by design, so a depth test bites FAR further out than the CSS matte does:
   at yaw 0 the D is 12% bitten by depth but 0.3% by the matte, so the DOM→GL hand-over would pop the bite.
   Suggested order: plate → mesh (edge alpha, depthWrite on) → FAR planes (depthTest off) → 07 layer (the mesh
   again, alpha = matte sampled at vUv, depthTest off) → NEAR planes. That makes the GL bite at yaw 0 equal the DOM
   bite, and keeps the silhouette on the matte's clean edge at every yaw (F-004 step 3).

## 3. F-022 / F-046: FAR position

- **16:9: `farLeft` 0.095, not 0.105** (`farCapTop` stays 0.135, size 0.131). At 0.105 the per-glyph gate fails at
  rest: the D is 47% behind 07's matte (58% by depth test). Sweep (`hero-meta-169.json` `farGlyphs.farLeftSweep`):

  | farLeft | worst glyph, matte yaw 0 / rest | depth test yaw 0 / rest |
  |---|---|---|
  | 0.090 | 0.6% / 15.8% | 7.6% / 21.9% |
  | **0.095** | **2.2% / 22.1%** | **12.3% / 31.1%** |
  | 0.100 | 6.3% / 31.8% | 24.9% / 43.5% (fails) |
  | 0.105 | 15.0% / 46.6% (fails) | 34.3% / 58.1% (fails) |

  At 0.095 the bite is the A and the D, on the left shoulder pad only (head box clear), and every HUMANOID glyph
  stays ≥ 69% visible with either occlusion method. 0.100 also passes if you adopt §2.2. `typeLayerShift.far` is
  now `[-0.025, -0.005]`. Mirror it in `cover.css` (`--far-left: 0.095`).
- **9:16: turn FAR occlusion off on phones** (F-022's own fallback, brief §2.5). With `farCapTop` 0.13 and size
  0.070 (now in the meta: `typeLayerShift.far = [0, 0.03]`, `fontPxFrac` 0.070), 07's **head**, not a shoulder,
  bites "ID": D 35% (matte) / 50% (depth) at yaw 0 and 42% / 48% at rest. On the 9:16 take the shoulders start at
  y 0.31 and the FAR block ends at 0.246, so no allowed position gives a shoulder bite. The phone gate in the meta
  passes only on that condition (`farGlyphs.passesOnlyWith`).
- NEAR is unchanged on both (`nearRight` 0.885 / 0.865, `nearBaseline` 0.755 / 0.775); NEAR contrast passes
  (16:9 96.8% ≥ 3:1, 9:16 100%).

## 4. Until you land F-004

The site's current per-pixel discard still works with the new data: the step cells are discarded, so the plate
shows through, as before, but no armour texels streak off the shoulders any more. The FAR bite at your current
`farLeft` 0.135 will be large until you move it.

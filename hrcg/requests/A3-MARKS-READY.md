# A3 · drafting marks are ready (brief 5.5)

`import { ControlX, ViewMarker, … } from '../marks'` (barrel `src/marks/index.ts`) or each file directly.
Sandbox: `http://127.0.0.1:5300/?sandbox=marks/MarksSandbox` (every mark, slab + gypsum, interactive demos).
All in-house SVG, 1.25 px non-scaling strokes, `currentColor` (= `--fg`, so they flip on `[data-ground="gypsum"]`).
Presentational marks are `aria-hidden` unless you pass `title` (then `role="img"` + `aria-label`).
Interactive marks are real `<a>` / `<button>` with ≥44 px targets, an orange fill on hover/focus and a
circular 2 px `--focus` ring. Styles: `src/marks/marks.css` (imported by each mark).
Draw-on uses `pathLength=1` + `[data-drawn]` (DRAW easing); under `.no-js` / `.rm` everything is drawn.

| Mark | Props (defaults) | Notes |
|---|---|---|
| `ControlX` | `size=18`, `title?`, `seed=7` (overspray speckle), `stamp=false`, `stamped=true`, `delay=0` (ms) | Sprayed ✕ in `--marking-orange`. With `stamp`, hidden until `stamped` flips true, then stamps in (scale 1.35→1, SETTLE 300 ms). Vary `seed` per ✕. |
| `ViewMarker` | `view` ('01-A'), `sheet` ('A-101'), `target` (element id), `focusId?` (default `target`), `label` (aria-label, required), `angle=180` (triangle bearing, ° clockwise from up), `size=44` | `<a href="#target">`. With JS: `lenisScrollTo(target, {focus:false})`, then focuses `focusId` (adds `tabindex=-1`). No announce. |
| `DetailBubble` | `n`, `sheet`, `label` (aria-label), `size=44`, `children` (the detail view), `panelStyle` / `panelClassName` (absolute placement of the panel relative to the bubble's wrapper; width defaults to 36vw), `onOpenChange(open)`, `static` (symbol only), `title?` | `<button aria-expanded aria-controls>`. Panel grows with `clip-path: circle()` out of the bubble (SETTLE 700 ms) to its full circle; its `.view-frame` is clipped to the circle and gets a 1.25 px chalk ring, its caption prints in after. Closes on second click, Esc, or the closest `[data-sheet]` leaving the viewport; focus returns to the bubble. Use `onOpenChange` to `videoManager.userPlay/pause` the detail video (`<LoopVideo autoPlay={false}>`). No-JS: the panel prints statically under the bubble. |
| `SectionCut` | `length=200` (bubble to bubble), `letter='A'`, `arrows='along'` (◀ ▶ outward, A◀━▶A) or `'view'`, `look='down'\|'up'` (for `'view'`), `bubble=22`, `title?` | Chalk-blue chain line + two lettered bubbles with filled triangles. Presentational: wrap it in your `role="slider"` and rotate the wrapper. |
| `GridBubble` | `n` ('01'), `size=28`, `leader=0` (px of dashed gridline below), `drawn=true`, `delay=0`, `href?` + `label?` (link form), `title?`-like via `label` when not a link | Stencil numeral. Draws on from its foot when `drawn` flips true (400 ms; stagger 120 ms with `delay`). |
| `HoldCloud` | `width`, `height`, `tag='HOLD'` (`null` hides), `segments?` (≈ perimeter/26), `lift=0` (0..1 → shadow 2→6 px, the one allowed shadow), `flat`, `seed=11`, `title?`, `children` (content inside the cloud) | Orange scalloped cloud around its content + orange tag cell with slab-black text (legal on paper). |
| `NorthArrow` | `angle=0` (° clockwise from up), `length=120`, `label?`, `drawn=true`, `delay`, `duration=700`, `title?` | Base at the SVG centre (SVG is `2·(length+70)` square), so two arrows stacked absolutely share one origin. |
| `AngleArc` | `from=0`, `to`, `radius=90`, `label?`, `labelAt='end'\|'mid'`, `extent?` (SVG half-size; pass `length+70` of the NorthArrows to share their origin), `drawn`, `delay`, `duration=700`, `title?` | Angular dimension: arc + two filled heads; label beyond the `to` line by default. |
| `ChalkBox` | `size=20`, `side='left'\|'right'` (where the line leaves), `title?` | Square case, reel, notch and line stub, crank. A2 wraps it in the 44×44 handle. |

Geometry helpers (`src/marks/geometry.ts`, pure, prerender-safe): `cloudPath(w, h, segments=24, {bulge, jitter, seed, x, y})`
and `rectCubicPath(w, h, segments=24, x, y)` share one vertex set (corners are vertices, same cubic count), so
`motion` can tween the row outline into the HOLD cloud directly (A4, brief 4.4). Also `rectVertices`, `arcPath`,
`pointerPath`, `bearing`, `prng`.

Hooks (`src/marks/useInView.ts`): `useInView(ref, {rootMargin, threshold, once})`, `usePrintIn(ref)` (returns a
boolean; put `data-printed` on the block and `.print-in` children print in, stagger with `style={{'--d':'120ms'}}`),
`useMedia(query)` (false until hydrated).

Lint: A1 added the bare bubble form (`1 / A-101`) and `detail n` to the digit tokens (requests/A3-1.md).

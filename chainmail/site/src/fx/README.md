# chainmail fx

Real-time WebGL2 effects for the site: the hero **chrome** chainmail, the spirits **caustics**, a global
**grain**, and the scroll-scrubbed **sequence** player. Raw WebGL2 + one fragment shader per effect
(no `three` — fx does not import it, so it adds nothing to the bundle). Built as a lazy chunk:
~37 kB min / ~13.5 kB gzip.

Owned by the fx agent. Everything lives in `src/fx/`; fx injects its own tiny stylesheet (all rules
wrapped in `:where()` = zero specificity, so site CSS always wins). Nothing outside `src/fx/` needs editing.

## Usage

```js
import { initFX } from './fx/index.js';

const fx = initFX();                 // scans document for [data-fx], starts one shared RAF loop
const seq = fx.get(document.querySelector('[data-fx="sequence"]'));
await seq.ready;                     // never rejects: resolves once something drawable (or the skeleton) is up
seq.setProgress(0.42);               // 0..1, call from ScrollTrigger onUpdate
fx.setTheme(sectionEl, 'bone');      // 'ink' | 'bone'; el = a [data-fx] canvas or any ancestor of some
fx.destroy();                        // tears down loop, observers, contexts, injected grain + styles
```

`initFX(options)`:

| option | default | |
|---|---|---|
| `root` | `document` | where to scan for `[data-fx]` |
| `grain` | `true` | inject a fixed full-page grain overlay if the page has no `[data-fx="grain"]` element |
| `reducedMotion` | media query | force still frames on/off (default follows `prefers-reduced-motion`, live) |

Other members: `fx.refresh()` (mount `[data-fx]` elements added after init; `fx.get(el)` also mounts lazily),
`fx.reducedMotion`, `fx.instances` (Map element → instance).

## Markup hooks

fx never positions or sizes canvases. Give them a CSS box (e.g. `position:absolute; inset:0; width:100%;
height:100%`); fx sizes the drawing buffer from that box × devicePixelRatio (capped at **1.75**) and follows
it with a ResizeObserver. Chrome overrides the cap: DPR ≤ **1.25** with a **2.6 Mpx** drawing-buffer budget (it sits
under a veil and a vignette, so CSS upscaling is invisible). Contexts are created with
`powerPreference: 'default'` (no discrete-GPU wake-up on dual-GPU laptops for a decorative layer). Effects are decorative: add `aria-hidden="true"`.

### `chrome` — hero
```html
<canvas data-fx="chrome" aria-hidden="true"></canvas>
```
Liquid-chrome European 4-in-1 chainmail: every link threads two above and two below, shaded as polished
chrome in a procedural studio (ink cyclorama, bone softboxes, cobalt kicker). Cloth-like waves roll through
it, the cursor/touch pushes an inertial bulge and spawns ripples (pointer is listened to on `window`, so the
canvas can sit *under* content with `pointer-events:none`), scrolling the hero out tilts the studio lights.
Fades to the section colour at the edges so the rendered kit can sit on top.

| attribute | default | |
|---|---|---|
| `data-fx-density` | `1` | link density multiplier (>1 = smaller links). Default ≈ 17 links across at 1440 px, ≈ 10 on phones |
| `data-fx-vignette` | `0.55` | normalised radius where the fade to the edge colour begins (smaller = tighter spotlight) |
| `data-fx-dim` | `0` | 0..1 extra global fade toward the edge colour — use ~0.25–0.4 if body copy sits directly on it |
| `data-theme` | `ink` | `ink` or `bone`, on the canvas or any ancestor. Bone = bright silver mail in a white studio, fading to `#EFEBE3` |

### `caustics` — spirits section
```html
<canvas data-fx="caustics" aria-hidden="true"></canvas>
```
Amber + cobalt refracted-light caustics on the floor, as if cast by the bottle lineup. Computed from the
fold singularities of a refracting wave surface (real caustic curves, analytic, no textures). Deliberately low
contrast. Rendered at 60% resolution (it is soft by nature).

| attribute | default | |
|---|---|---|
| `data-fx-intensity` | `1` | brightness multiplier |
| `data-theme` | `ink` | `bone` turns it into a faint warm/cool tint on paper |

### `grain` — global
Nothing to add: `initFX()` injects `<div class="fx-grain--injected">` (fixed, full page, `pointer-events:none`,
`z-index: 2147483000`). It is a CSS background noise tile animated with `steps()` — zero JS per frame.
To control placement yourself, add your own element instead and size/position it:
```html
<div data-fx="grain" data-fx-opacity="0.06"></div>   <!-- a <canvas> works too -->
```
Tune globally with the CSS custom property `--fx-grain-opacity` (default `.07`, `mix-blend-mode: overlay`).
Pass `initFX({ grain: false })` to disable.

### `sequence` — "how a kit gets made"
```html
<canvas data-fx="sequence"
        data-manifest="/renders/sequence/manifest.json"
        data-fallback="/renders/kit/hero-open.webp"
        data-fit="contain"
        role="img" aria-label="A chainmail kit being packed, step by step."></canvas>
```
| attribute | default | |
|---|---|---|
| `data-manifest` | `/renders/sequence/manifest.json` | see schema below |
| `data-fallback` | `/renders/kit/hero-open.webp` | used when the manifest 404s / is invalid / no frame loads (`@half.webp` tried first on narrow canvases) |
| `data-fit` | `contain` | `contain` or `cover` (object-fit semantics, centred) |

Behaviour: nothing is fetched until **window load and the canvas is within ~1.5 viewports** (or `setProgress(p > 0)`
is called), so frames never compete with the hero. The manifest is fetched with `cache: 'no-cache'` (always
revalidated: a 404 cached before publishing, or a stale manifest after a re-render, never sticks). Frames then
preload **first, last, then bisection order** (middle, quarters, eighths…), 3 at a time until the first and last
frames are in, then 6 at a time (non-target frames at `fetchPriority = 'low'`), so
any scrub position always has a near frame; the frame being scrubbed to jumps the queue. Draws the nearest
loaded frame (prefers the earlier one). Picks the smallest set whose key ≥ canvas width × DPR (≤2) × 0.85 —
i.e. the `720` set on phones, `1280` on laptops; Data Saver forces the smallest, and Data Saver or a stage under
600 px takes every 2nd frame. Only frames within 8 of the playhead plus the first bisection keyframes are
`decode()`d eagerly (decoding all 121 frames at 1280 would pin ~600 MB); the rest decode when drawn. Frames may
have alpha; the canvas is cleared each draw.

Instance API: `setProgress(p)`, `ready` (Promise → instance), `progress`, `frameCount`, `loadedCount`,
`mode` (`'loading' | 'sequence' | 'fallback' | 'empty'`).

**Manifest schema** (`renders/sequence/manifest.json`), paths relative to the manifest URL. Two shapes are read.

What `tools/optimize.py` writes (frames numbered **from 0**, `0000` … `count-1`; `pad`, `width`, `height` per size):
```json
{
  "count": 121,
  "sizes": {
    "1280": { "width": 1280, "height": 960, "pattern": "/renders/sequence/1280/{i}.webp", "pad": 4 },
    "720":  { "width": 720,  "height": 540, "pattern": "/renders/sequence/720/{i}.webp",  "pad": 4 }
  }
}
```
A top-level `start` overrides the 0 default. The hand-written shape (`start` defaults to **1** here):
```json
{
  "count": 120, "start": 1, "pad": 4,
  "width": 1600, "height": 1200,
  "sets": {
    "1280": "1280/{####}.webp",
    "720":  "720/{####}.webp"
  }
}
```
`{####}` (any number of `#`) or `{i}` is replaced by the zero-padded frame number (`start`..`start+count-1`).
A set may also be an explicit array of URLs; a single set can be given as `"frames": [...]` or
`"frames": "pattern"` instead of `sets`.

## State classes / attributes fx adds

| on | class / attribute | meaning |
|---|---|---|
| any fx canvas | `.fx-canvas` | mounted |
| GL canvases | `.fx-live` | WebGL running |
| GL canvases | `.fx-fallback .fx-fallback--chrome` / `--caustics` | no WebGL2 / shader failed: an on-brand CSS gradient (tiled ring mesh for chrome) is applied |
| GL canvases | `data-fx-theme="ink|bone"` | current theme |
| sequence | `.fx-seq` + `.fx-seq--loading` → (none) / `.fx-seq--fallback` / `.fx-seq--empty` | load state; loading/empty show a subtle skeleton, never a broken image |
| sequence | `data-fx-frames="N"` | frame count once the manifest is read |
| grain | `.fx-grain`, `.fx-grain--still` | overlay; still when reduced motion |

## Runtime guarantees

- **One shared RAF loop** for all effects; it stops completely when nothing needs a frame.
- **IntersectionObserver**: GL effects only render while (nearly) on screen. **`document.hidden`** pauses the loop.
- **DPR cap 1.75** (chrome: 1.25 + 2.6 Mpx budget), ResizeObserver-driven buffer sizing, plus **adaptive
  resolution**: if the average frame exceeds ~22 ms for ~20 frames the chrome buffer scale steps down ×0.8 (to
  ≥ 0.55), and recovers when frames are fast.
- **Chrome idle throttle**: 2 s after the last pointer input, with no live ripples and no scroll, chrome draws
  every other frame (~30 fps; the cloth moves at 0.2–0.6 rad/s). Pixels the vignette fades below 1% skip the
  weave entirely (~20% of the hero canvas).
- **prefers-reduced-motion**: each shader renders **one still frame** (re-rendered only on resize/theme),
  pointer/scroll interaction is off, grain stops. The sequence still obeys `setProgress` — site-core decides
  whether to scrub or show a static before/after.
- **No WebGL2** → fallback classes above. **Context loss** → paused, rebuilt on `webglcontextrestored`.
- Pointer listeners are passive; nothing blocks scrolling.

## Performance notes

Chrome is a single full-screen pass, no raymarch: one analytic plane hit, then ≤ 9 link evaluations
(atan seed + 2 safeguarded Newton steps on the ellipse, links too far to matter are skipped) and 1–2
environment lookups per pixel — roughly 1.3k ALU ops/pixel. Headless Chromium (SwiftShader, CPU) measured it
at ~10–17× a trivial full-screen shader; that is an ALU-bound budget a mid laptop iGPU handles at 60 fps at
1440×900 @1.75, with adaptive resolution as the safety net on weaker GPUs. Caustics costs about the same as a
trivial pass at its 60% resolution.

The link geometry (lean 0.80 rad, herringbone yaw 0.20 rad, pitch 1.10 × 1.20, wire radius 0.18) was solved
offline so each link is topologically linked with exactly its four neighbours and keeps 0.41 centreline
clearance (> 2 × wire radius) — that is why the top-most-surface heightfield never shows intersection seams.
Change those constants only together.

## Test bench

`src/fx/demo.html` mounts every effect (hero chrome, sequence with a scrub slider, caustics, a bone-themed
chrome) with an FPS meter. It is **not** linked from the site and **not** a Vite build input
(`vite.config.js` only lists `index.html` and `builder.html`).

```
npm run dev   # then open http://localhost:5173/src/fx/demo.html
              # ?still            force reduced-motion stills
              # ?density=0.4      bigger links (inspect the weave)
              # ?manifest=/path   point the sequence at another manifest
```

## Files

```
index.js              initFX / API, observers, pointer bus, reduced-motion handling
core/loop.js          shared RAF loop + visibility pause
core/gl.js            context + full-screen-triangle program helpers
core/gl-effect.js     base class: DPR cap, adaptive res, resize, theme tween, context loss, fallback
core/style.js         injected zero-specificity CSS (fallbacks, grain, skeleton)
effects/chrome.js     hero effect (pointer spring, ripples, scroll tilt)
effects/caustics.js   spirits effect
effects/grain.js      grain overlay
effects/sequence.js   image-sequence player
shaders/chrome.js     chainmail fragment shader
shaders/caustics.js   caustics fragment shader
demo.html             standalone test bench (not shipped)
```

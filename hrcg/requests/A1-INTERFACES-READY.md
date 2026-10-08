# A1 · interfaces ready (brief §9.2)

Everything below exists, typechecks, and runs on the shared dev server (`:5300`). Barrels:
`src/system/index.ts`, `src/chrome/index.ts`. Change requests: `requests/<agent>-<n>.md`.

## How your sheet is mounted (App.tsx)
- `App.tsx` imports **`src/sheets/A101Brick.tsx` … `A900Notes.tsx`** and **`src/hero/CoverStage.tsx`** with `import.meta.glob` (eager, exact paths). Missing file = placeholder at the brief's scroll length; a crash = placeholder (client error boundary) and, in the prerender, a build error (`HRCG_PRERENDER_LENIENT=1` downgrades it).
  Export the component as `default` **or** as a named export equal to the file name. No props.
- App wraps each sheet in `<section id="a-101" class="sheet sheet--a-101" data-sheet="A-101" data-ground="slab|gypsum" style="--sheet-vh:190">`. Render INSIDE it (your own stage wrapper, sticky child, etc.). `--sheet-vh` = the brief's desktop scroll length if you want it: `height: calc(var(--sheet-vh) * 1vh)`.
- **CoverStage (A2)** renders both cover sheets itself: elements with `id="a-000" data-sheet="A-000"` and `id="a-100" data-sheet="A-100"` (the stage wrapper `<div class="stage-cover" style="--sheet-vh:320">` is App's). Until it exists App shows an A-000 placeholder and then A3's `A100Bays` (or a placeholder).
- Each sheet needs exactly one `<h2>` (focus target after CTA/INDEX jumps; `lenisScrollTo` adds `tabindex="-1"` if missing). One `<h1>` on the page (the cover question, A2).
- **A6:** A-900's footer title block must render `<InPageIndex />` (`src/chrome/SheetIndex.tsx`, exported from the chrome barrel): it is the `<nav id="index">` no-JS target of INDEX. The prerender warns if `id="index"` is missing.

## Rules the prerender + build enforce
- `npm run build` = `npm run typecheck && vitest run && vite build`; the Vite build runs `scripts/prerender.mjs` (react-dom/static). Your build check `npx vite build --outDir $S/build-<agent> --emptyOutDir` runs it too.
- **First render must be state-agnostic** (brief 8.3a): no `window`/`matchMedia`/`localStorage` at module scope or in render; branch in effects. `usePrefs()`/`useTier()`/`useSheet()` return server defaults during hydration and update after it.
- **three / lenis only via `import()`**, never at module top level of anything App imports (keeps the prerender and the shell lean).
- **Copy lint** (`src/content/lint.test.ts`, rules in `src/system/lintRules.ts`): every string literal in `src/content/**` (incl. your `copy/*.ts`) and every text group / alt / aria-label in the prerendered HTML. Digit runs must match allowed tokens (sheet ids, 01–05, 07, 2027, RFI-001, T7, `[1]`…, `1 · FIELD`, `0:30`, `29°`, `THE 1811 GRID`…). Exceptions only via exact strings in `src/content/lint-allow.json` (ask A1; the A-200 history bodies and grid alt are already in). `hello@example.com` may appear literally **only** in `src/content/config.ts`: use `CONTACT_EMAIL`.
- Object keys in content files are not linted; mailto bodies (ASCII " - ") are linted like copy.
- Sandboxes (`?sandbox=`) exist on the **dev server only**.

## src/system
| Export | File | Usage |
|---|---|---|
| `useStageProgress(ref, opts?)` → `MotionValue<number>` | `system/useStageProgress.ts` | Pass the TALL wrapper ref; default `'top top'`→`'bottom bottom'` (`opts.start/end` take `'<el edge> <viewport edge>'`, edges top/center/bottom). Under reduced motion / MOTION OFF it is pinned to `opts.reduced` (default **1** = end state; `null` keeps tracking). Drive DOM with `useTransform`; never re-renders. |
| `useTier()` → `{gl, lite}`; `tierStore.demote({gl:false} \| {lite:true})` | `system/tier.ts` | `gl` = WebGL2 and not `?gl=0`; `lite` = coarse pointer / <768 / deviceMemory<4 / saveData (or `?lite=1`). Server snapshot `{gl:false, lite:false}`; demote only turns flags down. |
| `usePrefs()` → `{motion}`; `prefsStore.setMotion(b)` / `toggleMotion()`; `motionEnabled()` | `system/prefs.ts` | First paint state comes from `<html class="rm">` (head script). Stored choice (`localStorage['hrcg-motion']` = on/off) wins, else `prefers-reduced-motion`. Toggling keeps the reader on the same sheet. |
| `<LoopVideo id instance? phoneId? autoPlay? priority? sheet? startAt? label? fit? videoRef? onState?/>` | `system/LoopVideo.tsx` | `instance` when one id is mounted twice (plan-b44: `instance="a100"` / `"a105"`; registry key `id#instance`). Manifest video with no-JS `<video controls preload=none poster>` + AV1-first sources; after hydration the VideoManager owns it. Auto phone variant (`phoneVariant(id)`, `phoneId={null}` to opt out). Must sit inside a non-`drawing` `<ViewTitle>`. |
| `<Picture id alt? decorative? loading? fetchPriority? sizes? fit? className? imgClassName?/>` | `system/Picture.tsx` | `<picture>` AVIF + JPEG `<img>` with width/height from the manifest. `decorative` → `alt=""` (hero ground, near-matte). Otherwise needs a `<ViewTitle>` ancestor. |
| `videoManager` (`register`, `userPlay`, `request`, `pause`, `reload`, `state`, `onState`, `reserve(key)`, `playing()`), `MAX_DECODERS` = 2 | `system/VideoManager.ts` | ≤2 decoders by the manifest's `sheetVideoPriority`; load at 150% margin, play at ≥50% visible, unload beyond 3 viewports, pause off-screen/hidden/MOTION OFF. **A2:** the hero film is not a LoopVideo: call `const release = videoManager.reserve('hero-film')` while it plays. QA: `?debug=video` overlay, `window.__hrcgVideos()`. |
| `sheetStore` (`get`, `subscribe`, `setCurrent(id)`, `markVisited`, `register(id, el)`, `scan()`, `elementOf(id)`), `useSheet()` | `system/sheetStore.ts` | `{current, visited}`; IO at `-50% 0px -50% 0px` on every `[data-sheet]`. Stage owners may call `setCurrent('A-100')` inside a pinned stage. |
| `lenisScrollTo(target, {announce?, focus?, offset?, immediate?, onComplete?})` | `system/lenis.ts` | `'#a-300'`, `'a-300'` or an element. Lenis (1.2 s, SETTLE) with motion, native jump without; lands under the header (scroll-padding), focuses the target's H2; `announce:true` only for INDEX rows / strip CTAs. Also `getLenis()`, `lockScroll(key)`/`unlockScroll(key)` for overlays (`data-lenis-prevent` on the overlay too). |
| `registerCaptureScene(name, {duration, seek(t)})` → unregister; `isCapture()` | `system/capture.ts` | `?capture` adds `<html class="capture">` (no Lenis, no CSS transitions). A5's `scripts/capture.mjs`: `await page.waitForFunction(() => window.__hrcgCapture?.ready)`, then `__hrcgCapture.seek(name, t)` (awaits your seek + 2 frames), `list()`, `duration(name)`. |
| `announce(text)` | `system/announce.ts` (re-exported by `chrome/AriaLive.tsx`) | Polite live region. Only for navigation landings and "Address copied." (A6 clipboard). |
| `onScroll(fn)`, `onLayout(fn)` | `system/scroll.ts` | Shared passive scroll / rAF-throttled layout dispatcher (read `scrollY` only in onScroll; measure in onLayout). |
| `SNAP`/`DRAW`/`SETTLE`/`TICK`: `snap(t, A)`, `SNAP_IMPACT_T`, `drawEase`, `settleEase`, `tickEase`, `cubicBezier`, `damp(x, target, λ, dt)`, `segment(p, a, b)`, `clamp01`, `CSS_EASE`, `DURATION`, `DRAW`/`SETTLE` arrays | `system/easing.ts` | The four easings, no others. CSS: `var(--ease-draw)`, `var(--ease-settle)`, `var(--ease-tick)`; motion's `ease:` takes the `DRAW` / `SETTLE` arrays. `segment(p, .10, .40)` maps a stage beat to 0..1. |
| `HEAD_SCRIPT`, `MOTION_STORAGE_KEY` | `system/headScript.ts` | Inlined into `<head>` by vite.config.ts; its SHA-256 goes into `dist/_headers` CSP. Don't add other inline scripts (the prerender fails on them). |
| `SheetPlaceholder`, `SheetBoundary` | `system/Placeholder.tsx` | Used by App; reuse `SheetBoundary` around risky sub-views if you like. |

## src/chrome
| Export | File | Usage |
|---|---|---|
| `<ViewTitle id? \| media? \| view+kind+suffix? …>` | `chrome/ViewTitle.tsx` | `<ViewTitle id="a101-plan"><LoopVideo id="plan-b40"/></ViewTitle>` → `<figure class="view">`, 1px hairline frame, `<figcaption>` underlined, NTS right. `media="plan-b40"` takes the manifest entry's `viewTitle`. No children = caption only (`captionClassName` to position it, e.g. the hero). Props: `as`, `className`, `captionClassName`, `frame`, `nts`, `captionId`. |
| `<SheetTag id="A-103" className?/>` | `chrome/SheetTag.tsx` | Prints the exact sheet tag from `content/sheets.ts` (numerals in mono) and registers its closest `[data-sheet]` with sheetStore. |
| `titleStrip.getCellRect('venue')` → DOMRect, `titleStrip.pulse('venue')`, `titleStrip.getCell(cell)` | `chrome/titleStrip.ts` | A4's HOLD cloud FLIP target: the value box of DATE · VENUE (`[data-strip-target]`). Below 768 it returns the phone bar's status button. `pulse` is a no-op under reduced motion. |
| `<CourseMark current? width? className?/>`, `COURSE_BRICKS` | `chrome/CourseMark.tsx` | The logo: one course of five bricks (u = width/10.5), `currentColor`, `current` 1..5 brick in orange, aria-hidden, min width 48. |
| `<LabelText text/>`, `labelParts(text)` | `chrome/LabelText.tsx` | Wraps numerals/IDs (A-103, 01, 2027, RFI-001, T7, 0:30) in `<span class="num">` (JetBrains Mono) inside label-style text. |
| `<InPageIndex className? title?/>`, `hasTheSet()` | `chrome/SheetIndex.tsx` | **A6:** put `<InPageIndex/>` in the A-900 footer's INDEX cell. `hasTheSet()` = manifest has `the-set-169` (render the A-900 film link only then; open it with `overlays.open('the-set', e.currentTarget)`). |
| `openIndex(trigger?)`, `overlays.open/close`, `useOverlay()` | `chrome/overlays.ts` | Opens INDEX / the title-block sheet / THE SET lightbox (Lenis stopped while open). |
| `<MotionToggle/>`, `<HoldMark/>`, `<AriaLive/>`, `announce` | `chrome/*` | Rendered by App; reuse if a sheet needs them. |

## src/content (A1)
| Export | File | Usage |
|---|---|---|
| `CONTACT_EMAIL` (`'hello@example.com'`), `CONTACT_MAILTO`, `SITE_URL` (build-time, null in dev), `resolveSiteUrl(env)`, `absoluteUrl(path)`, `OG_IMAGE_PATH` (`media/og/og-image.jpg`) | `content/config.ts` | The only home of the address. **A5/A7:** put the R5 1200×630 og:image at `public/media/og/og-image.jpg`; the head emits og:image/twitter:image only when that file exists and SITE_URL resolves (Netlify `URL` on deploys), always absolute. |
| `SHEETS`, `sheetById(id)`, `anchorOf(id)`, `COVER_STAGE_VH` (320), `COVER_STAGE_PHONE_VH` (220), types `SheetId`, `Sheet` | `content/sheets.ts` | Per sheet: `anchor`, exact `tag`, strip text, INDEX row title/sub, live-region text, `challenge` 1–5, `ground`, `scrollVh`, `phonePinVh` (A-200: 180). |
| `CHALLENGES`, `challengeBySheet(id)`, type `Challenge` | `content/challenges.ts` | `no`, `num` '01', `name` 'Drywall installation', `upper`, `label` '02 DRYWALL INSTALLATION', `sheet`, roll-call `verb`, exact `spec` sentence. |
| `VIEW_TITLES` (id → spec), `VIEW_TITLE_STRINGS` (id → exact string), `viewTitleText(spec)`, `isKnownViewTitle`, `KIND_TEXT`, `HASNT_HAPPENED` (`THIS HASN’T HAPPENED YET.`), `NTS`, `THE_SET_TITLE` | `content/viewTitles.ts` | Ids: hero-film, hero-still, hero-3d, plan-cut, a100-plans, a101-plan/-perspective/-detail, a102-perspective/-plan, a103-detail/-perspective/-plan, a104-plan/-perspective/-trace, a105-plan/-trace/-section/-detail, a200-poster/-drawing, a300-detail07/-empty-bay, a301-materials. Need another? request it. A6: use `HASNT_HAPPENED` for the A-900 end line. |
| `SKIP_LINK`, `HEADER`, `STRIP`, `PHONE_BAR`, `INDEX`, `THE_SET`, `MEDIA_STATES`, `NOT_FOUND`, `SEO` | `content/copy/chrome.ts` | Chrome copy (exact brief strings, typographic ’). |

## src/media/manifest.ts
A5 owns it (live, not a stub). A1 only reads `media`, `sheetVideoPriority`, `phoneVariant`, `posterFallback`.

## Sandboxes (dev server only)
- `?sandbox=<name>` → `src/sandboxes/<name>.tsx` (default export). `?sandbox=sheets/A101Brick`, `?sandbox=hero/CoverStage`, `?sandbox=marks/GridBubble` mount any component module under `sheets|hero|marks|chrome|lib` by path. `?sandbox` alone lists everything.
- `&chrome=1` adds header + strip + phone bar + INDEX; `&ground=gypsum` paper. `?sandbox=chrome&chrome=1` is A1's test page.

## CSS you can use (`src/system/tokens.css`, `base.css`)
- Tokens: `--slab-black --slab --concrete --pencil --chalk --gypsum --gypsum-ink --gypsum-ink-2 --chalk-blue --powder --marking-orange --bay-yellow --mortar-rust`, role vars that flip on paper `--fg --fg-2 --line --rule --focus --bg`; spacing `--s-1…--s-11 --border --strip-h --header-h --margin --gutter --cols --content-max --chrome-bottom`; faces `--font-text --font-display --font-stencil --font-mono --font-h1` (`'BS H1'` = A2's `public/fonts/BigShoulders-H1.woff2`, @font-face already declared, preloaded when the file exists); easings/durations.
- Type roles: `.t-label .t-label-sm .num .t-h1-eyebrow .t-status .t-h2-challenge .t-h2-statement .t-diptych .t-rollcall .t-spec .t-lead .t-body .t-beat .t-stencil .t-bay-numeral .t-input .t-email` (+ `.t-upper`).
- Layout: `.sheet-inner` / `.content` (12-col content column, 72/16 margins, max 1680), `.grid`, `.spine-x` (start on the spine), `.spine-line` (draw a spine segment, e.g. inside the cover stage for A-100), `.cell-button` (ruled cell: hairline, orange fill + slab-black text on hover/focus), `.feather` (6% mask), `.print-in` + `.is-in` (200 ms opacity; always visible under no-JS / reduced motion), `.js-only .no-js-only .motion-only .rm-only`, `.sr-only`.
- Page ground: `body` tiles `tex-slab` at ~12% exposure (multiply), scrolling 1:1; paper sheets paint `--gypsum` over it. The band outside the sheet border is masked to slab-black (`.sheet-border` box-shadow), so nothing shows in the outer 24/12 px.
- Classes on `<html>`: `no-js`→`js`, `rm` (reduced motion or MOTION OFF), `capture`. `[data-ground="gypsum"]` flips colours and the focus ring.

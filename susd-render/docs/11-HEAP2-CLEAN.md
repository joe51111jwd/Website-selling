# 11 · The Heap v2, clean (real-time 3D)

James's feedback on The Heap v1 (4 Nov, see `07-CLIENT-FEEDBACK.md`): too cluttered; let the objects tell the story
with almost no words; the wires form letters, the letters fall to the ground and disappear, the cups come in and
read as people, more people join and the cables pile up, then the big "wait" moment: you are scaling upside down.
This is that page. It is a new build, not a reskin of v1.

- **Entry:** `heap2-site/index.html`. Plain static files: no framework, no npm, no build step.
- **Serve:** `cd heap2-site && python3 -m http.server 8781`, then open http://127.0.0.1:8781/.
- **Check it:** with it served, from `susd-render/`: `node tools/qa_heap2.cjs http://127.0.0.1:8781/` (the visitor
  pass on 7 viewports, section 5; exits 1 on any problem; shots + `qa-*.json` go to `out/heap2/qa/`),
  `node tools/perf_heap2.cjs http://127.0.0.1:8781/` (main-thread frame cost) and
  `node ../susd-options/tools/copycheck.mjs heap2-site/index.html heap2-site/assets/js/heap2.js heap2-site/assets/js/page.js heap2-site/assets/css/heap2.css`
  (must print "0 not found"). The older `tools/shoot_heap2.cjs` still works for a quick two-viewport look.
- **Deploy copy:** `scaling-upside-down/site/heap2/`, served at `/heap2/` (section 4).
- **Artifact copy (claude.ai, James's iPhone):** `heap2-site-artifact/`, made by `python3 tools/build_heap2_artifact.py`,
  checked by `node tools/check_heap2_artifact.cjs heap2-site-artifact out/heap2/artifact-shots` (section 4).
- **For review:** `out/heap2/heap2-sheet.jpg` (16 beats, desktop 1440x900 above, iPhone 13 390x844 below),
  `out/heap2/heap2-desktop.mp4` and `out/heap2/heap2-phone.mp4` (stepped scroll-throughs, 30 fps, 39.7 s), beat shots in
  `out/heap2/shots/`.

## 1. What the page is

A real-time three.js scene in the browser on one pale, seamless studio sweep. Nothing else is in the room: dark cables
and white ceramic mugs, a soft spotlight with soft shadows, a little environment light (RoomEnvironment PMREM), ACES
tone mapping and a whisper of grain. The scroll scrubs the scene. **Everything on screen is a pure function of t**,
the scroll progress through `#story` (0..1), so scrolling back and forth always shows the same picture (no physics
state). The only clock-time motion is the intro: on load the cables draw themselves into the title letters (about
1.6 s). It is skipped under reduced motion.

The rule the picture teaches, with no words: one mug = one person; every new mug is wired to every mug already there;
the new mug's cables are blue, and they go neutral when the next mug lands. 15 mugs make 105 cables (n(n-1)/2).

Words: at most one sentence on screen at a time, all word for word from Michael (refs below). No counts, no leader
lines, no band labels. Chrome: a small title top left and one small "Get it free" button (top right on desktop; on
phone the button alone, bottom right where the thumb is, with no band and no label), hidden while the form is on
screen; it jumps straight to `#get`, and the scene cuts to the end at once (it never fast-forwards through the story
behind the form). **Never more than one button on screen:** on the first screen the cable title is the title and the
hero's Bootloader button is the button, so the chrome's small title and its "Get it free" (and the phone's button)
wait until the hero goes. Under the cable title one label says what this is: "A book by Michael Wentz" (a label, not a
sentence).

## 2. The beats (t = scroll progress; runway 1700svh)

| t | Picture | Words (source ref) |
|---|---|---|
| 0 – 0.034 | The title SCALING / UP‑SIDE‑DOWN bent from dark cable, standing just above the floor, casting soft shadows (phone: three lines). The cables draw themselves in on load. The title is fitted into the room between the chrome and the first line of words (`heroFit`), so short phones and landscape never put words on the letters. | label "A book by Michael Wentz", then "Every hire compounds complexity before it compounds capacity." (M 696) + the Bootloader button "Get the free SUSD Bootloader / A file for your AI. Version 16, 35,445 words." (label) |
| 0.040 – 0.17 | Each letter drops, topples onto the floor with a small bounce, slides apart, loses its shape and sinks into the floor (the cable thins to nothing). | none |
| 0.150 | One mug drops in and lands. The camera is high (34-46°, phone 40-52°) for the network beats, so every cable shows on the floor between two mugs and none hides behind a mug. | none |
| 0.190 | A second mug; one blue cable runs between them (drawn by 0.225), **held** until 0.236. | none |
| 0.236 / 0.280 | A third (2 new blue cables), a fourth (3 new): four people, six cables, complete by 0.324 and **held** until 0.336. The older ones turn neutral. | none |
| 0.336 – 0.378 | Mugs 5-8, faster (28 cables). | none |
| 0.392 – 0.470 | Mugs 9-15 (105 cables). The cables pile up into a heap between and over the mugs. | none |
| 0.495 – 0.575 | The pull: the heap swells and its middle rises into a tall peak (the growth that pushed them up) as it drags the mugs in; they tip over their inner edge, slide and are buried. | none |
| 0.575 – 0.603 | **The wait.** Everything stops dead, the camera too; the light drops (exposure 0.92 → 0.56). Empty scroll. | none |
| 0.603 – 0.684 | While the line reads, the camera sinks slowly from 34° to 15° (phone 44° → 17°) and leans in: the heap looms, big and dark (on phone it bleeds off both sides). | "Most founders think they're scaling." (BL 794), alone and big; at 0.636 "They're not." (the next sentence of BL 794) lands under it, on its own line |
| 0.685 – 0.745 | The camera rolls 180°, staying low: the mugs are now at the top, on the floor turned ceiling, and the heap hangs under them like a weight. While it rolls the camera backs off so the heap, standing tall mid-roll, stays in frame. | — |
| 0.700 – 0.790 | (upside down) The heap sags lower, its height stretched by up to 70% with the floor end anchored (`SAG`), so the weight visibly pulls down; it eases back by 0.848. | "They're scaling upside down—chasing growth while margins erode, complexity compounds, and they keep less of what they make." (BL 794), 0.736 – 0.804; on phone "You're getting bigger while keeping less" (BL 830) |
| 0.800 – 0.860 | The roll goes on round to 360° (right side up), the light comes back, the mugs stand up and regroup into three groups of five. | "Real scaling is cyclical." (BL 795), 0.814 – 0.866 |
| 0.840 – 0.958 | The heap pulls apart into three neat, round, slightly twisted bundles, one from each group, one after another. | "Up for growth." 0.866 – 0.902, "Side for stability." 0.902 – 0.938, "Down for pruning." 0.938 – 0.976 (BL 795), one at a time, quiet |
| 0.965 – 1 | The camera tips down to empty floor in front of the bundles. | none |
| after the runway: `#get` | Calm empty floor behind the offer. | "The pages are reference. The file is the operating system." (M 4497), the Bootloader card (name, "A free file for your AI…" label, Version 16, 35,445 words, works with Claude, ChatGPT and Gemini), "The Bootloader asks" + "How many people are on your team?" (BL 310), the email form, the book line |

The beat table lives in two places that must agree: `T` (scene timings) and `KD` / `KP` (camera keys, desktop and
portrait) at the top of `assets/js/heap2.js`, and the `data-a` / `data-b` windows on each `.cap` in `index.html`.

**The form** (same behaviour as v1): the field has no `name`; nothing is sent. Invalid or empty → "Enter your email
address."; valid → "Taking you to the Bootloader page…", then after 0.8 s (0.3 s with reduced motion) the same tab
opens `https://scaling-up-side-down.vercel.app/appendix#get`. `?nonav=1` stops the navigation (for tests). A message that
lands just under the fold on a short phone is scrolled into view. In the artifact copy the form opens a new tab instead
(section 4).

**Reduced motion:** no intro draw; the scene cuts between held states instead of moving (`RM_STEPS` in heap2.js:
hero, two mugs and their cable, four and their six, eight, fifteen, pulled + dark + low, upside down, tidy, floor); the
words cut instead of fading.

**No WebGL or no JS:** `.plates` is shown instead, a stack of seven stills of the same scene (captured from it, see
section 3) with their sentences, then the same form. `?nogl=1` forces it. If the scene module fails to load, the page
drops to the plates by itself.

## 3. File map

| Path (from `susd-render/`) | What |
|---|---|
| `heap2-site/index.html` | The page. Every sentence carries its source ref in a comment; labels carry `<!-- // label -->`. The first inline script adds `js`, `rm` (reduced motion) and `gl` (WebGL available) on `<html>` and does the trailing-slash guard. |
| `heap2-site/assets/js/heap2.js` | The scene (ES module): renderer, sweep, lights, the cable tube builder (tubes rebuilt in place, no allocation per frame), the single-stroke title glyphs (our own centrelines), the mugs (lathe + torus handle, merged, drawn as one instanced mesh), cup and cable states as functions of t, the heap, the bundles, the camera keys, `heroFit`. All 105 cables are slices of ONE mesh (`TubePool`: vertex colours, only the changed slices uploaded), so a frame is 18 draw calls, not 151. Test hooks on `window.HEAP2`: `info()`, `project()` (screen points of everything visible), `pose(t)` / `pause()` (move the scene without drawing), `cost()`, `cpuBench()`, `benchUpdate()`; `SUSD.introClock` drives the intro for the video tool. |
| `heap2-site/assets/js/page.js` | The clock (t from the scroll), the words' windows, the room left for the title (`SUSD.layout`), the chrome hiding over the form and the small title waiting on the first screen, the jump (with `SUSD.snap`), the form (and its new-tab mode for the artifact). Plain ES5. |
| `heap2-site/assets/js/three.module.js` | three.js **r160 (npm three@0.160.0)**, `build/three.module.min.js`, vendored unchanged. Licence: `three.LICENSE.txt`. |
| `heap2-site/assets/js/RoomEnvironment.js` | From three@0.160.0 `examples/jsm/environments/`; the only change is the import path (`'three'` → `'./three.module.js'`). |
| `heap2-site/assets/css/heap2.css` | Layout, type, both modes, phone tier `(max-width: 720px), (max-aspect-ratio: 4/5)`, short-landscape tier `(max-height: 500px) and (min-width: 721px)`. The canvas is the viewport's own box (`height: 100%`, same as the words' layer) and the renderer sizes to it. Colours are tokens on `:root`, repeated under a dark-scheme media query and `[data-theme="dark"]`, so a host never changes them. |
| `heap2-site/assets/fonts/` | Ortica Linear Regular, B612 Regular and Bold (from v1). |
| `heap2-site/assets/img/fb-d-1..7.jpg`, `fb-p-1..7.jpg` | Fallback stills, 1440x900 and 780x1688, captured from the live scene (about 0.9 MB in all). |
| `heap2-site/assets/img/grain.png` | The grain tile (generated noise). |
| `tools/qa_heap2.cjs` | The visitor pass (section 5): 7 viewports, every 0.005 of t forwards, a scrub back, the jump, the form, the intro, idle, reduced motion, no-WebGL, no-JS. `--only=d1440,p390s`, `--ts=0.3,0.5` (probe a few t, writes `probe-*.png`), `--skip=perf,rm,fallback`, `--out=`. |
| `tools/perf_heap2.cjs` | Main-thread frame cost (update + upload + draw submission, raster taken out) at 1440x900 and iPhone 13, unthrottled and CPU x4; pass several base URLs to compare builds. |
| `tools/build_heap2_artifact.py`, `tools/check_heap2_artifact.cjs` | Make the claude.ai artifact copy; check it framed like the host (sandboxed iframe), section 4. |
| `tools/video_heap2.cjs`, `tools/sheet_heap2.py` | The stepped scroll-through videos and the contact sheet for James (section 5). |
| `tools/shoot_heap2.cjs` | The builder's first QA: every beat at 1440x900 and 390x844, the jump, the form, fallbacks. `--only=d|p`, `--beats=0.3,0.5`. |
| `tools/stills_heap2.cjs` | Re-captures the fallback stills from the scene (run after any change to the look). |
| `out/heap2/build-shots/` | `d-01-hero.jpg` … `d-21-calm.jpg`, `d-22-get.jpg`, `d-23/24-form-*.jpg`, `d-30-nogl.jpg`, `d-31-nojs-top.jpg`, `d-32-rm-*.jpg`, and the same `p-…` for phone. |

## 4. Deploy copy (Vercel) and artifact copy (claude.ai)

**Deploy copy**, from `susd-render/`:

    rm -rf ../scaling-upside-down/site/heap2 && mkdir -p ../scaling-upside-down/site/heap2
    cp -r heap2-site/index.html heap2-site/assets ../scaling-upside-down/site/heap2/
    cd ../scaling-upside-down && node build.mjs      # copies site/ to dist/; dist/heap2/index.html

All paths are relative (`assets/...`; `../fonts/` and `../img/` inside the CSS), so it works at `/heap2/`; no external
host is used. Nothing in Vercel settings, domains, production or git was touched.

**Artifact copy**: `python3 tools/build_heap2_artifact.py` writes `heap2-site-artifact/` from `heap2-site/`, never edit
it by hand. `index.html` has no doctype, `<html>`, `<head>`, `<body>`, `<title>`, meta or icon (the host wraps it) and no
trailing-slash guard; `assets/` is a real copy (not a symlink) of the same CSS, JS (ES modules with relative imports),
fonts and stills. The colours are tokens on `:root`, repeated under `@media (prefers-color-scheme: dark)` guarded by
`:root:not([data-theme="light"])` and under `:root[data-theme="dark"]`, and `body` has an explicit background. The page
never navigates: the form carries `data-newtab` (plus `target="_blank" rel="noopener"` for the no-JS case), so page.js
opens the Appendix URL in a NEW tab synchronously inside the click (a sandboxed frame without `allow-forms` blocks a form
submission before any submit event fires, so the button is `type="button"` there and Enter in the field is handled by
script), shows "Open the Bootloader page" (a `target="_blank" rel="noopener"` link) if the popup is blocked, and the jump
does not rewrite the frame's URL. The note under the form says "in a new tab". There are no book or appendix links on
the page other than that one.

## 5. QA results (4 Nov 2026, visitor pass; the re-run after the review pass is in section 7)

Run with WebGL on SwiftShader (headless Chromium, CPU rendering). Final runs: `tools/qa_heap2.cjs` against the deploy
copy `dist/heap2/` served at `/heap2/` (port 8782): **"all checks passed"**, 0 problems, all 7 viewports
(`out/heap2/qa-dist/`), and again for the 4 desktop-mode viewports after the last camera-key change
(`out/heap2/qa-dist2/`: 1440x900 and 844x390 with reduced motion and fallbacks, 1280x800, 1920x1080). JSON in
`qa-*.json` beside the shots.

| Viewport | Story scan (205 steps, t 0 → 1) | Scrub back (8 beats, mean pixel diff) | Jump ("Get it free" from t 0.3) | Form |
|---|---|---|---|---|
| 1440x900 | ≤ 1 sentence, 0 words over objects or chrome, all lines in view, button visible + clear | 0 (text antialiasing ≤ 0.03) | lands on `#get` (top 0), chrome hidden, button 552–602 of 900, scene cut to t = 1 | invalid → error label; valid → going label → exactly `…/appendix#get`, no email in any request |
| 1280x800 | same | ≤ 0.03 | button 490–540 of 800 | same |
| 1920x1080 | same | ≤ 0.02 | button 652–702 of 1080 | same |
| iPhone 13 390x844 (isMobile, hasTouch) | same | 0 | button 584–634 of 844 | same |
| 390x664 (Safari's visible area) | same | 0 | button 584–634 of **664** (was below the fold) | same |
| 375x667 | same | 0 | button 581–631 of 667 | same |
| 844x390 landscape phone | same (short-landscape tier) | 0 | button 284–334 of 390 | same |

Also checked, every viewport: no console errors or warnings, page errors, failed requests or 4xx; no horizontal scroll at
any step; the first screen shows the byline, the line and the whole Bootloader button with no click; the scene does not
redraw while nothing moves (0 frames in 0.8 s); the real (eased) scroll ends on the same picture as the stepped one;
after the jump the scene is already at the end (no fast-forward behind the form). Reduced motion (1440x900, iPhone 13):
no half-faded words at any of 101 steps, ≤ 1 sentence, held states. No WebGL (`?nogl=1`) and no JS (1440x900, iPhone 13,
844x390): the seven stills load, captions ≥ 18 px, the form is there with no named field; with JS off the plain form
opens `…/appendix?#get` (no email in it); the first still is cropped to the title so the byline, the line and the
button are on the first screen (1440x900: button 833–894 of 900; iPhone 13: 654–713 of 844). Copycheck (index.html,
heap2.js, page.js, heap2.css): `heap2-site` 12 sentences, `dist/heap2` 12, `heap2-site-artifact` 11 (it has no meta
description): **0 not found** in each.

**What failed, and what was changed** (all in `heap2-site/`, copied to the deploy and artifact copies):
1. **Words on the title, short phones.** At 390x664 and 375x667 the hero sentence sat on the cable "DOWN". Now
   page.js measures the room between the chrome and the hero's first line (`SUSD.layout`) and heap2.js fits and centres
   the title in it (`heroFit`, never bigger than the designed framing). Holds at every size incl. 844x390.
2. **The intro could freeze half drawn** when a frame was slow (seen here; on a phone it would happen after a slow
   first frame): the clock started before the first draw and the last frame before 2.0 s was the last one drawn. Now the
   first frame compiles every shader (`renderer.compile`, which also removes the hitch when the first mug lands), draws,
   then starts the clock, and the intro keeps drawing until a frame at or past its end. A reload mid-story starts where
   the page is instead of replaying from t 0.
3. **Stretched picture on iPhone.** The canvas was 100lvh tall but drawn at `innerHeight`, so with Safari's toolbar
   showing everything was stretched (up to 27% at 390x664 vs 844). The canvas is now the viewport's own box
   (`height: 100%`, like the words' layer) and the renderer sizes to it.
4. **Mid-roll frames** filled the screen with a heap on its side and touched "Real scaling is cyclical." at t 0.84. The
   camera fit now uses the box as it lies on screen while rolling, so it backs off and the heap stays in frame.
5. **The jump fast-forwarded the whole story behind the form** (the eased picture ran from t 0.3 to 1 behind the card,
   cables across the text). Now a jump (or any move of more than 0.08 in t: End, a dragged scrollbar) cuts the scene.
6. **Phone form below the fold.** On 390x664 / 375x667 the button was under the fold after the jump; the phone finale
   is tighter and the whole form fits. A message that still lands under the fold is scrolled into view.
7. **The floor (t 0.98–0.99):** a bundle end peeked in at the top beside the chrome title (phone, and in the desktop
   video); the last camera keys look further in front (portrait z 7.8 → 9.2, desktop 8.6 → 10.2), so the camera pans
   off the bundles to clean floor before the card comes up.
8. **Landscape phone (844x390):** a short-landscape tier: smaller hero type, captions below the chrome row, the long
   sentence on two lines.
9. **The first screen did not say it is a book.** Added the label "A book by Michael Wentz" under the cable title (a
   label, not a sentence), and the small chrome title waits until the letters fall, so the first screen has one title.
10. **Artifact copy:** a sandboxed frame without `allow-forms` blocked the form before any handler ran (no error label,
    no new tab). The framed copy now drives the button and Enter by script (section 4).
11. **No-WebGL first screen** (also what the artifact shows if the host cannot serve the modules): the first still filled
    the screen and pushed the line and the button below the fold; it is now cropped to the title (64svh, 50svh on
    phones).

**Frame time** (`tools/perf_heap2.cjs`): main-thread cost per frame (update + upload + draw submission, raster taken out),
over the heaviest stretch (t 0.30–0.58, the pile and the pull; all 105 cables move every frame), CPU throttling by CDP.
Two runs on a quiet machine, ranges shown; "before" is the build as handed over (served from a copy of it).

| Profile | CPU | before: p50 / p95 ms | after: p50 / p95 ms | tidy end p95 (t 0.80–0.97), before → after | update only, before → after |
|---|---|---|---|---|---|
| desktop 1440x900 | x1 | 3.5–4.6 / 10.1–10.6 | **1.5–1.6 / 3.0–6.4** | 5.1–6.5 → 4.8–5.7 | 1.5–1.9 → 0.65–0.7 |
| desktop 1440x900 | x4 | 16.2–22.1 / 43–60 | **7.4–12.5 / 16.3–26** | 32–42 → 10.6–13.7 | 5.3–6.3 → 2.8–2.9 |
| iPhone 13 390x844 | x1 | 3.3–4.1 / 6.6–11.7 | **1.7–2.9 / 4.8–6.6** | 4.8–7.8 → 3.1–4.8 | 1.5–1.7 → 0.66–0.8 |
| iPhone 13 390x844 | x4 | 11.1–16.2 / 28–76 | **7.7–11.8 / 15.4–20.1** | 24–35 → 13.4–16.5 | 5.9–6.3 → 2.0–2.9 |

Read: unthrottled, a frame costs 1.5–3 ms of main thread (p95 under 7 ms), far inside 16.7 ms; at CPU x4 (a slow phone)
the median is 8–12 ms and the worst 5% of frames in the pile touch 16–26 ms, so a slow phone may drop the odd frame
there and nowhere else. When the scroll stops nothing is redrawn.
What was cut: all 105 cables are one mesh (`TubePool`, vertex colours, only changed slices uploaded) and the 15 mugs one
instanced mesh: **151 → 18 draw calls** (and the same in the shadow pass); the Catmull-Rom sampler works out its knots
once per segment (4x faster, same output, max diff 0); `sqrt` instead of `Math.hypot` in the tube loop; no closure per
cable per frame; phones use a 1024 shadow map (GPU fill). Pictures are pixel-identical to before (checked at 9 beats).
GPU raster time cannot be measured here; pixel ratio stays capped at 2 (1.5 on touch).

**Videos and sheet for James** (made by stepping the scroll frame by frame and capturing each frame, not real-time
recording): `out/heap2/heap2-desktop.mp4` (1440x900) and `out/heap2/heap2-phone.mp4` (iPhone 13 390x844 at 2x), H.264,
yuv420p, +faststart, 30 fps, 39.7 s, 13.7 MB (desktop, 1440x900) and 7.9 MB (phone, captured at 2x: 780x1688), re-rendered
after the review pass (section 7). The pace (`KEYS` in `tools/video_heap2.cjs`) holds on the hero while
the title draws itself in, slows for each of the first four mugs, holds the wait and each sentence long enough to read,
and ends on the Bootloader card. Contact sheet: `out/heap2/heap2-sheet.jpg` (16 beats, desktop above, phone below);
the beat shots are in `out/heap2/shots/`.

**Artifact copy** (`tools/check_heap2_artifact.cjs`): **"artifact: all checks passed"** in 6 set-ups: desktop top-level;
desktop and iPhone (390x664) inside `<iframe sandbox="allow-scripts allow-popups">`; iPhone in a dark-scheme host;
desktop with `data-theme="dark"`; iPhone with no CORS headers on the files (an opaque origin cannot load the ES modules,
so the page falls back to the stills, still readable, form still working). In each: colours unchanged (body
`rgb(198, 192, 182)`, `--paper #c6c0b6`), no horizontal scroll, the wait line shows at t 0.645, "Get it free" lands on
the form with nothing over it and the scene already at the end, the error label for an invalid address (button and
Enter), exactly `https://scaling-up-side-down.vercel.app/appendix#get` opened in a new tab, the frame and the top page
never navigated, and with the popup blocked the visible "Open the Bootloader page" link (in view, `target="_blank"`,
`rel="noopener"`). Shots in `out/heap2/artifact-shots/`.

## 6. Known limits / next steps

- Everything was checked on SwiftShader (CPU rendering). Look at it on a real Mac and iPhone before James sees it:
  light, shadow softness (phones now use a 1024 shadow map), grain, and the real frame rate.
- Frame time at CPU x4 has spikes above 16.7 ms in the pile (p95 in the table); an iPhone 13 is much faster than x4 here,
  but an older Android could drop the odd frame there. Next cut if needed: fewer tube rings (CN 48 → 40) or RAD 7 → 6.
- iOS Safari's toolbar: the canvas now follows the visible viewport, so when the toolbar hides there is one resize and
  the framing moves a little (once, while scrolling). Not testable in Chromium; check on the phone.
- In the artifact, the claude.ai host must serve the files with CORS for the ES modules if it uses an opaque-origin
  sandbox; if it does not, the page shows the stills (tested) instead of the 3D scene.
- The bundle ends can look a little ragged up close. No cable sample is inside a mug any more (`pushOut`), but the
  tube between two samples can still graze a mug's rim. Mid-roll frames are smaller now but still only passed through.
- The upside-down weight is a vertical stretch of the frozen heap (`SAG`), not physics; up close some cables in it are
  long straight runs. It reads as a mass at phone and desktop size.
- The no-WebGL stills are lazy-loaded: a full-page screenshot shows only the first ones; they load as you scroll
  (and all load at once with JS off).
- The title glyphs are our own single-stroke centrelines (not Hershey); spacing is hand-tuned.
- QA speed note: Playwright's `page.screenshot()` takes seconds per shot with SwiftShader here, CDP's
  `Page.captureScreenshot` about 0.1 s; the video tool uses CDP, the QA scan poses the scene without drawing between beats.

## 7. Review pass (4 Nov 2026, fresh eyes: James, and a founder on an iPhone)

Judged on three things: clean (count what is on each screen), the no-text test (all words hidden, does the picture
alone tell it?), and the wait beat (is it the strongest moment?). What was wrong, and what changed:

- **Two buttons on the first screen** (the hero's Bootloader button plus "Get it free" in the chrome, or the phone's
  bar). Now the chrome's title and button, and the phone's button, wait until the hero goes (`chromeHero` in page.js):
  one title and one button per screen. `qa_heap2.cjs` now counts the hero's button as "the button" and fails any
  step with two buttons on screen at once (by effective opacity, so a crossfade passes).
- **The phone bar** was a band with a rule and a "SUSD BOOTLOADER" label on every screen. Now it is the button alone,
  bottom right, no band, no label.
- **Black, jagged marks on the buried mugs** (cables through the glaze, and short cables between two neighbouring
  mugs crumpling into knots). Cable samples are now pushed out of every mug (`pushOut`, cylinder test in the mug's
  own frame); a run between two mugs closer than its end offsets no longer folds back on itself, and short cables get
  less jitter.
- **No-text test, the network:** at 2-4 mugs the camera was low (26-31°) and the new blue cables hid behind the mugs.
  The network beats are now seen from 34-46° (phone 40-52°), and the first four mugs are retimed so that two mugs with
  their one cable and four mugs with their six are each complete and held a moment before the next mug lands (they
  never were before).
- **No-text test, the drag and the turn:** upside down, the old heap was a flat nest with the mugs on top; it did not
  read as anything pulling down. Now the pull raises a peak in the middle of the heap (`PEAK`: the growth that pushed
  them up), and once upside down, from a low camera, the heap hangs under the mugs like a weight and sags further
  (`SAG`) while "They're scaling upside down…" reads; right side up it settles back (`SETTLE`) as the mugs leave it.
- **The wait** was the same framing as the pull with the light dropped. Now everything stops dead (the camera too,
  0.575-0.603), then while the line reads the camera sinks slowly to a low angle and leans in so the heap looms, and
  the line is set up and paid off: "Most founders think they're scaling." alone, then "They're not." lands under it a
  beat later (both Michael's, BL 794, the same two sentences in his order; no words of ours). Then the world turns.
- **QA hole:** in the scan's posed (not drawn) steps, `HEAP2.project()` used the camera matrices of the last drawn
  frame, so any camera move between two drawn beats was measured with the old camera. `project()` now updates them.
  This found two real overlaps the old runs could not see (the right-side-up heap under "Real scaling is cyclical."
  on 1280/1920, and the floor tip-down under "Down for pruning." on 844x390); both fixed (the settle; the desktop
  camera holds until 0.974).

**Checks after the review pass** (all on SwiftShader, against the deploy copy `dist/heap2/` at `/heap2/`, port 8793):
`tools/qa_heap2.cjs` on all 7 viewports (`out/heap2/qa-dist/qa-all.json`, `qa.log`): 0 problems on the three portrait
phones and the desktops except one, the tip-down under "Down for pruning." on 844x390, which was then fixed; the
re-run on the four desktop-mode viewports after that fix (1440x900, 1280x800, 1920x1080, 844x390;
`qa-d1440+d1280+d1920+l844.json`, `qa-desktop-final.log`) printed **"all checks passed"**. Per viewport: 205 steps,
never more than one sentence and never two buttons on screen, 0 words over the objects, the first screen with the
whole Bootloader button, the scrub back the same picture (mean pixel difference at most 0.04, text antialiasing), the
jump landing on `#get` with the form above the fold (button 584-634 of 664 on 390x664), the form (error label; going
label; exactly `…/appendix#get`, no email in any request), reduced motion (no half-faded words in 101 steps), no-WebGL
and no-JS stills. `tools/check_heap2_artifact.cjs`: **"artifact: all checks passed"** (6 set-ups). copycheck: 12, 12
and 11 sentences, 0 not found (source, dist, artifact). `diff -r`: `heap2-site/` = `site/heap2/` = `dist/heap2/`.
The fallback stills were re-captured (`tools/stills_heap2.cjs`, beats 0, 0.23, 0.332, 0.49, 0.68, 0.78, 0.965). Update
cost per frame (desktop, unthrottled, `HEAP2.benchUpdate`, t 0.30-0.57) went from about 0.58 to 0.85 ms with the
push-out; still 18 draw calls. Sheet, shots and both videos were re-made from the final build.

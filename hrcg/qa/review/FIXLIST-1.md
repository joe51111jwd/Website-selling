# HRCG · FIXLIST-1

Design review, round 1 · 2026-10-08. Six review lenses (art, phone, truth, a11y-perf, motion, juror) returned 131 findings. After deduplication, this list has **102 fix items** in seven owner packages, **9 rejected** findings and **13 held for the director**.

- I opened every screenshot named in this file with the Read tool. A line that starts "Seen:" describes only what that image shows.
- Numbers marked "probe" come from the reviewers' DOM, network and accessibility probes. I did not measure them by eye.
- I made one new capture for this list: `qa/review/fixlist/clean-1440-a-104-land.jpg`.
- `$S` means `/tmp/claude-0/-home-user/a462cba4-955f-5044-9e19-3a11e18ef1bf/scratchpad`. All paths without a prefix are relative to `qa/review/`.

---

## 0. Evidence caveat (read first)

- **The QA evidence comes from a development build.** `/tmp/hrcg-qa-build` is the build behind `qa/RESULTS.md`, every top-level `qa/review/*.jpg` and every `art/prod-*.jpg`. It is a development-mode build: `qa.mjs` starts a Vite server before it builds, and that sets `NODE_ENV=development`.
  - Its assets include `jsxDEV` and the sandbox chunks (`sandboxes-*.js`, `MarksSandbox-*.js`, `chromeSandbox-*.js`).
  - Its `index.html` links five chunk stylesheets (marks, ArenaPlan, A100Bays, PerspectiveStage, a4) **before** `index-*.css`.
- **A clean production build behaves differently.** `$S/build-a11yperf` was built at 10:00 from the same sources; no file under `src/` is newer.
  - It links a single stylesheet, `index-C6BhcTJm.css`, with the base rules ahead of the sheet rules.
  - I served it read-only on :5413 and captured the A-104 landing: `fixlist/clean-1440-a-104-land.jpg`.
  - Seen in that capture: `PLAN 04 · CONCEPT FILM · AI-GENERATED` and `TASK DRAWING TRACED FROM CONCEPT FOOTAGE · DRAWING` sit on two separate rules, and there is no ▸ PLAY cell. Probe: computed `display: none` on `.a104-play`.
  - Seen in `art/prod-1440-a-104-land.jpg` and `sheet-a-104-1280.jpg`: the same two captions print on top of each other, and a ▸ PLAY box floats at the left.
- **What this means for fixers.** A defect that depends on CSS order (a single-class override in the marks, ArenaPlan, A100Bays, PerspectiveStage or a4 stylesheets) must be reproduced on the dev server (:5300) or on a clean build before anyone fixes it. The other findings were reproduced on the dev server in the reviewers' paired captures.

---

## 1. Summary

| Owner | P0 | P1 | P2 | Items |
|---|---|---|---|---|
| A1 · shell, system, chrome | 2 | 9 | 10 | 21 |
| A2 · hero | 4 | 10 | 7 | 21 |
| A3 · marks, A-100…A-103 | 1 | 7 | 7 | 15 |
| A4 · A-104, A-105, A-200 | 0 | 6 | 7 | 13 |
| A5 · media pipeline | 3 | 7 | 2 | 12 |
| A6 · conversion, notes, QA, truth | 0 | 6 | 10 | 16 |
| A7 · films | 2 | 1 | 1 | 4 |
| **Total** | **12** | **46** | **44** | **102** |

IDs run in severity order: P0 is F-001…F-012, P1 is F-013…F-058, P2 is F-059…F-102. Findings that span owners are split into one item per owner, and each split item names its partners under "Linked".

**Order of work (dependencies):**
1. **F-052** (A6) first. The QA build must be a real production build before any gate or retake means anything.
2. **F-013** (A1) before **F-014** (A1), which needs **F-045** (A5).
3. **F-002** (A1) adds the video `hold` API. **F-006** (A2) and **F-037** (A3) use it.
4. **F-015** (A1) adds `data-land`. **F-007** (A3), **F-039** (A4) and **F-041** (A4) set it.
5. **F-008** (A5) before signing off **F-004** (A2). **F-046** (A5) goes with **F-022** (A2).
6. **F-051** (A5) before step 8 of **F-005** (A2).
7. **F-011** (A7) → **F-010** (A5). **F-009** (A5) → **F-012** (A7) → **F-010** (A5) copies the new film files.
8. Pairs that ship together: **F-001** before any retake of content under the header; **F-016** before tuning **F-038**, **F-041** and **F-056**; the **H-12** decision before **F-040** and **F-083**; **F-060** with **F-078**; **F-066** with **F-100**; **F-067** with **F-092**.
9. **F-053** (A6) last. It turns every fix above into a regression gate.

---

## 2. Retake protocol

Put retakes in `qa/review/r1/` and keep each baseline's name, so that before and after sit side by side.

- **R-DEV: sheet frames on the dev server.**
  - Command: `scripts/cpuq node $S/artrev/cap.cjs <w> <h> qa/review/r1 '<plan>'`. The script loads `:5300/?heroperf=0`.
  - Plan entries: `land` means sheet top − 72 px, which is where an INDEX row or strip CTA lands. A number N means sheet top + N vh.
  - Example plan: `[["a-104",["land",50]]]`. Output: `<w>-<id>-<land|NNNvh>.jpg`.
  - A `stage-*-NNNvh-*` or `sheet-*` baseline maps to offset N (or 0).
- **R-PROD: a clean production build.**
  - Build: `env -u NODE_ENV npx vite build --outDir $S/build-r1 --emptyOutDir`.
  - Serve: `python3 -m http.server 5413 --bind 127.0.0.1`, run from that folder.
  - Capture: `scripts/cpuq node $S/fixlist/cap.cjs <w> <h> qa/review/r1 '<plan>' http://127.0.0.1:5413/`. Output: `clean-<w>-…jpg`.
  - Once F-052 lands, the build that `qa.mjs` makes is equivalent.
- **R-HERO: timed hero and cover-to-plan frames.**
  - Command: `scripts/cpuq node scripts/capture.mjs "http://127.0.0.1:5300/?capture&heroperf=0" <hero|cover-plan> qa/review/r1 --times … --w … --h … --prefix …`. Output: `<prefix>t<t>.png`.
  - For real-time idle frames, use `$S/artrev/hero.cjs <w> <h> qa/review/r1` or `$S/juror-shots.cjs`.
- **R-PHONE: touch context.** Playwright with `isMobile`, `hasTouch`, an iPhone UA and DPR 1 (the context in `$S/phonerev/probe1.cjs`), at the viewport named in the item.
- **R-A11Y: accessibility and performance probes.** The probes in `$S/a11yperf/` (`firstview.cjs`, `kbd.cjs`, `walk.cjs`, `vm.cjs`, `contrast.cjs`, `ax.cjs`), run against R-PROD.

---

## 3. Rejected

| # | Finding (lens) | Why it is rejected |
|---|---|---|
| X-1 | "The shipped production build overprints the A-104 captions and shows a stray ▸ PLAY" (art P0). Also "R1 still reproduces, reopen it" (truth P1) and the A-104 caption P0 (juror). | Refuted as a shipped defect; see §0. The clean build of the current sources renders both captions correctly and hides PLAY (`fixlist/clean-1440-a-104-land.jpg`). The overprint exists only in the development-mode QA build. The real causes are now F-052 (the QA build), F-013 (CSS order must not depend on chunking) and F-083 (a sturdier caption stack). R1 in `qa/TRUTH.md` stays fixed for the shipped build. |
| X-2 | "On A-102, sheet content paints over the fixed header (stacking context)" (truth P1, sub-claim). | Refuted. Seen in `truth/a-102-0vh-1280.jpg`: the lockup glyphs are drawn in dark ink ("RCG" shows dark over the grey board). That is the gypsum ink flip, not occlusion. F-001 fixes the symptom, and no stacking change is needed. |
| X-3 | "Raise A-200 `scrollVh` to 300 and A-105 to 260" (motion P1, fix). | Rejected. The tracks are the sheet lengths in brief §3.0 (200vh and 220vh; `a4.css:161`, `a4.css:965`). Three other lenses report dead scroll in exactly these stages, not a pin that is too short. The rushed beats (a HOLD tag readable for one wheel notch, a 12vh flight) are fixed by re-timing inside the existing pin: F-043 and F-041. |
| X-4 | "Cut the A-200 pin to 140vh" (juror) and "shorten the phone pin to 120vh" (phone). | The premise is wrong. The desktop track is 200vh, so the pin is already 100vh (`a4.css:161`). The phone track is 180vh, an 80vh pin (`a4.css:382`). The empty screens come from the choreography: F-043. |
| X-5 | "Render hero-still only after the snap starts" (a11y P0, sub-fix 6). | Conflicts with F-069: the still is the LCP element on the reduced-motion and no-JS paths, so it must load eagerly. The motion path needs it by S+1.29 s anyway. Its 90 kB fits the 1.1 MB budget once F-002 and F-006 remove about 3 MB. |
| X-6 | "Append 'Edges stretch as the view turns.' to KNOWN LIMITATIONS" (truth P2). | Superseded by F-004, which removes the artefact. Reopen only if F-004's limit-pose gate fails and the director also rejects the yaw fallback. |
| X-7 | "Use U+2011 non-breaking hyphens in view titles" (art P2). | Rejected in favour of nowrap spans (F-061). U+2011 changes the exact strings that the copy lint checks (truth lens). |
| X-8 | "Lower the per-pixel stretch discard to 0.02" (juror P0, method only). | The defect stands (F-004); this method does not. A per-pixel `fwidth` threshold scales with render size and DPR, and the phone stair-step comes from whole mesh cells being discarded (motion lens). F-004 uses a per-vertex edge measure plus the matte instead. |
| X-9 | "Lay sheet content out clear of the header band at rest": the A-101 "01" numeral, the A-102 panel corner, the A-300 form top (juror P1), and INDEX hidden by the numeral (a11y P2). | Superseded. Those frames were taken at scrollY = sheet top with no scroll-padding subtracted (capture note in `INDEX.md`), so they are not landing positions. After F-001, an opaque rail sits above every sheet layer, landings stop 72 px lower, and content passes under the rail. Seen in `art/1440-a-102-land.jpg`, a true landing: the panel starts below the header. The A-104 route end, a real at-rest problem, stays in F-039. |

---

## 4. Held for the director (not scheduled)

| # | Proposal (lens) | Recommendation |
|---|---|---|
| H-1 | Shorten the per-view titles to `{VIEW} · CONCEPT FILM` and keep AI-GENERATED only in the strip (juror P1). | Keep the titles as they are. Brief §3.2 is binding, rule 22 needs a label at each image, and `lint.test.ts` enforces it. |
| H-2 | Fill the first 3 s (juror P1): auto-snap at 1.8 s, a ghost image under the slab at first paint, a 3 px string with an idle twang and a 14–16 px hint, and FAR moved down to 0.20 on phones. | Approve the string and hint legibility changes (no copy change). Keep the 3.0 s auto-snap; F-074 fixes today's real 3.5 s. The phone FAR move conflicts with F-022. |
| H-3 | Hero sub → "Five construction tasks. Done in public. Results you can see." (juror P2, audit §5). | Director's call. "Done in public" implies an audience; rule 13 allows that only without details. |
| H-4 | Rewrite the og/twitter description, A-301 keynote 3 ("Meet … Meet") and A-900 note 4 ("Explore") (truth P2). | Director's call. Rule 24 asks for "explore"-style negotiable framing; the site already says "Ask us about" in keynote 2. |
| H-5 | A-200 body: "drew Manhattan as a grid" → "drew most of Manhattan as a grid", in both bodies (truth P2). | Approve. It narrows the claim and adds no figure. A4 edits `copy/a104-a200.ts`; A6 notes it in the fact gate. |
| H-6 | A-900 close: reorder, set the email at `clamp(28px, 4vw, 56px)`, and set the end line at statement size with the two CTA cells (juror P1). | Overrides the email size in brief §5.2. F-094 does the minimal end-line fix either way. |
| H-7 | A-900 notes always open, in two ruled columns at ≥1024 px (juror P1). | Design call. F-094 fixes the → glyph either way. |
| H-8 | A-301 as a keynoted spread (one large crop, four small, leader lines) instead of the 5-up row (juror P2). | Design call. |
| H-9 | A-104 iso plane drawn as SVG axonometric linework, with b43 as a flat PLAN 04 inset (juror P2). | Design call. |
| H-10 | Re-grade and re-crop the A-300 portrait (ref21) and use the overhead plan loops as the large views site-wide (juror P1). | Design call. |
| H-11 | A-102: make PLAN 02 (b41) the large view and c31 a DETAIL inset (juror P1). | Fallback if F-009's re-crop still doesn't read as hanging drywall. |
| H-12 | Regenerate b43 so the copper run matches the taped drawing (truth P1, preferred fix). | Needs Higgsfield credits, which the director submits per O3. If approved, skip F-040. |
| H-13 | Shorten the A-101 slide hold, or set the H2 on the empty band above the film, plus the A-104 and A-105-phone dead zones (juror P1). | Revisit after F-032, F-039 and F-085, which close most of it. |

---

## 5. Brief overrides created by scheduled items (director logs them in PRODUCTION_PLAN.md)

- **§3.1 sheet header.** "Transparent over media" becomes: transparent only while A-000 is the current sheet, and a slab or gypsum rail everywhere else (F-001).
- **§3.3 cover-to-plan beats.**
  - The H1 is out by P 0.10 (was 0.25).
  - `planCut` is [0.10, 0.30] and `pullOut` is [0.30, 0.75].
  - A-100 prints at 0.55 (was 0.75) (F-005).
- **§3.9 A-200.** No "empty slab" beat. The HOLD tag is held over p 0.20–0.40, and the H2 and body print at 0.55 (was 0.90) (F-043).
- **§2.3 rest pose.** The rest yaw drops from +8°/+6° to +5°/+4° only if F-004's gate fails.

---

## 6. Fix packages

### A1 · Shell, system, chrome

#### F-001 · P0 · A1 · The header has no ground, and its ink flips for the whole header (the logo vanishes on A-102)
- **From:** art P0 + P1, phone P1, truth P1, juror P0, a11y P2.
- **Where:** every sheet after A-000, at 1440x900, 1280x800 and 390x844, whenever content crosses the header band (y 24–72; 12–60 on phones). Also A-102 at +50/+90vh and at the 1280 sheet top.
- **Seen:**
  - `stage-a-101-000vh-1440.jpg`: the "01" numeral sits over the INDEX box and hides "IND".
  - `stage-a-101-070vh-390.jpg`: the spec "Build a wall segment…" prints through the COURSE mark and HRCG.
  - `art/1440-a-102-090vh.jpg`: the lockup is printed in dark ink over dark slab, so the mark, HRCG and the two lines are near-invisible. "INDE" shows on the panel, but the X and the box's right edge are lost past the panel edge.
  - `truth/a-102-0vh-1280.jpg`: the mark and the H of HRCG are lost over the black matte.
  - `art/1440-a-104-050vh.jpg`: the route diagonal runs into the INDEX box.
  - `stage-a-200-120vh-1440.jpg`: "New York's" runs through the lockup.
  - `art/1440-a-301-120vh.jpg`: a form label and a placeholder print through the lockup.
  - `art/1440-a-301-land.jpg` and `art/1440-a-900-land.jpg`: a dark 48 px band sits above the paper.
- **Problem:**
  - `.sheet-header` is fixed and has no background (`chrome.css:34-49`), and `.header-index` is transparent (`chrome.css:91-96`).
  - The IntersectionObserver in `SheetHeader.tsx` watches a full-width band. Any `[data-ground="gypsum"]` element in that band (for example the A-102 panel at x 732–1368) turns the whole header to slab-black ink, including the lockup that sits over dark slab.
- **Fix:**
  1. `chrome.css`:
     ```css
     .sheet-header { --rail-bg: var(--slab-black); background: var(--rail-bg); border-bottom: 1px solid var(--hairline); }
     .sheet-header[data-on='gypsum'] { --rail-bg: var(--gypsum); }
     .header-index.cell-button { background: var(--rail-bg); }   /* hover and focus stay orange */
     html[data-sheet='A-000'] .sheet-header { background: transparent; border-bottom-color: transparent; }
     ```
  2. `SheetHeader.tsx`:
     - Subscribe to `sheetStore` and set `document.documentElement.dataset.sheet = current`, so the rail stays off over the hero.
     - Limit the observer band horizontally to the lockup: left inset = `−homeRect.left` px, right inset = `−(innerWidth − homeRect.right)` px. Rebuild it in `onLayout`.
     - Result: the rail takes the ground under the logo. On A-102 that is slab (the panel scrolls under an opaque slab rail, and INDEX keeps its chalk ink). On A-300's paper, A-301 and A-900 it is gypsum, so no dark band.
  3. `base.css:16`: `scroll-padding-top: calc(var(--border) + var(--header-h) + var(--s-4));`.
- **Files:** `src/chrome/chrome.css`, `src/chrome/SheetHeader.tsx`, `src/system/base.css`.
- **Verify:**
  - Retake with R-DEV: `stage-a-101-070vh-390.jpg` (R-PHONE), `art/1440-a-102-090vh.jpg`, `truth/a-102-0vh-1280.jpg`, `art/1440-a-104-050vh.jpg`, `stage-a-200-120vh-1440.jpg`, `art/1440-a-301-120vh.jpg`, `art/1440-a-301-land.jpg`, `art/1440-a-900-land.jpg`.
  - Retake `hero-1440-t8.0s.jpg` with R-HERO; it must stay unchanged (transparent header over the film).
  - Pass when, on every frame, nothing but the lockup and INDEX is visible in the header band, the lockup is readable, there is no slab band above paper, and `elementFromPoint` at the lockup centre and at the INDEX centre returns header elements.
- **Linked:** F-067, F-092.

#### F-002 · P0 · A1 · First view moves 4.09 MB (desktop) and 4.59 MB (phone) against a 1.1 MB budget
- **From:** a11y-perf P0 (A1 part). A2's part is F-006; the QA gate is in F-053.
- **Where:** the A-000 first view at 1440x900 and 390x844, with JS and motion on and no scroll, over 0–9 s.
- **Evidence (probe, `$S/a11yperf/fv-desktop-9s.json` and `fv-phone-9s.json`):**
  - 1,690 kB of JPEG posters for A-101–A-105, requested at 0.07–0.35 s.
  - 328 kB of AVIF posters.
  - `arena-0104` and `plan-b44` AV1 downloaded in full (794 kB).
  - Phones also fetch the desktop A-100 files before switching to the `-m` files.
- **Problem:** the brief budgets ≤1.1 MB on the AV1 path (§7e/§8.6). These causes are in A1's files:
  - Every prerendered `<video>` carries `poster="…poster.jpg"` (`LoopVideo.tsx:155`), and browsers fetch posters eagerly.
  - `VideoManager` calls `preload='metadata'` plus `load()` on the A-100 videos at hydration, because the cover stage keeps them inside the 150% rootMargin.
  - The phone `-m` sources are chosen only after hydration.
  - The Lightbox `<video>` has a poster from first paint.
- **Fix:**
  1. `LoopVideo.tsx`: give the `<video>` `poster={CLEAR_POSTER}`, a 1×1 data GIF defined in `src/system` (the same value `CoverStage.tsx:47` uses). Keep the lazy `<picture class="loopvideo-poster">` as the visible poster on every tier, no-JS included.
  2. `LoopVideo.tsx`: prerender `<source media="(max-width: 767px)" …-m…>` before the desktop sources.
  3. `VideoManager.ts`: add `hold(group)` and `release(group)`. Entries with `data-vm-group="a100"` get `preload="none"` and are never `load()`ed until released. A3 tags the row (F-037); A2 releases it (F-006).
  4. `Lightbox.tsx`: set no poster until the dialog opens.
- **Files:** `src/system/LoopVideo.tsx`, `src/system/VideoManager.ts`, `src/chrome/Lightbox.tsx`.
- **Verify:**
  - Run R-A11Y `firstview.cjs`. Pass when first-view bytes are ≤1.1 MB on both desktop and phone, no `*.poster.jpg` outside A-000 is requested, and no `arena-0104` or `plan-b44` bytes arrive before scroll.
  - Retake `plan-1440-t1.8s.jpg` with R-HERO (cover-plan); bays 01–04 must still show stills.
- **Linked:** F-006, F-037, F-053.

#### F-013 · P1 · A1 · The cascade depends on how JS is chunked
- **From:** art P0 (re-scoped; see X-1).
- **Where:** any build that splits CSS.
- **Seen:**
  - `sheet-a-104-1280.jpg` and `art/prod-1440-a-104-land.jpg`: the two A-104 captions overprint.
  - `fixlist/clean-1440-a-104-land.jpg`: the same view, correct, in the single-CSS build.
- **Problem:** when chunk CSS loads before `index-*.css`, base rules win against single-class sheet overrides at equal specificity. `.view-title { margin }` cancels `.a104-plan-title { margin-top }`, and `.cell-button { display }` cancels `.a104-play { display: none }`. F-014's lazy split would bring back chunk CSS.
- **Fix:** in `vite.config.ts`, set `build: { cssCodeSplit: false, … }`. All CSS stays one file in import order whatever happens to the JS chunks (about 18 kB gz). Prerendered sheets need their CSS at first paint anyway.
- **Files:** `vite.config.ts`.
- **Verify:** build with `NODE_ENV=development` and again with production. `index.html` must link exactly one stylesheet both times. An R-PROD retake of `art/prod-1440-a-104-land.jpg` must match `fixlist/clean-1440-a-104-land.jpg`.
- **Linked:** F-014, F-052.

#### F-014 · P1 · A1 · Shell JS is 144 kB gz against a 110 kB budget
- **From:** a11y-perf P1.
- **Where:** production build, all viewports.
- **Evidence (probe):** `index-Dcdp6Vun.js` is 474.9 kB raw and 144.3 kB gz. Every sheet and the full 45 kB manifest are in the entry chunk.
- **Fix:**
  - Requires F-013.
  - In `App.tsx` `SLOTS`, load `A200Context`, `A300Teams`, `A301Sponsors`, `A900Notes`, `A105Layout` and `SectionSlice` with `lazy()`, each behind its own `<Suspense>`. React keeps the prerendered HTML until each chunk hydrates.
  - Import A5's slim runtime manifest (F-045).
- **Files:** `src/App.tsx`.
- **Verify:** `env -u NODE_ENV npx vite build`. Pass when the entry chunk is ≤110 kB gz and there are no hydration warnings. An R-PROD retake of `art/1440-a-300-land.jpg` must be visually identical.
- **Linked:** F-045, F-053.

#### F-015 · P1 · A1 · INDEX and CTA jumps leave the focused H2 off-screen or hidden
- **From:** a11y-perf P1, art P1 (landing frames).
- **Where:** INDEX rows and the strip and phone CTAs, at 1440x900 and 390x844.
- **Seen:** `a11y-perf/kbd-cta-to-a300.jpg`: "Bring the robot →" lands on the diptych ("07 ISN'T REAL. YOURS IS."). The focused H2 is not on screen; probe: y = 1105 in a 900 px viewport.
- **Problem:** `lenis.ts:87-92` `focusTarget()` scrolls to the sheet top and then calls `focus({preventScroll:true})`, whether or not the H2 is visible. That fails WCAG 2.4.11.
- **Fix:**
  - In `lenis.ts`, when the scroll completes, measure the H2 against the unobscured band: from `scroll-padding-top` down to `innerHeight − (strip-h + border + safe-bottom)`. If the H2 is not fully inside the band, scroll so its top sits at `scroll-padding-top` (`lenis.scrollTo(h2, { immediate: true })`, or native `scrollIntoView` under reduced motion). Then focus it.
  - Honour a `data-land` attribute on `[data-sheet]` (vh from the sheet top) as the landing position for pinned stages; the stage owners set it (F-007, F-039, F-041).
- **Files:** `src/system/lenis.ts`.
- **Verify:** R-A11Y `kbd.cjs`. For every INDEX row and both CTAs, the `activeElement` rect must lie inside the band and `elementFromPoint` at its centre must be the element itself. Retake `a11y-perf/kbd-cta-to-a300.jpg`; the H2 must be visible.
- **Linked:** F-007, F-039, F-041, F-053.

#### F-016 · P1 · A1 · H2 tokens ignore the chrome, and the sentence-case leading fuses glyphs
- **From:** art P1 (landing frames), art P1 (A-100 H2).
- **Where:** every H2. Most visible at the A-100, A-101 (1280), A-301 and A-200 landings.
- **Seen:**
  - `art/crop-a100-h2-j.png`: the descender of the j in "jobs" touches the ascender of the d in "builder", forming one black shape.
  - `art/1280-a-101-land.jpg`: the STABLE FINISH row is half under the strip and ghosts through it.
  - `art/1440-a-301-land.jpg`: the third line of the H2 is under the strip.
- **Fix:** in `tokens.css`:
  ```css
  .t-h2-challenge { font-size: min(clamp(44px, 12vw, 216px), 18vh); }
  .t-h2-statement { font-size: min(clamp(48px, 8vw, 152px), 12vh); }
  .t-h2-statement:not(.t-upper) { line-height: .96; }   /* keep .88 for caps */
  ```
- **Files:** `src/system/tokens.css`.
- **Verify:** with R-DEV, retake the A-100 landing crop as `art/crop-a100-h2-j.png`, plus `art/1280-a-101-land.jpg`, `art/1440-a-301-land.jpg` and `stage-a-200-120vh-1440.jpg`. Pass when no glyphs touch and no H2 line sits under the strip at landing.
- **Linked:** F-038, F-041, F-056.

#### F-017 · P1 · A1 · A phone turned sideways gets the desktop chrome
- **From:** phone P1 (A1 part; A2's hero part is inside F-003).
- **Where:** 844x390 and other short landscape phones.
- **Seen:** `phone/p12-land-hero.jpg`: the status line is clipped above the border, the lockup prints over WHAT CAN A, and the hint, RESET and the sub sit behind the desktop strip.
- **Fix:**
  - `tokens.css`: under `@media (max-height: 500px) and (pointer: coarse)`, apply the phone tokens (`--border: 12px`, `--margin: max(16px, env(safe-area-inset-left))`, the phone `--chrome-bottom`).
  - `chrome.css`: under the same query, show `.phone-bar` and hide `.title-strip` and `.header-lines`.
- **Files:** `src/system/tokens.css`, `src/chrome/chrome.css`.
- **Verify:** R-PHONE at 844x390. Retake `phone/p12-land-hero.jpg`; the phone bar must replace the strip and nothing may be clipped by the border.
- **Linked:** F-003.

#### F-018 · P1 · A1 · The phone INDEX has no close control in view
- **From:** phone P1.
- **Seen:** `phone/p4-index-open.jpg`: eleven rows fill the screen and WATCH THE SET is cut off at the bottom edge. No CLOSE is visible; probe: CLOSE (ESC) is at y 890 in an 844 px viewport.
- **Fix:**
  - `SheetIndex.tsx`: add an `.index-head` row inside the panel, holding the title and a 44×44 `CLOSE` button at top right, where INDEX sits. Make it the dialog's first focusable control.
  - `chrome.css`, at ≤767 px: `.index-head { position: sticky; top: 0; z-index: 1; display: flex; justify-content: space-between; align-items: center; background: var(--slab-black); }`.
  - Keep the bottom `CLOSE (ESC)` for desktop.
- **Files:** `src/chrome/SheetIndex.tsx`, `src/chrome/chrome.css`.
- **Verify:** R-PHONE at 390x844. Retake `phone/p4-index-open.jpg`; CLOSE must be visible at top right.

#### F-019 · P1 · A1 · The MOTION control is a 13×15 px target with no pressed state
- **From:** phone P1, a11y-perf P1.
- **Seen:** `title-sheet-open-390.jpg`: the MOTION row shows only a small plain "ON". Probe: the button measures 13×15 px on phone and 34×15 px on desktop.
- **Problem:** this is the WCAG 2.2.2 pause mechanism. Brief §3.1 asks for "a button with `aria-pressed`"; `MotionToggle.tsx:14` deliberately omits it.
- **Fix:**
  - `MotionToggle.tsx`: give it the stable accessible name "Motion" and `aria-pressed={motion}`. Keep the visible ON/OFF as `aria-hidden` text.
  - `chrome.css`: `.ts-cell:has(.motion-toggle) { position: relative; min-height: 44px; }` and `.ts-cell .motion-toggle::after { content: ''; position: absolute; inset: 0; }`. Extend the existing `.strip-motion` `::after` rule (`chrome.css:252`) so the whole 55 px strip cell is the target.
  - Touch `PhoneBar.tsx` or `TitleStrip.tsx` only if the markup needs a wrapper.
- **Files:** `src/chrome/MotionToggle.tsx`, `src/chrome/chrome.css`, and possibly `src/chrome/PhoneBar.tsx` and `src/chrome/TitleStrip.tsx`.
- **Verify:** R-PHONE: retake `title-sheet-open-390.jpg`. Probe: the target is ≥44 px tall, and the accessibility tree shows `button "Motion"` with a pressed state.

#### F-020 · P1 · A1 · THE SET has no captions and no transcript, and its label is the poster alt
- **From:** a11y-perf P1, truth P2.
- **Evidence (code):**
  - `Lightbox.tsx:32` reads `entry.meta`, but the manifest's `the-set-169` entry has `captions` and `transcript` and no `meta`. So no `<track>` is rendered.
  - The video's `aria-label` is `THE_SET.posterAlt`.
- **Fix:**
  - `Lightbox.tsx`: `const vtt = entry.captions ?? null;` then render `<track kind="captions" srcLang="en" label="English" default src={vtt}/>`.
  - Under the video, add `<details><summary>Transcript</summary>…</details>` that fetches `entry.transcript` when opened.
  - `copy/chrome.ts`: add `THE_SET.videoLabel` = "The Set, a 30-second concept film: the drawing set from the cover to the general notes, with AI-generated concept footage of robot 07, a concept design, on all five challenges." Use it as the video's `aria-label`; `posterAlt` stays on the poster only.
- **Files:** `src/chrome/Lightbox.tsx`, `src/content/copy/chrome.ts`.
- **Verify:** open the lightbox (R-A11Y). The video must have a captions track, the transcript must open, and axe must report no `video-caption` issue.
- **Linked:** F-053.

#### F-021 · P1 · A1 · The phone bar stays up over the keyboard
- **From:** phone P1 (A1 part; A6's part is F-054).
- **Seen:** `phone/p5-kbd-rfi-platform.jpg`, a 390x470 keyboard viewport: the phone bar still sits at the bottom, so chrome takes about 166 of the 470 px.
- **Fix:** in `chrome.css`, add `html:has(:is(input:not([type=checkbox]):not([type=radio]), textarea):focus) .phone-bar { display: none; }`, with the matching `.sheet-border` bottom inset.
- **Files:** `src/chrome/chrome.css`.
- **Verify:** R-PHONE at 390x470. Retake `phone/p5-kbd-rfi-platform.jpg`; no phone bar while a field has focus.
- **Linked:** F-054.

#### F-059 · P2 · A1 · The title strip is see-through
- **From:** art P2.
- **Seen:**
  - `art/1280-a-101-land.jpg`: STABLE FINISH ghosts through the strip.
  - `art/1440-a-104-050vh.jpg`: the spec lines ghost through it.
  - `art/prod-1440-a-900-240vh.jpg`: the contact row ghosts through it.
- **Fix:** `chrome.css:126` `.title-strip { background: var(--slab-black); }` (opaque).
- **Files:** `src/chrome/chrome.css`.
- **Verify:** R-DEV retakes of those three frames show no text through the strip.

#### F-060 · P2 · A1 · The spine strikes the type and doubles the phone border
- **From:** art P2, phone P2, motion P2 (A1 part; A3's part is F-078).
- **Seen:**
  - `art/1440-a-104-land.jpg`: the blue spine at x≈72 runs through the first glyph of the sheet tag and down the left edge of the H2.
  - `phone/crops/spine-left.png`: two vertical lines a few px apart at the left edge.
- **Fix:** in `base.css:261-273`, for `.set-body::before` and `.spine-line`:
  - Set `left: calc(var(--margin) - 12px); z-index: 0;`.
  - At `@media (max-width: 767px)`, set `display: none`.
- **Files:** `src/system/base.css`.
- **Verify:** R-DEV retake of `art/1440-a-104-land.jpg` shows the spine clear of the tag. R-PHONE retake of `stage-a-101-070vh-390.jpg` shows a single left edge.
- **Linked:** F-078.

#### F-061 · P2 · A1 · Disclosure keywords break at their hyphen
- **From:** truth P2, art P2 (A1 part; A3's thumbnail part is F-077).
- **Seen:**
  - `extra-stage-a-103-minus025vh-1440.jpg`: the PLAN 03 caption breaks as "AI-" / "GENERATED".
  - `art/1440-a-102-090vh.jpg`: PLAN 02 breaks the same way.
  - `hero-390-t3.6s.jpg`: "…CONCEPT FILM · AI-" / "GENERATED. THIS HASN'T HAPPENED YET."
- **Fix:**
  - `LabelText.tsx`: wrap the tokens `AI-GENERATED`, `NOT A VENUE PLAN` and `NOT SPONSOR PRODUCTS` in `<span class="nowrap">`. `textContent` stays identical, so the copy lint is unaffected.
  - `chrome.css`: `.nowrap { white-space: nowrap; }`.
- **Files:** `src/chrome/LabelText.tsx`, `src/chrome/chrome.css`.
- **Verify:** retake those three frames (R-DEV and R-HERO). No "AI-" may end a line.

#### F-062 · P2 · A1 · The current-sheet marker in INDEX pushes its row's number out of the column
- **From:** art P2.
- **Seen:**
  - `index-open-1440.jpg`: the orange square pushes "A-103" right of the other sheet numbers.
  - `phone/p4-index-open.jpg`: the same happens to "A-301".
- **Fix:** in `SheetIndex.tsx` and `chrome.css`, give every row a fixed 12 px marker gutter (a `::before` with `visibility: hidden` unless the row is current).
- **Files:** `src/chrome/SheetIndex.tsx`, `src/chrome/chrome.css`.
- **Verify:** retake `index-open-1440.jpg` and `phone/p4-index-open.jpg`. All sheet numbers must share one x.

#### F-063 · P2 · A1 · The phone status cell clips the sheet number at 360 and 320 px
- **From:** phone P2.
- **Seen:** `phone/p9-hero-320.jpg`: the bar reads "PLANNED · NYC · 2027 ·" and the sheet number is cut off.
- **Fix:**
  - `chrome.css`, at ≤380 px: `.phone-status { letter-spacing: .02em; padding: 0 10px; }` and `.phone-cta { padding: 0 10px; }`.
  - At ≤340 px: hide "PLANNED · " visually but keep it in the accessible name.
  - `PhoneBar.tsx`: add an `aria-hidden` ▴ after the sheet number, to show the cell opens the title block.
- **Files:** `src/chrome/chrome.css`, `src/chrome/PhoneBar.tsx`.
- **Verify:** R-PHONE at 320x568 and 360x780. Retake `phone/p9-hero-320.jpg`; probe: `scrollWidth ≤ clientWidth`.

#### F-064 · P2 · A1 · The live sheet number goes stale after a jump into a gap between sheets
- **From:** phone P2.
- **Seen:** `phone/p7-a-104-0_9.jpg`: A-104 and A-105 content is on screen while the phone bar reads `A-000`.
- **Fix:** in `sheetStore.ts`, on `scrollend` and in `onLayout`: if no `[data-sheet]` crosses the mid-line, set `current` to the last `[data-sheet]` whose top is above mid-viewport.
- **Files:** `src/system/sheetStore.ts`.
- **Verify:** R-PHONE. Retake `phone/p7-a-104-0_9.jpg`; the bar must read A-104.

#### F-065 · P2 · A1 · The header lockup shifts 22 px on first paint
- **From:** a11y-perf P2.
- **Evidence (probe):** a layout shift of 0.0000483 at 372 ms from `.header-rule` and `.header-lines` (x 247 → 225) when `big-shoulders.woff2` swaps in.
- **Fix:** in `vite.config.ts` `hrcgHtml`, preload `fonts/big-shoulders.woff2` (`as="font"`, `crossorigin`) next to the H1 preload.
- **Files:** `vite.config.ts`.
- **Verify:** re-run R-A11Y `firstview.cjs`; CLS must be 0 on desktop.

#### F-066 · P2 · A1 · There is no footer landmark
- **From:** a11y-perf P2 (A1 part; A6's part is F-100).
- **Problem:** the title-block `<footer>` renders inside `<main>`, so the page exposes no `contentinfo` landmark.
- **Fix:** in `App.tsx`, render the A-900 `FooterBlock` (imported from `conversion/A900Parts`) as a sibling after `</main>`.
- **Files:** `src/App.tsx`.
- **Verify:** R-A11Y `ax.cjs`. The accessibility tree must contain one `contentinfo`.
- **Linked:** F-100.

#### F-067 · P2 · A1 · A slab gap splits the paper set between A-301 and A-900
- **From:** art P2 (A1 part; A6's part is F-092).
- **Seen:** `art/1440-a-301-120vh.jpg`: the A-301 paper ends at y≈700 and slab follows.
- **Problem:** `base.css:256` puts `margin-top: var(--s-11)` on every sheet, including between the two paper sheets.
- **Fix:** in `base.css`, add `.set-body > .sheet[data-ground='gypsum'] + .sheet[data-ground='gypsum'] { margin-top: 0; }`.
- **Files:** `src/system/base.css`.
- **Verify:** R-DEV retake of `art/1440-a-301-120vh.jpg`; paper must run on into A-900.
- **Linked:** F-092.

#### F-068 · P2 · A1 · Hover states stick after a tap (base and chrome)
- **From:** phone P2 (A1 part; also F-075, F-082, F-089, F-101).
- **Seen:** `a300-typed-ticks-390.jpg`: "Discuss competing →" is filled orange on a phone.
- **Fix:** in `base.css` and `chrome.css`, wrap every `:hover` rule in `@media (hover: hover) and (pointer: fine)`. Keep the `:focus-visible` twins and add `:active` for touch feedback.
- **Files:** `src/system/base.css`, `src/chrome/chrome.css`.
- **Verify:** R-PHONE. After a tap, no orange fill remains (probe: `getComputedStyle`). Retake `a300-typed-ticks-390.jpg` once F-101 also lands.

### A2 · Hero

#### F-003 · P0 · A2 · The phone hero overprints itself at the heights phones actually leave
- **From:** phone P0, phone P1 (landscape, hero part).
- **Where:**
  - 390x664 (iPhone Safari with toolbars), 375x667, 360x780, 320x568, at the armed state and at rest.
  - 844x390 landscape.
- **Seen:**
  - `phone/p11-hero-armed-390x664.jpg`: "PLANNED · NEW YORK CITY · 2027" prints through the COURSE mark, HRCG and INDEX.
  - `phone/p11-hero-rest-390x664.jpg`: the three-line 3D VIEW title prints over "Five construction tasks, with results you can see.", and the DRAG TO LOOK line sits half under the phone bar.
  - `phone/p9-hero-320.jpg`: the status line, view title, RESET, the sub and BUILD? all collide.
  - `phone/p12-land-hero.jpg`: the status line is clipped and the lockup sits over WHAT CAN A.
- **Problem:** the status line, sub, hint and RESET are placed as fractions of the 9:16 frame (`cover.css:301-310` and `cover.css:720-760`). The header (60 px) and phone bar (56 px) are fixed in px, and the view title is anchored to the viewport. Every viewport shorter than about 0.9 × the frame height collides, and QA only tests 390x844.
- **Fix:** in `cover.css`, inside `@media (max-aspect-ratio: 4/5)`:
  1. `.cv-status { top: max(10.5%, calc((var(--fh) - 100cqh) / 2 + var(--border) + var(--header-h) + 12px)); }`.
  2. Replace the separate absolute positions of `.cv-sub`, `.cv-restrow .cv-hint` and `.cv-reset` with one flex-column stack anchored at `bottom: calc((var(--fh) - 100cqh) / 2 + var(--chrome-bottom) + 12px)`, in the order: sub, hint/reset row, view title. Either move the visible `.cv-vt` into the stack, or have `controller.ts` measure it with a ResizeObserver into `--vt-h` and offset the stack by that.
  3. When `100cqh − 116px < 0.8 × var(--fh)`, `controller.ts` sets `data-layout="window"`, which switches to the brief §2.5 fallback (a 4:5 window on top, with the H1 and copy on the slab below).
  4. Use the same bottom stack under `(max-height: 500px) and (pointer: coarse)` (pairs with F-017).
- **Files:** `src/hero/cover.css`, `src/hero/controller.ts`.
- **Verify:** R-PHONE at 390x664, 375x667, 360x780, 320x568 and 844x390. Retake `phone/p11-hero-armed-390x664.jpg`, `phone/p11-hero-rest-390x664.jpg`, `phone/p9-hero-320.jpg` and `phone/p12-land-hero.jpg`. Pass when the boxes of `.cv-status`, the H1 lines, `.cv-sub`, `.cv-hint`, `.cv-reset`, the visible `.cv-vt`, `.sheet-header` and `.phone-bar` do not intersect (F-053 automates the check).
- **Linked:** F-017, F-053.

#### F-004 · P0 · A2 · The 3D VIEW rest pose tears on desktop and stair-steps on phone
- **From:** art P0, juror P0, motion P1.
- **Where:** A-000 from the swing (about 5.5 s) through idle, at 1440x900, 1280x800 and 390x844.
- **Seen:**
  - `hero-1440-t8.0s.jpg`: spiky streaks fan off 07's right shoulder and back toward the upper right, and the tape measure at left is smeared sideways.
  - `art/crop-hero-rest-shoulder.png`: the same streaks, close up.
  - `juror/hero390-t12.jpg`: jagged fringes run along both shoulder pads, the forearms and the right knee.
- **Problem:** idle visitors stay on exactly this frame, and the brief's cut C14 removed torn sheets. `freezeMaterial.ts:28-29` discards only when `fwidth(vZ)/vZ·uK > 0.06`.
  - That test is per pixel, so its result changes with render size and DPR, and stretched triangles survive at 1440.
  - On the 144×256 phone mesh it discards whole cells, which is what makes the stair-steps.
- **Fix:**
  1. `FreezeScene.ts` `buildMesh`: bake a per-vertex attribute `aEdge = max(|z_i − z_n|) / z_i` over the four neighbours.
  2. `freezeMaterial.ts`: compute `float a = 1.0 - smoothstep(0.04, 0.08, vEdge * uK); if (a < 0.01) discard;` and output alpha `a` over the background plate already behind the mesh.
  3. Draw 07 as a foreground layer whose alpha comes from the shipped `hero-matte-169/916.webp` (a second texture sampled at `vUv`), so the silhouette keeps the matte's clean edge at every yaw.
  4. Use A5's dilated depth (F-008).
  5. Fallback only if the nine limit-pose PNGs still smear: in `heroLayout.ts` `POSE`, rest yaw 8° → 5° (desktop) and 6° → 4° (phone). That is a §2.3 override.
- **Files:** `src/hero/freezeMaterial.ts`, `src/hero/FreezeScene.ts`, and `src/hero/heroLayout.ts` (fallback only).
- **Verify:**
  - Retake `hero-1440-t8.0s.jpg` (R-HERO hero, `--times 4.6,8` at 1440x900), the same crop as `art/crop-hero-rest-shoulder.png`, and `juror/hero390-t12.jpg` (`$S/juror-shots.cjs`).
  - Re-run the nine limit-pose PNGs.
  - Pass when no streak or step extends more than 2 px past 07's silhouette.
- **Linked:** F-008.

#### F-005 · P0 · A2 · The plan cut is broken on phone and double-exposed on desktop
- **From:** motion P0, motion P1 (×2, A2 parts), motion P2, art P1, juror P2, phone P2.
- **Where:** cover to plan, P 0.10–0.75, at 1440x900, 1280x800 and 390x844.
- **Seen:**
  - `plan-1440-t0.6s.jpg`: a band about 230 px wide at left still shows the dimmed hero (W/HU ghost, tape measure, sub) behind a hard vertical edge.
  - `plan-1440-t1.8s.jpg`: the shrinking square overlaps bays 04–05, the lower half is empty, and the `PLAN 05` title is still at the bottom while `PLAN VIEWS 01–05` is also on screen.
  - `plan-390-t0.6s.jpg`: the plan square fills the lower half, with its top edge across 07's waist and the hero ghost (07, H1, sub fragments) above it.
  - `plan-390-t1.2s.jpg`: five empty black boxes at the top and the plan square at the bottom, with nothing in between.
  - `plan-390-t1.8s.jpg`: bays 01–04 are filled, slot 05 is empty, and the square floats mid-right over an empty screen.
  - `motion/glout-seq.png`: frames 3–4 double-expose 07 and the plan, with a ghosted H1, sub, hint and RESET over it.
- **Fix:** in `controller.ts` `applyP`, `heroLayout.ts` `BEATS` and `cover.css`:
  1. `BEATS`: `planCut: [0.10, 0.30]`, `pullOut: [0.30, 0.75]` (ease the pull-out with `settleEase`), `arenaIn: [0.32, 0.60]`, `printAt: 0.55`; `land` stays 0.75.
  2. `--a0-o` (status line, H1, sub, hint, RESET) = `1 − segment(P, 0, 0.10)`.
  3. Hero media opacity = `1 − segment(P, 0.10, 0.25)`.
  4. `planSq` opacity = `drawEase(segment(P, 0.12, 0.28))`, replacing `settleEase(cut)`.
  5. Add a full-frame slab backdrop, `.cv-plan::before { content: ''; position: absolute; inset: 0; background: var(--slab-black); opacity: var(--plan-o); }`, with `--plan-o` set next to `planSq`'s opacity. No hero band can show beside the registered square.
  6. `--a100-o = segment(P, 0.32, 0.38)`: the row appears only once the pull-out has started.
  7. Portrait (9:16): do not scale the plan to the 168 px deposit. Cover-fit `plan-b44-260` to the frame and FLIP the deposit onto b44's line (`lineEndpoints`) over P 0.10–0.22.
  8. Fade the plan-cut deposit (`planDep`) out as `planSq` opacity passes 0.6. Update `FRESH_FALLBACK` in `PlanCut.ts` to A5's corrected endpoints (F-051).
  9. Switch `.cv-plan .cv-vt` to none at the moment `land()` swaps the still for the slot.
- **Files:** `src/hero/controller.ts`, `src/hero/heroLayout.ts`, `src/hero/cover.css`, `src/hero/PlanCut.ts`.
- **Verify:** R-HERO cover-plan at 1440x900 and 390x844, `--times 0.45,0.6,0.75,1.2,1.35,1.8,2.4`. Retake `plan-1440-t0.6s.jpg`, `plan-1440-t1.8s.jpg`, `plan-390-t0.6s.jpg`, `plan-390-t1.2s.jpg`, `plan-390-t1.8s.jpg` and `motion/glout-seq.png`. Pass when:
  - no frame shows hero type over the plan,
  - no hero band shows beside the plan,
  - only one view title is on screen,
  - the H2 and list are on screen from P 0.55.
- **Linked:** F-037, F-051.

#### F-006 · P0 · A2 · First view: the hero film is requested twice, and the A-100 videos need a release point
- **From:** a11y-perf P0 (A2 part).
- **Evidence (probe):** `hero-snap-169.av1.mp4` is fetched twice in full (181 kB each, `bytes=0-`), because `setupLive` calls `film.load()` on a film that is already loading.
- **Fix:**
  - `controller.ts` `setupLive`: skip `film.load()` when `film.networkState === HTMLMediaElement.NETWORK_LOADING`.
  - Call `videoManager.release('a100')` once P ≥ 0.25, so the A-100 posters and videos load in time for the row at 0.32 (F-005).
- **Files:** `src/hero/controller.ts`.
- **Verify:** R-A11Y `firstview.cjs`. The snap film must be requested once, and no A-100 media may load before scroll.
- **Linked:** F-002, F-005.

#### F-022 · P1 · A2 · The FAR bite removes whole letters (the D on desktop, "OI" under the head on phone)
- **From:** art P1, truth P1, motion P1, juror P1, phone P2 (A2 part; A5's gate is F-046).
- **Seen:**
  - `hero-1440-t8.0s.jpg`: the headline reads "WHAT CAN A / HUMANOI". The shoulder pad covers the D and the right side of the last A.
  - `juror/hero390-t12.jpg`: 07's head covers "OI" and part of the D in HUMANOID.
- **Fix:**
  - `heroLayout.ts` `TYPE_LAYOUT['169'].farLeft`: 0.135 → 0.105 (inside A5's ±0.03 of 0.12).
  - `TYPE_LAYOUT['916']`: `farCapTop` 0.15 → 0.13 and `size` 0.075 → 0.070, which keeps clear of the status line.
  - Mirror both in `cover.css` (`--far-left`, `--far-top`, size).
  - If the head still covers more than 40% of any glyph on phone, drop FAR occlusion on phones (brief §2.5 allows this).
- **Files:** `src/hero/heroLayout.ts`, `src/hero/cover.css`.
- **Verify:** R-HERO at 1440x900, 1280x800 and 390x844, t 4.6 and 8. Retake `hero-1440-t8.0s.jpg` and `juror/hero390-t12.jpg`. Every HUMANOID glyph must be at least 60% visible, and the bite must fall on the shoulder.
- **Linked:** F-046.

#### F-023 · P1 · A2 · The H1 leaves the accessibility tree after the plan cut
- **From:** a11y-perf P1.
- **Evidence (code):** `controller.ts:1379` sets `this.hero.style.visibility = 'hidden'` from the end of the plan cut. Probe: axe reports `page-has-heading-one` at A-105 and A-300.
- **Fix:** remove the `visibility` write. From that point, give the hero media layer `opacity: 0; pointer-events: none; content-visibility: auto`, and keep `.cv-type` in the tree. Check that `.cv-linebtn`, `.cv-reset` and `.cv-gl` are `display: none` or `tabIndex = -1` at that point.
- **Files:** `src/hero/controller.ts`, `src/hero/cover.css`.
- **Verify:** R-A11Y `ax.cjs` at A-105 and A-300 reports no `page-has-heading-one`. `walk.cjs` shows an unchanged Tab order.

#### F-024 · P1 · A2 · The 3D view shows no focus ring
- **From:** a11y-perf P1.
- **Seen:** `a11y-perf/walk-desktop-tab8.jpg`: the 3D view has focus at Tab stop 8, but no ring is visible anywhere. Probe: the outline is drawn at x −66/1506 and y 882, which is off-screen or under the strip.
- **Fix:**
  - `cover.css`: `.cv-media:has(.cv-gl:focus-visible)::after { content: ''; position: absolute; inset: var(--vis-inset, 0); outline: 2px solid var(--chalk-blue); outline-offset: -2px; pointer-events: none; }`.
  - `controller.ts`: write `--vis-inset` (from the header bottom to the strip top, inside the side borders) on every layout.
- **Files:** `src/hero/cover.css`, `src/hero/controller.ts`.
- **Verify:** R-A11Y `walk.cjs`. Retake `a11y-perf/walk-desktop-tab8.jpg`; a chalk-blue frame must show inside the chrome.

#### F-025 · P1 · A2 · Hero text fails AA over the footage
- **From:** a11y-perf P1 (phone status line), a11y-perf P2 (desktop sub during the film beat).
- **Seen:**
  - `a11y-perf/ctr-phone-9000-status.png`: "CITY · 2027" sits over the bright work-light hotspot.
  - `juror/hero390-t12.jpg`: "CITY" is washed out under the lamp.
- **Evidence (probe):** at the phone status line, p10 contrast is 1.69:1. The desktop sub at t 3.9 s has a minimum of 2.31:1.
- **Fix:** in `cover.css`, give `.cv-status` and `.cv-sub` `text-shadow: 0 0 6px rgba(11,11,10,.9), 0 0 2px rgba(11,11,10,.9);` on all tiers. Do not move the phone status line down: F-022 brings FAR up toward it.
- **Files:** `src/hero/cover.css`.
- **Verify:** R-A11Y `contrast.cjs` at t 1.6, 3.9 and 9 s on desktop and phone: at least 90% of glyph pixels at ≥4.5:1. Retake `a11y-perf/ctr-phone-9000-status.png`.
- **Linked:** F-053.

#### F-026 · P1 · A2 · "ACT" darkens during the DOM-to-GL handover
- **From:** motion P1.
- **Seen:** `motion/zz-near.png` (t 4.42 / 4.46 / 4.50): in the second and third frames, "ACT" is darker and duller orange than "UAL".
- **Problem:** `.cv-matte` (07's cut-out) sits above the GL canvas at opacity `1 − typeIn` and covers the GL NEAR planes, while the DOM NEAR text is fading.
- **Fix:** in `controller.ts` `layout()`:
  - Set `this.matte.style.clipPath = inset(…)` from the `.cv-far` line boxes plus 20 px, so the matte never covers NEAR.
  - Hand NEAR over instantly: `--h1-dom-near = glIn >= 1 ? 0 : 1`.
  - Keep the 120 ms crossfade for FAR only (`cover.css:386-391`).
- **Files:** `src/hero/controller.ts`, `src/hero/cover.css`.
- **Verify:** R-HERO at 1440x900, `--times 4.42,4.46,4.50`. Retake `motion/zz-near.png`; ACT and UALLY must be the same orange in all three frames.

#### F-027 · P1 · A2 · A fast scroll from the rest pose pops the scene
- **From:** motion P1.
- **Seen:** `motion/glout-seq.png`: the second frame shows the rotated scene with the flat type ghosting over it, and the next frames crossfade straight into the plan.
- **Fix:** in `controller.ts:1408`, require the rig to be home before the hand-over: `&& Math.abs(this.rig.pose.yaw) < 0.15 && Math.abs(this.rig.pose.pitch) < 0.15`.
  - While P ≥ 0.10 and the rig is not home, step it with λ = 14 (add `OrbitRig.step(dt, lambda?)`).
  - Hold the plan crossfade at `cut = 0` until GL-out completes.
- **Files:** `src/hero/controller.ts`, `src/hero/orbitRig.ts`.
- **Verify:** `$S/motionrev/glout.cjs` (a jump to P 0.13 from rest). Retake `motion/glout-seq.png`; the +30 ms frame must show yaw ≈0 or the DOM still.

#### F-028 · P1 · A2 · At 1280 the sub sits on the view title, and the hero labels miss the spine
- **From:** art P1.
- **Seen:** `art/crop-1280-hero-sub-vt.png`: the descenders of "with results you can see." touch the 3D VIEW title line beneath it.
- **Fix:** in `cover.css` (desktop rules):
  - `.cv-sub { top: auto; bottom: calc(var(--chrome-bottom) + 12px + 15px + 24px); }` leaves a 24 px gap above the view title.
  - `.cv-sub, .cv-hint, .cv-status { left: max(var(--margin), 9%); }`.
  - `.cv-vt { left: max(var(--margin), 9%); right: max(var(--margin), 8%); }`, as `.cv-plan .cv-vt` already does.
- **Files:** `src/hero/cover.css`.
- **Verify:** `$S/artrev/hero.cjs` at 1280x800 and 1440x900. Retake the crop as `art/crop-1280-hero-sub-vt.png` and also `hero-1440-t8.0s.jpg`. There must be a clear gap, and the labels must start at the 72 px spine.

#### F-029 · P1 · A2 · A sideways drag on the phone pushes the H1 out of the frame
- **From:** phone P1.
- **Seen:** `phone/p2-hero-lookdrag.jpg`: after the swipe, the left sheet border cuts the W of WHAT and the H of HUMANOID, and the right edge cuts the ? of BUILD?.
- **Fix:**
  - `heroLayout.ts` `POSE.phone.yawMin`: −6 → −1 (`yawMax` stays 6).
  - `orbitRig.ts` `drag`: use `k = 10 / width` when the orientation is `'916'` (today it is 22° per full width).
- **Files:** `src/hero/heroLayout.ts`, `src/hero/orbitRig.ts`.
- **Verify:** R-PHONE at 390x844, 200 px swipes left and right at rest. Retake `phone/p2-hero-lookdrag.jpg`; all H1 glyphs must stay inside the border.

#### F-030 · P1 · A2 · Bay 05 lands as an empty black box, and the slot video has no poster (QA no-JS failure)
- **From:** motion P1, a11y-perf P2, juror P2, the QA nojs suite.
- **Seen:** `motion/land-seq.png`: at +120 ms the bay-05 slot under bubble 05 is an empty black box; at +400 ms it shows video.
- **Fix:**
  - `controller.ts` `land()` (L1436): keep `planSq` visible until `slot5` has a frame at 2.6 s (await `seeked` or `requestVideoFrameCallback`), then swap the two opacities.
  - `CoverStage.tsx:267`: add `poster={media['plan-b44'].poster}` and `className="cv-slot5 js-only"`. The `.no-js .js-only` rule already exists.
- **Files:** `src/hero/controller.ts`, `src/hero/CoverStage.tsx`.
- **Verify:** `$S/motionrev/land.cjs`. Retake `motion/land-seq.png`; no black frame. The QA nojs suite must pass `nojs-video`.

#### F-031 · P1 · A2 · The RESET label does not contain its visible text
- **From:** a11y-perf P1 (A2 part of the label-in-name finding; see also F-035 and F-044).
- **Fix:** in `copy/hero.ts:31`, change `resetLabel` from 'Reset the chalk line' to 'Reset the line', or drop the `aria-label`.
- **Files:** `src/content/copy/hero.ts`.
- **Verify:** R-A11Y axe at hero rest shows no `label-content-name-mismatch` on `.cv-reset`.

#### F-069 · P2 · A2 · The LCP image is lazy on the reduced-motion and no-JS paths
- **From:** a11y-perf P2.
- **Evidence (probe):** under reduced motion, the LCP is the lazy `hero-matte-169.webp` at 632 ms.
- **Fix:** in `CoverStage.tsx`, give the hero-still and hero-matte `FramePicture`s `loading="eager"`, and give the still `fetchpriority="high"` on every tier (see X-5).
- **Files:** `src/hero/CoverStage.tsx`.
- **Verify:** re-run `firstview.cjs` under reduced motion. The LCP element must not be lazy, and Lighthouse must not flag a lazy LCP.

#### F-070 · P2 · A2 · The line's shadow becomes a wedge during the pay-out
- **From:** motion P2.
- **Seen:**
  - `hero-1440-t0.8s.jpg`: a dark wedge sits under the straight blue line and widens toward its left end.
  - `hero-1440-t0.0s.jpg`: a stray dark tick near x≈1350, y≈685.
- **Fix:** in `controller.ts` `shadowPath()`:
  - Use only the perpendicular deviation, `dev = |(p − rest) · perp|`, from `this.string.axes`.
  - During the pay-out, measure `rest` against the current chord: `rest = R + (L − R)·u·k`.
  - Hide the string and its shadow until u > 0.02.
- **Files:** `src/hero/controller.ts`.
- **Verify:** R-HERO `--times 0,0.8`. Retake both frames; no wedge and no tick.

#### F-071 · P2 · A2 · The pull draws the string through the hint
- **From:** motion P2.
- **Seen:** `hero-1440-t2.4s.jpg`: the V of the pulled line crosses "PULL THE LINE. LET GO." and "or press Space".
- **Fix:**
  - `cover.css`: `[data-line='armed'][data-pull] .cv-hint { opacity: .25; }`. `controller.ts` sets `data-pull` on pointer-down.
  - Phone: clamp the deflection to `sub.top − line.y − 8`.
- **Files:** `src/hero/cover.css`, `src/hero/controller.ts`.
- **Verify:** R-HERO `--times 2.4` at 1440 and 390. Retake `hero-1440-t2.4s.jpg`; the hint is dimmed under the V.

#### F-072 · P2 · A2 · The powder puff hazes BUILD?
- **From:** motion P2.
- **Seen:** `motion/zoom-32-build.png`: a blue haze lies over the lower third of BUILD?.
- **Fix:** in `CoverStage.tsx`, move `<canvas className="cv-puff">` into `.cv-type` between `.cv-matte` (z 2) and `.cv-near` (z 3).
- **Files:** `src/hero/CoverStage.tsx`, `src/hero/cover.css`.
- **Verify:** R-HERO `--times 3.2`, then crop as before. Retake `motion/zoom-32-build.png`; BUILD? must be clean orange.

#### F-073 · P2 · A2 · The deposit lingers over the rising film
- **From:** motion P2.
- **Seen:** `hero-1440-t3.6s.jpg`: the horizontal deposit and its ✕ marks are still visible across the filmed line, which runs toward the lens.
- **Fix:**
  - `controller.ts` `render()`: fade the deposit and marks over S+0.15 → S+0.5, using a new `TIMING.depositOut = 0.5` in `heroLayout.ts`.
  - The puff stays on `TIMING.dustOut`.
- **Files:** `src/hero/controller.ts`, `src/hero/heroLayout.ts`.
- **Verify:** R-HERO `--times 3.6`. Retake `hero-1440-t3.6s.jpg`; no deposit is visible.

#### F-074 · P2 · A2 · On the passive path the snap releases at about 3.5 s, not 3.0 s
- **From:** motion P2.
- **Evidence (code):** `controller.ts:661` starts the ghost pull at `autoSnapAt`. The pull (0.42 s) and hold (0.08 s) then push the release back, and the rest UI arrives at about 7.6 s against the brief's ≤6.5 s.
- **Fix:**
  - Start the ghost pull at `autoSnapAt − (TIMING.ghostPull + TIMING.ghostHold)`, so the release lands at `max(3.0, payEnd + 1.2)` s.
  - Set `tl.rest` when the camera reaches the pose (|Δ| < 0.05°), not at `swingStart + swing + 0.6`.
- **Files:** `src/hero/controller.ts`.
- **Verify:** a real-time run with `$S/artrev/hero.cjs`, logging the release time. Pass when the release is at 3.0 ± 0.1 s and the rest UI appears by 6.5 s.

#### F-075 · P2 · A2 · Hover states stick after a tap (cover.css)
- **From:** phone P2.
- **Fix:** wrap the `:hover` rules in `cover.css` in `@media (hover: hover) and (pointer: fine)`, as in F-068.
- **Files:** `src/hero/cover.css`.
- **Verify:** R-PHONE: after tapping RESET, no hover fill remains.

### A3 · Marks, bays, A-100 to A-103

#### F-007 · P0 · A3 · A jump to A-103 at 1440 lands with the iris already open
- **From:** art P0, a11y-perf P1 (INDEX → A-103), motion P1 (in part).
- **Seen:**
  - `art/1440-a-103-land.jpg`: the film frame's curved left edge cuts the H2 to "BOLTE / ASSEM", and slivers of "03" and of the PLAN 03 thumbnail show at the right edge.
  - `extra-stage-a-103-minus025vh-1440.jpg`: the intact composition exists only earlier in the scroll (tag, full H2, detail circle, "03", PLAN 03).
- **Problem:** `PerspectiveStage.tsx:148-154` centres the iris on the chrome band. At 1440x900 that starts the pin before the sheet top reaches `scroll-padding-top`, so an INDEX or strip landing arrives at e≈0.7.
- **Fix:**
  - `PerspectiveStage.tsx`: `geo.startY = Math.max(trackTop + K, sheetTop − padTop + 0.2 * vh)`. That holds the composed detail for 20vh after any landing.
  - `A103Bolt.tsx`: set `data-land="0"` on `#a-103` (used by F-015).
  - Assert e = 0 at landing for the A-101 slide too.
- **Files:** `src/sheets/PerspectiveStage.tsx`, `src/sheets/A103Bolt.tsx`.
- **Verify:** R-DEV at 1440 and 1280, plan `[["a-103",["land",15,60]]]`. Retake `art/1440-a-103-land.jpg`. At landing, the full BOLTED ASSEMBLY, the circle, "03" and PLAN 03 must be on screen, as in `extra-stage-a-103-minus025vh-1440.jpg`.
- **Linked:** F-015, F-032.

#### F-032 · P1 · A3 · Perspective entrances cover the caption, leave fragments behind, and pop the iris
- **From:** motion P1 (A-101 slide), motion P1 (A-103 iris), art P1 (entrance leftovers).
- **Seen:**
  - `motion/a101-25-caption.png`: the film's top edge runs directly under the "PLAN 01 · CONCEPT FILM · AI-GENERATED" text and covers its rule.
  - `a11y-perf/vm-a101-40vh.jpg`: a dimmed strip of the plan and "BRICK–" remains above the film band.
  - `motion/a103-iris-grid.png`: at −12vh, 07's orange shoulder is double-exposed inside the wrench close-up. By −7vh the iris is already near full and cuts the H2.
- **Fix:** in `PerspectiveStage.tsx` and `pstage.css`:
  1. Make the emergence line the caption's bottom, not the image's. In `measure()`, read the plan ViewTitle rect (`capBottom`) and use it for `I.y`, `M.y` (= `capBottom + 24`) and the hidden position (= `capBottom − ry`).
  2. Bring the comp's opacity (tag, H2, spec, numeral, thumbnail, plan) to exactly 0 by e = 0.35, and make the slab mattes above and below the view fully opaque during the hold.
  3. Iris radius: `r = sqrt(r0² + (R² − r0²) · drawEase(segment(e, 0.1, 1)))`, which opens by area, not SETTLE on the radius. Start the detail-to-c32 dissolve only after the circle has grown 30%, and swap the DETAIL 3 caption for PERSPECTIVE 03-A at that moment. Use `drawEase` for both phases of the slide too.
- **Files:** `src/sheets/PerspectiveStage.tsx`, `src/marks/sheets/pstage.css`.
- **Verify:** R-DEV at 1440, plan `[["a-101",[20,25,40]],["a-103",[-22,-17,-12,-7,0]]]`. Retake `motion/a101-25-caption.png`, `a11y-perf/vm-a101-40vh.jpg` and `motion/a103-iris-grid.png`. Pass when:
  - the caption rule is never covered,
  - no grey fragments show,
  - the circle grows evenly,
  - no 07 appears inside the detail circle early.
- **Linked:** F-007.

#### F-033 · P1 · A3 · The A-103 hold drifts up into the header before the pin releases
- **From:** art P1.
- **Seen:** `stage-a-103-060vh-1440.jpg`: the film frame's top edge sits at y≈37, under the lockup and the INDEX box.
- **Fix:** in `PerspectiveStage.tsx`, keep `F.y ≥ CHROME_TOP` until the pin releases. Compute the release scroll as the point where `F.y` would cross `CHROME_TOP`, or extend `pinVh` to cover the drift.
- **Files:** `src/sheets/PerspectiveStage.tsx`.
- **Verify:** R-DEV at 1440 and 1280, plan `[["a-103",[60]]]`. Retake `stage-a-103-060vh-1440.jpg`; the frame top must be at y ≥ 72.

#### F-034 · P1 · A3 · The 01-A view marker can't be clicked, and keyboard focus can land on it while it is covered
- **From:** a11y-perf P1.
- **Seen:** `a11y-perf/vm-a101-40vh.jpg`: the perspective film covers the area where the marker sits, but the marker stays in the Tab order. Probe: `elementFromPoint` at the marker centre returns `FIGURE.view.a101-persp` at +0 and +20vh, and a real click changes nothing.
- **Fix:**
  - `marks.css`: `.a101 .mk-vm { position: relative; z-index: 3; }`.
  - `PerspectiveStage.tsx`: set `pointer-events: none` on `.a101-persp` until its entrance progress is above 0.
  - While the view covers the marker, set the marker's `tabIndex` to −1 and `aria-hidden` (in `A101Brick.tsx`).
- **Files:** `src/marks/marks.css`, `src/sheets/PerspectiveStage.tsx`, `src/sheets/A101Brick.tsx`.
- **Verify:** `$S/a11yperf/vm.cjs`. A click at +0vh must scroll to 01-A, and Tab must skip the marker at +40/+70vh. Retake `a11y-perf/vm-a101-40vh.jpg`.
- **Linked:** F-053.

#### F-035 · P1 · A3 · The ViewMarker and DetailBubble names don't start with their visible text (QA desktop failure)
- **From:** a11y-perf P1, juror P2, `qa/RESULTS.md` failure 1.
- **Fix:**
  - `ViewMarker.tsx`: `aria-label={`${view} ${sheet}: ${label}`}`.
  - `DetailBubble.tsx` (L148): `aria-label={`${n} ${sheet} detail: ${label}`}`.
  - `copy/a100-a103.ts`: drop the "Open" and "/" prefixes from the labels.
- **Files:** `src/marks/ViewMarker.tsx`, `src/marks/DetailBubble.tsx`, `src/content/copy/a100-a103.ts`.
- **Verify:** R-A11Y axe at hero rest, A-101 and A-105. `label-content-name-mismatch` must be 0 once F-031 and F-044 also land.

#### F-036 · P1 · A3 · Detail bubbles cover the sheet on phones and open out of view from the keyboard
- **From:** phone P1, a11y-perf P2 (focus order and the hidden DETAIL title).
- **Seen:** `phone/p6-a101-bubble-open.jpg`: the opened circle, about the full content width, covers the H2 BRICKLAYING and the spec.
- **Fix:**
  - `marks.css`, at `@media (max-width: 767px)`: `.mk-detail-panel { position: static; width: 100%; margin-top: var(--s-4); }`, opening in flow and keeping the clip-path reveal.
  - `DetailBubble.tsx`: after it opens, call `scrollIntoView({ block: 'nearest' })` on the panel's caption, honouring the scroll-padding. Do this on desktop too, so a keyboard-opened DETAIL title doesn't land under the strip.
  - `A101Brick.tsx`: put the detail bubble before the 01-A marker in DOM order.
- **Files:** `src/marks/marks.css`, `src/marks/DetailBubble.tsx`, `src/sheets/A101Brick.tsx`.
- **Verify:** R-PHONE. Retake `phone/p6-a101-bubble-open.jpg`; the H2 and spec must sit above the circle and its DETAIL title above the phone bar. `walk.cjs`: the bubble comes before the marker.

#### F-037 · P1 · A3 · The A-100 tiles print as empty black boxes, and slot 05 stays empty
- **From:** motion P1 (A3 part), phone P2, juror P2.
- **Seen:**
  - `plan-390-t1.2s.jpg`: five empty black boxes.
  - `plan-390-t1.8s.jpg`: slot 05 is an empty black box.
  - `plan-1440-t1.8s.jpg`: the bay-05 slot is empty where the square has not yet reached it.
- **Fix:**
  - `arena.css`: show `arena-0104`'s poster (a `Picture` under the R2 `LoopVideo`) at `--a100-o`, fade the video in over it with `--arena-in`, and fade the tile outlines with `--arena-in`.
  - `ArenaPlan.tsx` (stage mode): slot 05 shows the `plan-b44` poster until A2's `land()` swap.
  - `A100Bays.tsx`: mark the row's LoopVideos `data-vm-group="a100"` (for F-002).
- **Files:** `src/marks/sheets/arena.css`, `src/sheets/ArenaPlan.tsx`, `src/sheets/A100Bays.tsx`.
- **Verify:** R-HERO cover-plan at 390 and 1440, `--times 1.2,1.35,1.8`. Retake `plan-390-t1.2s.jpg`, `plan-390-t1.8s.jpg` and `plan-1440-t1.8s.jpg`; no empty tile.
- **Linked:** F-002, F-005.

#### F-038 · P1 · A3 · A-101 lands with its bond course under the strip, and its H2 split as BRICK–LAYING
- **From:** art P1 (landing frames, A-101 part), truth P2 (soft hyphen).
- **Seen:**
  - `art/1280-a-101-land.jpg`: the STABLE FINISH course is half under the strip.
  - `stage-a-101-000vh-1440.jpg`: the H2 is set as "BRICK–" / "LAYING".
- **Fix:**
  - `A101Brick.tsx`: remove the U+00AD from the H2. BRICKLAYING is the client's fixed name.
  - `a101.css`: make the right column `container-type: inline-size`. Set the H2 to `font-size: min(<n>cqi, 18vh)`, with n chosen so that `scrollWidth ≤ clientWidth` at 1024, 1280, 1440 and 1920 (one line at ≥1024; it may wrap only on phones).
  - `a101.css`: plan column `min(40vw, calc(100svh − 240px))` below 1440 px wide.
- **Files:** `src/sheets/A101Brick.tsx`, `src/marks/sheets/a101.css`.
- **Verify:** R-DEV at 1280 and 1440, plan `[["a-101",["land"]]]`. Retake `art/1280-a-101-land.jpg`; the whole course must be above the strip and the H2 on one line.
- **Linked:** F-016.

#### F-076 · P2 · A3 · The A-103 hold frame sits off the grid
- **From:** art P2.
- **Seen:** `stage-a-103-060vh-1440.jpg`: the 16:9 frame spans about x 96–1343, so neither edge is on the 72 px spine or the 1368 px margin, and a sliver of spine shows beside it.
- **Fix:** in `PerspectiveStage.tsx`, align the iris rest frame left on the spine (`F.x = margin`), with a height-capped width and the right edge ≤ the content edge.
- **Files:** `src/sheets/PerspectiveStage.tsx`.
- **Verify:** R-DEV retake of `stage-a-103-060vh-1440.jpg`; the frame's left edge must be at x 72.

#### F-077 · P2 · A3 · The PLAN 03 thumbnail nicks the detail circle
- **From:** art P2 (A3 part; the hyphen break is F-061).
- **Seen:** `extra-stage-a-103-minus025vh-1440.jpg`: the thumbnail frame's left edge cuts into the circle's lower right.
- **Fix:** in `a103.css`, keep the PLAN 03 thumbnail at least 24 px clear of the circle.
- **Files:** `src/marks/sheets/a103.css`.
- **Verify:** R-DEV at 1440 and 1280, plan `[["a-103",[-25]]]`. Retake the same frame; a gap must show.

#### F-078 · P2 · A3 · The spine is drawn over perspective films
- **From:** art P2, motion P2 (A3 part).
- **Seen:** `a11y-perf/vm-a101-40vh.jpg`: a thin blue vertical line runs down the film at x≈72.
- **Fix:** in `pstage.css`, `.pstage-view { position: relative; z-index: 2; }` (the spine moves to z 0 in F-060).
- **Files:** `src/marks/sheets/pstage.css`.
- **Verify:** R-DEV retake of `a11y-perf/vm-a101-40vh.jpg`; no line across the film.
- **Linked:** F-060.

#### F-079 · P2 · A3 · The north arrows merge into the grid
- **From:** art P2 (A3 part; A4's knockout is F-088).
- **Seen:** `art/1440-a-200-100vh.jpg`: the 1811 arrow's shaft runs along an avenue line, and TRUE NORTH is drawn at the same pencil weight as the streets.
- **Fix:** in `NorthArrow.tsx`, draw both arrows in chalk at 1.5 px, with a 6 px slab-black halo (`paint-order: stroke`).
- **Files:** `src/marks/NorthArrow.tsx`.
- **Verify:** R-DEV retake of `art/1440-a-200-100vh.jpg`; both arrows must read clearly against the grid.

#### F-080 · P2 · A3 · The A-101 bond words look like buttons
- **From:** juror P2.
- **Seen:** `stage-a-101-000vh-1440.jpg`: STRAIGHT COURSES, CONSISTENT JOINTS and STABLE FINISH sit in hairline cells drawn like buttons, next to two empty half-cells.
- **Fix:** in `A101Brick.tsx` and `a101.css`, draw the bond as masonry: fill each brick with `--slab` and use a 2 px slab-black joint, with no hairline border. Fill the half-bats solid, or drop them on phones.
- **Files:** `src/sheets/A101Brick.tsx`, `src/marks/sheets/a101.css`.
- **Verify:** R-DEV retake of `stage-a-101-000vh-1440.jpg`; no empty outlined cells.

#### F-081 · P2 · A3 · The PERSPECTIVE 01-A alt describes things that aren't in the shot
- **From:** truth P2 (A3 part; the manifest alt is F-090).
- **Seen:** `truth/c30-t2.5.jpg`: 07 holds a trowel of mortar, its other hand is on a brick course between two line posts, and the background is black. No hanging lights or stringline are visible.
- **Fix:** in `copy/a100-a103.ts`, set `A101.alt.perspective` to "AI-generated concept film: robot 07 spreads mortar with a trowel and steadies a course of brick between two line posts, against a dark background."
- **Files:** `src/content/copy/a100-a103.ts`.
- **Verify:** the prerendered HTML carries the new alt, and the copy lint passes.
- **Linked:** F-090.

#### F-082 · P2 · A3 · Hover states stick after a tap (marks, arena)
- **From:** phone P2.
- **Fix:** wrap the `:hover` rules in `marks.css` and `arena.css` in `@media (hover: hover) and (pointer: fine)`.
- **Files:** `src/marks/marks.css`, `src/marks/sheets/arena.css`.
- **Verify:** R-PHONE: after tapping a bay link, no keyline is left behind.

### A4 · A-104, A-105, A-200

#### F-039 · P1 · A4 · On arrival at A-104 the H2 is hidden, the top right is empty, and the route dangles into INDEX
- **From:** art P1, juror P1 (A-104 dead zone), a11y-perf P1 (INDEX → A-104).
- **Seen:**
  - `art/1440-a-104-land.jpg`: only the top of "PIPE" clears the strip, ASSEMBLY is hidden, and the top-right quadrant is empty slab.
  - `sheet-a-104-1280.jpg`: "PIPE" shows and ASSEMBLY ghosts behind the strip.
  - `art/1440-a-104-050vh.jpg`: the route's long diagonal runs to about x 1380, into the INDEX box, and ends in nothing.
- **Fix:** in `A104Pipe.tsx` and `a4.css`:
  - Set the H2 in the empty top-right quadrant (x 760–1368, from y ≥ 120 at landing), or directly under the tag with the iso plane below it.
  - End the route at the SECURE JOINTS fitting with an end cap, inside the content edge (1368, or 1208 at 1280).
  - Pull `.a104-foot` up so the perspective and spec share the 100vh frame.
  - Set `data-land` on `#a-104` if the composed landing needs an offset.
- **Files:** `src/sheets/A104Pipe.tsx`, `src/sheets/a4/a4.css`.
- **Verify:** R-DEV at 1440 and 1280, plan `[["a-104",["land",0,50]]]`. Retake `art/1440-a-104-land.jpg`, `sheet-a-104-1280.jpg` and `art/1440-a-104-050vh.jpg`. PIPE ASSEMBLY must be fully visible at landing, and no route may pass x 1368.
- **Linked:** F-015.

#### F-040 · P1 · A4 · The blue trace highlights a pipe run that doesn't match the drawing (interim)
- **From:** truth P1, interim fix. The preferred fix is H-12.
- **Seen:** `truth/a-104-0vh-1280.jpg`: the taped drawing and its blue trace show a single offset route with elbows. The copper on the floor forms a rectangle with a tee, plus loose lengths, next to "CORRECT GEOMETRY".
- **Fix:** until b43 is regenerated (H-12), do not render `.a104-trace` or its "TASK DRAWING TRACED FROM CONCEPT FOOTAGE · DRAWING" title. Keep the beats, which are the client's spec. If the director approves H-12, skip this item.
- **Files:** `src/sheets/A104Pipe.tsx`, `src/sheets/a4/a4.css`.
- **Verify:** R-DEV at 1280, plan `[["a-104",[0]]]`. Retake `truth/a-104-0vh-1280.jpg`; no blue trace.
- **Linked:** F-083.

#### F-041 · P1 · A4 · The A-105 pinned frame never shows the H2, and its gridlines read as stubs
- **From:** art P1, motion P1, art P1 (landing frames, A-105 part).
- **Seen:**
  - `stage-a-105-030vh-1440.jpg`: the body sentence sits at right where the H2 should be, and the H2 is not on screen. Blue gridline stubs show at the margins and between the panels, and the plan and section panels have different top and bottom edges.
  - `art/1440-a-105-land.jpg`: an empty band sits under the header, while the LINES TRACED caption and the second body line are under the strip.
  - `stage-a-105-100vh-1440.jpg`: the same frame later in the pin, still without the H2.
- **Fix:** in `A105Layout.tsx` and `a4.css`, rebuild the pinned frame between the chrome:
  - Frame: top = `border + header-h`; height = `100svh − top − strip-h − border`.
  - Put the tag and a one-line H2, LAYOUT AND MARKING (about 96–120 px), on the top gridline.
  - Put plan and section below it, sharing top and bottom edges.
  - Put the spec and beats on the bottom gridline, and the body line after the pin.
  - Draw the gridlines as continuous 1 px lines from border to border, under the media.
  - Set `data-land="0"`.
- **Files:** `src/sheets/A105Layout.tsx`, `src/sheets/a4/a4.css`.
- **Verify:** R-DEV at 1440 and 1280, plan `[["a-105",["land",30,60,100]]]`. Retake `stage-a-105-030vh-1440.jpg`, `art/1440-a-105-land.jpg` and `stage-a-105-100vh-1440.jpg`. The H2 must be visible through the whole pin, nothing may sit under the strip at landing, and the panels must share edges.
- **Linked:** F-015, F-016.

#### F-042 · P1 · A4 · The A–A marker sits 54 px from the cut position it reports
- **From:** motion P1.
- **Seen:** `stage-a-105-100vh-1440.jpg`: both A markers sit on the bay's right gridline, beyond the chalk line's right ✕. Probe: at s = 1 the cut is at x 497 and the mark at 550.
- **Problem:** `.a105-cut` is a 48 px grid cell with `place-items: center`. The ~156 px SVG overflows to the right, and the mark rotates around that offset centre.
- **Fix:** in `a4.css`, take the mark out of grid flow: `.a105-cut-mark { position: absolute; left: 50%; top: 50%; translate: -50% -50%; transform: rotate(90deg); }`.
- **Files:** `src/sheets/a4/a4.css`.
- **Verify:** `$S/motionrev/probe105.cjs`: the mark centre must equal the ✕ centres at s = 0 and s = 1. Retake `stage-a-105-100vh-1440.jpg`; the markers sit on the line's ✕.

#### F-043 · P1 · A4 · A-200 spends its pin on empty screens and rushes the HOLD tag
- **From:** art P1, motion P1, juror P1, phone P1.
- **Seen:**
  - `art/montage-a200-cloud-1440.jpg`: a run of frames showing an empty cloud outline round pencil boxes, the dimmed HOLD, a fully empty slab, and an empty black framed box.
  - `stage-a-200-000vh-1440.jpg`: the poster row is centred at about x 182–1257, off A-100's grid, with the rest of the screen empty.
  - `stage-a-200-040vh-390.jpg`: on phone, an empty framed box, with the HOLD cloud at the foot.
  - `stage-a-200-120vh-1440.jpg`: the H2 only appears after the pin.
- **Fix:** in `A200Context.tsx` `apply()` and `a4.css`, re-time inside the existing 100vh pin (no length change; see X-3, X-4) with this p map:

  | p | Beat |
  |---|---|
  | 0–0.12 | Row poster, laid out with A-100's geometry (b = content/5.4, gap 0.1b, x from the spine), turns to its pencil outline. |
  | 0.12–0.20 | Outline becomes the HOLD cloud. The tag `VENUE: HOLD — Venue to be announced on this site.` is fully in by 0.20. |
  | 0.20–0.40 | The cloud holds, with its tag readable. |
  | 0.40–0.50 | Lift and FLIP to the strip's VENUE cell. The tag stays on the cloud until 0.48. |
  | 0.40–0.85 | The grid draws. The frame stroke draws with the first lines (dashoffset from 0.40) and the caption appears at 0.45, so there is never an empty box. |
  | 0.55 | H2 and body print. |
  | 0.85 | Arrows, arc and statement. |

  - At ≥1024 px, keep the two columns (H2 left, grid right) all the way down to 1024.
  - Phone:
    - Run the poster row at full content width, at A-100's tile size.
    - Don't show the grid frame until the grid draws.
    - Set the static `VENUE: HOLD` tag directly under the legend.
- **Files:** `src/sheets/A200Context.tsx`, `src/sheets/a4/a4.css`.
- **Verify:**
  - R-DEV at 1440, plan `[["a-200",[10,20,30,35,45,50,55,90,100]]]`; rebuild the montage as `art/montage-a200-cloud-1440.jpg`.
  - Retake `stage-a-200-000vh-1440.jpg` and `stage-a-200-120vh-1440.jpg`. Retake `stage-a-200-040vh-390.jpg` with R-PHONE.
  - Pass when every frame has readable text and the HOLD tag is readable over at least 15vh.

#### F-044 · P1 · A4 · The A-105 detail bubble's name doesn't start with its visible text
- **From:** a11y-perf P1 (A4 part of the label-in-name finding).
- **Fix:** in `copy/a104-a200.ts`, start the A-105 DetailBubble label with its visible text (`5 A-105 detail: …`) and drop "Open DETAIL 5 /".
- **Files:** `src/content/copy/a104-a200.ts`.
- **Verify:** axe at A-105 reports no `label-content-name-mismatch`.
- **Linked:** F-031, F-035.

#### F-083 · P2 · A4 · The A-104 caption stack is fragile, and the phone PLAY button collides with it
- **From:** truth P1 (re-scoped, see X-1), phone P2.
- **Seen:**
  - `phone/crops/a104-play.png`: the ▸ PLAY box's top edge crosses the rule of the second caption, which wraps to two lines on phones.
  - `fixlist/clean-1440-a-104-land.jpg`: the captions are correct in the clean build, but only through a negative margin plus an absolute offset.
- **Fix:**
  - `a4.css:535-544`: put both captions in one flex column (gap 8 px), positioned at `calc(var(--pt) + var(--side) * 0.9082 + 14px)`. Remove the negative `margin-top` on `.a104-plan-title`.
  - `a4.css:659-661` (phone): move `.a104-play` into normal flow after the caption stack, 44 px tall.
  - If F-040 removes the trace caption, the stack has a single row.
- **Files:** `src/sheets/a4/a4.css`, `src/sheets/A104Pipe.tsx`.
- **Verify:** R-PROD and R-DEV at 1440. Retake `art/1440-a-104-land.jpg`. With R-PHONE, recrop the PLAY area as `phone/crops/a104-play.png`. F-053 adds an intersection gate.

#### F-084 · P2 · A4 · The section-cut handle traps vertical scroll on phones
- **From:** phone P2.
- **Evidence (probe):** a 250 px upward swipe that starts on `.a105-cut` leaves `scrollY` unchanged (`a4.css:864`, `touch-action: none`).
- **Fix:**
  - `a4.css`: `.a105-cut { touch-action: pan-y; }`.
  - `A105Layout.tsx`: capture the pointer only after horizontal intent (|dx| > |dy| over the first 6 px).
- **Files:** `src/sheets/a4/a4.css`, `src/sheets/A105Layout.tsx`.
- **Verify:** R-PHONE probe: a vertical swipe on the handle scrolls the page, and a horizontal drag still moves the cut.

#### F-085 · P2 · A4 · On phones, A-105 puts its paragraph before its name and ends in a void
- **From:** phone P2, juror P1 (phone dead zone).
- **Seen:** `stage-a-105-030vh-390.jpg`: the plan, section, hint and the paragraph "Before the walls…" all come before the H2 LAYOUT AND MARKING.
- **Fix:** in `a4.css` at ≤767 px, order the `.a105-text` H2 and spec directly after the tag, put the body after the H2, and trim the sheet's bottom padding to `var(--s-8)`.
- **Files:** `src/sheets/a4/a4.css`.
- **Verify:** R-PHONE. Retake `stage-a-105-030vh-390.jpg`; the H2 must come right after the tag.

#### F-086 · P2 · A4 · The A-105 traces are drawn over 07
- **From:** motion P2.
- **Seen:** `stage-a-105-030vh-1440.jpg`: the blue vertical traces near x 500 and 545 cross 07's body in the plan film.
- **Fix:** in `A105Layout.tsx` `apply()`, dim `.a105-traces` to 0.35 opacity after p 0.3, or hold b44 on a frame before 07 reaches the lines.
- **Files:** `src/sheets/A105Layout.tsx`, `src/sheets/a4/a4.css`.
- **Verify:** R-DEV retake of `stage-a-105-030vh-1440.jpg`; 07 must not read as painted over.

#### F-087 · P2 · A4 · The section-cut slider has a weak focus cue
- **From:** a11y-perf P2.
- **Fix:** in `a4.css`, `.a105-cut:focus-visible .a105-cut-mark { outline: 2px solid var(--chalk-blue); outline-offset: 4px; }`.
- **Files:** `src/sheets/a4/a4.css`.
- **Verify:** R-A11Y `kbd.cjs`: Tab to the slider shows a chalk-blue ring.

#### F-088 · P2 · A4 · The A-200 grid runs through the arrows and the arc
- **From:** art P2 (A4 part).
- **Seen:** `art/1440-a-200-100vh.jpg`: the grid lines run straight through both arrows and the ABOUT 29° arc.
- **Fix:** in `A200Context.tsx`, knock the grid out under both arrows and the arc with a 6 px slab-black halo (`paint-order: stroke`).
- **Files:** `src/sheets/A200Context.tsx`.
- **Verify:** R-DEV retake of `art/1440-a-200-100vh.jpg`.
- **Linked:** F-079.

#### F-089 · P2 · A4 · Hover states stick after a tap (a4.css)
- **From:** phone P2.
- **Fix:** wrap the `:hover` rules in `a4.css` in `@media (hover: hover) and (pointer: fine)`.
- **Files:** `src/sheets/a4/a4.css`.
- **Verify:** R-PHONE: no hover state remains after a tap.

### A5 · Media pipeline

#### F-008 · P0 · A5 · Prepare the freeze depth so the mesh edges belong to 07
- **From:** juror P0 and art P0 (A5 part of the tearing finding).
- **Fix:** in `pipeline/freeze.py`:
  - Before meshing, min-filter the foreground depth by 2–3 px (nearer wins), which dilates 07 outward, for both 16:9 and 9:16.
  - Re-export `hero-depth-169.bin`, `hero-depth-916.bin`, `hero-meta-169.json` and `hero-meta-916.json`, and keep `hero-matte-169/916.webp` aligned to the dilated edge.
  - Feather the 9:16 near-matte by 2–3 px.
  - Regenerate the nine limit-pose PNGs, and fail any pose that stretches background texels more than 2 px past the matte.
- **Files:** `pipeline/freeze.py`, `public/media/hero/hero-depth-169.bin`, `public/media/hero/hero-depth-916.bin`, `public/media/hero/hero-meta-169.json`, `public/media/hero/hero-meta-916.json`, `public/media/hero/hero-matte-169.webp`, `public/media/hero/hero-matte-916.webp`.
- **Verify:** the limit-pose gate report passes. Then run F-004's retakes.
- **Linked:** F-004, F-046.

#### F-009 · P0 · A5 · c31 shows spectators, crops away the task, and hides the board edge behind a black blob
- **From:** truth P0, art P1, juror P1.
- **Where:** A-102 PERSPECTIVE 02-A (`el-c31`) at all sizes, and THE SET's HANG DRYWALL beat.
- **Seen:**
  - `truth/c31-t3.4-person.jpg`: a blurred skin-toned figure with raised arms behind the studs.
  - `truth/a102-site-spectator.jpg`: a warm figure shows between the studs on the live page.
  - `art/crop-1440-a102-persp.png` and `art/1440-a-102-land.jpg`: the left third is a flat black blob with a soft edge, and two robot hands stick out of it. The rest is studs and board, with small warm blobs between the studs.
  - `truth/a-102-0vh-1280.jpg`: the same frame at 1280.
- **Problem:**
  - The rule 13 / C5 check that the crowd is crushed fails, and visible spectators imply an audience at an event that hasn't happened.
  - The 4:5 crop at x ≥ 0.50 shows no robot and no task.
- **Fix:**
  - Re-crop the 4:5 frame from x≈0.42, so the board, both hands and the forearms are in frame (still head-out, per C6).
  - Re-run D4 in `pipeline/crowdcrush.py`:
    - Everything behind the stud plane goes to #0B0B0A, using the depth threshold plus a hard luminance matte for pixels between studs that are darker than the stud steel.
    - Crush only beyond the far plane, with a feather of at least 24 px on the background side, so 07's body stays dark grey with detail.
    - Re-key the head matte so it follows the silhouette.
  - Re-export `public/media/perspectives/el-c31.{av1,h264}.mp4` and `el-c31.poster.{jpg,avif}`, and update the manifest.
  - Send the new c31-45 mezzanine to A7 (`requests/A7-n.md`) for F-012.
  - Add a contact sheet of every 12th frame per shipped clip to `qa_shipped.py`. A6 records the manual crowd sign-off in `qa/TRUTH.md` (F-053).
- **Files:** `pipeline/crowdcrush.py`, `pipeline/mezz.py`, `pipeline/run_mezz.sh`, `pipeline/qa_shipped.py`, `public/media/perspectives/el-c31.*`, `src/media/manifest.json`.
- **Verify:** R-DEV at 1440, plan `[["a-102",["land"]]]`. Retake `art/1440-a-102-land.jpg` and the crop as `art/crop-1440-a102-persp.png`. Re-extract frame 3.4 s from the new clip as `truth/c31-t3.4-person.jpg`. The contact sheet must show no warm pixel between the studs, and the hands and board must be readable.
- **Linked:** F-012, H-11.

#### F-010 · P0 · A5 · Ship the corrected social card and film files, and scan them
- **From:** truth P0 (A5 part).
- **Fix:**
  - After F-011 and F-012:
    - Copy the new og image to `public/media/og/og-image.jpg`.
    - Copy `the-set-169.{av1,h264}.mp4` and `the-set-169.poster.{jpg,avif}` to `public/media/film/`.
    - Update the manifest byte counts.
  - Extend `pipeline/qa_shipped.py` to scan the og and x-card PNGs and every film still. Fail on any yellow, orange or red livery (F-048) outside the bay-tape ROI.
- **Files:** `public/media/og/og-image.jpg`, `public/media/film/the-set-169.*`, `src/media/manifest.json`, `pipeline/qa_shipped.py`.
- **Verify:** recrop the tape area of the new og image as `truth/og-tape.jpg`; the housing must be grey, as in `truth/hero-still-tape.jpg`. `qa_shipped.py` must report `liveryFrames` = 0.
- **Linked:** F-011, F-012.

#### F-045 · P1 · A5 · Ship a slim runtime manifest
- **From:** a11y-perf P1 (A5 part of the shell-JS finding).
- **Fix:**
  - `pipeline/build_manifest.py`: emit `src/media/manifest.json` with only the fields the site reads (id, sources, poster, w/h, alt, captions, transcript, lineEndpoints).
  - Move the bytes and debug fields to `pipeline/out/manifest-qa.json` for QA.
  - Update the types in `manifest.ts`.
- **Files:** `pipeline/build_manifest.py`, `src/media/manifest.json`, `src/media/manifest.ts`.
- **Verify:** `npx tsc -p tsconfig.json --noEmit` is clean, and the entry chunk's gz size falls (F-014).
- **Linked:** F-014.

#### F-046 · P1 · A5 · Add a per-glyph occlusion gate to the freeze
- **From:** art P1, truth P1 (A5 part of the FAR-bite finding).
- **Fix:** in `pipeline/freeze.py`:
  - Gate: no FAR glyph may be more than 40% occluded, at yaw 0 and at rest, at 1280x800, 1440x900 and 9:16. The bite must fall in the shoulder region only.
  - Emit `typeLayerShift` in `hero-meta-169/916.json` to match A2's new `TYPE_LAYOUT` (F-022).
- **Files:** `pipeline/freeze.py`, `public/media/hero/hero-meta-169.json`, `public/media/hero/hero-meta-916.json`.
- **Verify:** the gate report passes. Then run F-022's retakes.
- **Linked:** F-022.

#### F-047 · P1 · A5 · The crowd crush leaves halos around 07
- **From:** art P1, juror P1.
- **Seen:**
  - `art/crop-a101-persp-halo.png`: soft light fringes round the helmet and both shoulder pads, against black.
  - `truth/c30-t2.5.jpg`: the same fringe round the shoulders and helmet.
- **Fix:** in D4 (`pipeline/crowdcrush.py`):
  - Erode the subject matte by 2–3 px and feather only outward into the background, in linear light.
  - Apply the falloff to background pixels only, clamp to #0B0B0A, and re-add the clip's grain in the crushed area.
  - Re-encode `el-c30`, `el-c32` and `el-c33` with their posters, and update the manifest.
- **Files:** `pipeline/crowdcrush.py`, `public/media/perspectives/el-c30.*`, `el-c32.*`, `el-c33.*`, `src/media/manifest.json`.
- **Verify:** R-DEV. Retake the A-101 hold crop as `art/crop-a101-persp-halo.png`, and retake `stage-a-103-060vh-1440.jpg`. No light fringe may show round the helmet or pads.

#### F-048 · P1 · A5 · Real power-tool trade dress is on screen
- **From:** truth P1.
- **Seen:**
  - `truth/b41-drill.jpg`: an orange-and-black cordless drill with a white label on its battery.
  - `truth/b42-tool.jpg`: a red-and-black power tool held in 07's hand.
- **Problem:** rule 21. D11 scans only for yellow.
- **Fix:**
  - `mezz.py` `livery()`: shift saturated orange (8–30°) and red (345–10°) tool bodies to graphite, inside per-clip tool ROIs (as `--livery box:` already does), so 07's pads are untouched.
  - Apply it to b41, b42, b43 and `arena-0104`, then re-run register → plates → manifest.
  - `measure.py`: scan for red and orange too, and require `liveryFrames == 0` outside the bay tape.
- **Files:** `pipeline/mezz.py`, `pipeline/measure.py`, `pipeline/plates.py`, `public/media/plans/plan-b41.*`, `public/media/plans/plan-b42.*`, `public/media/plans/plan-b43.*`, `public/media/arena/arena-0104.*`, `src/media/manifest.json`.
- **Verify:** re-extract the same frames as `truth/b41-drill.jpg` and `truth/b42-tool.jpg`; the tools must be graphite.

#### F-049 · P1 · A5 · Generated pseudo-text is visible in shipped frames
- **From:** truth P1.
- **Seen:**
  - `truth/n03-socket-text.jpg`: glyph-like embossed lettering on the socket.
  - `extra-stage-a-103-minus025vh-1440.jpg`: the same lettering is visible inside the A-103 detail circle.
  - `truth/b41-drill.jpg`: a lettered label on the battery.
- **Fix:**
  - det-n03: trim the loop to the frames before the lettered band rotates into view (about 0–3.5 s), or add a `--textmask` ROI blur in `mezz.py` over the socket band for frames ≥ ~85.
  - Smudge the b41 battery label ROI and the c34 tape-housing ROI the same way.
  - Re-encode `det-n03.{av1,h264}` and its poster, and `plan-b41`. Update the manifest seam.
- **Files:** `pipeline/mezz.py`, `pipeline/plates.py`, `public/media/details/det-n03.*`, `public/media/plans/plan-b41.*`, `src/media/manifest.json`.
- **Verify:** R-DEV retake of `extra-stage-a-103-minus025vh-1440.jpg` (circle crop). Re-extract the frame as `truth/n03-socket-text.jpg`. No glyph-like marks may remain.

#### F-050 · P1 · A5 · The bricklaying footage shows bad brickwork next to "STRAIGHT COURSES"
- **From:** truth P1.
- **Seen:**
  - `truth/b40-wall-t4.5.jpg`: two grey mortar slabs sit in the course where bricks should be.
  - `stage-a-101-000vh-1440.jpg`: the same slabs in the PLAN 01 wall, beside the STRAIGHT COURSES and CONSISTENT JOINTS chips.
- **Fix:**
  - plan-b40: play 0 → about 2.0 s once and hold the last frame, as b44 does. Set the in/out in `plates.py` and the manifest seam, and rebuild `arena-0104` with the held segment.
  - det-v0: use only frames with clean bed joints, or crop DETAIL 1 from the N09 retake, which passed the brickwork gate.
  - Update the posters to match.
- **Files:** `pipeline/plates.py`, `public/media/plans/plan-b40.*`, `public/media/details/det-v0.*`, `public/media/arena/arena-0104.*`, `src/media/manifest.json`.
- **Verify:** R-DEV retake of `stage-a-101-000vh-1440.jpg`; the course must be intact. Re-extract the matching frame as `truth/b40-wall-t4.5.jpg`.

#### F-051 · P1 · A5 · The line endpoints for b44 are wrong
- **From:** motion P1 (A5 part).
- **Seen:** `motion/zoom-plan06-line.png`: the visitor's thin deposit lies along the top of b44's much wider stripe and overshoots it at both ends.
- **Fix:**
  - In the manifest, set `lineEndpoints` for `plan-b44-260`, `plan-b44` and `plan-b44-m` to about `[[0.400, 0.528], [0.735, 0.528]]`. That is the stripe core from a pixel scan of `plan-b44-260.jpg`, without the reel string.
  - Tell A2 the new values for `FRESH_FALLBACK` (F-005).
- **Files:** `src/media/manifest.json`, `pipeline/build_manifest.py`.
- **Verify:** R-HERO cover-plan, `--times 0.6`. Recrop as `motion/zoom-plan06-line.png`; the deposit must sit inside the stripe's ends.
- **Linked:** F-005.

#### F-090 · P2 · A5 · Manifest alt for el-c30
- **From:** truth P2 (A5 part).
- **Fix:** in `pipeline/build_manifest.py` and the manifest, set the el-c30 alt to F-081's text.
- **Files:** `pipeline/build_manifest.py`, `src/media/manifest.json`.
- **Verify:** the manifest alt equals the copy in `copy/a100-a103.ts`.
- **Linked:** F-081.

#### F-091 · P2 · A5 · The T7 PDFs upper-case a case-sensitive family name
- **From:** truth P2.
- **Fix:** in `pipeline/targets.py`, print "AprilTag family tag36h11" in its true case, even inside the all-caps line. Re-export `public/kit/hrcg-t7-letter.pdf` and `hrcg-t7-a4.pdf`.
- **Files:** `pipeline/targets.py`, `public/kit/hrcg-t7-letter.pdf`, `public/kit/hrcg-t7-a4.pdf`.
- **Verify:** `pdftotext` shows `tag36h11`.

### A6 · Conversion, notes, QA, truth

#### F-052 · P1 · A6 · The QA build is a development build
- **From:** a11y-perf P1.
- **Evidence (see §0):**
  - `/tmp/hrcg-qa-build` contains `jsxDEV` and the sandbox chunks.
  - Its `index.html` links five chunk stylesheets before `index-*.css`.
  - Cause: `qa.mjs` calls Vite's `createServer` (L111), which sets `NODE_ENV=development`, and `ensureBuild` then spawns `vite build` with `...process.env` (L143-147).
- **Fix:**
  - `ensureBuild`: spawn with `env: { ...process.env, NODE_ENV: 'production', HRCG_PRERENDER_LENIENT: '1' }`.
  - After the build, fail if any asset contains `jsxDEV` or `react-stack-bottom-frame`, if a `sandboxes-` chunk exists, or if `index.html` links more than one stylesheet.
  - Re-run `qa.mjs`, re-capture the review set, and correct the "fresh production build" line in `qa/review/INDEX.md`.
- **Files:** `scripts/qa.mjs`, `qa/review/INDEX.md`.
- **Verify:** `/tmp/hrcg-qa-build/index.html` links one stylesheet. A retake of `sheet-a-104-1280.jpg` from the QA build must match `fixlist/clean-1440-a-104-land.jpg`: separate caption rules and no PLAY.
- **Linked:** F-013.

#### F-053 · P1 · A6 · QA gates for every fix in this list
- **From:** a11y-perf P2, phone P0 (QA part), art P0 (QA step), plus the gates each item asks for.
- **Fix:** in `scripts/qa.mjs`, add:
  1. **Phone viewports and overlap.** Add 390x664, 375x667, 360x780, 320x568 and 844x390 next to 390x844, with an overlap check on the hero's boxes (F-003).
  2. **axe coverage.** Run axe at hero rest, mid-page (A-105) and A-300, on desktop and phone, with INDEX open, with the title sheet open, and under reduced motion. Fail on `page-has-heading-one` and `label-content-name-mismatch`, and print the incomplete counts.
  3. **Landing check.** For every INDEX row and both CTAs, the `activeElement` must lie inside the unobscured band and hit itself (F-015).
  4. **Self-hit.** Every interactive element, once scrolled into view, must be the result of `elementFromPoint` at its own centre (F-034).
  5. **Visible focus.** Diff a screenshot of each Tab stop focused against blurred (F-024).
  6. **Contrast sampler.** Sample glyph pixels against the footage for the hero text at t 1.6, 3.9 and 9 s (F-025).
  7. **Budgets.** First-view bytes ≤1.1 MB on the AV1 path, and the entry chunk ≤110 kB gz (F-002, F-014).
  8. **No-JS video.** `nojs-video` accepts a `.loopvideo-poster` sibling (F-002).
  9. **Motion off.** `motion-off` requires `aria-pressed` (F-019).
  10. **Keyboard.** P6 also aligns each field to the top (`scrollIntoView({ block: 'start' })`) and asserts that the field doesn't intersect `.mini-slot` or `.phone-bar` (F-054).
  11. **Prod vs dev.** Diff the landing of each sheet between the prod and dev builds (F-013).
  12. **Lightbox.** The lightbox video has a captions track, and the transcript is reachable (F-020).
  13. **A-104 captions.** The A-104 figcaption boxes don't intersect at 1920, 1440, 1280 and 1024 (F-083).
  - In `qa/TRUTH.md`, reopen the D4, D10 and D11 lines until F-009 and F-047–F-049 land, record the manual crowd and D10 sign-offs, and correct the rule-11 line (F-098).
- **Files:** `scripts/qa.mjs`, `qa/TRUTH.md`.
- **Verify:** `qa/RESULTS.md` lists each new check, and each one fails on the current build before its fix and passes after it.

#### F-054 · P1 · A6 · With the keyboard up, the focused field lands under the sticky mini-slot
- **From:** phone P1 (A6 part; the phone-bar part is F-021).
- **Seen:** `phone/p5-kbd-rfi-platform.jpg`: the PLATFORM input is hidden under the mini-slot, which shows the typed "AB", and the "1 · PLATFORM" label sits under HRCG.
- **Fix:** in `conversion.css` at ≤767 px, add `.rfi--teams :is(input, textarea, .chip, .rfi-label) { scroll-margin-top: calc(64px + var(--s-4)); scroll-margin-bottom: var(--s-4); }`. Add the same rule for the A-301 kit-composer fields.
- **Files:** `src/sheets/conversion/conversion.css`.
- **Verify:** R-PHONE at 390x470, with each field aligned to the top. Retake `phone/p5-kbd-rfi-platform.jpg`; the input must sit below the mini-slot.
- **Linked:** F-021, F-053.

#### F-055 · P1 · A6 · The A-300 diptych hangs left
- **From:** art P1.
- **Seen:** `art/1440-a-300-land.jpg`: the right panel ends at about x 1227, well short of the 1368 margin, and "YOURS IS." sits off-centre.
- **Fix:** in `conversion.css`:
  - `.diptych-view--right, .diptych-word--right { justify-self: end; }`.
  - Make the right word's box the panel width, with `text-align: left`, so it starts on the panel's left edge.
- **Files:** `src/sheets/conversion/conversion.css`.
- **Verify:** R-DEV at 1440 and 1280, plan `[["a-300",["land"]]]`. Retake `art/1440-a-300-land.jpg`; the outer panel edges must be at 72/1368 (72/1208 at 1280).

#### F-056 · P1 · A6 · The A-301 landing hides the headline (desktop) or buries it (phone)
- **From:** art P1 (A-301 part), phone P1.
- **Seen:**
  - `art/1440-a-301-land.jpg`: the third line of the H2 is under the strip.
  - `phone/p4-after-sponsors-tap.jpg`: after "Sponsors →", the screen shows only the tag and stacked crops with small labels. Probe: the H2 is at y 967 in an 844 px viewport.
- **Fix:**
  - Desktop: F-016's 12vh cap. If the H2 still doesn't clear the strip, set `.a301 .t-h2-statement { font-size: min(…, 10vh); }`.
  - Phone, in `conversion.css` at ≤767 px: `.materials-list { grid-template-columns: repeat(5, 1fr); }`, with square crops and the MAT number under each. The labels live in the keynotes. The H2 then lands inside the first 844 px.
- **Files:** `src/sheets/conversion/conversion.css`.
- **Verify:** R-DEV retake of `art/1440-a-301-land.jpg`. R-PHONE Sponsors tap, then retake `phone/p4-after-sponsors-tap.jpg`; the H2 must be on screen.
- **Linked:** F-016.

#### F-057 · P1 · A6 · On touch, the first tap on an A-301 material does nothing
- **From:** phone P1.
- **Seen:** `phone/p4-a301-tap1.jpg`: after the tap, no crop shows an active state. Probe: all five are inactive and no keynote is lit.
- **Problem:** `A301Parts.tsx:50-57`: the emulated `mouseenter` and `focus` set the crop active, and then `onClick` toggles it straight off.
- **Fix:**
  - Replace `onMouseEnter`/`onMouseLeave` with `onPointerEnter`/`onPointerLeave` that return early unless `e.pointerType === 'mouse'`.
  - `onClick`: for touch, set the crop active, and toggle it off only if it was already active before the pointerdown.
  - On phones, show the matched keynote titles inline under the tapped crop's label.
- **Files:** `src/sheets/conversion/A301Parts.tsx`, `src/sheets/conversion/conversion.css`.
- **Verify:** R-PHONE: one tap on MAT 02 makes it active, lights keynotes 1 and 2, and shows their titles inline. Retake `phone/p4-a301-tap1.jpg`.

#### F-092 · P2 · A6 · Join A-301 and A-900 into one paper set
- **From:** art P2 (A6 part; A1's margin change is F-067).
- **Seen:**
  - `art/1440-a-301-120vh.jpg`: the paper ends and slab follows.
  - `art/1440-a-301-land.jpg` and `art/1440-a-900-land.jpg`: a dark band above each paper top. F-001's gypsum rail removes this.
- **Fix:** in `conversion.css`, mark the A-301 → A-900 break as a 1 px rule with the A-900 tag on paper, and start each paper sheet flush at its top.
- **Files:** `src/sheets/conversion/conversion.css`.
- **Verify:** R-DEV retakes of `art/1440-a-301-120vh.jpg` and `art/1440-a-900-land.jpg`; one continuous paper ground.
- **Linked:** F-001, F-067.

#### F-093 · P2 · A6 · The HOLD clouds crowd their cells in the A-900 title block
- **From:** art P2.
- **Seen:** `art/prod-1440-a-900-240vh.jpg`: the "Hold." clouds touch "To be announced on this site." and the cell rules.
- **Fix:** in `conversion.css`, make the cloud cells `inline-flex`, with a 10 px gap after the cloud, a 4 px inset from the cell rule and a 4 px top margin.
- **Files:** `src/sheets/conversion/conversion.css`.
- **Verify:** R-DEV at 1440, plan `[["a-900",[240]]]`; retake. The clouds must clear the text and rules.

#### F-094 · P2 · A6 · The A-900 notes use navigation arrows, and the end line floats
- **From:** art P2, juror P1 (in part; the rest is H-6 and H-7).
- **Seen:**
  - `art/1440-a-900-land.jpg`: every note row ends in →.
  - `art/prod-1440-a-900-240vh.jpg`: "THIS HASN'T HAPPENED YET." sits alone at y≈533 in empty paper.
- **Fix:**
  - Use + and − (or a ▸ that rotates when open) as the `<details>` glyph.
  - Set the end line on its own ruled row directly above the title block, sharing its left edge.
- **Files:** `src/sheets/A900Notes.tsx`, `src/sheets/conversion/A900Parts.tsx`, `src/sheets/conversion/conversion.css`.
- **Verify:** R-DEV retakes of both frames.

#### F-095 · P2 · A6 · The chip numerals jump when a name wraps
- **From:** art P2.
- **Seen:** `a300-typed-grid-1440.jpg`: the numerals of 02 and 05, whose names wrap to two lines, sit higher than 01, 03 and 04.
- **Fix:** in `conversion.css`, top-align the chip content (`align-content: start; justify-content: flex-start`).
- **Files:** `src/sheets/conversion/conversion.css`.
- **Verify:** retake `a300-typed-grid-1440.jpg` with the same typed state; all numerals on one baseline.

#### F-096 · P2 · A6 · The empty bay's "—" renders as a flat bar
- **From:** art P2.
- **Seen:** `art/1440-a-300-land.jpg`: a flat light bar at the top left of the empty bay, with no texture, next to the textured YOUR ROBOT stencil.
- **Fix:** in `BaySlot.tsx:106` and `conversion.css`, render the "—" with the slot's stencil paint mask at chalk 85% and at the stencil numerals' scale, and add the small label `BAY` (legend word).
- **Files:** `src/sheets/conversion/BaySlot.tsx`, `src/sheets/conversion/conversion.css`.
- **Verify:** R-DEV retake of `art/1440-a-300-land.jpg`.

#### F-097 · P2 · A6 · The T7 proofs are packed left with one long label
- **From:** art P2.
- **Seen:** `art/1440-a-300-300vh.jpg`: three proofs sit at the left with uneven gaps and dead space on the right, and one long label runs underneath.
- **Fix:** in `conversion.css` and `A300Teams.tsx`, use three equal columns, each proof centred in its column with its own label (FLAT · WARPED + BLURRED · 26 PX WIDE), split from the existing string with no new words.
- **Files:** `src/sheets/conversion/conversion.css`, `src/sheets/A300Teams.tsx`.
- **Verify:** R-DEV at 1440, plan `[["a-300",[300]]]`; retake.

#### F-098 · P2 · A6 · "READY FOR" prints all five numbers before anything is ticked
- **From:** truth P2.
- **Seen:** `art/1440-a-300-land.jpg`: "READY FOR 01 02 03 04 05", all printed, dimmed but legible.
- **Fix:**
  - `BaySlot.tsx`: until a box is ticked, render `READY FOR —`. After that, render only the ticked numbers.
  - Correct the rule-11 line in `qa/TRUTH.md`.
- **Files:** `src/sheets/conversion/BaySlot.tsx`, `src/sheets/conversion/conversion.css`, `qa/TRUTH.md`.
- **Verify:** R-DEV retake of `art/1440-a-300-land.jpg`; "READY FOR —".

#### F-099 · P2 · A6 · Phone tap targets and legibility on the conversion sheets
- **From:** phone P2 (×2).
- **Seen:**
  - `phone/p7-a-900-4_4.jpg`: the footer index links are stacked tightly.
  - `phone/p5-kbd-rfi-platform.jpg`: the chip names are small condensed caps.
- **Fix:** in `conversion.css` at ≤767 px:
  ```css
  .tb-index .in-page-index-rows a { display: block; padding: 12px 0; min-height: 44px; }
  .contact-email { display: inline-block; padding: 8px 0; }
  .chip-name { font-size: 13px; line-height: 16px; font-stretch: 80%; }
  ```
- **Files:** `src/sheets/conversion/conversion.css`.
- **Verify:** R-PHONE. Retake `phone/p7-a-900-4_4.jpg`; probe: link targets ≥44 px.

#### F-100 · P2 · A6 · Hand the footer block to the shell
- **From:** a11y-perf P2 (A6 part).
- **Fix:** remove `<FooterBlock />` from `A900Notes.tsx:30`, because `App.tsx` renders it after `</main>` (F-066). Keep the export in `A900Parts.tsx`.
- **Files:** `src/sheets/A900Notes.tsx`.
- **Verify:** the footer still renders once, and the accessibility tree has `contentinfo`.
- **Linked:** F-066.

#### F-101 · P2 · A6 · Hover states stick after a tap (conversion.css)
- **From:** phone P2.
- **Seen:** `a300-typed-ticks-390.jpg`: "Discuss competing →" is filled orange.
- **Fix:** wrap the `:hover` rules in `conversion.css` in `@media (hover: hover) and (pointer: fine)`, and add `:active` for touch.
- **Files:** `src/sheets/conversion/conversion.css`.
- **Verify:** R-PHONE retake of `a300-typed-ticks-390.jpg` after a tap; no orange fill.
- **Linked:** F-068.

### A7 · Films

#### F-011 · P0 · A7 · The og image, X card and THE SET show a yellow-and-black tape measure
- **From:** truth P0.
- **Where:** og:image, the X card, THE SET poster, and THE SET's A-000 beats in all three cuts.
- **Seen:**
  - `truth/og-tape.jpg`: a tape-measure housing in yellow and black.
  - `truth/x-card-small.jpg`: the same tape at left on the X card.
  - `truth/hero-still-tape.jpg` (control): the site's own hero still shows a grey housing.
- **Problem:** this is tool trade dress (rule 21), in the first image anyone sees when the link is shared. `film/public/stills/c34-f84.png` was taken from an unshifted source.
- **Fix:**
  - Re-export `film/public/stills/c34-f84.png` as frame 84 of the livery-shifted `film/public/clips/c34-169.mp4`, with NEAR darkening off so it matches the hero still's grade.
  - Re-run `film/scripts/deliver.sh` for the 16:9, 9:16 and 1:1 cuts, the posters, the OgImage and the XCard.
  - Hand the outputs to A5 (F-010).
- **Files:** `film/public/stills/c34-f84.png`, `film/src/clips.ts`, `film/scripts/deliver.sh`, `film/out/**`.
- **Verify:** recrop `truth/og-tape.jpg` and `truth/x-card-small.jpg` from the new outputs; the housing must be grey.
- **Linked:** F-010.

#### F-012 · P0 · A7 · Re-render THE SET with the cleaned c31
- **From:** truth P0 (A7 part).
- **Fix:** after F-009, replace `film/public/clips/c31-45.mp4` with A5's re-crushed mezzanine and re-render all three cuts. Then hand them to A5 (F-010).
- **Files:** `film/public/clips/c31-45.mp4`, `film/out/**`.
- **Verify:** extract frames at 0:13.2, 0:14.0 and 0:14.6 from the new `the-set-169`. No warm figure may show between the studs.
- **Linked:** F-009, F-010.

#### F-058 · P1 · A7 · THE SET's AI disclosure is too small to read in a feed
- **From:** truth P1, truth P2 (separator).
- **Seen:**
  - `truth/set916-at-390.jpg`: shown 390 px wide, the "CONCEPT FILM · AI-GENERATED CONCEPT FOOTAGE" line is tiny, in the bottom few percent of the frame.
  - `truth/set-sheet4.jpg`: the same burn-in is small at the bottom left of each card.
- **Fix:** in `film/src/TheSet.tsx` and `film/src/components/Burnins.tsx`:
  - Burn in `CONCEPT FILM: AI-GENERATED CONCEPT FOOTAGE`, the site's ":" form, at ≥3.2% of frame height (about 35 px at 1080; about 60 px on the 1920-tall 9:16).
  - Repeat it in the top safe area (10–14% from the top).
  - Re-render all cuts and hand them to A5 (F-010).
- **Files:** `film/src/TheSet.tsx`, `film/src/components/Burnins.tsx`.
- **Verify:** re-extract at 390 px wide as `truth/set916-at-390.jpg`. The disclosure must be readable and outside the bottom 20%.

#### F-102 · P2 · A7 · The end card asks people to get in touch but gives no address
- **From:** truth P2.
- **Seen:** `truth/set-sheet4.jpg`: "TEAMS AND SPONSORS: GET IN TOUCH." with no address, URL or handle.
- **Fix:** in `film/src/scenes/EndCard.tsx`, print `SITE_URL` under the line when it resolves at render time. Otherwise replace that cell with `DATE · VENUE: HOLD`.
- **Files:** `film/src/scenes/EndCard.tsx`, `film/src/TheSet.tsx`.
- **Verify:** re-extract the end card as `truth/set-sheet4.jpg`.

---

## 7. Juror scores and top-3 changes

**Verdict:** it would not win Site of the Day today. The best case is an Honorable Mention.

| Design | Usability | Creativity | Content | Mean |
|---|---|---|---|---|
| 6.5 | 5 | 7 | 6 | 6.1 |

**The juror's top three changes, and the items that deliver them:**
1. **Make the hero freeze clean and the first second populated.** F-004, F-008, F-022 and F-046 clean the freeze and the bite. F-074 fixes the snap timing. The first-paint changes are H-2.
2. **Kill every chrome collision.** F-001 (header rail), F-059 (opaque strip), F-015 (landings), F-007 (A-103) and F-039 (A-104). The A-104 caption overprint the juror saw was a QA-build artefact (X-1); F-052 and F-013 make sure it can't ship.
3. **Cut the dead air and land the ending.** F-043 (A-200 re-timing), F-041 (A-105 frame), F-039 (A-104), F-005 (A-100 prints at 0.55) and F-094 (end line). The bigger A-900 changes are H-6 and H-7.

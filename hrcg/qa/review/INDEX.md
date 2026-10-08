# Design-review evidence: integrated site

Captured 2026-10-08. Every image in this folder was opened and looked at. Each line below describes only what the image shows.

## How it was captured

- **Build:** `scripts/cpuq node scripts/qa.mjs` made a fresh build (vite build + prerender) into `/tmp/hrcg-qa-build` and ran every suite against it. The review captures below use a copy of that same build, served by a static server with byte ranges at `127.0.0.1:5391`. They do not use the dev server.
  - **Correction (FIXLIST-1 F-052):** that build was **not** a production build. `qa.mjs` started a Vite server before it built, which set `NODE_ENV=development`, and the build inherited it: its assets carry `jsxDEV`, the dev runtime and the sandbox chunks, and its `index.html` links five chunk stylesheets ahead of `index-*.css`, which flips the cascade (the A-104 caption overprint and the stray ▸ PLAY in `sheet-a-104-1280.jpg` and `art/prod-*.jpg` come from this; see FIXLIST-1 §0 and X-1). Since F-052, `qa.mjs` builds with `NODE_ENV=production` from the environment it was started with, and fails the `build` suite if any asset contains `jsxDEV` or `react-stack-bottom-frame`, if a sandbox or `jsx-dev-runtime` chunk exists, or if `index.html` links more than one stylesheet. Its output is byte-identical to a plain `vite build` (same `index.html`, same asset names). Retake: `r1/sheet-a-104-1280.jpg` (separate caption rules, no PLAY).
- **`?heroperf=0`** is on every review capture, so the headless frame-time monitor never swaps the 3D view for the still. It also never demotes the tier to `lite`.
- **Hero and cover-plan frames** come from `scripts/capture.mjs` (`?capture&heroperf=0`, `--times`, `--w/--h`). The tool writes PNG, which ImageMagick converts to JPEG at quality 80. `capture.mjs` has no touch or mobile emulation, so the 390 frames are a plain 390x844 viewport.
- **Stage, sheet, form and overlay shots** come from Playwright, JPEG quality 80, DPR 1.
  - Desktop runs at 1440x900 (1280x800 for the sheets).
  - Phone runs at 390x844 with `isMobile` and `hasTouch` and an iPhone user agent, the same context as the QA phone suite.
  - Each shot scrolls with `window.scrollTo(0, sheetTop + offset × innerHeight / 100)`, with no scroll-padding taken off, then waits 2.5 s.
  - Because no scroll-padding is taken off, the fixed header sits over the top of each sheet at offset 0.
- **Strip SHEET cell in capture mode:** in the cover-plan frames the strip's SHEET cell stays `A-000 · COVER` even after A-100 has landed. Capture mode does not scroll, so this is expected there and is not a live-site reading.

## QA suite: 85 pass, 2 fail (87 checks)

Source: `qa/RESULTS.md`, `qa/results.json` and `qa/shots/` (56 JPEGs), written by the run at 2026-10-08T09:19:15Z. Target: `http://127.0.0.1:43239/`, build `/tmp/hrcg-qa-build`, axe-core engine.

| Suite | Pass | Fail |
|---|---|---|
| build (fresh vite build + prerender + prerender copy lint) | 1 | 0 |
| desktop 1440 | 21 | **1** |
| strip (1920 to 768) | 27 | 0 |
| phone 390 | 13 | 0 |
| rm (reduced motion) | 8 | 0 |
| nogl (`?gl=0`, `--disable-webgl`) | 4 | 0 |
| nojs | 9 | **1** |
| lint (DOM + prerendered HTML) | 2 | 0 |

Failures:
1. **desktop / a11y** (axe `label-content-name-mismatch`, serious, 3 nodes): `.mk-vm` (`src/marks/ViewMarker.tsx`) and two `button[aria-controls=…]`, which are the DetailBubble toggles (`src/marks/DetailBubble.tsx:148`). In each, the visible text is not part of the accessible name.
2. **nojs / nojs-video**: 17 videos, 1 without poster and controls. In the prerendered HTML this is `<video class="cv-slot5" muted playsInline preload="none" aria-hidden="true" tabindex="-1">` from `src/hero/CoverStage.tsx:267`.

No console errors were recorded in the JS suites. The no-JS suite logged 50 `requestfailed … csp` entries for `/assets/*.js`.

## Files

### Hero (scene `hero`), 1440x900
- `hero-1440-t0.0s.jpg`: first paint, armed. The H1 is in grey chalk-and-pencil on dark slab with the sub and the `PULL THE LINE. LET GO. / or press Space` hint. There is no line yet, only a dot at the right end. The strip reads `A-000 · COVER`, `MOTION ON`.
- `hero-1440-t0.8s.jpg`: the blue line pays out leftward from the chalk box along BUILD?'s baseline with a dark cast shadow, to about x 840. The right ✕ is stamped.
- `hero-1440-t1.6s.jpg`: the line is fully paid out from ✕ (x≈752) to the chalk box and ✕ (x≈1385), straight under BUILD?.
- `hero-1440-t2.4s.jpg`: scripted pull. The line bows into a deep V down to y≈800, crossing over the hint text and nearly reaching the bottom of the frame.
- `hero-1440-t3.2s.jpg`: snap. The H1 is inked: WHAT CAN A / HUMANOID in chalk white, ACTUALLY BUILD? in orange. A powdery blue deposit and puff lie along the line. The view title `PERSPECTIVE 05-A · … THIS HASN’T HAPPENED YET.` appears.
- `hero-1440-t3.6s.jpg`: the film rises through the dust. Robot 07 is on all fours with a blue plume at its hand, a tape measure is at left, and the deposit is fading. The H1 sits over the film.
- `hero-1440-t4.0s.jpg`: the film plays on, the plume billows right toward the lens and the deposit is gone. The sub reads over the floor footage.
- `hero-1440-t4.6s.jpg`: freeze / 3D VIEW. The view title changes to `3D VIEW 05-A · DEPTH ESTIMATED …`. 07's orange shoulder pad and a cable now cover the D of HUMANOID and the right of the A.
- `hero-1440-t5.5s.jpg`: camera swing. The type planes skew in perspective and move: FAR shifts right, NEAR shifts left and up. Stretched, smeared depth-mesh edges show at 07's back and shoulders and on the tape measure.
- `hero-1440-t6.5s.jpg`: rest pose, the same composition slightly further rotated. The edge stretching on 07's silhouette stays visible.
- `hero-1440-t8.0s.jpg`: idle at rest. The `DRAG TO LOOK · SCROLL FOR THE PLAN ↓` hint and the `↺ RESET THE LINE` button appear.

### Hero (scene `hero`), 390x844
- `hero-390-t0.0s.jpg`: phone first paint. The H1 is in grey at the top, ACTUALLY BUILD? lower right, the hint at left beside it and the sub below. A large empty slab gap runs from y≈260 to 530. The phone bar reads `PLANNED · NYC · 2027 · A-000 | Teams → | Sponsors →`.
- `hero-390-t0.8s.jpg`: a short paid-out line under BUILD? with the chalk box. The right ✕ sits at the sheet border.
- `hero-390-t1.6s.jpg`: the line is fully out from ✕ (x≈182) to the chalk box. The right ✕ touches the sheet border line.
- `hero-390-t2.4s.jpg`: the pull bows the line into a V that crosses the sub text's second line.
- `hero-390-t3.2s.jpg`: snap. The H1 is inked white and orange, the blue deposit sits on the line, and the two-line PERSPECTIVE view title appears with NTS.
- `hero-390-t3.6s.jpg`: the 9:16 film fades in: 07 crouched front-on with a blue plume. HUMANOID sits over 07's head.
- `hero-390-t4.0s.jpg`: the film plays and the plume spreads across the lower half. The deposit is gone.
- `hero-390-t4.6s.jpg`: freeze / 3D VIEW title. 07's head now covers part of HUMANOID ("OI"). The orange shoulder pads show stair-stepped, blocky edges.
- `hero-390-t5.5s.jpg`: swing. Both type blocks rotate in perspective, and the head bites further into HUMANOID.
- `hero-390-t6.5s.jpg`: rest pose. The composition matches 5.5 s with slightly more rotation.
- `hero-390-t8.0s.jpg`: idle. `↺ RESET THE LINE` sits at left beside BUILD? and the `DRAG TO LOOK · SCROLL FOR THE PLAN ↓` hint sits under the sub.

### Cover to plan (scene `cover-plan`), 1440x900
- `plan-1440-t0.0s.jpg`: the start of the plan cut, identical to the hero idle rest pose (hint and RESET visible).
- `plan-1440-t0.6s.jpg`: the overhead plan 05 photo fills the frame. It shows 07 holding the line reel at right, the blue chalk stripe, blue plan lines, orange ✕ and ticks, and a yellow bay stripe. A dimmed band of the hero (H1 fragments, tape measure, sub) remains in the left ~230 px. The view title is `PLAN 05 · CONCEPT FILM STILL · AI-GENERATED`.
- `plan-1440-t1.2s.jpg`: the same plan photo. The left band now shows an empty hairline-framed box and a clipped `PLAN VIEWS 01–05 · CONC…` caption.
- `plan-1440-t1.8s.jpg`: the plan 05 square shrinks toward bay 05 and overlaps the bay 04 and 05 frames. Bays 01–04 show overhead stills under bubbles 01–05. The lower half is empty, and the `PLAN 05` view title is still at the bottom.
- `plan-1440-t2.4s.jpg`: A-100 has landed. It shows the tag `A-100 · THE FIVE BAYS (ILLUSTRATIVE) · NOT A VENUE PLAN · NTS`, five bay plans with labels, the `PLAN VIEWS 01–05` title, the legend row, the H2 "Five jobs every builder knows." and the body text. The strip still reads `A-000 · COVER`.
- `plan-1440-t3.0s.jpg`: the same layout. The bay films have advanced (robots in new poses, bay 05's chalk line now across the middle).

### Cover to plan (scene `cover-plan`), 390x844
- `plan-390-t0.0s.jpg`: the phone hero idle rest pose (RESET and hint visible).
- `plan-390-t0.6s.jpg`: the hero dims and the H1 ghosts. The overhead bay 05 plan rises from the bottom (y≈440–790) over the lower half, and fragments of the sub and the RESET button peek out at its left edge.
- `plan-390-t1.2s.jpg`: the hero is gone. A row of five empty black hairline boxes and the `PLAN VIEWS 01–05` caption sit at top, and the large plan 05 square is still at the bottom.
- `plan-390-t1.8s.jpg`: bays 01–04 are filled with thumbnails and bay 05's slot is empty. The shrinking plan 05 floats mid-screen at right (x≈255–360, y≈262–368), not yet in its slot. The rest of the screen is empty.
- `plan-390-t2.4s.jpg`: A-100 on the phone. It shows the tag, five bay thumbnails with bubbles, the caption, a five-row list (`01 BRICKLAYING … A-101 →` to `05 LAYOUT AND MARKING … A-105 →`), the H2 and the body. The phone bar still reads A-000.
- `plan-390-t3.0s.jpg`: the same as 2.4 s, with the bay thumbnails advanced.

### A-101 pinned stage (sheet top = scrollY 3072 desktop / 2134 phone)
- `stage-a-101-000vh-1440.jpg`: plan 01 overhead film at left, with the header lockup over its top edge. At right are the detail bubble `1 / A-101 DETAIL`, the H2 "BRICK–LAYING", the spec and three spec chips (STRAIGHT COURSES, CONSISTENT JOINTS, STABLE FINISH). The view marker 01-A sits beside the chips. **The large "01" numeral sits on top of the INDEX button and hides "IND".**
- `stage-a-101-020vh-1440.jpg`: the content has scrolled up about 20vh and the H2 is clipped at the top. A cropped strip of the perspective film (07 laying brick) has appeared under the plan.
- `stage-a-101-040vh-1440.jpg`: transition. The perspective film fills a full-width band (y≈135–733), and a dimmed strip of the old layout (plan, "BRICK–") remains above it.
- `stage-a-101-070vh-1440.jpg`: the perspective film is full width with its view title `PERSPECTIVE 01-A · CONCEPT FILM · AI-GENERATED · NTS`. An empty black band runs above it, and the blue spine line runs down x≈72.
- `stage-a-101-000vh-390.jpg`: phone. A stray `NTS` label sits above the logo. Then come plan 01 with the 01-A marker and caption, the detail bubble and "01", the H2 "BRICKLAYING", the spec and the chips. The third chip shows faintly through the phone bar.
- `stage-a-101-020vh-390.jpg`: normal flow (no pin). Content has moved up and the plan's top runs under the transparent header.
- `stage-a-101-040vh-390.jpg`: the 01-A view marker sits on top of the INDEX button. The chips are full and the perspective film starts at the bottom.
- `stage-a-101-070vh-390.jpg`: the spec text runs through the HRCG logo (the header has no ground). Below are the chips and the perspective film (07 laying brick), with its caption behind the phone bar.

### A-103 pinned stage (sheet top = scrollY 6465 desktop / 5512 phone)
- `extra-stage-a-103-minus050vh-1440.jpg` (extra, before the sheet top): the bottom of A-102 at top. It shows the plan 02 thumbnail and the gypsum panel with the "CLEAN FINISH" beat and "02", with the panel's top edge under the INDEX button. The A-103 tag, the H2 "BOLTED ASSEMBLY", the detail circle (gloved hand, wrench on a nut), the `3 / A-103` callout and "03" follow below.
- `extra-stage-a-103-minus025vh-1440.jpg` (extra): the full A-103 detail composition. It shows the tag, the H2 (its Y runs into the circle edge), the spec, `ALIGNED · SECURE`, the detail circle with `DETAIL 3 / A-103 · CONCEPT FILM · AI-GENERATED`, the plan 03 thumbnail and caption at right, and "03".
- `stage-a-103-000vh-1440.jpg`: the iris is almost fully open. The perspective film (07 bolting at a post, tray of bolts) covers the sheet inside a frame whose left edge is still curved. The H2, the body and a right-hand panel peek out around it.
- `stage-a-103-015vh-1440.jpg`: the perspective film is fully open (x 96–1343) with `PERSPECTIVE 03-A · CONCEPT FILM · AI-GENERATED · NTS`.
- `stage-a-103-030vh-1440.jpg`: the same hold. The film has advanced, with motion blur on 07's left arm.
- `stage-a-103-060vh-1440.jpg`: the same film, moved up about 43 px so its top runs under the header lockup and the INDEX button.
- `stage-a-103-000vh-390.jpg`: phone. A stray `PLAN · NTS` label sits above the logo, and the "03" numeral touches the bottom of the INDEX button. Then come the H2 "BOLTED ASSEMBLY", the circular detail (wrench on bolt), the caption, the spec and `ALIGNED · SECURE`.
- `stage-a-103-015vh-390.jpg`: the H2 has scrolled under, and collides with, the HRCG logo. The circle, spec and beats follow, and the plan 03 thumbnail starts.
- `stage-a-103-030vh-390.jpg`: the detail circle sits under the header (logo over the image). Below are the spec, the beats, plan 03 and its caption.
- `stage-a-103-060vh-390.jpg`: the `DETAIL 3 / A-103` caption sits directly under the logo. Below are the spec, beats and plan 03, then the perspective film starting, with its caption behind the phone bar.

### A-105 pinned stage (sheet top = scrollY 9637 desktop / 8332 phone)
- `stage-a-105-000vh-1440.jpg`: the tag, then plan 05 overhead film at left with A–A section markers on a vertical cut, plus the PLAN 05 and `LINES TRACED … · DRAWING` titles. At right: the SECTION A-A film (07 crouched, tape measure) with its two-line caption, the drag hint and the body "Before the walls, pipes and fittings go in…".
- `stage-a-105-030vh-1440.jpg`: the same pinned layout. Blue gridline ticks have drawn in at the margins and between the panels, and the plan film's robot has moved to lower right.
- `stage-a-105-060vh-1440.jpg`: the cut has moved right to x≈427. In the section view, white contour lines now cover the floor below the line, so the drawing sits in front of the film.
- `stage-a-105-100vh-1440.jpg`: the cut is at x≈550. The section is mostly drawing: 07 and the tape measure appear as contour lines with blue outlines over the floor contours.
- `stage-a-105-000vh-390.jpg`: phone. The tag wraps and its second line (`DETAIL · NTS`) prints over the logo. Below are plan 05 with A markers and the two titles, then SECTION A-A with a three-line caption.
- `stage-a-105-030vh-390.jpg`: the section shows contour bands across the floor, and an "A" marker sits beside the INDEX button. The hint and body follow, and the H2 "LAYOUT AND MARKING" starts at the bottom.
- `stage-a-105-060vh-390.jpg`: the section is mostly contour drawing of 07. Below are the caption, hint, body, H2, spec, the beats ACCURATE POSITIONS / CLEAR REFERENCE LINES and the 5 / A-105 bubble.
- `stage-a-105-100vh-390.jpg`: the body text runs through the logo. Below it, the H2, spec, beats and bubble are followed by a large empty area, then the `A-200 · CONTEXT …` tag.

### A-200 pinned stage (sheet top = scrollY 12399 desktop / 9843 phone)
- `stage-a-200-000vh-1440.jpg`: the tag, then a centred row of five bay stills with `PLAN VIEWS 01–05 · CONCEPT FILM STILL · AI-GENERATED`. The rest of the viewport is empty slab.
- `stage-a-200-040vh-1440.jpg`: only an empty orange revision (HOLD) cloud outline, centred, with no text inside. Everything else is blank.
- `stage-a-200-080vh-1440.jpg`: the 1811 grid drawing at right. It shows a TRUE NORTH arrow and `THE 1811 GRID · ABOUT 29° E OF TRUE NORTH`, with the `CONTEXT · … · DRAWING · NOT A MAP` title. The left half is empty.
- `stage-a-200-120vh-1440.jpg`: the H2 "New York’s grid started as a layout." is clipped at the top and its first line overlaps the header lockup. Below it are the history paragraph and the statement "The Games are planned for New York City in 2027…". The grid at right now carries an `ABOUT 29°` arc.
- `stage-a-200-160vh-1440.jpg`: unpinned. The paragraph's last line runs through the logo. Below it are the statement, the bottom of the grid, a large empty gap, and the start of A-300 (tag, 07 head image, empty-bay plan).
- `stage-a-200-000vh-390.jpg`: phone. The tag, then a small centred row of five bay stills with caption, in a mostly empty screen.
- `stage-a-200-040vh-390.jpg`: an empty framed drawing box (grid not yet drawn) with its title and a TRUE NORTH / 1811 GRID legend line. At the bottom is the HOLD cloud with the `VENUE: HOLD` tag and "Venue to be announced on this site."
- `stage-a-200-080vh-390.jpg`: the grid is drawn with an `ABOUT 29°` angle. The HOLD cloud is unchanged at the bottom.
- `stage-a-200-120vh-390.jpg`: the grid runs under the header and the cloud sits mid-screen. The H2 and the history text start and run under the phone bar.
- `stage-a-200-160vh-390.jpg`: the `VENUE: HOLD` tag and cloud sit under, and overlap, the logo. Below are the H2, the full history paragraph and the statement.

### Non-pinned sheets, 1280x800 (scrolled to sheet top)
- `sheet-a-102-1280.jpg`: the perspective film (panel against metal studs, robot hands at left) on the left, with its title. At right is a gypsum panel with the black H2 "DRYWALL INSTALLATION", the spec, dashed stud lines with screw dots and the POSITIONED beat. A "FASTENED" beat sits behind the strip. **The panel's top-right corner cuts across the INDEX button.**
- `sheet-a-104-1280.jpg`: the isometric bay (07 with copper pipes and a drawing) with leader lines to TO THE DRAWING, CORRECT GEOMETRY and SECURE JOINTS, plus a `▸ PLAY` button. **The two captions `PLAN 04 · CONCEPT FILM · AI-GENERATED` and `TASK DRAWING TRACED FROM CONCEPT FOOTAGE · DRAWING` print on top of each other, as do their NTS labels.** The H2 "PIPE" shows, and "ASSEMBLY" is hidden behind the strip.
- `sheet-a-300-1280.jpg`: the tag `A-300 · FOR TEAMS · RFI-001 · NTS` prints over the logo. Below are the 07 detail illustration with its two-line disclaimer title, the empty-bay plan with the `YOUR ROBOT` stencil and `READY FOR 01 02 03 04 05`, the H2 "07 ISN’T REAL. YOURS IS." and the stand-in paragraph.
- `sheet-a-301-1280.jpg`: on gypsum. It shows the tag, five material stills (MAT 01–05) with keynote number boxes, `MATERIALS · CONCEPT ILLUSTRATION · AI-GENERATED · NOT SPONSOR PRODUCTS`, the H2 "PUT YOUR PRODUCT IN A ROBOT’S HANDS" (third line behind the strip) and keynotes 1 and 2 at right.
- `sheet-a-900-1280.jpg`: on gypsum. It shows the tag `A-900 · GENERAL NOTES · END OF SET`, the H2 "General notes." and six numbered question rows with arrows. The right half of the sheet is empty.

### A-300 form state (PLATFORM = "Lab Biped Mk2", 01 and 03 ticked)
- `a300-typed-grid-1440.jpg`: at left, the bay view shows the stencil `LAB BIPED MK2` in its slot and `READY FOR 01 03`, with 02, 04 and 05 dimmed. At right: RFI-001, the empty FROM field, PLATFORM "Lab Biped Mk2", chips 01 BRICKLAYING and 03 BOLTED ASSEMBLY filled black with yellow keylines, the empty field 3, and `Discuss competing →`. The `Or email … COPY ADDRESS` row shows faintly through the strip.
- `a300-typed-ticks-1440.jpg`: the form scrolled up. The FROM row sits under the header and the form's top-right corner lies under the INDEX button. It shows the ticked chips, `Discuss competing →`, the privacy note, and `Or email hello@example.com` with `COPY ADDRESS`. The paper ends at y≈737 on slab.
- `a300-typed-grid-390.jpg`: phone. The H2 "PROVE THE WORK." is clipped under the logo. Below are the audience line and body, the dark sticky mini-slot (`LAB BIPED MK2`, `READY FOR 01 03`), RFI-001, FROM, PLATFORM "Lab Biped Mk2", and the chip list with 01 and 03 filled black.
- `a300-typed-ticks-390.jpg`: phone. The "Your team or lab" placeholder collides with the logo, and the mini-slot stays pinned under the header. Below are the five chips (01 and 03 filled), the help text, field 3, and `Discuss competing →` in its orange-filled state (cause not checked; possibly hover from the emulated pointer).
- Captured state for both sizes: the slot texts are `["LAB BIPED MK2","LAB BIPED MK2"]`, and READY marks 01 and 03 in every bay view. The mailto body carries `1. Platform: Lab Biped Mk2` and `2. Challenges we're ready for: Bricklaying, Bolted assembly`.

### Overlays (opened while on A-103)
- `index-open-1440.jpg`: the full-screen DRAWING INDEX (`HRCG-2027 · PLANNED · 11 SHEETS · NTS`). It lists eleven rows from A-000 COVER to A-900 GENERAL NOTES. COVER and BOLT IT. are solid; BOLT IT. carries an orange current-sheet square. The other titles are outline type, with challenge names at right. At the bottom are `▸ WATCH THE SET (0:30) · CONCEPT FILM: AI-GENERATED CONCEPT FOOTAGE` and `CLOSE (ESC)`.
- `index-open-390.jpg`: phone INDEX. The same eleven rows with challenge names under the titles, and A-103 marked orange. The WATCH THE SET button is cut off at the bottom edge (needs a scroll).
- `title-sheet-open-390.jpg`: the phone title-block bottom sheet over the dimmed A-103. It shows `TITLE BLOCK · HRCG-2027 · PLANNED`, PROJECT, STATUS · PLACE · YEAR, DATE · VENUE with the HOLD cloud, IMAGERY, `SHEET A-103 · BOLTED ASSEMBLY`, `MOTION ON`, two CTA cells (Bring the robot → / Bring your product →) and CLOSE.

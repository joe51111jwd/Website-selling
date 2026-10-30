# BRIEF: THE TITLE (slug `the-title`)

**Pitch for James:** The homepage is the book's title, set as one huge line of real-feeling type in the cover's three colours, with Michael's one-line meaning under each word: "Up for growth. Side for stability. Down for pruning." It opens on the problem ("SCALING UPSIDE DOWN", red and leaning). Two hyphen blocks drop in and the words snap into the rhythm. Then you hold UP to see what happens when a founder only pushes growth.

**Built from:** judges #1 *Two Hyphens* (inversion-1), #2 *The Hyphens* (type-1) and #3 *The Beat* (cycle-1), merged into one option because all three are the same idea: the title is the argument. It keeps inversion-1's first screen (the best five-second score in the set), type-1's and cycle-1's rhythm intro (the nearest thing to the "scaling soundbar" James loved), and cycle-1's "Hold UP" mechanic (the clearest cause and effect).

**Judges' criticisms, fixed here:**
- *Heavy three.js / TextGeometry / SVG lighting pipeline.* Replaced by DOM type with CSS relief and a pointer-driven light. It is crisp and buildable tonight.
- *Extruded type tips into WordArt.* The relief is shallow, matte and edge-only: no bevel, no gloss, no gradient face.
- *Words landing upside down recalls the Flip.* Nothing ever turns over. The collapse is the hyphens closing plus a 3° lean, under the sentence that explains it.
- *Music stave reads as "a music book".* No stave, no 3/4, no repeat sign.
- *Who-for is a 13 px row.* It is an 18 px line on the first screen.
- *An endless loop feels like a GIF.* The idle beat stops after four bars and resumes on pointer movement.

---

## 1. The big idea

Michael: "The title is the argument. It unfolds across three parts." (BL 782). Without hyphens, *Scaling Upside Down* is the trap. With two hyphens, *Scaling Up-Side-Down* is the operating system: Up for growth, Side for stability, Down for pruning. Reduced to its initials, *USD* is the scoreboard. So the page has one object only, the title, and every state of that object is a sentence of the book. Looking at the picture is reading the message, because the picture is the words. The only nod to Michael's beloved blocks is that the two hyphens are small ink blocks: the rhythm is literally built from them.

## 2. The five-second test (must pass from the first screen alone)

A stranger must be able to say: *"It's Michael Wentz's book. It says most founders aren't really scaling; real scaling is a cycle: up to grow, side to stabilise, down to prune. It's for bootstrapped founders with teams of up to 12. I can get the Bootloader file or the book."*

### Desktop 1440×900, the 3.0 s frame (end of the intro), everything centred on the vertical axis; the content block from ~170 to ~696 px sits optically centred
| y (top of element) | Element | Spec |
|---|---|---|
| 0–64 px | Top rail | Left: `MICHAEL WENTZ` (Archivo wdth 100, wght 600, 13 px, tracking +0.14em, ink). Right: `The book` (text link) and `Get the Bootloader` (ink pill, 36 px tall, cream text). Padding 24 px 40 px. No logo. |
| ~170 px | Diagnosis | "Most founders think they’re scaling. They’re not." Archivo wdth 100, wght 500, 34 px, ink. The words "They’re not." are in Down red. One line. |
| ~248 px | "SCALING" | Archivo wdth 125, wght 700, 26 px, tracking +0.32em, ink. |
| ~296–454 px | **UP-SIDE-DOWN** | One line fitted to **86vw (≈1240 px)**. Archivo, wght 900, resting wdth 112, font-size computed by the fit routine (expect ≈150–165 px, cap height ≈110 px). UP in green, SIDE in ochre, DOWN in red. The two hyphens are ink blocks (0.36em × 0.13em, radius 0.02em), centred vertically on the cap height. Shallow relief and soft cast shadow (§5). This is the biggest and brightest thing on the screen. |
| ~480 px | Job lines | Directly under each word and centred on it: "Up for growth." / "Side for stability." / "Down for pruning." Archivo wdth 100, wght 500, 26 px, ink. Each has a 3 px underline in its word's colour, the width of the text, 8 px below the baseline. |
| ~584 px | Who-for | "A book by Michael Wentz · For bootstrapped founders · Teams of 1–12". Archivo wdth 100, wght 600, **18 px**, ink at 85%. |
| ~640 px | Two actions, 16 px apart | Primary: ink pill, 56 px tall, padding 0 28 px, label "Get the Bootloader" (17 px, wght 700) with a second line "V16 · 35,445 words" (12 px, wght 500, cream at 70%). Secondary: outline pill (1.5 px ink), 56 px tall, label "The book · Pre-orders open soon". Both scroll to `#paths`. |
| ~840 px | Scroll cue | A 10 px chevron in ink at 50%, bobbing 4 px on a 1.6 s ease-in-out loop (it stops after 3 loops). |

Squint test: the tri-colour title line dominates. The next-strongest things are the diagnosis and the three job lines, which are all words.

### Phone 390×844, the 3.0 s frame
| y | Element | Spec |
|---|---|---|
| 0–48 | Rail | `MICHAEL WENTZ` 11 px left; `Get the Bootloader` 11 px caps link right. 16 px gutters. |
| ~68 | Diagnosis | 22 px, two lines, centred. |
| ~142 | "SCALING" | 15 px, tracking +0.3em. |
| ~170–560 | Title, **stacked like the cover** | Three rows: `UP▪` / `SIDE▪` / `DOWN`. The hyphen blocks sit at the ends of the first two rows, like real hyphenation. Each row is Archivo wght 900, wdth 105, font-size **25vw (≈98 px)**, line-height 0.92. Under each row, centred: its job line at 17 px wght 500 with a 2 px underline. Row and line pitch ≈126 px. |
| ~590 | Who-for | 15 px wght 600, two lines: "A book by Michael Wentz ·" / "For bootstrapped founders · Teams of 1–12". |
| ~660 | Actions | Two full-width (358 px) pills, 52 px tall, 10 px apart: "Get the Bootloader · V16 · 35,445 words" (ink) and "The book · Pre-orders open soon" (outline). |

### The 600 ms frame (both sizes)
The diagnosis line is in, and under it "SCALING / UPSIDE DOWN" sits as one red, leaning slab with no hyphens. That is already the book's diagnosis, so a screenshot taken mid-intro still makes sense.

---

## 3. Section-by-section flow

Six sections. Sections 01, 02, 03 and 06 are **MUST**. Sections 04 and 05 are **SHOULD**: build them last, and cut them if time runs short. Copy keys refer to the copy deck in §9.

### 01 · HERO (`#top`, 100svh, not pinned)
- Copy: `hero.diagnosis`, `hero.scaling`, `hero.words`, `hero.jobs`, `hero.who`, `hero.getBtn` + `hero.getMeta`, `hero.bookBtn`.
- The `<h1>` holds `<span class="sr-only">Scaling Up-Side-Down</span>` and an `aria-hidden` visual title. The accessible name is *always* "Scaling Up-Side-Down", even while the visual reads UPSIDE DOWN.
- Motion: the intro timeline (§4.1), then the idle life (§4.2).

### 02 · SKIP A LEG (`#skip`, min-height 100svh, not scroll-scrubbed): the signature interaction
- Layout (desktop), centred:
  - y 13%: `skip.headline` at 52 px (Archivo wdth 100, wght 700, `text-wrap: balance`).
  - y 22%: `skip.sub` at 28 px wght 500 in Down red.
  - y 32–56%: the title again, fitted to 70vw (≈118 px), with its job lines at 22 px.
  - y 64%: the caption slot, 36 px wght 600, one line. It rests on `skip.rest` ("Real scaling is cyclical.").
  - y 76%: the control, a pill 64 px tall and at least 260 px wide, in Up green with cream text: `skip.control` ("Hold UP") with a ↑ glyph, and `skip.controlHint` under it at 13 px.
- The live beat runs here while the section is at least 50% in view: UP → SIDE → DOWN, one strike every 1400 ms, with the active job line's underline thickening from 3 to 5 px.
- The full state machine and timings are in §4.3.
- Phone: the title uses the three stacked rows at 18vw. The collapse merges rows: SIDE slides up into row 1 beside UP to make `UPSIDE`, DOWN stays in row 2, and the stack leans 3°. The control is full width, 56 px tall, and sits in the thumb zone.

### 03 · REPEAT (`#repeat`, sticky stage inside a 240vh section on desktop; on phone two plain 100svh blocks)
Progress p runs from 0 to 1 over the section, computed from `getBoundingClientRect` in the rAF loop.
- **Beat A, p 0 → 0.48.**
  - `repeat.headline` ("Up. Side. Down. Repeat.") at 72 px Archivo wdth 112, wght 800. "Up." is green, "Side." is ochre-ink, "Down." is red and "Repeat." is ink.
  - Below it, a **staircase of three small title lockups** (`UP▪SIDE▪DOWN` at 44 px), set left to right across 900 px. Each lockup sits 56 px higher than the one before. Each is joined to the next by an ink hairline (1.5 px) that runs flat under the lockup, then rises.
  - Lockup k strikes in when p crosses 0.08, 0.18 or 0.28: its three words strike in sequence at 120 ms spacing, then its connector draws over 300 ms.
  - A label sits under each lockup: `repeat.cycleLabels[k]`, 11 px caps.
  - At p ≥ 0.32, `repeat.deposit` fades up at 30 px wght 500, max-width 900 px.
- **Beat B, p 0.52 → 1.** Beat A crossfades out (250 ms).
  - `repeat.twelve` at 34 px wght 600.
  - Under it, three centred columns, 300 px wide each and 48 px apart, headed **UP / SIDE / DOWN** at 48 px in their colours (same relief as the hero).
  - Each column lists its four systems (`repeat.systems.*`) at 19 px Archivo wdth 87.5, wght 500, line-height 1.55.
  - The names drop in (y −8 → 0, opacity) with a 35 ms stagger when p crosses 0.56.
- Phone: Beat A's staircase climbs vertically. The three lockups are at 30 px, each one 8vw further right and 64 px higher. Beat B's columns stack (UP list, SIDE list, DOWN list), each headed at 34 px.

### 04 · USD (`#usd`, sticky inside 160vh on desktop; on phone one 100svh block driven by IntersectionObserver), SHOULD
- `usd.label` sits at the top in 11 px caps, tracked.
- The title sits centred at 10vw. Over p 0 → 0.6:
  - The letters P, I, E, O, W, N and both hyphen blocks lose their ink (fade to the blind paper shade over 250 ms), then drop 0.3em and fade out.
  - U, S and D slide together (FLIP, spring k200 c26) into **USD** at about 16vw: U green, S ochre, D red.
  - A 0.07em ink bar then draws vertically through the S (scaleY 0 → 1, 300 ms, easeOutCubic), so it reads U$D.
- At p ≥ 0.6, `usd.line` fades in at 34 px, max-width 980 px.

### 05 · FOR / NOT FOR (`#fit`, 100svh desktop, auto height on phone), SHOULD
- `fit.headline` is set with scale contrast. Each "big" is Archivo wght 900 at 9vw. Each "small" is wght 400 at 1.8vw. The other words are wght 500 at 3vw. The whole thing is on one balanced line, or two.
  - Build it from the single verbatim string by wrapping those words in spans. Do not split the string in `copy.ts`.
- Below it, two centred columns, 64 px apart.
  - Left, head `fit.forHead` in green 13 px caps, then the seven `fit.isFor` items in ink, 22 px wght 600, one per line.
  - Right, head `fit.notHead`, then the seven `fit.notFor` items in `--ink-60` at 20 px wght 500 with the relief light only. They read as "pressed out", not inked.
  - The items enter with a 40 ms stagger.
- Phone: the headline breaks into three lines with "big" at 18vw. The columns stack, "For" first.

### 06 · TWO PATHS (`#paths`, 100svh), MUST
- Header across two columns: `paths.bookHead` above the left column and `paths.fileHead` above the right, each at 40 px wght 700.
- **Left, the book.**
  - A typographic cover, 300×440 px, on paper `#EFE6D8` with the relief shadow. It carries `SCALING` at 14 px tracked, then UP / SIDE / DOWN stacked in the three inks at 64 px wght 900 with SIDE nudged 18 px right (the cover's offset), and `Michael Wentz` at 14 px at the foot.
  - Under it, `paths.bookLine` at 24 px wght 500, max-width 460 px.
  - Then the "Pre-orders open soon" button (S4).
- **Right, the file.**
  - A stack of three sheets, 360×460 px: CSS layers offset 6 px and 12 px down and right, each with its own soft shadow, on paper `#F6F1E8`.
  - The top sheet shows `paths.fileName` (Archivo wdth 62, wght 600, 15 px) and `paths.fileMeta` (12 px). Below them, `paths.fileFace` at 11 px in ink at 35%, as the file's real first headings.
  - Under the stack: `paths.upload` and `paths.locate`, 20 px, on two lines.
  - Then the form: a 360×56 px email input (paper fill, 1.5 px ink border, radius 6 px) and the submit button `paths.submit` ("Get the file"). The button is an ink block 56 px tall with cream text. It is a scaled-up hyphen block, the same object as the rhythm.
- **Signature confirmation** (S4 rules), 1300 ms total:
  - The button presses: translateY 3 px over 90 ms, and its shadow tightens.
  - The three words UP · SIDE · DOWN flash across the top sheet as a stamped row. Each takes 120 ms and holds in its colour, at 28 px wght 900.
  - A red **"Yours"** stamp lands on the sheet: Archivo wdth 125, wght 900, 64 px, rotated −6°, red, `mix-blend-mode: multiply`. It scales 1.3 → 1 while its blur goes 2 px → 0, over 180 ms easeOutCubic.
  - The sheet stack settles 2 px.
  - After a 400 ms hold, the page navigates to `LINKS.get`.
- `paths.appendix` link under the form.
- Phone: the file comes first, then the book. Both are full width and stacked. The sheet stack is 300×360 px.

### Footer
`footer.line` at 16 px, centred, with "Read the Appendix". Ink on paper.

### Persistent navigation
- Desktop, after the hero leaves the viewport: a 48 px solid-paper bar (no blur, hairline bottom border). Left: a 14 px `UP▪SIDE▪DOWN` lockup in the three colours. Right: `The book` and `Get the Bootloader`, both linking to `#paths`.
- Phone: a sticky bottom bar with two buttons appears after the hero. It hides while `#skip` is in view, so it never fights the hold control.

---

## 4. Signature interaction and motion spec

Easing tokens:
- `easeOutCubic` cubic-bezier(.33,1,.68,1)
- `easeOutQuint` cubic-bezier(.22,1,.36,1)
- `easeInCubic` cubic-bezier(.32,0,.67,0)
- `easeInOutCubic` cubic-bezier(.65,0,.35,1)

Springs use mass 1 and semi-implicit Euler at fixed 1/120 s substeps. k is stiffness and c is damping.

### 4.1 Intro timeline (hero; t = 0 at `document.fonts.ready`, capped at 1200 ms)
Any wheel, touch, key or click during the intro jumps to the end state with a 200 ms crossfade.

| t (ms) | What happens |
|---|---|
| 0–300 | The rail fades in (opacity, easeOutCubic). |
| 80–560 | The diagnosis words rise: each goes y 12 → 0 px with opacity 0 → 1 over 380 ms easeOutQuint, with a 35 ms stagger. |
| 250–500 | "SCALING" and the **trap line** appear. The hyphen gaps are closed: gap 1 is 0, and gap 2 is one word space (0.26em). The hyphen blocks wait above the viewport. All three words are Down red. The line is rotated −2.5° about its left-bottom corner. It fades in with opacity 0 → 1 and scale .985 → 1 over 250 ms easeOutCubic. |
| 700–960 | **Hyphen block 1 falls** from above the viewport into gap 1 over 260 ms easeInCubic. On contact the block squashes, scaleY .86 → 1 over 110 ms. Gap 1 opens 0 → 0.42em on a spring (k520 c34), done with transforms: UP moves left and SIDE/DOWN move right. The line's rotation springs −2.5° → −1.2°. |
| 880–1140 | **Hyphen block 2 falls** into gap 2 (0.26em → 0.42em). The rotation springs to 0° (k300 c26, overshoot under 0.3°). |
| 1150–1450 | **The inks split**: UP fades red → green and SIDE red → ochre, each over 300 ms easeInOutCubic. DOWN stays red. |
| 1300 | **Beat UP**: scaleY 1 → 1.16 (origin bottom) over 90 ms easeOutCubic, a 50 ms hold, then back to 1 over 520 ms easeOutQuint. "Up for growth." rises in (y 10 → 0, 360 ms easeOutQuint) and its underline draws (scaleX 0 → 1 from the left, 300 ms). |
| 1750 | **Beat SIDE**: `wdth` 112 → 125 and letter-spacing 0 → 0.015em over 90 ms, then back over 520 ms. UP and hyphen 1 translate −Δ/2 while hyphen 2 and DOWN translate +Δ/2, where Δ is SIDE's width gain, measured once. "Side for stability." comes in. |
| 2200 | **Beat DOWN**: translateY 0 → 0.06em, `wdth` 112 → 90 and scaleY 1 → .94 over 90 ms, then back over 520 ms. "Down for pruning." comes in. |
| 2500–2800 | The who-for line, the two actions and the scroll cue rise in: y 8 → 0 with opacity, 300 ms, 60 ms stagger. |
| ≥ 2800 | Rest. |

### 4.2 Idle life (hero)
- **Light.** `--lx` and `--ly` lie in [−1, 1] and follow the pointer relative to the viewport centre, lerped at 0.08 per frame. On touch devices they drift on a slow Lissajous: period 14 s, amplitude 0.35.
- **Beat.** Every 12 s while the hero is at least 50% visible and the tab is visible, one soft bar plays: UP, SIDE and DOWN strike at 450 ms spacing at 40% of the intro amplitude, and the active underline goes from 3 to 5 px. After 4 bars the beat stops until the pointer moves again.

### 4.3 "Hold UP": the skip-a-leg state machine (section 02)
States: `beat → pushing → collapsed → recovering → beat`.

**Input.** Hold the control or the big UP word with the pointer (`pointerdown` and `setPointerCapture`), or hold Space or ArrowUp while the control has focus. Ignore key auto-repeat. Release is `pointerup`, `pointercancel`, `keyup` or `blur`.

| State / event | What happens |
|---|---|
| `beat` | The auto-beat runs: one strike every 1400 ms, the active job line's underline at 5 px. The caption reads `skip.rest`. |
| press → `pushing` | The auto-beat stops. **Four forced UP strikes** play at 0, 700, 1220 and 1600 ms, each faster than the last. Each strike is scaleY 1 → (1.16 + 0.03 × i), with a 70 ms attack and a 300 ms release. With each strike: SIDE's and DOWN's ink fades in steps (100% → 60% → 30% → 0%, ending as blind relief); the hyphen blocks shrink (0.36em → 0.26 → 0.16 → 0.06em); and the caption swaps to `skip.week[0]`, `[1]`, `[2]`, then `skip.settled` on the 4th strike. The caption swap takes old text up and out in 160 ms, then new text in over 220 ms. The control label becomes `skip.controlHeld`. |
| release before the 4th strike | Ease back to `beat`: SIDE and DOWN re-ink over 400 ms, the hyphens regrow on a spring (k300 c26), and the caption returns to `skip.rest`. |
| 4th strike + 150 ms → `collapsed` | The hyphen blocks snap shut over 120 ms easeInCubic: gap 1 to 0, gap 2 to one word space. The words slide together on a heavy spring (k600 c40, about 260 ms) into **UPSIDE DOWN**, done with transforms to target positions measured from a hidden "UPSIDE DOWN" layout. The inks flood to Down red from left to right (60 ms stagger per word, 220 ms each). The line leans −3° about its left-bottom corner (spring k260 c20). A 1 px page shake plays on impact (translateX ±1 px, 2 cycles, 120 ms). The caption reads `skip.collapsed`. It stays collapsed for as long as the input is held. |
| release → `recovering` | **+0 ms, SIDE beat:** SIDE re-inks ochre and strikes wide, hyphen 1 regrows, the lean eases to −1.5°, and the caption reads `skip.jobs[1]`. **+600 ms, DOWN beat:** DOWN strikes, hyphen 2 regrows, the line levels to 0°, and the caption reads `skip.jobs[2]`. **+1200 ms:** UP turns back to green, the caption returns to `skip.rest`, and the state is `beat` again. Side first, then Down: the only way back the book allows. |

Rules for the sequence:
- **Auto-demo.** The first time `#skip` is at least 60% visible, wait 2.5 s with no interaction, then run the whole sequence once by itself. The control shows a pressed state and a progress ring, the title holds `collapsed` for 1600 ms, then it recovers. This happens once per page load.
- **Announcements.** The live region announces only `skip.collapsed` and `skip.rest`, never each strike.
- **Reduced motion.** There is no auto-beat and no auto-demo. The control becomes a toggle `<button aria-pressed>` labelled `skip.toggleOn` / `skip.toggleOff`. It switches between the level title and the collapsed title with a 150 ms crossfade, and the captions swap instantly (`skip.collapsed` ↔ `skip.rest`).
- **Debug param.** `?state=collapsed` renders section 02 in its collapsed end state and scrolls to it, for the screenshot.

### 4.4 Scroll
- Lenis 1.1.13 runs on desktop only (`syncTouch: false`), on the shared rAF loop.
- Sticky stages are `position: sticky; top: 0; height: 100svh` inside taller sections.
- Under reduced motion, or at a width of 700 px or less, the sticky sequences in 03 and 04 become stacked blocks that reveal on IntersectionObserver at 40% visibility.

---

## 5. Art direction

**The look in one line:** a typographic monument. The book cover's three inks, set as physical type on warm paper, and nothing else on the page.

**Type.** **Archivo** (Google Fonts, OFL) is the only family, used across its axes: wdth 62–125 and wght 100–900.
- Install `@fontsource-variable/archivo` and import the CSS file that includes the `wdth` axis. List `node_modules/@fontsource-variable/archivo/*.css` to find it.
- If no file has the `wdth` axis, use `https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@62..125,100..900&display=swap`.

| Role | Axes | Notes |
|---|---|---|
| Title words | wght 900, resting wdth 112 | Animated: wdth 90–125 |
| Sentences | wdth 100, wght 500–700 | |
| Labels | wdth 100, wght 600 | Caps, tracking +0.14em |
| Filename | wdth 62, wght 600 | |

Use tabular lining figures for 35,445.

**Colour tokens** (in `:root`):
```css
--paper:#F1EADF;  --paper-shade:#E6DCCB;  /* blind (inkless) type */
--ink:#1C1A17;    --ink-85:rgb(28 26 23/.85);  --ink-60:#6E6A62;   /* 4.58:1 on paper */
--up:#2B5A37;     --up-edge:#1C3C25;      /* 6.71:1 on paper */
--side:#D49B2C;   --side-edge:#9C6E19;    /* logotype + fills only (2.06:1, too light for text) */
--side-ink:#A87414;                       /* ochre TEXT ≥ 24px (3.40:1) */
--down:#B2322A;   --down-edge:#7F211B;    /* 5.20:1 on paper */
```

**Relief.** This is the depth James asked for, put into the words themselves. Each title word has a solid matte face colour and this shadow stack, where `--lx` and `--ly` come from §4.2:
```css
text-shadow:
  calc(var(--lx) * -0.006em) calc(0.006em + var(--ly) * -0.004em) 0 var(--edge),
  calc(var(--lx) * -0.012em) calc(0.012em + var(--ly) * -0.008em) 0 var(--edge),
  calc(var(--lx) * -0.018em) calc(0.018em + var(--ly) * -0.012em) 0 var(--edge),
  calc(var(--lx) * -0.05em)  calc(0.06em  + var(--ly) * -0.04em)  0.08em rgb(28 26 23 / .16),
  0 0.01em 0.015em rgb(28 26 23 / .25);
```
- The hyphen blocks use the same stack as `box-shadow`.
- No gradient on the face, no bevel and no specular highlight. If it starts to look like WordArt, reduce the edge layers to two.

**Texture.** A paper grain over the whole page: an SVG `feTurbulence` data URI (fractalNoise, baseFrequency 0.8, 3 octaves, stitched, 240 px tile) on a `position: fixed` pseudo-element at 7% opacity with `mix-blend-mode: multiply`. No vignette, no stains.

**Grid and scale.**
- Desktop: a 12-column grid, max content width 1320 px, 24 px gutters. Everything is centred on the axis. The only left-aligned text is inside the form fields.
- Type scale: title (fit) / 72 / 52 / 40 / 34 / 28 / 26 / 22 / 18 / 13.
- Phone: 16 px gutters.

**Why it is its own style:**
- It is not Apple: no black stage, no product, no system sans.
- It is not an AI template: no gradients, glass or cards.
- It is not flat: the words have mass, light and a cast shadow, and they move like struck type.
- It is not the blocks: the words are the object, and the only blocks left are the two hyphens.

## 6. The ending
See section 06 and S4. The book is on the left (on phone it comes second). The file is on the right, with the "Get the file" ink block and the stamp confirmation. Both "Read the Appendix" links go to `LINKS.appendix`.

## 7. Layout summary, desktop 1440 vs phone 390
| Section | Desktop 1440×900 | Phone 390×844 |
|---|---|---|
| 01 Hero | One-line title at 86vw with job lines under each word; everything in one viewport | Three stacked rows at 25vw with job lines; everything in one viewport |
| 02 Skip a leg | Title at 70vw; control centred | Rows at 18vw; full-width control in the thumb zone; rows merge into UPSIDE / DOWN |
| 03 Repeat | Sticky 240vh: staircase, then 3 columns | Two stacked blocks: vertical staircase, then stacked lists |
| 04 USD | Sticky 160vh | One block |
| 05 Fit | Big/small line and two columns | Three-line headline; columns stacked |
| 06 Paths | Two columns: book left, file right | File first, then book, full width |

## 8. Tech plan

- **Stack:** Vite + React + TypeScript (S1). `lenis@1.1.13`. No three.js, no GSAP, no canvas.
- **Files:**
  - `components/Title.tsx` renders words and hyphen blocks from a typed state: `{ mode: 'trap'|'level'|'collapsed', ink: {up,side,down}, gap1, gap2, lean, strikes }`.
  - `motion/spring.ts` is about 40 lines.
  - `motion/timeline.ts` is a small keyframe scheduler on the shared rAF loop.
  - `hooks/useLight.ts`, `hooks/useScrollProgress.ts`, `hooks/useReducedMotion.ts`.
  - `sections/Hero.tsx`, `SkipALeg.tsx`, `Repeat.tsx`, `Usd.tsx`, `Fit.tsx`, `Paths.tsx`.
- **Fit routine:**
  - After `document.fonts.ready`, measure the title line at a 100 px font-size with resting axes. Set the font-size to `target / measured × 100`.
  - Also measure and cache the widths of the "UPSIDE DOWN" layout, so the collapse can be done with transforms.
  - Re-measure on a `ResizeObserver` callback, debounced to 100 ms.
- **No reflow while animating.** Each word is an `inline-block` whose width is locked to its resting width after the fit. Variable-axis changes render inside that box with `overflow: visible`. Neighbours are pushed with `translateX`, using deltas measured once per fit. Use `contain: layout paint` on the line and `will-change: transform` on the words.
- **Colour interpolation:** lerp in OKLCH, or use simple sRGB for these short fades.
- **Budget:** JS at most 80 KB gzipped. Archivo variable latin woff2 at most 120 KB. No other assets.
- **Accessibility, specific to this option:**
  - The `<h1>` accessible name never changes.
  - The hold control is a `<button>` with `aria-describedby` pointing at the headline.
  - Live caption announcements follow §4.3.
  - The "Not for" list is muted but still at least 4.5:1 (`--ink-60`).
- **Debug params:**
  - `?state=collapsed` shows section 02 collapsed.
  - `?skipintro=1` shows the hero end state at once.
  - `?section=usd` scrolls to section 04 and shows its end state.
- **Extra screenshots to capture:** `?state=collapsed` (desktop and phone), and `#paths` after a valid submit with navigation blocked by `?nonav=1`, showing the "Yours" stamp.

## 9. Copy deck: paste as `src/copy.ts`
Every string below was checked against its cited line in the sources, and the block passes `tools/copycheck.mjs`.

```ts
// src/copy.ts for THE TITLE. Every sentence is Michael's, word for word.
// BL n = line n of source/public_bootloader.md. M Ln = manuscript line n, as recorded in source/src_copy.ts.
// Lines marked `// label` are UI labels/buttons (not sentences) and are exempt from copycheck.
export const COPY = {
  rail: {
    author: "Michael Wentz", // label
    book: "The book", // label
    get: "Get the Bootloader", // label
    appendix: "Read the Appendix", // label
  },
  hero: {
    diagnosis: "Most founders think they’re scaling. They’re not.", // BL 794 (1st + 2nd sentences of the Part I cell)
    diagnosisRed: "They’re not.", // BL 794 (the second sentence, coloured red; same string as above)
    scaling: "Scaling", // label (title)
    words: ["UP", "SIDE", "DOWN"], // label (title)
    jobs: ["Up for growth.", "Side for stability.", "Down for pruning."], // BL 795
    who: "A book by Michael Wentz · For bootstrapped founders · Teams of 1–12", // label
    getBtn: "Get the Bootloader", // label
    getMeta: "V16 · 35,445 words", // label
    bookBtn: "The book · Pre-orders open soon", // label
  },
  skip: {
    headline: "The hyphens aren’t decoration—they’re the rhythm.", // BL 795
    sub: "Skip a leg, tip upside down.", // BL 795
    rest: "Real scaling is cyclical.", // BL 795
    week: ["Always launching.", "Always hiring.", "Always adding."], // M L1993 (shown one sentence per forced beat, in order)
    settled: "But inside, nothing ever settled.", // M L1995
    collapsed: "We were Scaling Upside Down.", // M L461
    control: "Hold UP", // label
    controlHint: "or hold Space", // label
    controlHeld: "Let go", // label
    toggleOn: "Skip a leg", // label (reduced-motion toggle)
    toggleOff: "Put it back", // label (reduced-motion toggle)
  },
  repeat: {
    headline: "Up. Side. Down. Repeat.", // M L1713
    cycleLabels: ["Cycle 1", "Cycle 2", "Cycle 3"], // label
    deposit: "Each cycle deposits systems and margin. The next cycle withdraws from a larger account.", // BL 866
    twelve: "Four for Scaling Up, four for Scaling Sideways, four for Scaling Down. Twelve.", // M L3119
    systems: {
      up: ["Content & Product Creation", "Lead Generation", "Lead Conversion", "Customer Success & Retention"], // BL 2007-2010
      side: ["Team & Roles", "Systematization", "Technology, Automation & AI", "Inventory & Fulfillment"], // BL 2007-2010
      down: ["Profitability Optimization", "Risk Management", "Operational Efficiency", "Product Quality & Delivery"], // BL 2007-2010
    },
  },
  usd: {
    label: "Part III · The Scoreboard", // label (BL 796 cell labels)
    line: "The dollar sign isn’t clever wordplay—it’s the proof. If margins aren’t widening, you’re not scaling.", // BL 796
  },
  fit: {
    headline: "Too big to be small, too small to be big", // BL 4777
    forHead: "For", // label
    notHead: "Not for", // label
    isFor: ["Bootstrapped / self-funded", "Founder-led", "1-12 employees", "Rented-scale physics", "Stuck between sizes", "Margin matters", "Tired of traditional advice"], // BL 4773-4779
    notFor: ["Venture-backed", "40+ employees", "Pure lifestyle business (no systems)", "Pre-revenue / idea stage", "Seeking 10x growth", "Exit-focused (flip in 2-3 years)", "Already at Team of Teams"], // BL 4787-4793
  },
  paths: {
    bookHead: "The pages are reference.", // M L4497 (1st sentence)
    fileHead: "The file is the operating system.", // M L4497 (2nd sentence)
    bookLine: "You were never the problem. The model you inherited was.", // M L216
    bookTitle: "Scaling Up-Side-Down", // label
    bookAuthor: "Michael Wentz", // label
    preorder: "Pre-orders open soon", // label
    fileName: "SUSD_Bootloader_V16.md", // label (version per BL 747)
    fileMeta: "V16 · October 2026 · 35,445 words", // label
    fileFace: ["# THE SUSD BOOTLOADER", "## Scaling Up-Side-Down Operating System — Front Matter", "## PURPOSE"], // BL 1-6 (headings shown faint on the file face)
    upload: "Upload the file and use the starting prompt provided with it.", // M L4531
    locate: "Then let the system locate you.", // M L4533
    email: "Email address", // label
    placeholder: "you@company.com", // label
    badEmail: "Enter your email address.", // label
    submit: "Get the file", // label
    stamp: "Yours", // label
    appendix: "Read the Appendix", // label
  },
  footer: {
    line: "Up. Side. Down. Repeat.", // M L1713
  },
};
```

## 10. What NOT to do (the traps most tempting for this concept)

1. **Never leave the resting hero as "UPSIDE DOWN".** That reading is the problem (BL 3960-3961). It shows only for the first ~700 ms of the intro and in the hold state of section 02.
2. **No turning over.** Words never rotate past 3°, and the page never flips. James: "the flip doesn't make any sense. I don't get the flip."
3. **No WordArt.** Use matte faces and edge-only relief. No bevels, gloss, gradient faces, chrome, glow, outer strokes or 3D-text presets. Three.js extruded type is out for this build.
4. **No music notation.** No stave, no 3/4, no repeat sign, no metronome. The rhythm is told by the words alone.
5. **No endless loop.** After the intro, the hero beats at most four soft bars. Section 02 beats only while it is in view.
6. **No ochre text below 24 px.** Use `--side-ink` for any ochre text. Cover ochre `#D49B2C` is for the logotype, fills and lines only.
7. **Do not shrink the who-for line** below 18 px on desktop or 15 px on phone, and do not move it to a corner. Without it, the five-second test fails.
8. **Do not add blocks back.** No wooden texture, no tower, no stacking cubes. The two hyphen blocks are the only blocks.
9. **No left-aligned captions** next to the title. Every line is centred under, or on, the object.
10. **Do not let SIDE's widening reflow the line.** Push the neighbours with transforms (§8). A jittering title reads as cheap.
11. **No paraphrased job lines.** It is "Up for growth." and never "Grow" or "Scale up".

---

## S. Shared build rules (identical in all four briefs)

These apply on top of everything above. Where this section and the option-specific sections disagree, the option-specific section wins.

### S1. Where and with what

- Build in a new folder: `/home/user/Website-selling/susd-options/<slug>/` (the slug is in this brief's title). It is a standalone Vite app. Do not edit anything in `susd-options/source/`, `susd-options/brief/` or `susd-options/tools/`.
- Install with `npm install --save-exact`. Pin these exact versions: `vite@5.4.10`, `@vitejs/plugin-react@4.3.3`, `react@18.3.1`, `react-dom@18.3.1`, `typescript@5.6.3`, `@types/react@18.3.12`, `@types/react-dom@18.3.1`. Add `lenis@1.1.13` only where this brief says so. Fonts come from `@fontsource-variable/*` or `@fontsource/*` packages (pin the version npm resolves). If a needed axis file is missing from the package, use the Google Fonts CSS2 URL given in this brief instead. No other runtime dependencies unless this brief names them.
- `vite.config.ts`: `base: './'` so `dist/` works from any path; `build.target: 'es2020'`.
- `index.html`: `<html lang="en">`; `<title>Scaling Up-Side-Down · Michael Wentz</title>`; `<meta name="description" content="Every hire compounds complexity before it compounds capacity.">` (M L696, verbatim); `<meta name="theme-color">` set to the page's first-screen background; the favicon copied from `susd-options/source/favicon.svg` to `public/favicon.svg`. Put the page background colour in an inline `<style>` in `index.html` so there is never a white flash.
- No analytics, cookies, trackers, or external requests other than fonts.
- Folder layout (minimum): `src/main.tsx`, `src/App.tsx`, `src/copy.ts` (the copy deck in this brief, pasted as is), `src/links.ts`, `src/bootloader.ts`, `src/motion/` (spring + timeline helpers), `src/hooks/` (reduced motion, scroll progress, in-view), `src/sections/*.tsx`, `src/styles/*.css`, `README.md` (how to run, the debug URL params, what each section does).

### S2. Copy (hard rule)

- Every sentence on the page is word for word from `source/public_bootloader.md` or `source/src_copy.ts`. The copy deck in this brief was checked line by line against both sources. Paste it into `src/copy.ts` unchanged. Components import from it. No sentence is typed directly in JSX.
- Never shorten, merge, re-punctuate or "improve" a sentence. A multi-sentence line may be shown one sentence at a time, but only in its original order.
- Gate (must pass before you call it done):
  `node /home/user/Website-selling/susd-options/tools/copycheck.mjs src/copy.ts $(find src -name '*.tsx')` → `0 not found`.
  Any new UI label of four or more words gets `// label` at the end of its line. If you believe you need a sentence that is not in the deck, grep both sources, add it with its line reference, and re-run the gate. Do not invent copy.
- Typography: render the deck's typographic apostrophes and quotes (’ “ ”) and em dashes as given. copycheck normalises them.

### S3. Bootloader and link constants

`src/bootloader.ts`:
```ts
// Matches the live /appendix (JSON-LD "wordCount": 35445, version V16) and BL 747.
export const BOOTLOADER = { version: "V16", file: "SUSD_Bootloader_V16.md", words: 35445, wordsLabel: "35,445", date: "October 2026" };
```
`src/links.ts`:
```ts
export const LINKS = {
  appendix: "https://scaling-up-side-down.vercel.app/appendix",
  get: "https://scaling-up-side-down.vercel.app/appendix#get", // the live opt-in form (id="get" exists on the page)
  preorder: "", // empty until Michael sends it; then the book button becomes a link
};
```

### S4. The ending: two clear paths (all options)

1. **The book.** Its title (*Scaling Up-Side-Down*), the author (Michael Wentz), one verbatim line from the deck, and the button **"Pre-orders open soon"**: `<button type="button" aria-disabled="true">`, focusable, no action, drawn at 55% strength with no hover lift. If `LINKS.preorder` is set, render `<a href={LINKS.preorder}>Pre-order the book</a>` instead (a label).
2. **The SUSD Bootloader, shown as a file, never as "copy the prompt".** It shows the filename `SUSD_Bootloader_V16.md`, version V16 and **35,445 words**, plus "Upload the file and use the starting prompt provided with it." (M L4531).
3. **The email opt-in (MVP, no backend).**
   ```html
   <form novalidate>
     <label class="sr-only" for="email">Email address</label>
     <input id="email" name="email" type="email" inputmode="email" autocomplete="email" required placeholder="you@company.com">
     <button type="submit">…option-specific label…</button>
     <p class="form-msg" aria-live="polite"></p>
   </form>
   ```
   - On submit, call `preventDefault()`. If `!input.checkValidity()`, show "Enter your email address." in `.form-msg`, focus the input, and shake it 2 px twice over 150 ms (skip the shake under reduced motion).
   - If the email is valid: disable the form and play this option's signature confirmation (1.6 s at most). Then call `window.location.assign(LINKS.get)` in the same tab.
   - Never send, store or log the email. The live `/appendix#get` form does the real opt-in.
   - Under reduced motion, show the confirmation's end state and navigate after 300 ms.
   - Debug: `?nonav=1` plays the confirmation and stays on the page, so the end state can be screenshotted.
4. **"Read the Appendix"** is a plain text link to `LINKS.appendix`, opening in the same tab.
5. Every "Get the Bootloader" and "The book" link elsewhere on the page scrolls to the paths section (`#paths`). Smooth-scroll it, or jump instantly under reduced motion.

### S5. Accessibility (all options)

- Every sentence is real DOM text. The page has exactly one `<h1>`, the `header`/`main`/`footer` landmarks, and sections with `aria-labelledby`.
- Every interaction works from the keyboard. Focus is always visible (a 2 px ring with a 3 px offset, in ink on light grounds and cream on dark), and is never removed.
- `prefers-reduced-motion: reduce`: show end states on load, with no intros, loops, light drift or scroll-scrubbed motion. Pinned or sticky sequences become normal stacked blocks showing their end states. State changes are instant or use crossfades of 150 ms or less.
- Contrast: body text at least 4.5:1. Text of 24 px or more (or 18.66 px or more in bold) at least 3:1. The book title set as a logotype is exempt, but it must stay legible.
- Changing verdicts and captions sit in an `aria-live="polite"` region. Announce final states only, throttled to at least 600 ms apart.
- Touch targets are at least 44×44 px. Long-press controls set `user-select: none`, `-webkit-touch-callout: none`, `touch-action: manipulation` and `contextmenu` → `preventDefault`.

### S6. Performance (all options)

- Keep JS within the budget this brief gives, measured gzipped from `dist/assets` (`gzip -c file | wc -c`).
- Fonts: ship only the axes and the latin subset you use. Preload the display font's woff2 and use `font-display: swap`. Start intros on `document.fonts.ready`, with a 1200 ms timeout so a slow font never blocks the page.
- Run one `requestAnimationFrame` loop per page. Pause it when the tab is hidden (`visibilitychange`) and when nothing is moving. Stop section loops offscreen with `IntersectionObserver`.
- Animate only `transform`, `opacity`, `clip-path`, colour, and `font-variation-settings` on the named elements (which get `contain: layout paint`). Neighbours are pushed with transforms, never by reflow. CLS stays at 0.02 or below.
- Use no image files. Paper grain and textures are generated: an SVG `feTurbulence` data URI, or a canvas drawn once at load.
- Targets: Lighthouse desktop performance at least 90, and LCP at most 2.0 s on desktop (the H1 is the LCP element).

### S7. Checks and screenshots (James judges by screenshots)

- `npm run build`, then `npx vite preview --port <port> --strictPort` (ports: the-title 4171, waterline 4172, count-yourself 4173, corrected-edition 4174).
- `node /home/user/Website-selling/susd-options/tools/shoot.cjs http://localhost:<port>/ /home/user/Website-selling/susd-options/.shots/<slug>`. The report must show no page errors, no console errors, and `overflow` 0 for both desktop and phone.
- The 600 ms frame must already say something (see the five-second test above). The 3 s frame must pass the five-second test on its own.
- Also capture the extra state screenshots this brief lists, using its debug URL params. Implement those params in production builds too; they are harmless.
- Look at the page at 1440×900, 1280×720, 768×1024, 390×844 and 375×667. No horizontal scroll at any size, and no text clipped or overlapping.

### S8. Never (all options)

- No wooden blocks, no tower, no ring of 12, no Blender frames: the live site's direction is what is being replaced.
- No dominant picture with small left-aligned text beside or over it. The message is always the biggest, brightest thing.
- No Apple look (black void, product hero, SF/system sans). No decorative gradients, glassmorphism, glow or bloom, purple, 3D blobs, emoji, stock photos or AI images.
- No "copy the prompt". The Bootloader is a file you opt in to.
- No game chrome: no scores, levels, avatars, or sound on by default.
- The page never flips or rotates as a whole.
- No wall of text: one idea per screen.
- No Inter, Instrument Serif or system-UI fonts.

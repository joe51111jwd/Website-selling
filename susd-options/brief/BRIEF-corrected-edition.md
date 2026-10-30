# BRIEF: CORRECTED EDITION (slug `corrected-edition`)

**Pitch for James:** The advice founders inherited is a printed page, and the book is Michael's red pencil on it. Each screen is a proof sheet lying on a dark desk. The founder's own thought is set in print ("I should be further by now") and struck through in red, and Michael's correction is set large in its place. At the end you press and hold "Strike it", and the whole inherited playbook is struck through and lifted away to show the Bootloader file underneath.

**Built from:** judges' #7 *Corrected Edition* (inversion-2). It scored 6.0 on the five-second test, the best of the remaining concepts after the ones merged into or chosen for the other three options (the 6.33 *Sixty-Six* was excluded as Constellation). It adds the "Same game. Different rules." running head and the three-step Up / Side / Down stair. It is the only option that leads with the book's emotional hook ("You were never the problem. The model you inherited was.") and with the challenge to conventional thinking that Michael asked for on the discovery call.

**Judges' criticisms, fixed here:**
- *A serif text page with strikethroughs is the flat, boring "Read and Use" look.* Each sheet is now a physical object: a lit proof sheet with real paper, a real shadow and a raking light, lying on a dark desk, with hand-precise vector proof marks drawing live. The finale lifts the page off the desk.
- *"Each cycle starts higher than the last" is vague: a cycle of what?* On the first screen it is underlined by the cycle itself, a stepped rule whose legs are labelled UP · SIDE · DOWN. Sheet 02 spells it out in Michael's four sentences.
- *Seven screens is too long.* There are six sheets now, and sheet 03 is marked as the first to cut.
- *The corrections are bare table cells.* Every sheet pairs its cells with a full verbatim support sentence.
- *Strikethrough is a web trope.* No `text-decoration: line-through`. These are real proofreader's marks (ruled strike, caret, dele loop, transpose loop, stet dots) with margin notes.

---

## 1. The big idea

Founders blame themselves for being "behind". The book says the map was wrong ("You were never the problem. The model you inherited was."). So the page is a **corrected edition of the inherited playbook**. You see the old belief and Michael's correction on the same sheet, in one look, and the red pencil is in the book's own DOWN colour: pruning, applied to advice. Several corrections change only a few words, and the rest of the line stays put. That is "Same game. Different rules." (BL 243), which runs as the running head. The last move strikes the whole inherited playbook and lifts it away. Underneath lies the file that replaces it: "This is not a playbook. It is a constraint layer." (BL 213).

## 2. The five-second test

A stranger must be able to say: *"If you feel behind, it's not you, it's the model you inherited. This book by Michael Wentz, for bootstrapped founders with up to 12 people, says growth comes in cycles of Up, Side and Down, each starting higher. I can get the Bootloader or the book."*

### Desktop 1440×900, the 3.0 s frame
- **The desk:** `#16130F` with `radial-gradient(ellipse at 50% 0%, #241F19 0%, #16130F 62%)`.
- **The sheet:** width 1240 px, height 844 px, top 28 px, centred, rotated −0.35°. Paper `#F3ECDF` with fibre grain, faint laid lines, a raking-light overlay and a deep shadow (§5).

Inside the sheet (padding 56 px 104 px), everything centred unless noted:
| y in sheet | Element | Spec |
|---|---|---|
| 40 | Running head | Left: `Michael Wentz` (Newsreader small caps, 14 px, ink at 70%). Centre: `Scaling Up-Side-Down` (Newsreader italic, 15 px). Right: `Get the Bootloader` (red small caps, 14 px, a link to `#file`). A 1 px hairline rule sits 14 px below it, in ink at 25%. |
| ~150 | **Inherited** | “I should be further by now” in Newsreader italic, opsz 36, wght 400, **54 px**, struck colour `--ink-struck` (`#7D7870`, 3.73:1). Through it runs a **red ruled strike**, 3 px, `#B2322A`. In the left margin (x 36 px): the galley number `01` (old-style figures, 13 px, ink at 45%) and the red **dele** loop mark. |
| ~214 | Caret | A red ‸ (14×12 px, 2.5 px stroke) centred under the struck line. |
| ~236–436 | **Correction** | "Each cycle starts / higher than the last" in Newsreader Display, opsz 72, wght 620, **104 px**, line-height 1.0, two balanced lines, ink `#1C1A17`, with a 1 px letterpress highlight. The word "higher" is in Up green `#2B5A37`. |
| ~466 | **The cycle rule** | An SVG stepped path, 640×64 px, centred, 3 px round strokes. Two laps, each ending higher than it began: an **UP** leg (rising diagonal, green), a **SIDE** leg (flat, ochre `#D49B2C`), a **DOWN** leg (short dip, red). Each leg is labelled UP · SIDE · DOWN in 11 px small caps beside it. |
| ~560 | Support | "You were never the problem. The model you inherited was." in Newsreader italic, 30 px, ink at 88%. |
| ~690 | Who-for | `who` ("A book by Michael Wentz · For bootstrapped founders · Teams of 1–12") in Newsreader small caps, **17 px**, tracking +0.06em, ink at 80%. |
| ~730 | Actions | `Get the Bootloader`: a red fill `#B2322A` with cream small caps, 52 px tall, padding 0 28 px. `The book — Pre-orders open soon`: a 1.5 px ink outline, 52 px. Both link to `#file`: they scroll to the finale and run the strike's fast path (§4.2), so the file is always one click away. |
| bottom-right corner | Galley label | `Galley 01 of 06 ↓` in 12 px small caps, ink at 50%. |

Squint test: the 104 px correction is the darkest and biggest mass. The struck line above it and the red marks are the second read. The lit sheet glows warm against the dark desk, and all of that light is on the words.

### Phone 390×844, the 3.0 s frame
- **Sheet:** 8 px of desk all round, so the sheet is 374 px wide and 100svh − 16 px tall, with no rotation. Padding is 20 px 18 px.
- **Running head:** `Michael Wentz` on the left and `Get the Bootloader` on the right, both 12 px. The centre title is hidden.

| y | Element | Spec |
|---|---|---|
| ~96 | Inherited | 24 px italic, struck, on up to 2 lines. The dele mark sits inline before it (16 px). |
| ~170–330 | Correction | 46 px, three lines: "Each cycle / starts higher / than the last". |
| ~350 | Cycle rule | 300×48 px, with 9 px labels. |
| ~430 | Support | 18 px italic, three lines. |
| ~530 | Who-for | 13 px, two lines. |
| ~590 | Actions | `Get the Bootloader`, full width, 48 px; then `The book — Pre-orders open soon` as a 15 px text link under it. |

### The 600 ms frame
The dark desk, the lit sheet, and “I should be further by now” printing in word by word. It already speaks in the reader's own voice.

---

## 3. Section-by-section flow (six sheets)

**Layout rules for all sheets:**
- Each sheet is its own section in normal flow, with 12vh of desk between sheets.
- On desktop, `scroll-snap-type: y proximity` with `scroll-snap-align: center` on each sheet. Use native scroll; **no Lenis**, because it fights CSS snap.
- Sheet rotations: 01 −0.35°, 02 +0.25°, 03 −0.2°, 04 +0.3°, 05 −0.15°, 06 0°.
- Sheets after 01 are `min(860px, 100svh − 96px)` tall on desktop and auto height on phone.
- A sheet's marks play once, the first time the sheet is at least 55% visible.
- From sheet 02 on, the running head's centre reads `head.sameGame` ("Same game. Different rules.").

Sheets 01, 02, 04 and 06 are **MUST**. Sheet 05 is **SHOULD**. Sheet 03 is **COULD**, the first to cut.

### Sheet 01 · THE HERO (`#top`)
Copy: `sheet01.*`, `who`, `galley`, `marks.del`. Layout as in §2. The intro is in §4.1.

### Sheet 02 · GROWTH (`#growth`)
- **Inherited** (struck, 44 px italic): `sheet02.inherited`, then the caret.
- **Correction:** `sheet02.corrected` at 88 px wght 620, one line on desktop and three on phone.
- **The stair:** an SVG stepped path, 900×220 px, drawn under the correction. It runs from a base, up a green rising leg, along an ochre flat leg, down a short red dip, and ends higher than the base. The four sentences of `sheet02.stair` sit on it in order, each 28 px wght 500 and horizontal (never rotated), centred on its leg:
  1. "Real scaling is cyclical." on the base.
  2. "Up for growth." over the rising leg.
  3. "Side for stability." on the flat leg.
  4. "Down for pruning." at the dip.

  The words "Up", "Side" and "Down" take their colours (Side in `--side-ink`).
  - Draw order: base, then each leg in 300 ms (linear, "ruled"). Each sentence appears (opacity plus 6 px rise, 240 ms) as its leg finishes.
  - On phone the stair becomes four centred lines, each led by a 24 px mini-leg glyph in its colour.

### Sheet 03 · PEOPLE (`#people`), COULD (cut first)
- Inherited (struck): `sheet03.inherited`. Correction (72 px, two or three lines): `sheet03.corrected`. Support (28 px italic): `sheet03.support`.
- **Margin calculation:** in the right margin, as an editor's note in red old-style figures (Newsreader italic, 16 px), the three `sheet03.margin` lines stacked. "12 people · 66 pathways" gets a ruled red underline. On phone they sit as one centred line under the support, at 13 px.

### Sheet 04 · THE EQUATION (`#equation`): the secondary interaction
- One line at 92 px (wght 620): `sheet04.before` ("Complexity > Capacity = Redline."). A red **transpose loop** encloses "Complexity" and "Capacity", with `tr.` in the margin.
- A margin button `sheet04.transposeBtn` (red small caps, 44 px hit area). Tapping the loop does the same.
- **Auto-run** once, when the sheet has been at least 60% visible for 1.2 s. Clicking the button or the loop afterwards toggles the line back and forth.
- After the swap the line reads exactly `sheet04.after` ("Capacity > Complexity = Oxygen.") with "Oxygen." in green. Then `sheet04.support` fades in (28 px italic).
- The timeline is in §4.3.

### Sheet 05 · IS THIS YOU (`#fit`), SHOULD
- **Headline:** `sheet05.headline` at 64 px Newsreader Display.
- **One centred column** of rows, max 640 px wide, 28 px wght 560, line-height 1.6:
  - The four `sheet05.stet` rows each get a row of green **stet dots** underneath (2.5 px dots, 5 px apart) and the margin note `stet` in green italic.
  - A hairline follows.
  - The four `sheet05.del` rows are struck in red with the margin note `del.`
- The marks draw with a 120 ms stagger. A visitor sees at once which side of the pencil they are on.

### Sheet 06 · THE FINALE (`#paths`, also reachable as `#file`): the signature interaction
- **The playbook sheet** (on top): a small-caps title `sheet06.title` (16 px, tracked), then the four `sheet06.compiled` lines (34 px italic, `--ink-struck`), **each already struck**, centred.
  - In the margin: **the Strike it mark**, a 96 px red ring with `sheet06.strike` in red small caps under it.
  - Under the sheet, on the desk: `sheet06.skip` ("Skip to the file") as a 14 px cream link.
  - The file underneath **peeks out**: its stack's corner shows 14 px beyond the playbook sheet's bottom-right edge.
- **The file** (revealed under it, on the desk):
  - **Headline** in cream on the desk: `file.headline` ("This is not a playbook. It is a constraint layer."), Newsreader Display 56 px.
  - **Left, the file stack:** three sheets, 420×520 px, paper `#F6F1E8`, offsets 6 px and 12 px. The top sheet carries `file.fileName` (Courier Prime 16 px), `file.fileMeta` (Courier Prime 13 px) and `file.fileFace` (Courier Prime 12 px, ink at 35%). Then `file.refLine` (Newsreader 24 px), the email field (56 px), the **`file.submit`** button ("Get it", red fill, cream small caps, 56 px), and `file.upload` (16 px).
  - **Right, the book card:** a typographic cover (300×440 px, paper, real shadow), with "SCALING" small and UP / SIDE / DOWN stacked in Newsreader Display 800 caps in the three inks, then `Michael Wentz`. Under it on the desk: `file.bookLine` (Newsreader italic 22 px, cream) and the "Pre-orders open soon" button (cream outline at 50%).
  - `file.appendix` link (cream).
  - Phone: the file comes first, then the book, full width.
- The timeline is in §4.2.

### Footer (on the desk)
`footer.line` and "Read the Appendix" in cream, 14 px, centred.

### Persistent navigation
None beyond each sheet's running head, which is part of the object. Each running head links `Get the Bootloader` to `#file`: it scrolls to the finale and runs the strike quickly (§4.2). On phone, a slim sticky bottom bar (`Get the Bootloader` and `The book`, 44 px, on the desk colour) appears after sheet 01 and hides on sheet 06.

---

## 4. Signature interaction and motion spec

**All proof marks are SVG paths drawn with `stroke-dashoffset` at a constant "ruled" speed of 1 px per 1.1 ms (linear).** Easing tokens: `easeOutCubic` cubic-bezier(.33,1,.68,1), `easeOutQuint` cubic-bezier(.22,1,.36,1), and `slide` cubic-bezier(.6,0,.3,1).

### 4.1 Sheet 01 intro (t = 0 at fonts ready, capped at 1200 ms; any input skips to the end state)
| t (ms) | What happens |
|---|---|
| 0–400 | The sheet rises 24 px → 0 and fades in, and its shadow grows (easeOutQuint). |
| 250–900 | The inherited line **prints** word by word. Each word goes opacity 0 → 1, scale 1.02 → 1 and blur 1 px → 0 over 90 ms, with a 60 ms stagger: letterpress. |
| 1000–1450 | The red strike rules left to right (450 ms, linear), and the dele loop draws in the margin (200 ms). The struck text eases from ink to `--ink-struck` over 300 ms. |
| 1450–1570 | The caret draws. |
| 1550–2000 | **The correction rises out of the paper:** translateY 18 px → 0, opacity, and the emboss highlight going 0 → 1, over 450 ms easeOutQuint, with words staggered 40 ms. |
| 1900–2800 | The cycle rule draws leg by leg (6 legs × 150 ms), and each label fades in as its leg completes. |
| 2200–2500 | The support line fades up. |
| 2400–2700 | The who-for line and the actions fade up. |

At rest, only the light moves (§5).

### 4.2 Strike the playbook (sheet 06), the signature
**Hold:**
- Press and hold the Strike it mark (pointer) for **700 ms**. The ring fills clockwise as a `conic-gradient` progress.
- Releasing early drains the ring back over 200 ms.
- Enter or Space triggers it at once.
- The mark is a `<button>` described by the sheet title.

**On completion:**
| t (ms) | What happens |
|---|---|
| 0–380 | A red rule draws **corner to corner** across the playbook sheet, top-left to bottom-right, 4 px, linear. The margin note `del.` writes in. |
| 380–630 | The sheet **lifts**: rotateX −8°, translateZ 40 px in a `perspective: 1600px` context. Its shadow grows from the resting stack to `0 40px 90px rgb(0 0 0/.55)`. 250 ms easeOutCubic. |
| 630–1530 | The sheet **slides away**: translate(18vw, −115vh) rotate(6deg) over 900 ms `slide`. On phone: translateY(110vh) over 700 ms. It is then removed from the accessibility tree and from focus order. |
| 900–1400 | `file.headline` rises in (y 16 → 0, 500 ms easeOutQuint). The file and book settle: 4 px rise each, 80 ms apart. Focus moves to the email field. |

**Fast path:** "Skip to the file" and every `#file` link run the same sequence at a third of the duration (about 500 ms in total).

**Persistence:** remember the struck state for the session (`sessionStorage`, wrapped in try/catch), so the sheet does not return on scroll-back.

**Submit confirmation, THE STAMP** (S4 rules), about 1200 ms:
1. A red circular proof stamp lands on the top file sheet: a 120 px ring, 3 px `#B2322A`, with "Yours" (`file.stamp`) inside in Newsreader italic 30 px. It goes scale 1.4 → 1 and opacity 0 → 1 in 160 ms easeOutCubic, then blur 1.5 px → 0 over 200 ms (ink spreading), with `mix-blend-mode: multiply`.
2. A green `stet` margin note writes beside the filename (300 ms).
3. After a 500 ms hold, the page navigates to `LINKS.get`.

### 4.3 The transpose (sheet 04)
| t (ms) | What happens |
|---|---|
| 0–700 | The transpose loop draws around the two nouns. Its path runs through their measured boxes as an S-shaped loop, enclosing the first word in its upper bowl and the second in its lower bowl. |
| 700–1400 | The words **trade places along arcs**: Complexity goes up and over, Capacity goes down and under. This is a FLIP: render the final DOM order and animate from the old rects along quadratic arcs, over 700 ms `slide`. The ">" sign FLIPs to its new x. |
| 1400–1750 | "Redline." is struck in red (350 ms). |
| 1750–1870 | The caret draws. |
| 1870–2170 | "Oxygen." (green) rises in above the struck word at 60% size. |
| 2170–2470 | The struck "Redline." collapses (its width goes to 0 by FLIP, 300 ms) while "Oxygen." drops into the line at full size. |
| 2500 | The support line fades in. |

- The final DOM text equals `sheet04.after` exactly.
- A visually hidden `aria-live` region announces `sheet04.after` once.
- Toggling back runs the reverse in 60% of the time.

### 4.4 Light (all sheets)
`--light-angle` is 135° ± 4°, following the pointer's x (lerp 0.06). It drives the sheet's raking-light overlay and the sign of the letterpress offsets. On touch it is fixed at 135°.

### 4.5 Reduced motion
- Every sheet renders in its end state: marks drawn, corrections set, the transpose done, the stair drawn.
- The finale shows the file already revealed, with the struck playbook sheet as a smaller static object above it, captioned by its title.
- Submit shows the stamp at once.
- No scroll-snap.

### 4.6 Debug params
- `?sheet=2`, `?sheet=4` and `?sheet=5` scroll to that sheet with its marks done.
- `?finale=open` shows the file revealed.
- `?nonav=1` stops navigation after the stamp.

Capture screenshots of: the 3 s hero, `?sheet=2`, `?sheet=4` (after the transpose), `?sheet=5`, sheet 06 before the strike, `?finale=open`, and the stamp with `?nonav=1`, on desktop and phone.

---

## 5. Art direction

**The look in one line:** a typographer's galley proof on an editor's desk at night. A warm, lit sheet of paper carries one corrected line, under real proofreader's marks in the book's red pencil.

**Type:**
- **Newsreader** (Google Fonts, OFL; opsz 6–72, wght 200–800, italic) for everything on the sheets:
  - Inherited lines: Regular Italic, like a remembered voice.
  - Corrections: Display (opsz 72) at wght 620, with `text-wrap: balance`.
  - Labels: small caps (`font-variant-caps: all-small-caps`), tracking +0.06em.
  - Galley numbers: old-style figures.
- **Courier Prime** (Google Fonts, OFL; 400/700) only for the Bootloader file's face: a typescript manuscript.
- Packages: `@fontsource-variable/newsreader` (import the files with opsz and the italic) and `@fontsource/courier-prime` (400, 700).
- Fallback: `https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,200..800;1,6..72,200..800&family=Courier+Prime:wght@400;700&display=swap`.

**Colour tokens:**
```css
--desk:#16130F; --desk-hi:#241F19;
--sheet:#F3ECDF; --file-sheet:#F6F1E8;
--ink:#1C1A17;              /* 15.4:1 on sheet */
--ink-struck:#7D7870;       /* struck text, 24 px or larger only (3.73:1) */
--red:#B2322A;              /* proof marks, Get buttons, stamp (5.28:1) */
--green:#2B5A37;            /* stet, "higher", "Oxygen." (6.82:1) */
--ochre:#D49B2C;            /* strokes in the cycle rule only */
--side-ink:#A87414;         /* the word "Side" as text, 24 px or larger */
--cream:#F3ECDF;            /* type on the desk (15.76:1) */
```
95% of every sheet is paper and ink. Red is the only active colour. Green appears only on stet marks and on the one key corrected word. Ochre appears only in the cycle legs.

**Paper and depth:**
- **Sheet:** `--sheet`, plus fibre grain (SVG `feTurbulence` data URI at 6%, multiply), plus faint laid lines (`repeating-linear-gradient(90deg, rgb(0 0 0/.018) 0 1px, transparent 1px 9px)`), plus a raking-light overlay (`linear-gradient(var(--light-angle), rgb(255 255 255/.07), rgb(0 0 0/.06))`).
- **Shadow:** `0 1px 1px rgb(0 0 0/.4), 0 14px 28px rgb(0 0 0/.45), 0 50px 110px rgb(0 0 0/.4)`.
- **Letterpress on sheet type:** `text-shadow: 0 1px 0 rgb(255 255 255/.55), 0 -0.5px 0 rgb(0 0 0/.12)`, with the offsets' sign following the light.
- No stains, no coffee rings, no torn edges, no faux age.

**Marks:** precise vector proofreader's marks: a ruled strike with two seeded wobble points of ±0.6 px (mulberry32, so screenshots repeat), caret, dele loop, transpose loop, stet dots, and margin abbreviations in Newsreader italic. They are never a CSS line-through and never a handwriting font.

**Grid and scale:**
- The sheet is the frame. Its inner measure is at most 960 px, everything is centred, and the margins hold only galley numbers and marks.
- Type scale: 104 (hero correction) / 92 / 88 / 72 / 64 / 56 / 54 / 44 / 34 / 30 / 28 / 24 / 17 / 14 / 12.

**Why it is its own style:**
- It is a galley proof: book-editing craft applied to business advice, the "more like a manuscript, like a book" James asked for after *Index*, without *Index*'s clutter.
- It is not Apple: the dark desk is warm brown-black and lit, and the "product" is a sentence.
- It is not an AI template: no gradients-as-decoration, no glass, no cards, no emoji.
- It is not flat: paper, light, impression, a real shadow, and marks drawing live.

## 6. The ending
See sheet 06 and S4. The playbook is struck and lifted away, revealing the file (with "Get it" and the Yours stamp) and the book ("Pre-orders open soon"). "Skip to the file" is always available, so the opt-in is never gated. "Read the Appendix" links to `LINKS.appendix`.

## 7. Layout summary, desktop 1440 vs phone 390
| Sheet | Desktop 1440×900 | Phone 390×844 |
|---|---|---|
| 01 Hero | Sheet 1240×844, rotated −0.35°; correction 104 px on 2 lines | Full-bleed sheet with 8 px desk; correction 46 px on 3 lines; one red button plus a text link |
| 02 Growth | Correction 88 px; 900×220 stair | Correction 40 px; stair as four led lines |
| 03 People | Margin calculation in the right margin | Calculation as one line under the support |
| 04 Equation | 92 px line; transpose button in the margin | 34 px, on two lines ("Complexity > Capacity" / "= Redline."); the arcs scale down |
| 05 Fit | 64 px headline; one column | 34 px headline; marks at the right edge of each row |
| 06 Finale | Playbook sheet over the file; file left, book right | Sheet slides down off screen; file then book, stacked |

## 8. Tech plan

**Stack:** Vite + React + TypeScript (S1). Native scroll with no Lenis, and no WebGL. The paper is CSS with an SVG noise data URI, generated once.

**Proof-mark engine** (`marks/`):
- `measure.ts` uses `Range.getClientRects()` for any phrase, which works across line wraps. Coordinates are mapped into the sheet's local space, accounting for its rotation: either measure with the rotation temporarily at 0, or use `offsetLeft`/`offsetTop` chains inside an unrotated inner wrapper. The simplest approach: rotate the *outer* sheet and measure inside an inner unrotated wrapper.
- `Strike`, `Caret`, `Dele`, `TransposeLoop` and `StetDots` are SVG components in an absolutely positioned overlay per sheet. Seeded wobble comes from mulberry32.
- Draw-on uses `stroke-dasharray` / `stroke-dashoffset`, with duration = length × 1.1 ms.
- Re-measure on resize (debounced 120 ms) and after `document.fonts.ready`.

**FLIP:**
- Used for the transpose arcs, for collapsing struck words, and for inserted words. A tiny helper (about 40 lines) is enough: measure, mutate, invert, then play with WAAPI (`element.animate`) using `slide` easing.

**Strike it:**
- Pointer events plus rAF progress drive the hold, with keyboard support.
- The lift and slide use WAAPI on transforms in a `perspective` context.

**Semantics:** inherited text is `<del>` and corrections are `<ins>`, the real HTML of an edit, with the default decoration removed. Screen readers then announce "deletion" and "insertion" in order.

**Budget:** JS at most 70 KB gzipped. Fonts at most 140 KB (Newsreader variable latin roman and italic, plus Courier Prime 400).

**Accessibility, specific to this option:**
- The `<h1>` is the hero correction ("Each cycle starts higher than the last"), preceded in the DOM by the `<del>` inherited line.
- Every mark is `aria-hidden`.
- The Strike it and Transpose controls are buttons with visible labels.
- After the lift, focus moves to the email field.

## 9. Copy deck: paste as `src/copy.ts`
Every string below was checked against its cited line in the sources, and the block passes `tools/copycheck.mjs`.

```ts
// src/copy.ts for CORRECTED EDITION. Every sentence is Michael's, word for word.
// BL n = line n of source/public_bootloader.md. M Ln = manuscript line n, as recorded in source/src_copy.ts.
// Lines marked `// label` are UI labels/buttons/proof marks (not sentences) and are exempt from copycheck.
// Inherited/corrected pairs are the two cells of one table row in the Bootloader.
export const COPY = {
  head: {
    author: "Michael Wentz", // label
    title: "Scaling Up-Side-Down", // label
    get: "Get the Bootloader", // label
    sameGame: "Same game. Different rules.", // BL 243 (running head from sheet 02 on)
  },
  who: "A book by Michael Wentz · For bootstrapped founders · Teams of 1–12", // label
  galley: "Galley {n} of 06", // label
  marks: { del: "del.", stet: "stet", tr: "tr." }, // label (proofreader's marks)
  sheet01: {
    inherited: "“I should be further by now”", // BL 1439 (left cell, quoted in source)
    corrected: "Each cycle starts higher than the last", // BL 1439 (right cell)
    legs: ["UP", "SIDE", "DOWN"], // label
    support: "You were never the problem. The model you inherited was.", // M L216
    getBtn: "Get the Bootloader", // label
    bookBtn: "The book — Pre-orders open soon", // label
  },
  sheet02: {
    inherited: "Growth is a straight line upward", // BL 1426 (left cell)
    corrected: "Growth comes from completing cycles", // BL 1426 (right cell)
    stair: ["Real scaling is cyclical.", "Up for growth.", "Side for stability.", "Down for pruning."], // BL 795 (four consecutive sentences, one per step)
  },
  sheet03: {
    inherited: "More people = more capacity", // BL 692 (left cell)
    corrected: "More people = more coordination cost (unless absorbed)", // BL 692 (right cell)
    support: "Every hire compounds complexity before it compounds capacity.", // M L696
    margin: ["8 people · 28 pathways", "12 people · 66 pathways", "15 people · 105 pathways"], // label (n(n-1)/2, BL 5112-5132)
  },
  sheet04: {
    before: "Complexity > Capacity = Redline.", // M L2997
    after: "Capacity > Complexity = Oxygen.", // M L2999
    support: "The systems can carry what the business creates.", // M L2999
    transposeBtn: "Transpose", // label
  },
  sheet05: {
    headline: "Too big to be small, too small to be big", // BL 4777
    stet: ["Bootstrapped / self-funded", "Founder-led", "1-12 employees", "Tired of traditional advice"], // BL 4773-4779 (criterion cells)
    del: ["Venture-backed", "Seeking 10x growth", "Exit-focused (flip in 2-3 years)", "40+ employees"], // BL 4787-4792 (criterion cells)
  },
  sheet06: {
    title: "The playbook you inherited", // label
    compiled: ["“I should be further by now”", "Growth is a straight line upward", "More people = more capacity", "Complexity > Capacity = Redline."], // BL 1439 · BL 1426 · BL 692 · M L2997 (the struck lines from sheets 01-04)
    strike: "Strike it", // label
    skip: "Skip to the file", // label
  },
  file: {
    headline: "This is not a playbook. It is a constraint layer.", // BL 213
    fileName: "SUSD_Bootloader_V16.md", // label (version per BL 747)
    fileMeta: "V16 · October 2026 · 35,445 words", // label
    fileFace: ["# THE SUSD BOOTLOADER", "## Scaling Up-Side-Down Operating System — Front Matter", "## PURPOSE"], // BL 1-6 (headings shown faint on the file face)
    refLine: "The pages are reference. The file is the operating system.", // M L4497
    email: "Email address", // label
    placeholder: "you@company.com", // label
    badEmail: "Enter your email address.", // label
    submit: "Get it", // label
    stamp: "Yours", // label
    upload: "Upload the file and use the starting prompt provided with it.", // M L4531
    bookLine: "Half of this book is meant to be read. The other half is meant to be used.", // M L234
    bookTitle: "Scaling Up-Side-Down", // label
    bookAuthor: "Michael Wentz", // label
    preorder: "Pre-orders open soon", // label
    appendix: "Read the Appendix", // label
  },
  footer: {
    line: "Up. Side. Down. Repeat.", // M L1713
  },
};
```

## 10. What NOT to do (the traps most tempting for this concept)

1. **Never CSS `line-through`, never a handwriting or marker font.** Marks are measured, precise vectors with margin notes. A cheap strikethrough is exactly the "flat, AI-looking text" James rejects.
2. **Not a wall of text and not a manifesto.** One correction per sheet, about 30 words or fewer per sheet (the finale list is the exception), and never more than six sheets. Cut sheet 03 first.
3. **A struck line must never appear without its correction in the same screenshot.** The pair is the message.
4. **Never gate the opt-in behind the hold.** "Skip to the file", the running-head links and the hero buttons all reveal the file.
5. **No page-curl or flip.** The playbook sheet lifts and slides away flat; it never curls or turns over.
6. **No vintage pastiche.** No stains, coffee rings, torn or deckled edges, sepia, or typewriter clatter. The paper is clean, modern uncoated stock under a lamp.
7. **Keep the cell order honest.** The left cell (Traditional Logic) is what gets struck; the right cell (SUSD Logic) is the correction. Never swap or merge cells, and keep the source's quotation marks on “I should be further by now”.
8. **The desk is warm brown-black and lit, not the Apple black void,** and there is no product shot. The sheet carries all the light.
9. **No ochre or green beyond their roles** (ochre: cycle legs; green: stet and one word). More colour turns the proof into a poster.
10. **The Bootloader is a file under the playbook, not a prompt box.** Never "copy the prompt".

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

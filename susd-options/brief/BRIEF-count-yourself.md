# BRIEF: COUNT YOURSELF (slug `count-yourself`)

**Pitch for James:** The headline is the book's own first question, "How many people are on your team?", and the answer is a giant printed number you dial. The page answers in Michael's words for where you stand, and the whole screen turns that place's colour: green inside twelve, ochre at the edge, oxblood in the Graveyard. A founder knows in one move whether this book is about them.

**Built from:** judges' #5 *Count Yourself* (mirror-1), with the personal season tempo from *Season Clock* (cycle-2), the colour sweep from the numeral from *Compounds* (type-2), and the shareable `?team=` link from *Sixty-Six* (physics-1). This is the option built around the book's entry question (BL 310), which the Bootloader calls Step 0 and says to always ask first.

**Judges' criticisms, fixed here:**
- *The book's claim was demoted to engraved small caps.* "12 isn't where you're trying to get. It's the line you don't cross." (BL 544) is now a full line on the first screen, and the verdict for the visitor's number is set at 36 px.
- *Two counters read as a calculator, game or dashboard.* There is one drum (people), printed in a book serif inside a window cut into the page, with no device housing. Pathways is a small label under it.
- *Who-for was 11 px mono.* It is now 15 px on the first screen, and the criteria words are Michael's own.
- *The cycle came two scrolls late.* Section 03 is "Your cycle": the visitor's own season tempo. Each option leads through a different door; this one leads with "is this for me".
- *Five input modes are too much to polish.* Every input is listed below with exact step rules. No sound, and only one dramatic moment (14 → 15).

---

## 1. The big idea

The Bootloader's first move is a question: "This single question reveals location on the destination map, physics that apply, and what advice will fit vs. make things worse." (BL 314). This homepage asks it and lets the visitor answer with one number. The number returns a place: its name, its colour, and Michael's exact line for that place. The colour is the verdict, so the page reads as safe, edge or trap even when you squint. Founders at 1–12 see themselves named. Founders at 13–39 learn the book is urgently about them. A visitor at 40+ learns in one move that this book is not theirs. That is exactly James's "they need to know whether they like it or not".

## 2. The five-second test

A stranger must be able to say: *"It's Michael Wentz's book for bootstrapped, founder-led businesses of 1–12 people. It says 12 is the line you don't cross. I'm 8, so I'm in 'Team', where most bootstrapped businesses live. I just watched 13 turn the page ochre and 15 turn it oxblood. I can get the Bootloader or the book."*

### Desktop 1440×900, the 3.0 s frame (team = 8, field = green `#2B5A37`, text = cream `#F1EADF`)
| y | Element | Spec |
|---|---|---|
| 0–56 | Rail | Left: `SCALING UP-SIDE-DOWN · MICHAEL WENTZ` in IBM Plex Mono 12 px caps, tracking +0.12em. Right: `The book` (text) and `Get the Bootloader` (a cream pill with green text, 36 px). |
| ~104 | Who-for | `For` + `Bootstrapped / self-funded · Founder-led · 1-12 employees`. Plex Mono **15 px** caps, tracking +0.1em, solid cream (no opacity). |
| ~150–240 | **H1** | "How many people are on your team?" Fraunces *italic*, opsz 144, wght 420, SOFT 50, **84 px** (5.8vw), one line, centred. |
| ~262 | Sub | `hero.whoCounts` in Fraunces roman, opsz 24, wght 400, 21 px, cream at 85%, one line. |
| ~310–560 | **Drum window** | A rounded slot 360×250 px (radius 18 px) cut into the field. Its inside is the field colour darkened 35%, with inner shadows `inset 0 12px 24px rgb(0 0 0/.38), inset 0 -10px 20px rgb(0 0 0/.28)` and a 1 px lighter lip on the bottom edge (`rgb(255 255 255/.10)`). Inside are two digit wheels showing **0 8**: Fraunces 900, opsz 144, **200 px**, cream, lining figures. Cylinder shading lies over the wheels (§5). Outside the slot, 40 px from each side: **−** and **+**, 64 px circles with a 1.5 px cream ring and a cream glyph. |
| ~580 | Pathways label | `PEOPLE · 28 COORDINATION PATHWAYS`, Plex Mono 13 px caps, cream. The 28 rolls. |
| ~628 | Zone tag | `TEAM · 8–12`, Plex Mono 13 px caps, tracking +0.14em. |
| ~656–740 | **Verdict** | `zones[team].line`: Fraunces roman, opsz 72, wght 380, **36 px**, max-width 1000 px, two balanced lines, centred. |
| ~770 | Claim | `hero.claim` in Fraunces italic, 24 px, cream. The book's standing claim; it does not change with n. |
| ~826 | Actions | Two pills, 52 px, 16 px apart. Primary (cream fill, field-colour text): `Get the Bootloader` + `V16 · 35,445 words`. Secondary (1.5 px cream outline): `The book · Pre-orders open soon`. Both scroll to `#paths`. |

Squint test: the 200 px numerals and the 84 px question are the brightest things, and both are type. The whole field is the cover's green. A focus caret blinks in the units wheel, which invites the visitor to dial.

### Phone 390×844, the 3.0 s frame
| y | Element | Spec |
|---|---|---|
| 0–44 | Rail | `SUSD · MICHAEL WENTZ` 10.5 px mono on the left; `Get the Bootloader` 10.5 px on the right. |
| ~56 | Who-for | Two lines, Plex Mono 11 px caps. |
| ~104–192 | H1 | Fraunces italic, 38 px, two lines ("How many people / are on your team?"). |
| ~204 | Disclosure | A `Who counts?` text button, 13 px underlined, that reveals `hero.whoCounts` at 15 px (aria-expanded). |
| ~244–404 | Window | 200×160 px with digits at 120 px. |
| ~416–472 | − and + | Two 56 px circles **under** the window, 24 px apart, centred. |
| ~486 | Pathways label | 11 px. |
| ~514 | Tag | 11 px. |
| ~534–618 | Verdict | 20 px, three lines at most. |
| ~634–676 | Claim | 16 px italic, two lines. |
| 780–844 | Sticky bottom bar | Two buttons, 48 px: `Get the Bootloader` and `The book`. |

### The 600 ms frame
The question is in. The drum is rolling at about 3–4 people in green, with the pathways label counting. It already reads as "a question you answer with a number".

---

## 3. Section-by-section flow

Sections 01, 03 and 04 are **MUST**. Section 02 (the meter) is **SHOULD**.

The **field** is one fixed full-viewport layer behind everything (`#field`, z −1). It always shows the visitor's zone colour, except where a section draws its own background (section 02).

### 01 · COUNT (hero, `#top`, 100svh)
- Copy: `hero.*`, `zones`, `ceilingTag`.
- **Intro:** §4.1. **Dialling:** §4.2.
- **Verdict table** (tag and line from `COPY.zones`; field and text colours from §5):

| n | Zone id | Field | Text | Notes |
|---|---|---|---|---|
| 1 | solo | `--f-green` | cream | |
| 2–3 | small | `--f-green` | cream | |
| 4–7 | valley | `--f-olive` | cream | |
| 8–12 | team | `--f-green` | cream | At n = 12 the tag reads `TEAM (CEILING) · 66 PATHWAYS` (built from `ceilingTag`) |
| 13–14 | threshold | `--f-ochre` | **ink** | Cream on ochre is 2.06:1, so the text flips to ink (7.05:1) |
| 15–39 | graveyard | `--f-oxblood`, darkening linearly to `--f-oxblood-deep` at 39 | cream | |
| 40 | tot | `--f-slate` | cream | Numeral shows `40` with a small superscript `+` |

- The URL keeps `?team=n` (history.replaceState, debounced 300 ms). On load with `?team=n`, the intro rolls 1 → 15 → n instead of 1 → 15 → 8.
- After the hero leaves the viewport, a fixed **chip** appears at the top right (desktop) or at the left of the bottom bar (phone): `8 · TEAM` in Plex Mono 12 px caps, as a pill with a 1.5 px cream border. Clicking it scrolls to the hero and focuses the window.

### 02 · PAST TWELVE, the meter (`#meter`: 180vh with a sticky stage on desktop; one 100svh block on phone), SHOULD
- **Background:** solid ink `#17150F`, drawn by the section itself, covering the field.
- **Big line**, centred at the top, Fraunces 900 opsz 144, 5vw, cream: `meter.breaks`. On desktop it swaps to `meter.worse` at p 0.55; on phone it swaps after 2.5 s in view. The swap is a mask slide of 280 ms.
- **Meter**, an inline SVG with viewBox 1000×420, 1000 px wide on desktop and 358 px on phone:
  - 40 bars at x = 25i, 18 px wide (on phone 7 px wide with 2 px gaps). Bar i is 400 × i(i−1)/2 / 741 tall, on a linear scale, so bars 1–12 stay tiny. Bar 40 (780) breaks off the top with a 6 px zigzag mark.
  - Colours: 1–12 cream, 13–14 `#D49B2C`, 15–39 `#C8402F`, 40 `#8A8F96`.
  - The visitor's bar has a 2 px cream outline and a label above it: `You · 8 · 28` (built from `meter.you`).
  - Labels sit above bar 12 (`meter.at12`) and bar 39 (`meter.at39`), Plex Mono 12 px. On phone only these two labels show.
  - The bars rise when the section is 40% visible: scaleY 0 → 1 from the baseline, spring k 260 c 22, staggered 18 ms from the left.
  - Clicking or tapping a bar sets n everywhere: hero, chip, URL and field. Keyboard users use the hero spinbutton or the chip; the bars are `aria-hidden`.
- **Caption** under the meter: `meter.caption`, 20 px Fraunces, cream at 90%.

### 03 · YOUR CYCLE (`#cycle`, 100svh; the field shows the zone colour again), MUST
- **Headline:** `cycle.headline` in Fraunces 900, 5vw, cream (or ink on ochre).
- **Word drum:** a window 560×190 px (phone 320×120 px) holding a three-face prism. Its paper faces (`#F1EADF`) carry `UP` in `--up`, `SIDE` in `--side-ink`, and `DOWN` in `--down`, set in Fraunces 900 at 140 px (phone 84 px), with the same cylinder shading as the hero.
  - It turns `rotateX(-120deg)` per step on a spring (k 220, c 24).
  - Dwell per face comes from the **tempo band** for the visitor's n (`COPY.tempo`, BL 161–164):

    | n | UP | SIDE | DOWN (ms) | Note |
    |---|---|---|---|---|
    | 1–3 | 1800 | 600 | 600 | The 3 days / 1 day / 1 day ratio |
    | 4–6 | 1000 | 1000 | 1000 | |
    | 7–9 | 1400 | 1400 | 1400 | |
    | 10–12 | 2000 | 2000 | 2000 | |

  - It runs only while the section is at least 40% visible.
- **Job line** under the drum: `cycle.jobs[face]`, Fraunces 34 px. It swaps with the face (mask slide, 220 ms).
- **Systems row:** the four `cycle.systems[face]` names in Plex Mono 13 px caps, separated by `·`. Each name flips like a departures board: rotateX 90° out and 90° in, 180 ms, 40 ms stagger. On phone they sit in a 2×2 grid.
- **Tempo readout** (Plex Mono 14 px caps): `AT 8 PEOPLE · UP 1 MONTH · SIDE 1 MONTH · DOWN 1 MONTH · MONTHLY`, built from labels.
- **Clock line:** `cycle.clock` in Fraunces italic, 30 px.
- **Deposit line:** after the first full turn, `cycle.deposit` fades in at 24 px.
- **Locked states** (keep tempo bands and destination bands separate, BL 2202):
  - **n 13–14:** the drum stops on a blank paper face. The job line is replaced by `cycle.phaseChange`, and the tempo readout hides.
  - **n 15–39:** a 4 px `--f-oxblood` band lies across the window and the drum cannot turn.
    - Under it, `cycle.exits` as three pills. Only the first, `Streamline to 12`, is a real `<button>`: it sets n = 12, the field sweeps back to green from the button, and the drum unlocks and starts. The other two are labels at 60%.
    - Then `cycle.noWayThrough` at 24 px.
  - **n = 40:** the drum is greyed (faces at 40%) and `cycle.outOfScope` shows.

### 04 · TWO PATHS (`#paths`, 100svh desktop; auto on phone; the field shows the zone colour), MUST
Two paper cards (`#F1EADF`, ink text) side by side, each 520×600 px and 48 px apart, on the coloured field. Each card has a real shadow: `0 2px 2px rgb(0 0 0/.18), 0 24px 48px rgb(0 0 0/.28)`.
- **The Bootloader card** (left on desktop, first on phone):
  - `paths.fileName` (Plex Mono 14 px) and `paths.fileMeta` (12 px, ink at 70%).
  - A **word odometer**: five digit wheels plus a comma showing **35,445** in Fraunces 900, 72 px, ink. On entering view it rolls up from 00,000 over 1200 ms easeOutCubic, with the wheels finishing right to left 60 ms apart. Label `paths.words` under it.
  - `paths.refLine`, Fraunces 24 px.
  - `paths.firstAsk` (Plex Mono 12 px caps) and `paths.firstQuestion` (Fraunces italic 22 px). Beside it, a small printed box with the visitor's **n**, circled with a 2 px `#B2322A` ellipse that draws on over 500 ms when the card enters. The file will ask them this exact question.
  - The email field (full card width, 56 px) and **the key**: an ink block 64 px tall and full width, holding a three-face word drum (`GET IT` / `SENT` / `YOURS`) in cream Plex Mono 600, 18 px, tracking +0.16em.
  - `paths.upload` and `paths.locate` at 16 px; `paths.appendix` link.
- **The book card** (right): a typographic cover (`SCALING` plus UP / SIDE / DOWN stacked in Fraunces 900 in the three inks, with `Michael Wentz`), then `paths.bookLine` (Fraunces italic 26 px), then the "Pre-orders open soon" button.
- **Signature confirmation, THE KEY** (S4 rules), about 1300 ms:
  1. The key presses 4 px over 90 ms and its shadow tightens.
  2. The drum rolls to `SENT` (300 ms spring).
  3. After 250 ms it rolls to `YOURS`, and the card brightens 3% for 120 ms.
  4. After 400 ms, the page navigates to `LINKS.get`.

### Footer
`footer.line` and "Read the Appendix", in cream on the field.

---

## 4. Signature interaction and motion spec

The signature is **dial your number**. Easing tokens: `easeOutCubic` cubic-bezier(.33,1,.68,1), `easeInQuad` cubic-bezier(.11,0,.5,0), `easeOutQuint` cubic-bezier(.22,1,.36,1).

### 4.1 Intro (t = 0 at fonts ready, capped at 1200 ms; any input skips to n = 8 or `?team`)
| t (ms) | What happens |
|---|---|
| 0–300 | The rail, who-for and H1 come in: words rise 10 px with opacity, 30 ms stagger. |
| 400 | The drum shows `01`. The verdict area is empty. |
| 500–2000 | The drum rolls 1 → 15. Each step takes from 150 ms down to 60 ms (easeInQuad over the steps), and the pathways label rolls 0, 1, 3, 6 … 105. The field follows the zone at each step with 200 ms colour crossfades: green → olive (4–7) → green (8–12) → **ochre at 13**, where the text flips to ink. At 13, the stamp `hero.stamp` ("Past twelve, something breaks.") lands at y 70%: Fraunces 900, opsz 144, 56 px, scale 1.15 → 1, opacity 0 → 1, rotate −2° → 0, 140 ms. **At 15:** the drum jolts (a 1-frame overshoot of 6°), and the oxblood floods out of the window as a radial clip-path circle over 450 ms easeOutCubic. |
| 2000–2350 | Hold at 15. |
| 2350–2650 | The drum rolls 15 → 8 (60 ms steps, ease-out), and the field crossfades back through ochre to green. The stamp lifts (y −12 px, opacity 0, 200 ms) as n drops below 13. |
| 2650–2900 | The verdict rises in (a mask slide of 280 ms), then the claim and the actions fade in. The units wheel's focus caret blinks twice. |

### 4.2 Dialling (the window is `role="spinbutton"`, aria-valuemin 1, aria-valuemax 40)
**Inputs:**
| Input | Behaviour |
|---|---|
| **− / +** | Click steps by 1. Holding repeats after 400 ms, every 120 ms. |
| **Keys**, with the window focused | ↑/→ +1, ↓/← −1, PageUp +5, PageDown −5, Home 1, End 40. Typed digits collect in a 600 ms buffer, so "1" then "5" sets 15. |
| **Wheel** | Only while the pointer is over the window: a non-passive listener with `preventDefault`, accumulating deltaY with one step per 60 px. |
| **Drag**, desktop | Vertical drag on the window with `setPointerCapture`, 28 px per step. On release, momentum carries on with friction 0.92 per frame and snaps to an integer. |
| **Touch** | Horizontal swipe on the window, 32 px per step. The window has `touch-action: pan-y`, so vertical page scroll stays native. Tapping the window focuses it and opens the numeric keypad through a visually hidden `<input inputmode="numeric">`. |

**Drum mechanics:**
- n is a spring (k 380, c 28) toward the integer target.
- The units wheel angle is (n mod 10) × 36°. The tens wheel advances only during the last 30% of the units wheel passing 9 → 0, so the carry looks real.
- Each wheel is a CSS 3D ring of ten DOM faces at `rotateX(i·36deg) translateZ(r)`, where r = faceHeight / (2·tan 18°) ≈ 1.539 × faceHeight, under `perspective: 900px`. The window crops it.
- Motion blur is `filter: blur()` scaled with angular speed and clamped to 2 px. It is off when the wheel is still.

**On every integer change:**
- The pathways label tweens to the new value (rounded).
- The verdict swaps with a one-line mask: the old line slides up and fades over 160 ms, then the new one rises in over 220 ms.
- `aria-valuetext` becomes, for example, "8 people, 28 coordination pathways, Team". The live region announces the zone only when it changes.

**Zone change, the colour sweep:** an overlay layer in the new colour grows as `clip-path: circle()` from the window's centre (or from the tapped bar or button) out to 150vmax, over 500 ms easeOutCubic. The text colour crossfades at the 250 ms midpoint, over 200 ms.

**The dramatic moment, 14 → 15:** the drum jolts (a 6° overshoot), the oxblood sweep runs at 450 ms, and the Graveyard verdict lands. There are no other "events": no sounds, no confetti, nothing game-like.

### 4.3 Reduced motion
- No intro. The page loads at n = 8, or at `?team`.
- Wheels jump to their value with no spin and no blur. Colour changes are instant.
- The meter bars are drawn at once. The cycle drum does not auto-turn: show all three faces as a static row, `UP · SIDE · DOWN`, with their three job lines.
- The key shows `YOURS` at once.

### 4.4 Debug params
- `?team=1`, `?team=5`, `?team=12`, `?team=13`, `?team=15`, `?team=27` and `?team=40` set n and skip the intro.
- `?section=meter`, `?section=cycle` and `?section=paths` scroll to that section.
- `?nonav=1` stops navigation after the key.

Capture screenshots of: the 3 s hero, then `?team=13`, `?team=15`, `?team=40`, `?section=meter&team=8`, `?section=cycle&team=8`, `?section=cycle&team=20`, and the paths after the key with `?nonav=1`, on desktop and phone.

---

## 5. Art direction

**The look in one line:** a printed instrument on the book jacket's inks. The whole page is one cover colour at a time, full-bleed, with big serif type and one engraved-looking number you can turn.

**Type:**
- **Fraunces** (Google Fonts, OFL; opsz 9–144, wght 100–900, SOFT, WONK; roman and italic): opsz 144 for the question, numerals, drums and stamps; opsz 24–72 for sentences. Keep WONK at 0.
- **IBM Plex Mono** (400/500/600) for labels: a quiet "file and spec" voice.
- Packages: `@fontsource-variable/fraunces` (import the files that include opsz and the italic) and `@fontsource/ibm-plex-mono` (400, 500, 600).
- Fallback: `https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,100..900;1,9..144,100..900&family=IBM+Plex+Mono:wght@400;500;600&display=swap`.

**Colour tokens:**
```css
--cream:#F1EADF; --ink:#1C1A17;
--f-green:#2B5A37;        /* 1, 2-3, 8-12  · cream text 6.71:1 */
--f-olive:#4E5A2B;        /* 4-7 Valley    · cream text 6.23:1 */
--f-ochre:#D49B2C;        /* 13-14         · INK text 7.05:1 (never cream) */
--f-oxblood:#5E1712;      /* 15            · cream text 10.93:1 */
--f-oxblood-deep:#3E0F0C; /* 39 */
--f-slate:#2A2D31;        /* 40+           · cream text 11.58:1 */
--meter-bg:#17150F;
--up:#2B5A37; --side-ink:#A87414; --down:#B2322A;   /* ink colours on paper faces/cards */
```
The cover red `#B2322A` is kept for DOWN and the pencil circle. The Graveyard uses a darker oxblood, so the two never mean the same thing.

**Texture:**
- A fixed overlay over the field: paper grain (SVG `feTurbulence` data URI, 6%, `soft-light`) plus a faint halftone (`radial-gradient(circle, rgb(0 0 0/.05) 0.6px, transparent 0.7px) 0 0 / 3px 3px`).
- Drum cylinder shading over each window: `linear-gradient(to bottom, rgb(0 0 0/.55) 0%, transparent 28%, transparent 72%, rgb(0 0 0/.55) 100%)`, plus a 1 px specular band at 44% (`rgb(255 255 255/.08)`).
- No glow, no gloss, no gradients anywhere else.

**Grid and scale:**
- Everything is centred, with a max content width of 1200 px.
- Type scale: numerals 200 / 120 / 72; H1 84; stamp 56; verdict 36; cycle job line 34; claim 24; body 21; labels 11–15.

**Why it is its own style:**
- It reads like a departures board or a tally counter printed on a book jacket, not a SaaS hero.
- It is not Apple: full-bleed colour, a book serif, no product, no white minimalism.
- It is not an AI template: no gradient, no glass, no cards in the hero, no purple.
- It is not flat: the drums have real cylinder depth, and the page colour is the verdict.
- It answers James's reaction to *97* ("tough as hell" but meaningless): giant numerals again, but every number is the visitor's own and is labelled.

## 6. The ending
See section 04 and S4. The Bootloader card comes first on phone and sits left on desktop, with the word odometer, the file's first question pencilled with the visitor's number, and the GET IT → SENT → YOURS key. The book card has "Pre-orders open soon". "Read the Appendix" links to `LINKS.appendix`.

## 7. Layout summary, desktop 1440 vs phone 390
| Section | Desktop 1440×900 | Phone 390×844 |
|---|---|---|
| 01 Count | Question on one line at 84 px; window 360×250 with 200 px digits and −/+ beside it; verdict 36 px | Question on two lines at 38 px; window 200×160 with 120 px digits; −/+ under it; verdict 20 px; sticky bottom bar |
| 02 Meter | Sticky 180vh; 1000 px meter | One block; 358 px meter with 7 px bars and two labels |
| 03 Your cycle | 560×190 drum; systems on one row | 320×120 drum; systems in a 2×2 grid |
| 04 Paths | Two 520×600 cards side by side | Stacked cards, Bootloader first, full width |

## 8. Tech plan

**Stack:** Vite + React + TypeScript (S1). No canvas, no WebGL, no Lenis (native scroll is fine here). All drums are CSS 3D DOM faces, so the text stays crisp.

**State:** one React context `{ n, setN }`. Derived and memoised: `pathways = n·(n−1)/2`, `zone`, `tempo`, `fieldColour`, `textColour`. Wheel and drum angles live in refs and are driven by the shared rAF loop, so React does not re-render every frame.

**Components:**
- `Drum.tsx` takes `{ digits: 2 | 5, value, faceHeight }`.
- `WordDrum.tsx` takes `{ faces: string[], index }`.
- `Field.tsx` handles the fixed field and the sweep overlay.
- `Meter.tsx` is the SVG meter.
- `Key.tsx` is the opt-in key.

**Budget:** JS at most 90 KB gzipped. Fonts at most 170 KB (Fraunces variable latin roman and italic, plus 3 Plex Mono weights). No images.

**Accessibility, specific to this option:**
- The H1 is the question. The window is a labelled spinbutton (`aria-labelledby` the H1, and `aria-describedby` the pathways label).
- −/+ are real buttons with `aria-label` from `hero.minus` / `hero.plus`.
- The verdict region is `aria-live="polite"`.
- On the ochre field, all text and focus rings switch to ink.
- The wheel listener never blocks page scroll unless the pointer is over the window.

## 9. Copy deck: paste as `src/copy.ts`
Every string below was checked against its cited line in the sources, and the block passes `tools/copycheck.mjs`.

```ts
// src/copy.ts for COUNT YOURSELF. Every sentence is Michael's, word for word.
// BL n = line n of source/public_bootloader.md. M Ln = manuscript line n, as recorded in source/src_copy.ts.
// Lines marked `// label` are UI labels/buttons (not sentences) and are exempt from copycheck.
export const COPY = {
  rail: {
    title: "Scaling Up-Side-Down", // label
    author: "Michael Wentz", // label
    book: "The book", // label
    get: "Get the Bootloader", // label
  },
  hero: {
    forLabel: "For", // label
    who: ["Bootstrapped / self-funded", "Founder-led", "1-12 employees"], // BL 4773-4775 (criterion cells)
    h1: "How many people are on your team?", // BL 310
    whoCounts: "The question isn’t how many people you pay. It’s how many people you have to coordinate.", // BL 3400
    whoCountsToggle: "Who counts?", // label (phone disclosure)
    people: "people", // label
    pathwaysLabel: "coordination pathways", // label
    claim: "12 isn’t where you’re trying to get. It’s the line you don’t cross.", // BL 544
    stamp: "Past twelve, something breaks.", // M L3509
    getBtn: "Get the Bootloader", // label
    getMeta: "V16 · 35,445 words", // label
    bookBtn: "The book · Pre-orders open soon", // label
    minus: "One fewer person", // label (aria-label)
    plus: "One more person", // label (aria-label)
  },
  // Verdicts: tag = label; line = verbatim. Range is inclusive.
  zones: [
    { id: "solo", from: 1, to: 1, tag: "Solopreneur · 1", line: "Maximum leverage, minimum resilience. You are the business." }, // BL 3412 (tag is a label)
    { id: "small", from: 2, to: 3, tag: "Small Team · 2–3", line: "Leader + helpers. Coordination still manageable. 96% stay small." }, // BL 3413 (tag is a label)
    { id: "valley", from: 4, to: 7, tag: "Valley · 4–7", line: "Transition zone between Small Team and Team. Not a destination." }, // BL 3414 (tag is a label)
    { id: "team", from: 8, to: 12, tag: "Team · 8–12", line: "Leader + team. Still know everyone’s name. Where most beautiful bootstrapped businesses live." }, // BL 3415 (tag is a label)
    { id: "threshold", from: 13, to: 14, tag: "Threshold · 13–14", line: "WARNING: You are at the Graveyard threshold. Growing to 15-16 enters structurally dangerous territory." }, // BL 3449 (tag is a label)
    { id: "graveyard", from: 15, to: 39, tag: "The Graveyard · 15–39", line: "The Graveyard is not a temporary problem. It’s a structural trap." }, // BL 3451 (1st + 2nd sentences; tag is a label)
    { id: "tot", from: 40, to: 40, tag: "Team of Teams · 40+", line: "At 40+, Team of Teams physics apply. Different constraints, different playbook." }, // BL 4253 (tag is a label)
  ],
  ceilingTag: "Team (Ceiling)", // label (BL 5125, shown in the tag when n = 12)
  meter: {
    breaks: "Past twelve, something breaks.", // M L3509
    worse: "Every addition makes it worse.", // M L2997
    caption: "Each addition doesn’t add one unit of complexity — it adds n-1 new interaction pathways.", // BL 2339 (1st sentence of the cell)
    at12: "66 · Team (Ceiling)", // label (BL 5125)
    at39: "741 · Graveyard (upper bound)", // label (BL 5130)
    you: "You", // label
  },
  cycle: {
    headline: "Up. Side. Down. Repeat.", // M L1713
    faces: ["UP", "SIDE", "DOWN"], // label
    jobs: ["Up for growth.", "Side for stability.", "Down for pruning."], // BL 795
    systems: {
      up: ["Content & Product Creation", "Lead Generation", "Lead Conversion", "Customer Success & Retention"], // BL 2007-2010
      side: ["Team & Roles", "Systematization", "Technology, Automation & AI", "Inventory & Fulfillment"], // BL 2007-2010
      down: ["Profitability Optimization", "Risk Management", "Operational Efficiency", "Product Quality & Delivery"], // BL 2007-2010
    },
    clock: "The system doesn’t change. The clock speed does.", // BL 2122
    deposit: "Each cycle deposits systems and margin. The next cycle withdraws from a larger account.", // BL 866
    phaseChange: "At 13-14 employees, next hire is a phase change, not incremental growth.", // BL 3450 (1st sentence of the cell)
    exits: ["Streamline to 12", "Raise capital", "Crisis"], // label (BL 3459-3461 option cells)
    noWayThrough: "There is no “optimize your way through” option.", // BL 3463
    streamlineBtn: "Streamline to 12", // label (sets the team to 12)
    outOfScope: "At 40+, Team of Teams physics apply. Different constraints, different playbook.", // BL 4253
  },
  // Tempo (numbers and labels only), BL 161-164. Tempo bands are NOT the destination bands.
  tempo: [
    { from: 1, to: 3, up: "3 days", side: "1 day", down: "1 day", cadence: "Weekly" }, // label (BL 161)
    { from: 4, to: 6, up: "1 week", side: "1 week", down: "1 week", cadence: "Bi-weekly" }, // label (BL 162)
    { from: 7, to: 9, up: "1 month", side: "1 month", down: "1 month", cadence: "Monthly" }, // label (BL 163)
    { from: 10, to: 12, up: "1 quarter", side: "1 quarter", down: "1 quarter", cadence: "Quarterly" }, // label (BL 164)
  ],
  paths: {
    fileName: "SUSD_Bootloader_V16.md", // label (version per BL 747)
    fileMeta: "V16 · October 2026", // label
    words: "words", // label
    refLine: "The pages are reference. The file is the operating system.", // M L4497
    firstAsk: "The first thing it asks:", // label
    firstQuestion: "How many people are on your team?", // BL 310
    email: "Email address", // label
    placeholder: "you@company.com", // label
    badEmail: "Enter your email address.", // label
    key: ["GET IT", "SENT", "YOURS"], // label
    upload: "Upload the file and use the starting prompt provided with it.", // M L4531
    locate: "Then let the system locate you.", // M L4533
    bookLine: "You were never the problem. The model you inherited was.", // M L216
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

1. **No calculator, dashboard or slot machine.** Use one drum, cut into the page. Don't build a device housing, an LCD or 7-segment digits, a keypad grid, or a second giant counter for pathways. Pathways stays a label.
2. **Never demote the question or the claim.** The H1 is the question at 84 px. The claim line (BL 544) and the verdict (36 px) are always on the first screen.
3. **No game feel.** No sounds, confetti, "level up", scores, streaks, bouncy springs (overshoot stays under 6°, and only at 14 → 15), or haptics beyond a single `navigator.vibrate(10)` on Android at 15.
4. **Never cream text on the ochre field** (2.06:1). Threshold flips all text and focus rings to ink.
5. **The Graveyard is oxblood, not cover red.** Cover red is reserved for DOWN and the pencil circle.
6. **Bands follow the Bootloader canon** (Threshold 13–14, Graveyard 15–39, Team of Teams 40+, BL 69–77), not the manuscript's "12–40 people" kicker (`copy.ts` L3562). Tell James this in the README.
7. **Keep tempo bands and destination bands separate** (BL 2202). The cycle's speed uses 1–3 / 4–6 / 7–9 / 10–12. The verdicts use 1 / 2–3 / 4–7 / 8–12.
8. **Don't hijack scrolling.** The wheel steps the drum only while the pointer is over the window. Touch swipes on the window are horizontal only.
9. **Don't let the intro delay the visitor.** It lasts 2.9 s at most, and any input skips it.
10. **The colour field is never a gradient.** One flat cover ink at a time, with grain. The sweep is a hard-edged circle, not a blur.
11. **No left-aligned text blocks** and no picture. The number and the sentences are the whole composition.

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

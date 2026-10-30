# BRIEF: WATERLINE (slug `waterline`)

**Pitch for James:** Michael's thesis is set as one huge sentence, "Every hire compounds complexity before it compounds capacity.", and real-time water rises toward it as you scroll, each scroll step another hire. Up to twelve people it stays dry. Past twelve the water reaches the words, and past fifteen it swallows them in red. Then Up, Side and Down drain it lap by lap, and getting the Bootloader drains the whole page dry.

**Built from:** judges' #4 *Waterline* (wildcard-1), which had the highest look score of all twelve concepts (7/10), plus the scroll-as-headcount gauge from the references (D3 *The Deep Sea*) and the "margin" gap label from *Season Clock* (cycle-2).

**Judges' criticisms, fixed here:**
- *Pixel-matching WebGL text to the DOM is fragile.* The sentence is never drawn into WebGL. Two identical DOM copies, one dry and one wet, are clipped by the same surface function the shader uses, so they line up by construction (§8).
- *The water reads as a screensaver if nobody touches it.* The visitor's scroll is the hiring, so everyone drives it. At rest only a gentle swell of 5 px or less moves.
- *The cycle's rising platform is abstract.* The cycle is now labelled in plain words. The water is labelled `complexity`, the deck under the words `capacity`, and the air gap between them `margin`. It ends on Michael's own equation, "Capacity > Complexity = Oxygen."
- *A team-size question would duplicate another option.* The book's question sits at the head of a read-only tide gauge with the zone names, so every founder can find their own number without an input. The *Count Yourself* option owns the input.

---

## 1. The big idea

Complexity is water, and the business is the sentence. The water's height is computed from the number of coordination pathways, n(n−1)/2, so it rises slowly at first and then faster with every hire. Readable means the business can breathe. Underwater means Redline, in Michael's words: "The business is drowning. Every addition makes it worse." (BL 717). The picture never competes with the sentence. It threatens the sentence, which is why the eye stays on the words. The cure uses the same material: Up lets water in, Side raises the deck the words stand on, Down drains it. Each lap leaves more air, and that air is the margin.

## 2. The five-second test

A stranger must be able to say: *"Michael Wentz's book says every hire adds complexity faster than capacity. That's the water. It's for bootstrapped founders with teams of up to 12. Past 12 you go under. I scroll to see it, or get the Bootloader."*

### Desktop 1440×900, the 3.0 s frame (team at 8, at rest)
| y | Element | Spec |
|---|---|---|
| 0–56 | Rail (on paper) | Left: `SCALING UP-SIDE-DOWN` in Bricolage 13 px wght 700, tracking +0.08em, ink; the first hyphen in `--up` and the second in `--side`. Centre: `MICHAEL WENTZ` 12 px tracked. Right: `The book` (text) and `Get the Bootloader` (ink pill, 36 px). |
| ~112 | Kicker | `hero.kicker` in JetBrains Mono 13 px caps, tracking +0.12em, Down red `#B2322A`. |
| ~150–440 | **H1** | "Every hire compounds / complexity before it / compounds capacity." Three forced lines, centred. Bricolage Grotesque opsz 96, wdth 80, wght 800, **6.6vw (≈95 px)**, line-height 0.98, tracking −0.015em, ink `#16130F`. The biggest, darkest thing on screen. |
| ≈ 440 (Lmap(8)) | **Water surface** | A live line about 26 px under the H1's last baseline (team = 8). Bright 1.2 px foam edge `#F6F1E7`, swell of 5 px or less. Below it, water to the bottom of the screen: `#1F3D2A` at the surface darkening to `#0B1611`, with faint caustics. |
| ~560 | Readout (in the water, cream) | Two figures on one line, with a middle dot between them: **8** (Bricolage 88 px wght 700 in ochre `#D49B2C`) and the label `people` (Mono 12 px caps); **28** (88 px cream) and `pathways`. Numerals are tabular. |
| ~680 | Zone (in the water) | Tag `TEAM · 8–12` (Mono 12 px caps, ochre), then `zones.team.line` "Leader + team. Still know everyone’s name." (Bricolage 26 px wght 500, cream). |
| ~830 | Scroll cue | `hero.scrollCue` (Mono 12 px caps, cream at 80%) with a 6 px chevron bobbing 4 px. |
| right edge, x = 1384 | **Tide gauge** | A 1 px vertical hairline from y 10% to 96%. Ticks sit at the water levels for n = 1, 3, 7, 12, 14, 39 and 40+, each with its zone name to the left (Mono 10 px caps, ink above the water and cream below it). A small ochre ◀ marker points at the current n. `hero.gaugeHead` "How many people are on your team?" sits at the gauge's top (Bricolage 14 px wght 600, right-aligned to the hairline). The **12 tick sits exactly at the H1's last baseline**. |

Squint test: the black three-line sentence on paper is the brightest and biggest thing, with dark water just beneath it. The water reads as a threat to the words.

### Phone 390×844, the 3.0 s frame
| y | Element | Spec |
|---|---|---|
| 0–44 | Rail | `SCALING UP-SIDE-DOWN` 11 px left; `Get the Bootloader` 11 px right. |
| ~58 | Kicker | Two lines, Mono 10.5 px caps, red: `MICHAEL WENTZ ·` / `FOR BOOTSTRAPPED FOUNDERS · TEAMS OF 1–12`. Build it from `rail.author` plus `hero.kicker`. |
| ~104–420 | H1 | 11.6vw (≈45 px), wdth 78, wght 800, line-height 1.0. Five balanced lines, centred. |
| ≈ 445 | Surface | 24 px under the last baseline. |
| ~500 | Readout | **8** `people` · **28** `pathways` at 44 px. |
| ~570 | Zone | Tag, then the zone line at 17 px, on two lines. |
| ~790 | Scroll cue | |
| right edge | Gauge | Ticks and numbers only (1 · 12 · 15 · 40), 9 px; no zone names, no gauge head. |

### The 600 ms frame
The rail, kicker and H1 are in. The water is rising from the bottom, with the readout counting through about 3 people and 3 pathways. The sentence is already readable.

---

## 3. Section-by-section flow

There is one fixed full-viewport water layer for the whole page, and its level is a function of scroll (§8). The sections below set that level.

Sections 01–02 (Tide), 03 (Turn) and 05 (Paths) are **MUST**. Section 04 (Cycle) is **MUST** too, because it carries Michael's Oct 27 ask: "making the central idea of cyclical growth (Up, Side, Down) clear". If time runs short, cut its strata hatching and the lap labels, never the three phases.

### 01–02 · TIDE (`#tide`: a 420vh section on desktop and 360vh on phone, with a sticky 100svh stage). The hero is the top of it.
- Stage contents: the H1 (a `WetText`, see §8), the readout, the caption slot (centred at y 0.60V), the zone line, and the gauge.
- **Intro (hero only):** see §4.1.
- **Scroll maps to headcount.** p is the section progress (0–1).

  | p | n |
  |---|---|
  | 0–0.05 | holds at 8 |
  | 0.05–0.25 | 8 → 12 |
  | 0.25–0.42 | 12 → 15 |
  | 0.42–0.72 | 15 → 39 |
  | 0.72–1 | holds at 39 (Redline) |

  Each segment uses smoothstep. The readout shows `Math.round(n)` and its pathways. The water uses the continuous n, so the level moves smoothly. **The tide stops at 39**, the Graveyard's upper bound. 40+ is Team of Teams, which is out of scope, not the Graveyard.
- **The level map, Lmap(n)**, in viewport px. V is the viewport height. B is the H1's last baseline, T the top of its first line box, P its line pitch and xh the x-height (≈ 0.53 × font-size); measure them all after fonts load. Interpolate linearly in pathways p(n) = n(n−1)/2 between these control points:

  | n (pathways) | Surface y |
  |---|---|
  | 1 (0) | 0.94V |
  | 8 (28) | B + 0.028V |
  | 12 (66) | B + 3 px, lapping the baseline (the line you don't cross) |
  | 13 (78) | B − 0.4·xh, touching the letters |
  | 15 (105) | T + 1.5P, halfway up the sentence |
  | 20 (190) | T − 12 px, sentence fully under |
  | 30 (435) | 0.10V |
  | 39 (741) | −0.04V, screen flooded |

- **Captions** (one at a time, in the caption slot; cream on the water):
  - n 9–12: the readout zone line is `zones.team.line`. When n reaches 12, the pathways numeral reads 66 and pulses once (scale 1.06, 300 ms).
  - n = 13 (crossing up): the kicker `tide.kicker13` (Mono 12 px caps, ochre) and **`tide.breaks`** (Bricolage 46 px wght 750). At the same moment the surface touches the H1 and a ripple runs along the letters: spawn 3 ripples at the H1's left, centre and right.
  - n 13–14: tag `THRESHOLD · 13–14` with `zones.threshold.line`.
  - n 15–39: tag `GRAVEYARD · 15–39` with `zones.graveyard.line`. The wet H1 copy turns red (§5) and wobbles.
  - n 30 → 39: the wet H1 sinks (translateY 0 → 4vh, blur 0 → 2 px, opacity 1 → 0.25) so it never collides with the Redline line.
  - p 0.72–1 (flooded): the readout fades out. Centred at y 0.46V, **`tide.redline`** at 7vw (Bricolage wght 800, `--down-wet` `#E0574B`), with `tide.drowning` under it (28 px, cream). The gauge marker sits at 39, `GRAVEYARD`.
- The gauge, readout and captions fade out over the last 5% of the section.

### 03 · THE TURN (`#turn`, 140vh with a sticky stage)
- p 0–0.2: still, dark water and no text. The chop calms (amplitudes × 0.3) and the caustics slow to 50%.
- p 0.2–0.6: the water level descends from −0.04V to 0.62V. At the same time **`turn.line`** ("You were never the problem. The model you inherited was.") rises from y 0.86V to 0.38V. It is Bricolage 4.4vw wght 750, two balanced lines, and a `WetText`: cream while it is under water, ink once it is above. **It breaks the surface**, the relief the first seven chapters are built on.
- p 0.6–1: hold.

### 04 · THE CYCLE (`#cycle`: 380vh on desktop and 300vh on phone, with a sticky stage)
- **Stage.**
  - The standing type **`cycle.standing`** ("Up. Side. Down. Repeat.") is a `WetText` set in Bricolage 7.2vw wght 800, on one line on desktop, with its baseline at 0.46V. "Up." is `--up`, "Side." `--side-ink`, "Down." `--down` and "Repeat." ink.
  - The **deck** is a 2 px ink rule 10 px under the baseline, as wide as the text plus 80 px, with a soft shadow under it (0 6px 14px rgb(0 0 0/.18)).
  - The water starts at 0.62V.
  - The caption slot is centred at y 0.15V.
  - Mono labels (11 px caps): `capacity` at the deck's right end, and `complexity` at the right end of the water surface (it rides with the surface).
- **Phases.** p 0–0.08 is the intro: the labels draw in. Then there are three laps. Lap k (k = 0, 1, 2) starts at s = 0.08 + 0.24k and has three phases of 0.08 each:
  - **UP** [s, s+0.08]: the caption is `cycle.phases[0]`, 40 px, with "Up" in green. A 4 px underline grows under "Up." in the standing type. The water rises by 0.11V. You can see the gap shrink.
  - **SIDE** [s+0.08, s+0.16]: the caption is `cycle.phases[1]`. A **stratum band** slides in from the left under the deck over 600 ms easeOutCubic. Bands are 0.045V, 0.055V and 0.065V tall; each has 1 px ink rules top and bottom, hatching (`repeating-linear-gradient(45deg, rgb(22 19 15/.12) 0 1px, transparent 1px 6px)`) and the label `systems` at its right end. The deck and the standing type lift by the band's height. Lap 0 only: sub-caption `cycle.sideOnce` at 24 px.
  - **DOWN** [s+0.16, s+0.24]: the caption is `cycle.phases[2]`. The water drains by 0.09V. Lap 0 only: sub-caption `cycle.downOnce`.
  - From lap 1 on, a vertical dimension line (1 px ink with 6 px end ticks) measures the air gap between the surface and the deck, labelled **`margin`**. It visibly widens every lap. `cycle.lapLabels[k]` sits beside each band, at 10 px mono.
- **Close** (p 0.80–0.88): the caption slot shows `cycle.close` at 26 px, max-width 980 px.
- **Oxygen** (p 0.88–1): the standing type crossfades (400 ms) to **`cycle.oxygen`** at the same size, with "Oxygen." in `--up`. `cycle.breathe` (26 px) sits under the deck. The water eases down off-screen to V + 20 px: lots of air.

### 05 · TWO PATHS (`#paths`, 100svh on desktop, auto height on phone, normal flow)
- **Water.** The surface rides 72 px above the section's bottom edge: level = `paths.getBoundingClientRect().bottom − 72`. The section stands on a calm strip of water like a dock.
- **Header** (40 px wght 750, split per column): `paths.bookHead` above the left column, `paths.fileHead` above the right.
- **Left, the book:** a typographic cover (300×440 px, paper `#EFE6D8`, a real shadow, `UP / SIDE / DOWN` stacked in the three inks at 64 px wght 800, `Michael Wentz` at the foot), then the "Pre-orders open soon" button (S4).
- **Right, the file:**
  - A stack of three sheets (360×460 px, offsets 6 px and 12 px, paper `#F6F1E8`) with `paths.fileName` (JetBrains Mono 14 px) and `paths.fileMeta`, plus `paths.fileFace` faint at 11 px.
  - Then `paths.upload` (20 px), the email field (360×56 px) and **`paths.submit`** ("Get the Bootloader", an ink pill 56 px tall).
- **Signature confirmation, THE DRAIN** (S4 rules), 1600 ms at most:
  1. If the water strip is not in view (on phone), raise it to V − 0.12V over 250 ms.
  2. The surface gets a chop spike: amplitudes × 3, decaying over 600 ms.
  3. The level falls to V + 40 px over 1000 ms easeInCubic, and the foam line snaps away. The whole page is dry paper.
  4. A red **"Yours"** stamp lands on the file (Bricolage 64 px wght 800, rotated −6°, scale 1.3 → 1, blur 2 → 0, 180 ms).
  5. `paths.closed` ("This document is the closed system.") fades in under the stamp at 22 px.
  6. After 300 ms, navigate to `LINKS.get`.
- `paths.appendix` link.
- **Phone:** the file comes first, then the book, both full width. The header lines sit above their own blocks.

### Footer
`footer.line` and "Read the Appendix", on dry paper, centred.

### Persistent navigation
After `#tide`, desktop gets a 44 px solid-paper top bar (hairline bottom) with `The book` and `Get the Bootloader`, both linking to `#paths`. Phone gets a sticky bottom bar with the two actions, which hides inside `#paths`.

---

## 4. Signature interaction and motion spec

The signature is **scroll to hire, watch the water** (Tide), plus **the drain** (Paths). Easing tokens: `easeOutCubic` cubic-bezier(.33,1,.68,1), `easeOutQuint` cubic-bezier(.22,1,.36,1), `easeInCubic` cubic-bezier(.32,0,.67,0).

### 4.1 Intro (t = 0 at fonts ready, capped at 1200 ms; any input skips to the end state)
| t (ms) | What happens |
|---|---|
| 0–300 | The rail and kicker fade in. |
| 0–520 | The H1 words rise in: y 14 → 0 px with opacity, 420 ms easeOutQuint, 30 ms stagger. |
| 300–2300 | The water rises from V + 20 to Lmap(8). n(t) = 1 + 7·easeOutCubic(t), and the readout counts 1 → 8 and 0 → 28 in integer steps. The gauge marker rides the level. On arrival, the level spring (k 120, c 14) overshoots by about 10 px and settles: a small slosh. |
| 2300 | The zone line and scroll cue fade in. |

### 4.2 The water (always running unless reduced motion)
- **Surface:** `y_s(x,t) = L + A1·sin(2π·1.6·x/W + 0.9t) + A2·sin(2π·3.7·x/W − 1.7t) + Σ ripples`. A1 = 5 px and A2 = 2.5 px on desktop; 3.5 px and 1.8 px on phone.
- **Ripples:** at most 6, each `a·e^{−1.6(t−t0)}·e^{−|x−x0|/160}·sin(0.045|x−x0| − 7(t−t0))` with a = 8 px.
  - A ripple spawns when the pointer crosses the surface line at more than 0.2 px/ms (120 ms cooldown).
  - A ripple also spawns at a random x when the target level jumps by more than 30 px within 100 ms.
- **Level:** the target comes from the section logic above. The rendered level follows the target through a spring (k 120, c 18), which gives a natural slosh.
- **Shader:**
  - Below the surface, colour = mix(`#1F3D2A`, `#0B1611`, depth^0.7).
  - Caustics: two layers of `abs(sin)` products at a scale of 1/140 px, raised to the 6th power, × 0.10 × (1 − depth), in cream.
  - Alpha = mix(0.72, 0.95, smoothstep(0, 0.6, depth)), output premultiplied.
  - A 1.2 px foam edge `#F6F1E7` at alpha 0.9, and a 14 px darker meniscus band under it (× 0.82).
  - Above the surface, alpha is 0.
- **Wet type:** the wet copy of any `WetText` gets per-line wobble, `translateX(sin(1.3t + 1.7i)·3px) skewX(sin(0.9t + i)·0.5deg) scaleY(1.03)`, plus a 0.4 px blur and a depth fade (`mask-image: linear-gradient(to bottom, #000, rgb(0 0 0/.55))`).

### 4.3 Reduced motion
- There is no intro, no swell, no ripples and no wobble.
- The WebGL layer is replaced by the CSS fallback (§8), and the sticky sequences become stacked static blocks, each with its own fixed water level:
  1. Hero (n = 8)
  2. n = 13, with `tide.breaks`
  3. Flooded, with `tide.redline` and `tide.drowning`
  4. Turn, line above the water
  5. Cycle end state: three bands, the margin label and all three phase lines stacked
  6. Oxygen
  7. Paths
- The drain becomes an instant cut to dry paper with the stamp shown.

### 4.4 Debug params
- `?n=13`, `?n=15` and `?n=39` pin the Tide stage at that headcount.
- `?section=turn`, `?section=cycle&lap=3` and `?section=oxygen` jump to those states.
- `?fallback=1` forces the CSS water.
- `?nonav=1` stops navigation after the drain.

Capture screenshots of: the default 3 s hero, `?n=13`, `?n=15`, `?n=39` (Redline), `?section=cycle&lap=3`, `?section=oxygen`, and the drained paths with `?nonav=1`, on desktop and phone.

---

## 5. Art direction

**The look in one line:** a newsroom poster with a living tide under it. It is printed type on cover paper, and the only "image" is a physical, lit material that acts on the sentence.

**Type:**
- **Bricolage Grotesque** (Google Fonts, OFL; opsz 12–96, wdth 75–100, wght 200–800) for every sentence. Display settings are opsz 96, wdth 78–80, wght 750–800: a sturdy, semi-condensed grotesk that stays readable while it wobbles.
- **JetBrains Mono** (OFL, variable wght) for the gauge, labels and readout labels. It gives a quiet instrument voice.
- Packages: `@fontsource-variable/bricolage-grotesque` (import the file that includes opsz and wdth) and `@fontsource-variable/jetbrains-mono`.
- Fallback: `https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wdth,wght@12..96,75..100,200..800&family=JetBrains+Mono:wght@400;500;700&display=swap`.

**Colour tokens:**
```css
--paper:#F1EADF; --ink:#16130F;
--water-top:#1F3D2A; --water-deep:#0B1611; --foam:#F6F1E7;
--cream:#F1EADF;           /* text on water: 9.99:1 on --water-top */
--up:#2B5A37;              /* on paper 6.71:1 */
--side:#D49B2C;            /* the visitor-number numeral on water (7.25:1 on --water-deep) */
--side-ink:#A87414;        /* ochre text on paper, 24 px or larger only */
--down:#B2322A;            /* red on paper (5.20:1) */
--down-wet:#E0574B;        /* red text on water (4.79:1 on --water-deep) */
```
- The water is the cover green, darkened. No blue, no ocean.
- The wet H1 copy is `#C9453A` near the surface, darkening with depth through the mask.

**Texture:**
- Above the water: a paper grain (SVG `feTurbulence` data URI at 7%, multiply).
- Below it: real-time caustics, depth darkening, a crisp foam line and a soft meniscus shadow. No reflections, no lens flare, no bloom.

**Grid and scale:**
- Desktop: everything centred, with a max content width of 1320 px. The gauge is the only edge-anchored element, and it is a read-only instrument.
- Type scale: H1 6.6vw; Redline 7vw; standing type 7.2vw; captions 46 / 40 / 28 / 26 / 24; labels 10–13 px mono.

**Why it is its own style:**
- It is not Apple: no product, no black void, no system font.
- It is not an AI template: no decorative gradient (the gradient is water depth), no glass, no cards.
- It is not *Reflection*: that was beauty with no meaning, and here every pixel of water is a pathways count or a term in Michael's equation.
- It is not flat: the depth is real refraction-like distortion of the actual sentence.

## 6. The ending
See section 05 and S4. The book is on the left and the file on the right (on phone the file comes first). The signature confirmation is **the drain**: the closed system lifts the visitor out of the water. "Read the Appendix" links to `LINKS.appendix`.

## 7. Layout summary, desktop 1440 vs phone 390
| Section | Desktop 1440×900 | Phone 390×844 |
|---|---|---|
| Tide | 3-line H1 at 6.6vw; readout at 88 px; full gauge with names | 5-line H1 at 11.6vw; readout at 44 px; gauge ticks only |
| Turn | Line at 4.4vw, 2 lines | Line at 9vw, 4 lines |
| Cycle | Standing type on one line at 7.2vw; labels at the right | Standing type on two lines at 13vw ("Up. Side." / "Down. Repeat."); labels under the deck |
| Paths | Two columns standing on a 72 px water strip | Stacked, file first; water strip at the section's end |

## 8. Tech plan

**Stack:** Vite + React + TypeScript (S1), `lenis@1.1.13` on desktop only (`syncTouch: false`), and raw **WebGL2** with no 3D library: one program and one full-screen triangle, about 200 lines in `water/gl.ts`.

### Architecture (the fix for the judges' biggest worry)
- **One water model in JS** (`water/model.ts`) holds the level spring, ripples, time and amplitudes. It exposes `surfaceY(xPx): number` and writes the shader uniforms each frame: `uLevel`, `uTime`, `uA1`, `uA2`, `uRip[6]` (vec4: x, t0, amp, 0), `uRes` and `uDpr`. The shader evaluates exactly the same formula, so the JS clip lines and the GL surface always agree.
- **`<WetText>`** renders its children twice, stacked in one CSS grid cell, so the layout is identical:
  - `.dry` is the real text, at z 1, under the canvas.
  - `.wet` is a duplicate with `aria-hidden="true"`, at z 3, above the canvas.
  - Each frame, sample 48 x-positions across the element's rect and build two `clip-path: polygon(...)` lists: `.dry` keeps everything above the surface and `.wet` everything below.
  - When the surface is entirely below the element, `.dry` is unclipped and `.wet` is `visibility: hidden`. When it is entirely above, the reverse.
  - Lines are wrapped in spans for the wobble. Use explicit `<br>` for the desktop H1. On phone, a line splitter runs after fonts load: group words by `getClientRects().top`, and re-run it on resize.
- **Z-order:** paper (0) → `.dry` text (1) → the WebGL canvas (2: `position: fixed; inset: 0; pointer-events: none`) → `.wet` text (3) → in-water UI, meaning readouts, captions and gauge (4) → nav (5).
- **Level per scroll:** a single `levelTarget()` on the shared rAF loop reads which section's sticky stage is active and its progress, then applies that section's mapping (§3). The values are continuous at the section boundaries. Measure the H1 metrics (B, T, P, xh) from the DOM after `document.fonts.ready` and on resize, debounced to 120 ms. Use a zero-size inline-block "baseline probe" span at the end of the H1 to read B exactly.
- **CSS fallback** (`?fallback=1`, no WebGL2, reduced motion, or a phone with `navigator.hardwareConcurrency ≤ 4`):
  - Water is a fixed `div` with `linear-gradient(var(--water-top), var(--water-deep))`, topped by a static SVG wave path with a 1.2 px foam stroke, moved by `transform: translateY(level)` with a 500 ms CSS transition.
  - `WetText` uses flat `clip-path: inset()` at the level.
  - No ripples, no caustics.
- **DPR cap:** 1.5 on desktop and 1.25 on phone. The water is soft and does not need more. Pause the loop when the tab is hidden, and after the drain.
- **Budget:** JS at most 110 KB gzipped. Fonts at most 160 KB (Bricolage variable, latin; Mono at weights 400/500/700 only). GPU time well under 2 ms per frame on a laptop.

### Accessibility, specific to this option
- The H1 is the `.dry` element, real text, and never `aria-hidden`.
- The readout has `aria-live="polite"` and announces only zone changes, e.g. "13 people, 78 pathways, Threshold".
- The gauge is decorative (`aria-hidden`). Its information is repeated in the readout.
- The water never covers interactive controls.

## 9. Copy deck: paste as `src/copy.ts`
Every string below was checked against its cited line in the sources, and the block passes `tools/copycheck.mjs`.

```ts
// src/copy.ts for WATERLINE. Every sentence is Michael's, word for word.
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
    kicker: "For bootstrapped founders · Teams of 1–12", // label
    h1: "Every hire compounds complexity before it compounds capacity.", // M L696
    gaugeHead: "How many people are on your team?", // BL 310
    people: "people", // label
    pathways: "pathways", // label
    scrollCue: "Scroll to hire", // label
  },
  // zone tags are labels; zone lines are verbatim (shown in the water readout as n passes)
  zones: {
    solopreneur: { tag: "Solopreneur · 1", line: "Founder only. No coordination overhead." }, // BL 1247 (tag is a label)
    smallTeam: { tag: "Small Team · 2–3", line: "Leader + helpers. Coordination manageable." }, // BL 1248 (tag is a label)
    valley: { tag: "Valley · 4–7", line: "Transition zone between Small Team and Team." }, // BL 1249 (tag is a label)
    team: { tag: "Team · 8–12", line: "Leader + team. Still know everyone’s name." }, // BL 1250 (tag is a label)
    threshold: { tag: "Threshold · 13–14", line: "At 13-14 employees, next hire is a phase change, not incremental growth." }, // BL 3450 (1st sentence of the cell; tag is a label)
    graveyard: { tag: "Graveyard · 15–39", line: "The Graveyard is not a temporary problem. It’s a structural trap." }, // BL 3451 (1st + 2nd sentences; tag is a label)
    teamOfTeams: { tag: "Team of Teams · 40+", line: "At 40+, Team of Teams physics apply. Different constraints, different playbook." }, // BL 4253 (tag is a label)
  },
  gaugeTicks: ["Solopreneur 1", "Small Team 2–3", "Valley 4–7", "Team 8–12", "Threshold 13–14", "Graveyard 15–39", "Team of Teams 40+"], // label (zone names, BL 69-77)
  tide: {
    kicker13: "Our best quarter ever", // M L464 (kicker)
    breaks: "Past twelve, something breaks.", // M L3509
    redline: "Complexity > Capacity = Redline.", // M L2997
    drowning: "The business is drowning. Every addition makes it worse.", // BL 717
  },
  turn: {
    line: "You were never the problem. The model you inherited was.", // M L216
  },
  cycle: {
    standing: "Up. Side. Down. Repeat.", // M L1713
    phases: ["Up for growth.", "Side for stability.", "Down for pruning."], // BL 795
    sideOnce: "Systems were what actually held the weight.", // M L2408
    downOnce: "Something needs to be cut.", // M L2564
    labels: { water: "complexity", deck: "capacity", gap: "margin", band: "systems" }, // label
    lapLabels: ["Cycle 1", "Cycle 2", "Cycle 3"], // label
    close: "Each cycle starts higher than the last because systems built in Side and margin captured in Down compound into the next Up.", // BL 4488
    oxygen: "Capacity > Complexity = Oxygen.", // M L2999
    breathe: "The business can breathe. Systems carry what the business creates.", // BL 718
  },
  paths: {
    bookHead: "The book changed how you think.", // M L4553
    fileHead: "This SUSD Bootloader changes how you operate.", // M L4555
    bookTitle: "Scaling Up-Side-Down", // label
    bookAuthor: "Michael Wentz", // label
    preorder: "Pre-orders open soon", // label
    fileName: "SUSD_Bootloader_V16.md", // label (version per BL 747)
    fileMeta: "V16 · October 2026 · 35,445 words", // label
    fileFace: ["# THE SUSD BOOTLOADER", "## Scaling Up-Side-Down Operating System — Front Matter", "## PURPOSE"], // BL 1-6 (headings shown faint on the file face)
    upload: "Upload the file and use the starting prompt provided with it.", // M L4531
    email: "Email address", // label
    placeholder: "you@company.com", // label
    badEmail: "Enter your email address.", // label
    submit: "Get the Bootloader", // label
    stamp: "Yours", // label
    closed: "This document is the closed system.", // M L4525
    appendix: "Read the Appendix", // label
  },
  footer: {
    line: "Up. Side. Down. Repeat.", // M L1713
  },
};
```

## 10. What NOT to do (the traps most tempting for this concept)

1. **Never draw the sentence into a WebGL texture.** Use the dual DOM copy with clip-paths (§8). Text that drifts against the DOM is the judges' biggest risk, and this design removes it.
2. **The water's height always means something:** the pathways for n in Tide, the equation terms in Cycle, and the opt-in in Paths. Never animate the level just for looks. The gentle swell stays at 5 px or less.
3. **Don't drown the hero on load.** The default n of 8 keeps the sentence dry and crisp in every first-screen screenshot.
4. **Not *Reflection*:** no mirrored type, no glossy water, no specular sparkle, no lens flare, no bloom, no blue ocean.
5. **No depth-dive.** The camera never travels down through zones. The water rises over the words on one screen.
6. **No team-size input in this option.** The gauge is read-only (*Count Yourself* owns the input). Don't add a slider "to be helpful".
7. **Never call 40+ "Graveyard".** The tide stops at 39 (Graveyard upper bound). 40+ is Team of Teams, out of scope.
8. **The cycle must keep its plain labels:** `complexity`, `capacity`, `margin`. Without them it becomes the abstract platform the judges disliked.
9. **The Redline line must never overlap the sinking H1.** Fade and sink the wet copy first (§3).
10. **No chart axes or gridlines on the gauge.** It is a tide gauge with zone names, not a graph (Curve was rejected).
11. **No blocks, no tower,** and no "toppling" animation of the type. The sentence goes under; it never falls over.

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

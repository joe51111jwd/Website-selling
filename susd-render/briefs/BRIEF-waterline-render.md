# BRIEF · Waterline, rendered: the scroll-only story and the conversion

**For:** the scene builder (Blender sequences) and the site builder (the page that plays them).
**Decided direction:** WATERLINE, rebuilt as real Blender renders. James chose it ("the waterline could
work") and set three rules today:

> "You just need to show the story the waterline could work but the user should only need to scroll
> nothing else if they don't want to. It should get the point across even if they click nothing. It's
> all about getting clicks on the boot loader"

**What this brief fixes:** the first screen, the nine scroll beats, the Bootloader conversion design,
the render plan and budget, the phone version, the fallbacks, and the copy deck. Where it says
*must*, it is a requirement; where it says *should*, the builder may change it after a test still,
and must note why in the build README.

**Read with:** `docs/01-MEANING.md` (the book; sections 3, 5.B and 6), `docs/03-TYPE.md` (Plimsoll,
Ortica, B612; Blender kerning), `docs/05-RENDER-PIPELINE.md` (staging c, the lock wall; c-window;
measured costs), `susd-options/brief/TASTE.md` (James's reactions), `susd-options/brief/BRIEF-waterline.md`
and `susd-options/waterline/` (the CSS/WebGL Waterline this replaces). `docs/02-AI-TELLS.md` overrides
section 11 here once it exists.

**Copy deck:** `briefs/copy-deck.waterline-render.ts` (paste as `src/copy.ts`; reproduced in section 14).
`node /home/user/Website-selling/susd-options/tools/copycheck.mjs briefs/copy-deck.waterline-render.ts`
prints `37 sentences checked, 0 not found in Michael's text`.

---

## 0. The idea in one paragraph

Michael's thesis, "Every hire compounds complexity before it compounds capacity." [M 696 · copy.ts:60],
is three lines of heavy painted-steel capitals (our face, Plimsoll Heavy) standing on a landing at the
far wall of a real canal-lock chamber. Scrolling is hiring. Each scroll step adds a person, and the lock
fills by exactly the coordination pathways that person adds (n(n-1)/2). So every step of water is bigger
than the last, and the visitor feels the compounding in their scroll wheel. Dry up to twelve: the water
stops at a painted Plimsoll load-line mark, ⦵, marked 12. At thirteen it crosses the mark and touches
the letters. Past fifteen it swallows them, and we go under with the words. Then the lock does
what locks do. Side lifts the words on a new course of concrete. Down drains the chamber. Up lets
the water rise again, but only to the ⦵ line. Each cycle ends with the words higher and more air
beneath them. The story ends on glassy water, the words high and dry above their own flood scar,
and the Bootloader: the file that runs this cycle with your AI. That file carries the same ⦵ mark
from the first screen to the last.

**Five-second test** (from the first screen alone, without scrolling or clicking, a stranger can say):
*"It's Michael Wentz's book* Scaling Up-Side-Down*, for bootstrapped founders with teams of 1 to 12.
It says every hire adds more complexity than capacity, and that's the water rising toward the words.
I can scroll to watch it, or get the free Bootloader file for my AI."*

---

## 1. Rules this brief serves

1. **Scroll only.** Every beat is understood by scrolling alone. Nothing is behind a hover, a click,
   a hold, a dial or a "reveal". The only clickable things are the two paths: the Bootloader (four
   entry points, one form) and the book (one link, one disabled button), plus "Read the Appendix".
2. **The words are the object.** The thesis is the render's subject. It is never a caption beside a
   picture. HTML text is laid out around the render's geometry (top band, waterline, instrument
   column), never as a centred eyebrow, headline, sub-head and buttons stack.
3. **The Bootloader is on screen from the first frame to the last**, framed as the fix the story
   builds to, never covering the story (section 6).
4. **One idea per screen, few words, set large.** At most one big Michael line and one support line
   per screen.
5. **Every water height means something:** pathways in the tide, the ⦵ line in the cycle, and the
   opt-in at the end. Nothing moves "for looks".
6. **Not AI-made, not flat:** photographic renders, our type, no template tells (section 11).
7. **Every sentence is Michael's, word for word, with its reference.** Labels and buttons are the only
   fresh text (copy deck, section 14).

---

## 2. The scene vocabulary (what each physical thing means)

Staging (c), the lock wall, as built in `lookdev/stage_c_lock.py`, with these story additions. Blender
axes follow `01-MEANING.md` section 2: Blender Z is Michael's Up, X is Side, Y (into the picture) is Down.

| Thing in the render | What it means | Michael's words it carries |
|---|---|---|
| The sentence in Plimsoll Heavy capitals, painted steel, on a precast **panel** standing on the **landing** | the business; its message | "Every hire compounds complexity before it compounds capacity." [M 696 · copy.ts:60] |
| **Water** in the lock | coordination complexity: its height is the pathways count | "Each addition doesn't add one unit of complexity — it adds n-1 new interaction pathways." [BL 2339] |
| **Lock floor** (dry at one person) | zero pathways, the datum | "Founder only. No coordination overhead." [BL 1247] |
| **Painted Plimsoll mark ⦵ with "12"**, on the wall beside the landing (not on it), bar at the 12-person level | the load line; the line you don't cross. It is also the Bootloader's mark on the page | "12 isn't where you're trying to get. It's the line you don't cross." [BL 544] |
| **New precast courses** laid under the landing, so the panel and words rise course by course (05, section 7) | Side: systems absorb the growth; capacity | "Systems were what actually held the weight." [M 2408 · copy.ts:103] |
| **Draining** (the lower sluice opens; the level falls) | Down: pruning; complexity leaves; margin is locked | "Something needs to be cut." [M 2564 · copy.ts:111] |
| **Air** between the water and the landing's top | margin | "Each cycle deposits systems and margin. The next cycle withdraws from a larger account." [BL 866] |
| **Flood scar**: the silt and wet ring at the highest level reached (`--hw` tracks the running maximum) | the wall remembers how bad it got. At the end the words stand above it | "Nothing moves forward until the cycle completes. But when it does, the next cycle starts higher." [BL 870] |
| **Enamel staff gauge** (E-pattern, bolted to the wall, never moves) | the instrument; an honest scale | "How many people are on your team?" [BL 310] (in HTML beside it) |
| **Lock signal** (should): a real lock traffic signal, red over green, in a black housing on a white backboard, above the ladder | off up to 12; red from 13 to the turn; green once the water drains below the ⦵ line | "Complexity > Capacity = Redline." [M 2997 · copy.ts:80] / "Capacity > Complexity = Oxygen." [M 2999 · copy.ts:119] |
| **Light**: low late-afternoon sun from the left. A cloud takes it at Redline; it returns at the turn and ends warm and low | relief, breath | "The business can breathe. Systems carry what the business creates." [BL 718] |
| **Chop**: light at 8; agitated toward Redline; calm at the turn; glass at Oxygen (the words reflected whole) | the felt state | "But inside, nothing ever settled." [M 1995 · copy.ts:73] (context only; not on screen) |
| **c-window camera** (05, section 4): the gallery behind glass in the lock, for the drowned beats | going under with the words | "The business is drowning. Every addition makes it worse." [BL 717] |

Misreadings the scene must not make (from `01-MEANING.md` section 7): the words never fall, tip or sink.
Only the water moves down ("Down is not a fall"). Every cycle ends higher (no wave returning to the same
level for the words). Twelve is a cap: in the cycle, Up stops at the ⦵ line and never passes it. Three
courses are three cycles, not twelve systems. The tide stops at 39 (Graveyard); 40+ is Team of Teams
and is not drawn.

---

## 3. The level map (one rule for both layouts)

Let **H** be the height of the sentence block (cap line of the top line to the baseline of the bottom
line) in that layout, and **D0** the landing's top at the start. All levels below are in H above or
below D0.

**Pathways p = n(n−1)/2.** For n ≤ 19:

```
level(n) = D0 + H × (p − 76) / 95
```

- The **lock floor is the zero-pathway datum**: D0 − 0.80H (the landing stands 0.80H high).
- Water rises **one H per 95 pathways**, the same depth for every pathway. One pathway is about 10 mm
  of water in the desktop scene.
- Beyond n = 19 the lock cannot hold 741 pathways at that scale, so the climb is compressed:
  `level = D0 + H × (1.00 + 0.35 × (p − 171) / 570)`, reaching **1.35H at n = 39**. From n = 19 the readout
  carries the number and the light carries the weight. Say so in the README; it is a cap, not a lie.

| n | p | level (H) | What the visitor sees (desktop, 3 lines; phone, 6 lines) |
|---:|---:|---:|---|
| 1 | 0 | −0.80 | lock floor wet, puddles; landing dry (intro start) |
| 8 | 28 | −0.505 | water half way up the landing face; the first screen |
| 12 | 66 | −0.105 | **exactly at the ⦵ bar**; words dry; the line you don't cross |
| 13 | 78 | +0.021 | **touches the letters' feet** (Plimsoll capitals sit on one baseline, so every letter is touched at once) |
| 14 | 91 | +0.158 | bottom line about half under (desktop) |
| 15 | 105 | +0.305 | bottom line under (desktop); two lines under (phone) |
| 18.5 | 162 | +0.90 | passes the c-window camera's eye: we go under |
| 19 | 171 | +1.00 | whole sentence under |
| 39 | 741 | +1.35 | Redline: deepest point; the flood scar is set here |

**Why equal scroll per hire.** The scroll budget gives every hire the same scroll distance. Each hire adds
n−1 pathways, so the water visibly speeds up as you scroll, with the same hand motion. That is
"compounds", felt rather than read. Never ease this away.

**The cycle levels** (both layouts):

| State | Water (H) | Landing top (H) | Margin (H) |
|---|---:|---:|---:|
| Redline (start) | +1.35 | 0 | −1.35 (under) |
| Side 1 end | +1.35 | +0.55 | top line out of the water |
| Down 1 end | −0.45 | +0.55 | 1.00 |
| Up 2 end (stops at ⦵) | −0.105 | +0.55 | 0.655 |
| Side 2 end | −0.105 | +1.00 | 1.105 |
| Down 2 end | −0.45 | +1.00 | 1.45 |
| Up 3 end (stops at ⦵) | −0.105 | +1.00 | 1.105 |
| Side 3 end (landing now above the flood scar at 1.35) | −0.105 | +1.45 | 1.555 |
| Down 3 end | −0.45 | +1.45 | 1.90 |
| Oxygen (final) | −0.505 (the first screen's level, on purpose) | +1.45 | 1.955 |

The final water is at the same height as the first screen's. The difference is the ground under the
words. Courses: 0.55H, 0.45H, 0.45H. The wall, floor to coping, must be at least 3.4H tall (the
words' top ends 3.25H above the floor). Desktop has H ≈ 0.98 m in a 5.6 m wall. Phone needs cap ≈ 0.20 m
or a taller wall.

---

## 4. The first screen

### 4.1 Desktop 1440×900 (the render: open camera HERO, frame d03, n = 8)

The render fills the viewport (canvas, cover). Positions are CSS px at 1440×900 and percentages of the
frame, so they hold at any size. The scene builder places the camera so the render lands here (±2%),
and the anchors file (section 7.6) proves it.

**What the render shows**

| Element | Where | Notes |
|---|---|---|
| Top band | y 0–72 (0–8%) | plain lock wall under the coping, rain-stained darker (relative luminance at or below 0.15 at the 95th percentile) so cream HTML reads on it. No object of the story enters this band in any frame. |
| **The sentence** | x 240–1200 (16.7–83.3%), y 168–372 (18.7–41.3%); cap ≈ 56 px; three lines EVERY HIRE COMPOUNDS / COMPLEXITY BEFORE IT / COMPOUNDS CAPACITY. (measured: block 17.1 × 3.64 cap heights) | **The largest, highest-contrast thing in the frame.** Squint at 1440: the words win. Raking sun lights them; the rest of the wall falls off. Short stand-off and a soft sun disc, so there are no "shadow twin" letters (05, pitfall 7). |
| Landing top (D0) | y 372 (41.3%) | the words stand on it |
| ⦵ mark + "12" | bar at y 393 (43.7%), x ≈ 1230–1290, on the wall between the words and the gauge | white road paint, worn; disc ≈ 0.2H; the bar extends past the disc as on a ship's hull |
| Staff gauge | x ≈ 1320 (92%) | as built |
| Ladder; lock signal (off) | x 80–150 (6–10%); signal above it at y 110–200 | below the top band |
| Water surface at the wall | y 475 (52.8%) | water from here to the bottom: dark green-black, the words reflected, light chop |

**What HTML sits on it**

| Element | Box | Type and colour |
|---|---|---|
| Title lockup | x 40, y 20–62 | `Scaling Up‑Side‑Down` (U+2011 hyphens) Plimsoll 18 px, cream `#EEF0EC`; under it `A book by Michael Wentz` B612 14 px, `#B9C2BD` |
| Book link | right-aligned, ending 24 px left of the dock, y 30 | `The book`, B612 15 px, cream, 1 px underline; goes to `#book` |
| **Bootloader dock** (persistent CTA, section 6.1) | x 1100–1400, y 14–66 | ⦵ Plimsoll 30 px · `SUSD Bootloader` Plimsoll 15 px over `Free file · V16 · 35,445 words` B612 12.5 px · button `Get it free` B612 Bold 15 px, 44 px tall, cream fill, ink `#151718` text, square corners |
| Audience | x 64–560, y 560–630 (on the water) | `For bootstrapped, self-funded founders` / `with teams of 1–12`, Ortica Linear Bold 26 px/1.25, cream, left-aligned to the column. A label built from Michael's fit table (BL 4773, BL 4775). |
| Scroll cue | x 64, y 822–846 | `Scroll to hire. Each step is one more person.` B612 14 px, `#B9C2BD`, beside a 1 px × 28 px cream rule that grows downward once every 2.4 s (no chevron) |
| **Instrument column** | x 1080–1400, y 540–870 (on the water) | the question `How many people are on your team?` [BL 310] in Ortica Linear Bold 18 px; the readout `8` / `people` and `28` / `coordination pathways` (Plimsoll 56 px figures, cap ≈ 39 px, so they never outsize the rendered words; B612 13 px units); the band list (B612 14 px, 22 px rows, top to bottom: Team of Teams 40+, Graveyard 15–39, Threshold 13–14, **Team 8–12**, Valley 4–7, Small Team 2–3, Solopreneur 1) with the current band in bold and a 10 × 2 px cream bar; under the current band, its line, "Leader + team. Still know everyone's name." [BL 1250], in Ortica Linear 16 px |
| H1 | visually hidden (`.sr-only`) | "Every hire compounds complexity before it compounds capacity." [M 696 · copy.ts:60] |

The centre of the water (x 560–1080) stays empty: it holds the words' reflection. So the screen
reads as four quiet corners around one lit sentence. That is a composition, not a stack.

**The intro (the "cool opening" James asked for).** The first paint is frame d00 (n = 1: dry lock, wet
floor, the words fully legible on the wall) as a high-priority `<img>`, which is the LCP. When frames d00–d03
are decoded (low tier is enough), the lock fills from the floor to n = 8 over 1200 ms, ease-out. Meanwhile the
readout counts 1 → 8 people and 0 → 28 pathways in whole steps, and the chrome fades in (0–600 ms). If
those frames are not ready within 1500 ms, or the page loads scrolled, or reduced motion is on, show
d03 at once. The 600 ms frame already shows the sentence; the 3 s frame passes the five-second test.

### 4.2 Phone 390×844 (portrait camera HERO, frame p02, n = 8)

Its own render (section 8): six lines EVERY HIRE / COMPOUNDS / COMPLEXITY / BEFORE IT / COMPOUNDS /
CAPACITY. (measured: block 8.8 × 7.6 cap heights).

| Element | Where | Notes |
|---|---|---|
| Top band (render) | y 0–56 | shaded wall; no story object |
| **The sentence** | x 45–345 (11.5–88.5%), y 84–343 (10–40.6%); cap ≈ 34 px | the largest, highest-contrast thing |
| Landing top | y 343 | |
| ⦵ mark + "12" | bar at y 370 (43.8%), right of the sentence at x ≈ 92% (disc ≈ 0.12H so it fits) | |
| Water at the wall | y 474 (56.2%) | |
| Bottom 10% (y 760–844) | water only in every frame | the sticky bar sits here |
| Title lockup (HTML) | x 16, y 12–48 | Plimsoll 15 px; byline B612 12 px |
| `The book` | right, y 14–44 | B612 14 px, 44 px tap height |
| Audience | x 20–370, y 490–540 | Ortica Linear Bold 19 px/1.3, two lines |
| Readout | x 20–370, y 556–630 | `How many people are on your team?` Ortica Linear Bold 15 px; `8 people · 28 coordination pathways` (Plimsoll 34 px figures, B612 12 px units); `Team 8–12` B612 13 px bold. No band list on phone. |
| Scroll cue | x 20, y 712–732 | B612 13 px |
| **Bootloader bar** (sticky, section 6.2) | y 772–844 + safe area | ⦵ Plimsoll 24 px · `SUSD Bootloader` Plimsoll 14 px over `Free file · V16 · 35,445 words` B612 11.5 px · `Get it free` B612 Bold 15 px, 44 px tall, cream fill |

Once scrolling starts, the phone readout docks into one line under the title (y 50–74):
`13 people · 78 pathways · Threshold 13–14` (B612 13 px). The water band (y 500–760) then holds
only captions.

---

## 5. The scroll story: nine beats

**Stage.** One sticky, full-viewport stage (`100svh`) inside a section 1280vh of scroll long (plus the
stage's own 100vh). Then a short footer in normal flow. Positions `s` are in vh from the top of the
story; the same numbers apply to desktop and phone. Frames are listed as desktop `d…`/`w…` (open /
window camera) and phone `p…`/`pw…` (section 7.3). "Motion" is the part of the beat where frames
change; "hold" keeps the last frame while the captions change.

**Caption slot.** Desktop: centred, max-width 700 px, y 640–820 (71–91%), always over dark water. Phone:
x 20–370, y 520–750, above the bar. One caption at a time; it fades in over 10vh with a 12 px rise and
out over 10vh. Big lines are Ortica Angular Bold; support lines are Ortica Linear; equations and
`Up. Side. Down. Repeat.` are Plimsoll. All text is cream unless stated.

### The beat table

| # | Scroll (vh) | Water: n (pathways) | What physically happens in the render | Frames D / P | Words on screen (verbatim, ref) · where · size (desktop / phone) |
|---|---|---|---|---|---|
| **1 Arrival** | 0–20 (hold) | 8 (28) | Intro (time-based, 4.1): the dry lock fills to n = 8. Then still. | d00–d03 / p00–p02 | The rendered thesis; the first-screen HTML (4.1, 4.2). Audience and scroll cue fade out over 0–20vh; the title, dock and instrument stay. |
| **2 Hiring to twelve** | 20–180 (motion 20–130, hold 130–180) | 8 → 12 (28 → 66) | Each hire raises the water by its n−1 pathways: +8, +9, +10, +11, so every step is bigger. It climbs the landing face and stops exactly at the ⦵ bar, with a small lap against the paint. | d03→d15 (12) / p02→p10 (8) | 30–120: "Each addition doesn't add one unit of complexity — it adds n-1 new interaction pathways." [BL 2339] · caption slot · Ortica Angular Bold 38 px / 25 px. The readout ticks; a `+8` … `+11` delta flashes beside the pathways figure for each hire (B612 13 px). At 135–180: "12 isn't where you're trying to get. It's the line you don't cross." [BL 544] · caption slot · 40 px / 26 px. The `66` figure gets a 2 px cream underline (no pulse). |
| **3 Thirteen** | 180–280 (motion 180–240, hold 240–280) | 12 → 14.5 (66 → 98) | The water crosses the ⦵ bar and **touches every letter's foot at once** at 13 (d18): ripples break along the bottom line; the lock signal turns **red**. By 14 the bottom line is half under; chop rises. | d15→d22 (7) / p10→p15 (5) | 190–280: "Past twelve, something breaks." [M 3509 · copy.ts:88] · caption slot · Ortica Angular Bold 56 px, one line / 32 px, two lines. The readout figures turn red `#F0A093`; `Threshold 13–14` lights with "At 13-14 employees, next hire is a phase change, not incremental growth." [BL 3450] (column, Ortica Linear 16 px; phone: the docked line only). |
| **4 Going under** | 280–400 (motion 280–380, hold 380–400) | 14.5 → 19 (98 → 171) | **Cut to the c-window camera** (05, section 4), a **match cut**: the sentence keeps the same screen rectangle (±3%). Through the gallery glass the waterline climbs past the middle and top lines. At n ≈ 18.5 (w12) it passes the camera's eye: **we go under with the words**, and the surface above turns into the silver mirror of total internal reflection. The words stay readable, green and refracted. | w00→w14 (15) / pw00→pw09 (10) | 290–400: "Complexity that accumulated faster than the structure could hold." [M 2021 · copy.ts:96] · caption slot · Ortica Angular Bold 44 px, two lines / 28 px. `Graveyard 15–39` lights with "The Graveyard is not a temporary problem. It's a structural trap." [BL 3451] (column 16 px). |
| **5 Redline** | 400–520 (motion 400–450, hold 450–520) | 19 → 39 (171 → 741); level 1.00 → 1.35H | Still under. A cloud takes the sun (about −2.5 stops). The red signal's light comes down through the surface: the only warm light in a cold green world. The flood scar is set at 1.35H. The readout races to **39 · 741**. | w15→w18 (4) / pw10→pw12 (3) | 420–520: "Complexity > Capacity = Redline." [M 2997 · copy.ts:80] · caption slot, first line · **Plimsoll 64 px**, red `#F0A093` / 34 px, two lines; under it "The business is drowning. Every addition makes it worse." [BL 717] · Ortica Linear 24 px / 18 px. |
| **6 The turn, and Side** | 520–680 (turn 520–580, Side 580–650, hold 650–680) | the flood was all Up. Level 1.35H; landing 0 → 0.55H | **Cut back to the open camera.** From above, the water is a mirror and the words are gone, with the scar forming on the wall. The cloud passes and the sun returns; the red signal goes off. A new precast course is laid under the landing; the panel and the words rise (05, section 7), and **the top line breaks the surface, streaming water**. During Side the camera follows only half the rise, so the words visibly climb in the frame (at least 0.25H). | d23→d32 (10) / p16→p22 (7) | 525–600: "You were never the problem. The model you inherited was." [M 216 · copy.ts:196] · caption slot · Ortica Angular Bold 48 px, two balanced lines / 28 px. The readout fades out (520–540). The instrument column becomes the **cycle legend** (from 580): "Real scaling is cyclical." [BL 795] (Ortica Linear Bold 18 px), then `Up` · `Side` · `Down` with "Up for growth." "Side for stability." "Down for pruning." [BL 795]. **Side** is lit, with its cell "Systems absorb the growth, structure stabilizes" [BL 862] (B612 13 px). 605–680: "Systems were what actually held the weight." [M 2408 · copy.ts:103] · caption slot · 44 px / 28 px. The label `capacity` is pinned to the landing's top edge (anchor). |
| **7 Down: the first full cycle** | 680–900 (Down 680–760, hold 760–900) | level 1.35 → −0.45H; landing 0.55H | The lower sluice opens and the chamber drains. The words come fully out, wet. The scar stays on the wall above the old landing. When the falling water passes the ⦵ bar the signal turns **green** (d41). The camera eases up to re-centre the words. | d33→d42 (10) / p23→p29 (7) | 685–760: "Something needs to be cut." [M 2564 · copy.ts:111] · Ortica Angular Bold 48 px / 28 px; "The business stops asking for more and starts asking what to keep." [M 2564 · copy.ts:112] · Ortica Linear 22 px / 17 px. Legend: **Down** lit, "Complexity pruned, margin recaptured, efficiency locked" [BL 863]. From 740: `margin`, a 1 px vertical dimension line with end ticks between the waterline and the landing top, left of the words, with its label. `complexity` rides the waterline. 765–830: "Up. Side. Down. Repeat." [M 1713 · copy.ts:125] · **Plimsoll 64 px** / 36 px, in the caption slot. 835–900: **Offer 1** (section 6.3). |
| **8 Repeat** | 900–1100 (six phases × 32vh = 900–1092; hold to 1100) | Up to ⦵, Side +0.45H, Down to −0.45H, twice | Up: the water rises **to the ⦵ bar and stops** ("It's the line you don't cross." [BL 544]). Side: another course, and the words climb. Down: drain. Twice more. The camera cranes and pulls back a little so the water stays at 50–64% of the frame height. The margin widens every cycle (1.45H, then 1.90H). In Side 3 the landing passes the flood scar. | d43→d66 (24: 4 per phase) / p30→p47 (18: 3 per phase) | 905–1000: "Each cycle deposits systems and margin. The next cycle withdraws from a larger account." [BL 866] · Ortica Angular Bold 40 px / 26 px. 1000–1100: "Nothing moves forward until the cycle completes. But when it does, the next cycle starts higher." [BL 870] · same sizes. The legend lights each phase with its cell [BL 861, 862, 863]; label `Cycle 2 of 3` / `Cycle 3 of 3` (B612 13 px). The dock meta reads "The file is the operating system." [M 4497 · copy.ts:61] through beats 6–8 (section 6.1). |
| **9 Oxygen → the finale** | 1100–1280 (motion 1100–1160, hold 1160–1280) | water −0.505H (the first screen's level); landing +1.45H | The camera pulls back to the WIDE. The chop dies to glass, so the words are mirrored whole. Low warm sun, green signal, three courses visible under the panel, the scar below the words. This is the final frame (the finale's background). | d67→d72 (6) / p48→p51 (4) | 1110–1190: "Capacity > Complexity = Oxygen." [M 2999 · copy.ts:119] · Plimsoll 64 px, `#A9D8B0` / 34 px; "The business can breathe. Systems carry what the business creates." [BL 718] · Ortica Linear 24 px / 18 px. The legend and labels fade (1150–1170). 1190–1220: the finale fades in over the calm water and holds (section 6.4). |

**On submit (not scroll):** the drain clip (K17), section 6.5.

### Notes the builders need

- **Captions are keyed to `s`; frames are keyed to `s`.** Both come from one file (section 9.3), so they
  cannot drift apart.
- **The readout snaps to whole people** (`Math.round(n)`) and the pathways figure follows. The water uses
  the continuous n. Ticks happen when the water passes the integer frame (3 per hire on desktop), not on
  a timer.
- **Beat 4's cut** happens at s = 280 exactly, with no crossfade (a hard cut reads as film; a dissolve
  between two cameras reads as a glitch). Beat 6's cut back is also hard, at s = 520.
- **Anchored labels** (`complexity`, `capacity`, `margin`, the ⦵-line tick) follow the per-frame anchors
  (section 7.6) interpolated with the crossfade. B612 13 px, cream at 85%, sentence case, 1 px rules,
  never boxed.
- **Holds are long on purpose.** They are where the caption is read. In a hold the render is still and
  only the text changes.

---

## 6. The conversion design ("It's all about getting clicks on the boot loader")

What the visitor is offered, everywhere: **the SUSD Bootloader, a free file (V16, 35,445 words, Markdown)
that works with any AI assistant, Claude, ChatGPT or Gemini (BL 221)**. It is the book's appendix as a
spec, not a prompt. One form, at the end, is the only place an email is typed. Four entry points lead
to it.

### 6.1 Desktop: the Bootloader dock (persistent)

- **Where:** top right, x 1100–1400, y 14–66, in the reserved top band (no story object ever enters it,
  section 4.1). It is visible from the first paint to the finale.
- **What it shows:** ⦵ · `SUSD Bootloader` · `Free file · V16 · 35,445 words` · [`Get it free`].
  During beats 6–8 the meta line becomes Michael's "The file is the operating system." [M 4497 ·
  copy.ts:61], swapped with a 150 ms crossfade, so the persistent CTA speaks to the cycle on screen. It
  reverts at beat 9.
- **What it does:** it is a real link to `#get`. With JS, an instant jump (not a smooth scroll through the
  story, which would flash every frame): a 200 ms fade to the final frame, then the focus moves to the
  email field. Without JS, a plain anchor jump.
- **When it hides:** when the finale's form is at least 30% in view (IntersectionObserver), so there are never
  two competing CTAs. It returns when the visitor scrolls back.
- **Below 1200 px wide:** the meta line drops and the dock is ⦵ + [`Get the free Bootloader`].

### 6.2 Phone: the Bootloader bar (sticky)

- **Where:** fixed to the bottom, 72 px plus `env(safe-area-inset-bottom)`, ink `#151718` at 92% with a
  1 px top rule in `#2A2E2F` (a solid strip, not glass, no blur).
- **Never covers the story:** the render's bottom 10% is water in every frame (a scene constraint), and the
  caption slot ends 16 px above the bar. The previous Waterline dropped its bottom bar because it
  covered captions; here the space is reserved in both the render and the layout.
- **Contents:** ⦵ · `SUSD Bootloader` / `Free file · V16 · 35,445 words` · [`Get it free`] (44 px, the
  thumb zone). During beats 6–8 the meta line reads "The file is the operating system." [M 4497 · copy.ts:61] as on desktop.
- **Hides** in the finale (the form is on screen) and while any input has focus (the keyboard is up).

### 6.3 Mid-story: the offer after the first full cycle (beat 7, s 835–900)

The visitor has just watched the fix work once: the words are high and dry, the margin labelled, and
"Up. Side. Down. Repeat." [M 1713 · copy.ts:125] still in mind. That is the moment to name the file. In the caption slot:

- "The pages are reference. The file is the operating system." [M 4497 · copy.ts:61], Ortica Angular
  Bold 40 px / 26 px, two lines.
- Under it, one row: ⦵ `SUSD Bootloader` (Plimsoll 18 px) · `Free · V16 · 35,445 words · Works with Claude,
  ChatGPT, Gemini` (B612 13 px) · [`Get the free Bootloader`] (B612 Bold 15 px, 44 px, cream fill). Phone:
  the row wraps; the button runs full width.
- Scrolling on simply continues the story; the offer fades like any caption. Nothing blocks, nothing pops.

The second mid-story moment is the dock and bar line above (beats 6–8): Michael's own sentence for what
the file is, shown while the visitor watches the operating system run.

### 6.4 The finale (beat 9 hold, s 1190–1280, `id="get"`)

The background is the final frame: the words high on three courses, glassy water, green signal. The finale
sits over the near water (desktop y 470–870; the luminance check in 7.7 covers this zone).

**Desktop layout** (no cards, no panel; the render is the ground):

| Row | Content | Type |
|---|---|---|
| Lead, centred, y 470–560 | "In an open system, AI accelerates chaos." [M 4523 · copy.ts:136] then "In a closed system, AI accelerates clarity." [M 4523 · copy.ts:140] | Ortica Linear 22 px `#B9C2BD`; then Ortica Angular Bold 44 px cream |
| Left column, x 160–520 (the book, second path, `id="book"`) | "The book changed how you think." [M 4553 · copy.ts:146] · `Scaling Up‑Side‑Down` · `Michael Wentz` · [`Pre-orders open soon`] (disabled) · the author line "Wentz spent nearly a decade in institutional finance before building and operating a bootstrapped business that scaled beyond 40 people." [BL 51] | Ortica Linear Bold 20 px; Plimsoll 22 px; B612 14 px; button B612 Bold 15 px, 1.5 px cream outline, 55% strength, `aria-disabled` set to true; author line Ortica Linear 14 px `#B9C2BD` |
| Right column, x 620–1280 (the Bootloader, primary) | "This SUSD Bootloader changes how you operate." [M 4555 · copy.ts:146] · ⦵ `SUSD Bootloader` · `The book's appendix as one file, for your AI` · `Free · V16 · 35,445 words · Markdown` · `Works with Claude, ChatGPT, Gemini` · **[email field][Get the free Bootloader]** · the mode note · "Upload the file and use the starting prompt provided with it." [M 4531 · copy.ts:150] "Then let the system locate you." [M 4533 · copy.ts:151] | Ortica Linear Bold 20 px; ⦵ Plimsoll 40 px + name Plimsoll 30 px; B612 15 px; B612 14 px `#B9C2BD`; field 380 × 56 px (cream `#EEF0EC` fill, ink text B612 17 px, 2 px ink inner border on focus) and button 56 px (cream fill, ink B612 Bold 17 px, square); note B612 13 px; next-step lines Ortica Linear 15 px `#B9C2BD` |
| Under both | `Read the Appendix` (a plain link to the live /appendix, crawlable) | B612 14 px, underlined |

The two column heads are the two sentences of M 4553/4555 in their original order, left to right, book
then file. The file column is wider and holds the only filled controls.

**Phone:** stacked, all at x 20–370. The lead, 18 px then 28 px. Then the book, compact: its head line, title,
`Pre-orders open soon`, all in about 110 px, so the sentence order stays book then file. Then the
Bootloader block with a full-width field (56 px) and a full-width button (56 px), the note and the
next steps. The author line moves to the footer on phone. The bar is hidden here.

**The form** (both): `<form id="get-form" novalidate>` with a visible label, `Email address`, set in
B612 13 px above the field (James hates "a random box"; the label and the file block make it the
file's form, not a box). It has `type="email" inputmode="email" autocomplete="email"
enterkeyhint="send"`, placeholder `you@company.com`, `aria-describedby` the note, and a
`role="status"` message line. An invalid email shows `Enter your email address.`; focus returns to the
field with a 2 px × 2 shake over 150 ms (none under reduced motion).

**Opt-in mode** (`src/links.ts`, one constant):

```ts
export const OPTIN = {
  mode: "handoff" as "handoff" | "post",                                   // MVP: handoff (decided)
  handoff: "https://scaling-up-side-down.vercel.app/appendix#get",         // the live opt-in (id="get" exists)
  post: "https://scaling-up-side-down.vercel.app/api/optin",               // the live form's own action
};
export const LINKS = {
  appendix: "https://scaling-up-side-down.vercel.app/appendix",
  preorder: "", // empty until Michael sends it; then the book button becomes a link, "Pre-order the book"
};
```

- **handoff (MVP, as decided):** validate, play the drain (6.5), show `Taking you to the Bootloader page…`,
  then `location.assign(OPTIN.handoff)`. The note under the button says `Opens the Bootloader page,
  where the file is sent by email.` The email is not sent, stored or logged. (The live page also offers
  a direct download there, so nobody is trapped.)
- **post (recommended; needs James's OK, section 15):** the live `/appendix` form is a plain
  `method="post" action="/api/optin"` with fields `email`, a honeypot `company` and a hidden
  `source`. Its markup says a plain post is answered with a 303 to its confirmation anchors
  (`#optin-sent`, `#optin-file`, `#optin-already`). Post the homepage form there as a normal form
  submission (not `fetch`). Add the hidden `source=home-<entry>` field (below) and the same honeypot,
  and play the drain before `form.submit()`. This removes the double typing, the biggest conversion
  leak in the MVP. It also works with no JS at all. Verify first that the endpoint accepts a post from
  the new site's origin (or deploy the page on the same origin). Note: `The file is sent to this
  address.`

**Which entry point converted, without tracking scripts:** every Bootloader control carries
`data-cta="dock|bar|offer|finale"`. In post mode the hidden `source` gets `home-dock`, `home-bar`,
`home-offer` or `home-finale` (the last one clicked before the form), so Michael's list records it. No
analytics, cookies or third-party requests on the page.

### 6.5 The drain (the reward for the click)

On a valid submit, in at most 1.6 s:
1. Disable the form; the button reads `Get the free Bootloader` at 70%, with the cursor `progress`.
2. Play the drain clip (K16 → K17, 12 frames, time-based, ease-in, 1000 ms). The lower sluice opens and
   the lock empties to its floor. The words stand high on their three courses over an empty, wet,
   sunlit chamber: complexity gone.
3. A ⦵ `Yours` mark (Plimsoll 40 px) lands beside the file name, with a 180 ms scale from 1.2 to 1.
4. `Taking you to the Bootloader page…`, then navigate (handoff) or submit (post) after 300 ms. A
   wall-clock guard navigates even if the tab is hidden.
Reduced motion: cut to the drained still, show the mark, navigate after 300 ms. `?nonav=1` stops before
navigating, for screenshots.

### 6.6 Why each choice should raise Bootloader clicks

| Choice | Why it should increase clicks |
|---|---|
| Dock and bar visible from the first paint, in the reserved band | The visitors who decide fast (most of them) always have the action in view. It never covers the story, so the visitors who scroll keep scrolling, and more of them reach the finale, where intent is highest. |
| `Free file · V16 · 35,445 words` on every entry point | Price (free), form (a file) and substance (a specific version and length) answer *what do I get?* before the click. Specific numbers read as real; they also set the file apart from *a prompt* (Michael's ask). |
| `Works with Claude, ChatGPT, Gemini` | The audience already uses these. Naming them turns *a spec* into *something I can use tonight*. |
| The ⦵ mark is the Bootloader's mark and the painted load line in the render | The visitor watches the water obey the ⦵ line through the whole story. By the end the mark means *the thing that keeps you above the line*, and the CTA wears it. |
| The story is the argument, and the ask comes after the proof | Pain (drowning), relief ("You were never the problem. The model you inherited was." [M 216 · copy.ts:196]), mechanism (Side, Down), outcome (Oxygen). Offer 1 comes only after the fix has visibly worked once: show, then ask. |
| The dock line becomes "The file is the operating system." [M 4497 · copy.ts:61] during the cycle | The persistent CTA changes from *a free file* to *the thing that runs what you're watching*, at the moment the visitor is watching it run. |
| The finale opens with Michael's open/closed-system lines | It names the visitor's own AI chaos and the promise in his words, in the frame of a calm, closed lock. |
| One field, one button, a visible label, a note saying exactly what happens next | Less to do and nothing unknown. The next-step lines (upload, then the system locates you) make the after-click concrete. |
| The author line next to the paths | Authority at the moment of decision ("a bootstrapped business that scaled beyond 40 people" [BL 51]), in Michael's words. |
| The book is the second path, quieter | While pre-orders are closed it cannot convert, so it must not split attention. It is still clearly offered (two paths, always). |
| The drain | James's one dramatic button ("It's like really dramatic" [TASTE]): the click visibly does something physical. Memorable, so shared. |
| Post mode with `source` | Removes the second email entry (the biggest leak) and tells Michael which entry point works. |

### 6.7 What we will not do (no dark patterns)

No pop-ups, modals or exit-intent prompts. No countdowns, fake scarcity or fake counts. No pre-checked
boxes. No confirmshaming (*No thanks, I like drowning*). No "free" that turns out to cost something. No
disguised ads. No CTA that covers the content. No email collected that is not used as stated (handoff
mode says it opens the Bootloader page; post mode says the file is sent to this address). No claims
about the list (updates, frequency) until Michael confirms them. Reduced-motion users get the same
paths with no animation gate.

---

## 7. The render plan

### 7.1 Cameras

| Camera | Used in | Rule |
|---|---|---|
| **HERO** (open; desktop 50 mm, f/8, from the far coping as in 05; phone portrait ≈ 35 mm equivalent) | beats 1–3, d00–d22 / p00–p15 | fixed, no move (the tide happens on one screen) |
| **WINDOW** (c-window: gallery behind glass, eye at D0 + 0.89H, so the eye goes under at n ≈ 18.5) | beats 4–5, w00–w18 / pw00–pw12 | fixed; at w00 the sentence matches its HERO screen rectangle (±3%) |
| **CRANE** (open) | beats 6–8, d23–d66 / p16–p47 | in Side the camera rises about half as much as the landing, so the words visibly climb; it catches up during the next Down or Up. The words never enter the top band (desktop y ≥ 10%, phone ≥ 8%). From K9 on, the waterline stays at 50–64% of the frame height (phone 55–66%). |
| **WIDE** (open) | beat 9 and the drain, d67–d72, drain / p48–p51 | the full stack (words, three courses, scar, ⦵) in the top 55%; calm near water below for the finale; the words keep a cap of at least 36 px at 1440 (24 px on phone) |

### 7.2 Render states (keyframes)

Levels are in H above D0 (section 3). Sun is relative to the 05 default (4.5). Chop is the Ocean wind in
m/s (05 default 2.2). The scene builder writes these into `scene/keyframes.json` and drives everything
from it.

| K | Story point | n | Water | Landing | Sun | Signal | Chop | Camera | Notes |
|---|---|---:|---:|---:|---:|---|---:|---|---|
| K0 | intro start | 1 | −0.80 | 0 | 1.0 | off | 1.6 | HERO | lock floor wet, puddles |
| K1 | first screen | 8 | −0.505 | 0 | 1.0 | off | 2.2 | HERO | the poster frame for no-JS and reduced motion |
| K2 | twelve | 12 | −0.105 | 0 | 1.0 | off | 2.4 | HERO | water at the ⦵ bar |
| K3 | thirteen, touch | 13 | +0.021 | 0 | 0.9 | **red** | 2.8 | HERO | ripples along the bottom line |
| K4 | cut frame | 14.5 | +0.23 | 0 | 0.75 | red | 3.2 | HERO and WINDOW (both rendered) | match cut |
| K5 | all under | 19 | +1.00 | 0 | 0.5 | red | 3.6 | WINDOW | eye under from 18.5 |
| K6 | Redline | 39 | +1.35 | 0 | 0.18 | red (strongest light) | 4.0 | WINDOW | scar set at 1.35 |
| K7 | turn | – | +1.35 | 0 | 0.18 → 1.0 | red → off | 4.0 → 2.0 | CRANE | the open view; mirror surface |
| K8 | Side 1 end | – | +1.35 | +0.55 | 1.0 | off | 2.0 | CRANE | top line out, streaming |
| K9 | Down 1 end | – | −0.45 | +0.55 | 1.0 | **green** (when the water passes ⦵) | 1.8 | CRANE | margin 1.00 |
| K10 | Up 2 end | – | −0.105 | +0.55 | 1.0 | green | 1.8 | CRANE | stops at ⦵ |
| K11 | Side 2 end | – | −0.105 | +1.00 | 1.0 | green | 1.6 | CRANE | |
| K12 | Down 2 end | – | −0.45 | +1.00 | 1.0 | green | 1.6 | CRANE | |
| K13 | Up 3 end | – | −0.105 | +1.00 | 1.0 | green | 1.4 | CRANE | |
| K14 | Side 3 end | – | −0.105 | +1.45 | 1.0 | green | 1.4 | CRANE | landing above the scar |
| K15 | Down 3 end | – | −0.45 | +1.45 | 1.0 | green | 1.2 | CRANE | margin 1.90 |
| K16 | Oxygen | – | −0.505 | +1.45 | 1.1, 4500 K | green | 0.6 (glass) | WIDE | the finale background |
| K17 | drain end | – | −0.80 (floor) | +1.45 | 1.1 | green | 0 | WIDE | played on submit only |

Other states:
- The flood scar (`--hw`) tracks the running maximum of the level.
- The wet band follows the level, so new courses come out of the water wet and dry over the next frames.
- Wall glitter (`--wc 0.3`) is on only while the sun is on the wall and the water is below the words' top.
- Ocean time advances +0.04 s per frame (05, section 7), so scrubbing reads as a level change, not flicker.
- No motion blur.
- `cycles.use_animated_seed = False`, so static areas keep the same noise from frame to frame.
- The grain plate stays as in 05. If WebP sizes exceed 7.4, make it static.

### 7.3 Sequences and frame counts

Frames are distributed **evenly in n** in the tide (equal scroll per hire, section 3) and **evenly in time**
(ease in-out per phase) in the cycle.

| Sequence | Size | Frames | Contents |
|---|---|---:|---|
| **D-open** | 1440×900 | **73** | d00–d03 intro (n 1, 4, 6, 8) · d04–d15 n 8→12 (3 per hire) · d16–d22 n 12→14.5 (red at d18) · d23–d32 turn + Side 1 · d33–d42 Down 1 (green at d41) · d43–d66 cycles 2–3 (4 per phase) · d67–d72 Oxygen to WIDE |
| **D-window** | 1440×900 | **19** | w00–w14 n 14.5→19 (3 per hire; eye under at w12) · w15–w18 n 19→39, light to Redline |
| **P-open** | 600×1300 | **52** | p00–p02 intro · p03–p10 n 8→12 (2 per hire) · p11–p15 n 12→14.5 (red at p12) · p16–p22 · p23–p29 (green at p28) · p30–p47 (3 per phase) · p48–p51 |
| **P-window** | 600×1300 | **13** | pw00–pw09 n 14.5→19 · pw10–pw12 Redline |
| D-drain, P-drain | 720×450, 300×650 | 12 + 12 | K16 → K17, time-based |
| Stills (P3, if the budget allows) | 2160×1350 and 900×1950 | 4 | K1 and K16, each layout: sharper hero and finale holds on retina |

The site interpolates (crossfades) between whatever frames exist, so the counts above are a minimum
that already plays. More frames simply make it smoother (7.5).

### 7.4 Budget (CPU time)

**Measured, not assumed.** `lookdev/renders.jsonl` records staging (c) at full size, with no shared CPU:
open view: 1440×900 at 32 samples, **148 s**; 1600×1000 at 32, **178 s**; 1440×900 at 16, 78 s; at 64, 281 s.
Window view (c-window): 1440×900 at 32, **119.5 s**; 1600×1000 at 32, 143.6 s. That is about three times
the 45–60 s/frame this brief was told to assume. 05 recommends 32 samples
(16 smears the concrete). So the plan uses **24 samples with OIDN** for the sequences (≈ 105 s at 1440×900,
to be confirmed), and 1440×900 rather than 1600×1000. The window camera measured 0.81× the open view, so
it is costed at ≈ 85 s.

| Item | Frames | s/frame (assumed) | CPU |
|---|---:|---:|---:|
| D-open | 73 | 105 | 2.13 h |
| D-window | 19 | 85 | 0.45 h |
| P-open (600×1300 ≈ 0.6× the pixels) | 52 | 63 | 0.91 h |
| P-window | 13 | 51 | 0.18 h |
| Drains | 24 | ≈ 20 | 0.13 h |
| Stills (P3) | 4 | ≈ 300 | 0.33 h |
| **Total** | | | **≈ 4.13 h** (≈ 0.4 h of headroom inside 4.5 h for re-renders) |

**Before committing:** render a 4-frame session of each camera at the final settings (05's `--seq`,
persistent data, through `tools/render_idle.py`) and recompute: `total = Σ frames × measured s/frame`.

| Measured D-open s/frame | Plan |
|---|---|
| ≤ 60 (as first assumed) | Plan A+: keep these sizes and double the density of beats 2, 6, 7 and 8 (render midpoints, 7.5) up to 4.5 h |
| 60–120 | **Plan A**: the table above |
| 120–160 | Plan B: sequences at 1280×800 (0.79×), phone at 540×1170; drop the P3 stills |
| > 160 | Plan C: Plan B, and cut beat 8 to 3 frames per phase (desktop) / 2 (phone); drains at 8 frames |

### 7.5 Render order (so a short run still gives a whole site)

The site plays any subset of frames (it crossfades between the nearest two), so render in this order and
the page is complete after step 2:

1. **The holds and cuts, desktop:** d00, d03, d15, d18, d22, w00, w12, w14, w18, d23, d32, d42, d46, d50, d54,
   d58, d62, d66, d72 (19 frames). These are also the reduced-motion plates.
2. **The same for phone** (p00, p02, p10, p12, p15, pw00, pw08, pw09, pw12, p16, p22, p29, p32, p35, p38, p41, p44, p47, p51).
3. Desktop in-betweens, beat by beat in story order. Then phone in-betweens.
4. Drains. Then the P3 stills.

Every job goes through `tools/render_idle.py` (it waits until no other `blender -b` runs; one render at
a time). Each sequence is one Blender session (`-a` or 05's `--seq`, persistent data on), resumable as
in the old pipeline: `use_overwrite = False`, `use_placeholder = True`
(`reference/old-render/render.sh`). Log every frame to `renders.jsonl`.

### 7.6 Anchors (how HTML finds things in the picture)

A Blender script (`tools/anchors.py`, as in `reference/old-render/anchors.py`) projects world points
through each frame's camera (`world_to_camera_view`) and writes `out/anchors.<layout>.json`. Coordinates
are normalised 0–1 to the frame. Per frame:

```json
{ "id": "d18", "cam": "HERO", "n": 13, "p": 78, "level": 0.021, "deck": 0, "phase": "tide", "signal": "red",
  "words": [0.167, 0.187, 0.833, 0.413], "waterY": 0.405, "deckY": 0.413, "deckX": [0.16, 0.84],
  "mark12": [0.875, 0.437], "gaugeX": 0.917, "focus": [0.5, 0.30] }
```

`waterY` is the still-water level at the wall (ignoring the chop) at the sentence's centre. `focus` is
the sentence's centre, used to keep it centred when the canvas crops.

### 7.7 Checks on the frames (`tools/frame_checks.py`, PIL)

For every frame, after rendering:
- **Caption zone** (desktop y 71–91% × x 25–75%; phone y 62–89%) and **finale zone** (desktop y 52–97%):
  relative luminance at the 95th percentile at or below 0.15 (cream text at 4.5:1). Report failures by
  frame. Fix in the scene (move the glitter, darken the near water). Only if that fails, the site
  applies a local radial scrim of at most 40% black, listed per frame range in the README.
- **Top band** (desktop 0–8%, phone 0–7%): the same test. A functional 0→40% top gradient (≤ 120 px)
  is allowed if it fails.
- **Words**: the sentence bbox must not touch the top band or the frame edge (anchors).
- **Positions**: the K1 and K2 anchors within ±2% of section 4.1 and 4.2.
- Contact sheet of every sequence (`lookdev/sheets/` style) for review.

### 7.8 Packing for the web

Use `reference/old-render/pack_frames.py` (WebP chunks + manifest, content-hashed), extended to keep the
frame ids and to accept a sparse frame list:

| Tier | Desktop | Phone | Target size |
|---|---|---|---|
| lo | 480 w, q 50 | 300 w, q 50 | ≈ 12 KB/frame; all frames ≈ 1.1 MB (D), 0.65 MB (P) |
| hi | 1440 w, q 72 | 600 w, q 70 | ≈ 130 KB (D), ≈ 75 KB (P); ≈ 12 MB / 5 MB in total |

Chunks of 8 frames, in story order, each with a content-hashed name. Output to `site/public/seq/{d,p}/{lo,hi}/`.
The PNGs stay in `out/` (gitignored). AVIF only if the encoder is available and saves at least 25%.

---

## 8. Phone adaptation

- **Own portrait renders** (P-open, P-window): the same scene with the sentence re-set in six lines
  (EVERY HIRE / COMPOUNDS / COMPLEXITY / BEFORE IT / COMPOUNDS / CAPACITY.). The landing and panel are as
  wide as the block. The ⦵ mark is smaller and fits on the wall beside the block. The same level map in H
  (section 3), so the same events land at the same n. The signal goes above the block's top left if it
  fits; if not, drop it (the light and the HTML colour carry red and green). The 16:10 frame cannot be
  cropped to 390×844 (05, section 5).
- **Which sequence:** viewport aspect below 0.75 uses the phone sequence; otherwise desktop, with
  hysteresis of 0.05, re-checked on resize or orientation change. Tablets in landscape use desktop; a
  portrait iPad uses phone frames, scaled up.
- **Text:** the sentence stays in the render. Captions are 25–34 px Ortica Angular Bold in two to four
  balanced lines (`text-wrap: balance`). Support lines are 17–18 px. Equations are Plimsoll 34 px on two
  lines. The readout docks into one line under the title after beat 1 (4.2). The legend in beats 6–8 is one
  row, `Up · Side · Down` (lit phase in cream, others `#7E8784`), with the cell line under it, at the top of
  the water band.
- **The sticky Bootloader bar** (6.2) at the bottom; the top bar holds only the title lockup and `The book`.
- **Units:** the stage uses `100svh`, so the canvas does not resize when the browser bars move. Size the
  canvas from `visualViewport` width × `min(devicePixelRatio, 2)`.
- **Touch:** native scroll only (no Lenis on touch), `overscroll-behavior: none` on the stage.

---

## 9. How the page plays the frames

### 9.1 Stage and canvas

- `<section id="story" style="height: calc(1280vh + 100svh)">` containing `<div class="stage">`
  (`position: sticky; top: 0; height: 100svh`). In it: `<img class="poster">` (d00 hi, `fetchpriority="high"`,
  the LCP; phone: p00), then `<canvas aria-hidden="true">`, then the HTML layers (captions, instrument,
  anchored labels).
- Canvas 2D, `imageSmoothingQuality = "high"`, sized to the viewport × `min(DPR, 2)`. Draw with the
  **cover** transform, centred on the frame's `focus` anchor (so on 16:9 and 4:3 the sentence stays
  centred and the top band stays at the top). Crop from the bottom first.
- **Crossfade:** for story position s, find the two neighbouring frames A, B and the fraction t. Draw A,
  then B at `globalAlpha = t`. If either is not decoded, draw the nearest decoded frame. Across a cut
  (`cam` differs), never blend: draw A if t < 0.5, else B.
- Lenis 1.1.13 on desktop only (`syncTouch: false`), as in the previous Waterline. One `requestAnimationFrame`
  loop; draw only when s or the decode state changes; pause when the tab is hidden.

### 9.2 Loading order

1. HTML, CSS and fonts (Plimsoll preloaded, 3.5 KB) and the poster (d00 hi). First-screen bytes at most
   600 KB.
2. The lo chunk with the intro frames, then **all lo frames** (≈ 1.1 MB desktop), so the whole story can
   play, soft, within seconds.
3. **hi chunks in story order outward from the playhead**, two at a time (FrameStore from
   `reference/old-render/frames.ts`: blobs held compressed, `createImageBitmap` decode, ±6 frames
   decoded around the playhead, eviction).
4. `navigator.connection.saveData` or `effectiveType` slower than 4g: hi chunks only for the hold frames
   (7.5 step 1 list); in-betweens stay lo.
5. The drain clip loads when the finale's form gets focus (or is 50% in view).
6. P3 stills replace d03 and d72 (and p02 and p51) when the playhead rests on them, with a 200 ms crossfade.

### 9.3 One clock for frames and text (`src/story.ts`, generated + hand-edited)

```ts
// s is the story position in vh: (scrollY - storyTop) / innerHeight * 100, clamped 0..1280
export const STORY = {
  lengthVh: 1280,
  intro: { desktop: ["d00", "d01", "d02", "d03"], phone: ["p00", "p01", "p02"] }, // time-based on load, not on the scroll clock
  frames: {      // generated by tools/story_frames.py from keyframes.json + anchors.*.json: [id, s, cam]
    // the first entry is held from s = 0; a cut sits between two entries with different cams
    desktop: [["d03", 20, "HERO"], ["d04", 29.2, "HERO"], /* … */ ["d22", 240, "HERO"], ["w00", 280, "WINDOW"], /* … */],
    phone:   [["p02", 20, "HERO"], ["p03", 33.8, "HERO"], /* … */],
  },
  captions: [   // [copy key, in, out] in vh; fade 10vh at each end
    ["tide.perHire", 30, 120], ["tide.twelve", 135, 180], ["tide.breaks", 190, 280],
    ["tide.under", 290, 400], ["tide.redline+tide.drowning", 420, 520], ["turn.line", 525, 600],
    ["cycle.side", 605, 680], ["cycle.downA+cycle.downB", 685, 760], ["cycle.repeat", 765, 830],
    ["offer", 835, 900], ["cycle.deposits", 905, 1000], ["cycle.higher", 1000, 1100],
    ["cycle.oxygen+cycle.breathe", 1110, 1190], ["finale", 1190, 1280],
  ],
  chrome: { readout: [0, 540], legend: [580, 1160], labels: [600, 1160], dockCycleLine: [520, 1100] },
};
```

The readout's n, the anchors and the signal state are read from the frame table and interpolated with
the crossfade, so the numbers always match the water on screen. In the motion part of a beat, frames
are spaced evenly in s; in a hold, the last frame's s range simply extends.

### 9.4 Performance

- JS at most 60 KB gzipped without React, or 110 KB with it (the builder's choice; pins as in the
  previous brief's S1: vite 5.4.10, typescript 5.6.3, react 18.3.1, lenis 1.1.13).
- Fonts ≈ 91 KB (03-TYPE, 5.1).
- Animate only `transform`, `opacity` and `clip-path`; CLS at most 0.02. LCP (the poster) at most 2.0 s on
  desktop broadband.

---

## 10. Reduced motion and no JavaScript

**The default HTML is the static version** (progressive enhancement); JS upgrades it to the scrubbed stage.
An inline script in `<head>` sets `html.js` before first paint. The stage shows only under
`html.js:not(.rm)`, and `.rm` is set when `prefers-reduced-motion: reduce` (or `?reduced=1`).

The static version is seven plates in normal flow, each `min-height: 100svh`. Each has a `<picture>`
(desktop and phone crops via `media="(max-aspect-ratio: 3/4)"`, the hi tier frame) as a cover background
and its captions in the same positions as the beat.

| Plate | Frame (D / P) | Captions |
|---|---|---|
| 1 Arrival | d03 / p02 | first-screen HTML; the readout at 8 · 28 · Team 8–12 |
| 2 Twelve | d15 / p10 | tide.perHire; tide.twelve; the readout at 12 · 66 |
| 3 Thirteen | d18 / p12 | tide.breaks; 13 · 78 · Threshold |
| 4 Under | w12 / pw08 | tide.under; the readout as stored for that frame (about 18 · 153 · Graveyard 15–39) |
| 5 Redline | w18 / pw12 | tide.redline, tide.drowning; 39 · 741 |
| 6 The cycle | d42 / p29 | turn.line; cycle.side; cycle.downA, cycle.downB; the legend in full with all three cells; cycle.repeat; the offer |
| 7 Oxygen | d72 / p51 | cycle.deposits; cycle.higher; cycle.oxygen, cycle.breathe; then the finale |

- **No intro, no crossfades.** The dock and bar work as normal. The drain becomes an instant cut to
  the drained still (or is skipped if it is not loaded), then navigation after 300 ms.
- **No-JS:** in post mode the form posts to `/api/optin` as a plain form. In handoff mode a
  `<noscript>` block replaces the field with one link button, `Get the free Bootloader`, to
  `OPTIN.handoff` (no field that would do nothing). The dock and bar are plain `#get` anchors.
- Frames for the plates come from the render (7.5 step 1); nothing extra is rendered.

---

## 11. Type, colour and chrome: not AI-made, not flat

- **Faces** (03-TYPE, section 0):
  - **Plimsoll Heavy** (ours) for the rendered sentence, the title, the figures, the two equations,
    `Up. Side. Down. Repeat.`, the file name and ⦵.
  - **Ortica Angular Bold** for Michael's beat lines.
  - **Ortica Linear** for support lines.
  - **B612** for labels, units, the form and the band names, in sentence case only.
  - The 3D sentence is set and kerned as in 03-TYPE 5.4 (`tools/type/type3d.py --kern 1 --track 0.03 --capspitch 1.32`).
- **Colour tokens:**
  - `--cream #EEF0EC` (text on the render)
  - `--dim #B9C2BD`
  - `--off #7E8784` (unlit legend phases)
  - `--ink #151718` (button text, bar)
  - `--redline #F0A093`
  - `--oxygen #A9D8B0`
  - `--deep #0D1110` (footer and page background; the render's darkest water)

  The cover colours never appear as flat fills. Green and red exist in the render as real light (the
  signal) and in two equations as text.
- **The page background is the render.** No cream paper, no grain overlay, no gradients except the
  functional scrims in 7.7, no glass or blur, no card shadows, no rounded pills (every control is square,
  1.5–2 px), no icon set (⦵ is the only icon), no emoji, no chevrons.
- **No tracked or monospace small capitals.** Labels are B612 in sentence case.
- **No centred eyebrow, headline, sub-head and two buttons stack.** The first screen is four corners around
  the rendered sentence. Captions sit in one slot on the water, never beside a picture.
- **Every shadow and every highlight on the first screen is rendered** (light, not CSS). No CSS text-shadow on
  HTML text; if legibility needs help, it is a measured scrim (7.7).
- **The footer** (normal flow, `--deep`): `Read the Appendix` link; "Up. Side. Down. Repeat." [M 1713 ·
  copy.ts:125] in Plimsoll 22 px; on phone the author line [BL 51]; `Scaling Up‑Side‑Down · Michael Wentz`
  (B612 13 px).

---

## 12. Accessibility

- One `<h1>` (visually hidden): the thesis. Landmarks `header` / `main` / `footer`. Skip link first:
  `Skip to the Bootloader` → `#get`.
- The canvas is `aria-hidden`. The stage has `aria-label="The story, told by the water"`, and every caption is
  real DOM text in story order. Screen-reader users get the whole story as text, without scrolling tricks.
- The readout has `aria-live="polite"` on band changes only (for example "13 people, 78 coordination pathways,
  Threshold 13–14"), throttled to at least 1.5 s apart.
- Contrast: body text at least 4.5:1, big text at least 3:1, measured on the actual frames (7.7). Focus
  ring 2 px cream with a 3 px offset, never removed. Tap targets at least 44×44 px. Every control works
  from the keyboard; `Get it free` and the offer button move focus to the field.
- `aria-disabled="true"` on `Pre-orders open soon`; it stays focusable and says what it is.

---

## 13. QA and screenshots (James judges by screenshots)

**Debug URL params** (harmless in production):

| Param | Effect |
|---|---|
| `?s=<vh>` | jump to a story position |
| `?f=<frame id>` | pin a frame, for example `?f=w18` |
| `?layout=desktop\|phone` | force a layout |
| `?tier=lo\|hi` | force a tier |
| `?reduced=1` | the static plates |
| `?nonav=1` | play the drain and stay |
| `?anchors=1` | draw the anchor boxes and lines |
| `?optin=handoff\|post` | dev builds only |

**Shots for James** (desktop 1440×900 and phone 390×844, through
`node /home/user/Website-selling/susd-options/tools/shoot.cjs <url> <outdir>` plus the pinned states):

- first screen at 600 ms and at 3 s;
- `?s=180` (12);
- `?s=240` (13, touch);
- `?s=360` (under, window);
- `?s=480` (Redline);
- `?s=560` (the turn);
- `?s=650` (Side 1);
- `?s=740` (Down 1, margin);
- `?s=860` (offer);
- `?s=1050` (Repeat);
- `?s=1150` (Oxygen);
- `?s=1250` (finale);
- the drained state (`?nonav=1`);
- `?reduced=1` in full.

Also check 1280×720, 1920×1080, 768×1024 and 375×667: no horizontal scroll, nothing clipped, the sentence
centred.

**Pass conditions:**
- The five-second test on the 3 s frame (section 0).
- The squint test: the rendered sentence is the most visible thing.
- copycheck 0 not found on `src/copy.ts` and every `.ts`/`.tsx`/`.html` file.
- No console errors.
- The frame checks pass (7.7).
- Every beat makes sense with no clicks (watch the shots in order without the captions; then read only
  the captions: each should still tell the story).

---

## 14. Copy deck (paste as `src/copy.ts`)

The file is `briefs/copy-deck.waterline-render.ts`. Checked:
`node /home/user/Website-selling/susd-options/tools/copycheck.mjs briefs/copy-deck.waterline-render.ts` →
`37 sentences checked, 0 not found in Michael's text` (also run on a scratch copy named `copy.ts`, same
result). Components import every sentence from it; no sentence is typed in JSX or HTML (the static plates
and the `<noscript>` form are rendered from the same module at build time).

```ts
// src/copy.ts for WATERLINE (render). Paste as is. Every sentence is Michael's, word for word.
// Brief: susd-render/briefs/BRIEF-waterline-render.md (section 14).
// Refs: BL n = line n of susd-options/source/public_bootloader.md (the SUSD Bootloader V16).
//       M n · copy.ts:k = manuscript line n, as recorded on line k of susd-options/source/src_copy.ts.
// A line ending in `// label` is a UI label, button or microcopy (not a sentence of Michael's); copycheck skips it.
// Gate (must print "0 not found"):
//   node /home/user/Website-selling/susd-options/tools/copycheck.mjs src/copy.ts
// Never edit a sentence here. A multi-sentence line may be shown one sentence at a time, in its original order only.

export const COPY = {
  meta: {
    title: "Scaling Up-Side-Down · Michael Wentz", // label
    description: "Every hire compounds complexity before it compounds capacity.", // M 696 · copy.ts:60
  },

  // Fixed chrome: top bar (desktop and phone), the Bootloader dock (desktop) and bar (phone).
  chrome: {
    title: "Scaling Up-Side-Down", // label (the book's title; set with U+2011 no-break hyphens)
    byline: "A book by Michael Wentz", // label
    book: "The book", // label
    skip: "Skip to the Bootloader", // label
  },
  dock: {
    name: "SUSD Bootloader", // label
    meta: "Free file · V16 · 35,445 words", // label
    metaCycle: "The file is the operating system.", // M 4497 · copy.ts:61 (2nd sentence; the dock's meta line during beats 6-8)
    button: "Get it free", // label
    aria: "Get the free SUSD Bootloader file", // label
  },

  // Beat 1: the first screen. The thesis itself is the rendered letters; this H1 is visually hidden.
  hero: {
    h1: "Every hire compounds complexity before it compounds capacity.", // M 696 · copy.ts:60
    audience: "For bootstrapped, self-funded founders with teams of 1–12", // label (from the fit table, BL 4773 "Bootstrapped / self-funded" and BL 4775 "1-12 employees")
    scrollCue: "Scroll to hire. Each step is one more person.", // label
    altDesktop: "Heavy capital letters standing on a concrete lock wall spell the sentence above; dark water sits just below them.", // label (poster alt text)
    altPhone: "The same sentence in six lines of heavy capitals on a lock wall, with dark water below.", // label (poster alt text)
  },

  // The instrument (right column on desktop, compact readout on phone), beats 1-5.
  gauge: {
    question: "How many people are on your team?", // BL 310
    person: "person", // label
    people: "people", // label
    pathway: "coordination pathway", // label
    pathways: "coordination pathways", // label
    delta: "+{d}", // label (pathways added by the last hire: n-1)
    // Bands, top to bottom as on a water gauge. Tags are labels (BL 69-77 names and ranges); lines are verbatim.
    bands: [
      { id: "teamOfTeams", tag: "Team of Teams 40+", line: "At 40+, Team of Teams physics apply. Different constraints, different playbook." }, // BL 4253
      { id: "graveyard", tag: "Graveyard 15–39", line: "The Graveyard is not a temporary problem. It's a structural trap." }, // BL 3451 (1st + 2nd sentences)
      { id: "threshold", tag: "Threshold 13–14", line: "At 13-14 employees, next hire is a phase change, not incremental growth." }, // BL 3450 (1st sentence of the quoted cell)
      { id: "team", tag: "Team 8–12", line: "Leader + team. Still know everyone's name." }, // BL 1250
      { id: "valley", tag: "Valley 4–7", line: "Transition zone between Small Team and Team." }, // BL 1249
      { id: "smallTeam", tag: "Small Team 2–3", line: "Leader + helpers. Coordination manageable." }, // BL 1248
      { id: "solopreneur", tag: "Solopreneur 1", line: "Founder only. No coordination overhead." }, // BL 1247
    ],
  },

  // Beats 2-5: the tide (scroll = hiring).
  tide: {
    perHire: "Each addition doesn't add one unit of complexity — it adds n-1 new interaction pathways.", // BL 2339 (1st sentence of the cell)
    twelve: "12 isn't where you're trying to get. It's the line you don't cross.", // BL 544
    breaks: "Past twelve, something breaks.", // M 3509 · copy.ts:88
    under: "Complexity that accumulated faster than the structure could hold.", // M 2021 · copy.ts:96
    redline: "Complexity > Capacity = Redline.", // M 2997 · copy.ts:80
    drowning: "The business is drowning. Every addition makes it worse.", // BL 717
  },

  // Beat 6: the turn.
  turn: {
    line: "You were never the problem. The model you inherited was.", // M 216 · copy.ts:196
  },

  // Beats 6-9: the cycle.
  cycle: {
    lead: "Real scaling is cyclical.", // BL 795 (1st sentence of the cell)
    phases: ["Up for growth.", "Side for stability.", "Down for pruning."], // BL 795 (2nd-4th sentences)
    phaseNames: ["Up", "Side", "Down"], // label
    // What each phase does: the Compounding Mechanism table, "What Happens" column, cell text only.
    cells: [
      "Revenue expands, reach grows, capacity stretches", // BL 861
      "Systems absorb the growth, structure stabilizes", // BL 862
      "Complexity pruned, margin recaptured, efficiency locked", // BL 863
    ],
    side: "Systems were what actually held the weight.", // M 2408 · copy.ts:103
    downA: "Something needs to be cut.", // M 2564 · copy.ts:111
    downB: "The business stops asking for more and starts asking what to keep.", // M 2564 · copy.ts:112
    repeat: "Up. Side. Down. Repeat.", // M 1713 · copy.ts:125
    deposits: "Each cycle deposits systems and margin. The next cycle withdraws from a larger account.", // BL 866
    higher: "Nothing moves forward until the cycle completes. But when it does, the next cycle starts higher.", // BL 870 (2nd + 3rd sentences)
    labels: { water: "complexity", deck: "capacity", gap: "margin" }, // label (anchored to the render)
    lap: "Cycle {k} of 3", // label
    oxygen: "Capacity > Complexity = Oxygen.", // M 2999 · copy.ts:119
    breathe: "The business can breathe. Systems carry what the business creates.", // BL 718
  },

  // Beat 7: the mid-story offer (after the first full cycle).
  offer: {
    line: "The pages are reference. The file is the operating system.", // M 4497 · copy.ts:61
    button: "Get the free Bootloader", // label
  },

  // Beat 9: the finale. Two paths; the Bootloader is the primary one.
  finale: {
    aiOpen: "In an open system, AI accelerates chaos.", // M 4523 · copy.ts:136 (1st sentence)
    aiClosed: "In a closed system, AI accelerates clarity.", // M 4523 · copy.ts:140 (2nd sentence)
    bookHalf: "The book changed how you think.", // M 4553 · copy.ts:146 (1st sentence)
    fileHalf: "This SUSD Bootloader changes how you operate.", // M 4555 · copy.ts:146 (2nd sentence)
    fileName: "SUSD Bootloader", // label
    fileWhat: "The book's appendix as one file, for your AI", // label (what the file is, in one line)
    fileMeta: "Free · V16 · 35,445 words · Markdown", // label (version: BL 747; words: the live /appendix)
    worksWith: "Works with Claude, ChatGPT, Gemini", // label (BL 221 names these three assistants)
    email: "Email address", // label
    placeholder: "you@company.com", // label
    submit: "Get the free Bootloader", // label
    badEmail: "Enter your email address.", // label
    noteHandoff: "Opens the Bootloader page, where the file is sent by email.", // label (OPTIN.mode "handoff")
    notePost: "The file is sent to this address.", // label (OPTIN.mode "post"; add a line about new versions only once Michael confirms the list sends them)
    leaving: "Taking you to the Bootloader page…", // label
    upload: "Upload the file and use the starting prompt provided with it.", // M 4531 · copy.ts:150
    locate: "Then let the system locate you.", // M 4533 · copy.ts:151
    bookTitle: "Scaling Up-Side-Down", // label
    bookAuthor: "Michael Wentz", // label
    preorderSoon: "Pre-orders open soon", // label (disabled until LINKS.preorder is set)
    preorder: "Pre-order the book", // label (only when LINKS.preorder is set)
    credential: "Wentz spent nearly a decade in institutional finance before building and operating a bootstrapped business that scaled beyond 40 people.", // BL 51 (1st sentence)
    appendix: "Read the Appendix", // label
  },

  footer: {
    line: "Up. Side. Down. Repeat.", // M 1713 · copy.ts:125
  },
};

// Reduced motion and no-JS: the stacked plates reuse the sentences above (no new copy).
// Debug and accessibility strings are labels.
export const UI = {
  storyRegion: "The story, told by the water", // label (aria-label of the stage)
  readoutLive: "{n} {people}, {p} {pathways}, {band}", // label (aria-live text on band change)
  stamp: "Yours", // label (drain confirmation)
};
```

`src/bootloader.ts`: `export const BOOTLOADER = { version: "V16", file: "SUSD_Bootloader_V16.md", words: 35445,
wordsLabel: "35,445", date: "October 2026" };` (BL 747; the live /appendix).

---

## 15. Decisions James (and Michael) need to make

1. **Opt-in mode.** MVP is handoff, as decided. Post mode removes the second email entry and records
   which CTA converted. It writes to Michael's live list, so it needs James's OK, and someone must
   confirm that `/api/optin` accepts posts from the new site's origin.
2. **Plimsoll as the rendered face** (03-TYPE: James and Michael have not seen it yet). If they reject it,
   Ortica Angular Bold takes the render and the touch at 13 becomes descender-first (03-TYPE, section 4).
3. **The lock signal** (red/green). Keep it if the test stills read as part of the place; drop it if it
   reads as an extra object. The red and green then come from light and the two equations.
4. **The window camera** for beats 4–5 (05's answer to unreadable drowned words). Confirm on the first
   contact sheet that the match cut reads as the same lock.
5. **The author line in the finale** (authority) or only in the footer (fewer words).
6. **Michael:** may the post-mode note say the list also gets new versions of the file? (Not claimed until
   he says yes.)

---

## 16. What this brief changed from the CSS Waterline, and why

| Kept (it worked) | Dropped (it needed interaction or looked AI-made) | New |
|---|---|---|
| The thesis as the hero words; scroll = hiring; water = pathways; the band gauge with the question at its head; the turn line; Up, Side and Down as level and ground; `complexity`, `capacity` and `margin` labels; the drain on opt-in; two paths | Bricolage Grotesque and JetBrains Mono; cream paper with grain; tracked mono caps; the pill CTA; CSS water and a WebGL shader; the hero's centred stack; the "Yours" stamp as a big rotated stamp | Real renders in a real place (a canal lock: a machine whose job is to raise and lower water); the ⦵ load line at 12 shared by the render and the CTA; equal scroll per hire so the water visibly accelerates; going under with the words through glass; the flood scar the words end above; the first screen's water level returning at Oxygen; one opt-in form with four entry points, post mode and `source` tags |

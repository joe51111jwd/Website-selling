# His images: two homepage concepts built from Michael's own metaphors

**Lens:** only pictures Michael himself already put in the book. A concept born from his own
sentence cannot be “cool, but nothing to do with his book”.
**Ids:** `his-images-1` (All Three Dimensions) and `his-images-2` (The Wrong Map).
**Inputs read:** `susd-options/brief/TASTE.md`, `susd-options/brief/MESSAGE.md`,
`susd-render/docs/01-MEANING.md`, `susd-render/reference/old-render/README.md`, the first-screen
screenshots of the four options built last night, and the cited lines of
`susd-options/source/public_bootloader.md` and `susd-options/source/src_copy.ts`.

**References:** `[BL 816]` = `public_bootloader.md` line 816. `[M 696 · copy.ts:60]` = manuscript
line 696 as recorded on line 60 of `src_copy.ts`. `[TASTE]` = James's words as recorded in
`TASTE.md`. Every quotation in straight double quotes followed by a tag is character-exact and was
checked by `susd-render/tools/check_meaning_quotes.py` (see the last section). Labels, buttons and
numbers are written fresh (the copy rule allows it) and are shown in `code`, never in straight quotes.

---

## 0. The two concepts on one screen

| | **his-images-1 · All Three Dimensions** | **his-images-2 · The Wrong Map** |
|---|---|---|
| The image | The title built as a building: UP stands as a column, SIDE runs across the floor, DOWN runs back into the room, bolted together at the hyphens, under a slot of sunlight that falls on Michael's sentence. | A cut-plywood relief model of a founder's world laid out by team size, with a red thread pulled dead straight across it from 1 to the far peak: the map everyone inherited, sailing over the plateau and the Graveyard. |
| His line | "You can't build a building with only height. You need all three dimensions or it topples." [BL 816] | "There are two kinds of growth. You inherited the wrong map." [BL 838] |
| What it answers best | What the book claims, and the cycle (Michael's priority 2) | Who it is for and where they stand (Michael's priority 1) |
| One dramatic action | Press `Get the Bootloader`: the three loose words slide together and the steel hyphens bolt in (Scaling Upside Down becomes Scaling Up-Side-Down). | Answer `How many people are on your team?`: a brass pin drops onto your stretch of the map, the haze lifts there, and the camera walks the terrain to you. |
| Render cost | ~178 sequence frames + 8 stills, about 2.5 h | ~120 dolly frames + 84 small pin frames + 9 stills, about 2 h |
| Biggest risk | James sees “the blocks again” or “the-title again” | James sees “a lot going on” or a game map |

Both are built so that **the eye's landing point is a sentence**: in concept 1 the sentence is the
brightest, sharpest thing in the frame because real sunlight falls on it; in concept 2 the sentence
sits alone in the only empty area (the haze over the far terrain), and the map's own engraved
labels do the rest.

---

## 1. The problem, in James's words

Today (not yet in TASTE.md, so shown in curly quotes): *“it needs to not look ai. use blender to
render everything so it wont look flat and ai made… find intresting fonts that ai wouldetn use. make
your own… i want you to try your best to derive meaning.”*

Before that: "If you have blocks and left aligned text then rn you just look at the blocks and don't read the text." [TASTE]
And the standing rule behind every verdict: "If a concept needs explaining, it has failed." [TASTE]

So the job is not “a nicer render next to the words”. It is one picture in which **looking is
reading**: the depth, light and material are how the sentence reaches you, and the sentence is what
the picture is of.

## 2. What “AI-made” meant in last night's four options (observed in the screenshots)

I looked at `desktop-01-first-3s.png` and `phone-01-first-3s.png` for the-title, count-yourself,
waterline and corrected-edition. The shared tells:

1. **Cream paper with grain** as the page (the-title, waterline, corrected-edition).
2. **The centred stack:** eyebrow, headline, sub, meta line, two buttons, scroll chevron, all on
   one vertical axis (all four).
3. **Small tracked caps labels**, often mono (`A BOOK BY MICHAEL WENTZ · FOR BOOTSTRAPPED FOUNDERS`,
   `COMPLEXITY`, `GALLEY 01 OF 06`).
4. **Pill or boxed buttons** with a two-line label (all four).
5. **Trend fonts:** Fraunces/Newsreader italics, wide grotesks, a condensed display grotesk.
6. **Depth faked in CSS:** extruded letters with a drop shadow, a wavy “water” fill, a paper card
   with a vignette. Nothing in any of them was lit by a light.
7. **The cover colours as flat fills** (green, ochre, red) on type.

Both concepts below therefore follow these rules: no cream page, no centred stack, no tracked caps,
no pills or boxes, no font from that list, no CSS depth (every shadow on the first screen is a
rendered shadow), and the cover colours only as real material (pigmented concrete, painted bands
on brass), never as flat fills.

---

## 3. his-images-1 · All Three Dimensions

### 3.1 The image

The book's title built as a building, at architectural scale, in a quiet concrete gallery: the
word **UP** stands as a column (U on top of P), **SIDE** runs across the floor as a wall, **DOWN**
turns at the corner and runs back into the room as a second wall, and the two joints are bolted
with blackened-steel brackets: the hyphens. Above it, a slot of real sunlight crosses the plaster
wall and lands on Michael's sentence, which is mounted on the wall in steel letters.

### 3.2 Why it is the book (image → idea → his words)

- **His picture, word for word:** "You can't build a building with only height. You need all three dimensions or it topples." [BL 816]
- **His axes, which decide where each word goes:** Up is "Growth (the axis everyone obsesses over)" [BL 808],
  Side is "Stabilization (the axis no one sees)" [BL 809], Down is "Optimization (the axis everyone fears)" [BL 810].
  He calls them Y, X and Z. In Blender: UP along Z (vertical), SIDE along X (width), DOWN along Y
  (depth). So **each word reads along its own axis**: UP reads upward (stacked), SIDE reads
  across, DOWN reads into the room. Down is depth, not descent (01-MEANING misreadings).
- **The problem shape:** "Traditional scaling is one-dimensional." [BL 802] "One-dimensional scaling looks like progress but it's just a line getting longer." [BL 812]
  "You're just extending in one direction until you snap." [BL 812]
- **The fix shape:** "Three-dimensional scaling builds a structure. Each cycle adds depth, width, and height. The business has volume. It has weight. It can hold load." [BL 814]
- **The title's own key:** "Real scaling is cyclical. Up for growth. Side for stability. Down for pruning. The hyphens aren't decoration—they're the rhythm. Skip a leg, tip upside down." [BL 795]
  The vocabulary lock keeps Scaling Upside Down (the problem) and Scaling Up-Side-Down (the
  framework) as two separate proper nouns [BL 3960-3961]. So the hyphens are physical parts: steel
  brackets that turn three loose words (the problem) into one structure (the framework).
- **Why render at all (the meta point from 01-MEANING):** the book argues against flatness. A flat
  page is a picture of the one-dimensional business; a lit, solid structure is a picture of his fix.
  The depth is the thesis, not decoration.

### 3.3 Five-second test

A stranger says: *“It's a book, Scaling Up-Side-Down by Michael Wentz, for bootstrapped founders
with small teams. It says a business that only grows up topples; you have to grow up, sideways and
down to build something that stands. I can get a free file now or the book soon.”*

### 3.4 First screen, 1440 × 900

The whole first screen is **one rendered photograph** (2880 × 1800 still, served as AVIF ~300 KB
with WebP fallback). Only the two actions are live HTML type; the headline's HTML twin is laid over
the rendered letters with transparent ink so it can be selected, read aloud and crawled.

```
 0 ┌──────────────────────────────────────────────────────────────────────────────────┐
   │ lime-plaster wall, frontal              ╱ slot of sunlight from a window off left │
 95│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  │
   │    You can't build a building with only height.        (steel letters, line 1)   │
   │    You need all three dimensions or it topples.        (steel letters, line 2)   │
330│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  │
   │            ┌U┐                                                                     │
   │            │ │  green column                                                      │
   │            ├P┤══ S  I  D  E ══╗  ochre wall across                                 │
   │            └─┘                 ║ D   O   W  N   oxide-red wall, receding into room │
   │ ┌cornerstone┐  plinth ─────────╝                                                  │
   │ └───────────┘   The book · Pre-orders open soon      Get the Bootloader ▬▬▬▬▬     │
900└──────────────────────────────────────────────────────────────────────────────────┘
```

**Wall and light (y 0-560).** Pale lime plaster, square to the camera. A slanted band of sunlight
from a clerestory slot off-frame left crosses it: it enters the left edge at y≈95-330 and drops
about 40 px by the right edge, with soft 12 px edges and two thin mullion shadows (x≈470, x≈1010).
Outside the band the wall sits in cool skylight, two stops darker. **The band is the brightest
thing in the frame, and the sentence is inside it.**

**The headline (in the render, as objects).** Both sentences of [BL 816], one per line:
"You can't build a building with only height." [BL 816] on line 1 and "You need all three dimensions or it topples." [BL 816] on line 2.
The two sentences are **exactly 44 characters each**, so they set as two equal lines, a lintel of
type (x 120-1320, cap height 40 px ≈ 58 px type, line 1 at y≈128-188, line 2 at y≈214-274). The
letters are blackened steel, 8 mm thick, mounted 25 mm off the plaster on pins, set in the custom
face `Formwork Plate` (3.6). In the sun each letter throws a crisp shadow 7 px down and right. That
real offset shadow, not CSS, is what makes the words three-dimensional.

**The structure (y 300-800).** It stands on a 12 cm concrete plinth rotated about 35° to the wall,
so both wings are seen at an angle while the wall stays square:
- **UP** (x≈330-470): U on top of P, each letter 1.2 m cap height, in oxide-green pigmented
  concrete; its top edge reaches y≈300 and catches the bottom of the sun band. The axis everyone
  obsesses over is the one reaching into the light.
- **SIDE** (x≈470-930): ochre pigmented concrete, 1.2 m letters, running from the foot of UP to the
  corner, letters ~200 px tall at the near end.
- **The corner** (x≈930, y≈560-800): the point nearest the camera.
- **DOWN** (x≈930-1300): oxide-red pigmented concrete, turning away from the corner into the room;
  letters shrink from ~220 px to ~120 px with perspective. It is legible but plainly in depth.
- **The hyphens:** a blackened-steel bar bolted across the UP→SIDE joint at mid-height, and a
  steel angle bracket wrapping the SIDE→DOWN corner, four bolt heads each.

**The cornerstone (in the render).** A dressed concrete block at the plinth's front-left corner
(x≈120-330, y≈700-800), engraved in `Formwork Plate`, sun-free but well lit by sky:
`Scaling Up-Side-Down` / `Michael Wentz` / `For bootstrapped founders, teams of 1-12`. This is where a
building says its name and who it is for, so the title, author and audience are answered without
an eyebrow label.

**The two actions (live HTML, y≈820-880, on the floor band).** Set as type on the honed concrete,
no box, no pill, 24 px `Formwork Plate`, ink checked to 4.5:1 against the floor:
- `The book · Pre-orders open soon` (x≈380-700)
- `Get the Bootloader` with a second line `SUSD Bootloader V16 · 35,445 words · a file for your AI, free by email`
  (x≈860-1320), underlined by a rendered steel bar that is the hyphen bracket, stretched. The
  Bootloader's button is literally a hyphen: the rhythm, as a file.

No nav bar, no scroll chevron. A visually hidden skip link and the HTML `h1` twin of the sentence.

**Materials.** Lime plaster wall; honed concrete floor with saw-cut joints every 2 m (the room's
grid against the rotated plinth gives the eye a depth scale); pigmented board-formed concrete
letters with bug holes, form-tie cones and slightly chipped arrises; blackened steel with a little
rust bloom at the bolt heads.

**Light.** Sun 5200 K through the slot, raking the wall at about 20° so the trowel marks in the
plaster and the letter shadows read; cool skylight fill (~7000 K) in the shadows; a large bounce
card camera-right lifting DOWN's faces. AgX, Medium High Contrast.

**Lens.** 40 mm on a 36 mm sensor, camera 1.6 m high, about 9 m from the corner, square to the wall;
verticals kept vertical with lens shift (shift_y ≈ 0.12) instead of tilting, as an architectural
photographer would; f/8, focus on the corner.

**Palette.** Plaster in sun `#D8D0C2`, plaster in shade `#9EA19F`, floor `#85837E`, green concrete
`#5E6F55`, ochre concrete `#B58A47`, red concrete `#9C4434`, steel `#22201E`. The page below the
hero continues as the gallery in shadow, `#1C1B1A` with text `#ECE6DA`. No cream anywhere.

### 3.5 First screen, 390 × 844

A separate portrait render (780 × 1688), not a crop. Camera 6 m from the corner, 32 mm, still square
to the wall. The sentence is re-mounted on the wall as six lines of steel letters in the top 40%
(cap ≈ 18 px, ≈ 26 px type): `You can't build` / `a building with` / `only height.` /
`You need all three` / `dimensions or` / `it topples.` (the same two sentences of [BL 816], line breaks
only). The sun band is steeper so it still covers all six lines. The structure fills the middle
35%: UP column at left, SIDE across, DOWN receding up and right. Cornerstone bottom-left; the two
actions are two full-width rows of type at the bottom, each at least 48 px tall.

### 3.6 Type: `Formwork` (custom)

**Idea:** a typeface drawn to be cast in concrete. A carpenter builds a concrete form from straight
boards, so it cannot make a free curve. Every curve in `Formwork` is replaced by what a form
actually produces: a small 45° chamfer on outer corners (the chamfer strip nailed into the form)
and a small fillet on inner corners. Every stem is one board wide.
- **Grid:** stem = 1 board (B); cap height = 5B in `Cast`, stem 0.12 cap in `Plate`; chamfer 0.35B,
  inner fillet 0.2B; terminals cut square; diagonals (N, W, V, A, K…) are straight braces of 1B.
  Proportions of a plain 1920s engineering grotesk, so the chamfers read as craft, not sci-fi.
- **The hyphen glyph is a bolted plate:** a bar 2.4B × 0.8B with two round bolt-hole counters.
  The em dash is the same plate with three holes. Every hyphen Michael wrote (as in Up-Side-Down) is a
  bracket in the font, so the title's hyphens look like what they are in the render.
- **Weights:** `Formwork Cast` (heavy, for the 3D title letters, extruded 0.3 × cap) and
  `Formwork Plate` (regular, for the steel wall letters, the cornerstone and all HTML text).
- **Build:** a Python script writes UFO glyphs from a grid spec (rectangles + the chamfer rule),
  removes overlaps with skia-pathops, compiles with fontmake to OTF and WOFF2. Blender loads the
  same OTF (`bpy.data.fonts.load`) for the 3D letters, so the page and the render share one face.
- **Fallback for long body text** (if `Plate`'s lowercase is not comfortable below 18 px): one found
  OFL face chosen in the type step from Velvetyne, Collletttivo or Font Squirrel. Banned: Fraunces,
  Newsreader, Archivo, Bricolage, Inter, any mono for labels.

### 3.7 Scroll beats

| # | What happens physically | Words on screen (verbatim) | Render |
|---|---|---|---|
| 1 | **Hero.** On load the sun slides across the wall and lands on the sentence (light-group composite, 1.2 s). | "You can't build a building with only height. You need all three dimensions or it topples." [BL 816] | still, 2 light passes |
| 2 | **One dimension.** The camera pans to the far end of the gallery: a column of small UP letters (0.3 m cap) stacked U, P, U, P. Each scroll step lowers one more letter onto the top; the column sways; the 13th tips it across the floor, where it breaks at a joint. Counter label `Hire 1 … Hire 13`. | While stacking: "You're just extending in one direction until you snap." [BL 812] On the fall: "Past twelve, something breaks." [M 3509 · copy.ts:88] After it settles: "You were never the problem. The model you inherited was." [M 216 · copy.ts:196] | 60 frames, scrubbed, rigid body |
| 3 | **Three axes.** Back to the structure, square-on with a 135 mm lens: it looks flat; UP and SIDE read, DOWN is an edge-on slab. The camera orbits 35° while the lens opens to 40 mm, and DOWN appears in depth. Each axis label is pinned to its word by exported screen anchors. | "Growth (the axis everyone obsesses over)" [BL 808] · "Stabilization (the axis no one sees)" [BL 809] · "Optimization (the axis everyone fears)" [BL 810], then "Real scaling is cyclical. Up for growth. Side for stability. Down for pruning." [BL 795] | 40 frames, scrubbed |
| 4 | **Load.** Two crane cables descend into frame and lower an L-shaped precast slab onto the tops of SIDE and DOWN; UP rises through a notch at the slab's corner. The slab seats 6 mm, a little dust lifts, nothing moves. | "The business has volume. It has weight. It can hold load." [BL 814] | 30 frames, scrubbed |
| 5 | **Repeat.** The camera has risen one storey: on the slab a second SIDE and DOWN stand beside the column's U (UP now spans two storeys, U above P), and on the next slab the next column has begun. Each cycle ends higher; never a wave or a circle. | "Up. Side. Down. Repeat." [M 1713 · copy.ts:125] and "Each cycle deposits systems and margin. The next cycle withdraws from a larger account." [BL 866] | still |
| 6 | **Two paths.** The hero angle again, but the three words stand apart, unbolted, a hand's width apart and 2° out of square: UP SIDE DOWN, the problem's own name. The cornerstone is the book; the steel bar is the Bootloader. | "The hyphens aren't decoration—they're the rhythm." [BL 795] then, after the join, "The pages are reference. The file is the operating system." [M 4497 · copy.ts:61] and "This is not a playbook. It is a constraint layer." [BL 213] · labels `SUSD Bootloader V16 · 35,445 words`, `Pre-orders open soon` | 48 frames, played on click |

### 3.8 The dramatic action: the bolt-in

In beat 6 (and from the hero's `Get the Bootloader`, which scrolls there), pressing the button
plays 48 frames (2 s): UP slides along X and DOWN along Y toward SIDE, each on its own axis; they
meet with a 4 mm bump; the two steel brackets drop from above and seat with a hard stop; a 3-frame,
4 mm camera shake on contact; the bolt heads turn. Scaling Upside Down has become Scaling
Up-Side-Down, and the email field appears on the floor under it. This is James's "It's not even a copy the prop it's just like a button click it. It's like really dramatic" [TASTE],
made from Michael's own hyphens.

### 3.9 AI-look risks and cures

| Risk | Cure |
|---|---|
| 3D type renders are a stock AI look (glossy clay letters floating on a gradient) | Heavy cast material with defects (bug holes, form-tie cones, chipped arrises, dust at the base), standing in a real room with a real window, real contact shadows, no floating, no bevel shine, no pastel. |
| It reads as last night's the-title option again | That option was a flat line of extruded CSS letters on cream. Here the words occupy three axes of a real room; DOWN visibly runs away from you. If the three-axis plan is not obvious in the hero still, the camera is wrong; fix it before anything else. |
| It reads as the rejected wooden blocks again | No blocks, no tabletop, no tower as the hero. The letters are the structure, at human scale, and the largest, brightest thing is a sentence. |
| Gallery-sculpture pretension | The room is a working space (saw-cut joints, a floor drain, scuffs), and the sentence is plain. |
| Rendered text goes soft | Hero rendered at 2×; the steel letters are geometry, so the denoiser keeps their edges; an HTML twin carries the text for selection, screen readers and SEO. |
| Perfect CG light and symmetry | Asymmetric L, rotated plinth, mullion shadows in the sun band, real lens shift, slight vignette and 0.3% barrel distortion from the camera, a little real render noise blended back in after denoising (no grain overlay). |
| The centred stack | No eyebrow, no sub, no meta row: title and audience are engraved on the cornerstone; actions sit on the floor as type. |

### 3.10 Blender plan

- **Geometry.** Text objects from `Formwork Cast` OTF, converted to mesh, extruded 0.36 m, 8 mm
  chamfer (1 segment). Cap height 1.2 m. UP = P on the plinth with U on top (2.4 m column). SIDE
  ≈ 3.1 m long, DOWN ≈ 4.4 m. Plinth 12 cm, L-shaped, rotated 35° about Z. Brackets: steel bar
  0.42 × 0.12 × 0.025 m and a 90° angle bracket, M20 bolt heads. Cornerstone 0.6 × 0.4 × 0.4 m with
  engraving cut 4 mm by boolean from `Formwork Plate` text. Room: back wall 12 × 5 m, left wall with
  a 0.9 × 8 m clerestory slot and two mullions, floor with 2 m saw-cut grid. Headline: 44+44
  characters of `Formwork Plate` text, solidified 8 mm, on 4 mm pins 25 mm off the wall (cap ≈ 0.38 m).
- **Materials (CC0).** Poly Haven `plastered_wall_04` (or `clay_plaster`) for the wall;
  `concrete_floor_02` for the floor; `concrete_wall_008` albedo/normal multiplied by the three oxide
  tints for the letters, plus Poly Haven `plywood` normal scaled to 150 mm boards at 0.25 strength
  for the board-form imprint (box projection, blend 0.2), pointiness-driven edge wear and a Voronoi
  bug-hole mask; ambientCG `Metal029` or Poly Haven `rusty_metal_02` (roughness at 30%) over a
  `#2A2724` metallic base for the steel.
- **Lighting.** Sun lamp, 0.5° angle, ~5200 K, through the slot geometry; world HDRI Poly Haven
  `small_empty_room_3` (or `photo_studio_loft_hall`) at low strength for the cool fill; one 5 m²
  area light camera-right as bounce. Light groups `sun` and `sky` for the hero, so the browser can
  sweep the sun in (light is additive, so the composite is physically correct).
- **Simulation.** Beat 2 only: rigid-body world, letters as convex-decomposed collision (or Mesh
  shape, margin 4 mm), concrete density, fixed seed, baked 120 sim frames, 60 kept. Beats 4 and 6 are
  keyframed (ease-out, 3-frame settle), no sim.
- **Frames and time.** Measured base: 1440 × 900 at 64 spp + OIDN = 75 s. Sequences at 1440 × 900,
  32 spp, adaptive 0.02, OIDN with albedo/normal ≈ 42 s/frame: beat 2 60 f (42 min), beat 3 40 f
  (28 min), beat 4 30 f (21 min), beat 6 48 f (34 min) = **178 frames, ~2 h 5 min**. Stills: hero
  2880 × 1800 at 96 spp with two light groups (~7 min), hero phone 780 × 1688 (~2 min), beat 5 at 2×
  (~5 min), five phone stills for beats 2-6 (~8 min). **Total ≈ 2 h 30 min.** Phone gets stills and
  crossfades, not sequences.
- **Proof first:** render the hero still alone (~7 min) and show James before any sequence.

### 3.11 What could make James say no, and the answer

- *“It's the title again.”* Show him the orbit (beat 3): the flat front view is literally the
  previous options, and the turn into depth is the new idea.
- *“I'm looking at the sculpture, not the text.”* Check the squint test on the hero: the sun band
  with the sentence must be the brightest region. If the structure wins, darken the room's fill by
  half a stop; never shrink the sentence.

---

## 4. his-images-2 · The Wrong Map

### 4.1 The image

A cut-plywood relief model of a founder's world, laid out by team size from 1 to 40+, on a walnut
base: a small knoll for one person, a rise for two or three, a low damp **Valley** at 4-7, a
broad, warmly lit **plateau at 8-12**, a clean edge at 12, a narrow ledge, a long sunken **Graveyard**
at 15-39, and a far peak in the haze at 40+. A **red thread is pulled dead straight** across all of
it from 1 to the far peak: the map everyone inherited. It sails over the plateau and over the
Graveyard, and its shadow breaks on every step of the real ground.

### 4.2 Why it is the book (image → idea → his words)

- **His picture:** "There are two kinds of growth. You inherited the wrong map." [BL 838]
  The two kinds, in his own table: Linear Growth, "Straight line upward" [BL 842]; Cyclical Growth, "Stacked cycles" [BL 843].
- **The thread is that map:** "The map most founders inherited assumes Linear Growth — a straight line upward." [BL 241]
  "That map was drawn for Bought-Scale companies with capital buffers." [BL 241]
  On Greiner: "Gave a ROADMAP. This framework gives a MAP." [BL 1100]
- **The ground is his terrain:** his section on the population is titled "The Harnish Data: The Terrain" [BL 1232],
  and his band table defines it: Solopreneur 1, Small Team 2-3, Valley 4-7, Team 8-12, Threshold
  13-14, Graveyard 15-39, Team of Teams 40+ [BL 71-77]. Distance on the model is team size; the
  shapes are his words for each band (a destination is a place to stand, the Valley is a
  transition, the Graveyard is a trap, Team of Teams is a far summit).
- **Location is the book's first move:** "How many people are on your team?" [BL 310]
  "This single question reveals location on the destination map, physics that apply, and what advice will fit vs. make things worse." [BL 314]
- **The places:** "Staying at one destination is an intelligent choice, not failure." [BL 1296]
  "These are not rungs on a ladder." [BL 1296] "12 isn't where you're trying to get. It's the line you don't cross." [BL 544]
  "The Graveyard is not a temporary problem. It's a structural trap." [BL 3451]
- **Why the straight line works for some and not for you:** funded companies fly it, "Bought-Scale physics — capital absorbs mistakes, vaults valleys" [BL 4616];
  you walk the ground, "You cycle through, not jump over." [BL 1326]
- **The haze:** his term for the chaos entry point is "The fog" [BL 4579].

**Dignity both ways.** The thread is not mocked: with capital it is a real route (his exit
"Raise capital (transition to bought-scale physics)" [BL 3460]), and his rule is to "Present both paths with equal dignity." [BL 3543]
So the far peak is rim-lit, not ominous; only the Graveyard is dark.

### 4.3 Five-second test

A stranger says: *“It's a book for founders with teams of up to twelve. It says the straight-line
growth map we were all handed is wrong: the real ground has a plateau at 8-12 you can live on, and
a graveyard past twelve. I can find where my team is, then get the free Bootloader file or
pre-order the book.”*

### 4.4 First screen, 1440 × 900

One rendered photograph (2880 × 1800 still), plus live HTML type in three places: the headline,
the question, the actions. The engraved labels and ruler are in the render.

```
 0 ┌──────────────────────────────────────────────────────────────────────────────────┐
   │  There are two kinds of growth.                           haze ░░░ far peak ▲ 40+ │
   │  You inherited the wrong map.                              ░░░░░░░░░░░░░╱       │
   │                                                     red thread, straight ╱          │
   │                        ┌──── TEAM 8–12 ────┐ edge at 12  ╱                        │
   │      ~ VALLEY 4–7 ~    │  warm, flat, lit   │▌░ THE GRAVEYARD 15–39 ░░░             │
   │   knolls 1 · 2–3       └────────────────────┘  (sunken, smoked ply)               │
   │ ●──────────────────────────────────── thread starts at a brass pin at 1           │
   │  How many people are on your team?   Count yourself.     The book · Pre-orders…  │
   │  [ 1 ][ 2–3 ][ 4–7 ][ 8–12 ][ 13–14 ][ 15–39 ][ 40+ ] ← engraved maple ruler      │
900└──────────────────────────────────────────────────────────────────────────────────┘
```

**The model (in the render).** Seen from low and to one side, running from the near bottom-left
(1 person) to the far top-right (40+), filling the frame edge to edge; no table visible.
- **Plateau, TEAM 8-12** (x≈420-1000, y≈380-560): the widest flat in the frame, pale maple top
  sheet in the warm key light. Laser-engraved along its long axis, following its edge the way a
  cartographer sets a region name: `TEAM 8–12` (cap ≈ 22 px) and beneath it, finer,
  "Leader + team. Still know everyone's name." [BL 1250] (≈ 15 px).
- **Edge at 12** (x≈1000): a clean vertical cliff, the plateau simply ends.
- **Graveyard** (x≈1000-1300, y≈420-600): a long trench cut below the base line in smoked, near-black
  ply, in shadow. Its label `THE GRAVEYARD 15–39` is engraved through the stain, so it reads pale on
  dark, as real laser engraving on stained wood does. No gravestones.
- **Valley** (x≈120-420, y≈520-720): a low basin with a thin satin varnish pooled in its floor, so
  it looks damp; `VALLEY 4–7`.
- **Solopreneur and Small Team** (bottom-left, x≈0-200): two small flat-topped knolls, slightly out
  of focus.
- **Far peak, TEAM OF TEAMS 40+** (x≈1150-1350, y≈90-260): taller than everything, soft, in haze,
  rim-lit.
- **The red thread:** waxed linen in the cover's red, pulled taut from a brass pin at the near
  bottom-left (x≈60, y≈820) to a brass pin on the far peak (x≈1290, y≈110), crossing the frame on one
  straight diagonal, ~40 mm above the plateau and high over the trench. Its thin shadow lands on the
  plateau, then drops in steps down the cliff into the Graveyard. **That broken shadow is the whole
  argument**: a straight line laid over ground it does not fit.

**The headline (live HTML, in the haze, y≈80-250).** "There are two kinds of growth." [BL 838] on line 1, "You inherited the wrong map." [BL 838] on line 2,
in `Survey Triplex` (4.6) at 64 px, graphite `#23262A` on the pale haze, upper left (x≈110-900).
Its baseline runs parallel to the thread, so the eye goes from the sentence along the thread to the
peak and down into the map. This is where a map's title goes; it is the largest type on the page.

**The question and the ruler (y≈760-880).** The model's near edge is a maple ruler strip, engraved
`1` `2–3` `4–7` `8–12` `13–14` `15–39` `40+`, each number sitting under its own terrain. Above it at
left, live HTML at 30 px `Survey Simplex`: "How many people are on your team?" [BL 310] with
"Count yourself." [BL 3390] beside it and the label `For bootstrapped founders` before it. The
engraved numbers are the buttons (HTML hit areas over the render, 44 px targets, visible focus
rings drawn as a brass outline).

**The actions (bottom right, above the ruler).** Type, no boxes:
`The book: Scaling Up-Side-Down, by Michael Wentz · Pre-orders open soon` and `Get the Bootloader`
with "This bootloader is built for Rented-Scale businesses with 1-12 employees." [BL 4252] and
`V16 · 35,445 words · free by email`. The book's title and author live in the book action itself.

**Light.** A long, low key (area light 0.5 × 2 m, 8-10° elevation, 4300 K) from camera-left, raking
across the contours so every 6 mm layer throws its own shadow line; a 5600 K rim behind the far peak
that makes the haze glow; a weak fill from Poly Haven `brown_photostudio_02`. Haze from the mist
pass, cool `#BFC6CB`.

**Lens.** 85 mm, camera 0.22 m above the base and 0.55 m in front of its near edge, pitched down
14°, f/4 focused on the plateau, so the near knolls and the far peak fall soft as in a real macro
photograph of a model.

**Palette.** Birch ply `#D9C4A0`, maple plateau `#E6D3B0`, laser char `#5A3B22`, smoked ply
`#2E2722`, pale engraving `#C9B596`, walnut `#3B2A1F`, thread `#A8352B`, brass `#B3925A`, haze
`#BFC6CB`, headline graphite `#23262A`. Later sections sit on walnut-black `#17130F` with text
`#EDE5D8`.

### 4.5 First screen, 390 × 844

Portrait suits a map: a separate portrait render (780 × 1688) looks **along** the model, so it
recedes up the screen: knolls at the bottom, Valley, the plateau in the middle third, the trench
above it, the peak in the haze at the top. The thread runs nearly vertically up the screen. The
headline sits in the haze at the top in four lines (`There are two` / `kinds of growth.` / `You inherited` /
`the wrong map.`, the two sentences of [BL 838] with line breaks only) at 34 px. The ruler becomes a
horizontal strip at the bottom that scrolls sideways under a fixed pin, with the question above it;
the two actions are two full-width rows of type below.

### 4.6 Type: `Survey` (custom, from public-domain engraving fonts)

**Idea:** the map is laser-engraved, and a laser follows a single line. The Hershey fonts were drawn
in 1967 by A. V. Hershey at the US Naval Weapons Laboratory as single-stroke paths for plotters and
engravers; they are public domain, and the npm package `hersheytext` 2.0.0 (MIT) carries them as
JSON. No AI-made site uses them.
- **One skeleton, two uses.** In Blender, the Hershey centre-lines become curve objects with a
  0.3 mm round bevel used as boolean cutters: the engraving in the render *is* the font's skeleton.
  On the web, the same centre-lines are stroked into outlines in Python (round joins, square caps),
  cleaned with skia-pathops, and compiled with fontmake.
- **Faces:** `Survey Simplex` (single-stroke sans, three pen widths: Fine for engraved labels, Book
  for the question and UI, Bold for actions) and `Survey Triplex` (Hershey's triple-stroke roman,
  stroked at Book weight) for the headline. They carry a 1960s plotter's slightly irregular
  geometry, which reads as drawn by an instrument, not chosen from a menu.
- **Cartographic setting, not tracked caps:** region names in letter-spaced capitals that follow
  the terrain (curved baselines along the plateau edge and the trench), engraved, never as a UI
  label strip.
- **Check in the type step:** Triplex legibility at 64 px and 34 px, and the specimen against
  Fraunces-style softness (it must look engineered, not cute). Fallback: Hershey Duplex.

### 4.7 Scroll beats

One continuous camera path (120 frames) runs along the model; scrolling scrubs it, so **scrolling
is hiring**: you walk from one person to forty.

| # | What happens physically | Words on screen (verbatim) | Render |
|---|---|---|---|
| 1 | **Hero.** On load, the haze clears from near to far (mist pass composited live), last over the plateau; the headline settles into the remaining haze. | "There are two kinds of growth. You inherited the wrong map." [BL 838] · "How many people are on your team?" [BL 310] | still + mist pass |
| 2 | **The inherited line.** The camera drops to the near end and looks up the thread, which rises straight to the hazed peak over everything. | "The map most founders inherited assumes Linear Growth — a straight line upward." [BL 241] "That map was drawn for Bought-Scale companies with capital buffers." [BL 241] | dolly frames 0-25 |
| 3 | **The Valley.** The camera moves down into the damp basin; the light dims; a counter reads `4 people · 6 pathways` → `7 people · 21 pathways` (his table, BL 5112-5130). A 2 mm brass wire, bent in three straight legs per turn (up, across, back into depth), climbs out of the basin onto the plateau, each turn higher; the legs carry small painted bands in the cover's green, ochre and red. | "Every hire compounds complexity before it compounds capacity." [M 696 · copy.ts:60] then "You cycle through, not jump over." [BL 1326] and "Up. Side. Down. Repeat." [M 1713 · copy.ts:125] | dolly frames 25-55 |
| 4 | **The plateau.** The camera follows the wire up onto the warm, flat maple. Room to stand; `8 people · 28 pathways`. | "Staying at one destination is an intelligent choice, not failure." [BL 3420] · "Where most beautiful bootstrapped businesses live." [BL 2215] | dolly frames 55-85 |
| 5 | **The edge.** The camera reaches 12 and looks over: the cliff, the long dark trench, the thread's shadow falling into it; `13 people · 78 pathways` at the ledge, `15 · 105` in the trench. | "12 isn't where you're trying to get. It's the line you don't cross." [BL 544] then "The Graveyard is not a temporary problem. It's a structural trap." [BL 3451] | dolly frames 85-110 |
| 6 | **Two paths.** The camera lifts back over the whole model; your pin stands where you put it. | "The pages are reference. The file is the operating system." [M 4497 · copy.ts:61] · "Then let the system locate you." [M 4533 · copy.ts:151] · labels `Get the Bootloader`, `V16 · 35,445 words`, `The book · Pre-orders open soon` | dolly frames 110-120 + hero still |

### 4.8 The dramatic action: drop your pin

Click a number on the engraved ruler (or answer on the phone strip). A brass map pin with a small
paper flag falls into that band and bites into the ply (12 pre-rendered frames for that band); the
haze lifts over that stretch of ground; then the camera walks the model to stand at your pin
(the dolly scrubs to that band's frame in ~1.5 s), and the page answers in Michael's words for
your band:

| Band | His words |
|---|---|
| 1 | "Maximum leverage, minimum resilience. You are the business." [BL 3412] |
| 2-3 | "Leader + helpers. Coordination still manageable." [BL 3413] |
| 4-7 | "Transition zone between Small Team and Team. Not a destination." [BL 3414] |
| 8-12 | "Leader + team. Still know everyone's name." [BL 1250] |
| 13-14 | "At 13-14 employees, next hire is a phase change, not incremental growth." [BL 3450] |
| 15-39 | "The Graveyard is not a temporary problem. It's a structural trap." [BL 3451] |
| 40+ | "Different physics apply." [BL 77] |

Under the answer: `Get the Bootloader`, with "Then let the system locate you." [M 4533 · copy.ts:151]
The pin is the book's own Step 0 made physical; the file is what does it for your business.

### 4.9 AI-look risks and cures

| Risk | Cure |
|---|---|
| Topographic contour lines are a trendy, AI-default graphic | No contour graphics anywhere in the UI; contours exist only as physical ply layers, seen through raking light. |
| Terrain + markers reads as a game map | No figurines, flags with icons, glowing paths or hover halos. One thread, one wire, one pin, all real materials (fibre, brass, paper). |
| Too much going on | The hero shows only four engraved labels; the others appear as the camera passes. Three text zones only: headline, question + ruler, actions. |
| Fog as generic “atmosphere” | Haze only from the mist pass, subtle, as the air in a room around a model; it lifts once, on purpose. |
| The model looks CG-clean | Visible ply laminations on every cut edge, brown laser char, a little glue squeeze-out, the top sheet slightly warped, fibre fuzz on the thread, patina on the brass, f/4 depth of field. |
| Left-aligned headline over a picture (James's complaint) | The headline is the largest element, sits alone in the empty haze, and points along the thread into the map; the map's labels are engraved in it, not set beside it. |

### 4.10 Blender plan

- **Geometry.** A height profile h(n) by team size, mapped to distance x (metres along a 1.6 m
  model): n=1 at 0.06 (knoll, 5 layers), 2-3 at 0.16-0.26 (rise, 7 layers), 4-7 at 0.32-0.56
  (basin, 2 layers), 8-12 at 0.62-0.92 (plateau, 12 layers, flat), edge at 0.95, 13-14 at 0.97-1.07
  (ledge, 8 layers), 15-39 at 1.10-1.40 (trench cut 12 mm into the base), 40+ at 1.48-1.58 (peak, 22
  layers). Gentle noise across the 0.6 m width. Layers are 4 mm ply. Contours come from a ~40-line
  numpy marching-squares routine (matplotlib, scikit-image and scipy are not installed), smoothed
  with Chaikin, imported as filled 2D curves and extruded per layer. Walnut base 30 mm. Thread: a
  straight curve, 0.5 mm bevel. Brass wire: 2 mm curve with three turns of right-angle legs (up
  18 mm, across 40 mm, back 25 mm). Pin: 6 mm domed head, 1 mm shaft, paper flag.
- **Materials (CC0).** Poly Haven `plywood` for faces; a procedural lamination stripe (0.6 mm veneers)
  and char gradient on cut edges; `oak_veneer_01` lightened for the maple plateau; plywood × 0.25 value
  for the smoked Graveyard ply; `black_walnut_veneer_02` for the base; brass as metallic `#B5935A`,
  roughness 0.3 with `rusty_metal_02` roughness at 15% for patina; thread with sheen 0.4 and a wave
  texture along the curve for the twist; satin varnish in the Valley (clearcoat 0.6, roughness 0.15).
- **Lighting.** Low area key 0.5 × 2 m at 8-10°, 4300 K; rim 5600 K behind the peak; HDRI
  `brown_photostudio_02` fill at 0.25. Mist pass start 0.4 m, depth 1.4 m, quadratic.
- **Simulation.** None. The pin drop is keyframed (fall, 1-frame bite, 2-frame settle).
- **Frames and time.** Dolly 120 frames at 1440 × 900, 32 spp + OIDN, DOF on ≈ 45 s/frame
  (**~90 min**), with the mist pass saved per frame as an 8-bit image for the live haze. Pin drops:
  7 bands × 12 frames as region renders (~400 × 500 px, film transparent over a shadow catcher,
  ~6 s each, **~9 min**). Stills: hero 2880 × 1800 at 96 spp (~8 min), hero phone 780 × 1688
  (~2 min), seven phone band stills (~11 min). **Total ≈ 2 h.**
- **Proof first:** the hero still alone (~8 min), with the thread's broken shadow checked at 100%.

### 4.11 What could make James say no, and the answer

- *“Too much going on.”* Cut the hero to four labels and the thread. If it still feels busy, remove
  the Valley label too; the plateau and the trench carry the story.
- *“It looks like a game.”* Show the 100% crop of a cut edge (laminations, char). If the materials
  do not convince at 100%, the concept is not ready.

---

## 5. Side by side

| | All Three Dimensions | The Wrong Map |
|---|---|---|
| The sentence a stranger reads first | "You can't build a building with only height." [BL 816] | "There are two kinds of growth." [BL 838] |
| How the eye is led to it | Real sunlight falls only on the sentence | The sentence sits alone in the haze, and the thread points from it into the map |
| Who it is for | Engraved on the cornerstone | The team-size ruler, the question, the TEAM 8-12 plateau |
| Up, Side, Down | The whole image | Beat 3 (the brass wire of stacked cycles) |
| Relief | "You were never the problem. The model you inherited was." [M 216 · copy.ts:196] | "Staying at one destination is an intelligent choice, not failure." [BL 3420] |
| Scale and feel | Human scale, architecture, concrete and steel | Tabletop scale, a hand-made model, ply and brass |

They are deliberately different: one makes the **title** physical and explains the cycle; the other
makes the **reader's location** physical and explains the trap. Render both heroes first (about 15
minutes together) and let James pick from the two stills before any sequence is rendered.

## 6. Quote check

Every straight-quoted line above was checked against its cited line with
`python3 susd-render/tools/check_meaning_quotes.py susd-render/docs/concepts/his-images.md`.
Lines deliberately **not** used: "The valley extracts before it rewards" [BL 3537] is about crossing
to Team of Teams, not the 4-7 Valley, so it would mislabel the basin; “The cycle isn't something you
install…” is in neither source.

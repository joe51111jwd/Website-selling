# Idea 4, Only Height: the visuals

For James: three pictures of what the homepage would look like if we build Only Height (entry 4 in
`docs/09-IDEAS-AND-REFERENCES.md`). Each one is a Blender render with the page's HTML laid over it and
screenshotted in Chromium.

| # | File | Size |
|---|---|---|
| 1 | `visuals/1-first-screen-desktop.jpg` | 1440x900, 125 KB |
| 2 | `visuals/2-key-beat-desktop.jpg` | 1440x900, 124 KB |
| 3 | `visuals/3-first-screen-phone.jpg` | 780x1688 (iPhone, 390x844 at 2x), 130 KB |

## What each image shows

**The picture.** An architect's model of a slim office tower, photographed on a workbench at blue hour.
The room lights are off. Behind the bench, a tall window shows the dusk sky over dark rooftops, and the
tower stands against it. The only warm light comes from inside the model. Each floor is one person. Each
lit window is one pathway between two people. The tower has six windows a floor (four on the front, two
on the side) and stands on a grey card plot it barely uses, on a plywood baseboard, with a steel rule
left on the base.

**1. First screen, desktop.** The team is 8 people, so the tower has 8 floors, 48 windows and 28 of them
lit, scattered the way an office looks at dusk. The type sits on the dark wall to the left of the window:
the title lockup, Michael's line set large, who the book is for, and the Bootloader with one drawn button.
A readout beside the tower says "8 people, 8 floors, 28 lit windows", and the cue at the foot says what the
windows mean.

**2. Key beat, desktop.** The same locked camera, 13 people later. 13 floors, 78 windows, and every one is
lit: the facade is solid with light. The tower leans 6.5° under it. The corner nearest the camera on the
right has crushed 4 mm into the plot (flakes of card prised up, crumbs of board), and the far corner has
lifted clear of the plot. On the page: "Past twelve, something breaks." large, the next line under it,
the readout "13 people, 78 pathways / 78 windows, every one lit", the Bootloader, and a cue for the next
beat.

**3. First screen, phone.** The same model and the same moment as image 1, shot in portrait. The tower
fills the middle. The headline sits over the dark wall and the sky, the readout points at the tower, and
the Bootloader and the book link sit on the dark bench at the bottom.

## Michael's lines (word for word)

| Image | Line | Source |
|---|---|---|
| 1, 3 | "You can't build a building with only height. You need all three dimensions or it topples." | Bootloader L816 (01-MEANING: his best single line) |
| 2 | "Past twelve, something breaks." | manuscript L3509, `src_copy.ts:88` |
| 2 | "Complexity that accumulated faster than the structure could hold." | manuscript L2021, `src_copy.ts:96` |

`node susd-options/tools/copycheck.mjs` on the three mock pages: **4 sentences checked, 0 not found**.

Everything else is a label or a button (marked `// label` in the HTML): the title, "A book by Michael
Wentz", "The book: pre-orders open soon", "For bootstrapped, self-funded founders with teams of 1–12"
(fit table, BL 4773 and BL 4775; on the phone it is shortened to "For bootstrapped founders with teams of
1–12" so it clears the antenna), "SUSD Bootloader", "A free file for your AI. It tells you which building
you are in." (the 09 entry's own Bootloader line; outcome from BL 314), "Version 16, 35,445 words. Works
with Claude, ChatGPT and Gemini." (BL 221; the word count is from the brief), "Get it free", the readouts,
"Each floor is one person. Each lit window is one pathway between two of them. Scroll to hire." and "Next:
the same plot, rebuilt wider, with a core." The model itself carries no words. The steel rule has its
engraved numbers, as a rule does.

## What is real and what is a stand-in

The 09 entry gives two ways to make this: "A Blender facade whose window lights switch from a table" or
"a physical model photographed (2 to 3 weeks and a model maker)". These images are a Blender stand-in for
the second, the photographed model, because a photograph of a real model is what cannot look AI-made. It
is built the way the model maker would build it:
- **Floors** are separate modules of grey board strips (spandrel band, piers, a slim mullion in each
  window), stacked by hand. Each sits up to 0.6 mm and 0.45° off the one below.
- **Windows** are shallow room cells behind a clear acrylic sheet: white card floor, ceiling and
  partitions, and a tracing-paper diffuser over an LED on the back wall. Lit windows vary in brightness
  and colour (2400 to 3400 K), the way real LEDs and real offices do. The corner rooms have two windows.
- **Which windows are lit comes from a table**: each window has a fixed random rank, and for n people the
  n(n−1)/2 lowest-ranked windows on the n floors that exist are lit. It only ever adds lights as the team
  grows, so the scroll could be shot frame by frame on a locked camera.
- **The plot and base**: grey card on 18 mm plywood. The pencil set-out on the plot and the rule's
  engraving are drawn by `make_tex.py` (nothing generated).
- **The real shoot would add** real paper fibres and glue at 100%, a real window and sky, and the small
  accidents of a hand-made model. If James picks this idea, build the model and photograph it. The
  Blender version is close at page size, but at 100% the board edges are cleaner than real card.

Nothing in the images is AI-generated and nothing is a stock photo.

## Our calls (check with Michael)

- **Six windows a floor, so the break lands at thirteen.** Pathways n(n−1)/2 and windows 6n are equal at
  n = 13. Up to twelve people there is a dark window left for every pathway. At thirteen the last one
  lights and there is no room for the next. Michael gives the pathway sum and "Past twelve, something
  breaks."; this way of drawing them meeting is ours.
- **One floor per person.** The 09 entry says "Each hire adds a floor". So the first screen at 8 people
  is 8 floors (the core reader, "Leader + team. Still know everyone's name.", BL 1250).
- **The tower fails at the foot, not for being tall.** It leans because the corner under the load has
  crushed into the plot (01-MEANING, misreading 15). At page size the crush is subtle: the camera sits low,
  so the plot is seen at about 5°. The lean, the lifted far corner and the crumbs carry it.
- **Blue hour, looking east.** The dusk sky is a measured gradient (earth-shadow slate on the horizon,
  deeper blue above). Blender's Nishita sky was tried first. With the sun below the horizon it only goes
  brown, never blue (`tests/t02`, `t04`).
- Not shown in these three images: the rebuild (wider base and a core for Side, lights going out on waste
  for Down, never floors removed) and the lit door as the Bootloader button. Both are in the 09 entry.

## Checks run on the final screenshots

- **Squint test** (02-AI-TELLS checklist 1), `mock/squint.py`, the same measure as Redline: blur
  (sigma 12 CSS px), then compare the brightest point in Michael's line with the brightest point anywhere
  else. All three pass:

  | Image | Michael's line | Brightest elsewhere |
  |---|---|---|
  | 1 first screen, desktop | 115 | 110 (the sky in the window) |
  | 2 key beat, desktop | 145 | 118 (the readout label) |
  | 3 first screen, phone | 169 | 148 (the title lockup) |

- **What failed on the way.** With the LEDs at 2.2 the lit windows were near white and beat the line on
  all three (140, 153 and 210 against 111, 145 and 169). Real dusk photographs exposed for the sky show
  office windows amber, not white. So the LEDs are now at 0.5 and warmer (2400 to 3400 K), with no change to
  the sky or the exposure. That is also the better photograph: you can see into the lit rooms. The desktop
  line was then raised from 58 to 63 px to clear the sky by a margin.
- Fonts on every image: Plimsoll, Ortica Angular or Linear, B612 only. No tracked capitals in the HTML, no
  `·`, no gradient, shadow, glow, pill or card. One button per screen.
- Text boxes: none overlaps another and none is clipped (`mock/shoot.cjs` prints every box). On the phone,
  "1–12" first touched the antenna tip; the shortened label fixed it.

## Render settings and times

Blender 4.5, Cycles on CPU (4 cores), OIDN (albedo + normal, prefilter Accurate), adaptive threshold 0.02,
AgX Medium High Contrast, exposure +0.8. Light paths: diffuse 3, glossy 3, transmission 4, clamp indirect 6.
- **Camera**: 85 mm full-frame equivalent at f/4, level, with lens shift for true verticals, focused on the
  tower's front corner. Desktop: 3.3 m from the tower at 0.32 m above the bench (frame 1.40 m wide at the
  tower). Phone: portrait, 2.6 m, same height.
- **Light**: the blue-hour sky through the window behind the bench (a portal over the opening, strength
  0.7). The model's own window LEDs (strength 0.5). A white bounce card off to the camera's left
  (a 1 m area light, 12 W, 8000 K), as a model photographer would set one. Nothing else.
- **Finish**: `lib_lookdev.post` with grain 0.07, vignette 0.20, lateral colour 0.003, glare 0.12.

| Final (`out/ideas/04-only-height/`) | Size | Samples | Seconds |
|---|---|---|---|
| `height_first_desktop.png` | 1440x900 | 28 | 79.7 |
| `height_key_desktop.png` | 1440x900 | 28 | 78.7 |
| `height_first_phone.png` | 780x1688 | 20 | 107.0 (another render started during it and shared the CPU for 108 s, so this time is not clean; the earlier clean run of the same frame took 56.7 s) |

All 33 renders for this idea, tests and both rounds of finals, took 793.5 s (13.2 minutes), a little over
the 10 to 12 minute budget. The second round of finals (the amber windows) was the overrun. Every render
went through `tools/render_idle.py` and is logged in `lookdev/renders.jsonl`.

To reproduce (from `susd-render/`):

```
python3 ideas/04-only-height/make_tex.py
python3 tools/render_idle.py blender -b -P ideas/04-only-height/scene.py -- --state first --camera desktop --w 1440 --h 900 --samples 28 --out out/ideas/04-only-height/height_first_desktop.png
python3 tools/render_idle.py blender -b -P ideas/04-only-height/scene.py -- --state key --camera desktop --w 1440 --h 900 --samples 28 --out out/ideas/04-only-height/height_key_desktop.png
python3 tools/render_idle.py blender -b -P ideas/04-only-height/scene.py -- --state first --camera phone --w 780 --h 1688 --samples 20 --out out/ideas/04-only-height/height_first_phone.png
node ideas/04-only-height/mock/shoot.cjs && python3 ideas/04-only-height/mock/squint.py && python3 ideas/04-only-height/mock/export.py
node ../susd-options/tools/copycheck.mjs ideas/04-only-height/mock/*.html
```

Test renders are in `tests/` (t01 to t13; `t*_sheet.png` puts each round side by side).

## Assets and licences

| Asset | Used for | Source | Licence |
|---|---|---|---|
| `wood_table_worn` (Poly Haven, 2k) | the workbench | https://polyhaven.com/a/wood_table_worn, fetched for this idea | CC0 |
| `painted_plaster_wall` (Poly Haven, 2k) | the studio walls (tinted dark slate) | already in `assets/polyhaven/` | CC0 |
| `plywood` (Poly Haven, 2k) | fetched for the baseboard edge, then not used (a procedural ply stripe reads better at this size) | https://polyhaven.com/a/plywood | CC0 |
| B612 Regular | the numbers engraved on the steel rule (`tex/rule.png`) | `docs/type/system/`, OFL 1.1 | OFL |
| Plimsoll, Ortica, B612 (web fonts) | the site layer | `mock/fonts/` | ours / OFL |

Both new textures are logged in `assets/polyhaven/SOURCES.tsv`. The sky is a procedural gradient (no
HDRI). The board, card, acrylic, brass and plywood-edge materials are procedural. The pencil set-out
and the rule's engraving are drawn by `make_tex.py`.

## Review (art director and stranger, 2 Nov)

I looked at all three images at full size and at the size an iPhone shows them, as James would, and as a
bootstrapped founder who has never heard of the book. The images before this review are kept in
`visuals/_before_review/`.

### 1. Real or fake

**Not AI-made.** Nothing is mushy, melted or impossibly detailed, and there is no stock look. **But before
this review the desktop pair read as a 3D render, not as a photographed model.** The tells, worst first:

1. **The tower was black, not grey board.** `--board 0.20` is an sRGB value, and `card_mat` turns it into 0.033
   linear (pitfall 6 in `05-RENDER-PIPELINE.md`, the tide-stain trap again). The body measured RGB 2 to 3, and
   it stayed black even with the render brightened 3x. The spandrel bands, piers, the hand-set offsets between
   floors, the lobby columns and door, and the roof plant were all built and all invisible. So the most
   "made by hand" part of the scene read as a black CG block with lit rectangles in it.
   **Fixed on the phone** (the one re-render, below), **still black on both desktop images.**
2. **Everything around the model is too clean.** The plot card and baseboard are perfect slabs with crisp
   edges. At page size the pencil set-out does not show, the steel rule is a dark line, and the bench is empty.
   A clean set is normal for model photography, so this costs less than item 1.
3. **The window reads as a backdrop.** The sky is a smooth hand-set gradient with even grain, and the rooftops
   sit below the sill, so all you see is colour. The depth of field covers most of this.
4. **About 70% of each desktop frame is near black** (the wall measures 18 to 23 out of 255). It is moody, but
   the darkness hides the materials that would make it believable. On a phone in daylight the desktop frames
   will look murky.

**What already works:** the lit rooms. They are warm, they vary from 2400 to 3400 K, and you can see the
partitions inside them. Also the shallow focus, the true verticals, the plywood edge and the lean. The type
layer has no AI tells: three fonts, one drawn button, no pill, no gradient, no glow.

### 2. Five-second test (a founder who has never heard of the book)

- **Desktop 1:** "A book by Michael Wentz about building a company without only getting taller. It is for
  bootstrapped founders with 1 to 12 people. The free thing is a file for my AI. Get it free." That is right.
  What the picture means (one floor per person, one window per pathway) was only said in a 13 px line at the
  foot of the page, where nobody looks in five seconds. **Moved next to the tower.**
- **Key beat:** this works without words. You see a tower stuffed with light and leaning. The readout gives the
  count. **The crushed foot does not show at page size**, because the foot was black against a dark plot. So
  the cause reads as "tall, so it tips" more than "the foot gave way under the load", which is the 09 entry's
  main risk. Grey board would show the foot. A camera a little higher or closer for this beat would too.
- **Phone:** the line, the model, then "8 people, 28 lit windows". Clear enough for a first screen.

### 3. The Bootloader click and the type

- Each screen has one button, drawn, next to the Bootloader's name, and nothing else on the page looks
  pressable. So it is the obvious click. It is small next to a line set at 63 to 92 px, but that is by design
  (the squint test).
- **The phone had no reason to click,** only "A free file for your AI". **Added** "It tells you which building
  you are in.", the same label as on desktop (Redline's review made the same fix).
- **Two lines were too faint to read:**
  - The phone's "For bootstrapped founders with teams of 1–12" crosses the sky, where the dim grey was
    **2.8:1**. It is now cream, **5.1:1**.
  - The key beat's second readout line "78 windows, every one lit" sat on the sky at **2.65:1**. The readout
    has moved down onto the dark band under the sill, the same band as on the first screen, and is now
    **9.5:1**.
- No text box overlaps another, none is clipped, and nothing sits over the tower (`shoot.cjs`).

### 4. Copy

`copycheck.mjs` on the three pages: **4 sentences checked, 0 not found.** Every other line is marked
`// label`. The legend and "It tells you which building you are in." are our words, as before: the legend has
only moved, and the second is the 09 entry's Bootloader line, kept as a label on the same terms as Redline's
"It finds where your team stands."

### What I changed

| What | Before | After |
|---|---|---|
| Phone render (`height_first_phone.png`): the one re-render | board 0.20 sRGB, black tower | `--board 0.48`, grey board you can see the modules in. Everything else is the same (20 samples, 60.0 s clean). See `tests/t14_review_board_sheet.png`, before on the left and after on the right |
| `scene.py` default `board` | 0.20 | 0.48, with a comment, so the next desktop renders get grey board without a flag |
| Desktop 1 legend | 13 px line at the foot | under the readout beside the tower, on the dark band (9.5:1). The foot keeps "Scroll to hire." |
| Key beat readout | on the sky at (1118, 318), dim line 2.65:1 | on the dark band at (1080, 480), 9.5:1 |
| Phone "who" line | dim, 2.8:1 over the sky | cream, 5.1:1 |
| Phone Bootloader | "A free file for your AI" | "A free file for your AI." then "It tells you which building you are in." The block moved up 10 px to make room for the line, and the book link stays where it was |

Squint test after the changes, all pass: 115 vs 110 (the sky), 145 vs 110, 169 vs 151 (a lit window). The
JPEGs are 126, 125 and 138 KB.

Render time for this review: test t14 (the phone camera cropped to the tower, 8 samples) 8.8 s, and the phone
final 60.0 s, both through `render_idle.py` with no CPU sharing. **The idea's total is now 862.3 s
(14.4 minutes)**, over the 10 to 12 minute budget.

### Still open

- **The three images no longer match.** The phone has the grey board and the desktop pair is still black. To
  make them match, re-render both desktop finals with the commands above (`board` is now 0.48 by default),
  about 80 s each, then run `shoot.cjs`, `squint.py` and `export.py` again. Check the squint test on the key
  beat, because a grey facade next to 78 lit windows is brighter than a black one.
- The crushed foot needs the grey board (to show the corner) and probably a camera 5 to 10 cm higher for the
  key beat, so the plot is seen at more than 5°.
- The scene is still too clean (plot, base, bench), and the sky is a backdrop.
- The rebuild beats (wider base and a core, lights going out on waste) and the lit door as the button are not
  shown. They are the half of the idea that sells the Bootloader.
- Six windows a floor, so the break lands at 13, is our idea, not Michael's. Check it with him.

### Verdict for James

- **Shows the idea: 7/10.** The first screen and the key beat make the point: one floor per person, a window
  for every pathway, and at 13 the tower is full of light and leaning. The answer is not shown yet (the
  rebuild, wider and with a core).
- **Looks real: 6/10.** The phone now looks like a photographed grey-board model (about 7). The desktop pair
  looks like a good 3D render of a black tower (about 5) until it is re-rendered. Nothing looks AI-made.
- **Caption:** A computer mock-up of an architect's model on a workbench at dusk. Each floor is one person and
  each lit window is one pathway between two people. At 13 people every window is lit and the tower leans.
- **What the real production needs:** a model maker for 2 to 3 weeks. The model is greyboard floor modules
  (13 or more) over acrylic, with an LED and tracing paper behind each of 78 windows, wired so that any set can
  be switched from the table. It also needs a hinged foot so the tower can lean into a real crushed plot card,
  and a second, wider building with a core and a door that lights. Then a photographer for one blue-hour
  session in a real room with a real window: a locked camera, one frame for each team size and each rebuild
  step, and a second portrait set for phones. If the Blender route stays, the next round needs grey board on
  the desktop pair, a dirtier base, a real dusk HDRI or a photographed backplate for the window, and a closer
  look at the foot.

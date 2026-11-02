# Idea 1, Redline: the visuals

For James: three pictures of what the homepage would look like if we build Redline (entry 1 in
`docs/09-IDEAS-AND-REFERENCES.md`). Each one is a Blender render of the panel with the page's HTML laid
over it and screenshotted in Chromium.

| # | File | Size |
|---|---|---|
| 1 | `visuals/1-first-screen-desktop.jpg` | 1440x900 |
| 2 | `visuals/2-key-beat-desktop.jpg` | 1440x900 |
| 3 | `visuals/3-first-screen-phone.jpg` | 780x1688 (iPhone, 390x844 at 2x) |

## What each image shows

**1. First screen, desktop.** A close photograph of a worn engine-room instrument panel: dark grey-green
painted steel, two flange-mounted gauges under glass, engraved label plates (COORDINATION, CAPACITY).
Late-morning sun comes through a window to the left. The window's frame keeps the upper left of the
panel in soft shade, and that is where the type sits. The team is 8 people. The left needle reads 28
pathways and the right one reads 8 people. The left dial is printed in pathways: one long tick per
hire at 0, 1, 3, 6, 10 ... 66, 78 ... 120, so the gaps get wider as you read round. A small inner ring
numbers the people (1, 4 ... 16), and the band is red from 72, between the 12th and 13th person.
The right dial is linear in people, 0 to 22.
On the page: the title lockup, Michael's sentence set large, who the book is for, a readout label
pointing at the gauge, the Bootloader with one drawn button, and a scroll cue.

**2. Key beat, desktop.** The page cuts hard to a locked close-up of the pathways gauge at 13 people.
The needle is in the red at 78 and trembling: real motion blur from the shutter, as a needle at its
limit does. On the page: Michael's equation stacked like a sum, his next sentence, the readout, and
the Bootloader.

**3. First screen, phone.** The same panel and the same moment as image 1, framed for an iPhone. The left
gauge fills the middle band, and the right gauge is cut by the edge of the frame. The type sits above
the gauge and the Bootloader below it, with the book link under that.

## Michael's lines (word for word)

| Image | Line | Source |
|---|---|---|
| 1, 3 | "Every hire compounds complexity before it compounds capacity." | manuscript L696, `src_copy.ts:60` |
| 2 | "Complexity > Capacity = Redline." | manuscript L2997, `src_copy.ts:80` |
| 2 | "Every addition makes it worse." | manuscript L2997, `src_copy.ts:81` (also BL 717) |

Everything else on the images is a label or a button (marked `// label` in the HTML): the title, "A book by
Michael Wentz", "The book: pre-orders open soon", "For bootstrapped, self-funded founders with teams of
1–12" (from the fit table, BL 4773 and BL 4775, as in the Waterline mocks), "8 people, 28 pathways",
"13 people, 78 pathways", "SUSD Bootloader", "A free file for your AI. It finds where your team stands."
(outcome from BL 314), "Version 16, 35,445 words. Works with Claude, ChatGPT and Gemini." (BL 747, BL 221;
the word count is from the brief), "Get it free", "Scroll to hire. Each step is one more person."
The printed dials and plates carry only units and numbers (PATHWAYS, PEOPLE, n(n−1)/2, COORDINATION,
CAPACITY).

`node susd-options/tools/copycheck.mjs` on the three mock pages: **3 sentences checked, 0 not found**.
(The equation has only three words, so the checker skips it; it is verbatim from `src_copy.ts:80`.)

## What is real and what is a stand-in

The 09 entry says this would be made for real: "Buy a real used gauge ($50 to $150), print our own dial
faces, shoot each needle position on a locked camera." These images are a Blender stand-in for that
shoot, built the same way:
- **Dial faces** are printed artwork (`make_dials.py`, drawn in B612 and lightly aged). They are the files we
  would send to a printer and fit into a used gauge.
- **Needles** are separate objects turned by code to each team size, as the shoot would move a real
  needle with the camera locked off.
- **The panel, bezels, glass, screws and plates** are modelled. The panel paint is a scanned CC0 texture.
  Nothing in the images is AI-generated and nothing is a stock photo.
- **What the real shoot would add:** real dust and fingerprints on the glass, real paint chips, and the
  light of a real window. The Blender version is close, but a photograph of an actual gauge is what
  would make it unarguable. If James picks this idea, shoot it.

## Our calls (check with Michael)

- **The capacity calibration.** The two dials are scaled so the needles point the same way at twelve
  (66 pathways against about 12 people). Before twelve capacity leads, and after it complexity does.
  Michael gives the pathway sum and the 12-person ceiling. The pairing of the two scales is ours.
- **The red starts at 72**, between the 12th and 13th hire, so that 13 people (78) sits clearly inside
  it. The 09 entry said "red from 78". At 78 exactly, the needle would sit on the edge.
- **The cut to a close-up** at the key beat. The first screen is the panel at rest; the redline moment
  cuts in on the one gauge. It is a hard cut, like film (02-AI-TELLS B19), not a zoom.
- The gear-shift reading of the cycle (from the 09 entry) is not shown in these three images. It is still ours, not
  Michael's.

## Checks run on the final screenshots

- **Squint test** (02-AI-TELLS checklist 1). `mock/squint.py` here uses the same measure as the Waterline's
  `susd-render/mock/squint.py`: blur the screenshot (sigma 12 CSS px), then compare the brightest point inside
  Michael's line with the brightest point anywhere else. All three pass:

  | Image | Michael's line | Brightest elsewhere |
  |---|---|---|
  | 1 first screen, desktop | 133 | 114 (sunlit dial centre) |
  | 2 key beat, desktop | 151 | 135 (the gauge's sunlit lip) |
  | 3 first screen, phone | 184 | 163 (the Bootloader's name) |

- Two things failed it on the way and were fixed. A filled cream "Get it free" button blurred to 208
  against the sentence's 131, so the button is now drawn as an outline and fills only on hover, as in the
  Waterline round. Then the sun on semi-gloss bezels and a white needle counterweight beat the line, so
  the bezels are now matte wrinkle-finish black (as instrument bezels are), the counterweight is black,
  and the needle paint is an aged off-white.
- Fonts on every image: Plimsoll, Ortica Angular or Linear, B612 only. No tracked capitals in the HTML, no
  `·`, no gradient, shadow, glow, pill or card. One button per screen.
- Text boxes: none overlaps another and none is clipped (`mock/shoot.cjs` prints every box).

## Render settings and times

Blender 4.5.15, Cycles on CPU (4 cores), OIDN (albedo + normal, prefilter Accurate), adaptive threshold
0.02, AgX Medium High Contrast, exposure +0.35. The lens is 85 mm full-frame equivalent at f/5.6, focused on
the left gauge's glass, with the camera yawed 16° to the right and the verticals true. Frame width at the panel:
0.70 m (desktop), 0.42 m (close-up) and 0.29 m (phone). Light: one sun at elevation 34° from the front
left (azimuth 218°, disc 7°, strength 7.5). The window's jamb and head are shadow-only blockers 0.9 m in front of the
panel (camera and reflections never see them), and the HDRI `empty_warehouse_01` at 0.9, rotated 290°, gives the
room fill and the glass reflection. Finishing comes from `lib_lookdev.post`: grain 0.07, vignette 0.20, lateral
colour 0.003, glare 0.10. The key beat has real motion blur: the needle swings ±1.1° over a two-frame
shutter.

| Final (`out/ideas/01-redline/`) | Size | Samples | Seconds |
|---|---|---|---|
| `redline_first_desktop.png` | 1440x900 | 24 | 84.8 |
| `redline_key_desktop.png` | 1440x900 | 24 | 90.5 |
| `redline_first_phone.png` | 780x1688 | 18 | 58.5 |

Render time in total: **14.6 min**. That is 28 tests at 640x400 (8 to 16 samples) plus 100% border
crops (6.3 min), the first set of finals at 28/28/20 samples (4.4 min, replaced) and the finals above
(3.9 min). This is over the 10 to 12 minute budget, because the first finals failed the squint test and
had to be rendered again.

Every run went through `tools/render_idle.py`. All six finals ran alone (`cpu_shared_s` 0). Six of the
28 tests (t07, t09 x2, t11_h20, t12_phone, t14) overlapped another agent's render anyway: two agents
waiting in the queue can see the CPU free at the same moment and start together. Every run is logged in
`lookdev/renders.jsonl` with its exact arguments.

## Files

- `scene.py`: the scene (`--state first|key --camera desktop|close|phone --w --h --samples --out`, plus
  look-dev knobs). `make_dials.py`: the dial faces and label plates → `tex/`.
- `mock/`: one HTML page per image, `redline.css`, `shoot.cjs` (Playwright screenshots + box report),
  `squint.py`, `export.py` (JPEG q85).
- `out/ideas/01-redline/`: the final renders (PNG). `tests/`: every test render.

## Assets and licences

| Asset | Source | Licence | Used for |
|---|---|---|---|
| `green_metal_rust` 2K (diff, rough, nor_gl, disp, ao) | Poly Haven, https://polyhaven.com/a/green_metal_rust (downloaded today with `tools/fetch_polyhaven.py`, logged in `assets/polyhaven/SOURCES.tsv`) | CC0 | the panel paint, greyed and darkened in the shader |
| `metal_plate` 2K roughness | Poly Haven (already in the project) | CC0 | roughness breakup of the bezel and needle paint |
| HDRI `empty_warehouse_01` 2K | Poly Haven (already in the project) | CC0 | room fill and what the gauge glass reflects |
| B612 Regular/Bold | Airbus, Intactile, ENAC (Polarsys) | OFL 1.1 | dial faces, plates, page labels and button |
| Ortica Angular Bold, Ortica Linear | Collletttivo, Benedetta Bovani | OFL 1.1 | Michael's lines on the page |
| Plimsoll Heavy | ours (`tools/type/build_plimsoll.py`) | OFL 1.1 | title, equation, Bootloader name |

## Problems left

- **Bezel wear is a procedural mask** on the lip. At 100% the rubbed patches look similar on both
  bezels. A real used gauge fixes this, and so would a hand-painted wear map.
- **The glass is cleaner than real glass** in a room like this, and at 100% a faint sampling grain is
  left under it (OIDN cannot see through glass). It disappears at page size.
- **The key beat loses the capacity gauge.** The close-up shows only the pathways gauge, so the words
  carry the "> Capacity", not the picture. If James wants the two needles side by side at the redline,
  the same moment can be rendered in the wide frame of image 1 (`--state key --camera desktop`, about
  85 s).
- **The readout label** ("8 people, 28 pathways") points at the gauge, not at the needle tip. In the
  built page it would sit on the needle's line.
- **A rust streak** from the scanned paint sits at the top right of the phone frame. It is real and
  quiet, but it is the one mark on the panel the eye can wander to.
- **Not shown:** the scroll between the two beats (one needle position per hire), the shift that drops
  the needle back, the calm end frame with "How many people are on your team?". Each one is a re-render
  of this scene with `--n` and a needle value; the scene does not need to change.
- The calibration and the red from 72 are ours (see "Our calls").

## Review (art director and stranger pass, 2 Nov 2026)

I looked at each image at full size and at 100% crops of the renders, judged them as James would and as a
bootstrapped founder seeing the page cold, then fixed what the HTML could fix. No re-render: nothing in the
renders stops an image from doing its job, the render budget was already spent (14.6 min against 10 to 12),
and the realism fixes below are look-dev changes that would need test renders, not one final.

### Real or fake?

It does not look AI-made and it does not look flat. It does look like a careful 3D render, not a photograph.
At page size it holds up. At 100% these give it away:
- **The glass is not there.** No reflection of the window or the room on either dial. A real gauge under a
  window carries a soft sheen across part of the face (unless the shoot uses a polariser).
- **The dials are too clean.** The printing is digitally sharp and evenly lit, with no ink spread, no
  yellowing towards the rim, and no soft needle shadow on the face.
- **The bezels read as rubber rings.** The lip is a thick round profile, and the dry-brushed wear patches sit
  in the same places on both gauges.
- **Perfect geometry.** Two identical circles on one level line, plates dead centre.
- **The light has no shape.** The notes say late-morning sun, but the 7° sun through a blocker 0.9 m away makes
  a 10 cm soft edge, so the panel reads as an evenly lit dim room. Nothing on the panel shows a window. That
  is checklist 5, "name the light", only half passed. It is also a dark olive frame overall; after "a sewer",
  watch for "dingy".
- What works: the scanned paint (the most photographic thing in the frame), the grime where the bezels meet
  the paint, screws and plates at a believable scale, and a camera a person could stand at.

### Five-second test (as a founder with a team of 8)

- **First screen:** I can tell it's a book by Michael Wentz, that hiring adds complexity faster than it adds
  capacity, and that it's for bootstrapped teams of 1 to 12. The free file is the one button. Pass.
- **Key beat:** the needle in the red says "redline" with no words at all. "> Capacity" is carried by the words,
  because the close-up drops the capacity gauge. That's fine for this beat.
- **Reading risk:** at 8 people the capacity needle sits about 33° further round than the pathways needle (the
  two scales only meet at 12). A careful reader could think "capacity is ahead at 8", which is Michael's
  "Oxygen" state rather than the pain a founder at 8 feels. It fits the scroll story, but check it with Michael.
- **Not shown at all:** Up, Side, Down as a cycle (the shift and the calm end frame). Michael listed it as one of
  his three priorities.

### Bootloader, type and overlaps

- The Bootloader is the only button on every screen, and the outline keeps it below the line in the squint
  test. It is clear but quiet.
- Nothing overlaps another text box, and nothing sits on the focal point. (On desktop the readout's box now
  sits inside the column's box beside "capacity.", with 100 px of clear space.)

### What I fixed (HTML only; the three filenames are unchanged)

| Image | Fix | Why |
|---|---|---|
| 1 desktop | The readout "8 people, 28 pathways" moved so its rule ends 10 px short of the bezel on the needle tip's line (the tip is at 756, 498) | It used to point at the bezel below the dial. Now the eye goes from the line to the reading to the needle |
| 2 key beat | "The book: pre-orders open soon" added under the byline, as on image 1 | Two paths on every screen (TASTE 8) |
| 3 phone | The reading "8 people, 28 pathways" set beside the COORDINATION plate | The phone had no reading, and the needle hides the 28, so the gauge was mood only |
| 3 phone | The audience line turned from dim grey to cream | The dim grey was 2.6:1 on the sunlit paint (now 4.4:1). It's the "this is for you" line, and James reads on an iPhone |
| 3 phone | The audience line balanced, so it breaks at "self-funded / founders" | It used to leave "of 1–12" on a line of its own |
| 3 phone | "It finds where your team stands." added back under "A free file for your AI." (two lines, broken at the full stop) | The reason to tap was missing on the phone |
| 3 phone | The Bootloader and book link anchored to the bottom of the stage (bottom 74 px and 34 px) instead of top 712/792 | Same picture at 844, but the build will need it: in Safari the visible height is shorter than 844 |

Checks after the fixes: copycheck 0 not found on all three pages. Squint all pass: 133 vs 114, 151 vs 135,
184 vs 163. No clipped boxes. Fonts are Plimsoll, Ortica and B612 only. No tracked caps, shadow, gradient,
radius or `·`. JPEGs at q85: 142, 127 and 157 KB. The screenshots from before the review are kept outside the
project (scratchpad); the renders are untouched.

### Still open (for the real shoot or a later round)

- The look-dev tells above: glass reflection, dial ageing and needle shadow, bezel profile and wear, and a light
  you can name.
- The rust streak at the top right of the phone frame runs behind the end of "before". It's soft, but the eye goes to it.
- At 100%, faint sampling grain under the glass.
- The key beat in the wide frame (both needles at 13) is still an option, about 85 s, if James wants
  "> Capacity" in the picture.
- The shift, the calm end frame and the scroll steps between beats are not shown.

### Verdict for James

- **Shows the idea: 7/10.** The line, the dial printed in pathways and the needle in the red make "every hire
  costs more than the last" land in seconds. The cycle (Up, Side, Down) isn't in these three frames.
- **Looks real: 6/10.** It doesn't look like AI or stock, and it isn't flat. It reads as a good Blender render,
  not a photograph: clean dials, missing glass, rubbery bezels, soft light with no shape.
- **Caption:** "A Blender stand-in for a photo of a worn engine-room panel. The left dial counts the
  conversations a team has to keep up (28 at 8 people) and goes into the red at 13. Michael's line is on the
  left, and the free Bootloader is the one button."
- **What the real production needs:** two used flange-mount gauges, 150 to 200 mm ($50 to $150 each). Dial faces
  printed from `make_dials.py` on matte stock and fitted behind the original glass. A real painted steel panel
  or machine door with real wear. A locked tripod, 85 mm, real window light from the left, with a polariser
  set to leave a little reflection. One frame per team size from 1 to 16, plus the shift and end frames, with
  the needle set by hand or by a small servo so positions repeat. A portrait set-up for the phone. About a day
  of prep, a day of shooting and a day of retouching. In the build: the readout tracks the needle tip in each
  frame, the phone layout fits a Safari-height screen, and Michael signs off the calibration, the red from 72
  and the shift reading.

# Idea 2, The Heap: visuals

Three images for James. Each is a Blender render of the room with the site layer (HTML) on top, then screenshotted.

| File | What it shows |
|---|---|
| `visuals/1-first-screen-desktop.jpg` | The first screen at 1440x900. A small office in late-morning sun: dark plaster wall, oak desk and chair, a shelf with **8 white mugs (one per person)**, and on the floor beside the desk a heap of **28 patch cables (one per pair of people)**. The newest hire's 7 cables are blue and sit on top. The wall carries Michael's line, who the book is for, the counts at the things they count, and the Bootloader with its one button. |
| `visuals/2-key-beat-desktop.jpg` | The beat further down the scroll, from the same locked camera: **15 mugs** fill the shelf and **105 cables** cover the floor, pile against the desk, cover the desk top and hang off its edge. The newest hire's 14 cables are blue, dumped on the desk. Headline "Past twelve, something breaks." |
| `visuals/3-first-screen-phone.jpg` | The first screen on an iPhone (390x844 CSS, 2x). Same room and state as image 1, shot from a step to the left: the sentence on the wall at the top, the 8 mugs, the heap filling the lower half, the Bootloader in a bottom bar. |

The scroll this implies: one hire per step. The shelf gains one mug, and the heap gains n-1 new cables (hire 9 adds 8, hire 13 adds 12). The camera never moves, so the room fills up the way it would in a locked-off stop-motion.

## Michael's lines used (word for word)

| Line | Where | Source |
|---|---|---|
| "Every hire compounds complexity before it compounds capacity." | images 1 and 3, the hero | manuscript L696, `src_copy.ts:60` |
| "Past twelve, something breaks." | image 2, headline | manuscript L3509, `src_copy.ts:88` |
| "Every addition makes it worse." | image 2, under the headline | manuscript L2997, `src_copy.ts:81` |

`node susd-options/tools/copycheck.mjs` on the three mock pages prints "4 sentences checked, 0 not found".

Labels we wrote (marked `// label` in the HTML): "A book by Michael Wentz", "The book: pre-orders open soon" / "The book", "SUSD Bootloader", "A free file for your AI. Version 16, 35,445 words." (phone: "...Version 16."), "Get it free", "For bootstrapped, self-funded founders with teams of 1–12" (the existing mocks' label), "people, one mug each", "cables, one for each pair of people", "Scroll: each step adds one person". The counts are the pathway sum n(n-1)/2 from Michael's table (BL 5108-5130): 8 people = 28, 15 = 105.

The 09 entry's main risk is that cables read as "IT department" rather than people. The cable label names one cable as one pair of people, and the mugs make the people countable.

## What is a stand-in

The idea is meant to be **photographed for real**: a locked-off stop-motion of about 105 real patch cables in a real room, with about 10 states. Everything here is a Blender stand-in for that shoot:

- **The heap is procedural, not a physics simulation.** Each cable is either a coil fresh from the box (3 to 7 loops, 28 to 42 cm across, with trailing ends and RJ45 plugs) or a loose meander. It is dropped near a target, slides downhill until the slope is under about 27 degrees, then settles as a rigid ring onto what is under it (the tilt that puts its centre lowest without sinking, as a dropped ring finds three supports). Loose ends follow the surface, never climb, and hang off edges. The heightfield is updated after every cable, so later cables lie on earlier ones. Limitation: cables only ever lie *on top of* earlier ones, never weave under, so at 100% the heap is a little more orderly than a real dumped pile.
- **For the real shoot, use long coiled cables (5 to 10 m).** 105 short 1 to 3 m patch cables would not cover a desk: their volume is only a few litres. The coils give the pile its bulk here.
- **Mugs stand in for people.** The 09 entry says "adds one person to a row along the wall" but not what the person is. A mug per person is my choice: countable, human, real. It needs James's (and Michael's) OK.
- **The founder is not shown.** The empty chair at the desk is theirs. In key, the chair is surrounded but not buried, and the desk is covered rather than buried under.
- The tidy last beat (three trunks, the rack with one empty labelled port, the Bootloader) is not in these three images.

## Render

- Scene: `ideas/02-heap/scene.py` (`--state first|key --camera desktop|phone --w --h --samples --out`, plus `--seed` and light options). It uses `lookdev/lib_lookdev.py`. The same seed in both states makes the first 28 cables of `key` identical to `first`. Each render writes `<out>.anchors.json` (where the mugs and heap land in the frame); the HTML labels were placed from it.
- Light: one idea, late-morning sun through a window on the left (out of frame). The sun lamp is cut into panes by the glazing bars: elevation 31 degrees, azimuth 262, strength 24, 5300 K, 1 degree disc. A 2.0 x 1.45 m area light fills the opening as skylight (260 W, 7200 K), and the overcast HDRI comes in through the window only, since the room is closed behind the camera.
- Cameras: desktop 35 mm, level at 1.52 m, 4.35 m from the wall, shift -0.235 (verticals true), f/4 focused on the heap. Phone 26 mm (iPhone-like), level at 1.45 m, panned about 18 degrees toward the desk, shift -0.26, f/4.
- Cycles CPU with OIDN, AgX Medium High Contrast, exposure 0, adaptive threshold 0.03. Post from `lib.post`: grain 0.07, vignette 0.22, lens dispersion 0.003, faint glare.
- Every render went through `tools/render_idle.py`; all are logged in `lookdev/renders.jsonl` (`idea: 02-heap`).

| Render | Size | Samples | Seconds |
|---|---|---|---|
| final_first_desktop | 1440x900 | 28 | 100.1 |
| final_key_desktop | 1440x900 | 28 | 100.1 |
| final_first_phone | 780x1688 | 20 | 79.6 (another job overlapped for 28 s) |
| 13 tests (t01-t09) | 640x400 / 360x780 | 12 | 214.1 in all |
| **Total** | | | **494 s (about 8 min)** |

Raw renders: `out/ideas/02-heap/final_*.png`. Mock pages: `ideas/02-heap/mock/` (`heap.css`, one HTML per image, relative paths to the renders and to `mock/fonts/`). Screenshots: `node ideas/02-heap/mock/shoot.cjs` writes `visuals/raw/*.png`. The JPEGs are those PNGs at quality 85 (181, 224 and 221 KB).

## Assets and licences

| Asset | Used for | Licence |
|---|---|---|
| Poly Haven `painted_plaster_wall` (already in repo) | wall, tinted dark slate | CC0 |
| Poly Haven `oak_veneer_01` (**new**, fetched 2 Nov 2026) | desk top, shelf, chair | CC0 |
| Poly Haven `wood_floor` (**new**, fetched 2 Nov 2026) | floor | CC0 |
| Poly Haven `metal_plate` roughness (already in repo) | powder-coat breakup on the steel legs and brackets | CC0 |
| Poly Haven HDRI `kloofendal_overcast` (already in repo) | sky through the window | CC0 |

Both new assets were downloaded with `tools/fetch_polyhaven.py`, which logged them to `assets/polyhaven/SOURCES.tsv` (URLs from dl.polyhaven.org). Everything else (mugs, cables, plugs, desk, chair, outlet) is modelled in `scene.py`. Fonts: Plimsoll (ours), Ortica, B612, from `mock/fonts/`. No AI imagery, no stock photos.

## Left to decide or fix

- Mugs as people, and blue as "the newest hire's cables", are our readings; check both with James.
- The heap's over-only stacking (see above) is the most render-like thing at 100%. A real shoot fixes it for free.
- Ortica Angular (the hero) is a sharp serif. It is the project's face for Michael's voice, but it sits nearer the "editorial" family than B612 or Plimsoll, so worth a look in James's side-by-side.

## Review (art director and stranger pass, 2 Nov 2026)

All three images were looked at full size, and the raw renders at 100%. Scores for James: **shows the idea 7/10, looks real 6/10.**

### Real or fake

It does not look AI-made: there is no smeared detail, the light has one source you can name (late-morning sun from a window on the left, cut into panes on the floor), and the plaster, oak and floor are scanned textures with real grain. It does look like a careful 3D render. The tells, worst first:

1. **The mugs.** Eight (then fifteen) identical white mugs, evenly spaced, handles nearly all the same way, spotless. At page size that row is the first thing that says "CG". Real people's mugs never match.
2. **The room is too clean.** One closed laptop and one notebook; no monitor, no bag, no paper, no jacket on the chair, no dust. It reads as an archviz set, not an office someone works in.
3. **The coils are rigid hoops.** Cables come off the box as near-perfect rings and stay round and stiff where they land, some tilted steeply against the pile. Real dumped coils slump and spring open.
4. **Key beat, before this pass:** cables hung off the desk as dead-straight plumb lines with a hard right-angle hook at the edge (like string or rain), and some stood up as spikes where later cables climbed onto earlier hanging ones. That was the worst single tell, so it got the one re-render (below).
5. Smaller: every plug is the same white box; the furniture edges are machine-perfect.

What already works: the light, the dark plaster wall, the sun patch on the floor, contact shadows under every cable, the scale (mugs, sockets and a chair give known sizes), a real lens from where a person could stand.

### Five-second test (as a bootstrapped founder)

- First screen: "A book by Michael Wentz about how hiring adds complexity faster than it adds capacity; for founders like me (1 to 12 people); there is a free file for my AI, top right." That lands. The mugs and the heap make the sentence literal, and the labels name the code (one mug per person, one cable per pair).
- Squint test: the sentence is the biggest high-contrast block on the dark wall. The sunlit floor is as bright, but it is low and broken up, so the words still win.
- Key beat without words: a full shelf of mugs and cables everywhere reads as "more people, far more mess". After the re-render the founder's chair is taken by coils too, which is the human beat. "Something breaks" is shown as burying, not as a break; the tidy ending, where the idea pays off and the Bootloader click lives, is still not drawn.
- The Bootloader: the only solid button on every screen ("Get it free"), with "A free file for your AI" beside it, so it is the obvious click. On desktop it sits in the top-right corner at nav size, so it is findable rather than dramatic; on the phone the bottom bar makes it unmissable.

### Copy

`node susd-options/tools/copycheck.mjs` on the three mock pages: 1 + 2 + 1 = 4 sentences checked, 0 not found. No sentence was changed in this pass; the phone line break added is in a label.

### What was fixed

1. **Key beat re-rendered once** (`final_key_desktop.png`, 1440x900, 28 samples, 111.1 s, no CPU sharing, through `render_idle.py`). Changes in `scene.py`, all behind `--review` (default on; `--review 0` gives back the builder's heap), and only for cables 29 to 105, so the first 28 cables are byte-identical to `first` (checked by dumping both heaps with the new `--dump`):
   - `drape()`: a cable going over a real edge (a drop of more than 10 cm) rolls over on a 2.5 to 5 cm bend, hangs with the bow and sideways wave of its coil memory, and meets the floor on a J before running on. No more plumb lines or hooks.
   - Hanging lengths are no longer stamped into the height map as if they were a surface, which removed the spikes where later cables climbed onto them.
   - A dropped coil's loops now slide apart a little instead of staying concentric.
   - 5% of the later cables are dropped on the founder's chair, as smaller coils that fit the seat. The seat now carries a small pile with a blue coil on top, and cables hang off it.
   Images 1 and 3 were not re-rendered and are unchanged.
2. **Phone overlay** (`3-first-phone.html`, `heap.css` phone rules only): the audience line moved up under Michael's sentence, as on desktop, broken after "with" so its short second line stays clear of the mugs; before, it sat in the middle of the wall between the two counts and read as one more label. The "28 cables" label gets a leader into the heap, like desktop. Small phone text raised from 11.5 to 12.5 to 13 px (count units, byline, Bootloader line, "The book"). No overlaps (checked by `shoot.cjs`).
3. Re-shot with `node mock/shoot.cjs`; JPEGs at quality 85. `1-first-screen-desktop.jpg` is pixel-identical to the builder's and was left as it was.
4. Housekeeping: the first row of `lookdev/renders.jsonl` had lost its opening `{` before this pass (file dated 04:43), which made `render_idle.py` crash after each render while annotating the log. That one byte was restored; the log parses again.

Render time this pass: 111 s for the one final, plus four `--dry` geometry checks (no rendering, each a few seconds, also run through the queue). Idea total: about 605 s (10 min).

### Still open

- Mugs as people and blue as "the newest hire's cables" still need James's (and Michael's) OK.
- **Blue cannot work in a real locked-off shoot as drawn.** In image 1 hire 8's cables are blue; in image 2 the same cables are grey, because blue moved to hire 15. Real cables don't change colour. For the shoot, give each hire's batch a colour that stays, or mark only the newest batch with something removable (a twist tie or tape flag).
- The mugs and the bare room (tells 1 and 2) are left: changing them in one image only would break the locked-camera match between images 1, 2 and 3.
- The tidy ending (three trunks, the rack with one empty labelled port, the Bootloader) is not drawn.

### What the real production needs

A real locked-off stop-motion in a real small office, shot in one late morning: one camera on a tripod at about 35 mm and standing eye height (plus a second locked camera, or a high-resolution frame cropped, for the phone), about ten states from 8 to 15 people, then the tidy ending. Fifteen real, mismatched mugs (different shapes and colours, a chip, a tea stain) so they read as people. About 105 real Cat6 cables, long ones (5 to 10 m) coiled, or the pile will not have the volume to bury a desk; with a colour per hire that stays put. A lived-in desk (monitor, papers, a jacket on the chair). For the ending: velcro-tied trunks and a small patch panel with one empty labelled port. Roughly a day to shoot and a day to edit; the cables are the main cost (my estimate: a few hundred dollars for long Cat6, more than the 09 entry's $200).

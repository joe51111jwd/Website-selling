# 06 · Hero build: the Waterline scene and its key stills

**Job.** Build the Waterline scene as one reproducible Blender script, render the story's key states as
hero-quality stills, and mock the first screen, the Redline beat and the finale with the planned HTML on top,
so James can judge the story and the conversion from screenshots. Thesis on the wall:
"Every hire compounds complexity before it compounds capacity." [M 696 · copy.ts:60]

Everything is in `susd-render/`: the scene in `scene/`, the stills in `out/stills/` (gitignored, as `out/` is),
the mocks in `mock/`, their screenshots in `out/mock/`, every render logged in `out/renders.jsonl`.

## Results at a glance

**Stills** (final, round 2; Cycles CPU, 32 samples, OIDN; desktop 1600×1000, phone 900×1950). Every one has a
`.anchors.json` beside it. Contact sheet: [`out/stills/contact_sheet.png`](../out/stills/contact_sheet.png).

| Still | State | What it shows | Seconds |
|---|---|---|---:|
| [`out/stills/d1_hero_K1.png`](../out/stills/d1_hero_K1.png) | K1 hero, n = 8, 28 pathways | the first screen: dry words in the last sun, water halfway up the ledge, ⦵ and "12" painted above it, the top of the wall in the trees' shade | 207 |
| [`out/stills/d2_touch_K3.png`](../out/stills/d2_touch_K3.png) | K3 touch, n = 13, 78 | the water at every letter's foot at once, the sentence mirrored whole, the ⦵ just under, the signal red | 209 |
| [`out/stills/d3_under_K5.png`](../out/stills/d3_under_K5.png) | K5 under, n = 19, 171 | the window camera: the whole sentence under, green and refracted behind the gallery glass, the red lamp at the surface | 170 |
| [`out/stills/d4_redline_K6.png`](../out/stills/d4_redline_K6.png) | K6 Redline, n = 39, 741 | deepest point under a cloud: the drowned sentence, the red lamp the only warm light, its glow on the gallery floor | 190 |
| [`out/stills/d6_drained_K9.png`](../out/stills/d6_drained_K9.png) | K9 drained (Down 1) | the first course under the panel, the chamber drained below ⦵, the wall wet up to its new flood ring, the signal green | 206 |
| [`out/stills/d7_raised_K11.png`](../out/stills/d7_raised_K11.png) | K11 raised (Side 2) | two courses under the panel; Up has stopped exactly at the ⦵ line; the flood ring on the wall beside the words | 188 |
| [`out/stills/d8_final_K16.png`](../out/stills/d8_final_K16.png) | K16 final (Oxygen) | wide: the words high and dry on three courses, their feet just above their own flood ring, glassy water at the first screen's level | 198 |
| [`out/stills/p1_hero_K1.png`](../out/stills/p1_hero_K1.png) | K1 hero, phone | six lines on a narrow panel, the ⦵ under the words' right end, the bottom of the frame water for the sticky bar | 221 |
| [`out/stills/p3_under_K5.png`](../out/stills/p3_under_K5.png) | K5 under, phone | the six lines drowned behind the glass, the red lamp at the surface | 141 |
| `out/stills/d5_emerge_K8.png` | K8 Side 1 (optional) | **rejected**: with the brief's crane framing the frame is 80 % black water and the near wave facets catch a pale sky blob; it neither reads nor shows Side (the course is under water). Fix if K8 is wanted: a calmer near surface and a higher camera. | 181 |

Round 1 is kept in `out/stills/r1/` for comparison (section 7).

**Mocks** (`mock/index.html`, `mock/redline.html`, `mock/finale.html`; self-hosted Plimsoll, Ortica, B612;
copy check 13 sentences, 0 not found):

| Screenshot | Viewport | Plate |
|---|---|---|
| [`out/mock/desktop-hero.png`](../out/mock/desktop-hero.png) | 1440×900 | d1 hero |
| [`out/mock/phone-hero.png`](../out/mock/phone-hero.png) | 390×844 CSS px at device pixel ratio 2 (780×1688 file) | p1 hero |
| [`out/mock/desktop-redline.png`](../out/mock/desktop-redline.png) | 1440×900 | d4 Redline |
| [`out/mock/desktop-finale.png`](../out/mock/desktop-finale.png) | 1440×900 | d8 final |

![Hero still](../out/stills/d1_hero_K1.png)

![First screen, desktop](../out/mock/desktop-hero.png)

![The story in ten stills](../out/stills/contact_sheet.png)


---

## 1. How to run

From `susd-render/` (Blender 4.5.15 LTS, Cycles on the CPU, OIDN):

```bash
# one state, desktop (16:10) or phone (portrait, six lines)
blender -b -P scene/waterline.py -- --state hero --w 1600 --h 1000 --samples 32 --out out/stills/d1_hero_K1.png
blender -b -P scene/waterline.py -- --state hero --camera phone --w 900 --h 1950 --samples 32 --out out/stills/p1_hero_K1.png
# print the state table (K0..K17: n, pathways, water, deck, flood scar, sun, signal, chop, camera)
blender -b -P scene/waterline.py -- --list
# every still in this document (waits for a free CPU before each one; skips stills that exist)
bash scene/render_stills.sh 32
# quick tests at any size (one Blender at a time); contact sheets
bash scene/test_batch.sh t11 720 450 16 hero touch redline:desktop under:phone
python3 scene/sheet.py out/test/sheet.png 3 out/test/t11_*.png
# the mocks: copy the stills in, screenshot at 1440x900 and 390x844, measure the plate under every text box
python3 mock/build_img.py && node mock/shoot.cjs
node /home/user/Website-selling/susd-options/tools/copycheck.mjs mock/*.html     # must print 0 not found
bash tools/ai_tells_scan.sh mock                                                 # must print nothing
```

`--state` takes a K number (`K0`..`K17`), a story name (`intro`, `hero`, `twelve`, `touch`, `cut`, `under`,
`redline`, `turn`, `side1`..`down3`, `oxygen`, `drain_end`) or one of the still aliases (`hero`, `touch`,
`under`, `redline`, `emerge` = K8, `raised` = K11, `drained` = K9, `final` = K16). Any key of `TUNE` in the
script overrides the state (for example `--sunel 18 --wind 1.2 --exposure 1.0 --signal 0`). Each render also
writes `<out>.anchors.json` (section 6) and a row in `out/renders.jsonl` with its exact argv.

The script imports the look-dev library (`lookdev/lib_lookdev.py`: scanned materials, the baked Ocean water,
the water and glass shaders) unchanged, and Michael-specific pieces from the type team
(`tools/type/blender_kern.py`). It builds everything from an empty file each run: no `.blend` is needed.
`--save x.blend` writes the built scene if you want to open it.

---

## 2. The scene, and what each thing means

Blender axes follow `01-MEANING.md`, section 2: Z is Michael's Up, X is Side, Y (into the picture) is Down.
The far wall's face is y = 0; every camera looks along +Y, level.

| In the render | Built as | Means (brief, section 2) |
|---|---|---|
| The sentence | Plimsoll Heavy capitals (`docs/type/system/Plimsoll-Heavy.otf`), kerned with the font's own pairs (Blender applies none: `blender_kern.apply`), tracking 1.03, lines at 1.32 cap; cap 0.285 m (desktop, 3 lines) or 0.20 m (phone, 6 lines). **Each letter is its own part**: 30 mm cut steel with a 1.5 mm edge break, fixed 3 mm off the panel, set by hand (each letter up to a few tenths of a degree and a millimetre or two off true, seeded). | the business; its message |
| White enamel on the letters | chipped at the edges (an AO-inside edge mask breaking through to red-oxide primer), faint dirt runs from the top edges, a few rust pin-spots, dust on upward faces, wet and silt-stained below the water and the flood line, ±3 % per letter | B23: ships' draught marks are white so they read against a hull; the words must win the squint test |
| The panel | smooth precast (`concrete_wall_008`), 0.15 m thick, standing on the ledge 20 mm off the wall, held by two steel angles, with two cast-in lifting loops on top; a painted history map (rust weeping from some letters' hidden fixings and from the angles, a dirtier foot) | the structure that carries the message |
| The ledge | a cast berm 0.80 H high along the foot of the far wall, running out of frame to the left and ending right of the words; its top is D0 | the ground the words stand on at the start |
| The courses | precast blocks about 1.25 m long with 8 mm joints, laid on the ledge under the panel in Side (0.55 H, 0.45 H, 0.45 H), each newer course a little narrower and cleaner than the one under it | Side: systems absorb the growth |
| The load line ⦵ and "12" | white road paint, worn through in patches, on the ledge face; its bar's top edge is the 12-person level (−0.105 H) | the line you don't cross; the Bootloader's mark on the page |
| Water | the look-dev's baked Ocean surface (real geometry, IOR 1.333, green absorption, a little silt scatter), level from the pathways map | coordination complexity |
| Wet band, silt, flood scar | wet (darker, glossier) up to a per-state wet top; soft silt below the highest level so far; a narrow bathtub ring at that level, on the fixed wall and, separately, on the moving parts (the panel's ring rises with it) | the wall remembers how bad it got |
| Staff gauge | the E-pattern enamel gauge (`assets/generated/staff_gauge.png`), 0 at the lock floor, 2.2 m, on the wall beyond the ledge's end, aged | the instrument; an honest scale |
| Ladder | dark painted steel on brackets, landing on the ledge, rungs every 0.3 m, paint worn to rust in patches, rust weeping down the wall from every bracket | scale; a real lock |
| Lock signal | red over green in a black housing on a white backboard, right of the ladder; off, red (13 to the turn) or green (once drained below ⦵); a lit lens plus a small point light so it lights the wall and is reflected | Redline / Oxygen as real light |
| The canopy | an out-of-frame screen of plane-tree foliage on the near bank (visible only to shadow and diffuse rays) whose shade covers the upper wall | the dark top band the title and dock need, as light rather than a scrim |
| Gallery (WINDOW states) | a dark observation gallery behind a 40 mm glass wall 0.85 m in front of the wall, mullions only at the frame edges | going under with the words |

The history maps (rain streaks from the coping, rust weeping from each steel fixing at its real position,
biofilm in the permanently wet band at the floor; on the panel, rust from the letters and angles) are painted
in numpy inside Blender at build time from the scene's own fixing positions, so every stain has a cause and
nothing tiles with the scanned texture underneath (02-AI-TELLS B04, B05).

---

## 3. The story table (one rule, both layouts)

Levels are in H (the sentence block's height) above D0 (the ledge top). Pathways p = n(n−1)/2. For n ≤ 19,
`level = (p − 76)/95`; beyond 19 the climb is compressed to reach 1.35 H at n = 39 (brief, section 3).
The lock floor is −0.80 H. Desktop: H = 1.037 m, D0 = 0.830 m. Phone: H = 1.520 m, D0 = 1.216 m.
`blender -b -P scene/waterline.py -- --list` prints it:

| K | Name | n | p | Water (H) | Deck (H) | Flood scar, wall (H) | Sun (×) | Signal | Wind m/s | Camera |
|---|---|---:|---:|---:|---:|---:|---:|---|---:|---|
| K0 | intro | 1 | 0 | −0.800 | 0 | – | 1.00 | off | 1.6 | HERO |
| **K1** | **hero** | 8 | 28 | −0.505 | 0 | – | 1.00 | off | 2.2 | HERO |
| K2 | twelve | 12 | 66 | −0.105 | 0 | – | 1.00 | off | 2.4 | HERO |
| **K3** | **touch** | 13 | 78 | +0.021 | 0 | – | 0.90 | red | 2.8 | HERO |
| K4 | cut | 14.5 | 98 | +0.230 | 0 | – | 0.75 | red | 3.2 | HERO |
| **K5** | **under** | 19 | 171 | +1.000 | 0 | – | 0.50 | red | 3.6 | WINDOW |
| **K6** | **redline** | 39 | 741 | +1.350 | 0 | – | 0.18 (cloud) | red | 4.0 | WINDOW |
| K7 | turn | – | – | +1.350 | 0 | – | 1.00 | off | 2.0 | CRANE |
| **K8** | **side1 (emerge)** | – | – | +1.350 | 0.55 | 1.35 | 1.00 | off | 2.0 | CRANE |
| **K9** | **down1 (drained)** | – | – | −0.450 | 0.55 | 1.35 | 1.00 | green | 1.8 | CRANE |
| K10 | up2 | – | – | −0.105 | 0.55 | 1.35 | 1.00 | green | 1.8 | CRANE |
| **K11** | **side2 (raised)** | – | – | −0.105 | 1.00 | 1.35 | 1.00 | green | 1.6 | CRANE |
| K12–K15 | down2, up3, side3, down3 | – | – | −0.45 / −0.105 | 1.00 / 1.45 | 1.35 | 1.00 | green | 1.6–1.2 | CRANE |
| **K16** | **oxygen (final)** | – | – | −0.505 | 1.45 | 1.35 | 1.10, 4300 K | green | 0.6 | WIDE |
| K17 | drain_end | – | – | −0.788 | 1.45 | 1.35 | 1.10 | green | 0 (still) | WIDE |

Bold rows are rendered as stills. The moving parts carry their own scar: the panel and letters were under to
1.35 H while the deck was at 0, so after K8 their ring rides 1.35 H above the deck (1.90 H at K9, 2.80 H at
K16, above the top of the panel: they are stained all over, faintly). Wet tops: the wall and ledge are wet
12 cm above the water, except at K9 (just drained: wet up to the flood line) and K8 (just lifted: the whole
panel wet).

---

## 4. Cameras and framing

Every camera is level (true verticals, as a view camera is used for a frontal record of a structure: 02
B15, B16) and puts the sentence where the brief's layout needs it with a rising or falling front (`shift_y`),
36 mm across the long side of the frame.

| Camera | Lens | Where it stands | Frame (on the letters' plane) | Used for |
|---|---|---|---|---|
| HERO | 50 mm, f/8 | 10.4 m from the letters, 3.0 m above the lock floor (the near wall's stair) | 7.34 × 4.59 m; the sentence at 18.3–41.2 % of the height, 18.9–81.3 % of the width (brief 4.1: 18.7–41.3 %, 16.7–83.3 %) | K0–K4 |
| WINDOW | 35 mm, f/5.6 | in the gallery, eye at D0 + 0.89 H (goes under at n ≈ 18.5), 7.1 m from the letters | the same rectangle for the sentence as HERO (the match cut) | K5, K6 |
| CRANE | 50 mm, f/8 | rises with the deck: half the rise during Side, catching up in Down and Up; pulls back if the water would leave 50–64 % | as HERO, moved | K7–K15 |
| WIDE | 35 mm, f/9 | 11.4 m from the letters, 3.5 m up | 11.7 × 7.3 m; words' top at 10 %, water at 53 % (the finale needs the dark water below) | K16, K17 |
| Phone HERO / WINDOW | 40 / 30 mm | 5.5 m / 4.1 m | portrait 9:19.5; the sentence from 10 % down, the frame just wide enough to hold the ⦵ | phone stills |

---

## 5. Light, materials, finish

**Sun.** Late afternoon, from the left and a little in front (azimuth 226°), 4400 K (4300 K at Oxygen), disc
1.2°. Its elevation is not set by hand: it is **solved** so that the shade of the plane trees on the near
bank (a foliage screen 14.2 m back, lower edge at 9.45 m) falls just above the panel, darkening the top band
for the title and the dock with real shade. As the words rise through the story the sun is lower, so the shade
line climbs with them: 19.3° at the hero, about 16° at Oxygen. The sun is about 50° off the wall's normal,
not grazing it, so letters 3 mm off the panel throw a short shadow that touches their own foot (02 B11).
WINDOW states use 70° (a low sun would put the gallery roof's shadow across the ledge and floor; 84° was
tried and lit the letter faces worse, t07).
**Sky:** Poly Haven `kloofendal_48d_partly_cloudy_puresky`, its sun clamped out. Redline: sun ×0.18 (a
cloud, −2.5 stops) and sky ×0.65.
**Glitter:** the look-dev projector at `--wc 0.15` with a slow break-up along the band (B14), only while the
sun is on the wall and the water is below the words' top.

**Water.** IOR 1.333, absorption (0.20, 0.47, 0.25) at density 1.6 (window 0.9), silt scatter 0.06 (window
0.14), Ocean baked per frame: spatial 8 m, resolution 16, wave scale 0.034 × wind/2.2, alignment 0.75,
choppiness 0.2 (0 against the glass), a 3 cm grid, dust-film roughness patches up to 0.16.

**Exposure (AgX, Medium High Contrast).** +0.8 EV open; +1.6 EV window; +1.5 more under the Redline
cloud (+0.4 more on the phone window). Like a photographer opening up, not brighter lamps (05 pitfall 11).

**Finish (compositor).** Fog glow 0.12 above 1.2; lateral colour 0.004 then a 1.2 % crop; an optical vignette
computed as cos⁴ of the field angle **from the lens axis**, which the falling front moves above the frame, so
the falloff darkens the near water more than the wall, at 0.55 strength (a centre filter); film grain 0.06,
shifted per frame. Fixed seed (`use_animated_seed = False`).

**Assets (all CC0 or ours; nothing generated).** Poly Haven 2K: `concrete_wall_007` (lock wall, end walls),
`concrete_wall_008` (ledge, panel, courses, coping), `concrete_floor_worn_001` (lock floor), `metal_plate`
(enamel roughness), `rusty_metal_02` (steel roughness), `painted_plaster_wall` and `smooth_concrete_floor`
(gallery), HDRI `kloofendal_48d_partly_cloudy_puresky`. All already in `assets/polyhaven/` and listed with URLs
in `assets/polyhaven/SOURCES.tsv`; nothing new was downloaded. Ours: the staff gauge texture
(`tools/make_staff_gauge.py`), the history maps (painted at build time), Plimsoll Heavy.

---

## 6. Anchors

Each still writes `<name>.anchors.json`: the sentence's box, the waterline at the wall, the deck, the ⦵,
the gauge, the flood scar and the focus point, normalised 0–1 (y down), plus the metric values (H, D0, water,
deck, camera, shift). The mocks place their HTML from these, and the site's player will use the same format
(brief 7.6).

## 7. How it got here: the refinement log

Every test is in `out/test/` (720×450 or 1600×1000, 16 samples) with its contact sheet; every final round is in
`out/stills/` (round 1 kept in `out/stills/r1/`). Each step names the tell it fixed (02-AI-TELLS) or the brief
rule it serves.

| Step | What the frame showed | Change |
|---|---|---|
| t01 hero | The look-dev's doubled black letters were gone: white enamel letters 3 mm off a panel, the sentence the brightest thing (passes B11, B23). But a dark panel on a light block read as **a sign on a plinth** (B01); the reflection broke into blobs; an orange "toy" ladder; a bright top band (the cream title would fail). | Continuous ledge along the wall (architecture, not a plinth); panel toned toward the wall; dark steel ladder; ⦵ moved onto the ledge face; cap 0.27 → 0.285 m to fill 66 % of the width. |
| t02 hero | Shade at the top worked; a **diagonal shadow** crossed the left third. | The chamber's end walls were 12 m away and shading it: the chamber is now 80 m long (locks are long). |
| t03 touch | The water meets every letter at once and mirrors the sentence; the red signal reads as a lock signal (kept: brief 15.3). | – |
| t04 all states | Hero good. Redline (window) almost black. K8 (side 1) 80 % black water with sky blobs on wave facets, and it does not show Side (the course is under water). The final's three identical courses read as a pedestal. | "raised" = K11 (side 2: courses visible, water stopped at ⦵); K8 kept as `emerge`. Courses: blocks with joints, aged. Flood scar: a bathtub ring added over the silt. Window water clearer (density 0.9). |
| t05–t07 window | Words readable but the ledge and floor black: the gallery roof's edge shades them from a sun on the camera side. Scatter 0.14 did not lift it; an 84° sun lit the letter faces worse. | Back to 70°; the dark lower half is the Redline caption's field (judged in the mock); a gallery practical light is listed as an option for James. |
| t08 hero 1600 | Strong at full size. At 100 %: the top band half lit; vertical "scratch" glitter on the ledge face; everything sepia (the scans are yellow); **pristine letters** (B07, B04); **faceted** reflections (Ocean sampled at 6 cm, mesh at 4 cm). | Shade line closer to the panel; glitter 0.3 → 0.15; concrete tints neutral (the warmth comes from the light); chips, dirt runs, rust pin-spots on the letters; Ocean sampled at 3 cm, 3 cm mesh, lower wave scale. |
| t09 hero 1600 | Better; but the new dirt runs read as **wood grain** on the letters (a new tell). | Runs broader, fainter, rarer. |
| t10 cycle + phone | Courses read as built; phone six-line set works; phone window dim. | Phone window +0.4 EV; flood ring stronger. |
| Mock 1 (test plates) | Desktop zones all pass (≤ 0.15 at p95); phone title band fails (0.18). | Phone shade line lowered. |
| **Round 1 finals** (`out/stills/r1/`) | Hero, touch, drained, raised strong; Redline moody and legible. Final: the courses a **light grid of boxes**, the largest bright mass (B05, squint). All open views: jagged reflection shards from the shortest Ocean waves. The finale did not fit the wide frame (water at 57 %), so the camera was re-framed to 52 % before the final rendered. | Round 2: courses in stretcher bond, darker by age, per-block tone; Ocean minimum wavelength 2 cm → 12 cm (t11: smooth, wavy, photographic reflections); wide camera 35 mm with the water at 52 %. |
| Mock 2 (round-1 plates) | Finale and Redline title bands fail (0.19, 0.18): at 14 m the 1.2° sun disc throws a 0.3 m penumbra, so the shade line sits higher than solved. The green signal's reflection ran through the book column. | Wide camera: a 0.6° (near-real) sun disc and a tighter canopy edge so its shade covers the band; window frames use the brief's functional top scrim (7.7), measured; the book column narrowed. |
| **Round 2 finals** (`out/stills/`) | See section 8. | – |


---

## 8. Round 2, reviewed against 02-AI-TELLS

The checklist (02, section 0), answered from the final stills and the four mock screenshots. Expected answer in
brackets; anything not a clean pass is explained.

| # | Question | Answer |
|---|---|---|
| 1 | Squint: is the sentence the biggest, brightest, highest-contrast thing? [yes] | **Yes** in every open-view still and on the first screen. In the window stills (K5, K6) the red lamp is brighter, but the sentence is still the biggest and the only legible thing; that is the Redline beat. |
| 2 | Would the design work with another product's words? [no] | No: the words are the object, standing in water that obeys a load line at 12. |
| 3 | Could a generator return this screen? [no] | No: one rendered place, our face, a layout built around the render's geometry. |
| 4 | Zero clicks: the claim, who it is for, where the Bootloader is? [yes] | Yes on both layouts: the rendered sentence; "For bootstrapped, self-funded founders with teams of 1–12" on the water; the dock (desktop) and bar (phone). |
| 5 | Name the light; no HTML shadow or glow? [yes] | Late-afternoon sun from the left, low under the plane trees on the near bank; no CSS shadow, glow or text-shadow anywhere. |
| 6 | Only Plimsoll, Ortica, B612? [yes] | Yes. |
| 7 | Tracked caps, mono labels, middle-dot strings? [no] | None: the dock, bar and spec are stacked facts (02 Part D). |
| 8 | Paper, grain overlay, gradient, glass? [no] | **One functional scrim**: the Redline page's top 120 px (0 → 40 %), as brief 7.7 allows, because the window camera's top band is the dry wall above the surface. Measured (title 6.1:1 with it, 3.95:1 without). `tools/ai_tells_scan.sh mock` flags it as A10; that is this scrim and nothing else. The other three screens need none: the trees' shade is in the render. |
| 9 | Cover colours as flat fills? [no] | No. Red and green exist as the signal's light and the Redline equation's text. |
| 10 | Centred eyebrow-headline-buttons stack, mirror symmetry? [no] | No. The first screen is four corners around the lit sentence; the Redline caption and the finale lead are single centred subtitles over water. |
| 11 | Cards, equal panels, mockups, drop shadows? [no] | No. The finale's two paths are columns of type on the render, unequal (the file column is wider and holds the only filled controls). |
| 12 | Decorative hairlines, stat rows with tracked units? [no] | No. The 8 / 28 readout is the instrument (sentence-case B612 units, untracked); the 10×2 px bar marks the current band. |
| 13 | Pills, rounded buttons, icon sets, chevrons? [no] | No: square controls; ⦵ is the only icon. |
| 14 | Every sentence Michael's and cited; labels clean? [yes] | Yes: copycheck 13 sentences, 0 not found (labels carry `// label`, as in the copy deck); the Redline equation is checked in the copy deck (a raw `>` in HTML). |
| 15 | Motion tells? [no] | Static mocks; nothing animates. |
| 16 | A real, nameable place with objects of known size? [yes] | A canal lock: 0.3 m ladder rungs, an E-pattern gauge, form-tie holes, a load-line mark. |
| 17 | Contact shadow at every junction? [yes] | Yes: letters 3 mm off the panel throw a shadow touching their feet; panel on ledge; courses on courses; ladder on brackets and on the ledge. |
| 18 | Wear with a cause? [yes] | Rust weeps from every bracket at its real position; silt below the flood line and a bathtub ring at it; chipped enamel at the letters' edges; dirt runs; biofilm at the floor; the coping's rain streaks. |
| 19 | Scanned materials, varied roughness, fabricated letters? [yes] | Poly Haven scans throughout; enamel roughness from a scanned map; letters cut 30 mm with a 1.5 mm edge break, each set by hand. |
| 20 | One shadow direction, no doubles, no glyph copies, subtle glitter? [yes] | Yes (the HDRI's own sun is clamped out; glitter 0.15 and broken up). |
| 21 | A real lens? [yes] | 50/35 mm from places a person could stand, level with a rising/falling front (true verticals), focus on the words, natural falloff from the lens axis, no flares. |
| 22 | Grain, wax, banding? [yes] | Fine luminance grain; 100 % crops (t08, t09) keep the concrete pores and the enamel's breakup at 16 and 32 samples. WebP/AVIF tiers are not packed yet (the mocks use JPEG q88): check banding in the darkest water at packing. |
| 23 | Do the dry words read at a glance, highest contrast? [yes] | Yes. |
| 24 | Boil, pop, gauge disagreement over five frames? [no] | Not tested (stills). The scene is built for it: fixed seed, Ocean time per frame, the level and the gauge from one table. |
| 25 | Every image ours or a noted CC0 scan? [yes] | Yes. |

**HTML over the render, measured** (`out/mock/measurements.json`: relative luminance of the plate under each
text box at the 95th percentile, and cream's contrast against it; the brief asks ≤ 0.15):

| Screen | Worst box | p95 | Contrast |
|---|---|---:|---:|
| Desktop hero | audience line (on the words' reflection) | 0.111 | 5.7:1 |
| Phone hero | `The book` link | 0.123 | 5.3:1 |
| Desktop Redline | title lockup (with the functional scrim) | 0.100 | 6.1:1 |
| Desktop finale | title lockup | 0.063 | 8.1:1 |

---

## 9. Timings and what they mean for the sequences

All measured with nothing else rendering (one Blender at a time; `scene/render_stills.sh` waits for a free CPU).
Rows are in `out/renders.jsonl`. Building the scene (letters, history maps, Ocean bake) adds 2–12 s per run.

| Render | Size | Samples | Seconds |
|---|---|---:|---:|
| Open view (hero, touch, drained, raised, final) | 1600×1000 | 32 | 188–209 (mean ≈ 200) |
| Window view (under, Redline) | 1600×1000 | 32 | 170–190 |
| Phone hero / phone window | 900×1950 | 32 | 221 / 141 |
| Open view, test | 1600×1000 | 16 | 107–110 |
| Any view, test | 720×450 | 16 | 20–30 |

This build costs about 12 % more than the look-dev staging (178 s at 1600×1000, 32 samples): 54 separate
letters with AO-edge chips, the canopy, and a 3 cm Ocean grid. Scaled to the brief's sequence setting
(1440×900, 24 samples) an open-view frame is about 200 × 0.81 × 0.75 ≈ **120 s**: the edge of the brief's Plan
B (7.4). Re-measure a 4-frame `--seq` session before committing; 16 samples (≈ 88 s at 1440×900) held up after
OIDN in the look-dev ladder.

---

## 10. What changed from the brief and the look-dev, and why

- **White enamel letters**, not the look-dev's near-black: 02 B23 (ships' draught marks are white so they read
  against a hull), and dark letters merged with their own shadows (05 item 7).
- **A ledge plus a panel**, not a landing block: a landing block under a dark panel read as a plinth with a
  sign (B01). The ledge is fixed; the courses go between it and the panel. D0 is the ledge top as before; the
  level map is unchanged. The ⦵ is painted on the ledge face (it must stay fixed while the words rise).
- **The top band is real shade**, not rain staining or a scrim: the sun is solved per state so the plane
  trees' shade stops just above the panel. The sun sinks through the story (19.3° → 16°), so the line climbs with
  the words. Only the window frames need the brief's functional scrim.
- **Cap 0.285 m** (H = 1.037 m), so the measured Plimsoll block fills 62.5 % of the frame width (brief: 66.7 %
  from the stand-in measurement; within the ±2 % position tolerance at the edges, 18.9 % vs 16.7 % at the left).
- **Hero waterline at 54.8 %** (brief 52.8 %): the waterline is measured on the ledge face, 0.35 m nearer the
  camera than the letters.
- **WIDE camera**: 35 mm and the waterline at 53 % so the finale fits on dark water; cap 35 px at 1440 (brief
  asks ≥ 36 px: 1 px short).
- **"raised" is K11**, not K8 (K8 does not show Side and reads as black water; section 7).
- **Window sun 70°** (as 05), not the open view's low sun: the gallery roof would shade the ledge and floor.
- **Finale layout**: the book column narrowed (64–360 px) to clear the green signal's reflection; the file column
  holds the description and the form side by side; `Read the Appendix` under the next-step lines.

## 11. Open items and decisions for James

1. **The look.** White painted-steel letters on a precast panel in a canal lock, late sun, Plimsoll Heavy. Show
   the contact sheet and the four mocks. (Plimsoll is still unseen by James and Michael: 03-TYPE.)
2. **The lock signal** (brief 15.3): kept; lit, it reads as a lock signal, and its red and green carry the story.
   Unlit, in the hero, it is a small dark box by the ladder; drop it with `--signal 0` if James finds it extra.
3. **The window frames' dark lower half.** Physically right (the gallery roof shades the ledge and floor) and
   it is the caption field for beats 4–5, but as a picture it is half black. Options: a dim practical light in the
   gallery (a real fitting: lights the floor and adds a faint reflection in the glass), or a lighter ledge face.
   The meniscus line at the glass is still a straight horizontal (02 C2).
4. **K8** if the sequence needs the emergence frame: calmer near water and a higher crane.
5. **Sequences**: re-measure per-frame cost (section 9); write `keyframes.json` from `STATES`; the `--seq`
   loop (one session, Ocean time +0.04 s per frame, grain shift per frame) is the look-dev's and is not yet
   ported into `scene/waterline.py`.
6. **Packing**: check banding in the darkest water when the WebP/AVIF tiers are made (B22).

Nothing was committed or pushed.


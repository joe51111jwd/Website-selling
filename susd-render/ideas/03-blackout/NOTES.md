# Idea 3, Blackout: visuals

Three images for James. Each one is a Blender render of the page on the desk, with the site layer (HTML) on top, screenshotted in Chromium.

| File | What it shows |
|---|---|
| `visuals/1-first-screen-desktop.jpg` | The first screen at 1440x900. A printed A4 page of the book lies on a dark walnut desk in daylight from a window on the left. Every line is painted out in black ink with a flat brush, except one sentence. That sentence, **printed on the paper**, is the headline. The ink has dried; the sheet has rippled where it took the ink. Everything we wrote sits off the page, on the desk at the left: the title lockup and the book link, who it is for, a scroll cue, and the Bootloader with its one button. |
| `visuals/2-key-beat-desktop.jpg` | The last beat of the scroll ("the last page is a page of the Bootloader, inked down to its first question"). A page of the SUSD Bootloader printout, painted out down to **"How many people are on your team?"**. The two strokes just under the question are still wet: blacker and glossier than the dry ink above. The flat brush is back on its little porcelain dish of ink at the right. The one button sits on the fresh ink directly under the question, aligned with it, next to the file's name and facts. |
| `visuals/3-first-screen-phone.jpg` | The first screen on an iPhone (390x844 CSS, 2x). The same page shot in portrait: the whole sheet, close enough that the kept sentence reads at about 30 px. The lockup and who it is for sit on the desk above the sheet; the Bootloader is a solid bar at the bottom. |

The scroll this implies (from the 09 entry, not drawn here): the ink goes on page after page; the next pages are left with "Past twelve, something breaks." and "Up. Side. Down. Repeat."; the last page is image 2.

## Michael's lines used (word for word)

| Line | Where | Source |
|---|---|---|
| "Every hire compounds complexity before it compounds capacity." | images 1 and 3, printed on the page; also the page's `h1` (visually hidden) | manuscript L696, `src_copy.ts:60` |
| "How many people are on your team?" | image 2, printed on the page (in typographic quotes, as the Bootloader sets it as a quotation); also an `h2` (visually hidden) | `public_bootloader.md` L4197 (also L310) |

**Why the line is not HTML type on screen.** In this idea the photograph carries the sentence: the ink has removed every other word, so his line is the only thing left to read on the paper. Setting it again in HTML would print it twice. The HTML still contains it, word for word, in a visually hidden heading, so screen readers and search get it. Everything we wrote sits off the paper.

**The rest of the printed text is Michael's too.** The ink lets fragments through at the dry ends of strokes, so the hidden text had to be his. Book page: `public_bootloader.md` L802 (the page starts mid-sentence, "more people, more growth. That's the only axis anyone talks about."), then M L696, BL L812, BL L814, BL L816, cut off at the foot of the page. Bootloader page: BL L4185 (the end of its paragraph), the headings BL L4189 and BL L4195, the question BL L4197, then BL L4199. Running heads: "Scaling Up-Side-Down" (inked out) and "SUSD Bootloader" (left), with folios 38 and 214. A script compared every printed paragraph against the sources after the same normalising copycheck does, and all of them match. (Two consecutive headings were flagged only because the check joined them into one string; each is in the Bootloader on its own.)

`node susd-options/tools/copycheck.mjs` on the three mock pages prints "3 sentences checked, 0 not found".

Labels we wrote (marked `// label` in the HTML): "A book by Michael Wentz", "The book: pre-orders open soon", "For bootstrapped, self-funded founders with teams of 1–12" (the label the other mocks use; fit table BL L4772 and L4774), "Scroll: each page is painted out down to one line.", "SUSD Bootloader", "A free file for your AI. Version 16, 35,445 words." (phone: "...Version 16."; the version and word count come from the brief, TASTE section 6), and "Get it free".

## What is a stand-in

The 09 entry says this idea is **photographed for real**: 5 or 6 real pages printed, painted out by hand (ideally by Michael) with brush and ink, and about 100 frames shot on a copy stand in daylight. Everything here is a Blender stand-in for that shoot:

- **The pages** are drawn by `make_pages.py`: A4, laid out in millimetres, set in Ortica Angular Bold (the book) and Ortica Linear Bold (the Bootloader printout), rendered to 16 px/mm textures. The type is large (about 32 pt), on purpose. The 09 entry warns that a whole page can't be read on a phone, so the pages would be printed big enough for a close crop. With a 150 mm measure the kept sentence breaks into three short lines (book) and two (Bootloader), which also suits the phone. A real shoot would print the manuscript the same way.
- **The ink is procedural, not a real hand.** Each line gets a flat-brush stroke (about 20 mm wide) dragged left to right. It has ragged edges at two scales, a pressed, rounded touch-down with a small pool, and it runs dry towards its end, outer bristles first, into streaks along the stroke. Long lines take two strokes (the brush reloaded part way), and some lines get a second pass. A narrower cut-in leaves a wobbly white margin around the kept sentence. A few drops were shaken off the brush into the margin. Dry ink is near-black with a low satin sheen; ink over toner is a hair glossier, so letters ghost faintly through thin passages. Real brushwork is less regular: at 100% you can still find short white dashes where strokes meet, which a hand would not leave so evenly.
- **The paper** is real geometry, 0.75 mm grid. It buckles in irregular waves along the strokes (typically under 1 mm, up to about 2 mm, including the lift at the corners; never below the table). A second sheet underneath shows its edge at the left.
- **Wet ink (image 2)**: the two strokes under the question are glossier (roughness 0.035), more domed, and buckle the paper more. From this camera they read as a deeper black rather than as a shine, because the window's reflection falls away from the lens. On the copy stand, a small change of angle would catch the window in them.
- **The brush and dish** are modelled: a 15 mm flat with a birch handle under clear lacquer, a crimped nickel ferrule and wet black bristles, resting with its tail on the desk and its ferrule on the rim of a 64 mm porcelain dish holding a pool of ink. Without the brush, the dish read as a cup of coffee from above. The brush's bristles are a solid wedge with fine grooves, not separate hairs.
- **Light**: one window on the left, low (about 18 degrees), daylight at 6200 K. A dim bounce on the right stands in for the room, and the world is a flat dark grey. A ceiling fill was tested so the wet ink would reflect something, but it greyed everything and was dropped (test `t11_key_c60`).

## Render

- Scene: `ideas/03-blackout/scene.py`, args `--state first|key --camera desktop|phone --w --h --samples --out`, plus light and camera overrides. It uses `lookdev/lib_lookdev.py` (`render_setup`, `pbr`, `paint_mat`, `area_light`, `camera`, `post`, `render`). Textures come from `python3 ideas/03-blackout/make_pages.py` (writes `tex/`; deterministic seeds). Each render also writes `<out>.anchors.json` (where the kept lines and the page land in the frame); the HTML was placed from it.
- Cameras, all on the reader's side of the desk, leaning back from vertical as a handheld or copy-stand shot would:
  - first desktop: 85 mm at 0.63 m, tilted 9 degrees, f/5.6;
  - key desktop: 85 mm at 0.62 m, tilted 14 degrees, f/4 (the top and bottom of the frame fall slightly soft);
  - phone: 70 mm-equivalent framing on a 36 mm-tall sensor at 0.71 m, tilted 7 degrees, f/5.6.
- Cycles on CPU with OIDN (albedo and normal), adaptive threshold 0.03. The view transform is **Standard** at exposure -0.9, not AgX: AgX lifted black ink and black toner to charcoal grey on this low-contrast scene (tests t07 and t08). Post from `lib.post`: grain 0.06, vignette 0.24, lens dispersion 0.003, no glare.
- Every render went through `tools/render_idle.py`; all are logged in `lookdev/renders.jsonl` (`idea: 03-blackout`).

| Render | Size | Samples | Seconds |
|---|---|---|---|
| final_first_desktop (final pass) | 1440x900 | 28 | 104.1 (another agent's render overlapped all of it; the clean time in the first pass was 58.5) |
| final_key_desktop (final pass) | 1440x900 | 28 | 55.3 |
| final_first_phone (final pass) | 780x1688 | 20 | 42.4 |
| first pass of the three finals (superseded) | as above | as above | 169.2 (20 to 26 s overlapped in each) |
| 18 tests (t01-t15) | 640x400, 720x450, 390x844, a few 1440x900 at 8 samples | 8-12 | 214.0 |
| **Total** | | | **585 s (about 9.8 min)** |

The second pass fixed the brush width, so that fewer white gaps showed between strokes. It also splayed the bristle tip a little and lowered the sheet in the phone frame, so the audience line could sit on the desk instead of on the paper.

Raw renders: `out/ideas/03-blackout/final_*.png`; tests: `out/ideas/03-blackout/t*.png`, on one sheet in `tests/tests_sheet.jpg`. Mock pages: `ideas/03-blackout/mock/` (`blackout.css`, one HTML per image, relative paths to the renders and to `mock/fonts/`). Screenshots: `node ideas/03-blackout/mock/shoot.cjs` writes `visuals/raw/*.png` and the JPEGs at quality 85 (114, 103 and 125 KB).

## Assets and licences

| Asset | Used for | Licence |
|---|---|---|
| Poly Haven `oak_veneer_01` (already in the repo) | the desk, tinted to an ebonised dark walnut; the brush handle, lightened to birch | CC0 |
| Poly Haven `metal_plate` roughness (already in the repo) | roughness breakup on the nickel ferrule (via `paint_mat`) | CC0 |
| Ortica Angular Bold, Ortica Linear Bold (Benedetta Bovani and Collletttivo) | the type printed on the two pages | SIL OFL 1.1 (`docs/type/system/FONTLOG.md`) |
| Plimsoll Heavy (ours), Ortica Linear, B612 | the HTML layer, from `mock/fonts/` | OFL 1.1 |

No new assets were downloaded, and no HDRI is used. Everything else is modelled or drawn in `scene.py` and `make_pages.py`: the paper, print, ink, cockle, brush, dish and ink pool. No AI imagery, no stock photos.

## Left to decide or fix

- **The real thing should be shot.** The ink is the part a viewer will judge hardest. Our strokes are believable at page size, but a real brush in a real hand is less regular, and it is cheap to do. The 09 entry's plan (print, paint, copy stand, daylight) stands, and these images can serve as its shot list: framings, type size and where the HTML goes.
- **Corrected Edition and the redaction meme** (the 09 entry's risk): the ragged brush ends, dry tails, splatter and the brush in shot push it towards painting and away from a redacted document. It is still marks on printed text; James should judge.
- **Large type on the page** (about 32 pt on A4) is a choice made for the phone crop. It makes the page look more like a proof than a book page. If James wants a true book page, the phone crop has to change: one line per screen, or the sentence set as its own short paragraph.
- In image 1 the page's left margin is the brightest area on screen, next to the sentence. The sentence still wins the squint test because it is the only high-contrast detail inside the black, but a print with a narrower left margin would help.
- At the very left edge of image 2, lens dispersion puts a 2 to 3 px warm fringe on two slivers of white paper. It is real lens behaviour, and is left in.

## Review (art director and stranger pass, 2 Nov)

I looked at all three images at full size and at 100% crops, and measured the raw renders.

### Before the fixes: what would give it away

- **The paper was blown out.** Standard view clips at 1.0. On image 1, 13% of the frame was flat 255 white, which is the whole left margin and the area round the first line of the sentence. That erased the cockle exactly where it would prove the paper took wet ink, and it is why the margin was competing with the sentence. Image 3 had the same problem on 4.6% of the frame.
- **The ink was charcoal, not ink.** It measured about 40 to 47 sRGB, which reads as grey paint, not India ink.
- **There were rows of white dashes inside the ink.** They were perfectly level slits, 1 to 3 px tall, where the dry outer bristles of two overlapping strokes happened to line up. Nobody's hand leaves those, and on the phone at 1:1 they read as a digital glitch. This was the worst tell.
- **The dish and brush in image 2 look modelled.** The dish is a perfect lathed circle with a plastic-matte glaze. The ink pool is a black disc that reflects nothing, though every viewer knows a liquid shows the window. The bristles are one smooth wedge, and the ferrule is flat grey.
- **The paper in image 2 folds like fabric.** The soft diagonal swells through the dry ink at f/4 read as a satin sheet, not cockled paper.
- **Every stroke is level.** All are the same width and parallel to the type, with no bleed into the paper fibres and no darker ridge where one stroke overlaps another. At 100% it is a procedural brush, and the regularity is what an eye catches.
- **On the phone, the page's top edge is a straight horizontal line across the full width.** The screen therefore reads as a dark header band, a white body and a dark footer bar, which is a web layout and not a photo of a desk.
- **At a glance it still reads as a redacted document.** It is black bars over text, and the ragged dry ends and the drops only half rescue it.

### Five-second test (as a bootstrapped founder)

- **Image 1 and image 3:** I read "Every hire compounds complexity before it compounds capacity." first, because it is the only readable thing on the paper. Then I read that it is a book by Michael Wentz and that it is for teams of 1 to 12. The free Bootloader is the one button. Both pass the squint test.
- **Image 2 lands the idea without words.** The question left on the page, the button sitting on the wet ink under it, and the brush put down in its dish together say "the file is the last thing left, and it speaks to you". It is the strongest frame of the three.
- **The stills cannot show the pruning itself** (watching the page get inked). That needs the scroll.
- **The Bootloader as the obvious click:**
  - Image 2: yes.
  - Image 3: yes; the bar's button is the brightest UI shape on the screen.
  - Image 1: it is the only button, but it sits in the bottom-left corner far from the sentence. It is clear rather than obvious.
- **Text over text:** none. Nothing sits on the sentence. In image 2 the lockup and the button sit on ink, never on type.
- **Readability on the phone:** the sentence is about 33 CSS px and the labels are 11.5 px or larger, all readable.
- **Seen on James's iPhone, the desktop images shrink to about 27%.** The sentence stays readable there; the 13 px labels on the desk do not, as expected for a desktop mock.

### Copy

`node susd-options/tools/copycheck.mjs` on each of the three mock pages prints "1 sentences checked, 0 not found in Michael's text", both before and after the changes. No sentence was added.

### What I changed

1. **Ink texture: the slits are closed at the source.**
   - `make_pages.py` has a new `close_gaps()`, run on both sheets after the cut-in.
   - It fills a no-ink run only when all of these hold: it is at most 0.5 mm tall, it has ink directly above and below, and it is closed by ink at both ends of its row.
   - The dry tails at stroke ends open onto bare paper, so they are kept. The island round the kept line is kept too.
   - The generator is deterministic. Diffing against the old textures, only 0.08% of pixels changed, ink coverage never decreased, and the toner is identical.
   - `tex/` was regenerated.
2. **The one re-render: image 1.**
   - I picked it because it is the first screen and had the worst clipping.
   - The settings are the same as its final, except exposure -1.5 instead of -0.9 (0.6 EV darker) and the new ink texture.
   - It ran through `render_idle.py`: 59.9 s at 28 samples, with no other render overlapping it (logged as `blackout_review`). The anchors are unchanged.
   - The previous render is kept as `out/ideas/03-blackout/final_first_desktop_v1.png`.
3. **`grade.py`, a print grade on all three images.** It writes `out/ideas/03-blackout/*_graded.png`; the raw renders are untouched.
   - Highlights now roll off instead of clipping.
   - The ink goes from about 40-47 to about 24-28 sRGB. The wet strokes in image 2 stay darker than the dry ink.
   - Image 1 only: it gets 0.5 EV back, and the window-side margin is burned in by at most 0.25 EV, as a darkroom print would be. After the grade, clipping is 1.6%, all of it the thin edge of the under-sheet that faces the window; the paper itself keeps its cockle and its falloff from the window.
   - Images 2 and 3 only: they were rendered before the texture fix, so the same slits are spotted in 2D. They are filled from the ink above and below, with matching grain: 2,088 px on image 2 and 3,781 px on image 3. Nothing else is painted.
4. **Overlays** (`mock/*.html`), then re-shot with `shoot.cjs`:
   - The mocks now use the graded images.
   - I cut the scroll cue "Scroll: each page is painted out down to one line." because the 09 entry says pruning "is not explained; you watch it happen", and the cue explained it. It was also a fourth block of small text in the column.
   - "self-funded" now uses a non-breaking hyphen, so the line no longer breaks "self- / funded".
   - The Bootloader's facts now break on purpose ("A free file for your AI. / Version 16, 35,445 words.") instead of leaving "words." alone on a line.
   - The JPEGs are 116, 98 and 121 KB, and the filenames are unchanged.

### Still wrong (needs the real shoot, or more render time than a review has)

- **The dish and brush (image 2) are the weakest thing in the set.** For the shoot, either use a real brush and dish, or lay the brush on the page and drop the dish.
- **The paper in image 2 still has fabric-like folds.**
- **The strokes are too even:** all level, all the same width, with no bleed and no overlap ridges. A hand fixes this in minutes.
- **The phone page's top edge is a straight horizontal line,** which reads as a header band. A re-render would turn the sheet 4 to 6 degrees, or let the desk show on one side.
- **Images 2 and 3 were spotted in 2D; image 1 was fixed in the texture.** Re-rendering 2 and 3 from the current `tex/` would make all three come from the same source. That costs about 100 s through the queue.
- **The redacted-document and Corrected Edition risk is unchanged.**

### Verdict for James

- **Shows the idea: 7/10.** The sentence wins every first screen, and the key beat lands the Bootloader with no words of ours. The stills cannot show the pruning happening, and at a glance it can read as redaction.
- **Looks real: 6/10.** At phone size, images 1 and 3 pass as a photo of a painted page. At 100% the strokes are too regular. In image 2 the dish, the brush and the fabric-like folds look rendered.
- **Caption:** "A printed page of the book, painted out in black ink until only Michael's sentence is left; the last page leaves only the Bootloader's question, with the button on the wet ink under it. Blender stand-ins for a real hand-painted shoot."
- **What production needs:**
  - Print 5 or 6 manuscript pages with the type large, about 32 pt, or the kept sentence set as its own short paragraph.
  - Have Michael, or anyone with a steady hand, paint them out with India or sumi ink and a 15 to 20 mm flat brush.
  - Shoot on a copy stand in window light, with a white card on the shadow side and one angled frame that catches the window in the wet ink. Shoot about 100 frames, so the scroll can play the inking stroke by stroke.
  - Take one frame with the real brush put down.
  - Shoot the phone crops at the same session.
  - That is 2 to 3 days to shoot and 3 to 4 days to build. Materials cost under about $100, plus a photographer's day if nobody in house shoots.

# Renders

The story frames and the book shot are real Blender renders (Cycles), not AI images.
Everything here regenerates them from scratch.

The page opens on the cover's UP / SIDE / DOWN blocks lying face up on the table, seen from
above; scrolling stands them up and stacks them into the cover (45 frames, rendered in half steps). Then the story, in
340 frames: hires and tools are thrown on faster and faster, landing more crooked past Hire #12,
until the tower falls over
(simulated with rigid-body physics, then baked to keyframes). Then the rebuild, in the book's
order: Side lays the twelve systems from Chapter 10 as a foundation around the cover, colour-banded
like it (red Down systems, yellow Side, green Up); Down clears the dead weight; Up puts the same
team back on, on the systems, and the building keeps rising past where the rush fell.

| File | What it does |
| --- | --- |
| `make_textures.py` | Cuts the UP / SIDE / DOWN faces out of the cover photo, makes the stamped block labels, the spine and the page edges |
| `make_systems.py` | Paints the faces of the twelve system blocks (Content & Product … Product Quality) in the cover's style |
| `scene_setup.py` | Shared studio: cyclorama backdrop, wood and paint materials, lights, the three cover blocks |
| `story.py` | The scroll story (340 frames), camera moves and render settings; saves `foundation.blend` |
| `prologue.py` | The opening: the three cover blocks lie face up, seen from above, then stand up and stack while the camera cranes down to the story's hero shot (frame 28) |
| `render.sh` | Renders `foundation.blend` into `out/seq` (motion blur on the rush and the fall only) |
| `book.py` | The hardcover with the three blocks beside it (the link preview, `og.jpg`); with `--solo 1`, the hardcover alone on a transparent background, its shadow kept, for the hero |
| `closed.py` | The closed loop after the story: the row buried under what AI keeps adding, swept clear, then eleven systems set down in a ring (50 frames); Quality on its own in layers (block, shadow at rest and lifted) for the copy; a wide panorama of the same table with the book further along; and the page's COPY button, a long blank block in Quality's paint (red and green) with its shadows (`--shot copyblock`) |
| `render_closed.sh` | Renders all of `closed.py`'s shots; a stopped run picks up where it left off |
| `anchors.py` | Exports each frame's screen position of the labelled blocks, so the site can pin labels to them |

## Steps

1. Blender 4.5 LTS. Poly Haven (CC0) assets into `tex/`, 2K JPGs:
   `fine_grained_wood` (diff, rough, nor_gl), `ash_veneer` (diff, rough, nor_gl), and the `studio_small_09` HDRI saved as `tex/studio.hdr`.
   Fonts into `fonts/`: Libre Caslon Text Bold (`caslon_bold.ttf`), Playfair Display Black (`playfair_black.ttf`) and, for the hero's planks, Anton (`anton.ttf`).
2. `python3 make_textures.py <cover blocks photo> tex fonts` and `python3 make_systems.py tex fonts`
3. Story: `blender -b -P story.py -- --w 1600 --h 1000 --samples 18` saves `foundation.blend`, then `BLENDER=blender ./render.sh`.
   Opening: `blender -b foundation.blend -P prologue.py -- --out out/proseq/p --samples 18` (add `--proxy 1 --w 400 --h 250 --samples 6` for a quick look)
4. Anchors: `blender -b foundation.blend -P anchors.py -- out/anchors.json` (joined to the opening in step 7)
5. Book: `blender -b -P book.py -- --w 1500 --h 1500 --samples 128 --out out/book.png` and
   `blender -b -P book.py -- --solo 1 --w 1200 --h 1500 --samples 160 --out out/hero_book.png` (`tex/cover.jpg` is the front cover
   from the manuscript), then from the project root `python3 scripts/make_book_assets.py render/out/hero_book.png`
   (the hero's two WebP sizes in `public/book/`, `src/book.json`, and `public/og.jpg` from `out/book.png`)
6. Closed loop: `BLENDER=blender ./render_closed.sh` (or one shot at a time, `--proxy 1` for a quick framing check:
   `blender -b foundation.blend -P closed.py -- --shot seq|layers|pano --out out/clseq|out/closed`), then from the project root
   `python3 scripts/make_closed_assets.py render/out/closed render/out/clseq render/out/seq` (Quality's layers, the panorama, the footer seal,
   the proof pictures and `src/closed.json`), and pack the sequence:
   `python3 scripts/pack_frames.py render/out/clseq public/closed/hi --width 1600 --quality 78 --per 25`
   `python3 scripts/pack_frames.py render/out/clseq public/closed/lo --width 480 --quality 60 --per 50`
   The COPY button: `python3 scripts/make_copyblock_assets.py render/out/copyblock render/fonts/playfair_black.ttf`
   (the block's pictures, its stamp font and `src/copyblock.json`; it checks the stamp reads on both paints and that the red is Quality's)
7. Join the opening and the story, then pack the frames for the site, from the project root:
   `python3 scripts/sequence.py render/out/proseq render/out/seq render/out/site render/out/anchors.json public/anchors.json`
   `python3 scripts/pack_frames.py render/out/site public/frames/hi --width 1600 --quality 78 --per 25`
   `python3 scripts/pack_frames.py render/out/site public/frames/lo --width 480 --quality 60 --per 50`

The physics is deterministic, so the same scripts give the same fall every time. On a 4-core
CPU the story takes about 30 seconds a frame at these settings.

## The hero's planks (13 Nov): the words on the blocks

The first screen has no text column: the book's words are stamped on planks set down on the hero frame's
own table (the story's frame 28, the picture the opening lands on). SCALING stands beside UP / SIDE / DOWN as
on the cover; under them two planks read A BOOK BY MICHAEL WENTZ and FOR BOOTSTRAPPED FOUNDERS; in front, the
red JOIN THE FIRST-EDITION LIST is the page's one button. They are rendered as transparent layers with their
shadows (the table and the stack only catch shadows, and the stack casts none), from the same camera and
lights as the frame, so the page draws them over it. The render runs 30% below the frame (the lens shifted
down, the frame's own rows unchanged), so the planks can stand in front of the stack.

| File | What it does |
| --- | --- |
| `make_hero_labels.py` | Draws the planks' stamps into `tex/` (Anton, the cover's condensed face; `fonts/anton.ttf` from Google Fonts) |
| `hero_words.py` | The hero shot with the planks: `--mode calib` (the stack alone, to check it lands on frame 89's), `--mode look` (everything, opaque), `--mode layers` (`words.png`, `join_obj.png`, `join_shadow.png` and `layout.json`) |

1. `python3 make_hero_labels.py`
2. Check the camera still matches: `blender -b -P hero_words.py -- --mode calib --w 800 --h 500 --samples 8 --out out/hero/calib.png`
   and lay it over frame 89 (the blocks must sit exactly on the frame's)
3. `blender -b -P hero_words.py -- --mode layers --w 2000 --h 1250 --over 0.3 --samples 64 --out out/hero/final` (about 25 minutes on 4 cores)
4. From the project root: `python3 scripts/make_hero_assets.py render/out/hero/final` (`public/hero/`, two widths of each layer, and `src/hero.json`:
   where the arrangement and the button's face sit, in the frame's units)

To change a plank's words, change its stamp in `make_hero_labels.py` (and its size in `hero_words.py` if the words need more room), then run all four steps.
The stack's own textures are not needed here (it is only a shadow catcher): `tex/face_*.png` can be any flat colour.

## The home page's film since 14 Nov: the words on the blocks

The story has no words over it: no captions, labels or chapter rail (James, 14 Nov: "there's still like text
along the bottom. We have two focuses"). Every word is stamped on a block, and each moment has one thing moving.
`words_film.py` replaces `story.py`'s film from frame 29 (the page keeps the opening and the hero, frame 89):
- SCALING, the hero's lines and the red plank are in the scene, where the page's layers draw them, so the
  film carries straight on from the hero. The lines leave the shot as the camera rises.
- Three raw-wood planks are thrown on: ALWAYS ADDING, ALWAYS HIRING, ALWAYS LAUNCHING (L1993, read top down),
  then the hires and tools, faster and crooked. It falls over; SCALING stands.
- SCALING and the cover's stack turn upside down together (the title, upside down), hold, and are set right.
  SCALING steps aside.
- Three slabs in the cover's paints come in a row in front of the building, left to right, each in its own
  direction, and the camera pushes in to read each one before the action it starts:
  - SIDEWAYS FOR / STABILIZATION (yellow, L3316) slides in from the side; the twelve systems slide in.
  - DOWN FOR / PRUNING (red, L3317) is lowered from above; the dead weight, the ALWAYS planks with it, leaves.
  - UP FOR / GROWTH (green, L3315) rises out of the table; the team goes back on and the building rises.
- The last picture: SCALING beside the finished building, the three slabs in front.

| File | What it does |
| --- | --- |
| `make_words_labels.py` | The planks' and slabs' stamps (Anton) into `tex/` |
| `cover_faces.py`, `recover_faces.py` | The cover blocks' faces, recovered from the hero frame (the cover photo is not in the repo): where each face sits in frame 89, then rectified and evened out with the gains in `face_gains.json` |
| `words_film.py` | The film, camera and render settings; saves `words.blend` and `out/words_timeline.json` (its timeline, which the page's scroll keys follow) |
| `render_words.sh` | Renders `words.blend` into `out/wseq` (motion blur on the rush and the fall); a stopped run picks up where it left off |
| `words_anchors.py` | Each frame's subject (`src/wordsfilm.json`): where it sits and how big it is, so a phone keeps it whole on the screen; and the timeline |

1. Textures: `python3 make_systems.py tex fonts`; the rush blocks' labels are the `labels` part of `make_textures.py`
   (the rest of it needs the cover photo); `python3 make_hero_labels.py`; `python3 make_words_labels.py`.
   The cover faces: `blender -b -P cover_faces.py -- --w 1600 --h 1000 --out out/faces/corners.json`, then
   `python3 recover_faces.py out/faces/corners.json face_gains.json`
2. `blender -b -P words_film.py -- --blend words.blend` (add `--frames 54,165,199,277,325 --w 800 --h 500 --samples 8 --out out/wb/b` for stills)
3. `W=1600 H=1000 S=12 BLENDER=blender ./render_words.sh` (about 390 frames; `W=480 H=300 S=4 OUT=out/wprev` for a quick look)
4. `blender -b words.blend -P words_anchors.py -- ../src/wordsfilm.json`
5. From the project root, the opening and the hero copied byte for byte in front of the film:
   `python3 scripts/pack_frames.py render/out/wseq public/frames/hi --width 1600 --quality 78 --per 25 --lead <a copy of public/frames/hi>:90`
   `python3 scripts/pack_frames.py render/out/wseq public/frames/lo --width 480 --quality 60 --per 50 --lead <a copy of public/frames/lo>:90`
   (pack from a copy: the packer clears its output folder)

If the film's timing changes, re-run step 4: `STORY_KEYS` in `src/story.ts` read the timeline from it.

## The focus version's film (`/focus`): "Load Path"

Since 4 Nov the focus version plays `loadpath.py`, which has no words and no labels. It is an architect's
massing model on a stone site board, shot like model photography in low raking sun.
- **Act one:** a small white building (the cover's three tiers) is grown by doing everything at once.
  Volumes are dropped on top, annexes slide in from the sides, and one is pulled away again. It goes
  top-heavy, leans, racks and falls. The wreckage is cleared into the board.
- **Act two:** a concrete raft and core go in first. Then the tower is built one move at a time, each
  with one colour and one direction:
  - green storeys grow up out of its top, swaying a little;
  - ochre wings slide in level from both sides and lock it plumb;
  - the red annex that came up with the growth is lowered away into the ground.
- **Colour:** it marks only the work being done. A piece settles to white once it is in place, so the
  finished building is all plaster and stone.
- **The end:** three rounds, each cycle stepped back a little. The third climbs out through the exact
  frame the first tower fell in.

| File | What it does |
| --- | --- |
| `loadpath.py` | The scene, the animation (act one's fall is a hinge, then baked rigid-body physics), camera and render settings; saves `loadpath.blend` |
| `render_loadpath.sh` | Renders every frame of `loadpath.blend` into `out/lseq`; a stopped run picks up where it left off |
| `loadpath_anchors.py` | Each frame's subject: x, [top, bottom] and [left, right] in the picture, for the page's framing (`src/lpfilm.json`) |

1. `blender -b -P loadpath.py -- --blend loadpath.blend` (add `--frames 1,86,140,205 --w 960 --h 600 --samples 16 --out out/lpb/b` for stills)
2. `W=1600 H=1000 S=12 BLENDER=blender ./render_loadpath.sh` (386 frames, about 30 seconds each on 4 cores)
3. `blender -b loadpath.blend -P loadpath_anchors.py -- ../src/lpfilm.json`
4. From the project root:
   `python3 scripts/pack_frames.py render/out/lseq public/frames-lp/hi --width 1600 --quality 78 --per 25`
   `python3 scripts/pack_frames.py render/out/lseq public/frames-lp/lo --width 480 --quality 60 --per 50`

If the timing changes, re-run step 3 and check `KEYS` in `src/components/FocusPage.tsx` (the scroll's still beats).

## The earlier focus film (retired 4 Nov)

The focus version plays its own film, made from `story.py` with the blocks carrying the words: the
first three blocks on the stack are planks stamped ALWAYS LAUNCHING / ALWAYS HIRING / ALWAYS ADDING
(`make_focus_labels.py` draws their labels); after the fall the cover's stack turns upside down,
holds, and is set right; the systems slide in from the sides; the planks leave with the dead weight;
the building rises. It opens with the same 89 pictures as the home page.

| File | What it does |
| --- | --- |
| `focus_board.py` | The storyboard: seven key moments as stills (how the film was agreed) |
| `focus_film.py` | The film (frames 28-332 are used), camera and render settings; saves `focus.blend` |
| `render_focus.sh` | Renders `focus.blend` into `out/fseq`; a stopped run picks up where it left off |
| `focus_anchors.py` | Where the subject sits in each frame, and the outline of each held moment, for the page's lines (`src/focusfilm.json`) |

1. `python3 make_focus_labels.py` (the planks' labels, into `tex/`)
2. `blender -b -P focus_film.py -- --w 1440 --h 900 --samples 14 --blend focus.blend --out out/ftest/t`
   (add `--frames 55,106,147,163,223,245,332` and `--w 640 --h 400 --samples 8` for a quick look at the holds)
3. `W=1600 H=1000 S=12 BLENDER=blender ./render_focus.sh` (frames 28-146 with motion blur, then 147-332 without;
   about 27-37 seconds a frame on 4 cores; delete any empty PNG a stopped run left before running it again)
4. `blender -b focus.blend -P focus_anchors.py -- ../src/focusfilm.json`
5. From the project root, the opening's pictures copied byte for byte in front of the film:
   `python3 scripts/pack_frames.py render/out/fseq-site public/frames-focus/hi --width 1600 --quality 78 --per 25 --lead public/frames/hi:89`
   `python3 scripts/pack_frames.py render/out/fseq-site public/frames-focus/lo --width 480 --quality 60 --per 50 --lead public/frames/lo:89`
   where `render/out/fseq-site` holds the film's frames 28-332 (`f0028.png`…`f0332.png`).

If the film's timing changes, re-run step 4 and keep `FOCUS_FILM_KEYS` and `FOCUS_LINES` in `src/story.ts` in step.

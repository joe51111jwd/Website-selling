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
| `book.py` | The hardcover with the three blocks beside it |
| `closed.py` | The closed loop after the story: the row buried under what AI keeps adding, swept clear, then eleven systems set down in a ring (50 frames); Quality on its own in layers (block, shadow at rest and lifted) for the copy; and a wide panorama of the same table with the book further along |
| `render_closed.sh` | Renders all of `closed.py`'s shots; a stopped run picks up where it left off |
| `anchors.py` | Exports each frame's screen position of the labelled blocks, so the site can pin labels to them |

## Steps

1. Blender 4.5 LTS. Poly Haven (CC0) assets into `tex/`, 2K JPGs:
   `fine_grained_wood` (diff, rough, nor_gl), `ash_veneer` (diff, rough, nor_gl), and the `studio_small_09` HDRI saved as `tex/studio.hdr`.
   Fonts into `fonts/`: Libre Caslon Text Bold (`caslon_bold.ttf`) and Playfair Display Black (`playfair_black.ttf`).
2. `python3 make_textures.py <cover blocks photo> tex fonts` and `python3 make_systems.py tex fonts`
3. Story: `blender -b -P story.py -- --w 1600 --h 1000 --samples 18` saves `foundation.blend`, then `BLENDER=blender ./render.sh`.
   Opening: `blender -b foundation.blend -P prologue.py -- --out out/proseq/p --samples 18` (add `--proxy 1 --w 400 --h 250 --samples 6` for a quick look)
4. Anchors: `blender -b foundation.blend -P anchors.py -- out/anchors.json` (joined to the opening in step 7)
5. Book: `blender -b -P book.py -- --w 1500 --h 1500 --samples 128 --out out/book.png`
6. Closed loop: `BLENDER=blender ./render_closed.sh` (or one shot at a time, `--proxy 1` for a quick framing check:
   `blender -b foundation.blend -P closed.py -- --shot seq|layers|pano --out out/clseq|out/closed`), then from the project root
   `python3 scripts/make_closed_assets.py render/out/closed render/out/clseq render/out/seq` (Quality's layers, the panorama, the footer seal,
   the proof pictures and `src/closed.json`), and pack the sequence:
   `python3 scripts/pack_frames.py render/out/clseq public/closed/hi --width 1600 --quality 78 --per 25`
   `python3 scripts/pack_frames.py render/out/clseq public/closed/lo --width 480 --quality 60 --per 50`
7. Join the opening and the story, then pack the frames for the site, from the project root:
   `python3 scripts/sequence.py render/out/proseq render/out/seq render/out/site render/out/anchors.json public/anchors.json`
   `python3 scripts/pack_frames.py render/out/site public/frames/hi --width 1600 --quality 78 --per 25`
   `python3 scripts/pack_frames.py render/out/site public/frames/lo --width 480 --quality 60 --per 50`

The physics is deterministic, so the same scripts give the same fall every time. On a 4-core
CPU the story takes about 30 seconds a frame at these settings.

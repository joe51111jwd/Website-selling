# Renders

The story frames and the book shot are real Blender renders (Cycles), not AI images.
Everything here regenerates them from scratch.

| File | What it does |
| --- | --- |
| `make_textures.py` | Cuts the UP / SIDE / DOWN faces out of the cover photo, makes the stamped block labels, the spine and the page edges |
| `scene_setup.py` | Shared studio: cyclorama backdrop, wood and paint materials, lights, the three cover blocks |
| `story.py` | The scroll story (300 frames): intro drop, growth, sway, physics collapse at hire #12 (simulated, then baked to keyframes), Side / Down / Up rebuild, camera moves |
| `book.py` | The hardcover with the three blocks beside it |
| `anchors.py` | Exports each frame's screen position of every block, so the site can pin labels to them |

## Steps

1. Blender 4.5 LTS. Poly Haven (CC0) assets into `tex/`, 2K JPGs:
   `fine_grained_wood` (diff, rough, nor_gl), `ash_veneer` (diff, rough, nor_gl), and the `studio_small_09` HDRI saved as `tex/studio.hdr`.
   Fonts into `fonts/`: Libre Caslon Text Bold (`caslon_bold.ttf`) and Playfair Display Black (`playfair_black.ttf`).
2. `python3 make_textures.py <cover blocks photo> tex fonts`
3. Story: `blender -b -P story.py -- --w 1600 --h 1000 --samples 18 --render 0` saves `story.blend`, then
   `blender -b story.blend -o out/seq/f#### -x 1 -F PNG -s 1 -e 300 -a`
4. Anchors: `blender -b story.blend -P anchors.py -- ../public/anchors.json`
5. Book: `blender -b -P book.py -- --w 1500 --h 1500 --samples 128 --out out/book.png`
6. Pack frames for the site from the project root:
   `python3 scripts/pack_frames.py render/out/seq public/frames/hi --width 1600 --quality 78 --per 25`
   `python3 scripts/pack_frames.py render/out/seq public/frames/lo --width 480 --quality 60 --per 50`

On a 4-core CPU the story takes about 40 seconds a frame at these settings.

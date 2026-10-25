# andrewdrish.com

Static site, deployed on Vercel. No build step.

- `index.html`, `styles.css`, `main.js`: the page.
- `frames/`: 48 Blender (Cycles) renders of the dawn camera move down the dock, scrubbed by scroll.
- `api/pitch.js`: receives "Bring me a deal" submissions (logs them for now).
- `tools/lake-scene.py`: the Blender scene. Re-render with
  `SAZ=-6 SEL=2.2 python tools/lake-scene.py out 1440 810 16 1 48` (needs `pip install bpy`), then convert PNGs to WebP (quality 74).

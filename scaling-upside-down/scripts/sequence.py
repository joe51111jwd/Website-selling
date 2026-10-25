"""Join the opening and the film into the one sequence the page scrolls through.

  python3 scripts/sequence.py render/out/proseq render/out/seq render/out/site [film_anchors.json public/anchors.json]

The opening (render/prologue.py) is 89 pictures, frames 1-45 and the half-frames between them
(pNNNN.png, pNNNNh.png): the three blocks lying face up, standing up, stacking. It ends on the film's frame 28, so the film (render/story.py) joins from there; the film's
first 27 frames (its old drop-in intro) are left out. With the anchors arguments it also writes the
label positions for the joined sequence (the opening has no labels). Keep OPENING in src/story.ts in step.
"""
import json
import os
import re
import sys

OPENING = 89
FILM_FROM = 28  # 1-based Blender frame

opening, film, out = sys.argv[1:4]
os.makedirs(out, exist_ok=True)
for f in os.listdir(out):
    if f.endswith(".png"):
        os.remove(os.path.join(out, f))


def num(name):
    return int(re.findall(r"\d+", name)[-1])


op = sorted(f for f in os.listdir(opening) if f.endswith(".png"))[:OPENING]
fm = sorted((f for f in os.listdir(film) if f.endswith(".png") and num(f) >= FILM_FROM), key=num)
if len(op) != OPENING:
    sys.exit(f"expected {OPENING} opening frames, found {len(op)}")
for n, src in enumerate([os.path.join(opening, f) for f in op] + [os.path.join(film, f) for f in fm], 1):
    os.symlink(os.path.abspath(src), os.path.join(out, f"s{n:04d}.png"))
print("frames", len(op) + len(fm))

if len(sys.argv) > 5:
    a = json.load(open(sys.argv[4]))
    a["frames"] = [{} for _ in range(OPENING)] + a["frames"][FILM_FROM - 1 :]
    json.dump(a, open(sys.argv[5], "w"), separators=(",", ":"))
    print("anchors", len(a["frames"]))

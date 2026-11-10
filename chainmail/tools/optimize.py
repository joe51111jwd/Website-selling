#!/usr/bin/env python3
"""Publish Blender finals: blender/out/**/*.png -> site/public/renders/**/*.webp

Each still is written at its native size (name.webp) plus a half-size
(name@half.webp) for small screens. Image sequences (any folder named
`sequence*`) get frames at 1280 and 720 px wide in `<dir>/1280/` and `<dir>/720/`
plus a manifest.json. Alpha is preserved. Usage:

    python3 chainmail/tools/optimize.py            # everything
    python3 chainmail/tools/optimize.py goods      # only paths containing 'goods'
"""
import json, os, sys
from PIL import Image

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
SRC = os.path.join(ROOT, "blender", "out")
DST = os.path.join(ROOT, "site", "public", "renders")
filt = sys.argv[1] if len(sys.argv) > 1 else ""

def load(path):
    im = Image.open(path)
    if im.mode in ("I;16", "I;16B", "I"):
        im = im.point(lambda v: v / 257).convert("L")
    return im.convert("RGBA") if "A" in im.getbands() else im.convert("RGB")

def save(im, out, q):
    os.makedirs(os.path.dirname(out), exist_ok=True)
    im.save(out, "WEBP", quality=q, method=6, alpha_quality=90)

seqs = {}
for dp, _, files in os.walk(SRC):
    for f in sorted(files):
        if not f.lower().endswith(".png"):
            continue
        src = os.path.join(dp, f)
        rel = os.path.relpath(src, SRC)
        if filt and filt not in rel:
            continue
        top = os.path.dirname(rel)
        if any(part.startswith("sequence") for part in top.split(os.sep)):
            seqs.setdefault(top, []).append(src)
            continue
        im = load(src)
        base = os.path.join(DST, os.path.splitext(rel)[0])
        save(im, base + ".webp", 86)
        half = im.resize((im.width // 2, im.height // 2), Image.LANCZOS)
        save(half, base + "@half.webp", 84)
        print("still", rel, im.size)

for top, frames in seqs.items():
    frames.sort()
    meta = {"count": len(frames), "sizes": {}}
    for w in (1280, 720):
        for i, src in enumerate(frames):
            im = load(src)
            h = round(im.height * w / im.width)
            save(im.resize((w, h), Image.LANCZOS), os.path.join(DST, top, str(w), f"{i:04d}.webp"), 78 if w == 1280 else 72)
        meta["sizes"][str(w)] = {"width": w, "height": h, "pattern": f"/renders/{top}/{w}/{{i}}.webp", "pad": 4}
    with open(os.path.join(DST, top, "manifest.json"), "w") as fh:
        json.dump(meta, fh, indent=2)
    print("sequence", top, len(frames), "frames")

"""Pack a rendered PNG sequence for the site: resize, encode WebP (alpha kept), write a manifest.

    python3 scripts/pack.py blender/out/turn/burger turn-burger --width 900 --quality 78
    python3 scripts/pack.py blender/out/film/burger film-burger --width 1000 --quality 80 --anchors

Writes public/seq/<name>/0001.webp ... and public/seq/<name>/manifest.json
({count, width, height, ext, v}; v is a hash of the frames, used as a cache-busting query).
With --anchors, copies the film's anchors.json alongside.
"""
import argparse
import glob
import hashlib
import json
import os
import shutil

from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("src")
    ap.add_argument("name")
    ap.add_argument("--width", type=int, default=900)
    ap.add_argument("--quality", type=int, default=78)
    ap.add_argument("--anchors", action="store_true")
    a = ap.parse_args()

    files = sorted(f for f in glob.glob(os.path.join(a.src, "[0-9][0-9][0-9][0-9].png")))
    if not files:
        raise SystemExit(f"no frames in {a.src}")
    dst = os.path.join(ROOT, "public", "seq", a.name)
    if os.path.isdir(dst):
        shutil.rmtree(dst)
    os.makedirs(dst)
    h = hashlib.sha1()
    size = None
    for i, f in enumerate(files):
        im = Image.open(f)
        im = im.convert("RGBA") if im.mode in ("RGBA", "LA", "P") else im.convert("RGB")
        if im.width != a.width:
            im = im.resize((a.width, round(im.height * a.width / im.width)), Image.LANCZOS)
        size = im.size
        out = os.path.join(dst, f"{i + 1:04d}.webp")
        im.save(out, "WEBP", quality=a.quality, method=6, alpha_quality=90)
        with open(out, "rb") as fh:
            h.update(fh.read())
    manifest = {"count": len(files), "width": size[0], "height": size[1], "ext": "webp", "v": h.hexdigest()[:10]}
    with open(os.path.join(dst, "manifest.json"), "w") as fh:
        json.dump(manifest, fh)
    if a.anchors:
        shutil.copy(os.path.join(a.src, "anchors.json"), os.path.join(dst, "anchors.json"))
    total = sum(os.path.getsize(p) for p in glob.glob(os.path.join(dst, "*.webp")))
    print(f"{a.name}: {len(files)} frames {size[0]}x{size[1]}, {total / 1e6:.1f} MB")


if __name__ == "__main__":
    main()

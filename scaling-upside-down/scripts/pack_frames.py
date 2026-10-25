# Pack a rendered PNG sequence into a few WebP chunk files plus a manifest.
# The site fetches chunks progressively and slices individual frames out of them,
# which keeps the file count low (artifact and CDN friendly) and requests few.
# Chunk names carry a content hash, so they can be cached forever.
#
#   python3 pack_frames.py <png_dir> <out_dir> [--width 1600] [--quality 78] [--per 25]
import hashlib
import json
import os
import sys
from io import BytesIO

from PIL import Image

src, dst = sys.argv[1], sys.argv[2]
opts = dict(zip(sys.argv[3::2], sys.argv[4::2]))
width = int(opts.get("--width", 1600))
quality = int(opts.get("--quality", 78))
per = int(opts.get("--per", 25))

files = sorted(f for f in os.listdir(src) if f.endswith(".png"))
os.makedirs(dst, exist_ok=True)
for f in os.listdir(dst):
    if f.endswith(".bin") or f == "manifest.json":
        os.remove(os.path.join(dst, f))

frames, chunks = [], []
buf, chunk_i = bytearray(), 0
w = h = 0
for n, name in enumerate(files):
    im = Image.open(os.path.join(src, name)).convert("RGB")
    if im.width != width:
        im = im.resize((width, round(im.height * width / im.width)), Image.LANCZOS)
    w, h = im.size
    b = BytesIO()
    im.save(b, "WEBP", quality=quality, method=6)
    data = b.getvalue()
    frames.append([chunk_i, len(buf), len(data)])
    buf += data
    if (n + 1) % per == 0 or n == len(files) - 1:
        cname = f"c{chunk_i:02d}-{hashlib.sha1(buf).hexdigest()[:8]}.bin"
        with open(os.path.join(dst, cname), "wb") as fh:
            fh.write(buf)
        chunks.append(cname)
        buf, chunk_i = bytearray(), chunk_i + 1

manifest = {"count": len(frames), "width": w, "height": h, "chunks": chunks, "frames": frames}
with open(os.path.join(dst, "manifest.json"), "w") as fh:
    json.dump(manifest, fh, separators=(",", ":"))
total = sum(os.path.getsize(os.path.join(dst, c)) for c in chunks)
print(f"{len(frames)} frames, {len(chunks)} chunks, {total / 1e6:.1f} MB, {w}x{h}")

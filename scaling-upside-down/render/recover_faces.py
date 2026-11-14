# Rectify the cover blocks' front faces out of the hero frame (page frame 89 = story frame 28) into
# tex/face_{up,side,down}.png, the textures scene_setup.py paints the cover stack with.
#   python3 recover_faces.py out/faces/corners.json [gains.json]
# corners.json comes from cover_faces.py. The frame already holds the studio's light, so the faces are evened
# out (each face's own light falloff divided away, then a gain) before they are used as paint: check with
# cover_faces.py --render 1 against the frame, and adjust the gain until the stack matches.
import io, json, os, sys

from PIL import Image, ImageFilter, ImageStat

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
corners = json.load(open(sys.argv[1]))
# per face, per channel: what turns the frame's lit colour back into paint (found by matching renders to the frame)
gains = json.load(open(sys.argv[2])) if len(sys.argv) > 2 else {}
base = os.path.join(ROOT, "public", "frames", "hi")
m = json.load(open(os.path.join(base, "manifest.json")))
c, off, ln = m["frames"][89]
data = open(os.path.join(base, m["chunks"][c]), "rb").read()
frame = Image.open(io.BytesIO(data[off : off + ln])).convert("RGB")
assert frame.size == (corners["w"], corners["h"]), frame.size

for k, q in corners["faces"].items():
    gain = gains.get(k, [1.0, 1.0, 1.0])
    flat = [v for p in q for v in p]
    face = frame.transform((1024, 1024), Image.QUAD, flat, resample=Image.BICUBIC)
    # the light falls off across each face (brighter top left, toward the key): divide out a very soft version of
    # the face's own brightness, keeping its mean, so the render's light is not painted on twice
    lum = face.convert("L").filter(ImageFilter.GaussianBlur(220))
    mean = ImageStat.Stat(lum).mean[0]
    px = face.load()
    lp = lum.load()
    # the colour correction is for the paint; the cream and black lettering takes only its brightness, so it stays
    # cream and black (blended by how saturated each pixel is)
    flat_g = 0.3 * gain[0] + 0.59 * gain[1] + 0.11 * gain[2]
    for y in range(1024):
        for x in range(1024):
            s = mean / max(1, lp[x, y])
            r, g, b = px[x, y]
            hi, lo = max(r, g, b), min(r, g, b)
            sat = min(1.0, max(0.0, ((hi - lo) / max(1, hi) - 0.12) / 0.28))
            # (the cream lettering a touch brighter: the paint's grain and coat dull it in the render)
            lift = 1.0 + 0.16 * (1 - sat) * max(0.0, min(1.0, (hi - 150) / 60))
            px[x, y] = tuple(min(255, int(v * s * lift * (flat_g + (gain[i] - flat_g) * sat))) for i, v in enumerate((r, g, b)))
    face = face.filter(ImageFilter.UnsharpMask(radius=3, percent=60, threshold=2))
    face.save(os.path.join(HERE, "tex", f"face_{k}.png"))
    print("face", k, "mean", round(mean, 1))

"""Tint, glow, crop and pack the Blender renders into the site's heads.

    python tools/post.py <render dir> <public dir>

Each head is mapped through its own colour ramp (the deck's look: one hue from ink to near-white), the LED
pass is laid on top in a hotter version of the same hue with a soft bloom, then the picture is cropped to
its alpha and saved as WEBP. Screen corners and marks are rescaled into fractions of the cropped picture
and written to heads.json, which the site reads.
"""
import json, sys
import numpy as np
from PIL import Image, ImageFilter

SRC, DST = sys.argv[1], sys.argv[2]

RAMPS = {  # stops: position, hex
    "video": [(0, "#020624"), (0.32, "#0a1fb0"), (0.62, "#3d6bff"), (0.86, "#b9ccff"), (1, "#f4f7ff")],
    "music": [(0, "#011205"), (0.3, "#06620f"), (0.6, "#1fd12a"), (0.86, "#b7ffa8"), (1, "#f4fff0")],
    "merch": [(0, "#1a0202"), (0.3, "#7a0a08"), (0.6, "#ea2a1e"), (0.86, "#ffb9a8"), (1, "#fff3ef")],
    "tour": [(0, "#1c0800"), (0.3, "#8a3a00"), (0.6, "#ff8a12"), (0.86, "#ffd99a"), (1, "#fffaf0")],
}
LED = {"video": "#ff7a1a", "music": "#ff2a1a", "merch": "#ff2414", "tour": "#ffb02a"}

def hexrgb(h):
    return np.array([int(h[i:i + 2], 16) for i in (1, 3, 5)], dtype=np.float32) / 255

def ramp(stops, t):
    xs = np.array([p for p, _ in stops]); cs = np.stack([hexrgb(c) for _, c in stops])
    return np.stack([np.interp(t, xs, cs[:, i]) for i in range(3)], axis=-1)

out = {}
for v in RAMPS:
    raw = np.asarray(Image.open(f"{SRC}/{v}_raw.png").convert("RGBA")).astype(np.float32) / 255
    led = np.asarray(Image.open(f"{SRC}/{v}_led.png").convert("RGBA")).astype(np.float32) / 255
    a = raw[..., 3]
    lum = raw[..., 0] * 0.3 + raw[..., 1] * 0.59 + raw[..., 2] * 0.11
    lum = np.clip((lum - 0.03) / 0.85, 0, 1) ** 1.25
    rgb = ramp(RAMPS[v], lum)
    m = led[..., 3] * np.clip(led[..., :3].max(-1) * 1.4, 0, 1)
    hot = hexrgb(LED[v])
    glow = np.asarray(Image.fromarray((m * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(9))).astype(np.float32) / 255
    core = np.clip(m[..., None] * (hot * 0.6 + 0.55), 0, 1)
    rgb = rgb * (1 - m[..., None]) + core
    rgb = 1 - (1 - rgb) * (1 - glow[..., None] * hot * 0.9)
    alpha = np.clip(np.maximum(a, glow * 0.85), 0, 1)
    img = Image.fromarray((np.dstack([np.clip(rgb, 0, 1), alpha]) * 255).astype(np.uint8), "RGBA")
    x0, y0, x1, y1 = img.getbbox()
    pad = 8
    x0, y0, x1, y1 = max(0, x0 - pad), max(0, y0 - pad), min(img.width, x1 + pad), min(img.height, y1 + pad)
    img = img.crop((x0, y0, x1, y1))
    w, h = img.size
    img.save(f"{DST}/{v}.webp", quality=90, method=6)
    img.resize((w // 2, h // 2), Image.LANCZOS).save(f"{DST}/{v}-sm.webp", quality=88, method=6)
    d = json.load(open(f"{SRC}/{v}.json"))
    fx = lambda p: [round((p[0] - x0) / w, 4), round((p[1] - y0) / h, 4)]
    out[v] = {
        "src": f"{v}.webp", "srcSm": f"{v}-sm.webp", "aspect": round(w / h, 4),
        "screens": {k: {"quad": [fx(p) for p in s["quad"]], "round": s["round"]} for k, s in d["screens"].items()},
        "marks": {k: [fx(p) for p in ps] for k, ps in d["marks"].items()},
    }
    print(v, w, h)
json.dump(out, open(f"{DST}/heads.json", "w"), indent=1)

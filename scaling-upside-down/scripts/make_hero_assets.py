# The hero's planks for the page (render/hero_words.py's layers): WebP in two sizes, and src/hero.json.
#   python3 scripts/make_hero_assets.py render/out/hero
# Layers: words (SCALING beside the stack and the two lines, with their shadows), join (the red plank
# alone), join_shadow (its shadow alone). Each is the hero frame's own picture, extended below by the
# render's overscan, so the page draws it exactly where it draws the frame (and below it).
# hero.json, in the hero frame's units (x 0-1 across it, y 0-1 down it, so y > 1 is below the frame):
#   over:  how far the layers run below the frame
#   box:   the whole arrangement (the stack, its title plank, the lines and the button, with their shadows)
#   fit:   the same without the shadows (what must stay on screen)
#   join:  the button's stamped face (four corners: top left, top right, bottom right, bottom left)
#   files: the hashed file names, per layer and width
import hashlib, json, os, sys

from PIL import Image

src = sys.argv[1]
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "public", "hero")
os.makedirs(OUT, exist_ok=True)
for f in os.listdir(OUT):
    os.remove(os.path.join(OUT, f))

lay = json.load(open(os.path.join(src, "layout.json")))
W, H, FH = lay["w"], lay["h"], lay["frame_h"]
LAYERS = {"words": "words.png", "join": "join_obj.png", "join_shadow": "join_shadow.png"}
WIDTHS = [2000, 1100]

files = {}
alpha_box = None
for key, name in LAYERS.items():
    im = Image.open(os.path.join(src, name)).convert("RGBA")
    assert im.size == (W, H), (name, im.size)
    # the arrangement's extent: anything clearly drawn (a shadow's faint tail does not count)
    a = im.getchannel("A").point(lambda v: 255 if v > 40 else 0)
    b = a.getbbox()
    if b:
        alpha_box = b if alpha_box is None else (min(alpha_box[0], b[0]), min(alpha_box[1], b[1]), max(alpha_box[2], b[2]), max(alpha_box[3], b[3]))
    files[key] = {}
    for w in WIDTHS:
        h = round(H * w / W)
        out = im.resize((w, h), Image.LANCZOS) if w != W else im
        tmp = os.path.join(OUT, "_tmp.webp")
        out.save(tmp, "WEBP", quality=86, method=6, alpha_quality=90, exact=False)
        digest = hashlib.sha1(open(tmp, "rb").read()).hexdigest()[:8]
        fname = f"{key.replace('_', '-')}-{w}-{digest}.webp"
        os.replace(tmp, os.path.join(OUT, fname))
        files[key][str(w)] = fname

# the stack's own extent in the frame (story.ts HERO_STACK), so the box holds the whole arrangement
STACK = {"l": 0.54, "r": 0.73, "t": 0.15, "b": 0.808}
x0, y0, x1, y1 = alpha_box
box = {
    "l": round(min(x0 / W, STACK["l"]), 4),
    "t": round(min(y0 / FH, STACK["t"]), 4),
    "r": round(max(x1 / W, STACK["r"]), 4),
    "b": round(max(y1 / FH, STACK["b"]), 4),
}
faces = {k: [[x, y * H / FH] for x, y in q] for k, q in lay["faces"].items()}
join = [[round(x, 4), round(y, 4)] for x, y in faces["join"]]
# fit: the solid things only (the stack and the planks' stamped faces, a little round them): the page fits
# this to a narrow screen and lets the soft ends of the shadows run off its sides
pts = [p for q in faces.values() for p in q]
fit = {
    "l": round(min(min(x for x, _ in pts), STACK["l"]) - 0.012, 4),
    "t": round(min(min(y for _, y in pts), STACK["t"]) - 0.012, 4),
    "r": round(max(max(x for x, _ in pts), STACK["r"]) + 0.012, 4),
    "b": round(max(max(y for _, y in pts), STACK["b"]) + 0.03, 4),
}
data = {"over": round(H / FH - 1, 4), "box": box, "fit": fit, "join": join, "files": files}
json.dump(data, open(os.path.join(ROOT, "src", "hero.json"), "w"), indent=1)
print(json.dumps({k: v for k, v in data.items() if k != "files"}))
print("sizes:", {f: os.path.getsize(os.path.join(OUT, f)) for f in sorted(os.listdir(OUT))})

# Build the textures the Blender scenes use.
#   python3 make_textures.py <cover_blocks.jpg> <out_tex_dir> <fonts_dir>
# cover_blocks.jpg is the photo of the three blocks from the book cover.
# Needs Pillow. Wood scans and the studio HDRI come from Poly Haven (CC0), see README.
import sys

from PIL import Image, ImageDraw, ImageFont

src, out, fonts = sys.argv[1], sys.argv[2], sys.argv[3]
caslon = f"{fonts}/caslon_bold.ttf"
playfair = f"{fonts}/playfair_black.ttf"

# front faces of the cover blocks, rectified from the photo (corners: TL, BL, BR, TR)
photo = Image.open(src).convert("RGB")
quads = {
    "up": [(41, 45), (40, 404), (395, 399), (393, 24)],
    "side": [(12, 419), (10, 737), (380, 736), (378, 401)],
    "down": [(31, 746), (30, 1076), (404, 1086), (405, 741)],
}
for name, q in quads.items():
    flat = [c for p in q for c in p]
    photo.transform((1024, 1024), Image.QUAD, flat, resample=Image.BICUBIC).save(f"{out}/face_{name}.png")

# stamped labels for the blocks a founder keeps adding
labels = {
    "hire6": "HIRE\n#6", "hire9": "HIRE\n#9", "hire12": "HIRE\n#12", "hire15": "HIRE\n#15",
    "slack": "SLACK", "crm": "CRM", "agency": "AGENCY", "ops": "OPS\nLEAD", "sops": "SOPs",
    "ai": "AI\nTOOLS", "sku": "NEW\nSKU", "burn": "$12K\n/MO", "apps": "43\nAPPS", "meet": "MEET-\nINGS",
    "systems": "SYSTEMS",
}
for key, text in labels.items():
    im = Image.new("RGBA", (1024, 1024), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    lines = text.split("\n")
    size = 330 if len(lines) == 1 else 250
    while True:
        font = ImageFont.truetype(caslon, size)
        widths = [d.textlength(line, font=font) for line in lines]
        if max(widths) < 760:
            break
        size -= 10
    lh = size * 1.02
    y = 512 - lh * len(lines) / 2
    for line, w in zip(lines, widths):
        d.text((512 - w / 2, y), line, font=font, fill=(18, 15, 12, 255))
        y += lh
    im.save(f"{out}/label_{key}.png")

# hardcover spine and page edges
spine = Image.new("RGB", (240, 3600), (240, 234, 221))
title = Image.new("RGBA", (3600, 240), (0, 0, 0, 0))
dt = ImageDraw.Draw(title)
dt.text((260, 52), "SCALING UP-SIDE-DOWN", font=ImageFont.truetype(playfair, 120), fill=(24, 20, 16, 255))
dt.text((2500, 82), "MICHAEL WENTZ", font=ImageFont.truetype(caslon, 70), fill=(24, 20, 16, 255))
for i, c in enumerate([(36, 84, 52), (222, 168, 48), (165, 38, 30)]):
    dt.rectangle((3200, 40 + i * 58, 3420, 84 + i * 58), fill=c + (255,))
title = title.rotate(-90, expand=True)
spine.paste(title, (0, 0), title)
spine.save(f"{out}/spine.png")

pages = Image.new("RGB", (1024, 256), (244, 239, 228))
dp = ImageDraw.Draw(pages)
seed = 3
for y in range(256):
    seed = (seed * 1103515245 + 12345) % 2**31
    v = seed % 21 - 14
    dp.line([(0, y), (1024, y)], fill=(232 + v, 226 + v, 212 + v))
pages.save(f"{out}/pages.png")
print("textures written to", out)

# Faces for the twelve system blocks (Chapter 10, "One Architecture"): four per phase,
# painted in the cover's phase colours with stamped type like the UP / SIDE / DOWN blocks.
#   python3 make_systems.py <out_tex_dir> <fonts_dir>
import sys

from PIL import Image, ImageDraw, ImageFilter, ImageFont

out, fonts = sys.argv[1], sys.argv[2]
face = f"{fonts}/playfair_black.ttf"

PHASES = {  # paint (sRGB), ink
    "up": ((31, 74, 43), (241, 230, 207)),
    "side": ((224, 154, 36), (24, 20, 16)),
    "down": ((151, 32, 26), (241, 230, 207)),
}
SYSTEMS = {
    "up": {"content": "CONTENT\n& PRODUCT", "leads": "LEAD\nGEN", "conversion": "CONVER-\nSION", "retention": "RETEN-\nTION"},
    "side": {"roles": "TEAM &\nROLES", "systematize": "SYSTEM-\nATIZE", "tech": "TECH\n& AI", "fulfillment": "FULFILL-\nMENT"},
    "down": {"profit": "PROFIT", "risk": "RISK", "efficiency": "EFFICI-\nENCY", "quality": "QUALITY"},
}

for phase, items in SYSTEMS.items():
    paint, ink = PHASES[phase]
    for key, text in items.items():
        im = Image.new("RGB", (1024, 1024), paint)
        layer = Image.new("RGBA", (1024, 1024), (0, 0, 0, 0))
        d = ImageDraw.Draw(layer)
        lines = text.split("\n")
        size = 236 if len(lines) == 1 else 206
        while True:
            font = ImageFont.truetype(face, size)
            widths = [d.textlength(line, font=font) for line in lines]
            if max(widths) < 800:
                break
            size -= 8
        lh = size * 1.0
        y = 512 - lh * len(lines) / 2 - size * 0.08
        for line, w in zip(lines, widths):
            d.text((512 - w / 2, y), line, font=font, fill=ink + (255,))
            y += lh
        # stamped, not printed: soften the edge a touch and let a little paint through
        layer = layer.filter(ImageFilter.GaussianBlur(1.2))
        alpha = layer.getchannel("A").point(lambda a: int(a * 0.94))
        layer.putalpha(alpha)
        im.paste(layer, (0, 0), layer)
        im.save(f"{out}/sys_{key}.png")
print("system faces written to", out)

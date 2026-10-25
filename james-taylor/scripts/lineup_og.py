"""From the lineup render: the hero's pass image and the share image.

    python3 scripts/lineup_og.py [blender/out/lineup/lineup.png]

Writes public/media/lineup.webp (cropped to the dishes, alpha kept) and public/og.jpg (1200x630).
"""
import os
import sys
import urllib.request

from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FONT_URL = "https://raw.githubusercontent.com/google/fonts/main/ofl/bigshouldersdisplay/BigShouldersDisplay%5Bwght%5D.ttf"
FONT = os.path.join(ROOT, "blender", "cache", "fonts", "BigShouldersDisplay.ttf")
CHAR = (10, 8, 6)


def font(size):
    if not os.path.exists(FONT):
        os.makedirs(os.path.dirname(FONT), exist_ok=True)
        req = urllib.request.Request(FONT_URL, headers={"User-Agent": "james-taylor-site-assets/1.0"})
        with urllib.request.urlopen(req) as r, open(FONT, "wb") as f:
            f.write(r.read())
    f = ImageFont.truetype(FONT, size)
    try:
        f.set_variation_by_axes([900])
    except OSError:
        pass
    return f


def main():
    src = sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, "blender", "out", "lineup", "lineup.png")
    im = Image.open(src).convert("RGBA")
    # crop to the dishes and their shadows, with a little air
    box = im.getchannel("A").point(lambda v: 255 if v > 6 else 0).getbbox()
    pad = int(im.width * 0.02)
    box = (max(0, box[0] - pad), max(0, box[1] - pad), min(im.width, box[2] + pad), min(im.height, box[3] + pad))
    pass_ = im.crop(box)
    media = os.path.join(ROOT, "public", "media")
    os.makedirs(media, exist_ok=True)
    w = min(1800, pass_.width)
    pass_ = pass_.resize((w, round(pass_.height * w / pass_.width)), Image.LANCZOS)
    pass_.save(os.path.join(media, "lineup.webp"), "WEBP", quality=84, method=6, alpha_quality=92)

    # share image: name in the heat, the pass along the bottom
    og = Image.new("RGB", (1200, 630), CHAR)
    glow = Image.new("RGB", (1200, 630), CHAR)
    d = ImageDraw.Draw(glow)
    d.ellipse((-200, -420, 1400, 260), fill=(150, 52, 12))
    d.ellipse((150, -300, 1050, 120), fill=(255, 150, 50))
    glow = glow.filter(ImageFilter.GaussianBlur(90))
    og = Image.blend(og, glow, 0.85)
    d = ImageDraw.Draw(og)
    f = font(176)
    text = "JAMES TAYLOR"
    tw = d.textlength(text, font=f)
    d.text(((1200 - tw) / 2, 120), text, font=f, fill=(241, 232, 218))
    small = font(30)
    line = "EXECUTIVE CHEF · THE JOYCE · MIAMI BEACH"
    d.text(((1200 - d.textlength(line, font=small)) / 2, 82), line, font=small, fill=(242, 194, 107))
    strip = pass_.resize((1200, round(pass_.height * 1200 / pass_.width)), Image.LANCZOS)
    og.paste(strip, (0, 630 - strip.height + 10), strip)
    og.save(os.path.join(ROOT, "public", "og.jpg"), quality=86)
    print("lineup.webp", pass_.size, "og.jpg (1200, 630)")


if __name__ == "__main__":
    main()

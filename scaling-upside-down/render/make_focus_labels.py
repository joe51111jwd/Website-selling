# Stamped words for the focus film's blocks (the same stamp as make_textures.py's labels).
#   python3 make_focus_labels.py tex fonts
import sys

from PIL import Image, ImageDraw, ImageFont

out, fonts = sys.argv[1], sys.argv[2]
caslon = f"{fonts}/caslon_bold.ttf"
labels = {
    "f_launching": "ALWAYS\nLAUNCHING", "f_hiring": "ALWAYS\nHIRING", "f_adding": "ALWAYS\nADDING",
}
# planks are twice as wide as a block: drawn 2:1, then squeezed square (the face's UVs stretch it back)
for key, text in labels.items():
    im = Image.new("RGBA", (2048, 1024), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    lines = text.split("\n")
    sizes = [170, 300]  # the small word over the big one
    fonts_ = []
    for line, size in zip(lines, sizes):
        while True:
            f = ImageFont.truetype(caslon, size)
            if d.textlength(line, font=f) < 1800:
                break
            size -= 6
        fonts_.append(f)
    hs = [f.size * 1.05 for f in fonts_]
    y = 512 - sum(hs) / 2
    for line, f, h in zip(lines, fonts_, hs):
        w = d.textlength(line, font=f)
        d.text((1024 - w / 2, y), line, font=f, fill=(18, 15, 12, 255))
        y += h
    im.resize((1024, 1024), Image.LANCZOS).save(f"{out}/label_{key}.png")
print("ok")

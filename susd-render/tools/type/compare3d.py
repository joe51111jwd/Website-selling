"""2x2 sheet: Plimsoll v1.0 against Ortica Angular Bold in the lock-wall staging, water at touch and over."""
import pathlib
from PIL import Image, ImageDraw, ImageFont
R = pathlib.Path(__file__).resolve().parents[2] / "docs/type"
D = R / "specimens/3d"
F = ImageFont.truetype(str(R / "fonts/b612/B612-Regular.ttf"), 20)
cells = [("lock-touch-plimsoll.png", "Plimsoll Heavy v1.0 · water at touch (13)"),
         ("lock-touch-ortica.png", "Ortica Angular Bold · water at touch (13)"),
         ("lock-over-plimsoll.png", "Plimsoll Heavy v1.0 · water over the bottom line"),
         ("lock-over-ortica.png", "Ortica Angular Bold · water over the bottom line")]
W, H, PAD, LAB = 960, 600, 12, 34
sheet = Image.new("RGB", (2 * W + 3 * PAD, 2 * (H + LAB) + 3 * PAD), (228, 230, 227))
d = ImageDraw.Draw(sheet)
for i, (f, lab) in enumerate(cells):
    x, y = PAD + (i % 2) * (W + PAD), PAD + (i // 2) * (H + LAB + PAD)
    d.text((x, y + 6), lab, font=F, fill=(30, 32, 34))
    sheet.paste(Image.open(D / f).convert("RGB"), (x, y + LAB))
sheet.save(D / "lock-compare.png", optimize=True)
print(D / "lock-compare.png")

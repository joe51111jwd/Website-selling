"""The recommended type system on one sheet, with Michael's words (all verbatim; refs in 03-TYPE.md)."""
import pathlib
from PIL import Image, ImageDraw, ImageFont
R = pathlib.Path(__file__).resolve().parents[2] / "docs/type"
SYS = R / "system"
OUT = R / "specimens/20-system-pairing.png"
F = lambda n, s: ImageFont.truetype(str(SYS / n), s)
PL, OA, OLB, OLR, BR, BB = ("Plimsoll-Heavy.otf", "Ortica-AngularBold.otf", "Ortica-LinearBold.otf",
                            "Ortica-LinearRegular.otf", "B612-Regular.ttf", "B612-Bold.ttf")
W, H = 1600, 1560
img = Image.new("RGB", (W, H), (231, 233, 229))
d = ImageDraw.Draw(img)
ink, dim, red = (18, 19, 20), (92, 96, 98), (150, 36, 28)


def role(y, text):
    d.text((60, y), text, font=F(BR, 17), fill=dim)


# 1 title, Plimsoll
role(40, "Title and wordmark: Plimsoll Heavy (custom)")
d.text((60, 70), "SCALING UP-SIDE-DOWN", font=F(PL, 132), fill=ink)
# 2 hero, Plimsoll (the 3D letters and their HTML text; the face maps lower case to its capitals)
role(250, "3D hero letters on the wall, and the same sentence as HTML: Plimsoll Heavy (custom)")
y = 284
for line in ["Every hire compounds", "complexity before it", "compounds capacity."]:
    d.text((60, y), line, font=F(PL, 100), fill=ink); y += 124
# 3 overlays
role(668, "Story overlays as you scroll: Ortica Angular Bold (beats), Ortica Linear Bold / Regular (supporting lines)")
d.text((60, 698), "Past twelve, something breaks.", font=F(OA, 64), fill=ink)
d.text((60, 784), "The business is drowning. Every addition makes it worse.", font=F(OLB, 40), fill=ink)
d.text((60, 840), "You were never the problem. The model you inherited was.", font=F(OLR, 34), fill=ink)
# 4 readout and gauge
role(910, "Readout figures: Plimsoll (tabular). Gauge, labels, form: B612 in sentence case, never tracked caps")
d.text((60, 930), "13", font=F(PL, 150), fill=ink)
d.text((280, 930), "78", font=F(PL, 150), fill=red)
d.text((60, 1100), "people", font=F(BR, 22), fill=dim)
d.text((280, 1100), "coordination pathways", font=F(BR, 22), fill=dim)
gx = 720
for i, (lab, col) in enumerate([("Graveyard 15-39", red), ("Threshold 13-14", red), ("Team 8-12", ink),
                                  ("Valley 4-7", ink), ("Small Team 2-3", ink), ("Solopreneur 1", ink)]):
    yy = 940 + i * 30
    d.line([(gx, yy + 12), (gx + 24, yy + 12)], fill=col, width=2)
    d.text((gx + 36, yy), lab, font=F(BR, 20), fill=col)
d.text((gx + 270, 940), "How many people are on your team?", font=F(OLB, 27), fill=ink)
d.text((gx + 270, 990), "COMPLEXITY > CAPACITY = REDLINE.", font=F(PL, 31), fill=red)
d.text((gx + 270, 1036), "CAPACITY > COMPLEXITY = OXYGEN.", font=F(PL, 31), fill=ink)
# 5 Bootloader
role(1170, "The Bootloader path: Plimsoll for the file's name and its mark, B612 for its facts and the form, Ortica for Michael's line")
d.text((60, 1196), "\u29B5", font=F(PL, 50), fill=ink)
d.text((150, 1200), "SUSD Bootloader", font=F(PL, 44), fill=ink)
d.text((60, 1258), "V16 · 35,445 words · works with Claude, ChatGPT, Gemini", font=F(BR, 24), fill=dim)
d.text((60, 1306), "The pages are reference. The file is the operating system.", font=F(OLR, 36), fill=ink)
d.rectangle([(60, 1380), (700, 1450)], outline=ink, width=2)
d.text((84, 1402), "you@business.com", font=F(BR, 24), fill=dim)
d.rectangle([(720, 1380), (1130, 1450)], fill=ink)
d.text((748, 1400), "Get the free Bootloader", font=F(BB, 28), fill=(236, 238, 235))
d.text((60, 1490), "Labels and buttons are labels (not quotes). Every sentence above is Michael's, word for word.",
       font=F(BR, 17), fill=dim)
img.save(OUT)
print("wrote", OUT)

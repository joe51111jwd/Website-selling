#!/usr/bin/env python3
"""Contact sheet: python3 scene/sheet.py out.png cols img1 img2 ... (labels = file names)."""
import sys, os
from PIL import Image, ImageDraw
out, cols, files = sys.argv[1], int(sys.argv[2]), sys.argv[3:]
ims = [Image.open(f).convert('RGB') for f in files]
w = max(i.width for i in ims); h = max(i.height for i in ims)
rows = (len(ims) + cols - 1) // cols
sheet = Image.new('RGB', (cols * w + (cols + 1) * 8, rows * (h + 22) + 8), (20, 22, 22))
d = ImageDraw.Draw(sheet)
for k, (im, f) in enumerate(zip(ims, files)):
    x = 8 + (k % cols) * (w + 8); y = 8 + (k // cols) * (h + 22)
    sheet.paste(im, (x, y + 18)); d.text((x, y + 2), os.path.basename(f), fill=(220, 220, 210))
sheet.save(out); print(out, sheet.size)

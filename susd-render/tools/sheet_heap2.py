#!/usr/bin/env python3
"""The Heap v2: one contact sheet of the beats, desktop (1440x900) above, phone (iPhone 13, 390x844) below.
Reads the beat screenshots qa_heap2.cjs wrote (default out/heap2/qa-dist/, the run against the deploy copy:
d1440-*.png, p390-*.png), saves them as JPEGs to out/heap2/shots/, and writes out/heap2/heap2-sheet.jpg.
Run from anywhere: python3 susd-render/tools/sheet_heap2.py [qa-dir]"""
import os
from PIL import Image, ImageDraw, ImageFont
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
import sys
QA = os.path.abspath(sys.argv[1]) if len(sys.argv) > 1 else os.path.join(ROOT, 'out', 'heap2', 'qa-dist')   # qa_heap2.cjs --out
SHOTS = os.path.join(ROOT, 'out', 'heap2', 'shots')
OUT = os.path.join(ROOT, 'out', 'heap2', 'heap2-sheet.jpg')
BEATS = [('01-hero', 'the title, bent from cable'), ('02-fall', 'the letters fall'), ('03-letters-down', '... and sink away'),
         ('04-one-cup', 'one mug: one person'), ('05-two-cups', 'two people, one cable'), ('06-four', 'four people, six cables'),
         ('07-eight', 'more people join'), ('08-fifteen', '15 people, 105 cables'), ('09-pull', 'the heap pulls them in'),
         ('10-wait', 'the wait: everything stops'), ('11-not-scaling', "low and big: They're not."), ('13-upside', 'upside down: a weight'),
         ('14-cyclical', 'right side up'), ('15-up', 'up'), ('17-down', 'side, down: three bundles'), ('20-get', 'the Bootloader (#get)')]
os.makedirs(SHOTS, exist_ok=True)
font = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 15)
bold = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 22)
W = 1920
DW, DH = 480, 300          # desktop tiles, 4 x 4
PW, PH = 240, 520          # phone tiles, 8 x 2
LAB = 24
head = 44
sheet_h = head + 4 * (DH + LAB) + head + 2 * (PH + LAB) + 10
sheet = Image.new('RGB', (W, sheet_h), (24, 24, 24))
d = ImageDraw.Draw(sheet)
d.text((14, 10), 'The Heap v2 - desktop 1440x900', fill=(235, 235, 230), font=bold)
y0 = head
for i, (k, cap) in enumerate(BEATS):
    src = os.path.join(QA, f'd1440-{k}.png')
    im = Image.open(src).convert('RGB')
    im.save(os.path.join(SHOTS, f'd1440-{k}.jpg'), quality=88)
    x, y = (i % 4) * DW, y0 + (i // 4) * (DH + LAB)
    sheet.paste(im.resize((DW, DH), Image.LANCZOS), (x, y))
    d.text((x + 8, y + DH + 3), f'{i + 1:02d}  {cap}', fill=(220, 220, 214), font=font)
y1 = y0 + 4 * (DH + LAB)
d.text((14, y1 + 10), 'phone, iPhone 13 390x844', fill=(235, 235, 230), font=bold)
y1 += head
for i, (k, cap) in enumerate(BEATS):
    src = os.path.join(QA, f'p390-{k}.png')
    im = Image.open(src).convert('RGB')
    im.save(os.path.join(SHOTS, f'p390-{k}.jpg'), quality=88)
    x, y = (i % 8) * PW, y1 + (i // 8) * (PH + LAB)
    sheet.paste(im.resize((PW, PH), Image.LANCZOS), (x, y))
    d.text((x + 6, y + PH + 3), f'{i + 1:02d}  {cap}'[:30], fill=(220, 220, 214), font=font)
sheet.save(OUT, quality=86)
print('wrote', OUT, sheet.size, 'and', len(BEATS) * 2, 'shots in', SHOTS)

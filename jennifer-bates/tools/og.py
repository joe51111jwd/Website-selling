# Share image (public/og.jpg, 1200x630): the portrait on the right, the line on the left.
#   python3 tools/og.py
import os
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.join(os.path.dirname(__file__), '..')
W, H = 1200, 630
NIGHT, CREAM, GOLD = (14, 24, 34), (243, 226, 204), (196, 154, 95)

def font(names, size):
    for n in names:
        for d in ('/usr/share/fonts/truetype/dejavu', '/usr/share/fonts/truetype/liberation', '/usr/share/fonts/truetype'):
            p = os.path.join(d, n)
            if os.path.exists(p):
                return ImageFont.truetype(p, size)
    return ImageFont.load_default()

serif = ['LiberationSerif-Italic.ttf', 'DejaVuSerif-Italic.ttf']
serif_r = ['LiberationSerif-Regular.ttf', 'DejaVuSerif.ttf']
sans = ['LiberationSans-Regular.ttf', 'DejaVuSans.ttf']

im = Image.new('RGB', (W, H), NIGHT)
p = Image.open(os.path.join(ROOT, 'masters', 'jennifer-bates.png')).convert('RGB')
p = p.crop((240, 0, 1680, 1920)).resize((473, 630), Image.LANCZOS)
mask = Image.new('L', p.size, 255)
md = ImageDraw.Draw(mask)
for x in range(160):  # fade the left edge into the night
    md.line([(x, 0), (x, H)], fill=int(255 * x / 160))
im.paste(p, (W - p.width, 0), mask)
d = ImageDraw.Draw(im)
d.text((72, 92), 'JENNIFER G. BATES', font=font(sans, 22), fill=GOLD)
d.text((72, 200), 'The risk no model', font=font(serif_r, 64), fill=CREAM)
d.text((72, 276), 'prices is', font=font(serif_r, 64), fill=CREAM)
d.text((72, 352), 'the human one.', font=font(serif, 64), fill=GOLD)
d.text((72, 520), 'Founder & CEO, HumanFactor  ·  Creator of Stakeholder Risk', font=font(sans, 22), fill=(170, 182, 192))
im.save(os.path.join(ROOT, 'public', 'og.jpg'), quality=86)
print('wrote public/og.jpg')

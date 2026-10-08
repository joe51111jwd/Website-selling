# SECTION A-A no-GL stills from A4's REAL shader (requests/A4-5 item 3): scripts/capture.mjs screenshots the
# registered `slice` capture scene at t = s = 0.1 / 0.5 / 0.9, cropped to [data-capture-crop="slice"]; this
# resizes each capture to 1920x1076 and writes sec-near / sec-mid / sec-far as AVIF + JPEG.
# usage: python -I sec_from_capture.py <capture_dir> <public/media/section>
import sys, os, io, json
from PIL import Image, ImageOps

src, out = sys.argv[1], sys.argv[2]
rep = {}
for name, t in (('near', '0.1'), ('mid', '0.5'), ('far', '0.9')):
    p = os.path.join(src, f'ft{t}.png')
    im = Image.open(p).convert('RGB')
    w, h = im.size
    im2 = ImageOps.fit(im, (1920, 1076), Image.LANCZOS)
    for q in (62, 56, 50, 44):
        b = io.BytesIO(); im2.save(b, 'AVIF', quality=q, speed=4)
        if b.tell() <= 200_000: break
    open(os.path.join(out, f'sec-{name}.avif'), 'wb').write(b.getvalue())
    im2.save(os.path.join(out, f'sec-{name}.jpg'), quality=80, optimize=True, progressive=True)
    rep[name] = {'capture': [w, h], 'avif': b.tell(), 'q': q}
print(json.dumps(rep))

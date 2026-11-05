# Web images for the plain multi-page sites (Parasol, Harrow & Pell, Larchwood).
#   python3 sites/webimg.py sites/parasol
# Reads <site>/masters/*.jpg|png|webp (not shipped) and writes <site>/public/img/<name>-<w>.webp
# at 640/1280/1920/2560 px wide (never wider than the master), plus <site>/public/img/sizes.json:
# { name: { "w": master width, "h": master height, "widths": [...] } } for writing srcsets.
import json, os, sys, glob
from PIL import Image, ImageOps

WIDTHS = (640, 1280, 1920, 2560)

def main(site):
    masters = os.path.join(site, 'masters')
    out = os.path.join(site, 'public', 'img')
    os.makedirs(out, exist_ok=True)
    sizes = {}
    files = sorted(f for ext in ('jpg', 'jpeg', 'png', 'webp') for f in glob.glob(os.path.join(masters, f'*.{ext}')))
    if not files:
        sys.exit(f'no masters in {masters}')
    for old in glob.glob(os.path.join(out, '*.webp')):
        os.remove(old)
    for f in files:
        name = os.path.splitext(os.path.basename(f))[0]
        im = ImageOps.exif_transpose(Image.open(f)).convert('RGB')
        w, h = im.size
        widths = [x for x in WIDTHS if x <= w] or [w]
        if w > widths[-1] and w - widths[-1] > 240:
            widths.append(w)
        for x in widths:
            y = round(h * x / w)
            im.resize((x, y), Image.LANCZOS).save(os.path.join(out, f'{name}-{x}.webp'), 'WEBP', quality=80, method=6)
        sizes[name] = {'w': w, 'h': h, 'widths': widths}
        print(f'{name}: {w}x{h} -> {widths}')
    with open(os.path.join(out, 'sizes.json'), 'w') as fh:
        json.dump(sizes, fh, indent=1, sort_keys=True)

if __name__ == '__main__':
    if len(sys.argv) != 2:
        sys.exit('usage: python3 sites/webimg.py sites/<name>')
    main(sys.argv[1].rstrip('/'))

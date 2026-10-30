#!/usr/bin/env python3
"""Download CC0 Poly Haven textures and HDRIs into assets/polyhaven/.

  python3 tools/fetch_polyhaven.py tex <id> [<id> ...] [--res 2k]
  python3 tools/fetch_polyhaven.py hdri <id> [<id> ...] [--res 2k]

Textures: diff, rough, nor_gl and disp JPGs (or the closest maps the asset has).
HDRIs: the .hdr file. Already-downloaded files are skipped. Every download is
logged to assets/polyhaven/SOURCES.tsv (id, map, url, licence) for the docs.
"""
import json, os, sys, urllib.request

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'assets', 'polyhaven')
API = 'https://api.polyhaven.com/files/'
MAPS = {'diff': ['Diffuse', 'diff'], 'rough': ['Rough', 'rough'], 'nor_gl': ['nor_gl'],
        'disp': ['Displacement', 'disp'], 'ao': ['AO', 'ao']}


def get(url):
    req = urllib.request.Request(url, headers={'User-Agent': 'susd-render-lookdev/1.0'})
    with urllib.request.urlopen(req, timeout=120) as r:
        return r.read()


def log(row):
    os.makedirs(ROOT, exist_ok=True)
    p = os.path.join(ROOT, 'SOURCES.tsv')
    new = not os.path.exists(p)
    with open(p, 'a') as f:
        if new:
            f.write('asset\tmap\turl\tlicence\n')
        f.write('\t'.join(row) + '\n')


def fetch_tex(aid, res):
    files = json.loads(get(API + aid))
    out = os.path.join(ROOT, aid)
    os.makedirs(out, exist_ok=True)
    for short, keys in MAPS.items():
        entry = next((files[k] for k in keys if k in files), None)
        if not entry or res not in entry:
            continue
        url = entry[res]['jpg']['url']
        dst = os.path.join(out, f'{aid}_{short}_{res}.jpg')
        if os.path.exists(dst):
            continue
        open(dst, 'wb').write(get(url))
        log([aid, short, url, 'CC0'])
        print('got', dst)


def fetch_hdri(aid, res):
    files = json.loads(get(API + aid))
    url = files['hdri'][res]['hdr']['url']
    out = os.path.join(ROOT, 'hdri')
    os.makedirs(out, exist_ok=True)
    dst = os.path.join(out, f'{aid}_{res}.hdr')
    if not os.path.exists(dst):
        open(dst, 'wb').write(get(url))
        log([aid, 'hdri', url, 'CC0'])
        print('got', dst)


if __name__ == '__main__':
    args = sys.argv[1:]
    res = '2k'
    if '--res' in args:
        i = args.index('--res'); res = args[i + 1]; del args[i:i + 2]
    kind, ids = args[0], args[1:]
    for a in ids:
        (fetch_tex if kind == 'tex' else fetch_hdri)(a, res)

#!/usr/bin/env python3
"""Tables for docs/06-HERO-BUILD.md from what was actually rendered (review round 2: "document everything").

    python3 scene/round_report.py            # Markdown: stills (seconds from out/renders.jsonl) + frame checks

Seconds are the newest log row for each still. Frame checks come from scene/frame_checks.py.
"""
import glob, json, os, sys
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..'))
sys.path.insert(0, HERE)
from frame_checks import check  # noqa: E402

rows = {}
for line in open(os.path.join(ROOT, 'out', 'renders.jsonl')):
    r = json.loads(line)
    if r['out'].startswith('out/stills/'):
        rows[r['out']] = r
stills = sorted(glob.glob(os.path.join(ROOT, 'out', 'stills', '[dp][0-9][0-9]_*.png')))
print('| Still | State | Camera | Size | Samples | Seconds |')
print('|---|---|---|---|---:|---:|')
for p in stills:
    rel = os.path.relpath(p, ROOT)
    r = rows.get(rel, {})
    an = json.load(open(os.path.splitext(p)[0] + '.anchors.json'))
    print(f"| [`{rel}`](../{rel}) | {an['state']} {an['name']}{' n = ' + str(an['n']) if an.get('n') else ''} | {an['cam']} | "
          f"{r.get('w')}×{r.get('h')} | {r.get('samples')} | {r.get('seconds')} |")
print()
print('| Still | Top band p95 | Caption zone p95 | Words p90 | Line contrast (min) | Refl / words | Black (< 8/255) | Words box | Water y |')
print('|---|---:|---:|---:|---:|---:|---:|---|---:|')
for p in stills:
    c = check(p)
    an = json.load(open(os.path.splitext(p)[0] + '.anchors.json'))
    f = lambda k, fmt='{:.3f}': (fmt.format(c[k]) if k in c else '–')
    print(f"| {os.path.basename(p)[:-4]} | {f('top')} | {f('caption')} | {f('words')} | {f('line_contrast_min', '{:.2f}')} | "
          f"{f('refl/words', '{:.2f}')} | {c['black'] * 100:.1f} % | {', '.join(f'{v:.3f}' for v in an['words'])} | {an['waterY']:.3f} |")

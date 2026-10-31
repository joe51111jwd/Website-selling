#!/usr/bin/env python3
"""Markdown tables from the mock screenshots (docs/06-HERO-BUILD.md, results and 13.9).

    python3 mock/plate_report.py           # reads out/mock/measurements.json (written by node mock/shoot.cjs)

Per screen: the text box with the lowest cream contrast against the 95th-percentile plate under it, and the
overlap check's result.
"""
import json, os
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
m = json.load(open(os.path.join(ROOT, 'out', 'mock', 'measurements.json')))
print('| Screenshot | Viewport | Page | Lowest-contrast text box | Plate p95 | Cream contrast | Overlaps |')
print('|---|---|---|---|---:|---:|---|')
pages = json.load(open(os.path.join(ROOT, 'out', 'mock', 'shots.json')))
for name, v in m.items():
    res = v.get('res', {})
    if not res:
        continue
    k, w = min(res.items(), key=lambda kv: kv[1]['contrastAtP95'])
    vp = '390×844 @2x' if name.startswith('phone') else '1440×900'
    ov = len(v.get('overlaps', []))
    print(f"| [`out/mock/{name}.png`](../out/mock/{name}.png) | {vp} | `{pages.get(name + '.png', '')}` | `{k}` | {w['p95']:.3f} | "
          f"{w['contrastAtP95']:.2f}:1 | {'none' if not ov else ', '.join(v['overlaps'])} |")

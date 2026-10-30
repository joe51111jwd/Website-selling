"""Rebuild src/fonts/*.woff2 from the @fontsource-variable/newsreader package.

Keeps only the glyphs the page uses and the axis ranges it uses, so the two Newsreader files
fit the brief's font budget. Requires: pip install fonttools brotli
Run from the project root:  python3 scripts/subset-fonts.py
"""
import os
from fontTools import subset
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer

SRC = 'node_modules/@fontsource-variable/newsreader/files/newsreader-latin-opsz-{}.woff2'
UNICODES = 'U+0020-007E,U+00A0,U+00B7,U+00D7,U+2013,U+2014,U+2018,U+2019,U+201C,U+201D,U+2026'
# Roman: 400 (text) to 800 (the cover). Italic: 400 to 500. opsz stays 6 to 72.
LIMITS = {'normal': {'wght': (400, 800)}, 'italic': {'wght': (400, 500)}}

for style, limits in LIMITS.items():
    font = TTFont(SRC.format(style))
    opts = subset.Options()
    opts.layout_features = ['kern', 'liga', 'lnum', 'onum', 'pnum', 'tnum']
    opts.flavor = None
    sub = subset.Subsetter(opts)
    sub.populate(unicodes=subset.parse_unicodes(UNICODES))
    sub.subset(font)
    font = instancer.instantiateVariableFont(font, limits)
    font.flavor = 'woff2'
    out = f'src/fonts/newsreader-latin-opsz-{style}.woff2'
    font.save(out)
    print(out, os.path.getsize(out), 'bytes')

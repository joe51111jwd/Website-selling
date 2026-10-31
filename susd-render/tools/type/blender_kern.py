"""Kerning for Blender text objects.

Blender 4.5 text objects (bpy FONT curves) apply NO kerning from the font: neither the OpenType
GPOS 'kern' feature nor a legacy 'kern' table (measured in docs/03-TYPE.md, section 5.4: "AV" sets
at exactly the unkerned width). Blender does have per-character kerning,
TextCharacterFormat.kerning, in units of 1/64 em. This module reads the font's pair kerning with
fontTools and writes it into a curve's body_format, so 3D letters are spaced the way the font's
designer spaced them.

Blender's Python (3.11) has no fontTools, so this works in two steps:
  1. outside Blender, export the pairs to a sidecar next to the font:
         python3 -I tools/type/blender_kern.py docs/type/system/Plimsoll-Heavy.otf ...
     -> docs/type/system/Plimsoll-Heavy.otf.kern.json
  2. inside Blender (after cu.body and cu.font are set):
         sys.path.insert(0, '<repo>/tools/type'); import blender_kern
         blender_kern.apply(cu, font_path)       # reads <font_path>.kern.json
Reads the legacy 'kern' table (Plimsoll) and GPOS PairPos format 1 and 2 (Ortica, B612).
"""
import json, os, sys

_cache = {}


def _gpos_pairs(f):
    pairs = {}
    if "GPOS" not in f:
        return pairs
    gpos = f["GPOS"].table
    kern_lookups = set()
    for fr in gpos.FeatureList.FeatureRecord:
        if fr.FeatureTag == "kern":
            kern_lookups.update(fr.Feature.LookupListIndex)
    for li in sorted(kern_lookups):
        lookup = gpos.LookupList.Lookup[li]
        for st in lookup.SubTable:
            if lookup.LookupType == 9:
                st = st.ExtSubTable
            if getattr(st, "LookupType", 2) != 2 and lookup.LookupType not in (2, 9):
                continue
            cov = st.Coverage.glyphs
            if st.Format == 1:
                for i, g1 in enumerate(cov):
                    for pvr in st.PairSet[i].PairValueRecord:
                        v = getattr(pvr.Value1, "XAdvance", 0) or 0
                        if v:
                            pairs.setdefault((g1, pvr.SecondGlyph), v)
            elif st.Format == 2:
                c1 = st.ClassDef1.classDefs if st.ClassDef1 else {}
                c2 = st.ClassDef2.classDefs if st.ClassDef2 else {}
                second = {}
                for g, c in c2.items():
                    second.setdefault(c, []).append(g)
                for g1 in cov:
                    rec = st.Class1Record[c1.get(g1, 0)]
                    for k, r2 in enumerate(rec.Class2Record):
                        v = getattr(r2.Value1, "XAdvance", 0) or 0
                        if not v or k == 0:
                            continue
                        for g2 in second.get(k, []):
                            pairs.setdefault((g1, g2), v)
    return pairs


def export(font_path):
    """Write <font_path>.kern.json (needs fontTools: run with system python3)."""
    from fontTools.ttLib import TTFont
    f = TTFont(font_path, lazy=True)
    pairs = {}
    if "kern" in f:
        for t in f["kern"].kernTables:
            pairs.update(getattr(t, "kernTable", {}))
    for k, v in _gpos_pairs(f).items():
        pairs.setdefault(k, v)
    cmap = f.getBestCmap()
    used = {g for pair in pairs for g in pair}
    data = dict(upm=f["head"].unitsPerEm,
                cmap={chr(u): g for u, g in cmap.items() if u < 0x3000 and g in used},
                pairs={f"{a} {b}": v for (a, b), v in pairs.items()})
    with open(font_path + ".kern.json", "w") as fh:
        json.dump(data, fh, separators=(",", ":"))
    return len(pairs)


def load(font_path):
    if font_path not in _cache:
        with open(font_path + ".kern.json") as fh:
            d = json.load(fh)
        pairs = {tuple(k.split(" ")): v for k, v in d["pairs"].items()}
        _cache[font_path] = ({ord(c): g for c, g in d["cmap"].items()}, pairs, d["upm"])
    return _cache[font_path]


def pair_values(text, font_path):
    """Kerning after each character of text, in font units."""
    cmap, pairs, upm = load(font_path)
    names = [cmap.get(ord(c)) for c in text]
    return [pairs.get((a, b), 0) if a and b else 0 for a, b in zip(names, names[1:] + [None])]


def apply(cu, font_path):
    """Write the font's pair kerning into a Blender FONT curve. Returns the number of pairs set."""
    cmap, pairs, upm = load(font_path)
    n = 0
    for i, v in enumerate(pair_values(cu.body, font_path)):
        if v:
            cu.body_format[i].kerning = v * 64.0 / upm
            n += 1
    return n


if __name__ == "__main__":
    for fp in sys.argv[1:]:
        print(fp, export(os.path.abspath(fp)), "pairs")

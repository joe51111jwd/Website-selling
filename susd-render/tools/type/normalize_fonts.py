"""Normalize downloaded candidate fonts for specimens and for Blender.

For every family folder in docs/type/fonts/:
  * a .woff2 is decompressed to .otf (CFF) or .ttf (glyf) next to it, because
    Blender's text object and PIL both want a plain sfnt;
  * a variable *-VF.ttf is instanced at the weights listed in INSTANCES;
  * the name table (family, designer, licence) is printed so 03-TYPE.md can
    cite it.
Run with:  python3 -I tools/type/normalize_fonts.py
(-I keeps Python from importing anything that sits next to downloaded files.)
"""
import sys, pathlib
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer

ROOT = pathlib.Path(__file__).resolve().parents[2] / "docs" / "type" / "fonts"
INSTANCES = {  # variable file -> {suffix: wght}
    "hepta-slab/HeptaSlab-VF.ttf": {"Black": 900, "ExtraBold": 800},
    "besley/Besley-VF.ttf": {"Black": 900, "Bold": 700},
    "eczar/Eczar-VF.ttf": {"ExtraBold": 800},
}

def name(f, i):
    r = f["name"].getDebugName(i)
    return (r or "").replace("\n", " ")[:140]

def main():
    for woff in sorted(ROOT.glob("*/*.woff2")):
        f = TTFont(woff)
        ext = ".otf" if "CFF " in f else ".ttf"
        out = woff.with_suffix(ext)
        if not out.exists():
            f.flavor = None
            f.save(out)
            print("decompressed", out.relative_to(ROOT))
    for rel, inst in INSTANCES.items():
        src = ROOT / rel
        if not src.exists():
            continue
        for suffix, w in inst.items():
            out = src.with_name(src.name.replace("-VF", "-" + suffix))
            if out.exists():
                continue
            vf = TTFont(src)
            st = instancer.instantiateVariableFont(vf, {"wght": w}, updateFontNames=True)
            st.save(out)
            print("instanced", out.relative_to(ROOT), "wght", w)
    print()
    for p in sorted(list(ROOT.glob("*/*.otf")) + list(ROOT.glob("*/*.ttf"))):
        if "-VF" in p.name:
            continue
        f = TTFont(p, lazy=True)
        print(f"{p.relative_to(ROOT)} | {name(f,1)} {name(f,2)} | designer: {name(f,9)} | "
              f"licence: {name(f,13)[:70]} | {name(f,14)}")

if __name__ == "__main__":
    main()

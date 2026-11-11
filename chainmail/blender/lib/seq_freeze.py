"""
chainmail — lib snapshot for the packing sequence + hero (owned by the sequence scenes).

The item libs (kit / apparel / accessories / vessels / common) keep being polished by other agents.
A 121-frame sequence is rendered in chunks over hours, so every chunk (and the hero still, which must
show the same kit) imports a FROZEN copy of those libs from blender/lib_frozen_seq/, verified against
its MANIFEST (sha256 of every file). Refresh the snapshot deliberately with
    tools/render_sequence.sh --freeze        (copies blender/lib/*.py + blender/assets -> blender/lib_frozen_seq/)
and then re-run the hero + `kit_sequence.py -- --check` before rendering.

Scene usage (before ANY other lib import):
    sys.path.insert(0, <blender/lib>); import seq_freeze; FROZEN = seq_freeze.activate()
"""
import os, sys, hashlib, shutil, json, time

HERE = os.path.dirname(os.path.abspath(__file__))           # blender/lib
FROZEN_DIR = os.path.abspath(os.path.join(HERE, "..", "lib_frozen_seq"))
FILES = ("common.py", "kit.py", "apparel.py", "accessories.py", "vessels.py")
MANIFEST = "MANIFEST.json"


def _sha(path):
    h = hashlib.sha256()
    with open(path, "rb") as fh:
        h.update(fh.read())
    return h.hexdigest()


ASSETS_SRC = os.path.abspath(os.path.join(HERE, "..", "assets"))
ASSETS_DST = os.path.join(FROZEN_DIR, "assets")
_ASSETS_LINE = 'ASSETS = os.path.join(ROOT, "assets")'


def _tree_sha(root):
    h = hashlib.sha256()
    for dp, dn, fn in sorted(os.walk(root)):
        dn.sort()
        for f in sorted(fn):
            p = os.path.join(dp, f)
            h.update(os.path.relpath(p, root).encode())
            h.update(_sha(p).encode())
    return h.hexdigest()


def freeze(code=True, assets=True):
    """Copy the live libs (code=True) and blender/assets (fonts, HDRIs, the generated + cached label /
    logo textures: other agents regenerate those too) into the snapshot dir; the frozen common.py
    is pointed at the frozen assets. Writes the manifest; returns it."""
    os.makedirs(FROZEN_DIR, exist_ok=True)
    mp = os.path.join(FROZEN_DIR, MANIFEST)
    man = json.load(open(mp)) if (os.path.exists(mp) and not code) else {"files": {}}
    if code:
        for f in FILES:
            shutil.copy2(os.path.join(HERE, f), os.path.join(FROZEN_DIR, f))
    if assets:
        if os.path.exists(ASSETS_DST):
            shutil.rmtree(ASSETS_DST)
        shutil.copytree(ASSETS_SRC, ASSETS_DST)
    cp = os.path.join(FROZEN_DIR, "common.py")
    src = open(cp).read()
    if _ASSETS_LINE in src:
        src = src.replace(_ASSETS_LINE, 'ASSETS = os.path.join(HERE, "assets")   # seq_freeze: frozen asset copy')
        open(cp, "w").write(src)
    for f in FILES:
        man["files"][f] = _sha(os.path.join(FROZEN_DIR, f))
    if os.path.exists(ASSETS_DST):
        man["assets"] = _tree_sha(ASSETS_DST)
    man["created" if code else "assets_frozen"] = time.strftime("%Y-%m-%d %H:%M:%S")
    with open(mp, "w") as fh:
        json.dump(man, fh, indent=2)
    return man


def digest(man):
    return hashlib.sha256(("".join(man["files"][f] for f in FILES) + man.get("assets", "")).encode()).hexdigest()[:12]


def activate(allow_live=False):
    """Put the snapshot first on sys.path and verify it. Returns a short digest string (logged by
    the scenes so every chunk log shows which geometry it rendered). Raises if the snapshot is
    missing/modified, unless allow_live (then the live libs are used and 'LIVE' is returned)."""
    mp = os.path.join(FROZEN_DIR, MANIFEST)
    if not os.path.exists(mp):
        if allow_live:
            return "LIVE"
        raise RuntimeError(f"lib snapshot missing: run tools/render_sequence.sh --freeze ({FROZEN_DIR})")
    with open(mp) as fh:
        man = json.load(fh)
    for f in FILES:
        p = os.path.join(FROZEN_DIR, f)
        if not os.path.exists(p) or _sha(p) != man["files"].get(f):
            raise RuntimeError(f"lib snapshot {p} does not match its MANIFEST (edited?) - re-freeze")
    if "assets" in man and _tree_sha(ASSETS_DST) != man["assets"]:
        raise RuntimeError(f"frozen assets {ASSETS_DST} changed since the freeze (a lib regenerated a "
                           f"texture into it?) - re-freeze")
    for m in ("common", "kit", "apparel", "accessories", "vessels"):
        if m in sys.modules and not os.path.abspath(sys.modules[m].__file__).startswith(FROZEN_DIR):
            raise RuntimeError(f"{m} already imported from the live libs before seq_freeze.activate()")
    if FROZEN_DIR in sys.path:
        sys.path.remove(FROZEN_DIR)
    sys.path.insert(0, FROZEN_DIR)
    return f"{digest(man)} (frozen {man['created']})"


def check_loaded():
    """After the imports: assert the item libs really came from the snapshot."""
    bad = [m for m in ("common", "kit", "apparel", "accessories", "vessels")
           if m in sys.modules and not os.path.abspath(sys.modules[m].__file__).startswith(FROZEN_DIR)]
    if bad:
        raise RuntimeError(f"live libs leaked into a frozen render: {bad}")


if __name__ == "__main__":
    m = freeze(code="--assets-only" not in sys.argv)
    print("frozen", digest(m), json.dumps(m, indent=1))

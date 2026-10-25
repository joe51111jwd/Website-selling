"""Fetch the CC0 Poly Haven assets the Blender scripts use into blender/cache/ (gitignored).

    python3 james-taylor/blender/assets.py

Safe to re-run: files already on disk are skipped. See CREDITS.md for what each one is.
"""
import json
import os
import urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
CACHE = os.path.join(HERE, "cache")
API = "https://api.polyhaven.com/files/"
# Poly Haven asks API clients to identify themselves with their own User-Agent
UA = {"User-Agent": "james-taylor-site-assets/1.0"}

HDRIS = {"studio_small_09": "2k"}
TEXTURES = {"velour_velvet": "2k", "kitchen_wood": "2k"}
MODELS = {"wooden_cutting_board": "2k"}


def get(url, dest):
    if os.path.exists(dest) and os.path.getsize(dest) > 0:
        return
    os.makedirs(os.path.dirname(dest), exist_ok=True)
    print("  ", url)
    with urllib.request.urlopen(urllib.request.Request(url, headers=UA)) as r, open(dest + ".part", "wb") as f:
        f.write(r.read())
    os.replace(dest + ".part", dest)


def files(asset):
    with urllib.request.urlopen(urllib.request.Request(API + asset, headers=UA)) as r:
        return json.load(r)


def blend_bundle(asset, res, folder):
    """A .blend plus its textures, laid out the way its relative paths expect."""
    entry = files(asset)["blend"][res]["blend"]
    root = os.path.join(CACHE, folder, asset)
    get(entry["url"], os.path.join(root, os.path.basename(entry["url"])))
    for rel, inc in entry.get("include", {}).items():
        get(inc["url"], os.path.join(root, rel))


def main():
    for name, res in HDRIS.items():
        url = files(name)["hdri"][res]["hdr"]["url"]
        get(url, os.path.join(CACHE, "hdri", f"{name}.hdr"))
    for name, res in TEXTURES.items():
        blend_bundle(name, res, "tex")
    for name, res in MODELS.items():
        blend_bundle(name, res, "models")
    print("assets ready in", CACHE)


if __name__ == "__main__":
    main()

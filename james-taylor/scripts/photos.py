"""Build the collage photos: fetch each source from Wikimedia Commons or Openverse, treat it, write it to
public/photos/, and write src/photos.ts with sizes and credits (every photo is CC0, public domain,
CC BY or CC BY-SA; the credits are shown in the footer).

    python3 scripts/photos.py            # everything in photos/sources.json
    python3 scripts/photos.py ribeye     # just these ids

Treatments
    print   a photo print: cropped, warmed a touch, kept rectangular (the page adds border and tape)
    copy    a photocopy: black and white, punchy, a little grain (the page multiplies it onto paper)
    cutout  the subject cut from its background (rembg), with a white sticker edge baked in
"""
import io
import json
import os
import re
import sys
import time
import urllib.parse
import urllib.request

import numpy as np
from PIL import Image, ImageChops, ImageEnhance, ImageFilter, ImageOps

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CACHE = os.path.join(ROOT, "photos", "cache")
OUT = os.path.join(ROOT, "public", "photos")
UA = {"User-Agent": "james-taylor-site/1.0 (photo pipeline; https://github.com/joe51111jwd/website-selling)"}


def get(url):
    for k in range(6):
        try:
            return urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=90).read()
        except urllib.error.HTTPError as e:
            if e.code != 429 or k == 5:
                raise
            wait = e.headers.get("Retry-After")
            time.sleep(int(wait) if wait and wait.isdigit() else 5 * 2**k)


def commons_info(title):
    u = "https://commons.wikimedia.org/w/api.php?" + urllib.parse.urlencode({
        "action": "query", "format": "json", "titles": title, "prop": "imageinfo",
        "iiprop": "url|size|extmetadata", "iiurlwidth": 1920})
    page = next(iter(json.loads(get(u))["query"]["pages"].values()))
    ii = page["imageinfo"][0]
    md = ii["extmetadata"]
    text = lambda k: re.sub(r"<[^>]+>", "", md.get(k, {}).get("value", "")).strip()
    return {
        # 1920 is one of Commons' standard thumbnail widths (others are refused); plenty for a collage
        "url": ii.get("thumburl") if ii["width"] > 1920 else ii["url"],
        "page": ii["descriptionurl"],
        "author": re.sub(r"\s+", " ", text("Artist")) or "Unknown",
        "license": text("LicenseShortName"),
        "licenseUrl": md.get("LicenseUrl", {}).get("value", ""),
        "title": title[5:].rsplit(".", 1)[0],
    }


def openverse_info(oid):
    d = json.loads(get(f"https://api.openverse.org/v1/images/{oid}/"))
    lic = d["license"].upper() if d["license"] in ("cc0", "pdm") else f"CC {d['license'].upper()} {d['license_version']}"
    return {
        "url": d["url"],
        "page": d["foreign_landing_url"],
        "author": d.get("creator") or "Unknown",
        "license": {"CC0": "CC0", "PDM": "Public domain"}.get(lic, lic),
        "licenseUrl": d.get("license_url") or "",
        "title": d.get("title") or "Untitled",
    }


def fetch(src):
    os.makedirs(CACHE, exist_ok=True)
    key = re.sub(r"\W+", "_", src.get("file") or src["ov"])[:120]
    meta_path = os.path.join(CACHE, key + ".json")
    img_path = os.path.join(CACHE, key + ".img")
    if not os.path.exists(meta_path):
        # metadata recorded in sources.json saves a trip to the (rate limited) Commons API
        info = src.get("meta") or (commons_info(src["file"]) if "file" in src else openverse_info(src["ov"]))
        open(img_path, "wb").write(get(info["url"]))
        json.dump(info, open(meta_path, "w"), indent=1)
        time.sleep(3)
    info = json.load(open(meta_path))
    im = ImageOps.exif_transpose(Image.open(img_path))
    return im.convert("RGB"), info


def crop(im, box):
    if not box:
        return im
    w, h = im.size
    return im.crop((round(box[0] * w), round(box[1] * h), round(box[2] * w), round(box[3] * h)))


def warm(im, amount=1.0):
    """A little warmth and density, so prints from different cameras sit together on the page."""
    a = np.asarray(im).astype(np.float32) / 255.0
    a = a ** 1.06
    a[..., 0] *= 1 + 0.045 * amount
    a[..., 2] *= 1 - 0.06 * amount
    im = Image.fromarray((np.clip(a, 0, 1) * 255).astype(np.uint8))
    return ImageEnhance.Contrast(im).enhance(1.05)


def photocopy(im, seed=1):
    g = ImageOps.grayscale(im)
    g = ImageOps.autocontrast(g, cutoff=2)
    a = np.asarray(g).astype(np.float32) / 255.0
    # toner curve: crushed blacks, blown paper
    a = np.clip((a - 0.18) / 0.62, 0, 1) ** 1.25
    rng = np.random.default_rng(seed)
    a = np.clip(a + rng.normal(0, 0.06, a.shape), 0, 1)
    return Image.fromarray((a * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.5))


_session = None


def cutout(im, border):
    global _session
    from rembg import new_session, remove
    if _session is None:
        _session = new_session("isnet-general-use")
    rgba = remove(im, session=_session, post_process_mask=True)
    alpha = rgba.getchannel("A").point(lambda v: 255 if v > 128 else 0).filter(ImageFilter.MedianFilter(5))
    # keep only the largest blob, so stray crumbs of background don't come along
    alpha = largest_blob(alpha)
    rgba.putalpha(alpha.filter(ImageFilter.GaussianBlur(0.7)))
    if border:
        r = max(2, round(border * max(im.size)))
        edge = alpha.filter(ImageFilter.MaxFilter(r * 2 + 1)).filter(ImageFilter.GaussianBlur(1.2))
        sticker = Image.new("RGBA", rgba.size, (250, 247, 240, 0))
        sticker.putalpha(edge)
        sticker.alpha_composite(rgba)
        rgba = sticker
    bbox = rgba.getchannel("A").point(lambda v: 255 if v > 8 else 0).getbbox()
    return rgba.crop(bbox)


def largest_blob(alpha):
    from scipy import ndimage
    a = np.asarray(alpha) > 0
    lab, n = ndimage.label(a)
    if n <= 1:
        return alpha
    sizes = ndimage.sum(a, lab, range(1, n + 1))
    keep = np.isin(lab, [i + 1 for i, s in enumerate(sizes) if s >= sizes.max() * 0.08])
    keep = ndimage.binary_fill_holes(keep)
    return Image.fromarray((keep * 255).astype(np.uint8))


def build(src):
    im, info = fetch(src)
    im = crop(im, src.get("crop"))
    width = src.get("width", 1400)
    kind = src["treat"]
    if kind == "cutout":
        # segment at a sane size, then scale
        im.thumbnail((2000, 2000), Image.LANCZOS)
        out = cutout(warm(im, src.get("warm", 0.6)), src.get("border", 0.012))
        ext = "webp"
    elif kind == "copy":
        out = photocopy(im, seed=len(src["id"]))
        ext = "jpg"
    else:
        out = warm(im, src.get("warm", 1.0))
        ext = "jpg"
    if out.width > width:
        out = out.resize((width, round(out.height * width / out.width)), Image.LANCZOS)
    os.makedirs(OUT, exist_ok=True)
    path = os.path.join(OUT, f"{src['id']}.{ext}")
    if ext == "webp":
        out.save(path, "WEBP", quality=84, method=6, alpha_quality=90)
    else:
        out.convert("L" if kind == "copy" else "RGB").save(path, "JPEG", quality=82, optimize=True, progressive=True)
    print(f"{src['id']:<16} {kind:<7} {out.width}x{out.height} {os.path.getsize(path) / 1e3:.0f} KB")
    return {"id": src["id"], "file": f"photos/{src['id']}.{ext}", "w": out.width, "h": out.height,
            "alt": src["alt"], "credit": {k: info[k] for k in ("title", "author", "license", "licenseUrl", "page")}}


def main():
    sources = json.load(open(os.path.join(ROOT, "photos", "sources.json")))
    only = set(sys.argv[1:])
    reg_path = os.path.join(ROOT, "photos", "built.json")
    built = json.load(open(reg_path)) if os.path.exists(reg_path) else {}
    for src in sources:
        if only and src["id"] not in only:
            continue
        try:
            built[src["id"]] = build(src)
        except Exception as e:  # rate limits and the like: the rest still build; run again later
            print(f"{src['id']:<16} FAILED {e}")
    ids = [s["id"] for s in sources]
    built = {k: built[k] for k in ids if k in built}
    json.dump(built, open(reg_path, "w"), indent=1)
    with open(os.path.join(ROOT, "src", "photos.ts"), "w") as fh:
        fh.write("// Written by scripts/photos.py from photos/sources.json. Do not edit by hand.\n\n")
        fh.write("export type Photo = { file: string; w: number; h: number; alt: string; credit: Credit };\n")
        fh.write("export type Credit = { title: string; author: string; license: string; licenseUrl: string; page: string };\n\n")
        fh.write("export const PHOTOS = {\n")
        for k in ids:
            if k in built:
                b = dict(built[k])
                b.pop("id")
                fh.write(f"  {json.dumps(k)}: {json.dumps(b, ensure_ascii=False)},\n")
        fh.write("} satisfies Record<string, Photo>;\n\nexport type PhotoId = keyof typeof PHOTOS;\n")
    with open(os.path.join(ROOT, "photos", "CREDITS.md"), "w") as fh:
        fh.write("# Photo credits\n\nWritten by `scripts/photos.py`. Every photo on the site is openly licensed; most are\n"
                 "cropped, cut out or recoloured for the collage; adaptations of CC BY-SA photos are shared under the\n"
                 "same licence. The site's footer lists the same credits.\n\n")
        for k in ids:
            if k not in built:
                continue
            c = built[k]["credit"]
            lic = f"[{c['license']}]({c['licenseUrl']})" if c["licenseUrl"] else c["license"]
            fh.write(f"- `{k}`: [{c['title']}]({c['page']}) by {c['author']}, {lic}\n")


if __name__ == "__main__":
    main()

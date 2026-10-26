"""Download the 3D scans in models/sources.json into models/cache/ (gitignored).

    python3 models/fetch.py

The scans are photogrammetry of real food, published on Sketchfab under CC BY by their authors and
mirrored as GLB in the Objaverse dataset (allenai/objaverse on Hugging Face), which is where they
come from here. Also fetches the studio HDRI from Poly Haven (CC0).
"""
import gzip
import json
import os
import time
import urllib.error
import urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
CACHE = os.path.join(HERE, "cache")
UA = {"User-Agent": "james-taylor-site/1.0 (model pipeline)"}
HF = "https://huggingface.co/datasets/allenai/objaverse/resolve/main/"


def get(url):
    for k in range(6):
        try:
            return urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=600).read()
        except urllib.error.HTTPError as e:
            if e.code != 429 or k == 5:
                raise
            wait = e.headers.get("Retry-After")
            time.sleep(int(wait) if wait and wait.isdigit() else 10 * 2**k)


def main():
    os.makedirs(CACHE, exist_ok=True)
    sources = json.load(open(os.path.join(HERE, "sources.json")))
    index = os.path.join(CACHE, "object-paths.json.gz")
    if not os.path.exists(index):
        open(index, "wb").write(get(HF + "object-paths.json.gz"))
    paths = json.load(gzip.open(index))
    for s in sources:
        out = os.path.join(CACHE, s["id"] + ".glb")
        if not os.path.exists(out):
            open(out, "wb").write(get(HF + paths[s["uid"]]))
            time.sleep(2)
        print(f"{s['id']:<10} {os.path.getsize(out) / 1e6:6.1f} MB  {s['name']} by {s['author']} ({s['license']})")
    hdri = os.path.join(CACHE, "studio_small_09.exr")
    if not os.path.exists(hdri):
        info = json.loads(get("https://api.polyhaven.com/files/studio_small_09"))
        open(hdri, "wb").write(get(info["hdri"]["2k"]["exr"]["url"]))
    print("hdri       studio_small_09 (Poly Haven, CC0)")
    # credits for the page footer
    with open(os.path.join(os.path.dirname(HERE), "src", "scans.ts"), "w") as fh:
        fh.write("// Written by models/fetch.py from models/sources.json. Do not edit by hand.\n\n")
        fh.write("export const SCANS = [\n")
        for s in sources:
            lic = {"CC Attribution": "CC BY 4.0", "CC0 Public Domain": "CC0"}.get(s["license"], s["license"])
            url = {"CC BY 4.0": "https://creativecommons.org/licenses/by/4.0/", "CC0": "https://creativecommons.org/publicdomain/zero/1.0/"}.get(lic, "")
            fh.write("  " + json.dumps({"id": s["id"], "title": s["name"], "author": s["author"], "license": lic, "licenseUrl": url,
                                         "page": s["page"]}, ensure_ascii=False) + ",\n")
        fh.write("];\n")


if __name__ == "__main__":
    main()

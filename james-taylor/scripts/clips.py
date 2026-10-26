"""Cut short silent loops from public-domain films on the Internet Archive (the Prelinger Archives),
for the moving prints on the page.

    python3 scripts/clips.py            # everything in photos/clips.json
    python3 scripts/clips.py cuts       # just one

Only the needed seconds are fetched (ffmpeg seeks over HTTP). Writes public/clips/<id>.mp4 (H.264),
<id>.webm (VP9) and a poster <id>.jpg, and src/clips.ts with sizes and credits. Needs ffmpeg.
"""
import json
import os
import subprocess
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "public", "clips")
UA = "james-taylor-site/1.0 (clip pipeline)"


def main():
    clips = json.load(open(os.path.join(ROOT, "photos", "clips.json")))
    only = set(sys.argv[1:])
    os.makedirs(OUT, exist_ok=True)
    for c in clips:
        if only and c["id"] not in only:
            continue
        url = f"https://archive.org/download/{c['item']}/{c['file']}"
        mp4 = os.path.join(OUT, c["id"] + ".mp4")
        # a touch of contrast and grain survives the compression better than the flat transfer
        subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-user_agent", UA, "-ss", str(c["from"]), "-to", str(c["to"]),
                        "-i", url, "-an", "-vf", "scale=720:-2:flags=lanczos,eq=contrast=1.06:saturation=1.05,fps=24",
                        "-c:v", "libx264", "-preset", "slow", "-crf", "27", "-pix_fmt", "yuv420p", "-movflags", "+faststart", mp4],
                       check=True)
        # VP9 too, for browsers built without H.264
        subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-i", mp4, "-c:v", "libvpx-vp9", "-b:v", "0", "-crf", "38",
                        "-row-mt", "1", "-deadline", "good", "-cpu-used", "2", os.path.join(OUT, c["id"] + ".webm")], check=True)
        subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-i", mp4, "-frames:v", "1", "-q:v", "4",
                        os.path.join(OUT, c["id"] + ".jpg")], check=True)
        print(f"{c['id']:<12} {os.path.getsize(mp4) / 1e3:.0f} KB")
    sizes = {}
    for c in clips:
        mp4 = os.path.join(OUT, c["id"] + ".mp4")
        if os.path.exists(mp4):
            w, h = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height",
                                   "-of", "csv=p=0", mp4], capture_output=True, text=True, check=True).stdout.strip().split(",")
            sizes[c["id"]] = (int(w), int(h))
    with open(os.path.join(ROOT, "src", "clips.ts"), "w") as fh:
        fh.write("// Written by scripts/clips.py from photos/clips.json. Do not edit by hand.\n\n")
        fh.write("export const CLIPS = {\n")
        for c in clips:
            if c["id"] not in sizes:
                continue
            w, h = sizes[c["id"]]
            entry = {"file": f"clips/{c['id']}.mp4", "webm": f"clips/{c['id']}.webm", "poster": f"clips/{c['id']}.jpg", "w": w, "h": h, "alt": c["alt"],
                     "credit": {"title": c["title"], "author": c["author"], "license": "Public domain",
                                "licenseUrl": "https://creativecommons.org/publicdomain/mark/1.0/",
                                "page": f"https://archive.org/details/{c['item']}"}}
            fh.write(f"  {json.dumps(c['id'])}: {json.dumps(entry, ensure_ascii=False)},\n")
        fh.write("};\n\nexport type ClipId = keyof typeof CLIPS;\n")


if __name__ == "__main__":
    main()

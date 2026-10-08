#!/usr/bin/env bash
# Extract the stills the film needs from the ACTIVE footage source (src/source.json: raw | mezz) and
# re-measure b44's freshly snapped line for the plan-cut registration (writes src/measured.json).
# Run after switching sources:  scripts/cpuq bash film/scripts/stills.sh
set -euo pipefail
cd "$(dirname "$0")/.."
S=/tmp/claude-0/-home-user/a462cba4-955f-5044-9e19-3a11e18ef1bf/scratchpad
SRC=$(python3 -c "import json;print(json.load(open('src/source.json'))['source'])")
P=public; mkdir -p $P/stills
if [[ $SRC == raw ]]; then
  C34=$P/clips/raw/c34.mp4; N01B=$P/clips/raw/n01b.mp4; B=$P/clips/raw/b4X.mp4
else
  C34=$P/clips/c34-169.mp4; N01B=$P/clips/n01b-916.mp4; B=$P/clips/b4X-1440.mp4
fi
grab() { ffmpeg -v error -y -i "$1" -vf "select=eq(n\,$2)" -frames:v 1 -update 1 "$3"; }
grab "$C34" 84 $P/stills/c34-f84.png
[[ -f "$N01B" ]] && grab "$N01B" 100 $P/stills/n01b-f100.png
grab "${B/X/4}" 62 $P/stills/b44-260.png
ffmpeg -v error -y -sseof -0.05 -i "${B/X/4}" -frames:v 1 -update 1 $P/stills/b44-last.png
for i in 0 1 2 3; do ffmpeg -v error -y -i "${B/X/$i}" -frames:v 1 -q:v 2 -update 1 $P/stills/b4$i-f0.jpg; done
$S/concept/wild-spike/venv/bin/python -I - "$P/stills/b44-260.png" src/measured.json "$SRC" <<'PY'
import sys, json
import numpy as np
from PIL import Image
a = np.asarray(Image.open(sys.argv[1]).convert('RGB')).astype(int)
r, g, b = a[..., 0], a[..., 1], a[..., 2]
m = (b > 170) & (b - r > 40) & (g > 140)          # bright, fresh chalk blue
rows = m.sum(1)
y = int(np.argmax(np.convolve(rows, np.ones(9), 'same')))   # densest horizontal band
band = m[y - 8:y + 9].any(0)
# longest run, bridging small gaps (the robot's hand / skips)
xs = np.where(band)[0]
runs, s0, prev = [], xs[0], xs[0]
for x in xs[1:]:
    if x - prev > 60:
        runs.append((s0, prev)); s0 = x
    prev = x
runs.append((s0, prev))
x0, x1 = max(runs, key=lambda t: t[1] - t[0])
out = {"source": sys.argv[3], "b44Fresh": {"x0": int(x0), "x1": int(x1), "y": y}}
json.dump(out, open(sys.argv[2], 'w'), indent=2)
print(out)
PY

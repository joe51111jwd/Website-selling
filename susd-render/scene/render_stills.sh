#!/bin/bash
# Final stills, review round 1 (one Blender at a time; waits if anything else is rendering; skips stills that exist).
#   bash scene/render_stills.sh [samples=32]
# Desktop 1600x1000, phone 900x1950, 16-bit PNG masters. Output: out/stills/, each with a .anchors.json;
# log: out/renders.jsonl. Story order is the file order; the render order puts the screens James judges first.
cd "$(dirname "$0")/.."
spp=${1:-32}
run() {  # name state camera w h
  while pgrep -x blender >/dev/null; do sleep 5; done
  [ -f "out/stills/$1.png" ] && { echo "skip $1 (exists)"; return; }
  blender -b -P scene/waterline.py -- --state "$2" --camera "$3" --w "$4" --h "$5" --samples "$spp" --label "$1" \
    --out "out/stills/$1.png" 2>&1 | grep -E "Error|Traceback|File \"|WARNING|RENDER_SECONDS" | sed "s|^|[$1] |"
}
run d01_hero_K1       hero      desktop 1600 1000
run p01_hero_K1       hero      phone   900 1950
run d05_redline_K6    redline   desktop 1600 1000
run d13_finale_K16F   finale    desktop 1600 1000
run d04_under_K5      under     desktop 1600 1000
run d12_oxygen_K16    oxygen    desktop 1600 1000
run d03_touch_K3      touch     desktop 1600 1000
run d08_down1_K9      down1     desktop 1600 1000
run d02_twelve_K2     twelve    desktop 1600 1000
run d07_side1_K8      side1     desktop 1600 1000
run d10_side2_K11     side2     desktop 1600 1000
run d11_up3_K13       up3       desktop 1600 1000
run d06_turn_K7       turn      desktop 1600 1000
run d09_up2_K10       up2       desktop 1600 1000
run d14_drain_K17     drain_end desktop 1600 1000
run p02_under_K5      under     phone   900 1950
echo ALL_DONE

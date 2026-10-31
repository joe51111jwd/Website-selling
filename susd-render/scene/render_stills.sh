#!/bin/bash
# Final stills, review round 2 (one Blender at a time; waits if anything else is rendering; skips stills that exist).
#   bash scene/render_stills.sh [samples=32]
# Desktop 1600x1000 at 32 samples; phone hero and under at 900x1950, 32 samples; the other phone beats at 600x1300,
# 24 samples (mock-size checks, as the technical review asked: legibility and framing on phone for every beat).
# 16-bit PNG masters. Output: out/stills/, each with a .anchors.json; log: out/renders.jsonl.
# Round 3's stills are in out/stills/r3/ (the canal lock), round 2's in r2/, round 1's in r1/.
cd "$(dirname "$0")/.."
spp=${1:-32}
run() {  # name w h samples extra-args...
  local name=$1 w=$2 h=$3 s=$4; shift 4
  while pgrep -x blender >/dev/null; do sleep 5; done
  [ -f "out/stills/$name.png" ] && { echo "skip $name (exists)"; return; }
  blender -b -P scene/waterline.py -- "$@" --w "$w" --h "$h" --samples "$s" --label "$name" \
    --out "out/stills/$name.png" 2>&1 | grep -E "Error|Traceback|File \"|WARNING|Assert|RENDER_SECONDS" | sed "s|^|[$name] |"
}
# the screens James judges first, then the rest of the story, then the phone
run d01_hero_K1      1600 1000 "$spp" --state hero
run d04_under_K5     1600 1000 "$spp" --state under
run d05_redline_K6   1600 1000 "$spp" --state redline
run d03_touch_K3     1600 1000 "$spp" --state touch
run d13_finale_K16F  1600 1000 "$spp" --state finale
run d12_oxygen_K16   1600 1000 "$spp" --state oxygen
run d02_twelve_K2    1600 1000 "$spp" --state twelve
run d06_turn_K7      1600 1000 "$spp" --state turn
run d07_side1_K8     1600 1000 "$spp" --state side1
run d08_down1_K9     1600 1000 "$spp" --state down1
run d10_side2_K11    1600 1000 "$spp" --state side2
run d11_up3_K13      1600 1000 "$spp" --state up3
run d14_drain_K17    1600 1000 "$spp" --state drain_end
run d15_hire_n10     1600 1000 "$spp" --between K1,K2,0.5 --n 10 --frame 9
run d09_up2_K10      1600 1000 "$spp" --state up2
run p01_hero_K1      900 1950 "$spp" --state hero --camera phone
run p02_under_K5     900 1950 "$spp" --state under --camera phone
run p03_twelve_K2    600 1300 24 --state twelve --camera phone
run p04_touch_K3     600 1300 24 --state touch --camera phone
run p05_redline_K6   600 1300 24 --state redline --camera phone
run p06_turn_K7      600 1300 24 --state turn --camera phone
run p07_down1_K9     600 1300 24 --state down1 --camera phone
run p08_oxygen_K16   600 1300 24 --state oxygen --camera phone
run p09_finale_K16F  600 1300 24 --state finale --camera phone
echo ALL_DONE

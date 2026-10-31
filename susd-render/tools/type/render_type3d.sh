#!/bin/bash
# Queue of 3D type tests in the lock-wall staging. Waits for any other Blender render to finish
# before each one (only one render can use the CPU well at a time).
cd "$(dirname "$0")/../.."
SYS=$PWD/docs/type/system
OUT=docs/type/specimens/3d
mkdir -p $OUT
run() {  # name font level
  while pgrep -f "blender -b" >/dev/null; do sleep 4; done
  blender -b -P tools/type/type3d.py -- --stage c --font "$2" --level "$3" --letters dark \
    --w 960 --h 600 --samples 24 --out "$OUT/lock-$3-$1.png" 2>&1 | grep -E "RENDER_SECONDS|Error|LEVEL"
}
run plimsoll "$SYS/Plimsoll-Heavy.otf" touch
run ortica "$SYS/Ortica-AngularBold.otf" touch
run plimsoll "$SYS/Plimsoll-Heavy.otf" over
run ortica "$SYS/Ortica-AngularBold.otf" over
echo QUEUE_DONE

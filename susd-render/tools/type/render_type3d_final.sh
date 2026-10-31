#!/bin/bash
# The recommended 3D setting of Plimsoll (kerned, +3% tracking, caps line pitch 1.32) at touch and over.
cd "$(dirname "$0")/../.."
SYS=$PWD/docs/type/system
OUT=docs/type/specimens/3d
run() {  # level
  while pgrep -f "blender -b" >/dev/null; do sleep 4; done
  blender -b -P tools/type/type3d.py -- --stage c --font "$SYS/Plimsoll-Heavy.otf" --kern 1 --track 0.03 \
    --capspitch 1.32 --level "$1" --letters dark --w 960 --h 600 --samples 24 \
    --out "$OUT/lock-$1-plimsoll-set.png" 2>&1 | grep -E "RENDER_SECONDS|Error|Traceback|KERN|CAPS"
}
run touch
run over
echo QUEUE_DONE

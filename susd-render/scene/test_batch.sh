#!/bin/bash
# Sequential test renders (one Blender at a time). Usage: bash scene/test_batch.sh <tag> <w> <h> <samples> state[:camera] ...
cd "$(dirname "$0")/.."
tag=$1; w=$2; h=$3; spp=$4; shift 4
for item in "$@"; do
  st=${item%%:*}; camopt=""; [[ "$item" == *:* ]] && camopt="--camera ${item##*:}"
  while pgrep -x blender >/dev/null; do sleep 3; done
  out="out/${TESTDIR:-test}/${tag}_${st}${camopt:+_${item##*:}}.png"
  blender -b -P scene/waterline.py -- --state "$st" $camopt --w "$w" --h "$h" --samples "$spp" --out "$out" --depth 8 $EXTRA 2>&1 \
    | grep -E "Error|Traceback|File \"|BUILD_SECONDS|RENDER_SECONDS" | sed "s|^|[$st] |"
done

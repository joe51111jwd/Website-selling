#!/usr/bin/env bash
# Render check stills from the prebuilt bundle: check.sh <Comp> <outPrefix> <frame> [frame...]
# Run via scripts/cpuq. Writes JPEGs to film/out/check/.
set -euo pipefail
cd "$(dirname "$0")/.."
comp=$1; pre=$2; shift 2
for f in "$@"; do
  npx remotion still build "$comp" "out/check/${pre}-$(printf %04d "$f").jpg" --frame="$f" --image-format=jpeg --jpeg-quality=88 --log=error
done

#!/usr/bin/env bash
# Bundle once and render draft MP4s of the given compositions (run via scripts/cpuq).
set -euo pipefail
cd "$(dirname "$0")/.."
npx remotion bundle src/index.ts --out-dir=build --log=error
for comp in "$@"; do
  npx remotion render build "$comp" "out/draft-${comp}.mp4" --concurrency=2 --crf=20 --log=error
  echo "rendered $comp"
done

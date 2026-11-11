#!/usr/bin/env bash
# Render the packing sequence (frames 0..120 -> blender/out/sequence/####.png) in resumable
# chunks, then publish it (WebP 1280 + 720 + manifest.json) with tools/optimize.py.
#
#   tools/render_sequence.sh                 # all 121 frames, chunks of 10, skips frames already on disk
#   CHUNK=6 tools/render_sequence.sh         # smaller chunks (each chunk = one Blender process)
#   FIRST=40 LAST=80 tools/render_sequence.sh
#   FORCE=1 tools/render_sequence.sh         # re-render everything
#   EXTRA="--samples 96" tools/render_sequence.sh
#
# Safe to Ctrl-C and re-run: a frame is only skipped once its PNG exists (Blender writes the file
# at the end of the frame, so an interrupted frame is simply rendered again).
set -euo pipefail
cd "$(dirname "$0")/.."                       # -> chainmail/
BLENDER="${BLENDER:-blender}"
FIRST="${FIRST:-0}"
LAST="${LAST:-120}"
CHUNK="${CHUNK:-10}"
OUT="blender/out/sequence"
EXTRA="${EXTRA:-}"
mkdir -p "$OUT" blender/out/logs

missing() {  # frames in [$1, $2] without a PNG
  local f
  for ((f = $1; f <= $2; f++)); do
    [[ -n "${FORCE:-}" || ! -s "$(printf '%s/%04d.png' "$OUT" "$f")" ]] && echo "$f"
  done
}

start=$(date +%s)
for ((a = FIRST; a <= LAST; a += CHUNK)); do
  b=$((a + CHUNK - 1)); ((b > LAST)) && b=$LAST
  todo=$(missing "$a" "$b" | wc -l)
  if [[ "$todo" -eq 0 ]]; then
    echo "[render_sequence] $a-$b already rendered"
    continue
  fi
  echo "[render_sequence] frames $a-$b ($todo to render) ..."
  "$BLENDER" -b --factory-startup --python-exit-code 1 -P blender/scenes/kit_sequence.py -- --frames "$a-$b" \
      ${FORCE:+--force} $EXTRA > "blender/out/logs/sequence_${a}-${b}.log" 2>&1 \
    || { echo "[render_sequence] chunk $a-$b FAILED, see blender/out/logs/sequence_${a}-${b}.log"; exit 1; }
  grep -E "^\[seq\] (wrote|total)" "blender/out/logs/sequence_${a}-${b}.log" | tail -n 3 || true
done

left=$(FORCE= missing "$FIRST" "$LAST" | wc -l)
if [[ "$left" -ne 0 ]]; then
  echo "[render_sequence] $left frames still missing - re-run to resume"; exit 1
fi
echo "[render_sequence] all frames present ($(( ($(date +%s) - start) / 60 )) min). Publishing ..."
python3 tools/optimize.py sequence

#!/usr/bin/env bash
# Render the packing sequence (frames 0..120 -> blender/out/sequence/####.png) in resumable
# chunks, then publish it (WebP 1280 + 720 + manifest.json) with tools/optimize.py.
#
#   tools/render_sequence.sh                 # all 121 frames, chunks of 15, skips frames already on disk
#   CHUNK=6 tools/render_sequence.sh         # smaller chunks (each chunk = one Blender process)
#   FIRST=40 LAST=80 tools/render_sequence.sh
#   FORCE=1 tools/render_sequence.sh         # re-render everything
#   EXTRA="--samples 96" tools/render_sequence.sh
#   tools/render_sequence.sh --freeze        # (re)snapshot blender/lib -> blender/lib_frozen_seq, then exit
#
# Geometry lock: kit_sequence.py (and kit_hero_open.py) import the item libs AND blender/assets (fonts,
# HDRIs, generated label/logo textures) from the frozen snapshot blender/lib_frozen_seq/ (sha256
# MANIFEST, verified at start), so other agents editing blender/lib
# cannot change the kit between chunks. The snapshot digest is stamped into $OUT/.libs_digest by the
# first rendered chunk; a later run with a different snapshot refuses to mix frames (FORCE=1 to re-render
# everything with the new one). After --freeze, re-run the hero and `kit_sequence.py -- --check`.
#
# Safe to Ctrl-C / kill and re-run: kit_sequence.py renders each frame to ####.tmp.png and renames it
# only once the PNG is complete, and a frame is only skipped if its PNG is whole (signature + IEND
# chunk; with PIL available also Image.verify()). Truncated/corrupt frames and stale *.tmp.png files
# are deleted here before every chunk, so they are simply rendered again.
set -euo pipefail
cd "$(dirname "$0")/.."                       # -> chainmail/
BLENDER="${BLENDER:-blender}"
FIRST="${FIRST:-0}"
LAST="${LAST:-120}"
CHUNK="${CHUNK:-15}"
OUT="blender/out/sequence"
EXTRA="${EXTRA:-}"
mkdir -p "$OUT" blender/out/logs

if [[ "${1:-}" == "--freeze" ]]; then
  python3 blender/lib/seq_freeze.py | head -n 1
  echo "[render_sequence] snapshot refreshed: re-run kit_hero_open.py and kit_sequence.py -- --check before rendering"
  exit 0
fi
if [[ ! -f blender/lib_frozen_seq/MANIFEST.json ]]; then
  echo "[render_sequence] no lib snapshot (blender/lib_frozen_seq) - run: tools/render_sequence.sh --freeze"; exit 1
fi
DIGEST=$(python3 -c "import sys; sys.path.insert(0, 'blender/lib'); import seq_freeze, json; print(seq_freeze.digest(json.load(open(seq_freeze.FROZEN_DIR + '/MANIFEST.json'))))")
if [[ -f "$OUT/.libs_digest" && "$(cat "$OUT/.libs_digest")" != "$DIGEST" && -z "${FORCE:-}" ]]; then
  if ls "$OUT"/[0-9][0-9][0-9][0-9].png >/dev/null 2>&1; then
    echo "[render_sequence] frames on disk were rendered with lib snapshot $(cat "$OUT/.libs_digest"), the snapshot is now"
    echo "  $DIGEST - refusing to mix geometry. Use FORCE=1 to re-render all, or restore the old snapshot."; exit 1
  fi
fi
echo "$DIGEST" > "$OUT/.libs_digest"
echo "[render_sequence] lib snapshot $DIGEST"

missing() {  # frames in [$1, $2] without a complete PNG (corrupt ones are deleted)
  if [[ -n "${FORCE:-}" ]]; then seq "$1" "$2"; return; fi
  python3 - "$OUT" "$1" "$2" <<'PY'
import os, sys
out, a, b = sys.argv[1], int(sys.argv[2]), int(sys.argv[3])
try:
    from PIL import Image
except ImportError:
    Image = None
for f in range(a, b + 1):
    p = os.path.join(out, f"{f:04d}.png")
    t = os.path.join(out, f"{f:04d}.tmp.png")
    if os.path.exists(t):
        os.remove(t)
    ok = False
    if os.path.exists(p) and os.path.getsize(p) > 64:
        with open(p, "rb") as fh:
            head = fh.read(8); fh.seek(-12, os.SEEK_END); tail = fh.read(12)
        ok = head == b"\x89PNG\r\n\x1a\n" and tail[4:8] == b"IEND"
        if ok and Image is not None:
            try:
                with Image.open(p) as im:
                    im.verify()
            except Exception:
                ok = False
        if not ok:
            os.remove(p)
            print(f"[render_sequence] removed corrupt {p}", file=sys.stderr)
    if not ok:
        print(f)
PY
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

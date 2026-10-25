#!/bin/bash
# Pack every finished render for the site (skips anything not rendered yet).
set -eu
cd "$(dirname "$0")/.."
O=blender/out
[ -f "$O/film/burger/0090.png" ] && python3 scripts/pack.py "$O/film/burger" film-burger --width 640 --quality 80 --anchors
[ -f "$O/film/steak/0080.png" ] && python3 scripts/pack.py "$O/film/steak" film-steak --width 1280 --quality 76
for d in ribeye burger latkes chicken pie; do
  [ -f "$O/turn/$d/0048.png" ] && python3 scripts/pack.py "$O/turn/$d" "turn-$d" --width 720 --quality 80
done
[ -f "$O/lineup/lineup.png" ] && python3 scripts/lineup_og.py
du -sh public/seq public/media 2>/dev/null || true

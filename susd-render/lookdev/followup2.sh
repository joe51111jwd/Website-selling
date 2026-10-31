#!/usr/bin/env bash
# After followup.sh: the sequence cost at the recommended sequence sample count (16).
set -u
until grep -q FOLLOWUP_DONE lookdev/followup.log 2>/dev/null; do sleep 10; done
python3 tools/render_idle.py blender -b -P lookdev/stage_c_lock.py -- --w 1440 --h 900 --samples 16 --level touch --wc 0.3 --seq 1.30,1.36,1.42 --out lookdev/full/c_seq16.png --label seq16
echo FOLLOWUP2_DONE

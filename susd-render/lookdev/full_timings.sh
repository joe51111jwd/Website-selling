#!/usr/bin/env bash
# Full-size timing batch: every staging at 1440x900 and 1600x1000, a sample-count ladder for the
# recommended staging, and a 4-frame sequence in one session (persistent data). One render at a
# time via tools/render_idle.py (waits for a free CPU, logs any overlap in renders.jsonl).
# Run from susd-render/:  bash lookdev/full_timings.sh
set -u
R="python3 tools/render_idle.py blender -b -P"
mkdir -p lookdev/full
# (c) lock wall, open water: the recommended staging
$R lookdev/stage_c_lock.py -- --w 1440 --h 900 --samples 32 --level over --out lookdev/full/c_lock_1440_s32.png --label full
$R lookdev/stage_c_lock.py -- --w 1600 --h 1000 --samples 32 --level over --out lookdev/full/c_lock_1600_s32.png --label full
$R lookdev/stage_c_lock.py -- --w 1440 --h 900 --samples 16 --level over --out lookdev/full/c_lock_1440_s16.png --label full
$R lookdev/stage_c_lock.py -- --w 1440 --h 900 --samples 64 --level over --out lookdev/full/c_lock_1440_s64.png --label full
# (c-window) the same wall through the gallery glass, drowned
$R lookdev/stage_c_lock.py -- --w 1440 --h 900 --samples 32 --window 1 --level drown --out lookdev/full/c_window_1440_s32.png --label full
$R lookdev/stage_c_lock.py -- --w 1600 --h 1000 --samples 32 --window 1 --level drown --out lookdev/full/c_window_1600_s32.png --label full
# (b) flooded room (b08 look)
$R lookdev/stage_b_room.py -- --w 1440 --h 900 --samples 32 --key sky --streak 1 --level below --out lookdev/full/b_room_1440_s32.png --label full
$R lookdev/stage_b_room.py -- --w 1600 --h 1000 --samples 32 --key sky --streak 1 --level below --out lookdev/full/b_room_1600_s32.png --label full
# (a) tank (a11 look)
$R lookdev/stage_a_tank.py -- --w 1440 --h 900 --samples 32 --caustics surface --sun 4 --level over --out lookdev/full/a_tank_1440_s32.png --label full
$R lookdev/stage_a_tank.py -- --w 1600 --h 1000 --samples 32 --caustics surface --sun 4 --level over --out lookdev/full/a_tank_1600_s32.png --label full
# sequence: 4 frames, water rising from touching the words to crossing line 3, one session
$R lookdev/stage_c_lock.py -- --w 1440 --h 900 --samples 32 --level touch --seq 1.10,1.16,1.22,1.28 --out lookdev/full/c_seq.png --label seq
echo FULL_TIMINGS_DONE

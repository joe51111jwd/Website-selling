#!/usr/bin/env bash
# After full_timings.sh: an MNEE caustics test on staging (a) against the shadow-ray caustics, and
# the recommended stills in the final face (Plimsoll Heavy via tools/type/type3d.py).
set -u
until grep -q FULL_TIMINGS_DONE lookdev/full_timings.log 2>/dev/null; do sleep 10; done
R="python3 tools/render_idle.py blender -b -P"
$R lookdev/stage_a_tank.py -- --w 720 --h 450 --samples 24 --caustics surface --sun 4 --level over --out lookdev/a/a12_surface_ref.png --label a12
$R lookdev/stage_a_tank.py -- --w 720 --h 450 --samples 24 --caustics mnee --sun 4 --level over --out lookdev/a/a13_mnee.png --label a13
T="--stage c --font /home/user/Website-selling/susd-render/docs/type/system/Plimsoll-Heavy.otf --kern 1 --track 0.03 --capspitch 1.32"
$R tools/type/type3d.py -- $T --w 1440 --h 900 --samples 32 --level touch --wc 0.3 --out lookdev/full/c_lock_plimsoll_touch_1440_s32.png
$R tools/type/type3d.py -- $T --w 1440 --h 900 --samples 32 --window 1 --level drown --out lookdev/full/c_window_plimsoll_drown_1440_s32.png
echo FOLLOWUP_DONE

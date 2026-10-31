#!/usr/bin/env bash
# The recommended stills in the final face (Plimsoll Heavy via tools/type/type3d.py). Font path must be absolute.
set -u
until grep -q FOLLOWUP2_DONE lookdev/followup2.log 2>/dev/null; do sleep 10; done
R="python3 tools/render_idle.py blender -b -P"
T="--stage c --font /home/user/Website-selling/susd-render/docs/type/system/Plimsoll-Heavy.otf --kern 1 --track 0.03 --capspitch 1.32"
$R tools/type/type3d.py -- $T --w 1440 --h 900 --samples 32 --level touch --wc 0.3 --out lookdev/full/c_lock_plimsoll_touch_1440_s32.png
$R tools/type/type3d.py -- $T --w 1440 --h 900 --samples 32 --window 1 --level drown --out lookdev/full/c_window_plimsoll_drown_1440_s32.png
echo FOLLOWUP3_DONE

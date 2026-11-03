#!/bin/bash
# Render the focus film's frames from focus.blend (made by focus_film.py) into out/fseq.
# The rush and the fall get motion blur; the rest does not; the finished building is held.
# A stopped run picks up where it left off (frames already on disk are skipped).
# Frames before 28 are not used: the page opens with prologue.py's 89 pictures, as on /.
cd "$(dirname "$0")"
B=${BLENDER:-blender}
W=${W:-1600}; H=${H:-1000}; S=${S:-18}
SET="import bpy; sc=bpy.context.scene; sc.cycles.samples=$S; sc.cycles.adaptive_threshold=0.03; sc.render.resolution_x=$W; sc.render.resolution_y=$H; sc.render.use_overwrite=False; sc.render.use_placeholder=True"
mkdir -p out/fseq
$B -b focus.blend --python-expr "$SET; sc.render.use_motion_blur=True; sc.render.motion_blur_shutter=0.5" -o "$PWD/out/fseq/f####" -x 1 -F PNG -s 28 -e 146 -a
$B -b focus.blend --python-expr "$SET; sc.render.use_motion_blur=False" -o "$PWD/out/fseq/f####" -x 1 -F PNG -s 147 -e 332 -a
for f in $(seq 333 354); do cp out/fseq/f0332.png out/fseq/f$(printf %04d $f).png; done
echo FOCUS RENDER DONE

#!/bin/bash
# Render the focus film's frames from focus.blend (made by focus_film.py) into out/fseq.
# The rush and the fall get motion blur; the rest does not. The page uses frames 28-332.
# A stopped run picks up where it left off (frames already on disk are skipped).
# Frames before 28 are not used: the page opens with prologue.py's 89 pictures, as on /.
cd "$(dirname "$0")"
B=${BLENDER:-blender}
W=${W:-1600}; H=${H:-1000}; S=${S:-12}
SET="import bpy; sc=bpy.context.scene; sc.cycles.samples=$S; sc.cycles.adaptive_threshold=0.03; sc.render.resolution_x=$W; sc.render.resolution_y=$H; sc.render.use_overwrite=False; sc.render.use_placeholder=True"
mkdir -p out/fseq
$B -b focus.blend --python-expr "$SET; sc.render.use_motion_blur=True; sc.render.motion_blur_shutter=0.5" -o "$PWD/out/fseq/f####" -x 1 -F PNG -s 28 -e 146 -a
$B -b focus.blend --python-expr "$SET; sc.render.use_motion_blur=False" -o "$PWD/out/fseq/f####" -x 1 -F PNG -s 147 -e 332 -a
echo FOCUS RENDER DONE

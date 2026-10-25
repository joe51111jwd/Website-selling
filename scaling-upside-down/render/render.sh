#!/bin/bash
# Render the story frames from foundation.blend (made by story.py) into out/seq.
# The rush and the fall get motion blur; the rebuild does not; the last frame is held.
# Frames before 28 (the old drop-in intro) are not used: the page opens with prologue.py instead.
cd "$(dirname "$0")"
B=${BLENDER:-blender}
SET="import bpy; sc=bpy.context.scene; sc.cycles.samples=18; sc.cycles.adaptive_threshold=0.03; sc.render.resolution_x=1600; sc.render.resolution_y=1000; sc.render.use_overwrite=False; sc.render.use_placeholder=True"
mkdir -p out/seq
$B -b foundation.blend --python-expr "$SET; sc.render.use_motion_blur=True; sc.render.motion_blur_shutter=0.5" -o "$PWD/out/seq/f####" -x 1 -F PNG -s 28 -e 146 -a
$B -b foundation.blend --python-expr "$SET; sc.render.use_motion_blur=False" -o "$PWD/out/seq/f####" -x 1 -F PNG -s 147 -e 319 -a
for f in $(seq 320 340); do cp out/seq/f0319.png out/seq/f$(printf %04d $f).png; done

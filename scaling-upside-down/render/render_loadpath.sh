#!/bin/bash
# Render the focus film (loadpath.blend, made by loadpath.py) into out/lseq, every frame.
# A stopped run picks up where it left off (frames already on disk are skipped; delete any empty PNG first).
cd "$(dirname "$0")"
B=${BLENDER:-blender}
W=${W:-1600}; H=${H:-1000}; S=${S:-12}
mkdir -p out/lseq
$B -b loadpath.blend --python-expr "import bpy; sc=bpy.context.scene; sc.cycles.samples=$S; sc.render.resolution_x=$W; sc.render.resolution_y=$H; sc.render.use_overwrite=False; sc.render.use_placeholder=True" -o "$PWD/out/lseq/f####" -x 1 -F PNG -a
echo LOADPATH RENDER DONE

#!/bin/bash
# Render the words film's frames from words.blend (made by words_film.py) into out/wseq (or $OUT).
# The rush and the fall get motion blur; the rest does not. The page uses frames 29 to the end (frame 28
# is the hero, which the page already has: the opening's last picture).
# A stopped run picks up where it left off (frames already on disk are skipped; delete any empty PNG a
# stopped run left before running it again).
#   W=1600 H=1000 S=12 BLENDER=blender ./render_words.sh
#   W=480 H=300 S=4 OUT=out/wprev BLENDER=blender ./render_words.sh      (a quick look at the whole film)
cd "$(dirname "$0")"
B=${BLENDER:-blender}
W=${W:-1600}; H=${H:-1000}; S=${S:-12}; OUT=${OUT:-out/wseq}
END=$(python3 -c "import json; print(json.load(open('out/words_timeline.json'))['end'])")
SET="import bpy; sc=bpy.context.scene; sc.cycles.samples=$S; sc.cycles.adaptive_threshold=0.03; sc.render.resolution_x=$W; sc.render.resolution_y=$H; sc.render.use_overwrite=False; sc.render.use_placeholder=True"
mkdir -p "$OUT"
$B -b words.blend --python-expr "$SET; sc.render.use_motion_blur=True; sc.render.motion_blur_shutter=0.5" -o "$PWD/$OUT/f####" -x 1 -F PNG -s 29 -e 146 -a
$B -b words.blend --python-expr "$SET; sc.render.use_motion_blur=False" -o "$PWD/$OUT/f####" -x 1 -F PNG -s 147 -e "$END" -a
echo WORDS RENDER DONE

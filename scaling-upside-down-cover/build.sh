#!/bin/bash
# Rebuild every cover file from source. Run from this folder:  ./build.sh [fronts|mockups|wrap|all]
# Needs: node + Playwright's Chromium (pre-installed in Claude Code cloud sessions), ImageMagick, Python 3 + Pillow,
# Blender 4.5 (BLENDER=/path/to/blender), and the Poly Haven CC0 assets in $ASSETS (see README).
set -e
cd "$(dirname "$0")"
BLENDER=${BLENDER:-blender}
ASSETS=${ASSETS:-assets}           # fine_grained_wood_{col,nor_gl,rough}_2k.jpg and studio.hdr
SPINE_IN=${SPINE_IN:-0.9}          # placeholder spine width, inches (see README: depends on page count)
what=${1:-all}

assets() {
  # Poly Haven CC0 textures and HDRI (not committed: 9 MB, and free to fetch again)
  mkdir -p $ASSETS
  [ -f $ASSETS/studio.hdr ] || curl -sL -o $ASSETS/studio.hdr https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/2k/studio_small_09_2k.hdr
  for m in col nor_gl rough; do
    [ -f $ASSETS/fine_grained_wood_${m}_2k.jpg ] || curl -sL -o $ASSETS/fine_grained_wood_${m}_2k.jpg \
      https://dl.polyhaven.org/file/ph-assets/Textures/jpg/2k/fine_grained_wood/fine_grained_wood_${m}_2k.jpg
  done
}
assets

fronts() {
  # the block stack for A (about 9 minutes on 4 CPU cores)
  if [ ! -f out/render/blocks_front.png ]; then
    python3 src/blender/make_faces.py $ASSETS/fine_grained_wood_col_2k.jpg src/tex fonts
    (cd src/blender && $BLENDER -b -P blocks.py -- --tex ../tex --wood ../../$ASSETS --hdr ../../$ASSETS/studio.hdr \
      --w 1500 --h 2140 --samples 220 --out ../../out/render/blocks_front.png)
    python3 src/measure_render.py out/render/blocks_front.png
  fi
  for d in a-stack b-upside-down c-cycle; do
    node src/render.cjs src/covers/$d.html out/flat/$d                      # 1875 x 2775 with bleed, + vector PDF
    convert out/flat/$d.png -crop 1800x2700+37+37 +repage out/flat/$d-trim.png  # what the reader sees
  done
  for d in a b c; do node src/render.cjs src/covers/spine.html out/spine/spine-$d --dir $d --in $SPINE_IN; rm -f out/spine/spine-$d.pdf; done
  thumbs
}

thumbs() {
  # Amazon shows a cover about 150 px wide; check 150 and 100, on white (the page) and in a row
  for d in a-stack b-upside-down c-cycle; do
    convert out/flat/$d-trim.png -resize 150x -bordercolor "#dddddd" -border 1 out/thumbs/$d-150.png
    convert out/flat/$d-trim.png -resize 100x -bordercolor "#dddddd" -border 1 out/thumbs/$d-100.png
  done
  convert -size 20x10 xc:white sp.png
  convert -background white out/thumbs/a-stack-150.png sp.png out/thumbs/b-upside-down-150.png sp.png out/thumbs/c-cycle-150.png +append \
    -bordercolor white -border 20 out/thumbs/row-150.png
  convert -background white out/thumbs/a-stack-100.png sp.png out/thumbs/b-upside-down-100.png sp.png out/thumbs/c-cycle-100.png +append \
    -bordercolor white -border 20 out/thumbs/row-100.png
  rm sp.png
}

mockups() {
  for d in a b c; do
    edge="#f1ebdf"; [ $d = b ] && edge="#1c1a17"
    f=$(ls out/flat/ | grep "^$d-.*[a-z].png$" | grep -v trim | head -1)
    # the front board carries the trim plus the 0.125 in that wraps the head, tail and fore-edge: drop the spine-side bleed
    convert out/flat/$f -crop 1838x2775+37+0 +repage out/render/front-$d.png
    (cd src/blender && $BLENDER -b -P mockup.py -- --front ../../out/render/front-$d.png --spine ../../out/spine/spine-$d.png \
      --spine_in $SPINE_IN --edge "$edge" --hdr ../../$ASSETS/studio.hdr --w 1600 --h 2000 --samples 128 --out ../../out/mockups/mockup-$d.png)
  done
}

wrap() {
  node src/render.cjs src/covers/wrap.html out/wrap/wrap --spine $SPINE_IN
  node src/render.cjs src/covers/wrap.html out/wrap/wrap-guides --spine $SPINE_IN --guides 1
}

case $what in
  fronts) fronts ;; thumbs) thumbs ;; mockups) mockups ;; wrap) wrap ;;
  all) fronts; mockups; wrap ;;
esac

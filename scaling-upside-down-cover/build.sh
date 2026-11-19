#!/bin/bash
# Rebuild every cover file from source. Run from this folder:  ./build.sh [fronts|mockups|wrap|all]
# Needs: node + Playwright's Chromium (pre-installed in Claude Code cloud sessions), ImageMagick, Python 3 + Pillow,
# Blender 4.5 (BLENDER=/path/to/blender), and the Poly Haven CC0 assets in $ASSETS (see README).
set -e
cd "$(dirname "$0")"
BLENDER=${BLENDER:-blender}
ASSETS=${ASSETS:-assets}           # fine_grained_wood_{col,nor_gl,rough}_2k.jpg and studio.hdr
SPINE_IN=${SPINE_IN:-0.9}          # placeholder spine width, inches (see README: depends on page count)
ALL="a-stack b-upside-down c-cycle d-twelve e-trap f-tete-beche g-rings h-boot i-ledger j-scaling"   # the ten, in order 1-10
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
  # the inverted tower for E (about 10 minutes)
  [ -f out/render/tower.png ] || (cd src/blender && $BLENDER -b -P inverted.py -- --wood ../../$ASSETS --hdr ../../$ASSETS/studio.hdr \
      --w 1875 --h 2775 --samples 96 --out ../../out/render/tower.png)
  # 7's log slice (about 6 minutes) and 8's characters
  if [ ! -f out/render/rings.png ]; then
    python3 src/blender/make_rings.py src/tex
    (cd src/blender && $BLENDER -b -P rings.py -- --tex ../tex --hdr ../../$ASSETS/studio.hdr --w 1875 --h 2775 --samples 64 --out ../../out/render/rings.png)
  fi
  python3 -c "import json;d=json.load(open('src/tex/rings.json'));open('out/render/rings_bands.js','w').write('window.RINGS='+json.dumps(d)+';\\n')" 2>/dev/null || true
  python3 -c "import json;d=json.load(open('out/render/rings.json'));open('out/render/rings_place.js','w').write('window.PLACE='+json.dumps(d)+';\\n')"
  python3 src/make_ascii.py out/render/blocks_front.png out/render/ascii.js --cols 92
  for d in $ALL; do
    node src/render.cjs src/covers/$d.html out/flat/$d                      # 1875 x 2775 with bleed, + vector PDF
    convert out/flat/$d.png -crop 1800x2700+37+37 +repage out/flat/$d-trim.png  # what the reader sees
  done
  for d in a b c d e f g h i j; do node src/render.cjs src/covers/spine.html out/spine/spine-$d --dir $d --in $SPINE_IN; rm -f out/spine/spine-$d.pdf; done
  thumbs
}

thumbs() {
  # Amazon shows a cover about 150 px wide; check 150 and 100, all five in a row on white, numbered
  for d in $ALL; do
    convert out/flat/$d-trim.png -resize 150x -bordercolor "#dddddd" -border 1 out/thumbs/$d-150.png
    convert out/flat/$d-trim.png -resize 100x -bordercolor "#dddddd" -border 1 out/thumbs/$d-100.png
  done
  for w in 150 100; do
    args=""; for d in $ALL; do args="$args out/thumbs/$d-$w.png"; done
    convert -background white $args -splice 24x0 +append -bordercolor white -border 20 out/thumbs/row-$w.png
    # the same row numbered under each cover, so James can name his two
    n=1; nargs=""
    for d in $ALL; do
      convert out/thumbs/$d-$w.png -background white -gravity south -splice 0x34 -font fonts/InterTight-Medium.ttf -pointsize 22 \
        -fill "#1c1a17" -annotate +0+4 "$n" out/thumbs/n-$d-$w.png
      nargs="$nargs out/thumbs/n-$d-$w.png"; n=$((n+1))
    done
    convert -background white $nargs -splice 24x0 +append -bordercolor white -border 20 out/thumbs/row-$w-numbered.png
    rm out/thumbs/n-*.png
  done
}

sheet() {
  # the contact sheet: all ten, numbered; fronts 1-5 over their mockups, then 6-10 over theirs
  n=1
  for d in $ALL; do
    convert out/flat/$d-trim.png -resize 720x -background "#d9d4ca" -gravity north -splice 0x110 \
      -font fonts/Anton-Regular.ttf -pointsize 80 -fill "#1c1a17" -annotate +0+12 "$n" out/render/sheet-f$n.png
    convert out/mockups/mockup-${d:0:1}.png -resize 720x out/render/sheet-m$n.png
    n=$((n+1))
  done
  convert -background "#d9d4ca" out/render/sheet-f{1,2,3,4,5}.png -splice 40x0 +append -gravity east -splice 40x0 out/render/sheet-r1.png
  convert -background "#e9e3d8" out/render/sheet-m{1,2,3,4,5}.png -splice 40x0 +append -gravity east -splice 40x0 out/render/sheet-r2.png
  convert -background "#d9d4ca" out/render/sheet-f{6,7,8,9,10}.png -splice 40x0 +append -gravity east -splice 40x0 out/render/sheet-r3.png
  convert -background "#e9e3d8" out/render/sheet-m{6,7,8,9,10}.png -splice 40x0 +append -gravity east -splice 40x0 out/render/sheet-r4.png
  convert -background "#d9d4ca" out/render/sheet-r1.png out/render/sheet-r2.png out/render/sheet-r3.png out/render/sheet-r4.png -append \
    -gravity south -splice 0x40 -quality 88 out/contact-sheet.jpg
  # and the fronts alone, ten across: the quickest way to compare them
  convert -background "#d9d4ca" out/render/sheet-f{1,2,3,4,5,6,7,8,9,10}.png -splice 30x0 +append -gravity east -splice 30x0 \
    -gravity south -splice 0x30 -quality 88 out/contact-sheet-fronts.jpg
  rm out/render/sheet-*.png
}

mockups() {
  for d in ${MOCKS:-a b c d e f g h i j}; do   # MOCKS="d e" ./build.sh mockups renders only those
    edge="#f1ebdf"; [ $d = b ] && edge="#1c1a17"; [ $d = e ] && edge="#12100d"
    case $d in f|g|h|j) edge="#f6f3ee" ;; i) edge="#f7f7f7" ;; esac
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
  fronts) fronts ;; thumbs) thumbs ;; mockups) mockups ;; sheet) sheet ;; wrap) wrap ;;
  all) fronts; mockups; sheet; wrap ;;
esac

#!/bin/bash
# Rebuild every cover file from source. Run from this folder:  ./build.sh [fronts|mockups|wrap|all]
# Needs: node + Playwright's Chromium (pre-installed in Claude Code cloud sessions), ImageMagick, Python 3 + Pillow,
# Blender 4.5 (BLENDER=/path/to/blender), and the Poly Haven CC0 assets in $ASSETS (see README).
set -e
cd "$(dirname "$0")"
BLENDER=${BLENDER:-blender}
ASSETS=${ASSETS:-assets}           # fine_grained_wood_{col,nor_gl,rough}_2k.jpg and studio.hdr
SPINE_IN=${SPINE_IN:-0.9}          # placeholder spine width, inches (see README: depends on page count)
ALL="a-stack b-upside-down c-cycle d-twelve e-trap f-tete-beche g-rings h-boot i-ledger j-scaling k-built l-grown m-light n-window o-stitched"   # the fifteen, in order 1-15
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
  python3 src/make_word.py "SCALING UP-SIDE-DOWN" out/render/spine-word.svg --height 150
  for d in a b c d e f g h i j k l m n o; do node src/render.cjs src/covers/spine.html out/spine/spine-$d --dir $d --in $SPINE_IN; rm -f out/spine/spine-$d.pdf; done
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
        -fill "#1c1a17" -annotate +0+4 "$n" out/thumbs/tmpnum-$d-$w.png
      nargs="$nargs out/thumbs/tmpnum-$d-$w.png"; n=$((n+1))
    done
    convert -background white $nargs -splice 24x0 +append -bordercolor white -border 20 out/thumbs/row-$w-numbered.png
    rm out/thumbs/tmpnum-*.png
  done
}

sheet() {
  # contact sheets, numbered: all fifteen (fronts over mockups, five to a row), round 3 alone, and fronts only
  n=1
  for d in $ALL; do
    convert out/flat/$d-trim.png -resize 720x -background "#d9d4ca" -gravity north -splice 0x110 \
      -font fonts/Anton-Regular.ttf -pointsize 80 -fill "#1c1a17" -annotate +0+12 "$n" out/render/sheet-f$n.png
    convert out/mockups/mockup-${d:0:1}.png -resize 720x out/render/sheet-m$n.png
    n=$((n+1))
  done
  rows=""
  for r in 0 1 2; do
    f=""; m=""; for k in 1 2 3 4 5; do i=$((r * 5 + k)); f="$f out/render/sheet-f$i.png"; m="$m out/render/sheet-m$i.png"; done
    convert -background "#d9d4ca" $f -splice 40x0 +append -gravity east -splice 40x0 out/render/sheet-rf$r.png
    convert -background "#e9e3d8" $m -splice 40x0 +append -gravity east -splice 40x0 out/render/sheet-rm$r.png
    rows="$rows out/render/sheet-rf$r.png out/render/sheet-rm$r.png"
  done
  convert -background "#d9d4ca" $rows -append -gravity south -splice 0x40 -quality 86 out/contact-sheet.jpg
  convert -background "#d9d4ca" out/render/sheet-rf2.png out/render/sheet-rm2.png -append -gravity south -splice 0x40 -quality 88 out/contact-sheet-11-15.jpg
  convert -background "#d9d4ca" out/render/sheet-f{1,2,3,4,5,6,7,8,9,10,11,12,13,14,15}.png -splice 30x0 +append -gravity east -splice 30x0 \
    -gravity south -splice 0x30 -resize 9000x -quality 86 out/contact-sheet-fronts.jpg
  rm out/render/sheet-*.png
}

mockups() {
  for d in ${MOCKS:-a b c d e f g h i j k l m n o}; do   # MOCKS="d e" ./build.sh mockups renders only those
    edge="#f1ebdf"; [ $d = b ] && edge="#1c1a17"; [ $d = e ] && edge="#12100d"
    case $d in f|g|h|j) edge="#f6f3ee" ;; i) edge="#f7f7f7" ;; k) edge="#e8dccb" ;; l) edge="#f3ead9" ;; m) edge="#3a2a1d" ;; n) edge="#f1e8d8" ;; o) edge="#e7dece" ;; esac
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

bold() {
  # round 3, bold: the stand-out versions of 12-15 (renders: light.py/paper.py --bold 1, about 10 min each)
  [ -f out/render/light-bold.png ] || (cd src/blender && $BLENDER -b -P light.py -- --wood ../../$ASSETS --w 1875 --h 2775 --samples 96 --bold 1 --out ../../out/render/light-bold.png)
  [ -f out/render/paper-bold.png ] || (cd src/blender && $BLENDER -b -P paper.py -- --w 1875 --h 2775 --samples 80 --bold 1 --out ../../out/render/paper-bold.png)
  python3 src/make_tree.py out/render/tree-bold.svg bold
  python3 src/make_stitch.py out/render bold
  for d in l-grown-bold m-light-bold n-window-bold o-stitched-bold; do
    node src/render.cjs src/covers/$d.html out/flat/$d
    convert out/flat/$d.png -crop 1800x2700+37+37 +repage out/flat/$d-trim.png
  done
}

case $what in
  bold) bold ;;
  fronts) fronts ;; thumbs) thumbs ;; mockups) mockups ;; sheet) sheet ;; wrap) wrap ;;
  all) fronts; mockups; sheet; wrap ;;
esac

#!/bin/bash
# Round 4: finish the refined #13 covers from their renders (out/render/light2-{a,b,c}.png, 2600 x 3848):
# downsample, set the type, spine, 3D mockup, thumbnails, and the contact sheet 13 | 13a | 13b | 13c.
#   BLENDER=/path/to/blender src/finish13.sh [a b c]
set -e
cd "$(dirname "$0")/.."
B=${BLENDER:-blender}
for v in ${@:-a b c}; do
  [ -f out/render/light2-$v.png ] || { echo "no render for $v yet"; continue; }
  convert out/render/light2-$v.png -filter Lanczos -resize 1875x2775 -depth 8 out/render/light2-$v-1875.png
  node src/render.cjs "src/covers/m2-light.html" out/flat/m2-light-$v --v $v >/dev/null
  convert out/flat/m2-light-$v.png -crop 1800x2700+37+37 +repage out/flat/m2-light-$v-trim.png
  case $v in
    a) bg="#e9dcc6"; fg="#3b2a1c"; word="spine-word.svg"; edge="#e9dcc6" ;;
    b) bg="#b8b1a7"; fg="#2a2825"; word="spine-word.svg"; edge="#b8b1a7" ;;
    c) bg="#1d1a18"; fg="#e8d4b2"; word="spine-word-light.svg"; edge="#1d1a18" ;;
  esac
  node src/render.cjs src/covers/spine.html out/spine/spine-m2$v --dir m --in 0.9 --bg "$bg" --fg "$fg" --word $word >/dev/null
  rm -f out/spine/spine-m2$v.pdf
  convert out/flat/m2-light-$v.png -crop 1838x2775+37+0 +repage out/render/front-m2$v.png
  (cd src/blender && $B -b -P mockup.py -- --front ../../out/render/front-m2$v.png --spine ../../out/spine/spine-m2$v.png \
    --spine_in 0.9 --edge "$edge" --hdr ../../assets/studio.hdr --w 1600 --h 2000 --samples 128 --out ../../out/mockups/mockup-m2$v.png | grep -E "wrote|Error")
  convert out/flat/m2-light-$v-trim.png -resize 150x -bordercolor "#dddddd" -border 1 out/thumbs/m2-light-$v-150.png
  convert out/flat/m2-light-$v-trim.png -resize 100x -bordercolor "#dddddd" -border 1 out/thumbs/m2-light-$v-100.png
done

# the contact sheet: the old 13, then 13a, 13b, 13c, each front over its mockup
if ls out/flat/m2-light-{a,b,c}-trim.png >/dev/null 2>&1; then
  n=0
  for p in "m-light-trim mockup-m 13" "m2-light-a-trim mockup-m2a 13a" "m2-light-b-trim mockup-m2b 13b" "m2-light-c-trim mockup-m2c 13c"; do
    set -- $p; n=$((n+1))
    convert out/flat/$1.png -resize 720x -background "#d9d4ca" -gravity north -splice 0x110 \
      -font fonts/Anton-Regular.ttf -pointsize 80 -fill "#1c1a17" -annotate +0+12 "$3" out/render/s13-f$n.png
    convert out/mockups/$2.png -resize 720x out/render/s13-m$n.png
  done
  convert -background "#d9d4ca" out/render/s13-f{1,2,3,4}.png -splice 40x0 +append -gravity east -splice 40x0 out/render/s13-r1.png
  convert -background "#e9e3d8" out/render/s13-m{1,2,3,4}.png -splice 40x0 +append -gravity east -splice 40x0 out/render/s13-r2.png
  convert -background "#d9d4ca" out/render/s13-r1.png out/render/s13-r2.png -append -gravity south -splice 0x40 -quality 88 out/contact-sheet-13.jpg
  rm out/render/s13-*.png
  # 150 px: old 13, 13a, 13b, 13c, numbered
  args=""
  for p in "m-light 13" "m2-light-a 13a" "m2-light-b 13b" "m2-light-c 13c"; do
    set -- $p
    [ -f out/thumbs/$1-150.png ] || convert out/flat/$1-trim.png -resize 150x -bordercolor "#dddddd" -border 1 out/thumbs/$1-150.png
    convert out/thumbs/$1-150.png -background white -gravity south -splice 0x34 -font fonts/InterTight-Medium.ttf -pointsize 22 \
      -fill "#1c1a17" -annotate +0+4 "$2" out/thumbs/tmp13-$1.png
    args="$args out/thumbs/tmp13-$1.png"
  done
  convert -background white $args -splice 24x0 +append -bordercolor white -border 20 out/thumbs/row-13-150.png
  rm out/thumbs/tmp13-*.png
fi
echo finished

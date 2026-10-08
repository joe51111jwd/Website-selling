#!/usr/bin/env bash
# PASS A interim sources for THE SET (A7). Run through the CPU queue:
#   scripts/cpuq bash film/scripts/prep-interim.sh
# Copies the raw concept clips into film/public/clips/raw/ with:
#   - the brief's 1920x1076 crop (x 2-1922) for every 16:9 Kling clip (bays stay 1440^2)
#   - an approximation of the brief §5.6 grade (blacks clamp to #0B0B0A, -10% saturation outside blue/orange)
#   - a box-masked yellow -> graphite shift on the tape measure in c34 and b44 (livery, red-team #11)
# It does NOT crush crowds (D4) or fix visors: these copies are for drafts only.
# FINAL renders use A5's mezzanines in film/public/clips/ (see src/clips.ts).
set -euo pipefail
S=/tmp/claude-0/-home-user/a462cba4-955f-5044-9e19-3a11e18ef1bf/scratchpad
SRC=$S/media/clips
OUT=$(cd "$(dirname "$0")/.." && pwd)/public/clips/raw
mkdir -p "$OUT"
GRADE="lutrgb=r='clip(val,11,255)':g='clip(val,11,255)':b='clip(val,10,255)',huesaturation=saturation=-0.1:colors=g+m"
# yellow-only (not orange) desaturation toward a dark graphite, for use inside a box
W="clip((min(r(X\,Y)\,g(X\,Y))-b(X\,Y))/25\,0\,1)*clip((g(X\,Y)/(r(X\,Y)+1)-0.58)/0.12\,0\,1)"
L="(0.3*r(X\,Y)+0.59*g(X\,Y)+0.11*b(X\,Y))*0.72"
LIV="format=gbrp,geq=r='r(X\,Y)+($L-r(X\,Y))*$W':g='g(X\,Y)+($L-g(X\,Y))*$W':b='b(X\,Y)+($L-b(X\,Y))*$W',format=yuv420p"
ENC=(-c:v libx264 -crf 15 -preset medium -pix_fmt yuv420p -an -movflags +faststart)

crop169() { # name src [box x y w h]
  local name=$1 src=$2
  if [[ $# -gt 2 ]]; then
    local bx=$3 by=$4 bw=$5 bh=$6
    ffmpeg -v error -y -i "$src" -filter_complex "[0]crop=1920:1076:2:0,split[a][b];[b]crop=$bw:$bh:$bx:$by,$LIV[t];[a][t]overlay=$bx:$by,$GRADE" "${ENC[@]}" "$OUT/$name.mp4"
  else
    ffmpeg -v error -y -i "$src" -vf "crop=1920:1076:2:0,$GRADE" "${ENC[@]}" "$OUT/$name.mp4"
  fi
  echo "$name done"
}
bay() { # name src [box]
  local name=$1 src=$2
  if [[ $# -gt 2 ]]; then
    local bx=$3 by=$4 bw=$5 bh=$6
    ffmpeg -v error -y -i "$src" -filter_complex "[0]split[a][b];[b]crop=$bw:$bh:$bx:$by,$LIV[t];[a][t]overlay=$bx:$by,$GRADE" "${ENC[@]}" "$OUT/$name.mp4"
  else
    ffmpeg -v error -y -i "$src" -vf "$GRADE" "${ENC[@]}" "$OUT/$name.mp4"
  fi
  echo "$name done"
}
crop169 c30 "$SRC/c30-brick.mp4"
crop169 c31 "$SRC/c31-drywall.mp4"
crop169 c32 "$SRC/c32-bolt.mp4"
crop169 c33 "$SRC/c33-pipe.mp4"
crop169 c34 "$SRC/c34-layout.mp4" 110 680 400 170
crop169 v0 "$S/media/tests/v0-brick-macro.mp4"
bay b40 "$SRC/b40-brick.mp4"
bay b41 "$SRC/b41-drywall.mp4"
bay b42 "$SRC/b42-bolt.mp4"
bay b43 "$SRC/b43-pipe.mp4"
bay b44 "$SRC/b44-layout.mp4" 1020 360 240 220

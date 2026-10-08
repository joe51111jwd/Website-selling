#!/usr/bin/env bash
# R3 + D1 (desktop) and R3 + D2 (phone). Two passes each: (1) analyse the mezzanine freeze frame (FAR bite
# window, NEAR contrast -> how much feathered darkening R3 must bake under the NEAR box), (2) encode the
# hero film with that darkening, then run the freeze pass on the LAST frame of each encoded web file.
# usage: scripts/cpuq pipeline/run_hero.sh [169|916]
set -euo pipefail
S=/tmp/claude-0/-home-user/a462cba4-955f-5044-9e19-3a11e18ef1bf/scratchpad
MZ=$S/a5tmp/mezz; T=$S/a5tmp/d1; QA=$S/a5qa/d1; mkdir -p $T $QA
R=$(cd "$(dirname "$0")/.." && pwd); H=$R/public/media/hero
PY="$S/concept/wild-spike/venv/bin/python -I"
one(){ # suffix mezz a b crop(ffmpeg w:h:x:y) hcrop(x,y,w,h)
  local s=$1 mz=$2 a=$3 b=$4 crop=$5 hcrop=$6
  ffmpeg -y -v error -i $mz -vf "select=eq(n\,$b)${crop:+,crop=$crop}" -frames:v 1 $T/mz-$s.png
  $PY $R/pipeline/freeze.py $T/mz-$s.png $T/mz-$s.png $T/an-$s $QA $s --analyse > $T/analyse-$s.json
  local dk; dk=$($PY -c "
import json; r=json.load(open('$T/analyse-$s.json'))['near']
need=r['darkenNeeded']
print('' if need is None else ','.join(str(v) for v in r['box'])+','+str(round(min(0.92, need+0.06),3)))")
  echo "[$s] analyse: $(cat $T/analyse-$s.json | tr -d '\n ' | cut -c1-400)"
  echo "[$s] darken: ${dk:-none}"
  $PY $R/pipeline/hero.py $mz $a $b $H/hero-snap-$s $T/enc-$s ${hcrop:+--crop $hcrop} ${dk:+--darken $dk}
  local dj='null'; [ -n "$dk" ] && dj="{\"box\":[${dk%,*}],\"linearLightRemoved\":${dk##*,},\"feather\":\"flat over the NEAR box + 2% margin, gaussian falloff 2.5% of the long side outside it\",\"bakedInto\":\"hero-snap-$s (all frames), hence the stills\"}"
  $PY $R/pipeline/freeze.py $T/enc-$s/last-av1.png $T/enc-$s/last-h264.png $H $QA $s --frame $b --darken "$dj"
}
want=${1:-all}
[ "$want" = all -o "$want" = 169 ] && one 169 $MZ/c34.mp4 60 84 "" ""
[ "$want" = all -o "$want" = 916 ] && one 916 $MZ/n01b.mp4 76 100 "1076:1912:0:6" "0,6,1076,1912"
echo HERO DONE

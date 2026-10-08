#!/usr/bin/env bash
# R3 + D1 (desktop) and R3 + D2 (phone). Two passes each: (1) analyse the mezzanine freeze frame (FAR bite
# window, NEAR contrast -> how much feathered darkening R3 must bake under the NEAR box), (2) encode the
# hero film with that darkening, then run the freeze pass on the LAST frame of each encoded web file.
# usage: scripts/cpuq pipeline/run_hero.sh [169|916|all] [--refreeze]   (--refreeze: freeze pass only, films untouched)
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
  local dj='null'; [ -n "$dk" ] && dj="{\"box\":[${dk%,*}],\"linearLightRemoved\":${dk##*,},\"feather\":\"flat ellipse covering the NEAR box (1.18x / 1.35x + 3% of the long side), gaussian falloff 4.5% of the long side\",\"bakedInto\":\"hero-snap-$s (all frames), hence the stills\"}"
  $PY $R/pipeline/freeze.py $T/enc-$s/last-av1.png $T/enc-$s/last-h264.png $H $QA $s --frame $b --darken "$dj"
}
refreeze(){ # suffix frame: freeze pass only (FIXLIST-1 F-008/F-046), on the last frames of the SHIPPED films, keeping
  # the NEAR darkening recorded in the current meta (the films are not re-encoded)
  local s=$1 b=$2 dj
  dj=$($PY -c "import json; print(json.dumps(json.load(open('$H/hero-meta-$s.json'))['nearDarken']))")
  for c in av1 h264; do ffmpeg -y -v error -sseof -0.5 -i $H/hero-snap-$s.$c.mp4 -update 1 -frames:v 100 $T/enc-$s/last-$c.png; done
  $PY $R/pipeline/freeze.py $T/enc-$s/last-av1.png $T/enc-$s/last-h264.png $H $QA $s --frame $b --darken "$dj"
}
want=${1:-all}
if [ "${2:-}" = --refreeze ]; then
  mkdir -p $T/enc-169 $T/enc-916
  [ "$want" = all -o "$want" = 169 ] && refreeze 169 84
  [ "$want" = all -o "$want" = 916 ] && refreeze 916 100
  echo REFREEZE DONE; exit 0
fi
[ "$want" = all -o "$want" = 169 ] && one 169 $MZ/c34.mp4 60 84 "" ""
[ "$want" = all -o "$want" = 916 ] && one 916 $MZ/n01b.mp4 76 100 "1076:1912:0:6" "0,6,1076,1912"
echo HERO DONE

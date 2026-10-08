#!/usr/bin/env bash
# MOCK media for the first build wave: real, web-playable placeholder files at the FINAL paths, so every
# agent can build against src/media/manifest.json before the graded pipeline lands. The real pipeline
# (pipeline/run.sh) overwrites every file below in place. Low quality on purpose (fast).
# usage: scripts/cpuq pipeline/mock.sh   (historical: overwrites real media with placeholders — don't run after the real pipeline)
set -euo pipefail
S=/tmp/claude-0/-home-user/a462cba4-955f-5044-9e19-3a11e18ef1bf/scratchpad
M=$S/media; N=$M/new
R=$(cd "$(dirname "$0")/.." && pwd); P=$R/public/media
PY="$S/concept/wild-spike/venv/bin/python -I"
TMP=$S/a5tmp/mock; mkdir -p $TMP
mkdir -p $P/{hero,plans,perspectives,details,section,stills,arena,film,tex,data}

# last argument = output file; encoder options must precede it
av1(){ local o="${@: -1}"; ffmpeg -y -v error "${@:1:$#-1}" -an -c:v libsvtav1 -preset 11 -crf 44 -pix_fmt yuv420p -g 120 -movflags +faststart "$o"; }
h264(){ local o="${@: -1}"; ffmpeg -y -v error "${@:1:$#-1}" -an -c:v libx264 -preset veryfast -crf 31 -pix_fmt yuv420p -movflags +faststart "$o"; }
# venc <out_base> <filter> <input...> ; poster from the first frame (or last with POSTER=last)
venc(){ local o=$1 vf=$2; shift 2
  av1 "$@" -vf "$vf" "$o.av1.mp4"; h264 "$@" -vf "$vf" "$o.h264.mp4"
  if [ "${POSTER:-first}" = last ]; then
    ffmpeg -y -v error -sseof -0.2 -i "$o.av1.mp4" -update 1 -frames:v 1 $TMP/p.png
  else
    ffmpeg -y -v error -i "$o.av1.mp4" -frames:v 1 $TMP/p.png
  fi
  $PY $R/pipeline/img.py $TMP/p.png "$o.poster" --q 45 >/dev/null
  echo "video $o"; }

C34=$M/clips/c34-layout.mp4
# hero
POSTER=last venc $P/hero/hero-snap-169 "trim=start_frame=60:end_frame=85,setpts=PTS-STARTPTS,crop=1920:1076:2:0" -i $C34
POSTER=last venc $P/hero/hero-snap-916 "trim=start_frame=60:end_frame=85,setpts=PTS-STARTPTS,crop=605:1076:480:0,scale=1076:1912" -i $C34
for c in av1 h264; do
  ffmpeg -y -v error -sseof -0.2 -i $P/hero/hero-snap-169.$c.mp4 -update 1 -frames:v 1 $TMP/s169.png
  $PY $R/pipeline/img.py $TMP/s169.png $P/hero/hero-still-169-$c --q 50 --nojpg >/dev/null
  cp $P/hero/hero-snap-169.poster.jpg $P/hero/hero-still-169-$c.jpg
  ffmpeg -y -v error -sseof -0.2 -i $P/hero/hero-snap-916.$c.mp4 -update 1 -frames:v 1 $TMP/s916.png
  $PY $R/pipeline/img.py $TMP/s916.png $P/hero/hero-still-916-$c --q 50 >/dev/null
done
$PY $R/pipeline/img.py $M/lookdev/ld14.png $P/hero/hero-ground-169 --size 1920x1076 --gain 0.12 --q 40 >/dev/null
$PY $R/pipeline/img.py $M/lookdev/ld14.png $P/hero/hero-ground-916 --size 1076x1912 --gain 0.12 --q 40 >/dev/null
$PY $R/pipeline/img.py $M/lookdev/ld14.png $P/tex/tex-slab --size 1024x1024 --q 45 >/dev/null

# plans (b40-b44), 1080 + phone 720, no registration yet
i=0; for b in b40-brick b41-drywall b42-bolt b43-pipe b44-layout; do id=plan-b4$i
  venc $P/plans/$id "scale=1080:1080" -i $M/clips/$b.mp4
  venc $P/plans/$id-m "scale=720:720" -i $M/clips/$b.mp4
  i=$((i+1)); done
ffmpeg -y -v error -ss 2.6 -i $M/clips/b44-layout.mp4 -frames:v 1 $TMP/b44-260.png
$PY $R/pipeline/img.py $TMP/b44-260.png $P/plans/plan-b44-260 --q 50 >/dev/null

# arena strip (bays 01-04, slot 05 black)
AR="color=c=0x0B0B0A:s=1890x350:r=24:d=5.04[bg];[0]scale=350:350[a];[1]scale=350:350[b];[2]scale=350:350[c];[3]scale=350:350[d];[bg][a]overlay=0:0[t1];[t1][b]overlay=385:0[t2];[t2][c]overlay=770:0[t3];[t3][d]overlay=1155:0:shortest=1"
ARM="color=c=0x0B0B0A:s=1080x200:r=24:d=5.04[bg];[0]scale=200:200[a];[1]scale=200:200[b];[2]scale=200:200[c];[3]scale=200:200[d];[bg][a]overlay=0:0[t1];[t1][b]overlay=220:0[t2];[t2][c]overlay=440:0[t3];[t3][d]overlay=660:0:shortest=1"
IN="-i $M/clips/b40-brick.mp4 -i $M/clips/b41-drywall.mp4 -i $M/clips/b42-bolt.mp4 -i $M/clips/b43-pipe.mp4"
for v in "" "-m"; do f=$AR; [ "$v" = "-m" ] && f=$ARM
  av1 $IN -filter_complex "$f" $P/arena/arena-0104$v.av1.mp4
  h264 $IN -filter_complex "$f" $P/arena/arena-0104$v.h264.mp4
  ffmpeg -y -v error -i $P/arena/arena-0104$v.av1.mp4 -frames:v 1 $TMP/p.png
  $PY $R/pipeline/img.py $TMP/p.png $P/arena/arena-0104$v.poster --q 45 >/dev/null; done
ffmpeg -y -v error -i $P/arena/arena-0104.av1.mp4 -sseof -0.2 -i $M/clips/b44-layout.mp4 -filter_complex "[1]scale=350:350[e];[0][e]overlay=1540:0" -frames:v 1 $TMP/ap.png
$PY $R/pipeline/img.py $TMP/ap.png $P/arena/arena-poster --q 50 >/dev/null

# perspectives
venc $P/perspectives/el-c30 "crop=1920:804:2:136" -i $M/clips/c30-brick.mp4
venc $P/perspectives/el-c30-m "crop=861:1076:530:0,scale=1080:1350" -i $M/clips/c30-brick.mp4
venc $P/perspectives/el-c31 "crop=861:1076:962:0,scale=1080:1350" -i $M/clips/c31-drywall.mp4
venc $P/perspectives/el-c32 "crop=1920:1076:2:0" -i $M/clips/c32-bolt.mp4
venc $P/perspectives/el-c33 "crop=1920:804:2:272" -i $M/clips/c33-pipe.mp4
# details
venc $P/details/det-v0 "trim=0:3.5,setpts=PTS-STARTPTS,crop=1076:1076:424:0" -i $M/tests/v0-brick-macro.mp4
venc $P/details/det-n03 "crop=1076:1076:424:0" -i $N/N03.mp4
venc $P/details/det-n04 "crop=720:720:300:560,scale=1076:1076" -i $M/clips/b44-layout.mp4
# (THE SET placeholder removed after the first wave: the manifest lists the-set-169 only for A7's real film)

# stills
$PY $R/pipeline/img.py $M/lookdev/ref21.png $P/stills/ref21-portrait --size 800x800 >/dev/null
$PY $R/pipeline/img.py $N/N02.png $P/stills/bay-empty --size 1080x1080 >/dev/null
for k in 1 2 3 4 5; do $PY $R/pipeline/img.py $N/N07-$k.png $P/stills/mat-$k --size 1080x1080 >/dev/null; done

# section + depth/meta/matte/plate + data placeholders
ffmpeg -y -v error -i $C34 -vf "select=eq(n\,24),crop=1920:1076:2:0" -frames:v 1 $TMP/f24.png
ffmpeg -y -v error -i $C34 -vf "select=eq(n\,84),crop=1920:1076:2:0" -frames:v 1 $TMP/f84.png
$PY $R/pipeline/mockdata.py $TMP $P
echo MOCK DONE

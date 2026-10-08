#!/usr/bin/env bash
# THE SET · final renders and web deliverables. Run through the CPU queue from the repo root:
#   scripts/cpuq bash film/scripts/deliver.sh [tag]
# 1. bundles once; renders the three masters (H.264 CRF 16, AAC 320k, the foley mix) at --concurrency=2
# 2. silent masters (video stream copied, no audio track)
# 3. web copies per brief §7e: AV1 (SVT-AV1, -crf 34–46 ladder, preset 8, +faststart) first, H.264 fallback
#    (-crf 23–30 ladder, preset slow, yuv420p, +faststart); each takes the best CRF that fits its budget
#    (the-set-169: 4 MB AV1 / 8 MB H.264; 9:16 the same; 1:1 20 s: 2.7 / 5.4 MB, pro rata)
# 4. posters (AVIF + JPEG) and the R5 stills (og:image 1200x630, X card 1600x900)
# 5. captions + transcript
# `tag` (default: none) is appended to every file name, e.g. "-draft" while the interim sources are in use.
set -euo pipefail
cd "$(dirname "$0")/.."
TAG=${1:-}
OUT=out; DL=deliver; mkdir -p "$OUT" "$DL"
MB=1000000

npx remotion bundle src/index.ts --out-dir=build --log=error

# masters
for f in 169 916 11; do
  npx remotion render build "TheSet$f" "$OUT/the-set-$f-master$TAG.mp4" --codec=h264 --crf=16 --x264-preset=medium \
    --audio-bitrate=320k --concurrency=2 --log=error
  ffmpeg -v error -y -i "$OUT/the-set-$f-master$TAG.mp4" -map 0:v -c:v copy -movflags +faststart "$OUT/the-set-$f-silent$TAG.mp4"
  echo "master $f done"
done

budget() { case $1 in 169|916) echo "$2";; 11) python3 -c "print(int($2*20/30))";; esac; }
fit() { # fit <in> <out> <codec> <budgetBytes> <crf...>
  local in=$1 out=$2 codec=$3 bud=$4; shift 4
  for crf in "$@"; do
    if [[ $codec == av1 ]]; then
      ffmpeg -v error -y -i "$in" -c:v libsvtav1 -preset 8 -crf "$crf" -g 240 -pix_fmt yuv420p \
        -c:a aac -b:a 128k -movflags +faststart "$out"
    else
      ffmpeg -v error -y -i "$in" -c:v libx264 -preset slow -crf "$crf" -pix_fmt yuv420p -profile:v high \
        -c:a aac -b:a 128k -movflags +faststart "$out"
    fi
    local sz; sz=$(stat -c %s "$out")
    if (( sz <= bud )); then echo "$out crf=$crf $sz bytes"; return 0; fi
  done
  echo "WARN $out over budget at the last CRF ($(stat -c %s "$out") > $bud)"
}
for f in 169 916 11; do
  m="$OUT/the-set-$f-master$TAG.mp4"
  fit "$m" "$DL/the-set-$f-av1$TAG.mp4" av1 "$(budget $f $((4*MB)))" 34 36 38 40 42 44 46
  fit "$m" "$DL/the-set-$f-h264$TAG.mp4" h264 "$(budget $f $((8*MB)))" 23 24 26 28 30
  # silent web copies (same video streams, no audio track)
  ffmpeg -v error -y -i "$DL/the-set-$f-av1$TAG.mp4" -map 0:v -c copy -movflags +faststart "$DL/the-set-$f-av1-silent$TAG.mp4"
  ffmpeg -v error -y -i "$DL/the-set-$f-h264$TAG.mp4" -map 0:v -c copy -movflags +faststart "$DL/the-set-$f-h264-silent$TAG.mp4"
done

# posters: the frozen frame with the inked H1, at the end of the push (frame before the plan cut)
poster() { # poster <fmt> <frame>
  npx remotion still build "TheSet$1" "$OUT/the-set-$1-poster$TAG.png" --frame="$2" --log=error
  ffmpeg -v error -y -i "$OUT/the-set-$1-poster$TAG.png" -q:v 3 -update 1 "$DL/the-set-$1-poster$TAG.jpg"
  ffmpeg -v error -y -i "$OUT/the-set-$1-poster$TAG.png" -c:v libaom-av1 -still-picture 1 -crf 30 -cpu-used 6 -pix_fmt yuv420p -update 1 "$DL/the-set-$1-poster$TAG.avif"
}
poster 169 210
poster 916 210
poster 11 145

# R5 stills
npx remotion still build OgImage "$OUT/og-image$TAG.png" --log=error
npx remotion still build XCard "$OUT/x-card$TAG.png" --log=error
ffmpeg -v error -y -i "$OUT/og-image$TAG.png" -q:v 2 -update 1 "$DL/og-image-1200x630$TAG.jpg"
ffmpeg -v error -y -i "$OUT/x-card$TAG.png" -q:v 2 -update 1 "$DL/x-card-1600x900$TAG.jpg"
cp "$OUT/og-image$TAG.png" "$DL/og-image-1200x630$TAG.png"

node scripts/captions.mjs
ls -la "$DL"

#!/usr/bin/env bash
# contact.sh <video> <out.jpg> <tileW> <cols> frame...
set -euo pipefail
v=$1; out=$2; tw=$3; cols=$4; shift 4
tmp=$(mktemp -d /tmp/claude-0/-home-user/a462cba4-955f-5044-9e19-3a11e18ef1bf/scratchpad/contact.XXXX)
i=0
for f in "$@"; do ffmpeg -v error -y -i "$v" -vf "select=eq(n\,$f),scale=$tw:-1" -frames:v 1 -q:v 3 -update 1 "$tmp/$(printf %03d $i).jpg"; i=$((i+1)); done
rows=$(( (i + cols - 1) / cols ))
ffmpeg -v error -y -pattern_type glob -i "$tmp/*.jpg" -vf "tile=${cols}x${rows}:padding=4:color=white" -frames:v 1 -update 1 "$out"
echo "$out"

#!/usr/bin/env bash
# Graded mezzanines for the film agent (A7, Remotion) -> film/public/clips/ + README.md.
# Same masters the site plates are cut from: cropped 1920x1076 (x 2-1922 of the 1924 frame), graded (§5.6),
# tape livery shifted (c34, b44), visor glints suppressed, crowd crushed (c30/N09, c31, c32, c33).
# H.264 crf 14 yuv420p, 24 fps, silent. usage: scripts/cpuq pipeline/export_film.sh
set -euo pipefail
S=/tmp/claude-0/-home-user/a462cba4-955f-5044-9e19-3a11e18ef1bf/scratchpad
MZ=$S/a5tmp/mezz; RG=$S/a5tmp/reg
R=$(cd "$(dirname "$0")/.." && pwd); O=$R/film/public/clips; mkdir -p $O
cp_(){ cp -f "$1" "$O/$2"; }
x264(){ local o="${@: -1}"; ffmpeg -y -v error "${@:1:$#-1}" -an -c:v libx264 -crf 14 -preset medium -pix_fmt yuv420p -movflags +faststart "$o"; }
cp_ $MZ/n09r.mp4 c30-n09-169.mp4
x264 -i $MZ/n09r.mp4 -vf "crop=861:1076:330:0,scale=1080:1350:flags=lanczos" $O/c30-n09-45.mp4
cp_ $MZ/c31.mp4  c31-169.mp4
x264 -i $MZ/c31.mp4 -vf "crop=564:705:845:371,scale=1080:1350:flags=lanczos" $O/c31-45.mp4   # F-009 window (same as el-c31)
cp_ $MZ/c32.mp4  c32-169.mp4
cp_ $MZ/c33.mp4  c33-169.mp4
x264 -i $MZ/c33.mp4 -vf "crop=1920:804:0:272" $O/c33-239.mp4
cp_ $MZ/c34.mp4  c34-169.mp4
x264 -i $MZ/n01b.mp4 -vf "crop=1076:1912:0:6" $O/n01b-916.mp4
for b in b40 b41 b42 b43 b44; do cp_ $RG/$b.mp4 $b-1440.mp4; done
cp_ $MZ/v0.mp4  v0-169.mp4
cp_ $MZ/n03.mp4 n03-169.mp4
cp_ $MZ/n04.mp4 n04-169.mp4
ls -la $O

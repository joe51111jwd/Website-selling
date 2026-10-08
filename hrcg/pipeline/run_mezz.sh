#!/usr/bin/env bash
# Mezzanines for every clip that ships (brief §7c house rules). Each line is one mezz.py call through the
# CPU queue. Inputs: S/media (clips, tests, new). Depth for the crowd crush: run crowdcrush.py first
# (see run_depth.sh). Output: $MZ (scratch) — 1920x1076 for 16:9 sources, 1440² for bays, 1076x1924 for 9:16.
# usage: pipeline/run_mezz.sh [name ...]   (no names = all)
set -euo pipefail
S=/tmp/claude-0/-home-user/a462cba4-955f-5044-9e19-3a11e18ef1bf/scratchpad
M=$S/media; N=$M/new; D=$S/a5tmp/depth; MZ=$S/a5tmp/mezz; mkdir -p $MZ
R=$(cd "$(dirname "$0")/.." && pwd); Q=$R/scripts/cpuq
PY="$S/concept/wild-spike/venv/bin/python -I"
C169="--crop 2,0,1920,1076"
ARGS="$*"
run(){ local name=$1; shift; if [ -z "$ARGS" ] || [[ " $ARGS " == *" $name "* ]]; then $Q $PY $R/pipeline/mezz.py "$@"; fi; }

# hero snap source (tape livery shift; no crowd in this clip)
run c34  $M/clips/c34-layout.mp4  $MZ/c34.mp4  $C169 --livery box:0.11,0.64,0.26,0.80 --glint 0.3,0,0.66,0.32 --maskdump $MZ/c34m
# perspectives: crowd crush (D4) + visor fixes
run c30  $M/clips/c30-brick.mp4   $MZ/c30.mp4  $C169 --crush $D/c30.npy:0.08
run c31  $M/clips/c31-drywall.mp4 $MZ/c31.mp4  $C169 --crush $D/c31.npy:0.08 --glint 0.36,0.08,0.68,0.42,28
run c32  $M/clips/c32-bolt.mp4    $MZ/c32.mp4  $C169 --crush $D/c32.npy:0.08 --glint 0.38,0,0.66,0.3,14
run c33  $M/clips/c33-pipe.mp4    $MZ/c33.mp4  $C169 --crush $D/c33.npy:0.08
run n09r $N/N09r.mp4 $MZ/n09r.mp4 $C169 --crush $D/n09r.npy:0.08 --glint 0.34,0,0.54,0.26
# plans (1440², graded; b44 + its poster frame get the tape livery shift)
run b40  $M/clips/b40-brick.mp4   $MZ/b40.mp4
run b41  $M/clips/b41-drywall.mp4 $MZ/b41.mp4
run b42  $M/clips/b42-bolt.mp4    $MZ/b42.mp4
run b43  $M/clips/b43-pipe.mp4    $MZ/b43.mp4
run b44  $M/clips/b44-layout.mp4  $MZ/b44.mp4  --livery bay --maskdump $MZ/b44m
# details
run v0   $M/tests/v0-brick-macro.mp4 $MZ/v0.mp4 $C169
run n03  $N/N03.mp4 $MZ/n03.mp4 $C169
run n04  $N/N04.mp4 $MZ/n04.mp4 $C169
# phone hero source (9:16, 1076x1924)
run n01b $N/N01b.mp4 $MZ/n01b.mp4
echo MEZZ DONE

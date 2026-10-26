#!/bin/bash
# Render the closed loop (closed.py) from foundation.blend: the sequence, Quality's layers, the panorama.
# Each frame is skipped if it already exists, so a stopped run picks up where it left off.
cd "$(dirname "$0")"
B=${BLENDER:-blender}
BLEND=${BLEND:-foundation.blend}
mkdir -p out/clseq out/closed
$B -b $BLEND -P closed.py -- --shot seq --out out/clseq --frames 1-44 --blur 1 > out/closed/seq_a.log 2>&1
$B -b $BLEND -P closed.py -- --shot seq --out out/clseq --frames 45-48 --blur 0 > out/closed/seq_b.log 2>&1
$B -b $BLEND -P closed.py -- --shot layers --out out/closed > out/closed/layers.log 2>&1
$B -b $BLEND -P closed.py -- --shot pano --out out/closed > out/closed/pano.log 2>&1
echo ALLDONE >> out/closed/pano.log

#!/bin/bash
# Render the site's Blender media one job after another (each job resumes where it stopped).
#   scripts/render_queue.sh burger-film burger latkes chicken pie ...
# Jobs: <dish> (turntable), burger-film, steak-film, lineup
set -u
cd "$(dirname "$0")/.."
B=blender/out
mkdir -p "$B"
for job in "$@"; do
  echo "== $job $(date +%H:%M:%S)"
  case "$job" in
    burger-film) blender -b -P blender/films.py -- --film burger --w 640 --h 800 --samples 16 ;;
    steak-film) blender -b -P blender/films.py -- --film steak --w 1280 --h 800 --samples 16 ;;
    lineup) blender -b -P blender/lineup.py -- --w 2400 --h 1000 --samples 64 ;;
    *) blender -b -P blender/turntable.py -- --dish "$job" --frames 48 --w 720 --h 720 --samples 16 ;;
  esac > "$B/render_$job.log" 2>&1
  echo "   $job exit $? $(date +%H:%M:%S)"
done
echo "== queue done $(date +%H:%M:%S)"

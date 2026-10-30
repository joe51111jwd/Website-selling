#!/usr/bin/env bash
# Subsets the self-hosted fonts (from the @fontsource packages) down to the glyphs this page uses.
# Fraunces comes from the full-axes files (opsz, wght, SOFT, WONK): WONK is pinned to 0 and SOFT to 0
# (the brief: "Keep WONK at 0"; the italic's default is WONK 1, which draws the leaning b, h and l),
# and opsz + wght stay variable. Output: src/fonts/*.woff2 (committed).
# Needs: pip install fonttools brotli
set -euo pipefail
cd "$(dirname "$0")/.."
U="U+0020-007E,U+00A0,U+00B7,U+00D7,U+2009,U+2013,U+2014,U+2018,U+2019,U+201C,U+201D,U+2026,U+2192,U+2212"
F=node_modules/@fontsource-variable/fraunces/files
P=node_modules/@fontsource/ibm-plex-mono/files
T=$(mktemp -d)
mkdir -p src/fonts
sub() { pyftsubset "$1" --unicodes="$U" --layout-features='*' --flavor=woff2 --output-file="$2"; }
for s in normal:roman italic:italic; do
  fonttools varLib.instancer "$F/fraunces-latin-full-${s%%:*}.woff2" WONK=0 SOFT=0 -o "$T/${s##*:}.ttf" >/dev/null
  sub "$T/${s##*:}.ttf" "src/fonts/fraunces-opsz-${s##*:}.woff2"
done
for w in 500 600; do sub $P/ibm-plex-mono-latin-$w-normal.woff2 src/fonts/plex-mono-$w.woff2; done
rm -rf "$T"
ls -la src/fonts

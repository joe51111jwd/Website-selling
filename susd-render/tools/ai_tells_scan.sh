#!/usr/bin/env bash
# ai_tells_scan.sh <src-dir>
# Prints every line of CSS/TS/TSX/HTML/JS under <src-dir> that matches a mechanical AI tell from
# docs/02-AI-TELLS.md, prefixed with the tell's ID ([A01] default faces, [A02] tracked or small caps,
# [A03] middle-dot strings, [A06] text-shadow, [A08] grain/noise, [A10] gradients, [A11] glass/blur,
# [A12] CSS shadows, [A23] pills/round corners, [A30] reveal motion, [A33] cursor effects, [A35] scroll
# smoothing). Hits are flags for a human look, not automatic fails: a measured scrim (A10) or the
# frame-scrub keyframes (A30) are allowed. Summary: ai_tells_scan.sh src | awk '{print $1}' | sort | uniq -c
SRC="${1:?src dir}"
G() { grep -rnE --include='*.css' --include='*.ts' --include='*.tsx' --include='*.html' --include='*.js' "$2" "$SRC" 2>/dev/null | grep -v node_modules | sed "s|^|[$1] |" | cut -c1-160; }
grep -rnE --include='*.css' --include='*.ts' --include='*.tsx' --include='*.html' --include='*.js' "font-family|@font-face|fontsource|woff2?|fonts\.(googleapis|bunny)" "$SRC" 2>/dev/null | grep -v node_modules | grep -iE "inter[ '\"-]|inter-|geist|fraunces|instrument|newsreader|playfair|space[ -]?(grotesk|mono)|bricolage|dm[ -]?(sans|serif|mono)|plex|jetbrains|satoshi|clash|general[ -]?sans|cabinet|archivo|syne|unbounded|manrope|outfit|sora|jakarta|roboto|montserrat|poppins|lora|cormorant|courier" | sed "s|^|[A01] |" | cut -c1-160
G A02 "text-transform: *uppercase|font-variant(-caps)?: *(all-)?small-caps|letter-spacing: *(0?\.[1-9]|[1-9])[0-9]*(em|px|rem)"
G A03 "·|&middot;|\\\\00b7|\\\\u00b7"
G A06 "text-shadow"
G A08 "feTurbulence|grain|noise"
G A10 "(linear|radial|conic)-gradient|background-clip: *text"
G A11 "backdrop-filter|filter: *blur"
G A12 "box-shadow|drop-shadow"
G A23 "border-radius: *([2-9][0-9]+px|[0-9.]+rem|50%|9{3,})"
G A30 "translateY|@keyframes"
G A33 "cursor: *none|mousemove|pointermove"
G A35 "lenis|Lenis|scroll-behavior: *smooth"

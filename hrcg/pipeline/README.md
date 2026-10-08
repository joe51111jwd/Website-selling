# Media pipeline (A5)

This folder turns the raw concept clips and stills into everything under `public/media/**` and
`public/kit/**`, plus `src/media/manifest.json`. Scratch work goes to `$S/a5tmp`, and QA images to `$S/a5qa`, where
`S=/tmp/claude-0/-home-user/a462cba4-955f-5044-9e19-3a11e18ef1bf/scratchpad`.

**How to run**
- Python is the depth venv: `$S/concept/wild-spike/venv/bin/python -I` (onnxruntime, OpenCV contrib, Pillow with AVIF, pupil_apriltags, fontTools, matplotlib).
- Every heavy step goes through `scripts/cpuq`.
- Inputs are `$S/media/{clips,tests,frames,lookdev,new}`.

**Vendor names** (the generation service, its models and the depth model) appear only in this README and in the scratch logs. They never appear in page copy (brief C13). `public/media/CREDITS.md` records them.

| Step | Script | What it does | Output |
|---|---|---|---|
| D11 | `measure.py` | Per-frame visor-glint and yellow-livery scan, plus an SSIM seam search (≥0.97 overall and ≥0.90 inside the motion mask). It also measures bay borders. | `out/assets-*.json`, `out/seams.json` |
| D4 | `crowdcrush.py` | Depth at 518 px on every 2nd frame, stabilised (median-aligned + EMA). | `$S/a5tmp/depth/*.npy` |
| mezz | `mezz.py`, `run_mezz.sh` | Crop 1920×1076 @ x2, livery shift (masked hue/sat), white-point visor suppression, grade (§5.6), crowd crush toward `#0B0B0A` (dilate 10 px, feather). Encoded as x264 crf 14. | `$S/a5tmp/mezz/*.mp4` |
| D7 | `register.py` | Per-axis scale of each bay so its yellow border lands on 120–1320 of 1440 (re-measured, max error 2.5 px). | `$S/a5tmp/reg/*.mp4`, `out/rects.json`, `out/registration.json` |
| R1/R2 | `plates.py` | Every site video (crops per §7c), AV1 (SVT) + H.264, each fitted to its §7e budget by a CRF ladder. Posters are AVIF + JPEG. Accepted seams loop with a 12-frame crossfade. Arena: bays 01–04 at phase offsets 0/0.4/0.8/1.2 s, each holding its last frame. | `public/media/{plans,perspectives,details,arena}`, `out/plates.json` |
| D8 | `burst.py` | Plume peak by blue-pixel count (c34 = 84, N01b = 100). | stdout |
| R3 + D1/D2 | `hero.py`, `freeze.py`, `run_hero.sh` | 25-frame hero film whose last frame is the freeze. The NEAR darkening is computed by `freeze.py --analyse` and baked into the film. DA2-S on the AV1 last frame → vertex grid `.bin`. Also outputs both codec stills, plate, near-matte, meta, and gates: FAR bite, NEAR ≥3:1, nine limit poses with A2's 12% overscan ring. | `public/media/hero/*`, `$S/a5qa/d1/*.png` |
| D3 | `section.py` | Cleanest pre-snap c34 frame (18–30), depth (monotonically equalised so contours read on 07), 8-bit PNG, plus the three no-GL stills from the §4.2 formula at s = 0.1 / 0.5 / 0.9. | `public/media/section/*` |
| D5 | `lines.py` | b44 chalk lines at 2.60 s in the registered frame: curated structure with measured positions, the fresh line, gridlines, and the plan-cut scale gate. | `public/media/data/lines-b44.json` |
| D6 | `trace_t43.py` | Task drawing traced from the registered b43 (temporal median). | `public/media/data/trace-t43.svg` |
| D9 | `targets.py` | T7: SVGs, Letter/A4 PDFs (vector, printed edge 15.0 cm), proof strip and JSON. Detection is re-checked on every exported file. | `public/media/data/t7-*`, `public/kit/*`, `public/media/stills/t7-proof.*` |
| stills | `stills.py` | Clean slab tile (full exposure; A1 multiplies it by rgb(31 31 30)), hero grounds pre-multiplied to match, ref21, N02, N07 crops, plan-b44-260. | `public/media/{tex,hero,stills,plans}` |
| film | `export_film.sh` | Graded mezzanines for A7. | `film/public/clips/` + README |
| QA | `qa_shipped.py` | D11 on every shipped AV1 file, plus contact sheets. | `out/assets-shipped.json` |
| manifest | `build_manifest.py` | Writes the manifest from the id spec and the files on disk. Byte sizes and codec strings are measured; seams and rects are read from `out/`. | `src/media/manifest.json` |
| mock | `mock.sh`, `mockdata.py`, `img.py` | First-wave placeholders at the final paths. | — |

**Order:** `measure` → `crowdcrush` → `run_mezz` → `register` → `measure` (seams on mezzanines) → `plates` → `run_hero` → `section` → `lines` → `trace_t43` → `targets` → `stills` → `export_film` → `build_manifest` → `qa_shipped`.

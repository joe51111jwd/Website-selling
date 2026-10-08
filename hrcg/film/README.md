# hrcg/film · THE SET (Remotion) · owner A7

THE SET is the 30-second concept film of the HRCG drawing set (brief §7c R4, PRODUCTION_PLAN O1: **P0**),
plus the R5 stills (og:image, X card, posters). It is its own package (Remotion 4.0.534, React 19.2.3); the
site never imports it, it only links the rendered files.

## Pass A (this build) and pass B
- **Pass A** cuts the film from concept footage: the chalk line, puff and H1 ink are drawn in Remotion
  (SVG; the string is a damped plucked-string model, every value a pure function of the frame), c34 frames
  60→84 rise through the dust, time stops on frame 84 with a slow push, the plan cut lands in bay 05 of a
  row of five, five sheets × 3.0 s (PLAN 0.8 s → PERSPECTIVE 2.2 s with the verb supers), A-200 (row
  outline → HOLD cloud docks → the 1811 grid diagram draws), end card (COURSE mark lays one course).
  Burn-in: `CONCEPT FILM · AI-GENERATED CONCEPT FOOTAGE`.
- **Pass B** (after integration build 2): replace the hero beats (0:00–9:00) with `?capture` frames of the
  finished site if they look better, and switch the burn-in to `BURN.bottomLeftCaptures`
  (`src/layout.ts`; the `captures` prop of `<Burnins>`). Everything else stays.

## Sources (one switch)
`src/source.json` → `"raw"` (draft copies in `public/clips/raw/`, made by `scripts/prep-interim.sh`: the
1920×1076 crop, an approximate grade and a box-masked tape livery shift; **crowds not crushed**) or
`"mezz"` (A5's graded, livery-shifted, crowd-crushed mezzanines in `public/clips/`, see the README there).
Finals are rendered from `"mezz"` only. After switching, run `scripts/stills.sh` (re-extracts the freeze
frames and re-measures b44's fresh line for the plan-cut registration into `src/measured.json`).

Footage used: c34 (hero snap 60→84, freeze 84; MARK IT OUT. 0→2.2 s at 4:5), N01b (9:16 snap 76→100,
freeze 100), the N09 retake as PERSPECTIVE 01-A (2.39:1 band at y 40, phone 4:5 at x 330; c30 as delivered
is never used), c31 (4:5 at x 1059 only), c32 (16:9, matted at row 934), c33 (bottom-anchored 2.39:1 /
square inside rows 273+ only), b40–b44 (plans; b44 plays once from 2.60 s and is never looped).
Not used: v1-tunnel (C4), c30 as delivered, ld0/3/5/6/8/9/11.

## Commands (from `hrcg/`; every render goes through the CPU queue)
```
scripts/cpuq bash film/scripts/prep-interim.sh          # draft sources (only while A5's are missing)
scripts/cpuq bash film/scripts/stills.sh                # stills + b44 line measurement for the active source
scripts/cpuq node film/scripts/sound.mjs                # foley → public/audio/the-set-{169,916,11}.wav (≈ −14 LUFS)
node film/scripts/captions.mjs                          # WebVTT + transcript → deliver/
scripts/cpuq film/scripts/draft.sh TheSet169 TheSet916 TheSet11   # bundle once + draft MP4s → out/
scripts/cpuq bash film/scripts/deliver.sh [tag]         # masters, silent masters, AV1/H.264, posters, R5 stills
scripts/cpuq film/scripts/check.sh <Comp> <prefix> <frame...>     # check stills → out/check/
cd film && npx tsc --noEmit                             # typecheck
cd film && npx remotion studio src/index.ts             # preview
```
Renders use `--concurrency=2` (4 shared cores). `out/` and `build/` are gitignored; `deliver/` holds the
web-ready copies and its own README.

## Layout
- `src/TheSet.tsx`: the master `<Series>` and the burn-ins; `src/Root.tsx`: compositions `TheSet169`
  (1920×1080, 900 f), `TheSet916` (1080×1920, 900 f), `TheSet11` (1080×1080, 600 f = 20 s cut without A-200),
  stills `OgImage` (1200×630) and `XCard` (1600×900), and per-scene compositions for preview.
- `src/timeline.json`: the one clock for picture (`src/timeline.ts`), sound (`scripts/sound.mjs`) and
  captions (`scripts/captions.mjs`).
- `src/scenes/*`: Cover (A-000), PlanCut (→ A-100), Sheet (A-101…A-105), Context (A-200), EndCard; each lays
  itself out natively per format (`coverLayout.ts`, `rowLayout.ts`, `sheetLayout.ts`).
- `src/lib/string.ts` (chalk string), `src/lib/puff.ts` (matte powder), `src/lib/ease.ts` (DRAW, SETTLE, TICK).
- Fonts: `public/fonts` (the site's own files) through `@remotion/fonts`.

## Rules kept
Every animation is a pure, clamped function of `useCurrentFrame()`; no CSS animations; seeded `random()`;
media through `staticFile()` and `<Video>` from `@remotion/media`; `premountFor={fps}` on every timed node;
packages only via `npx remotion add` at 4.0.534.

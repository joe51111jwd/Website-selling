# THE SET · deliverables (A7, pass A)

Concept film of the HRCG drawing set. **CONCEPT FILM · AI-GENERATED CONCEPT FOOTAGE.** Rendered with
Remotion 4.0.534 from A5's graded, livery-shifted, crowd-crushed mezzanines (`film/public/clips/`), with the
chalk line, puff, H1 ink, plan cut, HOLD cloud, 1811 grid diagram and COURSE mark drawn in Remotion. Pass A
contains **no screen capture of the site** (pass B may add them; the burn-in and the site's disclosure strings
must then change, see `requests/A7-1.md`).

## Films (web copies, brief §7e)
| File | Size | Duration | Video | Audio | Budget |
|---|---|---|---|---|---|
| `the-set-169-av1.mp4` | 3.70 MB | 30.0 s | AV1 Main 8-bit 1920×1080 30 fps, SVT-AV1 crf 34 preset 8 | AAC 128k | ≤ 4 MB ✓ |
| `the-set-169-h264.mp4` | 5.67 MB | 30.0 s | H.264 High 1920×1080 30 fps, crf 23 slow, yuv420p | AAC 128k | ≤ 8 MB ✓ |
| `the-set-916-av1.mp4` | 3.60 MB | 30.0 s | AV1 1080×1920 | AAC 128k | (as 16:9) ✓ |
| `the-set-916-h264.mp4` | 5.67 MB | 30.0 s | H.264 1080×1920 | AAC 128k | ✓ |
| `the-set-11-av1.mp4` | 2.07 MB | 20.0 s | AV1 1080×1080 (the 20 s cut) | AAC 128k | ≤ 2.7 MB ✓ |
| `the-set-11-h264.mp4` | 2.85 MB | 20.0 s | H.264 1080×1080 | AAC 128k | ≤ 5.4 MB ✓ |
| `…-av1-silent.mp4`, `…-h264-silent.mp4` | 1.96–5.48 MB | | same video streams, no audio track | — | |

All files are `+faststart` (moov before mdat). `<source>` codecs: AV1 `video/mp4; codecs="av01.0.08M.08, mp4a.40.2"`
first, H.264 `video/mp4; codecs="avc1.640032, mp4a.40.2"` second. Masters (H.264 crf 16, AAC 320k) and silent
masters are in `film/out/` (gitignored): `the-set-{169,916,11}-master.mp4` / `-silent.mp4`.

Sound: synthesised foley only (no music, no voice): room tone, reel pay-out, string twang, thwack (filtered noise
burst + 90 Hz thump), powder hiss, silence at the freeze, a low thud on the plan cut, a pencil tick per sheet, a
dry knock per perspective cut, a pencil scratch bed under A-200, five soft clacks on the end card. Integrated
loudness −14.2 LUFS (16:9, 9:16) / −14.4 LUFS (1:1), true peak ≤ −1.2 dBTP.

## Posters and stills (R5)
| File | Size | Pixels |
|---|---|---|
| `the-set-169-poster.avif` / `.jpg` | 39 kB / 216 kB | 1920×1080 (frame 210: the frozen frame 84, H1 inked) |
| `the-set-916-poster.avif` / `.jpg` | 31 kB / 190 kB | 1080×1920 (N01b frozen at its plume peak, frame 100) |
| `the-set-11-poster.avif` / `.jpg` | 31 kB / 148 kB | 1080×1080 |
| `og-image-1200x630.jpg` (+ `.png`) | 139 kB | 1200×630 · for `public/media/og/og-image.jpg` |
| `x-card-1600x900.jpg` | 213 kB | 1600×900 |

og:image / X card: frame 84 of c34 with the H1 in frame space (brief §2.2), a title strip
`HUMANOID ROBOT CONSTRUCTION GAMES · PLANNED · NEW YORK CITY · 2027` and `CONCEPT · AI-GENERATED. THIS HASN’T
HAPPENED YET.` at 28 px (1200 wide) / 38 px (1600 wide). Suggested `og:image:alt` is the brief's §8.8 text.

## Captions and transcript
`the-set-169.vtt`, `the-set-916.vtt`, `the-set-11.vtt`: every super (bottom) and `[sound]` cues (top).
`the-set-transcript.txt`: the lightbox transcript.

## Linking (A5 / A1)
See `requests/A7-2.md` (copy into `public/media/film/`, marker `the-set-169.final`, manifest rebuild) and
`requests/A7-1.md` (the site's THE SET strings must say AI-generated concept footage, not screen capture, for pass A).

## Truth notes
Every frame carries `CONCEPT FILM · AI-GENERATED CONCEPT FOOTAGE` and `HRCG-2027 · PLANNED · DRAWING SET`;
every view carries its view title. No timecode, LIVE bug or lower-thirds; no vendor names; no email or URL;
no venue (A-200 parks the venue as a HOLD before the separate 1811 grid diagram draws; the bays never touch the
grid); one row of five, one course of five; "2027" always beside PLANNED. `THIS HASN’T HAPPENED YET.` appears in
the hero's own view titles (as on the site) and the end card. A-200's "1811" and "about 29°" are in both the
verified and the fallback body of the fact gate.

# A5 fixer · F-045 · the slim runtime manifest is ready (for A1's F-014)

**Status:** done 11:25. `src/media/manifest.json` is now the slim runtime manifest; `npx tsc -p tsconfig.json --noEmit` is clean.

**What changed**
- `pipeline/build_manifest.py` writes two files:
  - `src/media/manifest.json` (runtime, `version: 2`): per entry only `id, sources, poster, posterFallback, w, h, alt,
    viewTitle, loop, stills, meta, lineEndpoints, captions, transcript, proof`, plus `dur` on `the-set-169` (A900Parts reads it).
    Root keeps `version, mock, media, sheetVideoPriority`; the `generated` timestamp is gone, so the file only changes when the media change.
  - `pipeline/out/manifest-qa.json`: the full manifest as before (`bytes`, `kind`, `fps`, `dur`, `borderRect`, `freezeFrame`,
    `posterAlt`, `generated`). `pipeline/qa_shipped.py` now reads this one. QA tooling that wants byte counts should read it too.
- `src/media/manifest.ts`: `kind`, `bytes`, `fps`, `dur`, `borderRect`, `freezeFrame`, `posterAlt` are optional in `MediaEntry`
  (QA-only); `resolveEntry` no longer builds a `bytes` map. No exported function changed (`media`, `getMedia`, `hasMedia`,
  `phoneVariant`, `freezeStillFor`, `loadJson`, `loadDepthGrid`, `mediaUrl`, `sheetVideoPriority`, `isMockManifest`).

**Size:** minified JSON 35.1 kB → 26.1 kB; gzip 5.6 kB → 4.0 kB. (Most of what is left is alt text and view titles, which the page reads.)

**For A1 (F-014):** nothing to change in imports; `import … from '../media/manifest'` already gets the slim file.

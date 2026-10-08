# HRCG build contract

Seven agents build THE SLAB in parallel. This file says where things are, who owns what, how to run and
test, and the rules of the shared machine. The creative source of truth is the creative brief; this file
only governs how we build it.

S = `/tmp/claude-0/-home-user/a462cba4-955f-5044-9e19-3a11e18ef1bf/scratchpad`

## 1. Read before you touch anything

1. `S/PROJECT_BRIEF.md`: the job, the media, the stack, the machine.
2. `S/concept/CREATIVE_BRIEF.md`: **binding**. Read §0–§1 and §5–§6 (design and motion system) fully, plus every section your agent owns (see §3 below). §3.13 has the exact copy for states and errors.
3. `S/concept/PRODUCTION_PLAN.md`: the director's overrides. **Where it differs from the brief, it wins.**
4. `S/research/audit.md` §4: the 24 truth rules. **They beat everything.** If a request seems to need an invented fact, stop and write it in your final report instead.

## 2. Run it

All commands run from `/home/user/Website-selling/hrcg`.

| What | Command |
|---|---|
| Shared dev server (already running; never start a second one) | `http://127.0.0.1:5300/` · if it is down: `npx vite --port 5300 --strictPort --host 127.0.0.1` (background) |
| Your sandbox | `http://127.0.0.1:5300/?sandbox=<name>` (A1 provides the router; until it exists, mount your component in a temporary `src/sandboxes/<agent>.tsx` that you own) |
| Typecheck (must pass before you hand back) | `npx tsc -p tsconfig.json --noEmit` |
| Build check (never write into `dist/`) | `npx vite build --outDir $S/build-<agent> --emptyOutDir` |
| CPU-heavy work (depth, ffmpeg encodes, Remotion renders, Playwright runs) | prefix with `scripts/cpuq`, e.g. `scripts/cpuq node $S/shot.cjs <url> <prefix> 8000` |
| Screenshots (desktop 1440x900 + mobile 390x844) | `scripts/cpuq node $S/shot.cjs "<url>" <outPrefix> <waitMs>`; single size: `node $S/shotone.cjs <url> <out.png> <w> <h> <waitMs>`; LOOK at every screenshot with the Read tool |
| Python (depth etc.) | `S/concept/wild-spike/venv/bin/python -I <script>` |

**Headless Chromium on this box:** WebGL runs in SwiftShader at 2–5 fps (judge layout, not smoothness; use settle times of 6–12 s). It **cannot play H.264**: always provide an AV1 (or VP9 WebM) source first, and posters on every video. Real users get the H.264 fallback too.

## 3. Ownership (one owner per file)

| Agent | Owns | Brief sections |
|---|---|---|
| **A1 · Shell, system, chrome** | `index.html`, `src/main.tsx`, `src/App.tsx`, `src/system/**`, `src/chrome/**`, `src/content/{config,sheets,challenges,viewTitles}.ts`, `src/content/copy/chrome.ts`, `src/content/lint.test.ts`, `src/content/lint-allow.json`, `scripts/prerender.mjs`, `package.json` + lockfile, `tsconfig.json`, `vite.config.ts`, `public/{favicon*,apple-touch-icon.png,icon-512.png,robots.txt,404.html,_headers}`, `netlify.toml`, `src/sandboxes/index.tsx` (router) | §3.1, §3.2, §8, §9.2, §10.1 S2–S8 |
| **A2 · Hero** | `src/hero/**`, `src/content/copy/hero.ts`, `public/svg/{chalk-pattern.svg,spray-x.svg}`, `public/fonts/BigShoulders-H1.woff2` | §2, §3.3 (P 0–0.75), §4.1, §10.1 H1–H9 |
| **A3 · Marks, bays, sheets 01–03** | `src/marks/**`, `src/sheets/{ArenaPlan,A100Bays,PerspectiveStage,A101Brick,A102Drywall,A103Bolt}.tsx`, `src/content/copy/a100-a103.ts` | §3.3 (A-100), §3.4–3.6, §4.4, §5.5 |
| **A4 · Sheets 04–05, section, context** | `src/sheets/{A104Pipe,A105Layout,SectionSlice,sliceMaterial,A200Context}.tsx`, `src/content/copy/a104-a200.ts`, `pipeline/grid1811.mjs`, `public/svg/grid1811.svg` | §3.7–3.9, §4.2, §4.4 |
| **A5 · Media pipeline** | `pipeline/**` (except `grid1811.mjs`), `public/media/**`, `public/kit/**`, `src/media/manifest.json`, `src/media/manifest.ts`, `scripts/capture.mjs`, `scripts/cpuq` | §7a, §7b gate, §7c R1–R3, §7d, §7e |
| **A6 · Conversion, notes, QA, truth** | `src/sheets/{A300Teams,A301Sponsors,A900Notes}.tsx` + their subcomponents (`src/sheets/conversion/**`), `src/content/copy/conversion.ts`, `src/lib/**`, `scripts/qa.mjs`, `qa/**` | §3.10–3.12, §3.13, §10, §10.5, §10.6 |
| **A7 · Films (Remotion)** | `film/**` (its own package; never touch the site's package.json) | §7c R4 THE SET (now **P0**, see PRODUCTION_PLAN O1), R5 stills |

Rules:
- **Edit only what you own.** Need something else changed? Write `requests/<agent>-<n>.md` (see `requests/README.md`).
- **Never commit, push, or reset git.** The director commits.
- **Never install packages** except A1 (site) and A7 (inside `film/`). Ask A1 via a request.
- Copy lives in your own `src/content/copy/*.ts` file and must match the brief's exact copy. View titles come only from `src/content/viewTitles.ts` through `<ViewTitle>`.
- Media is referenced only through `src/media/manifest.ts` ids. Until A5's real files land, the mock manifest points at posters/clips that exist.
- No new fonts, no CDNs, no third-party requests, no analytics.
- Delete scratch files you create outside `S/`.

## 4. Frozen interfaces

Brief §9.2 is the interface contract. A1 publishes stubs for every system export within its first pass, so others can build against them. Changes to a frozen interface go through `requests/`.

## 5. Done means

Your brief §9.4 "definition of done" items pass, `npx tsc -p tsconfig.json --noEmit` is clean, the build check succeeds, and you have looked at screenshots of your work at 1440×900 and 390×844 (and reduced motion where relevant). Your final message lists: what is done, what is not, any truth-rule questions, and every file you created or changed.

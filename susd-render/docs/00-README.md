# 00 · README: start here

### The rendered Waterline for *Scaling Up-Side-Down*: what every document is for, where the pictures are, and where things stand

**Project.** The homepage for Michael Wentz's book *Scaling Up-Side-Down* (SUSD), built by James's agency. The
page is the **Waterline**: Michael's thesis, "Every hire compounds complexity before it compounds capacity." [M 696 · copy.ts:60],
stands as real letters in a real place, and real water rises toward it as you scroll, one hire per step. Every
picture is a Blender render (Cycles), not an AI image. The goal of the page is clicks on the **SUSD Bootloader**
(a free file, V16, 35,445 words, for any AI assistant). Why this direction, in James's words:
[`04-DIRECTION.md`](04-DIRECTION.md).

---

## James, in 30 seconds

- **Look at these two first:** the story in stills, [`out/stills/contact_sheet.png`](../out/stills/contact_sheet.png),
  and the first screen with the page on top, [`out/mock/desktop-hero.png`](../out/mock/desktop-hero.png).
  The same for phone: [`out/stills/contact_sheet_phone.png`](../out/stills/contact_sheet_phone.png),
  [`out/mock/phone-hero.png`](../out/mock/phone-hero.png).
- **What changed since "it looks like a sewer":** the canal lock is gone. The words are now welded white capitals
  on a ship's dark hull, in daylight harbour water, with a real load-line mark at the 12-person level. When the team
  goes past fifteen, the camera goes under the water with the words.
- **Status:** hero stills done (round 4). The earlier rounds were failed by three reviewers twice; round 4 is the
  fix and has not been reviewed or shown to you yet. No scroll sequence, no site, no preview link yet.
- **What we need from you:** six decisions, listed in [`06-HERO-BUILD.md`](06-HERO-BUILD.md) section 13.8 (the
  setting, the letter face, the opt-in mode, the red/green lamp, the render budget, the button style).

---

## 1. Status

### 1.1 The hero stills and their reviews

Each review round had three reviewers: an **art direction** review, a **stranger** (a 9-person bootstrapped
founder judging the first screen and whether they would get the Bootloader), and a **technical** review that
re-ran the script and measured the frames. Scores are out of 10.

| Build round | Place and look | Stills | Review | Art / Stranger / Technical | Verdict | What it led to |
|---|---|---|---|---:|---|---|
| 1 | Canal lock, first finals | [`out/stills/r1/`](../out/stills/r1/) | internal only | n/a | refined in place | 06 section 7 |
| 2 | Canal lock: Plimsoll letters on a precast panel, late sun | [`out/stills/r2/`](../out/stills/r2/) | **Review round 1** | **5 / 6 / 6** | all three failed | Round 3. Fixes in 06 section 12 |
| 3 | Canal lock, refined | [`out/stills/r3/`](../out/stills/r3/) | **Review round 2** | **3.5 / 6 / 5** | all three failed; James: "it looks like a sewer" ([`07`](07-CLIENT-FEEDBACK.md)) | Round 4. Fixes in 06 section 13 |
| **4 (current)** | **Ship's side**: welded white capitals on dark hull plating, clear harbour water, the load line at 12, a camera in the water for the drowned beats | [`out/stills/`](../out/stills/) | **not yet reviewed** | n/a | self-checks pass (below) | show James; decisions in 06 section 13.8 |

**Review round 1, in short** (06 section 12). Blockers in all three reviews: the drowned beats (dark and hard to
read). Also: the letters (art blocker); jagged reflections; the Side courses and the Oxygen frame; light, shade
and the lamp; the story was not clear by scroll alone (stranger majors); the first screen, the Bootloader dock and
the finale (stranger blockers). All were fixed or answered with test renders in round 3.

**Review round 2, in short** (06 section 13). Scores went down: the art review failed the *place* itself, and the
technical review agreed (blockers), while James independently called it a sewer. So round 4 changed the place
instead of polishing the lock: the ship's side. Also: the letters and face (art majors), the drowned beats again
(blocker), the story by scroll alone, the load signal, the scene script and the page. Every blocker and major was
fixed or tested and answered; what was not taken, and why, is 06 section 13.11.

**Round 4 self-checks** (31 Oct, 03:49 to 05:13 UTC; numbers in 06 section 13.9 and the results table at the top
of 06):
- 15 desktop stills (1600×1000, 32 samples) and 9 phone stills; 14 desktop and 9 phone mock screenshots.
- Copy: `copycheck` reports 45 sentences on the mocks and 37 in the copy deck, **0 not found** (re-run 31 Oct).
- AI tells: `tools/ai_tells_scan.sh mock` prints nothing; the 25-question checklist (02, section 0) is answered in
  06 section 13.10.
- Layout: no text box within 12 px of another or on the rendered sentence, on every screen.
- **Open, honestly:** two phone captions are below 4.5:1 contrast against the render (`phone-b2-twelve` 3.85:1,
  `phone-b3-touch` 4.26:1). And James's sewer note asked for clean, bright water with a pale floor you can see;
  round 4 keeps the water clear but darker on purpose, because the bright floor out-shone the sentence in the
  squint test (06 section 13.11). James should judge that from the contact sheet before the sequences are rendered.

### 1.2 Since round 4

- **Sequence cost measured:** four real sequence frames at 1440×900, 24 samples
  ([`out/seq/desktop/`](../out/seq/desktop/): `d00`, `d01` open view, about 116 s each; `d37`, `d38` in the water,
  about 167 s each). Budget for all frames: about 4.1 h with Plan C (06 section 13.9).
- **Phone under-water tests:** `out/test4/t07p_under_*.png` and `sheet_t07p*.png` (lens 20/28/32 mm, back-water
  roughness 0.16/0.20; 31 Oct 05:08 to 05:10). Not yet written up in 06.

### 1.3 Not started

The scroll sequences, the site, the preview deployment. See section 2.

---

## 2. Next steps, in order

1. **Show James round 4** (the two contact sheets and the first-screen mocks) and get the six decisions in 06
   section 13.8. If time allows, run review round 3 on round 4 first, with the same three reviewers and the 02
   checklist. Fix the two low-contrast phone captions.
2. **Render the scroll sequences.** `python3 scene/keyframes.py --write`, then `--render desktop holds` first (the
   cuts and holds, so a short run still gives a whole story), then the in-betweens, then phone, then the two drain
   clips. Plan C: 24 samples for the holds, 16 for the in-betweens, about 4.1 h of CPU. One Blender at a time: every
   frame waits for a free CPU through `tools/render_idle.py`; check `pgrep -f "blender -b"` before starting. Frames
   are resumable and logged in `out/renders.jsonl`.
3. **Pack the frames for the web** (WebP/AVIF tiers; check banding in the darkest water). The old pipeline's
   `reference/old-render/pack_frames.py` and `frames.ts` show the pattern. Render brief section 7.8.
4. **Build the site** from the render brief, sections 4 to 13: one sticky stage that plays the frames from the
   scroll position, captions on one clock, the dock (desktop) and bar (phone), the mid-story offer, the finale
   form at `#get`, the drain on submit, no-JS and reduced-motion fallbacks, accessibility. Copy from
   `briefs/copy-deck.waterline-render.ts` (as `src/copy.ts`), fonts from `docs/type/system/web/`. MVP opt-in: the
   email field opens `https://scaling-up-side-down.vercel.app/appendix#get`. Gates before anyone sees it:
   `copycheck` 0 not found, `ai_tells_scan.sh` prints nothing, screenshots at 1440×900 and 390×844 with the overlap
   check, the 02 checklist.
5. **Deploy a preview** (Vercel), then send James the link and the screenshots. Nothing has been deployed,
   committed or pushed.

---

## 3. The documents

Read in this order if you are new: 04 (why), 01 (what the book says), 06 section 13 (what is built now), the render
brief (what the site must do), then the rest as needed.

| File | What it is for | Status |
|---|---|---|
| [`00-README.md`](00-README.md) | This page: the index, where things are, status, next steps. | current |
| [`01-MEANING.md`](01-MEANING.md) | What the book actually says, why it is true, and every image Michael put in it (section 5; 5.B is the water family: Drowning, Redline, Oxygen). Every visual must trace back to something here. | current, the foundation |
| [`02-AI-TELLS.md`](02-AI-TELLS.md) | What makes a page or a render look AI-made or templated in 2026, with evidence from our own four options, and what we do instead. Section 0 is the 25-question checklist to run on every screenshot and still. Overrides the render brief's section 11. | current |
| [`03-TYPE.md`](03-TYPE.md) | The type system: 18 cuts from 14 families tried; our own face **Plimsoll** (built in code); Ortica (Collletttivo) for Michael's lines; B612 for labels; files, CSS and Blender settings. | current, except the rendered sentence: round 4 sets it in Ortica Angular Bold capitals, not Plimsoll (06 section 13.2; James to decide) |
| [`04-DIRECTION.md`](04-DIRECTION.md) | The decision record: James's three messages verbatim, the meaning work, the parked concepts, why the Waterline is Michael's own imagery, the scroll-only and Bootloader-clicks rules. | current |
| [`05-RENDER-PIPELINE.md`](05-RENDER-PIPELINE.md) | Blender look-dev: the three stagings tried (glass tank, flooded room, canal lock), exact render settings, measured costs per frame, assets, pitfalls. How to install and run Blender here. | method, costs and pitfalls current; its recommended *place* (the lock) is superseded by 06 section 13 |
| [`06-HERO-BUILD.md`](06-HERO-BUILD.md) | The scene script, the story table, the cameras, every still, the mocks, the two review rounds and every fix, timings and budget, decisions for James. **Section 13 and the results table at the top are current**; sections 2 to 12 are the canal-lock history. | current (section 13) |
| [`07-CLIENT-FEEDBACK.md`](07-CLIENT-FEEDBACK.md) | James's reactions word for word, newest first, with what each means for the next pass. | current; add to it every time James reacts |
| [`concepts/his-images.md`](concepts/his-images.md) | Parked lens 1: two concepts from Michael's own metaphors (All Three Dimensions; The Wrong Map). | parked (04, section 3) |
| [`concepts/physics.md`](concepts/physics.md) | Parked lens 2: two concepts from real physical systems (The Fold; The Lifts), with the systems tested and rejected. | parked (04, section 3) |
| [`type/quotes-used.txt`](type/quotes-used.txt) | Every Michael line set in a type specimen, with its reference. | reference |
| [`type/system/FONTLOG.md`](type/system/FONTLOG.md) | Where each shipped font comes from and what its licence (SIL OFL 1.1) allows. Ship it with the fonts. | current |
| [`type/web/specimen.html`](type/web/specimen.html) | The type system as a web page (screenshots in `type/specimens/21-web-1440.png`, `22-web-390.png`). | reference |
| `type/custom/`, `type/specimens/`, `type/fonts/` | Plimsoll's source (UFO), builds, proofs and history; specimens of every face tried (and `specimens/3d/` in the lock); the candidate fonts with their licences. | reference |
| [`../briefs/BRIEF-waterline-render.md`](../briefs/BRIEF-waterline-render.md) | The render and site brief: the level map, the first screen, the nine scroll beats, the Bootloader conversion design (section 6), the render plan and budget, phone, how the page plays the frames, fallbacks, accessibility, QA. **The spec for building the site.** | current for the site; its place (canal lock), face and cameras are updated by 06 section 13 |
| [`../briefs/copy-deck.waterline-render.ts`](../briefs/copy-deck.waterline-render.ts) | Every word on the page, each with its source line; paste as `src/copy.ts`. `copycheck` reports 37 sentences, 0 not found. | current; the mocks add labels recorded in 06 section 13.7 |
| [`../reference/old-render/README.md`](../reference/old-render/README.md) | The previous Blender pipeline (the wooden blocks): scroll-scrubbed frame sequences packed for the web. Reference for packing and playback. | reference |

**When documents disagree:** James's words (07 and the three messages in 04) come first; then 06 section 13 (what
is built now); then 02-AI-TELLS; then the render brief; then 03 and 05, which record the type and look-dev work as
it stood before round 4.

**Sources of truth outside this folder:** `susd-options/source/public_bootloader.md` (the Bootloader V16, Michael's
words) and `susd-options/source/src_copy.ts` (manuscript lines); `susd-options/brief/TASTE.md` (all of James's
reactions) and `MESSAGE.md` (quote bank, audience bands); the CSS/WebGL Waterline James said "could work" in
`susd-options/waterline/`. Copy checker: `node susd-options/tools/copycheck.mjs <files>`.

---

## 4. Where the pictures are

Everything under `out/` is gitignored (large binaries); it lives on this machine only. The scripts that make it are
in the repo.

**The latest hero stills and mocks (round 4)**

| What | Path |
|---|---|
| The story in stills, desktop and phone | `out/stills/contact_sheet.png`, `out/stills/contact_sheet_phone.png` |
| Desktop stills, 1600×1000, story order | `out/stills/d01_hero_K1.png` (8 people), `d15_hire_n10.png` (10), `d02_twelve_K2.png` (12), `d03_touch_K3.png` (13), `d04_under_K5.png` (19, under), `d05_redline_K6.png` (39, Redline), `d06_turn_K7.png`, `d07_side1_K8.png`, `d08_down1_K9.png`, `d09_up2_K10.png`, `d10_side2_K11.png`, `d11_up3_K13.png`, `d12_oxygen_K16.png`, `d13_finale_K16F.png`, `d14_drain_K17.png` (after the opt-in) |
| Phone stills | `out/stills/p01_hero_K1.png`, `p02_under_K5.png` (900×1950), `p03_twelve_K2.png`, `p04_touch_K3.png`, `p05_redline_K6.png`, `p06_turn_K7.png`, `p07_down1_K9.png`, `p08_oxygen_K16.png`, `p09_finale_K16F.png` (600×1300) |
| The page on top, contact sheets | `out/mock/contact_sheet.png`, `out/mock/contact_sheet_phone.png` |
| The page on top, desktop 1440×900 | `out/mock/desktop-hero.png`, `desktop-b2-hire.png`, `desktop-b2-twelve.png`, `desktop-b3-touch.png`, `desktop-b4-under.png`, `desktop-b5-redline.png`, `desktop-b6-turn.png`, `desktop-b6-side.png`, `desktop-b7-down.png`, `desktop-b7-offer.png`, `desktop-b8-cycle2.png`, `desktop-b8-repeat.png`, `desktop-b9-oxygen.png`, `desktop-finale.png` |
| The page on top, phone 390×844 | `out/mock/phone-hero.png`, `phone-b2-twelve.png`, `phone-b3-touch.png`, `phone-b4-under.png`, `phone-b5-redline.png`, `phone-b6-turn.png`, `phone-b7-offer.png`, `phone-b9-oxygen.png`, `phone-finale.png` |
| Round 4 test sheets (720×450, 16 samples) | `out/test4/sheet_t02.png` to `sheet_t05.png`, `sheet_t04a/b/c.png`, `sheet_t04p.png` (phone) |
| Letter face A/B on the hull, and the type proof | `out/test4/sheet_face_ab.png`, `out/test4/type_proof_plimsoll_v1.0_v1.1_ortica.png` |
| Measured sequence frames | `out/seq/desktop/d00.png`, `d01.png`, `d37.png`, `d38.png` |

Every still and frame has an `.anchors.json` beside it: where the words, the waterline and the marks land on screen,
so the HTML can be placed on the picture.

**Everything else under `out/`**

| Folder | What it holds |
|---|---|
| `out/stills/r1/`, `r2/`, `r3/` | Earlier hero rounds (the canal lock), kept for comparison; `render_r*.log` beside them. |
| `out/mock/measurements.json`, `shots.json`, `squint.txt` | Contrast of every text box against the render under it, the screenshot list, and the squint test. |
| `out/test/` | Round 1 and 2 tests (canal lock, 720×450). |
| `out/test3/` | Round 3 tests and crops (canal lock). |
| `out/test4/` | Round 4 tests (ship's side); `superseded/` holds full-size stills that were replaced; `seq_timing.log` is the sequence-frame timing run. |
| `out/share/` | Previews made for James on 31 Oct, 00:32 to 00:35 UTC, right after the sewer message, from the round-2 canal lock: `first-screen-desktop.jpg`, `first-screen-phone.jpg`, `scroll-story-now.jpg`, `waterline-scroll-story-v0.mp4`. Superseded by round 4. |
| `out/renders.jsonl` | One line per render (194 so far): output, state, camera, size, samples, seconds, exact arguments. |

**Outside `out/`:** the look-dev renders are in `lookdev/a/`, `b/`, `c/`, `full/` and `sheets/` (05); the type
specimens in `docs/type/specimens/` (03); the mock pages themselves (HTML) in `mock/`.

---

## 5. How to reproduce

Set-up, the look-dev and what every setting costs: [`05-RENDER-PIPELINE.md`](05-RENDER-PIPELINE.md). The current
scene's full command list: [`06-HERO-BUILD.md`](06-HERO-BUILD.md) section 1. The essentials, from `susd-render/`:

```bash
# Blender 4.5.15 LTS, Cycles on the CPU (4 cores, no GPU), OIDN denoise. Only one render at a time:
pgrep -f "blender -b"                                    # must print nothing before you start

# the CC0 scans the round-4 scene loads, from Poly Haven (skips what is there; every download is in assets/polyhaven/SOURCES.tsv)
python3 tools/fetch_polyhaven.py tex blue_metal_plate metal_plate rusty_metal_02 coast_sand_01 concrete_wall_008
python3 tools/fetch_polyhaven.py hdri kloofendal_43d_clear_puresky

# one still (a K number or a story name), desktop or phone
blender -b -P scene/waterline.py -- --state hero --w 1600 --h 1000 --samples 32 --out out/stills/d01_hero_K1.png
blender -b -P scene/waterline.py -- --state hero --camera phone --w 900 --h 1950 --samples 32 --out out/stills/p01_hero_K1.png
bash scene/render_stills.sh 32                           # every still in 06 (skips existing ones)

# the scroll sequences (resumable; each frame waits for a free CPU)
python3 scene/keyframes.py --write
python3 scene/keyframes.py --render desktop holds

# the mocks and their checks
python3 mock/build_img.py && python3 mock/build_pages.py && node mock/shoot.cjs
node /home/user/Website-selling/susd-options/tools/copycheck.mjs mock/*.html   # must print 0 not found
bash tools/ai_tells_scan.sh mock                                               # must print nothing
python3 tools/check_meaning_quotes.py docs/04-DIRECTION.md                     # quotes in a doc vs their lines
```

The scene is built from an empty file on every run (no `.blend` needed). Asset list and licences:
`assets/polyhaven/SOURCES.tsv` and 05 section 8; fonts: `docs/type/system/FONTLOG.md`.

**The code, folder by folder**

| Folder | What it holds |
|---|---|
| `scene/` | `waterline.py` (the whole scene, one script), `story.py` (the state table and level map, no Blender), `keyframes.py` (the sequence table and its renderer), `render_stills.sh`, checks (`frame_checks.py`, `measure_zoom.py`, `sample_lamps.py`), sheets and the round report; `archive/` holds the round-3 lock version. |
| `lookdev/` | The look-dev scripts and library (`lib_lookdev.py`, `stage_a_tank.py`, `stage_b_room.py`, `stage_c_lock.py`) and their renders (05). |
| `mock/` | The mock pages, generated from the stills' anchors (`build_img.py`, `build_pages.py`), the screenshot and overlap check (`shoot.cjs`), the squint test, self-hosted fonts. |
| `tools/` | `fetch_polyhaven.py`, `render_idle.py` (one render at a time), `ai_tells_scan.sh`, `check_meaning_quotes.py`, `make_staff_gauge.py`, `smoke_test.py`; `type/` builds Plimsoll and the specimens. |
| `assets/` | Downloaded CC0 scans (`polyhaven/`, gitignored), fonts, and one generated texture. |
| `reference/old-render/` | The previous Blender pipeline, for reference. |
| `.scratch/` | Working files (gitignored); nothing here is needed to reproduce. |

---

## 6. The rules, in one place

- **Scroll only.** The whole story with zero clicks; clicks only for the two paths (04, section 5).
- **Bootloader clicks are the goal.** Visible from the first screen to the last, framed as the fix (04, section 6).
- **Every sentence is Michael's**, word for word and cited; labels and buttons excepted. `copycheck` must report
  0 not found.
- **No AI images, nothing that looks AI-made or flat** (02). Every image is a render of ours or a noted CC0 scan.
- **Desktop first** (1440×900), clean on phone (390×844).
- **One Blender render at a time.** Work only inside `susd-render/`. Do not commit or push without James.
- **Document everything** (James). New reactions from James go into 07, new build rounds into 06.

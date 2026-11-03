# 10 · The Heap, the real site (fast pass)

James looked at the 15 concept ideas and said about idea 2: "try making the heap. dont worry about good renders,
just make it fast". This is that site: a working scroll page built from one fast render pass. It is not polished.
We fixed only things that broke the story or the page.

- **Entry:** `heap-site/index.html`. Plain static files: no framework, no npm, no build step.
- **Serve:** `cd heap-site && python3 -m http.server 8771`, then open http://127.0.0.1:8771/.
- **Check it:** with it served, run `node tools/shoot_heap.cjs http://127.0.0.1:8771/ out/heap-site/qa out/heap-site/shots`
  (from `susd-render/`; it exits 1 on any problem) and `node ../susd-options/tools/copycheck.mjs heap-site/index.html`.
- **Deploy copy:** `scaling-upside-down/site/heap/`, served at `/heap/` (see section 4).
- **For James:** the scroll-through videos `out/heap-site/heap-desktop.mp4` and `out/heap-site/heap-phone.mp4`,
  and the contact sheet of every beat, `out/heap-site/heap-sheet.jpg`.

## 1. What the page is

A small office on a locked camera. There is one white mug on the shelf for each person, and one patch cable on the
floor for each **pair** of people (pathways = n(n-1)/2). Each scroll step hires one more person. That adds one mug,
and the new hire's n-1 cables land on the pile in blue. The mugs go up by one each step, but the pile grows faster.
At the end the same room is tidied: the cables are bundled into three trunks that run into a small rack with one
empty port. Then comes the Bootloader offer.

The KPI (from James): the visitor only needs to scroll. They should get the point with zero clicks. The goal is
clicks on the free SUSD Bootloader. The book ("pre-orders open soon") is the second path.

| Beat | Frame | Words (source ref) | Counts on the picture |
|---|---|---|---|
| Hero | d08 / p08 | h1 "Every hire compounds complexity before it compounds capacity." (M 696), the audience line, the scroll cue | 8 people / 28 cables |
| b09 | d09 | "Each addition doesn't add one unit of complexity — it adds n-1 new interaction pathways." (BL 2339) | 9 / 36 (+8) |
| b10 | d10 | band "Team 8–12", "Leader + team. Still know everyone's name." (BL 1250) | 10 / 45 (+9) |
| b11 | d11 | (counts only) | 11 / 55 (+10) |
| b12 | d12 | "12 isn't where you're trying to get. It's the line you don't cross." (BL 544) | 12 / 66 (+11) |
| b13 | d13 | band "Threshold 13–14", BL 3450, "Past twelve, something breaks." (M 3509) | 13 / 78 (+12) |
| b14 | d14 | "Complexity that accumulated faster than the structure could hold." (M 2021) | 14 / 91 (+13) |
| b15 | d15 | band "Graveyard 15–39", "Complexity > Capacity = Redline." in red (M 2997), BL 717 | 15 / 105 (+14) |
| Turn | d15 dimmed | "You were never the problem. The model you inherited was." (M 216) | (counts fade out) |
| Tidy 1-3 | d-tidy | "Real scaling is cyclical." + Up / Side / Down (BL 795); M 2408; "Capacity > Complexity = Oxygen." in green (M 2999), BL 718 | "room for one more" tag with a leader into the empty port |
| Finale `#get` | d-tidy, dimmed | M 4497, the Bootloader card, "The Bootloader asks" + BL 310, BL 314, the email form, the book line | (none) |

The "Get it free" button is always on screen: in the dock at the top right on desktop, or in the bar at the bottom on
phone. It hides only while the form is on screen. It jumps straight to `#get` with no smooth scroll through the
story. The form checks the address. If the address is empty or invalid, the form shows "Enter your email address."
If it is valid, the form shows "Taking you to the Bootloader page…". After 0.8 s (0.3 s with reduced motion), it
opens `https://scaling-up-side-down.vercel.app/appendix#get` in the same tab. The input has no `name`, so the email
never goes into the URL.

Playback is cut down from the Waterline player (`docs/08-SITE-BUILD.md` sections 1-3). It has one clock, s in vh of
the story (0..1200). It has a sticky stage, and the frames hold and then crossfade by scroll. The words fade in and
out in their windows. The counts count up through each blend. The timing lives in the `data-fs / data-f / data-cin /
data-cout` attributes on each `section.beat` and in `#story-config` (`len 1200, F 40, fc 10`). The runway is
`1200svh` in `heap.css`, so if `len` changes, change both. Reduced motion turns every blend and fade into a cut. With
no JS, each beat is a plate in normal flow (frame + words + static counts), and the form still works.

## 2. File map

| Path (from `susd-render/`) | What |
|---|---|
| `heap-site/index.html` | The page (hand-written). Every sentence carries its source ref in a comment; labels carry `<!-- // label -->`. |
| `heap-site/assets/css/heap.css` | Layout, type, both modes (JS stage / no-JS plates), phone tier `(max-aspect-ratio: 3/4)`. Colours are tokens on `:root`, repeated under a dark-scheme media query and `[data-theme="dark"]`, so the page looks the same on any host. |
| `heap-site/assets/js/heap.js` | The player: clock, frame crossfades, caption windows, live counts and leaders placed from `anchors.json`, the rack tag, word fitting (words shrink to no less than 0.7 instead of running onto the mugs, the heap or the desk), the dock/bar, the jump, and the form. Plain ES5. |
| `heap-site/assets/img/d08..d15.jpg, d-tidy.jpg` | Desktop frames, 1440x900, JPEG q82 (1.37 MB for all nine). |
| `heap-site/assets/img/p08..p15.jpg, p-tidy.jpg` | Phone frames, 600x1300 (camera `phonesite`), JPEG q82 (1.01 MB for all nine). |
| `heap-site/assets/img/anchors.json` | `{"d08": {"people", "cables", "anchors": {...}}, ..., "d-tidy", "p08", ..., "p-tidy"}`, values [x, y] in 0..1 of the frame from the top left. Keys: `mugs_left, mugs_right, mugs_top, shelf_under, heap_top, heap_left, floor_wall_left, desk_top, desk_left_top`, plus `rack, rack_port, rack_left, trunks` in tidy. The page fetches it at runtime (`d-tidy` is read as `dtidy`, the beats' `data-k="tidy"`). |
| `heap-site/assets/fonts/` | Plimsoll, Ortica Angular/Linear, B612 (woff2, self-hosted, copied from `site/assets/fonts`). |
| `heap-site-artifact/` | The claude.ai artifact copy (section 5). Generated, so do not edit it by hand. |
| `tools/shoot_heap.cjs` | Playwright QA: every beat at 5 viewports, plus the jump, the form, no-JS and reduced motion (section 6). |
| `tools/build_heap_artifact.py` | Makes `heap-site-artifact/` from `heap-site/`. |
| `tools/check_heap_artifact.cjs` | Playwright check of the artifact copy, wrapped in a minimal skeleton and in a sandboxed iframe (section 6). |
| `tools/record_heap.cjs` | Records the scroll-through videos (webm, then ffmpeg to mp4). |
| `ideas/02-heap/scene.py`, `NOTES.md` | The Blender scene and its notes ("Heap site frames" section: flags, cameras, timings). |
| `out/heap-site/raw/` | The raw PNG renders and a per-frame `.anchors.json` for each. |
| `out/heap-site/shots/` | Beat screenshots `d-01-hero.jpg` … `d-15-form-valid.jpg`, `p-01` … `p-15`, plus no-JS and reduced-motion shots. |
| `out/heap-site/heap-sheet.jpg`, `heap-desktop.mp4`, `heap-phone.mp4`, `frames-sheet.jpg` | For review. |

## 3. Rebuilding

**Frames** (from `susd-render/`, one render at a time, always through `render_idle.py`):

    python3 tools/render_idle.py blender -b -P ideas/02-heap/scene.py -- --people 12 --camera desktop --w 1440 --h 900 --samples 10 --label heap_site --out out/heap-site/raw/d12.png
    python3 tools/render_idle.py blender -b -P ideas/02-heap/scene.py -- --people 12 --camera phonesite --w 600 --h 1300 --samples 10 --label heap_site --out out/heap-site/raw/p12.png
    python3 tools/render_idle.py blender -b -P ideas/02-heap/scene.py -- --state tidy --camera desktop --w 1440 --h 900 --samples 10 --label heap_site --out out/heap-site/raw/d-tidy.png

`--people N` runs 8..15. Each render writes `<name>.anchors.json` next to its PNG. Desktop frames take about 35-39 s
to render and phone frames about 22-28 s; all 18 took about 10 min. Then convert the PNGs and merge the anchors:

    python3 -c "
    import glob, json, os
    from PIL import Image
    A = {}
    for f in sorted(glob.glob('out/heap-site/raw/*.png')):
        k = os.path.basename(f)[:-4]
        Image.open(f).convert('RGB').save('heap-site/assets/img/%s.jpg' % k, quality=82)
        a = json.load(open(f[:-4] + '.anchors.json'))
        A[k] = {'people': a.get('people'), 'cables': a.get('cables'), 'anchors': a['anchors']}
    json.dump(A, open('heap-site/assets/img/anchors.json', 'w'), indent=1)"

(Check the field names against a raw `.anchors.json` first. The contract is the `anchors.json` shape above.)

**Site:** edit `heap-site/index.html`, `assets/css/heap.css` and `assets/js/heap.js` directly. Then:

1. `node ../susd-options/tools/copycheck.mjs heap-site/index.html` must print "0 not found".
2. Run `tools/shoot_heap.cjs` as above. It must print "all checks passed".
3. Run `python3 tools/build_heap_artifact.py` to refresh the artifact copy.
4. Copy to the deploy folder (section 4).

## 4. Deploy copy (Vercel)

    rm -rf ../scaling-upside-down/site/heap && mkdir -p ../scaling-upside-down/site/heap
    cp -r heap-site/index.html heap-site/assets ../scaling-upside-down/site/heap/
    cd ../scaling-upside-down && node build.mjs      # copies site/ to dist/; dist/heap/index.html

All paths in the page are relative (`assets/...`, and `../fonts/` inside the CSS), so it works at `/heap/`.
`vercel.json` has `trailingSlash: true`, so `/heap` gets a 308 to `/heap/` on the real host. A small guard in the
page's first `<script>` does the same on any host that does not redirect. That guard costs one stray preload request
before it redirects, and nothing breaks. Nothing in Vercel settings, domains, production or git was touched.

## 5. The claude.ai artifact copy (for James's iPhone)

`heap-site-artifact/index.html` is generated by `tools/build_heap_artifact.py`. It is the same page with no
doctype/html/head/body/title/meta (the host wraps it), and the CSS and JS are linked relatively (`assets/...`).
`heap-site-artifact/assets/` is a real copy (not a symlink) of `heap-site/assets/`. The CSS and JS are the same
files; only `index.html` differs:

- `#story-config` has `"newtab": true`. In that mode `heap.js` never navigates its own frame. The form calls
  `window.open(appendix, '_blank')` synchronously inside the submit handler. If the browser blocks it, the page shows
  a visible link, "Open the Bootloader page" (`target="_blank" rel="noopener"`). In-page links (`#book`, `#get`)
  scroll by script, in case a host `<base>` would turn a fragment into a navigation.
- The form itself has `target="_blank" rel="noopener"`, and the trailing-slash guard is dropped.
- Colours: the tokens on `:root` are repeated under `@media (prefers-color-scheme: dark)` for
  `:root:not([data-theme="light"])` and under `:root[data-theme="dark"]`, and `body` has an explicit background.

To publish it, pass `heap-site-artifact/index.html` as the page and every file under `heap-site-artifact/assets/`
in `files`, at its own path.

## 6. QA results (3 Nov 2026)

`tools/shoot_heap.cjs` was run against `heap-site/` (port 8771) and again against `dist/heap/` (port 8772). Both
printed **"all checks passed"** at 1440x900, 1280x800, 1920x1080, 390x844 (isMobile, hasTouch) and 375x667, with all
12 story beats at each size:

- No console errors, page errors or failed requests, and no horizontal scroll.
- The first screen makes the point with no clicks. The h1 sentence is the biggest block of words on the screen (60 px
  on desktop, 29 px on phone, where the 34 px count figures are the only larger type). The "8 people" count sits under the mugs, and "28 cables" has its leader into the heap top. "Get it
  free" is visible.
- The counts land on the picture in every beat on both cameras, measured from `anchors.json`. The people count's
  left edge sits within the row of mugs, just under the shelf. The cables leader ends at the heap top: within 0 px in
  x and 8-10 px in y (it stops just above the pile). In tidy, the rack tag's leader ends 4-5 px above the empty port.
- No words (captions or counts) sit on the mugs or the heap. No two labels overlap, and no words touch the dock, the
  bar or the lockup.
- "Get it free" is visible on every beat. It is hidden only on the form. Clicking it on desktop or tapping it on
  phone from the hero lands with `#get` at the top on the first tap, with the dock/bar hidden. The email input and
  the button are the top elements at their centres, so nothing is drawn over the form.
- Form: an empty address and "not-an-email" both show "Enter your email address.". A valid address shows "Taking
  you…" and then navigates to exactly `https://scaling-up-side-down.vercel.app/appendix#get` (intercepted). The URL
  carries no email, and no new tab opens.
- Reduced motion: walking s = 0..1200 in steps of 15 found no half-blended frame or half-faded caption.
- JS off: every plate shows its frame and its words on screen, the finale and form show, and there is no horizontal
  scroll.
- `copycheck`: `heap-site/index.html` gives 16 sentences, 0 not found. `heap.js` and `heap.css` give 0 checked.
  `heap-site-artifact/index.html` gives 15 sentences (no meta description), 0 not found.
- Artifact copy: it was wrapped in a minimal skeleton and checked top-level at 1440x900, top-level on iPhone 13, and
  inside a sandboxed iframe on iPhone 13 (scripts, popups, no top navigation). It was also checked with
  `data-theme="light"` plus a light scheme, and with `data-theme="dark"` plus a dark scheme. It loads with no errors,
  and the colours are unchanged. The rack tag shows, `#book` scrolls in place, and the jump lands on the form. A
  valid submit opens a new tab at the appendix URL, and the frame stays where it is. A blocked popup shows the
  fallback link.

Fixed in this pass (they broke the story or the page):

1. The tidy frames' anchors were never used, because the page looked up `dtidy` while the file says `d-tidy`. So the
   "room for one more" tag never showed. The key is now normalised.
2. The rack tag now stands on the wall above the rack, with a thin leader down into `rack_port` (the empty port,
   about 5 px on desktop). Before, it sat at the panel centre over the plugs.
3. On phone, the cables count's words ran onto the desk and its cables ("one for each pair of" over the desk corner,
   and at 15 people over the cables on the desk). The count is now stacked (figure over words, 124 px wide) on the
   strip of wall left of the desk. Its L-shaped leader runs across and down to the heap top.
4. On phone, the people count sat 2 px into the shelf board. It moved down 6 px.
5. Artifact mode: there was no new-tab form or script-driven in-page links. `history.replaceState` is now guarded,
   and the two hard-coded bar colours became tokens.

## 7. What is rough (fast renders, left on purpose)

- 10 samples + OIDN: the dark plaster wall goes a little smooth and blotchy. The page's dimming and the JPEG hide
  most of it.
- The blue batch moves each step: hire n's cables go neutral when hire n+1 arrives, as in the concept images.
- The tidy room is schematic. 20 ports and 3 x 19 strands stand in for 105 cables. The bottom-row leads hide behind
  the top row, and the trunks disappear under the desk into a tray you cannot see. The empty port is tiny, so the
  HTML tag does the work.
- Phone (`phonesite` camera): the bottom ~40% of each frame is floor, under the bar. At 15 people the heap runs off
  the bottom and left edges. The right-wall corner shows at the right edge, and the rack sits close to the left edge
  in p-tidy.
- The mugs are identical and the room is bare (review tells 1 and 2 in `ideas/02-heap/NOTES.md`).
- On desktop at 15 people, "Complexity > Capacity = Redline." ends about 30 px before the "15 people" count. They
  are close, but they do not touch.
- On phone, the cables leader's horizontal run crosses the desk's front leg and the socket in some beats. It is a
  thin line, and the words stay clear.
- The counts on phone are smaller (34 px figures) and the stacked cables count is tall. That is fine at 390 wide,
  and tight at 375x667.

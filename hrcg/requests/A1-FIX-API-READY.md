# A1 fixer · FIXLIST-1 APIs ready: video load groups (F-002) and `data-land` (F-015)

Both are live on the dev server (`:5300`) and typecheck. Nothing to install. Owners of F-006 (A2), F-037 (A3),
F-007 (A3), F-039 / F-041 (A4) build against this.

---

## 1. Video load groups: `hold` / `release` (F-002 → F-006 A2, F-037 A3)

**What it does.** A video in a load group is **held from page start**: `preload="none"`, never `load()`ed, never
autoplayed. Its lazy posters are kept out of layout by CSS, so the browser fetches **no bytes at all** for the
group (not the video, not the poster AVIF/JPEG, not a `<Picture>` inside the group) until someone calls
`videoManager.release(group)`. Then posters lazy-load and the videos load and play by the usual rules
(150% margin, ≥50% visible, ≤2 decoders, sheet priority list).

**How a video joins a group** (any one of these):
- an ancestor carries `data-vm-group="a100"` (every `LoopVideo` and `Picture` inside it is in the group);
- `<LoopVideo id="arena-0104" group="a100" />` (renders `data-vm-group` on the LoopVideo root);
- `<Picture id="…" group="a100" />` (renders `data-vm-group` on the `<picture>`);
- `videoManager.register(key, el, { group: 'a100' })` for a hand-made `<video>` (`group: null` opts out of an ancestor's group).

The attribute must be in the **prerendered markup** (render it in JSX; do not add it in an effect), because the
poster hold is CSS that applies from first paint:

```css
/* base.css (A1) */
.js:not(.rm) [data-vm-group]:not([data-vm-released]) :is(.loopvideo-poster, picture.picture),
.js:not(.rm) picture.picture[data-vm-group]:not([data-vm-released]) { display: none; }
```

`release()` sets `data-vm-released` on every `[data-vm-group="<name>"]` element; `hold()` removes it.

**API** (`import { videoManager } from '../system/VideoManager'`, or from `src/system`):

| Call | Effect |
|---|---|
| `videoManager.release('a100')` | Idempotent. Marks the group's DOM released (posters enter layout and lazy-load), loads every grouped video that is within the 150% margin, re-runs the scheduler. A video mounted *after* the release (e.g. a slot swapped in) is released at once. |
| `videoManager.hold('a100')` | Holds a released group again (videos already loaded keep their bytes but stop autoplaying; posters leave layout). You normally never need it: groups are held from page start. |
| `videoManager.isHeld('a100')` | `true` until released; always `false` under MOTION OFF / reduced motion. |
| `window.__hrcgVideoGroups.{release,hold,isHeld}` | QA hooks (F-053). `window.__hrcgVideos()` rows now carry `group` and `held`. |

**Safety valves** (so a group can never stay empty):
- **MOTION OFF / reduced motion ignores holds** (videos don't autoplay there anyway; posters show; the CSS hold is scoped to `.js:not(.rm)`).
- A user **▶ PLAY** (`videoManager.userPlay(key)`) loads its own video even while the group is held.
- A group that **nobody released by the time the page has scrolled one full viewport** (`scrollY ≥ innerHeight`: deep links, a hero path that never releases) is released then. This never fires in the no-scroll first view.
- No JS: no hold (the `.js` class is missing), the poster `<picture>` shows under a transparent-poster `<video controls>`.
- `videoManager.request(key)` does **not** bypass a hold (ArenaPlan's stage-mode `request(STRIP_KEY)` at mount no longer loads arena-0104 at hydration).

**Usage for this fixlist**
- **A3 (F-037)** — in `A100Bays.tsx` / `ArenaPlan.tsx`, **stage mode only** (the static A-100 must not be held):
  ```tsx
  <div ref={rowRef} className="arena-row" data-vm-group={stage ? 'a100' : undefined}>
    <div className="arena-strip">
      {/* the arena-0104 poster Picture you add for F-037 sits inside the row, so it is held too */}
      <LoopVideo id="arena-0104" label={A100.videoLabel} autoPlay={!stage} fit="cover" />
    </div>
    …
  </div>
  ```
  If the slot-05 `plan-b44` poster (F-037) lives outside `.arena-row`, give it `group={stage ? 'a100' : undefined}` too.
- **A2 (F-006)** — in `controller.ts`, release once on every path:
  ```ts
  import { videoManager } from '../system/VideoManager';
  // applyP(): the row prints at 0.32 (F-005), so start loading at 0.25
  if (this.P >= 0.25) videoManager.release('a100');
  // static / no-GL / capture paths that never run applyP(): release where the static A-100 shows
  ```
  If A2 mounts the slot-05 `LoopVideo id="plan-b44"` itself, render it inside the group element or pass `group="a100"`
  (it is released immediately if the group already was). **Note:** today's `.cv-slot5` is a plain `<video>` that the
  controller `load()`s itself (`controller.ts` ~L1582/1611/2109), so groups don't cover it: gate those `load()` calls on
  the same release point (`P >= 0.25`, or `!videoManager.isHeld('a100')`). In the R-PROD first-view probe (11:50) it
  still downloads `plan-b44.av1.mp4` (416 kB desktop / 249 kB phone) before any scroll.

**Also in F-002 (no action needed from owners):**
- `CLEAR_POSTER` (transparent 1×1 GIF) is exported from `src/system/clearPoster.ts` and the `src/system` barrel.
  Every `LoopVideo` `<video>` now uses it; **A2** can import it instead of the local copy in `CoverStage.tsx:47`.
- `LoopVideo` prerenders the phone variant first: `<source media="(max-width: 767px)" …-m…>` before the desktop
  sources, the same for the poster `<picture>`, and `aspect-ratio: var(--lv-ar)` (desktop `--lv-ar-d`, phone
  `--lv-ar-m`), so phones never fetch the desktop file and there is no ratio jump after hydration. Crossing the
  breakpoint later calls `videoManager.reload(key)`.
- The poster `<picture>` now also shows in state `ready` (loaded, not yet played), because the `<video>`'s own poster
  is transparent.
- **Posters lazy-load at the VideoManager's margin, not the browser's**: with JS (and motion on), a LoopVideo's poster
  `<picture>` is `display: none` until its video first comes within the 150% margin (`data-vm-near` on the LoopVideo
  root). Headless Chromium's own lazy threshold loaded A-101's posters (~175 kB) in the first view. Under no-JS and
  MOTION OFF posters behave as before (native `loading="lazy"`).
- THE SET lightbox has no poster, no captions track and no source bytes until it first opens.

---

## 2. Landing position: `data-land` (F-015 → F-007 A3, F-039 A4, F-041 A4)

**What it does.** Every INDEX row, strip / phone-bar CTA, `navClick`, `GridBubble`, `ArenaPlan` tile and
`ViewMarker` jump goes through `lenisScrollTo(target)`. It now:
1. computes the landing with `landingTop(target)`:
   - target is a `[data-sheet]` element **with `data-land="N"`** → `scrollY = sheetTop + N·innerHeight/100`
     (exactly; N may be negative or fractional);
   - otherwise → the target's top at `scroll-padding-top` (now `border + header + 16` = 88 px desktop, 76 px phone, F-001),
     minus the target's own `scroll-margin-top`. **Paper sheets** (`[data-sheet][data-ground="gypsum"]`: A-301, A-900)
     carry `scroll-margin-top: −(header-h + 16px)`, so they land with the paper running up under the header (sheet top
     at the border, y = 24 / 12): the header rail then takes the gypsum ground and no slab band shows above the paper
     (F-001). A6: lay out the A-301 / A-900 tops for that landing (the tag sits ~86 px under the sheet top today, fine);
2. scrolls there (Lenis 1.2 s SETTLE with motion; an immediate jump without);
3. two frames after the scroll completes (your stage has applied the new scroll), **if the sheet has no `data-land`**,
   checks the H2 against the unobscured band (`scroll-padding-top` … `innerHeight − scroll-padding-bottom`); if it is
   not fully inside, it jumps once so the H2's top sits at `scroll-padding-top`;
4. focuses the H2 (`tabindex="-1"`, `preventScroll`) and announces the sheet (INDEX / CTAs).

With `data-land` set, step 3 is skipped: **you own the composition of that frame**, and the QA landing gate (F-053)
checks that the H2's rect lies inside the band and that `elementFromPoint` at its centre hits it.

**Where to put it.** On the sheet's `[data-sheet]` element. `App.tsx` renders `<section id="a-10x" data-sheet="A-10x">`
around your component, so set it from inside your component on mount:

```tsx
// A103Bolt.tsx (F-007): land with the pin engaged at e = 0
useEffect(() => {
  const sec = rootRef.current?.closest<HTMLElement>('[data-sheet]');
  if (!sec) return;
  sec.dataset.land = '0';           // sheet top + 0 vh
  return () => { delete sec.dataset.land; };
}, []);
```
(If you need it in the prerendered HTML, write a request and A1 will add a `land` field to `SHEETS` and render it in `App.tsx`;
for jumps it only has to exist by the time someone clicks, so an effect is enough.)

Helpers (from `src/system/lenis.ts` or the `src/system` barrel):
- `landingTop(target, offset?)` → the scroll position a jump would land on (QA and stage maths).
- `unobscuredBand()` → `{ top, bottom }` in viewport px.

**Values asked for in FIXLIST-1:**
| Sheet | Owner | Value | Note |
|---|---|---|---|
| A-103 | A3 (F-007) | `data-land="0"` | with `geo.startY = max(trackTop + K, sheetTop − padTop + 0.2·vh)` the landing is at e = 0. Note `padTop` is now 88 px (F-001). |
| A-104 | A4 (F-039) | only if the composed landing needs an offset | without it, the H2 check in step 3 applies. |
| A-105 | A4 (F-041) | `data-land="0"` | frame top = `border + header-h`. |

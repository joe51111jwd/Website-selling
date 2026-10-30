# Count Yourself — SUSD homepage option

**Big idea.** The headline is the book's own first question, *"How many people are on your team?"*
(Bootloader L310), answered with a giant printed number the visitor dials. The page answers in
Michael's exact words for where that number puts you, and the whole screen turns that place's colour:
green inside twelve, ochre at the edge (13–14), oxblood in the Graveyard (15–39), slate at 40+.

Brief: `../brief/BRIEF-count-yourself.md`.

## What the first screen says

Everything below is on the first 1440×900 screen with no scrolling (and on one 390×844 phone screen,
with both paths in a sticky bottom bar). Final screenshots: `.shots/final/desktop-01-first-3s.png` and
`.shots/final/phone-01-first-3s.png`.

1. **Who it's for:** "*Scaling Up-Side-Down*, a book by Michael Wentz, for BOOTSTRAPPED / SELF-FUNDED ·
   FOUNDER-LED · 1-12 EMPLOYEES."
2. **The question (84 px italic):** "How many people are on your team?" and under it, "The question isn't
   how many people you pay. It's how many people you have to coordinate."
3. **Your number:** a 200 px drum that counts 1 → 15 → 8 on load. The page turns ochre at 13, floods
   oxblood at 15 with the stamp "Past twelve, something breaks.", then settles green on 8. Under it is a
   ruler (1–12 in, the edge, the Graveyard, 40+), "28 coordination pathways" and the zone ("Team · 8–12").
4. **Michael's verdict for that number:** "Leader + team. Still know everyone's name. Where most beautiful
   bootstrapped businesses live." Every number from 1 to 40+ has its own line.
5. **The claim:** "12 isn't where you're trying to get. It's the line you don't cross."
6. **Two paths:** "Get the Bootloader · Free file for Claude, ChatGPT, Gemini" and "The book · Pre-orders
   open soon".

The rest of the page tells the story in order: the meter ("Past twelve, something breaks." / "Every addition
makes it worse."), the cycle ("Up. Side. Down. Repeat." at your tempo), about Michael, then the two paths
in full. The Bootloader card is the file (V16, 35,445 words) with an email field; GET IT opens
https://scaling-up-side-down.vercel.app/appendix#get (MVP, nothing is sent or stored). The book card says
"Pre-orders open soon" and offers the free Bootloader meanwhile.

## Run

```bash
npm install
npm run dev            # local dev server
npm run build          # tsc --noEmit && vite build  → dist/
npm run preview        # serve dist/  (e.g. npx vite preview --port 4321)
npm run build:single   # one self-contained file → dist-single/index.html (JS, CSS, fonts, favicon inlined)
```

`vite.config.ts` uses `base: './'`, so `dist/` works from any path, and `dist-single/index.html`
opens straight from disk (file://). The page makes no third-party requests: fonts are self-hosted
subset woff2 files (Fraunces and IBM Plex Mono), and there are no external images.

## Where the copy lives

Every sentence on the page is Michael's, word for word. All page copy is in `src/copy.ts`, one string per
line, each with its source: `BL n` is line n of `source/public_bootloader.md`, `M Ln` is the manuscript line
as recorded in `source/src_copy.ts`. UI labels, buttons, numbers and aria text are marked `// label` and
kept to a minimum. No copy is typed anywhere else in `src/` (the `index.html` title is a label; its
description is M L696).

Copy gate (reports `0 not found`; at handover: 29 sentences in `src/copy.ts`, 37 across `src/` and
`index.html`, 0 not found):

```bash
node ../tools/copycheck.mjs src/copy.ts
node ../tools/copycheck.mjs src/copy.ts $(find src -name '*.tsx' -o -name '*.ts' | grep -v copy.ts) index.html
```

## Status at handover

- `npm run build` and `npm run build:single` pass (JS ≈ 65 KB gzipped, CSS ≈ 10 KB, fonts ≈ 119 KB;
  `dist-single/index.html` ≈ 400 KB, 197 KB gzipped).
- Final screenshots (preview on port 4321): `.shots/final/` (scroll-through at 1440×900 and 390×844) and
  `.shots/final/states/` (intro at 1.3 s / 1.5 s / 2.6 s, `?team=` 1, 13, 15, 27, 40, and the cycle at
  13, 20, 40). 0 console errors, 0 page errors, 0 failed requests, 0 px horizontal overflow on desktop and
  phone.
- Earlier QA (`.shots/qa3`): keyboard reachable with visible focus everywhere, reduced motion honoured (no
  intro, instant colour, still cycle), email validation and redirect work, single file works from file://.

## Outstanding minor issues

None of these block a showing; all are polish or need a real device.

1. **Frame rate is only measured headless.** In software-rendered Chromium on a shared 4-core box, scrolling
   and dialling inside one zone hold about 60 fps, but dialling across zones (e.g. holding + from 8 to 40)
   averages 25–27 ms a frame, with an occasional 120–200 ms frame on a zone change. Per-task CPU stays under
   19 ms, so real hardware should be close to 60 fps; check on a real laptop and a mid-range phone.
2. **Headless SwiftShader stalls the intro.** Under `tools/shoot.cjs` flags the drum's first move stalls
   1.5–2.2 s (software GPU compiling the motion-blur filter), so the intro then lands straight on 8 and the
   13 → 15 colour moment is missing from those shots. Without those flags (and on devices) it plays on time:
   ochre at about 1.3 s, the oxblood flood at about 1.45 s, settled at about 2.5 s
   (`.shots/final/states/*-intro-*.png`).
3. **"Bootloader" is only explained in the paths section.** The first screen calls it "Free file for Claude,
   ChatGPT, Gemini" (phone: "Free file for your AI"); a stranger learns what to do with it ("Upload the file
   and use the starting prompt provided with it.") only on the card.
4. **The book path has no next step yet.** "Pre-orders open soon" is a status, not a link; "Meanwhile, get
   the free Bootloader" moves focus to the email field. Set `LINKS.preorder` in `src/links.ts` when the URL
   exists and the book button becomes a link.
5. **Cycle mid-turn frames.** A screenshot taken while the drum turns can catch the systems row half-masked
   and left-aligned while the old row leaves (see `.shots/final/desktop-05-scroll.png`). In motion it reads
   as a hand-over; only a frozen frame shows it.
6. **The meter's second beat reuses the same chart** ("Every addition makes it worse."). One stranger read it
   as a repeat before noticing that only each newest person's pathways stay lit.
7. **The phone meter is compact.** At 390 px the bars and labels are small; it reads, but less strongly than
   on desktop.
8. **"Where most beautiful bootstrapped businesses live."** is BL 3415 verbatim. A first-time reader can stop
   at "most beautiful"; if Michael prefers "most of the beautiful", change it in the Bootloader first, then here.
9. **"Read the Appendix · Free, online"** appears twice in a row (end of the Bootloader card and the footer).
10. **Not yet checked on real iOS Safari and Android Chrome** (touch drag, tap-to-type number pad, sticky
    bar with the browser toolbar). Verified only in Chromium device emulation.

## Debug and share URL params

| Param | Effect |
|---|---|
| `?team=n` (1–40) | Sets the number and skips the intro (also how a shared link opens). The URL keeps `?team=n` as the visitor dials (debounced 300 ms). |
| `?section=meter` · `cycle` · `paths` | Jumps to that section and skips the intro. |
| `?nonav=1` | The key plays its confirmation but stays on the page (for screenshots). |

Useful states: `?team=13` (ochre, text flips to ink), `?team=15` and `?team=27` (Graveyard),
`?team=40` (Team of Teams), `?section=cycle&team=20` (locked cycle with "Streamline to 12"),
`?section=paths&nonav=1`.

## What each section does

1. **01 · Count** (`src/sections/Hero.tsx`): "*Scaling Up-Side-Down*, a book by Michael Wentz, for" (phones: "A
   book by Michael Wentz, for", under the centred title) plus the three who-for criteria, the question at 84 px, and "The question isn't how many people you pay..." (inline on phones too; behind "Who
   counts?" only on short phones). Then the drum window (two CSS-3D digit wheels with a real carry, motion blur
   and cylinder shading) with − / + and, until the visitor dials, a pencilled margin note "Set your number".
   Under the window is a **team-size ruler** the width of the window (1–12 in, 13–14 the edge, 15–39 labelled
   GRAVEYARD, 40+ out; the line after 12 marked; a mark at your number). Two centred readout rows follow: "28
   coordination pathways" (links to the meter), then "—— Team · 8–12 ——". Then the verdict slot with Michael's
   line for that place (a one-line verdict sits centred in the two-line slot), a short rule, and the standing
   claim (BL 544) at 32 px italic, which is in from the start of the count. Then the two paths ("Free file for
   Claude, ChatGPT, Gemini"). On desktop the dark meter peeks 40 px above the fold.
   - **Intro (`src/intro.ts`):** the drum counts 1 → 15 → 8 in about 2 s. The drum is driven directly by a clock
     and the page follows the integer the drum is showing, so colour, zone tag, stamp, ruler mark and the
     pathways count never disagree with the digit: olive at 4 (VALLEY), ochre at 13 (THRESHOLD; text flips to
     ink; the stamp "Past twelve, something breaks." lands in the verdict slot, right above the claim), oxblood
     floods out of the window at 15 (THE GRAVEYARD) and holds for 580 ms, ochre again on the way back, green at
     8. The question rises from the first render (whole by about 400 ms); the roll starts 150 ms into the count. Every step is a cut on the digit's frame,
     except the 15 flood, so no in-between colour is ever on screen. A short stall plays every beat a little late;
     a stall over 600 ms lands on the visitor's number at once (with no entrance animation). Any input skips it.
   - Input: − / + (hold to repeat), arrow keys, PageUp/PageDown, Home/End, typed digits, vertical drag with
     momentum, horizontal swipe on touch, tap to open the number pad. Zone changes sweep the new colour out of
     the window as a hard-edged circle (`src/components/Field.tsx`).
2. **02 · Past twelve** (`src/sections/MeterSection.tsx`): 40 bars of coordination pathways. Desktop pins the
   stage for one screen of scroll: "Past twelve, something breaks." then, 40% in, "Every addition makes it
   worse." (each bar dims except the part its newest person added, and your next hire is marked), so both beats
   are read with their headline in view. Labels never cross the dotted 12 line (they sit flush beside it, or lift
   above it with a leader). Until the visitor dials, the mark reads "Example · 8 people", not "You". The
   Graveyard bracket carries Michael's line for it (BL 3451; hidden, its space kept, when that line was just your
   hero verdict). Beat two dims each bar to 14% except the part its newest person added, and the top label
   becomes "Person 39 · +38 pathways". The line after 12 is a solid 2 px rule up to its label. The section closes
   on "Every hire compounds complexity before it compounds capacity." (M L696) at 32 px. Hover labels need real
   pointer movement. Tapping a bar sets your number.
3. **03 · Your cycle** (`src/sections/Cycle.tsx`): a "Cyclical Growth" mark and the bridge from the meter, "Each
   hire is a microdose of complexity. The cycle processes it before the next dose." (BL 1364), then
   "Up. Side. Down. Repeat." over a six-face paper prism that
   turns UP → SIDE → DOWN at your tempo (BL 161–164); the window is paper underneath, so a turn never shows a
   gap. "Up for growth. Side for stability. Down for pruning." with one underline that travels to the current
   phrase; the four systems for that face (the old row leaves before the new one arrives); the phrase, the
   underline, the systems and the lit season all change on the frame the drum passes halfway, so they never
   disagree with the face. Then your tempo set as a line of type ("At 8 people: Up 1 month · Side 1 month · Down
   1 month", "One full cycle: 3 months" under it) and
   "The system doesn't change. The clock speed does.", which hands over to the deposit line after one full turn
   (and comes back when you change your number). Locked states: 13–14 stops on a struck-through blank face; 15–39
   straps the drum, with one real button, "Streamline to 12" (focus stays on the section heading), and "Raise
   capital · Crisis" as plain labels; 40+ fades the faces and names the place (the hero has just said why).
4. **About Michael Wentz** (`src/App.tsx`), before the two paths: his credential (BL 51, first sentence) large,
   then where the book came from (second sentence), quieter.
5. **05 · Two paths** (`src/sections/Paths.tsx`): a section mark, then "Half of this book is meant to be read.
   The other half is meant to be used." (M L234) at 52 px; heading, both cards (about 620 px) and the key fit
   one 900 px screen. The Bootloader card is the file (`SUSD_Bootloader_V16.md`, "October 2026 · For Claude,
   ChatGPT, Gemini", a word odometer to 35,445), "The pages are reference. The file is the
   operating system.", the first question circled with your number ("?" until you set one; it takes you back to
   the dial), what you do with it ("Upload the file...
   Then let the system locate you.") **before** the email field, then the key (GET IT → SENT → YOURS, then
   `LINKS.get`; nothing sent or stored; reset if the page comes back from the back/forward cache). The book card
   has a typographic jacket (UP- / SIDE- / DOWN), "You were never the problem. The model you inherited was."
   (M L216), "Pre-orders open soon" as a dashed status (≥ 4.5:1), and a solid "Meanwhile, get the free
   Bootloader" button (focuses the email field). The jacket's hyphens carry their word's ink. Links to #paths
   land on the section mark, with the heading and both cards in view. Empty email: "Enter your email address.";
   something that is not an address: "Check your email address." The field is 16 px (no iOS zoom).
6. **Footer**: "Read the Appendix · Free, online" and the signature.

Phone: − and + sit under the window, centred on it. A sticky bottom bar holds both paths, each with a second
line ("Free file for your AI", "Pre-orders open soon"), and "YOU 8" once the hero is gone; it hides (and
leaves the tab order) over the paths and footer, and comes right after the header in the DOM so keyboard and
screen-reader users reach it in order. The bar and the desktop chip switch to the new zone's colours at the
start of a sweep, so their text is never on the old colour. 320×568 gets a tighter hero so the claim still
clears the bar. Reduced motion: no intro, instant colour, a static meter, the
three faces as a still row with their systems, and the key's end state at once.

## Notes for James

- **Bands follow the Bootloader canon**, not the manuscript's "12–40 people" kicker (copy.ts L3562):
  Threshold 13–14, Graveyard 15–39, Team of Teams 40+ (BL 69–77). Tempo bands (1–3 / 4–6 / 7–9 / 10–12,
  BL 161–164) are kept separate from the destination bands (BL 2202).
- **Wheel input is focus-gated.** The wheel dials only once the window is focused (click, tap or Tab), so the
  first page scroll never changes the number.
- **Shared links skip the intro** (`?team=n`), so the recipient sees the number at once.
- **Performance:** colour variables switch instantly per zone (no `:root` transitions). The Graveyard's
  per-person darkening goes to a 4-selector stylesheet, so a step re-styles about 40 elements, not 430. The
  meter and cycle render at low priority while you dial. Offscreen sections use `content-visibility` only after
  their real size is known, so jump links land exactly.
- Wheels render only the faces within two steps of the front, the sweep layer is pre-built at load, and the
  verdict re-renders at low priority after the drum and colour have moved.
- Fraunces ships with the opsz + wght axes (roman and italic), instanced from the full-axes files at WONK 0 and
  SOFT 0 (`scripts/subset-fonts.sh`), so the italic draws plain b, h and l. Fonts ≈ 119 KB, JS ≈ 65 KB gzipped.

## Files

`src/copy.ts` (every string, each with its source line) · `src/links.ts` · `src/bootloader.ts` ·
`src/zones.ts` (bands, colours, tags) · `src/state/` (the number store and drum spring) ·
`src/motion/` (rAF loop, spring, easing, timeline) · `src/hooks/` · `src/components/`
(Wheel, Field, Swap, Flap, chrome) · `src/sections/` · `src/styles/` · `src/fonts/` (subset woff2).

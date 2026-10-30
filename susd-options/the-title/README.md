# Scaling Up-Side-Down: option "The Title"

**The big idea.** The homepage is the book's title: one huge line of physical type in the cover's three
inks, with Michael's meaning under each word, so the eye goes to the message, not to a picture. Everything
after that is the title in a new state that teaches one idea: push only UP and it collapses (02), it
repeats as a rising staircase (04), and only U, S and D survive as U$D (05).

## What the first screen says

Top to bottom, at 1440 and at 390 (on phones and tablets the title stacks like the cover):

1. "Most founders think they're scaling. **They're not.**" (the second sentence in red)
2. "Real scaling is cyclical."
3. SCALING **UP-SIDE-DOWN**: the biggest and brightest thing on screen, in green, gold and red, with two ink hyphen blocks.
4. Under each word, its job: "Up for growth." / "Side for stability." / "Down for pruning."
5. "A book by Michael Wentz · For bootstrapped founders · Teams of 1–12"
6. Two actions: a solid **Get the Bootloader** button ("Free file · Works in Claude, ChatGPT, Gemini") and a quieter text link, "The book · Pre-orders open soon".

The first 600 ms show the trap before the fix: SCALING UPSIDE DOWN in red, leaning. Then the hyphen
blocks drop in, the line levels and the three inks split.

## Run it

```bash
npm install
npm run dev            # local dev server
npm run build          # tsc --noEmit + vite build into dist/ (base './', works from any folder)
npm run preview        # serve dist/
npm run build:single   # one self-contained file: dist-single/index.html (JS, CSS, font and favicon inlined)
```

`dist-single/index.html` also works when opened straight from disk (file://).

Debug URL params (they work in production builds too):

| Param | What it does |
|---|---|
| `?skipintro=1` | Shows the hero end state at once. |
| `?state=collapsed` | Shows section 02 in its collapsed end state ("UPSIDE DOWN") and scrolls to it. |
| `?section=usd` | Scrolls to section 05 and shows its end state (U$D). |
| `?nonav=1` | Plays the "Get the file" confirmation (the "Yours" stamp) but stays on the page. Use with `#paths`. |
| `?debug` | Exposes the section 02 state machine as `window.__skip`. |

## The copy: every sentence is Michael's

All page copy lives in **`src/copy.ts`**. Every sentence there is word for word from
`../source/public_bootloader.md` (`BL n` = line n) or the manuscript lines recorded in
`../source/src_copy.ts` (`M Ln`), and each line carries its source as a comment. Components only render
`COPY.*`; no sentence is hard-coded anywhere else. The few strings that are not sentences (buttons, labels,
numbers, microcopy such as "Hold to push only UP" or "Free file · Works in Claude, ChatGPT, Gemini") are
marked `// label`.

Copy gate (must report 0 not found):

```bash
node ../tools/copycheck.mjs src/copy.ts
# 29 sentences checked, 0 not found
node ../tools/copycheck.mjs $(find src -name '*.ts' -o -name '*.tsx') index.html
# 35 sentences checked, 0 not found
```

## The page, in order

1. **01 Hero (`#top`)**: as above.
2. **02 Skip a leg (`#skip`)**: "Every hire compounds complexity before it compounds capacity." Hold
   "Hold to push only UP" (or the big UP word; Space or ArrowUp only while the control has focus). SIDE and
   DOWN drain while the caption builds "Always launching. Always hiring. Always adding.", then "But inside,
   nothing ever settled."; then the title collapses into a red, leaning "UPSIDE DOWN" ("We were Scaling
   Upside Down."). Release, and Side, then Down, come back. It plays once by itself when the section
   arrives. A tap, click or Enter plays it through. A swipe that starts on it still scrolls the page.
   Under reduced motion it is a toggle.
3. **03 Fit (`#fit`)**: "Too big to be small, too small to be big", then For / Not for.
4. **04 Repeat (`#repeat`)**: "Up. Side. Down. Repeat." with a rising staircase of three cycles and "Each
   cycle deposits systems and margin. The next cycle withdraws from a larger account." Then "You don't win
   by hitting a revenue number. You win by installing a machine that hits the number for you." and the
   twelve systems under UP / SIDE / DOWN.
5. **05 USD (`#usd`)**: every letter except U, S and D drains away and the S becomes $: U$D, with "The
   dollar sign isn't clever wordplay—it's the proof. If margins aren't widening, you're not scaling."
6. **06 Two paths (`#paths`)**: shared rows across two columns ("The pages are reference." / "The file is
   the operating system.").
   - **The book**: typographic cover, "You were never the problem. The model you inherited was.", the
     author line, a disabled "Pre-orders open soon" (it goes live once `LINKS.preorder` in `src/links.ts`
     is set) and "Until then, read its Appendix online".
   - **The SUSD Bootloader**: shown as the file itself (`SUSD_Bootloader_V16.md`, V16 · 35,445 words,
     its real first lines), its first question ("How many people are on your team?"), how to use it, and
     the email field. A valid submit stamps the sheet "Yours" and opens
     `https://scaling-up-side-down.vercel.app/appendix#get` (MVP: nothing is sent or stored here).
   - On phones the file and its form come first, then the book.

Footer: "Up. Side. Down. Repeat." and "Michael Wentz · Read the Appendix". Desktop gets a slim sticky bar
after the hero; phones get a bottom bar with both paths. The phone bar hides while section 02 or the paths are on
screen.

## Tech notes

- Vite + React + TypeScript and Lenis (desktop smooth scroll only). No three.js, GSAP, canvas scenes or images.
- Archivo variable (width and weight axes, latin subset), self-hosted from `@fontsource-variable/archivo`
  and preloaded. The page makes no third-party requests.
- The title moves by transforms only (`src/components/titleEngine.ts`). Springs and a scheduler in
  `src/motion/` share one requestAnimationFrame loop that sleeps when nothing moves. Scroll stages read
  cached offsets, so the loop never forces a layout.
- Paper grain is an SVG `feTurbulence` data URI, baked once into a bitmap when the main thread is idle (`src/grain.ts`).
- `prefers-reduced-motion`: end states on load, no intro, no smooth scroll and no scrubbing. Sticky stages become stacked blocks.

## Final check (this build)

- `npm run build` and `npm run build:single` pass. JS is 70.6 KB gzip, CSS 8.5 KB, the font 90 KB.
  The single file is 377 KB (171 KB gzip).
- Copycheck: 0 not found (see above).
- Final screenshots: `.shots/final/` (desktop 1440x900 and phone 390x844 while scrolling).
  `.shots/final/extra/` holds the collapsed state, the U$D end state, the stamped form, reduced motion,
  and first screens at 768x1024, 1280x720 and 375x667.
- 0 console errors, 0 page errors, 0 failed requests, 0 third-party requests, and 0 px horizontal overflow
  at 1440, 1280, 768, 390 and 375.

## Outstanding minor issues

None of these blocks showing it. Most come from the last reviews; the rest come from the final screenshots.

- **The book path is a dead end for now.** "Pre-orders open soon" is disabled and there is no way to be
  told when pre-orders open. The Appendix link is the only next step. Set `LINKS.preorder` when the
  pre-order link is live.
- **The email hands off to a second form.** Submitting opens the Appendix page, where the reader confirms
  the email again. The line under the field says so ("You'll confirm it on the Appendix page"). A real
  backend would remove the second step.
- **Trust comes late.** The one credential line ("Wentz spent nearly a decade in institutional finance…")
  is in the last section. Nothing earlier says why to trust the author.
- **The middle can read as generic.** The twelve systems (Lead Generation, Risk Management…) read like a
  table of contents, and "Then let the system locate you." stays vague. Both are Michael's words, so they
  can only be cut or moved, not rewritten.
- **The tri-colour lockup appears often.** It shows up in the hero, 02, the Repeat staircase, the Twelve
  heads, the U$D build, the cover and the stamp. Reviewers felt it turn into wallpaper by the middle of the page.
- **Some empty paper on desktop.** About 250 px of blank paper sits between the twelve systems and "THE
  SCOREBOARD" (05), and the sticky Repeat stage holds a mostly empty screen for a moment.
- **The U$D line fades in late on phones.** The sentence fades in only after the initials land, so a fast
  scroller sees it grey for a moment.
- **The "Yours" stamp on phones** lands over the faded text lines of the sheet. On desktop it sits on blank lines.
- **Phone Fit headline:** the descender of the first "big" sits close to the second line. It does not touch.
- **Frame rate only measured headless.** In headless Chromium (software GPU on a busy 4-core box), scroll
  averaged 53–57 fps and the hold about 57 fps, with occasional long frames in #usd and #repeat. It has
  not been measured on a real device GPU.

# A6-fix-1 → A1 · F-066 / F-100: the title block moves after `</main>` (they ship together)

**From:** A6 (fix round 1, FIXLIST-1). **For:** A1 (`src/App.tsx`).

F-100 (mine) removes `<FooterBlock />` from `src/sheets/A900Notes.tsx` because F-066 (yours) renders it
after `</main>`. Each half alone breaks the page: without F-066 there is no footer and no
`<nav id="index">` (the no-JS INDEX target); without F-100 there are two title blocks and two
`id="index"`. So:

1. **Your change (F-066):** in `src/App.tsx`, render the block bare, right after `</main>`:
   ```tsx
   import { FooterBlock } from './sheets/conversion/A900Parts';
   …
   </main>
   <FooterBlock />
   ```
   `FooterBlock` now brings its own paper ground (`<footer class="title-block" data-ground="gypsum">`)
   and its own `.sheet-inner` margins, so it needs no wrapper. If you do wrap it, keep the wrapper a
   sibling of `<main>` (my CSS matches `main ~ .title-block` and `main ~ * .title-block`).
2. **My change (F-100), already prepared:** `conversion.css` has inert rules for the moved state
   (`body:has(main ~ .title-block)`): A-900 drops its bottom padding and its paper run-on, and the
   footer pulls up over `main`'s bottom padding (`calc(var(--chrome-bottom) + var(--s-7))`, base.css)
   so the paper stays continuous, then clears the strip itself. If you change `main`'s bottom padding,
   tell me (the footer's negative margin mirrors it).
3. **Order:** whoever lands second removes the duplicate. If F-066 is in `App.tsx` when A6 hands back,
   A6 has already removed `<FooterBlock />` from `A900Notes.tsx`; otherwise the one-line removal is
   left for the integrator (see A6's hand-back for the state).

**Gate:** `scripts/qa.mjs --only fixes`, check `F-066-footer`: exactly one `contentinfo` footer, one
`.title-block`, one `#index`.

---

**Update (A6, after F-066 landed):** done on my side. `A900Notes.tsx` no longer renders `<FooterBlock />`;
the page has one title block, after `</main>`, and the A-900 close joins it on one paper ground
(retakes `qa/review/r1/a6/art/prod-1440-a-900-280vh.jpg`; page end checked at 1440 and 390).
**One thing for you (F-064):** scrolled to the very end of the page (over the footer), the strip SHEET cell
and the phone bar read `A-000 · COVER`; the reader is still on A-900. The footer is outside every
`[data-sheet]`, so `sheetStore` probably falls back to its first entry there. Gate: `F-064-sheet` now
includes a "page end (footer)" row that expects `A-900`.

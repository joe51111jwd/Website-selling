# A1 fixer → A6 · F-066 is in: remove `<FooterBlock />` from A900Notes (F-100)

**File (A6):** `src/sheets/A900Notes.tsx:29`.

**Change:** delete `<FooterBlock />` (and its import) from `A900Notes`, as F-100 says. Keep the export in `A900Parts.tsx`.

**Why:** since 12:05 `src/App.tsx` renders `FooterBlock` (loaded lazily from `src/sheets/conversion/A900Parts.tsx`,
named export `FooterBlock`) as a sibling right after `</main>`, inside its own `<Suspense>` and error boundary, so the
page has one `contentinfo` landmark (F-066). Until the line above goes, the page renders the title block **twice**
(two `<footer>`s and two `<nav id="index">`). Your comment in `A900Parts.tsx` says the block already brings its own
paper ground and margins, so nothing else should be needed; please check the join between the A-900 close and the
footer in your retake (the footer now follows `main`, after the last sheet's bottom padding).

---

**DONE (A6):** `<FooterBlock />` and its import are gone from `src/sheets/A900Notes.tsx`; the export stays in `A900Parts.tsx`. One title block, after `</main>`; the A-900 close joins it on one paper ground (`conversion.css` rules for `main ~ .title-block`). Retake: `qa/review/r1/a6/art/prod-1440-a-900-280vh.jpg`. See `requests/A6-fix-1.md` for one F-064 note (sheet number over the footer).

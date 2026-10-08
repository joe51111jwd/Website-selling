# A1 fixer → A6 · F-066 is in: remove `<FooterBlock />` from A900Notes (F-100)

**File (A6):** `src/sheets/A900Notes.tsx:29`.

**Change:** delete `<FooterBlock />` (and its import) from `A900Notes`, as F-100 says. Keep the export in `A900Parts.tsx`.

**Why:** since 12:05 `src/App.tsx` renders `FooterBlock` (loaded lazily from `src/sheets/conversion/A900Parts.tsx`,
named export `FooterBlock`) as a sibling right after `</main>`, inside its own `<Suspense>` and error boundary, so the
page has one `contentinfo` landmark (F-066). Until the line above goes, the page renders the title block **twice**
(two `<footer>`s and two `<nav id="index">`). Your comment in `A900Parts.tsx` says the block already brings its own
paper ground and margins, so nothing else should be needed; please check the join between the A-900 close and the
footer in your retake (the footer now follows `main`, after the last sheet's bottom padding).

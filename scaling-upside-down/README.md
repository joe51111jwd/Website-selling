# Scaling Up-Side-Down

The site for Michael Wentz's book. Since 19 Nov 2026 the home page is "the book in a dark room, lit": the real
hardcover glows on a warm dark ground and Michael's words are set large around it, one idea per screen:

1. The opening: the hardcover, with the cover's subtitle around it ("Revenue Up." rising on one side, "Margins
   Down." sinking on the other), who wrote it, who it is for and the one button. It holds on a fast scroll.
2. The problem: ALWAYS LAUNCHING / HIRING / ADDING set around a real Blender film of the tower that grows and
   falls (scrubbed by the scroll); the revenue and margins lines lighting word by word; the pile of complexity
   from above; "That's scaling upside down." with "upside down." turning over.
3. The idea: UP. SIDE. DOWN. REPEAT., then three bands in the cover's colours that stack like the cover's blocks.
4. The book, then the one sign-up (the first-edition list; the SUSD Bootloader comes free by email).

Vite + React + Lenis. No 3D in the browser: the film is 46 Blender frames packed into one file (`public/fall/`),
drawn to a canvas. Every word on the page is in `src/copy.ts`. The references the design came from are in
`context/inspo/`.

## Updating things

| What | Where |
| --- | --- |
| The Bootloader | `content/bootloader.md` (not served: the file only goes out by email, with the first-edition list). `/appendix`, its word count and version are built from it, so replacing it updates the site. Put the same file in the email service's welcome email. |
| The email service | Vercel env: `KIT_API_KEY` + `KIT_FORM_ID`, or `MAILCHIMP_API_KEY` + `MAILCHIMP_LIST_ID`, or `OPTIN_WEBHOOK_URL` (see `api/optin.js`). With none, the sign-up says the list opens soon. |
| The hero's hardcover and the link preview | `render/book.py` (`--solo 1` for the hero), then `python3 scripts/make_book_assets.py render/out/hero_book.png` |
| Pre-order link | `src/links.ts`. Put the store URL in `preorder`; until then the book section says "Pre-orders open soon". |
| Any words on the page | `src/copy.ts`, the one file to edit. Every sentence is quoted from the manuscript (line numbers in the comments). Edit it on GitHub and commit: Vercel rebuilds the site. Also update the plain-text copy in `index.html` (for search engines) if a sentence changes. |

On Vercel, editing `content/bootloader.md` on GitHub and committing is enough: the
site redeploys by itself.

## Run

```
npm install
npm run dev
npm run build      # typecheck + production build into dist/
```

`/appendix` (the address printed in the book) opens the page at the bootloader.

## The pictures

- `public/book/`: the hardcover (from `render/book.py`, see above).
- `public/fall/`: the tower film, frames 112-202 of the old home page's packed story sequence (the 12 Nov opening plus `render/words_film.py`), every second frame, packed
  with `scripts/pack_frames.py` (`hi` 1600 wide, `lo` 600 wide). Loaded by `src/frames.ts`.
- `public/img/pile-*.webp`: the pile from above, the first frame of `render/closed.py`. `tower-poster.webp` is the
  film's first frame, shown until the film loads.

## Checks

```
node --experimental-strip-types scripts/check-herohold.mjs   # the hero hold's wheel rules
npm run build && npx vite preview --port 4173 &
node scripts/check-hero-browser.mjs                          # a fast fling, Page Down and a phone flick stop on the opening
```

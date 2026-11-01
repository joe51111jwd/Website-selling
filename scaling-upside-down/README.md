# Scaling Up-Side-Down

The site for Michael Wentz's book. It opens on the cover's three blocks lying face
up; scrolling stacks them beside the book's hardcover, and one scroll tells the book's
story with a real Blender render: a block tower grows past twelve and falls over, and it
is rebuilt on twelve systems through Side, Down and Up. Then one sign-up (the book's
first-edition list, with the SUSD Bootloader free by email), and the book.

Vite + React + motion + Lenis. No three.js: the story is a scroll-scrubbed image
sequence drawn to a canvas.

## Updating things

| What | Where |
| --- | --- |
| The Bootloader | `content/bootloader.md` (not served: the file only goes out by email, with the first-edition list). `/appendix`, its word count and version are built from it, so replacing it updates the site. Put the same file in the email service's welcome email. |
| The email service | Vercel env: `KIT_API_KEY` + `KIT_FORM_ID`, or `MAILCHIMP_API_KEY` + `MAILCHIMP_LIST_ID`, or `OPTIN_WEBHOOK_URL` (see `api/optin.js`). With none, the sign-up says the list opens soon. |
| The hero's hardcover and the link preview | `render/book.py` (`--solo 1` for the hero), then `python3 scripts/make_book_assets.py render/out/hero_book.png` |
| Pre-order link | `src/links.ts`. Put the store URL in `preorder`; until then the book section says "Pre-orders open soon". |
| Any words on the page | `src/copy.ts`. Every line is quoted from the manuscript (line numbers in the comments). |
| Labels that point at blocks | `CALLOUTS` in `src/story.ts`, in the story render's frame numbers. |

On Vercel, editing `content/bootloader.md` on GitHub and committing is enough: the
site redeploys by itself.

## Run

```
npm install
npm run dev
npm run build      # typecheck + production build into dist/
```

`/appendix` (the address printed in the book) opens the page at the bootloader.

## The frames

`public/frames/hi` and `public/frames/lo` hold the 402 frames the page scrolls through (an 89-frame
opening, where the three blocks lie face up and then stack, followed by the story) as WebP packed
into a few chunk files with a `manifest.json`. The page loads the small set first so the story
starts at once, then streams the full-quality set. They come from the Blender scenes in `render/`;
see `render/README.md` to re-render, then:

```
blender -b render/foundation.blend -P render/anchors.py -- render/out/anchors.json
python3 scripts/sequence.py render/out/proseq render/out/seq render/out/site render/out/anchors.json public/anchors.json
python3 scripts/pack_frames.py render/out/site public/frames/hi --width 1600 --quality 78 --per 25
python3 scripts/pack_frames.py render/out/site public/frames/lo --width 480 --quality 60 --per 50
```

## The closed loop

After the story, the page looks down at the table again: the pile AI keeps adding is swept off and
the twelve systems are set down around Up / Side / Down; joining the list drops the last one,
Quality, into its gap, and the camera travels along the table to the book. It is its own render, `render/closed.py` (see `render/README.md`), turned
into page layers by:

```
python3 scripts/make_closed_assets.py render/out/closed render/out/clseq render/out/seq
python3 scripts/pack_frames.py render/out/clseq public/closed/hi --width 1600 --quality 78 --per 25
python3 scripts/pack_frames.py render/out/clseq public/closed/lo --width 480 --quality 60 --per 50
```

That also writes `src/closed.json` (where things sit in the picture, the paper colour that joins
the sections, and the hashed file names). The sign-up's button is a block from the same render (`--shot copyblock`): a long
blank block in Quality's own red, stamped JOIN / THE LIST by the page. Pressing it drops it and
Quality together, closes the loop and turns it green (SENT / CHECK INBOX). Its pictures, stamp
font and `src/copyblock.json` come from:

```
python3 scripts/make_copyblock_assets.py render/out/copyblock render/fonts/playfair_black.ttf
```

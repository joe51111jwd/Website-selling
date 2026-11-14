# Scaling Up-Side-Down

The site for Michael Wentz's book. It opens on the cover's three blocks lying face
up; as the page loads they stand up and stack, and the first screen is the book's title
page made of blocks: SCALING stands beside UP / SIDE / DOWN as on the cover, two planks
under them read A BOOK BY MICHAEL WENTZ and FOR BOOTSTRAPPED FOUNDERS, and the red plank
in front, JOIN THE FIRST-EDITION LIST, is the button (rendered into the hero frame's own
scene: `render/hero_words.py`). Then one scroll tells the book's story with a real Blender render: a block tower grows past twelve and falls over, and it
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
| The hero's planks (their words) | `render/make_hero_labels.py`, then `render/hero_words.py` and `scripts/make_hero_assets.py` (see `render/README.md`). The same words are in the page for screen readers, from `COPY.hero` in `src/copy.ts` |
| Pre-order link | `src/links.ts`. Put the store URL in `preorder`; until then the book section says "Pre-orders open soon". |
| Any words on the page | `src/copy.ts`. Every line is quoted from the manuscript (line numbers in the comments). |
| The story's words | On the blocks, in the render (`render/make_words_labels.py`, `render/words_film.py`): the story puts no words over the picture. They are also in the story's description for screen readers (`STORY_ALT` in `src/components/Story.tsx`). |

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

`public/frames/hi` and `public/frames/lo` hold the 480 frames of the story (an 89-frame
opening, where the three blocks lie face up and then stack, which plays by itself on load; the hero, frame 89;
then the film the page scrolls through, `render/words_film.py`'s frames 29 on) as WebP packed
into a few chunk files with a `manifest.json`. The page loads the small set first so the story
starts at once, then streams the full-quality set. They come from the Blender scenes in `render/`;
see `render/README.md` to re-render (the opening and the hero are kept byte for byte, the film is packed after
them), and re-export `src/wordsfilm.json` (the film's timeline and each frame's subject) whenever the film changes.

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

# Scaling Up-Side-Down

The site for Michael Wentz's book. It opens on the cover's three blocks lying face
up; scrolling stacks them, and one scroll tells the book's story with a real Blender
render: a block tower grows past twelve and falls over, and it is rebuilt on twelve
systems through Side, Down and Up. Then the SUSD Bootloader (copied in one click, or
straight into ChatGPT, Claude or Gemini), the book, and the first question.

Vite + React + motion + Lenis. No three.js: the story is a scroll-scrubbed image
sequence drawn to a canvas.

## Updating things

| What | Where |
| --- | --- |
| The bootloader prompt | `public/bootloader.md`. Every Copy button copies this whole file and the Download button serves it, so replacing it updates the site. Word counts update themselves. |
| Pre-order link | `src/links.ts`. Put the store URL in `preorder`; until then the book section says "Pre-orders open soon". |
| Any words on the page | `src/copy.ts`. Every line is quoted from the manuscript (line numbers in the comments). |
| Labels that point at blocks | `CALLOUTS` in `src/story.ts`, in the story render's frame numbers. |
| Which assistants the "Copy + open in" links open | `src/assistants.ts` |

On Vercel, editing `public/bootloader.md` on GitHub and committing is enough: the
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
the twelve systems are set down around Up / Side / Down; copying the prompt drops the last one,
Quality, into its gap. It is its own render, `render/closed.py` (see `render/README.md`), turned
into page layers by:

```
python3 scripts/make_closed_assets.py render/out/closed render/out/clseq render/out/seq
python3 scripts/pack_frames.py render/out/clseq public/closed/hi --width 1600 --quality 78 --per 25
python3 scripts/pack_frames.py render/out/clseq public/closed/lo --width 480 --quality 60 --per 50
```

That also writes `src/closed.json` (where things sit in the picture, the paper colour that joins
the sections, and the hashed file names). The word count and file size on the page are read live
from `public/bootloader.md`, so replacing the prompt needs nothing else.

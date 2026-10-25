# Scaling Up-Side-Down

The site for Michael Wentz's book. One scroll tells the book's story with a real
Blender render: a block tower grows past twelve, the top falls, and the rest is
rebuilt through Side, Down and Up. Then the SUSD Bootloader (copy it in one click),
the book, and the first question.

Vite + React + motion + Lenis. No three.js: the story is a scroll-scrubbed image
sequence drawn to a canvas.

## Updating things

| What | Where |
| --- | --- |
| The bootloader prompt | `public/bootloader.md`. Every Copy button copies this whole file and the Download button serves it, so replacing it updates the site. Word counts update themselves. |
| Pre-order link | `src/links.ts`. Put the store URL in `preorder`; until then the book section says "Pre-orders open soon". |
| Any words on the page | `src/copy.ts`. Every line is quoted from the manuscript (line numbers in the comments). |
| Labels that point at blocks | `CALLOUTS` in `src/story.ts`, in render frame numbers. |

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

`public/frames/hi` and `public/frames/lo` hold the 300 story frames as WebP packed
into a few chunk files with a `manifest.json`. The page loads the small set first so
the story starts at once, then streams the full-quality set. They come from the
Blender scenes in `render/`; see `render/README.md` to re-render, then:

```
python3 scripts/pack_frames.py render/out/seq public/frames/hi --width 1600 --quality 78 --per 25
python3 scripts/pack_frames.py render/out/seq public/frames/lo --width 480 --quality 60 --per 50
blender -b render/story.blend -P render/anchors.py -- public/anchors.json
```

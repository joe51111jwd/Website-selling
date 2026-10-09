# Daniel — portfolio

**Surface / Structure.** Every site has two layers: what people feel, and what holds it up. This portfolio shows both. The cursor is an X-ray lens that reveals the structure under whatever it touches, and a switch in the nav (or the <kbd>S</kbd> key) flips the whole site into its own blueprint.

Built with React, TypeScript, Vite, three.js, [Motion](https://motion.dev) and [Lenis](https://lenis.darkroom.engineering).

> All copy and all project media are **placeholders** until the real ones arrive. See [Swapping in the real content](#swapping-in-the-real-content).

## Run it

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # typechecks, then outputs dist/
```

## Deploy

Vercel: import the repo with **Root Directory** set to `daniel`. It's a Vite project with no extra settings; `vercel.json` rewrites every path to `index.html` so deep links like `/work/atlas` load.

## Routes

| Path | Page |
| --- | --- |
| `/` | Home: hero, the three featured projects, more work, about, contact |
| `/work` | Every project, with category filters and a list / grid view |
| `/work/<slug>` | A case study, generated for every project in `src/content/work.ts` |
| anything else | 404 |

## What's on the page

| Piece | File | What it does |
| --- | --- | --- |
| Preloader | `src/components/Preloader.tsx` | Counts 000 → 100 against the real downloads (fonts and the films the first screen needs), then lifts off. Shorter on repeat visits. |
| Hero | `src/pages/home/Hero.tsx` | The name, sized to run edge to edge. The page is drawn twice, surface and structure; the cursor is a lens onto the hidden layer, with outlined glyphs, guides and live measurements. On phones the lens drifts on its own. |
| Selected work | `src/pages/home/Featured.tsx` | Pins and scrubs through the three featured projects in one WebGL frame. Between projects a noise wipe pulls the next film up, with a blueprint line riding its edge. Click to fly the film into the case study. Stacked cards on phones. |
| More work / Work index | `src/components/ProjectList.tsx`, `src/pages/Work.tsx` | Rows with a floating preview that follows the cursor, swings with its speed and wipes between projects. |
| About | `src/pages/Home.tsx` | The page turns ink-black as it arrives. Statement, capabilities, process, and a marquee that speeds up and reverses with your scroll. |
| Case study | `src/pages/Project.tsx` | Full-bleed film, overview, text / image / phone / stats / quote blocks, and the next project. |
| Footer | `src/components/Footer.tsx` | Magnetic "Let's talk", copy-to-clipboard email, local time, and the name again, with letters that swell toward the cursor. |

### The engine

| File | Job |
| --- | --- |
| `src/lib/gl/stage.ts` | Two fixed WebGL canvases, one behind the page and one above it. Every image and film is a plane that copies its DOM element's rect each frame, so layout stays in CSS. Films only play while on screen; nothing renders when nothing is visible. If WebGL is missing, the plain `<img>` tags show instead. |
| `src/lib/gl/shaders.ts` | The one shader: cover-fit, reveal, scroll-speed bend and colour split, hover ripple, the noise wipe, and the blueprint (edge detection + grid) for the lens and Structure mode. |
| `src/lib/transition.ts` | Page transitions: the ink curtain, and the expand transition that lifts a picture out of the page and grows it into the next page's hero. Back/forward work. |
| `src/lib/cursor.ts` | The cursor and lens. Any element can set `data-cursor="view" \| "lens" \| "link" \| "drag" \| "copy"` and `data-cursor-label`. |
| `src/lib/mode.ts` | Structure mode, with a circular reveal from the switch via the View Transitions API. |
| `src/styles/structure.css` | What Structure mode looks like. Any element with `data-x="label"` gets a dashed outline and that label. |

Respects `prefers-reduced-motion`: smooth scroll, shader motion and the drifting lens turn off, and page transitions get much shorter.

## Swapping in the real content

All of it lives in two files:

- **`src/content/site.ts`**: name, role, intro line, city and time zone (for the live clock), email, availability, socials, about text, capabilities, process, marquee words. Wrap a word in `*stars*` to set it in the italic serif.
- **`src/content/work.ts`**: the projects. `featured: true` puts a project in the pinned sequence on the home page (designed for three). Everything else shows under More work and on `/work`. Each project gets `/work/<slug>` automatically, built from its `blocks`.

Before launch:

- [ ] Replace the placeholder email `hello@example.com` and fill in the social URLs (empty ones render as plain text).
- [ ] Set `url` on each project (empty shows "Link coming soon").
- [ ] Replace the mockups in `public/media/work/<slug>/` with real captures. Keep the names or update the paths in `work.ts`. Covers and shots are 1920×1200; phone shots 780×1688. A `reel.mp4` (H.264, ~10 s, muted) plus a matching `reel-poster.webp` makes the project play as a film; without one, the cover is used.
- [ ] Once there's a domain, make `og:image` in `index.html` an absolute URL (link previews need one) and regenerate `public/og.jpg`.

### Placeholder media

The seven projects in `public/media/work/` (Northpass, Atlas Type Co., Halftone Records, Meridian, Bloom & Bower, Parcel, Tidewater Surf Club) are fictional sites built in HTML/CSS/SVG purely so the portfolio has something to show. See `public/media/work/CREDITS.md`.

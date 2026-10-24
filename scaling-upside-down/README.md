# Scaling Upside Down

Homepage for Michael's book *Scaling Upside Down* and its AI bootloader. Built like an Apple product page (the structure of apple.com/iphone-duo): frosted product bar, a short hero, a highlights carousel, a product viewer, story sections with photos that grow as you scroll, and a FAQ.

Built with React, TypeScript, Vite, [Motion](https://motion.dev) and three.js.

## Run it

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # typechecks, outputs dist/
```

Vercel picks this up as a Vite project with no extra config: root `scaling-upside-down`, build command `npm run build`, output `dist`.

## How the page works

| Section | File | What it does |
| --- | --- | --- |
| Product bar | `src/components/LocalNav.tsx` | Frosted bar with the title, section links and a blue Pre-order pill. Dark over the hero and the black section, light everywhere else. |
| Hero | `src/components/Hero.tsx` | The intro: the lake shows up mirrored, so a skyscraper seems to stand on the water ("Every growth playbook sells you the tower."). It folds at the waterline and opens the right way up: a small stone house, and the tower was its reflection. "Build the house." lands in the sky. On scroll the frame tightens into a rounded card. |
| Highlights | `src/components/Highlights.tsx` | Five big cards that play for six seconds each while their dot fills. Dots jump, the button pauses, swipe moves one card. |
| Closer look | `src/components/CloserLook.tsx`, `src/book3d.ts` | A real 3D hardcover in three.js: front, spine, open (endpapers and title page) and back. Drag to turn it. |
| The scaling trap | `src/components/Problem.tsx` | "Built for the 3%." Photo grows as it scrolls in, then two-tone copy and callouts. |
| Numbers | `src/components/Numbers.tsx` | Floor 1, ceiling 12, team of teams 40–70, then a live diagram of a team: one dot per person, one line per pair. The slider goes from 1 to 70 people. |
| The model | `src/components/Model.tsx` | "Up. Sideways. Down. Up." One photo with tabs. Scale down prunes a wild juniper into a bonsai; Grow again turns a brass ring into a rising spiral. |
| Ideas | `src/components/Inversions.tsx` | Six cards you scroll sideways: the old belief struck out, the book's version as the headline. |
| Bootloader | `src/components/Bootloader.tsx` | Black section. A founder's question types itself into a chat on a MacBook with the file attached, and the answer streams in with its route. |
| Read it. Then run it. | `src/components/Products.tsx` | The book and the bootloader file as two product tiles. |
| Author, FAQ, footer | `src/components/Closing.tsx` | Michael's background, answer-first questions in native `<details>`. |

All the copy lives in `src/content.ts`. It is drafted from the discovery call and gets replaced with lines from the manuscript.

The jacket is drawn to canvas in `src/cover.ts` (front, spine, back, title page) so its type stays sharp on the 3D book and the product tile. It is a placeholder: swap in Michael's final cover there.

## Media

`public/media/` holds the photography, each at 2400 and 1200 pixels wide (`name.jpg`, `name-sm.jpg`). Generated in Higgsfield, no text in any of them. `public/media/mbp/` is the MacBook from the portfolio.

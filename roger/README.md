# Roger marketing site (v3)

The public marketing site for Roger (meetroger.ai): Part A of the v3 spec, v1.1. Built as a working
preview on the same stack as `MeetRogerAI/roger` (Next.js App Router, React 19, Tailwind 4,
TypeScript) and laid out on the same paths, so it ports file for file.

```bash
npm install
npm run dev      # http://localhost:3000
npm run build
```

Next is pinned to 16.4.6, not the 16.4.1 the spec names: 16.4.1 has a published security advisory
and refuses to start a dev server until it is upgraded. Peter's repo should take the same patch.

## What is here

| Route | What |
| --- | --- |
| `/` | The scroll story for people in real estate: hero loop, the problem, four steps, a Monday list, the brick wall, Zack controls, Peter's letter, price, questions, close |
| `/agents` | The same blocks for people who already run agents. Start buttons carry `path=agents` |
| `/pricing`, `/how-it-works`, `/faq`, `/about` | As specified in A.7 to A.10 |
| `/zack`, `/zack/[agent]` | The free Zack run: pick an agent, email, run-once prompt, paste the report back, hand off with `zack={token}` |
| `/library` | Only the new band. The library itself already exists on the live site |
| `/privacy`, `/terms` | Drafts covering every point in A.13 |
| `sitemap.xml`, `robots.txt`, social card, icon | v3 versions. Anything that is not production is noindex |

## Where things live

- `src/data/v3-copy.ts`: every line of public copy, and the questions with their audience tags.
- `src/data/sample-ideas.ts`: the sample Monday list, with names removed.
- `src/data/legal.ts`, `src/data/zack.ts`, `src/data/config.ts`: legal text, the Zack files, prices and flags.
- `src/components/v3/`: every block. `src/app/v3.css`: every style the blocks need.
- `src/components/site-header.tsx`, `site-footer.tsx`: the v3 header and footer.

## The scroll story

1. **Hero.** One headline, one button. The loop plays beside it: Sunday, Zack reads the week;
   overnight, Cora reads the pool; Monday 7:00 AM, three bricks land.
2. **The problem.** Three statements that take their ink as you scroll through them.
3. **How it works.** Four steps on the left, one stage on the right that changes with each, and a
   three-slot stack that goes from empty to picked to set up.
4. **What arrives on Monday.** Three idea cards. Each opens a pull-out sheet: description, four
   tiles, paste to install, Cora's five scores, the playbook, and how the time was worked out.
5. **It compounds.** A nine by nine wall. Three bricks to start, three more each week, one week at
   a time to week 3 (9 to 12), then a run to week 26 (78 to 81). Under reduced motion the two
   states sit side by side, still.
6. **You decide what Zack shares.** The three points, beside a working illustration of the controls.
7. Letter, price, questions, close.

Nothing moves under `prefers-reduced-motion`. The sheet is a native dialog: it traps focus, closes
on Escape and returns focus to the card. Toggles are buttons with `aria-pressed`; the accordion
exposes `aria-expanded`.

## Porting into `MeetRogerAI/roger`

1. Copy `src/components/v3/`, `src/app/v3.css`, `src/data/v3-copy.ts`, `src/data/sample-ideas.ts`,
   `src/data/legal.ts` and the page folders. Import `v3.css` from `globals.css`.
2. `src/app/globals.css` here is a copy of the live tokens. Do not port it. The only shared-file
   change is the data palette at the top of `v3.css` (spec 0.7), with lifted values for night.
3. Merge `src/data/config.ts` and `src/data/zack.ts` into the existing files; they are stand-ins.
4. Put the header and footer behind `siteConfig.flags.v3Mode`, and keep `navFor(path)` for the
   unlisted pages.
5. **Delete the preview-only pieces:** `src/app/start/`, `src/app/signin/`, `src/app/getstarted/`,
   `src/components/handoff-stub.tsx` and `src/app/geo/`. They exist so the preview's buttons land
   somewhere. The currency default should come from the existing `price.tsx` logic.
6. `src/app/zack-actions.ts` validates and returns a token but stores nothing. Wire the
   `free_runs` insert and the rate limit by IP and email where the comment says.
7. `Monday` takes `ideas`. Feed it the play chosen in the admin; with an empty list the section
   is absent, as the spec requires. `Testimonials` reads `clearedTestimonials`; feed it the
   cleared rows. It is absent today because none are cleared.

## Decisions taken in the design, for Peter to confirm

- **The Monday block shows three ideas, not one.** The spec asks for one admin-chosen play. Three
  cards read as a real Monday; each still opens to the full sheet. If only one play is chosen the
  block works with one.
- **Sample data.** Ideas 1 and 3 use the prototype's own scores, tiles, playbook and time working,
  reworded for real estate. Idea 2 ("Who's waiting on me?") had no prototype play behind it, so its
  playbook and five scores are placeholders; its 38 minutes is from the anonymized note. The "why
  it fits you" lines on all three are written for the sample.
- **The mark is a placeholder**, not a logo: a magnifying glass over one brick, on the copper
  square. Replace `src/components/v3/mark.tsx` and `src/app/icon.svg` when a mark is signed off.
- **The wall is nine by nine** (81 bricks at week 26), coloured by level from the bottom row up.
- **Footer link** reads "For people who run AI agents", not "agents", so the footer passes the
  vocabulary rule on every page.
- **The playbook preface** says "my agent system". It is the fixed `v3.playbookPreface` setting and
  is shown word for word, so it is the one place outside `/agents` and `/zack` where "agent"
  appears without "AI".
- **Wednesday on `/how-it-works`** does not mention the stats email, which is B2. Turn on
  `flags.statsEmail` when it ships. The group session line on `/pricing` is behind
  `flags.groupSession`.

## Still needed from Peter

- The edited letter. Only the two paragraphs that are still true are shown.
- `public/media/peter.jpg` and `public/media/peter-signature.svg`. Drop them in and they appear;
  until then the page shows the "PK" avatar and a set signature.
- Cleared testimonials that mention Cora or Roger.
- The model provider and its position on training, for the privacy page (marked in the text).
- A read of the privacy and terms drafts.
- The four Zack files are not in this preview, so the download links 404 here. They resolve on the
  live site at `/zack/zack-the-collector-{agent}.md`.

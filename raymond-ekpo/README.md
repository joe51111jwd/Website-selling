# Raymond Ekpo — Investor Narrative Specialist

Personal site for Raymond Ekpo, who helps pre-seed and seed founders in the US and UK build the investment narrative behind their raise. Editorial broadsheet design (ivory, ink, oxblood) after Niccolò Miranda's Awwwards Site of the Month, with moves from Neutomni. The reasoning is in [STRATEGY.md](STRATEGY.md).

Built with [Astro](https://astro.build): static HTML, no framework JavaScript. Lenis provides the smooth scrolling. The scripts are small and live in `src/scripts`:

- `enquiry.ts` is the form.
- `track.ts` sends goals to Plausible.
- `motion.ts` runs the scroll reveals, the word-by-word statement, the before/after sliders and the hover previews.
- `fx/` holds one file per set piece:
  - `frame.ts`: Lenis and the scroll-progress helpers
  - `story.ts`: the pinned markup story
  - `panels.ts`: the service panels
  - `fit.ts`: the fit check
  - `stack.ts`: the stacking cards
  - `chart.ts`: the pinned process chart
  - `shelf.ts`: the notes shelf
  - `kinetic.ts`: the drifting quote
  - `draw.ts`: the hero tilt and red pen
  - `cursor.ts`: the cursor label

Everything respects reduced motion, and the pages read fine with JavaScript off.

The set pieces are components:

- `MarkupStory.astro`: § 01
- `ServicePanels.astro`
- `FitCheck.astro`
- `NarrativeLab.astro` with `CompareSlider.astro`
- `StackCards.astro`
- `ProcessChart.astro`
- `NotesShelf.astro`
- `Markup.astro`: the hero slide
- `Ticker.astro`
- `TermSheet.astro` and `Seal.astro`
- `Pen.astro`: hand-drawn underline, circle, strike, tick and cross

The fit-check rules are at the top of `src/scripts/fx/fit.ts`. Service names and prices still come from `src/content/services/`.

## Two versions: paper and Liquid Glass

The same site and content build in two looks:

| Version | Build | Live |
| --- | --- | --- |
| Paper (editorial broadsheet) | `npm run build` | https://raymond-ekpo.vercel.app |
| Liquid Glass | `npm run build:glass` (sets `PUBLIC_THEME=glass`) | https://raymond-ekpo-glass.vercel.app |

The glass version opens on one question instead of a page about Raymond: **describe your company in one sentence, the way you'd want an investor to repeat it.** It's the first thing Raymond would do with a founder, so a visitor gets to try the work before reading about it, and there are no prices until they ask for them. Light warm grey with slow colour blobs behind frosted Liquid Glass, set in Satoshi and Switzer (both from Fontshare under its free licence, self-hosted in `public/fonts/`).

- **The test:** as you type, the sentence stays large on the page. Words a partner wouldn't repeat fade, buzzwords get a wavy underline, and the words that survive stay in ink. A glass panel scores six checks: Who buys, What changes, Proof, Why now, Plain words and One breath. Each check has a one-line note on what to fix. Below the sentence, "What a partner repeats on Monday" shows what's left after the retelling, plus the question an investor would ask next. Three example sentences (buzzwords, vague, specific) type themselves in for anyone without one handy.
- **Not a chatbot:** no bubbles, no persona and no typing dots. The analysis is a fixed set of rules (`analyse.ts`) that runs in the browser, so the result is instant and the same every time, and nothing is sent anywhere.
- **The next step:** a glass dock at the bottom carries a verdict and one action, the free mini-audit. The sentence goes with you: the services page shows it back with its score, and the enquiry form fills in "What the company does, in one sentence". It's kept in `sessionStorage` (key `one-sentence`), so it's gone when the tab closes. Analytics records a `Sentence tested` event without the text.
- **The other pages** are ordinary scrolling pages in the same glass: services as four cards with the fit check and FAQ, notes as rows with their before and after headlines, each note with a glass rod you drag across a before and after slide, about, the enquiry form, privacy and 404.
- **Liquid Glass:** the nav capsule (with a springy thumb that follows the pointer), the reading panel, the dock, cards and sheets. In Chromium the glass bends what's behind it through SVG displacement maps built for each piece's size (`lens.ts`); elsewhere it's frosted.

Where the code lives:
- **Components:** `src/components/one/`. `Sentence.astro` is the home page; `ServicesPage`, `NotesPage`, `NotePage` and `AboutPage` are the other pages; `Nav`, `Foot`, `Backdrop` and `PageHead` are shared. Each page file in `src/pages/` picks the paper or glass body with `glass` from `src/theme.ts`, and keeps the data and structured data both builds share.
- **Scripts:** `src/scripts/one/`. `analyse.ts` is the rules (pure functions, no DOM), `sentence.ts` paints the result, `carry.ts` shows the sentence on later pages, `lens.ts` the glass, `compare.ts` the before/after rod, `segments.ts` the springy thumbs. The fit check uses the paper site's `fit.ts`.
- **Theme CSS:** `src/styles/one.css`, scoped to `html[data-theme="glass"]` so the paper build ignores it.

The glass build is `noindex` and its `robots.txt` disallows crawling, because it's an alternative design for review. Without JavaScript the box still takes text and the audit link works. With reduced motion on, the backdrop is still and examples appear at once.

To tune the rules, edit the word lists and patterns at the top of `analyse.ts`. The checks are deliberately simple: they point at the questions investors ask, they don't grade the company.

## Run it

```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # type-checks, then builds to dist/
npm run dev:glass     # the Liquid Glass version
npm run build:glass
```

## Deploy

Live at **https://raymond-ekpo.vercel.app**: Vercel project `raymond-ekpo`, linked to this repo with root directory `raymond-ekpo` (Astro, Node 24). The glass version is a second project, `raymond-ekpo-glass`, on the same repo and folder. It differs in two environment variables: `PUBLIC_THEME=glass` and `PUBLIC_SITE_URL=https://raymond-ekpo-glass.vercel.app`. Pushes to any branch get a preview deployment; production currently deploys from `claude/amazing-mayer-qguhx1`, and follows the repo's production branch once the site is merged there.

When Raymond's domain is ready: add it to the Vercel project, then change `url` and `plausibleDomain` in `src/site.config.ts` to match.

## Pages

| Page | File |
| --- | --- |
| Home | `src/pages/index.astro` |
| Services and prices, mini-audit, FAQ | `src/pages/services.astro` |
| Work (notes and case studies) | `src/pages/work/index.astro`, one page per entry from `src/pages/work/[id].astro` |
| About | `src/pages/about.astro` |
| Work with me (enquiry form) | `src/pages/work-with-me.astro`, logic in `src/scripts/enquiry.ts` |
| Privacy notice, 404 | `src/pages/privacy.astro`, `src/pages/404.astro` |

## Changing things

- **Email, socials, domain, booking link, form endpoint, analytics, portrait:** `src/site.config.ts`.
- **A service or its price:** `src/content/services/<service>.md`. The term sheets on the home page, the services page, the form's checkboxes and the structured data all read from these files.
- **A new note:** add a Markdown file to `src/content/work/` with `kind: analysis`. The optional `example` block draws the before and after slides. Any note built on an invented example must keep `illustrative: true`.
- **A client case study:** copy `src/content/work/_case-study-template.md`, drop the underscore, fill it in and set `draft: false`. It then appears under "Client case studies" on the Work page instead of the empty state. Publish only with the founder's permission and only outcomes that can be checked.
- **Home page copy:** written inline in `src/pages/index.astro`, section by section (`§ 01` to `§ 06`).

## The form

Posts JSON to `formEndpoint` and shows its own success and error states; it never opens a mail app.

- **FormSubmit** (the default, no account): the first submission sends Raymond an activation email. Until he clicks it, submissions are refused and the form shows its retry message, so **send one test enquiry and activate before launch.**
- **Formspree** (what Maneuver & Co. uses): create a form, paste `https://formspree.io/f/<id>` into `formEndpoint`.

Links can preselect the form: `/work-with-me?type=audit` opens the mini-audit (deck link required), `/work-with-me?service=rewrite` ticks a service. Decks are shared as view-only links, not attachments.

## Analytics

Plausible, cookieless, so there's no cookie banner. Add the site in Plausible under the domain set in `plausibleDomain`, then add these custom-event goals:

| Goal | Fires on | Props |
| --- | --- | --- |
| `Enquiry` | successful project enquiry | `stage`, `timing`, `services` |
| `Audit request` | successful mini-audit request | `stage`, `timing`, `services` |
| `CTA` | any call-to-action click | `cta`, `location`, `page` |
| `Contact click` | email, X or LinkedIn click | `channel`, `page` |
| `Sentence tested` | glass version only: once per page view, after a sentence of four or more words settles | none (the sentence is never sent) |

## SEO

Per-page titles, descriptions and canonical URLs; Open Graph and X cards with `public/og.png`; `sitemap-index.xml`; `robots.txt`; JSON-LD for `Person`, `ProfessionalService` with priced offers, `Service`, `FAQPage` and `Article`.

## Before launch

See the "Confirm with Raymond" list at the end of [STRATEGY.md](STRATEGY.md): domain, email, form activation, reply time, deliverables and the FAQ promises.

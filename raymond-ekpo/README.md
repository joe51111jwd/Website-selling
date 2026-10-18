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

The glass version is the site as Raymond's own pitch deck. Instead of a long page, each page is a deck of full-screen slides, set like a well-made deck: chalk, ink and one blue, Cabinet Grotesk and Switzer (both from Fontshare under its free licence, self-hosted in `public/fonts/`), with the furniture a real deck carries.

- **The decks:** the home page is twelve slides in the order a good seed deck runs: title, problem, what investors hear, approach, before and after, the four engagements, the model, who it's for (the fit check), process, traction, team, and the ask. Services, notes and about are appendices A–C. Each note is its own short deck, one slide per section, split at the note's headings.
- **Moving through them:** arrow keys, page keys and space; a trackpad or wheel, one slide per gesture; on a phone, a swipe that drags the next slide in under your finger. The address follows the slide (`/#ask`, `/services#rewrite`), so any slide can be linked to. A slide that's taller than the screen scrolls first.
- **Speaker notes:** most slides in the main deck carry notes (`slot="notes"`) on why the slide is built the way it is. The Notes button or `N` shows them, so the deck teaches the method while it sells it.
- **Liquid Glass, where Apple uses it:** on the controls floating over the content. The presenter bar (previous, slide number, next, notes, enquire) is glass with a springy thumb. Each change of slide is a glass rod sweeping across the screen, wiping the old slide into the new one and magnifying both where they meet. The before/after slides are divided by a glass rod you drag. The slide number opens the contents: every slide of the deck as a live thumbnail on a frosted light table, plus the other decks. In Chromium the glass bends what's behind it through SVG displacement maps built for each piece's size (`lens.ts`); elsewhere it's frosted.
- **Pages that are documents** (the enquiry form, privacy) keep their paper markup, restyled, and the bar offers the way back to the deck.

Where the code lives:
- **Decks:** `src/components/deck/`. `Deck.astro` and `Slide.astro` are the parts, `HomeDeck`, `ServicesDeck`, `WorkDeck`, `NoteDeck` and `AboutDeck` are the decks, and `Chrome.astro` is the presenter's controls. Each page file in `src/pages/` picks the paper or glass body with `glass` from `src/theme.ts`, and keeps the data and structured data both builds share.
- **Scripts:** `src/scripts/deck/`. `deck.ts` is the engine (navigation, the wipe, contents, notes), `lens.ts` the glass, `compare.ts` the before/after rod, `segments.ts` the springy thumbs. The fit check uses the paper site's `fit.ts`.
- **Theme CSS:** `src/styles/deck.css`, scoped to `html[data-theme="glass"]` so the paper build ignores it.

The glass build is `noindex` and its `robots.txt` disallows crawling, because it's an alternative design for review. Without JavaScript the slides stack into one long page. With reduced motion on, slides change with a quick fade and nothing sweeps or builds. In dev, `window.__deck.go(i)` jumps to a slide and `window.__deck.hold(i, p)` holds a wipe part-way, for screenshots.

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

## SEO

Per-page titles, descriptions and canonical URLs; Open Graph and X cards with `public/og.png`; `sitemap-index.xml`; `robots.txt`; JSON-LD for `Person`, `ProfessionalService` with priced offers, `Service`, `FAQPage` and `Article`.

## Before launch

See the "Confirm with Raymond" list at the end of [STRATEGY.md](STRATEGY.md): domain, email, form activation, reply time, deliverables and the FAQ promises.

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

The glass version is a dark, keynote-style design: near-black, lit by ember light, with drops of liquid glass moving over each page's headline.

- **Light:** a fixed WebGL2 canvas draws a field of ember light behind the page. Sections set it with `data-light="strength focusX focusY angle"`, and it eases towards whichever section is in the middle of the screen.
- **Liquid glass drops:** at the top of every page (`data-drops`), a few drops drift over the headline (`data-headline`, split into `.hw` words that the renderer draws into the scene). They're metaballs with a domed profile. Light bends through them by Snell's law, separately for red, green and blue, so they magnify the letters with fringed edges. They also carry softbox reflections, a rim light, a shadow and a focused caustic, and they merge when they meet. On the home page one follows the cursor and gathers the others, and a click splashes them.
- **Glass controls:** iOS-style segmented controls and the floating tab bar have a glass thumb that springs between items and stretches as it moves (`data-seg`, `segments.ts`). In Chromium, elements marked `data-lens-glass` (the tab bar and the main buttons) bend what's behind them through an SVG displacement map (`lensfilter.ts`). Elsewhere they're frosted glass. Over a light surface (`data-surface="light"`), the bars thicken so their labels stay readable.
- **Type:** General Sans by the Indian Type Foundry (free licence via Fontshare), self-hosted in `public/fonts/`.

Where the code lives:
- **Renderer:** `src/scripts/liquid/`. `engine.ts` runs the frame, `shaders.ts` holds the light and glass passes, `drops.ts` is the drop physics, and `headline.ts` draws the title into the scene.
- **Pages:** `src/components/liquid/` holds the home sections, the top bar and tab bar, the footer and the page head. `src/components/liquid/pages/` holds services, work, notes and about. Each page file in `src/pages/` picks the paper or glass body with `glass` from `src/theme.ts`, and keeps the data and structured data both builds share. The enquiry form is the same markup in both, restyled for glass.
- **Theme CSS:** `src/styles/liquid.css`, scoped to `html[data-theme="glass"]` so the paper build ignores it.

The glass build is `noindex` and its `robots.txt` disallows crawling, because it's an alternative design for review. Without WebGL2 the light is a still CSS gradient and the headline stays as plain text. With reduced motion on, the light holds still, the drops sit in place, and nothing pins or slides. In dev, `window.__liquid.warm(n)` runs n seconds of drop physics at once, for screenshots from slow software renderers.

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

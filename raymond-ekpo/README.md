# Raymond Ekpo — Investor Narrative Specialist

Personal site for Raymond Ekpo, who helps pre-seed and seed founders in the US and UK build the investment narrative behind their raise. Editorial broadsheet design (ivory, ink, oxblood) after Niccolò Miranda's Awwwards Site of the Month, with moves from Neutomni. The reasoning is in [STRATEGY.md](STRATEGY.md).

Built with [Astro](https://astro.build): static HTML, no framework JavaScript. The only scripts are the enquiry form and a few lines that send clicks to Plausible.

## Run it

```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # type-checks, then builds to dist/
```

## Deploy

Any static host. On Vercel or Netlify, set the root directory to `raymond-ekpo`; the framework is detected as Astro (build `npm run build`, output `dist`). Node 22.22 or later.

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

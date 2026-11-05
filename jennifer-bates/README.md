# Jennifer G. Bates

Personal site for Jennifer G. Bates, founder and CEO of HumanFactor™ and the creator of Stakeholder Risk.
Her company site is stakeholderrisk.com; this one is about her: the idea, her work, speaking and how to reach her.

## The idea

One picture carries the site: **every financial model sits on a human system.** On the home page a deal model sits
pinned on screen while you scroll. The people under it appear (founder, board chair, investor, lender, executives),
then the lines between them strain (the four HumanFactor Index™ diagnostics: LIR, ASR, DAR, SAR), then the deal
reprices: same revenue and EBITDA, multiple 14.0× to 10.5×, $259M to $194M. "The model didn't change. The people did."
The company and figures are labeled illustrative.

Colors come from her own portrait and the HumanFactor mark: night navy, the slate of her photo backdrop (the home
hero is that slate, so the portrait has no edge), cream, and the gold of her earrings. Newsreader for her voice,
Geist for reading, Geist Mono for numbers.

## Pages

| Page | What it answers |
| --- | --- |
| `/` | Who she is, the X-ray, the numbers, what Stakeholder Risk is (and isn't), her six frameworks, who she works with, talks, FAQ |
| `/stakeholder-risk/` | The answer-first explainer: definition, why it matters, four diagnostics, twelve risks, when to look. `DefinedTerm` + `FAQPage` schema |
| `/speaking/` | Four keynotes, formats, the Orlando Insights episode, booking |
| `/about/` | Bio, her quote, timeline, numbers. `ProfilePage` schema |
| `/contact/` | Briefing, the four team inboxes, phones, offices |

Every page is plain HTML generated from `tools/content.mjs` by `tools/pages.mjs` and committed, so search and AI
crawlers read every word without JavaScript. `Person` schema on every page; `public/llms.txt`, `robots.txt` and
`sitemap.xml` are generated too. Contact goes to her company's existing inboxes and briefing page, so the site needs
no backend.

## Run it

```bash
npm install
npm run pages          # rewrite the pages from tools/content.mjs
npm run dev            # http://localhost:5210
npm run build          # draft build: every page is noindex
npm run build:launch   # launch build: indexable
```

`python3 tools/webimg.py .` makes the web sizes of `masters/` and `python3 tools/og.py` makes the share image.
Vercel: set the root directory to `jennifer-bates`; `vercel.json` builds the draft. Switch the build command to
`npm run build:launch` once Jennifer approves.

## Confirm with Jennifer before launch

Every fact is in `tools/content.mjs` with its source. These differ between sources, or are our reading of one:

- **Domain.** `SITE.url` is set to `https://jennifergbates.com` as a placeholder.
- **Education.** Her team page says MS in Finance, NYU Stern; an older Vision Track Strategies bio lists an MBA and
  an MS in Organizational Management from the University of Colorado. The site shows NYU Stern only.
- **Industries.** 25+ (home and team pages) vs "500+ assessments across 15+ industries" (about page). The site uses 25+.
- **Years.** "20+ years" (about page, podcast) vs "23-year entrepreneur" (team page). Both appear.
- **Timeline.** Her about page lists "2006 Practiced, 2016 Named, 2022 Discussed, 2026 Sought". We read 2016 as
  naming the category and added 2009 (Vision Track Strategies), 2024 (HumanFactor Research Company) and 2027 (London).
- **LinkedIn.** linkedin.com/in/humanfactor/ is the profile her team page links; confirm it is hers.
- **Keynote titles.** Written for this site from her published themes.
- **Headshot.** From her company site; confirm the photographer's license covers this site.

The enterprise-value disclaimer from her company site appears under every set of numbers and in the footer.

# HumanFactor

Company site for HumanFactor (HumanFactor Enterprises), the New York firm that originated Stakeholder Risk.
It replaces the content of stakeholderrisk.com.

## The idea

One motif, told in scenes. Five metal rings in three.js, one per stakeholder group (founders, board,
sponsors, management, lenders), stay pinned while the home page scrolls through four scenes:

| Scene | Rings | Copy |
| --- | --- | --- |
| 00 | A drifting gyroscope | The risk no model prices. |
| 01 | Snap into one plane | Every model assumes the people behind it agree. |
| 02 | Wrench apart; the amber ring hums; the four diagnostics read out | They rarely do. |
| 03 | Turn to face you as a dial with the composite inside | HumanFactor puts a number on it. 68.4 |

The rings come back as still line drawings in every inner page's hero. `src/rings.ts` has the four poses;
the dial's projected center is handed to CSS (`--cx`, `--cy`) so the number always sits inside it.
Without WebGL the line drawing shows instead. The three.js chunk loads only on the home page (120 KB gzipped).

System: two colors (night `#0a1017`, bone `#eeece7`) and one accent (the amber of the strained ring), used
only for the dot, the hot ring and data. Geist for everything and Geist Mono for labels. A 12-column grid with
labels in columns 1–3 and content from column 4, hairline rows, and giant numbers.

## Pages

| Page | |
| --- | --- |
| `/` | The four scenes, the definition (words darken on scroll), the record (counts up), the lineage from VIX to the Index, six frameworks, who we work with, the engagement path, leadership, insights, FAQ |
| `/stakeholder-risk/` | Answer-first explainer: six dimensions, when to measure, FAQ. `DefinedTerm` + `FAQPage` schema |
| `/humanfactor-index/` | Composite and diagnostics, twelve risks, deployment, a sample question that answers back, lineage |
| `/life-sciences/` | Where the group enters, the nine EVB pillars, the record, when to call, Jean Pineault and Jennifer G. Bates |
| `/company/` | What the firm is and is not, leadership with quotes, the record, offices |
| `/briefing/` | The briefing request: fields from their current form; it opens an email to advisory@ (no backend yet) |

Everything is plain HTML generated from `tools/content.mjs` (every fact, with its source) by
`tools/pages.mjs`, so crawlers read every word. `Organization` schema on every page; `llms.txt`,
`robots.txt` and `sitemap.xml` are generated too.

## Run it

```bash
npm install
npm run pages          # rewrite pages from tools/content.mjs
npm run dev            # http://localhost:5173
npm run build          # draft: noindex
npm run build:launch   # launch: indexable
```

`python3 tools/webimg.py .` rebuilds the portrait sizes from `masters/`.
On Vercel, set the root directory to `humanfactor`.

## Confirm with HumanFactor before launch

Their own pages disagree on these. `tools/content.mjs` marks each one `CONFIRM`.

- **Definition of Stakeholder Risk.** Three wordings across home, /stakeholder-risk and /life-sciences. We use the home page's.
- **Frameworks.** "Five proprietary frameworks" (/stakeholder-risk) vs six listed on the home page. We show six.
- **Numbers.** Debriefs 3,000+ (home) vs 500+ (/life-sciences); industries 25+ vs 20+ vs 15+. We use the home page's.
- **Composite.** 68.4 is not the simple average of the four diagnostics (65.75), and the weighting isn't published.
- **Jennifer's experience.** "23-year entrepreneur" vs "20+ years".
- **Life sciences record.** Company names come from their "representative sample"; confirm they can be named.
- **Briefing form.** Wire it to their CRM or form endpoint; today it composes an email.
- **Domain.** Canonicals point at stakeholderrisk.com.
- **Market statistics** on humanfactorindex.com (CEO turnover, deal reset risk, and others) are unsourced, so they are left out.

# Writing a page for the SmartCrew SEO library

Every page is one TypeScript file, `src/seo/pages/<kind>/<name>.ts`, exporting `page: SeoPage`
(types in `src/seo/types.ts`, screens in `src/seo/shots.ts`). One template renders them all
(`src/seo/render.ts`). The reference page is `src/seo/pages/industry/excavation-software.ts`: copy
its shape, not its sentences.

James (Oct 22): every page is a doc-style info page, explanations plus visuals, in one format. It
must be "insanely readable" for people, search engines and AI assistants, and nothing may risk a
search penalty. Andrew (SmartCrew's founder) warned that engines punish piles of AI text. So each
page has to carry real substance a contractor can't get from the next page.

## Hard rules

1. **SmartCrew facts come only from the list below.** No invented numbers, prices, customer counts,
   ratings, reviews, testimonials, time savings, or features. Worked examples with arithmetic are
   fine when labelled as examples ("Take one person who…; this is an example, not a statistic").
2. **Competitor facts come only from `/mnt/project-files/smartcrew/seo/competitors/<slug>.json`.**
   Every competitor fact on the page must have its URL in `sources` (label, url, accessed
   "2026-10-22"). Where the JSON says `"has": "unknown"`, write "not listed on their site" or "we
   couldn't find it on their site", never "doesn't have". Prices: say they are list prices from
   their pricing page on October 22, 2026, and that promotions and plans change. Anything in a
   file's `unverified` list stays off the page.
3. **Be fair to competitors.** Every comparison page has a "Where <competitor> is the better pick"
   note or card with real reasons from the JSON (bigger integrations list, free plan, enterprise
   scale, etc.). No insults, no "outdated", "clunky", "nightmare". AI assistants and buyers trust
   pages that admit trade-offs.
4. **No "Founding Member", no SmartCrew price, no trial or contract terms.** For SmartCrew pricing
   use: "Pricing depends on your company size and the features you need; it's built to be well below
   enterprise construction software. You get a number on a short call with Andrew."
5. **Premium note.** When a table lists Fleet Management, Sales CRM, Scheduling or Crew
   Communication as SmartCrew features, add the table note: "Feature availability varies by plan.
   Fleet Management, Sales CRM, and Scheduling & Communications are Premium categories."
6. **Every page is different.** Its own angle, its own examples, its own FAQ. Don't reuse
   paragraphs between pages (the SmartCrew feature table rows are the one exception).
7. Don't edit shared files (`render.ts`, `seo.css`, `types.ts`, `shots.ts`, `pages/index.ts`).

## Voice

- A contractor talking to a contractor. Short sentences. Concrete nouns: excavator, dump truck,
  haul ticket, cost code, pre-trip, pit, yards, Friday payroll.
- Answer first. The `lede` answers the search in 2–3 sentences that make sense quoted alone. Each
  H2 section opens with its answer in the first sentence.
- Headings say what the section answers ("How much does ClockShark cost?" beats "Pricing").
- No em dashes (—). Use a colon, a comma or a full stop. En dashes only in number ranges (5–100).
- None of these words: delve, robust, seamless, streamline, game-changer, landscape, leverage,
  unlock, empower, elevate, comprehensive, navigate, crucial, moreover, furthermore, additionally,
  tailored, holistic, harness, embark, effortless, hassle-free, best-in-class, world-class,
  cutting-edge, "in today's", "whether you're", "look no further", "it's worth noting".
- No rhetorical triplets every paragraph, no "It's not just X, it's Y", no closing summary
  paragraph that repeats the page.
- `node tools/seo-lint.mjs <file>` catches the mechanical ones.

## Shape (all pages)

- `title` ≤ 60 characters with the keyword near the front; `description` 140–160 characters.
- `lede` (answer), `summary` (4–6 bullets), `hero` (1–2 screens), then blocks:
  at least one `table`, at least two `shots` blocks, one `cta` block about two-thirds down,
  `steps` or `cards` where they help. 1,300–2,200 words of copy.
- `faqs`: 5–7 questions people actually type (use the keyword list), answers 2–4 sentences.
- `related`: 3–6 slugs from the page plan.
- `updated: "2026-10-22"`.
- Inline links: `[label](compare/busybusy-alternative)` for our pages, full https URLs for sources.

## Page types

- **compare/<x>-alternative** ("busybusy alternative"): what <x> is and who it's for; how much it
  costs (list prices + source); the feature table (rows = the jobs a dirt work company does, columns
  = SmartCrew | <x>, cells `{ mark, note }`); where <x> is the better pick; where SmartCrew is;
  what switching looks like; FAQ ("Is <x> good for excavation?", "How much does <x> cost?", "What
  is the best <x> alternative for heavy civil?").
- **compare/<x>-pricing** ("clockshark pricing"): the plans and list prices as a table, what's in
  each plan, add-ons and contract terms from their pages, a worked example of total monthly cost for
  a 15- and a 40-person crew (show the arithmetic; label it an estimate from list prices), then how
  SmartCrew prices (rule 4).
- **vs/<a>-vs-<b>**: both products from their own pages, a 3-column table (a | b | SmartCrew), who
  each fits, then SmartCrew as the all-in-one option for dirt work.
- **features/<x>**: the problem in the field, how SmartCrew does it step by step with screens, what
  to look for in any tool, a table, FAQ.
- **<trade>-software** (industry): what that trade's week looks like and what its software must
  track, how SmartCrew handles each piece, questions to ask vendors, FAQ.
- **guides/<x>**: a buyer's guide with criteria and a comparison table across several products
  (all from the JSON files, with sources), SmartCrew included and described honestly.

## SmartCrew facts you may use (Andrew's own copy)

- All-in-one software for heavy civil and dirt work contractors with 5–100 employees: excavation,
  sitework, grading, underground utilities, septic, drilling, paving, demolition, trucking and
  hauling, aggregate operations. Only those trades.
- Founder Andrew Drish. His family has been in construction for 75 years; they run 20–30 people
  (Drish Construction). His words: "Time tracking apps were too basic. Enterprise software was too
  complicated, confusing, and expensive." "We only run 20-30 guys and there was nothing specifically
  designed for our size of heavy civil business." "Simple for the field. Powerful for management.
  Fairly priced for owners." Featured at ConExpo.
- Time Tracking: GPS-powered clock-ins, live crew locations, payroll-ready timecards, supervisor
  dashboard, clock in/out reminders. At clock-in the worker picks project, activity code and
  equipment (screens). Log & Switch to change task/machine; Break; Clock Out; weekly summary with
  Submit Timecard; request day off.
- Job Costing: daily job profitability, bid budgets vs. actual costs, change orders & extras, custom
  reports. Job page shows revenue, expenses, profit; budget vs spent for labor, materials, equipment,
  other, change orders; hours by employee; cost codes tab.
- Equipment Management: equipment hours & locations, DOT & daily inspections, maintenance, service
  requests and utilization rates, Shop Queue. Machine record: hours, mileage, last/next service,
  inspection log. Service queue with urgency and status.
- Daily Reports: daily progress & production logs, jobsite photos & field notes, automatic daily
  reports for the office.
- Materials & Hauling: digital hauling tickets, material & fuel log tracking, AI reader to enter the
  data for you (from ticket/receipt photos), track deliveries and production. Hauling log: ticket,
  time, truck, project, import/export, material, yards, source pit.
- Scheduling: drag-and-drop crew scheduling, job & equipment assignments, schedule updates &
  notifications.
- Sales & CRM: leads & sales pipeline, bid & opportunity tracking, follow-ups & reminders.
- Crew Communication: dispatch with instant alerts, crew & team messaging, job-specific chat
  channels, company announcements.
- Safety & Compliance: JSAs, toolbox talks & safety meetings, incident reports (injury, near miss,
  damage, photos).
- File Storage: centralized cloud file storage; plans, photos & job documents; access from field or
  office; file sharing & permissions.
- Replaces: time apps (busybusy, QuickBooks Time, ExakTime), fleet/maintenance apps (Fleetio,
  MaintainX), CRMs (HubSpot, Close), spreadsheets and paper load tickets, Slack/WhatsApp, Dropbox/
  Google Drive. QuickBooks is integrated, not replaced.
- Integrations: QuickBooks Online today; working on QuickBooks Desktop, Foundation, ADP and more.
- Setup: "We do the heavy lifting": the team sets up the account, migrates information, organizes
  workflows and trains your people. Most companies are up and running within a few weeks; start
  with the features you need most.
- Crew: "Our crews aren't tech savvy. And they don't need to be." Crews clock in, see assignments,
  submit inspections, upload receipts and complete daily reports from their phones.
- Feature availability varies by plan; Fleet Management, Sales CRM, and Scheduling &
  Communications are Premium categories.
- Getting started: "Try SmartCrew" starts with a short call with Andrew (the buttons do this).
- Not SmartCrew: estimating/takeoff, GPS machine control, telematics hardware, payroll processing,
  ELD/hours-of-service. Say so plainly when a page's topic touches them.

## What can get a site penalized, and how these pages avoid it

Google's spam policies (scaled content abuse, site reputation abuse, thin content, doorway pages,
cloaking, hidden text, link schemes, structured data that doesn't match the page) and the legal
risk of false competitor claims are the whole list. Rules for every page:

1. **Every page earns its own URL.** One distinct search intent per page, with its own numbers,
   screens, sources and "where they're better" section. Never swap a competitor name into a
   template and publish. Under ~900 words of real copy, or a table that is the same on two pages,
   fails the lint.
2. **No unsourced competitor claims.** Every competitor fact links to their own page with a
   checked date. "Unknown" is written "Not listed", never "doesn't have". Prices are labeled list
   prices with a date. Ratings are quoted as numbers with the site and date. No insults, no
   guesses about their business.
3. **No fake proof.** No invented reviews, stars, customer counts, quotes, prices or stats about
   SmartCrew. Structured data (Article, BreadcrumbList, FAQPage) only describes text that is
   visible on the page. No AggregateRating markup.
4. **Write for readers first.** Answer in the lede, plain words, real specifics (yards, tickets,
   machines). The lint bans AI-filler phrases and em dashes. A human reads each page before it
   ships. Don't run "AI humanizer" tools: they swap words without adding facts, and facts are
   what pass quality checks.
5. **No keyword stuffing, hidden text, cloaking.** One main keyword in the title, H1 and lede, used
   naturally. The same HTML goes to people, search engines and AI crawlers.
6. **Don't publish in bulk.** Add pages in waves chosen by search volume and real usefulness, and
   check Search Console for "Crawled, currently not indexed" before the next wave.
7. **No link schemes.** No paid links, link swaps or comment spam. Internal links only where a
   reader would want them.
8. **Preview stays noindex.** smartcrew-preview.vercel.app is noindex on purpose so it never
   competes with the real domain as duplicate content. The real domain builds with the plain
   build (indexable) and the sitemap goes into Search Console at launch.
9. **Trademarks.** Competitor names appear only to compare, in text, with no logos or look-alike
   branding.
10. **Speed and access.** Static HTML, no JS needed to read, images with alt text and sizes, no
    blocking of crawlers in robots.txt.

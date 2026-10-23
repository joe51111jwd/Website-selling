# Checklist from James's two bookmarked AEO posts (wave 5, October 22, 2026)

Both posts were read in full through the X API on October 22, 2026:

- **ND**: Nicholas Dulait, "Full guide: how to get AI to recommend your brand", X article posted
  Oct 16, 2026: https://x.com/NicholasDulait/status/2110998988035964950
- **JAM**: @wespreadjam, "run an AI search visibility audit exactly like this" (14 steps), posted
  Oct 22, 2026: https://x.com/wespreadjam/status/2113392719448227994 . Its earlier "AEO / GEO
  playbook for 2026" post (https://x.com/wespreadjam/status/2112228045000184310) repeats the same
  steps in short form; its extra items are listed as JAM-P.

Status key: **done** (before this wave, file cited), **done in wave 5** (file cited), **blocked**
(needs Andrew or James; the exact ask is given). Nothing is marked done unless it is in the repo or
was checked from this box.

## Let the bots in (ND part 5, JAM step 9)

| # | Step | Status |
| --- | --- | --- |
| 1 | robots.txt has no Disallow for GPTBot, OAI-SearchBot, ClaudeBot, Google-Extended | done: seo.plugin.ts (robots for the new site names them all with Allow) |
| 2 | curl -A GPTBot returns 200 | done in wave 5: rechecked Oct 22, 2026, 10:38 PM ET, GPTBot, OAI-SearchBot, ClaudeBot, PerplexityBot all get 200 on smartcrewhq.com and smartcrew-preview.vercel.app |
| 3 | Check the CDN or Cloudflare "block AI bots" setting and WAF | blocked. Ask Andrew: "In Webflow and any Cloudflare in front of smartcrewhq.com, is any AI bot blocking or 'AI Crawl Control' turned on? Please screenshot the setting." |
| 4 | Live robots.txt on the current site | blocked. Found in wave 5: https://www.smartcrewhq.com/robots.txt returns 200 with an empty body. Not harmful (empty allows all), but ask Andrew to add a Sitemap line in Webflow, or wait for the new site's robots.txt at launch. |
| 5 | Content readable without JavaScript | done: pages render to static HTML (src/seo/render.ts, seo.plugin.ts) |
| 6 | Redirect URLs that AI assistants invent (404s from AI referrals) | partly done: vercel.json redirect stub (wave 4). Blocked for the rest. Ask Andrew: "After launch, export 404s with an AI referrer from analytics monthly." |
| 7 | Page is indexable, internally linked and returns normally (JAM 9) | done in wave 5: new pages are in the sitemap and linked from related lists on compare/busybusy-alternative, compare/clockshark-alternative, features/heavy-equipment-maintenance-software, features/construction-job-costing and features/construction-time-tracking |
| 8 | Page indexed and eligible in normal Google Search (JAM 9) | blocked. Ask James or Andrew: "Submit https://www.smartcrewhq.com/sitemap.xml in Search Console at launch and check Page indexing for 'Crawled, currently not indexed'." |
| 9 | Publish llms.txt with a markdown copy of key pages (ND says low priority) | done: llms.txt and llms-full.txt built by seo.plugin.ts and src/seo/llms-full.ts; regenerated in wave 5 with the two new pages |

## Map the queries (JAM steps 1, 5, 10, JAM-P "Map the queries")

| # | Step | Status |
| --- | --- | --- |
| 10 | Fixed set of 30 to 50 buyer prompts: category, comparisons, alternatives, use cases, pricing, problems | done in wave 5: src/seo/research/top-50-questions.md (50 questions with sources and the page that answers each) |
| 11 | Add "best", "alternatives", "vs", "cheapest" and use-case queries (JAM-P) | done in wave 5: rows 1 to 3, 15, 16, 17, 21 to 23 and the trade rows in top-50-questions.md |
| 12 | Group prompts into topics (JAM 5) | done in wave 5: questions map to page clusters (time tracking, pricing, equipment cost, comparisons) in top-50-questions.md |
| 13 | Investigate fan-out and grounding queries; Bing Webmaster Tools grounding queries (JAM 10, ND part 0) | blocked. Ask James: "Verify smartcrewhq.com in Bing Webmaster Tools and export the AI grounding queries report once it has data." |
| 14 | Filter keywords: read the AI answer for each; go for the mention when the AI answers fully, go for the click on tool queries (ND part 2 step 3) | done in wave 5 for the tool side: /guides/equipment-cost-per-hour/ is a calculator-style query (method and worked example). Reading live AI answers per keyword is blocked with item 15. |

## Audit visibility (ND part 2, JAM steps 2 to 4, 6 to 8, JAM-P "Audit")

| # | Step | Status |
| --- | --- | --- |
| 15 | Run the same prompts in ChatGPT, Claude, Gemini or Google AI Mode, Perplexity; log model, date, brands mentioned, recommended, cited URLs | blocked. Ask James: "Run the 50 questions in top-50-questions.md in ChatGPT, Perplexity, Google AI Mode and Claude, 3 runs each, into a sheet with columns model, date, run, mentioned, recommended, cited URLs." This box has no signed-in assistant accounts. |
| 16 | Track citation, mention and recommendation separately (JAM 3) | done: the column set is in AEO.md section 2 and item 15's ask |
| 17 | Repeat high-value prompts several times (JAM 4, ND "dice roll") | done as process (AEO.md section 2, 3 runs each); running it is item 15 |
| 18 | Competitor gap per topic (JAM 6) | blocked on item 15 data |
| 19 | Open every cited source when a competitor wins; build the outreach list (JAM 7, ND part 2) | blocked on item 15 data. Ask Andrew to own the outreach list (AEO.md section 4). |
| 20 | Check whether an existing page should win before writing a new one (JAM 8) | done in wave 5: 35 of 50 questions mapped to existing pages; only two new pages, where no page fit (top-50-questions.md) |
| 21 | List everything the model could name, plus the words you want next to it (ND part 2 step 1) | done: AEO.md section 2 item 1 |
| 22 | Sort gaps into six buckets: visibility, narrative, topic, format, web mentions, demand (ND) | blocked on item 15 data; the buckets are in AEO.md section 2 item 3 |
| 23 | Flag outdated or incorrect information about the product (JAM-P) | done: /guides/what-is-smartcrew/ is the official facts page. Blocked for what assistants say today (item 15). |

## Write pages a model can lift (ND part 3, JAM 11 and 12, JAM-P "Create content")

| # | Step | Status |
| --- | --- | --- |
| 24 | Answer first in every section | done: WRITING.md voice rules; done in wave 5 for every new section and page |
| 25 | Every section stands alone | done in wave 5: new H2s are questions answered in their first sentence and restate their subject |
| 26 | Name things (entities and relationships) | done in wave 5: new copy names products, plans, machines and sources |
| 27 | One idea per sentence | done: WRITING.md voice |
| 28 | Freshness: update key pages with real changes, not a new date | done in wave 5: pages with real new sections keep updated 2026-10-22, which feeds sitemap lastmod; no date bumped without a change |
| 29 | Refresh sleeper pages (lost clicks, still have links) | blocked. Ask James: "Export Search Console clicks per page, last 3 months vs the same 3 months last year." The new site has no history yet. |
| 30 | Give information the model can't get elsewhere: real pricing, limits, screenshots, comparison criteria, limitations (JAM 12) | done in wave 5: worked cost examples, dated list price tables, real app screens, "not listed" limits; SmartCrew limits stated (no payroll processing, no ELD) |
| 31 | Publish comparison pages for real buying decisions (JAM-P) | done (10 compare pages, HCSS vs busybusy); done in wave 5: /vs/clockshark-vs-busybusy/ |
| 32 | Product-led pages around specific problems (JAM-P) | done (feature and trade pages); done in wave 5: /guides/equipment-cost-per-hour/ and new problem sections (buddy punching, missed punches, no signal, dispatch, Excel, seasonal pricing) |
| 33 | Keep pricing and feature pages current (JAM-P) | done: prices dated in sources/wave-4.md and sources/wave-5.md. Blocked for SmartCrew's own price (WRITING.md rule 4). |
| 34 | Remove thin, outdated or conflicting content (JAM-P) | flagged in wave 5, not changed: compare/busybusy-alternative shows monthly-billing prices ($11.99, $17.99) that wave 4 could not see on busybusy's page, and busybusy blocked our fetch again today. Ask Andrew or James: "Open busybusy.com/pricing in a browser, toggle monthly billing, and confirm $11.99 and $17.99 or give the new numbers." |
| 35 | Brand your own framework so the idea keeps your name (ND) | blocked. Ask Andrew: "Is there a SmartCrew name for how you run a job (for example a daily job cost check) that you want to use everywhere?" Not invented here. |
| 36 | Fill gaps yourself: FAQ with real numbers, dates, founders, prices; correct wrong claims on your own site first (ND part 5) | done: /guides/what-is-smartcrew/. Blocked on missing facts listed as TODO(andrew) (offline mode, location after clock-out, missed-punch edits, certified payroll export, equipment rate setting). |
| 37 | Don't write a page when the problem is technical (JAM 11) | done: technical items handled in items 1 to 9 |

## Get named off-site (ND part 4, JAM 13, JAM-P "Build authority")

| # | Step | Status |
| --- | --- | --- |
| 38 | Tier 1: listicles, review sites, comparison posts | blocked. Ask Andrew: "Claim and complete SmartCrew's Capterra and G2 profiles, then pitch the listicles from the audit, one a day, no paid placement." |
| 39 | Tier 2: answer real Reddit, Quora and forum threads with disclosure | blocked. Ask Andrew: "Answer the threads listed in top-50-questions.md as yourself, saying you founded SmartCrew." Not posted by us. |
| 40 | Tier 3: own channels (YouTube, LinkedIn, podcast) | blocked. Ask Andrew for the official profile URLs (also needed for sameAs, item 42). |
| 41 | YouTube search videos: keyword title, real description with keyword early, timestamps, say the keyword, match the format that ranks | blocked. Ask Andrew: "Record a 3 to 5 minute tutorial titled 'Excavation time tracking app' and one titled 'How to calculate equipment cost per hour'." |
| 42 | The internet describes the product consistently; sameAs links | partly done: same description in llms.txt, what-is-smartcrew and Organization schema. Blocked: SAME_AS in render.ts is empty until Andrew sends profile URLs. |
| 43 | Earn legitimate inclusion; don't manufacture mentions (JAM 13) | done as a rule: WRITING.md penalty rule 7 |

## Measure (ND part 5, JAM 14, JAM-P "Optimize" and "Execution loop")

| # | Step | Status |
| --- | --- | --- |
| 44 | GA4 channel "AI traffic" with the source regex | blocked. Ask Andrew or James to create it (regex in AEO.md section 5). |
| 45 | Add "How did you hear about us?" with ChatGPT, Perplexity, Google AI options | blocked. The trial popup already records the landing referrer (Attribution.referrer in src/lib/lead.ts), which catches AI referrals that keep a referrer. Adding a question changes Andrew's sign-up funnel and the lead posted to his CRM, so ask Andrew: "OK to add an optional 'How did you hear about us?' step to the trial popup with ChatGPT, Perplexity, Google AI answer, Google search, YouTube, referral, ConExpo, other?" |
| 46 | Watch retrieval bot hits (ChatGPT-User, OAI-SearchBot) per page | blocked. Ask James: "After launch, enable Vercel log drains or analytics that keep user agents, so we can count bot fetches per page." |
| 47 | Measure share of appearances across dozens of prompts, against competitors, weighted to revenue prompts (JAM-P) | blocked on item 15 |
| 48 | Monitor weekly or monthly, find the gaps, ship, rerun the same prompts (JAM 14, JAM-P loop) | done as process: AEO.md section 5 and "Audit steps"; running it is blocked on item 15 |
| 49 | Pick the engine first: Google and ChatGPT carry most volume; Perplexity and AI Overviews are quick wins when you already rank (ND part 1) | done as a note in AEO.md; the order is used in item 15's ask |
| 50 | Don't trust one screenshot; most numbers are one vendor's correlations (ND caveats) | done: AEO.md opening note |

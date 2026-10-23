# AEO plan for SmartCrew (answer engines: ChatGPT, Google AI Overviews and AI Mode, Perplexity, Claude)

Source: Nicholas Dulait, "Full guide: how to get AI to recommend your brand", X article, bookmarked by
James on Oct 22, 2026: https://x.com/NicholasDulait/status/2110998988035964950
Most numbers in it are Ahrefs studies. Treat them as direction, not law.

The goal is not a "ranking". It is how often SmartCrew is named when a contractor asks an assistant
for software. That is measured by asking the same questions again and again (see "Measure").

## 1. Let the bots in (done, recheck after every deploy)

- robots.txt for the library names OAI-SearchBot, ChatGPT-User, GPTBot, ClaudeBot, Claude-SearchBot,
  PerplexityBot, Google-Extended, Bingbot and Meta's bots with `Allow: /` (seo.plugin.ts).
- Checked Oct 22, 2026, 9:40 PM ET: `curl -A GPTBot` (and OAI-SearchBot, ClaudeBot) gets 200 on
  smartcrewhq.com and smartcrew-preview.vercel.app.
- Pages are static HTML. ChatGPT's crawler doesn't run JavaScript, and these pages need none.
- TODO(andrew): smartcrewhq.com is on Webflow today. Check Webflow and any Cloudflare in front of
  it for an "AI bot" or "block AI crawlers" setting, and check the live /robots.txt.
- TODO(andrew): after launch, watch analytics for AI referrals landing on 404s and redirect any
  made-up URL that keeps getting visits to the closest real page.

## 2. Gap audit (needs Andrew or James with logins)

1. Names an assistant could use: SmartCrew, Andrew Drish, Drish Construction. Words we want next to
   them: "heavy civil", "dirt work", "5 to 100 employees", "all-in-one", "fairly priced".
2. Prompt set (run monthly in ChatGPT, Google AI Mode, Perplexity, Claude; 3 runs each; record who
   is named, who is recommended, and every cited URL):
   - best software for excavation contractors / for a small heavy civil company
   - best construction time tracking app for dirt work crews
   - busybusy alternative, ClockShark alternative, HCSS HeavyJob alternative, Procore alternative
   - HCSS vs busybusy, ClockShark vs busybusy
   - grading / septic / paving / trucking company software
   - how much does excavation software cost
   - what is SmartCrew / who makes SmartCrew
3. Sort each gap: visibility, narrative (described wrong), topic, format, web mentions, demand.
4. List every listicle, review or comparison page cited for those prompts that names competitors
   and not SmartCrew. That is the outreach list for step 4.

## 3. Pages a model can lift a paragraph from (this repo)

WRITING.md already requires answer-first ledes and H2s, named entities and short sentences. Wave 3
adds: H2s phrased as the question and answered in the first sentence, sections that stand alone,
and specific facts in place of vague ones (worked examples, labelled as examples).
Freshness matters (most ChatGPT-cited pages were updated in the last 30 days): when a page gets a
real update, bump `updated`, which feeds sitemap lastmod. Never bump the date without a real change.

## 4. Get named on pages the model already trusts (Andrew)

- Tier 1: the listicles and comparison posts from the audit, plus construction software review
  sites. Ask for inclusion honestly; no paid links (WRITING.md penalty rule 7).
- Tier 2: answer real questions in contractor forums and Reddit threads as Andrew, with disclosure.
- Tier 3: YouTube. One search video per main keyword ("excavation time tracking app"): the
  keyword as the title, a real summary in the description, timestamps, and say the keyword out loud.
  The ConExpo feature and Andrew's demo video are a start.
- Fill the gaps ourselves: the official facts live on /guides/what-is-smartcrew/. If an assistant
  says something wrong about SmartCrew, correct it there first.

## 5. Measure

- TODO(andrew): add "How did you hear about us?" to the booking form with options ChatGPT,
  Perplexity, Google AI answer, Google search, YouTube, referral, ConExpo, other.
- TODO(andrew): in GA4 create a channel "AI traffic" with source matching
  `chatgpt|openai|perplexity|gemini\.google|copilot\.microsoft|claude\.ai|deepseek`. It undercounts.
- Rerun the prompt set monthly and the full audit every quarter.

## Wave 4 (October 22, 2026)

Added: six trade pages (septic, drilling, paving, demolition, trucking, aggregate), two feature
pages (construction CRM, file storage), a Fieldwire alternative, HCSS vs busybusy, and one
cross-tool pricing guide at /guides/construction-software-pricing/. Separate "ClockShark pricing"
and "busybusy pricing" pages were not made: the compare pages already carry those price tables,
so extra pages would be near duplicates. Competitor facts came from each vendor's own public pages
(WRITING.md rule 2's JSON files are not on this box); every URL and its check date is in
sources/wave-4.md.

Technical: Organization sameAs hook (empty until TODO(andrew) below), more AI crawlers named in
robots.txt (Claude-User, Perplexity-User, Applebot, Applebot-Extended, Googlebot, DuckAssistBot,
MistralAI-User), "Last updated" and pricing lines in llms.txt, a redirect stub in vercel.json for
URLs people and assistants guess (/pricing, /about, /features/crm, /septic and others; all
non-permanent until checked against real 404s), and lint checks for duplicate titles and
descriptions.

- TODO(andrew): SmartCrew's official profile URLs (LinkedIn, YouTube, Facebook, X, App Store,
  Google Play) for SAME_AS in render.ts.
- TODO(andrew): file storage: how permissions are set (by role, job or file), storage limits per
  plan, file types, offline access (see the comment at the top of
  pages/feature/construction-file-storage.ts).
- TODO(andrew): once the Webflow site is replaced, make the stub redirects permanent and add any
  404s that AI referrals land on.

## Audit steps (from the @wespreadjam 14-step AEO audit and Nicholas Dulait's AEO guide)

Rerun quarterly: check AI crawlers aren't blocked (robots, CDN, firewall); confirm pages render
without JavaScript; run the prompt set in ChatGPT, Perplexity, Google AI Mode and Claude and log
who gets cited; check each page opens with a direct answer; check headings are questions with a
standalone answer under each; check schema (Organization, Article, FAQ, Breadcrumb) validates;
check freshness dates and sitemap lastmod; check entity consistency (same name, description and
facts everywhere, sameAs); check comparison and pricing coverage; check third-party mentions
(reviews, directories, Reddit, YouTube); check internal links; check llms.txt; track AI referral
traffic; fix what's missing and repeat.

Best-practice references: Google Search Central, "AI features and your website"
(https://developers.google.com/search/docs/appearance/ai-features); OpenAI crawlers
(https://platform.openai.com/docs/bots); Ahrefs on AI search optimization.

## No-penalty checklist (check before every merge)

- Every page answers a distinct query; no near duplicate or city/keyword swap pages (doorways).
- Unique title and description per page (the lint fails on duplicates).
- Canonical is the page's own www.smartcrewhq.com URL; preview host is noindex.
- Same HTML for bots and people: no cloaking, no hidden text, no keyword stuffing.
- No fake reviews, ratings or aggregateRating schema; no invented competitor features or prices.
- Competitor facts link to the vendor's own page, with the check date in sources/.
- Anything uncertain is labelled uncertain on the page; "Not listed", never "doesn't have".
- No em dashes; new copy writes ranges as "5 to 100", not with en dashes.

## Still missing in the library (wave 5 candidates)

- Third-party listings and reviews (Capterra, G2, Reddit, YouTube): needs Andrew.
- vs pages: ClockShark vs busybusy, Raken vs Fieldwire, if search demand shows up.
- Fleetio comparison: its pricing page didn't load for us on October 22, 2026.

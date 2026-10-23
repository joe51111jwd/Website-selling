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

## Still missing in the library (wave 4 candidates)

- Comparison and pricing pages need the competitor JSON files (WRITING.md rule 2), which are not on
  this box: ClockShark pricing, busybusy pricing, HCSS vs busybusy.
- Trades: septic, drilling, paving, demolition, trucking, aggregate.
- Features: sales and CRM, file storage.

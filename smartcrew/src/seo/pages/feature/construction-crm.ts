import type { SeoPage } from "../../types";

export const page: SeoPage = {
  kind: "feature",
  slug: "features/construction-crm",
  nav: "Sales & CRM",
  keyword: "construction crm for contractors",
  updated: "2026-10-22",
  title: "Construction CRM for Excavation Contractors | SmartCrew",
  description:
    "A construction CRM for dirt work contractors: leads and a sales pipeline, bid and opportunity tracking, follow-up reminders, and won bids that become jobs.",
  eyebrow: "Sales & CRM",
  h1: "Construction CRM for excavation and heavy civil contractors",
  lede:
    "A construction CRM keeps every lead and bid in one pipeline, with follow-up reminders, so an owner knows what is out for bid and what to chase this week. SmartCrew includes a Sales & CRM category, with leads and a sales pipeline, bid and opportunity tracking, and follow-ups and reminders, in the same app as time, equipment and job costing. It does not do estimating or takeoff; the number on the bid still comes from your estimating method.",
  summary: [
    "Most small dirt contractors run sales out of an inbox, a phone and the owner's memory. Bids get sent and never chased.",
    "A pipeline shows each bid as a card with its value and close date, moving from lead to in progress, proposal sent and negotiation.",
    "Follow-ups and reminders make sure a bid gets a call after it goes out.",
    "Sales & CRM is a Premium category in SmartCrew. It replaces a separate CRM like HubSpot or Close for many contractors.",
  ],
  hero: [{ id: "web-pipeline" }],
  blocks: [
    { t: "h2", text: "What is a construction CRM?" },
    {
      t: "p",
      text: "A construction CRM is a list of every customer, lead and bid, organized as a pipeline so you can see what stage each one is in and what to do next. A general CRM is built around sales calls and email sequences. A contractor's sales are different: a builder calls about a site, you walk it, price it, send a proposal, and then wait. The bids that are won are often the ones somebody followed up on.",
    },
    {
      t: "p",
      text: "For a company with 5 to 100 people, the owner or an estimator usually does the selling between running jobs. That's why the CRM should live in the same app the company already opens every day, not in a separate tool nobody logs into.",
    },

    { t: "h2", text: "How does SmartCrew's sales pipeline work?" },
    {
      t: "p",
      text: "SmartCrew's sales pipeline shows each bid or lead as a card that moves through stages: lead, in progress, proposal sent and negotiation, with the value and close date on the card. The office sees the total value at each stage and which bids are close to a decision.",
    },
    {
      t: "steps",
      steps: [
        { title: "Add the lead", text: "A builder, developer, homeowner or town calls about a job. Add them as a lead with the job and their contact details." },
        { title: "Track the bid", text: "When you walk the site and start pricing, move the card to in progress. Add the value when you have it." },
        { title: "Send the proposal", text: "When the bid goes out, move it to proposal sent and set a follow-up reminder." },
        { title: "Follow up", text: "SmartCrew reminds you to call. Notes from the call stay on the card." },
        { title: "Win and run the job", text: "A won bid becomes work for the crews, tracked in the same app with time, machines, loads and job cost against the bid." },
      ],
    },
    {
      t: "shots",
      shots: [{ id: "web-pipeline" }, { id: "phone-messages" }],
      caption: "The sales pipeline with bids by stage, value and close date, and the sales chat channel on a phone. (Demo account; names and numbers are made up.)",
    },

    { t: "h2", text: "Why does a dirt work company need follow-up reminders?" },
    {
      t: "p",
      text: "A dirt work company needs follow-up reminders because most bids are sent while the owner is also running crews, and a bid without a follow-up call is easy to lose to a competitor who called. A reminder on each proposal turns \"I'll call them next week\" into a task that shows up on the day.",
    },
    {
      t: "note",
      title: "Worked example (not a statistic)",
      text: "Say you send 10 proposals a month and normally win 2. If a follow-up call on each one wins you a third job every other month, that is 6 more jobs a year from the same bidding work. Your own numbers will differ; the point is that following up costs a phone call, and the bid itself took hours.",
    },
    { t: "cta", title: "See your bids and your jobs in one app", text: "A short call with Andrew: he shows the pipeline with your own bid stages." },

    { t: "h2", text: "What should a contractor look for in a construction CRM?" },
    {
      t: "table",
      caption: "Construction CRM checklist for a 5 to 100 person dirt work company",
      head: ["What to look for", "Why it matters", "SmartCrew"],
      rows: [
        ["Pipeline by stage", "You see what's out, what's close and what's stalled.", { mark: "yes", note: "Lead, in progress, proposal sent, negotiation" }],
        ["Bid value and close date", "You can plan crews and machines for the work that's coming.", { mark: "yes" }],
        ["Follow-ups and reminders", "Bids get chased.", { mark: "yes" }],
        ["Same app as the field", "No second login, and won bids flow into job tracking.", { mark: "yes", note: "Time, equipment, hauling, job costing" }],
        ["Estimating and takeoff", "The bid number has to come from somewhere.", { mark: "no", note: "Use your estimating tool" }],
        ["Email marketing sequences", "Useful for high-volume selling, rarely for heavy civil.", { mark: "unknown", note: "Not part of SmartCrew's listed features" }],
      ],
      note: "Feature availability varies by plan. Fleet Management, Sales CRM, and Scheduling & Communications are Premium categories.",
    },

    { t: "h2", text: "Does SmartCrew replace HubSpot or Close?" },
    {
      t: "p",
      text: "SmartCrew replaces HubSpot or Close for many dirt work contractors, because what they use a CRM for is a pipeline of bids and reminders to follow up. If your company runs marketing email campaigns or a large inside sales team, a dedicated CRM still has more tools for that. SmartCrew's angle is that sales sit next to the work: the same app holds the job once it is won.",
    },

    { t: "h2", text: "How does a won bid connect to job costing?" },
    {
      t: "p",
      text: "A won bid connects to job costing because the bid becomes the job's budget, and SmartCrew tracks labor, materials, equipment, other costs and change orders against that budget as the crew works. The [job costing](features/construction-job-costing) page shows that side. Over time you learn which kinds of bids make money, which is the best input for the next pipeline.",
    },
    {
      t: "shots",
      shots: [{ id: "web-projects" }, { id: "web-project-detail" }],
      caption: "Jobs grouped by status, and a job page with budget against spent. (Demo account.)",
    },

    { t: "h2", text: "How do you get started with SmartCrew's CRM?" },
    {
      t: "p",
      text: "You get started with a short call with Andrew Drish, SmartCrew's founder. The team sets up the account, moves your information over, organizes workflows and trains your people. Most companies are up and running within a few weeks. Pricing depends on your company size and the features you need; it's built to be well below enterprise construction software. You get a number on a short call with Andrew.",
    },
  ],
  faqs: [
    {
      q: "What is the best CRM for an excavation company?",
      a: "For a dirt work company with 5 to 100 people, a CRM built into the app the company already uses for crews and jobs, like SmartCrew's Sales & CRM, gets used more than a separate tool. Companies that run email marketing at volume may still want a dedicated CRM.",
    },
    {
      q: "Does SmartCrew have a sales pipeline?",
      a: "Yes. Leads and bids show as cards that move from lead to in progress, proposal sent and negotiation, with the value and close date.",
    },
    {
      q: "Does SmartCrew do estimating?",
      a: "No. SmartCrew does not do estimating or takeoff. It tracks bids and opportunities in the pipeline and tracks the job against the bid once it is won.",
    },
    {
      q: "Is Sales & CRM included in every SmartCrew plan?",
      a: "No. Feature availability varies by plan, and Sales CRM is a Premium category.",
    },
    {
      q: "Can SmartCrew remind me to follow up on a bid?",
      a: "Yes. Follow-ups and reminders are part of SmartCrew's Sales & CRM.",
    },
    {
      q: "How much does SmartCrew's CRM cost?",
      a: "Pricing depends on your company size and the features you need; it's built to be well below enterprise construction software. You get a number on a short call with Andrew.",
    },
  ],
  related: ["features/construction-job-costing", "features/crew-scheduling-software", "guides/construction-software-pricing", "excavation-software", "guides/what-is-smartcrew"],
};

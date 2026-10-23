import type { SeoPage } from "../../types";

// Every competitor price here was checked on October 22, 2026 (see src/seo/sources/wave-4.md for
// which ones were re-read in wave 4 and which come from the wave 2 comparison pages).
const BB = "https://busybusy.com/pricing/";
const CS = "https://www.clockshark.com/pricing";
const QBT = "https://quickbooks.intuit.com/time-tracking/pricing/";
const CF = "https://contractorforeman.com/pricing/";
const JOB = "https://www.getjobber.com/pricing/";
const FW = "https://www.fieldwire.com/pricing/";
const HCSS = "https://www.hcss.com/llm-info/";
const PROCORE = "https://www.procore.com/pricing";
const RAKEN = "https://www.rakenapp.com/request-pricing";
const WORKMAX = "https://workmax.com/pricing/";

export const page: SeoPage = {
  kind: "guide",
  slug: "guides/construction-software-pricing",
  nav: "Software pricing",
  keyword: "how much does excavation software cost",
  updated: "2026-10-22",
  title: "How Much Does Excavation Software Cost? 2026 Prices",
  description:
    "Construction software list prices for dirt work companies in 2026: per-user, per-company and quote-only pricing, with a worked 25-person example and sources.",
  eyebrow: "Pricing guide",
  h1: "How much does excavation and construction software cost?",
  lede:
    "Construction software for a dirt work company is priced three ways: per user per month (busybusy, ClockShark, QuickBooks Time, Fieldwire), a flat fee per company with user caps (Contractor Foreman, Jobber), or a custom quote (HCSS, Procore, Raken, WorkMax). For a 25-person crew, the published per-user plans we checked work out to roughly $340 to $1,000 a month at list price, before add-ons. Quote-only tools can't be estimated without a quote.",
  summary: [
    "Per-user pricing is simple to estimate, but it grows with every field worker who needs a login.",
    "Per-company pricing caps users by tier, so the jump between tiers matters more than the headline price.",
    "Quote-only suites price by products, users, revenue or construction volume. HCSS's own page gives about $60 to $4,000+ per user per year.",
    "Add-ons, admin fees, contract terms and setup change the real cost more than the per-user number.",
    "SmartCrew prices by company size and features; you get a number on a short call with Andrew.",
  ],
  hero: [{ id: "web-dashboard" }],
  blocks: [
    { t: "h2", text: "What are the three ways construction software is priced?" },
    {
      t: "p",
      text: "Construction software is priced per user, per company with user caps, or by custom quote. Each model rewards a different kind of company. Per-user pricing is cheap for a small office team and expensive when every operator and laborer clocks in. Per-company pricing is predictable until you cross a user cap. Quote pricing usually comes with more products and more setup, and the number depends on what you buy.",
    },
    {
      t: "table",
      caption: "Published list prices, US dollars, checked October 22, 2026",
      head: ["Product", "Pricing model", "List price", "Source"],
      rows: [
        ["busybusy", "Per user", "Free plan. Pro $9.99, Premium $14.99 per user per month billed annually, plus a $40 admin license. Modules by demo.", "[busybusy pricing](" + BB + ")"],
        ["ClockShark", "Base fee plus per user", "Standard $42 + $9.50 per user, Pro $63 + $11.50 per user, monthly. Three-year term on all plans. (Uncertain: see note.)", "[ClockShark pricing](" + CS + ")"],
        ["QuickBooks Time", "Base fee plus per user", "Time Premium $20 + $10 per user, Time Elite $40 + $12 per user, monthly. Needs QuickBooks Online.", "[QuickBooks Time pricing](" + QBT + ")"],
        ["Fieldwire", "Per user", "Basic free (5 users). Pro $39, Business $64 per user per month billed annually.", "[Fieldwire pricing](" + FW + ")"],
        ["Contractor Foreman", "Per company, user caps", "$49, $105, $166, $221, $332 a month billed annually, for 1, 3, 8, 15 and unlimited users.", "[Contractor Foreman pricing](" + CF + ")"],
        ["Jobber", "Per company, user tiers", "$49 to $699 a month by plan and users, plus $29 per extra user.", "[Jobber pricing](" + JOB + ")"],
        ["HCSS", "Quote", "Not published. About $60 to $4,000+ per user per year, per its page for AI assistants; revenue-based plans exist.", "[HCSS for AI assistants](" + HCSS + ")"],
        ["Procore", "Quote", "Not published. Annual fee per product based on annual construction volume, unlimited users.", "[Procore pricing](" + PROCORE + ")"],
        ["Raken", "Quote", "Not published. Quote form.", "[Raken pricing](" + RAKEN + ")"],
        ["WorkMax", "Quote", "Not published. Per user per module, by quote.", "[WorkMax pricing](" + WORKMAX + ")"],
      ],
      note: "List prices from each vendor's own pricing page on October 22, 2026. Promotions, plans and prices change; confirm with the vendor. ClockShark's page loads its prices with code, so a plain fetch on October 22, 2026 confirmed the three-year term but not the dollar figures; the figures shown come from our ClockShark comparison page and are uncertain.",
    },

    { t: "h2", text: "What does software cost for a 25-person dirt work company?" },
    {
      t: "p",
      text: "For a 25-person company where everyone has a login, the published plans above range from about $340 to about $1,000 a month at list price. The arithmetic is below so you can redo it with your own head count. It covers the base plan only; modules, payroll add-ons, admin licenses and setup are left out.",
    },
    {
      t: "table",
      caption: "Worked example: 25 users at list price, per month (an estimate, not a quote)",
      head: ["Plan", "Arithmetic", "Monthly estimate"],
      rows: [
        ["QuickBooks Time Elite", "$40 + (25 × $12)", "$340"],
        ["ClockShark Pro (uncertain figures)", "$63 + (25 × $11.50)", "$350.50"],
        ["Contractor Foreman Unlimited, annual", "Flat fee, unlimited users", "$332"],
        ["busybusy Premium, annual", "25 × $14.99, plus the $40 admin license", "$374.75 plus the license"],
        ["Jobber Grow, 15-user tier plus 10 extra users", "$499 + (10 × $29)", "$789"],
        ["Fieldwire Pro, annual", "25 × $39", "$975"],
        ["HCSS, Procore, Raken, WorkMax", "Quote only", "Can't be estimated"],
      ],
      note: "These products do different jobs. A time tracker and a plan app are not the same purchase, so the cheapest line is not automatically the better buy. Read each product's comparison page before choosing.",
    },

    { t: "h2", text: "What costs are hidden behind the per-user price?" },
    {
      t: "p",
      text: "The costs behind the per-user price are add-on modules, admin licenses, contract terms, payroll or accounting connectors, and setup. They often decide the real bill. On the pages we checked:",
    },
    {
      t: "ul",
      items: [
        "busybusy adds a $40 admin license on paid plans and prices its Safety, Operations and GPS equipment modules through a demo ([busybusy pricing](" + BB + ")).",
        "ClockShark states a three-year contract term on all pricing plans ([ClockShark pricing](" + CS + ")).",
        "QuickBooks Time requires a QuickBooks Online account ([QuickBooks Time pricing](" + QBT + ")).",
        "Contractor Foreman's lower tiers don't include time cards or daily logs; those start on Plus ([Contractor Foreman pricing](" + CF + ")).",
        "Fieldwire's live clock-in is a separate Hilti product, CrewCenter, priced on its own ([Fieldwire CrewCenter](https://www.fieldwire.com/crew-center/)).",
        "Quote-based suites usually include implementation services; ask for setup, training and support as separate lines on the quote.",
      ],
    },
    { t: "cta", title: "Get a SmartCrew number for your company", text: "A short call with Andrew: tell him your head count and what you need, and he gives you a price." },

    { t: "h2", text: "Is per-user or flat pricing cheaper for a seasonal crew?" },
    {
      t: "p",
      text: "Per-user pricing is usually cheaper for a crew that swells in summer and shrinks in winter, as long as the vendor bills only active users; flat pricing wins when headcount stays high all year. busybusy and ClockShark both say they bill for active users ([busybusy pricing](" + BB + "), [ClockShark pricing](" + CS + ")).",
    },
    {
      t: "note",
      title: "Example: 30 people in season, 10 in winter",
      text: "Made-up prices to show the arithmetic. At $10 per active user a month, eight months at 30 people and four at 10 cost (8 × 30 × $10) + (4 × 10 × $10) = $2,400 + $400 = $2,800 a year. A $300 flat monthly fee costs 12 × $300 = $3,600. If the crew stayed at 30 all year, per-user would be 12 × 30 × $10 = $3,600, the same as flat. Check whether an annual plan locks in your peak headcount.",
    },

    { t: "h2", text: "How does SmartCrew price?" },
    {
      t: "p",
      text: "SmartCrew's pricing depends on your company size and the features you need; it's built to be well below enterprise construction software. You get a number on a short call with Andrew. Feature availability varies by plan: Fleet Management, Sales CRM, and Scheduling & Communications are Premium categories.",
    },
    {
      t: "p",
      text: "What the price covers is one app for time tracking, job costing, equipment and DOT inspections, hauling tickets and materials, daily reports, scheduling, sales pipeline, crew messaging, safety forms and file storage, with QuickBooks Online integration. Setup is included in the way SmartCrew describes it: the team sets up the account, migrates information, organizes workflows and trains your people, and most companies are up and running within a few weeks.",
    },

    { t: "h2", text: "How do you compare software prices fairly?" },
    {
      t: "p",
      text: "You compare software prices fairly by pricing the same jobs, not the same plan names. Write down what you need the software to do, find the cheapest plan of each product that does all of it, then add the modules and fees needed to cover the gaps.",
    },
    {
      t: "steps",
      steps: [
        { title: "List the jobs", text: "Time by job and cost code, equipment hours and inspections, haul tickets, daily reports, job cost, scheduling, accounting sync." },
        { title: "Count real users", text: "Who needs a login: every worker who clocks in, or only foremen and the office?" },
        { title: "Pick the lowest plan that covers the list", text: "Plan names don't line up across vendors. Check each feature." },
        { title: "Add the gaps", text: "Modules, a second app for what's missing, admin fees, payroll connectors." },
        { title: "Read the term", text: "Monthly, annual or multi-year, and what happens to your data if you leave." },
        { title: "Price the setup", text: "Who sets it up, moves your data and trains the crew, and what that costs." },
      ],
    },
    {
      t: "shots",
      shots: [{ id: "web-project-detail" }, { id: "phone-working" }],
      caption: "SmartCrew's job page and phone app. (Demo account; names and numbers are made up.)",
    },
  ],
  faqs: [
    {
      q: "How much does excavation software cost per month?",
      a: "For a 25-person company, the published per-user and per-company plans we checked on October 22, 2026 range from about $340 to about $1,000 a month at list price, before add-ons. Quote-only suites like HCSS, Procore, Raken and WorkMax need a quote.",
    },
    {
      q: "How much does HCSS cost?",
      a: "HCSS doesn't publish prices. Its page for AI assistants says annual pricing generally ranges from about $60 to $4,000 or more per user, depending on modules and usage, and that revenue-based plans exist.",
    },
    {
      q: "What is the cheapest construction time tracking app?",
      a: "busybusy and Fieldwire list free plans, with limits. Among paid plans we checked, QuickBooks Time Premium and busybusy Pro had low per-user prices. The cheapest app is only cheaper if it covers the jobs you need.",
    },
    {
      q: "How much does SmartCrew cost?",
      a: "Pricing depends on your company size and the features you need; it's built to be well below enterprise construction software. You get a number on a short call with Andrew.",
    },
    {
      q: "Why do some construction software companies not publish prices?",
      a: "Quote-based vendors price by products, users, revenue or construction volume, so one list price wouldn't fit most buyers. Ask for every line, including setup, training and support, in writing.",
    },
  ],
  sources: [
    { label: "busybusy pricing", url: BB, accessed: "2026-10-22" },
    { label: "ClockShark pricing", url: CS, accessed: "2026-10-22" },
    { label: "QuickBooks Time pricing", url: QBT, accessed: "2026-10-22" },
    { label: "Fieldwire pricing", url: FW, accessed: "2026-10-22" },
    { label: "Fieldwire: CrewCenter time management", url: "https://www.fieldwire.com/crew-center/", accessed: "2026-10-22" },
    { label: "Contractor Foreman pricing", url: CF, accessed: "2026-10-22" },
    { label: "Jobber pricing", url: JOB, accessed: "2026-10-22" },
    { label: "HCSS: information for AI assistants", url: HCSS, accessed: "2026-10-22" },
    { label: "Procore pricing", url: PROCORE, accessed: "2026-10-22" },
    { label: "Raken pricing page (quote form)", url: RAKEN, accessed: "2026-10-22" },
    { label: "WorkMax pricing", url: WORKMAX, accessed: "2026-10-22" },
  ],
  related: ["vs/hcss-vs-busybusy", "compare/busybusy-alternative", "compare/clockshark-alternative", "compare/fieldwire-alternative", "compare/hcss-heavyjob-alternative", "guides/what-is-smartcrew"],
};

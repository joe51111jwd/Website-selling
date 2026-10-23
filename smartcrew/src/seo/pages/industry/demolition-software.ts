import type { SeoPage } from "../../types";

export const page: SeoPage = {
  kind: "industry",
  slug: "demolition-software",
  nav: "Demolition",
  keyword: "demolition contractor software",
  updated: "2026-10-22",
  title: "Demolition Contractor Software: Crews, Loads, Safety | SmartCrew",
  description:
    "Demolition contractor software for crew hours, excavator and attachment hours, debris and scrap loads, JSAs and incident reports, and job cost, in one app.",
  eyebrow: "Demolition software",
  h1: "Software for demolition contractors",
  lede:
    "Demolition contractor software tracks crew time, machine hours, every load of debris or scrap off the site, and the safety paperwork a demo job needs, all against the job budget. SmartCrew does that for demolition companies with 5 to 100 people, in one app built for dirt work and heavy civil trades. It does not do estimating, survey work or hazardous material testing; it tracks the job once you win it.",
  summary: [
    "On a demolition job the money is in loads out. Disposal and trucking can outweigh labor, so every ticket matters.",
    "Safety paperwork is daily: a JSA before work starts, toolbox talks, and an incident report if anything happens.",
    "SmartCrew logs crew and machine hours by phase, every load with material and yards, and JSAs and incident reports with photos.",
    "SmartCrew does not test for asbestos or lead, plan structural sequences or do estimating. It runs the daily side of the job.",
  ],
  hero: [{ id: "phone-incident-report" }, { id: "web-d-hauling" }],
  blocks: [
    { t: "h2", text: "What does a demolition contractor need from software?" },
    {
      t: "p",
      text: "A demolition contractor needs software that keeps three things on each job: the loads leaving the site, the hours of the crew and the machines, and the safety records. A building comes down once, but it leaves in hundreds of truck loads of concrete, wood, mixed debris and steel. Each load has a disposal or recycling cost, and steel may bring money back.",
    },
    {
      t: "p",
      text: "Demolition also carries more safety exposure than most dirt work. A JSA for the day's work, toolbox talks and quick incident reports with photos are not paperwork for its own sake. They are what you show a customer, an insurer or an inspector when something goes wrong.",
    },
    {
      t: "table",
      caption: "What a demolition company tracks, and where SmartCrew records it",
      head: ["What to track", "Why it matters on a demo job", "Where it lives in SmartCrew"],
      rows: [
        ["Loads out by material", "Concrete, mixed debris and steel go to different places at different costs.", "[Hauling](features/hauling-software): tickets with truck, project, import or export, material, yards and pit or yard."],
        ["Crew and machine hours", "Excavators with shears, breakers and grapples are the core cost.", "[Time tracking](features/construction-time-tracking) and [equipment](features/heavy-equipment-maintenance-software)."],
        ["JSAs and toolbox talks", "The record that the hazards were reviewed before work started.", "[Safety](features/construction-safety-app): JSAs, toolbox talks and safety meetings."],
        ["Incidents and near misses", "Fast, dated reports with photos protect people and the company.", "[Safety](features/construction-safety-app): incident reports for injury, near miss or damage, with photos."],
        ["Cost against the bid", "Disposal overruns show up late if you wait for invoices.", "[Job costing](features/construction-job-costing): budget against spent, daily."],
      ],
      note: "Feature availability varies by plan. Fleet Management, Sales CRM, and Scheduling & Communications are Premium categories.",
    },

    { t: "h2", text: "How should a demolition company track debris and scrap loads?" },
    {
      t: "p",
      text: "A demolition company should log every load leaving the site on a digital ticket, with the truck, the material, the yards and where it went. In SmartCrew the driver logs the load on the phone, and a photo of a landfill, transfer station or scrap yard ticket is enough for the AI reader to enter the data.",
    },
    {
      t: "p",
      text: "Sorting by material is what makes the log useful. When concrete, mixed debris and steel are logged apart, the office can compare disposal cost to the bid by material and see if the sorting on site is paying off.",
    },
    {
      t: "note",
      title: "Worked example (not a statistic)",
      text: "Say a job is bid with 60 loads of mixed debris at a disposal cost per load you know from your landfill. If the hauling log shows 45 loads with a third of the building still standing, the job is on pace for about 68 loads (45 ÷ 2/3 = 67.5). That is 8 loads over, and you see it while you can still sort harder or talk to the customer.",
    },
    {
      t: "shots",
      shots: [{ id: "phone-hauling" }, { id: "web-d-hauling" }],
      caption: "Logging a load on a phone, and the hauling log by job. (Demo account; names and numbers are made up.)",
    },

    { t: "h2", text: "How do you handle demolition safety paperwork in the field?" },
    {
      t: "p",
      text: "You handle demolition safety paperwork on the phone: the foreman fills out the JSA before work starts, runs the toolbox talk, and anyone can file an incident report with photos on the spot. SmartCrew keeps JSAs, toolbox talks and safety meetings, and incident reports for injury, near miss or damage, tied to the job.",
    },
    {
      t: "p",
      text: "Company announcements reach every phone too, so a change in the site plan or a new exclusion zone goes out to the whole crew at once. The [construction safety app](features/construction-safety-app) page covers the forms in more detail.",
    },
    {
      t: "shots",
      shots: [{ id: "phone-incident-report" }, { id: "web-messaging" }],
      caption: "An incident report on a phone, and company announcements including a toolbox talk. (Demo account.)",
    },
    { t: "cta", title: "Put loads and safety on the same job", text: "A short call with Andrew: he sets SmartCrew up around your crews, machines and disposal sites." },

    { t: "h2", text: "How do you track demolition machine and attachment hours?" },
    {
      t: "p",
      text: "You track machine hours by having the operator pick the machine at clock-in and switch with Log & Switch when they change machines. Attachments like shears and breakers wear fast, so service requests from the field matter. SmartCrew keeps each machine's hours, last and next service and inspection log, and the shop queue shows what is waiting with urgency and status.",
    },
    {
      t: "shots",
      shots: [{ id: "web-equipment" }, { id: "web-service-queue" }],
      caption: "The equipment list with hours, and the service queue. (Demo account.)",
    },

    { t: "h2", text: "What should a demolition contractor ask a software vendor?" },
    {
      t: "ol",
      items: [
        "Can drivers log loads by material, and can a disposal ticket photo fill in the data?",
        "Are JSAs, toolbox talks and incident reports on the phone, with photos, tied to the job?",
        "Can operators switch machines mid-shift without a new timecard?",
        "Does the job page show disposal and trucking against the bid while the job runs?",
        "Does it connect to my accounting? (SmartCrew: QuickBooks Online today.)",
        "Does it handle hazmat surveys or testing? (SmartCrew does not.)",
      ],
    },

    { t: "h2", text: "What SmartCrew does not do for a demolition company" },
    {
      t: "p",
      text: "SmartCrew does not do hazardous material surveys or testing, engineering or demolition sequence planning, estimating or takeoff, telematics hardware, payroll processing or ELD hours of service. Keep your specialists and tools for those. SmartCrew sends payroll-ready time to QuickBooks Online; it does not run payroll itself.",
    },

    { t: "h2", text: "How do you get started with SmartCrew?" },
    {
      t: "p",
      text: "You get started with a short call with Andrew Drish, SmartCrew's founder. The team sets up the account, moves your information over, organizes workflows and trains your people, and most companies are up and running within a few weeks. Pricing depends on your company size and the features you need; it's built to be well below enterprise construction software. You get a number on a short call with Andrew.",
    },
  ],
  faqs: [
    {
      q: "What is the best software for a demolition contractor?",
      a: "For a demolition company with 5 to 100 people, an app that keeps loads out, crew and machine hours, safety forms and job cost on one job, like SmartCrew, covers the daily work. Estimating and hazmat surveys need other tools.",
    },
    {
      q: "Can SmartCrew track scrap steel and debris loads separately?",
      a: "Yes. Each haul ticket records the material, yards, truck, project and the pit or yard, so loads can be sorted by material.",
    },
    {
      q: "Does SmartCrew have JSAs and incident reports?",
      a: "Yes. SmartCrew includes JSAs, toolbox talks and safety meetings, and incident reports for injury, near miss or damage, with photos.",
    },
    {
      q: "Does SmartCrew do demolition estimating?",
      a: "No. SmartCrew does not do estimating or takeoff. It tracks the job after it is sold.",
    },
    {
      q: "How much does SmartCrew cost for a demolition company?",
      a: "Pricing depends on your company size and the features you need; it's built to be well below enterprise construction software. You get a number on a short call with Andrew.",
    },
  ],
  related: ["excavation-software", "trucking-software", "features/construction-safety-app", "features/hauling-software", "guides/what-is-smartcrew"],
};

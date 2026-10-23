import type { SeoPage } from "../../types";

export const page: SeoPage = {
  kind: "industry",
  slug: "aggregate-software",
  nav: "Aggregate & pits",
  keyword: "aggregate pit software",
  updated: "2026-10-22",
  title: "Aggregate Pit and Quarry Operations Software | SmartCrew",
  description:
    "Software for small aggregate pits and gravel operations: loads and yards out by material, loader and crusher hours, crew time, inspections and repairs.",
  eyebrow: "Aggregate software",
  h1: "Software for aggregate pits and gravel operations",
  lede:
    "Aggregate operations software tracks what leaves the pit by material and yards, the hours of the loaders, crushers and trucks, and the crew time behind it, so a pit owner can see production and cost by day. SmartCrew does that for contractors and pit operators with 5 to 100 people, in one app built for dirt work and heavy civil trades. It is not a scale house system and does not run truck scales, sales tickets or MSHA reporting.",
  summary: [
    "A small pit sells and uses material by the load. Knowing what left, of which material, for which job, is the base of everything else.",
    "Loaders and crushers run long hours in dust. Inspections and service requests keep them running.",
    "SmartCrew logs loads with material, yards and source pit, machine hours, crew hours by activity, and repairs through the shop queue.",
    "SmartCrew does not connect to truck scales, run point-of-sale tickets or file MSHA reports. Keep a scale system if you weigh and sell at the gate.",
  ],
  hero: [{ id: "web-d-hauling" }, { id: "web-equipment" }],
  blocks: [
    { t: "h2", text: "What does an aggregate pit need from software?" },
    {
      t: "p",
      text: "An aggregate pit needs software that records every load out by material and destination, and the machine and crew hours it took to produce it. Many dirt contractors own a pit or a stockpile yard and feed their own jobs from it: fill, screened topsoil, crushed stone, riprap. When the pit and the jobs are tracked in different places, nobody knows what the stone really cost.",
    },
    {
      t: "p",
      text: "SmartCrew's hauling log records the source pit on every load. That one field is what links the pit to the jobs. The office can see how many yards of each material left a pit in a week and which projects took them.",
    },
    {
      t: "table",
      caption: "What a pit operation tracks, and where SmartCrew records it",
      head: ["What to track", "Why it matters at a pit", "Where it lives in SmartCrew"],
      rows: [
        ["Loads and yards by material", "Production and sales are counted in loads and yards of each product.", "[Hauling](features/hauling-software): material, yards, source pit, truck and project on every ticket."],
        ["Loader, excavator and crusher hours", "These machines are the cost of making the product.", "[Equipment](features/heavy-equipment-maintenance-software): hours, locations and utilization."],
        ["Crew hours by activity", "Loading, crushing, screening and stockpiling are different work.", "[Time tracking](features/construction-time-tracking): activity codes and machines at clock-in."],
        ["Inspections and repairs", "Dust and long hours wear machines fast.", "Daily and DOT inspections, service requests and the shop queue."],
        ["Fuel", "Fuel is a large share of the cost of a yard of stone.", "Materials and fuel logs, with the AI reader for receipt photos."],
      ],
      note: "Feature availability varies by plan. Fleet Management, Sales CRM, and Scheduling & Communications are Premium categories.",
    },

    { t: "h2", text: "How do you track what leaves the pit?" },
    {
      t: "p",
      text: "You track what leaves the pit by logging each load on a digital ticket with the material, the yards, the truck, the destination project and the source pit. Drivers log loads on the phone, or snap a photo of a paper ticket and SmartCrew's AI reader enters the data. The office sees the log as it fills in.",
    },
    {
      t: "p",
      text: "Filtering the log by pit and material gives a simple production picture: yards of crushed stone out this week, yards of fill, and which jobs used them. Filtering by project shows the same loads from the job side, so material from your own pit shows up in that job's cost.",
    },
    {
      t: "shots",
      shots: [{ id: "web-d-hauling" }, { id: "phone-hauling" }],
      caption: "The hauling log with material, yards and source pit, and a load being logged on a phone. (Demo account; names and numbers are made up.)",
    },

    { t: "h2", text: "How do you know what a yard of your own stone costs?" },
    {
      t: "p",
      text: "You know what a yard of your own stone costs by adding up the crew hours, machine hours and fuel spent at the pit over a period and dividing by the yards that left. SmartCrew holds each of those inputs: time by activity, machine hours, the fuel log and the hauling log by pit.",
    },
    {
      t: "note",
      title: "Worked example (not a statistic)",
      text: "Say one week at the pit took 80 crew hours, 60 loader hours, 40 crusher hours and the fuel on the log, and 3,000 yards of crushed stone left on the tickets. Multiply each hour total by your own rates, add the fuel, and divide by 3,000. If the answer is close to what you charge your own jobs for stone, the pit is breaking even on that product. If it is above, the jobs are getting a discount they don't know about.",
    },
    { t: "cta", title: "Link your pit to your jobs", text: "A short call with Andrew: he sets SmartCrew up around your pits, machines and materials." },

    { t: "h2", text: "How do you keep loaders and crushers running?" },
    {
      t: "p",
      text: "You keep loaders and crushers running with daily inspections on the phone and service requests for every problem, so the shop sees issues before a breakdown. SmartCrew keeps each machine's hours, last and next service and inspection log, and the service queue lists each request with urgency and status. Utilization rates show which machines sit and which never stop.",
    },
    {
      t: "shots",
      shots: [{ id: "web-service-queue" }, { id: "phone-dot" }],
      caption: "The service queue, and an inspection on a phone. (Demo account.)",
    },

    { t: "h2", text: "Do you need a scale house system as well?" },
    {
      t: "p",
      text: "You need a scale house system as well if you weigh trucks and sell material by the ton to outside customers at the gate. SmartCrew does not connect to truck scales or print scale tickets. It fits pits that move material by the load and yard to their own jobs or to a few known customers, and it can read the scale ticket from a photo after the fact.",
    },

    { t: "h2", text: "What should a pit operator ask a software vendor?" },
    {
      t: "ol",
      items: [
        "Does every load carry the source pit, material and yards?",
        "Can I see loads out by pit and material, and the same loads by job?",
        "Can loader and crusher operators log hours by activity?",
        "Do failed inspections reach the shop as service requests?",
        "Does it connect to my truck scale? (SmartCrew does not.)",
        "Does it connect to my accounting? (SmartCrew: QuickBooks Online today.)",
      ],
    },

    { t: "h2", text: "What SmartCrew does not do for an aggregate operation" },
    {
      t: "p",
      text: "SmartCrew does not run truck scales, scale house tickets or point of sale, mine planning, MSHA reporting, telematics hardware, payroll processing or ELD hours of service. It sends payroll-ready time to QuickBooks Online. Large quarries that sell by the ton to many outside buyers need a dedicated aggregate sales system.",
    },

    { t: "h2", text: "How do you get started with SmartCrew?" },
    {
      t: "p",
      text: "You get started with a short call with Andrew Drish, SmartCrew's founder. The team sets up the account, moves your information over, organizes workflows and trains your people, and most companies are up and running within a few weeks. Pricing depends on your company size and the features you need; it's built to be well below enterprise construction software. You get a number on a short call with Andrew.",
    },
  ],
  faqs: [
    {
      q: "What is the best software for a small gravel pit?",
      a: "For a contractor or operator with 5 to 100 people that moves material by the load, an app that logs loads by pit and material and tracks the machines and crew behind them, like SmartCrew, fits well. A pit that weighs and sells at a scale also needs a scale house system.",
    },
    {
      q: "Does SmartCrew connect to truck scales?",
      a: "No. SmartCrew does not connect to scales or print scale tickets. Its AI reader can enter data from a photo of a scale or supplier ticket.",
    },
    {
      q: "Can SmartCrew track which job used material from my pit?",
      a: "Yes. Each haul ticket records the source pit and the project, so the same loads show by pit and by job.",
    },
    {
      q: "Does SmartCrew do MSHA reporting?",
      a: "No. SmartCrew has JSAs, toolbox talks and incident reports, but it does not file MSHA reports.",
    },
    {
      q: "How much does SmartCrew cost for an aggregate operation?",
      a: "Pricing depends on your company size and the features you need; it's built to be well below enterprise construction software. You get a number on a short call with Andrew.",
    },
  ],
  related: ["trucking-software", "features/hauling-software", "features/heavy-equipment-maintenance-software", "paving-software", "guides/what-is-smartcrew"],
};

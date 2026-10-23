import type { SeoPage } from "../../types";

export const page: SeoPage = {
  kind: "industry",
  slug: "grading-software",
  nav: "Grading",
  keyword: "grading contractor software",
  updated: "2026-10-22",
  title: "Grading Contractor Software for Dirt Work | SmartCrew",
  description:
    "What a grading contractor needs from software: dozer and scraper hours by phase, cut and fill trucking, daily notes and job cost against the bid, in one app.",
  eyebrow: "Grading software",
  h1: "Software for grading contractors",
  lede:
    "Grading contractor software tracks the hours, machines, truck loads and job costs behind every cut, fill and pad, so a grading company knows each day if a job is on budget. For a grading company with 5 to 100 people, SmartCrew puts GPS time by activity code, machine hours, haul tickets and budget against actual in one app built only for dirt work and heavy civil trades. It does not replace GPS machine control or takeoff software; it tracks the job once you've won it.",
  summary: [
    "On a grading job, machine hours and trucking usually cost more than labor. Software that only tracks people misses most of the money.",
    "Split the bid into activity codes like strip, mass cut, fill and compact, fine grade and pads, so hours land on the phase that used them.",
    "SmartCrew logs who ran which machine on which phase, every load in or out with yards and source pit, and the daily notes behind it.",
    "SmartCrew does not do GPS machine control, grade checking or takeoff. Keep those tools and use SmartCrew for time, machines, loads and cost.",
  ],
  hero: [{ id: "phone-select-task" }, { id: "web-project-detail" }],
  blocks: [
    { t: "h2", text: "What does a grading contractor need from software?" },
    {
      t: "p",
      text: "A grading contractor needs software that ties crew hours, machine hours and truck loads to the phase of the job they were spent on. A grading bid is built from quantities: yards to strip, yards to cut, yards to place and compact, square feet of fine grade. The job makes or loses money on how many machine hours and loads each of those quantities really took.",
    },
    {
      t: "p",
      text: "Most grading companies already have a takeoff tool for the bid and machine control on the dozers. The gap is in the middle: who ran the D6 on Tuesday, whether those hours were mass cut or fine grade, and how many loads of export left the site. That middle is where SmartCrew sits.",
    },
    {
      t: "table",
      caption: "What a grading company tracks, and where SmartCrew records it",
      head: ["What to track", "Why it matters on a grading job", "Where it lives in SmartCrew"],
      rows: [
        ["Operator hours by phase", "Strip, mass cut, fill, fine grade and pads are priced apart. Hours lumped on one job number hide the phase that ran over.", "[Time tracking](features/construction-time-tracking): the worker picks project, activity code and machine at clock-in."],
        ["Machine hours", "Dozers, scrapers, excavators, rollers and graders are the biggest cost line on most grading jobs.", "[Equipment](features/heavy-equipment-maintenance-software): hours, locations, inspections, service requests and the shop queue."],
        ["Import and export loads", "An unbalanced site means paying for every load of dirt or stone in or out.", "[Hauling](features/hauling-software): digital tickets with truck, import or export, material, yards and source pit."],
        ["Production notes", "A wet week or a changed plan is the record behind a change order.", "[Daily reports](features/construction-daily-report-app): progress and production logs, photos and field notes."],
        ["Budget against actual", "The bid is the budget. You want the gap while there's still dirt to move.", "[Job costing](features/construction-job-costing): labor, materials, equipment, other and change orders against the bid, daily."],
      ],
      note: "Feature availability varies by plan. Fleet Management, Sales CRM, and Scheduling & Communications are Premium categories.",
    },

    { t: "h2", text: "How do you track grading hours by phase?" },
    {
      t: "p",
      text: "You track grading hours by phase with activity codes that match the lines of your bid. Set codes such as clearing, strip topsoil, mass cut, fill and compact, fine grade, building pad and stone base. At clock-in the operator picks the project, the activity code and the machine on the phone.",
    },
    {
      t: "p",
      text: "When the operator gets off the dozer and onto the roller, Log & Switch changes the task and machine in two taps. The hours split where the work split. Nobody rebuilds the week from memory on Friday, and the payroll-ready timecard already carries the codes.",
    },
    {
      t: "shots",
      shots: [{ id: "phone-select-task" }, { id: "phone-working" }],
      caption: "Picking the project, activity and machine at clock-in, and an operator on the clock. (Demo account; names and numbers are made up.)",
    },

    { t: "h2", text: "How should a grading company track cut and fill trucking?" },
    {
      t: "p",
      text: "A grading company should log every load on a digital haul ticket at the time it moves, with the truck, the job, import or export, the material, the yards and the source pit. Paper tickets get wet, lost and keyed in late, and a missing load is money you can't bill or can't explain.",
    },
    {
      t: "p",
      text: "In SmartCrew the driver logs the load on the phone. If the ticket comes from a pit or a supplier, a photo is enough: the AI reader enters the data from the ticket or receipt photo. The office sees the hauling log by job, so the yards hauled can be held up against the yards in the bid.",
    },
    {
      t: "note",
      title: "Worked example (not a statistic)",
      text: "Take a pad bid at 4,000 yards of export in 14-yard trucks. That's about 286 loads (4,000 ÷ 14). If the hauling log shows 330 loads with a week of export left, the job is already over on trucking, and you know it before the invoice from the trucking sub shows up.",
    },
    {
      t: "shots",
      shots: [{ id: "phone-hauling" }, { id: "web-d-hauling" }],
      caption: "A driver logging a load, and the office hauling log with yards and source pit. (Demo account.)",
    },
    { t: "cta" },

    { t: "h2", text: "How do you keep grading machines running?" },
    {
      t: "p",
      text: "You keep grading machines running by doing daily and DOT inspections on the phone and turning every failed item into a service request the shop can see. SmartCrew keeps each machine's hours, mileage, last and next service and inspection log. The shop queue shows each request with its urgency and status.",
    },
    {
      t: "p",
      text: "Machine hours from the time records also show utilization. A scraper that sat for three weeks on a job is a cost the bid didn't plan for, and a reason to move it.",
    },
    {
      t: "shots",
      shots: [{ id: "web-equipment" }, { id: "phone-dot" }],
      caption: "The equipment list with hours and service, and a daily inspection on a phone. (Demo account.)",
    },

    { t: "h2", text: "What should a grading contractor ask a software vendor?" },
    {
      t: "ol",
      items: [
        "Can an operator change machine and activity code in the middle of a shift without a new timecard?",
        "Can drivers log loads with yards, material and source pit, and can a photo of a ticket fill in the data?",
        "Does the job page show budget against actual for labor, equipment and materials while the job is still open?",
        "Do inspections that fail turn into service requests on their own?",
        "Does it connect to my accounting? (SmartCrew: QuickBooks Online today.)",
        "Who sets it up and trains my crew, and how long does that take?",
      ],
    },

    { t: "h2", text: "What SmartCrew does not do for a grading company" },
    {
      t: "p",
      text: "SmartCrew does not do takeoff or estimating, GPS machine control, grade checking, telematics hardware, payroll processing or ELD hours of service. Keep your takeoff software and your machine control system. SmartCrew sends payroll-ready time to QuickBooks Online; it does not run payroll itself.",
    },

    { t: "h2", text: "Why a grading company founder built SmartCrew" },
    {
      t: "quote",
      text: "We only run 20-30 guys and there was nothing specifically designed for our size of heavy civil business.",
      who: "Andrew Drish, founder of SmartCrew",
    },
    {
      t: "p",
      text: "Andrew Drish's family has been in construction for 75 years and runs Drish Construction with 20 to 30 people. SmartCrew came out of that company's own week: time apps that were too basic and enterprise software that was too complicated and expensive for a crew that size.",
    },

    { t: "h2", text: "How to get started with SmartCrew" },
    {
      t: "p",
      text: "Getting started begins with a short call with Andrew. The SmartCrew team sets up the account, moves your information over, organizes workflows and trains your people, and most companies are up and running within a few weeks. Pricing depends on your company size and the features you need; it's built to be well below enterprise construction software. You get a number on a short call with Andrew.",
    },
  ],
  faqs: [
    {
      q: "What is the best software for a grading contractor?",
      a: "For a grading company with 5 to 100 people that runs its own machines and trucks, an all-in-one app that ties operator hours, machine hours, haul tickets and job cost to each phase, like SmartCrew, replaces several separate tools. Keep a takeoff tool for bidding and machine control on the iron.",
    },
    {
      q: "Does SmartCrew do GPS machine control for dozers?",
      a: "No. SmartCrew does not do GPS machine control, grade checking or telematics hardware. It tracks who ran which machine, on which job and phase, for how long.",
    },
    {
      q: "Can SmartCrew track yards of import and export?",
      a: "Yes. Each digital haul ticket records the truck, project, import or export, material, yards and source pit, and the AI reader can fill it in from a photo of the ticket.",
    },
    {
      q: "Can I see if a grading job is over budget before it ends?",
      a: "Yes. The job page shows budget against spent for labor, materials, equipment, other and change orders, with hours by employee and a cost codes tab, updated as the crew works.",
    },
    {
      q: "Does SmartCrew work with QuickBooks?",
      a: "Yes, with QuickBooks Online today. QuickBooks Desktop, Foundation and ADP integrations are in the works.",
    },
    {
      q: "How much does grading software cost with SmartCrew?",
      a: "Pricing depends on your company size and the features you need; it's built to be well below enterprise construction software. You get a number on a short call with Andrew.",
    },
  ],
  related: ["excavation-software", "site-work-software", "features/hauling-software", "features/heavy-equipment-maintenance-software", "guides/what-is-smartcrew"],
};

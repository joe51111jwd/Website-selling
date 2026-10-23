import type { SeoPage } from "../../types";

export const page: SeoPage = {
  kind: "industry",
  slug: "paving-software",
  nav: "Paving",
  keyword: "paving contractor software",
  updated: "2026-10-22",
  title: "Paving Contractor Software for Asphalt Crews | SmartCrew",
  description:
    "Paving contractor software for asphalt crews: tons from plant tickets, paver and roller hours, truck loads, crew time by phase and job cost per day, in one app.",
  eyebrow: "Paving software",
  h1: "Software for paving contractors",
  lede:
    "Paving contractor software tracks the tons, truck loads, paver and roller hours and crew time behind each paving day, so you can see if a job is making money while the mix is still hot. SmartCrew does that for paving companies with 5 to 100 people, in one app built for dirt work and heavy civil trades, from base stone to final lift. It does not do estimating, takeoff or plant control; it tracks the job after you win it.",
  summary: [
    "Paving is a race against the plant and the weather. A day with trucks waiting or a crew standing by costs the same as a full day.",
    "Track the work by phase: milling, base stone, binder, surface, and the cleanup and striping prep after.",
    "SmartCrew logs crew hours by phase, paver and roller hours, and every plant or stone ticket, with a photo of the ticket filling in the data.",
    "SmartCrew does not run a plant, do takeoff or control machines. It keeps time, loads, machines and cost on one job page.",
  ],
  hero: [{ id: "phone-hauling" }, { id: "web-project-detail" }],
  blocks: [
    { t: "h2", text: "What does a paving contractor need from software?" },
    {
      t: "p",
      text: "A paving contractor needs software that puts the plant tickets, truck loads, crew hours and machine hours of each day on the same job, so tons placed can be checked against the bid. Material is often the largest line on a paving job, and the tickets for it arrive by the dozen. A missing ticket is either tons you can't bill or tons you can't explain.",
    },
    {
      t: "p",
      text: "The second need is timing. A paving crew, a paver, two rollers and a string of trucks all cost money by the hour. When the plant runs late or rain stops the job at 10 a.m., you want the record of what happened, written on that day.",
    },
    {
      t: "table",
      caption: "What a paving company tracks, and where SmartCrew records it",
      head: ["What to track", "Why it matters on a paving job", "Where it lives in SmartCrew"],
      rows: [
        ["Tons and loads from the plant", "Mix is bought by the ton and billed by the ton or the yard. Every ticket counts.", "[Hauling](features/hauling-software): digital tickets, and the AI reader enters data from ticket photos."],
        ["Crew hours by phase", "Milling, base, binder and surface are often priced apart.", "[Time tracking](features/construction-time-tracking): project, activity code and machine at clock-in."],
        ["Paver, roller and mill hours", "These machines are expensive to own and to leave idle.", "[Equipment](features/heavy-equipment-maintenance-software): hours, locations, inspections and service."],
        ["Weather and delays", "A rain-out or a late plant is the record for a schedule change or extra charge.", "[Daily reports](features/construction-daily-report-app): production logs, photos and notes."],
        ["Cost against the bid", "Tons placed against tons bid tells you the yield, and the job page tells you the margin.", "[Job costing](features/construction-job-costing): budget against spent for labor, materials, equipment and change orders."],
      ],
      note: "Feature availability varies by plan. Fleet Management, Sales CRM, and Scheduling & Communications are Premium categories.",
    },

    { t: "h2", text: "How should a paving company handle plant tickets?" },
    {
      t: "p",
      text: "A paving company should capture every plant ticket on the day it is issued, attached to the job, instead of collecting a stack at the end of the week. In SmartCrew the driver or the foreman takes a photo of the ticket and the AI reader enters the data for you. Loads can also be logged by hand with the truck, project, material and quantity.",
    },
    {
      t: "p",
      text: "The office then sees material by job as the day goes on. If the base stone tickets on a parking lot add up to more than the bid quantity before the binder starts, you know to look at grade and depth that week.",
    },
    {
      t: "note",
      title: "Worked example (not a statistic)",
      text: "Take a lot bid at 1,200 square yards of 2-inch surface. At a common rule of thumb of about 110 pounds per square yard per inch, that is 1,200 × 2 × 110 = 264,000 pounds, or 132 tons. If the tickets show 150 tons placed, the job used about 14% more mix than planned (150 ÷ 132 = 1.136). Check the rule of thumb against your own mix and compaction before using it.",
    },
    {
      t: "shots",
      shots: [{ id: "phone-hauling" }, { id: "web-materials" }],
      caption: "Logging a load on a phone, and materials by project and vendor in the office. (Demo account; names and numbers are made up.)",
    },

    { t: "h2", text: "How do you track a paving crew's hours by phase?" },
    {
      t: "p",
      text: "You track a paving crew's hours by phase with activity codes that match your bid lines, chosen on the phone at clock-in. Common codes are mobilize, mill, fine grade base, tack, binder, surface, hand work and cleanup. The paver operator picks the paver; the roller operators pick their rollers.",
    },
    {
      t: "p",
      text: "When the crew moves from the lot to a driveway down the road, Log & Switch changes the job and task in two taps. Payroll-ready timecards then carry the codes, and the weekly summary goes to the office with Submit Timecard.",
    },
    {
      t: "shots",
      shots: [{ id: "phone-select-task" }, { id: "web-timecards" }],
      caption: "Picking the job, activity and machine, and the week's timecards in the office. (Demo account.)",
    },
    { t: "cta", title: "Get your plant tickets off the dashboard", text: "A short call with Andrew: he sets SmartCrew up around your crews, pavers and phases." },

    { t: "h2", text: "How do you schedule paving crews around the plant and the weather?" },
    {
      t: "p",
      text: "You schedule paving crews with a drag-and-drop board that shows each crew and machine by day, and send changes to the crew's phones the moment the plan moves. SmartCrew's scheduling covers crew, job and equipment assignments with schedule updates and notifications. When rain moves Tuesday's lot to Thursday, the crew sees it on the phone, and [crew messaging](features/crew-communication-app) handles the details.",
    },

    { t: "h2", text: "How do you keep pavers and rollers running?" },
    {
      t: "p",
      text: "You keep pavers and rollers running with daily inspections on the phone, service requests for anything that fails, and a shop queue that shows what is waiting. SmartCrew keeps each machine's hours, last and next service and inspection log. Trucks that haul mix get DOT inspections in the same app.",
    },

    { t: "h2", text: "What should a paving contractor ask a software vendor?" },
    {
      t: "ol",
      items: [
        "Can a ticket photo fill in the load data, or does someone key every ticket?",
        "Can material be seen by job during the day, not at month end?",
        "Can operators change machine and phase mid-shift on a phone?",
        "Can schedule changes reach the crew's phones right away?",
        "Does it connect to my accounting? (SmartCrew: QuickBooks Online today.)",
        "Does it do estimating or takeoff? (SmartCrew does not; keep your estimating tool.)",
      ],
    },

    { t: "h2", text: "What SmartCrew does not do for a paving company" },
    {
      t: "p",
      text: "SmartCrew does not do estimating or takeoff, plant management, GPS machine control, telematics hardware, payroll processing or ELD hours of service. Keep your estimating software and any plant system. SmartCrew sends payroll-ready time to QuickBooks Online; it does not run payroll itself.",
    },

    { t: "h2", text: "How do you get started with SmartCrew?" },
    {
      t: "p",
      text: "You get started with a short call with Andrew Drish, SmartCrew's founder. The team sets up the account, moves your information over, organizes workflows and trains your people, and most companies are up and running within a few weeks. Pricing depends on your company size and the features you need; it's built to be well below enterprise construction software. You get a number on a short call with Andrew.",
    },
  ],
  faqs: [
    {
      q: "What is the best software for a small paving company?",
      a: "For a paving company with 5 to 100 people, an app that ties plant tickets, crew hours by phase, machine hours and job cost together, like SmartCrew, replaces paper tickets and separate time apps. Keep a separate estimating tool for bids.",
    },
    {
      q: "Can SmartCrew read asphalt plant tickets?",
      a: "SmartCrew's AI reader enters data from photos of tickets and receipts, so the crew does not have to type each one. Check the entries on your own ticket format during setup.",
    },
    {
      q: "Can I track tons placed against the bid?",
      a: "Yes. Material tickets attach to the job, and the job page shows materials against budget along with labor, equipment and change orders.",
    },
    {
      q: "Does SmartCrew do paving estimates?",
      a: "No. SmartCrew does not do estimating or takeoff. It tracks the job once it is sold: time, loads, machines, reports and cost.",
    },
    {
      q: "How much does SmartCrew cost for a paving contractor?",
      a: "Pricing depends on your company size and the features you need; it's built to be well below enterprise construction software. You get a number on a short call with Andrew.",
    },
  ],
  related: ["site-work-software", "grading-software", "features/hauling-software", "features/crew-scheduling-software", "aggregate-software", "guides/what-is-smartcrew"],
};

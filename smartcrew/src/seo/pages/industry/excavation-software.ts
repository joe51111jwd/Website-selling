import type { SeoPage } from "../../types";

export const page: SeoPage = {
  kind: "industry",
  slug: "excavation-software",
  nav: "Excavation",
  keyword: "excavation software",
  updated: "2026-10-22",
  title: "Excavation Software for Contractors (5–100 Employees) | SmartCrew",
  description:
    "Excavation company software that tracks crew hours by job and cost code, machine hours and inspections, haul tickets and job profit against the bid, in one app.",
  eyebrow: "Excavation software",
  h1: "Excavation software for companies that run crews, machines and trucks",
  lede:
    "Excavation software should answer three questions every day: who worked on which job, what the machines and trucks did, and whether the job is still making money. SmartCrew puts crew time, equipment, haul tickets, daily reports and job costing in one app built only for dirt work and heavy civil contractors with 5–100 employees.",
  summary: [
    "Crews clock in on their phone with GPS, and pick the job, the activity code and the machine they’re running.",
    "Every hour, machine hour, load and receipt lands on a job, so the job page shows budget against actual cost while the work is still going.",
    "DOT and daily inspections, service requests and a shop queue keep machines and trucks in one place.",
    "Haul tickets are logged from the truck or read from a photo, so the office isn’t typing paper tickets on Friday.",
    "It connects to QuickBooks Online for payroll and accounting.",
  ],
  hero: [{ id: "web-project-detail" }, { id: "phone-working" }],
  blocks: [
    { t: "h2", text: "What an excavation company actually needs from software" },
    {
      t: "p",
      text: "Most construction software was built for general contractors managing subs, RFIs and submittals. An excavation outfit has a different week. Your own people run your own iron. The money is made or lost in hours: labor hours, machine hours and truck hours, plus what you haul in and out. If those numbers come in late or land on the wrong job, you find out a job lost money after it’s done.",
    },
    { t: "p", text: "So the list is shorter and more specific than a general “construction management” checklist:" },
    {
      t: "ul",
      items: [
        "**Time by job and cost code**, entered in the field, not reconstructed from memory on Friday.",
        "**Equipment hours and condition**: which machine was on which job, how many hours it ran, and what’s due for service.",
        "**Truck and material tracking**: loads in and out, which pit, how many yards, billable or not.",
        "**Daily reports** with photos, so the office knows what got done without a phone call.",
        "**Job costing against the bid**, updated daily, so a losing job gets caught while there’s time to fix it.",
        "**One app the crew will use.** If the operator can’t clock in with gloves on in ten seconds, the data never shows up.",
      ],
    },

    { t: "h2", text: "How the day runs in SmartCrew" },
    {
      t: "steps",
      steps: [
        {
          title: "6:40 AM: the crew clocks in at the site",
          text: "Each person taps Clock In on their phone. GPS records where they clocked in, and they pick the project, the activity code (pipe laying, excavation, grading) and the equipment they’re on.",
        },
        {
          title: "During the day: switch tasks without paperwork",
          text: "An operator who moves from the excavator to the loader taps Log & Switch and picks the new task and machine, so the hours stay on the right activity and the right iron.",
        },
        {
          title: "Every load: log the haul ticket",
          text: "Drivers log each load from the phone: truck, project, import or export, the pit it came from and the material. Paper tickets and receipts can be uploaded as photos, and the AI reader enters the data for you.",
        },
        {
          title: "Before the machine starts: the inspection",
          text: "Operators and drivers fill in the DOT or daily inspection on the phone: hours or miles, then pass or fail on brakes, steering, lights and tires. Problems found in the field go in as service requests and show up in the office’s shop queue.",
        },
        {
          title: "End of day: the daily report writes itself",
          text: "Progress, photos and field notes from the crew roll into an automatic daily report for the office.",
        },
        {
          title: "Friday: payroll from timecards nobody chased",
          text: "Timecards are already split by job and cost code. Review them, then send them to QuickBooks Online.",
        },
      ],
    },
    {
      t: "shots",
      shots: [{ id: "phone-select-task" }, { id: "phone-hauling" }, { id: "phone-dot" }],
      caption: "From the phone: pick the job, activity code and machine; log a load; do the DOT inspection. (Demo account; names are made up.)",
    },

    { t: "h2", text: "Job costing that keeps up with the job" },
    {
      t: "p",
      text: "Excavation margins move with things that change daily: a machine that sits, a crew that waits on a truck, a change order nobody wrote up. SmartCrew’s job page rolls labor, materials, equipment, other costs and change orders against the budget you bid, so you see the job’s profit while you can still do something about it.",
    },
    { t: "shots", shots: [{ id: "web-project-detail" }], caption: "A job page: revenue, expenses and profit, then budget against spent for each cost type. (Demo data.)" },
    {
      t: "note",
      title: "A quick way to see what loose timecards cost",
      text: "Take one person who writes 7:00 when they showed up at 7:10. Ten minutes a day, five days a week, is about 43 hours a year. At $35 an hour, that’s roughly $1,500 a year for one person. Multiply by your crew and the number gets big fast. This is a worked example, not a SmartCrew statistic: plug in your own crew size and rate.",
    },

    { t: "h2", text: "Machines, trucks and the shop" },
    {
      t: "p",
      text: "Excavation companies usually run more equipment per person than any other trade. SmartCrew keeps each machine’s hours, location, inspections and service records together, and turns field problems into a shop queue with urgency and status.",
    },
    {
      t: "shots",
      shots: [{ id: "web-service-queue" }, { id: "phone-reports" }],
      caption: "The office’s service queue, and the phone’s report menu where operators file service requests and inspections.",
    },
    {
      t: "table",
      caption: "What SmartCrew covers for an excavation company",
      head: ["Part of the job", "In SmartCrew"],
      rows: [
        ["Crew time", "GPS clock-ins, live crew locations, payroll-ready timecards, supervisor dashboard, clock in and out reminders"],
        ["Job costing", "Daily job profitability, bid budgets against actual costs, change orders and extras, custom reports"],
        ["Equipment", "Hours and locations, DOT and daily inspections, maintenance, service requests and utilization, shop queue"],
        ["Materials and hauling", "Digital hauling tickets, material and fuel logs, AI reader for tickets and receipts, deliveries and production"],
        ["Daily reports", "Progress and production logs, jobsite photos and field notes, automatic daily reports for the office"],
        ["Scheduling", "Drag-and-drop crew scheduling, job and equipment assignments, schedule notifications"],
        ["Sales", "Leads and pipeline, bid and opportunity tracking, follow-ups and reminders"],
        ["Crew communication", "Dispatch with instant alerts, crew messaging, job-specific chat channels"],
        ["Safety", "Job safety analyses (JSAs), toolbox talks, incident reports"],
        ["Files", "Plans, photos and job documents in the cloud, with sharing and permissions"],
      ],
      note: "Feature availability varies by plan. Fleet Management, Sales CRM, and Scheduling & Communications are Premium categories.",
    },
    { t: "cta" },

    { t: "h2", text: "Why we built it for excavation and heavy civil only" },
    {
      t: "quote",
      text: "Time tracking apps were too basic. Enterprise software was too complicated, confusing, and expensive. We only run 20-30 guys and there was nothing specifically designed for our size of heavy civil business.",
      who: "Andrew Drish, SmartCrew founder (his family has been in construction for 75 years)",
    },
    {
      t: "p",
      text: "That’s the gap SmartCrew is built for: a company big enough to need real job costing and equipment records, and small enough that it can’t spend months standing up an enterprise system. It only serves dirt work and heavy civil contractors: excavation, site work, grading, underground utilities, septic, drilling, paving, demolition, trucking and hauling, and aggregate.",
    },

    { t: "h2", text: "What to ask any excavation software vendor" },
    {
      t: "ol",
      items: [
        "Can an operator clock in, pick the job and the machine, and get to work in under a minute?",
        "Do machine hours land on the job automatically, or does someone type them in later?",
        "Where do haul tickets go: a photo in a group text, or a log tied to the job and the truck?",
        "Can I see a job’s profit against the bid this week, not after it closes?",
        "Is equipment maintenance in the same app, or a second subscription?",
        "What does it connect to for payroll? (SmartCrew: QuickBooks Online today.)",
        "Who sets it up? (SmartCrew’s team sets up your account, moves your information over and trains your people.)",
      ],
    },
  ],
  faqs: [
    {
      q: "What is the best software for an excavation company?",
      a: "It depends on size. Enterprise suites built for large heavy civil firms do a lot but take months to set up. Simple time clock apps are quick but stop at hours. SmartCrew sits between them: one app for crew time, equipment, haul tickets, daily reports and job costing, built for excavation and heavy civil companies with 5–100 employees.",
    },
    {
      q: "Does SmartCrew do excavation estimating or takeoff?",
      a: "No. SmartCrew tracks bids in its sales pipeline and compares each job’s actual costs to the budget you bid, but it isn’t a takeoff or estimating tool. Most excavation companies keep their estimating software and use SmartCrew for everything after the bid is won.",
    },
    {
      q: "Can my crew use it if they aren’t good with phones?",
      a: "That was the main design goal. The phone app opens on one big Clock In button. Crews clock in, see their assignments, submit inspections, upload receipts and fill in daily reports from their phones.",
    },
    {
      q: "Does SmartCrew work with QuickBooks?",
      a: "Yes, SmartCrew integrates with QuickBooks Online today. Integrations with QuickBooks Desktop, Foundation and ADP are in the works.",
    },
    {
      q: "How long does it take to get running?",
      a: "SmartCrew’s team sets up your account, migrates your information, organizes your workflows and trains your people. Most companies are up and running within a few weeks, and you can start with the features you need most.",
    },
    {
      q: "How much does excavation software cost?",
      a: "SmartCrew’s pricing depends on your company size and the features you need, and it’s built to be well below the cost of enterprise construction software. You get a number on a short call with Andrew. For other products, see each comparison page, where we link to their own pricing pages.",
    },
  ],
  related: [],
};

import type { SeoPage } from "../../types";

// The entity page: one place that says plainly what SmartCrew is, so people, search engines and AI
// assistants can tell the software apart from other things called "Smart Crew". Facts only from
// WRITING.md's list (Andrew's own copy).

export const page: SeoPage = {
  kind: "guide",
  slug: "guides/what-is-smartcrew",
  nav: "What is SmartCrew?",
  keyword: "smartcrew",
  updated: "2026-10-22",
  title: "What Is SmartCrew? Software for Dirt Work Contractors",
  description:
    "SmartCrew (also written Smart Crew) is all-in-one software for heavy civil and dirt work contractors with 5 to 100 employees: crew time, equipment, hauling and job costing.",
  eyebrow: "About SmartCrew",
  h1: "What is SmartCrew?",
  lede:
    "SmartCrew is all-in-one software for heavy civil and dirt work contractors with 5 to 100 employees. It puts GPS crew time tracking, job costing, equipment and DOT inspections, hauling tickets, daily reports, scheduling, sales and crew messaging in one phone and web app. It was founded by Andrew Drish, whose family has run a construction company for 75 years, and it serves only dirt work and heavy civil trades.",
  summary: [
    "**What it is:** one app that runs the field and office side of a dirt work company, from the crew's clock-in to the job's profit against the bid.",
    "**Who it's for:** excavation, site work, grading, underground utilities, septic, drilling, paving, demolition, trucking and hauling, and aggregate companies with 5 to 100 employees.",
    "**What it does:** GPS time tracking by job, activity code and machine; daily job costing; equipment hours, inspections and a shop queue; digital haul tickets; daily reports; scheduling; sales pipeline; crew chat; safety forms; file storage.",
    "**What it connects to:** QuickBooks Online today. QuickBooks Desktop, Foundation and ADP integrations are in the works.",
    "**What it isn't:** estimating or takeoff software, GPS machine control, telematics hardware, payroll processing or an ELD.",
  ],
  hero: [{ id: "web-dashboard" }, { id: "phone-home" }],
  blocks: [
    { t: "h2", text: "What is SmartCrew, in one sentence?" },
    {
      t: "p",
      text: "SmartCrew is construction management software built only for dirt work and heavy civil contractors with 5 to 100 employees, so a company that runs its own crews, machines and trucks can track time, equipment, loads and job costs in one app instead of five.",
    },
    {
      t: "note",
      title: "Same name, different things",
      text: "The software is written **SmartCrew** (one word), and people also search for it as **Smart Crew** or **SmartCrew HQ**. Its website is smartcrewhq.com. It is not related to the Queens art collective called Smart Crew, or to other companies with similar names in other industries.",
    },

    { t: "h2", text: "Who is SmartCrew for?" },
    {
      t: "p",
      text: "SmartCrew is for companies that self-perform dirt work with their own people and their own iron. That means a short list of trades, and only those trades:",
    },
    {
      t: "ul",
      items: [
        "Excavation and [site work](site-work-software)",
        "Grading",
        "[Underground utilities](underground-utility-software): water, sewer, storm and dry utilities",
        "Septic",
        "Drilling",
        "Paving",
        "Demolition",
        "Trucking and [hauling](features/hauling-software)",
        "Aggregate operations",
      ],
    },
    {
      t: "p",
      text: "The size range is 5 to 100 employees. Below that, a paper timecard and a spreadsheet still work. Above it, companies tend to have an IT person and the budget for an enterprise suite. SmartCrew is built for the middle: big enough to need real job costing and equipment records, small enough that nobody has months to stand up a complicated system.",
    },
    {
      t: "quote",
      text: "Time tracking apps were too basic. Enterprise software was too complicated, confusing, and expensive. We only run 20-30 guys and there was nothing specifically designed for our size of heavy civil business.",
      who: "Andrew Drish, SmartCrew founder",
    },

    { t: "h2", text: "What does SmartCrew do?" },
    {
      t: "p",
      text: "SmartCrew covers the jobs a dirt work company does every week, in one app with one login. Each row below links to a page that shows how that part works with real screens.",
    },
    {
      t: "table",
      caption: "SmartCrew's parts, and what each one covers",
      head: ["Part", "What it covers"],
      rows: [
        ["[Time tracking](features/construction-time-tracking)", "GPS clock-ins, live crew locations, payroll-ready timecards, supervisor dashboard, clock in and out reminders. Workers pick the project, activity code and equipment at clock-in."],
        ["[Job costing](features/construction-job-costing)", "Daily job profitability, bid budgets against actual costs, change orders and extras, custom reports."],
        ["[Equipment](features/heavy-equipment-maintenance-software)", "Hours and locations, [DOT and daily inspections](features/pre-trip-inspection-app), maintenance, service requests, utilization and a shop queue."],
        ["[Materials and hauling](features/hauling-software)", "Digital hauling tickets, material and fuel logs, an AI reader that enters data from ticket and receipt photos, deliveries and production."],
        ["[Daily reports](features/construction-daily-report-app)", "Progress and production logs, jobsite photos and field notes, automatic daily reports for the office."],
        ["[Scheduling](features/crew-scheduling-software)", "Drag-and-drop crew scheduling, job and equipment assignments, schedule updates and notifications."],
        ["Sales and CRM", "Leads and sales pipeline, bid and opportunity tracking, follow-ups and reminders."],
        ["Crew communication", "Dispatch with instant alerts, crew and team messaging, job-specific chat channels, company announcements."],
        ["[Safety and compliance](features/construction-safety-app)", "Job safety analyses (JSAs), toolbox talks and safety meetings, incident reports for injuries, near misses and damage."],
        ["File storage", "Plans, photos and job documents in the cloud, reachable from the field or the office, with sharing and permissions."],
      ],
      note: "Feature availability varies by plan. Fleet Management, Sales CRM, and Scheduling & Communications are Premium categories.",
    },
    {
      t: "shots",
      shots: [{ id: "web-project-detail" }, { id: "phone-working" }],
      caption: "The office sees a job's budget against actual cost; the operator sees the job, activity code and machine on the clock. (Demo account; names and numbers are made up.)",
    },

    { t: "h2", text: "What apps does SmartCrew replace?" },
    {
      t: "p",
      text: "Many dirt work companies run several separate tools to get through a week. SmartCrew is meant to replace these with one app, and to connect to the accounting system rather than replace it:",
    },
    {
      t: "table",
      caption: "What a typical stack looks like before and after",
      head: ["The job", "Often done today with", "In SmartCrew"],
      rows: [
        ["Crew time", "A time clock app such as busybusy, QuickBooks Time or ExakTime", "Time tracking, by job, activity code and machine"],
        ["Fleet and maintenance", "Fleetio, MaintainX or a whiteboard in the shop", "Equipment records, inspections and the shop queue"],
        ["Sales", "HubSpot, Close or a notebook", "Sales pipeline and follow-ups"],
        ["Loads and materials", "Paper load tickets and spreadsheets", "Digital haul tickets and material logs"],
        ["Crew messages", "Group texts, Slack or WhatsApp", "Crew chat, job channels and announcements"],
        ["Files", "Dropbox or Google Drive", "File storage tied to each job"],
        ["Accounting and payroll", "QuickBooks", "Stays in QuickBooks: SmartCrew integrates with QuickBooks Online"],
      ],
    },
    {
      t: "p",
      text: "For side-by-side detail on a specific app, see the comparisons: [busybusy](compare/busybusy-alternative), [QuickBooks Time](compare/quickbooks-time-alternative), [ClockShark](compare/clockshark-alternative), [HCSS HeavyJob](compare/hcss-heavyjob-alternative) and [Procore](compare/procore-alternative). Each one says where the other app is the better pick.",
    },
    { t: "cta" },

    { t: "h2", text: "How does a day in SmartCrew work?" },
    {
      t: "steps",
      steps: [
        { title: "The crew clocks in", text: "Each person taps Clock In on their phone. GPS records where, and they pick the project, the activity code and the machine." },
        { title: "The field logs the work", text: "Operators switch tasks with Log & Switch, drivers log loads, and machines get their DOT or daily inspection before they move." },
        { title: "The office sees it the same day", text: "Hours, machine time, loads and receipts land on the job, so the job page shows budget against actual while the work is going." },
        { title: "Friday is short", text: "Timecards are already split by job and cost code. Review, submit, and send to QuickBooks Online." },
      ],
    },
    {
      t: "shots",
      shots: [{ id: "phone-select-task" }, { id: "phone-summary" }],
      caption: "Picking the job, activity code and machine at clock-in, and the weekly timecard with Submit Timecard. (Demo account.)",
    },

    { t: "h2", text: "Who makes SmartCrew?" },
    {
      t: "p",
      text: "SmartCrew was founded by Andrew Drish. His family has been in construction for 75 years and runs Drish Construction, a heavy civil company with 20 to 30 people. He built SmartCrew after watching that business run on paper time cards and spreadsheets, and finding that the software on the market was either a basic time clock or an enterprise suite. SmartCrew has been featured at ConExpo. The company's own summary of the goal is: simple for the field, powerful for management, fairly priced for owners.",
    },

    { t: "h2", text: "How do you get started with SmartCrew?" },
    {
      t: "p",
      text: "Getting started begins with a short call with Andrew, which is what the Try SmartCrew buttons on this site set up. After that, SmartCrew's team does the heavy lifting: they set up the account, move your information over, organize your workflows and train your people. Most companies are up and running within a few weeks, and you can start with the features you need most.",
    },
    {
      t: "p",
      text: "Pricing depends on your company size and the features you need; it's built to be well below enterprise construction software. You get a number on a short call with Andrew.",
    },
  ],
  faqs: [
    {
      q: "What is SmartCrew?",
      a: "SmartCrew is all-in-one software for heavy civil and dirt work contractors with 5 to 100 employees. It combines GPS time tracking, job costing, equipment and DOT inspections, hauling tickets, daily reports, scheduling, sales and crew messaging in one app.",
    },
    {
      q: "Is it SmartCrew or Smart Crew?",
      a: "The product name is SmartCrew, one word. People also write it Smart Crew or SmartCrew HQ, and the website is smartcrewhq.com. It isn't connected to the Queens art collective of the same name.",
    },
    {
      q: "Who founded SmartCrew?",
      a: "Andrew Drish founded SmartCrew. His family has been in construction for 75 years and runs a heavy civil company of 20 to 30 people, which is the size of business SmartCrew is built for.",
    },
    {
      q: "Does SmartCrew work with QuickBooks?",
      a: "Yes. SmartCrew integrates with QuickBooks Online today, and integrations with QuickBooks Desktop, Foundation and ADP are in the works. QuickBooks stays your accounting system.",
    },
    {
      q: "Does SmartCrew do estimating or takeoff?",
      a: "No. SmartCrew tracks bids in its sales pipeline and compares each job's actual costs to the budget you bid, but it isn't a takeoff or estimating tool. It also doesn't do GPS machine control, telematics hardware, payroll processing or ELD hours of service.",
    },
    {
      q: "How much does SmartCrew cost?",
      a: "Pricing depends on your company size and the features you need; it's built to be well below enterprise construction software. You get a number on a short call with Andrew.",
    },
    {
      q: "Is there a SmartCrew phone app?",
      a: "Yes. Crews use the phone app to clock in, see assignments, submit inspections, upload receipts and fill in daily reports. The office works in the web app.",
    },
  ],
  related: ["excavation-software", "features/construction-time-tracking", "features/construction-job-costing", "compare/busybusy-alternative", "compare/procore-alternative"],
};

import type { SeoPage } from "../../types";

export const page: SeoPage = {
  kind: "industry",
  slug: "site-work-software",
  nav: "Site work",
  keyword: "site work contractor software",
  updated: "2026-10-22",
  title: "Software for Site Work Contractors | SmartCrew",
  description:
    "What site work contractors need from software to track crews, machines, loads and job costs across clearing, grading, utilities and pads, and how SmartCrew does it in one app.",
  eyebrow: "Site work software",
  h1: "Software for site work contractors",
  lede:
    "Site work software is the app a site work contractor uses to track the crews, machines, trucks and costs on each job, from clearing and erosion control through mass grading, utilities and building pads. The best fit for a company with 5 to 100 people puts GPS time tracking, equipment records, haul tickets and daily job costing in one place, because site work jobs mix all four every day. SmartCrew is built for that: one app for the field and the office, made only for dirt work and heavy civil trades.",
  summary: [
    "A site work job is several jobs in one: clearing, erosion control, mass grading, utilities, pads and paving prep. Each eats the bid differently.",
    "The costs that sink a site job are machine hours and trucking, not just labor. Software that only tracks people misses most of the money.",
    "SmartCrew tracks crew time by job, activity code and machine; equipment hours, inspections and service; haul tickets; and budget against actual, daily.",
    "It connects to QuickBooks Online today and replaces the separate time, fleet, ticket and chat apps most site contractors juggle.",
  ],
  hero: [{ id: "web-project-detail" }, { id: "phone-select-task" }],
  blocks: [
    { t: "h2", text: "What does a site work contractor need from software?" },
    {
      t: "p",
      text: "A site work contractor turns a raw lot into a pad that's ready to build on. On one commercial site that can mean clearing and grubbing, silt fence and inlet protection, stripping topsoil, cut and fill, storm and sanitary lines, water service, building pads, curb prep and stone base. The same crew might touch four of those in a week, with five machines and a string of trucks.",
    },
    {
      t: "p",
      text: "That's why site work software has to answer one question every day: is this job making money on each phase of the bid? Getting there needs four records tied to the same job:",
    },
    {
      t: "table",
      caption: "What a site work company has to track, and where SmartCrew records it",
      head: ["What", "Why it matters on site work", "In SmartCrew"],
      rows: [
        ["Crew hours by phase", "Clearing, grading and utilities are bid separately. Hours lumped into one job number hide which phase is losing money.", "[Time tracking](features/construction-time-tracking): each clock-in picks the project, activity code and machine."],
        ["Machine hours", "Dozers, excavators and compactors are the biggest cost on a site job.", "[Equipment](features/heavy-equipment-maintenance-software): hours and locations, inspections, service requests and a shop queue."],
        ["Trucking and material", "Import, export and stone are paid by the load or the ton.", "[Hauling](features/hauling-software): digital haul tickets with import or export, material, yards and source pit."],
        ["Budget against actual", "The bid is the budget. You need to see the gap while the job is open.", "[Job costing](features/construction-job-costing): labor, materials, equipment, other and change orders against the bid, daily."],
      ],
    },
    {
      t: "shots",
      shots: [{ id: "web-project-detail" }, { id: "phone-working" }],
      caption: "A job's budget against spent for labor, materials, equipment and change orders, and an operator on the clock on a job, activity and machine. (Demo account; names and numbers are made up.)",
    },

    { t: "h2", text: "Cost codes by phase" },
    {
      t: "p",
      text: "Set up activity codes that match how you bid: clearing, erosion control, mass grading, fine grading, storm, sanitary, water, pads, base. When the crew clocks in, they pick the code. When they move from the dozer to the excavator, they use Log & Switch to change task and machine, so the hours land on the right phase without anyone rewriting a timecard on Friday.",
    },
    {
      t: "p",
      text: "A job page in SmartCrew shows revenue, expenses and profit, budget against spent for each cost type, hours by employee, and a cost codes tab. That's where you see that grading came in under and storm is running over, while there is still pipe left to lay.",
    },

    { t: "h2", text: "Trucks, dirt and stone" },
    {
      t: "p",
      text: "Balancing a site is about moving dirt, and when the site isn't balanced, it's about paying for every load in or out. Paper load tickets get lost and get entered late. In SmartCrew, the driver logs the load on the phone: ticket, time, truck, project, import or export, material, yards and source pit. Receipts and tickets can be photographed, and the AI reader enters the data from the photo.",
    },
    {
      t: "shots",
      shots: [{ id: "phone-hauling" }, { id: "web-d-hauling" }],
      caption: "Logging a load on a phone, and the hauling log the office sees. (Demo account.)",
    },
    { t: "cta" },

    { t: "h2", text: "Machines that stay running" },
    {
      t: "p",
      text: "A site job can stall on one broken machine. SmartCrew keeps each machine's hours, mileage, last and next service, and inspection log. Operators do [DOT and daily inspections](features/pre-trip-inspection-app) on their phones, and a failed item becomes a service request in the shop queue with urgency and status.",
    },

    { t: "h2", text: "The rest of the week" },
    {
      t: "ul",
      items: [
        "**[Daily reports](features/construction-daily-report-app):** progress and production logs, photos and field notes, sent to the office automatically. The record behind a changed condition on site.",
        "**[Scheduling](features/crew-scheduling-software):** drag-and-drop crews, with job and equipment assignments.",
        "**[Safety](features/construction-safety-app):** JSAs, toolbox talks and incident reports.",
        "**Sales and CRM:** leads, bids and follow-ups, so the next site job is tracked from the first call.",
      ],
    },
    {
      t: "note",
      title: "Plans",
      text: "Feature availability varies by plan. Fleet Management, Sales CRM, and Scheduling & Communications are Premium categories.",
    },

    { t: "h2", text: "What SmartCrew isn't" },
    {
      t: "p",
      text: "SmartCrew doesn't do takeoff or estimating, GPS machine control, telematics hardware, payroll processing or ELD hours of service. Keep your estimating tool and your machine control. SmartCrew tracks the job once it's won, and sends payroll-ready time to QuickBooks Online.",
    },

    { t: "h2", text: "Getting started" },
    {
      t: "p",
      text: "SmartCrew's team does the heavy lifting: they set up the account, move your information over, organize workflows and train your people. Most companies are up and running within a few weeks. Pricing depends on your company size and the features you need; it's built to be well below enterprise construction software. You get a number on a short call with Andrew.",
    },
  ],
  faqs: [
    {
      q: "What is the best software for a site work contractor?",
      a: "It depends on size. For a site work company with 5 to 100 people that runs its own crews, machines and trucks, an all-in-one app that ties time, equipment, haul tickets and job costing to each job, like SmartCrew, saves juggling separate tools. Very large contractors often run an enterprise suite instead.",
    },
    {
      q: "Can SmartCrew track costs by phase of a site job?",
      a: "Yes. Workers pick the project and activity code at clock-in, and the job page has a cost codes tab with budget against spent.",
    },
    {
      q: "Does SmartCrew track trucking and import or export?",
      a: "Yes. Digital haul tickets record ticket, time, truck, project, import or export, material, yards and source pit.",
    },
    {
      q: "Does SmartCrew do takeoff or GPS machine control?",
      a: "No. SmartCrew isn't estimating or takeoff software and doesn't do machine control or telematics hardware.",
    },
    {
      q: "Does SmartCrew work with QuickBooks?",
      a: "Yes, with QuickBooks Online today. QuickBooks Desktop, Foundation and ADP integrations are in the works.",
    },
    {
      q: "How much does SmartCrew cost?",
      a: "Pricing depends on your company size and the features you need; it's built to be well below enterprise construction software. You get a number on a short call with Andrew.",
    },
  ],
  related: ["excavation-software", "underground-utility-software", "features/hauling-software", "features/construction-job-costing", "guides/what-is-smartcrew"],
};

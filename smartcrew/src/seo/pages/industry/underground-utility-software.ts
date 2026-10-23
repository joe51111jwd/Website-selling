import type { SeoPage } from "../../types";

const OSHA_1926_651 = "https://www.ecfr.gov/current/title-29/subtitle-B/chapter-XVII/part-1926/subpart-P/section-1926.651";
const CALL_811 = "https://call811.com/";

// TODO(andrew): confirm whether SmartCrew calculates unit cost (cost per foot) itself. The FAQ only says it gives you the numbers.

export const page: SeoPage = {
  kind: "industry",
  slug: "underground-utility-software",
  nav: "Underground utilities",
  keyword: "underground utility contractor software",
  updated: "2026-10-22",
  title: "Software for Underground Utility Contractors | SmartCrew",
  description:
    "What water, sewer, storm and dry utility contractors need from software: crew time by run, machine hours, trench safety records and job costs, and how SmartCrew handles them.",
  eyebrow: "Underground utility software",
  h1: "Software for underground utility contractors",
  lede:
    "Underground utility contractor software tracks what a pipe crew spends to put a foot of water, sewer, storm or dry utility in the ground: crew hours, machine hours, stone and pipe, and the trench safety records that go with every dig. For a utility company with 5 to 100 people, the useful version ties all of that to each job and each cost code, every day. SmartCrew does that in one phone and web app built only for dirt work and heavy civil trades.",
  summary: [
    "Utility work is bid by the foot or by the structure. Profit depends on daily production, which is hard to see from a weekly timecard.",
    "Every trench brings safety records: the 811 ticket, the competent person's daily inspection, the toolbox talk and any incident.",
    "SmartCrew tracks crew time by job, activity code and machine, logs equipment hours and inspections, records stone and material loads, and shows budget against actual daily.",
    "Safety and compliance in SmartCrew covers JSAs, toolbox talks and safety meetings, and incident reports with photos.",
  ],
  hero: [{ id: "phone-working" }, { id: "web-project-detail" }],
  blocks: [
    { t: "h2", text: "What do underground utility contractors need from software?" },
    {
      t: "p",
      text: "A utility crew is small and expensive: an excavator, a loader or skid steer, a box, a pipe layer, a top man and an operator, plus trucks hauling stone in and spoil out. The bid is so many feet of pipe, so many manholes or structures, so many services. The question every day is how many feet went in and what they cost.",
    },
    {
      t: "table",
      caption: "What a utility company tracks, and where SmartCrew records it",
      head: ["What", "Why it matters", "In SmartCrew"],
      rows: [
        ["Crew hours by run or structure", "Mainline, services and structures are priced differently.", "[Time tracking](features/construction-time-tracking): project, activity code and machine at clock-in, and Log & Switch to change."],
        ["Machine hours", "The excavator and the box are on every foot of the job.", "[Equipment](features/heavy-equipment-maintenance-software): hours, inspections, service requests and a shop queue."],
        ["Stone, pipe and spoil", "Bedding stone and spoil hauling can eat a utility bid.", "[Hauling](features/hauling-software): haul tickets, material and fuel logs, and an AI reader for ticket and receipt photos."],
        ["Daily production", "Feet per day is the number that says if the bid holds.", "[Daily reports](features/construction-daily-report-app): progress and production logs, photos and field notes."],
        ["Budget against actual", "Find the overrun while there's still pipe to lay.", "[Job costing](features/construction-job-costing): labor, materials, equipment, other and change orders against the bid."],
      ],
    },
    {
      t: "shots",
      shots: [{ id: "phone-working" }, { id: "web-project-detail" }],
      caption: "A crew member on the clock on a job, activity and machine, and the job's budget against spent. (Demo account; names and numbers are made up.)",
    },

    { t: "h2", text: "Trench safety records" },
    {
      t: "p",
      text: "Utility work is trench work, and trench work has rules. Before digging, the [811 one-call system](" + CALL_811 + ") has to be contacted so existing lines get marked. Under OSHA's [29 CFR 1926.651(k)](" + OSHA_1926_651 + "), a competent person inspects the excavation, the area around it and the protective system daily before work and as needed during the shift. Most contractors add a JSA for the dig and a regular toolbox talk.",
    },
    {
      t: "p",
      text: "SmartCrew's [safety features](features/construction-safety-app) cover JSAs, toolbox talks and safety meetings, and incident reports for injuries, near misses and damage, with photos. A struck line is exactly the kind of damage report you want written on site, with pictures, the same hour.",
    },
    {
      t: "shots",
      shots: [{ id: "phone-incident-report" }, { id: "web-messaging" }],
      caption: "An incident report on a phone, and a company announcement carrying a trench safety toolbox talk. (Demo account.)",
    },
    {
      t: "note",
      title: "Check your state",
      text: "A plain-English summary, not legal advice. Your state's one-call law sets the notice period and how long marks are valid. Source: the Electronic Code of Federal Regulations and call811.com, October 22, 2026.",
    },
    { t: "cta" },

    { t: "h2", text: "Setting up cost codes for utility work" },
    {
      t: "p",
      text: "Match the activity codes to the bid items: mainline by size, services, manholes or structures, testing, restoration. When the crew clocks in on a code and switches with Log & Switch as the day changes, the job page's cost codes tab shows which items are over and which are under. Pair that with the foreman's daily production numbers and you know the cost per foot while the job is running, not at the end.",
    },

    { t: "h2", text: "Keeping the excavator and the trucks running" },
    {
      t: "p",
      text: "Operators do [DOT and daily inspections](features/pre-trip-inspection-app) on the phone, and a failed item becomes a service request in the shop queue with urgency and status. Each machine's record shows hours, mileage, last and next service, and its inspection log. [Scheduling](features/crew-scheduling-software) puts crews and machines on jobs together, so the box shows up with the excavator.",
    },
    {
      t: "shots",
      shots: [{ id: "phone-dot" }, { id: "web-service-queue" }],
      caption: "A DOT inspection on a phone, and the shop's service queue. (Demo account.)",
    },
    {
      t: "note",
      title: "Plans",
      text: "Feature availability varies by plan. Fleet Management, Sales CRM, and Scheduling & Communications are Premium categories.",
    },

    { t: "h2", text: "What SmartCrew isn't" },
    {
      t: "p",
      text: "SmartCrew isn't estimating or takeoff software, and doesn't do GPS machine control, telematics hardware, payroll processing or ELD hours of service. It doesn't place 811 tickets for you. It tracks the work once the job is won and sends payroll-ready time to QuickBooks Online.",
    },
    {
      t: "p",
      text: "Pricing depends on your company size and the features you need; it's built to be well below enterprise construction software. You get a number on a short call with Andrew.",
    },
  ],
  faqs: [
    {
      q: "What is the best software for an underground utility contractor?",
      a: "It depends on size. A utility company with 5 to 100 people that runs its own crews and machines usually does best with one app that ties crew time, machine hours, material loads, safety records and job costs to each job, like SmartCrew. Large contractors often use an enterprise suite.",
    },
    {
      q: "Can SmartCrew track cost per foot?",
      a: "SmartCrew tracks hours and costs by job and activity code, and daily reports log production. Together they give you the numbers for cost per foot.",
    },
    {
      q: "Does SmartCrew handle trench safety paperwork?",
      a: "It covers JSAs, toolbox talks and safety meetings, and incident reports with photos. It doesn't replace the competent person's judgment or your safety program.",
    },
    {
      q: "Does SmartCrew place 811 tickets?",
      a: "No. You still contact your state's one-call center through 811.",
    },
    {
      q: "Does SmartCrew work with QuickBooks?",
      a: "Yes, with QuickBooks Online today. QuickBooks Desktop, Foundation and ADP integrations are in the works.",
    },
  ],
  sources: [
    { label: "29 CFR 1926.651, Specific excavation requirements", url: OSHA_1926_651, accessed: "2026-10-22" },
    { label: "Call 811", url: CALL_811, accessed: "2026-10-22" },
  ],
  related: ["site-work-software", "excavation-software", "features/construction-safety-app", "features/construction-job-costing", "guides/what-is-smartcrew"],
};

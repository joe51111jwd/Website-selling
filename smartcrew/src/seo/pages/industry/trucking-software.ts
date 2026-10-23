import type { SeoPage } from "../../types";

export const page: SeoPage = {
  kind: "industry",
  slug: "trucking-software",
  nav: "Trucking & hauling",
  keyword: "dump truck company software",
  updated: "2026-10-22",
  title: "Dump Truck Company Software for Haulers | SmartCrew",
  description:
    "Software for dump truck and hauling companies that work dirt jobs: loads per truck per day, driver hours, DOT pre-trips, shop requests and cost by job.",
  eyebrow: "Trucking and hauling software",
  h1: "Software for dump truck and hauling companies",
  lede:
    "Dump truck company software counts loads per truck per day, keeps driver hours and DOT inspections, and ties every load and truck hour to the job it was for. SmartCrew does that for hauling companies and dirt contractors with their own trucks, 5 to 100 people, in one app built for heavy civil trades. It is not an ELD and does not log hours of service; keep a certified ELD for that.",
  summary: [
    "A trucking outfit lives on loads per truck per day. A truck that runs five loads when it could run eight is losing money all day.",
    "Every load needs a ticket that ties the truck, the driver, the job, the material and the yards together.",
    "SmartCrew logs loads by truck and job, driver time by activity, DOT pre-trips on the phone, and service requests from failed items.",
    "SmartCrew is not an ELD, does not do hours of service, dispatch routing or freight billing. It does the dirt hauling day.",
  ],
  hero: [{ id: "phone-dot" }, { id: "web-d-hauling" }],
  blocks: [
    { t: "h2", text: "What does a dump truck company need from software?" },
    {
      t: "p",
      text: "A dump truck company needs software that counts loads by truck and by job, every day, with the driver's hours and the truck's inspections in the same place. A dirt hauler's week is short cycles: pit to site, site to dump, back to the pit. The pay is per load or per hour, and the cost is per truck per hour, so the load count is where money is made or lost.",
    },
    {
      t: "p",
      text: "This page is about running a hauling company or the trucking side of a contractor. The [hauling software](features/hauling-software) page explains the digital load ticket itself, field by field.",
    },
    {
      t: "table",
      caption: "What a hauling company tracks, and where SmartCrew records it",
      head: ["What to track", "Why it matters for a trucking outfit", "Where it lives in SmartCrew"],
      rows: [
        ["Loads per truck per day", "The main measure of how hard each truck worked.", "[Hauling](features/hauling-software): each ticket has the time, truck, project, material, yards and pit."],
        ["Driver hours by job", "Hourly work is billed by job, and payroll needs the hours split right.", "[Time tracking](features/construction-time-tracking): GPS clock-ins with project, activity code and truck."],
        ["DOT pre-trips", "A truck without a current inspection should not roll.", "[Pre-trip inspections](features/pre-trip-inspection-app): DOT and daily inspections on the phone."],
        ["Repairs", "A down truck is a load count of zero.", "[Equipment](features/heavy-equipment-maintenance-software): service requests, shop queue, last and next service."],
        ["Fuel", "Fuel is the cost that moves with every load.", "Materials and fuel logs, with the AI reader for receipts."],
      ],
      note: "Feature availability varies by plan. Fleet Management, Sales CRM, and Scheduling & Communications are Premium categories.",
    },

    { t: "h2", text: "How do you count loads per truck per day?" },
    {
      t: "p",
      text: "You count loads per truck per day by having each driver log every load on the phone as it happens, so the hauling log can be filtered by truck and date. Each SmartCrew ticket records the ticket, time, truck, project, import or export, material, yards and source pit. A ticket photo from the pit is enough for the AI reader to fill in the data.",
    },
    {
      t: "p",
      text: "With the times on each ticket, cycle time is easy to see. If a truck's tickets are 50 minutes apart on Monday and 75 minutes apart on Tuesday on the same haul, something changed: a slow loader at the pit, traffic, or a long wait at the dump.",
    },
    {
      t: "note",
      title: "Worked example (not a statistic)",
      text: "Say a truck costs you a set amount per hour and works a 10-hour day. At a 50-minute cycle it runs 12 loads (600 ÷ 50). At a 75-minute cycle it runs 8 (600 ÷ 75). Same truck, same driver, same cost for the day, and a third fewer loads to bill. The ticket times are how you find out which day you had.",
    },
    {
      t: "shots",
      shots: [{ id: "phone-hauling" }, { id: "web-d-hauling" }],
      caption: "A driver logging a load, and the hauling log by truck and job. (Demo account; names and numbers are made up.)",
    },

    { t: "h2", text: "How should a hauling company handle DOT pre-trip inspections?" },
    {
      t: "p",
      text: "A hauling company should have drivers complete the DOT pre-trip on the phone before the first load, with each failed item turning into a service request the shop sees right away. SmartCrew's inspection form covers the machine, hours or miles, and pass or fail checks such as brakes, steering, lights and tires. Each truck's record keeps its inspection log with operator, date, odometer and status.",
    },
    {
      t: "shots",
      shots: [{ id: "phone-dot" }, { id: "web-d-inspections" }],
      caption: "A DOT inspection on a phone, and the truck's inspection log in the office. (Demo account.)",
    },
    { t: "cta", title: "Count every load on every truck", text: "A short call with Andrew: he sets SmartCrew up around your trucks, drivers and pits." },

    { t: "h2", text: "How do you split driver hours between jobs?" },
    {
      t: "p",
      text: "You split driver hours between jobs with Log & Switch: when a driver finishes on one site and heads to another, two taps move the clock to the new project and activity. GPS clock-ins show where each driver started. The weekly summary and payroll-ready timecards go to the office with the split already done.",
    },
    {
      t: "p",
      text: "For a contractor that runs its own trucks, this is also how trucking shows up in [job costing](features/construction-job-costing). The trucks' hours and loads land on the job, next to the excavators and the crew.",
    },

    { t: "h2", text: "How do you schedule trucks across jobs?" },
    {
      t: "p",
      text: "You schedule trucks with a drag-and-drop board of jobs and equipment by day, and drivers see their assignments on the phone. When a pit closes early or a job adds export, schedule updates and notifications reach the driver. [Crew messaging](features/crew-communication-app) and job chat channels carry the details.",
    },

    { t: "h2", text: "What should a dump truck company ask a software vendor?" },
    {
      t: "ol",
      items: [
        "Can drivers log a load in a few taps, or from a photo of the pit ticket?",
        "Can I see loads by truck, by job and by day?",
        "Are DOT pre-trips on the phone, and do failed items go to the shop?",
        "Can a driver move between jobs mid-day on one timecard?",
        "Is it an ELD? (SmartCrew is not. You need a certified ELD where hours of service rules apply.)",
        "Does it connect to my accounting? (SmartCrew: QuickBooks Online today.)",
      ],
    },

    { t: "h2", text: "What SmartCrew does not do for a trucking company" },
    {
      t: "p",
      text: "SmartCrew is not an ELD and does not log hours of service. It does not provide telematics hardware, route optimization, freight load boards, IFTA fuel tax reporting or payroll processing. It sends payroll-ready time to QuickBooks Online. If you haul general freight as well as dirt and stone, a freight trucking system fits that side better.",
    },

    { t: "h2", text: "How do you get started with SmartCrew?" },
    {
      t: "p",
      text: "You get started with a short call with Andrew Drish, SmartCrew's founder. The team sets up the account, moves your information over, organizes workflows and trains your people, and most companies are up and running within a few weeks. Pricing depends on your company size and the features you need; it's built to be well below enterprise construction software. You get a number on a short call with Andrew.",
    },
  ],
  faqs: [
    {
      q: "What is the best software for a dump truck company?",
      a: "For a dirt and aggregate hauler with 5 to 100 people, an app that counts loads by truck and job, keeps driver hours and DOT pre-trips, and sends repairs to the shop, like SmartCrew, covers the daily work. You still need a certified ELD where hours of service rules apply.",
    },
    {
      q: "Is SmartCrew an ELD?",
      a: "No. SmartCrew does not log hours of service and is not an ELD. It tracks driver time for payroll and job cost, loads, inspections and repairs.",
    },
    {
      q: "Can SmartCrew replace paper load tickets?",
      a: "Yes. Drivers log loads on the phone, and the AI reader enters the data from a photo of a pit or supplier ticket.",
    },
    {
      q: "Can I see how many loads each truck ran today?",
      a: "Yes. Each ticket records the truck and the time, so the hauling log shows loads by truck, by job and by day.",
    },
    {
      q: "How much does SmartCrew cost for a trucking company?",
      a: "Pricing depends on your company size and the features you need; it's built to be well below enterprise construction software. You get a number on a short call with Andrew.",
    },
  ],
  related: ["features/hauling-software", "features/pre-trip-inspection-app", "aggregate-software", "demolition-software", "guides/what-is-smartcrew"],
};

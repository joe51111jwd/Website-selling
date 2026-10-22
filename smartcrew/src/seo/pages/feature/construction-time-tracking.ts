import type { SeoPage } from "../../types";

export const page: SeoPage = {
  kind: "feature",
  slug: "features/construction-time-tracking",
  nav: "Time tracking",
  keyword: "construction time tracking",
  updated: "2026-10-22",
  title: "Construction Time Tracking App with GPS | SmartCrew",
  description:
    "How construction time tracking works for dirt work crews: GPS clock-ins by job, cost code and machine, live crew locations and payroll-ready timecards in SmartCrew.",
  eyebrow: "Construction time tracking",
  h1: "Construction time tracking that puts every hour on the right job",
  lede:
    "Construction time tracking is more than a clock. For a dirt work company, each hour has to land on a job, an activity code and often a machine, or you can't tell which jobs make money. SmartCrew's GPS clock-in has crews pick all three in a few taps, then turns the day into payroll-ready timecards you review instead of chase.",
  summary: [
    "Crews clock in on their phone with GPS and choose the project, activity code and equipment.",
    "Supervisors see live crew locations and a supervisor dashboard, and clock in/out reminders cut down on missed punches.",
    "Hours are already split by job and cost code, so timecards go to payroll without retyping and feed the job's cost.",
    "It's one app with job costing, equipment, hauling and daily reports, not a time clock that stops at hours.",
  ],
  hero: [{ id: "web-timecards" }, { id: "phone-home" }],
  blocks: [
    { t: "h2", text: "What good construction time tracking has to do" },
    {
      t: "p",
      text: "Paper timecards and memory-based timesheets share one problem: the hours show up late and in the wrong place. A foreman writes down 10 hours for the week and splits them as best he can. Nobody knows what each job actually cost until the job is over.",
    },
    { t: "p", text: "For a construction company, a time tracking app should do five things:" },
    {
      t: "ol",
      items: [
        "**Capture hours at the source.** The crew member records them on their phone, on the job, not in the office on Friday.",
        "**Tag every hour to a job and an activity code.** Pipe laying, excavation and grading are different costs on the same job.",
        "**Know where the hours were worked.** GPS confirms the crew was at the site.",
        "**Handle a day that changes.** People move between jobs and machines. Switching tasks has to take a tap, not a form.",
        "**Make payroll boring.** Timecards that are already right, reviewed once, sent to QuickBooks.",
      ],
    },

    { t: "h2", text: "How SmartCrew time tracking works" },
    {
      t: "steps",
      steps: [
        { title: "Clock in with one big button", text: "The phone app opens on a large Clock In button and the week's days. GPS records where the crew member clocked in." },
        { title: "Pick the job, the activity code and the machine", text: "A short sheet asks for the project, the activity code and the equipment. Operators log which machine they're on, so machine hours follow." },
        { title: "Log & Switch when the work changes", text: "While clocked in, the worker sees the time on the clock, the project, the activity and the equipment. Break, Log & Switch and Clock Out are right there." },
        { title: "Submit the week", text: "The weekly summary shows total hours, overtime and each day's hours by job and activity, with a Submit Timecard button." },
        { title: "Review in the office, then payroll", text: "The office sees timecards by employee and day, reviews them and sends hours to QuickBooks Online." },
      ],
    },
    {
      t: "shots",
      shots: [{ id: "phone-home" }, { id: "phone-select-task" }, { id: "phone-working" }],
      caption: "The clock-in flow on a phone: Clock In, pick the job, activity and machine, then Break, Log & Switch or Clock Out. (Demo account.)",
    },

    { t: "h2", text: "What the office and supervisors see" },
    {
      t: "p",
      text: "Time tracking only helps if the office can use it the same day. SmartCrew shows live crew locations on a map next to a list of who is clocked in on which job, activity and machine. The Reports & Analytics timecards screen lays out each person's hours across the week, with tabs for timecards, payroll, equipment and incidents.",
    },
    {
      t: "shots",
      shots: [{ id: "web-dashboard" }, { id: "phone-summary" }],
      caption: "The office dashboard with crews on the map, and the weekly summary a worker submits from the phone. (Demo data.)",
    },
    {
      t: "table",
      caption: "SmartCrew time tracking, piece by piece",
      head: ["Piece", "What it does"],
      rows: [
        ["GPS-powered clock-ins", "Records where each person clocked in"],
        ["Live crew locations", "Shows where crews are on a map, with who is clocked in and on what"],
        ["Payroll-ready timecards", "Hours by job and cost code, ready to review and send to QuickBooks Online"],
        ["Supervisor Dashboard", "A dashboard for supervisors to keep an eye on their crews' time"],
        ["Clock In/Out Reminders", "Nudges the crew to punch in and out"],
        ["Request day off", "Crew members can ask for time off from the phone"],
      ],
    },
    { t: "cta", title: "Want this for your crew?", text: "A short call with Andrew, SmartCrew's founder. He sets it up around your crews, machines and cost codes." },

    { t: "h2", text: "Why the hour has to land on a job" },
    {
      t: "p",
      text: "Most apps called “construction time tracking” stop at the timecard. That solves payroll but leaves the harder question open: what did this job cost? When time, machine hours, loads and receipts all land on the same job, the job page can show budget against spent while the work is still going. SmartCrew's [job costing](features/construction-job-costing) uses the hours your crew already logged.",
    },
    {
      t: "note",
      title: "What ten minutes a day costs",
      text: "Take one person who writes 7:00 when they showed up at 7:10. That's ten minutes a day, five days a week: about 43 hours a year. At $35 an hour that's roughly $1,500 a year for one person. This is a worked example, not a SmartCrew statistic. Plug in your own crew size and wage.",
    },

    { t: "h2", text: "Questions to ask any time tracking app" },
    {
      t: "ul",
      items: [
        "Can the crew pick job, activity code **and** machine at clock-in, or just a job name?",
        "Does it reach QuickBooks without retyping, including your cost codes? (SmartCrew: QuickBooks Online today.)",
        "Does GPS record the actual clock-in, or only remind people? Ask what happens when there's no signal.",
        "Is time tracking one module in a bigger system, or does it come with equipment, hauling and job costing?",
        "Will a crew member in gloves understand it on the first day?",
      ],
    },
    {
      t: "p",
      text: "If you're comparing products, see how SmartCrew compares with [Jobber](compare/jobber-alternative) and [Procore](compare/procore-alternative), both of which list time tracking with different limits.",
    },
  ],
  faqs: [
    {
      q: "What is the best time tracking app for construction crews?",
      a: "It depends on how your crew works. For dirt work and heavy civil companies, look for an app where each hour is tagged to a job, an activity code and a machine, because that's what makes job costing possible. SmartCrew is built for that, with GPS clock-ins, live crew locations and payroll-ready timecards.",
    },
    {
      q: "Does SmartCrew track GPS location?",
      a: "Yes. SmartCrew uses GPS-powered clock-ins, and the office can see live crew locations on a map next to who is clocked in on which job.",
    },
    {
      q: "Can crews switch jobs or machines during the day?",
      a: "Yes. While clocked in, a worker taps Log & Switch and picks the new project, activity code or equipment, so the hours go to the right place.",
    },
    {
      q: "Does SmartCrew work with QuickBooks payroll?",
      a: "SmartCrew integrates with QuickBooks Online today. Integrations with QuickBooks Desktop, Foundation, ADP and more are in the works.",
    },
    {
      q: "Is time tracking the only thing SmartCrew does?",
      a: "No. It also covers job costing against the bid, equipment and DOT inspections, hauling tickets, daily reports, scheduling, sales, crew chat, safety and file storage, so time tracking is one part of one app.",
    },
    {
      q: "How much does SmartCrew cost?",
      a: "Pricing depends on your company size and the features you need, and it's built to be well below the cost of enterprise construction software. You get a number on a short call with Andrew.",
    },
  ],
  related: ["features/construction-job-costing", "excavation-software", "compare/jobber-alternative", "compare/procore-alternative"],
};

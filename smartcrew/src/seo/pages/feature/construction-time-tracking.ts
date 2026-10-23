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

    { t: "h2", text: "Is it legal to track employees with GPS on their own phones?" },
    {
      t: "p",
      text: "In most of the US, GPS on a work time clock is lawful when the crew knows about it, it serves a business purpose such as checking that hours were worked on site, and it stays on work time. Rules differ by state, and some states require consent to track vehicles, with rules that can depend on whether the vehicle is company or privately owned. Employment lawyers at Fisher Phillips advise written notice of what is collected and why, keeping the purpose narrow, and not tracking people outside working hours ([Fisher Phillips, January 2025](https://www.fisherphillips.com/print/v2/content/38654/7-best-privacy-practices-for-employers.pdf)). This is general information, not legal advice; check your state's rules.",
    },
    {
      t: "p",
      text: "In SmartCrew, GPS records where each person clocked in, and the office sees live crew locations next to who is clocked in on which job. TODO(andrew): confirm whether SmartCrew collects any location after clock-out or during breaks, so this page can state it plainly.",
    },

    { t: "h2", text: "How do you stop buddy punching and padded hours on a crew?" },
    {
      t: "p",
      text: "Buddy punching and padded hours stop when every punch carries a location and a person's own phone, and someone reviews the exceptions each week. A paper card or a shared code lets one worker clock in for another; a GPS clock-in on each worker's phone records where that phone was. SmartCrew records the clock-in location, shows the supervisor who is clocked in where, and puts each day's hours by job on the weekly timecard the worker submits, so a 7:00 start written for a 7:10 arrival is visible before payroll.",
    },

    { t: "h2", text: "What happens when a worker forgets to clock in?" },
    {
      t: "p",
      text: "A missed punch is cheaper to prevent than to fix, which is why SmartCrew sends clock in and clock out reminders to the crew. When one is missed anyway, it surfaces on the weekly summary the worker reviews before tapping Submit Timecard, and again when the office reviews timecards by employee and day. TODO(andrew): describe who can correct a missed punch (worker, foreman or office) and whether edits are logged.",
    },

    { t: "h2", text: "Does a construction time clock app work without cell service?" },
    {
      t: "p",
      text: "Pits, cuts and rural sites often have no signal, so ask any vendor exactly what happens to a punch made offline: is it stored on the phone with its time and location and sent later, or is it lost? Contractors comparing apps on Reddit bring this up often. TODO(andrew): state whether SmartCrew's clock-in, Log & Switch and forms work offline and sync later; until then this page makes no claim either way.",
    },

    { t: "h2", text: "Can SmartCrew handle certified payroll or prevailing wage jobs?" },
    {
      t: "p",
      text: "SmartCrew is not a payroll processor, so it doesn't run payroll or file certified payroll reports itself. It produces payroll-ready timecards split by job and cost code and sends hours to QuickBooks Online, where payroll is run. TODO(andrew): confirm whether timecards can be exported in the shape a certified payroll (WH-347) preparer needs, and whether prevailing wage rates can be set per job.",
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
      q: "Can I require GPS on my crew's personal phones?",
      a: "Usually yes for work time, if you tell the crew in writing what is collected and why and you don't track them off the clock, but state laws differ. Check your state's rules or ask an employment lawyer.",
    },
    {
      q: "How much does SmartCrew cost?",
      a: "Pricing depends on your company size and the features you need, and it's built to be well below the cost of enterprise construction software. You get a number on a short call with Andrew.",
    },
  ],
  sources: [
    { label: "Fisher Phillips: 7 best privacy practices for employers using geolocation tools (Jan 8, 2025)", url: "https://www.fisherphillips.com/print/v2/content/38654/7-best-privacy-practices-for-employers.pdf", accessed: "2026-10-22" },
  ],
  related: ["features/construction-job-costing", "excavation-software", "vs/clockshark-vs-busybusy", "compare/jobber-alternative", "compare/procore-alternative"],
};

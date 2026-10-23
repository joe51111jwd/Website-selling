import type { SeoPage } from "../../types";

// TODO(andrew): confirm whether a crew member sees the schedule in the phone app and how notifications
// arrive (push, text?). This page only claims what WRITING.md lists: drag-and-drop crew scheduling,
// job and equipment assignments, schedule updates and notifications, plus dispatch with instant alerts.

export const page: SeoPage = {
  kind: "feature",
  slug: "features/crew-scheduling-software",
  nav: "Crew scheduling",
  keyword: "crew scheduling software for construction",
  updated: "2026-10-22",
  title: "Crew and Equipment Scheduling Software for Contractors",
  description:
    "How excavation and heavy civil contractors schedule crews and machines across jobs, why the whiteboard breaks, and how SmartCrew's drag-and-drop scheduling sends the changes out.",
  eyebrow: "Crew scheduling software",
  h1: "Crew and equipment scheduling for dirt work contractors",
  lede:
    "Crew scheduling software puts who goes where, with which machine, on one calendar that everyone can see, and tells people when it changes. For a dirt work company the hard part isn't the people, it's that crews and iron move together and the weather moves both. SmartCrew handles this with drag-and-drop crew scheduling, job and equipment assignments, and schedule updates and notifications in the same app the crew already clocks in on.",
  summary: [
    "A dirt work schedule has two halves that have to match: people and machines. Most scheduling tools only do the first.",
    "The usual setup, a whiteboard plus a group text the night before, works until a job slips or a machine goes down.",
    "SmartCrew has drag-and-drop crew scheduling, job and equipment assignments, schedule updates and notifications, and dispatch with instant alerts.",
    "Scheduling sits next to time tracking and equipment records, so the plan and what actually happened are in one place.",
    "Scheduling & Communications is a Premium category in SmartCrew.",
  ],
  hero: [{ id: "web-scheduling" }, { id: "phone-messages" }],
  blocks: [
    { t: "h2", text: "What is crew scheduling software?" },
    {
      t: "p",
      text: "Crew scheduling software is a shared calendar for field work. The office assigns crews, and in construction usually machines, to jobs by day, and the people in the field see where they're going without a phone call. When the plan changes, the people affected hear about it.",
    },
    {
      t: "p",
      text: "General scheduling apps are built for shift work: a worker, a location and a start time. A dirt work schedule has more pieces. The excavator has to be on the lowboy before the operator gets there. The trucks have to match what the loader can fill. The pipe crew can't start until the trench is open. That's why the schedule has to hold equipment as well as people.",
    },

    { t: "h2", text: "Why the whiteboard and group text stop working" },
    {
      t: "p",
      text: "Most companies from 5 to 30 people schedule on a whiteboard in the shop and a group text the night before. It's fast and everyone knows it. It breaks in a few predictable ways:",
    },
    {
      t: "table",
      caption: "Where a whiteboard schedule breaks",
      head: ["What happens", "What it costs"],
      rows: [
        ["Rain moves two jobs", "Somebody spends the evening texting every crew, and someone still shows up at the wrong site."],
        ["A machine goes down", "Nobody on the board knows, so a crew gets sent to a job with no iron to run."],
        ["The owner is out of the shop", "The schedule lives on a wall nobody can see from the truck."],
        ["A question about last month", "Who was on which job on the 14th? The board was erased weeks ago."],
      ],
    },

    { t: "h2", text: "How scheduling works in SmartCrew" },
    {
      t: "p",
      text: "SmartCrew's scheduling is part of the Scheduling & Communications category. What it covers:",
    },
    {
      t: "ul",
      items: [
        "**Drag-and-drop crew scheduling:** crews and jobs on a calendar, by day, across the month.",
        "**Job and equipment assignments:** the schedule holds which machines go with which job, not just which people.",
        "**Schedule updates and notifications:** when something moves, the people on it are told.",
        "**Dispatch with instant alerts:** for same-day changes that can't wait for tomorrow's plan.",
      ],
    },
    {
      t: "shots",
      shots: [{ id: "web-scheduling" }, { id: "web-equipment" }],
      caption: "The scheduling calendar with crews and jobs by day, and the equipment list the assignments draw from. (Demo account; names and numbers are made up.)",
    },
    { t: "cta" },

    { t: "h2", text: "Planned against actual" },
    {
      t: "p",
      text: "A schedule is a plan. The [time tracking](features/construction-time-tracking) side of SmartCrew records what actually happened: at clock-in, each worker picks the project, activity code and equipment. That means the office can look at a day and see both: who was scheduled where, and who clocked in where, on which machine.",
    },
    {
      t: "p",
      text: "That matters for [job costing](features/construction-job-costing). If the schedule had three days of grading on a job and the crew clocked five, the job page shows the labor and equipment spent against the bid budget while there's still time to talk to the owner about why.",
    },
    {
      t: "shots",
      shots: [{ id: "web-dashboard" }, { id: "phone-select-task" }],
      caption: "The dashboard's map and list of who is clocked in on which job and machine, and the phone screen where a worker picks the job, activity and equipment. (Demo account.)",
    },

    { t: "h2", text: "Machines on the schedule" },
    {
      t: "p",
      text: "Putting machines on the schedule pays off in the shop as well. SmartCrew's [equipment](features/heavy-equipment-maintenance-software) side tracks hours, inspections, service requests and a shop queue. When a machine is in the shop queue, the person building tomorrow's schedule can see it before they assign it.",
    },
    {
      t: "note",
      title: "Plans",
      text: "Feature availability varies by plan. Fleet Management, Sales CRM, and Scheduling & Communications are Premium categories.",
    },

    { t: "h2", text: "Crew messages next to the schedule" },
    {
      t: "p",
      text: "Scheduling and messaging are in the same category for a reason. SmartCrew includes crew and team messaging, job-specific chat channels and company announcements, so the note that says the lane closure moved to Thursday sits in the same app as the schedule it changes, not in a group text that half the crew muted.",
    },
    {
      t: "shots",
      shots: [{ id: "web-messaging" }, { id: "phone-messages" }],
      caption: "Company announcements such as weekly crew assignments, and the chat channels on a crew member's phone. (Demo account.)",
    },

    { t: "h2", text: "What to look for in any crew scheduling tool" },
    {
      t: "ol",
      items: [
        "It schedules machines and people together.",
        "Changes reach the crew without a phone tree.",
        "The field can see it from a phone.",
        "It keeps history, so last month's schedule is still there.",
        "It connects to time tracking, so you can compare the plan to the day.",
      ],
    },
  ],
  faqs: [
    {
      q: "What is crew scheduling software?",
      a: "A shared calendar for field work. The office assigns crews, and for dirt work companies machines, to jobs by day, and the crew is told when the plan changes.",
    },
    {
      q: "Can SmartCrew schedule equipment as well as crews?",
      a: "Yes. SmartCrew's scheduling covers job and equipment assignments as well as drag-and-drop crew scheduling.",
    },
    {
      q: "How do crews find out about schedule changes?",
      a: "SmartCrew sends schedule updates and notifications, and has dispatch with instant alerts for same-day changes.",
    },
    {
      q: "Is scheduling included in every SmartCrew plan?",
      a: "Feature availability varies by plan. Scheduling & Communications is a Premium category, along with Fleet Management and Sales CRM.",
    },
    {
      q: "Does the schedule connect to time tracking?",
      a: "Both live in SmartCrew. The schedule is the plan, and clock-ins record the job, activity code and machine each person actually worked, so you can compare them.",
    },
  ],
  related: ["features/construction-time-tracking", "features/heavy-equipment-maintenance-software", "features/construction-job-costing", "features/construction-daily-report-app", "guides/what-is-smartcrew"],
};

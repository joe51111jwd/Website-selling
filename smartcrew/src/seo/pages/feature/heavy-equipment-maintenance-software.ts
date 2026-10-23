import type { SeoPage } from "../../types";

export const page: SeoPage = {
  kind: "feature",
  slug: "features/heavy-equipment-maintenance-software",
  nav: "Equipment maintenance software",
  keyword: "heavy equipment maintenance software",
  updated: "2026-10-22",
  title: "Heavy Equipment Maintenance Software for Contractors | SmartCrew",
  description:
    "How heavy equipment maintenance software works for excavation and heavy civil fleets: hours-based service, operator-reported problems, a shop queue, inspections and cost per machine. See SmartCrew's equipment screens.",
  eyebrow: "Heavy equipment maintenance software",
  h1: "Heavy equipment maintenance software for contractors that run their own iron",
  lede:
    "Heavy equipment maintenance software tracks when each machine and truck is due for service, collects problems operators report from the field, and gives the shop one list to work from. For an excavation or heavy civil company, the useful version is built on real machine hours, not a calendar, and it connects to the jobs those machines work on. This page explains what the software has to do, what to ask a vendor, and how SmartCrew's equipment management is laid out.",
  summary: [
    "Service on heavy equipment is usually due by hours or miles, so the software needs real hour readings from the field, not only a calendar.",
    "The most valuable input is the operator: a problem reported from the cab the same day it's noticed.",
    "A shop queue turns reported problems into work with an urgency and a status.",
    "SmartCrew puts equipment hours, inspections, maintenance, service requests, utilization and a shop queue next to time tracking and job costing, so a machine's hours reach the job's cost.",
  ],
  hero: [{ id: "web-equipment" }, { id: "web-service-queue" }],
  blocks: [
    { t: "h2", text: "What the software has to do" },
    {
      t: "p",
      text: "A fleet of excavators, dozers, loaders and trucks fails in predictable ways: service gets missed, small problems get reported late, and nobody can tell which machines earn their keep. Maintenance software exists to close those gaps. It should do six jobs.",
    },
    {
      t: "ol",
      items: [
        "**Keep one record per machine.** ID, make, model, year, category, hourly rate, hours, mileage, last service, next service.",
        "**Get real hours.** Hours should come from the work done, such as the operator's time on the machine, not from someone remembering to update a spreadsheet.",
        "**Schedule service by hours or miles.** An oil change at 250 hours is a different trigger than one every three months.",
        "**Capture problems at the source.** The operator reports from the cab, with a note and urgency.",
        "**Give the shop a queue.** Open problems, who reported them, how urgent they are and where the repair stands.",
        "**Show what the machine costs and earns.** Utilization and the cost of repairs against the hours it worked.",
      ],
    },

    { t: "h2", text: "Where maintenance programs usually break" },
    {
      t: "ul",
      items: [
        "**The hour meter and the spreadsheet disagree.** If someone updates hours by hand, service dates drift.",
        "**Problems travel by word of mouth.** A text to the foreman, a note on a dashboard, a mention at the morning meeting. Nothing is in one list.",
        "**The shop doesn't know urgency.** A weeping hose and a failing brake sound alike in a message.",
        "**Nobody sees the cost per job.** A machine that is down costs the job its schedule, and repair and idle time rarely reach the job's books.",
        "**Inspections live on paper.** The daily check that would have caught the problem is in a glovebox.",
      ],
    },
    {
      t: "p",
      text: "Tools built for fleets or for maintenance in general, such as fleet management or computerized maintenance management systems, handle several of these jobs well. What they often don't know is the crew's day: which job the machine worked on, who ran it, how long. That link is the argument for keeping equipment in the same app as time tracking.",
    },

    { t: "h2", text: "How SmartCrew's equipment management is laid out" },
    {
      t: "p",
      text: "SmartCrew's equipment management covers equipment hours and locations, DOT and daily inspections, maintenance, service requests, utilization rates and a Shop Queue. Fleet Management is a Premium category in SmartCrew, so availability varies by plan.",
    },
    {
      t: "shots",
      shots: [{ id: "web-equipment" }, { id: "web-d-inspections" }],
      caption: "The equipment list with each machine's ID, make, model, category, hourly rate and hours, and a dump truck's record with its inspection log. (Demo data.)",
    },
    {
      t: "table",
      caption: "SmartCrew equipment management, piece by piece",
      head: ["Piece", "What it does"],
      rows: [
        ["Machine record", "Hours, mileage, last service and next service, plus the log of DOT inspections with operator, date, odometer reading and status"],
        ["Equipment hours", "Operators pick the machine when they clock in, so machine hours follow the work"],
        ["DOT and daily inspections", "A pass or fail form on the operator's phone; see the [pre-trip inspection app](/features/pre-trip-inspection-app/) page"],
        ["Service requests", "Problems reported from the field"],
        ["Shop Queue", "Reported problems with who reported them, when, urgency and repair status"],
        ["Utilization rates", "How much each machine is used"],
      ],
    },
    {
      t: "shots",
      shots: [{ id: "web-service-queue" }, { id: "phone-dot" }],
      caption: "The shop's service queue and the operator's phone inspection form that feeds it. (Demo account.)",
    },

    { t: "h2", text: "Why machine hours should reach the job" },
    {
      t: "p",
      text: "An hourly rate on each machine is only useful if the hours are tied to a job. In SmartCrew the operator chooses the project, the activity and the machine at clock-in, so the equipment hours land on the job and show up in the equipment line of [job costing](/features/construction-job-costing/). That gives you the answer to “did this job make money after the machines are counted?” while the job is still running.",
    },
    { t: "cta", title: "Want your fleet in one place?", text: "A short call with Andrew walks through the machine record, the shop queue and job cost on your equipment." },

    { t: "h2", text: "What SmartCrew isn't" },
    {
      t: "p",
      text: "SmartCrew is not telematics hardware or GPS machine control. It doesn't read data from a machine's engine computer. Hours come from the crew's time on the machine and the readings operators enter. If you want engine fault codes or fuel burn from the machine itself, you'd run a telematics product beside it.",
    },

    { t: "h2", text: "Questions to ask any maintenance software vendor" },
    {
      t: "ul",
      items: [
        "Where do the hours come from? Meter readings, telematics, or the crew's time on the machine?",
        "Can service be set by hours or miles, and not only by date?",
        "Can an operator report a problem from the phone in under a minute, with a photo?",
        "Does the shop see urgency and status, and does the operator see the result?",
        "Do machine hours and repair costs reach the job, or stay in a separate system?",
        "How long to set up, and who migrates your existing equipment list?",
      ],
    },
    {
      t: "p",
      text: "On the last point, SmartCrew's team sets up the account, migrates information, organizes workflows and trains your people, and most companies are up and running within a few weeks.",
    },
  ],
  faqs: [
    {
      q: "What is heavy equipment maintenance software?",
      a: "It's software that keeps a record for each machine and truck, tracks when service is due by hours or miles, collects problems reported from the field and gives the shop a queue to work through.",
    },
    {
      q: "Does SmartCrew do equipment maintenance?",
      a: "Yes. SmartCrew's equipment management covers equipment hours and locations, DOT and daily inspections, maintenance, service requests, utilization rates and a Shop Queue. Fleet Management is a Premium category, so availability varies by plan.",
    },
    {
      q: "Where do SmartCrew's equipment hours come from?",
      a: "Operators pick the machine when they clock in, and hours land on the machine and the job. Operators also enter hours or miles on inspections. SmartCrew doesn't read data from the machine's engine computer.",
    },
    {
      q: "Is SmartCrew telematics?",
      a: "No. SmartCrew is not telematics hardware or GPS machine control. It's the software side: time, machines, inspections, hauling, reports and job costing.",
    },
    {
      q: "Can operators report equipment problems from a phone?",
      a: "Yes. Problems reported from the field appear in the service queue with who reported them, when, the urgency and the repair status.",
    },
    {
      q: "How much does SmartCrew cost?",
      a: "Pricing depends on your company size and the features you need, and it's built to be well below the cost of enterprise construction software. You get a number on a short call with Andrew.",
    },
  ],
  related: ["features/pre-trip-inspection-app", "features/construction-job-costing", "features/construction-time-tracking", "compare/hcss-heavyjob-alternative", "guides/equipment-cost-per-hour"],
};

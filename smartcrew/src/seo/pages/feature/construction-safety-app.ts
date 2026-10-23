import type { SeoPage } from "../../types";

const OSHA_1926_21 = "https://www.ecfr.gov/current/title-29/subtitle-B/chapter-XVII/part-1926/subpart-C/section-1926.21";
const OSHA_1926_651 = "https://www.ecfr.gov/current/title-29/subtitle-B/chapter-XVII/part-1926/subpart-P/section-1926.651";
const OSHA_1904 = "https://www.ecfr.gov/current/title-29/subtitle-B/chapter-XVII/part-1904";

// TODO(andrew): confirm whether JSAs and toolbox talks are filled in and signed on the phone, and
// whether SmartCrew ships template JSAs or talks. Not claimed below until confirmed.

export const page: SeoPage = {
  kind: "feature",
  slug: "features/construction-safety-app",
  nav: "Safety app",
  keyword: "construction safety app",
  updated: "2026-10-22",
  title: "Construction Safety App: JSAs, Toolbox Talks, Incidents",
  description:
    "What safety records an excavation or heavy civil contractor should keep, what OSHA's rules ask for, and how SmartCrew handles JSAs, toolbox talks and incident reports.",
  eyebrow: "Construction safety app",
  h1: "A construction safety app for excavation and heavy civil crews",
  lede:
    "A construction safety app keeps a crew's safety paperwork on the phone instead of in the truck: the job safety analysis before the work, the toolbox talk at the start of the week, and the incident report when something goes wrong. For dirt work, where trenches and heavy equipment cause most serious injuries, the record that the hazard was talked about matters. SmartCrew covers JSAs, toolbox talks and safety meetings, and incident reports for injuries, near misses and damage, with photos.",
  summary: [
    "OSHA requires employers to train each employee to recognize and avoid unsafe conditions, and requires a competent person to inspect excavations daily.",
    "A JSA breaks a task into steps, lists the hazard at each step and says how the crew will control it.",
    "Toolbox talks are short, regular safety meetings. They are how most small contractors show training happened.",
    "SmartCrew's safety and compliance features cover JSAs, toolbox talks and safety meetings, and incident reports for injury, near miss and damage, with photos.",
  ],
  hero: [{ id: "phone-incident-report" }, { id: "web-messaging" }],
  blocks: [
    { t: "h2", text: "What safety records does a dirt work company need?" },
    {
      t: "p",
      text: "Every contractor's list is a little different, depending on the work, the state and what the general contractor or owner asks for. Most excavation and heavy civil companies end up keeping these four:",
    },
    {
      t: "table",
      caption: "The four safety records most dirt work companies keep",
      head: ["Record", "What it is", "Where the requirement comes from"],
      rows: [
        ["Job safety analysis (JSA)", "A task broken into steps, with the hazard and the control for each one. Also called a JHA.", "Usually the contract, the GC or your safety program. It's the common way to show hazards were planned for."],
        ["Toolbox talk", "A short safety meeting, often weekly, on one topic, with a sign-in.", "[29 CFR 1926.21](" + OSHA_1926_21 + ") requires instructing each employee in recognizing and avoiding unsafe conditions. A signed talk is how many companies show it."],
        ["Excavation inspection", "A competent person's daily check of the trench or excavation, protective systems and surroundings.", "[29 CFR 1926.651(k)](" + OSHA_1926_651 + ") requires the inspection before work and as needed through the shift."],
        ["Incident report", "What happened, when, where, who, and photos, for injuries, near misses and damage.", "Your own program and insurer, and [29 CFR 1904](" + OSHA_1904 + ") for injuries that must go on the OSHA log."],
      ],
      note: "Source: the Electronic Code of Federal Regulations, October 22, 2026. A plain-English summary, not legal advice. State plans and contracts can add more. Some small employers are partially exempt from the OSHA injury log; check 29 CFR 1904 for your company.",
    },

    { t: "h2", text: "What goes in a JSA for dirt work" },
    {
      t: "p",
      text: "A JSA is short. The point is that the crew talks through the work before doing it. For a trench for a sewer lateral, it might read:",
    },
    {
      t: "table",
      caption: "Example JSA steps for a utility trench (an example, not a template for your job)",
      head: ["Step", "Hazard", "Control"],
      rows: [
        ["Locate", "Striking a buried line", "811 ticket confirmed, marks checked, hand dig near marks"],
        ["Dig", "Swing radius, spoil too close to the edge", "Spotter, barricade, spoil set back from the edge"],
        ["Protect", "Cave-in", "Box or sloping per the competent person"],
        ["Enter", "Getting out in a hurry", "Ladder within reach, no one in the trench while the bucket is overhead"],
      ],
    },

    { t: "h2", text: "Why paper safety forms fail" },
    {
      t: "p",
      text: "The same way paper timecards do. The form is in the truck. The sign-in sheet gets rained on. When an inspector or insurer asks for the JSA from the day of an incident, it has to be found, and sometimes it was never written. A near miss that wasn't reported can't teach anyone anything.",
    },
    { t: "cta" },

    { t: "h2", text: "How safety works in SmartCrew" },
    {
      t: "p",
      text: "SmartCrew's safety and compliance features cover three things:",
    },
    {
      t: "ul",
      items: [
        "**JSAs:** job safety analyses for the work ahead.",
        "**Toolbox talks and safety meetings:** the regular meeting and its topic.",
        "**Incident reports:** injury, near miss or damage, with what happened, photos and who reported it.",
      ],
    },
    {
      t: "shots",
      shots: [{ id: "phone-incident-report" }, { id: "phone-reports" }],
      caption: "An incident report on a phone: project, date and time, injury, near miss or damage, what happened, photos and who reported it; and the reports menu where it starts. (Demo account.)",
    },
    {
      t: "p",
      text: "Because the incident report is filed against a project, it sits with the rest of that job's record: who was clocked in, which machines were there, and the [daily report](features/construction-daily-report-app) for the day. Company announcements can carry the week's toolbox talk to every crew.",
    },
    {
      t: "shots",
      shots: [{ id: "web-messaging" }, { id: "web-d-inspections" }],
      caption: "Company announcements, including a trench safety toolbox talk, and the equipment inspection log. (Demo account; names and numbers are made up.)",
    },

    { t: "h2", text: "Equipment inspections are safety records too" },
    {
      t: "p",
      text: "A machine with bad brakes is a safety problem before it's a maintenance one. SmartCrew's [DOT and daily inspections](features/pre-trip-inspection-app) are pass or fail checks on the operator's phone, and a defect goes into the [shop queue](features/heavy-equipment-maintenance-software). That keeps the walk-around record next to the JSA and the incident report.",
    },

    { t: "h2", text: "What SmartCrew doesn't do" },
    {
      t: "p",
      text: "SmartCrew records and organizes your safety work. It isn't a safety program, a training course or a substitute for a competent person on the trench. It also isn't an ELD for hours of service. Your safety consultant and your insurer still decide what your program requires.",
    },
  ],
  faqs: [
    {
      q: "What is a construction safety app?",
      a: "An app that keeps safety paperwork on the crew's phones: job safety analyses, toolbox talks and incident reports, so the record exists and the office can find it.",
    },
    {
      q: "Does SmartCrew do JSAs and toolbox talks?",
      a: "Yes. SmartCrew's safety and compliance features include JSAs, toolbox talks and safety meetings, and incident reports.",
    },
    {
      q: "What can an incident report in SmartCrew record?",
      a: "The project, date and time, whether it was an injury, near miss or damage, what happened, photos and who reported it.",
    },
    {
      q: "Does OSHA require toolbox talks?",
      a: "OSHA's construction rule 29 CFR 1926.21 requires employers to instruct each employee in recognizing and avoiding unsafe conditions. It doesn't name toolbox talks, but a regular signed talk is a common way to show the training happened.",
    },
    {
      q: "Who inspects a trench?",
      a: "Under 29 CFR 1926.651(k), a competent person inspects excavations, adjacent areas and protective systems daily before work starts and as needed during the shift.",
    },
    {
      q: "Is SmartCrew a safety program?",
      a: "No. It records and organizes your safety work. Your program, training and competent person are still yours.",
    },
  ],
  sources: [
    { label: "29 CFR 1926.21, Safety training and education", url: OSHA_1926_21, accessed: "2026-10-22" },
    { label: "29 CFR 1926.651, Specific excavation requirements", url: OSHA_1926_651, accessed: "2026-10-22" },
    { label: "29 CFR 1904, Recording and reporting occupational injuries", url: OSHA_1904, accessed: "2026-10-22" },
  ],
  related: ["features/pre-trip-inspection-app", "features/construction-daily-report-app", "features/heavy-equipment-maintenance-software", "excavation-software", "guides/what-is-smartcrew"],
};

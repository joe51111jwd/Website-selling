import type { SeoPage } from "../../types";

// TODO(andrew): no dedicated daily report screen exists in shots.ts yet. Add a phone daily report
// capture (and the office copy it produces) and swap it into hero and the first shots block.
// TODO(andrew): confirm which fields the daily report form has (weather, equipment hours, delays,
// signatures?) before naming any of them as SmartCrew fields. This page only names the three
// approved facts: progress and production logs, photos and field notes, automatic office reports.

export const page: SeoPage = {
  kind: "feature",
  slug: "features/construction-daily-report-app",
  nav: "Daily report app",
  keyword: "construction daily report app",
  updated: "2026-10-22",
  title: "Construction Daily Report App for Dirt Work Crews | SmartCrew",
  description:
    "What a daily report for an excavation or heavy civil job should record, why paper reports go missing, and how SmartCrew builds the daily report from the crew's phones.",
  eyebrow: "Daily report app",
  h1: "A construction daily report app for dirt work crews",
  lede:
    "A daily report is the record of what happened on a job today: who was there, what got done, how much was produced, what got in the way, and the photos that prove it. A daily report app lets the foreman fill it in on a phone before leaving the site, and sends it to the office automatically. In SmartCrew, the progress and production log, the photos and the field notes go into one report that the office gets the same day.",
  summary: [
    "A daily report protects the company in a dispute, backs up change orders and extras, and tells the office if the job is on pace before the bid is gone.",
    "Paper reports fail for one reason: they're written late, from memory, if at all.",
    "SmartCrew's daily reports cover progress and production logs, jobsite photos and field notes, and send an automatic daily report to the office.",
    "Because hours, machines and loads are already on the job in SmartCrew, the report sits next to the costs it explains.",
  ],
  hero: [{ id: "web-project-detail" }, { id: "phone-reports" }],
  blocks: [
    { t: "h2", text: "What is a construction daily report?" },
    {
      t: "p",
      text: "A construction daily report (also called a daily log, a dailies or a foreman's report) is a dated record of one day on one job. It's written by the person running the crew, usually the foreman or superintendent, and kept by the company for as long as the job could end up in a dispute.",
    },
    {
      t: "p",
      text: "On a dirt work job the daily report carries more weight than on most. Soil is never exactly what the borings said. Utilities show up where the plans didn't put them. Rain shuts the site down for two days and the schedule doesn't move. The report written that afternoon is the evidence that this happened, and that the crew didn't just have a slow week.",
    },

    { t: "h2", text: "What should a daily report record?" },
    {
      t: "p",
      text: "There is no single federal form for a private job's daily report. Owners, general contractors and public agencies often hand you their own, and when they do, use theirs. When they don't, these are the items that come up again and again when a job goes sideways:",
    },
    {
      t: "table",
      caption: "What to put in a dirt work daily report, and why",
      head: ["Item", "Why it matters later"],
      rows: [
        ["Date, job and who wrote it", "Ties the record to one day and one person, which is what makes it believable."],
        ["Crew on site and hours", "Backs up payroll and labor cost on the job."],
        ["Equipment on site", "Shows which machines worked or sat, which matters for equipment cost and rental claims."],
        ["Work done and quantities", "Yards moved, feet of pipe laid, loads hauled. Production is how you know if the job is on pace with the bid."],
        ["Delays and their cause", "Weather, waiting on another trade, an unmarked line, a changed condition. This is the record behind a time extension."],
        ["Extra work and who asked for it", "The start of a change order. Written the same day, it is hard to argue with."],
        ["Visitors and inspections", "Who came, what they said, what passed."],
        ["Photos", "Before and after, the trench walls, the problem you found. A photo with a date beats a paragraph."],
      ],
      note: "A general checklist, not a contract requirement. Your contract or the owner's specification decides what a daily report must include on a given job.",
    },

    { t: "h2", text: "Why paper daily reports go missing" },
    {
      t: "p",
      text: "Nobody argues against daily reports. They just don't get written. The foreman runs a machine all day, the paper form is in the truck, and by the time the site is buttoned up it's dark. On Friday the office asks for the week's reports and gets three of five, written Thursday night from memory.",
    },
    {
      t: "p",
      text: "The other problem is distance. Even a good paper report sits in a truck until someone drives it in. If it says the crew hit rock on Tuesday, the estimator who could have priced the change order learns about it the following week.",
    },
    { t: "cta" },

    { t: "h2", text: "How daily reports work in SmartCrew" },
    {
      t: "p",
      text: "SmartCrew's daily reports have three parts, all filled in from the phone on the job:",
    },
    {
      t: "ul",
      items: [
        "**Progress and production logs:** what got done today and how much of it.",
        "**Jobsite photos and field notes:** pictures from the phone's camera and short notes about conditions, delays and extra work.",
        "**Automatic daily reports for the office:** the report goes to the office without anyone emailing it.",
      ],
    },
    {
      t: "p",
      text: "The report isn't the only record of the day. The crew's [clock-ins](features/construction-time-tracking) already say who worked on which job, on which activity code and which machine. Drivers' [haul tickets](features/hauling-software) already list the loads. So the office reads the foreman's notes next to the hours, machine time and loads, all on the same job, instead of matching three piles of paper.",
    },
    {
      t: "shots",
      shots: [{ id: "phone-reports" }, { id: "web-dashboard" }],
      caption: "The reports menu on the crew's phone, and the office dashboard where the day's labor, equipment and material cost show up. (Demo account; names and numbers are made up.)",
    },

    { t: "h2", text: "From the daily report to the job's numbers" },
    {
      t: "p",
      text: "A daily report is most useful when someone reads it while the job is still running. In SmartCrew, the job page shows revenue, expenses and profit, with budget against spent for labor, materials, equipment, other costs and change orders. When the foreman writes that the crew spent the afternoon on extra work the owner asked for, the office can open the job, see the hours that went to it, and start the change order that week.",
    },
    {
      t: "shots",
      shots: [{ id: "web-project-detail" }, { id: "phone-working" }],
      caption: "The job page with budget against actual, and a crew member on the clock with job, activity and machine picked. (Demo account.)",
    },
    {
      t: "p",
      text: "This is the same idea as [daily job costing](features/construction-job-costing): the field records it once, and the office uses it the same day.",
    },

    { t: "h2", text: "Getting foremen to fill it in" },
    {
      t: "p",
      text: "The daily report that gets done is the short one. A few habits help on any system, paper or phone:",
    },
    {
      t: "ol",
      items: [
        "Ask for it before the crew leaves the site, not at home that night.",
        "Let photos do most of the talking. Three pictures and two sentences beat a blank form.",
        "Don't ask the foreman to retype what the app already knows, like hours and machines.",
        "Read them. When the office calls about Tuesday's note on Wednesday, foremen learn the report matters.",
      ],
    },
    {
      t: "p",
      text: "SmartCrew's team sets up the account, organizes workflows and trains your people, and most companies are up and running within a few weeks. Daily reports are one of the features you can start with.",
    },
    {
      t: "note",
      title: "Plans",
      text: "Feature availability varies by plan. Fleet Management, Sales CRM, and Scheduling & Communications are Premium categories.",
    },
  ],
  faqs: [
    {
      q: "What is a construction daily report?",
      a: "A dated record of one day on one job, written by the foreman or superintendent: crew, equipment, work done, quantities, delays, extra work, visitors and photos. It backs up payroll, change orders and delay claims.",
    },
    {
      q: "Who should fill out the daily report?",
      a: "The person running the crew that day, usually the foreman or superintendent. It should be written on site, the same day, while the details are fresh.",
    },
    {
      q: "Can I take photos in the SmartCrew daily report?",
      a: "Yes. SmartCrew's daily reports include jobsite photos and field notes along with progress and production logs.",
    },
    {
      q: "Does the office have to ask for the report?",
      a: "No. SmartCrew sends automatic daily reports to the office, so nobody has to collect paper or forward an email.",
    },
    {
      q: "How long should we keep daily reports?",
      a: "At least as long as the job could end up in a claim or dispute, and as long as your contract requires. Ask your attorney or bonding company about the period that applies to you.",
    },
    {
      q: "Does SmartCrew replace the owner's daily report form?",
      a: "If a contract requires the owner's or agency's own form, use it. SmartCrew's report is your company's record of the day and sits next to the job's hours, machines and costs.",
    },
  ],
  related: ["features/construction-job-costing", "features/construction-time-tracking", "features/hauling-software", "excavation-software", "guides/what-is-smartcrew"],
};

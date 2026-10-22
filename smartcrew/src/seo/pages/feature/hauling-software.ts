import type { SeoPage } from "../../types";

export const page: SeoPage = {
  kind: "feature",
  slug: "features/hauling-software",
  nav: "Hauling software",
  keyword: "hauling software",
  updated: "2026-10-22",
  title: "Hauling Software and Digital Haul Tickets for Contractors | SmartCrew",
  description:
    "How digital haul tickets work for dump truck and excavation crews: loads logged by truck, project, material, yards and pit, an AI reader for ticket photos, and hauling cost on the job. See SmartCrew's hauling log.",
  eyebrow: "Hauling software",
  h1: "Hauling software that replaces paper load tickets",
  lede:
    "Hauling software logs each load a truck moves: the time, truck, project, whether it was import or export, the material, the yards and the pit or yard it came from. For an excavation or site work company, that log is the backup for what you bill, what you owe the trucker and what the job cost. SmartCrew replaces paper tickets with a hauling log driven from the phone, with an AI reader that enters the data from a ticket photo, and ties loads to the project.",
  summary: [
    "A hauling log records each load: ticket, time, truck, project, import or export, material, yards and the pit or yard it came from.",
    "SmartCrew's AI reader enters the data from a photo of a ticket or receipt, so nobody retypes numbers at night.",
    "Loads are tied to the project, which is what lets hauling and materials show up in the job's cost.",
    "Hauling and materials are part of the same app as time, equipment and job costing, not a separate tool.",
  ],
  hero: [{ id: "web-d-hauling" }, { id: "phone-hauling" }],
  blocks: [
    { t: "h2", text: "Why paper load tickets cause trouble" },
    {
      t: "p",
      text: "A dirt work job moves a lot of material in and out. Every load brings a ticket, and the ticket is the only proof of what moved. When the tickets are paper, the same things go wrong on most crews.",
    },
    {
      t: "ul",
      items: [
        "**Tickets go missing.** A ticket in a truck door or a shirt pocket doesn't reach the office, and a load you can't prove is a load you can't bill.",
        "**Totals disagree.** The trucker's count, the pit's count and yours don't match, and nobody can say which is right.",
        "**Data entry lands on one person.** Someone types a stack of tickets at the end of the week, and mistakes get in.",
        "**Cost shows up late.** If tickets reach the books weeks after the work, the job is nearly done before you know the hauling cost.",
        "**Disputes drag.** Without the time, truck and source on each load, a billing question turns into a long call.",
      ],
    },

    { t: "h2", text: "What a hauling log has to capture" },
    {
      t: "table",
      caption: "The fields a useful haul ticket record carries",
      head: ["Field", "Why it matters"],
      rows: [
        ["Ticket number", "Matches the load to the pit or yard's paperwork"],
        ["Date and time", "Settles disputes and shows trips per day"],
        ["Truck", "Ties the load to a truck and driver for pay and billing"],
        ["Project", "Puts the cost on the right job"],
        ["Import or export", "Material coming onto the job is a different cost than material leaving it"],
        ["Material", "Different materials have different rates"],
        ["Yards", "The quantity you bill and pay on"],
        ["Source pit or yard", "Where the load came from or went to"],
      ],
      note: "These are the fields shown in SmartCrew's hauling log. Billing by the load, yard or ton depends on your contracts.",
    },

    { t: "h2", text: "How SmartCrew's hauling works" },
    {
      t: "p",
      text: "SmartCrew's Materials & Hauling covers digital hauling tickets, material and fuel log tracking, and an AI reader that enters the data for you from ticket and receipt photos. It also tracks deliveries and production. The hauling log on the web lists each load ticket with time, truck, project, import or export, material, yards and source pit.",
    },
    {
      t: "steps",
      steps: [
        { title: "Log the load on the phone", text: "The driver or foreman picks the date, truck and project, marks import or export, and adds the pit and notes." },
        { title: "Or snap the ticket", text: "The AI reader reads a ticket or receipt photo and fills the fields, so the person only checks them." },
        { title: "The office sees it the same day", text: "The hauling log shows every load by truck and project, ready to total." },
        { title: "Cost lands on the job", text: "Loads are tied to the project, so hauling and materials show up against the job's budget." },
      ],
    },
    {
      t: "shots",
      shots: [{ id: "phone-hauling" }, { id: "web-d-hauling" }, { id: "web-materials" }],
      caption: "The hauling log on a phone, the web hauling log by load, and the materials screen by project and vendor. (Demo data.)",
    },
    { t: "cta", title: "Want your tickets off paper?", text: "A short call with Andrew shows the hauling log and ticket reader on a sample day of loads." },

    { t: "h2", text: "Hauling and job cost belong together" },
    {
      t: "p",
      text: "On an excavation job, trucking and material are often the biggest lines after labor and machines. Knowing them while the job is running is the point of the log. In SmartCrew, labor, materials, equipment, other costs and change orders are measured against the budget you bid, so a run of extra loads shows up on the job page before the job is over. See [construction job costing](/features/construction-job-costing/) for how the job page works.",
    },
    {
      t: "p",
      text: "The same crew day also feeds [time tracking](/features/construction-time-tracking/) and [equipment hours](/features/heavy-equipment-maintenance-software/), so a truck's hours, its loads and its inspection are all attached to the same machine.",
    },

    { t: "h2", text: "What SmartCrew isn't" },
    {
      t: "p",
      text: "SmartCrew is not a trucking dispatch system with load boards, and it doesn't process payroll or settle trucker pay. It records loads and costs. If you broker trucks or settle with owner-operators by the ticket, run your settlement process on the log's totals.",
    },

    { t: "h2", text: "Questions to ask any hauling software vendor" },
    {
      t: "ul",
      items: [
        "Can a driver log a load from the cab in under a minute?",
        "Can it read a ticket photo, and who checks the result?",
        "Does each load carry truck, project, material, yards and source?",
        "Do loads reach the job's cost, or stay in a separate list?",
        "Can you export totals by truck, project or date for billing and trucker pay?",
        "Does it work with weak signal at the pit?",
      ],
    },
  ],
  faqs: [
    {
      q: "What is hauling software?",
      a: "Hauling software records each load a truck moves, with fields such as ticket, time, truck, project, import or export, material, yards and source, and totals them for billing, trucker pay and job cost.",
    },
    {
      q: "Does SmartCrew have digital haul tickets?",
      a: "Yes. SmartCrew's Materials & Hauling includes digital hauling tickets, material and fuel log tracking, delivery and production tracking, and an AI reader that enters data from ticket and receipt photos.",
    },
    {
      q: "What does the SmartCrew AI reader do?",
      a: "It reads a photo of a ticket or receipt and enters the data for you, so the person logging the load checks the fields instead of typing them.",
    },
    {
      q: "Do loads count toward job costing?",
      a: "Loads are tied to the project, and SmartCrew's job page measures labor, materials, equipment, other costs and change orders against the bid budget.",
    },
    {
      q: "Is SmartCrew a trucking dispatch or load board?",
      a: "No. SmartCrew records loads, materials and costs for contractors. It isn't a load board, and it doesn't process payroll or trucker settlements.",
    },
    {
      q: "How much does SmartCrew cost?",
      a: "Pricing depends on your company size and the features you need, and it's built to be well below the cost of enterprise construction software. You get a number on a short call with Andrew.",
    },
  ],
  related: ["features/construction-job-costing", "features/heavy-equipment-maintenance-software", "excavation-software", "compare/hcss-heavyjob-alternative"],
};

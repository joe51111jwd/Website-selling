import type { SeoPage } from "../../types";

export const page: SeoPage = {
  kind: "feature",
  slug: "features/construction-job-costing",
  nav: "Job costing",
  keyword: "construction job costing",
  updated: "2026-10-22",
  title: "Construction Job Costing for Excavation Contractors | SmartCrew",
  description:
    "How job costing works for dirt work companies: bid budgets against actual labor, materials, equipment and change orders, updated daily, so you catch a losing job early.",
  eyebrow: "Construction job costing",
  h1: "Construction job costing you can read while the job is still running",
  lede:
    "Job costing means comparing what you bid with what the job is costing, by category, while there is still time to change something. In SmartCrew each job page shows budget against spent for labor, materials, equipment, other costs and change orders, fed by the hours, loads and receipts your crew already logs.",
  summary: [
    "The job page shows revenue, expenses and profit, then budget against spent for each cost type.",
    "Labor comes from GPS time entries tagged to the job and activity code. Equipment, materials and hauling come from the machine, ticket and receipt logs.",
    "Change orders and extras sit next to the original budget, so a job's real margin isn't hidden.",
    "Custom reports and a daily profitability view mean you find out this week, not after the job closes.",
  ],
  hero: [{ id: "web-project-detail" }],
  blocks: [
    { t: "h2", text: "What job costing is, in plain terms" },
    {
      t: "p",
      text: "You bid a job with numbers behind it: so many hours of labor, so many hours of machine time, so many yards of material, some trucking. Job costing tracks the same categories as the work happens and sets them side by side. When actual labor is running 15% over what you bid by the end of week two, you can still change the plan. At the end of the job, all you can do is write it down for the next bid.",
    },
    {
      t: "table",
      caption: "The cost types on a SmartCrew job page",
      head: ["Cost type", "Where the number comes from"],
      rows: [
        ["Labor", "Crew hours clocked on the job, by employee and activity code"],
        ["Materials", "Material and fuel logs, hauling tickets and receipts"],
        ["Equipment", "Machine hours logged against the job"],
        ["Other expenses", "Costs that don't fit the other categories"],
        ["Change orders", "Extras and changes, tracked next to the original budget"],
      ],
      note: "Each type shows budget, spent and net on the job page.",
    },
    {
      t: "shots",
      shots: [{ id: "web-project-detail" }],
      caption: "A job page in the demo account: revenue, expenses and profit on top, budget against spent for each cost type below. (Demo data, not a real customer.)",
    },

    { t: "h2", text: "Why job costing fails when the data comes late" },
    {
      t: "ul",
      items: [
        "**Hours are guessed on Friday.** The foreman splits a week across three jobs from memory.",
        "**Machine time lives somewhere else.** Equipment hours are in a spreadsheet or a head, not on the job.",
        "**Tickets and receipts pile up.** Loads in and out are on paper until someone types them.",
        "**Change orders get a phone call, not a line item.** The job looks fine until the extra work is billed.",
      ],
    },
    {
      t: "p",
      text: "Every one of those is a data-entry problem, not a math problem. That's why SmartCrew's job costing sits in the same app as [time tracking](features/construction-time-tracking), equipment, hauling and daily reports. The inputs are captured once, in the field, and the job page adds them up.",
    },
    {
      t: "shots",
      shots: [{ id: "web-materials" }, { id: "web-d-hauling" }],
      caption: "Materials by vendor and cost, and the hauling log by truck, material and yards. These feed the job's costs. (Demo data.)",
    },
    { t: "cta", title: "See your own jobs against the bid", text: "A short call with Andrew, SmartCrew's founder. He sets it up around your crews, machines and cost codes." },

    { t: "h2", text: "A worked example: finding a leak by week two" },
    {
      t: "p",
      text: "This is an example with made-up numbers, not a SmartCrew statistic. You bid a culvert job with 400 labor hours. By the end of week two, the job page shows 260 hours logged against 40% of the work done. At that pace the job finishes near 650 hours, about 250 over the bid. Because the hours are broken out by activity code, you can see whether the overage is in excavation or pipe laying, and whether a machine sat waiting on trucks. You can fix the plan in week three instead of reading about it in the final cost report.",
    },
    {
      t: "steps",
      steps: [
        { title: "Set the budget", text: "Enter the bid's budget by category on the job." },
        { title: "Let the field feed it", text: "Crews clock in to the job and activity, log machine hours, loads and receipts from their phones." },
        { title: "Check profit daily", text: "Look at the job's profit and each category's budget against spent." },
        { title: "Act early", text: "Shift crews, fix a trucking bottleneck or write up the change order while the extra work is still in front of you." },
      ],
    },

    { t: "h2", text: "Questions to ask any job costing tool" },
    {
      t: "ol",
      items: [
        "Does it compare against **your bid budget**, or only show what you've spent?",
        "Are labor, equipment and materials in one place, or do you assemble the report in a spreadsheet?",
        "Is it updated daily, or when someone remembers to enter data?",
        "Are change orders tracked next to the original budget?",
        "Does time tracking feed it automatically? (Ask what plan it requires: some products only offer job costing on higher tiers.)",
      ],
    },
    {
      t: "p",
      text: "For how SmartCrew compares with other products on job costing, see the [Procore comparison](compare/procore-alternative) and the [Jobber comparison](compare/jobber-alternative).",
    },
  ],
  faqs: [
    {
      q: "What is job costing in construction?",
      a: "Job costing tracks what a job is costing, by category such as labor, materials, equipment and change orders, and compares it with the budget you bid. The point is to see overruns while the job is still running.",
    },
    {
      q: "What is the best job costing software for excavation contractors?",
      a: "Look for software where time, machine hours, material and hauling data feed the job automatically and the budget comes from your bid. SmartCrew is built for dirt work and heavy civil companies with 5–100 employees and puts these in one app.",
    },
    {
      q: "Does SmartCrew compare costs with my bid?",
      a: "Yes. SmartCrew shows bid budgets against actual costs and daily job profitability, with change orders and extras tracked on the job and custom reports.",
    },
    {
      q: "Where does the labor cost come from?",
      a: "From the GPS time entries your crew logs, tagged to the job and the activity code. Because each hour lands on the job, the labor number is there without anyone retyping timecards.",
    },
    {
      q: "Does SmartCrew do estimating or takeoff?",
      a: "No. SmartCrew tracks your bids in its sales pipeline and compares each job's actual costs to the budget you bid, but it doesn't build estimates or do takeoffs.",
    },
    {
      q: "How much does SmartCrew cost?",
      a: "Pricing depends on your company size and the features you need, and it's built to be well below the cost of enterprise construction software. You get a number on a short call with Andrew.",
    },
  ],
  related: ["features/construction-time-tracking", "excavation-software", "compare/procore-alternative", "compare/jobber-alternative"],
};

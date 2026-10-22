import type { SeoPage } from "../../types";

const HOME = "https://workmax.com/";
const PRICING = "https://workmax.com/pricing/";
const FAQ = "https://workmax.com/resources/faqs/";
const TIME = "https://workmax.com/solutions/workmax-time/";
const ASSETS = "https://workmax.com/solutions/workmax-assets/";
const INSIGHT = "https://workmax.com/solutions/workmax-insight/";
const FORMS = "https://workmax.com/solutions/workmax-forms/";
const OTHER = "https://workmax.com/solutions/other-products/";
const INTEG = "https://workmax.com/solutions/integrations/";
const ABOUT = "https://workmax.com/about-workmax/";
const CAPTERRA = "https://www.capterra.com/p/83248/About-Time/";
const APPSTORE = "https://apps.apple.com/us/app/workmax/id1526863646";

export const page: SeoPage = {
  kind: "compare",
  slug: "compare/workmax-alternative",
  nav: "WorkMax alternative",
  keyword: "workmax alternative",
  updated: "2026-10-22",
  title: "WorkMax Alternative for Excavation & Heavy Civil | SmartCrew",
  description:
    "WorkMax sells time, forms, assets and insight as separate quote-only modules. See how SmartCrew compares for dirt work crews: one app for time, machines, haul tickets, inspections and job costing in dollars.",
  eyebrow: "WorkMax alternative",
  h1: "WorkMax alternative for excavation and heavy civil contractors",
  lede:
    "WorkMax is a cloud workforce management platform from AboutTime Technologies, owned by Foundation Software since 2023. It's sold as separate modules for time, forms, assets and project insight, with no public price. Its GPS time tracking, facial recognition and asset tracking are real strengths, and its own site lists no haul ticket feature. SmartCrew is the alternative for dirt work and heavy civil companies with 5–100 employees that want time, machines, haul tickets, inspections and job cost in one app.",
  summary: [
    "WorkMax is quote-only and priced per user per module. Its FAQ says every user needs an individual license, including admins and managers, and that Forms, Assets and Insight are added through a sales rep.",
    "Its Time module has GPS, geofencing and patented facial recognition. Its Assets module tracks equipment by GPS, with preventive maintenance and barcode tagging.",
    "Scheduling and dispatch, safety management and estimating are sold as separate Foundation Software products, not WorkMax modules.",
    "WorkMax is the better pick if you want the Foundation accounting and payroll family. SmartCrew is the better pick if you want haul tickets, DOT inspections, crew chat and a sales pipeline with the time.",
  ],
  hero: [{ id: "web-timecards" }, { id: "phone-home" }],
  blocks: [
    { t: "h2", text: "What WorkMax is, and who it fits" },
    {
      t: "p",
      text: "WorkMax is the product name AboutTime Technologies now uses for its construction workforce platform. AboutTime is based in Payson, Utah and has been in business since 2003. In 2023 it was [acquired by Foundation Software](" + ABOUT + "), a construction accounting and payroll vendor, and WorkMax now includes a construction Payroll Service for certified payroll, union tracking and multi-state compliance.",
    },
    {
      t: "p",
      text: "Its [pricing page](" + PRICING + ") says it fits teams from 10 to 1,000 workers, and it is built for contractors that manage several crews and job locations. It connects to more than 100 accounting, ERP and payroll systems through its [integration layer](" + INTEG + "). If your office already runs on Foundation accounting, that connection is a large part of the pitch.",
    },
    {
      t: "p",
      text: "The platform is sold as four modules. TIME collects hours with GPS verification and facial recognition. FORMS builds custom field forms such as daily work logs, safety reports and change orders. ASSETS tracks equipment, tools and inventory. INSIGHT compares progress and cost against estimates.",
    },

    { t: "h2", text: "How much does WorkMax cost?" },
    {
      t: "p",
      text: "WorkMax doesn't publish prices. Its page asks you to tell a specialist about your crew for a custom quote, priced by the number of users in each module. So there is no list price to build an example from for 15 or 40 people. What the [FAQ](" + FAQ + ") does say is how the quote is built.",
    },
    {
      t: "table",
      caption: "How WorkMax pricing works, from WorkMax's own pages",
      head: ["Topic", "What it says"],
      rows: [
        ["Price", "Custom quote, per user per module, with package and volume discounts."],
        ["Who needs a license", "Every user needs an individual license, regardless of role: employee, admin or manager."],
        ["Adding modules", "Forms, Assets and Insight are added by contacting a WorkMax representative."],
        ["Setup time", "Its integrations page says a typical setup runs from a few days to a few weeks."],
        ["Multi-employee timesheet", "The grid timesheet is browser-only."],
      ],
      note: "Sources: [WorkMax pricing](" + PRICING + "), [FAQ](" + FAQ + ") and [integrations](" + INTEG + "), October 22, 2026. Terms change.",
    },
    {
      t: "p",
      text: "SmartCrew's pricing depends on your company size and the features you need, and it's built to be well below the cost of enterprise construction software. You get a number on a short call with Andrew.",
    },

    { t: "h2", text: "WorkMax vs SmartCrew, feature by feature" },
    {
      t: "table",
      caption: "What a dirt work company needs, and where each product stands",
      head: ["Job to be done", "SmartCrew", "WorkMax"],
      rows: [
        ["GPS clock-in with job and activity", { mark: "yes", note: "Crew also picks the machine" }, { mark: "yes", note: "TIME module with GPS and geofencing" }],
        ["Job costing", { mark: "yes", note: "Bid budgets vs. actual costs in dollars, daily" }, { mark: "yes", note: "INSIGHT module compares project costs against estimates" }],
        ["Equipment tracking and maintenance", { mark: "yes" }, { mark: "yes", note: "ASSETS module: GPS-enabled tracking, preventive maintenance, barcode tagging" }],
        ["DOT and daily inspections", { mark: "yes" }, { mark: "unknown", note: "Not listed; custom forms can hold inspections" }],
        ["Haul tickets and materials", { mark: "yes", note: "Digital tickets with an AI reader" }, { mark: "unknown", note: "Not listed" }],
        ["Daily reports with photos", { mark: "yes" }, { mark: "yes", note: "FORMS module, for example a Daily Work Log" }],
        ["Crew scheduling", { mark: "yes", note: "Premium category" }, { mark: "unknown", note: "Sold as a separate Foundation product" }],
        ["Crew chat", { mark: "yes", note: "Premium category" }, { mark: "unknown", note: "Not listed" }],
        ["Safety forms", { mark: "yes" }, { mark: "yes", note: "Custom forms; Health and Safety Management is a separate Foundation product" }],
        ["Sales pipeline and bids", { mark: "yes", note: "Premium category" }, { mark: "unknown", note: "Estimating is a separate Foundation product" }],
        ["Certified payroll and union tracking", { mark: "no", note: "Connects to your payroll provider" }, { mark: "yes", note: "Via its Payroll Service" }],
      ],
      note: "Fleet Management, Sales CRM, and Scheduling & Communications are Premium categories in SmartCrew. “Not listed” means we couldn't find it on WorkMax's module pages on October 22, 2026.",
    },
    {
      t: "shots",
      shots: [{ id: "phone-select-task" }, { id: "phone-working" }, { id: "phone-summary" }],
      caption: "SmartCrew's crew flow: pick job, activity and machine, switch tasks, submit the week. (Demo account.)",
    },

    { t: "h2", text: "Modules versus one app" },
    {
      t: "p",
      text: "WorkMax's [TIME](" + TIME + "), [ASSETS](" + ASSETS + "), [FORMS](" + FORMS + ") and [INSIGHT](" + INSIGHT + ") modules each do a defined job. The trade-off is that the answer to “what does it cost” is a conversation, and the answer to “where does this live” depends on which modules you bought. Haul tickets and inspections would be built as custom forms rather than arrive as features.",
    },
    {
      t: "p",
      text: "SmartCrew is one app for the whole crew day. The operator clocks in to a job, picks the machine, runs the inspection, logs the haul tickets and sends the daily report, and the cost lands on the job page against your bid.",
    },
    {
      t: "shots",
      shots: [{ id: "web-project-detail" }, { id: "web-equipment" }],
      caption: "A SmartCrew job page in dollars, and the equipment list that feeds it. (Demo data.)",
    },
    { t: "cta", title: "See it on a dirt work day", text: "A short call with Andrew walks through time, machines, haul tickets and job cost." },

    { t: "h2", text: "Where WorkMax is the better pick" },
    {
      t: "cards",
      cards: [
        {
          title: "Pick WorkMax if",
          items: [
            "You run Foundation accounting or want a payroll service built for certified payroll and unions.",
            "You want facial recognition on the punch to stop buddy punching.",
            "You want GPS-enabled asset tracking with barcode tagging for tools and small equipment.",
            "You have a larger workforce, up toward the 1,000 workers its pricing page names, and an office that wants module-by-module control.",
          ],
        },
        {
          title: "Pick SmartCrew if",
          items: [
            "You run excavators, trucks and drills and want machine hours, DOT inspections and haul tickets with the time.",
            "You want crew chat, scheduling and a sales pipeline in the same app instead of separate products.",
            "You want a price from a short call, not a module-by-module quote.",
            "You have 5–100 employees and use QuickBooks Online.",
          ],
          tone: "us",
        },
      ],
    },
    {
      t: "note",
      title: "A fair note on reviews",
      text: "WorkMax is listed on [Capterra](" + CAPTERRA + ") at 4.2 from 141 reviews. Its [US App Store listing](" + APPSTORE + ") shows 2.02 from 110 ratings (October 22, 2026). WorkMax says its users reported over 96 percent satisfaction for the last ten years. Read recent reviews of the app you'd put in your crew's hands.",
    },
  ],
  faqs: [
    {
      q: "What is the best WorkMax alternative for excavation companies?",
      a: "If you want the Foundation Software family, GPS time with facial recognition and tool tracking, WorkMax fits. If you run heavy equipment and want machine hours, DOT inspections, haul tickets and job costing in dollars in one app, SmartCrew is built for dirt work and heavy civil companies with 5–100 employees.",
    },
    {
      q: "How much does WorkMax cost?",
      a: "WorkMax doesn't publish prices. Its pricing page asks for your crew details and gives a custom quote, priced per user per module. Every user needs a license, including admins and managers.",
    },
    {
      q: "Who owns WorkMax?",
      a: "Foundation Software, a construction accounting and payroll vendor, acquired AboutTime Technologies, the developer of WorkMax, in 2023.",
    },
    {
      q: "Does WorkMax do job costing and equipment tracking?",
      a: "Its INSIGHT module compares project costs against estimates and its ASSETS module covers GPS-enabled equipment tracking, preventive maintenance and barcode tagging. Both are separate modules.",
    },
    {
      q: "Does WorkMax have haul tickets or DOT inspections?",
      a: "We couldn't find a haul ticket or DOT inspection feature on its module pages. Its FORMS module lets you build custom forms, which could hold an inspection.",
    },
    {
      q: "Does WorkMax include scheduling?",
      a: "Foundation sells labor dispatch and resource management as a separate product rather than a WorkMax module, according to WorkMax's other products page.",
    },
    {
      q: "How much does SmartCrew cost?",
      a: "Pricing depends on your company size and the features you need, and it's built to be well below the cost of enterprise construction software. You get a number on a short call with Andrew.",
    },
  ],
  sources: [
    { label: "WorkMax home page", url: HOME, accessed: "2026-10-22" },
    { label: "WorkMax pricing", url: PRICING, accessed: "2026-10-22" },
    { label: "WorkMax FAQs", url: FAQ, accessed: "2026-10-22" },
    { label: "WorkMax TIME", url: TIME, accessed: "2026-10-22" },
    { label: "WorkMax ASSETS", url: ASSETS, accessed: "2026-10-22" },
    { label: "WorkMax INSIGHT", url: INSIGHT, accessed: "2026-10-22" },
    { label: "WorkMax FORMS", url: FORMS, accessed: "2026-10-22" },
    { label: "WorkMax other Foundation products", url: OTHER, accessed: "2026-10-22" },
    { label: "WorkMax integrations", url: INTEG, accessed: "2026-10-22" },
    { label: "About WorkMax (Foundation Software acquisition)", url: ABOUT, accessed: "2026-10-22" },
    { label: "Capterra: WorkMax", url: CAPTERRA, accessed: "2026-10-22" },
    { label: "Apple App Store: WorkMax", url: APPSTORE, accessed: "2026-10-22" },
  ],
  related: ["compare/clockshark-alternative", "compare/hcss-heavyjob-alternative", "features/construction-time-tracking", "features/construction-job-costing"],
};

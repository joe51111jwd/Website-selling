import type { SeoPage } from "../../types";

const HOME = "https://www.rakenapp.com/";
const PRICING = "https://www.rakenapp.com/request-pricing";
const PLANS = "https://help.rakenapp.com/en/articles/14447812-purchasing-raken";
const CIVIL = "https://www.rakenapp.com/who-we-serve/civil-contractors";
const CLOCK = "https://help.rakenapp.com/en/articles/14148932-raken-time-clock-geolocation-verification-and-reporting";
const BUDGETS = "https://help.rakenapp.com/en/articles/16909752-how-to-set-up-and-use-budgets-in-raken";
const EQUIP = "https://help.rakenapp.com/en/articles/14492619-raken-equipment-management-heavy-and-on-road-equipment";
const SCHED = "https://help.rakenapp.com/en/articles/14437000-what-is-raken-resource-scheduling";
const MSG = "https://help.rakenapp.com/en/articles/14436989-how-to-get-started-with-messaging-in-raken";
const QBO = "https://help.rakenapp.com/en/articles/14512455-raken-quickbooks-online-integration";
const SVERICA = "https://www.prnewswire.com/news-releases/raken-announces-strategic-growth-investment-from-sverica-capital-302548069.html";

export const page: SeoPage = {
  kind: "compare",
  slug: "compare/raken-alternative",
  nav: "Raken alternative",
  keyword: "raken alternative",
  updated: "2026-10-22",
  title: "Raken Alternative for Excavation & Heavy Civil | SmartCrew",
  description:
    "Raken is a field-first daily report and time card app with a heavy civil page. See how SmartCrew compares for dirt work crews: plans and add-ons, equipment, haul tickets, inspections and job costing in dollars.",
  eyebrow: "Raken alternative",
  h1: "Raken alternative for excavation and heavy civil contractors",
  lede:
    "Raken is a field-first construction app for web and mobile that grew out of daily reports and now adds time cards, production tracking, equipment records, safety checklists, messaging and RFIs. It publishes no prices, and its own help center puts most of the field features behind the Performance plan, with the time clock and resource scheduling sold as paid add-ons. SmartCrew is the alternative for dirt work and heavy civil companies with 5–100 employees that want time, machines, haul tickets, inspections and job cost in one app.",
  summary: [
    "Raken is quote-only. Its plans are Basic and Performance, plus a Time Clock add-on and a Resource Scheduling add-on, and none of them list a price.",
    "Time cards, equipment management, safety and quality tools, budgets and the QuickBooks Online integration all need the Performance plan. Self clock-in with geofencing also needs the Time Clock add-on.",
    "Raken budgets are hours and quantities per cost code. We found no dollar budget against a bid in its help center.",
    "We found no haul ticket, DOT inspection or sales pipeline feature on its pages. Raken is the better pick if daily reports and RFIs are your center of gravity; SmartCrew is the better pick if you run machines and trucks.",
  ],
  hero: [{ id: "web-timecards" }, { id: "phone-reports" }],
  blocks: [
    { t: "h2", text: "What Raken is, and who it fits" },
    {
      t: "p",
      text: "Raken is made by Raken, Inc. of Carlsbad, California. Sverica Capital [took a majority stake in September 2025](" + SVERICA + "), when Raken reported growing from 13,000 to 70,000 users. It says it is built for general contractors, subcontractors and specialty contractors of any size, and it has pages for [heavy civil](" + CIVIL + ") and excavating contractors.",
    },
    {
      t: "p",
      text: "Its center is the daily report: notes, photos, weather and work logs, sent out as a shareable PDF. Around that it has added time cards, production tracking against cost-code budgets, equipment records, safety checklists, messaging, document storage, and RFIs, submittals and change orders. In October 2026 it launched change orders next to RFIs and submittals, which points at the project management side of a general contractor.",
    },
    {
      t: "p",
      text: "That makes Raken a strong fit for a general contractor or a subcontractor that lives on the paperwork around a project. For an excavation company where the money moves with the machines and trucks, the question is how much of the field day sits in one place, and what each piece costs to add.",
    },

    { t: "h2", text: "How much does Raken cost, and what needs an add-on?" },
    {
      t: "p",
      text: "Raken doesn't publish prices. Its pricing page is [a quote form](" + PRICING + "), so we can't give you a number or a worked example for 15 or 40 people. What its help center does publish is which plan holds which feature, and that matters as much as the price.",
    },
    {
      t: "table",
      caption: "Raken plans and add-ons, from Raken's own help center",
      head: ["Plan or add-on", "Price", "What its help center says it holds"],
      rows: [
        ["Basic", "Not published", "Core daily reporting, project management and team messaging. Work Logs instead of time cards. No Safety & QC, Insights, Equipment Management or document storage."],
        ["Performance", "Not published", "Everything in Basic, plus time cards, budgets and production tracking, equipment management, safety and quality tools, Insights, RFIs, per diem and overtime premiums, and the QuickBooks Online integration."],
        ["Time Clock add-on", "Not published", "Worker self clock-in, Photo ID and geofencing. It sits on top of Performance."],
        ["Resource Scheduling add-on", "Not published", "Shift scheduling with equipment and materials on each shift. Performance plan only."],
      ],
      note: "Sources: Raken's [purchasing guide](" + PLANS + "), [Time Clock guide](" + CLOCK + ") and [Resource Scheduling guide](" + SCHED + "), October 22, 2026. Plans and add-ons change.",
    },
    {
      t: "p",
      text: "So a crew that wants to punch in on a phone with a geofence and run its equipment records is looking at the Performance plan and the Time Clock add-on, and scheduling would be a third line. SmartCrew's pricing depends on your company size and the features you need, and it's built to be well below the cost of enterprise construction software. You get a number on a short call with Andrew.",
    },

    { t: "h2", text: "Raken vs SmartCrew, feature by feature" },
    {
      t: "table",
      caption: "What a dirt work company needs, and where each product stands",
      head: ["Job to be done", "SmartCrew", "Raken"],
      rows: [
        ["GPS clock-in with job and activity", { mark: "yes", note: "Crew also picks the machine" }, { mark: "yes", note: "Performance plan plus the Time Clock add-on; workers set location access to Always" }],
        ["Geofence behavior", { mark: "partial", note: "GPS clock-ins and reminders" }, { mark: "yes", note: "Can flag off-site punches, remind, or block clock-ins outside the project radius" }],
        ["Job costing", { mark: "yes", note: "Bid budgets vs. actual costs in dollars, daily" }, { mark: "partial", note: "Budgets are hours and quantities per cost code; no dollar budget against a bid listed" }],
        ["Equipment hours and maintenance", { mark: "yes" }, { mark: "yes", note: "Records, hours, fuel, maintenance alerts. Performance plan; managed on the web, usage logged on mobile" }],
        ["DOT and daily inspections", { mark: "yes" }, { mark: "unknown", note: "Not listed; custom checklists and a crane and rigging template exist" }],
        ["Haul tickets and materials", { mark: "yes", note: "Digital tickets with an AI reader" }, { mark: "partial", note: "Material quantities per cost code; no haul ticket feature listed" }],
        ["Daily reports with photos", { mark: "yes" }, { mark: "yes", note: "Its core product, with branded PDF output" }],
        ["Crew scheduling", { mark: "yes", note: "Premium category" }, { mark: "partial", note: "Paid add-on on the Performance plan" }],
        ["Crew chat", { mark: "yes", note: "Premium category" }, { mark: "yes", note: "All plans; workers without a team-member role can't send or receive" }],
        ["Safety forms", { mark: "yes" }, { mark: "yes", note: "Performance plan; not on Basic" }],
        ["Sales pipeline and bids", { mark: "yes", note: "Premium category" }, { mark: "unknown", note: "Not listed" }],
        ["RFIs, submittals and change orders", { mark: "unknown", note: "Not a SmartCrew focus" }, { mark: "yes", note: "A Raken strength" }],
      ],
      note: "Fleet Management, Sales CRM, and Scheduling & Communications are Premium categories in SmartCrew. “Not listed” means we couldn't find it on Raken's pages or help center on October 22, 2026.",
    },
    {
      t: "shots",
      shots: [{ id: "phone-select-task" }, { id: "phone-working" }, { id: "phone-summary" }],
      caption: "SmartCrew's crew flow: pick job, activity and machine, switch tasks, submit the week. (Demo account.)",
    },

    { t: "h2", text: "Hours and quantities versus dollars" },
    {
      t: "p",
      text: "Raken's [budgets](" + BUDGETS + ") set planned hour and quantity targets for each cost code, and its reports show efficiency, percent complete and projected hours. That's a real production tracking tool, and for a crew that thinks in yards moved per day it speaks the right language. What we couldn't find is a dollar budget against a bid. Its help center also notes that percent complete caps at 100 percent in reports, even when actual hours exceed the budget.",
    },
    {
      t: "p",
      text: "SmartCrew's job page rolls labor, materials, equipment, other costs and change orders against the budget you bid, so you see profit and loss on a job in dollars while it's still running.",
    },
    {
      t: "shots",
      shots: [{ id: "web-project-detail" }, { id: "web-equipment" }],
      caption: "A SmartCrew job page in dollars, and the equipment list that feeds it. (Demo data.)",
    },

    { t: "h2", text: "Equipment: records on one side, a daily flow on the other" },
    {
      t: "p",
      text: "Raken has a real [equipment management](" + EQUIP + ") feature for heavy and on-road equipment: hours, mileage, fuel, maintenance schedules with alerts and deficiencies. Usage is logged by hand or from time cards, and no telematics hardware is documented. Adding and editing equipment is web-only; the phone is for logging daily usage.",
    },
    {
      t: "p",
      text: "SmartCrew puts the machine in the crew's day. The operator picks the machine when they clock in, hours land on the job automatically, and the same phone does the daily inspection and the haul ticket. If you want to read more about that flow, see [construction time tracking](/features/construction-time-tracking/) and [excavation software](/excavation-software/).",
    },
    { t: "cta", title: "See the dirt work version", text: "A short call with Andrew walks through time, machines, haul tickets and job cost on your numbers." },

    { t: "h2", text: "Where Raken is the better pick" },
    {
      t: "cards",
      cards: [
        {
          title: "Pick Raken if",
          items: [
            "Daily reports, RFIs, submittals and change orders are the center of your work.",
            "You want the scale of a product with tens of thousands of users and a long list of integrations.",
            "You want geofencing that can block clock-ins outside the project radius.",
            "You work as a general contractor or subcontractor on projects with owners and architects.",
          ],
        },
        {
          title: "Pick SmartCrew if",
          items: [
            "You run excavators, trucks and drills and want machine hours, DOT inspections and haul tickets with the time.",
            "You want job costing in dollars against your bid, not hours and quantities alone.",
            "You want crew chat, scheduling and a sales pipeline included as categories in one app.",
            "You have 5–100 employees and use QuickBooks Online.",
          ],
          tone: "us",
        },
      ],
    },
    {
      t: "note",
      title: "QuickBooks details to check",
      text: "Raken's QuickBooks Online integration is Performance-only, is set up by Raken's team, and isn't compatible with QuickBooks Online Simple Start or Essentials. With pay type and cost code sync turned on, time syncs as total hours only. Read [the integration page](" + QBO + ") before you buy if QuickBooks is your payroll path.",
    },
    {
      t: "note",
      title: "A fair note on reviews",
      text: "Raken is rated 4.6 from 250 reviews on Software Advice and 4.75 from about 22,600 ratings on the US App Store (October 22, 2026). It's a well-liked product, and the ratings come from users in a wide mix of trades.",
    },
  ],
  faqs: [
    {
      q: "What is the best Raken alternative for excavation companies?",
      a: "If daily reports and project paperwork are your main need, Raken is a strong product. If you run heavy equipment and want machine hours, DOT inspections, haul tickets and job costing in dollars in the same app as time, SmartCrew is built for dirt work and heavy civil companies with 5–100 employees.",
    },
    {
      q: "How much does Raken cost?",
      a: "Raken doesn't publish prices. Its pricing page is a quote form, and its help center lists Basic and Performance plans plus paid Time Clock and Resource Scheduling add-ons. Ask for a quote that spells out each line.",
    },
    {
      q: "Does Raken have time cards on every plan?",
      a: "No. Raken's help center says time cards in any form require the Performance plan, and Basic accounts use Work Logs instead. Worker self clock-in and geofencing also need the Time Clock add-on.",
    },
    {
      q: "Does Raken track equipment?",
      a: "Yes. Raken's equipment management covers hours, mileage, fuel, maintenance schedules with alerts and deficiencies for heavy and on-road equipment. It requires the Performance plan and is managed on the web.",
    },
    {
      q: "Does Raken do job costing?",
      a: "Raken's budgets track planned hours and quantities per cost code on the Performance plan. We couldn't find a dollar budget against a bid in its help center.",
    },
    {
      q: "Does Raken have haul tickets or DOT inspections?",
      a: "We couldn't find a haul ticket or DOT inspection feature on Raken's pages or help center. It has custom safety checklists and a crane and rigging template.",
    },
    {
      q: "How much does SmartCrew cost?",
      a: "Pricing depends on your company size and the features you need, and it's built to be well below the cost of enterprise construction software. You get a number on a short call with Andrew.",
    },
  ],
  sources: [
    { label: "Raken home page", url: HOME, accessed: "2026-10-22" },
    { label: "Raken pricing page (quote form)", url: PRICING, accessed: "2026-10-22" },
    { label: "Raken help center: purchasing Raken", url: PLANS, accessed: "2026-10-22" },
    { label: "Raken: heavy civil contractor software", url: CIVIL, accessed: "2026-10-22" },
    { label: "Raken help center: Time Clock geofencing", url: CLOCK, accessed: "2026-10-22" },
    { label: "Raken help center: budgets", url: BUDGETS, accessed: "2026-10-22" },
    { label: "Raken help center: equipment management", url: EQUIP, accessed: "2026-10-22" },
    { label: "Raken help center: Resource Scheduling", url: SCHED, accessed: "2026-10-22" },
    { label: "Raken help center: messaging", url: MSG, accessed: "2026-10-22" },
    { label: "Raken help center: QuickBooks Online", url: QBO, accessed: "2026-10-22" },
    { label: "PR Newswire: Sverica Capital investment (Sept 2025)", url: SVERICA, accessed: "2026-10-22" },
  ],
  related: ["compare/busybusy-alternative", "compare/procore-alternative", "features/construction-time-tracking", "features/construction-job-costing"],
};

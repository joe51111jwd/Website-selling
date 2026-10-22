import type { SeoPage } from "../../types";

const PRICING = "https://www.clockshark.com/pricing";
const JOBCOST = "https://www.clockshark.com/tour/job-costing";
const GEOFENCE = "https://www.clockshark.com/tour/geofence-time-tracking";
const LIGHTNING = "https://www.clockshark.com/lightning/";
const QUOTAS = "https://www.clockshark.com/service-quotas-usage-limits/";
const INTEG = "https://www.clockshark.com/integrations/";
const CONV = "https://www.clockshark.com/tour/conversations";

export const page: SeoPage = {
  kind: "compare",
  slug: "compare/clockshark-alternative",
  nav: "ClockShark alternative",
  keyword: "clockshark alternative",
  updated: "2026-10-22",
  title: "ClockShark Alternative for Excavation & Heavy Civil | SmartCrew",
  description:
    "ClockShark covers time tracking, scheduling and light job costing under a three-year contract. See how SmartCrew compares for dirt work crews: machines, haul tickets, inspections and job costing.",
  eyebrow: "ClockShark alternative",
  h1: "ClockShark alternative for excavation and heavy civil contractors",
  lede:
    "ClockShark is a mobile GPS time tracking and scheduling app for construction and field service crews, with a light customer manager and, on its Pro plan, bid-versus-actual job costing. It stops at time and scheduling: we found no equipment, maintenance, inspection, haul ticket or daily report features on its own pages. SmartCrew is the alternative for dirt work and heavy civil companies with 5–100 employees that want those in the same app as time.",
  summary: [
    "ClockShark charges a monthly base fee plus a per-user fee, and its pricing page says a three-year contract term applies to all plans.",
    "Bid-versus-actual job costing is Pro-only and set up in the web app. Materials, equipment and sub costs are entered by hand.",
    "ClockShark is the better pick for crews that mainly need time, scheduling, kiosk punch-in and QuickBooks Desktop or Online sync.",
    "SmartCrew is the better pick if you run machines and trucks and want equipment, DOT inspections, haul tickets, daily reports and job profit in one app.",
  ],
  hero: [{ id: "web-timecards" }, { id: "phone-home" }],
  blocks: [
    { t: "h2", text: "What ClockShark is, and who it fits" },
    {
      t: "p",
      text: "ClockShark started as a family trade business in Chico, California, and is now part of the Simpro Group, which also owns Simpro, BigChange and AroFlo. It describes itself as built for construction and field service teams from a handful of people up to about seventy-five. Its core is GPS clock-in with a breadcrumb trail, drag-and-drop scheduling, approvals and sync with accounting.",
    },
    {
      t: "p",
      text: "In August 2026 ClockShark launched [ClockShark Lightning](" + LIGHTNING + "): an AI shift brief for each crew member, task checklists of up to 20 items, and Pro-only mileage tracking. Its [Customer Manager](https://www.clockshark.com/tour/customer-manager) keeps customer records, and its [Conversations](" + CONV + ") feature is comment threads on jobs and customers, not a general crew chat.",
    },
    {
      t: "p",
      text: "For a landscaping outfit, a small electrical contractor or an excavation crew that only wants hours and schedules, that's a clean fit. For a company that runs iron, it leaves out most of the daily work.",
    },

    { t: "h2", text: "How much does ClockShark cost?" },
    {
      t: "table",
      caption: "ClockShark list prices, US dollars per month",
      head: ["Plan", "Base fee", "Per user", "What it adds"],
      rows: [
        ["Standard", "$42", "$9.50", "Time and attendance, GPS, job and task tracking, scheduling, approvals, integrations, task checklists"],
        ["Pro", "$63", "$11.50", "PTO, multi-office controls, advanced job costing, shift wrap-up and compliance forms, mileage tracking"],
      ],
      note: "Source: [ClockShark pricing](" + PRICING + "), October 22, 2026. The page's own code carries two sets of US numbers ($42 + $9.50 and $63 + $11.50, and an older $40 + $9 and $60 + $11), so confirm the figure on the page before you rely on it.",
    },
    {
      t: "note",
      title: "Example: 15 and 40 people on list prices",
      text: "Estimates from the higher numbers above, not quotes, with integrations and add-ons left out. 15 people: Standard is $42 + (15 × $9.50) = $184.50 a month, Pro is $63 + (15 × $11.50) = $235.50. 40 people: Standard is $42 + (40 × $9.50) = $422, Pro is $63 + (40 × $11.50) = $523. ClockShark bills for active users, prorated by the day.",
    },
    {
      t: "p",
      text: "The term matters as much as the price. ClockShark's pricing page says a [three-year contract term applies to all pricing plans](" + PRICING + "), with a 14-day trial. Its ADP connector [costs extra](" + INTEG + "), and its fair-use policy lets it throttle or charge for excess AI, storage and notification use ([service quotas](" + QUOTAS + ")). SmartCrew's pricing depends on your company size and the features you need, and it's built to be well below the cost of enterprise construction software. You get a number on a short call with Andrew.",
    },

    { t: "h2", text: "ClockShark vs SmartCrew, feature by feature" },
    {
      t: "table",
      caption: "What a dirt work company needs, and where each product stands",
      head: ["Job to be done", "SmartCrew", "ClockShark"],
      rows: [
        [
          "GPS clock-in with job and task",
          { mark: "yes", note: "Crew also picks the machine at clock-in" },
          { mark: "yes", note: "GPS clock-in and a breadcrumb trail every 10–15 minutes" },
        ],
        [
          "Automatic clock-in",
          { mark: "partial", note: "GPS clock-ins and reminders" },
          { mark: "partial", note: "Geofences remind workers and flag out-of-bounds punches; they don't punch in for them" },
        ],
        [
          "Job costing against the bid",
          { mark: "yes", note: "Bid budgets vs. actual, updated daily" },
          { mark: "partial", note: "Pro only, web app only; materials, equipment and sub costs are typed in" },
        ],
        ["Equipment hours and maintenance", { mark: "yes" }, { mark: "unknown", note: "Not listed; equipment appears only as a manual cost in job costing" }],
        ["DOT and daily inspections", { mark: "yes" }, { mark: "unknown", note: "Not listed" }],
        ["Haul tickets and material logs", { mark: "yes", note: "Digital tickets with an AI reader" }, { mark: "unknown", note: "Not listed" }],
        ["Daily reports with photos", { mark: "yes" }, { mark: "unknown", note: "Clock-out questions and file attachments are listed; no daily report" }],
        ["Crew scheduling", { mark: "yes", note: "Premium category" }, { mark: "yes", note: "Drag-and-drop scheduling on all plans" }],
        ["Crew chat", { mark: "yes", note: "Premium category" }, { mark: "partial", note: "Comment threads on jobs and customers, not a general chat" }],
        ["Safety: JSAs, toolbox talks, incidents", { mark: "yes" }, { mark: "partial", note: "Custom clock-out questions on Pro; no JSA or toolbox talk library listed" }],
        ["Sales pipeline and bid tracking", { mark: "yes", note: "Premium category" }, { mark: "partial", note: "Customer records; jobs carry a bid amount; no estimating or pipeline" }],
        ["Shared-device kiosk punch-in", { mark: "no" }, { mark: "yes", note: "KioskClock with PIN or facial recognition" }],
        ["QuickBooks Desktop", { mark: "no", note: "In the works" }, { mark: "yes" }],
        ["QuickBooks Online", { mark: "yes" }, { mark: "yes", note: "Two-way sync of jobs, customers, service items and employees" }],
      ],
      note: "Feature availability varies by plan. Fleet Management, Sales CRM, and Scheduling & Communications are Premium categories in SmartCrew. “Not listed” means we couldn't find it on ClockShark's own pages on October 22, 2026, not that ClockShark confirmed it's missing.",
    },
    {
      t: "shots",
      shots: [{ id: "phone-select-task" }, { id: "phone-working" }, { id: "phone-summary" }],
      caption: "SmartCrew's crew flow: pick job, activity and machine; work and switch tasks; submit the weekly timecard. (Demo account.)",
    },

    { t: "h2", text: "Where ClockShark's job costing stops" },
    {
      t: "p",
      text: "ClockShark's [job costing](" + JOBCOST + ") compares a job's bid amount with actual labor and shows gross profit, margin and budget alert emails. It's Pro-only and viewed in the web app, and it says materials, equipment, rentals and subcontractor costs are entered manually.",
    },
    {
      t: "p",
      text: "For an excavation job, the non-labor side is most of the cost: machine hours, hauled material, fuel and trucking. In SmartCrew those come from the same field logs as the hours: machine time from clock-ins, loads from the hauling log, receipts from photo uploads. The job page rolls them up against the budget without someone retyping them.",
    },
    {
      t: "shots",
      shots: [{ id: "web-project-detail" }, { id: "web-materials" }],
      caption: "A SmartCrew job page, and the materials screen that feeds it. (Demo data.)",
    },
    { t: "cta", title: "See SmartCrew with your jobs in it", text: "A short call with Andrew, SmartCrew's founder. He'll set it up around your crews, machines and cost codes." },

    { t: "h2", text: "What ClockShark does better" },
    {
      t: "cards",
      cards: [
        {
          title: "Pick ClockShark if",
          items: [
            "Your need is hours, schedules and approvals, and nothing about machines or loads.",
            "You use QuickBooks Desktop and want it to sync.",
            "Your crews share a tablet at the shop and punch in with a PIN or face.",
            "You also run service work and want customer records beside the schedule.",
            "You're comfortable with the contract term and a per-user price.",
          ],
        },
        {
          title: "Pick SmartCrew if",
          items: [
            "You run excavators, trucks and drills and want equipment, DOT inspections and the shop queue in the same app as time.",
            "You log haul tickets and want an AI reader to enter them.",
            "You want daily reports, crew chat and a sales pipeline included.",
            "You want job profit against the bid without typing in equipment and material costs.",
            "You have 5–100 employees and use QuickBooks Online.",
          ],
          tone: "us",
        },
      ],
    },
    {
      t: "note",
      title: "A fair note on reviews",
      text: "ClockShark is rated 4.7 from 1,911 reviews on Capterra, which is excellent. On the US App Store, its current app listing shows 2.9 from 88 ratings (October 22, 2026). That listing is newer than the Capterra review base, so the two numbers measure different things.",
    },
  ],
  faqs: [
    {
      q: "What is the best ClockShark alternative for excavation companies?",
      a: "It depends on what you need beyond time tracking. ClockShark covers GPS clock-in, scheduling and light job costing. If you also need equipment records, DOT inspections, haul tickets and daily reports in one app, SmartCrew is built for dirt work and heavy civil companies with 5–100 employees.",
    },
    {
      q: "How much does ClockShark cost?",
      a: "On October 22, 2026, ClockShark's pricing page showed Standard at $42 a month plus $9.50 per user and Pro at $63 plus $11.50 per user, with a three-year contract term on all plans. The page's code also carries older numbers, so confirm on the page.",
    },
    {
      q: "Does ClockShark have a long contract?",
      a: "ClockShark's pricing page states that a contract term of three years applies to all pricing plans, with a 14-day trial first.",
    },
    {
      q: "Does ClockShark track equipment or do haul tickets?",
      a: "We couldn't find equipment tracking, maintenance, inspections or haul tickets on ClockShark's own pricing page or product menu. Equipment appears only as a manually entered cost in its Pro job costing.",
    },
    {
      q: "Does ClockShark clock workers in automatically?",
      a: "No. According to ClockShark's geofence page, geofences prompt workers to clock in and out and flag punches made outside the boundary, but they don't punch workers in on their own.",
    },
    {
      q: "Does ClockShark work with QuickBooks?",
      a: "Yes, with both QuickBooks Online and QuickBooks Desktop. SmartCrew connects to QuickBooks Online today; Desktop, Foundation and ADP integrations are in the works.",
    },
    {
      q: "How much does SmartCrew cost?",
      a: "Pricing depends on your company size and the features you need, and it's built to be well below the cost of enterprise construction software. You get a number on a short call with Andrew.",
    },
  ],
  sources: [
    { label: "ClockShark pricing", url: PRICING, accessed: "2026-10-22" },
    { label: "ClockShark job costing", url: JOBCOST, accessed: "2026-10-22" },
    { label: "ClockShark geofence time tracking", url: GEOFENCE, accessed: "2026-10-22" },
    { label: "ClockShark Lightning", url: LIGHTNING, accessed: "2026-10-22" },
    { label: "ClockShark Conversations", url: CONV, accessed: "2026-10-22" },
    { label: "ClockShark integrations", url: INTEG, accessed: "2026-10-22" },
    { label: "ClockShark service quotas and usage limits", url: QUOTAS, accessed: "2026-10-22" },
    { label: "ClockShark about", url: "https://www.clockshark.com/about/", accessed: "2026-10-22" },
    { label: "ClockShark on Capterra", url: "https://www.capterra.com/p/155467/ClockShark/", accessed: "2026-10-22" },
  ],
  related: ["compare/busybusy-alternative", "features/construction-time-tracking", "features/construction-job-costing", "excavation-software"],
};

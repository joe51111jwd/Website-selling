import type { SeoPage } from "../../types";

// Wave 5 (Oct 22, 2026). "ClockShark vs busybusy" came up in Reddit threads and comparison posts
// (src/seo/research/top-50-questions.md). Facts are the ones already sourced and dated on the two
// compare pages and in sources/wave-4.md. ClockShark's dollar figures are marked uncertain there
// (loaded by JavaScript), so this page says so too. busybusy prices: annual billing only, as verified.
const CS_PRICING = "https://www.clockshark.com/pricing";
const CS_JOBCOST = "https://www.clockshark.com/tour/job-costing";
const CS_GEO = "https://www.clockshark.com/tour/geofence-time-tracking";
const CS_INTEG = "https://www.clockshark.com/integrations/";
const CS_ABOUT = "https://www.clockshark.com/about/";
const BB_PRICING = "https://busybusy.com/pricing/";
const BB_MODULES = "https://busybusy.com/modules/";
const BB_OPS = "https://busybusy.com/modules/operations/";
const BB_GPS = "https://busybusy.com/features/gps-time-tracking/";
const BB_INTEG = "https://busybusy.com/integrations/";
const BB_FAIR = "https://busybusy.com/fair-billing/";
const BB_ABOUT = "https://busybusy.com/about-us/";

export const page: SeoPage = {
  kind: "versus",
  slug: "vs/clockshark-vs-busybusy",
  nav: "ClockShark vs busybusy",
  keyword: "clockshark vs busybusy",
  updated: "2026-10-22",
  title: "ClockShark vs busybusy for Construction Crews",
  description:
    "ClockShark vs busybusy compared for construction crews: list prices and contract terms, GPS clock-in, equipment hours, job costing, integrations and who each one fits.",
  eyebrow: "ClockShark vs busybusy",
  h1: "ClockShark vs busybusy: which time tracking app fits your crew?",
  lede:
    "ClockShark and busybusy are both GPS time tracking apps for construction. busybusy has a free plan, tracks machine hours on every plan and sells equipment maintenance and safety as add-on modules. ClockShark builds scheduling into every plan, offers kiosk punch-in, and its pricing page says a three-year contract term applies to all plans. Pick busybusy if machines and a low entry price matter most; pick ClockShark if scheduling and a shared-tablet clock matter most.",
  summary: [
    "busybusy lists a free plan, then Pro at $9.99 and Premium at $14.99 per user per month billed annually, plus a $40 admin license (checked October 22, 2026).",
    "ClockShark charges a monthly base fee plus a per-user fee, with a three-year term on all plans and a 14-day trial.",
    "busybusy tracks equipment hours on all plans; we found no equipment tracking on ClockShark's pages.",
    "Neither lists haul tickets or DOT inspections; SmartCrew is the option when you need those in the same app as time.",
  ],
  hero: [{ id: "phone-working" }, { id: "web-timecards" }],
  blocks: [
    { t: "h2", text: "What is the main difference between ClockShark and busybusy?" },
    {
      t: "p",
      text: "The main difference is what each adds on top of the time clock. busybusy adds equipment: machine hours on every plan, and work orders, inspections and GPS tracker hardware through paid modules ([busybusy modules](" + BB_MODULES + ")). ClockShark adds the office side of a service crew: drag-and-drop scheduling on every plan, customer records and a shared-device kiosk clock ([ClockShark pricing](" + CS_PRICING + ")).",
    },
    {
      t: "p",
      text: "Their roots show it. busybusy was started in Southern Utah by a founder with a background in excavating and land development ([busybusy about](" + BB_ABOUT + ")). ClockShark started as a family trade business in Chico, California, and is part of the Simpro Group ([ClockShark about](" + CS_ABOUT + ")).",
    },

    { t: "h2", text: "Is ClockShark or busybusy cheaper?" },
    {
      t: "p",
      text: "busybusy is cheaper to start, because it lists a free plan and no base fee on its paid plans beyond a $40 admin license. ClockShark adds a monthly base fee to its per-user price and, per its pricing page, a three-year contract term on all plans ([ClockShark pricing](" + CS_PRICING + ")). busybusy's [fair billing page](" + BB_FAIR + ") describes a 90-day money-back guarantee that excludes setup, integration and hardware fees.",
    },
    {
      t: "table",
      caption: "List prices as checked on October 22, 2026, US dollars",
      head: ["", "busybusy", "ClockShark"],
      rows: [
        ["Free plan", "Yes", "Not listed; 14-day trial"],
        ["Lower paid plan", "Pro: $9.99 per user per month, billed annually", "Standard: $42 a month plus $9.50 per user (see note)"],
        ["Higher paid plan", "Premium: $14.99 per user per month, billed annually", "Pro: $63 a month plus $11.50 per user (see note)"],
        ["Other fees listed", "$40 admin license on paid plans; modules priced through a demo", "ADP connector costs extra"],
        ["Term", "Not stated on the pricing page", "Three-year contract term on all plans"],
      ],
      note: "Sources: [busybusy pricing](" + BB_PRICING + "), [ClockShark pricing](" + CS_PRICING + "), [ClockShark integrations](" + CS_INTEG + "). ClockShark's dollar amounts load by script and its page code also carries older figures, so confirm them on the page. busybusy's admin license period isn't shown. List prices; plans and promotions change.",
    },
    {
      t: "note",
      title: "Example: 15 and 40 people on the lower paid plan",
      text: "Estimates from the list prices above, not quotes, leaving out busybusy's $40 admin license, modules and any setup fees. 15 people: busybusy Pro is 15 × $9.99 = $149.85 a month billed annually; ClockShark Standard is $42 + (15 × $9.50) = $184.50 a month. 40 people: busybusy Pro is 40 × $9.99 = $399.60; ClockShark Standard is $42 + (40 × $9.50) = $422.00. Both say they bill for active users.",
    },

    { t: "h2", text: "How do ClockShark and busybusy compare feature by feature?" },
    {
      t: "table",
      caption: "What a dirt work or trade crew asks for, and where each stands",
      head: ["Job to be done", "busybusy", "ClockShark", "SmartCrew"],
      rows: [
        ["GPS clock-in by job and cost code", { mark: "yes" }, { mark: "yes", note: "Breadcrumb trail every 10 to 15 minutes" }, { mark: "yes", note: "Crew also picks the machine" }],
        ["Clocks people in automatically", { mark: "partial", note: "Geofence reminders" }, { mark: "partial", note: "Geofences remind and flag punches" }, { mark: "partial", note: "GPS clock-ins and reminders" }],
        ["Equipment hours", { mark: "yes", note: "All plans" }, { mark: "unknown", note: "Not listed" }, { mark: "yes" }],
        ["Maintenance and work orders", { mark: "yes", note: "Paid Operations module" }, { mark: "unknown", note: "Not listed" }, { mark: "yes", note: "Service requests and shop queue" }],
        ["Job costing against a budget", { mark: "yes", note: "Budgets on Pro and Premium" }, { mark: "partial", note: "Pro only; non-labor costs typed in" }, { mark: "yes", note: "Daily, against the bid" }],
        ["Crew scheduling", { mark: "yes", note: "Pro and Premium" }, { mark: "yes", note: "All plans" }, { mark: "yes", note: "Premium category" }],
        ["Daily reports", { mark: "yes", note: "Premium, or add-on on Pro" }, { mark: "unknown", note: "Not listed" }, { mark: "yes" }],
        ["Haul tickets and DOT inspections", { mark: "unknown", note: "Not listed" }, { mark: "unknown", note: "Not listed" }, { mark: "yes" }],
        ["Kiosk punch-in on a shared tablet", { mark: "yes", note: "Pro and Premium" }, { mark: "yes", note: "PIN or facial recognition" }, { mark: "no" }],
        ["QuickBooks", { mark: "yes", note: "QuickBooks Desktop listed" }, { mark: "yes", note: "Desktop and Online" }, { mark: "partial", note: "Online today; Desktop in the works" }],
      ],
      note: "From each vendor's own pages on October 22, 2026 ([busybusy GPS time tracking](" + BB_GPS + "), [busybusy integrations](" + BB_INTEG + "), [ClockShark geofencing](" + CS_GEO + "), [ClockShark job costing](" + CS_JOBCOST + ")). “Not listed” means we couldn't find it, not that the vendor confirmed it's missing. Feature availability varies by plan. Fleet Management, Sales CRM, and Scheduling & Communications are Premium categories in SmartCrew.",
    },
    {
      t: "shots",
      shots: [{ id: "phone-select-task" }, { id: "phone-summary" }],
      caption: "SmartCrew's clock-in with job, activity code and machine, and the weekly timecard. (Demo account.)",
    },

    { t: "h2", text: "Which is better for an excavation company, ClockShark or busybusy?" },
    {
      t: "p",
      text: "For an excavation company, busybusy is usually the closer fit of the two, because machine hours are part of every plan and its [Operations module](" + BB_OPS + ") adds inspections and work orders. ClockShark's [job costing](" + CS_JOBCOST + ") says equipment, materials and sub costs are entered by hand, which is most of the cost on a dirt job. ClockShark fits better when the crew is mostly labor, the schedule changes daily, and people punch in at a shared tablet.",
    },
    {
      t: "cards",
      cards: [
        {
          title: "Pick busybusy if",
          items: [
            "You want to start free and pay per user only when you need more.",
            "Machine hours by job matter as much as people hours.",
            "You need a ready integration with Sage, Viewpoint, Foundation, ADP or Procore.",
          ],
          tone: "them",
        },
        {
          title: "Pick ClockShark if",
          items: [
            "Scheduling on every plan and a shared-tablet kiosk matter most.",
            "You also run service work and want customer records next to the schedule.",
            "A three-year term at a known price suits you.",
          ],
          tone: "them",
        },
        {
          title: "Look at SmartCrew if",
          items: [
            "You run trucks and iron and need haul tickets, DOT inspections and a shop queue next to time.",
            "You want daily reports, crew chat and job profit without buying modules.",
            "You're a 5 to 100 person dirt work company on QuickBooks Online.",
          ],
          tone: "us",
        },
      ],
    },
    { t: "cta", title: "Comparing time apps for a dirt work crew?", text: "A short call with Andrew, SmartCrew's founder, shows what one app for time, machines and loads looks like with your jobs in it." },

    { t: "h2", text: "What do neither ClockShark nor busybusy cover for heavy civil?" },
    {
      t: "p",
      text: "Neither lists haul or load tickets or DOT and DVIR inspections on its own pages, and neither lists a sales pipeline. For a company that runs dump trucks and lowboys, those are daily paperwork. SmartCrew's hauling log records ticket, truck, project, import or export, material, yards and source pit, with an AI reader for paper tickets, and its DOT and daily inspections sit on the same phone as the clock-in. Pricing depends on your company size and the features you need; it's built to be well below enterprise construction software. You get a number on a short call with Andrew.",
    },
    {
      t: "shots",
      shots: [{ id: "phone-hauling" }, { id: "phone-dot" }],
      caption: "The haul log and a DOT inspection in the SmartCrew phone app. (Demo account.)",
    },
    {
      t: "p",
      text: "For each app on its own, see the [busybusy alternative](compare/busybusy-alternative) and [ClockShark alternative](compare/clockshark-alternative) pages, which go deeper on plans and switching.",
    },
  ],
  faqs: [
    {
      q: "Is busybusy or ClockShark better for construction?",
      a: "busybusy suits crews that run equipment and want a free starting plan; ClockShark suits crews that want scheduling on every plan and a shared-tablet kiosk. Both are GPS time trackers first, so neither lists haul tickets or DOT inspections.",
    },
    {
      q: "Does busybusy have a free plan?",
      a: "Yes. On October 22, 2026 busybusy's pricing page listed a free plan with GPS time tracking, job costing, equipment tracking and unlimited users. Paid plans add a $40 admin license.",
    },
    {
      q: "Does ClockShark require a contract?",
      a: "ClockShark's pricing page said on October 22, 2026 that a three-year contract term applies to all pricing plans, with a 14-day trial first. Confirm the term with ClockShark before you sign.",
    },
    {
      q: "Do ClockShark and busybusy track equipment?",
      a: "busybusy tracks machine hours on all plans and sells maintenance and GPS tracker hardware as modules. We found no equipment tracking on ClockShark's own pages; its job costing has equipment entered as a manual cost.",
    },
    {
      q: "Is there an app that does time, equipment and haul tickets together?",
      a: "SmartCrew does, for heavy civil and dirt work companies with 5 to 100 employees: GPS time by job, activity and machine, equipment and DOT inspections, digital haul tickets and job costing in one app.",
    },
  ],
  sources: [
    { label: "busybusy pricing", url: BB_PRICING, accessed: "2026-10-22" },
    { label: "busybusy modules", url: BB_MODULES, accessed: "2026-10-22" },
    { label: "busybusy Operations module", url: BB_OPS, accessed: "2026-10-22" },
    { label: "busybusy GPS time tracking", url: BB_GPS, accessed: "2026-10-22" },
    { label: "busybusy integrations", url: BB_INTEG, accessed: "2026-10-22" },
    { label: "busybusy fair billing", url: BB_FAIR, accessed: "2026-10-22" },
    { label: "busybusy about us", url: BB_ABOUT, accessed: "2026-10-22" },
    { label: "ClockShark pricing", url: CS_PRICING, accessed: "2026-10-22" },
    { label: "ClockShark job costing", url: CS_JOBCOST, accessed: "2026-10-22" },
    { label: "ClockShark geofence time tracking", url: CS_GEO, accessed: "2026-10-22" },
    { label: "ClockShark integrations", url: CS_INTEG, accessed: "2026-10-22" },
    { label: "ClockShark about", url: CS_ABOUT, accessed: "2026-10-22" },
  ],
  related: ["compare/busybusy-alternative", "compare/clockshark-alternative", "vs/hcss-vs-busybusy", "features/construction-time-tracking"],
};

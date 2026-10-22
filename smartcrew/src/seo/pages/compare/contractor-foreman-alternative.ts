import type { SeoPage } from "../../types";

const HOME = "https://contractorforeman.com/";
const PRICING = "https://contractorforeman.com/pricing/";
const TIMECARDS = "https://contractorforeman.com/features/people/time-cards/";
const EQUIP = "https://contractorforeman.com/features/documents/equipment-and-vehicle-logs/";
const CHAT = "https://contractorforeman.com/features/people/team-chat/";
const QBO = "https://contractorforeman.com/features/integrations/quickbooks/";
const NEW = "https://contractorforeman.com/whats-new/";
const CAPTERRA = "https://www.capterra.com/p/166113/Contractor-Foreman/";

export const page: SeoPage = {
  kind: "compare",
  slug: "compare/contractor-foreman-alternative",
  nav: "Contractor Foreman alternative",
  keyword: "contractor foreman alternative",
  updated: "2026-10-22",
  title: "Contractor Foreman Alternative for Excavation & Heavy Civil | SmartCrew",
  description:
    "Contractor Foreman is a low-cost all-in-one app priced per company by user cap. See how SmartCrew compares for dirt work crews: machines, haul tickets, DOT inspections and job costing in dollars.",
  eyebrow: "Contractor Foreman alternative",
  h1: "Contractor Foreman alternative for excavation and heavy civil contractors",
  lede:
    "Contractor Foreman is an all-in-one construction management app for small and mid-sized general, trade and service contractors, with a public flat price per company based on how many users you need. Time cards, daily logs, equipment logs and job costing reports start at its Plus plan. We found no haul ticket or DOT inspection feature on its pages. SmartCrew is the alternative for dirt work and heavy civil companies with 5–100 employees that run machines and trucks.",
  summary: [
    "Contractor Foreman publishes its prices: $49, $105, $166, $221 and $332 a month on annual billing, for 1, 3, 8, 15 and unlimited users. The price is for the company, not per user.",
    "Time cards, daily logs, equipment and vehicle logs, safety meetings, crew schedule, job costing reports and the QuickBooks Online sync are not on the two cheapest plans. They start at Plus.",
    "It covers estimates, bids, leads, chat and QuickBooks Online for a low price. We found no haul ticket or DOT inspection feature, and offline time cards reached preview in April 2026.",
    "Contractor Foreman is the better pick for a small contractor that wants a cheap all-in-one with a client portal. SmartCrew is the better pick if you run machines and trucks.",
  ],
  hero: [{ id: "web-timecards" }, { id: "phone-home" }],
  blocks: [
    { t: "h2", text: "What Contractor Foreman is, and who it fits" },
    {
      t: "p",
      text: "Contractor Foreman was founded in 2017 and is headquartered in Forest City, North Carolina. Its [home page](" + HOME + ") says it was created for small and medium sized residential and commercial trade and general contractors, and it lists general, sub, trade and service contractors as its segments. Its pricing page says its customers run from tiny companies to some with more than 300 employees.",
    },
    {
      t: "p",
      text: "The pitch is breadth at a low price. One account covers estimates, bids, leads, a client portal, purchase orders, bills, a Gantt schedule, a crew schedule, time cards, daily logs, equipment logs, safety meetings, team chat and a two-way QuickBooks Online sync. For a remodeler or a small general contractor, that can replace a stack of separate tools.",
    },
    {
      t: "p",
      text: "For a dirt work company, the useful question is which of those pieces sit on the plan you'd buy, and what's missing from the day on a machine.",
    },

    { t: "h2", text: "How much does Contractor Foreman cost?" },
    {
      t: "table",
      caption: "Contractor Foreman list prices, US dollars per month, per company",
      head: ["Plan", "Annual billing", "Monthly billing", "Users allowed", "Field features"],
      rows: [
        ["Basic", "$49", "Not available", "1", "No time cards, daily logs, equipment logs, safety meetings, scheduling, QuickBooks Online or job costing reports"],
        ["Standard", "$105", "$139", "3", "Adds opportunities, bills, purchase orders and online payments; still no time cards, daily logs or equipment logs"],
        ["Plus", "$166", "$199", "8", "Adds time cards, daily logs, equipment and vehicle logs, safety meetings, crew schedule, leads, job costing reports and QuickBooks Online"],
        ["Pro", "$221", "$279", "15", "Adds client portal, AIA invoicing, takeoffs and submittals; free setup"],
        ["Unlimited", "$332", "$399", "Unlimited", "Adds unlimited training sessions; free setup"],
      ],
      note: "Source: [Contractor Foreman pricing](" + PRICING + "), October 22, 2026. Card fees of 2.9% plus $0.30 apply to online payments. Prices change.",
    },
    {
      t: "note",
      title: "Example: 15 and 40 people on list prices",
      text: "Estimates, not quotes. The fee covers the company, and the plans cap the number of users. If all 15 people have a login, the 15-user Pro plan is $221 a month on annual billing or $279 monthly. With 40 people on logins, the Unlimited plan is $332 a month on annual billing or $399 monthly. Whether every field worker counts as a user is Contractor Foreman's definition, so confirm it before you pick a tier. Time cards and daily logs need Plus or higher either way.",
    },
    {
      t: "p",
      text: "Those are low prices for the breadth. SmartCrew's pricing depends on your company size and the features you need, and it's built to be well below the cost of enterprise construction software. You get a number on a short call with Andrew.",
    },

    { t: "h2", text: "Contractor Foreman vs SmartCrew, feature by feature" },
    {
      t: "table",
      caption: "What a dirt work company needs, and where each product stands",
      head: ["Job to be done", "SmartCrew", "Contractor Foreman"],
      rows: [
        ["GPS clock-in with job and activity", { mark: "yes", note: "Crew also picks the machine" }, { mark: "yes", note: "Plus and up; GPS at clock in and out, geofence flags off-site punches" }],
        ["Job costing", { mark: "yes", note: "Bid budgets vs. actual costs in dollars, daily" }, { mark: "yes", note: "Estimate vs. actual reports on Plus and up" }],
        ["Equipment hours and maintenance", { mark: "yes" }, { mark: "yes", note: "Equipment and vehicle logs with maintenance by miles or hours; Plus and up" }],
        ["DOT and daily inspections", { mark: "yes" }, { mark: "unknown", note: "Not listed; custom fields can hold inspection notes" }],
        ["Haul tickets and materials", { mark: "yes", note: "Digital tickets with an AI reader" }, { mark: "partial", note: "Purchase orders track delivered vs. billed; no haul ticket feature listed" }],
        ["Daily reports with photos", { mark: "yes" }, { mark: "yes", note: "Daily logs, Plus and up" }],
        ["Crew scheduling", { mark: "yes", note: "Premium category" }, { mark: "yes", note: "Crew schedule and Gantt on Plus and up" }],
        ["Crew chat", { mark: "yes", note: "Premium category" }, { mark: "yes", note: "Team chat with project and client threads" }],
        ["Safety forms", { mark: "yes" }, { mark: "yes", note: "Toolbox talks, incidents and checklists on Plus and up" }],
        ["Sales pipeline and bids", { mark: "yes", note: "Premium category" }, { mark: "yes", note: "Leads, opportunities, bids and estimates, by plan" }],
        ["QuickBooks sync", { mark: "yes", note: "QuickBooks Online" }, { mark: "partial", note: "QuickBooks Online only, Plus and up" }],
      ],
      note: "Fleet Management, Sales CRM, and Scheduling & Communications are Premium categories in SmartCrew. “Not listed” means we couldn't find it on Contractor Foreman's pricing or feature pages on October 22, 2026.",
    },
    {
      t: "shots",
      shots: [{ id: "phone-select-task" }, { id: "phone-working" }, { id: "phone-summary" }],
      caption: "SmartCrew's crew flow: pick job, activity and machine, switch tasks, submit the week. (Demo account.)",
    },

    { t: "h2", text: "A wide app versus a dirt work app" },
    {
      t: "p",
      text: "Contractor Foreman's [time cards](" + TIMECARDS + ") tie to projects and cost codes, and its [equipment logs](" + EQUIP + ") track mileage, hours and maintenance history. Those are the right building blocks. What's missing for a company that runs trucks is the loop around them: a haul ticket the driver fills out from the cab, a daily inspection the operator signs before the machine moves, and a job cost that picks up the machine and trucking hours.",
    },
    {
      t: "p",
      text: "SmartCrew builds that loop. The operator picks the machine at clock-in, the inspection and haul tickets are part of the day, and the cost lands on the job against your bid.",
    },
    {
      t: "shots",
      shots: [{ id: "web-project-detail" }, { id: "web-equipment" }],
      caption: "A SmartCrew job page in dollars, and the equipment list that feeds it. (Demo data.)",
    },
    { t: "cta", title: "See the dirt work version", text: "A short call with Andrew walks through time, machines, haul tickets and job cost on your numbers." },

    { t: "h2", text: "Where Contractor Foreman is the better pick" },
    {
      t: "cards",
      cards: [
        {
          title: "Pick Contractor Foreman if",
          items: [
            "You're a small general or trade contractor and want estimates, bids, a client portal and AIA invoicing at a low flat price.",
            "You want a published price with a 30-day free trial and a money-back guarantee on annual plans.",
            "Your crew is small, so a user cap of 8 or 15 fits.",
            "Your work is remodeling or light commercial, not machine-driven dirt work.",
          ],
        },
        {
          title: "Pick SmartCrew if",
          items: [
            "You run excavators, trucks and drills and want machine hours, DOT inspections and haul tickets with the time.",
            "You want job costing in dollars against your bid, including machine and trucking cost.",
            "You want one app for the whole crew without checking which plan a feature is on.",
            "You have 5–100 employees and use QuickBooks Online.",
          ],
          tone: "us",
        },
      ],
    },
    {
      t: "note",
      title: "Things to check before you buy",
      text: "Contractor Foreman's [what's new](" + NEW + ") page says offline time cards began rolling out in preview in April 2026, so ask about offline use if your crews work out of coverage. Its pricing page recommends against Safari and Edge for the web app. Its QuickBooks sync covers [QuickBooks Online](" + QBO + "), and QuickBooks Desktop isn't listed on its pricing FAQ.",
    },
    {
      t: "note",
      title: "A fair note on reviews",
      text: "Contractor Foreman is listed on [Capterra](" + CAPTERRA + ") at 4.5 from 839 reviews, and on the US App Store at 4.32 from 557 ratings (October 22, 2026). Capterra's review summary also mentions bugs after updates, offline issues and strict refund terms for some users. Read recent reviews for your size of company.",
    },
  ],
  faqs: [
    {
      q: "What is the best Contractor Foreman alternative for excavation companies?",
      a: "If you're a small general or trade contractor who wants a cheap all-in-one with estimates and a client portal, Contractor Foreman fits. If you run heavy equipment and want machine hours, DOT inspections, haul tickets and job costing in dollars, SmartCrew is built for dirt work and heavy civil companies with 5–100 employees.",
    },
    {
      q: "How much does Contractor Foreman cost?",
      a: "On October 22, 2026, plans listed at $49, $105, $166, $221 and $332 a month on annual billing, for 1, 3, 8, 15 and unlimited users. The fee is for the company, not per user.",
    },
    {
      q: "Does Contractor Foreman include time cards on every plan?",
      a: "No. Time cards, daily logs, equipment and vehicle logs, safety meetings, crew schedule, job costing reports and the QuickBooks Online sync are not on the Basic or Standard plans. They start at Plus.",
    },
    {
      q: "Does Contractor Foreman track equipment?",
      a: "Yes, on Plus and up. Its equipment and vehicle logs track mileage and hours, with maintenance history and maintenance by miles or hours.",
    },
    {
      q: "Does Contractor Foreman have haul tickets or DOT inspections?",
      a: "We couldn't find a haul ticket or DOT inspection feature on its pages. Equipment custom fields can hold inspection notes.",
    },
    {
      q: "Does SmartCrew replace Contractor Foreman?",
      a: "For dirt work and heavy civil crews it covers time, machines, haul tickets, inspections, reports, chat, scheduling and job costing.",
    },
    {
      q: "How much does SmartCrew cost?",
      a: "Pricing depends on your company size and the features you need, and it's built to be well below the cost of enterprise construction software. You get a number on a short call with Andrew.",
    },
  ],
  sources: [
    { label: "Contractor Foreman home page", url: HOME, accessed: "2026-10-22" },
    { label: "Contractor Foreman pricing", url: PRICING, accessed: "2026-10-22" },
    { label: "Contractor Foreman time cards", url: TIMECARDS, accessed: "2026-10-22" },
    { label: "Contractor Foreman equipment and vehicle logs", url: EQUIP, accessed: "2026-10-22" },
    { label: "Contractor Foreman team chat", url: CHAT, accessed: "2026-10-22" },
    { label: "Contractor Foreman QuickBooks integration", url: QBO, accessed: "2026-10-22" },
    { label: "Contractor Foreman what's new", url: NEW, accessed: "2026-10-22" },
    { label: "Capterra: Contractor Foreman", url: CAPTERRA, accessed: "2026-10-22" },
  ],
  related: ["compare/jobber-alternative", "compare/procore-alternative", "features/construction-job-costing", "excavation-software"],
};

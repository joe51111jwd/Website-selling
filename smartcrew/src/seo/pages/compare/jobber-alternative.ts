import type { SeoPage } from "../../types";

const PRICING = "https://www.getjobber.com/pricing/";
const TIMERS = "https://help.getjobber.com/en/articles/location-timers-in-the-jobber-app/";
const WAYPOINTS = "https://help.getjobber.com/en/articles/gps-waypoint-tracking/";

export const page: SeoPage = {
  kind: "compare",
  slug: "compare/jobber-alternative",
  nav: "Jobber alternative",
  keyword: "jobber alternative",
  updated: "2026-10-22",
  title: "Jobber Alternative for Excavation & Heavy Civil | SmartCrew",
  description:
    "Jobber is built for home service work. Here is how it compares with SmartCrew for excavation and heavy civil crews: time, equipment, haul tickets and job costing.",
  eyebrow: "Jobber alternative",
  h1: "Jobber alternative for excavation and heavy civil contractors",
  lede:
    "Jobber is field service software: quotes, scheduling, invoices and payments for businesses that visit customers, like lawn care, cleaning and HVAC. If you run excavators, dump trucks and crews on job sites, the parts you need most (cost codes, machine hours, inspections, haul tickets) aren't in the plans Jobber lists on its site. SmartCrew is the alternative built for dirt work and heavy civil companies with 5–100 employees.",
  summary: [
    "Jobber is built around customers, visits, quotes and invoices. SmartCrew is built around jobs, crews, machines and loads.",
    "Jobber's job costing and automatic timers start on its Grow plan; its list prices run from $49 to $699 a month depending on plan and users, plus $29 a month for each extra user.",
    "We couldn't find equipment tracking, DOT inspections, daily reports or haul tickets on Jobber's pricing page or its excavation software page.",
    "Jobber is the better pick if your work is invoicing customers for scheduled visits and online booking. SmartCrew is the better pick if your money is made on job sites with iron and trucks.",
  ],
  hero: [{ id: "web-dashboard" }, { id: "phone-working" }],
  blocks: [
    { t: "h2", text: "What Jobber is built for" },
    {
      t: "p",
      text: "Jobber describes itself as field service software for home and commercial service businesses. Its pricing page is organized around clients, requests, quotes, invoices, online booking and payments, and its plans add features in steps: Core, Connect, Grow and Plus. Time and expense tracking arrives on Connect, and job costing and automatic time tracking on Grow ([Jobber pricing](" + PRICING + ")).",
    },
    {
      t: "p",
      text: "Jobber also runs a landing page for excavation contractors. It lists the same customer-facing features: quoting, scheduling, invoicing and payments. We didn't find equipment, hauling or GPS fleet features on that page ([Jobber excavation page](https://www.getjobber.com/industries/excavation-software/)).",
    },
    {
      t: "p",
      text: "That's a fair fit for a small excavation outfit that mostly sells jobs to homeowners, sends a quote and invoices when the work is done. It's a weaker fit once you have a crew running machines across several jobs a day and you need to know what each one costs.",
    },

    { t: "h2", text: "How much does Jobber cost compared with SmartCrew?" },
    {
      t: "p",
      text: "Jobber publishes its prices. On its pricing page on October 22, 2026, monthly list prices were as follows. Jobber also shows large introductory discounts for annual plans, so check the page for what you'd really pay.",
    },
    {
      t: "table",
      caption: "Jobber list prices, monthly billing (USD)",
      head: ["Plan", "Included users and price", "What it adds"],
      rows: [
        ["Core", "1 user: $49", "Quotes, invoices, online booking, reporting"],
        ["Connect", "1 user: $139. 5 users: $199. 10 users: $299. 15 users: $399", "Time and expense tracking, QuickBooks Online sync, reminders, checklists"],
        ["Grow", "1 user: $199. 5 users: $299. 10 users: $399. 15 users: $499", "Automatic time tracking (location timers), job costing, two-way SMS"],
        ["Plus", "5 users: $499. 10 users: $599. 15 users: $699", "Crew scheduling, custom reports, pipeline, marketing tools"],
      ],
      note: "Extra users are $29 a month each. Card payments are 2.9% + 30¢. Source: [Jobber pricing](" + PRICING + "), October 22, 2026. Promotions and plans change.",
    },
    {
      t: "note",
      title: "What a 15-person crew looks like on Jobber",
      text: "Job costing and automatic time tracking start on the Grow plan, and its 15-user tier lists at $499 a month (QuickBooks Online sync is included from Connect up). Crew scheduling needs Plus, which lists at $699 for 15 users. That's an example from list prices, not a quote, and it leaves out payment processing fees. SmartCrew's pricing depends on your company size and the features you need, and it's built to be well below enterprise construction software. You get a number on a short call with Andrew.",
    },

    { t: "h2", text: "Jobber vs SmartCrew, feature by feature" },
    {
      t: "table",
      caption: "What a dirt work company needs, and where each product stands",
      head: ["Job to be done", "SmartCrew", "Jobber"],
      rows: [
        [
          "GPS clock-in with job, activity code and machine",
          { mark: "yes", note: "Crew picks project, activity code and equipment at clock-in" },
          { mark: "partial", note: "Clock in from the app; GPS pins are recorded on app actions, not continuous. No cost codes found on its site" },
        ],
        [
          "Automatic time tracking",
          { mark: "partial", note: "GPS clock-ins and clock in/out reminders" },
          { mark: "partial", note: "Location timers start and stop visit timers at a client address, Grow plan only, internet required" },
        ],
        [
          "Job costing against the bid",
          { mark: "yes", note: "Bid budgets vs. actual costs, daily job profitability, change orders" },
          { mark: "partial", note: "Job profitability from labor, materials and expenses, Grow plan. Budget by cost code not documented" },
        ],
        ["Equipment hours and maintenance", { mark: "yes", note: "Hours, locations, service records, shop queue" }, { mark: "unknown", note: "Not listed on its pricing or excavation pages" }],
        ["DOT and daily inspections", { mark: "yes" }, { mark: "unknown", note: "Custom checklists from Connect up; no inspection module listed" }],
        ["Haul tickets and material logs", { mark: "yes", note: "Digital tickets with an AI reader" }, { mark: "unknown", note: "Not listed" }],
        ["Daily reports with photos", { mark: "yes" }, { mark: "unknown", note: "Job notes, photos and attachments are listed" }],
        ["Crew scheduling", { mark: "yes", note: "Premium category" }, { mark: "yes", note: "Plus plan for crew scheduling" }],
        ["Customer quotes, invoices and online payments", { mark: "no", note: "Not what SmartCrew does" }, { mark: "yes", note: "Core of the product" }],
        ["Sales pipeline and bid tracking", { mark: "yes", note: "Premium category" }, { mark: "yes", note: "Pipeline on Plus or as a $49 add-on" }],
        ["Safety: JSAs, toolbox talks, incident reports", { mark: "yes" }, { mark: "unknown", note: "No dedicated safety module found" }],
        ["QuickBooks", { mark: "yes", note: "QuickBooks Online" }, { mark: "yes", note: "QuickBooks Online on Connect and up" }],
      ],
      note: "Feature availability varies by plan. Fleet Management, Sales CRM, and Scheduling & Communications are Premium categories in SmartCrew. “Not listed” means we couldn't find it on Jobber's own pages on October 22, 2026, not that Jobber confirmed it's missing.",
    },
    {
      t: "shots",
      shots: [{ id: "phone-select-task" }, { id: "phone-hauling" }, { id: "phone-dot" }],
      caption: "What a dirt work crew does on the phone in SmartCrew: pick the job, activity and machine; log a load; run the inspection. (Demo account.)",
    },

    { t: "h2", text: "Where Jobber's time tracking stops for a heavy civil crew" },
    {
      t: "p",
      text: "Jobber's automatic time tracking is built around visits to a customer's property. Its help center says location timers use a geofence around the client's address, only work on scheduled visits and need an internet connection, and Jobber says they're [not meant as an employee tracking service](" + TIMERS + "). Its GPS waypoints are recorded when someone takes an action in the app, and Jobber notes they're estimates that are [less accurate indoors](" + WAYPOINTS + ").",
    },
    {
      t: "p",
      text: "A grading crew that moves from a culvert to a haul route to the shop in one day isn't visiting clients. They need hours split by activity code and by machine, so job cost lands where it belongs. That's the part SmartCrew is built around.",
    },
    { t: "cta", title: "See SmartCrew on your own jobs", text: "A short call with Andrew, SmartCrew's founder. He sets it up around your crews, machines and cost codes." },

    { t: "h2", text: "Where Jobber is the better pick" },
    {
      t: "cards",
      cards: [
        {
          title: "Pick Jobber if",
          items: [
            "Most of your revenue is quotes and invoices to homeowners or small commercial customers for scheduled visits.",
            "You want online booking, customer reminders, two-way texting and card payments in the same tool.",
            "Your crew is small and you don't need machine hours, inspections or job costing by cost code.",
            "You're also running lawn care, cleaning, snow removal or similar service work.",
          ],
        },
        {
          title: "Pick SmartCrew if",
          items: [
            "You run excavators, dump trucks, dozers or drills and want every hour of labor and machine time on the right job.",
            "You need DOT and daily inspections, a shop queue, haul tickets and daily reports with photos.",
            "You bid jobs and want to see budget against actual cost while the job is still running.",
            "You have 5–100 employees and don't want enterprise software.",
          ],
          tone: "us",
        },
      ],
    },

    { t: "h2", text: "What switching from Jobber looks like" },
    {
      t: "steps",
      steps: [
        { title: "Keep what Jobber does well for customers", text: "If you invoice customers from Jobber and it works, you can keep it for that while SmartCrew runs the crew side. SmartCrew replaces time apps, equipment logs, paper load tickets and group texts, and it connects to QuickBooks Online." },
        { title: "SmartCrew sets up your account", text: "The SmartCrew team sets up your account, moves your information over, organizes your workflows and trains your people. Most companies are up and running within a few weeks." },
        { title: "Start with what hurts most", text: "Most companies begin with timecards or equipment, then add job costing, hauling and daily reports as the crew gets comfortable." },
      ],
    },
  ],
  faqs: [
    {
      q: "What is the best Jobber alternative for excavation companies?",
      a: "It depends on what you need to replace. Jobber is built for service visits, quoting and invoicing. If your company runs crews and heavy equipment on job sites, SmartCrew is built for that: GPS time by job, activity code and machine, equipment records, haul tickets, daily reports and job costing against the bid, for companies with 5–100 employees.",
    },
    {
      q: "Is Jobber good for excavation or heavy civil work?",
      a: "Jobber runs an excavation landing page and covers quotes, scheduling and invoicing well. On its pricing page and its excavation page we didn't find equipment tracking, inspections, daily reports or haul tickets, which are what most heavy civil crews track every day.",
    },
    {
      q: "How much does Jobber cost?",
      a: "On October 22, 2026, Jobber's monthly list prices ran from $49 for one user on Core to $699 for 15 users on Plus, with $29 a month for each extra user. Job costing and automatic time tracking need the Grow plan. Jobber also shows introductory discounts, so check its pricing page.",
    },
    {
      q: "Does Jobber track time automatically?",
      a: "Jobber's Grow plan includes location timers, which start and stop a visit timer using a geofence around a client's property. They need an internet connection, work on scheduled visits and aren't meant for tracking employees, according to Jobber's help center.",
    },
    {
      q: "Does SmartCrew replace Jobber?",
      a: "For the crew, equipment and job cost side, yes. SmartCrew doesn't do customer quotes, online booking or card payments, so some companies keep Jobber for that part of the business.",
    },
    {
      q: "How much does SmartCrew cost?",
      a: "Pricing depends on your company size and the features you need, and it's built to be well below the cost of enterprise construction software. You get a number on a short call with Andrew.",
    },
  ],
  sources: [
    { label: "Jobber pricing", url: PRICING, accessed: "2026-10-22" },
    { label: "Jobber: excavation software page", url: "https://www.getjobber.com/industries/excavation-software/", accessed: "2026-10-22" },
    { label: "Jobber help: location timers", url: TIMERS, accessed: "2026-10-22" },
    { label: "Jobber help: GPS waypoint tracking", url: WAYPOINTS, accessed: "2026-10-22" },
  ],
  related: ["excavation-software", "compare/procore-alternative", "features/construction-time-tracking"],
};

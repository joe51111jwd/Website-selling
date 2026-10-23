import type { SeoPage } from "../../types";

const PRICING = "https://www.fieldwire.com/pricing/";
const FORMS = "https://www.fieldwire.com/construction-forms/";
const TIMESHEET = "https://help.fieldwire.com/hc/en-us/articles/360005026111-Introduction-to-Timesheet-forms";
const CREW = "https://www.fieldwire.com/crew-center/";
const SYNC = "https://help.fieldwire.com/hc/en-us/articles/48275296838289-Integrations-Tab-Hilti-CrewCenter";
const INTEG = "https://www.fieldwire.com/integrations/";

export const page: SeoPage = {
  kind: "compare",
  slug: "compare/fieldwire-alternative",
  nav: "Fieldwire alternative",
  keyword: "fieldwire alternative",
  updated: "2026-10-22",
  title: "Fieldwire Alternative for Dirt Work Contractors | SmartCrew",
  description:
    "Fieldwire is a plan and task app for jobsites. See how SmartCrew compares for excavation crews: GPS time, machines, haul tickets and job cost, with sources.",
  eyebrow: "Fieldwire alternative",
  h1: "Fieldwire alternative for excavation and heavy civil contractors",
  lede:
    "Fieldwire, by Hilti, is a jobsite app built around plans, tasks, forms and project documents, with a free plan and per-user paid plans. SmartCrew is the alternative for dirt work and heavy civil companies with 5 to 100 employees whose daily problem is crew hours, machines, haul tickets and job cost rather than plan sheets. Many crews that self-perform earthwork need the SmartCrew side more; some need both.",
  summary: [
    "Fieldwire's pricing page lists a free Basic plan (up to 5 users, 3 projects), Pro at $39 and Business at $64 per user per month billed annually, on October 22, 2026.",
    "Fieldwire's strengths are plan viewing, sheet compare, task management, custom forms, and RFIs, submittals and change orders on Business Plus.",
    "Fieldwire offers timesheet forms, and Hilti sells live clock-in time tracking as a separate product, CrewCenter.",
    "SmartCrew covers GPS time by activity and machine, equipment inspections and maintenance, digital haul tickets and daily job cost in one app.",
  ],
  hero: [{ id: "phone-working" }, { id: "web-project-detail" }],
  blocks: [
    { t: "h2", text: "What is Fieldwire and who is it for?" },
    {
      t: "p",
      text: "Fieldwire is a construction jobsite management app from Hilti, built around plans and tasks: viewing plan sheets, assigning tasks on them, specifications, files and photos, and on higher plans custom forms, a BIM viewer, RFIs, submittals, change orders and budget ([Fieldwire pricing](" + PRICING + ")). It fits a general contractor or a specialty trade that coordinates work against drawings and needs every punch item and RFI tracked on the sheet.",
    },
    {
      t: "p",
      text: "A dirt work company's day is shaped differently. The plan matters, but the money moves through operator hours, machine hours and truck loads. That is the part of the job this comparison is about.",
    },

    { t: "h2", text: "How much does Fieldwire cost?" },
    {
      t: "table",
      caption: "Fieldwire list prices, US dollars, as shown on its pricing page",
      head: ["Plan", "List price", "Limits and what it adds"],
      rows: [
        ["Basic", "$0", "Up to 5 users, 3 projects, 100 sheets. Plan viewing, tasks, specifications, files and photos."],
        ["Pro", "$39 per user per month, billed annually", "Unlimited projects and sheets. Reports and exports, sheet compare, project templates, custom task statuses, email support."],
        ["Business", "$64 per user per month, billed annually", "Custom forms, app integrations, BIM viewer, custom task fields, 360 photos, phone support."],
        ["Business Plus", "Price not shown on the page we checked", "RFIs, submittals, change orders and budget."],
      ],
      note: "Source: [Fieldwire pricing](" + PRICING + "), checked October 22, 2026. These are list prices; promotions and plans change. Custom contracts with unlimited users, API access and SSO are by quote.",
    },
    {
      t: "note",
      title: "Example: 15 and 40 people on list prices (an estimate, not a quote)",
      text: "If every one of 15 people needs a Pro login: 15 × $39 = $585 a month, billed annually. On Business: 15 × $64 = $960. With 40 logins: 40 × $39 = $1,560 on Pro, or 40 × $64 = $2,560 on Business. Many companies give logins only to foremen and the office, which lowers the count. Live time tracking would be the separate CrewCenter product, priced on its own. SmartCrew's pricing depends on your company size and the features you need; it's built to be well below enterprise construction software. You get a number on a short call with Andrew.",
    },

    { t: "h2", text: "Fieldwire vs SmartCrew, feature by feature" },
    {
      t: "table",
      caption: "The jobs a dirt work company does every week, and where each product stands",
      head: ["What you need", "SmartCrew", "Fieldwire"],
      rows: [
        ["Live clock in and out with GPS", { mark: "yes", note: "GPS clock-ins, live crew locations" }, { mark: "partial", note: "Timesheet forms in Fieldwire; live clock-in is Hilti CrewCenter, a separate product" }],
        ["Hours by activity code and machine", { mark: "yes", note: "Picked at clock-in, Log & Switch" }, { mark: "partial", note: "Timesheet form has a comment field for cost codes" }],
        ["Equipment hours, inspections, service queue", { mark: "yes" }, { mark: "unknown", note: "Not listed on the pages we checked" }],
        ["Digital haul tickets with yards and source pit", { mark: "yes", note: "AI reader for ticket photos" }, { mark: "unknown", note: "Not listed; custom forms could be built" }],
        ["Daily reports with photos", { mark: "yes" }, { mark: "yes", note: "Daily report form template" }],
        ["Plan viewing, sheet compare, markup", { mark: "no", note: "File storage only" }, { mark: "yes", note: "Core of the product" }],
        ["RFIs, submittals, change orders", { mark: "partial", note: "Change orders and extras in job costing" }, { mark: "yes", note: "Business Plus" }],
        ["Budget against actual, daily", { mark: "yes" }, { mark: "partial", note: "Budget on Business Plus; labor cost not listed" }],
        ["QuickBooks Online", { mark: "yes" }, { mark: "unknown", note: "Not confirmed on the integrations page we loaded" }],
      ],
      note: "Fieldwire facts from its [pricing](" + PRICING + "), [forms](" + FORMS + "), [timesheet help](" + TIMESHEET + ") and [CrewCenter](" + CREW + ") pages, checked October 22, 2026. \"Not listed\" means we couldn't find it on their site, not that it doesn't exist. Feature availability varies by plan. Fleet Management, Sales CRM, and Scheduling & Communications are Premium categories.",
    },

    { t: "h2", text: "How does Fieldwire handle time tracking?" },
    {
      t: "p",
      text: "Fieldwire handles time inside the app with a timesheet form: a weekly form with a line per employee, hours per day and a comment field for notes or cost codes, which is then signed and submitted ([Fieldwire help center](" + TIMESHEET + ")). Forms are on the Business and Business Plus tiers. For clock-in and clock-out with location snapshots, breaks and cost codes, Hilti offers [CrewCenter](" + CREW + "), and Fieldwire Business or Business Plus accounts can sync project names one way into it ([sync article](" + SYNC + ")).",
    },
    {
      t: "p",
      text: "In SmartCrew, time tracking is the core of the app. The worker clocks in on the phone with GPS, picks the project, activity code and machine, and uses Log & Switch when the task or machine changes. The hours land on the job's cost as they happen.",
    },
    {
      t: "shots",
      shots: [{ id: "phone-select-task" }, { id: "phone-working" }],
      caption: "SmartCrew: picking the job, activity and machine, then on the clock. (Demo account; names and numbers are made up.)",
    },
    { t: "cta" },

    { t: "h2", text: "Where Fieldwire is the better pick" },
    {
      t: "cards",
      cards: [
        {
          title: "Pick Fieldwire if",
          tone: "them",
          items: [
            "Your crews build from plan sheets every day and you need markup, sheet compare and a BIM viewer.",
            "You manage RFIs and submittals with a general contractor.",
            "You want a free plan for a small team to start with.",
            "Task and punch list tracking on the drawing is your main need.",
          ],
        },
        {
          title: "Pick SmartCrew if",
          tone: "us",
          items: [
            "You self-perform dirt work with your own machines and trucks.",
            "You want live GPS time by activity and machine in the same app as job cost.",
            "You need DOT inspections, a shop queue and haul tickets with yards and pit.",
            "You want the team to set it up, migrate your data and train your crew.",
          ],
        },
      ],
    },
    {
      t: "p",
      text: "Some excavation companies use a plan app for drawings and SmartCrew for time, machines, loads and cost. SmartCrew's [file storage](features/construction-file-storage) keeps plans with the job, but it does not do markup or sheet compare.",
    },

    { t: "h2", text: "What does switching from Fieldwire to SmartCrew look like?" },
    {
      t: "p",
      text: "Switching usually means moving time, equipment and daily reports into SmartCrew while deciding whether to keep Fieldwire for plans. The SmartCrew team sets up the account, migrates your information, organizes workflows and trains your people; most companies are up and running within a few weeks. Start with the feature you need most, often time tracking, and add the rest.",
    },
    {
      t: "shots",
      shots: [{ id: "web-equipment" }, { id: "web-d-hauling" }],
      caption: "SmartCrew's equipment list and hauling log. (Demo account.)",
    },
  ],
  faqs: [
    {
      q: "Is Fieldwire good for excavation contractors?",
      a: "Fieldwire is strong for plan viewing, tasks and forms on the jobsite. For an excavation company whose main costs are operator hours, machine hours and truck loads, its pages don't list equipment maintenance or haul tickets, so many dirt contractors pair it with or choose a tool built for that.",
    },
    {
      q: "How much does Fieldwire cost?",
      a: "On October 22, 2026, Fieldwire's pricing page listed Basic at $0 for up to 5 users, Pro at $39 and Business at $64 per user per month billed annually. Business Plus pricing was not shown. Plans and prices change.",
    },
    {
      q: "Does Fieldwire have time tracking?",
      a: "Fieldwire has timesheet forms on its Business tiers. Live clock-in with location snapshots is in Hilti CrewCenter, a separate product that can sync projects from Fieldwire.",
    },
    {
      q: "What is the best Fieldwire alternative for heavy civil?",
      a: "For a heavy civil or dirt work company with 5 to 100 people that runs its own equipment, SmartCrew covers GPS time, equipment, haul tickets, daily reports and job costing in one app. If plan markup is a must, keep a plan app next to it.",
    },
    {
      q: "Can I use Fieldwire and SmartCrew together?",
      a: "Yes, nothing stops it. Some dirt contractors keep a plan app for drawings and use SmartCrew for time, machines, haul tickets, daily reports and job cost. SmartCrew's integration today is QuickBooks Online; a Fieldwire connection is not listed.",
    },
  ],
  sources: [
    { label: "Fieldwire pricing", url: PRICING, accessed: "2026-10-22" },
    { label: "Fieldwire construction forms", url: FORMS, accessed: "2026-10-22" },
    { label: "Fieldwire help center: timesheet forms", url: TIMESHEET, accessed: "2026-10-22" },
    { label: "Fieldwire: CrewCenter time management", url: CREW, accessed: "2026-10-22" },
    { label: "Fieldwire help center: CrewCenter project sync", url: SYNC, accessed: "2026-10-22" },
    { label: "Fieldwire integrations", url: INTEG, accessed: "2026-10-22" },
  ],
  related: ["compare/procore-alternative", "compare/raken-alternative", "features/construction-file-storage", "features/construction-time-tracking", "guides/construction-software-pricing"],
};

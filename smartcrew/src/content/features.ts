// "Everything. Built for dirt." (src/site/features): the section's copy, in one place.
// Andrew's words verbatim where his doc gives them (the headline, the sub from his mock, the six
// feature names, all of Sales & CRM's open copy); every other line is a plain paraphrase of an
// approved line in src/content/moments.ts (the 38 tools) or SPEC in src/content/copy.ts. The
// source of each paraphrase is noted beside it. No numbers, no claims beyond those lines.
//
// The pain picker matches what a visitor types against `keywords` in the browser only: nothing
// typed is sent anywhere or kept.

export type FeatureId = "time" | "costing" | "equipment" | "materials" | "sales" | "crew";

export const FEATURES = {
  label: "Everything SmartCrew does",
  kicker: "Explore the platform",
  title: "Everything. Built for dirt.",
  sub: "Select a feature to explore what SmartCrew can do.",

  pain: {
    prompt: "What’s your biggest headache?",
    /** the text field's label (visible) and placeholder */
    typeLabel: "Type your own",
    placeholder: "e.g. trucks breaking down",
    submit: "Find it",
    yes: "We have a feature for that.",
    /** after the feature's name, on desktop and phones: where it opened */
    see: "See it",
    /** nothing matched what was typed */
    noMatch: "Good one to bring to Andrew. He’ll show you how SmartCrew handles it on your trial call.",
    /** screen readers: the chips' group */
    chipsLabel: "Common headaches",
  },

  /** The six cards, in Andrew's order. `pain` is the preset chip. */
  cards: [
    {
      id: "time",
      name: "Time Tracking",
      // SPEC "Timecards that log themselves." + payroll (M4)
      line: "Timecards that fill in, ready for payroll.",
      // T5 "No more chasing timecards."
      subhead: "No more chasing timecards.",
      // T1, T2, T3; the tick: M4 (AMBER wording: "ready for QuickBooks", never "sync")
      copy: "Crews clock in with one tap, or turn on GPS and hours log themselves at the job. Every hour lands on the right job and cost code.",
      ticks: ["One-tap and GPS clock-in", "Hours on the right job and cost code", "Payroll ready for QuickBooks"],
      pain: "Chasing timecards",
    },
    {
      id: "costing",
      name: "Job Costing",
      // SPEC costing outcome
      line: "Every job’s profit, every day.",
      // M1 "…so you can fix problems before they cost you."
      subhead: "Fix problems before they cost you.",
      // M1 + M2
      copy: "Labor, equipment and materials roll into each job’s margin every day. Log subs, extras and change orders as they happen.",
      ticks: ["Daily job profit", "Change orders and subs", "Billable hours and loads"],
      pain: "Jobs losing money",
    },
    {
      id: "equipment",
      name: "Equipment",
      // SPEC equipment outcome
      line: "Repairs, DOT pre-trips and service logs.",
      // E4 "You get audit-ready DOT logs without the paper."
      subhead: "Audit-ready DOT logs, without the paper.",
      // E4 + E3 + E2
      copy: "Drivers do the pre-trip on the phone. Operators send repair requests in one click, and each one lands in the shop queue with its history.",
      ticks: ["DOT pre-trips on the phone", "Repair requests and shop queue", "Machine rates and hours by job"],
      pain: "Machine breakdowns",
    },
    {
      id: "materials",
      name: "Materials & Hauling",
      // SPEC materials outcome
      line: "Every load and receipt logged to the job.",
      // H3 "Hauling tickets move out of paper folders and onto the job."
      subhead: "Hauling tickets out of the paper folders.",
      // H3 + H2 + H1
      copy: "Drivers log every load from the phone and crews send receipts from the app. See what’s ordered, delivered or delayed.",
      ticks: ["Hauling tickets", "Field usage and receipts", "Orders and deliveries"],
      pain: "Lost haul tickets",
    },
    {
      id: "sales",
      name: "Sales & CRM",
      // G1
      line: "Bids and leads next to your jobs.",
      // Andrew's, verbatim
      subhead: "Never lose track of another opportunity.",
      copy: "Manage bids, prospects, and sales opportunities alongside your operations.",
      ticks: ["Sales pipeline", "Bid opportunities", "Customer records"],
      pain: "Losing track of bids",
    },
    {
      id: "crew",
      name: "Crew Management",
      // DAY2.plan "Monday's plan, on their phones."
      line: "Tomorrow’s plan on every phone.",
      // S1 "Assign crews, jobs and equipment without the morning scramble."
      subhead: "Plan the week without the morning scramble.",
      // S1 + the plan moment's outcome + C3
      copy: "Assign crews, jobs and equipment, and your crew sees where to be and which machine to take. No more group texts.",
      ticks: ["Crew scheduling", "Crew messages", "Project docs from the truck"],
      pain: "The morning scramble",
    },
  ] as { id: FeatureId; name: string; line: string; subhead: string; copy: string; ticks: string[]; pain: string }[],

  /**
   * What a typed pain is matched on (lower case; plurals and -ing / -ed forms match too). `strong`
   * words name the feature outright; `weak` ones only tip a tie. Phrases match as phrases.
   */
  keywords: {
    time: {
      strong: [
        "timecard", "time card", "timesheet", "time sheet", "hours", "hour", "payroll", "clock", "clock in", "clock out",
        "overtime", "ot", "punch", "gps", "geofence", "attendance", "no show", "no-show", "time off", "day off",
        "pto", "sick day", "prevailing wage", "wage", "quickbooks", "qb", "paycheck", "paystub", "labor hours",
        "tracking time", "track time", "who is working", "who’s working",
      ],
      weak: ["time", "employee", "worker", "labor", "chasing", "late", "pay", "on site"],
    },
    costing: {
      strong: [
        "profit", "profitable", "profitability", "cost", "costing", "job cost", "budget", "over budget", "losing money",
        "lose money", "lost money", "making money", "make money", "money", "margin", "overrun", "expense", "change order",
        "billing", "billable", "bill", "invoice", "invoicing", "spend", "spending", "numbers", "p&l", "pnl", "accounting",
        "bleeding", "subcontractor", "sub", "extras", "report", "reports",
      ],
      weak: ["job", "jobs", "cash"],
    },
    equipment: {
      strong: [
        "repair", "breakdown", "break down", "broke", "broken", "maintenance", "service", "dot", "inspection", "pre trip",
        "pretrip", "pre-trip", "truck", "machine", "machinery", "equipment", "excavator", "dozer", "loader", "skid steer",
        "grader", "backhoe", "fleet", "shop", "mechanic", "oil", "leak", "work order", "safety", "incident", "accident",
        "osha", "audit", "downtime", "iron",
      ],
      weak: ["engine", "tire"],
    },
    materials: {
      strong: [
        "load", "haul", "hauling", "ticket", "material", "receipt", "dirt", "gravel", "rock", "fill", "aggregate", "sand",
        "topsoil", "stone", "delivery", "deliver", "supplier", "vendor", "order", "purchase", "dump", "trucking", "fuel",
        "diesel", "yard", "yards", "ton", "tons", "pipe", "folder",
      ],
      weak: ["driver"],
    },
    sales: {
      strong: [
        "bid", "bidding", "lead", "sales", "sale", "sell", "estimate", "estimating", "customer", "client", "proposal",
        "pipeline", "crm", "opportunity", "follow up", "follow-up", "quote", "quoting", "prospect", "deal", "win work",
        "winning work", "new work", "more work", "contract", "marketing", "referral",
      ],
      weak: ["growth", "grow"],
    },
    crew: {
      strong: [
        "schedule", "scheduling", "plan", "planning", "crew", "text", "group text", "message", "messaging", "dispatch",
        "communication", "communicate", "call around", "phone call", "calls", "morning", "scramble", "where to be",
        "assign", "assignment", "foreman", "docs", "document", "plans", "notes", "field notes", "daily report",
        "photo", "announcement", "staffing", "manpower", "who goes where", "organized", "organization", "chaos",
      ],
      weak: ["team", "guys", "people", "staff"],
    },
  } as Record<FeatureId, { strong: string[]; weak: string[] }>,

  /** the open card on phones: the screenshot is a button into the walkthrough */
  shotLabel: (name: string) => `See ${name} in the app`,
  shotHint: "Tap to see it work",

  app: {
    /** the window (screen readers) */
    label: "The SmartCrew office app, demo account",
    /** the app's sidebar (screen readers): "Equipment screen" */
    nav: "Screens",
    screen: "screen",
    /** in the title bar, right */
    demo: "Demo account. Names and numbers are made up.",
    /** the phone beside the window */
    phone: "On the crew’s phone",
    /** an in-screen link's hint ("Open: Job costing") */
    open: "Open",
    /** a hotspot's button: its name, then what it does */
    hotspot: (label: string) => `What’s this: ${label}`,
  },

  /** Sidebar names of the recreated screens (SPEC.screen, with the job page named for what it shows). */
  screens: {
    "web-dashboard": "Dashboard",
    "web-timecards": "Timecards",
    "web-projects": "Projects",
    "web-project-detail": "Job costing",
    "web-equipment": "Equipment",
    "web-service-queue": "Service queue",
    "web-materials": "Materials",
    "web-pipeline": "Sales pipeline",
    "web-scheduling": "Scheduling",
    "web-messaging": "Messaging",
  } as Record<string, string>,

  /** Hotspot names and lines that aren't a tool's own (Andrew's Sales & CRM copy). */
  spots: {
    bids: { label: "Bid opportunities", line: "Manage bids, prospects, and sales opportunities alongside your operations." },
  },
};

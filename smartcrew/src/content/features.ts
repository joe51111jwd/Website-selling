// "Everything. Built for dirt." (src/site/features): the section's copy, in one place.
// Andrew's words verbatim: the headline, the sub from his mock, and from his "Copy for
// 'Everything Built For Dirt' Section" (doc of Oct 19) the ten features, in his order, each with its
// headline, sub and bullets, and the CTA under the section. No other marketing lines here; the
// in-app names below (the sidebar, hotspots) are the app's own words or a tool's from moments.ts.
//
// The pain picker matches what a visitor types against `keywords` in the browser only: nothing
// typed is sent anywhere or kept.

export type FeatureId = "time" | "costing" | "equipment" | "daily" | "materials" | "scheduling" | "sales" | "comms" | "safety" | "files";

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
    noMatch: "Good one to bring to the call. We’ll show you how SmartCrew handles it when we set up your trial.",
    /** screen readers: the chips' group */
    chipsLabel: "Common headaches",
    /** the six preset chips, and the card each one opens */
    chips: [
      { id: "time", label: "Chasing timecards" },
      { id: "costing", label: "Jobs losing money" },
      { id: "equipment", label: "Machine breakdowns" },
      { id: "materials", label: "Lost haul tickets" },
      { id: "sales", label: "Losing track of bids" },
      { id: "scheduling", label: "The morning scramble" },
    ] as { id: FeatureId; label: string }[],
  },

  /** The ten cards, in Andrew's order: his name, headline, sub and bullets (the ticks). */
  cards: [
    {
      id: "time",
      name: "Time Tracking",
      headline: "No more chasing timecards.",
      sub: "Track every hour, job, and cost code without the paperwork.",
      ticks: ["GPS-powered clock-ins", "Live crew locations", "Payroll-ready timecards"],
    },
    {
      id: "costing",
      name: "Job Costing",
      headline: "Know your profit. Every day.",
      sub: "See how every job is performing against your bid as work happens.",
      ticks: ["Daily job profitability", "Bid budgets vs. actual costs", "Change orders & extras"],
    },
    {
      id: "equipment",
      name: "Equipment Management",
      headline: "Keep your machines moving.",
      sub: "Track equipment hours, inspections, fuel and maintenance across the company.",
      ticks: [
        "Equipment hours & locations",
        "DOT & daily inspections",
        "Track maintenance, service requests and utilization rates",
        "Manage your shop with the Shop Queue",
      ],
    },
    {
      id: "daily",
      name: "Daily Reports",
      headline: "Know what got done. Without asking.",
      sub: "Capture daily progress, photos, and field updates without chasing paperwork.",
      ticks: ["Daily progress & production logs", "Jobsite photos & field notes", "Automatic daily reports for the office"],
    },
    {
      id: "materials",
      name: "Materials & Hauling",
      headline: "Every load, receipt and dollar tracked.",
      sub: "Track materials, hauling tickets, fuel, and receipts with photo uploads.",
      ticks: ["Digital hauling tickets", "Material & fuel log tracking", "AI reader to enter the data for you"],
    },
    {
      id: "scheduling",
      name: "Scheduling",
      headline: "Everyone knows where to be.",
      sub: "Build schedules, assign crews and equipment, and keep everyone updated.",
      ticks: ["Drag-and-drop crew scheduling", "Job & equipment assignments", "Schedule updates & notifications"],
    },
    {
      id: "sales",
      name: "Sales & CRM",
      headline: "Never let another job slip away.",
      sub: "Track leads, manage bids, and keep your sales pipeline full.",
      ticks: ["Leads & sales pipeline", "Bid & opportunity tracking", "Follow-ups & reminders"],
    },
    {
      id: "comms",
      name: "Crew Communication",
      headline: "Keep your entire crew connected.",
      sub: "Send marching orders and share updates with dispatch and instant messaging.",
      ticks: ["Dispatch with instant alerts", "Crew & team messaging", "Job-specific chat channels"],
    },
    {
      id: "safety",
      name: "Safety & Compliance",
      headline: "Keep your crew safe. Stay compliant.",
      sub: "Manage safety paperwork, inspections, and incidents right from the field.",
      ticks: ["Job Safety Analyses (JSAs)", "Toolbox talks & safety meetings", "Incident reports & documentation"],
    },
    {
      id: "files",
      name: "File Storage & Documents",
      headline: "Every job file. One place.",
      sub: "Keep plans, documents, and photos organized and accessible to your entire team.",
      ticks: ["Centralized cloud file storage", "Plans, photos & job documents", "Access from the field or office"],
    },
  ] as { id: FeatureId; name: string; headline: string; sub: string; ticks: string[] }[],

  /** Andrew's "CTA — Below Feature Sections" (the button is the page's primary CTA, its own label). */
  close: {
    title: "Ready to run your entire operation in one place?",
    sub: "Less paperwork. Better job visibility. More profitable projects.",
  },

  /**
   * What a typed pain is matched on (lower case; plurals and -ing / -ed forms match too). `strong`
   * words name the feature outright; `weak` ones only tip a tie. Phrases match as phrases. (Words
   * share one stem across features at their peril: "plans" and "plan" both read "plan", so the job
   * files take "site plans" and "blueprints", and "plan" stays with Scheduling.)
   */
  keywords: {
    time: {
      strong: [
        "timecard", "time card", "timesheet", "time sheet", "hours", "hour", "payroll", "clock", "clock in", "clock out",
        "overtime", "ot", "punch", "gps", "geofence", "attendance", "prevailing wage", "wage", "quickbooks", "qb", "paycheck",
        "paystub", "labor hours", "tracking time", "track time", "who is working", "who’s working", "location", "where my guys are",
        "buddy punching", "padding hours",
      ],
      weak: ["time", "employee", "worker", "labor", "chasing", "late", "pay", "on site"],
    },
    costing: {
      strong: [
        "profit", "profitable", "profitability", "cost", "costing", "job cost", "cost code", "budget", "over budget", "losing money",
        "lose money", "lost money", "making money", "make money", "money", "margin", "overrun", "expense", "change order",
        "billing", "billable", "bill", "invoice", "invoicing", "spend", "spending", "numbers", "p&l", "pnl", "accounting",
        "bleeding", "subcontractor", "sub", "extras", "actual cost", "against the bid", "over bid",
      ],
      weak: ["job", "jobs", "cash"],
    },
    equipment: {
      strong: [
        "repair", "breakdown", "break down", "broke", "broken", "maintenance", "service", "dot", "inspection", "pre trip",
        "pretrip", "pre-trip", "truck", "machine", "machinery", "equipment", "excavator", "dozer", "loader", "skid steer",
        "grader", "backhoe", "fleet", "shop", "mechanic", "oil", "leak", "work order", "audit", "downtime", "iron",
        "equipment hours", "machine hours", "hour meter", "utilization", "service record", "service history", "shop queue",
        "dot compliance",
      ],
      weak: ["engine", "tire", "parts"],
    },
    daily: {
      strong: [
        "daily report", "daily log", "daily", "progress", "production", "field note", "note", "photo", "picture", "pics",
        "what got done", "end of day", "superintendent", "foreman report", "jobsite photo",
      ],
      weak: ["report", "update", "paperwork", "office"],
    },
    materials: {
      strong: [
        "load", "haul", "hauling", "ticket", "material", "receipt", "dirt", "gravel", "rock", "fill", "aggregate", "sand",
        "topsoil", "stone", "delivery", "deliver", "supplier", "vendor", "order", "purchase", "dump", "trucking", "fuel",
        "diesel", "yard", "yards", "ton", "tons", "pipe", "scale ticket", "fuel log",
      ],
      weak: ["driver"],
    },
    scheduling: {
      strong: [
        "schedule", "scheduling", "plan", "planning", "morning", "scramble", "where to be", "where to go", "assign", "assignment",
        "who goes where", "staffing", "manpower", "calendar", "time off", "day off", "pto", "sick day", "no show", "no-show",
        "vacation", "tomorrow", "organized", "organization", "chaos", "drag and drop",
      ],
      weak: ["crew", "foreman", "week"],
    },
    sales: {
      strong: [
        "bid", "bidding", "lead", "sales", "sale", "sell", "estimate", "estimating", "customer", "client", "proposal",
        "pipeline", "crm", "opportunity", "follow up", "follow-up", "quote", "quoting", "prospect", "deal", "win work",
        "winning work", "new work", "more work", "contract", "marketing", "referral",
      ],
      weak: ["growth", "grow"],
    },
    comms: {
      strong: [
        "text", "texting", "group text", "message", "messaging", "chat", "dispatch", "communication", "communicate", "call around",
        "phone call", "calls", "announcement", "alert", "radio", "in the loop", "same page", "marching orders", "miscommunication",
        "voicemail", "nobody knows", "word out",
      ],
      weak: ["crew", "team", "guys", "people", "staff", "phone"],
    },
    safety: {
      strong: [
        "safety", "safe", "incident", "accident", "injury", "injured", "hurt", "osha", "jsa", "job safety analysis", "toolbox",
        "toolbox talk", "safety meeting", "hazard", "near miss", "compliance", "compliant", "first aid", "trench", "ppe",
        "hard hat", "workers comp", "safety inspection", "incident report", "safety report",
      ],
      weak: ["insurance"],
    },
    files: {
      strong: [
        "file", "document", "docs", "site plans", "job plans", "blueprint", "drawing", "prints", "folder", "storage", "cloud",
        "dropbox", "google drive", "pdf", "permit", "submittal", "as built", "as-built", "paper trail",
      ],
      weak: ["photo", "office"],
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
    "web-project-costcodes": "Job costing",
    "web-project-detail": "Labor",
    "web-equipment": "Equipment",
    "web-service-queue": "Service queue",
    "web-machine": "Service records",
    "web-daily-reports": "Daily reports",
    "web-materials": "Materials",
    "web-scheduling": "Scheduling",
    "web-pipeline": "Sales pipeline",
    "web-messaging": "Messaging",
    "web-safety": "Safety",
    "web-files": "Files",
  } as Record<string, string>,

  /**
   * Hotspot names and lines that aren't a tool's own: a bullet of Andrew's (or the app's own name
   * for the thing) as the name, the feature's sub (his) as the line.
   */
  spots: {
    bids: { label: "Bid & opportunity tracking", line: "Track leads, manage bids, and keep your sales pipeline full." },
    bidVsActual: { label: "Bid budgets vs. actual costs", line: "See how every job is performing against your bid as work happens." },
    serviceLog: { label: "Service records", line: "Track equipment hours, inspections, fuel and maintenance across the company." },
    dispatch: { label: "Dispatch with instant alerts", line: "Send marching orders and share updates with dispatch and instant messaging." },
    production: { label: "Production logs", line: "Capture daily progress, photos, and field updates without chasing paperwork." },
    jobFiles: { label: "Plans, photos & job documents", line: "Keep plans, documents, and photos organized and accessible to your entire team." },
  },
};

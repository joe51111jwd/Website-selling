// "Everything. Built for dirt." (src/site/features): the section's copy, in one place.
// Andrew's words verbatim: the headline, the sub from his mock, and from his "Copy for
// 'Everything Built For Dirt' Section" (doc of Oct 19) the ten features, in his order, each with its
// headline, sub and bullets, and the CTA under the section. No other marketing lines here; the
// in-app names below (the sidebar, hotspots) are the app's own words or a tool's from moments.ts.
//
// The pain picker matches what a visitor types against `keywords` in the browser first. Only when
// that isn't sure does the text go to our own server function (api/match-pain.ts), and from there,
// once an Anthropic key is set, to Anthropic's API, to pick which of the ten cards below fits: that
// one answer, nothing else. We don't log or keep what was typed, in the page or the function;
// Anthropic handles it under its API terms.

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
    /** while a typed headache the keywords can't place goes to the server (api/match-pain.ts) */
    thinking: "Finding it…",
    /** after the feature's name, on desktop and phones: where it opened */
    see: "See it",
    /** nothing matched what was typed */
    noMatch: "Good one to bring to the call. We’ll show you how SmartCrew handles it.",
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

  /** The ten cards, in Andrew's order: his name, headline, sub and bullets (the ticks). The extra
   *  bullets on Time Tracking, Job Costing, Materials & Hauling and File Storage are his doc's
   *  "Bullets to add under features section" (Oct 20, 20:47Z), word for word. */
  cards: [
    {
      id: "time",
      name: "Time Tracking",
      headline: "No more chasing timecards.",
      sub: "Track every hour, job, and cost code without the paperwork.",
      ticks: ["GPS-powered clock-ins", "Live crew locations", "Payroll-ready timecards", "Supervisor Dashboard", "Clock In/Out Reminders"],
    },
    {
      id: "costing",
      name: "Job Costing",
      headline: "Know your profit. Every day.",
      sub: "See how every job is performing against your bid as work happens.",
      ticks: ["Daily job profitability", "Bid budgets vs. actual costs", "Change orders & extras", "Custom Reports"],
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
      ticks: ["Digital hauling tickets", "Material & fuel log tracking", "AI reader to enter the data for you", "Track deliveries and production"],
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
      ticks: ["Centralized cloud file storage", "Plans, photos & job documents", "Access from the field or office", "File sharing & permissions"],
    },
  ] as { id: FeatureId; name: string; headline: string; sub: string; ticks: string[] }[],

  /** Andrew's "CTA — Below Feature Sections" (the button is the page's primary CTA, its own label). */
  close: {
    title: "Ready to run your entire operation in one place?",
    sub: "Less paperwork. Better job visibility. More profitable projects.",
  },

  /**
   * What a typed pain is matched on (lower case; plurals and -ing / -ed forms match too, and a typo
   * in a longer word). `strong` words name the feature outright; `weak` ones only lean towards it.
   * Phrases match as phrases and outweigh words, so they also settle words two features share:
   * "plans" and "plan" both read "plan", so the job files take "set of plans", "old plans" and
   * "blueprints", and "plan" stays with Scheduling. The everyday wording is the owner's, the way he'd
   * say it on the phone ("guys padding their hours", "the dozer keeps going down", "dump tickets"); a
   * word that's mostly something else ("the yard", "tons of") stays weak, and phrases that aren't
   * about anything ("fill out", "deal with", "dirt company") are set aside in match.ts.
   */
  keywords: {
    time: {
      strong: [
        "timecard", "time card", "timesheet", "time sheet", "hours", "hour", "hourly", "payroll", "clock", "clock in",
        "clock out", "overtime", "ot", "double time", "punch", "gps", "geofence", "attendance", "prevailing wage", "wage",
        "quickbooks", "qb", "paycheck", "paystub", "per diem", "labor hours", "man hours", "manhours", "tracking time",
        "track time", "track of time", "time tracking", "labor tracking", "track labor", "timekeeping", "time keeping", "time clock", "on the clock", "off the clock",
        "time theft", "stealing time", "steal time", "padding hours", "padding their hours", "padding time",
        "buddy punching", "who is working", "who’s working", "location", "live location", "where my guys are",
        "where are my guys", "where my crew is", "where is my crew", "track my guys", "track employees",
        "always late", "running late", "show up late", "showing up late", "shows up late", "leave early", "leaving early", "left early",
        "long lunch", "long lunches",
      ],
      weak: ["time", "employee", "worker", "labor", "chasing", "late", "pay", "on site", "lunch"],
    },
    costing: {
      strong: [
        "profit", "profitable", "profitability", "cost", "costing", "job cost", "cost code", "budget", "over budget",
        "blew the budget", "losing money", "lose money", "lost money", "making money", "make money", "made money",
        "money", "lost our shirt", "lose our shirt", "losing our shirt", "lost my shirt", "losing my shirt",
        "in the red", "in the hole", "went bad", "job went bad", "underwater", "upside down", "break even", "breaking even", "bottom line",
        "margin", "markup", "mark up", "overhead", "overrun", "expense", "change order", "extras", "extra work",
        "t&m", "time and material", "time and materials", "billing", "billable", "bill", "invoice", "invoicing",
        "get paid", "getting paid", "pay late", "pays late", "paying late", "late payment", "slow pay", "retainage",
        "spend", "spending", "numbers", "p&l", "pnl", "profit and loss", "accounting", "bookkeeping", "bleeding",
        "subcontractor", "sub", "actual", "actuals", "actual cost", "vs actual", "versus actual", "against the bid",
        "over bid", "underbid", "underbidding", "wip", "wip report", "work in progress", "cash flow",
      ],
      weak: ["job", "jobs", "cash", "paid"],
    },
    equipment: {
      strong: [
        "repair", "repair bill", "repair cost", "maintenance", "maintenance cost", "service", "service due",
        "service request", "service record", "service history", "breakdown", "break down", "breaks down", "broke down",
        "broke", "broken", "going down", "goes down", "went down", "keeps breaking", "quit running", "wont start",
        "downtime", "sitting idle", "dot", "dot compliance", "inspection", "daily inspection", "pre trip", "pretrip",
        "pre-trip", "walkaround", "truck", "dump truck", "water truck", "machine", "machinery", "equipment", "iron",
        "fleet", "excavator", "mini ex", "mini excavator", "trackhoe", "track hoe", "dozer", "bulldozer", "loader",
        "skid steer", "skidsteer", "bobcat", "grader", "backhoe", "compactor", "roller", "scraper", "trencher",
        "lowboy", "trailer", "crane", "forklift", "telehandler", "generator", "pump", "tractor", "attachment",
        "bucket", "caterpillar", "deere", "komatsu", "kubota", "rental", "shop", "shop queue", "mechanic",
        "work order", "oil", "oil change", "grease", "filter", "hydraulic", "hydraulics", "leak", "hose", "battery",
        "warranty", "preventive", "preventative", "pm schedule", "dot audit", "equipment hours", "machine hours",
        "hour meter", "utilization", "telematics",
      ],
      weak: ["engine", "tire", "parts", "tool", "idle", "blown", "unit", "audit"],
    },
    daily: {
      strong: [
        "daily report", "daily log", "daily", "report", "progress", "production", "productivity", "production rate",
        "field note", "note", "photo", "picture", "pics", "what got done", "got done", "what happened",
        "what they did", "what we did", "what the crew did", "work done", "proof of work", "how far along", "percent complete", "end of day",
        "end of the day", "field report", "field update", "from the field", "status update", "job status",
        "job diary", "diary", "job log", "jobsite log", "superintendent", "foreman report", "jobsite photo",
      ],
      weak: ["update", "paperwork", "office", "log", "video", "weather"],
    },
    materials: {
      strong: [
        "load", "load ticket", "load count", "haul", "hauling", "haul ticket", "trucking", "trucker", "truck ticket",
        "truck count", "ticket", "dump", "dump ticket", "scale ticket", "delivery ticket", "delivery slip", "fuel slip",
        "material", "materials", "receipt", "gravel", "rock", "base rock", "aggregate", "sand", "topsoil", "stone",
        "asphalt", "concrete", "millings", "riprap", "rip rap", "crushed", "fill", "fill dirt", "clean fill", "dirt", "spoil",
        "borrow pit", "quarry", "stockpile", "cubic yard", "cubic yards", "yardage", "tonnage", "per ton",
        "delivery", "deliver", "supplier", "supply", "vendor", "order", "purchase", "purchase order", "inventory",
        "fuel", "fuel log", "fuel card", "fuel cost", "diesel", "pipe",
      ],
      weak: ["driver", "yard", "yards", "ton", "tons", "gas", "export", "import", "reconcile"],
    },
    scheduling: {
      strong: [
        "schedule", "scheduling", "reschedule", "plan", "planning", "morning", "scramble", "chaos", "where to be",
        "where to go", "where they need to be", "going where", "goes where", "who goes where", "working where",
        "wrong job", "wrong site", "wrong jobsite", "wrong place", "wrong address", "assign", "assignment",
        "coordinate", "coordinating", "coordination", "juggle", "juggling", "shuffle", "shuffling", "move crews",
        "moving crews", "move guys", "moving guys", "between jobs", "double book", "double booked", "overbooked",
        "last minute", "staffing", "manpower", "short handed", "shorthanded", "short staffed", "understaffed",
        "enough guys", "enough people", "calendar", "whiteboard", "white board", "dry erase", "gantt", "lookahead",
        "look ahead", "time off", "day off", "pto", "sick day", "call in sick", "called in sick", "no show", "no-show",
        "show up", "showing up", "showed up", "tomorrow", "next week", "week ahead", "drag and drop",
      ],
      weak: ["crew", "foreman", "week", "organized", "organization", "vacation", "sick"],
    },
    sales: {
      strong: [
        "bid", "bidding", "bid deadline", "bid board", "bid list", "lead", "sales", "sale", "sell", "estimate",
        "estimating", "takeoff", "customer", "client", "gc", "general contractor", "developer", "builder",
        "homeowner", "proposal", "pipeline", "crm", "opportunity", "follow up", "follow-up", "followup",
        "call back", "callback", "go cold", "goes cold", "gone cold", "went cold", "quote", "quoting", "prospect",
        "close a deal", "close deals", "closing deals", "win work", "winning work", "new work", "more work",
        "find work", "finding work", "get work", "getting work", "more jobs", "new jobs", "new customers",
        "new clients", "repeat customer", "customer service", "slip away", "slipping away", "slipped away",
        "win rate", "close rate", "hit rate", "contract", "marketing", "referral",
      ],
      weak: ["growth", "grow", "deal", "win", "won", "pricing", "competitor", "competition", "lowball", "lowballer"],
    },
    comms: {
      strong: [
        "text", "texting", "group text", "message", "messaging", "group message", "chat", "group chat", "email",
        "whatsapp", "slack", "dispatch", "broadcast", "communication", "communicate", "miscommunication",
        "call around", "phone call", "calls", "on the phone", "phone tag", "voicemail", "radio", "walkie",
        "walkie talkie", "announcement", "alert", "in the loop", "out of the loop", "same page", "marching orders",
        "nobody knows", "word out", "tell everyone", "telling everyone", "let everyone know", "tell the guys",
        "tell the crew", "let the guys know", "let the crew know", "update the crew", "updating the crew",
        "updates to the crew", "keep everyone updated", "keep everyone informed", "get ahold", "get a hold of",
        "get hold of", "cant reach", "pass along", "passed along",
      ],
      weak: ["crew", "team", "guys", "people", "staff", "phone", "answer", "notify", "notification"],
    },
    safety: {
      strong: [
        "safety", "safe", "unsafe", "danger", "dangerous", "incident", "accident", "injury", "injured", "hurt",
        "close call", "near miss", "osha", "msha", "citation", "violation", "jsa", "jha", "job safety analysis",
        "job hazard analysis", "toolbox", "toolbox talk", "tailgate", "tailgate talk", "tailgate meeting",
        "safety meeting", "hazard", "compliance", "compliant", "first aid", "trench", "trench box", "shoring",
        "cave in", "cave-in", "confined space", "fall protection", "harness", "silica", "ppe", "hard hat",
        "workers comp", "insurance audit", "cert", "certs", "emr", "experience mod", "mod rate", "drug test", "drug testing", "811", "one call",
        "call before you dig", "locate ticket", "locate request", "utility strike", "gas line", "hit a line",
        "safety inspection", "incident report", "safety report",
      ],
      weak: ["insurance", "claim", "training", "liability", "locate", "certification"],
    },
    files: {
      strong: [
        "file", "document", "documentation", "docs", "find the plans", "find plans", "set of plans",
        "plan set", "site plans", "job plans", "latest plans", "current plans", "updated plans", "revised plans",
        "old plans", "wrong plans", "outdated plans", "paper plans", "plans on paper", "copy of the plans", "plan room", "blueprint", "drawing",
        "prints", "spec", "specs", "specification", "rfi", "submittal", "permit", "as built", "as-built",
        "latest version", "wrong version", "folder", "binder", "filing cabinet", "storage", "cloud", "upload",
        "dropbox", "google drive", "onedrive", "one drive", "sharepoint", "shared drive", "server", "pdf",
        "camera roll", "paper trail",
      ],
      weak: ["photo", "office", "find", "access", "version", "scattered", "outdated"],
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

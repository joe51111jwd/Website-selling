// src/copy.ts for COUNT YOURSELF. Every sentence is Michael's, word for word.
// BL n = line n of source/public_bootloader.md. M Ln = manuscript line n, as recorded in source/src_copy.ts.
// Lines marked `// label` are UI labels/buttons (not sentences) and are exempt from copycheck.
export const COPY = {
  rail: {
    title: "Scaling Up-Side-Down", // label
    author: "Michael Wentz", // label
    book: "The book", // label
    get: "Get the Bootloader", // label
  },
  hero: {
    byLabel: "A book by Michael Wentz,", // label (who the book is by, first screen)
    byLabelAfterTitle: "a book by Michael Wentz,", // label (after the title in italics, desktop who-line)
    forLabel: "for", // label
    who: ["Bootstrapped / self-funded", "Founder-led", "1-12 employees"], // BL 4773-4775 (criterion cells)
    h1: "How many people are on your team?", // BL 310
    whoCounts: "The question isn’t how many people you pay. It’s how many people you have to coordinate.", // BL 3400
    whoCountsToggle: "Who counts?", // label (phone disclosure)
    people: "people", // label
    pathwaysLabel: "coordination pathways", // label
    claim: "12 isn’t where you’re trying to get. It’s the line you don’t cross.", // BL 544
    stamp: "Past twelve, something breaks.", // M L3509
    getBtn: "Get the Bootloader", // label
    getMeta: "Free file for Claude, ChatGPT, Gemini", // label (BL 221: "any AI assistant (Claude, ChatGPT, Gemini, etc.)")
    setHint: "Set your number", // label (margin note beside the dial until the visitor dials)
    bookBtn: "The book · Pre-orders open soon", // label
    minus: "One fewer person", // label (aria-label)
    plus: "One more person", // label (aria-label)
  },
  // Verdicts: tag = label; line = verbatim. Range is inclusive.
  zones: [
    { id: "solo", from: 1, to: 1, tag: "Solopreneur · 1", line: "Maximum leverage, minimum resilience. You are the business." }, // BL 3412 (tag is a label)
    { id: "small", from: 2, to: 3, tag: "Small Team · 2–3", line: "Leader + helpers. Coordination still manageable. 96% stay small." }, // BL 3413 (tag is a label)
    { id: "valley", from: 4, to: 7, tag: "Valley · 4–7", line: "Transition zone between Small Team and Team. Not a destination." }, // BL 3414 (tag is a label)
    { id: "team", from: 8, to: 12, tag: "Team · 8–12", line: "Leader + team. Still know everyone’s name. Where most beautiful bootstrapped businesses live." }, // BL 3415 (tag is a label)
    { id: "threshold", from: 13, to: 14, tag: "Threshold · 13–14", line: "WARNING: You are at the Graveyard threshold. Growing to 15-16 enters structurally dangerous territory." }, // BL 3449 (tag is a label)
    { id: "graveyard", from: 15, to: 39, tag: "The Graveyard · 15–39", line: "The Graveyard is not a temporary problem. It’s a structural trap." }, // BL 3451 (1st + 2nd sentences; tag is a label)
    { id: "tot", from: 40, to: 40, tag: "Team of Teams · 40+", line: "At 40+, Team of Teams physics apply. Different constraints, different playbook." }, // BL 4253 (tag is a label)
  ],
  ceilingTag: "Team (Ceiling)", // label (BL 5125, shown in the tag when n = 12)
  meter: {
    breaks: "Past twelve, something breaks.", // M L3509
    worse: "Every addition makes it worse.", // M L2997
    caption: "Every hire compounds complexity before it compounds capacity.", // M L696 (src_copy.ts L60)
    at12: "66 pathways · Team (Ceiling)", // label (BL 5125)
    at39: "39 people · 741 pathways", // label (BL 5130)
    at39Short: "39 · 741 pathways", // label (BL 5130, phone)
    ceilShort: "12 · Ceiling", // label (phone axis, BL 5125)
    graveyardSpan: "The Graveyard · 15–39", // label (BL 75)
    graveyardLine: "The Graveyard is not a temporary problem. It’s a structural trap.", // BL 3451 (1st + 2nd sentences)
    axisY: "Coordination pathways", // label (BL 200)
    axisX: "People", // label
    you: "You", // label
    example: "Example", // label (until the visitor sets their own number)
    nextHire: "Your next hire", // label (beat two: what one more person adds)
    nextHireShort: "Next hire", // label (phone)
    at39Add: "Person 39 · +38 pathways", // label (beat two: what the 39th person adds, BL 5130 arithmetic)
    at39AddShort: "39th · +38", // label (phone, beat two)
  },
  cycle: {
    mark: "Cyclical Growth", // label (the method's name, BL 879)
    lead: "Each hire is a microdose of complexity. The cycle processes it before the next dose.", // BL 1364
    headline: "Up. Side. Down. Repeat.", // M L1713
    faces: ["UP", "SIDE", "DOWN"], // label
    jobs: ["Up for growth.", "Side for stability.", "Down for pruning."], // BL 795
    systemsLabel: ["Up systems", "Side systems", "Down systems"], // label (BL 2005-2010 column heads)
    systems: {
      up: ["Content & Product Creation", "Lead Generation", "Lead Conversion", "Customer Success & Retention"], // BL 2007-2010
      side: ["Team & Roles", "Systematization", "Technology, Automation & AI", "Inventory & Fulfillment"], // BL 2007-2010
      down: ["Profitability Optimization", "Risk Management", "Operational Efficiency", "Product Quality & Delivery"], // BL 2007-2010
    },
    clock: "The system doesn’t change. The clock speed does.", // BL 2122
    deposit: "Each cycle deposits systems and margin. The next cycle withdraws from a larger account.", // BL 866
    phaseChange: "At 13-14 employees, next hire is a phase change, not incremental growth.", // BL 3450 (1st sentence of the cell)
    paused: "Up · Side · Down", // label (printed on the stopped drum at 13-14)
    exits: ["Streamline to 12", "Raise capital", "Crisis"], // label (BL 3459-3461 option cells)
    noWayThrough: "There is no “optimize your way through” option.", // BL 3463
    streamlineBtn: "Streamline to 12", // label (sets the team to 12)
    outOfScope: "At 40+, Team of Teams physics apply. Different constraints, different playbook.", // BL 4253
  },
  // Tempo (numbers and labels only), BL 161-164. Tempo bands are NOT the destination bands.
  tempo: [
    { from: 1, to: 3, up: "3 days", side: "1 day", down: "1 day", cadence: "Weekly", full: "5 days" }, // label (BL 161; full = Up + Side + Down)
    { from: 4, to: 6, up: "1 week", side: "1 week", down: "1 week", cadence: "Bi-weekly", full: "3 weeks" }, // label (BL 162)
    { from: 7, to: 9, up: "1 month", side: "1 month", down: "1 month", cadence: "Monthly", full: "3 months" }, // label (BL 163)
    { from: 10, to: 12, up: "1 quarter", side: "1 quarter", down: "1 quarter", cadence: "Quarterly", full: "3 quarters" }, // label (BL 164)
  ],
  paths: {
    heading: "Half of this book is meant to be read. The other half is meant to be used.", // M L234 (src_copy.ts L61)
    fileName: "SUSD_Bootloader_V16.md", // label (version per BL 747)
    fileMeta: "V16 · October 2026", // label
    fileFor: "For Claude, ChatGPT, Gemini", // label (BL 221: "any AI assistant (Claude, ChatGPT, Gemini, etc.)")
    fileLine: "October 2026 · For Claude, ChatGPT, Gemini", // label (date + BL 221; the filename already carries V16)
    words: "words", // label
    refLine: "The pages are reference. The file is the operating system.", // M L4497
    firstAsk: "The first thing it asks:", // label
    firstQuestion: "How many people are on your team?", // BL 310
    email: "Email address", // label
    placeholder: "you@company.com", // label
    badEmail: "Enter your email address.", // label
    badFormat: "Check your email address.", // label (something typed, but not an address)
    key: ["GET IT", "SENT", "YOURS"], // label
    upload: "Upload the file and use the starting prompt provided with it.", // M L4531
    locate: "Then let the system locate you.", // M L4533
    bookLine: "You were never the problem. The model you inherited was.", // M L216 (src_copy.ts L196)
    bookTitle: "Scaling Up-Side-Down", // label
    bookAuthor: "Michael Wentz", // label
    preorder: "Pre-orders open soon", // label
    meanwhile: "Meanwhile, get the free Bootloader", // label (focuses the email field)
    appendix: "Read the Appendix", // label
  },
  footer: {
    authorLabel: "About Michael Wentz", // label
    bio: "Wentz spent nearly a decade in institutional finance before building and operating a bootstrapped business that scaled beyond 40 people. His experience scaling, restructuring, and simplifying that business produced the observations that became Scaling Up-Side-Down.", // BL 51
  },
};

// Extra UI labels used to build readouts, tags and accessible names (no sentences).
export const UI = {
  at: "At", // label (tempo readout: "At 8 people")
  person: "person", // label (n = 1)
  upFace: "Up", // label
  sideFace: "Side", // label
  downFace: "Down", // label
  planning: "Planning", // label (BL 159 "Planning Cadence")
  pathways: "pathways", // label
  pathway: "pathway", // label (exactly one)
  pathwayOne: "coordination pathway", // label (exactly one)
  meterHeading: "Past twelve", // label (section name for screen readers)
  pathsKicker: "Two paths", // label
  bootloaderKicker: "The Bootloader · Free", // label
  bookKicker: "The book", // label
  spinLabel: "Team size", // label (hidden numeric input)
  chipTitle: "Change your number", // label (chip tooltip / aria)
  preorderLive: "Pre-order the book", // label (only when LINKS.preorder is set)
  wordsUnit: "words", // label
  keySr: "Get the Bootloader file", // label (accessible name of the key)
  getSub: "Free file for your AI", // label (phone bar, under Get the Bootloader)
  peopleAxis: "40+ people", // label (end of the hero ruler)
  rulerGraveyard: "Graveyard", // label (under 15-39 on the hero ruler, BL 75)
  youChip: "You", // label (phone chip: your number)
  appendixNote: "Free, online", // label (after "Read the Appendix")
  fullCycle: "One full cycle", // label (tempo readout)
  coverScaling: "Scaling", // label (typographic cover)
};

// src/copy.ts for WATERLINE. Every sentence is Michael's, word for word.
// BL n = line n of source/public_bootloader.md. M Ln = manuscript line n, as recorded in source/src_copy.ts.
// Lines marked `// label` are UI labels/buttons (not sentences) and are exempt from copycheck.
export const COPY = {
  rail: {
    title: "Scaling Up-Side-Down", // label
    author: "Michael Wentz", // label
    book: "The book", // label
    get: "Get the free Bootloader", // label (Michael's own sign-up wording, client log Oct 27)
    getSub: "Framework file for your AI", // label (what the Bootloader is: BL 8, BL 221)
  },
  hero: {
    kicker: "For bootstrapped founders · Teams of 1–12", // label
    h1: "Every hire compounds complexity before it compounds capacity.", // M L696
    gaugeHead: "How many people are on your team?", // BL 310
    person: "person", // label
    people: "people", // label
    line: "line of communication", // label (singular)
    lines: "lines of communication", // label (the coordination pathways, n(n−1)/2)
    scrollCue: "Scroll to hire", // label
  },
  // zone tags are labels; zone lines are verbatim (shown in the water readout as n passes)
  zones: {
    solopreneur: { tag: "Solopreneur · 1", line: "Founder only. No coordination overhead." }, // BL 1247 (tag is a label)
    smallTeam: { tag: "Small Team · 2–3", line: "Leader + helpers. Coordination manageable." }, // BL 1248 (tag is a label)
    valley: { tag: "Valley · 4–7", line: "Transition zone between Small Team and Team." }, // BL 1249 (tag is a label)
    team: { tag: "Team · 8–12", line: "Leader + team. Still know everyone’s name." }, // BL 1250 (tag is a label)
    threshold: { tag: "Threshold · 13–14", line: "At 13-14 employees, next hire is a phase change, not incremental growth." }, // BL 3450 (1st sentence of the cell; tag is a label)
    graveyard: { tag: "Graveyard · 15–39", line: "The Graveyard is not a temporary problem. It’s a structural trap." }, // BL 3451 (1st + 2nd sentences; tag is a label)
    teamOfTeams: { tag: "Team of Teams · 40+", line: "At 40+, Team of Teams physics apply. Different constraints, different playbook." }, // BL 4253 (tag is a label)
  },
  tide: {
    breaks: "Past twelve, something breaks.", // M L3509
    redline: "Complexity > Capacity = Redline.", // M L2997
    drowning: "The business is drowning. Every addition makes it worse.", // BL 717
  },
  turn: {
    line: "You were never the problem. The model you inherited was.", // M L216
  },
  cycle: {
    standing: "Up. Side. Down. Repeat.", // M L1713
    phases: ["Up for growth.", "Side for stability.", "Down for pruning."], // BL 795
    // What each phase does, lap by lap: the Compounding Mechanism table (BL 860-864), cell text only.
    // Lap 1: "What Happens"; lap 2: "What Compounds"; lap 3: the "Next Up" row.
    subs: [
      ["Revenue expands, reach grows, capacity stretches", "Systems absorb the growth, structure stabilizes", "Complexity pruned, margin recaptured, efficiency locked"], // BL 861, 862, 863 (column 2)
      ["Volume increases", "Systems compound (library, not pile)", "Margin expands"], // BL 861, 862, 863 (column 3)
      ["Starts from higher base", "All three gains stack", "All three gains stack"], // BL 864 (Next Up row)
    ],
    labels: { water: "complexity", deck: "capacity", gap: "margin", band: "systems" }, // label
    bandLabels: ["Systems · cycle 1", "Systems · cycle 2", "Systems · cycle 3"], // label
    lapLabels: ["Cycle 1 of 3", "Cycle 2 of 3", "Cycle 3 of 3"], // label
    close: "Each cycle starts higher than the last because systems built in Side and margin captured in Down compound into the next Up.", // BL 4488
    oxygen: "Capacity > Complexity = Oxygen.", // M L2999
    breathe: "The business can breathe. Systems carry what the business creates.", // BL 718
  },
  paths: {
    bookHead: "Half of this book is meant to be read.", // M L234 (1st sentence)
    fileHead: "The other half is meant to be used.", // M L234 (2nd sentence)
    bookTitle: "Scaling Up-Side-Down", // label
    bookAuthor: "Michael Wentz", // label
    preorder: "Pre-orders open soon", // label
    fileName: "SUSD_Bootloader_V16.md", // label (version per BL 747)
    fileMeta: "V16 · October 2026 · 35,445 words", // label
    fileFace: ["# THE SUSD BOOTLOADER", "## PURPOSE"], // BL 1, BL 6 (the file's title and its first section, shown on its face)
    fileLead: "This document is designed to be read by both humans and AI.", // BL 8 (1st sentence)
    fileRows: [
      ["This Bootloader", "Enables implementation, provides precision, initializes the operating system"], // BL 13 (table row: what the file does)
    ],
    fileAlone: "Neither works alone.", // BL 15
    worksWith: "Works with ChatGPT, Claude or any AI", // label
    upload: "Upload the file and use the starting prompt provided with it.", // M L4531
    locate: "Then let the system locate you.", // M L4533
    credential: "Wentz spent nearly a decade in institutional finance before building and operating a bootstrapped business that scaled beyond 40 people.", // BL 51 (1st sentence)
    email: "Email address", // label
    placeholder: "you@company.com", // label
    badEmail: "Enter your email address.", // label
    checkEmail: "Check the email address.", // label
    submit: "Get the free Bootloader", // label
    stamp: "Yours", // label
    closed: "The file is the operating system.", // M L4497 (2nd sentence)
    leaving: "Taking you to the download page…", // label
    appendix: "Read the Appendix", // label
  },
  footer: {
    line: "Up. Side. Down. Repeat.", // M L1713
  },
};

// Extra UI labels for this build (not sentences; exempt from copycheck).
export const UI = {
  byline: "A book by Michael Wentz", // label
  skip: "Skip to the book and the Bootloader", // label
  tide: "The tide", // label
  turnLabel: "The turn", // label
  cycleLabel: "The cycle", // label
  pathsLabel: "Two paths", // label
  wordsUnit: "words", // label
  fileKind: "Markdown file", // label
  free: "Free", // label
  closed: "Closed system", // label
  yoursAria: "Stamped: yours", // label
  preorderLink: "Pre-order the book", // label
  theBook: "The book", // label
  theFile: "The Bootloader", // label
  author: "The author", // label
};

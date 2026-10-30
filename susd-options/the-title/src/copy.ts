// src/copy.ts for THE TITLE. Every sentence is Michael's, word for word.
// BL n = line n of source/public_bootloader.md. M Ln = manuscript line n, as recorded in source/src_copy.ts.
// Lines marked `// label` are UI labels/buttons (not sentences) and are exempt from copycheck.
// Multi-sentence strings are never edited here; components may show them one sentence per line, in order.
export const COPY = {
  rail: {
    author: "Michael Wentz", // label
    book: "The book", // label
    get: "Get the Bootloader", // label
  },
  hero: {
    diagnosis: "Most founders think they’re scaling. They’re not.", // BL 794 (1st + 2nd sentences of the Part I cell)
    diagnosisRed: "They’re not.", // BL 794 (the second sentence, coloured red; same string as above)
    cyclical: "Real scaling is cyclical.", // BL 795 (1st sentence of the Part II cell; shown before the job lines, in order)
    scaling: "Scaling", // label (title)
    words: ["UP", "SIDE", "DOWN"], // label (title)
    jobs: ["Up for growth.", "Side for stability.", "Down for pruning."], // BL 795
    who: "A book by Michael Wentz · For bootstrapped founders · Teams of 1–12", // label
    getBtn: "Get the Bootloader", // label
    getMeta: "Free file · Works in Claude, ChatGPT, Gemini", // label (free per the project record; the assistants BL 221 names; V16 and the word count are on the file itself)
    bookBtn: "The book · Pre-orders open soon", // label
  },
  skip: {
    headline: "Every hire compounds complexity before it compounds capacity.", // M L696
    rest: "Skip a leg, tip upside down.", // BL 795 (the caption at rest: what the hold control is about to show)
    week: ["Always launching.", "Always hiring.", "Always adding."], // M L1993 (one sentence per forced beat, building up the line in order)
    settled: "But inside, nothing ever settled.", // M L1995
    collapsed: "We were Scaling Upside Down.", // M L461
    control: "Hold to push only UP", // label
    controlHint: "or hold Space", // label
    controlHeld: "Let go", // label
    toggleOn: "Push only UP", // label (reduced-motion toggle)
    toggleOff: "Put it back", // label (reduced-motion toggle)
  },
  repeat: {
    headline: "Up. Side. Down. Repeat.", // M L1713
    cycleLabels: ["Cycle 1", "Cycle 2", "Cycle 3"], // label
    deposit: "Each cycle deposits systems and margin. The next cycle withdraws from a larger account.", // BL 866
    machine: "You don’t win by hitting a revenue number. You win by installing a machine that hits the number for you.", // BL 659 (why the twelve matter)
    twelve: "Four for Scaling Up, four for Scaling Sideways, four for Scaling Down. Twelve.", // M L3119
    systems: {
      up: ["Content & Product Creation", "Lead Generation", "Lead Conversion", "Customer Success & Retention"], // BL 2007-2010
      side: ["Team & Roles", "Systematization", "Technology, Automation & AI", "Inventory & Fulfillment"], // BL 2007-2010
      down: ["Profitability Optimization", "Risk Management", "Operational Efficiency", "Product Quality & Delivery"], // BL 2007-2010
    },
  },
  usd: {
    label: "The Scoreboard", // label (BL 796 cell label)
    line: "The dollar sign isn’t clever wordplay—it’s the proof. If margins aren’t widening, you’re not scaling.", // BL 796
  },
  fit: {
    headline: "Too big to be small, too small to be big", // BL 4777
    forHead: "For", // label
    notHead: "Not for", // label
    isFor: ["Bootstrapped / self-funded", "Founder-led", "1–12 employees", "Stuck between sizes", "Margin matters", "Tired of traditional advice"], // BL 4773-4779 (all but the jargon row "Rented-scale physics")
    notFor: ["Venture-backed", "40+ employees", "Pure lifestyle business (no systems)", "Pre-revenue / idea stage", "Seeking 10x growth", "Exit-focused (flip in 2-3 years)"], // BL 4787-4792 (all but the jargon row "Already at Team of Teams")
  },
  paths: {
    bookHead: "The pages are reference.", // M L4497 (1st sentence)
    fileHead: "The file is the operating system.", // M L4497 (2nd sentence)
    bookLine: "You were never the problem. The model you inherited was.", // M L216
    author: "Wentz spent nearly a decade in institutional finance before building and operating a bootstrapped business that scaled beyond 40 people.", // BL 51 (1st sentence: who wrote it)
    bookTitle: "Scaling Up-Side-Down", // label
    bookAuthor: "Michael Wentz", // label
    preorder: "Pre-orders open soon", // label
    preorderLive: "Pre-order the book", // label (used once LINKS.preorder is set)
    fileName: "SUSD_Bootloader_V16.md", // label (version per BL 747)
    fileMeta: "V16 · October 2026 · 35,445 words", // label
    aiTools: "Free · Works in Claude · ChatGPT · Gemini", // label (the assistants BL 221 names)
    firstQLabel: "Its first question:", // label (the starting prompt opens with Step 0, BL 308-310)
    firstQ: "How many people are on your team?", // BL 310
    // The file's real first lines (BL 1-21), shown faint on the sheet as a picture of the file (aria-hidden).
    fileFace: [
      "# THE SUSD BOOTLOADER", // BL 1
      "## Scaling Up-Side-Down Operating System — Front Matter", // BL 2
      "",
      "---", // BL 4
      "",
      "## PURPOSE", // BL 6
      "",
      "This document is designed to be read by both humans and AI. It contains the complete architecture of the Scaling Up-Side-Down framework—the scholarship, proof, and implementation details that the book intentionally withholds to preserve the reader's transformation experience.", // BL 8
      "",
      "| Document | Function |", // BL 10
      "|----------|----------|", // BL 11
      "| **The Book** | Creates recognition, installs inversions, earns trust through witness voice |", // BL 12
      "| **This Bootloader** | Enables implementation, provides precision, initializes the operating system |", // BL 13
      "",
      "**Neither works alone.**", // BL 15
      "",
      "---", // BL 17
      "",
      "**Critical Prerequisite**", // BL 19
      "",
      "This document describes how the system operates once recognition has already occurred. It cannot create recognition on its own.", // BL 21
    ],
    upload: "Upload the file and use the starting prompt provided with it.", // M L4531
    locate: "Then let the system locate you.", // M L4533
    email: "Email address", // label
    placeholder: "you@company.com", // label
    badEmail: "Enter your email address.", // label
    checkEmail: "Check your email address.", // label (a value that is not an email address)
    confirmNext: "You’ll confirm it on the Appendix page", // label (said before the click: the live form there does the real opt-in)
    submit: "Get the file", // label
    stamp: "Yours", // label
    next: "Opening the Appendix page…", // label (shown after a valid submit, before the live form opens)
    bookMore: "Until then, read its Appendix online", // label (the book prints the Appendix address; the live page is that Appendix)
  },
  footer: {
    line: "Up. Side. Down. Repeat.", // M L1713
    author: "Michael Wentz", // label
    appendix: "Read the Appendix", // label
  },
};

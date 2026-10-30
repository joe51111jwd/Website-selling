// src/copy.ts for CORRECTED EDITION. Every sentence is Michael's, word for word.
// BL n = line n of source/public_bootloader.md. M Ln = manuscript line n, as recorded in source/src_copy.ts.
// Lines marked `// label` are UI labels/buttons/proof marks (not sentences) and are exempt from copycheck.
// Inherited/corrected pairs are the two cells of one table row in the Bootloader.
export const COPY = {
  head: {
    author: "Michael Wentz", // label
    title: "Scaling Up-Side-Down", // label
    get: "Get the Bootloader", // label
    sameGame: "Same game. Different rules.", // BL 243 (running head from sheet 02 on)
  },
  who: {
    title: "Scaling Up-Side-Down", // label (the book's title, set in italic on the imprint line)
    by: "A book by Michael Wentz", // label
    forWhom: ["For bootstrapped founders", "Teams of 1–12"], // label
  },
  // What the Bootloader is, under the hero buttons: the file, its size, and where it goes.
  fileCaption: ["SUSD_Bootloader_V16.md · 35,445 words", "for any AI assistant (Claude, ChatGPT, Gemini, etc.)"], // label (BL 221 fragment)
  galley: "Galley {n} of 06", // label
  marks: { del: "del.", stet: "stet", tr: "tr." }, // label (proofreader's marks)
  sheet01: {
    inherited: "“I should be further by now”", // BL 1439 (left cell, quoted in source)
    corrected: "Each cycle starts higher than the last", // BL 1439 (right cell)
    legs: ["UP", "SIDE", "DOWN"], // label
    support: "You were never the problem. The model you inherited was.", // M L216
    getBtn: "Get the Bootloader", // label
    bookBtn: ["The book", "Pre-orders open soon"], // label (two parts with a rule between)
  },
  sheet02: {
    inherited: "Growth is a straight line upward", // BL 1426 (left cell)
    corrected: "Growth comes from completing cycles", // BL 1426 (right cell)
    stair: ["Real scaling is cyclical.", "Up for growth.", "Side for stability.", "Down for pruning."], // BL 795 (four consecutive sentences, one per step)
  },
  sheet03: {
    inherited: "More people = more capacity", // BL 692 (left cell)
    corrected: "More people = more coordination cost (unless absorbed)", // BL 692 (right cell)
    support: "Every hire compounds complexity before it compounds capacity.", // M L696
    margin: ["8 people · 28 pathways", "12 people · 66 pathways", "15 people · 105 pathways"], // label (n(n-1)/2, BL 5112-5132)
    gloss: "Systems absorb the growth", // BL 862 (Side cell, first clause): the editor's note on "absorbed"
  },
  sheet04: {
    before: "Complexity > Capacity = Redline.", // M L2997
    after: "Capacity > Complexity = Oxygen.", // M L2999
    support: "The business can breathe. Systems carry what the business creates.", // BL 718 (Oxygen: Meaning cell)
    transposeBtn: "Swap", // label
  },
  sheet05: {
    headline: "Too big to be small, too small to be big", // BL 4777
    stet: ["Bootstrapped / self-funded", "Founder-led", "1-12 employees", "Tired of traditional advice"], // BL 4773-4779 (criterion cells)
    del: ["Venture-backed", "Seeking 10x growth", "Exit-focused (flip in 2-3 years)", "40+ employees"], // BL 4787-4792 (criterion cells)
  },
  sheet06: {
    title: "The playbook you inherited", // label
    compiled: ["“I should be further by now”", "Growth is a straight line upward", "More people = more capacity", "Scale up at any cost"], // BL 1439 · BL 1426 · BL 692 · BL 693 (Traditional Logic cells: the beliefs the founder inherited)
    strike: "Strike it", // label
    skip: "Skip to the file", // label
  },
  file: {
    headline: "The book changed how you think. This SUSD Bootloader changes how you operate.", // copy.ts L146 (M L4553, L4555)
    subhead: "This is not a playbook. It is a constraint layer.", // BL 213
    label: "The SUSD Bootloader", // label
    aiFor: "For any AI assistant (Claude, ChatGPT, Gemini, etc.)", // label (BL 221 fragment)
    fileName: "SUSD_Bootloader_V16.md", // label (version per BL 747)
    fileMeta: "V16 · October 2026 · 35,445 words", // label
    fileFace: ["# THE SUSD BOOTLOADER", "## Scaling Up-Side-Down Operating System — Front Matter", "## PURPOSE"], // BL 1-6 (headings shown faint on the file face)
    refLine: "The pages are reference. The file is the operating system.", // M L4497
    email: "Email address", // label
    placeholder: "you@company.com", // label
    badEmail: "Enter your email address.", // label
    badFormat: "Check the email address.", // label
    submit: "Get it", // label
    stamp: "Yours", // label
    upload: "Upload the file and use the starting prompt provided with it.", // M L4531
    bookLine: "Half of this book is meant to be read. The other half is meant to be used.", // M L234
    bookTitle: "Scaling Up-Side-Down", // label
    bookAuthor: "Michael Wentz", // label
    preorder: "Pre-orders open soon", // label
    appendix: "Read the Appendix", // label
  },
  footer: {
    line: "Up. Side. Down. Repeat.", // M L1713
  },
};

// Additions for this build (UI labels, plus two verbatim list captions for screen readers).
export const EXTRA = {
  hold: "Press and hold", // label
  bookShort: "The book", // label
  isFor: "Who This Framework IS For", // BL 4769 (list caption, read by screen readers)
  isNotFor: "Who This Framework IS NOT For", // BL 4783 (list caption, read by screen readers)
  coverScaling: "Scaling", // label (typographic cover)
  coverLegs: ["Up-", "Side-", "Down"], // label (typographic cover: the title's three legs)
};

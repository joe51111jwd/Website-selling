// src/copy.ts for WATERLINE (render). Paste as is. Every sentence is Michael's, word for word.
// Brief: susd-render/briefs/BRIEF-waterline-render.md (section 14).
// Refs: BL n = line n of susd-options/source/public_bootloader.md (the SUSD Bootloader V16).
//       M n · copy.ts:k = manuscript line n, as recorded on line k of susd-options/source/src_copy.ts.
// A line ending in `// label` is a UI label, button or microcopy (not a sentence of Michael's); copycheck skips it.
// Gate (must print "0 not found"):
//   node /home/user/Website-selling/susd-options/tools/copycheck.mjs src/copy.ts
// Never edit a sentence here. A multi-sentence line may be shown one sentence at a time, in its original order only.

export const COPY = {
  meta: {
    title: "Scaling Up-Side-Down · Michael Wentz", // label
    description: "Every hire compounds complexity before it compounds capacity.", // M 696 · copy.ts:60
  },

  // Fixed chrome: top bar (desktop and phone), the Bootloader dock (desktop) and bar (phone).
  chrome: {
    title: "Scaling Up-Side-Down", // label (the book's title; set with U+2011 no-break hyphens)
    byline: "A book by Michael Wentz", // label
    book: "The book", // label
    skip: "Skip to the Bootloader", // label
  },
  dock: {
    name: "SUSD Bootloader", // label
    meta: "Free file · V16 · 35,445 words", // label
    metaCycle: "The file is the operating system.", // M 4497 · copy.ts:61 (2nd sentence; the dock's meta line during beats 6-8)
    button: "Get it free", // label
    aria: "Get the free SUSD Bootloader file", // label
  },

  // Beat 1: the first screen. The thesis itself is the rendered letters; this H1 is visually hidden.
  hero: {
    h1: "Every hire compounds complexity before it compounds capacity.", // M 696 · copy.ts:60
    audience: "For bootstrapped, self-funded founders with teams of 1–12", // label (from the fit table, BL 4773 "Bootstrapped / self-funded" and BL 4775 "1-12 employees")
    scrollCue: "Scroll to hire. Each step is one more person.", // label
    altDesktop: "Heavy capital letters standing on a concrete lock wall spell the sentence above; dark water sits just below them.", // label (poster alt text)
    altPhone: "The same sentence in six lines of heavy capitals on a lock wall, with dark water below.", // label (poster alt text)
  },

  // The instrument (right column on desktop, compact readout on phone), beats 1-5.
  gauge: {
    question: "How many people are on your team?", // BL 310
    person: "person", // label
    people: "people", // label
    pathway: "coordination pathway", // label
    pathways: "coordination pathways", // label
    delta: "+{d}", // label (pathways added by the last hire: n-1)
    // Bands, top to bottom as on a water gauge. Tags are labels (BL 69-77 names and ranges); lines are verbatim.
    bands: [
      { id: "teamOfTeams", tag: "Team of Teams 40+", line: "At 40+, Team of Teams physics apply. Different constraints, different playbook." }, // BL 4253
      { id: "graveyard", tag: "Graveyard 15–39", line: "The Graveyard is not a temporary problem. It's a structural trap." }, // BL 3451 (1st + 2nd sentences)
      { id: "threshold", tag: "Threshold 13–14", line: "At 13-14 employees, next hire is a phase change, not incremental growth." }, // BL 3450 (1st sentence of the quoted cell)
      { id: "team", tag: "Team 8–12", line: "Leader + team. Still know everyone's name." }, // BL 1250
      { id: "valley", tag: "Valley 4–7", line: "Transition zone between Small Team and Team." }, // BL 1249
      { id: "smallTeam", tag: "Small Team 2–3", line: "Leader + helpers. Coordination manageable." }, // BL 1248
      { id: "solopreneur", tag: "Solopreneur 1", line: "Founder only. No coordination overhead." }, // BL 1247
    ],
  },

  // Beats 2-5: the tide (scroll = hiring).
  tide: {
    perHire: "Each addition doesn't add one unit of complexity — it adds n-1 new interaction pathways.", // BL 2339 (1st sentence of the cell)
    twelve: "12 isn't where you're trying to get. It's the line you don't cross.", // BL 544
    breaks: "Past twelve, something breaks.", // M 3509 · copy.ts:88
    under: "Complexity that accumulated faster than the structure could hold.", // M 2021 · copy.ts:96
    redline: "Complexity > Capacity = Redline.", // M 2997 · copy.ts:80
    drowning: "The business is drowning. Every addition makes it worse.", // BL 717
  },

  // Beat 6: the turn.
  turn: {
    line: "You were never the problem. The model you inherited was.", // M 216 · copy.ts:196
  },

  // Beats 6-9: the cycle.
  cycle: {
    lead: "Real scaling is cyclical.", // BL 795 (1st sentence of the cell)
    phases: ["Up for growth.", "Side for stability.", "Down for pruning."], // BL 795 (2nd-4th sentences)
    phaseNames: ["Up", "Side", "Down"], // label
    // What each phase does: the Compounding Mechanism table, "What Happens" column, cell text only.
    cells: [
      "Revenue expands, reach grows, capacity stretches", // BL 861
      "Systems absorb the growth, structure stabilizes", // BL 862
      "Complexity pruned, margin recaptured, efficiency locked", // BL 863
    ],
    side: "Systems were what actually held the weight.", // M 2408 · copy.ts:103
    downA: "Something needs to be cut.", // M 2564 · copy.ts:111
    downB: "The business stops asking for more and starts asking what to keep.", // M 2564 · copy.ts:112
    repeat: "Up. Side. Down. Repeat.", // M 1713 · copy.ts:125
    deposits: "Each cycle deposits systems and margin. The next cycle withdraws from a larger account.", // BL 866
    higher: "Nothing moves forward until the cycle completes. But when it does, the next cycle starts higher.", // BL 870 (2nd + 3rd sentences)
    labels: { water: "complexity", deck: "capacity", gap: "margin" }, // label (anchored to the render)
    lap: "Cycle {k} of 3", // label
    oxygen: "Capacity > Complexity = Oxygen.", // M 2999 · copy.ts:119
    breathe: "The business can breathe. Systems carry what the business creates.", // BL 718
  },

  // Beat 7: the mid-story offer (after the first full cycle).
  offer: {
    line: "The pages are reference. The file is the operating system.", // M 4497 · copy.ts:61
    button: "Get the free Bootloader", // label
  },

  // Beat 9: the finale. Two paths; the Bootloader is the primary one.
  finale: {
    aiOpen: "In an open system, AI accelerates chaos.", // M 4523 · copy.ts:136 (1st sentence)
    aiClosed: "In a closed system, AI accelerates clarity.", // M 4523 · copy.ts:140 (2nd sentence)
    bookHalf: "The book changed how you think.", // M 4553 · copy.ts:146 (1st sentence)
    fileHalf: "This SUSD Bootloader changes how you operate.", // M 4555 · copy.ts:146 (2nd sentence)
    fileName: "SUSD Bootloader", // label
    fileWhat: "The book's appendix as one file, for your AI", // label (what the file is, in one line)
    fileMeta: "Free · V16 · 35,445 words · Markdown", // label (version: BL 747; words: the live /appendix)
    worksWith: "Works with Claude, ChatGPT, Gemini", // label (BL 221 names these three assistants)
    email: "Email address", // label
    placeholder: "you@company.com", // label
    submit: "Get the free Bootloader", // label
    badEmail: "Enter your email address.", // label
    noteHandoff: "Opens the Bootloader page, where the file is sent by email.", // label (OPTIN.mode "handoff")
    notePost: "The file is sent to this address.", // label (OPTIN.mode "post"; add a line about new versions only once Michael confirms the list sends them)
    leaving: "Taking you to the Bootloader page…", // label
    upload: "Upload the file and use the starting prompt provided with it.", // M 4531 · copy.ts:150
    locate: "Then let the system locate you.", // M 4533 · copy.ts:151
    bookTitle: "Scaling Up-Side-Down", // label
    bookAuthor: "Michael Wentz", // label
    preorderSoon: "Pre-orders open soon", // label (disabled until LINKS.preorder is set)
    preorder: "Pre-order the book", // label (only when LINKS.preorder is set)
    credential: "Wentz spent nearly a decade in institutional finance before building and operating a bootstrapped business that scaled beyond 40 people.", // BL 51 (1st sentence)
    appendix: "Read the Appendix", // label
  },

  footer: {
    line: "Up. Side. Down. Repeat.", // M 1713 · copy.ts:125
  },
};

// Reduced motion and no-JS: the stacked plates reuse the sentences above (no new copy).
// Debug and accessibility strings are labels.
export const UI = {
  storyRegion: "The story, told by the water", // label (aria-label of the stage)
  readoutLive: "{n} {people}, {p} {pathways}, {band}", // label (aria-live text on band change)
  stamp: "Yours", // label (drain confirmation)
};

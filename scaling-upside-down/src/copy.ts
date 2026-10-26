// All words on the site. Every sentence here is Michael's, taken from the manuscript
// (line numbers in the comments), trimmed to whole sentences for the overlays.
// `at` is the scroll window (0-1 through the story) where a beat is on screen.

export type Stat = { value: string; label: string };

export type Beat = {
  id: string;
  at: [number, number];
  kicker?: string;
  tone?: "up" | "side" | "down" | "ink";
  headline: string;
  body?: string;
  detail?: string;
  stats?: Stat[];
  note?: string;
  cta?: boolean;
};

export type SiteCopy = {
  hero: { kicker: string; title: string; sub: string; detail: string; preorder: string };
  beats: Beat[];
  closed: {
    open: { kicker: string; headline: string };
    closing: { kicker: string; headline: string; detail: string };
    copy: { kicker: string; headline: string };
    after: { kicker: string; question: string; line: string };
    block: {
      copy: string;
      copied: string;
      again: string;
      words: string;
      copying: string;
      tryAgain: string;
      pasteInto: string;
      names: Record<"copy" | "done" | "again" | "error" | "copyNoCount" | "doneNoCount" | "againNoCount" | "errorNoCount" | "busy", string>;
    };
    pair: { book: string; file: string };
    book: { kicker: string; quote: string; sign: string; headline: string; soon: string; button: string };
  };
  proof: { title: string; items: { n: string; tone: "up" | "down"; label: string; title: string }[]; close: string };
  notice: { title: string; paragraphs: string[] };
  footer: { line: string };
};

export const COPY: SiteCopy = {
  hero: {
    kicker: "Michael Wentz · For bootstrapped founders",
    title: "Scaling\nUp-Side-Down",
    sub: "Every hire compounds complexity before it compounds capacity.", // L696
    detail: "Half of this book is meant to be read. The other half is meant to be used. The pages are reference. The file is the operating system.", // L234, L4497
    preorder: "Pre-order the book",
  },
  // One idea per scroll moment, and the picture does most of the telling. Phones show the kicker
  // and headline only; desktop adds the one detail line.
  beats: [
    {
      id: "grow",
      at: [0.05, 0.145],
      kicker: "Our best quarter ever", // L464
      tone: "up",
      headline: "Always launching. Always hiring. Always adding.", // L1993
      detail: "But inside, nothing ever settled.", // L1995
    },
    {
      id: "redline",
      at: [0.155, 0.23],
      kicker: "The equation",
      tone: "down",
      headline: "Complexity > Capacity = Redline.", // L2997
      detail: "Every addition makes it worse.", // L2997
    },
    {
      id: "collapse",
      at: [0.24, 0.305],
      kicker: "The shape of the break", // L1120
      tone: "down",
      headline: "Past twelve, something breaks.", // L3509
      detail: "We were Scaling Upside Down.", // L461
    },
    {
      id: "trap",
      at: [0.315, 0.377],
      kicker: "12–40 people", // L3562 (the picture's tag names it: The Graveyard)
      tone: "down",
      headline: "Complexity that accumulated faster than the structure could hold.", // L2021
    },
    {
      id: "side",
      at: [0.39, 0.548],
      kicker: "Scaling Sideways", // L1716
      tone: "side",
      headline: "Systems were what actually held the weight.", // L2408
      detail: "Four for Scaling Up, four for Scaling Sideways, four for Scaling Down. Twelve.", // L3119
    },
    {
      id: "down",
      at: [0.555, 0.612],
      kicker: "Scaling Down", // L1717
      tone: "down",
      headline: "Something needs to be cut.", // L2564
      detail: "The business stops asking for more and starts asking what to keep.", // L2564
    },
    {
      id: "up",
      at: [0.62, 0.845],
      kicker: "Scaling Up", // L1715
      tone: "up",
      headline: "Capacity > Complexity = Oxygen.", // L2999
      detail: "The systems can carry what the business creates.", // L2999
    },
    {
      id: "repeat",
      at: [0.905, 0.995],
      kicker: "Up. Side. Down. Repeat.", // L1713
      tone: "ink",
      headline: "The business held. Not just held—it grew.", // L192, L194
      detail: "Our margins stopped shrinking.", // L3319
    },
  ],
  // After the story: the closed loop. Seen from above, the pile AI keeps adding is swept off the
  // table and the twelve systems are set down around Up / Side / Down; copying the prompt closes the ring.
  closed: {
    open: {
      kicker: "Open System", // L4510 (table heading)
      headline: "In an open system, AI accelerates chaos.", // L4523 (1st sentence)
    },
    closing: {
      kicker: "Closed System", // L4510 (table heading)
      headline: "In a closed system, AI accelerates clarity.", // L4523 (2nd sentence)
      detail: "The twelve we'd mapped were enough.", // L2610
    },
    copy: {
      kicker: "The Closed Loop", // L4551 (heading)
      headline: "This document is the closed system.", // L4525
    },
    after: {
      kicker: "First question",
      question: "How many people are on your team?", // L4537
      line: "Then talk to it normally.", // L4543
    },
    // the COPY block's stamp and its accessible name: UI labels, not sentences
    block: {
      copy: "Copy",
      copied: "Copied",
      again: "Again",
      words: "words",
      copying: "Copying",
      tryAgain: "Try again",
      pasteInto: "into",
      // the button's accessible name begins with what its face says
      names: {
        copy: "Copy {n} words: the whole prompt",
        done: "Copied {n} words: the whole prompt",
        again: "Copy again: the whole prompt, {n} words",
        error: "Copy, try again: the whole prompt, {n} words",
        copyNoCount: "Copy the prompt",
        doneNoCount: "Copied the prompt",
        againNoCount: "Copy again: the prompt",
        errorNoCount: "Copy, try again: the prompt",
        busy: "Copying the prompt",
      },
    },
    pair: {
      book: "The pages are reference.", // L4497 (1st sentence)
      file: "The file is the operating system.", // L4497 (2nd sentence)
    },
    book: {
      kicker: "The book",
      quote: "You may be tempted to skip straight to it. I wouldn't.", // L246
      sign: "— Michael", // L4463
      headline: "You were never the problem. The model you inherited was.", // L216
      soon: "Pre-orders open soon",
      button: "Pre-order the book",
    },
  },
  proof: {
    title: "Two launches of Izabella's books",
    items: [
      { n: "40", tone: "down", label: "People · #1 New York Times", title: "Hashimoto's Protocol" }, // L3459; forty people, L968
      { n: "12", tone: "up", label: "People · Publishers Weekly bestseller", title: "Adrenal Transformation Protocol" }, // L3461 (all with twelve people)
    ],
    close: "The contrast wasn't the ranking. The contrast was the cost.", // L3463
  },
  notice: {
    title: "SUSD Bootloader Use Notice", // L4557
    paragraphs: [
      "Before You Load the SUSD Bootloader Into an AI System",
      "The SUSD Bootloader is a specification designed for use with third-party artificial-intelligence systems. Please read this notice before copying, uploading, or using it with an AI platform.",
      "## Permission to Use",
      "You may copy, upload, and make working modifications to the SUSD Bootloader for your own personal or internal business use with AI systems.",
      "This permission does not include the right to publish, publicly distribute, sell, sublicense, commercially redistribute, or make the Bootloader itself available as a standalone or competing product, service, prompt library, database, or software offering. No ownership or intellectual-property rights are transferred by this permission.",
      "## AI Outputs and Limitations",
      "Responses produced using the Bootloader are generated by third-party AI systems and are not individually authored, reviewed, or approved by the author.",
      "AI systems can misunderstand instructions, produce inaccurate or incomplete information, behave inconsistently, and change over time. The Bootloader contains routing rules, thresholds, warnings, and other constraints intended to guide how an AI applies the SUSD framework, but there is no guarantee that any AI system will interpret, execute, or enforce them correctly.",
      "The author and publisher do not warrant that the Bootloader will function as intended with every AI system or remain compatible with future models or platforms.",
      "## Decision Support and Professional Advice",
      "The SUSD Bootloader and its outputs are decision-support tools, not substitutes for your judgment or qualified professional advice.",
      "Outputs involving hiring, staffing, employee or contractor relationships, compensation, taxes, contracts, ownership, financial allocations, or other matters with material legal or financial consequences should be independently evaluated before action is taken.",
      "Nothing generated through the Bootloader constitutes legal, financial, tax, accounting, investment, employment, human-resources, or other professional advice. You remain responsible for the decisions you make and actions you take using the Bootloader or its outputs.",
      "## Confidential Information and Third-Party Platforms",
      "Using the Bootloader may involve providing information about your business, finances, employees, contractors, customers, or operations. Before submitting information to an AI platform, consider whether you have the authority to provide it and whether it is appropriate to disclose it.",
      "AI platforms have their own terms of service, privacy practices, security practices, and policies governing submitted information. Those practices are outside the control of the author and publisher, and you are responsible for evaluating the platform you choose to use.",
      "The Bootloader may be revised or updated over time, but the author is under no obligation to update it or maintain compatibility with any particular AI system.",
      "To the fullest extent permitted by applicable law, the author and publisher disclaim liability for losses or damages arising from AI-generated outputs, the failure of an AI system to follow the Bootloader as intended, information submitted to third-party platforms, or decisions or actions taken in reliance on outputs generated through its use."
    ], // L4559-4593
  },
  footer: {
    line: "Up. Side. Down. Repeat.", // L1713
  },
};

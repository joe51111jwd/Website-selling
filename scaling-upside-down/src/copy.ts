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
  bootloader: { kicker: string; headline: string; body: string; detail: string; steps: string[]; button: string; copied: string; notice: { title: string; paragraphs: string[] } };
  book: { kicker: string; headline: string; subtitle: string; body: string; why: { label: string; text: string }; proofTitle: string; proof: { label: string; text: string }[]; proofClose: string; parts: { title: string; text: string }[]; button: string; soon: string; author: string };
  footer: { kicker: string; headline: string; body: string; detail: string };
};

export const COPY: SiteCopy = {
  hero: {
    kicker: "Michael Wentz · For bootstrapped founders",
    title: "Scaling\nUp-Side-Down",
    sub: "Every hire compounds complexity before it compounds capacity.", // L696
    detail: "Half of this book is meant to be read. The other half is meant to be used. The pages are reference. The file is the operating system.", // L234, L4497
    preorder: "Pre-order the book",
  },
  beats: [
    {
      id: "grow",
      at: [0.05, 0.14],
      kicker: "Our best quarter ever", // L464
      tone: "up",
      headline: "Every business book said hire when you're overwhelmed. So we did.", // L576
      body: "The consultant said add a layer of management. So we added. The podcast said 10x. So we pushed harder.", // L576
      detail: "Your best quarter can be the most dangerous moment in your business.", // L462
    },
    {
      id: "math",
      at: [0.15, 0.235],
      kicker: "The coordination tax", // L755
      tone: "ink",
      headline: "The math doesn't grow in a straight line. It explodes.", // L765-767
      body: "Five people already create ten communication pathways. Twelve people create sixty-six. At twenty people, there are one hundred ninety.", // L773-775
      detail: "It wasn't a leadership failure. It was physics.", // L780
    },
    {
      id: "redline",
      at: [0.245, 0.3],
      kicker: "The equation",
      tone: "down",
      headline: "Complexity > Capacity = Redline.", // L2997
      body: "Everyone was working harder. No one was accomplishing more. You can't outwork gravity.", // L1072, L1173
    },
    {
      id: "collapse",
      at: [0.31, 0.415],
      kicker: "Past twelve", // L3509
      tone: "down",
      headline: "Something breaks. Not gradually. Structurally.", // L3509-3511
      body: "Revenue was up. Margin was down. The team was bigger. I was more exhausted.", // L582
      detail: "We were Scaling Upside Down.", // L461
    },
    {
      id: "trap",
      at: [0.425, 0.5],
      kicker: "The Scaling Trap", // L1175
      tone: "down",
      headline: "Too big to be small, too small to be big.", // L1835
      body: "This zone has a name. I started calling it The Graveyard.", // L1177
      stats: [
        { value: "8–12", label: "Team" },
        { value: "12–40", label: "The Graveyard" },
        { value: "40–70", label: "Team of Teams" },
      ], // L989, L3562, L991
      detail: "There is nothing wrong with you. You just walked into a trap that no one told you was there.", // L1245-1247
    },
    {
      id: "map",
      at: [0.51, 0.585],
      kicker: "The borrowed map", // L574
      tone: "ink",
      headline: "The playbook came from venture-backed companies.", // L373
      body: "The 4% crossed the valley because they had bridges. You're being told to cross the same valley by swimming.", // L391
      stats: [
        { value: "96%", label: "stay small" },
        { value: "4%", label: "reach $1 million" },
        { value: "0.4%", label: "reach $10 million" },
      ], // L980-982
      note: "Of roughly 28 million firms in the United States. The numbers come from Verne Harnish.", // L976-980
      detail: "Bootstrapped companies don't buy scale. They rent it.", // L1680
    },
    {
      id: "side",
      at: [0.595, 0.66],
      kicker: "Scaling Sideways",
      tone: "side",
      headline: "Pause. Integrate. Stabilize.", // L2060
      body: "You have to digest every gain before you can reach for the next.", // L1680
      detail: "Not Scaling Upside Down—the diagnosis. Scaling Up-Side-Down—a cycle with three phases.", // L1722, L1723
    },
    {
      id: "down",
      at: [0.67, 0.775],
      kicker: "Scaling Down",
      tone: "down",
      headline: "Stop. Release. Simplify.", // L2061
      body: "Tools nobody used. Processes that created friction. Work we'd been carrying for no reason.", // L3321
      detail: "Forty-three subscriptions. Over $12,000 a month in software alone.", // L600
    },
    {
      id: "up",
      at: [0.785, 0.865],
      kicker: "Scaling Up",
      tone: "up",
      headline: "Add. Grow. Capture.", // L2059
      body: "Capacity > Complexity = Oxygen. You can breathe. The systems can carry what the business creates.", // L2999
      detail: "Team. Eight to twelve people. A destination worth defending.", // L1813
    },
    {
      id: "repeat",
      at: [0.875, 0.99],
      kicker: "Up. Side. Down. Repeat.", // L1713
      tone: "ink",
      headline: "“Enough” is a destination.", // L4518
      body: "We finally let the cycle complete. Our margins stopped shrinking.", // L3313, L3319
      note: "In an open system, AI accelerates chaos. In a closed system, AI accelerates clarity.", // L4523
      cta: true,
    },
  ],
  bootloader: {
    kicker: "The SUSD Bootloader",
    headline: "This SUSD Bootloader changes how you operate.", // L4555
    body: "Then instead of asking AI a generic question like “Should I hire?” and getting generic advice, you can ask the same question inside the logic of this book.", // L244
    detail: "Tell it what's happening in the business. Ask whether you should hire. Tell it you're overwhelmed.", // L4545
    steps: [
      "Copy the prompt.",
      "Paste it into the AI assistant you already use.",
      "Answer the first question: How many people are on your team? Then talk to it normally.",
    ],
    button: "Copy the prompt",
    copied: "Copied. Now paste it into your AI.",
    notice: {
      title: "Read the use notice",
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
  },
  book: {
    kicker: "The book",
    headline: "You were never the problem. The model you inherited was.", // L216
    subtitle: "Revenue Up. Margins Down. How to Avoid the Scaling Trap.", // cover
    body: "This book is for the ones who felt the map was wrong but couldn't say why.", // L415
    why: {
      label: "About the free prompt",
      text: "You may be tempted to skip straight to it. I wouldn't. If you skip the questions that led to the system, it's easy to use a new system in the same old way. That's what the chapters are for.", // L246, L248, L250
    },
    proofTitle: "Two launches of Izabella's books",
    proof: [
      { label: "40 people", text: "Hashimoto's Protocol hit #1 on the New York Times. That launch consumed everything." }, // L3459
      { label: "12 people", text: "Adrenal Transformation Protocol reached the Publishers Weekly bestseller list. The team held." }, // L3461
    ],
    proofClose: "The contrast wasn't the ranking. The contrast was the cost.", // L3463
    parts: [
      { title: "Part I · Scaling Upside Down", text: "The diagnosis." },
      { title: "Part II · Scaling Up-Side-Down", text: "The cycle." },
      { title: "Part III · Scaling USD", text: "The moat, the middle, and the summit." },
    ],
    button: "Pre-order the book",
    soon: "Pre-orders open soon",
    author: "Michael Wentz co-founded the Thyroid Pharmacist and Rootcology brands, serving more than a million customers. He and his wife, Izabella, started at a kitchen table.",
  },
  footer: {
    kicker: "The first question",
    headline: "How many people are on your team?", // L4535
    body: "That number locates you on the map before anything else happens.", // L4541
    detail: "Not payroll headcount. The people you actually coordinate.", // L4537
  },
};

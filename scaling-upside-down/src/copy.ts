import notice from "./notice.json";
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
    copy: { kicker: string; headline: string; deck: string };
    after: { kicker: string; headline: string; line: string };
    block: {
      get: string;
      bootloader: string;
      sent: string;
      inbox: string;
      yours: string;
      words: string;
      sending: string;
      tryAgain: string;
      email: string;
      placeholder: string;
      badEmail: string;
      sendFailed: string;
      sentTo: string;
      notLive: string;
      appendix: string;
      names: Record<"copy" | "sent" | "yours" | "error" | "copyNoCount" | "sentNoCount" | "yoursNoCount" | "errorNoCount" | "busy", string>;
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
      deck: "The book changed how you think. This SUSD Bootloader changes how you operate.", // L4553, L4555
    },
    after: {
      kicker: "How to use it",
      headline: "Upload the file and use the starting prompt provided with it.", // L4531
      line: "Then let the system locate you.", // L4533
    },
    // the opt-in: the block's stamp, the email field and their messages are UI labels, not sentences
    block: {
      get: "Get it",
      bootloader: "The Bootloader",
      sent: "Sent",
      inbox: "Check inbox",
      yours: "Yours",
      words: "words",
      sending: "Sending",
      tryAgain: "Try again",
      email: "Email address",
      placeholder: "you@company.com",
      badEmail: "Enter your email address.",
      sendFailed: "Couldn't send. Download the file below.",
      sentTo: "Sent to {email}.",
      notLive: "Email delivery isn't connected yet, so the file is downloading now.",
      appendix: "Read the Appendix",
      // the button's accessible name begins with what its face says
      names: {
        copy: "Get it: the Bootloader, {n} words, by email",
        sent: "Sent: check inbox. Download the file",
        yours: "Yours: {n} words. Download the file again",
        error: "Get it, try again: the Bootloader, {n} words",
        copyNoCount: "Get it: the Bootloader, by email",
        sentNoCount: "Sent: check inbox. Download the file",
        yoursNoCount: "Yours: the Bootloader. Download the file again",
        errorNoCount: "Get it, try again: the Bootloader",
        busy: "Sending the Bootloader",
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
  notice, // the SUSD Bootloader Use Notice, L4557 on (src/notice.json, shared with the appendix page)
  footer: {
    line: "Up. Side. Down. Repeat.", // L1713
  },
};

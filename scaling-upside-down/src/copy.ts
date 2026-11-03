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
  hero: { kicker: string; title: string; sub: string; detail: string; join: string; free: string; cover: string };
  beats: Beat[];
  closed: {
    open: { kicker: string; headline: string };
    closing: { kicker: string; headline: string; detail: string };
    copy: { kicker: string; headline: string; deck: string; offer: string };
    after: { kicker: string; kickerSent: string; headline: string };
    block: {
      join: string;
      list: string;
      sent: string;
      inbox: string;
      joined: string;
      onList: string;
      sending: string;
      tryAgain: string;
      email: string;
      placeholder: string;
      badEmail: string;
      sendFailed: string;
      soon: string;
      sentTo: string;
      already: string;
      appendix: string;
      // the button's accessible name begins with what its face says
      names: Record<"join" | "sent" | "joined" | "error" | "busy", string>;
    };
    pair: { book: string; file: string };
    book: { kicker: string; quote: string; sign: string; title: string; body: string; soon: string; button: string; join: string };
  };
  notice: { title: string; paragraphs: string[] };
  footer: { line: string };
};

// The back cover (the manuscript's last picture) is Michael's own copy for the book: its lines are
// quoted whole, like the manuscript's, and so is the cover's subtitle.
export const COPY: SiteCopy = {
  hero: {
    kicker: "A book by Michael Wentz · For bootstrapped founders",
    title: "Scaling\nUp-Side-Down",
    sub: "Revenue Up. Margins Down. How to Avoid the Scaling Trap.", // the cover's subtitle
    detail: "This book is for the ones who felt the map was wrong but couldn't say why.", // L415 (1st sentence)
    join: "Join the first-edition list",
    free: "Comes with the SUSD Bootloader, free",
    cover: "The hardcover of Scaling Up-Side-Down by Michael Wentz, with the Up, Side and Down blocks stacked on its cover. Revenue Up. Margins Down. How to Avoid the Scaling Trap.",
  },
  // One idea per scroll moment, and the picture does most of the telling. Phones show the kicker
  // and headline only (and the last beat's detail, the cycle's point); desktop adds the one detail line.
  beats: [
    {
      id: "grow",
      at: [0.05, 0.145],
      kicker: "Our best quarter ever", // L968 (the chapter's title, L464)
      tone: "up",
      headline: "Always launching. Always hiring. Always adding.", // L1993
      detail: "But inside, nothing ever settled.", // L1995
    },
    {
      id: "redline",
      at: [0.155, 0.23],
      kicker: "Twelve to forty people", // L3562
      tone: "down",
      headline: "Revenue was growing—sometimes faster than ever—but the bank account didn't feel it.", // L1070
      detail: "Margins were shrinking. And the founder had become the bottleneck on everything.", // L1070
    },
    {
      id: "collapse",
      at: [0.24, 0.335],
      kicker: "That isn't scaling.", // the back cover
      tone: "down",
      headline: "That's scaling upside down.", // the back cover
    },
    {
      id: "side",
      at: [0.39, 0.548],
      kicker: "Scaling Sideways", // L1716
      tone: "side",
      headline: "Sideways for stabilization.", // L3316
    },
    {
      id: "down",
      at: [0.555, 0.612],
      kicker: "Scaling Down", // L1717
      tone: "down",
      headline: "Down for pruning.", // L3317
      detail: "The business stops asking for more and starts asking what to keep.", // L2564
    },
    {
      id: "up",
      at: [0.62, 0.845],
      kicker: "Scaling Up", // L1715
      tone: "up",
      headline: "Up for growth.", // L3315
    },
    {
      id: "repeat",
      at: [0.905, 0.995],
      kicker: "Up. Side. Down. Repeat.", // L1713
      tone: "ink",
      headline: "You're already doing all three.", // L1728
      detail: "The problem is you're doing them at once—every day, no rhythm, no separation.", // L1728
    },
  ],
  // After the story: the closed loop. Seen from above, the pile keeps growing, is swept off the table
  // and the twelve systems are set down around Up / Side / Down; joining the list closes the ring. Then
  // the camera travels along the table to the book.
  closed: {
    open: {
      kicker: "Always adding",
      headline: "Complexity that accumulated faster than the structure could hold.", // L2021
    },
    closing: {
      kicker: "Twelve systems",
      headline: "Systems were what actually held the weight.", // L2408
      detail: "The twelve we'd mapped were enough.", // L2610
    },
    copy: {
      kicker: "The book",
      headline: "You were never the problem. The model you inherited was.", // L216
      deck: "In Scaling Up-Side-Down, entrepreneur Michael Wentz reveals the hidden physics that trap most bootstrapped companies.", // the back cover
      offer: "Join the list for the first edition · the SUSD Bootloader comes free, by email",
    },
    after: {
      kicker: "You're on the list",
      kickerSent: "Check your inbox",
      headline: "The cycle isn't something you install. It's something you stop resisting.", // L1734
    },
    // the sign-up: the block's stamp, the email field and their messages are UI labels, not sentences
    block: {
      join: "Join",
      list: "The list",
      sent: "Sent",
      inbox: "Check inbox",
      joined: "Joined",
      onList: "On the list",
      sending: "Sending",
      tryAgain: "Try again",
      email: "Email address",
      placeholder: "you@company.com",
      badEmail: "Enter a valid email address.",
      sendFailed: "Couldn't send. Try again.",
      soon: "The list opens soon.",
      sentTo: "Sent to {email}. Check your inbox.",
      already: "You're already on the list. The SUSD Bootloader came with your welcome email.",
      appendix: "Read the Appendix",
      names: {
        join: "Join the list for the first edition, with the SUSD Bootloader free by email",
        sent: "Sent: check your inbox",
        joined: "Joined: you're already on the list",
        error: "Join, try again",
        busy: "Sending: joining the list",
      },
    },
    // under the book and the ring as the camera passes them
    pair: {
      book: "The book",
      file: "Its appendix: the SUSD Bootloader",
    },
    book: {
      kicker: "The book",
      quote: "You may be tempted to skip straight to it. I wouldn't.", // L246
      sign: "— Michael", // L4463
      title: "Scaling Up-Side-Down",
      body: "Part diagnosis, part operating system, this book offers founders a practical way to build businesses that grow without collapsing under their own weight.", // the back cover
      soon: "Pre-orders open soon",
      button: "Pre-order the book",
      join: "Join the first-edition list",
    },
  },
  notice, // the SUSD Bootloader Use Notice, L4557 on (src/notice.json, shared with the appendix page)
  footer: {
    line: "Up. Side. Down. Repeat.", // L1713
  },
};

// The focus version's lines (/focus): one beside the still picture at a time. The film's planks carry
// L1993 ("Always launching. Always hiring. Always adding."), so the words start where the blocks stop.
export type FocusLine = { kicker?: string; tone: "up" | "side" | "down" | "ink"; headline: string; detail?: string; big?: boolean };
export const FOCUS_COPY: Record<string, FocusLine> = {
  grow: { kicker: "Our best quarter ever", tone: "up", headline: "But inside, nothing ever settled." }, // L968 (kicker), L1995
  redline: { kicker: "Twelve to forty people", tone: "down", headline: "Revenue was growing—sometimes faster than ever—but the bank account didn't feel it." }, // L3562 (kicker), L1070
  isnt: { tone: "down", headline: "That isn't scaling.", big: true }, // the back cover
  upside: { tone: "down", headline: "That's scaling upside down.", big: true }, // the back cover
  side: { kicker: "Scaling Sideways", tone: "side", headline: "Sideways for stabilization." }, // L1716, L3316
  down: { kicker: "Scaling Down", tone: "down", headline: "Down for pruning." }, // L1717, L3317
  up: { kicker: "Scaling Up", tone: "up", headline: "Up for growth." }, // L1715, L3315
  repeat: { kicker: "Up. Side. Down. Repeat.", tone: "ink", headline: "You're already doing all three.", detail: "The problem is you're doing them at once—every day, no rhythm, no separation." }, // L1713, L1728
};

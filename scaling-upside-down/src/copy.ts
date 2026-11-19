import notice from "./notice.json";
// Every word on the home page, in one file, so Michael can change the copy himself.
//
// House rule: every sentence is Michael's own, word for word from the manuscript (line numbers in the
// comments) or from the book's covers (the cover's subtitle, the back cover's copy). Only labels, buttons
// and status messages are not quoted. To change a line, change it here and push: the site rebuilds itself.

export type Phase = { key: "up" | "side" | "down"; word: string; kicker: string; line: string; detail?: string };

export const COPY = {
  hero: {
    title: "Scaling Up-Side-Down",
    byline: "A book by Michael Wentz", // label
    reader: "For bootstrapped founders", // label
    // the cover's subtitle, set in three pieces
    up: "Revenue Up.",
    down: "Margins Down.",
    trap: "How to Avoid the Scaling Trap.",
    join: "Join the first-edition list", // button
    free: "Comes with the SUSD Bootloader, free", // label
    cover:
      "The hardcover of Scaling Up-Side-Down by Michael Wentz: the Up, Side and Down blocks stacked beside the word Scaling. Revenue Up. Margins Down. How to Avoid the Scaling Trap.",
  },

  // the problem, in the founder's own words
  problem: {
    kicker: "Our best quarter ever", // L968 (the chapter's title, L464)
    always: ["Always launching.", "Always hiring.", "Always adding."], // L1993
    settled: "But inside, nothing ever settled.", // L1995
    revenue: "Revenue was growing—sometimes faster than ever—but the bank account didn't feel it.", // L1070
    margins: "Margins were shrinking. And the founder had become the bottleneck on everything.", // L1070
    complexity: "Complexity that accumulated faster than the structure could hold.", // L2021
    isnt: "That isn't scaling.", // the back cover
    is: ["That's scaling", "upside down."], // the back cover: "That's scaling upside down."
    filmAlt:
      "A tower of blocks: the book's Up, Side and Down at the bottom, planks reading Always launching, Always hiring and Always adding on top of them, and more and more blocks piled on until the tower bends and falls.",
    pileAlt: "Seen from above, the Up, Side and Down blocks buried under a pile of others: SOPs, meetings, 43 apps, AI tools, a new SKU.",
  },

  // the idea, without the whole framework
  cycle: {
    kicker: "Up. Side. Down. Repeat.", // L1713
    phases: [
      { key: "up", word: "Up", kicker: "Scaling Up", line: "Up for growth." }, // L1715, L3315
      { key: "side", word: "Side", kicker: "Scaling Sideways", line: "Sideways for stabilization." }, // L1716, L3316
      {
        key: "down",
        word: "Down",
        kicker: "Scaling Down",
        line: "Down for pruning.", // L1717, L3317
        detail: "The business stops asking for more and starts asking what to keep.", // L2564
      },
    ] as Phase[],
    all: "You're already doing all three.", // L1728
    once: "The problem is you're doing them at once—every day, no rhythm, no separation.", // L1728
    stackAlt: "The Up, Side and Down blocks, side by side, seen from above.",
  },

  // the book
  book: {
    kicker: "The book", // label
    never: ["You were never the problem.", "The model you inherited was."], // L216
    deck: "In Scaling Up-Side-Down, entrepreneur Michael Wentz reveals the hidden physics that trap most bootstrapped companies.", // the back cover
    body: "Part diagnosis, part operating system, this book offers founders a practical way to build businesses that grow without collapsing under their own weight.", // the back cover
    map: "This book is for the ones who felt the map was wrong but couldn't say why.", // L415 (1st sentence)
    soon: "Pre-orders open soon", // label
    preorder: "Pre-order the book", // button
  },

  // the one sign-up: the first-edition list, and the SUSD Bootloader comes free by email
  join: {
    title: "Join the first-edition list", // label
    offer: "Join the list for the first edition · the SUSD Bootloader comes free, by email", // label
    // about the appendix (the Bootloader): Michael, in the book
    quote: "You may be tempted to skip straight to it. I wouldn't.", // L246
    sign: "— Michael", // L4463
    appendix: "Read the Appendix", // link
    notice: "Use notice", // link
    // the form: labels and status messages
    email: "Email address",
    placeholder: "you@company.com",
    button: "Join the list",
    sending: "Sending",
    badEmail: "Enter a valid email address.",
    sendFailed: "Couldn't send. Try again.",
    soon: "The list opens soon.",
    sentTo: "Sent to {email}. Check your inbox.",
    already: "You're already on the list. The SUSD Bootloader came with your welcome email.",
  },

  footer: {
    line: "Up. Side. Down. Repeat.", // L1713
    owner: "Michael Wentz",
    top: "Back to the top",
  },

  notice, // the SUSD Bootloader Use Notice, L4557 on (src/notice.json, shared with the appendix page)
};

export type SiteCopy = typeof COPY;

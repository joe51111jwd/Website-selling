// The book page's words and numbers (src/components/BookPage.tsx). The house rule holds: every sentence is
// Michael's, word for word, with its manuscript line (the covers count); the short labels on the diagrams,
// the menu and the buttons are the only words that are not.

/** Chapter 17's exhibit, "the margin inversion": what each round of hiring does. Only his values. */
export const YEARS = [
  { year: "Year 0", team: 12, revenue: "$3M", revenueM: 3, margin: "20%", marginPct: 20, take: "$900K", takeK: 900, lines: 66 },
  { year: "Year 1", team: 15, revenue: "$3.5M", revenueM: 3.5, margin: "14%", marginPct: 14, take: "$400K", takeK: 400, lines: 105 },
  { year: "Year 2", team: 20, revenue: "$4M", revenueM: 4, margin: "10%", marginPct: 10, take: "$250K", takeK: 250, lines: 190 },
  { year: "Year 3", team: 25, revenue: "$4.2M", revenueM: 4.2, margin: "5%", marginPct: 5, take: "$150K", takeK: 150, lines: 300 },
];

/** the twelve systems, four to a phase, in the cycle's order (the names as stamped on the blocks) */
export const SYSTEMS = [
  { tone: "up", phase: "Up", items: ["Content & Product", "Lead Gen", "Conversion", "Retention"] },
  { tone: "side", phase: "Side", items: ["Team & Roles", "Systematize", "Tech & AI", "Fulfillment"] },
  { tone: "down", phase: "Down", items: ["Profit", "Risk", "Efficiency", "Quality"] },
];

export const BOOK_COPY = {
  nav: { appendix: "The appendix", join: "Join the list" },
  cue: "Scroll to open the book",
  running: { title: "Scaling Up-Side-Down", author: "Michael Wentz" },
  grow: {
    kicker: "Our best quarter ever", // L968
    headline: "Always launching. Always hiring. Always adding.", // L1993
    body: "But inside, nothing ever settled.", // L1995
  },
  inversion: {
    title: "Revenue Up. Margins Down.", // the cover
    revenue: "Revenue",
    margin: "Margin",
    take: "Owner take",
    caption: "Revenue was growing—sometimes faster than ever—but the bank account didn't feel it.", // L1070
    alt: "Three charts over four years, as the team goes from 12 to 25 people. Revenue rises from $3M to $4.2M. Margin falls from 20% to 5%. Owner take falls from $900K to $150K.",
  },
  pathways: {
    kicker: "Twelve to forty people", // L3562
    headline: "Margins were shrinking. And the founder had become the bottleneck on everything.", // L1070
    team: "People",
    lines: "Coordination pathways",
    alt: "A team drawn as dots with a line between every pair. Twelve people make 66 coordination pathways; fifteen make 105; twenty make 190; twenty-five make 300.",
  },
  upside: {
    a: "That isn't scaling.", // the back cover
    b: "That's scaling upside down.", // the back cover
  },
  cycle: {
    kicker: "Up. Side. Down. Repeat.", // L1713
    headline: "You're already doing all three.", // L1728
    body: "The problem is you're doing them at once—every day, no rhythm, no separation.", // L1728
    trap: "The scaling trap",
    // Michael's order (23 Nov): Up first, then Side, then Down
    steps: [
      { tone: "up", line: "Up for growth." }, // L3315
      { tone: "side", line: "Sideways for stabilization." }, // L3316
      { tone: "down", line: "Down for pruning." }, // L3317
    ],
    alt: "A line that climbs in steps: up, then level, then a little down, three times over, ending higher each time. Behind it a dashed line, the scaling trap, shoots up once and falls back to nothing.",
  },
  systems: {
    kicker: "Twelve systems",
    headline: "Systems were what actually held the weight.", // L2408
    body: "The twelve we'd mapped were enough.", // L2610
    caption: "The cycle isn't something you install. It's something you stop resisting.", // L1734
  },
};

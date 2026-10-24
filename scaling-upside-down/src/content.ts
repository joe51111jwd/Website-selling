/*
  Every word on the page lives here, so Michael's edits are one file.
  Draft copy: written from the Oct 21 discovery call. Swap in lines from the manuscript once we have it.
*/

export const media = (name: string, small = false) => `${import.meta.env.BASE_URL}media/${name}${small ? "-sm" : ""}.jpg`;

export const book = {
  title: "Scaling Upside Down",
  author: "Michael",
  cta: "Pre-order",
  freeCta: "Get the free bootloader",
};

export const hero = {
  eyebrow: "Scaling Upside Down",
  intro: "Every growth playbook sells you the tower.",
  headline: "Build the house.",
  sub: "The growth book for the other 97% of founders. With a bootloader your AI can run.",
  note: "The tower was only ever a reflection.",
};

export type Highlight = {
  id: string;
  image?: string;
  lines: [string, string];
  tone: "light" | "dark";
  position?: string;
};

export const highlights: Highlight[] = [
  { id: "97", image: "towers", lines: ["Most growth advice fits 3% of companies.", "This book is for the other 97%."], tone: "light", position: "50% 70%" },
  { id: "iceberg", image: "iceberg", lines: ["Revenue is the tip.", "Complexity is everything under it."], tone: "light", position: "50% 40%" },
  { id: "twelve", image: "table", lines: ["A team of twelve.", "Everyone within reach."], tone: "light", position: "50% 60%" },
  { id: "1972", image: "journal", lines: ["The growth model you were taught", "was written in 1972."], tone: "light", position: "50% 50%" },
  { id: "boot", lines: ["Software as a book.", "Load it into your AI."], tone: "light" },
];

export const views = [
  { id: "front", label: "Front cover" },
  { id: "spine", label: "Spine" },
  { id: "open", label: "Open" },
  { id: "back", label: "Back cover" },
] as const;
export type View = (typeof views)[number]["id"];

export const problem = {
  eyebrow: "The scaling trap",
  headline: "Built for the 3%.",
  body: [
    ["Most growth advice traces back to ", "a 1972 Harvard paper", " written for capital-heavy companies. Today you rent scale instead: contractors, subscriptions, software, and now AI."],
    ["That makes it easy to add complexity ", "faster than your team can absorb it", ". Revenue stalls, the founder burns out, and the usual advice says to hire more."],
  ],
  callouts: [
    { big: "3%", small: "of companies are true scale-ups, with the capital and moat to match" },
    { big: "1972", small: "the year the growth curve in every MBA was drawn" },
    { big: "97%", small: "of founders it was never written for" },
  ],
};

export const model = {
  eyebrow: "The model",
  headline: "Up. Sideways. Down. Up.",
  steps: [
    { id: "up", tab: "Scale up", images: ["topo"], lead: "Scale up.", text: "Grow while the team can still absorb what you add." },
    { id: "sideways", tab: "Scale sideways", images: ["houses"], lead: "Scale sideways.", text: "Hold revenue steady and turn everything you added into systems." },
    { id: "down", tab: "Scale down", images: ["bonsai-wild", "bonsai"], lead: "Scale down.", text: "Prune the offers, tools and roles that crept in. Simpler runs faster." },
    { id: "again", tab: "Grow again", images: ["ring", "helix"], lead: "Grow again.", text: "From a smaller, stronger base. Each cycle starts higher than the last." },
  ],
};

export const inversions = {
  headline: "Six things the book turns upside down.",
  cards: [
    { was: "Revenue is the goal.", is: "Systems are the goal.", text: "Revenue is what a good system produces." },
    { was: "Hire for the title.", is: "Let the work reveal the role.", text: "Hire when the work shows you who is missing." },
    { was: "The market is why you’re stuck.", is: "Complexity is why you’re stuck.", text: "Most plateaus are built from the inside." },
    { was: "Always be growing.", is: "Grow in cycles.", text: "Up, sideways, down, then up again." },
    { was: "Bigger team, bigger company.", is: "Stop at twelve.", text: "Past twelve you need a moat, or you’re in the trap." },
    { was: "AI will do the work.", is: "AI makes output cheap.", text: "Review and judgment stay expensive." },
  ],
};

export const bootloader = {
  eyebrow: "The bootloader",
  headline: "Software as a book.",
  body: [
    "The appendix is a ",
    "35,000-word spec written for AI",
    ". Load it into Claude or ChatGPT and ask about your company. It answers ",
    "inside the book’s framework",
    ", with its floors, ceilings and routing rules.",
  ],
  stats: [
    { label: "Length", value: "35,000 words" },
    { label: "Size", value: "≈47,000 tokens" },
    { label: "Works with", value: "Claude, ChatGPT" },
    { label: "Price", value: "Free" },
  ],
  // sample runs, written to show the routing idea; replace with real outputs from the file
  runs: [
    {
      chip: "Flat for three quarters",
      q: "We’re 9 people and revenue has been flat for three quarters. Should we hire a head of ops?",
      route: "Diagnose · Complexity",
      a: [
        ["You’re under the ", "ceiling of 12", ", so headcount is unlikely to be the constraint. At your size a plateau usually means complexity was added faster than the team absorbed it."],
        ["Before hiring by title, list the work that fell through this month and what you added in the last year. ", "Let the work show which role is missing", ", if any."],
      ],
      next: "Next: scale sideways. Systems before seats.",
    },
    {
      chip: "Solo and drowning",
      q: "It’s me and two contractors. I’m working 70-hour weeks. Do I need to scale up?",
      route: "Floor · Solopreneur",
      a: [
        ["You’re near the ", "floor of 1", ". Contractors and software raise output, and they also raise what you have to review."],
        ["Count the hours you spend reviewing and fixing, not producing. ", "That is the real load", "."],
      ],
      next: "Next: scale down. Cut one offer or one tool first.",
    },
    {
      chip: "AI made us faster",
      q: "AI tripled our output but quality dropped. What’s going on?",
      route: "Guardrail · Review cost",
      a: [
        ["AI makes output cheap. ", "Review, judgment and discernment stay expensive", ". Three times the output is three times the review, landing on the same few people."],
        ["Find out who reviews AI output today and how many hours it takes them each week."],
      ],
      next: "Next: set a review budget before raising volume.",
    },
  ],
};

export const numbers = {
  headline: "Three numbers. One framework.",
  stats: [
    { n: "1", label: "Solopreneur floor", text: "Where every company starts." },
    { n: "12", label: "Team ceiling", text: "Where most companies should stop." },
    { n: "40–70", label: "Team of teams", text: "Only with a real moat." },
  ],
  lines: {
    headline: "Every hire adds more than one person.",
    body: ["Twelve people share ", "66 lines", " of communication. Forty-eight share ", "1,128", ". Drag to size your team."],
  },
};

export const products = {
  headline: "Read it. Then run it.",
  book: { name: "The book", meta: "Hardcover · 2026", text: "The full argument, from diagnosis to the cycle.", link: "Pre-order" },
  file: { name: "The bootloader", meta: "Markdown · v1.0 · Free", text: "The appendix as a file your AI can load. Updated as it improves.", link: "Get it free" },
};

export const author = {
  eyebrow: "About the author",
  headline: "Twelve years bootstrapping. Nine on Wall Street.",
  body: "Michael spent nine years in institutional equity research at Morningstar, studying which companies build lasting moats. He has spent the twelve years since bootstrapping his own. He lives in Austin.",
};

export const faq = [
  {
    q: "Who is Scaling Upside Down for?",
    a: "Founders of bootstrapped companies, especially teams of around eight to twelve who have felt growth stall and want a model that doesn’t require becoming a 100-person company.",
  },
  {
    q: "What is the bootloader?",
    a: "The book’s appendix: a 35,000-word Markdown file written for AI to read. Load it into Claude or ChatGPT and it answers your questions inside the book’s framework instead of drifting into generic advice.",
  },
  { q: "Is the bootloader free?", a: "Yes. Enter your email to download it, and you’ll get each new version as the file improves." },
  {
    q: "Why twelve?",
    a: "Up to about twelve people, everyone can still work with everyone. Past that, complexity grows faster than headcount, and without a moat that is the scaling trap.",
  },
  {
    q: "Does that mean I should never grow past twelve?",
    a: "No. The book has a range for a team of teams, 40 to 70 people. Most companies don’t need it. The ones with a real moat might.",
  },
  { q: "When does the book come out?", a: "Michael is aiming for the end of 2026. Pre-order to get it the day it ships." },
];

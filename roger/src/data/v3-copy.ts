// Every line of public v3 copy lives here (spec A.14). Peter edits before launch.
// Rules: no em dashes or en dashes. No hype, no exclamation marks. "AI agent" in full
// on every page except /agents and /zack.

export const trialLine =
  "Your first two Monday lists are free. We ask for a card when you start. On monthly it is charged with your third list. On one at a time it is charged only when you order a list. Cancel before then and you pay nothing.";
export const cardLine = "Card required. Charged only with your third list.";
export const ctaLong = "Get two free Monday lists";
export const ctaShort = "Start free";

export const home = {
  headline: "Your AI agents, smarter every Monday.",
  sub: "Roger makes your AI agents smarter every week, with ideas that worked for other real estate users.",
  loop: [
    { when: "Sunday", what: "Zack reviews your week" },
    { when: "Overnight", what: "Cora reads what worked for everyone" },
    { when: "Monday 7:00 AM", what: "Three ideas arrive" },
  ],
  problem: [
    "Everyone in real estate is being told to use AI. Almost nobody is told what to use it for.",
    "The people getting real work out of AI agents rarely post how. It involves their clients and their business.",
    "So each person works out the same things alone, a few months apart.",
  ],
  howTitle: "How it works",
  steps: [
    {
      title: "Set up your AI agents",
      body: "If you don't have any, our starter team takes about half an hour to install.",
    },
    {
      title: "Zack reviews your week",
      body: "Each Sunday, an AI agent called Zack reviews your week and writes up what worked, with client details removed.",
    },
    {
      title: "Cora picks your three ideas",
      body: "Early Monday, Cora reads what worked for everyone and picks the three ideas that fit you best.",
    },
    {
      title: "Paste to install",
      body: "Open one, press copy, paste it into your AI agent. It sets itself up and asks you what it needs to know.",
    },
  ],
  mondayTitle: "What arrives on Monday",
  mondayLine: "This is one Monday list, as it arrives. Open an idea.",
  compoundsTitle: "It compounds",
  compounds:
    "Three ideas a week. Each one you set up stays set up. Six months in, your AI agents do things you would not have thought to ask for.",
  letterLead: "Roger is run by Peter Kuperman.",
  closing: "See what your first two Mondays bring.",
};

export const agents = {
  headline: "Stop figuring out AI agents alone.",
  sub: "Every Monday, Roger sends you the three plays most worth installing, drawn from what other heavy users ran last week.",
  stripTitle: "Works with every agent",
  stripLine: "Zack files for Claude, Duet, Grok Bot and Hark. Any other agent adapts one with a single prompt.",
  problem: [
    "The most useful things people do with agents never get posted. They involve clients, money, and how the business runs.",
    "What gets posted is the highlight reel, never the playbook.",
    "So you work out alone what someone else solved last month.",
  ],
  steps: [
    {
      title: "Add Zack",
      body: "Add Zack to your agent. He reviews your past seven days and writes up your best plays, with identities removed.",
    },
    {
      title: "Cora picks your three",
      body: "Cora scores every play in the pool on hours saved, reach, ease to copy, proof and surprise, then picks the three that fit your work and that you don't already run.",
    },
    {
      title: "Paste to install",
      body: "Each idea comes with a full playbook. Paste it into your agent and it adapts itself to your setup.",
    },
  ],
  closing: "Find out what other heavy users know.",
};

export const control = {
  title: "You decide what Zack shares.",
  points: [
    { lead: "Read every line.", body: "The exact instructions your Zack runs are in your dashboard." },
    {
      lead: "Set your own rules.",
      body: "Skip whole subjects, block names and words, or add rules in your own words.",
    },
    {
      lead: "Turn sharing off any time in your dashboard.",
      body: "On monthly your ideas keep coming and the price becomes US$400 a month.",
    },
  ],
  link: "How Zack works",
};

// The approved letter still mentions Circles. Until Peter sends the v3 edit, only the
// paragraphs that are still true are shown (spec A.10).
export const letter = {
  greeting: "Hey there,",
  paragraphs: [
    "I'm Peter Kuperman. I run AI agents every day, including my own AI chief of staff, and I deploy them inside companies for a living.",
    "Here is what I kept noticing. The most useful things people do with AI agents never get posted. They involve clients, money and how the business actually runs. What does get posted is the highlight reel. So everyone works out the same things alone, a few months apart.",
  ],
  byline: "Peter Kuperman · 17 years in real estate finance, then software and AI · Finance and computer science, Penn",
};

export const pricing = {
  title: "Two free Monday lists. Then pick how you pay.",
  included: [
    "Three ideas every Monday, each with a full playbook",
    "Your own history of every idea you have received",
    "Your Zack controls",
    "A compounding view of what you have set up",
  ],
  includedSession: "The weekly group session",
  monthly: "Three ideas every Monday. Charged once a month, starting with your third list.",
  single: "Order a list for any Monday you want one. You are charged only for the lists you order.",
  same: "Two lists one at a time cost the same as a whole month.",
  contributing:
    "Roger works because everyone's Zack contributes. On monthly, if Zack misses a week, the first miss each month is forgiven. A second miss makes that month US$400. We email you both times, and the difference appears on your next invoice. If you switch sharing off in your dashboard, the monthly price is US$400. One-at-a-time lists need that week's Zack report.",
  refunds: "There are no refunds. You get two free lists before any charge, and you can cancel in one click.",
};

export const libraryBand = "This is what people post in public. Roger sends you what works in private.";

export const zackPasteWarning =
  "Check your report for client names or private details before pasting. It is read by Roger's team and by Cora, Roger's ranking agent, and is never published.";

export type FaqGroup = "Getting started" | "Zack and privacy" | "Cora and the ideas" | "Price and billing";
export type FaqAudience = "home" | "agents";
export type Faq = { q: string; a: string; group: FaqGroup; on: FaqAudience[] };

export const faqs: Faq[] = [
  {
    group: "Getting started",
    on: ["home"],
    q: "I don't use AI agents yet. Can I start?",
    a: "Yes. The startup page walks you through installing one and setting up a starter team for real estate. Most people finish in about half an hour.",
  },
  {
    group: "Getting started",
    on: ["agents"],
    q: "Which AI agents does Roger work with?",
    a: "Every AI agent. Zack has ready-made files for Claude, Duet, Grok Bot and Hark. On any other, one prompt adapts him, or you can upload his report yourself.",
  },
  {
    group: "Getting started",
    on: ["home"],
    q: "What do I have to do each week?",
    a: "Open your three ideas on Monday and set up the ones you want. Zack runs on his own on Sunday.",
  },
  {
    group: "Zack and privacy",
    on: ["agents"],
    q: "What does Zack read?",
    a: "Only your own activity inside your AI agent account, from the past seven days. He does not read your email, calendar or files.",
  },
  {
    group: "Zack and privacy",
    on: ["home", "agents"],
    q: "What leaves my account?",
    a: "Zack's weekly report: a write-up of your most useful plays with names, clients, addresses, amounts and other private details replaced by placeholders. You agree to this when you sign up, and you can turn it off.",
  },
  {
    group: "Zack and privacy",
    on: ["agents"],
    q: "Can I see and change what Zack does?",
    a: "Yes. Your dashboard shows the exact instructions your Zack runs. You can tell him to skip whole subjects, block specific words and names, share an outline only, or follow rules you write yourself.",
  },
  {
    group: "Zack and privacy",
    on: [],
    q: "Who sees my plays?",
    a: "Other Roger users, without your name or anything that identifies you. A play is described as 'run by 3 users', never as yours.",
  },
  {
    group: "Zack and privacy",
    on: ["agents"],
    q: "I compete with other people on Roger. What if I don't want to share?",
    a: "You decide exactly what Zack shares, down to skipping whole subjects and blocking names. If you switch sharing off completely in your dashboard, monthly still brings three ideas every Monday and costs US$400 a month.",
  },
  {
    group: "Zack and privacy",
    on: [],
    q: "Can I delete what I've sent?",
    a: "Yes. You can delete any weekly report from your dashboard.",
  },
  {
    group: "Cora and the ideas",
    on: ["home"],
    q: "How are my three ideas chosen?",
    a: "Cora scores every play on hours saved, reach, ease to copy, proof and surprise, then matches plays to the kind of work your own week shows. She never sends something you already run.",
  },
  {
    group: "Cora and the ideas",
    on: [],
    q: "What if an idea doesn't fit me?",
    a: "Paste it into your AI agent anyway and ask how it would apply to you. Every playbook starts by telling your AI agent to adapt it to your setup.",
  },
  {
    group: "Cora and the ideas",
    on: ["agents"],
    q: "Will an idea work on my AI agent if it came from a different one?",
    a: "Yes. Your own AI agent rewrites the playbook for itself before installing it.",
  },
  {
    group: "Price and billing",
    on: ["agents"],
    q: "What does it cost?",
    a: "US$200 a month, or US$100 for one list at a time, plus tax where it applies. In Canada it is CA$280 a month or CA$140 a list, plus HST.",
  },
  {
    group: "Price and billing",
    on: ["home", "agents"],
    q: "When is my card charged?",
    a: "On monthly, with your third Monday list and not before. On one at a time, only when you order a list. Your first two lists are free either way, and we email you after your second list with what happens next.",
  },
  {
    group: "Price and billing",
    on: [],
    q: "Why do you need a card for a free trial?",
    a: "So that nothing changes on your third Monday. If you don't want to continue, cancel in one click before then and you pay nothing.",
  },
  {
    group: "Price and billing",
    on: [],
    q: "What if Zack misses a week?",
    a: "On monthly, the first miss each month is forgiven. A second miss makes that month US$400. We email you both times.",
  },
  {
    group: "Price and billing",
    on: ["home"],
    q: "Can I get a refund?",
    a: "No. You get two free lists before any charge, and you can cancel any time.",
  },
  {
    group: "Price and billing",
    on: [],
    q: "Can I buy one list at a time?",
    a: "Yes. It is US$100 a list, ordered whenever you want one. Monthly costs less if you want a list most weeks.",
  },
];

export const faqGroups: FaqGroup[] = ["Getting started", "Zack and privacy", "Cora and the ideas", "Price and billing"];

// Testimonials are read from the `testimonials` table where `cleared` is true.
// None are cleared, so the section is absent. Never add a quote here by hand.
export type Testimonial = { quote: string; name: string; audience: "re" | "agents" | "both"; position: number };
export const clearedTestimonials: Testimonial[] = [];

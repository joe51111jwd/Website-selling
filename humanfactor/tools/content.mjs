// Every fact on the HumanFactor site, with its source. tools/pages.mjs turns this into pages.
// Sources, read 2026-11-05:
//   [SR]   stakeholderrisk.com: home, /about, /team, /stakeholder-risk, /frameworks/humanfactor-index,
//          /life-sciences, /insights, /request-briefing (vtstrategies.com redirects there)
//   [HFI]  humanfactorindex.com
// CONFIRM marks a fact that differs between their own pages, or our reading of one. README lists them all.

export const SITE = {
  url: "https://stakeholderrisk.com", // CONFIRM: the domain this site replaces
  name: "HumanFactor",
  legal: "HumanFactor Enterprises",
  tagline: "Stakeholder Risk Intelligence™",
};

// [SR] homepage FAQ. CONFIRM: /stakeholder-risk and /life-sciences each word the definition differently.
export const definition =
  "Stakeholder Risk is the category of risk embedded in leadership dynamics, governance gaps, incentive misalignment and decision architecture: the human system beneath every financial model.";

export const stats = [
  { n: 4.2, pre: "$", suf: "B+", dp: 1, label: "Enterprise value impacted" },
  { n: 3000, suf: "+", label: "Stakeholder debriefs delivered" }, // CONFIRM: /life-sciences says 500+
  { n: 25, suf: "+", label: "Industries served" }, // CONFIRM: 20+ and 15+ elsewhere
  { n: 350000, suf: "+", label: "Leaders in the benchmark database" },
];
export const DISCLAIMER =
  "Enterprise value figures, valuation increases and exit multiples reflect outcomes from specific engagements and are not representative, typical or guaranteed.";

// [HFI] The four diagnostics and the illustrative composite.
// CONFIRM: 68.4 is not the simple average of the four (65.75); the weighting is not published.
export const composite = 68.4;
export const diagnostics = [
  { code: "LIR", name: "Leadership Identity Risk", score: 72, line: "Is the company bigger than the person leading it?" },
  { code: "ASR", name: "Authority Structure Risk", score: 64, line: "Does the org chart match who actually decides?" },
  { code: "DAR", name: "Decision Architecture Risk", score: 69, line: "Are hard calls made the same way twice?" },
  { code: "SAR", name: "Stakeholder Alignment Risk", score: 58, line: "Do the people at the table want the same outcome?" },
];

// [SR /stakeholder-risk] What it measures.
export const dimensions = [
  { name: "Leadership dynamics", text: "How power is distributed, exercised and contested among key decision-makers." },
  { name: "Governance architecture", text: "The structures that decide how decisions get made and where accountability lives." },
  { name: "Incentive alignment", text: "Whether founders, management, sponsors and boards want the same thing, or quietly don’t." },
  { name: "Decision systems", text: "How critical choices are evaluated, escalated and executed." },
  { name: "Stakeholder power mapping", text: "The six types of stakeholder power, and how they speed up or block value creation." },
  { name: "Identity and influence", text: "How leaders define themselves, yield authority and shape the culture around them." },
];

// [HFI] Twelve risks the index tracks.
export const twelve = [
  "Leadership identity", "Authority structure", "Decision architecture", "Stakeholder alignment",
  "Governance complexity", "Data and reporting silos", "Accountability systems", "Talent leverage",
  "Knowledge concentration", "Investor narrative", "Leadership transition", "Exit readiness",
];

// [HFI] Each generation of capital needed a new measurement standard.
export const lineage = [
  { year: "1993", name: "VIX", what: "Market volatility" },
  { year: "2003", name: "Credit ratings", what: "Default risk, standardized" },
  { year: "2009", name: "ESG indices", what: "Sustainability exposure" },
  { year: "2016", name: "Governance scores", what: "Board and control quality" },
  { year: "2026", name: "HumanFactor Index™", what: "Stakeholder Risk", us: true },
];

// [SR] home. CONFIRM: /stakeholder-risk says "five proprietary frameworks"; the home page lists six.
export const frameworks = [
  { verb: "Extract", name: "HumanFactor Analysis™", text: "The foundation. Maps the human system behind the company into a Living Blueprint™: who decides, who they answer to, and what they are paid to want.", time: "10–90 days" },
  { verb: "Measure", name: "HumanFactor Index™", text: "Turns the Blueprint into a quantified Stakeholder Risk score, benchmarked the way the VIX benchmarks volatility.", time: "Benchmarked" },
  { verb: "Test", name: "Capital Transition Readiness Analysis™", text: "Before a raise, a sale or a new CEO: will the people hold when the capital changes?", time: "Pre-event" },
  { verb: "Act", name: "RealTime Advisory™", text: "Embedded advisory at every decision inflection point, not after it.", time: "9+ months" },
  { verb: "Exit", name: "Enterprise Value Blueprint™", text: "Nine pillars and 32 value drivers that prepare a company to be bought at its number.", time: "9+ months" },
  { verb: "Diligence", name: "Stakeholder Diligence™", text: "Diligence on the people system of a target, for sponsors and acquirers, before the price is set.", time: "3+ months" },
];

// [SR] home FAQ and section copy.
export const audiences = [
  { slug: "ceos", who: "CEOs & Founders", line: "Keep your authority. Protect your number.", text: "For founders preparing for institutional capital, CEOs leading under sponsor ownership and boards in transition: Stakeholder Risk measured every quarter, not only at the deal table.", href: "/briefing/" },
  { slug: "sponsors", who: "Sponsors & Boards", line: "Price the people before close.", text: "Across the investment lifecycle: pre-transaction diligence, platform builds, add-ons and post-close value creation, with a score your next investment committee can use.", href: "/humanfactor-index/" },
  { slug: "life-sciences", who: "Life Sciences", line: "Enterprise value is built long before the transaction.", text: "The Global Life Sciences Group works with pre-commercial, venture-backed, commercial-stage and grant-funded companies where founder, board and investor dynamics decide the outcome.", href: "/life-sciences/" },
];

// [SR] home FAQ.
export const engagement = [
  { step: "Briefing", time: "30 minutes", text: "A confidential working session on where Stakeholder Risk sits in your situation today." },
  { step: "Scope", time: "5–10 business days", text: "A scoped MOU: named practitioners, a clear scope, defined deliverables." },
  { step: "Analysis", time: "10–90 days", text: "HumanFactor Analysis™, sized to the company, its executive and senior leadership teams." },
  { step: "Advisory", time: "9+ months", text: "Retained RealTime Advisory™ or EVB™ work. The average engagement runs 18 months." },
];

// [SR /team], [SR /life-sciences]
export const people = [
  {
    slug: "jennifer-bates", name: "Jennifer G. Bates", title: "Founder & CEO",
    bio: "A six-time founder and 23-year entrepreneur, Jennifer is the originator of Stakeholder Risk and created the frameworks behind Stakeholder Diligence™, the HumanFactor Index™ and RealTime Advisory™. Her work spans more than 25 industries and $4.2B+ in enterprise value. MS in Finance, NYU Stern.", // CONFIRM years: /about says 20+
    quote: "I built this category because the risk that erodes the most enterprise value is the one no model prices, the human one.",
    linkedin: "https://www.linkedin.com/in/humanfactor/",
  },
  {
    slug: "jean-pineault", name: "Jean Pineault", title: "Global Head, Life Sciences Group · Operating Partner",
    bio: "A two-time CEO and three-time C-suite operator who has architected life sciences companies for liquidity events and executed them. Master’s in biochemistry and molecular biology, University of Ottawa; Chair of the Dean’s Leadership Council, University of Ottawa Faculty of Medicine.",
    quote: "After architecting companies for liquidity events and executing them, I now sit on your side of the table and show you how to do it before the buyer arrives.",
    linkedin: "https://www.linkedin.com/in/jeanpineault/",
  },
];

// [SR /insights]: articles stay on their current URLs.
export const insights = [
  { title: "The Most Underpriced Risk in Capital Markets", tag: "Capital markets", date: "March 2026", url: "https://stakeholderrisk.com/insights/underpriced-risk-capital-markets" },
  { title: "The Stakeholder Risk Pyramid", tag: "Frameworks", date: "February 2026", url: "https://stakeholderrisk.com/insights/stakeholder-risk-pyramid" },
  { title: "Why Governance Misalignment Erodes Enterprise Value", tag: "Governance", date: "January 2026", url: "https://stakeholderrisk.com/insights/governance-misalignment-enterprise-value" },
  { title: "Decision Architecture and Investor Risk", tag: "Decision architecture", date: "December 2025", url: "https://stakeholderrisk.com/insights/decision-architecture-investor-risk" },
  { title: "The Hidden Risks in Founder-Led Companies", tag: "Leadership", date: "November 2025", url: "https://stakeholderrisk.com/insights/hidden-risks-founder-led-companies" },
];

// [SR /life-sciences]
export const ls = {
  pillars: ["Science & technology", "People & governance", "Commercial engine", "Business operations", "Scientific & tech ops", "Finance & fundraising", "Intellectual property", "Regulatory readiness", "Liquidity event strategy"],
  enters: ["Capital & institutionalization", "Transactions & strategic partnerships", "Enterprise value & exit readiness", "Leadership, succession & board mandates", "Pre-commercial & clinical development", "Commercialization & market entry", "Scale-up & growth"],
  // Their published "representative sample"; CONFIRM permission before showing names.
  record: [
    "Built Tandem Labs for acquisition by Labcorp",
    "Architected SPEware for acquisition by Tecan",
    "Created ClinOps through M&A",
    "Rescued a DTRA contract, pivoted to biotech and rebuilt the board",
  ],
  when: [
    "Ahead of a raise, strategic partnership or licensing decision.",
    "When the science is advancing faster than the decisions around it.",
    "When a board, founder or investor dynamic is slowing consequential calls.",
    "Two to three years before any exit conversation, not after the LOI.",
  ],
};

export const contact = {
  briefing: "/briefing/",
  phone: { display: "212.369.9100", tel: "+12123699100" },
  intl: { display: "(833) 369-9100", tel: "+18333699100" },
  linkedin: "https://www.linkedin.com/company/humanfactor-enterprises",
  routes: [
    { label: "Advisory", email: "advisory@stakeholderrisk.com" },
    { label: "Capital", email: "capital@stakeholderrisk.com" },
    { label: "Research", email: "research@stakeholderrisk.com" },
    { label: "Media & speaking", email: "media@stakeholderrisk.com" },
  ],
  offices: [
    { city: "New York", what: "Headquarters" },
    { city: "Wilmington", what: "Registered office, Delaware" },
    { city: "London", what: "Opening 2027" },
  ],
};

// Answer-first: the first sentence of each answer stands alone. [SR] home and /stakeholder-risk FAQs.
export const faq = [
  { q: "What is Stakeholder Risk?", a: `${definition} It compounds at every stage of a company’s life, through growth, institutionalization and transactions, and it is the most underpriced driver of enterprise value.` },
  { q: "How is it different from management diligence?", a: "Management diligence assesses individuals; Stakeholder Risk Intelligence™ measures the system. It shows how decisions flow, how power is distributed, where governance friction sits and where alignment will break under pressure." },
  { q: "Why is it the most underpriced risk in capital markets?", a: "Because it sits beneath financial, strategic and operational risk and decides whether all three hold, yet it rarely appears on a balance sheet or in a quality-of-earnings report." },
  { q: "How is Stakeholder Risk measured?", a: "With the HumanFactor Index™, which scores twelve risks and four diagnostics from 0 to 100, benchmarked against more than 350,000 leaders. A higher score means more observed exposure." },
  { q: "When should a sponsor or CEO commission an assessment?", a: "At the highest-leverage points: before a transaction, at platform formation, ahead of an add-on integration, in the post-close value creation window, and before a recapitalization or sale." },
  { q: "Who does HumanFactor work with?", a: "CEOs, founders, boards, private equity sponsors and incoming directors, from the middle market to large-cap and public companies. The Global Life Sciences Group does the same work for biotech and life sciences companies." },
  { q: "What does an engagement look like?", a: "Every engagement starts with a confidential briefing, followed by a scoped MOU within 5 to 10 business days. A HumanFactor Analysis™ runs 10 to 90 days; Stakeholder Diligence™ runs 3+ months; RealTime Advisory™ and EVB™ work is retained for 9+ months, and the average engagement is 18 months." },
];

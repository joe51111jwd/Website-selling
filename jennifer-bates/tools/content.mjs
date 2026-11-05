// Every fact on the site lives here, with where it came from. tools/pages.mjs turns it into pages.
// Sources (read 2026-11-05):
//   [SR]  stakeholderrisk.com (home, /about, /team): her company site; vtstrategies.com now redirects there
//   [HFI] humanfactorindex.com
//   [POD] orlandoinsightspodcast.com, "Stakeholder Risk: Why Deals Fail", 2026-06-13
// Anything marked CONFIRM differs between sources or is our reading of a source: check it with Jennifer.

export const SITE = {
  // CONFIRM: the domain. Used for canonical URLs, the sitemap and schema.
  url: "https://jennifergbates.com",
  name: "Jennifer G. Bates",
  role: "Founder & CEO, HumanFactor™",
  short: "Founder and CEO of HumanFactor™ and the creator of Stakeholder Risk.",
};

export const person = {
  name: "Jennifer G. Bates",
  title: "Founder & CEO",
  company: "HumanFactor Enterprises", // [SR] footer legal entity: HumanFactor Research Company (HFRC)
  companyUrl: "https://stakeholderrisk.com",
  city: "New York", // [POD] "based in New York City"; [SR] headquarters New York, NY
  linkedin: "https://www.linkedin.com/in/humanfactor/", // [SR /team] CONFIRM this is her profile
  companyLinkedin: "https://www.linkedin.com/company/humanfactor-enterprises",
  education: "MS in Finance, NYU Stern School of Business", // [SR /team]; CONFIRM: an older Vision Track bio lists an MBA and an MS from the University of Colorado
  quote: "I built this category because the risk that erodes the most enterprise value is the one no model prices, the human one.", // [SR /team]
  quote2: "I created Stakeholder Risk as a formal category because the most consequential risk to any company was the one no model priced and no advisor could measure.", // [SR /about]
};

// [SR]. Shown with the disclaimer below, which is the company's own.
export const stats = [
  { n: "$4.2B+", label: "Enterprise value impacted" },
  { n: "3,000+", label: "Stakeholder debriefs delivered" },
  { n: "25+", label: "Industries served" }, // CONFIRM: /about says 15+ industries
  { n: "350,000+", label: "Leaders in the benchmark database" },
];
export const DISCLAIMER =
  "Enterprise value figures, valuation increases and exit multiples reflect outcomes from specific engagements and are not representative, typical or guaranteed.";

export const definition =
  "Stakeholder Risk is the enterprise risk that comes from the relationships, incentives, governance and decision rights among the people who decide a company’s outcome: founders, executives, boards, investors and lenders.";

// The four diagnostics of the HumanFactor Index™ [HFI]. Scores are the index site's own illustrative sample.
export const diagnostics = [
  { code: "LIR", name: "Leadership Identity Risk", score: 72, q: "Is the company bigger than the person leading it?", example: "The founder’s identity is the product, so every hard call becomes personal." },
  { code: "ASR", name: "Authority Structure Risk", score: 64, q: "Does the org chart match who actually decides?", example: "The board chair runs the company on Sundays." },
  { code: "DAR", name: "Decision Architecture Risk", score: 69, q: "Are decisions made the same way twice?", example: "Two executives each believe they own the pipeline decision." },
  { code: "SAR", name: "Stakeholder Alignment Risk", score: 58, q: "Do the people at the table want the same outcome?", example: "The lead investor wants a 2027 exit; the CEO wants to build for ten years." },
];

// The twelve risks the HumanFactor Index™ tracks [HFI].
export const twelve = [
  "Leadership identity", "Authority structure", "Decision architecture", "Stakeholder alignment",
  "Governance complexity", "Data and reporting silos", "Accountability systems", "Talent leverage",
  "Knowledge concentration", "Investor narrative", "Leadership transition", "Exit readiness",
];

// Her body of work: the six proprietary frameworks, in the order a company meets them [SR].
export const frameworks = [
  { verb: "Extract", name: "HumanFactor Analysis™", text: "Maps the human system behind the company into a Living Blueprint™: who decides, who they answer to, and what they are paid to want.", time: "10 to 90 days" },
  { verb: "Measure", name: "HumanFactor Index™", text: "Turns the Blueprint into a benchmarked Stakeholder Risk score, the way the VIX turned volatility into a number.", time: "Benchmarked" },
  { verb: "Test", name: "Capital Transition Readiness Analysis™", text: "Before a raise, a sale or a new CEO: will the people hold when the capital changes?", time: "Before the event" },
  { verb: "Act", name: "RealTime Advisory™", text: "Embedded with the CEO and board at each decision that moves enterprise value, not after it.", time: "Retained, 9+ months" },
  { verb: "Exit", name: "Enterprise Value Blueprint™", text: "A nine-pillar framework, built in the life sciences group, that prepares a company to be bought at its number.", time: "Retained, 9+ months" },
  { verb: "Diligence", name: "Stakeholder Diligence™", text: "For investors and acquirers: diligence on the people system of a target, before the price is set.", time: "3+ months" },
];

// Who she works with [SR], [POD].
export const audiences = [
  { who: "Founders and CEOs", what: "Keep your authority and protect your number through a raise, a new board or a sale." },
  { who: "Boards and fiduciaries", what: "See the governance and decision risk that never shows up in the board pack." },
  { who: "Private equity and investors", what: "Price the people before close, and watch them across the portfolio after." },
  { who: "Life sciences", what: "Biotech and life sciences founders, CEOs and boards, through the Global Life Sciences Group." },
];

// Keynotes: written for this site from her published themes [SR], [POD]. CONFIRM titles with Jennifer.
export const talks = [
  { title: "Why deals fail", sub: "The stakeholder risk inside the model", for: "Private equity, M&A and investor audiences", text: "Most deals that miss do not miss on the spreadsheet. They miss on the people the spreadsheet assumed would agree. How to see that before close, and price it." },
  { title: "Keep your authority, protect your number", sub: "For founders through a capital transition", for: "Founders, CEOs, executive teams", text: "A raise, a new board seat or a sale changes who decides. What founders lose when they don’t plan for that, and how the strongest ones keep control of the outcome." },
  { title: "Pricing the human system", sub: "Stakeholder Risk as a measurable category", for: "Boards, lenders, fiduciaries, risk leaders", text: "Markets learned to put a number on volatility, credit and governance. Why the human system is next, and what boards can measure today." },
  { title: "From science to enterprise value", sub: "Stakeholder Risk in life sciences", for: "Biotech founders, boards and investors", text: "In life sciences the science is diligenced to the decimal and the team is taken on trust. Where that goes wrong between the lab and the exit." },
];

export const appearances = [
  { show: "Orlando Insights Podcast", title: "Stakeholder Risk: Why Deals Fail", date: "2026-06-13", url: "https://youtu.be/R0vRtxAutRU", note: "With host Henry Clavo: why leadership alignment, governance, incentives and decision rights are the upstream risk that decides whether value is created or destroyed, and why it is not just HR." },
];

// CONFIRM the reading of each year. [SR /about] lists "2006 Practiced, 2016 Named, 2022 Discussed, 2026 Sought".
export const timeline = [
  { year: "2006", text: "Starts advising on the human side of enterprise value, years before it had a name." },
  { year: "2009", text: "Founds Vision Track Strategies, advising CEOs, directors, shareholders and investors." },
  { year: "2016", text: "Names the category: Stakeholder Risk." },
  { year: "2024", text: "Founds HumanFactor Research Company, the research arm behind the index." },
  { year: "2026", text: "Launches the HumanFactor Index™, a benchmark for Stakeholder Risk." },
  { year: "2027", text: "HumanFactor opens in London." },
];

export const contact = {
  briefing: "https://stakeholderrisk.com/request-briefing",
  assessment: "https://stakeholderrisk.com/frameworks/humanfactor-index#assessment",
  index: "https://humanfactorindex.com",
  phone: { display: "212.369.9100", tel: "+12123699100" },
  intl: { display: "(833) 369-9100", tel: "+18333699100" },
  routes: [
    { label: "Advisory", text: "CEOs, boards and investors", email: "advisory@stakeholderrisk.com" },
    { label: "Speaking and media", text: "Keynotes, panels, podcasts, press", email: "media@stakeholderrisk.com" },
    { label: "Capital", text: "Sponsors, funds and lenders", email: "capital@stakeholderrisk.com" },
    { label: "Research", text: "HumanFactor Research Company", email: "research@stakeholderrisk.com" },
  ],
};

// Answer-first: the first sentence of each answer stands on its own, so it can be quoted.
export const faq = [
  { q: "Who is Jennifer G. Bates?", a: "Jennifer G. Bates is the founder and CEO of HumanFactor™ and the creator of Stakeholder Risk, a category of enterprise risk that comes from the people who decide a company’s outcome. A six-time founder based in New York, she has advised CEOs, boards, investors and fiduciaries for more than 20 years across life sciences, technology, finance and private equity." },
  { q: "What is Stakeholder Risk?", a: `${definition} It sits upstream of execution and valuation: when those people are misaligned, the plan stalls and the multiple compresses, even if the model never changes.` },
  { q: "How is it different from management diligence?", a: "Management diligence assesses individuals; Stakeholder Risk measures the system between them. A team of strong executives can still carry high Stakeholder Risk if decision rights overlap, incentives pull apart or the board and CEO want different outcomes." },
  { q: "Isn’t this HR, coaching or culture work?", a: "No. Stakeholder Risk is enterprise risk, measured and priced like any other risk to value, and the work is done for CEOs, boards and investors, not for HR. It is not organizational consulting, executive coaching or HR advisory." },
  { q: "How is Stakeholder Risk measured?", a: "With the HumanFactor Index™, which scores a company from 0 to 100 on twelve risks and four diagnostics (leadership identity, authority structure, decision architecture and stakeholder alignment), benchmarked against a database of more than 350,000 leaders. A higher score means more observed exposure." },
  { q: "When should a company look at it?", a: "Before the moments when the people around the table change: a raise, an acquisition, a CEO transition, a new board, or an exit. Investors also use it before close and to monitor a portfolio." },
  { q: "How does working with Jennifer start?", a: "Every engagement starts with a confidential briefing of about 30 minutes, followed by a scoped memorandum of understanding within 5 to 10 business days. Request one at stakeholderrisk.com." },
  { q: "Does Jennifer speak at events?", a: "Yes. Jennifer gives keynotes and joins panels, fireside chats and podcasts on Stakeholder Risk, deal failure, founder authority and life sciences. Write to media@stakeholderrisk.com." },
];

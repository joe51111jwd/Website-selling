// All page copy and the tokens it depends on, in one place, so Andrew's answers change one file.
// Rules (research/features/TRUTH.md, conversion/PLAYBOOK.md §8): only GREEN/AMBER lines or plain
// paraphrases of them; no prices, trial terms, perks, stats or customer counts; anything Andrew
// hasn't approved is marked with FLAG (⚑) and shown visibly on the page.

import type { MomentId } from "./moments";

/** Visible marker for copy Andrew must confirm before launch. */
export const FLAG = "⚑";

// ─── Tokens ──────────────────────────────────────────────────────────────────
export const T = {
  /** {SIZE}: must equal the ads. ⚑ Andrew signs off 5–100 (live hero) vs 5–50 (ads). */
  SIZE: "5–100",
  /** {N}: call length in minutes, must equal the Cal.com event (config.callLength; Andrew, Oct 19: 15). */
  N: 15,
  /** {PROGRAM}: round 4, "Founding Member" is cut everywhere (Andrew's doc). Oct 19 (Andrew, by text):
   *  "Let's roll with CTAs as 'Try SmartCrew' instead of the Free Trial option." */
  PROGRAM: "Try SmartCrew",
  EMAIL: "hello@smartcrewhq.com",
  /** The demo company every screen shows. */
  COMPANY: "Cedar Ridge Earthworks",
  /** The demo crew size the One Day story is told with. */
  CREW: 16,
} as const;

// ─── CTAs (PLAYBOOK §2.0.3) ──────────────────────────────────────────────────
export const CTA = {
  /** Andrew, Oct 19: no free trial up front (it pushes cash collection back a week, and the
   *  experience is poor until their project data is in), so every button says "Try SmartCrew". */
  primary: "Try SmartCrew",
  demo: "Book a demo with Andrew",
  demoLink: "or book a demo with Andrew",
  /** Under the FAQ's last button and the spec sheet's (round 4: the hero has none, per Andrew). */
  // (a no-break space keeps "No contract" together: a line never ends on a lone "No")
  micro: "No\u00a0contract, cancel anytime.",
  /** One-tap links at the peaks of the One Day scene (profit and payroll moments). */
  inline: "Want this for your crew? Try SmartCrew",
};

// ─── Header and the phone's sticky bar ──────────────────────────────────────
export const HEADER = {
  logoLabel: "SmartCrew, back to the top",
  nav: [
    { label: "How it works", href: "#features" },
    { label: "FAQ", href: "#faq" },
  ],
  cta: CTA.primary,
};

export const STICKY = {
  title: "A walkthrough with Andrew",
  sub: "No contract, cancel anytime",
  cta: CTA.primary,
};

// ─── The demo jobsite ───────────────────────────────────────────────────────
// The hero's fenced job (HERO_JOBS below) and Try it's geofence tag repeat its name:
export const INTRO = {
  site: "Hwy 9 Culvert",
};

// ─── Hero (BRIEF §1, OFFER §4) and ?angle= message match (PLAYBOOK §2.0.5) ──
export type Angle = "profit" | "overbudget" | "timecards" | "payroll" | "replace";

/**
 * Per angle: the H1, the desktop sub, and the hero's fence (src/site/hero/fence): `fence` is the
 * exact substring of `h1` the geofence stakes itself round; `lines` are the explicit line breaks
 * (desktop, phone) so the fenced phrase sits alone on its line (or mid-line with room for the
 * stakes; a long phrase may run over two lines on a phone, fenced as one). `lines.x.join(" ")`
 * must equal `h1`. A fenced phrase that ends the sentence drops its
 * full stop on screen only (the screen-reader text is the whole sentence).
 */
export type AngleCopy = {
  h1: string;
  sub: string;
  moment: MomentId;
  laptop: "web-project-detail" | "web-timecards";
  fence: string;
  lines: { desk: string[]; phone: string[] };
};

export const ANGLES: Record<Angle, AngleCopy> = {
  profit: {
    h1: "See what every job is making, every day.",
    sub: "GPS fills in your crew’s timecards and tags every hour to the right job. You see each job’s profit daily, in time to fix it.",
    moment: "profit",
    laptop: "web-project-detail",
    fence: "every job",
    lines: { desk: ["See what", "every job", "is making, every day."], phone: ["See what", "every job", "is making,", "every day."] },
  },
  overbudget: {
    h1: "Know which jobs are losing money before it’s too late.",
    sub: "SmartCrew rolls your crew’s hours, machine time and materials into a profit number for every job, updated daily.",
    moment: "profit",
    laptop: "web-project-detail",
    fence: "losing money",
    lines: { desk: ["Know which jobs are", "losing money", "before it’s too late."], phone: ["Know which", "jobs are", "losing money", "before it’s", "too late."] },
  },
  timecards: {
    h1: "Stop chasing timecards.",
    sub: "Hours log themselves when your crew gets to the job, tagged to the right cost code and ready for QuickBooks payroll.",
    moment: "clockin",
    laptop: "web-timecards",
    fence: "timecards",
    lines: { desk: ["Stop chasing", "timecards."], phone: ["Stop", "chasing", "timecards."] },
  },
  payroll: {
    h1: "Payroll without the Friday scramble.",
    sub: "Hours log themselves when your crew gets to the job, tagged to the right cost code and ready for QuickBooks payroll.",
    moment: "payroll",
    laptop: "web-timecards",
    fence: "Friday scramble",
    lines: { desk: ["Payroll without the", "Friday scramble."], phone: ["Payroll", "without the", "Friday", "scramble."] },
  },
  replace: {
    h1: "Replace your time app, your spreadsheets and the group texts.",
    sub: "GPS fills in your crew’s timecards and tags every hour to the right job. You see each job’s profit daily, in time to fix it.",
    moment: "profit",
    laptop: "web-project-detail",
    fence: "group texts",
    lines: { desk: ["Replace your time app,", "your spreadsheets and the", "group texts."], phone: ["Replace your", "time app, your", "spreadsheets", "and the", "group texts."] },
  },
};

export function readAngle(): Angle {
  try {
    const a = new URLSearchParams(location.search).get("angle");
    return a && a in ANGLES ? (a as Angle) : "profit";
  } catch {
    return "profit";
  }
}

export const HERO = {
  eyebrow: `For dirt work contractors with ${T.SIZE} employees`,
  usedBy: "Used by",
  cue: `Watch a day at ${T.COMPANY}`,
  /** Desktop, one line under the hero's button (phones: HERO_PHONE.micro). */
  micro: `${T.PROGRAM} · starts with a ${T.N}-minute call with Andrew · no\u00a0contract`,
};

/**
 * The fold, round 4 (Andrew's Oct 16 doc, verbatim; Title Case as he typed it, the agency owner's
 * call). `fence` is the phrase set in orange clay; `lines` are the explicit line breaks (desktop,
 * phone), and `lines.x.join(" ")` must equal `h1`. "Featured at ConExpo" is Andrew's own line
 * (his video, 0:23), cleared by the agency owner. The ?angle= headlines are off.
 */
export const HERO4 = {
  featured: "Featured at ConExpo",
  /** Classic, Andrew's round 2: "Featured by" over the ConExpo logo, on two lines (the name stands in for the
   *  logo until he sends the file, config.conexpoLogo) */
  featuredBy: "Featured by",
  featuredName: "ConExpo",
  featuredNote: "Andrew: send the ConExpo logo file; it takes this word’s place",
  h1: `The Simplest All-In-One Software For Heavy Civil & Dirtwork Companies With ${T.SIZE} Employees`,
  fence: "Heavy Civil & Dirtwork",
  lines: {
    desk: ["The Simplest All-In-One Software", "For Heavy Civil & Dirtwork Companies", `With ${T.SIZE} Employees`],
    phone: ["The Simplest", "All-In-One Software", "For Heavy Civil &", "Dirtwork Companies", `With ${T.SIZE} Employees`],
    /** the optimized look's trimmed first screen: four lines, smaller, so the button comes up (same words) */
    trim: ["The Simplest All-In-One", "Software For Heavy Civil &", "Dirtwork Companies With", `${T.SIZE} Employees`],
  },
  sub: "Ditch the apps and spreadsheet madness for one simple software your crew will actually use.",
  usedBy: "Used by",
};

/** The six contractors on the live site ("Used by", AMBER: Andrew confirms permission). Aspect = w/h of the file. */
export const LOGOS: { name: string; src: string; aspect: number }[] = [
  { name: "Drish Construction", src: "logos/drish.webp", aspect: 2.16 },
  { name: "Rieke Grading", src: "logos/rieke.webp", aspect: 1.75 },
  { name: "JCR Excavating", src: "logos/jcr.webp", aspect: 2.61 },
  { name: "Fireball Construction", src: "logos/fireball.webp", aspect: 1.49 },
  { name: "DW Companies", src: "logos/dw.webp", aspect: 1.63 },
  { name: "Midwest Erosion Specialists", src: "logos/midwest.webp", aspect: 4.01 },
];

// ─── Scene headlines (starting points from the brief; scene owners refine) ──
export const TRY = {
  /** Andrew's round 2 (Oct 19), verbatim: the later of his two versions of this section */
  title: "So Simple… Your Crew Will Actually Use It",
  sub: "Simple for the field. Robust for leadership.",
};

export const NUMBER = {
  /** Andrew's round 2 (Oct 19), verbatim */
  title: "How Much Profit Are You Losing In Misallocated Time?",
  hint: "Think of one guy who writes 7:00 when he showed up at 7:10.",
};

export const APPS = {
  title: "Five apps that don’t talk to each other. Or one that does.",
  apps: [
    { kind: "Time tracking", names: "busybusy · QB Time · ExactTime" },
    { kind: "Fleet", names: "fleet.io" },
    { kind: "CRM", names: "HubSpot · Close" },
    { kind: "Files", names: "Dropbox · Google Drive" },
    { kind: "Group chat", names: "Slack · WhatsApp" },
  ],
  footnote: "Trademarks belong to their owners. QuickBooks is integrated, not replaced.",
};

/** Andrew's round 2 (Oct 19), verbatim */
export const FAQ_TITLE = "Got questions? We've got answers.";
export const FAQ_SUB = "Everything you need to know about getting your crews connected, eliminating paperwork, and running more profitable jobs.";

export const FOOTER = {
  /** CC-BY-4.0 credit, shown in the footer only if a scene ever shows the XDR (none does today). */
  xdrCredit: "Apple Pro Display XDR model by polyman Studio, CC-BY-4.0.",
};

// ─── 3 · Try it + 4 · Your number (scene owner: try_number; append-only block) ─
// Try it: GREEN sources: L "No training needed. Just open the app and go.", L 3-step "Clock in →
// Select your task → Clock out", L FAQ (battery, privacy). The prompts are UI instructions, not claims.
export const TRY_IT = {
  title: TRY.title,
  sub: TRY.sub,
  /** Andrew's round 2 mock: beside the phone, with an arrow pointing at it (he cut the two facts that
   * stood there), so people see it's the real app and not a screenshot */
  nudgeLead: "…But don’t take our word for it…",
  nudge: "Try it yourself.",
  /** The jobsite's geofence tag (same job as the hero's tag and the phone screen). */
  site: INTRO.site,
  /** Tag once clocked in; {time} = the visitor's local time. */
  clocked: "Clocked in · {time}",
  again: "Clock out and try it yourself",
  clockIn: "Clock in",
  clockOut: "Clock out",
  /** Screen-reader status after the tap. */
  live: "Clocked in. Currently working on Hwy 9 Culvert Replacement, Pipe Laying, CAT 320 Excavator.",
};

// Your number: OFFER.md §6 / PLAYBOOK S3. The visitor supplies every input; we only multiply and
// show the working. Never "SmartCrew saves you $X".
export const CALC = {
  title: NUMBER.title,
  crewUnit: "people in the field",
  crewUnitOne: "person in the field",
  crewEmpty: "Drag to your crew size",
  /** Andrew's round 2 (Oct 19), verbatim. ⚑ no traceable source found for the figure (Oct 17 buyer research) */
  stat: "The American Payroll Association estimates that employees overestimate their hours by 45 minutes per day.",
  statFlag: "Andrew to confirm the source: we couldn’t trace this figure to the American Payroll Association",
  minutesLabel: "Minutes lost per person, per day",
  /** Andrew's round 2: 10 / 15 / 30 / 45 / 60, 30 the default (calc.ts PRESET) */
  minutes: [10, 15, 30, 45, 60],
  hint: NUMBER.hint,
  rateLabel: "Hourly cost per field employee",
  rateNote: "wage + taxes + insurance",
  /** Andrew's round 2: 20 / 30 / 40 / 50, 30 the default */
  rates: [20, 30, 40, 50],
  days: 250,
  daysLabel: "workdays a year (edit if different)",
  /** Before all three inputs are set. */
  pending: "Set your crew, minutes and hourly cost.",
  year: "a year",
  /** "about $561 a week" */
  week: (w: string) => `about ${w} a week`,
  /** Round 4: the calculator starts from presets (site/number/calc.ts PRESET). */
  framing: "That’s what loose time costs at these numbers. Change them to yours.",
  built: "SmartCrew is built to close this gap: GPS fills in the timecards and every hour goes on a cost code.",
  /** ⚑ Andrew confirms he opens the call with the visitor's number (PLAYBOOK S3). */
  ctaMicro: "We’ll go over your number with you on the call.",
  privacy: "Your numbers stay on this screen unless you continue.",
};

// ─── 5 · Proof + 6 · Five apps → one (scene owner: proof_apps; append-only block) ──────────────
// Proof: both quotes verbatim from the live site (TRUTH.md AMBER), rough edges and caps kept, never
// restated as our claim. The quote is split only so the figure can be set large; read in order it is
// word for word. The family disclosure is required (FTC endorsement guides) and its wording is
// PLAYBOOK S2's proposal: ⚑ Andrew confirms. Katie ⚑: confirm JW vs JCR Excavating + permission.
export const PROOF = {
  label: "What contractors say",
  phil: {
    before: "SmartCrew is literally saving us",
    /** The figure as it appears in the quote ("~" kept), set in bold on its card. */
    figure: { prefix: "~$", digits: "150", suffix: "k" },
    figureRest: "per YEAR",
    after: "in profit. Highest ROI of any software we’ve ever bought. I cannot believe we didn’t start using this sooner.",
    name: "Phil Drish",
    company: "Drish Construction",
    /** ⚑ disclosure, for Andrew to confirm or reword. */
    disclosure: "Drish Construction is Andrew’s family’s dirt work company, where SmartCrew started.",
  },
  katie: {
    text: "I’ve searched for this EXACT software for 10 YEARS! It’s completely changed our business.",
    name: "Katie",
    /** ⚑ the logo strip shows JCR Excavating; confirm the company and permission to quote. */
    company: "JW Excavating",
  },
  flagTitle: "Andrew to confirm",
  flagDisclosure: "Andrew to confirm the disclosure and its wording",
  flagKatie: "Andrew to confirm: JW or JCR Excavating, and permission to quote",
};

// Five apps → one: the five categories and names are LV's (TRUTH.md "Replace 5 apps"), plain text,
// no logos; the headline is APPS.title split at its turn; the sub is LV (GREEN). QuickBooks is
// integrated with, never replaced (APPS.footnote).
export const APPS_SCENE = {
  label: "Five apps, one system",
  lead: "Five apps that don’t talk to each other.",
  payoff: "Or one that does.",
  sub: "Replace all that. With one software.",
  footnote: APPS.footnote,
  /** screen-reader name of the tile list */
  tilesLabel: "The five apps it replaces",
  /** the cursor's loupe tags over the lit screens (CURSOR.md) */
  loupeOffice: "Office",
  loupeCrew: "Crew app",
  posterAlt: "SmartCrew’s office dashboard on a MacBook and the crew app on an iPhone",
};

// ─── 2 · One Day: scene UI strings (Day owner's block, src/site/day) ─────────
// The moments and features live in moments.ts; the round-2 headlines and state labels in DAY2
// below; the demo records the day creates in src/site/day/states/data.ts. These are the scene's
// own labels. (The cursor's loupe tags "Office" / "Crew app" are the Stage's: stage/loupe.ts.)
export const DAY_UI = {
  /** accessible name of the day rail */
  rail: `The day at ${T.COMPANY}`,
  /** short names for the rail stops (cursor tag, aria) */
  short: {
    clockin: "Clock-in",
    pretrip: "Pre-trip",
    load: "Load",
    leak: "Leak",
    profit: "Profit",
    plan: "Plan",
    payroll: "Payroll",
  } as Record<MomentId, string>,
  /** the rail's last stop: opens the popup */
  crew: "Your crew",
  crewAria: "Set up SmartCrew for your crew",
  /** quiet caption under the devices (PLAYBOOK §8.1 rule 2) */
  caption: "Demo account. Names and numbers are made up.",
};

export const ANDREW = {
  name: "Andrew Drish",
  role: "founder",
  photo: "andrew/andrew-cutout.webp",
  /** A small round crop of the same photo, for "Andrew answers" beside the FAQ. */
  face: "andrew/andrew-face.webp",
  /** ⚑ The only cut-out we have is 456×420 px (soft on retina). Andrew sends a new headshot. */
  photoAlt: "Andrew Drish, founder of SmartCrew",
};

/**
 * 8 · Why us, round 4 (Andrew's Loom 2:48–3:03: a static image, not every sales call on him, "we've
 * got a founder story… rip that and put that in here and have a little drop"). The letter is his
 * founder story from smartcrewhq.com, word for word, with three changes: two typos fixed ("business.."
 * and "don't want to spent"), "managing your entire business is" → "in", and his "5-50" set to {SIZE}
 * to match his new headline (⚑ in FEEDBACK.md). Its close ("book a free call with me… Guaranteed.")
 * is left off: the page's buttons do that job, and a guarantee needs terms (RED). The first `lead`
 * paragraphs show; "Read more" opens the rest.
 */
export const WHY = {
  kicker: "Why us",
  title: "Why we built SmartCrew",
  lead: 3,
  letter: [
    "When I was 13, I started working for my dad in our small, family construction business.",
    "The first day, he put me in a trench, handed me a shovel and said, “Son - I’m gonna teach you how to run a shovel this summer so you learn that you don’t want to spend the rest of your life doing this.”",
    "It was the worst summer of my life... and the most important gift of my life. Because it taught me to value working hard AND smart.",
    "That led me to spending 20 years in the tech world where I built, invested in and advised three of the fastest growing tech companies in America, according to Inc Magazine.",
    "Recently, my dad was trying to retire but the family didn’t have the cash to buy him out. So they asked if I could help them leverage technology to make their business more profitable.",
    "I looked at the market for software and was SHOCKED to see how bad everything was.",
    "You have cheap time tracking apps that don’t actually help you manage the business (BusyBusy, ExakTime, WorkMax, etc.) Or bloated, expensive enterprise tools that cost $25k+ to get started (HCSS, Viewpoint, Procore, etc.)",
    `There is NOTHING specifically designed for a construction company with ${T.SIZE} employees. So you’re stuck trying to patch everything together with 3-4 separate softwares, none of which work together.`,
    `That’s why we’re building the simplest all-in-one software for ${T.SIZE} person construction companies.`,
    "I know software. And the BEST software is about reduction and simplicity. Not complexity.",
    "That’s what makes SmartCrew so unique. We’ve simplified everything to create LESS work for you by managing your entire business in one simple platform.",
  ],
  more: "Read more",
  less: "Show less",
  signoff: "Respectfully,",
  signedBy: "Andrew Drish, founder",
  signatureAlt: "Andrew’s signature",
};

/** The FAQ: Andrew's round 2 (Oct 19), his 13 questions and answers word for word (one string per
 *  paragraph). `id`s are ours: "cost" carries the price slot, "trial" the trial-first answer (bold
 *  look only, src/lib/offer.ts). */
export const FAQS: { id: string; q: string; a: string[]; flag?: string }[] = [
  {
    id: "what",
    q: "What is SmartCrew?",
    a: [
      "SmartCrew is an all-in-one construction management platform built for dirtwork, excavation, sitework, and heavy civil contractors with 5\u2011100 employees.",
      "It connects your field crews and office in one place—from GPS time tracking and equipment management to daily reports, scheduling, job costing, hauling tickets, CRM, dispatch and more.",
    ],
  },
  {
    id: "who",
    q: "What size and type of construction companies is SmartCrew built for?",
    a: [
      "SmartCrew is designed for small to midsize contractors, typically between 5\u2011100 people. We often work with family businesses that have been around for many years.",
      "We only work with companies in dirtwork and heavy civil. Typically our clients do work like excavation, site prep, concrete, underground utilities, septic, drilling, commercial landscaping, grading, asphalt and paving, trucking and hauling, aggregate and quarries, roadways, demolition, and more.",
    ],
  },
  {
    id: "crew",
    q: "Will my field guys actually use it?",
    a: [
      "Yes. We designed SmartCrew to prioritize simplicity.",
      "Your crew doesn't need to be tech-savvy. They can clock in, see their assignments, submit inspections, upload receipts, post reports and view project progress right from their phones.",
      "We’re simple enough for the field but robust enough for management.",
    ],
  },
  {
    id: "profit",
    q: "Can SmartCrew show me whether my jobs are making money?",
    a: [
      "Yes. SmartCrew connects field activity with your job budgets so you can track labor, equipment, materials, and other job costs right against your bid.",
      "These numbers get automatically updated daily, so Instead of waiting until the end of a project to find out whether you made money, you can monitor job performance as work happens.",
    ],
  },
  {
    id: "gps",
    q: "How does the automated GPS time tracking work?",
    a: [
      "SmartCrew uses GPS and jobsite geofencing to help track employee time and verify where work happens. You can set it up to auto log employees time based on their geofencing data. (This feature is optional and you can turn it on or off.)",
      "Hours can be assigned to specific jobs and cost codes, giving you more accurate labor costs without chasing down paper timecards.",
    ],
  },
  {
    id: "equipment",
    q: "Can I track equipment, inspections, and maintenance?",
    a: [
      "Yes. Keep your equipment records, operating hours, inspections, DOT pre-trips, service requests, and maintenance history organized in one place.",
      "You can even use the Service Queue to manage all your shop and maintenance work.",
      "When an operator reports an issue, your team can track it before it turns into a bigger problem.",
    ],
  },
  {
    id: "paperwork",
    q: "Can SmartCrew replace my paperwork and spreadsheets?",
    a: [
      "That's the goal.",
      "SmartCrew helps bring timecards, daily reports, hauling logs, fuel records, receipts, inspections, and crew schedules into one connected system.",
      "Your field team enters the information, and your office can access it without collecting paperwork. We handle all the organization and systems for you so you can finally ditch the apps, spreadsheets and paper.",
    ],
  },
  {
    id: "quickbooks",
    q: "Does SmartCrew work with QuickBooks?",
    a: ["Yes. SmartCrew integrates with Quickbooks Online currently. We have more integrations coming for Quickbooks Desktop, Foundation, ADP and more."],
  },
  {
    id: "setup",
    q: "How long does it take to get started?",
    a: [
      "Most companies are up and running within a few weeks. But you don’t have to figure it all out alone.",
      "Our team will work with you to migrate your data, build your account and even train your office staff on how to use everything and roll this out to your team.",
      "You can start with the workflows that matter most and expand from there.",
    ],
  },
  {
    id: "trial",
    q: "How does the free trial work?",
    a: [
      "SmartCrew is currently offering qualified contractors access to our private beta trial.",
      "Start by requesting a free trial, then meet with our team for a quick walkthrough.",
      "We'll make sure the platform fits your business and help you get started.",
    ],
    flag: "Andrew to update: the buttons now say \"Try SmartCrew\" and there's no free trial up front (his text, Oct 19)",
  },
  {
    id: "cost",
    q: "How much does SmartCrew cost?",
    a: [
      "Pricing depends on your company size, number of users, and the features you need.",
      "We are significantly lower than all the other big players like ProCore, HCSS and others.",
      "We offer plans designed for growing contractors, with volume pricing for larger teams.",
      "Qualified Founding Members may also receive special introductory pricing.",
    ],
    flag: "Andrew to confirm: \"Founding Member\" was cut from the rest of the page in round 1",
  },
  {
    id: "different",
    q: "What makes SmartCrew different from other construction software?",
    a: [
      "We ONLY work with small to midsized dirtwork and heavy civil companies. That allows us to customize the workflows uniquely for your business.",
      "Other apps serve multiple industries or were built for GCs and vertical builders. We are the only app that specializes in working with dirtwork and heavy civil companies.",
      "Plus, my family has been dirtwork for 75 years. We’ve experienced all the same problems you have around time tracking, getting accurate job costing data and managing all the systems required for this work.",
      "We know these problems deeply and built the best solution possible to solve them all.",
    ],
  },
  {
    id: "founding",
    q: "What is the SmartCrew Founding Member Program?",
    a: [
      "We're currently inviting a select group of contractors into our Founding Member Program.",
      "Members get early access to our latest features, hands-on onboarding, and special pricing in exchange for feedback that helps shape the future of SmartCrew.",
      "Qualifying companies can receive our Premium feature set at introductory pricing, with opportunities to lock in long-term discounts.",
    ],
    flag: "Andrew to confirm: \"Founding Member\" was cut from the rest of the page in round 1",
  },
];

/** The FAQ's close, Andrew's round 2 (Oct 19), verbatim. */
export const FAQ_CLOSE = {
  title: "Ready to simplify your business?",
  line: "See how SmartCrew can help you run your crews, equipment, and jobs—all in one place.",
};

export const FOOTER_SCENE = {
  /** [L footer] verbatim. */
  tagline: "Ditch paper timecards. Our geofencing app fills them out automatically and updates your project dashboard daily.",
  email: T.EMAIL,
  login: "Log in",
  privacy: "Privacy",
  terms: "Terms",
  demo: "Product screens show a demo account. Names and numbers are made up.",
  trademarks:
    "busybusy, QuickBooks, ExakTime, Fleetio, MaintainX, HubSpot, Close, Dropbox, Google Drive, Google Sheets, Slack and WhatsApp are trademarks of their owners. Apple, iPhone and MacBook are trademarks of Apple Inc. Naming them doesn’t imply an endorsement.",
  /** Shown only when the Stage actually uses the Pro Display XDR model. */
  xdr: FOOTER.xdrCredit,
  copyright: "© 2026 SmartCrew",
};

// ─── 2b · Spec sheet: "That was one day. Here's everything it does." ─────────────────────────────
// Owner: specsheet (src/site/specsheet). Append-only block. The 38 tools, their names and one-line
// explanations live in moments.ts (GREEN lines); this block only groups them into six spec-sheet
// sections and names those. Outcomes are GREEN lines or plain paraphrases: time [L "Timecards That
// Log Themselves"], costing [L "Real-time profit metrics on every job, every day."], payroll [V-tab
// "…to payroll without the Friday scramble."], equipment [L "repairs and shop work orders… DOT and
// safety records all digitized"], materials [V-tab "lets crews log usage and upload receipts", L
// "hauling logs"], office [V-tab "Assign crews…" + L "Use real job data to create sharper… bids"].
// Key specs: SIZE (hero), "Web Platform" + "Mobile App" [V], "QuickBooks integration for payroll"
// [L, AMBER: no sync wording], "fully set up within a few days" [L FAQ].
export const SPEC = {
  label: "Everything SmartCrew does",
  kicker: "That was one day.",
  title: "Here’s everything it does.",
  plate: { name: "SmartCrew", sub: "Spec sheet" },
  specs: [
    { k: "Built for", v: `Dirt work, ${T.SIZE} employees` },
    { k: "Runs on", v: "Crew app + office web app" },
    { k: "Payroll", v: "QuickBooks integration" },
    { k: "Setup", v: "A few days" },
  ],
  /** The six sections, in the order a contractor cares; `tools` are moments.ts feature ids, the first three are the face-value "top 3". */
  categories: [
    { id: "time", name: "Time & crew", outcome: "Timecards that log themselves.", tools: ["T1", "T2", "T3", "T4", "T10", "T9", "T2c"] },
    { id: "costing", name: "Job costing", outcome: "Every job’s profit, every day.", tools: ["M1", "M2", "M5", "M3", "M7", "M6"] },
    { id: "payroll", name: "Payroll", outcome: "Payroll without the Friday scramble.", tools: ["M4", "T5", "T11", "T6", "T7", "T8"] },
    { id: "equipment", name: "Equipment & safety", outcome: "Repairs, DOT logs and safety on record.", tools: ["E3", "E2", "E4", "E1", "E5", "E6", "E7"] },
    { id: "materials", name: "Materials & hauling", outcome: "Loads and receipts logged to the job.", tools: ["H3", "H2", "H1", "H5", "H4"] },
    { id: "office", name: "Office & sales", outcome: "Plan crews and bid on real numbers.", tools: ["S1", "C3", "G1", "G2", "C2", "C1", "G3"] },
  ] as { id: string; name: string; outcome: string; tools: string[] }[],
  /** Phones only: shorter names for the face-value "top 3" line, so all three fit on one line. */
  short: { T2: "GPS clock-in", M2: "Change orders", M5: "Dashboard", H2: "Receipts", H1: "Deliveries", S1: "Scheduling" } as Record<string, string>,
  more: (n: number) => `+${n} more`,
  tools: (n: number) => `${n} tools`,
  unit: "tools",
  total: "Total",
  /** Phones only (the desktop sheet already lists every tool). */
  all: "Show everything",
  allTitle: (n: number) => `All ${n} tools`,
  allHintTouch: "Tap any tool to see it.",
  close: "Close",
  back: "All",
  next: "Next",
  side: { field: "Field", office: "Office", both: "Field + office" },
  app: { phone: "Crew app", web: "Office web app" },
  /** Short names of the recreated screens, for the preview's caption. */
  screen: {
    "web-dashboard": "Dashboard",
    "web-projects": "Projects",
    "web-project-detail": "Job detail",
    "web-timecards": "Reports",
    "web-equipment": "Equipment",
    "web-service-queue": "Service queue",
    "web-materials": "Materials",
    "web-scheduling": "Scheduling",
    "web-pipeline": "Sales pipeline",
    "web-messaging": "Messaging",
    "phone-home": "Home",
    "phone-working": "Working",
    "phone-select-task": "Select task",
    "phone-summary": "Weekly summary",
    "phone-reports": "Reports",
    "phone-hauling": "Hauling log",
    "phone-dot": "DOT inspection",
  } as Record<string, string>,
  caption: "Demo account. Names and numbers are made up.",
  flagTitle: "Andrew to confirm",
  /** ⚑ tools have no screen of their own yet: the preview shows the closest one, unmarked. */
  closest: "Closest screen",
  view: "See it",
};

// ─── 1 · Hero (src/site/hero): the demo account's caption ────────────────────────────────────
export const HERO2 = {
  caption: "Demo account. Names and numbers are made up.",
};

/**
 * The hero's jobsite (src/site/hero/fence): the ONE source for the flagging-tape tag (desktop) and
 * the job chip (phones, narrow laptops), and for the crew who clock in on the headline. Demo data
 * of the Cedar Ridge Earthworks account (src/screens/data.ts):
 * - rows: the jobs' short names; Hwy 9 Culvert's number is the canonical one (= One Day's 5:00 PM
 *   moment, src/site/day/states/data.ts). The tag rolls once through the rows and parks back on
 *   the first.
 * - crew: today's clock-ins on Hwy 9 Culvert (data.ts `clockIns`, project p2417): Marcus Bell
 *   (already on the fence), then Elena Ruiz and Jake Lindqvist walk in. The
 *   dev build checks this against data.ts (src/site/hero/fence/engine.ts).
 */
export const HERO_JOBS = {
  rows: [
    { job: "Hwy 9 Culvert", today: "+$4,120 today", tone: "pos" },
    { job: "Maple Ridge Ph. 2", today: "+$2,310 today", tone: "pos" },
    { job: "Elm St Sewer", today: "−$860 today", tone: "neg" },
  ],
  crew: [
    { id: "mb", crewId: "c01", initials: "MB", time: "6:42" },
    { id: "er", crewId: "c02", initials: "ER", time: "6:38" },
    { id: "jl", crewId: "c05", initials: "JL", time: "6:44" },
  ],
  /** under the tag (desktop, one line) */
  note: HERO2.caption,
} as const satisfies {
  rows: readonly { job: string; today: string; tone: "pos" | "neg" }[];
  crew: readonly { id: string; crewId: string; initials: string; time: string }[];
  note: string;
};

// ─── 7 · Andrew + the offer · 8 · FAQ + close · footer ─────────────────────────────────────────
// Owner: offer_faq_footer (src/site/offer, src/site/faq, src/site/footer). Appended block: the
// OFFER / FAQ_TITLE / FOOTER starters above are left as they were. Sources in brackets
// (research/features/TRUTH.md): L = smartcrewhq.com, V = Vercel mockup.

// ─── 1 · Hero, PHONE MODE (round 3: one idea, ≤ 40 words above the button) ─────────────────
// Who it's for rides in the sub (no separate eyebrow line); the demo note lives in the footer;
// the small print is one line. Plain paraphrases of each angle's sub (GREEN, TRUTH.md).
export const HERO_PHONE = {
  sub: {
    profit: "For dirt work contractors: GPS fills in timecards, so you see every job’s profit daily.",
    overbudget: "For dirt work contractors: hours, machine time and materials roll into every job’s profit, daily.",
    timecards: "For dirt work contractors: hours log themselves at the job, on the right cost code.",
    payroll: "For dirt work contractors: hours log themselves at the job, ready for QuickBooks payroll.",
    replace: "For dirt work contractors: GPS fills in timecards, so you see every job’s profit daily.",
  } as Record<Angle, string>,
  micro: `Starts with a ${T.N}-min call with Andrew. No\u00a0contract.`,
  /** ?angle= message match: the one card on the devices says what the ad said (demo data: the
   * profit moment's clock-out, 10h 18m; this week's payroll report, 14 timecards). */
  cards: {
    timecards: { label: "Timecard · Marcus Bell", value: "10h 18m", delta: "Filled in by GPS" },
    payroll: { label: "Payroll · Oct 5 – 9", value: "14 timecards", delta: "Ready for QuickBooks" },
  } as Partial<Record<Angle, { label: string; value: string; delta: string }>>,
};

// ─── 2 · One Day, round 2: the skimmable layer (Day owner's block, src/site/day) ─────────────
// Per moment: a headline of six words or fewer, ONE big state label on each device, and where
// in the app the update card's row comes from. Plain paraphrases of GREEN lines (TRUTH.md:
// clock-in, DOT pre-trips, hauling tickets, repair requests, daily job profit, scheduling,
// timecards → payroll). QuickBooks: AMBER wording only ("ready for QuickBooks", never "sync").
// All names and numbers are the demo company's (caption: DAY_UI.caption).
export const DAY2: Record<MomentId, { headline: string; phone: string; office: string; where: string }> = {
  clockin: { headline: "Clock-in hits the office.", phone: "Clocked in", office: "Marcus · on site 6:42", where: "Dashboard · Clock Ins" },
  pretrip: { headline: "The pre-trip files itself.", phone: "Pre-trip passed", office: "Truck 1102 · inspection on file", where: "Equipment · Mack Granite #1102 · Inspections" },
  load: { headline: "Every load lands on the job.", phone: "Load #14 logged", office: "+12 yd³ on Riverside", where: "Materials · Hauling" },
  leak: { headline: "A leak becomes a work order.", phone: "Leak reported", office: "Work order · CAT D6", where: "Equipment · Service Queue" },
  profit: { headline: "Profit on every job, today.", phone: "Clocked out", office: "+$4,120 today", where: "Projects · Hwy 9 Culvert Replacement" },
  plan: { headline: "Monday's plan, on their phones.", phone: "Monday's plan", office: "Pipe crew · Mon 7:00 AM", where: "Scheduling · October 2026" },
  payroll: { headline: "Payroll without the Friday scramble.", phone: "Timecard submitted", office: "Payroll report ready for QuickBooks", where: "Reports · Timecards" },
};

/** One Day UI bits for round 2 (screen-reader text for the labels; the update card's tag). */
export const DAY2_UI = {
  phoneSr: "On the crew's phone:",
  officeSr: "In the office:",
  /** the profit card's line under the number */
  profitSub: "+$4,120.00 today",
};

// ─── Integrate (round 2): shell, CTAs, logos (owner: integrate; append-only block) ──────────────
/**
 * The contractor logos traced to one-ink SVG (scratchpad design/v2/r2-integrate/trace_logos.py),
 * kept only where the trace is faithful to the mono raster (IoU ≥ 0.97, checked by overlay): JCR,
 * DW (its grey shovel knocked out of the ink block) and Midwest (the grey disc becomes ink, the
 * globe and leaves knocked out). Drish, Rieke and Fireball stay raster (texture, chrome gradient
 * and fine illustration don't survive one-ink tracing). Same aspect ratios as LOGOS. Use
 * `LOGO_VECTORS[l.name] ?? l.src`.
 */
export const LOGO_VECTORS: Record<string, string> = {
  "JCR Excavating": "logos/jcr.svg",
  "DW Companies": "logos/dw.svg",
  "Midwest Erosion Specialists": "logos/midwest.svg",
};

// ─── The bold look's offer lines (src/lib/offer.ts; click-science playbook §7.4 and §8b) ────────────
// The answers at the sign-up form, in the buyer's words (buyer research: the crew's fear is tracking off
// the clock and dead batteries; the office's is QuickBooks and payroll), the trial-first flow and the
// price slots. A line with `flag` isn't approved yet: it shows only on review builds (?review).
export const OFFER = {
  answers: [
    {
      text: "Only tracks your crew while they’re clocked in",
      flag: "Andrew to confirm: location is tracked only while clocked in. Check it against GPS auto clock-in (the geofence has to know when they arrive)",
    },
    /** [L FAQ] "runs in the background without draining batteries" (TRY_IT.facts) */
    { text: "Runs in the background without draining batteries" },
    /** AMBER, the FAQ's wording */
    { text: "QuickBooks integration for payroll" },
    { text: "No contract, cancel anytime" },
  ] as { text: string; flag?: string }[],
  answersLabel: "Before you start",
  price: {
    /** the placeholder a review build shows in each price slot */
    placeholder: "Andrew’s price",
    note: "Andrew to set a price, or a price by crew size (config.pricing)",
    /** popup, under the size chips: "For 6–12 people: $X a month" */
    forSize: (size: string) => `For ${size} people:`,
    /** FAQ "What does it cost?" with a price: the starting figure leads, the original answer's terms follow */
    faqLead: (from: string) => `${from}, depending on your crew size and the features.`,
    faqTail: "No contracts, cancel anytime.",
  },
  trialFirst: {
    note: "Andrew to decide: the free trial starts before the call (config.trialFirst), and how the login reaches them",
    /** popup step 1, under the button's lead-in */
    honest: "Start your free trial today. Andrew can help you set it up on a call, if you want one.",
    /** popup step 2 */
    next: "Next: your free trial, and a time with Andrew if you want help.",
    faq: {
      q: "Do I need a call?",
      a: "No. Start your free trial now. If you want help loading your jobs and trucks, Andrew sets it up with you on a call.",
    },
    /** /book once the trial is on */
    kicker: "Free trial",
    h1Ready: (first: string) => (first ? `${first}, your free trial is ready.` : "Your free trial is ready."),
    h1Coming: (first: string) => (first ? `You’re in, ${first}. Your free trial is on its way.` : "You’re in. Your free trial is on its way."),
    open: "Open SmartCrew",
    login: "Andrew’s team sends your login by email.",
    sub: "Want help loading your jobs and trucks? Pick a time with Andrew below. It’s optional.",
    progress: "Start your trial",
    /** the popup's preview panel: the call row and the note under it */
    previewCall: "Setup help from Andrew",
    previewCallValue: "Optional",
    previewNote: "A preview. Your real SmartCrew comes with your free trial.",
  },
  /** Katie's photo slot under the hero button (config.katiePhoto) */
  katiePhotoNote: "Katie’s photo goes here once she OKs the quote",
};

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
  /** {N}: call length in minutes, must equal the Cal.com event. */
  N: 30,
  /** {PROGRAM} */
  PROGRAM: "Founding Member trial",
  EMAIL: "hello@smartcrewhq.com",
  /** The demo company every screen shows. */
  COMPANY: "Cedar Ridge Earthworks",
  /** The demo crew size the One Day story is told with. */
  CREW: 16,
} as const;

// ─── CTAs (PLAYBOOK §2.0.3) ──────────────────────────────────────────────────
export const CTA = {
  primary: "Get my free trial",
  demo: "Book a demo with Andrew",
  demoLink: "or book a demo with Andrew",
  /** Under the primary button in the hero, the offer and the final CTA. */
  micro: `${T.PROGRAM}. Starts with a ${T.N}-minute call with Andrew. No contract, cancel anytime.`,
  /** One-tap links at the peaks of the One Day scene (profit and payroll moments). */
  inline: "Want this for your crew? Get my free trial",
};

// ─── Header and the phone's sticky bar ──────────────────────────────────────
export const HEADER = {
  logoLabel: "SmartCrew, back to the top",
  nav: [
    { label: "How it works", href: "#day" },
    { label: "FAQ", href: "#faq" },
  ],
  cta: "Get my free trial",
};

export const STICKY = {
  title: T.PROGRAM,
  sub: "Starts with a call with Andrew",
  cta: "Get my free trial",
};

// ─── Intro, "Clock in" (BRIEF §0) ───────────────────────────────────────────
// The intro's first frame is plain HTML in index.html; keep these strings in sync with it.
export const INTRO = {
  site: "Hwy 9 Culvert",
  time: "6:42 AM",
  line: "Marcus just clocked in. Nobody touched a timecard.",
};

// ─── Hero (BRIEF §1, OFFER §4) and ?angle= message match (PLAYBOOK §2.0.5) ──
export type Angle = "profit" | "overbudget" | "timecards" | "payroll" | "replace";

export const ANGLES: Record<Angle, { h1: string; sub: string; moment: MomentId; laptop: "web-project-detail" | "web-timecards" }> = {
  profit: {
    h1: "See what every job is making, every day.",
    sub: "GPS fills in your crew’s timecards and tags every hour to the right job. You see each job’s profit daily, in time to fix it.",
    moment: "profit",
    laptop: "web-project-detail",
  },
  overbudget: {
    h1: "Know which jobs are losing money before it’s too late.",
    sub: "SmartCrew rolls your crew’s hours, machine time and materials into a profit number for every job, updated daily.",
    moment: "profit",
    laptop: "web-project-detail",
  },
  timecards: {
    h1: "Stop chasing timecards.",
    sub: "Hours log themselves when your crew gets to the job, tagged to the right cost code and ready for QuickBooks payroll.",
    moment: "clockin",
    laptop: "web-timecards",
  },
  payroll: {
    h1: "Payroll without the Friday scramble.",
    sub: "Hours log themselves when your crew gets to the job, tagged to the right cost code and ready for QuickBooks payroll.",
    moment: "payroll",
    laptop: "web-timecards",
  },
  replace: {
    h1: "Replace your time app, your spreadsheets and the group texts.",
    sub: "GPS fills in your crew’s timecards and tags every hour to the right job. You see each job’s profit daily, in time to fix it.",
    moment: "profit",
    laptop: "web-project-detail",
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
  /** The laptop's live toast and the job it lands on (Hwy 9 Culvert Replacement, #2417 on the screens). */
  toast: { name: "Marcus Bell", title: "Marcus Bell clocked in", meta: "6:42 AM · Hwy 9 Culvert · Pipe Laying" },
  /** The profit card on web-project-detail reads $57,731.75; the hero ticks it up to this. */
  profitFrom: 57731.75,
  profitTo: 58412.4,
  caption: "Demo account. Names and numbers are made up.",
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
export const DAY = {
  title: `One day at ${T.COMPANY}`,
  sub: `A ${T.CREW}-person dirt crew, from the first clock-in to Friday payroll.`,
};

export const TRY = {
  title: "Your guys won’t fight this one.",
  done: "That’s the whole training.",
  facts: [
    "It runs in the background without draining batteries or being shut down by accident.",
    "No data is shared, so your crew doesn’t have to worry about privacy.",
  ],
};

export const NUMBER = {
  title: "What’s loose time costing you?",
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

export const OFFER = {
  andrew: "No sales team. No BDR. Just Andrew.",
  get: [
    "The full SmartCrew system",
    "Set up with you in a few days, tailored to how you work",
    "Your crew live without training",
    "Andrew on your call",
    "Real humans for support",
    "No contract, cancel anytime",
  ],
  costs: `One ${T.N}-minute call.`,
};

export const FAQ_TITLE = "Questions contractors ask Andrew";

export const FOOTER = {
  trademarks: "Trademarks belong to their owners.",
  xdrCredit: "Apple Pro Display XDR model by polyman Studio, CC-BY-4.0.",
};

// ─── 3 · Try it + 4 · Your number (scene owner: try_number; append-only block) ─
// Try it: GREEN sources: L "No training needed. Just open the app and go.", L 3-step "Clock in →
// Select your task → Clock out", L FAQ (battery, privacy). The prompts are UI instructions, not claims.
export const TRY_IT = {
  title: TRY.title,
  /** Desktop, next to the 3D phone, before the tap. */
  prompt: "This is what your crew sees. Tap Clock In.",
  /** The instruction at the end of the prompt, set in ink. */
  promptTap: "Tap Clock In.",
  /** Phone, above the app before it goes full screen. */
  promptPhone: "This is what your crew sees. Scroll, then tap Clock In.",
  done: TRY.done,
  doneSub: "Your crew gets this.",
  /** The two quiet facts (L FAQ), split so the first words can carry the weight. */
  facts: [
    { lead: "It runs in the background", rest: "without draining batteries or being shut down by accident." },
    { lead: "No data is shared,", rest: "so your crew doesn’t have to worry about privacy." },
  ],
  /** The jobsite's geofence tag (same job as the intro and the phone screen). */
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
  minutesLabel: "Minutes lost per person, per day",
  minutes: [5, 10, 15, 20, 30],
  hint: NUMBER.hint,
  rateLabel: "Hourly cost per field employee",
  rateNote: "wage + taxes + insurance",
  rates: [25, 35, 45, 55],
  days: 250,
  daysLabel: "workdays a year (edit if different)",
  /** Before all three inputs are set. */
  pending: "Set your crew, minutes and hourly cost.",
  year: "a year",
  /** "about $561 a week" */
  week: (w: string) => `about ${w} a week`,
  framing: "That’s what loose time costs you at the numbers you picked.",
  built: "SmartCrew is built to close this gap: GPS fills in the timecards and every hour goes on a cost code.",
  /** ⚑ Andrew confirms he opens the call with the visitor's number (PLAYBOOK S3). */
  ctaMicro: "Andrew will go over your number with you on the call.",
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
    /** The figure as it appears in the quote ("~" kept). Rolls up from $0k as it enters. */
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
// The moments, titles, outcomes and features themselves live in moments.ts. These are the
// scene's own labels and the two bits of demo UI it draws onto the device screens.
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
  /** the cursor's loupe tags over the two screens */
  office: "Office",
  crewApp: "Crew app",
  /** quiet caption under the devices (PLAYBOOK §8.1 rule 2) */
  caption: "Demo account. Names and numbers are made up.",
  /** Friday: toast on the office screen as the timecards land. AMBER: says only that the hours
   * are ready for QuickBooks payroll ("QuickBooks integration for payroll", L); never "sync". */
  payrollToast: { title: "Payroll hours ready for QuickBooks", meta: "Sep 28 – Oct 4 · 14 timecards", time: "now" },
  /** 5:30 PM: the crew's phone gets Monday (demo data: web-scheduling, Mon Oct 12, p2409) */
  planSheet: {
    title: "Monday, Oct 12",
    sub: "Your next job",
    rows: [
      ["Project", "Riverside Storm Sewer"],
      ["Activity code", "Pipe Laying"],
      ["Hours", "6:30 AM – 3:00 PM"],
      ["Crew", "Andre Whitfield, Tomás Ortega"],
    ] as [string, string][],
    done: "Got it",
  },
};

// ─── 7 · Andrew + the offer · 8 · FAQ + close · footer ─────────────────────────────────────────
// Owner: offer_faq_footer (src/site/offer, src/site/faq, src/site/footer). Appended block: the
// OFFER / FAQ_TITLE / FOOTER starters above are left as they were. Sources in brackets
// (research/features/TRUTH.md): L = smartcrewhq.com, V = Vercel mockup.

export const ANDREW = {
  name: "Andrew Drish",
  role: "founder",
  photo: "andrew/andrew-cutout.webp",
  /** A small round crop of the same photo, for "Andrew answers" beside the FAQ. */
  face: "andrew/andrew-face.webp",
  /** ⚑ The only cut-out we have is 456×420 px (soft on retina). Andrew sends a real field photo. */
  photoAlt: "Andrew Drish, founder of SmartCrew",
  /** [V] verbatim. */
  title: OFFER.andrew,
  /** Three lines condensed from his founder letter [L] (first person, his words, shortened). */
  story: [
    "At 13, my dad put me in a trench and handed me a shovel.",
    "Then I spent 20 years in the tech world.",
    "When my family’s company needed better software, I built SmartCrew.",
  ],
};

/** The offer as a receipt (BRIEF §7, beat 8; PLAYBOOK §3.5). Every unflagged line is GREEN. */
export const RECEIPT = {
  aria: `Your ${T.PROGRAM}, as a receipt`,
  title: T.PROGRAM,
  get: "What you get",
  included: "Included",
  items: [
    { item: "The full SmartCrew system", sub: "Crew app + office" },
    { item: "Set up with you in a few days", sub: "Tailored to how you work" },
    { item: "Your crew on it without training" },
    { item: "Andrew on your call" },
    { item: "Real humans for support" },
    { item: "No contract, cancel anytime" },
  ] as { item: string; sub?: string }[],
  costs: "What it costs you",
  call: `One ${T.N}-minute call`,
  callValue: `${T.N} min`,
  /** "Free Trial" is Andrew's own CTA [L, A-ad]; no trial length, no card terms (RED). */
  total: "To try it",
  totalValue: "$0",
  /**
   * PLAYBOOK §3.4 proposals, shown only as visibly flagged placeholders until Andrew approves
   * (P4 founding rate, P1 reason why, P2 capacity, P3 guarantee). false hides every one of them.
   */
  showProposals: true,
  proposalItem: "Founding rate, locked while you stay",
  proposalWhy: "Why it’s free: [Andrew’s reason]",
  proposalNotes: ["[N] new setups a month", "Guarantee: [name + terms]"],
  signedBy: "Andrew Drish, founder",
  signatureAlt: "Signed, Andrew",
};

/** Section 8 (PLAYBOOK §S8): answers start with the fact; GREEN/AMBER only. */
export const FAQS: { id: string; q: string; a: string; flag?: string }[] = [
  {
    id: "why-call",
    q: "Why a call?",
    a: "Because we set your trial up around how you already work. On the call, Andrew shows you how SmartCrew fits your company, or tells you honestly if it doesn’t. Then he sets up your Founding Member trial.",
    /** P1: Andrew adds his own reason the trial is free and set up on a call. */
    flag: "Andrew’s own reason goes here",
  },
  {
    id: "crew",
    q: "Will my crew actually use it?",
    a: "Yes. Clocking in is one tap, and the app runs in the background without draining batteries. No training needed: most crews are up and running within minutes.",
  },
  {
    id: "quickbooks",
    q: "Does it work with QuickBooks?",
    // AMBER: "QuickBooks integration for payroll" only, until Andrew confirms how it syncs
    a: "Yes. SmartCrew has QuickBooks integration for payroll. Andrew will show you how it fits your setup on the call.",
  },
  {
    id: "setup",
    q: "How long does setup take?",
    // L FAQ, with "tailored to your exact workflow" put plainly (PLAYBOOK §8.2 avoids "workflow")
    a: "Most companies are fully set up within a few days. We’ll walk you through onboarding and set your account up around how you already work.",
  },
  {
    id: "cost",
    q: "What does it cost?",
    a: "It depends on the features and your crew size. Andrew goes over it with you on the call. No contracts, cancel anytime.",
  },
];

export const FAQ_CLOSE = {
  line: "Anything else, Andrew answers on the call.",
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
    "busybusy, QuickBooks, ExactTime, fleet.io, HubSpot, Close, Dropbox, Google Drive, Slack and WhatsApp are trademarks of their owners. Apple, iPhone and MacBook are trademarks of Apple Inc. Naming them doesn’t imply an endorsement.",
  /** Shown only when the Stage actually uses the Pro Display XDR model. */
  xdr: FOOTER.xdrCredit,
  copyright: "© 2026 SmartCrew",
};

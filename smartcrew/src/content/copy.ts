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

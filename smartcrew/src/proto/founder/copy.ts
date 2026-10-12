// One style sheet for every string on the page. Tokens marked ⚑ still need Andrew's yes
// (PLAYBOOK §0 tokens); change them here and every section follows.

export const T = {
  /** ⚑ the company-size range. Must match the ad. */
  SIZE: "5–100",
  /** ⚑ call length in minutes. Must equal the Cal.com event. Playbook recommends 30. */
  N: 30,
  PROGRAM: "Founding Member trial",
  EMAIL: "hello@smartcrewhq.com",
} as const;

export type Angle = "profit" | "overbudget" | "timecards" | "payroll" | "replace";

/** Hero copy per ?angle= (PLAYBOOK §2.0.5 / §4). GREEN-derived lines only. */
export const HERO: Record<Angle, { h1: string; sub: string; feature: string }> = {
  profit: {
    h1: "See what every job is making, every day.",
    sub: "GPS fills in your crew's timecards and tags every hour to the right job. You see each job's profit daily, in time to fix it.",
    feature: "M1",
  },
  overbudget: {
    h1: "Know which jobs are losing money before it's too late.",
    sub: "SmartCrew rolls your crew's hours, machine time and materials into a profit number for every job, updated daily.",
    feature: "M1",
  },
  timecards: {
    h1: "Stop chasing timecards.",
    sub: "Hours log themselves when your crew gets to the job, tagged to the right cost code and ready for QuickBooks payroll.",
    feature: "T2",
  },
  payroll: {
    h1: "Payroll without the Friday scramble.",
    sub: "Crew hours land on the right job and cost code every day, then go to QuickBooks for payroll. Nobody types them twice.",
    feature: "M4",
  },
  replace: {
    h1: "Replace your time app, your spreadsheets and the group texts.",
    sub: "SmartCrew puts the crew, the machines and the job costs in one app, with a QuickBooks integration for payroll.",
    feature: "M1",
  },
};

export function readAngle(): Angle {
  try {
    const a = new URLSearchParams(location.search).get("angle");
    if (a && a in HERO) return a as Angle;
  } catch {
    /* no location in some previews */
  }
  return "profit";
}

export const MICRO = `${T.PROGRAM}. Starts with a ${T.N}-minute call with Andrew. No contract, cancel anytime.`;

export const CREW_BUCKETS = ["1–5", "6–20", "21–50", "51–100", "100+"] as const;
export type Bucket = (typeof CREW_BUCKETS)[number];

export function bucketFor(people: number): Bucket {
  if (people <= 5) return "1–5";
  if (people <= 20) return "6–20";
  if (people <= 50) return "21–50";
  if (people <= 100) return "51–100";
  return "100+";
}

export type Intent = "trial" | "demo";
export type OpenSignup = (o: { intent: Intent; source: string; size?: Bucket; calc?: CalcResult }) => void;

export type CalcResult = { crew: number; minutes: number; rate: number; days: number; annual: number };

/** Dev-only event log (the real page sends these to GA4 / the pixel, PLAYBOOK §7.2). */
export function track(event: string, props: Record<string, unknown> = {}) {
  if (import.meta.env.DEV) console.debug("[track]", event, props);
}

export const money = (n: number) => "$" + Math.round(n).toLocaleString("en-US");

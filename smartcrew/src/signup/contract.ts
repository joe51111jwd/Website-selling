// The one way any part of the page opens the trial popup. Decoupled through a DOM event so a
// scene never imports the popup itself: call openSignup({...}) and src/signup/Signup.tsx listens.

export type Intent = "trial" | "demo";

/** Employee-count buckets, as Andrew's sign-up form asks them (non-overlapping; en dashes on screen). */
export const SIZES = ["1–5", "6–12", "13–25", "26–50", "51–100", "101–250", "250+"] as const;
export type Size = (typeof SIZES)[number];

/** The visitor's own "loose time" estimate from the calculator, carried to the lead and /book. */
export type Estimate = { crew: number; minutes: number; rate: number; days: number; annual: number };

export type SignupRequest = {
  intent: Intent;
  /** Where on the page it was opened from (hero, sticky, day-profit, calculator, apps, offer, faq…). */
  source: string;
  size?: Size;
  estimate?: Estimate;
};

const EVENT = "smartcrew:signup";

export function openSignup(req: SignupRequest) {
  window.dispatchEvent(new CustomEvent<SignupRequest>(EVENT, { detail: req }));
}

export function onSignup(fn: (req: SignupRequest) => void) {
  const h = (e: Event) => fn((e as CustomEvent<SignupRequest>).detail);
  window.addEventListener(EVENT, h);
  return () => window.removeEventListener(EVENT, h);
}

/** Crew count → bucket, for pre-filling step 1 from the calculator (its slider goes up to 100). */
export function sizeFor(crew: number): Size {
  if (crew <= 5) return "1–5";
  if (crew <= 12) return "6–12";
  if (crew <= 25) return "13–25";
  if (crew <= 50) return "26–50";
  if (crew <= 100) return "51–100";
  if (crew <= 250) return "101–250";
  return "250+";
}

/** A size saved by an older build ("6–20") isn't one of today's buckets: treat it as unpicked. */
export const isSize = (v: unknown): v is Size => typeof v === "string" && (SIZES as readonly string[]).includes(v);

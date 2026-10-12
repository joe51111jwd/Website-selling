// The one way any part of the page opens the trial popup. Decoupled through a DOM event so a
// scene never imports the popup itself: call openSignup({...}) and src/signup/Signup.tsx listens.

export type Intent = "trial" | "demo";

/** Crew-size buckets (non-overlapping; smartcrewhq.com's old form had overlapping ones). */
export const SIZES = ["1–5", "6–20", "21–50", "51–100", "100+"] as const;
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

/** Crew count → bucket, for pre-filling step 1 from the calculator. */
export function sizeFor(crew: number): Size {
  if (crew <= 5) return "1–5";
  if (crew <= 20) return "6–20";
  if (crew <= 50) return "21–50";
  if (crew <= 100) return "51–100";
  return "100+";
}

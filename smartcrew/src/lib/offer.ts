// The two offer switches only Andrew can decide (click-science playbook §8b): a price on the page, and
// the free trial before the call. Both are built and off (src/config.ts), and both live in the bold look
// only, so classic (Andrew's link), glass and focus never change.
//
// A review build (?review, src/lib/flags.ts) shows where they go before Andrew fills them in: each price
// slot carries a ⚑ placeholder, and ?trial=first turns the trial-first flow on for the visit (it sticks,
// so the popup and /book follow it; ?trial=call turns it back off).

import { config } from "../config";
import { SHOW_FLAGS } from "./flags";
import { BOLD } from "./look";

const TRIAL_KEY = "sc-trial";

function trialAsked(): boolean {
  if (!SHOW_FLAGS || typeof window === "undefined") return false;
  const q = new URLSearchParams(location.search).get("trial");
  try {
    if (q === "first" || q === "call") sessionStorage.setItem(TRIAL_KEY, q);
    return sessionStorage.getItem(TRIAL_KEY) === "first";
  } catch {
    return q === "first";
  }
}

/** The trial starts before the call; the call becomes optional setup help. */
export const TRIAL_FIRST = BOLD && (config.trialFirst || trialAsked());

const P = config.pricing;
/** Andrew has set a price. */
export const PRICED = BOLD && !!P && !!(P.from || (P.bands && Object.keys(P.bands).length));
/** The price slots show: with Andrew's price, or with a ⚑ placeholder on a review build. */
export const PRICE_SLOTS = BOLD && (PRICED || SHOW_FLAGS);

const per = () => (P?.per ? ` ${P.per}` : "");

/** "$X a month" for a crew-size band ("6–12"), falling back to "From $X a month"; null with no price. */
export function priceFor(size: string): string | null {
  if (!PRICED || !P) return null;
  const band = size && P.bands?.[size];
  if (band) return `${band}${per()}`;
  return P.from ? `From ${P.from}${per()}` : null;
}

/** "From $X a month", or null when Andrew set no starting figure. */
export function priceFrom(): string | null {
  return PRICED && P?.from ? `From ${P.from}${per()}` : null;
}

/** Every band Andrew priced, in the popup's order, for the FAQ's answer. */
export function priceBands(order: readonly string[]): { size: string; price: string }[] {
  if (!PRICED || !P?.bands) return [];
  return order.filter((s) => P.bands![s]).map((s) => ({ size: s, price: `${P.bands![s]}${per()}` }));
}

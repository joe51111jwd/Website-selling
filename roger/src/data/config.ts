// Stand-in for the parts of src/data/config.ts the marketing pages read.
// In Peter's repo these merge into the existing siteConfig and the `settings` table (spec 0.9).
export const siteConfig = {
  name: "Roger",
  url: "https://meetroger.ai",
  contactEmail: "hello@meetroger.ai",
  city: "Toronto",
  flags: {
    v3Mode: true,
    /** B2: the weekly group session line. Off until Peter confirms day, time and link. */
    groupSession: false,
    /** B2: the Wednesday stats email. Off until it ships. */
    statsEmail: false,
  },
  v3: {
    priceUsd: 200,
    priceCad: 280,
    priceRunUsd: 100,
    priceRunCad: 140,
    priceHigherUsd: 400,
    priceHigherCad: 560,
    freeRuns: 2,
    playbookPreface:
      "I want you to take this document, and update it so that it works for my agent system and then install the playbook, asking me questions as needed.",
  },
} as const;

export type Currency = "USD" | "CAD";
export type StartPath = "re" | "agents";

export function prices(cur: Currency) {
  const v = siteConfig.v3;
  return cur === "CAD"
    ? { symbol: "CA$", code: "CAD", monthly: v.priceCad, list: v.priceRunCad, tax: "plus HST" }
    : { symbol: "US$", code: "USD", monthly: v.priceUsd, list: v.priceRunUsd, tax: "plus tax where it applies" };
}

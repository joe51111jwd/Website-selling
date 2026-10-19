// Your number's arithmetic (OFFER.md §6). This only multiplies: people × minutes a day ÷ 60 ×
// workdays × hourly cost. Nothing here is a claim.

/** Andrew's doc: "cap it at 100 people". */
export const CREW_MAX = 100;
export const DAYS_DEFAULT = 250;
/** Round 4 (James: show a number at once): a starting crew, minutes and hourly cost, so a real
 * figure is there before any input; the visitor changes them to theirs. Only the inputs they touch
 * travel with the lead (see `mine`). Andrew's round 2 defaults: 15 people, 30 minutes, $30. */
export const PRESET = { crew: 15, minutes: 30, rate: 30 } as const;

export type Inputs = { crew: number | null; minutes: number | null; rate: number | null; days: number | null };

/** The yearly cost of loose time, or null until every input is set. */
export function annualCost({ crew, minutes, rate, days }: Inputs) {
  if (!crew || !minutes || !rate || !days) return null;
  return (crew * minutes * days * rate) / 60;
}

// one cached formatter: toLocaleString() builds a new one on every call (slow on phones)
const INT = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });

/** 48125 → "48,125" */
export const grouped = (n: number) => INT.format(Math.round(n));

export const money = (n: number) => "$" + grouped(n);

/** "about $561 a week" uses 52 weeks (the yearly figure ÷ 52). */
export const weekly = (annual: number) => annual / 52;

/** Workdays field: whole days 1–366, else null (the result waits). */
export function parseDays(s: string) {
  const n = Number(s.replace(/[^\d]/g, ""));
  return Number.isFinite(n) && n >= 1 && n <= 366 ? Math.round(n) : null;
}

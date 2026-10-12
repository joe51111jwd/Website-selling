// Your number's arithmetic (OFFER.md §6). The visitor supplies every input; this only multiplies:
// people × minutes a day ÷ 60 × workdays × hourly cost. Nothing here is a claim.

export const CREW_MAX = 150;
export const DAYS_DEFAULT = 250;

export type Inputs = { crew: number | null; minutes: number | null; rate: number | null; days: number | null };

/** The yearly cost of loose time, or null until every input is set. */
export function annualCost({ crew, minutes, rate, days }: Inputs) {
  if (!crew || !minutes || !rate || !days) return null;
  return (crew * minutes * days * rate) / 60;
}

export const money = (n: number) => "$" + Math.round(n).toLocaleString("en-US");

/** "about $561 a week" uses 52 weeks (the yearly figure ÷ 52). */
export const weekly = (annual: number) => annual / 52;

/** Workdays field: whole days 1–366, else null (the result waits). */
export function parseDays(s: string) {
  const n = Number(s.replace(/[^\d]/g, ""));
  return Number.isFinite(n) && n >= 1 && n <= 366 ? Math.round(n) : null;
}

// Number and time formatting in the exact styles the SmartCrew app prints.

const usd2 = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 2 });
const usd0 = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0, maximumFractionDigits: 0 });
const int = new Intl.NumberFormat("en-US");

/** "$6,866.22" (default) or "$1,650,500" with `{ cents: false }`. Negative → "-$1,204.50". */
export function money(n: number, opts: { cents?: boolean } = {}): string {
  const f = opts.cents === false ? usd0 : usd2;
  return n < 0 ? `-${f.format(-n)}` : f.format(n);
}

/** "1,250" */
export function num(n: number): string {
  return int.format(n);
}

/** Percent with two decimals and no trailing zeros the way the budget cards print it: 23.9 → "23.90%", 0 → "0%". */
export function pct(n: number, digits = 2): string {
  if (n === 0) return "0%";
  return `${n.toFixed(digits)}%`;
}

/** Dashboard style "6866h 13m" (no thousands separator, minutes not padded). 0 → "0h". */
export function hm(minutes: number): string {
  const m = Math.round(minutes);
  const h = Math.floor(m / 60);
  const r = m % 60;
  if (h === 0 && r === 0) return "0h";
  if (r === 0) return `${h}h`;
  if (h === 0) return `${pad(r)}m`;
  return `${h}h ${pad(r)}m`;
}

/** Timecard style "05h 22m" / "10h" / "112h 47m" (hours padded to 2, minutes padded). */
export function hmPad(minutes: number): string {
  const m = Math.round(minutes);
  const h = Math.floor(m / 60);
  const r = m % 60;
  if (r === 0) return `${pad(h)}h`;
  return `${pad(h)}h ${pad(r)}m`;
}

/** Phone weekly summary style "8 Hrs 48 Mins". */
export function hrsMins(minutes: number): string {
  const m = Math.round(minutes);
  return `${Math.floor(m / 60)} Hrs ${m % 60} Mins`;
}

/** Running timer "02h 14m 36s" (phone "Currently working on"). */
export function timer(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${pad(h)}h ${pad(m)}m ${pad(s)}s`;
}

/** Live-site clock style "01: 20: 46". */
export function clockColon(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${pad(h)}: ${pad(m)}: ${pad(s)}`;
}

export function pad(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTHS_LONG = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function parts(iso: string) {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return { y, m, d, dow: dt.getUTCDay() };
}

/** "2026-10-09" → "Oct 9, 2026" (dashboard "Last clock in" style). */
export function dateShort(iso: string): string {
  const { y, m, d } = parts(iso);
  return `${MONTHS[m - 1]} ${d}, ${y}`;
}

/** "2026-10-09" → "Oct 09, 2026" (materials Delivery style). */
export function datePad(iso: string): string {
  const { y, m, d } = parts(iso);
  return `${MONTHS[m - 1]} ${pad(d)}, ${y}`;
}

/** "2026-10-09" → "10/09/2026" (pipeline "Close:" style). */
export function dateSlash(iso: string): string {
  const { y, m, d } = parts(iso);
  return `${pad(m)}/${pad(d)}/${y}`;
}

/** "2026-10-09" → "9 October 2026" (inspection date style, add "; 10:50 PM" yourself). */
export function dateLong(iso: string): string {
  const { y, m, d } = parts(iso);
  return `${d} ${MONTHS_LONG[m - 1]} ${y}`;
}

/** "2026-10-09" → "Fri" */
export function weekday(iso: string): string {
  return DAYS[parts(iso).dow];
}

export function monthName(iso: string, long = true): string {
  const { m } = parts(iso);
  return long ? MONTHS_LONG[m - 1] : MONTHS[m - 1];
}

/** Initials from a name: "Marcus Bell" → "MB", "Kevin J. Wyatt" → "KW". */
export function initials(name: string): string {
  const w = name.replace(/[^A-Za-zÀ-ÿ' -]/g, "").split(/\s+/).filter((s) => s.length > 1 || /[A-Z]/.test(s));
  if (w.length === 0) return "?";
  if (w.length === 1) return w[0][0].toUpperCase();
  return (w[0][0] + w[w.length - 1][0]).toUpperCase();
}

import { config } from "../config";
import type { Booking } from "../lib/lead";

// After booking: the time in the visitor's own words and zone, and the files that put the call
// in his calendar and Andrew's number in his phone. Everything is built in the browser.

const TITLE = "SmartCrew call with Andrew Drish";

export function when(b: Booking) {
  const s = new Date(b.start);
  const e = b.end ? new Date(b.end) : null;
  const day = new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric" }).format(s);
  const t = new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" });
  let time = t.format(s);
  if (e) {
    try {
      time = (t as Intl.DateTimeFormat & { formatRange: (a: Date, b: Date) => string }).formatRange(s, e);
    } catch {
      time = `${t.format(s)} – ${t.format(e)}`;
    }
  }
  let zone = "";
  for (const style of ["longGeneric", "short"] as const) {
    try {
      zone = new Intl.DateTimeFormat("en-US", { timeZoneName: style }).formatToParts(s).find((p) => p.type === "timeZoneName")?.value ?? "";
      if (zone) break;
    } catch {
      /* older engines don't know longGeneric */
    }
  }
  return { day, time: time.replace(/\u202f/g, " ").replace(" – ", "–"), zone };
}

const utc = (iso: string) => new Date(iso).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
const endOf = (b: Booking) => b.end ?? new Date(Date.parse(b.start) + 30 * 60e3).toISOString();

const details = () =>
  [
    "Your Founding Member trial setup call with Andrew Drish, founder of SmartCrew.",
    "Have these handy: your crew count, how you do timecards today, and your last payroll.",
    "Need a different time? Use the link in your confirmation email.",
  ].join("\n");

export function googleUrl(b: Booking) {
  const q = new URLSearchParams({ action: "TEMPLATE", text: TITLE, dates: `${utc(b.start)}/${utc(endOf(b))}`, details: details() });
  return `https://calendar.google.com/calendar/render?${q}`;
}

const esc = (s: string) => s.replace(/\\/g, "\\\\").replace(/;/g, "\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");

function download(name: string, type: string, body: string) {
  const url = URL.createObjectURL(new Blob([body], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 4000);
}

export function downloadIcs(b: Booking) {
  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//SmartCrew//Book a call//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${b.uid ?? Date.parse(b.start)}@smartcrewhq.com`,
    `DTSTAMP:${utc(new Date().toISOString())}`,
    `DTSTART:${utc(b.start)}`,
    `DTEND:${utc(endOf(b))}`,
    `SUMMARY:${esc(TITLE)}`,
    `DESCRIPTION:${esc(details())}`,
    "BEGIN:VALARM",
    "TRIGGER:-PT30M",
    "ACTION:DISPLAY",
    `DESCRIPTION:${esc(TITLE)}`,
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
  download("smartcrew-call.ics", "text/calendar;charset=utf-8", ics);
}

/** Andrew's contact card. ⚑ Carries his number once config.andrewPhone is set; his email until then. */
export function downloadVcf() {
  const vcf = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    "N:Drish;Andrew;;;",
    "FN:Andrew Drish (SmartCrew)",
    "ORG:SmartCrew",
    "TITLE:Founder",
    ...(config.andrewPhone ? [`TEL;TYPE=CELL:${config.andrewPhone}`] : []),
    `EMAIL;TYPE=WORK:${config.email}`,
    "URL:https://smartcrewhq.com",
    "END:VCARD",
  ].join("\r\n");
  download("andrew-drish-smartcrew.vcf", "text/vcard;charset=utf-8", vcf);
}

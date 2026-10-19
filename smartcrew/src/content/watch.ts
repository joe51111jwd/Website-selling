// "Watch it work", round 5 (Andrew's Oct 19 doc, "A Day In The Life Section"): the day broken into
// three tabs, The Day (for the crews), The Week (for the admins) and The Results (for the owners),
// each with its own headline, sub, list of features and button. Every line below is his, copied
// as written (his capitals, em dashes and punctuation; the doc's line wraps joined with a space).
// Item titles are his "<time or feature> — <headline>"; the section shows the part before the em
// dash small on The Day (round 1: "lead with feature headlines instead of the time of day").
// The only words not from the doc: the section's accessible name, the tab list's (his section
// name) and the demo caption (copy.ts DAY_UI.caption).

import { DAY_UI } from "./copy";

export type WatchTabId = "day" | "week" | "results";

export type WatchItem = {
  /** stable key: the section maps it to an icon and the app screens it shows (src/site/watch) */
  id: string;
  /** his item heading as written: "<time or feature> — <headline>" */
  title: string;
  /** his line under it */
  line: string;
};

export type WatchTab = {
  id: WatchTabId;
  /** the tab: its name, and who it's for */
  name: string;
  who: string;
  /** the panel: small eyebrow, headline, sub */
  eyebrow: string;
  headline: string;
  sub: string;
  items: WatchItem[];
  /** the panel's button and its intent; no label: the primary CTA ("Get my free trial") */
  cta: { label?: string; intent: "trial" | "demo" };
};

export const WATCH = {
  /** the section's accessible name */
  label: "Watch it work",
  title: "Watch How It Works For The Crew, The Admins And The Owners",
  /** the tab list's accessible name (his name for the section) */
  tabsLabel: "A Day In The Life",
  caption: DAY_UI.caption,
  tabs: [
    {
      id: "day",
      name: "The Day",
      who: "For the Crews",
      eyebrow: "THE DAY",
      headline: "Do less paperwork. Get more done.",
      sub: "From the first clock-in to the end of the day, everything your crew and supervisors need right on their phones.",
      items: [
        { id: "plan", title: "6:30 AM — Know the plan before you start.", line: "Today's schedule, job locations, and crew assignments. Right on your phone." },
        { id: "clockin", title: "7:00 AM — Clock in. Get to work.", line: "GPS-powered timecards automatically tied to jobs and cost codes." },
        { id: "inspect", title: "7:30 AM — Inspections without the paper.", line: "Complete pre-trip inspections and equipment checklists in seconds." },
        { id: "loads", title: "9:20 AM — Every receipt, load and fuel log accounted for.", line: "Log materials, hauling tickets, and fuel right from the field." },
        { id: "chat", title: "10:15 AM — Group messaging to keep everyone in the loop.", line: "Instant messaging keeps crews, supervisors, and the office connected." },
        { id: "change", title: "11:30 AM — Change orders submitted with one click.", line: "Submit change orders with photos, notes, and details before they're forgotten." },
        { id: "breakdown", title: "2:15 PM — Track equipment breakdowns with ease.", line: "Report equipment issues and send repair requests straight to the shop." },
        { id: "report", title: "4:00 PM — Submit daily reports with photos and voice notes.", line: "Submit photos, project updates, materials, and more with ease." },
        { id: "clockout", title: "6:00 PM — Clock out. You're done.", line: "Hours, equipment time, and daily reports captured. No paperwork to chase." },
      ],
      cta: { intent: "trial" },
    },
    {
      id: "week",
      name: "The Week",
      who: "For the Admins",
      eyebrow: "THE WEEK",
      headline: "Your entire operation. Finally organized.",
      sub: "Your people, projects, equipment, and paperwork. All connected, all in one place.",
      items: [
        { id: "scheduling", title: "Scheduling — Plan the week in minutes.", line: "Schedule crews, equipment, and jobs from one simple calendar." },
        { id: "dispatch", title: "Dispatch — Send the plan. Everyone gets it.", line: "Push notifications put assignments and updates right on your crew's phones." },
        { id: "crew", title: "Crew Management — Know who's working where.", line: "See live crew locations, hours, and job assignments without making a call." },
        { id: "changes", title: "Change Orders — Don't let extra work go unpaid.", line: "Review, price, approve, and track change orders from start to finish." },
        { id: "bids", title: "Bids & Deals — Track your pipeline to never lose a deal again.", line: "Track opportunities, manage bids, and move deals from prospect to project." },
        { id: "shop", title: "Shop Management — Keep your iron running.", line: "Manage repairs, maintenance schedules, work orders, and equipment history." },
        { id: "projects", title: "Project Management — Keep every job on track.", line: "Monitor progress, review daily reports, and keep your projects organized." },
        { id: "payroll", title: "Payroll — Get your Fridays back.", line: "Review and approve timecards. Export payroll without the weekly scramble." },
        { id: "pto", title: "PTO — Know who's available.", line: "Manage time-off requests and approvals before they disrupt your schedule." },
      ],
      cta: { label: "See SmartCrew in Action", intent: "demo" },
    },
    {
      id: "results",
      name: "The Results",
      who: "For the Owners",
      eyebrow: "THE RESULTS",
      headline: "Know your numbers. Grow your profits.",
      sub: "Know your numbers. Stay organized. Grow your profits. Everything you need to run a better business, all connected.",
      items: [
        { id: "costing", title: "Real-Time Job Costing — Know your profit. Every day.", line: "Track labor, equipment, and material costs against your budget as work happens." },
        { id: "materials", title: "Materials & Documentation — Every ticket. Every receipt. Organized.", line: "Hauling tickets, material quantities, receipts, photos, and reports. All tied to the right jobs." },
        { id: "fleet", title: "Shop & Equipment — Your entire fleet. Under control.", line: "Maintenance records, inspections, repair history, and work orders organized for every machine." },
        { id: "pipeline", title: "Pipeline & Bids — Know what's coming next.", line: "Track your bids, deals, and sales pipeline so you always know where future work stands." },
        { id: "payroll", title: "Payroll — Payroll without the Friday scramble.", line: "Accurate hours, organized cost codes, and payroll-ready reports in a few clicks." },
        { id: "safety", title: "Safety & Compliance — Stay safe. Stay compliant.", line: "Keep safety inspections, incident reports, toolbox talks, and compliance records organized." },
        { id: "docs", title: "Document Storage — Every file. Right where you need it.", line: "Keep contracts, permits, plans, and important documents organized and accessible in one place." },
      ],
      // no button in his copy for this tab: the primary
      cta: { intent: "trial" },
    },
  ] satisfies WatchTab[] as WatchTab[],
};

/** An item's title split at its em dash: the lead (a time on The Day, a feature elsewhere) and the headline. */
export function splitTitle(title: string) {
  const i = title.indexOf(" — ");
  return i < 0 ? { lead: "", head: title } : { lead: title.slice(0, i), head: title.slice(i + 3) };
}

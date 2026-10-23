import type { SeoPage } from "../../types";

export const page: SeoPage = {
  kind: "feature",
  slug: "features/crew-communication-app",
  nav: "Crew chat",
  keyword: "construction crew communication app",
  updated: "2026-10-22",
  title: "Construction Crew Communication App | SmartCrew",
  description:
    "How a dirt work company moves dispatch, crew chat and job messages out of group texts and into job-specific channels tied to the schedule and the job.",
  eyebrow: "Crew communication",
  h1: "A crew communication app for dirt work contractors",
  lede:
    "A construction crew communication app replaces group texts with dispatch alerts, crew messaging and a chat channel for each job, so the right people get the message and it stays on the job record. SmartCrew includes crew communication in the same app the crew already uses to clock in: instant dispatch alerts, team and crew messaging, job-specific chat channels and company announcements. It is built for heavy civil and dirt work companies with 5 to 100 people.",
  summary: [
    "Group texts mix every job together, leave out the new hire and vanish when someone changes phones.",
    "SmartCrew gives each job its own chat channel, plus crew messaging, dispatch alerts and company announcements.",
    "Messages sit in the same app as time, schedules and daily reports, so the crew opens one app, not three.",
    "Crew Communication is part of the Scheduling & Communications Premium category.",
  ],
  hero: [{ id: "web-messaging" }, { id: "phone-messages" }],
  blocks: [
    { t: "h2", text: "Why do group texts fail a dirt work crew?" },
    {
      t: "p",
      text: "Group texts fail because one thread carries every job, every crew and every joke, so the message that matters gets buried. The foreman texts that the pipe delivery moved to 7 a.m. Twelve replies later, the operator who needed it is still driving to the yard at 6:30 to load the excavator for a job that changed.",
    },
    {
      t: "p",
      text: "Texts also live on personal phones. When a laborer quits, the history leaves with him. When a new hire starts, nobody adds him to the right thread. And when a customer disputes what was agreed on site, the proof is somewhere in a foreman's camera roll.",
    },
    {
      t: "table",
      caption: "Group text and WhatsApp compared with SmartCrew crew communication",
      head: ["Job to do", "Group text or WhatsApp", "SmartCrew"],
      rows: [
        ["Tell one crew the plan changed", { mark: "partial", note: "Everyone in the thread gets it, or the right person misses it." }, { mark: "yes", note: "Dispatch with instant alerts to the people on the job." }],
        ["Keep talk about one job in one place", { mark: "no", note: "One thread per group of people, not per job." }, { mark: "yes", note: "A chat channel for each job." }],
        ["Reach the whole company", { mark: "partial", note: "Only if everyone is in the big group." }, { mark: "yes", note: "Company announcements." }],
        ["Tie the message to the schedule", { mark: "no" }, { mark: "yes", note: "Schedule updates and notifications from scheduling." }],
      ],
      note: "Feature availability varies by plan. Fleet Management, Sales CRM, and Scheduling & Communications are Premium categories.",
    },

    { t: "h2", text: "How does SmartCrew crew communication work?" },
    {
      t: "p",
      text: "SmartCrew crew communication works inside the same phone app the crew uses to clock in, so there is no extra app to install or learn. There are four parts, and each one fits a different kind of message.",
    },
    {
      t: "steps",
      steps: [
        { title: "Dispatch with instant alerts", text: "The office sends a dispatch, and the people on it get an alert right away. Use it for the message that changes where someone drives in the morning." },
        { title: "Job-specific chat channels", text: "Each job gets its own channel. The foreman, the operators and the office talk about that job there, and nowhere else." },
        { title: "Crew and team messaging", text: "Direct and group messages for the talk that isn't about one job: the shop, the yard, the estimators." },
        { title: "Company announcements", text: "One message to the whole company: a holiday schedule, a new safety rule, a reminder to submit timecards." },
      ],
    },
    {
      t: "shots",
      shots: [{ id: "web-messaging" }, { id: "phone-messages" }],
      caption: "Job channels and messages in the office, and the same messages on a crew phone. (Demo account; names and numbers are made up.)",
    },

    { t: "h2", text: "Why put crew chat in the same app as time and schedules?" },
    {
      t: "p",
      text: "Crew chat belongs in the same app as time and schedules because the crew opens that app every morning to clock in anyway. A message in a fourth app gets missed. A message next to the clock-in button gets read.",
    },
    {
      t: "p",
      text: "It also connects the message to the work. [Scheduling](features/crew-scheduling-software) sends schedule updates and notifications when an assignment moves. The [daily report](features/construction-daily-report-app) holds the photos and field notes. The chat channel holds the talk about the same job. The office reads all three on one job, not across three tools.",
    },
    { t: "cta" },

    { t: "h2", text: "What should you look for in a crew communication app?" },
    {
      t: "ul",
      items: [
        "**Channels by job, not only by group of people.** Jobs start and end; the channel should follow the job.",
        "**Alerts that reach a phone right away** for the dispatch that changes the morning.",
        "**One app for the field.** If the crew has to open a separate app for chat, plan on some of them not doing it.",
        "**History you can find later.** Ask any vendor where messages are kept and who can see them when people come and go.",
        "**Simple enough for people who don't like phones.** Andrew's rule: \"Our crews aren't tech savvy. And they don't need to be.\"",
      ],
    },

    { t: "h2", text: "What crew communication in SmartCrew is not" },
    {
      t: "p",
      text: "SmartCrew crew communication is not a phone system, a radio replacement or a customer texting tool. It is messaging for your own people about your own jobs. Anything this page doesn't list, such as voice calls or push-to-talk, isn't part of the feature list Andrew publishes, so don't plan on it.",
    },
    {
      t: "note",
      title: "Worth knowing",
      text: "Crew Communication sits in the Scheduling & Communications Premium category. Ask Andrew which plan includes it for your company size.",
    },

    { t: "h2", text: "What SmartCrew replaces" },
    {
      t: "p",
      text: "Many dirt work companies run a time app, a fleet app, a CRM, spreadsheets, paper load tickets, Dropbox or Google Drive, and Slack or WhatsApp at the same time. SmartCrew is built to replace that stack with one app and integrate with QuickBooks Online, not replace it. See [what SmartCrew is](guides/what-is-smartcrew) for the full list.",
    },

    { t: "h2", text: "How to get started" },
    {
      t: "p",
      text: "It starts with a short call with Andrew. SmartCrew's team sets up the account, moves your information over, organizes workflows and trains your people; most companies are up and running within a few weeks. Pricing depends on your company size and the features you need; it's built to be well below enterprise construction software. You get a number on a short call with Andrew.",
    },
  ],
  faqs: [
    {
      q: "What is the best communication app for a construction crew?",
      a: "The best one is the app your crew already opens every day. For a dirt work company, a crew communication tool inside the same app as time tracking and scheduling, like SmartCrew, gets read more than a separate chat app.",
    },
    {
      q: "Can SmartCrew replace our WhatsApp or group text?",
      a: "For talk about your jobs, yes. SmartCrew has job-specific chat channels, crew and team messaging, dispatch with instant alerts and company announcements, so talk about a job sits with that job instead of in a personal group text.",
    },
    {
      q: "Does each job get its own chat in SmartCrew?",
      a: "Yes. SmartCrew has job-specific chat channels, so messages about one job stay together.",
    },
    {
      q: "Is crew communication included in every SmartCrew plan?",
      a: "No. Crew Communication is in the Scheduling & Communications Premium category, and feature availability varies by plan.",
    },
    {
      q: "Do crews need to be good with phones to use it?",
      a: "No. SmartCrew is built for crews that aren't tech savvy, and the SmartCrew team trains your people during setup.",
    },
  ],
  related: ["features/crew-scheduling-software", "features/construction-daily-report-app", "features/construction-time-tracking", "guides/what-is-smartcrew"],
};

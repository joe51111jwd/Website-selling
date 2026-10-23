import type { SeoPage } from "../../types";

export const page: SeoPage = {
  kind: "feature",
  slug: "features/crew-scheduling-software",
  nav: "Crew scheduling software",
  keyword: "crew scheduling software",
  updated: "2026-10-23",
  title: "Crew Scheduling Software for Excavation and Heavy Civil | SmartCrew",
  description:
    "How crew scheduling software works for contractors that run machines: crews and equipment assigned to jobs by day, updates and alerts to the field, and one dispatch view. See SmartCrew's scheduling calendar.",
  eyebrow: "Crew scheduling software",
  h1: "Crew scheduling software for contractors that run crews and machines",
  lede:
    "Crew scheduling software puts who is working where, with which machine, on a calendar everyone can see, and tells the crew when it changes. For an excavation or heavy civil company, the schedule has two moving parts, people and iron, and a change to one usually changes the other. SmartCrew's scheduling uses drag-and-drop crew scheduling with job and equipment assignments, and sends schedule updates and notifications to the field. This page covers what to look for and how SmartCrew's version is laid out.",
  summary: [
    "A construction schedule has to assign people and equipment together, because a crew without its machine, or a machine without an operator, is a lost day.",
    "SmartCrew's scheduling is drag-and-drop, with job and equipment assignments and schedule updates and notifications to the crew.",
    "Dispatch adds instant alerts, and crew and job-specific chat channels carry the follow-up conversation.",
    "Scheduling & Communications is a Premium category in SmartCrew, so availability varies by plan. It sits in the same app as time, equipment and job costing.",
  ],
  hero: [{ id: "web-scheduling" }, { id: "phone-messages" }],
  blocks: [
    { t: "h2", text: "Why the morning scramble happens" },
    {
      t: "p",
      text: "On many dirt work companies, the schedule lives in one person's head, a whiteboard or a text thread. It works until it doesn't: a truck is down, a job is rained out, a worker calls in, and the plan for tomorrow changes at 5 p.m. Then the only way to tell the crew is a round of calls, and someone doesn't get the message.",
    },
    {
      t: "ul",
      items: [
        "**People and machines are scheduled separately.** The foreman knows who is on the job, the shop knows which machine is free, and they don't compare notes until morning.",
        "**Changes don't reach the crew.** A new start time or a moved job is told to some people and not others.",
        "**Nobody sees the week.** Without a calendar, it's hard to see that Thursday is overbooked or that a machine sits idle on Monday.",
        "**The schedule and the time records never meet.** What was planned and what was worked end up in different places.",
      ],
    },

    { t: "h2", text: "What crew scheduling software has to do" },
    {
      t: "ol",
      items: [
        "**Show the calendar.** Jobs and crews by day across the month, readable at a glance.",
        "**Assign crews and equipment to a job.** Both, in one move.",
        "**Make changes with a drag.** If rescheduling takes a form and three clicks, it won't be kept current.",
        "**Tell the field.** Schedule updates and notifications go to the people affected.",
        "**Give the crew a place to talk.** Questions about the change go to a channel for the job, not a personal text.",
        "**Connect to what happens next.** The scheduled job should be the job the crew clocks in to.",
      ],
    },

    { t: "h2", text: "How SmartCrew's scheduling works" },
    {
      t: "p",
      text: "SmartCrew's Scheduling covers drag-and-drop crew scheduling, job and equipment assignments, and schedule updates and notifications. The web calendar shows crews and jobs scheduled by day across the month.",
    },
    {
      t: "shots",
      shots: [{ id: "web-scheduling" }, { id: "phone-home" }],
      caption: "The scheduling calendar, with crews and jobs by day, and the phone home screen a crew member opens each day. (Demo account.)",
    },
    {
      t: "table",
      caption: "SmartCrew scheduling and communication, piece by piece",
      head: ["Piece", "What it does"],
      rows: [
        ["Drag-and-drop crew scheduling", "Move crews between days and jobs on a calendar"],
        ["Job and equipment assignments", "Attach the crew and the machines to a job"],
        ["Schedule updates and notifications", "Tell the crew when the plan changes"],
        ["Dispatch with instant alerts", "Send an alert that reaches the field right away"],
        ["Crew and team messaging", "Chat for the crew and the office"],
        ["Job-specific chat channels", "A channel per job, so the conversation stays with the work"],
        ["Company announcements", "One message to the whole company"],
      ],
      note: "Scheduling & Communications is a Premium category in SmartCrew. Feature availability varies by plan.",
    },
    {
      t: "shots",
      shots: [{ id: "phone-messages" }, { id: "web-messaging" }],
      caption: "Chats on a phone (company, sales, equipment and crew channels) and in the web app. (Demo account.)",
    },
    { t: "cta", title: "Want the week on one calendar?", text: "A short call with Andrew shows scheduling with your crews, machines and jobs." },

    { t: "h2", text: "Scheduling that connects to time and equipment" },
    {
      t: "p",
      text: "A schedule is a plan. SmartCrew puts the plan next to the record of what happened. The crew clocks in to a job, picks the activity and the machine, and the hours land on the job and the machine, which you can compare with what was scheduled. See [construction time tracking](/features/construction-time-tracking/) for the clock-in flow and [equipment maintenance](/features/heavy-equipment-maintenance-software/) for machine records.",
    },
    {
      t: "p",
      text: "Putting equipment in the schedule also exposes idle machines. If a loader isn't assigned to anything Thursday, you can see it before Thursday.",
    },

    { t: "h2", text: "Questions to ask any scheduling software vendor" },
    {
      t: "ul",
      items: [
        "Can I schedule crews and equipment in the same view?",
        "How does the crew find out about a change, and can I see who has seen it?",
        "Does the scheduled job match the job the crew clocks in to?",
        "Can the office reschedule from a phone?",
        "Is chat included, or a separate app with separate logins?",
        "What plan is scheduling on, and does it cost extra?",
      ],
    },
    {
      t: "p",
      text: "Competitors differ on that last point. Some sell scheduling as an add-on or on a higher plan; for example, Raken lists Resource Scheduling as a paid add-on on its Performance plan. See the [Raken comparison](/compare/raken-alternative/) for details and sources.",
    },
  ],
  faqs: [
    {
      q: "What is crew scheduling software?",
      a: "It's software that puts crews, and often equipment, on a calendar by job and day, and tells the crew when the schedule changes.",
    },
    {
      q: "Does SmartCrew have crew scheduling?",
      a: "Yes. SmartCrew's Scheduling includes drag-and-drop crew scheduling, job and equipment assignments, and schedule updates and notifications. It's part of the Scheduling & Communications Premium category, so availability varies by plan.",
    },
    {
      q: "Can I schedule equipment as well as people?",
      a: "Yes. SmartCrew's scheduling includes job and equipment assignments.",
    },
    {
      q: "How do crews find out about schedule changes?",
      a: "SmartCrew sends schedule updates and notifications, and dispatch with instant alerts. Crew messaging and job-specific chat channels carry the follow-up.",
    },
    {
      q: "Is scheduling the same app as time tracking?",
      a: "Yes. Scheduling, time tracking, equipment, hauling, reports and job costing are in one app.",
    },
    {
      q: "How much does SmartCrew cost?",
      a: "Pricing depends on your company size and the features you need, and it's built to be well below the cost of enterprise construction software. You get a number on a short call with Andrew.",
    },
  ],
  related: ["features/construction-time-tracking", "features/heavy-equipment-maintenance-software", "compare/raken-alternative", "excavation-software"],
};

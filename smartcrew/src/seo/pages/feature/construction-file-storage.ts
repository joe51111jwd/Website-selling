import type { SeoPage } from "../../types";

// TODO(andrew): how are file permissions set up (by role, by job or by file)? Then describe them in
// the permissions section.
// TODO(andrew): storage limits per plan, supported file types, and whether files open offline.

export const page: SeoPage = {
  kind: "feature",
  slug: "features/construction-file-storage",
  nav: "File storage",
  keyword: "construction file storage app",
  updated: "2026-10-22",
  title: "Construction File Storage for Plans and Job Photos | SmartCrew",
  description:
    "Construction file storage for dirt work crews: plans, photos and job documents in the cloud, open from the field or the office, with sharing and permissions.",
  eyebrow: "File storage",
  h1: "Construction file storage for plans, photos and job documents",
  lede:
    "Construction file storage keeps the plans, photos and documents for every job in one cloud place that the field and the office can both open. SmartCrew includes centralized cloud file storage, with plans, photos and job documents, access from the field or office, and file sharing and permissions, in the same app as time, equipment and job costing. For many dirt work companies it replaces a shared Dropbox or Google Drive folder.",
  summary: [
    "On most small crews the current plan set lives in a truck, an email and a folder on the office computer, and they don't match.",
    "One place per job for plans, permits, photos and documents means the foreman and the office look at the same file.",
    "Sharing and permissions control who can see and change what.",
    "SmartCrew stores and shares files. It is not a plan markup or takeoff tool.",
  ],
  hero: [{ id: "web-project-detail" }, { id: "phone-reports" }],
  blocks: [
    { t: "h2", text: "Why do dirt work crews need shared file storage?" },
    {
      t: "p",
      text: "Dirt work crews need shared file storage because the wrong plan revision in the field costs real money: a trench dug at the old invert, a pad graded to last month's elevation, a culvert set in the wrong place. When the plan set, the utility locate ticket and the permit are on the phone, attached to the job, the foreman doesn't have to call the office to check.",
    },
    {
      t: "p",
      text: "The office has the same problem in reverse. Photos from the field sit on six different phones. When a customer asks for a picture of the pipe before backfill, someone has to find out who took it.",
    },

    { t: "h2", text: "What does SmartCrew's file storage do?" },
    {
      t: "p",
      text: "SmartCrew's file storage keeps plans, photos and job documents in centralized cloud storage that can be opened from the field or the office, with file sharing and permissions. Files live next to the job's time, equipment, hauling and cost records, so the context of a file is the job it belongs to.",
    },
    {
      t: "table",
      caption: "What a dirt work company typically stores per job",
      head: ["File", "Who needs it", "Why it matters"],
      rows: [
        ["Plan set and revisions", "Foreman, operators, office", "Building to the current revision avoids rework."],
        ["Locate tickets and permits", "Foreman, office", "Proof the job was cleared to dig."],
        ["Jobsite photos", "Office, customer, inspector", "A record of what was built and when, also part of [daily reports](features/construction-daily-report-app)."],
        ["Contracts and change orders", "Owner, office", "The backup for what you bill."],
        ["Safety documents", "Foreman, crew", "JSAs and site safety plans where the crew can find them."],
      ],
      note: "Feature availability varies by plan. Fleet Management, Sales CRM, and Scheduling & Communications are Premium categories.",
    },
    {
      t: "shots",
      shots: [{ id: "web-project-detail" }, { id: "phone-reports" }],
      caption: "A job page in the office, and the reports menu on a phone. (Demo account; names and numbers are made up.)",
    },

    { t: "h2", text: "How do sharing and permissions work for job files?" },
    {
      t: "p",
      text: "Sharing and permissions let the office decide who can see and change each file, so the crew sees what they need without access to contracts or costs. A foreman can open the plans and permits for the job; the owner and office keep contracts and pricing to themselves.",
    },
    { t: "cta", title: "Put the plans on the job, not in the truck", text: "A short call with Andrew: he moves your job folders into SmartCrew during setup." },

    { t: "h2", text: "Does SmartCrew replace Dropbox or Google Drive?" },
    {
      t: "p",
      text: "SmartCrew replaces Dropbox or Google Drive for job files at many dirt work companies, because the files then sit with the job instead of in a folder tree somebody has to keep tidy. If you use those tools for company-wide files that are not about jobs, you may keep them for that. The SmartCrew team migrates information during setup.",
    },

    { t: "h2", text: "What should a contractor look for in construction file storage?" },
    {
      t: "ol",
      items: [
        "Can a foreman open the current plan on a phone in the field?",
        "Are files organized by job, next to that job's other records?",
        "Can the office control who sees contracts and pricing?",
        "Do field photos land on the job without someone forwarding them?",
        "Does it do plan markup or takeoff? (SmartCrew does not. Use a plan viewer or takeoff tool if you need those.)",
        "Who moves the existing folders over? (SmartCrew's team migrates information during setup.)",
      ],
    },

    { t: "h2", text: "What SmartCrew's file storage does not do" },
    {
      t: "p",
      text: "SmartCrew's file storage does not do plan markup, sheet comparison, takeoff, BIM viewing or document control workflows like RFIs and submittals. Companies that manage those on large projects use a dedicated plan or project management tool.",
    },

    { t: "h2", text: "How do you get started with SmartCrew?" },
    {
      t: "p",
      text: "You get started with a short call with Andrew Drish, SmartCrew's founder. The team sets up the account, moves your information over, organizes workflows and trains your people, and most companies are up and running within a few weeks. Pricing depends on your company size and the features you need; it's built to be well below enterprise construction software. You get a number on a short call with Andrew.",
    },
  ],
  faqs: [
    {
      q: "What is the best file storage for a construction company?",
      a: "For a dirt work company with 5 to 100 people, storage that keeps files with each job and opens on a phone, like SmartCrew's, gets used in the field. Large projects with RFIs and submittals usually need a dedicated document control tool too.",
    },
    {
      q: "Can my crew see plans on their phones?",
      a: "Yes. SmartCrew's file storage gives access to plans, photos and job documents from the field or the office.",
    },
    {
      q: "Can I limit who sees contracts and pricing?",
      a: "Yes. SmartCrew includes file sharing and permissions, so the office controls who can see each file.",
    },
    {
      q: "Does SmartCrew do plan markup?",
      a: "No. SmartCrew stores and shares files. Plan markup, sheet comparison and takeoff need a separate tool.",
    },
    {
      q: "Will SmartCrew move my existing files over?",
      a: "The SmartCrew team sets up the account and migrates information as part of setup. Talk through what you have on the call with Andrew.",
    },
  ],
  related: ["features/construction-daily-report-app", "features/crew-communication-app", "compare/fieldwire-alternative", "septic-software", "guides/what-is-smartcrew"],
};

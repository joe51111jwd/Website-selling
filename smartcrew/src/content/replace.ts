// "Replace 5 apps" (the section after the hero): Andrew's copy, verbatim (his mock and his page
// outline, Oct 16). The sixth card, Materials & Hauling, is his addition; its line paraphrases the
// approved hauling-ticket and materials lines in moments.ts. Logos are the replaced apps' own marks
// (public/logos/apps); apps without a file get a letter mark (`letter`), paper tickets a drawn glyph.

export const REPLACE = {
  id: "replace",
  label: "Replace 5 apps",
  kicker: "Fewer apps. Less busywork.",
  /** One sentence, set in three parts: "Replace 5 apps (and dozens of spreadsheets) with SmartCrew". */
  headline: {
    lead: "Replace 5 apps",
    aside: "(and dozens of spreadsheets)",
    tail: "with SmartCrew",
  },
  sub: "Stop switching between disconnected tools. Bring time tracking, equipment, sales, files, and crew communication together in one platform built for contractors.",
  /** Accessible name of the cards list (not shown). */
  cardsLabel: "What SmartCrew brings together",
  /** The small label before each card's logos. */
  replacesLabel: "Replaces",
  cards: [
    {
      id: "time",
      name: "Time Tracking",
      line: "Replace separate time tracking workflows.",
      apps: [
        { name: "busybusy", letter: "b" },
        { name: "QuickBooks Time", file: "quickbooks.svg" },
        { name: "ExakTime", letter: "E" },
      ],
    },
    {
      id: "fleet",
      name: "Fleet Management",
      line: "Keep equipment, service, and maintenance records together.",
      apps: [{ name: "Fleetio", letter: "F" }],
    },
    {
      id: "crm",
      name: "Sales CRM",
      line: "Track bids, leads, and pipeline opportunities.",
      apps: [
        { name: "HubSpot", file: "hubspot.svg" },
        { name: "Close", file: "close.svg" },
      ],
    },
    {
      id: "files",
      name: "File Storage",
      line: "Organize job documents and field records.",
      apps: [
        { name: "Dropbox", file: "dropbox.svg" },
        { name: "Google Drive", file: "google-drive.svg" },
      ],
    },
    {
      id: "comms",
      name: "Crew Communication",
      line: "Keep your teams connected with messaging and updates.",
      apps: [
        { name: "Slack", file: "slack.svg" },
        { name: "WhatsApp", file: "whatsapp.svg" },
      ],
    },
    {
      id: "hauling",
      name: "Materials & Hauling",
      line: "Log loads, hauling tickets and material receipts to the job.",
      apps: [
        { name: "Spreadsheets", file: "google-sheets.svg" },
        { name: "Paper load tickets", glyph: "ticket" },
      ],
    },
  ] as ReadonlyArray<{
    id: "time" | "fleet" | "crm" | "files" | "comms" | "hauling";
    name: string;
    line: string;
    apps: ReadonlyArray<{ name: string; file?: string; letter?: string; glyph?: "ticket" }>;
  }>,
  platform: "One connected platform",
  fine: [
    "Feature availability varies by plan. Fleet Management, Sales CRM, and Scheduling & Communications are Premium categories.",
    "Trademarks belong to their owners. QuickBooks is integrated, not replaced.",
  ],
} as const;

// The records One Day creates (the rows, numbers and toast that land in the office), as plain
// data with no UI imports, so the page's own code (../life.ts) can read them without pulling the
// app kit into the first-paint bundle. The kit-drawn rows are in ./rows.tsx.

export const DAY_DATA = {
  clockin: { name: "Marcus Bell", initials: "MB", role: "Foreman", project: "Hwy 9 Culvert Replacement", number: "#2417", activity: "Pipe Laying", equipment: "CAT 320 Excavator", date: "Oct 9, 2026", time: "6:42 AM" },
  pretrip: { operator: "Tomás Ortega", date: "9 October 2026; 06:55 AM", checklist: "DOT", reading: "211,640", maintenance: "Unlinked", status: "Approved" },
  load: { ticket: "#14", time: "9:20 AM", truck: "Mack Granite #1102", driver: "Tomás Ortega", project: "Riverside Storm Sewer", number: "#2409", type: "Import", material: "Select fill", qty: "12 yd³", from: "Hollis Sand & Gravel" },
  leak: { equipment: "CAT D6 Dozer", issue: "Left track tension low, idler seeping oil", by: "Dale Hendricks", updated: "Oct 9 2026, 4:12 PM", urgency: "High", status: "Todo" },
  profit: { from: 53611.75, to: 57731.75, today: 4120 },
  plan: { day: "Mon 12", time: "7:00 AM - 3:30 PM", crew: 4, project: "Hwy 9 Culvert Replacement" },
  payroll: { title: "Payroll report ready for QuickBooks", meta: "Sep 28 – Oct 4 · 14 timecards approved", time: "now" },
} as const;


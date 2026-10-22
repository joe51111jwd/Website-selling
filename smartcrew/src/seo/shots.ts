// Real SmartCrew screens (the demo account, "Cedar Ridge Earthworks": names and numbers are made up),
// the same files the product page uses. `alt` says what the screen shows, for readers who can't see
// it, search engines and AI assistants.

export type ShotFile = { src: string; w: number; h: number; device: "laptop" | "phone"; alt: string };

const web = (name: string, alt: string): ShotFile => ({ src: `/phone/screens/${name}-960.webp`, w: 960, h: 600, device: "laptop", alt });
const phone = (name: string, alt: string): ShotFile => ({ src: `/phone/screens/${name}-720.webp`, w: 720, h: 1565, device: "phone", alt });

export const SHOTS: Record<string, ShotFile> = {
  "web-dashboard": web(
    "web-dashboard",
    "SmartCrew office dashboard: live labor, material and equipment cost, active projects, overtime hours, a map of crews on jobsites and a list of who is clocked in on which job and machine",
  ),
  "web-timecards": web(
    "web-timecards",
    "SmartCrew timecards screen: each employee's clocked hours by day for the week, with review and payroll tabs",
  ),
  "web-project-detail": web(
    "web-project-detail",
    "A SmartCrew job page for a culvert replacement: revenue, expenses and profit, budget versus spent for labor, materials, equipment, other costs and change orders, a jobsite map and hours by employee",
  ),
  "web-projects": web(
    "web-projects",
    "SmartCrew projects board: total revenue, expenses and profit across jobs, a map of job locations and jobs grouped as accepted, in progress, on hold and completed",
  ),
  "web-equipment": web(
    "web-equipment",
    "SmartCrew equipment list: each machine's ID, year, make, model, category, hourly rate and hours",
  ),
  "web-service-queue": web(
    "web-service-queue",
    "SmartCrew service queue: equipment problems reported from the field with who reported them, when, urgency and repair status",
  ),
  "web-d-inspections": web(
    "web-d-inspections",
    "A SmartCrew machine record for a dump truck: hours, mileage, last and next service, and its log of DOT inspections with operator, date, odometer reading and status",
  ),
  "web-materials": web(
    "web-materials",
    "SmartCrew materials screen: orders by project and vendor with quantity, unit cost, class, delivery date and whether each is billable and paid",
  ),
  "web-d-hauling": web(
    "web-d-hauling",
    "SmartCrew hauling log: each load ticket's time, truck, project, import or export, material, yards and pit or yard it came from",
  ),
  "web-scheduling": web(
    "web-scheduling",
    "SmartCrew scheduling calendar: crews and jobs scheduled by day across the month",
  ),
  "web-pipeline": web(
    "web-pipeline",
    "SmartCrew sales pipeline: bids and leads as cards moving from lead to in progress, proposal sent and negotiation, with value and close date",
  ),
  "web-messaging": web(
    "web-messaging",
    "SmartCrew messaging: company announcements such as weekly crew assignments, a lane closure notice and a trench safety toolbox talk",
  ),
  "phone-home": phone("phone-home", "SmartCrew phone app home screen with a large Clock In button and the week's days"),
  "phone-working": phone(
    "phone-working",
    "SmartCrew phone app while clocked in: time on the clock, the project, the activity code and the machine being run, with Break, Log & Switch and Clock Out",
  ),
  "phone-select-task": phone(
    "phone-select-task",
    "SmartCrew phone app asking the worker to pick a project, an activity code and the equipment before starting",
  ),
  "phone-dot": phone(
    "phone-dot",
    "SmartCrew equipment inspection form on a phone: DOT or daily inspection, machine, hours or miles, and pass or fail checks for brakes, steering, lights and tires",
  ),
  "phone-hauling": phone(
    "phone-hauling",
    "SmartCrew hauling log on a phone: date, truck, project, import or export, the pit the load came from and notes",
  ),
  "phone-incident-report": phone(
    "phone-incident-report",
    "SmartCrew incident report on a phone: project, date and time, injury, near miss or damage, what happened, photos and who reported it",
  ),
  "phone-messages": phone("phone-messages", "SmartCrew chats on a phone: company, sales, equipment and crew channels"),
  "phone-reports": phone(
    "phone-reports",
    "SmartCrew reports menu on a phone: incident report, service request, service records, hauling log, receipts, service queue, field usage, DOT inspection and scheduling",
  ),
  "phone-summary": phone(
    "phone-summary",
    "SmartCrew weekly timecard summary on a phone: total hours, overtime and each day's hours by job and activity, with a Submit Timecard button",
  ),
};

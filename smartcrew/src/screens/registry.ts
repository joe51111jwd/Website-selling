import type { ComponentType } from "react";

// Every recreated SmartCrew app screen. Web screens are laid out at 1440×900 CSS px and phone
// screens at 402×874 (iPhone Pro), so they can be shown live on the page (scaled with CSS) or
// shot to images for the 3D devices (npm run screens).

export type ScreenKind = "web" | "phone";

export type ScreenDef = {
  id: string;
  kind: ScreenKind;
  title: string;
  load: () => Promise<{ default: ComponentType }>;
};

export const SIZE: Record<ScreenKind, { w: number; h: number }> = {
  web: { w: 1440, h: 900 },
  phone: { w: 402, h: 874 },
};

export const SCREENS: ScreenDef[] = [
  // web (W1–W12)
  { id: "web-dashboard", kind: "web", title: "Dashboard", load: () => import("./web/Dashboard") },
  { id: "web-projects", kind: "web", title: "Projects board", load: () => import("./web/Projects") },
  { id: "web-project-detail", kind: "web", title: "Project detail · job costing", load: () => import("./web/ProjectDetail") },
  { id: "web-timecards", kind: "web", title: "Reports · Timecards", load: () => import("./web/Timecards") },
  { id: "web-equipment", kind: "web", title: "Equipment", load: () => import("./web/Equipment") },
  { id: "web-service-queue", kind: "web", title: "Equipment · Service Queue", load: () => import("./web/ServiceQueue") },
  { id: "web-materials", kind: "web", title: "Materials · Orders", load: () => import("./web/Materials") },
  { id: "web-scheduling", kind: "web", title: "Scheduling", load: () => import("./web/Scheduling") },
  { id: "web-pipeline", kind: "web", title: "Sales Pipeline", load: () => import("./web/Pipeline") },
  { id: "web-messaging", kind: "web", title: "Messaging", load: () => import("./web/Messaging") },
  // web, added for the features section's app (W3b, W13–W16)
  { id: "web-project-costcodes", kind: "web", title: "Project detail · cost codes", load: () => import("./web/CostCodes") },
  { id: "web-machine", kind: "web", title: "Equipment · machine · service records", load: () => import("./web/Machine") },
  { id: "web-daily-reports", kind: "web", title: "Daily Reports", load: () => import("./web/DailyReports") },
  { id: "web-safety", kind: "web", title: "Safety", load: () => import("./web/Safety") },
  { id: "web-files", kind: "web", title: "Files", load: () => import("./web/Files") },
  // web, added for Watch it work (Andrew's comment-mode notes, Oct 20)
  { id: "web-project-changeorders", kind: "web", title: "Project detail · change orders", load: () => import("./web/ChangeOrders") },
  // phone (M1–M8)
  { id: "phone-home", kind: "phone", title: "Home · Ready to clock in", load: () => import("./phone/Home") },
  { id: "phone-working", kind: "phone", title: "Currently working on", load: () => import("./phone/Working") },
  { id: "phone-select-task", kind: "phone", title: "Select task and project", load: () => import("./phone/SelectTask") },
  { id: "phone-summary", kind: "phone", title: "Weekly summary", load: () => import("./phone/Summary") },
  { id: "phone-reports", kind: "phone", title: "Reports menu", load: () => import("./phone/Reports") },
  { id: "phone-hauling", kind: "phone", title: "Hauling Log", load: () => import("./phone/Hauling") },
  { id: "phone-dot", kind: "phone", title: "DOT Inspection Report", load: () => import("./phone/Dot") },
  // phone, added for Watch it work (Andrew's comment-mode notes, Oct 20)
  { id: "phone-push", kind: "phone", title: "Push notifications · dispatch", load: () => import("./phone/Push") },
  { id: "phone-add-project", kind: "phone", title: "Add Project", load: () => import("./phone/AddProject") },
  { id: "phone-add-service", kind: "phone", title: "Add Service Record", load: () => import("./phone/AddService") },
  { id: "phone-home-plan", kind: "phone", title: "Home · today's plan alert", load: () => import("./phone/HomePlan") },
  { id: "phone-summary-clockout", kind: "phone", title: "Weekly summary · clock-out reminder", load: () => import("./phone/SummaryClockOut") },
  { id: "phone-messages", kind: "phone", title: "Group messaging · channels", load: () => import("./phone/Messages") },
  { id: "phone-change-order", kind: "phone", title: "Change Order form", load: () => import("./phone/ChangeOrderForm") },
  { id: "phone-service-request", kind: "phone", title: "Service Request form", load: () => import("./phone/ServiceRequest") },
  { id: "phone-daily-report", kind: "phone", title: "Daily Report form", load: () => import("./phone/DailyReportForm") },
];

export const screenById = (id: string) => SCREENS.find((s) => s.id === id);

// One Day's state screens, by id. `file` is where the texture is shot to (under public/), and the
// screen id the Stage poses use (a URL under public/ is a valid screen; its name tells the Stage
// whether it's a web (1440×900, @2x) or phone (402×874, @3x) screen).
import type { ComponentType } from "react";

export type DayStateDef = { id: string; kind: "web" | "phone"; load: () => Promise<ComponentType> };

const P = () => import("./phone");
const W = () => import("./web");

export const DAY_STATES: DayStateDef[] = [
  { id: "phone-d-clockedin", kind: "phone", load: () => P().then((m) => m.ClockedIn) },
  { id: "phone-d-dot", kind: "phone", load: () => P().then((m) => m.DotForm) },
  { id: "phone-d-dot-sent", kind: "phone", load: () => P().then((m) => m.DotSent) },
  { id: "phone-d-dot-empty", kind: "phone", load: () => P().then((m) => m.DotFormEmpty) },
  { id: "phone-d-service-empty", kind: "phone", load: () => P().then((m) => m.ServiceFormEmpty) },
  { id: "phone-d-hauling", kind: "phone", load: () => P().then((m) => m.HaulForm) },
  { id: "phone-d-load-sent", kind: "phone", load: () => P().then((m) => m.HaulSent) },
  { id: "phone-d-service", kind: "phone", load: () => P().then((m) => m.ServiceForm) },
  { id: "phone-d-service-sent", kind: "phone", load: () => P().then((m) => m.ServiceSent) },
  { id: "phone-d-working-5pm", kind: "phone", load: () => P().then((m) => m.Working5pm) },
  { id: "phone-d-clockedout", kind: "phone", load: () => P().then((m) => m.ClockedOut) },
  { id: "phone-d-plan", kind: "phone", load: () => P().then((m) => m.PlanSheet) },
  { id: "phone-d-summary-sent", kind: "phone", load: () => P().then((m) => m.SummarySent) },
  { id: "web-d-inspections", kind: "web", load: () => W().then((m) => m.WebInspections) },
  { id: "web-d-hauling", kind: "web", load: () => W().then((m) => m.WebHauling) },
  { id: "web-d-queue", kind: "web", load: () => W().then((m) => m.WebQueue) },
];

/** The screen id (a file under public/) a pose uses for a state. */
export const stateScreen = (id: string) => `renders/day-s/${id}.webp`;

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
  // filled in as screens are built, e.g.
  // { id: "web-dashboard", kind: "web", title: "Dashboard", load: () => import("./web/Dashboard") },
];

export const screenById = (id: string) => SCREENS.find((s) => s.id === id);

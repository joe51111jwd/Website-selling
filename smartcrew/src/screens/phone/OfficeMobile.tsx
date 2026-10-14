// The office web app's mobile layout (402 × 874), for the spec sheet's phone click-through
// (src/site/specsheet): the same Gen C look as the crew app (status bar, Inter, #F5F5F5 cards),
// with the office app's own parts: the SMARTCREW lock-up and the account in a top bar, and its
// sections (the web sidebar's Dashboard · Projects · Scheduling · Messaging · Pipeline) as a
// bottom bar. Two pages use it: ./OfficeJob.tsx (job costing) and ./OfficePlan.tsx (scheduling).
// Not a screen the real app is known to have on phones: the section marks it ⚑ for review.

import type { ReactNode } from "react";
import { StatusBar, Icon, Logo, type IconName } from "../kit";
import { company } from "../data";
import "./OfficeMobile.css";

export type OfficeTab = "Dashboard" | "Projects" | "Scheduling" | "Messaging" | "Pipeline";

const TABS: { key: OfficeTab; icon: IconName }[] = [
  { key: "Dashboard", icon: "home" },
  { key: "Projects", icon: "projects" },
  { key: "Scheduling", icon: "scheduling" },
  { key: "Messaging", icon: "messaging" },
  { key: "Pipeline", icon: "pipeline" },
];

export function OfficeMobile({ tab, children }: { tab: OfficeTab; children: ReactNode }) {
  return (
    <div className="sc sc-phone om">
      <StatusBar />
      <header className="om-top">
        <span className="om-logo">
          <Logo />
        </span>
        <span className="om-account" title={company.login}>
          {company.name.split(" ").map((w) => w[0]).slice(0, 2).join("")}
        </span>
        <span className="om-menu">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path d="M3 5.5h14M3 10h14M3 14.5h14" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
          </svg>
        </span>
      </header>
      <div className="om-body">{children}</div>
      <nav className="om-tabs">
        {TABS.map(({ key, icon }) => (
          <span key={key} className={`om-tab${key === tab ? " is-active" : ""}`}>
            <Icon name={icon} size={24} stroke={key === tab ? 1.85 : 1.6} />
            <span>{key}</span>
          </span>
        ))}
        <span className="sc-homebar" />
      </nav>
    </div>
  );
}

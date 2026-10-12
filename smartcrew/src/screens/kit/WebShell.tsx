import type { CSSProperties, ReactNode } from "react";
import logoUrl from "./smartcrew-logo.svg";
import { Icon, type IconName } from "./Icon";
import { Badge } from "./ui";
import { company, navBadges } from "../data";

export type NavKey =
  | "Dashboard"
  | "Projects"
  | "Workforce"
  | "Materials"
  | "Equipment"
  | "Customers"
  | "Vendors"
  | "Pipeline"
  | "Scheduling"
  | "Messaging"
  | "Reports";

export const NAV: { key: NavKey; icon: IconName }[] = [
  { key: "Dashboard", icon: "home" },
  { key: "Projects", icon: "projects" },
  { key: "Workforce", icon: "workforce" },
  { key: "Materials", icon: "materials" },
  { key: "Equipment", icon: "equipment" },
  { key: "Customers", icon: "customers" },
  { key: "Vendors", icon: "vendors" },
  { key: "Pipeline", icon: "pipeline" },
  { key: "Scheduling", icon: "scheduling" },
  { key: "Messaging", icon: "messaging" },
  { key: "Reports", icon: "reports" },
];

/** The orange hard-hat-pin mark (cropped out of the real SVG lock-up) + SMARTCREW wordmark. */
export function Logo({ markOnly = false }: { markOnly?: boolean }) {
  return (
    <>
      <span className="sc-logo-mark">
        <img src={logoUrl} alt="" draggable={false} />
      </span>
      {!markOnly && <span className="sc-logo-word">SMARTCREW</span>}
    </>
  );
}

export type WebShellProps = {
  /** Highlighted sidebar row. */
  active: NavKey;
  /** Page title (left of the header row). Omit to render your own header inside children. */
  title?: ReactNode;
  /** Right side of the header row (dropdowns, segmented controls, "+ Add" …). */
  actions?: ReactNode;
  /** Icon-only sidebar (95 px), as on the equipment-detail capture. */
  collapsed?: boolean;
  /** Override the sidebar badges (defaults to data.navBadges). Pass {} for none. */
  badges?: Partial<Record<NavKey, number | string>>;
  /** Remove the content padding (43 px sides, 30 px top) when you need full control. */
  flush?: boolean;
  /** Extra class / style on the content area. */
  contentClassName?: string;
  contentStyle?: CSSProperties;
  children?: ReactNode;
};

/**
 * Full 1440×900 Gen C web app frame: sidebar (logo + nav + red count badges), top bar (company,
 * login email, switcher chevron, Customer Support) and the content area with an optional
 * title/actions header row.
 */
export function WebShell({ active, title, actions, collapsed = false, badges = navBadges, flush = false, contentClassName, contentStyle, children }: WebShellProps) {
  return (
    <div className={`sc sc-web${collapsed ? " sc-web--collapsed" : ""}`}>
      <aside className="sc-side">
        <div className="sc-side-logo">
          <Logo markOnly={collapsed} />
        </div>
        <nav className="sc-nav">
          {NAV.map(({ key, icon }) => {
            const on = key === active;
            const b = badges[key];
            return (
              <div key={key} className={`sc-nav-item${on ? " is-active" : ""}`}>
                <Icon name={icon} size={32} stroke={on ? 1.85 : 1.6} />
                {!collapsed && <span>{key}</span>}
                {b !== undefined && b !== 0 && <Badge>{typeof b === "number" && b > 99 ? "99+" : b}</Badge>}
              </div>
            );
          })}
        </nav>
      </aside>
      <div className="sc-main">
        <header className="sc-top">
          <div className="sc-account">
            <div className="sc-account-text">
              <span className="sc-account-name">{company.name}</span>
              <span className="sc-account-mail">{company.login}</span>
            </div>
            <Icon name="chevronDown" size={17} stroke={1.7} />
          </div>
          <div className="sc-support">
            <Icon name="headset" size={18} stroke={1.6} />
            Customer Support
          </div>
        </header>
        <main className={`sc-content${flush ? " sc-content--flush" : ""}${contentClassName ? ` ${contentClassName}` : ""}`} style={contentStyle}>
          {(title !== undefined || actions !== undefined) && (
            <div className="sc-page-head">
              {title !== undefined && <h1 className="sc-title">{title}</h1>}
              {actions !== undefined && <div className="sc-page-actions">{actions}</div>}
            </div>
          )}
          {children}
        </main>
      </div>
    </div>
  );
}

import type { CSSProperties, ReactNode } from "react";
import { Icon, type IconName } from "./Icon";

export type PhoneTab = "Home" | "Jobsites" | "Docs" | "Reports" | "Summary" | "Profile";

/** iOS status bar: 9:41, signal, wifi, battery (54 px tall, leaves room for the Dynamic Island). */
export function StatusBar({ island = false, tone = "dark" }: { island?: boolean; tone?: "dark" | "light" }) {
  return (
    <div className="sc-statusbar" style={tone === "light" ? { color: "#fff" } : undefined}>
      <span className="sc-statusbar-time">9:41</span>
      {island && <span className="sc-island" />}
      <span className="sc-statusbar-icons">
        <svg width="19" height="12" viewBox="0 0 19 12" fill="currentColor" aria-hidden="true">
          <rect x="0" y="7.6" width="3.2" height="4.4" rx="0.9" />
          <rect x="5.1" y="5.3" width="3.2" height="6.7" rx="0.9" />
          <rect x="10.2" y="2.8" width="3.2" height="9.2" rx="0.9" />
          <rect x="15.3" y="0" width="3.2" height="12" rx="0.9" />
        </svg>
        <svg width="17" height="12.5" viewBox="0 0 17 12.5" fill="currentColor" aria-hidden="true">
          <path d="M8.5 2.9c2.4 0 4.6.9 6.2 2.5.2.2.5.2.7 0l1.1-1.1c.2-.2.2-.5 0-.7A11.6 11.6 0 0 0 .5 3.6c-.2.2-.2.5 0 .7l1.1 1.1c.2.2.5.2.7 0a8.7 8.7 0 0 1 6.2-2.5z" />
          <path d="M8.5 6.6c1.4 0 2.6.5 3.6 1.4.2.2.5.2.7 0l1.1-1.1c.2-.2.2-.5 0-.7a7.4 7.4 0 0 0-10.8 0c-.2.2-.2.5 0 .7l1.1 1.1c.2.2.5.2.7 0 1-.9 2.2-1.4 3.6-1.4z" />
          <path d="M10.9 9.7c.2-.2.2-.5 0-.7a3.5 3.5 0 0 0-4.8 0c-.2.2-.2.5 0 .7l2 2c.2.2.5.2.7 0z" />
        </svg>
        <svg width="27.5" height="13" viewBox="0 0 27.5 13" aria-hidden="true">
          <rect x="0.5" y="0.5" width="24" height="12" rx="3.8" fill="none" stroke="currentColor" strokeOpacity="0.35" />
          <rect x="2.2" y="2.2" width="20.6" height="8.6" rx="2.4" fill="currentColor" />
          <path d="M26 4.4v4.2c.8-.3 1.4-1.1 1.4-2.1s-.6-1.8-1.4-2.1z" fill="currentColor" fillOpacity="0.4" />
        </svg>
      </span>
    </div>
  );
}

const TABS_V: { key: PhoneTab; icon: IconName }[] = [
  { key: "Home", icon: "home" },
  { key: "Jobsites", icon: "mapPin" },
  { key: "Docs", icon: "docs" },
  { key: "Summary", icon: "calendarCheck" },
  { key: "Profile", icon: "user" },
];

/** Bottom tab bar: Home · Jobsites · Docs (or Reports) · Summary · Profile, with the home indicator. */
export function TabBar({ active, variant = "docs" }: { active: PhoneTab | null; variant?: "docs" | "reports" }) {
  const tabs = variant === "reports" ? TABS_V.map((t) => (t.key === "Docs" ? { key: "Reports" as PhoneTab, icon: "reports" as IconName } : t)) : TABS_V;
  return (
    <div className="sc-tabbar">
      {tabs.map(({ key, icon }) => {
        const on = key === active;
        const ic: IconName = key === "Home" ? (on ? "homeFill" : "homeDoor") : on && key === "Summary" ? "calendarCheckFill" : icon;
        return (
          <div key={key} className={`sc-tab${on ? " is-active" : ""}`}>
            {key === "Profile" ? (
              <span className="sc-tab-avatar">
                <svg viewBox="0 0 25 25" width="25" height="25" aria-hidden="true">
                  <circle cx="12.5" cy="10" r="4.6" fill="#7d7066" />
                  <path d="M3.6 25c.9-5.1 4.4-8 8.9-8s8 2.9 8.9 8z" fill="#5e534b" />
                </svg>
              </span>
            ) : (
              <Icon name={ic} size={25} stroke={1.6} />
            )}
            <span>{key}</span>
          </div>
        );
      })}
      <span className="sc-homebar" />
    </div>
  );
}

export type PhoneShellProps = {
  /** Active bottom tab. null = no tab bar (forms use `footer` instead). */
  tab?: PhoneTab | null;
  /** Third tab label: "docs" ([V] mocks, default) or "reports" (live site). */
  tabVariant?: "docs" | "reports";
  /** Sticky bottom area instead of the tab bar (e.g. Cancel / Submit). Includes the home indicator. */
  footer?: ReactNode;
  /** Draw the Dynamic Island pill (off by default: the 3D iPhone model has its own). */
  island?: boolean;
  /** 20 px side padding on the body (default true). */
  padded?: boolean;
  bodyClassName?: string;
  bodyStyle?: CSSProperties;
  children?: ReactNode;
};

/**
 * Full 402×874 phone screen: status bar (54 px) → body (flex, clipped) → tab bar (113 px incl. home
 * indicator) or footer. Body content starts right under the status area.
 */
export function PhoneShell({ tab = "Home", tabVariant = "docs", footer, island = false, padded = true, bodyClassName, bodyStyle, children }: PhoneShellProps) {
  return (
    <div className="sc sc-phone">
      <StatusBar island={island} />
      <div className={`sc-phone-body${padded ? " sc-phone-body--pad" : ""}${bodyClassName ? ` ${bodyClassName}` : ""}`} style={bodyStyle}>
        {children}
      </div>
      {footer !== undefined ? (
        <div className="sc-phone-footer">
          {footer}
          <span className="sc-homebar" />
        </div>
      ) : tab !== null ? (
        <TabBar active={tab} variant={tabVariant} />
      ) : (
        <div style={{ height: 34, position: "relative", flex: "none" }}>
          <span className="sc-homebar" />
        </div>
      )}
    </div>
  );
}

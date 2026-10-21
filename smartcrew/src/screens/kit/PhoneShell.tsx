import type { CSSProperties, ReactNode } from "react";
import { Icon } from "./Icon";

export type PhoneTab = "Home" | "Projects" | "Reports" | "Messages" | "Support" | "Jobsites" | "Docs" | "Summary" | "Profile";

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

const TABS: PhoneTab[] = ["Home", "Projects", "Reports", "Messages", "Support"];
// the old bar's tabs, where the updated app has them now
const NOW: Partial<Record<PhoneTab, PhoneTab>> = { Jobsites: "Projects", Docs: "Reports", Summary: "Home" };

// the updated app's own glyphs (James's screenshots, Oct 21): the Reports pulse, the Messages bubbles
const Pulse = ({ on }: { on: boolean }) => (
  <svg width="25" height="25" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="12" cy="12" r="9.6" fill={on ? "currentColor" : "none"} stroke="currentColor" strokeWidth={1.6} />
    <path d="M6.6 13.4l2.7-3.1 2.6 3.2 2.7-3.9 2.8 2.7" stroke={on ? "#fff" : "currentColor"} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const Bubbles = () => (
  <svg width="25" height="25" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M2.5 3.5h12.5v9H7l-4.5 3.6z" />
    <path d="M17 7h4.5v12.6L17.6 17H9v-2.6h8z" />
  </svg>
);
const PinFill = () => (
  <svg width="25" height="25" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M12 21.6s-7.2-6-7.2-11.8a7.2 7.2 0 0 1 14.4 0c0 5.8-7.2 11.8-7.2 11.8z" fill="currentColor" />
    <circle cx="12" cy="9.8" r="2.6" fill="#fff" />
  </svg>
);

/** Bottom tab bar, as in the updated app: Home · Projects · Reports · Messages (1 new) · Support, with the home indicator. */
export function TabBar({ active }: { active: PhoneTab | null; variant?: "docs" | "reports" }) {
  const lit = active ? (NOW[active] ?? active) : null;
  return (
    <div className="sc-tabbar">
      {TABS.map((key) => {
        const on = key === lit;
        const icon =
          key === "Home" ? (
            <Icon name={on ? "homeFill" : "homeDoor"} size={25} stroke={1.6} />
          ) : key === "Projects" ? (
            on ? <PinFill /> : <Icon name="mapPin" size={25} stroke={1.6} />
          ) : key === "Reports" ? (
            <Pulse on={on} />
          ) : key === "Messages" ? (
            <Bubbles />
          ) : (
            <Icon name="headset" size={25} stroke={on ? 2.1 : 1.6} />
          );
        return (
          <div key={key} className={`sc-tab${on ? " is-active" : ""}`}>
            <span className="sc-tab-ic">
              {icon}
              {key === "Messages" && !on && <span className="sc-tab-badge">1</span>}
            </span>
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

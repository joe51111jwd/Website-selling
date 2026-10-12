// The page's call-to-action primitives. Every CTA goes through openSignup (src/signup/contract.ts),
// tagged with where it was tapped, so the popup and the lead know the source.

import type { ReactNode } from "react";
import { openSignup, type Estimate, type Intent, type Size } from "../../signup/contract";
import { CTA } from "../../content/copy";

export function Arrow({ className = "btn-arrow" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path d="M3.5 9h10.2M9.6 4.6 14 9l-4.4 4.4" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export type CtaProps = {
  /** Section id it sits in (hero, sticky, day-profit, calculator, apps, offer, faq…). */
  source: string;
  intent?: Intent;
  size?: Size;
  estimate?: Estimate;
  label?: ReactNode;
  small?: boolean;
  light?: boolean;
  className?: string;
  id?: string;
};

/** The primary button: Andrew's dark bevelled button, "Get my free trial". */
export function Cta({ source, intent = "trial", size, estimate, label, small, light, className, id }: CtaProps) {
  return (
    <button
      type="button"
      id={id}
      className={`btn ${light ? "btn-light" : "btn-dark"}${small ? " btn-sm" : ""}${className ? ` ${className}` : ""}`}
      onClick={() => openSignup({ intent, source, size, estimate })}
    >
      {label ?? CTA.primary}
      <Arrow />
    </button>
  );
}

/** The quiet secondary: "or book a demo with Andrew" (same popup, intent=demo). */
export function DemoLink({ source, label = CTA.demoLink, className }: { source: string; label?: ReactNode; className?: string }) {
  return (
    <button type="button" className={`link${className ? ` ${className}` : ""}`} onClick={() => openSignup({ intent: "demo", source })}>
      {label}
    </button>
  );
}

/** An inline text CTA for peaks inside a scene ("Want this for your crew? Get my free trial →"). */
export function InlineCta({ source, label = CTA.inline, className }: { source: string; label?: ReactNode; className?: string }) {
  return (
    <button type="button" className={`link inline-cta${className ? ` ${className}` : ""}`} onClick={() => openSignup({ intent: "trial", source })}>
      {label}
      <Arrow className="btn-arrow" />
    </button>
  );
}

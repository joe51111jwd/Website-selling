// The page's call-to-action primitives. Every CTA goes through openSignup (src/signup/contract.ts),
// tagged with where it was tapped, so the popup and the lead know the source.
//
// The primary CTA (BRIEF round 2 §9) is the page's centrepiece: solid safety orange with an ink
// label, a keycap lip that lifts on hover and sinks on press, and one calm attention cue the first
// time it is fully on screen (./cue.ts: a geofence draws round it and closes). It carries the
// geofence cursor's "clocked in" state (data-cursor="cta") and passes any data-* / aria-* through.
// Orange is reserved for it (and the geofence / pulse signals); secondary actions are ink links.

import { useEffect, useRef, type ButtonHTMLAttributes, type ReactNode, type Ref } from "react";
import { openSignup, type Estimate, type Intent, type Size } from "../../signup/contract";
import { CTA } from "../../content/copy";
import { reducedMotion } from "../../three/stage";
import { watchPrimary } from "../shell/primaryCta";
import { playCue } from "./cue";
import { isPhone } from "../phone";
import "./cta.css";

export function Arrow({ className = "btn-arrow" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path d="M3.5 9h10.2M9.6 4.6 14 9l-4.4 4.4" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** sm: the header · md: in-scene (≥ 52 px) · lg: a scene's close · xl: the hero centrepiece (≥ 60 px; full width on phones). */
export type CtaSize = "sm" | "md" | "lg" | "xl";

type DataAttrs = { [k: `data-${string}`]: string | number | boolean | undefined };

export type CtaProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "type" | "onClick" | "children"> &
  DataAttrs & {
    /** Section id it sits in (hero, sticky, day-profit, calculator, apps, offer, faq…). */
    source: string;
    intent?: Intent;
    /** Pre-ticks the popup's crew-size step. */
    crewSize?: Size;
    /** The calculator's estimate, carried into the popup and the lead. */
    estimate?: Estimate;
    /** Built at click time instead of the props above (the calculator's live numbers). */
    request?: () => { intent: Intent; source: string; size?: Size; estimate?: Estimate };
    label?: ReactNode;
    size?: CtaSize;
    /** @deprecated use size="sm" */
    small?: boolean;
    /** Full width of its container. */
    block?: boolean;
    /** The cursor's tag once the fence closes ("Clocked in · {time}"); one per screen at most. */
    cursorLabel?: string;
    /** Play the one-time geofence cue when first fully on screen (default true). */
    cue?: boolean;
    /** Count it as "a scene's own primary CTA is on screen" (hides the header CTA and the phone's
     * sticky bar). Default true; the header and the sticky bar themselves pass false. */
    primary?: boolean;
    /** Shown after the label (default: the arrow). */
    icon?: ReactNode;
    ref?: Ref<HTMLButtonElement>;
  };

/** The primary button: solid orange "Get my free trial". */
export function Cta({
  source,
  intent = "trial",
  crewSize,
  estimate,
  request,
  label,
  size,
  small,
  block,
  cursorLabel,
  cue = true,
  primary = true,
  icon,
  className,
  ref,
  ...rest
}: CtaProps) {
  const el = useRef<HTMLButtonElement | null>(null);
  const sz: CtaSize = size ?? (small ? "sm" : "md");

  // a scene's own primary CTA on screen hides the header's and the sticky bar's
  useEffect(() => (primary && el.current ? watchPrimary(el.current) : undefined), [primary]);

  // the one-time cue, the first time the button is fully on screen and actually visible. Phones:
  // one calm cue per page, not one per button: only the hero's button and the sticky bar's first
  // appearance get it (the in-scene buttons sit still)
  useEffect(() => {
    const b = el.current;
    if (!cue || !b || reducedMotion || typeof IntersectionObserver === "undefined") return;
    if (isPhone() && source !== "hero" && source !== "sticky") return;
    let cancel: (() => void) | null = null;
    let poll = 0;
    let done = false;
    const shown = () =>
      !b.closest("[inert]") &&
      (typeof b.checkVisibility !== "function" || b.checkVisibility({ opacityProperty: true, visibilityProperty: true })) &&
      parseFloat(getComputedStyle(b).opacity || "1") > 0.6;
    const tryPlay = () => {
      if (done || !shown()) return false;
      done = true;
      io.disconnect();
      window.clearInterval(poll);
      cancel = playCue(b);
      return true;
    };
    const io = new IntersectionObserver(
      ([e]) => {
        window.clearInterval(poll);
        if (!e.isIntersecting || done) return;
        // wait a beat (it may still be fading in); keep checking while it stays on screen
        poll = window.setInterval(tryPlay, 320);
      },
      { threshold: 0.98 },
    );
    io.observe(b);
    return () => {
      io.disconnect();
      window.clearInterval(poll);
      cancel?.();
    };
  }, [cue, source]);

  const setRef = (n: HTMLButtonElement | null) => {
    el.current = n;
    if (typeof ref === "function") ref(n);
    else if (ref) (ref as { current: HTMLButtonElement | null }).current = n;
  };

  return (
    <button
      type="button"
      data-cursor="cta"
      data-cursor-label={cursorLabel}
      data-cursor-magnet={sz === "sm" ? 4 : sz === "xl" ? 7 : undefined}
      {...rest}
      ref={setRef}
      className={`cta cta--${sz}${block ? " cta--block" : ""}${className ? ` ${className}` : ""}`}
      onClick={() => openSignup(request ? request() : { intent, source, size: crewSize, estimate })}
    >
      <span className="cta-label">{label ?? CTA.primary}</span>
      {icon ?? <Arrow className="cta-arrow" />}
    </button>
  );
}

/** The quiet secondary: "or book a demo with Andrew" (same popup, intent=demo). An ink link. */
export function DemoLink({ source, label = CTA.demoLink, arrow, className }: { source: string; label?: ReactNode; arrow?: boolean; className?: string }) {
  return (
    <button type="button" className={`link${className ? ` ${className}` : ""}`} onClick={() => openSignup({ intent: "demo", source })}>
      {label}
      {arrow && <Arrow />}
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

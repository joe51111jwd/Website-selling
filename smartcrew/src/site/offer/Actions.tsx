// The offer's and the close's call-to-action row. Same look and the same openSignup() contract as
// src/site/ui/Cta.tsx, plus the geofence cursor's attributes (src/cursor: data-cursor="cta"
// closes the fence around the button and shows the "Clocked in · {time}" tag). Cta.tsx doesn't
// forward data-* attributes, and a wrapper can't carry them (the cursor resolves the nearest
// button first), so these two buttons live here.

import { forwardRef, type ReactNode } from "react";
import { openSignup } from "../../signup/contract";
import { CTA } from "../../content/copy";
import { Arrow } from "../ui/Cta";

type TrialProps = {
  source: string;
  label?: ReactNode;
  /** The cursor tag once the fence closes; omit for a plain solid fence. */
  cursorLabel?: string;
  className?: string;
};

export const TrialButton = forwardRef<HTMLButtonElement, TrialProps>(function TrialButton({ source, label, cursorLabel, className }, ref) {
  return (
    <button
      ref={ref}
      type="button"
      className={`btn btn-dark${className ? ` ${className}` : ""}`}
      data-cursor="cta"
      data-cursor-label={cursorLabel}
      onClick={() => openSignup({ intent: "trial", source })}
    >
      {label ?? CTA.primary}
      <Arrow />
    </button>
  );
});

/** The quiet secondary (same popup, intent=demo). `arrow` for a standalone link. */
export function DemoButton({ source, label = CTA.demoLink, arrow, className }: { source: string; label?: ReactNode; arrow?: boolean; className?: string }) {
  return (
    <button type="button" className={`link${className ? ` ${className}` : ""}`} onClick={() => openSignup({ intent: "demo", source })}>
      {label}
      {arrow && <Arrow />}
    </button>
  );
}

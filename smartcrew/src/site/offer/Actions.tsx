// The offer's and the close's call-to-action row: the shared orange <Cta> (src/site/ui/Cta.tsx),
// with the geofence cursor's tag, and the quiet ink demo link beside it.

import type { ReactNode, Ref } from "react";
import { openSignup } from "../../signup/contract";
import { CTA } from "../../content/copy";
import { Arrow, Cta, type CtaSize } from "../ui/Cta";

type TrialProps = {
  source: string;
  label?: ReactNode;
  /** The cursor tag once the fence closes; omit for a plain solid fence. */
  cursorLabel?: string;
  className?: string;
  size?: CtaSize;
  block?: boolean;
  /** The one-time geofence cue on first view (default true; the offer plays it once the slip is signed). */
  cue?: boolean;
  ref?: Ref<HTMLButtonElement>;
};

export function TrialButton({ source, label, cursorLabel, className, size = "lg", block, cue, ref }: TrialProps) {
  return <Cta ref={ref} source={source} label={label} cursorLabel={cursorLabel} className={className} size={size} block={block} cue={cue} />;
}

/** The quiet secondary (same popup, intent=demo). `arrow` for a standalone link. */
export function DemoButton({ source, label = CTA.demoLink, arrow, className }: { source: string; label?: ReactNode; arrow?: boolean; className?: string }) {
  return (
    <button type="button" className={`link${className ? ` ${className}` : ""}`} onClick={() => openSignup({ intent: "demo", source })}>
      {label}
      {arrow && <Arrow />}
    </button>
  );
}

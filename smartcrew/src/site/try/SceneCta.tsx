// The primary CTA for Try it and Your number: the shared orange <Cta>, with the request built at
// click time (the calculator's live numbers ride along). Every CTA still goes through openSignup().
// Its one-time cue is the keycap press (./keycap.ts), not the shared dashed ring.

import { useCallback, useEffect, useRef } from "react";
import type { SignupRequest } from "../../signup/contract";
import { Cta, type CtaSize } from "../ui/Cta";
import { keycapOnce } from "./keycap";

export function SceneCta({
  request,
  label,
  className,
  size = "lg",
  cursorLabel,
}: {
  request: () => SignupRequest;
  label?: string;
  className?: string;
  size?: CtaSize;
  cursorLabel?: string;
}) {
  const r = request();
  const source = r.source;
  // <Cta> hands its ref over again on every render (null, then the button): watch each button once
  const el = useRef<HTMLButtonElement | null>(null);
  const off = useRef<(() => void) | null>(null);
  const ref = useCallback(
    (b: HTMLButtonElement | null) => {
      if (!b || b === el.current) return;
      off.current?.();
      el.current = b;
      off.current = keycapOnce(b, source);
    },
    [source],
  );
  useEffect(() => {
    if (el.current && !off.current) off.current = keycapOnce(el.current, source);
    return () => {
      off.current?.();
      off.current = null;
    };
  }, [source]);
  return (
    <Cta
      ref={ref}
      cue={false}
      source={r.source}
      request={request}
      label={label}
      className={className}
      size={size}
      cursorLabel={cursorLabel}
      data-hides-sticky=""
    />
  );
}

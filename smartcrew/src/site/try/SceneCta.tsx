// The primary CTA for Try it and Your number: the shared orange <Cta>, with the request built at
// click time (the calculator's live numbers ride along). Every CTA still goes through openSignup().

import type { SignupRequest } from "../../signup/contract";
import { Cta, type CtaSize } from "../ui/Cta";

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
  return <Cta source={r.source} request={request} label={label} className={className} size={size} cursorLabel={cursorLabel} data-hides-sticky="" />;
}

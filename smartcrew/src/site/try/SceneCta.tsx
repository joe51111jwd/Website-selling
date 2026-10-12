// The primary CTA for Try it and Your number: the page's dark bevelled button (same classes and
// label as ui/Cta), carrying the cursor's "clocked in" attribute (data-cursor="cta"), which
// ui/Cta doesn't pass through yet. Every CTA still goes through openSignup().

import { CTA } from "../../content/copy";
import { openSignup, type SignupRequest } from "../../signup/contract";
import { Arrow } from "../ui/Cta";

export function SceneCta({ request, label = CTA.primary, className }: { request: () => SignupRequest; label?: string; className?: string }) {
  return (
    <button
      type="button"
      className={`btn btn-dark${className ? ` ${className}` : ""}`}
      onClick={() => openSignup(request())}
      data-cursor="cta"
      data-hides-sticky
    >
      {label}
      <Arrow />
    </button>
  );
}

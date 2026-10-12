import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { onSignup, type SignupRequest } from "./contract";
import { captureAttribution } from "../lib/lead";
import { startTracking } from "../lib/track";

// "Set up your SmartCrew": the popup every CTA opens through openSignup() (./contract). This shell
// is tiny so it costs nothing on first paint: it keeps the ad's attribution, listens for
// openSignup(), and loads the dialog itself in the background once the page is idle, so the first
// tap opens it instantly.

const loadDialog = () => import("./Dialog");
const Dialog = lazy(loadDialog);

export default function Signup() {
  const [req, setReq] = useState<SignupRequest | null>(null);
  const [mounted, setMounted] = useState(false);
  const opener = useRef<HTMLElement | null>(null);

  useEffect(() => {
    captureAttribution();
    startTracking();
    const off = onSignup((r) => {
      // remember the button that opened it, to hand focus back on close
      const a = document.activeElement;
      opener.current = a instanceof HTMLElement && a !== document.body ? a : null;
      setReq(r);
      setMounted(true);
    });
    // warm the dialog chunk (and its fonts and preview) once the page has settled; Safari has no
    // requestIdleCallback, so it gets a plain timeout
    const warm = () => void loadDialog().then(() => setMounted(true));
    const idle = typeof window.requestIdleCallback === "function";
    const id = idle ? window.requestIdleCallback(warm, { timeout: 4000 }) : window.setTimeout(warm, 1800);
    return () => {
      off();
      if (idle) window.cancelIdleCallback(id);
      else window.clearTimeout(id);
    };
  }, []);

  if (!mounted) return null;
  return (
    <Suspense fallback={null}>
      <Dialog req={req} opener={opener} onClose={() => setReq(null)} />
    </Suspense>
  );
}

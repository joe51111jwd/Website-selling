import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "../../styles/tokens.css";
import Signup from "../Signup";
import { openSignup, sizeFor } from "../contract";

// Dev-only harness for the popup (not part of any build): http://127.0.0.1:5310/src/signup/dev/
// Opens the popup the way the page will, so it can be built and screenshotted on its own.

function reset() {
  try {
    sessionStorage.clear();
  } catch {
    /* ignore */
  }
  location.reload();
}

const est = { crew: 18, minutes: 10, rate: 35, days: 250, annual: 26250 };

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <div style={{ minHeight: "100vh", background: "var(--ground)", padding: 40, fontFamily: "system-ui", display: "flex", gap: 12, flexWrap: "wrap", alignContent: "flex-start" }}>
      <button id="t-trial" onClick={() => openSignup({ intent: "trial", source: "hero" })}>Get my free trial</button>
      <button id="t-demo" onClick={() => openSignup({ intent: "demo", source: "hero-demo" })}>Book a demo</button>
      <button id="t-calc" onClick={() => openSignup({ intent: "trial", source: "calculator", size: sizeFor(est.crew), estimate: est })}>From calculator</button>
      <button id="t-reset" onClick={reset}>Reset</button>
    </div>
    <Signup />
  </StrictMode>,
);

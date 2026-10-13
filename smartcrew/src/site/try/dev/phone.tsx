// Dev-only PHONE harness (not in the build): a stand-in "end of One Day" screen, then the spec
// sheet, Try it and Your number in their phone versions, then a stand-in screen; the real header,
// sticky bar and popup. No Stage, no cursor, no Lenis (as on a phone). ?at=<scene id> scrolls there.
import { StrictMode, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { MotionConfig } from "motion/react";
import "../../../styles/fonts.css";
import "../../../styles/tokens.css";
import "../../../styles/base.css";
import "../../../styles/shell.css";
import "../../../styles/type-roles.css";
import { Scene } from "../../scene/Scene";
import { Header } from "../../shell/Header";
import { StickyBar } from "../../shell/StickyBar";
import Signup from "../../../signup/Signup";
import { onSignup } from "../../../signup/contract";
import SpecSheet from "../../specsheet/SpecSheet";
import TryIt from "../TryIt";
import YourNumber from "../../number/YourNumber";

function Plain({ id, title }: { id: string; title: string }) {
  return (
    <Scene id={id} pinnedViewports={1} stage="keep" label={title}>
      <div className="wrap" style={{ paddingTop: "calc(var(--header-h) + 20svh)" }}>
        <h2 className="t-h2" style={{ color: "var(--ink-3)" }}>
          {title}
        </h2>
      </div>
    </Scene>
  );
}

function Harness() {
  useEffect(() => {
    document.documentElement.classList.add("sc-page");
    const off = onSignup((r) => console.log("[phone dev] openSignup", JSON.stringify(r)));
    const at = new URLSearchParams(location.search).get("at");
    const t = at ? window.setTimeout(() => document.getElementById(at)?.scrollIntoView({ behavior: "instant" as ScrollBehavior }), 300) : 0;
    return () => {
      off();
      window.clearTimeout(t);
    };
  }, []);
  return (
    <MotionConfig reducedMotion="user">
      <div className="backdrop" aria-hidden="true" />
      <Header />
      <main className="site">
        <Plain id="top" title="… Friday payroll. (One Day, stand-in)" />
        <SpecSheet />
        <TryIt />
        <YourNumber />
        <Plain id="proof" title="Proof (stand-in)" />
      </main>
      <StickyBar />
      <Signup />
    </MotionConfig>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Harness />
  </StrictMode>,
);

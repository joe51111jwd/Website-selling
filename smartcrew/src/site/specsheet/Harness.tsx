// Dev-only harness for the spec sheet (not in the build): http://127.0.0.1:5310/src/site/specsheet/dev.html
// It mounts the page's shell around the section (global styles, header, phone sticky bar, popup,
// cursor, smooth scroll) with a plain stand-in screen before and after it, so the section can be
// checked while App.tsx doesn't mount it yet.
//   ?full     the real Hero → One Day before it and Try it after it, on the real 3D Stage
//   ?at=specs scroll straight to the section on load (any scene id)

import { StrictMode, Suspense, lazy, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { MotionConfig } from "motion/react";
import "@fontsource-variable/archivo/wdth.css";
import "@fontsource-variable/hanken-grotesk/wght.css";
import "../../styles/tokens.css";
import "../../styles/base.css";
import "../../styles/shell.css";
import { Header } from "../shell/Header";
import { StickyBar } from "../shell/StickyBar";
import Signup from "../../signup/Signup";
import Cursor from "../../cursor/Cursor";
import { startSmoothScroll } from "../scroll";
import { onSignup } from "../../signup/contract";
import { Scene } from "../scene/Scene";
import SpecSheet from "./SpecSheet";

const Stage = lazy(() => import("../../three/stage/Stage"));
const Hero = lazy(() => import("../hero/Hero"));
const Day = lazy(() => import("../day/Day"));
const TryIt = lazy(() => import("../try/TryIt"));

document.documentElement.classList.add("sc-page", "no-intro");
const q = new URLSearchParams(location.search);
const full = q.has("full");

function Plain({ id, title }: { id: string; title: string }) {
  return (
    <Scene id={id} pinnedViewports={1} label={title}>
      <div className="wrap" style={{ paddingTop: "calc(var(--header-h) + 22svh)" }}>
        <h2 className="t-h2" style={{ color: "var(--ink-3)" }}>
          {title}
        </h2>
      </div>
    </Scene>
  );
}

function Harness() {
  useEffect(() => startSmoothScroll(), []);
  useEffect(() => onSignup((r) => console.log("[specsheet dev] openSignup", JSON.stringify(r))), []);
  useEffect(() => {
    const at = q.get("at");
    if (!at) return;
    const t = window.setTimeout(() => document.getElementById(at)?.scrollIntoView({ behavior: "instant" as ScrollBehavior }), full ? 1200 : 120);
    return () => window.clearTimeout(t);
  }, []);
  return (
    <MotionConfig reducedMotion="user">
      <div className="backdrop" aria-hidden="true" />
      {full && (
        <Suspense fallback={null}>
          <Stage />
        </Suspense>
      )}
      <Header />
      <main className="site">
        <Suspense fallback={null}>
          {full ? <Hero /> : <Plain id="top" title="Hero (stand-in)" />}
          {full ? <Day /> : <Plain id="day" title="… Friday payroll. (One Day, stand-in)" />}
          <SpecSheet />
          {full ? <TryIt /> : <Plain id="try" title="Your guys won’t fight this one. (Try it, stand-in)" />}
        </Suspense>
      </main>
      <StickyBar />
      <Signup />
      <Cursor />
    </MotionConfig>
  );
}

// keep one root across hot reloads of this module
const w = window as unknown as { __specRoot?: ReturnType<typeof createRoot> };
w.__specRoot ??= createRoot(document.getElementById("root")!);
w.__specRoot.render(
  <StrictMode>
    <Harness />
  </StrictMode>,
);

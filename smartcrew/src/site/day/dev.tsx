// Entry for dev.html (dev server only). Mounts the shell pieces the Day scene needs around it.
import { lazy, StrictMode, Suspense, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { MotionConfig } from "motion/react";
import "@fontsource-variable/archivo/wdth.css";
import "@fontsource-variable/hanken-grotesk/wght.css";
import "../../styles/tokens.css";
import "../../styles/base.css";
import "../../styles/shell.css";
import { Header } from "../shell/Header";
import { StickyBar } from "../shell/StickyBar";
import Cursor from "../../cursor/Cursor";
import { startSmoothScroll } from "../scroll";
import { onSignup } from "../../signup/contract";
import { Scene } from "../scene/Scene";
import Hero from "../hero/Hero";
import Day from "./Day";

document.documentElement.classList.add("sc-page", "no-intro");
const Stage = lazy(() => import("../../three/stage/Stage"));

function After() {
  return (
    <Scene id="try" pinnedViewports={2} label="After" className="day-dev-after">
      <div className="wrap" style={{ paddingTop: "calc(var(--header-h) + 20svh)" }}>
        <h2 className="t-h2">The next scene.</h2>
      </div>
    </Scene>
  );
}

function DevApp() {
  useEffect(() => startSmoothScroll(), []);
  useEffect(() => onSignup((r) => console.log("[day dev] openSignup", JSON.stringify(r))), []);
  return (
    <MotionConfig reducedMotion="user">
      <div className="backdrop" aria-hidden="true" />
      <Suspense fallback={null}>
        <Stage />
      </Suspense>
      <Header />
      <main className="site">
        <Hero />
        <Day />
        <After />
      </main>
      <StickyBar />
      <Cursor />
    </MotionConfig>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <DevApp />
  </StrictMode>,
);

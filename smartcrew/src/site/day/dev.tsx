// Entry for dev.html (dev server only). Mounts the shell pieces the Day scene needs around it.
import { lazy, StrictMode, Suspense, useEffect, useMemo } from "react";
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
import { StageAnchor, exitKeys, returnKeys } from "../../three/stage";

document.documentElement.classList.add("sc-page", "no-intro");
const Stage = lazy(() => import("../../three/stage/Stage"));

/** A scene the devices leave (Stage exitKeys): they glide and turn out of the viewport. */
function After() {
  const poses = useMemo(() => exitKeys(), []);
  return (
    <Scene id="try" pinnedViewports={2} poses={poses} label="After" className="day-dev-after">
      <div className="wrap" style={{ paddingTop: "calc(var(--header-h) + 20svh)" }}>
        <h2 className="t-h2">The devices leave.</h2>
      </div>
    </Scene>
  );
}

/** A scene they come back to (Stage returnKeys). */
function Back() {
  const poses = useMemo(
    () =>
      returnKeys(
        {
          anchor: "dev-back",
          frame: [6, 4],
          macbook: { x: 0.5, y: 0.1, z: 0, rx: 10, ry: -18, rz: 0, s: 1, screen: "web-dashboard" },
          iphone: { x: -1.6, y: -0.3, z: 0.9, rx: 4, ry: 16, rz: 2, s: 1.1, screen: "phone-home" },
          float: 0.3,
          look: 0.5,
        },
      ),
    [],
  );
  return (
    <Scene id="number" pinnedViewports={2} poses={poses} label="Back" className="day-dev-back">
      <div className="wrap" style={{ display: "grid", gridTemplateColumns: "1fr 1.4fr", height: "100%", paddingTop: "var(--header-h)" }}>
        <h2 className="t-h2" style={{ alignSelf: "center" }}>They come back.</h2>
        <StageAnchor id="dev-back" />
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
        <Back />
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

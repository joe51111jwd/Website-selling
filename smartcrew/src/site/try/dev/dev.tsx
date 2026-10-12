// Dev-only harness (not in the build): a stand-in "end of One Day" scene with both devices, then
// Try it, Your number and a spacer, on the real Stage, header, sticky bar, popup and cursor.
import { StrictMode, Suspense, lazy, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { MotionConfig } from "motion/react";
import "@fontsource-variable/archivo/wdth.css";
import "@fontsource-variable/hanken-grotesk/wght.css";
import "../../../styles/tokens.css";
import "../../../styles/base.css";
import "../../../styles/shell.css";
import { Scene } from "../../scene/Scene";
import { StageAnchor } from "../../../three/stage/StageAnchor";
import { reveal } from "../../../three/stage/store";
import type { PoseKey } from "../../../three/stage/types";
import { Header } from "../../shell/Header";
import { StickyBar } from "../../shell/StickyBar";
import Signup from "../../../signup/Signup";
import Cursor from "../../../cursor/Cursor";
import TryIt from "../TryIt";
import YourNumber from "../../number/YourNumber";

const Stage = lazy(() => import("../../../three/stage/Stage"));

const BEFORE: PoseKey[] = [
  {
    at: 0,
    anchor: "before",
    frame: [5.0, 3.4],
    iphone: { x: 1.45, y: -0.2, z: 1.1, rx: 3, ry: -20, rz: -2, s: 1.24, screen: "phone-summary" },
    macbook: { x: -0.65, y: 0.18, z: -0.7, rx: 14, ry: 26, rz: 0, s: 1, screen: "web-timecards" },
    float: 0.35,
    look: 0.6,
  },
  { at: 1, anchor: "before" },
];

function Before() {
  return (
    <Scene id="before" pinnedViewports={1.5} poses={BEFORE} label="Before">
      <div className="wrap" style={{ display: "grid", gridTemplateColumns: "1fr 1.4fr", height: "100%", paddingTop: "var(--header-h)" }}>
        <h2 className="t-h2" style={{ alignSelf: "center" }}>Friday. Payroll without the scramble.</h2>
        <StageAnchor id="before" />
      </div>
    </Scene>
  );
}

function After() {
  return (
    <Scene id="after" pinnedViewports={1} label="After">
      <div className="wrap" style={{ paddingTop: 120 }}>
        <h2 className="t-h2">Next scene</h2>
      </div>
    </Scene>
  );
}

function Harness() {
  useEffect(() => {
    document.documentElement.classList.add("sc-page");
    reveal();
  }, []);
  return (
    <MotionConfig reducedMotion="user">
      <div className="backdrop" aria-hidden="true" />
      <Suspense fallback={null}>
        <Stage />
      </Suspense>
      <Header />
      <main className="site">
        <Before />
        <TryIt />
        <YourNumber />
        <After />
      </main>
      <StickyBar />
      <Signup />
      <Cursor />
    </MotionConfig>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Harness />
  </StrictMode>,
);

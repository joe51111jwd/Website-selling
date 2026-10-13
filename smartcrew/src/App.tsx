// The SmartCrew product page: "One Day". One fixed 3D Stage behind the page; the scenes in
// BRIEF order on top of it; the header, the phone's sticky CTA bar and the trial popup around them.
// Phones (src/site/phone.ts) get the light build: no Stage (three.js never loads), no Lenis, no
// custom cursor; the hero and One Day render their 2D phone versions.

import { lazy, startTransition, Suspense, useEffect, useState } from "react";
import { MotionConfig } from "motion/react";
import Signup from "./signup/Signup";
import { Header } from "./site/shell/Header";
import { StickyBar } from "./site/shell/StickyBar";
import { startIntro, onIntroPhase, getIntroPhase, useIntroPhase } from "./site/intro/intro";
import { lockScroll, startSmoothScroll } from "./site/scroll";
import { forceStage3d, isPhone, onPhoneChange, phoneAtLoad, stageAllowed, usePhone } from "./site/phone";
import { setStageMounted, watchLayout } from "./three/stage/store";
import { startTracking } from "./lib/track";
import Hero from "./site/hero/Hero";
import Day from "./site/day/Day";
import SpecSheet from "./site/specsheet/SpecSheet";
import TryIt from "./site/try/TryIt";
import YourNumber from "./site/number/YourNumber";
import Proof from "./site/proof/Proof";
import FiveApps from "./site/apps/FiveApps";
import Offer from "./site/offer/Offer";
import Faq from "./site/faq/Faq";
import Footer from "./site/footer/Footer";

// three.js and the models load in their own chunk, in parallel with the page (the intro and the
// posters cover the wait). Never on phones: the import only runs when <Stage/> first renders.
const Stage = lazy(() => import("./three/stage/Stage"));
// the geofence cursor (mouse/trackpad only): its own chunk, never fetched on phones
const Cursor = lazy(() => import("./cursor/Cursor"));

/** The scenes after One Day, in page order (phones mount them progressively: useLateScenes). */
const LATER = [SpecSheet, TryIt, YourNumber, Proof, FiveApps, Offer, Faq, Footer];

/**
 * PHONE MODE: the first render is the hero and One Day only (7 screens of scroll); the scenes
 * after them mount one by one in idle time, as low-priority transitions (React renders them in
 * 5 ms slices), after the intro has handed over, so the boot never blocks the first screen and
 * no mount is a long task (all eight are in within ~2 s; One Day alone is 7 screens of scroll).
 * A #hash on load mounts them at once. Desktop mounts everything at once.
 */
function useLateScenes() {
  const [n, setN] = useState(() => (!phoneAtLoad || (typeof location !== "undefined" && location.hash.length > 1) ? LATER.length : 0));
  const phase = useIntroPhase();
  useEffect(() => {
    // scenes that came in late may carry markers the shell looks for (data-hides-sticky)
    window.dispatchEvent(new Event("sc:scenes"));
    // the intro's hand-over gets a quiet main thread: the late scenes start once it's over
    if (n >= LATER.length || phase !== "done") return;
    const idle = (f: () => void) =>
      typeof window.requestIdleCallback === "function" ? window.requestIdleCallback(f, { timeout: 600 }) : window.setTimeout(f, 160);
    const cancel = (id: number) => (typeof window.cancelIdleCallback === "function" ? window.cancelIdleCallback(id) : clearTimeout(id));
    let id = 0;
    const raf = requestAnimationFrame(() => (id = idle(() => startTransition(() => setN((k) => Math.min(LATER.length, k + 1))))));
    return () => {
      cancelAnimationFrame(raf);
      cancel(id);
    };
  }, [n, phase]);
  return n;
}

export default function App() {
  const phone = usePhone();
  const later = useLateScenes();
  const stageOn = stageAllowed && (!phone || forceStage3d);
  // scenes, anchors and pose keys are measured by the store (no three.js), with or without the Stage
  useEffect(() => watchLayout(), []);
  // no Stage: the page is in its no-3D state (posters stay up)
  useEffect(() => setStageMounted(stageOn), [stageOn]);

  useEffect(() => {
    startIntro();
    startTracking();
    // smooth wheel scrolling (desktop only) starts once the intro has handed over
    let stop = () => {};
    const sync = () => {
      stop();
      stop = () => {};
      if (getIntroPhase() === "done" && !isPhone()) stop = startSmoothScroll();
    };
    sync();
    const off = onIntroPhase((p) => p === "done" && sync());
    const offPhone = onPhoneChange(sync);
    // the trial popup: smooth scroll stops underneath it while it's open
    const onPopup = (e: Event) => lockScroll(!!(e as CustomEvent<{ open: boolean }>).detail?.open);
    window.addEventListener("smartcrew:signup-state", onPopup);
    return () => {
      off();
      offPhone();
      stop();
      window.removeEventListener("smartcrew:signup-state", onPopup);
    };
  }, []);

  // reducedMotion="user": motion drops transform animations for people who ask for less motion
  return (
    <MotionConfig reducedMotion="user">
      <div className="backdrop" aria-hidden="true" />
      {stageOn && (
        <Suspense fallback={null}>
          <Stage />
        </Suspense>
      )}
      <Header />
      <main className="site">
        <Hero />
        <Day />
        {LATER.slice(0, later).map((S, i) => (
          <S key={i} />
        ))}
      </main>
      <StickyBar />
      <Signup />
      {/* the geofence cursor: mounts only for a mouse or trackpad (fine pointer), portals to <body>; never on phones */}
      {!phone && (
        <Suspense fallback={null}>
          <Cursor />
        </Suspense>
      )}
    </MotionConfig>
  );
}

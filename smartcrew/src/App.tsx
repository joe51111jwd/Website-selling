// The SmartCrew product page: "One Day". One fixed 3D Stage behind the page; the scenes in
// BRIEF order on top of it; the header, the phone's sticky CTA bar and the trial popup around them.

import { lazy, Suspense, useEffect } from "react";
import { MotionConfig } from "motion/react";
import Signup from "./signup/Signup";
import { Header } from "./site/shell/Header";
import { StickyBar } from "./site/shell/StickyBar";
import { startIntro, onIntroPhase, getIntroPhase } from "./site/intro/intro";
import { lockScroll, startSmoothScroll } from "./site/scroll";
import { startTracking } from "./lib/track";
import Hero from "./site/hero/Hero";
import Day from "./site/day/Day";
import TryIt from "./site/try/TryIt";
import YourNumber from "./site/number/YourNumber";
import Proof from "./site/proof/Proof";
import FiveApps from "./site/apps/FiveApps";
import Offer from "./site/offer/Offer";
import Faq from "./site/faq/Faq";
import Footer from "./site/footer/Footer";
import Cursor from "./cursor/Cursor";

// three.js and the models load in their own chunk, in parallel with the page (the intro and the
// posters cover the wait)
const Stage = lazy(() => import("./three/stage/Stage"));

export default function App() {
  useEffect(() => {
    startIntro();
    startTracking();
    // smooth wheel scrolling starts once the intro has handed over
    let stop = () => {};
    if (getIntroPhase() === "done") stop = startSmoothScroll();
    const off = onIntroPhase((p) => p === "done" && (stop = startSmoothScroll()));
    // the trial popup: smooth scroll stops underneath it while it's open
    const onPopup = (e: Event) => lockScroll(!!(e as CustomEvent<{ open: boolean }>).detail?.open);
    window.addEventListener("smartcrew:signup-state", onPopup);
    return () => {
      off();
      stop();
      window.removeEventListener("smartcrew:signup-state", onPopup);
    };
  }, []);

  // reducedMotion="user": motion drops transform animations for people who ask for less motion
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
        <TryIt />
        <YourNumber />
        <Proof />
        <FiveApps />
        <Offer />
        <Faq />
        <Footer />
      </main>
      <StickyBar />
      <Signup />
      {/* the geofence cursor: mounts only for a mouse or trackpad (fine pointer), portals to <body> */}
      <Cursor />
    </MotionConfig>
  );
}

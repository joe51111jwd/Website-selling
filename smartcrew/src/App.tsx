// The SmartCrew product page: "One Day". One fixed 3D Stage behind the page; the scenes in
// BRIEF order on top of it; the header, the phone's sticky CTA bar and the trial popup around them.
// Phones (src/site/phone.ts) get the light build: no Stage (three.js never loads), no Lenis, no
// custom cursor; the hero and One Day render their 2D phone versions.

import { lazy, memo, startTransition, Suspense, useEffect, useState, type ComponentType } from "react";
import { MotionConfig } from "motion/react";
import Signup from "./signup/Signup";
import { Header } from "./site/shell/Header";
import { StickyBar } from "./site/shell/StickyBar";
import { startIntro, onIntroPhase, getIntroPhase, useIntroPhase } from "./site/intro/intro";
import { lockScroll, startSmoothScroll } from "./site/scroll";
import { forceStage3d, isPhone, onPhoneChange, phoneAtLoad, stageAllowed, usePhone } from "./site/phone";
import { setStageMounted, watchLayout } from "./three/stage/store";
import { startTracking } from "./lib/track";
import { startWarmAhead } from "./site/phone/warmAhead";
import HeroScene from "./site/hero/Hero";
import DayScene from "./site/day/Day";

// three.js and the models load in their own chunk, in parallel with the page (the intro and the
// posters cover the wait). Never on phones: the import only runs when <Stage/> first renders.
const Stage = lazy(() => import("./three/stage/Stage"));
// the geofence cursor (mouse/trackpad only): its own chunk, never fetched on phones
const Cursor = lazy(() => import("./cursor/Cursor"));

/**
 * The scenes after One Day, in page order, each in its own chunk (with its CSS and its phone
 * version), so the first screen's JS is only the hero and One Day: less to download and evaluate
 * at boot on a phone. Desktop starts fetching all of them at once, in parallel with the first
 * render (they land well inside the intro); phones fetch and mount them one by one after the
 * intro (useLateScenes).
 */
type SceneModule = { default: ComponentType };
function lateScene(load: () => Promise<SceneModule>) {
  let p: Promise<SceneModule> | null = null;
  const get = () => (p ??= load());
  return { get, C: lazy(get) };
}
const LATER_SCENES = [
  lateScene(() => import("./site/specsheet/SpecSheet")),
  lateScene(() => import("./site/try/TryIt")),
  lateScene(() => import("./site/number/YourNumber")),
  lateScene(() => import("./site/proof/Proof")),
  lateScene(() => import("./site/apps/FiveApps")),
  lateScene(() => import("./site/offer/Offer")),
  lateScene(() => import("./site/faq/Faq")),
  lateScene(() => import("./site/footer/Footer")),
];
if (!phoneAtLoad) LATER_SCENES.forEach((sc) => void sc.get());

const LATER: ComponentType[] = LATER_SCENES.map((sc) => memo(sc.C));
// App re-renders when the intro changes phase; the scenes subscribe to what they need themselves,
// so they don't re-render with it (One Day's seven screens, in the frame the hand-over starts)
const Hero = memo(HeroScene);
const Day = memo(DayScene);
const hashOnLoad = typeof location !== "undefined" && location.hash.length > 1 ? location.hash.slice(1) : "";

/**
 * PHONE MODE: the first render is the hero and One Day only (7 screens of scroll); the scenes
 * after them mount one by one in idle time, as low-priority transitions (React renders them in
 * 5 ms slices), after the intro has handed over, so the boot never blocks the first screen and
 * no mount is a long task (all eight are in within ~2 s; One Day alone is 7 screens of scroll).
 * A #hash on load mounts them at once. Desktop mounts everything at once.
 */
/**
 * PHONE MODE: the boot renders the hero alone (its first task overlapped the intro's truck and
 * geofence, which animate on the main thread). One Day mounts as a transition in the intro's quiet
 * stretch: after its map animations (≈ 1.25 s into the intro), before the hand-over move; at once
 * when there is no intro, or as soon as the intro is skipped.
 */
const DAY_AT = 1250;
function useDayOnPhone() {
  const [on, setOn] = useState(() => !phoneAtLoad || !!hashOnLoad);
  const phase = useIntroPhase();
  useEffect(() => {
    if (on) return;
    const go = () => startTransition(() => setOn(true));
    if (phase !== "playing") return go();
    const t0 = window.__intro?.t0 ?? 0;
    const id = window.setTimeout(go, Math.max(0, DAY_AT - (performance.now() - t0)));
    return () => window.clearTimeout(id);
  }, [on, phase]);
  return on;
}

function useLateScenes() {
  const [n, setN] = useState(() => (!phoneAtLoad || hashOnLoad ? LATER.length : 0));
  const phase = useIntroPhase();
  useEffect(() => {
    // scenes that came in late may carry markers the shell looks for (data-hides-sticky)
    window.dispatchEvent(new Event("sc:scenes"));
    // the intro's hand-over gets a quiet main thread: the late scenes start once it's over. One
    // at a time: its chunk (JS + CSS: adding a stylesheet restyles the page) in idle time, then
    // its mount as a transition in the next idle moment, then the next scene
    if (n >= LATER.length || phase !== "done") return;
    const idle = (f: () => void) =>
      typeof window.requestIdleCallback === "function" ? window.requestIdleCallback(f, { timeout: 600 }) : window.setTimeout(f, 160);
    const cancel = (id: number) => (typeof window.cancelIdleCallback === "function" ? window.cancelIdleCallback(id) : clearTimeout(id));
    let id = 0;
    let dead = false;
    const mount = () => (id = idle(() => !dead && startTransition(() => setN((k) => Math.min(LATER.length, k + 1)))));
    const raf = requestAnimationFrame(
      () =>
        (id = idle(() => {
          if (dead) return;
          LATER_SCENES[n]
            .get()
            .then(() => !dead && mount())
            .catch(() => !dead && mount());
        })),
    );
    return () => {
      dead = true;
      cancelAnimationFrame(raf);
      cancel(id);
    };
  }, [n, phase]);
  return n;
}

/** A #hash on load (#faq…): its scene arrives with its chunk, so scroll to it once it's there. */
function useHashOnLoad() {
  useEffect(() => {
    if (!hashOnLoad) return;
    let tries = 0;
    const id = window.setInterval(() => {
      const el = document.getElementById(hashOnLoad);
      if (el || ++tries > 40) window.clearInterval(id);
      if (el) requestAnimationFrame(() => el.scrollIntoView());
    }, 100);
    return () => window.clearInterval(id);
  }, []);
}

export default function App() {
  useHashOnLoad();
  const phone = usePhone();
  const later = useLateScenes();
  const dayOn = useDayOnPhone();
  const stageOn = stageAllowed && (!phone || forceStage3d);
  // scenes, anchors and pose keys are measured by the store (no three.js), with or without the Stage
  useEffect(() => watchLayout(), []);
  // phones: the next screens lay out in idle time before they scroll in (after the intro)
  const introPhase = useIntroPhase();
  const lite = phone && !forceStage3d;
  useEffect(() => (lite && introPhase === "done" ? startWarmAhead() : undefined), [lite, introPhase]);
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
        {dayOn && <Day />}
        {LATER.slice(0, later).map((S, i) => (
          // each scene loads on its own: a scene still on its way never blanks the page
          <Suspense key={i} fallback={null}>
            <S />
          </Suspense>
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

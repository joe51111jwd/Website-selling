// The SmartCrew product page: "One Day". One fixed 3D Stage behind the page; the scenes in
// BRIEF order on top of it; the header, the phone's sticky CTA bar and the trial popup around them.
// Phones (src/site/phone.ts) get the light build: no Stage (three.js never loads), no Lenis, no
// custom cursor; the hero and One Day render their 2D phone versions.

import { lazy, memo, startTransition, Suspense, useEffect, useState, type ComponentType } from "react";
import { MotionConfig } from "motion/react";
import Signup from "./signup/Signup";
import { Header } from "./site/shell/Header";
import { StickyBar } from "./site/shell/StickyBar";
import { onPageReady, useFirstScreenDone } from "./site/ready";
import { lockScroll, startSmoothScroll } from "./site/scroll";
import { forceStage3d, isPhone, onPhoneChange, phoneAtLoad, stageAllowed, usePhone } from "./site/phone";
import { setStageMounted, watchLayout } from "./three/stage/store";
import { startTracking } from "./lib/track";
import { startWarmAhead } from "./site/phone/warmAhead";
import HeroScene from "./site/hero/Hero";
import DayScene from "./site/day/Day";

// three.js and the models load in their own chunk once the first screen has landed (the hero's
// button is in place: src/site/ready.ts), so evaluating it and the first GL work never land in
// the middle of the hero's entrance; the posters cover the wait and the devices are parked below
// the fold. Never on phones: the import only runs when <Stage/> first renders.
const Stage = lazy(() => import("./three/stage/Stage"));
// the geofence cursor (mouse/trackpad only): its own chunk, never fetched on phones
const Cursor = lazy(() => import("./cursor/Cursor"));

/**
 * The scenes after One Day, in page order, each in its own chunk (with its CSS and its phone
 * version), so the first screen's JS is only the hero and One Day: less to download and evaluate
 * at boot on a phone. Desktop starts fetching all of them at once, in parallel with the first
 * render; phones fetch and mount them one by one once the first screen is done
 * (useLateScenes, src/site/ready.ts).
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
// App re-renders when the first screen is done; the scenes subscribe to what they need
// themselves, so they don't re-render with it (One Day's seven screens)
const Hero = memo(HeroScene);
const Day = memo(DayScene);
const hashOnLoad = typeof location !== "undefined" && location.hash.length > 1 ? location.hash.slice(1) : "";

const idle = (f: () => void) =>
  typeof window.requestIdleCallback === "function" ? window.requestIdleCallback(f, { timeout: 600 }) : window.setTimeout(f, 160);
const cancelIdle = (id: number) => (typeof window.cancelIdleCallback === "function" ? window.cancelIdleCallback(id) : clearTimeout(id));

/**
 * PHONE MODE: the boot renders the hero alone, so the first frame comes fast; One Day (the very
 * next screen) follows at once as a low-priority transition (rendered in 5 ms slices while the
 * hero's fonts arrive). A #hash on load renders it at boot. Desktop renders it at boot.
 */
function useDayOnPhone() {
  const [on, setOn] = useState(() => !phoneAtLoad || !!hashOnLoad);
  useEffect(() => {
    if (!on) startTransition(() => setOn(true));
  }, [on]);
  return on;
}

/**
 * PHONE MODE: the scenes after One Day mount one by one in idle time, as low-priority transitions
 * (React renders them in 5 ms slices), once the first screen is done (src/site/ready.ts: the
 * hero's entrance has played out, or the visitor has started scrolling), so none of their mounts
 * lands in the middle of the entrance as a long task. They are seven screens of One Day further
 * down, all in within ~2 s. A #hash on load mounts them at once. Desktop mounts everything at
 * once.
 */
function useLateScenes() {
  const [n, setN] = useState(() => (!phoneAtLoad || hashOnLoad ? LATER.length : 0));
  const go = useFirstScreenDone();
  useEffect(() => {
    // scenes that came in late may carry markers the shell looks for (data-hides-sticky)
    window.dispatchEvent(new Event("sc:scenes"));
    // one at a time: its chunk (JS + CSS: adding a stylesheet restyles the page) in idle time,
    // then its mount as a transition in the next idle moment, then the next scene
    if (n >= LATER.length || !go) return;
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
      cancelIdle(id);
    };
  }, [n, go]);
  return n;
}

/** Desktop: the Stage mounts in the first idle moment after the first screen has landed (at once for a #hash on load). */
function useStageGo() {
  const [go, setGo] = useState(() => !!hashOnLoad);
  useEffect(() => {
    if (go) return;
    let id = 0;
    const off = onPageReady(() => (id = idle(() => setGo(true))));
    return () => {
      off();
      cancelIdle(id);
    };
  }, [go]);
  return go;
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
  const stageWanted = stageAllowed && (!phone || forceStage3d);
  const stageGo = useStageGo();
  const stageOn = stageWanted && stageGo;
  // scenes, anchors and pose keys are measured by the store (no three.js), with or without the Stage
  useEffect(() => watchLayout(), []);
  // phones: the next screens lay out in idle time before they scroll in (once the first screen is done)
  const firstDone = useFirstScreenDone();
  const lite = phone && !forceStage3d;
  useEffect(() => (lite && firstDone ? startWarmAhead() : undefined), [lite, firstDone]);
  // no Stage: the page is in its no-3D state (posters stay up)
  useEffect(() => {
    // (while the Stage waits for the first screen, the page is not in its no-3D state: the
    // posters are simply up until its first frame)
    if (stageWanted && !stageGo) return;
    setStageMounted(stageOn);
  }, [stageOn, stageWanted, stageGo]);

  useEffect(() => {
    startTracking();
    // smooth wheel scrolling (desktop only)
    let stop = () => {};
    const sync = () => {
      stop();
      stop = isPhone() ? () => {} : startSmoothScroll();
    };
    sync();
    const offPhone = onPhoneChange(sync);
    // the trial popup: smooth scroll stops underneath it while it's open
    const onPopup = (e: Event) => lockScroll(!!(e as CustomEvent<{ open: boolean }>).detail?.open);
    window.addEventListener("smartcrew:signup-state", onPopup);
    return () => {
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

// t1 lab: the REAL page (a copy of src/App.tsx, same scene list and scheduling) with "The Site
// Model" hero (./HeroT1.tsx) in place of the page's hero. Keep in step with src/App.tsx.
// ?t1Solo renders the header and the hero alone (no 3D Stage, no later scenes): the hero's own cost.
//
// The SmartCrew product page: "One Day". One fixed 3D Stage behind the page; the scenes in
// BRIEF order on top of it; the header, the phone's sticky CTA bar and the trial popup around them.
// Phones (src/site/phone.ts) get the light build: no Stage (three.js never loads), no Lenis, no
// custom cursor; the hero and One Day render their 2D phone versions.

import { lazy, memo, startTransition, Suspense, useEffect, useState, type ComponentType } from "react";
import { MotionConfig } from "motion/react";
import Signup from "../../signup/Signup";
import { Header } from "../../site/shell/Header";
import { StickyBar } from "../../site/shell/StickyBar";
import { onPageReady, useFirstScreenDone } from "../../site/ready";
import { lockScroll, startSmoothScroll } from "../../site/scroll";
import { forceStage3d, isPhone, onPhoneChange, phoneAtLoad, stageAllowed, usePhone } from "../../site/phone";
import { setStageMounted, watchLayout } from "../../three/stage/store";
import { startTracking } from "../../lib/track";
import { startWarmAhead } from "../../site/phone/warmAhead";
import HeroScene from "./HeroT1";
import DayScene from "../../site/day/Day";

// three.js and the models load in their own chunk once the hero's entrance has played its main
// beats (useAfterEntrance, src/site/ready.ts), so evaluating it and the first GL work never land
// in the middle of it; the posters cover the wait and the devices are parked below the fold.
// Never on phones: the import only runs when <Stage/> first renders.
const Stage = lazy(() => import("../../three/stage/Stage"));
// the geofence cursor (mouse/trackpad only): its own chunk, never fetched on phones
const Cursor = lazy(() => import("../../cursor/Cursor"));

/**
 * The scenes after One Day, in page order, each in its own chunk (with its CSS and its phone
 * version), so the first screen's JS is only the hero and One Day: less to download and evaluate
 * at boot. They are fetched and mounted after the hero's entrance, never in the middle of it
 * (useLateScenes, src/site/ready.ts).
 */
type SceneModule = { default: ComponentType };
function lateScene(load: () => Promise<SceneModule>) {
  let p: Promise<SceneModule> | null = null;
  const get = () => (p ??= load());
  return { get, C: lazy(get) };
}
const LATER_SCENES = [
  lateScene(() => import("../../site/specsheet/SpecSheet")),
  lateScene(() => import("../../site/try/TryIt")),
  lateScene(() => import("../../site/number/YourNumber")),
  lateScene(() => import("../../site/proof/Proof")),
  lateScene(() => import("../../site/apps/FiveApps")),
  lateScene(() => import("../../site/offer/Offer")),
  lateScene(() => import("../../site/faq/Faq")),
  lateScene(() => import("../../site/footer/Footer")),
];

const LATER: ComponentType[] = LATER_SCENES.map((sc) => memo(sc.C));
// App re-renders when the first screen is done; the scenes subscribe to what they need
// themselves, so they don't re-render with it (One Day's seven screens)
const Hero = memo(HeroScene);
const Day = memo(DayScene);
/** lab only: ?t1Solo renders the header and the hero alone, no 3D Stage (the hero's own cost; captures) */
const SOLO = typeof location !== "undefined" && /[?&]t1Solo\b/.test(location.search);
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
    if (on) return;
    // t1: the site model's camera move needs the main thread quiet for ~0.9 s (its commits would
    // cost it frames on a slow phone): One Day mounts once the camera has landed (READY), or at
    // once on the first input. ?t1DayBoot: the page's own scheduling (mount at boot).
    if (DAY_AT_BOOT) return startTransition(() => setOn(true));
    return onPageReady(() => startTransition(() => setOn(true)));
  }, [on]);
  return on;
}
const DAY_AT_BOOT = typeof location !== "undefined" && /[?&]t1DayBoot\b/.test(location.search);

/**
 * The scenes after One Day mount after the first screen, as low-priority transitions (React
 * renders them in 5 ms slices; each chunk's stylesheet restyles the page as it lands), so none of
 * it lands in the middle of the hero's entrance as a long task:
 * - desktop: all at once (their chunks in parallel) once the entrance's main beats are over
 *   (READY + 1.2 s: the button has landed and its fence has closed; at once on the first input),
 *   so the header's FAQ link and the 3D Stage's later keys are there within a couple of seconds;
 * - phones: one by one in idle time once the first screen is done (DONE: the entrance has played
 *   out, or the visitor has started scrolling); they are seven screens of One Day further down,
 *   all in within ~2 s.
 * A #hash on load mounts them at once.
 */
function useLateScenes() {
  const [n, setN] = useState(() => (hashOnLoad ? LATER.length : 0));
  const after = useAfterEntrance();
  const done = useFirstScreenDone();
  useEffect(() => {
    if (!phoneAtLoad && after && n < LATER.length) startTransition(() => setN(LATER.length));
  }, [after, n]);
  useEffect(() => {
    // scenes that came in late may carry markers the shell looks for (data-hides-sticky)
    window.dispatchEvent(new Event("sc:scenes"));
    // phones, one at a time: its chunk (JS + CSS: adding a stylesheet restyles the page) in idle
    // time, then its mount as a transition in the next idle moment, then the next scene
    if (n >= LATER.length || !phoneAtLoad || !done) return;
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
  }, [n, done]);
  return n;
}

/**
 * Desktop: the entrance's main beats are over: the hero's button has landed and its own fence has
 * closed round it (READY + 1.2 s), or the visitor has started using the page (DONE). The 3D Stage
 * and the scenes after One Day start their work then, so their chunks' evaluation, their styles
 * and the first GL work never land on the headline's or the button's fence while they draw
 * (those two draw on the main thread on desktop). At once for a #hash on load.
 */
const ENTRANCE_TAIL = 1200;
function useAfterEntrance() {
  const done = useFirstScreenDone();
  const [late, setLate] = useState(() => !!hashOnLoad);
  useEffect(() => {
    if (late) return;
    let t = 0;
    const off = onPageReady(() => (t = window.setTimeout(() => setLate(true), ENTRANCE_TAIL)));
    return () => {
      off();
      clearTimeout(t);
    };
  }, [late]);
  return late || done;
}

/** Desktop: the Stage mounts in the first idle moment after the entrance's main beats. */
function useStageGo() {
  const after = useAfterEntrance();
  const [go, setGo] = useState(() => !!hashOnLoad);
  useEffect(() => {
    if (go || !after) return;
    const id = idle(() => setGo(true));
    return () => cancelIdle(id);
  }, [go, after]);
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

export default function DevApp() {
  useHashOnLoad();
  const phone = usePhone();
  const later = useLateScenes();
  const dayOn = useDayOnPhone();
  const stageWanted = stageAllowed && (!phone || forceStage3d) && !SOLO;
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
        {dayOn && !SOLO && <Day />}
        {LATER.slice(0, SOLO ? 0 : later).map((S, i) => (
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

// The intro (BRIEF ROUND 2 §5). Its first frame and its whole notification sequence are plain
// HTML/CSS/SVG in index.html, so it paints before any JS (the Facebook in-app browser shows it
// at once) while the rest of the page loads underneath: the jobsite map at night, Marcus's truck
// crossing the geofence (the fence closes solid, "6:42 AM · Marcus Bell clocked in"), a load
// logged at the pit (9:20 AM), the job's profit at 5:00 PM.
//
// The hand-over into the hero is snapshot and swap (HERO_SPEC §7): when the hold ends (or on any
// input) this module freezes the intro's last frame and reads where everything is on screen
// (../hero/fence/handoff.ts). The hero rebuilds that frame in its own night layer on one animation
// frame, moving the intro's nodes (the contour map, the notifications, the night logo) rather
// than copying them; #intro is removed on that frame and #topo is retired for the session. The
// hero then plays one continuous move into the day: the camera pushes in on the jobsite, the
// dawn spreads from the fence, the fence re-stakes itself round the headline's words.
// Once per session; never with reduced motion (the gate is the inline script in index.html).

import { useSyncExternalStore } from "react";
import { reveal } from "../../three/stage/store";
import { isPhoneLite } from "../phone";
import { abandonHandoff, handoffState, heroHandoff, skipHandoff, type Frozen, type IntroSnapshot, type Pt } from "../hero/fence/handoff";

export type IntroPhase = "playing" | "revealing" | "done";

type IntroGlobal = { t0: number; skipped: boolean; onSkip: (() => void) | null; off?: () => void };
declare global {
  interface Window {
    __intro?: IntroGlobal;
  }
}

const html = typeof document !== "undefined" ? document.documentElement : null;
let phase: IntroPhase = html?.classList.contains("intro-on") ? "playing" : "done";
/** Whether this page view opens with the intro (the hero then takes over its last frame). */
export const introRan = phase === "playing";

const subs = new Set<() => void>();
function setPhase(p: IntroPhase) {
  if (phase === p) return;
  phase = p;
  subs.forEach((f) => f());
}

export const getIntroPhase = () => phase;
export function useIntroPhase() {
  return useSyncExternalStore(
    (f) => (subs.add(f), () => void subs.delete(f)),
    () => phase,
    () => "done" as IntroPhase,
  );
}
export function onIntroPhase(fn: (p: IntroPhase) => void) {
  const f = () => fn(phase);
  subs.add(f);
  return () => void subs.delete(f);
}

/** The CSS sequence lands its last notification at ~1.75 s; this leaves it a beat to be read. */
const HOLD = 2080;
/**
 * PHONE MODE: the same story, shorter (index.html plays the CSS sequence at PHONE_RATE×: its last
 * notification lands at ~1.56 s); the hero's move is transform and opacity only.
 */
const PHONE_RATE = 1.4;
const HOLD_PHONE = 1700;
/** How long before the move the 3D starts drawing (hidden, parked below the fold) to get its first heavy frames done. */
const WARM = 560;
/** The hero normally takes over at once; if it isn't laid out within this, the intro fades out on its own. */
const WAIT_MAX = 1500;

let started = false;

export function startIntro() {
  if (started) return;
  started = true;
  const ui = document.getElementById("intro");
  const topo = document.getElementById("topo");
  const I = window.__intro;
  if (!html) return;
  if (phase === "done" || !ui || !topo || !I) {
    ui?.remove();
    if (topo) topo.style.display = "none";
    html.classList.remove("intro-on");
    setPhase("done");
    return;
  }

  let done = false;
  const finish = () => {
    if (done) return;
    done = true;
    ui.remove();
    // the hero's own contours are the ground from here: the intro's map never comes back (§7.3)
    topo.style.display = "none";
    html.classList.remove("intro-on", "intro-out", "intro-skip");
    I.off?.();
    themeDay();
    setPhase("done");
  };

  const lite = isPhoneLite();
  const hold = lite ? HOLD_PHONE : HOLD;

  // skipped before the app arrived: the CSS is already fading to the day; the hero builds as if
  // there had been no intro
  const fadeTopo = () => {
    topo.style.transition = "opacity 0.3s ease";
    topo.style.opacity = "0";
  };
  if (I.skipped) {
    abandonHandoff();
    fadeTopo();
    setPhase("revealing");
    reveal();
    themeDay();
    window.setTimeout(finish, 340);
    return;
  }

  /** The hero could not take over (not laid out in time): fade to the day, the hero builds on its own. */
  const fallback = () => {
    abandonHandoff();
    html.classList.add("intro-skip");
    fadeTopo();
    reveal();
    themeDay();
    window.setTimeout(finish, 340);
  };

  let exiting = false;
  let timer = 0;
  const exit = (skip: boolean, debug = false) => {
    if (exiting) return;
    exiting = true;
    clearTimeout(timer);
    const snap = snapshot(ui, topo);
    setPhase("revealing");
    reveal();
    const ok = heroHandoff(snap, {
      skip,
      phone: lite,
      debug,
      onSwap: () => {
        ui.remove();
        topo.style.display = "none";
        themeDay();
      },
      onDone: finish,
    });
    if (!ok) return fallback();
    I.onSkip = () => skipHandoff();
    window.setTimeout(() => {
      if (handoffState() !== "taken" && !done) fallback();
    }, WAIT_MAX);
  };

  // ?introDebug: hold the intro and expose __introSeek(ms) to render any frame (for captures):
  // up to the hold it seeks the CSS sequence, past it the hero's move (window.__hero.seek)
  if (new URLSearchParams(location.search).has("introDebug")) {
    I.onSkip = null;
    I.off?.();
    (window as unknown as { __introSeek: (ms: number) => void }).__introSeek = (ms: number) => {
      if (!exiting) seekCss(ui, topo, Math.min(ms, hold) * (lite ? PHONE_RATE : 1));
      if (ms > hold || (ms === hold && exiting)) {
        if (!exiting) exit(false, true);
        (window as unknown as { __hero?: { seek: (ms: number) => void } }).__hero?.seek(ms - hold);
      }
    };
    return;
  }
  I.onSkip = () => exit(true);

  // time since the CSS sequence actually started (its first frame can come well after the inline
  // gate script ran: fonts, first layout), so the move never cuts the last notification short
  const st = ui.querySelector(".i-n1")?.getAnimations()[0]?.startTime;
  const elapsed = performance.now() - (typeof st === "number" ? st : I.t0);
  timer = window.setTimeout(() => exit(false), Math.max(0, hold - elapsed));
  // let the 3D draw its first frames (shader compiles, texture uploads) under the map, half a
  // second before the move: the devices are parked below the fold (the hero's pose), so the
  // first screen never shows them
  if (!lite) window.setTimeout(() => !exiting && reveal(), Math.max(0, HOLD - WARM - elapsed));
}

function themeDay() {
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", "#FBF8F4");
}

/** Pause every CSS animation of the intro at `ms` (debug seeking). */
function seekCss(ui: HTMLElement, topo: HTMLElement, ms: number) {
  introAnimations(ui, topo).forEach((a) => {
    a.pause();
    a.currentTime = ms;
  });
}

/** The intro's own CSS animations: the map's and the notifications' (not the page's). */
function introAnimations(ui: HTMLElement, topo: HTMLElement): Animation[] {
  return [...topo.getAnimations({ subtree: true }), ...ui.getAnimations({ subtree: true })];
}

// ─── the snapshot ────────────────────────────────────────────────────────────

const num = (el: Element, name: string) => parseFloat(getComputedStyle(el).getPropertyValue(name)) || 0;
const META = new Set(["offset", "computedOffset", "easing", "composite"]);

/**
 * Write what every running animation under `root` shows right now into inline style and stop the
 * animations, so the nodes can be moved (moving a node restarts its CSS animations) and still look
 * exactly as they did.
 */
function freezeSubtree(root: Element) {
  const byTarget = new Map<Element, Animation[]>();
  for (const a of root.getAnimations({ subtree: true })) {
    const t = (a.effect as KeyframeEffect | null)?.target;
    if (t) (byTarget.get(t) ?? byTarget.set(t, []).get(t)!).push(a);
  }
  const writes: [HTMLElement | SVGElement, [string, string][]][] = [];
  for (const [t, anims] of byTarget) {
    const cs = getComputedStyle(t);
    const props = new Set<string>();
    anims.forEach((a) => (a.effect as KeyframeEffect).getKeyframes().forEach((k) => Object.keys(k).forEach((p) => !META.has(p) && props.add(p))));
    writes.push([t as HTMLElement | SVGElement, [...props].map((p) => [p, String(cs[p as keyof CSSStyleDeclaration] ?? "")])]);
  }
  for (const [t, vals] of writes) {
    t.getAnimations().forEach((a) => a.cancel());
    t.style.animation = "none";
    for (const [p, v] of vals) (t.style as unknown as Record<string, string>)[p] = v;
  }
}

/** Freeze one element where it is: its layout box without its transform, plus its transform and opacity. */
function freeze<E extends HTMLElement | SVGSVGElement>(el: E): Frozen<E> {
  const cs = getComputedStyle(el);
  const opacity = +cs.opacity;
  const transform = cs.transform && cs.transform !== "none" ? cs.transform : "none";
  const origin = cs.transformOrigin;
  el.getAnimations().forEach((a) => a.cancel());
  el.style.animation = "none";
  el.style.transition = "none";
  el.style.opacity = String(opacity);
  el.style.transform = "none";
  const r = el.getBoundingClientRect();
  el.style.transform = transform;
  return { el, left: r.left, top: r.top, width: r.width, height: r.height, transform, origin, opacity };
}

function toScreen(m: DOMMatrix, x: number, y: number): Pt {
  return [m.a * x + m.c * y + m.e, m.b * x + m.d * y + m.f];
}

/** Freeze the intro's last frame and read it (HERO_SPEC §7.1). */
function snapshot(ui: HTMLElement, topo: HTMLElement): IntroSnapshot {
  // stop where it is (a skip can land anywhere in the sequence). Only the intro's own animations:
  // document.getAnimations() would bring the style of the whole page up to date first
  introAnimations(ui, topo).forEach((a) => a.pause());
  const svg = topo.querySelector<SVGSVGElement>("svg.t-map")!;
  const fenceEl = svg.querySelector<SVGPolygonElement>(".t-fence")!;
  const zoneEl = svg.querySelector<SVGPolygonElement>(".t-zone");
  const labelEl = [...svg.querySelectorAll<SVGTextElement>(".t-label")].find((t) => !t.classList.contains("t-label-sm"))!;
  const truck = svg.querySelector<SVGGElement>(".t-truck");
  const truckIn = svg.querySelector<SVGGElement>(".t-truck-in")!;
  const ring = svg.querySelector<SVGCircleElement>(".t-truck-ring");

  // read everything first (one style + layout pass), then freeze
  const fm = fenceEl.getScreenCTM()!;
  const fence: Pt[] = [];
  for (let i = 0; i < fenceEl.points.numberOfItems; i++) {
    const p = fenceEl.points.getItem(i);
    fence.push(toScreen(fm, p.x, p.y));
  }
  const S = Math.hypot(fm.a, fm.b);
  const fenceOn = +getComputedStyle(fenceEl).opacity;
  const zone = zoneEl ? parseFloat(getComputedStyle(zoneEl).fillOpacity) || 0 : 0;
  const lm = labelEl.getScreenCTM()!;
  const label = { rect: labelEl.getBoundingClientRect(), text: labelEl, ctm: DOMMatrix.fromMatrix(lm), opacity: +getComputedStyle(labelEl).opacity };
  const tm = truckIn.getScreenCTM()!;
  const mb = {
    at: toScreen(tm, 0, 0),
    group: truckIn,
    ctm: DOMMatrix.fromMatrix(tm),
    opacity: truck ? +getComputedStyle(truck).opacity : 1,
    ring: ring ? +getComputedStyle(ring).opacity : 1,
  };
  const camera = { fx: num(topo, "--fx"), fy: num(topo, "--fy"), z: num(topo, "--z") };

  freezeSubtree(svg);
  const note = (k: string) => freeze(ui.querySelector<HTMLElement>(`.i-note[data-note="${k}"]`)!);
  const cards = { clockin: note("clockin"), load: note("load"), profit: note("profit") };
  const logoEl = ui.querySelector<SVGSVGElement>(".i-logo");
  const skipEl = ui.querySelector<HTMLElement>(".i-skip");
  return {
    fence,
    fenceOn,
    zone,
    S,
    camera,
    label,
    mb,
    cards,
    map: freeze(svg),
    logo: logoEl ? freeze(logoEl) : null,
    skip: skipEl ? freeze(skipEl) : null,
  };
}

// The intro, "Clock in" (BRIEF §0). Its first frame and its first 1.9 s are plain HTML/CSS/SVG
// in index.html, so it paints before any JS (the Facebook in-app browser shows it instantly)
// while the 3D models load underneath. This module takes over when the app boots: it waits for
// the end of that sequence (or a skip), then opens the geofence: the jobsite's outline becomes a
// hole that grows past the edges of the screen, the map zooming with it, revealing the hero in
// one continuous move. Total ≤ 2.4 s; any input skips it; once per session; never with reduced
// motion (the gate is the inline script in index.html).

import { useSyncExternalStore } from "react";
import { reveal, status, onStatus } from "../../three/stage/store";

export type IntroPhase = "playing" | "revealing" | "done";

type IntroGlobal = { t0: number; skipped: boolean; onSkip: (() => void) | null; off?: () => void };
declare global {
  interface Window {
    __intro?: IntroGlobal;
  }
}

let phase: IntroPhase = typeof document !== "undefined" && document.documentElement.classList.contains("intro-on") ? "playing" : "done";
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

const HOLD = 1850; // the CSS sequence's last beat lands at ~1.8 s
const LATEST = 2050; // don't wait for the 3D any longer than this
const EXIT = 560;
const EXIT_SKIP = 420;

let started = false;

export function startIntro() {
  if (started) return;
  started = true;
  const el = document.getElementById("intro");
  const I = window.__intro;
  const html = document.documentElement;
  if (phase === "done" || !el || !I) {
    el?.remove();
    html.classList.remove("intro-on");
    setPhase("done");
    return;
  }

  let exiting = false;
  const finish = () => {
    el.remove();
    html.classList.remove("intro-on", "intro-skip");
    I.off?.();
    setPhase("done");
  };

  // skipped before the app arrived: the CSS is already fading it out
  if (I.skipped) {
    setPhase("revealing");
    reveal();
    window.setTimeout(finish, 360);
    return;
  }

  const exit = (dur: number) => {
    if (exiting) return;
    exiting = true;
    clearTimeout(timer);
    offStatus();
    setPhase("revealing");
    reveal();
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", "#FBF8F4");
    el.classList.add("is-exit");
    const render = fence(el);
    const t0 = performance.now();
    const frame = () => {
      const t = Math.min(1, (performance.now() - t0) / dur);
      render(t);
      if (t < 1) requestAnimationFrame(frame);
      else finish();
    };
    requestAnimationFrame(frame);
  };

  // ?introDebug: hold the intro and expose __introSeek(ms) to render any frame (for screenshots)
  if (new URLSearchParams(location.search).has("introDebug")) {
    I.onSkip = null;
    I.off?.();
    let render: ((t: number) => void) | null = null;
    (window as unknown as { __introSeek: (ms: number) => void }).__introSeek = (ms: number) => {
      const svg = el.querySelector<SVGSVGElement>("svg.i-map");
      document.getAnimations().forEach((a) => {
        const target = (a.effect as KeyframeEffect | null)?.target as Element | null;
        if (target && el.contains(target)) {
          a.pause();
          a.currentTime = Math.min(ms, HOLD);
        }
      });
      svg?.pauseAnimations();
      svg?.setCurrentTime(Math.min(ms, HOLD) / 1000);
      if (ms > HOLD) {
        if (!render) {
          el.classList.add("is-exit");
          setPhase("revealing");
          reveal();
          render = fence(el);
        }
        render(Math.min(1, (ms - HOLD) / EXIT));
      }
    };
    return;
  }
  I.onSkip = () => exit(EXIT_SKIP);

  const elapsed = performance.now() - I.t0;
  let timer = 0;
  let offStatus = () => {};
  const go = () => exit(EXIT);
  timer = window.setTimeout(
    () => {
      // the sequence is done: open as soon as the devices are ready, but never later than LATEST
      if (status.ready) return go();
      offStatus = onStatus(() => status.ready && go());
      timer = window.setTimeout(go, Math.max(0, LATEST - (performance.now() - I.t0)));
    },
    Math.max(0, HOLD - elapsed),
  );
}

/** The geofence becomes a hole and grows past the screen; the map zooms with it. Returns render(t). */
function fence(el: HTMLElement): (t: number) => void {
  const svg = el.querySelector<SVGSVGElement>("svg.i-map");
  const zone = el.querySelector<SVGPolygonElement>(".i-zone");
  const ctm = zone?.getScreenCTM();
  if (!svg || !zone || !ctm) return (t) => void (el.style.opacity = String(1 - t));
  const W = window.innerWidth;
  const H = window.innerHeight;
  const pts: [number, number][] = [];
  for (let i = 0; i < zone.points.numberOfItems; i++) {
    const p = zone.points.getItem(i);
    const q = new DOMPoint(p.x, p.y).matrixTransform(ctm);
    pts.push([q.x, q.y]);
  }
  const cx = pts.reduce((s, p) => s + p[0], 0) / pts.length;
  const cy = pts.reduce((s, p) => s + p[1], 0) / pts.length;
  const inner = Math.min(...pts.map(([x, y]) => Math.hypot(x - cx, y - cy))) * 0.62;
  const far = Math.max(Math.hypot(cx, cy), Math.hypot(W - cx, cy), Math.hypot(cx, H - cy), Math.hypot(W - cx, H - cy));
  const end = (far / Math.max(inner, 1)) * 1.15;
  const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const f = (n: number) => n.toFixed(1);
  return (t: number) => {
    const s = Math.exp(Math.log(end) * ease(t));
    const hole = pts.map(([x, y]) => `${f(cx + (x - cx) * s)}px ${f(cy + (y - cy) * s)}px`);
    el.style.clipPath = `polygon(evenodd, 0px 0px, ${W}px 0px, ${W}px ${H}px, 0px ${H}px, 0px 0px, ${hole.join(", ")}, ${hole[0]}, 0px 0px)`;
    svg.style.transform = `matrix(${s}, 0, 0, ${s}, ${f(cx * (1 - s))}, ${f(cy * (1 - s))})`;
  };
}

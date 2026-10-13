// The intro (BRIEF ROUND 2 §5). Its first frame and its whole notification sequence are plain
// HTML/CSS/SVG in index.html, so it paints before any JS (the Facebook in-app browser shows it
// at once) while the 3D models load underneath: the jobsite map at night, Marcus's truck crossing
// the geofence (the fence closes solid, "6:42 AM · Marcus Bell clocked in"), a load logged at the
// pit (9:20 AM), the job's profit at 5:00 PM.
//
// This module plays the hand-over into the hero as ONE continuous move (no curtain, no cut):
// the camera pulls back off the map, the ground warms from night to day, the map settles into
// the hero's faint ground (#topo stays, under the 3D), the devices rise in, and the clock-in and
// profit notifications glide onto the laptop, where they become the hero's own toast and profit
// card (src/site/hero/cards.ts) while the hero copy builds. ≤ 3 s in all; any input skips it
// (a faster version of the same move); once per session; never with reduced motion (the gate is
// the inline script in index.html). If the 3D isn't ready yet, the hero's poster still stands
// in and the 3D swaps in once its entrance has settled.

import { useSyncExternalStore } from "react";
import { reveal, status, onStatus } from "../../three/stage/store";
import { cardTarget, introFinished, landCard, type CardId } from "../hero/cards";

export type IntroPhase = "playing" | "revealing" | "done";

type IntroGlobal = { t0: number; skipped: boolean; onSkip: (() => void) | null; off?: () => void };
declare global {
  interface Window {
    __intro?: IntroGlobal;
  }
}

const html = typeof document !== "undefined" ? document.documentElement : null;
let phase: IntroPhase = html?.classList.contains("intro-on") ? "playing" : "done";
/** Whether this page view opens with the intro (the hero then receives its notifications). */
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
const EXIT = 820;
const EXIT_SKIP = 540;
/** How long before the move the 3D starts drawing (hidden) to get its first heavy frames done. */
const WARM = 560;
/** The day state of the map (must match `#topo.is-day` in index.html). */
const DAY = { fx: 800, fy: 500, z: 1.06 };

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
    html.classList.remove("intro-on");
    setPhase("done");
    return;
  }

  const finish = () => {
    ui.remove();
    dayMap(topo);
    for (const el of document.querySelectorAll<HTMLElement>(".stage, .site-header, .hero .stage-poster")) {
      el.style.removeProperty("opacity");
      el.style.removeProperty("transition");
    }
    html.classList.remove("intro-on", "intro-out", "intro-skip");
    I.off?.();
    setPhase("done");
    introFinished();
  };

  // skipped before the app arrived: the CSS is already fading to the day
  if (I.skipped) {
    setPhase("revealing");
    reveal();
    themeDay();
    window.setTimeout(finish, 340);
    return;
  }

  let exiting = false;
  let timer = 0;
  const exit = (dur: number) => {
    if (exiting) return;
    exiting = true;
    clearTimeout(timer);
    const render = begin(ui, topo);
    // the move runs on a clamped clock: a stalled frame (the 3D's first draw, a slow phone)
    // pauses it for that frame instead of jumping it ahead, so no frame ever reads as a cut
    let tt = 0;
    let last = performance.now();
    const frame = () => {
      const now = performance.now();
      tt += Math.min(now - last, 50);
      last = now;
      const t = Math.min(1, tt / dur);
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
    let done = false;
    (window as unknown as { __introSeek: (ms: number) => void }).__introSeek = (ms: number) => {
      if (done) return;
      if (!render) seekCss(ui, topo, Math.min(ms, HOLD));
      if (ms > HOLD) {
        if (!render) render = begin(ui, topo);
        const t = Math.min(1, (ms - HOLD) / EXIT);
        render(t);
        if (t >= 1) {
          done = true;
          finish();
        }
      }
    };
    return;
  }
  I.onSkip = () => exit(EXIT_SKIP);

  // time since the CSS sequence actually started (its first frame can come well after the inline
  // gate script ran: fonts, first layout), so the move never cuts the last notification short
  const st = ui.querySelector(".i-n1")?.getAnimations()[0]?.startTime;
  const elapsed = performance.now() - (typeof st === "number" ? st : I.t0);
  timer = window.setTimeout(() => exit(EXIT), Math.max(0, HOLD - elapsed));
  // let the 3D draw its first frames (shader compiles, texture uploads) under the map, half a
  // second before the move, so the move itself runs on light frames (the canvas stays hidden
  // until the move: index.html)
  window.setTimeout(() => !exiting && reveal(), Math.max(0, HOLD - WARM - elapsed));
}

function themeDay() {
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", "#FBF8F4");
}

/** Pause every CSS animation and SMIL animation of the intro at `ms` (debug seeking). */
function seekCss(ui: HTMLElement, topo: HTMLElement, ms: number) {
  document.getAnimations().forEach((a) => {
    const target = (a.effect as KeyframeEffect | null)?.target as Element | null;
    if (target && (ui.contains(target) || topo.contains(target))) {
      a.pause();
      a.currentTime = ms;
    }
  });
}

/** Leave the map in its day state: the hero's faint ground (index.html `#topo.is-day`). */
function dayMap(topo: HTMLElement) {
  const svg = topo.querySelector<SVGSVGElement>("svg.t-map");
  topo.classList.add("is-day");
  topo.removeAttribute("style");
  topo.querySelectorAll<HTMLElement | SVGElement>("[style]").forEach((el) => {
    if (el === svg || el.classList.contains("t-veil") || el.classList.contains("t-places") || el.classList.contains("t-topo")) el.removeAttribute("style");
  });
}

// ─── the hand-over ───────────────────────────────────────────────────────────

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const inOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const outCubic = (t: number) => 1 - Math.pow(1 - t, 3);
const smooth = (t: number) => t * t * (3 - 2 * t);
const sine = (t: number) => 0.5 - Math.cos(Math.PI * t) / 2;
const seg = (t: number, a: number, b: number) => clamp01((t - a) / (b - a));

/** Night → day through warm light (a sunrise, not a grey crossfade). */
const GROUND: [number, [number, number, number]][] = [
  [0, [20, 17, 14]],
  [0.25, [78, 52, 36]],
  [0.5, [150, 112, 84]],
  [0.75, [222, 198, 174]],
  [1, [251, 248, 244]],
];
function groundAt(t: number) {
  let i = 0;
  while (i < GROUND.length - 2 && GROUND[i + 1][0] < t) i++;
  const [ta, a] = GROUND[i];
  const [tb, b] = GROUND[i + 1];
  const u = clamp01((t - ta) / (tb - ta));
  return a.map((v, k) => Math.round(lerp(v, b[k], u))) as [number, number, number];
}
/** The contour lines: light on the night ground → ink on the day ground. */
function lineAt(t: number, major: boolean) {
  const night = major ? [244, 238, 231, 0.2] : [244, 238, 231, 0.11];
  const day = major ? [23, 19, 15, 0.12] : [23, 19, 15, 0.075];
  const v = night.map((n, k) => lerp(n, day[k], t));
  return `rgb(${Math.round(v[0])} ${Math.round(v[1])} ${Math.round(v[2])} / ${v[3].toFixed(3)})`;
}

const num = (el: Element, name: string) => parseFloat(getComputedStyle(el).getPropertyValue(name)) || 0;

type Glide = { el: HTMLElement; id: CardId | null; base: DOMRect; op: number; pin: [number, number]; kpi: HTMLElement | null; face: HTMLElement[] };

/**
 * Freeze the CSS sequence where it is and set up the move. Returns render(t), t 0..1. It also
 * starts the hero: the copy builds, the devices rise in (or their poster stands in), the
 * header fades in.
 */
function begin(ui: HTMLElement, topo: HTMLElement): (t: number) => void {
  const svg = topo.querySelector<SVGSVGElement>("svg.t-map")!;
  const places = topo.querySelector<SVGGElement>(".t-places");
  const veil = topo.querySelector<HTMLElement>(".t-veil");
  const lines = topo.querySelector<SVGGElement>(".t-topo");

  // freeze everything mid-flight (a skip can land anywhere in the sequence)
  document.getAnimations().forEach((a) => {
    const target = (a.effect as KeyframeEffect | null)?.target as Element | null;
    if (target && (topo.contains(target) || ui.contains(target))) a.pause();
  });

  // the camera, as the CSS left it
  const W = topo.clientWidth || window.innerWidth;
  const H = topo.clientHeight || window.innerHeight;
  const ms = Math.max(W / 1600, H / 1000);
  const cam0 = { fx: num(topo, "--fx"), fy: num(topo, "--fy"), z: num(topo, "--z") };
  const k0 = ms * cam0.z;
  const lineOp = lines ? +getComputedStyle(lines).opacity : 1;
  const header = document.querySelector<HTMLElement>(".site-header");
  const poster = document.querySelector<HTMLElement>(".hero .stage-poster");
  if (poster) poster.style.transition = "none";

  // the notifications: the ones on screen glide to the hero's laptop, the rest fade
  const glides: Glide[] = [];
  ui.querySelectorAll<HTMLElement>(".i-note").forEach((el) => {
    const op = +getComputedStyle(el).opacity;
    el.getAnimations().forEach((a) => a.cancel());
    el.style.animation = "none";
    el.style.opacity = String(op);
    el.style.transform = "none";
    const note = el.dataset.note;
    const id: CardId | null = op > 0.6 ? (note === "clockin" ? "toast" : note === "profit" ? "profit" : null) : null;
    glides.push({ el, id, base: el.getBoundingClientRect(), op, pin: [num(el, "--px"), num(el, "--py")], kpi: el.querySelector<HTMLElement>(".sc-kpi"), face: [...el.children].filter((c) => !c.classList.contains("sc-kpi")) as HTMLElement[] });
  });
  // the night logo hands over to the header's, in place
  const logo = ui.querySelector<SVGSVGElement>(".i-logo");
  const logoOp = logo ? +getComputedStyle(logo).opacity : 0;
  logo?.getAnimations().forEach((a) => a.cancel());
  if (logo) logo.style.animation = "none";
  const skip = ui.querySelector<HTMLElement>(".i-skip");
  const skipOp = skip ? +getComputedStyle(skip).opacity : 0;
  if (skip) {
    skip.getAnimations().forEach((a) => a.cancel());
    skip.style.animation = "none";
  }

  // the page comes up under the map (the copy starts building once the ground has warmed a little)
  html!.classList.add("intro-out");
  themeDay();
  if (!status.ready && status.webgl && !status.failed) holdStage();
  reveal();

  return (t: number) => {
    if (t >= 0.3) setPhase("revealing");
    const ec = inOut(t);
    // camera: pull back off the jobsite to the hero's framing
    const z = lerp(cam0.z, DAY.z, ec);
    const fx = lerp(cam0.fx, DAY.fx, ec);
    const fy = lerp(cam0.fy, DAY.fy, ec);
    svg.style.transform = `scale(${z.toFixed(4)}) translate(${(-fx * ms).toFixed(2)}px, ${(-fy * ms).toFixed(2)}px)`;
    // night → day
    const tg = sine(seg(t, 0.04, 0.92));
    const g = groundAt(tg);
    topo.style.backgroundColor = `rgb(${g[0]} ${g[1]} ${g[2]})`;
    topo.style.setProperty("--topo-line", lineAt(smooth(seg(t, 0.2, 0.8)), false));
    topo.style.setProperty("--topo-major", lineAt(smooth(seg(t, 0.2, 0.8)), true));
    if (lines) lines.style.opacity = String(lerp(lineOp, 1, ec));
    if (places) places.style.opacity = String(1 - smooth(seg(t, 0, 0.5)));
    if (veil) veil.style.opacity = String(smooth(seg(t, 0.3, 1)));
    if (skip) skip.style.opacity = String(skipOp * (1 - seg(t, 0, 0.2)));
    // the page under the map: the devices come up once the ground has started to warm, then the header
    const stage = document.querySelector<HTMLElement>(".stage");
    if (stage && !html!.classList.contains("hero-hold")) {
      stage.style.transition = "none";
      stage.style.opacity = String(smooth(seg(t, 0.28, 0.68)));
    }
    const hd = smooth(seg(t, 0.4, 0.9));
    if (header) header.style.opacity = String(hd);
    if (logo) logo.style.opacity = String(logoOp * (1 - hd));
    // no 3D yet: the hero's still comes up in its place, on the same beat
    if (poster && !status.ready) poster.style.opacity = String(Math.max(0.001, smooth(seg(t, 0.28, 0.68))));

    const k = ms * z;
    for (const n of glides) {
      const target = n.id ? cardTarget(n.id) : null;
      if (target) {
        // glide onto the laptop (the target moves with the devices as they rise in)
        const a = n.id === "toast" ? 0 : 0.06;
        const e = inOut(seg(t, a, 1));
        const dx = (target.left - n.base.left) * e;
        const dy = (target.top - n.base.top) * e;
        n.el.style.transform = `translate3d(${dx.toFixed(2)}px, ${dy.toFixed(2)}px, 0)`;
        // phones: the profit card is narrower than the notification it grows out of
        if (Math.abs(target.width - n.base.width) > 1 || Math.abs(target.height - n.base.height) > 1) {
          n.el.style.width = `${lerp(n.base.width, target.width, e).toFixed(1)}px`;
          n.el.style.minHeight = "0px";
          n.el.style.height = `${lerp(n.base.height, target.height, e).toFixed(1)}px`;
        }
        if (n.kpi) {
          // the notification turns into the laptop's profit card: one face out, the other in
          n.face.forEach((c) => (c.style.opacity = String(1 - smooth(seg(t, 0.36, 0.52)))));
          n.kpi.style.opacity = String(smooth(seg(t, 0.38, 0.54)));
        }
      } else {
        // recede with the map: its pin moves with the camera; it shrinks and fades
        const px0 = W / 2 + (n.pin[0] - cam0.fx) * k0;
        const py0 = H / 2 + (n.pin[1] - cam0.fy) * k0;
        const px = W / 2 + (n.pin[0] - fx) * k;
        const py = H / 2 + (n.pin[1] - fy) * k;
        const s = lerp(1, z / cam0.z, outCubic(seg(t, 0, 0.5)));
        n.el.style.transformOrigin = `${(px0 - n.base.left).toFixed(1)}px ${(py0 - n.base.top).toFixed(1)}px`;
        n.el.style.transform = `translate3d(${(px - px0).toFixed(2)}px, ${(py - py0).toFixed(2)}px, 0) scale(${s.toFixed(4)})`;
        n.el.style.opacity = String(n.op * (1 - smooth(seg(t, 0, n.id ? 1 : 0.42))));
      }
    }
    if (t >= 1) glides.forEach((n) => n.id && cardTarget(n.id) && landCard(n.id));
  };
}

/**
 * The 3D isn't ready at the hand-over: the hero's poster still stands in (index.html shows it
 * during .intro-out), and the canvas stays hidden until the devices' own entrance has settled,
 * then the two crossfade (same pose, same pixels).
 */
function holdStage() {
  html!.classList.add("hero-hold");
  let readyAt = 0;
  const release = () => {
    html!.classList.remove("hero-hold");
    off();
  };
  const check = () => {
    if (status.failed || !status.webgl) return release();
    if (status.ready && !readyAt) {
      readyAt = performance.now();
      window.setTimeout(release, 1100);
    }
  };
  const off = onStatus(check);
  check();
}

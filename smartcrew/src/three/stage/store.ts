// The Stage's state outside React: scenes and anchors measured from the DOM, the pose timeline
// built from every scene's keys, and the imperative API (setScreen, pulse, overlays, live
// screens). The Stage reads all of it every frame; nothing here touches WebGL.

import { DEVICE_IDS, type Box, type DeviceId, type DeviceState, type Ease, type FocusSpec, type PoseKey, type PulseSpec, type ResolvedKey } from "./types";
import { isPhoneLite, phoneAtLoad } from "../../site/phone";

// ─── environment ──────────────────────────────────────────────────────────────
export const reducedMotion = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
export const coarse = typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches;
/** The page opened in phone mode (src/site/phone.ts is the source of truth; poses read this). */
export const phone = phoneAtLoad;

// ─── change notifications (the Stage invalidates its frame on these) ─────────
type Fn = () => void;
const listeners = new Set<Fn>();
export function onStageChange(fn: Fn) {
  listeners.add(fn);
  return () => void listeners.delete(fn);
}
export function poke() {
  listeners.forEach((f) => f());
}

// ─── scenes and anchors ──────────────────────────────────────────────────────
type SceneGeo = {
  el: HTMLElement;
  stage: HTMLElement | null;
  pinned: boolean;
  top: number;
  height: number;
  stageH: number;
};
type AnchorGeo = {
  el: HTMLElement;
  scene: string | null; // set when the anchor sits inside a pinned scene's sticky stage
  offTop: number; // from the sticky stage's top (pinned) …
  pageTop: number; // … or from the page's top (not pinned)
  left: number;
  w: number;
  h: number;
};

const scenes = new Map<string, SceneGeo>();
const anchors = new Map<string, AnchorGeo>();
let layoutVersion = 0;

export function registerScene(id: string, el: HTMLElement, stage: HTMLElement | null, pinned: boolean) {
  scenes.set(id, { el, stage, pinned, top: 0, height: 0, stageH: 0 });
  scheduleMeasure();
  return () => {
    if (scenes.get(id)?.el === el) scenes.delete(id);
    timelineDirty = true;
    scheduleMeasure();
  };
}

export function registerAnchor(id: string, el: HTMLElement) {
  anchors.set(id, { el, scene: null, offTop: 0, pageTop: 0, left: 0, w: 0, h: 0 });
  scheduleMeasure();
  return () => {
    if (anchors.get(id)?.el === el) anchors.delete(id);
  };
}

/** 100svh in px (what every pinned .scene-stage is tall), from a fixed probe. */
let svhProbe: HTMLElement | null = null;
function smallViewportHeight() {
  if (!svhProbe) {
    svhProbe = document.createElement("div");
    svhProbe.setAttribute("aria-hidden", "true");
    svhProbe.style.cssText = "position:fixed;left:0;top:0;width:0;height:100vh;height:100svh;visibility:hidden;pointer-events:none;contain:strict";
    document.body.appendChild(svhProbe);
  }
  return svhProbe.offsetHeight || window.innerHeight;
}

/** Measure every scene and anchor. Runs on resize, font load and DOM size changes, never per frame. */
export function measure() {
  const sy = window.scrollY;
  // PHONE MODE (no Stage): only the scenes' own boxes. Reading anything inside a scene would
  // force its skipped (content-visibility) content to lay out; pinned stages are 100svh tall.
  const lite = isPhoneLite();
  const svh = lite ? smallViewportHeight() : 0;
  scenes.forEach((s) => {
    const r = s.el.getBoundingClientRect();
    s.top = r.top + sy;
    s.height = r.height;
    s.stageH = s.stage ? (lite ? svh : s.stage.getBoundingClientRect().height) : r.height;
  });
  if (!lite) anchors.forEach((a) => {
    const r = a.el.getBoundingClientRect();
    a.left = r.left;
    a.w = r.width;
    a.h = r.height;
    a.scene = null;
    const stageEl = a.el.closest<HTMLElement>("[data-scene-stage]");
    const sceneId = stageEl?.dataset.sceneStage;
    const scene = sceneId ? scenes.get(sceneId) : undefined;
    if (scene && scene.pinned && stageEl) {
      a.scene = sceneId!;
      a.offTop = r.top - stageEl.getBoundingClientRect().top;
    } else {
      a.pageTop = r.top + sy;
    }
  });
  layoutVersion++;
  timelineDirty = true;
  poke();
}

let measureRaf = 0;
export function scheduleMeasure() {
  if (typeof window === "undefined") return;
  cancelAnimationFrame(measureRaf);
  measureRaf = requestAnimationFrame(measure);
}

let watching = false;
export function watchLayout() {
  if (watching) return () => {};
  watching = true;
  const ro = new ResizeObserver(scheduleMeasure);
  ro.observe(document.documentElement);
  ro.observe(document.body);
  window.addEventListener("resize", scheduleMeasure);
  window.addEventListener("load", scheduleMeasure);
  document.fonts?.ready.then(scheduleMeasure);
  scheduleMeasure();
  return () => {
    watching = false;
    ro.disconnect();
    window.removeEventListener("resize", scheduleMeasure);
    window.removeEventListener("load", scheduleMeasure);
  };
}

export const getLayoutVersion = () => layoutVersion;

/** Where a pinned scene's sticky stage sits in the viewport at a scroll position. */
function stageTop(s: SceneGeo, scrollY: number) {
  const t = s.top - scrollY;
  if (t > 0) return t;
  return Math.min(0, s.top + s.height - s.stageH - scrollY);
}

export type Rect = { x: number; y: number; w: number; h: number };

/**
 * An anchor's box in viewport px at a scroll position, without touching the DOM. `dock`: where the
 * box sits once its pinned scene has stuck, even while the scene is still below (a key's `dock`).
 */
export function anchorRect(id: string, scrollY: number, out: Rect, dock = false): Rect | null {
  const a = anchors.get(id);
  if (!a) return null;
  let top: number;
  if (a.scene) {
    const s = scenes.get(a.scene);
    top = s ? (dock ? Math.min(0, stageTop(s, scrollY)) : stageTop(s, scrollY)) + a.offTop : a.pageTop - scrollY;
  } else top = a.pageTop - scrollY;
  out.x = a.left;
  out.y = top;
  out.w = a.w;
  out.h = a.h;
  return out;
}

/** Scene progress (0..1) at a scroll position; the same formula the pose keys use. */
export function sceneProgress(id: string, scrollY: number) {
  const s = scenes.get(id);
  if (!s) return 0;
  const travel = s.pinned ? s.height - s.stageH : s.height;
  if (travel <= 0) return scrollY >= s.top ? 1 : 0;
  return Math.min(1, Math.max(0, (scrollY - s.top) / travel));
}

/** Whether a scene is the one on screen: it covers the middle of the viewport. */
export function sceneOnScreen(id: string, scrollY: number, vh: number) {
  const s = scenes.get(id);
  if (!s) return false;
  const mid = scrollY + vh / 2;
  return mid >= s.top && mid < s.top + s.height;
}

/** The page scroll position at which a scene reaches progress `at` (for scrollToScene). */
export function sceneY(id: string, at: number) {
  const s = scenes.get(id);
  if (!s) return null;
  const travel = s.pinned ? s.height - s.stageH : s.height;
  return s.top + at * Math.max(travel, 0);
}

// ─── pose keys → timeline ────────────────────────────────────────────────────
//
// Scroll-driven scenes place their keys along the page's scroll (`at` = scene progress). A
// CLOCK-DRIVEN scene (registerPoses(id, keys, { clock })) is different: its keys sit on its own
// clock (`at` = clock time, any unit, e.g. ms of a film) and the scene takes one place in the
// scroll timeline, a PORTAL at its top (or at `portal` progress points). Every frame the portal's
// pose is the scene's keys evaluated at the clock, so the devices play on time while the scroll
// is held still, and the scroll blends into and out of whatever the clock shows (the scroll
// before it glides the devices into the clock's pose; the keys after it carry on from it).

/** Where a clock-driven scene's pose is: at `a`, or blended from `a` to `b` by `w` (a smooth jump). */
export type ClockRead = { a: number; b: number; w: number };
export type SceneClock = {
  /** The clock now (`now` = the Stage's frame time, performance.now() or a capture's virtual time). */
  read(now: number): ClockRead;
  /** True while the clock is running or blending: the Stage keeps drawing. */
  moving(now: number): boolean;
};
type ClockTrack = { keys: PoseKey[]; clock: SceneClock; portal: number[] };

const tracks = new Map<string, PoseKey[]>();
const clockTracks = new Map<string, ClockTrack>();
let timelineDirty = true;
let timeline: ResolvedKey[] = [];
/** each clock-driven scene's own keys, resolved (inheriting from the key before its portal) */
const subTimelines = new Map<string, ResolvedKey[]>();

/**
 * Register a scene's pose keys. Returns an unregister function. With `clock`, the keys are on that
 * clock (their `at` is clock time) and the scene sits in the scroll timeline at its `portal`
 * progress points (default [0]: its top).
 */
export function registerPoses(scene: string, keys: PoseKey[], opts: { clock?: SceneClock; portal?: number[] } = {}) {
  if (opts.clock) {
    const t: ClockTrack = { keys, clock: opts.clock, portal: opts.portal ?? [0] };
    clockTracks.set(scene, t);
    tracks.delete(scene);
    timelineDirty = true;
    poke();
    return () => {
      if (clockTracks.get(scene) === t) clockTracks.delete(scene);
      timelineDirty = true;
      poke();
    };
  }
  tracks.set(scene, keys);
  clockTracks.delete(scene);
  timelineDirty = true;
  poke();
  return () => {
    if (tracks.get(scene) === keys) tracks.delete(scene);
    timelineDirty = true;
    poke();
  };
}

const blankDevice = (): DeviceState => ({ show: 0, x: 0, y: 0, z: 0, rx: 0, ry: 0, rz: 0, s: 1, lid: 110, screen: null, scroll: 0, ring: null, dim: 0.16, out: 0 });

/** A device pose that only says where it goes out (and/or its ring): it doesn't show a hidden device. */
const onlyOut = (p: { out?: number }) =>
  p.out !== undefined && Object.entries(p).every(([k, v]) => v === undefined || k === "out" || k === "ring");

/** The device fields a key inherits (ring and out are per key). */
const INHERITED_DEVICE = ["show", "x", "y", "z", "rx", "ry", "rz", "s", "lid", "screen", "scroll", "dim"] as const;
/** The key-level fields a key inherits. */
const INHERITED_KEY = ["anchor", "frame", "float", "look", "viewX", "viewY", "lightKey", "lightWarm", "front"] as const;

/** Resolve one key against the one before it (inheritance). */
function resolveKey(scene: string, key: PoseKey, y: number, prev: ResolvedKey | null): ResolvedKey {
  const devices = {} as Record<DeviceId, DeviceState>;
  for (const id of DEVICE_IDS) {
    // ring and out are per key; everything else inherits
    const base: DeviceState = prev ? { ...prev.devices[id], ring: null, out: 0 } : blankDevice();
    const p = key[id];
    devices[id] = p
      ? {
          ...base,
          ...Object.fromEntries(Object.entries(p).filter(([, v]) => v !== undefined)),
          show: p.show ?? (onlyOut(p) ? base.show : 1), // naming a device in a key shows it
          ring: p.ring ?? null,
          out: p.out ?? 0,
        }
      : base;
  }
  const r: ResolvedKey = {
    scene,
    at: key.at,
    y,
    anchor: key.anchor ?? prev?.anchor ?? scene,
    frame: key.frame ?? prev?.frame ?? [6, 4],
    devices,
    pulse: key.pulse ?? null,
    float: key.float ?? prev?.float ?? 0,
    look: key.look ?? prev?.look ?? 0,
    viewX: key.view?.rx ?? prev?.viewX ?? 0,
    viewY: key.view?.ry ?? prev?.viewY ?? 0,
    lightKey: key.light?.key ?? prev?.lightKey ?? 1,
    lightWarm: key.light?.warm ?? prev?.lightWarm ?? 0,
    focus: key.focus ?? null,
    front: key.front !== undefined ? key.front : (prev?.front ?? null),
    dock: key.dock ?? false,
    ease: key.ease ?? "inOut",
  };
  // what it inherits from a portal (directly, or through keys that didn't set it either)
  const from = prev?.portal ?? prev?.dyn?.from;
  if (prev && from) {
    const all = !!prev.portal;
    const keyDyn = new Set<string>();
    const set = (f: (typeof INHERITED_KEY)[number]) => {
      if (f === "viewX" || f === "viewY") return key.view?.[f === "viewX" ? "rx" : "ry"] !== undefined;
      if (f === "lightKey" || f === "lightWarm") return key.light?.[f === "lightKey" ? "key" : "warm"] !== undefined;
      return key[f] !== undefined;
    };
    for (const f of INHERITED_KEY) if (!set(f) && (all || prev.dyn!.key.has(f))) keyDyn.add(f);
    const devs = {} as Record<DeviceId, Set<string>>;
    let any = keyDyn.size > 0;
    for (const id of DEVICE_IDS) {
      const p = key[id];
      const d = new Set<string>();
      for (const f of INHERITED_DEVICE) {
        const own = !!p && (f === "show" ? p.show !== undefined || !onlyOut(p) : p[f as keyof typeof p] !== undefined);
        if (!own && (all || prev.dyn!.devices[id].has(f))) d.add(f);
      }
      if (d.size) any = true;
      devs[id] = d;
    }
    if (any) r.dyn = { from, key: keyDyn, devices: devs };
  }
  return r;
}

function buildTimeline() {
  type Raw = { scene: string; key: PoseKey; y: number; portal?: boolean };
  const raw: Raw[] = [];
  const vh = typeof window === "undefined" ? 0 : window.innerHeight;
  const placeOf = (scene: string) => {
    const s = scenes.get(scene);
    if (!s) return null;
    return { top: s.top, travel: Math.max(s.pinned ? s.height - s.stageH : s.height, 0) };
  };
  tracks.forEach((keys, scene) => {
    const s = placeOf(scene);
    if (!s) return;
    keys.forEach((key) => raw.push({ scene, key, y: s.top + key.at * s.travel + (key.offset ?? 0) * vh }));
  });
  clockTracks.forEach((t, scene) => {
    const s = placeOf(scene);
    if (!s) return;
    t.portal.forEach((at) => raw.push({ scene, key: { at }, y: s.top + at * s.travel, portal: true }));
  });
  raw.sort((a, b) => a.y - b.y);
  const out: ResolvedKey[] = [];
  subTimelines.clear();
  let prev: ResolvedKey | null = null;
  for (const { scene, key, y, portal } of raw) {
    if (portal) {
      // the scene's own keys, on its clock, inheriting from the key before the portal
      let sub = subTimelines.get(scene);
      if (!sub) {
        sub = [];
        let p: ResolvedKey | null = prev ? { ...prev, portal: undefined, dyn: undefined } : null;
        for (const k of [...clockTracks.get(scene)!.keys].sort((a, b) => a.at - b.at)) {
          const rk = resolveKey(scene, k, 0, p);
          rk.dyn = undefined;
          sub.push(rk);
          p = rk;
        }
        subTimelines.set(scene, sub);
      }
      // what keys after it inherit until the clock says otherwise: the clock's last pose
      const last = sub[sub.length - 1] ?? prev;
      if (!last) continue;
      const r: ResolvedKey = { ...last, scene, at: key.at, y, pulse: null, focus: null, dock: false, ease: "inOut", portal: scene, dyn: undefined };
      out.push(r);
      prev = r;
      continue;
    }
    const r = resolveKey(scene, key, y, prev);
    out.push(r);
    prev = r;
  }
  timeline = out;
  timelineDirty = false;
}

export function getTimeline() {
  if (timelineDirty) buildTimeline();
  return timeline;
}

/** A clock-driven scene's own keys, resolved (`at` = clock time). */
export function getSubTimeline(scene: string) {
  if (timelineDirty) buildTimeline();
  return subTimelines.get(scene) ?? null;
}

export function getClock(scene: string) {
  return clockTracks.get(scene)?.clock ?? null;
}

/** Whether any clock-driven scene's clock is moving (the Stage keeps drawing). */
export function clocksMoving(now: number) {
  for (const t of clockTracks.values()) if (t.clock.moving(now)) return true;
  return false;
}

// ─── evaluating a clock-driven scene ─────────────────────────────────────────

const NUM_DEVICE = ["show", "x", "y", "z", "rx", "ry", "rz", "s", "out"] as const;
const lerpN = (a: number, b: number, t: number) => a + (b - a) * t;
const lerp2 = (a: [number, number], b: [number, number], t: number): [number, number] => [lerpN(a[0], b[0], t), lerpN(a[1], b[1], t)];

/** Blend two resolved poses (numbers by `t`; discrete fields from `a`, or from `b` with `discreteB`). */
function blendKeys(a: ResolvedKey, b: ResolvedKey, t: number, discreteB: boolean): ResolvedKey {
  const d = discreteB ? b : a;
  const devices = {} as Record<DeviceId, DeviceState>;
  for (const id of DEVICE_IDS) {
    const x = a.devices[id];
    const y = b.devices[id];
    const o: DeviceState = { ...d.devices[id] };
    for (const f of NUM_DEVICE) o[f] = lerpN(x[f], y[f], t);
    devices[id] = o;
  }
  // a push-in: blend its weight (0 where a pose has none) and, when both have one, its spot
  let focus: FocusSpec | null = null;
  const fa = a.focus;
  const fb = b.focus;
  if (fa || fb) {
    const wa = fa ? (fa.weight ?? 1) : 0;
    const wb = fb && (!fa || fb.device === fa.device) ? (fb.weight ?? 1) : 0;
    const f0 = (fa ?? fb)!;
    const f1 = fb && fb.device === f0.device ? fb : f0;
    const k = fa && fb && fb.device === fa.device ? t : 0;
    focus = {
      device: f0.device,
      px: lerp2(f0.px, f1.px, k),
      zoom: lerpN(f0.zoom, f1.zoom, k),
      to: lerp2(f0.to ?? [0.5, 0.5], f1.to ?? [0.5, 0.5], k),
      weight: lerpN(wa, wb, t),
    };
  }
  let pulse = null;
  if (a.pulse && b.pulse && a.pulse.from === b.pulse.from && a.pulse.to === b.pulse.to) pulse = { ...a.pulse, t: lerpN(a.pulse.t, b.pulse.t, t) };
  else if (!discreteB) pulse = a.pulse;
  return {
    ...d,
    devices,
    float: lerpN(a.float, b.float, t),
    look: lerpN(a.look, b.look, t),
    viewX: lerpN(a.viewX, b.viewX, t),
    viewY: lerpN(a.viewY, b.viewY, t),
    lightKey: lerpN(a.lightKey, b.lightKey, t),
    lightWarm: lerpN(a.lightWarm, b.lightWarm, t),
    focus,
    pulse,
  };
}

/** A clock-driven scene's pose at clock time `t` (its keys blended like scroll keys). */
function evalSub(sub: ResolvedKey[], t: number): ResolvedKey {
  if (t <= sub[0].at || sub.length === 1) return sub[0];
  let i = 0;
  while (i < sub.length - 1 && sub[i + 1].at <= t) i++;
  const A = sub[i];
  const B = sub[Math.min(i + 1, sub.length - 1)];
  if (B === A || B.at <= A.at) return A;
  const te = easeFn(B.ease)((t - A.at) / (B.at - A.at));
  return blendKeys(A, B, te, false);
}

/**
 * A clock-driven scene's pose now. `base` is its portal key (anchor and scroll place); the
 * result carries the portal's `y` so the scroll blend around it works as for any key.
 */
export function evalPortal(base: ResolvedKey, now: number): ResolvedKey {
  const scene = base.portal!;
  const sub = getSubTimeline(scene);
  const clock = getClock(scene);
  if (!sub?.length || !clock) return base;
  const r = clock.read(now);
  let k = evalSub(sub, r.a);
  if (r.w > 0 && r.b !== r.a) {
    const w = EASES.inOut(Math.min(1, r.w));
    // a smooth jump: the poses glide from one point of the clock to the other, the screens
    // switch to the target's at once (and crossfade), pulses don't fly
    k = blendKeys(k, evalSub(sub, r.b), w, true);
    k.pulse = null;
  }
  return { ...k, scene, at: base.at, y: base.y, portal: scene, dyn: undefined, ease: base.ease };
}

/** A key with the fields it inherited from a portal replaced by the portal's live pose. */
export function materialize(key: ResolvedKey, portalPose: ResolvedKey): ResolvedKey {
  const dyn = key.dyn;
  if (!dyn) return key;
  const out: ResolvedKey = { ...key, devices: { ...key.devices } };
  const o = out as unknown as Record<string, unknown>;
  const p = portalPose as unknown as Record<string, unknown>;
  dyn.key.forEach((f) => (o[f] = p[f]));
  for (const id of DEVICE_IDS) {
    const fs = dyn.devices[id];
    if (!fs.size) continue;
    const dev = { ...key.devices[id] } as Record<string, unknown>;
    const src = portalPose.devices[id] as unknown as Record<string, unknown>;
    fs.forEach((f) => (dev[f] = src[f]));
    out.devices[id] = dev as unknown as DeviceState;
  }
  return out;
}

/** Which device ids any key shows (the XDR loads only if some key shows it). */
export function devicesInUse() {
  const used = new Set<DeviceId>();
  const add = (k: ResolvedKey) => DEVICE_IDS.forEach((d) => k.devices[d].show > 0 && used.add(d));
  getTimeline().forEach(add);
  subTimelines.forEach((sub) => sub.forEach(add));
  return used;
}

/**
 * The screen ids keys use near a scroll position (for prefetching); clock-driven scenes: near their
 * clock, the next 5 s (the next moment's first screens: decoding takes a fraction of that, and the
 * texture budget keeps no more).
 */
export function screensNear(scrollY: number, range: number, now = 0, ahead = 5000) {
  const ids = new Set<string>();
  const add = (k: ResolvedKey) =>
    DEVICE_IDS.forEach((d) => {
      const s = k.devices[d].screen;
      if (s && k.devices[d].show > 0) ids.add(s);
    });
  getTimeline().forEach((k) => {
    if (Math.abs(k.y - scrollY) > range) return;
    if (!k.portal) return add(k);
    const sub = subTimelines.get(k.portal);
    const clock = getClock(k.portal);
    if (!sub || !clock) return;
    const r = clock.read(now);
    const lo = Math.min(r.a, r.b) - 1500;
    const hi = Math.max(r.a, r.b) + ahead;
    // the key in force at the clock, and those coming up
    let cur: ResolvedKey | null = null;
    for (const s of sub) {
      if (s.at <= lo) cur = s;
      else if (s.at <= hi) add(s);
    }
    if (cur) add(cur);
  });
  return ids;
}

export const EASES: Record<Exclude<Ease, (t: number) => number>, (t: number) => number> = {
  linear: (t) => t,
  in: (t) => t * t * t,
  out: (t) => 1 - Math.pow(1 - t, 3),
  inOut: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  snap: (t) => (t < 0.5 ? 16 * t ** 5 : 1 - Math.pow(-2 * t + 2, 5) / 2),
  hold: (t) => (t < 1 ? 0 : 1),
};
export const easeFn = (e: Ease) => (typeof e === "function" ? e : EASES[e]);

// ─── runtime overrides (interactive scenes) ─────────────────────────────────
type ScreenOverride = { screen: string | null; scene?: string; ring?: Box | null };
export const screenOverrides = new Map<DeviceId, ScreenOverride>();

/**
 * Override a device's screen from code (e.g. Try it: the visitor taps Clock In). With `scene`, the
 * override only applies while that scene covers the middle of the viewport. `null` turns the
 * screen off; clearScreen(device) removes the override.
 */
export function setScreen(device: DeviceId, screen: string | null | undefined, opts: { scene?: string; ring?: Box | null } = {}) {
  if (screen === undefined) screenOverrides.delete(device);
  else screenOverrides.set(device, { screen, scene: opts.scene, ring: opts.ring });
  poke();
}
export const clearScreen = (device: DeviceId) => setScreen(device, undefined);

// ─── imperative pulses ───────────────────────────────────────────────────────
export type TimedPulse = PulseSpec & { start: number; duration: number };
export const timedPulses: TimedPulse[] = [];

/** Fire the orange data pulse from one device's screen to another's, on a clock (not scroll). */
export function pulse(from: DeviceId, to: DeviceId, opts: { duration?: number; fromPx?: [number, number]; toPx?: [number, number] } = {}) {
  if (reducedMotion) return;
  timedPulses.push({ from, to, t: 0, fromPx: opts.fromPx, toPx: opts.toPx, start: performance.now(), duration: opts.duration ?? 900 });
  poke();
}

// ─── live screens and overlays ───────────────────────────────────────────────
export type LiveScreen = { canvas: HTMLCanvasElement | HTMLVideoElement; w: number; h: number; version: number };
export const liveScreens = new Map<string, LiveScreen>();

/** Register a canvas (or video) as a screen source, used as screen: "live:<name>". `w`/`h` are its native px. */
export function registerLiveScreen(name: string, canvas: HTMLCanvasElement | HTMLVideoElement, w: number, h: number) {
  liveScreens.set(name, { canvas, w, h, version: 0 });
  poke();
  return () => {
    if (liveScreens.get(name)?.canvas === canvas) liveScreens.delete(name);
    poke();
  };
}
/** Tell the Stage a live screen's canvas was redrawn. */
export function updateLiveScreen(name: string) {
  const l = liveScreens.get(name);
  if (l) l.version++;
  poke();
}

export type Overlay = {
  canvas: HTMLCanvasElement;
  /** Where it sits on the screen, native px. */
  rect: Box;
  /** Only shown while the device shows this screen id. */
  screen?: string;
  /** Only shown while this scene covers the middle of the viewport. */
  scene?: string;
  alpha: number;
  dx: number;
  dy: number;
  version: number;
};
export const overlays = new Map<string, Overlay>(); // key `${device}:${slot}`

/**
 * Overlay slots per device, drawn in slot order. 0 and 1 are the hero's (macbook) and Try it's
 * (iphone); One Day uses 2–5 (two pairs, alternating by moment, so the next moment's "before"
 * state is in place before its screen fades in).
 */
export type OverlaySlot = 0 | 1 | 2 | 3 | 4 | 5;
export const OVERLAY_SLOTS: OverlaySlot[] = [0, 1, 2, 3, 4, 5];

/**
 * Draw a small canvas on top of a device's screen (a toast, a ticking number): six slots per
 * device, drawn in slot order; an overlay fades in and out with the screen it sits on. Change `alpha`/`dx`/`dy` with updateOverlay to animate it; redraw
 * the canvas and call updateOverlay(device, slot, {redraw: true}) to re-upload it.
 */
export function setOverlay(
  device: DeviceId,
  slot: OverlaySlot,
  o: (Omit<Overlay, "version" | "alpha" | "dx" | "dy"> & Partial<Pick<Overlay, "alpha" | "dx" | "dy">>) | null,
) {
  const k = `${device}:${slot}`;
  if (!o) overlays.delete(k);
  else overlays.set(k, { alpha: 1, dx: 0, dy: 0, ...o, version: 1 });
  poke();
}
export function updateOverlay(device: DeviceId, slot: OverlaySlot, patch: Partial<Pick<Overlay, "alpha" | "dx" | "dy" | "rect">> & { redraw?: boolean }) {
  const o = overlays.get(`${device}:${slot}`);
  if (!o) return;
  const { redraw, ...rest } = patch;
  Object.assign(o, rest);
  if (redraw) o.version++;
  poke();
}

// ─── per-frame hooks (DOM that follows the devices) ──────────────────────────
/** What a frame hook gets: the frame the devices were just posed for. */
export type StageFrame = {
  /** the (spring-smoothed) scroll position the poses were drawn at */
  y: number;
  now: number;
  dt: number;
  /** viewport size, CSS px */
  w: number;
  h: number;
  /** A point of a device's screen (native px) in viewport CSS px; null while the device isn't drawn. */
  project(device: DeviceId, px: number, py: number): { x: number; y: number } | null;
  /** The visible screen's corners TL TR BR BL in viewport CSS px (null while the device isn't drawn). */
  quad(device: DeviceId): number[] | null;
  /** Whether the device is drawn this frame. */
  visible(device: DeviceId): boolean;
};
export type FrameHook = (f: StageFrame) => boolean | void;
export const frameHooks = new Set<FrameHook>();

/**
 * Run `fn` on every frame the Stage draws, right after the devices are posed (so DOM you move
 * from it lands on exactly the same frame). Return true to ask for another frame (an animation
 * is running). The Stage draws on demand (scroll, pointer, springs, float), and only while WebGL
 * works: give the DOM a sensible position without it.
 */
export function onStageFrame(fn: FrameHook) {
  frameHooks.add(fn);
  poke();
  return () => void frameHooks.delete(fn);
}

// ─── readiness, entrance, fallback ───────────────────────────────────────────
type Status = { webgl: boolean; ready: boolean; failed: boolean; revealed: boolean; revealAt: number };
export const status: Status = { webgl: true, ready: false, failed: false, revealed: false, revealAt: 0 };
const statusListeners = new Set<Fn>();
export function onStatus(fn: Fn) {
  statusListeners.add(fn);
  return () => void statusListeners.delete(fn);
}
function emitStatus() {
  const html = document.documentElement;
  html.classList.toggle("stage-ready", status.ready);
  html.classList.toggle("stage-fallback", status.failed || !status.webgl);
  statusListeners.forEach((f) => f());
  poke();
}
export function setReady() {
  if (status.ready) return;
  status.ready = true;
  emitStatus();
}
export function setFailed() {
  status.failed = true;
  emitStatus();
}
export function setNoWebGL() {
  status.webgl = false;
  emitStatus();
}
/**
 * App mounts the Stage only off phones (src/site/phone.ts). While it isn't mounted the page is in
 * its no-3D state: html.stage-fallback, the poster stills stay up, DOM falls back to them. When
 * it mounts (again), the Stage sets ready on its first frame.
 */
let offByApp = false;
export function setStageMounted(on: boolean) {
  if (on) {
    // undo only our own "off" (the Stage itself reports a device without WebGL)
    if (!offByApp) return;
    offByApp = false;
    status.webgl = true;
    // the unmounted Stage's context was released ("lost" on purpose): the new one starts clean
    status.failed = false;
  } else {
    if (offByApp && !status.ready) return;
    offByApp = true;
    status.webgl = false;
    status.ready = false;
  }
  emitStatus();
}
/** Start the devices' entrance (the hero calls this once the first screen has landed; the devices are parked below the fold). */
export function reveal() {
  if (status.revealed) return;
  status.revealed = true;
  status.revealAt = performance.now();
  emitStatus();
}

export const ringBoxCentre = (b: Box): [number, number] => [b[0] + b[2] / 2, b[1] + b[3] / 2];

// The Stage's state outside React: scenes and anchors measured from the DOM, the pose timeline
// built from every scene's keys, and the imperative API (setScreen, pulse, overlays, live
// screens). The Stage reads all of it every frame; nothing here touches WebGL.

import { DEVICE_IDS, type Box, type DeviceId, type DeviceState, type Ease, type PoseKey, type PulseSpec, type ResolvedKey } from "./types";

// ─── environment ──────────────────────────────────────────────────────────────
export const reducedMotion = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
export const coarse = typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches;
export const phone = typeof window !== "undefined" && window.matchMedia("(max-width: 760px)").matches;

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

/** Measure every scene and anchor. Runs on resize, font load and DOM size changes, never per frame. */
export function measure() {
  const sy = window.scrollY;
  scenes.forEach((s) => {
    const r = s.el.getBoundingClientRect();
    s.top = r.top + sy;
    s.height = r.height;
    s.stageH = s.stage ? s.stage.getBoundingClientRect().height : r.height;
  });
  anchors.forEach((a) => {
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

/** An anchor's box in viewport px at a scroll position, without touching the DOM. */
export function anchorRect(id: string, scrollY: number, out: Rect): Rect | null {
  const a = anchors.get(id);
  if (!a) return null;
  let top: number;
  if (a.scene) {
    const s = scenes.get(a.scene);
    top = s ? stageTop(s, scrollY) + a.offTop : a.pageTop - scrollY;
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
const tracks = new Map<string, PoseKey[]>();
let timelineDirty = true;
let timeline: ResolvedKey[] = [];

/** Register a scene's pose keys. Returns an unregister function. */
export function registerPoses(scene: string, keys: PoseKey[]) {
  tracks.set(scene, keys);
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

function buildTimeline() {
  const raw: { scene: string; key: PoseKey; y: number }[] = [];
  const vh = typeof window === "undefined" ? 0 : window.innerHeight;
  tracks.forEach((keys, scene) => {
    const s = scenes.get(scene);
    if (!s) return;
    const travel = s.pinned ? s.height - s.stageH : s.height;
    keys.forEach((key) => raw.push({ scene, key, y: s.top + key.at * Math.max(travel, 0) + (key.offset ?? 0) * vh }));
  });
  raw.sort((a, b) => a.y - b.y);
  const out: ResolvedKey[] = [];
  let prev: ResolvedKey | null = null;
  for (const { scene, key, y } of raw) {
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
      ease: key.ease ?? "inOut",
    };
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

/** Which device ids any key shows (the XDR loads only if some key shows it). */
export function devicesInUse() {
  const used = new Set<DeviceId>();
  getTimeline().forEach((k) => DEVICE_IDS.forEach((d) => k.devices[d].show > 0 && used.add(d)));
  return used;
}

/** The screen ids keys use near a scroll position (for prefetching). */
export function screensNear(scrollY: number, range: number) {
  const ids = new Set<string>();
  getTimeline().forEach((k) => {
    if (Math.abs(k.y - scrollY) > range) return;
    DEVICE_IDS.forEach((d) => {
      const s = k.devices[d].screen;
      if (s && k.devices[d].show > 0) ids.add(s);
    });
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
/** Start the devices' entrance (the intro calls this as it opens; without an intro, the hero does). */
export function reveal() {
  if (status.revealed) return;
  status.revealed = true;
  status.revealAt = performance.now();
  emitStatus();
}

export const ringBoxCentre = (b: Box): [number, number] => [b[0] + b[2] / 2, b[1] + b[3] / 2];

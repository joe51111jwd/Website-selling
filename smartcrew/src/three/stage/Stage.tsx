// THE STAGE: one fixed, full-viewport WebGL canvas behind the page that holds the real MacBook
// and iPhone (and the XDR, lazily, if a scene shows it). Scenes don't own 3D: they place
// <StageAnchor> boxes in the DOM and register pose keys along their scroll. Every frame the
// Stage fits the devices into the current anchor's box (CSS keeps control of layout) and blends
// the poses on either side of the scroll position, smoothed by a spring.

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import * as THREE from "three";
import { StageDevice, preloadDevices, rig, onRig, type RigDevice } from "./devices";
import { Comet } from "./pulse";
import { getScreen, initTextures, loadScreen, pinScreens } from "./textures";
import { StageLoupe } from "./loupe";
import {
  anchorRect,
  coarse,
  devicesInUse,
  easeFn,
  frameHooks,
  OVERLAY_SLOTS,
  getTimeline,
  onStageChange,
  onStatus,
  overlays,
  phone,
  reducedMotion,
  ringBoxCentre,
  sceneOnScreen,
  screenOverrides,
  screensNear,
  setScreen,
  clearScreen,
  setFailed,
  setNoWebGL,
  setReady,
  status,
  timedPulses,
  watchLayout,
  type Rect,
  type StageFrame,
} from "./store";
import { DEVICE_IDS, type DeviceId, type DeviceState, type FocusSpec, type ResolvedKey } from "./types";

export const CAM_Z = 26;
export const FOV = 22;
/** ?stageHQ: never lower the resolution (for rendering the poster stills). */
const HQ = typeof location !== "undefined" && new URLSearchParams(location.search).has("stageHQ");

preloadDevices(["macbook", "iphone"]);

function hasWebGL() {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}

export default function Stage() {
  const [ok] = useState(hasWebGL);
  const [failed, setFailedState] = useState(false);
  const [xdr, setXdr] = useState(false);

  useEffect(() => watchLayout(), []);
  useEffect(() => {
    if (!ok) setNoWebGL();
  }, [ok]);
  useEffect(() => onStatus(() => setFailedState(status.failed)), []);
  // Until the first frame is drawn (slow network, slow GPU), the anchors' posters stand in; they
  // fade out on html.stage-ready. Only a hard failure (no WebGL, context lost) unmounts the canvas.
  // the XDR only loads once some scene shows it
  useEffect(() => onStageChange(() => !xdr && devicesInUse().has("display") && setXdr(true)), [xdr]);

  if (!ok || failed) return null;
  // ?stageHQ (rendering stills): the screen's full DPR, e.g. 3 for the phone stills
  const maxDpr = HQ ? window.devicePixelRatio || 1 : Math.min(window.devicePixelRatio || 1, phone ? 1.5 : 2);
  return (
    <Canvas
      className="stage"
      frameloop="demand"
      dpr={[1, maxDpr]}
      gl={{ alpha: true, antialias: maxDpr < 2, powerPreference: "high-performance", toneMapping: THREE.NeutralToneMapping, preserveDrawingBuffer: false }}
      camera={{ fov: FOV, near: 1, far: 80, position: [0, 0, CAM_Z] }}
      onCreated={({ gl }) => {
        gl.setClearColor(0x000000, 0);
        gl.domElement.addEventListener("webglcontextlost", () => setFailed());
      }}
      style={{ position: "fixed", inset: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 0 }}
      aria-hidden="true"
    >
      <Lights />
      <Suspense fallback={null}>
        <StageDevice id="macbook" />
      </Suspense>
      <Suspense fallback={null}>
        <StageDevice id="iphone" />
      </Suspense>
      {xdr && (
        <Suspense fallback={null}>
          <StageDevice id="display" />
        </Suspense>
      )}
      <Driver />
    </Canvas>
  );
}

const lightState = { key: 1, warm: 0 };

function Lights() {
  const key = useRef<THREE.DirectionalLight>(null);
  const warm = useRef<THREE.PointLight>(null);
  useFrame(() => {
    if (key.current) key.current.intensity = 1.1 * lightState.key;
    if (warm.current) warm.current.intensity = 60 * lightState.warm;
  });
  return (
    <>
      <ambientLight intensity={0.3} />
      <directionalLight ref={key} position={[4, 8, 9]} intensity={1.1} />
      <pointLight ref={warm} position={[-6, 3, 4]} color="#ffb070" intensity={0} distance={30} decay={1.6} />
      <Environment resolution={256} frames={1}>
        <color attach="background" args={["#d9dadc"]} />
        <Lightformer form="rect" intensity={2.4} position={[0, 7, 2]} rotation-x={Math.PI / 2} scale={[14, 6, 1]} />
        <Lightformer form="rect" intensity={3} position={[-7, 2.5, 5]} rotation-y={Math.PI / 3.2} scale={[4, 6, 1]} />
        <Lightformer form="rect" intensity={1.4} position={[7, 2, 3]} rotation-y={-Math.PI / 3} scale={[3, 6, 1]} />
        <Lightformer form="rect" intensity={1.1} color="#e9edf2" position={[0, 2, -8]} scale={[12, 3, 1]} />
        <Lightformer form="rect" intensity={4} position={[-3, 5, 6]} rotation-x={-Math.PI / 4} scale={[8, 0.25, 1]} />
        <Lightformer form="rect" intensity={4} position={[3, 1, 7]} scale={[0.25, 8, 1]} />
      </Environment>
    </>
  );
}

// ─── springs ────────────────────────────────────────────────────────────────
type Spring = { x: number; v: number };
/** Critically damped spring step towards `to` (omega: higher = snappier). */
function spring(s: Spring, to: number, dt: number, omega: number) {
  const x = s.x - to;
  const e = Math.exp(-omega * dt);
  const nx = (x + (s.v + omega * x) * dt) * e;
  s.v = (s.v - omega * (s.v + omega * x) * dt) * e;
  s.x = nx + to;
}
/** Under-damped spring (entrances: a touch of settle). */
function springU(s: Spring, to: number, dt: number, k: number, c: number) {
  const steps = Math.max(1, Math.ceil(dt / (1 / 120)));
  const h = dt / steps;
  for (let i = 0; i < steps; i++) {
    const a = -k * (s.x - to) - c * s.v;
    s.v += a * h;
    s.x += s.v * h;
  }
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const D2R = Math.PI / 180;
const NUMERIC = ["show", "x", "y", "z", "rx", "ry", "rz", "s", "out"] as const;
const HALF_FOV = Math.tan((FOV * D2R) / 2);

type Live = {
  smoothY: Spring;
  lookX: Spring;
  lookY: Spring;
  pointer: { x: number; y: number };
  entrance: Record<DeviceId, Spring>;
  comets: Comet[];
  slow: number;
  lastY: number;
};

function Driver() {
  const { gl, scene, invalidate, setDpr } = useThree();
  const comp = useMemo(() => new THREE.Group(), []);
  const live = useRef<Live>({
    smoothY: { x: typeof window !== "undefined" ? window.scrollY : 0, v: 0 },
    lookX: { x: 0, v: 0 },
    lookY: { x: 0, v: 0 },
    pointer: { x: 0, y: 0 },
    entrance: { macbook: { x: 1, v: 0 }, iphone: { x: 1, v: 0 }, display: { x: 0, v: 0 } },
    comets: [new Comet(), new Comet(), new Comet()],
    slow: 0,
    lastY: 0,
  });
  const firstFrame = useRef(0);

  // devices live inside the composition group, which is placed and turned as a whole
  useEffect(() => {
    scene.add(comp);
    live.current.comets.forEach((c) => scene.add(c.points));
    const attach = () => rig.forEach((d) => d.group.parent !== comp && comp.add(d.group));
    attach();
    const off = onRig(() => {
      attach();
      invalidate();
    });
    return () => {
      off();
      scene.remove(comp);
      live.current.comets.forEach((c) => scene.remove(c.points));
    };
  }, [scene, comp, invalidate]);

  // dev: window.__stage for poking at the rig and the timeline from the console
  useEffect(() => {
    if (import.meta.env.DEV) (window as unknown as { __stage: unknown }).__stage = { rig, getTimeline, status, invalidate, setScreen, clearScreen };
  }, [invalidate]);

  useEffect(() => {
    initTextures(gl, () => invalidate());
    const onScroll = () => invalidate();
    const onPointer = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      live.current.pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
      live.current.pointer.y = (e.clientY / window.innerHeight) * 2 - 1;
      invalidate();
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("pointermove", onPointer, { passive: true });
    const offChange = onStageChange(() => invalidate());
    const onVis = () => !document.hidden && invalidate();
    document.addEventListener("visibilitychange", onVis);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("pointermove", onPointer);
      document.removeEventListener("visibilitychange", onVis);
      offChange();
    };
  }, [gl, invalidate]);

  const tmp = useMemo(
    () => ({
      ra: { x: 0, y: 0, w: 0, h: 0 } as Rect,
      rb: { x: 0, y: 0, w: 0, h: 0 } as Rect,
      a: new THREE.Vector3(),
      b: new THREE.Vector3(),
      st: {} as Record<DeviceId, DeviceState>,
      euler: new THREE.Euler(),
      p: new THREE.Vector3(),
      t: new THREE.Vector3(),
      g: new THREE.Vector3(),
      c: new THREE.Vector3(),
    }),
    [],
  );
  // the cursor's loupe over every screen (created in an effect: StrictMode-safe, no leaked spans)
  const loupe = useRef<StageLoupe | null>(null);
  useEffect(() => {
    const l = new StageLoupe();
    loupe.current = l;
    return () => {
      l.dispose();
      if (loupe.current === l) loupe.current = null;
    };
  }, []);

  useFrame((state, rawDt) => {
    const L = live.current;
    const camera = state.camera;
    const now = performance.now();
    const dt = Math.min(rawDt, 1 / 20);
    let busy = false;
    const sy = window.scrollY;
    const { width: W, height: H } = state.size;
    const u = (2 * CAM_Z * Math.tan((FOV * D2R) / 2)) / H; // world units per CSS px at z = 0

    // the timeline position follows the scroll through a spring (jumps of more than 3 screens snap)
    if (reducedMotion || Math.abs(sy - L.smoothY.x) > H * 3) {
      L.smoothY.x = sy;
      L.smoothY.v = 0;
    } else {
      spring(L.smoothY, sy, dt, 11);
      if (Math.abs(L.smoothY.x - sy) > 0.5 || Math.abs(L.smoothY.v) > 1) busy = true;
      else L.smoothY.x = sy;
    }
    const y = L.smoothY.x;

    const tl = getTimeline();
    if (!tl.length) {
      comp.visible = false;
      return;
    }
    comp.visible = true;
    // bracketing keys
    let i = 0;
    while (i < tl.length - 1 && tl[i + 1].y <= y) i++;
    const A = tl[i];
    const B = y < A.y ? A : tl[Math.min(i + 1, tl.length - 1)];
    const before = y < tl[0].y;
    const t = B === A || B.y === A.y ? (before ? 0 : 1) : Math.min(1, Math.max(0, (y - A.y) / (B.y - A.y)));
    const te = B === A ? 0 : easeFn(B.ease)(t);

    // frame boxes in world space
    const fit = (k: ResolvedKey, r: Rect, out: THREE.Vector3) => {
      const ok = anchorRect(k.anchor, sy, r);
      if (!ok) return 0;
      out.set((r.x + r.w / 2 - W / 2) * u, (H / 2 - (r.y + r.h / 2)) * u, 0);
      return Math.min((r.w * u) / k.frame[0], (r.h * u) / k.frame[1]);
    };
    const kA = fit(A, tmp.ra, tmp.a);
    const kB = B === A ? kA : fit(B, tmp.rb, tmp.b);
    if (!kA && !kB) {
      comp.visible = false;
      return;
    }
    const kk = !kA ? kB : !kB ? kA : lerp(kA, kB, te);
    if (!kA) tmp.a.copy(tmp.b);
    if (!kB) tmp.b.copy(tmp.a);
    comp.position.lerpVectors(tmp.a, tmp.b, te);

    // look-around (cursor on desktop, a slow sway on touch) and the composition's own turn
    const look = lerp(A.look, B.look, te) * (reducedMotion ? 0 : 1);
    const tSec = now / 1000;
    const px = coarse ? Math.sin(tSec * 0.45) * 0.55 : L.pointer.x;
    const py = coarse ? Math.sin(tSec * 0.31 + 1) * 0.3 : L.pointer.y;
    spring(L.lookX, px * look, dt, 4.5);
    spring(L.lookY, py * look, dt, 4.5);
    const settlingLook = Math.abs(L.lookX.x - px * look) > 0.002 || Math.abs(L.lookY.x - py * look) > 0.002;
    comp.rotation.set((lerp(A.viewX, B.viewX, te) + L.lookY.x * 3) * D2R, (lerp(A.viewY, B.viewY, te) + L.lookX.x * 4) * D2R, 0);
    lightState.key = lerp(A.lightKey, B.lightKey, te);
    lightState.warm = lerp(A.lightWarm, B.lightWarm, te);

    const float = lerp(A.float, B.float, te) * (reducedMotion ? 0 : 1);
    let anyVisible = false;

    // entrance: devices rise and turn into place once the intro opens
    const rev = status.revealed;
    const sinceReveal = rev ? now - status.revealAt : -1;

    const screensOn = new Set<string>();
    for (const id of DEVICE_IDS) {
      const d = rig.get(id);
      const a = A.devices[id];
      const b = B.devices[id];
      const s = tmp.st[id] ?? (tmp.st[id] = { ...a });
      for (const f of NUMERIC) s[f] = lerp(a[f], b[f], te);
      if (!d) continue;

      // entrance spring per device, staggered: phone first, then the laptop
      const ent = L.entrance[id];
      if (reducedMotion) ent.x = 0;
      else if (rev) {
        const delay = id === "iphone" ? 0 : id === "macbook" ? 140 : 260;
        if (sinceReveal > delay) springU(ent, 0, dt, 60, 11.5);
        if (Math.abs(ent.x) > 0.0005 || Math.abs(ent.v) > 0.0005) busy = true;
        else ent.x = 0;
      }
      const e = Math.max(0, ent.x);
      // screen: the latest key at or before here decides it; scene overrides win while on screen
      const over = screenOverrides.get(id);
      let screenId = a.screen;
      let ring = a.ring;
      if (over && (!over.scene || sceneOnScreen(over.scene, sy, H))) {
        screenId = over.screen;
        if (over.ring !== undefined) ring = over.ring;
      }
      if (before) {
        screenId = tl[0].devices[id].screen;
        ring = tl[0].devices[id].ring;
      }
      d.surface.scroll = a.scroll;
      if (screenId && s.show > 0) {
        screensOn.add(screenId);
        let tex = getScreen(screenId);
        if (!tex) loadScreen(screenId);
        d.surface.show(screenId, tex, now, reducedMotion);
      } else d.surface.show(null, null, now, reducedMotion);
      // overlays for this device
      for (const slot of OVERLAY_SLOTS) {
        const o = overlays.get(`${id}:${slot}`);
        if (o && (!o.screen || o.screen === d.surface.cur.id) && (!o.scene || sceneOnScreen(o.scene, sy, H))) {
          const tex = overlayTex(o.canvas, o.version);
          d.surface.setOverlay(slot, tex, o.rect, o.alpha, o.dx, o.dy);
        } else d.surface.setOverlay(slot, null, [0, 0, 1, 1], 0, 0, 0);
      }
      // nothing shows until the intro opens (it covers the page anyway); a device that has
      // glided all the way out of the viewport (out = ±1) isn't drawn either
      const show = Math.max(0, Math.min(1, s.show)) * (rev || reducedMotion ? 1 : 0);
      const outAmt = Math.min(1, Math.abs(s.out));
      const vis = show > 0.002 && outAmt < 0.999;
      d.group.visible = vis;
      if (vis) anyVisible = true;

      if (vis) {
        const phase = id === "iphone" ? 1.7 : 0;
        const fy = Math.sin(tSec * 0.9 + phase) * 0.05 * float;
        const frz = Math.sin(tSec * 0.6 + phase) * 0.5 * float;
        const sc = kk * s.s * (1 - Math.pow(1 - show, 3)) * (1 - e * 0.12);
        d.group.position.set(s.x * kk, (s.y + fy - e * 1.6) * kk, (s.z - e * 1.2) * kk);
        d.group.rotation.set((s.rx + e * 24) * D2R, (s.ry - e * 18 * (id === "iphone" ? -1 : 1)) * D2R, (s.rz + frz + e * 4) * D2R);
        d.group.scale.setScalar(Math.max(sc, 1e-4));
        if (outAmt > 0) placeOut(d, s.out, outAmt, comp, W, H);
      }

      if (vis && d.surface.update(now, dt, ring, a.dim, reducedMotion)) busy = true;
      else if (!vis) d.surface.update(now, dt, ring, a.dim, true);
    }
    pinScreens(screensOn);
    // idle float and the touch sway keep drawing only while a device is on screen; the cursor
    // look-around only until it settles
    if (anyVisible && (float > 0.01 || (coarse && look > 0) || settlingLook)) busy = true;

    // prefetch what's coming within two screens
    if (Math.abs(sy - L.lastY) > H * 0.5 || !firstFrame.current) {
      L.lastY = sy;
      screensNear(sy, H * 2).forEach((s) => loadScreen(s));
    }

    comp.updateMatrixWorld(true);

    // push-in: a device scaled about one spot of its screen, the spot carried to a point of the
    // anchor box (blends in and out between keys)
    let focused = false;
    for (const id of DEVICE_IDS) {
      const fa = A.focus?.device === id ? A.focus : null;
      const fb = B !== A && B.focus?.device === id ? B.focus : null;
      if (!fa && !fb) continue;
      const d = rig.get(id);
      if (!d || !d.group.visible) continue;
      const w = B === A ? (fa ? 1 : 0) : lerp(fa ? 1 : 0, fb ? 1 : 0, te);
      if (w <= 0.0005) continue;
      const f0 = (fa ?? fb) as FocusSpec;
      const f1 = (fb ?? fa) as FocusSpec;
      const k = B === A ? 0 : te;
      const zoom = lerp(1, lerp(f0.zoom, f1.zoom, k), w);
      const to0 = f0.to ?? [0.5, 0.5];
      const to1 = f1.to ?? [0.5, 0.5];
      const ra = kA ? tmp.ra : tmp.rb;
      const rb = kB ? tmp.rb : tmp.ra;
      const rx = lerp(ra.x, rb.x, te), ry = lerp(ra.y, rb.y, te), rw = lerp(ra.w, rb.w, te), rh = lerp(ra.h, rb.h, te);
      const tx = rx + lerp(to0[0], to1[0], k) * rw;
      const ty = ry + lerp(to0[1], to1[1], k) * rh;
      tmp.t.set((tx - W / 2) * u, (H / 2 - ty) * u, 0);
      comp.worldToLocal(tmp.t);
      d.surface.pxToLocal(lerp(f0.px[0], f1.px[0], k), lerp(f0.px[1], f1.px[1], k), tmp.p);
      d.screenMesh.localToWorld(tmp.p);
      comp.worldToLocal(tmp.p);
      // G' = lerp(P, T, w) − zoom·(P − G)
      tmp.g.copy(tmp.p).sub(d.group.position).multiplyScalar(zoom);
      d.group.position.lerpVectors(tmp.p, tmp.t, w).sub(tmp.g);
      d.group.scale.multiplyScalar(zoom);
      focused = true;
    }
    if (focused) comp.updateMatrixWorld(true);

    // one device drawn in front of the others: slid along the camera rays (scaled about the
    // camera), so it looks exactly the same but sits nearer than anything it overlaps
    const front = A.front ? rig.get(A.front) : undefined;
    if (front && front.group.visible) {
      let near = Infinity;
      rig.forEach((d) => {
        if (d === front || !d.group.visible) return;
        near = Math.min(near, boxDepth(d, true));
      });
      const far = boxDepth(front, false);
      if (near < Infinity && far > near - 0.05) {
        const a = Math.max(0.05, (near - 0.05) / far);
        tmp.c.set(0, 0, CAM_Z);
        front.group.getWorldPosition(tmp.g);
        tmp.g.sub(tmp.c).multiplyScalar(a).add(tmp.c);
        comp.worldToLocal(tmp.g);
        front.group.position.copy(tmp.g);
        front.group.scale.multiplyScalar(a);
        front.group.updateMatrixWorld(true);
      }
    }

    // DOM that follows the devices (labels, leader lines, touch marks) and the cursor's loupe
    if (frameHooks.size) {
      const frame = frameInfo(camera, W, H, y, now, dt);
      frameHooks.forEach((fn) => {
        if (fn(frame)) busy = true;
      });
    }
    loupe.current?.update(camera, W, H);

    // pulses: scroll-driven (from keys) and timed (pulse())
    const pxScale = state.gl.domElement.height / (2 * Math.tan((FOV * D2R) / 2));
    let used = 0;
    const scrollPulse =
      A.pulse && (B.pulse && B.pulse.from === A.pulse.from && B.pulse.to === A.pulse.to ? { ...A.pulse, t: lerp(A.pulse.t, B.pulse.t, te) } : A.pulse);
    if (scrollPulse && rev)
      used += placeComet(L.comets[used], scrollPulse.from, scrollPulse.to, scrollPulse.t, scrollPulse.fromPx, scrollPulse.toPx, A, B, kk, pxScale, tmp);
    for (let p = timedPulses.length - 1; p >= 0; p--) {
      const tp = timedPulses[p];
      const tt = (now - tp.start) / tp.duration;
      if (tt > 1) {
        timedPulses.splice(p, 1);
        continue;
      }
      busy = true;
      if (used < L.comets.length)
        used += placeComet(L.comets[used], tp.from, tp.to, easeFn("inOut")(Math.max(0, tt)), tp.fromPx, tp.toPx, A, A, kk, pxScale, tmp);
    }
    for (let c = used; c < L.comets.length; c++) L.comets[c].hide();

    // readiness: both devices in, their first screens decoded, one frame drawn
    if (!status.ready && rig.has("macbook") && rig.has("iphone")) {
      const r = [...rig.values()].every((d) => A.devices[d.id].show <= 0 || !d.surface.cur.id || d.surface.cur.tex);
      if (r) {
        if (!firstFrame.current) firstFrame.current = now;
        else if (now - firstFrame.current > 50) setReady();
        busy = true;
      } else busy = true;
    }

    // adaptive resolution: if frames stay slow while animating, draw fewer pixels
    if (busy && !HQ) {
      L.slow = rawDt > 1 / 28 ? L.slow + rawDt : Math.max(0, L.slow - rawDt * 0.5);
      if (L.slow > 1.5) {
        L.slow = 0;
        const cur = state.viewport.dpr;
        if (cur > 1) setDpr(Math.max(1, cur - 0.25));
      }
    }

    if (busy) invalidate();
  });

  return null;
}

// ─── helpers for out / front / frame hooks ───────────────────────────────────
const V = new THREE.Vector3();
const V2 = new THREE.Vector3();

/**
 * Glide a device out past the left (out < 0) or right (out > 0) edge of the viewport, turning
 * as it goes: at |out| = 1 its whole box is just outside the viewport at its depth.
 */
function placeOut(d: RigDevice, out: number, m: number, comp: THREE.Group, W: number, H: number) {
  const sign = Math.sign(out);
  const g = d.group;
  const sc = g.scale.x;
  const sz = d.box.getSize(V2);
  const r = 0.5 * Math.hypot(sz.x, sz.y) * sc;
  const z = comp.position.z + g.position.z;
  const halfW = (CAM_Z - z) * HALF_FOV * (W / H);
  const edge = sign * (halfW + r * 1.08) - comp.position.x;
  const ease = m * m * (3 - 2 * m);
  g.position.x = lerp(g.position.x, edge, m);
  g.position.y += r * 0.12 * ease;
  g.rotation.y += sign * 34 * D2R * ease;
  g.rotation.z -= sign * 5 * D2R * ease;
}

/** Nearest (near = true) or farthest distance from the camera plane of a device's box. */
function boxDepth(d: RigDevice, near: boolean) {
  const b = d.box;
  let out = near ? Infinity : -Infinity;
  for (let i = 0; i < 8; i++) {
    V.set(i & 1 ? b.max.x : b.min.x, i & 2 ? b.max.y : b.min.y, i & 4 ? b.max.z : b.min.z).applyMatrix4(d.group.matrixWorld);
    const dist = CAM_Z - V.z;
    out = near ? Math.min(out, dist) : Math.max(out, dist);
  }
  return out;
}

const FRAME_V = new THREE.Vector3();
function frameInfo(camera: THREE.Camera, W: number, H: number, y: number, now: number, dt: number): StageFrame {
  const toView = (v: THREE.Vector3) => {
    v.project(camera);
    return { x: ((v.x + 1) / 2) * W, y: ((1 - v.y) / 2) * H };
  };
  return {
    y,
    now,
    dt,
    w: W,
    h: H,
    visible: (id) => !!rig.get(id)?.group.visible,
    project(id, px, py) {
      const d = rig.get(id);
      if (!d || !d.group.visible) return null;
      d.surface.pxToLocal(px, py, FRAME_V);
      d.screenMesh.localToWorld(FRAME_V);
      return toView(FRAME_V);
    },
    quad(id) {
      const d = rig.get(id);
      if (!d || !d.group.visible) return null;
      const { o, u, v } = d.surface.plane;
      const q: number[] = [];
      for (const [a, b] of [[0, 0], [1, 0], [1, 1], [0, 1]]) {
        FRAME_V.copy(o).addScaledVector(u, a).addScaledVector(v, b);
        d.screenMesh.localToWorld(FRAME_V);
        const p = toView(FRAME_V);
        q.push(p.x, p.y);
      }
      return q;
    },
  };
}

const ovCache = new WeakMap<HTMLCanvasElement, { tex: THREE.CanvasTexture; version: number }>();
function overlayTex(canvas: HTMLCanvasElement, version: number) {
  let e = ovCache.get(canvas);
  if (!e) {
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.flipY = false;
    tex.generateMipmaps = true;
    tex.minFilter = THREE.LinearMipmapLinearFilter;
    tex.anisotropy = 8;
    e = { tex, version };
    ovCache.set(canvas, e);
  }
  if (e.version !== version) {
    e.version = version;
    e.tex.needsUpdate = true;
  }
  return e.tex;
}

function placeComet(
  comet: Comet,
  from: DeviceId,
  to: DeviceId,
  t: number,
  fromPx: [number, number] | undefined,
  toPx: [number, number] | undefined,
  ka: ResolvedKey,
  kb: ResolvedKey,
  unit: number,
  pxScale: number,
  tmp: { a: THREE.Vector3; b: THREE.Vector3 },
) {
  const df = rig.get(from);
  const dt = rig.get(to);
  if (!df || !dt || !df.group.visible || !dt.group.visible) {
    comet.hide();
    return 0;
  }
  // leave from the ring on the sending screen, land on the ring the receiving screen is about to show
  const rf = ka.devices[from].ring ?? kb.devices[from].ring;
  const rt = kb.devices[to].ring ?? ka.devices[to].ring;
  const fr = fromPx ?? (rf ? ringBoxCentre(rf) : df.surface.centrePx());
  const tr = toPx ?? (rt ? ringBoxCentre(rt) : dt.surface.centrePx());
  df.surface.pxToLocal(fr[0], fr[1], tmp.a);
  df.screenMesh.localToWorld(tmp.a);
  dt.surface.pxToLocal(tr[0], tr[1], tmp.b);
  dt.screenMesh.localToWorld(tmp.b);
  comet.set(tmp.a, tmp.b, t, unit, pxScale);
  return 1;
}

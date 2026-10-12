// One Day's effects on the shared Stage, loaded lazily (it pulls three.js, already in the Stage's
// chunk). Two jobs, both done in the Stage's own render (scene.onBeforeRender), so they land on
// exactly the frame the devices are drawn:
//
//  1. THE LIGHT FOLLOWS THE CLOCK. The Stage's key light becomes the sun: low and cool from the
//     left at dawn, high and white mid-morning, low and amber from the right at 5 PM; on Friday
//     night the sun is gone and the Stage's warm light becomes a desk lamp over the laptop. The
//     environment's reflections turn with the sun and dim at night, and the laptop's contact
//     shadow stretches away from the light. Outside the scene everything blends back to the
//     Stage's own values (nothing is left changed: the Stage re-sets intensities every frame,
//     and positions, colours and the shadow are restored here).
//  2. THE LOUPE. Each device's projected screen corners go to the cursor (writeLoupeQuad), with
//     the image the screen is showing, so the loupe reads the real UI on both devices.
//
// The Stage has no light API beyond { key, warm } intensities; see the result notes for the
// small Stage change that would make this a pose field instead.

import * as THREE from "three";
import { rig, type RigDevice } from "../../three/stage/devices";
import { poke, reducedMotion, sceneOnScreen, sceneProgress } from "../../three/stage/store";
import { writeLoupeQuad } from "../../cursor/loupe";
import { dayClock, dayPresence } from "./clock";
import { loupeSrcFor } from "./life";

/** The light at each moment (index = moment). az: degrees from the front, + = from the viewer's
 * right; el: degrees above the horizon; key: sun intensity; env: reflections; rot: how far the
 * reflections turn (radians); lamp: Friday's desk lamp. */
type Sun = { az: number; el: number; color: string; key: number; env: number; rot: number; lamp: number; tint: string };
// `tint` colours what the devices reflect: they're dark metal and glass, so the light shows
// mostly in their reflections, and a warm or cool reflection is what reads as warm or cool light
const SUN: Sun[] = [
  { az: -70, el: 7, color: "#c2d1ff", key: 2.5, env: 0.78, rot: -0.55, lamp: 0, tint: "#eaeefd" }, // 6:42 AM dawn, cool and low
  { az: -60, el: 14, color: "#e2e7f8", key: 2.3, env: 0.88, rot: -0.42, lamp: 0, tint: "#f4f5fa" }, // 6:55 AM
  { az: -14, el: 60, color: "#fff9f1", key: 1.9, env: 1.0, rot: -0.08, lamp: 0, tint: "#ffffff" }, // 9:20 AM high and white
  { az: 44, el: 30, color: "#ffdcb4", key: 2.4, env: 0.9, rot: 0.32, lamp: 0, tint: "#fff3e6" }, // 4:13 PM
  { az: 62, el: 14, color: "#ffa95c", key: 3.6, env: 0.7, rot: 0.55, lamp: 0, tint: "#ffe6cc" }, // 5:00 PM low amber
  { az: 72, el: 6, color: "#ff8e3e", key: 3.4, env: 0.56, rot: 0.5, lamp: 0.12, tint: "#ffd8b0" }, // 5:30 PM going down
  { az: -30, el: 42, color: "#ffb36b", key: 0.12, env: 0.34, rot: 1.05, lamp: 1, tint: "#ffe6cc" }, // Friday night: the lamp
];

const D2R = Math.PI / 180;
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

type Spring = { x: number; v: number };
/** Same critically damped spring as the Stage's scroll smoothing (omega 11), so the light moves with the devices. */
function spring(s: Spring, to: number, dt: number, omega: number) {
  const x = s.x - to;
  const e = Math.exp(-omega * dt);
  const nx = (x + (s.v + omega * x) * dt) * e;
  s.v = (s.v - omega * (s.v + omega * x) * dt) * e;
  s.x = nx + to;
}

export type LoupeTargets = { macbook: HTMLElement | null; iphone: HTMLElement | null };

const FINE = typeof window !== "undefined" && window.matchMedia("(hover: hover) and (pointer: fine)").matches;

export function startStageFx(loupe: LoupeTargets): () => void {
  let stop = () => {};
  let gone = false;
  // the devices load asynchronously; wait until both are in the scene
  const wait = window.setInterval(() => {
    const mb = rig.get("macbook");
    const ip = rig.get("iphone");
    const scene = mb?.group.parent?.parent;
    if (!mb || !ip || !(scene instanceof THREE.Scene)) return;
    window.clearInterval(wait);
    if (!gone) stop = install(scene, loupe);
  }, 200);
  return () => {
    gone = true;
    window.clearInterval(wait);
    stop();
  };
}

function install(scene: THREE.Scene, loupe: LoupeTargets) {
  // the Stage's two lights: the white key (directional) and the warm kicker (point)
  let key: THREE.DirectionalLight | null = null;
  let warm: THREE.PointLight | null = null;
  scene.traverse((o) => {
    if ((o as THREE.DirectionalLight).isDirectionalLight && !key) key = o as THREE.DirectionalLight;
    if ((o as THREE.PointLight).isPointLight && !warm) warm = o as THREE.PointLight;
  });
  const K = key as THREE.DirectionalLight | null;
  const Wm = warm as THREE.PointLight | null;
  const orig = {
    keyPos: K ? K.position.clone() : new THREE.Vector3(),
    keyColor: K ? K.color.clone() : new THREE.Color(),
    warmPos: Wm ? Wm.position.clone() : new THREE.Vector3(),
    warmColor: Wm ? Wm.color.clone() : new THREE.Color(),
    env: scene.environmentIntensity,
    rot: scene.environmentRotation.y,
  };
  // the laptop's contact shadow (a soft plane under its base)
  const mb = rig.get("macbook")!;
  const shadow = mb.group.children.find((c) => (c as THREE.Mesh).isMesh) as THREE.Mesh | undefined;
  const shadowMat = shadow?.material as THREE.MeshBasicMaterial | undefined;
  const sh = shadow ? { pos: shadow.position.clone(), scale: shadow.scale.clone(), opacity: shadowMat?.opacity ?? 0.42 } : null;

  const sunColor = SUN.map((s) => new THREE.Color(s.color));
  const sunTint = SUN.map((s) => new THREE.Color(s.tint));
  // the devices' own materials (not their screens, not the contact shadow), to tint what they reflect
  const mats = new Map<THREE.MeshStandardMaterial, THREE.Color>();
  for (const id of ["macbook", "iphone"] as const) {
    const d = rig.get(id);
    d?.group.traverse((o) => {
      const m = o as THREE.Mesh;
      if (!m.isMesh) return;
      (Array.isArray(m.material) ? m.material : [m.material]).forEach((mat) => {
        const sm = mat as THREE.MeshStandardMaterial;
        if (sm?.isMeshStandardMaterial && sm !== d.surface.material && !mats.has(sm)) mats.set(sm, sm.color.clone());
      });
    });
  }
  const white = new THREE.Color(1, 1, 1);
  const lampColor = new THREE.Color("#ffad5c");
  const tmp = {
    c: new THREE.Color(),
    dir: new THREE.Vector3(),
    v: new THREE.Vector3(),
    q: new THREE.Quaternion(),
    corners: [0, 0, 0, 0, 0, 0, 0, 0],
    size: new THREE.Vector2(),
  };
  const smoothY: Spring = { x: window.scrollY, v: 0 };
  let last = performance.now();
  let lastW = -1;

  let prevHook = scene.onBeforeRender;
  const hook: THREE.Object3D["onBeforeRender"] = (renderer, sc, camera, geometry, material, group) => {
    prevHook.call(scene, renderer, sc, camera, geometry, material, group);
    const now = performance.now();
    const dt = Math.min((now - last) / 1000, 1 / 20);
    last = now;
    const vh = window.innerHeight;
    const sy = window.scrollY;
    if (reducedMotion || Math.abs(sy - smoothY.x) > vh * 3) {
      smoothY.x = sy;
      smoothY.v = 0;
    } else {
      spring(smoothY, sy, dt, 11);
      if (Math.abs(smoothY.x - sy) > 0.5 || Math.abs(smoothY.v) > 1) poke();
      else smoothY.x = sy;
    }
    const y = smoothY.x;
    const w = dayPresence(y, vh);
    if (w > 0 || lastW !== 0) applyLight(w, dayClock(sceneProgress("day", y)));
    lastW = w;
    if (FINE) writeLoupe(renderer, camera, sceneOnScreen("day", sy, vh));
  };
  scene.onBeforeRender = hook;
  // if something else takes over the scene's hook later, chain onto it again (otherwise the
  // lights would stay wherever the last frame left them)
  const watchdog = window.setInterval(() => {
    if (scene.onBeforeRender === hook) return;
    prevHook = scene.onBeforeRender;
    scene.onBeforeRender = hook;
    poke();
  }, 1000);

  function applyLight(w: number, clock: number) {
    const i = Math.max(0, Math.min(SUN.length - 1, Math.floor(clock)));
    const j = Math.min(SUN.length - 1, i + 1);
    const t = clock - i;
    const a = SUN[i];
    const b = SUN[j];
    const az = lerp(a.az, b.az, t) * D2R;
    const el = lerp(a.el, b.el, t) * D2R;
    const sunKey = lerp(a.key, b.key, t);
    const lamp = lerp(a.lamp, b.lamp, t);
    tmp.dir.set(Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el));

    if (K) {
      tmp.v.copy(tmp.dir).multiplyScalar(14);
      K.position.lerpVectors(orig.keyPos, tmp.v, w);
      tmp.c.copy(sunColor[i]).lerp(sunColor[j], t);
      K.color.copy(orig.keyColor).lerp(tmp.c, w);
      // the Stage sets intensity each frame (1.1 × pose key); scale it toward the sun's
      K.intensity *= lerp(1, sunKey / 1.1, w);
      K.updateMatrixWorld();
    }
    if (Wm) {
      // Friday: the warm light becomes a desk lamp above and in front of the laptop
      const comp = mb.group.parent;
      const k = mb.group.scale.x || 1;
      if (comp) tmp.v.set(-2.2 * k, 2.6 * k, 1.1 * k).add(comp.position);
      else tmp.v.copy(orig.warmPos);
      Wm.position.lerpVectors(orig.warmPos, tmp.v, w * Math.min(1, lamp * 4));
      Wm.color.copy(orig.warmColor).lerp(lampColor, w);
      Wm.intensity = lerp(Wm.intensity, 70 * lamp, w);
      Wm.updateMatrixWorld();
    }
    scene.environmentIntensity = lerp(orig.env, lerp(a.env, b.env, t), w);
    tmp.c.copy(sunTint[i]).lerp(sunTint[j], t);
    tmp.c.lerp(white, 1 - w);
    mats.forEach((base, mat) => mat.color.copy(base).multiply(tmp.c));
    scene.environmentRotation.y = lerp(orig.rot, lerp(a.rot, b.rot, t), w);

    // the contact shadow falls away from the sun: long and soft when it's low, short at noon
    if (shadow && sh && shadowMat) {
      if (w <= 0) {
        shadow.position.copy(sh.pos);
        shadow.scale.copy(sh.scale);
        shadowMat.opacity = sh.opacity;
      } else {
        // light direction in the laptop's own space (the shadow lives in it)
        mb.group.getWorldQuaternion(tmp.q).invert();
        tmp.v.copy(tmp.dir).applyQuaternion(tmp.q);
        const flat = Math.hypot(tmp.v.x, tmp.v.z) || 1;
        const sunUp = Math.max(Math.sin(el), 0.08);
        // Friday's lamp is close and high: a short shadow under it
        const len = lerp(Math.min(1.0, 0.22 / Math.tan(Math.asin(sunUp))), 0.12, Math.min(1, lamp));
        shadow.position.set(sh.pos.x - (tmp.v.x / flat) * len * w, sh.pos.y, sh.pos.z - (tmp.v.z / flat) * len * w);
        const grow = 1 + 0.32 * len * w;
        shadow.scale.set(sh.scale.x * grow, sh.scale.y * grow, sh.scale.z);
        shadowMat.opacity = sh.opacity * lerp(1, 0.62 + 0.38 * sunUp + 0.3 * lamp, w);
      }
      shadow.updateMatrixWorld();
    }
  }

  // ── loupe ────────────────────────────────────────────────────────────────
  const loupeOff = new Set<HTMLElement>();
  function clearLoupe(el: HTMLElement | null) {
    if (!el || loupeOff.has(el)) return;
    el.setAttribute("data-loupe-src", "");
    el.removeAttribute("data-loupe-quad");
    loupeOff.add(el);
  }
  function writeLoupe(renderer: THREE.WebGLRenderer, camera: THREE.Camera, on: boolean) {
    renderer.getSize(tmp.size);
    for (const id of ["macbook", "iphone"] as const) {
      const el = loupe[id];
      const d = rig.get(id);
      if (!el || !d) continue;
      if (!on || !d.group.visible || !d.surface.cur.id || !d.surface.cur.tex) {
        clearLoupe(el);
        continue;
      }
      const src = loupeSrcFor(d.surface.cur.id);
      if (!src) {
        clearLoupe(el);
        continue;
      }
      loupeOff.delete(el);
      if (el.getAttribute("data-loupe-src") !== src) el.setAttribute("data-loupe-src", src);
      const crop = cropOf(d);
      if (el.getAttribute("data-loupe-crop") !== crop) el.setAttribute("data-loupe-crop", crop);
      const { o, u, v } = d.surface.plane;
      const c = tmp.corners;
      const pts = [
        [0, 0],
        [1, 0],
        [1, 1],
        [0, 1],
      ];
      pts.forEach(([s, t], k) => {
        tmp.v.copy(o).addScaledVector(u, s).addScaledVector(v, t).applyMatrix4(d.screenMesh.matrixWorld).project(camera);
        c[k * 2] = ((tmp.v.x + 1) / 2) * tmp.size.x;
        c[k * 2 + 1] = ((1 - tmp.v.y) / 2) * tmp.size.y;
      });
      writeLoupeQuad(el, c);
    }
  }

  return () => {
    window.clearInterval(watchdog);
    if (scene.onBeforeRender === hook) scene.onBeforeRender = prevHook;
    if (K) {
      K.position.copy(orig.keyPos);
      K.color.copy(orig.keyColor);
      K.updateMatrixWorld();
    }
    if (Wm) {
      Wm.position.copy(orig.warmPos);
      Wm.color.copy(orig.warmColor);
      Wm.updateMatrixWorld();
    }
    scene.environmentIntensity = orig.env;
    scene.environmentRotation.y = orig.rot;
    mats.forEach((base, mat) => mat.color.copy(base));
    if (shadow && sh && shadowMat) {
      shadow.position.copy(sh.pos);
      shadow.scale.copy(sh.scale);
      shadowMat.opacity = sh.opacity;
    }
    clearLoupe(loupe.macbook);
    clearLoupe(loupe.iphone);
    poke();
  };
}

/** The part of the screen image the device actually shows (mirrors ScreenSurface's window). */
function cropOf(d: RigDevice) {
  const t = d.surface.cur.tex!;
  const sa = d.surface.plane.aspect;
  let x = 0,
    y = 0,
    w = t.w,
    h = t.h;
  if (d.surface.fit === "cover" && t.w / t.h > sa) {
    w = t.h * sa;
    x = (t.w - w) / 2;
  } else {
    h = t.w / sa;
    y = Math.min(d.surface.scroll, Math.max(0, t.h - h));
  }
  const r = (n: number) => Math.round(n * 1e4) / 1e4;
  return `${r(x / t.w)},${r(y / t.h)},${r(w / t.w)},${r(h / t.h)}`;
}

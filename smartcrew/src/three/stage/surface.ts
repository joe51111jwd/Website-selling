// A device's screen surface: one material that shows a screen image true to colour (unlit,
// not tone mapped) under the glass's reflections, crossfades between two images, and draws the
// orange highlight ring and up to two overlays (a toast, a ticking number) in the screen's own
// pixel space, so they sit exactly on the UI.

import * as THREE from "three";
import type { Box } from "./types";
import type { ScreenTex } from "./textures";

const WHITE = new THREE.DataTexture(new Uint8Array([255, 255, 255, 255]), 1, 1);
WHITE.needsUpdate = true;
const BLANK = new THREE.DataTexture(new Uint8Array([0, 0, 0, 0]), 1, 1);
BLANK.needsUpdate = true;

const DECL = /* glsl */ `
uniform sampler2D uTexA;
uniform sampler2D uTexB;
uniform vec4 uWinA;
uniform vec4 uWinB;
uniform vec2 uSizeA;
uniform vec2 uSizeB;
uniform float uHasA;
uniform float uHasB;
uniform float uMix;
uniform vec4 uUvBox;
uniform vec2 uFlip;
uniform vec4 uRing;
uniform float uRingA;
uniform float uRingR;
uniform float uRingW;
uniform float uPing;
uniform float uDim;
uniform vec3 uRingColor;
uniform sampler2D uOv0;
uniform vec4 uOv0Rect;
uniform float uOv0A;
uniform sampler2D uOv1;
uniform vec4 uOv1Rect;
uniform float uOv1A;
uniform sampler2D uOv2;
uniform vec4 uOv2Rect;
uniform float uOv2A;
uniform sampler2D uOv3;
uniform vec4 uOv3Rect;
uniform float uOv3A;
uniform sampler2D uOv4;
uniform vec4 uOv4Rect;
uniform float uOv4A;
uniform sampler2D uOv5;
uniform vec4 uOv5Rect;
uniform float uOv5A;
uniform float uPower;
uniform vec3 uOff;

float scRoundBox(vec2 p, vec2 b, float r) {
  vec2 q = abs(p) - b + r;
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
}
vec3 scSample(sampler2D t, vec4 win, vec2 size, vec2 uv) {
  vec2 px = uv * win.xy + win.zw;
  return texture2D(t, clamp(px / size, vec2(0.0), vec2(1.0))).rgb;
}
vec4 scOverlay(sampler2D t, vec4 rect, vec2 px) {
  vec2 q = (px - rect.xy) / rect.zw;
  if (q.x < 0.0 || q.y < 0.0 || q.x > 1.0 || q.y > 1.0) return vec4(0.0);
  return texture2D(t, q);
}
`;

const MAIN = /* glsl */ `
{
  vec2 suv = (vEmissiveMapUv - uUvBox.xy) / uUvBox.zw;
  suv = mix(suv, 1.0 - suv, uFlip);
  vec3 ca = uHasA > 0.5 ? scSample(uTexA, uWinA, uSizeA, suv) : uOff;
  vec3 cb = uHasB > 0.5 ? scSample(uTexB, uWinB, uSizeB, suv) : uOff;
  vec2 px = suv * uWinB.xy + uWinB.zw;

  // overlays belong to the incoming screen: they fade in with it, never over the outgoing one
  if (uOv0A > 0.001) {
    vec4 o0 = scOverlay(uOv0, uOv0Rect, px);
    cb = mix(cb, o0.rgb, o0.a * uOv0A);
  }
  if (uOv1A > 0.001) {
    vec4 o1 = scOverlay(uOv1, uOv1Rect, px);
    cb = mix(cb, o1.rgb, o1.a * uOv1A);
  }
  if (uOv2A > 0.001) {
    vec4 o2 = scOverlay(uOv2, uOv2Rect, px);
    cb = mix(cb, o2.rgb, o2.a * uOv2A);
  }
  if (uOv3A > 0.001) {
    vec4 o3 = scOverlay(uOv3, uOv3Rect, px);
    cb = mix(cb, o3.rgb, o3.a * uOv3A);
  }
  if (uOv4A > 0.001) {
    vec4 o4 = scOverlay(uOv4, uOv4Rect, px);
    cb = mix(cb, o4.rgb, o4.a * uOv4A);
  }
  if (uOv5A > 0.001) {
    vec4 o5 = scOverlay(uOv5, uOv5Rect, px);
    cb = mix(cb, o5.rgb, o5.a * uOv5A);
  }
  vec3 col = mix(ca, cb, uMix);

  if (uRingA > 0.001) {
    vec2 c = uRing.xy + uRing.zw * 0.5;
    vec2 hb = uRing.zw * 0.5 + vec2(5.0);
    float d = scRoundBox(px - c, hb, uRingR);
    float aa = max(fwidth(d), 0.0001) * 0.85;
    float stroke = 1.0 - smoothstep(uRingW * 0.5 - aa, uRingW * 0.5 + aa, abs(d));
    float outside = smoothstep(-aa, aa, d);
    float glow = exp(-max(d, 0.0) / (uRingW * 4.0)) * outside * 0.35;
    float pd = d - uPing * 26.0;
    float ping = (1.0 - smoothstep(uRingW * 0.4 - aa, uRingW * 0.4 + aa, abs(pd))) * (1.0 - uPing) * step(0.001, uPing) * 0.8;
    col *= 1.0 - uDim * uRingA * outside;
    col = mix(col, uRingColor, clamp(stroke + glow + ping, 0.0, 1.0) * uRingA);
  }
  totalEmissiveRadiance *= col * uPower;
}
`;

export type Fit = "width" | "cover";

/** Maps the screen mesh's UVs to its plane, so screen px can be turned into 3D points. */
type Plane = { o: THREE.Vector3; u: THREE.Vector3; v: THREE.Vector3; aspect: number; uvBox: THREE.Vector4; flip: THREE.Vector2 };

function fitPlane(mesh: THREE.Mesh, toDevice: THREE.Matrix4): Plane {
  const g = mesh.geometry;
  const pos = g.attributes.position;
  const uv = g.attributes.uv;
  let umin = Infinity,
    vmin = Infinity,
    umax = -Infinity,
    vmax = -Infinity;
  for (let i = 0; i < uv.count; i++) {
    umin = Math.min(umin, uv.getX(i));
    umax = Math.max(umax, uv.getX(i));
    vmin = Math.min(vmin, uv.getY(i));
    vmax = Math.max(vmax, uv.getY(i));
  }
  // least squares P = O + s*U + t*V over the normalised uvs (s, t in 0..1)
  const A = new THREE.Matrix3();
  const ata = [0, 0, 0, 0, 0, 0, 0, 0, 0];
  const atp = [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()];
  const p = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    const s = (uv.getX(i) - umin) / (umax - umin || 1);
    const t = (uv.getY(i) - vmin) / (vmax - vmin || 1);
    p.fromBufferAttribute(pos, i);
    const row = [s, t, 1];
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) ata[r * 3 + c] += row[r] * row[c];
      atp[r].addScaledVector(p, row[r]);
    }
  }
  A.set(ata[0], ata[1], ata[2], ata[3], ata[4], ata[5], ata[6], ata[7], ata[8]).invert();
  const e = A.elements; // column-major
  const solve = (k: number) =>
    new THREE.Vector3()
      .addScaledVector(atp[0], e[k])
      .addScaledVector(atp[1], e[3 + k])
      .addScaledVector(atp[2], e[6 + k]);
  let U = solve(0);
  let V = solve(1);
  let O = solve(2);
  // the image's x must run to the device's right (+x) and its y down (-y): flip uvs that don't
  const ud = U.clone().transformDirection(toDevice);
  const vd = V.clone().transformDirection(toDevice);
  const flip = new THREE.Vector2(ud.x < 0 ? 1 : 0, vd.y > 0 ? 1 : 0);
  if (flip.x) {
    O = O.clone().add(U);
    U = U.clone().negate();
  }
  if (flip.y) {
    O = O.clone().add(V);
    V = V.clone().negate();
  }
  return { o: O, u: U, v: V, aspect: U.length() / V.length(), uvBox: new THREE.Vector4(umin, vmin, umax - umin || 1, vmax - vmin || 1), flip };
}

export class ScreenSurface {
  readonly material: THREE.MeshPhysicalMaterial;
  readonly plane: Plane;
  readonly fit: Fit;
  private u: Record<string, THREE.IUniform>;
  /** current (B) and previous (A) screens */
  cur: { id: string | null; tex: ScreenTex | null } = { id: null, tex: null };
  prev: { id: string | null; tex: ScreenTex | null } = { id: null, tex: null };
  fade = 1; // 0..1, 1 = fully on B
  ringBox: Box | null = null;
  ringA = 0;
  ringShownAt = 0;
  scroll = 0;
  power = 1;

  /** `toDevice`: the screen mesh's matrix into the device's upright space (+y up, screen to +z). */
  constructor(mesh: THREE.Mesh, fit: Fit, toDevice: THREE.Matrix4) {
    this.fit = fit;
    this.plane = fitPlane(mesh, toDevice);
    this.u = {
      uTexA: { value: BLANK },
      uTexB: { value: BLANK },
      uWinA: { value: new THREE.Vector4(1, 1, 0, 0) },
      uWinB: { value: new THREE.Vector4(1, 1, 0, 0) },
      uSizeA: { value: new THREE.Vector2(1, 1) },
      uSizeB: { value: new THREE.Vector2(1, 1) },
      uHasA: { value: 0 },
      uHasB: { value: 0 },
      uMix: { value: 1 },
      uUvBox: { value: this.plane.uvBox },
      uFlip: { value: this.plane.flip },
      uRing: { value: new THREE.Vector4(0, 0, 10, 10) },
      uRingA: { value: 0 },
      uRingR: { value: 12 },
      uRingW: { value: 3 },
      uPing: { value: 0 },
      uDim: { value: 0.16 },
      uRingColor: { value: new THREE.Color("#ff7a01") },
      uOv0: { value: BLANK },
      uOv0Rect: { value: new THREE.Vector4(0, 0, 1, 1) },
      uOv0A: { value: 0 },
      uOv1: { value: BLANK },
      uOv1Rect: { value: new THREE.Vector4(0, 0, 1, 1) },
      uOv1A: { value: 0 },
      uOv2: { value: BLANK },
      uOv2Rect: { value: new THREE.Vector4(0, 0, 1, 1) },
      uOv2A: { value: 0 },
      uOv3: { value: BLANK },
      uOv3Rect: { value: new THREE.Vector4(0, 0, 1, 1) },
      uOv3A: { value: 0 },
      uOv4: { value: BLANK },
      uOv4Rect: { value: new THREE.Vector4(0, 0, 1, 1) },
      uOv4A: { value: 0 },
      uOv5: { value: BLANK },
      uOv5Rect: { value: new THREE.Vector4(0, 0, 1, 1) },
      uOv5A: { value: 0 },
      uPower: { value: 1 },
      uOff: { value: new THREE.Color("#050506") },
    };
    const m = new THREE.MeshPhysicalMaterial({
      color: "#000",
      emissive: "#fff",
      emissiveMap: WHITE, // gives us vEmissiveMapUv; the real images come in through uniforms
      roughness: 0.2,
      metalness: 0,
      clearcoat: 1,
      clearcoatRoughness: 0.08,
      envMapIntensity: 0.55,
      toneMapped: false,
    });
    m.onBeforeCompile = (sh) => {
      Object.assign(sh.uniforms, this.u);
      sh.fragmentShader = sh.fragmentShader.replace("#include <common>", `#include <common>\n${DECL}`).replace("#include <emissivemap_fragment>", MAIN);
    };
    m.customProgramCacheKey = () => "sc-screen-v3";
    this.material = m;
  }

  /** The visible window of an image on this screen, in its native px: (w, h, x, y). */
  private window(t: ScreenTex, out: THREE.Vector4) {
    const sa = this.plane.aspect;
    if (this.fit === "cover" && t.w / t.h > sa) {
      const vw = t.h * sa;
      return out.set(vw, t.h, (t.w - vw) / 2, 0);
    }
    const vh = t.w / sa;
    const maxScroll = Math.max(0, t.h - vh);
    return out.set(t.w, vh, 0, Math.min(this.scroll, maxScroll));
  }

  /** Show a new screen; it fades in over the old one (or from black on first show). */
  show(id: string | null, tex: ScreenTex | null, now: number, instant = false) {
    if (id === this.cur.id && tex === this.cur.tex) return;
    if (id !== this.cur.id) {
      // keep whatever is fully on screen as the image we fade from
      if (this.cur.tex && this.fade > 0.5) this.prev = this.cur;
      this.cur = { id, tex };
    } else this.cur.tex = tex; // the image we were waiting for arrived
    this.fadeStart = instant ? now - 1e4 : now;
  }
  fadeStart = 0;

  /** The part of the current image on screen, native px [x, y, w, h], and the image's native size. */
  visibleWindow(): { win: [number, number, number, number]; w: number; h: number } | null {
    const t = this.cur.tex;
    if (!t) return null;
    const v = this.window(t, new THREE.Vector4());
    return { win: [v.z, v.w, v.x, v.y], w: t.w, h: t.h };
  }

  /** Native px → a point in the screen mesh's local space. */
  pxToLocal(px: number, py: number, out: THREE.Vector3) {
    const t = this.cur.tex ?? this.prev.tex;
    const win = this.window(t ?? { tex: null as never, w: 1440, h: 900 }, new THREE.Vector4());
    const s = (px - win.z) / win.x;
    const tt = (py - win.w) / win.y;
    return out.copy(this.plane.o).addScaledVector(this.plane.u, s).addScaledVector(this.plane.v, tt);
  }
  /** The centre of what's on screen, native px. */
  centrePx(): [number, number] {
    const t = this.cur.tex ?? this.prev.tex;
    if (!t) return [0, 0];
    const win = this.window(t, new THREE.Vector4());
    return [win.z + win.x / 2, win.w + win.y / 2];
  }

  setOverlay(slot: number, tex: THREE.Texture | null, rect: Box, alpha: number, dx: number, dy: number) {
    this.u[`uOv${slot}`].value = tex ?? BLANK;
    (this.u[`uOv${slot}Rect`].value as THREE.Vector4).set(rect[0] + dx, rect[1] + dy, rect[2], rect[3]);
    this.u[`uOv${slot}A`].value = tex ? alpha : 0;
  }

  /** Per frame. Returns true while something is still animating. */
  update(now: number, dt: number, ring: Box | null, dim: number, reduced: boolean): boolean {
    let busy = false;
    // crossfade
    const dur = reduced ? 1 : 380;
    // the frame clock went back (a capture rewinding the film): whatever was fading is done
    if (now < this.fadeStart) this.fadeStart = now - dur;
    const f = Math.min(1, (now - this.fadeStart) / dur);
    // a screen set to null is a target too: the old image fades to the screen's "off" colour
    const off = this.cur.id === null;
    this.fade = this.cur.tex || off ? 1 - Math.pow(1 - f, 2) : 0;
    if ((this.cur.tex || off) && f < 1) busy = true;
    const a = this.prev.tex;
    const b = this.cur.tex;
    const u = this.u;
    if (b) {
      u.uTexB.value = b.tex;
      u.uHasB.value = 1;
      this.window(b, u.uWinB.value as THREE.Vector4);
      (u.uSizeB.value as THREE.Vector2).set(b.w, b.h);
    } else u.uHasB.value = 0;
    if (a) {
      u.uTexA.value = a.tex;
      u.uHasA.value = 1;
      this.window(a, u.uWinA.value as THREE.Vector4);
      (u.uSizeA.value as THREE.Vector2).set(a.w, a.h);
    } else u.uHasA.value = 0;
    // waiting for B to load: keep showing A (turning off: fade A to the off colour)
    u.uMix.value = b || off ? this.fade : 0;
    if (!b && this.cur.id && a) u.uMix.value = 0;
    if ((b || off) && f >= 1) this.prev = { id: null, tex: null };

    // ring: fades in with one ping where it appears; glides when it moves to another row
    const target = ring ? 1 : 0;
    if (ring) {
      if (!this.ringBox || this.ringA < 0.05) {
        this.ringBox = [...ring];
        this.ringShownAt = now;
      } else {
        this.ringBox = lerpBox(this.ringBox, ring, reduced ? 1 : Math.min(1, dt * 10));
        if (this.ringBox.some((v, i) => Math.abs(v - ring[i]) > 0.5)) busy = true;
      }
    }
    const k = reduced ? 1 : Math.min(1, dt * 7);
    this.ringA += (target - this.ringA) * k;
    if (Math.abs(target - this.ringA) > 0.004) busy = true;
    else this.ringA = target;
    if (this.ringBox) {
      const [x, y, w, h] = this.ringBox;
      (u.uRing.value as THREE.Vector4).set(x, y, w, h);
      // ring weight scales with the image so it reads the same on the laptop and the phone
      const scale = (b ?? a)?.w ?? 1440;
      u.uRingW.value = scale > 800 ? 3.2 : 2.6;
      // a round button gets a round ring
      u.uRingR.value = Math.abs(w - h) < Math.max(w, h) * 0.08 ? Math.min(w, h) / 2 + 5 : Math.min(14, h / 2 + 5);
    }
    u.uRingA.value = this.ringA;
    u.uDim.value = dim;
    const p = (now - this.ringShownAt) / 900;
    u.uPing.value = reduced || p >= 1 || p < 0 ? 0 : p;
    if (u.uPing.value > 0) busy = true;
    u.uPower.value = this.power;
    return busy;
  }
}

function lerpBox(a: Box, b: Box, t: number): Box {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t, a[3] + (b[3] - a[3]) * t];
}

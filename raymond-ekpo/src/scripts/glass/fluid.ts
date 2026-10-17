// Ink in water. A small stable-fluids simulation (velocity, pressure, vorticity) carries a dye
// field. The dye is denser than the water, so drops sink and roll up into plumes and tendrils.
// The dye is advected with MacCormack's scheme, which keeps the fine filaments sharp instead of
// letting them blur away. The water is fixed to the page: scrolling slides the field with it.
//
// The domain is the viewport plus a margin above and below, so ink can enter from off screen
// and a short scroll doesn't lose it. Coordinates inside follow GL: v = 0 at the bottom.

import { program, Swap, target, free, bindTex, type Program, type Target } from './gl';

const HEAD = /* glsl */ `#version 300 es
precision highp float;
precision highp sampler2D;
in vec2 vUv;
out vec4 o;
`;

const SPLAT = HEAD + /* glsl */ `
uniform sampler2D uTarget;
uniform float uAspect;
uniform vec2 uPoint;
uniform vec4 uColor;
uniform float uRadius;
void main() {
  vec2 p = vUv - uPoint;
  p.x *= uAspect;
  o = texture(uTarget, vUv) + exp(-dot(p, p) / uRadius) * uColor;
}`;

// slide the whole field when the page scrolls; nothing comes in from outside
const SHIFT = HEAD + /* glsl */ `
uniform sampler2D uSrc;
uniform vec2 uShift;
void main() {
  vec2 c = vUv - uShift;
  o = texture(uSrc, c) * step(0.0, c.y) * step(c.y, 1.0);
}`;

const ADVECT = HEAD + /* glsl */ `
uniform sampler2D uVel;
uniform sampler2D uSrc;
uniform vec2 uTexel;
uniform float uDt;
uniform float uDecay;
void main() {
  vec2 c = vUv - uDt * texture(uVel, vUv).xy * uTexel;
  float inside = step(0.0, c.x) * step(c.x, 1.0) * step(0.0, c.y) * step(c.y, 1.0);
  o = texture(uSrc, c) * inside / (1.0 + uDecay * abs(uDt));
}`;

// MacCormack: correct the forward step by half the error of going back again, then clamp to
// the values the forward step could have picked up, so nothing overshoots
const MACCORMACK = HEAD + /* glsl */ `
uniform sampler2D uVel;
uniform sampler2D uSrc;
uniform sampler2D uFwd;
uniform sampler2D uBack;
uniform vec2 uTexel;
uniform vec2 uSize;
uniform float uDt;
uniform float uDecay;
void main() {
  vec2 c = vUv - uDt * texture(uVel, vUv).xy * uTexel;
  vec4 fwd = texture(uFwd, vUv);
  vec4 r = fwd + 0.5 * (texture(uSrc, vUv) - texture(uBack, vUv));
  vec2 st = c * uSize - 0.5;
  ivec2 i = ivec2(floor(st));
  ivec2 m = ivec2(uSize) - 1;
  vec4 a = texelFetch(uSrc, clamp(i, ivec2(0), m), 0);
  vec4 b = texelFetch(uSrc, clamp(i + ivec2(1, 0), ivec2(0), m), 0);
  vec4 d = texelFetch(uSrc, clamp(i + ivec2(0, 1), ivec2(0), m), 0);
  vec4 e = texelFetch(uSrc, clamp(i + ivec2(1, 1), ivec2(0), m), 0);
  r = clamp(r, min(min(a, b), min(d, e)), max(max(a, b), max(d, e)));
  float inside = step(0.0, c.x) * step(c.x, 1.0) * step(0.0, c.y) * step(c.y, 1.0);
  // ink fades as it nears the bottom of the domain, and a little everywhere over time
  o = max(r, 0.0) * inside * smoothstep(0.0, 0.12, vUv.y) / (1.0 + uDecay * uDt);
}`;

const CURL = HEAD + /* glsl */ `
uniform sampler2D uVel;
uniform vec2 uTexel;
void main() {
  float L = texture(uVel, vUv - vec2(uTexel.x, 0.0)).y;
  float R = texture(uVel, vUv + vec2(uTexel.x, 0.0)).y;
  float T = texture(uVel, vUv + vec2(0.0, uTexel.y)).x;
  float B = texture(uVel, vUv - vec2(0.0, uTexel.y)).x;
  o = vec4(0.5 * (R - L - T + B), 0.0, 0.0, 1.0);
}`;

// vorticity confinement keeps the curls alive; sinking ink and slow currents keep it moving
const FORCES = HEAD + /* glsl */ `
uniform sampler2D uVel;
uniform sampler2D uCurl;
uniform sampler2D uDye;
uniform vec2 uTexel;
uniform float uDt;
uniform float uCurlK;
uniform float uSink;
uniform float uDrift;
uniform float uTime;
uniform float uAspect;

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
}
vec2 currents(vec2 p) {
  float e = 0.05;
  return vec2(noise(p + vec2(0, e)) - noise(p - vec2(0, e)), noise(p - vec2(e, 0)) - noise(p + vec2(e, 0))) / (2.0 * e);
}

void main() {
  float L = texture(uCurl, vUv - vec2(uTexel.x, 0.0)).x;
  float R = texture(uCurl, vUv + vec2(uTexel.x, 0.0)).x;
  float T = texture(uCurl, vUv + vec2(0.0, uTexel.y)).x;
  float B = texture(uCurl, vUv - vec2(0.0, uTexel.y)).x;
  float C = texture(uCurl, vUv).x;
  vec2 f = 0.5 * vec2(abs(T) - abs(B), abs(R) - abs(L));
  f /= length(f) + 1e-4;
  f *= uCurlK * C;
  f.y *= -1.0;
  vec2 v = texture(uVel, vUv).xy + f * uDt;
  vec4 ink = texture(uDye, vUv);
  v.y -= uSink * (ink.r + ink.g) * uDt;
  vec2 q = vec2(vUv.x * uAspect, vUv.y) * 2.2;
  v += uDrift * currents(q + vec2(uTime * 0.013, -uTime * 0.009)) * uDt;
  o = vec4(clamp(v, -600.0, 600.0), 0.0, 1.0);
}`;

// the sides are walls; top and bottom stay open so plumes can leave
const DIVERGENCE = HEAD + /* glsl */ `
uniform sampler2D uVel;
uniform vec2 uTexel;
void main() {
  float L = texture(uVel, vUv - vec2(uTexel.x, 0.0)).x;
  float R = texture(uVel, vUv + vec2(uTexel.x, 0.0)).x;
  float T = texture(uVel, vUv + vec2(0.0, uTexel.y)).y;
  float B = texture(uVel, vUv - vec2(0.0, uTexel.y)).y;
  vec2 C = texture(uVel, vUv).xy;
  if (vUv.x - uTexel.x < 0.0) L = -C.x;
  if (vUv.x + uTexel.x > 1.0) R = -C.x;
  o = vec4(0.5 * (R - L + T - B), 0.0, 0.0, 1.0);
}`;

const PRESSURE = HEAD + /* glsl */ `
uniform sampler2D uP;
uniform sampler2D uDiv;
uniform vec2 uTexel;
void main() {
  float L = texture(uP, vUv - vec2(uTexel.x, 0.0)).x;
  float R = texture(uP, vUv + vec2(uTexel.x, 0.0)).x;
  float T = texture(uP, vUv + vec2(0.0, uTexel.y)).x;
  float B = texture(uP, vUv - vec2(0.0, uTexel.y)).x;
  o = vec4((L + R + B + T - texture(uDiv, vUv).x) * 0.25, 0.0, 0.0, 1.0);
}`;

const GRADIENT = HEAD + /* glsl */ `
uniform sampler2D uP;
uniform sampler2D uVel;
uniform vec2 uTexel;
void main() {
  float L = texture(uP, vUv - vec2(uTexel.x, 0.0)).x;
  float R = texture(uP, vUv + vec2(uTexel.x, 0.0)).x;
  float T = texture(uP, vUv + vec2(0.0, uTexel.y)).x;
  float B = texture(uP, vUv - vec2(0.0, uTexel.y)).x;
  o = vec4(texture(uVel, vUv).xy - vec2(R - L, T - B), 0.0, 1.0);
}`;

const SCALE = HEAD + /* glsl */ `
uniform sampler2D uSrc;
uniform float uK;
void main() { o = texture(uSrc, vUv) * uK; }`;

type Draw = (t: Target | null, w?: number, h?: number) => void;
type Fmt = { internal: number; format: number; type: number };

export type FluidSettings = {
  curl: number;
  sink: number;
  drift: number;
  velDecay: number;
  dyeDecay: number;
};

export const INK: FluidSettings = { curl: 9, sink: 18, drift: 2, velDecay: 0.3, dyeDecay: 0.035 };

export class Fluid {
  W = 0;
  H = 0;
  /** margin above and below the viewport, CSS px */
  M = 0;
  /** domain height, CSS px */
  D = 0;
  private simW = 0;
  private simH = 0;
  private dyeW = 0;
  private dyeH = 0;
  private vel!: Swap;
  private dye!: Swap;
  private tmpA!: Target;
  private tmpB!: Target;
  private p!: Swap;
  private div!: Target;
  private curl!: Target;
  private progs: Record<string, Program>;
  private two: Fmt;
  private one: Fmt;

  constructor(
    private gl: WebGL2RenderingContext,
    private draw: Draw,
    private dyeShort: number,
    private simShort = 128,
    public settings: FluidSettings = INK,
  ) {
    // two channels for velocity and ink, one for the rest, where the browser can render them
    const full = !!gl.getExtension('EXT_color_buffer_float');
    this.two = full ? { internal: gl.RG16F, format: gl.RG, type: gl.HALF_FLOAT } : { internal: gl.RGBA16F, format: gl.RGBA, type: gl.HALF_FLOAT };
    this.one = full ? { internal: gl.R16F, format: gl.RED, type: gl.HALF_FLOAT } : this.two;
    this.progs = {
      splat: program(gl, SPLAT),
      shift: program(gl, SHIFT),
      advect: program(gl, ADVECT),
      mac: program(gl, MACCORMACK),
      curl: program(gl, CURL),
      forces: program(gl, FORCES),
      div: program(gl, DIVERGENCE),
      pressure: program(gl, PRESSURE),
      gradient: program(gl, GRADIENT),
      scale: program(gl, SCALE),
    };
  }

  /** WebGL2 can only render into half-float textures with one of these extensions. */
  static supported(gl: WebGL2RenderingContext) {
    return !!(gl.getExtension('EXT_color_buffer_float') || gl.getExtension('EXT_color_buffer_half_float'));
  }

  get texture() {
    return this.dye.read.tex;
  }

  private grid(short: number) {
    const aspect = this.W / this.D;
    return aspect >= 1 ? [Math.round(short * aspect), short] : [short, Math.round(short / aspect)];
  }

  resize(W: number, H: number) {
    const gl = this.gl;
    if (W === this.W && Math.abs(H - this.H) < 120 && this.vel) return; // phone toolbars: keep the ink
    this.W = W;
    this.H = H;
    this.M = Math.round(H * 0.35);
    this.D = H + 2 * this.M;
    for (const s of [this.vel, this.dye, this.p]) {
      free(gl, s?.read);
      free(gl, s?.write);
    }
    [this.div, this.curl, this.tmpA, this.tmpB].forEach((t) => free(gl, t));
    const [sw, sh] = this.grid(this.simShort);
    const [dw, dh] = this.grid(this.dyeShort);
    this.simW = sw;
    this.simH = sh;
    this.dyeW = dw;
    this.dyeH = dh;
    const two = this.two;
    const one = { ...this.one, filter: gl.NEAREST };
    this.vel = new Swap(target(gl, sw, sh, two), target(gl, sw, sh, two));
    this.p = new Swap(target(gl, sw, sh, one), target(gl, sw, sh, one));
    this.div = target(gl, sw, sh, one);
    this.curl = target(gl, sw, sh, one);
    this.dye = new Swap(target(gl, dw, dh, two), target(gl, dw, dh, two));
    this.tmpA = target(gl, dw, dh, two);
    this.tmpB = target(gl, dw, dh, two);
  }

  /** Screen CSS px to domain uv. */
  uv(x: number, y: number): [number, number] {
    return [x / this.W, 1 - (y + this.M) / this.D];
  }

  private splat(s: Swap, x: number, y: number, color: [number, number, number, number], radiusPx: number) {
    const gl = this.gl;
    const { p, u } = this.progs.splat;
    gl.useProgram(p);
    bindTex(gl, u.uTarget, s.read.tex, 0);
    gl.uniform1f(u.uAspect, this.W / this.D);
    gl.uniform2f(u.uPoint, ...this.uv(x, y));
    gl.uniform4f(u.uColor, ...color);
    const r = radiusPx / this.D;
    gl.uniform1f(u.uRadius, r * r);
    this.draw(s.write);
    s.swap();
  }

  /**
   * A drop of ink entering the water at a screen point. `dark` adds the second, near-black ink.
   * A single round splat rolls up into a perfectly symmetric cap (two curls and an arc, which
   * reads as a face), so a drop is an off-centre core, a smaller lobe beside it and a trail of
   * ink above, pushed down slightly unevenly.
   */
  drop(x: number, y: number, amount: number, size: number, vx = 0, vy = 26, dark = 0) {
    const r = (a: number) => (Math.random() * 2 - 1) * a;
    const ink = (k: number): [number, number, number, number] => [amount * k, amount * k * dark, 0, 0];
    this.splat(this.dye, x, y, ink(0.62), size);
    this.splat(this.dye, x + size * (0.55 + r(0.2)) * Math.sign(r(1) || 1), y + r(size * 0.4), ink(0.32), size * 0.62);
    let tx = x;
    for (let i = 1; i <= 4; i++) {
      tx += r(size * 0.35);
      this.splat(this.dye, tx, y - size * (0.9 + i * 0.85), ink(0.16 / i), size * (0.55 - i * 0.07));
    }
    this.splat(this.vel, x + size * r(0.5), y, [vx + r(vy * 0.35), -vy, 0, 0], size * 1.9);
    this.splat(this.vel, x + size * r(1.2), y - size * 1.4, [r(vy * 0.3), -vy * 0.45, 0, 0], size * 1.3);
  }

  /** Stir the water without adding ink. Movement in CSS px since the last frame. */
  stir(x: number, y: number, dx: number, dy: number, size = 46) {
    const k = (60 / (this.D / this.simH)) * 0.35;
    this.splat(this.vel, x, y, [dx * k, -dy * k, 0, 0], size);
  }

  clear() {
    const gl = this.gl;
    for (const t of [this.vel.read, this.vel.write, this.dye.read, this.dye.write, this.p.read, this.p.write]) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, t.fbo);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
    }
  }

  private shift(s: Swap, dv: number) {
    const gl = this.gl;
    const { p, u } = this.progs.shift;
    gl.useProgram(p);
    bindTex(gl, u.uSrc, s.read.tex, 0);
    gl.uniform2f(u.uShift, 0, dv);
    this.draw(s.write);
    s.swap();
  }

  step(dt: number, scrolled: number, time: number) {
    const gl = this.gl;
    const st = this.settings;
    const texel: [number, number] = [1 / this.simW, 1 / this.simH];
    gl.disable(gl.BLEND);

    if (scrolled) {
      this.shift(this.dye, scrolled / this.D);
      this.shift(this.vel, scrolled / this.D);
    }
    if (dt <= 0) return;

    let { p, u } = this.progs.curl;
    gl.useProgram(p);
    bindTex(gl, u.uVel, this.vel.read.tex, 0);
    gl.uniform2f(u.uTexel, ...texel);
    this.draw(this.curl);

    ({ p, u } = this.progs.forces);
    gl.useProgram(p);
    bindTex(gl, u.uVel, this.vel.read.tex, 0);
    bindTex(gl, u.uCurl, this.curl.tex, 1);
    bindTex(gl, u.uDye, this.dye.read.tex, 2);
    gl.uniform2f(u.uTexel, ...texel);
    gl.uniform1f(u.uDt, dt);
    gl.uniform1f(u.uCurlK, st.curl);
    gl.uniform1f(u.uSink, st.sink);
    gl.uniform1f(u.uDrift, st.drift);
    gl.uniform1f(u.uTime, time);
    gl.uniform1f(u.uAspect, this.W / this.D);
    this.draw(this.vel.write);
    this.vel.swap();

    ({ p, u } = this.progs.div);
    gl.useProgram(p);
    bindTex(gl, u.uVel, this.vel.read.tex, 0);
    gl.uniform2f(u.uTexel, ...texel);
    this.draw(this.div);

    ({ p, u } = this.progs.scale);
    gl.useProgram(p);
    bindTex(gl, u.uSrc, this.p.read.tex, 0);
    gl.uniform1f(u.uK, 0.8);
    this.draw(this.p.write);
    this.p.swap();

    ({ p, u } = this.progs.pressure);
    gl.useProgram(p);
    gl.uniform2f(u.uTexel, ...texel);
    bindTex(gl, u.uDiv, this.div.tex, 1);
    for (let i = 0; i < 20; i++) {
      bindTex(gl, u.uP, this.p.read.tex, 0);
      this.draw(this.p.write);
      this.p.swap();
    }

    ({ p, u } = this.progs.gradient);
    gl.useProgram(p);
    bindTex(gl, u.uP, this.p.read.tex, 0);
    bindTex(gl, u.uVel, this.vel.read.tex, 1);
    gl.uniform2f(u.uTexel, ...texel);
    this.draw(this.vel.write);
    this.vel.swap();

    // velocity carries itself (plain semi-Lagrangian is fine for the water)
    ({ p, u } = this.progs.advect);
    gl.useProgram(p);
    gl.uniform2f(u.uTexel, ...texel);
    gl.uniform1f(u.uDt, dt);
    gl.uniform1f(u.uDecay, st.velDecay);
    bindTex(gl, u.uVel, this.vel.read.tex, 0);
    bindTex(gl, u.uSrc, this.vel.read.tex, 1);
    this.draw(this.vel.write);
    this.vel.swap();

    // ink: forward, back again, then the corrected step
    gl.uniform1f(u.uDecay, 0);
    bindTex(gl, u.uVel, this.vel.read.tex, 0);
    bindTex(gl, u.uSrc, this.dye.read.tex, 1);
    this.draw(this.tmpA);
    gl.uniform1f(u.uDt, -dt);
    bindTex(gl, u.uSrc, this.tmpA.tex, 1);
    this.draw(this.tmpB);

    ({ p, u } = this.progs.mac);
    gl.useProgram(p);
    bindTex(gl, u.uVel, this.vel.read.tex, 0);
    bindTex(gl, u.uSrc, this.dye.read.tex, 1);
    bindTex(gl, u.uFwd, this.tmpA.tex, 2);
    bindTex(gl, u.uBack, this.tmpB.tex, 3);
    gl.uniform2f(u.uTexel, ...texel);
    gl.uniform2f(u.uSize, this.dyeW, this.dyeH);
    gl.uniform1f(u.uDt, dt);
    gl.uniform1f(u.uDecay, st.dyeDecay);
    this.draw(this.dye.write);
    this.dye.swap();
  }
}

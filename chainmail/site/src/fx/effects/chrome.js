import { GLEffect } from '../core/gl-effect.js';
import { CHROME_FRAG } from '../shaders/chrome.js';

const MAX_RIPPLES = 6;

export class ChromeFX extends GLEffect {
  constructor(canvas, ctx) {
    // the weave is ALU-heavy (9 links + env lookups per pixel) and sits under a veil + vignette: render it at
    // DPR ≤ 1.25 with a 2.6 Mpx budget (1920×1080@2x: 8.6 → 2.6 Mpx) and let CSS upscale it
    super(canvas, ctx, { kind: 'chrome', frag: CHROME_FRAG, resScale: 1, minScale: 0.55, dprCap: 1.25, maxPixels: 2.6e6 });
    this._carry = 0;
    this._skip = false;
    this._lastInput = -1e3;
    this._lastScroll = -1;
    const ds = canvas.dataset;
    this.density = parseFloat(ds.fxDensity || '1'); // >1 = smaller links
    this.vignette = parseFloat(ds.fxVignette || '0.55'); // radius where the fade to the edge colour starts
    this.dim = Math.min(1, Math.max(0, parseFloat(ds.fxDim || '0'))); // extra global fade (0..1)
    this.pitch = 0.5; // camera pitch from straight-down (rad)
    this.focal = 2.3;
    this.dist = 10;
    this.scroll = 0;
    // pointer (link space) with spring inertia
    this.px = 0;
    this.py = 0;
    this.vx = 0;
    this.vy = 0;
    this.tx = 0;
    this.ty = 0;
    this.amp = 0;
    this.ampTarget = 0;
    this.hasPointer = false;
    this.ripples = new Float32Array(MAX_RIPPLES * 4);
    this.rippleHead = 0;
    this.lastSpawn = { x: 0, y: 0, t: 0 };
    this.unsubPointer = ctx.pointer.on((e) => this.onPointer(e));
  }

  /* Link units per plane unit: ~17 links across a 1440 px hero, never fewer than 10 (phones), at most 24. */
  linkScale() {
    const w = this.cssW || 1440;
    const across = Math.max(10, Math.min(24, w / 84)) * this.density;
    const aspect = (this.cssW || 16) / (this.cssH || 9);
    const planeW = (this.dist * aspect * 2) / this.focal;
    return (across * 1.1) / planeW;
  }

  /* Screen point (css px, canvas-relative) -> link space, mirroring the shader camera. */
  toLink(x, y) {
    const W = this.cssW || 1;
    const H = this.cssH || 1;
    const qx = ((x - 0.5 * W) / H) * 2;
    const qy = ((0.5 * H - y) / H) * 2;
    const a = this.pitch;
    const ro = [0, -this.dist * Math.sin(a), this.dist * Math.cos(a)];
    const fw = [0, Math.sin(a), -Math.cos(a)];
    const up = [0, Math.cos(a), Math.sin(a)];
    let rd = [fw[0] * this.focal + qx, fw[1] * this.focal + qy * up[1], fw[2] * this.focal + qy * up[2]];
    const l = Math.hypot(rd[0], rd[1], rd[2]);
    rd = rd.map((v) => v / l);
    const t = -ro[2] / rd[2];
    const s = this.linkScale();
    return [(ro[0] + rd[0] * t) * s, (ro[1] + rd[1] * t) * s];
  }

  /* cache the canvas's document box on resize; per-frame rect = cached box minus scroll (no layout read) */
  resize() {
    super.resize();
    if (this.failed) return;
    const r = this.canvas.getBoundingClientRect();
    this._doc = { left: r.left + window.scrollX, top: r.top + window.scrollY, width: r.width, height: r.height };
  }

  liveRect() {
    const d = this._doc;
    if (!d) return this.canvas.getBoundingClientRect();
    return { left: d.left - window.scrollX, top: d.top - window.scrollY, width: d.width, height: d.height };
  }

  liveRipples() {
    for (let i = 0; i < MAX_RIPPLES; i++) if (this.ripples[i * 4 + 3] > 0) return true;
    return false;
  }

  /* Idle throttle: 2 s after the last pointer input, with no ripples and no scroll, draw every other frame
     (~30 fps). The cloth phases move at 0.2-0.6 rad/s, so that is visually lossless and halves GPU work. */
  tick(now, dt, frameDt = dt) {
    const scrolled = this.scroll !== this._lastScroll;
    this._lastScroll = this.scroll;
    const idle = !this.ctx.reducedMotion && !this.dirty && !scrolled && this.time - this._lastInput > 2 && !this.liveRipples();
    if (idle && (this._skip = !this._skip)) {
      this._carry += dt;
      this.scroll = Math.min(1, Math.max(0, -this.liveRect().top / Math.max(1, this._doc?.height || 1)));
      return;
    }
    super.tick(now, dt + this._carry, frameDt);
    this._carry = 0;
  }

  onPointer(e) {
    if (this.ctx.reducedMotion || this.failed) return;
    const r = this.liveRect();
    const x = e.x - r.left;
    const y = e.y - r.top;
    const inside = x >= 0 && y >= 0 && x <= r.width && y <= r.height;
    if (e.type === 'leave' || !inside) {
      this.hasPointer = false;
      this.ampTarget = 0;
      return;
    }
    this._lastInput = this.time;
    const [lx, ly] = this.toLink(x, y);
    if (!this.hasPointer) {
      this.px = this.tx = lx;
      this.py = this.ty = ly;
    }
    this.tx = lx;
    this.ty = ly;
    this.hasPointer = true;
    this.ampTarget = 1;

    // ripples: on tap/click, and every ~110 css px of travel (screen-space so it feels the same on any viewport)
    const now = this.time;
    const ls = this.lastSpawn;
    const moved = Math.hypot(x - ls.x, y - ls.y);
    if (e.type === 'down') this.spawn(lx, ly, 1.0, x, y);
    else if (moved > 110 && now - ls.t > 0.16) this.spawn(lx, ly, Math.min(0.6, 0.22 + moved * 0.0015), x, y);
    this.ctx.wake();
  }

  spawn(lx, ly, amp, sx, sy) {
    const i = this.rippleHead * 4;
    this.ripples[i] = lx;
    this.ripples[i + 1] = ly;
    this.ripples[i + 2] = 0;
    this.ripples[i + 3] = amp;
    this.rippleHead = (this.rippleHead + 1) % MAX_RIPPLES;
    this.lastSpawn = { x: sx, y: sy, t: this.time };
  }

  update(now, dt) {
    const r = this.liveRect();
    // scroll-linked light tilt: 0 when hero top is at viewport top, 1 when scrolled one hero height
    this.scroll = Math.min(1, Math.max(0, -r.top / Math.max(1, r.height)));
    if (this.ctx.reducedMotion) return;
    // critically-damped spring toward pointer target (inertia)
    const k = 18;
    const c = 2 * Math.sqrt(k);
    const ax = (this.tx - this.px) * k - this.vx * c;
    const ay = (this.ty - this.py) * k - this.vy * c;
    this.vx += ax * dt;
    this.vy += ay * dt;
    this.px += this.vx * dt;
    this.py += this.vy * dt;
    const speed = Math.hypot(this.vx, this.vy);
    const want = this.ampTarget * (0.55 + Math.min(1.3, speed * 0.05));
    this.amp += (want - this.amp) * Math.min(1, dt * 3);
    for (let i = 0; i < MAX_RIPPLES; i++) {
      const j = i * 4;
      if (this.ripples[j + 3] <= 0) continue;
      this.ripples[j + 2] += dt;
      if (this.ripples[j + 2] > 4) this.ripples[j + 3] = 0;
    }
  }

  setUniforms(gl, u) {
    gl.uniform2f(u('uRes'), this.w, this.h);
    gl.uniform1f(u('uTime'), this.ctx.reducedMotion ? 7.5 : this.time + 7.5);
    gl.uniform3f(u('uCam'), this.pitch, this.focal, this.dist);
    gl.uniform1f(u('uScale'), this.linkScale());
    gl.uniform3f(u('uPointer'), this.px, this.py, this.amp);
    gl.uniform4fv(u('uRipples'), this.ripples);
    let n = 0;
    for (let i = 0; i < MAX_RIPPLES; i++) if (this.ripples[i * 4 + 3] > 0) n = i + 1;
    gl.uniform1i(u('uRippleCount'), n);
    gl.uniform1f(u('uScroll'), this.scroll);
    gl.uniform1f(u('uTheme'), this.theme);
    gl.uniform2f(u('uVignette'), this.vignette, this.vignette + 0.75);
    gl.uniform1f(u('uDim'), this.dim);
  }

  destroy() {
    this.unsubPointer?.();
    super.destroy();
  }
}

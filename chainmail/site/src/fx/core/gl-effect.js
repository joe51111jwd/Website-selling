/* Base for full-canvas fragment-shader effects.
   Handles: DPR cap, adaptive resolution, resize, visibility, context loss/restore,
   reduced-motion stills, theme tweening and the no-WebGL CSS fallback. */

import { getGL, createQuadProgram } from './gl.js';

export const DPR_CAP = 1.75;

export class GLEffect {
  /**
   * @param {HTMLCanvasElement} canvas
   * @param {object} ctx  shared context from initFX ({ reducedMotion, pointer, wake })
   * @param {object} o    { kind, frag, resScale, minScale, adaptive, dprCap, maxPixels, powerPreference }
   */
  constructor(canvas, ctx, o) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.kind = o.kind;
    this.frag = o.frag;
    this.baseScale = o.resScale ?? 1; // fraction of (capped) DPR resolution
    this.minScale = o.minScale ?? 0.5;
    this.adaptive = o.adaptive ?? true;
    this.dprCap = o.dprCap ?? DPR_CAP; // per-effect DPR cap (heavy shaders render below DPR and upscale)
    this.maxPixels = o.maxPixels ?? Infinity; // hard budget for the drawing buffer, in device pixels
    this.quality = 1; // adaptive multiplier
    this.visible = false;
    this.failed = false;
    this.lost = false;
    this.dirty = true; // needs at least one draw (reduced motion / static)
    this.time = 0;
    this.theme = 0; // 0 = ink, 1 = bone
    this.themeTarget = 0;
    this.w = 0;
    this.h = 0;
    this._slow = 0;
    this._fast = 0;
    this._dtAvg = 1 / 60;

    const t = canvas.dataset.theme || canvas.closest('[data-theme]')?.dataset.theme;
    if (t === 'bone') this.theme = this.themeTarget = 1;
    canvas.dataset.fxTheme = t === 'bone' ? 'bone' : 'ink';

    this.gl = getGL(canvas, { alpha: !!o.alpha, powerPreference: o.powerPreference });
    if (!this.gl) {
      this.fail();
      return;
    }
    try {
      this.setupGL();
    } catch (e) {
      console.warn(e);
      this.fail();
      return;
    }

    this._onLost = (e) => {
      e.preventDefault();
      this.lost = true;
    };
    this._onRestored = () => {
      this.lost = false;
      try {
        this.setupGL();
        this.dirty = true;
        this.resize();
        this.ctx.wake();
      } catch (err) {
        this.fail();
      }
    };
    canvas.addEventListener('webglcontextlost', this._onLost, false);
    canvas.addEventListener('webglcontextrestored', this._onRestored, false);

    canvas.classList.add('fx-canvas', 'fx-live');
    this.resize();
  }

  setupGL() {
    this.program = createQuadProgram(this.gl, this.frag);
    this.onSetup?.();
  }

  fail() {
    this.failed = true;
    this.canvas.classList.remove('fx-live');
    this.canvas.classList.add('fx-canvas', 'fx-fallback', `fx-fallback--${this.kind}`);
  }

  setTheme(name) {
    this.themeTarget = name === 'bone' ? 1 : 0;
    this.canvas.dataset.fxTheme = name;
    if (this.ctx.reducedMotion) this.theme = this.themeTarget;
    this.dirty = true;
    this.ctx.wake();
  }

  resize() {
    if (this.failed) return;
    const rect = this.canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, this.dprCap);
    let s = dpr * this.baseScale * this.quality;
    const px = rect.width * rect.height * s * s;
    if (px > this.maxPixels) s *= Math.sqrt(this.maxPixels / px);
    const w = Math.max(1, Math.round(rect.width * s));
    const h = Math.max(1, Math.round(rect.height * s));
    this.cssW = rect.width;
    this.cssH = rect.height;
    if (w !== this.w || h !== this.h) {
      this.w = this.canvas.width = w;
      this.h = this.canvas.height = h;
      this.dirty = true;
    }
  }

  /* Adaptive resolution: drop render scale when frames are slow, recover when fast. */
  adapt(dt) {
    if (!this.adaptive) return;
    this._dtAvg += (dt - this._dtAvg) * 0.08;
    if (this._dtAvg > 1 / 45) {
      if (++this._slow > 20 && this.quality > this.minScale) {
        this.quality = Math.max(this.minScale, this.quality * 0.8);
        this._slow = 0;
        this.resize();
      }
    } else this._slow = 0;
    if (this._dtAvg < 1 / 58 && this.quality < 1) {
      if (++this._fast > 240) {
        this.quality = Math.min(1, this.quality * 1.1);
        this._fast = 0;
        this.resize();
      }
    } else this._fast = 0;
  }

  /* Called by the shared loop. */
  active() {
    if (this.failed || this.lost) return false;
    if (this.ctx.reducedMotion) return this.dirty;
    return this.visible || this.dirty;
  }

  /* dt = time to advance the animation; frameDt = the last RAF interval (what adaptive quality measures).
     They differ when an effect skips draws (see ChromeFX idle throttle). */
  tick(now, dt, frameDt = dt) {
    if (!this.ctx.reducedMotion) {
      this.time += dt;
      this.adapt(frameDt);
    }
    // tween theme
    this.theme += (this.themeTarget - this.theme) * Math.min(1, dt * 4);
    if (Math.abs(this.themeTarget - this.theme) < 0.001) this.theme = this.themeTarget;
    this.update?.(now, dt);
    const gl = this.gl;
    gl.viewport(0, 0, this.w, this.h);
    gl.useProgram(this.program.prog);
    gl.bindVertexArray(this.program.vao);
    this.setUniforms(gl, this.program.u);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    this.dirty = false;
  }

  setUniforms() {}

  destroy() {
    if (this.gl && !this.failed) {
      this.program?.dispose();
      this.gl.getExtension('WEBGL_lose_context')?.loseContext();
    }
    this.canvas.removeEventListener('webglcontextlost', this._onLost);
    this.canvas.removeEventListener('webglcontextrestored', this._onRestored);
    this.canvas.classList.remove('fx-live');
  }
}

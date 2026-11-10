import { GLEffect } from '../core/gl-effect.js';
import { CAUSTICS_FRAG } from '../shaders/caustics.js';

/* Caustics are soft by nature: render at 60% of the capped DPR and let the browser upscale. */
export class CausticsFX extends GLEffect {
  constructor(canvas, ctx) {
    super(canvas, ctx, { kind: 'caustics', frag: CAUSTICS_FRAG, resScale: 0.6, minScale: 0.5 });
    this.intensity = parseFloat(canvas.dataset.fxIntensity || '1');
  }

  setUniforms(gl, u) {
    gl.uniform2f(u('uRes'), this.w, this.h);
    gl.uniform1f(u('uTime'), this.ctx.reducedMotion ? 3.0 : this.time * 0.55 + 3.0);
    gl.uniform1f(u('uTheme'), this.theme);
    gl.uniform1f(u('uIntensity'), this.intensity);
  }
}

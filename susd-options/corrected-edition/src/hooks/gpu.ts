// Software renderers (SwiftShader, llvmpipe: VMs, remote desktops, headless capture) cannot
// keep up with per-frame repaints of large, lit, rotated type. There the page is "calm": every
// sheet is drawn in its settled end state at once, as under reduced motion, while user-triggered
// interactions (the transpose, Strike it, the stamp) still play.
let cached: boolean | null = null;

export function isSoftwareRenderer(): boolean {
  if (cached !== null) return cached;
  cached = false;
  try {
    const c = document.createElement('canvas');
    const gl = (c.getContext('webgl') || c.getContext('experimental-webgl')) as WebGLRenderingContext | null;
    if (gl) {
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const name = String(ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER));
      cached = /swiftshader|llvmpipe|softpipe|software|basic render/i.test(name);
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    }
  } catch {
    cached = false;
  }
  return cached;
}

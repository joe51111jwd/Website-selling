import { useEffect, useRef } from "react";

// A ceiling of fire in a fragment shader: fbm noise drawn up into the top edge, as gas flame
// rolls across a broiler's radiants. `heat` (0..1) sets how far the flames reach down.
const VERT = `attribute vec2 p; void main(){ gl_Position = vec4(p, 0.0, 1.0); }`;
const FRAG = `
precision highp float;
uniform vec2 res;
uniform float t;
uniform float heat;
uniform vec2 mouse;   // pointer in uv (y up), x < 0 when absent
uniform float stir;   // how hard the pointer is fanning the flames
float hash(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float noise(vec2 p){
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1,0)), u.x), mix(hash(i + vec2(0,1)), hash(i + vec2(1,1)), u.x), u.y);
}
float fbm(vec2 p){
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 6; i++){ v += a * noise(p); p = p * 2.03 + vec2(1.7, 9.2); a *= 0.5; }
  return v;
}
void main(){
  vec2 uv = gl_FragCoord.xy / res;
  float aspect = res.x / res.y;
  float d = 1.0 - uv.y;                         // distance down from the burner
  float x = uv.x * aspect;
  // tongues: each column of flame reaches its own distance, and that changes over time
  float tongue = fbm(vec2(x * 3.2, t * 0.45)) * 0.75 + fbm(vec2(x * 9.0 - t * 0.8, t * 0.9)) * 0.45;
  float reach = (0.05 + 0.55 * heat) * (0.35 + tongue * 1.05);
  if (mouse.x >= 0.0) {
    float dx = (uv.x - mouse.x) * aspect;
    reach += stir * 0.3 * exp(-dx * dx * 10.0);
  }
  // turbulence that drifts up into the burner, so the flames look drawn toward it
  vec2 q = vec2(x * 5.5, d * 7.0 + t * 2.0);
  float w = fbm(q + vec2(0.0, fbm(q * 0.7 + t * 0.3) * 1.6));
  float f = 1.0 - d / max(reach, 0.001);
  f += (w - 0.5) * 0.9;
  f = clamp(f, 0.0, 1.0);
  f *= smoothstep(0.0, 0.06, heat);
  // the burner face itself glows along the very top
  float face = exp(-d * 40.0) * heat;
  f = max(f, face * 0.9);
  vec3 col = vec3(0.35, 0.02, 0.0);
  col = mix(col, vec3(0.95, 0.18, 0.01), smoothstep(0.05, 0.35, f));
  col = mix(col, vec3(1.0, 0.5, 0.06), smoothstep(0.3, 0.6, f));
  col = mix(col, vec3(1.0, 0.82, 0.35), smoothstep(0.55, 0.85, f));
  col = mix(col, vec3(1.0, 0.97, 0.85), smoothstep(0.85, 1.0, f));
  float a = smoothstep(0.0, 0.5, f);
  // a soft glow spilling below the flames
  float glow = exp(-d * (5.5 - 2.5 * heat)) * heat * 0.22;
  vec3 outc = col * a + vec3(1.0, 0.3, 0.05) * glow;
  gl_FragColor = vec4(outc, clamp(a + glow, 0.0, 1.0));
}`;

export function BroilerFire({
  heat,
  pointer,
}: {
  heat: React.MutableRefObject<number>;
  /** optional pointer in 0..1 (y down) and how strongly it stirs the fire */
  pointer?: React.MutableRefObject<{ x: number; y: number; stir: number }>;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const gl = c.getContext("webgl", { premultipliedAlpha: true, alpha: true, antialias: false });
    if (!gl) return;
    const sh = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) console.warn("broiler shader:", gl.getShaderInfoLog(s));
      return s;
    };
    const prog = gl.createProgram()!;
    gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
    gl.useProgram(prog);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, "p");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const uRes = gl.getUniformLocation(prog, "res");
    const uT = gl.getUniformLocation(prog, "t");
    const uHeat = gl.getUniformLocation(prog, "heat");
    const uMouse = gl.getUniformLocation(prog, "mouse");
    const uStir = gl.getUniformLocation(prog, "stir");
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA); // premultiplied: dark flame tails fade out, not brown

    let raf = 0;
    let visible = false;
    const t0 = performance.now();
    const frame = (now: number) => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      const w = Math.round(c.clientWidth * dpr * 0.75);
      const h = Math.round(c.clientHeight * dpr * 0.75);
      if (c.width !== w || c.height !== h) {
        c.width = w;
        c.height = h;
      }
      gl.viewport(0, 0, w, h);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform2f(uRes, w, h);
      gl.uniform1f(uT, (now - t0) / 1000);
      gl.uniform1f(uHeat, heat.current);
      const pt = pointer?.current;
      gl.uniform2f(uMouse, pt ? pt.x : -1, pt ? 1 - pt.y : 0);
      gl.uniform1f(uStir, pt ? pt.stir : 0);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      if (visible) raf = requestAnimationFrame(frame);
    };
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      cancelAnimationFrame(raf);
      if (visible) raf = requestAnimationFrame(frame);
    });
    io.observe(c);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [heat, pointer]);
  return <canvas ref={ref} className="broiler-fire" aria-hidden />;
}

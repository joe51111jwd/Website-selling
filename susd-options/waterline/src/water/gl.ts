import type { WaterModel } from './model';
import { MAX_RIPPLES } from './model';

// Raw WebGL2: one program, one full-screen triangle. Colours are the cover green, darkened.
const VS = `#version 300 es
in vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }`;

const FS = `#version 300 es
precision highp float;
uniform vec2 uRes;      // CSS px
uniform float uDpr;
uniform float uLevel;
uniform float uTime;
uniform float uA1;
uniform float uA2;
uniform vec4 uRip[${MAX_RIPPLES}]; // x, t0, amp, 0
uniform float uCT;
uniform float uFoam;
uniform float uTop;      // the crest: nothing above it needs the surface function
out vec4 outColor;

const float TAU = 6.28318530718;
const vec3 TOP = vec3(0.1216, 0.2392, 0.1647);   // #1F3D2A
const vec3 DEEP = vec3(0.0431, 0.0863, 0.0667);  // #0B1611
const vec3 CREAM = vec3(0.9451, 0.9176, 0.8745); // #F1EADF
const vec3 FOAM = vec3(0.9647, 0.9451, 0.9059);  // #F6F1E7

float surf(float x) {
  float y = uLevel + uA1 * sin(TAU * 1.6 * x / uRes.x + 0.9 * uTime) + uA2 * sin(TAU * 3.7 * x / uRes.x - 1.7 * uTime);
  for (int i = 0; i < ${MAX_RIPPLES}; i++) {
    vec4 r = uRip[i];
    float dt = uTime - r.y;
    if (r.z <= 0.0 || dt < 0.0) continue;
    float d = abs(x - r.x);
    y += r.z * exp(-1.6 * dt) * exp(-d / 160.0) * sin(0.045 * d - 7.0 * dt);
  }
  return y;
}

// Two layers of warped abs(sin) products: a soft moving net of light, never a sparkle.
float caustic(vec2 p, float t) {
  vec2 q = p + 0.55 * vec2(sin(p.y * 1.7 + t * 0.8), sin(p.x * 1.5 - t * 0.7));
  q += 0.3 * vec2(sin(q.y * 2.9 - t * 0.6), sin(q.x * 2.6 + t * 0.5));
  float a = pow(1.0 - abs(sin(q.x * 1.6) * sin(q.y * 1.6)), 6.0);
  vec2 r = p * 1.31 + vec2(3.1, 1.7);
  r += 0.5 * vec2(sin(r.y * 1.3 - t * 0.55), sin(r.x * 1.2 + t * 0.6));
  float b = pow(1.0 - abs(sin(r.x * 1.4 + 0.7) * sin(r.y * 1.4 - 0.4)), 6.0);
  return a * b;
}

void main() {
  vec2 px = vec2(gl_FragCoord.x / uDpr, uRes.y - gl_FragCoord.y / uDpr);
  if (px.y < uTop) { outColor = vec4(0.0); return; }
  float s = surf(px.x);
  float d = px.y - s;
  if (d < -2.0) { outColor = vec4(0.0); return; }
  float aa = 0.7 / uDpr;
  float depth = clamp(d / uRes.y, 0.0, 1.0);
  vec3 col = mix(TOP, DEEP, pow(depth, 0.7));
  col *= mix(0.82, 1.0, smoothstep(0.0, 14.0, d));
  col += CREAM * caustic(px / 140.0, uCT) * 0.10 * (1.0 - depth);
  // sub-LSB dither so the depth gradient never bands
  col += (fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453) - 0.5) / 255.0;
  float a = mix(0.87, 0.97, smoothstep(0.0, 0.6, depth));
  float inside = smoothstep(-aa, aa, d);
  vec4 water = vec4(col * a, a) * inside;
  float f = clamp((0.6 - abs(d - 0.6)) * uDpr + 0.5, 0.0, 1.0) * 0.9 * uFoam;
  outColor = water * (1.0 - f) + vec4(FOAM * f, f);
}`;

export type GLWater = { resize(w: number, h: number, dpr: number): void; draw(m: WaterModel): void; clear(): void };

export function createGL(canvas: HTMLCanvasElement): GLWater | null {
  let gl: WebGL2RenderingContext | null = null;
  try {
    gl = canvas.getContext('webgl2', { alpha: true, premultipliedAlpha: true, antialias: false, depth: false, stencil: false, powerPreference: 'low-power' });
  } catch {
    gl = null;
  }
  if (!gl) return null;
  const compile = (type: number, src: string) => {
    const sh = gl!.createShader(type)!;
    gl!.shaderSource(sh, src);
    gl!.compileShader(sh);
    if (!gl!.getShaderParameter(sh, gl!.COMPILE_STATUS)) {
      gl!.deleteShader(sh);
      return null;
    }
    return sh;
  };
  const vs = compile(gl.VERTEX_SHADER, VS);
  const fs = compile(gl.FRAGMENT_SHADER, FS);
  if (!vs || !fs) return null;
  const prog = gl.createProgram()!;
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return null;
  gl.useProgram(prog);
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, 'aPos');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const u = (n: string) => gl!.getUniformLocation(prog, n);
  const U = { res: u('uRes'), dpr: u('uDpr'), level: u('uLevel'), time: u('uTime'), a1: u('uA1'), a2: u('uA2'), rip: u('uRip'), ct: u('uCT'), foam: u('uFoam'), top: u('uTop') };
  const rip = new Float32Array(MAX_RIPPLES * 4);
  let W = 1, H = 1, D = 1;
  gl.disable(gl.BLEND);
  gl.clearColor(0, 0, 0, 0);

  return {
    resize(w, h, dpr) {
      W = w;
      H = h;
      D = dpr;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      gl!.viewport(0, 0, canvas.width, canvas.height);
    },
    clear() {
      gl!.clear(gl!.COLOR_BUFFER_BIT);
    },
    draw(m) {
      const amp = m.ampNow();
      rip.fill(0);
      m.ripples.forEach((r, i) => {
        rip[i * 4] = r.x;
        rip[i * 4 + 1] = r.t0;
        rip[i * 4 + 2] = r.a;
      });
      gl!.uniform2f(U.res, W, H);
      gl!.uniform1f(U.dpr, D);
      gl!.uniform1f(U.level, m.level.value);
      gl!.uniform1f(U.time, m.t);
      gl!.uniform1f(U.a1, m.A1 * amp);
      gl!.uniform1f(U.a2, m.A2 * amp);
      gl!.uniform4fv(U.rip, rip);
      gl!.uniform1f(U.ct, m.ct);
      gl!.uniform1f(U.foam, m.foam);
      gl!.uniform1f(U.top, m.crest(amp));
      gl!.drawArrays(gl!.TRIANGLES, 0, 3);
    },
  };
}

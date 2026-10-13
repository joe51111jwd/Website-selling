// t0 · the desktop ground: one WebGL2 fragment shader draws the contour plan straight from the
// height field, so the grading pass is a true field morph, H = mix(E, G, pass(x, t)): the lines
// themselves slide aside and straighten into the cut and fill slopes. No CPU contouring per frame.
//
// - E (the existing ground) comes in as a texture from the worker (./terrain.ts: value and
//   gradient on a 2 px grid). G (the graded surface: the level pad, the 2:1 cut and 3:1 fill
//   slopes, the daylight creases) is computed per pixel, with its gradient (dual numbers), so every
//   line's width is exact: distance to the nearest isoline = |A − round(A)| / |∇A|.
// - Every 5th level is an index contour. Proposed (graded) lines are one step heavier and darker
//   than natural ground, and drop to 70% near the pad's edge. Ink only, never orange.
// - It renders on demand: the pass, a resize, a lost context. At rest the canvas is a still bitmap
//   (no rAF, no re-render), so two frames 500 ms apart are pixel-identical.
// - The program links with KHR_parallel_shader_compile where available, so it never blocks the
//   main thread; the caller falls back to the SVG plan if it isn't ready in time.

import type { Grade, Rect } from "./terrain";

const VS = `#version 300 es
in vec2 aP;
void main() { gl_Position = vec4(aP, 0.0, 1.0); }`;

const FS = `#version 300 es
precision highp float;
precision highp sampler2D;
uniform sampler2D uE;
uniform vec4 uGrid;      // x0, y0, 1/step, step
uniform ivec2 uGN;       // nx, ny
uniform vec2 uView;      // css W, H
uniform float uDpr;
uniform vec4 uPad;       // cx, cy, half w, half h
uniform float uPadR;
uniform vec3 uSlope;     // cut, fill (ft per px), k (ft)
uniform vec3 uFront;     // front x (css), band width, entrance (1) / rest (0)
uniform vec4 uKeep[10];  // halo boxes: x0, y0, x1, y1 (css)
uniform int uNKeep;
uniform int uNHead;      // the first uNHead boxes always break the lines (the header)
uniform float uKeepFoot; // the rest (the foot row) fade in with it
uniform vec3 uInkN;      // natural ink
uniform vec3 uInkP;      // proposed ink
uniform vec4 uW;         // css widths: nat int, nat idx, pro int, pro idx
uniform vec4 uO;         // opacities: nat int, nat idx, pro int, pro idx
uniform vec4 uCur;       // cursor x, y, push dx, dy (css)
uniform float uCurR;     // cursor radius
uniform vec3 uLab[6];    // the index labels (x, y, half length): the push leaves their lines alone
uniform int uNLab;
out vec4 o;

vec4 tx(ivec2 i) { return texelFetch(uE, clamp(i, ivec2(0), uGN - 1), 0); }
vec4 sampleE(vec2 p) {
  vec2 f = (p - uGrid.xy) * uGrid.z;
  vec2 i0 = floor(f);
  vec2 t = f - i0;
  ivec2 i = ivec2(i0);
  vec4 a = tx(i), b = tx(i + ivec2(1, 0)), c = tx(i + ivec2(0, 1)), d = tx(i + ivec2(1, 1));
  return mix(mix(a, b, t.x), mix(c, d, t.x), t.y);
}

// value + gradient (dual numbers) through the polynomial smooth min / max
vec3 dmin(vec3 a, vec3 b, float k) {
  float h = max(k - abs(a.x - b.x), 0.0) / k;
  bool al = a.x < b.x;
  vec3 m = al ? a : b;
  float s = al ? -1.0 : 1.0;
  vec2 gh = h > 0.0 ? -s * (a.yz - b.yz) / k : vec2(0.0);
  return vec3(m.x - h * h * k * 0.25, m.yz - 0.5 * h * k * gh);
}
vec3 dmax(vec3 a, vec3 b, float k) { return -dmin(-a, -b, k); }

// signed distance to the pad (a rounded rectangle) and its gradient
vec3 sdPad(vec2 p) {
  vec2 hs = uPad.zw;
  float r = min(uPadR, min(hs.x, hs.y));
  vec2 dp = p - uPad.xy;
  vec2 sg = vec2(dp.x < 0.0 ? -1.0 : 1.0, dp.y < 0.0 ? -1.0 : 1.0);
  vec2 q = abs(dp) - (hs - r);
  if (q.x > 0.0 && q.y > 0.0) { float L = length(q); return vec3(L - r, sg * q / L); }
  if (q.x > q.y) return vec3(q.x - r, sg.x, 0.0);
  return vec3(q.y - r, 0.0, sg.y);
}

void main() {
  vec2 p = vec2(gl_FragCoord.x, uView.y * uDpr - gl_FragCoord.y) / uDpr;
  vec3 D = sdPad(p);
  vec3 E = sampleE(p).xyz;
  // the graded surface
  vec3 G = vec3(0.0);
  if (D.x > 0.0) {
    vec3 hi = uSlope.x * D;
    vec3 lo = -uSlope.y * D;
    G = dmax(dmin(E, hi, uSlope.z), lo, uSlope.z);
  }
  float lim = smoothstep(0.02, 0.1, abs(G.x - E.x));
  // the cursor: on natural ground only, the contours make way (a push, no new rings)
  if (uCurR > 0.0) {
    float nat = 1.0 - smoothstep(0.0, 0.05, abs(G.x - E.x));
    nat *= smoothstep(30.0, 120.0, D.x);
    for (int i = 0; i < 6; i++) {
      if (i >= uNLab) break;
      nat *= smoothstep(uLab[i].z, uLab[i].z + 50.0, distance(p, uLab[i].xy));
    }
    vec2 r = p - uCur.xy;
    float f = exp(-dot(r, r) / (uCurR * uCurR)) * nat;
    if (f > 0.002) {
      vec3 Ed = sampleE(p - uCur.zw * f).xyz;
      E = mix(E, Ed, nat);
      if (D.x > 0.0) G = mix(G, Ed, nat);
    }
  }
  // the pass: w = 1 behind the front (graded), 0 ahead (existing)
  float w = 1.0;
  float dw = 0.0;
  if (uFront.z > 0.5) {
    float u = clamp((p.x - (uFront.x - 0.5 * uFront.y)) / uFront.y, 0.0, 1.0);
    w = 1.0 - u * u * (3.0 - 2.0 * u);
    dw = (u > 0.0 && u < 1.0) ? -6.0 * u * (1.0 - u) / uFront.y : 0.0;
  }
  vec3 H = mix(E, G, w);
  H.y += (G.x - E.x) * dw;
  float A = H.x + 1240.5;
  float n = floor(A + 0.5);
  float g = max(length(H.yz), 1e-5);
  float dist = abs(A - n) / g * uDpr;
  bool idx = abs(mod(n, 5.0)) < 0.5;
  float pro = lim * w;
  float wid = mix(idx ? uW.y : uW.x, idx ? uW.w : uW.z, pro) * uDpr;
  float op = mix(idx ? uO.y : uO.x, idx ? uO.w : uO.z, pro);
  vec3 ink = mix(uInkN, uInkP, pro);
  // near the pad's edge the slope lines step back, so they never buzz against the type
  op *= mix(1.0, mix(0.7, 1.0, smoothstep(0.0, 40.0, D.x)), lim);
  // during the entrance the existing ground inside the limits is the dashed overlay's job
  // and on the pad itself the old ground dissolves (the dashed overlay) rather than morphing: a
  // flat target under a moving blend only draws strands along the band, a curtain, not a grade.
  // The slopes are where the lines visibly slide aside and bunch into the cut and fill.
  if (uFront.z > 0.5) op *= mix(1.0, smoothstep(0.02, 0.16, w) * smoothstep(-30.0, 8.0, D.x), lim);
  // halo breaks round the header and the foot row
  float keep = 1.0;
  for (int i = 0; i < 10; i++) {
    if (i >= uNKeep) break;
    vec4 k = uKeep[i];
    vec2 dd = max(k.xy - p, p - k.zw);
    float sd = max(dd.x, dd.y);
    keep *= mix(1.0, smoothstep(0.0, 7.0, sd), i < uNHead ? 1.0 : uKeepFoot);
  }
  float we = max(wid, 1.0);
  float cov = clamp(0.5 * we + 0.5 - dist, 0.0, 1.0) * min(wid, 1.0);
  float a = cov * op * keep;
  o = vec4(ink * a, a);
}`;

export type Look = {
  /** css px widths: natural intermediate / index, proposed intermediate / index */
  w: [number, number, number, number];
  o: [number, number, number, number];
  inkN: [number, number, number];
  inkP: [number, number, number];
};

const hex = (h: string): [number, number, number] => [parseInt(h.slice(1, 3), 16) / 255, parseInt(h.slice(3, 5), 16) / 255, parseInt(h.slice(5, 7), 16) / 255];

/** The plan's weights (CONCEPTS §2.4): at DPR 1 index and intermediate differ by opacity, not width. */
export function lookFor(dpr: number): Look {
  const hi = dpr >= 1.5;
  return {
    w: hi ? [0.6, 1.05, 0.7, 1.2] : [0.6, 1, 0.7, 1],
    o: hi ? [0.22, 0.4, 0.3, 0.48] : [0.3, 0.36, 0.4, 0.46],
    inkN: hex("#74665a"),
    inkP: hex("#4a4038"),
  };
}

export type GLGround = {
  canvas: HTMLCanvasElement;
  /** resolves true once the program has linked (never blocks: parallel compile, or a late check) */
  linked: Promise<boolean>;
  setField(tex: Float32Array, grid: { x0: number; y0: number; step: number; nx: number; ny: number }): void;
  setGrade(g: Grade, keep: Rect[], nHead: number, labels?: { x: number; y: number }[]): void;
  size(W: number, H: number, dpr: number): void;
  /** front: css x of the grading front; band: its soft width; entrance: false = the rest frame */
  draw(s: { front: number; band: number; entrance: boolean; keepFoot?: number; cursor?: { x: number; y: number; dx: number; dy: number; r: number } }): void;
  lost(): boolean;
  destroy(): void;
};

export function createGL(onLost: () => void): GLGround | null {
  const canvas = document.createElement("canvas");
  canvas.className = "t0-gl";
  canvas.setAttribute("aria-hidden", "true");
  let gl: WebGL2RenderingContext | null = null;
  try {
    gl = canvas.getContext("webgl2", {
      alpha: true,
      premultipliedAlpha: true,
      antialias: false,
      depth: false,
      stencil: false,
      preserveDrawingBuffer: false,
      powerPreference: "low-power",
    });
  } catch {
    gl = null;
  }
  if (!gl) return null;
  const G = gl;
  let isLost = false;
  canvas.addEventListener("webglcontextlost", (e) => {
    e.preventDefault();
    isLost = true;
    onLost();
  });

  const par = G.getExtension("KHR_parallel_shader_compile") as { COMPLETION_STATUS_KHR: number } | null;
  const sh = (type: number, src: string) => {
    const s = G.createShader(type)!;
    G.shaderSource(s, src);
    G.compileShader(s);
    return s;
  };
  const prog = G.createProgram()!;
  const vs = sh(G.VERTEX_SHADER, VS);
  const fs = sh(G.FRAGMENT_SHADER, FS);
  G.attachShader(prog, vs);
  G.attachShader(prog, fs);
  G.bindAttribLocation(prog, 0, "aP");
  G.linkProgram(prog);

  const linked = new Promise<boolean>((resolve) => {
    const check = () => {
      if (isLost) return resolve(false);
      const ok = G.getProgramParameter(prog, G.LINK_STATUS) as boolean;
      if (!ok && import.meta.env.DEV) console.warn("t0 ground shader:", G.getShaderInfoLog(fs) || G.getProgramInfoLog(prog));
      resolve(ok);
    };
    if (par) {
      const poll = () => (G.getProgramParameter(prog, par.COMPLETION_STATUS_KHR) ? check() : setTimeout(poll, 8));
      poll();
    } else {
      // no parallel compile: ask for the status only once the driver has surely finished, so the
      // query is cheap and never stalls a frame
      setTimeout(check, 120);
    }
  });

  let U: Record<string, WebGLUniformLocation | null> = {};
  let ready = false;
  const tex = G.createTexture();
  const buf = G.createBuffer();
  let W = 1;
  let H = 1;
  let dpr = 1;
  let grid = { x0: 0, y0: 0, step: 1, nx: 1, ny: 1 };
  let grade: Grade | null = null;
  let keep: Rect[] = [];
  let nHead = 0;
  const kb = new Float32Array(40);
  const lb = new Float32Array(18);
  let nLab = 0;
  let look = lookFor(1);
  let hasField = false;

  const init = () => {
    if (ready) return;
    ready = true;
    G.useProgram(prog);
    for (const n of ["uE", "uGrid", "uGN", "uView", "uDpr", "uPad", "uPadR", "uSlope", "uFront", "uKeep", "uNKeep", "uNHead", "uKeepFoot", "uInkN", "uInkP", "uW", "uO", "uCur", "uCurR", "uLab", "uNLab"])
      U[n] = G.getUniformLocation(prog, n);
    G.bindBuffer(G.ARRAY_BUFFER, buf);
    G.bufferData(G.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), G.STATIC_DRAW);
    G.enableVertexAttribArray(0);
    G.vertexAttribPointer(0, 2, G.FLOAT, false, 0, 0);
    G.activeTexture(G.TEXTURE0);
    G.bindTexture(G.TEXTURE_2D, tex);
    G.texParameteri(G.TEXTURE_2D, G.TEXTURE_MIN_FILTER, G.NEAREST);
    G.texParameteri(G.TEXTURE_2D, G.TEXTURE_MAG_FILTER, G.NEAREST);
    G.texParameteri(G.TEXTURE_2D, G.TEXTURE_WRAP_S, G.CLAMP_TO_EDGE);
    G.texParameteri(G.TEXTURE_2D, G.TEXTURE_WRAP_T, G.CLAMP_TO_EDGE);
    G.uniform1i(U.uE, 0);
  };

  let pendingTex: Float32Array | null = null;
  const upload = () => {
    if (!pendingTex || !ready) return;
    G.bindTexture(G.TEXTURE_2D, tex);
    G.pixelStorei(G.UNPACK_ALIGNMENT, 4);
    G.texImage2D(G.TEXTURE_2D, 0, G.RGBA32F, grid.nx, grid.ny, 0, G.RGBA, G.FLOAT, pendingTex);
    pendingTex = null;
    hasField = true;
  };

  return {
    canvas,
    linked: linked.then((ok) => {
      if (ok) init();
      return ok;
    }),
    setField(t, g) {
      grid = g;
      pendingTex = t;
      upload();
    },
    setGrade(g, k, nh, labels = []) {
      grade = g;
      nLab = Math.min(6, labels.length);
      lb.fill(0);
      labels.slice(0, 6).forEach((l, i) => lb.set([l.x, l.y, 26], i * 3));
      keep = k.slice(0, 10);
      nHead = nh;
      kb.fill(0);
      keep.forEach((r, i) => kb.set([r.x, r.y, r.x + r.w, r.y + r.h], i * 4));
    },
    size(w, h, d) {
      W = w;
      H = h;
      dpr = d;
      look = lookFor(d);
      const cw = Math.round(w * d);
      const ch = Math.round(h * d);
      if (canvas.width !== cw) canvas.width = cw;
      if (canvas.height !== ch) canvas.height = ch;
    },
    draw(s) {
      if (!ready || isLost || !grade) return;
      upload();
      if (!hasField) return;
      G.viewport(0, 0, canvas.width, canvas.height);
      G.uniform4f(U.uGrid, grid.x0, grid.y0, 1 / grid.step, grid.step);
      G.uniform2i(U.uGN, grid.nx, grid.ny);
      G.uniform2f(U.uView, W, H);
      G.uniform1f(U.uDpr, dpr);
      const p = grade.pad;
      G.uniform4f(U.uPad, p.x + p.w / 2, p.y + p.h / 2, p.w / 2, p.h / 2);
      G.uniform1f(U.uPadR, p.r);
      G.uniform3f(U.uSlope, grade.cut, grade.fill, grade.k);
      G.uniform3f(U.uFront, s.front, s.band, s.entrance ? 1 : 0);
      G.uniform4fv(U.uKeep, kb);
      G.uniform1i(U.uNKeep, keep.length);
      G.uniform1i(U.uNHead, nHead);
      G.uniform1f(U.uKeepFoot, s.keepFoot ?? 1);
      G.uniform3fv(U.uInkN, look.inkN);
      G.uniform3fv(U.uInkP, look.inkP);
      G.uniform4fv(U.uW, look.w);
      G.uniform4fv(U.uO, look.o);
      const c = s.cursor;
      G.uniform4f(U.uCur, c?.x ?? 0, c?.y ?? 0, c?.dx ?? 0, c?.dy ?? 0);
      G.uniform1f(U.uCurR, c && c.r > 0 ? c.r : 0);
      G.uniform3fv(U.uLab, lb);
      G.uniform1i(U.uNLab, nLab);
      G.drawArrays(G.TRIANGLES, 0, 3);
    },
    lost: () => isLost,
    destroy() {
      try {
        G.getExtension("WEBGL_lose_context")?.loseContext();
      } catch {
        /* gone already */
      }
      canvas.remove();
    },
  };
}

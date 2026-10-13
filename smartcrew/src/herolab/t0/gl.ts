// t0 · the desktop ground: one WebGL2 fragment shader draws the contour plan straight from the
// height field, so the grading is a true field morph, H = E + w(p, t)·(G − E): the lines themselves
// slide aside and bunch into the cut and fill slopes. No CPU contouring per frame.
//
// - E (the existing ground) comes in as a texture from the worker (./terrain.ts: value, gradient
//   and the arc length along its own contours, on a 2 px grid). G (the graded surface: the level
//   pad (a smooth union of rounded boxes), 2:1 cut and 3:1 fill slopes from a softened edge, the
//   daylight creases) is computed per pixel with its gradient (dual numbers), so every line's
//   width is exact: distance to the nearest isoline = |A − round(A)| / |∇A|.
// - The existing ground inside the grading limits is dashed (5 on, 4 off, from the arc channel)
//   until it is graded, then solid: the dashes ride the very lines that move.
// - Every 5th level is an index contour. Proposed lines are a touch darker than natural ground and
//   drop to 70% near the pad's edge. Ink only, never orange.
// - It renders on demand: the entrance, the cursor's push while it moves, a resize, a lost context.
//   At rest the canvas is a still bitmap (no rAF, no re-render): two frames 500 ms apart are
//   pixel-identical.
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
uniform vec4 uBox[4];    // the pad's boxes: cx, cy, half w, half h (css)
uniform vec4 uBoxR;      // their corner radii
uniform int uNBox;
uniform float uPadK;     // smooth-union width (css px)
uniform vec3 uSlope;     // cut, fill (ft per px), k (ft)
uniform vec4 uPass;      // front (css px along the pass axis), band, entrance (1) / rest (0), mode
uniform vec2 uDir;       // the pass's direction (modes 0 and 2)
uniform vec4 uLag;       // mode 2: lag, q at the lead edge, 1 / q span, schedule power
uniform vec4 uKeep[10];  // halo boxes: x0, y0, x1, y1 (css)
uniform int uNKeep;
uniform int uNHead;      // the first uNHead boxes always break the lines (the header)
uniform float uKeepFoot; // the rest (the foot row) fade in with it
uniform vec3 uInkN;      // natural ink
uniform vec3 uInkP;      // proposed ink
uniform vec4 uW;         // css widths: nat int, nat idx, pro int, pro idx
uniform vec4 uO;         // opacities: nat int, nat idx, pro int, pro idx
uniform vec2 uEx;        // existing ground (dashed): css width, opacity
uniform vec4 uCur;       // cursor x, y, push dx, dy (css)
uniform float uCurR;     // cursor radius
uniform vec3 uLab[6];    // the index labels (x, y, half length): the push leaves their lines alone
uniform int uNLab;
out vec4 o;

vec4 tx(ivec2 i) { return texelFetch(uE, clamp(i, ivec2(0), uGN - 1), 0); }
vec4 sampleE(vec2 p, out float arcOk) {
  vec2 f = (p - uGrid.xy) * uGrid.z;
  vec2 i0 = floor(f);
  vec2 t = f - i0;
  ivec2 i = ivec2(i0);
  vec4 a = tx(i), b = tx(i + ivec2(1, 0)), c = tx(i + ivec2(0, 1)), d = tx(i + ivec2(1, 1));
  float lo = min(min(a.w, b.w), min(c.w, d.w));
  float hi = max(max(a.w, b.w), max(c.w, d.w));
  arcOk = (lo >= 0.0 && hi - lo < 12.0) ? 1.0 : 0.0;
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

// signed distance to a rounded box and its gradient
vec3 sdBox(vec2 p, vec4 B, float R) {
  vec2 hs = B.zw;
  float r = min(R, min(hs.x, hs.y));
  vec2 dp = p - B.xy;
  vec2 sg = vec2(dp.x < 0.0 ? -1.0 : 1.0, dp.y < 0.0 ? -1.0 : 1.0);
  vec2 q = abs(dp) - (hs - r);
  if (q.x > 0.0 && q.y > 0.0) { float L = length(q); return vec3(L - r, sg * q / L); }
  if (q.x > q.y) return vec3(q.x - r, sg.x, 0.0);
  return vec3(q.y - r, 0.0, sg.y);
}
// the pad: the smooth union of its boxes
vec3 sdPad(vec2 p) {
  vec3 d = sdBox(p, uBox[0], uBoxR.x);
  if (uNBox > 1) d = dmin(d, sdBox(p, uBox[1], uBoxR.y), uPadK);
  if (uNBox > 2) d = dmin(d, sdBox(p, uBox[2], uBoxR.z), uPadK);
  if (uNBox > 3) d = dmin(d, sdBox(p, uBox[3], uBoxR.w), uPadK);
  return d;
}

void main() {
  vec2 p = vec2(gl_FragCoord.x, uView.y * uDpr - gl_FragCoord.y) / uDpr;
  vec3 D = sdPad(p);
  float arcOk;
  vec4 Es = sampleE(p, arcOk);
  vec3 E = Es.xyz;
  float arc = Es.w;
  // the graded surface
  // (the slopes start from a softened edge, Ds = softplus(D): a rounded top of cut and toe of
  // fill, so no contour ever kinks at the pad's edge while it moves)
  float sq = sqrt(D.x * D.x + 100.0);
  vec3 Ds = vec3(0.5 * (D.x + sq), 0.5 * (1.0 + D.x / sq) * D.yz);
  vec3 G = dmax(dmin(E, uSlope.x * Ds, uSlope.z), -uSlope.y * Ds, uSlope.z);
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
      float ok2;
      vec3 Ed = sampleE(p - uCur.zw * f, ok2).xyz;
      E = mix(E, Ed, nat);
      G = mix(G, Ed, nat);
    }
  }
  // the pass: w = 1 where the ground is graded, 0 where it is still the existing ground.
  // mode 0: a front along uDir; mode 1: from deep inside the pad outward (q = D); mode 2: everywhere at once
  float w = 1.0;
  vec2 dw = vec2(0.0);
  if (uPass.z > 0.5) {
    if (uPass.w > 1.5) {
      // the whole site levels at once, the uphill (lead) side a little ahead: progress x runs
      // later along uDir, and the relief left, R = (1 − x^1.5)^k, falls fast and settles softly
      float q01 = clamp((dot(p, uDir) - uLag.y) * uLag.z, 0.0, 1.0);
      float L = uLag.x;
      float x = clamp((uPass.x - L * q01) / (1.0 - L), 0.0, 1.0);
      float xs = pow(x, 1.5);
      float R = pow(1.0 - xs, uLag.w);
      w = 1.0 - R;
      if (x > 0.0 && x < 1.0 && q01 > 0.0 && q01 < 1.0) {
        float dRdx = -uLag.w * pow(1.0 - xs, uLag.w - 1.0) * 1.5 * sqrt(x);
        dw = -dRdx * (-L / (1.0 - L)) * uLag.z * uDir;
      }
    } else {
      float q = uPass.w > 0.5 ? D.x : dot(p, uDir);
      vec2 dq = uPass.w > 0.5 ? D.yz : uDir;
      float u = clamp((q - (uPass.x - 0.5 * uPass.y)) / uPass.y, 0.0, 1.0);
      w = 1.0 - u * u * (3.0 - 2.0 * u);
      dw = (u > 0.0 && u < 1.0) ? -6.0 * u * (1.0 - u) / uPass.y * dq : vec2(0.0);
    }
  }
  vec3 H = mix(E, G, w);
  H.yz += (G.x - E.x) * dw;
  float A = H.x + 1240.5;
  float n = floor(A + 0.5);
  float g = max(length(H.yz), 1e-5);
  float dist = abs(A - n) / g * uDpr;
  bool idx = abs(mod(n, 5.0)) < 0.5;
  // proposed: graded and inside the grading limits; existing: inside the limits, not yet graded
  float pro = lim * w;
  float ex = lim * (1.0 - w);
  float wid = mix(idx ? uW.y : uW.x, idx ? uW.w : uW.z, pro);
  float op = mix(idx ? uO.y : uO.x, idx ? uO.w : uO.z, pro);
  wid = mix(wid, idx ? uEx.x * 1.3 : uEx.x, ex);
  op = mix(op, idx ? uEx.y * 1.25 : uEx.y, ex);
  wid *= uDpr;
  vec3 ink = mix(uInkN, uInkP, pro);
  // near the pad's edge the slope lines step back, so they never buzz against the type
  op *= mix(1.0, mix(0.7, 1.0, smoothstep(0.0, 40.0, D.x)), lim);
  // the existing ground is dashed (5 on, 4 off) along its own lines, until the pass grades it
  float dash = 1.0;
  if (ex > 0.001 && arcOk > 0.5) {
    float ph = mod(arc, 9.0);
    float dd = ph < 5.0 ? min(ph, 5.0 - ph) : -min(ph - 5.0, 9.0 - ph);
    dash = mix(1.0, clamp(dd * uDpr + 0.5, 0.0, 1.0), smoothstep(0.35, 0.85, ex));
  }
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
  float a = cov * op * keep * dash;
  o = vec4(ink * a, a);
}`;

export type Look = {
  /** css px widths: natural intermediate / index, proposed intermediate / index */
  w: [number, number, number, number];
  o: [number, number, number, number];
  /** existing ground (dashed, the entrance only): css width, opacity */
  ex: [number, number];
  inkN: [number, number, number];
  inkP: [number, number, number];
};

const hex = (h: string): [number, number, number] => [parseInt(h.slice(1, 3), 16) / 255, parseInt(h.slice(3, 5), 16) / 255, parseInt(h.slice(5, 7), 16) / 255];

/** The plan's weights (CONCEPTS §2.4): at DPR 1 index and intermediate differ by opacity, not width. */
export function lookFor(dpr: number): Look {
  const hi = dpr >= 1.5;
  return {
    w: hi ? [0.6, 1.05, 0.6, 1.05] : [1, 1, 1, 1],
    o: hi ? [0.22, 0.4, 0.24, 0.42] : [0.18, 0.36, 0.2, 0.38],
    ex: hi ? [0.75, 0.34] : [1, 0.3],
    inkN: hex("#74665a"),
    inkP: hex("#4a4038"),
  };
}

/** How the pass runs: 0 = a soft front along `dir`, 1 = from deep inside the pad outward, 2 = the whole site at once, the lead side ahead (`lag`). */
export type PassMode = 0 | 1 | 2;

export type GLGround = {
  canvas: HTMLCanvasElement;
  /** resolves true once the program has linked (never blocks: parallel compile, or a late check) */
  linked: Promise<boolean>;
  setField(tex: Float32Array, grid: { x0: number; y0: number; step: number; nx: number; ny: number }): void;
  setGrade(g: Grade, keep: Rect[], nHead: number, labels?: { x: number; y: number }[]): void;
  size(W: number, H: number, dpr: number): void;
  /** front: the grading front (css px along the pass, or 0…1 in mode 2); band: its soft width; entrance: false = the rest frame */
  draw(s: { front: number; band: number; entrance: boolean; mode?: PassMode; dir?: [number, number]; lag?: [number, number, number, number]; keepFoot?: number; cursor?: { x: number; y: number; dx: number; dy: number; r: number } }): void;
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
    for (const n of ["uE", "uGrid", "uGN", "uView", "uDpr", "uBox", "uBoxR", "uNBox", "uPadK", "uSlope", "uPass", "uDir", "uLag", "uKeep", "uNKeep", "uNHead", "uKeepFoot", "uInkN", "uInkP", "uW", "uO", "uEx", "uCur", "uCurR", "uLab", "uNLab"])
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
      const parts = p.parts && p.parts.length ? p.parts.slice(0, 4) : [p];
      const bx = new Float32Array(16);
      const br = new Float32Array(4);
      parts.forEach((b, i) => {
        bx.set([b.x + b.w / 2, b.y + b.h / 2, b.w / 2, b.h / 2], i * 4);
        br[i] = b.r;
      });
      G.uniform4fv(U.uBox, bx);
      G.uniform4fv(U.uBoxR, br);
      G.uniform1i(U.uNBox, parts.length);
      G.uniform1f(U.uPadK, p.k ?? 40);
      G.uniform3f(U.uSlope, grade.cut, grade.fill, grade.k);
      G.uniform4f(U.uPass, s.front, s.band, s.entrance ? 1 : 0, s.mode ?? 0);
      G.uniform2f(U.uDir, s.dir?.[0] ?? 1, s.dir?.[1] ?? 0);
      G.uniform4f(U.uLag, s.lag?.[0] ?? 0, s.lag?.[1] ?? 0, s.lag?.[2] ?? 1, s.lag?.[3] ?? 5);
      G.uniform4fv(U.uKeep, kb);
      G.uniform1i(U.uNKeep, keep.length);
      G.uniform1i(U.uNHead, nHead);
      G.uniform1f(U.uKeepFoot, s.keepFoot ?? 1);
      G.uniform3fv(U.uInkN, look.inkN);
      G.uniform3fv(U.uInkP, look.inkP);
      G.uniform4fv(U.uW, look.w);
      G.uniform4fv(U.uO, look.o);
      G.uniform2fv(U.uEx, look.ex);
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

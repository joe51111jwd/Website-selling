// Two passes. The backdrop is a slow, domain-warped ink field with a page grid, drawn at half
// resolution into a mipmapped texture. The composite pass draws that backdrop and then every
// glass shape on top of it: rounded panels taken from the page, a liquid droplet that follows
// the cursor and merges into them, and glass lettering cut from a text atlas. Glass bends the
// backdrop at its edges (strongest at the rim, flat in the middle), frosts it by sampling a
// blurrier mip level, splits colour slightly, and catches a rim of light facing the cursor.

export const MAX_RECTS = 40;
export const MAX_TEXTS = 6;

export const VERT = /* glsl */ `#version 300 es
in vec2 aPos;
out vec2 vUv;
void main() {
  vUv = aPos * 0.5 + 0.5;
  gl_Position = vec4(aPos, 0.0, 1.0);
}`;

export const BACK_FRAG = /* glsl */ `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 o;
uniform vec2 uRes;      // viewport, CSS px
uniform float uTime;
uniform float uScroll;  // page scroll, CSS px
uniform vec2 uMouse;    // CSS px
uniform vec3 uBase;
uniform vec3 uVein;
uniform vec3 uGlow;

vec2 hash2(vec2 p) {
  p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
  return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(dot(hash2(i), f), dot(hash2(i + vec2(1.0, 0.0)), f - vec2(1.0, 0.0)), u.x),
    mix(dot(hash2(i + vec2(0.0, 1.0)), f - vec2(0.0, 1.0)), dot(hash2(i + vec2(1.0)), f - vec2(1.0)), u.x),
    u.y);
}

float fbm(vec2 p) {
  float a = 0.5;
  float s = 0.0;
  mat2 m = mat2(1.6, 1.2, -1.2, 1.6);
  for (int i = 0; i < 4; i++) {
    s += a * noise(p);
    p = m * p;
    a *= 0.5;
  }
  return s;
}

void main() {
  vec2 px = vec2(vUv.x, 1.0 - vUv.y) * uRes;
  vec2 q = vec2(px.x, px.y + uScroll * 0.32) / 640.0;
  float t = uTime * 0.05;

  // ink folding through water: warp the field by itself twice
  vec2 w1 = vec2(fbm(q + vec2(0.0, t)), fbm(q + vec2(5.2, 1.3) - t * 0.8));
  vec2 w2 = vec2(fbm(q + 2.6 * w1 + vec2(1.7, 9.2) + t * 0.6), fbm(q + 2.6 * w1 + vec2(8.3, 2.8) - t * 0.5));
  float f = fbm(q + 3.0 * w2) * 0.5 + 0.5;
  float swirl = length(w2);

  vec3 col = uBase;
  col = mix(col, uVein, smoothstep(0.36, 0.66, f));
  col = mix(col, uGlow, smoothstep(0.54, 0.8, f) * smoothstep(0.1, 0.45, swirl));
  col += vec3(0.98, 0.94, 0.88) * pow(smoothstep(0.7, 0.93, f), 2.0) * 0.55;

  // a pool of light under the cursor
  float md = length((px - uMouse) / 560.0);
  col += uGlow * 0.12 * exp(-md * md * 3.0);

  // a faint broadsheet grid that scrolls with the page; glass bends it, which shows the lensing
  vec2 gp = px + vec2(0.0, uScroll);
  vec2 gd = abs(mod(gp, 96.0) - 48.0);
  float line = max(smoothstep(46.9, 47.9, gd.x), smoothstep(46.9, 47.9, gd.y));
  col = mix(col, vec3(0.96, 0.93, 0.88), line * 0.075);

  vec2 v = vUv - 0.5;
  col *= 1.0 - 0.38 * dot(v, v) * 1.6;
  o = vec4(col, 1.0);
}`;

export const COMP_FRAG = /* glsl */ `#version 300 es
precision highp float;
#define MAXR ${MAX_RECTS}
#define MAXT ${MAX_TEXTS}
in vec2 vUv;
out vec4 o;

uniform sampler2D uBack;
uniform sampler2D uAtlas;
uniform vec2 uRes;
uniform float uDpr;
uniform vec2 uLight;            // direction towards the light, screen space (y down)

uniform int uCount;
uniform vec4 uRect[MAXR];       // x, y, w, h in CSS px
uniform vec4 uParam[MAXR];      // corner radius, frost (mip level), bezel width, refraction
uniform vec4 uTint[MAXR];       // rgb, amount

uniform vec4 uDrop;             // x, y, radius, stretch
uniform vec2 uDropDir;

uniform int uTextCount;
uniform vec4 uTRect[MAXT];      // where the slot lands on screen, CSS px
uniform vec4 uTUV[MAXT];        // the slot in the atlas, uv
uniform vec4 uTClip[MAXT];      // clip rectangle, CSS px
uniform float uTAppear[MAXT];   // 0..1 as the letters condense
uniform vec2 uAtlasTexel;

vec2 uvOf(vec2 p) { return vec2(p.x / uRes.x, 1.0 - p.y / uRes.y); }
vec3 back(vec2 p, float lod) { return textureLod(uBack, uvOf(p), lod).rgb; }

// colour splits a little along the direction the glass bends the light
vec3 backSplit(vec2 p, vec2 off, float lod) {
  return vec3(back(p + off * 1.12, lod).r, back(p + off, lod).g, back(p + off * 0.88, lod).b);
}

// rounded box: signed distance and outward normal
vec3 sdg(vec2 p, vec2 b, float r) {
  vec2 s = vec2(p.x < 0.0 ? -1.0 : 1.0, p.y < 0.0 ? -1.0 : 1.0);
  vec2 w = abs(p) - b + r;
  float g = max(w.x, w.y);
  vec2 q = max(w, 0.0);
  float l = length(q);
  vec2 n = g > 0.0 ? q / max(l, 1e-4) : (w.x > w.y ? vec2(1.0, 0.0) : vec2(0.0, 1.0));
  return vec3((g > 0.0 ? l : g) - r, s * n);
}

// keep glass dark enough under ivory text, whatever is behind it
vec3 capLight(vec3 c, float cap) {
  float lum = dot(c, vec3(0.2126, 0.7152, 0.0722));
  return lum > cap ? c * (cap / lum) : c;
}

void main() {
  vec2 p = vec2(gl_FragCoord.x, uRes.y * uDpr - gl_FragCoord.y) / uDpr;
  vec3 col = back(p, 0.0);

  // ---- panels: the topmost one containing this pixel, or else the nearest ----
  float d = 1e4;
  vec2 n = vec2(0.0);
  int ib = -1;
  bool inside = false;
  float shade = 0.0;
  for (int i = 0; i < MAXR; i++) {
    if (i >= uCount) break;
    vec4 r = uRect[i];
    vec2 hb = r.zw * 0.5;
    vec2 c = r.xy + hb;
    float rad = min(uParam[i].x, min(hb.x, hb.y));
    vec3 e = sdg(p - c, hb, rad);
    float ds = sdg(p - c - vec2(0.0, 16.0), hb, rad).x;
    shade = max(shade, (1.0 - smoothstep(-26.0, 40.0, ds)) * 0.46);
    if (e.x < 0.0) {
      if (!inside || i > ib) { inside = true; ib = i; d = e.x; n = e.yz; }
    } else if (!inside && e.x < d) {
      d = e.x; n = e.yz; ib = i;
    }
  }

  // ---- the droplet under the cursor melts into nearby glass ----
  float drop = 0.0;
  if (uDrop.z > 0.5) {
    vec2 dp = p - uDrop.xy;
    vec2 dir = uDropDir;
    vec2 perp = vec2(-dir.y, dir.x);
    vec2 lp = vec2(dot(dp, dir) / (1.0 + uDrop.w), dot(dp, perp) * (1.0 + uDrop.w * 0.35));
    float dd = length(lp) - uDrop.z;
    vec2 nd = dp / max(length(dp), 1e-3);
    float k = 38.0;
    float h = clamp(0.5 + 0.5 * (dd - d) / k, 0.0, 1.0);
    float du = mix(dd, d, h) - k * h * (1.0 - h);
    n = normalize(mix(nd, n, h) + 1e-5);
    drop = ib < 0 ? 1.0 : 1.0 - h;
    d = du;
  }

  col *= 1.0 - shade;

  if (d < 1.5) {
    vec4 par = ib >= 0 ? uParam[ib] : vec4(0.0, 0.6, 24.0, 1.0);
    vec4 tn = ib >= 0 ? uTint[ib] : vec4(1.0, 1.0, 1.0, 0.0);
    float frost = mix(par.y, 0.3, drop);
    float refr = mix(par.w, 1.7, drop);
    float tint = mix(tn.a, 0.0, drop);
    float bezel = mix(par.z, 30.0, drop);

    float t = clamp(-d / bezel, 0.0, 1.0);
    float edge = pow(1.0 - t, 2.0);
    vec2 off = -n * edge * 36.0 * refr;

    vec3 g = backSplit(p, off, frost);
    g = mix(g, tn.rgb, tint);
    g = g * 1.05 + 0.018;
    g = capLight(g, 0.33);
    // the droplet carries no text, so it can be a bright lens
    g = mix(g, backSplit(p, off, 0.0) * 1.3 + 0.05, drop);

    float facing = dot(n, uLight);
    float rim = 1.0 - smoothstep(0.0, 1.7, -d);
    g += rim * (0.1 + 0.6 * pow(max(facing, 0.0), 2.0) + 0.2 * pow(max(-facing, 0.0), 3.0));
    g += edge * edge * 0.2 * max(facing, 0.0);
    // a soft sheen across the upper part of tall glass
    g += 0.03 * smoothstep(0.0, 1.0, t) * smoothstep(0.6, -0.4, n.y) * (1.0 - drop);

    float cov = 1.0 - smoothstep(-0.65, 0.65, d);
    col = mix(col, g, cov);
  }

  // ---- glass lettering ----
  for (int i = 0; i < MAXT; i++) {
    if (i >= uTextCount) break;
    vec4 cl = uTClip[i];
    if (p.x < cl.x || p.y < cl.y || p.x > cl.x + cl.z || p.y > cl.y + cl.w) continue;
    vec4 tr = uTRect[i];
    vec2 lp = (p - tr.xy) / tr.zw;
    if (lp.x < 0.0 || lp.y < 0.0 || lp.x > 1.0 || lp.y > 1.0) continue;
    vec2 auv = uTUV[i].xy + lp * uTUV[i].zw;
    vec3 m = texture(uAtlas, auv).rgb;
    float a = uTAppear[i];

    // the letters condense out of a blur as they appear
    float field = mix(m.b * 1.15, m.r, smoothstep(0.3, 1.0, a));
    float thr = mix(0.9, 0.5, a);
    float cov = smoothstep(thr - 0.05, thr + 0.05, field) * step(0.001, a);

    float sh = texture(uAtlas, auv - vec2(0.0, 7.0 * uAtlasTexel.y)).b;
    col *= 1.0 - 0.3 * sh * (1.0 - cov) * a;

    if (cov > 0.0) {
      vec2 tx = vec2(uAtlasTexel.x * 1.5, 0.0);
      vec2 ty = vec2(0.0, uAtlasTexel.y * 1.5);
      vec2 gr = vec2(texture(uAtlas, auv + tx).g - texture(uAtlas, auv - tx).g,
                     texture(uAtlas, auv + ty).g - texture(uAtlas, auv - ty).g);
      float steep = clamp(length(gr) * 4.0, 0.0, 1.0);
      vec2 nn = -gr / max(length(gr), 1e-4);
      vec2 off = gr * 230.0 * a;
      // light passes through: the backdrop shows, magnified and brighter, with a little white in the body
      vec3 g = backSplit(p, off, 0.25) * 1.4 + 0.06;
      g += (1.0 - steep) * vec3(0.05, 0.045, 0.04);
      float facing = dot(nn, uLight);
      g += steep * (0.1 + 0.95 * pow(max(facing, 0.0), 2.5));
      g *= 1.0 - 0.28 * steep * max(-facing, 0.0);
      col = mix(col, g, cov);
    }
  }

  o = vec4(col, 1.0);
}`;

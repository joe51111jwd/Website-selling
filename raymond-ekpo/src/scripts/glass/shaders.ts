// Two full-screen passes.
//
// WORLD draws everything that sits under the glass: ivory paper with a fine grain and soft window
// light, the ink from the fluid simulation (coloured by how much light it absorbs, so thin ink is
// rose and thick ink is oxblood), dark sections where the same ink glows in black water, caustic
// light in a few places, and the slide that the lens rewrites. It renders into a mipmapped texture.
//
// GLASS draws that texture to the screen and then the glass on top: rounded panels and buttons
// from the page, lettering from a distance-field atlas, and the lens. Each surface is a convex
// squircle bevel. Light that passes through it is bent by Snell's law (separately for red, green
// and blue), frosted by reading a blurrier mip level, tinted, and lit: a Fresnel reflection of a
// soft studio, a key light from the upper left and a second light that follows the cursor.

export const MAX_RECTS = 32;
export const MAX_TEXTS = 6;
export const MAX_ZONES = 4;

const COMMON = /* glsl */ `
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
}
// distance to a rounded box centred on the origin; negative inside
float sdBox(vec2 q, vec2 hb, float r) {
  vec2 d = abs(q) - hb + r;
  return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0) - r;
}
`;

export const WORLD_FRAG = /* glsl */ `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 o;

uniform vec2 uRes;
uniform float uScroll;
uniform float uTime;
uniform sampler2D uDye;
uniform vec2 uDomain;      // margin above the viewport, domain height (CSS px)
uniform vec2 uDyeTexel;
uniform float uInk;

uniform vec4 uDark[${MAX_ZONES}];
uniform int uDarkN;
uniform vec4 uLight[${MAX_ZONES}];
uniform int uLightN;
uniform vec4 uInkZone[${MAX_ZONES}];
uniform int uInkZoneN;
uniform float uInkZoned;

uniform sampler2D uSlideA;
uniform sampler2D uSlideB;
uniform vec4 uSlide;       // x, y, w, h (CSS px)
uniform float uSlideOn;
uniform vec4 uLens;        // x, y, r, on
uniform vec4 uWipe[4];     // line bands in slide uv: x0, y0, x1, y1
uniform float uWipeX[4];   // how far along each band the rewrite has reached

${COMMON}

// light through moving water, after joltz0r's "water turbulence": tiles every unit of uv
float caustic(vec2 uv, float t) {
  vec2 p = mod(uv * 6.28318, 6.28318) - 250.0;
  vec2 i = p;
  float c = 1.0;
  for (int n = 0; n < 5; n++) {
    float tt = t * (1.0 - 3.5 / float(n + 1));
    i = p + vec2(cos(tt - i.x) + sin(tt + i.y), sin(tt - i.y) + cos(tt + i.x));
    c += 1.0 / length(vec2(p.x / (sin(i.x + tt) / 0.005), p.y / (cos(i.y + tt) / 0.005)));
  }
  c /= 5.0;
  c = 1.17 - pow(c, 1.4);
  return clamp(pow(abs(c), 8.0), 0.0, 1.0);
}

float band(vec4 r, vec2 px, float feather) {
  vec2 a = smoothstep(r.xy - feather, r.xy + feather, px);
  vec2 b = smoothstep(r.xy + r.zw + feather, r.xy + r.zw - feather, px);
  return a.x * a.y * b.x * b.y;
}

void main() {
  vec2 px = vec2(vUv.x, 1.0 - vUv.y) * uRes;
  vec2 page = px + vec2(0.0, uScroll);
  vec2 uv = px / uRes;

  // paper: warm ivory, a soft window light from the upper left, grain and faint fibres fixed to the page
  vec3 paper = vec3(0.953, 0.934, 0.899);
  float light = 1.012 - 0.05 * length((uv - vec2(0.18, -0.05)) * vec2(0.75, 1.0));
  float grain = hash(floor(page * 1.3)) - 0.5;
  float fibre = noise(page * vec2(0.012, 0.21)) - 0.5;
  vec3 col = paper * light + grain * 0.010 + fibre * 0.007;

  // ink, read from the fluid in domain coordinates
  vec2 duv = vec2(uv.x, 1.0 - (px.y + uDomain.x) / uDomain.y);
  // ink only shows inside the zones the page sets aside for it, fading at their edges
  float zone = uInkZoned > 0.0 ? 0.0 : 1.0;
  for (int i = 0; i < ${MAX_ZONES}; i++) {
    if (i >= uInkZoneN) break;
    zone = max(zone, band(uInkZone[i], px, 70.0));
  }
  vec4 ink = texture(uDye, duv) * uInk * zone;
  float dr = max(ink.r, 0.0);
  float dk = max(ink.g, 0.0);
  // the folds catch the window light
  float ix = texture(uDye, duv + vec2(uDyeTexel.x, 0.0)).r - texture(uDye, duv - vec2(uDyeTexel.x, 0.0)).r;
  float iy = texture(uDye, duv + vec2(0.0, uDyeTexel.y)).r - texture(uDye, duv - vec2(0.0, uDyeTexel.y)).r;
  float fold = clamp(dot(vec2(ix, iy), vec2(-0.6, 0.8)) * uInk * zone, -0.6, 0.6);
  vec3 absorb = vec3(0.5, 2.3, 2.5) * dr + vec3(1.35, 1.45, 1.55) * dk;
  vec3 inked = col * exp(-absorb) * (1.0 + fold * 0.22);

  // dark sections: the same ink, lit from inside black water
  float dark = 0.0;
  for (int i = 0; i < ${MAX_ZONES}; i++) {
    if (i >= uDarkN) break;
    dark = max(dark, band(uDark[i], px, 90.0));
  }
  if (dark > 0.0) {
    vec3 deep = vec3(0.052, 0.040, 0.036) + vec3(0.07, 0.035, 0.025) * (1.0 - uv.y);
    deep += (hash(floor(page * 1.3)) - 0.5) * 0.008;
    float glowA = 1.0 - exp(-dr * 1.5);
    vec3 glow = vec3(0.46, 0.065, 0.05) * glowA + vec3(0.95, 0.42, 0.3) * pow(glowA, 3.0) * 0.32;
    glow *= 1.0 + fold * 0.6;
    col = mix(inked, deep + glow, dark);
  } else {
    col = inked;
  }

  // caustic light where the page asks for it
  float lit = 0.0;
  for (int i = 0; i < ${MAX_ZONES}; i++) {
    if (i >= uLightN) break;
    lit = max(lit, band(uLight[i], px, 160.0));
  }
  if (lit > 0.0) {
    float c = caustic(page / 520.0, uTime * 0.16);
    col *= 1.0 - 0.03 * lit;
    col += vec3(1.0, 0.88, 0.7) * c * 0.11 * lit;
  }

  // the slide on the lens table
  if (uSlideOn > 0.0) {
    vec2 hb = uSlide.zw * 0.5;
    vec2 q = px - (uSlide.xy + hb);
    float rad = min(hb.x, hb.y) * 0.035;
    float sh = sdBox(q - vec2(0.0, 22.0), hb, rad);
    col *= 1.0 - 0.13 * (1.0 - smoothstep(-30.0, 50.0, sh)) * uSlideOn;
    float ct = sdBox(q - vec2(0.0, 2.0), hb, rad);
    col *= 1.0 - 0.10 * (1.0 - smoothstep(-2.0, 4.0, ct)) * uSlideOn;
    float d = sdBox(q, hb, rad);
    if (d < 1.0) {
      vec2 sp = clamp((px - uSlide.xy) / uSlide.zw, 0.0, 1.0);
      float a = 0.0;
      if (uLens.w > 0.0) a = smoothstep(1.0, -1.0, length(px - uLens.xy) - uLens.z);
      for (int i = 0; i < 4; i++) {
        vec4 b = uWipe[i];
        if (sp.y > b.y && sp.y < b.w && sp.x > b.x && sp.x < b.z) a = max(a, smoothstep(uWipeX[i] + 0.002, uWipeX[i] - 0.002, sp.x));
      }
      vec3 s = mix(texture(uSlideA, sp).rgb, texture(uSlideB, sp).rgb, a);
      col = mix(col, s, smoothstep(0.75, -0.75, d) * uSlideOn);
    }
  }

  o = vec4(col, 1.0);
}`;

export const GLASS_FRAG = /* glsl */ `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 o;

uniform sampler2D uScene;
uniform vec2 uRes;
uniform float uDpr;
uniform float uTime;
uniform vec3 uCursor;      // x, y, on

uniform int uCount;
uniform vec4 uRect[${MAX_RECTS}];   // x, y, w, h
uniform vec4 uShape[${MAX_RECTS}];  // radius, bezel, thickness, frost
uniform vec4 uTint[${MAX_RECTS}];   // rgb, amount
uniform vec4 uFx[${MAX_RECTS}];     // magnify, opacity, shadow, bend

uniform int uTextN;
uniform sampler2D uAtlas;
uniform vec2 uAtlasTexel;
uniform vec4 uTRect[${MAX_TEXTS}];  // slot on screen
uniform vec4 uTUV[${MAX_TEXTS}];    // slot in the atlas
uniform vec4 uTClip[${MAX_TEXTS}];
uniform vec4 uTFx[${MAX_TEXTS}];    // range, bezel, appear, dark

uniform vec4 uLens;        // x, y, r, on
uniform float uLensMag;

${COMMON}

vec3 scene(vec2 p, float lod) {
  return textureLod(uScene, vec2(p.x / uRes.x, 1.0 - p.y / uRes.y), lod).rgb;
}

vec3 frosted(vec2 p, float lod) {
  if (lod < 0.6) return scene(p, lod);
  // five taps a little further apart than the mip level, so frost reads smooth, not blocky
  float r = exp2(lod - 1.0) / uDpr;
  float l = lod - 0.8;
  return (scene(p, l) * 2.0 + scene(p + vec2(r, r * 0.4), l) + scene(p - vec2(r, r * 0.4), l)
    + scene(p + vec2(-r * 0.4, r), l) + scene(p + vec2(r * 0.4, -r), l)) / 6.0;
}

struct Glass {
  float s;      // depth inside the edge, CSS px
  vec2 n;       // outward normal of the outline
  vec2 c;       // centre, for magnification
  float bezel;
  float thick;
  float frost;
  vec4 tint;
  float mag;
  float bend;   // extra refraction, for effect
  float env;    // how much of the room the rims reflect
  float dark;   // 1 in black water: a dark room, brighter highlights
  float alpha;
};

const vec3 KEY = vec3(-0.46, -0.78, 0.42);

vec3 shade(vec2 p, Glass g, vec3 under) {
  float t = clamp(g.s / max(g.bezel, 0.001), 0.0, 1.0);
  float u = 1.0 - t;
  float u4 = u * u * u * u;
  float h = pow(max(1.0 - u4, 0.0), 0.25);
  float dh = u * u * u * pow(max(1.0 - u4, 1e-3), -0.75);
  float slope = min(dh * g.thick / max(g.bezel, 0.001), 9.0);
  vec3 N = normalize(vec3(g.n * slope, 1.0));
  float z = g.thick * (h + 0.2);

  vec2 base = g.c + (p - g.c) / g.mag;
  vec3 I = vec3(0.0, 0.0, -1.0);
  vec3 rr = refract(I, N, 1.0 / 1.46);
  vec3 rg = refract(I, N, 1.0 / 1.50);
  vec3 rb = refract(I, N, 1.0 / 1.55);
  float k = z * g.bend;
  vec2 oR = rr.xy / max(-rr.z, 0.25) * k;
  vec2 oG = rg.xy / max(-rg.z, 0.25) * k;
  vec2 oB = rb.xy / max(-rb.z, 0.25) * k;
  float lod = g.frost + (1.0 - t) * 0.6 * step(0.5, g.frost);
  vec3 col = vec3(frosted(base + oR, lod).r, frosted(base + oG, lod).g, frosted(base + oB, lod).b);

  col = mix(col, g.tint.rgb, g.tint.a);

  // a little warm absorption through the body of thick glass
  col *= mix(vec3(1.0), vec3(0.975, 0.962, 0.95), smoothstep(0.0, 0.6, h) * clamp(g.thick / 60.0, 0.0, 1.0));

  // Fresnel: steep rims reflect the room, which is darker than the page except towards the window
  vec3 R = reflect(I, N);
  float facing = dot(normalize(R.xy + 1e-5), normalize(KEY.xy)) * 0.5 + 0.5;
  vec3 room = mix(vec3(0.30, 0.27, 0.25), vec3(0.02, 0.015, 0.013), g.dark);
  vec3 env = mix(room, vec3(1.0, 0.985, 0.96), pow(smoothstep(0.1, 1.0, facing), mix(1.6, 3.0, g.dark)));
  // flat glass shows what's behind it; only the curved rims reflect the room
  float F = (0.02 + 0.98 * pow(1.0 - N.z, 5.0)) * smoothstep(0.02, 0.25, length(N.xy));
  col = mix(col, env, F * g.env);

  // the key light and the cursor's light
  vec3 V = vec3(0.0, 0.0, 1.0);
  float spec = pow(max(dot(N, normalize(normalize(KEY) + V)), 0.0), 70.0) * 0.75;
  // and a softer bounce from the opposite side, so rims catch light top-left and bottom-right
  spec += pow(max(dot(N, normalize(normalize(vec3(-KEY.xy, KEY.z)) + V)), 0.0), 90.0) * 0.32;
  if (uCursor.z > 0.0) {
    vec3 L = normalize(vec3(uCursor.xy - p, 360.0));
    spec += pow(max(dot(N, normalize(L + V)), 0.0), 120.0) * 1.1 * uCursor.z;
  }
  col += vec3(1.0, 0.985, 0.96) * spec * (1.0 + g.dark * 0.8);

  // a hairline at the edge so clear glass holds its shape on pale paper
  float edge = exp(-g.s * 1.1);
  float lit = max(dot(g.n, normalize(KEY.xy)), 0.0);
  col = mix(col, col * 0.78, edge * 0.55 * (1.0 - lit));
  col += vec3(1.0) * exp(-pow((g.s - 1.2) * 1.1, 2.0)) * (0.10 + 0.32 * lit);

  float cover = clamp(g.s * uDpr + 0.5, 0.0, 1.0) * g.alpha;
  return mix(under, col, cover);
}

void main() {
  vec2 p = vec2(vUv.x, 1.0 - vUv.y) * uRes;
  vec3 under = scene(p, 0.0);
  vec3 col = under;

  // ---- rounded glass from the page, drawn in order so later ones sit on top
  int top = -1;
  float shadow = 0.0;
  for (int i = 0; i < ${MAX_RECTS}; i++) {
    if (i >= uCount) break;
    vec4 r = uRect[i];
    vec2 hb = r.zw * 0.5;
    vec2 q = p - (r.xy + hb);
    if (abs(q.x) > hb.x + 70.0 || abs(q.y) > hb.y + 90.0) continue;
    float rad = min(uShape[i].x, min(hb.x, hb.y));
    float d = sdBox(q, hb, rad);
    if (d < 0.5) top = i;
    float a = uFx[i].y * uFx[i].z;
    if (a > 0.0) {
      // a wide soft shadow and a tight contact shadow
      float s1 = sdBox(q - vec2(0.0, 14.0), hb, rad);
      float s2 = sdBox(q - vec2(0.0, 3.0), hb, rad);
      shadow = max(shadow, a * (0.10 * (1.0 - smoothstep(-24.0, 46.0, s1)) + 0.07 * (1.0 - smoothstep(-3.0, 7.0, s2))));
    }
  }

  // ---- glass lettering
  int ttop = -1;
  float tS = 0.0;
  vec2 tN = vec2(0.0);
  float tshadow = 0.0;
  float tcaustic = 0.0;
  for (int i = 0; i < ${MAX_TEXTS}; i++) {
    if (i >= uTextN) break;
    vec4 r = uTRect[i];
    vec4 cl = uTClip[i];
    if (p.x < r.x || p.y < r.y || p.x > r.x + r.z || p.y > r.y + r.w) continue;
    if (p.x < cl.x || p.y < cl.y || p.x > cl.x + cl.z || p.y > cl.y + cl.w) continue;
    vec2 a = uTUV[i].xy + (p - r.xy) / r.zw * uTUV[i].zw;
    float range = uTFx[i].x;
    float d = (0.5 - texture(uAtlas, a).r) * 2.0 * range;
    float appear = uTFx[i].z;
    // shadow cast down and to the right of the letters, with light focused along its inner edge
    vec2 ao = uTUV[i].xy + (p - vec2(range * 0.08, range * 0.18) - r.xy) / r.zw * uTUV[i].zw;
    float ds = (0.5 - texture(uAtlas, ao).r) * 2.0 * range;
    float sh = appear * 0.10 * (1.0 - smoothstep(-range * 0.25, range * 0.55, ds));
    tshadow = max(tshadow, sh);
    tcaustic = max(tcaustic, appear * exp(-pow((ds + range * 0.05) / (range * 0.05), 2.0)));
    if (d < 0.6) {
      ttop = i;
      tS = -d;
      vec2 e = uAtlasTexel;
      float dx = texture(uAtlas, a + vec2(e.x, 0.0)).r - texture(uAtlas, a - vec2(e.x, 0.0)).r;
      float dy = texture(uAtlas, a + vec2(0.0, e.y)).r - texture(uAtlas, a - vec2(0.0, e.y)).r;
      tN = -normalize(vec2(dx, dy) + 1e-6);
    }
  }

  // ---- the lens
  float lensD = 1e5;
  if (uLens.w > 0.0) lensD = length(p - uLens.xy) - uLens.z;

  if (lensD < 0.6) {
    Glass g;
    g.s = -lensD;
    g.n = normalize(p - uLens.xy + 1e-5);
    g.c = uLens.xy;
    g.bezel = uLens.z * 0.3;
    g.thick = uLens.z * 0.42;
    g.frost = 0.0;
    g.tint = vec4(1.0, 0.99, 0.97, 0.0);
    g.mag = uLensMag;
    g.bend = 1.5;
    g.env = 0.9;
    g.dark = 0.0;
    g.alpha = uLens.w;
    col = shade(p, g, col);
  } else if (ttop >= 0) {
    Glass g;
    float appear = uTFx[ttop].z;
    g.s = tS;
    g.n = tN;
    g.c = p;
    g.bezel = uTFx[ttop].y * mix(0.4, 1.0, appear);
    g.thick = uTFx[ttop].y * 1.5 * appear;
    g.frost = (1.0 - appear) * 3.0;
    g.tint = uTFx[ttop].w > 0.5 ? vec4(1.0, 0.97, 0.95, 0.03) : vec4(1.0, 0.995, 0.985, 0.05);
    g.dark = uTFx[ttop].w;
    g.mag = 1.0;
    g.bend = 2.2;
    g.env = mix(0.6, 1.0, g.dark);
    g.alpha = smoothstep(0.0, 0.35, appear);
    // through the letter you see its own shadow on the paper, which gives it body
    col = shade(p, g, col * (1.0 - tshadow));
    col *= 1.0 - tshadow * 0.9 * smoothstep(0.0, 3.0, tS) * (1.0 - g.dark);
  } else if (top >= 0) {
    vec4 r = uRect[top];
    vec2 hb = r.zw * 0.5;
    vec2 c = r.xy + hb;
    vec2 q = p - c;
    float rad = min(uShape[top].x, min(hb.x, hb.y));
    float bez = min(uShape[top].y, min(hb.x, hb.y));
    float d = sdBox(q, hb, rad);
    // the bevel's slope comes from a box at least as round as the bevel is wide, so the
    // diagonals inside never show a seam
    float rn = min(max(rad, bez + 1.0), min(hb.x, hb.y));
    vec2 dq = abs(q) - hb + rn;
    vec2 n = (dq.x > 0.0 && dq.y > 0.0) ? normalize(dq) : (dq.x > dq.y ? vec2(1.0, 0.0) : vec2(0.0, 1.0));
    Glass g;
    g.s = -d;
    g.n = n * sign(q + 1e-5);
    g.c = c;
    g.bezel = bez;
    g.thick = uShape[top].z;
    g.frost = uShape[top].w;
    g.tint = uTint[top];
    g.mag = uFx[top].x;
    g.bend = uFx[top].w;
    g.env = 0.9;
    g.dark = 0.0;
    g.alpha = uFx[top].y;
    col = shade(p, g, col);
  } else {
    col *= 1.0 - max(shadow, tshadow);
    col += vec3(1.0, 0.95, 0.86) * tcaustic * 0.07;
  }

  // the lens throws a shadow and focuses a ring of light onto the page
  if (uLens.w > 0.0 && lensD >= 0.6) {
    vec2 lp = p - uLens.xy - vec2(8.0, 20.0);
    float ld = length(lp) - uLens.z * 0.96;
    col *= 1.0 - 0.11 * uLens.w * (1.0 - smoothstep(-uLens.z * 0.25, uLens.z * 0.35, ld));
    float ring = exp(-pow((length(lp) - uLens.z * 0.78) / (uLens.z * 0.06), 2.0));
    col += vec3(1.0, 0.93, 0.82) * ring * 0.08 * uLens.w;
  }

  o = vec4(col, 1.0);
}`;

/**
 * One shader draws every image and film on the site. Each plane sits exactly
 * over a DOM element and adds what CSS can't: the bend when you scroll fast,
 * the noise wipe between two pictures, and the blueprint "structure" view,
 * an edge-detected line drawing of the image, shown inside the cursor lens
 * or everywhere in Structure mode.
 */

export const vertex = /* glsl */ `
uniform float uVel;
uniform float uBend;
varying vec2 vUv;

void main() {
  vUv = uv;
  vec4 world = modelMatrix * vec4(position, 1.0);
  // the middle of the plane lags behind the scroll, like paper being pulled
  world.y -= sin(uv.x * 3.14159265) * uVel * uBend;
  gl_Position = projectionMatrix * viewMatrix * world;
}
`;

export const fragment = /* glsl */ `
precision highp float;

uniform sampler2D uTex0;
uniform sampler2D uTex1;
uniform vec2 uRes0;
uniform vec2 uRes1;
uniform float uMix;

uniform vec2 uSize;
uniform float uTime;
uniform float uHover;
uniform vec2 uMouse;
uniform float uVel;
uniform float uMotion;
uniform float uStructure;
uniform float uReveal;
uniform float uAlpha;
uniform float uPage;
uniform float uParallax;
uniform float uZoom;
uniform float uRadius;
uniform vec3 uLens;
uniform float uLensOn;
uniform vec3 uBlue;

varying vec2 vUv;

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}
float fbm(vec2 p) { return noise(p) * 0.6 + noise(p * 2.1 + 7.3) * 0.3 + noise(p * 4.3 + 1.7) * 0.1; }

// object-fit: cover, in UV space
vec2 cover(vec2 uv, vec2 res) {
  float rs = uSize.x / max(uSize.y, 1.0);
  float ri = res.x / max(res.y, 1.0);
  vec2 s = rs < ri ? vec2(rs / ri, 1.0) : vec2(1.0, ri / rs);
  return (uv - 0.5) * s + 0.5;
}

vec2 framed(vec2 uv, float zoom) {
  uv = (uv - 0.5) / zoom + 0.5;
  // parallax slides the picture inside the slack the zoom leaves
  uv.y += uParallax * (1.0 - 1.0 / zoom) * 0.5;
  return uv;
}

vec3 pick(sampler2D tex, vec2 res, vec2 uv) { return texture2D(tex, cover(uv, res)).rgb; }

// the two pictures with the wipe between them
vec3 base(vec2 uv) {
  if (uMix <= 0.001) return pick(uTex0, uRes0, uv);
  if (uMix >= 0.999) return pick(uTex1, uRes1, uv);
  float n = fbm(uv * vec2(3.0, 4.0) + 3.1);
  float field = (1.0 - uv.y) * 0.55 + n * 0.45;
  float th = 1.0 - uMix * 1.35;
  float m = smoothstep(th - 0.012, th + 0.012, field);
  // pixels near the front get dragged along with it
  float near = 1.0 - smoothstep(0.0, 0.22, abs(field - th));
  vec2 push = vec2(0.0, (n - 0.5) * 0.12 + near * 0.05);
  vec3 a = pick(uTex0, uRes0, (uv - 0.5) / (1.0 + uMix * 0.08) + 0.5 + push * uMix);
  vec3 b = pick(uTex1, uRes1, (uv - 0.5) / (1.08 - uMix * 0.08) + 0.5 - push * (1.0 - uMix));
  vec3 col = mix(a, b, m);
  // a thin blueprint line rides the front of the wipe
  float front = 1.0 - smoothstep(0.002, 0.0045, abs(field - th));
  return mix(col, uBlue, front);
}

float luma(vec2 uv) { return dot(base(uv), vec3(0.299, 0.587, 0.114)); }

// Sobel on luminance: the picture as a line drawing
float edges(vec2 uv, float zoom) {
  vec2 px = 1.1 / (uSize * zoom);
  float tl = luma(uv + px * vec2(-1.0, 1.0));
  float t = luma(uv + px * vec2(0.0, 1.0));
  float tr = luma(uv + px * vec2(1.0, 1.0));
  float l = luma(uv + px * vec2(-1.0, 0.0));
  float r = luma(uv + px * vec2(1.0, 0.0));
  float bl = luma(uv + px * vec2(-1.0, -1.0));
  float b = luma(uv + px * vec2(0.0, -1.0));
  float br = luma(uv + px * vec2(1.0, -1.0));
  float gx = -tl - 2.0 * l - bl + tr + 2.0 * r + br;
  float gy = -tl - 2.0 * t - tr + bl + 2.0 * b + br;
  return length(vec2(gx, gy));
}

void main() {
  vec2 uv = vUv;
  vec2 px = vUv * uSize;

  // rounded corners
  vec2 q = abs(px - uSize * 0.5) - uSize * 0.5 + uRadius;
  float corner = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - uRadius;
  float alpha = 1.0 - smoothstep(-0.75, 0.75, corner);

  // reveal: the picture rises into its frame
  float rv = uReveal * 1.3 - 0.15;
  float wave = sin(vUv.x * 5.0 + uTime * 0.9) * 0.025 * (1.0 - uReveal);
  alpha *= 1.0 - smoothstep(rv - 0.08, rv + 0.08, vUv.y + wave);

  float zoom = uZoom + (1.0 - uReveal) * 0.22 + uHover * 0.035 * uMotion;
  uv = framed(uv, zoom);

  // a soft ripple under the pointer on hover
  vec2 asp = vec2(uSize.x / uSize.y, 1.0);
  vec2 d = (vUv - uMouse) * asp;
  float dist = length(d);
  uv += (d / max(dist, 1e-4)) / asp * sin(dist * 26.0 - uTime * 3.2) * 0.0045 * uHover * uMotion * smoothstep(0.5, 0.0, dist);

  // colour split from scroll speed
  float k = clamp(uVel, -60.0, 60.0) * 0.00035 * uMotion;
  vec3 col;
  if (abs(k) > 0.0002) {
    col = vec3(base(uv + vec2(0.0, k)).r, base(uv).g, base(uv - vec2(0.0, k)).b);
  } else {
    col = base(uv);
  }

  // structure: everywhere in Structure mode, inside the lens otherwise (and the reverse)
  float inLens = 0.0;
  if (uLensOn > 0.5 && uLens.z > 0.5) {
    float dl = distance(gl_FragCoord.xy, uLens.xy);
    inLens = 1.0 - smoothstep(uLens.z - 1.5, uLens.z, dl);
  }
  float s = mix(inLens, 1.0 - inLens, uStructure);
  if (s > 0.001) {
    float e = smoothstep(0.08, 0.42, edges(uv, zoom));
    vec2 g = mod(px, 24.0);
    float grid = (1.0 - step(1.0, min(g.x, g.y))) * 0.12;
    vec3 blueprint = mix(uBlue, vec3(1.0), clamp(e * 0.95 + grid, 0.0, 1.0));
    col = mix(col, blueprint, s);
  }

  gl_FragColor = vec4(col, alpha * uAlpha * uPage);
}
`;

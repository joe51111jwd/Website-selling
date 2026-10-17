// Two full-screen passes.
//
// SCENE draws what sits behind the glass: near-black, lit by slow folds of ember light (like silk
// with light passing through it), plus the hero headline, so the droplets bend real letters. It
// renders into a mipmapped texture.
//
// DROPS draws that texture to the screen with the liquid glass on top: a handful of droplets whose
// outlines melt together (a smooth minimum of circles), each a dome of glass. Light through them
// bends by Snell's law, separately for red, green and blue; their surfaces reflect a dark studio
// with two softboxes; they focus a little warm light onto the page beneath and cast a soft shadow.

export const MAX_DROPS = 14;

const NOISE = /* glsl */ `
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
}
float fbm(vec2 p) {
  float s = 0.0, a = 0.5;
  for (int i = 0; i < 4; i++) { s += a * noise(p); p = p * 2.03 + 17.1; a *= 0.5; }
  return s;
}
`;

export const SCENE_FRAG = /* glsl */ `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 o;

uniform vec2 uRes;          // CSS px
uniform float uTime;
uniform float uGlow;        // overall strength of the light, eased by section
uniform float uTurn;        // the light's angle, drifting with scroll
uniform vec2 uFocus;        // where the light gathers, in viewport uv
uniform sampler2D uText;
uniform vec4 uTextRect;     // the headline box on screen, CSS px
uniform float uTextOn;

${NOISE}

// black, oxblood, ember, amber, then a hot pale gold at the brightest crests
vec3 ramp(float v) {
  vec3 c = mix(vec3(0.012, 0.009, 0.008), vec3(0.17, 0.025, 0.018), smoothstep(0.0, 0.28, v));
  c = mix(c, vec3(0.52, 0.07, 0.04), smoothstep(0.22, 0.5, v));
  c = mix(c, vec3(0.86, 0.24, 0.09), smoothstep(0.45, 0.72, v));
  c = mix(c, vec3(1.0, 0.6, 0.3), smoothstep(0.68, 0.9, v));
  c = mix(c, vec3(1.0, 0.9, 0.78), smoothstep(0.88, 1.0, v));
  return c;
}

void main() {
  vec2 px = vec2(vUv.x, 1.0 - vUv.y) * uRes;
  vec2 p = px / uRes.y;
  float t = uTime;

  // silk: long folds, warped slowly, with thin bright crests where the cloth turns to the light
  float ca = cos(uTurn), sa = sin(uTurn);
  vec2 q = mat2(ca, -sa, sa, ca) * (p - vec2(0.5 * uRes.x / uRes.y, 0.5));
  q += 0.28 * vec2(fbm(q * 1.1 + vec2(0.0, t * 0.018)), fbm(q * 1.1 + vec2(5.2, -t * 0.015))) - 0.14;
  float a = q.y * 3.0 + 0.9 * sin(q.x * 1.5 + t * 0.045) + 0.45 * sin(q.x * 3.1 - t * 0.03 + 1.7);
  float fold = 0.5 + 0.5 * sin(a * 2.0);
  float crest = pow(fold, 9.0);
  float sheen = pow(0.5 + 0.5 * sin(a * 2.0 + 0.5), 60.0);
  // a second, slower layer of cloth further back
  float b2 = q.y * 1.6 - q.x * 0.7 + 0.6 * sin(q.x * 0.9 - t * 0.02 + 0.4);
  float back = pow(0.5 + 0.5 * sin(b2 * 2.4), 3.0);
  float v = fold * 0.22 + crest * 0.42 + sheen * 0.4 + back * 0.18;

  // the light gathers in one region and falls away into black around it
  vec2 f = (vUv - uFocus) * vec2(uRes.x / uRes.y, 1.0);
  float env = exp(-dot(f, f) * 1.5);
  v *= env * uGlow;
  v += env * uGlow * 0.06;

  vec3 col = ramp(clamp(v, 0.0, 1.0));
  // film grain, very fine
  col += (hash(px + fract(t) * 91.0) - 0.5) * 0.012;

  // the headline, set into the scene so the glass can bend it
  if (uTextOn > 0.0) {
    vec2 tuv = (px - uTextRect.xy) / uTextRect.zw;
    if (tuv.x >= 0.0 && tuv.y >= 0.0 && tuv.x <= 1.0 && tuv.y <= 1.0) {
      vec4 tx = texture(uText, tuv);
      col = mix(col, tx.rgb, tx.a * uTextOn);
    }
  }

  o = vec4(max(col, 0.0), 1.0);
}`;

export const DROPS_FRAG = /* glsl */ `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 o;

uniform sampler2D uScene;
uniform vec2 uRes;
uniform float uDpr;
uniform int uCount;
uniform vec4 uDrop[${MAX_DROPS}];   // x, y, radius, stretch
uniform vec2 uDir[${MAX_DROPS}];    // direction of travel, for the stretch
uniform float uK;                   // how far apart droplets start to melt together, px
uniform vec2 uLight;                // cursor, CSS px

vec3 scene(vec2 p, float lod) {
  return textureLod(uScene, vec2(p.x / uRes.x, 1.0 - p.y / uRes.y), lod).rgb;
}

float smin(float a, float b, float k) {
  float h = max(k - abs(a - b), 0.0) / k;
  return min(a, b) - h * h * k * 0.25;
}

// the merged outline, and the radius of the droplet that dominates here
float field(vec2 p, out float rad) {
  float d = 1e5;
  float wsum = 0.0;
  float rsum = 0.0;
  for (int i = 0; i < ${MAX_DROPS}; i++) {
    if (i >= uCount) break;
    vec4 b = uDrop[i];
    if (b.z < 0.5) continue;
    vec2 q = p - b.xy;
    // stretch along the direction of travel, a little thinner across it
    vec2 dir = uDir[i];
    float along = dot(q, dir);
    float across = dot(q, vec2(-dir.y, dir.x));
    vec2 e = vec2(along / (1.0 + b.w), across * (1.0 + b.w * 0.45));
    float di = length(e) - b.z;
    d = smin(d, di, uK);
    float w = exp(-max(di, 0.0) / 30.0) + exp(-di * di / (b.z * b.z));
    wsum += w;
    rsum += w * b.z;
  }
  rad = rsum / max(wsum, 1e-4);
  return d;
}

void main() {
  vec2 p = vec2(vUv.x, 1.0 - vUv.y) * uRes;
  vec3 under = scene(p, 0.0);

  float rad;
  float d = field(p, rad);

  // outside: a soft shadow and a little light focused through the glass, down and to the right
  if (d > 0.0) {
    float r2;
    float ds = field(p - vec2(rad * 0.18, rad * 0.32), r2);
    float shadow = 1.0 - smoothstep(-rad * 0.2, rad * 0.55, ds);
    vec3 col = under * (1.0 - 0.35 * shadow);
    float focus = exp(-pow((ds + rad * 0.35) / (rad * 0.22), 2.0));
    col += vec3(1.0, 0.7, 0.42) * focus * 0.22 * smoothstep(0.0, 1.0, rad / 40.0);
    o = vec4(col, 1.0);
    return;
  }

  // inside: a dome of glass. Its slope comes from the outline's gradient and a round profile
  float e = 1.0;
  float r1;
  vec2 g = vec2(field(p + vec2(e, 0.0), r1) - field(p - vec2(e, 0.0), r1),
                field(p + vec2(0.0, e), r1) - field(p - vec2(0.0, e), r1));
  vec2 n = normalize(g + 1e-6);
  float s = -d;
  float bevel = rad * 0.92;
  float t = clamp(s / bevel, 0.0, 1.0);
  float u = 1.0 - t;
  float h = sqrt(max(1.0 - u * u, 0.0));
  float slope = min(u / max(h, 0.06), 6.0) * 0.85;
  vec3 N = normalize(vec3(n * slope, 1.0));

  vec3 I = vec3(0.0, 0.0, -1.0);
  float thick = rad * 0.9 * (h + 0.15);
  vec3 rr = refract(I, N, 1.0 / 1.31);
  vec3 rg = refract(I, N, 1.0 / 1.335);
  vec3 rb = refract(I, N, 1.0 / 1.36);
  vec2 oR = rr.xy / max(-rr.z, 0.2) * thick;
  vec2 oG = rg.xy / max(-rg.z, 0.2) * thick;
  vec2 oB = rb.xy / max(-rb.z, 0.2) * thick;
  vec3 col = vec3(scene(p + oR, 0.0).r, scene(p + oG, 0.0).g, scene(p + oB, 0.0).b);

  // water is clear but the drop's body lifts the light a touch
  col = col * 1.04 + 0.006;

  // reflections: a dark studio with a broad softbox up and to the left and a strip light on the right
  vec3 R = reflect(I, N);
  vec2 sp = R.xy / (1.0 + max(R.z, -0.9));
  float box = smoothstep(0.1, 0.0, max(abs(sp.x + 0.42) - 0.22, abs(sp.y + 0.5) - 0.11));
  float strip = smoothstep(0.05, 0.0, max(abs(sp.x - 0.62) - 0.035, abs(sp.y - 0.05) - 0.3));
  vec3 env = vec3(0.025, 0.02, 0.02) + vec3(1.0, 0.97, 0.94) * box * 1.3 + vec3(1.0, 0.88, 0.8) * strip * 0.7;
  float F = 0.02 + 0.98 * pow(1.0 - N.z, 5.0);
  col = mix(col, env, clamp(F * 1.2, 0.0, 1.0));
  // the softbox also shows directly as a crisp highlight where the surface faces it
  col += vec3(1.0, 0.97, 0.94) * box * smoothstep(0.02, 0.35, 1.0 - N.z) * 0.85;

  // a light that follows the cursor glints on the rim
  vec3 L = normalize(vec3(uLight - p, 260.0));
  col += vec3(1.0, 0.92, 0.86) * pow(max(dot(N, normalize(L + vec3(0.0, 0.0, 1.0))), 0.0), 160.0) * 0.9;

  // the very edge: a thin dark line where light can't get through, then light caught in the rim,
  // brightest on the side facing the softbox
  float facing = 0.5 + 0.5 * dot(n, normalize(vec2(-0.55, -0.83)));
  col *= 1.0 - 0.3 * exp(-s * 1.1);
  col += vec3(1.0, 0.92, 0.85) * exp(-pow((s - 2.0) * 0.75, 2.0)) * (0.1 + 0.45 * facing * facing);
  // and a soft glow along the inside of the far rim, where light gathers after passing through
  col += vec3(1.0, 0.75, 0.55) * smoothstep(0.55, 0.0, t) * (1.0 - facing) * 0.12;

  float cover = clamp(s * uDpr + 0.5, 0.0, 1.0);
  o = vec4(mix(under, col, cover), 1.0);
}`;

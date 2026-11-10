/* caustics — light refracted through glass + liquid, cast on the floor under the bottles.
   Physically motivated and analytic: a travelling-wave surface h(x) bends light by its gradient,
   x -> x + c * grad h. Light piles up where that map folds, i.e. where det(I + c * Hess h) -> 0,
   so floor brightness ~ 1 / |det J|. Those singular curves are the real caustic lines.
   Amber and cobalt use slightly different c (dispersion), so the lines split into warm/cool fringes.
   Kept very low contrast: this sits behind type on an ink section. */

export const CAUSTICS_FRAG = /* glsl */ `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 fragColor;

uniform vec2  uRes;
uniform float uTime;
uniform float uTheme;      // 0 ink .. 1 bone
uniform float uIntensity;  // 1 = default

const vec3 INK_SRGB  = vec3(0.0431, 0.0431, 0.0588);
const vec3 BONE_SRGB = vec3(0.937, 0.922, 0.890);
const vec3 AMBER  = vec3(1.0, 0.60, 0.20);
const vec3 COBALT = vec3(0.17, 0.23, 1.0);

// accumulate the Hessian (xx, yy, xy) of a sum of travelling sine waves
void wave(vec2 p, vec2 dir, float k, float a, float ph, inout vec3 H) {
  vec2 kv = normalize(dir) * k;
  float s = a * sin(dot(kv, p) + ph);
  H -= s * vec3(kv.x * kv.x, kv.y * kv.y, kv.x * kv.y);
}

vec3 hessian(vec2 p, float t) {
  vec3 H = vec3(0.0);
  wave(p, vec2( 1.0,  0.3), 1.00, 0.60, t * 0.90, H);
  wave(p, vec2(-0.4,  1.0), 1.30, 0.42, t * 1.10 + 1.3, H);
  wave(p, vec2( 0.7, -0.8), 1.70, 0.28, -t * 0.80 + 2.1, H);
  wave(p, vec2(-1.0, -0.2), 2.30, 0.17, t * 1.30 + 4.0, H);
  wave(p, vec2( 0.2,  1.0), 2.90, 0.11, -t * 1.50 + 0.7, H);
  return H;
}

float focus(vec3 H, float c) {
  float det = (1.0 + c * H.x) * (1.0 + c * H.y) - c * c * H.z * H.z;
  float e = 0.06;
  return e / (abs(det) + e);          // 1 on the caustic fold, ~e far from it
}

void main() {
  vec2 fc = gl_FragCoord.xy;
  vec2 p = (fc - 0.5 * uRes) / uRes.y;
  // floor perspective: squash vertically, denser toward the top (further away)
  vec2 fp = vec2(p.x / (1.3 - p.y * 0.55), (p.y + 0.15 * p.y * p.y) * 1.7) * 7.5;
  float t = uTime;

  vec3 H = hessian(fp, t);
  float cA = focus(H, 1.45);
  float cB = focus(H, 1.62);
  // second, slower and larger layer (another bottle further away)
  vec3 H2 = hessian(fp * 0.55 + vec2(11.0, 3.0), t * 0.7 + 5.0);
  cA = max(cA, focus(H2, 1.5) * 0.6);
  cB = max(cB, focus(H2, 1.7) * 0.6);
  cA = cA * cA; cB = cB * cB;

  // light pools — as if from the bottle lineup above (amber spirits either side, cobalt between)
  float poolA = exp(-dot((p - vec2(-0.48, 0.06)) * vec2(0.9, 1.5), (p - vec2(-0.48, 0.06)) * vec2(0.9, 1.5)) * 3.0)
              + exp(-dot((p - vec2(0.55, -0.02)) * vec2(0.9, 1.5), (p - vec2(0.55, -0.02)) * vec2(0.9, 1.5)) * 3.2);
  float poolB = exp(-dot((p - vec2(0.04, 0.10)) * vec2(0.75, 1.4), (p - vec2(0.04, 0.10)) * vec2(0.75, 1.4)) * 2.6);

  vec3 light = AMBER * cA * (0.30 + 1.1 * poolA) + COBALT * cB * (0.30 + 1.1 * poolB);
  light += AMBER * poolA * 0.06 + COBALT * poolB * 0.07;

  float vig = smoothstep(1.2, 0.2, length(p * vec2(0.75, 1.15)));
  light *= vig * uIntensity;

  vec3 base = mix(INK_SRGB, BONE_SRGB, uTheme);
  // on ink: additive light; on bone: a faint warm/cool tint, as light on paper
  vec3 onInk = base + light * 0.16;
  vec3 onBone = base * (1.0 - 0.03 * (cA + cB) * vig) + light * 0.035;
  vec3 col = mix(onInk, onBone, uTheme);

  col += (fract(sin(dot(fc, vec2(12.9898, 78.233))) * 43758.5453) - 0.5) / 255.0;
  fragColor = vec4(col, 1.0);
}
`;

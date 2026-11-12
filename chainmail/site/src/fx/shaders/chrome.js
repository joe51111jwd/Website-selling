/* chrome — liquid-chrome chainmail.
   European 4-in-1 weave, rendered in Blender as real tori (blender/scenes/fx_chainmail_tile.py) and baked
   into one seamless RGBA tile: shading normal (rg), ambient occlusion of links + floor (b), wire coverage (a).
   The shader does the rest per pixel:
   - the sheet is a plane seen through a pitched perspective camera (1 ray/plane hit)
   - cloth undulation, cursor bulge and ripples bend the plane (macro normal) and warp the tile lookup
   - the baked micro-normal is rotated into the macro frame, so folds swing whole regions through the lights
   - polished chrome BRDF (Schlick fresnel on chrome F0) over a procedural studio environment:
     ink cyclorama, bone overhead softbox, bone strip (+ halo), front bounce, cobalt kicker, horizon line
     (bone theme: white sweep with black flags, same cobalt kicker)
   - mipmapped tile = free distance LOD and anti-aliasing; every ring is drawn closed, with true over/under
   Cost: 1 texture fetch + 1 environment lookup (1 atan) per pixel. */

export const CHROME_FRAG = /* glsl */ `#version 300 es
precision highp float;

in vec2 vUv;
out vec4 fragColor;

uniform vec2  uRes;
uniform float uTime;
uniform vec3  uCam;          // pitch (rad), focal, distance
uniform float uScale;        // plane units -> link units
uniform vec3  uPointer;      // link-space xy, bulge amplitude
uniform vec4  uRipples[6];   // link-space xy, age (s), amplitude
uniform int   uRippleCount;  // 0 = skip the loop
uniform float uScroll;       // 0..1 hero scroll progress -> light tilt
uniform float uTheme;        // 0 ink .. 1 bone
uniform vec2  uVignette;     // inner, outer (in normalised radius)
uniform float uDim;          // 0..1 extra fade toward the section colour (legibility under type)
uniform sampler2D uTile;     // baked weave: normal.xy*0.5+0.5, ao, coverage
uniform vec2  uTileSize;     // tile size in link units
uniform float uReveal;       // 0..1 fade-in once the tile has loaded

// ---------------------------------------------------------------- palette (linear)
const vec3 INK    = vec3(0.0033, 0.0033, 0.0048);
const vec3 GRAPH  = vec3(0.0232, 0.0232, 0.0302);
const vec3 BONE   = vec3(0.863, 0.831, 0.768);
const vec3 COBALT = vec3(0.0242, 0.0437, 1.0);
const vec3 CHROME = vec3(0.584, 0.604, 0.651);
const vec3 INK_SRGB  = vec3(0.0431, 0.0431, 0.0588);
const vec3 BONE_SRGB = vec3(0.937, 0.922, 0.890);

const float PI  = 3.14159265;
const float FOLD = 0.6;     // cloth fold amplitude: calm drape, not a stormy sea

// ---------------------------------------------------------------- macro surface (cloth)
// returns height (link units) and gradient
vec3 swell(vec2 p, vec2 d, float k, float a, float ph) {
  float s = dot(p, d) * k + ph;
  return vec3(a * sin(s), a * k * cos(s) * d);
}
vec3 cloth(vec2 p, float t) {
  vec3 h = vec3(0.0);
  h += swell(p, normalize(vec2( 0.83, 0.55)), 0.150, 1.70, t * 0.42);
  h += swell(p, normalize(vec2(-0.40, 0.92)), 0.210, 0.95, -t * 0.35 + 1.7);
  h += swell(p, normalize(vec2( 0.97,-0.26)), 0.300, 0.42, t * 0.61 + 4.1);
  // slow travelling fold: a sharper crest moving diagonally
  float s = dot(p, normalize(vec2(0.6, 0.8))) * 0.085 - t * 0.22;
  float c = sin(s);
  h += vec3(2.0 * c * c * c, 2.0 * 3.0 * c * c * cos(s) * 0.085 * normalize(vec2(0.6, 0.8)));
  return h * FOLD;
}

vec3 pointerField(vec2 p, float t) {
  vec3 h = vec3(0.0);
  // soft bulge under the cursor (inertial amplitude driven from JS)
  vec2 d = p - uPointer.xy;
  float sig = 5.5;
  float g = exp(-dot(d, d) / (sig * sig));
  h += vec3(uPointer.z * g, uPointer.z * g * (-2.0 / (sig * sig)) * d);
  // expanding ripples
  for (int i = 0; i < 6; i++) {
    if (i >= uRippleCount) break;
    vec4 r = uRipples[i];
    if (r.w <= 0.0) continue;
    vec2 dd = p - r.xy;
    float dist = length(dd) + 1e-4;
    float front = r.z * 7.5;                  // speed (link units / s)
    float x = dist - front;
    float envl = exp(-x * x / 10.0) * exp(-r.z * 0.9) * r.w * smoothstep(0.0, 0.25, r.z);
    float k = 0.95;
    float w = sin(x * k);
    h.x += envl * w;
    // derivative wrt dist (envelope + wave), along radial dir
    float dEnv = envl * (-2.0 * x / 10.0);
    float dh = dEnv * w + envl * k * cos(x * k);
    h.yz += dh * dd / dist;
  }
  return h;
}

// ---------------------------------------------------------------- studio environment
float box(vec3 R, vec3 L, vec3 T, vec2 size, float soft) {
  float f = dot(R, L);
  if (f <= 0.0) return 0.0;
  vec3 B = cross(L, T);
  vec2 uv = vec2(dot(R, T), dot(R, B)) / f;  // gnomonic projection: rectangular lights stay rectangular
  vec2 e = smoothstep(size, size - soft, abs(uv));
  return e.x * e.y;
}

vec3 rotZ(vec3 v, float a) { float c = cos(a), s = sin(a); return vec3(c * v.x - s * v.y, s * v.x + c * v.y, v.z); }
vec3 rotX(vec3 v, float a) { float c = cos(a), s = sin(a); return vec3(v.x, c * v.y - s * v.z, s * v.y + c * v.z); }

vec3 L(vec3 v) { return normalize(v); }
vec3 Tz(vec3 l) { return normalize(cross(l, vec3(0.0, 0.0, 1.0))); }

// ink studio: dark cyclorama, bone softboxes, cobalt kicker
vec3 envInk(vec3 R) {
  float up = R.z;
  vec3 col = mix(INK * 0.5, GRAPH * 1.2, smoothstep(-0.30, 0.20, up));
  col = mix(col, vec3(0.085, 0.085, 0.095), smoothstep(0.25, 0.98, up));
  // broad overhead wash from upper-left: as the cloth folds, whole regions swing in and out of it
  float wash = smoothstep(0.35, 1.0, dot(R, L(vec3(-0.55, 0.35, 0.76))));
  col += BONE * 0.24 * wash * wash;
  // horizon seam: thin bright line — the signature edge of polished chrome
  col += BONE * 0.55 * exp(-pow((up - 0.06) * 18.0, 2.0));
  // key: big bone softbox overhead, upper-left
  vec3 L1 = L(vec3(-0.45, 0.30, 0.84));
  col += BONE * (4.2 * box(R, L1, Tz(L1), vec2(0.55, 0.32), 0.14));
  col += BONE * 0.28 * box(R, L1, Tz(L1), vec2(1.3, 1.0), 1.1);
  // second overhead panel, right — gives every link top a broken, two-part highlight
  vec3 L5 = L(vec3(0.42, -0.10, 0.90));
  col += vec3(0.93, 0.94, 1.0) * (1.9 * box(R, L5, Tz(L5), vec2(0.22, 0.42), 0.08));
  // strip light, right side, tall and thin
  vec3 L2 = L(vec3(0.88, 0.18, 0.40));
  col += vec3(0.92, 0.94, 1.0) * (3.2 * box(R, L2, Tz(L2), vec2(0.07, 0.9), 0.03));
  // its diffusion halo: the right flank of every leaning ring looks straight at this, so the ring closes
  // instead of fading out as a left-lit crescent
  col += vec3(0.92, 0.94, 1.0) * (0.30 * box(R, L2, Tz(L2), vec2(0.50, 1.0), 0.45));
  // cobalt kicker from behind / low — the accent glints along link rims
  vec3 L3 = L(vec3(0.10, 0.94, 0.30));
  col += COBALT * (2.6 * box(R, L3, Tz(L3), vec2(0.95, 0.25), 0.30));
  col += COBALT * 0.30 * box(R, L3, Tz(L3), vec2(2.0, 0.9), 1.5);
  // surround: a ring of soft vertical cards all the way round the set. The flanks of a leaning link face
  // sideways, so without these they reflect bare cyclorama and every ring reads as a half-lit crescent.
  float az = atan(R.y, R.x);
  float band = smoothstep(-0.12, 0.10, up) * smoothstep(0.62, 0.30, up);
  float cards = pow(0.5 + 0.5 * cos(az * 5.0 + 0.6), 6.0);
  col += vec3(0.80, 0.82, 0.88) * (0.10 * band * (0.25 + cards));
  // fill card front-left (keeps the shadow side from going dead)
  vec3 L4 = L(vec3(-0.75, -0.55, 0.36));
  col += BONE * 0.9 * box(R, L4, Tz(L4), vec2(0.34, 0.20), 0.20);
  // front bounce: a broad, dim card above and behind the camera. The camera-facing (lower) arc of every
  // ring reflects this part of the studio; without it that arc falls dark and the rings read as crescents
  vec3 L6 = L(vec3(-0.10, -0.80, 0.60));
  col += BONE * 0.35 * box(R, L6, Tz(L6), vec2(1.2, 0.55), 0.6);
  return col;
}

// bone studio: white sweep, black flags for definition, same cobalt kicker
vec3 envBone(vec3 R) {
  float up = R.z;
  vec3 col = mix(BONE * 0.10, BONE * 0.55, smoothstep(-0.35, 0.15, up));
  col = mix(col, BONE * 0.95, smoothstep(0.15, 0.95, up));
  col += BONE * 0.8 * exp(-pow((up - 0.05) * 16.0, 2.0));
  vec3 L1 = L(vec3(-0.45, 0.30, 0.84));
  col += BONE * 2.2 * box(R, L1, Tz(L1), vec2(0.55, 0.32), 0.14);
  // black flags: chrome on white is defined by what it reflects that is NOT white
  vec3 F1 = L(vec3(0.80, 0.25, 0.45));
  col *= 1.0 - 0.92 * box(R, F1, Tz(F1), vec2(0.16, 1.0), 0.06);
  vec3 F2 = L(vec3(-0.70, -0.45, 0.50));
  col *= 1.0 - 0.85 * box(R, F2, Tz(F2), vec2(0.45, 0.12), 0.08);
  vec3 F3 = L(vec3(0.15, -0.35, 0.92));
  col *= 1.0 - 0.55 * box(R, F3, Tz(F3), vec2(0.10, 0.50), 0.05);
  vec3 L3 = L(vec3(0.10, 0.94, 0.30));
  col = mix(col, COBALT * 1.6, 0.85 * box(R, L3, Tz(L3), vec2(0.95, 0.20), 0.25));
  return col;
}

vec3 env(vec3 R) {
  // scroll tilts the whole studio a little (light sweeps across the mail)
  R = rotX(rotZ(R, -0.35 + uScroll * 0.9), -uScroll * 0.30);
  vec3 c = vec3(0.0);
  if (uTheme < 0.999) c = envInk(R);
  if (uTheme > 0.001) c = mix(c, envBone(R), uTheme);
  return c;
}

vec3 dither(vec2 fc) {
  return vec3(fract(sin(dot(fc, vec2(12.9898, 78.233))) * 43758.5453) - 0.5) / 255.0;
}

void main() {
  vec2 fc = gl_FragCoord.xy;
  vec2 q = (fc - 0.5 * uRes) / uRes.y * 2.0;

  // ---- camera / plane hit
  float a = uCam.x, focal = uCam.y, dist = uCam.z;
  vec3 ro = vec3(0.0, -dist * sin(a), dist * cos(a));
  vec3 fw = vec3(0.0, sin(a), -cos(a));
  vec3 rt = vec3(1.0, 0.0, 0.0);
  vec3 upv = vec3(0.0, cos(a), sin(a));
  vec3 rd = normalize(fw * focal + q.x * rt + q.y * upv);
  float t = -ro.z / rd.z;
  vec3 P = ro + rd * t;
  vec2 p = P.xy * uScale;
  vec3 V = -rd;

  float time = uTime;

  // ---- vignette to section colour so the rendered kit sits on top. Computed first: pixels it fades to
  //      (almost) nothing skip the shading (~20% of a hero canvas, more with data-fx-dim)
  float aspect = uRes.x / uRes.y;
  vec2 vn = (vUv - 0.5) * 2.0;
  float rv = length(vn * vec2(1.0, 1.0 + 0.15 * aspect) * vec2(0.92, 1.0));
  float vig = smoothstep(uVignette.y, uVignette.x, rv);
  // fade the far (top) distance and the bottom edge harder
  vig *= smoothstep(1.0, 0.62, vUv.y) * smoothstep(0.0, 0.22, vUv.y);
  vec3 edge = mix(INK_SRGB, BONE_SRGB, uTheme);
  float wgt = vig * (1.0 - uDim) * uReveal;

  // ---- macro surface
  vec3 Mc = cloth(p, time);
  vec3 Mp = pointerField(p, time);
  vec3 M = Mc + Mp;
  // folds compress / stretch the mail a touch (domain warp along the slope); ripples mostly bend light
  vec2 pw = p + Mc.yz * 0.4 + Mp.yz * 0.12;

  // ---- baked weave (texture fetch before any branch: implicit-LOD derivatives need uniform control flow)
  vec4 tile = texture(uTile, pw / uTileSize);
  if (wgt < 0.01) { fragColor = vec4(edge + dither(fc), 1.0); return; }
  vec2 nxy = tile.rg * 2.0 - 1.0;
  vec3 n = normalize(vec3(nxy, sqrt(max(1.0 - dot(nxy, nxy), 0.0)) + 1e-3));
  float cov = tile.a;
  // baked AO, remapped: crossings and the wire passing under its neighbours sit darker for depth,
  // but the under-arc of every ring stays readable
  float ao = mix(0.36, 1.0, tile.b);

  // ---- shade: macro frame from the cloth field, micro normal from the tile
  vec3 Nm = normalize(vec3(-M.yz, 1.0));
  vec3 Tm = normalize(vec3(1.0, 0.0, M.y));
  vec3 Bm = normalize(cross(Nm, Tm));
  Tm = cross(Bm, Nm);
  vec3 N = normalize(Tm * n.x + Bm * n.y + Nm * n.z);
  vec3 F0 = CHROME * 0.96;
  float ndv = clamp(dot(N, V), 0.0, 1.0);
  vec3 F = F0 + (1.0 - F0) * pow(1.0 - ndv, 5.0);
  vec3 wire = env(reflect(-V, N)) * F * ao;
  // gap: dark floor with a faint cobalt bounce, shadowed by the links around it (baked AO)
  vec3 gap = mix(INK * 0.5 + COBALT * 0.010, BONE * 0.22, uTheme) * tile.b;
  vec3 col = mix(gap, wire, cov);

  // ---- tone map (filmic-ish, keeps chrome highlights from clipping flat)
  col *= 1.05;
  col = (col * (2.51 * col + 0.03)) / (col * (2.43 * col + 0.59) + 0.14);
  col = pow(clamp(col, 0.0, 1.0), vec3(1.0 / 2.2));

  // ---- vignette (weight computed above)
  col = mix(edge, col, wgt);

  col += dither(fc);
  fragColor = vec4(col, 1.0);
}
`;

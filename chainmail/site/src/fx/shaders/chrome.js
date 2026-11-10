/* chrome — liquid-chrome chainmail.
   European 4-in-1 weave evaluated analytically per pixel (no raymarch):
   - the sheet is a plane seen through a pitched perspective camera (1 ray/plane hit)
   - rows of tilted torus links; alternate rows lean the opposite way and sit half a pitch over,
     so every link threads through two links in the row above and two below
   - each link's height/normal comes from the nearest point on its tilted centreline; the visible
     surface is the top-most of the 3x3 neighbouring links (2-layer composite for AA)
   - contact shadows from links lying over the visible one, cavity AO by depth
   - polished chrome BRDF (Schlick fresnel on chrome F0) over a procedural studio environment:
     ink cyclorama, bone overhead softbox, bone strip, cobalt kicker, horizon line
     (bone theme: white sweep with black flags, same cobalt kicker)
   - cloth undulation, cursor bulge and ripples perturb the macro surface normal
   Cost: 9 link evaluations (atan + 2 Newton steps each) + 1-2 environment lookups per pixel. */

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

// ---------------------------------------------------------------- palette (linear)
const vec3 INK    = vec3(0.0033, 0.0033, 0.0048);
const vec3 GRAPH  = vec3(0.0232, 0.0232, 0.0302);
const vec3 BONE   = vec3(0.863, 0.831, 0.768);
const vec3 COBALT = vec3(0.0242, 0.0437, 1.0);
const vec3 CHROME = vec3(0.584, 0.604, 0.651);
const vec3 INK_SRGB  = vec3(0.0431, 0.0431, 0.0588);
const vec3 BONE_SRGB = vec3(0.937, 0.922, 0.890);

// ---------------------------------------------------------------- weave geometry (link units)
const float RR  = 1.0;     // centreline radius
const float RW  = 0.18;    // wire radius (aspect ratio ~4.6, like real 4-in-1)
const float TH  = 0.80;    // lean angle (rad)
const float PSI = 0.20;    // lean-axis yaw, alternating per row -> herringbone
const float SX  = 1.10;    // pitch along a row
const float SY  = 1.20;    // row pitch
// (TH, PSI, SX, SY) were solved offline so every link threads exactly its two upper and two lower
// neighbours with 0.41 centreline clearance (> 2 * RW): the top-most-surface max() never sees
// interpenetrating wires, so there are no intersection seams.
const float PI  = 3.14159265;

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
  return h;
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
  col += BONE * 0.30 * wash * wash;
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
  // cobalt kicker from behind / low — the accent glints along link rims
  vec3 L3 = L(vec3(0.10, 0.94, 0.30));
  col += COBALT * (2.6 * box(R, L3, Tz(L3), vec2(0.95, 0.25), 0.30));
  col += COBALT * 0.30 * box(R, L3, Tz(L3), vec2(2.0, 0.9), 1.5);
  // fill card front-left (keeps the shadow side from going dead)
  vec3 L4 = L(vec3(-0.75, -0.55, 0.36));
  col += BONE * 0.9 * box(R, L4, Tz(L4), vec2(0.34, 0.20), 0.20);
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

// ---------------------------------------------------------------- weave
// evaluate one leaning torus link centred at c (lean sign s) at point p
void link(vec2 p, vec2 c, float s, out float d, out float hc, out vec3 nrm, out float hs) {
  vec2 q0 = p - c;
  float cy = cos(PSI * s), sy = sin(PSI * s);
  vec2 q = vec2(cy * q0.x + sy * q0.y, -sy * q0.x + cy * q0.y);
  float ct = cos(TH), st = sin(TH);
  // nearest point on the projected (elliptical) centreline: atan seed + 2 safeguarded Newton steps
  float phi = atan(q.y, q.x / ct);
  for (int i = 0; i < 2; i++) {
    vec2 e = vec2(RR * ct * cos(phi), RR * sin(phi));
    vec2 de = vec2(-RR * ct * sin(phi), RR * cos(phi));
    vec2 r = e - q;
    float g = dot(de, de);
    phi -= clamp(dot(r, de) / max(g - dot(r, e), 0.25 * g), -0.5, 0.5);
  }
  vec2 C = vec2(RR * ct * cos(phi), RR * sin(phi));
  hc = s * RR * st * cos(phi);
  vec2 dq = q - C;
  d = length(dq);
  float z = sqrt(max(RW * RW - d * d, 0.0));
  hs = hc + z;
  // tube normal: from centreline point to surface point. tilt the cross-section with the
  // centreline slope so the rim highlight rolls correctly over the lean.
  vec3 tang = normalize(vec3(-RR * ct * sin(phi), RR * cos(phi), -s * RR * st * sin(phi)));
  vec3 rad = vec3(dq, z);
  rad -= tang * dot(rad, tang);
  nrm = normalize(rad + vec3(0.0, 0.0, 1e-4));
  nrm.xy = vec2(cy * nrm.x - sy * nrm.y, sy * nrm.x + cy * nrm.y);
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

  // ---- macro surface
  vec3 Mc = cloth(p, time);
  vec3 Mp = pointerField(p, time);
  vec3 M = Mc + Mp;
  // folds compress / stretch the mail a touch (domain warp along the slope); ripples mostly bend light
  vec2 pw = p + Mc.yz * 0.4 + Mp.yz * 0.12;

  // ---- pixel footprint in link units (for AA + distance LOD)
  float fwp = length(fwidth(p));
  float aa = max(fwp * 0.9, 0.012);

  // ---- weave: 3 rows x 3 links around the pixel (no local arrays: everything is folded into
  //      running maxima so the loop stays register-only on every driver)
  float row = floor(pw.y / SY + 0.5);
  float h1 = -1e3, h2 = -1e3, c1 = 0.0, c2 = 0.0;
  vec3 n1 = vec3(0, 0, 1), n2 = vec3(0, 0, 1);
  float id1 = -1.0, id2 = -1.0;          // ids of the top two surfaces
  float sp1 = -1e3, sp2 = -1e3;          // top two shadow potentials
  float spId1 = -2.0;
  float occF = 0.0;
  float base = -RR * sin(TH) - RW - 0.35;     // floor under the mail (gap)
  float id = 0.0;
  for (int j = -1; j <= 1; j++) {
    float r = row + float(j);
    float odd = mod(r, 2.0);
    float s = odd > 0.5 ? -1.0 : 1.0;
    float ox = odd * 0.5 * SX;
    float col = floor((pw.x - ox) / SX + 0.5);
    for (int i = -1; i <= 1; i++) {
      vec2 c = vec2((col + float(i)) * SX + ox, r * SY);
      vec2 dc = pw - c;
      // too far to cover, shadow or darken this pixel (RR + 4.5 RW): skip the link entirely
      if (dot(dc, dc) > 3.4) { id += 1.0; continue; }
      float d, hc, hs; vec3 nn;
      link(pw, c, s, d, hc, nn, hs);
      float cov = clamp(0.5 - (d - RW) / aa, 0.0, 1.0);
      if (cov > 0.0) {
        if (hs > h1) {
          h2 = h1; n2 = n1; c2 = c1; id2 = id1;
          h1 = hs; n1 = nn; c1 = cov; id1 = id;
        } else if (hs > h2) {
          h2 = hs; n2 = nn; c2 = cov; id2 = id;
        }
      }
      // shadow potential: how high this link's wire rises near the pixel, minus its distance
      float sp = hc + RW - (1.0 - smoothstep(RW * 3.2, RW * 0.9, d)) * 2.0;
      if (sp > sp1) { sp2 = sp1; sp1 = sp; spId1 = id; }
      else if (sp > sp2) { sp2 = sp; }
      occF += smoothstep(RW * 4.5, RW * 0.6, d) * clamp((hc + RW - base) / 1.6, 0.0, 1.0);
      id += 1.0;
    }
  }

  // ---- occlusion: links lying above the visible surface cast soft contact shadows
  float spFor1 = spId1 == id1 ? sp2 : sp1;     // exclude the visible link itself
  float spFor2 = spId1 == id2 ? sp2 : sp1;
  float occ1 = clamp((spFor1 - h1) / (RW * 2.2), 0.0, 1.0);
  float occ2 = clamp((spFor2 - h2) / (RW * 2.2), 0.0, 1.0);
  float lo = -RR * sin(TH) - RW, hi = RR * sin(TH) + RW;
  float cav1 = mix(0.62, 1.0, smoothstep(lo, hi, h1));
  float cav2 = mix(0.58, 1.0, smoothstep(lo, hi, h2));
  float ao1 = cav1 * (1.0 - 0.70 * clamp(occ1, 0.0, 1.0));
  float ao2 = cav2 * (1.0 - 0.75 * clamp(occ2, 0.0, 1.0));

  // ---- shade
  // macro normal from the cloth field; micro normal from the link
  vec3 Nm = normalize(vec3(-M.yz, 1.0));
  vec3 Tm = normalize(vec3(1.0, 0.0, M.y));
  vec3 Bm = normalize(cross(Nm, Tm));
  Tm = cross(Bm, Nm);

  vec3 F0 = CHROME * 0.96;
  vec3 colTop = vec3(0.0), colSec = vec3(0.0);
  if (c1 > 0.0) {
    vec3 N = normalize(Tm * n1.x + Bm * n1.y + Nm * n1.z);
    float ndv = clamp(dot(N, V), 0.0, 1.0);
    vec3 F = F0 + (1.0 - F0) * pow(1.0 - ndv, 5.0);
    colTop = env(reflect(-V, N)) * F * ao1;
  }
  if (c1 < 0.999 && c2 > 0.0) {   // only edge pixels / holes need the lower layer
    vec3 N = normalize(Tm * n2.x + Bm * n2.y + Nm * n2.z);
    float ndv = clamp(dot(N, V), 0.0, 1.0);
    vec3 F = F0 + (1.0 - F0) * pow(1.0 - ndv, 5.0);
    colSec = env(reflect(-V, N)) * F * ao2;
  }
  // gap: dark floor with a faint cobalt bounce, shadowed by surrounding links
  vec3 gap = mix(INK * 0.5 + COBALT * 0.010, BONE * 0.22, uTheme);
  gap *= (1.0 - 0.9 * clamp(occF, 0.0, 1.0));

  vec3 under = mix(gap, colSec, c2);
  vec3 col = mix(under, colTop, c1);

  // distance LOD: when links shrink below a few pixels, resolve to their average sheen
  float lod = smoothstep(0.16, 0.42, fwp);
  if (lod > 0.0) {
    vec3 N = Nm;
    float ndv = clamp(dot(N, V), 0.0, 1.0);
    vec3 F = F0 + (1.0 - F0) * pow(1.0 - ndv, 5.0);
    vec3 avg = env(reflect(-V, N)) * F * 0.42 + gap * 0.3;
    col = mix(col, avg, lod);
  }

  // ---- tone map (filmic-ish, keeps chrome highlights from clipping flat)
  col *= 1.05;
  col = (col * (2.51 * col + 0.03)) / (col * (2.43 * col + 0.59) + 0.14);
  col = pow(clamp(col, 0.0, 1.0), vec3(1.0 / 2.2));

  // ---- vignette to section colour so the rendered kit sits on top
  float aspect = uRes.x / uRes.y;
  vec2 vn = (vUv - 0.5) * 2.0;
  float rv = length(vn * vec2(1.0, 1.0 + 0.15 * aspect) * vec2(0.92, 1.0));
  float vig = smoothstep(uVignette.y, uVignette.x, rv);
  // fade the far (top) distance and the bottom edge harder
  vig *= smoothstep(1.0, 0.62, vUv.y) * smoothstep(0.0, 0.22, vUv.y);
  vec3 edge = mix(INK_SRGB, BONE_SRGB, uTheme);
  col = mix(edge, col, vig * (1.0 - uDim));

  col += dither(fc);
  fragColor = vec4(col, 1.0);
}
`;

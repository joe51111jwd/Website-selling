// 3D VIEW materials (brief 4.1; FIXLIST-1 F-004). Owner: A2. Lazy GL chunk only (imported by FreezeScene).
// Depth is baked per vertex on the CPU, so no depth texture is sampled. Colour is a straight passthrough
// of the still's sRGB values (NoColorSpace in, no output conversion), so the yaw-0 render matches the
// film's last frame pixel for pixel (QA H5).
//
// Two layers share the one depth mesh (A5's F-008 data: inverse depth dilated "nearer wins", hard
// one-cell steps around 07's upper body; requests/A5-fix-2.md):
//   1. the scene mesh, with an EDGE ALPHA baked per vertex: aEdge = max |z_i - z_n| / z_i over the 8 grid
//      neighbours, alpha = 1 - smoothstep(0.04, 0.08, aEdge), feathered over ~2 cells (edgeAlpha), and
//      ramped in with k; discarded below 0.01. A per-vertex measure does not change with render size or
//      DPR (the old per-pixel fwidth test did, and on the 144x256 phone mesh it threw whole cells away:
//      the stair-steps). Stretched triangles fade out and the plate behind shows through (FreezeScene
//      shows it at the still's exposure, so the gap reads as soft background, not a dark outline).
//   2. 07 itself, the mesh again with alpha = hero-matte's alpha at vUv, depth test off: the silhouette
//      keeps the matte's clean edge at every yaw, and it is what bites FAR (the same bite as the DOM's
//      CSS near-matte, so the hand-over doesn't pop).
// k = clamp((|yaw| + |pitch|) / rest, 0, 1): 0 at yaw 0 (the whole still), full at the rest pose.

import { ShaderMaterial, type Texture } from 'three';

const vertexShader = /* glsl */ `
  attribute float aAlpha;
  varying vec2 vUv;
  varying float vAlpha;
  void main() {
    vUv = uv;
    vAlpha = aAlpha;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const meshFragment = /* glsl */ `
  uniform sampler2D map;
  uniform float uK;
  varying vec2 vUv;
  varying float vAlpha;
  void main() {
    float a = mix(1.0, vAlpha, uK);
    if (a < 0.01) discard;
    gl_FragColor = vec4(texture2D(map, vUv).rgb, a);
  }
`;

const matteFragment = /* glsl */ `
  uniform sampler2D map;
  uniform sampler2D matte;
  varying vec2 vUv;
  void main() {
    float m = texture2D(matte, vUv).a;
    if (m < 0.01) discard;
    gl_FragColor = vec4(texture2D(map, vUv).rgb, m);
  }
`;

/** The scene mesh: edge alpha over the plate, depth written. */
export function createFreezeMaterial(map: Texture): ShaderMaterial {
  return new ShaderMaterial({
    uniforms: {
      map: { value: map },
      uK: { value: 0 },
    },
    vertexShader,
    fragmentShader: meshFragment,
    transparent: true,
    depthTest: true,
    depthWrite: true,
    toneMapped: false,
  });
}

/** 07's layer: the same mesh, alpha from hero-matte, drawn over FAR (no depth test). */
export function createMatteMaterial(map: Texture, matte: Texture): ShaderMaterial {
  return new ShaderMaterial({
    uniforms: {
      map: { value: map },
      matte: { value: matte },
    },
    vertexShader,
    fragmentShader: matteFragment,
    transparent: true,
    depthTest: false,
    depthWrite: false,
    toneMapped: false,
  });
}

/**
 * k = clamp((|yaw| + |pitch|) / rest, 0, 1). A stretched cell opens in proportion to the turn, so the
 * edge alpha grows with it: at yaw 0 the whole still shows, and over the swing the few-px smears of small
 * turns crossfade into the plate instead of the plate popping in at 0.5 deg.
 */
export function stretchK(yawDeg: number, pitchDeg: number, restDeg = 10.5): number {
  return Math.max(0, Math.min(1, (Math.abs(yawDeg) + Math.abs(pitchDeg)) / Math.max(0.5, restDeg)));
}

/**
 * Per-vertex alpha of the scene mesh (F-004): 1 - smoothstep(0.04, 0.08, aEdge), then FEATHERED: the min
 * of that and its Gaussian blur over the grid (sigma 1.25 cells). A cell-sized alpha step reads as a
 * stair-step where the plate shows through a stretched cell (below 07's matte cut, where there is no
 * clean matte edge); feathered over ~2 cells it reads as a soft, out-of-focus edge. Stretched vertices
 * stay at 0.
 */
export function edgeAlpha(edge: Float32Array, cols: number, rows: number): Float32Array {
  const n = cols * rows;
  const raw = new Float32Array(n);
  for (let k = 0; k < n; k++) {
    const t = Math.max(0, Math.min(1, (edge[k] - 0.04) / 0.04));
    raw[k] = 1 - t * t * (3 - 2 * t);
  }
  const R = 3;
  const sigma = 1.25;
  const w: number[] = [];
  let ws = 0;
  for (let i = -R; i <= R; i++) {
    const v = Math.exp(-(i * i) / (2 * sigma * sigma));
    w.push(v);
    ws += v;
  }
  const tmp = new Float32Array(n);
  const out = new Float32Array(n);
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      let acc = 0;
      for (let d = -R; d <= R; d++) acc += w[d + R] * raw[j * cols + Math.max(0, Math.min(cols - 1, i + d))];
      tmp[j * cols + i] = acc / ws;
    }
  }
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      let acc = 0;
      for (let d = -R; d <= R; d++) acc += w[d + R] * tmp[Math.max(0, Math.min(rows - 1, j + d)) * cols + i];
      const k = j * cols + i;
      out[k] = Math.min(raw[k], acc / ws);
    }
  }
  return out;
}

/**
 * Per-vertex edge measure for the depth grid (cols x rows of z, row-major): max |z_i - z_n| / z_i over
 * the 8 neighbours (A5-fix-2 §2.1: with 4, the diagonal steps of a silhouette keep stretched triangles).
 */
export function edgeMeasure(z: Float32Array, cols: number, rows: number): Float32Array {
  const out = new Float32Array(cols * rows);
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      const zi = z[j * cols + i];
      let m = 0;
      for (let dj = -1; dj <= 1; dj++) {
        const jj = j + dj;
        if (jj < 0 || jj >= rows) continue;
        for (let di = -1; di <= 1; di++) {
          const ii = i + di;
          if ((di === 0 && dj === 0) || ii < 0 || ii >= cols) continue;
          const d = Math.abs(zi - z[jj * cols + ii]);
          if (d > m) m = d;
        }
      }
      out[j * cols + i] = m / Math.max(zi, 1e-6);
    }
  }
  return out;
}

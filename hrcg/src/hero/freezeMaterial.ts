// 3D VIEW materials (brief 4.1; FIXLIST-1 F-004). Owner: A2. Lazy GL chunk only (imported by FreezeScene).
// Depth is baked per vertex on the CPU, so no depth texture is sampled. Colour is a straight passthrough
// of the still's sRGB values (NoColorSpace in, no output conversion), so the yaw-0 render matches the
// film's last frame pixel for pixel (QA H5).
//
// Two layers share the one depth mesh (A5's F-008 data: inverse depth dilated "nearer wins", hard
// one-cell steps around 07's upper body; requests/A5-fix-2.md):
//   1. the scene mesh, with an EDGE ALPHA: aEdge (baked per vertex) = max |z_i - z_n| / z_i over the 8
//      grid neighbours; alpha = 1 - smoothstep(0.04, 0.08, aEdge * k), discarded below 0.01. A per-vertex
//      measure does not change with render size or DPR (the old per-pixel fwidth test did, and on the
//      144x256 phone mesh it threw whole cells away: the stair-steps). Stretched triangles fade out and
//      the plate behind shows through as dim haze.
//   2. 07 itself, the mesh again with alpha = hero-matte's alpha at vUv, depth test off: the silhouette
//      keeps the matte's clean edge at every yaw, and it is what bites FAR (the same bite as the DOM's
//      CSS near-matte, so the hand-over doesn't pop).
// k = clamp((|yaw| + |pitch|) / 0.5 deg, 0, 1): off below 0.5 deg, so yaw 0 shows the whole still.

import { ShaderMaterial, type Texture } from 'three';

const vertexShader = /* glsl */ `
  attribute float aEdge;
  varying vec2 vUv;
  varying float vEdge;
  void main() {
    vUv = uv;
    vEdge = aEdge;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const meshFragment = /* glsl */ `
  uniform sampler2D map;
  uniform float uK;
  varying vec2 vUv;
  varying float vEdge;
  void main() {
    float a = 1.0 - smoothstep(0.04, 0.08, vEdge * uK);
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

/** k = clamp((|yaw| + |pitch|) / 0.5 deg, 0, 1) */
export function stretchK(yawDeg: number, pitchDeg: number): number {
  return Math.max(0, Math.min(1, (Math.abs(yawDeg) + Math.abs(pitchDeg)) / 0.5));
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

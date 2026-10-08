// 3D VIEW mesh material (brief 4.1). Owner: A2. Lazy GL chunk only (imported by FreezeScene).
// Depth is baked per vertex on the CPU, so no depth texture is sampled. Colour is a straight
// passthrough of the still's sRGB values (NoColorSpace in, no output conversion), so the yaw-0
// render matches the film's last frame pixel for pixel (QA H5).
// Stretch discard: fwidth(vZ)/vZ > 0.06, scaled by k = clamp((|yaw| + |pitch|) / 0.5 deg, 0, 1):
// off below 0.5 deg, so yaw 0 shows the whole still with no halos; slivers reveal the plate behind.

import { ShaderMaterial, type Texture } from 'three';

const vertexShader = /* glsl */ `
  varying vec2 vUv;
  varying float vZ;
  void main() {
    vUv = uv;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vZ = -mv.z;
    gl_Position = projectionMatrix * mv;
  }
`;

const fragmentShader = /* glsl */ `
  uniform sampler2D map;
  uniform float uK;
  uniform float uOpacity;
  varying vec2 vUv;
  varying float vZ;
  void main() {
    float stretch = fwidth(vZ) / max(vZ, 1e-3);
    if (uK > 0.0 && stretch * uK > 0.06) discard;
    vec4 c = texture2D(map, vUv);
    gl_FragColor = vec4(c.rgb, uOpacity);
  }
`;

export function createFreezeMaterial(map: Texture): ShaderMaterial {
  return new ShaderMaterial({
    uniforms: {
      map: { value: map },
      uK: { value: 0 },
      uOpacity: { value: 1 },
    },
    vertexShader,
    fragmentShader,
    depthTest: true,
    depthWrite: true,
    transparent: false,
    toneMapped: false,
  });
}

/** k = clamp((|yaw| + |pitch|) / 0.5 deg, 0, 1) */
export function stretchK(yawDeg: number, pitchDeg: number): number {
  return Math.max(0, Math.min(1, (Math.abs(yawDeg) + Math.abs(pitchDeg)) / 0.5));
}

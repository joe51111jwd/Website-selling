// The orange data pulse: a small bright head with a fading trail that travels along an arc
// from one screen to another (field → office). Drawn as additive points, so it costs nothing.

import * as THREE from "three";

const N = 56; // points per comet
const TRAIL = 0.3; // trail length as a fraction of the arc

const vert = /* glsl */ `
attribute float aSize;
attribute float aAlpha;
varying float vAlpha;
uniform float uScale;
void main() {
  vAlpha = aAlpha;
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  gl_PointSize = aSize * uScale / -mv.z;
  gl_Position = projectionMatrix * mv;
}
`;
const frag = /* glsl */ `
uniform vec3 uColor;
uniform vec3 uCore;
varying float vAlpha;
void main() {
  vec2 c = gl_PointCoord - 0.5;
  float d = length(c) * 2.0;
  float glow = exp(-d * d * 5.0) * (1.0 - smoothstep(0.7, 1.0, d));
  float core = smoothstep(0.34, 0.0, d);
  vec3 col = mix(uColor, uCore, core * 0.9);
  float a = clamp(glow * 0.75 + core, 0.0, 1.0) * vAlpha;
  // premultiplied, normal blending: reads as a lit orange dot on the light page and on dark grounds
  gl_FragColor = vec4(col * a, a);
}
`;

export class Comet {
  readonly points: THREE.Points;
  private pos: Float32Array;
  private size: Float32Array;
  private alpha: Float32Array;
  private mat: THREE.ShaderMaterial;
  private curve = new THREE.QuadraticBezierCurve3(new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3());
  private tmp = new THREE.Vector3();

  constructor() {
    const g = new THREE.BufferGeometry();
    this.pos = new Float32Array(N * 3);
    this.size = new Float32Array(N);
    this.alpha = new Float32Array(N);
    g.setAttribute("position", new THREE.BufferAttribute(this.pos, 3));
    g.setAttribute("aSize", new THREE.BufferAttribute(this.size, 1));
    g.setAttribute("aAlpha", new THREE.BufferAttribute(this.alpha, 1));
    this.mat = new THREE.ShaderMaterial({
      vertexShader: vert,
      fragmentShader: frag,
      // raw sRGB values: this shader writes straight to the (sRGB) output
      uniforms: { uColor: { value: new THREE.Vector3(1, 0.478, 0.004) }, uCore: { value: new THREE.Vector3(1, 0.953, 0.878) }, uScale: { value: 1 } },
      transparent: true,
      depthWrite: false,
      depthTest: false,
      blending: THREE.NormalBlending,
      premultipliedAlpha: true,
      toneMapped: false,
    });
    this.points = new THREE.Points(g, this.mat);
    this.points.frustumCulled = false;
    this.points.renderOrder = 10;
    this.points.visible = false;
  }

  /**
   * Place the comet at progress t (0..1) on the arc from a to b. `unit` is the size of one device
   * unit in world units (so the pulse scales with the devices), `pxPerWorld` the screen scale.
   */
  set(a: THREE.Vector3, b: THREE.Vector3, t: number, unit: number, pxScale: number) {
    if (t <= 0.001 || t >= 0.999) {
      this.points.visible = false;
      return;
    }
    this.points.visible = true;
    const dist = a.distanceTo(b);
    const mid = this.tmp.copy(a).add(b).multiplyScalar(0.5);
    mid.y += dist * 0.42;
    mid.z += dist * 0.35;
    this.curve.v0.copy(a);
    this.curve.v1.copy(mid);
    this.curve.v2.copy(b);
    // fade in leaving the phone, fade out landing on the laptop
    const env = Math.min(1, t / 0.12) * Math.min(1, (1 - t) / 0.1 + 0.25);
    const p = new THREE.Vector3();
    for (let i = 0; i < N; i++) {
      const f = i / (N - 1); // 0 = head
      const tt = Math.max(0, t - f * TRAIL);
      this.curve.getPoint(tt, p);
      this.pos[i * 3] = p.x;
      this.pos[i * 3 + 1] = p.y;
      this.pos[i * 3 + 2] = p.z;
      const tail = 1 - f;
      this.size[i] = unit * (i === 0 ? 0.36 : i < 3 ? 0.2 : 0.13 * tail + 0.035);
      this.alpha[i] = env * (i === 0 ? 1 : Math.pow(tail, 1.4) * 0.85);
    }
    this.mat.uniforms.uScale.value = pxScale;
    const g = this.points.geometry;
    g.attributes.position.needsUpdate = true;
    g.attributes.aSize.needsUpdate = true;
    g.attributes.aAlpha.needsUpdate = true;
  }

  hide() {
    this.points.visible = false;
  }
}

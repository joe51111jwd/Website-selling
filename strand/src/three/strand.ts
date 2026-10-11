import * as THREE from "three";
import { locate, type Toolpath } from "../lib/toolpath";
import type { Filament } from "../content/catalog";

// One bead of extruded plastic: a squashed cylinder along +X, unit length, centred.
// Every segment of a toolpath is one instance, so a whole printed cube is a single draw call.
// Small radial counts are for the page, where beads are a few pixels across: those skip the
// end caps, which overlapping neighbours hide anyway.
const beadGeometry = (radial: number) => {
  const g = new THREE.CylinderGeometry(0.5, 0.5, 1, radial, 1, radial < 8);
  g.rotateZ(-Math.PI / 2);
  return g;
};
const beads = new Map<number, THREE.BufferGeometry>();
const bead = (radial: number) => {
  if (!beads.has(radial)) beads.set(radial, beadGeometry(radial));
  return beads.get(radial)!;
};

export const HOT = new THREE.Color("#ff6a1a");

// Standard PBR material plus a per-instance "heat" that glows the freshly laid line.
export function filamentMaterial(f: Filament, opts: { glow?: number } = {}) {
  const m = new THREE.MeshStandardMaterial({ color: f.hex });
  styleMaterial(m, f, opts.glow ?? 0.25);
  const heat = { value: HOT.clone().multiplyScalar(2.4) };
  m.userData.heat = heat;
  m.onBeforeCompile = (shader) => {
    shader.uniforms.uHeatColor = heat;
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nattribute float aHeat;\nvarying float vHeat;")
      .replace("#include <begin_vertex>", "#include <begin_vertex>\nvHeat = aHeat;");
    shader.fragmentShader = shader.fragmentShader
      .replace("#include <common>", "#include <common>\nuniform vec3 uHeatColor;\nvarying float vHeat;")
      .replace("#include <emissivemap_fragment>", "#include <emissivemap_fragment>\ntotalEmissiveRadiance += uHeatColor * vHeat;");
  };
  m.customProgramCacheKey = () => "filament";
  return m;
}

export function styleMaterial(m: THREE.MeshStandardMaterial, f: Filament, glow = 0.25) {
  m.color.set(f.hex);
  if (f.finish === "silk") {
    m.roughness = 0.26;
    m.metalness = 0.62;
  } else {
    m.roughness = f.finish === "glow" ? 0.6 : 0.68;
    m.metalness = 0;
  }
  m.emissive.set(f.finish === "glow" ? "#8dff9a" : "#000000");
  m.emissiveIntensity = f.finish === "glow" ? glow : 0;
}

const _m = new THREE.Matrix4();
const _q = new THREE.Quaternion();
const _p = new THREE.Vector3();
const _s = new THREE.Vector3();
const Y = new THREE.Vector3(0, 1, 0);

export class StrandMesh {
  readonly mesh: THREE.InstancedMesh;
  readonly head = new THREE.Vector3();
  private full: Float32Array;
  private heat: THREE.InstancedBufferAttribute;
  private heated: number[] = [];
  private partial = -1;
  private p = -1;

  constructor(readonly tp: Toolpath, material: THREE.Material, radial = 7) {
    const geo = bead(radial).clone();
    this.heat = new THREE.InstancedBufferAttribute(new Float32Array(tp.count), 1);
    this.heat.setUsage(THREE.DynamicDrawUsage);
    geo.setAttribute("aHeat", this.heat);
    const mesh = new THREE.InstancedMesh(geo, material, tp.count);
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    for (let s = 0; s < tp.count; s++) {
      this.segmentMatrix(s, 1);
      mesh.setMatrixAt(s, _m);
    }
    this.full = (mesh.instanceMatrix.array as Float32Array).slice();
    mesh.computeBoundingSphere();
    mesh.frustumCulled = false;
    mesh.count = 0;
    this.mesh = mesh;
    this.head.set(tp.seg[0], tp.seg[1], tp.seg[2]);
  }

  private segmentMatrix(s: number, f: number) {
    const { seg, w, h } = this.tp;
    const o = s * 6;
    const dx = seg[o + 3] - seg[o];
    const dz = seg[o + 5] - seg[o + 2];
    const len = Math.hypot(dx, dz) * f;
    const ang = Math.atan2(-dz, dx);
    const ux = Math.cos(ang);
    const uz = -Math.sin(ang);
    // beads overlap at their ends so corners close up, the way squashed plastic does
    const ext = w * 0.45;
    _p.set(seg[o] + ux * (len / 2), seg[o + 1], seg[o + 2] + uz * (len / 2));
    _q.setFromAxisAngle(Y, ang);
    _s.set(Math.max(len + ext, 1e-4), h * 1.12, w);
    _m.compose(_p, _q, _s);
  }

  get progress() {
    return this.p;
  }

  // p: 0..1 of the piece printed. heatLen: how much freshly laid line glows (local units).
  set(p: number, heatLen = 0.35) {
    p = Math.min(1, Math.max(0, p));
    if (p === this.p) return;
    this.p = p;
    const { mesh, tp } = this;
    const arr = mesh.instanceMatrix.array as Float32Array;
    const attr = mesh.instanceMatrix;
    // three uploads the queued ranges (and clears them) only when the mesh is drawn. While
    // it's culled, ranges pile up; past a few dozen, drop them so the next draw uploads it all.
    if (attr.updateRanges.length > 48) attr.clearUpdateRanges();

    if (this.partial >= 0) {
      arr.set(this.full.subarray(this.partial * 16, this.partial * 16 + 16), this.partial * 16);
      attr.addUpdateRange(this.partial * 16, 16);
      this.partial = -1;
    }

    const { index, frac } = locate(tp, p);
    if (index < 0) {
      mesh.count = 0;
      this.head.set(tp.seg[0], tp.seg[1], tp.seg[2]);
    } else {
      mesh.count = index + 1;
      if (frac < 1) {
        this.segmentMatrix(index, Math.max(frac, 0.001));
        _m.toArray(arr, index * 16);
        attr.addUpdateRange(index * 16, 16);
        this.partial = index;
      }
      const o = index * 6;
      this.head.set(
        tp.seg[o] + (tp.seg[o + 3] - tp.seg[o]) * frac,
        tp.seg[o + 1],
        tp.seg[o + 2] + (tp.seg[o + 5] - tp.seg[o + 2]) * frac,
      );
    }
    attr.needsUpdate = true;

    // the glow trails the nozzle and cools along the line
    const h = this.heat.array as Float32Array;
    for (const i of this.heated) h[i] = 0;
    this.heated.length = 0;
    if (index >= 0 && p < 1 && heatLen > 0) {
      const headCum = (index > 0 ? tp.cum[index - 1] : 0) + (tp.cum[index] - (index > 0 ? tp.cum[index - 1] : 0)) * frac;
      for (let s = index; s >= 0; s--) {
        const d = Math.max(0, headCum - tp.cum[s]);
        if (d > heatLen) break;
        const t = 1 - d / heatLen;
        h[s] = t * t;
        this.heated.push(s);
      }
    }
    this.heat.needsUpdate = true;
  }

  dispose() {
    this.mesh.geometry.dispose();
    this.mesh.dispose();
  }
}
